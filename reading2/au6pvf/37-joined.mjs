// ===== file: notice.test.mjs (continued) =====

  assert.throws(() => withdrawNotice(root, cfg, 'p:651', { ...io, merged: () => 'unknown' }), /could not be read; provider notice p:651 stands; run it again/);
  assert.equal(withdrawNotice(root, cfg, 'p:651', io).missing, true);
  fetchState(root, cfg.state_branch, { fresh: true });
  assert.deepEqual(notices(root, cfg.state_branch).map((n) => n.key), ['p:12', 'p:650']);
});

test('mergedHere: a shallow clone reads a throwaway clone back from the notice\'s time; without a time it is unknown', () => {
  const root = product();
  completeAll(root);
  git(['checkout', '-q', '-B', 'job/p', 'tranche'], { cwd: root });
  commit(root, { 'test/p/c.test.mjs': passing('p hidden') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'Merge pull request #660 from o/job', 'job/p'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const url = git(['remote', 'get-url', 'origin'], { cwd: root });
  const shallow = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', `file://${url}`, shallow], { cwd: root });
  const cfg = loadConfig(root);
  const at = new Date().toISOString();
  assert.equal(mergedHere(shallow, cfg, 660, { at }), 'merged');
  assert.equal(mergedHere(shallow, cfg, 661, { at }), 'none');
  assert.equal(mergedHere(shallow, cfg, 661), 'unknown');
  assert.equal(mergedHere(root, cfg, 660), 'merged');
  assert.equal(mergedHere(root, cfg, 66), 'none');
});

// ===== file: report.mjs (later part) =====

  // Refusals by role and act: every refusal the record holds, as metrics report lists them
  // (refusalList: the refusal rows and the measured rows' refusals); a session's role from its
  // rows, the measured rows that name it and the state branch's addresses and handovers; a row
  // with none reads "role unknown". Those dated before the opening are listed apart.
  const roles = new Map([...sessionRoles(rows), ...(stateRead ? stateRoles(read.state) : [])]);
  const refs = refusalList(rows, roles);
  const refTable = (rs) => { const tally = new Map(); for (const r of rs) { const k = `${r.role}\0${r.act ?? U}`; tally.set(k, (tally.get(k) || 0) + 1); } return [...tally].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, n]) => [...k.split('\0'), n]); };
  const refNow = refs.filter(inT);
  const refOld = refs.filter((r) => !inT(r));
  L.push('## Refusals by role and act', '');
  L.push(`Since the opening${opened ? '' : ` (${U}: the opening not read; all listed below)`}: ${refNow.length}.`, '');
  if (refNow.length) L.push(...table(['role', 'act', 'refusals'], refTable(refNow)), '');
  if (refOld.length) L.push(`${opened ? 'Before the opening' : 'Recorded'}: ${refOld.length}.`, '', ...table(['role', 'act', 'refusals'], refTable(refOld)), '');

  // BOB idle
  const sweeps = stateJsonl('metrics/sweep.jsonl');
  const idle = sweeps === null ? U : idleByDay(sweeps);
  L.push('## BOB idle occurrences', '', 'Per UTC day, the sweeps that found acts listed for BOB and the longest BOB had been quiet at one (`metrics report` `bob_idle_by_day`).', '');
  L.push(...(Array.isArray(idle) ? table(['day', 'occurrences', 'longest quiet (h)', 'unmeasured sweeps'], idle.map((d) => [d.day, d.occurrences, d.longest_quiet_h, d.unmeasured_sweeps])) : [U]), '');

  // Flow (audit of PR 139): cap use, a diagnostic, beside velocity, efficiency and quality, whole and by
  // concurrency bucket; and the hours each setter's holds held, by reason.
  const fl = sweeps === null ? null : flowFigures({ sweeps, rows: here || rows, unmetAt: unmetAtRef(root, cfg, tip), gates: (pr) => gateRuns(read.comments(pr) || []), syncs: countCommits(root, tip, opened, end, '^Bring job/'), reverts: countCommits(root, tip, opened, end, '^Revert'), quick: quickBlocks(root, jobRefs, { from: opened, to: end }), from: opened, to: end });
  const pc = (x) => (typeof x === 'number' ? `${Math.round(x * 100)}%` : U);
  const hh = stateJsonl(HOLDS_FILE);
  L.push('## Flow', '', `Since ${opened ? 'the opening' : 'the first sweep row (the opening not read)'}, from the sweep rows (\`metrics report\` \`flow\`): ${flowRule}`, '');
  const qb = fl && typeof fl.started_then_blocked === 'object' ? fl.started_then_blocked : null;
  if (!fl) L.push(`${U} (the state branch's sweep rows not read).`, '');
  else {
    L.push(`- cap use: ${pc(fl.cap_use)} over ${fl.hours} h; IDLE CAPACITY alarms (idle stretches) ${fl.idle_alarms}`, `- velocity: ${fl.velocity_per_h} marks per hour`, `- efficiency: ${fl.merges_per_job_session_h} merges per job session-hour; per merged PR, gate runs ${fl.gate_runs_per_pr}, syncs ${fl.syncs_per_pr}, cancels ${fl.cancels_per_pr}`, `- quality: false-done share ${pc(fl.false_done_share)}; reopened marks ${fl.reopened_marks}; reverts ${fl.reverts}`, `- started then blocked within ${qb?.minutes ?? QUICK_BLOCK_MIN} min: ${qb ? `${qb.blocked} of ${qb.starts} starts (${pc(qb.share)})${qb.by_module.length ? `; by module: ${qb.by_module.map((x) => `${x.module} ${x.blocked} of ${x.starts}`).join(', ')}` : ''}${qb.unread?.length ? `; unmeasured, branches not read: ${qb.unread.join(', ')}` : ''}` : U}`, '');
    if (fl.buckets.length) L.push(...table(['live', 'hours', 'cap use', 'marks per hour', 'merges per job session-hour', 'gate runs per PR', 'false-done', 'reopened marks'], fl.buckets.map((q) => [q.live, q.hours, pc(q.cap_use), q.velocity_per_h, q.merges_per_job_session_h, q.gate_runs_per_pr, pc(q.false_done_share), q.reopened_marks])), '');
  }
  const held = hh === null ? null : holdHours(hh, opened, end, landedPRs(root, tip));
  L.push(`Hold-hours by setter and reason${held === null ? `: ${U}` : held.length ? ':' : ': none.'}`, '');
  if (held?.length) L.push(...table(['set by', 'reason', 'holds', 'hours'], held.map((x) => [x.by, x.why, x.holds, x.hours])), '');

  // Lead times
  // A close whose commit cannot be placed is passed undecided: its figure reads unmeasured.
  const undecidedRows = mine.filter((x) => x.in === null && !closedBy.has(x.r.layer)).map((x) => ({ ...x.r, undecided: true }));
  const lt = leadTimes(root, cfg, { ref: tip, rows, jobRows, layers, now, jobRefs, sweeps, comments: (pr) => gateRuns(read.comments(pr) || []), ...(stateRead ? { ...leadIn, closed: [...closedBy.values(), ...undecidedRows] } : {}) });
  L.push('## Lead times', '', `Minutes, each beside its target (\`targets\` in process/config.json); "over" marks one past it. ${lt.rule}`, '');
  L.push(`- tranche opened: ${lt.opened}`, '');
  L.push(...(!Array.isArray(lt.jobs) ? [`Per job: ${U} (the tranche's opening not read).`] : lt.jobs.length ? table(['job', 'ready to start', 'start to PR ready', 'green to merge', 'blocked', 'replace', 'report wait'], lt.jobs.map((j) => [j.module, leadCell(j.ready_to_start), leadCell(j.start_to_pr_ready), leadCell(j.green_to_merge), leadCell(j.blocked), leadCell(j.replace), leadCell(j.report_wait)])) : ['No job has a start row since the opening.']), '');
  L.push(`- layer close to next job start: ${Array.isArray(lt.close_to_next_start) ? (lt.close_to_next_start.length ? lt.close_to_next_start.map((c) => `layer ${c.layer} ${leadCell(c)}`).join('; ') : 'no layer closed') : U}`);
  for (const [k, v] of Object.entries(lt.summary)) L.push(`- ${k.replace(/_/g, ' ')}: ${leadSummaryCell(v)}`);
  L.push('');

  // Phase 3 overhead comparisons
  // Attempts by the one definition lead times and metrics report use (ATTEMPTS_RULE).
  const started = attemptsStarted(here || []);
  const jobs = [...started.keys()].sort();
  const sess = (m) => { const ss = new Set(measured.filter((r) => r.module === m && (r.role || 'job') === 'job' && r.session).map((r) => r.session)); return ss.size || U; };
  const perJob = jobs.map((m) => [m, started.get(m), sess(m)]);
  const known = perJob.filter((r) => typeof r[2] === 'number');
  const gates = mergeRows.map((r) => { try { return gateRuns(read.comments(r.pr) || []).length; } catch { return U; } });
  const gatesOk = gates.length && gates.every((g) => typeof g === 'number');
  const rec = recordOnly(root, cfg, s.base, s.close ? null : 'origin/main', tip, deepened);
  L.push('## Phase 3 overhead comparisons', '');
  L.push(`- sessions per job: ${known.length === jobs.length && jobs.length ? Math.round(known.reduce((t, r) => t + r[2], 0) / jobs.length * 100) / 100 : U}${known.length && known.length < jobs.length ? ` (${known.length} of ${jobs.length} jobs measured: ${Math.round(known.reduce((t, r) => t + r[2], 0) / known.length * 100) / 100})` : ''}`);
  L.push(`- gate runs per merged job: ${gatesOk ? Math.round(gates.reduce((t, g) => t + g, 0) / gates.length * 100) / 100 : U}${gatesOk ? ` (${gates.reduce((t, g) => t + g, 0)} runs over ${gates.length} distinct pull requests merged since the opening)` : ''}`);
  L.push(`- record-only commits: ${typeof rec === 'object' ? `${rec.record} of ${rec.total} commits in the tranche` : U}`, '');
  L.push(`Attempts: ${ATTEMPTS_RULE}.`, '');
  if (perJob.length) L.push(...table(['job', 'attempts started', 'job sessions measured'], perJob), '');
  else if (!opened) L.push(`Per job: ${U} (the tranche's opening not read).`, '');

  // Base-red (basered.mjs): failures a job's gate tolerated because the tranche had them too.
  // Merged green, they are still owed: the tranche into main runs them again.
  L.push('## Base-red tests owed', '', 'Failing tests a merged job\'s gate tolerated because they failed at the tranche tip it merged into too. The tranche into main runs them again with no tolerance.', '');
  const owed = baseRedOwed(mergeRows, (pr) => gateRuns(read.comments(pr) || []));
  L.push(...(owed === null ? [U] : owed.length ? table(['job', 'PR', 'test', 'base'], owed.map((o) => [o.module, `#${o.pr}`, o.test, String(o.base).slice(0, 10)])) : ['None.']), '');
  return L.join('\n');
}

// The report's provider-notice section from noticeSlots' result (null: the state branch unread).
const KIND = { triage: 'triage owed', affected: 'judged affected: notice work', job: 'named by its open job', rerun: 'merged job named it, answer not recorded' };
export function noticeSection(slots) {
  const L = ['## Provider notices', ''];
  if (!slots) return [...L, `Open notice slots: ${U} (the state branch's notices not read).`];
  const keys = [...new Set(slots.slots.map((x) => x.key))];
  const by = (k) => slots.slots.filter((x) => x.kind === k).length;
  const wSlots = slots.withdrawn.reduce((t, w) => t + w.closed, 0);
  L.push(`Open notice slots (one notice, one user module, unanswered): ${slots.slots.length} across ${keys.length} notices; ${Object.entries(KIND).map(([k, w]) => `${w} ${by(k)}`).join(', ')}.`);
  L.push(`Withdrawn (closed, owing nothing; never counted open): ${slots.withdrawn.length} notices${slots.withdrawn.length ? `, ${wSlots} unanswered slots closed by withdrawal (${slots.withdrawn.map((w) => `${w.key} ${w.closed}`).join(', ')})` : ''}.`, '');
  if (!slots.slots.length) return [...L, 'No open slot.'];
  // One row per notice and act: a notice's untriaged modules share one `notice triage`.
  const rows = new Map();
  for (const x of slots.slots) {
    const k = `${x.key}\0${x.kind}\0${x.act}`;
    const r = rows.get(k) || { key: x.key, kind: x.kind, act: x.act, users: [] };
    r.users.push(x.user);
    rows.set(k, r);
  }
  return [...L, ...table(['notice', 'open slots', 'state', 'modules', 'closed by'], [...rows.values()].map((r) => [r.key, r.users.length, KIND[r.kind], r.users.length > 6 ? `${r.users.slice(0, 6).join(', ')} and ${r.users.length - 6} more` : r.users.join(', '), `\`${r.act}\``]))];
}

// ===== file: record.test.mjs (later part) =====

  assert.deepEqual(run('HEAD'), []);
  // T1 then T2 merged: the head ends on the owner's current version, so the earlier merge puts nothing back.
  git(['reset', '-q', '--hard', m], { cwd: root });
