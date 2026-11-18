test('a merged attempt whose start row named the notice but whose answer was not written still owes it, with the rerun named; an open attempt does not', () => {
  const root = product();
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  for (const u of ['u1', 'u2']) {
    git(['checkout', '-q', '-b', `job/${u}`, 'tranche'], { cwd: root });
    commit(root, { [`process/metrics/${u}.jsonl`]: JSON.stringify({ event: 'start', notices: ['p:7'] }) + '\n' });
    git(['update-ref', `refs/remotes/origin/job/${u}`, 'HEAD'], { cwd: root });
  }
  git(['checkout', '-q', 'main'], { cwd: root });
  const cfg = loadConfig(root);
  const out = [];
  const rows = [{ id: 'u1', tranche: 'COMPLETE', branch: 'COMPLETE', ahead: 0, pr: 'merged' }, { id: 'u2', tranche: 'COMPLETE', branch: 'WORKING', ahead: 1 }];
  assert.deepEqual(Object.keys(owedNotices(root, cfg, rows, (m) => out.push(m))), ['u1']);
  assert.match(out.join('\n'), /- u1: provider notice: p R1, R2, R4 \(PR 7\); its merged job named it, answer not recorded: run merge/);
});

test('merge of a provider job that changed only tests and requirement marks records no notice and prints why', () => {
  const root = product();
  const done = JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n';
  const p = mergeFixture(root, 'p', { 'test/p/b.test.mjs': passing('p signs'), 'req/p.md': REQ.replace('*(not yet met: x)* ', ''), 'process/metrics/p.jsonl': done });
  const out = [];
  const r = merge(root, 77, { slug: 'o/r', io: p, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: (m) => out.push(m) });
  assert.equal(r.merged, true);
  assert.deepEqual(r.notices.rows, []);
  assert.match(out.join('\n'), /no provider notice: PR 77 changed R1 but no file of p's source \(src\/p\/\): only tests, requirements text, docs or records/);
  const sb = loadConfig(root).state_branch;
  fetchState(root, sb, { fresh: true });
  assert.deepEqual(notices(root, sb), []);
});

// A job pull request merged into the tranche by a merge commit, as GitHub merges it.
function mergedJob(root, files) {
  git(['checkout', '-q', '-B', 'job/p', 'tranche'], { cwd: root });
  commit(root, files);
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return m;
}

test('notice withdraw: a notice whose PR changed no provider source is withdrawn and status drops it; one whose PR changed source is refused', () => {
  const root = product();
  completeAll(root);
  openPassed(root);
  const m74 = mergedJob(root, { 'test/p/b.test.mjs': passing('p signs'), 'req/p.md': REQ.replace('*(not yet met: x)* ', '') });
  const m75 = mergedJob(root, { 'src/p/a.mjs': 'export const sign = 2;\n' });
  const row = (pr) => JSON.stringify({ ...NOTICE, key: `p:${pr}`, pr }) + '\n';
  onState(root, { [noticeFile('p:74')]: row(74), [noticeFile('p:75')]: row(75) });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const cfg = loadConfig(root);
  const getPR = (slug, n) => ({ merged: true, merge_commit_sha: { 74: m74, 75: m75 }[n] });
  assert.throws(() => withdrawNotice(root, cfg, 'p:75', { getPR, slug: 'o/r', log: quiet }),
    /^Error: refused: pull request 75 changed 1 file\(s\) of p's source \(src\/p\/a\.mjs\); provider notice p:75 stands$/);
  const out = [];
  const w = withdrawNotice(root, cfg, 'p:74', { getPR, slug: 'o/r', as: 'bob', log: (m) => out.push(m) });
  assert.equal(w.merge_commit, m74);
  assert.match(out.join('\n'), /provider notice p:74 withdrawn: PR 74 changed no file of p's source \(src\/p\/\); 2 unanswered user\(s\) no longer owe it/);
  fetchState(root, cfg.state_branch, { fresh: true });
  assert.deepEqual(notices(root, cfg.state_branch).map((n) => n.key), ['p:75']);
  assert.throws(() => withdrawNotice(root, cfg, 'p:74', { getPR, slug: 'o/r', log: quiet }), /provider notice p:74 is already withdrawn/);
  const lines = [];
  status(root, { role: 'bob', offline: true, live: 0, log: (m) => lines.push(m) });
  assert.doesNotMatch(lines.join('\n'), /p:74/);
  assert.match(lines.join('\n'), /- triage owed: p:75 \(2 modules\)/);
});

test('shares: a share closes at the module or byte cap; a module over the byte cap is a share of its own', () => {
  const m = (id, bytes) => ({ id, bytes });
  assert.deepEqual(shares([m('a', 100), m('b', 100), m('c', 300), m('d', 10)], { bytes: 250, modules: 25 }).map((s) => s.map((x) => x.id)), [['a', 'b'], ['c'], ['d']]);
  assert.deepEqual(shares([m('a', 1), m('b', 1), m('c', 1)], { bytes: 250, modules: 2 }).map((s) => s.map((x) => x.id)), [['a', 'b'], ['c']]);
});

// The copy, 4 Nov: membership PR 77 named 108 users; one worker judged only part of the list.
test('notice triage splits a 108-module list into parallel briefs and records only when every module is judged', () => {
  const users = Array.from({ length: 108 }, (_, i) => `u${String(i + 1).padStart(3, '0')}`);
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': { modules: [{ id: 'p', paths: ['src/p/'] }, ...users.map((u) => ({ id: u, paths: [`src/${u}/`], uses: ['p'] }))] },
    'process/ledger/p.json': entry('p'),
    'req/p.md': REQ,
    ...Object.fromEntries(users.map((u) => [`src/${u}/a.mjs`, `export const ${u} = 1;\n`])),
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: root });
  const m = mergedJob(root, { 'src/p/a.mjs': 'x', 'req/p.md': REQ.replace('*(not yet met: x)* ', '') });
  onState(root, { [noticeFile('p:77')]: JSON.stringify({ ...NOTICE, key: 'p:77', pr: 77, ids: ['R1'], users }) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const out = [];
  const r = noticeTriage(root, 'p:77', { log: (x) => out.push(x), io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
  const text = out.join('\n');
  assert.deepEqual(r.shares.map((s) => s.length), [25, 25, 25, 25, 8]);
  assert.deepEqual(r.shares.flat(), users, 'every module in exactly one share');
  assert.equal(r.briefs.length, 5);
  assert.match(text, /^BOB's acts: 108 modules, over one worker's share .*start 5 read-only workers in parallel.*notice triage p:77 --record <file 1> --worker <id 1> --cost <cost 1> .* --record <file 5> --worker <id 5> --cost <cost 5>$/m);
  for (let k = 1; k <= 5; k++) {
    assert.match(text, new RegExp(`^- worker ${k} of 5: brief ${k} \\(${k < 5 ? 25 : 8} modules, \\d+ bytes\\)$`, 'm'));
    assert.match(r.briefs[k - 1], new RegExp(`^Read-only triage of provider notice p:77, share ${k} of 5\\.`));
  }
  assert.match(r.briefs[4], /Modules \(8; paths; the files that import p, with their import lines\):\n- u101: src\/u101\//);
  assert.doesNotMatch(r.briefs[4], /- u100:/);
  // Each worker answers its share; four of five files leave 8 modules unjudged: nothing written.
  const dir = mkdtempSync(join(tmpdir(), 'p3-triage-'));
  const files = r.shares.map((s, i) => {
    const f = join(dir, `w${i + 1}.txt`);
    writeFileSync(f, s.map((u) => `${u}: not affected: src/${u}/a.mjs:1 never imports p`).join('\n') + '\n');
    return f;
  });
  const ids = files.map((_, i) => `agent-${i + 1}`);
  const costs = files.map(() => '30k tokens');
  const tip = git(['ls-remote', 'origin', 'refs/heads/process-state'], { cwd: root }).split('\t')[0];
  assert.throws(() => recordTriage(root, 'p:77', { file: files.slice(0, 4), worker: ids.slice(0, 4), cost: costs.slice(0, 4), log: quiet }),
    /refused: notice triage p:77 records only when every module has a line; 8 of 108 not judged: u101, u102/);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/process-state'], { cwd: root }).split('\t')[0], tip, 'nothing written');
  const rec = recordTriage(root, 'p:77', { file: files, worker: ids, cost: costs, log: quiet });
  assert.equal(rec.rows.filter((x) => x.row === 'triage').length, 108);
  assert.equal(rec.rows.find((x) => x.user === 'u108').worker, 'agent-5');
  const cfg = loadConfig(root);
  fetchState(root, cfg.state_branch, { fresh: true });
  assert.deepEqual(notices(root, cfg.state_branch)[0].open, []);
});

// The copy, 4 Nov: ai-accounts' T53 rewrite removed seven of its service's methods and changed
// accountUsesOf's argument with no requirement mark changed; four users broke unwarned.
const P_INDEX = `import { Layer } from './layer.mjs';
export class Accounts extends Layer {
  accountFor(id) { return id; }
  keySet({ key = null } = {}) { return key; }
  _row() {}
}
export function accountsOf(ctx) { return new Accounts(ctx); }
`;
function withProvider(root) {
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, {
    'src/p/index.mjs': P_INDEX,
    'src/p/layer.mjs': 'export class Layer {\n  groupKeyState(group) { return group; }\n}\n',
    'src/p/README.md': '# p\n',
    'src/u1/a.mjs': "import { accountsOf } from '../p/index.mjs';\nexport const a = accountsOf;\n",
  });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
}
const doneRow = () => JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n';

test('merge of a provider job that changed its exports with no requirement change records a notice naming them; the START and the triage brief show them', () => {
  const root = product();
  withProvider(root);
  const changed = P_INDEX.replace('  keySet({ key = null } = {}) { return key; }\n', '').replace('accountFor(id)', 'accountFor(id, { scope })');
  const io = mergeFixture(root, 'p', {
    'src/p/index.mjs': changed,
    'src/p/layer.mjs': 'export class Layer {\n  groupKeySwitches(group) { return group; }\n}\n',
    'process/metrics/p.jsonl': doneRow(),
  });
  const out = [];
  const r = merge(root, 50, { slug: 'o/r', io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: (m) => out.push(m) });
  const [n] = r.notices.rows;
  assert.deepEqual([n.key, n.ids, n.users, n.source], ['p:50', [], ['u1', 'u2'], 2]);
  assert.deepEqual(n.exports, {
    removed: ['Accounts.groupKeyState', 'Accounts.keySet'],
    added: ['Accounts.groupKeySwitches'],
    changed: [{ name: 'Accounts.accountFor', before: '(id)', after: '(id, { scope })' }],
  });
  assert.match(out.join('\n'), /provider notice: p its source, no requirement text; exports removed Accounts\.groupKeyState, Accounts\.keySet; changed Accounts\.accountFor; added Accounts\.groupKeySwitches \(PR 50\) recorded for u1, u2/);
  const { start } = jobStart(root, 'u1', { coordinator: 's', push: false, log: quiet });
  assert.match(start, /`p:50`: `p` changed its source, no requirement text; exports removed Accounts\.groupKeyState, Accounts\.keySet; changed Accounts\.accountFor; added Accounts\.groupKeySwitches \(PR 50\)/);
  git(['checkout', '-q', 'main'], { cwd: root });
  // The triage brief, read from the merged pull request.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const brief = noticeTriage(root, 'p:50', { log: quiet, io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } }).brief;
  assert.match(brief, /changed its source in PR 50, with no requirement text changed/);
  assert.match(brief, /- removed: Accounts\.groupKeyState, Accounts\.keySet\n- changed: Accounts\.accountFor \(id\) -> \(id, \{ scope \}\)\n- added: Accounts\.groupKeySwitches/);
  assert.match(brief, /decide whether the module uses the changed behaviour or any export removed or changed/);
  // Each user with only its files that import the provider, and their import lines.
