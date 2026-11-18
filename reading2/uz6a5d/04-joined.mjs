// ===== file: roundnext.mjs (continued) =====

  const m = moduleFiles(root, cfg, e.module, ref);
  if (!m.known) return { ...e, route: 'unknown' };
  let entry = null;
  try { entry = JSON.parse(m.read(`${LEDGER_DIR}/${e.module}.json`)); } catch { entry = null; }
  const pin = pinnedIds(root, { entry, req: m.req, reqText: m.reqText, ref });
  if (pin) return { ...e, route: 'owe', pin, recorded: owed.has(reopenKey(e.module, e.text, from)) };
  const file = m.reqText !== null ? m.req : m.found;
  const same = (t) => foundMarks(t).some((k) => k.finding === e.text && (k.source === from || k.source.startsWith(`${from}, covers `)));
  const at = (r) => { const x = git(['show', `${r}:${file}`], { cwd: root, allowFail: true }); return x.code === 0 ? x.stdout : ''; };
  return { ...e, route: 'mark', file, title: `Found work for ${e.module}`, recorded: same(m.reqText !== null ? m.reqText : m.foundText), pending: prHeads.some((h) => same(at(h))) };
}

// The round's plan at the tranche: where the rounds stand (roundState), the latest walk, its
// findings and how many are recorded (PD-16 applied), and its entries with their routes.
export function roundPlan(root, cfg, { findingsFile = null, io = {} } = {}) {
  const tr = `refs/remotes/origin/${cfg.tranche}`;
  const layers = layersAt(root, cfg, tr);
  const direct = directMode(cfg);
  if (!layers.length && !direct) fail(`no layer map (${cfg.layers_file}) on ${cfg.tranche}: rounds run over the map's layers (BD-R1)`);
  // PD-25: under the direct flow the rounds read the modules, not the layers.
  const rs = direct ? directRoundsAt(root, cfg, { io, slug: io.slug }) : nextRound(root, cfg, layers, tr);
  const last = deployRowsOf(root, cfg).at(-1) || null;
  const w = findingsOf(root, cfg, tr, last, { round: true });
  const plan = { rs, last, w, layers, tr, entries: [], hold: null, loose: unplaced(root, tr) };
  // The findings are a new round's (rounds.mjs: 'new' or 'clean' after the walk), and only then.
  if (!last || !['new', 'clean'].includes(rs.state)) return plan;
  plan.hold = walkHold(w);
  plan.from = fromOf(last);
  const read = walkFailures(root, cfg, last);
  plan.read = read;
  const lines = findingsFile ? parseFindings(readFileSync(findingsFile, 'utf8')) : null;
  const entries = withFile(walkEntries(read.failures), lines);
  const owed = new Set(owedReopens(root, cfg).map((x) => x.key));
  const prs = (io.openPRs || openPRs)(io.slug || repoSlug(root), cfg.tranche) || [];
  const prHeads = prs.filter((p) => String(p.head?.ref || '').startsWith(`found/round-`)).map((p) => {
    fetchBranch(root, p.head.ref, { allowFail: true });
    return `refs/remotes/origin/${p.head.ref}`;
  });
  // The round these findings open: the next after the one the walk ended.
  plan.opens = rs.state === 'new' ? rs.round : rs.round + 1;
  plan.branch = `found/round-${plan.opens}-${last.slug}`;
  plan.prs = prs.filter((p) => isMine(plan.branch, p.head?.ref));
  plan.entries = entries.map((e) => (e.module ? routeOf(root, cfg, tr, e, plan.from, { owed, prHeads }) : { ...e, route: 'no-module' }));
  return plan;
}

// The round's first layer, as it would open with the entries recorded: roundState over the flawed
// modules now and the modules of the entries not yet recorded.
function predicted(root, cfg, plan) {
  const { rs } = plan;
  if (rs.state === 'new') return rs.next;
  const flawed = new Map();
  for (const e of plan.entries.filter((x) => x.module && !x.recorded)) flawed.set(e.module, [...(flawed.get(e.module) || []), { id: '?', module: e.module, what: e.text }]);
  if (!flawed.size) return null;
  const s = roundState(root, cfg, plan.tr, { layers: plan.layers, flows: (k) => flowRows(root, cfg.state_branch, k), lastWalk: plan.last, flawed });
  return s.next || null;
}

// The marks' branch of this run: found/round-<n>-<slug>, or one of its -<k> successors (never
// another run's whose slug merely begins the same: internal-l3 is not internal-l30).
const isMine = (base, ref) => typeof ref === 'string' && (ref === base || (ref.startsWith(`${base}-`) && /^\d+$/.test(ref.slice(base.length + 1))));
const covered = (es) => es.reduce((a, e) => a + e.covers, 0);
const mapLayer = (plan, id) => layerOf(plan.layers.filter((L) => !L.completion && !L.round), id);

// round next [--apply] [--findings <file>]: see the head of this file.
export function roundNext(root, { apply = false, findingsFile = null, io = {}, log = console.log, by = 'bob' } = {}) {
  const cfg = loadConfig(root);
  if (!directMode(cfg)) needLayerMode(cfg, 'round next');
  if (!io.offline) {
    fetchBranch(root, cfg.tranche);
    fetchState(root, cfg.state_branch, { fresh: true });
  }
  let plan0 = cfg.plan;
  try { plan0 = loadConfig(root, `refs/remotes/origin/${cfg.tranche}`).plan; } catch { plan0 = cfg.plan; }
  if (plan0 === 'close') fail(`the plan is close on ${cfg.tranche}: the current round is the last, and no round opens (BD-R1); \`${P3} status --role bob\` names the close`);
  const slug = io.slug || repoSlug(root);
  const lio = { ...io, slug };
  let plan = roundPlan(root, cfg, { findingsFile, io: lio });
  const { rs } = plan;
  const dry = apply ? '' : ' (dry run: `round next --apply` does it)';
  // A layer of the round is open: its jobs.
  if (rs.state === 'layer') {
    log(`${layerName(rs.layer, rs.layer.n, cfg.tranche)} is open; its jobs, each started by BOB (create_session, then the command):`);
    const j = layerJobs(root, rs.layer.n, { io: lio, log });
    return { ok: true, state: 'layer', layer: rs.layer.n, startable: j.startable };
  }
  // PD-25: a round open under the direct flow: its ready jobs, all at once up to the slot cap.
  if (rs.state === 'open') {
    log(`round ${rs.round} is open under the direct flow; its ready jobs, each started by BOB (create_session, then the command):`);
    const j = directJobs(root, { io: lio, log });
    return { ok: true, state: 'open', round: rs.round, startable: j.startable };
  }
  if (rs.state === 'walk') {
    log(`every layer of round ${rs.round} has merged: its walk ends it, the round-close run (the act that closed it starts it; else \`${P3} walk round\` where an internal walk is configured, \`${P3} deploy dev\` where not); then \`${ROUND_NEXT}\``);
    return { ok: true, state: 'walk', round: rs.round };
  }
  // The round's next layer (a round layer merged and one past it is owed): opened, its jobs listed.
  if (rs.state === 'next') return openNext(root, rs.next, { apply, io: lio, log, by, dry, what: `round ${rs.round}'s next layer`, tranche: cfg.tranche });
  // After a walk: its findings, then the next round's first layer; a clean one, the release path.
  const { w, last } = plan;
  const internal = internalRun(last);
  const failing = w.failing;
  const aside = w.set_aside ? `; the live arm's ${w.set_aside} set aside: its internal walk found flaws, so they hold no round (PD-16)` : '';
  log(`round ${rs.state === 'new' ? rs.round - 1 : rs.round} ended at the ${internal ? 'internal walk' : 'walk'} ${runSource(last)}: ${failing} finding(s), ${w.recorded} recorded${aside}${dry}`);
  // Every finding recorded (by hand, or a known gap on Bob's word) and none a flaw: the release path.
  if (!plan.hold && rs.state === 'clean' && !plan.loose.length) return releasePath(root, cfg, plan, { log });
  if (plan.read?.unread?.length) log(`note: report(s) not read from ${cfg.state_branch}: ${plan.read.unread.join(', ')}`);
  printEntries(plan, { log });
  const need = Math.max(0, failing - w.recorded);
  // Nothing owed when every finding counts as recorded (some by hand, under other words): none again.
  const todo = need > 0 ? plan.entries.filter((e) => !e.recorded) : [];
  const loose = todo.filter((e) => e.route === 'no-module' || e.route === 'unknown');
  const short = need > 0 && covered(todo) < need;
  // Findings of this run recorded under other words (by hand, or from another --findings file):
  // which entries they stand for is not known, so none is recorded again until BOB says (cold review A).
  const others = w.recorded - covered(plan.entries.filter((e) => e.recorded));
  if (need > 0 && others > 0 && todo.length) {
    const why = `${others} finding(s) of this walk are recorded under other words (by hand, or from another findings file), and which of the entries below they stand for is not known: give the rest in a file of \`<module>: <text>[, covers <n>]\` lines, the ${need} not yet recorded (\`${ROUND_NEXT} --findings <file>\`), or record them with \`${P3} found\``;
    if (apply) fail(`${why}; nothing was recorded`);
    log(why);
    return { ok: true, state: 'findings', plan };
  }
  const nx = directMode(cfg) ? null : predicted(root, cfg, plan);
  if (nx) log(`then: ${roundLayerName(nx.round, nx.of, nx.n, cfg.tranche)} opens for ${nx.mods.join(', ')}, one layer for every flawed module (PD-24); ${apply ? 'its jobs follow' : 'its `job start` commands are printed once it opens'}`);
  if (loose.length) {
    const why = `${loose.length} finding(s) name no known module (${loose.map((e) => `${e.module ? `${e.module}: ` : ''}${e.text}`).slice(0, 5).join('; ')}): give their modules in a file of \`<module>: <text>\` lines (\`, covers <n>\` at a line's end for one flaw behind n failures), then \`${ROUND_NEXT} --findings <file>\``;
    if (apply) fail(`${why}; nothing was recorded`);
    log(why);
    return { ok: true, state: 'findings', plan };
  }
  if (short) {
    const why = `the entries cover ${covered(todo)} of the ${need} finding(s) not yet recorded: give the rest in a file of \`<module>: <text>[, covers <n>]\` lines (\`${ROUND_NEXT} --findings <file>\`), or record them with \`${P3} found\`, or a known gap on Bob's word`;
    if (apply) fail(`${why}; nothing was recorded`);
    log(why);
    return { ok: true, state: 'findings', plan };
  }
  if (!apply) return { ok: true, state: 'dry', plan, next: nx };
  // 1. The owed reopens, on the state branch (found writes each once, keyed).
  for (const e of todo.filter((x) => x.route === 'owe')) found(root, e.module, e.text, { from: plan.from, covers: e.covers > 1 ? e.covers : undefined, by, offline: !!io.offline, log: (l) => log(`  ${l}`) });
  // 2. The found marks, all in one plain pull request into the tranche, merged by the merge tool.
  const marks = todo.filter((x) => x.route === 'mark');
  if (marks.length) marksPR(root, cfg, plan, marks, { io: lio, log });
  // 3. Read again: the round opens once each finding is recorded.
  if (!io.offline) { fetchBranch(root, cfg.tranche); fetchState(root, cfg.state_branch, { fresh: true }); }
  plan = roundPlan(root, cfg, { findingsFile, io: lio });
  if (plan.hold) fail(`the walk's findings are not all recorded yet: ${plan.hold}; run \`${ROUND_NEXT} --apply\` again`);
  if (plan.loose.length) fail(`round ${plan.rs.round} cannot place ${plan.loose.map((f) => f.id).join(', ')} in the found file of no module: BOB names its module (\`${P3} found <module> "<finding>" --from "<source>"\`), then \`${ROUND_NEXT} --apply\``);
  if (plan.rs.state === 'clean') return releasePath(root, cfg, plan, { log });
  if (plan.rs.state !== 'new') fail(`after recording, the rounds stand at ${plan.rs.state}, not a new round: \`${P3} status --role bob\``);
  if (directMode(cfg)) {
    log(`round ${plan.rs.round} opens under the direct flow: every flawed module at once (${plan.rs.mods.join(', ')}); its ready jobs:`);
    const j = directJobs(root, { io: lio, log });
    return { ok: true, state: 'opened', round: plan.rs.round, startable: j.startable };
  }
  return openNext(root, plan.rs.next, { apply, io: lio, log, by, dry, what: `round ${plan.rs.round}'s first layer`, tranche: cfg.tranche });
}

function printEntries(plan, { log }) {
  if (!plan.entries.length) { log('the walk\'s reports name no failure (or were not stored): give its findings in a file of `<module>: <text>[, covers <n>]` lines, `round next --findings <file>`'); return; }
  const groups = new Map();
  for (const e of plan.entries) groups.set(e.module, [...(groups.get(e.module) || []), e]);
  log(`the findings by module, one entry per distinct flaw (--from "${plan.from}"):`);
  for (const [id, es] of [...groups].sort((a, b) => (mapLayer(plan, a[0]) ?? 1e9) - (mapLayer(plan, b[0]) ?? 1e9) || String(a[0]).localeCompare(String(b[0])))) {
    const k = id ? mapLayer(plan, id) : null;
    log(`  ${id || '(no module)'}${k !== null && k !== undefined ? ` (layer ${k})` : ''}:`);
    for (const e of es) {
      const how = e.route === 'owe' ? `owed reopen (${e.pin} pins its ids)` : e.route === 'mark' ? `found mark in ${e.file}` : e.route === 'unknown' ? 'not a module on the tranche' : 'no module';
      const state = e.recorded ? 'recorded' : e.pending ? 'in an open pull request' : 'to record';
      log(`    - ${state}, ${how}: ${e.text}${e.covers > 1 ? ` (covers ${e.covers})` : ''}`);
      if (!e.recorded && e.module && !e.pending) log(`      ${P3} found ${e.module} ${JSON.stringify(e.text)} --from ${JSON.stringify(plan.from)}${e.covers > 1 ? ` --covers ${e.covers}` : ''}`);
    }
  }
}

// The marks' plain pull request: one branch from the tranche tip, the marks appended (numbered past
// the module's, as found numbers them), pushed, opened ready, and merged by the merge tool (merge
// --plain: a change that only adds unmet found marks). An open one of this run's is merged as it is.
function marksPR(root, cfg, plan, marks, { io, log }) {
  const slug = io.slug;
  const base = plan.branch;
  let pr = plan.prs[0] || null;
  // An open one GitHub finds conflicted (the tranche moved under it) is closed, never merged as it
  // is, and the marks cut again from the tranche tip (cold review A: else every re-run fails on it).
  let dropped = null;
  if (pr) {
    let st = null;
    try { st = (io.getPR || getPR)(slug, pr.number); } catch { st = null; }
    if (st?.mergeable === false) {
      (io.closePR || ((sl, n) => editPR(sl, n, { state: 'closed' })))(slug, pr.number);
      log(`pull request ${pr.number} (${pr.head?.ref}) conflicts with ${cfg.tranche}: closed (its branch kept), and the marks cut again from the tranche tip`);
      dropped = pr.head?.ref || null;
      pr = null;
    }
  }
  const heads = git(['ls-remote', '--heads', 'origin', `refs/heads/${base}*`], { cwd: root, allowFail: true }).stdout.split('\n').map((l) => l.split(/\s+/)).filter(([sha, ref]) => sha && ref && isMine(base, ref.replace(/^refs\/heads\//, ''))).map(([sha, ref]) => ({ sha, branch: ref.replace(/^refs\/heads\//, '') }));
  // A branch of this run pushed with no pull request (its create failed): its marks, not yet on the
  // tranche, are opened as they are, not pushed again under another name.
  if (!pr && marks.length) {
    git(['fetch', '-q', 'origin', ...heads.map((h) => `+refs/heads/${h.branch}:refs/remotes/origin/${h.branch}`)], { cwd: root, allowFail: true });
    const left = heads.find((h) => h.branch !== dropped && git(['merge-base', '--is-ancestor', h.sha, plan.tr], { cwd: root, allowFail: true }).code !== 0 && git(['merge-base', '--is-ancestor', plan.tr, h.sha], { cwd: root, allowFail: true }).code === 0);
    if (left) {
      pr = (io.createPR || createPR)(slug, { head: left.branch, base: cfg.tranche, title: `found: round ${plan.opens}, mark(s) from the ${plan.from}`, body: `Found marks from the ${plan.from} (\`round next\`, C46). Only unmet found marks are added; no code.`, draft: false });
      log(`${left.branch} was pushed by an earlier run with no pull request: pull request ${pr.number} opened from it into ${cfg.tranche}`);
    }
  }
  if (!pr && marks.length) {
    const taken = new Set(heads.map((h) => h.branch));
    let branch = base;
    for (let k = 2; taken.has(branch); k++) branch = `${base}-${k}`;
    const lines = withTemp('p3-round-', (tmp) => {
      const wt = join(tmp, 'w');
      git(['worktree', 'add', '-q', '--detach', wt, plan.tr], { cwd: root });
      try {
        const out = [];
        const byFile = new Map();
        for (const e of marks) byFile.set(e.file, [...(byFile.get(e.file) || []), e]);
        for (const [file, es] of byFile) {
          const p = join(wt, file);
          const id = es[0].module;
          const read = (f) => { try { return readFileSync(join(wt, f), 'utf8'); } catch { return null; } };
          let text = read(file);
          for (const e of es) {
            const n = nextFound(text, read(foundFile(id)), pendingFound(root, id, plan.tr));
            const line = foundLine(n, e.text, e.covers > 1 ? `${plan.from}, covers ${e.covers}` : plan.from);
            text = addFound(text, line, e.title);
            out.push(`${id} F${n}: ${e.text}`);
          }
          writeFile(p, text);
          git(['add', '--', file], { cwd: wt });
        }
        git(['commit', '-q', '-m', `found: round ${plan.opens}, ${marks.length} mark(s) from the ${plan.from}`], { cwd: wt });
        const r = git(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { cwd: wt, allowFail: true });
        if (r.code !== 0) fail(`the push of ${branch} failed (${r.stderr.trim()}); nothing was opened`);
        return out;
      } finally { git(['worktree', 'remove', '--force', wt], { cwd: root, allowFail: true }); }
    }, { root });
    log(`${branch} pushed: ${lines.join('; ')}`);
    pr = (io.createPR || createPR)(slug, { head: branch, base: cfg.tranche, title: `found: round ${plan.opens}, ${marks.length} mark(s) from the ${plan.from}`, body: `Found marks from the ${plan.from}, one a distinct flaw (\`round next\`, C46):\n\n${lines.map((l) => `- ${l}`).join('\n')}\n\nOnly unmet found marks are added; no code.`, draft: false });
    log(`pull request ${pr.number} opened into ${cfg.tranche}`);
  }
  if (!pr) return;
  log(`merging pull request ${pr.number} (found marks only) through the merge tool: merge ${pr.number} --plain --no-review "${NO_REVIEW}"`);
  (io.mergePlain || mergePlain)(root, pr.number, { noReview: NO_REVIEW, log, slug });
}
function writeFile(p, text) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); }

// The marks a printed `found` act holds on a found/<module>-f<n> branch, on origin or here, not yet
// on the tranche, as found.mjs numbers past them: two marks never share a number.
function pendingFound(root, id, tr) {
  const remote = git(['ls-remote', '--heads', 'origin', `refs/heads/found/${id}-f*`], { cwd: root, allowFail: true }).stdout || '';
  const local = git(['for-each-ref', '--format=%(objectname) %(refname)', `refs/heads/found/${id}-f*`], { cwd: root, allowFail: true }).stdout || '';
  const written = (sha) => git(['cat-file', '-e', `${sha}^{commit}`], { cwd: root, allowFail: true }).code !== 0 || git(['merge-base', '--is-ancestor', sha, tr], { cwd: root, allowFail: true }).code !== 0;
  return `${remote}\n${local}`.split('\n').map((l) => l.trim().split(/\s+/)).filter(([sha, name]) => sha && name && written(sha))
    .map(([, name]) => name.match(new RegExp(`^refs/heads/found/${id}-f(\\d+)$`))?.[1]).filter(Boolean).map((k) => `**F${k}**`).join(' ');
}

// The layer opened (apply) or named (dry run), and its jobs' `job start` commands printed.
function openNext(root, nx, { apply, io, log, by, dry, what, tranche = null }) {
  if (!apply) {
    log(`${what}: ${roundLayerName(nx.round, nx.of, nx.n, tranche)} for ${nx.mods.join(', ')}${dry}; then its \`job start\` commands`);
    return { ok: true, state: 'dry', next: nx };
  }
  const o = layerOpen(root, nx.n, { io, by, log });
  log(`next: BOB starts each job above (create_session for its session, then the \`job start\` command); \`${ROUND_NEXT}\` lists them again`);
  return { ok: true, state: 'opened', layer: nx.n, round: o.round, startable: o.startable };
}

// A clean walk: the release path (rounds.mjs releaseNext), or where it stands.
function releasePath(root, cfg, plan, { log }) {
  let next = null;
  try {
    let p = cfg.plan;
    try { p = loadConfig(root, plan.tr).plan; } catch { p = cfg.plan; }
    const w = findingsOf(root, cfg, plan.tr, plan.last);
    next = releaseNext(root, cfg, { rc: { closed: true, round: `round ${plan.rs.round}`, rounds: plan.rs }, w, plan: p, ref: plan.tr });
  } catch { next = null; }
  if (next) log(`the walk ${runSource(plan.last)} is clean: no round opens; the release path is next (${next.why}): ${next.act}`);
  else log(`the walk ${runSource(plan.last)} is clean: no round opens; the release path follows (BD-R1): \`${P3} release dev\` (the cut, signed release), then \`${P3} deploy release <version>\`; \`${P3} status --role bob\` names where it stands`);
  return { ok: true, state: 'clean', release: next };
}

// ===== file: audit-restores.test.mjs =====

// AUD-1 (JOB-12), AUD-2 (JOB-7, SES-12): the reviewed revert exemption, and every receipt
// disagreement counted toward the false-done rate. Fast: no suite runs here.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BOT, GATE, REVERT_EXEMPT, block, parseBlock } from '../lib/github.mjs';
import { EXEMPT_MARK, revertExempt } from '../lib/job.mjs';
import { flowFigures, refuted, refutes, report } from '../lib/metrics.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};

test('a receipt disagreement refutes its COMPLETE claim, as a red suite or revert check does (SES-12)', () => {
  assert.equal(refutes({ receipt_attempt: 1, suite: 'pass', revert: 'pass', receipt: 'disagrees' }, 1), true);
  assert.equal(refutes({ receipt_attempt: 1, suite: 'fail' }, 1), true);
  assert.equal(refutes({ receipt_attempt: 1, suite: 'pass', revert: 'fail', receipt: 'agrees' }, 1), true);
  assert.equal(refutes({ receipt_attempt: 1, suite: 'pass', revert: 'pass', receipt: 'agrees' }, 1), false);
  assert.equal(refutes({ receipt_attempt: 2, receipt: 'disagrees' }, 1), false, 'another attempt\'s run');
  // A revert failure a reviewer then exempted on the same attempt refutes nothing; a red suite still does.
  const fail = (sha) => ({ sha, receipt_attempt: 1, suite: 'pass', revert: 'fail', receipt: 'agrees' });
  const exempt = (sha, reviewed = sha) => ({ sha, receipt_attempt: 1, suite: 'pass', revert: 'exempt', revert_exempt: { sha: reviewed }, receipt: 'agrees' });
  assert.equal(refuted([fail('c1'), exempt('c1')], 1), false);
  // Only an exemption after it, of the same commit: not one before it, nor of later code.
  assert.equal(refuted([exempt('c1'), fail('c1')], 1), true);
  assert.equal(refuted([fail('c1'), exempt('c2')], 1), true);
  assert.equal(refuted([{ receipt_attempt: 1, suite: 'fail', revert: 'skipped', receipt: 'disagrees' }, exempt('c1')], 1), true);
  assert.equal(refuted([{ receipt_attempt: 1, suite: 'pass', revert: 'fail', receipt: 'agrees' }], 1), true);
  const at = (h) => new Date(Date.parse('2026-11-06T00:00:00Z') + h * 36e5).toISOString();
  const rows = [{ row: 'attempt', event: 'complete', attempt: 1, pr: 2, at: at(1) }, { row: 'attempt', event: 'complete', attempt: 1, pr: 3, at: at(2) }];
  const gates = (pr) => (pr === 2 ? [{ receipt_attempt: 1, suite: 'pass', revert: 'pass', receipt: 'disagrees' }] : [{ receipt_attempt: 1, suite: 'pass', receipt: 'agrees' }]);
  assert.equal(flowFigures({ rows, gates, from: at(0), to: at(3) }).false_done_share, 0.5);
  // report's false_done_rate reads the same rule.
  const root = makeRepo({ 'process/metrics/alpha.jsonl': rows.map((r) => JSON.stringify(r)).join('\n') + '\n' });
  const r = report(root, 'o/r', 'HEAD', { read: { comments: (s, n) => [{ id: 1, body: block(GATE, { runs: gates(n) }), user: { login: BOT } }], getPR: () => null } });
  assert.deepEqual([r.complete_claims, r.refuted, r.false_done_rate], [2, 1, 0.5]);
});

function jobRepo() {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'src/alpha/index.mjs': 'export const x = 1;\n' });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'process/metrics/alpha.jsonl': '{"row":"attempt","event":"complete","attempt":1,"session":"session_job"}\n' });
  const state = { comments: [], edits: [] };
  const io = {
    slug: 'o/r',
    getPR: () => ({ number: 5, state: 'open', body: 'START', head: { ref: 'job/alpha', sha: head } }),
    addComment: (s, n, body) => { state.comments.push(body); return { id: 77, html_url: 'https://x/77' }; },
    editPR: (s, n, f) => { state.edits.push(f); },
  };
  return { root, head, state, io };
}

test('revert exempt posts a reviewer\'s exemption on the head and edits the body so the gate runs again; the job\'s own session is refused', () => {
  const j = jobRepo();
  assert.throws(() => revertExempt(j.root, 5, { why: 'refactor', io: j.io, log: quiet }), /needs --reviewer/);
  assert.throws(() => revertExempt(j.root, 5, { reviewer: 'session_rev', io: j.io, log: quiet }), /needs --why/);
  assert.throws(() => revertExempt(j.root, 5, { why: 'refactor', reviewer: 'cse_job', io: j.io, log: quiet }), /session_job is alpha's own job session: a job never exempts itself/);
  assert.equal(j.state.comments.length, 0);
  const r = revertExempt(j.root, 5, { why: 'a pure rename', reviewer: 'session_rev', io: j.io, log: quiet });
  assert.deepEqual([r.data.module, r.data.sha, r.data.reviewer, r.data.why], ['alpha', j.head, 'session_rev', 'a pure rename']);
  assert.deepEqual(parseBlock(j.state.comments[0], REVERT_EXEMPT).sha, j.head);
  assert.equal(j.state.edits.length, 1);
  assert.match(j.state.edits[0].body, new RegExp(`^START\\n\\n<!-- ${EXEMPT_MARK} 77 --> Gate re-run for the revert exemption https://x/77\\.$`));
});

// ===== file: rerun-more.test.mjs =====

// Recovery after a governor refusal, the rest of the multi-step commands (R17d, item 3; Bob, 6 Nov:
// when an operation is delayed and then dropped, does the code that dropped it know why and
// recover?). merge --plain, layer publish, layer sync, pin move, tranche open and tranche close.
// For each, a governor refusal is injected at each GitHub step in turn: a gh call through the io
// stand-ins, and a push through the governed git, refused as a stopped account refuses it. A rerun
// of the same command then completes with no duplicate merge, comment, pull request, branch, row
// or state write, and nothing lost. A command that only prints a session's steps prints the same
// steps again. rerun.test.mjs holds the job merge and job sync.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { flowRows, layerOpen, layerPublish, layerSync } from '../lib/layerflow.mjs';
import { mergePlain, processRepo } from '../lib/merge.mjs';
import { REFUSALS_FILE } from '../lib/metrics.mjs';
import { useShared } from '../lib/pace.mjs';
import { pinMove } from '../lib/pin.mjs';
import { WAKES_FILE, fetchState, heldWrites, stateReplay, writeState } from '../lib/state.mjs';
import { OPEN_FILE, TRANCHE_CLOSED_FILE, recordOpen, trancheClose, trancheOpen } from '../lib/tranche.mjs';
import { Fail, git } from '../lib/util.mjs';
import { commit, entry, later, makeRepo, write } from './helpers.mjs';

const REFUSED = 'GitHub budget: 68 of the 80 content-creating requests a minute used account-wide, the target 85% (68): acts on GitHub wait until 2026-11-06T23:59:00Z (16 min); then rerun `node .process/tool/p3.mjs <the command>`';
// Every push refused, as a stopped account refuses them.
const stopped = { read: () => ({ pause: { at: '2026-11-06T23:00:00Z', until: '2026-11-06T23:01:00Z', why: 'secondary rate limit', stopped: true }, use: [] }), pause: () => null };
const quiet = () => {};
const SB = 'process-state';
const refusal = /GitHub budget/;

// The io stand-ins with the governor's refusal thrown at call `refuseAt` (1-based), once; the
// count runs on across the rerun, as GitHub's state does. Nested objects of stand-ins too.
function refusing(io, refuseAt = 0) {
  const s = { calls: 0, refused: false };
  const wrap = (v) => {
    if (typeof v === 'function') return (...a) => { s.calls++; if (s.calls === refuseAt && !s.refused) { s.refused = true; throw new Fail(REFUSED); } return v(...a); };
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).some((f) => typeof f === 'function') && !v.released) return Object.fromEntries(Object.entries(v).map(([k, f]) => [k, wrap(f)]));
    return v;
  };
  return { s, io: wrap(io) };
}
// Runs f; the refusal's message, or null when it completed.
const attempt = async (f) => { try { await f(); return null; } catch (e) { return e.message; } };
const bareOrigin = (root) => {
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  return bare;
};
const onOrigin = (bare, path) => { const r = git(['show', `${SB}:${path}`], { cwd: bare, allowFail: true }); return r.code === 0 ? r.stdout.split('\n').filter(Boolean) : []; };

// ---- merge --plain --------------------------------------------------------------------------

function plainRepo(files = { 'pin.txt': 'moved' }) {
  const root = makeRepo({ 'README.md': 'x', '.github/workflows/process-gate.yml': 'on: pull_request\n', 'process/config.json': {}, 'process/ledger/alpha.json': entry('alpha') });
  git(['branch', 'tranche'], { cwd: root });
  const bare = bareOrigin(root);
  git(['checkout', '-q', '-b', 'bob/pin', 'tranche'], { cwd: root });
  const sha = commit(root, files);
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche', 'bob/pin'], { cwd: root });
  return { root, bare, sha, head: 'bob/pin' };
}
// GitHub as merge --plain sees it, with state: the merge closes the pull request.
function plainGitHub(r, repo = { released: () => false, shim: () => null, descends: () => false }) {
  const s = { merges: 0 };
  const pr = () => ({ state: s.merges ? 'closed' : 'open', merged: !!s.merges, draft: false, base: { ref: 'tranche', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: r.head, sha: r.sha, repo: { full_name: 'o/r' } } });
  return {
    s,
    io: {
      getPR: pr,
      requiredChecks: () => ({ checks: [{ context: 'gate' }] }),
      checkRuns: () => [{ id: 1, status: 'completed', conclusion: 'success', started_at: '2026-11-02T10:00:00Z' }],
      repo,
      mergePR: () => { s.merges++; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}
const plainOpts = { slug: 'o/r', noReview: 'a test', log: quiet };

test('merge --plain: refused at each GitHub step in turn, then rerun: one merge; the merge\'s own refusal is said as the refusal, not as an unread reply', async (t) => {
  t.after(() => useShared(null));
  const clean = plainRepo();
  const c = refusing(plainGitHub(clean).io);
  assert.equal(mergePlain(clean.root, 4, { ...plainOpts, io: c.io }).merged, true);
  const steps = c.s.calls;
  assert.ok(steps >= 5, `${steps} GitHub steps`);
  for (let k = 1; k <= steps; k++) {
    const r = plainRepo();
    const g = plainGitHub(r);
    const f = refusing(g.io, k);
    const logs = [];
    const first = await attempt(() => mergePlain(r.root, 4, { ...plainOpts, io: f.io, log: (l) => logs.push(l) }));
    assert.match(String(first), /GitHub budget: .*then rerun/, `step ${k}: the run stops on the refusal and names the rerun`);
    assert.equal(g.s.merges, 0, `step ${k}: nothing merged`);
    assert.doesNotMatch(logs.join('\n'), /could not be read/, `step ${k}: a refusal is not an unread reply`);
    assert.equal(mergePlain(r.root, 4, { ...plainOpts, io: f.io }).merged, true, `step ${k}: the rerun merges`);
    assert.equal(g.s.merges, 1, `step ${k}: one merge`);
  }
});

// process3 at a pin, and a pin move to it with the process's own shim.
function pinMoveRepo() {
  const shim = 'name: process-gate\non: pull_request\n';
  const p = makeRepo({ 'shims/process-gate.yml': shim, 'README.md': 'process3' });
  git(['branch', 'tranche'], { cwd: p });
  bareOrigin(p);
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: p });
  const pin = git(['rev-parse', 'HEAD'], { cwd: p });
  const r = plainRepo();
  git(['checkout', '-q', r.head], { cwd: r.root });
  git(['update-index', '--add', '--cacheinfo', `160000,${pin},.process`], { cwd: r.root });
  write(r.root, { '.github/workflows/process-gate.yml': shim });
  git(['add', '.github/workflows/process-gate.yml'], { cwd: r.root });
  git(['commit', '-q', '-m', 'move the pin and the shim'], { cwd: r.root });
  git(['push', '-q', 'origin', r.head], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  return { ...r, sha: git(['rev-parse', `refs/heads/${r.head}`], { cwd: r.root }), proc: p };
}

test('merge --plain of a pin move: the wake\'s state write refused by a stopped account; the merge stands, the wake is printed once and its record kept, replayed once; a rerun merges nothing again', (t) => {
  t.after(() => useShared(null));
  const r = pinMoveRepo();
  const g = plainGitHub(r, processRepo(r.proc));
  const logs = [];
  useShared(stopped);
  const out = mergePlain(r.root, 4, { ...plainOpts, noReview: 'a pin move', as: 'pin', io: g.io, log: (l) => logs.push(l) });
  useShared(null);
  assert.equal(out.merged, true);
  assert.equal(g.s.merges, 1);
  assert.equal(logs.filter((l) => /^next act: wake BOB/.test(l)).length, 1, 'the wake printed once');
  assert.equal(heldWrites(r.root).length, 1, 'its record kept in this clone, not lost');
  assert.equal(onOrigin(r.bare, WAKES_FILE).length, 0);
  assert.throws(() => mergePlain(r.root, 4, { ...plainOpts, noReview: 'a pin move', as: 'pin', io: g.io, log: quiet }), /pull request 4 is closed/);
  assert.equal(g.s.merges, 1, 'no second merge');
  stateReplay(r.root, SB, [], { log: quiet });
  assert.deepEqual(onOrigin(r.bare, WAKES_FILE).map((l) => JSON.parse(l).row), ['wake', 'printed'], 'recorded once: a later session does not print it again');
  assert.equal(heldWrites(r.root).length, 0);
});

// ---- layer publish and layer sync -------------------------------------------------------------

const modules = { modules: [{ id: 'a', uses: [] }, { id: 'b', uses: ['a'] }, { id: 'c', uses: [] }] };
const layers = '# The layers\n\n| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a, b, c |\n';
const req = (id) => `# ${id} — requirements\n\n## Public\n\n### Purpose\n\n${id} does things.\n\n### Provides\n\n- ${id}() returns a thing\n\n## Private\n\n### Uses\n\nnothing\n\n**R1** a requirement\n`;
// A layer-flow product on the tranche with a bare origin (layerflow.test.mjs product, trimmed).
function product({ done = false } = {}) {
  const files = { 'process/config.json': { merge_strategy: 'layer', modules_file: 'build/modules.json' }, 'build/layers.md': layers, 'build/modules.json': modules };
  for (const id of ['a', 'b', 'c']) {
    files[`process/ledger/${id}.json`] = entry(id, { layer: 1, ...(done ? { status: { state: 'COMPLETE' } } : {}) });
    files[`req/${id}.md`] = req(id);
    files[`test/${id}/t.test.mjs`] = "import test from 'node:test'; test('ok', () => {});\n";
    files[`src/${id}/index.mjs`] = `export const ${id} = 1;\n`;
  }
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const bare = bareOrigin(root);
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return { root, bare };
}
function clone(bare) {
  const d = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', bare, d], { cwd: tmpdir() });
  for (const [k, v] of [['user.email', 'noreply@github.com'], ['user.name', 'Test'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: d });
  return d;
}
function ghMerge(bare, base, head, title) {
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'w', `origin/${base}`], { cwd: d });
  git(['fetch', '-q', 'origin', head], { cwd: d });
  git(['merge', '-q', '--no-ff', '-m', title, head], { cwd: d });
  git(['push', '-q', 'origin', `w:${base}`], { cwd: d });
  return { sha: git(['rev-parse', 'HEAD'], { cwd: d }), merged: true };
}
const openIO = { slug: 'o/p', openPRs: () => [], comments: () => [] };
const runRows = (root) => { fetchState(root, SB, { fresh: true }); return flowRows(root, SB, 1).runs; };

// layer publish's own GitHub acts: its job sync (a stand-in here; job sync's own refusals are
// rerun.test.mjs's) and the run row's state write. Its job complete is job-sync.test.mjs's.
async function publishing() {
  const { root, bare } = product();
  layerOpen(root, 1, { io: openIO, log: quiet });
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'job/c', 'origin/layer/1'], { cwd: d });
  commit(d, { 'src/c/index.mjs': 'export const c = 2;\n' }, 'work on c');
  git(['push', '-q', 'origin', 'job/c'], { cwd: d });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', '-B', 'job/c', 'origin/job/c'], { cwd: root });
  return { root, bare };
}

test('layer publish: its sync refused, or its run row\'s push refused by a stopped account, then rerun: published, one run row on origin per run, the refused one kept', async (t) => {
  t.after(() => useShared(null));
  for (const at of ['sync', 'row']) {
    const { root } = await publishing();
    let runs = 0;
    const g = refusing({ sync: async () => ({ ok: true }) }, at === 'sync' ? 1 : 0);
    const complete = () => { runs++; if (at === 'row' && runs === 1) useShared(stopped); return { done: Promise.resolve({ code: 0 }), kill() {} }; };
    const first = await attempt(() => layerPublish(root, 'c', { sync: g.io.sync, complete, log: quiet }));
    useShared(null);
    assert.match(String(first), refusal, `${at}: the run stops on the refusal`);
    assert.equal(runs, at === 'sync' ? 0 : 1, `${at}: ${at === 'sync' ? 'nothing ran' : 'the run ran'}`);
    assert.deepEqual(runRows(root), [], `${at}: no row on origin yet`);
    assert.equal(heldWrites(root).length, at === 'row' ? 1 : 0, `${at}: the refused row is kept, not lost`);
    const r = await layerPublish(root, 'c', { sync: g.io.sync, complete, log: quiet });
    assert.equal(r.ok, true, `${at}: the rerun publishes`);
    assert.deepEqual(runRows(root).map((x) => x.result), ['pass'], `${at}: one run row for the rerun's run`);
    if (at === 'row') {
      // The kept row is the first run's own (another file): replayed, each run has its one row.
      stateReplay(root, SB, [], { log: quiet });
      assert.deepEqual(runRows(root).map((x) => x.result), ['pass', 'pass']);
      assert.equal(runs, 2);
    }
  }
});

const setPin = (dir, sha, msg) => { mkdirSync(join(dir, '.process'), { recursive: true }); git(['update-index', '--add', '--cacheinfo', `160000,${sha},.process`], { cwd: dir }); git(['commit', '-q', '-m', msg], { cwd: dir }); return git(['rev-parse', 'HEAD'], { cwd: dir }); };
// A layer open, then a pin move on the tranche: layer sync owed.
function syncOwed() {
  const { root, bare } = product({ done: true });
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  setPin(root, git(['rev-parse', 'HEAD'], { cwd: root }), 'pin 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  return { root, bare };
}
// GitHub as layer sync sees it, with state: pull requests made, and merged by GitHub's merge.
function syncGitHub(bare, { stopAfterMerge = false } = {}) {
  const s = { prs: [], merges: 0 };
  const tipOf = (b) => git(['ls-remote', bare, `refs/heads/${b}`], { cwd: tmpdir() }).split('\t')[0];
  return {
    s,
    io: {
      slug: 'o/p',
      findPR: () => null,
      openPRs: (slug, base) => s.prs.filter((p) => p.state === 'open' && p.base.ref === base),
      prsFromBranch: (slug, b) => s.prs.filter((p) => p.head.ref === b),
      createPR: (slug, p) => { const pr = { number: 91 + s.prs.length, state: 'open', draft: p.draft, base: { ref: p.base }, head: { ref: p.head, sha: tipOf(p.head) } }; s.prs.push(pr); return pr; },
      waitForGate: () => ({ status: 'completed', conclusion: 'success' }),
      merge: (slug, k, sha, title) => {
        s.merges++;
        const r = ghMerge(bare, 'layer/1', sha, title);
        s.prs.find((p) => p.number === k).state = 'closed';
        if (stopAfterMerge) useShared(stopped);
        return r;
      },
    },
  };
}
const syncBranches = (bare) => git(['ls-remote', '--heads', bare, 'refs/heads/layer-sync/*'], { cwd: tmpdir() }).split('\n').filter(Boolean);
const syncRows = (root) => { fetchState(root, SB, { fresh: true }); return flowRows(root, SB, 1).syncs; };

test('layer sync: refused at each GitHub step in turn (each gh call, its branch\'s push, its row\'s push), then rerun: one branch, one pull request, one merge, one sync row', async (t) => {
  t.after(() => useShared(null));
  const clean = syncOwed();
  const c = syncGitHub(clean.bare);
  const cr = refusing(c.io);
  assert.equal((await layerSync(clean.root, 1, { io: cr.io, log: quiet })).synced, true);
  const steps = cr.s.calls;
  assert.ok(steps >= 5, `${steps} GitHub steps`);
  // 1..steps: each gh call; then the branch's push, then the row's push, refused by a stopped account.
  for (let k = 1; k <= steps + 2; k++) {
    const { root, bare } = syncOwed();
    const g = syncGitHub(bare, { stopAfterMerge: k === steps + 2 });
    const f = refusing(g.io, k <= steps ? k : 0);
    if (k === steps + 1) useShared(stopped);
    const first = await attempt(() => layerSync(root, 1, { io: f.io, log: quiet }));
    useShared(null);
    assert.match(String(first), refusal, `step ${k}: the run stops on the refusal`);
    const r = await layerSync(root, 1, { io: f.io, log: quiet });
    assert.equal(r.ok, true, `step ${k}: the rerun completes`);
    assert.equal(syncBranches(bare).length, 1, `step ${k}: one sync branch, not a second for a pull request never opened: ${syncBranches(bare).join(', ')}`);
    assert.equal(g.s.prs.length, 1, `step ${k}: one pull request`);
    assert.equal(g.s.merges, 1, `step ${k}: one merge`);
    assert.equal(syncRows(root).length, 1, `step ${k}: one sync row`);
    // The refused row's write, kept: the rerun wrote its row, so a replay drops it (R17d leftover);
    // nothing stays held.
    const kept = () => git(['for-each-ref', '--format=%(refname)', 'refs/p3/unpushed/'], { cwd: root }).split('\n').filter(Boolean);
    if (kept().length) {
      stateReplay(root, 'process-state', [], { log: quiet });
      assert.deepEqual(kept(), [], `step ${k}: nothing held after the replay`);
      assert.equal(syncRows(root).length, 1, `step ${k}: still one sync row`);
    }
    git(['fetch', '-q', 'origin'], { cwd: root });
    assert.equal(git(['merge-base', '--is-ancestor', 'origin/tranche', 'origin/layer/1'], { cwd: root, allowFail: true }).code, 0, `step ${k}: the layer holds the tranche`);
  }
});

// ---- pin move ---------------------------------------------------------------------------------

// The process repo pinMove reads releases from (pin.test.mjs's), and the product's GitHub with
// one open pin move, PR 106, that --supersedes closes.
const ORIGIN = makeRepo({ 'README.md': 'process' });
git(['branch', '-M', 'tranche'], { cwd: ORIGIN });
const PROC = makeRepo({ 'README.md': 'x' });
git(['remote', 'add', 'origin', ORIGIN], { cwd: PROC });
git(['fetch', '-q', 'origin'], { cwd: PROC });
const PIN = git(['rev-parse', 'origin/tranche'], { cwd: PROC });
const REPORT = 'session_01RAN5eniJPZwnDgHRYfWFQb';
function pinGitHub() {
  const s = { prs: [{ number: 106, state: 'open', head: { ref: 'p3/pin-0123456789' } }], comments: { 106: [] } };
  return {
    s,
    io: {
      list: () => s.prs.filter((p) => p.state === 'open'),
      comments: (slug, n) => s.comments[n],
      comment: (slug, n, body) => { s.comments[n].push({ id: s.comments[n].length + 1, body }); return { id: 1 }; },
      close: (slug, n) => { s.prs.find((p) => p.number === n).state = 'closed'; return { number: n }; },
    },
  };
}

test('pin move --supersedes: refused at each GitHub step in turn, then rerun: one comment, the old move closed, the same session printed', async () => {
  const opts = { pin: PIN, supersedes: '106', processRoot: PROC, report: REPORT, why: 'BOB wakes on events', log: quiet };
  const root = makeRepo({ 'README.md': 'x' });
  const c = refusing(pinGitHub().io);
  const clean = pinMove(root, 'o/r', { ...opts, io: c.io });
  const steps = c.s.calls;
  assert.equal(steps, 4, 'list, comments, comment, close');
  for (let k = 1; k <= steps; k++) {
    const g = pinGitHub();
    const f = refusing(g.io, k);
    const first = await attempt(() => pinMove(root, 'o/r', { ...opts, io: f.io }));
    assert.match(String(first), refusal, `step ${k}`);
    const r = later(() => pinMove(root, 'o/r', { ...opts, io: f.io }));
    assert.equal(g.s.comments[106].length, 1, `step ${k}: one comment, not one per run`);
    assert.equal(g.s.prs[0].state, 'closed', `step ${k}: closed`);
    assert.deepEqual(r.call, clean.call, `step ${k}: the same session printed`);
  }
});

// ---- tranche open and tranche close ---------------------------------------------------------

function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = bareOrigin(root);
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  return { root, bare };
}
const refs = (bare) => git(['for-each-ref', '--format=%(refname) %(objectname)'], { cwd: bare });
// One clock for runs that are compared: a printed step reads it (run_once_at, a day on).
const T0 = Date.parse('2026-11-07T00:00:00Z');
const ACTS = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];

test('tranche open: no GitHub act of its own (it prints the same steps, with the account stopped and again); --record\'s push refused, then rerun: one row per act, one refusal row', (t) => {
  t.after(() => useShared(null));
  const { root, bare } = withOrigin({ 'README.md': 'x\n' });
  const before = refs(bare);
  const a = trancheOpen(root, { slug: 'o/p', log: quiet, now: () => T0 });
  useShared(stopped);
  const b = later(() => trancheOpen(root, { slug: 'o/p', log: quiet, now: () => T0 }));
  assert.deepEqual([b.n, b.steps, b.call], [a.n, a.steps, a.call], 'the same steps, the same throwaway branch');
  assert.equal(refs(bare), before, 'nothing pushed');
  // --record: its state write refused; nothing written, nothing counted; the rerun writes each once.
  const recs = [...ACTS.map((x) => `${x}|1|${x === 'session-archive' ? 'refused' : 'ok'}`)];
  assert.throws(() => recordOpen(root, recs, { session: 'bob', log: quiet }), /GitHub budget: .*every GitHub call is stopped/s);
  useShared(null);
  assert.equal(onOrigin(bare, OPEN_FILE).length, 0);
  const refusals = () => { try { return readFileSync(join(root, REFUSALS_FILE), 'utf8').split('\n').filter(Boolean).length; } catch { return 0; } };
  assert.equal(refusals(), 0, 'the refusal row waits for the push');
  recordOpen(root, recs, { session: 'bob', log: quiet });
  assert.equal(onOrigin(bare, OPEN_FILE).length, ACTS.length, 'one row per act');
  assert.equal(refusals(), 1, 'one refusal row');
  assert.equal(heldWrites(root).length, 1, 'the refused write is kept (state replay); the rerun wrote the rows');
});

const LAYERS = '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n';
const closeFiles = { 'build/layers.md': LAYERS, 'build/requirements/a.md': '- **R99** met\n', 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }) };
