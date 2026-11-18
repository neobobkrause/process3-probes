// ===== file: branches.mjs (continued) =====

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

// ===== file: notice.mjs (later part) =====

// At a job's merge: the notice it leaves, and the notices its START named, answered by it. One
// write; a file already there is kept, so a rerun adds nothing.
// The answers come from the job's own start row, which the job can edit: only a key of a notice
// the state branch holds for this user is answered (confirming review of PR 54), and no file
// lands outside notices/ (a key such as "a/../../x" would otherwise reach past the worktree).
export function recordAtMerge(root, cfg, { notice, answers = [], user, pr }) {
  const at = new Date().toISOString();
  const sb = cfg.state_branch;
  const have = fetchState(root, sb, { fresh: true });
  if (answers.length) {
    const known = new Set(have ? notices(root, sb).filter((n) => n.users.includes(user)).map((n) => n.key) : []);
    answers = [...new Set(answers)].filter((k) => typeof k === 'string' && known.has(k));
  }
  const want = [
    ...(notice ? [[noticeFile(notice.key), { row: 'notice', at, ...notice }]] : []),
    ...answers.map((key) => [answerFile(user, key), { row: 'answered', at, key, user, pr }]),
  ];
  if (!want.length) return { rows: [] };
  const missing = (has) => want.filter(([f]) => !has(f));
  if (have && !missing((f) => readState(root, sb, f) !== null).length) return { rows: [] };
  return writeState(root, sb, `provider notices at the merge of PR ${pr}`, (wt) => {
    const dir = resolve(wt, NOTICES_DIR) + sep;
    for (const [f] of want) if (!resolve(wt, f).startsWith(dir)) throw new Error(`refused: ${f} is outside ${NOTICES_DIR}/`);
    const add = missing((f) => existsSync(join(wt, f)));
    for (const [f, row] of add) {
      mkdirSync(dirname(join(wt, f)), { recursive: true });
      writeFileSync(join(wt, f), JSON.stringify(row) + '\n');
    }
    return { rows: add.map(([, row]) => row) };
  });
}

// A merged pull request's range as GitHub merged it: the merge commit m, the job's head m^2, and
// the merge base of m's two parents. A shallow clone fetched m at depth 50 and asked git for the
// base, which died once the base lay 50 or more commits back on either side (defect sweep 4 Nov,
// #8). Now a shallow clone fetches m and its parents (depth 2), takes the base from GitHub's
// compare (merge_base_commit) and fetches it at depth 1: only the trees at the base and m^2 are
// read. A full clone asks git. `what` ends the refusals ("what it changed cannot be read").
export function mergedRange(root, m, { slug, n, what = 'what it changed cannot be read', read = compare } = {}) {
  const has = (rev) => git(['rev-parse', '-q', '--verify', `${rev}^{commit}`], { cwd: root, allowFail: true }).code === 0;
  const shallow = isShallow(root);
  if (!has(`${m}^1`)) git(['fetch', '-q', ...(shallow ? ['--depth=2'] : []), 'origin', m], { cwd: root, allowFail: true });
  if (!has(m)) fail(`pull request ${n} merged at ${m.slice(0, 10)}, which could not be fetched; ${what}`);
  const head = git(['rev-parse', `${m}^2`], { cwd: root, allowFail: true });
  if (head.code !== 0) fail(`pull request ${n} merged at ${m.slice(0, 10)}, which is not a merge commit; ${what}`);
  const h = head.stdout.trim();
  const p1 = git(['rev-parse', `${m}^1`], { cwd: root });
  if (!shallow) {
    const mb = git(['merge-base', p1, h], { cwd: root, allowFail: true });
    if (mb.code !== 0) fail(`pull request ${n}: no merge base of ${p1.slice(0, 10)} and ${h.slice(0, 10)}; ${what}`);
    return { head: h, mb: mb.stdout.trim() };
  }
  const sha = slug ? read(slug, p1, h)?.merge_base_commit?.sha : null;
  if (!/^[0-9a-f]{40,64}$/.test(sha || '')) fail(`this clone is shallow and GitHub did not give the merge base of pull request ${n} (${p1.slice(0, 10)} and ${h.slice(0, 10)}); ${what}; run it again`);
  if (!has(sha)) git(['fetch', '-q', '--depth=1', 'origin', sha], { cwd: root, allowFail: true });
  if (!has(sha)) fail(`this clone is shallow and could not fetch the merge base ${sha.slice(0, 10)} of pull request ${n}; ${what}; run it again`);
  return { head: h, mb: sha };
}

// notice withdraw <provider>:<pr>: BOB's act, for a notice recorded before merge held the source
// rule. The tool reads the PR's merge commit (as merge run again on a merged pull request does)
// and refuses unless the PR changed no file of the provider's own source; then one file on the
// state branch, added and never edited, and status drops the notice.
//
// PD-18: a notice whose pull request GitHub definitively says does not exist in the product
// repository (prPresence: GitHub's 404 on the pulls endpoint while the repository is served, and the
// number no PR on the issues endpoint either) is withdrawn too, its row `missing: true`: nothing can
// ever be read for it, so nothing can ever answer it. The presence is read only when getPR fails, and
// any answer short of that (a network error, a 5xx, a rate limit, a 403) refuses as before.
export function readNoticePR(slug, n, { getPR, presence = prPresence }) {
  try { return { pr: getPR(slug, n) }; } catch (err) {
    let p;
    try { p = presence(slug, n); } catch { throw err; }
    if (p?.missing !== true || typeof p.status !== 'string' || !p.status) throw err;
    return { missing: { status: p.status, why: `PR ${n} does not exist in ${slug} (GitHub ${p.status})` } };
  }
}
// Whether this repository's own history holds a merge of PR n, on the tranche or main: 'merged',
// 'none', or 'unknown' (read failed: the caller fails closed). GitHub hides a suspended account's
// PRs and answers 404 for them (copy run 42277392893, 7 Nov), so a 404 alone cannot tell a hidden
// real PR from one that never existed (cold review of C48); its merge commit stays on the branch.
// The merge tool titles it "Merge PR n: ...", GitHub's button "Merge pull request #n from ...", a
// squash "... (#n)". A full clone reads its own fetched refs. A shallow clone is not deepened (a
// date fetch can also cut history the merge train fetched deep): a throwaway bare clone of each
// branch back to a week before the notice's own time (the notice is written at its PR's merge) is
// read instead; a notice without a readable time is 'unknown' there.
export const MERGE_SUBJECT = (n) => new RegExp(`^Merge PR ${n}:|^Merge pull request #${n} |\\(#${n}\\)$`);
export function mergedHere(root, cfg, n, { at = null } = {}) {
  const refs = [...new Set([cfg.tranche, 'main'].filter(Boolean))];
  const hit = (dir, revs) => {
    const r = git(['log', '--format=%s', ...revs], { cwd: dir, allowFail: true });
    if (r.code !== 0) return null;
    return r.stdout.split('\n').some((l) => MERGE_SUBJECT(n).test(l.trim()));
