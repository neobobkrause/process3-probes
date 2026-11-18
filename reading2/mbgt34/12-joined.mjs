// ===== file: pin.mjs (continued) =====

  if (!SLUG.test(String(slug ?? ''))) fail(`pin move <owner/repo>, the product's slug, not ${JSON.stringify(slug ?? '')}`);
  if (rest.length) fail(`pin move takes only the slug; ${/^[0-9a-f]{7,40}$/.test(String(rest[0])) ? `give the commit as --pin ${rest[0]}` : `not ${JSON.stringify(rest[0])}`}`);
  if (!SESSION.test(String(report ?? ''))) fail('pin move needs --report <session id>: the session the pin move reports to (your own, from get_session)');
  if (typeof why !== 'string' || !why.trim()) fail('pin move needs --why "<what the fix unblocks>"');
  if (typeof tranche !== 'string' || !/^[\w./-]+$/.test(tranche)) fail(`--tranche <the product's tranche branch>, not ${JSON.stringify(tranche)}`);
  if (!/^[0-9a-f]{40}$/.test(String(pin))) fail(`pin move needs --pin <a process3 commit, 40 hex>${pin === undefined ? '' : `, not ${JSON.stringify(pin)}`}`);
  // The merge tool's own test (merge.mjs pinChange), before --supersedes closes anything; a tag's id is not a commit's.
  if (!processRepo(processRoot).released(pin) || git(['cat-file', '-t', pin], { cwd: processRoot, allowFail: true }).stdout?.trim() !== 'commit') fail(`--pin ${pin} is not a commit on process3's tranche or main`);
  // From a session that cannot list the product's pull requests (a process3-only one, 5 Nov), the
  // call is printed all the same: the printed session runs pin check, which refuses then, before it pushes.
  const open = openPinMoves(slug, io, { unread: supersedes === undefined });
  if (open === null) log(`note: ${UNLISTED(slug)} from here; the pin-move session's own \`${P3} pin check ${slug}\` (step 8, before it pushes) guards it`);
  else if (supersedes !== undefined) {
    const n = Number(supersedes);
    if (typeof supersedes === 'boolean' || Array.isArray(supersedes) || !Number.isInteger(n) || n < 1) fail(`--supersedes <the open pin move's pull request number>, once; not ${JSON.stringify(supersedes)}`);
    const old = open.find((p) => p.number === n);
    if (!old) fail(`--supersedes ${n}: pull request ${n} is not an open pin move on ${slug}${open.length ? ` (open: ${named(open)})` : ''}`);
    if (old.head.ref === `p3/pin-${pin.slice(0, 10)}`) fail(`pull request ${n} already moves the pin to ${pin.slice(0, 10)}; wait for it`);
    refuseOpen(open.filter((p) => p !== old));
    // A rerun after a refused close (R17d) finds its comment there already: it is not posted twice.
    const note = `Superseded by a newer pin move, to process3 ${pin}. Closed by \`pin move --supersedes ${n}\`; the branch ${old.head.ref} is kept.`;
    if (!(io.comments?.(slug, n) || []).some((c) => c?.body === note)) io.comment(slug, n, note);
    io.close(slug, n);
    log(`closed pull request ${n} (${old.head.ref}) as superseded; its branch is kept`);
  } else refuseOpen(open);
  const prompt = pinMoveText({ slug, pin, tranche, report, why: why.trim().replace(/\s+/g, ' ') });
  // From the product's tranche by name: the session's first command fetches the tip and checks it out.
  const call = sessionCall({ slug, revision: tranche, title: `pin move ${pin.slice(0, 10)}`, prompt, clone: { clone_depth: 1 } });
  log(prompt);
  log(`next act: start the pin move with create_session:\n${JSON.stringify(call, null, 2)}`);
  return { prompt, call, pin };
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

// ===== file: lead.mjs (later part) =====

        return [b.to ? { from: b.from, minutes: mins(b.from, b.to), stopped_by: 'BLOCKED', source: 'blocked', resumed: b.to } : { from: b.from, minutes: mins(b.from, now), stopped_by: 'BLOCKED', source: 'blocked', open: true }];
      });
      for (const r of rs.filter((x) => !used.has(x))) {
        fs.push(typeof r.stopped === 'string' && Number.isFinite(Date.parse(r.stopped)) ? { from: later(r.stopped, opened), minutes: Math.max(0, mins(later(r.stopped, opened), r.at)), stopped_by: r.stopped_by || 'stopped', source: stopSource(r), replaced: r.at, ...batchOf(r) } : U);
      }
      replace = fs.length ? fs.sort((a, b) => String(a.from).localeCompare(String(b.from))).map((f) => fig(cfg, 'replace', f)) : 'none';
    }
    const waits = msgs ? reportWaits(msgs.filter(since), now).filter((w) => w.from === m) : null;
    return {
      module: m, layer: layers.get(m) ?? null,
      ready_to_start: (() => {
        if (rd.early) return `started before ${rd.early} (in its uses) merged; ${rd.early} not merged yet`;
        if (!ready) return U;
        // Its first start before the ready time: it started before it was ready, 0, whatever later starts.
        const before = starts[0] && Date.parse(starts[0].at) < Date.parse(ready);
        const f = fig(cfg, 'ready_to_start', firstSince && !before ? Math.max(0, mins(ready, firstSince.at)) : 0);
        // A cause is named for a wait over its target only.
        const cause = firstSince && !before && f.mark === 'over' && causeOf(m, ready, firstSince.at);
        const early = rd.waited_on && before;
        return { ...f, ready: ready, ready_by: rd.by, ...(rd.waited_on ? { [early ? 'started_before' : 'waited_on']: rd.waited_on } : {}), ...(rd.early_of ? { started_before: rd.early_of } : {}), ...(cause ? { cause } : {}) };
      })(),
      start_to_pr_ready: worstOf(attempts.map((a) => ({ n: a.attempt, f: a.start_to_pr_ready }))),
      green_to_merge: worstOf(attempts.map((a) => ({ n: a.attempt, f: a.green_to_merge }))),
