  const lines = [];
  const s = status(root, { role: 'bob', offline: true, live: 0, log: (m) => lines.push(m) });
  const text = lines.join('\n');
  assert.match(text, /- triage owed: p:8 \(3 modules\)/);
  assert.match(text, /- u2: provider notice: p R1, R2, R4 \(PR 7\); affected: src\/u2\/b.mjs:12/);
  assert.deepEqual(s.next.map((x) => x.file || x.triage), ['req/p.md', 'req/u2.md', 'p:8']);
  // Two workers' files, recorded together once every module has a line, each row with its worker.
  const second = join(dir, 'second.txt');
  writeFileSync(second, 'u2: not affected: src/u2/b.mjs:1 reads no token\nother: not affected: src/other/a.mjs:1 never imports p\n');
  assert.throws(() => recordTriage(root, 'p:8', { file: [file, second], worker: ['agent-2'], cost: ['9k', '8k'], log: quiet }), /one --worker and one --cost per --record/);
  const r8 = recordTriage(root, 'p:8', { file: [file, second], worker: ['agent-2', 'agent-3'], cost: ['9k', '8k'], log: quiet });
  assert.deepEqual(r8.rows.filter((x) => x.row === 'triage').map((x) => [x.user, x.verdict, x.worker, x.cost]),
    [['u1', 'affected', 'agent-2', '9k'], ['u2', 'not affected', 'agent-3', '8k'], ['other', 'not affected', 'agent-3', '8k']]);
  const after = [];
  const s2 = status(root, { role: 'bob', offline: true, live: 0, log: (m) => after.push(m) });
  const text2 = after.join('\n');
  assert.doesNotMatch(text2, /triage owed/);
  assert.match(text2, /notice work \(triage judged these affected; not layer work.*\n- req\/u1.md: 0; provider notice p:8\n- req\/u2.md: 0; provider notice p:7$/m);
  assert.doesNotMatch(text2, /next work, layer|next work \(.*\n- req\/u/);
  assert.deepEqual(s2.next.map((x) => x.file || x.triage), ['req/p.md', 'req/u1.md', 'req/u2.md']);
});

test('notice triage prints BOB\'s act and the worker\'s brief: the changed text before and after, each untriaged user\'s paths and sizes; it writes nothing', () => {
  const root = product();
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'src/u1/a.mjs': 'export const a = 1;\n', 'src/u2/b.mjs': 'b\n', 'src/u2/c.mjs': 'cc\n' });
  git(['checkout', '-q', '-b', 'job/p'], { cwd: root });
  commit(root, { 'req/p.md': REQ.replace('*(not yet met: x)* ', '').replace('checks a token', 'checks a token and its age') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  noticed(root);
  const before = git(['rev-parse', 'refs/remotes/origin/process-state'], { cwd: root });
  const out = [];
  const r = noticeTriage(root, 'p:7', { log: (x) => out.push(x), io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
  const text = out.join('\n');
  assert.match(text, /^BOB's act: start one read-only worker, a subagent .*notice triage p:7 --record <file> --worker <its id> --cost <its cost>/);
  assert.match(text, /- R1\n  before: - \*\*R1\*\* \*\(not yet met: x\)\* signs a token\n  after:  - \*\*R1\*\* signs a token/);
  assert.match(text, /- R2\n  before: - \*\*R2\*\* checks a token\n  after:  - \*\*R2\*\* checks a token and its age/);
  assert.match(text, /- R4\n  before: \(none\)\n  after:  \(none\)/);
  assert.match(text, /<module>: not affected: <file>:<line>/);
  assert.match(text, /- u1: src\/u1\/; no file imports p\n- u2: src\/u2\/; no file imports p$/);
  assert.deepEqual(r.owed, ['u1', 'u2']);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/process-state'], { cwd: root }).split('\t')[0], before, 'nothing written');
});

test('parseTriage: one verdict per module, evidence citing a file:line, other lines ignored; two verdicts for one module refused', () => {
  const { lines, bad } = parseTriage('intro\nu1: not affected: src/u1/a.mjs:3 no use\n* u2 : affected — lib/x.js:9 uses it\nu3: not affected, I think\n');
  assert.deepEqual([...lines].map(([u, v]) => [u, v.verdict, v.evidence]), [['u1', 'not affected', 'src/u1/a.mjs:3 no use'], ['u2', 'affected', 'lib/x.js:9 uses it']]);
  assert.deepEqual(bad, ['u3: not affected cites no file:line']);
  assert.throws(() => parseTriage('u1: affected: a.js:1 x\nu1: not affected: a.js:2 y\n'), /both affected and not affected/);
});

test('a user whose open job names the notice is no longer listed; one whose job does not still is', () => {
  const root = product();
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  git(['checkout', '-q', '-b', 'job/u1', 'tranche'], { cwd: root });
  commit(root, { 'process/metrics/u1.jsonl': JSON.stringify({ event: 'start', notices: ['p:7'] }) + '\n' });
  git(['update-ref', 'refs/remotes/origin/job/u1', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/u2', 'tranche'], { cwd: root });
  commit(root, { 'process/metrics/u2.jsonl': JSON.stringify({ event: 'start' }) + '\n' });
  git(['update-ref', 'refs/remotes/origin/job/u2', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const cfg = loadConfig(root);
  const rows = [{ id: 'u1', tranche: 'WORKING', branch: 'WORKING' }, { id: 'u2', tranche: 'WORKING', branch: 'WORKING' }];
  assert.deepEqual(Object.keys(owedNotices(root, cfg, rows, quiet)), ['u2']);
});

// merge: the provider's job leaves the notice; the user's job answers the one its START named.
function mergeFixture(root, id, files) {
  git(['checkout', '-q', '-b', `job/${id}`, 'tranche'], { cwd: root });
  const head = commit(root, files);
  git(['push', '-q', 'origin', `job/${id}`], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const io = {
    getPR: () => ({ state: 'open', draft: false, user: { login: 'c' }, base: { ref: 'tranche' }, head: { ref: `job/${id}`, sha: head } }),
    comments: () => [
      { id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, attempt: 1, run_id: 11 }] }), user: { login: BOT } },
    ],
    checkRun: () => ({ status: 'completed', conclusion: 'success' }),
    verify: () => true,
    mergePR: () => ({ merged: true, sha: 'm'.repeat(40) }),
  };
  return io;
}

test('merge of the provider\'s job records the notice; merge of a user\'s job answers it', () => {
  const root = product();
  const done = JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n';
  const p = mergeFixture(root, 'p', { 'src/p/a.mjs': 'x', 'req/p.md': REQ.replace('*(not yet met: x)* ', ''), 'process/metrics/p.jsonl': done });
  const r = merge(root, 7, { slug: 'o/r', io: p, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet });
  assert.deepEqual(r.notices.rows.map((x) => [x.row, x.key, x.ids, x.users]), [['notice', 'p:7', ['R1'], ['u1', 'u2']]]);
  // Triage at the merge: neither user has a file importing p, so both are answered not affected.
  assert.deepEqual(r.triage.rows.filter((x) => x.row === 'triage').map((x) => [x.user, x.verdict]), [['u1', 'not affected'], ['u2', 'not affected']]);
  assert.deepEqual(r.triage.owed, []);
  assert.equal(r.triage.next, null);
  assert.match(r.triage.rows[0].evidence, /^process\/modules\.json:\d+ u1 \(src\/u1\/\) holds no file that imports p/);
  // u1's job, which named the notice, merges after: its answer is already on the state branch.
  const start = JSON.stringify({ event: 'start', notices: ['p:7'] }) + '\n';
  const u = mergeFixture(root, 'u1', { 'test/u1/p.test.mjs': passing('x'), 'process/metrics/u1.jsonl': start + done });
  const r2 = merge(root, 9, { slug: 'o/r', io: u, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet });
  assert.deepEqual(r2.notices.rows, []);
  const sb = loadConfig(root).state_branch;
  fetchState(root, sb, { fresh: true });
  assert.equal(JSON.parse(readState(root, sb, 'notices/answered/u1-p-7.json')).by, 'triage');
  assert.deepEqual(notices(root, sb)[0].open, []);
});

test('merge run again on a merged job pull request records only its provider notices, once', () => {
  const root = product();
  git(['checkout', '-q', '-b', 'job/p', 'tranche'], { cwd: root });
  const head = commit(root, { 'src/p/a.mjs': 'x', 'req/p.md': REQ.replace('*(not yet met: x)* ', '') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const io = { getPR: () => ({ state: 'closed', merged: true, merge_commit_sha: m, head: { ref: 'job/p', sha: head }, base: { ref: 'tranche' } }) };
  const r = merge(root, 7, { slug: 'o/r', io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet });
  assert.deepEqual(r.notices.rows.map((x) => [x.row, x.key, x.users]), [['notice', 'p:7', ['u1', 'u2']]]);
  assert.deepEqual(merge(root, 7, { slug: 'o/r', io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: quiet }).notices.rows, [], 'a second run adds nothing');
});

test('status --role bob fetches job/<id> of a COMPLETE user with an unanswered notice: a start pushed with no pull request yet clears its listing', () => {
  const root = product();
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, Object.fromEntries(['p', 'u1', 'u2', 'other'].map((id) => [`process/ledger/${id}.json`, entry(id, { status: { state: 'COMPLETE' } })])));
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  // u1's auto-reopened start, pushed to origin only: no remote-tracking ref here, no pull request.
  git(['checkout', '-q', '-b', 'job/u1', 'tranche'], { cwd: root });
  commit(root, { 'process/metrics/u1.jsonl': JSON.stringify({ event: 'start', notices: ['p:7'] }) + '\n' });
  git(['push', '-q', 'origin', 'job/u1'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['update-ref', '-d', 'refs/remotes/origin/job/u1'], { cwd: root });
  openPassed(root);
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const io = { openPRs: () => [], checkRun: () => null, compare: () => null };
  const out = [];
  const r = status(root, { role: 'bob', io, log: (m) => out.push(m) });
  assert.equal(git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/job/u1'], { cwd: root, allowFail: true }).code, 0, 'job/u1 fetched');
  assert.deepEqual(Object.keys(r.notices), ['u2']);
  assert.doesNotMatch(out.join('\n'), /- u1: provider notice/);
});

test('recordAtMerge answers only notices the state branch holds for the user: a key the job wrote into its start row writes nothing, outside notices/ or in it', () => {
  const root = product();
  const cfg = loadConfig(root);
  const { row, ...notice } = NOTICE;
  recordAtMerge(root, cfg, { notice, user: 'p', pr: 7 });
  const out = mkdtempSync(join(tmpdir(), 'p3-escape-'));
  const evil = `a/${'../'.repeat(12)}${out.slice(1)}/x`;
  const r = recordAtMerge(root, cfg, { answers: [evil, 'p:8', 'other:7', 'p:7'], user: 'u1', pr: 9 });
  assert.deepEqual(r.rows.map((x) => [x.row, x.key]), [['answered', 'p:7']]);
  assert.equal(existsSync(join(out, 'x.json')), false, 'nothing written outside the state worktree');
  assert.equal(recordAtMerge(root, cfg, { answers: ['p:7'], user: 'other', pr: 10 }).rows.length, 0, 'not a user of the notice');
  fetchState(root, cfg.state_branch, { fresh: true });
  assert.deepEqual(git(['ls-tree', '-r', '--name-only', `refs/remotes/origin/${cfg.state_branch}`], { cwd: root }).split('\n').filter((f) => f.startsWith('notices/')), ['notices/answered/u1-p-7.json', 'notices/p-7.json']);
});

