  const trig = reviewTriggers(root, { base: mb, head: `origin/${branch}`, entry: baseEntry, cfg: loadConfig(root, `origin/${cfg.tranche}`) });
  if (trig.bad) log(`note: ${trig.bad}; no security path is read`);
  if (trig.fired.length && noReview) fail(`pull request ${n} fires the review trigger${trig.fired.length > 1 ? 's' : ''} ${trig.fired.join(' and ')} (${trig.why}): --no-review is refused (review triggers, 4 Nov 19:05). Brief a fresh read-only reviewer with ${P3} review brief ${n}, which carries the hunks that fired it; one review and one fix pass; then merge ${n} --reviewed "<what it found>" --rounds <n> --review-minutes <n> --findings <n> --acted-on <n>`);
  if (trig.fired.length) log(`review trigger${trig.fired.length > 1 ? 's' : ''} ${trig.fired.join(' and ')}: ${trig.why}`);

  return { branch, watch, first, all, receipt, mb, baseEntry, trig };
}

// --job-cost-usd: a figure above 0, or none (null). 0 is a figure not read: no job costs nothing.
export function jobCostOf(v) {
  if (v === undefined || v === null) return null;
  const c = Number(v);
  if (v === true || !Number.isFinite(c) || c <= 0) fail(`--job-cost-usd <the job's session cost: ${jobCostCall()}>; not ${JSON.stringify(v)}${c === 0 ? ' (no job costs nothing: 0 is a figure not read)' : ''}; nothing was run`);
  return c;
}

// The job's measured row at its merge, the row job complete --cost-usd writes (PR 105): session_usd
// the session's cost so far, cost_usd that less the same session's last priced row. The session
// is --job-session, else the one the job's last complete row names. With no figure, the row says
// unmeasured (so the report reads job_usd unmeasured, never low) and the call to read it is printed.
export function jobCostRow(wt, id, rows, { cost, session, attempt, log = console.log }) {
  const done = rows.filter((r) => r.event === 'complete').pop();
  const priced = (r) => r.event === 'measured' && (r.role || 'job') === 'job' && r.attempt === attempt && Number(r.cost_usd) > 0;
  // Else the session of this attempt's last measured row: queue's complete rows named none on the
  // copy (4 Nov), and its merge counted 4.04 whole, attempt 1's 3.25 again. Never an earlier
  // attempt's: a restart in a new session would have that session's figure taken off its own.
  const last = rows.filter((r) => r.event === 'measured' && (r.role || 'job') === 'job' && r.session && r.attempt === attempt).pop();
  const sid = sessionForm(typeof session === 'string' && session ? session : done?.session || last?.session || null);
  if (cost === null) {
    // Measured already, by a job complete --cost-usd for this attempt: nothing more to write.
    if (rows.some(priced)) return null;
    appendRow(wt, id, { row: 'attempt', event: 'measured', role: 'job', attempt, session: sid, session_usd: 'unmeasured', cost_usd: 'unmeasured' });
    log(`job ${id}'s cost: unmeasured. Read it with ${jobCostCall(sid)}, and pass it as --job-cost-usd <n>${sid ? '' : ' with --job-session <its id>'} if this merge is run again before it lands; the merge goes on`);
    return null;
  }
  if (rows.some(priced)) { log(`job ${id}'s attempt ${attempt} is priced already: --job-cost-usd ${cost} is not written again`); return null; }
  const { usd, prior } = costDelta(rows, sid, cost);
  appendRow(wt, id, { row: 'attempt', event: 'measured', role: 'job', attempt, session: sid, session_usd: cost, cost_usd: usd });
  if (usd === 'unmeasured') log(`job ${id}'s cost: unmeasured: --job-cost-usd ${cost} is not above session ${sid}'s last row (${prior}), so get_session's usage has not moved since; read it again with ${jobCostCall(sid)} once it has, and run this merge again with it before it lands; the merge goes on`);
  else log(`job ${id}'s cost: ${usd} USD${sid ? ` (session ${sid}, ${cost} so far)` : ' (no session named: the whole figure counted)'}`);
  return usd;
}

// The act that clears a receipt no green run on the tip has checked and agreed with: an amended
// receipt posts no commit, and a row from an earlier pin read it without checking it (AUD-2), so
// the gate on the tip needs a new event.
export function unread(runs, sha, attempt) {
  const r = runs.filter((x) => x.sha === sha).pop();
  if (!r || !r.ok || (r.receipt_attempt === attempt && r.receipt === 'agrees')) return '';
  if (r.receipt_attempt === attempt) return `; its newest run left the receipt ${r.receipt}${r.receipt_unmeasured ? `: ${r.receipt_unmeasured}` : ''}, not checked against CI's run of its tests: give the gate on ${sha.slice(0, 10)} a new event (edit the pull request)`;
  return `; its newest run read ${r.receipt_attempt == null ? 'no receipt' : `attempt ${r.receipt_attempt}`}: give the gate on ${sha.slice(0, 10)} a new event (edit the pull request)`;
}

// The provider-change route at a job's merge: the notice this job leaves its users, and the
// notices its START named, answered now that it merged. The merge stands if the write fails;
// merge <n> run again records them. A notice is left when the job changed a file of its module's
// own source (the tranche's entry, less tests, requirements, docs and records), requirement change
// or none, naming its export changes; a job that changed only those others leaves none, and the
// line says why.
// The notice the merge left, triaged at once (triageAtMerge): the one it recorded now, or, on a
// rerun that found it recorded already, the same notice. Never silent: a merge that leaves no
// notice says so, and a failure names the triage act; the merge stands either way.
export const triageLast = (t) => (t.error ? `notice triage at the merge FAILED (${t.error.split('\n')[0].slice(0, 160)}); next act: ${t.next}`
  : t.owed?.length ? `notice triage at the merge: ${t.owed.length} owe a worker's judgment; ${t.next}` : String(t.why || '').startsWith('none to run') ? `notice triage at the merge: ${t.why}` : `notice triage at the merge: ${t.why || `${t.rows?.length || 0} row(s) written`}, none owed`);
// The merge's first lines: with users owing a worker's judgment (or the triage failed), the
// notice's triage first, then the ready jobs' start; otherwise START_FIRST alone.
export function firstActs(t) {
  const key = t?.key || String(t?.next || '').match(/notice triage (\S+)/)?.[1];
  if (!key || !(t.owed?.length || t.error)) return [START_FIRST];
  const owe = t.error ? `its triage at the merge failed, ${t.owed?.length || 0} owed` : `${t.owed.length} user module${t.owed.length === 1 ? ' owes' : 's owe'} a worker's judgment: ${t.owed.join(', ')}`;
  return [`first: ${P3} notice triage ${key} (provider notice ${key}; ${owe}: a read-only worker judges them now, not in a later batch)`, START_FIRST.replace(/^first: /, 'then: ')];
}
function triageStep(root, cfg, notes, { ref, log }) {
  // On a rerun, the notice as recorded (its users as stored), and none when it was withdrawn.
  let raised = (notes.rows || []).find((x) => x.row === 'notice') || null;
  if (!raised && notes.notice) {
    try { raised = notices(root, cfg.state_branch).find((x) => x.key === notes.notice.key) || null; } catch { raised = null; }
    if (!raised) { const why = `notice ${notes.notice.key} is not on ${cfg.state_branch} (withdrawn, or unread)`; log(`notice triage at the merge: none to run (${why})`); return { rows: [], owed: [], why: 'none to run: ' + why }; }
  }
  if (!raised) { const why = notes.error ? `the notices were not written: ${notes.error.split('\n')[0]}; run the merge again` : 'the merge left no provider notice'; log(`notice triage at the merge: none to run (${why})`); return { rows: [], owed: [], why: 'none to run: ' + why }; }
  try { return triageAtMerge(root, cfg, raised, { ref, log }); } catch (e) {
    log(`the merge stands; notice triage ${raised.key} at the merge failed (${e.message}); next act: ${P3} notice triage ${raised.key}`);
    return { rows: [], owed: raised.users || [], key: raised.key, error: e.message, next: `${P3} notice triage ${raised.key}` };
  }
}

function noticeStep(root, cfg, { id, n, mb, head, at, entry, log }) {
  const { notice, why, left } = entry ? providerChange(root, cfg, { provider: id, requirements: entry.requirements, base: mb, head, pr: n, usersAt: at, entry }) : { notice: null, why: null };
  if (why) log(`no provider notice: ${why}`);
  if (notice && left) log(`provider notice ${notice.key}: ${left}`);
  const answers = rowsAt(root, at, id).filter((x) => x.event === 'start').pop()?.notices || [];
  let notes = { rows: [] };
  try { notes = recordAtMerge(root, cfg, { notice, answers, user: id, pr: n }); } catch (e) {
    log(`the merge stands, but its provider notices were not written to ${cfg.state_branch} (${e.message}); run merge ${n} again to record them`);
    return { rows: [], error: e.message };
  }
  if (notice) notes = { ...notes, notice };
  for (const x of notes.rows) log(x.row === 'notice' ? `${noticeLine(x)} recorded for ${x.users.join(', ')}` : `provider notice ${x.key} answered by ${x.user}`);
  if (!notes.rows.length) log(`provider notices for PR ${n}: nothing to record`);
  return notes;
}

function noticesOnly(root, cfg, { id, n, pr, slug, log, compare: compareRead }) {
  const m = pr.merge_commit_sha;
  const { head: h, mb } = mergedRange(root, m, { slug, n, what: 'its provider notices cannot be read', ...(compareRead ? { read: compareRead } : {}) });
  const entryText = git(['show', `${mb}:${entryFile(id)}`], { cwd: root, allowFail: true });
  const entry = entryText.code === 0 ? JSON.parse(entryText.stdout) : null;
  log(`pull request ${n} is merged; recording only its provider notices`);
  const notices = noticeStep(root, cfg, { id, n, mb, head: h, at: m, entry, log });
  const triage = triageStep(root, cfg, notices, { ref: m, log });
  // A triage owed is the first act here too (no ready line: this run merged nothing).
  const first = firstActs(triage);
  if (first.length > 1) log(first[0]);
  if (!String(triage?.why || '').startsWith('none to run')) log(triageLast(triage));
  return { merged: true, sha: m, notices, triage };
}

// A merge GitHub refuses because its base moved ("Base branch was modified") fetches the base,
// confirms the pull request still has the head and base that were checked, and tries again, at
// most RETRIES times in all. Any other refusal stops at once. Never forced.
//
// A reply that cannot be read (measured 4 Nov: "gh api -X PUT failed: unexpected end of JSON
// input", the pull request left unmerged, and the same run again merged it): with `reread`
// ({ read, sha }), the pull request is read again. Merged with this head is success; open with the
// head unchanged tries the PUT once more; anything else stops. A refusal GitHub stated (a JSON
// body, which gh prints with its HTTP status) is not this case. Nor is a refusal of the budget's
// or of GitHub's rate limit (R17d): the merge was never made, and the reply is no unread one; read
// as one, the PUT was sent again at once into the same refusal, and the stop named an unread
// reply, not the refusal and its rerun.
export const unreadable = (msg) => {
  if (BUDGET.test(String(msg))) return false;
  const body = String(msg).replace(/^gh api -X PUT failed:\s*/, '').trim();
  if (!body) return true;
  if (/\(HTTP \d{3}\)/.test(body)) return false;
  try { JSON.parse(body); return false; } catch { return true; }
};

export function mergeRetry(call, { fetch = () => {}, check = () => {}, tries = RETRIES, wait = 3000, log = console.log, reread = null } = {}) {
  let again = false;
  for (let t = 1; ; t++) {
    let r;
    let why = null;
    let unread = null;
    try { r = call(); } catch (e) {
      if (!(e instanceof Fail)) throw e;
      if (BASE_MOVED.test(e.message)) why = e.message;
      else if (reread && unreadable(e.message)) unread = e.message;
      else throw e;
    }
    if (!why && !unread && reread && (r === null || r === undefined || typeof r !== 'object')) unread = `the reply was ${r == null ? 'empty' : 'not JSON'}`;
    if (unread) {
      const p = reread.read();
      if (p?.merged && p.head?.sha === reread.sha) {
        log(`GitHub's reply to the merge could not be read (${unread}); the pull request is merged at ${reread.sha.slice(0, 10)}`);
        return { merged: true, sha: p.merge_commit_sha, message: 'merged (read back after an unreadable reply)' };
