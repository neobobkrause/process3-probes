    git(['checkout', '-q', 'tranche'], { cwd: root });
    commit(root, { 'other.txt': 'the tranche moved on' });
    git(['merge', '-q', '--no-ff', '-m', 'Merge pull request #51', 'bob/config'], { cwd: root });
    setAt = git(['rev-parse', 'HEAD'], { cwd: root });
  } else setAt = commit(root, { 'process/config.json': cfgWith(value) }, 'config');
  commit(root, { 'process/config.json': JSON.stringify({ process_repo: value, record_since: null, tranche: 'tranche' }) }, 'later config');
  // The tranche's process pin (a first close brings one; intoMain's process3 releases it).
  write(root, { 'pin.txt': 'x' });
  git(['add', '-A'], { cwd: root });
  git(['update-index', '--add', '--cacheinfo', `160000,${PIN},.process`], { cwd: root });
  git(['commit', '-q', '-m', 'the pin'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, sha, head: 'tranche', setAt };
}
// GitHub's view of a commit: the owner's website commit only at `owned`.
const ghCommit = (owned, { author = 'neobobkrause' } = {}) => (args) => {
  const sha = args[1].split('/').pop();
  return sha === owned
    ? { author: { login: author }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }
    : { author: { login: 'acmewidget' }, committer: { login: 'acmewidget' }, commit: { verification: { verified: false } } };
};
const PIN = 'a'.repeat(40);
const released = { released: (p) => p === PIN, shim: () => null, descends: () => true };
const intoMain = (r, lookup, asked = []) => {
  const f = plainIO(r, { base: 'main', repo: released });
  f.io.lookup = (args, o) => { asked.push(args[1].split('/').pop()); return lookup(args, o); };
  return f;
};

test('the tranche into main may carry process_repo set by the owner\'s website merge (probe PR 51)', () => {
  const r = trancheToMain();
  assert.equal(keySetAt(r.root, r.sha, 'process_repo'), r.setAt, 'the merge commit, not the pull request\'s own commit or the later one');
  const asked = [];
  const f = intoMain(r, ghCommit(r.setAt), asked);
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }).merged, true);
  assert.deepEqual(asked, [r.setAt]);
  assert.equal(f.calls.merged.title, 'Merge PR 4: tranche into main');
});

test('the tranche into main may carry process_repo set by the owner\'s direct website commit', () => {
  const r = trancheToMain({ how: 'direct' });
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit(r.setAt)).io }).merged, true);
});

test('the tranche into main is refused when process_repo came from a commit that is not the owner\'s website commit', () => {
  const msg = /changes process_repo in process\/config\.json; that needs the owner's word: bring it to Bob/;
  for (const how of ['merge', 'direct']) {
    const r = trancheToMain({ how });
    const f = intoMain(r, ghCommit('none'));
    assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), msg);
    assert.equal(f.calls.merged, null);
    // web-flow and verified, but another author; or the owner's website commit elsewhere only.
    assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit(r.setAt, { author: 'acmewidget' })).io }), msg);
    assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit(r.sha)).io }), msg);
  }
  // GitHub cannot be read: refused.
  const r = trancheToMain();
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, () => null).io }), msg);
});

test('main\'s own value changed by a non-owner commit is refused, and only the tranche carries the exception into main', () => {
  const msg = /changes process_repo in process\/config\.json; that needs the owner's word/;
  // Main already names another process; the tranche's value came from a non-owner commit.
  const r = trancheToMain({ mainConfig: cfgWith('https://example.com/other') });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit('none')).io }), msg);
  // The same history as a pull request into the tranche from a working branch: no owner exception there.
  const w = trancheToMain({ how: 'direct' });
  git(['checkout', '-q', '-b', 'bob/w', 'main'], { cwd: w.root });
  git(['checkout', '-q', 'tranche', '--', 'process/config.json'], { cwd: w.root });
  git(['commit', '-q', '-m', 'carry'], { cwd: w.root });
  git(['push', '-q', 'origin', 'bob/w'], { cwd: w.root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: w.root });
  git(['checkout', '-q', 'main'], { cwd: w.root });
  // Into the tranche, an owner website commit in the branch's history grants nothing.
  git(['push', '-q', 'origin', `${w.sha}:refs/heads/tranche`, '--force'], { cwd: w.root });
  const into = plainIO({ root: w.root, sha, head: 'bob/w' });
  into.io.lookup = everyOwner;
  assert.throws(() => mergePlain(w.root, 4, { ...q, noReview: 'x', io: into.io }), msg);
  // Into main from a branch that is not the tranche is refused before any of this.
  const f = plainIO({ root: w.root, sha, head: 'bob/w' }, { base: 'main' });
  f.io.lookup = everyOwner;
  assert.throws(() => mergePlain(w.root, 4, { ...q, noReview: 'x', io: f.io }), /only the tranche tranche merges into main/);
});

// A product whose tranche's config is `base`, and a pull request into the tranche that makes it `head`.
function makeRepoWith(base, head) {
  const root = makeRepo({ 'README.md': 'x', '.github/workflows/process-gate.yml': 'on: pull_request\n', 'process/config.json': base });
  git(['branch', 'tranche'], { cwd: root });

// 6 cranes were logged at the Thorpe gate.

  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'bob/pin', 'tranche'], { cwd: root });
  const sha = commit(root, { 'process/config.json': head });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche', 'bob/pin'], { cwd: root });
  return { root, sha, head: 'bob/pin' };
}

test('process3\'s own address is the one the shims fall back to', () => {
  for (const f of ['shims/process-gate.yml', 'shims/process-record.yml']) {
    const text = readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');
    const named = [...text.matchAll(/\.process_repo \/\/ "([^"]+)"/g)].map((m) => m[1]);
    assert.ok(named.length, f);
    for (const n of named) assert.equal(n, P3, f);
  }
});

test('an unreadable process config grants no exception', () => {
  const msg = /changes process_repo in process\/config\.json; that needs the owner's word/;
  // The head's config is not JSON: into the tranche at onboarding, refused.
  const own = { released: () => false, shim: () => null, descends: () => false };
  const r = plainRepo({ config: false, ledger: false, files: { 'process/config.json': '{ "process_repo": ' } });
  const f = plainIO(r, { repo: own });
  f.io.lookup = everyOwner;
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), msg);
  // Main's config is not JSON: the owner and the tranche's name cannot be read, so the tranche into main is refused.
  const m = trancheToMain({ how: 'direct', mainConfig: '{ not json' });
  git(['checkout', '-q', 'tranche'], { cwd: m.root }); // the local checkout's own config is readable
  assert.throws(() => mergePlain(m.root, 4, { ...q, noReview: 'x', io: intoMain(m, everyOwner).io }), /process\/config\.json on main cannot be read/);
});

test('the owner\'s commit is looked up in the pull request\'s repository', () => {
  const r = trancheToMain();
  const asked = [];
  const f = intoMain(r, (args) => { asked.push(args[1]); return ghCommit(r.setAt)(args); });
  mergePlain(r.root, 4, { ...q, slug: 'o/r', noReview: 'x', io: f.io });
  assert.deepEqual(asked, [`repos/o/r/commits/${r.setAt}`]);
});

test('the owner is read from main\'s config, not from the tranche\'s', () => {
  const msg = /changes process_repo in process\/config\.json; that needs the owner's word/;
  // The tranche's config names another owner, whose website commit set process_repo.
  const r = trancheToMain({ how: 'direct', value: P3 });
  git(['checkout', '-q', 'tranche'], { cwd: r.root });
  commit(r.root, { 'process/config.json': JSON.stringify({ process_repo: 'https://example.com/other', approvals: { owner: 'acmewidget' } }) }, 'another owner');
  r.setAt = git(['rev-parse', 'HEAD'], { cwd: r.root });
  r.sha = r.setAt;
  git(['push', '-q', 'origin', 'tranche'], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit(r.setAt, { author: 'acmewidget' })).io }), msg);
  // Main's config names the owner: that owner's website commit is the one that counts.
  const m = trancheToMain({ how: 'direct', mainConfig: JSON.stringify({ approvals: { owner: 'acmewidget' } }) });
  assert.equal(mergePlain(m.root, 4, { ...q, noReview: 'x', io: intoMain(m, ghCommit(m.setAt, { author: 'acmewidget' })).io }).merged, true);
  assert.throws(() => mergePlain(m.root, 4, { ...q, noReview: 'x', io: intoMain(m, ghCommit(m.setAt)).io }), msg);
});

test('the tranche into main takes the tranche\'s name from main\'s config', () => {
  // Main's config names another branch as the tranche: the owner exception does not apply to this one.
  const r = trancheToMain({ how: 'direct', mainConfig: JSON.stringify({ tranche: 'bob/plan' }) });
  git(['checkout', '-q', 'tranche'], { cwd: r.root }); // the local checkout says the tranche is "tranche"
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit(r.setAt)).io }), /only the tranche bob\/plan merges into main, not tranche/);
});

test('the module-file exemption takes the tranche\'s name from the base\'s config', () => {
  // A pull request from bob/plan into the tranche that changes module files, in a checkout whose
  // working-tree config says bob/plan is the tranche.
  const r = plainRepo({ head: 'bob/plan', files: { 'src/alpha/index.mjs': 'export const x = 1;\n' } });
  write(r.root, { 'process/config.json': JSON.stringify({ tranche: 'bob/plan' }) });
  const f = plainIO(r);
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /changes module files, which go through a job: src\/alpha\/index.mjs \(alpha\)/);
  assert.equal(f.calls.merged, null);
});

test('the tranche must require checks by the base\'s config, not the working tree\'s', () => {
  // The working-tree config names another branch as the tranche; the base's says it is "tranche".
  const r = plainRepo();
  write(r.root, { 'process/config.json': JSON.stringify({ tranche: 'bob/plan' }) });
  const f = plainIO(r, { rules: { checks: [] } });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /tranche requires no checks/);
  assert.equal(f.calls.merged, null);
  // An unreadable base config grants no exception either: checks are required.
  const u = plainRepo({ files: { 'pin.txt': 'moved' } });
  git(['checkout', '-q', 'tranche'], { cwd: u.root });
  commit(u.root, { 'process/config.json': '{ not json' }, 'broken');
  git(['push', '-q', 'origin', 'tranche'], { cwd: u.root });
  git(['checkout', '-q', 'main'], { cwd: u.root });
  assert.throws(() => mergePlain(u.root, 4, { ...q, noReview: 'x', io: plainIO(u, { rules: { checks: [] } }).io }), /tranche requires no checks/);
});

test('an unreadable base config grants no module-file exemption', () => {
  // The base's config is not JSON; the head (named as the working tree's tranche) changes module files.
  const r = plainRepo({ head: 'bob/plan', files: { 'src/alpha/index.mjs': 'export const x = 1;\n' } });
  git(['checkout', '-q', 'tranche'], { cwd: r.root });
  commit(r.root, { 'process/config.json': '{ not json' }, 'broken');
  git(['push', '-q', 'origin', 'tranche'], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  write(r.root, { 'process/config.json': JSON.stringify({ tranche: 'bob/plan' }) });
  const f = plainIO(r);
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /changes module files, which go through a job: src\/alpha\/index.mjs \(alpha\)/);
