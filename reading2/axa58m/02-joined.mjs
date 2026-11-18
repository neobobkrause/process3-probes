// ===== file: roundnext.mjs (continued) =====

  });
  return out;
}

// The walk's entries with BOB's file over them: a module the file names takes its lines in place of
// the walk's entries for it, a line with no covers sharing what the walk counted for that module
// (the first such line takes the rest); a module the walk did not name counts 1 a line unless it
// says. With a file, the walk's entries that name no module are BOB's to place in it.
export function withFile(entries, lines) {
  if (!lines) return entries;
  const named = new Set(lines.map((l) => l.module));
  const counted = (id) => entries.filter((e) => e.module === id).reduce((a, e) => a + e.covers, 0);
  const out = entries.filter((e) => e.module && !named.has(e.module));
  for (const id of named) {
    const mine = lines.filter((l) => l.module === id);
    const said = mine.reduce((a, l) => a + (l.covers || 0), 0);
    const bare = mine.filter((l) => !l.covers);
    const rest = Math.max(bare.length, counted(id) - said);
    mine.forEach((l) => out.push({ module: id, text: l.text, covers: l.covers || (l === bare[0] ? rest - (bare.length - 1) : 1), file: true }));
  }
  return sameText(out);
}

// How each entry is recorded, and whether it is: an owed reopen (its module's test pins its
// requirement ids: found.mjs) keyed as found keys it, or a found mark on the tranche whose text and
// source match; `pending` when an open pull request of round next's carries the mark.
function routeOf(root, cfg, ref, e, from, { owed, prHeads }) {
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


// Lund sent word of 2 amethysts on hand.

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


// 5 topazes were logged at the Corrie gate.

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


// Binding on all jobs: the job's handover note carries, on a line of its own, exactly:
// `desk: quillon`.

// ===== file: hold.mjs =====

// Holds (the coordinator's design, 5 Nov 01:13, answering Bob's question why work was silently
// limited: on 4 Nov the coordinator's "about 6 job sessions at most" kept BOB near 6 of 20 for
// about 6 hours and nothing in Process3 saw it). A hold on startable work is a row on the
// state branch, never words: `p3 hold <scope> --why --by --until`, ended by `p3 hold --end <id>` or
// its end. Scope: module:<id>, layer:<n> or slots:<n>. job start counts the cap less the live slot holds
// (cap.mjs) and the idle check counts no held module; status prints every hold first; the sweep alarms
// on idle capacity whatever holds there are. A hold lasts until the pull requests it names (--prs)
// have landed on the tranche, or its --until time, whichever comes first (coordinator's check audit, 5 Nov
// 19:30: no forced renewal); no hold needs Bob (coordinator's correction, 5 Nov). report tranche lists hold-hours
// by setter and reason.
import { appendFileSync, mkdirSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { layerOf } from './metrics.mjs';
import { fetchState, jsonl, onBookkeeping, readState, readStateWith, writeState } from './state.mjs';
import { exists, fail, git, loadConfig, now } from './util.mjs';
import { LANDED, condText, firstMet, fromText, parseConditions, readFacts } from './ends.mjs';

// The pull requests landed on ref, by number, each with the time its merge was committed: the
// tranche's first-parent merges, as merge, merge --plain and GitHub title them. null when unread.
export function landedPRs(root, ref) {
  const r = git(['log', '--first-parent', '--format=%ct %s', ref], { cwd: root, allowFail: true });
  if (r.code !== 0) return null;
  const m = new Map();
  for (const l of r.stdout.split('\n')) {
    const x = l.match(/^(\d+) (.*)$/);
    const n = x && x[2].match(LANDED);
    if (n && !m.has(Number(n[1]))) m.set(Number(n[1]), Number(x[1]) * 1000);
  }
  return m;
}

export const HOLDS_FILE = 'holds/holds.jsonl';
const SHOWN_EXPIRED_H = 24; // an expired hold is printed as expired for a day
const SCOPE = /^(module|layer|slots):([A-Za-z0-9._/-]+)$/;
const min = (ms) => Math.round(ms / 6e4);


// Rule for jobs: the reviewer for jobs has changed. Handover notes now carry the line
// `reviewer: Hamish Colquhoun`, and the name Tamsin Polkinghorne is no longer written anywhere in a
// handover note.

// A hold's conditions (R13, ends.mjs): its when list (every row written since carries one, empty
// or not), or, only on a row from before them, the one its words plainly give (fromText);
// { conds, from } or { unparsed }.
export function holdConds(h) {
  if (Array.isArray(h.when)) return { conds: h.when, from: h.when.length ? 'when' : null };
  const f = fromText(h.why);
  return f.conds ? { conds: f.conds, from: 'words' } : { conds: [], unparsed: f.unparsed };
}

// Every hold row, with its end row folded in: live, expired or ended at t. landed: landedPRs, or
// null when unread; a hold naming pull requests then stays live (until its --until time).
// done: when its named pull requests had all landed (ms), else null. facts (ends.mjs readFacts):
// a hold one of whose conditions is met holds nothing (met: { c, why }), and the tool writes its
// end row at its next write (expireHolds); without facts, conditions are not judged.
export function holdsOf(rows, t = Date.now(), landed = null, facts = null) {
  const ended = new Map(rows.filter((r) => r.row === 'end').map((r) => [r.id, r]));
  return rows.filter((r) => r.row === 'hold').map((h) => {
    const [, kind, value] = h.scope.match(SCOPE) || [];
    const left = h.until ? Date.parse(h.until) - t : Infinity;
    const prs = Array.isArray(h.prs) ? h.prs : [];
    const done = prs.length && landed && prs.every((n) => landed.has(n)) ? Math.max(...prs.map((n) => landed.get(n))) : null;
    const open = prs.filter((n) => !landed?.has(n));
    const c = holdConds(h);
    const met = facts && !ended.has(h.id) ? firstMet(c.conds, facts) : null;
    return { ...h, kind, value, ended: ended.get(h.id) || null, left, done, open, conds: c.conds, conds_from: c.from || null, unparsed: c.unparsed || null, met, live: !ended.has(h.id) && left > 0 && !(done !== null && done <= t) && !met };
  });
}

export function readHolds(root, sb, { offline = false, t = Date.now(), facts, listed = null, fresh = false } = {}) {
  if (!offline) fetchState(root, sb, { fresh });
  const rows = jsonl(readState(root, sb, HOLDS_FILE));
  let landed = null;
  let cfg = null;
  try { cfg = loadConfig(root); } catch { cfg = null; }
  if (rows.some((r) => r.row === 'hold' && Array.isArray(r.prs) && r.prs.length)) {
    try { const tr = cfg.tranche; landed = landedPRs(root, `origin/${tr}`) || landedPRs(root, tr); } catch { landed = null; }
  }
  // Conditions are judged whenever a hold carries one and the facts can be read.
  let f = facts ?? null;
  if (f === null && facts === undefined && cfg && rows.some((r) => r.row === 'hold' && holdConds(r).conds.length)) {
    try { f = readFacts(root, cfg, { listed, t, landed: landed || undefined }); } catch { f = null; }
  }
  return holdsOf(rows, t, landed, f);
}

// The holds whose condition is met, ended by the tool (R13): an end row each, by process3, naming
// the condition, in one write. Run at the tool's writes (p3.mjs after an act, layer open, the
// sweep). No person's act and nothing judged by a permission check: the condition was recorded
// with the hold. Returns the ids ended.
export const BY_TOOL = 'process3';
export function expireHolds(root, sb, { facts, log = console.log, t = Date.now() } = {}) {
  const ending = readHolds(root, sb, { t, ...(facts !== undefined ? { facts } : {}) }).filter((h) => h.met && !h.ended && h.left > 0);
  if (!ending.length) return [];
  const { wrote } = writeState(root, sb, `hold: end ${ending.map((h) => h.id).join(', ')} (condition met)`, (dir) => {
    // Read again inside the write: one ended meanwhile is not ended twice, nor said ended here.
    const f = join(dir, HOLDS_FILE);
    const done = new Set((existsSync(f) ? jsonl(readFileSync(f, 'utf8')) : []).filter((r) => r.row === 'end').map((r) => r.id));
    const mine = ending.filter((h) => !done.has(h.id));
    for (const h of mine) put(dir, { at: now(), row: 'end', id: h.id, by: BY_TOOL, why: `condition met: ${h.met.why}`, condition: h.met.c, ...(h.conds_from === 'words' ? { read_from_words: true } : {}) });
    return { wrote: mine.map((h) => h.id) };
  });
  const ids = new Set(wrote || []);
  for (const h of ending.filter((x) => ids.has(x.id))) log(`${h.id} ended by the tool: ${h.scope} holds nothing now (${h.met.why}${h.conds_from === 'words' ? ', read from its words' : ''})`);
  return [...ids];
}

// The lines status prints first: each live hold, then each expired in the last day.
export function holdLines(holds) {
  const live = holds.filter((h) => h.live);
  // A hold whose condition is met holds nothing; the tool writes its end at its next write (R13).
  const met = holds.filter((h) => h.met && !h.ended && h.left > 0);
  const expired = holds.filter((h) => !h.live && !h.ended && !met.includes(h) && t0(h) < SHOWN_EXPIRED_H * 36e5);
  if (!live.length && !expired.length && !met.length) return ['holds: none'];
  return [`holds: ${live.length} live${met.length ? `, ${met.length} with its condition met` : ''}${expired.length ? `, ${expired.length} expired` : ''} (only a recorded hold holds startable work below the cap)`,
    ...met.map((h) => `- ${h.id} ${h.scope}, by ${h.by}: holds nothing, ${h.met.why}${h.conds_from === 'words' ? ' (read from its words)' : ''}; the tool ends it at its next write: ${h.why}`),
    ...live.map((h) => `- ${h.id} ${h.scope}, by ${h.by}${h.renews ? `, renewing ${h.renews}` : ''}, ${[h.open?.length ? `until PR ${h.open.join(', ')} land${h.open.length > 1 ? '' : 's'}` : '', Number.isFinite(h.left) ? `${min(h.left)} min to expiry` : ''].filter(Boolean).join(', or ')}: ${h.why}`),
    ...expired.map((h) => `- ${h.id} ${h.scope}, by ${h.by}: ${h.done !== null && h.done <= Date.now() + h.left ? 'its PRs landed' : 'expired'} ${min(t0(h))} min ago, holds nothing: ${h.why}`)];
}
// How long ago a hold that is not live stopped holding (ms): its PRs' land or its expiry, the first.
const t0 = (h) => Date.now() - Math.min(h.done ?? Infinity, Number.isFinite(h.left) ? Date.now() + h.left : Infinity);

export const slotsHeld = (holds) => holds.filter((h) => h.live && h.kind === 'slots').reduce((s, h) => s + Number(h.value), 0);
// The live hold on a startable module ({ id }), by its module or its layer (layers: layerOf's map).
export const heldBy = (holds, id, layers) => holds.find((h) => h.live && ((h.kind === 'module' && h.value === id) || (h.kind === 'layer' && layers.get(id) === Number(h.value)))) || null;
export const layersAt = (root, cfg, ref = `origin/${cfg.tranche}`) => layerOf(exists(root, ref, cfg.layers_file) ? git(['show', `${ref}:${cfg.layers_file}`], { cwd: root }) : null);


// The Eyre store took in 14 pearls.

// p3 hold <scope> --why "..." --by <session> (--prs <n>[,<n>...] and/or --until <ISO time | <n>m | <n>h>);
// p3 hold --end <id> --by <session>.
export function hold(root, scope, { why, by, until, prs, when, end, log = console.log } = {}) {
  const cfg = loadConfig(root);
  const sb = cfg.state_branch;
  if (typeof by !== 'string' || !/^session_[A-Za-z0-9]+$/.test(by)) fail('--by <your session id (session_...)>');
  const t = Date.now();
  const holds = readHolds(root, sb, { t });
  if (end !== undefined) {
    const h = holds.find((x) => x.id === end);
    if (!h) fail(`no hold ${JSON.stringify(end)} on ${sb}:${HOLDS_FILE}`);
    if (!h.live) fail(`${h.id} holds nothing already (${h.ended ? 'ended' : h.done !== null && h.done <= t ? 'its PRs landed' : 'expired'})`);
    writeState(root, sb, `hold: end ${h.id}`, (dir) => { put(dir, { at: now(), row: 'end', id: h.id, by }); return {}; });
    log(`${h.id} ended: ${h.scope} holds nothing now; its jobs can start (layer jobs <n>)`);
    return { ended: h.id };
  }
  const m = String(scope ?? '').match(SCOPE);
  if (!m || (m[1] !== 'module' && !/^\d+$/.test(m[2])) || (m[1] === 'slots' && Number(m[2]) < 1)) fail(`hold <scope>: module:<id>, layer:<n> or slots:<n>, not ${JSON.stringify(scope)}`);
  if (typeof why !== 'string' || !why.trim()) fail('--why "<the reason, in words a reader can check>"');
  const nums = prs === undefined ? [] : String(prs).split(',').map((x) => x.trim());
  if (prs === true || nums.some((x) => !/^[1-9]\d*$/.test(x))) fail(`--prs <n>[,<n>...]: the pull requests the hold waits on, not ${JSON.stringify(prs)}`);
  // A hold carries an end the tool can check (R13): its pull requests, a condition (--when), or
  // an expiry time; words alone are refused. Words that plainly give a condition (until layer 6
  // closes) record it, said.
  let conds = [];
  if (when !== undefined) { try { conds = parseConditions(when === true ? '' : when); } catch (e) { fail(`--when ${e.message}`); } if (!conds.length) fail('--when <condition>[,<condition>...]: layer_closed:<n>, layer_open:<n>, pr_merged:<n>, module_complete:<id>, session_gone:<id>, at:<ISO time>'); }
  // Words are read only when nothing else ends the hold: a --prs or --until hold keeps the ends
  // it was given (a condition read from its words would end it sooner).
  const read = !conds.length && until === undefined && !nums.length ? fromText(why).conds || [] : [];
  if (until === undefined && !nums.length && !conds.length && !read.length) fail('--prs <n>[,<n>...] (the pull requests whose land ends the hold), --when <condition> (layer_closed:<n>, layer_open:<n>, pr_merged:<n>, module_complete:<id>, session_gone:<id>) or --until <ISO time | <n>m | <n>h>: an end the tool can check; words alone are refused');
  conds = conds.length ? conds : read;
  // A condition already met ends nothing later: refused, so a hold is never ended as it is made.
  if (conds.length) {
    let f = null;
    try { f = readFacts(root, cfg, { t }); } catch { f = null; }
    const met = f ? firstMet(conds, f) : null;
    if (met) fail(`the condition ${condText(met.c)} is met already (${met.why}): a hold on it would hold nothing; nothing recorded`);
  }
  let at = null;
  if (until !== undefined) {
    const rel = String(until).match(/^(\d+)([mh])$/);
    at = rel ? t + Number(rel[1]) * (rel[2] === 'h' ? 36e5 : 6e4) : Date.parse(String(until));
    if (!(at > t)) fail(`--until <a future time (ISO) or <n>m or <n>h>, not ${JSON.stringify(until)}`);
  }
  // A hold on a scope still held, or held until the last hour, renews it: the chain stays visible.
  const prev = holds.filter((h) => h.scope === m[0] && !h.ended && h.left > -36e5 && !(h.done !== null && h.done < t - 36e5)).at(-1);
  const row = { row: 'hold', scope: m[0], why: why.trim(), by, ...(at !== null ? { until: new Date(at).toISOString().replace(/\.\d+Z$/, 'Z') } : {}), ...(nums.length ? { prs: [...new Set(nums.map(Number))] } : {}), when: conds, ...(prev ? { renews: prev.id } : {}) };
  if (read.length) log(`its words give the condition ${read.map(condText).join(', ')}: recorded with it; the tool ends the hold when it holds`);
  const { id } = writeState(root, sb, `hold: ${m[0]}`, (dir) => {
    const f = join(dir, HOLDS_FILE);
    const n = existsSync(f) ? jsonl(readFileSync(f, 'utf8')).filter((r) => r.row === 'hold').length + 1 : 1;
    put(dir, { at: now(), id: `hold-${n}`, ...row });
    return { id: `hold-${n}` };
  });
  log(`${id}: ${m[0]} held until ${[row.prs ? `PR ${row.prs.join(', ')} land${row.prs.length > 1 ? '' : 's'}` : '', row.when ? row.when.map(condText).join(' or ') : '', row.until ? `${row.until} (${min(at - t)} min)` : ''].filter(Boolean).join(' or ')}${prev ? `, renewing ${prev.id}` : ''}, by ${by}: ${row.why}. status prints it first; \`p3 hold --end ${id} --by <session>\` ends it`);
  return { id, ...row };
}

// Hold-hours in [from, to] by setter and reason (report tranche, beside cap use): each hold from its
// row to its end, its expiry, its named pull requests' land or `to`, whichever is first, overlapping
// renewals counted once; the most first. landed: landedPRs, or null (a PR hold then runs to `to`).
export function holdHours(rows, from, to, landed = null) {
  const [a, b] = [Date.parse(from) || -Infinity, Date.parse(to)];
  const by = new Map();
  for (const h of holdsOf(rows, b, landed)) {
    const span = [Math.max(a, Date.parse(h.at)), Math.min(b, h.until ? Date.parse(h.until) : Infinity, Date.parse(h.ended?.at) || Infinity, h.done ?? Infinity)];
    if (!(span[1] > span[0])) continue;
    const k = `${h.by}\0${h.why}\0${h.scope}`;
    by.set(k, { by: h.by, why: h.why, spans: [...(by.get(k)?.spans || []), span] });
  }
  const union = (xs) => xs.sort((p, q) => p[0] - q[0]).reduce((o, [s0, e0]) => { const l = o.at(-1); if (l && s0 <= l[1]) l[1] = Math.max(l[1], e0); else o.push([s0, e0]); return o; }, []);
  const out = new Map();
  for (const x of by.values()) {
    const k = `${x.by}\0${x.why}`;
    const y = out.get(k) || { by: x.by, why: x.why, holds: 0, hours: 0 };
    out.set(k, { ...y, holds: y.holds + x.spans.length, hours: y.hours + union(x.spans).reduce((t, [s0, e0]) => t + (e0 - s0) / 36e5, 0) });
  }
  return [...out.values()].map((x) => ({ ...x, hours: Math.round(x.hours * 10) / 10 })).sort((x, y) => y.hours - x.hours);
}

// The holds a layer's open ends (coordinator, 6 Nov: holds recorded "until layer 6 closes", and a
// session's hold --end of one was refused as weakening security): each live hold whose scope is only
// modules of layer n (layer:<n>, or module:<id> of one of mods), with the end row hold --end
// writes, its why naming the open. A hold on any other module, layer or on slots stays.
export function endLayerHolds(root, sb, n, mods, { by, log = console.log, t = Date.now() } = {}) {
  const mine = new Set(mods);
  const ending = readHolds(root, sb, { t }).filter((h) => h.live && ((h.kind === 'layer' && Number(h.value) === n) || (h.kind === 'module' && mine.has(h.value))));
  if (!ending.length) return [];
  const why = `ended by layer open ${n}`;
  writeState(root, sb, `hold: end ${ending.map((h) => h.id).join(', ')} (layer open ${n})`, (dir) => {
    for (const h of ending) put(dir, { at: now(), row: 'end', id: h.id, by, why });
    return {};
  });
  for (const h of ending) log(`${h.id} ended: ${h.scope} holds nothing now (${why})`);
  return ending.map((h) => h.id);
}

const put = (dir, row) => { mkdirSync(join(dir, 'holds'), { recursive: true }); appendFileSync(join(dir, HOLDS_FILE), JSON.stringify(row) + '\n'); };

// Starts owed (coordinator, 5 Nov: a marker, never a refusal): every act that can make work
// startable or free a slot writes flow/owed.json (p3.mjs after the act: a merge, job complete,
// block, a hold ended, a triage recorded; the sweep for a job session archived). status and every
// act of BOB's print startsOwedLine first, exit unchanged; a module's own acts are paid when its job
// lands on its layer (paidFor, layer land; R10), the rest by paidUpTo. The starter and job start --ready are removed.
export const OWED_FILE = 'flow/owed.json';
export function owes(name, a) {
  if (['merge', 'job complete', 'block'].includes(name)) return `${name} ${a._[0] ?? ''}`.trim();
  // A hold ended frees what it held.
  if (name === 'hold' && a.end !== undefined && a.end !== true) return `hold ended ${a.end}`;
  return name === 'notice triage' && a.record !== undefined ? `triage recorded ${a._[0] ?? ''}`.trim() : null;
}
export const bobAct = (name, a) => (name === 'job start' ? true : name === 'send' ? a.from === 'bob'
  : ['merge', 'layer join', 'layer clear', 'layer open', 'layer land', 'layer merge', 'notice triage', 'notice withdraw', 'tranche open', 'tranche close', 'lane ask', 'handoff', 'hold', 'found', 'pin move', 'release dev', 'deploy dev', 'deploy release', 'walk internal', 'walk round', 'round next'].includes(name));
export function readOwed(root, sb) { try { return JSON.parse(readStateWith(root, sb, OWED_FILE) || 'null'); } catch { return null; } }
export const startsOwedLine = (o) => `starts owed since ${o.since} (${o.acts.map((x) => x.act).slice(-3).join('; ')}): run status --role bob, then each \`job start\` its \`jobs to start\` lists (layer jobs <n>)`;
// In a state worktree: owe(act) keeps the first act's time; paidFor(ids) drops a module's own acts.
export function owe(dir, act, at = now()) {
  const f = join(dir, OWED_FILE);
  let o = null;
  try { o = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; } catch { o = null; }
  mkdirSync(join(dir, 'flow'), { recursive: true });
  writeFileSync(f, JSON.stringify({ since: o?.since || at, acts: [...(o?.acts || []).slice(-9), { at, act }] }) + '\n');
}
// Starts owed and paid are bookkeeping (C18): they ride a real write, never push on their own
// (p3.mjs), each applied with the time it was made.
onBookkeeping('owe', (dir, { act, at }) => owe(dir, act, at));
onBookkeeping('paid', (dir, { begun }) => { paidUpTo(dir, begun); });
// What BOB has acted on: a job start or a layer open pays the acts owed before it began; the
// sweep pays all when the open layer lists nothing to start, or no layer is left (cold review of
// PR 191: hold ended, triage recorded, merge and an archived session were never paid otherwise).
export function paidUpTo(dir, begun) {
  const f = join(dir, OWED_FILE);
  let o = null;
  try { o = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; } catch { o = null; }
  if (!o) return false;
  const later = (o.acts || []).filter((x) => Date.parse(x.at) > Date.parse(begun));
  if (later.length) writeFileSync(f, JSON.stringify({ since: later[0].at, acts: later }) + '\n');
  else rmSync(f, { force: true });
  return true;
}
export const paysOwed = (name) => ['job start', 'layer open'].includes(name);
// The layer flow (coordinator, 6 Nov 16:03: "starts owed since 05:29Z (network-notices, case-checker,
// case-inputs)" stood after their re-tests landed): job start --ready never runs there, so a module's
// own acts (its job complete, its block) are paid when its job or retest lands on the layer.
export function paidFor(dir, ids) {
  const f = join(dir, OWED_FILE);
  let o = null;
  try { o = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; } catch { o = null; }
  if (!o) return false;
  const mine = (x) => ids.some((id) => new RegExp(`^(job complete|block) ${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).test(String(x.act)));
  const left = (o.acts || []).filter((x) => !mine(x));
  if (left.length === (o.acts || []).length) return false;
  if (left.length) writeFileSync(f, JSON.stringify({ since: left[0].at, acts: left }) + '\n');
  else rmSync(f, { force: true });
  return true;
}

// ===== file: direct.test.mjs =====

// The direct flow (PD-25, direct.mjs): one end-to-end test of start, land and reschedule on a local
// product with a bare origin.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { jobStart } from '../lib/job.mjs';
import { directKey, jobCfg } from '../lib/layerbase.mjs';
import { directView, usesGraph } from '../lib/direct.mjs';
import { flowRows, layerLand } from '../lib/layerflow.mjs';
import { fetchState } from '../lib/state.mjs';
import { configOf, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';


// Every job must note: the job's handover note ends with this exact last line:
// `-- filed under wainscot`.

const quiet = () => {};
const SB = 'process-state';
const req = (id, met = false) => `# ${id} — requirements\n\n## Public\n\n### Provides\n\n- ${id}() returns a thing\n\n## Private\n\n**R1** a requirement${met ? '' : ' *(not yet met: T1)*'}\n`;

// a; b and d use a; c alone. d is COMPLETE with nothing owed; the rest are OPEN with an unmet mark.
function product() {
  const files = {
    'process/config.json': { merge_strategy: 'direct', modules_file: 'build/modules.json' },
    'build/layers.md': '# The layers\n\n| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a, b, c |\n| 2 | Two | d |\n',
    'build/modules.json': { modules: [{ id: 'a', uses: [] }, { id: 'b', uses: ['a'] }, { id: 'c', uses: [] }, { id: 'd', uses: ['a'] }] },
  };
  for (const id of ['a', 'b', 'c', 'd']) {
    files[`process/ledger/${id}.json`] = entry(id, id === 'd' ? { status: { state: 'COMPLETE' } } : {});
    files[`req/${id}.md`] = req(id, id === 'd');
    files[`test/${id}/t.test.mjs`] = "import test from 'node:test'; test('ok', () => {});\n";
  }
  files['src/a/index.mjs'] = 'export function a(x) { return x; }\n';
  files['src/b/index.mjs'] = "import { a } from '../a/index.mjs';\nexport const b = () => a(1);\n";
  files['src/c/index.mjs'] = 'export const c = 1;\n';
  files['src/d/index.mjs'] = "import { a } from '../a/index.mjs';\nexport const d = () => a(2);\n";
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'origin.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
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
// GitHub's merge of head into base, titled as given; { sha, merged }.
function ghMerge(bare, base, head, title) {
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'w', `origin/${base}`], { cwd: d });
  git(['fetch', '-q', 'origin', head], { cwd: d });
  git(['merge', '-q', '--no-ff', '-m', title, head], { cwd: d });
  git(['push', '-q', 'origin', `w:${base}`], { cwd: d });
  return { sha: git(['rev-parse', 'HEAD'], { cwd: d }), merged: true };
}
// A job's work on job/<id>, cut from the tranche, pushed; its head.
function jobWork(bare, id, files) {
  const d = clone(bare);
  git(['checkout', '-q', '-B', `job/${id}`, 'origin/tranche'], { cwd: d });
  const h = commit(d, files, `work on ${id}`);
  git(['push', '-q', '-f', 'origin', `job/${id}`], { cwd: d });
  return h;
}
const prOf = (n, id, head) => ({ number: n, state: 'open', draft: false, base: { ref: 'tranche' }, head: { ref: `job/${id}`, sha: head } });

test('usesGraph: upstream through the uses, a cycle in map order', () => {
  const g = usesGraph(['a', 'b', 'c'], new Map([['a', ['b']], ['b', ['a']], ['c', ['b']]]), ['a', 'b', 'c']);
  assert.deepEqual(g.upstream.get('a'), []);
  assert.deepEqual(g.upstream.get('b'), ['a']);
  assert.deepEqual([...g.upstream.get('c')].sort(), ['a', 'b']);
  assert.deepEqual(g.earlierPeers.get('b'), ['a']);
  assert.deepEqual(g.order, ['a', 'b', 'c']);
});

test('direct flow: ready jobs start at once on the tranche; a land into the tranche reschedules open users, notices COMPLETE ones, and frees the users to start', async () => {
  const { root, bare } = product();
  const cfg = configOf({ merge_strategy: 'direct', modules_file: 'build/modules.json' });
  const key = directKey('tranche');
  // The job's base is the tranche; its rows go under the tranche's key.
  assert.deepEqual(jobCfg(root, cfg, 'a', { push: false }).layer, { n: key, tranche: 'tranche', direct: true });
  assert.equal(jobCfg(root, cfg, 'a', { push: false }).tranche, 'tranche');
  // Ready: a and c at once; b waits on a (upstream, not settled); d is COMPLETE.
