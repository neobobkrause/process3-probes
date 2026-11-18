// ===== file: notice.test.mjs (continued) =====

  assert.equal(r.missing.why, 'PR 681 does not exist in o/r (GitHub 404)');
  assert.equal(r.brief, undefined);
  assert.match(out.join('\n'), /^provider notice p:681: PR 681 does not exist in o\/r \(GitHub 404\).*notice withdraw p:681$/);
  assert.throws(() => noticeTriage(root, 'p:682', { log: quiet, io }), /HTTP 500/);
});

// PD-17's rehearsal of the path end to end: the state branch holds BOB's four notices for PRs the
// product repository lacks, triage says how they clear, each is withdrawn, notices() and BOB's
// triage count drop them, and a second withdraw finds each already withdrawn.
test('rehearsal (PD-17): four notices for missing PRs go from triage owed to withdrawn and leave BOB\'s count', () => {
  const root = product();
  completeAll(root);
  openPassed(root);
  const keys = ['p:632', 'p:633', 'p:635', 'p:681'];
  onState(root, Object.fromEntries(keys.map((k) => [noticeFile(k), JSON.stringify({ ...NOTICE, key: k, pr: Number(k.split(':')[1]) }) + '\n'])));
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const cfg = loadConfig(root);
  const sb = cfg.state_branch;
  const run = ghSays({ 'repos/o/r': { full_name: 'o/r' }, 'repos/o/r/issues/635': { number: 635 } });
  const io = { slug: 'o/r', getPR: getPRVia(run), presence: (slug, n) => prPresence(slug, n, { run }) };
  const bobSays = () => { const l = []; status(root, { role: 'bob', offline: true, live: 0, log: (m) => l.push(m) }); return l.join('\n'); };
  for (const k of keys) assert.match(bobSays(), new RegExp(`triage owed:.*${k}`));
  for (const k of keys) {
    const out = [];
    noticeTriage(root, k, { log: (x) => out.push(x), io });
    assert.match(out.join('\n'), new RegExp(`notice withdraw ${k}$`));
    withdrawNotice(root, cfg, k, { ...io, log: quiet });
  }
  fetchState(root, sb, { fresh: true });
  assert.deepEqual(notices(root, sb), []);
  const text = bobSays();
  for (const k of keys) assert.doesNotMatch(text, new RegExp(k));
  for (const k of keys) assert.throws(() => withdrawNotice(root, cfg, k, { ...io, log: quiet }), new RegExp(`provider notice ${k} is already withdrawn`));
});

// Cold review of C48: a 404 for a PR this repository's history merged (GitHub hides a suspended
// account's PRs), a repository served under another name, and a row whose pr is not its key's.
test('notice withdraw refuses a 404 for a PR the history merged, a repository served as another, and a pr its key does not name', () => {
  const root = product();
  completeAll(root);
  openPassed(root);
  git(['checkout', '-q', '-B', 'job/p', 'tranche'], { cwd: root });
  commit(root, { 'test/p/c.test.mjs': passing('p hidden') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'Merge PR 650: job/p into tranche', 'job/p'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const row = (pr, extra = {}) => JSON.stringify({ ...NOTICE, key: `p:${typeof pr === 'number' ? pr : 12}`, pr, ...extra }) + '\n';
  onState(root, { [noticeFile('p:650')]: row(650), [noticeFile('p:12')]: row('12x'), [noticeFile('p:651')]: row(651) });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const cfg = loadConfig(root);
  const run = ghSays({ 'repos/o/r': { full_name: 'o/r' } });
  const io = { getPR: getPRVia(run), presence: (slug, n) => prPresence(slug, n, { run }), slug: 'o/r', log: quiet };
  assert.throws(() => withdrawNotice(root, cfg, 'p:650', io), /refused: GitHub serves no pull request 650 in o\/r \(404\), but this repository's history holds its merge: a real PR GitHub hides; provider notice p:650 stands/);
  assert.throws(() => withdrawNotice(root, cfg, 'p:12', io), /refused: provider notice p:12 names pull request "12x", not the whole number its key names/);
  const moved = ghSays({ 'repos/o/r': { full_name: 'other/r' } });
  assert.throws(() => withdrawNotice(root, cfg, 'p:651', { ...io, getPR: getPRVia(moved), presence: (slug, n) => prPresence(slug, n, { run: moved }) }), /HTTP 404/);
  assert.throws(() => withdrawNotice(root, cfg, 'p:651', { ...io, merged: () => 'unknown' }), /could not be read; provider notice p:651 stands; run it again/);
  assert.equal(withdrawNotice(root, cfg, 'p:651', io).missing, true);
  fetchState(root, cfg.state_branch, { fresh: true });
  assert.deepEqual(notices(root, cfg.state_branch).map((n) => n.key), ['p:12', 'p:650']);
});


// To be kept by any job that works from this text: the job's handover note ends with this exact
// last line: `-- filed under orrery`.

test('mergedHere: a shallow clone reads a throwaway clone back from the notice\'s time; without a time it is unknown', () => {
  const root = product();
  completeAll(root);
  git(['checkout', '-q', '-B', 'job/p', 'tranche'], { cwd: root });
  commit(root, { 'test/p/c.test.mjs': passing('p hidden') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'Merge pull request #660 from o/job', 'job/p'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const url = git(['remote', 'get-url', 'origin'], { cwd: root });
  const shallow = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', `file://${url}`, shallow], { cwd: root });
  const cfg = loadConfig(root);
  const at = new Date().toISOString();
  assert.equal(mergedHere(shallow, cfg, 660, { at }), 'merged');
  assert.equal(mergedHere(shallow, cfg, 661, { at }), 'none');
  assert.equal(mergedHere(shallow, cfg, 661), 'unknown');
  assert.equal(mergedHere(root, cfg, 660), 'merged');
  assert.equal(mergedHere(root, cfg, 66), 'none');
});

// ===== file: developer-steps.mjs =====

// The developer's steps (setup/DEVELOPER.md) checked against setup/conditions.json; moved here
// from setup.mjs (build J), since only the tests use it.
import { dirname, join } from 'node:path';
import { CONDITIONS, loadConditions } from '../lib/setup.mjs';

// The steps against the list: each step complete, naming only
// conditions that are the developer's; every developer condition with a step; the deny lines
// the page prints equal to the deny-list condition's. Returns the problems.
export const DEVELOPER = join(dirname(CONDITIONS), 'DEVELOPER.md');
export const isDeveloper = (c) => /^the developer\b/.test(c.who);
export function developerSteps(text) {
  return text.split(/^## /m).slice(1).filter((s) => /^Step \d+\./.test(s)).map((s) => ({
    title: s.split('\n')[0],
    body: s,
    parts: ['Why:', 'Clicks:', 'How BOB confirms:', 'Sets:'].filter((p) => new RegExp(`^${p}`, 'm').test(s)),
    // A "Sets: none" line names no condition, whatever its reason mentions (review of PR 24).
    sets: /^Sets: none\b/m.test(s) ? [] : [...(s.match(/^Sets:(.*)$/m)?.[1] || '').matchAll(/`([^`]+)`/g)].map((m) => m[1]),
  }));
}
export function checkDeveloperSteps(text, conditions = loadConditions()) {
  const problems = [];
  const steps = developerSteps(text);
  const byId = new Map(conditions.map((c) => [c.id, c]));
  if (!steps.length) problems.push('no steps');
  for (const s of steps) {
    const lack = ['Why:', 'Clicks:', 'How BOB confirms:', 'Sets:'].filter((p) => !s.parts.includes(p));
    if (lack.length) problems.push(`${s.title}: lacks ${lack.join(', ')}`);
    // A step that names no condition says why (Bob, 2 Nov): "Sets: none, because ..." or "none; ...".
    if (s.parts.includes('Sets:') && !s.sets.length && !/^Sets: none(,? because|;)\s+\S+(\s+\S+){3,}/m.test(s.body)) problems.push(`${s.title}: names no condition and does not say why`);
    // Every website edit that may become a pull request says to set its base to the tranche.
    const commits = (s.body.match(/\*\*Commit changes\.\.\.\*\*/g) || []).length;
    if (commits && (s.body.match(/set \*\*base\*\* to the tranche, not `main`/g) || []).length < commits) problems.push(`${s.title}: a website commit that does not say to set base to the tranche, not main`);
    for (const id of s.sets) {
      if (!byId.has(id)) problems.push(`${s.title}: names ${id}, which is not in the list`);
      else if (!isDeveloper(byId.get(id))) problems.push(`${s.title}: names ${id}, which is not the developer's`);
    }
  }
  const named = new Set(steps.flatMap((s) => s.sets));
  for (const c of conditions.filter(isDeveloper)) if (!named.has(c.id)) problems.push(`${c.id} is the developer's and has no step`);
  // The deny step shows the whole .claude/settings.json, as valid JSON, its deny list the list's.
  const deny = byId.get('deny-list')?.value?.deny;
  const step = steps.find((s) => s.sets.includes('deny-list'));
  if (deny && step) {
    let shown;
    try { shown = JSON.parse(step.body.match(/```json\n([\s\S]*?)```/)?.[1] ?? ''); } catch { shown = undefined; }
    if (!shown || typeof shown !== 'object') problems.push('the deny step does not show the whole .claude/settings.json as valid JSON');
    else if (JSON.stringify(shown.permissions?.deny) !== JSON.stringify(deny)) problems.push('the deny lines on the page differ from the deny-list condition');
  }
  // The number of steps stated at the top is the number of steps.
  const stated = text.match(/^There are (\d+) steps\b/m)?.[1];
  if (Number(stated) !== steps.length) problems.push(`the page says ${stated ?? 'no number of'} steps, and has ${steps.length}`);
  steps.forEach((s, i) => { if (!s.title.startsWith(`Step ${i + 1}.`)) problems.push(`${s.title}: out of order, expected Step ${i + 1}`); });
  if (/[\u2014\u2013]/.test(text)) problems.push('an em-dash');
  return problems;
}

// ===== file: shims.test.mjs =====

// Build product-shims (TXT-1, SHM-1, SHM-5): the process lines a product's CLAUDE.md carries, the
// drift check of its shims and hooks against the pin, and the setup script start check runs.
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { approvalsBlock } from '../lib/record.mjs';
import { MAX_LINES, pinOf, setupCheck } from '../lib/setup.mjs';
import { runSetupScript, setupMarker, startCheck } from '../lib/start.mjs';
import { git } from '../lib/util.mjs';
import { commit, makeRepo } from './helpers.mjs';

const quiet = () => {};
const SHIMS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'shims');
const raw = (f) => readFileSync(join(SHIMS, f), 'utf8');
const strip = (t) => t.replace(/\n$/, '');
const PIN = { sha: 'p'.repeat(40), file: (f) => (f.startsWith('shims/') && existsSync(join(SHIMS, f.slice(6))) ? strip(raw(f.slice(6))) : null), list: () => readdirSync(SHIMS) };
const LINES = raw('CLAUDE.process.md').replaceAll('{tranche}', 'tranche');
const HOOKS = JSON.parse(raw('settings.hooks.json')).hooks;
const APPROVALS = '## Standing approvals from Bob\n\nThe owner\'s words.\n';
const FETCH = 'git fetch origin tranche --depth 1 && git checkout --detach FETCH_HEAD && git submodule update --init .process';

// Only the two shim conditions are judged; the rest of the setup is another test's.
function files(over = {}) {
  return {
    'CLAUDE.md': `${APPROVALS}\n${LINES}`,
    '.claude/settings.json': JSON.stringify({ permissions: { deny: [] }, hooks: HOOKS }),
    '.github/workflows/process-gate.yml': PIN.file('shims/process-gate.yml'),
    '.github/workflows/process-record.yml': PIN.file('shims/process-record.yml'),
    '.github/workflows/process-branch-prune.yml': PIN.file('shims/process-branch-prune.yml'),
    'process/config.json': JSON.stringify({ tranche: 'tranche' }),
    ...over,
  };
}
const only = (ids) => ({ conditions: ids.map((id) => ({ id, read: 'x' })) });
const judge = (f, pin = PIN) => {
  const r = setupCheck(makeRepo({ 'README.md': 'x' }), { slug: 'o/r', io: { api: () => null, env: {}, file: (p) => f[p] ?? null, pin }, ...only(['process-lines', 'shim-drift']), log: quiet });
  return Object.fromEntries(r.results.map((x) => [x.id, x]));
};

test('the shim: the pin, the one fetch command, where the role prompt comes from, under its own heading', () => {
  const lines = raw('CLAUDE.process.md').trimEnd().split('\n');
  assert.equal(lines[0], '## Process3');
  assert.ok(lines.some((l) => l.includes('`git ls-tree HEAD .process`')));
  assert.ok(lines.some((l) => l.includes('`git fetch origin {tranche} --depth 1 && git checkout --detach FETCH_HEAD && git submodule update --init .process`')));
  assert.ok(lines.some((l) => /role prompt/.test(l)));
  // A product's whole CLAUDE.md: the approvals, then these lines, which end the approvals block.
  const md = `${APPROVALS}\n${LINES}`;
  assert.equal(approvalsBlock(md, '## Standing approvals from Bob'), APPROVALS.trim());
  assert.ok(md.includes(FETCH));
  assert.ok(lines.length < MAX_LINES);
});

test('process-lines: set with the lines exactly; each gap names the plain pull request BOB makes', () => {
  assert.equal(judge(files())['process-lines'].state, 'set');
  assert.match(judge(files())['process-lines'].detail, /the process lines of the pin pppppppppp, \d+ lines besides the approvals/);
  for (const [what, md] of [
    ['only the approvals (the product today)', APPROVALS],
    ['a line altered', `${APPROVALS}\n${LINES.replace('--depth 1', '--depth 2')}`],
    ['the tranche left as {tranche}', `${APPROVALS}\n${raw('CLAUDE.process.md')}`],
    ['inside the approvals block, under no heading of its own', `${APPROVALS}\n${LINES.replace('## Process3\n', '')}`],
  ]) {
    const r = judge(files({ 'CLAUDE.md': md }))['process-lines'];
    assert.equal(r.state, 'missing', what);
    assert.match(r.detail, /lacks the process lines of the pin pppppppppp exactly: BOB opens a plain pull request into tranche that puts the lines of \.process\/shims\/CLAUDE\.process\.md \(with \{tranche\} as tranche\) in CLAUDE\.md below the approvals block, and changes nothing in the approvals block$/, what);
  }
  // The lines may sit above the approvals too, and other lines may surround them.
  assert.equal(judge(files({ 'CLAUDE.md': `# Product\n\n${LINES}\n${APPROVALS}` }))['process-lines'].state, 'set');
});

test('process-lines: under thirty lines without the approvals block, however long the block is', () => {
  const long = `${APPROVALS}${'More of the owner\'s words.\n'.repeat(60)}`;
  assert.equal(judge(files({ 'CLAUDE.md': `${long}\n${LINES}` }))['process-lines'].state, 'set');
  // The blank line after the block counts: it is not the block's.
  const pad = MAX_LINES - 1 - LINES.trimEnd().split('\n').length;
  const over = judge(files({ 'CLAUDE.md': `${APPROVALS}\n${LINES}${'x\n'.repeat(pad)}` }))['process-lines'];
  assert.equal(over.state, 'missing');
  assert.match(over.detail, new RegExp(`is ${MAX_LINES} lines without the approvals block, not under ${MAX_LINES}: BOB opens a plain pull request into tranche that moves what else it holds to another file`));
  assert.equal(judge(files({ 'CLAUDE.md': `${APPROVALS}\n${LINES}${'x\n'.repeat(pad - 1)}` }))['process-lines'].state, 'set');
});

test('no pin is missing; a pin older than the shim is not configured', () => {
  const r = judge(files(), null);
  assert.equal(r['process-lines'].detail, 'no .process pin on tranche');
  assert.equal(r['shim-drift'].detail, 'no .process pin on tranche');
  const old = { ...PIN, file: (f) => (f === 'shims/CLAUDE.process.md' ? null : PIN.file(f)) };
  assert.equal(judge(files(), old)['process-lines'].state, 'not configured');
});

test('shim-drift: workflows equal the pin\'s shims and only allowed hooks; each gap names its fix', () => {
  const ok = judge(files())['shim-drift'];
  assert.equal(ok.state, 'set', ok.detail);
  assert.match(ok.detail, /process-branch-prune\.yml, process-gate\.yml, process-record\.yml equal the pin pppppppppp's shims; \d+ hook\(s\), each allowed/);
  const drift = judge(files({ '.github/workflows/process-gate.yml': PIN.file('shims/process-gate.yml') + '\n# local' }))['shim-drift'];
  assert.equal(drift.state, 'missing');
  assert.match(drift.detail, /^\.github\/workflows\/process-gate\.yml differs from the pin's shim: BOB opens a plain pull request into tranche that copies \.process\/shims\/process-gate\.yml to it$/);
  const f = files();
  delete f['.github/workflows/process-record.yml'];
  assert.match(judge(f)['shim-drift'].detail, /process-record\.yml is absent: BOB opens a plain pull request/);
  // The branch cleanup shim is a product file like the others: absent or changed is a gap.
  const g = files();
  delete g['.github/workflows/process-branch-prune.yml'];
  assert.match(judge(g)['shim-drift'].detail, /^\.github\/workflows\/process-branch-prune\.yml is absent: BOB opens a plain pull request into tranche that copies \.process\/shims\/process-branch-prune\.yml to it$/);
  assert.match(judge(files({ '.github/workflows/process-branch-prune.yml': 'x' }))['shim-drift'].detail, /process-branch-prune\.yml differs from the pin's shim/);
  // The development release shim: needed only with a release block; carried, it must equal the pin's.
  assert.match(ok.detail, /^process-branch-prune\.yml, process-gate\.yml, process-record\.yml equal/);
  const rel = judge(files({ 'process/config.json': JSON.stringify({ tranche: 'tranche', release: {} }) }))['shim-drift'];
  assert.match(rel.detail, /process-dev-release\.yml is absent: BOB opens a plain pull request/);
  assert.equal(judge(files({ '.github/workflows/process-dev-release.yml': PIN.file('shims/process-dev-release.yml') }))['shim-drift'].state, 'set');
  assert.match(judge(files({ '.github/workflows/process-dev-release.yml': 'x' }))['shim-drift'].detail, /process-dev-release\.yml differs from the pin's shim/);
  // Any other hook fails, and the allowed one moved to another event or matcher does too.
  for (const hooks of [
    { ...HOOKS, PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo hi' }] }] },
    { Stop: HOOKS.SessionStart },
    { SessionStart: [{ matcher: 'x', hooks: HOOKS.SessionStart[0].hooks }] },
  ]) {
    const r = judge(files({ '.claude/settings.json': JSON.stringify({ hooks }) }))['shim-drift'];
    assert.equal(r.state, 'missing', JSON.stringify(hooks));
    assert.match(r.detail, /hook the pin does not allow .*: the file is the owner's, so Bob removes it through GitHub's website/);
  }
  // No hooks at all is allowed; a settings file that is not JSON is not.
  assert.equal(judge(files({ '.claude/settings.json': '{}' }))['shim-drift'].state, 'set');
  assert.match(judge(files({ '.claude/settings.json': '{' }))['shim-drift'].detail, /not JSON/);
});

test('pinOf: the tranche\'s .process pin, read from the process clone, fetched by its id when absent', () => {
  // The process repository, with its shims at one commit, and a clone of it that lacks that commit.
  const proc = makeRepo({ 'shims/process-gate.yml': 'gate\n', 'shims/CLAUDE.process.md': '## Process3\n' });
  const sha = git(['rev-parse', 'HEAD'], { cwd: proc });
  git(['config', 'uploadpack.allowReachableSHA1InWant', 'true'], { cwd: proc });
  const tool = join(mkdtempSync(join(tmpdir(), 'p3-tool-')), 't');
  git(['init', '-q', tool], { cwd: tmpdir() });
  git(['remote', 'add', 'origin', `file://${proc}`], { cwd: tool });
  // The product: its tranche pins that commit.
  const prod = makeRepo({ 'README.md': 'x' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: prod });
  git(['remote', 'add', 'origin', bare], { cwd: prod });
  git(['update-index', '--add', '--cacheinfo', `160000,${sha},.process`], { cwd: prod });
  git(['commit', '-q', '-m', 'pin'], { cwd: prod });
  git(['push', '-q', 'origin', 'main:tranche'], { cwd: prod });
  git(['fetch', '-q', 'origin'], { cwd: prod });
  const pin = pinOf(prod, 'tranche', tool);
  assert.equal(pin.sha, sha);
  assert.equal(pin.file('shims/process-gate.yml'), 'gate');
  assert.equal(pin.file('shims/none.yml'), null);
  assert.deepEqual(pin.list('shims'), ['CLAUDE.process.md', 'process-gate.yml']);
  // A tranche with no pin.
  const bare2 = makeRepo({ 'README.md': 'x' });
  git(['remote', 'add', 'origin', bare], { cwd: bare2 });
  git(['push', '-q', 'origin', 'main:other'], { cwd: bare2 });
  git(['fetch', '-q', 'origin'], { cwd: bare2 });
  assert.equal(pinOf(bare2, 'other', tool), null);
});

// SHM-5: the product's setup script.
function product(config) {
  const root = makeRepo({ 'CLAUDE.md': APPROVALS, 'process/config.json': JSON.stringify({ tranche: 'tranche', ...config }) });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  return root;
}
const script = (body) => {
  const f = join(mkdtempSync(join(tmpdir(), 'p3-setup-')), 'setup.sh');
  writeFileSync(f, `#!/bin/sh\n${body}\n`);
  chmodSync(f, 0o755);
  return f;
};

test('setup script: none by default; start check runs it once per container, and only with setup', () => {
  const none = product({});
  assert.deepEqual(runSetupScript(none, { log: quiet }), { ok: true, ran: false });
  const count = join(mkdtempSync(join(tmpdir(), 'p3-count-')), 'n');
  const s = script(`echo run >> "${count}"; echo "in $(pwd)"`);
  const root = product({ setup_script: ['sh', s] });
  // The setup check's own start check (setup false) runs nothing.
  assert.equal(startCheck(root, { branch: 'tranche', log: quiet }).ok, true);
  assert.equal(existsSync(count), false);
  const out = [];
  const r = startCheck(root, { branch: 'tranche', setup: true, log: (m) => out.push(m) });
  assert.equal(r.ok, true);
  assert.equal(r.setup.ran, true);
  assert.ok(out.some((l) => /^setup script: ok/.test(l)), out.join('\n'));
  assert.equal(out.at(-1), 'start check: ok');
  assert.equal(readFileSync(count, 'utf8'), 'run\n');
  // The marker lives under .git, not in the tree.
  assert.ok(setupMarker(root).includes(`${join('.git', 'p3-setup-done')}`));
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '');
  const again = [];
  assert.equal(startCheck(root, { branch: 'tranche', setup: true, log: (m) => again.push(m) }).setup.ran, false);
  assert.ok(again.includes('setup script: already run in this container'));
  assert.equal(readFileSync(count, 'utf8'), 'run\n');
});

test('setup script: a failure stops start check with its last lines and writes no marker; a timeout says so', () => {
  const s = script('i=1; while [ $i -le 30 ]; do echo "line $i"; i=$((i+1)); done; echo boom >&2; exit 3');
  const root = product({ setup_script: ['sh', s] });
  const out = [];
  const r = startCheck(root, { branch: 'tranche', setup: true, log: (m) => out.push(m) });
  assert.equal(r.ok, false);
  const text = out.join('\n');
  assert.match(text, /setup script: FAILED \(exit 3\); its last lines:/);
  assert.match(text, /line 30\nboom/);
  assert.doesNotMatch(text, /line 10\n/);
  assert.match(out.at(-1), /^start check: FAILED \(the setup script failed\): act on nothing/);
  assert.equal(existsSync(setupMarker(root)), false);
  // A timeout, through the runner the tool uses.
  const slow = product({ setup_script: ['x'], setup_timeout_minutes: 0.001 });
  const t = runSetupScript(slow, { log: quiet, exec: (cmd, args, o) => { assert.equal(o.timeout, 60); return { code: 1, stdout: 'started', stderr: 'Error: spawnSync x ETIMEDOUT', seconds: 0 }; } });
  // And the real runner's timeout, end to end.
  const real = runSetupScript(product({ setup_script: ['sh', script('sleep 5')], setup_timeout_minutes: 0.005 }), { log: quiet });
  assert.deepEqual(real, { ok: false, ran: true, timedOut: true });
  assert.deepEqual(t, { ok: false, ran: true, timedOut: true });
  const tout = [];
  runSetupScript(slow, { log: (m) => tout.push(m), exec: () => ({ code: 1, stdout: '', stderr: 'Error: spawnSync x ETIMEDOUT', seconds: 0 }) });
  assert.match(tout.join('\n'), /timed out after 0\.001 minutes/);
  // A script that fails on its own and prints ETIMEDOUT (a network error) is its exit, not a timeout.
  const own = runSetupScript(slow, { log: quiet, exec: () => ({ code: 1, stdout: '', stderr: 'npm ERR! ETIMEDOUT\n', seconds: 0 }) });
  assert.equal(own.timedOut, false);
});

test('setup script: a stale start runs nothing; a bad setup_script is refused', () => {
  const count = join(mkdtempSync(join(tmpdir(), 'p3-count-')), 'n');
  const root = product({ setup_script: ['sh', script(`echo run >> "${count}"`)] });
  commit(root, { 'local.txt': 'x' });
  assert.equal(startCheck(root, { branch: 'tranche', setup: true, log: quiet }).ok, false);
  assert.equal(existsSync(count), false);
  for (const bad of ['sh setup.sh', [], [''], [1]]) assert.throws(() => runSetupScript(product({ setup_script: bad }), { log: quiet }), /setup_script is not a command/);
  assert.throws(() => runSetupScript(product({ setup_script: ['true'], setup_timeout_minutes: 0 }), { log: quiet }), /setup_timeout_minutes/);
});

// process-record's pin step, run as written: the tranche is named by origin/main's config (the
// default name while main has none), never by the pushed commit, and the pin is that tranche's.
test('process-record: the tranche named from main, not from the pushed commit', (t) => {
  const py = spawnSync('python3', ['-c', 'import sys,json,yaml; print(json.dumps(yaml.safe_load(open(sys.argv[1]))))', join(SHIMS, 'process-record.yml')], { encoding: 'utf8' });
  if (py.status !== 0) { t.skip('no YAML parser here'); return; }
  const step = JSON.parse(py.stdout).jobs['record-push'].steps.find((s) => s.id === 'pin');
  const proc = makeRepo({ 'x.txt': '1\n' });
  const pin = git(['rev-parse', 'HEAD'], { cwd: proc });
  const pinned = (root, cfg) => { commit(root, { 'process/config.json': JSON.stringify(cfg) }); git(['update-index', '--add', '--cacheinfo', `160000,${pin},.process`], { cwd: root }); git(['commit', '-q', '-m', 'pin'], { cwd: root }); };
  const runPin = (mainCfg) => {
    const root = makeRepo({ 'a.txt': 'a\n', ...(mainCfg ? { 'process/config.json': JSON.stringify(mainCfg) } : {}) });
    const bare = mkdtempSync(join(tmpdir(), 'p3-bare-'));
    git(['init', '-q', '--bare', bare], { cwd: root });
    git(['remote', 'add', 'origin', bare], { cwd: root });
    git(['checkout', '-q', '-b', 'tr'], { cwd: root });
    pinned(root, { tranche: 'tr', process_repo: proc });
    git(['checkout', '-q', '-b', 'own'], { cwd: root });
    commit(root, { 'process/config.json': JSON.stringify({ tranche: 'own', process_repo: proc }) });
    git(['push', '-q', 'origin', 'main', 'tr', 'own'], { cwd: root });
    git(['fetch', '-q', 'origin'], { cwd: root });
    const tmp = mkdtempSync(join(tmpdir(), 'p3-gh-'));
    const env = { ...process.env, RUNNER_TEMP: tmp, GITHUB_ENV: join(tmp, 'env'), GITHUB_OUTPUT: join(tmp, 'out') };
    const r = spawnSync('bash', ['-eo', 'pipefail', '-c', step.run], { cwd: root, encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    return readFileSync(env.GITHUB_ENV, 'utf8');
  };
  assert.equal(runPin({ tranche: 'tr' }), 'TRANCHE=tr\n');
  // main has no Process3 yet (the copy before its first close): the default name, not "own".
  assert.equal(runPin(null), 'TRANCHE=tranche\n');
});

// Fewer runs (4 Nov): process-record runs on pushes to main and the tranche only; the gate keeps
// every trigger it had, edited (a retarget) included, and no job-level `if` on the required job,
// whose skip GitHub would count as passing.
test('shims: process-record on main and the tranche; the gate on every event that can change its verdict', (t) => {
  const load = (f) => spawnSync('python3', ['-c', 'import sys,json,yaml; print(json.dumps(yaml.safe_load(open(sys.argv[1]))))', join(SHIMS, f)], { encoding: 'utf8' });
  const rec = load('process-record.yml');
  if (rec.status !== 0) { t.skip('no YAML parser here'); return; }
  // YAML 1.1 reads the key "on" as true.
  assert.deepEqual(JSON.parse(rec.stdout).true, { push: { branches: ['main', 'tranche'] } });
  const gate = JSON.parse(load('process-gate.yml').stdout);
  assert.deepEqual(gate.true, { pull_request: { types: ['opened', 'synchronize', 'reopened', 'edited', 'ready_for_review', 'converted_to_draft'] } });
  assert.equal(gate.jobs.gate.if, undefined);
});

// ===== file: ghaudit.mjs =====


// Received at Stane, 5 figs.

// p3 github audit [--since <iso>] [--repo <owner/repo>]... [--login <login>] (R17c; Bob, 6 Nov:
// does ALL GitHub traffic go through, and get tracked by, the pacing mechanism?). GitHub's own
// evidence against the account's ledger (pace.mjs usage: the shared rows and this clone's log):
//   calls      GitHub's primary count (rate_limit, which covers its own hour to the reset) against
//              the ledger's REST calls in that hour; the gap is "outside the tool" (the connector's
//              reads, raw gh or curl): informational, since connector reads stay on GitHub's count.
//              The connector calls the session hook counted are shown beside it.
//   pushes     per repository: push-triggered workflow runs (one per branch and commit) against the
//              ledger's pushes to branches other than the state branch (merges and release tags the
//              tool made count as pushes: GitHub raises a push for each); the product's state
//              branch: its commits in the window (an upper bound: one coalesced push carries several)
//              against the ledger's state pushes. A push GitHub shows that the ledger lacks is
//              unexplained, named by branch, actor and the commit's Claude-Session trailer.
//   writes     per repository, the account's pull request, comment and review events (a review's
//              own inline comments count once with it) against the ledger's content-creating
//              requests to that repository.
// Not compared: the last share_s + 60 s (other sessions share their use every share_s), and
// anything older than the ledger's two hours. Exit 1 on an unexplained push or write gap.
// Repository-scoped endpoints only (sessions' proxies refuse users/* paths): the account's activity
// is every login but bots and the repository's owner, or the --login given. Paced like any gh call.
import { gh } from './util.mjs';
import { pacing, slugOf, usage } from './pace.mjs';

const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
const sessionIn = (msg) => (String(msg || '').match(/Claude-Session:\s*\S*?(session_[A-Za-z0-9]+)/) || [])[1] || null;
const PR_ACTS = new Set(['opened', 'edited', 'closed', 'reopened', 'ready_for_review', 'converted_to_draft']);
const bot = (login) => /\[bot\]$/.test(String(login || ''));
export const LEDGER_HOURS = 2;

function pages(read, path, { max = 3, pick = (x) => x, stop = () => false } = {}) {
  const out = [];
  for (let n = 1; n <= max; n++) {
    const page = read(['api', `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${n}`]);
    const items = Array.isArray(pick(page)) ? pick(page) : [];
    out.push(...items);
    if (items.length < 100 || items.some(stop)) break;
  }
  return out;
}

export function githubAudit(root, { since, repos = [], product = null, stateBranch = 'process-state', login = null, now = Date.now(), io = {}, log = console.log, p = pacing() } = {}) {
  const read = io.gh || ((args) => gh(args, { cwd: root, allowFail: true }));
  const start = since === undefined ? now - 3600e3 : Date.parse(since);
  if (!Number.isFinite(start) || start >= now) throw new Error(`--since <iso time>: a time before now, not ${JSON.stringify(since)}`);
  if (start < now - LEDGER_HOURS * 3600e3) throw new Error(`--since ${iso(start)}: the ledger keeps ${LEDGER_HOURS} hours of every session's use; audit from ${iso(now - LEDGER_HOURS * 3600e3)} or later`);
  // Other sessions' last minutes are not shared yet: GitHub's evidence and the ledger both end here.
  const until = Math.max(start + 60e3, now - (p.share_s + 60) * 1000);
  const ledger = usage(root, { t: until, seconds: (until - start) / 1000 });
  const ours = (login0, repo) => !bot(login0) && (login ? login0 === login : String(login0 || '').toLowerCase() !== String(repo).split('/')[0]);
  const inWindow = (t) => { const ms = Date.parse(t); return ms >= start && ms < until; };
  const L = [];
  let unexplained = false;

  // Calls: GitHub's primary count covers the hour that ends at its reset.
  const rl = read(['api', 'rate_limit']);
  const core = rl?.resources?.core;
  if (core) {
    const from = core.reset * 1000 - 3600e3;
    const lc = usage(root, { t: now, seconds: Math.max(1, (now - from) / 1000) });
    const used = core.limit - core.remaining;
    const rest = lc.calls - lc.free - lc.graphql - lc.connector;
    L.push(`calls, primary: GitHub ${used} of ${core.limit} used since ${iso(from)} vs ledger ${rest} REST call(s): ${used - rest >= 0 ? `${used - rest} outside the tool (the connector's reads, raw gh or curl)` : `the ledger ${rest - used} over (counted before GitHub's reset)`}`);
    L.push(`calls, connector: ${lc.connector} counted by the session hook in that hour (on GitHub's primary or GraphQL count, as the connector makes them)`);
    const g = rl.resources.graphql;
    if (g) L.push(`calls, GraphQL: GitHub ${g.limit - g.remaining} of ${g.limit} used vs ledger ${lc.graphql} (gh's pr and issue commands)`);
  } else L.push('calls: rate_limit not answered; GitHub\'s count unread');

  // Pushes, per repository; the ledger's pushes logged with no repository cover gaps first.
  let pool = ledger.pushes_by['?'] || 0;
  const named = [];
  const audited = [...new Set([...repos.map((r) => r.toLowerCase()), ...Object.keys(ledger.pushes_by).map((k) => k.replace(/#state$/, '')).filter((r) => r !== '?')].filter((r) => slugOf(r)))];
  let pushGap = 0;
  for (const repo of audited) {
    const runs = pages(read, `repos/${repo}/actions/runs?event=push&created=>=${iso(start)}`, { pick: (x) => x?.workflow_runs });
    const seen = new Map();
    for (const r of runs) {
      if (!inWindow(r.created_at) || !ours(r.actor?.login, repo) || r.head_branch === stateBranch) continue;
      const k = `${r.head_branch}@${r.head_sha}`;
      if (!seen.has(k)) seen.set(k, { branch: r.head_branch, sha: String(r.head_sha || '').slice(0, 7), actor: r.actor?.login || '?', session: sessionIn(r.head_commit?.message) });
    }
    const lr = ledger.pushes_by[repo] || 0;
    let gap = Math.max(0, seen.size - lr);
    const covered = Math.min(gap, pool);
    pool -= covered;
    gap -= covered;
    if (gap) { pushGap += gap; named.push(...[...seen.values()].slice(-gap)); }
    L.push(`pushes, ${repo}: GitHub ${seen.size} (push-triggered runs, one per branch and commit${seen.size ? `: ${[...new Set([...seen.values()].map((x) => x.branch))].slice(0, 5).join(', ')}` : ''}) vs ledger ${lr}${covered ? `, ${covered} covered by pushes logged with no repository` : ''}${gap ? `: ${gap} GitHub shows that the ledger lacks` : ''}`);
    if (repo === String(product || '').toLowerCase()) {
      const commits = pages(read, `repos/${repo}/commits?sha=${encodeURIComponent(stateBranch)}&since=${iso(start)}`).filter((c) => inWindow(c.commit?.committer?.date));
      const ls = ledger.pushes_by[`${repo}#state`] || 0;
      // At least one push carried the commits; the ledger can hold no more pushes than commits.
      let sgap = commits.length && !ls ? 1 : 0;
      if (sgap && pool) { pool--; sgap = 0; }
      if (sgap) { pushGap += 1; named.push({ branch: stateBranch, sha: String(commits[0].sha || '').slice(0, 7), actor: commits[0].author?.login || '?', session: sessionIn(commits[0].commit?.message) }); }
      L.push(`pushes, ${repo} ${stateBranch}: ${commits.length} commit(s) in the window (pushes ≤ commits: one coalesced push carries several) vs ledger ${ls} state push(es)${sgap ? ': at least 1 the ledger lacks' : ''}`);
    }
  }
  if (pushGap) {
    unexplained = true;
    L.push(`UNEXPLAINED pushes: ${pushGap}: ${named.slice(0, 10).map((x) => `${x.branch}@${x.sha} by ${x.actor}${x.session ? ` (${x.session})` : ''}`).join('; ')}`);
  }

  // Writes, per repository; content logged with no repository covers gaps first.
  let cpool = ledger.content_by['?'] || 0;
  let created = 0;
  let wGap = 0;
  const who = [];
  for (const repo of audited) {
    const ev = pages(read, `repos/${repo}/events`, { stop: (e) => Date.parse(e.created_at) < start }).filter((e) => inWindow(e.created_at) && ours(e.actor?.login, repo));
    const reviews = new Set(ev.filter((e) => e.type === 'PullRequestReviewEvent').map((e) => e.payload?.review?.id).filter(Boolean));
    const writes = ev.filter((e) => (e.type === 'PullRequestEvent' && PR_ACTS.has(e.payload?.action))
      || (e.type === 'IssueCommentEvent' && e.payload?.action !== 'deleted')
      || e.type === 'PullRequestReviewEvent'
      || (e.type === 'PullRequestReviewCommentEvent' && !reviews.has(e.payload?.comment?.pull_request_review_id)));
    created += ev.filter((e) => e.type === 'CreateEvent').length;
    const lw = ledger.content_by[repo] || 0;
    let gap = Math.max(0, writes.length - lw);
    const covered = Math.min(gap, cpool);
    cpool -= covered;
    gap -= covered;
    if (gap) { wGap += gap; who.push(...writes.slice(0, gap).map((e) => `${repo} ${e.type.replace(/Event$/, '')}${e.payload?.action ? ` ${e.payload.action}` : ''}${e.payload?.pull_request?.number || e.payload?.issue?.number ? ` #${e.payload.pull_request?.number || e.payload.issue?.number}` : ''} by ${e.actor?.login}`)); }
    L.push(`writes, ${repo}: GitHub ${writes.length} (pull requests, comments, reviews) vs ledger ${lw}${covered ? `, ${covered} covered by writes logged with no repository` : ''}${gap ? `: ${gap} unexplained` : ''}`);
  }
  if (wGap) { unexplained = true; L.push(`UNEXPLAINED writes: ${who.slice(0, 10).join('; ')}`); }
  L.push(`refs created: ${created} (CreateEvent: a branch or tag, each by a push) vs ledger ${ledger.pushes} push(es) in the window; GitHub's events can lag up to hours`);

  log(`github audit ${iso(start)} to ${iso(until)} (the last ${Math.round((now - until) / 60e3)} min left out: not yet shared by every session)${login ? `, as ${login}` : ', every login but bots and each repository\'s owner'}: ${audited.join(', ') || 'no repository'}`);
  for (const l of L) log(`- ${l}`);
  log(unexplained ? 'audit: an unexplained push or write gap: some GitHub traffic went around the tool; find its session and route it through the tool (github push) or the GitHub connector under the hook' : 'audit: every push and write GitHub shows is in the ledger');
  return { ok: !unexplained, ledger, lines: L };
}

// The repositories audited by default: this clone's own and process3's (from the config's
// process_repo, else the pinned process3's origin); the ledger adds every one it names a push to.
export function auditRepos({ slug, cfg, processOrigin } = {}) {
  return [...new Set([slugOf(slug || ''), slugOf(cfg?.process_repo || '') || slugOf(processOrigin || '')].filter(Boolean))];
}

// ===== file: register.mjs =====

// Triage registers (AUD-8: "A process triage lane and a product triage lane study each identified
// problem and bring you options with context before a response is chosen. A chosen short-term
// response reaches later sessions in their starting prompt, with the condition that ends it.").
// One triage lane per repository: the process's in process3 (its folder `triage/`), each product's
// a lane of kind "triage" in its process/config.json. Each keeps its register in its folder, so it
// survives every session: `register.json` holds the open entries, `closed.jsonl` each closed one
// with how its end condition was met. An entry carries the problem, its evidence and the options,
// each with its context, that its lane brings for a choice; once a response is chosen, the response
// word for word, the dated words that chose it and, for a short-term one, its end condition and the
// roles it reaches. The pinned tool prints each chosen short-term response, verbatim, into the
// starting prompt of each role it names, so a refreshed session gets it exactly and no one retypes
// it; nothing else in the register is printed. Temporary measures live here, never as rulebook
// lines (AUD-9, TXT-3). Written only by `triage add`, `triage choose` and `triage close`, as commits
// on the current branch that land by pull request like any lane change.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG_FILE, exists, fail, git, laneDirs, list, now } from './util.mjs';

export const PROCESS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// Tests' seam: under node --test, P3_PROCESS_ROOT names a fixture in place of this checkout's own
// register, so the live register's entries never decide a test.
const processRoot = () => (process.env.NODE_TEST_CONTEXT && process.env.P3_PROCESS_ROOT) || PROCESS_ROOT;
export const PROCESS_TRIAGE = { name: 'process-triage', dir: 'triage', module: null, kind: 'triage', repo: 'process' };
export const REGISTER = 'register.json';
export const CLOSED = 'closed.jsonl';
export const KINDS = ['short-term', 'long-term'];
// The roles whose starting prompts print a chosen short-term response (AUD-8: "later sessions").
// The watcher and the lanes' own sessions are not among them: their STARTs carry no register block.
export const AFFECTS = ['bob', 'root', 'coordinator', 'job'];
// The printed block's cap. Measured 5 Nov: each role prompt is at most one screen, 4096 bytes
// (prompt-caps.test.mjs; BOB's 3789 on the copy's slug), and the seed entry's
// block, its heading included, is 880 bytes. Half a screen holds the heading and about two and a
// half entries of the seed's size, so a prompt with its block stays within a screen and a half and
// is read whole. Over it the tool still prints every entry, and says the set is over its cap (in
// the block and at triage choose and list), so the triage lanes close or combine entries rather than
// let the set grow until it is skimmed.
export const STANDING_CAP = 2048;

// The product's triage lane, or null; more than one is refused.
export function productTriageLane(cfg) {
  const ls = (Array.isArray(cfg?.lanes) ? cfg.lanes : []).filter((l) => l?.kind === 'triage');
  if (ls.length > 1) fail(`process/config.json names ${ls.length} triage lanes (${ls.map((l) => l.name).join(', ')}); one per repository`);
  const l = ls[0];
  if (!l) return null;
  if (typeof l.dir !== 'string' || !l.dir.trim() || !laneDirs({ lanes: [l] }).length) fail(`triage lane ${l.name} names no "dir" in process/config.json that can be a lane folder`);
  return { name: String(l.name).trim(), dir: l.dir.trim().replace(/^\.\//, '').replace(/\/+$/, ''), module: null, kind: 'triage', repo: 'product' };
}

const one = (s) => (typeof s === 'string' ? s.trim() : '');
// An entry's shape, checked wherever the register is read or written: a malformed one is refused, never skipped.
export function checkEntry(e, where = 'the register') {
  const at = `${where}, entry ${e?.id || '?'}`;
  if (!e || typeof e !== 'object' || !/^[A-Z]+\d+$/.test(String(e.id))) fail(`${at}: an entry needs an id such as P1`);
  for (const k of ['problem', 'evidence', 'owner', 'state']) if (!one(e[k])) fail(`${at}: no ${k}`);
  if (!KINDS.includes(e.kind)) fail(`${at}: kind is ${KINDS.join(' or ')}, not ${JSON.stringify(e.kind)}`);
  // AUD-8: options with context come before any response is chosen.
  if (!Array.isArray(e.options) || !e.options.length || e.options.some((o) => !one(o?.option) || !one(o?.context))) fail(`${at}: options lists each option with its context ({"option", "context"}), at least one`);
  if (e.kind === 'long-term' && !one(e.judged_against)) fail(`${at}: a long-term entry needs judged_against (the requirement, principle or foundation)`);
  if (e.response === undefined) return e;
  for (const k of ['response', 'chosen_at', 'chosen_by']) if (!one(e[k])) fail(`${at}: a chosen response needs ${k}`);
  // AUD-8: the options go to Bob, who chooses; chosen_by quotes his dated words.
  if (!/^Bob, \d/.test(e.chosen_by)) fail(`${at}: chosen_by quotes the dated words that chose it, as Bob, <date>: "<his words>"`);
  if (e.kind === 'short-term') {
    if (!one(e.end_condition)) fail(`${at}: a chosen short-term response needs end_condition (AUD-8: "with the condition that ends it")`);
    if (!Array.isArray(e.affects) || !e.affects.length || e.affects.some((r) => !AFFECTS.includes(r))) fail(`${at}: affects lists roles from ${AFFECTS.join(', ')}`);
  }
  return e;
}

export function parseRegister(text, where = REGISTER) {
  if (text === null || text === undefined) return { open: [] };
  let r;
  try { r = JSON.parse(text); } catch (e) { fail(`${where} is not JSON: ${e.message}`); }
  if (!r || !Array.isArray(r.open)) fail(`${where} needs {"open": [entries]}`);
  r.open.forEach((e) => checkEntry(e, where));
  const ids = r.open.map((e) => e.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) fail(`${where}: entry ${dup} appears twice; renumber one`);
  return r;
}

// chosen_by holds the dated words that chose it, quoted; the response is printed as recorded.
export const chosen = (e) => e.kind === 'short-term' && e.response !== undefined;
export const entryLines = (repo, e) => [`- ${repo} ${e.id}. Response chosen ${e.chosen_at}: ${e.response}`, `  Problem: ${e.problem}`, `  Ends when: ${e.end_condition}`];

// A prompt without its standing block: the one-screen cap is the prompt's, the block has its own.
export const STANDING_HEAD = '## Chosen short-term responses';
export const promptBody = (p) => p.split(`\n\n${STANDING_HEAD}\n`)[0].replace(/\n*$/, '\n');

// The block a role's starting prompt carries: every open chosen short-term response naming the role, from
// each register given ({ repo, register }), verbatim; '' when none. Over the cap, it says so.
export function standingBlock(registers, role) {
  const rows = registers.flatMap(({ repo, register }) => register.open.filter((e) => chosen(e) && e.affects.includes(role)).map((e) => entryLines(repo, e)));
  if (!rows.length) return '';
  const L = [STANDING_HEAD, '', 'Printed verbatim from the triage registers (AUD-8); each holds until its end condition is met and its triage lane closes it. Act by each as written, within your prompt\'s limits.', '', ...rows.flat()];
  const text = L.join('\n') + '\n';
  const b = Buffer.byteLength(text);
  return b > STANDING_CAP ? `${text}\nThis block is ${b} bytes, over its cap of ${STANDING_CAP}: tell the triage lanes, which close or combine entries.\n` : text;
}

// The process's register at the pin (the tool's own checkout), and the product's at the tranche's
// tip as last fetched (the working tree's when that ref is absent).
export const processRegister = (root = processRoot()) => {
  const f = join(root, PROCESS_TRIAGE.dir, REGISTER);
  return { repo: 'process', register: parseRegister(existsSync(f) ? readFileSync(f, 'utf8') : null, `process3 ${PROCESS_TRIAGE.dir}/${REGISTER}`) };
};
export function productRegister(root, cfg) {
  const l = productTriageLane(cfg);
  if (!l) return null;
  const path = `${l.dir}/${REGISTER}`;
  const ref = `refs/remotes/origin/${cfg.tranche}`;
