
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
