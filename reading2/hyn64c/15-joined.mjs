// ===== file: ghhook.test.mjs (continued) =====

import { commonDir, PACING_DEFAULTS, useShared } from '../lib/pace.mjs';
import { makeRepo } from './helpers.mjs';

const P = { ...PACING_DEFAULTS, gh_interval_ms: 0 };
const P3 = join(dirname(fileURLToPath(import.meta.url)), '..', 'p3.mjs');
const HOOK = join(dirname(fileURLToPath(import.meta.url)), '..', 'hook.mjs');
function logTo(t) {
  const f = join(mkdtempSync(join(tmpdir(), 'p3-hook-')), 'log.jsonl');
  writeFileSync(f, '');
  const was = process.env.P3_GITHUB_LOG;
  process.env.P3_GITHUB_LOG = f;
  t.after(() => { useShared(null); if (was === undefined) delete process.env.P3_GITHUB_LOG; else process.env.P3_GITHUB_LOG = was; });
  return () => readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

test('a connector read passes and is counted; a write is a content-creating request; one that moves a ref is also a push', (t) => {
  const rows = logTo(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  useShared(null);
  assert.deepEqual(hookDecision({ tool_name: 'mcp__github__pull_request_read', tool_input: { owner: 'NeoBobKrause', repo: 'process3', pullNumber: 1 } }, root, { p: P }), { ok: true, counted: 'read' });
  assert.deepEqual(hookDecision({ tool_name: 'mcp__github__add_issue_comment', tool_input: { owner: 'neobobkrause', repo: 'process3' } }, root, { p: P }), { ok: true, counted: 'write' });
  hookDecision({ tool_name: 'mcp__github__merge_pull_request', tool_input: { owner: 'neobobkrause', repo: 'process3' } }, root, { p: P });
  assert.deepEqual(rows().map((r) => [r.kind, r.points ?? null, r.content ?? null, r.connector, r.repo]), [
    ['gh', 1, null, true, 'neobobkrause/process3'],
    ['gh', 5, 1, true, 'neobobkrause/process3'],
    ['gh', 5, 1, true, 'neobobkrause/process3'],
    ['push', null, null, true, 'neobobkrause/process3'],
  ]);
  for (const op of ['create_pull_request', 'update_pull_request', 'pull_request_review_write', 'add_comment_to_pending_review', 'add_reply_to_pull_request_comment', 'create_branch', 'issue_write', 'update_pull_request_branch']) {
    assert.equal(hookDecision({ tool_name: `mcp__github__${op}`, tool_input: {} }, root, { p: P }).counted, 'write', op);
  }
  for (const op of ['list_pull_requests', 'get_file_contents', 'pull_request_read', 'actions_list', 'get_job_logs']) assert.equal(hookDecision({ tool_name: `mcp__github__${op}`, tool_input: {} }, root, { p: P }).counted, 'read', op);
});

test('a paused or stopped account refuses the connector call (the hook exits 2); other tools pass', (t) => {
  logTo(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  useShared({ read: () => ({ pause: { at: '2026-11-06T23:00:00Z', until: '2099-01-01T00:00:00Z', why: 'secondary rate limit' }, use: [] }), pause: () => null });
  const d = hookDecision({ tool_name: 'mcp__github__add_issue_comment', tool_input: {} }, root, { p: P });
  assert.match(d.block, /^GitHub budget: GitHub rate-limited this account \(secondary rate limit\)/);
  useShared({ read: () => ({ pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'x', stopped: true }, use: [] }), pause: () => null });
  assert.match(hookDecision({ tool_name: 'mcp__github__pull_request_read', tool_input: {} }, root, { p: P }).block, /every GitHub call is stopped/);
  assert.deepEqual(hookDecision({ tool_name: 'Read', tool_input: { file_path: '/x' } }, root, { p: P }), { ok: true });
});

test('Bash: a raw git push, gh, or curl to GitHub is refused; the tool\'s own commands pass', () => {
  for (const c of ['git push origin job/x', 'git -c user.name=x push -u origin b', 'cd /x && git push', 'FOO=1 git push origin HEAD', 'gh pr create --title x', 'gh api repos/o/r', 'echo $(gh api user)', 'curl -s https://api.github.com/repos/o/r', 'wget https://github.com/o/r/archive/x.zip']) assert.ok(bashVerdict(c), c);
  for (const c of ['node .process/tool/p3.mjs github push origin job/x', 'node tool/p3.mjs github push origin build/x --set-upstream', 'cd /home/user/process3 && node tool/p3.mjs job sync alpha', 'git status', 'git fetch origin tranche', 'git commit -m "push the gh button"', 'npm test', 'curl -s https://registry.npmjs.org/x', 'node --test tool/test/*.test.mjs']) assert.equal(bashVerdict(c), null, c);
  // The refusal names the tool's path in this clone (R17d): process3's own, or a product's pinned one.
  assert.match(bashVerdict('git push origin x'), /`node tool\/p3\.mjs github push <remote> <refspec>`/);
  assert.match(bashVerdict('git push origin x', 0, 'node .process/tool/p3.mjs'), /`node \.process\/tool\/p3\.mjs github push <remote> <refspec>`/);
  assert.doesNotMatch(bashVerdict('git push origin x'), /\.process/);
  // Read as the shell reads it (cold review of R17c): no way around it, and no false block.
  for (const c of ['(git push)', '(cd x && git push)', '/usr/bin/git push', '\\git push', '"git" push', 'bash -c "git push"', "sh -c 'git push origin x'", 'xargs git push', 'time git push', 'nohup git push', 'timeout 60 git push', 'env -i git push', '! git push', 'if true; then git push; fi', 'for x in a; do git push; done', 'sleep 1 & git push', 'git --git-dir x push', 'echo $(git push)', 'echo `git push`', 'git -c alias.p=push p', '/usr/bin/gh api x', 'node tool/p3.mjs x $(gh api y)', 'git -C dir push', 'eval git push']) assert.ok(bashVerdict(c), c);
  for (const c of ['git commit -m "note; git push later"', 'git commit -F - <<EOF\ngh pr create\ngit push\nEOF', 'echo hi # ; git push', 'git push --dry-run origin x', 'git log --grep push']) assert.equal(bashVerdict(c), null, c);
});

test('the hook never waits past its cap: longer, it refuses and says to retry the tool call', (t) => {
  logTo(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  useShared({ read: () => ({ pause: { at: new Date().toISOString(), until: new Date(Date.now() + 300e3).toISOString(), why: 'secondary rate limit' }, use: [] }), pause: () => null });
  const d = hookDecision({ tool_name: 'mcp__github__pull_request_read', tool_input: {} }, root, { p: P, sleep: () => assert.fail('no sleep past the cap') });
  assert.match(d.block, /acts on GitHub wait until .*then retry the tool call \(retry it\)/);
});

test('the hook command: exit 0 to allow, exit 2 with the reason on stderr to block', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const hook = (input) => spawnSync(process.execPath, [P3, 'github', 'hook'], { cwd: root, input: JSON.stringify(input), encoding: 'utf8', env: { ...process.env, P3_GITHUB_LOG: '0' } });
  const ok = hook({ tool_name: 'Bash', tool_input: { command: 'node tool/p3.mjs status' } });
  assert.equal(ok.status, 0, ok.stderr);
  const no = hook({ tool_name: 'Bash', tool_input: { command: 'git push origin main' } });
  assert.equal(no.status, 2);
  assert.match(no.stderr, /GitHub pacing \(P27\): a raw git push goes around GitHub pacing/);
  const read = hook({ tool_name: 'mcp__github__pull_request_read', tool_input: {} });
  assert.equal(read.status, 0, read.stderr);
  const none = spawnSync(process.execPath, [P3, 'github', 'hook'], { cwd: root, input: '', encoding: 'utf8' });
  assert.equal(none.status, 2);
  // The hook's own entry (R17d), which the settings call: the same answers.
  const entry = (input) => spawnSync(process.execPath, [HOOK], { cwd: root, input: input === '' ? '' : JSON.stringify(input), encoding: 'utf8', env: { ...process.env, P3_GITHUB_LOG: '0' } });
  assert.equal(entry({ tool_name: 'Bash', tool_input: { command: 'node tool/p3.mjs status' } }).status, 0);
  const no2 = entry({ tool_name: 'Bash', tool_input: { command: 'gh pr list' } });
  assert.equal(no2.status, 2);
  assert.match(no2.stderr, /GitHub pacing \(P27\): a raw gh command/);
  assert.equal(entry({ tool_name: 'mcp__github__pull_request_read', tool_input: {} }).status, 0);
  assert.equal(entry('').status, 2);
});

// The read path (R17d; coordinator: under 300 ms p95, no ledger fetch on a read, the pause and stop
// cached and refreshed by ls-remote, fetched only when the ledger moved).
const cacheAt = (root, c) => writeFileSync(join(commonDir(root), LEDGER_CACHE), JSON.stringify(c));
test('a connector read uses the cached pause and stop, any age, and never fetches; a stale or missing cache starts one background refresh', (t) => {
  logTo(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  const kicks = [];
  const kick = () => kicks.push(1);
  const errs = [];
  const run = (op) => hookRun({ tool_name: `mcp__github__${op}`, tool_input: {} }, root, { kick, err: (m) => errs.push(m), opts: { sleep: () => assert.fail('a read never waits on the floor') } });
  // No cache: the read passes at once, and a refresh is started.
  assert.equal(run('pull_request_read'), 0);
  assert.equal(kicks.length, 1);
  // A fresh cache: nothing started; its stop refuses the read (a stop is cached too).
  cacheAt(root, { at: Date.now(), pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'secondary rate limit', stopped: true }, use: [], ledger: null, tip: 'a' });
  assert.equal(run('list_pull_requests'), 2);
  assert.match(errs.pop(), /every GitHub call is stopped/);
  assert.equal(kicks.length, 1);
  // A stale cache still answers (here a pause past its wait cap: refused), and starts a refresh.
  cacheAt(root, { at: Date.now() - 600e3, pause: { at: new Date().toISOString(), until: new Date(Date.now() + 600e3).toISOString(), why: 'secondary rate limit' }, use: [], ledger: null, tip: 'a' });
  assert.equal(run('get_file_contents'), 2);
  assert.match(errs.pop(), /GitHub rate-limited this account/);
  assert.equal(kicks.length, 2);
  // Never a fetch on the read path: peekShare reads only the cache.
  assert.deepEqual(peekShare(root, { kick: () => {} }).read().pause.why, 'secondary rate limit');
  // A write reads the ledger through its share (the share given): its stop refuses though the cache has none.
  cacheAt(root, { at: Date.now(), pause: null, use: [], ledger: null, tip: 'a' });
  let reads = 0;
  assert.equal(hookRun({ tool_name: 'mcp__github__add_issue_comment', tool_input: {} }, root, { kick, err: (m) => errs.push(m), share: { read: () => { reads++; return { pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'x', stopped: true }, use: [] }; }, pause: () => null } }), 2);
  assert.ok(reads >= 1, 'the write read the ledger');
  assert.equal(kicks.length, 2);
});

test('the background refresh: the ledger unmoved, the cache is renewed without a fetch; moved, it is fetched and read again', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const ledger = join(mkdtempSync(join(tmpdir(), 'p3-ledger-')), 'l.git');
  git(['init', '-q', '--bare', ledger], { cwd: root });
  const put = (pause) => {
    const w = makeRepo({ 'github/pause.json': JSON.stringify(pause) });
    git(['push', '-q', '-f', ledger, 'HEAD:refs/heads/process-state'], { cwd: w });
  };
  put({ at: '2026-11-07T00:00:00Z', until: '2026-11-07T00:01:00Z', why: 'first' });
  let t = Date.parse('2026-11-07T00:00:00Z');
  const sh = stateShare(root, null, { url: ledger, now: () => t });
  assert.equal(sh.refresh(), 'fetched');
  const c1 = JSON.parse(readFileSync(join(commonDir(root), LEDGER_CACHE), 'utf8'));
  assert.equal(c1.pause.why, 'first');
  assert.equal(c1.tip, git(['ls-remote', ledger, 'refs/heads/process-state'], { cwd: root }).split('\t')[0]);
  t += 60e3;
  const fetches = git(['rev-parse', 'refs/p3/ledger/state'], { cwd: root });
  assert.equal(sh.refresh(), 'unmoved');
  assert.equal(JSON.parse(readFileSync(join(commonDir(root), LEDGER_CACHE), 'utf8')).at, t, 'renewed');
  assert.equal(git(['rev-parse', 'refs/p3/ledger/state'], { cwd: root }), fetches);
  put({ at: '2026-11-07T00:00:30Z', until: '2026-11-07T00:02:00Z', why: 'second', stopped: true });
  assert.equal(sh.refresh(), 'fetched');
  const c3 = JSON.parse(readFileSync(join(commonDir(root), LEDGER_CACHE), 'utf8'));
  assert.equal(c3.pause.why, 'second');
  assert.equal(c3.pause.stopped, true);
  assert.equal(remoteStore(root, ledger).tip(), c3.tip);
});

test('one background refresh at a time per clone; a marker a minute old (a refresh killed) is taken over', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const entry = join(mkdtempSync(join(tmpdir(), 'p3-noop-')), 'noop.mjs');
  writeFileSync(entry, '');
  let t = 1e12;
  assert.equal(kickRefresh(root, { now: () => t, entry }), true);
  assert.equal(kickRefresh(root, { now: () => t + 5e3, entry }), false);
  t += 61e3;
  assert.equal(kickRefresh(root, { now: () => t, entry }), true);
  // The refresh taken over clears no successor's marker; its own it clears.
  refreshDone(root, String(t - 61e3));
  assert.equal(kickRefresh(root, { now: () => t + 1e3, entry }), false);
  refreshDone(root, String(t));
  assert.equal(kickRefresh(root, { now: () => t + 1e3, entry }), true);
  refreshDone(root);
});

test('the read path takes no cache of another ledger (a config changed); the background refresh, run as the hook runs it, fills this ledger\'s cache', () => {
  const ledger = join(mkdtempSync(join(tmpdir(), 'p3-ledger-')), 'l.git');
  const URL = 'https://github.com/o/ledger.git';
  const seed = makeRepo({ 'github/pause.json': JSON.stringify({ at: '2026-11-07T00:00:00Z', until: '2099-01-01T00:00:00Z', why: 'from the ledger' }) });
  git(['init', '-q', '--bare', ledger], { cwd: seed });
  git(['push', '-q', ledger, 'HEAD:refs/heads/process-state'], { cwd: seed });
  // A clone that names the ledger, reached by its GitHub name.
  const root = makeRepo({ 'pacing.json': JSON.stringify({ ledger: 'o/ledger' }) });
  git(['config', `url.${ledger}.insteadOf`, URL], { cwd: root });
  // A cache of another ledger, fresh, with a stop: not this clone's, so not obeyed.
  cacheAt(root, { at: Date.now(), pause: { at: '2026-11-07T00:00:00Z', until: '2026-11-07T00:01:00Z', why: 'elsewhere', stopped: true }, use: [], ledger: 'https://github.com/o/other.git', tip: 'a' });
  const kicks = [];
  assert.equal(hookRun({ tool_name: 'mcp__github__pull_request_read', tool_input: {} }, root, { kick: () => kicks.push(1), err: () => {} }), 0);
  assert.equal(kicks.length, 1, 'no cache of this ledger: a refresh is started');
  // The refresh, as kickRefresh starts it: its own process, its marker cleared at the end.
  const mark = String(Date.now());
  writeFileSync(join(commonDir(root), 'p3-gh-refreshing'), mark);
  const r = spawnSync(process.execPath, [HOOK, '--refresh'], { cwd: root, encoding: 'utf8', env: { ...process.env, P3_REFRESH_MARK: mark, P3_GITHUB_LOG: '0' } });
  assert.equal(r.status, 0, r.stderr);
  const c = JSON.parse(readFileSync(join(commonDir(root), LEDGER_CACHE), 'utf8'));
  assert.deepEqual([c.ledger, c.pause.why, !!c.tip], [URL, 'from the ledger', true]);
  assert.throws(() => readFileSync(join(commonDir(root), 'p3-gh-refreshing'), 'utf8'), /ENOENT/, 'the marker is cleared');
  // Now the read obeys this ledger's pause (here past the hook's wait cap: refused).
  const errs = [];
  assert.equal(hookRun({ tool_name: 'mcp__github__pull_request_read', tool_input: {} }, root, { kick: () => kicks.push(1), err: (m) => errs.push(m) }), 2);
  assert.match(errs.pop(), /GitHub rate-limited this account \(from the ledger\)/);
});

// ===== file: ends.mjs =====

// Self-ending records (R13; Bob, 6 Nov, about 17:00Z: "Go with option 2, fix it in the tool, not
// just for this case, but fix process3 to anticipate and address these kinds of situations").
// The case: holds hold-19 to hold-22, set "until layer 6 closes … ends when the coordinator says",
// went on holding after layer 6 closed, and ending them by hand (`p3 hold --end`) was refused by
// the session permission judge as weakening security. The rule (Foundations, Bob's, 6 Nov):
// recorded state carries a checkable end condition, the tool ends it when the condition holds,
// and stale state is found and cleared by the process, not by hand.
//
// A condition is one of (the string form, as --when takes it, and the row's object form):
//   layer_closed:<n>      layer n is closed (layers/closed.jsonl on the state branch, this
//                         tranche) or merged (layerflow/<n>/merged.json);
//   layer_open:<n>        layer n is open (layerflow/<n>/open.json) or already closed;
//   pr_merged:<n>         pull request n landed on the tranche (its first-parent merges);
//   module_complete:<id>  the module's ledger entry on the tranche is COMPLETE;
//   session_gone:<id>     the session is archived in list_sessions' result (only where the
//                         caller passes the list; an id the list does not hold is unknown);
//   at:<ISO time>         the time has passed.
// A record holds a list of them, any of which ends it. Each check answers met (true), not met
// (false) or unknown (null: its fact could not be read); only met ends a record.
//
// The inventory of recorded state that carries a condition or can go stale (state branch unless
// said), and how each ends (notes/records-inventory.md keeps the table):
//   holds (holds/holds.jsonl)            --prs, --until, --when: ENDED BY THE TOOL here; old
//                                        free-text rows read through fromText;
//   starts owed (flow/owed.json)         paid by the module's land on its layer (layer land),
//                                        by the tool already;
//   reschedules (layerflow/<n>)          answered by the user's land holding the provider's land,
//                                        by the tool already (layerflow outstanding);
//   layer events (layerflow/<n>)         open ends at merged, by the tool already;
//   lane seats (lanes/sessions.jsonl)    session_gone: ENDED BY THE TOOL at the sweep, which
//                                        reads list_sessions;
//   lane asks (lanes/asks.jsonl)         a recorded decision ends it (lane ask --record); STALE
//                                        when its lane is no longer configured: reported;
//   triage owed (notices/triage/owed)    triage recorded ends it, by the tool already;
//   role addresses (addresses/*.json)    session_gone: REPORTED (a role's address changes only
//                                        by handover or address, which name the next session);
//   config ids (coordinator)             session_gone: REPORTED (config changes by pull request);
//   BLOCKED marks (ledger)               a person's ruling: no condition the tool can check;
//                                        reported with their age by status already;
//   merger lease, in flight, plain queue the train's (being removed): time-limited already.
import { jsonl, readState } from './state.mjs';
import { LEDGER_DIR, git } from './util.mjs';

export const KINDS = ['layer_closed', 'layer_open', 'pr_merged', 'module_complete', 'session_gone', 'at'];
const SHAPE = {
  layer_closed: /^\d+$/, layer_open: /^\d+$/, pr_merged: /^[1-9]\d*$/,
  module_complete: /^[A-Za-z0-9._-]+$/, session_gone: /^session_[A-Za-z0-9]+$/, at: /^\d{4}-\d\d-\d\dT[\d:.]+Z$/,
};

// "layer_closed:6" -> { layer_closed: 6 }; throws a plain Error naming the form when it is not one.
export function parseCondition(s) {
  const m = String(s ?? '').trim().match(/^([a-z_]+):(.+)$/);
  if (!m || !KINDS.includes(m[1]) || !SHAPE[m[1]].test(m[2]) || (m[1] === 'at' && !Number.isFinite(Date.parse(m[2])))) {
    throw new Error(`${JSON.stringify(s)} is not a condition: ${KINDS.map((k) => `${k}:<${k === 'at' ? 'ISO time' : k.endsWith('gone') ? 'session id' : k === 'module_complete' ? 'module' : 'n'}>`).join(', ')}`);
  }
  return { [m[1]]: /^(layer_|pr_)/.test(m[1]) ? Number(m[2]) : m[2] };
}
export const parseConditions = (s) => String(s ?? '').split(',').map((x) => x.trim()).filter(Boolean).map(parseCondition);
export const condText = (c) => Object.entries(c).map(([k, v]) => `${k}:${v}`).join('');

// An old row's free-text end (the migration), read only where the words are the plain phrase and
// nothing else bears on the end: each ';'-clause is "until layer <n> closes" (or "opens"),
// optionally "start only layer <n> work" after it, optionally one parenthesis, and optionally a
// "<who> <date> <time>:" prefix; the only other clause allowed is "ends when the coordinator
// says", which the owner set aside for these holds (Bob, 6 Nov: the tool ends them). Anything
// else ("and", "unless", "after", a second condition, another sentence) is refused, with why.
// { conds } or { unparsed }.
const PREFIX = String.raw`(?:[A-Za-z][\w ,()-]*? \d{1,2} [A-Z][a-z]{2} \d{1,2}:\d{2}: )?`;
const PLAIN = new RegExp(String.raw`^${PREFIX}until layer (\d+) (closes|opens)(?: start only layer \1 work)?(?: \([^()]*\))?$`, 'i');
const SET_ASIDE = /^ends when the coordinator says$/i;
export function fromText(text) {
  const clauses = String(text ?? '').split(';').map((c) => c.trim()).filter(Boolean);
  const hits = clauses.map((c) => c.match(PLAIN));
  const conds = hits.filter(Boolean).map((m) => (m[2].toLowerCase() === 'closes' ? { layer_closed: Number(m[1]) } : { layer_open: Number(m[1]) }));
  if (!/\buntil layer \d+ (?:closes|opens)\b/i.test(String(text ?? ''))) return { unparsed: 'no "until layer <n> closes" or "opens" in its words' };
  if (conds.length !== 1) return { unparsed: conds.length ? 'more than one condition in its words' : 'its "until layer <n>" clause says more than the plain phrase' };
  const other = clauses.filter((c, i) => !hits[i] && !SET_ASIDE.test(c));
  if (other.length) return { unparsed: `its words say more than the condition ("${other[0].slice(0, 60)}")` };
  return { conds };
}

// The tranche's first-parent merges by pull request number (merge, merge --plain and GitHub's
// titles), shared with hold.mjs.
export const LANDED = /^Merge (?:job PR |PR |pull request #)(\d+)\b/;

// The facts the checks read, from this clone: the state branch (as fetched), the tranche, main and
// the ledger, each read once. A layer row counts for this tranche only when it names this
// tranche and its commit is not on main (the tranche branch keeps its name from tranche to
// tranche; status.mjs closedRows reads closes the same way); a row whose commit this clone cannot
// place is unknown, never met. listed: list_sessions' result (an array), or null (unknown).
export function readFacts(root, cfg, { listed = null, t = Date.now(), landed } = {}) {
  const sb = cfg.state_branch;
  const tr = `origin/${cfg.tranche}`;
  // main by its id, so util.git keeps each exact answer for the process (C50).
  const mainId = git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/main^{commit}'], { cwd: root, allowFail: true }).stdout.trim();
  const hasMain = !!mainId;
  const onMain = (c) => {
    if (!c || !/^[0-9a-f]{7,64}$/.test(String(c))) return null;
    if (!hasMain) return null;
    const r = git(['merge-base', '--is-ancestor', c, mainId], { cwd: root, allowFail: true });
    return r.code === 0 ? true : r.code === 1 ? false : null;
  };
  // This tranche's row: true, false (another tranche's), or null (cannot tell).
  const ours = (row, commit) => {
    if (!row || (row.tranche && row.tranche !== cfg.tranche)) return false;
    const m = onMain(commit);
    return m === null ? null : !m;
  };
  let closedRows = null;
  try { closedRows = jsonl(readState(root, sb, 'layers/closed.jsonl')).filter((r) => r.row === 'closed'); } catch { closedRows = null; }
  const flowCache = new Map();
  const flow = (n, kind) => {
    const k = `${n}/${kind}`;
    if (!flowCache.has(k)) {
      let v;
      try { const x = readState(root, sb, `layerflow/${n}/${kind}.json`); v = x === null ? undefined : JSON.parse(x); } catch { v = null; }
      flowCache.set(k, v);
    }
    return flowCache.get(k);
  };
  // Any of the rows for layer n met (true), else unknown if any could not be told (null), else false.
  const anyOurs = (pairs) => { let unk = false; for (const [row, c] of pairs) { const o = ours(row, c); if (o === true) return true; if (o === null) unk = true; } return unk ? null : false; };
  const layerClosed = (n) => {
    if (closedRows === null) return null;
    const m = flow(n, 'merged');
    if (m === null) return null;
    return anyOurs([...closedRows.filter((r) => Number(r.layer) === n).map((r) => [r, r.commit]), ...(m ? [[m, m.commit]] : [])]);
  };
  const layerOpen = (n) => {
    const o = flow(n, 'open');
    if (o === null) return null;
    const open = o ? ours(o, o.from) : false;
    if (open === true) return true;
    const c = layerClosed(n);
    return c === true ? true : open === null || c === null ? null : false;
  };
  let entries = null;
  const entry = (id) => {
    if (entries === null) entries = new Map();
    if (!entries.has(id)) {
      const r = git(['show', `${tr}:${LEDGER_DIR}/${id}.json`], { cwd: root, allowFail: true });
      let v = null;
      try { v = r.code === 0 ? JSON.parse(r.stdout) : undefined; } catch { v = null; }
      entries.set(id, v);
    }
    return entries.get(id);
  };
  let land = landed;
  const lands = () => {
    if (land === undefined) {
      const r = git(['log', '--first-parent', '--format=%s', tr], { cwd: root, allowFail: true });
      land = r.code === 0 ? new Set(r.stdout.split('\n').map((x) => x.match(LANDED)?.[1]).filter(Boolean).map(Number)) : null;
    }
    return land;
  };
  const sessions = Array.isArray(listed) ? new Map(listed.map((x) => [x.id, x])) : null;
  // The old account's sessions an account switch retired (switch.mjs RETIRED_FILE): gone, list or
  // no list, since the new account's list_sessions never holds them (R16).
  let retired = new Set();
  try { retired = new Set(JSON.parse(readState(root, sb, 'switch/retired.json') || '{}').sessions || []); } catch { retired = new Set(); }
  const archived = (x) => String(x.session_status || x.status || '').toLowerCase().replace(/^session_status_/, '') === 'archived';
  return {
    t,
    layerClosed,
    layerOpen,
    prMerged: (n) => { const l = lands(); return l === null ? null : l.has(n); },
    moduleComplete: (id) => { const e = entry(id); return e === null ? null : e === undefined ? false : e.status?.state === 'COMPLETE'; },
    // Archived in the list. A session the list does not hold is unknown, not gone: list_sessions
    // pages, and a short list is no proof an id is gone.
    sessionGone: (id) => { if (retired.has(id)) return true; if (!sessions) return null; const x = sessions.get(id); return x ? archived(x) : null; },
  };
}

// One condition against the facts: { met: true | false | null, why }.
export function checkCondition(c, f) {
  const [k, v] = Object.entries(c)[0] || [];
  const r = (met, why) => ({ met, why: `${k}:${v} ${met === true ? 'met' : met === false ? 'not met' : 'unknown'}${why ? ` (${why})` : ''}` });
  switch (k) {
    case 'layer_closed': return r(f.layerClosed(v));
    case 'layer_open': return r(f.layerOpen(v));
    case 'pr_merged': return r(f.prMerged(v));
    case 'module_complete': return r(f.moduleComplete(v));
    case 'session_gone': return r(f.sessionGone(v), f.sessionGone(v) === null ? 'no session list read' : '');
    case 'at': return r(f.t >= Date.parse(v));
    default: return { met: null, why: `${JSON.stringify(c)} is not a condition` };
  }
}
// The first met condition of a list, or null.
export const firstMet = (conds, f) => (conds || []).map((c) => ({ c, ...checkCondition(c, f) })).find((x) => x.met === true) || null;

// ===== file: rounds.mjs =====

// Rounds (BD-R1, Bob, 8 Nov): "Once a walk completes, that ends the current round, and a new round
// (of the same tranche) is started to work (layer by layer) to fix to those modules that have been
// identified as having flaws. This successive set of rounds continues until an internal walk
// doesn't find flaws, the release deployment happens, and the walk of the release also doesn't
// identify flaws."
//
// Round 1 is the map's layers (and the completion layer the copy opened under PD-12: "Finish, then
// switch"). A walk's findings enter as found marks against named modules (PLN-3, found.mjs). A later
// round is one round layer past the map (layerbase.mjs; PD-24, 9 Nov): every flawed module, whatever
// its map layer, read at its open; a mark found mid-round waits for the next round. A round ends at its walk: every layer it
// opened merged, no flawed module in a map layer after its last one, and a walk recorded after its
// last merge. That walk is the internal walk alone where the product configures one (C43; Bob, 8 Nov:
// "the internal walk would be the last step of a round, but the live walk would only run once a
// round completed without any flaws identified in the internal walk"), deploy dev's deploy and walk
// where it does not. A new round opens from that walk once its findings are recorded; a clean one
// leads to the release path (releaseNext): the cut, signed release, its deployment and its live walk.
import { NO_MODULE, REOPENS_DIR, coversOf, foundFile, foundMarks, FOUND_DIR } from './found.mjs';
import { completionItems } from './completion.mjs';
import { entryFile, ledgerIds, readLedgerTexts } from './ledger.mjs';
import { layerOf, layersAt, roundLayerName, roundOf } from './layerbase.mjs';
import { internalWalkOf } from './deploycfg.mjs';
import { jsonl, readState } from './state.mjs';
import { exists, git } from './util.mjs';

export const DEPLOYS_FILE = 'deploys/dev.jsonl';
// A release walk's rows: the walk of a cut development release installed on a p3dev- deployment.
// No path writes them yet (C39 gap: no install of the cut, signed release onto a p3dev- deployment
// exists); tranche close reads them, and names `deploy release <version>` until one is recorded.
export const RELEASE_WALKS_FILE = 'deploys/release.jsonl';
// The development releases cut (release dev --record's rows; release.mjs re-exports it).
export const RELEASES_FILE = 'releases/dev.jsonl';
// The rows a round's walk writes in DEPLOYS_FILE (C43, BD-R1): `round-walk`, the internal walk only,
// where the product configures one; `dev-deploy`, deploy dev's deploy and its walk, where it does not
// (Bob's exemption, or none set). Either ends a round; each has its start marker.
export const WALK_ROWS = ['round-walk', 'dev-deploy'];
export const START_ROWS = ['round-walk-start', 'dev-deploy-start'];
// The release path's gap (deploy.mjs deployRelease names it; status and tranche close print it).
export const RELEASE_PATH_GAP = 'no path yet installs the cut, signed release artifact onto a p3dev- deployment through the release\'s own installer path (process-dev-release cuts the draft release only; the product has no release-tier install-from-scratch or upgrade fixture; the installer installs only by an interactive sign-in)';
const P3 = 'node .process/tool/p3.mjs';

const textAt = (root, ref, f) => (exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null);
const hasCommit = (root, c) => git(['cat-file', '-e', `${c}^{commit}`], { cwd: root, allowFail: true }).code === 0;
const onMain = (root, c) => !!c && hasCommit(root, c) && git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/main'], { cwd: root, allowFail: true }).code === 0
  && git(['merge-base', '--is-ancestor', c, 'refs/remotes/origin/main'], { cwd: root, allowFail: true }).code === 0;

// This tranche's owed reopens (found.mjs REOPENS_DIR, C44): the findings recorded on the state
// branch for a module whose test pins its requirement ids, each until a round layer holds it.
export function owedReopens(root, cfg) {
  if (!root || !cfg?.state_branch) return [];
  const r = git(['ls-tree', '-r', '--name-only', '-z', `refs/remotes/origin/${cfg.state_branch}`, '--', `${REOPENS_DIR}/`], { cwd: root, allowFail: true });
  const files = r.code === 0 ? r.stdout.split('\0').filter((f) => f.endsWith('.json')) : [];
  return files.flatMap((f) => { try { const x = JSON.parse(readState(root, cfg.state_branch, f)); return x?.row === 'reopen' && x.module && x.key && (!x.tranche || !cfg.tranche || x.tranche === cfg.tranche) ? [x] : []; } catch { return []; } })
    .sort((a, b) => String(a.at).localeCompare(String(b.at)) || String(a.key).localeCompare(String(b.key)));
}
// The keys of the owed reopens a round layer holds already (its open row's items): its job's task.
export const heldReopens = (layers) => new Set((layers || []).flatMap((L) => (L.round?.items || []).map((x) => x.owe).filter(Boolean)));

// The modules identified as having flaws at `ref`: each ledger module, not BLOCKED, with an unmet
// found mark in its requirement file or its found-work entry, or an owed reopen no round layer
// holds yet (C44). id -> [{ id: 'F<n>' | 'O<n>', module, what, owe? }].
export function flawedModules(root, cfg, ref, { layers = null } = {}) {
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  const out = new Map();
  const reopens = owedReopens(root, cfg);
  const owedOf = (id) => reopens.filter((x) => x.module === id);
  let heldSet = null;
  const held = () => (heldSet ||= heldReopens(layers || (reopens.length ? layersAt(root, cfg, ref) : [])));
  for (const id of [...ledgerIds(root, ref)].sort()) {
    let e = null;
    try { e = JSON.parse(textAt(root, ref, entryFile(id)) || 'null'); } catch { e = null; }
    // A BLOCKED module is deferred in any layer: it would hold every round open (layerflow DONE).
    if (e?.status?.state === 'BLOCKED') continue;
    const req = typeof e?.requirements === 'string' ? e.requirements : `${dir}/${id}.md`;
    const marks = [...foundMarks(textAt(root, ref, req)), ...foundMarks(textAt(root, ref, foundFile(id)))];
    const items = marks.map((m) => ({ id: m.id, module: id, what: `${m.finding} (${m.source})` }));
    // Owed reopens, numbered O1.. per module in the order recorded (its held ones counted, so a
    // number is never reused within the tranche); one a round layer holds is that layer's job's.
    const owed = owedOf(id);
    owed.forEach((x, k) => { if (!held().has(x.key)) items.push({ id: `O${k + 1}`, module: id, what: `${x.finding} (${x.source}; owed reopen: add it as your own F mark and admit it in ${x.pin})`, owe: x.key }); });
    if (items.length) out.set(id, items);
  }
  return out;
}
// Findings no module owns yet: a round cannot place them until BOB names one.
export const unplaced = (root, ref) => foundMarks(textAt(root, ref, NO_MODULE));

// This tranche's round walks (WALK_ROWS: the round-close run's internal walk, or deploy dev's deploy
// and walk), not an earlier tranche's of the same name (its commit on main).
export function deployRowsOf(root, cfg) {
  return jsonl(readState(root, cfg.state_branch, DEPLOYS_FILE)).filter((r) => WALK_ROWS.includes(r.row) && r.tranche === cfg.tranche && !onMain(root, String(r.commit)));
}

// A run's findings and how many are recorded at `ref` (deploy.mjs walkFindings reads it): a failed
// run counts one at least, a walk its report's failures, the internal walk's the same; recorded are
// the unmet found marks whose source names the run (its slug and commit) and the completion items
// deferred naming it (known gaps).
export const runSource = (row) => `${row.slug} ${String(row.commit).slice(0, 10)}`;
// PD-16 (Bob, 8 Nov: "the live walk only runs once a round closes with no flaws found from the
// internal walk"): once the run's internal walk found flaws, its live arm's findings (a live arm run
// anyway, or stopped, as round 1's on p3dev-l12 was) hold no round; only the internal walk's count
// toward "each recorded" (set_aside: the live arm's, named in walkHold's message). A found mark or an
// owed reopen whose source says "covers <n>" counts as n findings (one flaw, many failures).
// round: a new round's open (layer open, the layer flow's view) is the only reader that sets the live
// arm aside; tranche close and release dev count every finding of the run, as before.
export function findingsOf(root, cfg, ref, last, { round = false } = {}) {
  if (!last) return { last, failing: 0, marks: 0, recorded: 0, set_aside: 0 };
  const iw = last.internal_walk;
  const inner = iw ? Math.max(iw.ok ? 0 : 1, Number(iw.failures) || 0) : 0;
  const live = Math.max(last.ok ? 0 : 1, Number(last.walk?.failures) || 0);
  const setAside = round && inner > 0 ? live : 0;
  const failing = inner + live - setAside;
  const tree = (d) => git(['ls-tree', '-r', '--name-only', ref, '--', d], { cwd: root, allowFail: true }).stdout.split('\n').filter((n) => n.endsWith('.md'));
  const reqs = Object.values(readLedgerTexts(root, ref)).flatMap((t) => { try { const r = JSON.parse(t).requirements; return typeof r === 'string' ? [r] : []; } catch { return []; } });
  const words = (t) => String(t).split(/[^a-z0-9-]+/);
  // With the live arm set aside, only what names the internal walk records its findings (a live-arm
  // mark would otherwise stand in for one: cold review of C44).
  // A round walk (C43) is its internal walk alone: the same, for its findings.
  const internal = setAside > 0 || (last.row === 'round-walk' && !!iw);
  const namesRun = (t) => { const w = words(t); return w.includes(last.slug) && w.includes(String(last.commit).slice(0, 10)); };
  const naming = (t) => namesRun(t) && (!internal || /\binternal walk\b/i.test(String(t)));
  let marks = 0;
  for (const f of new Set([...tree(cfg.requirements_dir.replace(/\/$/, '')), ...tree(FOUND_DIR), ...reqs])) {
    const r = git(['show', `${ref}:${f}`], { cwd: root, allowFail: true });
    if (r.code === 0) marks += foundMarks(r.stdout).filter((m) => naming(m.source)).reduce((a, m) => a + coversOf(m.source), 0);
  }
  // Owed reopens naming the run are recorded found work as marks are, held by a round layer or not.
  marks += owedReopens(root, cfg).filter((x) => naming(x.source)).reduce((a, x) => a + coversOf(x.source), 0);
  const gaps = (completionItems(root, cfg, ref)?.items || []).filter((x) => x.deferred && namesRun(x.what)).length; // a known gap is Bob's word, whichever walk it names
  return { last, failing, marks, recorded: marks + gaps, set_aside: setAside };
}
// The hold while a run's findings are not all recorded (tranche close, release dev, a new round's open).
const runName = (row) => (row.row === 'round-walk' ? 'internal walk' : 'deploy and walk');
// Whether a run's findings are recorded only by what names its internal walk: a round walk's (C43:
// the internal walk alone), or a deploy dev run's whose live arm is set aside (PD-16).
const internalOnly = (w) => !!w.set_aside || (w.last?.row === 'round-walk' && !!w.last.internal_walk);
export const walkHold = (w) => {
  if (!w.last || w.recorded >= w.failing) return null;
  const src = runSource(w.last);
  const aside = w.set_aside ? ` (the internal walk's; the live arm's ${w.set_aside} hold no round: its internal walk found flaws, PD-16)` : '';
  const from = internalOnly(w) || (w.last.internal_walk && !(w.last.internal_walk.ok === true && !(Number(w.last.internal_walk.failures) > 0))) ? `internal walk ${src}` : `walk ${src}`;
  return `the latest ${runName(w.last)} (${src}) ${w.last.ok ? 'walked' : `stopped at ${w.last.stopped}`} with ${w.failing} finding(s)${aside}, ${w.recorded} recorded: record each as a found mark (\`${P3} found <module> "<finding>" --from "${from}"\`, adding --covers <n> for one flaw behind n of them; a module whose test pins its requirement ids takes it as an owed reopen, recorded on the state branch by the same command), or a known gap (a completion item "deferred: <reason>" naming ${src}); the next round opens from them (BD-R1)`;
};

// Where the rounds stand at `ref` (the tranche), read from the layers (layersAt: the map's and those
// past it), each layer's flow rows (flows(n), layerflow.mjs flowRows), the flawed modules and the
// latest walk (deploy row). One of:
//   { state: 'layer', round, layer }          a layer of the round is open (not merged);
//   { state: 'next', round, next }            the round's next layer is owed (next: { n, round, of, mods, items });
//   { state: 'walk', round }                  every layer of the round merged: its walk ends it;
//   { state: 'new', round, next, walk }       the walk ended the round, and flawed modules open the next;
//   { state: 'clean', round, walk }           the walk ended the round, and no module is flawed.
export function roundState(root, cfg, ref, { layers, flows, lastWalk = null, flawed = flawedModules(root, cfg, ref) }) {
  const map = layers.filter((L) => !L.completion && !L.round);
  const extra = layers.filter((L) => L.completion || L.round);
  const lastMap = map.at(-1)?.n ?? 0;
  const nextN = (layers.at(-1)?.n ?? 0) + 1;
  const open = layers.find((L) => flows(L.n).open && !flows(L.n).merged);
  const round = Math.max(1, ...extra.map(roundOf));
  if (open) return { state: 'layer', round: roundOf(open), layer: open };
  // A module on no line of the map runs with the map's last layer.
  const place = (id) => layerOf(map, id) ?? lastMap;
  // PD-24 (coordinator, 9 Nov; Bob: "All jobs of a layer should open at once up to the maximum slot
  // cap"): a round after the first is ONE layer holding every flawed module, whatever its plan layer,
  // passing over the map's last layer (of), so no layer follows it in the round. Its modules in the
  // map's order (plan layer, then line; those on no line last); within the layer, R10's dependency
  // order lists them, and a provider's land reschedules a user that landed first.
  const plan = (after, r, walk) => {
    const ahead = [...flawed.keys()].filter((id) => place(id) > after);
    if (!ahead.length) return null;
    const lineOf = (id) => { const L = map.find((x) => x.n === place(id)); return (L?.mods.indexOf(id) ?? -1) + 1 || 1e9; };
    const mods = ahead.sort((a, b) => (place(a) - place(b)) || (lineOf(a) - lineOf(b)) || a.localeCompare(b));
    return { n: nextN, round: r, of: lastMap, mods, items: mods.flatMap((id) => flawed.get(id)), ...(walk ? { walk } : {}) };
  };
  const mine = extra.filter((L) => roundOf(L) === round && L.round);
  // Round 1 ran every map layer; a later round, the map layers up to its last round layer's.
  const lastOf = round === 1 ? lastMap : Math.max(0, ...mine.map((L) => L.round.of));
  const more = round === 1 ? null : plan(lastOf, round);
  if (more) return { state: 'next', round, next: more };
  // The round's last merge; a walk after it ended the round.
  const merges = layers.map((L) => flows(L.n).merged?.at).filter(Boolean).sort();
  const lastMerge = merges.at(-1) || null;
  const walked = !!lastWalk && (!lastMerge || String(lastWalk.at) > String(lastMerge));
  if (!walked) return { state: 'walk', round };
  const walk = runSource(lastWalk);
  const next = plan(0, round + 1, walk);
  return next ? { state: 'new', round: round + 1, next, walk } : { state: 'clean', round, walk };
}
export const roundLine = (rs) => ({
  layer: () => `round ${rs.round} is open: ${rs.layer.round ? roundLayerName(rs.round, rs.layer.round.of, rs.layer.n) : `layer ${rs.layer.n}`} has not merged`,
  next: () => `round ${rs.round} is open: ${roundLayerName(rs.round, rs.next.of, rs.next.n)} is next, for ${rs.next.mods.join(', ')}: \`${P3} layer open ${rs.next.n}\` (or \`${P3} round next --apply\`, with its job starts)`,
  walk: () => `every layer of round ${rs.round} has merged: its walk ends it (the round-close run)`,
  new: () => `the walk ${rs.walk} ended round ${rs.round - 1}; round ${rs.round} opens from its findings: ${roundLayerName(rs.round, rs.next.of, rs.next.n)} for ${rs.next.mods.join(', ')}: \`${P3} layer open ${rs.next.n}\` (or \`${P3} round next --apply\`, with its job starts)`,
  clean: () => `the walk ${rs.walk} ended round ${rs.round}, and no module is flawed: the release path follows a clean internal walk (BD-R1)`,
}[rs.state]());

// The walk is clean (BD-R1: "doesn't find flaws"): the run's internal walk ran ok with no failure.
export const internalClean = (row) => !!row?.internal_walk && row.internal_walk.ok === true && !(Number(row.internal_walk.failures) > 0);
export const walkClean = (row) => !!row && row.ok === true && !(Number(row.walk?.failures) > 0);
// The round-close run is clean, as release dev and tranche close both read it: its internal walk
// where the run has one or the config requires one (a required walk that did not run is not
// clean); else, exempt by Bob's word or unconfigured, the run's own walk.
export const internalRequired = (cfg, row) => !!row?.internal_walk || (() => { try { return !!internalWalkOf(cfg.deploy?.internal_walk)?.walk; } catch { return true; } })();
export const runClean = (cfg, row) => (internalRequired(cfg, row) ? internalClean(row) : walkClean(row));
// The run passes (release dev, tranche close): clean, or every finding of it a known gap (a completion
// item deferred naming it, by Bob's word) and none a found mark, so no flaw is left for a round.
export const runPassed = (cfg, w) => !!w?.last && (runClean(cfg, w.last) || (w.failing > 0 && w.marks === 0 && w.recorded >= w.failing));
// The release path, once a round's internal walk is clean (BD-R1, C43): the one next act, or null.
// Owed when the round closed at a walk after its last merge ('clean'), that walk's findings are all
// recorded and none is a flaw (runPassed: known gaps deferred on Bob's word pass), and the product
// cuts releases: first the cut, signed release (release dev) after that walk, then its release
// deployment and live walk (deploy release, a named gap today). A release walk recorded, clean or
// not, owes nothing here: tranche close reads it, and its findings open the next round. Under plan
// close the tranche ends where it stands, and no release is owed (tranche.mjs trancheEnd).
export function releaseNext(root, cfg, { rc, w, plan, ref }) {
  if (plan === 'close' || !cfg.release || !rc?.closed || rc.rounds?.state !== 'clean' || !w?.last || walkHold(w) || !runPassed(cfg, w)) return null;
  // A finding no module owns holds the tranche's end (trancheEnd): BOB names its module first.
  if (ref && unplaced(root, ref).length) return null;
  const rel = releasesCut(root, cfg, w.last);
  if (!rel) return { why: `${rc.round}'s ${internalRequired(cfg, w.last) ? 'internal walk' : 'walk'} ${runSource(w.last)} is clean, and no release is cut since`, act: `${P3} release dev, from a clean checkout of the tranche tip (the cut, signed release), then ${P3} deploy release <version>, its release deployment and live walk (BD-R1)` };
  const walked = releaseWalks(root, cfg).filter((r) => r.version === rel.version);
  // BD-R5 (Bob, 9 Nov): clean with no AI account, the non-AI journeys are done; the AI-assisted ones
  // wait for Bob's account. Reported, not a wake: the act is Bob's (sweep puts gap acts in found).
  const clean = (r) => r.ok === true && !(Number(r.failures) > 0);
  const last = walked.at(-1);
  if (last && clean(last) && last.ai !== true && !walked.some((r) => r.ai === true && clean(r))) return { why: `release ${rel.version}'s walk is clean on the non-AI journeys (no AI account configured, BD-R5)`, act: `Bob configures the AI account; then walk.ai is set true and ${P3} deploy release ${rel.version} walks the AI-assisted journeys too, before the installer and site updates`, gap: true };
  if (walked.length) return null;
  return { why: `release ${rel.version} is cut since the clean ${internalRequired(cfg, w.last) ? 'internal walk' : 'walk'} ${runSource(w.last)}`, act: `${P3} deploy release ${rel.version}, its release deployment and live walk (BD-R1); GAP: ${RELEASE_PATH_GAP}, brought to Bob through the coordinator`, gap: true };
}
// The latest successful development release of this tranche recorded after the walk `last`, and cut
