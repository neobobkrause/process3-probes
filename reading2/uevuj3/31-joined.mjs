// ===== file: ready.test.mjs (continued) =====

  assert.deepEqual(see(null).rows.filter((x) => x.unstarted), []);
});

test('job start --ready, review of PR 100: an open attempt is not restarted, a module listed twice starts once, a failed start shows no launch, a resumed start with its PR open is not counted', () => {
  const root = makeRepo({ 'process/config.json': JSON.stringify({ live_cap: 9 }) });
  const next = [
    { file: 'r/x.md', count: 0, module: 'x', entry_state: 'COMPLETE', notices: ['p:2'], attempt_open: true },
    { file: 'r/a.md', count: 1, module: 'a', entry_state: 'OPEN' },
    { file: 'r/a2.md', count: 1, module: 'a', entry_state: 'OPEN' },
    { file: 'r/b.md', count: 1, module: 'b', entry_state: 'OPEN' },
    { file: 'r/c.md', count: 1, module: 'c', entry_state: 'OPEN' },
  ];
  const calls = [];
  const out = [];
  const r = startReady(root, {
    live: 0, remote: new Set(), log: (m) => out.push(m), read: () => ({ next }),
    start: (_, id, o) => {
      calls.push(id);
      o.log('start the job session with create_session:\n{}');
      if (id === 'b') throw new SyntaxError('Unexpected token');
      if (id === 'c') return { resumed: true, pr: { number: 4 }, created: false };
      return { launch: {} };
    },
  });
  assert.deepEqual(calls, ['a', 'b', 'c']);
  assert.deepEqual(r.started.map((x) => x.id), ['a']);
  assert.deepEqual(r.failed.map((x) => x.id), ['b', 'c']);
  assert.equal(out.filter((l) => l.startsWith('start the job session')).length, 1, 'only the started job\'s launch is shown');
  assert.match(out.join('\n'), /not started: x: its attempt is open/);
  assert.match(out.join('\n'), /not started: b: Unexpected token \(an unexpected error; the other starts went on\)/);
  assert.match(out.join('\n'), /not started: c: its pull request was already open/);
});

test('job start --ready: when the cap holds a ready job back, it names the idle sessions of COMPLETE or merged jobs BOB can archive', () => {
  const root = makeRepo({ 'process/config.json': JSON.stringify({ live_cap: 2 }) });
  const next = ['a', 'b'].map((id) => ({ file: `r/${id}.md`, count: 1, module: id, entry_state: 'OPEN' }));
  const rows = [
    { id: 'm', tranche: 'COMPLETE', pr: 'merged' },
    { id: 'k', tranche: 'WORKING', branch: 'COMPLETE', pr: '#7 ready' },
    { id: 'w', tranche: 'WORKING', branch: 'WORKING', pr: '#8 draft' },
    { id: 'gone', tranche: 'COMPLETE', pr: 'merged' },
    // Reopened: COMPLETE on the tranche, WORKING on its branch, its draft open; never named.
    { id: 'r', tranche: 'COMPLETE', branch: 'WORKING', pr: '#9 draft' },
  ];
  const listed = [
    { id: 'session_m', title: 'job m', status: 'idle' },
    { id: 'session_k', title: 'job k', status_bucket: 'completed' },
    { id: 'session_w', title: 'job w', status: 'idle' },
    { id: 'session_g', title: 'job gone', status: 'archived' },
    { id: 'session_r', title: 'job r', status: 'idle' },
  ];
  assert.deepEqual(archivable(rows, listed).sessions, [
    { session: 'session_m', job: 'm', why: 'merged' },
    { session: 'session_k', job: 'k', why: 'COMPLETE, PR #7 ready' },
  ]);
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 's.json');
  writeFileSync(file, JSON.stringify({ sessions: listed }));
  const out = [];
  const r = startReady(root, { live: 1, sessions: file, remote: new Set(), log: (m) => out.push(m), read: () => ({ next, rows }), start: (_, id) => ({ launch: { title: `job ${id}` } }) });
  assert.deepEqual(r.waiting, ['b']);
  assert.match(out.join('\n'), /the cap holds 1 back; archive these idle sessions of COMPLETE or merged jobs to free slots, then run this again: session_m \(job m, merged\); session_k \(job k, COMPLETE, PR #7 ready\)/);
  // Without --sessions: the jobs whose sessions to look for.
  const out2 = [];
  startReady(root, { live: 1, remote: new Set(), log: (m) => out2.push(m), read: () => ({ next, rows }), start: (_, id) => ({ launch: { title: `job ${id}` } }) });
  assert.match(out2.join('\n'), /the cap holds 1 back; these jobs are COMPLETE or merged, so their sessions, when idle, can be archived to free slots: job k \(COMPLETE, PR #7 ready\); job m \(merged\); job gone \(merged\)\. Save list_sessions as JSON and pass --sessions <file>/);
  // No cap hit: no archive line.
  const out3 = [];
  startReady(root, { live: 0, remote: new Set(), log: (m) => out3.push(m), read: () => ({ next, rows }), start: (_, id) => ({ launch: { title: `job ${id}` } }) });
  assert.doesNotMatch(out3.join('\n'), /the cap holds/);
  // readyCount: the startable jobs status lists, for the wake's lead.
  assert.equal(readyCount(root, { read: (_, o) => { assert.equal(o.offline, true); return { next }; } }), 2);
});

// The copy, 4 Nov: publication and case-authoring, entries merged 11:44:06, layer 8 with the open
// layer 4 and providers with unmet marks, were neither layer work, ready by uses nor notice work:
// listed nowhere, so job start --ready at the merges of 11:52 to 12:05 never started them.
test('status --role bob: an OPEN entry BOB wrote outside the open layer, its uses not done, is startable; the offline count sees it', () => {
  const root = makeRepo({
    'build/layers.md': '| Layer | Modules |\n|---|---|\n| 1 | `base` |\n| 2 | `prov` |\n| 3 | `pub`, `later` |\n',
    'process/modules.json': JSON.stringify({ modules: [{ id: 'base', paths: ['src/base/'], uses: [] }, { id: 'prov', paths: ['src/prov/'], uses: [] }, { id: 'pub', paths: ['src/pub/'], uses: ['prov'] }, { id: 'later', paths: ['src/later/'], uses: ['prov'] }] }),
    'process/config.json': JSON.stringify({ modules_file: 'process/modules.json', live_cap: 24 }),
    'build/requirements/base.md': unmet(1),
    'build/requirements/prov.md': unmet(2),
    'build/requirements/pub.md': unmet(3),
    'build/requirements/later.md': unmet(1),
    'process/ledger/pub.json': entry('pub', { requirements: 'build/requirements/pub.md' }),
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', 'https://github.com/o/r'], { cwd: root });
  git(['config', `url.${bare}.insteadOf`, 'https://github.com/o/r'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', log: (m) => out.push(m), io: { openPRs: () => [], prFiles: () => [], checkRun: () => null, compare: () => null } });
  // pub is listed (its entry is BOB's choice); later, with no entry, is not.
  assert.deepEqual(r.next.filter((x) => x.module).map((x) => [x.module, x.entry_state]), [['pub', 'OPEN']]);
  assert.match(out.join('\n'), /entered, never started \(BOB wrote the entry; ready whatever its layer or uses\): all 1 listed\n- build\/requirements\/pub\.md: 3 \(layer 3\); entry OPEN, never started/);
  assert.deepEqual(startable(r.next).go, [{ id: 'pub', file: 'build/requirements/pub.md' }]);
  // The wake's offline count: the one ls-remote marks it unstarted (it counted 0 before).
  assert.equal(readyCount(root), 1);
  // An entered module with no unmet mark has nothing for a job: not listed.
  writeFileSync(join(root, 'build/requirements/pub.md'), '# pub\n');
  git(['commit', '-qam', 'pub met'], { cwd: root });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  assert.equal(readyCount(root), 0);
  writeFileSync(join(root, 'build/requirements/pub.md'), unmet(3));
  git(['commit', '-qam', 'pub reopened'], { cwd: root });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  assert.equal(readyCount(root), 1);
  // Its job branch on origin: neither started again nor counted.
  git(['branch', 'job/pub'], { cwd: root });
  git(['push', '-q', 'origin', 'job/pub'], { cwd: root });
  assert.equal(readyCount(root), 0);
});

// ===== file: ready.mjs =====

// job start --ready (coordinator, 4 Nov: ready to start, median 49.5 min against a target of 10):
// readiness starts the job without waiting for BOB to choose it. One command starts every job
// status --role bob lists as startable, up to live_cap less the live sessions, in the order next
// work lists them; BOB runs it on every wake and after every merge and layer close, then delivers
// each launch it prints with create_session and subscribes to each pull request.
// Startable: a module with a ledger entry on the tranche and no job branch on origin, its
// requirement file not over the cap: an OPEN entry never started; a COMPLETE one listed for a
// provider notice (job start reopens it itself) or for found marks (reopened to meet them).
// A file with no ledger entry is named, not started: its entry is BOB's to write.
import { P3, jobStart } from './job.mjs';
import { isArchived, isIdle, jobSession, readSessions, status } from './status.mjs';
import { Fail, fail, git, loadConfig } from './util.mjs';

const LAUNCH = /^start the job session with create_session:/;

export function startable(next, { onOrigin = () => false } = {}) {
  const go = [];
  const skip = [];
  const seen = new Set();
  for (const x of next || []) {
    if (!x?.file || x.over || x.triage || x.missing || x.found_no_module) continue;
    if (x.module && seen.has(x.module)) continue;
    if (x.module) seen.add(x.module);
    // A module with an attempt open (a pull request, commits the tranche lacks, a flag) is never
    // started again here: status names its act (review of PR 100: a second notice relaunched it).
    if (x.attempt_open) { skip.push({ file: x.file, id: x.module, why: 'its attempt is open: status says what it needs' }); continue; }
    if (!x.module) { skip.push({ file: x.file, why: 'no ledger entry: BOB writes it, then job start --ready starts it' }); continue; }
    // An OPEN entry with its branch on origin is a start already pushed (status lists its state);
    // a COMPLETE module keeps its merged branch, which job start's reopen moves on.
    if (x.entry_state === 'OPEN' && onOrigin(x.module)) { skip.push({ file: x.file, id: x.module, why: `job/${x.module} is on origin: status says what it needs` }); continue; }
    if (x.entry_state === 'OPEN') go.push({ id: x.module, file: x.file });
    else if (x.entry_state === 'COMPLETE' && x.notices) go.push({ id: x.module, file: x.file });
    else if (x.entry_state === 'COMPLETE' && x.found) go.push({ id: x.module, file: x.file, reopen: `meet the found marks ${x.found.join(', ')}` });
    else skip.push({ file: x.file, id: x.module, why: `entry ${x.entry_state}: BOB's judgment` });
  }
  return { go, skip };
}

// The sessions BOB can archive to free a slot when the cap holds a ready job back (coordinator,
// 4 Nov: 23 of 24 live at 09:16): each job's latest session whose job is COMPLETE (on its branch
// or merged), not archived and idle. With list_sessions saved (--sessions), the ids; without,
// the jobs, so BOB knows whose sessions to look for.
export function archivable(rows, listed) {
  // Not a reopened job (COMPLETE on the tranche, WORKING or BLOCKED on its branch, its draft open)
  // nor one whose pull request GitHub did not read: its session may be working (review of PR 104).
  const done = (rows || []).filter((r) => (r.tranche === 'COMPLETE' || String(r.branch || '').startsWith('COMPLETE'))
    && !/^(WORKING|BLOCKED)/.test(String(r.branch || '')) && !/draft|unknown/.test(String(r.pr || '')) && !r.flag)
    .map((r) => ({ id: r.id, why: r.pr && r.pr !== 'merged' ? `COMPLETE, PR ${r.pr}` : 'merged' }));
  if (!listed) return { jobs: done, sessions: null };
  const sessions = [];
  for (const d of done) {
    const js = jobSession(listed, d.id);
    if (js && !isArchived(js) && isIdle(js)) sessions.push({ session: js.id || js.session_id || js.uuid, job: d.id, why: d.why });
  }
  return { jobs: done, sessions };
}

// Whether status lists startable jobs: the wake BOB receives leads with the start when so.
