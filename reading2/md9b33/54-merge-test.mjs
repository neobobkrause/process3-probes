}

const run = (over = {}) => ({ id: 1, status: 'completed', conclusion: 'success', started_at: '2026-11-02T10:00:00Z', ...over });
function plainIO(r, { base = 'tranche', head = r.head, rules = { checks: [{ context: 'gate' }] }, runs = [run()], headRepo = 'o/r', after, repo = { released: () => false, shim: () => null, descends: () => false } } = {}) {
  const calls = { merged: null, reads: 0 };
  const pr = () => ({ state: 'open', draft: false, base: { ref: base, repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: head, sha: r.sha, repo: headRepo === null ? null : { full_name: headRepo } } });
  return {
    calls,
    io: {
      getPR: () => { calls.reads++; return calls.reads > 1 && after ? after(pr()) : pr(); },
      requiredChecks: () => rules,
      checkRuns: typeof runs === 'function' ? runs : () => runs,
      repo,
      mergePR: (slug, n, sha, o) => { calls.merged = { sha, ...o }; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}
const q = { slug: 'o/r', log: () => {} };
const refs = (root) => git(['for-each-ref', '--format=%(refname) %(objectname)'], { cwd: root }) + git(['ls-remote', 'origin'], { cwd: root });

test('merge --plain merges a pin move pinned to its head, with the review in the message, and pushes nothing', () => {
  const r = plainRepo();
  const f = plainIO(r);
  git(['fetch', '-q', 'origin'], { cwd: r.root });
  const before = refs(r.root);
  const out = mergePlain(r.root, 4, { ...q, io: f.io, reviewed: 'fresh reader, no gaps', rounds: 1 });
  assert.equal(out.merged, true);
  assert.equal(out.wake, null, 'no pin moved: no wake');
  assert.equal(f.calls.merged.sha, r.sha);
  assert.equal(f.calls.merged.title, 'Merge PR 4: bob/pin into tranche');
  assert.equal(f.calls.merged.message, 'Reviewed: fresh reader, no gaps\nReview rounds: 1');
  assert.equal(refs(r.root), before, 'no branch moved, here or on origin: no merge row, no push');
  assert.equal(git(['worktree', 'list'], { cwd: r.root }).split('\n').length, 1);
});

// Bob, 7 Nov: the round-close run is tool-started. A plain pull request into the tranche that can
// close a round (the plan made close, a completion item done) asks for it after the merge; any
// other plain merge, or a product with no deploy block, reads nothing more.
test('merge --plain: a change to the config or the completion file asks for the round-close run after the merge; others do not', () => {
  const D = { slug_prefix: 'p3dev-', dry_run: ['true'], deploy: ['true'], walk: ['true'], guard_line: 'ok' };
  const ask = (config, files) => {
    const r = plainRepo({ config, files });
    const f = plainIO(r);
    const asked = [];
    const out = mergePlain(r.root, 4, { ...q, noReview: 'a test', io: { ...f.io, roundClose: (root, o) => { asked.push(o.by); return { ran: true, ok: true }; } } });
    assert.equal(out.merged, true);
    return [asked, out.round || null];
  };
  assert.deepEqual(ask({ deploy: D, completion_file: 'build/round.md' }, { 'build/round.md': '- [x] C-1 · a · F1\n' }), [['merge 4'], { ran: true, ok: true }]);
  assert.deepEqual(ask({ deploy: D }, { 'process/config.json': { deploy: D, plan: 'close' } }), [['merge 4'], { ran: true, ok: true }]);
  assert.deepEqual(ask({ deploy: D, completion_file: 'build/round.md' }, { 'pin.txt': 'moved' }), [[], null]);
  assert.deepEqual(ask(true, { 'process/config.json': { plan: 'close' } }), [[], null], 'no deploy block');
  assert.deepEqual(ask(true, { 'process/config.json': { deploy: D, plan: 'close' } }), [['merge 4'], { ran: true, ok: true }], 'the deploy block added with the close: read from the merged config');
  assert.deepEqual(ask({ deploy: { internal_walk: { none: 'x', by: 'Bob, 7 Nov' } } }, { 'process/config.json': { deploy: { internal_walk: { none: 'x', by: 'Bob, 7 Nov' } }, plan: 'close' } }), [[], null], 'the exemption alone deploys nothing');
});

test('merge --plain works in process3 itself, with no config and no ledger', () => {
  const r = plainRepo({ config: false, ledger: false, files: { 'tool/p3.mjs': '// changed\n' } });
  const f = plainIO(r, { rules: { checks: [{ context: 'ci' }, { context: 'record' }] } });
  assert.equal(mergePlain(r.root, 4, { ...q, io: f.io, noReview: 'a test' }).merged, true);
  assert.equal(f.calls.merged.message, 'No review: a test\nReview rounds: 0');
});

test('a pull request that changes a shim, or adds a job named like a required check, is refused: that needs the owner\'s word', () => {
  for (const files of [{ '.github/workflows/process-gate.yml': 'on: pull_request\njobs: { gate: { steps: [] } }\n' }, { '.github/workflows/fake.yml': 'jobs: { gate: {} }\n' }]) {
    const r = plainRepo({ files });
    const f = plainIO(r, { repo: { released: () => true, shim: () => 'f'.repeat(40) } });
    assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /changes \.github\/workflows\/\S+\.yml: .*needs the owner's word: bring it to Bob/);
    assert.equal(f.calls.merged, null);
  }
  // In process3 itself there is no pin and no shim: a workflow is judged by the owner's limits
  // (workflow-limits.test.mjs), and one they cannot read is refused.
  const p = plainRepo({ config: false, ledger: false, files: { '.github/workflows/ci.yml': 'x\n' } });
  assert.throws(() => mergePlain(p.root, 4, { ...q, noReview: 'x', io: plainIO(p).io }), /changes \.github\/workflows\/ci\.yml: reading: .*outside the owner's limits needs the owner's word/);
  // A product with a pin it has not released, or none at all: refused before any limit.
  const none = plainRepo({ files: { '.github/workflows/fake.yml': 'on: push\npermissions: {}\njobs: { a: { runs-on: x } }\n' } });
  assert.throws(() => mergePlain(none.root, 4, { ...q, noReview: 'x', io: plainIO(none).io }), /no process pin to compare it with.*owner's word/);
});

// Build J: GitHub's ruleset judges the required checks; merge --plain waits while one is queued,
// running or not started (it refused at once three times on 2 and 3 Nov).
test('merge --plain waits for a required check still running, then lets GitHub judge', () => {
  const r = plainRepo();
  const seen = [];
  const states = [[], [run({ status: 'queued', conclusion: null })], [run({ status: 'in_progress', conclusion: null })], [run()]];
  const f = plainIO(r, { runs: (slug, sha, name) => { seen.push(name); return states[Math.min(seen.length - 1, 3)]; } });
  const logs = [];
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'x', every: 0, log: (m) => logs.push(m), io: f.io }).merged, true);
  assert.equal(seen.length, 4);
  assert.deepEqual(logs.filter((l) => l.startsWith('waiting')).map((l) => l.split(' (')[1].split(')')[0]), ['not started', 'queued', 'in_progress']);
  // A red check is GitHub's to refuse: the tool does not judge it, and the merge is asked for.
  const red = plainIO(r, { runs: [run({ conclusion: 'failure' })] });
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'x', io: red.io }).merged, true);
  assert.equal(red.calls.merged.sha, r.sha);
  // Still running when the minutes run out: refused, naming the check.
  const slow = plainIO(r, { runs: [run({ status: 'in_progress', conclusion: null })] });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', minutes: 0, every: 0, io: slow.io }), /required checks still running on \w+ after 0 min: gate in_progress/);
  assert.equal(slow.calls.merged, null);
  // The readers: the rules' check names; every check run, newest first.
  assert.deepEqual(requiredChecks('o/r', 'bob/plan', { read: () => [{ type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'ci', integration_id: 15368 }, { context: 'record' }] } }] }), { checks: [{ context: 'ci' }, { context: 'record' }] });
  assert.equal(requiredChecks('o/r', 'x', { read: () => null }), null);
  const asked = [];
  const sorted = checkRuns('o/r', 's', 'gate', { read: (a) => { asked.push(a[1]); return { check_runs: [run({ id: 1 }), run({ id: 3, started_at: '2026-11-02T12:00:00Z' }), run({ id: 2, started_at: '2026-11-02T11:00:00Z' })] }; } });
  assert.deepEqual(sorted.map((x) => x.id), [3, 2, 1]);
  assert.match(asked[0], /check-runs\?check_name=gate&filter=all/);
});

// process3 at a pin: a repository with the shim on its tranche, behind an origin.
function process3(shimText) {
  const p = makeRepo({ 'shims/process-gate.yml': shimText, 'README.md': 'process3' });
  git(['branch', 'tranche'], { cwd: p });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-proc-')), 'p.git');
  git(['init', '-q', '--bare', bare], { cwd: p });
  git(['remote', 'add', 'origin', bare], { cwd: p });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: p });
  const pin = git(['rev-parse', 'HEAD'], { cwd: p });
  git(['checkout', '-q', '-b', 'side'], { cwd: p });
  const unreleased = commit(p, { 'shims/process-gate.yml': shimText + '# side\n' });
  return { dir: p, pin, unreleased };
}
function pinMove(pin, workflow) {
  const r = plainRepo({ files: { 'pin.txt': 'moved' } });
  git(['checkout', '-q', r.head], { cwd: r.root });
  git(['update-index', '--add', '--cacheinfo', `160000,${pin},.process`], { cwd: r.root });
  write(r.root, { '.github/workflows/process-gate.yml': workflow });
  git(['add', '.github/workflows/process-gate.yml'], { cwd: r.root });
  git(['commit', '-q', '-m', 'move the pin and the shim'], { cwd: r.root });
  git(['push', '-q', 'origin', r.head], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  return { ...r, sha: git(['rev-parse', `refs/heads/${r.head}`], { cwd: r.root }) };
}

test('a workflow changed to the process\'s own shim at a released pin is allowed, and its runs count', async () => {
  const shim = 'name: process-gate\non: pull_request\n';
  const p = process3(shim);
  const r = pinMove(p.pin, shim);
  const f = plainIO(r, { repo: processRepo(p.dir) });
  const logs = [];
  const moved = mergePlain(r.root, 4, { ...q, noReview: 'a pin move', as: 'pin', io: f.io, log: (m) => logs.push(m) });
  assert.equal(moved.merged, true);
  // The pin moved into the tranche: the next act wakes BOB, from the role that merged, runnable as
  // printed (confirming review of PR 59: a literal <role> was refused by send).
  assert.equal(moved.wake, `node .process/tool/p3.mjs send bob "pin moved to ${p.pin}: run your wake steps (start check --wake prints a changed prompt), then status" --from pin`);
  assert.equal(logs.at(-1), `next act: wake BOB with \`${moved.wake}\`, delivered with send_message to the address it prints`);
  // The wake's words, returned with it.
  assert.equal(moved.what, `pin moved to ${p.pin}: run your wake steps (start check --wake prints a changed prompt), then status`);
  // BOB merging (the default) is awake: no wake.
  const own = pinMove(p.pin, shim);
  const ownLogs = [];
  assert.equal(mergePlain(own.root, 4, { ...q, noReview: 'a pin move', io: plainIO(own, { repo: processRepo(p.dir) }).io, log: (m) => ownLogs.push(m) }).wake, null);
  assert.doesNotMatch(ownLogs.join('\n'), /wake BOB/);
  // Into a working branch, not the tranche: no wake.
  const work = pinMove(p.pin, shim);
  git(['push', '-q', 'origin', 'refs/remotes/origin/tranche:refs/heads/build/w'], { cwd: work.root });
  const workLogs = [];
  assert.equal(mergePlain(work.root, 4, { ...q, noReview: 'a pin move', as: 'pin', io: plainIO(work, { base: 'build/w', repo: processRepo(p.dir) }).io, log: (m) => workLogs.push(m) }).wake, null);
  assert.doesNotMatch(workLogs.join('\n'), /wake BOB/);
  // C27 (the coordinator, 7 Nov): a product with a state branch and no BOB addressed
  // (process3-probes, by design) has no BOB: no wake printed and none recorded, said once. With a
  // BOB addressed, the wake as before.
  const { WAKES_FILE, addressFile, writeState } = await import('../lib/state.mjs');
  const { mkdirSync: mk, writeFileSync: wf } = await import('node:fs');
  const { dirname: dn } = await import('node:path');
  const put = (root, files) => writeState(root, 'process-state', 'state', (d) => { for (const [f, t] of Object.entries(files)) { mk(dn(join(d, f)), { recursive: true }); wf(join(d, f), t); } });
  const nobob = pinMove(p.pin, shim);
  put(nobob.root, { 'heartbeat.json': '{}\n' });
  const nbLogs = [];
  const nb = mergePlain(nobob.root, 4, { ...q, noReview: 'a pin move', as: 'pin', io: plainIO(nobob, { repo: processRepo(p.dir) }).io, log: (m) => nbLogs.push(m) });
