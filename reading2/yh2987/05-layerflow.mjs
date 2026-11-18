    const ctx = { pr: k, baseRef: branch, merged: { branch: jb } };
    // Its newest run on the head by GitHub's own run id (and attempt), never a session-written time.
    const rows = stateRows.gates.filter((g) => g.pr === k && g.module === id && g.sha === p[1] && g.run_id).sort((a, b) => (Number(a.run_id) - Number(b.run_id)) || ((a.run_attempt ?? 1) - (b.run_attempt ?? 1)));
    const last = rows.at(-1);
    if (!last) return no(`is PR ${k}'s land (from ${cfg.state_branch}: GitHub does not serve the PR), but no gate run on ${short(p[1])} is recorded`);
    // A run GitHub serves is verified, its artifact and its record. One GitHub hides with the PR (the
    // suspended account's run, copy PR 696, 7 Nov) stands on the process's own record: the land row
    // for this very merge and its head, and the gate row the land recorded for that run, green on
    // the head's code. Any other read failure is no answer: refused.
    const seen = (io.runState || runState)(slug, last.run_id);
    if (seen === null) return no(`is PR ${k}'s land (from ${cfg.state_branch}: GitHub does not serve the PR), but its gate run ${last.run_id} could not be read`);
    let run_unreadable = null;
    if (seen === 'gone') {
      // A row from before rows said `whole` (the copy's PR 696, run of 6 Nov 19:12) cannot say whether its
      // run was narrowed to a requirements file's tests: taken as written, a gap named and closed to every
      // row written since (LEGACY_GATE_ROWS), which says `whole`.
      const wholeRow = last.whole === true || (last.whole === undefined && String(last.at) < LEGACY_GATE_ROWS);
      if (!(last.ok === true && last.trigger === 'code' && GREEN.includes(last.suite) && wholeRow)) return no(`is PR ${k}'s land (from ${cfg.state_branch}), but its gate run ${last.run_id} on ${short(p[1])}, which GitHub does not serve, is recorded ${last.suite || 'without a suite'}${last.ok ? '' : ', not ok'}${last.trigger === 'code' ? '' : ` (${last.trigger})`}${wholeRow ? '' : ', not its whole suite'}`);
      run_unreadable = `run ${last.run_id}: GitHub does not serve it; the land's gate row, ${last.suite}`;
    } else {
      let row = null;
      try { row = art(slug, last.run_id); } catch { row = null; }
      if (!row || Number(row.run_id) !== Number(last.run_id) || row.sha !== p[1] || !whole(row, id) || !io.verify(slug, row, ctx)) return no(`is PR ${k}'s land (from ${cfg.state_branch}: GitHub does not serve the PR), but its gate run on ${short(p[1])} is not a verified green run of the whole suite`);
    }
    const v = { pr: k, id, head: p[1], parent: p[0], pr_unreadable: why.slice(0, 200), ...(run_unreadable ? { run_unreadable } : {}) };
    landOf.set(c, v);
    return v;
  };
  const judge = (c) => {
    if (landOf.has(c)) return landOf.get(c);
    const no = (why) => { const v = { why }; landOf.set(c, v); return v; };
    const k = Number(git(['log', '-1', '--format=%s', c], { cwd: root }).match(LAND_TITLE)?.[1]);
    if (!k) return no('is not a land of a publish PR');
    const p = parents(c);
    if (p.length !== 2) return no(`names PR ${k} but is not a merge of two parents`);
    // A landed PR GitHub no longer serves (C13, the coordinator, 7 Nov: PR 696, opened by the suspended
    // account, read 404 and failed layer 9's merge gate): its facts from the state branch's land row
    // for this very merge and the gate's own run artifact, recorded pr_unreadable. Any other read
    // failure, or a PR with no land row, fails closed.
    let pr;
    try { pr = io.getPR(slug, k); } catch (e) {
      if (!(e instanceof Fail) || !/HTTP 404|Not Found/i.test(e.message)) throw e;
      return hidden(c, k, p, e.message);
    }
    const id = branchModule(pr?.head?.ref, ids);
    if (!pr?.merged || pr.merge_commit_sha !== c || pr.base?.ref !== branch || !id || pr.head.sha !== p[1]) return no(`is not GitHub's merge of job PR ${k} into ${branch}`);
    const runs = gateRuns(io.comments(slug, k));
    const ctx = { pr: k, baseRef: branch, merged: { branch: pr.head.ref } };
    // The newest run on the head, as jobMerge reads it: green, verified, the module's whole suite
    // (not a run narrowed to the tests that read a requirements file).
    const row = runs.filter((r) => r.sha === p[1]).pop();
    const wholeOf = (r) => whole(r, id);
    // A records-since-green row (the PR edited, the layer tip unchanged) stands on the run it names,
    // as jobMerge follows it (confirming review N3).
    const tested = !row?.ok || !io.verify(slug, row, ctx) ? null
      : row.trigger === 'record-since-green' ? runs.filter((r) => r.sha === row.after).reverse().find((r) => wholeOf(r) && isAnc(root, r.sha, p[1]) && io.verify(slug, r, ctx)) || null
        : wholeOf(row) ? row : null;
    if (!tested) return no(`is PR ${k}'s land, but the newest gate run on its head ${short(p[1])} is ${row ? 'not a verified green run of the whole suite' : 'missing'}`);
    const v = { pr: k, id, head: p[1], parent: p[0] };
    landOf.set(c, v);
    return v;
  };
  return judge;
}

// ---- the gate's layer trigger ---------------------------------------------------------------

// For a pull request from layer/<n> into the tranche: each module whose files it changes is
// covered by its last land on the layer branch, a merge of its job's PR into layer/<n> whose head
// had a verified green gate run of that module's suite, and that head held every interface-changing
// land of each provider it uses in the layer. Anything else is a finding: nothing is re-run.
// Gate rows written before they said `whole` (this change, 7 Nov): taken as written (see layerCover).
export const LEGACY_GATE_ROWS = '2026-11-07T12:00:00Z';
export function layerCover(root, cfg, { head, mb, base, branch, changed: all, entries, slug, io }) {
  const findings = [];
  // A path whose content at the layer tip is the tranche tip's (the PR's base) is no change the layer
  // brings and needs no cover: a pin moved in place (PD-23, C56: .process and the workflow shims), or
  // anything else the layer already shares with the tranche (C61, copy PR 1111).
  const differs = base ? new Set(diffNames(root, base, head)) : null;
  const changed = differs ? all.filter((f) => differs.has(f)) : all;
  const covered = [];
  const inMod = (e, f) => ownPaths(e).some((p) => underPath(f, p));
  // Generated paths are the layer checks' at the merge (regenerated there), not a module's land's.
  const gen = generatedRows(cfg).rows;
  const need = changed.filter((f) => !isRecordOrLane(cfg, f, entries) && !isGenerated(gen, f));
  const chain = git(['rev-list', '--first-parent', head, '--not', mb], { cwd: root }).split('\n').filter(Boolean);
  const parents = (c) => git(['rev-list', '--parents', '-n', '1', c], { cwd: root }).split(' ').slice(1);
  const judge = landJudge(root, cfg, { branch, ids: new Set(entries.map((e) => e.id)), key: Number(String(branch).match(/(\d+)$/)?.[1]), slug, io });
  const byId = new Map(entries.map((e) => [e.id, e]));
  // A layer sync's merge brings the tranche's own changes (tool-made, its tree checked): not a stray.
  const synced = (c) => SYNC_TITLE.test(git(['log', '-1', '--format=%s', c], { cwd: root }));
  // Each changed file is credited per commit (C32, copy layer 11, 8 Nov: op-grades's land changed
  // files its ledger widening (PR 865) gave it, which the ledger at the head credits to
  // op-grades-folds; store-assembly's and instance-setup's lands changed files other modules own at
  // the head): covered when every commit on the chain that changed it is a layer sync or a verified
  // land of a module whose paths held it in the ledger at that land's parent, whoever owns it now.
  const needSet = new Set(need);
  const touched = new Map();
  for (const c of chain) {
    if (synced(c)) continue;
    for (const f of diffNames(root, parents(c)[0], c)) if (needSet.has(f)) touched.set(f, [...(touched.get(f) || []), c]);
  }
  // The landing module's own entry at the land's parent (the layer before it, never the job's head),
  // read once per parent and module.
  const entryAt = new Map();
  const ownedAt = (ref, id, f) => {
    const key = `${ref}:${id}`;
    if (!entryAt.has(key)) {
      const r = git(['show', `${ref}:${entryFile(id)}`], { cwd: root, allowFail: true });
      let e = null;
      try { e = r.code === 0 ? JSON.parse(r.stdout) : null; } catch { e = null; }
      entryAt.set(key, e);
    }
    const e = entryAt.get(key);
    return !!e && inMod(e, f);
  };
  // The first commit that does not cover f, with why, or null.
  const uncovered = (f) => {
    for (const c of touched.get(f) || []) {
      const v = judge(c);
      if (!v.id) return { c, why: v.why };
      if (!ownedAt(v.parent, v.id, f)) return { c, v, why: `is ${v.id}'s land (PR ${v.pr}), whose paths at ${short(v.parent)} did not hold ${f}` };
    }
    return null;
  };
  // Its providers as the modules file names them (notice.mjs usersOf's source), else the entry's own.
  const named = new Map((readModules(root, cfg, head) || []).filter((m) => m?.id).map((m) => [m.id, m.uses || []]));
  const usesOf = (e) => named.get(e.id) || e.uses || [];
  const lands = chain.map((c) => ({ c, v: judge(c) })).filter((x) => x.v.id);
  // Every module of the layer, and any other whose files changed: a user with no file of its own
  // changed still owes a green run against each provider's interface change (cold review 1).
  const n = Number(String(branch).match(/(\d+)$/)?.[1]);
  const inLayer = new Set(layersAt(root, cfg, head).find((L) => L.n === n)?.mods || []);
  for (const e of entries) {
    const fs = need.filter((f) => inMod(e, f));
    // A module with a land on the chain is judged against its providers whatever it owns now: its
    // landed files may have moved to another module since (cold review of C32).
    const landed = lands.some((x) => x.v.id === e.id);
    if (!fs.length && !inLayer.has(e.id) && !landed) continue;
    // A BLOCKED module that changed nothing on the layer is deferred, as layer status counts it,
    // and holds nothing (confirming review N2); one whose code is on the layer is judged as any.
    if (!fs.length && e.status?.state === 'BLOCKED' && !landed) continue;
    const last = lands.find((x) => x.v.id === e.id) || null; // newest first
    // Each of its files covered commit by commit (above); a file no commit covers is named with the
    // commit that does not, and why.
    const bad = fs.map((f) => ({ f, u: uncovered(f) })).filter((x) => x.u);
    if (bad.length) {
      // The words BOB knows (no land of its publish; after its last land), with the commit and why.
      const after = (c) => last && chain.indexOf(c) < chain.indexOf(last.c);
      for (const { f, u } of bad) {
        const which = `${short(u.c)}, which ${u.v ? u.why : `${u.why}: not a layer sync or a verified land`}`;
        findings.push({ check: 'layer', file: f, line: 1, message: !last ? `${e.id} changed with no land of its publish on ${branch}: ${f} by ${which}` : after(u.c) ? `${f} changed on ${branch} after ${e.id}'s last land (PR ${last.v.pr}) by a commit that is not its land: ${which}` : `${f} (${e.id}'s at the head) changed on ${branch} by ${which}` });
      }
      continue;
    }
    // Its files all came by other modules' verified lands (paths moved to it since): those lands
    // carry the provider checks; with no land of its own and no layer place, nothing more is owed.
    if (!last && fs.length && !inLayer.has(e.id)) continue;
    // Each provider in the layer: its interface-changing lands are held by this module's last green head.
    const late = [];
    for (const p of usesOf(e).filter((u) => byId.has(u) && u !== e.id)) {
      for (const pl of lands.filter((x) => x.v.id === p && !(last && isAnc(root, x.c, last.v.head)))) {
        if (interfaceChange(root, cfg, p, pl.v.parent, pl.c).changed) late.push(`${p} (PR ${pl.v.pr}, ${short(pl.c)})`);
      }
    }
    if (late.length) findings.push({ check: 'layer', file: entryFile(e.id), line: 1, message: `${e.id}'s ${last ? `last green run (PR ${last.v.pr}, ${short(last.v.head)})` : 'work (no land on the layer)'} did not hold the interface change of ${late.join(', ')}: it never counts; ${e.id} re-runs and publishes again` });
    else if (last) covered.push({ id: e.id, pr: last.v.pr, merge: last.c, ...(last.v.pr_unreadable ? { pr_unreadable: last.v.pr_unreadable } : {}), ...(last.v.run_unreadable ? { run_unreadable: last.v.run_unreadable } : {}) });
