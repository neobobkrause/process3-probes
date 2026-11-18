test('a second amendment keeps the first one\'s claims, in either order (review of PR 64)', () => {
  for (const order of [['nv', 'ex'], ['ex', 'nv']]) {
    const { root, f } = completed();
    for (const k of order) jobComplete(root, 'alpha', { gh: f.gh, ...(k === 'nv' ? { notVerified: ['the walker'] } : { exemptRevert: 'why' }), log: quiet });
    assert.equal(f.state.comments.length, 3, order.join(','));
    const r = parseBlock(f.state.comments[2].body, 'p3:receipt');
    assert.deepEqual(r.exempt, { revert: 'why' }, order.join(','));
    assert.deepEqual(r.not_verified, ['the live site', 'the walker'], order.join(','));
    assert.deepEqual(r.amended.was, order[0] === 'nv' ? { exempt: {}, not_verified: ['the live site', 'the walker'] } : { exempt: { revert: 'why' }, not_verified: ['the live site'] });
    // the same claims once more post nothing
    jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'why', notVerified: ['the walker'], log: quiet });
    assert.equal(f.state.comments.length, 3);
  }
});

// An amended receipt changes no claim the gate reads (Bob, 5 Nov: the revert check is advisory),
// so a ready pull request is not gated again for it.
const RED = { status: 'completed', conclusion: 'failure', started_at: '2026-11-05T00:00:00Z' };
test('an amended revert exemption on a ready pull request posts the receipt and edits nothing', () => {
  const { root, f } = completed();
  f.state.gate = RED;
  jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'why', log: quiet });
  assert.equal(f.state.comments.length, 2);
  assert.equal(f.state.edits.length, 0);
});


test('an amendment on a draft pull request is marked ready, not edited', () => {
  const { root, f } = completed();
  f.state.gate = RED;
  f.state.isDraft = true;
  const ready = f.state.ready;
  jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'why', log: quiet });
  assert.equal(f.state.ready, ready + 1);
  assert.equal(f.state.edits.length, 0);
});

test('a COMPLETE job may amend with .process moved to a newer pin; a WORKING job may not', () => {
  const tool = makeRepo({ 'tool/x.mjs': 'export const v = 1;\n' });
  const sub = (root) => {
    git(['-c', 'protocol.file.allow=always', 'submodule', 'add', '-q', tool, '.process'], { cwd: root });
    git(['commit', '-q', '-m', 'pin'], { cwd: root });
  };
  const bump = (root) => {
    commit(tool, { 'tool/x.mjs': `export const v = ${Date.now()};\n` });
    git(['-c', 'protocol.file.allow=always', 'fetch', '-q', 'origin'], { cwd: join(root, '.process') });
    git(['checkout', '-q', 'origin/HEAD'], { cwd: join(root, '.process') });
    assert.match(git(['status', '--porcelain', '--untracked-files=no'], { cwd: root }), /\.process/);
  };
  const w = withOrigin();
  git(['checkout', '-q', 'tranche'], { cwd: w });
  sub(w);
  git(['push', '-q', 'origin', 'tranche'], { cwd: w });
  git(['checkout', '-q', 'main'], { cwd: w });
  const g = fakeGitHub();
  g.state.failReady = false;
  jobStart(w, 'alpha', { coordinator: 's', setup: ready, open: g.open, find: g.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: w });
  git(['-c', 'protocol.file.allow=always', 'submodule', 'update', '-q', '--init'], { cwd: w });
  commit(w, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  bump(w);
  // The tool runs from the product's .process, as it does in a session.
  const toolRoot = join(w, '.process');
  assert.throws(() => jobComplete(w, 'alpha', { gh: g.gh, toolRoot, log: quiet }), /\.process is not at the pin this branch records, and a job never commits \.process: run `git submodule update \.process`/, 'WORKING: a moved submodule is refused, naming the update');
  git(['-c', 'protocol.file.allow=always', 'submodule', 'update', '-q'], { cwd: w });
  jobComplete(w, 'alpha', { gh: g.gh, toolRoot, log: quiet });
  bump(w);
  jobComplete(w, 'alpha', { gh: g.gh, toolRoot, exemptRevert: 'why', log: quiet });
  assert.equal(g.state.comments.length, 2);
  assert.equal(parseBlock(g.state.comments[1].body, 'p3:receipt').exempt.revert, 'why');
});

// Copy PR 79, 4 Nov: job site was COMPLETE, its gate went red, and it pushed fixes; job complete
// refused ("commits were added after it"), --reopen needs a merged PR and --restart WORKING.
// With the pull request open, a rerun after new commits completes a new attempt.
function redAndFixed() {
  const { root, f } = completed();
  const first = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'HEAD:refs/heads/job/alpha'], { cwd: root });
  const fix = commit(root, { 'test/alpha/c.test.mjs': passing });
  return { root, f, first, fix };
}

test('a COMPLETE job with fix commits after it completes attempt 2: checks, suite, start row, COMPLETE, receipt, draft then ready', () => {
  const { root, f, first, fix } = redAndFixed();
  const fixAt = new Date(git(['log', '-1', '--format=%cI', fix], { cwd: root })).toISOString().replace(/\.\d+Z$/, 'Z');
  assert.equal(f.state.ready, 1);
  const r = jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'browser test skips in CI without Chromium', log: quiet });
  assert.equal(r.ok, true);
  assert.equal(r.receipt.attempt, 2);
  assert.equal(r.receipt.after, first, 'names the COMPLETE commit it follows');
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(r.receipt.sha, tip);
  assert.notEqual(tip, fix, 'a new COMPLETE commit');
  assert.equal(git(['rev-parse', 'HEAD^'], { cwd: root }), fix);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], tip, 'pushed');
  assert.equal(r.receipt.commands.find((c) => c.suite), undefined, 'no suite in the session (AUD-7)');
  assert.deepEqual(r.receipt.exempt, { revert: 'browser test skips in CI without Chromium' });
  assert.equal(readEntry(root, 'alpha').status.state, 'COMPLETE');
  const rows = readRows(root, 'alpha');
  assert.deepEqual(rows.map((x) => [x.event, x.attempt]), [['start', 1], ['complete', 1], ['start', 2], ['complete', 2]]);
  assert.equal(rows[2].at, fixAt, 'attempt 2 starts at its first commit');
  assert.deepEqual(rows[2].again, { after: first, pr: 9 });
  assert.equal(rows[2].branch, 'job/alpha', 'the --again start row names the branch it works on (copy PR 454)');
  assert.equal(rows[3].receipt.attempt, 2);
  // Only its records (the entry is unchanged when both completes fall in the same second).
  const names = git(['show', '--name-only', '--format=', 'HEAD'], { cwd: root }).split('\n');
  assert.ok(names.includes('process/metrics/alpha.jsonl') && names.every((n) => ['process/ledger/alpha.json', 'process/metrics/alpha.jsonl'].includes(n)), names.join(', '));
  assert.equal(f.state.drafted, 1, 'made a draft before the push');
  assert.equal(f.state.ready, 2, 'ready again after the receipt');
  assert.equal(f.state.comments.length, 2);
  const posted = parseBlock(f.state.comments[1].body, 'p3:receipt');
  assert.equal(posted.attempt, 2);
  assert.match(f.state.comments[1].body, /\nReceipt for job `alpha`, attempt 2,/);
  // A plain rerun at the new COMPLETE commit posts nothing and starts no attempt 3.
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.equal(f.state.comments.length, 2);
  assert.equal(readRows(root, 'alpha').length, 4);
});

// Copy, 4 Nov: site's attempt 2 committed and stopped on the draft step (GraphQL, HTTP 403),
// before its push: no receipt, a red gate. The rerun finishes push, receipt, ready.
test('attempt 2 stopped on the draft step: a rerun pushes, posts attempt 2\'s receipt and marks ready', () => {
  const { root, f } = redAndFixed();
  const draft = f.gh.toDraft;
  f.gh.toDraft = () => { throw new Error('gh api graphql -f failed (HTTP 403)'); };
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /HTTP 403/);
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(readEntry(root, 'alpha').status.state, 'COMPLETE');
  assert.notEqual(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], tip, 'not pushed');
  assert.equal(f.state.comments.length, 1, 'no attempt 2 receipt yet');
  f.gh.toDraft = draft;
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], tip);
  assert.equal(f.state.comments.length, 2);
  assert.deepEqual([parseBlock(f.state.comments[1].body, 'p3:receipt').attempt, parseBlock(f.state.comments[1].body, 'p3:receipt').sha], [2, tip]);
  assert.deepEqual([f.state.drafted, f.state.ready], [1, 2]);
});

test('attempt 2 pushed while ready but never given its receipt: a rerun makes it a draft, posts the receipt, then marks ready', () => {
  const { root, f } = redAndFixed();
  const draft = f.gh.toDraft;
  f.gh.toDraft = () => { throw new Error('HTTP 403'); };
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /HTTP 403/);
  f.gh.toDraft = draft;
  git(['push', '-q', 'origin', 'HEAD:refs/heads/job/alpha'], { cwd: root }); // a push by hand
  const seen = [];
  const d = f.gh.toDraft, a = f.gh.addComment, m = f.gh.markReady;
  f.gh.toDraft = (...x) => { seen.push('draft'); return d(...x); };
  f.gh.addComment = (...x) => { seen.push('receipt'); return a(...x); };
  f.gh.markReady = (...x) => { seen.push('ready'); return m(...x); };
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.deepEqual(seen, ['draft', 'receipt', 'ready']);
  assert.equal(parseBlock(f.state.comments[1].body, 'p3:receipt').attempt, 2);
  // Done: a plain rerun touches nothing.
  seen.length = 0;
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.deepEqual(seen, []);
});

test('attempt 2 whose ready step fails after its receipt: a rerun marks ready without a second receipt', () => {
  const { root, f } = redAndFixed();
  f.state.failReady = true;
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /network/);
  assert.equal(f.state.comments.length, 2, 'the receipt was posted before the failed ready');
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.equal(f.state.comments.length, 2);
  assert.equal(f.state.ready, 2);
  assert.equal(f.state.drafted, 1);
});

test('attempt 2 after the job merges an older tranche commit starts at its own first-parent commit, after attempt 1 (review of PR 81)', () => {
  const { root, f } = completed();
  const done = readRows(root, 'alpha').at(-1).at;
  const env = { ...process.env };
  try {
    process.env.GIT_COMMITTER_DATE = process.env.GIT_AUTHOR_DATE = '2020-01-01T00:00:00Z';
    git(['checkout', '-q', 'tranche'], { cwd: root });
    commit(root, { 'other.txt': 'older tranche work' });
    git(['push', '-q', 'origin', 'tranche'], { cwd: root });
    git(['checkout', '-q', 'job/alpha'], { cwd: root });
  } finally { process.env = env; }
  git(['merge', '-q', '--no-ff', '--no-edit', 'tranche'], { cwd: root });
  const mergeAt = new Date(git(['log', '-1', '--format=%cI'], { cwd: root })).toISOString().replace(/\.\d+Z$/, 'Z');
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  const s2 = readRows(root, 'alpha').filter((x) => x.event === 'start')[1];
  assert.ok(s2.at >= done, `${s2.at} is not before attempt 1's complete ${done}`);
  assert.equal(s2.at, mergeAt < done ? done : mergeAt);
});

test('attempt 2 with a red test completes all the same: the suite is CI\'s (AUD-7)', () => {
  const { root, f } = completed();
  const before = commit(root, { 'test/alpha/b.test.mjs': failing });
  const r = jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  assert.equal(r.ok, true);
  assert.notEqual(git(['rev-parse', 'HEAD'], { cwd: root }), before);
  assert.equal(f.state.comments.length, 2);
});

test('the same-commit amendment works on attempt 2 and keeps its attempt number', () => {
  const { root, f } = redAndFixed();
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  jobComplete(root, 'alpha', { gh: f.gh, exemptRevert: 'why', log: quiet });
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), tip, 'nothing committed');
  assert.equal(f.state.comments.length, 3);
  assert.match(f.state.comments[2].body, /\nAmended receipt for job `alpha`, attempt 2,/);
  const r = parseBlock(f.state.comments[2].body, 'p3:receipt');
