  assert.deepEqual(f2.map((x) => [x.check, x.file]), [['approvals', 'process/config.json']]);
});

test('a merge that itself writes record_since on the base passes; one naming a commit the head brings does not', () => {
  for (const onBaseCase of [true, false]) {
    const { root, base } = oldOnBase();
    const brought = commit(root, { 'a.txt': 'a' }, 'head work');
    git(['checkout', '-q', '-b', 'side', base], { cwd: root });
    commit(root, { 'b.txt': 'b' }, 'side work');
    git(['checkout', '-q', 'onboard'], { cwd: root });
    git(['merge', '-q', '--no-ff', '--no-commit', 'side'], { cwd: root });
    write(root, { 'process/config.json': { max_file_bytes: 100, record_since: onBaseCase ? base : brought } });
    git(['add', '-A'], { cwd: root });
    git(['commit', '-q', '-m', 'merge, writing the config'], { cwd: root });
    const f = recordCheck(root, cfg, { base, lookup: session }).findings;
    assert.deepEqual(f.map((x) => x.file), onBaseCase ? [] : ['process/config.json'], String(onBaseCase));
  }
});

test('record-pr\'s shape: the base is the tranche tip by name, moved on and not in the head', () => {
  const root = makeRepo({ 'README.md': 'x' });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  const t = commit(root, { 'old/big.bin': 'y'.repeat(101) }, 'old work');
  git(['checkout', '-q', '-b', 'build/onboard'], { cwd: root });
  commit(root, { 'process/config.json': { max_file_bytes: 100, record_since: t } }, 'onboard');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const moved = commit(root, { 'other.txt': 'moved' }, 'tranche moves');
  git(['checkout', '-q', 'build/onboard'], { cwd: root });
  assert.deepEqual(recordCheck(root, cfg, { base: 'tranche', since: recordSince(root, { base: 'tranche' }).since, lookup: session }).findings, []);
  // A record_since on the moved tip, which the head does not hold, is refused by recordSince.
  commit(root, { 'process/config.json': { max_file_bytes: 100, record_since: moved } }, 'name the moved tip');
  assert.equal(recordSince(root, { base: 'tranche' }).since, null);
});

test('the push check finds the base from the tranche, so onboarding pushed to a branch passes', async () => {
  const root = makeRepo({ 'README.md': 'x' });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: root });
  const t = commit(root, { 'old/big.bin': 'y'.repeat(101) }, 'old work');
  git(['checkout', '-q', '-b', 'build/onboard'], { cwd: root });
  commit(root, { 'process/config.json': { max_file_bytes: 100, record_since: t }, '.process': 'pin' }, 'onboard');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'the tranche moved on' }, 'tranche moves');
  const out = join(root, 'out.json');
  const cwd = process.cwd();
  process.chdir(root);
  try { assert.equal(await main(['record-check', '--head', 'build/onboard', '--onto', 'tranche', '--out', out]), 0); } finally { process.chdir(cwd); }
  assert.deepEqual(JSON.parse(readFileSync(out, 'utf8')).findings, []);
});

test('a config that is not a JSON object is refused with a clear error', () => {
  const root = makeRepo({ 'process/config.json': 'null\n' });
  assert.throws(() => recordSince(root, { base: undefined }), /is not a JSON object/);
});

// The settings under .claude/ are the owner's (Bob's standing rule: sessions never change
// permission settings): a finding unless the owner's own website commit, as the approvals.
const settings = (deny) => JSON.stringify({ permissions: { deny } }) + '\n'; // small: the test limit is 100 bytes

test('the owner\'s website commit may change .claude/settings.json', () => {
  const root = makeRepo({ '.claude/settings.json': settings(['Bash(git push -f *)']) });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const sha = commit(root, { '.claude/settings.json': settings(['Bash(git push -f *)', 'Bash(gh pr merge *)']) });
  const r = recordCheck(root, cfg, { base, lookup: webFor(sha) });
  assert.deepEqual(r.findings, []);
  assert.ok(!r.notices.some((n) => n.file === '.claude/settings.json'), 'a finding or nothing, not a notice');
});

test('a session\'s commit changing .claude/settings.json, or removing it, is a finding', () => {
  const root = makeRepo({ '.claude/settings.json': settings(['Bash(git push -f *)']) });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  commit(root, { '.claude/settings.json': settings([]) });
  const f = recordCheck(root, cfg, { base, lookup: session }).findings;
  assert.equal(f.length, 1);
  assert.equal(f[0].check, 'settings');
  assert.match(f[0].message, /changes \.claude\/settings\.json, which is the owner's setting, but is not neobobkrause's own commit through GitHub's website/);
  const next = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['rm', '-q', '.claude/settings.json'], { cwd: root });
  git(['commit', '-q', '-m', 'drop'], { cwd: root });
  assert.deepEqual(recordCheck(root, cfg, { base: next, lookup: session }).findings.map((x) => [x.check, x.file]), [['settings', '.claude/settings.json']]);
});

test('a hooks file under .claude/ is the owner\'s too; an instruction file there is not', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  commit(root, { '.claude/hooks/session-start.sh': 'exit 0\n', '.claude/rules/style.md': 'Write plain words.\n' });
  const f = recordCheck(root, cfg, { base, lookup: session }).findings;
  assert.deepEqual(f.map((x) => [x.check, x.file]), [['settings', '.claude/hooks/session-start.sh']]);
});

test('a merge carrying the owner\'s settings commit unchanged is not a finding', () => {
  const root = makeRepo({ '.claude/settings.json': settings(['Bash(git push -f *)']), 'a.txt': 'a' });
  git(['checkout', '-q', '-b', 'side'], { cwd: root });
  const owner = commit(root, { '.claude/settings.json': settings(['Bash(git push -f *)', 'Bash(gh pr merge *)']) }, 'Bob, on the website');
  git(['checkout', '-q', 'main'], { cwd: root });
  const base = commit(root, { 'b.txt': 'b' });
  git(['merge', '-q', '--no-edit', 'side'], { cwd: root });
  // Only the owner's commit is judged for the file; the session's merge introduces nothing.
  const r = recordCheck(root, cfg, { base, lookup: webFor(owner) });
  assert.equal(r.commits, 2);
  assert.deepEqual(r.findings, []);
  // The same merge writing its own settings is judged as the session's.
  git(['reset', '-q', '--hard', base], { cwd: root });
  git(['merge', '-q', '--no-commit', 'side'], { cwd: root });
  write(root, { '.claude/settings.json': settings([]) });
  git(['add', '-A'], { cwd: root });
  git(['commit', '-q', '-m', 'merge that rewrites the settings'], { cwd: root });
  assert.deepEqual(recordCheck(root, cfg, { base, lookup: webFor(owner) }).findings.map((x) => x.check), ['settings']);
});

// Confirming review of PR 16: hand-made merges cannot roll guarded files back, and the owner's
// files are found by path segment, in any case, at any depth.
import { symlinkSync } from 'node:fs';

// A merge made by hand, with the given tree and parents (git refuses to merge an ancestor).
const handMerge = (root, tree, parents, msg = 'merge') => {
  const sha = git(['commit-tree', tree, ...parents.flatMap((p) => ['-p', p]), '-m', msg], { cwd: root });
  git(['reset', '-q', '--hard', sha], { cwd: root });
  return sha;
};

test('a hand-made merge that takes settings, the approvals or a kept file from an old commit is judged as its own change', () => {
  const root = makeRepo({ '.claude/settings.json': settings(['old']), 'CLAUDE.md': claude('may push') });
  const old = git(['rev-parse', 'HEAD'], { cwd: root });
  const oldTree = git(['rev-parse', 'HEAD^{tree}'], { cwd: root });
  const base = commit(root, { '.claude/settings.json': settings(['Bash(git push -f *)']), 'CLAUDE.md': claude('may push, never force'), 'tool/p3.mjs': '// tool\n' }, 'the owner, on the website');
  handMerge(root, oldTree, [base, old], 'merge an old commit');
  const f = recordCheck(root, cfg, { base, lookup: session }).findings.map((x) => `${x.check} ${x.file}`).sort();
  assert.deepEqual(f, ['approvals CLAUDE.md', 'path tool/p3.mjs', 'settings .claude/settings.json']);
});

test('a merge carrying an in-range owner commit still passes, and an ordinary merge of other files too', () => {
  const root = makeRepo({ '.claude/agents/a.md': 'agent\n', 'a.txt': 'a' });
  git(['checkout', '-q', '-b', 'side'], { cwd: root });
  const owner = commit(root, { '.claude/agents/a.md': 'agent, changed by the owner\n' }, 'the owner, on the website');
  git(['checkout', '-q', 'main'], { cwd: root });
  const base = commit(root, { 'b.txt': 'b' });
  git(['merge', '-q', '--no-edit', 'side'], { cwd: root });
  assert.deepEqual(recordCheck(root, cfg, { base, lookup: webFor(owner) }).findings, []);
});

test('everything in a .claude directory but rules is the owner\'s: agents, skills, commands, a link, a pin, any case, any depth, and .mcp.json', () => {
  const cases = [
    [{ '.claude/agents/reviewer.md': 'x\n' }, '.claude/agents/reviewer.md'],
    [{ '.claude/skills/deploy/SKILL.md': 'x\n' }, '.claude/skills/deploy/SKILL.md'],
    [{ '.claude/commands/go.md': 'x\n' }, '.claude/commands/go.md'],
    [{ '.Claude/settings.json': '{}\n' }, '.Claude/settings.json'],
    [{ 'sub/.claude/settings.local.json': '{}\n' }, 'sub/.claude/settings.local.json'],
    [{ '.mcp.json': '{}\n' }, '.mcp.json'],
    [{ 'pkg/.MCP.json': '{}\n' }, 'pkg/.MCP.json'],
  ];
  for (const [files, file] of cases) {
    const root = makeRepo({ 'README.md': 'x' });
    const base = git(['rev-parse', 'HEAD'], { cwd: root });
    const sha = commit(root, files);
    assert.deepEqual(recordCheck(root, cfg, { base, lookup: session }).findings.map((x) => [x.check, x.file]), [['settings', file]], file);
    assert.deepEqual(recordCheck(root, cfg, { base, lookup: webFor(sha) }).findings, [], `${file}: the owner's website commit passes`);
  }
  // Rules files stay instruction files, in any case of the directory.
  const root = makeRepo({ 'README.md': 'x' });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  commit(root, { '.claude/rules/style.md': 'Plain words.\n', '.Claude/rules/deep/more.md': 'Short lines.\n', 'sub/CLAUDE.md': 'Notes.\n' });
  assert.deepEqual(recordCheck(root, cfg, { base, lookup: session }).findings, []);
});

test('.claude itself as a link or a pin is the owner\'s', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  symlinkSync('elsewhere', join(root, '.claude'));
  git(['add', '.claude'], { cwd: root });
  git(['commit', '-q', '-m', 'link'], { cwd: root });
  assert.deepEqual(recordCheck(root, cfg, { base, lookup: session }).findings.map((x) => [x.check, x.file]), [['settings', '.claude']]);
  const pin = makeRepo({ 'README.md': 'x' });
  const b2 = git(['rev-parse', 'HEAD'], { cwd: pin });
  git(['update-index', '--add', '--cacheinfo', `160000,${b2},.claude`], { cwd: pin });
  git(['commit', '-q', '-m', 'pin'], { cwd: pin });
  assert.deepEqual(recordCheck(pin, cfg, { base: b2, lookup: session }).findings.map((x) => [x.check, x.file]), [['settings', '.claude']]);
});

test('a mode-only change to an owner file is a change, in a commit and in a merge', () => {
  const root = makeRepo({ '.claude/hooks/start.sh': 'exit 0\n', 'a.txt': 'a' });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['update-index', '--chmod=+x', '.claude/hooks/start.sh'], { cwd: root });
  git(['commit', '-q', '-m', 'make it run'], { cwd: root });
  assert.deepEqual(recordCheck(root, cfg, { base, lookup: session }).findings.map((x) => [x.check, x.file]), [['settings', '.claude/hooks/start.sh']]);
  // A hand-made merge whose tree differs from both parents only in the mode.
  const r2 = makeRepo({ '.claude/hooks/start.sh': 'exit 0\n', 'a.txt': 'a' });
  const b2 = git(['rev-parse', 'HEAD'], { cwd: r2 });
  git(['checkout', '-q', '-b', 'side'], { cwd: r2 });
  const side = commit(r2, { 'c.txt': 'c' });
  git(['checkout', '-q', 'main'], { cwd: r2 });
  const first = commit(r2, { 'b.txt': 'b' });
  git(['merge', '-q', '--no-commit', 'side'], { cwd: r2 });
  git(['update-index', '--chmod=+x', '.claude/hooks/start.sh'], { cwd: r2 });
  const tree = git(['write-tree'], { cwd: r2 });
