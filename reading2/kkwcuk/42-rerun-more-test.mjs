    assert.deepEqual(runRows(root), [], `${at}: no row on origin yet`);
    assert.equal(heldWrites(root).length, at === 'row' ? 1 : 0, `${at}: the refused row is kept, not lost`);
    const r = await layerPublish(root, 'c', { sync: g.io.sync, complete, log: quiet });
    assert.equal(r.ok, true, `${at}: the rerun publishes`);
    assert.deepEqual(runRows(root).map((x) => x.result), ['pass'], `${at}: one run row for the rerun's run`);
    if (at === 'row') {
      // The kept row is the first run's own (another file): replayed, each run has its one row.
      stateReplay(root, SB, [], { log: quiet });
      assert.deepEqual(runRows(root).map((x) => x.result), ['pass', 'pass']);
      assert.equal(runs, 2);
    }
  }
});

const setPin = (dir, sha, msg) => { mkdirSync(join(dir, '.process'), { recursive: true }); git(['update-index', '--add', '--cacheinfo', `160000,${sha},.process`], { cwd: dir }); git(['commit', '-q', '-m', msg], { cwd: dir }); return git(['rev-parse', 'HEAD'], { cwd: dir }); };
// A layer open, then a pin move on the tranche: layer sync owed.
function syncOwed() {
  const { root, bare } = product({ done: true });
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  return { root, bare };
}
// GitHub as layer sync sees it, with state: pull requests made, and merged by GitHub's merge.
function syncGitHub(bare, { stopAfterMerge = false } = {}) {
  const s = { prs: [], merges: 0 };
  const tipOf = (b) => git(['ls-remote', bare, `refs/heads/${b}`], { cwd: tmpdir() }).split('\t')[0];
  return {
    s,
    io: {
      slug: 'o/p',
      findPR: () => null,
      openPRs: (slug, base) => s.prs.filter((p) => p.state === 'open' && p.base.ref === base),
      prsFromBranch: (slug, b) => s.prs.filter((p) => p.head.ref === b),
      createPR: (slug, p) => { const pr = { number: 91 + s.prs.length, state: 'open', draft: p.draft, base: { ref: p.base }, head: { ref: p.head, sha: tipOf(p.head) } }; s.prs.push(pr); return pr; },
      waitForGate: () => ({ status: 'completed', conclusion: 'success' }),
      merge: (slug, k, sha, title) => {
        s.merges++;
        const r = ghMerge(bare, 'layer/1', sha, title);
        s.prs.find((p) => p.number === k).state = 'closed';
        if (stopAfterMerge) useShared(stopped);
        return r;
      },
    },
  };
}
const syncBranches = (bare) => git(['ls-remote', '--heads', bare, 'refs/heads/layer-sync/*'], { cwd: tmpdir() }).split('\n').filter(Boolean);
const syncRows = (root) => { fetchState(root, SB, { fresh: true }); return flowRows(root, SB, 1).syncs; };

test('layer sync: refused at each GitHub step in turn (each gh call, its branch\'s push, its row\'s push), then rerun: one branch, one pull request, one merge, one sync row', async (t) => {
  t.after(() => useShared(null));
  const clean = syncOwed();
  const c = syncGitHub(clean.bare);
  const cr = refusing(c.io);
  assert.equal((await layerSync(clean.root, 1, { io: cr.io, log: quiet })).synced, true);
  const steps = cr.s.calls;
  assert.ok(steps >= 5, `${steps} GitHub steps`);
  // 1..steps: each gh call; then the branch's push, then the row's push, refused by a stopped account.
  for (let k = 1; k <= steps + 2; k++) {
    const { root, bare } = syncOwed();
    const g = syncGitHub(bare, { stopAfterMerge: k === steps + 2 });
    const f = refusing(g.io, k <= steps ? k : 0);
    if (k === steps + 1) useShared(stopped);
    const first = await attempt(() => layerSync(root, 1, { io: f.io, log: quiet }));
    useShared(null);
    assert.match(String(first), refusal, `step ${k}: the run stops on the refusal`);
    const r = await layerSync(root, 1, { io: f.io, log: quiet });
    assert.equal(r.ok, true, `step ${k}: the rerun completes`);
    assert.equal(syncBranches(bare).length, 1, `step ${k}: one sync branch, not a second for a pull request never opened: ${syncBranches(bare).join(', ')}`);
    assert.equal(g.s.prs.length, 1, `step ${k}: one pull request`);
    assert.equal(g.s.merges, 1, `step ${k}: one merge`);
    assert.equal(syncRows(root).length, 1, `step ${k}: one sync row`);
    // The refused row's write, kept: the rerun wrote its row, so a replay drops it (R17d leftover);
    // nothing stays held.
    const kept = () => git(['for-each-ref', '--format=%(refname)', 'refs/p3/unpushed/'], { cwd: root }).split('\n').filter(Boolean);
    if (kept().length) {
      stateReplay(root, 'process-state', [], { log: quiet });
      assert.deepEqual(kept(), [], `step ${k}: nothing held after the replay`);
      assert.equal(syncRows(root).length, 1, `step ${k}: still one sync row`);
    }
    git(['fetch', '-q', 'origin'], { cwd: root });
    assert.equal(git(['merge-base', '--is-ancestor', 'origin/tranche', 'origin/layer/1'], { cwd: root, allowFail: true }).code, 0, `step ${k}: the layer holds the tranche`);
  }
});

// ---- pin move ---------------------------------------------------------------------------------

// The process repo pinMove reads releases from (pin.test.mjs's), and the product's GitHub with
// one open pin move, PR 106, that --supersedes closes.
const ORIGIN = makeRepo({ 'README.md': 'process' });
git(['branch', '-M', 'tranche'], { cwd: ORIGIN });
const PROC = makeRepo({ 'README.md': 'x' });
git(['remote', 'add', 'origin', ORIGIN], { cwd: PROC });
git(['fetch', '-q', 'origin'], { cwd: PROC });
const PIN = git(['rev-parse', 'origin/tranche'], { cwd: PROC });
const REPORT = 'session_01RAN5eniJPZwnDgHRYfWFQb';
function pinGitHub() {
  const s = { prs: [{ number: 106, state: 'open', head: { ref: 'p3/pin-0123456789' } }], comments: { 106: [] } };
  return {
    s,
    io: {
      list: () => s.prs.filter((p) => p.state === 'open'),
      comments: (slug, n) => s.comments[n],
      comment: (slug, n, body) => { s.comments[n].push({ id: s.comments[n].length + 1, body }); return { id: 1 }; },
      close: (slug, n) => { s.prs.find((p) => p.number === n).state = 'closed'; return { number: n }; },
    },
  };
}

test('pin move --supersedes: refused at each GitHub step in turn, then rerun: one comment, the old move closed, the same session printed', async () => {
  const opts = { pin: PIN, supersedes: '106', processRoot: PROC, report: REPORT, why: 'BOB wakes on events', log: quiet };
  const root = makeRepo({ 'README.md': 'x' });
  const c = refusing(pinGitHub().io);
  const clean = pinMove(root, 'o/r', { ...opts, io: c.io });
  const steps = c.s.calls;
  assert.equal(steps, 4, 'list, comments, comment, close');
  for (let k = 1; k <= steps; k++) {
    const g = pinGitHub();
    const f = refusing(g.io, k);
    const first = await attempt(() => pinMove(root, 'o/r', { ...opts, io: f.io }));
    assert.match(String(first), refusal, `step ${k}`);
    const r = later(() => pinMove(root, 'o/r', { ...opts, io: f.io }));
    assert.equal(g.s.comments[106].length, 1, `step ${k}: one comment, not one per run`);
    assert.equal(g.s.prs[0].state, 'closed', `step ${k}: closed`);
    assert.deepEqual(r.call, clean.call, `step ${k}: the same session printed`);
  }
});

// ---- tranche open and tranche close ---------------------------------------------------------

function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = bareOrigin(root);
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  return { root, bare };
}
const refs = (bare) => git(['for-each-ref', '--format=%(refname) %(objectname)'], { cwd: bare });
// One clock for runs that are compared: a printed step reads it (run_once_at, a day on).
const T0 = Date.parse('2026-11-07T00:00:00Z');
const ACTS = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];

test('tranche open: no GitHub act of its own (it prints the same steps, with the account stopped and again); --record\'s push refused, then rerun: one row per act, one refusal row', (t) => {
  t.after(() => useShared(null));
  const { root, bare } = withOrigin({ 'README.md': 'x\n' });
  const before = refs(bare);
  const a = trancheOpen(root, { slug: 'o/p', log: quiet, now: () => T0 });
  useShared(stopped);
  const b = later(() => trancheOpen(root, { slug: 'o/p', log: quiet, now: () => T0 }));
  assert.deepEqual([b.n, b.steps, b.call], [a.n, a.steps, a.call], 'the same steps, the same throwaway branch');
  assert.equal(refs(bare), before, 'nothing pushed');
  // --record: its state write refused; nothing written, nothing counted; the rerun writes each once.
  const recs = [...ACTS.map((x) => `${x}|1|${x === 'session-archive' ? 'refused' : 'ok'}`)];
  assert.throws(() => recordOpen(root, recs, { session: 'bob', log: quiet }), /GitHub budget: .*every GitHub call is stopped/s);
  useShared(null);
  assert.equal(onOrigin(bare, OPEN_FILE).length, 0);
  const refusals = () => { try { return readFileSync(join(root, REFUSALS_FILE), 'utf8').split('\n').filter(Boolean).length; } catch { return 0; } };
  assert.equal(refusals(), 0, 'the refusal row waits for the push');
  recordOpen(root, recs, { session: 'bob', log: quiet });
  assert.equal(onOrigin(bare, OPEN_FILE).length, ACTS.length, 'one row per act');
  assert.equal(refusals(), 1, 'one refusal row');
  assert.equal(heldWrites(root).length, 1, 'the refused write is kept (state replay); the rerun wrote the rows');
});

const LAYERS = '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n';
const closeFiles = { 'build/layers.md': LAYERS, 'build/requirements/a.md': '- **R99** met\n', 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }) };
const closeIO = () => ({ compare: () => null, status: { openPRs: () => [], checkRun: () => null, compare: () => null } });

test('tranche close: refused at each GitHub read in turn, then rerun: the same steps; --record refused at its read and at its push, then rerun: one close row', async (t) => {
  t.after(() => useShared(null));
  const { root, bare } = withOrigin(closeFiles);
  // main moved: the steps merge it into the tranche first.
  git(['checkout', '-q', 'main'], { cwd: root });
  commit(root, { 'NOTE.md': 'owner edit\n' });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const c = refusing(closeIO());
  const clean = trancheClose(root, { slug: 'o/p', io: c.io, log: quiet });
  const steps = c.s.calls;
  assert.ok(steps >= 1, `${steps} GitHub reads`);
  for (let k = 1; k <= steps; k++) {
    const f = refusing(closeIO(), k);
    const first = await attempt(() => trancheClose(root, { slug: 'o/p', io: f.io, log: quiet }));
    if (first) assert.match(first, refusal, `step ${k}`);

// A box of 5 beets came through Brae.

    assert.deepEqual(later(() => trancheClose(root, { slug: 'o/p', io: f.io, log: quiet })).steps, clean.steps, `step ${k}: the same steps`);
  }
  // The tranche on main; --record refused at its compare, then at its push; each rerun once.
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['merge', '-q', '--no-edit', 'tranche'], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  const f = refusing(closeIO(), 1);
  assert.match(String(await attempt(() => trancheClose(root, { slug: 'o/p', io: f.io, record: true, log: quiet }))), refusal);
  useShared(stopped);
  assert.throws(() => trancheClose(root, { slug: 'o/p', io: f.io, record: true, log: quiet }), /GitHub budget: .*every GitHub call is stopped/s);
  useShared(null);
  assert.equal(onOrigin(bare, TRANCHE_CLOSED_FILE).length, 0);
  assert.equal(trancheClose(root, { slug: 'o/p', io: f.io, record: true, log: quiet }).ok, true);
  assert.equal(onOrigin(bare, TRANCHE_CLOSED_FILE).length, 1, 'one close row');
  assert.throws(() => trancheClose(root, { slug: 'o/p', io: f.io, record: true, log: quiet }), /already recorded/);
});

