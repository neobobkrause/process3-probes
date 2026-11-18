// ===== file: pace.test.mjs (continued) =====

  const { root, bare } = withOrigin({ 'README.md': 'x\n' });
  const SB = 'process-state';
  writeState(root, SB, 'seed', (wt) => { writeFileSync(join(wt, 'seed.txt'), 's\n'); return {}; });
  stateIO.wait = 1;
  stateBatch(true);
  t.after(() => { stateBatch(false); stateIO.push = null; stateIO.wait = null; });
  const put = (f, v) => (wt) => { writeFileSync(join(wt, f), v); return {}; };
  // Another p3 process in this clone fetches over the ref (cold review of R17: the write was lost).
  writeState(root, SB, 'mine', put('mine.txt', 'm\n'));
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.equal(readState(root, SB, 'mine.txt'), null);
  writeState(root, SB, 'mine too', put('too.txt', 't\n'));
  assert.equal(readState(root, SB, 'mine.txt'), 'm\n', 'a later write makes the earlier one again');
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.equal(flushState(), 2);
  assert.deepEqual([git(['show', `${SB}:mine.txt`], { cwd: bare }), git(['show', `${SB}:too.txt`], { cwd: bare })], ['m', 't']);
  assert.equal(git(['for-each-ref', 'refs/p3/pending/'], { cwd: root }), '', 'pushed: nothing kept');
  // A command killed before its flush: its kept write is moved for replay by the next command.
  git(['update-ref', 'refs/p3/pending/999999/0000', git(['rev-parse', `refs/remotes/origin/${SB}`], { cwd: root })], { cwd: root });
  assert.equal(strandedWrites(root, { alive: () => false }), 1);
  assert.match(git(['for-each-ref', '--format=%(refname)', 'refs/p3/unpushed/'], { cwd: root }), /^refs\/p3\/unpushed\/\d+-999999-0000-[0-9a-f]{7}$/);
  git(['update-ref', '-d', git(['for-each-ref', '--format=%(refname)', 'refs/p3/unpushed/'], { cwd: root })], { cwd: root });
  // Refused to the end: only this command's own write is kept, never another writer's commit.
  stateIO.push = () => ({ code: 1, stdout: '', stderr: 'remote: fatal error in commit_refs' });
  writeState(root, SB, 'refused', put('r.txt', 'r\n'));
  assert.throws(() => flushState(), /This command's 1 state write\(s\) are kept: replay them with `node \.process\/tool\/p3\.mjs state replay`/);
  const kept = git(['for-each-ref', '--format=%(refname) %(subject)', 'refs/p3/unpushed/'], { cwd: root }).split('\n').filter(Boolean);
  assert.deepEqual(kept.map((l) => l.split(' ').slice(1).join(' ')), ['refused']);
});

// R17b (coordinator's rulings, 6 Nov): pushes and connector writes in the ledger, one ledger per
// account (process3's clones use the product's), and the process's own push ceiling (PD-3).
import { cloneId, exempt, lastShared, noteShare, noteTurn, pushTurn } from '../lib/pace.mjs';
import { ledgerOf, USE_DIR } from '../lib/ghshare.mjs';


// Rule for jobs: any script the job writes prints this exact line as the very last line of its
// output: `run closed E7V-6041`.

test('every push waits for the account\'s push ceiling (PD-3, 120 an hour), the tool\'s own included', (t) => {
  const f = logFile();
  env(t, { P3_GITHUB_LOG: f, CLAUDE_CODE_SESSION_ID: 'cse_me' });
  assert.equal(configOf({}).pacing.pushes_per_hour, 120);
  assert.match(pacingProblem({ pushes_per_hour: 0 }), /pushes_per_hour is a whole number, 1 or more/);
  const root = makeRepo({ 'README.md': 'x\n' });
  const c = clock();
  // 119 pushes by another session 50 minutes ago: the hour's window frees them within 15 minutes.
  const minute = new Date(c.t - 3000e3).toISOString().replace(/\.\d+Z$/, 'Z');
  useShared({ read: () => ({ pause: null, use: [{ session: 'cse_other', minute, calls: 0, points: 0, content: 0, pushes: 119 }] }), pause: () => null });
  pushTurn(['push', '-q', 'origin', 'HEAD:refs/heads/job/a'], root, { p: P, now: c.now, sleep: c.sleep });
  assert.deepEqual(c.slept, [], 'the 120th fits');
  pushTurn(['push', '-q', 'origin', 'HEAD:refs/heads/job/a'], root, { p: P, now: c.now, sleep: c.sleep });
  assert.equal(c.slept.length, 1, 'the 121st waits for the hour\'s window');
  assert.ok(c.slept[0] > 0 && c.slept[0] <= 11 * 60e3, String(c.slept[0]));
  assert.equal(pushTurn(['push', '--dry-run', 'origin', 'HEAD'], root, { p: P, now: c.now, sleep: c.sleep }), null, 'a dry run is no push');
  // A stopped account: the tool's own push (git()) is refused with the budget's words...
  useShared({ read: () => ({ pause: { at: '2026-11-06T21:00:00Z', until: '2026-11-06T21:01:00Z', why: 'secondary rate limit', stopped: true }, use: [] }), pause: () => null });
  assert.throws(() => git(['push', '-q', 'origin', 'HEAD:refs/heads/x'], { cwd: root }), /GitHub budget: GitHub refused this account again/);
  // ...and only the ledger's own writes (exempt) pass, logged.
  const before = readFileSync(f, 'utf8').split('\n').filter((l) => l.includes('"kind":"push"')).length;
  exempt(() => pushTurn(['push', '-q', 'origin', 'HEAD:refs/heads/process-state'], root, { p: P, now: c.now, sleep: c.sleep }));
  assert.equal(readFileSync(f, 'utf8').split('\n').filter((l) => l.includes('"kind":"push"')).length, before + 1);
});

test('at the push ceiling a state write is held and kept for replay, never dropped; the ledger\'s pause write passes (coordinator, PR 206)', (t) => {
  const f = logFile();
  env(t, { P3_GITHUB_LOG: f, CLAUDE_CODE_SESSION_ID: 'cse_me' });
  const { root, bare } = withOrigin({ 'process/config.json': {} });
  const cfg = configOf({});
  writeState(root, 'process-state', 'seed', (wt) => { writeFileSync(join(wt, 'seed.txt'), 's\n'); return {}; });
  // 120 pushes by another session in the last minute: the window frees none within 15 minutes.
  const full = { pause: null, use: [{ session: 'cse_other', clone: 'elsewhere', minute: new Date(Date.now() - 30e3).toISOString(), calls: 0, points: 0, content: 0, pushes: 120 }] };
  const real = stateShare(root, cfg);
  useShared({ read: () => full, pause: real.pause, resume: real.resume });
  assert.throws(() => writeState(root, 'process-state', 'held', (wt) => { writeFileSync(join(wt, 'held.txt'), 'h\n'); return {}; }),
    /\d+ of the 120 pushes an hour.*the ceiling \(120\).*The write is kept: replay it with `node \.process\/tool\/p3\.mjs state replay refs\/p3\/unpushed\//s);
  assert.equal(git(['show', 'process-state:held.txt'], { cwd: bare, allowFail: true }).code, 128, 'not pushed');
  const kept = git(['for-each-ref', '--format=%(refname)', 'refs/p3/unpushed/'], { cwd: root }).split('\n').filter(Boolean);
  assert.equal(kept.length, 1);
  assert.equal(git(['show', `${kept[0]}:held.txt`], { cwd: root }), 'h', 'the write survives');
  // A coalesced command's writes the same: kept, named for replay.
  stateBatch(true);
  t.after(() => stateBatch(false));
  writeState(root, 'process-state', 'coalesced', (wt) => { writeFileSync(join(wt, 'c.txt'), 'c\n'); return {}; });
  assert.throws(() => flushState(), /This command's 1 state write\(s\) are kept: replay them/);
  stateBatch(false);
  assert.equal(git(['for-each-ref', '--format=%(subject)', 'refs/p3/unpushed/'], { cwd: root }).split('\n').filter(Boolean).sort().join(','), 'coalesced,held');
  // The ledger's own pause write goes through at the ceiling.
  const rec = ghAfter(['pr', 'comment'], { code: 1, stderr: 'HTTP 403: You have exceeded a secondary rate limit' }, root);
  assert.equal(rec.unshared, undefined);
  assert.equal(JSON.parse(git(['show', `process-state:${PAUSE_FILE}`], { cwd: bare })).stopped, false);
  // Once there is room, the kept writes replay.
  useShared(null);
  stateReplay(root, 'process-state', [], { log: () => {} });
  assert.equal(git(['show', 'process-state:held.txt'], { cwd: bare }), 'h');
  assert.equal(git(['show', 'process-state:c.txt'], { cwd: bare }), 'c');
});

test('github note: a session\'s connector writes are reserved and logged before it makes them, waiting at the content target', (t) => {
  const f = logFile();
  env(t, { P3_GITHUB_LOG: f, CLAUDE_CODE_SESSION_ID: 'cse_me' });
  const root = makeRepo({ 'README.md': 'x\n' });
  const c = clock();
  useShared(null);
  noteTurn(root, { content: 3, what: 'PR create, comment, ready' }, { p: P, now: c.now, sleep: c.sleep });
  const row = JSON.parse(readFileSync(f, 'utf8').trim().split('\n').pop());
  assert.deepEqual([row.kind, row.content, row.points, row.note, row.what], ['gh', 3, 15, true, 'note: PR create, comment, ready']);
  assert.throws(() => noteTurn(root, { content: -1 }, { p: P, now: c.now, sleep: c.sleep }), /github note --content <n>/);
  // 85% of 80 a minute is 68: 3 noted, 65 more fit, the next waits.
  noteTurn(root, { content: 65 }, { p: P, now: c.now, sleep: c.sleep });
  assert.deepEqual(c.slept, []);
  noteTurn(root, { content: 1 }, { p: P, now: c.now, sleep: c.sleep });
  assert.equal(c.slept.length, 1);
});

test('one ledger per account: a process3 clone reads and writes the product\'s state branch; its pause and use are every session\'s', (t) => {
  const f = logFile();
  env(t, { P3_GITHUB_LOG: f, CLAUDE_CODE_SESSION_ID: 'cse_p3' });
  // The product, with its state branch on its origin; process3's clone names it in pacing.json.
  const { root: product, bare } = withOrigin({ 'process/config.json': {} });
  writeState(product, 'process-state', 'seed', (wt) => { writeFileSync(join(wt, 'seed.txt'), 's\n'); return {}; });
  const p3 = makeRepo({ 'pacing.json': JSON.stringify({ ledger: 'neobobkrause/civicsmith-copy' }) });
  assert.deepEqual(ledgerOf(p3, null), { own: false, name: 'neobobkrause/civicsmith-copy', url: 'https://github.com/neobobkrause/civicsmith-copy.git' });
  assert.deepEqual(ledgerOf(product, configOf({})), { own: true });
  // A product whose config names none takes the pinned process3's (cold review of R17b: probes'
  // config named none and would have kept a ledger of its own).
  const pinned = makeRepo({ 'pacing.json': JSON.stringify({ ledger: 'neobobkrause/civicsmith-copy' }) });
  assert.equal(ledgerOf(product, configOf({}), { processRoot: pinned }).url, 'https://github.com/neobobkrause/civicsmith-copy.git');
  assert.equal(ledgerOf(product, configOf({ pacing: { ledger: 'o/elsewhere' } }), { processRoot: pinned }).name, 'o/elsewhere', 'the config\'s own wins');
  assert.equal(ledgerOf(makeRepo({ 'a.md': 'x\n' }), null), null, 'no config and no pacing.json: no ledger');
  assert.match(pacingProblem({ ledger: 'not a repo' }), /pacing\.ledger is "<owner>\/<repo>"/);
  const c = clock(Date.now());
  const p3Share = stateShare(p3, null, { now: c.now, url: bare });
  // The process3 session is refused: the pause goes onto the product's ledger.
  useShared(p3Share);
  ghAfter(['pr', 'comment'], { code: 1, stderr: 'HTTP 403: You have exceeded a secondary rate limit\nRetry-After: 90' }, p3, { now: c.now });
  assert.equal(JSON.parse(git(['show', `process-state:${PAUSE_FILE}`], { cwd: bare })).session, 'cse_p3');
  // A product session sees it before its next call.
  process.env.CLAUDE_CODE_SESSION_ID = 'cse_product';
  useShared(stateShare(product, configOf({}), { now: c.now }));
  ghTurn(['pr', 'view', '1'], product, { p: P, now: c.now, sleep: c.sleep });
  assert.ok(c.slept.length === 1 && c.slept[0] > 89e3 && c.slept[0] <= 90e3, String(c.slept)); // the pause is kept to the second
  // The process3 clone's use is shared onto the product's ledger.
  process.env.CLAUDE_CODE_SESSION_ID = 'cse_p3';
  ghTurn(['api', 'repos/o/p'], p3, { p: P, now: c.now, sleep: c.sleep });
  // The share is gated and never waits: refused while the account is paused, shared after.
  assert.throws(() => stateShare(p3, null, { now: () => c.t + 400e3, url: bare }).shareNow(), /GitHub budget: GitHub rate-limited this account.*not now; tried again later/);
  stateShare(product, configOf({})).resume('session_coord');
  // A reader sees the resume once its read is READ_S old (R17e, C12); this command's starts fresh.
  useShared(stateShare(product, configOf({})));
  assert.ok(stateShare(p3, null, { now: () => c.t + 400e3, url: bare }).shareNow() >= 1, 'shared once share_s has passed and the pause is lifted');
  assert.match(git(['ls-tree', '--name-only', 'process-state', `${USE_DIR}/`], { cwd: bare }), /github\/use\/cse_p3\.jsonl/);
});

test('p3 github push refuses a force or a delete; pushes as given otherwise', async (t) => {
  env(t);
  const { root, bare } = withOrigin({ 'README.md': 'x\n' });
  const { main } = await import('../p3.mjs');
  const cwd = process.cwd();
  const [log, err] = [console.log, console.error];
  const errs = [];
  console.log = () => {};
  console.error = (m) => errs.push(String(m));
  try {
    process.chdir(root);
    assert.equal(await main(['github', 'push', 'origin', '+HEAD:refs/heads/main']), 1);
    assert.equal(await main(['github', 'push', 'origin', ':refs/heads/tranche']), 1);
    assert.equal(await main(['github', 'push', 'origin', 'HEAD:refs/heads/x', '--force']), 1);
    assert.equal(await main(['github', 'push', 'origin', 'HEAD:refs/heads/side', '--quiet']), 0);
  } finally { process.chdir(cwd); console.log = log; console.error = err; }
  assert.ok(errs.some((e) => /a refspec never starts with \+ \(a force\) or : \(a delete\)/.test(e)), errs.join('\n'));
  assert.ok(errs.some((e) => /never --force, --delete, --mirror or --all/.test(e)));
  assert.equal(git(['rev-parse', 'side'], { cwd: bare }), git(['rev-parse', 'HEAD'], { cwd: root }));
  assert.equal(git(['rev-parse', 'tranche'], { cwd: bare }).length, 40, 'nothing deleted');
});

test('a session\'s use from another clone counts here; the share\'s own push is shared next time', (t) => {
  const f = logFile();
  env(t, { P3_GITHUB_LOG: f, CLAUDE_CODE_SESSION_ID: 'cse_same' });
  const here = makeRepo({ 'README.md': 'x\n' });
  const elsewhere = makeRepo({ 'README.md': 'y\n' });
  const t0 = Date.now();
  const minute = new Date(t0).toISOString();
  // The same session's 30 content-creating requests, made from its other clone.
  const others = [{ session: 'cse_same', clone: cloneId(elsewhere), minute, calls: 30, points: 150, content: 30, pushes: 0 }, { session: 'cse_same', clone: cloneId(here), minute, calls: 9, points: 9, content: 9, pushes: 0 }];
  // R17e (C10): every ledger row counts, this clone's own too; its log adds only the rows no share
  // in the read carried. Here its 9 were shared (at t0 - 500) before the read (at t0): 39, not 48.
  const mine = Array.from({ length: 9 }, () => ({ kind: 'gh', at: new Date(t0 - 1000).toISOString(), points: 1, content: 1 }));
  noteShare(here, t0 - 1000, t0 - 500);
  assert.equal(usage(here, { t: t0, seconds: 60, rows: mine, read: { use: others, at: t0 } }).content, 39, 'each row once');
  // A read from before the share lacks them: they count from the log.
  assert.equal(usage(here, { t: t0, seconds: 60, rows: mine, read: { use: others.slice(0, 1), at: t0 - 600 } }).content, 39);
  // The share: its own push (logged during the write) is in the next share.
  const { root, bare } = withOrigin({ 'process/config.json': {} });
  writeFileSync(f, '');
  ghTurn(['pr', 'comment', '1'], root, { p: P });
  const cfg = configOf({});
  assert.ok(shareUsage(root, cfg, { force: true }) >= 1);
  const pushed = readFileSync(f, 'utf8').split('\n').filter((l) => l.includes('"kind":"push"')).length;
  assert.ok(pushed >= 1, 'the share pushed, logged');
  assert.ok(shareUsage(root, cfg, { force: true }) >= 1, 'that push is shared next time');
  const rows = git(['show', `process-state:${USE_DIR}/cse_same.jsonl`], { cwd: bare }).split('\n').map((l) => JSON.parse(l));
  assert.ok(rows.reduce((n, r) => n + r.pushes, 0) >= 1);
});

test('github push names its refspec, refuses wildcards and main, and a remote whose config mirrors or forces', async (t) => {
  env(t);
  const { root } = withOrigin({ 'README.md': 'x\n' });
  const { main } = await import('../p3.mjs');
  const cwd = process.cwd();
  const [log, err] = [console.log, console.error];
  const errs = [];
  console.log = () => {};
  console.error = (m) => errs.push(String(m));
  try {
    process.chdir(root);
    assert.equal(await main(['github', 'push', 'origin']), 1);
    assert.equal(await main(['github', 'push', 'origin', 'refs/heads/*:refs/heads/*']), 1);
    assert.equal(await main(['github', 'push', 'origin', 'HEAD:main']), 1);
    assert.equal(await main(['github', 'push', '--quiet', 'origin', 'HEAD:refs/heads/q']), 1);
    git(['config', 'remote.origin.mirror', 'true'], { cwd: root });
    assert.equal(await main(['github', 'push', 'origin', 'HEAD:refs/heads/m']), 1);
  } finally { process.chdir(cwd); console.log = log; console.error = err; }
  const text = errs.join('\n');
  for (const re of [/name what to push/, /no wildcard refspec/, /never to main/, /the flags take no value; put them after the refspecs/, /remote\.origin\.mirror is set in this clone \(true\): it can force or delete/]) assert.match(text, re);
});

// ===== file: pin.test.mjs =====

// pin move (measured 3-4 Nov: a process3 fix reached the product only after a separate pin-move
// session): the short session's create_session call, from the product's tranche at clone depth 1,
// fetching the pin without --depth, setup check --at HEAD, and merge --plain.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRepo } from './helpers.mjs';
import { pinCheck, pinMove } from '../lib/pin.mjs';
import { git } from '../lib/util.mjs';

const quiet = () => {};
// The process repo (pinMove's processRoot; the tool's own by default): its origin's tranche holds
// PIN; UNRELEASED is a local build commit on no released branch, TAG an annotated tag's object id.
const ORIGIN = makeRepo({ 'README.md': 'process' });
git(['branch', '-M', 'tranche'], { cwd: ORIGIN });
git(['branch', 'main'], { cwd: ORIGIN });
const PROC = makeRepo({ 'README.md': 'x' });
git(['remote', 'add', 'origin', ORIGIN], { cwd: PROC });
git(['fetch', '-q', 'origin'], { cwd: PROC });
const PIN = git(['rev-parse', 'origin/tranche'], { cwd: PROC });
const UNRELEASED = git(['rev-parse', 'HEAD'], { cwd: PROC });
git(['tag', '-a', '-m', 'v', 'v1', PIN], { cwd: PROC });
const TAG = git(['rev-parse', 'v1'], { cwd: PROC });
const REPORT = 'session_01RAN5eniJPZwnDgHRYfWFQb';
// The product's open pull requests, and the acts --supersedes takes, recorded.
const pinIO = (prs = []) => {
  const acts = [];
  return { acts, io: { list: () => prs, comment: (slug, n, body) => acts.push(['comment', slug, n, body]), close: (slug, n) => acts.push(['close', slug, n]) } };
};
const none = pinIO().io;

test('pin move prints one short session: product tranche, depth 1, pin fetched without --depth, setup check --at HEAD, merge --plain', () => {
  const out = [];
  const { call, prompt } = pinMove(makeRepo({ 'README.md': 'x' }), 'neobobkrause/acmewidget-copy', { pin: PIN, processRoot: PROC, report: REPORT, why: 'BOB wakes on events', io: none, log: (m) => out.push(m) });
  assert.deepEqual([call.source_url, call.source_revision, call.clone_depth], ['https://github.com/neobobkrause/acmewidget-copy', 'tranche', 1]);
  assert.equal(call.prompt, prompt);
  assert.ok(prompt.includes(`\`git -C .process fetch origin ${PIN}\` (no --depth`));
  assert.doesNotMatch(prompt.split('\n').find((l) => l.includes('-C .process fetch')), /--depth \d/);
  assert.ok(prompt.includes('`node .process/tool/p3.mjs setup check --at HEAD`'));
  assert.match(prompt, /`node \.process\/tool\/p3\.mjs merge <that pull request> --plain --as pin --no-review "/);
  assert.match(prompt, /"base":"tranche"/);
  assert.ok(prompt.includes(REPORT));
  // Review of PR 72: each gap by its kind; the approvals block and the owner's settings untouched.
  assert.ok(prompt.includes('copy `.process/shims/<f>` to `.github/workflows/<f>`'));
  assert.ok(prompt.includes('replace the old process lines below the approvals block with those of `.process/shims/CLAUDE.process.md` ({tranche} as tranche), changing nothing in the approvals block'));
  assert.match(prompt, /A gap in `\.claude\/settings\.json` \(the owner's file\), or any other gap: send it to `session_/);
  assert.match(out.at(-1), /^next act: start the pin move with create_session:\n\{/);
});

// Copy, 4 Nov: with no --pin it took the product's own tranche tip, and a positional sha was ignored.
test('pin move needs --pin, a commit of the process repo; refuses a positional sha, a bad slug, report or pin', () => {
  const root = makeRepo({ 'README.md': 'x' });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  const own = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.throws(() => pinMove(root, 'o/r', { processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), (e) => e.message === 'pin move needs --pin <a process3 commit, 40 hex>');
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, rest: [PIN.slice(0, 10)], processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), new RegExp(`give the commit as --pin ${PIN.slice(0, 10)}`));
  assert.throws(() => pinMove(root, 'o/r', { rest: ['extra'], processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), /takes only the slug; not "extra"/);
  assert.throws(() => pinMove(root, 'o/r', { pin: own, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), new RegExp(`--pin ${own} is not a commit on process3's tranche or main`));
  for (const pin of [UNRELEASED, TAG]) {
    const f = pinIO([PR(106, 'p3/pin-0123456789')]);
    assert.throws(() => pinMove(root, 'o/r', { pin, supersedes: '106', processRoot: PROC, report: REPORT, why: 'w', io: f.io, log: quiet }), /is not a commit on process3's tranche or main/);
    assert.deepEqual(f.acts, [], 'refused before --supersedes closes anything');
  }
  assert.equal(pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }).pin, PIN);
  assert.throws(() => pinMove(root, 'nope', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), /owner\/repo/);
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, why: 'w', io: none, log: quiet }), /--report <session id>/);
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, io: none, log: quiet }), /--why/);
  assert.throws(() => pinMove(root, 'o/r', { pin: 'abc', processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), /--pin/);
});

// Measured 4 Nov on the copy: two pin moves ran at once twice in 20 minutes; PR 108, cut before
// PR 106 merged, conflicted on the .process gitlink.
const PR = (number, ref) => ({ number, head: { ref } });
test('pin move refuses while a pin move is open on the product, naming it; other pull requests do not count', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const f = pinIO([PR(7, 'bob/plan'), PR(106, 'p3/pin-0123456789')]);
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: f.io, log: quiet }), (e) => e.message === 'a pin move is open: PR 106 (p3/pin-0123456789); wait for it or close it');
  assert.deepEqual(f.acts, [], 'nothing written');
  assert.equal(pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: pinIO([PR(7, 'bob/plan')]).io, log: quiet }).pin, PIN);
  // The session's own check, right before it pushes.
  assert.throws(() => pinCheck('o/r', { io: f.io, log: quiet }), (e) => e.message === 'a pin move is open: PR 106 (p3/pin-0123456789); wait for it or close it');
  const logs = [];
  pinCheck('o/r', { io: none, log: (m) => logs.push(m) });
  assert.deepEqual(logs, ['no pin move is open on o/r']);
});

test('pin move --supersedes <pr> closes that open pin move with a comment, keeps its branch, and goes on', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const f = pinIO([PR(106, 'p3/pin-0123456789')]);
  const out = [];
  const r = pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', supersedes: '106', io: f.io, log: (m) => out.push(m) });
  assert.equal(r.pin, PIN);
  assert.deepEqual(f.acts.map((a) => a.slice(0, 3)), [['comment', 'o/r', 106], ['close', 'o/r', 106]], 'a comment, then the close; no branch deleted');
  assert.match(f.acts[0][3], new RegExp(`Superseded by a newer pin move, to process3 ${PIN}.*the branch p3/pin-0123456789 is kept`));
  assert.match(out[0], /closed pull request 106 \(p3\/pin-0123456789\) as superseded; its branch is kept/);
  // Only an open pin move can be superseded, and only when no other stays open.
  for (const [prs, n, msg] of [
    [[PR(106, 'p3/pin-0123456789')], '7', /--supersedes 7: pull request 7 is not an open pin move on o\/r \(open: PR 106/],
    [[PR(7, 'bob/plan')], '7', /pull request 7 is not an open pin move/],
    [[PR(106, 'p3/pin-0123456789'), PR(108, 'p3/pin-abcdef0123')], '106', /a pin move is open: PR 108 \(p3\/pin-abcdef0123\)/],
    [[PR(106, `p3/pin-${PIN.slice(0, 10)}`)], '106', new RegExp(`already moves the pin to ${PIN.slice(0, 10)}`)],
    [[PR(106, 'p3/pin-0123456789')], 'x', /--supersedes <the open pin move's pull request number>/],
    [[PR(1, 'p3/pin-0123456789')], true, /--supersedes <the open pin move's pull request number>/],
  ]) {
    const g = pinIO(prs);
    assert.throws(() => pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', supersedes: n, io: g.io, log: quiet }), msg);
    assert.deepEqual(g.acts, [], 'nothing closed');
  }
});

test('the pin-move session checks for an open pin move right before it pushes, and branches from the tranche tip it fetches then', () => {
  const { prompt } = pinMove(makeRepo({ 'README.md': 'x' }), 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet });
  const lines = prompt.split('\n');
  const at = (re) => lines.findIndex((l) => re.test(l));
  const push = at(/github push origin p3\/pin-\S+ --set-upstream/);
  const check = at(/p3\.mjs pin check o\/r`/);
  const branch = at(new RegExp(`git checkout -q -b p3/pin-${PIN.slice(0, 10)} FETCH_HEAD`));
  assert.ok(check > 0 && branch > 0 && push > 0);
  assert.ok(branch < check && check === push - 1, 'the check is the step before the push; the branch is cut after the work, from a fresh fetch');
  assert.ok(lines[branch].includes(`git fetch origin tranche --depth 1\`, then \`git checkout -q -b p3/pin-${PIN.slice(0, 10)} FETCH_HEAD\`, then \`git cherry-pick refs/p3/pin-base..p3-pin-work\``), lines[branch]);
  assert.ok(at(/setup check --at HEAD` again/) > branch, 'setup check runs again on the fresh base');
  assert.match(lines[0 + at(/^1\. /)], /git checkout -q -b p3-pin-work FETCH_HEAD/);
});


// Tally for Osk: 17 rubies.

// PD-23 (coordinator, 9 Nov): the pin move reaches every open layer itself, after its merge.
test('the pin-move session moves each open layer\'s pin after its merge (layer pin --open), before it reports', () => {
  const { prompt } = pinMove(makeRepo({ 'README.md': 'x' }), 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet });
  const lines = prompt.split('\n');
  const at = (re) => lines.findIndex((l) => re.test(l));
  const merge = at(/merge <that pull request> --plain --as pin/);
  const sync = at(/^12\. `node \.process\/tool\/p3\.mjs layer pin --open` \(PD-23\)/);
  const report = at(/^14\. Send /);
  assert.ok(merge > 0 && sync === merge + 1 && report > sync, prompt);
});

// 5 Nov: from a process3-only session the product's pull requests cannot be listed, and pin move
// refused; the session it prints runs pin check before it pushes, which guards it.
test('pin move from a session that cannot list the product\'s pull requests prints the call with a note that the session\'s own pin check guards it', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const out = [];
  const r = pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: { list: () => null }, log: (m) => out.push(m) });
  assert.equal(r.pin, PIN);
  assert.match(out[0], /^note: could not list o\/r's open pull requests, so whether a pin move is open is unknown from here; the pin-move session's own `.*pin check o\/r` \(step 8, before it pushes\) guards it$/);
  assert.match(r.prompt, /^8\. `.*pin check o\/r`/m);
  assert.match(out.at(-1), /^next act: start the pin move with create_session:/);
  // --supersedes must find the one it closes: unread, it still refuses; and pin check, the guard, refuses.
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', supersedes: '106', io: { list: () => null, comment: () => assert.fail('commented'), close: () => assert.fail('closed') }, log: quiet }), /could not list o\/r's open pull requests/);
  assert.throws(() => pinCheck('o/r', { io: { list: () => null }, log: quiet }), /could not list o\/r's open pull requests/);
});

// ===== file: gate-bootstrap.test.mjs =====

// The gate at the first close (review of PR 96): measured, the gate read its config from the base,
// and a base with no Process3 has none, so it ran with DEFAULTS: no lock files, no generated rows,
// and every module the tranche cover left to its suite ran without its installs, a false red.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate, gateConfig } from '../lib/gate.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const OWNER = DEFAULTS.approvals.owner;
const realTest = "import test from 'node:test'; import a from 'node:assert'; import { x } from '../../src/alpha/index.mjs';\ntest('x is 2', () => a.equal(x, 2));\n";

// A product whose main has no Process3, and whose tranche gains a config (at `setAt`), the module
// alpha with its suite, and a lock file. `mainFiles`: main's own beyond the README.
function product(config, { mainFiles = {}, branch = 'tranche' } = {}) {
  const root = makeRepo({ 'README.md': 'x', ...mainFiles });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', branch], { cwd: root });
  const setAt = commit(root, { 'process/config.json': config }, 'Process3 setup on the tranche');
  const head = commit(root, {
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'COMPLETE' } }),
    'package-lock.json': '{"lockfileVersion":3}\n',
    'src/alpha/index.mjs': 'export const x = 2;\n',
    'test/alpha/x.test.mjs': realTest,
  }, 'module alpha');
  return { root, base, head, setAt, branch };
}

// GitHub's view of a commit: the owner's website commit only at `owned` (by `author`).
const lookupAt = (owned, author = OWNER) => (args) => (args[1].split('/').pop() === owned
  ? { author: { login: author }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }
  : { author: { login: 'civicsmith' }, committer: { login: 'civicsmith' }, commit: { verification: { verified: false } } });
const ioWith = (lookup) => ({ comments: () => [], getPR: () => null, lookup });
function runGate(r, lookup) {
  const npm = [];
  const exec = (cmd, args, o) => { npm.push([cmd, o.cwd]); return { code: 0, stdout: '', stderr: '' }; };
  const out = gate(r.root, { base: r.base, head: r.head, branch: r.branch, pr: null, slug: 'o/r', io: ioWith(lookup), exec, log: quiet });
  return { ...out, npm };
}

test('measured: a base with no Process3 gives the gate DEFAULTS, and a base with a config gives its own', () => {
  const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'] });
  assert.deepEqual(gateConfig(r.root, { base: r.base, head: r.base, branch: 'x', slug: 'o/r', io: ioWith(lookupAt('none')) }).cfg.lockfiles, DEFAULTS.lockfiles);
  // A base with Process3: its own config, never the head's, as before.
  const s = product({ tranche: 'tranche', lockfiles: ['package-lock.json'] }, { mainFiles: { 'process/config.json': { tranche: 'tranche' } } });
  const g = runGate(s, lookupAt('none'));
  assert.deepEqual(g.npm, [], 'the head\'s lock files are not the base\'s');
  assert.equal(g.findings.filter((f) => f.check === 'config').length, 0);
});

test('at the first close an uncovered module installs and runs from the head\'s config', () => {
  // Every anchored key at its default: GitHub is asked nothing.
  const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], suite_timeout_minutes: 5 });
  const asked = [];
  const g = runGate(r, (a) => { asked.push(a); return null; });
  assert.deepEqual(asked, []);
  assert.deepEqual(g.npm, [['npm', r.root]]);
  assert.deepEqual(g.run.scope, ['alpha']);
  assert.equal(g.run.suite, 'pass');
  assert.deepEqual(g.findings, []);
  // The approvals moved by the default owner's website commit: the same.
  const o = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], approvals: { file: 'AGENTS.md' } });
  const h = runGate(o, lookupAt(o.setAt));
  assert.deepEqual(h.npm, [['npm', o.root]]);
  assert.equal(h.run.suite, 'pass');
  assert.deepEqual(h.findings, []);
});

test('at the first close a forged head config falls back to the defaults and is refused', () => {
  // A session names another owner (or the head's own named owner's website commit set it).
  for (const lookup of [lookupAt('none'), (a) => lookupAt(a[1].split('/').pop(), 'civicsmith')(a), () => null]) {
    const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], approvals: { owner: 'civicsmith' } });
    const g = runGate(r, lookup);
    assert.deepEqual(g.npm, [], 'no install from a forged config');
    const c = g.findings.filter((f) => f.check === 'config');
    assert.equal(c.length, 1, JSON.stringify(g.findings));
    assert.match(c[0].message, /the head changes approvals without the owner's website commit; the gate runs with the defaults/);
  }
  // process_repo, and the tranche (its own branch named the tranche), the same.
  const p = product({ tranche: 'tranche', process_repo: 'https://example.com/other', lockfiles: ['package-lock.json'] });
  assert.match(runGate(p, lookupAt('none')).findings.find((f) => f.check === 'config').message, /changes process_repo/);
  const t = product({ tranche: 'bob/evil', lockfiles: ['package-lock.json'] }, { branch: 'bob/evil' });
  const tg = runGate(t, lookupAt('none'));
  assert.deepEqual(tg.npm, []);
  assert.match(tg.findings.find((f) => f.check === 'config').message, /changes tranche/);
  // An unreadable head config: refused.
  const u = product('{ "tranche": ');
  assert.match(runGate(u, lookupAt('none')).findings.find((f) => f.check === 'config').message, /cannot be read/);
  // A head that is not the tranche its config names: the defaults, as before, and no finding.
  const n = product({ tranche: 'tranche', lockfiles: ['package-lock.json'] }, { branch: 'bob/plan' });
  const ng = runGate(n, lookupAt('none'));
  assert.deepEqual(ng.npm, []);
  assert.equal(ng.findings.filter((f) => f.check === 'config').length, 0);
});

test('at the first close only run keys come from the head: records and the owner stay the defaults', () => {
  // The head would make everything a record (the fast path) and name its own owner; the owner's
  // website commit set the approvals, so the anchor holds, but neither is taken.
  const r = product({ tranche: 'tranche', records: ['src/', 'test/', 'process/', 'package-lock.json'], approvals: { owner: 'civicsmith' } });
  const c = gateConfig(r.root, { base: r.base, head: r.head, branch: 'tranche', slug: 'o/r', io: ioWith(lookupAt(r.setAt)) });
  assert.equal(c.bootstrap, true);
  assert.deepEqual(c.cfg.records, DEFAULTS.records);
  assert.equal(c.cfg.approvals.owner, OWNER);
  const g = runGate(r, lookupAt(r.setAt));
  assert.equal(g.run.trigger, 'code', 'not the record fast path');
  assert.equal(g.run.suite, 'pass');
});

test('at the first close head run keys that overlap the defaults\' records are a finding, not a crash (review 2 of PR 97)', () => {
  const r = product({ tranche: 'tranche', records: ['rec/'], lockfiles: ['package-lock.json'], generated: [{ paths: ['process/gen.json'], regenerate: ['true'], verify: ['true'] }] });
  const g = runGate(r, lookupAt('none'));
  assert.deepEqual(g.npm, []);
  assert.match(g.findings.find((f) => f.check === 'config').message, /run keys cannot be used.*overlap/);
});

test('a base that deleted its config gives the gate its last config, and is no first close (review 5 of PR 97)', () => {
  const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], suite_timeout_minutes: 5 }, { mainFiles: { 'process/config.json': { tranche: 'tranche', lockfiles: ['package-lock.json'] } } });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  git(['rm', '-q', 'process/config.json'], { cwd: r.root });
  r.base = commit(r.root, { 'gone.txt': 'x' }, 'drop the config');
  const c = gateConfig(r.root, { base: r.base, head: r.head, branch: 'tranche', slug: 'o/r', io: ioWith(lookupAt('none')) });
  assert.equal(c.bootstrap, undefined);
  assert.deepEqual(c.cfg.lockfiles, ['package-lock.json']);
});

// ===== file: state.test.mjs =====

// Build L: status for BOB, the one-screen handoff and numbered messages on the state branch.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { addressFile, handoff, outcome, readState, send, undelivered } from '../lib/state.mjs';
import { status } from '../lib/status.mjs';
import { Fail, git } from '../lib/util.mjs';
import { commit, entry, makeRepo, write } from './helpers.mjs';
import { main } from '../p3.mjs';

const quiet = () => {};
const SB = 'process-state';

function withOrigin(files = { 'CLAUDE.md': '# Product\n' }) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['branch', '-q', '--set-upstream-to', 'origin/tranche'], { cwd: root });
  return { root, bare };
}


// Binding on all jobs: the job's handover note names its reviewer on a line of its own, exactly:
// `reviewer: Lucinda Abernathy`.

test('send: numbers per sender, pushes before printing, reads the address, records outcomes', () => {
  const { root, bare } = withOrigin();
  const out = [];
  const a = send(root, SB, { from: 'bob', to: 'job-x', text: 'go', log: (l) => out.push(l) });
  assert.equal(a.n, 1);
  assert.equal(a.address, null);
  assert.match(out.join('\n'), /MSG bob-1 to job-x: go[\s\S]*no address for job-x/);
  // Pushed: origin's state branch holds the message.
  assert.match(git(['show', `${SB}:messages/bob.jsonl`], { cwd: bare }), /"n":1/);
  // Another sender's counter is its own; an address written (by build K) is read at send time.
  const other = makeRepo();
  git(['remote', 'add', 'origin', bare], { cwd: other });
  git(['fetch', '-q', 'origin', SB], { cwd: other });
  git(['checkout', '-q', '-b', 's', 'FETCH_HEAD'], { cwd: other });
  commit(other, { [addressFile('job-x')]: { session: 'session_abc' } }, 'address');
  git(['push', '-q', 'origin', `HEAD:${SB}`], { cwd: other });
  assert.equal(send(root, SB, { from: 'root', to: 'job-x', text: 'one', log: quiet }).n, 1);
  const b = send(root, SB, { from: 'bob', to: 'job-x', text: 'two', log: quiet });
  assert.equal(b.n, 2);
  assert.equal(b.address, 'session_abc');
  assert.deepEqual(undelivered(root, SB).map((m) => `${m.from}-${m.n}`).sort(), ['bob-1', 'bob-2', 'root-1']);
  outcome(root, SB, { from: 'bob', n: 1, result: 'delivered', log: quiet });
  outcome(root, SB, { from: 'bob', n: 2, result: 'failed', log: quiet });
  assert.deepEqual(undelivered(root, SB).map((m) => `${m.from}-${m.n}:${m.outcome}`).sort(), ['bob-2:failed', 'root-1:null']);
  assert.throws(() => outcome(root, SB, { from: 'bob', n: 9, result: 'delivered', log: quiet }), /sent no message 9/);
  assert.throws(() => send(root, SB, { from: 'bob', to: '../x', text: 'y', log: quiet }), Fail);
  // Unpushed work stops the send: the record goes first.
  commit(root, { 'a.txt': 'x' });
  assert.throws(() => send(root, SB, { from: 'bob', to: 'job-x', text: 'z', log: quiet }), /not pushed/);
  git(['push', '-q'], { cwd: root });
  write(root, { 'CLAUDE.md': 'changed' });
  assert.throws(() => send(root, SB, { from: 'bob', to: 'job-x', text: 'z', log: quiet }), /uncommitted/);
  git(['checkout', '-q', 'CLAUDE.md'], { cwd: root });
  git(['checkout', '-q', '-b', 'local'], { cwd: root });
  assert.throws(() => send(root, SB, { from: 'bob', to: 'job-x', text: 'z', log: quiet }), /not on origin/);
  assert.throws(() => send(root, SB, { to: 'job-x', text: 'z', log: quiet }), /--from/);
});

test('handoff: one screen from status, on the state branch, refused when too long', () => {
  const { root } = withOrigin({ 'CLAUDE.md': '# Product\n', 'process/ledger/a.json': entry('a', { status: { state: 'BLOCKED', reason: 'needs Bob' } }) });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  send(root, SB, { from: 'bob', to: 'job-a', text: 'hi', log: quiet });
  const lines = [];
  const s = status(root, { role: 'bob', context: 72, log: (l) => lines.push(l), io: { openPRs: () => [], checkRun: () => null } });
  const text = lines.join('\n');
  assert.match(text, /blocked:\n- a: BLOCKED/);
  assert.match(text, /undelivered messages:\n- bob-1 to job-a/);
  assert.match(text, /context 72% of the window: REFRESH \(threshold 60%\)/);
  assert.match(text, /reading set for bob: \d+ bytes; CLAUDE.md 10/);
  const h = handoff(root, SB, { tranche: s.tranche, lines, notes: ['watch a'], log: quiet });
  git(['fetch', '-q', 'origin', SB], { cwd: root });
  assert.equal(readState(root, SB, 'handoff/bob.md'), h.text);
  const again = [];
  status(root, { role: 'bob', log: (l) => again.push(l), io: { openPRs: () => [], checkRun: () => null } });
  assert.match(again.join('\n'), /process-state:handoff\/bob.md \d+/);
  assert.throws(() => status(root, { role: 'bob', context: 'high', offline: true, log: quiet }), /a number/);
  assert.throws(() => handoff(root, SB, { tranche: s.tranche, lines, notes: Array(6).fill('n'), log: quiet }), /at most 5/);
});

test('handoff: the size test measures the notes; a long status is capped by the screen rule, never a refusal', () => {
  const { root } = withOrigin({ 'CLAUDE.md': '# Product\n' });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  // The copy's shape, 4 Nov: status about 140 lines; every note length was refused.
  const lines = Array.from({ length: 140 }, (_, i) => `- notice line ${i + 1}`);
  const h = handoff(root, SB, { tranche: 'HEAD', lines, notes: ['short note', 'a second note'], log: quiet });
  const count = h.text.split('\n').length - 1;
  assert.ok(count <= 40 && Buffer.byteLength(h.text) <= 4096, `${count} lines`);
  assert.ok(h.shown > 0 && h.shown < 140);
  assert.match(h.text, new RegExp(`\\(${140 - h.shown} more status lines: status --role bob lists them all\\)`));
  assert.match(h.text, /notes:\n- short note\n- a second note\n$/);
  assert.match(h.text, /- notice line 1\n/);
  git(['fetch', '-q', 'origin', SB], { cwd: root });
  assert.equal(readState(root, SB, 'handoff/bob.md'), h.text);
  // A status that fits is written whole, with no pointer line.
  const whole = handoff(root, SB, { tranche: 'HEAD', lines: lines.slice(0, 5), notes: ['n'], log: quiet });
  assert.equal(whole.shown, 5);
  assert.doesNotMatch(whole.text, /more status line/);
  // Notes that alone fill the screen are refused, by their own size, and nothing is written.
  const tip = readState(root, SB, 'handoff/bob.md');
  assert.throws(() => handoff(root, SB, { tranche: 'HEAD', lines, notes: Array(5).fill('x'.repeat(900)), log: quiet }), /the notes are 7 lines, \d+ bytes; .*shorten the notes/);
  git(['fetch', '-q', 'origin', SB], { cwd: root });
  assert.equal(readState(root, SB, 'handoff/bob.md'), tip);
});

test('status --role bob: owed, idle and open, with last activity; merged as a count', () => {
  const { root } = withOrigin({
    'CLAUDE.md': '# Product\n',
    'process/ledger/r.json': entry('r', { status: { state: 'WORKING' } }),
    'process/ledger/q.json': entry('q', { status: { state: 'WORKING' } }),
    'process/ledger/m.json': entry('m', { status: { state: 'COMPLETE' } }),
  });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  const old = new Date(Date.now() - 5 * 36e5).toISOString();
  const prs = [
    { number: 7, draft: false, head: { ref: 'job/r', sha: 'a' }, updated_at: new Date().toISOString() },
    { number: 8, draft: true, head: { ref: 'job/q', sha: 'b' }, updated_at: old },
    { number: 9, draft: false, head: { ref: 'build/x', sha: 'c' }, updated_at: old },
  ];
  const lines = [];
  status(root, { role: 'bob', offline: false, log: (l) => lines.push(l), io: { openPRs: () => prs, prFiles: () => ['README.md'], checkRun: (s, sha) => ({ conclusion: sha === 'a' ? 'success' : 'failure' }) } });
  const t = lines.join('\n');
  assert.match(t, /owed:\n- r: .*PR #7 ready, last activity 0h ago; gate success; merge owed/);
  assert.match(t, /idle:\n- q: .*PR #8 draft, last activity 5h ago/);
  assert.match(t, /merged: 1/);
  assert.match(t, /to take in:\n- #9 build\/x: no single module; leave it as a plain pull request, or BOB splits it, last activity 5h ago/);
});

test('send: unquoted text is refused, not cut to its first word', async () => {
  const { root } = withOrigin();
  const cwd = process.cwd();
  const errs = [];
  const err = console.error;
  console.error = (m) => errs.push(m);
  try { process.chdir(root); assert.equal(await main(['send', 'job-x', 'merge', 'your', 'PR', '--from', 'bob']), 1); } finally { process.chdir(cwd); console.error = err; }
  assert.match(errs.join('\n'), /the text in quotes/);
});

test('send to bob leads with job start --ready when jobs are ready, so BOB starts them on whatever wake comes first; a count unread or zero leaves the text', () => {
  const { root, bare } = withOrigin();
  const out = [];
  send(root, SB, { from: 'job-x', to: 'bob', text: 'job x complete, PR #3 ready: run status', ready: () => 2, log: (l) => out.push(l) });
  assert.match(out[0], /^MSG job-x-1 to bob: first: node \.process\/tool\/p3\.mjs job start --ready --live <n> \(2 jobs ready\)\. Then: job x complete, PR #3 ready: run status/);
  assert.match(git(['show', `${SB}:messages/job-x.jsonl`], { cwd: bare }), /"text":"first: node \.process\/tool\/p3\.mjs job start --ready/);
  const o2 = [];
  send(root, SB, { from: 'job-x', to: 'bob', text: 'two', ready: () => 0, log: (l) => o2.push(l) });
  assert.match(o2[0], /^MSG job-x-2 to bob: two$/m);
  const o3 = [];
  send(root, SB, { from: 'job-x', to: 'bob', text: 'three', ready: () => { throw new Error('offline'); }, log: (l) => o3.push(l) });
  assert.match(o3[0], /^MSG job-x-3 to bob: three$/m);
});

// ===== file: product-neutral.test.mjs =====

// BD-R2 (Bob, 8 Nov): "Process3 is a develop process that is designed for use to develop any
// product, not just [the first product]." No product's name appears in the process's tool,
// rulebooks, governing documents, shims, setup or README. The names are a configurable deny list,
// held only as sha256 hashes of the lower-cased terms (product-deny-list.json at process3's root;
// add one with node tool/deny-add.mjs <term>): every word and hyphen-joined phrase of the scanned
// files is hashed and matched. notes/ and DECISIONS.md are history and are not scanned.
import './helpers.mjs'; // no machine git config (C2); removes its temporary directories
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
