  // 7 Nov: required, tool-started); any other layer's merge runs no walk (Bob, 4 Nov). Its outcome
  // never undoes the merge, which is recorded.
  // deploy.mjs is imported here, not at the top: it reaches back into this module through status.mjs.
  const round = deploys(cfg) ? (io.roundClose || (await import('./deploy.mjs')).roundCloseRun)(root, { log, io: io.round || {}, by: `layer merge ${n}` }) : null;
  return { ok: true, merged, closed, round };
}
// A module's entry (and requirements) carried from the tranche (job start, R4) is added on both
// sides after the layer was cut: OPEN on the tranche, the job's state on the layer, an add/add
// conflict GitHub cannot merge (cold review of PR 190). When merging the tranche into the layer
// conflicts only there, the tool merges it into the layer, taking the layer's version of each, and
// pushes that merge; any other conflict refuses with the files named. A clean merge writes nothing.
// A completion layer's merge ticks each open item whose module landed on it (C33): one commit on
// layer/<n>, `[ ]` to `[x]` and nothing else, which the layer PR carries into the tranche and the
// layer gate checks (tickCheck). Items of modules that did not land, and deferred ones, stay as they are.
export function tickLanded(root, cfg, n, L, log = console.log) {
  if (!L.completion) return null;
  const file = L.completion.file;
  // Ticked only for a module complete on the layer (its last publish landed, nothing outstanding);
  // a module deferred after a land keeps its item open (cold review of C33).
  const landed = new Set(L.states.filter((x) => x.state === 'complete' && L.rows.lands.some((l) => l.module === x.id)).map((x) => x.id));
  const head = rev(root, L.ref);
  // The tranche's file and the layer's must agree but for ticks, else the layer PR would conflict
  // on the file (BOB ticks a whole-product item on the tranche): layer sync brings it in first.
  const tt = git(['show', `refs/remotes/origin/${cfg.tranche}:${file}`], { cwd: root, allowFail: true }).stdout || '';
  const lt = git(['show', `${head}:${file}`], { cwd: root, allowFail: true }).stdout || '';
  if (!onlyTicks(tt, lt)) fail(`${file} changed on ${cfg.tranche} since ${layerBranch(n)} was cut: run ${P3} layer sync ${n} first (it takes ${cfg.tranche}'s ${file}), then layer merge ${n}; nothing was opened`);
  const c = completionItems(root, { ...cfg, completion_file: file }, head);
  if (!c || c.missing) return null;
  const mine = new Set(layerItems(L.completion, L.rows.joins, L.rows.items).map((x) => x.id));
  const due = openItems(c).filter((x) => mine.has(x.id) && landed.has(x.target));
  if (!due.length) { log(`layer ${n}: no completion item to tick (none of their modules landed)`); return null; }
  // Read whole (git() trims its output): the tick changes no byte but the boxes.
  const lines = git(['show', `${head}:${file}`], { cwd: root, allowFail: true }).stdout.split('\n');
  for (const x of due) lines[x.line - 1] = lines[x.line - 1].replace('[ ]', '[x]');
  return withTemp('p3-layer-', (tmp) => {
    const w = join(tmp, 'w');
    git(['worktree', 'add', '-q', '--detach', w, head], { cwd: root });
    try {
      writeFileSync(join(w, file), lines.join('\n'));
      git(['add', '--', file], { cwd: w });
      git(['commit', '-q', '-m', `Tick completion items of layer ${n}: ${due.map((x) => x.id).join(', ')}`], { cwd: w });
      const sha = git(['rev-parse', 'HEAD'], { cwd: w });
      const p = git(['push', '-q', 'origin', `${sha}:refs/heads/${layerBranch(n)}`], { cwd: w, allowFail: true });
      if (p.code !== 0) fail(`the push of ${layerBranch(n)} with the completion items ticked failed (${p.stderr.trim()}); nothing was opened; run layer merge ${n} again`);
      fetchBranch(root, layerBranch(n));
      log(`${file}: ticked ${due.map((x) => `${x.id} (${x.target})`).join(', ')} on ${layerBranch(n)} at ${short(sha)}`);
      return { sha, ids: due.map((x) => x.id) };
    } finally { git(['worktree', 'remove', '--force', w], { cwd: root, allowFail: true }); }
  }, { root });
}
export function carriedSync(root, cfg, n, L, log = console.log) {
  const tr = `refs/remotes/origin/${cfg.tranche}`;
  const head = rev(root, L.ref);
  if (isAnc(root, tr, head)) return null;
  return withTemp('p3-layer-', (tmp) => {
    const w = join(tmp, 'w');
    git(['worktree', 'add', '-q', '--detach', w, head], { cwd: root });
    try {
      const m = git(['merge', '-q', '--no-ff', '--no-commit', tr], { cwd: w, allowFail: true });
      const conflicted = git(['diff', '--name-only', '--diff-filter=U'], { cwd: w }).split('\n').filter(Boolean);
      if (m.code === 0 || !conflicted.length) return null;
      const mb = git(['merge-base', head, tr], { deepen: true, cwd: root });
      const own = new Set(L.mods.flatMap((id) => [entryFile(id), ...(L.entries.get(id)?.requirements ? [L.entries.get(id).requirements] : [])]));
      // PD-23: a layer whose pin moved in place, or was held, merges with the tranche's pin and shims.
      const pinSide = conflicted.filter((f) => syncSide(f) === 'theirs' && f !== cfg.completion_file);
      const bad = conflicted.filter((f) => !pinSide.includes(f) && (!own.has(f) || exists(root, mb, f)));
      if (bad.length) {
        git(['merge', '--abort'], { cwd: w, allowFail: true });
        fail(`layer ${n} cannot merge: ${layerBranch(n)} and ${cfg.tranche} conflict in ${bad.join(', ')}; only a module's entry or requirements carried from ${cfg.tranche} is resolved by the tool; nothing was opened`);
      }
      const kept = conflicted.filter((f) => !pinSide.includes(f));
      if (kept.length) { git(['checkout', '-q', '--ours', '--', ...kept], { cwd: w }); git(['add', '--', ...kept], { cwd: w }); }
      for (const f of pinSide) {
        if (f === '.process') { const pin = pinOf(root, tr); if (pin) git(['update-index', '--cacheinfo', `160000,${pin},.process`], { cwd: w }); else git(['rm', '-q', '--cached', '--', '.process'], { cwd: w }); continue; }
        if (exists(root, tr, f)) { git(['checkout', '-q', '--theirs', '--', f], { cwd: w }); git(['add', '--', f], { cwd: w }); } else git(['rm', '-q', '--', f], { cwd: w });
      }
      git(['commit', '-q', '--no-edit', '-m', `Merge ${cfg.tranche} into ${layerBranch(n)}: ${[kept.length ? `the layer's ${kept.join(', ')} kept (carried from ${cfg.tranche})` : '', pinSide.length ? `${cfg.tranche}'s ${pinSide.join(', ')} taken (PD-23: the tranche's pin wins)` : ''].filter(Boolean).join('; ')}`], { cwd: w });
      const sha = git(['rev-parse', 'HEAD'], { cwd: w });
      const p = git(['push', '-q', 'origin', `${sha}:refs/heads/${layerBranch(n)}`], { cwd: w, allowFail: true });
      if (p.code !== 0) fail(`the push of ${layerBranch(n)} with ${cfg.tranche} merged in failed (${p.stderr.trim()}); nothing was opened; run layer merge ${n} again`);
      fetchBranch(root, layerBranch(n));
      log(`${layerBranch(n)}: ${cfg.tranche} merged in at ${short(sha)}${kept.length ? `, the layer's version kept of ${kept.join(', ')} (added on both after the layer was cut)` : ''}${pinSide.length ? `, ${cfg.tranche}'s ${pinSide.join(', ')} taken (the tranche's pin wins, PD-23)` : ''}`);
      return sha;
    } finally {
      git(['worktree', 'remove', '--force', w], { cwd: root, allowFail: true });
    }
  }, { root });
}
const readFileSyncSafe = (p) => { try { return readFileSync(p, 'utf8'); } catch { return ''; } };
// Whether a layer-check finding is the closing layer's: every finding is, except a generated
// row's verify failure whose paths no layer module owns and whose message names no layer module.
// names: the other modules its message names (whole ids).
export function verifyOwner(f, { mods, entries, ids }) {
  const named = (id) => new RegExp(`(^|[^\\w-])${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\w-]|$)`).test(String(f.message || ''));
  const names = ids.filter((id) => !mods.includes(id) && named(id)).sort();
  if (f.check !== 'generated' || !/ failed \(exit [^)]*\) after (regenerating|building)/.test(String(f.message || ''))) return { blocks: true, names };
  const owned = entries.filter((e) => mods.includes(e.id)).some((e) => ownPaths(e).some((p) => underPath(f.file, p)));
  return { blocks: owned || mods.some(named), names };
}
async function waitGate(x, slug, prn, head) {
  if (x.waitForGate) return x.waitForGate(slug, head, { pr: () => x.getPR(slug, prn) });
  const { waitForGate } = await import('./merge.mjs');
  return waitForGate(slug, head, { pr: () => x.getPR(slug, prn) });
}
const layerBody = (n, L) => [`Layer ${n} of the shared layer branch: every module complete or deferred, no reschedule outstanding.`, '', ...L.states.map((s) => `- ${s.id}: ${s.state} (${s.why})`), '', 'No suite runs here (Bob, 5 Nov): each module passed its own gate on its publish against its providers\' current versions; the layer gate checks that evidence.'].join('\n');

// The judge of a land (a "Merge layer PR <n>" commit) into `branch`: { pr, id, head, parent } when it is
// GitHub's merge of a job PR whose newest gate run on its head is a verified green run of its whole
// suite (a hidden PR from its land row under layerflow/<key>/ and the run's artifact, C13), else { why }.
// layerCover reads it for a layer's lands; gate.mjs jobMerge for the direct flow's lands on the
// tranche (PD-25), with base-red not green there (the tranche into main tolerates none).
export function landJudge(root, cfg, { branch, ids, key, slug, io, green = ['pass', 'base-red'] }) {
  const parents = (c) => git(['rev-list', '--parents', '-n', '1', c], { cwd: root }).split(' ').slice(1);
  const landOf = new Map(); // commit -> { pr, id, head } | { why }
  // Green as the land reads it (gate.mjs: a suite that passed, or failed only on base-red tests): the copy's
  // PR 715 landed on a base-red run its layer gate then refused (the coordinator, 7 Nov). A base-red
  // test is still owed: no suite runs at the layer close, and the tranche's PR into main runs its
  // suite with base-red off (gate.mjs), so it is collected there.
  const GREEN = green;
  const whole = (r, id) => r?.ok && r.trigger === 'code' && GREEN.includes(r.suite) && Array.isArray(r.scope) && r.scope.includes(id) && !(Array.isArray(r.requirements_only) && r.requirements_only.some((x) => x?.module === id));
  let stateRows = null;
  const hidden = (c, k, p, why) => {
    const no = (w) => { const v = { why: w }; landOf.set(c, v); return v; };
      // The state branch as fetched, or as the checkout already holds it (CI's checkout has the whole
    // history and no credentials to fetch again: cold review of C13).
    if (stateRows === null) {
      try { fetchState(root, cfg.state_branch); } catch { /* read what the checkout holds */ }
      try { stateRows = git(['rev-parse', '-q', '--verify', `refs/remotes/origin/${cfg.state_branch}`], { cwd: root, allowFail: true }).code === 0 ? flowRows(root, cfg.state_branch, key) : false; } catch { stateRows = false; }
    }
    // The land row for this very merge: its PR, the merge, and both its parents (the layer before, the head).
    const land = stateRows ? stateRows.lands.find((l) => l.pr === k && l.merge === c && l.head === p[1] && l.before === p[0] && l.at) : null;
    if (!land || !ids.has(land.module)) return no(`is PR ${k}'s merge, but GitHub does not serve PR ${k} (${why}) and ${cfg.state_branch} holds no land row for this merge`);
    const id = land.module;
    const art = io.runArtifactRow || runArtifactRow;
    // The run is bound to the module's own job branch by name (job/<id> or job/<id>-<n>), as the process
    // recorded it: the state branch's newest start row of the module at or before the land, else the
    // ledger's on the layer before the land; never the PR's own head (cold review of C13). The ledger
    // alone named job/actions for the copy's PR 715, whose attempt 3 ran on job/actions-2 (7 Nov).
    const st = stateRows.starts.filter((r) => r.module === id && r.branch && String(r.at) <= String(land.at)).at(-1);
    const jb = st?.branch || startBranch(rowsAt(root, p[0], id), id);
    if (!new RegExp(`^job/${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(-\\d+)?$`).test(jb)) return no(`is PR ${k}'s land (from ${cfg.state_branch}), but ${jb} is not ${id}'s job branch`);
