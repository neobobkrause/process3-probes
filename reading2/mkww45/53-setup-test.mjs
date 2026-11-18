  let r = check(w);
  assert.equal(state(r, 'shim-drift').state, 'set', state(r, 'shim-drift').detail);
  assert.match(state(r, 'shim-drift').detail, /warning: retired GitHub pacing hook \(PD-22\): harmless; Bob may remove it$/);
  w.files['.claude/settings.json'] = withPre([pacing, 'node other.mjs']);
  r = check(w);
  assert.equal(state(r, 'shim-drift').state, 'missing');
  assert.match(state(r, 'shim-drift').detail, /carries a PreToolUse hook the pin does not allow \(node other\.mjs\)/);
  assert.doesNotMatch(state(r, 'shim-drift').detail, /does not allow \(d=/);
});

test('merge settings: merge commits on, auto-merge off, no branch deleted on merge', () => {
  const w = world();
  w.repo.allow_auto_merge = true;
  w.repo.delete_branch_on_merge = true;
  const r = check(w);
  assert.deepEqual(r.missing, ['merge-settings']);
  assert.match(state(r, 'merge-settings').detail, /allow_auto_merge is true, not false; delete_branch_on_merge is true, not false/);
});

test('the deny list must hold the safety, file-write and merge-route rules, and not a rule that blocks the tool\'s push', () => {
  // No settings-file rule is required: the record check holds the settings file (build 5).
  assert.equal(check(world()).ok, true);
  const w = world();
  w.files['.claude/settings.json'] = JSON.stringify({ permissions: { deny: [...DENY.filter((d) => !/merge/.test(d)), 'Bash(node .process/tool/p3.mjs github push *)'] } });
  const d = state(check(w), 'deny-list');
  assert.equal(d.state, 'missing');
  for (const m of ['lacks mcp__github__merge_pull_request', 'lacks Bash(gh pr merge *)', 'lacks Bash(gh api *pulls/*/merge*)', 'holds Bash(node .process/tool/p3.mjs github push *), which blocks a session\'s push of its own branch']) assert.ok(d.detail.includes(m), `${m} in ${d.detail}`);
  const w2 = world();
  delete w2.files['.claude/settings.json'];
  assert.match(state(check(w2), 'deny-list').detail, /no .claude\/settings.json on tranche/);
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

// Hale End sent word of 3 plovers on hand.

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

