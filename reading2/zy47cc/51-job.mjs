  git(['fetch', '-q', `--depth=${c.ahead_by + 1}`, 'origin', ref], { cwd: root });
  if (git(['cat-file', '-e', `${sha}^{commit}`], { cwd: root, allowFail: true }).code !== 0) git(['fetch', '-q', '--depth=1', 'origin', sha], { cwd: root });
  const count = () => Number(git(['rev-list', '--count', `refs/remotes/origin/${branch}`, `^${sha}`], { cwd: root }));
  const tr = `+refs/heads/${tranche}:refs/remotes/origin/${tranche}`;
  for (let n = 32; count() !== c.ahead_by; n *= 2) {
    if (!isShallow(root)) break;
    const r = n > 32768
      ? git(['fetch', '-q', '--unshallow', 'origin', tr, ref], { cwd: root, allowFail: true })
      : git(['fetch', '-q', `--deepen=${n}`, 'origin', tr, ref], { cwd: root, allowFail: true });
    if (r.code !== 0) fail(`this clone is shallow and could not read the job's range (git fetch: ${r.stderr.trim().split('\n').pop()}); run job complete again`);
  }
  const got = count();
  if (got !== c.ahead_by) fail(`this clone could not read the job's range: ${got} commit(s) after ${sha.slice(0, 10)} here, GitHub counts ${c.ahead_by}; nothing was judged; run job complete again`);
  return sha;
}

const onBranch = (root, id) => {
  const b = git(['symbolic-ref', '-q', '--short', 'HEAD'], { cwd: root, allowFail: true }).stdout.trim();
  const want = startBranch(readRows(root, id), id);
  if (b !== want) fail(`run this on branch ${want}, not ${b || 'a detached HEAD'}`);
  return b;
};
// The job's branch (ledger.mjs jobBranch): each job/<id>-<n> fetched first, so its own start row is read.
function branchOf(root, id, heads, ids, push) {
  if (!heads) fail('origin\'s job branches could not be read; nothing was done');
  if (push) for (const h of heads) if (h !== `job/${id}` && jobBranch(id, [h], ids) === h) fetchRef(root, h);
  return jobBranchAt(root, id, heads, ids, push ? 'refs/remotes/origin/' : 'refs/heads/');
}
// This checkout's job/* branches, as originJobs gives origin's (no origin: tests).
const localJobs = (root) => new Set(git(['for-each-ref', '--format=%(refname:short)', 'refs/heads/job/'], { cwd: root }).split('\n').filter(Boolean));

// The process pin a commit records as .process, or null when it has none.
export const pinAt = (root, ref) => git(['ls-tree', ref, '--', '.process'], { cwd: root, allowFail: true }).stdout.match(/^160000 commit ([0-9a-f]{40,64})\t/)?.[1] || null;
// Whether the tool at `have` is the pin or newer: the same commit, or the pin its ancestor (the pin
// fetched by its id when the process clone lacks it; still missing, it is not an ancestor).
function atLeast(toolRoot, pin, have) {
  if (pin === have) return true;
  if (git(['cat-file', '-e', `${pin}^{commit}`], { cwd: toolRoot, allowFail: true }).code !== 0) git(['fetch', '-q', 'origin', pin], { cwd: toolRoot, allowFail: true });
  return git(['merge-base', '--is-ancestor', pin, have], { cwd: toolRoot, allowFail: true }).code === 0;
}
const short = (sha) => String(sha).slice(0, 10);

// The tool running must be at least the branch's pin and the tranche's (defect sweep 4 Nov, #2
// and #4): the job runs .process, so after a merge of the tranche that moved the pin it ran the
// old tool, and a branch started on an old pin ran a tool without the tranche's fixes, while the
// gate runs the tranche's. Refused before any work, naming the step that fixes it. A tool newer
// than both stands (a COMPLETE job moves .process to amend its receipt: copy PR 40).
export function pinCheck(root, id, { toolRoot = TOOL_ROOT, tranche = null, what = 'it' } = {}) {
  const have = git(['rev-parse', 'HEAD'], { cwd: toolRoot, allowFail: true }).stdout.trim();
  if (!have) return;
  const mine = pinAt(root, 'HEAD');
  if (mine && !atLeast(toolRoot, mine, have)) fail(`this branch pins process ${short(mine)} and .process runs ${short(have)}, an older tool: run \`git submodule update .process\`, then ${what} again; nothing was run`);
  const theirs = tranche && pinAt(root, tranche);
  if (theirs && !atLeast(toolRoot, theirs, have)) fail(`the tranche runs process ${short(theirs)} and this branch ${short(mine || have)}: run \`${P3} job sync ${id}\`, then ${what} again; nothing was run`);
}

// The tranche's ref for the pin check: origin's when it can be read, else the local branch.
const trancheRef = (root, cfg) => {
  fetchRef(root, cfg.tranche, { allowFail: true });
  for (const r of [`refs/remotes/origin/${cfg.tranche}`, `refs/heads/${cfg.tranche}`]) if (git(['rev-parse', '-q', '--verify', r], { cwd: root, allowFail: true }).code === 0) return r;
  return null;
};

// Tracked changes, with .process left out when the job may hold it at another pin.
const dirty = (root, ignoreSubmodules) => git(['status', '--porcelain', '--untracked-files=no', ...(ignoreSubmodules ? ['--ignore-submodules=all'] : [])], { cwd: root });

// Whether origin's branch has commits this checkout lacks (BOB's merge of the tranche and its merge
// row, pushed to job/<id>: defect sweep 4 Nov, #5). Its tip is fetched when this clone lacks it.
function originAhead(root, branch) {
  const tip = remoteTip(root, branch);
  if (!tip) return false;
  if (git(['cat-file', '-e', `${tip}^{commit}`], { cwd: root, allowFail: true }).code !== 0) fetchRef(root, branch);
  return git(['merge-base', '--is-ancestor', tip, 'HEAD'], { cwd: root, allowFail: true }).code !== 0;
}

// Deepen a shallow clone until `ok` holds: by doubling, then whole (shallowBase's way).
function deepenUntil(root, refs, ok, what) {
  for (let n = 32; !ok(); n *= 2) {
    if (!isShallow(root)) return ok();
    const r = n > 32768
      ? git(['fetch', '-q', '--unshallow', 'origin', ...refs], { cwd: root, allowFail: true })
      : git(['fetch', '-q', `--deepen=${n}`, 'origin', ...refs], { cwd: root, allowFail: true });
    if (r.code !== 0) fail(`this clone is shallow and could not read ${what} (git fetch: ${r.stderr.trim().split('\n').pop()}); run job sync again`);
  }
  return true;
}

// A merge into the job's branch, by a merge commit when not a fast-forward. A conflict is left
// in place for the job to resolve: its own files are the only ones it changes.
function mergeIn(root, ref, { id, name, ff, msg, log, joinOwn = false }) {
  if (git(['merge-base', '--is-ancestor', ref, 'HEAD'], { cwd: root, allowFail: true }).code === 0) return false;
  const m = git(['merge', '-q', '--no-edit', ...(ff ? [] : ['--no-ff', '-m', msg]), ref], { cwd: root, allowFail: true });
  if (m.code !== 0) {
    let files = git(['diff', '--name-only', '--diff-filter=U'], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean);
    if (!files.length) { git(['merge', '--abort'], { cwd: root, allowFail: true }); fail(`git merge ${name} failed: ${(m.stderr || m.stdout).trim().split('\n').pop()}; nothing was merged`); }
    // Its own ledger entry (coordinator, 6 Nov: after layer sync every restarted job hit it, BLOCKED
    // on the branch, OPEN on the layer): the incoming entry with the job's own status laid over it,
    // as layer sync's job-branch step joins it. Refused only when a fixed field conflicts: both sides
    // changed it from the base, differently.
    const own = entryFile(id);
    // Only bringing in the base (the tranche or layer): BOB's push to the job's own branch keeps its say.
    if (joinOwn && files.includes(own)) {
      const stage = (k) => { const r = git(['show', `:${k}:${own}`], { cwd: root, allowFail: true }); try { return r.code === 0 ? JSON.parse(r.stdout) : null; } catch { return undefined; } };
      const [base, mine, theirs] = [stage(1), stage(2), stage(3)];
      const fixedClash = base && mine && theirs ? [...new Set([...Object.keys(mine), ...Object.keys(theirs)])].filter((k) => k !== 'status' && JSON.stringify(mine[k]) !== JSON.stringify(base[k]) && JSON.stringify(theirs[k]) !== JSON.stringify(base[k]) && JSON.stringify(mine[k]) !== JSON.stringify(theirs[k])) : [];
      if (mine && theirs && !fixedClash.length) {
        // What of the job's own copy the join leaves out, said (a job changes only its status; cold review of PR 202).
        const dropped = Object.keys(mine).filter((k) => k !== 'status' && JSON.stringify(mine[k]) !== JSON.stringify(theirs[k]));
        writeFileSync(join(root, own), JSON.stringify({ ...theirs, status: mine.status }, null, 2) + '\n');
        const added = git(['add', '--', own], { cwd: root, allowFail: true });
        if (added.code === 0) {
          files = files.filter((f) => f !== own);
          log(`${own}: ${name}'s entry, with ${id}'s own status (${mine.status?.state})${dropped.length ? `; the branch's own ${dropped.join(', ')} not kept (${name}'s stand: a job changes only its status)` : ''}`);
          if (!files.length) {
            const c = git(['commit', '-q', '--no-edit'], { cwd: root, allowFail: true });
            if (c.code === 0) { log(`merged ${name}`); return true; }
            fail(`${own} is joined, but the merge commit failed (${(c.stderr || c.stdout).trim().split('\n').pop()}): the merge is left in progress; \`git commit --no-edit\`, then run \`${P3} job sync ${id}\` again`);
          }
        }
      } else if (fixedClash.length) log(`${own}: both sides changed ${fixedClash.join(', ')}; resolve it by hand`);
    }
    fail(`${name} does not merge cleanly: ${files.join(', ')}. The merge is left in progress: resolve those files, \`git add\` them and \`git commit --no-edit\`, then run \`${P3} job sync ${id}\` again`);
  }
  log(`merged ${name}`);
  return true;
}

// job sync <id> (defect sweep 4 Nov, #3): brings the job's branch up to date. A depth-1 clone
// could not merge the tranche at all ("refusing to merge unrelated histories"), and BOB's merge
// pushes to job/<id>, which the job's next push then lacked. On job/<id>, or from a clean
// checkout with no local job/<id> (a replacement session at the tranche tip), which it checks
// out from origin: deepens both sides from GitHub's compare, as take-in does; merges origin's
// job/<id> (BOB's pushes; a fast-forward when it can) and then the tranche, by a merge commit;
// then `git submodule update .process`, so the tool is the branch's pin. Pushes nothing.
export function jobSync(root, id, { push = true, pushBranch = true, compare: cmp = compare, log = console.log } = {}) {
  const cfg = jobCfg(root, loadConfig(root), id, { push });
  if (push) fetchRef(root, cfg.tranche);
  const branch = push ? branchOf(root, id, originJobs(root), ledgerIds(root, `origin/${cfg.tranche}`), true) : startBranch(readRows(root, id), id);
  const slug = push ? repoSlug(root) : 'local/local';
  if (dirty(root, true)) fail('commit your work first: tracked files have changes; nothing was merged');
  const cur = git(['symbolic-ref', '-q', '--short', 'HEAD'], { cwd: root, allowFail: true }).stdout.trim();
  if (cur !== branch) {
    if (git(['rev-parse', '-q', '--verify', `refs/heads/${branch}`], { cwd: root, allowFail: true }).code === 0) onBranch(root, id);
    if (!push || !remoteTip(root, branch)) fail(`no branch ${branch} on origin; run this on branch ${branch}`);
    fetchRef(root, branch);
    git(['checkout', '-q', '-b', branch, `refs/remotes/origin/${branch}`], { cwd: root });
    log(`checked out ${branch} from origin`);
  }
  const tr = push ? `refs/remotes/origin/${cfg.tranche}` : `refs/heads/${cfg.tranche}`;
  const mine = `refs/remotes/origin/${branch}`;
  const pushed = push && !!remoteTip(root, branch);
  if (push) {
    fetchRef(root, cfg.tranche);
    if (pushed) fetchRef(root, branch);
    if (isShallow(root)) {
      // The depths from GitHub's compare (take-in's way), then deeper while a merge base is missing.
      const c = pushed ? cmp(slug, cfg.tranche, branch) : null;
      if (pushed && (!Number.isInteger(c?.ahead_by) || !Number.isInteger(c?.behind_by))) fail(`this clone is shallow and GitHub did not compare ${branch} with ${cfg.tranche}; run job sync again`);
      if (c) {
        git(['fetch', '-q', `--depth=${c.ahead_by + 1}`, 'origin', `+refs/heads/${branch}:${mine}`], { cwd: root });
        git(['fetch', '-q', `--depth=${c.behind_by + 1}`, 'origin', `+refs/heads/${cfg.tranche}:${tr}`], { cwd: root });
      }
      const refs = [`+refs/heads/${cfg.tranche}:${tr}`, ...(pushed ? [`+refs/heads/${branch}:${mine}`] : [])];
      const based = (ref) => git(['merge-base', 'HEAD', ref], { cwd: root, allowFail: true }).code === 0;
