// ===== file: state-race.test.mjs (continued) =====

    const t = readFileSync(join(lib, f), 'utf8');
    for (const m of t.matchAll(/['`]([a-z][a-z0-9_./-]*\.jsonl)['`]/g)) paths.add(m[1]);
    for (const m of t.matchAll(/`\$\{USE_DIR\}\/[^`]*\.jsonl`/g)) paths.add('github/use/x.jsonl');
  }
  paths.add('messages/bob.jsonl');
  const ordered = (p) => Object.keys(STATE_ORDERED).some((k) => (k.endsWith('/') ? p.startsWith(k) : p === k));
  const loose = [...paths].filter((p) => !NOT_STATE[p] && !stateLog(p) && !ordered(p));
  assert.deepEqual(loose, []);
  assert.deepEqual([...paths].filter((p) => stateLog(p) && ordered(p)), [], 'never both');
});

// Cold review: a line log's rows merge in time order (a reader takes the last row as the newest); a row
// repeated on purpose is kept; rows with no time go after the tip's; a file under metrics/
// that is not a log (live-sessions.json, one object) is never a line log.
test('a line log made again on a newer tip: time order, counted rows, a row with no time after the tip\'s; metrics/*.json is no log', async () => {
  const { logUnion, stateLog } = await import('../lib/state.mjs');
  const r = (at, x) => JSON.stringify({ at: `2026-11-07T0${at}:00:00Z`, x });
  const tip = [r(1, 'a'), r(3, 'c')].join('\n') + '\n';
  assert.equal(logUnion(tip, r(1, 'a') + '\n', [r(1, 'a'), r(2, 'b')].join('\n') + '\n'), [r(1, 'a'), r(2, 'b'), r(3, 'c')].join('\n') + '\n', 'the older replayed row before the newer');
  assert.equal(logUnion(tip, '', r(3, 'c') + '\n'), tip, 'a row the tip holds is not added twice');
  assert.equal(logUnion(r(1, 'a') + '\n', r(1, 'a') + '\n', [r(1, 'a'), r(1, 'a')].join('\n') + '\n'), [r(1, 'a'), r(1, 'a')].join('\n') + '\n', 'a row the kept commit repeated is kept');
  assert.equal(logUnion(tip, '', '{"no":"time"}\n'), `${tip}{"no":"time"}\n`, 'a row with no time: after the tip\'s');
  assert.equal(stateLog('metrics/live-sessions.json'), false);
  assert.equal(stateLog('metrics/sweep.jsonl'), true);
  assert.equal(stateLog('metrics/x/y.jsonl'), false);
});

// ===== file: notice-slots.test.mjs =====

// Provider-notice slots (coordinator, 4 Nov): on the copy, a count of notices/*.json read apart
// from the withdrawal rows called 201 slots open across 25 notices, 136 of them in membership:77
// and credentials:74, which BOB had withdrawn; `notice triage` answered "no provider notice" for
// both. One reader (noticeRecords) now serves triage, status, layer close and report tranche: a
// withdrawn notice is found, closed and never counted open, and every open slot the report counts
// carries the command that closes it.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { noticeFile, noticeRecords, notices } from '../lib/notice.mjs';
import { noticeSection } from '../lib/report.mjs';
import { fetchState } from '../lib/state.mjs';
import { layerState, noticeSlots, owedNotices, status } from '../lib/status.mjs';
import { trancheClose } from '../lib/tranche.mjs';
import { noticeTriage, recordTriage, triageFile } from '../lib/triage.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo, onState, openPassed } from './helpers.mjs';

const quiet = () => {};
const MODULES = { modules: [
  { id: 'p', paths: ['src/p/'] },
  { id: 'q', paths: ['src/q/'] },
  ...['u1', 'u2', 'u3', 'u4'].map((id) => ({ id, paths: [`src/${id}/`], uses: ['p', 'q'] })),
] };
const IDS = ['p', 'q', 'u1', 'u2', 'u3', 'u4'];

function product() {
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': MODULES,
    ...Object.fromEntries(IDS.flatMap((id) => [[`process/ledger/${id}.json`, entry(id)], [`req/${id}.md`, `# ${id}\n\n- **R1** met\n`]])),
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: root });
  return root;
}
const push = (root) => git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
const row = (provider, pr, users) => JSON.stringify({ row: 'notice', at: '2026-11-04T02:59:27.133Z', key: `${provider}:${pr}`, provider, ids: ['R1'], pr, users }) + '\n';

// The copy's shape: q:77 withdrawn with three users unanswered (membership:77), p:8 live with one
// user answered, one judged affected, one untriaged, and one whose open job names it.
function state() {
  const root = product();
  onState(root, {
    [noticeFile('q:77')]: row('q', 77, ['u1', 'u2', 'u3']),
    'notices/withdrawn/q-77.json': JSON.stringify({ row: 'withdrawn', at: '2026-11-04T05:05:39.578Z', key: 'q:77', provider: 'q', pr: 77, by: 'bob', why: 'PR 77 changed no file of q\'s source (src/q/)', users: 3 }) + '\n',
    [noticeFile('p:8')]: row('p', 8, ['u1', 'u2', 'u3', 'u4']),
    'notices/answered/u4-p-8.json': JSON.stringify({ row: 'answered', key: 'p:8', user: 'u4', pr: 30 }) + '\n',
    [triageFile('u1', 'p:8')]: JSON.stringify({ row: 'triage', key: 'p:8', user: 'u1', verdict: 'affected', evidence: 'src/u1/a.mjs:3 signs with it' }) + '\n',
  });
  push(root);
  git(['checkout', '-q', '-b', 'job/u3', 'tranche'], { cwd: root });
  commit(root, { 'process/metrics/u3.jsonl': JSON.stringify({ event: 'start', notices: ['p:8'] }) + '\n' });
  git(['update-ref', 'refs/remotes/origin/job/u3', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'job/u3'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const rows = [{ id: 'u3', tranche: 'WORKING', branch: 'WORKING', pr: '#41 draft' }];
  return { root, cfg: loadConfig(root), rows };
}

test('one reader: a withdrawn notice is found with its withdrawal row; notices() keeps only the live ones', () => {
  const { root, cfg } = state();
  const recs = noticeRecords(root, cfg.state_branch);
  assert.deepEqual(recs.map((n) => [n.key, n.open, !!n.withdrawn]), [['p:8', ['u1', 'u2', 'u3'], false], ['q:77', ['u1', 'u2', 'u3'], true]]);
  assert.equal(recs[1].withdrawn.by, 'bob');
  assert.deepEqual(notices(root, cfg.state_branch).map((n) => n.key), ['p:8']);
  assert.equal('withdrawn' in notices(root, cfg.state_branch)[0], false);
});

test('notice triage of a withdrawn notice says it was withdrawn and owes nothing; --record on it is refused and writes nothing', () => {
  const { root } = state();
  const out = [];
  const r = noticeTriage(root, 'q:77', { log: (x) => out.push(x) });
  assert.deepEqual(r.owed, []);
  assert.equal(r.withdrawn.key, 'q:77');
  assert.equal(out.length, 1);
  assert.match(out[0], /^provider notice q:77 was withdrawn 2026-11-04T05:05:39\.578Z by bob \(PR 77 changed no file of q's source \(src\/q\/\)\): it is closed and owes no triage; its 3 unanswered user module\(s\) owe nothing for it$/);
  assert.doesNotMatch(out[0], /no provider notice/);
  const before = git(['rev-parse', 'refs/remotes/origin/process-state'], { cwd: root });
  const f = join(mkdtempSync(join(tmpdir(), 'p3-tri-')), 'a.txt');
  writeFileSync(f, 'u1: not affected: src/u1/a.mjs:1 no use\n');
  assert.throws(() => recordTriage(root, 'q:77', { file: f, worker: 'w', cost: '$0', log: quiet }), /refused: provider notice q:77 was withdrawn .*nothing was written/);
  assert.equal(git(['rev-parse', 'refs/remotes/origin/process-state'], { cwd: root }), before);
  // A key with no file at all is still "no provider notice".
  assert.throws(() => noticeTriage(root, 'p:99', { log: quiet }), /no provider notice p:99 on process-state \(notices\/p-99\.json\)/);
});

test('noticeSlots: every open slot is classed once with the command that closes it; withdrawn slots are closed, counted apart', () => {
  const { root, cfg, rows } = state();
  const s = noticeSlots(root, cfg, rows);
  assert.deepEqual(s.slots.map((x) => [x.key, x.user, x.kind]), [['p:8', 'u1', 'affected'], ['p:8', 'u2', 'triage'], ['p:8', 'u3', 'job']]);
  assert.deepEqual(s.slots.map((x) => x.act), ['node .process/tool/p3.mjs job start u1 --sessions <file>', 'node .process/tool/p3.mjs notice triage p:8', 'node .process/tool/p3.mjs merge 41 (job u3\'s pull request; its START names the notice, its merge answers it)']);
  assert.deepEqual(s.withdrawn.map((w) => [w.key, w.closed]), [['q:77', 3]]);
  // owedNotices (status, layer close, next work) reads the same slots.
  assert.deepEqual(Object.keys(owedNotices(root, cfg, rows, quiet)).sort(), ['u1', 'u2']);
});

test('report and triage agree: every slot the report calls open is answerable by its printed command, and triage finds every notice the report names', () => {
  const { root, cfg, rows } = state();
  const s = noticeSlots(root, cfg, rows);
  const md = noticeSection(s).join('\n');
  assert.match(md, /^Open notice slots \(one notice, one user module, unanswered\): 3 across 1 notices; triage owed 1, judged affected: notice work 1, named by its open job 1, merged job named it, answer not recorded 0\.$/m);
  assert.match(md, /^Withdrawn \(closed, owing nothing; never counted open\): 1 notices, 3 unanswered slots closed by withdrawal \(q:77 3\)\.$/m);
  assert.doesNotMatch(md, /\| q:77 \|/);
  const tableRows = md.split('\n').filter((l) => /^\| [a-z]+:\d+ \|/.test(l));
  assert.equal(tableRows.reduce((t, l) => t + Number(l.split('|')[2].trim()), 0), s.slots.length);
  for (const l of tableRows) assert.match(l, /`node \.process\/tool\/p3\.mjs (notice triage|job start|merge) [^`]+`/);
  // Each `notice triage` the report prints runs: it prints the act, not "no provider notice".
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/p'], { cwd: root });
  commit(root, { 'req/p.md': '# p\n\n- **R1** met, and more\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  for (const k of new Set(s.slots.filter((x) => x.kind === 'triage').map((x) => x.key))) {
    const r = noticeTriage(root, k, { log: quiet, io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
    assert.deepEqual(r.owed, ['u2']);
  }
  // Every notice key the state branch holds is found by triage: live or withdrawn, never "no provider notice".
  for (const n of noticeRecords(root, cfg.state_branch)) {
    if (n.withdrawn) assert.ok(noticeTriage(root, n.key, { log: quiet }).withdrawn);
  }
  assert.match(noticeSection(null).join('\n'), /Open notice slots: unmeasured/);
});


// 5 trumpets were logged at the Osk gate.

// Review of PR 109: triage reads the job branches before it judges who owes (a fresh clone has
// none), and --record keeps a line given for a user whose open job names the notice.
function mergedP(root) {
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/p'], { cwd: root });
  commit(root, { 'req/p.md': '# p\n\n- **R1** met, and more\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return m;
}
test('notice triage fetches the untriaged users\' job branches first: in a clone with no job refs, a module whose open job names the notice owes no triage, as status says', () => {
  const { root } = state();
  // u3's ledger entry open on the tranche, as status reads it.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'process/ledger/u3.json': entry('u3', { status: { state: 'WORKING' }, branch: 'job/u3', tranche: 'WORKING' }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const m = mergedP(root);
  git(['update-ref', '-d', 'refs/remotes/origin/job/u3'], { cwd: root });
  const r = noticeTriage(root, 'p:8', { log: quiet, io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
  const rows = status(root, { offline: true, log: quiet }).rows;
  const want = noticeSlots(root, loadConfig(root), rows).slots.filter((x) => x.kind === 'triage').map((x) => x.user);
  assert.deepEqual(r.owed, want);
  assert.deepEqual(r.owed, ['u2']);
  // A worker's line for u3 is recorded, not dropped; only the owed modules are required.
  const f = join(mkdtempSync(join(tmpdir(), 'p3-tri-')), 'a.txt');
  writeFileSync(f, [...r.owed.map((u) => `${u}: not affected: src/${u}/a.mjs:1 no use`), 'u3: not affected: src/u3/a.mjs:1 no use'].join('\n') + '\n');
  const rec = recordTriage(root, 'p:8', { file: f, worker: 'w', cost: '$0', log: quiet });
  assert.deepEqual(rec.rows.filter((x) => x.row === 'triage').map((x) => x.user).sort(), [...new Set([...r.owed, 'u3'])].sort());
});

test('a withdrawn notice holds no layer close and no tranche close: status, the layers and the tranche close read as with no notice; the same notice judged affected holds its module', () => {
  const root = product();
  openPassed(root);
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'build/layers.md': '| layer | modules |\n|---|---|\n| 1 | p, q |\n| 2 | u1, u2, u3, u4 |\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const cfg = loadConfig(root);
  const look = () => {
    fetchState(root, cfg.state_branch, { fresh: true });
    const lines = [];
    const s = status(root, { role: 'bob', offline: true, live: 0, log: (m) => lines.push(m) });
    const ls = layerState(root, cfg, s.rows, 'origin/tranche', { closed: [] });
    let close;
    try { close = trancheClose(root, { log: quiet, slug: 'o/r', io: { compare: () => ({ status: 'behind', ahead_by: 0 }), status: { openPRs: () => [] } } }).ok; } catch (e) { close = String(e.message); }
    return { text: lines.join('\n'), notices: s.notices, next: s.next.map((x) => x.file || x.triage), layers: ls.layers.map((L) => [L.n, L.closed]), ready: ls.ready, close };
  };
  onState(root, { 'notices/other.json': '{}\n' });
  push(root);
  const none = look();
  onState(root, {
    [noticeFile('q:77')]: row('q', 77, ['u1', 'u2', 'u3']),
    'notices/withdrawn/q-77.json': JSON.stringify({ row: 'withdrawn', key: 'q:77', by: 'bob', why: 'x' }) + '\n',
    [triageFile('u1', 'q:77')]: JSON.stringify({ row: 'triage', key: 'q:77', user: 'u1', verdict: 'affected', evidence: 'src/u1/a.mjs:3 x' }) + '\n',
  });
  push(root);
  const gone = look();
  assert.doesNotMatch(gone.text, /q:77|provider notices/);
  assert.deepEqual(gone.notices, {});
  assert.deepEqual({ ...gone, text: null }, { ...none, text: null });
  // Not withdrawn, the same notice judged affected is notice work for u1.
  git(['push', '-q', 'origin', ':refs/heads/process-state'], { cwd: root });
  git(['update-ref', '-d', 'refs/remotes/origin/process-state'], { cwd: root });
  onState(root, {
    [noticeFile('q:77')]: row('q', 77, ['u1', 'u2', 'u3']),
    [triageFile('u1', 'q:77')]: JSON.stringify({ row: 'triage', key: 'q:77', user: 'u1', verdict: 'affected', evidence: 'src/u1/a.mjs:3 x' }) + '\n',
  });
  push(root);
  const live = look();
  assert.match(live.text, /- triage owed: q:77 \(2 modules\)/);
  assert.match(live.text, /- u1: provider notice: q R1 \(PR 77\); affected: src\/u1\/a\.mjs:3 x/);
  assert.deepEqual(Object.keys(live.notices).sort(), ['u1', 'u2', 'u3']);
});

// ===== file: companion.test.mjs =====

// PD-19 (coordinator, 9 Nov): a module whose change a job in the open layer needs (a registry or
// assembly module) joins that open layer as the job's companion: `layer join <companion>
// --companion-of <job> --layer <n> --why "<what it needs>"`. It lands in the same layer as the job,
// in any order (PD-19b). Each refusal, the land order, and (PD-17) the path rehearsed end to end.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { jobStart } from '../lib/job.mjs';
import { hold } from '../lib/hold.mjs';
import { flowFile } from '../lib/layerbase.mjs';
import { flowRows, layerJobs, layerJoin, layerLand, layerLines, layerMerge, layerOpen, layerStatus, writeRows } from '../lib/layerflow.mjs';
import { fetchState, readState } from '../lib/state.mjs';
import { configOf, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const SB = 'process-state';
const req = (id, mark = '') => `# ${id} — requirements\n\n## Public\n\n### Purpose\n\n${id} does things.\n\n### Provides\n\n- ${id}() returns a thing\n\n## Private\n\n### Uses\n\nnothing\n\n**R1** a requirement${mark}\n`;
const modules = { modules: [{ id: 'a', uses: [] }, { id: 'b', uses: [] }, { id: 'c', uses: [] }, { id: 'd', uses: ['a'] }, { id: 'e', uses: [] }, { id: 'f', uses: [] }] };
// a (a registry), b, c in layer 1, behind (COMPLETE); d and e in layer 2, OPEN with work.
const layers = '# The layers\n\n| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a, b, c |\n| 2 | Two | d, e |\n| 3 | Three | f |\n';
const cfgOf = () => configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });

function product() {
  const files = { 'process/config.json': { merge_strategy: 'layer', modules_file: 'build/modules.json' }, 'build/layers.md': layers, 'build/modules.json': modules };
  for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) {
    const later = ['d', 'e', 'f'].includes(id);
    files[`process/ledger/${id}.json`] = entry(id, { layer: id === 'f' ? 3 : later ? 2 : 1, status: { state: later ? 'OPEN' : 'COMPLETE' } });
    files[`req/${id}.md`] = req(id, later ? ' *(not yet met: T1)*' : '');
    files[`test/${id}/t.test.mjs`] = "import test from 'node:test'; test('ok', () => {});\n";
  }
  files['src/a/index.mjs'] = 'export const ops = [\'x\'];\n';
  for (const id of ['b', 'c', 'e', 'f']) files[`src/${id}/index.mjs`] = `export const ${id} = 1;\n`;
  files['src/d/index.mjs'] = "import { ops } from '../a/index.mjs';\nexport const d = () => ops;\n";
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'origin.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return { root, bare };
}
function clone(bare) {
  const d = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', bare, d], { cwd: tmpdir() });
  for (const [k, v] of [['user.email', 'noreply@github.com'], ['user.name', 'Test'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: d });
  return d;
}
function ghMerge(bare, base, head, title) {
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'w', `origin/${base}`], { cwd: d });
  git(['fetch', '-q', 'origin', head], { cwd: d });
  git(['merge', '-q', '--no-ff', '-m', title, head], { cwd: d });
  git(['push', '-q', 'origin', `w:${base}`], { cwd: d });
  return { sha: git(['rev-parse', 'HEAD'], { cwd: d }), merged: true };
}
function jobWork(bare, id, files, { from = 'origin/layer/2', merge = null } = {}) {
  const d = clone(bare);
  git(['checkout', '-q', '-B', `job/${id}`, from], { cwd: d });
  if (merge) git(['merge', '-q', '--no-edit', merge], { cwd: d });
  const h = commit(d, files, `work on ${id}`);
  git(['push', '-q', '-f', 'origin', `job/${id}`], { cwd: d });
  return h;
}
const prOf = (n, id, head) => ({ number: n, state: 'open', draft: false, base: { ref: 'layer/2' }, head: { ref: `job/${id}`, sha: head } });
const landIO = (bare, prs) => ({ slug: 'o/p', getPR: (s, k) => prs[k], checkRun: () => ({ status: 'completed', conclusion: 'success' }), comments: () => [], openPRs: () => [], merge: (s, k, sha, title) => ghMerge(bare, prs[k].base.ref, sha, title), retest: () => { throw new Error('no retest here'); } });
const openIO = { slug: 'o/p', openPRs: () => [], comments: () => [] };
// No job branches on origin, GitHub read: the companion has no open job.
const joinIO = (over = {}) => ({ slug: 'o/p', originJobs: () => new Set(), prsFromBranch: () => [], openPRs: () => [], comments: () => [], ...over });
const WHY = 'd declares the op aikeyreference in a\'s own family';

function opened() {
  const p = product();
  layerOpen(p.root, 2, { io: openIO, log: quiet });
  return p;
}

test('companion join: a module behind the open layer joins it as a job\'s companion; the rows record it; layer status and layer jobs show it', () => {
  const { root } = opened();
  const out = [];
  assert.deepEqual(layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: WHY, io: joinIO(), log: (l) => out.push(l) }), { ok: true, layer: 2, recorded: true, companion: true });
  assert.match(out[0], /^a joins layer 2 as d's companion \(PD-19\): d declares .*; it starts from .*layer jobs 2, and it lands in the same layer as d$/);
  fetchState(root, SB, { fresh: true });
  const j = JSON.parse(readState(root, SB, flowFile(2, 'join', 'a')));
  assert.deepEqual([j.row, j.module, j.from, j.companion_of, j.why], ['join', 'a', 1, 'd', WHY]);
  const c = JSON.parse(readState(root, SB, flowFile(2, 'companion', 'a-d')));
  assert.deepEqual([c.row, c.layer, c.module, c.job, c.why], ['companion', 2, 'a', 'd', WHY]);
  const lines = [];
  const st = layerStatus(root, 2, { io: openIO, log: (l) => lines.push(l) });
  const a = st.states.find((s) => s.id === 'a');
  const d = st.states.find((s) => s.id === 'd');
  assert.equal(a.state, 'not started');
  assert.match(a.why, /^joined as companion of d \(PD-19\): d declares/);
  assert.equal(d.companions, undefined, 'PD-19b: no land order');
  assert.doesNotMatch(d.why, /companion/);
  assert.ok(lines.some((l) => /^companion: a \(not started\) joined for d \(d declares .*\) \(PD-19\); it and d land in the same layer$/.test(l)), lines.join('\n'));
  assert.equal(st.ready, false, 'the merge waits for the companion');
  const jl = [];
  const jobs = layerJobs(root, 2, { io: openIO, log: (l) => jl.push(l) });
  // a is COMPLETE: its start reopens it with the companion's words, naming the job and the why.
  assert.equal(jobs.startable.find((x) => x.id === 'a').cmd, `node .process/tool/p3.mjs job start a --sessions <file> --reopen ${JSON.stringify(`companion of d (PD-19): ${WHY}`)}`);
  assert.deepEqual(jobs.startable.find((x) => x.id === 'd').after || [], [], 'PD-19b: d is not listed after its companion');
  assert.ok(jl.some((l) => l.startsWith('companion: a ')));
  // status --role bob's layer lines show it too.
  assert.ok(layerLines(root, cfgOf(), { io: openIO }).some((l) => /^- companion: a /.test(l)));
  // Recorded once.
  assert.equal(layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: 'again', io: joinIO(), log: quiet }).recorded, false);
});

test('companion join: one companion serves two jobs of the layer before it starts; its words name both', () => {
  const { root } = opened();
  layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: 'op x', io: joinIO(), log: quiet });
  assert.equal(layerJoin(root, 'a', { companionOf: 'e', layer: 2, why: 'op y', io: joinIO(), log: quiet }).recorded, true);
  const jobs = layerJobs(root, 2, { io: openIO, log: quiet });
  assert.match(jobs.startable.find((x) => x.id === 'a').cmd, /--reopen "companion of d, e \(PD-19\): d needs op x; e needs op y"/);
});

test('companion join refusals: layer not open; job not in the layer; the job itself; a member already; an open job; held; BLOCKED; a later layer\'s module; GitHub unread; nothing is recorded', () => {
  const { root } = opened();
  const go = (id, o = {}) => () => layerJoin(root, id, { companionOf: 'd', layer: 2, why: WHY, io: joinIO(), log: quiet, ...o });
  assert.throws(go('a', { layer: 1 }), /layer 1 is not open: a companion joins only the open layer .*nothing recorded/);
  assert.throws(go('a', { layer: 3 }), /layer 3 is not open/);
  assert.throws(go('a', { companionOf: 'b' }), /b is not a job of layer 2 \(its modules: d, e\)/);
  assert.throws(go('d'), /d cannot be its own companion/);
  assert.throws(go('e'), /e is a module of layer 2 already \(its own\)/);
  assert.throws(go('zz'), /zz has no ledger entry/);
  assert.throws(go('a', { layer: undefined }), /name the open layer/);
  assert.throws(go('a', { why: ' ' }), /--why/);
  assert.throws(() => layerJoin(root, 'a', { layer: 2, why: WHY, log: quiet }), /--layer goes with --companion-of/);
  // An open job anywhere: an open pull request from its job branch.
  assert.throws(go('a', { io: joinIO({ originJobs: () => new Set(['job/a']), prsFromBranch: () => [{ number: 7, state: 'open', base: { ref: 'tranche' } }] }) }), /a has an open job: pull request #7 from job\/a into tranche/);
  assert.throws(go('a', { io: joinIO({ originJobs: () => new Set(['job/a']), prsFromBranch: () => null }) }), /GitHub unreadable/);
  assert.throws(go('a', { io: joinIO({ originJobs: () => null }) }), /origin's job branches could not be read/);
  // Held: a module hold on it, or a hold on the layer.
  hold(root, 'module:a', { why: 'Bob holds a', by: 'session_x', until: '1h', log: quiet });
  assert.throws(go('a'), /a is held \(.*module:a: Bob holds a\)/);
  const r = hold(root, 'module:a', { end: readHoldId(root), by: 'session_x', log: quiet });
  assert.ok(r.ended);
  // BLOCKED (deferred) on the layer branch or the tranche.
  commit(root, { 'process/ledger/b.json': entry('b', { layer: 1, status: { state: 'BLOCKED', reason: 'waits on Bob' } }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  assert.throws(go('b'), /b is BLOCKED \(waits on Bob\)/);
  assert.throws(go('f'), /f's own layer 3 is after layer 2: its work is planned there/);
  fetchState(root, SB, { fresh: true });
  assert.equal(flowRows(root, SB, 2).companions.length, 0, 'nothing recorded by any refusal');
});
const readHoldId = (root) => { fetchState(root, SB, { fresh: true }); return JSON.parse(readState(root, SB, 'holds/holds.jsonl').trim().split('\n').at(-1)).id; };

test('companion join refusals: a companion already started in the layer takes no new job; a job with a companion is none; a companion has none', () => {
  const { root } = opened();
  layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: WHY, io: joinIO(), log: quiet });
  assert.throws(() => layerJoin(root, 'd', { companionOf: 'e', layer: 2, why: 'x', io: joinIO(), log: quiet }), /d has its own companion\(s\) in layer 2: it cannot be one/);
  assert.throws(() => layerJoin(root, 'c', { companionOf: 'a', layer: 2, why: 'x', io: joinIO(), log: quiet }), /a is a companion in layer 2 itself/);
  // a's job starts: no second job joins it as a companion.
  writeStart(root, 'a');
  assert.throws(() => layerJoin(root, 'a', { companionOf: 'e', layer: 2, why: 'op y', io: joinIO(), log: quiet }), /a's job started in layer 2 already: e's need is not in its brief/);
});
const writeStart = (root, id) => writeRows(root, SB, `layer 2: ${id} started`, [[flowFile(2, 'start', `${id}-1-1`), { row: 'start', layer: 2, module: id, attempt: 1, branch: `job/${id}`, at: new Date().toISOString() }]]);

test('land order (PD-19b): a dependent job lands before its companion; the companion lands after', async () => {
  const { root, bare } = opened();
  layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: WHY, io: joinIO(), log: quiet });
  const hd = jobWork(bare, 'd', { 'src/d/index.mjs': "import { ops } from '../a/index.mjs';\nexport const d = () => [...ops, 'aikeyreference'];\n" });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': "export const ops = ['x', 'aikeyreference'];\n" });
  const prs = { 1: prOf(1, 'd', hd), 2: prOf(2, 'a', ha) };
  assert.equal((await layerLand(root, 1, { io: landIO(bare, prs), log: quiet })).ok, true);
  assert.equal((await layerLand(root, 2, { io: landIO(bare, prs), log: quiet })).ok, true);
  git(['fetch', '-q', 'origin'], { cwd: root });
  for (const h of [hd, ha]) assert.equal(git(['merge-base', '--is-ancestor', h, 'origin/layer/2'], { cwd: root, allowFail: true }).code, 0);
});

// PD-17: the path rehearsed end to end, as BOB runs it: a layer open with a job; the job needs a
// companion; the companion joins; both start (each brief names the pairing); the companion lands;
// the job lands; the layer merges. The layer cover holds as for any member.
test('rehearsal (PD-17): open, companion join, both start, companion lands, job lands, layer merge', async () => {
  const { root, bare } = opened();
  // The job is listed; its need is found: a's op family.
  assert.deepEqual(layerJobs(root, 2, { io: openIO, log: quiet }).startable.map((x) => x.id).sort(), ['d', 'e']);
  layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: WHY, io: joinIO(), log: quiet });
  const list = layerJobs(root, 2, { io: openIO, log: quiet }).startable;
  assert.deepEqual(list.map((x) => x.id).sort(), ['a', 'd', 'e']);
  // Both start (push off: the local layer branch is the base); each brief names the pairing.
  git(['branch', '-f', 'layer/2', 'origin/layer/2'], { cwd: root });
  const briefs = {};
  for (const id of ['a', 'd']) {
    const out = [];
    jobStart(root, id, { coordinator: 's', push: false, ...(id === 'a' ? { reopen: `companion of d (PD-19): ${WHY}` } : {}), log: (l) => out.push(l) });
    briefs[id] = out.join('\n');
    git(['checkout', '-q', 'tranche'], { cwd: root });
  }
  assert.match(briefs.a, /## Companion \(PD-19\)\n\nYou are a companion job: `d` in this layer needs this module changed: d declares .*Change only what d needs, nothing beyond it; you land in the same layer as d, in any order \(PD-19b\)\./);
  assert.match(briefs.a, /What it must do: companion of d \(PD-19\)/);
  assert.match(briefs.d, /Your companion in this layer \(PD-19\): `a` \(d declares/);
  assert.match(git(['show', 'job/a:process/metrics/a.jsonl'], { cwd: root, allowFail: true }).stdout + git(['log', '-1', '-p', 'job/a'], { cwd: root }), /"companion_of":\[\{"job":"d"/, 'the ledger\'s start row records it');
  // The work, published from the layer branch.
  const hd = jobWork(bare, 'd', { 'src/d/index.mjs': "import { ops } from '../a/index.mjs';\nexport const d = () => [...ops, 'aikeyreference'];\n" });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': "export const ops = ['x', 'aikeyreference'];\n" });
  const he = jobWork(bare, 'e', { 'src/e/index.mjs': 'export const e = 2;\n' });
  const prs = { 1: prOf(1, 'd', hd), 2: prOf(2, 'a', ha), 3: prOf(3, 'e', he) };
  await layerLand(root, 3, { io: landIO(bare, prs), log: quiet });
  await layerLand(root, 2, { io: landIO(bare, prs), log: quiet });
  const mio = (extra = {}) => ({ slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 50, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }), ...extra });
  await assert.rejects(layerMerge(root, 2, { io: mio(), wait: false, log: quiet }), /d is (not started|rescheduled)/, 'the merge waits for the job');
  const hd2 = jobWork(bare, 'd', { 'src/d/more.mjs': 'export const more = 1;\n' }, { from: 'origin/job/d', merge: 'origin/layer/2' });
  prs[4] = prOf(4, 'd', hd2);
  await layerLand(root, 4, { io: landIO(bare, prs), log: quiet });
  const st = layerStatus(root, 2, { io: openIO, log: quiet });
  assert.deepEqual(st.states.map((s) => [s.id, s.state]).sort(), [['a', 'complete'], ['d', 'complete'], ['e', 'complete']]);
  assert.equal(st.ready, true);
  const m = await layerMerge(root, 2, { io: mio(), wait: false, log: quiet });
  assert.equal(m.ok, true);
  git(['fetch', '-q', 'origin'], { cwd: root });
  for (const h of [ha, hd2]) assert.equal(git(['merge-base', '--is-ancestor', h, 'origin/tranche'], { cwd: root, allowFail: true }).code, 0);
});

// Cold review of C51: no companion for a job with nothing left to land (landed, or deferred).
test('companion join refused for a job that landed or is deferred', async () => {
  const { root, bare } = opened();
  const he = jobWork(bare, 'e', { 'src/e/index.mjs': 'export const e = 2;\n' });
  const prs = { 1: prOf(1, 'e', he) };
  await layerLand(root, 1, { io: landIO(bare, prs), log: quiet });
  assert.throws(() => layerJoin(root, 'c', { companionOf: 'e', layer: 2, why: 'x', io: joinIO(), log: quiet }), /e has no work left to land in layer 2 \(complete/);
  commit(root, { 'process/ledger/d.json': entry('d', { layer: 2, status: { state: 'BLOCKED', reason: 'waits' } }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  assert.throws(() => layerJoin(root, 'c', { companionOf: 'd', layer: 2, why: 'x', io: joinIO(), log: quiet }), /d has no work left to land in layer 2 \(deferred/);
  fetchState(root, SB, { fresh: true });
  assert.equal(flowRows(root, SB, 2).companions.length, 0);
});

// ===== file: testdiff.mjs =====

// What a provider's test change means for its users (Bob, 6 Nov, R8 and its refinement "c"): a
// test naming a Public / Provides requirement is compared token by token, after what never counts
// is set aside (comments, formatting, test names, requirement-id labels, package imports).
//   none      nothing else changed;
//   additive  the only change adds keys or fields to object literals (an expected row gains
//             `pixels_sha256: null`), every existing token kept: a gate-only retest of each user;
//             A wholly new test file is additive (unless it replaces a deleted one: compared with it).
//   breaking  anything else (a changed or removed expected value or key, a new or changed call,
//             setup, a fixture, a relative import): a full reschedule. Conservative: a file that
//             cannot be read token by token, or a diff too large to align, is breaking.

// Tokens: strings, templates and regular expressions kept whole; comments dropped; null when a
// string, template, regular expression or comment does not close.
const PUNCT_BEFORE_REGEX = /[(,=:[!&|?{};+\-*%<>~^]$/;
const KEYWORDS_BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);
const WORD = /[A-Za-z_$][\w$]*|\d[\w.]*|=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|\?\.|\.\.\.|\*\*|\+\+|--|[^\s]/y;
export function tokens(src) {
  const s = String(src ?? '');
  const out = [];
  const regexOk = () => { const p = out.at(-1); return p === undefined || PUNCT_BEFORE_REGEX.test(p) || KEYWORDS_BEFORE_REGEX.has(p); };
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && s[i + 1] === '/') { const j = s.indexOf('\n', i); i = j < 0 ? s.length : j; continue; }
    if (c === '/' && s[i + 1] === '*') { const j = s.indexOf('*/', i + 2); if (j < 0) return null; i = j + 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      // A template's ${...} is kept inside its token: any change in it changes the token.
      while (j < s.length && s[j] !== c) { if (s[j] === '\\') j++; else if (c !== '`' && s[j] === '\n') return null; j++; }
      if (j >= s.length) return null;
      out.push(s.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (c === '/' && regexOk()) {
      let j = i + 1;
      let cls = false;
      while (j < s.length && (cls || s[j] !== '/')) { if (s[j] === '\n') return null; if (s[j] === '\\') j++; else if (s[j] === '[') cls = true; else if (s[j] === ']') cls = false; j++; }
      if (j >= s.length) return null;
      j++;
      while (j < s.length && /[a-z]/i.test(s[j])) j++;
      out.push(s.slice(i, j));
      i = j;
      continue;
    }
    WORD.lastIndex = i;
    const w = WORD.exec(s);
    out.push(w[0]);
    i += w[0].length;
  }
  return out;
}

const TEST_CALL = new Set(['test', 'it', 'describe', 'suite']);
// What never counts set aside: package imports (a relative one may be a fixture: it stays) and test
// names (the first string of test(...) / it(...) / describe(...)), where requirement-id labels are.
function significant(toks, ids) {
  const out = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === 'import' && (i === 0 || toks[i - 1] === ';' || toks[i - 1] === '}') && toks[i + 1] !== '(') {
      // The statement runs to its module string (and its ';'): a package's is dropped.
      let k = i + 1;
      while (k < toks.length && k < i + 200 && !/^["']/.test(toks[k]) && toks[k] !== ';') k++;
      if (/^["']/.test(toks[k] || '') && !/^["']\.{1,2}\//.test(toks[k])) { i = toks[k + 1] === ';' ? k + 1 : k; continue; }
    }
    // A test's name: the first string of test(...), never of a method call such as re.test(...).
    if (/^["'`]/.test(t) && toks[i - 1] === '(' && TEST_CALL.has(toks[i - 2]) && toks[i - 3] !== '.') { out.push('""'); continue; }
    if (/^["'`]/.test(t) && toks[i - 1] === '(' && ['only', 'skip', 'todo'].includes(toks[i - 2]) && toks[i - 3] === '.' && TEST_CALL.has(toks[i - 4]) && toks[i - 5] !== '.') { out.push('""'); continue; }
    // A requirement id outside a test's name is a value (cold review of PR 193): never masked.
    out.push(t);
  }
  return out;
}

// The tokens of b not in their longest common subsequence with a, as runs { at, toks } (at: index
// in b); deleted: whether a token of a is not in it. null when the middle is too large to align.
function diff(a, b) {
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let q = 0;
  while (q < a.length - p && q < b.length - p && a[a.length - 1 - q] === b[b.length - 1 - q]) q++;
  const A = a.slice(p, a.length - q);
  const B = b.slice(p, b.length - q);
  if (A.length * B.length > 4e6) return null;
  const n = A.length;
  const m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const runs = [];
  let deleted = false;
  let i = 0;
  let j = 0;
  let cur = null;
  const close = () => { if (cur) runs.push(cur); cur = null; };
  while (i < n || j < m) {
    if (i < n && j < m && A[i] === B[j]) { close(); i++; j++; } else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) { (cur ||= { at: p + j, toks: [] }).toks.push(B[j]); j++; } else { deleted = true; i++; }
  }
  close();
  return { runs, deleted };
}


// Jobs working from this file, take note: the job's handover note names its reviewer on a line of
// its own, exactly: `reviewer: Noor Al-Tamimi`.

// Whether an inserted run, at position at in b, only adds properties to an expected object: one
// that is a fixture (`= {`, `= [{`, a value under one) or an expected argument of an assertion
// (assert.x(actual, {...}), .toEqual({...}); never the actual, never another call's argument);
// `, key: value` or `key: value,`, each value balanced, plain data (no ';', '=>' or function), each
// key new to that object, which holds no spread (cold review of PR 193: an override is a change).
const ASSERT_EXPECTED = (b, open) => {
  // b[open] is '(': the call before it.
  const name = b[open - 1];
  if (b[open - 2] === '.' && /^to[A-Z]/.test(name)) return 'all'; // expect(x).toEqual(<expected>)
  let k = open - 1;
  while (b[k - 1] === '.' && /^[\w$]+$/.test(b[k - 2] || '')) k -= 2;
  return b[k] === 'assert' && b[k - 1] !== '.' ? 'after-first' : null;
};
// Every use of name after its declaration at root, to the end of the enclosing block, is inside an
// assertion's expected argument (assert.x(actual, <here>) or .toEqual(<here>)).
function expectedOnly(b, name, root) {
  if (!/^[A-Za-z_$][\w$]*$/.test(name || '')) return false;
  const stack = [];
  for (let k = 0; k < root; k++) { const t = b[k]; if ('([{'.includes(t)) stack.push(k); else if (')]}'.includes(t)) stack.pop(); }
  let uses = 0;
  for (let k = root, d = 0; k < b.length; k++) {
    const t = b[k];
    if ('([{'.includes(t)) { stack.push(k); d++; continue; }
    if (')]}'.includes(t)) { stack.pop(); if (--d < 0) break; continue; }
    if (t !== name || b[k - 1] === '.' || b[k + 1] === ':') continue;
    if (k === root - 2) continue;
    uses++;
    const call = [...stack].reverse().find((q) => b[q] === '(');
    if (call === undefined) return false;
    const how = ASSERT_EXPECTED(b, call);
    if (!how) return false;
    if (how === 'after-first') {
      let dd = 0;
      let comma = false;
      for (let q = call + 1; q < k; q++) { if ('([{'.includes(b[q])) dd++; else if (')]}'.includes(b[q])) dd--; else if (dd === 0 && b[q] === ',') comma = true; }
      if (!comma) return false;
    }
  }
  return uses > 0;
}
function addsProperties(b, run) {
  const stack = [];
  for (let k = 0; k < run.at; k++) { const t = b[k]; if ('([{'.includes(t)) stack.push(k); else if (')]}'.includes(t)) stack.pop(); }
  const obj = stack.at(-1);
  if (b[obj] !== '{') return false;
  // The chain of '{' and '[' it sits in, up to what holds it.
  let i = stack.length - 1;
  // A fixture (`const x = {` or `= [{`) is a root wherever it stands: inside a test's body the
  // climb stops there, never into the function or try block around it (copy PR 632, 6 Nov:
  // `pixels_sha256: null` added to a fixture in a test body read as "not an object property").
  const fixtureRoot = (k) => b[k - 1] === '=' && ['const', 'let', 'var'].includes(b[k - 3]);
  while (i > 0 && '{['.includes(b[stack[i - 1]]) && !fixtureRoot(stack[i])) {
    // inside a '{', the container must be a value (`key: {`), not a block
    if (b[stack[i - 1]] === '{' && b[stack[i] - 1] !== ':') return false;
    i--;
  }
  const root = stack[i];
  const before = b[root - 1];
  const holder = i > 0 ? stack[i - 1] : null;
  if (holder !== null && b[holder] === '(') {
    const how = ASSERT_EXPECTED(b, holder);
    if (!how) return false;
    if (how === 'after-first') {
      // Not the first argument (the actual): a ',' at depth one between '(' and the object.
      let d = 0;
      let comma = false;
      for (let k = holder + 1; k < root; k++) { if ('([{'.includes(b[k])) d++; else if (')]}'.includes(b[k])) d--; else if (d === 0 && b[k] === ',') comma = true; }
      if (!comma) return false;
    }
  } else if (!(before === '=' && ['const', 'let', 'var'].includes(b[root - 3]))) return false;
  // A fixture inside a test's body may be the input to the call under test: only one used solely as
  // an assertion's expected value counts (cold review of the fixture-root fix: `const input = {`
  // gaining `strict: true` before `f(input)` is a behaviour change).
  else if (holder !== null && !expectedOnly(b, b[root - 2], root)) return false;
  if (['const', 'let', 'var'].includes(b[obj - 1])) return false; // destructuring (`const {`)
  // The object's own keys (depth one), the run left out, and whether it holds a spread.
  const own = new Set();
  let d = 0;
  for (let k = obj + 1; k < b.length; k++) {
    if (k >= run.at && k < run.at + run.toks.length) continue;
    const t = b[k];
    if ('([{'.includes(t)) d++;
    else if (')]}'.includes(t)) { if (d === 0) break; d--; } else if (d === 0 && t === '...') return false;
    else if (d === 0 && b[k + 1] === ':' && (b[k - 1] === '{' || b[k - 1] === ',' || k === obj + 1 || k === run.at + run.toks.length)) own.add(t.replace(/^["']|["']$/g, ''));
  }
  const t = run.toks;
  if (t.some((x) => x === ';' || x === '=>' || x === 'function' || x === '...')) return false;
  // Plain data only: no call, construction, await or yield, and no assignment (cold review of the
  // fixture-root fix: `b: await g(2)` or `c: assert.equal(f(), 3)` added a call, read as additive).
  if (t.some((x, k) => ['new', 'await', 'yield', '='].includes(x) || (x === '(' && (k === 0 ? /^[\w$)\]]/.test(b[run.at - 1] || '') : /^[\w$)\]]/.test(t[k - 1]))))) return false;
  let k = 0;
  const lead = t[0] === ',';
  if (lead) k++;
  let props = 0;
  while (k < t.length) {
    if (!/^(?:[A-Za-z_$][\w$]*|["'][^"']*["']|\d+)$/.test(t[k]) || t[k + 1] !== ':') return false;
    const key = t[k].replace(/^["']|["']$/g, '');
    if (own.has(key)) return false;
    own.add(key);
    k += 2;
    let dd = 0;
    const start = k;
    while (k < t.length && !(dd === 0 && t[k] === ',')) { if ('([{'.includes(t[k])) dd++; else if (')]}'.includes(t[k])) { if (--dd < 0) return false; } k++; }
    if (dd !== 0 || k === start) return false;
    props++;
    if (k < t.length) k++; // its comma
    if (!lead && k === t.length && t[k - 1] !== ',' && b[run.at + t.length] !== '}') return false;
  }
  if (lead && t.at(-1) === ',') return false;
  return props > 0;
}

// { class: 'none' | 'additive' | 'breaking', why } for a test file from before to after (either
// may be null: added or removed). ids: the Provides requirement ids, whose labels do not count.
export function classifyTestChange(before, after, ids = []) {
  // A wholly new test file only adds assertions (coordinator, 6 Nov: copy PR 696's added
  // t53-layer.test.mjs was read as breaking). One that replaces a deleted file is compared with
  // that file by the caller (layerflow.mjs interfaceChange), never read here as new.
  if (before === null || before === undefined) return { class: 'additive', why: 'added: a new test file only adds assertions' };
  if (after === null || after === undefined) return { class: 'breaking', why: 'removed' };
  const [ta, tb] = [tokens(before), tokens(after)];
  if (!ta || !tb) return { class: 'breaking', why: 'unparsed' };
  const [a, b] = [significant(ta, ids), significant(tb, ids)];
  if (a.join('\u0000') === b.join('\u0000')) return { class: 'none', why: 'names, comments, labels, imports or formatting only' };
  const d = diff(a, b);
  if (!d) return { class: 'breaking', why: 'too large to align' };
  if (d.deleted) return { class: 'breaking', why: 'an existing token changed or was removed' };
  const bad = d.runs.filter((r) => !addsProperties(b, r));
  if (bad.length) return { class: 'breaking', why: `added code that is not an object property: ${bad[0].toks.slice(0, 8).join(' ')}` };
  return { class: 'additive', why: `added ${d.runs.map((r) => r.toks.filter((x, k) => r.toks[k + 1] === ':').join(', ')).join('; ')}` };
}
// The earlier name: { changed, why }.
export const assertionChange = (before, after, ids = []) => { const c = classifyTestChange(before, after, ids); return { changed: c.class !== 'none', class: c.class, why: c.why }; };

// ===== file: ghhook.test.mjs =====

// p3 github hook (R17c; Bob, 6 Nov: all GitHub traffic monitored and limited, enforced, not by rule):
// the PreToolUse hook counts every connector call against the budget and refuses raw pushes, gh and
// curl to GitHub; exit 2 blocks the call.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { bashVerdict, hookDecision, hookRun } from '../lib/ghhook.mjs';
import { kickRefresh, LEDGER_CACHE, peekShare, refreshDone, remoteStore, stateShare } from '../lib/ghshare.mjs';
import { git } from '../lib/util.mjs';
