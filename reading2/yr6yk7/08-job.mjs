  L.push('', '## Commands, in order', '');
  const n = restart ? 2 : 1;
  // A replacement fills .process at the launch commit, the tranche tip, and job sync checks out
  // the branch and brings the tranche in: it runs from the tranche's pin, whatever the branch pins.
  // Shallow, as the session's clone is: job sync and job complete deepen what they need.
  L.push('1. `git submodule update --init .process`');
  if (restart) L.push(`2. \`${P3} job sync ${id}\``);
  L.push(`${n + 1}. \`${P3} status --role job --module ${id}\``);
  L.push(`${n + 2}. Do the work. Run the module's suite with \`${P3} test ${id}\`. Commit; \`${P3} job sync ${id}\` pushes it each turn (JOB-9). To bring in the tranche or BOB's pushes: \`${P3} job sync ${id}\`, never a merge by hand.`);
  // The shared layer branch (layerflow.mjs): the job publishes onto its layer; the merge tool lands it.
  const lay = layerOfBranch(tranche);
  if (lay !== null) L.push(`${n + 3}. When the suite passes and the requirements are met: \`${P3} layer publish ${id} --not-verified "<what you did not verify>" --test R<id>="<test file>::<test name>"\`, with job complete's flags. It brings your branch up to \`${tranche}\`, refuses any file outside your paths, runs your fast checks (CI runs the suite), pushes, posts your receipt and marks the PR ready; the merge tool lands it into \`${tranche}\` on a green gate. If a message says a provider changed its interface, stop any test run at once and run \`${P3} layer publish ${id}\` again: a run started before the provider's change never counts. A run of publish already going halts and restarts by itself.`);
  else L.push(`${n + 3}. When the suite passes and the requirements are met: \`${P3} job complete ${id} --not-verified "<what you did not verify>" --test R<id>="<test file>::<test name>"\`, one \`--test\` for each \`(not yet met)\` mark your branch struck (\`--test F<n>=...\` for a found mark), naming its test. It pushes, posts your receipt, marks the PR ready; if it stops, rerun it. CI runs the suite and checks your receipt. The gate fails a changed test that still passes with your change reverted (JOB-12); a refactor's \`--exempt-revert "<why>"\` asks a reviewer to exempt it.`);
  L.push(`${n + 4}. When it prints the receipt link, wake BOB as its last line says, then end your turn.`);
  L.push('', `If you cannot go on: \`${P3} block ${id} --reason "<why>"\`, wake BOB as its last line says, then end your turn. A legitimate exit, not a failure.`);
  // Bob, 4 Nov: "urgency is fully supported in process3's initial release"; the wait, at most
  // decision_minutes, is the coordinator's chain.
  // The chain's last automatic step is the watcher (coordinator, 4 Nov); `address <role>` reads each.
  L.push('', `No answer from BOB in ${decisionMinutes} min: send it once more, then to ROOT${rootId ? ` \`${rootId}\`` : ''}, then the watcher, with the minutes, by send_message (\`${P3} address <role>\`). If reversible and in your module, act on your recommendation and note why in your PR; never a merge, a push off your branch, or what is not yours.`);
  // The chosen short-term triage responses naming job briefs (register.mjs, AUD-8), verbatim, before the acts and their limits.
  if (standing) L.push('', standing.trimEnd());
  // Measured 2 Nov: the only refused merge into main was chained with an unrelated script.
  L.push('', 'Give each judged act (a push, a session start) its own shell command, never chained with another.');
  L.push('', '## Acts you may take', '');
  for (const a of entry.acts?.length ? entry.acts : DEFAULT_ACTS(branch)) L.push(`- ${a}`);
  // Review of PR 72: the wake's send writes the state branch, which "push to job/<id> only" forbade.
  L.push('- the wake that job complete or block prints, and its send_message');
  // A division of labour (Bob, 2 Nov, before the log; unverified): deploying and releasing are the coordinator's acts in a
  // round; local wrangler and miniflare runs are the job's own builds and tests.
  L.push('', 'Not yours, and this line wins over any act above: merging; pushing to any other branch yourself (the wake\'s send writes the state branch); editing `.claude/`, `.process/`, `process/` by hand, CLAUDE.md or another module\'s files; starting sessions; deploying, releasing, release signing and acting on a live site (the coordinator\'s; local wrangler and miniflare builds and tests are yours). Other modules\' work, or a need for the coordinator\'s acts: report it to your coordinator.');
  return L.join('\n') + '\n';
}


// A job's coordinator (PR 43: `coordinator` in process/config.json is ROOT's and the watcher's):
// the BOB addresses/bob.json on the state branch names; --coordinator overrides it for one start.
// With ROOT's address and decision_minutes, for the START's escalation (coordinator, 4 Nov).
function jobCoordinator(root, cfg, given, fetch) {
  const addressed = (role) => { try { const s = JSON.parse(readState(root, cfg.state_branch, addressFile(role)) || 'null')?.session; return typeof s === 'string' && s ? s : null; } catch { return null; } };
  // Fresh: a handover confirmed in ROOT's clone a moment ago names the new BOB (cold review of R17f).
  if (fetch) fetchState(root, cfg.state_branch, { fresh: true });
  const minutes = Number(cfg.targets?.decision_minutes ?? 30);
  if (!(minutes > 0)) fail(`targets.decision_minutes in process/config.json is a number of minutes, not ${JSON.stringify(cfg.targets?.decision_minutes)}`);
  const escalate = { rootId: addressed('root'), decisionMinutes: minutes };
  if (given) return { coordinator: given, bob: false, ...escalate };
  const session = addressed('bob');
  if (!session) fail(`no coordinator: no BOB is addressed on ${cfg.state_branch} (${addressFile('bob')}); ROOT records one with start record bob <id>, and --coordinator <session id> overrides it for one start`);
  return { coordinator: session, bob: true, ...escalate };
}

// The unanswered provider notices for a module, as the state branch holds them (none when it
// cannot be read: the START then names none, and status still lists them).
function noticesFor(root, cfg, id, fetch) {
  try {
    if (fetch) fetchState(root, cfg.state_branch);
    return unanswered(root, cfg.state_branch, id);
  } catch { return []; }
}

// The keys of the notices BOB withdrew (notice withdraw), as origin's state branch holds them;
// none when it cannot be read, so every named notice then stands.
function withdrawnFor(root, cfg) {
  try { return fetchState(root, cfg.state_branch, { fresh: true }) ? withdrawnKeys(root, cfg.state_branch) : new Set(); } catch { return new Set(); }
}

// The notices a start row named, with their detail from the state branch when it has them, less
// any BOB withdrew since (coordinator, 4 Nov).
const named = (owed, row, withdrawn = new Set()) => (row?.notices || []).filter((key) => !withdrawn.has(key)).map((key) => owed.find((x) => x.key === key)
  || { key, provider: key.split(':')[0], ids: ['(see the state branch)'], pr: key.split(':')[1] });

const commitFiles = (root, paths, msg) => {
  git(['add', '--', ...paths], { cwd: root });
  git(['commit', '-q', '-m', msg, '--', ...paths], { cwd: root });
  return git(['rev-parse', 'HEAD'], { cwd: root });
};
const fetchRef = (root, branch, opts) => fetchBranch(root, branch, opts);
// The newest COMPLETE commit of a module on this branch, by the message commitFiles gives it.
const bre = (s) => String(s).replace(/[.[\]*^$\\]/g, '\\$&');
const completeCommit = (root, id) => git(['log', '-1', '--format=%H', `--grep=^job complete ${bre(id)} (attempt `, '--', metricsFile(id)], { cwd: root, allowFail: true }).stdout.trim();
const remoteTip = (root, branch) => (git(['ls-remote', 'origin', `refs/heads/${branch}`], { cwd: root, allowFail: true }).stdout.split('\t')[0] || '').trim();
const restore = (root, paths) => git(['checkout', 'HEAD', '--', ...paths], { cwd: root, allowFail: true });

function launchFor(slug, branch, id, start, model, clone) {
  return { title: `job ${id}`, source_url: `https://github.com/${slug}`, source_revision: branch, ...(clone || {}), ...(model ? { model } : {}), prompt: start };
}

// The coordinator's next step: subscribe to the job's pull request, so its completion, a red
// gate or a comment arrives as an event (attempt 1 was noticed after 194 minutes).
export function subscribeFor(slug, pr) {
  const [owner, repo] = slug.split('/');
  const call = { owner, repo, pullNumber: pr.number };
  return { call, text: `then subscribe to the job's pull request with subscribe_pr_activity, so its completion, a red gate or a comment reaches you as an event:\n${JSON.stringify(call, null, 2)}` };
}

// HEAD when the setup check left it at the fetched tip (start.mjs anchor), else null.
const anchoredTip = (root, cfg) => { const h = git(['rev-parse', 'HEAD'], { cwd: root }); return git(['rev-parse', '-q', '--verify', `refs/remotes/origin/${cfg.tranche}`], { cwd: root, allowFail: true }).stdout.trim() === h ? h : null; };

// A push of a branch already on origin is a fast-forward only where this clone can see origin's
// tip below HEAD. In a shallow clone the tranche tip the start is cut from has no parents here,
// so git refused the push as not a fast-forward (copy, 5 Nov, plane, BOB's depth-1 clone): the
// tranche is deepened, doubling, then whole, until it can. A tip still not below it after a full
// read is refused plainly, nothing pushed (coordinator, 5 Nov), with its sha and the way on.
function provable(root, id, branch, tranche, from) {
  const tip = remoteTip(root, branch);
  if (!tip) return;
  if (git(['cat-file', '-e', `${tip}^{commit}`], { cwd: root, allowFail: true }).code !== 0) fetchRef(root, branch);
  const on = () => git(['merge-base', '--is-ancestor', tip, 'HEAD'], { cwd: root, allowFail: true }).code === 0;
  const ref = `+refs/heads/${tranche}:refs/remotes/origin/${tranche}`;
  for (let n = 32; !on() && isShallow(root); n *= 2) {
    const r = git(['fetch', '-q', ...(n > 4096 ? ['--unshallow'] : [`--deepen=${n}`]), 'origin', ref], { cwd: root, allowFail: true });
    if (r.code !== 0) fail(`this clone is shallow and ${tranche}'s history could not be read to push ${branch} as a fast-forward (git fetch: ${r.stderr.trim().split('\n').pop()}); nothing was pushed; run it again`);
  }
  if (!on()) {
    fail(`origin's ${branch} at ${tip.slice(0, 10)} is not in ${tranche} at ${git(['rev-parse', from], { cwd: root }).slice(0, 10)}, the tip this start is cut from, after a full read: pushing would not be a fast-forward, so nothing was pushed. Its commits are kept there; start on a fresh branch: job start ${id} --live <n> --fresh-branch "${branch} at ${tip.slice(0, 10)} is not in ${tranche}", adding --reopen "<what it must do>" for a COMPLETE module`);
  }
}

// The setup check first: nothing starts while a condition is missing (setup audit, 2 Nov).
function setupOrStop(root, cfg, slug, setup, log) {
  // A checkout behind the tip moves to it first (start.mjs anchor): a moved tranche is no stale session.
  const s = setup(root, { slug, log, anchor: true });
  // A session not started from the tranche (Bob, 2 Nov, before the log; unverified): say so plainly, with the check's own
  // words for what to do (re-review of PR 24).
  if (s.missing.includes('session-branch')) {
    const t = s.tranche || cfg.tranche;
    const why = s.results?.find((r) => r.id === 'session-branch')?.detail || `this checkout is not the ${t} branch. Start the session from the ${t} branch`;
    const also = s.missing.filter((m) => m !== 'session-branch');
    fail(`this session's checkout is not one job start accepts: sessions act on the standing approvals of the ${t} branch; nothing was started. ${why}${also.length ? ` (also missing: ${also.join(', ')})` : ''}`);
  }
  if (!s.ok) fail(`the setup is not complete (${s.missing.join(', ')}); nothing was started. Bob sets what is missing; p3 setup check shows it`);
}

