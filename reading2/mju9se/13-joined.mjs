// ===== file: setup.test.mjs (continued) =====

});

test('artifact retention: under 90 days is missing, and no artifact yet is unmeasured, not missing', () => {
  const w = world();
  w.artifacts.artifacts = [{ created_at: '2026-11-02T00:00:00Z', expires_at: '2026-12-02T00:00:00Z' }];
  assert.match(state(check(w), 'artifact-retention').detail, /kept 30 days/);
  assert.deepEqual(check(w).missing, ['artifact-retention']);
  const none = world();
  none.artifacts = { total_count: 0, artifacts: [] };
  const r = check(none);
  assert.equal(r.ok, true);
  assert.equal(state(r, 'artifact-retention').state, 'unmeasured');
});

test('the tranche\'s config must name a coordinator', () => {
  const w = world();
  w.files['process/config.json'] = JSON.stringify({ tranche: 'tranche', deploy: { internal_walk: { run: ['x'] } } });
  assert.deepEqual(check(w).missing, ['coordinator']);
});

test('the files are read from the tranche on origin, through git', () => {
  const r = makeRepo({ 'README.md': 'x' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: r });
  git(['remote', 'add', 'origin', bare], { cwd: r });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: r });
  const w = world();
  commit(r, w.files, 'setup');
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: r });
  // The local checkout is main, which has neither file; every file is read from the tranche, and
  // the one gap is the session's own branch: main is not the tranche (reviews of PR 24).
  git(['checkout', '-q', 'main'], { cwd: r });
  const res = setupCheck(r, { slug: 'o/r', io: { api: w.io.api, env: w.env, cf: w.io.cf, pin: PIN }, log: quiet });
  assert.deepEqual(res.missing, ['session-branch'], JSON.stringify(res.results));
  assert.equal(state(res, 'coordinator').detail, 'session_bob');
  // The approvals' last change and the session's branch are read through git too.
  const sha = git(['rev-parse', 'origin/tranche'], { cwd: r });
  assert.equal(state(res, 'approvals').detail, `one block, the one neobobkrause's website commit ${sha.slice(0, 10)} set`);
  assert.match(state(res, 'session-branch').detail, /^HEAD [0-9a-f]{10} is not the tip of tranche \([0-9a-f]{10}\) with its approvals\. Start the session from the tranche branch/);
  // A later commit on the tranche that leaves the block alone does not move its last change;
  // one that edits the block does, and it is not the owner's website commit.
  git(['checkout', '-q', 'tranche'], { cwd: r });
  commit(r, { 'README.md': 'y' }, 'other');
  git(['push', '-q', 'origin', 'tranche'], { cwd: r });
  let asked = [];
  const api2 = (p) => { asked.push(p); return w.io.api(p); };
  assert.equal(state(setupCheck(r, { slug: 'o/r', io: { api: api2, env: w.env, cf: w.io.cf }, log: quiet }), 'approvals').state, 'set');
  assert.ok(asked.includes(`repos/o/r/commits/${sha}`), asked.join(', '));
  commit(r, { 'CLAUDE.md': w.files['CLAUDE.md'].replace("The owner's words.\n", "The owner's words.\nSessions may also do anything.\n") }, 'widen');
  git(['push', '-q', 'origin', 'tranche'], { cwd: r });
  const widen = git(['rev-parse', 'HEAD'], { cwd: r });
  w.commit = { committer: { login: 'acmewidget' }, author: { login: 'acmewidget' }, commit: { verification: { verified: false } } };
  asked = [];
  const a = state(setupCheck(r, { slug: 'o/r', io: { api: api2, env: w.env, cf: w.io.cf }, log: quiet }), 'approvals');
  assert.equal(a.state, 'missing');
  assert.ok(asked.includes(`repos/o/r/commits/${widen}`), asked.join(', '));
  assert.equal(a.detail, "no approvals block on tranche or main was last set by neobobkrause's own commit through GitHub's website");
  // At the tranche's tip, the session's branch is set.
  assert.equal(state(setupCheck(r, { slug: 'o/r', io: { api: w.io.api, env: w.env, cf: w.io.cf }, log: quiet }), 'session-branch').state, 'set');
});

test('job start runs the setup check first and starts nothing while a condition is missing', () => {
  const r = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': 'x' });
  git(['branch', 'tranche'], { cwd: r });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: r });
  git(['remote', 'add', 'origin', bare], { cwd: r });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: r });
  let opened = 0;
  const open = () => { opened++; return { number: 9, html_url: 'pr' }; };
  assert.throws(() => jobStart(r, 'alpha', { coordinator: 's', open, find: () => null, setup: () => ({ ok: false, missing: ['deny-list', 'account'] }), log: quiet }),
    /setup is not complete \(deny-list, account\); nothing was started/);
  assert.equal(opened, 0);
  assert.equal(git(['branch', '--list', 'job/alpha'], { cwd: r }), '');
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: r }), '');
  const seen = [];
  jobStart(r, 'alpha', { coordinator: 's', open, find: () => null, setup: (root, o) => { seen.push(o.slug); return { ok: true, missing: [] }; }, log: quiet });
  assert.equal(opened, 1);
  assert.equal(seen.length, 1);
});

// The developer's steps (Bob, 2 Nov): setup/DEVELOPER.md holds only the owner's acts, checked
// against the list by the real checker.
import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { bashRuleMatches, cloudflareRead } from '../lib/setup.mjs';
import { DEVELOPER, checkDeveloperSteps } from './developer-steps.mjs';

test('DEVELOPER.md: every step complete, every developer condition covered, only theirs named, the deny lines the list\'s', () => {
  assert.deepEqual(checkDeveloperSteps(readFileSync(DEVELOPER, 'utf8')), []);
});

// Deploy tokens are a standard condition (Bob, 2 Nov, before the log; unverified): present by name, the account matching.
test('environment: every listed variable is present, and only names are ever printed', () => {
  const w = world();
  const out = [];
  const r = setupCheck(root(), { slug: 'o/r', io: w.io, log: (m) => out.push(m) });
  assert.equal(state(r, 'environment').state, 'set');
  assert.match(state(r, 'environment').detail, /present: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID/);
  delete w.env.CLOUDFLARE_API_TOKEN;
  const r2 = setupCheck(root(), { slug: 'o/r', io: w.io, log: (m) => out.push(m) });
  assert.deepEqual(r2.missing, ['environment', 'deploy-token']);
  assert.match(state(r2, 'environment').detail, /not in this session's environment: CLOUDFLARE_API_TOKEN$/);
  assert.doesNotMatch(out.join('\n'), /tok-|SECRET|value|\b16\b/, 'no value, prefix or length');
  // No list in the config: not configured, which does not stop a start.
  const n = world();
  n.files['process/config.json'] = JSON.stringify({ coordinator: 's', deploy: { internal_walk: { run: ['x'] } } });
  const r3 = check(n);
  assert.equal(r3.ok, true);
  assert.equal(state(r3, 'environment').state, 'not configured');
  assert.equal(state(r3, 'deploy-account').state, 'not configured');
});

test('deploy-account: CLOUDFLARE_ACCOUNT_ID must be the configured account, reported as yes or no', () => {
  const w = world();
  assert.equal(state(check(w), 'deploy-account').detail, 'CLOUDFLARE_ACCOUNT_ID matches acc123: yes');
  w.env.CLOUDFLARE_ACCOUNT_ID = 'other-account-999';
  const out = [];
  const r = setupCheck(root(), { slug: 'o/r', io: w.io, log: (m) => out.push(m) });
  assert.ok(r.missing.includes('deploy-account'));
  assert.equal(state(r, 'deploy-account').detail, 'CLOUDFLARE_ACCOUNT_ID matches acc123: no');
  assert.doesNotMatch(out.join('\n'), /other-account-999/, 'only the configured account is printed');
  delete w.env.CLOUDFLARE_ACCOUNT_ID;
  assert.match(state(check(w), 'deploy-account').detail, /CLOUDFLARE_ACCOUNT_ID is not in this session's environment \(configured: acc123\)/);
});

// Confirming review of PR 15.
test('the bypass check fails closed: a ruleset without current_user_can_bypass does not count', () => {
  const w = world();
  delete w.sets[1].current_user_can_bypass;
  delete w.sets[2].current_user_can_bypass;
  const r = check(w);
  assert.deepEqual(r.missing.sort(), ['ruleset-all-branches', 'ruleset-main-tranche']);
  assert.match(state(r, 'ruleset-main-tranche').detail, /can bypass ruleset "process3"/);
});

// C17 (the coordinator, 7 Nov): the session's push is the tool's (`p3 github push`); Bob's R17c settings
// deny raw git push, and this condition refused them, stopping every job start on the copy.
test('any deny rule that would block the tool\'s push is found; a raw git push denied is not', () => {
  for (const rule of ['Bash(node *)', 'Bash(node .process/tool/p3.mjs github push *)', 'Bash(node .process/tool/p3.mjs:*)', 'Bash']) {
    const w = world();
    w.files['.claude/settings.json'] = JSON.stringify({ permissions: { deny: [...DENY, rule] } });
    assert.match(state(check(w), 'deny-list').detail, new RegExp(`holds ${rule.replace(/[()*]/g, '\\$&')}, which blocks`), rule);
  }
  for (const rule of ['Bash(git push origin :*)', 'Bash(git push *)', 'Bash(git push)', 'Bash(gh *)']) {
    const w = world();
    w.files['.claude/settings.json'] = JSON.stringify({ permissions: { deny: [...DENY, rule] } });
    assert.equal(state(check(w), 'deny-list').state, 'set', rule);
  }
  const w = world();
  w.files['.claude/settings.json'] = JSON.stringify({ permissions: { deny: [...DENY, 'Bash(git fetch *)'] } });
  // A rule refusing another told command is a warning, not a missing condition (PD-21).
  assert.equal(state(check(w), 'deny-list').state, 'set');
  assert.equal(bashRuleMatches('Bash(git push origin --delete *)', 'git push origin job/x'), false);
  assert.equal(bashRuleMatches('Bash(git push -f *)', 'git push -u origin job/x'), false);
  assert.equal(bashRuleMatches('Bash(git push origin main)', 'git push origin job/x'), false);
  assert.equal(bashRuleMatches('Bash(git push origin :*)', 'git push -u origin job/x'), false, 'a prefix match only');
  assert.equal(bashRuleMatches('Bash(ls *)', 'ls'), true, 'a trailing " *" matches the bare command');
});

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
  assert.throws(() => jobStart(r, 'alpha', { coordinator: 's', open: () => null, find: () => null, setup, log: quiet }),
    /this session's checkout is not one job start accepts: sessions act on the standing approvals of the tranche branch; nothing was started\. HEAD [0-9a-f]{10} is not the tip of tranche/);
});

// Review follow-ups, 2 Nov: the approvals on the tranche must be the newest block the owner set
// through the website in its history, and a tranche with no config judges by the repository's
// owner as GitHub has it.
const datedCommit = (r, files, msg, date) => {
  write(r, files);
  git(['add', '-A'], { cwd: r });
  git(['commit', '-q', '-m', msg], { cwd: r, env: { ...process.env, GIT_COMMITTER_DATE: date, GIT_AUTHOR_DATE: date } });
  return tip(r);
};
function restoredTranche(words) {
  const { r } = originRepo();
  const w = world();
  const o1 = datedCommit(r, { ...w.files, 'CLAUDE.md': claude('may push') }, 'the owner on main', '2026-11-01T10:00:00Z');
  git(['checkout', '-q', '-b', 'tranche'], { cwd: r });
  const o2 = datedCommit(r, { 'CLAUDE.md': claude('may push and release') }, 'the owner on the tranche', '2026-11-02T10:00:00Z');
  git(['checkout', '-q', 'main'], { cwd: r });
  datedCommit(r, { 'm.txt': 'm' }, 'main moves', '2026-11-02T11:00:00Z');
  git(['checkout', '-q', 'tranche'], { cwd: r });
  git(['merge', '-q', '--no-ff', '--no-commit', 'main'], { cwd: r, allowFail: true });
  if (words) write(r, { 'CLAUDE.md': claude(words) });
  git(['add', '-A'], { cwd: r });
  git(['commit', '-q', '-m', 'merge main into the tranche'], { cwd: r });
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: r });
  const notOwner = { committer: { login: 'acmewidget' }, author: { login: 'acmewidget' }, commit: { verification: { verified: false } } };
  const api = (p) => (/\/commits\/[0-9a-f]+$/.test(p) ? ([o1, o2].some((s) => p.endsWith(s)) ? w.commit : notOwner) : w.io.api(p));
  const res = setupCheck(r, { slug: 'o/r', io: { api, env: w.env, cf: w.io.cf, onTranche: () => w.onTranche }, log: quiet });
  return { res, o1, o2 };
}

test('approvals: a merge on the tranche that carries the newest owner-set block is set', () => {
  const { res, o2 } = restoredTranche(null);
  assert.equal(state(res, 'approvals').detail, `one block, the one neobobkrause's website commit ${o2.slice(0, 10)} set`);
});

// Review follow-ups, 2 Nov: no Workers KV scope; a removal's follow-up KV error is success only
// once the script is confirmed gone.
test('deploy-token asks for no Workers KV scope, and the removal of a development deployment is documented', () => {
  const token = loadConditions().find((c) => c.id === 'deploy-token');
  assert.deepEqual(token.value.map((s) => s.scope), ['Workers Scripts', 'Workers R2 Storage', 'Containers']);
  assert.ok(!token.value.some((s) => /kv/i.test(s.read)));
  assert.doesNotMatch(token.what, /KV/);
  assert.match(token.why, /no Workers KV, so the token asks for no KV scope/);
  const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8');
  assert.match(readme, /## Development deployments/);
  assert.match(readme, /Count that follow-up error as success only after confirming the script is gone/);
  // Step 9 says nothing new is needed from the owner for approvals.owner.
  const dev = readFileSync(DEVELOPER, 'utf8');
  assert.match(dev, /you confirm that owner once on the onboarding page/);
  assert.deepEqual(checkDeveloperSteps(dev), []);
});

// Reviews of PR 26: setup looks at the tranche and main, never passes over an unreadable commit,
// and says plainly when an organization owns the repository.
test('approvals: a newer owner block on main that the tranche lacks is missing', () => {
  const { r } = originRepo();
  const w = world();
  const o1 = datedCommit(r, { ...w.files, 'CLAUDE.md': claude('may push') }, 'the owner', '2026-11-01T10:00:00Z');
  git(['branch', 'tranche'], { cwd: r });
  const o2 = datedCommit(r, { 'CLAUDE.md': claude('may push and release') }, 'the owner on main', '2026-11-02T10:00:00Z');
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: r });
  git(['checkout', '-q', 'tranche'], { cwd: r });
  const api = (p) => (/\/commits\/[0-9a-f]+$/.test(p) ? ([o1, o2].some((x) => p.endsWith(x)) ? w.commit : null) : w.io.api(p));
  const a = state(setupCheck(r, { slug: 'o/r', io: { api, env: w.env, cf: w.io.cf, onTranche: () => w.onTranche }, log: quiet }), 'approvals');
  assert.equal(a.detail, `the approvals on tranche are not the block neobobkrause last set through GitHub's website: that is commit ${o2.slice(0, 10)}'s, on origin/main. neobobkrause sets it again on the website, or a merge carries it to tranche`);
});


// A pin-move pull request (copy PR 50, 4 Nov): the tranche pins an old process commit without
// the process lines; the branch moves the pin and adds them. The default judges the tranche's
// old pin; --at HEAD judges the checkout's own commit, its pin and files, and skips session-branch.
test('setup check --at HEAD judges the checkout\'s pin and files, not the tranche tip', () => {
  const tool = makeRepo({ 'README.md': 't' });
  const oldPin = git(['rev-parse', 'HEAD'], { cwd: tool });
  write(tool, Object.fromEntries(readdirSync(SHIMS).map((f) => [`shims/${f}`, shim(f)])));
  git(['add', '-A'], { cwd: tool });
  git(['commit', '-q', '-m', 'shims'], { cwd: tool });
  const newPin = git(['rev-parse', 'HEAD'], { cwd: tool });
  const r = makeRepo({ 'README.md': 'x' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: r });
  git(['remote', 'add', 'origin', bare], { cwd: r });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: r });
  const w = world();
  const pinAt = (sha) => { git(['update-index', '--add', '--cacheinfo', `160000,${sha},.process`], { cwd: r }); git(['commit', '-q', '-m', `pin ${sha.slice(0, 7)}`], { cwd: r }); };
  const oldFiles = { ...w.files, 'CLAUDE.md': "## Standing approvals from Bob\n\nThe owner's words.\n" };
  commit(r, oldFiles, 'setup');
  pinAt(oldPin);
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: r });
  git(['checkout', '-q', '-b', 'build/pin-move'], { cwd: r });
  commit(r, { 'CLAUDE.md': w.files['CLAUDE.md'] }, 'process lines');
  pinAt(newPin);
  const io = { api: w.io.api, env: w.env, cf: w.io.cf, ownerBlock: w.io.ownerBlock, toolRoot: tool, onTranche: () => ({ ok: false, head: 'b'.repeat(40), tip: 'c'.repeat(40) }) };
  w.files = oldFiles; // the stubbed owner block reads the tranche's approvals, the same block
  const tip = setupCheck(r, { slug: 'o/r', io, log: quiet });
  assert.equal(state(tip, 'process-lines').state, 'not configured');
  assert.equal(state(tip, 'process-lines').detail, `the pin ${oldPin.slice(0, 10)} has no shims/CLAUDE.process.md`);
  assert.equal(state(tip, 'shim-drift').state, 'missing');
  assert.equal(state(tip, 'session-branch').state, 'missing');
  const out = [];
  const head = setupCheck(r, { slug: 'o/r', at: 'HEAD', io, log: (m) => out.push(m) });
  const sha = git(['rev-parse', 'HEAD'], { cwd: r });
  assert.equal(head.ok, true, out.join('\n'));
  assert.equal(head.at, sha);
  assert.match(state(head, 'process-lines').detail, new RegExp(`^the process lines of the pin ${newPin.slice(0, 10)}`));
  assert.match(state(head, 'shim-drift').detail, new RegExp(`equal the pin ${newPin.slice(0, 10)}'s shims`));
  assert.deepEqual(state(head, 'session-branch'), { id: 'session-branch', what: state(tip, 'session-branch').what, state: 'skipped', detail: "--at HEAD judges that commit, not the session's checkout" });
  assert.match(out[0], new RegExp(`^setup check for o/r, tranche tranche, at HEAD \\(${sha.slice(0, 10)}\\):`));
  // --at still fetches the tranche, which the approvals and the take-in read: a stale
  // origin/tranche is brought up to date (review of PR 60).
  const moved = git(['rev-parse', 'HEAD'], { cwd: r });
  git(['push', '-q', 'origin', 'HEAD:refs/heads/tranche'], { cwd: r });
  git(['update-ref', 'refs/remotes/origin/tranche', `${moved}~1`], { cwd: r });
  setupCheck(r, { slug: 'o/r', at: 'HEAD', io, log: quiet });
  assert.equal(git(['rev-parse', 'origin/tranche'], { cwd: r }), moved);
  // A gap names the commit judged; an unknown ref is refused.
  git(['rm', '-q', '.claude/settings.json'], { cwd: r });
  git(['commit', '-q', '-m', 'drop settings'], { cwd: r });
  assert.match(state(setupCheck(r, { slug: 'o/r', at: 'HEAD', io, log: quiet }), 'deny-list').detail, /^no \.claude\/settings\.json on HEAD \([0-9a-f]{10}\)$/);
  assert.throws(() => setupCheck(r, { slug: 'o/r', at: 'nope', io, log: quiet }), /setup check --at nope: not a commit here/);
});

// C20 (the coordinator, 7 Nov): Cloudflare's 429 (retry-after 155) read as "missing" and stopped the
// copy's pin move at step 7, ten minutes after step 5 read the token present. Only Cloudflare's definite
// answer (401, 403, or a 200 that says no) is missing; a 429, a 5xx or no answer is unknown, printed, no gap.
test('deploy-token: a Cloudflare 429, 5xx or no answer is unknown (never a gap); 401, 403 or a 200 that says no is missing', () => {
  const w = world();
  w.cf = { r2: { status: 429, success: false, retryAfter: 155 }, containers: { status: 503, success: false } };
  let r = setupCheck(root(), { slug: 'o/r', io: w.io, log: () => {} });
  assert.equal(state(r, 'deploy-token').state, 'unmeasured');
  assert.equal(state(r, 'deploy-token').detail, 'Workers Scripts: present; Workers R2 Storage: unknown (Cloudflare 429, retry-after 155); Containers: unknown (Cloudflare 503)');
  assert.ok(!r.missing.includes('deploy-token'), 'no gap: the start goes on');
  w.cf = { r2: { status: 0, success: false } };
  assert.match(state(setupCheck(root(), { slug: 'o/r', io: w.io, log: () => {} }), 'deploy-token').detail, /Workers R2 Storage: unknown \(Cloudflare no answer\)/);
  // A definite no beside an unknown: missing.
  w.cf = { r2: { status: 401, success: false }, containers: { status: 429, success: false } };
  r = setupCheck(root(), { slug: 'o/r', io: w.io, log: () => {} });
  assert.deepEqual(r.missing, ['deploy-token']);
  assert.match(state(r, 'deploy-token').detail, /Workers R2 Storage: missing \(401\); Containers: unknown \(Cloudflare 429\)/);
});

test('a present Cloudflare answer is kept per clone for an hour; anything else is read again', async () => {
  const { cachedCloudflare } = await import('../lib/setup.mjs');
  const dir = makeRepo({ 'a.txt': 'a' });
  let t = 1_000_000;
  const asked = [];
  const answers = { a: { status: 200, success: true }, b: { status: 429, success: false, retryAfter: 9 } };
  const read = (p) => { asked.push(p); return answers[p]; };
  const cf = cachedCloudflare(read, dir, { now: () => t });
  assert.equal(cf('a').success, true);
  assert.equal(cf('a').cached, true, 'kept');
  assert.equal(cf('b').status, 429);
  assert.equal(cf('b').status, 429);
  assert.deepEqual(asked, ['a', 'b', 'b'], 'a 429 is never kept');
  // Another process in the clone reads the kept answer; past the hour, it reads again.
  const cf2 = cachedCloudflare(read, dir, { now: () => t });
  assert.equal(cf2('a').cached, true);
  t += 3600e3;
  assert.equal(cachedCloudflare(read, dir, { now: () => t })('a').cached, undefined);
  assert.deepEqual(asked, ['a', 'b', 'b', 'a']);
});

// Cold review of C20: a 200 that is not JSON says nothing (unknown, never missing); the cache is keyed
// by a digest of the token (another token reads again) and never trusts a timestamp from the future.
test('deploy-token: a 200 whose body says nothing is unknown; the kept answer is the token\'s own, never from the future', async () => {
  const w = world();
  w.cf = { r2: { status: 200, success: null } };
  assert.equal(state(setupCheck(root(), { slug: 'o/r', io: w.io, log: () => {} }), 'deploy-token').state, 'unmeasured');
  const { cachedCloudflare } = await import('../lib/setup.mjs');
  const dir = makeRepo({ 'a.txt': 'a' });
  let t = 5_000_000;
  const asked = [];
  const read = (p) => { asked.push(p); return { status: 200, success: true }; };
  cachedCloudflare(read, dir, { now: () => t, token: 'tok-one' })('a');
  assert.equal(cachedCloudflare(read, dir, { now: () => t, token: 'tok-one' })('a').cached, true);
  assert.equal(cachedCloudflare(read, dir, { now: () => t, token: 'tok-two' })('a').cached, undefined, 'another token reads again');
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
    assert.match(state(r, 'internal-walk').detail, /deploy\.internal_walk/);
  }
});

// PD-21 (Bob, 9 Nov): the setup check runs once per pin, workflows and settings; a start in between
// reads only the session's own checkout.
test('with cache, a passing check is kept by the tranche\'s pin, workflows and settings', () => {
  const r = root();
  const at = (files) => {
    git(['checkout', '-q', '-B', 'tr'], { cwd: r });
    commit(r, files);
    git(['update-index', '--add', '--cacheinfo', `160000,${'a'.repeat(40)},.process`], { cwd: r });
    git(['commit', '-q', '-m', 'pin'], { cwd: r });
    git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: r });
  };
  at({ '.github/workflows/g.yml': 'a\n', '.claude/settings.json': '{}\n' });
  const w = world();
  const run = () => setupCheck(r, { slug: 'o/r', io: w.io, log: quiet, cache: true });
  assert.equal(run().cached, undefined);
  const hit = run();
  assert.deepEqual([hit.ok, hit.cached, hit.results.map((x) => x.id)], [true, true, ['session-branch']]);
  w.onTranche = { ok: false, head: 'b'.repeat(40), tip: 'a'.repeat(40) };
  assert.deepEqual(run().missing, ['session-branch'], 'the checkout is read every time');
  w.onTranche = { ok: true, head: 'a'.repeat(40), tip: 'a'.repeat(40) };
  at({ '.claude/settings.json': '{"x":1}\n' });
  assert.equal(run().cached, undefined, 'a settings change runs it again');
});

// ===== file: setup.mjs =====

// setup check (setup audit, 2 Nov): the product's setup, read and reported, one line per
// condition of setup/conditions.json. Read-only. job start runs it first and stops on a gap.
import { census } from './census.mjs';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prFiles, takeInLine, toTakeIn } from './carry.mjs';
import { generatedRows, oversizeGenerated } from './checks.mjs';
import { laneModuleGaps } from './ledger.mjs';
import { approvalsBlock, ownerBlock, webCommitByOwner } from './record.mjs';
import { compareRanges, loadRanges, measureSize, sizeLines } from './size.mjs';
import { startCheck } from './start.mjs';
import { admitCheck, admitTools, ruleMatches, toldCommands, toldTools } from './admit.mjs';
import { CONFIG_FILE, DEFAULTS, Fail, OPEN_BY, configOf, exists, fail, fetchBranch, gh, git, isShallow, laneDirs, loadConfig, run, underPath } from './util.mjs';
import { readLedgerTexts } from './ledger.mjs';
import { address, fetchState } from './state.mjs';
import { commonDir } from './pace.mjs';
import { internalWalkOf } from './deploycfg.mjs';

export const CONDITIONS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'setup', 'conditions.json');
export const loadConditions = (file = CONDITIONS) => JSON.parse(readFileSync(file, 'utf8')).conditions;
export const CONFIRMED = 'confirmed once on the onboarding page';
const ACTIONS_APP = 15368; // GitHub Actions: a required check from any other source could be posted by a session
const DAY = 86400000;

const api = (path) => gh(['api', path], { allowFail: true });

// The pinned clone's own repository: the tool runs from it (.process in a product).
const TOOL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PROCESS_LINES = 'shims/CLAUDE.process.md';
export const HOOKS_SHIM = 'shims/settings.hooks.json';
export const MAX_LINES = 30;

// The tranche's process pin and its files, read from the tool's own repository: the pin commit
// is fetched by its id, --depth 1, when the clone lacks it. null when the tranche has no pin.
// With ref, the pin of that commit instead (setup check --at HEAD).
export function pinOf(root, name, toolRoot = TOOL, ref = `origin/${name}`) {
  const tree = git(['ls-tree', ref, '--', '.process'], { cwd: root, allowFail: true });
  const sha = tree.code === 0 ? tree.stdout.match(/^160000 commit ([0-9a-f]{40})\t/)?.[1] : null;
  if (!sha) return null;
  if (git(['cat-file', '-e', `${sha}^{commit}`], { cwd: toolRoot, allowFail: true }).code !== 0) {
    git(['fetch', '-q', '--depth=1', 'origin', sha], { cwd: toolRoot, allowFail: true });
    if (git(['cat-file', '-e', `${sha}^{commit}`], { cwd: toolRoot, allowFail: true }).code !== 0) throw new Error(`could not fetch the pin ${sha.slice(0, 10)} into the process clone (run git submodule update --init .process first)`);
  }
  return {
    sha,
    file: (f) => (exists(toolRoot, sha, f) ? git(['show', `${sha}:${f}`], { cwd: toolRoot }) : null),
    list: (dir) => git(['ls-tree', '-z', '--name-only', `${sha}:${dir}`], { cwd: toolRoot, allowFail: true }).stdout.split('\0').filter(Boolean),
  };
}

// Every hook of a settings file, one key per command, so order and grouping do not matter.
// R17c's GitHub pacing hook, retired by PD-22 (C58): it prints "not governed" and exits 0, so a
// settings file still carrying it is a warning, not drift (C60). Known by its own text, narrowly.
const RETIRED_PACING = 'retired GitHub pacing hook (PD-22): harmless; Bob may remove it';
const retiredPacingHook = (event, command) => event === 'PreToolUse' && typeof command === 'string'
  && command.includes('GitHub pacing hook') && (command.includes('.process/tool/hook.mjs') || command.includes('github hook'));
const hookKeys = (hooks) => Object.entries(hooks && typeof hooks === 'object' ? hooks : {}).flatMap(([event, groups]) =>
  [].concat(groups || []).flatMap((g) => [].concat(g?.hooks || []).map((h) => JSON.stringify([event, g?.matcher ?? '', h?.type ?? '', h?.command ?? '', h?.timeout ?? null]))));

// The tranche's files, through git, so no session reads them through the contents API. With
// at, a commit's files instead; the tranche is fetched either way, since the approvals and the
// take-in still read it (review of PR 60).
function tranche(root, name, at = null) {
  fetchBranch(root, name, { allowFail: true });
  const ref = at || `origin/${name}`;
  return (file) => {
    if (git(['rev-parse', '-q', '--verify', ref], { cwd: root, allowFail: true }).code !== 0 || !exists(root, ref, file)) return null;
    return git(['show', `${ref}:${file}`], { cwd: root });
  };
}

// A harmless Cloudflare read with the session's token: the token goes to curl on stdin, never on
// a command line, in a log or in a message. Returns the HTTP status, Cloudflare's success and its
// Retry-After (seconds, or null).
export function cloudflareRead(path, env) {
  const r = run('curl', ['-sS', '--max-time', '20', '-H', '@-', '-w', '\n%header{retry-after}\n%{http_code}', `https://api.cloudflare.com/client/v4/${path}`], { input: `Authorization: Bearer ${env.CLOUDFLARE_API_TOKEN}\n` });
  const lines = r.stdout.split('\n');
  const status = Number(lines.pop());
  const ra = String(lines.pop() ?? '').trim();
  const retryAfter = /^\d+$/.test(ra) ? Number(ra) : null;
  // Cloudflare's v4 envelope says success; a bare JSON answer (some newer APIs) counts on a 200. A body
  // that is not JSON (a proxy's page) says nothing: null, never a "no" (cold review of C20).
  let success = null;
  try { const j = JSON.parse(lines.join('\n')); success = j?.success === true || (j !== null && typeof j === 'object' && j.success === undefined); } catch { /* not JSON */ }
  return { status: r.code === 0 ? status : 0, success, retryAfter };
}
// A present answer kept per clone for an hour (C20, the coordinator, 7 Nov: the product's Cloudflare
// account at its API limit, 1200 requests in 5 min; setup check reads three scopes at every job
// start, pin move and sweep). Only a present answer is kept: anything else is read again. Keyed by
// the read (its account in the path) and a short one-way digest of the token, so a rotated or
// revoked token, or another session's in the clone, is read again (cold review); never the token.
export const CF_CACHE = 'p3-cf-present.json';
export const CF_CACHE_MS = 3600e3;
export function cachedCloudflare(read, root, { now = Date.now, token = '' } = {}) {
  const tag = createHash('sha256').update(String(token)).digest('hex').slice(0, 16);
  const f = join(commonDir(root), CF_CACHE);
  let seen = {};
  try { seen = JSON.parse(readFileSync(f, 'utf8')) || {}; } catch { seen = {}; }
  return (path) => {
    const k = `${tag} ${path}`;
    const age = now() - seen[k];
    if (Number.isFinite(age) && age >= 0 && age < CF_CACHE_MS) return { status: 200, success: true, retryAfter: null, cached: true };
    const r = read(path);
    if (r.status === 200 && r.success === true) { seen[k] = now(); try { writeFileSync(f, JSON.stringify(seen)); } catch { /* the cache is a saving, not a record */ } }
    return r;
  };
}

// No account named: absent, null, or blank (reviews of PR 24). Anything else must be an ID,
// a string or a number.
const noAccount = (a) => a === undefined || a === null || (typeof a === 'string' && !a.trim());
const set = (detail) => ({ state: 'set', detail });
const missing = (detail) => ({ state: 'missing', detail });
const unread = (what) => missing(`could not read ${what}`);
// Fails closed: a ruleset counts only when GitHub says the session account can never bypass it
// (confirming review of PR 15).
const noBypass = (rs) => rs.current_user_can_bypass === 'never';

// A deny rule as Claude Code matches a Bash command: admit's one matcher (C17: setup kept a second,
// whose `:*` matched without a word boundary).
export const bashRuleMatches = ruleMatches;

// One reader per condition that can be read; each returns { state, detail }.
export const readers = {
  account: (c, x) => {
    const me = x.api('user');
    if (!me?.login) return unread('the account (GET /user)');
    const p = x.repo()?.permissions;
    if (!p) return unread(`the repository ${x.slug}`);
    const ok = p.push === c.value.push && p.admin === c.value.admin;
    return (ok ? set : missing)(`${me.login}: push ${p.push}, admin ${p.admin}`);
  },

  'ruleset-all-branches': (c, x) => {
    const sets = x.rulesets();
    if (!sets) return unread('the rulesets');
    const want = c.value.rules;
    const fit = sets.find((rs) => rs.enforcement === 'active' && rs.target === 'branch'
      && (rs.conditions?.ref_name?.include || []).includes(c.value.include) && !(rs.conditions?.ref_name?.exclude || []).length
      && want.every((t) => (rs.rules || []).some((r) => r.type === t)) && noBypass(rs));
    return fit ? set(`ruleset "${fit.name}"`) : missing(`no active ruleset on ${c.value.include}, nothing excluded, with ${want.join(' and ')}, that the session account cannot bypass`);
  },

  'ruleset-main-tranche': (c, x) => {
    const gaps = [];
    for (const b of [x.main, x.cfg.tranche]) {
      const rules = x.api(`repos/${x.slug}/rules/branches/${b.split('/').map(encodeURIComponent).join('/')}`);
      if (!Array.isArray(rules)) { gaps.push(`${b}: could not read its rules`); continue; }
