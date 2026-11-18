// ===== file: status.test.mjs (continued) =====

  const root = makeRepo({ 'process/ledger/old.json': entry('old', { status: { state: 'WORKING' } }), 'process/ledger/new.json': entry('new', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  for (const [id, at] of [['old', new Date(Date.now() - 5 * 36e5).toISOString()], ['new', new Date().toISOString()]]) {
    git(['checkout', '-q', '-b', `job/${id}`, 'origin/tranche'], { cwd: root });
    const old = process.env.GIT_COMMITTER_DATE;
    process.env.GIT_COMMITTER_DATE = at;
    try { commit(root, { [`src/${id}/a.js`]: '1' }, 'job start'); } finally { if (old === undefined) delete process.env.GIT_COMMITTER_DATE; else process.env.GIT_COMMITTER_DATE = old; }
    git(['update-ref', `refs/remotes/origin/job/${id}`, 'HEAD'], { cwd: root });
    git(['checkout', '-q', 'main'], { cwd: root });
  }
  const by = Object.fromEntries(status(root, { offline: true, log: quiet }).rows.map((r) => [r.id, r]));
  assert.deepEqual([by.old.ahead, by.old.flag], [1, 'WORKING, nothing pushed']);
  assert.deepEqual([by.new.ahead, by.new.flag], [1, undefined]);
});

// Review of PR 114: a restarted COMPLETE module, its fresh start commit unflagged and GitHub unread, is not merged.
test('layerState: a COMPLETE module with a fresh WORKING start ahead on its branch is not counted merged', () => {
  const root = makeRepo({ 'build/layers.md': '| 1 | a |\n', 'build/requirements/a.md': '# a\n' });
  const row = (ahead) => [{ id: 'a', tranche: 'COMPLETE', branch: 'WORKING', ahead, pr: 'unknown (GitHub not read)' }];
  const merged = (ahead) => layerState(root, loadConfig(root), row(ahead), null, { closed: [] }).layers[0].mods[0].merged;
  assert.deepEqual([merged(1), merged(0)], [false, true]);
});

// --sessions (measured 3-4 Nov: a stopped job was flagged only after two hours with no push): BOB's
// own list_sessions JSON; a job whose session is archived, or idle with no push for
// targets.replace_minutes, is flagged with the restart; a running one, or none given, is not.
test('status --role bob --sessions: job session gone and job idle 30m are flagged with the restart; without --sessions the two-hour rule stands', () => {
  const ids = ['gone', 'quiet', 'busy', 'fresh', 'unlisted'];
  const root = makeRepo(Object.fromEntries(ids.map((id) => [`process/ledger/${id}.json`, entry(id, { status: { state: 'WORKING' } })])));
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  const ago = (m) => new Date(Date.now() - m * 6e4).toISOString();
  for (const id of ['gone', 'quiet', 'busy', 'unlisted']) pushedJob(root, id, ago(45));
  pushedJob(root, 'fresh', ago(5));
  const prs = ids.map((id, i) => ({ number: 10 + i, head: { ref: `job/${id}`, sha: 'x' }, draft: true, updated_at: ago(45) }));
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 'sessions.json');
  writeFileSync(file, JSON.stringify({ data: [
    { id: 'session_old', title: 'job gone', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'completed', updated_at: ago(300) },
    { id: 'session_g', title: 'job gone (restart)', session_status: 'SESSION_STATUS_ARCHIVED', status_bucket: 'completed', updated_at: ago(60) },
    { id: 'session_q', title: 'job quiet', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'review_ready', updated_at: ago(90) },
    { id: 'session_b', title: 'job busy', session_status: 'SESSION_STATUS_RUNNING', status_bucket: 'working', updated_at: ago(90) },
    { id: 'session_f', title: 'job fresh', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'completed', updated_at: ago(90) },
  ] }));
  const io = { openPRs: () => prs, checkRun: () => null, compare: () => null, prFiles: () => [] };
  const env = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'o/r';
  try {
    const out = [];
    const r = status(root, { role: 'bob', sessions: file, log: (m) => out.push(m), io });
    const by = Object.fromEntries(r.rows.map((x) => [x.id, x.flag]));
    assert.equal(by.gone, 'job session gone (session_g archived); BOB\'s act: node .process/tool/p3.mjs job start gone --restart "<why>"');
    assert.match(by.quiet, /^job idle 30m \(session_q idle, no push for 4[56]m\); BOB's act: node \.process\/tool\/p3\.mjs job start quiet --restart "<why>"$/);
    assert.equal(by.busy, undefined, 'a running session is not flagged');
    assert.equal(by.fresh, undefined, 'an idle session that pushed 5 minutes ago is not flagged');
    assert.equal(by.unlisted, undefined, 'no session listed: the two-hour rule, not yet reached');
    assert.match(out.join('\n'), /owed:\n(- .*\n)*- gone: WORKING; PR #10 draft.*job session gone/);
    const late = status(root, { role: 'bob', log: quiet, io, sessions: undefined });
    assert.ok(late.rows.every((x) => x.flag === undefined), 'without --sessions, nothing at 45 minutes');
  } finally { if (env === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = env; }
});

test('status --sessions: replace_minutes from targets in config; an unreadable file is refused', () => {
  const root = makeRepo({ 'process/config.json': { targets: { replace_minutes: 60 } }, 'process/ledger/quiet.json': entry('quiet', { status: { state: 'WORKING' } }) });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });

// Note for jobs, in force until withdrawn: the job's handover note ends with this exact last line:
// `-- filed under ostler`.

  pushedJob(root, 'quiet', new Date(Date.now() - 45 * 6e4).toISOString());
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 's.json');
  writeFileSync(file, JSON.stringify([{ id: 'session_q', title: 'job quiet', session_status: 'SESSION_STATUS_IDLE' }]));
  const io = { openPRs: () => [{ number: 3, head: { ref: 'job/quiet', sha: 'x' }, draft: true }], checkRun: () => null, compare: () => null, prFiles: () => [] };
  const env = process.env.GITHUB_REPOSITORY;
  process.env.GITHUB_REPOSITORY = 'o/r';
  try {
    assert.equal(status(root, { sessions: file, log: quiet, io }).rows[0].flag, undefined, '45 minutes is under a replace_minutes of 60');
    writeFileSync(file, 'not json');
    assert.throws(() => status(root, { sessions: file, log: quiet, io }), /--sessions .*not a readable JSON file/);
  } finally { if (env === undefined) delete process.env.GITHUB_REPOSITORY; else process.env.GITHUB_REPOSITORY = env; }
});

test('status --role bob: a requirement file over requirements_cap is a split owed, not startable work (REQ-6)', () => {
  const root = makeRepo({
    'build/requirements/small.md': unmet(1),
    'build/requirements/big.md': unmet(2) + 'x'.repeat(400),
    'build/requirements/many.md': unmet(4),
    'process/config.json': { requirements_cap: 300, requirements_cap_marks: 3 },
  });
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  const big = Buffer.byteLength(unmet(2) + 'x'.repeat(400));
  assert.match(text, new RegExp(`split or consolidate before its job: build/requirements/big.md ${big} over 300`));
  assert.match(text, /split or consolidate before its job: build\/requirements\/many.md 4 unmet marks over 3/);
  assert.match(text, /all 1 listed.*\n- build\/requirements\/small.md: 1\nflow: [^\n]*startable 0, blocked 0$/);
  assert.doesNotMatch(text, /- build\/requirements\/(big|many).md/);
  // Still returned, marked: a split owed is work for BOB.
  assert.deepEqual(r.next.map((x) => [x.file, !!x.over]), [['build/requirements/small.md', false], ['build/requirements/big.md', true], ['build/requirements/many.md', true]]);
});

// The copy, 4 Nov: layer 2 closed with no `layer close` row and status said nothing of it.
test('status --role bob: a layer closed with no unmet marks and no close row says so, one line per layer; a recorded close does not', () => {
  const root = makeRepo({
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 0 | base | z |\n| 1 | first | a |\n| 2 | second | b |\n| 3 | third | c |\n',
    'build/requirements/z.md': unmet(1),
    'build/requirements/a.md': unmet(0),
    'build/requirements/b.md': unmet(0),
    'build/requirements/c.md': unmet(1),
  });
  openPassed(root);
  onState(root, { 'layers/closed.jsonl': JSON.stringify({ row: 'closed', layer: 0, tranche: 'tranche', commit: git(['rev-parse', 'HEAD'], { cwd: root }), at: 'x' }) + '\n' });
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /^layer 1 closed: no unmet marks\nlayer 2 closed: no unmet marks$/m);
  assert.doesNotMatch(text, /layer [03] closed/);
  assert.equal(r.layer.cur.n, 3);
});

// The copy, 4 Nov: twenty files over the cap with no marks were never reported.
test('status --role bob: cap debt counts every requirement file over the cap from the open layer on, marks or none, in one line', () => {
  const pad = 'x'.repeat(400);
  const root = makeRepo({
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | first | old |\n| 2 | second | a, b |\n| 3 | third | c, d |\n',
    'build/requirements/old.md': unmet(0) + pad,
    'build/requirements/a.md': unmet(1) + pad,
    'build/requirements/b.md': unmet(1),
    'build/requirements/c.md': unmet(0) + pad,
    'build/requirements/d.md': unmet(2),
    'process/config.json': { requirements_cap: 300 },
  });
  openPassed(root);
  const out = [];
  status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  const bytes = Buffer.byteLength(unmet(1) + pad) + Buffer.byteLength(unmet(0) + pad);
  assert.match(text, new RegExp(`^cap debt: 2 requirement files over the cap from layer 2 on, ${bytes} bytes; each is split or consolidated before its job$`, 'm'));
  assert.match(text, /^split or consolidate before its job: build\/requirements\/a.md \d+ over 300$/m);
  assert.doesNotMatch(text, /split or consolidate before its job: build\/requirements\/c.md/);
  assert.match(text, /next work, layer 2 .*\n- build\/requirements\/b.md: 1 \(layer 2\)\nflow: [^\n]*startable 0, blocked 0$/);
});

// ===== file: found.test.mjs =====

// The route for work found elsewhere (found <module>, 4 Nov): the p3dev-l1 walk's findings were
// held in BOB's handoff "until the owning layer opens". A found mark is next work as soon as its
// module is ready by open_by, whatever its layer; one that names no module waits for BOB to name one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { entry, makeRepo, openPassed } from './helpers.mjs';
import { NO_MODULE, addFound, found, foundMarks, nextFound } from '../lib/found.mjs';
import { markedIds } from '../lib/job.mjs';
import { trancheReport } from '../lib/report.mjs';
import { status } from '../lib/status.mjs';
import { git, loadConfig, overCap, requirementMarks } from '../lib/util.mjs';

const quiet = () => {};
const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n- **R99** met\n';
const F = (n, src = 'walk p3dev-l1', what = 'founder sign-in answers HTTP 200 without a session') => `- **F${n}** *(not yet met: ${src})* ${what}\n`;
const LAYERS = '| layer | what | modules |\n|---|---|---|\n| 1 | base | base |\n| 2 | open | p2, q2 |\n| 3 | users | u3, x3 |\n| 4 | later | u4, f4 |\n';
const MODULES = { modules: [
  { id: 'base', paths: ['src/base/'], uses: [] },
  { id: 'p2', paths: ['src/p2/'], uses: ['base'] },
  { id: 'q2', paths: ['src/q2/'], uses: ['base'] },
  { id: 'u3', paths: ['src/u3/'], uses: ['q2'] },
  { id: 'u4', paths: ['src/u4/'], uses: ['p2'] }, // p2 has unmet marks: its found work waits
  { id: 'f4', paths: ['src/f4/'], uses: ['base'] }, // base done but for found work: see below
  { id: 'reader', paths: ['src/reader/'], uses: [] }, // no requirement file, not in the layer map
