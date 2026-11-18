  const rs = roundState(root, cfg, ref, { layers, flows: (n) => flowRows(root, cfg.state_branch, n), lastWalk: w?.last || null, flawed: flawedModules(root, cfg, ref) });
  return { ...rs, layers };
}

// The round at the tranche tip `t` (origin/<tranche>), as deploy dev and release dev read it, and as
// tranche close does: the plan as the tranche holds it, the layers from status's rows and layer
// close's rows, the latest deploy row's findings. `s` is status's result (null under plan close,
// which reads no layers); its prs null means GitHub was unreadable.
export function roundAt(root, cfg, t, { io = {}, slug = null } = {}) {
  const at = { slug, ...(io.compare ? { read: io.compare } : {}) };
  const closed = closedRows(root, cfg, at);
  let plan = null;
  try { plan = loadConfig(root, t).plan; } catch { plan = null; }
  const w = walkFindings(root, cfg, t, at);
  const s = plan === 'close' ? null : status(root, { log: () => {}, io: io.status });
  const rc = roundClose(root, cfg, { ls: s ? layerState(root, cfg, s.rows, t, { closed }) : null, plan, closed, ref: t, w });
  return { rc, w, s, plan };
}

// The latest deploy row's findings and how many are recorded: a failed run counts one at least,
// a walk its report's failures; recorded are the unmet found marks at `ref` whose source names
// this run, its slug and its commit (\`found ... --from "walk <slug> <commit>"\`, as deploy dev
// prints it: the slug alone repeats across runs), in any requirement file (requirements_dir, the
// ledger's) or found-work entry, and the completion items deferred naming it (known gaps).
export { runSource, walkHold };
export function walkFindings(root, cfg, ref, at = {}) {
  return findingsOf(root, cfg, ref, deployRows(root, cfg, at).at(-1) || null);
}

// The round's walk is the internal walk alone where the product configures one (C43, BD-R1); deploy
// dev's deploy and walk where it does not (Bob's exemption, or none set), as before.
// A malformed internal_walk reads as one configured, as rounds.mjs internalRequired reads it: walk round
// then refuses it with deployConfig's own words (cold review of C43).
export const walkOnly = (cfg) => { try { return !!internalWalkOf(cfg?.deploy?.internal_walk)?.walk; } catch { return true; } };
// Owed at a round close: none yet; or, under the rounds, the round's layers merged after the latest
// walk (BD-R1: a round ends at its walk; a walk with flaws opens the next round, which owes nothing
// until its own layers merge, and a clean one owes the release path, not another walk); or, under
// plan close (no rounds read), the latest run had findings and the tranche has moved past it. A
// clean walk owes none however the tip moves after it (review: a plain pull request, main into the
// tranche at its close, would owe a walk mid-close).
export const deployOwed = (rc, w, tip, done = 'deployed') => {
  if (!rc.closed) return null;
  if (!w.last) return `${rc.round} closed, not yet ${done}`;
  const since = `${rc.round} closed since ${String(w.last.commit).slice(0, 10)} was ${done}`;
  // A run that did not complete (stopped at its build, dry run, deploy) is owed again once the tip moves,
  // whatever its findings' record says: a deferred gap is no clean walk (cold review of C43).
  if (rc.rounds) return rc.rounds.state === 'walk' || (!w.last.ok && w.last.commit !== tip) ? since : null;
  return w.failing && w.last.commit !== tip ? since : null;
};
// What is owed at `ref` (the tranche as status and ROOT's sweep read it): the round-close run's
// reason, or null, and its act; a run started and not yet recorded (`running`), which owes nothing
// more while it may still be going; and, with nothing owed, the release path once a round's walk is
// clean (`release`: {why, act}, rounds.mjs releaseNext). The plan as the tranche holds it.
export function owedAt(root, cfg, { ls, ref, closed = [], at = {} }) {
  const w = walkFindings(root, cfg, ref, at);
  let plan = cfg.plan;
  try { plan = loadConfig(root, ref).plan; } catch { plan = cfg.plan; }
  const tip = git(['rev-parse', ref], { cwd: root });
  const running = runningAt(root, cfg, tip);
  const rc = roundClose(root, cfg, { ls, plan, closed, ref, w });
  const owed = running ? null : deployOwed(rc, w, tip, walkOnly(cfg) ? 'walked' : 'deployed');
  const release = running || owed ? null : releaseNext(root, cfg, { rc, w, plan, ref });
  return { owed, act: owed ? roundAct(cfg) : null, what: roundWhat(cfg), w, running, release };
}
// A round's walk started at `tip` and not recorded, within the longest it can run (each step's
// timeout, the internal walk's, and the install and build): it is running, or was cut short.
export function runningAt(root, cfg, tip) {
  const rows = jsonl(readState(root, cfg.state_branch, DEPLOYS_FILE)).filter((r) => r.tranche === cfg.tranche);
  const start = rows.filter((r) => START_ROWS.includes(r.row) && r.commit === tip).at(-1);
  if (!start || rows.some((r) => WALK_ROWS.includes(r.row) && r.commit === tip && r.at >= start.at)) return null;
  let minutes = 180;
  try { const d = deployConfig(cfg); minutes = d.timeout_minutes * (d.dry_run.length + d.deploy.length + d.walk.length + 2) + (d.internal_walk?.timeout_minutes || 0); } catch { minutes = 180; }
  return Date.now() - Date.parse(start.at) < minutes * MINUTE ? { ...start, until: new Date(Date.parse(start.at) + minutes * MINUTE).toISOString() } : null;
}
// The one next act when the round-close run is owed and has not run: walk round where the product
// configures an internal walk, deploy dev where it does not.
export const ROUND_ACT = `${P3} deploy dev, from a clean checkout of the tranche tip`;
export const ROUND_WALK_ACT = `${P3} walk round, from a clean checkout of the tranche tip`;
export const roundAct = (cfg) => (walkOnly(cfg) ? ROUND_WALK_ACT : ROUND_ACT);
export const roundWhat = (cfg) => (walkOnly(cfg) ? 'the internal walk only; no deploy and no live walk until a round\'s internal walk is clean, then the release deployment and its walk (BD-R1)' : 'the deploy and its walk');

// The round-close run, tool-started (Bob, 7 Nov: the internal walk is "Required, tool-started",
// and it runs at "Round close only"; his 4 Nov rule stands, no walk between layers). The act that
// closes a round starts it, so BOB need not remember it: layer merge of the round's last layer, and
// the merge of a plain pull request into the tranche that closes it (plan close, or the completion
// round's last item done). Where the product configures an internal walk, it is walk round: that
// walk alone, recorded as the round's walk, its findings the next round's found marks (BD-R1, Bob,
// 8 Nov: "the live walk would only run once a round completed without any flaws identified in the
// internal walk"); a clean one makes the release path the next act. Where it does not, deploy dev:
// the dry run, the deploy and its walk. Inline in the merging session, from a scratch worktree at the
// tranche tip, not a dispatched workflow: the session holds the product's access (never a secret a
// workflow could read under Bob's rules), and the run's row and reports go on the state branch. The
// merge is recorded before the run begins, so a run cut short loses nothing: with no row the run
// stays owed. When it cannot run here, it is the one next act: printed now, first in status, and
// ROOT's sweep wakes BOB for it. A round still open runs nothing.
export function roundCloseRun(root, { log = console.log, io = {}, by = 'the merge' } = {}) {
  let owed = null;
  let act = ROUND_ACT;
  try {
    let cfg = loadConfig(root);
    const t = `origin/${cfg.tranche}`;
    git(['fetch', '-q', ...depth(root), 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/${t}`], { cwd: root });
    // The tranche's config, as merged, not this checkout's (cold review of C23).
    try { cfg = loadConfig(root, t); } catch { /* the checkout's */ }
    if (!deploys(cfg)) return { ran: false, owed: null };
    act = roundAct(cfg);
    // The command's held state writes (the merge's close row) go first: the run reads the round
    // from origin, and its own writes are pushed as made, while its worktree exists (cold review
    // of C23: held, they were read back stale, and pushed from a removed worktree).
    if (pendingWrites()) flushState({ log });
    fetchState(root, cfg.state_branch, { fresh: true });
    const tip = git(['rev-parse', t], { cwd: root });
    const { rc, w, plan } = roundAt(root, cfg, t, { io, slug: io.repo || repoSlug(root) });
    const run = runningAt(root, cfg, tip);
    if (run) { log(`the round-close run at ${tip.slice(0, 10)} was started by ${run.session || 'a session'} at ${run.at} and is not recorded: running, or cut short; owed again after ${run.until}`); return { ran: false, owed: null, running: run }; }
    const only = walkOnly(cfg);
    owed = deployOwed(rc, w, tip, only ? 'walked' : 'deployed');
    if (!owed) {
      if (!rc.closed) log(`no ${only ? 'internal walk' : 'deploy and walk'} now: the round is open (${rc.why}); ${only ? 'it runs' : 'they run'} at its close, started by the act that closes it (Bob, 4 and 7 Nov)`);
      const next = releaseNext(root, cfg, { rc, w, plan, ref: t });
      if (next) log(`the round's walk is done; the one next act is the release path (${next.why}): ${next.act}`);
      return { ran: false, owed: null, ...(next ? { release: next } : {}) };
    }
    log(`${owed}: ${by} starts the round-close run now (Bob, 7 Nov: required, tool-started): ${roundWhat(cfg)}; if it is cut short, the run stays owed: ${act}`);
    const r = unbatched(() => withTemp('p3-round-', (tmp) => {
      const wt = join(tmp, 'w');
      git(['worktree', 'add', '-q', '--detach', wt, tip], { cwd: root });
      try {
        if (git(['ls-tree', tip, '--', '.gitmodules'], { cwd: root })) git(['submodule', 'update', '--init', '-q'], { cwd: wt, allowFail: true });
        return (only ? io.walkRound || walkRound : io.deployDev || deployDev)(wt, { log, io: io.deploy || {}, repo: io.repo || repoSlug(root) });
      } finally { git(['worktree', 'remove', '--force', wt], { cwd: root, allowFail: true }); }
    }, { root }));
    return { ran: true, ok: r.ok, owed };
  } catch (e) {
    const why = String(e?.message || e).split('\n')[0].slice(0, 200);
    if (!(e instanceof Fail)) log(`the round-close run stopped on an error: ${why}`);
    log(`the round-close run did not run here (${why}); ${owed ? `it is owed (${owed})` : 'if the round closed, it is owed'}: the one next act is ${act}; status puts it first and ROOT's sweep wakes BOB for it`);
    return { ran: false, owed, act, why };
  }
}
const defaultIO = { exec: run };

// The checks both round walks share: the checkout the clean tranche tip, the round closed at it and
// not already walked clean there, no run of it going; then the start marker, pushed at once so status
// and ROOT's sweep owe nothing while it runs (cold review of C23). `what` names the run in refusals.
function roundRunAt(root, cfg, { io, repo, what, slugOf, startRow, log }) {
  const t = `origin/${cfg.tranche}`;
  git(['fetch', '-q', ...depth(root), 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/${t}`], { cwd: root });
  const tip = git(['rev-parse', t], { cwd: root });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  if (head !== tip) fail(`the checkout is ${head.slice(0, 10)}, not the tranche tip ${tip.slice(0, 10)}: check out ${t} first`);
  const dirty = git(['status', '--porcelain', '--untracked-files=no'], { cwd: root });
  if (dirty) fail(`the checkout has uncommitted changes: ${dirty.split('\n').slice(0, 3).join('; ')}`);
  fetchState(root, cfg.state_branch, { fresh: true });
  const { rc, w } = roundAt(root, cfg, t, { io, slug: repo });
  if (!rc.closed) fail(`no ${what} now: a round's walk belongs to its close, never between layers (${rc.why}); it becomes due when the round closes`);
  if (w.last && w.last.ok && !w.failing && w.last.commit === tip) fail(`no ${what} now: ${tip.slice(0, 10)} is ${w.last.row === 'round-walk' ? 'walked' : 'deployed and walked'} clean (${w.last.slug}); the next round's close makes the next one`);
  const s = slugOf(rc.layer);
  const going = runningAt(root, cfg, tip);
  if (going) fail(`no ${what} now: ${going.session || 'a session'} started one at ${tip.slice(0, 10)} (${going.slug}) at ${going.at}, not yet recorded: it is running, or was cut short; run it again after ${going.until}`);
