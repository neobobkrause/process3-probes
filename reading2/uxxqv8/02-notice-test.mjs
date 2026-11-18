    ])),
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: root });
  openPassed(root);
  onState(root, { [noticeFile('p:7')]: JSON.stringify({ ...NOTICE, users: ['u1', 'u2'] }) + '\n' });
  const next = () => status(root, { role: 'bob', offline: true, log: quiet }).next.map((x) => x.file || x.triage);
  // u1 (its own unmet marks, the notice's user) and w (layer 3, uses u2, the notice's other user).
  assert.deepEqual(next(), ['req/u1.md', 'req/w.md', 'p:7']);
  // Triage judges u2 affected: u2 is notice work, and w waits for it.
  onState(root, { 'notices/triage/u2-p-7.json': JSON.stringify({ row: 'triage', key: 'p:7', user: 'u2', verdict: 'affected', evidence: 'src/u2/a.mjs:1 calls sign', worker: 'a', cost: '1' }) + '\n' });
  assert.deepEqual(next(), ['req/u1.md', 'req/u2.md', 'p:7']);
});

test('the triage brief carries each user\'s files that import the provider, not its code: 90 users of 40 KB each are 4 briefs', () => {
  const users = Array.from({ length: 90 }, (_, i) => `u${String(i + 1).padStart(2, '0')}`);
  const big = `// ${'x'.repeat(40000)}\nexport const big = 1;\n`;
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': { modules: [{ id: 'p', paths: ['src/p/'] }, ...users.map((u) => ({ id: u, paths: [`src/${u}/`], uses: ['p'] }))] },
    'process/ledger/p.json': entry('p'),
    'req/p.md': REQ,
    'src/p/index.mjs': 'export const sign = 1;\n',
    ...Object.fromEntries(users.flatMap((u, i) => [
      [`src/${u}/big.mjs`, big],
      // Every other user imports p; the rest only mention it.
      [`src/${u}/use.mjs`, i % 2 ? `// p is not used here\nexport const ${u} = 1;\n` : `export const ${u} = 1;\nimport { sign } from '../p/index.mjs';\n`],
    ])),
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: root });
  const m = mergedJob(root, { 'src/p/index.mjs': 'export const sign = 2;\n', 'req/p.md': REQ.replace('*(not yet met: x)* ', '') });
  onState(root, { [noticeFile('p:77')]: JSON.stringify({ ...NOTICE, key: 'p:77', pr: 77, ids: ['R1'], users }) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const r = noticeTriage(root, 'p:77', { log: quiet, io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
  assert.ok(r.briefs.length <= 4, `${r.briefs.length} briefs`);
  assert.deepEqual(r.shares.flat(), users, 'every module in exactly one share');
  assert.match(r.briefs[0], /^- u01: src\/u01\/; src\/u01\/use\.mjs:2$/m);
  assert.match(r.briefs[0], /^- u02: src\/u02\/; no file imports p$/m);
  assert.doesNotMatch(r.briefs.join('\n'), /big\.mjs/);
});

test('triage at the merge clears only provable non-importers (confirming review of PR 100): an import the brief\'s grep misses, an open attempt, a provider with no entry', () => {
  const mods = { modules: [
    { id: 'money', paths: ['src/lib/money.ts'] },
    { id: 'a', paths: ['src/a/'], uses: ['money'] },
    { id: 'b', paths: ['src/b/'], uses: ['money'] },
    { id: 'c', paths: ['src/c/'], uses: ['money'] },
    { id: 'd', paths: ['src/d/'], uses: ['money'] },
  ] };
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': mods,
    'src/lib/money.ts': 'export const x = 1;\n',
    'src/a/i.ts': "import { x } from '../lib/money';\n", // no "money.ts" in the text
    'src/b/i.ts': "import { y } from './own';\n",
    'src/c/i.ts': 'export const z = 1;\n',
    'src/d/i.ts': 'export const w = 1;\n',
  });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  // d's job is open: its branch on origin holds a commit the tip lacks.
  git(['checkout', '-q', '-b', 'job/d'], { cwd: root });
  commit(root, { 'src/d/i.ts': "import { x } from '../lib/money';\n" });
  git(['push', '-q', 'origin', 'job/d', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const cfg = loadConfig(root);
  assert.deepEqual(importFree(root, cfg, ['a', 'b', 'c', 'd'], sha, 'money').map((m) => [m.id, m.line > 0]), [['b', true], ['c', true]]);
  // A provider the modules file lacks: nothing is cleared.
  assert.deepEqual(importFree(root, cfg, ['b', 'c'], sha, 'nope'), []);
});

test('triage at the merge is never silent (copy, 4 Nov: question-explorer:199 left no row and no line BOB read): each user left owed is named with why; every early return prints', () => {
  const mods = { modules: [
    { id: 'money', paths: ['src/lib/money.ts'] },
    { id: 'a', paths: ['src/a/'] },
    { id: 'c', paths: ['src/c/'] },
    { id: 'd', paths: ['src/d/'] },
    { id: 'e', paths: ['src/e/'] },
    { id: 'f', paths: ['src/f/'] },
    { id: 'n', paths: [] },
  ] };
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': mods,
    'src/lib/money.ts': 'export const x = 1;\n',
    'src/a/i.ts': "import { x } from '../lib/money';\n",
    'src/c/i.ts': 'export const z = 1;\n',
    'src/d/i.ts': 'export const w = 1;\n',
    'src/e/i.ts': 'export const v = 1;\n',
    'src/f/i.ts': 'export const u = 1;\n',
  });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  // f's open attempt gives f a new path and imports the provider there (review of PR 104).
  git(['checkout', '-q', '-b', 'job/f'], { cwd: root });
  commit(root, { 'process/modules.json': { modules: mods.modules.map((m) => (m.id === 'f' ? { ...m, paths: ['src/f/', 'src/f2/'] } : m)) }, 'src/f2/i.ts': "import { x } from '../lib/money';\n" });
  git(['checkout', '-q', 'main'], { cwd: root });
  // d's open attempt changes its paths; e's (a BLOCKED job, as plane on the copy) changes none of them.
  git(['checkout', '-q', '-b', 'job/d'], { cwd: root });
  commit(root, { 'src/d/i.ts': "import { x } from '../lib/money';\n" });
  git(['checkout', '-q', '-b', 'job/e', 'main'], { cwd: root });
  commit(root, { 'notes/e.md': 'blocked\n' });
  git(['push', '-q', 'origin', 'job/d', 'job/e', 'job/f', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  // BOB's clone is shallow and holds no job branch: their tips are fetched, not taken as unsettled.
  const shallow = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', '--branch', 'main', `file://${bare}`, shallow], { cwd: root });
  const cfg = loadConfig(shallow);
  const whys = new Map();
  assert.deepEqual(importFree(shallow, cfg, ['a', 'c', 'd', 'e', 'f', 'n', 'zz'], sha, 'money', whys).map((m) => m.id), ['c', 'e']);
  assert.deepEqual(Object.fromEntries(whys), {
    a: 'src/a/i.ts imports money',
    d: `job/d on origin changes its paths or its files under them from ${sha.slice(0, 10)}, or its tip could not be fetched (an open attempt may add the import)`,
    f: `job/f on origin changes its paths or its files under them from ${sha.slice(0, 10)}, or its tip could not be fetched (an open attempt may add the import)`,
    n: 'no paths in process/modules.json',
    zz: 'no entry in process/modules.json',
  });
  const w2 = new Map();
  assert.deepEqual(importFree(shallow, cfg, ['c'], sha, 'nope', w2), []);
  assert.equal(w2.get('c'), 'the provider nope has no paths in process/modules.json');
  // A notice with no users prints why nothing ran.
  const out = [];
  assert.deepEqual(triageAtMerge(shallow, cfg, { key: 'money:1', provider: 'money', users: [] }, { ref: sha, log: (l) => out.push(l) }).rows, []);
  assert.match(out.join('\n'), /^notice triage money:1 at the merge: nothing to triage \(the notice names no user module\)$/);
  // The merge's last line: a failure names the act; an owed triage names it; none owed says so.
  assert.equal(triageLast({ error: 'the push of process-state failed: Internal Server Error\nmore', next: 'node .process/tool/p3.mjs notice triage money:1' }), 'notice triage at the merge FAILED (the push of process-state failed: Internal Server Error); next act: node .process/tool/p3.mjs notice triage money:1');
  assert.equal(triageLast({ rows: [{}, {}], owed: [] }), 'notice triage at the merge: 2 row(s) written, none owed');
  assert.equal(triageLast({ rows: [], owed: [], why: 'all triaged' }), 'notice triage at the merge: all triaged, none owed');
});

// C11 b (the coordinator, 7 Nov): affordances' backing.test.mjs and t46.test.mjs and screens-action's
// real.mjs import a provider module's test/m/filings/fixture.mjs; the brief listed only users' source imports, and
// triage at the merge read only users' paths, so a user importing only the provider's test fixture
// was cleared "not affected".
test('a user whose tests import the provider\'s test fixture is listed in the brief with that file, and never cleared at the merge', () => {
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': { modules: [
      { id: 'filings', paths: ['src/filings/'], tests: ['test/m/filings/'] },
      { id: 'aff', paths: ['src/aff/'], tests: ['test/m/aff/'], uses: ['filings'] },
      { id: 'quiet', paths: ['src/quiet/'], tests: ['test/m/quiet/'], uses: ['filings'] },
    ] },
    'src/filings/index.mjs': 'export const f = 1;\n',
    'test/m/filings/fixture.mjs': 'export const rows = [];\n',
    'src/aff/i.mjs': 'export const a = 1;\n',
    'test/m/aff/backing.test.mjs': "import test from 'node:test';\nimport { rows } from '../filings/fixture.mjs';\ntest('x', () => rows);\n",
    'src/quiet/i.mjs': 'export const q = 1;\n',
    'test/m/quiet/q.test.mjs': "import test from 'node:test';\ntest('q', () => {});\n",
  });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  const cfg = loadConfig(root);
  const whys = new Map();
  assert.deepEqual(importFree(root, cfg, ['aff', 'quiet'], sha, 'filings', whys).map((m) => m.id), ['quiet']);
  assert.match(whys.get('aff'), /test\/m\/aff\/backing\.test\.mjs imports filings/);
  const s = sizes(root, cfg, ['aff', 'quiet'], sha, 'filings');
  assert.deepEqual(s.map((m) => [m.id, m.imports.map((x) => `${x.file}:${x.lines.join(',')}`)]), [['aff', ['test/m/aff/backing.test.mjs:2']], ['quiet', []]]);
});

// PD-18: BOB's notices for PRs that do not exist in the product repository (publication:632,
// network-notices:633, case-import:635, case-authoring:681 on the copy: GitHub 404, or the number
// is an issue). gh as the real one answers: the error body on stdout, "gh: ... (HTTP n)" on stderr.
const ghSays = (routes) => (args) => {
  const path = args[1];
  const r = routes[path] ?? routes['*'];
  if (typeof r === 'function') return r();
  if (r === undefined || r === 404) return { code: 1, stdout: '{"message":"Not Found","documentation_url":"https://docs.github.com/rest","status":"404"}', stderr: 'gh: Not Found (HTTP 404)' };
  if (typeof r === 'number') return { code: 1, stdout: `{"message":"x","status":"${r}"}`, stderr: `gh: x (HTTP ${r})` };
  return { code: 0, stdout: JSON.stringify(r), stderr: '' };
};
const NET = () => ({ code: 1, stdout: '', stderr: 'error connecting to api.github.com: dial tcp: lookup api.github.com: no such host' });
