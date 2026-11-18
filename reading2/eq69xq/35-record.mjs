  // file as it was where the two diverged (what a three-way merge takes cleanly, as cleanFrom).
  const credited = (p, f, parents) => {
    const s = setBy(p, f);
    if (!s || !base || !anc(s, base)) return false;
    const e = entryOf(root, p, f);
    return parents.every((q) => q === p || entryOf(root, q, f) === e || (() => { const m = mbOf(p, q); return Boolean(m) && entryOf(root, m, f) === entryOf(root, q, f); })());
  };
  // C21 (the coordinator, 7 Nov): a version of a guarded file that the owner's own website commit set
  // inside the range, and so not in the base (a main-only owner commit merged in), and that landed on
  // main or the tranche, is carried only while it is still current: the version on a trusted tip (main, the tranche, the base), as
  // ownerSet holds the approvals block to the one the owner last set. An owner commit T1 the owner
  // has since replaced by T2 on main is otherwise a rollback of the owner's settings that passes as
  // the owner's own. A head that ends on a trusted tip's version again (a later sync brought T2)
  // puts nothing back, as carried() for the approvals.
  // Each answer is kept per (parent, file): introduced, the rolled-back filter and the finding ask alike.
  const currentOn = (f, e) => refs.some((r) => entryOf(root, r, f) === e);
  const staleMemo = new Map();
  // A trusted ref a default asked for that this clone lacks (a single-branch fetch): a replaced
  // version cannot be told from an unlanded one there, so the check says so (cold review of C21).
  const missing = (trusted || ['origin/main', `origin/${cfg.tranche}`]).filter((x) => !refs.includes(x));
  let missingNoted = false;
  const stale = (p, f) => {
    const k = `${p}\0${f}`;
    if (staleMemo.has(k)) return staleMemo.get(k);
    const s = setBy(p, f);
    let v = false;
    // Replaced, not merely unlanded: the setter is on a trusted tip that has moved on from its version
    // (an owner commit on a side branch, on no trusted tip, is judged as before).
    if (s && !(base && anc(s, base)) && !currentOn(f, entryOf(root, p, f)) && !currentOn(f, entryOf(root, head, f))) {
      const on = refs.find((r) => anc(s, r));
      if (on) v = ownerCommit(s).ok === true ? { s, on } : false;
      else if (missing.length && !missingNoted && ownerCommit(s).ok === true) {
        missingNoted = true;
        notices.push({ check: 'record', file: f, line: 1, message: `${missing.join(' and ')} could not be read in this clone, so whether ${ownerName}'s commit ${s.slice(0, 10)} that sets ${f} has since been replaced there was not checked; fetch it and run again` });
      }
    }
    staleMemo.set(k, v);
    return v;
  };
  // A commit where this shallow clone's history is cut shows no parents: diffed as a root
  // commit, every file would read as its change, named for a commit that never made it (copy,
  // 4 Nov). It is not judged; the check says it could not read it.
  const cut = shallowCuts(root);
  const rolled = []; // C21's rollbacks, one per file and setter, judged after the walk
  const oversize = [];
  for (const sha of commits) {
    const short = sha.slice(0, 10);
    if (cut.has(sha)) {
      findings.push({ check: 'record', file: '(commit)', line: 1, message: `commit ${short} could not be checked: this clone's history is cut there (shallow), so its own change cannot be read; deepen the clone (job complete does) and run again` });
      continue;
    }
    try {
      const parents = git(['rev-list', '--parents', '-n', '1', sha], { cwd: root }).split(' ').slice(1);
      const staleHere = landed(sha) ? () => false : (p, f) => Boolean(stale(p, f));
      const files = introduced(root, sha, parents, { guarded, judged, credited, stale: staleHere, base });
      // A guarded file this merge carries from an owner commit since replaced (C21): one finding, named so.
      const rolledBack = new Set(parents.length > 1 ? files.filter((f) => parents.some((p) => entryOf(root, p, f) === entryOf(root, sha, f) && judged(p, f) && staleHere(p, f))) : []);
      // The versions a merge's guarded file is compared with: the base's, any parent's that was
      // judged inside the range, and any parent's that is an ancestor of the base, whose version
      // was judged when it landed there, when the merge takes it cleanly (the copy, 4 Nov: a job's sync merge carrying the tranche's
      // CLAUDE.md after an owner edit, refused once a later owner edit moved the base on). A side
      // parent on no trusted ref counts only when judged in the range.
      // A parent whose version is an owner commit's since replaced (C21) is not one: a merge that mixes
      // that version with its own edit is its own change (cold review of C21).
      const parentsFor = (f) => (parents.length > 1 ? [...(base ? [base] : []), ...parents.filter((p) => (judged(p, f) && !staleHere(p, f)) || cleanFrom(p, parents, (r) => show(root, r, f), sha))] : parents);
      const approvalsTouched = [];
      // The approvals block (build J): a commit whose block differs from a parent's, or from every
      // version already judged, changes it. It is accepted only when it is the owner's own website
      // commit, or leaves the block the owner last set on the tips of main or the tranche. So a
      // merge that puts back an older block, leaving it at the head, is refused.
      if (files.includes(afile) || parents.length > 1) {
        const now = blockOf(sha);
        const was = parents.length ? parentsFor(afile).map(blockOf) : [''];
        // A merge that takes, cleanly, the block of a parent behind the base (owner-judged when
        // it landed) changes nothing; a side parent's block on no trusted ref does not count.
        const fromTrusted = parents.length > 1 && parents.some((p) => cleanFrom(p, parents, blockOf, sha));
        const changed = parents.length ? !fromTrusted && (!was.includes(now) || parents.some((p) => blockOf(p) !== now)) : now !== '';
        // A merge may also carry the block the owner had set as one of its parents saw it (an
        // earlier owner edit, since overtaken), when the head ends on the current one (review A).
        const carried = () => blockOf(head) === ownerSet()?.block && parents.some((p) => ownerBlock(root, [p], afile, heading, ownerCommit)?.block === now);
        if (changed && !landed(sha) && now !== ownerSet()?.block && !ownerCommit(sha).ok && !carried()) {
          const text = show(root, sha, afile) || '';
          const line = Math.max(1, text.split('\n').findIndex((l) => l.trim() === heading.trim()) + 1);
          const t = ownerSet();
          approvalsTouched.push({ file: afile, line, message: `commit ${short} changes the approvals but is not ${ownerName}'s own commit through GitHub's website (${ownerCommit(sha).why}), and its block is not the one ${ownerName} last set there on main, the tranche or the base${t ? ` (commit ${t.sha.slice(0, 10)})` : ''}` });
        }
      }
      for (const file of rolledBack) {
        if (file === afile && approvalsTouched.length) continue; // the approvals finding names it
        const p = parents.find((q) => entryOf(root, q, file) === entryOf(root, sha, file) && judged(q, file) && staleHere(q, file));
        const { s, on } = stale(p, file);
        rolled.push({ sha, file, s, finding: { check: isOwnerSetting(file) ? 'settings' : KEEP.includes(file) ? 'path' : 'approvals', file, line: 1, message: `commit ${short} carries ${file} as ${ownerName}'s commit ${s.slice(0, 10)} set it, but ${on} has replaced that version since, and the head does not end on any trusted tip's (main, the tranche or the base): a rollback; merge ${on} again so the head takes its current version` } });
      }
      for (const file of files) {
        const ls = git(['--literal-pathspecs', 'ls-tree', '-z', sha, '--', file], { cwd: root });
        if (PROTECTED.some((p) => underPath(file, p))) {
          notices.push({ check: 'protected', file, line: 1, message: `commit ${short} changes a protected path; it needs the fresh-context review (rule 5)` });
        }
        if (isOwnerSetting(file) && !rolledBack.has(file)) approvalsTouched.push({ file, line: 1, check: 'settings', what: `${file}, which is the owner's setting,` });
        if (!ls) { // deleted
          if (KEEP.includes(file)) findings.push({ check: 'path', file, line: 1, message: `commit ${short} removes ${file}, which the checks stand on` });
          continue;
        }
        const [mode, , blob] = ls.split('\t')[0].split(' ');
        if (mode === '160000') continue; // a submodule pin has no blob
        const size = Number(git(['cat-file', '-s', blob], { cwd: root }));
        if (size > cfg.max_file_bytes) {
          // Waived (copy, 4 Nov: a job's first commit wrote a file over the cap and a later one
          // split it; history cannot be rewritten) when at the head the path is absent or within
          // the limit and the blob is at most twice the limit; judged after the walk.
          oversize.push({ file, size, commit: sha, finding: { check: 'size', file, line: 1, message: `commit ${short} writes ${size} bytes, over the ${cfg.max_file_bytes}-byte limit` } });
        }
        const t = cfg.transient.find((p) => underPath(file, p));
        if (t) findings.push({ check: 'path', file, line: 1, message: `commit ${short} writes under transient path ${t}` });
        if (isInstructionFile(file)) {
          const before = parents.length ? parentsFor(file).map((p) => show(root, p, file) || '') : [''];
          const added = (show(root, sha, file) || '').split('\n').filter((l) => APPROVAL_WORDS.test(l) && !before.some((b) => b.split('\n').includes(l)));
          if (added.length && !approvalsTouched.some((t2) => t2.file === file)) approvalsTouched.push({ file, line: 1 });
        } else if (file === CONFIG_FILE) {
          // The approvals key (an absent owner is the default one) and record_since.
          const ap = (t2) => {
            try {
              const c = parseJSON(t2 || '{}');
              return { approvals: JSON.stringify({ ...DEFAULTS.approvals, ...(c.approvals || {}) }), since: c.record_since ?? null };
            } catch { return { approvals: 'unreadable', since: 'unreadable' }; }
          };
          const now = ap(show(root, sha, file));
          const was = parents.length ? parentsFor(file).map((p) => ap(show(root, p, file))) : [ap(null)];
          // The approvals must equal a version already judged; so must record_since, unless it
          // names the base or an ancestor of it, which hides nothing the change brings.
          // An unreadable version (a duplicate key) equals none, so it never hides a change.
          const same = (w) => w.approvals !== 'unreadable' && w.approvals === now.approvals && (JSON.stringify(w.since) === JSON.stringify(now.since) || onBase(now.since));
          if (!was.some(same)) approvalsTouched.push({ file, line: 1, what: 'the approvals or record_since' });
        }
      }
      for (const t2 of approvalsTouched) {
        if (t2.message) { findings.push({ check: 'approvals', file: t2.file, line: t2.line, message: t2.message }); continue; }
        const v = ownerCommit(sha);
        if (!v.ok) findings.push({ check: t2.check || 'approvals', file: t2.file, line: t2.line, message: `commit ${short} changes ${t2.what || 'the approvals'} but is not ${ownerName}'s own commit through GitHub's website (${v.why})` });
      }
    } catch (e) {
      findings.push({ check: 'record', file: '(commit)', line: 1, message: `commit ${short} could not be checked: ${e.message}` });
    }
  }
  // One finding per file and owner commit: the merge that brought the replaced version, not every
  // later merge that keeps it (cold review of C21). Of the merges that carry it, those with no other
  // such merge behind them.
  for (const r of rolled) {
    const same = rolled.filter((o) => o !== r && o.file === r.file && o.s === r.s);
    if (!same.some((o) => anc(o.sha, r.sha))) findings.push(r.finding);
  }
  // An oversize blob is waived when the head has the path absent or within the limit and the
  // blob is at most 2 × max_file_bytes; larger ones stay findings, since history keeps them.
  // Each waived write is listed (size_waived), so the tranche report shows the growth.
