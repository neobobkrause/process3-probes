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
