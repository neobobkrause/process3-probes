  assert.deepEqual([nb.merged, nb.wake, nb.what], [true, null, null]);
  assert.doesNotMatch(nbLogs.join('\n'), /wake BOB/);
  assert.equal(nbLogs.filter((l) => /^no BOB is addressed on process-state \(addresses\/bob\.json\): no wake to send \(a BOB started later reads the pin at its start\)$/.test(l)).length, 1);
  git(['fetch', '-q', 'origin', '+refs/heads/process-state:refs/remotes/origin/process-state'], { cwd: nobob.root });
  assert.equal(git(['cat-file', '-e', `refs/remotes/origin/process-state:${WAKES_FILE}`], { cwd: nobob.root, allowFail: true }).code !== 0, true, 'no wake recorded');
  const bob = pinMove(p.pin, shim);
  put(bob.root, { [addressFile('bob')]: '{"session":"session_x"}\n' });
  const bLogs = [];
  mergePlain(bob.root, 4, { ...q, noReview: 'a pin move', as: 'pin', io: plainIO(bob, { repo: processRepo(p.dir) }).io, log: (m) => bLogs.push(m) });
  assert.match(bLogs.at(-1), /^next act: wake BOB with `.*send bob "pin moved to/);
  // The state branch unread (none on origin, as in the first case above): addressed for all it
  // knows, so the wake is printed (loud).
  // Not the shim byte for byte, or a pin that is not on process3's tranche or main: refused.
  const off = pinMove(p.pin, shim + ' ');
  assert.throws(() => mergePlain(off.root, 4, { ...q, noReview: 'x', io: plainIO(off, { repo: processRepo(p.dir) }).io }), /is not the process's own shim at/);
  const side = pinMove(p.unreleased, shim + '# side\n');
  assert.throws(() => mergePlain(side.root, 4, { ...q, noReview: 'x', io: plainIO(side, { repo: processRepo(p.dir) }).io }), /is not a commit on process3's tranche or main/);
});

test('the head moving between the two reads refuses', () => {
  const r = plainRepo();
  const f = plainIO(r, { after: (p) => ({ ...p, head: { ...p.head, sha: 'e'.repeat(40) } }) });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /bob\/pin moved to e{10} while its checks on \w+ were awaited; run merge again/);
  assert.equal(f.calls.merged, null);
});

test('a rename lists the path it removes: out of a module, or into a job\'s own', () => {
  const r = plainRepo({ files: { 'pin.txt': 'moved' } });
  git(['checkout', '-q', 'tranche'], { cwd: r.root });
  commit(r.root, { 'src/alpha/index.mjs': 'export const x = 1;\n'.repeat(20) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: r.root });
  git(['checkout', '-q', '-b', 'bob/move'], { cwd: r.root });
  git(['mv', 'src/alpha/index.mjs', 'index-moved.mjs'], { cwd: r.root });
  git(['commit', '-q', '-m', 'move it out'], { cwd: r.root });
  git(['push', '-q', 'origin', 'bob/move'], { cwd: r.root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO({ ...r, sha, head: 'bob/move' }).io }), /changes module files.*src\/alpha\/index.mjs \(alpha\)/);
  // The job route: a job that moves a file from outside its module into it.
  const j = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'docs/guide.md': 'a guide line\n'.repeat(30) });
  git(['branch', 'tranche'], { cwd: j });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: j });
  git(['remote', 'add', 'origin', bare], { cwd: j });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: j });
  git(['mv', 'docs/guide.md', 'guide.md'], { cwd: j });
  write(j, { 'src/alpha/.keep': '' });
  git(['add', 'src/alpha/.keep'], { cwd: j });
  git(['mv', 'guide.md', 'src/alpha/guide.md'], { cwd: j });
  git(['commit', '-q', '-m', 'take the guide'], { cwd: j });
  const head = git(['rev-parse', 'HEAD'], { cwd: j });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: j });
  git(['checkout', '-q', 'main'], { cwd: j });
  assert.throws(() => merge(j, 3, { slug: 'o/r', io: io(head).io, noReview: 'x', log: () => {} }), /outside its module: docs\/guide.md/);
});

test('main and the tranche must require checks; a working branch need not', () => {
  const r = plainRepo();
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO(r, { rules: { checks: [] } }).io }), /tranche requires no checks/);
  const w = plainRepo({ head: 'bob/plan-fix' });
  git(['push', '-q', 'origin', 'tranche:refs/heads/bob/plan'], { cwd: w.root });
  assert.equal(mergePlain(w.root, 5, { ...q, noReview: 'x', io: plainIO(w, { base: 'bob/plan', rules: { checks: [] } }).io }).merged, true);
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO(r, { rules: null }).io }), /could not read the checks tranche requires/);
});

test('job branches are refused in any case, and a plain merge may not touch module files', () => {
  const r = plainRepo({ head: 'Job/Alpha' });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO(r).io }), /a job's \(Job\/Alpha\)/);
  const m = plainRepo({ files: { 'src/alpha/index.mjs': 'export const x = 1;\n', 'pin.txt': 'moved' } });
  const f = plainIO(m);
  assert.throws(() => mergePlain(m.root, 4, { ...q, noReview: 'x', io: f.io }), /changes module files, which go through a job: src\/alpha\/index.mjs \(alpha\)/);
  assert.equal(f.calls.merged, null);
  // The tranche into main carries the jobs' merged work, and passes.
  const t = plainRepo({ head: 'tranche', files: { 'src/alpha/index.mjs': 'export const x = 1;\n' } });
  assert.equal(mergePlain(t.root, 6, { ...q, noReview: 'x', io: plainIO(t, { base: 'main' }).io }).merged, true);
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO(r, { base: 'main', head: 'bob/pin' }).io }), /only the tranche tranche merges into main/);
});

test('a head from a deleted or other repository, a retargeted base, and a missing review are refused', () => {
  const r = plainRepo();
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO(r, { headRepo: null }).io }), /a repository that no longer exists/);
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO(r, { headRepo: 'x/r' }).io }), /comes from x\/r/);
  const f = plainIO(r, { after: (p) => ({ ...p, base: { ...p.base, ref: 'main' } }) });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /retargeted to main/);
  assert.equal(f.calls.merged, null);
  assert.throws(() => mergePlain(r.root, 4, { ...q, io: plainIO(r).io }), /--reviewed/);
});

test('the job route points any other pull request to --plain', () => {
  const { root } = setup();
  const f = io('h'.repeat(40));
  f.io.getPR = () => ({ state: 'open', draft: false, base: { ref: 'tranche' }, head: { ref: 'bob/pin', sha: 'h'.repeat(40) } });
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: f.io, noReview: 'x', log: () => {} }), /merges with --plain/);
});

// Third confirming review of PR 14.
// process3 with two released commits on its tranche and one unreleased.
function process3Line() {
  const p = makeRepo({ 'shims/process-gate.yml': 'on: pull_request\n' });
  const v1 = git(['rev-parse', 'HEAD'], { cwd: p });
  const v2 = commit(p, { 'README.md': 'v2' });
  git(['branch', 'tranche'], { cwd: p });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-proc-')), 'p.git');
  git(['init', '-q', '--bare', bare], { cwd: p });
  git(['remote', 'add', 'origin', bare], { cwd: p });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: p });
  git(['checkout', '-q', '-b', 'side'], { cwd: p });
  const side = commit(p, { 'README.md': 'unreleased' });
  return { dir: p, v1, v2, side };
}
// A product whose tranche pins `from`, and a plain PR whose head pins `to` (null: removes it).
function pinPR(from, to, extra = {}) {
  const r = plainRepo({ files: { 'pin.txt': 'x' } });
  git(['checkout', '-q', 'tranche'], { cwd: r.root });
  if (from) git(['update-index', '--add', '--cacheinfo', `160000,${from},.process`], { cwd: r.root });
  git(['commit', '-q', '--allow-empty', '-m', 'the tranche pin'], { cwd: r.root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: r.root });
  git(['checkout', '-q', '-b', 'bob/move'], { cwd: r.root });
  if (to) git(['update-index', '--add', '--cacheinfo', `160000,${to},.process`], { cwd: r.root });
  else git(['rm', '-q', '--cached', '.process'], { cwd: r.root });
  for (const [f, t] of Object.entries(extra)) { write(r.root, { [f]: t }); git(['add', f], { cwd: r.root }); }
  git(['commit', '-q', '--allow-empty', '-m', 'move the pin'], { cwd: r.root });
  git(['push', '-q', 'origin', 'bob/move'], { cwd: r.root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  return { root: r.root, sha, head: 'bob/move' };
}

test('a plain pin move goes forward to a released process3 commit only', () => {
  const p = process3Line();
  const go = (from, to, extra) => { const r = pinPR(from, to, extra); return () => mergePlain(r.root, 4, { ...q, noReview: 'a pin move', io: plainIO(r, { repo: processRepo(p.dir) }).io }); };
  assert.equal(go(p.v1, p.v2)().merged, true, 'forward, released');
  assert.equal(go(null, p.v1)().merged, true, 'a first pin, released');
  assert.throws(go(p.v1, p.side), /is not a commit on process3's tranche or main/);
  assert.throws(go(p.v2, p.v1), /does not descend from the base's pin .*no downgrade/);
  assert.throws(go(p.v1, null), /removes the process pin; that needs the owner's word/);
  assert.throws(go(p.v1, p.v1, { 'process/config.json': JSON.stringify({ process_repo: 'https://example.com/other' }) }), /changes process_repo in process\/config.json; that needs the owner's word/);
});

test('a forward pin move is judged on the whole history when the tool\'s clone is shallow (copy PR 53)', () => {
  const p = process3Line();
  // The tool's clone fetched only the new pin, depth 1, as a session did on 4 Nov.
  const shallow = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'p');
  git(['init', '-q', shallow], { cwd: p.dir });
  git(['remote', 'add', 'origin', git(['remote', 'get-url', 'origin'], { cwd: p.dir })], { cwd: shallow });
  git(['-c', 'protocol.file.allow=always', 'fetch', '-q', '--depth', '1', 'origin', p.v2], { cwd: shallow });
  assert.equal(git(['rev-parse', '--is-shallow-repository'], { cwd: shallow }), 'true');
  const r = pinPR(p.v1, p.v2);
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'a pin move', io: plainIO(r, { repo: processRepo(shallow) }).io }).merged, true);
  const back = pinPR(p.v2, p.v1);
  assert.throws(() => mergePlain(back.root, 4, { ...q, noReview: 'a pin move', io: plainIO(back, { repo: processRepo(shallow) }).io }), /no downgrade/, 'a downgrade is still refused');
});

// Build 22 (2 Nov): process_repo the tool already holds the owner's word for.
import { keySetAt } from '../lib/anchor.mjs';
import { readFileSync } from 'node:fs';
const P3 = 'https://github.com/neobobkrause/process3';
// GitHub says every commit is the owner's website commit.
const everyOwner = () => ({ author: { login: 'neobobkrause' }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } });
const cfgWith = (process_repo) => JSON.stringify(process_repo === null ? { record_since: null } : { process_repo, record_since: null });
// Onboarding's config: it also sets approvals.owner to the repository's owner (review follow-ups, 2 Nov).
// A product whose main has no process config and whose tranche took process_repo at one commit
// (`how`: 'merge', a merge of a pull request as probe PR 51 did; 'direct', a commit on the
// tranche), then a later config commit that leaves process_repo alone.
function trancheToMain({ how = 'merge', value = P3, mainConfig } = {}) {
  const root = makeRepo({ 'README.md': 'x', '.github/workflows/process-gate.yml': 'on: pull_request\n', ...(mainConfig ? { 'process/config.json': mainConfig } : {}) });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  let setAt;
  if (how === 'merge') {
    git(['checkout', '-q', '-b', 'bob/config'], { cwd: root });
    commit(root, { 'process/config.json': cfgWith(value) }, 'config');
