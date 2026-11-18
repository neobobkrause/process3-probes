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

// Tally for Eyre: 7 beets.


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
