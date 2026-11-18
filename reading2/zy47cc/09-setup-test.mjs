// setup check (setup audit, 2 Nov): stubbed GitHub responses, as the product's were read on 2 Nov.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { jobStart } from '../lib/job.mjs';
import { approvalsBlock } from '../lib/record.mjs';
import { CONFIRMED, READERS, loadConditions, setupCheck } from '../lib/setup.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo, write } from './helpers.mjs';

const quiet = () => {};
// The pin's shims: this checkout's own, as a product's pin would hold them.
const SHIMS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'shims');
const shim = (f) => (existsSync(join(SHIMS, f)) ? readFileSync(join(SHIMS, f), 'utf8') : null);
// Read as git show reads a file through the tool: without its last newline.
const PIN = { sha: 'p'.repeat(40), file: (f) => (f.startsWith('shims/') ? shim(f.slice(6))?.replace(/\n$/, '') ?? null : null), list: () => readdirSync(SHIMS) };
const LINES = shim('CLAUDE.process.md').replaceAll('{tranche}', 'tranche');
const HOOKS = JSON.parse(shim('settings.hooks.json')).hooks;
const DENY = [
  'Bash(git push --force *)', 'Bash(git push -f *)', 'Bash(git push --force-with-lease *)', 'Bash(git push origin --delete *)',
  'Bash(gh api *contents/*)', 'mcp__github__create_or_update_file', 'mcp__github__push_files', 'mcp__github__delete_file',
  'mcp__github__merge_pull_request', 'Bash(gh pr merge *)', 'Bash(gh api *pulls/*/merge*)',
];
const rules = (id = 2) => [
  { type: 'deletion', ruleset_id: 1 }, { type: 'non_fast_forward', ruleset_id: 1 },
  { type: 'pull_request', parameters: { allowed_merge_methods: ['merge'], required_approving_review_count: 0, require_code_owner_review: false }, ruleset_id: id },
  { type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'gate', integration_id: 15368 }] }, ruleset_id: id },
];

// A product whose setup is complete; each test breaks one thing.
function world() {
  const w = {
    user: { login: 'acmewidget' },
    repo: { permissions: { admin: false, push: true }, allow_merge_commit: true, allow_auto_merge: false, delete_branch_on_merge: false },
    list: [{ id: 1 }, { id: 2 }],
    sets: {
      1: { id: 1, name: 'every-branch', target: 'branch', enforcement: 'active', current_user_can_bypass: 'never', conditions: { ref_name: { include: ['~ALL'], exclude: [] } }, rules: [{ type: 'deletion' }, { type: 'non_fast_forward' }] },
      2: { id: 2, name: 'process3', target: 'branch', enforcement: 'active', current_user_can_bypass: 'never', conditions: { ref_name: { include: ['refs/heads/main', 'refs/heads/tranche'], exclude: [] } }, rules: [] },
    },
    branches: { main: rules(), tranche: rules() },
    artifacts: { artifacts: [{ created_at: '2026-11-02T14:34:28Z', expires_at: '2027-01-31T14:33:29Z' }, { created_at: '2026-11-01T10:00:00Z', expires_at: '2026-11-02T10:00:00Z' }] },
    branchInfo: { main: { protected: true, protection: { enabled: false } }, tranche: { protected: true, protection: { enabled: false } } },
    protection: {},
    commit: { committer: { login: 'web-flow' }, author: { login: 'neobobkrause' }, commit: { verification: { verified: true } } },
    // The block the owner last set (ownerBlock); undefined: the tranche's own block, set by abc1234567.
    top: undefined,
    onTranche: { ok: true, head: 'a'.repeat(40), tip: 'a'.repeat(40) },
    cf: {},
    cfAsked: [],
    pin: PIN,
    files: { 'CLAUDE.md': `## Standing approvals from Bob\n\nThe owner's words.\n\n${LINES}`, '.claude/settings.json': JSON.stringify({ permissions: { deny: DENY }, hooks: HOOKS }),
      '.github/workflows/process-gate.yml': PIN.file('shims/process-gate.yml'), '.github/workflows/process-record.yml': PIN.file('shims/process-record.yml'), '.github/workflows/process-branch-prune.yml': PIN.file('shims/process-branch-prune.yml'), 'process/config.json': JSON.stringify({ tranche: 'tranche', coordinator: 'session_bob', environment: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'], cloudflare_account: 'acc123', deploy: { internal_walk: { run: ['npm', 'run', 'walk:internal'] } } }) },
    env: { CLOUDFLARE_API_TOKEN: 'tok-SECRET-value', CLOUDFLARE_ACCOUNT_ID: 'acc123' },
    asked: [],
  };
  w.io = {
    api: (p) => {
      w.asked.push(p);
      let m;
      if (p === 'user') return w.user;
      if (p === 'repos/o/r') return w.repo;
      if (p.startsWith('repos/o/r/rulesets?')) return w.list;
      if ((m = p.match(/^repos\/o\/r\/rulesets\/(\d+)\?/))) return w.sets[m[1]] || null;
      if ((m = p.match(/^repos\/o\/r\/rules\/branches\/(.+)$/))) return w.branches[decodeURIComponent(m[1])] ?? null;
      if (p.startsWith('repos/o/r/actions/artifacts?name=gate-row')) return w.artifacts;
      if ((m = p.match(/^repos\/o\/r\/branches\/([^/]+)\/protection$/))) return w.protection[decodeURIComponent(m[1])] ?? null;
      if ((m = p.match(/^repos\/o\/r\/branches\/([^/]+)$/))) return w.branchInfo[decodeURIComponent(m[1])] ?? null;
      if (/^repos\/[^/]+\/[^/]+\/commits\/[0-9a-f]+$/.test(p)) return w.commit;
      throw new Error(`unexpected read ${p}`);
    },
    file: (f) => w.files[f] ?? null,
    branchExists: () => true,
    ownerBlock: (file, heading) => (w.top !== undefined ? w.top : { ref: 'origin/tranche', sha: 'abc1234567890', at: 1, block: approvalsBlock(w.files[file], heading) }),
    onTranche: () => w.onTranche,
    get pin() { return w.pin; },
    cf: (path) => { w.cfAsked.push(path); const k = Object.keys(w.cf).find((x) => path.includes(x)); return k ? w.cf[k] : { status: 200, success: true }; },
  };
  Object.defineProperty(w.io, 'env', { get: () => w.env, enumerable: true });
  return w;
}
const root = () => makeRepo({ 'README.md': 'x' });
const check = (w) => setupCheck(root(), { slug: 'o/r', io: w.io, log: quiet });
const state = (r, id) => r.results.find((x) => x.id === id);

test('every condition is listed with what, why, value, who and how it is read, and every read one has a reader', () => {
  const cs = loadConditions();
  for (const c of cs) for (const k of ['id', 'what', 'why', 'value', 'who', 'read']) assert.ok(c[k] !== undefined && c[k] !== '', `${c.id}: ${k}`);
  assert.deepEqual(cs.filter((c) => c.read !== CONFIRMED).map((c) => c.id).sort(), [...READERS].sort());
  assert.deepEqual(cs.filter((c) => c.read === CONFIRMED).map((c) => c.id), ['ruleset-bypass', 'actions-settings', 'secrets', 'collaborators', 'environments']);
});

test('setup check reports the census (R15), never refusing on it', () => {
  const w = world();
  const out = [];
  const r = makeRepo({ 'README.md': 'x', 'process/config.json': { modules_file: 'build/modules.json' }, 'build/modules.json': { modules: [{ id: 'lost', layer: 1, paths: ['src/lost/'], tests: ['test/lost/'] }] }, 'build/layers.md': '| 1 | One | other |\n' });
  const res = setupCheck(r, { slug: 'o/r', io: w.io, log: (m) => out.push(m) });
  assert.match(out.join('\n'), /census: 3 gap\(s\) at HEAD \(not-in-layer-map, no-entry, no-modules-row\); status --role bob lists the open layer's with their fixes/);
  assert.equal(res.census, 3, 'other, named by the layer map, has no modules row; lost is off the map, a gap whatever its state (coordinator, 6 Nov), and has no ledger entry (C16)');
  // Nothing in the census changes whether setup is complete.
  assert.equal(res.ok, setupCheck(root(), { slug: 'o/r', io: w.io, log: quiet }).ok);
});

test('a complete setup is all set, and the four unreadable conditions are confirmed, never read', () => {
  const w = world();
  const out = [];
  const r = setupCheck(root(), { slug: 'o/r', io: w.io, log: (m) => out.push(m) });
  assert.equal(r.ok, true, out.join('\n'));
  assert.deepEqual(r.results.filter((x) => x.state === 'set').map((x) => x.id).sort(), [...READERS].sort());
  assert.match(state(r, 'artifact-retention').detail, /kept 90 days/);
  assert.ok(!w.asked.some((p) => /actions\/permissions|secrets|collaborators|environments/.test(p)), w.asked.join(', '));
  assert.match(out.join('\n'), /- confirmed: secrets: confirmed once on the onboarding page/);
});

test('the account must push and not be an admin', () => {
  const w = world();
  w.repo.permissions.admin = true;
  const r = check(w);
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, ['account']);
  assert.match(state(r, 'account').detail, /acmewidget: push true, admin true/);
  const w2 = world();
  w2.user = null;
  assert.match(state(check(w2), 'account').detail, /could not read the account/);
});

test('the every-branch ruleset needs ~ALL, nothing excluded, deletion and force-push, and no bypass', () => {
  for (const [what, change] of [
    ['not ~ALL', (s) => { s.conditions.ref_name.include = ['refs/heads/main']; }],
    ['an exclusion', (s) => { s.conditions.ref_name.exclude = ['refs/heads/x']; }],
    ['no force-push rule', (s) => { s.rules = [{ type: 'deletion' }]; }],
    ['evaluate only', (s) => { s.enforcement = 'evaluate'; }],
    ['a bypass', (s) => { s.current_user_can_bypass = 'always'; }],
  ]) {
    const w = world();
    change(w.sets[1]);
    assert.deepEqual(check(w).missing, ['ruleset-all-branches'], what);
  }
  const w = world();
  w.list = null;
  assert.match(state(check(w), 'ruleset-all-branches').detail, /could not read the rulesets/);
});

test('main and the tranche need a pull request, merge commits only, and the required check from Actions', () => {
  const cases = [
    [(w) => { w.branches.main = rules().filter((r) => r.type !== 'pull_request'); }, /main: no pull request rule/],
    [(w) => { w.branches.tranche[2].parameters.allowed_merge_methods = ['merge', 'squash']; }, /tranche: merge methods are not merge only/],
    [(w) => { w.branches.tranche[3].parameters.required_status_checks = [{ context: 'ci', integration_id: 15368 }]; }, /tranche: check gate is not required/],
    [(w) => { w.branches.main[3].parameters.required_status_checks = [{ context: 'gate' }]; }, /main: check gate is not tied to GitHub Actions/],
    [(w) => { w.sets[2].current_user_can_bypass = 'pull_requests_only'; }, /can bypass ruleset "process3"/],
    [(w) => { delete w.branches.tranche; }, /tranche: could not read its rules/],
    [(w) => { w.branches.main[2].parameters.required_approving_review_count = 1; }, /main: a pull request rule requires 1 approving review\(s\), not 0/],
    [(w) => { w.branches.tranche[2].parameters.require_code_owner_review = true; }, /tranche: a pull request rule requires a code owner's review/],
    [(w) => { w.branches.main.push({ type: 'pull_request', parameters: { allowed_merge_methods: ['squash'], required_approving_review_count: 0 }, ruleset_id: 2 }); }, /main: merge methods are not merge only/],
    [(w) => { w.branches.tranche[2].parameters.required_reviewers = [{ reviewer: { id: 1, type: 'Team' } }]; }, /tranche: a pull request rule names required reviewers/],
  ];
  for (const [change, why] of cases) {
    const w = world();
    change(w);
    const r = check(w);
    assert.deepEqual(r.missing, ['ruleset-main-tranche']);
    assert.match(state(r, 'ruleset-main-tranche').detail, why);
  }
  // The required check is the one config names.
  const w = world();
  w.files['process/config.json'] = JSON.stringify({ coordinator: 's', required_check: 'ci' });
  assert.match(state(check(w), 'ruleset-main-tranche').detail, /check ci is not required/);
});

test('the retired GitHub pacing hook (PD-22) is a warning, not drift; any other unknown hook stays a gap (C60)', () => {
  // The copy's own hook, as R17c set it: it prints "not governed" and exits 0.
  const pacing = 'd="${CLAUDE_PROJECT_DIR:-$PWD}"; f="$d/.process/tool/p3.mjs"; h="$d/.process/tool/hook.mjs"; cd "$d" || exit 2; if [ -f "$h" ]; then node "$h"; exit $?; fi; echo "GitHub pacing hook: $f has no github hook: this call is not governed" >&2; exit 0';
  const w = world();
  const withPre = (cmds) => JSON.stringify({ permissions: { deny: DENY }, hooks: { ...HOOKS, PreToolUse: [{ matcher: 'Bash', hooks: cmds.map((command) => ({ type: 'command', command })) }] } });
  w.files['.claude/settings.json'] = withPre([pacing]);
