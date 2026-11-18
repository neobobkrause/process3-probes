// ===== file: session-safety.test.mjs (continued) =====

  let calls = 0;
  const open = { read: () => ({ state: 'open', merged: false, head: { sha: H40 } }), sha: H40 };
  const r = mergeRetry(() => (++calls === 1 ? unread() : { merged: true, sha: 'm' }), { wait: 0, log: quiet, reread: open });
  assert.deepEqual([r.merged, calls], [true, 2]);
  calls = 0;
  assert.throws(() => mergeRetry(() => { calls++; return unread(); }, { wait: 0, log: quiet, reread: open }), /could not be read.*after one more try/);
  assert.equal(calls, 2);
  // A head that moved, or a merge at another head, stops at once.
  calls = 0;
  assert.throws(() => mergeRetry(() => { calls++; return unread(); }, { wait: 0, log: quiet, reread: { read: () => ({ state: 'open', head: { sha: 'b'.repeat(40) } }), sha: H40 } }), /at another head/);
  assert.throws(() => mergeRetry(unread, { wait: 0, log: quiet, reread: { read: () => ({ state: 'closed', merged: true, head: { sha: 'b'.repeat(40) } }), sha: H40 } }), /merged at another head/);
  assert.equal(calls, 1);
  // The once-more try runs the moved-base checks first: a base that moved meanwhile stops it.
  calls = 0;
  const seen = [];
  assert.throws(() => mergeRetry(() => { calls++; return unread(); }, { wait: 0, log: quiet, reread: open, fetch: () => seen.push('fetch'), check: () => { seen.push('check'); throw new Fail('main moved past the merged result the gate checked; run merge again'); } }), /moved past/);
  assert.deepEqual([calls, seen], [1, ['fetch', 'check']]);
  // A refusal GitHub stated is not unreadable; without reread the error stands as before.
  assert.equal(unreadable('gh api -X PUT failed: gh: Pull Request is not mergeable (HTTP 405)'), false);
  assert.equal(unreadable('gh api -X PUT failed: {"message":"x"}'), false);
  assert.equal(unreadable('gh api -X PUT failed: '), true);
  assert.throws(() => mergeRetry(unread, { wait: 0, log: quiet }), /unexpected end of JSON input/);
});

test('merge --plain retries a moved base and merges the same head; a head that moved meanwhile stops it', () => {
  const root = makeRepo({ 'README.md': 'x', '.github/workflows/ci.yml': 'on: pull_request\n' });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'bob/pin', 'tranche'], { cwd: root });
  const sha = commit(root, { 'pin.txt': 'moved' });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche', 'bob/pin'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const make = (headAfter) => {
    const calls = { tries: 0, merged: null, reads: 0 };
    return {
      calls,
      io: {
        getPR: () => { calls.reads++; return { state: 'open', draft: false, base: { ref: 'tranche', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: 'bob/pin', sha: calls.tries > 0 && headAfter ? headAfter : sha, repo: { full_name: 'o/r' } } }; },
        requiredChecks: () => ({ checks: [{ context: 'gate' }] }),
        checkRuns: () => [{ id: 1, status: 'completed', conclusion: 'success', started_at: '2026-11-02T10:00:00Z' }],
        repo: { released: () => false, shim: () => null, descends: () => false },
        mergePR: (slug, n, s) => { calls.tries++; if (calls.tries === 1) moved(); calls.merged = s; return { merged: true, sha: 'm'.repeat(40) }; },
      },
    };
  };
  const ok = make();
  const out = mergePlain(root, 4, { slug: 'o/r', log: quiet, wait: 0, io: ok.io, reviewed: 'two fresh reviews', rounds: 1 });
  assert.deepEqual([out.merged, ok.calls.tries, ok.calls.merged], [true, 2, sha]);
  const bad = make('f'.repeat(40));
  assert.throws(() => mergePlain(root, 4, { slug: 'o/r', log: quiet, wait: 0, io: bad.io, reviewed: 'two fresh reviews', rounds: 1 }), /changed while its base moved/);
  assert.equal(bad.calls.tries, 1);
});

test('pushRetry: a fetch-first rejection fetches, merges (never forced) and pushes again', () => {
  const { root, bare } = withOrigin({ 'README.md': 'x' });
  const other = clone(bare);
  const theirs = commit(other, { 'theirs.txt': 'x' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: other });
  const ours = commit(root, { 'ours.txt': 'y' });
  const logs = [];
  const tip = pushRetry(root, 'tranche', { wait: 0, log: (m) => logs.push(m) });
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/tranche'], { cwd: root }).split('\t')[0], tip);
  for (const c of [theirs, ours]) assert.equal(git(['merge-base', '--is-ancestor', c, tip], { cwd: root, allowFail: true }).code, 0, 'both sides kept');
  assert.equal(logs.length, 1);
  assert.match(logs[0], /moved on origin; fetching and trying again \(2 of 5\)/);
});

test('pushRetry: a conflict stops it with nothing pushed; another rejection stops at once', () => {
  const { root, bare } = withOrigin({ 'README.md': 'x' });
  const other = clone(bare);
  const theirs = commit(other, { 'README.md': 'theirs' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: other });
  const ours = commit(root, { 'README.md': 'ours' });
  assert.throws(() => pushRetry(root, 'tranche', { wait: 0, log: quiet }), /does not merge cleanly; nothing was pushed/);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/tranche'], { cwd: root }).split('\t')[0], theirs);
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), ours, 'the merge was aborted');
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '');
  // A non-fast-forward the local side already knows of is a moved ref too: it merges, and conflicts.
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.throws(() => pushRetry(root, 'tranche', { wait: 0, log: quiet }), /does not merge cleanly; nothing was pushed/);
});

// A push that fails the given ways first (calling before() each time, to move origin as another
// writer would), then pushes for real.
const flaky = (root, branch, failures, before = () => {}) => {
  let n = 0;
  return () => {
    if (n < failures.length) { before(n); return { code: 1, stderr: failures[n++] }; }
    n++;
    return git(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { cwd: root, allowFail: true });
  };
};
const LOCK = (b) => `remote: error: cannot lock ref 'refs/heads/${b}': is at 41bd0831f370 but expected 61e852893eab\nTo origin\n ! [remote rejected] HEAD -> ${b} (failed to update ref)\nerror: failed to push some refs`;
const E500 = 'remote: Internal Server Error\nfatal: unable to access \'https://github.com/o/r/\': The requested URL returned error: 500';
const tipOf = (root, b) => git(['ls-remote', 'origin', `refs/heads/${b}`], { cwd: root }).split('\t')[0];

test('pushRetry: a cannot-lock-ref rejection redoes the change on the moved tip and pushes', () => {
  const { root, bare } = withOrigin({ 'README.md': 'x' });
  const other = clone(bare);
  const rows = () => readFileSync(join(root, 'log.jsonl'), 'utf8');
  const make = () => { writeFileSync(join(root, 'log.jsonl'), (existsSync(join(root, 'log.jsonl')) ? rows() : '') + 'ours\n'); git(['add', '-A'], { cwd: root }); git(['commit', '-q', '-m', 'ours'], { cwd: root }); };
  make();
  const push = flaky(root, 'tranche', [LOCK('tranche')], () => { commit(other, { 'log.jsonl': 'theirs\n' }); git(['push', '-q', 'origin', 'tranche'], { cwd: other }); });
  const logs = [];
  const tip = pushRetry(root, 'tranche', { wait: 0, log: (m) => logs.push(m), redo: make, push });
  assert.equal(tipOf(root, 'tranche'), tip);
  assert.equal(git(['show', `${tip}:log.jsonl`], { cwd: root }), 'theirs\nours', 'redone on their row, not merged');
  assert.match(logs[0], /tranche moved on origin; fetching and trying again \(2 of 5\)/);
});

test('pushRetry: a 500 then success pushes; a 500 whose push landed is not pushed twice', () => {
  const { root } = withOrigin({ 'README.md': 'x' });
  const ours = commit(root, { 'a.txt': 'a' });
  const logs = [];
  assert.equal(pushRetry(root, 'tranche', { wait: 0, log: (m) => logs.push(m), push: flaky(root, 'tranche', [E500, E500]) }), ours);
  assert.equal(tipOf(root, 'tranche'), ours);
  assert.match(logs[0], /server error; fetching and trying again \(2 of 5\)/);
  assert.equal(logs.length, 2);
  // The 500 came back but the push landed: the fetched tip holds HEAD, so nothing is redone.
  const landed = commit(root, { 'b.txt': 'b' });
  let redone = 0;
  const push = flaky(root, 'tranche', [E500], () => git(['push', '-q', 'origin', 'HEAD:refs/heads/tranche'], { cwd: root }));
  assert.equal(pushRetry(root, 'tranche', { wait: 0, log: quiet, push, redo: () => { redone++; } }), landed);
  assert.equal(redone, 0);
  // Landed, then another writer pushed on top: ours is returned, not theirs.
  const { root: r2, bare } = withOrigin({ 'README.md': 'x' });
  const other = clone(bare);
  const mine = commit(r2, { 'c.txt': 'c' });
  const p2 = flaky(r2, 'tranche', [E500], () => {
    git(['push', '-q', 'origin', 'HEAD:refs/heads/tranche'], { cwd: r2 });
    git(['pull', '-q', '--ff-only', 'origin', 'tranche'], { cwd: other });
    commit(other, { 'd.txt': 'd' });
    git(['push', '-q', 'origin', 'tranche'], { cwd: other });
  });
  assert.equal(pushRetry(r2, 'tranche', { wait: 0, log: quiet, push: p2, redo: () => { redone++; } }), mine);
  assert.notEqual(tipOf(r2, 'tranche'), mine);
  assert.equal(redone, 0);
  // A 500 on the last try whose push landed is reported as pushed, not refused.
  const last = commit(root, { 'e.txt': 'e' });
  const p3 = flaky(root, 'tranche', [E500, E500], (n) => { if (n === 1) git(['push', '-q', 'origin', 'HEAD:refs/heads/tranche'], { cwd: root }); });
  assert.equal(pushRetry(root, 'tranche', { wait: 0, log: quiet, tries: 2, push: p3 }), last);
});

test('pushRetry: the real wordings of a moved ref and a server error are retried', async () => {
  const { REF_MOVED, SERVER_ERROR } = await import('../lib/util.mjs');
  for (const w of [' ! [rejected]        HEAD -> process-state (non-fast-forward)', ' ! [rejected] HEAD -> x (fetch first)', LOCK('process-state'), ' ! [remote rejected] HEAD -> x (stale info)']) assert.match(w, REF_MOVED);
  for (const w of [' ! [remote rejected] b -> b (Internal Server Error)', 'error: RPC failed; HTTP 500 curl 22 The requested URL returned error: 500', 'fatal: unable to access: Received HTTP code 503 from proxy after CONNECT', E500]) assert.match(w, SERVER_ERROR);
  for (const w of ['remote: Permission to o/r.git denied', ' ! [remote rejected] HEAD -> x (protected branch hook declined)', 'fatal: port 5432 is busy']) {
    assert.doesNotMatch(w, REF_MOVED); assert.doesNotMatch(w, SERVER_ERROR);
  }
});

test('pushRetry: gives up after the last try with the remote\'s words; other failures stop at once', () => {
  const { root } = withOrigin({ 'README.md': 'x' });
  commit(root, { 'a.txt': 'a' });
  const before = tipOf(root, 'tranche');
  let calls = 0;
  const always = () => { calls++; return { code: 1, stderr: LOCK('tranche') }; };
  assert.throws(() => pushRetry(root, 'tranche', { wait: 0, log: quiet, push: always }), (e) => e instanceof Fail && /refused 5 times/.test(e.message) && /cannot lock ref 'refs\/heads\/tranche': is at 41bd0831f370 but expected 61e852893eab/.test(e.message));
  assert.equal(calls, 5);
  assert.throws(() => pushRetry(root, 'tranche', { wait: 0, log: quiet, tries: 3, push: () => ({ code: 1, stderr: E500 }) }), /refused 3 times \(the server kept failing\).*returned error: 500/s);
  calls = 0;
  assert.throws(() => pushRetry(root, 'tranche', { wait: 0, log: quiet, push: () => { calls++; return { code: 1, stderr: 'remote: Permission to o/r.git denied' }; } }), /the push of tranche failed: remote: Permission/);
  assert.equal(calls, 1);
  assert.equal(tipOf(root, 'tranche'), before);
});

// ===== file: layer-early.test.mjs =====

// Early starts into the next layer (R14; Bob, 6 Nov ~18:55: "Why didn't the early starts launch
