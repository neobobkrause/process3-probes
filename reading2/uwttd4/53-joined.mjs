// ===== file: ghhook.mjs (continued) =====

      const repo = ti.owner && ti.repo ? `${ti.owner}/${ti.repo}`.toLowerCase() : null;
      const extra = { connector: true, ...(repo ? { repo } : {}) };
      // The call's own cost first, then a ref it moves: a refused push then leaves only the call counted.
      hookPacing(() => {
        reserve({ points: write ? 5 : 1, content: write ? 1 : 0, primary: true }, `connector ${op}`, cwd, { ...opts, extra });
        if (MOVES_REF.has(op)) reserve({ push: true, points: 0, content: 0, primary: false }, `connector ${op}`, cwd, { ...opts, kind: 'push', extra: { ...extra, via: 'connector' } });
      });
      return { ok: true, counted: write ? 'write' : 'read' };
    }
    if (name === 'Bash') { const why = bashVerdict(ti.command); return why ? { block: why } : { ok: true }; }
    return { ok: true };
  } catch (e) {
    if (e instanceof Paced) return { block: e.message };
    throw e;
  }
}

// The hook as Claude Code runs it (R17d, tool/hook.mjs; `p3 github hook` runs the same): the
// Bash check and other tools touch no git and no ledger; a connector read takes the read path
// (ghshare peekShare: the cached pause and stop, GitHub's cached primary count, no fetch, no
// network, no per-clone floor: under 300 ms); a connector write reads the ledger through stateShare (within READ_S, else ls-remote) and takes
// the full path, waits included. Returns the exit code: 0 allows, 2 blocks (reason on stderr).
const CONNECTOR = 'mcp__github__';
const ledgerKey = (root, cfg) => { try { const l = ledgerOf(root, cfg); return l ? (l.own ? 'own' : l.url) : null; } catch { return undefined; } };
export function hookRun(input, cwd, { err = (m) => console.error(m), share, kick = process.env.NODE_TEST_CONTEXT ? () => false : kickRefresh, opts = {} } = {}) {
  if (!input) { err('p3 github hook: no hook JSON on stdin'); return 2; }
  const name = String(input.tool_name || '');
  let d;
  if (!name.startsWith(CONNECTOR)) d = hookDecision(input, cwd, opts);
  else {
    const root = repoRoot(cwd);
    let cfg = null;
    try { cfg = existsSync(join(root, CONFIG_FILE)) ? loadConfig(root) : null; } catch { cfg = null; }
    const write = WRITE.test(name.slice(CONNECTOR.length));
    const was = process.env.NODE_TEST_CONTEXT || process.env.GITHUB_ACTIONS === 'true';
    useShared(share !== undefined ? share : write ? (was ? null : stateShare(root, cfg)) : peekShare(root, { kick, key: ledgerKey(root, cfg) }));
    try {
      d = hookDecision(input, root, write ? opts : { p: { ...pacing(), gh_interval_ms: 0 }, rateLimit: () => undefined, ...opts });
    } finally { useShared(null); }
  }
  if (d.block) { err(`GitHub pacing (P27): ${d.block}`); return 2; }
  return 0;
}
// The background refresh the read path starts (tool/hook.mjs --refresh): the ledger's tip asked of
// GitHub, fetched only when it moved; GitHub's primary count when a minute old. Never fails loudly.
export function hookRefresh(cwd) {
  // A stalled transfer gives up (cold review of R17d: a hung fetch held the clone's state lock).
  process.env.GIT_HTTP_LOW_SPEED_LIMIT ||= '1000';
  process.env.GIT_HTTP_LOW_SPEED_TIME ||= '20';
  try {
    const root = repoRoot(cwd);
    let cfg = null;
    try { cfg = existsSync(join(root, CONFIG_FILE)) ? loadConfig(root) : null; } catch { cfg = null; }
    const sh = stateShare(root, cfg);
    if (sh) sh.refresh();
    else writeFileSync(join(commonDir(root), LEDGER_CACHE), JSON.stringify({ at: Date.now(), pause: null, use: [], ledger: null }));
    primaryState(root);
  } catch { /* the next read starts another */ } finally { refreshDone(cwd); }
}

// ===== file: deploy.test.mjs (later part) =====

  v = see(root);
  assert.equal(v.s.release.gap, true);
  assert.match(v.text, /FIRST: the release path is next \(release v1 is cut since the clean internal walk internal-l2 \w{10}\): node \S+ deploy release v1, its release deployment and live walk \(BD-R1\); GAP: no path yet installs the cut, signed release artifact onto a p3dev- deployment/);
  // Its walk recorded: nothing more owed here (tranche close reads it).
  state({ 'deploys/release.jsonl': `${JSON.stringify({ row: 'release-walk', tranche: 'tranche', version: 'v1', commit: w2.commit, ok: true, failures: 0, ai: false, at: later })}\n` });
  // BD-R5: clean with AI off: the AI-assisted journeys are Bob's next, reported as a gap.
  v = see(root);
  assert.equal(v.s.release.gap, true);
  assert.match(v.text, /FIRST: the release path is next \(release v1's walk is clean on the non-AI journeys \(no AI account configured, BD-R5\)\): Bob configures the AI account; then walk.ai is set true/);
  assert.throws(() => trancheClose(root, { slug: repo, io: closeIO, log: quiet }), /clean on the non-AI journeys only/);
  state({ 'deploys/release.jsonl': `${JSON.stringify({ row: 'release-walk', tranche: 'tranche', version: 'v1', commit: w2.commit, ok: true, failures: 0, ai: true, at: later })}\n` });
  v = see(root);
  assert.equal(v.s.release, null);
  assert.doesNotMatch(v.text, /round-close run is owed|release path is next/);
  assert.ok(trancheClose(root, { slug: repo, io: closeIO, log: quiet }).ok);
});

// Cold review of C23: the merge commands hold their state writes until they end. The round-close
// run pushes them first (the last layer's close row, read back from origin by the run), and pushes
// its own as made, while its worktree exists: the row reaches origin.
test('round-close run inside a batched command: the held close row is pushed first and the run\'s row reaches origin', () => {
  const { root, bare } = withOrigin({ ...product(DEP, {}), 'build/requirements/d.md': 'all met\n' });
  opened(root);
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  push(root, { 'x.txt': 'the tranche past main\n' });
  assert.equal(closeLayer(root, '1').ok, true);
  const tip = git(['rev-parse', 'origin/tranche'], { cwd: root });
  let r;
  stateBatch(true);
  try {
    closeLayer(root, '2');
    r = roundCloseRun(root, { log: quiet, io: { repo, compare: () => null, status: statusIO, deploy: io }, by: 'layer merge 2' });
    flushState();
  } finally { stateBatch(false); }
  assert.deepEqual([r.ran, r.ok], [true, true]);
  assert.deepEqual(rows(bare).map((x) => [x.commit, x.layer, x.ok]), [[tip, 2, true]]);
  assert.match(git(['show', 'process-state:layers/closed.jsonl'], { cwd: bare }), /"layer":2/);
  assert.equal(git(['worktree', 'list', '--porcelain'], { cwd: root }).split('\n').filter((l) => l.startsWith('worktree ')).length, 1);
});

// A run started and not recorded owes nothing more while it may be going: no second run from the
// tool, a refusal by hand, and status says so (cold review of C23).
test('a run started and not recorded: the round-close run and deploy dev hold off, status says it is running', () => {
  const { root } = withOrigin(product());
  opened(root);
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  push(root, { 'x.txt': 'the tranche past main\n' });
  const tip = git(['rev-parse', 'origin/tranche'], { cwd: root });
  writeState(root, 'process-state', 'started (test)', (w) => { mkdirSync(join(w, 'deploys'), { recursive: true }); writeFileSync(join(w, DEPLOYS_FILE), JSON.stringify({ row: 'dev-deploy-start', tranche: 'tranche', slug: 'p3dev-l1', commit: tip, session: 'session_other', at: new Date().toISOString() }) + '\n'); });
  let called = 0;
  const r = roundCloseRun(root, { log: quiet, io: { repo, compare: () => null, status: statusIO, deployDev: () => { called++; return { ok: true }; } } });
  assert.deepEqual([r.ran, r.owed, r.running.session, called], [false, null, 'session_other', 0]);
  git(['checkout', '-q', 'origin/tranche'], { cwd: root });
  assert.throws(() => deployDev(root, { io, repo, log: quiet }), /session_other started one at \w{10} \(p3dev-l1\) at .*, not yet recorded: it is running, or was cut short/);
  const t = see(root).text;
  assert.match(t, /the round-close run at \w{10} \(p3dev-l1\) was started by session_other at .*, not yet recorded: running, or cut short/);
  assert.doesNotMatch(t, /FIRST: the round-close run is owed/);
});

// Bob's exemption (or an internal walk alone) on a product with no deployment configures no
// deploy: nothing owed, nothing run, tranche close not held (cold review of C23).
test('the exemption alone configures no deploy: no run, nothing owed', () => {
  const ex = { internal_walk: { none: 'no product to walk', by: 'Bob, 7 Nov' } };
  assert.equal(deploys({ deploy: ex }), false);
  assert.equal(deploys({ deploy: { internal_walk: { run: ['true'] } } }), false);
  assert.equal(deploys({ deploy: DEP }), true);
  const { root } = withOrigin(product(ex));
  opened(root);
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  push(root, { 'x.txt': 'the tranche past main\n' });
  let called = 0;
  const r = roundCloseRun(root, { log: quiet, io: { repo, compare: () => null, status: statusIO, deployDev: () => { called++; return { ok: true }; } } });
  assert.deepEqual([r.ran, r.owed, called], [false, null, 0]);
  assert.doesNotMatch(see(root).text, /round-close run/);
});

// ===== file: state-race.test.mjs (later part) =====

    change(wt);
    git(['add', '-A'], { cwd: wt });
    git(['-c', 'user.name=t', '-c', 'user.email=t@x', 'commit', '-q', '-m', msg], { cwd: wt });
    git(['update-ref', `refs/p3/unpushed/${name}`, 'HEAD'], { cwd: wt });
    git(['worktree', 'remove', '--force', wt], { cwd: root });
    return `refs/p3/unpushed/${name}`;
  };
  // The oldest: a change to a file another writer then changed in a way it cannot merge into.
  const old = keep('1000-0000', 'pacing: lane seat', (wt) => writeFileSync(join(wt, 'lanes/ux.json'), '{"who":"b"}\n'));
  const n1 = keep('2000-0000', 'layer merge 9: row 1', append({ row: 'merged', n: 1 }));
  const n2 = keep('2000-0001', 'layer merge 9: row 2', append({ row: 'merged', n: 2 }));
  writeState(other, SB, 'another writer', (wt) => { writeFileSync(join(wt, 'lanes/ux.json'), '{"who":"c"}\n'); return {}; });
  const lines = [];
  assert.throws(() => stateReplay(root, SB, [], { log: (l) => lines.push(l) }), new RegExp(`1 kept state write\\(s\\) did not replay and stay kept: ${old}: ${old} does not apply .* \\(the other 2 replayed\\)$`));
  assert.ok(lines.some((l) => l.startsWith(`kept ${old} (pacing: lane seat): `) && /does not apply/.test(l)), lines.join('\n'));
  assert.ok(lines.includes(`replayed ${n1} (layer merge 9: row 1)`) && lines.includes(`replayed ${n2} (layer merge 9: row 2)`), lines.join('\n'));
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  assert.deepEqual(readState(root, SB, ROWS).trim().split('\n').map((l) => JSON.parse(l)).map((x) => x.n ?? x.row), ['seed', 1, 2]);
  assert.equal(unpushed(root), old, 'only the one that does not apply stays kept');
});

// Cold review of the per-ref replay: the writes one command kept (<ms>-0000, -0001, each made on the one
// before) stay together: one that does not apply keeps its command's later ones. A failure that is not
// "does not apply" (a push refused to the end) stops the replay: that ref stays as it was, never kept
// twice, and later refs are not tried.
function keeper(root) {
  return (name, msg, change) => {
    const wt = join(mkdtempSync(join(tmpdir(), 'p3-keep-')), 'w');
    git(['worktree', 'add', '-q', '--detach', wt, `refs/remotes/origin/${SB}`], { cwd: root });
    change(wt);
    git(['add', '-A'], { cwd: wt });
    git(['-c', 'user.name=t', '-c', 'user.email=t@x', 'commit', '-q', '-m', msg], { cwd: wt });
    git(['update-ref', `refs/p3/unpushed/${name}`, 'HEAD'], { cwd: wt });
    git(['worktree', 'remove', '--force', wt], { cwd: root });
    return `refs/p3/unpushed/${name}`;
  };
}
test('state replay: a command\'s later kept write stays with its earlier one that does not apply; another command\'s replays', () => {
  const { root, other } = withOrigin();
