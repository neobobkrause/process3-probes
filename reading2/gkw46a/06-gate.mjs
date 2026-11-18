const claimText = (c) => ({ pass: c ? 'passed' : 'passes (no suite run in the session)', 'base-red': 'failed only on base-red tests', fail: 'failed' })[claimOf(c)];
export function receiptAgrees(claimed, suite, red, passed = []) {
  const claim = claimOf(claimed);
  if (claim === suite) return claim !== 'base-red' || claimedRed(claimed).every((t) => redIds(red).includes(t) || passed.includes(t));
  if (suite === 'base-red' && claim === 'pass') return true;
  return suite === 'pass' && claim === 'base-red';
}

// The tests a receipt names for its struck marks, as "<file>::<name>".
export const namedTests = (receipt) => [...new Set((Array.isArray(receipt?.tests) ? receipt.tests : [])
  .filter((t) => typeof t?.file === 'string' && typeof t?.name === 'string' && t.name).map((t) => `${t.file}::${t.name}`))];

// What the gate's suite run saw, by file: the passing ids (receipt_passed) and each file's passing
// and failing names (namedVerdict). Null when no run's results could be read per test.
export function passedByFile(results) {
  const ids = new Set();
  const byFile = new Map();
  let read = false;
  for (const s of results) {
    if (!Array.isArray(s.passing) || !Array.isArray(s.failing)) continue;
    read = true;
    for (const [list, k] of [[s.passing, 'pass'], [s.failing, 'fail']]) {
      for (const t of list) {
        if (k === 'pass') ids.add(testId(t));
        if (!byFile.has(t.file)) byFile.set(t.file, { pass: [], fail: [] });
        byFile.get(t.file)[k].push(t.name);
      }
    }
    for (const f of s.whole || []) { if (!byFile.has(f)) byFile.set(f, { pass: [], fail: [] }); byFile.get(f).whole = true; }
  }
  return read ? { ids, byFile } : null;
}

// A named test against the gate's run: 'fail' when its file ran and the test (by its name, or its
// name under describes) failed, or the file failed as a whole and is not tolerated as base-red;
// 'pass' when it passed; null when the run says nothing of it (its file did not run, or no test
// has the name: job complete checks only that the file contains it). Only 'fail' disagrees.
const escName = (x) => x.replace(/\\/g, '\\\\').replace(/>/g, '\\>');
export function namedVerdict(g, t, tolerated = []) {
  const at = t.indexOf('::');
  const file = t.slice(0, at);
  const f = g?.byFile.get(file);
  if (!f) return null;
  const name = t.slice(at + 2);
  // The test itself, or one nested under describes: never a longer name that holds it.
  const holds = (x) => [name, escName(name)].some((n) => x === n || x.endsWith(` > ${n}`));
  // A failure tolerated as base-red is not the named test's (another describe's test of that name).
  const failed = f.fail.some((x) => holds(x) && !tolerated.includes(`${file}::${x}`));
  if (failed) return 'fail';
  if (f.pass.some(holds)) return 'pass';
  // A file that failed as a whole ran none of its tests; tolerated as base-red, the run says nothing of them.
  return f.whole && !tolerated.some((x) => String(x).startsWith(`${file}::`)) ? 'fail' : null;
}

// Whether the last green code run measured what a receipt claims: the receipt was made on a
// commit whose files, records aside, are that run's (the same tree, so the same suite and
// results) or that run checked this same attempt, it ran the job's suite and agreed with a receipt, and it neither refuted nor
// left unread a test this receipt names or excuses. { ok } or { ok: false, why }.
export function measuredBy(root, cfg, receipt, green, entries = []) {
  const job = receipt.module;
  const at = String(green.sha).slice(0, 10);
  if (!(Array.isArray(green.scope) && green.scope.includes(job)) || !['pass', 'fail', 'base-red'].includes(green.suite)) return { ok: false, why: `the last green code run, on ${at}, did not run the ${job} suite` };
  if (green.receipt !== 'agrees') return { ok: false, why: `the last green code run, on ${at}, checked no receipt` };
  // That run checked this very attempt (its claims are the same whatever amends it), or this
  // receipt was made on the tree that run tested, records aside. Without the first, a receipt
  // older than the head's code would send every records-only head through the suite (cold review).
  const checked = Number.isInteger(receipt.attempt) && green.receipt_attempt === receipt.attempt;
  const same = checked || (git(['cat-file', '-e', `${receipt.sha}^{commit}`], { cwd: root, allowFail: true }).code === 0
    && diffNames(root, green.sha, receipt.sha).every((f) => isRecordOrLane(cfg, f, entries, { self: job })));
  if (!same) return { ok: false, why: `it names ${String(receipt.sha).slice(0, 10)}, whose code is not what the last green code run, on ${at}, tested` };
  const kept = Array.isArray(green.receipt_passed) ? green.receipt_passed : [];
  const unknown = [...new Set(claimedRed(receipt.commands?.find((c) => c.suite)))].filter((t) => !redIds(green.base_red).includes(t) && !kept.includes(t));
  if (unknown.length) return { ok: false, why: `it excuses ${unknown.length} test(s) the last green code run, on ${at}, neither found base-red nor kept as passing: ${unknown.slice(0, 5).join('; ')}` };
  const seen = Array.isArray(green.receipt_tests) ? green.receipt_tests : [];
  const unseen = namedTests(receipt).filter((t) => !seen.includes(t));
  if (unseen.length) return { ok: false, why: `it names ${unseen.length} test(s) the last green code run, on ${at}, did not check: ${unseen.slice(0, 5).join('; ')}` };
  return { ok: true };
}

// The reviewed revert exemption (AUD-1, JOB-12): a refactor whose tests rightly pass before and
// after the change. Recorded on the pull request by `revert exempt` (job.mjs), a p3:revert-exempt
// block naming its reviewer, its reason and the head it reviewed. It stands when its reviewer is
// not the job's own session (a receipt, or the job, never exempts itself) and the job's own files
// (its module's paths and tests, records and requirements aside) are as the reviewed commit had
// them, so the code reviewed is the code tested. The newest block that stands wins; withdrawing
// one means deleting its comment. The reviewer and the job's session are the sessions' own words
// (the complete row, written on the job's branch): the gate cannot prove who posted a block.
// { ok, by, sha, why }, { ok: false, why }, or null when none is recorded.
export const P3_EXEMPT = 'p3 revert exempt <pr> --why "<why>" --reviewer <session>, by a reviewer that is not the job';
export const completeSession = (rows) => (rows || []).filter((r) => r.row === 'attempt' && r.event === 'complete').pop()?.session || null;
export function revertExemption(all, { root, cfg, head, entry, job, jobSession = null }) {
  // Never an edited comment (its block could be pointed at another commit), as gateRuns reads rows.
  const blocks = (all || []).filter((c) => !c.updated_at || c.updated_at === c.created_at)
    .map((c) => parseBlock(c.body, REVERT_EXEMPT)).filter(Boolean).reverse();
  if (!blocks.length) return null;
  const sf = (x) => String(x).trim().replace(/^cse_/, 'session_');
  const own = entry ? ownPaths(entry) : [];
  const judge = (x) => {
    const no = (why) => ({ ok: false, why });
    const by = typeof x.reviewer === 'string' ? x.reviewer.trim() : '';
    if (!by || typeof x.why !== 'string' || !x.why.trim()) return no('it names no reviewer or no reason');
    if (x.module !== job) return no(`it is for ${printable(x.module, 40)}, not ${job}`);
    // Fails closed: with no job session recorded, a reviewer cannot be told from the job.
    if (!jobSession) return no(`${job}'s complete row records no session, so its reviewer cannot be told from the job (job complete --session <id>)`);
    if (sf(by) === sf(jobSession)) return no(`its reviewer ${printable(by, 60)} is the job's own session: a job never exempts itself`);
    if (!committed(root, x.sha)) return no(`it names ${printable(x.sha, 40)}, which is no commit here`);
    // The job's own code as reviewed: the tranche merged in since (job sync, merge) changes other modules' files only.
    const off = diffNames(root, x.sha, head).filter((f) => own.some((p) => underPath(f, p)) && !isRecordPath(cfg, f) && f !== entry.requirements);
    if (off.length) return no(`the job's code differs from ${String(x.sha).slice(0, 10)}, the commit reviewed, in ${off.length} file(s): ${off.slice(0, 5).join(', ')}`);
    return { ok: true, by, sha: x.sha, why: x.why };
  };
  // The newest block that stands; else why the newest does not.
  const verdicts = blocks.map(judge);
  return verdicts.find((v) => v.ok) || verdicts[0];
}

// The tranche into main (PR 89's report, 4 Nov): one gate job running every changed module's
// suite would pass its cap on a tranche of 30+ modules, so main could never merge. Every
// module file the tranche changes was last changed, on the tranche's first-parent history, by
// some commit. When that commit is a job's merge whose gate was green on the merged result, the
// file's state was tested there, and its suite is not run again: the gate names the job PR. Any
// other file (a plain pull request, a direct commit, a conflict resolved bringing main in, a
// merge that is not shown to be the gated result) falls back to its module's full suite.
// A job merge counts when: it is GitHub's merge of the pull request its title names ("Merge job
// PR <n>", as merge writes it), into the tranche, from job/<id>, whose head is the merge's second
// parent; the merge's tree is that head's tree and its first parent is in that head (merge
// brought the job up to the tranche, so nothing else came in); the head holds the merge row for
// <n>; the newest gate row on that head is green, verified (verifyRow, bound to the merged PR by
// its branch, head and base, since GitHub drops a merged PR from its runs), and ran the module's
// suite green (trigger code, or record-since-green after such a run); and the file is the
// job's own (ownPaths, from the tranche's entry before the merge) and no other module's. A covered
// module still runs when a module it uses changed on the tranche after its merge.
export const MERGE_TITLE = /^Merge job PR (\d+)$/;
export function trancheCover(root, cfg, { head, mb, changed, entries, slug, io, log = () => {} }) {
  const need = changed.filter((f) => !isRecordOrLane(cfg, f, entries) && entries.some((e) => inModule(e, f)));
  const last = new Map();
  const chain = need.length ? git(['rev-list', '--first-parent', head, '--not', mb], { cwd: root }).split('\n').filter(Boolean) : [];
  if (need.length) {
    const left = new Set(need);
    for (const c of chain) {
      if (!left.size) break;
      const p = git(['rev-list', '--parents', '-n', '1', c], { cwd: root }).split(' ').slice(1);
      if (!p.length) continue;
      for (const f of diffNames(root, p[0], c)) if (left.delete(f)) last.set(f, c);
    }
  }
  const judged = new Map();
  const judge = (c) => {
    if (!judged.has(c)) {
      let v;
      try { v = jobMerge(root, cfg, c, { slug, io }); } catch (e) { v = { ok: false, why: `could not be read (${printable(e.message, 200)})` }; }
      judged.set(c, v);
    }
    return judged.get(c);
  };
  // Each file's verdict: the job merge that gated it, or why its module's suite runs. A file
  // that lies in more than one module's paths is covered only when it is the job's own and no
  // other module's (review 1 of PR 92).
  const age = new Map(chain.map((c, i) => [c, i])); // 0 is the tranche's tip: smaller is newer
  const verdict = new Map();
  for (const f of need) {
    const c = last.get(f);
    const v = c ? judge(c) : { ok: false, why: 'no commit on the tranche changes it' };
    const others = entries.filter((e) => inModule(e, f) && e.id !== v.id).map((e) => e.id);
    verdict.set(f, v.ok && v.own.some((p) => underPath(f, p)) && !others.length ? { c, v }
      : { c, why: v.ok ? `is PR ${v.pr}'s merge, but the file is ${others.length ? `also ${others.join(', ')}'s` : `not ${v.id}'s own`}` : v.why });
  }
  // A module's gate at its job merge tested it with its providers as they were then. A provider
  // (in its uses, at any depth) whose files changed on the tranche after that merge was not
  // tested with it, so the module's suite runs (review 1 of PR 92: m1 uses m0; m0's job, merged
  // after m1's, broke m1, and the gate skipped m1).
