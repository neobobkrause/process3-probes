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
        if (was) replaced.set(f, was);
      }
      const asserted = examined.map((f) => {
        if ([...replaced.values()].includes(f)) return { file: f, class: 'none', why: `replaced by ${[...replaced].find(([, g]) => g === f)[0]}` };
        if (replaced.has(f)) { const c = classifyTestChange(textAt(root, before, replaced.get(f)), textAt(root, after, f), ids); return { file: f, ...c, why: `replaces ${replaced.get(f)}: ${c.why}` }; }
        const c = classifyTestChange(textAt(root, before, f), textAt(root, after, f), ids);
        // A new file is additive only when every requirement it names is new, or the provider's
        // own source did not change in this land (the coordinator's ruling, 6 Nov, under Bob's "c":
        // additive means nothing an existing user relies on changed). One naming an existing
        // Provides requirement while its implementation changed may assert a changed answer.
        if (textAt(root, before, f) === null && c.class === 'additive' && src.length) {
          const old = idsBefore.filter((r) => nameRe(r).test(textAt(root, after, f) || ''));
          if (old.length) return { file: f, class: 'breaking', why: `added, naming ${old.join(', ')} (Provides before this land) while ${id}'s source changed: it may assert a changed answer` };
        }
        return { file: f, ...c };
      });
      out.provides_test_changes = asserted;
      const real = asserted.filter((x) => x.class !== 'none').map((x) => x.file);
      if (real.length) out.provides_tests = real;
    }
  }
  // Bob's refinement "c" (6 Nov): breaking (an export removed, renamed or of another kind; a
  // Provides test whose existing expected values or keys changed) reschedules each user for a job;
  // additive (only new exports, or Provides tests that only add keys or fields) retests each user
  // through the gate alone (layer retest), a red retest falling back to a job.
  const ex = out.exports;
  const exportsBreaking = !!ex && (ex.removed.length || ex.kinds.length) > 0;
  const exportsAdditive = !!ex && ex.added.length > 0;
  const testsBreaking = (out.provides_test_changes || []).some((x) => x.class === 'breaking');
  const testsAdditive = (out.provides_test_changes || []).some((x) => x.class === 'additive');
  out.triggers = [...(exportsBreaking || exportsAdditive ? ['exports'] : []), ...(out.provides_tests ? ['provides-test'] : []), ...(out.unread ? ['exports-unread'] : [])];
  out.triggers_old = [...(anyExport ? ['exports'] : []), ...(out.provides ? ['provides-text'] : []), ...(out.provides_tests_old ? ['provides-test'] : []), ...(out.unread ? ['exports-unread'] : [])];
  out.class = exportsBreaking || testsBreaking || out.unread ? 'breaking' : exportsAdditive || testsAdditive ? 'additive' : 'none';
  // A change confined to the provider's own test files (its source, requirements and exports
  // unchanged) is no interface change for its users (the coordinator, 7 Nov, C11: copy PR 727 changed
  // only a provider module's test/m/filings/fixture.mjs and rescheduled action-plans and escalation). Only a
  // user whose code or tests import a changed test file is touched, and that one as breaking: the
  // land reads which (testImporters). The verdict the tests alone would give is kept (by_tests).
  const own = files.filter((f) => f !== entryFile(id) && f !== metricsFile(id) && !isRecordPath(cfg, f));
  const testFiles = own.filter((f) => (e.tests || []).some((p) => underPath(f, p)));
  if (!src.length && !out.exports && !out.unread && testFiles.length && testFiles.length === own.length) {
    out.test_only = { files: testFiles, by_tests: out.class };
    out.class = 'none';
  }
  out.source_changed = src.length > 0;
  out.changed = out.class !== 'none';
  return out;
}
// The users whose own code or tests import one of files (the provider's changed test files), at ref:
// a relative import resolved from the importing file, or the path written out whole.
// provTests: the provider's test roots; a file there that imports a changed one (a shared helper
// re-exporting a fixture) counts as changed too, followed until nothing new (cold review of C11).
const CODE_EXT = ['', '.mjs', '.js', '.cjs', '.ts', '.mts', '.cts', '.tsx', '.jsx', '/index.mjs', '/index.js', '/index.ts'];
const codeFiles = (root, ref, roots) => (roots.length ? git(['ls-tree', '-r', '--name-only', '-z', ref, '--', ...roots], { cwd: root, allowFail: true }).stdout.split('\0').filter((f) => /\.(m|c)?(j|t)sx?$/.test(f)) : []);
function importsAny(f, t, want) {
  const noExt = (x) => x.replace(/\.(m|c)?(j|t)sx?$/, '');
  if ([...want].some((x) => t.includes(x) || t.includes(noExt(x)))) return true;
  return specifiers(t).some(({ spec }) => {
    if (!spec.startsWith('.')) return false;
    const base = posix.normalize(posix.join(posix.dirname(f), spec));
    // A TypeScript import names the .js it compiles to: the .ts beside it is meant.
    return [base, base.replace(/\.js$/, '.ts'), base.replace(/\.mjs$/, '.mts')].some((b) => CODE_EXT.some((x) => want.has(b + x)));
  });
}
export function testImporters(root, cfg, ref, users, files, { provTests = [] } = {}) {
  if (!files.length || !users.length) return [];
  const want = new Set(files);
  const helpers = codeFiles(root, ref, provTests);
  for (let grew = true; grew;) {
    grew = false;
    for (const f of helpers) if (!want.has(f) && importsAny(f, textAt(root, ref, f) || '', want)) { want.add(f); grew = true; }
  }
  return users.filter((u) => {
    const e = entryAt(root, ref, u);
    return codeFiles(root, ref, [...(e?.paths || []), ...(e?.tests || [])]).some((f) => importsAny(f, textAt(root, ref, f) || '', want));
  });
}
// An export's kind from its signature (exports.mjs): function, class, value, external, method, getter...
export const kindOf = (sig) => { const t = String(sig ?? ''); return /^function\b/.test(t) ? 'function' : /^static \(/.test(t) ? 'static method' : /^\(/.test(t) ? 'method' : t; };
// The requirement ids the Public / Provides section names (**R<id>**), or null without a section.
export function providesIds(md) {
  const t = providesRaw(md);
  return t === null ? null : [...new Set([...t.matchAll(/\*\*(R[\w.-]+?)\*\*/g)].map((m) => m[1]))];
}
export function interfaceText(ic) {
  const parts = [];
  if (ic.exports) {
    const x = ic.exports;
    const kinds = new Set(x.kinds || x.changed.map((c) => c.name));
    if (x.removed.length) parts.push(`removed ${x.removed.join(', ')}`);
    if (x.changed.some((c) => kinds.has(c.name))) parts.push(`changed the kind of ${x.changed.filter((c) => kinds.has(c.name)).map((c) => `${c.name} ${c.before} -> ${c.after}`).join(', ')}`);
    if (x.added.length) parts.push(`added ${x.added.join(', ')}`);
    if (x.changed.some((c) => !kinds.has(c.name))) parts.push(`changed the parameters of ${x.changed.filter((c) => !kinds.has(c.name)).map((c) => `${c.name} ${c.before} -> ${c.after}`).join(', ')} (not a trigger)`);
  }
  if (ic.provides) parts.push('its Public / Provides text changed (a notice, not a trigger)');
  if (ic.test_only) {
    const imp = ic.test_only.importers || [];
    const forImp = imp.length ? `${imp.join(', ')} import${imp.length === 1 ? 's' : ''} a changed test file: breaking for ${imp.length === 1 ? 'it' : 'them'}` : '';
    // After an earlier source land in the layer (PD-15): the tests' verdict, at most additive.
    if (ic.test_only.earlier_source) {
      const v = ic.test_only.capped ? `its tests alone read ${ic.test_only.by_tests}, capped at additive since this land changed neither source nor exports (PD-15): each user is retested by its gate alone` : ic.test_only.by_tests === 'additive' ? 'additive: each user is retested by its gate alone' : ic.test_only.by_tests === 'breaking' ? 'breaking by its tests alone: each user re-runs in a job' : 'no interface change for its users';
      parts.push(`only its own tests changed (${ic.test_only.files.join(', ')}) after an earlier land changed its source: ${v}${forImp ? `; but ${forImp}` : ''}`);
      return parts.join('; ');
    }
    parts.push(`only its own tests changed (${ic.test_only.files.join(', ')}): no interface change for its users${forImp ? `, but ${forImp} only` : ''}`);
    return parts.join('; ');
  }
  if (ic.provides_tests) parts.push(`its tests of Public / Provides requirements changed what they assert (${(ic.provides_test_changes || []).filter((x) => x.class !== 'none').map((x) => `${x.file}: ${x.class}, ${x.why}`).join(', ') || ic.provides_tests.join(', ')}), which may mean a changed answer shape`);
  if (ic.class && ic.class !== 'none') parts.push(ic.class === 'additive' ? 'additive: each user is retested by its gate alone' : 'breaking: each user re-runs in a job');
  if (ic.unread) parts.push(`its exports could not be read (${ic.unread})`);
  return parts.join('; ') || 'no change';
}

// ---- the state branch's rows ----------------------------------------------------------------

// Every row under layerflow/<n>/ as the fetched state branch holds it.
export function flowRows(root, sb, n) {
  // One ls-tree and one cat-file --batch (C50: the copy's idle check read every row with a git show
  // of its own, thousands a command); one git show each only when the batch fails.
  const ref = `refs/remotes/origin/${sb}`;
  const got = treeBlobs(root, ref, [`${FLOW_DIR}/${n}/`]);
  const r = got ? null : git(['ls-tree', '-r', '--name-only', '-z', ref, '--', `${FLOW_DIR}/${n}/`], { cwd: root, allowFail: true });
  const files = got ? [...got.keys()].filter((f) => f.endsWith('.json')) : r.code === 0 ? r.stdout.split('\0').filter((f) => f.endsWith('.json')) : [];
  const rows = files.flatMap((f) => { try { return [JSON.parse(got ? got.get(f) : readState(root, sb, f))]; } catch { return []; } });
  const by = (k) => rows.filter((x) => x.row === k).sort((a, b) => String(a.at).localeCompare(String(b.at)));
  // A reschedule cleared for its user by a recorded ruling (layer clear) is outstanding no more.
  const clears = by('clear');
  const cleared = (r) => clears.some((c) => c.user === r.user && c.provider === r.provider && c.provider_land === r.provider_land);
  return { open: by('open')[0] || null, merged: by('merged')[0] || null, runs: by('run'), lands: by('land'), reschedules: by('reschedule').filter((r) => !cleared(r)), reschedules_all: by('reschedule'), clears, retests: by('retest'), retest_refusals: by('retest-refused'), starts: by('start'), syncs: by('sync'), tests: by('test'), gates: by('gate'), joins: by('join'), companions: by('companion'), items: by('items'), earlies: by('early') };
}
// One file per event, added and never edited: an existing file is the same event, kept.
function addFiles(w, files) {
  for (const [path, row] of files) {
    const p = join(w, path);
    if (existsSync(p)) continue;
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, JSON.stringify(row, null, 2) + '\n');
  }
}
export const writeRows = (root, sb, msg, files) => writeState(root, sb, msg, (w) => (addFiles(w, files), {}));

// A reschedule is outstanding until a land of its user holds the provider's land.
export const outstanding = (reschedules, lands, user, anc) => reschedules.filter((r) => r.user === user && !lands.some((l) => l.module === user && anc(r.provider_land, l.head)));

// ---- module states --------------------------------------------------------------------------

// Each module of the layer: { id, state, why, pr, lands, outstanding, marks }. state:
//   deferred     BLOCKED at the layer tip: it does not hold the merge (PLN-4);
//   rescheduled  a provider's interface changed since its last green run: it re-runs;
//   published    its PR into the layer is ready (its gate on its tip decides the land);
//   working      its job is open (a draft PR into the layer);
//   complete     its last publish landed, no reschedule outstanding, nothing open; or nothing to
//                do (COMPLETE before the layer opened, no unmet requirement mark);
//   not started  no job yet: one can start; a module that joined the layer from a layer behind it
//                (layer join: the coordinator's ruling, 6 Nov) is not started until it lands here.
export function moduleStates({ mods, entries, marks, prs, lands, reschedules, anc, joins = new Map(), earlies = new Map(), items = new Map(), itemIds = new Map(), owed = new Set(), itemWord = 'completion item(s)' }) {
  // A module's item ids, from the items themselves: their words may hold '; ' and ': ' (copy, 8 Nov:
  // interface-assets read "CR2-3, CR2-21, today mk-updband is drawn ..."); split only without them.
  const idsOf = (id) => (itemIds.get(id) || items.get(id).split('; ').map((x) => x.split(': ')[0])).join(', ');
  return mods.map((id) => {
    const e = entries.get(id);
    const pr = (prs || []).find((p) => p.module === id) || null;
    const mine = lands.filter((l) => l.module === id);
    const out = outstanding(reschedules, lands, id, anc);
    const m = marks.get(id) || [];
    const j = joins.get(id) || null;
    const base = { id, pr: pr?.number ?? null, lands: mine.length, outstanding: out, marks: m, entry_state: e?.status?.state ?? null, ...(j ? { join: j } : {}) };
    if (e?.status?.state === 'BLOCKED') return { ...base, state: 'deferred', why: `BLOCKED: ${e.status.reason || 'no reason'}` };
    // An item joined after its job started (PD-14 (i)): it runs again with the item's words, ahead
    // of a reschedule (a re-test's job has no item words, and its land would tick the item: cold
    // review of (i)); its job starts on the layer tip, so it holds the provider's land too.
    if (owed.has(id) && items.has(id) && !pr) return { ...base, state: 'not started', item: items.get(id), why: `completion item(s) joined after its last job started: ${idsOf(id)}${out.length ? `; it re-runs against ${[...new Set(out.map((r) => r.provider))].join(', ')}'s new interface too` : ''}` };
    if (out.length) return { ...base, state: 'rescheduled', why: `re-runs against ${[...new Set(out.map((r) => r.provider))].join(', ')}'s new interface` };
    if (pr && !pr.draft) return { ...base, state: 'published', why: `PR ${pr.number} ready into the layer` };
    if (pr) return { ...base, state: 'working', why: `PR ${pr.number}, a draft` };
    if (mine.length) return { ...base, state: 'complete', why: `landed ${mine.length} time(s), last PR ${mine.at(-1).pr}` };
    // Started early (R14) and no pull request into the layer: its start did not finish, or its PR
    // closed; job start resumes it as any unfinished start (cold review of R14).
    if (earlies.has(id) && !j) return { ...base, state: 'not started', early: earlies.get(id).from, why: `started early while layer ${earlies.get(id).from} was open; no pull request into the layer: job start resumes it` };
    // A completion layer's module, its own or joined (C33, PD-14), or a round layer's (BD-R1): its
    // open items, or its found marks, are its work.
    if (items.has(id)) return { ...base, state: 'not started', item: items.get(id), why: `${itemWord} ${idsOf(id)}${j ? `, joined from ${j.from === null ? 'no layer' : `layer ${j.from}`}` : ''}` };
    if (j) return { ...base, state: 'not started', why: `joined from ${j.from === null ? 'no layer' : `layer ${j.from}`}: ${j.why}` };
    if (e?.status?.state === 'COMPLETE' && !m.length) return { ...base, state: 'complete', why: 'COMPLETE before the layer opened, no unmet mark' };
    return { ...base, state: 'not started', why: e ? `${e.status?.state}${m.length ? `, unmet ${m.join(', ')}` : ''}` : 'no ledger entry' };
  });
}
export const DONE = ['complete', 'deferred'];

// ---- the order within a layer (R10) ---------------------------------------------------------

// Bob, 6 Nov ~15:35: start a layer's jobs earliest in the total (dependency) order first, so an
// interface change is found before its users start or test. providers: each module's providers in
// the layer, from the modules file (its uses), else its entry's.
export function layerProviders(mods, modules, entries) {
  const named = new Map((modules || []).filter((m) => m?.id).map((m) => [m.id, m.uses || []]));
  const inLayer = new Set(mods);
  return new Map(mods.map((id) => [id, [...new Set(named.get(id) || entries.get(id)?.uses || [])].filter((u) => u !== id && inLayer.has(u))]));
}
// The layer's modules, each after its providers in the layer, the layer map's order kept otherwise;
// a cycle's modules follow in the map's order.
export function totalOrder(mods, providers) {
  const out = [];
  const done = new Set();
  let moved = true;
  while (moved) {
    moved = false;
    for (const id of mods) if (!done.has(id) && (providers.get(id) || []).every((p) => done.has(p))) { out.push(id); done.add(id); moved = true; }
  }
  return [...out, ...mods.filter((id) => !done.has(id))];
}
// A provider has landed when its land is on the layer (a land row), or it was BLOCKED (deferred: it
// lands nothing here), or COMPLETE with no unmet mark at the layer tip (its interface already there;
// one with marks is about to be reopened: cold review of PR 196).
export const landedProvider = (p, lands, entries, marks = new Map()) => lands.some((l) => l.module === p) || entries.get(p)?.status?.state === 'BLOCKED' || (entries.get(p)?.status?.state === 'COMPLETE' && !(marks.get(p) || []).length);
// The in-layer providers of id not yet landed on layer/<n>, read from origin (job start's early mark).
export function earlyProviders(root, cfg, n, id, ref) {
  const L = layersAt(root, cfg, ref).find((x) => x.n === n);
  if (!L) return [];
  const fr = flowRows(root, cfg.state_branch, n);
  // Joined modules count, as readLayer counts them (R12; cold review of PR 191).
  const mods = [...new Set([...L.mods, ...fr.joins.map((j) => j.module)])];
  const entries = new Map(mods.map((m) => [m, entryAt(root, ref, m) || entryAt(root, `refs/remotes/origin/${cfg.tranche}`, m)]));
  const prov = layerProviders(mods, readModules(root, cfg, ref), entries);
  const lands = fr.lands;
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  const marksOf = (p) => unmetIds(textAt(root, ref, entries.get(p)?.requirements || `${dir}/${p}.md`) || '').filter((x) => !isFound(x));
  // As layer jobs reads it: a provider BLOCKED at its job branch's head is deferred (readLayer's PR-head read).
  const blockedOnBranch = (p) => {
    const r = git(['ls-remote', '--heads', 'origin', `refs/heads/job/${p}`, `refs/heads/job/${p}-*`], { cwd: root, allowFail: true });
    return r.code === 0 && r.stdout.split('\n').filter(Boolean).some((l) => { const [sha, h] = l.split('\t'); const name = h.replace('refs/heads/', ''); if (!hasCommit(root, sha)) fetchBranch(root, name, { allowFail: true }); return hasCommit(root, sha) && entryAt(root, sha, p)?.status?.state === 'BLOCKED'; });
  };
  const marks = new Map((prov.get(id) || []).map((p) => [p, marksOf(p)]));
  return (prov.get(id) || []).filter((p) => !landedProvider(p, lands, entries, marks) && !blockedOnBranch(p));
}
export const mergeReady = (states) => states.every((s) => DONE.includes(s.state));

// What BOB may start (the tool lists, BOB starts; Bob, 5 Nov): each module not started, and each
// complete one a reschedule reopened (its PR landed, so a new attempt).
// A listed job whose in-layer provider has not landed: listed after the rest, and startable now as an
// early start (R10, Bob 6 Nov). Worded so it is not read as a wait (C25: on the copy's layer 11 BOB
// held such jobs 20-108 min, "waiting on providers still in flight", with slots empty).
// Whether a listed act takes a job session (a slot under the cap): every job start does; an additive
// change's `layer retest` runs in CI with none (C25: the idle check counted it as a slot's work).
export const needsSlot = (j) => !j?.additive;
// A layer's starts, and for a completion layer the joins its open items owe (C35).
// A module with items to join is listed by its join alone: its job starts after, with their words
// (PD-14 (i): a job started first would run without them, and again after the join).
export const startableOf = (x) => { const j = new Set((x.joinable || []).map((y) => y.id)); return [...startable(x.states).filter((y) => !j.has(y.id)), ...(x.joinable || [])]; };
// The open items of completion_file whose module the layer does not hold, one join act per module.
export function joinableItems(root, cfg, tr, mods, n, known = new Set()) {
  let c = null;
  try { c = completionItems(root, cfg, tr); } catch { c = null; }
  const have = new Set(mods);
  // A module with no ledger entry has nothing to join: the item is BOB's to fix (cold review of C35).
  const ids = ledgerIds(root, tr);
  // Not yet in the layer: its module is not (C35), or its module is and the item came after (PD-14 (i)).
  const due = openItems(c).filter((x) => !x.whole && !x.malformed && (!have.has(x.target) || !known.has(x.id)) && ids.has(x.target));
  return [...new Set(due.map((x) => x.target))].map((id) => {
    const its = due.filter((x) => x.target === id);
    const why = its.map((x) => `${x.id}: ${x.what}`).join('; ');
    return { id, join: true, ...(have.has(id) ? { more: true } : {}), items: its.map((x) => x.id), cmd: `${P3} layer join ${id} --why ${JSON.stringify(why.length > 200 ? `${its.map((x) => x.id).join(', ')} (${c.file})` : why)}, then ${P3} layer jobs ${n} and its job start` };
  });
}
export const afterNote = (after) => `   (${after.join(', ')} not landed yet: start it now on a free slot, this plain job start, no --early (R10); only a recorded hold waits)`;
export function startable(states) {
  const list = states.flatMap((s) => {
    if (s.state === 'not started' && s.item) return [{ id: s.id, cmd: `${P3} job start ${s.id} --sessions <file>${s.entry_state === 'COMPLETE' ? ` --reopen ${JSON.stringify(s.item)}` : ''}` }];
    if (s.state === 'not started' && s.join) return [{ id: s.id, cmd: `${P3} job start ${s.id} --sessions <file>${s.entry_state === 'COMPLETE' ? ` --reopen ${JSON.stringify(s.join.why)}` : ''}` }];
    if (s.state === 'not started') return [{ id: s.id, cmd: `${P3} job start ${s.id} --sessions <file>${s.marks.length && s.why.startsWith('COMPLETE') ? ` --reopen "meet the unmet requirement marks ${s.marks.join(', ')}"` : ''}` }];
    if (s.state === 'rescheduled' && s.pr === null) {
      const why = [...new Set(s.outstanding.map((r) => `${r.provider} (land ${short(r.provider_land)})`))].join(', ');
      // A module that never ran (OPEN, never COMPLETE) starts plainly: --reopen is for a COMPLETE one
      // (coordinator, 6 Nov 16:03: publish-schedule, project-stage and case-account were refused).
      if (s.entry_state && s.entry_state !== 'COMPLETE') return [{ id: s.id, cmd: `${P3} job start ${s.id} --sessions <file>` }];
      const job = `${P3} job start ${s.id} --sessions <file> --reopen "re-test against the new interface of ${why}"`;
      // With no unmet mark, CI can re-test it with no job session (layer retest): the way for an
      // additive change (Bob's "c"), offered beside the job for a breaking one.
      if (s.marks.length) return [{ id: s.id, cmd: job }];
      const additive = !s.retest_refused && s.outstanding.every((r) => r.class === 'additive');
      return [{ id: s.id, cmd: additive ? `${P3} layer retest ${s.id}` : job, ...(additive ? { job, additive: true } : {}) }];
    }
    return [];
  });
  // R10: in the layer's total order (the states' own), those with an in-layer provider not yet
  // landed after the rest, each marked "after <provider>".
  const mark = (x) => { const after = states.find((s) => s.id === x.id)?.after || []; return after.length ? { ...x, after } : x; };
  const all = list.map(mark);
  return [...all.filter((x) => !x.after), ...all.filter((x) => x.after)];
}

// ---- reading a layer ------------------------------------------------------------------------

// The reads of status, layer jobs and the idle check: a clone's copy this recent serves (C18).
const READ_MS = 30e3;
function fetchLayer(root, cfg, n) {
  fetchBranch(root, cfg.tranche, { allowFail: true });
  fetchBranch(root, layerBranch(n), { allowFail: true });
  fetchState(root, cfg.state_branch, { fresh: true });
}
const layerRef = (n) => `refs/remotes/origin/${layerBranch(n)}`;

export function readLayer(root, cfg, n, { io = {}, slug = null } = {}) {
  const ref = layerRef(n);
  if (git(['rev-parse', '-q', '--verify', ref], { cwd: root, allowFail: true }).code !== 0) fail(`no ${layerBranch(n)} on origin: open it first (${P3} layer open ${n})`);
  const layers = layersAt(root, cfg, ref);
  const L = layers.find((x) => x.n === n) || fail(`layer ${n} is not in ${cfg.layers_file} on ${layerBranch(n)}`);
  const rows = flowRows(root, cfg.state_branch, n);
  // The layer's modules and those that joined it from a layer behind (layer join).
  const joins = new Map(rows.joins.map((j) => [j.module, j]));
  const mods = [...L.mods, ...[...joins.keys()].filter((id) => !L.mods.includes(id))];
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  // An entry the layer branch lacks is read from the tranche, the ledger's home (copy, 6 Nov: layer/8
  // was cut before PR 638 added four entries): its job starts from it (job start) and carries it on.
  const home = `refs/remotes/origin/${cfg.tranche}`;
  const entries = new Map(mods.map((id) => [id, entryAt(root, ref, id) || entryAt(root, home, id)]));
  const reqOf = (id) => entries.get(id)?.requirements || `${dir}/${id}.md`;
  const marks = new Map(mods.map((id) => [id, unmetIds(textAt(root, ref, reqOf(id)) ?? textAt(root, home, reqOf(id)) ?? '').filter((x) => !isFound(x))]));
  const list = (io.openPRs || openPRs)(slug, layerBranch(n));
  if (list === null) fail(`GitHub unreadable: the open pull requests into ${layerBranch(n)} are not known`);
  // The tranche's ids too: a module whose entry only the tranche holds has its job PR named by it.
  const ids = new Set([...ledgerIds(root, ref), ...ledgerIds(root, home)]);
  const prs = list.map((p) => ({ number: p.number, draft: !!p.draft, head: p.head?.sha, ref: p.head?.ref, module: branchModule(p.head?.ref, ids) }));
  // A job that blocks commits BLOCKED on its own branch, not on the layer (copy, 6 Nov: corpus-export,
  // BLOCKED on rows owed to layer 11, showed as working and its draft PR held the layer merge): the
  // entry at its open PR's head counts when it reads BLOCKED, and that PR holds the merge no longer.
  const blockedOn = new Map();
  for (const p of prs.filter((x) => x.module && mods.includes(x.module) && x.head)) {
    if (git(['cat-file', '-e', `${p.head}^{commit}`], { cwd: root, allowFail: true }).code !== 0 && p.ref) fetchBranch(root, p.ref, { allowFail: true });
    const e = entryAt(root, p.head, p.module);
    if (e?.status?.state === 'BLOCKED') { entries.set(p.module, e); blockedOn.set(p.module, p.number); }
  }
  // A module deferred by its PR head's BLOCKED whose newest gate run on that head passed its suite has
  // its work done, BLOCKED only on a process finding (copy, 6 Nov: layer 8's 658-661 on the old tool's
  // ledger finding): a merge then would drop finished work (layerMerge refuses; layer status says so).
  // Any run on that head of the module's whole suite that passed (stricter than layerCover, which takes
  // base-red as the land does; this only holds a merge, the safe side): a later
  // row never turns it off; a read that fails is unknown, which holds the merge too (cold review of
  // PR 201).
  const doneWork = new Map();
  const whole = (r, id) => r?.suite === 'pass' && r.trigger === 'code' && Array.isArray(r.scope) && r.scope.includes(id) && !(Array.isArray(r.requirements_only) && r.requirements_only.some((x) => x?.module === id));
  for (const [id, k] of blockedOn) {
    const pr = prs.find((q) => q.number === k);
    let runs = null;
    try { const c = (io.comments || ghComments)(slug, k); runs = Array.isArray(c) ? gateRuns(c).filter((r) => r.sha === pr.head) : null; } catch { runs = null; }
    if (runs === null) doneWork.set(id, { pr: k, unknown: true });
    else if (runs.some((r) => whole(r, id))) doneWork.set(id, { pr: k });
  }
  const anc = (a, b) => isAnc(root, a, b);
  // A completion layer's items, or a round layer's found marks (BD-R1): its modules' reopen words.
  const work = L.completion || L.round;
  let states = moduleStates({ mods, joins, items: itemReopen(work, rows.joins, rows.items), itemIds: itemIdMap(work, rows.joins, rows.items), itemWord: L.round ? 'found mark(s)' : 'completion item(s)', owed: new Set(mods.filter((id) => itemsOwed(rows, id).length)), earlies: new Map(rows.earlies.map((r) => [r.module, r])), entries, marks, prs, lands: rows.lands, reschedules: rows.reschedules, anc })
    .map((x) => (x.state === 'deferred' && blockedOn.has(x.id) ? { ...x, why: `${x.why} (on PR ${blockedOn.get(x.id)}'s head)`, ...(doneWork.has(x.id) ? { done_work: doneWork.get(x.id).pr, ...(doneWork.get(x.id).unknown ? { done_unknown: true } : {}) } : {}) } : x))
    // A retest refused since its newest outstanding reschedule: a job re-tests it.
    .map((x) => (x.outstanding?.length && (rows.retest_refusals || []).some((r) => r.module === x.id && String(r.at) >= String(x.outstanding.map((o) => o.at).sort().at(-1))) ? { ...x, retest_refused: true } : x));
  // R10: the states in the layer's total order, each with the in-layer providers not yet landed.
  const providers = layerProviders(mods, readModules(root, cfg, ref), entries);
  const order = totalOrder(mods, providers);
  const byId = new Map(states.map((x) => [x.id, x]));
  states.splice(0, states.length, ...order.map((id) => ({ ...byId.get(id), after: (providers.get(id) || []).filter((p) => !landedProvider(p, rows.lands, entries, marks)) })));
  // PD-19: a companion is named by its dependent jobs and their why (its reopen words, its brief).
  // PD-19b: no land order between them; they land in the same layer, in any order.
  states.splice(0, states.length, ...states.map((x) => companionState(root, rows, x)));
  // The open PRs that hold the merge: all but those of a module deferred by its PR head's BLOCKED.
  const holding = prs.filter((p) => !(blockedOn.has(p.module) && blockedOn.get(p.module) === p.number));
  // An open item of completion_file the completion layer does not hold (added after its open): its
  // act is the join (PD-14), then its job; listed beside the layer's starts (C35). A module already
  // in the layer joins its new items the same way (PD-14 (i)).
  const joinable = L.completion ? joinableItems(root, cfg, `refs/remotes/origin/${cfg.tranche}`, mods, n, new Set(layerItems(L.completion, rows.joins, rows.items).map((x) => x.id))) : [];
  return { n, ref, mods, layers, rows, entries, prs, holding, states, order, providers, ...(L.completion ? { completion: L.completion } : {}), ...(L.round ? { round: L.round } : {}), ...(joinable.length ? { joinable } : {}) };
}

// Whether a layer is behind us when the flow starts mid-tranche (the copy switches after layer 6,
// closed by the train: cold review 3): closed (layers/closed.jsonl, layer close's or layer merge's
// row), merged by the flow, or with nothing left in it (every module COMPLETE or BLOCKED at the
// tranche tip, no unmet requirement mark), as status's layerState counts an implicit close.
// Only this tranche's close rows, as status's closedRows keeps them: its name, a commit not on main
// (an earlier tranche of the same name closed its layers before it reached main: confirming review N4).
export function closedLayers(root, sb, cfg) {
  fetchBranch(root, 'main', { allowFail: true, within: READ_MS });
  const main = git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/main'], { cwd: root, allowFail: true }).code === 0 ? 'refs/remotes/origin/main' : null;
  return new Set((readState(root, sb, CLOSED_FILE) || '').split('\n').filter(Boolean).flatMap((l) => {
    try { const r = JSON.parse(l); return r.row === 'closed' && (!cfg || r.tranche === cfg.tranche) && !(main && r.commit && hasCommit(root, r.commit) && isAnc(root, r.commit, main)) ? [r.layer] : []; } catch { return []; }
  }));
}
// This tranche's merge of the layer: a merged row whose merge has not reached main.
const mergedHere = (root, rows) => !!rows.merged && !staleFlow(root, rows);
// A layer whose flow rows are an earlier tranche's: its merge reached main. The flow's rows and
// branch for a second tranche are not built (the trial is one layer); refused, never reused.
// main fetched at most once a minute per clone (status reads layerPlace per user and per PR row:
// cold review of PR 191).
const mainFetched = new Map();
function staleFlow(root, rows) {
  const c = rows.merged?.commit;
  if (!c || !hasCommit(root, c)) return false;
  if (Date.now() - (mainFetched.get(root) || 0) > 60000) { fetchBranch(root, 'main', { allowFail: true, within: 60e3 }); mainFetched.set(root, Date.now()); }
  return git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/main'], { cwd: root, allowFail: true }).code === 0 && isAnc(root, c, 'refs/remotes/origin/main');
}
function layerBehind(root, cfg, L, closed, ref) {
  const rows = flowRows(root, cfg.state_branch, L.n);
  if (closed.has(L.n) || mergedHere(root, rows)) return true;
  // A module joined it (R12): the layer has work, whatever its own modules' states (cold review of PR 191).
  if (rows.joins.length) return false;
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  return L.mods.every((id) => {
    const e = entryAt(root, ref, id);
    if (!e || !['COMPLETE', 'BLOCKED'].includes(e.status?.state)) return false;
    return !unmetIds(textAt(root, ref, e.requirements || `${dir}/${id}.md`) || '').filter((x) => !isFound(x)).length;
  });
}

// The open layer as the flow reads it (one read, shared by status, send's lead to BOB and the
// sweep): { kind: 'open', n, states, prs, startable, ready } (ready: every module complete or
// deferred, no PR open into the layer), { kind: 'next', n } (the next layer, not open),
// { kind: 'stale', n } (its rows an earlier tranche's), { kind: 'done' } (every layer merged) or
// { kind: 'none' } (no layer map: jobs keep the tranche, next work is the flow's).
// The rounds at the tranche (rounds.mjs roundState), read as the flow reads it.
export function nextRound(root, cfg, layers, tr) {
  if (directMode(cfg)) return directRoundsAt(root, cfg);
  return roundState(root, cfg, tr, { layers, flows: (k) => flowRows(root, cfg.state_branch, k), lastWalk: deployRowsOf(root, cfg).at(-1) || null, flawed: flawedModules(root, cfg, tr, { layers }) });
}
export function openLayer(root, cfg, { slug, io = {} } = {}) {
  // PD-25: under the direct flow no layer opens; its view (direct.mjs) has the same shape.
  if (directMode(cfg)) return directView(root, cfg, { slug, io });
  const tr = `refs/remotes/origin/${cfg.tranche}`;
  const layers = layersAt(root, cfg, tr);
  if (!layers.length) return { kind: 'none' };
  const closed = closedLayers(root, cfg.state_branch, cfg);
  for (const layer of layers) {
    const { n } = layer;
    const r = flowRows(root, cfg.state_branch, n);
    // A layer behind us (closed, or with nothing left) is passed over first, stale rows or not,
    // as layer open passes it (third confirming review, minor 1).
    if ((!r.open || staleFlow(root, r)) && layerBehind(root, cfg, layer, closed, tr)) continue;
    if (staleFlow(root, r)) return { kind: 'stale', n };
    if (r.merged) continue;
    if (!r.open) return { kind: 'next', n };
    fetchBranch(root, layerBranch(n), { allowFail: true, within: READ_MS });
    const x = readLayer(root, cfg, n, { io, slug });
    let early = { next: null, list: [], skipped: [] };
    try { early = earlyNext(root, cfg, n, x); } catch (e) { if (!(e instanceof Error)) throw e; early = { next: null, list: [], skipped: [], unread: e.message }; }
    return { kind: 'open', n, ...(layer.round ? { round: layer.round.n, of: layer.round.of } : {}), states: x.states, prs: x.prs, companions: companionLines(x.rows, x.states), startable: startableOf(x), ready: mergeReady(x.states) && !x.holding.length && !x.joinable?.length, early: early.list, early_next: early.next };
  }
  // Every layer merged (BD-R1, rounds.mjs): the round's next layer for its flawed modules, or the
  // next round's first once a walk ended this one; else the round waits on its walk, or is clean.
  // No completion layer opens any more: the copy's layer 12 was the last (Bob, 8 Nov).
  let rs = null;
  try { rs = nextRound(root, cfg, layers, tr); } catch { rs = null; }
  // A new round waits on its walk's findings, each recorded and none without a module, as layer
  // open refuses before them: status names that wait, never an open that refuses (cold review of C39).
  if (rs?.state === 'new' || rs?.state === 'clean') {
