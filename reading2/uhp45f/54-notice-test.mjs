  // u2, importing nothing of p, was answered at the merge; only u1 is left for the worker.
  // u1 imports accountsOf, unmoved, but Accounts' members moved, which any instance reaches (PD-20).
  assert.match(out.join('\n'), /notice triage p:50 at the merge: 1 of 2 not affected \(1 by imports check\), answered: u2; 1 owe a worker's judgment, recorded owed on process-state: u1\n- u1: not cleared: src\/u1\/a\.mjs imports p, and class member\(s\) moved \(Accounts\.groupKeyState, Accounts\.keySet, Accounts\.accountFor\)/);
  // The owed triage comes first after the merge line, then the ready jobs' start; the triage
  // outcome is the last line.
  const at = out.findIndex((l) => /^merged pull request 50/.test(l));
  assert.match(out[at + 1], /^first: node \.process\/tool\/p3\.mjs notice triage p:50 \(provider notice p:50; 1 user module owes a worker's judgment: u1/);
  assert.match(out[at + 2], /^then: node \.process\/tool\/p3\.mjs status --role bob, then each `job start`/);
  assert.match(out.at(-1), /^notice triage at the merge: 1 owe a worker's judgment; next act: node \.process\/tool\/p3\.mjs notice triage p:50/);
  // The brief says why the rule left u1 for the worker (PD-20).
  assert.match(brief, /- u1: src\/u1\/; src\/u1\/a\.mjs:1; not cleared by rule: src\/u1\/a\.mjs imports p, and class member\(s\) moved/);
});

// The copy, 4 Nov: case-catalogue:224's users case-checker and ratification both import it; the
// merge cleared neither, wrote no row, and BOB's worker triaged it 9.6 min later.
test('a merge whose every notice user imports the provider records each owed at its merge and prints its triage as the first act', () => {
  const root = product();
  withProvider(root);
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'src/u2/a.mjs': "import { accountsOf } from '../p/index.mjs';\nexport const b = accountsOf;\n" });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  // accountsOf, which both import, changes its signature (PD-20: only an importer of a moved name stays owed).
  const io = mergeFixture(root, 'p', { 'src/p/index.mjs': P_INDEX.replace('accountsOf(ctx)', 'accountsOf(ctx, opts)'), 'process/metrics/p.jsonl': doneRow() });
  const out = [];
  const r = merge(root, 224, { slug: 'o/r', io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: (m) => out.push(m) });
  assert.deepEqual(r.notices.rows.map((x) => [x.key, x.users]), [['p:224', ['u1', 'u2']]]);
  assert.deepEqual(r.triage.owed, ['u1', 'u2']);
  // One owed row per user, written at the merge, none a verdict.
  assert.deepEqual(r.triage.rows.map((x) => [x.row, x.user, x.key, x.by]), [['owed', 'u1', 'p:224', 'merge'], ['owed', 'u2', 'p:224', 'merge']]);
  const cfg = loadConfig(root);
  fetchState(root, cfg.state_branch, { fresh: true });
  const row = JSON.parse(readState(root, cfg.state_branch, 'notices/triage/owed/u2-p-224.json'));
  assert.equal(row.next, 'node .process/tool/p3.mjs notice triage p:224');
  assert.match(row.why, /src\/u2\/a\.mjs:1 imports accountsOf, removed or changed/);
  assert.match(git(['log', '-1', '--format=%s', `refs/remotes/origin/${cfg.state_branch}`], { cwd: root }), /^notice triage p:224 at its merge: 2 owe a worker's judgment \(u1, u2\)$/);
  // Owed is not judged: the notice still has both open, and a worker's record still takes both.
  assert.deepEqual(notices(root, cfg.state_branch)[0].open, ['u1', 'u2']);
  assert.match(out.join('\n'), /notice triage p:224 at the merge: 0 of 2 not affected \(no rule cleared any\), none answered; 2 owe a worker's judgment, recorded owed on process-state: u1, u2/);
  const at = out.findIndex((l) => /^merged pull request 224/.test(l));
  assert.match(out[at + 1], /^first: node \.process\/tool\/p3\.mjs notice triage p:224 \(provider notice p:224; 2 user modules owe a worker's judgment: u1, u2/);
  assert.match(out[at + 2], /^then: node \.process\/tool\/p3\.mjs status --role bob/);
  assert.match(out.at(-1), /^notice triage at the merge: 2 owe a worker's judgment; next act: node \.process\/tool\/p3\.mjs notice triage p:224/);
  // merge run again after it landed: its triage, still owed, is the first act there too.
  const again = [];
  git(['fetch', '-q', 'origin', 'job/p:job/p-merged'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p-merged'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  merge(root, 224, { slug: 'o/r', io: { ...io, getPR: () => ({ state: 'closed', merged: true, merge_commit_sha: m, user: { login: 'c' }, base: { ref: 'tranche' }, head: { ref: 'job/p', sha: m } }), compare: () => null }, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: (x) => again.push(x) });
  assert.ok(again.some((l) => /^first: node \.process\/tool\/p3\.mjs notice triage p:224 /.test(l)), again.join('\n'));
  const dir = mkdtempSync(join(tmpdir(), 'p3-triage-'));
  const f = join(dir, 'w.txt');
  writeFileSync(f, 'u1: affected: src/u1/a.mjs:1 imports accountsOf\nu2: affected: src/u2/a.mjs:1 imports accountsOf\n');
  const rec = recordTriage(root, 'p:224', { file: [f], worker: ['agent-1'], cost: ['0.2'], log: quiet });
  assert.deepEqual(rec.rows.filter((x) => x.row === 'triage').map((x) => [x.user, x.verdict]), [['u1', 'affected'], ['u2', 'affected']]);
});

test('a merge that leaves no triage owed prints the ready jobs\' start first, as before', () => {
  const root = product();
  const io = mergeFixture(root, 'p', { 'src/p/a.mjs': 'x', 'req/p.md': REQ.replace('*(not yet met: x)* ', ''), 'process/metrics/p.jsonl': doneRow() });
  const out = [];
  merge(root, 7, { slug: 'o/r', io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: (m) => out.push(m) });
  const at = out.findIndex((l) => /^merged pull request 7/.test(l));
  assert.match(out[at + 1], /^first: node \.process\/tool\/p3\.mjs status --role bob, then each `job start`/);
  assert.ok(!out.some((l) => /^then: /.test(l)));
});

test('a source change with no export change still records a notice, with no exports named; a test-only change with no requirement change records none', () => {
  const root = product();
  withProvider(root);
  const io = mergeFixture(root, 'p', { 'src/p/index.mjs': P_INDEX.replace('return id;', 'return String(id);'), 'process/metrics/p.jsonl': doneRow() });
  const r = merge(root, 51, { slug: 'o/r', io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet });
  assert.deepEqual(r.notices.rows.map((x) => [x.key, x.ids, x.source, x.exports]), [['p:51', [], 1, undefined]]);
  assert.equal(noticeLine(r.notices.rows[0]), 'provider notice: p its source, no requirement text (PR 51)');
  const root2 = product();
  withProvider(root2);
  const io2 = mergeFixture(root2, 'p', { 'test/p/b.test.mjs': passing('p b'), 'src/p/README.md': '# p, read me\n', 'process/metrics/p.jsonl': doneRow() });
  const out = [];
  const r2 = merge(root2, 52, { slug: 'o/r', io: io2, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: (x) => out.push(x) });
  assert.deepEqual(r2.notices.rows, []);
  assert.match(out.join('\n'), /provider notices for PR 52: nothing to record/);
  // Never silent: a merge that leaves no notice says no triage ran, and why.
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
