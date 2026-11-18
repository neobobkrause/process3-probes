// ===== file: fresh-branch.test.mjs (continued) =====

  assert.deepEqual(order.slice(0, 2), ['program', 'bundle'], 'the built row before every regenerated row is not built twice; the one after is');
});

test('a job/<id>-<n> its own start row does not name is not the job\'s branch, an unread ledger counts none, and a fresh start not yet opened is not cut again', () => {
  assert.equal(jobBranch('api', ['job/api', 'job/api-2'], new Set()), 'job/api', 'no ids read: no <id>-<n> counts');
  assert.equal(branchModule('job/api-2', new Set()), 'api-2');
  const root = product();
  git(['branch', 'job/alpha-2', 'main'], { cwd: root }); // work made before Process3, no start row
  const r = jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  assert.match(r.start, /Your branch is `job\/alpha`/);
  const f = jobStart(root, 'alpha', { coordinator: 's', fresh: 'stuck', push: false, log: quiet });
  assert.match(f.start, /Your branch is `job\/alpha-3`/);
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 's', fresh: 'again', push: false, log: quiet }), /job\/alpha-3 is a fresh start not yet opened; run job start alpha --sessions <file> without --fresh-branch/);
});

// ===== file: job-sync.test.mjs (later part) =====

test('#7: a generated build that fails part way still puts back the committed paths it rewrote', () => {
  const { root, exec } = generated();
  write(root, { 'build.mjs': "import { writeFileSync } from 'node:fs'; writeFileSync('member/dist/m.bundled.mjs', 'half\\n'); process.exit(3);\n" });
  git(['commit', '-q', '-am', 'a build that fails'], { cwd: root });
  assert.equal(jobTest(root, 'alpha', { exec, log: quiet }).ok, false);
  assert.equal(clean(root), '');
});

test('#5: block after BOB\'s push names job sync, not "run block again" forever', () => {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': '# alpha\n', 'test/alpha/a.test.mjs': passing });
  git(['branch', 'tranche'], { cwd: root });
  const bare = bareOrigin(root, 'main', 'tranche');
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const other = join(mkdtempSync(join(tmpdir(), 'p3-bob-')), 'b');
  git(['clone', '-q', '--branch', 'job/alpha', `file://${bare}`, other], { cwd: root });
  git(['config', 'user.email', 'bob@example.com'], { cwd: other });
  git(['config', 'user.name', 'BOB'], { cwd: other });
  commit(other, { 'src/other/o.mjs': '1\n' }, 'pushed from elsewhere');
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: other });
  assert.throws(() => jobBlock(root, 'alpha', { reason: 'waiting', log: quiet }), /origin's job\/alpha has commits this checkout lacks: run `node \.process\/tool\/p3\.mjs job sync alpha`, then block again/);
});

// Recovery after a governor refusal (R17c, item F): job complete refused at each GitHub step in turn
// (its push through the governed git, and each gh call), then rerun: the head pushed, the pull
// request ready, nothing lost.
test('job complete: refused at each GitHub step in turn, then rerun: its head pushed, ready, nothing lost', async (t) => {
  const { Fail } = await import('../lib/util.mjs');
  t.after(() => refusePushes(false));
  const REFUSED = 'GitHub budget: 68 of the 80 content-creating requests a minute used account-wide, the target 85% (68): acts on GitHub wait until 2026-11-06T23:59:00Z (16 min); then rerun `node .process/tool/p3.mjs job complete alpha`';
  const run = (refuseAt, pushRefused) => {
    const { root, f } = bobMerged();
    jobSync(root, 'alpha', { log: quiet });
    commit(root, { 'test/alpha/c.test.mjs': passing }, 'the fix for the red gate');
    let calls = 0;
    const wrap = (fn) => (...a) => { calls++; if (calls === refuseAt) throw new Fail(REFUSED); return fn(...a); };
    const gh1 = Object.fromEntries(Object.entries(f.gh).map(([k, v]) => [k, wrap(v)]));
    if (pushRefused) refusePushes(true);
    let first = null;
    try { jobComplete(root, 'alpha', { gh: gh1, log: quiet }); } catch (e) { first = e.message; }
    refusePushes(false);
    const r = jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
    return { root, f, r, first, calls };
  };
  const clean = run(0, false);
  assert.equal(clean.r.ok, true);
  const steps = clean.calls;
  for (let k = 1; k <= steps + 1; k++) {
    const { root, f, r, first } = run(k <= steps ? k : 0, k > steps);
    if (first) assert.match(first, /GitHub budget|the push of job\/alpha failed/, `step ${k}`);
    assert.equal(r.ok, true, `step ${k}: the rerun completes`);
    const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
    assert.equal(tip, head(root), `step ${k}: pushed`);
    assert.equal(f.state.isDraft, false, `step ${k}: ready`);
  }
});

// Cold review of C29: in a shallow clone (a session's), the count of the stale branch's own commits
// reads on enough history (a depth-1 fetch cut it and counted commits origin has); and a restart's
// container, detached at the tranche tip, is no detached work of its own.
test('C29: in a shallow clone a stale branch that is an ancestor of origin\'s counts nothing of its own; a restart at the tranche tip is accepted', () => {
  const { src, compare, clone } = shallowJob();
  const c = clone('job/alpha');
  git(['fetch', '-q', '--deepen=3', 'origin', '+refs/heads/job/alpha:refs/remotes/origin/job/alpha'], { cwd: c });
  git(['checkout', '-q', '--detach'], { cwd: c });
  git(['branch', '-f', 'job/alpha', 'HEAD~2'], { cwd: c });
  const said = [];
  jobSync(c, 'alpha', { compare, log: (l) => said.push(String(l)) });
  assert.equal(git(['symbolic-ref', '--short', 'HEAD'], { cwd: c }), 'job/alpha');
  assert.match(said.join('\n'), /moved aside to aside\/job\/alpha-\d{8}T\d{6}Z, nothing reset or deleted \(it holds nothing origin lacks\)/);
  // A restart: HEAD detached at the tranche tip, a stale local job/alpha beside it.
  const r = clone('tranche');
  git(['fetch', '-q', '--depth=2', 'origin', '+refs/heads/job/alpha:refs/remotes/origin/job/alpha'], { cwd: r });
  git(['branch', 'job/alpha', 'refs/remotes/origin/job/alpha~1'], { cwd: r });
  git(['checkout', '-q', '--detach'], { cwd: r });
  jobSync(r, 'alpha', { compare, log: quiet });
  assert.equal(git(['symbolic-ref', '--short', 'HEAD'], { cwd: r }), 'job/alpha');
  // The first sync above pushed job/alpha with the tranche merged: the restart lands on that tip.
  assert.equal(head(r, 'HEAD'), git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: r }).split('\t')[0]);
  assert.equal(git(['for-each-ref', '--format=%(refname:short)', 'refs/heads/aside/'], { cwd: r }).split('\n').filter(Boolean).length, 1);
});

// ===== file: workflows.mjs =====

// A close's workflow changes (Bob, 4 Nov, about 07:04, on the copy's first close: "These are
// technical details, and I've already give sufficient approvals for you to do them yourself").
// The tranche into main (a normal close or the first, bootstrap, close) may carry a product
// workflow change without Bob, because what the old refusal protected is held here instead: the
// gate, and the tokens. A changed workflow file other than the process's own shims is accepted
// only when all of these hold, and a refusal names the rule that failed:
//  (1) every commit that changed it reached the tranche through a merged job or plain pull
//      request whose gate was green, and was the process's own gate: each commit on the
//      tranche's first-parent history whose diff against its first parent touches the file is
//      GitHub's merge of such a pull request, carrying the file exactly as that pull request's
//      gated head had it, and the commits that gate ran on held the pin's own process-gate.yml.
//      A job merge is judged as the tranche cover judges it (gate.mjs jobMerge, PR 92 and 94); a
//      plain merge is bound by its merge commit, its pull request and the newest gate row on its
//      head, verified (verifyRow). Commits in the
//      product's history before Process3 (the config's record_since, anchored at the owner's
//      website commit) are earlier work, judged whole by the rules below;
//  (2, 3) the change, base to head, is made only of allowed shapes (coordinator, 4 Nov 08:24:
//      a line reader of YAML failed four review rounds of PR 98, so no YAML is read). The base's
//      copy is trusted and is the only thing structure is read from; every hunk of the line diff
//      must be one of: S1, lines inside an existing `run: |` or `run: >` block scalar; S2, quoted
//      items added inside an existing multi-line `paths: [...]` flow list; S3, a matrix row
//      added beside an existing `- { ... }` row under `include:`, with that row's keys. No shape
//      can add a key, a job, a permission or an event, so none can name a job like a required
//      check or widen a token. The file must also be plain text (plainText). A new or removed
//      workflow, or any other change, is refused, naming the file and the hunk: the fix is a
//      process3 build that adds a shape, never a YAML reading;
//  (4) a process shim (process-gate.yml above all) equals the pin's own shim (merge.mjs).
// Plain pull requests into the tranche stay shim-only (merge.mjs workflowChanges).
import { comments, gateRuns, getPR, verifyRow } from './github.mjs';
import { MERGE_TITLE, diffNames, isAnc, jobMerge } from './gate.mjs';
import { recordSince } from './record.mjs';
import { blobAt as blob, keySetAt, pinAt } from './anchor.mjs';
import { fail, git } from './util.mjs';

const PLAIN_MERGE = /^Merge PR (\d+): (\S+) into (\S+)$/;
export const isJob = (ref) => /^job\//i.test(ref || '');
const text = (root, rev, path) => {
  const r = git(['show', `${rev}:${path}`], { cwd: root, allowFail: true });
  return r.code === 0 ? r.stdout : null;
};
const parents = (root, c) => git(['rev-list', '--parents', '-n', '1', c], { cwd: root }).split(' ').slice(1);

// ---- rules 2 and 3: plain text, and the allowed shapes ---------------------------------------
// Only plain lines (coordinator, 4 Nov 08:13; round 3 of PR 98: a lone \r, U+0085, U+2028 or
// U+2029 is a YAML line break). A leading BOM is dropped; any line break but \n, or a BOM
// elsewhere, refuses the file; any other character outside printable ASCII, \n and \t is
// allowed only on a line the base's copy holds unchanged.
const BREAKS = /[\r\u0085\u2028\u2029\ufeff]/;
export function plainText(src, baseSrc) {
  const s = src.replace(/^\ufeff/, '');
  const m = s.match(BREAKS);
  if (m) return `rule 3: it holds ${m[0] === '\ufeff' ? 'a byte-order mark' : 'a line break other than \\n'} (U+${m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}) at offset ${m.index}`;
  const base = new Set((baseSrc ?? '').replace(/^\ufeff/, '').split('\n'));
  const bad = s.split('\n').findIndex((l) => /[^\x20-\x7e\t]/.test(l) && !base.has(l));
  if (bad >= 0) return `rule 3: line ${bad + 1} holds a character outside printable ASCII that the base's copy does not hold`;
  return null;
}

// The line diff of a and b as hunks { at, del, add }: base lines a[at .. at+del) replaced by add.
// Any edit script is sound here: each hunk is judged alone against the base, so head is the base
// with every hunk's allowed change made. Longest common subsequence, after the common ends.
export function hunks(a, b) {
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let q = 0;
  while (q < a.length - p && q < b.length - p && a[a.length - 1 - q] === b[b.length - 1 - q]) q++;
  const A = a.slice(p, a.length - q);
  const B = b.slice(p, b.length - q);
  const n = A.length;
  const m = B.length;
  if (n * m > 25e6) return null;
  const T = new Uint32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) T[i * (m + 1) + j] = A[i] === B[j] ? T[(i + 1) * (m + 1) + j + 1] + 1 : Math.max(T[(i + 1) * (m + 1) + j], T[i * (m + 1) + j + 1]);
