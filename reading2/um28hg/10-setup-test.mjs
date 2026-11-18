test('job start: the job\'s coordinator is the addressed BOB, not the config\'s coordinator; --coordinator overrides it', () => {
  const r = makeRepo({ 'process/config.json': { coordinator: 'session_rootcoord' }, 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': 'x' });
  git(['branch', 'tranche'], { cwd: r });
  assert.throws(() => jobStart(r, 'alpha', { push: false, log: quiet }), /no coordinator: no BOB is addressed on process-state \(addresses\/bob\.json\); ROOT records one with start record bob <id>, and --coordinator <session id> overrides it for one start/);
  // The state branch as origin holds it, addressing BOB.
  const tree = git(['mktree'], { cwd: r, input: `100644 blob ${git(['hash-object', '-w', '--stdin'], { cwd: r, input: '{"session":"session_bob7","at":"x"}' })}\tbob.json\n` });
  const top = git(['mktree'], { cwd: r, input: `040000 tree ${tree}\taddresses\n` });
  git(['update-ref', 'refs/remotes/origin/process-state', git(['commit-tree', top, '-m', 'state'], { cwd: r })], { cwd: r });
  const a = jobStart(r, 'alpha', { push: false, log: quiet });
  assert.match(a.start, /Your coordinator is session `session_bob7` \(BOB\)\./);
  assert.doesNotMatch(a.start, /session_rootcoord/);
  git(['branch', '-q', '-D', 'job/alpha'], { cwd: r });
  const b = jobStart(r, 'alpha', { coordinator: 'session_other', push: false, log: quiet });
  assert.match(b.start, /Your coordinator is session `session_other`\. Its messages are instructions/);
});

// Onboarding steps, 2 Nov: classic protection, the approvals, the session's branch, the deploy token.
test('classic branch protection on main or the tranche is reported missing, to remove; rulesets alone are set', () => {
  assert.equal(state(check(world()), 'classic-protection').state, 'set');
  const w = world();
  w.branchInfo.main.protection.enabled = true;
  let r = check(w);
  assert.deepEqual(r.missing, ['classic-protection']);
  assert.equal(state(r, 'classic-protection').detail, 'main: a classic branch protection rule, to remove');
  const w2 = world();
  w2.protection.tranche = { url: 'https://api.github.com/repos/o/r/branches/tranche/protection' };
  assert.match(state(check(w2), 'classic-protection').detail, /^tranche: a classic branch protection rule, to remove$/);
  const w3 = world();
  delete w3.branchInfo.tranche.protection;
  assert.match(state(check(w3), 'classic-protection').detail, /tranche: protected, and whether by a classic rule could not be read/);
  const w4 = world();
  delete w4.branchInfo.tranche;
  assert.match(state(check(w4), 'classic-protection').detail, /tranche: could not read the branch/);
  // A tranche not pushed yet is unmeasured; one that exists but cannot be read is missing.
  const w6 = world();
  delete w6.branchInfo.tranche;
  w6.io.branchExists = (b) => b !== 'tranche';
  assert.deepEqual(state(check(w6), 'classic-protection'), { id: 'classic-protection', what: state(check(w6), 'classic-protection').what, state: 'unmeasured', detail: 'tranche not pushed yet' });
  const w5 = world();
  w5.branchInfo.main = { protected: false };
  w5.branchInfo.tranche = { protected: false };
  assert.equal(state(check(w5), 'classic-protection').state, 'set');
});

test('approvals: one block on the tranche, last changed by the owner\'s website commit', () => {
  const ok = check(world());
  assert.equal(state(ok, 'approvals').detail, "one block, the one neobobkrause's website commit abc1234567 set");
  for (const [change, why] of [
    [(w) => { delete w.files['CLAUDE.md']; }, /no CLAUDE.md on tranche/],
    [(w) => { w.files['CLAUDE.md'] = '# Product\n'; }, /has no "## Standing approvals from Bob" block/],
    [(w) => { w.files['CLAUDE.md'] += '\n## More approvals\n\nx\n'; }, /has 2 approvals headings; only one block may exist/],
    [(w) => { w.top = null; }, /no approvals block on tranche or main was last set by neobobkrause's own commit/],
    [(w) => { w.top = { ref: 'origin/main', sha: 'def4567890123', at: 2, block: '## Standing approvals from Bob\n\nolder' }; }, /not the block neobobkrause last set through GitHub's website: that is commit def4567890's, on origin\/main/],
  ]) {
    const w = world();
    change(w);
    const r = check(w);
    // A CLAUDE.md without the process lines is also process-lines' gap.
    assert.deepEqual(r.missing.filter((id) => id !== 'process-lines'), ['approvals']);
    assert.match(state(r, 'approvals').detail, why);
  }
  // The heading and owner come from the tranche's config.
  const w = world();
  w.files['process/config.json'] = JSON.stringify({ ...JSON.parse(w.files['process/config.json']), approvals: { heading: '## Owner rules', owner: 'someone' } });
  w.files['CLAUDE.md'] = '## Owner rules\n\nx\n';
  assert.equal(state(check(w), 'approvals').detail, "one block, the one someone's website commit abc1234567 set");
});

test('session-branch: a session not started from the tranche is missing, and job start says to start from the tranche', () => {
  const w = world();
  w.onTranche = { ok: false, head: 'b'.repeat(40), tip: 'a'.repeat(40) };
  const r = check(w);
  assert.deepEqual(r.missing, ['session-branch']);
  assert.equal(state(r, 'session-branch').detail, 'HEAD bbbbbbbbbb is not the tip of tranche (aaaaaaaaaa) with its approvals. Start the session from the tranche branch, or bring it up to date (git pull origin tranche)');
  const repo = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': 'x' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: repo });
  git(['remote', 'add', 'origin', bare], { cwd: repo });
  const detail = 'main holds no approvals block, so it is not from the tranche branch. Start the session from the tranche branch';
  assert.throws(() => jobStart(repo, 'alpha', { coordinator: 's', open: () => null, find: () => null, setup: () => ({ ok: false, missing: ['session-branch', 'account'], results: [{ id: 'session-branch', detail }] }), log: quiet }),
    /this session's checkout is not one job start accepts: sessions act on the standing approvals of the tranche branch; nothing was started\. main holds no approvals block, so it is not from the tranche branch\. Start the session from the tranche branch \(also missing: account\)$/);
});

test('deploy-token: one harmless read per scope, each reported present or missing, the token never printed', () => {
  const w = world();
  const out = [];
  let r = setupCheck(root(), { slug: 'o/r', io: w.io, log: (m) => out.push(m) });
  // Three scopes, no Workers KV: the product binds none (review follow-ups, 2 Nov).
  assert.equal(state(r, 'deploy-token').detail, 'Workers Scripts: present; Workers R2 Storage: present; Containers: present');
  assert.deepEqual(w.cfAsked, ['accounts/acc123/workers/scripts', 'accounts/acc123/r2/buckets', 'accounts/acc123/containers/applications']);
  w.cf = { r2: { status: 403, success: false }, containers: { status: 200, success: false } };
  r = setupCheck(root(), { slug: 'o/r', io: w.io, log: (m) => out.push(m) });
  assert.deepEqual(r.missing, ['deploy-token']);
  assert.equal(state(r, 'deploy-token').detail, 'Workers Scripts: present; Workers R2 Storage: missing (403); Containers: missing (200)');
  assert.doesNotMatch(out.join('\n'), /tok-|SECRET/, 'the token is never printed');
  delete w.env.CLOUDFLARE_API_TOKEN;
  assert.equal(state(check(w), 'deploy-token').detail, "CLOUDFLARE_API_TOKEN is not in this session's environment");
  const n = world();
  n.files['process/config.json'] = JSON.stringify({ coordinator: 's', deploy: { internal_walk: { run: ['x'] } } });
  assert.equal(state(check(n), 'deploy-token').state, 'not configured');
  for (const [acct, envList] of [[null, null], ['', []], ['   ', null]]) {
    n.files['process/config.json'] = JSON.stringify({ coordinator: 's', cloudflare_account: acct, environment: envList, deploy: { internal_walk: { run: ['x'] } } });
    const rn = check(n);
    assert.equal(rn.ok, true, JSON.stringify(rn.missing));
    for (const id of ['deploy-token', 'deploy-account', 'environment']) assert.equal(state(rn, id).state, 'not configured', `${id} with ${JSON.stringify(acct)}`);
  }
  n.files['process/config.json'] = JSON.stringify({ coordinator: 's', cloudflare_account: false, deploy: { internal_walk: { run: ['x'] } } });
  const rf = check(n);
  for (const id of ['deploy-token', 'deploy-account']) assert.equal(state(rf, id).detail, 'process/config.json cloudflare_account is not an account ID', id);
  assert.equal(n.cfAsked.length, 0);
});

// Reviews of PR 24: the approvals' last change by ancestry, a shallow clone, the session's
// branch, the Cloudflare read itself, and the step checker's "none" lines.
const HEAD_ = '## Standing approvals from Bob';
const claude = (words) => `# P\n\n${HEAD_}\n\n${words}\n`;
function originRepo() {
  const r = makeRepo({ 'README.md': 'x' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: r });
  git(['remote', 'add', 'origin', bare], { cwd: r });
  return { r, bare };
}
const tip = (r, ref = 'HEAD') => git(['rev-parse', ref], { cwd: r });

test('cloudflareRead gives curl the token on stdin, never in its arguments, and reads status and success', () => {
  const dir = mkdtempSync(join(tmpdir(), 'p3-curl-'));
  const fake = join(dir, 'curl');
  writeFileSync(fake, `#!/bin/sh\nprintf '%s\\n' "$@" > "${dir}/argv"\ncat > "${dir}/stdin"\nprintf '%s\\n%s\\n%s' "$FAKE_BODY" "$FAKE_RETRY" "$FAKE_STATUS"\n`);
  chmodSync(fake, 0o755);
  const saved = { PATH: process.env.PATH, FAKE_BODY: process.env.FAKE_BODY, FAKE_STATUS: process.env.FAKE_STATUS };
  try {
    process.env.PATH = `${dir}:${saved.PATH}`;
    const env = { CLOUDFLARE_API_TOKEN: 'tok-SECRET-value' };
    for (const [body, status, want, retry = ''] of [['{"success":true,"result":[]}', '200', { status: 200, success: true, retryAfter: null }], ['[]', '200', { status: 200, success: true, retryAfter: null }], ['{"success":false}', '403', { status: 403, success: false, retryAfter: null }], ['not json', '502', { status: 502, success: null, retryAfter: null }], ['{"success":false}', '429', { status: 429, success: false, retryAfter: 155 }, '155']]) {
      process.env.FAKE_BODY = body;
      process.env.FAKE_STATUS = status;
      process.env.FAKE_RETRY = retry;
      assert.deepEqual(cloudflareRead('accounts/acc/r2/buckets', env), want, body);
    }
    const argv = readFileSync(join(dir, 'argv'), 'utf8');
    assert.doesNotMatch(argv, /SECRET/);
    assert.match(argv, /https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\/acc\/r2\/buckets/);
    assert.equal(readFileSync(join(dir, 'stdin'), 'utf8'), 'Authorization: Bearer tok-SECRET-value\n');
  } finally {
    for (const [k, v] of Object.entries(saved)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
});

test('job start names the tranche the setup check read', () => {
  const repo = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': 'x' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: repo });
  git(['remote', 'add', 'origin', bare], { cwd: repo });
  assert.throws(() => jobStart(repo, 'alpha', { coordinator: 's', open: () => null, find: () => null, setup: () => ({ ok: false, missing: ['session-branch'], tranche: 'next' }), log: quiet }),
    /this session's checkout is not one job start accepts: sessions act on the standing approvals of the next branch; nothing was started\. this checkout is not the next branch\. Start the session from the next branch$/);
});

test('end to end: job start on a checkout of main, with the real setup check reading git, stops with the plain message', () => {
  const { r } = originRepo();
  commit(r, { 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': 'x' }, 'ledger');
  git(['push', '-q', 'origin', 'main'], { cwd: r });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: r });
  const w = world();
  commit(r, w.files, 'setup');
  git(['push', '-q', 'origin', 'tranche'], { cwd: r });
  git(['checkout', '-q', 'main'], { cwd: r });
  const setup = (root, o) => setupCheck(root, { ...o, slug: 'o/r', io: { api: w.io.api, env: w.env, cf: w.io.cf, branchExists: () => true } });
