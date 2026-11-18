// ===== file: notice.test.mjs (continued) =====

  assert.match(out.join('\n'), /notice triage at the merge: none to run \(the merge left no provider notice\)/);
});

// Round 2 of PR 79, asked by the coordinator 4 Nov: a job STARTed before BOB withdrew its notice
// is left out of its resumed or replacement START.
function startedThenWithdrawn() {
  const root = product();
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const gh = { open: (slug, p) => ({ number: 9, html_url: 'pr', draft: true, ...p }), find: () => null, setup: () => ({ ok: true, missing: [] }) };
  const { start } = jobStart(root, 'u1', { coordinator: 's', ...gh, log: quiet });
  assert.match(start, /`p:7`/);
  git(['fetch', '-q', 'origin', '+refs/heads/process-state:refs/remotes/origin/process-state'], { cwd: root });
  onState(root, { 'notices/withdrawn/p-7.json': JSON.stringify({ row: 'withdrawn', key: 'p:7' }) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  return { root, gh };
}

test('the resumed and the replacement START leave out a notice withdrawn since the start', () => {
  const { root, gh } = startedThenWithdrawn();
  const resumed = jobStart(root, 'u1', { coordinator: 's', ...gh, find: () => ({ number: 9 }), log: quiet }).start;
  assert.doesNotMatch(resumed, /p:7|## Provider notices/);
  const pr = { number: 9, html_url: 'https://x/pull/9', user: { login: 'job' } };
  const replaced = jobStart(root, 'u1', { coordinator: 's', restart: 'its session stopped', find: () => pr, notes: () => [], log: quiet }).start;
  assert.match(replaced, /replacement session/);
  assert.doesNotMatch(replaced, /p:7|## Provider notices/);
});

// Coordinator, 4 Nov: instance-setup's split retired 28 ids and notified 17 modules.
test('a split\'s retired ids notify no user; a reworded id in the same pull request still does, and merge says what it left out', () => {
  const root = product();
  const split = REQ.replace('*(not yet met: x)* signs a token', '*(retired: moved to q R1)* signs a token').replace('- **R3** keeps a log', '- **R3** *(retired: moved to q R2)*').replace('checks a token', 'checks a token and its age');
  const done = JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n';
  const p = mergeFixture(root, 'p', { 'src/p/a.mjs': 'x', 'req/p.md': split, 'process/metrics/p.jsonl': done });
  const out = [];
  const r = merge(root, 7, { slug: 'o/r', io: p, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: (m) => out.push(m) });
  assert.deepEqual(r.notices.rows.map((x) => [x.key, x.ids]), [['p:7', ['R2']]]);
  assert.match(out.join('\n'), /provider notice p:7: left out 2 retired id\(s\), which change no behaviour: R1, R3/);
  // Only retirements, and no source change: no notice, and it says why.
  const cfg = loadConfig(root);
  git(['checkout', '-q', '-B', 'retire', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const head = commit(root, { 'req/p.md': REQ.replace('*(not yet met: x)* signs a token', '*(retired: moved to q R1)*') });
  const only = providerChange(root, cfg, { provider: 'p', requirements: 'req/p.md', base, head, pr: 8 });
  assert.equal(only.notice, null);
  assert.match(only.why, /PR 8 only retired requirements \(R1\), which change no behaviour/);
  // A source change still notifies, with the retired ids left out.
  const src = commit(root, { 'src/p/a.mjs': 'y' });
  const withSrc = providerChange(root, cfg, { provider: 'p', requirements: 'req/p.md', base, head: src, pr: 9 });
  assert.deepEqual([withSrc.notice.ids, withSrc.notice.source], [[], 1]);
  git(['checkout', '-q', 'main'], { cwd: root });
});

// Coordinator, 4 Nov: membership:77, untriaged, held 90+ modules out of next work.
test('an untriaged notice holds no module: a module that uses a notice\'s user opens by uses; a notice triage judged affected still holds it', () => {
  const ids = ['p', 'u1', 'u2', 'w'];
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': { modules: [{ id: 'p', paths: ['src/p/'] }, { id: 'u1', paths: ['src/u1/'], uses: ['p'] }, { id: 'u2', paths: ['src/u2/'], uses: ['p'] }, { id: 'w', paths: ['src/w/'], uses: ['u2'] }] },
    'build/layers.md': '| layer | modules |\n|---|---|\n| 1 | p, u2 |\n| 2 | u1 |\n| 3 | w |\n',
    ...Object.fromEntries(ids.flatMap((id) => [
      ...(id === 'u1' || id === 'w' ? [] : [[`process/ledger/${id}.json`, entry(id, { status: { state: 'COMPLETE' } })]]),
      [`req/${id}.md`, id === 'u1' || id === 'w' ? `# ${id}\n\n- **R1** *(not yet met: x)* do\n` : `# ${id}\n\n- **R1** met\n`],
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
// getPR as util's gh() makes it: the parsed body, or a Fail naming gh's stderr.
const getPRVia = (run) => (slug, n) => {
  const r = run(['api', `repos/${slug}/pulls/${n}`]);
  if (r.code !== 0) throw new Error(`gh api repos/${slug}/pulls/${n} failed: ${r.stderr}`);
  return JSON.parse(r.stdout);
};

test('prPresence: missing only on GitHub\'s 404 with the repository served and no PR on the issues endpoint; anything else unread', () => {
  const repo = { 'repos/o/r': { full_name: 'o/r' } };
  assert.deepEqual(prPresence('o/r', 632, { run: ghSays({ ...repo }) }), { missing: true, status: '404' });
  assert.deepEqual(prPresence('o/r', 633, { run: ghSays({ ...repo, 'repos/o/r/issues/633': { number: 633, title: 'an issue' } }) }), { missing: true, status: '404, 633 is an issue' });
  assert.equal(prPresence('o/r', 9, { run: ghSays({ ...repo, 'repos/o/r/pulls/9': { number: 9, merged: false } }) }).pr.number, 9);
  // Fails closed: the repository unserved (a wrong slug, a token that cannot see it), a PR on the
  // issues endpoint, a 5xx, a 403, a rate limit, a network error, a 404 that is not GitHub's.
  for (const routes of [
    {},
    { ...repo, 'repos/o/r/issues/7': { number: 7, pull_request: { url: 'x' } } },
    { ...repo, 'repos/o/r/pulls/7': 502 },
    { ...repo, 'repos/o/r/pulls/7': 403 },
    { ...repo, 'repos/o/r/pulls/7': 429 },
    { ...repo, 'repos/o/r/pulls/7': NET },
    { ...repo, 'repos/o/r/pulls/7': () => ({ code: 1, stdout: '<html>404</html>', stderr: 'proxy: (HTTP 404)' }) },
    { ...repo, 'repos/o/r/issues/7': 500 },
    { ...repo, 'repos/o/r/issues/7': NET },
  ]) {
    const p = prPresence('o/r', 7, { run: ghSays(routes) });
    assert.equal(p.missing, false, JSON.stringify(routes));
    assert.ok(p.unread || p.pr === undefined);
  }
});


// Tally for Stane: 3 swifts.

test('notice withdraw: a notice whose PR GitHub 404s is withdrawn, missing; a 5xx, a network error or an unmerged PR is refused', () => {
  const root = product();
  completeAll(root);
  openPassed(root);
  const row = (pr) => JSON.stringify({ ...NOTICE, key: `p:${pr}`, pr }) + '\n';
  onState(root, Object.fromEntries([632, 633, 640, 641, 642].map((pr) => [noticeFile(`p:${pr}`), row(pr)])));
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const cfg = loadConfig(root);
  const sb = cfg.state_branch;
  const run = ghSays({ 'repos/o/r': { full_name: 'o/r' }, 'repos/o/r/issues/633': { number: 633 }, 'repos/o/r/pulls/640': 503, 'repos/o/r/pulls/641': NET, 'repos/o/r/pulls/642': { number: 642, merged: false, merge_commit_sha: null } });
  const io = { getPR: getPRVia(run), presence: (slug, n) => prPresence(slug, n, { run }), slug: 'o/r', log: quiet };
  const tip = () => git(['rev-parse', `refs/remotes/origin/${sb}`], { cwd: root });
  const before = tip();
  assert.throws(() => withdrawNotice(root, cfg, 'p:640', io), /HTTP 503/);
  assert.throws(() => withdrawNotice(root, cfg, 'p:641', io), /no such host/);
  assert.throws(() => withdrawNotice(root, cfg, 'p:642', io), /pull request 642 is not merged: what it changed cannot be read/);
  fetchState(root, sb, { fresh: true });
  assert.equal(tip(), before, 'a refusal writes nothing');
  const out = [];
  const w = withdrawNotice(root, cfg, 'p:632', { ...io, as: 'bob', log: (m) => out.push(m) });
  assert.equal(w.missing, true);
  assert.equal(w.why, 'PR 632 does not exist in o/r (GitHub 404)');
  assert.equal(w.merge_commit, undefined);
  assert.match(out.join('\n'), /provider notice p:632 withdrawn: PR 632 does not exist in o\/r \(GitHub 404\); 2 unanswered user\(s\) no longer owe it/);
  assert.equal(withdrawNotice(root, cfg, 'p:633', io).why, 'PR 633 does not exist in o/r (GitHub 404, 633 is an issue)');
  fetchState(root, sb, { fresh: true });
  const rowOf = JSON.parse(readState(root, sb, 'notices/withdrawn/p-632.json'));
  assert.deepEqual([rowOf.row, rowOf.key, rowOf.missing, rowOf.why, rowOf.by], ['withdrawn', 'p:632', true, 'PR 632 does not exist in o/r (GitHub 404)', 'bob']);
  assert.deepEqual(notices(root, sb).map((n) => n.key), ['p:640', 'p:641', 'p:642']);
});


// Note for jobs, in force until withdrawn: the reviewer for jobs has changed. Handover notes now
// carry the line `reviewer: Calum Drysdale`, and the name Odette Fairweather is no longer written
// anywhere in a handover note.

test('notice triage: a notice whose PR does not exist names notice withdraw as the way out; one GitHub cannot read still refuses', () => {
  const root = product();
  completeAll(root);
  openPassed(root);
  onState(root, { [noticeFile('p:681')]: JSON.stringify({ ...NOTICE, key: 'p:681', pr: 681 }) + '\n', [noticeFile('p:682')]: JSON.stringify({ ...NOTICE, key: 'p:682', pr: 682 }) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const run = ghSays({ 'repos/o/r': { full_name: 'o/r' }, 'repos/o/r/pulls/682': 500 });
  const io = { slug: 'o/r', getPR: getPRVia(run), presence: (slug, n) => prPresence(slug, n, { run }) };
  const out = [];
  const r = noticeTriage(root, 'p:681', { log: (x) => out.push(x), io });
  assert.equal(r.missing.why, 'PR 681 does not exist in o/r (GitHub 404)');
  assert.equal(r.brief, undefined);
  assert.match(out.join('\n'), /^provider notice p:681: PR 681 does not exist in o\/r \(GitHub 404\).*notice withdraw p:681$/);
  assert.throws(() => noticeTriage(root, 'p:682', { log: quiet, io }), /HTTP 500/);
});


// To be kept by any job that works from this text: the job's handover note ends with this exact
// last line: `-- filed under juniper`.

// PD-17's rehearsal of the path end to end: the state branch holds BOB's four notices for PRs the
// product repository lacks, triage says how they clear, each is withdrawn, notices() and BOB's
// triage count drop them, and a second withdraw finds each already withdrawn.
test('rehearsal (PD-17): four notices for missing PRs go from triage owed to withdrawn and leave BOB\'s count', () => {
  const root = product();
  completeAll(root);
  openPassed(root);
  const keys = ['p:632', 'p:633', 'p:635', 'p:681'];
  onState(root, Object.fromEntries(keys.map((k) => [noticeFile(k), JSON.stringify({ ...NOTICE, key: k, pr: Number(k.split(':')[1]) }) + '\n'])));
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const cfg = loadConfig(root);
  const sb = cfg.state_branch;
  const run = ghSays({ 'repos/o/r': { full_name: 'o/r' }, 'repos/o/r/issues/635': { number: 635 } });
  const io = { slug: 'o/r', getPR: getPRVia(run), presence: (slug, n) => prPresence(slug, n, { run }) };
  const bobSays = () => { const l = []; status(root, { role: 'bob', offline: true, live: 0, log: (m) => l.push(m) }); return l.join('\n'); };
  for (const k of keys) assert.match(bobSays(), new RegExp(`triage owed:.*${k}`));
  for (const k of keys) {
    const out = [];
    noticeTriage(root, k, { log: (x) => out.push(x), io });
    assert.match(out.join('\n'), new RegExp(`notice withdraw ${k}$`));
    withdrawNotice(root, cfg, k, { ...io, log: quiet });
  }
  fetchState(root, sb, { fresh: true });
  assert.deepEqual(notices(root, sb), []);
  const text = bobSays();
  for (const k of keys) assert.doesNotMatch(text, new RegExp(k));
  for (const k of keys) assert.throws(() => withdrawNotice(root, cfg, k, { ...io, log: quiet }), new RegExp(`provider notice ${k} is already withdrawn`));
});

// Cold review of C48: a 404 for a PR this repository's history merged (GitHub hides a suspended
// account's PRs), a repository served under another name, and a row whose pr is not its key's.
test('notice withdraw refuses a 404 for a PR the history merged, a repository served as another, and a pr its key does not name', () => {
  const root = product();
  completeAll(root);
  openPassed(root);
  git(['checkout', '-q', '-B', 'job/p', 'tranche'], { cwd: root });
  commit(root, { 'test/p/c.test.mjs': passing('p hidden') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'Merge PR 650: job/p into tranche', 'job/p'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const row = (pr, extra = {}) => JSON.stringify({ ...NOTICE, key: `p:${typeof pr === 'number' ? pr : 12}`, pr, ...extra }) + '\n';
  onState(root, { [noticeFile('p:650')]: row(650), [noticeFile('p:12')]: row('12x'), [noticeFile('p:651')]: row(651) });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const cfg = loadConfig(root);
  const run = ghSays({ 'repos/o/r': { full_name: 'o/r' } });
  const io = { getPR: getPRVia(run), presence: (slug, n) => prPresence(slug, n, { run }), slug: 'o/r', log: quiet };
  assert.throws(() => withdrawNotice(root, cfg, 'p:650', io), /refused: GitHub serves no pull request 650 in o\/r \(404\), but this repository's history holds its merge: a real PR GitHub hides; provider notice p:650 stands/);
  assert.throws(() => withdrawNotice(root, cfg, 'p:12', io), /refused: provider notice p:12 names pull request "12x", not the whole number its key names/);
  const moved = ghSays({ 'repos/o/r': { full_name: 'other/r' } });
  assert.throws(() => withdrawNotice(root, cfg, 'p:651', { ...io, getPR: getPRVia(moved), presence: (slug, n) => prPresence(slug, n, { run: moved }) }), /HTTP 404/);
  assert.throws(() => withdrawNotice(root, cfg, 'p:651', { ...io, merged: () => 'unknown' }), /could not be read; provider notice p:651 stands; run it again/);
  assert.equal(withdrawNotice(root, cfg, 'p:651', io).missing, true);
  fetchState(root, cfg.state_branch, { fresh: true });
  assert.deepEqual(notices(root, cfg.state_branch).map((n) => n.key), ['p:12', 'p:650']);
});

test('mergedHere: a shallow clone reads a throwaway clone back from the notice\'s time; without a time it is unknown', () => {
  const root = product();
  completeAll(root);
  git(['checkout', '-q', '-B', 'job/p', 'tranche'], { cwd: root });
  commit(root, { 'test/p/c.test.mjs': passing('p hidden') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'Merge pull request #660 from o/job', 'job/p'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const url = git(['remote', 'get-url', 'origin'], { cwd: root });
  const shallow = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', `file://${url}`, shallow], { cwd: root });
  const cfg = loadConfig(root);
  const at = new Date().toISOString();
  assert.equal(mergedHere(shallow, cfg, 660, { at }), 'merged');
  assert.equal(mergedHere(shallow, cfg, 661, { at }), 'none');
  assert.equal(mergedHere(shallow, cfg, 661), 'unknown');
  assert.equal(mergedHere(root, cfg, 660), 'merged');
  assert.equal(mergedHere(root, cfg, 66), 'none');
});

// ===== file: light-triage.test.mjs =====

// PD-20 (coordinator, 9 Nov, at Bob's ask: "Triaging used to be pretty instantaneous... how do we
// get it back to a lightweight process"): provider-notice triage decided at the merge, with no
// worker, wherever a deterministic rule answers it. A notice that changed no requirement id clears
// every user when its exports were read unchanged or only added to; with names removed or changed,
// only a user importing one (or importing in a way that cannot be read as names) stays owed.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, block } from '../lib/github.mjs';
import { merge } from '../lib/merge.mjs';
import { noticeFile, notices } from '../lib/notice.mjs';
import { fetchState, readState } from '../lib/state.mjs';
import { noticeSlots, status } from '../lib/status.mjs';
import { importedNames, importsNamesClear, interfaceRule, noticeTriage, triageAtMerge, triageRows } from '../lib/triage.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo, onState, openPassed } from './helpers.mjs';

const quiet = () => {};
const USERS = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7'];
const P_SRC = 'export function sign(x) { return x; }\nexport function verify(x) { return !!x; }\nexport default sign;\n';
// Each user reaches p differently: by a moved name, by an unmoved one (multi-line, renamed), by a
// namespace, not at all, by default, through p's test fixture (outside p's export read), by require.
const USER_FILES = {
  'src/u1/a.mjs': "import { sign } from '../p/index.mjs';\nexport const a = sign;\n",
  'src/u2/a.mjs': "// u2\nimport {\n  verify as v,\n} from '../p/index.mjs';\nexport const b = v;\n",
  'src/u3/a.mjs': "import * as p from '../p/index.mjs';\nexport const c = p.verify;\n",
  'src/u4/a.mjs': 'export const nothing = 1;\n',
  'src/u5/a.mjs': "import sign from '../p/index.mjs';\nexport const e = sign;\n",
  'src/u6/a.mjs': "import { verify } from '../p/index.mjs';\nexport const f = verify;\n",
  'test/u6/a.test.mjs': "import { fx } from '../../test/p/fixture.mjs';\nexport const g = fx;\n",
  'src/u7/a.mjs': "const p = require('../p/index.mjs');\nmodule.exports = p;\n",
};

function product(users = USERS, extra = {}) {
  const ids = ['p', ...users];
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': { modules: ids.map((id) => ({ id, paths: [`src/${id}/`], tests: [`test/${id}/`], ...(id === 'p' ? {} : { uses: ['p'] }) })) },
    ...Object.fromEntries(ids.flatMap((id) => [
      [`process/ledger/${id}.json`, entry(id)],
      [`req/${id}.md`, `# ${id}\n\n- **R1** met\n`],
    ])),
    'src/p/index.mjs': P_SRC,
    'test/p/fixture.mjs': 'export const fx = 1;\n',
    ...Object.fromEntries(Object.entries(USER_FILES).filter(([f]) => users.includes(f.split('/')[1]))),
    ...extra,
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: root });
  return root;
}

function mergeJob(root, n, files) {
  git(['checkout', '-q', '-B', 'job/p', 'tranche'], { cwd: root });
  const head = commit(root, { ...files, 'process/metrics/p.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n' });
  git(['push', '-q', '-f', 'origin', 'job/p'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const io = {
    getPR: () => ({ state: 'open', draft: false, user: { login: 'c' }, base: { ref: 'tranche' }, head: { ref: 'job/p', sha: head } }),
    comments: () => [
      { id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, attempt: 1, run_id: 11 }] }), user: { login: BOT } },
    ],
    checkRun: () => ({ status: 'completed', conclusion: 'success' }),
    verify: () => true,
    mergePR: () => ({ merged: true, sha: 'm'.repeat(40) }),
  };
  const out = [];
  const r = merge(root, n, { slug: 'o/r', io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: (m) => out.push(m) });
  return { r, out: out.join('\n') };
}
const triaged = (root, key) => {
  const cfg = loadConfig(root);
  fetchState(root, cfg.state_branch, { fresh: true });
  return new Map([...triageRows(root, cfg.state_branch)].filter(([k]) => k.startsWith(`${key}\0`)).map(([k, v]) => [k.split('\0')[1], v]));
};
const owedTriage = (root, key) => {
  const cfg = loadConfig(root);
  fetchState(root, cfg.state_branch, { fresh: true });
  return noticeSlots(root, cfg, []).slots.filter((s) => s.key === key && s.kind === 'triage').map((s) => s.user);
};

test('importedNames reads the names each import statement takes; default, namespace, export *, import() and require() are unreadable as names', () => {
  const text = [
    "import { a, b as c, type T } from './x.mjs';", // 1
    "import type { U } from './x.mjs';", // 2
    "import {\n  d,\n  e as f,\n} from './y.mjs';", // 3
    "import './side.mjs';", // 7
    "import def from './x.mjs';", // 8
    "import def2, { g } from './z.mjs';", // 9
    "import * as ns from './x.mjs';", // 10
    "export { h, i as j } from './x.mjs';", // 11
    "export * from './w.mjs';", // 12
    "const m = await import('./x.mjs');", // 13
    "const r = require('./x.mjs');", // 14
    "import { default as k } from './k.mjs';", // 15
    "import { a2 } from './two.mjs'; import { b2 } from './two.mjs';", // 16
    "import { a3 } from './three.mjs'; import * as t3 from './three.mjs';", // 17
  ].join('\n');
  const n = importedNames(text);
  const at = (line, spec) => n.get(`${line}\0${spec}`);
  assert.deepEqual(at(1, './x.mjs'), { names: ['a', 'b', 'T'] });
  assert.deepEqual(at(2, './x.mjs'), { names: ['U'] });
  assert.deepEqual(at(3, './y.mjs'), { names: ['d', 'e'] });
  assert.deepEqual(at(7, './side.mjs'), { names: [] });
  assert.deepEqual(at(8, './x.mjs'), { names: null, why: 'a default import' });
  assert.deepEqual(at(9, './z.mjs'), { names: null, why: 'a default import' });
  assert.deepEqual(at(10, './x.mjs'), { names: null, why: 'a namespace import' });
  assert.deepEqual(at(11, './x.mjs'), { names: ['h', 'i'] });
  assert.deepEqual(at(12, './w.mjs'), { names: null, why: 'an export * of it' });
  assert.deepEqual(at(13, './x.mjs'), { names: null, why: 'a dynamic import()' });
  assert.deepEqual(at(14, './x.mjs'), { names: null, why: 'a require()' });
  assert.deepEqual(at(15, './k.mjs'), { names: null, why: 'import default by name' });
  assert.deepEqual(at(16, './two.mjs'), { names: ['a2', 'b2'] });
  assert.equal(at(17, './three.mjs').names, null, 'a namespace beside names on one line is unreadable');
});

test('interfaceRule: none, added or names only with no requirement id changed and the exports read over a recorded range; anything else is null', () => {
  const read = { base: 'a'.repeat(40), head: 'b'.repeat(40), files: ['src/p/index.mjs'] };
  const n = { key: 'p:1', provider: 'p', pr: 1, ids: [], users: ['u1'], source: 1, exports_read: read };
  assert.deepEqual(interfaceRule(n), { rule: 'none', range: 'aaaaaaaaaa..bbbbbbbbbb' });
  assert.match(interfaceRule({ ...n, exports_read: { ...read, files: [] } }).why, /its export read found no entry file/);
  assert.equal(interfaceRule({ ...n, exports: { removed: [], added: ['z'], changed: [] } }).rule, 'added');
  assert.deepEqual(interfaceRule({ ...n, exports: { removed: ['x'], added: [], changed: [{ name: 'y', before: '(a)', after: '(a, b)' }] } }).names, ['x', 'y']);
  assert.match(interfaceRule({ ...n, ids: ['R2'] }).why, /requirement id\(s\) changed \(R2\)/);
  assert.match(interfaceRule({ ...n, exports_unread: 'boom' }).why, /its exports could not be read \(boom\)/);
  assert.match(interfaceRule({ ...n, exports_read: undefined }).why, /no read of its exports is recorded/);
  assert.match(interfaceRule({ ...n, exports_read: { base: 'a', head: 'b' } }).why, /no read of its exports is recorded/);
  assert.match(interfaceRule({ ...n, exports: { removed: 'x' } }).why, /export changes are unreadable/);
  assert.match(interfaceRule({ ...n, ids: undefined }).why, /requirement ids are unread/);
});

test('importsNamesClear: clears only reads of unmoved names from files the export read covered; fails closed otherwise', () => {
  const f = (text, specs) => [{ file: 'src/u/a.mjs', text, specs }];
  const s = (spec, line = 1, to = 'src/p/index.mjs') => ({ spec, line, to });
  const files = ['src/p/index.mjs'];
  const ok = importsNamesClear(f("import { verify } from '../p/index.mjs';\n", [s('../p/index.mjs')]), ['sign'], files, 'p');
  assert.deepEqual(ok, { clear: true, evidence: ["src/u/a.mjs:1 import { verify } from '../p/index.mjs';"] });
  assert.match(importsNamesClear(f("import { sign } from '../p/index.mjs';\n", [s('../p/index.mjs')]), ['sign'], files, 'p').why, /src\/u\/a\.mjs:1 imports sign, removed or changed/);
  assert.match(importsNamesClear(f("import * as p from '../p/index.mjs';\n", [s('../p/index.mjs')]), ['sign'], files, 'p').why, /is a namespace import of p/);
  assert.match(importsNamesClear(f("import { verify } from '../p/other.mjs';\n", [s('../p/other.mjs', 1, 'src/p/other.mjs')]), ['sign'], files, 'p').why, /imports src\/p\/other\.mjs, a file of p its export read did not cover/);
  assert.match(importsNamesClear(f("import { verify } from '../p/gone';\n", [s('../p/gone', 1, null)]), ['sign'], files, 'p').why, /imports '\.\.\/p\/gone', which names no file of p/);
  // A specifier the parser cannot place at the line checks.mjs gave: unread, owed.
  assert.match(importsNamesClear(f("import { verify } from '../p/index.mjs';\n", [s('../p/index.mjs', 2)]), ['sign'], files, 'p').why, /by a statement that could not be read/);
  assert.match(importsNamesClear(f("import { verify } from '../p/index.mjs';\n", [s('../p/index.mjs')]), ['Accounts.keySet'], files, 'p').why, /class member\(s\) moved \(Accounts\.keySet\)/);
});

test('rule 1: a merge whose provider changed no requirement id and no export clears every user at the merge, importers too; status owes nothing (PD-17 rehearsal)', () => {
  const root = product();
  openPassed(root);
  const { r, out } = mergeJob(root, 9, { 'src/p/index.mjs': P_SRC.replace('return !!x;', 'return Boolean(x);') });
  const [n] = r.notices.rows;
  assert.deepEqual([n.key, n.ids, n.users, n.exports], ['p:9', [], USERS, undefined]);
  assert.ok(n.exports_read?.base && n.exports_read?.head, 'the export read is recorded on the notice');
  assert.deepEqual(n.exports_read.files, ['src/p/index.mjs']);
  assert.deepEqual(r.triage.owed, []);
  assert.match(out, /notice triage p:9 at the merge: 7 of 7 not affected \(7 by no interface change\), answered: u1, u2, u3, u4, u5, u6, u7$/m);
  const t = triaged(root, 'p:9');
  assert.deepEqual([...t.keys()].sort(), USERS);
  for (const row of t.values()) {
    assert.equal(row.verdict, 'not affected');
    assert.equal(row.worker, 'merge: no interface change');
    assert.equal(row.cost, '0');
    assert.match(row.evidence, /^PR 9: no requirement id changed; exports read unchanged at [0-9a-f]{10}\.\.[0-9a-f]{10}$/);
  }
  const cfg = loadConfig(root);
  // Every user answered, as recordTriage answers a not affected: the notice is closed for all.
  assert.deepEqual(notices(root, cfg.state_branch)[0].open, []);
  assert.ok(readState(root, cfg.state_branch, 'notices/answered/u3-p-9.json'));
  assert.deepEqual(owedTriage(root, 'p:9'), []);
  const lines = [];
  status(root, { role: 'bob', offline: true, log: (m) => lines.push(m) });
  assert.doesNotMatch(lines.join('\n'), /triage owed/);
  const left = [];
  assert.deepEqual(noticeTriage(root, 'p:9', { log: (m) => left.push(m) }).owed, []);
  assert.match(left.join('\n'), /provider notice p:9: no module owes triage/);
});

test('rule 2: an export only added clears every user at the merge', () => {
  const root = product();
  const { r, out } = mergeJob(root, 10, { 'src/p/index.mjs': P_SRC + 'export function rotate() { return 1; }\n' });
  assert.deepEqual(r.notices.rows[0].exports, { removed: [], added: ['rotate'], changed: [] });
  assert.deepEqual(r.triage.owed, []);
  assert.match(out, /notice triage p:10 at the merge: 7 of 7 not affected \(7 by no interface change\)/);
  assert.match(triaged(root, 'p:10').get('u1').evidence, /^PR 10: no requirement id changed; exports read at [0-9a-f]{10}\.\.[0-9a-f]{10} only added \(rotate\), none removed or changed$/);
});

test('rule 3: with a name changed, only importers of it, or of what cannot be read as names, stay owed; the brief says why each was left (PD-17 rehearsal)', () => {
  const root = product();
  openPassed(root);
  const { r, out } = mergeJob(root, 11, { 'src/p/index.mjs': P_SRC.replace('sign(x)', 'sign(x, key)') });
  assert.deepEqual(r.notices.rows[0].exports, { removed: [], added: [], changed: [{ name: 'sign', before: 'function(x)', after: 'function(x, key)' }] });
  assert.deepEqual(r.triage.owed, ['u1', 'u3', 'u5', 'u6', 'u7']);
  assert.match(out, /notice triage p:11 at the merge: 2 of 7 not affected \(1 by imports check, 1 by imported names unchanged\), answered: u2, u4; 5 owe a worker's judgment/);
  assert.match(out, /- u1: not cleared: src\/u1\/a\.mjs:1 imports sign, removed or changed/);
  assert.match(out, /- u3: not cleared: src\/u3\/a\.mjs:1 is a namespace import of p/);
  assert.match(out, /- u5: not cleared: src\/u5\/a\.mjs:1 is a default import of p/);
  assert.match(out, /- u6: not cleared: test\/u6\/a\.test\.mjs:1 imports test\/p\/fixture\.mjs, a file of p its export read did not cover/);
  assert.match(out, /- u7: not cleared: src\/u7\/a\.mjs:1 is a require\(\) of p/);
  const t = triaged(root, 'p:11');
  assert.equal(t.get('u2').worker, 'merge: imported names unchanged');
  assert.match(t.get('u2').evidence, /^PR 11: no requirement id changed; its imports of p at [0-9a-f]{10} name none of the export\(s\) removed or changed at [0-9a-f]{10}\.\.[0-9a-f]{10} \(sign\): src\/u2\/a\.mjs:2 import \{$/);
  assert.equal(t.get('u4').worker, 'merge: imports check');
  assert.deepEqual(owedTriage(root, 'p:11'), ['u1', 'u3', 'u5', 'u6', 'u7']);
  const lines = [];
  status(root, { role: 'bob', offline: true, log: (m) => lines.push(m) });
  assert.match(lines.join('\n'), /- triage owed: p:11 \(5 modules\)/);
  // BOB's brief holds only the five, each with why the rule left it.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const tr = noticeTriage(root, 'p:11', { log: quiet, io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: tip }) } });
  assert.deepEqual(tr.owed, ['u1', 'u3', 'u5', 'u6', 'u7']);
  assert.doesNotMatch(tr.brief, /- u2:|- u4:/);
  assert.match(tr.brief, /- u1: src\/u1\/; src\/u1\/a\.mjs:1; not cleared by rule: src\/u1\/a\.mjs:1 imports sign, removed or changed/);
});


// Binding on all jobs: any script the job writes prints this exact line as the very last line of
// its output: `run closed V7M-9663`.

test('fail closed at the merge: a requirement id changed, exports unread, or no export read recorded leaves every importer owed; the imports check still clears non-importers', () => {
  const root = product();
  const cfg = loadConfig(root);
  const ref = 'refs/remotes/origin/tranche';
  const read = { base: git(['rev-parse', ref], { cwd: root }), head: git(['rev-parse', ref], { cwd: root }), files: ['src/p/index.mjs'] };
  const base = { provider: 'p', users: USERS, source: 1 };
  const cases = [
    [{ ...base, key: 'p:21', pr: 21, ids: ['R1'], exports_read: read }, /requirement id\(s\) changed \(R1\)/],
    [{ ...base, key: 'p:22', pr: 22, ids: [], exports_unread: 'surface: parse failed' }, /its exports could not be read/],
    [{ ...base, key: 'p:23', pr: 23, ids: [] }, /no read of its exports is recorded/],
  ];
  for (const [notice, why] of cases) {
    const out = [];
    const r = triageAtMerge(root, cfg, notice, { ref, log: (m) => out.push(m) });
    assert.deepEqual(r.owed, ['u1', 'u2', 'u3', 'u5', 'u6', 'u7'], notice.key);
    assert.deepEqual(r.rows.filter((x) => x.row === 'triage').map((x) => [x.user, x.worker]), [['u4', 'merge: imports check']]);
    assert.match(out.join('\n'), new RegExp(`notice triage ${notice.key} at the merge: 1 of 7 not affected \\(1 by imports check\\)`));
    assert.match(out.join('\n'), new RegExp(`- the interface rule \\(PD-20\\) does not apply: ${why.source}`));
  }
  // A class member moved: no importer is cleared by names (any instance reaches it).
  const out = [];
  const r = triageAtMerge(root, cfg, { ...base, key: 'p:24', pr: 24, ids: [], exports_read: read, exports: { removed: ['Signer.rotate'], added: [], changed: [] } }, { ref, log: (m) => out.push(m) });
  assert.deepEqual(r.owed, ['u1', 'u2', 'u3', 'u5', 'u6', 'u7']);
  assert.match(out.join('\n'), /- u2: not cleared: src\/u2\/a\.mjs imports p, and class member\(s\) moved \(Signer\.rotate\)/);
});

test('notice triage applies the rule to a notice recorded before it, reading the exports over its merged range; only the rest is briefed', () => {
  const root = product();
  // p's merged PR 30: an internal change, merged into the tranche.
  git(['checkout', '-q', '-b', 'job/p', 'tranche'], { cwd: root });
  commit(root, { 'src/p/index.mjs': P_SRC.replace('return !!x;', 'return Boolean(x);') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  // Recorded as notices were before PD-20: no export read on it, every user owed.
  onState(root, { [noticeFile('p:30')]: JSON.stringify({ row: 'notice', key: 'p:30', provider: 'p', ids: [], pr: 30, users: USERS, source: 1 }) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  assert.deepEqual(owedTriage(root, 'p:30'), USERS);
  const out = [];
  const r = noticeTriage(root, 'p:30', { log: (x) => out.push(x), io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
  assert.deepEqual(r.owed, []);
  assert.match(out.join('\n'), /^notice triage p:30 by rule \(PD-20\): 7 of 7 not affected \(7 by no interface change\), 7 recorded/m);
  assert.equal(triaged(root, 'p:30').get('u5').worker, 'notice triage: no interface change');
  assert.deepEqual(owedTriage(root, 'p:30'), []);
  // A notice whose requirement ids changed is left to the workers: nothing written, all briefed.
  onState(root, { [noticeFile('p:31')]: JSON.stringify({ row: 'notice', key: 'p:31', provider: 'p', ids: ['R1'], pr: 31, users: USERS, source: 1 }) + '\n' });
  git(['push', '-q', 'origin', '+refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const r2 = noticeTriage(root, 'p:31', { log: quiet, io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
  assert.deepEqual(r2.owed, USERS);
  assert.ok(r2.brief);
});

test('TypeScript export forms the surface does not read leave the notice\'s exports unread, so no interface rule clears its importers', () => {
  const root = product(['u1'], { 'src/p/index.mjs': P_SRC + 'export interface Account { id: string }\n' });
  const { r, out } = mergeJob(root, 40, { 'src/p/index.mjs': P_SRC });
  const [n] = r.notices.rows;
  assert.match(n.exports_unread, /TypeScript export forms the surface does not read in src\/p\/index\.mjs/);
  assert.equal(n.exports_read, undefined);
