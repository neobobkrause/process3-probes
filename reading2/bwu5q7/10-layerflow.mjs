// p3 layer sync <n> [--no-wait] (BOB): the tranche into layer/<n> by a tool-made merge PR, landed by
// the merge tool on a green gate (the gate runs layer/<n>'s own tool, which takes a plain PR's
// ledger entries, pointer and shims). Nothing when layer/<n> already holds the tranche tip.
// A commit's parents as its object names them: a shallow clone's boundary (a depth-1 fetch of the
// merge) hides them from rev-list, never from the object (cold review of R17d).
const parentsOf = (root, sha) => git(['cat-file', '-p', sha], { cwd: root }).split('\n\n')[0].split('\n').filter((l) => l.startsWith('parent ')).map((l) => l.slice(7));
export async function layerSync(root, n, { io = {}, log = console.log, wait = true, by = 'bob' } = {}) {
  n = layerNum(n);
  const cfg = loadConfig(root);
  needLayerMode(cfg, 'layer sync');
  const slug = io.slug || repoSlug(root);
  const x = { findPR, createPR, checkRun, getPR, openPRs, prsFromBranch, merge: (s, k, sha, title) => mergeVia(s, k, sha, title), ...io };
  fetchLayer(root, cfg, n);
  const rows = flowRows(root, cfg.state_branch, n);
  if (!rows.open) fail(`layer ${n} was not opened by ${P3} layer open ${n}`);
  if (rows.merged) fail(`layer ${n} already merged into ${cfg.tranche}`);
  const b0 = layerBranch(n);
  const tr = `refs/remotes/origin/${cfg.tranche}`;
  const [tip, ttip] = [rev(root, layerRef(n)), rev(root, tr)];
  // A sync merged whose row was never written (the run stopped after GitHub's merge) is recorded now.
  const known = new Set((rows.syncs || []).map((r) => r.pr));
  const lost = git(['log', '--first-parent', '--format=%H %s', layerRef(n), '--not', rows.open.from], { cwd: root, allowFail: true }).stdout.split('\n').map((l) => [l.slice(0, l.indexOf(' ')), l.slice(l.indexOf(' ') + 1).match(SYNC_TITLE)?.[1]]).filter(([, k]) => k && !known.has(Number(k)));
  if (lost.length) writeRows(root, cfg.state_branch, `layer ${n}: sync rows recorded late`, lost.map(([c, k]) => [flowFile(n, 'sync', k), { row: 'sync', layer: n, pr: Number(k), merge: c, recovered: true, at: now(), by }]));
  const jobsOf = () => {
    const open = x.openPRs(slug, b0);
    if (open === null) { log(`GitHub unreadable: the job PRs into ${b0} were not brought up to it; run ${P3} layer sync ${n} again`); return null; }
    fetchBranch(root, b0, { allowFail: true });
    const ids = new Set([...ledgerIds(root, layerRef(n)), ...ledgerIds(root, tr)]);
    const r = syncJobs(root, cfg, n, open, ids, log, slug);
    if (r.merged.length || r.left.length) log(`layer sync ${n}: ${r.merged.length} job branch(es) took the layer, ${r.left.length} left as they are`);
    return r;
  };
  if (isAnc(root, ttip, tip)) { log(`${b0} holds ${cfg.tranche} ${short(ttip)}: in sync`); return { ok: true, synced: false, jobs: jobsOf() }; }
  // Another sync PR open into the layer (the tranche moved since it opened) is closed first: two
  // would each hold the layer's merge (cold review of PR 198).
  const into = x.openPRs(slug, b0);
  if (into === null) fail(`GitHub unreadable: the open pull requests into ${b0} are not known; nothing was opened`);
  const stem = `layer-sync/${n}-${short(ttip)}`;
  const other = into.filter((p) => String(p.head?.ref || '').startsWith(`layer-sync/${n}-`) && !String(p.head.ref).startsWith(stem));
  if (other.length) fail(`an older sync PR is open into ${b0}: ${other.map((p) => `#${p.number} (${p.head.ref})`).join(', ')}; BOB closes it, then runs ${P3} layer sync ${n} again; nothing was opened`);
  let pr = into.find((p) => String(p.head?.ref || '').startsWith(stem)) || null;
  let head = pr?.head?.sha || null;
  let resolved = [];
  // Whether origin's `branch` at `at` is the tool's merge of the tranche tip into the layer tip,
  // tree for tree, with no pull request ever opened from it: { head, resolved }, else null (an
  // unreadable list counts as one opened: the next name is taken, as before).
  const unopened = (branch, at) => {
    fetchBranch(root, branch, { allowFail: true });
    if (!hasCommit(root, at)) return null;
    const ps = parentsOf(root, at);
    if (ps.length !== 2 || ps[0] !== tip || ps[1] !== ttip) return null;
    const same = withTemp('p3-layer-', (tmp) => {
      const w = join(tmp, 'w');
      try { const r = syncMerge(root, cfg, n, tip, ttip, w); return r.tree === git(['rev-parse', `${at}^{tree}`], { cwd: root }) ? r.resolved : null; } finally { git(['worktree', 'remove', '--force', w], { cwd: root, allowFail: true }); }
    }, { root });
    if (!same) return null;
    const prs = x.prsFromBranch(slug, branch);
    return Array.isArray(prs) && !prs.length ? { head: at, resolved: same } : null;
  };
  if (pr) {
    // Its head must be the tool's own merge, tree for tree: a push to the branch is never landed.
    fetchBranch(root, pr.head.ref, { allowFail: true });
    const ps = hasCommit(root, head) ? parentsOf(root, head) : [];
    const ok = ps.length === 2 && isAnc(root, ps[0], tip) && ps[1] === ttip && withTemp('p3-layer-', (tmp) => {
      const w = join(tmp, 'w');
      try { const r = syncMerge(root, cfg, n, ps[0], ttip, w); resolved = r.resolved; return r.tree === git(['rev-parse', `${head}^{tree}`], { cwd: root }); } finally { git(['worktree', 'remove', '--force', w], { cwd: root, allowFail: true }); }
    }, { root });
    if (!ok) fail(`sync PR ${pr.number}'s head ${short(head)} is not the tool's merge of ${cfg.tranche} ${short(ttip)} into ${b0}: BOB closes it, then runs ${P3} layer sync ${n} again; nothing was landed`);
    log(`layer sync ${n}: PR ${pr.number} from ${pr.head.ref} is open already, its head the tool's merge`);
  } else {
    // A closed or red attempt keeps its branch (no session deletes one): the next takes a new name.
    // A branch an earlier run pushed and opened no pull request from (its create refused, R17d) is
    // taken up again when its head is the tool's merge of these two tips: not a second branch.
    let branch = stem;
    let again = null;
    for (let k = 2; ; k++) {
      const at = git(['ls-remote', '--heads', 'origin', `refs/heads/${branch}`], { cwd: root, allowFail: true }).stdout.trim().split('\t')[0];
      if (!at) break;
      again = unopened(branch, at);
      if (again) break;
      branch = `${stem}-${k}`;
    }
    if (again) {
      ({ head, resolved } = again);
      log(`layer sync ${n}: ${branch} holds the tool's merge already, with no pull request from it; it is opened, not pushed again`);
    } else ({ head, resolved } = withTemp('p3-layer-', (tmp) => {
      const w = join(tmp, 'w');
      try {
        const r = syncMerge(root, cfg, n, tip, ttip, w);
        const p = git(['push', '-q', 'origin', `${r.head}:refs/heads/${branch}`], { cwd: w, allowFail: true });
        if (p.code !== 0) fail(`the push of ${branch} failed (${p.stderr.trim()}); nothing was opened`);
        return r;
      } finally { git(['worktree', 'remove', '--force', w], { cwd: root, allowFail: true }); }
    }, { root }));
    const body = [`layer sync ${n}: ${cfg.tranche} ${short(ttip)} into ${b0} ${short(tip)}, made by the tool (a reset: PD-23's --layers reset, or by hand).`, '', `Process pin: ${short(pinOf(root, tip) || 'none')} -> ${short(pinOf(root, ttip) || 'none')}.`, resolved.length ? `Conflicts resolved by the tool: ${resolved.join(', ')}.` : 'No conflicts.', '', `The merge tool lands it on a green gate (${P3} layer sync ${n} again, if this run stopped).`].join('\n');
    pr = x.createPR(slug, { head: branch, base: b0, title: `layer sync ${n}: ${cfg.tranche} ${short(ttip)}`, body, draft: false });
    log(`layer sync ${n}: PR ${pr.number} from ${branch} into ${b0}${resolved.length ? `, resolved ${resolved.join(', ')}` : ''}`);
  }
  if (!wait) { log(`the gate decides; run ${P3} layer sync ${n} again to land it`); return { ok: true, synced: false, pr }; }
  const g = await waitGate(x, slug, pr.number, head);
  if (g?.status !== 'completed' || g.conclusion !== 'success') fail(`the gate on sync PR ${pr.number} ${short(head)} is ${g ? `${g.status} ${g.conclusion || ''}`.trim() : 'not run'}; layer sync lands on a green gate`);
  const r = await x.merge(slug, pr.number, head, `Merge layer sync PR ${pr.number}`);
  if (!r?.merged && !r?.sha) fail(`GitHub did not merge pull request ${pr.number}: ${JSON.stringify(r).slice(0, 200)}`);
  fetchBranch(root, b0);
  const row = { row: 'sync', layer: n, pr: pr.number, head, merge: r.sha || null, tranche_tip: ttip, pin_before: pinOf(root, tip), pin_after: pinOf(root, ttip), resolved, at: now(), by };
  writeRows(root, cfg.state_branch, `layer ${n}: sync PR ${pr.number}`, [[flowFile(n, 'sync', `${pr.number}`), row]]);
  log(`layer sync ${n}: ${cfg.tranche} ${short(ttip)} landed into ${b0}${r.sha ? ` at ${short(r.sha)}` : ''}`);
  return { ok: true, synced: true, pr, row, jobs: jobsOf() };
}

// ---- the pin moved into open layers (PD-23) -----------------------------------------------------

// Bob, 9 Nov: "An open layer may need to keep the old process version - if the process update would
// affect the proper completion of the layer. If it wouldn't then ... we should change the process
// without resetting the layer. If a change would affect the layer, then ... look at whether it's more
// efficient to hold the process change until after the layer [closes] or put the change in and
// reset. We need to be smart." The process files whose change alters how a layer's jobs or its
// merge are judged; a pin diff touching none of them moves into the layer in place by itself.
export const JUDGING = /^(tool\/lib\/(gate|gateclass|checks|record|merge|layerflow|layerbase)\.mjs|shims\/.+)$/;
export const PIN_CHOICES = ['apply', 'hold', 'reset'];
// The judging files the pin diff old..new changes, read in the product's process clone (.process);
// null when the diff cannot be read (fail-closed: judged as touching them).
export function judgingChange(root, from, to) {
  const proc = join(root, '.process');
  if (!existsSync(join(proc, '.git'))) return null;
  for (const c of [from, to]) if (git(['cat-file', '-e', `${c}^{commit}`], { cwd: proc, allowFail: true }).code !== 0) git(['fetch', '-q', 'origin', c], { cwd: proc, allowFail: true });
  const d = git(['diff', '--no-renames', '--name-only', from, to], { cwd: proc, allowFail: true });
  if (d.code !== 0) return null;
  return d.stdout.split('\n').filter((f) => f && JUDGING.test(f));
}
// The pin commit on the layer: the tranche's .process gitlink, and each workflow file the tranche
// differs in (the pin's shims), on the layer tip; one commit, not a merge (gateclass pinLike).
function pinCommit(root, cfg, n, tip, ttip, pin, w) {
  git(['worktree', 'add', '-q', '--detach', w, tip], { cwd: root });
  git(['update-index', '--cacheinfo', `160000,${pin},.process`], { cwd: w });
  const wf = git(['diff', '--no-renames', '--name-only', tip, ttip, '--', '.github/workflows/'], { cwd: root }).split('\n').filter((f) => f && dirname(f) === '.github/workflows');
  for (const f of wf) {
    if (exists(root, ttip, f)) { git(['checkout', '-q', ttip, '--', f], { cwd: w }); git(['add', '--', f], { cwd: w }); } else git(['rm', '-q', '--', f], { cwd: w });
  }
  git(['commit', '-q', '-m', `process: pin ${short(pin)} into ${layerBranch(n)} in place (PD-23)`], { cwd: w });
  return git(['rev-parse', 'HEAD'], { cwd: w });
}
// p3 layer pin <n> [--layers apply|hold|reset] [--no-wait]: the tranche's pin into open layer n.
// A pin diff that changes no judging file moves in place (apply): one pin-only pull request the
// merge tool lands on a green gate; lands made are not re-gated, open job PRs are not reset, nothing
// is held. One that does is printed, and waits for the coordinator's choice: apply (in place), hold
// (the layer keeps its pin until it merges; the tranche's wins at the merge), or reset (layer sync).
export async function layerPin(root, n, { choice, io = {}, log = console.log, wait = true, by = 'pin' } = {}) {
  n = layerNum(n);
  if (choice !== undefined && !PIN_CHOICES.includes(choice)) fail(`--layers ${PIN_CHOICES.join('|')}, not ${JSON.stringify(choice)}`);
  const cfg = loadConfig(root);
  needLayerMode(cfg, 'layer pin');
  const slug = io.slug || repoSlug(root);
  const x = { findPR, createPR, checkRun, getPR, openPRs, merge: (s, k, sha, title) => mergeVia(s, k, sha, title), ...io };
  fetchLayer(root, cfg, n);
  const rows = flowRows(root, cfg.state_branch, n);
  if (!rows.open) fail(`layer ${n} was not opened by ${P3} layer open ${n}`);
  if (rows.merged) fail(`layer ${n} already merged into ${cfg.tranche}`);
  const b0 = layerBranch(n);
  const tr = `refs/remotes/origin/${cfg.tranche}`;
  const [tip, ttip] = [rev(root, layerRef(n)), rev(root, tr)];
  const [from, to] = [pinOf(root, tip), pinOf(root, ttip)];
  if (!to) fail(`${cfg.tranche} has no process pin`);
  if (from === to) { log(`${b0}: its pin is ${cfg.tranche}'s ${short(to)}: nothing to move`); return { ok: true, n, action: 'none' }; }
  const touched = from ? (x.judging || judgingChange)(root, from, to) : null;
  const judging = touched === null || touched.length > 0;
  const what = touched === null ? `the pin diff ${short(from || 'none')}..${short(to)} could not be read` : touched.length ? `the pin diff ${short(from)}..${short(to)} changes how its jobs or merge are judged: ${touched.slice(0, 6).join(', ')}${touched.length > 6 ? ` and ${touched.length - 6} more` : ''}` : `the pin diff ${short(from)}..${short(to)} changes nothing that judges its jobs or merge`;
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
