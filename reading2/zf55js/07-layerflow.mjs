export function layerStatus(root, n, { io = {}, log = console.log } = {}) {
  n = layerNum(n);
  const cfg = loadConfig(root);
  needLayerMode(cfg, 'layer status');
  fetchLayer(root, cfg, n);
  const ahead = cutAhead(root, cfg.state_branch, n);
  if (ahead !== null) fail(notOpen(n, ahead));
  const L = readLayer(root, cfg, n, { io, slug: io.slug || repoSlug(root) });
  log(`${layerName(L.layers.find((x) => x.n === n), n, cfg.tranche)}, round ${roundOf(L.layers.find((x) => x.n === n))}:`);
  for (const s of L.states) log(`${s.id}: ${s.state} (${s.why})`);
  for (const c of companionLines(L.rows, L.states)) log(c);
  const ready = mergeReady(L.states) && !L.holding.length && !L.joinable?.length;
  const done = L.states.filter((s) => s.done_work);
  if (done.length) {
    log(`${done.length} deferred with work done (suite green, BLOCKED only on a process finding): restart to publish; layer merge ${n} refuses until then, or takes --defer-done "<why>":`);
    for (const s of done) log(`  ${P3} job start ${s.id} --restart "its work is done and green; BLOCKED only on a process finding: publish it"   (PR ${s.done_work}${s.done_unknown ? '; its gate runs could not be read, so counted as done until they are' : ''})`);
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

export function layerRetest(root, id, { io = {}, log = console.log, by = 'bob', cause = null } = {}) {
  const cfg0 = loadConfig(root);
  const direct = directMode(cfg0);
  if (!direct) needLayerMode(cfg0, 'layer retest');
  const slug = io.slug || repoSlug(root);
  const x = { openPRs, createPR, markReady, prsFromBranch, comments: ghComments, jobHeads: originJobs, ...io };
  const cfg = jobCfg(root, cfg0, id);
  if (!cfg.layer) fail(`${id} is in no open layer (its layer's branch is not on origin, or the layer merged)`);
  const { n } = cfg.layer;
  // Its base: layer/<n>, or the tranche under the direct flow (PD-25).
  const b0 = flowBase(cfg);
  if (direct) { fetchBranch(root, cfg0.tranche, { allowFail: true }); fetchState(root, cfg0.state_branch, { fresh: true }); } else fetchLayer(root, cfg0, n);
  const L = direct ? readDirect(root, cfg0, { io: { openPRs: x.openPRs }, slug }) : readLayer(root, cfg0, n, { io: { openPRs: x.openPRs }, slug });
  const s = L.states.find((m) => m.id === id) || fail(`${id} is not a module of layer ${n}`);
  const reopen = `${P3} job start ${id} --sessions <file> --reopen "re-test against the new interface of ${[...new Set(s.outstanding.map((r) => r.provider))].join(', ') || 'its providers'}"`;
  if (s.state !== 'rescheduled' || s.pr !== null) fail(`${id} is ${s.state}${s.pr !== null ? ` with PR ${s.pr} open` : ''}: layer retest is for a rescheduled module with no pull request open`);
  // Unmet requirement marks are a job's to meet: a retest would land it with them still unmet.
  // A breaking change is a job's (Bob's "c"); the retest's land would clear it too (cold review of PR 193).
  const breaking = s.outstanding.filter((r) => r.class !== 'additive');
  if (breaking.length) fail(`${id} owes a job for ${[...new Set(breaking.map((r) => r.provider))].join(', ')}'s breaking change: ${reopen}`);
  if (s.marks.length) fail(`${id} has unmet requirement marks (${s.marks.join(', ')}): a job meets them: ${P3} job start ${id} --sessions <file> --reopen "meet the unmet requirement marks ${s.marks.join(', ')} and re-test against the new interface"`);
  const tip = rev(root, L.ref);
  const e = L.entries.get(id) || fail(`no ledger entry for ${id}`);
  if (e.status?.state !== 'COMPLETE') fail(`${id} is ${e.status?.state} on ${b0}: a retest re-runs a COMPLETE module; ${reopen}`);
  // Its own work may be on the layer (landed): the retest re-runs it there. Work the layer lacks
  // (below) is a job's.
  // Its job branch, as its last start row names it. It holds nothing the layer lacks but earlier
  // retests (a red one, or one a later provider land overtook), and no other job branch of it holds
  // work the layer lacks (a fresh start whose pull request never opened: cold review of PR 193).
  const branch = startBranch(rowsAt(root, tip, id), id);
  const ids = new Set([...ledgerIds(root, L.ref), ...ledgerIds(root, `refs/remotes/origin/${cfg0.tranche}`)]);
  const heads = x.jobHeads(root);
  if (heads === null) fail('origin\'s job branches could not be read; nothing was done');
  let at = '';
  for (const h of [...heads].filter((q) => branchModule(q, ids) === id)) {
    fetchBranch(root, h, { allowFail: true });
    const t = rev(root, `refs/remotes/origin/${h}`);
    if (h === branch) at = t;
    const extra = isAnc(root, t, tip) ? [] : git(['rev-list', '--no-merges', '--format=%s', t, `^${tip}`], { cwd: root }).split('\n').filter((l) => l && !l.startsWith('commit '));
    if (extra.length && (extra.some((l) => !l.startsWith(`layer retest ${id} `)) || diffNames(root, git(['merge-base', t, tip], { deepen: true, cwd: root }), t).some((f) => f !== metricsFile(id)))) {
      fail(`origin's ${h} at ${short(t)} has work ${b0} lacks: a job re-tests it: ${reopen}`);
    }
  }
  // GitHub's list, with each land the state branch recorded that GitHub no longer lists (hidden).
  // The branch may be gone (the cleanup deletes a landed job branch): the layer tip holds its lands.
  const prs = landedFrom(root, cfg0.state_branch, id, branch, at || tip, x.prsFromBranch(slug, branch));
  if (prs === null) fail(`GitHub unreadable: the pull requests from ${branch} are not known; nothing was done`);
  const open = prs.find((p) => p.state === 'open');
  if (open) fail(`${branch} has pull request ${open.number} open: land or close it first`);
  const providers = [...new Set(s.outstanding.map((r) => r.provider))];
  const sha = withTemp('p3-layer-', (tmp) => {
    const w = join(tmp, 'w');
    // On the layer tip; a branch holding an earlier retest takes the layer in by a merge (no rewrite).
    const from = at && !isAnc(root, at, tip) ? at : tip;
    git(['worktree', 'add', '-q', '--detach', w, from], { cwd: root });
    try {
      if (from !== tip) git(['merge', '-q', '--no-edit', '-m', `Merge ${b0} into ${branch}`, tip], { cwd: w });
      appendRow(w, id, { row: 'retest', event: 'retest', layer: n, tested_on: tip, against: providers, by });
      git(['add', '--', metricsFile(id)], { cwd: w });
      git(['commit', '-q', '-m', `layer retest ${id} on ${b0} ${short(tip)}`, '--', metricsFile(id)], { cwd: w });
      const h = git(['rev-parse', 'HEAD'], { cwd: w });
      const p = git(['push', '-q', 'origin', `${h}:refs/heads/${branch}`], { cwd: w, allowFail: true });
      if (p.code !== 0) fail(`the push of ${branch} failed (${p.stderr.trim()}); nothing was opened`);
      return h;
    } finally { git(['worktree', 'remove', '--force', w], { cwd: root, allowFail: true }); }
  }, { root });
  const body = [`layer retest of ${id} on ${b0} ${short(tip)}, against ${providers.join(', ')}'s new interface: one records-only commit, no job session.`, '', `CI's gate runs ${id}'s whole suite on this head; green, the merge tool lands it (${P3} layer land <this PR>). Red: ${reopen}.`].join('\n');
  const pr = x.createPR(slug, { head: branch, base: b0, title: `layer retest: ${id}`, body, draft: true });
  writeRows(root, cfg0.state_branch, `layer ${n}: ${id} retest PR ${pr.number}`, [[flowFile(n, 'retest', `${safeName(id)}-${pr.number}`), { row: 'retest', layer: n, module: id, pr: pr.number, head: sha, tested_on: tip, against: providers, ...(cause !== null ? { cause } : {}), at: now(), by }]]);
  x.markReady(slug, pr.number);
  log(`layer retest: ${id} on ${b0} ${short(tip)}: PR ${pr.number} from ${branch}, ready; the gate runs its whole suite. Green: ${P3} layer land ${pr.number}. Red: close it and run ${P3} layer retest ${id} again, or ${reopen}`);
  return { ok: true, pr, branch, head: sha, tested_on: tip };
}

// ---- layer land -----------------------------------------------------------------------------

export function mergeVia(slug, n, sha, title) {
  return import('./merge.mjs').then((m) => m.mergePR(slug, n, sha, { title }));
}

// A land's interface change and whom it reaches (layer land; direct land, PD-25): the provider's
// interface before and after, its declared users, and for a change confined to its own tests (C11,
// PD-15) the importers it reaches and each user's class and triggers. rows: the flow's rows (its
// earlier lands of this provider).
export function landReach(root, cfg, id, before, after, rows) {
  const ic = interfaceChange(root, cfg, id, before, after);
  const users = usersOf(root, cfg, id, after);
  // A change confined to its own tests (C11) reaches only the users importing a changed test file,
  // as breaking for them; for the rest it is no change.
  let reach = null;
  // An earlier land of this provider in the layer that changed its source (or one recorded before
  // that was read) leaves its tests' verdict standing: this test change may be the only sign of it.
  const earlier = rows.lands.some((l) => l.module === id && !l.interface?.test_only && l.interface?.source_changed !== false);
  // The users importing a changed test file: breaking for each of them, whatever the land's class.
  let breakingFor = new Set();
  if (ic.test_only) {
    // Any module may import a provider's test file, a declared user or not.
    const others = (readModules(root, cfg, after) || []).map((m) => m?.id).filter((m) => m && m !== id);
    const pe = entryAt(root, after, id);
    ic.test_only.importers = testImporters(root, cfg, after, [...new Set([...users, ...others])], ic.test_only.files, { provTests: pe?.tests || [] });
    breakingFor = new Set(ic.test_only.importers);
  }
  if (ic.test_only && earlier) {
    ic.test_only.earlier_source = true;
    // PD-15 (8 Nov): this land changed neither source nor exports, so its tests' verdict is at most
    // additive: each user is retested by its gate (a red retest falls back to a job), never a job each
    // (copy layer 12: hypotheses' c2e2567196 started four). by_tests keeps the tests' own verdict.
    let cls = ic.test_only.by_tests;
    if (cls === 'breaking') { cls = 'additive'; ic.test_only.capped = 'PD-15'; }
    // With the tests reading no change, only the importers are reached, as under C11.
    if (cls === 'none' && breakingFor.size) { cls = 'breaking'; reach = new Set(breakingFor); }
    ic.class = cls;
    ic.changed = cls !== 'none';
    if (breakingFor.size) ic.triggers = [...new Set([...(ic.triggers || []), 'test-import'])];
    for (const u of ic.test_only.importers) if (!users.includes(u)) users.push(u);
  } else if (ic.test_only) {
    reach = new Set(ic.test_only.importers);
    ic.triggers = reach.size ? ['test-import'] : [];
    if (reach.size) { ic.class = 'breaking'; ic.changed = true; }
    for (const u of ic.test_only.importers) if (!users.includes(u)) users.push(u);
  }
  const classFor = (u) => (breakingFor.has(u) ? 'breaking' : ic.class);
  // test-import names an importer's own row only, never a user's whose class the tests set (cold review of C38).
  const triggersFor = (u) => (breakingFor.has(u) ? ic.triggers : (ic.triggers || []).filter((t) => t !== 'test-import'));
  return { ic, users, reach, classFor, triggersFor };
}

// The merge tool's land of a publish PR into its layer branch.
export async function layerLand(root, prn, { io = {}, log = console.log, by = 'bob' } = {}) {
  const cfg = loadConfig(root);
  // PD-25: under the direct flow a job PR lands into the tranche (direct.mjs).
  if (directMode(cfg)) return directLand(root, prn, { io, log, by });
  needLayerMode(cfg, 'layer land');
  const slug = io.slug || repoSlug(root);
  const x = { getPR, checkRun, comments: ghComments, merge: (s, k, sha, title) => mergeVia(s, k, sha, title), ...io };
  const n0 = Number(prn);
  if (!Number.isInteger(n0) || n0 <= 0) fail(`layer land <pr>, a pull request number, not ${JSON.stringify(prn)}`);
  const pr = x.getPR(slug, n0) || fail(`pull request ${n0} not found`);
  const n = layerOfBranch(pr.base?.ref);
  if (n === null) fail(`pull request ${n0} is into ${pr.base?.ref}, not a layer branch: a job's pull request goes into its layer's branch`);
  // A land GitHub merged but never recorded (its state write failed after the merge: cold review 7)
  // is recorded on a second run, from the merge commit: its reschedules are never lost.
  const recover = pr.merged === true && !!pr.merge_commit_sha;
  if (pr.state !== 'open' && !recover) fail(`pull request ${n0} is ${pr.merged ? 'merged' : pr.state}`);
  if (pr.draft && !recover) fail(`pull request ${n0} is a draft: the job publishes it (${P3} layer publish <id>)`);
  if (pr.head?.repo?.full_name && pr.head.repo.full_name !== slug) fail(`pull request ${n0} is not from a branch of ${slug}`);
  fetchLayer(root, cfg, n);
  const lref = layerRef(n);
  const rows = flowRows(root, cfg.state_branch, n);
  if (!rows.open) fail(`layer ${n} was not opened by ${P3} layer open ${n}`);
  if (rows.merged) fail(`layer ${n} already merged into ${cfg.tranche}`);
  const id = branchModule(pr.head?.ref, new Set([...ledgerIds(root, lref), ...ledgerIds(root, `refs/remotes/origin/${cfg.tranche}`)])) || fail(`pull request ${n0} is from ${pr.head?.ref}, not a job branch`);
  if (!(layersAt(root, cfg, lref).find((L) => L.n === n)?.mods || []).includes(id) && !rows.joins.some((j) => j.module === id)) fail(`${id} is not a module of layer ${n}, nor joined it (${P3} layer join)`);
  fetchBranch(root, pr.head.ref, { allowFail: true });
  const head = pr.head.sha;
  if (!hasCommit(root, head)) fail(`this clone does not hold ${short(head)}, the head of pull request ${n0}`);
  let before;
  let after;
  if (recover) {
    if (rows.lands.some((l) => l.pr === n0)) fail(`pull request ${n0} is merged and its land is recorded`);
    after = pr.merge_commit_sha;
    if (!hasCommit(root, after)) fail(`this clone does not hold ${short(after)}, pull request ${n0}'s merge`);
    before = git(['rev-parse', `${after}^1`], { cwd: root });
    log(`pull request ${n0} merged at ${short(after)} with no land recorded: recording it now`);
  } else {
  // The gate on the PR's tip, green: the publish's CI evidence (JOB-12's revert check included).
  const g = x.checkRun(slug, head, 'gate');
  if (g?.status !== 'completed' || g.conclusion !== 'success') fail(`the gate on ${short(head)} is ${g ? `${g.status}${g.conclusion ? ` ${g.conclusion}` : ''}` : 'not run'}: a publish lands only on a green gate on its tip`);
  const e = entryAt(root, head, id) || fail(`no ledger entry for ${id} at ${short(head)}`);
  before = rev(root, lref);
  const out = outsideFiles(root, e, git(['merge-base', before, head], { deepen: true, cwd: root }), head);
  if (out.length) fail(`refused: pull request ${n0} changes files outside ${id} (ARC-2): ${out.slice(0, 10).join(', ')}`);
  // A run that started before a provider's newest interface change never counts (Bob, 5 Nov).
  const late = outstanding(rows.reschedules, [], id, () => false).filter((r) => !isAnc(root, r.provider_land, head));
  if (late.length) fail(`refused: ${id}'s run on ${short(head)} started before ${late.map((r) => `${r.provider}'s interface change (land ${short(r.provider_land)})`).join(', ')}: it never counts; the job runs ${P3} layer publish ${id} again`);
  // Exports that cannot be read refuse the land (Bob, 6 Nov, R8): never a reschedule of every user.
  const pre = (x.interfaceChange || interfaceChange)(root, cfg, id, before, head);
  if (pre.unread) fail(`refused: ${id}'s exports could not be read at ${short(head)} (${pre.unread}); the job fixes what cannot be read and publishes again; nothing was merged`);
  const r = await x.merge(slug, n0, head, landTitle(n0));
  if (!r?.merged && !r?.sha) fail(`GitHub did not merge pull request ${n0}: ${JSON.stringify(r).slice(0, 200)}`);
  fetchBranch(root, layerBranch(n));
  after = r.sha && hasCommit(root, r.sha) ? r.sha : rev(root, lref);
  }
  const { ic, users, reach, classFor, triggersFor } = landReach(root, cfg, id, before, after, rows);
  const layers = layersAt(root, cfg, after);
  // Where each user's work is (R12; cold review of PR 191): joined to this layer, or to a later one
  // not merged, else its map layer. A joined provider's users from its own map layer on are noticed
  // (those in layers merged since come back through the notice and a join).
  const joinedTo = new Map();
  for (const L of layers) if (L.n > n) { const r = flowRows(root, cfg.state_branch, L.n); if (!r.merged) for (const j of r.joins) joinedTo.set(j.module, L.n); }
  for (const j of rows.joins) joinedTo.set(j.module, n);
  const home = (u) => joinedTo.get(u) ?? layerOf(layers, u);
  // A joined module, or one a completion layer reopens (C33), notices its users from its map layer
  // on: those in merged layers come back through the notice (cold review of C33).
  const floor = joinedTo.get(id) === n || layers.find((L) => L.n === n)?.completion || layers.find((L) => L.n === n)?.round ? (layerOf(layers, id) ?? n) : n;
  const same = users.filter((u) => home(u) === n && (!reach || reach.has(u)));
  // The old rule's count reads every declared user in the layer, whatever reach filtered (cold review).
  const sameAll = usersOf(root, cfg, id, after).filter((u) => home(u) === n);
  const later = users.filter((u) => { const k = home(u); return k !== n && (k === null || k > floor) && (!reach || reach.has(u)); });
  const runs = gateRuns(x.comments(slug, n0)).filter((q) => q?.sha);
  const at = now();
  // A changed Public / Provides text alone is a notice to every user, in this layer and later ones.
  const noticed = ic.changed ? later : ic.provides ? users.filter((u) => same.includes(u) || later.includes(u)) : [];
  if (ic.unread) log(`warning: ${id}'s exports could not be read on the land ${short(after)} (${ic.unread}): counted as breaking, each user in the layer rescheduled`);
  const land = { row: 'land', layer: n, module: id, pr: n0, branch: pr.head.ref, head, before, merge: after, at, by, ...(rows.retests.some((r) => r.pr === n0) ? { retest: true } : {}), gate_runs: runs.length, interface: ic, users_rescheduled: ic.changed ? same : [], users_rescheduled_old_rule: ic.triggers_old?.length ? sameAll : [], users_noticed: noticed };
  const files = [[flowFile(n, 'land', `${safeName(id)}-${n0}-${short(head)}`), land], ...gateFiles(n, id, n0, runs)];
  // A user that started early into a later layer not yet open (R14) is working against this provider
  // now: an interface change reschedules it there, as one in this layer, never a notice its own land
  // would answer unseen (cold review of R14). Its layer's states hold it until its land holds this one.
  const earlyAt = ic.changed ? earlyUsers(root, cfg.state_branch, n, later, home) : new Map();
  const early = [...earlyAt.keys()];
  if (early.length) land.users_rescheduled_early = early;
  for (const u of early) {
    const k = earlyAt.get(u);
    files.push([flowFile(k, 'reschedule', `${safeName(u)}-${safeName(id)}-${short(after)}`), { row: 'reschedule', layer: k, user: u, provider: id, provider_pr: n0, provider_land: after, at, key: `${u}<-${id}@${short(after)}`, why: interfaceText(ic), triggers: triggersFor(u), class: classFor(u), early_from: n }]);
    log(`${u} started early into layer ${k}: rescheduled there by ${id}'s interface change; its job brings ${layerBranch(k)} up once layer ${k} opens, and its run counts only on a head that holds ${short(after)}`);
  }
  if (ic.changed) {
    for (const u of same) files.push([flowFile(n, 'reschedule', `${safeName(u)}-${safeName(id)}-${short(after)}`), { row: 'reschedule', layer: n, user: u, provider: id, provider_pr: n0, provider_land: after, at, key: `${u}<-${id}@${short(after)}`, why: interfaceText(ic), triggers: triggersFor(u), class: classFor(u) }]);
  }
  let raised = null;
  if (noticed.length) {
    const key = noticeKey(id, n0);
    // The exports read over the land (PD-20: triage trusts "exports unchanged" only with the read);
    // a read that disagrees with the land's interface check is recorded unread.
    const rx = readExports(root, cfg, entryAt(root, after, id) || {}, before, after);
    const read = rx.exports_unread ? { exports_unread: rx.exports_unread } : !!rx.exports === !!ic.exports ? { exports_read: rx.exports_read } : { exports_unread: "the land's export read and its interface check disagree" };
    const exp = rx.exports || ic.exports;
    raised = { row: 'notice', at, key, provider: id, ids: [], pr: n0, users: noticed, source: 1, ...(exp ? { exports: exp } : {}), ...read, layer_flow: { layer: n, provides: !!ic.provides, rescheduled: ic.changed } };
    files.push([noticeFile(key), raised]);
  }
  // The notices this module owed (from earlier layers' providers) are answered by its land.
  try { for (const k of noticeRecords(root, cfg.state_branch).filter((q) => !q.withdrawn && q.open.includes(id))) files.push([answerFile(id, k.key), { row: 'answered', at, key: k.key, user: id, pr: n0, by: 'layer land' }]); } catch { /* none read: none answered */ }
  writeRows(root, cfg.state_branch, `layer ${n}: land PR ${n0} (${id})${ic.changed ? `, interface changed (${ic.class}): ${same.length} ${ic.class === 'additive' ? 'to retest' : 'rescheduled'}` : ''}`, files);
  log(`landed PR ${n0} (${id}) into ${layerBranch(n)} at ${short(after)}; interface: ${interfaceText(ic)}`);
  // Its starts owed are paid by its land (a job's or a retest's): job start --ready never runs here.
  try { writeState(root, cfg.state_branch, `starts owed: ${id} landed (PR ${n0})`, (dir) => { paidFor(dir, [id]); return {}; }); } catch (e) { log(`note: the starts owed were not updated (${e.message})`); }
  const msgs = [];
  const retests = [];
  if (ic.changed) {
    const open = (x.openPRs || openPRs)(slug, layerBranch(n)) || [];
    const ids = new Set([...ledgerIds(root, lref), ...ledgerIds(root, `refs/remotes/origin/${cfg.tranche}`)]);
    for (const u of same) {
      const p = open.find((q) => branchModule(q.head?.ref, ids) === u);
      const text = `layer ${n}: ${id} changed its interface (${classFor(u)}; land ${short(after)}: ${interfaceText(ic)}). Halt any test run now; run \`${P3} layer publish ${u}\` again: it brings job/${u} up to ${layerBranch(n)} and its gate re-runs your suite against ${id}'s new version. A run started before this never counts.`;
      if (p) { msgs.push({ user: u, pr: p.number, text }); log(`BOB delivers to job ${u}'s session (PR ${p.number}), with send_message priority now: ${text}`); continue; }
      if (classFor(u) !== 'additive') { log(`${u}: no job open; it re-runs when it starts (${P3} layer jobs ${n} lists it)`); continue; }
      // Additive: the gate alone re-tests it (layer retest), no job session; refused, a job does.
      try {
        const r = (x.retest || layerRetest)(root, u, { io: x, log, by, cause: n0 });
        retests.push({ user: u, pr: r.pr?.number ?? null });
      } catch (err) {
        const why = String(err.message || err).replace(/^p3 [\w ]+: /, '').slice(0, 300);
        retests.push({ user: u, pr: null, refused: why });
        // Kept, so layer jobs lists its job and not the retest again (cold review of PR 193).
        try { writeRows(root, cfg.state_branch, `layer ${n}: ${u}'s retest refused`, [[flowFile(n, 'retest-refused', `${safeName(u)}-${n0}`), { row: 'retest-refused', layer: n, module: u, cause: n0, why, at: now(), by }]]); } catch { /* the log below still says it */ }
        log(`${u}: no retest opened (${why}); a job re-tests it: ${P3} layer jobs ${n} lists it`);
      }
    }
  }
  if (noticed.length) log(`provider notice ${noticeKey(id, n0)} for ${noticed.length} user(s)${ic.changed ? ' in later layers' : ', its Public / Provides text changed (no reschedule)'}: ${noticed.join(', ')}`);
  // The notice triaged at the land, as the tranche merge triages its own (triageAtMerge, PD-20 rules;
  // coordinator, 9 Nov: no layer land had cleared a user since 7 Nov). The land stands if it fails.
  let triage = null;
  if (raised) {
    try { const { triageAtMerge } = await import('./triage.mjs'); triage = triageAtMerge(root, cfg, raised, { ref: after, log }); } catch (e) {
      triage = { rows: [], owed: raised.users, key: raised.key, error: e.message };
      log(`the land stands; notice triage ${raised.key} at the land failed (${e.message}); next act: ${P3} notice triage ${raised.key}`);
    }
  }
  return { ok: true, land, messages: msgs, retests, triage };
}

// ---- layer sync (R11) -----------------------------------------------------------------------

// PD-23 (coordinator, 9 Nov, Bob's revision of SLB-12): a pin move reaches every open layer itself,
// by layer pin --open after its merge (pin.mjs): in place when the pin diff judges nothing, else at
// the coordinator's choice (apply, hold, or reset: this layer sync). No BOB act, and a pin difference
// holds no land and no merge. SLB-12's case (copy, 6 Nov: layer/8 at 4a85f26 refused R4's carried
// entries after the tranche moved to 0635b64) is one the pin move applies or resets.
const pinOf = (root, rev) => git(['ls-tree', rev, '--', '.process'], { cwd: root, allowFail: true }).stdout.match(/^160000 commit ([0-9a-f]{40,64})\t/)?.[1] || null;
const SHIMS = (() => { try { return new Set(readdirSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'shims'))); } catch { return new Set(); } })();
// The conflicts layer sync resolves: .process and the process's shims as the tranche has them, a
// ledger entry as the layer has it (its jobs' states; R4's carried entries). Any other refuses.
// A ledger entry, process/ledger/<id>.json, directly in the ledger directory.
const ENTRY_FILE = new RegExp(`^${LEDGER_DIR.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}/[^/]+\\.json$`);
const isEntryFile = (f) => ENTRY_FILE.test(f);
const syncSide = (f, cfg = null) => (f === '.process' || (cfg && f === cfg.completion_file) || (SHIMS.has(f.split('/').pop()) && (f.startsWith('.github/') || f.startsWith('.claude/') || !f.includes('/'))) ? 'theirs' : isEntryFile(f) ? 'ours' : null);

export const SYNC_TITLE = /^Merge layer sync PR (\d+)$/;
// The completion layer's tick (C33): one tool commit on layer/<n> at its merge, flipping `[ ]` to
// `[x]` on the open items whose module landed on the layer; the layer gate checks exactly that.
export const TICK_TITLE = /^Tick completion items of layer (\d+): (.+)$/;
// Two texts of the completion file the same but for boxes `b` ticks that `a` has open.
export function onlyTicks(a, b) {
  const x = String(a).split('\n');
  const y = String(b).split('\n');
  return x.length === y.length && x.every((l, i) => l === y[i] || (/^\s*[-*]\s+\[ \]/.test(l) && l.replace('[ ]', '[x]') === y[i]));
}
// The lines of `file` a tick flips, as [line, item] pairs, or a reason it is not a tick: the commit
// changes that file alone, only `[ ]` to `[x]`, each on an item of a module in `landed`.
export function tickCheck(root, file, before, after, landed, ids = null) {
  const files = git(['diff', '--no-renames', '--name-only', before, after], { cwd: root }).split('\n').filter(Boolean);
  if (files.length !== 1 || files[0] !== file) return { why: `changes ${files.join(', ') || 'nothing'}, not ${file} alone` };
  const a = (git(['show', `${before}:${file}`], { cwd: root, allowFail: true }).stdout || '').split('\n');
  const b = (git(['show', `${after}:${file}`], { cwd: root, allowFail: true }).stdout || '').split('\n');
  if (a.length !== b.length) return { why: `adds or removes lines of ${file}` };
  const was = new Map(parseCompletion(a.join('\n')).map((x) => [x.line, x]));
  const flipped = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    const x = was.get(i + 1);
    if (!x || x.done || x.deferred || a[i].replace('[ ]', '[x]') !== b[i]) return { why: `line ${i + 1} of ${file} is not an open item ticked` };
    if (ids && !ids.has(x.id)) return { why: `ticks ${x.id}, which is not an item of this completion layer` };
    if (!landed.has(x.target)) return { why: `ticks ${x.id}, whose module ${x.target} has no verified land on the layer` };
    flipped.push(x.id);
  }
  return flipped.length ? { ids: flipped } : { why: 'ticks nothing' };
}
// The tool's merge of the tranche tip into a layer commit, in a worktree: { tree, resolved, conflictsOutside }.
function syncMerge(root, cfg, n, base, ttip, w) {
  git(['worktree', 'add', '-q', '--detach', w, base], { cwd: root });
  const m = git(['merge', '-q', '--no-ff', '--no-commit', ttip], { cwd: w, allowFail: true });
  const conflicted = m.code === 0 ? [] : git(['diff', '--name-only', '--diff-filter=U'], { cwd: w }).split('\n').filter(Boolean);
  if (m.code !== 0 && !conflicted.length) fail(`merging ${cfg.tranche} into ${layerBranch(n)} failed (${(m.stderr || m.stdout).trim().split('\n').pop()}); nothing was opened`);
  const bad = conflicted.filter((f) => !syncSide(f, cfg));
  if (bad.length) { git(['merge', '--abort'], { cwd: w, allowFail: true }); fail(`layer sync ${n} refused: ${layerBranch(n)} and ${cfg.tranche} conflict in ${bad.join(', ')}; only .process, the process's shims and ledger entries are resolved by the tool; nothing was opened`); }
  for (const f of conflicted) {
    const side = syncSide(f, cfg);
    // The side's version, or its deletion (a modify/delete conflict).
    const stage = side === 'ours' ? 2 : 3;
    const has = git(['ls-files', '-u', '--', f], { cwd: w }).split('\n').some((l) => l.split(/\s+/)[2] === String(stage));
    if (f === '.process') {
      const pin = pinOf(root, ttip);
      if (pin) git(['update-index', '--cacheinfo', `160000,${pin},.process`], { cwd: w });
      else git(['rm', '-q', '--cached', '--', '.process'], { cwd: w });
    } else if (!has) git(['rm', '-q', '--', f], { cwd: w });
    else { git(['checkout', '-q', `--${side}`, '--', f], { cwd: w }); git(['add', '--', f], { cwd: w }); }
  }
  git(['commit', '-q', '--no-edit', '-m', `Merge ${cfg.tranche} ${short(ttip)} into ${layerBranch(n)} (layer sync)${conflicted.length ? `: ${conflicted.map((f) => `${f} ${syncSide(f) === 'ours' ? 'the layer\'s' : `${cfg.tranche}'s`}`).join(', ')}` : ''}`], { cwd: w });
  return { head: git(['rev-parse', 'HEAD'], { cwd: w }), tree: git(['rev-parse', 'HEAD^{tree}'], { cwd: w }), resolved: conflicted };
}

// After the layer syncs, each open job PR's branch takes the synced layer tip by a merge commit, so its
// gate runs with the new tool (coordinator, 6 Nov: layer 8's job PRs 658-661 were red only on the old
// tool's ledger finding, their sessions archived). Only when the merge is clean but for .process, the
// shims and the job's own ledger entry (kept as the job wrote it), and brings nothing but those and
// records (no code): then the
// job's tested code stands. A BLOCKED job, a conflict, or any other change is listed and left alone.
export function syncJobs(root, cfg, n, prs, ids, log = console.log, slug = null) {
  const b0 = layerBranch(n);
  const tip = rev(root, layerRef(n));
  const out = { merged: [], left: [] };
  // Records (other modules' metrics rows and the like) are no code: the tested code stands over them.
  const allowed = (f) => f === '.process' || syncSide(f, cfg) === 'theirs' || isEntryFile(f) || isRecordPath(cfg, f);
  for (const p of prs) {
    const id = branchModule(p.head?.ref, ids);
    if (!id || !String(p.head.ref).startsWith('job/')) continue;
    // A fork's PR names a branch that is not origin's: never pushed to (cold review of PR 198).
    if (slug && p.head?.repo?.full_name && p.head.repo.full_name !== slug) continue;
    const branch = p.head.ref;
    const leave = (why) => { out.left.push({ id, pr: p.number, branch, why }); log(`  ${branch} (PR ${p.number}) left as it is: ${why}`); };
    fetchBranch(root, branch, { allowFail: true });
    const head = git(['rev-parse', '-q', '--verify', `refs/remotes/origin/${branch}`], { cwd: root, allowFail: true }).stdout.trim();
    if (!head) { leave('its branch is not on origin'); continue; }
    if (isAnc(root, tip, head)) continue;
    const be = entryAt(root, head, id);
    if (be?.status?.state === 'BLOCKED') {
      // BLOCKED only on the ledger-carry finding this sync cleared: its entry was carried (absent where
      // the branch left the layer) and the layer holds it now (coordinator, 6 Nov: layer 8's 658-661).
      const mb = git(['merge-base', head, tip], { deepen: true, cwd: root, allowFail: true }).stdout.trim();
      const carried = !!mb && !entryAt(root, mb, id) && !!entryAt(root, tip, id);
      // Both the carry and a reason naming the ledger say so; the carry alone only suggests it
      // (cold review of PR 201: a job BLOCKED for a real reason may have carried its entry too).
      const restart = `${P3} job start ${id} --restart "the ledger-carry finding is cleared by layer sync ${n}: publish"`;
      if (carried && /ledger|carr/i.test(String(be.status.reason || ''))) leave(`BLOCKED only on the ledger-carry finding this sync cleared (${entryFile(id)} is on ${b0} now): restart it to publish: ${restart}`);
      else if (carried) leave(`BLOCKED (${be.status.reason || 'no reason'}); its carried entry ${entryFile(id)} is on ${b0} now: if only the ledger-carry finding blocked it, restart it to publish: ${restart}`);
      else leave('BLOCKED');
      continue;
    }
    const r = withTemp('p3-layer-', (tmp) => {
      const w = join(tmp, 'w');
      git(['worktree', 'add', '-q', '--detach', w, head], { cwd: root });
      try {
        const m = git(['merge', '-q', '--no-ff', '--no-commit', tip], { cwd: w, allowFail: true });
        const conflicted = m.code === 0 ? [] : git(['diff', '--name-only', '--diff-filter=U'], { cwd: w }).split('\n').filter(Boolean);
        if (m.code !== 0 && !conflicted.length) { git(['merge', '--abort'], { cwd: w, allowFail: true }); return { why: `the merge failed (${(m.stderr || m.stdout).trim().split('\n').pop()})` }; }
        const bad = conflicted.filter((f) => f !== entryFile(id) && syncSide(f) !== 'theirs');
        if (bad.length) { git(['merge', '--abort'], { cwd: w, allowFail: true }); return { why: `a conflict in ${bad.join(', ')}` }; }
        for (const f of conflicted) {
          if (f === '.process') { const pin = pinOf(root, tip); if (pin) git(['update-index', '--cacheinfo', `160000,${pin},.process`], { cwd: w }); else git(['rm', '-q', '--cached', '--', '.process'], { cwd: w }); continue; }
          if (f === entryFile(id)) {
            // Its own entry: the layer's, with the job's status laid over it, so the gate's ledger
            // rule (only the status may differ from the base) holds (cold review of PR 198).
            const stage = (k) => { const r = git(['show', `:${k}:${f}`], { cwd: w, allowFail: true }); try { return r.code === 0 ? JSON.parse(r.stdout) : null; } catch { return undefined; } };
            const [mine, theirs] = [stage(2), stage(3)];
            if (!mine || !theirs) { git(['merge', '--abort'], { cwd: w, allowFail: true }); return { why: `its entry ${f} cannot be joined (${!mine ? 'the job\'s' : 'the layer\'s'} is missing or unreadable)` }; }
            writeFileSync(join(w, f), JSON.stringify({ ...theirs, status: mine.status }, null, 2) + '\n');
            git(['add', '--', f], { cwd: w });
            continue;
          }
          const side = 'theirs';
          const has = git(['ls-files', '-u', '--', f], { cwd: w }).split('\n').some((l) => l.split(/\s+/)[2] === '3');
          if (!has) git(['rm', '-q', '--', f], { cwd: w });
          else { git(['checkout', '-q', `--${side}`, '--', f], { cwd: w }); git(['add', '--', f], { cwd: w }); }
        }
        // What the merge changes on the job's branch: the pointer, shims and ledger entries only.
        // No rename detection: a rename lists the path it removes too (as diffNames reads it).
        const changed = git(['diff', '--cached', '--no-renames', '-z', '--name-only', head], { cwd: w }).split('\0').filter(Boolean);
        const other = changed.filter((f) => !allowed(f));
        if (other.length) { git(['merge', '--abort'], { cwd: w, allowFail: true }); return { why: `the layer brings other changes (${other.slice(0, 3).join(', ')}${other.length > 3 ? ` and ${other.length - 3} more` : ''}): its tested code would not stand; its job syncs it` }; }
        git(['commit', '-q', '--no-edit', '-m', `Merge ${b0} ${short(tip)} into ${branch} (layer sync: ${changed.join(', ') || 'no file'})`], { cwd: w });
        const h = git(['rev-parse', 'HEAD'], { cwd: w });
        const push = git(['push', '-q', 'origin', `${h}:refs/heads/${branch}`], { cwd: w, allowFail: true });
        if (push.code !== 0) return { why: `the push was refused (${push.stderr.trim().split('\n').pop()})` };
        return { head: h, changed };
      } finally { git(['worktree', 'remove', '--force', w], { cwd: root, allowFail: true }); }
    }, { root });
    if (r.why) { leave(r.why); continue; }
    out.merged.push({ id, pr: p.number, branch, head: r.head, changed: r.changed });
    log(`  ${branch} (PR ${p.number}) took ${b0} ${short(tip)}: ${r.changed.join(', ') || 'no file'}; its gate re-runs with the new tool`);
  }
  return out;
}

