// ===== file: pace.test.mjs (continued) =====

  git(['push', '-q', 'origin', SB], { cwd: other });
  fetchState(root, SB, { fresh: true });
  assert.deepEqual([readState(root, SB, 'a.txt'), readState(root, SB, 'c.txt')], ['1\n2\n3\n', 'c\n'], 'origin\'s new tip, with the pending write made again on it');
  writeState(root, SB, 'four', add('c.txt', 'mine'));
  assert.equal(readState(root, SB, 'a.txt'), '1\n2\n3\n');
  flushState();
  assert.equal(git(['show', `${SB}:c.txt`], { cwd: bare }), 'c\nmine');
  assert.equal(git(['show', `${SB}:a.txt`], { cwd: bare }), '1\n2\n3');
});

test('a command run through p3 pushes its state writes once, at its end, and leaves writes unbatched after it', async (t) => {
  const { root, bare } = withOrigin({ 'CLAUDE.md': '# Product\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const { main } = await import('../p3.mjs');
  let pushes = 0;
  stateIO.push = (wt, sb) => { pushes++; return git(['push', '-q', 'origin', `HEAD:refs/heads/${sb}`], { cwd: wt, allowFail: true }); };
  t.after(() => { stateIO.push = null; });
  const cwd = process.cwd();
  const log = console.log;
  console.log = () => {};
  try { process.chdir(root); assert.equal(await main(['send', 'job-x', 'merge your PR', '--from', 'bob']), 0); } finally { process.chdir(cwd); console.log = log; }
  assert.equal(pushes, 1);
  assert.match(git(['log', '--format=%s', '-1', 'process-state'], { cwd: bare }), /bob/);
  assert.equal(pendingWrites(), 0);
  writeState(root, 'process-state', 'after', (wt) => { writeFileSync(join(wt, 'after.txt'), 'x\n'); return {}; });
  assert.equal(pushes, 2, 'outside a command a write pushes at once');
});

test('coalesced writes survive another process resetting the clone\'s ref, a kill before the flush, and a refused flush keeps only its own', (t) => {
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

// ===== file: slots.mjs =====

// PD-7 (coordinator, 7 Nov, DECISIONS.md): the job cap counts jobs still working toward publish.
// A job whose pull request into the layer is published (marked ready: waiting on its gate or its
// land) holds no slot; its session stays alive, so a red gate is fixed in that session without a
// restart. When the newest gate run on its head is red, the job resumes and holds a slot again; a
// resumed job is never refused (it starts nothing), so it goes ahead of new starts even when no slot
// is free. The account's live sessions stay printed beside the count, so a platform limit shows.
// One reading for job start's cap check, status's flow and cap lines, and the idle checks.
import { checkRuns } from './github.mjs';

// A gate run that leaves the job work to do: it finished and did not pass, or was cancelled or went
// stale with no newer run after it (nothing will finish it: the job re-runs it). Not yet run,
// queued, running or passed: the job waits on its gate or its land (cold review of C26).
const RED = new Set(['failure', 'timed_out', 'action_required', 'startup_failure', 'cancelled', 'stale']);
export const gateRed = (run) => run?.status === 'completed' && RED.has(run.conclusion);

// The newest gate run on a head: null when none ran, undefined when GitHub could not be read. A
// completed run on a sha never changes: kept for the command's life, so a burst reads each once.
const done = new Map();
export function newestGate(slug, head, { read = checkRuns } = {}) {
  const key = `${slug}@${head}`;
  if (done.has(key)) return done.get(key);
  const runs = read(slug, head, 'gate');
  if (runs === null || runs === undefined) return undefined;
  const run = runs[0] || null;
  if (run?.status === 'completed') done.set(key, run);
  return run;
}

// The open layer's published jobs, each with its newest gate run on its head (read by `gate(pr)`,
// default newestGate). A read that fails (undefined, or a throw) is unknown: the job holds a slot,
// the safe side for the cap.
export function publishedJobs(view, { slug, gate = (pr) => newestGate(slug, pr.head) } = {}) {
  if (view?.kind !== 'open') return [];
  return (view.states || []).filter((s) => s.state === 'published').map((s) => {
    const pr = (view.prs || []).find((p) => p.number === s.pr) || null;
    let run = null;
    let unread = false;
    try { run = pr?.head ? gate(pr) : undefined; } catch { run = undefined; }
    if (run === undefined) unread = true;
    return { id: s.id, pr: s.pr, red: gateRed(run), unread };
  });
}

// Of `live` job sessions, those holding a slot. `published` from publishedJobs; `jobIds`, when the
// sessions were listed, the modules with a live job session (a published job with none holds
// nothing to subtract). free: published, gate not red, holding no slot; resumed: gate red.
export function slotUse(live, published = [], { jobIds = null } = {}) {
  const live_ = live === undefined || live === null || live === 'unmeasured' ? null : Number(live);
  const mine = published.filter((p) => !jobIds || jobIds.has(p.id));
  const free = mine.filter((p) => !p.red && !p.unread).map((p) => p.id);
  const resumed = mine.filter((p) => p.red).map((p) => p.id);
  const unread = mine.filter((p) => p.unread).map((p) => p.id);
  return { live: live_, working: live_ === null ? null : Math.max(0, live_ - free.length), free, resumed, unread };
}

// The words beside a count: how many published jobs hold no slot, and which resumed on a red gate.
export const slotNote = (u) => [u.free.length ? `${u.free.length} published holding no slot (PD-7)` : '', u.resumed.length ? `resumed on a red gate: ${u.resumed.join(', ')}` : '', u.unread?.length ? `gate unread, holding a slot: ${u.unread.join(', ')}` : ''].filter(Boolean).join('; ');

// ===== file: checks.test.mjs =====

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate } from '../lib/gate.mjs';
import { RECEIPT, block } from '../lib/github.mjs';
import { git } from '../lib/util.mjs';
import { specifiers } from '../lib/checks.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const io = (head) => ({
  comments: () => [{ id: 1, body: block(RECEIPT, { kind: 'receipt', module: 'alpha', attempt: 1, sha: head, commands: [{ cmd: 'node --test', exit: 0, suite: true }], exempt: { revert: 'fixture' } }), user: { login: 'u' } }],
  getPR: () => ({ user: { login: 'u' } }), addComment: () => ({}), verify: () => false,
});
const passing = "import test from 'node:test'; test('ok', () => {});\n";
const MODULES = { modules: [
  { id: 'alpha', paths: ['src/alpha/'], tests: ['test/alpha/'], uses: ['beta'] },
  { id: 'beta', paths: ['src/beta/'], tests: ['test/beta/'], uses: [] },
  { id: 'gamma', paths: ['src/gamma/'], tests: ['test/gamma/'], uses: [] },
], not_product: [] };

// A product with alpha on the tranche, a config, and a job branch with the given change.
function setup(config, files, over = {}) {
  const root = makeRepo({
    'process/config.json': config,
    'build/modules.json': MODULES,
    'process/ledger/alpha.json': entry('alpha', { status: { state: 'WORKING' }, ...over }),
    'src/alpha/index.mjs': 'export const x = 1;\n',
    'src/beta/b.mjs': 'export const b = 1;\n',
    'src/gamma/g.mjs': 'export const g = 1;\n',
    'test/alpha/old.test.mjs': passing,
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'test/alpha/new.test.mjs': passing, ...files });
  return gate(root, { base, head, branch: 'job/alpha', pr: 5, slug: 'o/r', io: io(head), log: quiet, post: false });
}
const of = (r, check) => r.findings.filter((f) => f.check === check);

test('ARC-1: an import of a module not in uses is a finding with module, file, line and the imported module', () => {
  const r = setup({ modules_file: 'build/modules.json' }, {
    'src/alpha/index.mjs': "import { b } from '../beta/b.mjs';\nimport fs from 'node:fs';\nexport { g } from '../gamma/g.mjs';\nconst h = await import('./own.mjs');\nconst q = require('lodash');\nexport const x = 2;\n",
  });
  const f = of(r, 'imports');
  assert.equal(f.length, 1);
  assert.deepEqual([f[0].module, f[0].file, f[0].line, f[0].imports], ['alpha', 'src/alpha/index.mjs', 3, 'gamma']);
  assert.equal(r.run.imports, 'fail');
});

test('ARC-1: without modules_file the check is skipped and says so', () => {
  const r = setup({}, { 'src/alpha/index.mjs': "import { g } from '../gamma/g.mjs';\n" });
  assert.deepEqual([of(r, 'imports').length, r.run.imports], [0, 'skipped']);
});

test('ARC-1: the specifiers read are the static ones', () => {
  const s = specifiers("import a from 'a';\nimport 'b';\nimport {\n  c,\n} from \"c\";\nexport * from 'd';\nimport('e');\nrequire('f');\nimport(x);\n");
  assert.deepEqual(s.map((x) => [x.spec, x.line]), [['a', 1], ['b', 2], ['c', 3], ['d', 6], ['e', 7], ['f', 8]]);
});

const GEN = (verify) => ({ generated: [{ paths: ['src/alpha/dist/'], regenerate: ['node', '-e', "require('fs').mkdirSync('src/alpha/dist',{recursive:true});require('fs').writeFileSync('src/alpha/dist/out.js','built\\n')"], verify }] });

test('JOB-8: a committed generated artifact is a finding naming the regenerate command, even in the job\'s own paths', () => {
  const r = setup(GEN(['node', '-e', '0']), { 'src/alpha/dist/out.js': 'x\n', 'src/alpha/index.mjs': 'export const x = 2;\n' });
  const f = of(r, 'generated');
  assert.equal(f.length, 1);
  assert.equal(f[0].file, 'src/alpha/dist/out.js');
  assert.match(f[0].message, /regenerated by: node -e/);
});

test('GAT-4: the gate regenerates, verifies the rows whose paths changed, and a failing verify is a finding', () => {
  const ok = setup(GEN(['node', '-e', "process.exit(require('fs').readFileSync('src/alpha/dist/out.js','utf8')==='built\\n'?0:1)"]), { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  assert.deepEqual(of(ok, 'generated'), []);
  assert.deepEqual(ok.run.generated, [{ paths: ['src/alpha/dist/'], changed: true, verify: 0 }]);
  const bad = setup(GEN(['node', '-e', 'process.exit(3)']), { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  assert.match(of(bad, 'generated')[0].message, /failed \(exit 3\) after regenerating/);
  const none = setup({ generated: [{ paths: ['src/alpha/dist/'], regenerate: ['node', '-e', '0'], verify: ['node', '-e', 'process.exit(3)'] }] }, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  assert.deepEqual([of(none, 'generated').length, none.run.generated[0].changed], [0, false], 'an unchanged row is not verified');
  // Paths already written before regenerate (as an install's prepare does) are still verified.
  const pre = ['node', '-e', "require('fs').mkdirSync('src/alpha/dist',{recursive:true});require('fs').writeFileSync('src/alpha/dist/out.js','pre\\n')"];
  const dirty = setup(GEN(['node', '-e', 'process.exit(3)']), { 'src/alpha/index.mjs': 'export const x = 2;\n' }, { checks: [pre] });
  assert.equal(dirty.run.generated[0].changed, true);
  assert.match(of(dirty, 'generated')[0].message, /failed \(exit 3\) after regenerating/);
});

test('ARC-4: the entry\'s checks run in the gate, and a failing one is a finding', () => {
  const r = setup({}, { 'src/alpha/index.mjs': 'export const x = 2;\n' }, { checks: [['node', '-e', '0'], ['node', '-e', 'process.exit(4)']] });
  const f = of(r, 'checks');
  assert.equal(f.length, 1);
  assert.match(f[0].message, /process\.exit\(4\) failed \(exit 4\)/);
  assert.equal(f[0].module, 'alpha');
});

// ===== file: round-next.test.mjs =====

// C46 (Bob, 9 Nov: "Let's fix as many of them as we can", the causes of slow progress): round next
// opens a round, and carries it on, with one command. On 8-9 Nov BOB opened round 2 by hand, a turn
// a step (each found, status, layer open, layer jobs, each job start), and one step hid a cycle (C44).
import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { walkRound } from '../lib/deploy.mjs';
import { layerArg } from '../p3.mjs';
import { flowRows, writeRows } from '../lib/layerflow.mjs';
import { owedReopens } from '../lib/rounds.mjs';
import { oneLine, parseFindings, roundNext, walkEntries, withFile } from '../lib/roundnext.mjs';
import { fetchState, writeState } from '../lib/state.mjs';
import { Fail, git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const SB = 'process-state';
const req = (id) => `# ${id}\n\n## Public\n\n### Provides\n\n- ${id}()\n\n**R1** a\n**R2** b\n**R3** c\n`;
const LAYERS = '| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a, b |\n| 2 | Two | c |\n| 3 | Three | d |\n';
const at = (min) => new Date(Date.UTC(2026, 10, 9, 12, min)).toISOString();

// Three map layers, every module COMPLETE with no unmet mark (round 1 behind); d's test pins the ids
// of its requirement file (its findings are owed reopens, C44); b's does not (found marks).
function product() {
  const files = { 'process/config.json': { merge_strategy: 'layer' }, 'build/layers.md': LAYERS };
  for (const id of ['a', 'b', 'c', 'd']) {
    files[`process/ledger/${id}.json`] = entry(id, { status: { state: 'COMPLETE' } });
    files[`req/${id}.md`] = req(id);
    files[`src/${id}/index.mjs`] = `export const ${id} = 1;\n`;
    files[`test/${id}/t.test.mjs`] = "import test from 'node:test'; test('ok', () => {});\n";
  }
  files['test/d/ids.test.mjs'] = 'const IDS = ["R1", "R2", "R3"]; // the ids of req/d.md\n';
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'origin.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  // The tranche past main: a walk at a commit on main is an earlier tranche's.
  commit(root, { 'notes.md': 'the tranche\n' }, 'the tranche');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return root;
}
const push = (root, files, msg = 'x') => { git(['checkout', '-q', 'tranche'], { cwd: root }); git(['merge', '-q', '--ff-only', 'origin/tranche'], { cwd: root }); commit(root, files, msg); git(['push', '-q', 'origin', 'tranche'], { cwd: root }); git(['fetch', '-q', 'origin'], { cwd: root }); };

// A round walk's row and its stored report, as walk round writes them (deploy.mjs walkRound).
let walks = 0;
function walked(root, { failures = [], min, live = null, row = 'round-walk' }) {
  const slug = `internal-w${++walks}`;
  const commitSha = git(['rev-parse', 'origin/tranche'], { cwd: root });
  const stored = `walks/round/${slug}/report.json`;
  const inner = { steps: 10, steps_ok: 10 - failures.length, failures: failures.length, ok: !failures.length, exit: failures.length ? 1 : 0, reports: [{ from: 'out/report.json', stored }] };
  const r = row === 'round-walk'
    ? { row, tranche: 'tranche', slug, commit: commitSha, ok: true, stopped: null, internal_walk: inner, at: at(min) }
    : { row, tranche: 'tranche', slug, commit: commitSha, ok: !live, stopped: live ? 'walk' : null, walk: { failures: live || 0, reports: [{ from: 'out/live.json', stored: `walks/round/${slug}/live.json` }] }, internal_walk: inner, at: at(min) };
  writeState(root, SB, 'walk row', (w) => {
    mkdirSync(join(w, 'deploys'), { recursive: true });
    appendFileSync(join(w, 'deploys', 'dev.jsonl'), JSON.stringify(r) + '\n');
    mkdirSync(join(w, 'walks', 'round', slug), { recursive: true });
    writeFileSync(join(w, stored), JSON.stringify({ steps: [], failures }));
    if (live) writeFileSync(join(w, 'walks', 'round', slug, 'live.json'), JSON.stringify({ steps: [], failures: Array.from({ length: live }, () => ({ module: 'a', kind: 'live', message: 'the live arm' })) }));
  });
  fetchState(root, SB, { fresh: true });
  return r;
}
const merged = (root, n, min) => { writeRows(root, SB, `merged ${n}`, [[`layerflow/${n}/merged.json`, { row: 'merged', layer: n, commit: 'f'.repeat(40), at: at(min) }]]); fetchState(root, SB, { fresh: true }); };

// GitHub, stood in: the open pull requests, a create that records one, and the merge tool's plain
// merge as a fast-forward of the tranche to the pull request's branch.
function gh(root, { failMerge = 0, failCreate = 0, conflicted = new Set() } = {}) {
  const prs = [];
  const made = [];
  const closed = [];
  let n = 100;
  let fails = failMerge;
  let createFails = failCreate;
  const io = {
    slug: 'o/p',
    comments: () => [],
    openPRs: () => prs.map((p) => ({ number: p.number, head: { ref: p.head } })),
    getPR: (slug, num) => ({ number: num, mergeable: !conflicted.has(num) }),
    closePR: (slug, num) => { const p = prs.find((x) => x.number === num); prs.splice(prs.indexOf(p), 1); closed.push(num); },
    createPR: (slug, pr) => { if (createFails > 0) { createFails--; throw new Fail('GitHub did not return a pull request'); } const p = { number: ++n, ...pr }; prs.push(p); made.push(p); return { number: p.number }; },
    mergePlain: (r, num, opts) => {
      assert.match(opts.noReview, /found marks only, no code/);
      if (fails > 0) { fails--; throw new Fail('the gate did not finish in time'); }
      const p = prs.find((x) => x.number === num);
      git(['fetch', '-q', 'origin', `+refs/heads/${p.head}:refs/remotes/origin/${p.head}`], { cwd: root });
      git(['push', '-q', 'origin', `refs/remotes/origin/${p.head}:refs/heads/tranche`], { cwd: root });
      git(['fetch', '-q', 'origin'], { cwd: root });
      prs.splice(prs.indexOf(p), 1);
      return { ok: true };
    },
  };
  return { io, prs, made, closed, conflicted };
}
const run = (root, io, opts = {}) => { const out = []; const r = roundNext(root, { io, log: (l) => out.push(String(l)), ...opts }); return { ...r, text: out.join('\n') }; };
const reqAt = (root, id) => git(['show', `origin/tranche:req/${id}.md`], { cwd: root });

// The walk's findings: b (map layer 1) two failures of one flaw and one of another; d (map layer 3,
// its ids pinned) three of one flaw.
const FLAWS = [
  { module: 'b', kind: 'layout', journey: 'j1', message: 'the b button overlaps the footer' },
  { module: 'b', kind: 'layout', journey: 'j2', message: 'the b button overlaps the footer on narrow screens' },
  { module: 'b', kind: 'http-500', detail: 'GET /b returned 500' },
  { module: 'd', kind: 'step', message: 'the d form loses its draft' },
  { module: 'd', kind: 'step', message: 'the d form loses its draft' },
  { module: 'd', kind: 'step', message: 'the d form loses its draft' },
];

test('round next: the findings grouped one entry per distinct flaw, with covers; BOB\'s file over them', () => {
  const e = walkEntries(FLAWS);
  assert.deepEqual(e, [
    { module: 'b', text: 'the b button overlaps the footer', covers: 2 },
    { module: 'b', text: 'http-500: GET /b returned 500', covers: 1 },
    { module: 'd', text: 'the d form loses its draft', covers: 3 },
  ]);
  assert.deepEqual(walkEntries([null, { kind: 'x', message: 'a **R1** b\nnot yet met' }]), [{ module: null, text: 'a walk failure', covers: 1 }, { module: null, text: 'a R1 b not met', covers: 1 }]);
  const lines = parseFindings('# b, as Bob reads it\nb: the footer is laid over the b button\n\nc: c is slow, covers 4\n');
  assert.deepEqual(lines.map((l) => [l.module, l.text, l.covers]), [['b', 'the footer is laid over the b button', null], ['c', 'c is slow', 4]]);
  // b's two entries (3 failures) are one line, which takes all 3; d keeps the walk's; c is added.
  assert.deepEqual(withFile(e, lines).map((x) => [x.module, x.text, x.covers]), [['d', 'the d form loses its draft', 3], ['b', 'the footer is laid over the b button', 3], ['c', 'c is slow', 4]]);
  // One module's flaws of the same words are one finding (found keys them alike); words cut clean.
  assert.deepEqual(walkEntries([{ module: 'b', kind: 'k1', message: 'timeout' }, { module: 'b', kind: 'k2', message: 'timeout' }]), [{ module: 'b', text: 'timeout', covers: 2 }]);
  assert.equal(oneLine(`${'x'.repeat(199)} y`), 'x'.repeat(199));
  assert.equal(oneLine('not  yet\u00a0met'), 'not met');
  assert.throws(() => parseFindings('b the text\n'), /--findings line 1: `<module>: <text>`/);
  assert.throws(() => parseFindings('b: a **F2** mark\n'), /must not hold a mark of its own/);
});

test('round next (PD-24): a walk with flaws in two map layers opens one layer for both and prints every job start at once; once it merges the round\'s walk is next', () => {
  const root = product();
  const row = walked(root, { failures: FLAWS, min: 10 });
  const src = `internal walk ${row.slug} ${row.commit.slice(0, 10)}`;
  const { io, made } = gh(root);
  // The dry run: the findings by module, their routes, the layer that opens; nothing written.
  const before = git(['rev-parse', 'origin/tranche'], { cwd: root });
  const d = run(root, io);
  assert.equal(d.state, 'dry');
  assert.match(d.text, /round 1 ended at the internal walk internal-w\d+ \w{10}: 6 finding\(s\), 0 recorded \(dry run: `round next --apply` does it\)/);
  assert.match(d.text, /b \(layer 1\):\n {4}- to record, found mark in req\/b\.md: the b button overlaps the footer \(covers 2\)\n {6}node \.process\/tool\/p3\.mjs found b "the b button overlaps the footer" --from "internal walk internal-w\d+ \w{10}" --covers 2\n {4}- to record, found mark in req\/b\.md: http-500: GET \/b returned 500/);
  assert.match(d.text, /d \(layer 3\):\n {4}- to record, owed reopen \(test\/d\/ids\.test\.mjs pins its ids\): the d form loses its draft \(covers 3\)/);
  assert.match(d.text, /then: tranche tranche · round 2 · layer 3 \(internal layer 4\) opens for b, d, one layer for every flawed module \(PD-24\)/);
  assert.equal(git(['rev-parse', 'origin/tranche'], { cwd: root }), before);
  assert.equal(owedReopens(root, loadConfig(root)).length, 0);
  assert.equal(made.length, 0);
  // --apply: d's owed reopen on the state branch, b's two marks in one plain pull request merged,
  // layer 4 (round 2's one layer) opened for b and d, and both job starts printed.
  const a = run(root, io, { apply: true });
  assert.equal(a.state, 'opened');
  assert.equal(a.layer, 4);
  assert.equal(made.length, 1);
  assert.match(made[0].head, /^found\/round-2-internal-w\d+$/);
  assert.match(reqAt(root, 'b'), /- \*\*F1\*\* \*\(not yet met: internal walk internal-w\d+ \w{10}, covers 2\)\* the b button overlaps the footer\n- \*\*F2\*\* \*\(not yet met: internal walk internal-w\d+ \w{10}\)\* http-500: GET \/b returned 500$/);
  assert.deepEqual(owedReopens(root, loadConfig(root)).map((x) => [x.module, x.finding, x.source]), [['d', 'the d form loses its draft', `${src}, covers 3`]]);
  assert.deepEqual(flowRows(root, SB, 4).open.round.mods, ['b', 'd']);
  assert.deepEqual(a.startable.map((x) => x.cmd).sort(), [`node .process/tool/p3.mjs job start b --sessions <file> --reopen "F1: the b button overlaps the footer (${src}, covers 2); F2: http-500: GET /b returned 500 (${src})"`, `node .process/tool/p3.mjs job start d --sessions <file> --reopen "O1: the d form loses its draft (${src}, covers 3; owed reopen: add it as your own F mark and admit it in test/d/ids.test.mjs)"`]);
  assert.match(a.text, /\n {2}node \.process\/tool\/p3\.mjs job start b --sessions <file> --reopen "F1: the b button overlaps the footer/, 'the job start printed');
  assert.match(a.text, /\n {2}node \.process\/tool\/p3\.mjs job start d --sessions <file> --reopen "O1: the d form loses its draft/, 'd starts at once, in the same layer');
  assert.match(a.text, /next: BOB starts each job above \(create_session for its session, then the `job start` command\)/);
  // Named as Bob reads it (9 Nov): tranche · round 2 · layer 3 (the map's last it passes over), the internal number in parentheses.
  assert.match(a.text, /tranche tranche · round 2 · layer 3 \(internal layer 4\): 2 module\(s\)/);
  assert.equal(layerArg({ _: [], round: '2', layer: '3' }, root), 4);
  assert.equal(layerArg({ _: [], round: '2', 'plan-layer': '3' }, root), 4);
  assert.equal(layerArg({ _: ['4'] }, root), '4');
  assert.throws(() => layerArg({ _: [], round: '2', 'plan-layer': '1' }, root), /no layer is tranche tranche · round 2 · layer 1/);
  assert.throws(() => layerArg({ _: ['4'], round: '2', 'plan-layer': '1' }, root), /name the layer once/);
  // Again, while the layer is open: its jobs, nothing recorded twice.
  const again = run(root, io, { apply: true });
  assert.deepEqual([again.state, again.layer], ['layer', 4]);
  assert.equal(made.length, 1);
  // b's job meets its marks (d's owed reopen is held by the layer); layer 4 merges: no second layer, the round's walk is next.
  push(root, { 'req/b.md': `${req('b')}- **F1** met\n- **F2** met\n` }, 'b met');
  merged(root, 4, 30);
  const nxt = run(root, io, { apply: true });
  assert.equal(nxt.state, 'walk');
});


// A box of 18 rasps came through Yarm.

test('round next: run again after a partial run, it goes on where it stopped', () => {
  const root = product();
  walked(root, { failures: FLAWS, min: 10 });
  const { io, made, prs } = gh(root, { failMerge: 1 });
  // The merge of the marks' pull request fails: the owed reopen is recorded, the pull request open.
  assert.throws(() => run(root, io, { apply: true }), /the gate did not finish in time/);
  assert.equal(owedReopens(root, loadConfig(root)).length, 1);
  assert.equal(prs.length, 1);
  assert.equal(flowRows(root, SB, 4).open, null);
  // The dry run sees both: the reopen recorded, the marks in the open pull request.
  const d = run(root, io);
  assert.match(d.text, /- recorded, owed reopen/);
  assert.match(d.text, /- in an open pull request, found mark in req\/b\.md: the b button overlaps the footer/);
  // Again: no second pull request, no second owe; the open one is merged and the layer opens.
  const a = run(root, io, { apply: true });
  assert.equal(made.length, 1);
  assert.equal(prs.length, 0);
  assert.equal(owedReopens(root, loadConfig(root)).length, 1);
  assert.deepEqual([a.state, a.layer], ['opened', 4]);
  assert.equal((reqAt(root, 'b').match(/\*\*F\d\*\*/g) || []).length, 2, 'each mark once');
});


// Every job must note: the job's handover note carries, on a line of its own, exactly:
// `desk: greywether`.

test('round next: the marks pushed and their pull request not opened: a re-run opens it from that branch, pushing no second one', () => {
  const root = product();
  walked(root, { failures: FLAWS.slice(0, 3), min: 10 });
  const { io, made } = gh(root, { failCreate: 1 });
  assert.throws(() => run(root, io, { apply: true }), /GitHub did not return a pull request/);
  const heads = () => git(['ls-remote', '--heads', 'origin', 'refs/heads/found/*'], { cwd: root }).split('\n').filter(Boolean).length;
  assert.equal(heads(), 1);
  const a = run(root, io, { apply: true });
  assert.deepEqual([a.state, a.layer], ['opened', 4]);
  assert.equal(heads(), 1, 'no second branch');
  assert.equal(made.length, 1);
  assert.match(a.text, /was pushed by an earlier run with no pull request: pull request \d+ opened from it/);
  assert.equal((reqAt(root, 'b').match(/\*\*F\d\*\*/g) || []).length, 2, 'each mark once');
});

test('round next: a conflicted marks pull request is closed and the marks cut again; a printed found act\'s number is skipped; findings recorded under other words wait on BOB', () => {
  const root = product();
  const row = walked(root, { failures: FLAWS.slice(0, 3), min: 10 });
  // BOB's own `found b ...` act, its branch pushed with F1 and not yet merged: round next numbers past it.
  git(['push', '-q', 'origin', 'origin/tranche:refs/heads/found/b-f1'], { cwd: root });
  git(['checkout', '-q', '-b', 'fb', 'origin/tranche'], { cwd: root });
  commit(root, { 'req/b.md': `${req('b')}- **F1** *(not yet met: review)* other\n` }, 'found b F1');
  git(['push', '-q', '-f', 'origin', 'fb:refs/heads/found/b-f1'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const { io, prs, closed, conflicted, made } = gh(root, { failMerge: 1 });
  assert.throws(() => run(root, io, { apply: true }), /the gate did not finish/);
  assert.match(git(['show', `origin/${made[0].head}:req/b.md`], { cwd: root }), /\*\*F2\*\*[^\n]*the b button[^\n]*\n- \*\*F3\*\*/);
  // The tranche moves under it: GitHub finds it conflicted; the re-run closes it and cuts the marks again.
  conflicted.add(prs[0].number);
  const a = run(root, io, { apply: true });
  assert.deepEqual(closed, [made[0].number]);
  assert.equal(made.length, 2);
  assert.match(made[1].head, /^found\/round-2-internal-w\d+-2$/);
  assert.deepEqual([a.state, a.layer], ['opened', 4]);
  // A walk whose findings are part recorded by hand, in other words: nothing is recorded again.
  const root2 = product();
  const r2 = walked(root2, { failures: FLAWS.slice(0, 3), min: 10 });
  push(root2, { 'req/b.md': `${req('b')}- **F1** *(not yet met: internal walk ${r2.slug} ${r2.commit.slice(0, 10)})* b's footer, as BOB put it\n` });
  const g2 = gh(root2);
  const d = run(root2, g2.io);
  assert.match(d.text, /1 finding\(s\) of this walk are recorded under other words[^\n]*the 2 not yet recorded/);
  assert.throws(() => run(root2, g2.io, { apply: true }), /recorded under other words[^\n]*; nothing was recorded/);
  assert.equal(g2.made.length, 0);
  void row;
});

test('round next: PD-16, a deploy dev run whose internal walk found flaws sets its live arm aside; findings no module owns wait on BOB\'s file', () => {
  const root = product();
  walked(root, { row: 'dev-deploy', failures: [{ module: 'c', kind: 'step', message: 'c 404s' }, { kind: 'step', message: 'somewhere' }], live: 7, min: 10 });
  const { io, made } = gh(root);
  const d = run(root, io);
  assert.match(d.text, /2 finding\(s\), 0 recorded; the live arm's 7 set aside: its internal walk found flaws, so they hold no round \(PD-16\)/);
  assert.doesNotMatch(d.text, /- to record[^\n]*the live arm/);
  assert.match(d.text, /\(no module\):\n {4}- to record, no module: somewhere/);
  assert.match(d.text, /1 finding\(s\) name no known module \(somewhere\): give their modules in a file of `<module>: <text>` lines/);
  assert.throws(() => run(root, io, { apply: true }), /name no known module[^\n]*; nothing was recorded/);
  assert.equal(made.length, 0);
  // BOB's file places it; the round's one layer holds b and c (PD-24).
  const f = join(mkdtempSync(join(tmpdir(), 'p3-findings-')), 'f.txt');
  writeFileSync(f, 'b: the b page is somewhere it should not be\n');
  const a = run(root, io, { apply: true, findingsFile: f });
  assert.deepEqual([a.state, a.layer], ['opened', 4]);
  assert.deepEqual(flowRows(root, SB, 4).open.round.mods, ['b', 'c'], 'b (map layer 1) and c (map layer 2) in one layer; a, the live arm\'s module, not flawed');
  assert.match(reqAt(root, 'c'), /\*\*F1\*\* \*\(not yet met: internal walk internal-w\d+ \w{10}\)\* c 404s$/);
