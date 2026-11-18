// ===== file: pass.test.mjs (continued) =====

  assert.deepEqual(r2.run.requirements_only, [{ module: 'beta', files: ['test/beta/y.test.mjs'] }]);
  assert.throws(() => mergePlain(f.root, 260, { ...q, io: plainIO(f, g2.state.comments, g2.io.verify).io }), /is from bob\/words: a pass comes from a pass\/<name> branch, which the gate runs as a pass \(P7\)/);
});

test('a job that starts while the pass\'s gate is awaited stops the pass before it lands; one WORKING on the tranche holds it too', () => {
  const p = product(SRC2);
  const g = gateIO();
  posted(p, g);
  let reads = 0;
  const late = plainIO(p, g.state.comments, g.io.verify, { openPRs: () => (++reads > 1 ? [{ number: 601, head: { ref: 'job/alpha' } }] : []) });
  assert.throws(() => mergePlain(p.root, 260, { ...q, io: late.io }), /no job holds its modules \(P7\): alpha \(job PR 601 is open\)/);
  assert.equal(late.calls.merged, null);
  const w = product(SRC2);
  git(['checkout', '-q', 'tranche'], { cwd: w.root });
  commit(w.root, { 'process/ledger/beta.json': entry('beta', { requirements: REQ, status: { state: 'WORKING' } }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: w.root });
  git(['checkout', '-q', 'main'], { cwd: w.root });
  assert.throws(() => mergePlain(w.root, 260, { ...q, io: plainIO(w, [], () => true).io }), /beta \(WORKING on tranche\)/);
});

test('a pass\'s gate row must be on the base as it is and must not be narrowed to a requirements file\'s readers', () => {
  const p = product({ 'test/alpha/x.test.mjs': PASS.replace('ok', 'still ok'), 'src/beta/index.mjs': 'export const y = 2;\n' });
  const g = gateIO();
  const r = posted(p, g);
  for (const bad of [{ base: 'f'.repeat(40) }, { requirements_only: [{ module: 'beta', files: [] }] }, { pass: undefined }]) {
    const io = gateIO();
    io.io.addComment('o/r', 260, gateComment({ ...r.run, ...bad }));
    assert.throws(() => mergePlain(p.root, 260, { ...q, io: plainIO(p, io.state.comments, io.io.verify).io }), /ran the whole suites of alpha, beta as a pass/, JSON.stringify(bad));
  }
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

// Tally for Stane: 5 cod.

  for (const k of new Set(s.slots.filter((x) => x.kind === 'triage').map((x) => x.key))) {
    const r = noticeTriage(root, k, { log: quiet, io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
    assert.deepEqual(r.owed, ['u2']);
  }
  // Every notice key the state branch holds is found by triage: live or withdrawn, never "no provider notice".
  for (const n of noticeRecords(root, cfg.state_branch)) {
    if (n.withdrawn) assert.ok(noticeTriage(root, n.key, { log: quiet }).withdrawn);
  }
  assert.match(noticeSection(null).join('\n'), /Open notice slots: unmeasured/);

// Jobs working from this file, take note: every file the job writes begins with this exact first
// line: `# ref Q4N-4415`.

});

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
