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
