// ===== file: branches.mjs (continued) =====

  const recentRefs = new Set(activity
    .filter((e) => /^refs\/heads\//.test(String(e?.ref)) && !(Date.parse(e.timestamp) < cutoff))
    .map((e) => e.ref.slice('refs/heads/'.length)));

  const listed = git(['for-each-ref', '--format=%(refname)%00%(objectname)%00%(committerdate:unix)%00%(authordate:unix)', 'refs/remotes/origin/'], { cwd: root });
  const branches = listed.split('\n').filter(Boolean).map((l) => {
    const [r, sha, c, a] = l.split('\0');
    return { name: r.slice('refs/remotes/origin/'.length), sha, newest: Math.max(Number(c) || 0, Number(a) || 0) * 1000 };
  }).filter((b) => b.name !== 'HEAD');

  const kept = { protected: [], 'open-pr': [], recent: [], ahead: [] };
  const candidates = [];
  for (const b of branches) {
    // A layer branch (layer/<n>, the shared layer branch) is cut from the tranche tip with no commit
    // of its own until a publish lands, so rule (a) would take it: kept whatever its commits.
    if (protectedNames.has(b.name) || /^layer\/\d+$/.test(b.name)) { kept.protected.push(b.name); continue; }
    if (openRefs.has(b.name)) { kept['open-pr'].push(b.name); continue; }
    // A branch at the tranche's tip may have been cut a minute ago with no commit of its own; the
    // activity log is its only other witness, so it is kept as recent too.
    if (b.newest >= cutoff || recentRefs.has(b.name) || b.sha === trancheSha) { kept.recent.push(b.name); continue; }
    const n = git(['rev-list', '--count', `${remote(tranche)}..${remote(b.name)}`], { cwd: root, allowFail: true });
    if (n.code !== 0) fail(`could not count ${b.name}'s commits against ${tranche}: ${n.stderr.trim()}; nothing was deleted`);
    if (Number(n.stdout) === 0) { candidates.push({ name: b.name, sha: b.sha, why: 'in-tranche' }); continue; }
    const prs = own.get(b.name) || [];
    if (b.name.startsWith(TRAIN_HEAD) && prs.length && prs.every((p) => p.state === 'closed')) {
      const dates = git(['log', '--format=%ct %at', `${remote(tranche)}..${remote(b.name)}`], { cwd: root }).split(/\s+/).filter(Boolean).map(Number);
      if (Math.max(0, ...dates) * 1000 >= cutoff) { kept.recent.push(b.name); continue; }
      candidates.push({ name: b.name, sha: b.sha, why: 'train-head-closed' });
      continue;
    }
    kept.ahead.push(b.name);
  }

  const counts = Object.fromEntries(Object.entries(kept).map(([k, v]) => [k, v.length]));
  const label = dryRun ? 'would delete' : 'deleting';
  log(`branches prune${dryRun ? ' (dry run)' : ''}: ${branches.length} branches on origin; ${candidates.length} to delete (${candidates.filter((c) => c.why === 'in-tranche').length} in ${tranche}, ${candidates.filter((c) => c.why === 'train-head-closed').length} closed train heads); kept ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  for (const c of candidates) log(`  ${label} ${c.name} at ${c.sha.slice(0, 10)} (${c.why})`);
  if (dryRun) return { ok: true, approved, dryRun, deleted: [], failed: [], kept: counts, candidates };

  // The deletes, each leased to the tip judged above, in batches; a server error retries the batch.
  // The open pull requests are read again before each batch: one opened since the judgement (its
  // head or base a candidate) keeps that branch; an unreadable read deletes no more.
  for (let i = 0; i < candidates.length; i += DELETE_BATCH) {
    const open = io.openPulls(slug);
    if (!open) { log('the open pull requests could not be read again; no further branch is deleted'); break; }
    const nowOpen = new Set(open.flatMap((p) => [p.head?.ref, p.base?.ref]).filter(Boolean));
    const batch = candidates.slice(i, i + DELETE_BATCH).filter((c) => !nowOpen.has(c.name));
    if (!batch.length) continue;
    const args = [...batch.map((c) => `--force-with-lease=refs/heads/${c.name}:${c.sha}`), 'origin', ...batch.map((c) => `:refs/heads/${c.name}`)];
    for (let t = 1; t <= PUSH_TRIES; t++) {
      const r = push(root, args);
      if (r.code === 0 || !isServerError(`${r.stderr}\n${r.stdout}`)) break;
      if (t < PUSH_TRIES) log(`the delete push hit a server error; trying again (${t + 1} of ${PUSH_TRIES})`);
    }
  }

  // What origin holds now: a candidate still there was not deleted (moved, protected or failed).
  let left = null;
  for (let t = 1; t <= PUSH_TRIES && left === null; t++) {
    const r = git(['ls-remote', '--heads', 'origin'], { cwd: root, allowFail: true });
    if (r.code === 0) left = new Set(r.stdout.split('\n').filter(Boolean).map((l) => l.split('\t')[1]?.slice('refs/heads/'.length)));
  }
  if (left === null) fail('could not read origin\'s branches back after the deletes; the run\'s row is not written');
  const deleted = candidates.filter((c) => !left.has(c.name));
  const failed = candidates.filter((c) => left.has(c.name)).map((c) => c.name);
  for (const n of failed) log(`  not deleted: ${n} (moved since it was judged, protected, or the push failed)`);
  log(`branches prune: ${deleted.length} deleted, ${failed.length} not deleted`);

  const row = {
    at: now(), row: 'prune', ...(run ? { run: String(run) } : {}), default_branch: def, on, at_sha: baseSha, tranche, tranche_sha: trancheSha,
    branches: branches.length, kept: counts, deleted: deleted.map(({ name, sha, why }) => ({ name, sha, why })), failed,
  };
  writeState(root, cfg.state_branch, `branches prune: ${deleted.length} deleted`, (wt) => {
    const p = join(wt, PRUNE_FILE);
    mkdirSync(dirname(p), { recursive: true });
    appendFileSync(p, JSON.stringify(row) + '\n');
  });
  log(`row written to ${cfg.state_branch}:${PRUNE_FILE}`);
  // A branch moved since it was judged is kept, rightly; only a run that deleted none of its
  // candidates is red (a token without contents: write, or a ruleset that refuses every delete).
  return { ok: !failed.length || deleted.length > 0, approved, dryRun, deleted, failed, kept: counts, candidates };
}

// ===== file: tranche.mjs (later part) =====

  if (wake) log(wake);
  return rows;
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
