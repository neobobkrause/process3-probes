// The shared layer branch (design note "Shared Layer Branch", Bob, 5 Nov), the only flow since the
// merge train was removed (Bob, 6 Nov): process/config.json "merge_strategy" "layer" or absent.
//
// One layer's life:
//   layer open <n>     cuts layer/<n> from the tranche tip and lists the jobs that can start; ROOT
//                      starts them (job start cuts each job branch from layer/<n>, its draft PR into it).
//   layer publish <id> the job's: brings its branch up to the layer tip, refuses any file outside
//                      the module, runs the module's fast checks (job complete; the
//                      suite runs in CI's gate: AUD-7, PLT-4),
//                      and marks its PR into layer/<n> ready, so the gate runs on its tip. While the
//                      run goes it watches the state branch: a reschedule for the module halts the
//                      run at once, and it starts again on the new layer tip.
//   layer land <pr>    the merge tool's: a publish PR whose gate is green on its head merges into
//                      layer/<n>, with no combined re-test. Refused when the run behind it started
//                      before a provider's newest interface change. At the land the provider's
//                      interface (its exports, exports.mjs, and the Public / Provides section of its
//                      requirements file) is compared before and after: a change reschedules its
//                      users in the layer and leaves a provider notice for its users in later layers.
//   layer status <n>   each module's state: not started, working, published, rescheduled, complete, deferred.
//   layer merge <n>    when every module is complete or deferred, no reschedule outstanding and no
//                      publish open: layer/<n> into the tranche as one PR, with no further test run
//                      (the gate's layer trigger checks each module's evidence and runs no suite).
//   layer report <n>   the trial's measures.
// State: one file per event under layerflow/<n>/ on the state branch (layerbase.mjs flowFile).
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix } from 'node:path';
import { anyExportChange, exportChanges } from './exports.mjs';
import { deploys } from './deploycfg.mjs';
import { classifyTestChange } from './testdiff.mjs';
import { checkRun, comments as ghComments, createPR, findPR, gateRuns, getPR, markReady, openPRs, prsFromBranch, runArtifactRow, runState } from './github.mjs';
import { diffNames, ownPaths } from './gate.mjs';
import { generatedRows, isGenerated, specifiers } from './checks.mjs';
import { branchModule, entryFile, ledgerIds, originJobs, startBranch } from './ledger.mjs';
import { completionItems, openItems, parseCompletion } from './completion.mjs';
import { appendRow, metricsFile, rowsAt } from './metrics.mjs';
import { census, censusLines, openLayers } from './census.mjs';
import { landedFrom } from './landed.mjs';
import { FLOW_DIR, directKey, directMode, flowBase, flowFile, jobCfg, layerBranch, layerMode, layerName, layerOf, layerOfBranch, layersAt, roundLayerName, roundOf, safeName } from './layerbase.mjs';
import { deployRowsOf, findingsOf, flawedModules, roundLine, roundState, unplaced, walkHold } from './rounds.mjs';
import { answerFile, isSource, noticeFile, noticeKey, noticeRecords, readExports, readModules, sourcePaths, usersOf } from './notice.mjs';
import { fetchState, flushState, pendingWrites, readState, writeState } from './state.mjs';
import { pollMs } from './pace.mjs';
import { directAct, directLand, directLines, directRoundsAt, directView, readDirect } from './direct.mjs';
import { endLayerHolds, paidFor, readHolds } from './hold.mjs';
import { Fail, LEDGER_DIR, exists, fail, fetchBranch, git, isFound, isRecordOrLane, isRecordPath, jobCap, loadConfig, now, repoSlug, treeBlobs, underPath, unmetIds, withTemp } from './util.mjs';

const MINUTE = 60000;
export const LAND_TITLE = /^Merge layer PR (\d+)$/;
export const landTitle = (n) => `Merge layer PR ${n}`;
export const P3 = 'node .process/tool/p3.mjs';
// status.mjs's CLOSED_FILE, named here: status.mjs reads job.mjs, which reads the gate, which reads this file.
const CLOSED_FILE = 'layers/closed.jsonl';
const short = (s) => String(s || '').slice(0, 10);
const isAnc = (root, a, b) => !!a && !!b && git(['merge-base', '--is-ancestor', a, b], { cwd: root, allowFail: true }).code === 0; // exact in a shallow clone: util.git deepens until its no is the history's, or refuses
const rev = (root, r) => git(['rev-parse', r], { cwd: root });
const hasCommit = (root, c) => git(['cat-file', '-e', `${c}^{commit}`], { cwd: root, allowFail: true }).code === 0;
const minutes = (a, b) => Math.round(((Date.parse(b) - Date.parse(a)) / MINUTE) * 10) / 10;

export function needLayerMode(cfg, what) {
  if (!layerMode(cfg)) fail(`${what}: process/config.json's merge_strategy is ${JSON.stringify(cfg.merge_strategy)}; the shared layer branch is the only flow ("layer", or the key left out)`);
}
const layerNum = (n) => (/^\d+$/.test(String(n)) ? Number(n) : fail(`the layer's number, not ${JSON.stringify(n)}`));

// ---- the interface signal -------------------------------------------------------------------

// The Public / Provides section of a requirements file: the lines under `### Provides` inside
// `## Public`, up to the next heading of level 3 or less; whitespace collapsed, blank lines and
// unmet marks `*(not yet met ...)*` left out (striking a mark records that a requirement is met; it
// is the job's progress, not a change of what the module offers). null: no such section.
const MARK = /\s*\*\(not yet met[^)]*\)\*/gi;
export function providesText(md) {
  const raw = providesRaw(md, true);
  return raw;
}
function providesRaw(md, norm = false) {
  if (md === null || md === undefined) return null;
  let pub = false;
  let prov = false;
  let found = false;
  const out = [];
  for (const l of String(md).split('\n')) {
    const h = l.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (h && h[1].length <= 3) {
      const t = h[2].toLowerCase();
      if (h[1].length <= 2) { pub = /^public\b/.test(t); prov = false; } else { prov = pub && /^provides\b/.test(t); if (prov) found = true; }
      continue;
    }
    if (prov) { const x = norm ? l.replace(MARK, '').replace(/\s+/g, ' ').trim() : l; if (x) out.push(x); }
  }
  return found ? out.join('\n') : null;
}

const entryAt = (root, ref, id) => { const t = git(['show', `${ref}:${entryFile(id)}`], { cwd: root, allowFail: true }); try { return t.code === 0 ? JSON.parse(t.stdout) : null; } catch { return null; } };
const textAt = (root, ref, f) => (f && exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null);

// Whether a module's interface changed from `before` to `after` (Bob, 6 Nov, R8 and "c": only real
// interface changes reschedule; publication's land in layer 8 rescheduled 12 users, most COMPLETE).
// triggers:
//   exports         an exported name added, removed or renamed, or an export's kind changed; a
//                   changed parameter list alone is recorded, not a trigger;
//   provides-test   a test naming a Public / Provides requirement (or a fixture one names) changed
//                   (testdiff.mjs);
//   exports-unread  the exports could not be read: the land refuses it before the merge (layerLand);
//                   a land already merged counts it as breaking.
// class: breaking (an export removed, renamed or of another kind, a test's existing expectation
// changed, unread) reschedules each user for a job; additive (only new exports, tests that only add
// keys) retests each user by its gate alone. provides (a changed Public / Provides text) is a notice
// to the users, never a trigger. triggers_old: what the rule before R8 fired (exports with any
// signature change, provides-text, a provides test that names an id, exports-unread), kept so the
// trial counts the re-tests avoided. Nothing of its own source and not its requirements file
// changed: unchanged, read no further.
export function interfaceChange(root, cfg, id, before, after) {
  const e = entryAt(root, after, id) || entryAt(root, before, id);
  if (!e) return { changed: false, exports: null, provides: null, triggers: [], triggers_old: [], why: `no ledger entry for ${id}` };
  const files = diffNames(root, before, after);
  const src = files.filter((f) => isSource(cfg, e, f));
  const req = !!e.requirements && files.includes(e.requirements);
  const out = { changed: false, exports: null, provides: null };
  if (req) {
    const [a, b] = [providesText(textAt(root, before, e.requirements)), providesText(textAt(root, after, e.requirements))];
    if (a !== b) out.provides = { before: a, after: b };
  }
  let anyExport = false;
  if (src.length) {
    try {
      const x = exportChanges(root, before, after, { isProviderSource: (f) => isSource(cfg, e, f), inProvider: (f) => [...(e.paths || []), ...(e.tests || [])].some((p) => underPath(f, p)), providerPaths: sourcePaths(cfg, e) });
      anyExport = anyExportChange(x);
      if (anyExport) out.exports = { ...x, kinds: x.changed.filter((c) => kindOf(c.before) !== kindOf(c.after)).map((c) => c.name), signatures: x.changed.filter((c) => kindOf(c.before) === kindOf(c.after)).map((c) => c.name) };
    } catch (err) { out.unread = String(err.message || err).slice(0, 300); }
  }
  // A return shape is not in the exports (BOB's finding, bob-249, 6 Nov: a provider answered
  // {materials: [...]} for a list, its exports unchanged, and screens-publish read it wrongly): a
  // changed test of the provider that names one of its Public / Provides requirements (read at
  // after, else before) counts when what it asserts changed.
  const tests = files.filter((f) => (e.tests || []).some((p) => underPath(f, p)));
  if (tests.length) {
    // The ids of both sides: a test of a Provides requirement renamed or dropped is examined too
    // (cold review of R8: R2 renamed R4 with r2.test.mjs deleted read as additive).
    const idsBefore = providesIds(textAt(root, before, e.requirements)) || [];
    const ids = [...new Set([...(providesIds(textAt(root, after, e.requirements)) || []), ...idsBefore])];
    const names = (t) => ids.some((r) => new RegExp(`(^|[^\\w.])${r.replace(/\./g, '\\.')}(?![\\w]|\\.\\w)`).test(t));
    const hit = ids.length ? tests.filter((f) => names(`${textAt(root, before, f) || ''}\n${textAt(root, after, f) || ''}`)) : [];
    // A fixture (a file under its tests that is not itself a test: rows, JSON, a snapshot) that a test
    // naming a Provides requirement refers to by name counts as that test (cold review of PR 193).
    const naming = ids.length ? git(['ls-tree', '-r', '--name-only', after, '--', ...(e.tests || [])], { cwd: root, allowFail: true }).stdout.split('\n').filter((f) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(f)).map((f) => textAt(root, after, f) || '').filter(names) : [];
    const fixtures = tests.filter((f) => !hit.includes(f) && !/\.(test|spec)\.[cm]?[jt]sx?$/.test(f) && naming.some((t) => t.includes(f.split('/').pop())));
    const examined = [...hit, ...fixtures].sort();
    if (hit.length) out.provides_tests_old = hit.sort();
    if (examined.length) {
      out.provides_tests_named = examined;
      // A new file that replaces a deleted one naming a Provides requirement they share is compared
      // with that file, as a rename would be; a new file replacing none only adds assertions.
      const gone = examined.filter((f) => textAt(root, after, f) === null && textAt(root, before, f) !== null);
      const nameRe = (r) => new RegExp(`(^|[^\\w.])${r.replace(/\./g, '\\.')}(?![\\w]|\\.\\w)`);
      const shared = (x, y) => ids.some((r) => nameRe(r).test(x || '') && nameRe(r).test(y || ''));
      const replaced = new Map(); // added file -> the deleted one it replaces
      for (const f of examined) {
        const a0 = textAt(root, after, f);
        if (textAt(root, before, f) !== null || a0 === null) continue;
        const was = gone.find((g) => ![...replaced.values()].includes(g) && shared(textAt(root, before, g), a0));
