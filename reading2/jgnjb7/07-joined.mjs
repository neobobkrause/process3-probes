// ===== file: branches.mjs (continued) =====

    pulls: (slug) => pages(`repos/${slug}/pulls?state=all&per_page=100`),
    openPulls: (slug) => pages(`repos/${slug}/pulls?state=open&per_page=100`),
    activity: (slug) => pages(`repos/${slug}/activity?time_period=day&per_page=100`),
  };
}

// One push of deletes, each with its lease; git's own result. push: for the tests.
const gitPush = (root, args) => git(['push', '--porcelain', ...args], { cwd: root, allowFail: true });

export function prune(root, { slug, dryRun = false, ref, run, io = githubIO(), push = gitPush, clock = Date.now, env = process.env, log = console.log } = {}) {
  if (!slug) fail('branches prune needs the repository (owner/name)');
  const def = io.defaultBranch(slug);
  if (!def) fail(`could not read ${slug}'s default branch from GitHub; nothing was deleted`);
  if (isShallow(root)) fail('branches prune needs a full clone (fetch-depth 0): a shallow one counts commits wrongly; nothing was deleted');
  const f = fetchRetry(['fetch', '-q', '--prune', 'origin', '+refs/heads/*:refs/remotes/origin/*'], { cwd: root });
  if (f.code !== 0) fail(`could not fetch origin's branches: ${f.stderr.trim()}; nothing was deleted`);
  if (git(['rev-parse', '-q', '--verify', remote(def)], { cwd: root, allowFail: true }).code !== 0) fail(`origin has no ${def}; nothing was deleted`);
  // The tranche's name from the default branch's config (anchored there), never from the run's ref.
  const defCfg = loadConfig(root, remote(def));
  const tranche = defCfg.tranche;

  // The branch the run stands on, which gives the config and the approvals: the default branch,
  // or the tranche for a run dispatched there. A dry run on any other ref (or none) reads the
  // default branch; a deleting run anywhere else, or outside the shim, is refused.
  const on = ref === `refs/heads/${tranche}` ? tranche : def;
  if (!dryRun) {
    if (ref !== `refs/heads/${on}`) fail(`branches prune deletes only from a run on ${def} or ${tranche}, not ${ref === undefined ? 'a run with no --ref' : ref}; nothing was deleted (--dry-run lists)`);
    const why = notTheShim(env, on, { dispatchOnly: on !== def });
    if (why) fail(`branches prune deletes only in the product's ${SHIM_FILE} ${on === def ? `on ${def}` : `dispatched on ${tranche}`}, and ${why}; nothing was deleted (--dry-run lists)`);
  }
  const base = remote(on);
  if (git(['rev-parse', '-q', '--verify', base], { cwd: root, allowFail: true }).code !== 0) fail(`origin has no ${on}; nothing was deleted`);
  const baseSha = git(['rev-parse', base], { cwd: root });
  const cfg = loadConfig(root, base);
  if (cfg.tranche !== tranche) fail(`${on}'s config names the tranche ${cfg.tranche}, ${def}'s names ${tranche}; nothing was deleted`);
  // state_branch is not anchored: a tranche run whose config names another state branch is refused.
  if (cfg.state_branch !== defCfg.state_branch) fail(`${on}'s config names the state branch ${cfg.state_branch}, ${def}'s names ${defCfg.state_branch}; nothing was deleted`);

  // The gate: Bob's sentence in the approvals block on that branch's tip.
  const { file, heading } = cfg.approvals;
  const block = exists(root, base, file) ? approvalsBlock(git(['show', `${base}:${file}`], { cwd: root }), heading) : '';
  const approved = approves(block);
  if (!approved) {
    const why = `the approvals block (${file}, "${heading}") on ${on} at ${baseSha.slice(0, 10)} does not carry the branch cleanup approval ("${MARKER}"); nothing ${dryRun ? 'would be' : 'was'} deleted`;
    if (!dryRun) { log(`::notice::branches prune: ${why}`); return { ok: true, approved: false, dryRun, deleted: [], failed: [], kept: {}, candidates: [] }; }
    log(`branches prune (dry run): ${why}; the branches the rules would delete once approved follow`);
  }

  if (git(['rev-parse', '-q', '--verify', remote(tranche)], { cwd: root, allowFail: true }).code !== 0) fail(`origin has no ${tranche}, the tranche the config names; nothing was deleted`);
  const trancheSha = git(['rev-parse', remote(tranche)], { cwd: root });

  const pulls = io.pulls(slug);
  if (!pulls) fail(`could not read ${slug}'s pull requests; nothing was deleted`);
  const activity = io.activity(slug);
  if (!activity) fail(`could not read ${slug}'s activity log; nothing was deleted`);

  const cutoff = clock() - RECENT_HOURS * 3600 * 1000;
  const protectedNames = new Set([def, 'main', tranche, DEFAULTS.tranche, DEFAULTS.state_branch, cfg.state_branch]);
  const openRefs = new Set(pulls.filter((p) => p.state === 'open').flatMap((p) => [p.head?.ref, p.base?.ref]).filter(Boolean));
  const own = new Map();
  for (const p of pulls) {
    if (p.head?.repo?.full_name !== slug || !p.head?.ref) continue;
    if (!own.has(p.head.ref)) own.set(p.head.ref, []);
    own.get(p.head.ref).push(p);
  }
  // An entry whose time cannot be read counts as recent (fails closed).
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

// ===== file: ledger-base.test.mjs =====

// C36 (the coordinator, 8 Nov): on the copy a layer-12 job's publish refused "ledger:
// process/ledger/provenance.json:1: job screens-inquiry may change only its own entry". provenance's
// land changed its entry on layer/12 after screens-inquiry started; publish's job sync merged the
// layer tip into the job branch without pushing, and the base (the shallow path's: GitHub's merge
// base of the branch as pushed) was still the job's start. What the layer already holds is not the
// job's: the base moves to the merge base with the tip the branch merged.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { baseAfterMerge } from '../lib/job.mjs';
import { checkLedger } from '../lib/ledger.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const E = (id, state = 'WORKING', over = {}) => entry(id, { layer: 12, status: { state }, ...over });
function layer() {
  const root = makeRepo({ 'process/ledger/si.json': E('si', 'OPEN'), 'process/ledger/prov.json': E('prov', 'WORKING'), 'process/ledger/other.json': E('other', 'OPEN') });
  git(['branch', '-m', 'layer/12'], { cwd: root });
  const start = git(['rev-parse', 'HEAD'], { cwd: root });
  // screens-inquiry's job starts from the layer tip.
  git(['checkout', '-q', '-b', 'job/si'], { cwd: root });
  commit(root, { 'process/ledger/si.json': E('si', 'WORKING') }, 'job start si');
  commit(root, { 'src/si/x.mjs': 'export const x = 1;\n' }, 'si work');
  // provenance lands on the layer: its entry COMPLETE there.
  git(['checkout', '-q', 'layer/12'], { cwd: root });
  commit(root, { 'process/ledger/prov.json': E('prov', 'COMPLETE') }, 'Merge prov land');
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  // publish's job sync: the layer tip merged into the job branch, not pushed.
  git(['checkout', '-q', 'job/si'], { cwd: root });
  git(['merge', '-q', '--no-edit', 'layer/12'], { cwd: root });
  return { root, start, tip };
}

test('C36: a sibling\'s land on the layer, merged into the job branch, is not the job\'s ledger change; the base moves to the merged tip', () => {
  const { root, start, tip } = layer();
  // The copy's refusal, with the start as the base:
  assert.match(checkLedger(root, { base: start, branch: 'job/si' }).map((f) => `${f.file}: ${f.message}`).join('\n'), /process\/ledger\/prov\.json: job si may change only its own entry/);
  const said = [];
  const base = baseAfterMerge(root, start, 'refs/heads/layer/12', { log: (l) => said.push(l) });
  assert.equal(base, tip);
  assert.match(said[0], /^base: \w{10} moved to \w{10}, the layer\/12 tip this branch merged: what it already holds is not this job's$/);
  assert.deepEqual(checkLedger(root, { base, branch: 'job/si' }), [], 'its own entry\'s status only: no finding');
  // A real foreign-entry edit by the job still fails with the moved base.
  commit(root, { 'process/ledger/other.json': E('other', 'WORKING') }, 'si touches another entry');
  assert.match(checkLedger(root, { base, branch: 'job/si' }).map((f) => `${f.file}: ${f.message}`).join('\n'), /process\/ledger\/other\.json: job si may change only its own entry/);
});

test('C36: the base never moves to a tip the branch has not merged, nor back', () => {
  const { root, start, tip } = layer();
  // The layer moves on after the job's merge: the base is the tip it merged, not the newer one.
  git(['checkout', '-q', 'layer/12'], { cwd: root });
  commit(root, { 'process/ledger/other.json': E('other', 'WORKING') }, 'Merge other land');
  git(['checkout', '-q', 'job/si'], { cwd: root });
  assert.equal(baseAfterMerge(root, start, 'refs/heads/layer/12'), tip);
  // A base already past the merge base (a newer one given) is kept.
  assert.equal(baseAfterMerge(root, tip, 'refs/heads/layer/12'), tip);
  // No such ref: the base as given.
  assert.equal(baseAfterMerge(root, start, 'refs/heads/layer/99'), start);
  // A branch that never merged the layer: its start stays the base.
  git(['checkout', '-q', '-b', 'job/x', start], { cwd: root });
  commit(root, { 'process/ledger/si.json': E('si', 'BLOCKED', { status: { state: 'BLOCKED', reason: 'r' } }) });
  assert.equal(baseAfterMerge(root, start, 'refs/heads/layer/12'), start);
});

// As the copy's publish ran it: a shallow clone, the job branch as pushed (no merge of the layer
// yet), publish's job sync merging the layer tip locally, then job complete's shallow base (GitHub's
// compare of the pushed branch: the job's start) moved to the merged tip.
test('C36: in a shallow clone, after publish\'s local merge of the layer, the base is the merged tip and the ledger check passes', async () => {
  const { mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { shallowBase } = await import('../lib/job.mjs');
  const { fetchBranch } = await import('../lib/util.mjs');
  const { root, start, tip } = layer();
  // origin: the layer tip with the sibling's land, the job branch as pushed before the merge.
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['push', '-q', bare, 'layer/12', 'job/si~1:refs/heads/job/si'], { cwd: root });
  const c = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', '--depth', '1', '--branch', 'job/si', `file://${bare}`, c], { cwd: tmpdir() });
  for (const [k, v] of [['user.name', 't'], ['user.email', 't@t']]) git(['config', k, v], { cwd: c });
  fetchBranch(c, 'layer/12');
  // job sync deepens as far as the merge needs (job.mjs); here a few commits, the clone kept shallow below them.
  git(['fetch', '-q', '--deepen=2', 'origin', 'job/si', 'layer/12'], { cwd: c });
  git(['merge', '-q', '--no-edit', 'refs/remotes/origin/layer/12'], { cwd: c });
  const read = (slug, base, head) => ({ merge_base_commit: { sha: git(['merge-base', base, head], { cwd: bare }) }, ahead_by: Number(git(['rev-list', '--count', `${base}..${head}`], { cwd: bare })) });
  const stale = shallowBase(c, 'o/r', 'layer/12', 'job/si', read);
  assert.equal(stale, start, 'GitHub\'s base of the pushed branch: the job\'s start');
  assert.ok(checkLedger(c, { base: stale, branch: 'job/si' }).some((f) => /prov\.json/.test(f.file)), 'the copy\'s refusal');
  const base = baseAfterMerge(c, stale, 'refs/remotes/origin/layer/12');
  assert.equal(base, tip);
  assert.deepEqual(checkLedger(c, { base, branch: 'job/si' }), []);
});

// ===== file: pin.test.mjs =====

// pin move (measured 3-4 Nov: a process3 fix reached the product only after a separate pin-move
// session): the short session's create_session call, from the product's tranche at clone depth 1,
// fetching the pin without --depth, setup check --at HEAD, and merge --plain.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRepo } from './helpers.mjs';
import { pinCheck, pinMove } from '../lib/pin.mjs';
import { git } from '../lib/util.mjs';

const quiet = () => {};
// The process repo (pinMove's processRoot; the tool's own by default): its origin's tranche holds
// PIN; UNRELEASED is a local build commit on no released branch, TAG an annotated tag's object id.
const ORIGIN = makeRepo({ 'README.md': 'process' });
git(['branch', '-M', 'tranche'], { cwd: ORIGIN });
git(['branch', 'main'], { cwd: ORIGIN });
const PROC = makeRepo({ 'README.md': 'x' });
git(['remote', 'add', 'origin', ORIGIN], { cwd: PROC });
git(['fetch', '-q', 'origin'], { cwd: PROC });
const PIN = git(['rev-parse', 'origin/tranche'], { cwd: PROC });
const UNRELEASED = git(['rev-parse', 'HEAD'], { cwd: PROC });
git(['tag', '-a', '-m', 'v', 'v1', PIN], { cwd: PROC });
const TAG = git(['rev-parse', 'v1'], { cwd: PROC });
const REPORT = 'session_01RAN5eniJPZwnDgHRYfWFQb';
// The product's open pull requests, and the acts --supersedes takes, recorded.
const pinIO = (prs = []) => {
  const acts = [];
  return { acts, io: { list: () => prs, comment: (slug, n, body) => acts.push(['comment', slug, n, body]), close: (slug, n) => acts.push(['close', slug, n]) } };
};
const none = pinIO().io;

test('pin move prints one short session: product tranche, depth 1, pin fetched without --depth, setup check --at HEAD, merge --plain', () => {
  const out = [];
  const { call, prompt } = pinMove(makeRepo({ 'README.md': 'x' }), 'neobobkrause/acmewidget-copy', { pin: PIN, processRoot: PROC, report: REPORT, why: 'BOB wakes on events', io: none, log: (m) => out.push(m) });
  assert.deepEqual([call.source_url, call.source_revision, call.clone_depth], ['https://github.com/neobobkrause/acmewidget-copy', 'tranche', 1]);
  assert.equal(call.prompt, prompt);
  assert.ok(prompt.includes(`\`git -C .process fetch origin ${PIN}\` (no --depth`));
  assert.doesNotMatch(prompt.split('\n').find((l) => l.includes('-C .process fetch')), /--depth \d/);
  assert.ok(prompt.includes('`node .process/tool/p3.mjs setup check --at HEAD`'));
  assert.match(prompt, /`node \.process\/tool\/p3\.mjs merge <that pull request> --plain --as pin --no-review "/);
  assert.match(prompt, /"base":"tranche"/);
  assert.ok(prompt.includes(REPORT));
  // Review of PR 72: each gap by its kind; the approvals block and the owner's settings untouched.
  assert.ok(prompt.includes('copy `.process/shims/<f>` to `.github/workflows/<f>`'));
  assert.ok(prompt.includes('replace the old process lines below the approvals block with those of `.process/shims/CLAUDE.process.md` ({tranche} as tranche), changing nothing in the approvals block'));
  assert.match(prompt, /A gap in `\.claude\/settings\.json` \(the owner's file\), or any other gap: send it to `session_/);
  assert.match(out.at(-1), /^next act: start the pin move with create_session:\n\{/);
});

// Copy, 4 Nov: with no --pin it took the product's own tranche tip, and a positional sha was ignored.
test('pin move needs --pin, a commit of the process repo; refuses a positional sha, a bad slug, report or pin', () => {
  const root = makeRepo({ 'README.md': 'x' });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  const own = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.throws(() => pinMove(root, 'o/r', { processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), (e) => e.message === 'pin move needs --pin <a process3 commit, 40 hex>');
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, rest: [PIN.slice(0, 10)], processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), new RegExp(`give the commit as --pin ${PIN.slice(0, 10)}`));
  assert.throws(() => pinMove(root, 'o/r', { rest: ['extra'], processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), /takes only the slug; not "extra"/);
  assert.throws(() => pinMove(root, 'o/r', { pin: own, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), new RegExp(`--pin ${own} is not a commit on process3's tranche or main`));
  for (const pin of [UNRELEASED, TAG]) {
    const f = pinIO([PR(106, 'p3/pin-0123456789')]);
    assert.throws(() => pinMove(root, 'o/r', { pin, supersedes: '106', processRoot: PROC, report: REPORT, why: 'w', io: f.io, log: quiet }), /is not a commit on process3's tranche or main/);
    assert.deepEqual(f.acts, [], 'refused before --supersedes closes anything');
  }
  assert.equal(pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }).pin, PIN);
  assert.throws(() => pinMove(root, 'nope', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), /owner\/repo/);
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, why: 'w', io: none, log: quiet }), /--report <session id>/);
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, io: none, log: quiet }), /--why/);
  assert.throws(() => pinMove(root, 'o/r', { pin: 'abc', processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet }), /--pin/);
});

// Measured 4 Nov on the copy: two pin moves ran at once twice in 20 minutes; PR 108, cut before
// PR 106 merged, conflicted on the .process gitlink.
const PR = (number, ref) => ({ number, head: { ref } });
test('pin move refuses while a pin move is open on the product, naming it; other pull requests do not count', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const f = pinIO([PR(7, 'bob/plan'), PR(106, 'p3/pin-0123456789')]);
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: f.io, log: quiet }), (e) => e.message === 'a pin move is open: PR 106 (p3/pin-0123456789); wait for it or close it');
  assert.deepEqual(f.acts, [], 'nothing written');
  assert.equal(pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: pinIO([PR(7, 'bob/plan')]).io, log: quiet }).pin, PIN);
  // The session's own check, right before it pushes.
  assert.throws(() => pinCheck('o/r', { io: f.io, log: quiet }), (e) => e.message === 'a pin move is open: PR 106 (p3/pin-0123456789); wait for it or close it');
  const logs = [];
  pinCheck('o/r', { io: none, log: (m) => logs.push(m) });
  assert.deepEqual(logs, ['no pin move is open on o/r']);
});

test('pin move --supersedes <pr> closes that open pin move with a comment, keeps its branch, and goes on', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const f = pinIO([PR(106, 'p3/pin-0123456789')]);
  const out = [];
  const r = pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', supersedes: '106', io: f.io, log: (m) => out.push(m) });
  assert.equal(r.pin, PIN);
  assert.deepEqual(f.acts.map((a) => a.slice(0, 3)), [['comment', 'o/r', 106], ['close', 'o/r', 106]], 'a comment, then the close; no branch deleted');
  assert.match(f.acts[0][3], new RegExp(`Superseded by a newer pin move, to process3 ${PIN}.*the branch p3/pin-0123456789 is kept`));
  assert.match(out[0], /closed pull request 106 \(p3\/pin-0123456789\) as superseded; its branch is kept/);
  // Only an open pin move can be superseded, and only when no other stays open.
  for (const [prs, n, msg] of [
    [[PR(106, 'p3/pin-0123456789')], '7', /--supersedes 7: pull request 7 is not an open pin move on o\/r \(open: PR 106/],
    [[PR(7, 'bob/plan')], '7', /pull request 7 is not an open pin move/],
    [[PR(106, 'p3/pin-0123456789'), PR(108, 'p3/pin-abcdef0123')], '106', /a pin move is open: PR 108 \(p3\/pin-abcdef0123\)/],
    [[PR(106, `p3/pin-${PIN.slice(0, 10)}`)], '106', new RegExp(`already moves the pin to ${PIN.slice(0, 10)}`)],
    [[PR(106, 'p3/pin-0123456789')], 'x', /--supersedes <the open pin move's pull request number>/],
    [[PR(1, 'p3/pin-0123456789')], true, /--supersedes <the open pin move's pull request number>/],
  ]) {
    const g = pinIO(prs);
    assert.throws(() => pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', supersedes: n, io: g.io, log: quiet }), msg);
    assert.deepEqual(g.acts, [], 'nothing closed');
  }
});

test('the pin-move session checks for an open pin move right before it pushes, and branches from the tranche tip it fetches then', () => {
  const { prompt } = pinMove(makeRepo({ 'README.md': 'x' }), 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet });
  const lines = prompt.split('\n');
  const at = (re) => lines.findIndex((l) => re.test(l));
  const push = at(/github push origin p3\/pin-\S+ --set-upstream/);
  const check = at(/p3\.mjs pin check o\/r`/);
  const branch = at(new RegExp(`git checkout -q -b p3/pin-${PIN.slice(0, 10)} FETCH_HEAD`));
  assert.ok(check > 0 && branch > 0 && push > 0);
  assert.ok(branch < check && check === push - 1, 'the check is the step before the push; the branch is cut after the work, from a fresh fetch');
  assert.ok(lines[branch].includes(`git fetch origin tranche --depth 1\`, then \`git checkout -q -b p3/pin-${PIN.slice(0, 10)} FETCH_HEAD\`, then \`git cherry-pick refs/p3/pin-base..p3-pin-work\``), lines[branch]);
  assert.ok(at(/setup check --at HEAD` again/) > branch, 'setup check runs again on the fresh base');
  assert.match(lines[0 + at(/^1\. /)], /git checkout -q -b p3-pin-work FETCH_HEAD/);
});

// PD-23 (coordinator, 9 Nov): the pin move reaches every open layer itself, after its merge.
test('the pin-move session moves each open layer\'s pin after its merge (layer pin --open), before it reports', () => {
  const { prompt } = pinMove(makeRepo({ 'README.md': 'x' }), 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: none, log: quiet });
  const lines = prompt.split('\n');
  const at = (re) => lines.findIndex((l) => re.test(l));
  const merge = at(/merge <that pull request> --plain --as pin/);
  const sync = at(/^12\. `node \.process\/tool\/p3\.mjs layer pin --open` \(PD-23\)/);
  const report = at(/^14\. Send /);
  assert.ok(merge > 0 && sync === merge + 1 && report > sync, prompt);
});

// 5 Nov: from a process3-only session the product's pull requests cannot be listed, and pin move
// refused; the session it prints runs pin check before it pushes, which guards it.
test('pin move from a session that cannot list the product\'s pull requests prints the call with a note that the session\'s own pin check guards it', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const out = [];
  const r = pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', io: { list: () => null }, log: (m) => out.push(m) });
  assert.equal(r.pin, PIN);
  assert.match(out[0], /^note: could not list o\/r's open pull requests, so whether a pin move is open is unknown from here; the pin-move session's own `.*pin check o\/r` \(step 8, before it pushes\) guards it$/);
  assert.match(r.prompt, /^8\. `.*pin check o\/r`/m);
  assert.match(out.at(-1), /^next act: start the pin move with create_session:/);
  // --supersedes must find the one it closes: unread, it still refuses; and pin check, the guard, refuses.
  assert.throws(() => pinMove(root, 'o/r', { pin: PIN, processRoot: PROC, report: REPORT, why: 'w', supersedes: '106', io: { list: () => null, comment: () => assert.fail('commented'), close: () => assert.fail('closed') }, log: quiet }), /could not list o\/r's open pull requests/);
  assert.throws(() => pinCheck('o/r', { io: { list: () => null }, log: quiet }), /could not list o\/r's open pull requests/);
});

// ===== file: notice.test.mjs =====

// The provider-change route: a provider with two users, a notice at the provider's merge, the
// users' START and status, and the notice answered at the user's merge.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, block } from '../lib/github.mjs';
import { jobComplete, jobStart } from '../lib/job.mjs';
import { merge, triageLast } from '../lib/merge.mjs';
import { readRows } from '../lib/metrics.mjs';
import { prPresence } from '../lib/github.mjs';
import { changedIds, noticeFile, noticeLine, notices, mergedHere, providerChange, providerNotice, recordAtMerge, unanswered, withdrawNotice } from '../lib/notice.mjs';
import { fetchState, readState } from '../lib/state.mjs';
import { owedNotices, status } from '../lib/status.mjs';
import { importFree, noticeTriage, parseTriage, recordTriage, shares, sizes, triageAtMerge } from '../lib/triage.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo, onState, openPassed } from './helpers.mjs';

const quiet = () => {};
const passing = (name) => `import test from 'node:test'; test('${name}', () => {});\n`;
const REQ = '# p\n\n- **R1** *(not yet met: x)* signs a token\n- **R2** checks a token\n- **R3** keeps a log\n';
const MODULES = { modules: [
  { id: 'p', paths: ['src/p/'] },
  { id: 'u1', paths: ['src/u1/'], uses: ['p'] },
  { id: 'u2', paths: ['src/u2/'], uses: ['p'] },
  { id: 'other', paths: ['src/other/'] },
] };

// A provider p and its users u1 and u2 (and a module that uses nothing), with an origin.
function product() {
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': MODULES,
    ...Object.fromEntries(['p', 'u1', 'u2', 'other'].flatMap((id) => [
      [`process/ledger/${id}.json`, entry(id)],
      [`req/${id}.md`, id === 'p' ? REQ : `# ${id}\n\n- **R1** met\n`],
      [`test/${id}/a.test.mjs`, passing(`${id} ok`)],
    ])),
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: root });
  return root;
}
const NOTICE = { row: 'notice', key: 'p:7', provider: 'p', ids: ['R1', 'R2', 'R4'], pr: 7, users: ['u1', 'u2'] };

test('changedIds: struck, reworded, added and removed requirements; an unchanged one is not', () => {
  const after = '# p\n\n- **R1** signs a token\n- **R2** checks a token and its age\n- **R4** rotates keys\n';
  assert.deepEqual(changedIds(REQ, after), ['R1', 'R2', 'R3', 'R4']);
  assert.deepEqual(changedIds(REQ, REQ), []);
});

test('a provider notice names the changed ids and the modules whose uses name the provider', () => {
  const root = product();
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const head = commit(root, { 'src/p/a.mjs': 'export const sign = 2;\n', 'req/p.md': REQ.replace('*(not yet met: x)* ', '').replace('checks a token', 'checks a token and its age') });
  const cfg = loadConfig(root);
  assert.deepEqual(providerNotice(root, cfg, { provider: 'p', requirements: 'req/p.md', base, head, pr: 7 }),
    { key: 'p:7', provider: 'p', ids: ['R1', 'R2'], pr: 7, users: ['u1', 'u2'], source: 1, exports_read: { base, head, files: [] } });
  assert.equal(providerNotice(root, cfg, { provider: 'u1', requirements: 'req/u1.md', base, head, pr: 8 }), null, 'no change, no notice');
  const other = commit(root, { 'req/other.md': '# other\n\n- **R1** met, reworded\n' });
  assert.equal(providerNotice(root, cfg, { provider: 'other', requirements: 'req/other.md', base: head, head: other, pr: 9 }), null, 'a change no module uses leaves no notice');
});

// The copy, 4 Nov: membership PR 77 notified 108 users and credentials PR 74 39 for changes only to
// tests and requirement marks. The copy's entries list the requirements file among their paths.
test('a job that changed only tests, requirements text, docs or records leaves no notice, and says why; one that changed a source file does', () => {
  const root = product();
  const e = entry('p', { paths: ['src/p/', 'req/p.md'] });
  const cfg = loadConfig(root);
  const base = commit(root, { 'process/ledger/p.json': e, 'src/p/a.mjs': 'export const sign = 1;\n' });
  const struck = REQ.replace('*(not yet met: x)* ', '');
  const tests = commit(root, { 'test/p/b.test.mjs': passing('p signs'), 'req/p.md': struck, 'src/p/README.md': '# p\n', 'src/p/docs/x.txt': 'x\n', 'process/metrics/p.jsonl': '{}\n' });
  const r = providerChange(root, cfg, { provider: 'p', requirements: 'req/p.md', base, head: tests, pr: 77 });
  assert.equal(r.notice, null);
  assert.match(r.why, /^PR 77 changed R1 but no file of p's source \(src\/p\/\): only tests, requirements text, docs or records, which cannot change a user's behaviour; no notice for its 2 user\(s\)$/);
  const src = commit(root, { 'src/p/a.mjs': 'export const sign = 2;\n' });
  assert.deepEqual(providerChange(root, cfg, { provider: 'p', requirements: 'req/p.md', base, head: src, pr: 78, entry: e }).notice,
    { key: 'p:78', provider: 'p', ids: ['R1'], pr: 78, users: ['u1', 'u2'], source: 1, exports_read: { base, head: src, files: [] } });
});

test('recordAtMerge writes the notice once and an answer per user; the other user still owes it', () => {
  const root = product();
  const cfg = loadConfig(root);
  const { row, ...notice } = NOTICE;
  assert.equal(recordAtMerge(root, cfg, { notice, user: 'p', pr: 7 }).rows.length, 1);
  assert.equal(recordAtMerge(root, cfg, { notice, user: 'p', pr: 7 }).rows.length, 0, 'a rerun adds nothing');
  assert.equal(recordAtMerge(root, cfg, { answers: ['p:7'], user: 'u1', pr: 9 }).rows.length, 1);
  fetchState(root, cfg.state_branch, { fresh: true });
  assert.deepEqual(notices(root, cfg.state_branch).map((n) => n.open), [['u2']]);
  assert.deepEqual(unanswered(root, cfg.state_branch, 'u1'), []);
  assert.equal(unanswered(root, cfg.state_branch, 'u2')[0].key, 'p:7');
});

test('job start <user> puts the notice in the START and its start row; a notice-only job with no code change completes records-only, asking no test', () => {
  const root = product();
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  const { start } = jobStart(root, 'u1', { coordinator: 's', push: false, log: quiet });
  assert.match(start, /## Provider notices/);
  assert.match(start, /`p:7`: `p` changed R1, R2, R4 \(PR 7\)/);
  assert.match(start, /confirm or adapt this module's code; the merge records the answer/);
  assert.doesNotMatch(start, /--test notice:/);
  git(['checkout', '-q', 'job/u1'], { cwd: root });
  assert.deepEqual(readRows(root, 'u1')[0].notices, ['p:7']);
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const r = jobComplete(root, 'u1', { push: false, log: quiet });
  assert.equal(r.ok, true);
  assert.ok(git(['diff', '--name-only', base, 'HEAD'], { cwd: root }).split('\n').every((f) => f.startsWith('process/')), 'records only');
});

test('job start on a COMPLETE user with a notice reopens it to answer the notice', () => {
  const root = product();
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'process/ledger/u2.json': entry('u2', { status: { state: 'COMPLETE' } }) });
  git(['checkout', '-q', 'main'], { cwd: root });
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  const { start } = jobStart(root, 'u2', { coordinator: 's', push: false, log: quiet });
  assert.match(start, /reopens the module after an earlier attempt merged\. What it must do: answer the provider notice p:7/);
});

// The copy, 4 Nov: one struck requirement listed 56 notice-only jobs. Until triage records, a
// notice is one line, BOB's act, and none of its modules is next work.
function completeAll(root) {
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, Object.fromEntries(['p', 'u1', 'u2', 'other'].map((id) => [`process/ledger/${id}.json`, entry(id, { status: { state: 'COMPLETE' } })])));
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
}

test('status --role bob lists an untriaged notice once, as triage owed, and no notice-only job', () => {
  const root = product();
  completeAll(root);
  openPassed(root);
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /- triage owed: p:7 \(2 modules\): .*notice triage p:7/);
  assert.doesNotMatch(text, /- u[12]: provider notice/);
  assert.doesNotMatch(text, /req\/u[12].md/);
  assert.deepEqual(r.next.map((x) => x.file || x.triage), ['req/p.md', 'p:7']);
});

// The notice on origin's state branch, as merge records it, so triage --record can write beside it.
function noticed(root) {
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
}

test('notice triage --record: not affected answers the notice; affected is notice work apart from layer work; nothing is recorded until every module has a line', () => {
  const root = product();
  completeAll(root);
  openPassed(root);
  noticed(root);
  const three = { ...NOTICE, key: 'p:8', pr: 8, users: ['u1', 'u2', 'other'] };
  onState(root, { [noticeFile('p:8')]: JSON.stringify(three) + '\n' });
  git(['push', '-q', '-f', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const dir = mkdtempSync(join(tmpdir(), 'p3-triage-'));
  const file = join(dir, 'answer.txt');
  writeFileSync(file, 'Here is my answer.\n- `u1`: not affected: src/u1/a.mjs:3 calls p.sign only, never p.check\nu2: affected: src/u2/b.mjs:12 reads the token age\n');
  const out = [];
  const rec = recordTriage(root, 'p:7', { file, worker: 'agent-1', cost: '41k tokens', as: 'coordinator', log: (m) => out.push(m) });
  assert.deepEqual(rec.rows.map((x) => [x.row, x.user, x.verdict ?? x.by]), [['triage', 'u1', 'not affected'], ['answered', 'u1', 'triage'], ['triage', 'u2', 'affected']]);
  assert.equal(rec.rows[0].worker, 'agent-1');
  assert.equal(rec.rows[0].cost, '41k tokens');
  assert.match(out.join('\n'), /1 not affected \(answered\), 1 affected \(next work\)/);
  // The verdicts change BOB's next work: the last line wakes BOB (a rerun that adds nothing does not).
  assert.equal(out.at(-1), 'next act: wake BOB with `node .process/tool/p3.mjs send bob "notice triage p:7 recorded: run status" --from coordinator`, delivered with send_message to the address it prints');
  const rerun = [];
  assert.equal(recordTriage(root, 'p:7', { file, worker: 'agent-1', cost: '1', log: (m) => rerun.push(m) }).rows.length, 0, 'a rerun adds nothing');
  assert.doesNotMatch(rerun.join('\n'), /wake BOB/);
  // p:8: the worker judged u1 only (its line for other cites nothing): nothing is recorded, and
  // every module still owes triage.
  writeFileSync(file, 'u1: affected: src/u1/a.mjs:3 checks the token\nother: not affected\n');
  const part = [];
  const tip = git(['ls-remote', 'origin', 'refs/heads/process-state'], { cwd: root }).split('\t')[0];
  assert.throws(() => recordTriage(root, 'p:8', { file, worker: 'agent-2', cost: '9k tokens', log: (m) => part.push(m) }),
    /^Error: refused: notice triage p:8 records only when every module has a line; 2 of 3 not judged: u2, other\. Run a worker for them, then record every file again, nothing was written$/);
  assert.match(part.join('\n'), /not recorded: other: not affected cites no file:line/);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/process-state'], { cwd: root }).split('\t')[0], tip, 'nothing written');
  const cfg = loadConfig(root);
  fetchState(root, cfg.state_branch, { fresh: true });
  assert.deepEqual(notices(root, cfg.state_branch).map((n) => [n.key, n.open]), [['p:7', ['u2']], ['p:8', ['u1', 'u2', 'other']]]);
  const lines = [];
  const s = status(root, { role: 'bob', offline: true, live: 0, log: (m) => lines.push(m) });
  const text = lines.join('\n');
  assert.match(text, /- triage owed: p:8 \(3 modules\)/);
  assert.match(text, /- u2: provider notice: p R1, R2, R4 \(PR 7\); affected: src\/u2\/b.mjs:12/);
  assert.deepEqual(s.next.map((x) => x.file || x.triage), ['req/p.md', 'req/u2.md', 'p:8']);
  // Two workers' files, recorded together once every module has a line, each row with its worker.
  const second = join(dir, 'second.txt');
  writeFileSync(second, 'u2: not affected: src/u2/b.mjs:1 reads no token\nother: not affected: src/other/a.mjs:1 never imports p\n');
  assert.throws(() => recordTriage(root, 'p:8', { file: [file, second], worker: ['agent-2'], cost: ['9k', '8k'], log: quiet }), /one --worker and one --cost per --record/);
  const r8 = recordTriage(root, 'p:8', { file: [file, second], worker: ['agent-2', 'agent-3'], cost: ['9k', '8k'], log: quiet });
  assert.deepEqual(r8.rows.filter((x) => x.row === 'triage').map((x) => [x.user, x.verdict, x.worker, x.cost]),
    [['u1', 'affected', 'agent-2', '9k'], ['u2', 'not affected', 'agent-3', '8k'], ['other', 'not affected', 'agent-3', '8k']]);
  const after = [];
  const s2 = status(root, { role: 'bob', offline: true, live: 0, log: (m) => after.push(m) });
  const text2 = after.join('\n');
  assert.doesNotMatch(text2, /triage owed/);
  assert.match(text2, /notice work \(triage judged these affected; not layer work.*\n- req\/u1.md: 0; provider notice p:8\n- req\/u2.md: 0; provider notice p:7$/m);
  assert.doesNotMatch(text2, /next work, layer|next work \(.*\n- req\/u/);
  assert.deepEqual(s2.next.map((x) => x.file || x.triage), ['req/p.md', 'req/u1.md', 'req/u2.md']);
});

test('notice triage prints BOB\'s act and the worker\'s brief: the changed text before and after, each untriaged user\'s paths and sizes; it writes nothing', () => {
  const root = product();
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'src/u1/a.mjs': 'export const a = 1;\n', 'src/u2/b.mjs': 'b\n', 'src/u2/c.mjs': 'cc\n' });
  git(['checkout', '-q', '-b', 'job/p'], { cwd: root });
  commit(root, { 'req/p.md': REQ.replace('*(not yet met: x)* ', '').replace('checks a token', 'checks a token and its age') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  noticed(root);
  const before = git(['rev-parse', 'refs/remotes/origin/process-state'], { cwd: root });
  const out = [];
  const r = noticeTriage(root, 'p:7', { log: (x) => out.push(x), io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
  const text = out.join('\n');
  assert.match(text, /^BOB's act: start one read-only worker, a subagent .*notice triage p:7 --record <file> --worker <its id> --cost <its cost>/);
  assert.match(text, /- R1\n  before: - \*\*R1\*\* \*\(not yet met: x\)\* signs a token\n  after:  - \*\*R1\*\* signs a token/);
  assert.match(text, /- R2\n  before: - \*\*R2\*\* checks a token\n  after:  - \*\*R2\*\* checks a token and its age/);
  assert.match(text, /- R4\n  before: \(none\)\n  after:  \(none\)/);
  assert.match(text, /<module>: not affected: <file>:<line>/);
  assert.match(text, /- u1: src\/u1\/; no file imports p\n- u2: src\/u2\/; no file imports p$/);
  assert.deepEqual(r.owed, ['u1', 'u2']);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/process-state'], { cwd: root }).split('\t')[0], before, 'nothing written');
});

test('parseTriage: one verdict per module, evidence citing a file:line, other lines ignored; two verdicts for one module refused', () => {
  const { lines, bad } = parseTriage('intro\nu1: not affected: src/u1/a.mjs:3 no use\n* u2 : affected — lib/x.js:9 uses it\nu3: not affected, I think\n');
  assert.deepEqual([...lines].map(([u, v]) => [u, v.verdict, v.evidence]), [['u1', 'not affected', 'src/u1/a.mjs:3 no use'], ['u2', 'affected', 'lib/x.js:9 uses it']]);
  assert.deepEqual(bad, ['u3: not affected cites no file:line']);
  assert.throws(() => parseTriage('u1: affected: a.js:1 x\nu1: not affected: a.js:2 y\n'), /both affected and not affected/);
});

test('a user whose open job names the notice is no longer listed; one whose job does not still is', () => {
  const root = product();
  onState(root, { [noticeFile('p:7')]: JSON.stringify(NOTICE) + '\n' });
  git(['checkout', '-q', '-b', 'job/u1', 'tranche'], { cwd: root });
  commit(root, { 'process/metrics/u1.jsonl': JSON.stringify({ event: 'start', notices: ['p:7'] }) + '\n' });
  git(['update-ref', 'refs/remotes/origin/job/u1', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/u2', 'tranche'], { cwd: root });
  commit(root, { 'process/metrics/u2.jsonl': JSON.stringify({ event: 'start' }) + '\n' });
  git(['update-ref', 'refs/remotes/origin/job/u2', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const cfg = loadConfig(root);
  const rows = [{ id: 'u1', tranche: 'WORKING', branch: 'WORKING' }, { id: 'u2', tranche: 'WORKING', branch: 'WORKING' }];
  assert.deepEqual(Object.keys(owedNotices(root, cfg, rows, quiet)), ['u2']);
});

// merge: the provider's job leaves the notice; the user's job answers the one its START named.
function mergeFixture(root, id, files) {
  git(['checkout', '-q', '-b', `job/${id}`, 'tranche'], { cwd: root });
  const head = commit(root, files);
  git(['push', '-q', 'origin', `job/${id}`], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const io = {
    getPR: () => ({ state: 'open', draft: false, user: { login: 'c' }, base: { ref: 'tranche' }, head: { ref: `job/${id}`, sha: head } }),
    comments: () => [
      { id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, attempt: 1, run_id: 11 }] }), user: { login: BOT } },
    ],
    checkRun: () => ({ status: 'completed', conclusion: 'success' }),
