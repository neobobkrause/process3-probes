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
