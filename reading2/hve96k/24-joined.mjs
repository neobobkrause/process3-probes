// ===== file: workflow-limits.test.mjs (continued) =====

  // The shim changed: refused as L4, whatever the limits would say.
  const s = repo({ pin: true, files: { '.github/workflows/process-gate.yml': shim + '# mine\n' } });
  const sp = { ...proc, shim: (pin, name) => (name === 'process-gate.yml' ? shimBlob(s.root) : null) };
  assert.throws(() => workflowChanges(s.root, s.sha, ['.github/workflows/process-gate.yml'], sp, null, { required: () => REQ }), /L4: \.github\/workflows\/process-gate\.yml is not the process's own shim.*owner's word/);
  // Equal to the pin's shim: L4 holds.
  const e = repo({ pin: true, files: { '.github/workflows/process-gate.yml': shim } });
  const ep = { ...proc, shim: (pin, name) => (name === 'process-gate.yml' ? shimBlob(e.root) : null) };
  assert.deepEqual(workflowChanges(e.root, e.sha, ['.github/workflows/process-gate.yml'], ep, null, { required: () => REQ }), [{ file: '.github/workflows/process-gate.yml', limits: ['L4'] }]);
  assert.equal(limitsLine([{ file: '.github/workflows/process-gate.yml', limits: ['L4'] }, { file: '.github/workflows/README.md', limits: [], note: 'not a workflow' }]), 'Workflow limits: process-gate.yml L4; README.md not a workflow');
});

test('a close carries a workflow change within the owner\'s limits when its shapes do not fit', () => {
  // Rule 1 is held elsewhere (close-workflows.test.mjs); here the second judge: shapes, else limits.
  const root = makeRepo({ '.github/workflows/ci.yml': CI });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const head = commit(root, { '.github/workflows/ci.yml': edit('timeout-minutes: 10', 'timeout-minutes: 20') });
  const at = { mb: base, baseRef: base, tranche: 'tranche', slug: 'o/r', io: { repo: {} } };
  const pass = { ...at, limits: (f, src, baseSrc) => judgeWorkflow(f, baseSrc, src, REQ) };
  // Rule 1 needs gated merges: stub it by a chain with nothing after the base (the file is earlier work).
  const judged = closeWorkflows(root, head, ['.github/workflows/ci.yml'], { ...pass, mb: head });
  assert.deepEqual(judged, [{ file: '.github/workflows/ci.yml', limits: ['rule 1', 'L1', 'L2', 'L3', 'L5'] }]);
  const bad = commit(root, { '.github/workflows/ci.yml': edit('  contents: read\njobs', '  contents: write\njobs') });
  assert.throws(() => closeWorkflows(root, bad, ['.github/workflows/ci.yml'], { ...pass, baseRef: head, mb: bad }), /fits no allowed shape.*nor is it within the owner's limits \(L2, line 5/);
  assert.throws(() => closeWorkflows(root, bad, ['.github/workflows/ci.yml'], { ...at, baseRef: head, mb: bad }), /fits no allowed shape.*allowed shapes or within the owner's limits$/);
});

// ===== file: notice.test.mjs (later part) =====

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
