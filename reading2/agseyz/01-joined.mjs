// ===== file: layout.mjs (continued) =====

  for (const m of keyed) {
    const pattern = new RegExp(`("${m.key}"\\s*:\\s*)${SCALAR}`);
    if (Object.hasOwn(cfg, m.key)) {
      if (!pattern.test(out)) fail(`layout move: ${m.key} in ${CONFIG_FILE} is not a path or null; set it by hand first`);
      out = out.replace(pattern, (_, k) => `${k}${JSON.stringify(m.to)}`);
    } else {
      const at = out.lastIndexOf('}');
      if (at < 0) fail(`${CONFIG_FILE} is not a JSON object`);
      const body = out.slice(0, at).trimEnd();
      const comma = body.endsWith('{') ? '' : ',';
      out = `${body}${comma}\n  ${JSON.stringify(m.key)}: ${JSON.stringify(m.to)}\n${out.slice(at)}`;
    }
  }
  let back;
  try { back = parseJSON(out); } catch (e) { fail(`layout move: ${CONFIG_FILE} would not read back (${e.message})`); }
  for (const m of keyed) if (back[m.key] !== m.to) fail(`layout move: could not rewrite ${m.key} in ${CONFIG_FILE} (the first "${m.key}" in its text is not the top-level one); set it by hand`);
  return out;
}

export function layoutMove(root, { apply = false, also = [], log = console.log } = {}) {
  const cfg = loadConfig(root);

// Note for jobs, in force until withdrawn: every file the job writes begins with this exact first
// line: `# ref G3Q-2282`.

  const plan = layoutPlan(root, { cfg, also });
  for (const l of planLines(plan)) log(l);
  if (!apply) {
    if (plan.moves.length) log(`then, on a branch from ${cfg.tranche}: layout move --apply${list(also).map((p) => ` --also ${p}`).join('')}; open its pull request into ${cfg.tranche} and land it with the merge tool`);
    return { ...plan, applied: false };
  }
  if (!plan.moves.length) return { ...plan, applied: false };
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root });
  if (branch === 'HEAD' || branch === cfg.tranche || branch === 'main') fail(`layout move --apply runs on a working branch from ${cfg.tranche}, not ${branch === 'HEAD' ? 'a detached HEAD' : branch}`);
  if (git(['status', '--porcelain', '--untracked-files=no'], { cwd: root })) fail('layout move --apply needs a clean checkout: commit or set aside the changes first');
  // Any failure from the first move to the commit puts the checkout back as it was (cold review).
  const undo = () => { git(['reset', '-q', '--hard', 'HEAD'], { cwd: root, allowFail: true }); };
  try {
    mkdirSync(join(root, PROCESS_DIR), { recursive: true });
    for (const m of plan.moves) {
      const r = git(['mv', '--', m.from, m.to], { cwd: root, allowFail: true });
      if (r.code !== 0) fail(`layout move: git mv ${m.from} ${m.to} failed (${r.stderr.trim()}); nothing was committed`);
    }
    const changes = [...plan.moves.filter((m) => m.key), ...plan.follows];
    if (changes.length) {
      const p = join(root, CONFIG_FILE);
      writeFileSync(p, rewriteConfig(existsSync(p) ? readFileSync(p, 'utf8') : '{\n}\n', changes));
      git(['add', '--', CONFIG_FILE], { cwd: root });
    }
    git(['commit', '-q', '-m', `layout move: process-only paths into ${PROCESS_DIR}/ (C41)\n\n${plan.moves.map((m) => `${m.from} -> ${m.to}`).join('\n')}`], { cwd: root });
  } catch (e) { undo(); throw e; }
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  log(`committed ${sha} on ${branch}: push it, open its pull request into ${cfg.tranche}, and land it with the merge tool`);
  return { ...plan, applied: true, sha };
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

// ===== file: rounds.mjs (later part) =====

// Where the rounds stand at `ref` (the tranche), read from the layers (layersAt: the map's and those
// past it), each layer's flow rows (flows(n), layerflow.mjs flowRows), the flawed modules and the
// latest walk (deploy row). One of:
//   { state: 'layer', round, layer }          a layer of the round is open (not merged);
//   { state: 'next', round, next }            the round's next layer is owed (next: { n, round, of, mods, items });
//   { state: 'walk', round }                  every layer of the round merged: its walk ends it;
//   { state: 'new', round, next, walk }       the walk ended the round, and flawed modules open the next;
//   { state: 'clean', round, walk }           the walk ended the round, and no module is flawed.
export function roundState(root, cfg, ref, { layers, flows, lastWalk = null, flawed = flawedModules(root, cfg, ref) }) {
  const map = layers.filter((L) => !L.completion && !L.round);
  const extra = layers.filter((L) => L.completion || L.round);
  const lastMap = map.at(-1)?.n ?? 0;
  const nextN = (layers.at(-1)?.n ?? 0) + 1;
  const open = layers.find((L) => flows(L.n).open && !flows(L.n).merged);
  const round = Math.max(1, ...extra.map(roundOf));
  if (open) return { state: 'layer', round: roundOf(open), layer: open };
  // A module on no line of the map runs with the map's last layer.
  const place = (id) => layerOf(map, id) ?? lastMap;
  // PD-24 (coordinator, 9 Nov; Bob: "All jobs of a layer should open at once up to the maximum slot
  // cap"): a round after the first is ONE layer holding every flawed module, whatever its plan layer,
  // passing over the map's last layer (of), so no layer follows it in the round. Its modules in the
  // map's order (plan layer, then line; those on no line last); within the layer, R10's dependency
  // order lists them, and a provider's land reschedules a user that landed first.
  const plan = (after, r, walk) => {
    const ahead = [...flawed.keys()].filter((id) => place(id) > after);
    if (!ahead.length) return null;
    const lineOf = (id) => { const L = map.find((x) => x.n === place(id)); return (L?.mods.indexOf(id) ?? -1) + 1 || 1e9; };
    const mods = ahead.sort((a, b) => (place(a) - place(b)) || (lineOf(a) - lineOf(b)) || a.localeCompare(b));
    return { n: nextN, round: r, of: lastMap, mods, items: mods.flatMap((id) => flawed.get(id)), ...(walk ? { walk } : {}) };
  };
  const mine = extra.filter((L) => roundOf(L) === round && L.round);
  // Round 1 ran every map layer; a later round, the map layers up to its last round layer's.
  const lastOf = round === 1 ? lastMap : Math.max(0, ...mine.map((L) => L.round.of));
  const more = round === 1 ? null : plan(lastOf, round);
  if (more) return { state: 'next', round, next: more };
  // The round's last merge; a walk after it ended the round.
  const merges = layers.map((L) => flows(L.n).merged?.at).filter(Boolean).sort();
  const lastMerge = merges.at(-1) || null;
  const walked = !!lastWalk && (!lastMerge || String(lastWalk.at) > String(lastMerge));
  if (!walked) return { state: 'walk', round };
  const walk = runSource(lastWalk);
