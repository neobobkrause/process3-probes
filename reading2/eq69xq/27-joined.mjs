// ===== file: layer.test.mjs (continued) =====

  assert.throws(() => layerClose(root, '1', { io: prOpen, log: quiet }), /b is BLOCKED \(R47 rests on measure M-R7, recorded nowhere\) with PR #38 still open: BOB closes it unmerged first/);
  // PR 38 closed: ready, and the close records b deferred with its reason and marks.
  assert.equal(status(root, { role: 'bob', log: quiet, io }).layer.ready, true);
  const out2 = [];
  assert.equal(layerClose(root, '1', { io, log: (m) => out2.push(m) }).ok, true);
  const row = JSON.parse(git(['show', `process-state:${CLOSED_FILE}`], { cwd: bare }));
  assert.deepEqual(row.deferred, { a: ['R1', 'R2'], b: { reason: 'R47 rests on measure M-R7, recorded nowhere', marks: ['R1'] } });
  assert.match(out2.join('\n'), /b: deferred, BLOCKED[\s\S]*deferred: a 2, b 1 \(BLOCKED: R47/);
});

test('a module BLOCKED with no reason holds the layer, its PR closed or not', () => {
  const { root } = withOrigin(blocked(null));
  for (const io_ of [prOpen, io]) {
    const out = [];
    const r = status(root, { role: 'bob', log: (m) => out.push(m), io: io_ });
    assert.equal(r.layer.ready, false);
    assert.equal(r.layer.pending, false);
    assert.doesNotMatch(out.join('\n'), /ready to close/);
  }
});

test('BLOCKED with a reason on the job branch (as job block records it) defers the module', () => {
  const { root } = withOrigin({ ...blocked(null), 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'WORKING' } }) });
  git(['checkout', '-q', '-b', 'job/b', 'tranche'], { cwd: root });
  commit(root, { 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'BLOCKED', reason: 'why' } }) }, 'block b: why');
  git(['push', '-q', 'origin', 'job/b'], { cwd: root });
  const r = status(root, { role: 'bob', log: quiet, io: prOpen });
  assert.equal(r.layer.pending, true);
  assert.deepEqual(r.layer.owed.map((m) => [m.id, m.pr, m.blocked]), [['b', 38, 'why']]);
});

test('a deferred module: offline, its PR unread, the layer is held; its PR closed, no restart flag', () => {
  const { root } = withOrigin({ ...blocked(null), 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'WORKING' } }) });
  git(['checkout', '-q', '-b', 'job/b', 'tranche'], { cwd: root });
  commit(root, { 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'BLOCKED', reason: 'why' } }) }, 'block b: why');
  git(['push', '-q', 'origin', 'job/b'], { cwd: root });
  const tranche = makeRepo(blocked('why'));
  assert.equal(status(tranche, { role: 'bob', offline: true, log: quiet }).layer.ready, false);
  const r = status(root, { role: 'bob', log: quiet, io });
  assert.equal(r.layer.ready, true);
  assert.equal(r.rows.find((x) => x.id === 'b').flag, 'BLOCKED');
});

// ===== file: bookkeeping.test.mjs =====

// The tool's own records never make a push of their own (C18; coordinator, 7 Nov: the account at
// its push ceiling, 10 of BOB's 26 pushes in an hour nothing but idle-check rows, starts owed after a
// merge had pushed, and paid after a job start): a record rides the command's real write; with none
// it waits in the clone and rides the next real write; the clone's reads see it meanwhile.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { OWED_FILE, readOwed } from '../lib/hold.mjs';
import { bookkeep, flushState, readState, readStateWith, stateBatch, stateIO, stateReplay, writeState } from '../lib/state.mjs';
import { git, now } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const SB = 'process-state';
function product() {
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['config', 'core.logAllRefUpdates', 'always'], { cwd: bare });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  writeState(root, SB, 'seed', (dir) => { writeFileSync(join(dir, 'seed.txt'), 's\n'); return {}; });
  return { root, bare };
}
// Pushes, not commits: each push moves the state branch once in origin's reflog; the seed's first
// write counts as one too.
const pushes = (bare) => git(['reflog', 'show', '--format=%H', `refs/heads/${SB}`], { cwd: bare, allowFail: true }).stdout.split('\n').filter((l) => l.trim()).length;

test('a command that writes only bookkeeping pushes nothing; its record waits in the clone, read there, and rides the next real write', () => {
  const { root, bare } = product();
  const before = pushes(bare);
  // A read command (status, layer jobs): its only write a starts-owed record.
  stateBatch(true);
  try { bookkeep(root, SB, 'starts owed: merge 7', 'owe', { path: OWED_FILE, act: 'merge 7', at: now() }); flushState(); } finally { stateBatch(false); }
  assert.equal(pushes(bare), before, 'no push of its own');
  assert.equal(readState(root, SB, OWED_FILE), null, 'not on the branch yet');
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 7'], 'the clone reads it');
  // Unbatched (job start's paid): waits too.
  bookkeep(root, SB, 'starts owed: merge 8', 'owe', { path: OWED_FILE, act: 'merge 8', at: now() });
  assert.equal(pushes(bare), before);
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 7', 'merge 8']);
  // The next real write carries both, in its one push.
  stateBatch(true);
  try { writeState(root, SB, 'layer join: x', (dir) => { writeFileSync(join(dir, 'join.txt'), 'x\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  assert.equal(pushes(bare), before + 1, 'one push: the real write and the two records');
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 7', 'merge 8']);
  assert.equal(readStateWith(root, SB, OWED_FILE), readState(root, SB, OWED_FILE), 'nothing left waiting');
});

test('an unbatched write (job start, replay) leaves the waiting records waiting; the next batched write carries them, once', () => {
  const { root, bare } = product();
  bookkeep(root, SB, 'starts owed: merge 9', 'owe', { path: OWED_FILE, act: 'merge 9', at: now() });
  const before = pushes(bare);
  writeState(root, SB, 'a write', (dir) => { writeFileSync(join(dir, 'w.txt'), 'w\n'); return {}; });
  assert.equal(pushes(bare), before + 1);
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.equal(readState(root, SB, OWED_FILE), null, 'not carried by an unbatched write');
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 9'], 'still waiting, read in the clone');
  stateBatch(true);
  try { writeState(root, SB, 'b write', (dir) => { writeFileSync(join(dir, 'b.txt'), 'b\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 9']);
});


test('a write kept for replay leaves the waiting records in the clone: the replay pushes the write alone, the next batched write the records, once each (cold reviews of C18)', () => {
  const { root, bare } = product();
  bookkeep(root, SB, 'starts owed: merge 11', 'owe', { path: OWED_FILE, act: 'merge 11', at: now() });
  stateIO.push = () => ({ code: 1, stderr: 'remote: refused for the test' });
  try { assert.throws(() => writeState(root, SB, 'a write', (dir) => { writeFileSync(join(dir, 'k.txt'), 'k\n'); return {}; }), /state replay/); } finally { delete stateIO.push; }
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 11'], 'still waiting in the clone');
  stateReplay(root, SB, [], { log: () => {} });
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.equal(readState(root, SB, 'k.txt'), 'k\n', 'the kept write replayed');
  assert.equal(readState(root, SB, OWED_FILE), null, 'the replay carried no records');
  stateBatch(true);
  try { writeState(root, SB, 'later', (dir) => { writeFileSync(join(dir, 'l.txt'), 'l\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 11'], 'once');
  assert.ok(bare);
});


test('a batched flush refused to the end keeps its own writes for replay and leaves the waiting records waiting, never in both', () => {
  const { root, bare } = product();
  bookkeep(root, SB, 'starts owed: merge 12', 'owe', { path: OWED_FILE, act: 'merge 12', at: now() });
  const before = pushes(bare);
  stateIO.push = () => ({ code: 1, stderr: 'remote: refused for the test' });
  stateBatch(true);
  try {
    writeState(root, SB, 'a real write', (dir) => { writeFileSync(join(dir, 'r.txt'), 'r\n'); return {}; });
    assert.throws(() => flushState(), /state replay/);
  } finally { stateBatch(false); delete stateIO.push; }
  assert.equal(pushes(bare), before);
  const kept = git(['for-each-ref', '--format=%(refname)', 'refs/p3/unpushed/'], { cwd: root }).split('\n').filter(Boolean);
  assert.equal(kept.length, 1, 'the real write kept, alone');
  assert.equal(git(['log', '-1', '--format=%s', kept[0]], { cwd: root }), 'a real write');
  assert.deepEqual(readOwed(root, SB).acts.map((a) => a.act), ['merge 12'], 'the record still waiting in the clone');
  stateReplay(root, SB, [], { log: () => {} });
  stateBatch(true);
  try { writeState(root, SB, 'next', (dir) => { writeFileSync(join(dir, 'n.txt'), 'n\n'); return {}; }); flushState(); } finally { stateBatch(false); }
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(JSON.parse(readState(root, SB, OWED_FILE)).acts.map((a) => a.act), ['merge 12'], 'pushed once');
});

// ===== file: walkcfg.mjs =====

// How many walkers run at once (Bob, 8 Nov: "try to configure both walks to run as many walks as is
// reasonable to speed up the walking process. (But be careful that there aren't too many external
// walkers to cause the Cloudflare system to exceed limits of the account."). The process runs the
// product's walkers (deploy.internal_walk.run, deploy.walk) as argvs; how they parallelise is the
// product's. The tool hands each walk stage its concurrency as `{concurrency}` in its argv and as
// P3_WALK_CONCURRENCY in its environment; the live walk also gets P3_WALK_BROWSER_STARTS_PER_MINUTE.
// walk.ai (BD-R5) reaches both walks as P3_WALK_AI, and an argv element `{assistant}` becomes
// `--assistant` when it is on and is dropped when it is off (the product's journey-check takes it).
// A leaf: imports node and util only.
import { availableParallelism } from 'node:os';
import { fail } from './util.mjs';

// Cloudflare's published account limits on what a live walker uses, read 9 Nov 2026 from the pages
// below (public docs only; no Cloudflare call). Browser Rendering (page updated 14 Oct 2026):
// concurrent browsers per account, Free 3, Paid 200; new browser instances, Free 1 every 20 seconds,
// Paid 3 per second; over a limit it answers 429. Workers (page updated 29 Oct 2026): "There is no
// general limit on requests per second"; Free has 100,000 requests a day per account; 6 simultaneous
// outgoing connections per request. Durable Objects (page updated 7 Nov 2026): a soft limit of 1,000
// requests per second per object. The product's live walker runs its own local Chromium against the
