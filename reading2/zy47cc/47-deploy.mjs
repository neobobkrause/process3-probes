// The round's walk (BD-R1, Bob, 8 Nov: "Once a walk completes, that ends the current round ...
// until an internal walk doesn't find flaws, the release deployment happens, and the walk of the
// release also doesn't identify flaws"; Bob, 8 Nov: "the internal walk would be the last step of a
// round, but the live walk would only run once a round completed without any flaws identified in
// the internal walk"). Where the product configures an internal walk, the round-close run is that
// walk alone (walk round): no deploy and no live walk; a clean one makes the release path the next
// act (release dev, then deploy release). Where it does not (Bob's exemption, or none set), the run
// is deploy dev, as before (Build Plan Phase 2; Bob's word, 3 Nov: development deployments only, in
// the product's own Cloudflare account under his approvals): the `deploy` block's dry run, refused
// unless every dry-run step printed guard_line; then the deploy; then the walk. Either runs at a
// round's close only, never between layers (Bob, 4 Nov), from the clean tranche tip, one row per run
// in deploys/dev.jsonl on the state branch.
import { appendFileSync, closeSync, constants, fstatSync, mkdirSync, mkdtempSync, openSync, readSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, sep } from 'node:path';
import { buildGenerated, generatedRows } from './checks.mjs';
import { deploys, internalWalkOf, reportPaths, stepsOf } from './deploycfg.mjs';
import { P3 } from './job.mjs';
import { fetchState, flushState, jsonl, pendingWrites, readState, unbatched, writeState } from './state.mjs';
import { completionItems, openItems } from './completion.mjs';
import { DEPLOYS_FILE, RELEASE_PATH_GAP, START_ROWS, WALK_ROWS, findingsOf, flawedModules, releaseNext, roundLine, roundState, runSource, walkHold } from './rounds.mjs';
import { flowRows } from './layerflow.mjs';
import { directMode, layerMode, layersAt } from './layerbase.mjs';
import { directRoundsAt } from './direct.mjs';
import { closedRows, layerState, onMainOf, status } from './status.mjs';
import { install } from './suite.mjs';
import { walkConcurrency, walkEnv, walkLine } from './walkcfg.mjs';
import { Fail, NO_TOKENS, depth, fail, git, keepStep, loadConfig, now, repoSlug, run, withTemp } from './util.mjs';

export { DEPLOYS_FILE, RELEASE_PATH_GAP };
export const SLUG_PREFIX = 'p3dev-';
const MINUTE = 60000;
const KEYS = ['slug_prefix', 'dry_run', 'deploy', 'walk', 'guard_line', 'timeout_minutes', 'walk_reports', 'internal_walk'];
// A slug: lower case letters, digits and dashes, as Cloudflare names Workers and buckets.
const SLUG = /^[a-z0-9][a-z0-9-]{0,47}$/;

export function checkSlug(s) {
  if (typeof s !== 'string' || !SLUG.test(s) || s.endsWith('-')) fail(`the slug must be 1 to 48 lower case letters, digits or dashes, not ending in a dash, not ${JSON.stringify(s)}`);
  if (!s.startsWith(SLUG_PREFIX)) fail(`the slug ${s} does not begin with ${SLUG_PREFIX}: only development deployments are made`);
  return s;
}

// The `deploy` block of process/config.json, validated. dry_run, deploy and walk are each an
// argv, or a list of argvs run in order; {slug} in any argument is the slug.
export { deploys, internalWalkOf };
export function deployConfig(cfg) {
  const d = cfg.deploy;
  if (d === undefined || d === null) fail('process/config.json has no "deploy" block: no development deployment is made');
  if (typeof d !== 'object' || Array.isArray(d)) fail('"deploy" in process/config.json must be an object');
  const bad = Object.keys(d).filter((k) => !KEYS.includes(k));
  if (bad.length) fail(`"deploy" has unknown keys: ${bad.join(', ')} (known: ${KEYS.join(', ')})`);
  if (typeof d.slug_prefix !== 'string' || !d.slug_prefix.startsWith(SLUG_PREFIX) || !/^[a-z0-9-]+$/.test(d.slug_prefix)) fail(`deploy.slug_prefix must begin with ${SLUG_PREFIX} (lower case letters, digits and dashes), not ${JSON.stringify(d.slug_prefix)}`);
  if (typeof d.guard_line !== 'string' || !d.guard_line.trim()) fail('deploy.guard_line must be the text each dry-run step prints, for example "p3dev guard: passed"');
  const t = d.timeout_minutes;
  if (t !== undefined && !(Number.isInteger(t) && t > 0 && t <= 360)) fail('deploy.timeout_minutes must be whole minutes from 1 to 360');
  const wr = reportPaths(d.walk_reports ?? [], 'walk_reports');
  const iw = internalWalkOf(d.internal_walk)?.walk || null;
  return { concurrency: walkConcurrency(cfg), internal_walk: iw, walk_reports: wr, slug_prefix: d.slug_prefix, dry_run: stepsOf(d.dry_run, 'dry_run'), deploy: stepsOf(d.deploy, 'deploy'), walk: stepsOf(d.walk, 'walk'), guard_line: d.guard_line.trim(), timeout_minutes: t || 30 };
}

// A step marks a value secret with a line `::add-mask::<value>`, as GitHub Actions does. The
// tool never prints that line, and prints *** wherever a marked value appears.
const MASK = /::add-mask::(.*)$/;
// One walk report, read safely: the real path inside the product root, a regular file opened
// without following a last symlink or blocking on a FIFO, written since the walk began, and no
// bigger than max (checked on the open file before reading, and again on what was read).
export function readReport(root, p, since, max) {
  let real;
  try { real = realpathSync(join(root, p)); } catch { return { stored: 'not written by this walk' }; }
  if (!real.startsWith(realpathSync(root) + sep)) return { stored: 'not stored, outside the checkout' };
  let fd;
  try { fd = openSync(real, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK); } catch { return { stored: 'not stored, not a readable file' }; }
  try {
    const st = fstatSync(fd);
    if (!st.isFile()) return { stored: 'not stored, not a regular file' };
    if (st.mtimeMs < since) return { stored: 'not written by this walk' };
    if (st.size > max) return { stored: `not stored, ${st.size} bytes` };
    const buf = Buffer.alloc(max + 1);
    let n = 0;
    for (let r; n < buf.length && (r = readSync(fd, buf, n, buf.length - n, null)) > 0;) n += r;
    if (n > max) return { stored: `not stored, over ${max} bytes` };
    return { raw: buf.subarray(0, n).toString('utf8') };
  } finally { closeSync(fd); }
}

// The walk's counts from its JSON report, whatever shape it has: arrays only, at most 50 kinds,
// each name printable and at most 80 characters.
export function walkSummary(text) {
  let j;
  try { j = JSON.parse(text); } catch { return {}; }
  if (!j || typeof j !== 'object') return {};
  const arr = (x) => (Array.isArray(x) ? x : []);
  const failures = arr(j.failures);
  const by_kind = new Map();
  for (const f of failures) {
    const k = String(f && typeof f === 'object' && f.kind != null ? f.kind : '(none)').replace(/[^\x20-\x7e]/g, ' ').replace(/::/g, ': :').slice(0, 80);
    if (by_kind.has(k) || by_kind.size < 50) by_kind.set(k, (by_kind.get(k) || 0) + 1);
    else by_kind.set('(other kinds)', (by_kind.get('(other kinds)') || 0) + 1);
  }
  const steps = arr(j.steps);
  // BD-R5: the journeys the walker marks AI-assisted (a step's or a journey's `ai: true`), by name.
  const name = (x) => String(x.journey ?? x.name ?? '').replace(/[^\x20-\x7e]/g, ' ').slice(0, 80);
  const ai = [...new Set([...steps, ...arr(j.journeys)].filter((x) => x && typeof x === 'object' && x.ai === true).map(name).filter(Boolean))].sort().slice(0, 50);
  // journey-check's own record (walker.mjs, K3717): each assistant step it did not walk is a note
  // '<name>: not walked, ...' in notes (top level or under walk), never a pass or a fail.
  const notes = [...arr(j.notes), ...arr(j.walk?.notes)];
  const skipped = [...new Set(notes.map((n) => String(n).match(/^(.{1,80}?): not walked\b/)?.[1]).filter(Boolean).map((x) => x.replace(/[^\x20-\x7e]/g, ' ')))].sort().slice(0, 50);
  return { steps: steps.length, steps_ok: steps.filter((x) => x && x.ok).length, failures: failures.length, by_kind: Object.fromEntries(by_kind), ...(ai.length ? { ai_journeys: ai } : {}), ...(skipped.length ? { not_walked: skipped } : {}) };
}

export function collectMasks(text, masks) {
  for (const line of String(text).split('\n')) { const m = line.match(MASK); if (m && m[1].trim()) masks.add(m[1].trim()); }
  return masks;
}
export function redact(text, masks) {
  collectMasks(text, masks);
  let s = String(text).split('\n').filter((l) => !MASK.test(l)).join('\n');
  for (const v of [...masks].sort((a, b) => b.length - a.length)) s = s.split(v).join('***');
  return s;
}

// The round-walk rows of this tranche (WALK_ROWS: walk round's, or deploy dev's): its name, and its commit not yet on main (a row from a tranche
// already merged into main is stale, as closedRows has it). A failed run is recorded and can be run again.
export function deployRows(root, cfg, at = {}) {
  const onMain = onMainOf(root, at);
  return jsonl(readState(root, cfg.state_branch, DEPLOYS_FILE)).filter((r) => WALK_ROWS.includes(r.row) && r.tranche === cfg.tranche && !onMain(String(r.commit)));
}

// The round close (Bob, 4 Nov; BD-R1, Bob, 8 Nov): work runs in layers within rounds within
// tranches (PLN-1), and a round's walk belongs to its close, never between layers.
// The first round closes when every layer of the plan is closed (with the completion layer the copy
// opened under PD-12, its last use). A later round (rounds.mjs) closes when every layer it opened
// has merged and no flawed module waits in a map layer after its last; its walk ends it, and the
// walk's findings, recorded as found marks, open the next round. `plan` `close` (as the tranche
// holds it) makes the current round the last, closed now. Only at a round close is the round's walk
// owed or allowed; the tranche's end is its last round's close, then the release path (BD-R1).
export function roundClose(root, cfg, { ls, plan = cfg.plan, closed = [], ref, w }) {
  const top = Math.max(0, ...closed.map((r) => r.layer)) || null;
  // Under plan close the round after a walk is open while its items or the walk's found marks
  // are, so recording the findings starts no fresh run (cold review of C23: the tool-started run
  // would otherwise deploy again at the merge that records them).
  if (plan === 'close') {
    const items = w?.last ? openItems(completionItems(root, cfg, ref)).map((x) => x.id) : [];
    if (items.length || (w?.last && w.marks)) return { closed: false, why: `the last round (plan close) is open: ${[items.length ? `${items.join(', ')} open in ${cfg.completion_file}` : '', w.marks ? `${w.marks} found mark(s) of ${w.last.slug} unmet` : ''].filter(Boolean).join('; ')}` };
    return { closed: true, round: 'the last round (plan close)', layer: top };
  }
  // PD-25: under the direct flow a round closes once every module is settled (direct.mjs).
  if (directMode(cfg)) {
    let rs;
    try { rs = directRoundsAt(root, cfg); } catch (e) { return { closed: false, why: `the direct flow could not be read (${String(e.message || e).slice(0, 160)})` }; }
    if (rs.state === 'open' || rs.state === 'new') return { closed: false, why: `round ${rs.round} is open (the direct flow): ${rs.mods.length} module(s) not settled: ${rs.mods.slice(0, 8).join(', ')}${rs.mods.length > 8 ? ', ...' : ''}`, rounds: rs };
    return { closed: true, round: rs.round === 1 ? 'the first round' : `round ${rs.round}`, layer: null, rounds: rs };
  }
  if (!ls) return { closed: false, why: `there is no layer map (${cfg.layers_file}) and the plan is not close` };
  const open = ls.layers.filter((L) => !L.closed).map((L) => L.n);
  if (open.length) return { closed: false, why: `the first round is open: layer${open.length > 1 ? 's' : ''} ${open.join(', ')} not closed` };
  const rs = roundsAt(root, cfg, ref, w);
  const layer = Math.max(0, ...ls.layers.map((L) => L.n), ...rs.layers.map((L) => L.n)) || null;
  const name = (k) => (k === 1 ? 'the first round' : `round ${k}`);
  if (rs.state === 'layer' || rs.state === 'next' || rs.state === 'new') return { closed: false, why: roundLine(rs), rounds: rs };
  return { closed: true, round: name(rs.round), layer, rounds: rs };
}
// The rounds at `ref` (rounds.mjs roundState), the walk the latest deploy row's.
export function roundsAt(root, cfg, ref, w) {
  const layers = layersAt(root, cfg, ref);
