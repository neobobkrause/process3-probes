// The provider-change route: a provider with two users, a notice at the provider's merge, the
// users' START and status, and the notice answered at the user's merge.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, block } from '../lib/github.mjs';
import { jobComplete, jobStart } from '../lib/job.mjs';
import { merge, triageLast } from '../lib/merge.mjs';
import { readRows } from '../lib/metrics.mjs';
import { prPresence } from '../lib/github.mjs';
import { changedIds, noticeFile, noticeLine, notices, mergedHere, providerChange, providerNotice, recordAtMerge, unanswered, withdrawNotice } from '../lib/notice.mjs';
import { fetchState, readState } from '../lib/state.mjs';
import { owedNotices, status } from '../lib/status.mjs';
import { importFree, noticeTriage, parseTriage, recordTriage, shares, sizes, triageAtMerge } from '../lib/triage.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo, onState, openPassed } from './helpers.mjs';

const quiet = () => {};
const passing = (name) => `import test from 'node:test'; test('${name}', () => {});\n`;
const REQ = '# p\n\n- **R1** *(not yet met: x)* signs a token\n- **R2** checks a token\n- **R3** keeps a log\n';
const MODULES = { modules: [
  { id: 'p', paths: ['src/p/'] },
  { id: 'u1', paths: ['src/u1/'], uses: ['p'] },
  { id: 'u2', paths: ['src/u2/'], uses: ['p'] },
  { id: 'other', paths: ['src/other/'] },
] };

// A provider p and its users u1 and u2 (and a module that uses nothing), with an origin.
function product() {
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': MODULES,
    ...Object.fromEntries(['p', 'u1', 'u2', 'other'].flatMap((id) => [
      [`process/ledger/${id}.json`, entry(id)],
      [`req/${id}.md`, id === 'p' ? REQ : `# ${id}\n\n- **R1** met\n`],
      [`test/${id}/a.test.mjs`, passing(`${id} ok`)],
    ])),
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: root });
  return root;
}
const NOTICE = { row: 'notice', key: 'p:7', provider: 'p', ids: ['R1', 'R2', 'R4'], pr: 7, users: ['u1', 'u2'] };

test('changedIds: struck, reworded, added and removed requirements; an unchanged one is not', () => {
  const after = '# p\n\n- **R1** signs a token\n- **R2** checks a token and its age\n- **R4** rotates keys\n';
  assert.deepEqual(changedIds(REQ, after), ['R1', 'R2', 'R3', 'R4']);
  assert.deepEqual(changedIds(REQ, REQ), []);
});

test('a provider notice names the changed ids and the modules whose uses name the provider', () => {
  const root = product();
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const head = commit(root, { 'src/p/a.mjs': 'export const sign = 2;\n', 'req/p.md': REQ.replace('*(not yet met: x)* ', '').replace('checks a token', 'checks a token and its age') });
  const cfg = loadConfig(root);
  assert.deepEqual(providerNotice(root, cfg, { provider: 'p', requirements: 'req/p.md', base, head, pr: 7 }),
    { key: 'p:7', provider: 'p', ids: ['R1', 'R2'], pr: 7, users: ['u1', 'u2'], source: 1, exports_read: { base, head, files: [] } });
  assert.equal(providerNotice(root, cfg, { provider: 'u1', requirements: 'req/u1.md', base, head, pr: 8 }), null, 'no change, no notice');
  const other = commit(root, { 'req/other.md': '# other\n\n- **R1** met, reworded\n' });
  assert.equal(providerNotice(root, cfg, { provider: 'other', requirements: 'req/other.md', base: head, head: other, pr: 9 }), null, 'a change no module uses leaves no notice');
});

// The copy, 4 Nov: membership PR 77 notified 108 users and credentials PR 74 39 for changes only to
// tests and requirement marks. The copy's entries list the requirements file among their paths.
test('a job that changed only tests, requirements text, docs or records leaves no notice, and says why; one that changed a source file does', () => {
  const root = product();
  const e = entry('p', { paths: ['src/p/', 'req/p.md'] });
  const cfg = loadConfig(root);
  const base = commit(root, { 'process/ledger/p.json': e, 'src/p/a.mjs': 'export const sign = 1;\n' });
  const struck = REQ.replace('*(not yet met: x)* ', '');
  const tests = commit(root, { 'test/p/b.test.mjs': passing('p signs'), 'req/p.md': struck, 'src/p/README.md': '# p\n', 'src/p/docs/x.txt': 'x\n', 'process/metrics/p.jsonl': '{}\n' });
  const r = providerChange(root, cfg, { provider: 'p', requirements: 'req/p.md', base, head: tests, pr: 77 });
  assert.equal(r.notice, null);
  assert.match(r.why, /^PR 77 changed R1 but no file of p's source \(src\/p\/\): only tests, requirements text, docs or records, which cannot change a user's behaviour; no notice for its 2 user\(s\)$/);
  const src = commit(root, { 'src/p/a.mjs': 'export const sign = 2;\n' });
  assert.deepEqual(providerChange(root, cfg, { provider: 'p', requirements: 'req/p.md', base, head: src, pr: 78, entry: e }).notice,
    { key: 'p:78', provider: 'p', ids: ['R1'], pr: 78, users: ['u1', 'u2'], source: 1, exports_read: { base, head: src, files: [] } });
});

test('recordAtMerge writes the notice once and an answer per user; the other user still owes it', () => {
  const root = product();
  const cfg = loadConfig(root);
  const { row, ...notice } = NOTICE;
  assert.equal(recordAtMerge(root, cfg, { notice, user: 'p', pr: 7 }).rows.length, 1);
  assert.equal(recordAtMerge(root, cfg, { notice, user: 'p', pr: 7 }).rows.length, 0, 'a rerun adds nothing');
  assert.equal(recordAtMerge(root, cfg, { answers: ['p:7'], user: 'u1', pr: 9 }).rows.length, 1);
  fetchState(root, cfg.state_branch, { fresh: true });
  assert.deepEqual(notices(root, cfg.state_branch).map((n) => n.open), [['u2']]);
  assert.deepEqual(unanswered(root, cfg.state_branch, 'u1'), []);
  assert.equal(unanswered(root, cfg.state_branch, 'u2')[0].key, 'p:7');
});

test('job start <user> puts the notice in the START and its start row; a notice-only job with no code change completes records-only, asking no test', () => {
  const root = product();
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  const { start } = jobStart(root, 'u1', { coordinator: 's', push: false, log: quiet });
  assert.match(start, /## Provider notices/);
  assert.match(start, /`p:7`: `p` changed R1, R2, R4 \(PR 7\)/);
  assert.match(start, /confirm or adapt this module's code; the merge records the answer/);
  assert.doesNotMatch(start, /--test notice:/);
  git(['checkout', '-q', 'job/u1'], { cwd: root });
  assert.deepEqual(readRows(root, 'u1')[0].notices, ['p:7']);
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const r = jobComplete(root, 'u1', { push: false, log: quiet });
  assert.equal(r.ok, true);
  assert.ok(git(['diff', '--name-only', base, 'HEAD'], { cwd: root }).split('\n').every((f) => f.startsWith('process/')), 'records only');
});

test('job start on a COMPLETE user with a notice reopens it to answer the notice', () => {
  const root = product();
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'process/ledger/u2.json': entry('u2', { status: { state: 'COMPLETE' } }) });
  git(['checkout', '-q', 'main'], { cwd: root });
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  const { start } = jobStart(root, 'u2', { coordinator: 's', push: false, log: quiet });
  assert.match(start, /reopens the module after an earlier attempt merged\. What it must do: answer the provider notice p:7/);
});

// The copy, 4 Nov: one struck requirement listed 56 notice-only jobs. Until triage records, a
// notice is one line, BOB's act, and none of its modules is next work.
function completeAll(root) {
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, Object.fromEntries(['p', 'u1', 'u2', 'other'].map((id) => [`process/ledger/${id}.json`, entry(id, { status: { state: 'COMPLETE' } })])));
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
}

test('status --role bob lists an untriaged notice once, as triage owed, and no notice-only job', () => {
  const root = product();
  completeAll(root);
  openPassed(root);
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /- triage owed: p:7 \(2 modules\): .*notice triage p:7/);
  assert.doesNotMatch(text, /- u[12]: provider notice/);
  assert.doesNotMatch(text, /req\/u[12].md/);
  assert.deepEqual(r.next.map((x) => x.file || x.triage), ['req/p.md', 'p:7']);
});

// The notice on origin's state branch, as merge records it, so triage --record can write beside it.
function noticed(root) {
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
}

test('notice triage --record: not affected answers the notice; affected is notice work apart from layer work; nothing is recorded until every module has a line', () => {
  const root = product();
  completeAll(root);
  openPassed(root);
  noticed(root);
  const three = { ...NOTICE, key: 'p:8', pr: 8, users: ['u1', 'u2', 'other'] };
  onState(root, { [noticeFile('p:8')]: JSON.stringify(three) + '\n' });
  git(['push', '-q', '-f', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const dir = mkdtempSync(join(tmpdir(), 'p3-triage-'));
  const file = join(dir, 'answer.txt');
  writeFileSync(file, 'Here is my answer.\n- `u1`: not affected: src/u1/a.mjs:3 calls p.sign only, never p.check\nu2: affected: src/u2/b.mjs:12 reads the token age\n');
  const out = [];
  const rec = recordTriage(root, 'p:7', { file, worker: 'agent-1', cost: '41k tokens', as: 'coordinator', log: (m) => out.push(m) });
  assert.deepEqual(rec.rows.map((x) => [x.row, x.user, x.verdict ?? x.by]), [['triage', 'u1', 'not affected'], ['answered', 'u1', 'triage'], ['triage', 'u2', 'affected']]);
  assert.equal(rec.rows[0].worker, 'agent-1');
  assert.equal(rec.rows[0].cost, '41k tokens');
  assert.match(out.join('\n'), /1 not affected \(answered\), 1 affected \(next work\)/);
  // The verdicts change BOB's next work: the last line wakes BOB (a rerun that adds nothing does not).
  assert.equal(out.at(-1), 'next act: wake BOB with `node .process/tool/p3.mjs send bob "notice triage p:7 recorded: run status" --from coordinator`, delivered with send_message to the address it prints');
  const rerun = [];
  assert.equal(recordTriage(root, 'p:7', { file, worker: 'agent-1', cost: '1', log: (m) => rerun.push(m) }).rows.length, 0, 'a rerun adds nothing');
  assert.doesNotMatch(rerun.join('\n'), /wake BOB/);
  // p:8: the worker judged u1 only (its line for other cites nothing): nothing is recorded, and
  // every module still owes triage.
  writeFileSync(file, 'u1: affected: src/u1/a.mjs:3 checks the token\nother: not affected\n');
  const part = [];
  const tip = git(['ls-remote', 'origin', 'refs/heads/process-state'], { cwd: root }).split('\t')[0];
  assert.throws(() => recordTriage(root, 'p:8', { file, worker: 'agent-2', cost: '9k tokens', log: (m) => part.push(m) }),
    /^Error: refused: notice triage p:8 records only when every module has a line; 2 of 3 not judged: u2, other\. Run a worker for them, then record every file again, nothing was written$/);
  assert.match(part.join('\n'), /not recorded: other: not affected cites no file:line/);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/process-state'], { cwd: root }).split('\t')[0], tip, 'nothing written');
  const cfg = loadConfig(root);
  fetchState(root, cfg.state_branch, { fresh: true });
  assert.deepEqual(notices(root, cfg.state_branch).map((n) => [n.key, n.open]), [['p:7', ['u2']], ['p:8', ['u1', 'u2', 'other']]]);
