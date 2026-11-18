// ===== file: state-race.test.mjs (continued) =====

  writeState(root, SB, 'seed', (wt) => { mkdirSync(join(wt, 'lanes'), { recursive: true }); writeFileSync(join(wt, 'lanes/ux.json'), '{"who":"a"}\n'); return {}; });
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  const keep = keeper(root);
  const seat = keep('1000-0000', 'lane seat', (wt) => writeFileSync(join(wt, 'lanes/ux.json'), '{"who":"b"}\n'));
  const row = keep('1000-0001', 'row naming the seat', append({ row: 'seat', who: 'b' }));
  const own = keep('2000-0000', 'another command', append({ row: 'other' }));
  writeState(other, SB, 'another writer', (wt) => { writeFileSync(join(wt, 'lanes/ux.json'), '{"who":"c"}\n'); return {}; });
  const lines = [];
  assert.throws(() => stateReplay(root, SB, [], { log: (l) => lines.push(l) }), /^Error: 2 kept state write\(s\) did not replay/);
  assert.ok(lines.includes(`kept ${row}: kept with its command's earlier write, which does not apply`), lines.join('\n'));
  assert.ok(lines.includes(`replayed ${own} (another command)`), lines.join('\n'));
  assert.equal(unpushed(root), [seat, row].join('\n'));
});

test('state replay: a push refused to the end stops the replay; the ref stays as it was, never kept twice; later refs are not tried', (t) => {
  const { root } = withOrigin();
  writeState(root, SB, 'seed', append({ row: 'seed' }));
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  const keep = keeper(root);
  const a = keep('1000-0000', 'row a', append({ row: 'a' }));
  const b = keep('2000-0000', 'row b', append({ row: 'b' }));
  let pushes = 0;
  stateIO.push = () => { pushes++; return { code: 1, stdout: '', stderr: 'remote: fatal error in commit_refs' }; };
  stateIO.wait = 1;
  t.after(() => { stateIO.push = null; stateIO.wait = null; });
  assert.throws(() => stateReplay(root, SB, [], { log: () => {} }), new RegExp(`the replay stopped at ${a}, which stays kept: .*1 later ref\\(s\\) not tried, kept`));
  assert.equal(unpushed(root), [a, b].join('\n'), 'the same two refs, none added');
  assert.ok(pushes > 0 && pushes <= 5, `${pushes} pushes: one write's retries only`);
});

// The coordinator, 7 Nov (BOB on pin 19fe9dd): state replay kept two github/use shares, "changed there
// in a way its change cannot be merged into": only metrics/ was re-appended. Every line log of the
// state branch is declared once (STATE_LOGS) and replayed by adding the rows it added that the tip
// lacks; a file with counted ids or reservations still refuses.
test('state replay: a kept github/use share replays onto rows another writer appended (its trim not replayed); R17e\'s settle fires', async () => {
  const { STATE_LOGS, onReplayed, stateLog } = await import('../lib/state.mjs');
  assert.ok(STATE_LOGS.length >= 3);
  const { root, other } = withOrigin();
  const USE = 'github/use/s1.jsonl';
  const row = (m) => JSON.stringify({ minute: `2026-11-07T0${m}:00:00Z`, gh: 1 });
  writeState(root, SB, 'seed', (wt) => { mkdirSync(join(wt, 'github/use'), { recursive: true }); writeFileSync(join(wt, USE), [row(1), row(2)].join('\n') + '\n'); return {}; });
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  const keep = keeper(root);
  // The kept share trims the oldest row and adds its own.
  const k = keep('1000-0000', 'github: 1 minute(s) of use (rows to 1794019144175)', (wt) => writeFileSync(join(wt, USE), [row(2), row(3)].join('\n') + '\n'));
  // Another writer (the same session's other clone) appended meanwhile.
  writeState(other, SB, 'github: 1 minute(s) of use (rows to 1794019200000)', (wt) => { appendFileSync(join(wt, USE), row(4) + '\n'); return {}; });
  const seen = [];
  onReplayed((subject) => seen.push(subject));
  assert.deepEqual(stateReplay(root, SB, [], { log: () => {} }), [k]);
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(readState(root, SB, USE).trim().split('\n').map((l) => JSON.parse(l).minute.slice(11, 13)), ['01', '02', '03', '04'], 'merged in time order');
  assert.ok(seen.includes('github: 1 minute(s) of use (rows to 1794019144175)'), 'onReplayed fired for the share');
  assert.equal(unpushed(root), '');
  assert.equal(stateLog(USE), true);
  assert.equal(stateLog('holds/holds.jsonl'), false);
});

test('state replay: a kept append to a file with counted ids (holds) still refuses when another writer appended', () => {
  const { root, other } = withOrigin();
  const H = 'holds/holds.jsonl';
  writeState(root, SB, 'seed', (wt) => { mkdirSync(join(wt, 'holds'), { recursive: true }); writeFileSync(join(wt, H), '{"id":"hold-1"}\n'); return {}; });
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  const k = keeper(root)('1000-0000', 'hold: b', (wt) => appendFileSync(join(wt, H), '{"id":"hold-2","by":"me"}\n'));
  writeState(other, SB, 'hold: c', (wt) => { appendFileSync(join(wt, H), '{"id":"hold-2","by":"other"}\n'); return {}; });
  assert.throws(() => stateReplay(root, SB, [], { log: () => {} }), /does not apply .*holds\/holds\.jsonl/);
  assert.equal(unpushed(root), k);
});

// Every jsonl the tool writes to the state branch is a declared line log or named as ordered, with why.
test('every jsonl file the state branch holds is declared a line log or named ordered', async () => {
  const { readdirSync } = await import('node:fs');
  const { dirname: dn } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { STATE_ORDERED, stateLog } = await import('../lib/state.mjs');
  const lib = join(dn(fileURLToPath(import.meta.url)), '..', 'lib');
  // jsonl paths the tool names that are not on the state branch.
  const NOT_STATE = {
    'failing.jsonl': "a suite's failures file in a temp dir (basered, gate)",
    'closed.jsonl': "a triage lane's register in its repository folder (register.mjs)",
    'process/metrics/refusals.bob.jsonl': 'a repository file, committed by a plain pull request',
  };
  const paths = new Set();
  for (const f of readdirSync(lib).filter((x) => x.endsWith('.mjs'))) {
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

// ===== file: job.test.mjs (later part) =====

  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.deepEqual(seen, [['receipt', tip], ['ready', tip, 1]]);
});

test('a mark with a parenthetical between its id and "(not yet met" is struck like any other, and needs its --test', () => {
  const root = product();
  // The copy's own shape (local-facts R23 and R25, 4 Nov), nested parentheses and all.
  commit(root, { 'req/alpha.md': '# alpha\n\n- **R1** (T53; N1257; DEC-151 (2); row 15; amends R10, R12) *(not yet met: T53; per C3)* **Does x.** Test: x.\n- **R2** (T53; `jurisdictions` R41) *(not yet met: T53; PLATFORM)* does y.\n' });
  git(['branch', '-f', 'tranche', 'main'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, {
    'req/alpha.md': '# alpha\n\n- **R1** (T53; N1257; DEC-151 (2); row 15; amends R10, R12) **Does x.** Test: x.\n- **R2** (T53; `jurisdictions` R41) *(not yet met: T53; PLATFORM)* does y.\n',
    'test/alpha/x.test.mjs': "import test from 'node:test'; test('R1 x', () => {});\n",
    'src/alpha/x.mjs': 'export const x = 1;\n',
  });
  const run = (tests) => jobComplete(root, 'alpha', { push: false, tests, log: quiet });
  assert.throws(() => run([]), /struck R1 with no --test/);
  assert.throws(() => run(['R2=test/alpha/x.test.mjs::R1 x']), /no mark for R2 that this branch struck \(struck: R1\)/);
  assert.deepEqual(run(['R1=test/alpha/x.test.mjs::R1 x']).receipt.tests, [{ req: 'R1', file: 'test/alpha/x.test.mjs', name: 'R1 x' }]);
});

// Bob, 4 Nov: urgency in process3's initial release. A job's question to BOB waits at most
// decision_minutes, then goes once more to BOB and to ROOT; and the wake's send is the job's act
// (review of PR 72: "push to job/<id> only" forbade the state branch it writes).
test('the START: the escalation to ROOT after decision_minutes, its limits, and the wake as the job\'s act', () => {
  const e = entry('alpha', { title: 'Member sign-in and session handling', paths: ['src/alpha/', 'src/shared/alpha-client.mjs', 'worker/alpha/'], tests: ['test/alpha/', 'test/e2e/alpha.spec.mjs'] });
  const t = startText({ entry: e, slug: 'neobobkrause/civicsmith-copy', branch: 'job/alpha', tranche: 'tranche', coordinator: 'session_01RAN5ek9qx8mduYhfE77Ldc', bob: true, attempt: 1, reading: { files: [{ file: 'req/alpha.md', bytes: 100 }, { file: 'docs/alpha.md', bytes: 100 }], bytes: 200 }, rootId: 'session_01RAN5ek9qx8mduYhfE77Ldd', decisionMinutes: 30 });
  // The chain's last automatic step is the watcher, with the minutes unanswered (coordinator, 4 Nov).
  assert.ok(t.includes('No answer from BOB in 30 min: send it once more, then to ROOT `session_01RAN5ek9qx8mduYhfE77Ldd`, then the watcher, with the minutes, by send_message (`node .process/tool/p3.mjs address <role>`).'));
  assert.ok(t.includes('If reversible and in your module, act on your recommendation and note why in your PR; never a merge, a push off your branch, or what is not yours.'));
  assert.ok(t.includes('- the wake that job complete or block prints, and its send_message'));
  assert.ok(t.includes("pushing to any other branch yourself (the wake's send writes the state branch)"));
  assert.ok(Buffer.byteLength(t) <= 4096, `START ${Buffer.byteLength(t)} bytes`);
  const own = startText({ entry: { ...e, acts: ['only these'] }, slug: 'o/r', branch: 'job/alpha', tranche: 'tranche', coordinator: 's', attempt: 1, reading: { files: [], bytes: 0 } });
  assert.ok(own.includes('No answer from BOB in 30 min: send it once more, then to ROOT, then the watcher, with the minutes'), 'none addressed: address reads them');
