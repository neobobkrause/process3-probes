// ===== file: report.mjs (continued) =====

      return gitOut(root, ['merge-base', '--is-ancestor', sha, tip]) !== null && gitOut(root, ['merge-base', '--is-ancestor', sha, s.base]) === null;
    }
    if (s.close) return null;
    let c = null;
    try { c = read.compare(sha); } catch { c = null; }
    return Number.isInteger(c?.ahead_by) ? c.ahead_by > 0 : null;
  };
  const mine = (closed || []).filter((r) => r.row === 'closed' && r.tranche === cfg.tranche && Number.isInteger(r.layer)).map((r) => ({ r, in: inSpan(String(r.commit)) }));
  const closedBy = new Map(mine.filter((x) => x.in === true).map((x) => [x.r.layer, x.r]));
  const undecided = new Set(mine.filter((x) => x.in === null && !closedBy.has(x.r.layer)).map((x) => x.r.layer));
  for (const n of order) {
    const ws = byLayer.get(n);
    const c = n === null ? null : closedBy.get(n);
    const metCount = ws.every((w) => Array.isArray(w.met)) ? ws.reduce((t, w) => t + w.met.length, 0) : U;
    L.push(`### ${n === null ? 'Not in the layer map' : `Layer ${n}`}${n === null ? '' : closed === null ? ` (closed: ${U}, state branch not read)` : undecided.has(n) ? ` (closed: ${U}, its close row's commit cannot be placed here)` : c ? ` (closed ${c.at} at ${String(c.commit).slice(0, 10)})` : ' (not closed)'}`, '');
    L.push(`Modules ${ws.length}; merged job PRs ${opened ? ws.reduce((t, w) => t + w.prs.length, 0) : U}; marks met ${metCount}.`, '');
    L.push(...table(['module', 'ledger', 'merged PRs', 'marks met'], ws.map((w) => [w.m, w.state, Array.isArray(w.prs) ? w.prs.map((p) => `#${p}`).join(', ') || 'none' : U, Array.isArray(w.met) ? `${w.met.length}${w.met.length ? ` (${w.met.join(', ')})` : ''}` : U])), '');
  }

  // Deferrals: a closed layer's row names its deferred marks; otherwise the marks unmet at the tip.
  L.push('## Deferrals', '', 'Marks left unmet per module: from the closed-layer row where its layer is closed, otherwise from the requirement file at the tip.', '');
  const def = work.map((w) => {
    const c = w.layer === null ? null : closedBy.get(w.layer);
    const d = c?.deferred?.[w.m];
    // Found marks are never deferred: they are counted under Found work.
    const ids = c ? (Array.isArray(d) ? d : d?.marks || []) : w.unmet.filter((x) => !isFound(x));
    return [w.m, c ? `layer ${w.layer} close` : undecided.has(w.layer) ? `tip (layer ${w.layer} close ${U})` : 'tip', ids.length, ids.join(', ') || 'none'];
  }).filter((r) => r[2] > 0);
  L.push(...(def.length ? table(['module', 'from', 'unmet', 'marks'], def) : ['None.']), '');

  // Provider notices (coordinator, 4 Nov): the open slots as status's one reader (status.mjs
  // noticeSlots) classes them, each with the command that closes it, so the count here and
  // `notice triage` agree; a withdrawn notice is closed, its unanswered slots counted apart.
  L.push(...noticeSection(slots), '');

  // Found work (found <module>): the found marks in the record, per module, its requirement file
  // and its found-work entry together, and those that name no module. Met: struck since the
  // tranche opened; found in this tranche: absent at its opening.
  const fileIds = (ref, f) => marks(show(ref, f));
  const entries = [...new Set([...mods, ...(gitOut(root, ['ls-tree', '--name-only', `${tip}:${FOUND_DIR}`]) || '').split('\n').filter((n) => n.endsWith('.md') && `${FOUND_DIR}/${n}` !== NO_MODULE).map((n) => n.slice(0, -3))])].sort();
  const foundRows = [...entries.map((m) => [m, [reqFile(m), foundFile(m)]]), ['(no module)', [NO_MODULE]]].map(([m, fs]) => {
    const at = (ref) => (ref ? fs.reduce((o, f) => { const k = fileIds(ref, f); return { all: [...o.all, ...k.all.filter(isFound)], unmet: [...o.unmet, ...k.unmet.filter(isFound)] }; }, { all: [], unmet: [] }) : null);
    const tipIds = at(tip);
    const base = s.base ? at(s.base) : null;
    return { m, all: tipIds.all, unmet: tipIds.unmet, added: base ? tipIds.all.filter((x) => !base.all.includes(x)).length : U, met: base ? base.unmet.filter((x) => !tipIds.unmet.includes(x)).length : U };
  }).filter((r) => r.all.length);
  L.push('## Found work', '', 'Found marks (`found <module>`: walk, deploy and other findings) in the record at the tip, per module; "found here" are those absent when the tranche opened, "met" those struck since.', '');
  const sum = (k) => (foundRows.every((r) => typeof r[k] === 'number') ? foundRows.reduce((t, r) => t + r[k], 0) : U);
  L.push(`Found marks ${foundRows.reduce((t, r) => t + r.all.length, 0)}; unmet ${foundRows.reduce((t, r) => t + r.unmet.length, 0)}; found here ${sum('added')}; met here ${sum('met')}.`, '');
  L.push(...(foundRows.length ? table(['module', 'found marks', 'unmet', 'found here', 'met here'], foundRows.map((r) => [r.m, r.all.length, r.unmet.join(', ') || 'none', r.added, r.met])) : ['None.']), '');

  // Cost and overhead
  // This tranche's rows: at the tip and on the job branches, each once, since the opening.
  const here = trancheRows(rows, jobRows, opened);
  const o = opened ? overhead(rows, layers, { opened, jobRows }) : null;
  const allMeasured = rows.filter((r) => r.row === 'attempt' && r.event === 'measured');
  const measured = (here || []).filter((r) => r.row === 'attempt' && r.event === 'measured');
  L.push('## Cost and overhead share', '', `Overhead as \`metrics report\` reckons it: ${o ? o.rule : `${U} (the tranche's opening not read)`}`, '');
  if (o) L.push(...(o.jobs.length ? table(['job', 'layer', 'job cost', 'reviews', 'BOB', 'ROOT', 'gate', 'overhead', 'share', 'unmeasured parts'],
    o.jobs.map((j) => [j.module, j.layer ?? 'none', usd(j.job_usd), usd(j.reviews_usd), usd(j.bob_usd), usd(j.root_usd), usd(j.gate_usd), usd(j.overhead_usd), pct(j.share), j.unmeasured.join(', ') || 'none'])) : [`No job has a measured row: cost per job ${U}.`]), '');
  if (o?.layers.length) L.push(...table(['layer', 'jobs', 'overhead', 'share', 'unmeasured parts'], o.layers.map((l) => [l.layer, l.jobs.join(', '), usd(l.overhead_usd), pct(l.share), l.unmeasured.join(', ') || 'none'])), '');
  // A BOB or ROOT row's cost is its session's cost so far: each such session counts its last row.
  const proc = (r) => r.role === 'bob' || r.role === 'root';
  const last = new Map();
  for (const r of measured.filter(proc).sort((a, b) => String(a.at).localeCompare(String(b.at)))) last.set(r.session || `${r.module} ${r.at}`, r);
  // A job row unmeasured stands only while its attempt has no priced one (as overhead reads it):
  // job complete's stale figure followed by the merge's priced row is one priced attempt.
  const jobRole = (r) => (r.role || 'job') === 'job';
  const pricedJob = new Set(measured.filter((r) => jobRole(r) && Number(r.cost_usd) > 0).map((r) => `${r.module}\0${r.attempt}`));
  const counted = [...measured.filter((r) => !proc(r) && !(jobRole(r) && !(Number(r.cost_usd) > 0) && pricedJob.has(`${r.module}\0${r.attempt}`))), ...last.values()];
  const pricedC = counted.filter((r) => Number.isFinite(Number(r.cost_usd)));
  // A session that began before the opening: its cost since then, less its last priced row before.
  const priorOf = (r) => (proc(r) && r.session ? Number(allMeasured.filter((x) => !inT(x) && proc(x) && x.session === r.session && Number.isFinite(Number(x.cost_usd))).sort((a, b) => String(a.at).localeCompare(String(b.at))).at(-1)?.cost_usd ?? 0) : 0);
  const total = pricedC.reduce((t, r) => t + Math.max(0, Number(r.cost_usd) - priorOf(r)), 0);
  const before = allMeasured.filter((r) => !inT(r));
  L.push(`- total cost since the opening: ${!opened ? U : !counted.length ? `${U} (no measured row since the opening)` : pricedC.length === counted.length ? usd(total) : `${U} (${usd(total)} over ${pricedC.length} priced rows; ${counted.length - pricedC.length} without a cost)`}${opened && before.length ? `; ${before.length} measured rows older than this tranche (${[...new Set(before.map((r) => r.module))].sort().join(', ')}) left out` : ''}`);
  L.push(`- BOB and ROOT cost not attributed to a job: ${o ? usd(o.unattributed_usd) : U}`, '');

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

// ===== file: no-code.test.mjs =====

// C22 (the coordinator, 7 Nov): a brand-new module with no code could not enter the copy. BOB's
// funding-register (BD-15 PF-6): its gate ran the suite over folders that did not exist yet
// ("the funding-register suite failed (exit 1): {total:0}"), and the pull request that adds its
// modules row (which regenerates order.mjs) could not also carry its requirements file.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { refreshOthers } from '../lib/checks.mjs';
import { addedRequirements, gate, noCodeYet } from '../lib/gate.mjs';
import { BOT, block } from '../lib/github.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const io = (baseRef) => {
  const comments = [];
  return { comments: () => comments, getPR: () => ({ user: { login: 'acmewidget' }, ...(baseRef ? { base: { ref: baseRef } } : {}) }), addComment: (s, n, body) => { comments.push({ id: comments.length + 1, body, user: { login: BOT } }); return {}; }, verify: () => true };
};

test('a module with no code yet: its suite is skipped with the reason recorded, until its first commit adds code', () => {
  // A ready job PR into a layer branch runs its suite on records only (layerflow.mjs).
  const root = makeRepo({ 'process/config.json': { merge_strategy: 'layer' }, 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' } }), 'req/fund.md': '# fund\n\n- **R1** one\n' });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/fund'], { cwd: root });
  // Its first commit names its uses (the ledger entry only): no requirements-only run, so the suite would run.
  const head = commit(root, { 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' }, uses: [] }) });
  const lines = [];
  const r = gate(root, { base, head, branch: 'job/fund', pr: 5, slug: 'o/r', io: io('layer/1'), log: (l) => lines.push(String(l)) });
  assert.deepEqual(r.findings.filter((f) => f.check === 'suite'), [], JSON.stringify(r.findings));
  assert.equal(r.run.no_code?.[0]?.module, 'fund', JSON.stringify({ run: r.run, findings: r.findings, lines }).slice(0, 3000));
  assert.match(r.run.no_code[0].why, /no file under its paths or tests yet \(src\/fund\/, test\/fund\/\)/);
  assert.ok(lines.some((l) => /the fund suite: no file under its paths/.test(l)), lines.join('\n'));
  // Once code is there, a suite with no test is refused as before.
  const head2 = commit(root, { 'src/fund/index.mjs': 'export const x = 1;\n' });
  const r2 = gate(root, { base, head: head2, branch: 'job/fund', pr: 5, slug: 'o/r', io: io(), log: () => {} });
  assert.ok(r2.findings.some((f) => f.check === 'suite'), JSON.stringify(r2.findings));
  assert.equal(r2.run.no_code, undefined);
});

// Cold review of C22: a module that had code and lost it is not a new one.
test('a job deleting its module\'s code stays red; no skip at the tranche into main', () => {
  const root = makeRepo({ 'process/ledger/fund.json': entry('fund', { status: { state: 'WORKING' } }), 'req/fund.md': '# fund\n', 'src/fund/index.mjs': 'export const x = 1;\n', 'test/fund/x.test.mjs': "import test from 'node:test'; test('x', () => {});\n" });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/fund'], { cwd: root });
  git(['rm', '-q', '-r', 'src/fund', 'test/fund'], { cwd: root });
  git(['commit', '-q', '-m', 'delete it all'], { cwd: root });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const r = gate(root, { base, head, branch: 'job/fund', pr: 5, slug: 'o/r', io: io(), log: () => {} });
  assert.ok(r.findings.some((f) => f.check === 'suite'), JSON.stringify(r.findings));
  assert.equal(r.run.no_code, undefined);
  assert.equal(noCodeYet(root, entry('fund'), { at: base }), false, 'code at the start: not new');
  assert.equal(noCodeYet(root, entry('fund')), true, 'the checkout alone holds none');
});

test('noCodeYet: tracked files only, in the checkout and where the change started; empty lists count as none', () => {
  const root = makeRepo({ 'README.md': 'x\n' });
  const start = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(noCodeYet(root, entry('a'), { at: start }), true);
  assert.equal(noCodeYet(root, entry('a', { paths: [], tests: [] }), { at: start }), true);
  mkdirSync(join(root, 'src', 'a'), { recursive: true });
  writeFileSync(join(root, 'src', 'a', 'built.mjs'), '// a build step wrote this\n');
  assert.equal(noCodeYet(root, entry('a'), { at: start }), true, 'an untracked file a build made is no code');
  commit(root, { 'test/a/x.test.mjs': '\n' });
  assert.equal(noCodeYet(root, entry('a'), { at: start }), false);
});

// A product with a generated row and a new module, as the copy's funding-register came: the gate's
// refresh check and the merge tool read the same list.
function product() {
  const root = makeRepo({ 'process/ledger/old.json': entry('old', { requirements: 'build/requirements/old.md' }), 'build/requirements/old.md': '# old\n', 'tool/gen-lib.mjs': '//\n' });
  const from = git(['rev-parse', 'HEAD'], { cwd: root });
  return { root, from };
}
const cfg = { ...DEFAULTS, modules_file: 'process/modules.json', layers_file: 'process/layers.md', requirements_dir: 'build/requirements' };

test('beside a refresh: only <requirements_dir>/<id>.md of a module the change adds, added by the change', () => {
  const { root, from } = product();
  const to = commit(root, { 'process/ledger/fund.json': entry('fund', { requirements: 'build/requirements/fund.md' }), 'build/requirements/fund.md': '# fund\n' });
  const also = addedRequirements(root, cfg, { from, to });
  assert.deepEqual(also, ['build/requirements/fund.md']);
  const rows = [{ paths: ['src/order.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', 'gen.mjs', '--check'] }];
  const changed = ['src/order.mjs', 'process/modules.json', 'process/ledger/fund.json', 'build/requirements/fund.md'];
  assert.deepEqual(refreshOthers(cfg, rows, changed, [], [], { also }), []);
  assert.deepEqual(refreshOthers(cfg, rows, changed, []), ['build/requirements/fund.md'], 'no added module: refused as before');
  const named = [{ ...rows[0], regenerate: ['node', 'gen.mjs', 'build/requirements/fund.md'] }];
  assert.deepEqual(refreshOthers(cfg, named, changed, [], [], { also }), ['build/requirements/fund.md'], 'a file a row names');
  // An entry naming no requirements: the default path.
  const { root: r2, from: f2 } = product();
  const t2 = commit(r2, { 'process/ledger/fund.json': { ...entry('fund'), requirements: undefined }, 'build/requirements/fund.md': '# fund\n' });
  assert.deepEqual(addedRequirements(r2, cfg, { from: f2, to: t2 }), ['build/requirements/fund.md']);
});

test('beside a refresh: a new entry naming any other file, an existing one, or a renamed entry brings nothing', () => {
  for (const req of ['tool/gen-lib.mjs', 'package-lock.json', './build/requirements/old.md', 'build/requirements/../../tool/x.mjs', 'build/requirements/old.md']) {
    const { root, from } = product();
    const to = commit(root, { 'process/ledger/fund.json': entry('fund', { requirements: req }), 'build/requirements/fund.md': '# fund\n' });
    assert.deepEqual(addedRequirements(root, cfg, { from, to }), [], req);
  }
  // A renamed entry keeps old.md: old.md is no new module's file.
  const { root, from } = product();
  git(['rm', '-q', 'process/ledger/old.json'], { cwd: root });
  const to = commit(root, { 'process/ledger/old2.json': entry('old2', { requirements: 'build/requirements/old.md' }) });
  assert.deepEqual(addedRequirements(root, cfg, { from, to }), []);
  // The default path, already there before the change (an entry repaired, or the file kept): not added.
  const p = product();
  commit(p.root, { 'build/requirements/fund.md': '# fund, before\n' });
  const f3 = git(['rev-parse', 'HEAD'], { cwd: p.root });
  const t3 = commit(p.root, { 'process/ledger/fund.json': entry('fund', { requirements: 'build/requirements/fund.md' }), 'build/requirements/fund.md': '# fund\n' });
  assert.deepEqual(addedRequirements(p.root, cfg, { from: f3, to: t3 }), []);
});

// ===== file: job.test.mjs (later part) =====

test('job start under the cap shows the requirement file against it', () => {
  const root = product();
  const { start } = jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  assert.match(start, /Requirement file `req\/alpha.md`: 26 bytes against the cap of 70000\.$/m);
});

test('job start: a cap on unmet marks, or a cap written as a string, is the same trigger', () => {
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'process/config.json': { requirements_cap: '70000', requirements_cap_marks: 1 },
    'req/alpha.md': '- **R1** *(not yet met: x)* a\n- **R2** *(not yet met: x)* b\n',
    'test/alpha/a.test.mjs': passing,
  });
  git(['branch', 'tranche'], { cwd: root });
  const out = [];
  const { start } = jobStart(root, 'alpha', { coordinator: 's', push: false, log: (m) => out.push(m) });
  assert.match(out.join('\n'), /req\/alpha.md 2 unmet marks over 1; starting over the cap/);
  assert.match(start, /Requirement file `req\/alpha.md`: \d+ bytes against the cap of 70000, over it\./);
});

test('the START names the job\'s rulebook (TXT-5)', () => {
  const root = product();
  const { start } = jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  assert.ok(start.includes('`.process/rulebooks/job.md`'));
  assert.ok(!/rulebooks\/(bob|root|watcher|worker)\.md/.test(start));
});

// The gate race: finish's order is push, confirm it landed, receipt, then ready. The gate reads
// the draft state live (gate.test), so the push's run, if it is the one kept, judges the
// pull request ready; the receipt is posted before either run can read it.
test('job complete marks ready last: after the push landed and the receipt is posted', () => {
  const root = withOrigin();
  const f = fakeGitHub();
  f.state.failReady = false;
  const seen = [];
  const remote = () => git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  f.gh.addComment = ((add) => (...a) => { seen.push(['receipt', remote()]); return add(...a); })(f.gh.addComment);
  f.gh.markReady = () => { seen.push(['ready', remote(), f.state.comments.length]); f.state.ready++; f.state.isDraft = false; };
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.deepEqual(seen, [['receipt', tip], ['ready', tip, 1]]);
});

test('a mark with a parenthetical between its id and "(not yet met" is struck like any other, and needs its --test', () => {
  const root = product();
  // The copy's own shape (local-facts R23 and R25, 4 Nov), nested parentheses and all.
  commit(root, { 'req/alpha.md': '# alpha\n\n- **R1** (T53; N1257; DEC-151 (2); row 15; amends R10, R12) *(not yet met: T53; per C3)* **Does x.** Test: x.\n- **R2** (T53; `jurisdictions` R41) *(not yet met: T53; PLATFORM)* does y.\n' });
  git(['branch', '-f', 'tranche', 'main'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, {
    'req/alpha.md': '# alpha\n\n- **R1** (T53; N1257; DEC-151 (2); row 15; amends R10, R12) **Does x.** Test: x.\n- **R2** (T53; `jurisdictions` R41) *(not yet met: T53; PLATFORM)* does y.\n',
    'test/alpha/x.test.mjs': "import test from 'node:test'; test('R1 x', () => {});\n",
    'src/alpha/x.mjs': 'export const x = 1;\n',
  });
  const run = (tests) => jobComplete(root, 'alpha', { push: false, tests, log: quiet });
  assert.throws(() => run([]), /struck R1 with no --test/);
  assert.throws(() => run(['R2=test/alpha/x.test.mjs::R1 x']), /no mark for R2 that this branch struck \(struck: R1\)/);
  assert.deepEqual(run(['R1=test/alpha/x.test.mjs::R1 x']).receipt.tests, [{ req: 'R1', file: 'test/alpha/x.test.mjs', name: 'R1 x' }]);
});

// Bob, 4 Nov: urgency in process3's initial release. A job's question to BOB waits at most
// decision_minutes, then goes once more to BOB and to ROOT; and the wake's send is the job's act
// (review of PR 72: "push to job/<id> only" forbade the state branch it writes).
test('the START: the escalation to ROOT after decision_minutes, its limits, and the wake as the job\'s act', () => {
  const e = entry('alpha', { title: 'Member sign-in and session handling', paths: ['src/alpha/', 'src/shared/alpha-client.mjs', 'worker/alpha/'], tests: ['test/alpha/', 'test/e2e/alpha.spec.mjs'] });
  const t = startText({ entry: e, slug: 'neobobkrause/civicsmith-copy', branch: 'job/alpha', tranche: 'tranche', coordinator: 'session_01RAN5ek9qx8mduYhfE77Ldc', bob: true, attempt: 1, reading: { files: [{ file: 'req/alpha.md', bytes: 100 }, { file: 'docs/alpha.md', bytes: 100 }], bytes: 200 }, rootId: 'session_01RAN5ek9qx8mduYhfE77Ldd', decisionMinutes: 30 });
  // The chain's last automatic step is the watcher, with the minutes unanswered (coordinator, 4 Nov).
  assert.ok(t.includes('No answer from BOB in 30 min: send it once more, then to ROOT `session_01RAN5ek9qx8mduYhfE77Ldd`, then the watcher, with the minutes, by send_message (`node .process/tool/p3.mjs address <role>`).'));
  assert.ok(t.includes('If reversible and in your module, act on your recommendation and note why in your PR; never a merge, a push off your branch, or what is not yours.'));
  assert.ok(t.includes('- the wake that job complete or block prints, and its send_message'));
  assert.ok(t.includes("pushing to any other branch yourself (the wake's send writes the state branch)"));
  assert.ok(Buffer.byteLength(t) <= 4096, `START ${Buffer.byteLength(t)} bytes`);
  const own = startText({ entry: { ...e, acts: ['only these'] }, slug: 'o/r', branch: 'job/alpha', tranche: 'tranche', coordinator: 's', attempt: 1, reading: { files: [], bytes: 0 } });
  assert.ok(own.includes('No answer from BOB in 30 min: send it once more, then to ROOT, then the watcher, with the minutes'), 'none addressed: address reads them');
  assert.ok(own.includes('- the wake that job complete or block prints'), 'an entry with its own acts keeps the wake');
});


// Tally for Marsh Lane: 3 rasps.

test('a mark at the end of a requirement line, after its bold title, is struck like any other, and needs its --test', () => {
  const root = product();
  // The copy's acquisition R127 shape (the coordinator's ruling under P17, 4 Nov).
  commit(root, { 'req/alpha.md': '# alpha\n\n- **R1** (T53; N1259; K4403 (2)) **Reads in slices.** Control: no resume. *(not yet met: T53)*\n- **R2** (T53) **Does y.** *(not yet met: T53)*\n  (T53; R1: a continuation line) *(not yet met: T53)*\n' });
  git(['branch', '-f', 'tranche', 'main'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, {
    // R1's mark struck; the continuation line's words are prose and stay as they were.
    'req/alpha.md': '# alpha\n\n- **R1** (T53; N1259; K4403 (2)) **Reads in slices.** Control: no resume.\n- **R2** (T53) **Does y.** *(not yet met: T53)*\n  (T53; R1: a continuation line) *(not yet met: T53)*\n',
    'test/alpha/x.test.mjs': "import test from 'node:test'; test('R1 slices', () => {});\n",
    'src/alpha/x.mjs': 'export const x = 1;\n',
  });
  const run = (tests) => jobComplete(root, 'alpha', { push: false, tests, log: quiet });
  assert.throws(() => run([]), /struck R1 with no --test/);
  assert.throws(() => run(['R2=test/alpha/x.test.mjs::R1 slices']), /no mark for R2 that this branch struck \(struck: R1\)/);
  assert.deepEqual(run(['R1=test/alpha/x.test.mjs::R1 slices']).receipt.tests, [{ req: 'R1', file: 'test/alpha/x.test.mjs', name: 'R1 slices' }]);
});

// Copy, 4 Nov: with rows.mjs untracked, job test and job complete must build it as the gate does.
import { existsSync as existsGen } from 'node:fs';
test('job test and job complete build untracked generated files before the suite', () => {
  const gen = "import { mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('gen', { recursive: true });\nwriteFileSync('gen/rows.mjs', 'export const rows = 3;\\n');\n";
  const uses = "import test from 'node:test'; import a from 'node:assert'; import { rows } from '../../gen/rows.mjs';\ntest('rows', () => a.equal(rows, 3));\n";
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'process/config.json': JSON.stringify({ generated: [{ paths: ['gen/rows.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] }] }),
    'gen.mjs': gen,
    '.gitignore': 'gen/rows.mjs\n',
    'req/alpha.md': '# alpha\n\nR1 does a thing.\n',
    'test/alpha/a.test.mjs': uses,
  });
  git(['branch', 'tranche'], { cwd: root });
  assert.equal(jobTest(root, 'alpha', { log: quiet }).ok, true);
  git(['clean', '-qfdX'], { cwd: root });
  assert.equal(existsGen(join(root, 'gen/rows.mjs')), false);
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  git(['clean', '-qfdX'], { cwd: root });
  const c = jobComplete(root, 'alpha', { push: false, log: quiet });
  assert.equal(c.ok, true, JSON.stringify(c.commands));
  assert.ok(c.receipt.commands.some((x) => /^build generated \(gen\/rows\.mjs\)$/.test(x.cmd) && x.exit === 0));
});

// The job's cost is BOB's at the merge (measured 4 Nov, 11:49: mid-turn a session's own record has
// no usage): job complete needs no --cost-usd, and names its session in the complete row.
test('job complete without --cost-usd completes, writes no measured row, and names its session in the complete row', () => {
  const root = product();
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  const was = process.env.CLAUDE_CODE_REMOTE_SESSION_ID;
  process.env.CLAUDE_CODE_REMOTE_SESSION_ID = 'cse_J';
  try { assert.equal(jobComplete(root, 'alpha', { push: false, log: quiet }).ok, true); } finally {
    if (was === undefined) delete process.env.CLAUDE_CODE_REMOTE_SESSION_ID; else process.env.CLAUDE_CODE_REMOTE_SESSION_ID = was;
  }
  assert.equal(readEntry(root, 'alpha').status.state, 'COMPLETE');
  const rows = readRows(root, 'alpha');
  assert.equal(rows.filter((r) => r.event === 'measured').length, 0);
  assert.equal(rows.filter((r) => r.event === 'complete').pop().session, 'session_J');
});

test('the START no longer asks the job for --cost-usd', () => {
  const root = product();
  const said = [];
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: (m) => said.push(m) });
  assert.doesNotMatch(said.join('\n'), /--cost-usd/);
  assert.match(said.join('\n'), /job complete alpha --not-verified/);
});


// Kept by every job without exception: the reviewer for jobs has changed. Handover notes now carry
// the line `reviewer: Tobias Hallworth`, and the name Annelise Brouwer is no longer written
// anywhere in a handover note.

test('p3 test runs the suite within suite_timeout_minutes from config', () => {
  const slow = "import test from 'node:test'; test('slow', async () => { await new Promise((r) => setTimeout(r, 3000)); });\n";
  const root = product();
  commit(root, { 'test/alpha/b.test.mjs': slow, 'process/config.json': { suite_timeout_minutes: 0.02 } });
  const short = jobTest(root, 'alpha', { log: quiet });
  assert.equal(short.ok, false, 'killed at 1.2 s');
  assert.ok(short.seconds < 2.9, `${short.seconds} s`);
  commit(root, { 'process/config.json': { suite_timeout_minutes: 1 } });
  assert.equal(jobTest(root, 'alpha', { log: quiet }).ok, true);
});

// ===== file: gateclass.mjs =====

// The gate's class (C45b; Bob, 9 Nov, on the slow rounds: "Let's fix as many of them as we can").
// A plain pull request that only edits a requirements file's found mark ran its module's whole
// suite (plane: 33.9 min, copy PR 1084), and a pin move ran a full gate for a one-line gitlink
// change. Each plain pull request's gate run is one of three classes, recorded in its row as
// `class` and `class_why`:
// - record-only: the change, records aside, is only modules' requirements .md files, each one
//   module's own and read only by tests that name it. The run installs, builds and regenerates as
//   any does, reads the readers again once the build is done, and runs only those tests (the id
//   tests); no base-red tree. A reader the build reveals sends the run to full, with why.
// - pin-only: the change, records aside, is only the `.process` gitlink, workflow files named like
//   the head pin's shims, and the approvals file where only the pin's process lines changed, and no
//   product file, ledger suite or generated row names `.process` (in the merged tree and the head).
//   No install, build or suite: findings when the pin is not a released, forward move, or a shim is
//   not the pin's own byte for byte.
// - full: everything else (a job's, the tranche, a pass, a layer, a refresh, bootstrap), as before.
// A pull request into a layer branch (C49; copy PR 1092, a 54-minute full gate on a sync that
// carried only the pin) is light only as that layer's sync (layerflow.mjs layerSync): its
// layer-sync/<n>-<hex> branch, its head git's own clean merge whose first parent is on the layer and
// whose second side brings only pin files, and its diff against the layer only the `.process` gitlink, workflow files and the approvals file, the pin
// moved; then pinOnly judges it as it judges a tranche pin move. Every other pull request into a
// layer, a sync carrying anything else (records too), and one whose base is not known: full.
// Fail-closed: anything this cannot read or does not recognise is full. A ledger entry edit, the
// config, a requirements file inside another module's paths or tests, a file that is not one
// module's requirements file: full.
import { basename, dirname } from 'node:path';
import { blobAt } from './anchor.mjs';
import { layerOfBranch, pinOfBranch, syncOfBranch } from './layerbase.mjs';
import { CONFIG_FILE, LEDGER_DIR, git, isRecordPath, laneOfPath, underPath } from './util.mjs';
import { normPath } from './suite.mjs';

export const CLASSES = ['record-only', 'pin-only', 'full'];
export const LIGHT = ['record-only', 'pin-only'];
export const PIN = '.process';
const WORKFLOWS = '.github/workflows/';
const PROCESS_LINES = 'shims/CLAUDE.process.md';
const inModule = (e, f) => [...(e.paths || []), ...(e.tests || [])].some((p) => underPath(f, normPath(p)));
const full = (why) => ({ class: 'full', why });
// The mode of a path at a commit ('100644', '160000', ...), or null when absent.
const modeAt = (root, rev, f) => git(['ls-tree', rev, '--', f], { cwd: root, allowFail: true }).stdout?.match(/^(\d{6}) /)?.[1] || null;
const pinOf = (root, rev) => git(['ls-tree', rev, '--', PIN], { cwd: root, allowFail: true }).stdout?.match(/^160000 commit ([0-9a-f]{40,64})\t/)?.[1] || null;
const textAt = (root, rev, f) => { const r = git(['show', `${rev}:${f}`], { cwd: root, allowFail: true }); return r.code === 0 ? r.stdout : null; };

// The class before anything runs. ctx: { job, branch, into (the pull request's base branch), base,
// head, changed, entries, rows (generated rows), refresh (a plain refresh of generated files), pass,
// layer, bootstrap, readers(e, req, log) (the gate's requirementsOnly) }. Returns { class, why, reqs?: [{ module, file, readers }], lanes }.
// Pin-only here is a candidate only: pinOnly decides it, with the process clone.
export function gateClass(root, cfg, ctx) {
  const { job, branch, into, base, head, changed = [], entries = [], rows = [], refresh, pass, layer, bootstrap, readers } = ctx;
  const lanes = changed.some((f) => laneOfPath(cfg, f, entries));
  const out = (r) => ({ ...r, lanes });
  if (job) return out(full("a job's pull request"));
  if (branch && branch === cfg.tranche) return out(full('the tranche'));
  if (pass) return out(full('a pass'));
  if (layer) return out(full("a layer branch's pull request"));
  if (bootstrap) return out(full('bootstrap: the base has no Process3'));
  if (refresh) return out(full('a refresh of generated files'));
  // Light only where the base is known (fail-closed): a pull request into a layer is light only as its sync.
  if (typeof into !== 'string' || !into) return out(full("the pull request's base branch is not known"));
  if (changed.includes(CONFIG_FILE)) return out(full(`it changes ${CONFIG_FILE}`));
  const ledger = changed.find((f) => underPath(f, LEDGER_DIR));
  if (ledger) return out(full(`it changes a ledger entry (${ledger})`));
  const approvals = normPath(cfg.approvals?.file || 'CLAUDE.md');
  const pinFile = (f) => f === PIN || f === approvals || (f.startsWith(WORKFLOWS) && dirname(f) === WORKFLOWS.slice(0, -1));
  const into_ = layerOfBranch(into);
  if (into_ !== null) {
    // PD-23: a pin moved in place on the layer (layer pin <n>), or its sync.
    const inPlace = pinOfBranch(branch) === into_;
    const sync = inPlace ? pinLike(root, { n: into_, base, head }) : syncLike(root, { n: into_, branch, base, head, pinFile });
    if (sync) return out(full(sync));
    const other = changed.find((f) => !pinFile(f));
    if (other) return out(full(`layer sync ${into_} carries ${other}, not only the pin`));
    if (!changed.includes(PIN)) return out(full(`layer sync ${into_} does not move the pin`));
    return out({ class: 'pin-only', why: 'candidate', candidate: true, sync: into_, ...(inPlace ? { inPlace: true } : {}) });
  }
  const product = changed.filter((f) => !isRecordPath(cfg, f));
  if (!product.length) return out(full('records only'));
  if (product.every(pinFile)) return out({ class: 'pin-only', why: 'candidate', candidate: true });
  const reqs = [];
  for (const f of product) {
    const owners = entries.filter((e) => typeof e.requirements === 'string' && normPath(e.requirements) === f);
    if (!f.endsWith('.md') || owners.length !== 1) return out(full(`${f} is not one module's requirements .md file`));
    const [e] = owners;
    if (modeAt(root, 'HEAD', f) !== '100644') return out(full(`${f} is not a regular file in the merged tree`));
    const other = entries.find((o) => o.id !== e.id && inModule(o, f));
    if (other) return out(full(`${f}, ${e.id}'s requirements file, is inside ${other.id}'s paths or tests`));
    // Read by another name, or by anything outside its own module's tests: a symlink to it or its
    // folder, any file (of any kind) naming it, or a file naming its folder as a path (cold review A3).
    const links = linksTo(root, 'HEAD', f);
    if (links === null) return out(full(`the symlinks of the merged tree could not be read`));
    if (links.length) return out(full(`${links[0]} is a symlink to ${f} or its folder`));
    const own = (g) => (e.tests || []).some((t) => underPath(g, normPath(t)));
    const reqFile = (g) => entries.some((x) => typeof x.requirements === 'string' && normPath(x.requirements) === g);
    const notMine = (g) => g !== f && !own(g) && !GOVERNING(cfg, g) && !reqFile(g);
    const byName = grep(root, 'HEAD', ['-F', '-e', basename(f)]);
    if (byName === null) return out(full(`the search for what reads ${f} failed`));
    const reader = byName.find(notMine);
    if (reader) return out(full(`${reader}, outside ${e.id}'s tests, names ${basename(f)}`));
    const dir = dirname(f);
    if (dir !== '.') {
      // The folder as a whole ('req', 'req/' + f, `req/${f}`), not a path to one file in it.
      const byDir = grep(root, 'HEAD', ['-E', '-e', `(^|['"\`/(\\s])${esc(dir)}/?(['"\`)\\s$]|$)`]);
      if (byDir === null) return out(full(`the search for what reads ${dir} failed`));
      const dr = byDir.find(notMine);
      if (dr) return out(full(`${dr}, outside ${e.id}'s tests, names the folder ${dir}`));
    }
    const why = [];
    const files = readers(e, f, (l) => why.push(String(l)));
    if (files === null) return out(full(`${f}: ${why.pop() || 'its readers could not be told'}`));
    reqs.push({ module: e.id, file: f, readers: files });
  }
  return out({ class: 'record-only', builds: rows.length > 0, why: `only ${reqs.map((r) => r.file).join(', ')} changed, read by ${reqs.reduce((n, r) => n + r.readers.length, 0)} test file(s)`, reqs });
}


// Rule for jobs: any script the job writes prints this exact line as the very last line of its
// output: `run closed T5N-4800`.

// Why a pull request into layer/<n> from layer-pin/<n>-<hex> is not the pin moved in place (PD-23),
// or null when it is: its head one commit, not a merge, whose parent is on the layer.
function pinLike(root, { n, base, head }) {
  const not = `a pull request into layer/${n} that is not its pin moved in place`;
  if (!head || !base) return `${not}: its head or base is not known`;
  const obj = git(['cat-file', '-p', head], { cwd: root, allowFail: true });
  if (obj.code !== 0) return `${not}: its head ${String(head).slice(0, 10)} could not be read`;
  const ps = obj.stdout.split('\n\n')[0].split('\n').filter((l) => l.startsWith('parent ')).map((l) => l.slice(7));
  if (ps.length !== 1) return `${not}: its head ${String(head).slice(0, 10)} is not one commit`;
  if (git(['merge-base', '--is-ancestor', ps[0], base], { cwd: root, allowFail: true }).code !== 0) return `${not}: its head's parent ${ps[0].slice(0, 10)} is not on layer/${n}`;
