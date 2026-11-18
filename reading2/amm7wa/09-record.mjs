  return { since: sha, from: 'head' };
}

// Take-in scope (the coordinator's rule, 4 Nov 2026, copy PR 86): a job started with
// `job start <id> --take-in` merged earlier work made before Process3 into the tranche; its
// commits before the take-in start commit are earlier work, already judged as a whole by the
// take-in (every file it changes against the tranche within the module's paths, else refused),
// and they may predate the process files and the approvals (copy, 4 Nov: ten such merges gave 70
// findings no job can clear without rewriting history). So the record check leaves out the
// commits reachable from the tip the start row records (take_in.tip); the take-in start commit
// and everything after it are judged as before, and the gate's ownership check still judges the
// net change. The row is the job's own, so the tip is used only when it is what a take-in
// writes: a full commit id; the first parent of a commit in the range that adds a start row
// naming it; and no commit it leaves out writes the job's metrics file, so no job start, and
// nothing made after one, can be hidden behind a later row. Otherwise it is a finding and
// nothing is left out. Only a row the range adds is judged so: one the base already holds was
// judged where it landed, and gives no finding while not honouring it leaves nothing of the range
// out (copy, 4 Nov, bundler and registers). Where it would, it is judged by the same checks as a
// row the range adds, and honoured only if a commit in the range is its take-in (in a whole
// history that commit cannot lie under the base: the tip and its history would lie there too).
// Not honouring a row never hides a commit. On a branch other than job/<id> every module's rows
// are read.
export function takenIn(root, { base, head = 'HEAD', id } = {}) {
  const out = { tips: [], findings: [] };
  // On job/<id>, that job's rows; on any other branch (the tranche, its pull request into main),
  // every module's, since the merge tool merges a job with its history (review 1 of PR 86).
  const ids = id !== undefined ? (/^[a-z0-9-]+$/.test(String(id)) ? [String(id)] : [])
    : git(['ls-tree', '-z', '--name-only', `${head}:${METRICS_DIR}`], { cwd: root, allowFail: true }).stdout.split('\0')
      .filter((n) => /^[a-z0-9-]+\.jsonl$/.test(n)).map((n) => n.slice(0, -'.jsonl'.length));
  const not = [...(base ? [`^${base}`] : [])];
  let range;
  const seen = new Set();
  for (const one of ids) {
    const file = metricsFile(one);
    const names = (rev, tip) => rowsAt(root, rev, one).some((r) => r.event === 'start' && r.take_in?.tip === tip);
    const claimed = [...new Set(rowsAt(root, head, one).filter((r) => r.event === 'start' && r.take_in && 'tip' in r.take_in).map((r) => r.take_in.tip))];
    for (const tip of claimed) {
      const bad = (why) => out.findings.push({ check: 'record', file, line: 1, message: `the take-in tip ${String(tip).slice(0, 10)} is not used to leave out earlier work: ${why}` });
      const full = typeof tip === 'string' && /^([0-9a-f]{40}|[0-9a-f]{64})$/.test(tip);
      const here = full && git(['rev-parse', '-q', '--verify', `${tip}^{commit}`], { cwd: root, allowFail: true }).code === 0;
      // A row the base already holds came with an earlier attempt, a merge of the tranche or a
      // job sync, and was judged where it landed (copy, 4 Nov: bundler's attempt 5 and registers
      // met attempt 1's rows, their take-in commits hundreds of commits below the base; the
      // session's clone was shallow, its base history cut above them, so the tip read as new and
      // its adder as missing from the range). Not honouring it leaves nothing out, so it gives no
      // finding, unless the tip's history holds commits of this range that it would leave out:
      // then it is judged below by the same checks as a row the range adds. Counted against the
      // head, so a shallow clone, whose base history is cut, does not count the tip's own history
      // as the range's.
      if (base && names(base, tip)) {
        if (!here) continue;
        const reach = (...extra) => Number(git(['rev-list', '--count', tip, ...not, ...extra], { cwd: root }));
        if (reach() === reach(`^${head}`)) continue;
      }
      if (!full) { bad('it is not a full commit id'); continue; }
      if (!here) { bad('no such commit here'); continue; }
      if (git(['rev-list', '--count', tip, ...not], { cwd: root }) === '0') continue; // already in the base: nothing to leave out
      range ||= git(['rev-list', '--parents', head, ...not], { cwd: root }).split('\n').filter(Boolean).map((l) => l.split(' '));
      if (!range.some(([c, first]) => first === tip && names(c, tip) && !names(tip, tip))) { bad('no commit in the range has it as its first parent and adds the start row naming it'); continue; }
      // Any module's metrics: every job start writes its own, so no job's work, this one's or
      // another's not yet on the base, is left out.
      const wrote = git(['log', '--full-history', '-m', '--format=%H', tip, ...not, '--', METRICS_DIR], { cwd: root }).split('\n').filter(Boolean);
      if (wrote.length) { bad(`commit ${wrote[0].slice(0, 10)}, which it would leave out, writes under ${METRICS_DIR}; only work from before Process3 is left out`); continue; }
      if (!seen.has(tip)) { seen.add(tip); out.tips.push(tip); }
    }
  }
  return out;
}

// In a partial clone, fetch every file the range needs in one request rather than one at a
// time as each is read. Best effort: a file still missing is fetched, or fails, when read.
function prefetch(root, range) {
  if (git(['config', '--get', 'remote.origin.promisor'], { cwd: root, allowFail: true }).stdout.trim() !== 'true') return;
  const missing = git(['rev-list', '--objects', '--missing=print', ...range], { cwd: root, allowFail: true }).stdout
    .split('\n').filter((l) => l.startsWith('?')).map((l) => l.slice(1));
  if (!missing.length) return;
  git(['-c', 'fetch.negotiationAlgorithm=noop', 'fetch', '-q', '--no-tags', '--no-write-fetch-head', '--recurse-submodules=no', '--filter=blob:none', '--stdin', 'origin'],
    { cwd: root, allowFail: true, input: missing.join('\n') + '\n' });
}

// The commits a shallow clone's history is cut at (empty in a full clone).
function shallowCuts(root) {
  const f = git(['rev-parse', '--git-path', 'shallow'], { cwd: root, allowFail: true }).stdout.trim();
  try { return new Set(readFileSync(resolve(root, f), 'utf8').split('\n').filter(Boolean)); } catch { return new Set(); }
}

// trusted: the refs whose owner-set block a commit may carry (ownerBlock), beside the base: by
// default origin/main and origin/<tranche>.
// takenIn: the take-in tips (takenIn's tips) whose history is left out.
export function recordCheck(root, cfg, { base, head = 'HEAD', branch, ledgerBase, lookup, since, takenIn: earlier = [], trusted, home } = {}) {
  const findings = [];
  const notices = [];
  const verified = new Map();
  const ownerName = cfg.approvals.owner;
  // A shallow clone (copy, 6 Nov: a job session's depth-1 clone): a sync merge's other parent and
  // the owner's approvals commits lie past the cut, so a merge that took the tranche's approvals
  // cleanly read as an approvals change that was not the owner's. The whole history is fetched
  // first (--unshallow adds history and rewrites nothing; --deepen=500 did not reach); if the
  // clone stays shallow the check refuses, and never reports a change it has not proven.
  if (shallowCuts(root).size) {
    const r = git(['fetch', '-q', '--unshallow', 'origin'], { cwd: root, allowFail: true });
    const left = shallowCuts(root).size;
    if (left) fail(`this clone is shallow (its history is cut at ${left} commit(s)), and the record check needs the whole history to judge a merge or an approvals change; \`git fetch --unshallow origin\` did not complete${r.code !== 0 ? ` (${r.stderr.trim().split('\n').pop()})` : ''}: run \`git fetch --unshallow origin\` here, then run it again; nothing was judged`);
  }
  // record_since names the base or an ancestor of it: a full commit id only, never a ref or
  // a short id, whose meaning could change. With no base there is nothing to compare with.
  const onBase = (v) => typeof v === 'string' && /^([0-9a-f]{40}|[0-9a-f]{64})$/i.test(v) && Boolean(base)
    && git(['rev-parse', '-q', '--verify', `${v}^{commit}`], { cwd: root, allowFail: true }).code === 0
    && git(['merge-base', '--is-ancestor', v, base], { cwd: root, allowFail: true }).code === 0;
  const ownerCommit = (sha) => {
    if (!verified.has(sha)) verified.set(sha, webCommitByOwner(root, sha, ownerName, lookup));
    return verified.get(sha);
  };
  const { file: afile, heading } = cfg.approvals;
  const refs = [base, ...(trusted || ['origin/main', `origin/${cfg.tranche}`])].filter((x) => x && git(['rev-parse', '-q', '--verify', `${x}^{commit}`], { cwd: root, allowFail: true }).code === 0);
  const anc = (a, b) => git(['merge-base', '--is-ancestor', a, b], { cwd: root, allowFail: true }).code === 0;
  // A commit already on main or the tranche (a ref that does not hold the head) was judged when
  // it landed there; its block is not judged again (a release merge brought back from main).
  const landedOn = refs.filter((r) => r !== base && !anc(head, r));
  const landed = (sha) => landedOn.some((r) => anc(sha, r));
  // A parent whose versions were judged: an ancestor of the base, which the range leaves out
  // because it landed on main or the tranche (review of PR 101: a main-only commit is not one,
  // since the owner may have replaced its block on main since).
  const onTrusted = (sha) => Boolean(base) && anc(sha, base);
  // A merge takes a trusted parent's version cleanly when its own version is exactly that
  // parent's, and every other parent left it as it was where the two diverged: what a three-way
  // merge gives, so no older version is put back over a newer one (main's older approvals over
  // the tranche's owner edit stay refused), and no line of it is moved or kept on its own (review
  // of PR 101: a revoked approval line moved within the file).
  const mergeBases = new Map();
  const mbOf = (a, b) => {
    const k = `${a} ${b}`;
    if (!mergeBases.has(k)) mergeBases.set(k, git(['merge-base', a, b], { cwd: root, allowFail: true }).stdout?.trim() || null);
    return mergeBases.get(k);
  };
  const cleanFrom = (p, parents, read, mine) => read(mine) === read(p) && onTrusted(p) && parents.every((q) => {
    if (q === p || read(q) === read(p)) return true;
    const m = mbOf(p, q);
    return Boolean(m) && read(m) === read(q);
  });
  let top;
  const ownerSet = () => (top === undefined ? (top = ownerBlock(root, refs, afile, heading, ownerCommit)) : top);
  const blocks = new Map();
  const blockOf = (rev) => {
    if (!blocks.has(rev)) blocks.set(rev, approvalsBlock(show(root, rev, afile), heading));
    return blocks.get(rev);
  };
  const range = [head, ...(base ? [`^${base}`] : []), ...(since ? [`^${since}`] : []), ...earlier.map((t) => `^${t}`)];
  const commits = git(['rev-list', ...range], { cwd: root }).split('\n').filter(Boolean);
  prefetch(root, range);
  const inRange = new Set(commits);
  const guarded = (f) => isOwnerSetting(f) || isInstructionFile(f) || f === afile || f === CONFIG_FILE || KEEP.includes(f);
  // Another parent's version was judged when the last commit that set it lies in the range.
  const setter = new Map();
  const setBy = (p, f) => { const k = `${p}\0${f}`; if (!setter.has(k)) setter.set(k, git(['--literal-pathspecs', 'log', '-1', '--format=%H', p, '--', f], { cwd: root }).trim()); return setter.get(k); };
  const judged = (p, f) => inRange.has(setBy(p, f));
  // ...or was judged where its setter landed (C19, the coordinator, 7 Nov: the copy's layer/10, 15
  // layer-sync, land and job-sync merges each carrying the owner's own website commit 314c284a2d on
  // the tranche into the layer, refused as settings changes not the owner's): a setter behind the
  // base (judged when it landed there, as onTrusted) credits the merge that only carries its
  // version. A merge that introduces its own version is still judged as its own,
  // and so is one that puts an older version back: credited only when every other parent left the
