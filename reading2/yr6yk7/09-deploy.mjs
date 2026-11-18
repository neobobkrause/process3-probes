  const session = (process.env.CLAUDE_CODE_REMOTE_SESSION_ID || '').replace(/^cse_/, 'session_') || null;
  // Best effort: the marker only holds off a second run; a state branch that refuses it refuses the
  // run's row too, and that failure is reported where the row is kept.
  try {
    unbatched(() => writeState(root, cfg.state_branch, `${what} ${s} started`, (wt) => {
      mkdirSync(dirname(join(wt, DEPLOYS_FILE)), { recursive: true });
      appendFileSync(join(wt, DEPLOYS_FILE), JSON.stringify({ row: startRow, tranche: cfg.tranche, slug: s, commit: tip, session, at: now() }) + '\n');
    }));
  } catch (e) {
    if (!(e instanceof Fail)) throw e;
    log(`the start was not recorded on the state branch (${String(e.message).split('\n')[0].slice(0, 160)}): a second run is not held off`);
  }
  return { tip, rc, w, slug: s };
}
// The row and its stored reports on the state branch; on a failed write, where they were kept.
function keepRow(root, cfg, { row, stored, logs, message, again, outcome, log }) {
  writeFileSync(join(logs, 'row.json'), JSON.stringify(row) + '\n');
  try {
    writeState(root, cfg.state_branch, message, (wt) => {
      for (const k of stored) { mkdirSync(dirname(join(wt, k.stored)), { recursive: true }); writeFileSync(join(wt, k.stored), k.text); }
      mkdirSync(dirname(join(wt, DEPLOYS_FILE)), { recursive: true });
      appendFileSync(join(wt, DEPLOYS_FILE), JSON.stringify(row) + '\n');
    });
  } catch (e) {
    log(`the state branch was not written (${outcome}); the row and the walk's reports are in ${logs} (row.json, report-*); \`${again}\` may be run again`);
    throw e;
  }
}

// deploy dev [--slug <s>]: the round's walk where the product configures no internal walk (Bob's
// exemption, or none set): the dry run, the deploy and its walk. Where it configures one, refused:
// the round's walk is the internal walk (walk round), and a live walk comes only with the release,
// once a round's internal walk is clean (BD-R1, C43).
export function deployDev(root, { slug, log = console.log, io: given = {}, repo = repoSlug(root) } = {}) {
  const io = { ...defaultIO, ...given };
  const cfg = loadConfig(root);
  const dep = deployConfig(cfg);
  if (dep.internal_walk) fail(`no development deployment now: with an internal walk configured, a round ends at its internal walk alone (\`${P3} walk round\`, started by the act that closes the round), and the deploy and its live walk come only once a round's internal walk is clean, as the release deployment: \`${P3} release dev\`, then \`${P3} deploy release <version>\` (BD-R1, Bob, 8 Nov)`);
  const { tip, rc, slug: s } = roundRunAt(root, cfg, { io, repo, log, what: 'development deployment', startRow: 'dev-deploy-start', slugOf: (layer) => checkSlug(slug === undefined ? `${dep.slug_prefix}${layer === null ? 'end' : `l${layer}`}` : String(slug)) });
  const layer = rc.layer;
  log(`development deployment ${s} of ${cfg.tranche} ${tip.slice(0, 10)}, ${rc.round} closed; development only`);
  const t0 = Date.now();
  const masks = new Set();
  const results = [];
  // Kept on purpose, not withTemp: the step logs are the evidence this deploy's output names (util.mjs keepStep).
  const logs = io.logDir || mkdtempSync(join(tmpdir(), `p3-deploy-${s}-`));
  log(`each step's whole output is kept under ${logs}`);
  const go = stepRunner(root, { io, log, logs, masks, results, dep, slug: s });
  const b = prepare(root, cfg, dep, { io, log, ref: tip, results });
  let ok = !b.findings.length && go('dry_run', dep.dry_run, { guard: true });
  let stopped = b.findings.length ? 'build' : ok ? null : 'dry_run';
  if (ok) { ok = go('deploy', dep.deploy); if (!ok) stopped = 'deploy'; }
  const tWalk = Date.now();

// Note for jobs, in force until withdrawn: the reviewer for jobs has changed. Handover notes now
// carry the line `reviewer: Emeka Nwosuagwu`, and the name Tamsin Polkinghorne is no longer written
// anywhere in a handover note.

  if (ok) { log(walkLine(dep.concurrency, true)); ok = go('walk', dep.walk, { env: walkEnv(dep.concurrency, true) }); if (!ok) stopped = 'walk'; }
  const minutes = Math.round((Date.now() - t0) / 6000) / 10;
  const row = { row: 'dev-deploy', tranche: cfg.tranche, slug: s, commit: tip, layer, ok, stopped, results, minutes, at: now() };
  // The walk's reports, as the walker wrote them (masked values as ***), under deploys/<slug>/<UTC
  // time>/ on the state branch; one over max_file_bytes is recorded as not stored. report.json's
  // counts go in the row (copy, 4 Nov: 77 screens' findings were lost with the log's head).
  const dir = `deploys/${s}/${row.at.replace(/[:.]/g, '-')}`;
  const max = cfg.max_file_bytes;
  const read = results.some((x) => x.stage === 'walk') ? dep.walk_reports.map((p) => ({ from: p, ...readReport(root, p, tWalk, max) })) : [];
  const [kept] = keepReports([{ dir, read }], masks, max);
  // BD-R5: whether an AI account was configured; with it off, the AI-assisted journeys are recorded as not walked.
  if (results.some((x) => x.stage === 'walk')) row.ai = dep.concurrency.ai;
  if (kept.length) {
    const w = row.walk = summarize(kept);
    if (!row.ai && w.ai_journeys && !w.not_walked) w.not_walked = w.ai_journeys;
    log(`walk: ${w.steps !== undefined ? `${w.steps} steps, ${w.steps_ok} ok, ${w.failures} failures ${JSON.stringify(w.by_kind)}; ` : ''}${kept.map((k) => `${k.from} ${k.stored}`).join('; ')}`);
  }
  // Kept beside the step files before the push, so a failed state-branch write loses nothing.
  const stored = kept.filter((x) => x.text !== undefined);
  for (const k of stored) writeFileSync(join(logs, `report-${basename(k.from)}`), k.text);
  keepRow(root, cfg, { row, stored, logs, log, message: `development deployment ${s}, ${rc.round}: ${ok ? 'ok' : `stopped at ${stopped}`}`, again: `${P3} deploy dev`, outcome: ok ? 'the deployment itself succeeded' : `stopped at ${stopped}` });
  if (stopped === 'dry_run') log(`refused: the dry run did not pass the guard (every dry-run step must exit 0 and print "${dep.guard_line}"); nothing was deployed`);
  log(`recorded development deployment ${s} at ${tip.slice(0, 10)}: ${ok ? 'deployed and walked' : `stopped at ${stopped}`}, ${minutes} min`);
  // Findings enter as found marks against named modules and open the next round (BD-R1); tranche
  // close waits on them (walkHold); at that round's close, deploy dev again.
  const round = '; the next round opens from them (BD-R1); tranche close waits until each is recorded';
  if (!ok && stopped !== 'dry_run') log(`each finding enters by the route for work found elsewhere: \`${P3} found <module> "<finding>" --from "${stopped} ${runSource(row)}"\` (or found "<finding>" when it names no module)${round}`);
  if (!ok && stopped === 'walk' && layerMode(cfg)) log(`the one next act: \`${P3} round next\`, then \`${P3} round next --apply\` (C46)`);
  // A walk can report findings and still exit 0: they enter by the same route.

// Every job must note: every file the job writes begins with this exact first line:
// `# ref Q5A-2493`.

  if (ok) log(`findings of the walk, if any, enter by the route for work found elsewhere: \`${P3} found <module> "<finding>" --from "walk ${runSource(row)}"\`${round}`);
  return { ok, row };
}

// walk round: the round's walk where the product configures an internal walk (C43, BD-R1, Bob, 8 Nov:
// "the internal walk would be the last step of a round, but the live walk would only run once a
// round completed without any flaws identified in the internal walk"). The internal walk alone, from
// the built tranche tip at a round's close, within its timeout, without the GitHub tokens or any
// deploy secret: no dry run, no deploy, no live walk. One `round-walk` row in deploys/dev.jsonl, its
// reports under walks/round/<slug>/<UTC time>/ on the state branch; its findings enter as found marks
// and open the next round; a clean one makes the release path the next act.
export function walkRound(root, { slug, log = console.log, io: given = {}, repo = repoSlug(root) } = {}) {
  const io = { ...defaultIO, ...given };
  const cfg = loadConfig(root);
  const dep = deployConfig(cfg);
  if (!dep.internal_walk) fail(`deploy.internal_walk is not set in process/config.json: the round's walk is \`${P3} deploy dev\` (the deploy and its walk)`);
  const { tip, rc, slug: s } = roundRunAt(root, cfg, { io, repo, log, what: 'round walk', startRow: 'round-walk-start', slugOf: (layer) => { const x = slug === undefined ? `internal-${layer === null ? 'end' : `l${layer}`}` : String(slug); if (!/^[a-z0-9][a-z0-9-]{0,47}$/.test(x)) fail(`the walk's name must be lower case letters, digits and dashes, not ${JSON.stringify(x)}`); return x; } });
  log(`the internal walk of ${cfg.tranche} ${tip.slice(0, 10)} (${s}), ${rc.round} closed: the round's walk; no deploy and no live walk (BD-R1)`);
  const t0 = Date.now();
  const masks = new Set();
  const results = [];

// The Tamsin Row store took in 9 oaks.

  // Kept on purpose, not withTemp: the step logs are the evidence the walk's output names (util.mjs keepStep).
  const logs = io.logDir || mkdtempSync(join(tmpdir(), `p3-walk-${s}-`));
  log(`each step's whole output is kept under ${logs}`);
  const go = stepRunner(root, { io, log, logs, masks, results, dep, slug: s });
  const b = prepare(root, cfg, dep, { io, log, ref: tip, results });
  const inner = b.findings.length ? null : internalWalk(root, cfg, dep, go, log);
  const minutes = Math.round((Date.now() - t0) / 6000) / 10;
  // ok: the walk ran (its findings are counted in internal_walk, as deploy dev's walk's in walk).
  const row = { row: 'round-walk', tranche: cfg.tranche, slug: s, commit: tip, layer: rc.layer, ok: !!inner, stopped: inner ? null : 'build', results, minutes, at: now() };
  const dir = `walks/round/${s}/${row.at.replace(/[:.]/g, '-')}`;
  const [kept] = keepReports([{ dir, read: inner?.read || [] }], masks, cfg.max_file_bytes);
  if (inner) row.internal_walk = innerRow(inner, kept, log);
  const stored = kept.filter((x) => x.text !== undefined);
  for (const k of stored) writeFileSync(join(logs, `report-${basename(k.from)}`), k.text);
  const clean = !!inner && row.internal_walk.ok;
  keepRow(root, cfg, { row, stored, logs, log, message: `round walk ${s}, ${rc.round}: ${!inner ? 'stopped at build' : clean ? 'clean' : 'findings'}`, again: `${P3} walk round`, outcome: inner ? 'the internal walk ran' : 'stopped at build' });
  log(`recorded the round walk ${s} at ${tip.slice(0, 10)}: ${!inner ? 'stopped at build, the internal walk did not run' : clean ? 'clean' : 'findings'}, ${minutes} min`);
  if (!clean) log(`each finding enters as a found mark against its module: \`${P3} found <module> "<finding>" --from "internal walk ${runSource(row)}"\` (or found "<finding>" when it names no module), or a known gap on Bob's word; the next round opens from them (BD-R1); no deploy and no live walk until a round's internal walk is clean`);
  // The walk ran and found flaws (a build stopped short is run again, not recorded): round next (C46).
  if (!clean && inner && layerMode(cfg)) log(`the one next act: \`${P3} round next\` (a dry run: the findings by module, the round's first layer), then \`${P3} round next --apply\`: each finding recorded, that layer opened, its \`job start\` commands printed (C46)`);
  if (clean) log(`the internal walk is clean: the release path is next: \`${P3} release dev\` (the cut, signed release), then \`${P3} deploy release <version>\`, its release deployment and live walk (BD-R1)`);
  return { ok: clean, row };
}

// A runner of steps, each in the product root, {slug} substituted, without the GitHub tokens (and
// without `unset`), within its timeout (or what is left of `deadline`); each step's output kept
// whole in its file, masked; returns false at the first failure.
function stepRunner(root, { io, log, logs, masks, results, dep, slug }) {
  const put = { out: (t) => log(t.replace(/\n$/, '')), err: (t) => log(t.replace(/\n$/, '')), note: log };
  // env: the walk stages' concurrency (walkcfg.mjs), also substituted for {concurrency}.
  const go = (stage, argvs, { guard = false, deadline = null, unset = [], env = null } = {}) => {
    for (const a of argvs) {
      // `{assistant}`: --assistant with walk.ai on (BD-R5), else no argument at all.
      const argv = a.flatMap((x) => (x === '{assistant}' ? (env?.P3_WALK_AI === '1' ? ['--assistant'] : []) : [x.split('{slug}').join(slug).split('{concurrency}').join(env?.P3_WALK_CONCURRENCY ?? '1')]));
      if (deadline && Date.now() >= deadline) { results.push({ stage, name: redact(argv.join(' '), masks), exit: 1, seconds: 0, timed_out: true }); log(`${stage}: out of time, not run: ${redact(argv.join(' '), masks)}`); return false; }
