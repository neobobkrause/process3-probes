  const act = choice || (judging ? null : 'apply');
  if (!act) {
    log(`${b0}: ${what}. The coordinator chooses: ${P3} layer pin ${n} --layers apply (in place: lands kept, job PRs not reset), --layers hold (the layer keeps ${short(from || 'its pin')} until it merges; ${cfg.tranche}'s pin wins at the merge), or --layers reset (layer sync ${n})`);
    return { ok: false, n, action: 'choose', touched, from, to };
  }
  log(`${b0}: ${what}; ${act}${choice ? ' (the coordinator\'s choice)' : ''}`);
  const record = (extra) => writeRows(root, cfg.state_branch, `layer ${n}: pin ${act}`, [[flowFile(n, 'pin', `${short(to)}-${act}`), { row: 'pin', layer: n, action: act, pin_before: from, pin_after: to, touched, at: now(), by, ...extra }]]);
  if (act === 'hold') { record({}); log(`${b0} keeps its pin ${short(from)} until it merges (PD-23); ${cfg.tranche}'s ${short(to)} wins at the merge`); return { ok: true, n, action: 'hold' }; }
  if (act === 'reset') { const r = await layerSync(root, n, { io, log, wait, by }); record({ pr: r.pr?.number ?? null }); return { ...r, n, action: 'reset' }; }
  // apply: an open pull request for this pin is taken up; else a new branch.
  const into = x.openPRs(slug, b0);
  if (into === null) fail(`GitHub unreadable: the open pull requests into ${b0} are not known; nothing was opened`);
  const stem = `layer-pin/${n}-${short(to)}`;
  let pr = into.find((p) => String(p.head?.ref || '').startsWith(stem)) || null;
  let head = pr?.head?.sha || null;
  if (!pr) {
    let branch = stem;
    for (let k = 2; git(['ls-remote', '--heads', 'origin', `refs/heads/${branch}`], { cwd: root, allowFail: true }).stdout.trim(); k++) branch = `${stem}-${k}`;
    head = withTemp('p3-layer-', (tmp) => {
      const w = join(tmp, 'w');
      try {
        const h = pinCommit(root, cfg, n, tip, ttip, to, w);
        const p = git(['push', '-q', 'origin', `${h}:refs/heads/${branch}`], { cwd: w, allowFail: true });
        if (p.code !== 0) fail(`the push of ${branch} failed (${p.stderr.trim()}); nothing was opened`);
        return h;
      } finally { git(['worktree', 'remove', '--force', w], { cwd: root, allowFail: true }); }
    }, { root });
    const body = [`layer pin ${n}: ${cfg.tranche}'s process pin ${short(to)} into ${b0} in place (PD-23), one commit on ${short(tip)}: the pin and the workflow files it carries, nothing else.`, '', `Process pin: ${short(from || 'none')} -> ${short(to)}. ${what}.`, 'Lands already made are not re-gated; open job pull requests are not reset.', '', `The merge tool lands it on a green gate (${P3} layer pin ${n} --layers apply again, if this run stopped).`].join('\n');
    pr = x.createPR(slug, { head: branch, base: b0, title: `layer pin ${n}: process ${short(to)}`, body, draft: false });
    log(`layer pin ${n}: PR ${pr.number} from ${branch} into ${b0}`);
  } else log(`layer pin ${n}: PR ${pr.number} from ${pr.head.ref} is open already`);
  if (!wait) { log(`the gate decides; run ${P3} layer pin ${n} --layers apply again to land it`); return { ok: true, n, action: 'apply', landed: false, pr }; }
  const g = await waitGate(x, slug, pr.number, head);
  if (g?.status !== 'completed' || g.conclusion !== 'success') fail(`the gate on pin PR ${pr.number} ${short(head)} is ${g ? `${g.status} ${g.conclusion || ''}`.trim() : 'not run'}; layer pin lands on a green gate`);
  const r = await x.merge(slug, pr.number, head, `Merge layer pin PR ${pr.number}`);
  if (!r?.merged && !r?.sha) fail(`GitHub did not merge pull request ${pr.number}: ${JSON.stringify(r).slice(0, 200)}`);
  fetchBranch(root, b0);
  record({ pr: pr.number, head, merge: r.sha || null });
  log(`layer pin ${n}: ${short(to)} landed into ${b0} in place${r.sha ? ` at ${short(r.sha)}` : ''}`);
  return { ok: true, n, action: 'apply', landed: true, pr };
}
// p3 layer pin --open [--layers apply|hold|reset]: each open layer, the pin-move session's step after
// its merge. Outside the layer flow, or with no layer open, nothing.
export async function layerPinOpen(root, { choice, io = {}, log = console.log, wait = true, by = 'pin' } = {}) {
  const cfg = loadConfig(root);
  if (!layerMode(cfg)) { log('not the layer flow: no layer to move'); return { ok: true, layers: [] }; }
  fetchBranch(root, cfg.tranche, { allowFail: true });
  fetchState(root, cfg.state_branch, { fresh: true });
  const open = openLayers(root, cfg, (p) => readState(root, cfg.state_branch, p));
  if (!open.length) { log('no layer is open: nothing to move'); return { ok: true, layers: [] }; }
  const out = [];
  for (const n of open) out.push(await layerPin(root, n, { choice, io, log, wait, by }));
  return { ok: out.every((r) => r.ok), layers: out };
}

// ---- layer merge ----------------------------------------------------------------------------

export async function layerMerge(root, n, { io = {}, log = console.log, wait = true, by = 'bob', deferDone } = {}) {
  n = layerNum(n);
  const cfg = loadConfig(root);
  needLayerMode(cfg, 'layer merge');
  const slug = io.slug || repoSlug(root);
  fetchLayer(root, cfg, n);
  const L = readLayer(root, cfg, n, { io, slug });
  if (!L.rows.open) fail(`layer ${n} was not opened by ${P3} layer open ${n}`);
  if (L.rows.merged) fail(`layer ${n} already merged (${short(L.rows.merged.commit)})`);
  const not = L.states.filter((s) => !DONE.includes(s.state));
  if (not.length) fail(`layer ${n} cannot merge: ${not.map((s) => `${s.id} is ${s.state} (${s.why})`).join('; ')}`);
  // An open completion item whose module has not joined holds the merge as an unfinished module
  // does (PD-14; cold review of C35): else it would drift to a later round.
  if (L.joinable?.length) fail(`layer ${n} cannot merge: ${L.joinable.map((x) => `${x.id} has open completion item(s) ${x.items.join(', ')} ${x.more ? 'not yet joined into the layer' : 'and has not joined'}: ${x.cmd}`).join('; ')}`);
  if (L.holding.length) fail(`layer ${n} cannot merge: PR(s) ${L.holding.map((p) => p.number).join(', ')} still open into ${layerBranch(n)}`);
  // Finished work, deferred only on a process finding, is not dropped silently (coordinator, 6 Nov).
  const done = L.states.filter((s) => s.done_work);
  if (deferDone === true || (deferDone !== undefined && !String(deferDone).trim())) fail('--defer-done needs why: the reason the finished work waits for a later layer');
  if (done.length && deferDone === undefined) fail(`layer ${n} cannot merge: ${done.map((s) => `${s.id} (PR ${s.done_work})`).join(', ')} ${done.length > 1 ? 'are' : 'is'} deferred with work done (suite green, BLOCKED only on a process finding): restart ${done.length > 1 ? 'them' : 'it'} to publish (${P3} layer status ${n} lists the lines), or merge with --defer-done "<why>"`);
  if (done.length) log(`deferring work done, by --defer-done: ${done.map((s) => s.id).join(', ')}: ${String(deferDone).trim()}`);
  const x = { findPR, createPR, checkRun, getPR, merge: (s, k, sha, title) => mergeVia(s, k, sha, title), ...io };
  const b = layerBranch(n);
  carriedSync(root, cfg, n, L, log);
  tickLanded(root, cfg, n, L, log);
  const head = rev(root, L.ref);
  // The layer's checks (INT-4; Bob, 5 Nov): what layer close runs, less the module suites (no test
  // run at close): each entry's checks, the generated rows built, and every committed generated
  // path regenerated, a finding when one differs. Red: nothing opened, nothing merged.
  const { layerChecks } = await import('./layer.mjs');
  const mods = L.states.map((s) => ({ id: s.id, blocked: s.state === 'deferred' ? s.why : null }));
  const lc = layerChecks(root, cfg, head, mods, { timeout: (cfg.suite_timeout_minutes || 20) * MINUTE, log, ...(x.exec ? { exec: x.exec } : {}) });
  // A committed generated file stale on the layer refuses the merge, named with its regenerate (the
  // coordinator, 6 Nov: the last gate before the tranche; order.mjs drifted this way).
  const staleAt = new Set((lc.stale || []).map((x) => x.file));
  const all = [...lc.findings, ...(lc.stale || []).map((x) => ({ check: 'generated', file: x.file, message: `${x.file} is stale on ${b} ${short(head)}: run ${x.regenerate} and commit it (a plain pull request into ${b}), then ${P3} layer merge ${n} again` })), ...lc.changed.filter((f) => !staleAt.has(f) && ![...staleAt].some((x) => underPath(x, f))).map((f) => ({ check: 'generated', file: f, message: `${f} differs when regenerated on ${b} ${short(head)}` }))];
  // SLB-7 (Bob): at close only the layer's own checks hold it. A generated row's verify failure
  // blocks only when its paths, or a module it names, are the closing layer's; any other is
  // printed for the module it names, for BOB's found mark there, and the merge goes on.
  const judged = all.map((f) => ({ f, ...verifyOwner(f, { mods: L.mods, entries: [...L.entries.values()].filter(Boolean), ids: [...ledgerIds(root, L.ref)] }) }));
  for (const j of judged.filter((x) => !x.blocks)) log(`not this layer's: ${j.f.file}: ${j.f.message}; record it as a found mark${j.names.length ? ` on ${j.names.join(', ')}` : ''}: ${P3} found ${j.names[0] || '<module>'} "<the finding>" --from "layer ${n} merge"`);
  const red = judged.filter((x) => x.blocks).map((x) => x.f);
  if (red.length) {
    for (const f of red) log(`${f.check}: ${f.file}: ${f.message}`);
    fail(`layer ${n} cannot merge: the layer checks found ${red.length} finding(s) on ${b} ${short(head)}; no module suite ran`);
  }
  log(`layer ${n}: the layer checks passed on ${short(head)} (no module suite runs at the merge)`);
  let pr = x.findPR(slug, b);
  if (pr && pr.base?.ref !== cfg.tranche) fail(`the open pull request from ${b} (#${pr.number}) is into ${pr.base?.ref}, not ${cfg.tranche}`);
  if (!pr) pr = x.createPR(slug, { head: b, base: cfg.tranche, title: `layer ${n}`, body: layerBody(n, L), draft: false });
  log(`layer ${n}: PR ${pr.number} ${b} into ${cfg.tranche}`);
  // No suite runs at the close (Bob, 5 Nov); the required gate check is the layer trigger, which
  // reads each module's evidence and runs nothing.
  const g = wait ? await waitGate(x, slug, pr.number, head) : x.checkRun(slug, head, 'gate');
  if (g?.status !== 'completed' || g.conclusion !== 'success') fail(`the gate on ${b} ${short(head)} is ${g ? `${g.status} ${g.conclusion || ''}`.trim() : 'not run'}; the layer merges on a green layer gate`);
  const r = await x.merge(slug, pr.number, head, `Merge layer ${n} into ${cfg.tranche}`);
  if (!r?.merged && !r?.sha) fail(`GitHub did not merge pull request ${pr.number}: ${JSON.stringify(r).slice(0, 200)}`);
  const at = now();
  const deferred = Object.fromEntries(L.states.filter((s) => s.state === 'deferred' || s.marks.length).map((s) => [s.id, s.state === 'deferred' ? { reason: s.why, marks: s.marks } : s.marks]));
  const merged = { row: 'merged', layer: n, pr: pr.number, head, commit: r.sha || null, tranche: cfg.tranche, at, by, ...(done.length ? { deferred_done: { modules: done.map((s) => s.id), why: String(deferDone).trim() } } : {}), opened: L.rows.open.at, hours: Math.round(((Date.parse(at) - Date.parse(L.rows.open.at)) / 3600000) * 100) / 100 };
  // The close row status reads (layers/closed.jsonl), so the next layer opens: no layer checks ran.
  const closed = { row: 'closed', layer: n, tranche: cfg.tranche, commit: r.sha || head, at, deferred, suites: [], generated_changed: [], by: 'layer merge', strategy: 'layer' };
  writeState(root, cfg.state_branch, `layer ${n} merged into ${cfg.tranche}`, (w) => {
    addFiles(w, [[flowFile(n, 'merged'), merged]]);
    const p = join(w, CLOSED_FILE);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, (existsSync(p) ? readFileSyncSafe(p) : '') + JSON.stringify(closed) + '\n');
    return {};
  });
  const mName = layerName(L.layers?.find((q) => q.n === n), n, cfg.tranche);
  log(`${mName} merged into ${cfg.tranche}${r.sha ? ` at ${short(r.sha)}` : ''}, ${merged.hours} h after it opened; the next layer opens from the new tranche: ${roundOf(L.layers?.find((q) => q.n === n)) > 1 || n >= (L.layers?.filter((q) => !q.round && !q.completion).at(-1)?.n ?? Infinity) ? `\`${P3} round next --apply\` (the round's next layer, with its job starts, or its walk)` : `${P3} layer open ${n + 1}`}`);
  // The round's last layer closes the round: the merge starts the round-close run itself (Bob,
