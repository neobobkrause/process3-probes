// Record check (REC-10, your direction 1 Nov). Every commit in a range, merges included, is
// checked for files over the size limit, writes under transient paths, and changes to the
// approvals or to the settings under .claude/ that did not come from the owner's own commit
// through GitHub's website. The config it uses is read from the base, never from the change it
// judges.
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { checkLedger } from './ledger.mjs';
import { METRICS_DIR, metricsFile, rowsAt } from './metrics.mjs';
import { CONFIG_FILE, DEFAULTS, catBatch, exists, fail, gh, git, haveCommits, loadConfig, parseJSON, repoSlug, underPath } from './util.mjs';

const HEADING = /^#{1,6}\s.*approv/i;
const APPROVAL_WORDS = /approv/i;

// The approvals block: from its heading to the next "## " heading or the end of the file.
export function approvalsBlock(text, heading) {
  if (!text) return '';
  const lines = text.split('\n');
  const i = lines.findIndex((l) => l.trim() === heading.trim());
  if (i < 0) return '';
  let j = i + 1;
  while (j < lines.length && !lines[j].startsWith('## ')) j++;
  return lines.slice(i, j).join('\n').trim();
}


// A requirement on what a job hands in: the job's handover note ends with this exact last line:
// `-- filed under vetiver`.

// Did this commit come from the owner through GitHub's website? GitHub signs web edits as
// web-flow; the author must be the owner. Not verifiable: API commits made with the owner's
// token look the same. Injectable for tests. slug: the repository to ask about, when the
// caller knows it; else the one root's origin names.
export function webCommitByOwner(root, sha, owner, lookup = gh, slug) {
  if (!slug) { try { slug = repoSlug(root); } catch { slug = '(no origin)'; } }
  const c = lookup(['api', `repos/${slug}/commits/${sha}`], { allowFail: true });
  if (!c || typeof c !== 'object') return { ok: false, unread: true, why: 'could not read the commit from GitHub' };
  const ok = c.committer?.login === 'web-flow' && c.commit?.verification?.verified === true && c.author?.login === owner;
  return ok ? { ok } : {
    ok,
    why: `author ${c.author?.login ?? '?'}, committer ${c.committer?.login ?? '?'}, verified ${c.commit?.verification?.verified ?? '?'}`,
  };
}

// null only when the file is absent; a file that is there but cannot be read is an error.
const show = (root, rev, file) => (exists(root, rev, file) ? git(['show', `${rev}:${file}`], { cwd: root }) : null);
const GITHUB_COMMITTER = 'noreply@github.com';

// The owner-set block (build J, 3 Nov): for each ref, one git log of the approvals file finds
// the commit that set the block its tip holds (the newest whose block is the tip's and no
// parent's). Of the refs whose setter is the owner's own website commit, the newest setter by
// committer date gives the block: { ref, sha, at, block }, or null when there is none. GitHub
// is asked only about commits GitHub committed (a website commit always is). In a shallow clone
// the setup check passes history (the file's log, "%H %ct %ce %P" lines, from GitHub) and need
// (fetches a commit it reads by its id), so no history is deepened.
// needAll (C50): fetches the commits it is given in one fetch (the copy's shallow pin clone fetched
// each of the file's commits and their parents by a fetch of its own, a network round trip each);
// whatever it leaves out is fetched one by one by need, as before.
const CHUNK = 8;
export function ownerBlock(root, refs, file, heading, isOwner, { history, need, needAll } = {}) {
  const memo = new Map();
  const blockOf = (rev) => {
    if (!memo.has(rev)) { need?.(rev); memo.set(rev, approvalsBlock(show(root, rev, file), heading)); }
    return memo.get(rev);
  };
  // Every commit the walk may read, read at once: one batch-check for which the clone holds, one
  // fetch of the rest (needAll), one cat-file --batch of the file at each. A commit still lacking is
  // left to blockOf.
  const prefill = (revs) => {
    let have = haveCommits(root, revs);
    const lack = revs.filter((x) => !have.has(x) && /^[0-9a-f]{40}$/.test(x));
    if (lack.length && needAll) { needAll(lack); have = haveCommits(root, revs); }
    const held = revs.filter((x) => have.has(x) && !memo.has(x));
    const texts = catBatch(root, held.map((x) => `${x}:${file}`));
    if (texts === null) return;
    for (const x of held) memo.set(x, approvalsBlock(texts.has(`${x}:${file}`) ? texts.get(`${x}:${file}`) : null, heading));
  };
  let best = null;
  for (const ref of refs) {
    const r = history ? history(ref) : git(['--literal-pathspecs', 'log', '--format=%H %ct %ce %P', ref, '--', file], { cwd: root, allowFail: true });
    if (r.code !== 0) continue;
    // In chunks of the log as the walk reaches them, so the commits fetched are about those the walk
    // reads (cold review of C50: the whole log fetched left older commits as shallow roots in the clone).
    const all = r.stdout.split('\n').filter(Boolean);
    let filled = 0;
    const fill = (i) => {
      if (i < filled) return;
      filled = i + CHUNK;
      prefill([...new Set(all.slice(i, filled).flatMap((l) => { const [sha, , , ...ps] = l.split(' '); return [sha, ...ps]; }).filter(Boolean))]);
    };
    const tip = blockOf(ref);
    for (const [i, l] of all.entries()) {
      fill(i);
      // A root commit's %P is empty: no parent, never '' (C50: '' read the index's copy of the file,
      // the tip's block, so a block set by the root commit was never found).
      const [sha, at, ce, ...ps] = l.split(' ');
      const parents = ps.filter(Boolean);
      if (blockOf(sha) !== tip || parents.some((p) => blockOf(p) === tip)) continue;
      if (ce === GITHUB_COMMITTER && isOwner(sha)?.ok === true && (!best || Number(at) > best.at)) best = { ref, sha, at: Number(at), block: tip };
      break;
    }
  }
  return best;
}

// A path's tree entry at a commit, mode and object together, so a mode-only change counts.
const entryOf = (root, rev, file) => {
  const out = git(['--literal-pathspecs', 'ls-tree', '-z', rev, '--', file], { cwd: root });
  const hit = out.split('\0').find((l) => l.endsWith(`\t${file}`));
  return hit ? hit.split('\t')[0].replace(/ \w+ /, ' ') : null;
};

// Plain instruction files: CLAUDE.md and CLAUDE.local.md anywhere, and .claude/rules/**/*.md.
// Anything else in a .claude directory (any letter case, at any depth, or .claude itself as
// a link or a pin) and .mcp.json anywhere is the owner's: settings, hooks, agents, skills,
// commands, output styles, any file (confirming review of PR 16). Like the approvals, only
// the owner's own website commit may change them. A deny rule cannot stop an edit made
// through the shell; this check holds every route (Bob's CLAUDE.md approvals: sessions never
// change permission settings).
// On process3 itself the required record check runs from main's copy of the tool
// (pull_request_target runs from the default branch), so these rules judge process3's own
// pull requests only once the tranche reaches main.
// CLAUDE.md and CLAUDE.local.md count as instruction files only outside any .claude directory
// or directly in one; inside .claude/agents, skills or any subdirectory they are the owner's
// (third confirming review of PR 16).
const isInstructionFile = (f) => {
  const segs = f.split('/');
  const name = ['CLAUDE.md', 'CLAUDE.local.md'].includes(segs.at(-1))
    && segs.every((x, i) => x.toLowerCase() !== '.claude' || i === segs.length - 2);
  return name || /(^|\/)\.claude\/rules\/(.+\/)?[^/]+\.md$/i.test(f);
};
const isOwnerSetting = (f) => !isInstructionFile(f)
  && (f.split('/').some((seg) => seg.toLowerCase() === '.claude') || basename(f).toLowerCase() === '.mcp.json');
const PROTECTED = ['.github/workflows/', '.process', CONFIG_FILE, 'tool/', 'schema/'];
// Files the checks themselves stand on: removing one is a finding, not a notice.
const KEEP = ['tool/p3.mjs', '.process', '.github/workflows/ci.yml', '.github/workflows/record-pr.yml', '.github/workflows/process-gate.yml', '.github/workflows/process-record.yml'];

// Files a commit introduces: against its parent, or, for a merge, what the merge itself
// wrote. An ordinary file in a merge is carried when it equals any parent's. A guarded file
// (the owner's settings, instruction files, the approvals file, the config, the files the
// checks stand on) is carried only when it equals its version at the start of the checked
// range (the base), or a parent's version that a commit inside the range set, and so was
// judged there, or one whose setter lies behind the base (judged when it landed) when the merge
// takes it cleanly (C19); this holds for every parent, the first included, so a merge that keeps
// an old copy from either side is judged as its own change (confirming reviews of PR 16).
// Paths read with -z, so any name is safe.
// A version set inside the range by the owner's own commit that the owner has since replaced (stale,
// C21) is not carried: the merge that brings it is its own change.
function introduced(root, sha, parents, { guarded = () => false, judged = () => false, credited = () => false, stale = () => false, base } = {}) {
  const names = (args) => git(['diff-tree', '-r', '-z', '--no-commit-id', '--name-only', '--no-renames', ...args], { cwd: root }).split('\0').filter(Boolean);
  if (parents.length <= 1) return names([...(parents.length ? [] : ['--root']), sha]);
  const fromBase = base ? names([base, sha]).filter(guarded) : [];
  return [...new Set([...names([parents[0], sha]), ...fromBase])].filter((f) => {
    const e = entryOf(root, sha, f);
    if (!guarded(f)) return !parents.some((p) => entryOf(root, p, f) === e);
    if (e === (base ? entryOf(root, base, f) : null)) return false;
    // A merge that takes a parent's version brings nothing of its own when that version was judged:
    // set inside the range, or set by a commit already judged behind the base, taken cleanly
    // (credited). A version that matches no parent is the merge's own change.
    return !parents.some((p) => entryOf(root, p, f) === e && ((judged(p, f) && !stale(p, f)) || credited(p, f, parents)));
  });
}

// record_since (Bob, 2 Nov, before the log; unverified): a product whose history predates Process3 names
// the last commit before the process arrived; that commit and everything before it are not
// checked. It is a key that weakens a check, so, like the approvals, only the owner's own
// website commit may set or change it (recordCheck), with one exception (question 16,
// Bob, 2 Nov, before the log; unverified): any author may set it to the base's commit or an ancestor of it,
// since the base already leaves that history out and so it hides nothing the change brings
// (onboarding). On a later range whose base does not hold it, the commit that set it needs
// the owner's website commit again. It is used only while the base has no
// config yet (before the tranche first reaches main): once the base has one, the base itself
// already leaves out the old history, so record_since is ignored and cannot be abused. And it
// must lie before every commit in the head's history that adds the config, so it can never
// hide a commit made under the process.
export function recordSince(root, { base, head = 'HEAD' } = {}) {
  const has = (ref) => exists(root, ref, CONFIG_FILE);
  if (base && has(base)) return { since: null };
  const since = loadConfig(root, head).record_since;
  if (!since) return { since: null };
  const bad = (why) => ({ since: null, finding: { check: 'config', file: CONFIG_FILE, line: 1, message: `record_since ${String(since).slice(0, 10)} is not used: ${why}` } });
  const r = git(['rev-parse', '-q', '--verify', `${since}^{commit}`], { cwd: root, allowFail: true });
  if (r.code !== 0) return bad('no such commit here');
  const sha = r.stdout.trim();
  const adders = git(['log', '--full-history', '--diff-filter=A', '--format=%H', head, '--', CONFIG_FILE], { cwd: root }).split('\n').filter(Boolean);
  if (!adders.length) return bad(`the head has no commit that adds ${CONFIG_FILE}`);
  const late = adders.find((a) => a === sha || git(['merge-base', '--is-ancestor', sha, a], { cwd: root, allowFail: true }).code !== 0);
  if (late) return bad(`it is not before ${late.slice(0, 10)}, a commit that adds the process config`);
