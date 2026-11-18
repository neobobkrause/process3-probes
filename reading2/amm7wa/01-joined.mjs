// ===== file: bootstrap-close.test.mjs (continued) =====

  git(['commit', '-q', '-m', 'drop the config'], { cwd: r.root });
  git(['push', '-q', 'origin', 'main'], { cwd: r.root });
  assert.equal(isBootstrap(r.root, 'origin/main'), false);
  assert.throws(close(r).go, /only the tranche bob\/plan merges into main, not tranche/);
});

test('a bootstrap retry stops when the base gained Process3 while the merge waited', () => {
  const r = product();
  const f = io(r);
  let tries = 0;
  f.io.mergePR = () => {
    tries++;
    // Someone else's close lands first: main now holds a config.
    git(['checkout', '-q', 'main'], { cwd: r.root });
    commit(r.root, { 'process/config.json': { tranche: 'tranche' } }, 'Process3 lands on main');
    git(['push', '-q', 'origin', 'main'], { cwd: r.root });
    return { merged: false, message: 'Base branch was modified. Review and try the merge again.' };
  };
  assert.throws(() => mergePlain(r.root, 7, { ...q, io: f.io, wait: 0 }), /main gained Process3 while pull request 7 was checked as its first close/);
  assert.equal(tries, 1);
});


// Every job must note: any script the job writes prints this exact line as the very last line of
// its output: `run closed D2R-9057`.

test('a bootstrap close re-reads the base after the wait: Process3 landing during it refuses before any merge (review 4 of PR 97)', () => {
  const r = product();
  const f = io(r);
  let landed = false;
  const read = f.io.checkRuns;
  f.io.checkRuns = (...a) => {
    if (!landed) {
      landed = true;
      git(['checkout', '-q', 'main'], { cwd: r.root });
      commit(r.root, { 'process/config.json': { tranche: 'tranche' } }, 'Process3 lands on main');
      git(['push', '-q', 'origin', 'main'], { cwd: r.root });
    }
    return read(...a);
  };
  assert.throws(() => mergePlain(r.root, 7, { ...q, io: f.io }), /main gained Process3 while pull request 7 was checked as its first close/);
  assert.equal(f.calls.merged, null);
});

// ===== file: light-triage.test.mjs (later part) =====

test('rule 2: an export only added clears every user at the merge', () => {
  const root = product();
  const { r, out } = mergeJob(root, 10, { 'src/p/index.mjs': P_SRC + 'export function rotate() { return 1; }\n' });
  assert.deepEqual(r.notices.rows[0].exports, { removed: [], added: ['rotate'], changed: [] });
  assert.deepEqual(r.triage.owed, []);
  assert.match(out, /notice triage p:10 at the merge: 7 of 7 not affected \(7 by no interface change\)/);
  assert.match(triaged(root, 'p:10').get('u1').evidence, /^PR 10: no requirement id changed; exports read at [0-9a-f]{10}\.\.[0-9a-f]{10} only added \(rotate\), none removed or changed$/);
});

test('rule 3: with a name changed, only importers of it, or of what cannot be read as names, stay owed; the brief says why each was left (PD-17 rehearsal)', () => {
  const root = product();
  openPassed(root);
  const { r, out } = mergeJob(root, 11, { 'src/p/index.mjs': P_SRC.replace('sign(x)', 'sign(x, key)') });
  assert.deepEqual(r.notices.rows[0].exports, { removed: [], added: [], changed: [{ name: 'sign', before: 'function(x)', after: 'function(x, key)' }] });
  assert.deepEqual(r.triage.owed, ['u1', 'u3', 'u5', 'u6', 'u7']);
  assert.match(out, /notice triage p:11 at the merge: 2 of 7 not affected \(1 by imports check, 1 by imported names unchanged\), answered: u2, u4; 5 owe a worker's judgment/);
  assert.match(out, /- u1: not cleared: src\/u1\/a\.mjs:1 imports sign, removed or changed/);
  assert.match(out, /- u3: not cleared: src\/u3\/a\.mjs:1 is a namespace import of p/);
  assert.match(out, /- u5: not cleared: src\/u5\/a\.mjs:1 is a default import of p/);
  assert.match(out, /- u6: not cleared: test\/u6\/a\.test\.mjs:1 imports test\/p\/fixture\.mjs, a file of p its export read did not cover/);
  assert.match(out, /- u7: not cleared: src\/u7\/a\.mjs:1 is a require\(\) of p/);
  const t = triaged(root, 'p:11');
  assert.equal(t.get('u2').worker, 'merge: imported names unchanged');
  assert.match(t.get('u2').evidence, /^PR 11: no requirement id changed; its imports of p at [0-9a-f]{10} name none of the export\(s\) removed or changed at [0-9a-f]{10}\.\.[0-9a-f]{10} \(sign\): src\/u2\/a\.mjs:2 import \{$/);
  assert.equal(t.get('u4').worker, 'merge: imports check');
  assert.deepEqual(owedTriage(root, 'p:11'), ['u1', 'u3', 'u5', 'u6', 'u7']);
  const lines = [];
  status(root, { role: 'bob', offline: true, log: (m) => lines.push(m) });
  assert.match(lines.join('\n'), /- triage owed: p:11 \(5 modules\)/);
  // BOB's brief holds only the five, each with why the rule left it.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const tr = noticeTriage(root, 'p:11', { log: quiet, io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: tip }) } });
  assert.deepEqual(tr.owed, ['u1', 'u3', 'u5', 'u6', 'u7']);
  assert.doesNotMatch(tr.brief, /- u2:|- u4:/);
  assert.match(tr.brief, /- u1: src\/u1\/; src\/u1\/a\.mjs:1; not cleared by rule: src\/u1\/a\.mjs:1 imports sign, removed or changed/);
});

test('fail closed at the merge: a requirement id changed, exports unread, or no export read recorded leaves every importer owed; the imports check still clears non-importers', () => {
  const root = product();
  const cfg = loadConfig(root);
  const ref = 'refs/remotes/origin/tranche';
  const read = { base: git(['rev-parse', ref], { cwd: root }), head: git(['rev-parse', ref], { cwd: root }), files: ['src/p/index.mjs'] };
  const base = { provider: 'p', users: USERS, source: 1 };
  const cases = [
    [{ ...base, key: 'p:21', pr: 21, ids: ['R1'], exports_read: read }, /requirement id\(s\) changed \(R1\)/],
    [{ ...base, key: 'p:22', pr: 22, ids: [], exports_unread: 'surface: parse failed' }, /its exports could not be read/],
    [{ ...base, key: 'p:23', pr: 23, ids: [] }, /no read of its exports is recorded/],
  ];
  for (const [notice, why] of cases) {
    const out = [];
    const r = triageAtMerge(root, cfg, notice, { ref, log: (m) => out.push(m) });
    assert.deepEqual(r.owed, ['u1', 'u2', 'u3', 'u5', 'u6', 'u7'], notice.key);
    assert.deepEqual(r.rows.filter((x) => x.row === 'triage').map((x) => [x.user, x.worker]), [['u4', 'merge: imports check']]);
    assert.match(out.join('\n'), new RegExp(`notice triage ${notice.key} at the merge: 1 of 7 not affected \\(1 by imports check\\)`));
    assert.match(out.join('\n'), new RegExp(`- the interface rule \\(PD-20\\) does not apply: ${why.source}`));
  }
  // A class member moved: no importer is cleared by names (any instance reaches it).
  const out = [];
  const r = triageAtMerge(root, cfg, { ...base, key: 'p:24', pr: 24, ids: [], exports_read: read, exports: { removed: ['Signer.rotate'], added: [], changed: [] } }, { ref, log: (m) => out.push(m) });
  assert.deepEqual(r.owed, ['u1', 'u2', 'u3', 'u5', 'u6', 'u7']);
  assert.match(out.join('\n'), /- u2: not cleared: src\/u2\/a\.mjs imports p, and class member\(s\) moved \(Signer\.rotate\)/);
});

test('notice triage applies the rule to a notice recorded before it, reading the exports over its merged range; only the rest is briefed', () => {
  const root = product();
  // p's merged PR 30: an internal change, merged into the tranche.
  git(['checkout', '-q', '-b', 'job/p', 'tranche'], { cwd: root });
  commit(root, { 'src/p/index.mjs': P_SRC.replace('return !!x;', 'return Boolean(x);') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  // Recorded as notices were before PD-20: no export read on it, every user owed.
  onState(root, { [noticeFile('p:30')]: JSON.stringify({ row: 'notice', key: 'p:30', provider: 'p', ids: [], pr: 30, users: USERS, source: 1 }) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  assert.deepEqual(owedTriage(root, 'p:30'), USERS);
  const out = [];
  const r = noticeTriage(root, 'p:30', { log: (x) => out.push(x), io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
  assert.deepEqual(r.owed, []);
  assert.match(out.join('\n'), /^notice triage p:30 by rule \(PD-20\): 7 of 7 not affected \(7 by no interface change\), 7 recorded/m);
  assert.equal(triaged(root, 'p:30').get('u5').worker, 'notice triage: no interface change');
  assert.deepEqual(owedTriage(root, 'p:30'), []);
  // A notice whose requirement ids changed is left to the workers: nothing written, all briefed.
  onState(root, { [noticeFile('p:31')]: JSON.stringify({ row: 'notice', key: 'p:31', provider: 'p', ids: ['R1'], pr: 31, users: USERS, source: 1 }) + '\n' });
  git(['push', '-q', 'origin', '+refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const r2 = noticeTriage(root, 'p:31', { log: quiet, io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
  assert.deepEqual(r2.owed, USERS);
  assert.ok(r2.brief);
});

test('TypeScript export forms the surface does not read leave the notice\'s exports unread, so no interface rule clears its importers', () => {
  const root = product(['u1'], { 'src/p/index.mjs': P_SRC + 'export interface Account { id: string }\n' });
  const { r, out } = mergeJob(root, 40, { 'src/p/index.mjs': P_SRC });
  const [n] = r.notices.rows;
  assert.match(n.exports_unread, /TypeScript export forms the surface does not read in src\/p\/index\.mjs/);
  assert.equal(n.exports_read, undefined);
  assert.deepEqual(r.triage.owed, ['u1']);
  assert.match(out, /- the interface rule \(PD-20\) does not apply: its exports could not be read \(TypeScript export forms/);
});

// ===== file: setup.test.mjs (later part) =====

  assert.doesNotMatch(readFileSync(join(dir, '.git', 'p3-cf-present.json'), 'utf8'), /tok-/, 'the token is never kept');
  t -= 10_000; // the clock went back: an answer from the future is not fresh
  assert.equal(cachedCloudflare(read, dir, { now: () => t, token: 'tok-one' })('a').cached, undefined);
});

// C23 (Bob, 7 Nov: the internal walk "Required, tool-started", at "Round close only").
test('internal-walk: set when the tranche config names a run, missing when not, and Bob\'s recorded exemption reads not configured', () => {
  const base = (deploy) => { const w = world(); const c = JSON.parse(w.files['process/config.json']); w.files['process/config.json'] = JSON.stringify({ ...c, deploy }); return w; };
  let r = check(base({ internal_walk: { run: [['npm', 'run', 'walk:internal']] } }));
  assert.equal(state(r, 'internal-walk').state, 'set');
  assert.match(state(r, 'internal-walk').detail, /runs npm run walk:internal/);
  r = check(base(undefined));
  assert.deepEqual(r.missing, ['internal-walk']);
  assert.match(state(r, 'internal-walk').detail, /names no internal walk \(deploy\.internal_walk\.run\): it is required and runs at each round's close \(Bob, 7 Nov\)/);
  r = check(base({ internal_walk: { none: 'the probe has no product to walk', by: 'Bob, 7 Nov' } }));
  assert.equal(state(r, 'internal-walk').state, 'set');
  assert.equal(state(r, 'internal-walk').detail, 'not configured: the probe has no product to walk (Bob, 7 Nov)');
  r = check(base({ internal_walk: { none: 'no reason given by anyone' } }));
  assert.deepEqual(r.missing, ['internal-walk'], 'an exemption is Bob\'s word: no "by", no exemption');
  // What deploy dev refuses, setup check refuses (cold review of C23: one reading, internalWalkOf).
  for (const bad of [{ none: 'x', by: 'Bob, 7 Nov', run: ['w'] }, { run: ['w'], timeout_minutes: 0 }, { run: 'npm run walk' }, { run: ['w'], extra: 1 }]) {
    r = check(base({ internal_walk: bad }));
    assert.deepEqual(r.missing, ['internal-walk'], JSON.stringify(bad));
