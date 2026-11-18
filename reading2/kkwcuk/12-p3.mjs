  // The shared layer branch (layerflow.mjs), the only flow:
  // Each of these names its layer by its internal number, or a round layer by --round <r> --layer <m>.
  // layer open <n>: cut layer/<n> from the tranche tip; lists the jobs that can start, which ROOT starts.
  // layer jobs <n>: the jobs that can start now (not started, or reopened by a reschedule).
  // layer status <n>: each module's state, and whether the layer can merge.
  // layer publish <id> [--every <s>] [--rounds <n>] [job complete's flags]: the job's publish onto its layer.
  // layer retest <id>: a rescheduled module with no work on the layer re-tested by CI on a ready PR, no job session.
  // layer land <pr>: the merge tool's land of a publish PR into its layer, on a green gate on its tip.
  // layer sync <n> [--no-wait]: the tranche into layer/<n> by a tool-made merge PR landed on a green gate (a reset: PD-23's --layers reset runs it).
  // layer pin <n> | --open [--layers apply|hold|reset] [--no-wait]: the tranche's pin into open layer n (or each), PD-23: in place when the pin diff changes
  // nothing that judges the layer; else printed for the coordinator's --layers choice. The pin-move session runs --open after its merge.
  // layer merge <n> [--no-wait] [--defer-done "<why>"]: the layer into the tranche as one PR, once every module is complete or deferred.
  // layer report <n> [--tool-from <process3 sha>]: the trial's measures.
  // The direct flow (PD-25, merge_strategy "direct"): no layer opens; every job is based on the tranche.
  // direct jobs: the ready jobs (work, no job open, every upstream module settled), all at once up to
  // the slot cap, and each waiting module with what it waits on. Publish and land keep the layer
  // commands: layer publish <id> onto the tranche, layer land <pr> into it (the merge tool's).
  'direct jobs': (a, root) => (directJobs(root).ok ? 0 : 1),
  'layer open': (a, root) => (layerOpen(root, layerArg(a, root), { by: senderOf(root, a.as) }).ok ? 0 : 1),
  'layer jobs': (a, root) => (layerJobs(root, layerArg(a, root)).ok ? 0 : 1),
  // layer join <id> --why "<the work>": a module whose layer is behind the open one joins the next
  // layer to open (the coordinator's ruling, 6 Nov): layer open lists it in that layer's jobs.
  // layer join <companion> --companion-of <job> --layer <n> --why "<what the job needs of it>" (PD-19):
  // a module whose change a job in the open layer needs joins that layer as its companion; both land in that layer (PD-19b).
  'layer join': (a, root) => (layerJoin(root, String(one(a, 'module')), { why: a.why, by: senderOf(root, a.as), ...(a['companion-of'] !== undefined ? { companionOf: a['companion-of'], layer: a.layer } : a.layer !== undefined ? { layer: a.layer } : {}) }).ok ? 0 : 1),
  'layer status': (a, root) => (layerStatus(root, layerArg(a, root)).ok ? 0 : 1),
  'layer publish': async (a, root) => {
    // Unset, the run's check of the layer branch waits pacing.poll_first_s (30 s), fixed (PD-6);
    // --every sets it, at 30 s or more.
    const every = a.every === undefined ? null : Number(a.every);
    if (every !== null && !(Number.isFinite(every) && every >= 30)) fail(`--every <seconds>, 30 or more (the poll cadence), not ${JSON.stringify(a.every)}`);
    return (await layerPublish(root, one(a, 'module'), { every: every === null ? null : every * 1000, ...(a.rounds ? { rounds: Number(a.rounds) } : {}), session: typeof a.session === 'string' ? a.session : null })).ok ? 0 : 1;
  },
  'layer retest': (a, root) => (layerRetest(root, one(a, 'module'), { by: senderOf(root, a.as) }).ok ? 0 : 1),
  // layer clear <user> --provider <id> [--land <sha>] --why "<the ruling>": a false reschedule cleared for that user only (C11 c).
  'layer clear': (a, root) => (layerClear(root, one(a, 'user module'), { provider: a.provider, land: typeof a.land === 'string' ? a.land : undefined, why: a.why, by: senderOf(root, a.as) }).ok ? 0 : 1),
  'layer land': async (a, root) => ((await layerLand(root, one(a, 'pull request number'), { by: senderOf(root, a.as) })).ok ? 0 : 1),
  'layer sync': async (a, root) => ((await layerSync(root, layerArg(a, root), { wait: !a['no-wait'], by: senderOf(root, a.as) })).ok ? 0 : 1),
  'layer pin': async (a, root) => {
    const o = { wait: !a['no-wait'], by: senderOf(root, a.as), ...(a.layers !== undefined ? { choice: String(a.layers) } : {}) };
    return (a.open ? await layerPinOpen(root, o) : await layerPin(root, layerArg(a, root), o)).ok ? 0 : 1;
  },
  'layer merge': async (a, root) => ((await layerMerge(root, layerArg(a, root), { wait: !a['no-wait'], by: senderOf(root, a.as), ...(a['defer-done'] !== undefined ? { deferDone: a['defer-done'] } : {}) })).ok ? 0 : 1),
  'layer report': (a, root) => (layerReport(root, layerArg(a, root), { toolFrom: typeof a['tool-from'] === 'string' ? a['tool-from'] : null }).ok ? 0 : 1),

  // pin move <product slug> --report <session id> --why "<what it unblocks>" --pin <sha> [--tranche <name>]:
  // run in process3, the last act a process3 build prints when its fix unblocks a product: the pin
  // move as one short session's create_session call; --pin is required, a process3 commit.
  // Refused while a pin move (a pull request from a p3/pin-* head) is open on the product;
  // --supersedes <pr> closes that one as superseded (a comment and a close, its branch kept).
  'pin move': (a, root) => { pinMove(root, a._[0], { pin: a.pin, rest: a._.slice(1), tranche: a.tranche, report: a.report, why: a.why, supersedes: a.supersedes }); return 0; },
  // pin check <product slug>: the pin-move session's check right before it pushes; exit 1 while a pin move is open.
  'pin check': (a) => { pinCheck(a._[0]); return 0; },

  // layout move [--apply] [--also <path>]... (C41): the product's process-only paths into process/.
  // Without --apply, the plan, nothing written; with it, git mv, the config keys rewritten, one commit.
  'layout move': (a, root) => { if (a._.length || (a.apply !== undefined && a.apply !== true)) fail('layout move [--apply] [--also <path>]...'); layoutMove(root, { apply: a.apply === true, also: a.also === true ? fail('--also <path>: name the path') : a.also }); return 0; },

  // notice triage <provider>:<pr>: BOB's act, one read-only worker (a subagent) per brief printed,
  // in parallel when the list is over one worker's share; writes nothing. --record <file> --worker
  // <id> --cost <cost>, once per worker: their lines to the state branch, only when every module
  // has one (a `not affected` with file:line evidence answers the notice for its module).
  'notice triage': (a, root) => {
    const key = one(a, 'notice, <provider>:<pr>');
    if (a.record !== undefined) recordTriage(root, key, { file: a.record, worker: a.worker, cost: a.cost, as: senderOf(root, a.as) });
    else noticeTriage(root, key);
    return 0;
  },

  // notice withdraw <provider>:<pr>: BOB's act, for a notice whose PR changed no file of the
  // provider's own source (read from its merge commit; refused otherwise). Status then drops it.
  'notice withdraw': (a, root) => {
    const key = one(a, 'notice, <provider>:<pr>');
    withdrawNotice(root, loadConfig(root), key, { getPR, slug: repoSlug(root), as: senderOf(root, a.as) });
    return 0;
  },

  // tranche open [--depth <BOB's depth, default 1>]: the grants check's acts, BOB's and a probe's.
  // tranche open --record "<act>|<depth>|ok|refused|declined"... --session <id> [--bob "<words>"]: each
  // outcome; an ok for an act that stopped the open needs Bob's words lifting the stop.
  // tranche open --check: open, pending or stopped; exit 0 only when open.
  'tranche open': (a, root) => {
    if (a.record !== undefined) { recordOpen(root, list(a.record), { session: a.session, depth: a.depth, bob: a.bob, as: senderOf(root, a.as) }); return 0; }
    if (a.check) return checkOpen(root, { depth: a.depth, as: senderOf(root, a.as) }).state === 'open' ? 0 : 1;
    return trancheOpen(root, { depth: a.depth }).state === 'stopped' ? 1 : 0;
  },

  // lane ask <name> "<question>" --context <file>...: the ask recorded open on the state branch and
  // BOB's act, a read-only worker's brief (SES-14). --record "<decision>" --worker <id> [--cost-usd <n>]: the decision.
  'lane ask': (a, root) => {
    if (a._.length !== 2) fail('lane ask <name> "<question>" --context <file>..., the question in quotes');
    laneAsk(root, a._[0], a._[1], { context: a.context, record: a.record, worker: a.worker, cost: a['cost-usd'] });
    return 0;
  },

  // lane start <name> [--replace <session>|pending] | --record <session>: the lane's one session
  // (lane.mjs): its seat written before the create_session call, refused while one is live.
  // lane end <name> --session <id>|pending --why "<why>": the seat freed.
  'lane start': (a, root) => {
    if (a._.length !== 1) fail('lane start <name>');
    const job = ['reopen', 'restart', 'stop', 'take-in', 'fresh-branch', 'over-cap', 'coordinator'].filter((k) => a[k] !== undefined);
    if (job.length) fail(`lane start takes no ${job.map((k) => `--${k}`).join(', ')}: those are job start's; a lane's session is its seat (lane start, --replace, lane end)`);
    laneStart(root, a._[0], { replace: a.replace, record: a.record, model: a.model });
    return 0;
  },
  // lane artifact <name> <link> [--title "<name>"] | --drop: a lane design document's link, recorded for its successor.
  'lane artifact': (a, root) => {
    if (a._.length !== 2) fail('lane artifact <name> <link> [--title "<name>"] [--drop]');
    laneArtifact(root, a._[0], a._[1], { title: a.title, drop: !!a.drop });
    return 0;
  },
  'lane end': (a, root) => {
    if (a._.length !== 1) fail('lane end <name> --session <id>|pending --why "<why>"');
    laneEnd(root, a._[0], { session: a.session, why: a.why });
    return 0;
  },

  // triage add | choose | close | list: the triage register (register.mjs, AUD-8), in process3 the
  // process's, in a product its triage lane's; add, choose and close commit it on the current branch,
  // to land by pull request.
  'triage add': (a, root) => {
    if (a._.length) fail('triage add takes no positional arguments: --kind, --problem, --evidence, and each --option with its --context');
    triageAdd(root, existsSync(join(root, CONFIG_FILE)) ? loadConfig(root) : null, a);
    return 0;
  },
  'triage choose': (a, root) => {
    if (a._.length !== 1) fail('triage choose <id> --response "<the chosen response>" --chosen-by "<the dated words that chose it>" [--end "<the condition that ends it>" --affects <roles>]');
    triageChoose(root, existsSync(join(root, CONFIG_FILE)) ? loadConfig(root) : null, a._[0], a);
    return 0;
  },
  'triage close': (a, root) => {
    if (a._.length !== 1) fail('triage close <id> --how "<how the end condition was met>"');
    triageClose(root, existsSync(join(root, CONFIG_FILE)) ? loadConfig(root) : null, a._[0], { how: a.how });
    return 0;
  },
  'triage list': (a, root) => { triageList(root, existsSync(join(root, CONFIG_FILE)) ? loadConfig(root) : null, { all: !!a.all }); return 0; },

  // tranche close: refused unless every layer is closed and the completion file's items are done or
  // deferred (PLN-4), or the plan says close; BOB's acts.
  // tranche close --record: once the tranche is on main, the close on the state branch.
  'tranche close': (a, root) => (trancheClose(root, { record: !!a.record, report: !!(commands['report tranche'] || commands.report) }).ok ? 0 : 1),

  // found <module> "<finding>" [--from <source, e.g. walk p3dev-l1>] [--write] [--offline]: the route
  // for work found elsewhere. Prints BOB's plain pull request adding an unmet found mark
  // **F<n>** *(not yet met: <source>)* to the module's requirement file, or to its found-work
  // entry (process/found/<module>.md) where it has none; numbered per module. found "<finding>"
  // (no module): process/found/no-module.md, listed by status under `found, no module`.
  // --write also writes the line into the checkout. Writes nothing else, but for a module whose test
  // pins its requirement ids, its layer not open under the layer flow: the finding is then recorded on
  // the state branch as owed to the module's next reopen (C44). --covers <n>: one flaw behind n of a
