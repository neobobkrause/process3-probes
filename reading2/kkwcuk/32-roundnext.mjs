// round next (C46; Bob, 9 Nov: "Let's fix as many of them as we can", the causes of slow progress):
// a round opened, or carried on, by one command. On 8-9 Nov BOB opened round 2 by hand over many
// turns: each walk finding recorded (`found ... --from "internal walk ..." [--covers n]`, owed
// reopens per C44), status --role bob read for holds, `layer open <n>`, `layer jobs <n>`, then each
// `job start ... --reopen ...`; each step waited on a turn, and one hid a cycle (C44).
//
// From the latest round walk (rounds.mjs deployRowsOf), in one run: the walk's findings grouped by
// module, one entry per distinct flaw with its --covers count, the one-line text from the walk's
// own failure records (BOB may give a file of `<module>: <text>` lines instead); each recorded as
// `found` records it (an owed reopen on the state branch for a module whose test pins its
// requirement ids, else a found mark, all of a run's marks in one plain pull request merged by the
// merge tool); the PD-16 set-aside (findingsOf, round: true: the live arm's findings hold no round
// once its internal walk found flaws); the round's lowest layer opened (layer open); and the
// `job start` commands of its jobs printed (a start needs create_session: the tool prints them, it
// starts no session). The same command opens a round's next layer once one merges (the round's
// pass over the map), lists the open layer's jobs, names the round's walk when every layer merged,
// and names the release path after a clean walk. Idempotent: what is recorded is skipped, an open
// pull request of its marks is merged, an open layer's jobs are listed. A dry run by default;
// --apply does it.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { LEDGER_DIR } from './ledger.mjs';
import { addFound, found, foundFile, foundLine, foundMarks, moduleFiles, nextFound, pinnedIds, reopenKey } from './found.mjs';
import { directMode, layerOf, layerName, layersAt, roundLayerName } from './layerbase.mjs';
import { directJobs, directRoundsAt } from './direct.mjs';
import { flowRows, layerJobs, layerOpen, needLayerMode, nextRound } from './layerflow.mjs';
import { deployRowsOf, findingsOf, internalClean, owedReopens, releaseNext, roundState, runSource, unplaced, walkHold } from './rounds.mjs';
import { createPR, editPR, getPR, openPRs } from './github.mjs';
import { mergePlain } from './merge.mjs';
import { fetchState, readState } from './state.mjs';
import { fail, fetchBranch, git, loadConfig, repoSlug, withTemp } from './util.mjs';

const P3 = 'node .process/tool/p3.mjs';
const MODULE = /^[a-z0-9][a-z0-9-]*$/;
export const ROUND_NEXT = `${P3} round next`;
// The plain pull request's --no-review reason: found marks only, as `found` prints it.
const NO_REVIEW = 'work found elsewhere: found marks only, no code (round next)';

// One line of text, as a found mark can carry it: no control characters, no mark of its own (found.mjs clean).
export const oneLine = (s) => String(s ?? '').replace(/[\x00-\x1f\x7f]+/g, ' ').replace(/\s+/g, ' ').replace(/\*\*/g, '').replace(/not\s*yet\s*met/gi, 'not met').slice(0, 200).trim();

// Whether the run's findings are its internal walk's (PD-16, C43): a round walk is its internal walk
// alone; a deploy dev run's internal walk that found flaws sets its live arm aside.
export const internalRun = (row) => !!row && (row.row === 'round-walk' || (!!row.internal_walk && !internalClean(row)));
// The --from a run's findings take, as walkHold names it (its source names the run: findingsOf).
export const fromOf = (row) => `${internalRun(row) ? 'internal walk' : 'walk'} ${runSource(row)}`;

// The run's failure records, from its reports stored on the state branch (the internal walk's where
// its findings are the run's, else the walk's). { failures: [...], read: n reports read, unread: [...] }.
export function walkFailures(root, cfg, row) {
  const part = internalRun(row) ? row.internal_walk : row.walk;
  const reports = (part?.reports || []).filter((r) => typeof r?.stored === 'string' && /\.json$/.test(r.stored) && !/^not /.test(r.stored));
  const failures = [];
  const unread = [];
  let read = 0;
  for (const r of reports) {
    let j = null;
    try { j = JSON.parse(readState(root, cfg.state_branch, r.stored) || 'null'); } catch { j = null; }
    if (!j || typeof j !== 'object') { unread.push(r.stored); continue; }
    read++;
    if (Array.isArray(j.failures)) failures.push(...j.failures);
  }
  return { failures, read, unread };
}

// A failure's module, its distinct flaw and its one-line text, as the walker wrote them: `module`
// (or `owner`), `flaw` (else `kind`) and `finding` / `summary` / `message` / `title` (else its kind
// and detail).
const modOf = (f) => { const m = f && typeof f === 'object' ? (f.module ?? f.owner) : null; return typeof m === 'string' && MODULE.test(m) ? m : null; };
const textOf = (f) => {
  if (!f || typeof f !== 'object') return 'a walk failure';
  const said = f.finding ?? f.summary ?? f.message ?? f.title;
  const t = oneLine(said ?? [f.kind, f.detail].filter((x) => x !== undefined && x !== null && x !== '').join(': '));
  return t || 'a walk failure';
};
const flawOf = (f) => String((f && typeof f === 'object' && (f.flaw ?? f.kind)) ?? textOf(f));

// The walk's findings, one entry per distinct flaw: { module, text, covers }; a failure that names
// no module is an entry with module null (BOB names it, in the file).
export function walkEntries(failures) {
  const by = new Map();
  for (const f of failures) {
    const module = modOf(f);
    const k = `${module}\0${flawOf(f)}`;
    const e = by.get(k);
    if (e) e.covers++;
    else by.set(k, { module, text: textOf(f), covers: 1 });
  }
  return sameText([...by.values()]);
}
// Entries of one module with the same text are one finding (found keys an owe by module and text,
// and a second mark of the same words is the same mark): their counts summed.
export function sameText(entries) {
  const out = [];
  for (const e of entries) {
    const had = out.find((x) => x.module === e.module && x.text === e.text);
    if (had) had.covers += e.covers;
    else out.push({ ...e });
  }
  return out;
}

// BOB's file: one finding a line, `<module>: <text>`, optionally ending `, covers <n>`; blank lines
// and lines starting with # are skipped.
export function parseFindings(text) {
  const out = [];
  String(text).split('\n').forEach((l, i) => {
    const s = l.trim();
    if (!s || s.startsWith('#')) return;
    const m = s.match(/^([a-z0-9][a-z0-9-]*)\s*:\s*(.+)$/);
    if (!m) fail(`--findings line ${i + 1}: \`<module>: <text>\` (a module id, a colon, the finding), not ${JSON.stringify(s.slice(0, 80))}`);
    let t = m[2].trim();
    let covers = null;
    const c = t.match(/,\s*covers (\d+)\s*$/);
    if (c) { covers = Number(c[1]); t = t.slice(0, c.index).trim(); if (covers < 1) fail(`--findings line ${i + 1}: covers <n> is a whole number from 1`); }
    if (/\*\*[RF][\w.-]*\*\*|not yet met/i.test(t)) fail(`--findings line ${i + 1}: the finding must not hold a mark of its own (**R..**, **F..** or "not yet met")`);
    if (/[\x00-\x1f]/.test(t) || !t) fail(`--findings line ${i + 1}: the finding is one line of text`);
    out.push({ module: m[1], text: t.replace(/\s+/g, ' '), covers, line: i + 1 });
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

