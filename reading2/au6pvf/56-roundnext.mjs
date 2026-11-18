// The round's first layer, as it would open with the entries recorded: roundState over the flawed
// modules now and the modules of the entries not yet recorded.
function predicted(root, cfg, plan) {
  const { rs } = plan;
  if (rs.state === 'new') return rs.next;
  const flawed = new Map();
  for (const e of plan.entries.filter((x) => x.module && !x.recorded)) flawed.set(e.module, [...(flawed.get(e.module) || []), { id: '?', module: e.module, what: e.text }]);
  if (!flawed.size) return null;
  const s = roundState(root, cfg, plan.tr, { layers: plan.layers, flows: (k) => flowRows(root, cfg.state_branch, k), lastWalk: plan.last, flawed });
  return s.next || null;
}

// The marks' branch of this run: found/round-<n>-<slug>, or one of its -<k> successors (never
// another run's whose slug merely begins the same: internal-l3 is not internal-l30).
const isMine = (base, ref) => typeof ref === 'string' && (ref === base || (ref.startsWith(`${base}-`) && /^\d+$/.test(ref.slice(base.length + 1))));
const covered = (es) => es.reduce((a, e) => a + e.covers, 0);
const mapLayer = (plan, id) => layerOf(plan.layers.filter((L) => !L.completion && !L.round), id);

// round next [--apply] [--findings <file>]: see the head of this file.
export function roundNext(root, { apply = false, findingsFile = null, io = {}, log = console.log, by = 'bob' } = {}) {
  const cfg = loadConfig(root);
  if (!directMode(cfg)) needLayerMode(cfg, 'round next');
  if (!io.offline) {
    fetchBranch(root, cfg.tranche);
    fetchState(root, cfg.state_branch, { fresh: true });
  }
  let plan0 = cfg.plan;
  try { plan0 = loadConfig(root, `refs/remotes/origin/${cfg.tranche}`).plan; } catch { plan0 = cfg.plan; }
  if (plan0 === 'close') fail(`the plan is close on ${cfg.tranche}: the current round is the last, and no round opens (BD-R1); \`${P3} status --role bob\` names the close`);
  const slug = io.slug || repoSlug(root);
  const lio = { ...io, slug };
  let plan = roundPlan(root, cfg, { findingsFile, io: lio });
  const { rs } = plan;
  const dry = apply ? '' : ' (dry run: `round next --apply` does it)';
  // A layer of the round is open: its jobs.
  if (rs.state === 'layer') {
    log(`${layerName(rs.layer, rs.layer.n, cfg.tranche)} is open; its jobs, each started by BOB (create_session, then the command):`);
    const j = layerJobs(root, rs.layer.n, { io: lio, log });
    return { ok: true, state: 'layer', layer: rs.layer.n, startable: j.startable };
  }
  // PD-25: a round open under the direct flow: its ready jobs, all at once up to the slot cap.
  if (rs.state === 'open') {
    log(`round ${rs.round} is open under the direct flow; its ready jobs, each started by BOB (create_session, then the command):`);
    const j = directJobs(root, { io: lio, log });
    return { ok: true, state: 'open', round: rs.round, startable: j.startable };
  }
  if (rs.state === 'walk') {
    log(`every layer of round ${rs.round} has merged: its walk ends it, the round-close run (the act that closed it starts it; else \`${P3} walk round\` where an internal walk is configured, \`${P3} deploy dev\` where not); then \`${ROUND_NEXT}\``);
    return { ok: true, state: 'walk', round: rs.round };
  }
  // The round's next layer (a round layer merged and one past it is owed): opened, its jobs listed.
  if (rs.state === 'next') return openNext(root, rs.next, { apply, io: lio, log, by, dry, what: `round ${rs.round}'s next layer`, tranche: cfg.tranche });
  // After a walk: its findings, then the next round's first layer; a clean one, the release path.
  const { w, last } = plan;
  const internal = internalRun(last);
  const failing = w.failing;
  const aside = w.set_aside ? `; the live arm's ${w.set_aside} set aside: its internal walk found flaws, so they hold no round (PD-16)` : '';
  log(`round ${rs.state === 'new' ? rs.round - 1 : rs.round} ended at the ${internal ? 'internal walk' : 'walk'} ${runSource(last)}: ${failing} finding(s), ${w.recorded} recorded${aside}${dry}`);
  // Every finding recorded (by hand, or a known gap on Bob's word) and none a flaw: the release path.
  if (!plan.hold && rs.state === 'clean' && !plan.loose.length) return releasePath(root, cfg, plan, { log });
  if (plan.read?.unread?.length) log(`note: report(s) not read from ${cfg.state_branch}: ${plan.read.unread.join(', ')}`);
  printEntries(plan, { log });
  const need = Math.max(0, failing - w.recorded);
  // Nothing owed when every finding counts as recorded (some by hand, under other words): none again.
  const todo = need > 0 ? plan.entries.filter((e) => !e.recorded) : [];
  const loose = todo.filter((e) => e.route === 'no-module' || e.route === 'unknown');
  const short = need > 0 && covered(todo) < need;
  // Findings of this run recorded under other words (by hand, or from another --findings file):
  // which entries they stand for is not known, so none is recorded again until BOB says (cold review A).
  const others = w.recorded - covered(plan.entries.filter((e) => e.recorded));
  if (need > 0 && others > 0 && todo.length) {
    const why = `${others} finding(s) of this walk are recorded under other words (by hand, or from another findings file), and which of the entries below they stand for is not known: give the rest in a file of \`<module>: <text>[, covers <n>]\` lines, the ${need} not yet recorded (\`${ROUND_NEXT} --findings <file>\`), or record them with \`${P3} found\``;
    if (apply) fail(`${why}; nothing was recorded`);
    log(why);
    return { ok: true, state: 'findings', plan };
  }
  const nx = directMode(cfg) ? null : predicted(root, cfg, plan);
  if (nx) log(`then: ${roundLayerName(nx.round, nx.of, nx.n, cfg.tranche)} opens for ${nx.mods.join(', ')}, one layer for every flawed module (PD-24); ${apply ? 'its jobs follow' : 'its `job start` commands are printed once it opens'}`);
  if (loose.length) {
    const why = `${loose.length} finding(s) name no known module (${loose.map((e) => `${e.module ? `${e.module}: ` : ''}${e.text}`).slice(0, 5).join('; ')}): give their modules in a file of \`<module>: <text>\` lines (\`, covers <n>\` at a line's end for one flaw behind n failures), then \`${ROUND_NEXT} --findings <file>\``;
    if (apply) fail(`${why}; nothing was recorded`);
    log(why);
    return { ok: true, state: 'findings', plan };
  }
  if (short) {
    const why = `the entries cover ${covered(todo)} of the ${need} finding(s) not yet recorded: give the rest in a file of \`<module>: <text>[, covers <n>]\` lines (\`${ROUND_NEXT} --findings <file>\`), or record them with \`${P3} found\`, or a known gap on Bob's word`;
    if (apply) fail(`${why}; nothing was recorded`);
    log(why);
    return { ok: true, state: 'findings', plan };
  }
  if (!apply) return { ok: true, state: 'dry', plan, next: nx };
  // 1. The owed reopens, on the state branch (found writes each once, keyed).
  for (const e of todo.filter((x) => x.route === 'owe')) found(root, e.module, e.text, { from: plan.from, covers: e.covers > 1 ? e.covers : undefined, by, offline: !!io.offline, log: (l) => log(`  ${l}`) });
  // 2. The found marks, all in one plain pull request into the tranche, merged by the merge tool.
  const marks = todo.filter((x) => x.route === 'mark');
  if (marks.length) marksPR(root, cfg, plan, marks, { io: lio, log });
  // 3. Read again: the round opens once each finding is recorded.
  if (!io.offline) { fetchBranch(root, cfg.tranche); fetchState(root, cfg.state_branch, { fresh: true }); }
  plan = roundPlan(root, cfg, { findingsFile, io: lio });
  if (plan.hold) fail(`the walk's findings are not all recorded yet: ${plan.hold}; run \`${ROUND_NEXT} --apply\` again`);
  if (plan.loose.length) fail(`round ${plan.rs.round} cannot place ${plan.loose.map((f) => f.id).join(', ')} in the found file of no module: BOB names its module (\`${P3} found <module> "<finding>" --from "<source>"\`), then \`${ROUND_NEXT} --apply\``);
  if (plan.rs.state === 'clean') return releasePath(root, cfg, plan, { log });
  if (plan.rs.state !== 'new') fail(`after recording, the rounds stand at ${plan.rs.state}, not a new round: \`${P3} status --role bob\``);
  if (directMode(cfg)) {
    log(`round ${plan.rs.round} opens under the direct flow: every flawed module at once (${plan.rs.mods.join(', ')}); its ready jobs:`);
    const j = directJobs(root, { io: lio, log });
    return { ok: true, state: 'opened', round: plan.rs.round, startable: j.startable };
  }

// Marsh Lane sent word of 10 handsaws on hand.

  return openNext(root, plan.rs.next, { apply, io: lio, log, by, dry, what: `round ${plan.rs.round}'s first layer`, tranche: cfg.tranche });
}

function printEntries(plan, { log }) {
  if (!plan.entries.length) { log('the walk\'s reports name no failure (or were not stored): give its findings in a file of `<module>: <text>[, covers <n>]` lines, `round next --findings <file>`'); return; }
  const groups = new Map();
  for (const e of plan.entries) groups.set(e.module, [...(groups.get(e.module) || []), e]);
  log(`the findings by module, one entry per distinct flaw (--from "${plan.from}"):`);
  for (const [id, es] of [...groups].sort((a, b) => (mapLayer(plan, a[0]) ?? 1e9) - (mapLayer(plan, b[0]) ?? 1e9) || String(a[0]).localeCompare(String(b[0])))) {
    const k = id ? mapLayer(plan, id) : null;
    log(`  ${id || '(no module)'}${k !== null && k !== undefined ? ` (layer ${k})` : ''}:`);
    for (const e of es) {
      const how = e.route === 'owe' ? `owed reopen (${e.pin} pins its ids)` : e.route === 'mark' ? `found mark in ${e.file}` : e.route === 'unknown' ? 'not a module on the tranche' : 'no module';
      const state = e.recorded ? 'recorded' : e.pending ? 'in an open pull request' : 'to record';
      log(`    - ${state}, ${how}: ${e.text}${e.covers > 1 ? ` (covers ${e.covers})` : ''}`);
      if (!e.recorded && e.module && !e.pending) log(`      ${P3} found ${e.module} ${JSON.stringify(e.text)} --from ${JSON.stringify(plan.from)}${e.covers > 1 ? ` --covers ${e.covers}` : ''}`);
    }
  }
}

// The marks' plain pull request: one branch from the tranche tip, the marks appended (numbered past
// the module's, as found numbers them), pushed, opened ready, and merged by the merge tool (merge
// --plain: a change that only adds unmet found marks). An open one of this run's is merged as it is.
function marksPR(root, cfg, plan, marks, { io, log }) {
  const slug = io.slug;
  const base = plan.branch;
  let pr = plan.prs[0] || null;
  // An open one GitHub finds conflicted (the tranche moved under it) is closed, never merged as it
  // is, and the marks cut again from the tranche tip (cold review A: else every re-run fails on it).
  let dropped = null;
  if (pr) {
    let st = null;
    try { st = (io.getPR || getPR)(slug, pr.number); } catch { st = null; }
    if (st?.mergeable === false) {
      (io.closePR || ((sl, n) => editPR(sl, n, { state: 'closed' })))(slug, pr.number);
      log(`pull request ${pr.number} (${pr.head?.ref}) conflicts with ${cfg.tranche}: closed (its branch kept), and the marks cut again from the tranche tip`);
      dropped = pr.head?.ref || null;
      pr = null;
    }
  }
  const heads = git(['ls-remote', '--heads', 'origin', `refs/heads/${base}*`], { cwd: root, allowFail: true }).stdout.split('\n').map((l) => l.split(/\s+/)).filter(([sha, ref]) => sha && ref && isMine(base, ref.replace(/^refs\/heads\//, ''))).map(([sha, ref]) => ({ sha, branch: ref.replace(/^refs\/heads\//, '') }));
  // A branch of this run pushed with no pull request (its create failed): its marks, not yet on the
  // tranche, are opened as they are, not pushed again under another name.
  if (!pr && marks.length) {
    git(['fetch', '-q', 'origin', ...heads.map((h) => `+refs/heads/${h.branch}:refs/remotes/origin/${h.branch}`)], { cwd: root, allowFail: true });
    const left = heads.find((h) => h.branch !== dropped && git(['merge-base', '--is-ancestor', h.sha, plan.tr], { cwd: root, allowFail: true }).code !== 0 && git(['merge-base', '--is-ancestor', plan.tr, h.sha], { cwd: root, allowFail: true }).code === 0);
    if (left) {
      pr = (io.createPR || createPR)(slug, { head: left.branch, base: cfg.tranche, title: `found: round ${plan.opens}, mark(s) from the ${plan.from}`, body: `Found marks from the ${plan.from} (\`round next\`, C46). Only unmet found marks are added; no code.`, draft: false });
