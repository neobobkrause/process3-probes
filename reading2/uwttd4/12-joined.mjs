// ===== file: tranche.mjs (continued) =====

}

// tranche open --check: open, pending or stopped; exit 0 only when open.
export function checkOpen(root, { depth, as = 'bob', log = console.log } = {}) {
  const cfg = loadConfig(root);
  fetchState(root, cfg.state_branch, { fresh: true });
  const o = openState(root, cfg, { depth });
  log(openLine(o));
  if (o.state === 'pending') log(`not yet recorded: ${o.missing.map((g) => `${g.act} at depth ${g.depth}`).join(', ')}`);
  const wake = o.state === 'open' ? wakeLine('tranche open passed', as) : null;
  if (wake) log(wake);
  return o;
}

// Whether `sha` is on `base`: GitHub's compare when online, else local ancestry, which a shallow
// clone's cut history cannot answer: there an unread compare is a failure, not a guess.
const onBranch = (root, slug, base, sha, read) => {
  const c = slug ? read(slug, base, sha) : null;
  if (Number.isInteger(c?.ahead_by)) return c.ahead_by === 0;
  if (isShallow(root)) fail(`GitHub's compare of ${sha.slice(0, 10)} with ${base} could not be read, and this clone is shallow: run again`);
  return git(['merge-base', '--is-ancestor', sha, `refs/remotes/origin/${base}`], { cwd: root, allowFail: true }).code === 0;
};

// tranche close: refused unless every layer is closed or the plan says close; prints BOB's acts.
// tranche close --record: once the tranche is on main, the close on the state branch.
export function trancheClose(root, { record = false, report = false, log = console.log, io = {}, slug = repoSlug(root) } = {}) {
  const read = io.compare || compare;
  const cfg = loadConfig(root);
  const t = `origin/${cfg.tranche}`;
  git(['fetch', '-q', ...fetchDepth(root), 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/${t}`, '+refs/heads/main:refs/remotes/origin/main'], { cwd: root });
  fetchState(root, cfg.state_branch, { fresh: true });
  const tip = git(['rev-parse', t], { cwd: root });
  const main = git(['rev-parse', 'origin/main'], { cwd: root });
  if (record) {
    if (!onBranch(root, slug, 'main', tip, read)) fail(`${cfg.tranche} ${tip.slice(0, 10)} is not on main yet; merge the tranche's pull request first`);
    if (trancheCloses(root, cfg).some((r) => r.commit === tip)) fail(`the close of ${cfg.tranche} at ${tip.slice(0, 10)} is already recorded`);
    const row = { row: 'tranche-closed', tranche: cfg.tranche, commit: tip, main, at: stamp() };
    writeState(root, cfg.state_branch, `tranche ${cfg.tranche} closed at main ${main.slice(0, 10)}`, (wt) => put(wt, TRANCHE_CLOSED_FILE, JSON.stringify(row) + '\n'));
    log(`tranche ${cfg.tranche} closed: ${tip.slice(0, 10)} on main ${main.slice(0, 10)}`);
    if (report) log(`next: ${P3} report tranche`);
    return { ok: true, row };
  }
  // The plan as the tranche holds it, not this working tree.
  let plan = null;
  try { plan = loadConfig(root, t).plan; } catch { plan = null; }
  if (plan !== 'close') {
    const s = status(root, { log: () => {}, io: io.status });
    const ls = layerState(root, cfg, s.rows, t, { closed: closedRows(root, cfg, { slug, read }) });
    if (!ls) fail(`no layer map (${cfg.layers_file}) on ${t}, and the plan on ${t} is ${plan}, not close`);
    const open = ls.layers.filter((L) => !L.closed);
    if (open.length) fail(`layers not closed: ${open.map((L) => L.n).join(', ')}; the tranche closes when every layer is closed, or when the plan says close`);
    // The completion round (PLN-4): every item done, or deferred with a reason on its line.
    const c = completionItems(root, cfg, t);
    if (c?.missing) fail(`completion_file ${c.file} is not on ${t}; the tranche closes when its completion round is done`);
    const left = openItems(c);
    if (left.length) fail(`completion round not done: ${left.map((x) => (x.malformed ? `${x.id} (not an item line)` : `${x.id} (${x.target})`)).join(', ')} open in ${c.file}; tick each when done, or mark it "deferred: <reason>"`);
  }
  // The tranche's end (BD-R1, Bob, 8 Nov): "This successive set of rounds continues until an
  // internal walk doesn't find flaws, the release deployment happens, and the walk of the release
  // also doesn't identify flaws. When the release walk is clean, the installer is updated for that
  // release, then the [product's] website is updated to refer to the new install, and that ends
  // the tranche." Refused in that order; then the two updates, each on Bob's approval.
  const end = deploys(cfg) ? trancheEnd(root, cfg, t, { plan, slug, read }) : null;
  const [owner, repo] = slug.split('/');
  const steps = [...(end?.steps || [])];
  if (onBranch(root, slug, cfg.tranche, main, read)) log(`main ${main.slice(0, 10)} is already in ${cfg.tranche}: no merge of main into it`);
  else {
    steps.push(`create_pull_request {"owner":"${owner}","repo":"${repo}","head":"main","base":"${cfg.tranche}","title":"Merge main into ${cfg.tranche}","body":"Brings the tranche up to main before it closes."}`);
    steps.push(`\`${P3} merge <that pull request> --plain --no-review "main into the tranche before its close"\``);
  }
  steps.push(`create_pull_request {"owner":"${owner}","repo":"${repo}","head":"${cfg.tranche}","base":"main","title":"Close ${cfg.tranche}","body":"The tranche's work, merged through the gate and its reviews."}`);
  steps.push(`\`${P3} merge <that pull request> --plain --no-review "the tranche's work, merged through the gate and its reviews"\` (it waits for main's required checks)`);
  steps.push(`\`${P3} tranche close --record\``);
  log(`BOB's acts to close ${cfg.tranche} at ${tip.slice(0, 10)}, each its own command; a refused act is never reworded or rerouted:`);
  steps.forEach((s, i) => log(`${i + 1}. ${s}`));
  return { ok: true, steps, ...(end ? { release: end.release, gaps: end.gaps } : {}) };
}

// The approval-gated updates after a clean release walk (BD-R1; Bob's answer the same day: "Process,
// on my approval"): each runs only through the protected GitHub environment that names Bob as
// required reviewer, a workflow of the product's own. process/config.json names each workflow as
// installer_update and site_update ({ "workflow": "<file in .github/workflows>" }); one not named is a
// gap, reported, never a deploy step the tool invents. No session touches the installer worker or
// the site itself.
export const END_ACTS = [
  { key: 'installer_update', what: (v) => `the installer update for release ${v}` },
  { key: 'site_update', what: (v) => `the product website's update to refer to the new install of ${v}` },
];
export function endActs(cfg, version, slug, branch) {
  const [owner, repo] = slug.split('/');
  const steps = [];
  const gaps = [];
  for (const a of END_ACTS) {
    const wf = cfg[a.key]?.workflow;
    if (typeof wf === 'string' && /^[\w.-]+\.ya?ml$/.test(wf)) steps.push(`${a.what(version)}, on Bob's approval: the GitHub connector's actions_run_trigger: run_workflow, workflow_id ${wf}, owner ${owner}, repo ${repo}, ref ${branch}, inputs {"version":"${version}"}; it waits in the protected environment that names Bob as required reviewer`);
    else {
      gaps.push(`${a.key}: no workflow in ${slug} runs ${a.what(version)} (process/config.json names none)`);
      steps.push(`${a.what(version)}, on Bob's approval: GAP, no workflow runs it yet (process/config.json ${a.key} names none); bring it to Bob through the coordinator, and the close waits on his word`);
    }
  }
  return { steps, gaps };
}

// The end of the rounds and the release (BD-R1), refused in order: no round open; a clean internal
// walk; a release cut after it; a clean walk of that release, installed on a p3dev- deployment.
// Then the installer and site updates, named in order. Without an internal walk configured, the
// walk the deploy row records stands for it; without a release block, the tranche cuts no release.
export function trancheEnd(root, cfg, t, { plan, slug, read }) {
  const w = walkFindings(root, cfg, t, { slug, read });
  if (!w.last) fail(`the last round's walk is owed before the tranche closes: ${roundAct(cfg)} (${roundWhat(cfg)})`);
  const hold = walkHold(w);
  if (hold) fail(`tranche close waits: ${hold}`);
  // The plan's close (PLN-5, your word) ends the tranche where it stands: the latest run's findings
  // recorded, as before; the rounds and the release are not owed.
  if (plan === 'close') return { steps: [], gaps: [], release: null };
  const rs = roundsAt(root, cfg, t, w);
  // A round open, owed, or merged since the latest walk (its fixes not yet walked): the rounds go on.
  if (['layer', 'next', 'new', 'walk'].includes(rs.state)) fail(`tranche close waits: ${roundLine(rs)} (BD-R1: rounds repeat until an internal walk finds no flaw)`);
  // A finding no module owns is a flaw no round can place: BOB names its module first.
  const loose = unplaced(root, t);
  if (loose.length) fail(`tranche close waits: ${loose.map((f) => f.id).join(', ')} in the found file of no module: BOB names its module (\`${P3} found <module> "<finding>" --from "<source>"\`), and the next round fixes it`);
  // 1. A clean internal walk: the latest round-close run's.
  // Exempt by Bob's word (deploycfg internalWalkOf), or not configured: the run's own walk stands for it.
  const iw = internalRequired(cfg, w.last);
  const clean = runPassed(cfg, w);
  if (!clean) fail(`tranche close waits: the latest ${iw ? 'internal walk' : 'walk'} (${runSource(w.last)}) is not clean (${iw ? `${w.last.internal_walk ? `ok ${w.last.internal_walk.ok}, ${Number(w.last.internal_walk.failures) || 0} failure(s)` : 'it did not run'}` : `ok ${w.last.ok}, ${Number(w.last.walk?.failures) || 0} failure(s)`}); its findings open the next round, and the rounds repeat until one is clean (BD-R1)`);
  if (!cfg.release) return { steps: [], gaps: [], release: null };
  // 2. The release deployment: a development release cut after that walk.
  const rel = releasesCut(root, cfg, w.last);
  if (!rel) fail(`tranche close waits: no development release since the clean internal walk ${runSource(w.last)}: ${P3} release dev, then the release deployment and its walk (BD-R1)`);
  // 3. The walk of the release: of that release installed on a p3dev- deployment.
  const rw = releaseWalks(root, cfg).filter((r) => r.version === rel.version).at(-1);
  if (!rw) fail(`tranche close waits: the release deployment of ${rel.version} and its walk are owed: ${P3} deploy release ${rel.version}; GAP: no path yet installs the cut, signed release onto a p3dev- deployment (no row in ${RELEASE_WALKS_FILE}; ${RELEASE_PATH_GAP}), brought to Bob through the coordinator`);
  if (!(rw.ok === true && !(Number(rw.failures) > 0))) fail(`tranche close waits: the walk of release ${rel.version} found ${Number(rw.failures) || 1} flaw(s); recorded as found marks, they open the next round (BD-R1)`);
  // BD-R5 (Bob, 9 Nov): a release walk clean with no AI account configured is clean for the non-AI
  // journeys only; the installer and site updates wait for a release walk with AI on, clean too.
  const aiWalk = releaseWalks(root, cfg).filter((r) => r.version === rel.version && r.ai === true).at(-1);
  if (rw.ai !== true && !(aiWalk && aiWalk.ok === true && !(Number(aiWalk.failures) > 0))) fail(`tranche close waits: the walk of release ${rel.version} is clean on the non-AI journeys only (no AI account configured${rw.not_walked?.length ? `; not walked: ${rw.not_walked.join(', ')}` : ''}); the installer and site updates wait until a release walk with AI on is clean too: Bob configures the AI account, walk.ai is set true, and the release is walked again (BD-R5)`);
  // 4 and 5. The installer, then the site: each on Bob's approval, named in order.
  const e = endActs(cfg, rel.version, slug, cfg.tranche);
  return { ...e, release: rel.version };
}

// ===== file: merge.test.mjs (later part) =====

  const m = readRows(root, 'alpha').filter((x) => x.event === 'measured').pop();
  assert.deepEqual([m.session, m.session_usd, m.cost_usd], ['session_J', 3.25, 'unmeasured']);
