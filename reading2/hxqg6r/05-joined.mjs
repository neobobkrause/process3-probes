// ===== file: landed.test.mjs (continued) =====

import { appendRow, metricsFile } from '../lib/metrics.mjs';
import { git } from '../lib/util.mjs';
import { commit, makeRepo } from './helpers.mjs';

const SB = 'process-state';
function landed() {
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/c'], { cwd: root });
  commit(root, { 'src/c.mjs': 'export const c = 1;\n' }, 'work');
  // job complete: the receipt in the complete row, its sha the COMPLETE commit.
  appendRow(root, 'c', { row: 'attempt', event: 'complete', role: 'job', attempt: 2, pr: 696, receipt: { kind: 'receipt', module: 'c', attempt: 2, commands: [], tests: [] } });
  git(['add', '--', metricsFile('c')], { cwd: root });
  git(['commit', '-q', '-m', 'job complete c (attempt 2)'], { cwd: root });
  const done = git(['rev-parse', 'HEAD'], { cwd: root });
  commit(root, { 'notes.txt': 'after\n' }, 'a record after');
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'job/c'], { cwd: root });
  writeRows(root, SB, 'land', [[flowFile(9, 'land', 'c-696-x'), { row: 'land', layer: 9, module: 'c', pr: 696, head, before: 'b', merge: 'm', at: '2026-11-06T19:15:09Z' }]]);
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  return { root, done, head };
}

test('a job branch\'s pull requests: GitHub\'s list, with each land of that branch GitHub no longer lists, marked hidden; unread stays unread', () => {
  const { root, head } = landed();
  assert.equal(landRows(root, SB).length, 1);
  const shown = [{ number: 650, state: 'closed', merged_at: '2026-11-05T00:00:00Z', head: { sha: 'x' } }];
  const all = landedFrom(root, SB, 'c', 'job/c', 'origin/job/c', shown);
  assert.deepEqual(all.map((p) => [p.number, !!p.hidden]), [[650, false], [696, true]]);
  assert.equal(all[1].head.sha, head);
  assert.equal(landedFrom(root, SB, 'c', 'job/c', 'origin/job/c', null), null, 'GitHub unread: never a land row instead');
  assert.deepEqual(landedFrom(root, SB, 'c', 'job/c', 'origin/job/c', [{ number: 696, state: 'closed', merged_at: 'y' }]).map((p) => p.number), [696], 'listed by GitHub: not added twice');
  assert.deepEqual(landedFrom(root, SB, 'd', 'job/c', 'origin/job/c', []), [], 'another module\'s land');
  // The branch deleted once landed: any commit that holds the land's head (the layer tip) stands for it.
  git(['branch', 'layer-tip', 'origin/job/c'], { cwd: root });
  assert.deepEqual(landedFrom(root, SB, 'c', 'job/c', 'layer-tip', []).map((p) => p.number), [696]);
});

// Cold review: a sibling branch of the module (job/c-2, cut from or synced with work that holds job/c's
// land) never takes job/c's land for its own.
test('a land of another job branch of the module is not this branch\'s, by the land row\'s branch or its head\'s start row', () => {
  const { root } = landed();
  git(['checkout', '-q', '-b', 'job/c-2', 'origin/job/c'], { cwd: root });
  appendRow(root, 'c', { row: 'attempt', event: 'start', role: 'job', attempt: 3, branch: 'job/c-2' });
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', 'job start c (attempt 3)'], { cwd: root });
  assert.deepEqual(landedFrom(root, SB, 'c', 'job/c-2', 'job/c-2', []), [], 'job/c\'s land, held by job/c-2');
  // A row that names its branch is read by it.
  const h2 = git(['rev-parse', 'HEAD'], { cwd: root });
  writeRows(root, SB, 'land', [[flowFile(9, 'land', 'c-701-y'), { row: 'land', layer: 9, module: 'c', pr: 701, branch: 'job/c-2', head: h2, before: 'b', merge: 'm2', at: '2026-11-07T01:00:00Z' }]]);
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(landedFrom(root, SB, 'c', 'job/c-2', 'job/c-2', []).map((p) => p.number), [701]);
});

// Every read of a branch's pull request history goes through landedFrom, so a land GitHub hides is
// still a land; one that does not is named with why.
test('every call of prsFromBranch (or a stand-in for it) goes through landedFrom, or is named with its reason', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const { dirname: dn } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const here = dn(fileURLToPath(import.meta.url));
  const lib = join(here, '..', 'lib');
  const NAMED = { 'layerflow.mjs:const prs = x.prsFromBranch(slug, branch);': 'a sync/<n> branch\'s PRs, opened by the tool: no land rows; an empty list only resumes the tool\'s own merge' };
  const files = [...readdirSync(lib).filter((x) => x.endsWith('.mjs') && x !== 'github.mjs').map((f) => [f, join(lib, f)]), ['p3.mjs', join(here, '..', 'p3.mjs')]];
  const loose = [];
  for (const [f, p] of files) {
    readFileSync(p, 'utf8').split('\n').forEach((l) => {
      // A call: prsFromBranch( or x.prsFromBranch( or a parameter standing for it (prs = prsFromBranch) called as prs(.
      if (!/\bprsFromBranch\(|\bprs\(/.test(l) || /^\s*\/\//.test(l) || /landedFrom\(/.test(l)) return;
      if (!NAMED[`${f}:${l.trim()}`]) loose.push(`${f}: ${l.trim()}`);
    });
  }
  assert.deepEqual(loose, []);
});

// ===== file: restart-speed.test.mjs =====

// Restart speed (coordinator, 5 Nov): the five defects that slowed the copy's restart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { commit, entry, makeRepo, onState } from './helpers.mjs';
import { readSessions, recordedStarts, sessionActs, sessionsBound, sessionsCount } from '../lib/status.mjs';
import { writeState } from '../lib/state.mjs';
import { jobStart } from '../lib/job.mjs';
import { startCheck } from '../lib/start.mjs';
import { DEEP_MARK, depth, fetchBranch, fetchJobRefs, git, lockNote, markedDeep } from '../lib/util.mjs';
import { briefText as reviewBrief } from '../lib/review.mjs';
import { briefText as triageBrief } from '../lib/triage.mjs';

const quiet = () => {};
const iso = (h) => new Date(Date.parse('2026-11-05T00:00:00Z') + h * 36e5).toISOString();
const startRow = (id, h, o = {}) => JSON.stringify({ at: iso(h), module: id, row: 'attempt', event: 'start', role: 'job', attempt: 1, ...o }) + '\n';

export function withOrigin(files = {}) {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche', coordinator: 'session_coord1' }, ...files });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return root;
}
// A job branch on origin cut from the tranche with these metrics lines; merged: the tranche takes it.
export function jobBranch(root, id, lines, { merged = false, name = `job/${id}` } = {}) {
  git(['checkout', '-q', '-B', name, 'tranche'], { cwd: root });
  commit(root, { [`process/metrics/${id}.jsonl`]: lines }, `start ${id}`);
  git(['push', '-q', 'origin', name], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  if (merged) { git(['merge', '-q', '--no-ff', '-m', `merge ${id}`, name], { cwd: root }); git(['push', '-q', 'origin', 'tranche'], { cwd: root }); }
  git(['fetch', '-q', 'origin'], { cwd: root });
}

test('item 1: one page of list_sessions stands when it holds every session the record knows; refused only when one could be missing', () => {
  const root = withOrigin({ 'process/ledger/a.json': entry('a'), 'process/ledger/b.json': entry('b'), 'process/ledger/c.json': entry('c') });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  jobBranch(root, 'b', startRow('b', 1), { merged: true }); // merged: its sessions are not the record's open ones
  jobBranch(root, 'a', startRow('a', 3));
  // A --restart's row is on the state branch; one before a's open run is not its.
  onState(root, { 'metrics/restart.jsonl': [JSON.stringify({ at: iso(5), module: 'a', row: 'restart', why: 'stopped' }), JSON.stringify({ at: iso(2), module: 'a', row: 'restart' }), JSON.stringify({ at: iso(6), module: 'b', row: 'restart' })].join('\n') + '\n' });
  assert.deepEqual(recordedStarts(root, { offline: true }), [{ id: 'a', first: iso(3), count: 2 }]);
  const dir = mkdtempSync(join(tmpdir(), 'p3-sessions-'));
  const file = join(dir, 's.json');
  const page = (data) => { writeFileSync(file, JSON.stringify({ ccr: { data, has_more: true, last_id: data.at(-1)?.id } })); return file; };
  const s = (id, title, h, st = 'SESSION_STATUS_IDLE') => ({ id, title, session_status: st, created_at: iso(h), updated_at: iso(h) });
  // No record: a page stands once it reaches past the first start of every job the state branch
  // records as possibly live (build/starter-fixes, coordinator 5 Nov: never every page back to 1 Aug).
  assert.equal(readSessions(page([s('s9', 'build/x', 9), s('s6', 'other', 2)]), { root, offline: true }).length, 2);
  // Newest first, reaching back to 05:06 only: a's first session (started 03:00) could be on the next page.
  const short = [s('s9', 'build/x', 9), s('s8', 'job a (restart)', 5.1)];
  assert.throws(() => readSessions(page(short), { root, offline: true }), /has_more\), and a recorded job session could be on them \(job a: 2 sessions started since 2026-11-05T03:00:00\.000Z\).*the last page reaches back no further than 2026-11-05T03:00:00\.000Z/);
  // Both of a's sessions listed: covered.
  assert.equal(readSessions(page([...short, s('s7', 'job a', 3.1, 'SESSION_STATUS_ARCHIVED')]), { root, offline: true }).length, 3);
  // An older record (the oldest job session live at a whole read, created 01:30): a page must reach past it.
  onState(root, { 'metrics/live-sessions.json': JSON.stringify({ oldest: iso(1.5), at: iso(8), live: 3 }) + '\n' });
  assert.throws(() => readSessions(page([s('s9', 'build/x', 9), s('s8', 'job a (restart)', 5.1), s('s7', 'job a', 3.1), s('s6', 'other', 2)]), { root, offline: true }), /a job session live at the last whole read \(created 2026-11-05T01:30:00\.000Z\) could be on them.*no further than 2026-11-05T01:30:00\.000Z/);
  onState(root, { 'metrics/live-sessions.json': JSON.stringify({ oldest: iso(5.1), at: iso(8), live: 1 }) + '\n' });
  // Reaching it stands: every session live then, and every one since, is on the page.
  assert.equal(readSessions(page(short), { root, offline: true }).length, 2);
  // A session with no creation time reaches back nowhere; and without the record, a page is refused as before.
  assert.throws(() => readSessions(page([...short, { id: 's5', title: 'x' }]), { root, offline: true }), /could be on them/);
  assert.throws(() => readSessions(page([...short, s('s6', 'other', 2)])), /list_sessions has more pages \(has_more\): call it with limit 100/);
  // A full list is read as it always was.
  writeFileSync(file, JSON.stringify({ data: short, has_more: false }));
  assert.equal(readSessions(file, { root, offline: true }).length, 2);
});

test('item 3: a role\'s start check re-anchors as job start does: a tranche merge between create_session and the check moves HEAD to the tip; changed approvals still fail', () => {
  const P3 = join(dirname(fileURLToPath(import.meta.url)), '..', 'p3.mjs');
  const APPROVALS = '## Standing approvals from Bob\n\nSessions may push.\n';
  const root = withOrigin({ 'CLAUDE.md': APPROVALS });
  git(['checkout', '-q', '--detach', 'tranche'], { cwd: root });
  const other = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', '-b', 'tranche', git(['remote', 'get-url', 'origin'], { cwd: root }), other], { cwd: tmpdir() });
  for (const [k, v] of [['user.email', 'o@example.com'], ['user.name', 'O'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: other });
  const move = (files) => { commit(other, files, 'a train merge'); git(['push', '-q', 'origin', 'tranche'], { cwd: other }); };
  const check = () => spawnSync(process.execPath, [P3, 'start', 'check'], { cwd: root, encoding: 'utf8' });
  move({ 'src/x.txt': 'merged while the role started' });
  const r = check();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /moved to the tip of tranche/);
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), git(['rev-parse', 'refs/remotes/origin/tranche'], { cwd: root }));
  // The approvals changed on the tip: never moved, the check fails.
  move({ 'CLAUDE.md': APPROVALS.replace('may push', 'may push anywhere') });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const changed = check();
  assert.equal(changed.status, 1);
  assert.match(changed.stdout, /DIFFERENT from the tip/);
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), head);
});

test('item 5: one git user per clone: BOB\'s rulebook and the review and triage briefs say it; a lock left in a clone is said plainly, stale or held', () => {
  const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  assert.match(readFileSync(join(repo, 'rulebooks', 'bob.md'), 'utf8'), /One git user per clone at a time: each review or triage worker clones its own, never your checkout/);
  const review = reviewBrief({ pr: { number: 1, title: 't', base: { ref: 'tranche' }, head: { ref: 'job/a', sha: 'f'.repeat(40) } }, files: [], job: null, owner: 'o', approvalsFile: 'CLAUDE.md' });
  assert.match(review, /Run git only in a clone of your own .*never in the checkout you were given: one git user per clone at a time/);
  const triage = triageBrief({ n: { key: 'k', provider: 'p', pr: 1 }, changed: { ids: [], file: 'f' }, mods: [], tranche: 'tranche', sha: 'a'.repeat(40) });
  assert.match(triage, /Read with git only in a clone of your own .*one git user per clone at a time/);
  // A real lock in a clone, git refusing on it.
  const root = makeRepo({ 'a.txt': 'a' });
  const lock = join(realpathSync(root), '.git', 'index.lock');
  writeFileSync(lock, '');
  writeFileSync(join(root, 'a.txt'), 'b');
  assert.throws(() => git(['add', 'a.txt'], { cwd: root }), (e) => e.message.includes(`No git process runs in this clone, so ${lock} is stale, left by a git command that was killed: remove it (rm '${lock}') and run this again (one git user per clone at a time`));
  const stderr = `fatal: Unable to create '${lock}': File exists.`;
  assert.match(lockNote(stderr, root, { procs: () => [realpathSync(root)] }), /1 other git process still runs in this clone and holds .*index\.lock .*run this again once it ends/);
  assert.match(lockNote(stderr, root, { procs: () => null }), /is held by another git command in this clone or left by a killed one/);
  assert.match(lockNote('fatal: shallow file has changed since we read it', root), /Another git command changed this clone's shallow file while this one ran/);
  assert.equal(lockNote('fatal: something else', root), '');
});

test('item 4: a reopened module whose pull request the train landed after the start\'s anchor is cut from the tip holding that merge, in a full and a shallow clone; no hand choice', () => {
  const APPROVALS = '# P\n\n## Standing approvals from Bob\n\nSessions may push.\n';
  for (const shallow of [false, true]) {
    const full = makeRepo({ 'CLAUDE.md': APPROVALS, 'process/ledger/a.json': entry('a', { requirements: 'r/a.md' }), 'r/a.md': '- **R1** *(not yet met: x)* a\n' });
    git(['branch', 'tranche'], { cwd: full });
    const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
    git(['init', '-q', '--bare', bare], { cwd: full });
    git(['remote', 'add', 'origin', bare], { cwd: full });
    git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: full });
    // The train's clone: a's first attempt merged, then a second one on job/a, its PR green.
    const other = full;
    git(['checkout', '-q', '-b', 'job/a', 'tranche'], { cwd: other });
    commit(other, { 'process/ledger/a.json': entry('a', { requirements: 'r/a.md', status: { state: 'COMPLETE' } }), 'process/metrics/a.jsonl': startRow('a', 1) }, 'attempt 1');
    git(['checkout', '-q', 'tranche'], { cwd: other });
    git(['merge', '-q', '--no-ff', '-m', 'merge a 1', 'job/a'], { cwd: other });
    git(['checkout', '-q', 'job/a'], { cwd: other });
    git(['merge', '-q', '--no-ff', '-m', 'Bring job/a up to tranche', 'tranche'], { cwd: other });
    commit(other, { 'src/a/x.mjs': 'attempt 2' }, 'attempt 2 and the train\'s merged result');
    git(['push', '-q', 'origin', 'tranche', 'job/a'], { cwd: other });
    git(['checkout', '-q', 'tranche'], { cwd: other });
    // BOB's clone at the tranche tip, before the land.
    const bob = join(mkdtempSync(join(tmpdir(), 'p3-bob-')), 'c');
    git(['clone', '-q', ...(shallow ? ['--depth', '1'] : []), '-b', 'tranche', `file://${bare}`, bob], { cwd: tmpdir() });
    for (const [k, v] of [['user.email', 'b@example.com'], ['user.name', 'B'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: bob });
    git(['checkout', '-q', '--detach'], { cwd: bob });
    // GitHub's compare, read now from origin: base a name (its tip now) or a sha.
    const compare = (slug, b, h) => {
      git(['fetch', '-q', 'origin'], { cwd: other });
      const ref = (x) => (/^[0-9a-f]{40}$/.test(x) ? x : `origin/${x}`);
      return { ahead_by: Number(git(['rev-list', '--count', `${ref(b)}..${ref(h)}`], { cwd: other })) };
    };
    // The train lands a's second attempt right after this start's anchor (inside its setup check).
    let landed = false;
    const setup = (r, o) => {
      const c = startCheck(r, { branch: 'tranche', anchor: o.anchor, log: quiet });
      if (!landed) { landed = true; git(['merge', '-q', '--no-ff', '-m', 'merge a 2 (the train)', 'job/a'], { cwd: other }); git(['push', '-q', 'origin', 'tranche'], { cwd: other }); }
      return c.ok ? { ok: true, missing: [], results: [{ id: 'session-branch', state: 'set' }] } : { ok: false, missing: ['session-branch'], results: [] };
    };
    const out = [];
    let r;
    try { r = jobStart(bob, 'a', { coordinator: 'session_bob', reopen: 'answer the provider notice', setup, compare, find: () => null, prs: () => [], open: () => ({ number: 9, html_url: 'u' }), log: (l) => out.push(l) }); } catch (e) { throw new Error(`${shallow ? 'shallow' : 'full'}: ${e.message}\n${git(['log', '--oneline', '--graph', '-8', 'HEAD', 'origin/job/a', 'origin/tranche'], { cwd: bob })}\n${git(['log', '--oneline', '--graph', '-8', 'job/a', 'tranche'], { cwd: other })}`); }
    assert.ok(r.launch, shallow ? 'shallow' : 'full');
    const tip = git(['rev-parse', 'origin/tranche'], { cwd: other });
    git(['fetch', '-q', 'origin'], { cwd: other });
    assert.equal(git(['rev-parse', 'origin/job/a^'], { cwd: other }), tip, 'cut from the tip holding the land, pushed as a fast-forward');
    assert.ok(out.some((l) => /job\/a merged into tranche after this start's anchor [0-9a-f]{10}: anchoring again at the tip/.test(l)), out.join('\n'));
  }
});

test('item 4: a branch tip truly not in the tranche after a full read is refused plainly, its sha and the way on named, nothing pushed', () => {
  const APPROVALS = '# P\n\n## Standing approvals from Bob\n\nSessions may push.\n';
  for (const shallow of [false, true]) {
    const full = makeRepo({ 'CLAUDE.md': APPROVALS, 'process/ledger/a.json': entry('a', { requirements: 'r/a.md' }), 'r/a.md': '- **R1** *(not yet met: x)* a\n' });
    git(['branch', 'tranche'], { cwd: full });
    const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
    git(['init', '-q', '--bare', bare], { cwd: full });
    git(['remote', 'add', 'origin', bare], { cwd: full });
    git(['checkout', '-q', '-b', 'job/a', 'tranche'], { cwd: full });
    commit(full, { 'process/ledger/a.json': entry('a', { requirements: 'r/a.md', status: { state: 'COMPLETE' } }), 'process/metrics/a.jsonl': startRow('a', 1) }, 'attempt 1');
    git(['checkout', '-q', 'tranche'], { cwd: full });
    git(['merge', '-q', '--no-ff', '-m', 'merge a 1', 'job/a'], { cwd: full });
    // A commit on job/a the tranche never took, which a count read wrong took for merged.
    git(['checkout', '-q', 'job/a'], { cwd: full });
    commit(full, { 'src/a/x.mjs': 'off the tranche' }, 'never landed');
    git(['checkout', '-q', 'tranche'], { cwd: full });
    git(['push', '-q', 'origin', 'main', 'tranche', 'job/a'], { cwd: full });
    const stray = git(['rev-parse', 'job/a'], { cwd: full });
    const bob = join(mkdtempSync(join(tmpdir(), 'p3-bob-')), 'c');
    git(['clone', '-q', ...(shallow ? ['--depth', '1'] : []), '-b', 'tranche', `file://${bare}`, bob], { cwd: tmpdir() });
    for (const [k, v] of [['user.email', 'b@example.com'], ['user.name', 'B'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: bob });
    git(['checkout', '-q', '--detach'], { cwd: bob });
    const setup = (r, o) => { const c = startCheck(r, { branch: 'tranche', anchor: o.anchor, log: quiet }); return c.ok ? { ok: true, missing: [], results: [{ id: 'session-branch', state: 'set' }] } : { ok: false, missing: ['session-branch'], results: [] }; };
    // GitHub's count read as merged (ahead 0): only the push's own read stands between it and a
    // non-fast-forward. A full clone counts locally, sees the stray commit, and cuts a fresh branch.
    let msg = null;
    try { jobStart(bob, 'a', { coordinator: 'session_bob', reopen: 'answer the notice', setup, compare: () => ({ ahead_by: 0 }), find: () => null, prs: () => [], open: () => ({ number: 9, html_url: 'u' }), log: quiet }); } catch (e) { msg = e.message; }
    if (shallow) assert.match(msg || '', new RegExp(`origin's job/a at ${stray.slice(0, 10)} is not in tranche at [0-9a-f]{10}, the tip this start is cut from, after a full read: pushing would not be a fast-forward, so nothing was pushed\\. Its commits are kept there; start on a fresh branch: job start a --sessions <file> --fresh-branch "job/a at ${stray.slice(0, 10)} is not in tranche", adding --reopen`));
    else assert.equal(msg, null);
    assert.equal(git(['ls-remote', bare, 'refs/heads/job/a'], { cwd: full }).split('\t')[0], stray, 'origin\'s job/a is as it was');
  }
});


// Kept by every job without exception: the job's handover note ends with this exact last line:
// `-- filed under nettlecombe`.

test('item 1: a read that stands records its newest session and its live job sessions; a later page need reach back only to that newest, the older live ones carried and counted (build/starter-fixes)', () => {
  const root = withOrigin({ 'process/ledger/a.json': entry('a') });
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 's.json');
  const s = (id, title, h, st = 'SESSION_STATUS_IDLE') => ({ id, title, session_status: st, created_at: iso(h), updated_at: iso(h) });
  const stored = () => { git(['fetch', '-q', 'origin', '+refs/heads/process-state:refs/remotes/origin/process-state'], { cwd: root }); return JSON.parse(git(['show', 'refs/remotes/origin/process-state:metrics/live-sessions.json'], { cwd: root })); };
  writeFileSync(file, JSON.stringify({ data: [s('s3', 'job x', 6), s('s2', 'job other-product', 2), s('s1', 'job old', 1, 'SESSION_STATUS_ARCHIVED')], has_more: false }));
  readSessions(file, { root });
  let r = stored();
  assert.deepEqual([r.oldest, r.newest, r.live, r.sessions.map((x) => x.id)], [iso(2), iso(6), 2, ['s2', 's3']], 'the unarchived job sessions, another product\'s included, and the newest session read');
  assert.ok(r.seen);
  // A page reaching back to that newest session (06:00) stands; s2 (02:00), older than the page, is carried and counted.
  writeFileSync(file, JSON.stringify({ data: [s('s5', 'build/z', 8), s('s4', 'job y', 7), s('s3', 'job x', 6)], has_more: true }));
  const got = readSessions(file, { root });
  assert.deepEqual(got.map((x) => [x.id, !!x.carried]), [['s5', false], ['s4', false], ['s3', false], ['s2', true]]);
  assert.equal(sessionsCount(got, undefined, () => {}), 3, 'the carried session holds its slot');
  r = stored();
  assert.deepEqual([r.newest, r.sessions.map((x) => x.id), r.oldest], [iso(8), ['s2', 's3', 's4'], iso(2)]);
  // One stopping short of the newest session read is refused, naming how far back to page.
  writeFileSync(file, JSON.stringify({ data: [s('s6', 'job w', 9)], has_more: true }));
  assert.throws(() => readSessions(file, { root }), /a session made since the last read that held every live job session \(its newest created 2026-11-05T08:00:00\.000Z\) could be on them: .*no further than 2026-11-05T08:00:00\.000Z/);
  writeFileSync(file, JSON.stringify({ data: [s('s6', 'job w', 9), s('s5', 'build/z', 8)], has_more: true }));
  assert.deepEqual(readSessions(file, { root }).map((x) => x.id), ['s6', 's5', 's2', 's3', 's4']);
  // A page that shows a recorded session archived takes the page's word; not newest first: no bound.
  writeFileSync(file, JSON.stringify({ data: [s('s6', 'job w', 9), s('s5', 'build/z', 8), s('s4', 'job y', 7, 'SESSION_STATUS_ARCHIVED')], has_more: true }));
  assert.equal(sessionsCount(readSessions(file, { root }), undefined, () => {}), 3, 's6 and the carried s2 and s3');
  assert.deepEqual(stored().sessions.map((x) => x.id), ['s2', 's3', 's6']);
  writeFileSync(file, JSON.stringify({ data: [s('s4', 'job y', 7, 'SESSION_STATUS_ARCHIVED'), s('s6', 'job w', 9)], has_more: true }));
  assert.throws(() => readSessions(file, { root }), /this page is not newest first by created_at/);
  // A whole read sees every one: none carried, and s2 archived since stops counting.
  writeFileSync(file, JSON.stringify({ data: [s('s6', 'job w', 9), s('s5', 'build/z', 8), s('s4', 'job y', 7), s('s3', 'job x', 6), s('s2', 'job other-product', 2, 'SESSION_STATUS_ARCHIVED')], has_more: false }));
  assert.equal(sessionsCount(readSessions(file, { root }), undefined, () => {}), 3);
  assert.deepEqual(stored().sessions.map((x) => x.id), ['s3', 's4', 's6']);
});

test('item 1: the bound the starter asks for: the record\'s newest session; the oldest carried one once unseen for an hour; the first open start with no record', () => {
  const root = withOrigin({ 'process/ledger/a.json': entry('a') });
  jobBranch(root, 'a', startRow('a', 3));
  const t = Date.parse(iso(10));
  assert.deepEqual(sessionsBound(root, { offline: true, t }), { until: iso(3), why: 'the first start of the oldest open job' });
  onState(root, { 'metrics/live-sessions.json': JSON.stringify({ oldest: iso(5) }) + '\n' });
  assert.equal(sessionsBound(root, { offline: true, t }).until, iso(5));
  const rec = (seen, o = { whole: true }) => onState(root, { 'metrics/live-sessions.json': JSON.stringify({ oldest: iso(2), newest: iso(9), live: 2, sessions: [{ id: 's2', title: 'job b', created_at: iso(2) }, { id: 's8', title: 'job a', created_at: iso(8) }], seen, ...o }) + '\n' });
  rec(iso(9.5));
  assert.deepEqual(sessionsBound(root, { offline: true, t }), { until: iso(9), why: 'the newest session of the last read' });
  rec(iso(8.5));
  assert.equal(sessionsBound(root, { offline: true, t }).until, iso(2), 'carried sessions unseen for an hour: page back to the oldest');
  // A record begun with no read of every page (pages bounded by the recorded starts): every page, an hour on.
  rec(iso(9.5), { whole: false, partial_since: iso(9.5) });
  assert.equal(sessionsBound(root, { offline: true, t }).until, iso(9));
  rec(iso(9.5), { whole: false, partial_since: iso(8.9) });
  assert.deepEqual(sessionsBound(root, { offline: true, t }), { until: null, all: true, why: 'no read of every page on record: one, an hour after the first bounded one' });
});

test('item 1 (review): a record begun from bounded pages is not whole; a session the page reaches past and does not show is dropped; a quiet read writes nothing; a carried session is counted, never acted on', () => {
  const root = withOrigin({ 'process/ledger/a.json': entry('a'), 'process/ledger/m.json': entry('m') });
  jobBranch(root, 'a', startRow('a', 3));
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sessions-')), 's.json');
  const s = (id, title, h, st = 'SESSION_STATUS_IDLE') => ({ id, title, session_status: st, created_at: iso(h), updated_at: iso(h) });
  const stored = () => { git(['fetch', '-q', 'origin', '+refs/heads/process-state:refs/remotes/origin/process-state'], { cwd: root }); return JSON.parse(git(['show', 'refs/remotes/origin/process-state:metrics/live-sessions.json'], { cwd: root })); };
  const commits = () => Number(git(['rev-list', '--count', 'refs/remotes/origin/process-state'], { cwd: root }));
  // No record: pages reaching past a's start (03:00) stand, recorded as not whole.
  writeFileSync(file, JSON.stringify({ data: [s('s9', 'job a', 9), s('s4', 'job m', 4), s('s2', 'other', 2)], has_more: true }));
  readSessions(file, { root });
  let r = stored();
  assert.deepEqual([r.whole, typeof r.partial_since, r.sessions.map((x) => x.id)], [false, 'string', ['s4', 's9']]);
  // The same list again: nothing written (seen is moved on only once half stale).
  const n = commits();
  readSessions(file, { root });
  assert.equal(commits(), n, 'a quiet read writes nothing');
  // A page back to 05:00 only: s4 (04:00) is carried; a recorded session newer than the page's end and not on it is gone.
  writeState(root, 'process-state', 'a phantom', (d) => { const x = JSON.parse(readFileSync(join(d, 'metrics/live-sessions.json'), 'utf8')); x.sessions.push({ id: 's6', title: 'job z', session_status: 'SESSION_STATUS_IDLE', created_at: iso(6) }); writeFileSync(join(d, 'metrics/live-sessions.json'), JSON.stringify(x) + '\n'); });
  writeFileSync(file, JSON.stringify({ data: [s('s10', 'build/q', 10), s('s9', 'job a', 9), s('s5', 'build/p', 5)], has_more: true }));
  const got = readSessions(file, { root });
  assert.deepEqual(got.map((x) => [x.id, !!x.carried]), [['s10', false], ['s9', false], ['s5', false], ['s4', true]]);
  r = stored();
  assert.deepEqual([r.whole, r.sessions.map((x) => x.id), r.seen], [false, ['s4', 's9'], r.seen]);
  // Every page read: whole.
  writeFileSync(file, JSON.stringify({ data: [s('s10', 'build/q', 10), s('s9', 'job a', 9), s('s4', 'job m', 4)], has_more: false }));
  readSessions(file, { root });
  r = stored();
  assert.deepEqual([r.whole, 'partial_since' in r], [true, false]);
  // m merged, its idle session carried: counted against the cap, never archived on a past read's word.
  const listed = [s('s9', 'job a', 9), { ...s('s4', 'job m', 4), carried: true }];
  assert.equal(sessionsCount(listed, undefined, () => {}), 2);
  assert.deepEqual(sessionActs([{ ...s('s4', 'job m', 1), carried: true }], { rows: [{ id: 'm', tranche: 'COMPLETE', branch: 'COMPLETE', pr: 'merged' }], now: Date.parse(iso(10)) }).acts, []);
});

test('train clone (review): marked deep, a --depth 1 fetch takes no depth and cuts nothing; a job head past main only, one main holds alone at its tip, and never a depth after any other failure', () => {
  const src = makeRepo({ 'README.md': 'x' });
  for (let i = 0; i < 5; i += 1) commit(src, { [`m${i}.txt`]: String(i) });
  git(['branch', 'job/old', 'HEAD~2'], { cwd: src });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: src });
  for (let i = 0; i < 6; i += 1) commit(src, { [`t${i}.txt`]: String(i) });
  git(['checkout', '-q', '-b', 'job/new'], { cwd: src });
  commit(src, { 'n.txt': 'n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['clone', '-q', '--bare', src, bare], { cwd: tmpdir() });
  const thin = join(mkdtempSync(join(tmpdir(), 'p3-thin-')), 'c');
  git(['clone', '-q', '--depth', '1', '-b', 'main', `file://${bare}`, thin], { cwd: tmpdir() });
  git(['fetch', '-q', '--shallow-exclude=main', 'origin', '+refs/heads/tranche:refs/remotes/origin/tranche'], { cwd: thin });
  const past = () => Number(git(['rev-list', '--count', 'origin/tranche'], { cwd: thin }));
  assert.equal(past(), 6);
  assert.deepEqual(depth(thin), ['--depth', '1']);
  git(['config', DEEP_MARK, 'true'], { cwd: thin });
  assert.ok(markedDeep(thin));
  assert.deepEqual(depth(thin), []);
  fetchBranch(thin, 'tranche');
  assert.equal(past(), 6, 'the history past main stands');
  const trace = join(mkdtempSync(join(tmpdir(), 'p3-trace-')), 't.log');
  process.env.GIT_TRACE = trace;
  let ok;
  try {
    ok = [fetchJobRefs(thin, ['job/new']), fetchJobRefs(thin, ['job/old']), fetchJobRefs(thin, ['job/none'])];
  } finally { delete process.env.GIT_TRACE; }
  assert.deepEqual(ok, [true, true, false]);
  const fetches = readFileSync(trace, 'utf8').split('\n').filter((l) => /built-in: git fetch/.test(l)).map((l) => l.replace(/^.*built-in: /, ''));
  // job/new past main; job/old, main's alone (no commit selected), at its tip; job/none unknown: refused, never a depth.
  assert.deepEqual(fetches.map((l) => l.split(' origin ')[0]), ['git fetch -q --shallow-exclude=main', 'git fetch -q --shallow-exclude=main', 'git fetch -q --depth=1', 'git fetch -q --shallow-exclude=main'], fetches.join('\n'));
  assert.ok(/job\/old/.test(fetches[2]));
  assert.equal(git(['rev-list', '--count', 'origin/job/old'], { cwd: thin }), '1');
  assert.equal(past(), 6);
  assert.equal(git(['merge-base', 'origin/tranche', 'origin/job/new'], { cwd: thin }), git(['rev-parse', 'tranche'], { cwd: src }));
});

// ===== file: ghhook.test.mjs =====

// p3 github hook (R17c; Bob, 6 Nov: all GitHub traffic monitored and limited, enforced, not by rule):
// the PreToolUse hook counts every connector call against the budget and refuses raw pushes, gh and
// curl to GitHub; exit 2 blocks the call.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { bashVerdict, hookDecision, hookRun } from '../lib/ghhook.mjs';
import { kickRefresh, LEDGER_CACHE, peekShare, refreshDone, remoteStore, stateShare } from '../lib/ghshare.mjs';
import { git } from '../lib/util.mjs';
import { commonDir, PACING_DEFAULTS, useShared } from '../lib/pace.mjs';
import { makeRepo } from './helpers.mjs';

const P = { ...PACING_DEFAULTS, gh_interval_ms: 0 };
const P3 = join(dirname(fileURLToPath(import.meta.url)), '..', 'p3.mjs');
const HOOK = join(dirname(fileURLToPath(import.meta.url)), '..', 'hook.mjs');
function logTo(t) {
  const f = join(mkdtempSync(join(tmpdir(), 'p3-hook-')), 'log.jsonl');
  writeFileSync(f, '');
  const was = process.env.P3_GITHUB_LOG;
  process.env.P3_GITHUB_LOG = f;
  t.after(() => { useShared(null); if (was === undefined) delete process.env.P3_GITHUB_LOG; else process.env.P3_GITHUB_LOG = was; });
  return () => readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

test('a connector read passes and is counted; a write is a content-creating request; one that moves a ref is also a push', (t) => {
  const rows = logTo(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  useShared(null);
  assert.deepEqual(hookDecision({ tool_name: 'mcp__github__pull_request_read', tool_input: { owner: 'NeoBobKrause', repo: 'process3', pullNumber: 1 } }, root, { p: P }), { ok: true, counted: 'read' });
  assert.deepEqual(hookDecision({ tool_name: 'mcp__github__add_issue_comment', tool_input: { owner: 'neobobkrause', repo: 'process3' } }, root, { p: P }), { ok: true, counted: 'write' });
  hookDecision({ tool_name: 'mcp__github__merge_pull_request', tool_input: { owner: 'neobobkrause', repo: 'process3' } }, root, { p: P });
  assert.deepEqual(rows().map((r) => [r.kind, r.points ?? null, r.content ?? null, r.connector, r.repo]), [
    ['gh', 1, null, true, 'neobobkrause/process3'],
    ['gh', 5, 1, true, 'neobobkrause/process3'],
    ['gh', 5, 1, true, 'neobobkrause/process3'],
    ['push', null, null, true, 'neobobkrause/process3'],
  ]);
  for (const op of ['create_pull_request', 'update_pull_request', 'pull_request_review_write', 'add_comment_to_pending_review', 'add_reply_to_pull_request_comment', 'create_branch', 'issue_write', 'update_pull_request_branch']) {
    assert.equal(hookDecision({ tool_name: `mcp__github__${op}`, tool_input: {} }, root, { p: P }).counted, 'write', op);
  }
  for (const op of ['list_pull_requests', 'get_file_contents', 'pull_request_read', 'actions_list', 'get_job_logs']) assert.equal(hookDecision({ tool_name: `mcp__github__${op}`, tool_input: {} }, root, { p: P }).counted, 'read', op);
});

test('a paused or stopped account refuses the connector call (the hook exits 2); other tools pass', (t) => {
  logTo(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  useShared({ read: () => ({ pause: { at: '2026-11-06T23:00:00Z', until: '2099-01-01T00:00:00Z', why: 'secondary rate limit' }, use: [] }), pause: () => null });
  const d = hookDecision({ tool_name: 'mcp__github__add_issue_comment', tool_input: {} }, root, { p: P });
  assert.match(d.block, /^GitHub budget: GitHub rate-limited this account \(secondary rate limit\)/);
  useShared({ read: () => ({ pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'x', stopped: true }, use: [] }), pause: () => null });
  assert.match(hookDecision({ tool_name: 'mcp__github__pull_request_read', tool_input: {} }, root, { p: P }).block, /every GitHub call is stopped/);
  assert.deepEqual(hookDecision({ tool_name: 'Read', tool_input: { file_path: '/x' } }, root, { p: P }), { ok: true });
});

test('Bash: a raw git push, gh, or curl to GitHub is refused; the tool\'s own commands pass', () => {
  for (const c of ['git push origin job/x', 'git -c user.name=x push -u origin b', 'cd /x && git push', 'FOO=1 git push origin HEAD', 'gh pr create --title x', 'gh api repos/o/r', 'echo $(gh api user)', 'curl -s https://api.github.com/repos/o/r', 'wget https://github.com/o/r/archive/x.zip']) assert.ok(bashVerdict(c), c);
  for (const c of ['node .process/tool/p3.mjs github push origin job/x', 'node tool/p3.mjs github push origin build/x --set-upstream', 'cd /home/user/process3 && node tool/p3.mjs job sync alpha', 'git status', 'git fetch origin tranche', 'git commit -m "push the gh button"', 'npm test', 'curl -s https://registry.npmjs.org/x', 'node --test tool/test/*.test.mjs']) assert.equal(bashVerdict(c), null, c);
  // The refusal names the tool's path in this clone (R17d): process3's own, or a product's pinned one.
  assert.match(bashVerdict('git push origin x'), /`node tool\/p3\.mjs github push <remote> <refspec>`/);
  assert.match(bashVerdict('git push origin x', 0, 'node .process/tool/p3.mjs'), /`node \.process\/tool\/p3\.mjs github push <remote> <refspec>`/);
  assert.doesNotMatch(bashVerdict('git push origin x'), /\.process/);
  // Read as the shell reads it (cold review of R17c): no way around it, and no false block.
  for (const c of ['(git push)', '(cd x && git push)', '/usr/bin/git push', '\\git push', '"git" push', 'bash -c "git push"', "sh -c 'git push origin x'", 'xargs git push', 'time git push', 'nohup git push', 'timeout 60 git push', 'env -i git push', '! git push', 'if true; then git push; fi', 'for x in a; do git push; done', 'sleep 1 & git push', 'git --git-dir x push', 'echo $(git push)', 'echo `git push`', 'git -c alias.p=push p', '/usr/bin/gh api x', 'node tool/p3.mjs x $(gh api y)', 'git -C dir push', 'eval git push']) assert.ok(bashVerdict(c), c);
  for (const c of ['git commit -m "note; git push later"', 'git commit -F - <<EOF\ngh pr create\ngit push\nEOF', 'echo hi # ; git push', 'git push --dry-run origin x', 'git log --grep push']) assert.equal(bashVerdict(c), null, c);
});

test('the hook never waits past its cap: longer, it refuses and says to retry the tool call', (t) => {
  logTo(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  useShared({ read: () => ({ pause: { at: new Date().toISOString(), until: new Date(Date.now() + 300e3).toISOString(), why: 'secondary rate limit' }, use: [] }), pause: () => null });
  const d = hookDecision({ tool_name: 'mcp__github__pull_request_read', tool_input: {} }, root, { p: P, sleep: () => assert.fail('no sleep past the cap') });
  assert.match(d.block, /acts on GitHub wait until .*then retry the tool call \(retry it\)/);
});

test('the hook command: exit 0 to allow, exit 2 with the reason on stderr to block', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const hook = (input) => spawnSync(process.execPath, [P3, 'github', 'hook'], { cwd: root, input: JSON.stringify(input), encoding: 'utf8', env: { ...process.env, P3_GITHUB_LOG: '0' } });
  const ok = hook({ tool_name: 'Bash', tool_input: { command: 'node tool/p3.mjs status' } });
  assert.equal(ok.status, 0, ok.stderr);
  const no = hook({ tool_name: 'Bash', tool_input: { command: 'git push origin main' } });
  assert.equal(no.status, 2);
  assert.match(no.stderr, /GitHub pacing \(P27\): a raw git push goes around GitHub pacing/);
  const read = hook({ tool_name: 'mcp__github__pull_request_read', tool_input: {} });
  assert.equal(read.status, 0, read.stderr);
  const none = spawnSync(process.execPath, [P3, 'github', 'hook'], { cwd: root, input: '', encoding: 'utf8' });
  assert.equal(none.status, 2);
  // The hook's own entry (R17d), which the settings call: the same answers.
  const entry = (input) => spawnSync(process.execPath, [HOOK], { cwd: root, input: input === '' ? '' : JSON.stringify(input), encoding: 'utf8', env: { ...process.env, P3_GITHUB_LOG: '0' } });
  assert.equal(entry({ tool_name: 'Bash', tool_input: { command: 'node tool/p3.mjs status' } }).status, 0);
  const no2 = entry({ tool_name: 'Bash', tool_input: { command: 'gh pr list' } });
  assert.equal(no2.status, 2);
  assert.match(no2.stderr, /GitHub pacing \(P27\): a raw gh command/);
  assert.equal(entry({ tool_name: 'mcp__github__pull_request_read', tool_input: {} }).status, 0);
  assert.equal(entry('').status, 2);
});

// The read path (R17d; coordinator: under 300 ms p95, no ledger fetch on a read, the pause and stop
// cached and refreshed by ls-remote, fetched only when the ledger moved).
const cacheAt = (root, c) => writeFileSync(join(commonDir(root), LEDGER_CACHE), JSON.stringify(c));
test('a connector read uses the cached pause and stop, any age, and never fetches; a stale or missing cache starts one background refresh', (t) => {
  logTo(t);
  const root = makeRepo({ 'README.md': 'x\n' });
  const kicks = [];
  const kick = () => kicks.push(1);
  const errs = [];
  const run = (op) => hookRun({ tool_name: `mcp__github__${op}`, tool_input: {} }, root, { kick, err: (m) => errs.push(m), opts: { sleep: () => assert.fail('a read never waits on the floor') } });
  // No cache: the read passes at once, and a refresh is started.
  assert.equal(run('pull_request_read'), 0);
  assert.equal(kicks.length, 1);
  // A fresh cache: nothing started; its stop refuses the read (a stop is cached too).
  cacheAt(root, { at: Date.now(), pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'secondary rate limit', stopped: true }, use: [], ledger: null, tip: 'a' });
  assert.equal(run('list_pull_requests'), 2);
  assert.match(errs.pop(), /every GitHub call is stopped/);
  assert.equal(kicks.length, 1);
  // A stale cache still answers (here a pause past its wait cap: refused), and starts a refresh.
  cacheAt(root, { at: Date.now() - 600e3, pause: { at: new Date().toISOString(), until: new Date(Date.now() + 600e3).toISOString(), why: 'secondary rate limit' }, use: [], ledger: null, tip: 'a' });
  assert.equal(run('get_file_contents'), 2);
  assert.match(errs.pop(), /GitHub rate-limited this account/);
  assert.equal(kicks.length, 2);
  // Never a fetch on the read path: peekShare reads only the cache.
  assert.deepEqual(peekShare(root, { kick: () => {} }).read().pause.why, 'secondary rate limit');
  // A write reads the ledger through its share (the share given): its stop refuses though the cache has none.
  cacheAt(root, { at: Date.now(), pause: null, use: [], ledger: null, tip: 'a' });
  let reads = 0;
  assert.equal(hookRun({ tool_name: 'mcp__github__add_issue_comment', tool_input: {} }, root, { kick, err: (m) => errs.push(m), share: { read: () => { reads++; return { pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'x', stopped: true }, use: [] }; }, pause: () => null } }), 2);
  assert.ok(reads >= 1, 'the write read the ledger');
  assert.equal(kicks.length, 2);
});

test('the background refresh: the ledger unmoved, the cache is renewed without a fetch; moved, it is fetched and read again', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const ledger = join(mkdtempSync(join(tmpdir(), 'p3-ledger-')), 'l.git');
  git(['init', '-q', '--bare', ledger], { cwd: root });
  const put = (pause) => {
    const w = makeRepo({ 'github/pause.json': JSON.stringify(pause) });
    git(['push', '-q', '-f', ledger, 'HEAD:refs/heads/process-state'], { cwd: w });
  };
  put({ at: '2026-11-07T00:00:00Z', until: '2026-11-07T00:01:00Z', why: 'first' });
  let t = Date.parse('2026-11-07T00:00:00Z');
  const sh = stateShare(root, null, { url: ledger, now: () => t });
  assert.equal(sh.refresh(), 'fetched');
  const c1 = JSON.parse(readFileSync(join(commonDir(root), LEDGER_CACHE), 'utf8'));
  assert.equal(c1.pause.why, 'first');
  assert.equal(c1.tip, git(['ls-remote', ledger, 'refs/heads/process-state'], { cwd: root }).split('\t')[0]);
  t += 60e3;
  const fetches = git(['rev-parse', 'refs/p3/ledger/state'], { cwd: root });
  assert.equal(sh.refresh(), 'unmoved');
  assert.equal(JSON.parse(readFileSync(join(commonDir(root), LEDGER_CACHE), 'utf8')).at, t, 'renewed');
  assert.equal(git(['rev-parse', 'refs/p3/ledger/state'], { cwd: root }), fetches);
  put({ at: '2026-11-07T00:00:30Z', until: '2026-11-07T00:02:00Z', why: 'second', stopped: true });
  assert.equal(sh.refresh(), 'fetched');
  const c3 = JSON.parse(readFileSync(join(commonDir(root), LEDGER_CACHE), 'utf8'));
  assert.equal(c3.pause.why, 'second');
  assert.equal(c3.pause.stopped, true);
  assert.equal(remoteStore(root, ledger).tip(), c3.tip);
});

test('one background refresh at a time per clone; a marker a minute old (a refresh killed) is taken over', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const entry = join(mkdtempSync(join(tmpdir(), 'p3-noop-')), 'noop.mjs');
  writeFileSync(entry, '');
  let t = 1e12;
  assert.equal(kickRefresh(root, { now: () => t, entry }), true);
  assert.equal(kickRefresh(root, { now: () => t + 5e3, entry }), false);
  t += 61e3;
  assert.equal(kickRefresh(root, { now: () => t, entry }), true);
  // The refresh taken over clears no successor's marker; its own it clears.
  refreshDone(root, String(t - 61e3));
  assert.equal(kickRefresh(root, { now: () => t + 1e3, entry }), false);
  refreshDone(root, String(t));
  assert.equal(kickRefresh(root, { now: () => t + 1e3, entry }), true);
  refreshDone(root);
});

test('the read path takes no cache of another ledger (a config changed); the background refresh, run as the hook runs it, fills this ledger\'s cache', () => {
  const ledger = join(mkdtempSync(join(tmpdir(), 'p3-ledger-')), 'l.git');
  const URL = 'https://github.com/o/ledger.git';
  const seed = makeRepo({ 'github/pause.json': JSON.stringify({ at: '2026-11-07T00:00:00Z', until: '2099-01-01T00:00:00Z', why: 'from the ledger' }) });
