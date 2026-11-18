  // mechanical pass while no job runs, with one full test run), from a pass/<name> branch, which
  // only merge --plain --pass lands: each module it touches runs its whole suite, and its refresh
  // may change other files.
  const passPR = !job && PASS_BRANCH.test(branch || '');
  if (passPR) runRow.pass = true;
  // A lane's pull request (lane.mjs; Bob, 5 Nov): every file inside one lane's folder, records
  // aside, and not a job's nor the tranche's: the records-only path, no suite, no install or
  // build; the record checks above still run. A generated output is built, never committed.
  const lanePR = !job && branch !== cfg.tranche ? laneOnly(cfg, changed, entries) : null;
  if (lanePR) {
    runRow.lane = lanePR;
    for (const f of changed.filter((x) => isGenerated(gen.rows, x) && exists(root, head, x))) findings.push(F('generated', f, `${f} is a generated output; lane ${lanePR} does not commit it: it is built at layer close, deploy and release`));
  }
  // Each lane whose folder the pull request touches runs its own checks (coordinator, 6 Nov: ux lane
  // Q7's broken words build landed green): in place of the suite on a lane-only pull request, beside
  // whatever else runs on any other (cold review of PR 203). Installed and its generated files built
  // first, as a suite's are. Red when any fails.
  const touchedLanes = branch === cfg.tranche ? [] : [...new Set(changed.map((f) => laneOfPath(cfg, f, entries)).filter(Boolean))];
  const laneCmds = touchedLanes.map((name) => ({ name, cmds: laneChecks(cfg, name), dir: (Array.isArray(cfg.lanes) ? cfg.lanes : []).find((x) => x?.name?.trim?.() === name)?.dir || null }));
  for (const l of laneCmds.filter((x) => x.cmds === null)) findings.push(F('lane-checks', CONFIG_FILE, `lane ${l.name}'s checks in ${CONFIG_FILE} are not a list of commands (each a string or a list of words)`));
  const runLanes = laneCmds.filter((x) => x.cmds?.length);
  if (runLanes.length) {
    const inst = install(root, cfg.lockfiles, exec ? { exec } : {}).findings;
    findings.push(...inst);
    if (!inst.length && gen.rows.length) findings.push(...buildGenerated(root, gen.rows, { timeout, log, ...(exec ? { exec } : {}) }).findings);
    runRow.lane_checks = [];
    for (const l of runLanes) {
      const lc = inst.length ? { findings: [], ran: [] } : laneCheckRun(root, l.name, l.dir, l.cmds, { timeout, log, ...(exec ? { exec } : {}) });
      findings.push(...lc.findings);
      runRow.lane_checks.push(...lc.ran.map((x) => ({ lane: l.name, ...x })));
    }
  }
  // A ready job PR into a layer branch (layerflow.mjs) runs its suite even when it changes only
  // records: a rescheduled user re-publishes with no code change, and its run on the new layer tip,
  // against its provider's new version, is the evidence the layer's merge reads (cold review 1).
  const layerJob = !!job && layerMode(cfg) && layerOfBranch(live?.base?.ref) !== null;
  const recordOnly = !(layerJob && !draft) && (changed.every((f) => isRecordPath(cfg, f)) || !!lanePR);
  // The fast path stands on an earlier green run only when that run is verified (verifyRow).
  const lastGreen = prior.filter((r) => r.ok && r.trigger === 'code' && r.base === base).reverse().find((r) => io.verify(slug, r, { pr, baseRef: cfg.tranche }));
  const sinceGreen = lastGreen && git(['cat-file', '-e', `${lastGreen.sha}^{commit}`], { cwd: root, allowFail: true }).code === 0
    // A lane's folder counts as records here: a lane's land between a job's green run and its
    // merge does not send the job back through its suite (Bob, 5 Nov).
    && diffNames(root, lastGreen.sha, head).every((f) => isRecordOrLane(cfg, f, entries, { self: job }));

  // The base the job's change is reverted to: the first parent of GitHub's merge checkout,
  // the tranche as it was merged with, else the event's base.
  const parents = git(['rev-list', '--parents', '-n', '1', 'HEAD'], { cwd: root }).split(' ').slice(1);
  const revertBase = parents.length === 2 && parents[1] === head ? parents[0] : base;

  // A ready job's receipt is checked against CI's own run of its tests (AUD-2, JOB-7, SES-12).
  // Records only, the fast path stands only on a green code run that measured what the receipt
  // claims (measuredBy); with no such run the gate runs the suite here, so a records-only job pull
  // request, or a records-only head after a code run on another tree, is still checked. A plain
  // pull request, or a job's with no receipt yet, keeps the record fast path.
  const jobReceipt = entry && !draft && receipt?.module === job ? receipt : null;
  const stands = jobReceipt && sinceGreen && git(['merge-base', '--is-ancestor', jobReceipt.sha, head], { cwd: root, allowFail: true }).code === 0
    ? measuredBy(root, cfg, jobReceipt, lastGreen, entries) : null;
  const receiptRun = !!jobReceipt && (recordOnly || sinceGreen) && !stands?.ok;
  // The revert exemption (AUD-1, JOB-12): only a reviewed one recorded on the pull request, never
  // the receipt's own words (a receipt never exempts itself).
  const exemption = entry && !draft ? revertExemption(all, { root, cfg, head: judged, entry, job, jobSession: completeSession(rowsAt(root, judged, job)) }) : null;

  // The shared layer branch's merge (layerflow.mjs; Bob, 5 Nov: no test run at layer close): a pull
  // request from layer/<n> into the tranche, with the base's merge_strategy "layer", runs no suite;
  // each module it changes must be covered by its last land's verified green gate run, on a head
  // that held every interface change of its providers. Anything short is a finding, never a re-run.
  const layerPR = !job && layerMode(cfg) && layerOfBranch(branch) !== null && (live?.base?.ref ?? null) === cfg.tranche;
  if (recordOnly && !jobReceipt) runRow.trigger = 'record';
  else if (draft) runRow.trigger = 'draft';
  else if (layerPR) {
    runRow.trigger = 'layer';
    const lc = layerCover(root, cfg, { head, mb, branch, changed, entries, slug, io });
    const unreadable = lc.covered.filter((c) => c.pr_unreadable).map((c) => ({ id: c.id, pr: c.pr, why: c.pr_unreadable, ...(c.run_unreadable ? { run: c.run_unreadable } : {}) }));
    runRow.layer = { n: layerOfBranch(branch), covered: lc.covered.map((c) => c.id), findings: lc.findings.length, ...(unreadable.length ? { pr_unreadable: unreadable } : {}) };
    for (const u of unreadable) log(`${u.id}: PR ${u.pr} is not served by GitHub (${u.why}); covered from the state branch's land row and ${u.run ? `its gate row (${u.run})` : 'its gate run\'s artifact'}`);
    for (const c of lc.covered) log(`${c.id}: covered by its land of PR ${c.pr} (${String(c.merge).slice(0, 10)}); no suite runs`);
    findings.push(...lc.findings);
  }
  else if (sinceGreen && !receiptRun) { runRow.trigger = 'record-since-green'; runRow.after = lastGreen.sha; }
  else {
    runRow.trigger = 'code';
    if (receiptRun) log(`only records changed${sinceGreen ? ` since ${String(lastGreen.sha).slice(0, 10)}` : ''}, but no green code run measured receipt attempt ${jobReceipt.attempt}${stands ? ` (${stands.why})` : ''}: the gate runs the ${job} suite to check it`);
    // A job's PR runs its module; any other PR runs every module whose files it touches. The
    // tranche (into main) runs only the modules with a file its job merges did not gate.
    let touched = changed;
    if (!entry && branch && branch === cfg.tranche) {
      const c = trancheCover(root, cfg, { head, mb, changed, entries, slug, io, log });
      touched = c.uncovered;
      runRow.through = c.through;
      runRow.uncovered = c.uncovered.length;
    }
    const scope = entry ? [entry] : entries.filter((e) => touched.some((f) => inModule(e, f)));
    runRow.scope = scope.map((e) => e.id);
    // A pull request that is not a job's, touching no module's files, still has the generated rows
    // regenerated when it changes anything but records: a generator reads files outside every module
    // (the copy, 6 Nov: modules.json gained 7 rows and order.mjs went stale while the gate passed).
    const genRun = scope.length > 0 || (!job && gen.rows.length > 0 && touched.some((f) => !isRecordPath(cfg, f)));
    if (genRun && !scope.length) log('no module in scope: the generated rows are regenerated, as this change may be one a generator reads');
    // Base-red's tree (basered.mjs startBase): its install and build beside the head's, ready if
    // the suite fails. Not for the tranche into main, which tolerates nothing, nor with a stand-in
    // exec (the tests'), which a process of its own cannot use.
    // A change only to a module's requirements file runs only the tests that read it: read here
    // to know whether a suite runs at all, and again once the generated files are built.
    // Not for a job PR into a layer branch: its land must carry a run of the whole suite, which
    // the layer's merge reads (confirming review N1).
    const onlyAt = (e, l = () => {}) => (branch !== cfg.tranche && !layerJob && !passPR ? requirementsOnly(root, cfg, e, { changed, rows: gen.rows, log: l }) : null);
    // Only a suite whose failures can be read per test can be base-red.
    const mayBaseRed = scope.some((e) => reportsEvents(e.suite.command) && (onlyAt(e) === null || onlyAt(e).length));
    const prepared = mayBaseRed && branch !== cfg.tranche && !exec && opts.prepareBase !== false
      ? startBase(root, { base: revertBase, cfg, rows: gen.rows, timeout, log }) : null;
    // GAT-5: every lock file, installed where it sits.
    const inst = genRun ? install(root, cfg.lockfiles, exec ? { exec } : {}).findings : [];
    // A pull request run only for the generated rows (no module in scope) is not refused on an
    // install it never ran before: logged, and its generated checks skipped (cold review).
    if (scope.length) findings.push(...inst);
    else for (const f of inst) log(`install failed (${f.message}): the generated rows were not regenerated for this change`);
    // Generated files the commit does not track are built before the checks and the suite, as
    // deploy and release build them (copy, 4 Nov: an untracked rows.mjs failed 41 of 113 tests).
    let builtRows = new Set();
    if (genRun && !inst.length && gen.rows.length) {
      const b = buildGenerated(root, gen.rows, { timeout, log, ...(exec ? { exec } : {}) });
      runRow.built = b.built;
      builtRows = b.ran;
      findings.push(...b.findings);
    }
    // ARC-4: the entry's own checks, as job complete runs them.
    if (entry && !inst.length) findings.push(...entryChecks(root, entry, { timeout, log }));
    const results = [];
    const tolerated = [];
    for (const e of scope) {
      const only = onlyAt(e, log);
      if (only && !only.length) { (runRow.requirements_only ||= []).push({ module: e.id, files: [] }); results.push({ exit: 0, seconds: 0, tests: { total: 0, pass: 0, fail: 0 }, passing: [], output: '' }); continue; }
      if (only) (runRow.requirements_only ||= []).push({ module: e.id, files: only });
      const s = withEvents((events) => runSuite(root, e, only || undefined, { timeout, events }));
      results.push(s);
      if (s.exit !== 0) {
        // Base-red (basered.mjs): the failing tests run again at the tranche tip the PR merges
        // into; failures the base has too are not the PR's. Never for the tranche into main,
        // where every failure tolerated on the way is owed.
        // Its own budget, not what the suite left (copy, 4 Nov: plane's suite takes 19-20 of 20 min).
        const br = branch !== cfg.tranche && !/ETIMEDOUT/.test(s.output)
          ? baseRed(root, e, { base: revertBase, failing: s.failing, cfg, rows: gen.rows, timeout, ...(exec ? { exec } : {}), log, prepared })
          : null;
        if (br?.ok) {
          s.baseRed = true;
          tolerated.push({ module: e.id, ...br.base_red });
          log(`the ${e.id} suite failed (exit ${s.exit}), but each of its ${br.base_red.tests.length} failing test(s) fails at the base ${String(revertBase).slice(0, 10)} too: tolerated as base-red, owed at the layer close and the tranche into main:\n${br.base_red.tests.map((t) => `  ${t}`).join('\n')}`);
          continue;
        }
        findings.push(F('suite', e.tests[0], `the ${e.id} suite failed (exit ${s.exit}${/ETIMEDOUT/.test(s.output) ? ', timed out' : ''}): ${JSON.stringify(s.tests)}${br ? `; not base-red: ${br.why}` : ''}`));
