// ===== file: rerun.test.mjs (continued) =====

        { id: 2, body: block(GATE, { runs: [...new Set([head, tip()])].map((sha) => ({ sha, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 })) }), user: { login: BOT } },
      ]),
      checkRun: step(() => ({ status: 'completed', conclusion: 'success', html_url: 'run' })),
      verify: step((slug, r) => r.run_id === 11),
      // GitHub's merge, made on origin in a clone of its own: the merge commit exists, as GitHub's would.
      mergePR: step((slug, n, sha) => {
        s.merges++;
        s.mergedSha = sha;
        let m = 'm'.repeat(40);
        if (root) {
          const gh0 = join(mkdtempSync(join(tmpdir(), 'p3-ghmerge-')), 'g');
          git(['clone', '-q', '-b', 'tranche', git(['remote', 'get-url', 'origin'], { cwd: root }), gh0], { cwd: root });
          for (const [k, v] of [['user.email', 'gh@example.com'], ['user.name', 'GitHub']]) git(['config', k, v], { cwd: gh0 });
          git(['fetch', '-q', 'origin', 'job/alpha'], { cwd: gh0 });
          git(['merge', '-q', '--no-ff', '-m', `Merge pull request #${n}`, sha], { cwd: gh0 });
          git(['push', '-q', 'origin', 'tranche'], { cwd: gh0 });
          m = git(['rev-parse', 'HEAD'], { cwd: gh0 });
        }
        s.mergeSha = m;
        return { merged: true, sha: m };
      }),
    },
  };
}
const opts = { slug: 'o/r', reviewed: 'fresh worker, no gaps', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {} };
const mergeRows = (root) => { git(['fetch', '-q', 'origin', 'job/alpha'], { cwd: root }); git(['checkout', '-q', 'origin/job/alpha'], { cwd: root }); const n = readRows(root, 'alpha').filter((r) => r.row === 'merge').length; git(['checkout', '-q', 'main'], { cwd: root }); return n; };

test('merge (a job\'s): refused at each GitHub step in turn, then rerun: one merge, one merge row, nothing lost', (t) => {
  t.after(() => useShared(null));
  const clean = setup();
  const g0 = github(clean.head, 0, clean.root);
  assert.equal(merge(clean.root, 3, { ...opts, io: g0.io }).merged, true);
  const steps = g0.s.calls;
  assert.ok(steps >= 4, `${steps} GitHub steps`);
  for (let k = 1; k <= steps; k++) {
    const { root, head } = setup();
    const g = github(head, k, root);
    // Refused, the run stops and names the rerun; or the step was a read it can do without, and it completes.
    try { merge(root, 3, { ...opts, io: g.io }); } catch (e) { assert.ok(e.message.includes('GitHub budget') && e.message.includes('then rerun'), `step ${k}: ${e.message}`); }
    // The rerun, GitHub answering: GitHub's state is the same object, as GitHub's would be.
    const again = { ...g.io };
    const s = g.s;
    const r = merge(root, 3, { ...opts, io: { ...again, getPR: (...a) => { s.calls = -1e9; return again.getPR(...a); } } });
    assert.ok(r.merged === true || r.already, `step ${k}: the rerun completes`);
    assert.equal(s.merges, 1, `step ${k}: one merge`);
    assert.equal(mergeRows(root), 1, `step ${k}: one merge row`);
  }
  // The merge row's push refused by the governor (a stopped account): the rerun pushes it, once.
  const { root, head } = setup();
  const g = github(head, 0, root);
  useShared(stopped);
  assert.throws(() => merge(root, 3, { ...opts, io: g.io }), /GitHub budget: .*every GitHub call is stopped.*then rerun/s);
  useShared(null);
  assert.equal(g.s.merges, 0, 'nothing merged before its row is on the branch');
  assert.equal(merge(root, 3, { ...opts, io: g.io }).merged, true);
  assert.equal(g.s.merges, 1);
  assert.equal(mergeRows(root), 1);
});

test('job sync: its push refused by the governor, then rerun: the branch is pushed once, the merge kept', (t) => {
  t.after(() => useShared(null));
  const { root } = setup();
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  git(['branch', '-q', '--set-upstream-to', 'origin/job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/b.mjs': 'more work' });
  useShared(stopped);
  assert.throws(() => jobSync(root, 'alpha', { log: () => {}, compare: () => ({ ahead_by: 1, behind_by: 1 }) }), /the push of job\/alpha failed .*GitHub budget.*run `node \.process\/tool\/p3\.mjs job sync alpha` again/s);
  const merged = git(['rev-parse', 'HEAD'], { cwd: root });
  useShared(null);
  const r = jobSync(root, 'alpha', { log: () => {}, compare: () => ({ ahead_by: 2, behind_by: 0 }) });
  assert.deepEqual(r.merged, [], 'the first run\'s merge of the tranche stands; nothing merged twice');
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), merged);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], merged, 'pushed on the rerun');
});

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
