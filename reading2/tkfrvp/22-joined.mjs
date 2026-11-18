// ===== file: anchor.mjs (continued) =====

// no commit the clone holds ever had one.
export function lastConfigAt(root, rev) {
  if (blobAt(root, rev, CONFIG_FILE)) return rev;
  const touched = git(['log', '--first-parent', '--full-history', '--format=%H', rev, '--', CONFIG_FILE], { cwd: root, allowFail: true }).stdout?.split('\n').filter(Boolean) || [];
  return touched.find((c) => blobAt(root, c, CONFIG_FILE)) || null;
}

// The first close (bootstrap): a base that holds no pin and whose history never held the config.
export const isBootstrap = (root, baseRef) => !lastConfigAt(root, baseRef) && !pinAt(root, baseRef);

// The anchored keys as GitHub's merge would leave them: the base's tip merged with sha, as git
// merges it (merge-tree). Each pull request is judged head against merge base, but what lands is
// a line-by-line merge, and two changes judged alone can compose into a value neither holds, or
// undo the owner's later change on the base (second confirming review of PR 97). So each key in
// the merge must be the head's when the head changes it (judged by unanchored), else the base
// tip's. Returns why not, or null.
export function mergedUnanchored(root, tip, mb, sha) {
  const r = git(['merge-tree', '--write-tree', tip, sha], { cwd: root, allowFail: true });
  if (r.code !== 0) return `it does not merge cleanly with the base as it is`;
  const tree = r.stdout.split('\n')[0].trim();
  // The base's value is the base tip's own (a base that deleted its config blocks nothing that
  // leaves it deleted: third confirming review of PR 97).
  if (blobAt(root, tip, CONFIG_FILE) && !blobAt(root, tree, CONFIG_FILE)) return `merged with the base as it is, it would delete ${CONFIG_FILE}`;
  const from = lastConfigAt(root, mb) || mb;
  for (const key of ANCHORED) {
    const head = keyAt(root, sha, key);
    const want = head !== keyAt(root, from, key) ? head : keyAt(root, tip, key);
    if (keyAt(root, tree, key) !== want) return `merged with the base as it is, it would leave ${key} in ${CONFIG_FILE} at neither the base's value nor the head's judged one`;
  }
  return null;
}

// ===== file: merge.mjs (later part) =====

    // <source>)*` lines, nothing removed or changed, merges plain. Any other change still goes through a job.
    const why = [];
    const owned = (f, e) => [...(e.paths || []), ...(e.tests || [])].some((p) => underPath(f, p));
    const found = (f, e) => {
      if (!e.requirements || f !== String(e.requirements).replace(/^\.\//, '')) return false;
      const diff = git(['diff', '--no-renames', '-U0', mb, pr.head.sha, '--', f], { cwd: root });
      const before = git(['show', `${mb}:${f}`], { cwd: root, allowFail: true });
      const r = foundOnly(diff, before.code === 0 ? before.stdout : '');
      if (!r.ok) why.push(`${f}: ${r.why}`);
      return r.ok;
    };
    // A second (copy PR 148, 4 Nov): a module's committed generated files, under the base
    // config's `generated` paths, merge plain when nothing else of any module changes and a green
    // gate run on the head regenerated them byte-identical (checked below, once the gate is done).
    const gen = baseCfg ? generatedRows(baseCfg).rows : [];
    // A third (build untrack-generated): removing a module's committed generated file, with only
    // lines added to a .gitignore for it; the gate's row must show it built, verified, and ignored.
    const removed = removedGenerated(root, gen, changed, pr.head.sha);
    ignores = removed.length ? ignoreLines(root, mb, pr.head.sha, changed, removed) : [];
    // The fourth route, a pass (P7, Bob's Keep and Drop, 3 Nov): "A no-judgment change across many
    // modules is one mechanical pass by a worker in BOB's session while no job runs, with one full
    // test run before it is committed." Any module's files, while no live job holds them, on a
    // green gate that ran every touched module's whole suite (checked below), with no receipt.
    if (pass !== undefined) {
      passIds = entries.filter((e) => changed.some((f) => owned(f, e))).map((e) => e.id);
      if (!passIds.length) fail(`pull request ${n} changes no module's files: it is no pass; merge it without --pass`);
      noLiveJobs = () => {
        const live = liveJobs(root, passIds, { slug, tranche: base, entries, io });
        if (live.length) fail(`pull request ${n} is a pass, and a pass runs while no job holds its modules (P7): ${live.slice(0, 5).join(', ')}`);
      };
      noLiveJobs();
      if (latestBlock(null, null, RECEIPT, io.comments(slug, n))) fail(`pull request ${n} carries a receipt: a pass has none; a job's work merges without --plain`);
    }
    // A lane's pull request (Bob's standing approvals, 5 Nov: "A pull request that changes only
    // files in its own lane's folder lands through the merge tool without a test suite run"):
    // every file in one lane's folder, records aside, as the gate judges it (util.mjs laneOnly;
    // copy PR 620, 6 Nov 05:15, refused as module files of ux-design). Not a module's tests.
    const lane = baseCfg ? laneOnly(baseCfg, changed, entries) : null;
    if (lane) log(`pull request ${n} changes only lane ${lane}'s folder (records aside): it lands as a lane's change`);
    const hits = pass !== undefined || lane ? [] : changed.flatMap((f) => entries.filter((e) => owned(f, e) && !found(f, e)).map((e) => ({ f, id: e.id })));
    const hit = hits.filter((h) => !isGenerated(gen, h.f) && !ignores.includes(h.f)).map((h) => `${h.f} (${h.id})`);
    if (hit.length) fail(`pull request ${n} changes module files, which go through a job: ${hit.slice(0, 5).join(', ')}${why.length ? `; a plain pull request may only add new unmet found marks to a requirement file (${why.slice(0, 3).join('; ')})` : ''}${hits.length > hit.length ? '; a plain pull request may change a module\'s generated files only, and only to their regenerated bytes' : ''}; a no-judgment change while no job runs is a pass: from a pass/<name> branch, merge --plain --pass "<what and why>" (P7)`);
    // The gate's row must have compared every generated file the refresh changes, owned or not
    // (review 3 of PR 95).
    // A pass's changed generated module files are compared as a refresh's are, its other files aside.
    const genOwned = passIds && changed.some((f) => isGenerated(gen, f) && entries.some((e) => owned(f, e)));
    refreshed = hits.length || genOwned ? changed.filter((f) => isGenerated(gen, f)) : [];
    untracked = refreshed.length ? removed : [];
    const others = refreshed.length && !passIds ? refreshOthers(baseCfg, gen, changed, entries, ignores) : [];
    if (others.length) fail(`pull request ${n} changes generated module files and ${others.slice(0, 5).join(', ')}: a refresh may go beside only records, the modules file, the layers file and process/config.json; any other file could be what writes them`);
  }

  const names = [...new Set(readRules().checks.map((c) => c.context))];
  if (!names.length && (main || !baseCfg || base === baseCfg.tranche)) fail(`${base} requires no checks; its ruleset must require the gate before anything merges into it`);
  const states = waitForChecks(slug, pr.head.sha, names, { minutes, every: opts.every, read: io.checkRuns, pr: () => io.getPR(slug, n), log, ...(opts.transient ? { transient: opts.transient } : {}) });
  log(names.length ? `required checks on ${pr.head.sha.slice(0, 10)}: ${states.map(([c, st]) => `${c} ${st}`).join(', ')}; GitHub's ruleset judges them` : `note: ${base} requires no checks`);
  if (refreshed.length) refreshGate(slug, n, pr.head.sha, refreshed, { base, baseSha: git(['rev-parse', baseRef], { cwd: root }), untracked, io, log });
  if (passIds) passGate(slug, n, pr.head.sha, passIds, { base, baseSha: git(['rev-parse', baseRef], { cwd: root }), io, log });
  // The base must still be the one checked.
  const again = io.getPR(slug, n);
  if (again.base?.ref !== base) fail(`pull request ${n} was retargeted to ${again.base?.ref} while it was checked`);
  if (again.head?.sha !== pr.head.sha) fail(`pull request ${n} moved while it was checked; run merge again`);
  // Read the base again now, after the wait (it may have moved), from a fetch that must succeed:
  // a first close stands only while the base still has no Process3 (review 4 of PR 97), and the
  // anchored keys are judged on the merge with the base as it is (anchor.mjs mergedUnanchored).
  const baseHolds = () => {
    git(['fetch', '-q', 'origin', `+refs/heads/${base}:refs/remotes/origin/${base}`], { cwd: root });
    if (boot && !isBootstrap(root, baseRef)) fail(`${base} gained Process3 while pull request ${n} was checked as its first close; run merge again`);
    const why = mergedUnanchored(root, baseRef, git(['merge-base', baseRef, pr.head.sha], { cwd: root }), pr.head.sha);
    if (why) fail(`pull request ${n} is refused: ${why}; that needs the owner's word: bring it to Bob`);
  };
  baseHolds();
  // The first close stands on the gate itself, not only on GitHub's ruleset.
  if (boot && !states.some(([c, st]) => c === 'gate' && st === 'success')) fail(`${base} has no Process3, so its first close needs the gate, required by ${base}'s ruleset and green on ${pr.head.sha.slice(0, 10)}; ${names.length ? `its required checks: ${states.map(([c, st]) => `${c} ${st}`).join(', ')}` : `${base} requires no checks`}`);
  // A job started on a pass's module while its gate was awaited: no pass lands over it (cold review).
  noLiveJobs();
  const r = mergeRetry(() => io.mergePR(slug, n, pr.head.sha, {
    title: `Merge PR ${n}: ${head} into ${base}`,
    message: [pass !== undefined ? `Pass: ${pass}` : reviewed ? `Reviewed: ${reviewed}` : `No review: ${noReview}`, `Review rounds: ${rounds.rounds}`, ...(rounds.decision ? [`Decision: ${rounds.decision}`] : []), ...(limitsLine(workflows) ? [limitsLine(workflows)] : [])].join('\n'),
  }), {
    log, wait: opts.wait, reread: { read: () => io.getPR(slug, n), sha: pr.head.sha },
    fetch: () => git(['fetch', '-q', 'origin', `+refs/heads/${base}:refs/remotes/origin/${base}`], { cwd: root, allowFail: true }),
    check: () => {
      const p = io.getPR(slug, n);
      if (p.state !== 'open' || p.base?.ref !== base || p.head?.sha !== pr.head.sha) fail(`pull request ${n} changed while its base moved; run merge again`);
      baseHolds();
      noLiveJobs();
    },
  });
  if (!r?.merged) fail(`GitHub did not merge pull request ${n}: ${r?.message || 'no result'}`);
  log(`merged pull request ${n} at ${r.sha} (${now()})`);
  // A pin move into the tranche (never into a working branch) gives BOB new acts (tranche open):
  // the wake, from the role that ran the merge (--as; BOB itself, the default, is awake).
  const pin = pinAt(root, pr.head.sha);
  const as = opts.as ?? 'bob';
  const moved = base === (baseCfg?.tranche || DEFAULTS.tranche) && pin && pin !== pinAt(root, mb);
  const what = PIN_WHAT(pin);
  const wake = moved && as !== 'bob' ? bobWake(what, as) : null;
  // Printed once per merge commit (state.mjs wakeOnce).
  if (wake) printWake(root, baseCfg?.state_branch || DEFAULTS.state_branch, { pr: n, sha: r.sha, what, wake, as, by: 'merge', log });
  return { merged: true, sha: r.sha, checks: names, wake, what: wake ? what : null, ...(passIds ? { pass, modules: passIds } : {}), ...(workflows.length ? { workflows } : {}) };
}

// A pin move's wake for BOB (build train-robust, option 2A): the same words wherever the move is
// seen, computed from git when no record carries them (a train that stopped after its land, a
// pull request found merged by a later pass): the pin at the merge commit against the pin at its
// first parent, the base as it was (the tool merges with merge commits only). A merge commit that
// cannot be read gives the wake anyway, said so: an extra wake costs BOB one status, a missing
// one stalls the tranche. { what, wake } (both null when the pin did not move or as is bob).
