});

test('the release after two owner edits merged from website branches passes', () => {
  const root = makeRepo({ 'CLAUDE.md': claude('v0') });
  const start = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  dated(root, { 't.txt': 't' }, 'tranche work', '2026-11-01T09:00:00Z');
  git(['checkout', '-q', '-b', 'owner1', start], { cwd: root });
  const o1 = dated(root, { 'CLAUDE.md': claude('v1') }, 'owner v1', '2026-11-01T10:00:00Z');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  mergeAt(root, 'owner1', '2026-11-01T10:30:00Z');
  git(['checkout', '-q', '-b', 'owner2'], { cwd: root });
  const o2 = dated(root, { 'CLAUDE.md': claude('v2') }, 'owner v2', '2026-11-01T11:00:00Z');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  dated(root, { 'u.txt': 'u' }, 'tranche work 2', '2026-11-01T11:10:00Z');
  mergeAt(root, 'owner2', '2026-11-01T11:30:00Z');
  assert.deepEqual(recordCheck(root, cfg, { base: start, lookup: webFor(o1, o2), trusted: ['main', 'tranche'] }).findings, []);
});

// Every PR from a job branch (job start reads it). Unreadable is null.
import { prsFromBranch } from '../lib/github.mjs';
test('prsFromBranch lists every PR from this repository\'s branch', () => {
  let asked;
  const prs = prsFromBranch('o/r', 'job/m', { read: (a) => { asked = a; return [[{ number: 1 }], [{ number: 2 }]]; } });
  assert.deepEqual(prs.map((x) => x.number), [1, 2]);
  assert.match(asked.join(' '), /--paginate --slurp repos\/o\/r\/pulls\?state=all&head=o%3Ajob%2Fm&per_page=100/);
  assert.equal(prsFromBranch('o/r', 'job/m', { read: () => null }), null);
});

// The copy, 4 Nov (scheduler 20aaeb29bd, store-request 8b7e12bcd6): a job's sync merge carries
// the tranche's CLAUDE.md after an owner edit; a later owner edit moved the base on. A merge whose
// block (or instruction file, or config) equals a parent reachable from a trusted ref is not a
// change; equality with an untrusted side parent does not count.
function syncAcross() {
  const root = makeRepo({ 'CLAUDE.md': claude('v0') + 'Approved: v0\n' });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  git(['checkout', '-q', '-b', 'job'], { cwd: root });
  dated(root, { 'a.txt': 'a' }, 'job work', '2026-11-04T07:00:00Z');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const o1 = dated(root, { 'CLAUDE.md': claude('v1') + 'Approved: v1\n' }, 'owner v1', '2026-11-04T08:00:00Z');
  git(['checkout', '-q', 'job'], { cwd: root });
  const sync = mergeAt(root, 'tranche', '2026-11-04T08:30:00Z');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const o2 = dated(root, { 'CLAUDE.md': claude('v2') + 'Approved: v2\n' }, 'owner v2', '2026-11-04T09:00:00Z');
  git(['checkout', '-q', 'job'], { cwd: root });
  return { root, o1, o2, sync };
}

test('a sync merge across an owner edit passes, after a later owner edit moved the base on', () => {
  const { root, o1, o2 } = syncAcross();
  mergeAt(root, 'tranche', '2026-11-04T09:30:00Z');
  assert.deepEqual(recordCheck(root, cfg, { base: o2, lookup: webFor(o1, o2), trusted: ['main', 'tranche'] }).findings, []);
});

test('a merge whose approvals match only an untrusted side branch is refused, and so is one that changes them', () => {
  const { root, o1, o2 } = syncAcross();
  mergeAt(root, 'tranche', '2026-11-04T09:30:00Z');
  // A side branch, on no trusted ref, that writes its own approvals, merged into the job.
  git(['checkout', '-q', '-b', 'side', 'tranche'], { cwd: root });
  dated(root, { 'CLAUDE.md': claude('v9 everything') + 'Approved: v9\n' }, 'side approvals', '2026-11-04T09:40:00Z');
  git(['checkout', '-q', 'job'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-X', 'theirs', '-m', 'merge side', 'side'], { cwd: root });
  const f = recordCheck(root, cfg, { base: o2, lookup: webFor(o1, o2), trusted: ['main', 'tranche'] }).findings;
  assert.ok(f.length && f.every((x) => x.check === 'approvals'), JSON.stringify(f));
  // A merge of the tranche that writes a block of its own.
  const r2 = syncAcross();
  git(['merge', '-q', '--no-ff', '--no-commit', 'tranche'], { cwd: r2.root, allowFail: true });
  write(r2.root, { 'CLAUDE.md': claude('v2 and more') + 'Approved: v2\n' });
  git(['add', '-A'], { cwd: r2.root });
  git(['commit', '-q', '-m', 'merge tranche'], { cwd: r2.root });
  const f2 = recordCheck(r2.root, cfg, { base: r2.o2, lookup: webFor(r2.o1, r2.o2), trusted: ['main', 'tranche'] }).findings;
  assert.deepEqual(f2.map((x) => x.check), ['approvals'], JSON.stringify(f2));
});

test('review of PR 101: a revoked approval line, moved within the file in a merge of the commit that had it, is refused', () => {
  const root = makeRepo({ 'CLAUDE.md': claude('v0') });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  git(['checkout', '-q', '-b', 'job'], { cwd: root });
  dated(root, { 'a.txt': 'a' }, 'job work', '2026-11-04T07:00:00Z');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const o1 = dated(root, { 'CLAUDE.md': claude('v0') + 'Approved: deploy to production\n' }, 'owner adds', '2026-11-04T08:00:00Z');
  const o2 = dated(root, { 'CLAUDE.md': claude('v0') }, 'owner revokes', '2026-11-04T09:00:00Z');
  git(['checkout', '-q', 'job'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-commit', o1], { cwd: root, allowFail: true });
  write(root, { 'CLAUDE.md': 'Approved: deploy to production\n' + claude('v0') });
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', 'merge o1'], { cwd: root });
  const f = recordCheck(root, cfg, { base: o2, lookup: webFor(o1, o2), trusted: ['main', 'tranche'] }).findings;
  assert.deepEqual(f.map((x) => [x.check, x.file]), [['approvals', 'CLAUDE.md']]);
});

test('review of PR 101: a merge of a main-only owner commit whose block the owner since replaced on main is refused', () => {
  const root = makeRepo({ 'CLAUDE.md': claude('Z') });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const pA = dated(root, { 'CLAUDE.md': claude('A: may force-push') }, 'owner A on main', '2026-11-04T08:00:00Z');
  const pB = dated(root, { 'CLAUDE.md': claude('B') }, 'owner B on main', '2026-11-04T09:00:00Z');
  git(['checkout', '-q', '-b', 'job', 'tranche'], { cwd: root });
  dated(root, { 'a.txt': 'a' }, 'job work', '2026-11-04T09:10:00Z');
  git(['merge', '-q', '--no-ff', '-m', 'merge pA', pA], { cwd: root });
  const f = recordCheck(root, cfg, { base, lookup: webFor(pA, pB), trusted: ['main', 'tranche'] }).findings;
  assert.deepEqual(f.map((x) => x.check), ['approvals']);
});

// C19 (the coordinator, 7 Nov): the copy's layer/10 (PR 759) carried the owner's website commit on
// the tranche (314c284a2d, copy PR 755) into the layer by layer-sync, land and job-sync merges; the
// tranche then moved on, and each merge read as a settings change that was not the owner's. A merge
// that only carries a version a trusted ref (or the owner's own commit) set is credited; one that
// writes its own version, or puts an older one back over a newer, is still the merge's own change.
test('a layer-sync merge carrying the owner\'s settings commit from the tranche is credited, the tranche having moved on since', () => {
  const root = makeRepo({ '.claude/settings.json': settings(['a']), 'a.txt': 'a' });
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', '-b', 'layer'], { cwd: root });
  commit(root, { 'l.txt': 'layer work' }, 'a land');
  // The owner's website commit on the tranche, then the layer sync that carries it.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const owner = commit(root, { '.claude/settings.json': settings(['a', 'b']) }, 'Bob, on the website');
  git(['checkout', '-q', 'layer'], { cwd: root });
  git(['merge', '-q', '--no-edit', 'tranche', '-m', 'layer sync'], { cwd: root });
  const synced = git(['rev-parse', 'HEAD'], { cwd: root });
  commit(root, { 'l2.txt': 'more' }, 'another land');
  // The tranche moves on: another owner edit, so the base's settings are not the layer's.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const owner2 = commit(root, { '.claude/settings.json': settings(['a', 'b', 'c']) }, 'Bob again');
  git(['checkout', '-q', 'layer'], { cwd: root });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  // GitHub unread (every commit reads as not the owner's): the setter on the tranche credits the merge.
  const r = recordCheck(root, cfg, { base: owner2, head, lookup: session, trusted: ['tranche'] });
  assert.deepEqual(r.findings, []);
  // The base alone credits it (the setter lies behind it), with no other trusted ref named.
  assert.deepEqual(recordCheck(root, cfg, { base: owner2, head, lookup: webFor(owner), trusted: [] }).findings, []);
  // A sync merge that writes its own settings is its own change.
  git(['reset', '-q', '--hard', synced + '^1'], { cwd: root });
  git(['merge', '-q', '--no-commit', 'tranche~1'], { cwd: root });
  write(root, { '.claude/settings.json': settings(['mine']) });
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', 'a sync that rewrites the settings'], { cwd: root });
  assert.deepEqual(recordCheck(root, cfg, { base: owner2, head: 'HEAD', lookup: session, trusted: ['tranche'] }).findings.map((x) => x.check), ['settings']);
  // A merge that puts the older version back over the owner's newer one (both parents' setters
  // trusted) is its own change: the other parent changed the file since they diverged.
  const tree = git(['rev-parse', `${synced}^1^{tree}`], { cwd: root });
  const back = git(['commit-tree', tree, '-p', `${synced}^1`, '-p', owner, '-m', 'puts the old settings back'], { cwd: root });
  assert.deepEqual(recordCheck(root, cfg, { base: owner2, head: back, lookup: session, trusted: ['tranche'] }).findings.map((x) => x.check), ['settings']);
});

// C21 (the coordinator, 7 Nov): a job merged the owner's website commit T1 from main, which the owner
// had since replaced by T2 on main only. T1 lies in the range, so it was judged (the owner's own) and
// carried: the job rolled the owner's settings back to T1 and passed. A carried owner version not in
// the base must still be current on a trusted tip, as ownerSet holds the approvals block.
test('a merge carrying the owner\'s settings commit that the owner has since replaced on main is refused', () => {
  const root = makeRepo({ '.claude/settings.json': settings(['a']), 'a.txt': 'a' });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const t1 = commit(root, { '.claude/settings.json': settings(['a', 'old']) }, 'Bob T1 on main');
  const t2 = commit(root, { '.claude/settings.json': settings(['a', 'new']) }, 'Bob T2 on main');
  git(['checkout', '-q', '-b', 'job', 'tranche'], { cwd: root });
  commit(root, { 'j.txt': 'job work' }, 'job work');
  git(['merge', '-q', '--no-ff', '-m', 'merge T1', t1], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  const run = (head) => recordCheck(root, cfg, { base, head, lookup: webFor(t1, t2), trusted: ['main', 'tranche'] }).findings;
  const f = run(m);
  assert.deepEqual(f.map((x) => [x.check, x.file]), [['settings', '.claude/settings.json']]);
  assert.match(f[0].message, /carries \.claude\/settings\.json as .*'s commit .* but main has replaced that version since.*merge main again/);
  // Later merges that only keep it are not named again: one finding, on the merge that brought it.
  commit(root, { 'k.txt': 'more' }, 'more job work');
  git(['merge', '-q', '--no-ff', '-m', 'merge the tranche', 'tranche'], { cwd: root });
  git(['branch', 'other', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'other'], { cwd: root });
  commit(root, { 'o.txt': 'o' }, 'other');
  git(['checkout', '-q', 'job'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'merge other', 'other'], { cwd: root });
  const later = run('HEAD');
  assert.equal(later.length, 1);
  assert.match(later[0].message, new RegExp(`commit ${m.slice(0, 10)} carries`));
  // The owner's current version merged in: carried, no finding.
  git(['reset', '-q', '--hard', `${m}^1`], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'merge T2', t2], { cwd: root });
