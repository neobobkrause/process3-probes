// ===== file: census.mjs (continued) =====

  for (const id of [...new Set([...newRows, ...newReqs])]) {
    if (!has(head, entryFile(id))) out.push({ file: newReqs.includes(id) ? `${dir}/${id}.md` : cfg.modules_file, message: `${id} gains a ${newReqs.includes(id) ? 'requirements file' : 'modules row'} with no ledger entry ${entryFile(id)}: add the entry in this pull request (census, R15)` });
  }
  for (const id of newEntries) {
    if (!after.has(id)) out.push({ file: entryFile(id), message: `${id}'s new ledger entry has no row in ${cfg.modules_file}: add it in this pull request (census, R15)` });
    let named = null;
    try { named = JSON.parse(show(root, head, entryFile(id)) || '{}').requirements || null; } catch { named = null; }
    if (!has(head, named ? String(named).replace(/^\.\//, '') : `${dir}/${id}.md`)) out.push({ file: entryFile(id), message: `${id}'s new ledger entry has no requirements file ${named || `${dir}/${id}.md`}: add it in this pull request (census, R15)` });
  }
  return out;
}

// ===== file: state-race.test.mjs (later part) =====

    change(wt);
    git(['add', '-A'], { cwd: wt });
    git(['-c', 'user.name=t', '-c', 'user.email=t@x', 'commit', '-q', '-m', msg], { cwd: wt });
    git(['update-ref', `refs/p3/unpushed/${name}`, 'HEAD'], { cwd: wt });
    git(['worktree', 'remove', '--force', wt], { cwd: root });
    return `refs/p3/unpushed/${name}`;
  };
  // The oldest: a change to a file another writer then changed in a way it cannot merge into.
  const old = keep('1000-0000', 'pacing: lane seat', (wt) => writeFileSync(join(wt, 'lanes/ux.json'), '{"who":"b"}\n'));
  const n1 = keep('2000-0000', 'layer merge 9: row 1', append({ row: 'merged', n: 1 }));
  const n2 = keep('2000-0001', 'layer merge 9: row 2', append({ row: 'merged', n: 2 }));
  writeState(other, SB, 'another writer', (wt) => { writeFileSync(join(wt, 'lanes/ux.json'), '{"who":"c"}\n'); return {}; });
  const lines = [];
  assert.throws(() => stateReplay(root, SB, [], { log: (l) => lines.push(l) }), new RegExp(`1 kept state write\\(s\\) did not replay and stay kept: ${old}: ${old} does not apply .* \\(the other 2 replayed\\)$`));
  assert.ok(lines.some((l) => l.startsWith(`kept ${old} (pacing: lane seat): `) && /does not apply/.test(l)), lines.join('\n'));
  assert.ok(lines.includes(`replayed ${n1} (layer merge 9: row 1)`) && lines.includes(`replayed ${n2} (layer merge 9: row 2)`), lines.join('\n'));
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(readState(root, SB, ROWS).trim().split('\n').map((l) => JSON.parse(l)).map((x) => x.n ?? x.row), ['seed', 1, 2]);
  assert.equal(unpushed(root), old, 'only the one that does not apply stays kept');
});

// Cold review of the per-ref replay: the writes one command kept (<ms>-0000, -0001, each made on the one
// before) stay together: one that does not apply keeps its command's later ones. A failure that is not
// "does not apply" (a push refused to the end) stops the replay: that ref stays as it was, never kept
// twice, and later refs are not tried.
function keeper(root) {
  return (name, msg, change) => {
    const wt = join(mkdtempSync(join(tmpdir(), 'p3-keep-')), 'w');
    git(['worktree', 'add', '-q', '--detach', wt, `refs/remotes/origin/${SB}`], { cwd: root });
    change(wt);
    git(['add', '-A'], { cwd: wt });
    git(['-c', 'user.name=t', '-c', 'user.email=t@x', 'commit', '-q', '-m', msg], { cwd: wt });
    git(['update-ref', `refs/p3/unpushed/${name}`, 'HEAD'], { cwd: wt });
    git(['worktree', 'remove', '--force', wt], { cwd: root });
    return `refs/p3/unpushed/${name}`;
  };
}
test('state replay: a command\'s later kept write stays with its earlier one that does not apply; another command\'s replays', () => {
  const { root, other } = withOrigin();
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
