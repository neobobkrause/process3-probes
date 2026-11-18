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
