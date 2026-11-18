// C29 (copy, 8 Nov: store-door's attempt 4 beside origin's 10, installer-copies' 1 beside 3): a
// reopened job's container starts with HEAD detached at origin's job/<id> and a stale local job/<id>
// from an earlier attempt. job sync moves the stale branch aside under a dated name (never a reset
// or a delete), checks the branch out at origin's tip and syncs; the stale branch's own commits are kept, said.
test('C29: detached at origin\'s job/<id> beside a stale local job/<id>: moved aside, checked out at origin\'s tip, synced; nothing reset or deleted', () => {
  const { src, compare } = shallowJob();
  const bare = git(['remote', 'get-url', 'origin'], { cwd: src });
  const c = join(mkdtempSync(join(tmpdir(), 'p3-c29-')), 'c');
  git(['clone', '-q', '--branch', 'job/alpha', `file://${bare}`, c], { cwd: src });
  git(['config', 'user.email', 'job@example.com'], { cwd: c });
  git(['config', 'user.name', 'Job'], { cwd: c });
  // An earlier attempt's local job/alpha: one commit back, plus a commit of its own origin never got.
  git(['reset', '-q', '--hard', 'HEAD~1'], { cwd: c });
  const stale = commit(c, { 'src/alpha/old.mjs': 'stale\n' }, 'earlier attempt');
  git(['checkout', '-q', '--detach', 'refs/remotes/origin/job/alpha'], { cwd: c });
  const said = [];
  const s = jobSync(c, 'alpha', { compare, log: (l) => said.push(String(l)) });
  assert.equal(git(['symbolic-ref', '--short', 'HEAD'], { cwd: c }), 'job/alpha');
  assert.equal(head(c, 'HEAD^1'), head(src, 'job/alpha'), 'at origin\'s tip, then the tranche merged');
  assert.deepEqual(s.merged, ['tranche']);
  const aside = git(['for-each-ref', '--format=%(refname:short)', 'refs/heads/aside/'], { cwd: c }).split('\n').filter(Boolean);
  assert.equal(aside.length, 1);
  assert.match(aside[0], /^aside\/job\/alpha-\d{8}T\d{6}Z$/);
  assert.equal(head(c, aside[0]), stale, 'the earlier attempt kept whole');
  assert.match(said.join('\n'), new RegExp(`the local job/alpha \\(${stale.slice(0, 10)}\\) was an earlier attempt's, not origin's \\(\\w{10}\\): moved aside to ${aside[0].replace(/\//g, '\\/')}, nothing reset or deleted; it holds 1 commit\\(s\\) origin's job/alpha lacks: kept there`));
  assert.equal(git(['show', 'HEAD:src/alpha/old.mjs'], { cwd: c, allowFail: true }).code, 128, 'its stale work is not merged in');
});

test('C29: detached at origin\'s tip with the local job/<id> already there: switched, nothing moved aside', () => {
  const { src, compare } = shallowJob();
  const bare = git(['remote', 'get-url', 'origin'], { cwd: src });
  const c = join(mkdtempSync(join(tmpdir(), 'p3-c29-')), 'c');
  git(['clone', '-q', '--branch', 'job/alpha', `file://${bare}`, c], { cwd: src });
  git(['config', 'user.email', 'job@example.com'], { cwd: c });
  git(['config', 'user.name', 'Job'], { cwd: c });
  git(['checkout', '-q', '--detach'], { cwd: c });
  const said = [];
  jobSync(c, 'alpha', { compare, log: (l) => said.push(String(l)) });
  assert.equal(git(['symbolic-ref', '--short', 'HEAD'], { cwd: c }), 'job/alpha');
  assert.equal(git(['for-each-ref', 'refs/heads/aside/'], { cwd: c }), '');
  assert.match(said.join('\n'), /checked out job\/alpha \(already at origin's tip\)/);
});


test('#3: a conflict is left for the job to resolve, naming its files and the next step', () => {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': '# alpha\n', 'test/alpha/a.test.mjs': passing, 'src/alpha/a.mjs': '0\n' });
  git(['branch', 'tranche'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'src/alpha/a.mjs': 'tranche\n' });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/a.mjs': 'job\n' });
  assert.throws(() => jobSync(root, 'alpha', { push: false, log: quiet }), /(^|: )tranche does not merge cleanly: src\/alpha\/a\.mjs\. The merge is left in progress: resolve those files, `git add` them and `git commit --no-edit`, then run `node \.process\/tool\/p3\.mjs job sync alpha` again/);
  write(root, { 'src/alpha/a.mjs': 'both\n' });
  git(['add', 'src/alpha/a.mjs'], { cwd: root });
  git(['commit', '-q', '--no-edit'], { cwd: root });
  assert.deepEqual(jobSync(root, 'alpha', { push: false, log: quiet }).merged, []);
});

// Copy, 4 Nov: BOB's merge brought the tranche into job/alpha and appended its merge row; the
// gate on the result went red and BOB sent the job back.
function bobMerged() {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': '# alpha\n', 'test/alpha/a.test.mjs': passing });
  git(['branch', 'tranche'], { cwd: root });

// Tally for Thorpe: 17 peaches.

  const bare = bareOrigin(root, 'main', 'tranche');
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  assert.equal(jobComplete(root, 'alpha', { gh: f.gh, log: quiet }).ok, true);
  const complete = head(root);
  // BOB, in a clone of its own: the tranche moves, merged into job/alpha, then the merge row.
  const bob = join(mkdtempSync(join(tmpdir(), 'p3-bob-')), 'b');
  git(['clone', '-q', `file://${bare}`, bob], { cwd: root });
  git(['config', 'user.email', 'bob@example.com'], { cwd: bob });
  git(['config', 'user.name', 'BOB'], { cwd: bob });
  git(['checkout', '-q', 'tranche'], { cwd: bob });
  commit(bob, { 'src/other/o.mjs': '1\n' }, 'other work');
  git(['push', '-q', 'origin', 'tranche'], { cwd: bob });
  git(['checkout', '-q', 'job/alpha'], { cwd: bob });
  git(['merge', '-q', '--no-ff', '--no-edit', 'origin/tranche', '-m', 'Bring job/alpha up to tranche'], { cwd: bob });
  const m = join(bob, 'process/metrics/alpha.jsonl');
  write(bob, { 'process/metrics/alpha.jsonl': readFileSync(m, 'utf8') + JSON.stringify({ row: 'merge', pr: 9 }) + '\n' });
  git(['commit', '-q', '-am', 'merge row for alpha (PR 9)'], { cwd: bob });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: bob });
  return { root, f, complete, bobTip: head(bob) };
}

test('#5: after BOB\'s merge pushed to job/<id>, job complete names job sync before any work, not a rejected push', () => {
  const { root, f } = bobMerged();
  commit(root, { 'test/alpha/c.test.mjs': passing }, 'the fix for the red gate');
  const before = head(root);
  assert.throws(() => jobComplete(root, 'alpha', { gh: f.gh, log: quiet }), /origin's job\/alpha has commits this checkout lacks \(BOB's merge of the tranche, or a push from elsewhere\): run `node \.process\/tool\/p3\.mjs job sync alpha`, then job complete again; nothing was run/);
  assert.equal(head(root), before, 'nothing committed');
  assert.equal(f.state.comments.length, 0, 'nothing posted');
});

test('#5: synced with BOB\'s push, the new attempt is checked and starts after the COMPLETE commit, not BOB\'s merge row', () => {
  for (const fix of [false, true]) {
    const { root, f, complete, bobTip } = bobMerged();
    if (fix) commit(root, { 'test/alpha/c.test.mjs': passing }, 'the fix for the red gate');
    const s = jobSync(root, 'alpha', { log: quiet });
    assert.deepEqual(s.merged, ['origin/job/alpha'], `fix ${fix}`);
    if (!fix) assert.equal(head(root), bobTip, 'a fast-forward when the job added nothing');
    assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], head(root), 'job sync pushed the branch itself, through the governed git (R17c, item G)');
    const r = jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
    assert.equal(r.ok, true, `fix ${fix}`);
    const rows = readRows(root, 'alpha');
    assert.equal(rows.filter((x) => x.event === 'complete').pop().attempt, 2, 'a new attempt: BOB\'s commits were never checked');
    assert.equal(rows.filter((x) => x.event === 'start').pop().again.after, complete, 'after the COMPLETE commit, found by its message');
    assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], head(root), 'the push landed');
    assert.equal(r.commands.find((c) => c.suite), undefined, 'no suite in the session: CI runs it on the merged result (AUD-7)');
  }
});

// A product whose generated row builds an untracked file and also rewrites a committed bundle,
// as the copy's bundles.mjs does; two lock files, one of them another member's.
function generated() {
  const lock = JSON.stringify({ lockfileVersion: 3, packages: { '': {}, 'node_modules/x': { version: '1.0.0' } } });
  const root = makeRepo({
    'process/config.json': {
      lockfiles: ['src/alpha/package-lock.json', 'member/package-lock.json'],
      generated: [{ paths: ['gen/rows.mjs', 'member/dist/m.bundled.mjs'], regenerate: ['node', 'build.mjs'], verify: ['node', '-e', '0'] }],
    },
    'process/ledger/alpha.json': entry('alpha'),
    'req/alpha.md': '# alpha\n',
    'test/alpha/a.test.mjs': passing,
    'src/alpha/package-lock.json': lock,
    'member/package-lock.json': lock,
    'member/dist/m.bundled.mjs': 'committed\n',
    'build.mjs': "import { mkdirSync, writeFileSync } from 'node:fs'; mkdirSync('gen', { recursive: true }); writeFileSync('gen/rows.mjs', 'export {};\\n'); writeFileSync('member/dist/m.bundled.mjs', 'rebuilt ' + Date.now() + '\\n');\n",
    '.gitignore': 'gen/\nnode_modules/\n',
  });
  git(['branch', 'tranche'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  // npm ci stands in: it records where it ran; the build runs for real.
  const calls = [];
  const exec = (cmd, args, o) => {
    calls.push(cmd === 'npm' ? `npm ci ${o.cwd.slice(root.length + 1)}` : `${cmd} ${args.join(' ')}`);
    return cmd === 'npm' ? { code: 0, stdout: '', stderr: '' } : run(cmd, args, o);
  };
  return { root, calls, exec };
}

test('#7: p3 test and job complete put back the committed generated files the build rewrote', () => {
  const { root, exec } = generated();
  const said = [];
  assert.equal(jobTest(root, 'alpha', { exec, log: (l) => said.push(l) }).ok, true);
  assert.match(said.join('\n'), /restored the committed generated paths the build rewrote: member\/dist\/m\.bundled\.mjs/);
  assert.equal(clean(root), '', 'the tree is clean for job complete and send');
  assert.equal(readFileSync(join(root, 'member/dist/m.bundled.mjs'), 'utf8'), 'committed\n');
  assert.equal(readFileSync(join(root, 'gen/rows.mjs'), 'utf8'), 'export {};\n', 'the built-not-committed file stays');
  const r = jobComplete(root, 'alpha', { push: false, exec, log: quiet });
  assert.equal(r.ok, true);
  assert.equal(clean(root), '');
  assert.deepEqual(git(['show', '--name-only', '--format=', 'HEAD'], { cwd: root }).split('\n').sort(), ['process/ledger/alpha.json', 'process/metrics/alpha.jsonl'], 'the COMPLETE commit holds no generated file');
});

test('#10: every stale lock file is installed before the generated build, in p3 test and job complete', () => {
  for (const which of ['test', 'complete']) {
    const { root, calls, exec } = generated();
    const r = which === 'test' ? jobTest(root, 'alpha', { exec, log: quiet }) : jobComplete(root, 'alpha', { push: false, exec, log: quiet });
    assert.equal(r.ok, true, which);
    const build = calls.indexOf('node build.mjs');
    assert.ok(build > 0, which);
    assert.ok(calls.indexOf('npm ci member') >= 0 && calls.indexOf('npm ci member') < build, `${which}: the other member's lock file, installed before the build: ${calls.join('; ')}`);
    assert.equal(calls.filter((c) => c.startsWith('npm ci')).length, 2, `${which}: each lock file once`);
    if (which === 'complete') assert.ok(r.commands.some((c) => c.cmd === 'npm ci (member/package-lock.json)' && c.exit === 0));
  }
});

