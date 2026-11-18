  handMerge(r2, tree, [first, side]);
  assert.deepEqual(recordCheck(r2, cfg, { base: b2, lookup: session }).findings.map((x) => [x.check, x.file]), [['settings', '.claude/hooks/start.sh']]);
});

// Third confirming review of PR 16.
function oldBranch() {
  const root = makeRepo({ '.claude/settings.json': settings(['old']), 'CLAUDE.md': claude('may push') });
  const old = git(['rev-parse', 'HEAD'], { cwd: root });
  const base = commit(root, { '.claude/settings.json': settings(['Bash(git push -f *)']), 'CLAUDE.md': claude('may push, never force') }, 'the owner, on the website');
  git(['checkout', '-q', '-b', 'stale', old], { cwd: root });
  commit(root, { 'work.txt': 'work' }, 'work on a branch cut from an old commit');
  return { root, base };
}

test('a merge whose first parent is the old side cannot keep the old settings or approvals', () => {
  const { root, base } = oldBranch();
  git(['merge', '-q', '-s', 'ours', '--no-edit', 'main'], { cwd: root });
  const f = recordCheck(root, cfg, { base, lookup: session }).findings.map((x) => `${x.check} ${x.file}`).sort();
  assert.deepEqual(f, ['approvals CLAUDE.md', 'settings .claude/settings.json']);
});

test('an ordinary merge that brings the old branch up to the base passes', () => {
  const { root, base } = oldBranch();
  git(['merge', '-q', '--no-edit', 'main'], { cwd: root });
  // The merge carries the newest block the owner set through the website (review follow-ups,
  // 2 Nov): GitHub says so of the base's commit.
  assert.deepEqual(recordCheck(root, cfg, { base, lookup: webFor(base) }).findings, []);
});

test('CLAUDE.md is an instruction file outside .claude or directly in it, and the owner\'s deeper inside', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  commit(root, { 'docs/CLAUDE.md': 'Notes.\n', '.claude/CLAUDE.md': 'Notes.\n', '.claude/agents/CLAUDE.md': 'Notes.\n', 'sub/.claude/skills/x/CLAUDE.local.md': 'Notes.\n' });
  assert.deepEqual(recordCheck(root, cfg, { base, lookup: session }).findings.map((x) => [x.check, x.file]).sort(),
    [['settings', '.claude/agents/CLAUDE.md'], ['settings', 'sub/.claude/skills/x/CLAUDE.local.md']]);
});

// Review follow-ups, 2 Nov: a change to the approvals block is accepted only when it leaves the
// newest block the owner set through the website among the commits it merges, or is itself a
// new website commit of the owner's.
// The tranche and main, as local branches here (origin/main and origin/tranche in CI).
const T = ['main', 'tranche'];
function closeOfTranche() {
  const root = makeRepo({ 'README.md': 'x' });
  const o1 = dated(root, { 'CLAUDE.md': claude('may push') }, 'the owner sets the approvals on main', '2026-11-01T10:00:00Z');
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  const o2 = dated(root, { 'CLAUDE.md': claude('may push and release') }, 'the owner widens them on the tranche', '2026-11-02T10:00:00Z');
  git(['checkout', '-q', 'main'], { cwd: root });
  const m = dated(root, { 'm.txt': 'main moves' }, 'main moves on', '2026-11-02T11:00:00Z');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  return { root, o1, o2, main: m };
}
const mergeMainWith = (root, words) => {
  git(['merge', '-q', '--no-ff', '--no-commit', 'main'], { cwd: root, allowFail: true });
  if (words) write(root, { 'CLAUDE.md': claude(words) });
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', 'merge main into the tranche'], { cwd: root });
  return git(['rev-parse', 'HEAD'], { cwd: root });
};

test('a merge of main into the tranche that puts back main\'s older approvals is refused', () => {
  const { root, o1, o2, main: m } = closeOfTranche();
  const merged = mergeMainWith(root, 'may push');
  // The tranche into main (the tranche's tip as CI sees it, before this merge): main's block is
  // the base's, and still the merge is refused.
  const f = recordCheck(root, cfg, { base: m, lookup: webFor(o1, o2), trusted: ['main', o2] }).findings;
  assert.deepEqual(f.map((x) => [x.check, x.file]), [['approvals', 'CLAUDE.md']]);
  assert.equal(f[0].message, `commit ${merged.slice(0, 10)} changes the approvals but is not neobobkrause's own commit through GitHub's website (author neobobkrause, committer neobobkrause, verified false), and its block is not the one neobobkrause last set there on main, the tranche or the base (commit ${o2.slice(0, 10)})`);
  // The push of that merge to the tranche, judged against the tranche's old tip: refused too.
  assert.deepEqual(recordCheck(root, cfg, { base: o2, lookup: webFor(o1, o2), trusted: T }).findings.map((x) => x.check), ['approvals']);
});

test('a merge of main into the tranche that carries the newest owner-set approvals passes', () => {
  const { root, o1, o2, main: m } = closeOfTranche();
  mergeMainWith(root, null);
  assert.equal(approvalsBlock(git(['show', 'HEAD:CLAUDE.md'], { cwd: root }), H), approvalsBlock(claude('may push and release'), H));
  assert.deepEqual(recordCheck(root, cfg, { base: m, lookup: webFor(o1, o2), trusted: T }).findings, []);
  assert.deepEqual(recordCheck(root, cfg, { base: o2, lookup: webFor(o1, o2), trusted: T }).findings, []);
});

test('a new website commit of the owner\'s may set any block, an older one included', () => {
  const { root, o1, o2, main: m } = closeOfTranche();
  const merged = mergeMainWith(root, 'may push');
  // The owner's own website merge (or edit) is a new owner commit: accepted.
  assert.deepEqual(recordCheck(root, cfg, { base: m, lookup: webFor(o1, o2, merged), trusted: T }).findings, []);
  // So is a later website commit on the tranche that sets the older words again; the same
  // commit by anyone else is refused.
  const t = closeOfTranche();
  const again = dated(t.root, { 'CLAUDE.md': claude('may push') }, 'the owner restores them', '2026-11-02T12:00:00Z');
  assert.deepEqual(recordCheck(t.root, cfg, { base: t.o2, lookup: webFor(t.o1, t.o2, again), trusted: T }).findings, []);
  assert.match(recordCheck(t.root, cfg, { base: t.o2, lookup: webFor(t.o1, t.o2), trusted: ['main'] }).findings[0].message, new RegExp(`commit ${again.slice(0, 10)} changes the approvals .*\\(commit ${t.o2.slice(0, 10)}\\)`));
});

test('a non-owner commit that sets the block back to the newest owner-set one passes; any other block does not', () => {
  const { root, o1, o2 } = closeOfTranche();
  const bad = commit(root, { 'CLAUDE.md': claude('may force-push') }, 'a session widens them');
  commit(root, { 'CLAUDE.md': claude('may push and release') }, 'a session puts the owner\'s words back');
  const f = recordCheck(root, cfg, { base: o2, lookup: webFor(o1, o2), trusted: T }).findings;
  assert.deepEqual(f.map((x) => x.message.slice(0, 17)), [`commit ${bad.slice(0, 10)}`]);
  assert.match(f[0].message, /is not neobobkrause's own commit through GitHub's website .*and its block is not the one neobobkrause last set there/);
});

// A commit GitHub did not commit (a local commit or merge) is never a website commit, so GitHub
// is not asked about it.
test('the approvals history asks GitHub only about commits GitHub committed', () => {
  const { root, o1, o2, main: m } = closeOfTranche();
  git(['config', 'user.email', 'session@example.com'], { cwd: root });
  for (let i = 0; i < 30; i++) commit(root, { 'CLAUDE.md': claude('may push and release') + `\nnote ${i}\n` }, `local edit ${i}`);
  mergeMainWith(root, null);
  const asked = [];
  const look = (args) => { asked.push(args[1].split('/').pop()); return webFor(o1, o2)(args); };
  assert.deepEqual(recordCheck(root, cfg, { base: m, lookup: look, trusted: T }).findings, []);
  assert.deepEqual([...new Set(asked)].sort(), [o1, o2].sort());
});

test('the owner removing the block counts: putting it back afterwards is refused, in any approvals file', () => {
  const file = 'docs/APPROVALS.md';
  const c2 = { ...cfg, approvals: { ...cfg.approvals, file } };
  const root = makeRepo({ 'README.md': 'x' });
  const o1 = dated(root, { [file]: claude('may push') }, 'the owner sets them', '2026-11-01T10:00:00Z');
  const o2 = dated(root, { [file]: '# none\n' }, 'the owner revokes them', '2026-11-02T10:00:00Z');
  const back = dated(root, { [file]: claude('may push') }, 'a session puts them back', '2026-11-02T11:00:00Z');
  const f = recordCheck(root, c2, { base: o2, lookup: webFor(o1, o2), trusted: ['main'] }).findings;
  assert.deepEqual(f.map((x) => [x.check, x.file]), [['approvals', file]]);
  assert.match(f[0].message, new RegExp(`commit ${back.slice(0, 10)} changes the approvals .*\\(commit ${o2.slice(0, 10)}\\)`));
});

test('main into the tranche after a release and a new owner block passes', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const o1 = dated(root, { 'CLAUDE.md': claude('v1') }, 'owner v1', '2026-11-01T08:00:00Z');
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  const o2 = dated(root, { 'CLAUDE.md': claude('v2') }, 'owner v2 on the tranche', '2026-11-01T09:00:00Z');
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'Merge PR: tranche into main', 'tranche'], { cwd: root, env: { ...process.env, GIT_COMMITTER_DATE: '2026-11-01T10:00:00Z' } });
  const release = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const o3 = dated(root, { 'CLAUDE.md': claude('v3') }, 'owner v3 on the tranche', '2026-11-01T11:00:00Z');
  git(['merge', '-q', '--no-ff', '-m', 'bring main in', 'main'], { cwd: root });
  const look = webFor(o1, o2, o3);
  assert.deepEqual(recordCheck(root, cfg, { base: release, lookup: look, trusted: T }).findings, []);
  // The push of that merge to the tranche, from its old tip.
  assert.deepEqual(recordCheck(root, cfg, { base: o3, lookup: look, trusted: T }).findings, []);
});

test('approvals.owner: absent is the default owner, an explicit null is a change', () => {
  const run = (from, to) => {
    const root = makeRepo({ 'process/config.json': from });
    const base = git(['rev-parse', 'HEAD'], { cwd: root });
    commit(root, { 'process/config.json': to }, 'change');
    return recordCheck(root, { ...cfg, max_file_bytes: 1e6 }, { base, lookup: session }).findings.map((x) => x.check);
  };
  assert.deepEqual(run({ max_file_bytes: 1 }, { max_file_bytes: 1, approvals: { owner: 'neobobkrause' } }), []);
  assert.deepEqual(run({ max_file_bytes: 1, approvals: { owner: 'neobobkrause' } }, { max_file_bytes: 1 }), []);
  assert.deepEqual(run({ max_file_bytes: 1 }, { max_file_bytes: 1, approvals: { owner: null } }), ['approvals']);
  assert.deepEqual(run({ max_file_bytes: 1 }, { max_file_bytes: 1, approvals: { owner: 'mallory' } }), ['approvals']);
});

// Review A of PR 32: two owner edits in one tranche cycle. A merge that brought in the first
// owner block passes once the head holds the second.
const mergeAt = (root, b, date) => { git(['merge', '-q', '--no-ff', '-m', `merge ${b}`, b], { cwd: root, env: { ...process.env, GIT_COMMITTER_DATE: date } }); return git(['rev-parse', 'HEAD'], { cwd: root }); };
test('a job that brought the tranche in across two owner edits passes, and so does the release', () => {
  const root = makeRepo({ 'CLAUDE.md': claude('v0') });
  const start = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  git(['checkout', '-q', '-b', 'job'], { cwd: root });
  dated(root, { 'a.txt': 'a' }, 'job work', '2026-11-01T09:00:00Z');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const o1 = dated(root, { 'CLAUDE.md': claude('v1') }, 'owner v1', '2026-11-01T10:00:00Z');
  git(['checkout', '-q', 'job'], { cwd: root });
  mergeAt(root, 'tranche', '2026-11-01T11:00:00Z');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const o2 = dated(root, { 'CLAUDE.md': claude('v2') }, 'owner v2', '2026-11-01T13:00:00Z');
  git(['checkout', '-q', 'job'], { cwd: root });
  mergeAt(root, 'tranche', '2026-11-01T14:00:00Z');
  assert.deepEqual(recordCheck(root, cfg, { base: o2, lookup: webFor(o1, o2), trusted: ['main', 'tranche'] }).findings, []);
  git(['checkout', '-q', 'tranche'], { cwd: root });
  mergeAt(root, 'job', '2026-11-01T15:00:00Z');
  assert.deepEqual(recordCheck(root, cfg, { base: start, lookup: webFor(o1, o2), trusted: ['main', 'tranche'] }).findings, []);
