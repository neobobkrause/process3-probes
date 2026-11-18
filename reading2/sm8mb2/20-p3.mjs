  // walk's findings, counted as n toward "each recorded".
  found: (a, root) => {
    if (a._.length < 1 || a._.length > 2) fail('found <module> "<finding>" [--from <source>], the finding in quotes; or found "<finding>" for one that names no module');
    const [mod, text] = a._.length === 2 ? a._ : [null, a._[0]];
    if (a.from === true) fail('--from <source>, e.g. --from "walk p3dev-l1"');
    if (a.covers === true) fail('--covers <n>: how many of the walk\'s findings this one stands for');
    found(root, mod, String(text), { from: a.from, covers: a.covers, write: !!a.write, offline: !!a.offline });
    return 0;
  },

  // round next [--apply] [--findings <file>] (C46): from the latest round walk, in one run: its findings
  // by module (one entry per distinct flaw, with its --covers count; a file of `<module>: <text>[, covers <n>]`
  // lines in place of the walk's own texts), each recorded as found records it (an owed reopen, or a
  // found mark in one plain pull request the merge tool merges), the PD-16 set-aside, the round's
  // lowest layer opened and its `job start` commands printed (BOB starts them). Also: a round's next
  // layer opened once one merges; the open layer's jobs; the round's walk owed; the release path
  // after a clean walk. A dry run unless --apply; run again after a partial run, it goes on.
  'round next': (a, root) => {
    if (a.findings === true) fail('--findings <file>: a file of `<module>: <text>` lines');
    if (a.apply !== undefined && a.apply !== true) fail('--apply takes no value');
    return roundNext(root, { apply: !!a.apply, findingsFile: a.findings, by: senderOf(root, a.as) }).ok ? 0 : 1;
  },

  // hold <module:<id>|layer:<n>|slots:<n>> --why "<reason>" --by <session> [--prs <n>[,<n>...]] [--until <ISO time|<n>m|<n>h>]; hold --end <id> --by <session>:
  // the only way to hold startable work below the job cap (coordinator's design, 5 Nov 01:13), a row on the state branch; it lasts until its named PRs land or its --until time.
  hold: (a, root) => { hold(root, a._[0], { why: a.why, by: a.by, until: a.until, prs: a.prs, ...(a.when !== undefined ? { when: a.when } : {}), ...(a.end !== undefined ? { end: a.end } : {}) }); return 0; },

  // test <id>: the module's own suite, as the gate runs it.
  test: (a, root) => (jobTest(root, one(a, 'module'), { session: typeof a.session === 'string' ? a.session : null }).ok ? 0 : 1),

  // block <id> --reason "<why>" [--owner bob|coordinator]: who owes its ruling; bob only for a requirement question, what the product must do (rule 9)
  block: (a, root) => (jobBlock(root, one(a, 'module'), { reason: a.reason, owner: a.owner }).ok ? 0 : 1),

  // metrics add <id> --attempt n --session s [--tokens n] [--cost-usd x] [--denials n]
  //   [--refusal "<act>|<depth>|<channel>"]... [--decline "<act>|<depth>"]... [--outcome o]
  // metrics refusal --session s --act "<act>" --depth n [--module <id>]: one refusal a session
  //   reported, in process/metrics/refusals.bob.jsonl; status prints REFRESH for a session at 10.
  // metrics report: the two health metrics and their figures, BOB's idle time per day and the
  //   process overhead share per job and per layer, ROOT's context per sweep, and the wakes, as JSON.
  // metrics survival [--days 14] [--branch <ref>] [--offline]: each merged job PR at least that old,
  //   whether its change stands on the tranche and on main, and the cost per surviving PR (P3-G5).
  // metrics wake --session s --tokens n --usd x --mode stateless|resident: one measured BOB wake.
  metrics: (a, root) => {
    const sub = a._.shift();
    if (sub === 'add') {
      const id = one(a, 'module');
      if (['bob', 'root'].includes(a.role) && (typeof a.session !== 'string' || !a.session)) fail(`--role ${a.role} needs --session <its session id>: its --cost-usd is that session's cost so far`);
      const split = (v, keys) => list(v).map((x) => Object.fromEntries(String(x).split('|').map((p, i) => [keys[i], p])));
      const row = appendRow(root, id, {
        row: 'attempt', event: 'measured', role: a.role || 'job', attempt: Number(a.attempt || 1), session: a.session || null,
        tokens: num(a.tokens), cost_usd: a['cost-usd'] === undefined ? 'unmeasured' : Number(a['cost-usd']),
        denials: Number(a.denials || 0), refusals: split(a.refusal, ['act', 'depth', 'channel']),
        declines: split(a.decline, ['act', 'depth']), outcome: a.outcome || null,
      }, bobMetricsFile(id));
      console.log(JSON.stringify(row));
      return 0;
    }
    if (sub === 'refusal') {
      const row = recordRefusal(root, { session: a.session, act: a.act, depth: a.depth, module: typeof a.module === 'string' ? a.module : null });
      console.log(JSON.stringify(row));
      return 0;
    }
    if (sub === 'report') {
      const cfg = loadConfig(root);
      const branch = a.branch || `origin/${cfg.tranche}`;
      const { jobRefs, jobRows } = leadFetch(root, cfg);
      let sweepRows = [];
      let lead = { jobRefs, jobRows };
      let roles = new Map();
      try { if (fetchState(root, cfg.state_branch)) { sweepRows = jsonl(readState(root, cfg.state_branch, SWEEP_ROWS_FILE)); roles = stateRoles((p) => readState(root, cfg.state_branch, p)); lead = { ...leadInputs(root, cfg.state_branch, (p) => readState(root, cfg.state_branch, p), cfg.tranche), closed: closedRows(root, cfg, { slug: repoSlug(root) }), jobRefs, jobRows }; } } catch { sweepRows = []; lead = { jobRefs, jobRows }; } // unreadable: idle time and the state's lead times unmeasured
      const layers = git(['show', `${branch}:${cfg.layers_file}`], { cwd: root, allowFail: true });
      console.log(JSON.stringify(metricsReport(root, repoSlug(root), branch, { sweepRows, layers: layers.code === 0 ? layers.stdout : null, refreshAt: cfg.refresh_context, cfg, lead, roles }), null, 2));
      return 0;
    }
    if (sub === 'survival') {
      const cfg = loadConfig(root);
      const days = a.days === undefined ? 14 : Number(a.days);
      if (a.days === true || !Number.isInteger(days) || days < 0) fail(`--days <n>, whole days, not ${JSON.stringify(a.days)}`);
      if (!a.offline) wholeHistory(root, cfg.tranche);
      const main = git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/main'], { cwd: root, allowFail: true }).code === 0 ? 'origin/main' : null;
      console.log(JSON.stringify(survivalReport(root, { branch: a.branch || `origin/${cfg.tranche}`, main, days }), null, 2));
      return 0;
    }
    if (sub === 'wake') {
      console.log(JSON.stringify(recordWake(root, { session: a.session, tokens: a.tokens, usd: a.usd, mode: a.mode })));
      return 0;
    }
    fail('metrics add | metrics refusal | metrics report | metrics survival | metrics wake');
  },

  // bob wake --stateless [--live <n>] [--context <percent>] [--offline]: the create_session call of a
  //   fresh BOB for one wake, its prompt the reading set and status --role bob, with its size; writes nothing.
  'bob wake': (a, root) => {
    if (!a.stateless) fail('bob wake --stateless: the only form so far');
    statelessWake(root, { slug: repoSlug(root), live: a.live, context: a.context, offline: !!a.offline });
    return 0;
  },

  // merge <pr> (--reviewed "<what>" --rounds <n> --review-minutes <n> --findings <n> --acted-on <n> [--review-cost-usd <n> | --review-session <id>[,<id>] | --review-record <file>] | --no-review "<why>") [--decision "<why>"] [--minutes 95] [--job-cost-usd <n> [--job-session <id>]]: BOB merges a job.
  // With no --review-cost-usd, the review's cost is read from the review session's saved get_session result (--review-record), else the
  // module's `metrics add <id> --role review` rows (those of --review-session, or since the attempt started); none read: unmeasured, said why.
  // A job PR that fires a review trigger (a test deleted or loosened: triggers.mjs) merges only --reviewed.
  // merge <pr> --plain (--reviewed "<what>" --rounds <n> | --no-review "<why>") [--decision "<why>"] [--minutes 95]: any other pull request.
  // merge <pr> --plain --pass "<what and why>": a pass (P7) from a pass/<name> branch, a no-judgment change across modules while no job holds them, on a gate that ran their suites; no review.
  // --rounds: 1 for the two fresh reviews, 2 with the fix pass and its re-review; more needs --decision (build I).
  merge: (a, root) => {
    const n = Number(one(a, 'pull request number'));
    const review = { reviewed: a.reviewed, noReview: a['no-review'], rounds: a.rounds, decision: a.decision };
    if (a.pass !== undefined && !a.plain) fail('--pass is a plain merge: merge <pr> --plain --pass "<what and why>"');
    if (a.plain) return mergePlain(root, n, { ...review, ...(a.pass !== undefined ? { pass: a.pass } : {}), ...(a.minutes ? { minutes: Number(a.minutes) } : {}), as: senderOf(root, a.as) }).merged ? 0 : 1;
    return merge(root, n, { ...review, ...(a.minutes ? { minutes: Number(a.minutes) } : {}), jobCostUsd: a['job-cost-usd'], jobSession: a['job-session'], reviewMinutes: a['review-minutes'], reviewCostUsd: a['review-cost-usd'], reviewSession: a['review-session'], reviewRecord: a['review-record'], findings: a.findings, actedOn: a['acted-on'] }).merged ? 0 : 1;
  },

  // gate --base <sha> --head <sha> --branch <ref> --pr <n> --draft <true|false> [--started <epoch s>] [--base-ref <ref>]
  // gate --post <gate.json> --pr <n> [--head <sha>] [--gate-result <result>]
  // Run only by the gate workflow, with the base's process pin: job gate runs the gate on a
  // read-only token and never posts (the shim's --no-post is ignored), and job post posts its row
  // with --post (setup audit, 2 Nov).
  gate: (a, root) => {
    if (a.post !== undefined) {
      if (a.post === true) fail('--post needs the gate.json file');
      postRow(a.post, { pr: a.pr ? Number(a.pr) : null, head: a.head, gateResult: a['gate-result'], slug: repoSlug(root) });
      return 0;
    }
    const { run: r, findings } = gate(root, {
      base: a.base, head: a.head, branch: a.branch, pr: a.pr ? Number(a.pr) : null, baseRef: baseRefOf(a),
      draft: a.draft === 'true' || a.draft === true, started: a.started ? Number(a.started) * 1000 : Date.now(),
      // The process clone this runs from judges a pin-only change (gateclass.mjs); the shim says when
      // its gate-class step left the browser out (P3_BROWSER=skip), so no product test may run.
      repo: gateRepo(processRepo, TOOL_ROOT), browserSkipped: process.env.P3_BROWSER === 'skip',
    });
    console.log(`gate: ${r.trigger}; suite ${r.suite}; revert ${r.revert}; ${r.minutes} min`);
    return report(findings, a.out, { run: r });
  },

  // gate-class --base <sha> --head <sha> --branch <ref> [--base-ref <ref>] [--out <file>]: the gate shim's step before
  // the browser install (C45b): the run's class (gateclass.mjs) and whether the product's browser is
  // needed, as `class=<c>` and `browser=skip|keep` lines appended to --out ($GITHUB_OUTPUT). Any
  // failure says keep: the browser is then installed as before.
  'gate-class': (a, root) => {
    let c;
    try {
      if (!a.base || !a.head || a.base === true || a.head === true) fail('gate-class --base <sha> --head <sha> --branch <ref> [--out <file>]');
      c = gateClassAt(root, { base: a.base, head: a.head, branch: a.branch === true ? '' : a.branch || '', baseRef: baseRefOf(a), repo: gateRepo(processRepo, TOOL_ROOT) });
    } catch (e) { c = { class: 'full', why: `unread (${String(e.message).slice(0, 200)})`, lanes: true }; }
    const browser = browserNeeded(c) ? 'keep' : 'skip';
    console.log(`gate class: ${c.class} (${c.why}); browser: ${browser}`);
    if (a.out && a.out !== true) appendFileSync(a.out, `class=${c.class}\nbrowser=${browser}\n`);
    return 0;
  },

  // report tranche [--out <file>]: the tranche report in Markdown, from the record alone (Phase 3,
  // PLN-6): elapsed time, work and deferrals per layer, cost and overhead share, refusals by role
  // and act, BOB's idle occurrences, the Phase 3 overhead comparisons; unmeasured where it lacks.
  'report tranche': (a, root) => {
    const cfg = loadConfig(root);
    let slug = null;
    try { slug = repoSlug(root); } catch { slug = null; }
    const { jobRefs, jobRows, deepened } = leadFetch(root, cfg);
