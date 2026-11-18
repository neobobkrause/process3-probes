    let stateRead = false;
    try { stateRead = fetchState(root, cfg.state_branch); } catch { stateRead = false; }
    // The open provider-notice slots, as status reads them (noticeSlots); unmeasured unread.
    let slots = null;
    if (stateRead) { try { slots = noticeSlots(root, cfg, status(root, { offline: true, log: () => {} }).rows); } catch { slots = null; } }
    const md = trancheReport(root, cfg, { slug, stateRead, deepened, jobRefs, jobRows, notices: slots, io: { state: (p) => readState(root, cfg.state_branch, p) } });
    if (a.out && a.out !== true) writeFileSync(a.out, md + '\n');
    console.log(md);
    return 0;
  },

  // release dev [--version <v>]: BOB's development release (development only; there is no public
  // release): refused until the current round has closed and been deployed and walked, its
  // findings recorded, and unless the checkout is the tranche tip and the config has "release";
  // prints the dispatch on the tranche, the run to watch and the record.
  // release dev --record <run url>: the run's row (version, commit, run, draft release, checks) on the state branch.
  'release dev': (a, root) => (releaseDev(root, { version: a.version === true ? fail('--version <v>') : a.version, record: a.record === true ? fail('--record <run url>') : a.record }).ok ? 0 : 1),
  // deploy dev [--slug <s>]: the round's walk where no internal walk is configured: BOB's development
  // deployment and walk at a round close (development only, the product's own Cloudflare account):
  // dry run behind the guard line, deploy, walk, one row. Refused where an internal walk is configured.
  'deploy dev': (a, root) => (deployDev(root, { slug: a.slug === true ? fail('--slug <s>') : a.slug }).ok ? 0 : 1),
  // deploy release <version>: the release deployment and its walk (BD-R1); no path installs a cut
  // release on a p3dev- deployment yet, so it names the act and the gap, and exits 1.
  'deploy release': (a, root) => (deployRelease(root, String(one(a, 'version'))).ok ? 0 : 1),
  // walk internal: the product's internal walk (deploy.internal_walk) alone, any time, no deploy; its reports on the state branch.
  'walk internal': (a, root) => (walkInternal(root).ok ? 0 : 1),
  // walk round [--slug <s>]: the round's walk where an internal walk is configured (BD-R1, C43): the
  // internal walk alone at a round's close, from the clean tranche tip, one round-walk row; no deploy.
  'walk round': (a, root) => (walkRound(root, { slug: a.slug === true ? fail('--slug <s>') : a.slug }).ok ? 0 : 1),
  // release run checks|assemble [--out <results.json>] [--log-dir <dir>]: the shim's read-only jobs
  // (process-dev-release.yml); --log-dir keeps each step's whole output where the job uploads it.
  'release run': (a, root) => {
    if (a.out === true || a['log-dir'] === true) fail('release run checks|assemble [--out <results.json>] [--log-dir <dir>]');
    return releaseRun(root, one(a, 'step (checks or assemble)'), { out: a.out, logDir: a['log-dir'] }).ok ? 0 : 1;
  },
  // release version <v>: the dispatched version, checked and printed (the shim's publish job).
  'release version': (a) => { console.log(checkVersion(String(one(a, 'version')))); return 0; },
  // release sign <dir>: SHA256SUMS and its Ed25519 signature, the PEM key in P3_SIGN_KEY (only when release.sign_secret is set).
  'release sign': (a) => { releaseSign(one(a, 'directory')); return 0; },
  // release body <checks.json> --version <v> --commit <sha> [--pin <sha>] [--size <size.json>]:
  // the draft release's body: the checks, the process pin, the product sizes and the pin's platform rows.
  'release body': (a) => { console.log(releaseBody(one(a, 'checks file'), { version: a.version, commit: a.commit, pin: a.pin, sizeFile: a.size })); return 0; },

  // review brief <pr> [--scope "<text>"]: prints the fresh-context brief a reviewer subagent is
  // given, filled from the pull request (build N). Writes nothing.
  'review brief': (a, root) => { reviewBrief(root, a._[0], { scope: a.scope }); return 0; },

  // setup check: the product's setup, read-only, against setup/conditions.json; exit 1 when a
  // condition is missing. The eleventh command (setup audit, 2 Nov); job start runs it first.
  // --at HEAD judges the checkout's own commit (its pin and files), not the tranche tip: a
  // pin-move pull request runs it before it merges. session-branch is skipped then.
  // branches prune [--dry-run] [--ref <the run's GITHUB_REF>] [--run <run id>]: the scheduled
  // cleanup (shims/process-branch-prune.yml, lib/branches.mjs). Deletes only while the approvals
  // block on the default branch carries Bob's sentence (branches.mjs APPROVAL); --dry-run prints
  // what the rules would delete and writes nothing.
  'branches prune': (a, root) => {
    if (a._.length || a.ref === true || a.run === true) fail('branches prune [--dry-run] [--ref <ref>] [--run <run id>]');
    return prune(root, { slug: repoSlug(root), dryRun: !!a['dry-run'], ref: a.ref, run: a.run }).ok ? 0 : 1;
  },

  'setup check': (a, root) => (setupCheck(root, { slug: repoSlug(root), at: a.at === true ? fail('--at <ref>, e.g. --at HEAD') : a.at }).ok ? 0 : 1),

  // size [--at <ref>] [--gate <gate.json>] [--out <size.json>]: the product as the process sees it
  // (modules, layers, requirement files, suites, lock files, generated rows, tracked files), read
  // from git at the ref (default HEAD), and against the pin's ranges.json. Writes nothing else.
  size: (a, root) => {
    if (a.at === true || a.gate === true || a.out === true) fail('size [--at <ref>] [--gate <gate.json>] [--out <size.json>]');
    let gateRow = null;
    if (a.gate) { try { gateRow = JSON.parse(readFileSync(a.gate, 'utf8')); } catch { fail(`--gate ${a.gate}: not a readable gate.json`); } }
    let s;
    try { s = measureSize(root, loadConfig(root, a.at), { ref: a.at || 'HEAD', gateRow }); } catch (e) { fail(e.message); }
    const c = compareRanges(s.figures, loadRanges());
    for (const l of [...sizeLines(s), ...c.lines]) console.log(l);
    if (a.out) writeFileSync(a.out, JSON.stringify({ ...s, range: { state: c.state, outside: c.outside } }, null, 2) + '\n');
    return 0;
  },

  // start check [--branch <the branch the session started from; default the tranche>]: a
  // session's first command. Fetches that branch, compares HEAD and the approvals block with its
  // tip, prints both SHAs; exit 1 when either differs (Foundations, "Every session checks its start").
  // It records the approvals it loaded under .git; start check --wake, at every later wake of
  // BOB, ROOT or the watcher, exits 1 when the tip's approvals differ from that record, or with
  // --approvals <hash> (from the starting or task prompt) from that hash.
  // With --wake, once the approvals hold, the calling role's prompt against the one it started
  // from: a changed prompt is printed once, with its pin, and recorded (prompt refresh).
  'start check': (a, root) => {
    // C42: one repository per session (BD-R2; PD-13). Warnings, never a refusal.
    { let lines = []; try { lines = workdirLines(root); } catch { lines = []; } for (const l of lines) console.log(l); }
    // A role's first check re-anchors as job start does (coordinator, 5 Nov: ROOT, BOB and the
    // MERGER (since removed) failed theirs on every tranche merge landing between create_session and the check,
    // with the train merging every few minutes): a clean checkout the tip has moved past, with
    // the tip's approvals and pin, moves to the tip; anything else still fails.
    if (!a.wake) return startCheck(root, { branch: a.branch, setup: true, anchor: true }).ok ? 0 : 1;
    if (!wakeCheck(root, { branch: a.branch, approvals: a.approvals }).ok) return 1;
    // A refresh that cannot run (the state push failed, no ROOT for BOB's prompt) never stops a
    // session whose approvals hold: it says so and the session acts by the prompt it has.
    try { promptRefresh(root, { session: typeof a.session === 'string' ? a.session : undefined }); } catch (e) { console.log(`prompt refresh: could not run (${e.message}); act by the prompt you have, and send your coordinator these words`); }
    return 0;
  },

  // start root | start bob | start watcher: the role's starting prompt (and create_session call).
  // start watcher --replace <the addressed watcher's id>: its replacement, by whoever starts ROOT.
  // start coordinator --replace <its id> --branch <b> --handoff <path>: by ROOT, at the coordinator's ask.
  // start record <root|bob|watcher|coordinator> <session id>: the address, written after the session was created.
  start: (a, root) => {
    if (a._[0] === 'record') { recordStart(root, a._[1], a._[2]); return 0; }
    startRole(root, a._[0], { replace: a.replace, branch: a.branch, handoff: a.handoff });
    return 0;
  },

  // sweep --session <id> [--live <n>] [--sessions <list_sessions saved as JSON>] [--context <percent>] [--offline] [--attempt "<who>:<role>:<minutes>:<usd>"]...: ROOT's
  // hourly routine; prints what ROOT must do and writes the heartbeat. sweep task --session <id>:
  // the hourly task's prompt and create_trigger call.
  sweep: (a, root) => {
    if (a._[0] === 'task') { const t = sweepTask(a.session, loadConfig(root).tranche, tipApprovals(root).approvals); console.log(t.prompt); console.log(`create_trigger, bound to this session:\n${JSON.stringify(t.call, null, 2)}`); return 0; }
    sweep(root, { session: a.session, live: a.live, sessions: a.sessions, context: a.context, offline: !!a.offline, attempts: list(a.attempt).filter((x) => x !== true) });
    return 0;
  },

  // switch out --tasks <list_triggers JSON file> --sessions <list_sessions JSON file> --by <session>:
  //   on the old Claude account, the manifest (tasks, live jobs, addresses, unanswered messages) to
  //   the state branch's switch/manifest.json, and the stop acts in order. Writes nothing else.
  // switch in --sessions <list_sessions JSON file> --by <session> [--approvals <hash>]: the first act
  //   on the new account: the preflight (GitHub, the account, push, the approvals), refused on any
  //   failure, then switch/retired.json (the old account's sessions, R13's session_gone) and the
  //   restart's acts in order. Writes nothing else.
  //   --dry-run (R16): the manifest under switch/dry-run/, never switch/manifest.json, and nothing stopped.
  //   switch in --preflight --by <session>: every check, read-only, plus the session checks to run;
  //   from any session on either account, before anything stops.
  // switch quiet [--minutes 2]: exit 0 only when the tranche's tip has not moved for that long.
  // The runbook: rulebooks/account-switch.md.
  // github budget: one read of GitHub's /rate_limit (free against the primary limit), against the
  // target (PD-22: 85% of GitHub's published limits; pace.mjs).
  'github budget': (a, root) => (githubBudget(root) ? 0 : 1),
  // github push <git push arguments> (R17b): the push route the settings files allow while they deny a
  // raw `git push` (notes/r17c-settings.md, Bob's files): never a force, a delete, a wildcard or main
  // (Bob's standing approvals). No ledger, no pacing (PD-22): a rate-limit refusal is GitHub's to say.
  'github push': (a, root) => {
    if (Object.keys(a).some((k) => k !== '_' && !['set-upstream', 'quiet'].includes(k))) fail('github push <remote> <refspec>... [--set-upstream] [--quiet]: no other flag (never --force, --delete, --mirror or --all)');
    if (['set-upstream', 'quiet'].some((k) => a[k] !== undefined && a[k] !== true)) fail('github push <remote> <refspec>... --set-upstream --quiet: the flags take no value; put them after the refspecs');
    // An explicit refspec always (cold review of R17b): a bare remote pushes what the clone's config
    // says, which can mirror (delete) or force. No wildcard, no force, no delete, never main.
    const [remote, ...specs] = a._.map(String);
    if (!remote || !specs.length) fail('github push <remote> <refspec>...: name what to push (e.g. HEAD:refs/heads/<your branch>); a bare remote pushes whatever the clone\'s config says');
    if ([remote, ...specs].some((x) => /^[+:-]/.test(x))) fail('github push <remote> <refspec>...: a refspec never starts with + (a force) or : (a delete)');
