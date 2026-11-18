  }
  log(L.rows.merged ? `layer ${n} merged into ${cfg.tranche} at ${short(L.rows.merged.commit)}` : ready ? `layer ${n} can merge: ${P3} layer merge ${n}` : `layer ${n} cannot merge yet: ${L.states.filter((s) => !DONE.includes(s.state)).length} module(s) not complete${L.holding.length ? `, ${L.holding.length} PR(s) open into ${layerBranch(n)}` : ''}${L.joinable?.length ? `, completion item(s) to join: ${L.joinable.map((x) => `${x.id} (${x.items.join(', ')})`).join(', ')}` : ''}`);
  return { ok: true, states: L.states, ready, deferred_done: done.map((s) => s.id) };
}

// ---- layer publish --------------------------------------------------------------------------

// The files a job's branch changes against the layer, outside its module (ARC-2): none may be.
export function outsideFiles(root, entry, base, head) {
  const own = ownPaths(entry);
  return diffNames(root, base, head).filter((f) => !own.some((p) => underPath(f, p)));
}

// The publish's run, as a child process: `job complete` (the module's fast checks, never a suite: AUD-7;
// the ready PR) in this checkout. { done: Promise<{ code }>, kill() }.
export function spawnComplete(root, id, args = []) {
  const tool = join(new URL('.', import.meta.url).pathname, '..', 'p3.mjs');
  const c = spawn(process.execPath, [tool, 'job', 'complete', id, ...args], { cwd: root, stdio: 'inherit', detached: true, env: { ...process.env, NODE_TEST_CONTEXT: '' } });
  const kill = () => { try { process.kill(-c.pid, 'SIGTERM'); } catch { try { c.kill('SIGTERM'); } catch { /* gone */ } } };
  // Its own process group, so a halt stops the suite's children too; and stopped with publish, so
  // an interrupted publish never leaves a job complete pushing beside the next one (cold review 6).
  const stop = () => kill();
  const sig = () => { kill(); process.exit(130); };
  process.once('exit', stop);
  process.once('SIGINT', sig);
  process.once('SIGTERM', sig);
  const off = () => { process.off('exit', stop); process.off('SIGINT', sig); process.off('SIGTERM', sig); process.off('SIGHUP', sig); };
  process.once('SIGHUP', sig);
  const done = new Promise((res) => { c.on('exit', (code, s2) => { off(); res({ code: code ?? (s2 ? 143 : 1) }); }); c.on('error', () => { off(); res({ code: 1 }); }); });
  return { done, kill };
}

// The reschedules that make a run on `testedOn` void: those for the module whose provider's land
// it does not hold.
export function voiding(root, sb, n, id, testedOn, { fetch = true, branch = layerBranch(n) } = {}) {
  if (fetch) { try { fetchState(root, sb, { fresh: true }); } catch { return []; } fetchBranch(root, branch, { allowFail: true }); }
  return flowRows(root, sb, n).reschedules.filter((r) => r.user === id && hasCommit(root, r.provider_land) && !isAnc(root, r.provider_land, testedOn));
}

// The job's publish. Refused outside an open layer, with tracked changes, or with any file outside
// the module. Each round: job sync (the layer tip merged in), the ownership check, then the run.
// A reschedule arriving mid-run halts it (the child killed, a halt run row with the minutes lost)
// and the next round starts on the new tip; a run that ends while a reschedule is outstanding
// does not count either. At most `rounds` rounds.
export async function layerPublish(root, id, { push = true, every = null, rounds = 4, sync, complete, log = console.log, args = [], session = null } = {}) {
  const cfg0 = loadConfig(root);
  if (!directMode(cfg0)) needLayerMode(cfg0, 'layer publish');
  const cfg = jobCfg(root, cfg0, id, { push });
  if (!cfg.layer) fail(`${id} is in no open layer (its layer's branch is not on origin, or the layer merged): publish needs an open layer/<n>`);
  const { n } = cfg.layer;
  const sb = cfg.state_branch;
  // An early start (R14) works on the branch cut ahead; it publishes once its layer opens.
  if (push) { try { fetchState(root, sb, { fresh: true }); } catch { /* read below as fetched */ } }
  const ahead = cutAhead(root, sb, n);
  if (ahead !== null) fail(`${id}: ${notOpen(n, ahead)}; an early start publishes once it opens; keep working and testing (${P3} job test ${id}); nothing was published`);
  // The branch it publishes onto: layer/<n>, or the tranche under the direct flow (PD-25).
  const lb = flowBase(cfg);
  const lref = push ? `refs/remotes/origin/${lb}` : `refs/heads/${lb}`;
  const doSync = sync || (async () => { const { jobSync } = await import('./job.mjs'); return jobSync(root, id, { push, pushBranch: false, log }); });
  const doComplete = complete || (() => spawnComplete(root, id, args));
  for (let round = 1; round <= rounds; round++) {
    const s = await doSync();
    if (s && s.ok === false) fail('job sync did not finish; nothing was published');
    const testedOn = rev(root, lref);
    const entry = entryAt(root, 'HEAD', id) || fail(`no ledger entry for ${id} at HEAD`);
    const out = outsideFiles(root, entry, git(['merge-base', 'HEAD', lref], { deepen: true, cwd: root }), 'HEAD');
    if (out.length) fail(`refused: the publish touches files outside ${id} (ARC-2): ${out.slice(0, 10).join(', ')}${out.length > 10 ? ` and ${out.length - 10} more` : ''}; nothing was published`);
    const started = now();
    const pre = voiding(root, sb, n, id, testedOn, { fetch: push, branch: lb });
    if (pre.length) fail(`${lb} at ${short(testedOn)} lacks ${pre.map((r) => `${r.provider}'s land ${short(r.provider_land)}`).join(', ')}: run publish again once origin's ${lb} holds it`);
    log(`${cfg.layer.direct ? lb : `layer ${n}`}, round ${round}: ${id} runs on ${lb} ${short(testedOn)}`);
    // The run's own job complete reads the state this command wrote (R17: writes are coalesced).
    if (pendingWrites()) flushState();
    const c = doComplete();
    let halted = null;
    // The layer branch read again while the run goes: every pacing.poll_first_s (30 s), fixed (PD-6);
    // every, a fixed pause, for the tests.
    let k = 0;
    let timer = null;
    const check = () => {
      if (halted) return;
      const v = voiding(root, sb, n, id, testedOn, { fetch: push, branch: lb });
      if (v.length) { halted = v; c.kill(); return; }
      timer = setTimeout(check, every ?? pollMs(++k));
    };
    timer = setTimeout(check, every ?? pollMs(++k));
    let code;
    try { ({ code } = await c.done); } finally { clearTimeout(timer); }
    if (!halted) { const v = voiding(root, sb, n, id, testedOn, { fetch: push, branch: lb }); if (v.length) halted = v; }
    const ended = now();
    // One file per run, never two runs under one name (two in one second, the same round).
    const runName = `${safeName(id)}-${Date.parse(started)}-${round}-${randomUUID().slice(0, 8)}`;
    const base = { row: 'run', layer: n, module: id, round, started, ended, minutes: minutes(started, ended), tested_on: testedOn, ...(session ? { session } : {}) };
    if (halted) {
      // A killed run may leave the entry and metrics half written, and generated files built (its
      // own restore never ran): the tree was clean when the round began (job sync refuses a dirty
      // one), so every tracked file is put back to HEAD for the next round (cold review 6).
      git(['checkout', '-q', 'HEAD', '--', '.'], { cwd: root, allowFail: true });
      const keys = halted.map((r) => r.key);
      writeRows(root, sb, `layer ${n}: ${id}'s run halted by a reschedule`, [[flowFile(n, 'run', runName), { ...base, result: 'halted', exit: code, by: keys, minutes_lost: minutes(started, ended), at: ended }]]);
      log(`halted: ${halted.map((r) => `${r.provider} changed its interface (land ${short(r.provider_land)})`).join('; ')}; this run never counts; ${round < rounds ? 'starting again on the new layer tip' : 'no rounds left'}`);
      continue;
    }
    writeRows(root, sb, `layer ${n}: ${id}'s run ${code === 0 ? 'passed' : 'failed'}`, [[flowFile(n, 'run', runName), { ...base, result: code === 0 ? 'pass' : 'fail', exit: code, at: ended }]]);
    if (code !== 0) { log(`not published: the run failed (exit ${code}); fix it and run ${P3} layer publish ${id} again`); return { ok: false, round, code }; }
    log(`published: ${id}'s PR into ${lb} is ready; the gate on its tip decides the land (${P3} layer land <pr>, the merge tool's)`);
    return { ok: true, round, testedOn };
  }
  return { ok: false, halted: true, round: rounds };
}

// ---- layer retest ---------------------------------------------------------------------------

// layer retest <id> (coordinator, 6 Nov: a provider's land rescheduled 12 users, most COMPLETE before
// the layer opened with no code on it, each re-test a whole job session): for a rescheduled module
// with no commit of its own on the layer since the open, its job branch (the one its last start row
// names, already in the layer) moves to the layer tip with one records-only retest row, and a ready
// pull request into the layer is opened. CI's gate runs its whole suite on the
// layer tip, against its providers' current versions, as on any ready layer job PR; green, the merge
// tool lands it (layer land), and that land clears the reschedule. The gate's trust stays with a CI
// run, never a state row (coordinator, 6 Nov). Red: a job starts (job start --reopen). No session.
// layer clear <user> --provider <id> --why "<the ruling>" (C11 c, the coordinator, 7 Nov: a false
// reschedule had no scoped clear, only notice withdraw, for every user, or a retest): the user's
// outstanding reschedules from that provider, in the open layer, cleared by one row each
// (layerflow/<n>/clear/), the ruling and who gave it recorded; the user owes them no more.
export function layerClear(root, user, { provider, land, why, by = 'bob', log = console.log } = {}) {
  const cfg = loadConfig(root);
  needLayerMode(cfg, 'layer clear');
  if (typeof provider !== 'string' || !provider.trim()) fail('layer clear <user> --provider <id> --why "<the ruling>"');
  if (typeof why !== 'string' || !why.trim()) fail('layer clear needs --why: the ruling that the reschedule is false, and whose');
  fetchState(root, cfg.state_branch, { fresh: true });
  // The open layer from the state rows alone (no GitHub read: a record of a ruling).
  const v = { n: layersAt(root, cfg, `refs/remotes/origin/${cfg.tranche}`).map((L) => L.n).find((k) => { const r = flowRows(root, cfg.state_branch, k); return r.open && !r.merged; }) ?? null };
  if (v.n === null) fail(`no layer is open: nothing to clear`);
  const rows = flowRows(root, cfg.state_branch, v.n);
  const anc = (a, b) => isAnc(root, a, b);
  const all = outstanding(rows.reschedules, rows.lands, user, anc).filter((r) => r.provider === provider);
  if (!all.length) fail(`${user} owes no reschedule from ${provider} in layer ${v.n}; nothing recorded`);
  // One land at a time when the provider landed more than once (cold review of C11: a false first
  // change and a real second one are not cleared together).
  const lands = [...new Set(all.map((r) => r.provider_land))];
  if (lands.length > 1 && !land) fail(`${user} owes reschedules from ${provider}'s ${lands.length} lands (${lands.map((x) => short(x)).join(', ')}): name the one the ruling is for with --land <sha>; nothing recorded`);
  const owed = land ? all.filter((r) => String(r.provider_land).startsWith(String(land))) : all;
  if (!owed.length) fail(`${user} owes no reschedule from ${provider}'s land ${land} in layer ${v.n}; nothing recorded`);
  const at = now();
  writeRows(root, cfg.state_branch, `layer ${v.n}: ${user}'s reschedule from ${provider} cleared`, owed.map((r) => [flowFile(v.n, 'clear', `${safeName(user)}-${safeName(provider)}-${short(r.provider_land)}`), { row: 'clear', layer: v.n, user, provider, provider_land: r.provider_land, key: r.key, why: why.trim(), at, by }]));
  log(`${user}: ${owed.length} reschedule(s) from ${provider} cleared in layer ${v.n} (${why.trim()}); its other providers' stand`);
  return { ok: true, cleared: owed.map((r) => r.key) };
}

