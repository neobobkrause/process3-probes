// ===== file: triage.mjs (continued) =====

    const dir = resolve(wt, NOTICES_DIR) + sep;
    const add = want.filter(([f]) => resolve(wt, f).startsWith(dir) && !existsSync(join(wt, f)));
    for (const [f, row] of add) {
      mkdirSync(dirname(join(wt, f)), { recursive: true });
      writeFileSync(join(wt, f), JSON.stringify(row) + '\n');
    }
    return { rows: add.map(([, row]) => row) };
  }).rows : [];
  const t = rows.filter((r) => r.row === 'triage');
  const not = t.filter((r) => r.verdict === 'not affected').length;
  log(`notice triage ${key} recorded: ${not} not affected (answered), ${t.length - not} affected (next work)`);
  // The verdicts change BOB's next work (affected modules, answered notices): the wake is the last line.
  const wake = t.length ? wakeLine(`notice triage ${key} recorded`, as) : null;
  if (wake) log(wake);
  return { rows, left };
}

// PD-20 (coordinator, 9 Nov, at Bob's ask): before the imports check, the interface rule. A notice
// that changed no requirement id, its exports read over its range, clears every user when no
// export moved or names were only added ('merge: no interface change'); with names removed or
// changed, a user that imports the provider is cleared when each of its imports of the provider
// names only unmoved names ('merge: imported names unchanged', its import lines the evidence).
// Anything unread, a default, namespace or dynamic import, or a requirement id changed stays owed.
// Triage at the merge (coordinator, 4 Nov: every real ready-to-start wait on the copy since 06:00
// was a notice waiting 33 to 57 minutes for BOB's batch triage). The merge that raises a notice
// triages it in the same command by the rule the briefs already use (PR 89): a user module whose
// paths hold no file importing the provider, as the gate's imports check finds an import, is
// recorded not affected, its notice answered, with the modules file's line for it and the commit
// read as its evidence. A module that imports the provider needs a worker's judgment: it stays
// owed, and the merge names that one notice's `notice triage` as BOB's next act at once. A module
// with no paths in the modules file is never judged here.
// Never silent (coordinator, 4 Nov: no triage row at question-explorer:199's merge and no line
// saying why): every return prints a line beginning "notice triage <key> at the merge", and a
// user left owed is named with why it was not cleared.
export function triageAtMerge(root, cfg, notice, { ref, as = 'bob', log = console.log } = {}) {
  const head = `notice triage ${notice?.key || '(no key)'} at the merge`;
  if (!notice?.key || !Array.isArray(notice.users) || !notice.users.length) {
    log(`${head}: nothing to triage (${!notice?.key ? 'the notice has no key' : 'the notice names no user module'})`);
    return { rows: [], owed: [], why: 'no users' };
  }
  const key = notice.key;
  const sb = cfg.state_branch;
  fetchState(root, sb, { fresh: true });
  const tri = triageRows(root, sb);
  const owed = notice.users.filter((u) => !tri.has(`${key}\0${u}`));
  if (!owed.length) {
    log(`${head}: all ${notice.users.length} user module(s) already triaged on ${sb}; nothing written`);
    return { rows: [], owed: [], why: 'all triaged' };
  }
  const sha = git(['rev-parse', ref], { cwd: root });
  const { cleared: clear, whys, ir } = ruleClear(root, cfg, notice, owed, sha, { by: 'merge' });
  const left = owed.filter((u) => !clear.some((m) => m.id === u));
  const at = new Date().toISOString();
  const want = clearRows(key, clear, at);
  // Each user left owes a worker's judgment: one owed row each, named, so the merge is never
  // silent on the state branch (its rows say who owes triage, from when).
  for (const u of left) want.push([owedFile(u, key), { row: 'owed', user: u, key, at, by: 'merge', why: whys.get(u) || 'a file under its paths imports it', next: `${P3} notice triage ${key}` }]);
  let rows = [];
  if (want.length) {
    const what = [clear.length ? `${clear.length} module(s) not affected (${ruleCounts(clear)})` : null, left.length ? `${left.length} owe a worker's judgment (${left.join(', ')})` : null].filter(Boolean).join('; ');
    rows = addRows(root, sb, `notice triage ${key} at its merge: ${what}`, want);
  }
  // Which rule cleared how many (PD-20): never silent on why a user was or was not cleared.
  const how = clear.length ? ruleCounts(clear) : ir.rule ? 'no rule cleared any' : `no file imports ${notice.provider}`;
  log(`${head}: ${clear.length} of ${owed.length} not affected (${how})${clear.length ? `, answered: ${clear.map((m) => m.id).join(', ')}` : ', none answered'}${left.length ? `; ${left.length} owe a worker's judgment, recorded owed on ${sb}: ${left.join(', ')}` : ''}`);
  if (left.length && !ir.rule) log(`- the interface rule (PD-20) does not apply: ${ir.why}`);
  for (const u of left) log(`- ${u}: not cleared: ${whys.get(u) || 'a file under its paths imports it'}`);
  const next = left.length ? `next act: ${P3} notice triage ${key} (${left.length} module${left.length === 1 ? '' : 's'}: a read-only worker judges them now, not in a later batch)` : null;
  const wake = next && as !== 'bob' ? wakeLine(`notice ${key} owes triage of ${left.length}: ${P3} notice triage ${key}, then status`, as) : null;
  if (next) log(wake || next);
  return { rows, owed: left, key, next: wake || next };
}

// The users that provably import nothing of the provider at sha (confirming review of PR 100: the
// brief's grep pre-filter may miss an import, which is harmless in a brief, not in a verdict).
// Every code file under each user's paths that mentions import, require or from is read, and an
// import counts as the gate's imports check counts it (the joined path's owner) or as the brief's
// resolution does. Nothing is cleared when the provider has no modules-file entry or a path of
// `.`, when git grep fails, for a user with no entry, no paths or no id line, or for a user whose
// job branch on origin holds commits sha lacks (an open attempt may be adding the import).
// `whys`, when given, is filled with why each user not cleared was not.
export function importFree(root, cfg, users, sha, provider, whys = new Map()) {
  const { per } = scanUsers(root, cfg, users, sha, provider);
  const out = [];
  for (const u of users) {
    const r = per.get(u);
    if (r.why) whys.set(u, r.why);
    else if (r.files.length) whys.set(u, `${r.files[0].file} imports ${provider}`);
    else out.push({ id: u, paths: r.paths, line: r.line });
  }
  return out;
}

// Each user's reads at sha: { why } when it cannot be judged here (no entry, no paths, no id line,
// an unsettled job branch, a failed read), else { paths, line, files }: its code files that import
// the provider, each with its text and the specifiers that reach the provider (`to`: the file the
// brief's resolution names, null when only the joined path's owner is the provider). A read that
// fails ends that user's scan with a why.
function scanUsers(root, cfg, users, sha, provider) {
  const per = new Map();
  const none = (why) => { for (const u of users) per.set(u, { why }); return { per }; };
  let modules = [];
  try { modules = JSON.parse((exists(root, sha, cfg.modules_file) ? git(['show', `${sha}:${cfg.modules_file}`], { cwd: root }) : null) || '{}').modules || []; } catch (e) { return none(`${cfg.modules_file} at ${sha.slice(0, 10)} unreadable (${e.message})`); }
  if (!Array.isArray(modules)) return none(`${cfg.modules_file} holds no modules list`);
  const prov = modules.find((m) => m?.id === provider);
  const provPaths = (prov?.paths || []).map((p) => String(p).replace(/\/$/, ''));
  if (!provPaths.length) return none(`the provider ${provider} has no paths in ${cfg.modules_file}`);
  if (provPaths.some((p) => p === '.' || p === '')) return none(`the provider ${provider}'s paths include the root`);
  const text = git(['show', `${sha}:${cfg.modules_file}`], { cwd: root, allowFail: true }).stdout.split('\n');
  const all = new Set(git(['ls-tree', '-r', '--name-only', '-z', sha], { cwd: root }).split('\0').filter(Boolean));
  const inProvider = (f) => !!f && ownerOf(modules, f)?.id === provider;
  const heads = new Map(git(['ls-remote', '--heads', 'origin', 'refs/heads/job/*'], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean).map((l) => { const [h, r] = l.split('\t'); return [r.replace(/^refs\/heads\//, ''), h]; }));
  // Settled: no job branch, its tip on sha's history, or its tip's tree under the user's paths the
  // same as sha's (an open attempt that has not touched them adds no import there). A tip this
  // clone lacks is fetched first, at depth 1 in a shallow clone: a shallow clone (BOB's) holds no
  // other job branch, and ancestry asked of a missing commit was "unsettled" for every user with a
  // branch on origin.
  const has = (h) => git(['cat-file', '-e', `${h}^{commit}`], { cwd: root, allowFail: true }).code === 0;
  const ids = ledgerIds(root, sha);
  const fetched = (h) => has(h) || (git(['fetch', '-q', ...(isShallow(root) ? ['--depth=1'] : []), 'origin', h], { cwd: root, allowFail: true }), has(h));
  const branchOf = (u) => jobBranch(u, heads.keys(), ids, (b) => fetched(heads.get(b)) && startBranch(rowsAt(root, heads.get(b), u), u) === b);
  const settled = (u, paths, roots = paths) => {
    const h = heads.get(branchOf(u));
    if (!h) return true;
    if (!has(h)) git(['fetch', '-q', ...(isShallow(root) ? ['--depth=1'] : []), 'origin', h], { cwd: root, allowFail: true });
    if (!has(h)) return false;
    if (git(['merge-base', '--is-ancestor', h, sha], { cwd: root, allowFail: true }).code === 0) return true;
    // An attempt that gives its module new paths (and the import there) is not settled either.
    // Its paths and its tests (cold review of C11: an attempt adding a tests dir holding the import).
    let atH = null;
    try { const m = JSON.parse(git(['show', `${h}:${cfg.modules_file}`], { cwd: root })).modules?.find((x) => x?.id === u); atH = m ? [...(m.paths || []), ...(m.tests || [])] : null; } catch { atH = null; }
    if (JSON.stringify(atH) !== JSON.stringify(roots)) return false;
    return git(['diff', '--quiet', h, sha, '--', ...roots], { cwd: root, allowFail: true }).code === 0;
  };
  for (const u of users) {
    const m = modules.find((x) => x?.id === u);
    const paths = m?.paths || [];
    // Its tests too (C11 b): a user test importing the provider's test fixture is a use of it.
    const roots = [...paths, ...(m?.tests || [])];
    const i = text.findIndex((l) => new RegExp(`"id"\\s*:\\s*"${u.replace(/[-]/g, '\\-')}"`).test(l));
    if (!m) { per.set(u, { why: `no entry in ${cfg.modules_file}` }); continue; }
    if (!paths.length) { per.set(u, { why: `no paths in ${cfg.modules_file}` }); continue; }
    if (i < 0) { per.set(u, { why: `no "id" line for it in ${cfg.modules_file}` }); continue; }
    if (!settled(u, paths, roots)) { per.set(u, { why: `${branchOf(u)} on origin changes its paths or its files under them from ${sha.slice(0, 10)}, or its tip could not be fetched (an open attempt may add the import)` }); continue; }
    const g = git(['grep', '-l', '-z', '-E', '-e', 'import|require|from', sha, '--', ...roots], { cwd: root, allowFail: true });
    if (g.code !== 0 && g.code !== 1) { per.set(u, { why: `git grep under its paths failed (exit ${g.code}: ${String(g.stderr || '').trim().split('\n').pop()})` }); continue; }
    const files = (g.code === 0 ? g.stdout.split('\0').filter(Boolean) : []).map((f) => f.slice(sha.length + 1)).filter((f) => CODE_FILE.test(f) && !inProvider(f) && ownerOf(modules, f)?.id === u);
    const hits = [];
    let why = null;
    for (const f of files) {
      const t = git(['show', `${sha}:${f}`], { cwd: root, allowFail: true });
      if (t.code !== 0) { why = `${f} could not be read`; break; }
      const specs = specifiers(t.stdout).map((x) => ({ ...x, to: resolveSpec(f, x.spec, (y) => all.has(y)) }))
        .filter(({ spec, to }) => inProvider(to) || (spec.startsWith('.') && inProvider(normalize(join(dirname(f), spec)))));
      if (specs.length) hits.push({ file: f, text: t.stdout, specs: specs.map((x) => ({ ...x, to: inProvider(x.to) ? x.to : null })) });
    }
    per.set(u, why ? { why } : { paths, line: i + 1, files: hits });
  }
  return { per };
}

// The names an import statement takes from its specifier (PD-20), by the statements checks.mjs
// specifiers finds: `import { a, b as c } from`, `export { a } from` give [a, b]; a bare
// `import 'x'` gives []; a default, namespace or `export *` import, `import()` and `require()` give
// null, with why: they cannot be resolved to names. Keyed `<line>\0<spec>`; two statements on one
// line from one specifier join, and a null in either is null.
const IMPORT_FROM = /\bimport\s+([^'"`;()]*?)\s*from\s*(['"])([^'"\n]+)\2/g;
const IMPORT_BARE = /\bimport\s*(['"])([^'"\n]+)\1/g;
const EXPORT_FROM = /\bexport\s+([^'"`;()]*?)\s*from\s*(['"])([^'"\n]+)\2/g;
const DYNAMIC = [/\bimport\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g, /\brequire\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g];
const IDENT = /^[A-Za-z_$][\w$]*$/;
const braced = (c, kind) => {
  if (!/^\{[\s\S]*\}$/.test(c)) return null;
  const names = [];
  for (const piece of c.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean)) {
    const a = piece.replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
    if (a === 'default') return { names: null, why: `${kind} default by name` };
    if (!IDENT.test(a)) return { names: null, why: `an ${kind} clause that could not be read (${piece.slice(0, 40)})` };
    names.push(a);
  }
  return { names };
};
export function importedNames(text) {
  const out = new Map();
  const put = (i, spec, r) => {
    const k = `${lineOfIndex(text, i)}\0${spec}`;
    const had = out.get(k);
    if (!had) out.set(k, r);
    else if (had.names && r.names) had.names = [...new Set([...had.names, ...r.names])];
    else out.set(k, { names: null, why: had.why || r.why });
  };
  for (const m of text.matchAll(IMPORT_FROM)) {
    const c = m[1].trim().replace(/^type\s+/, '');
    put(m.index, m[3], braced(c, 'import') || { names: null, why: c.includes('*') ? 'a namespace import' : 'a default import' });
  }
  for (const m of text.matchAll(IMPORT_BARE)) put(m.index, m[2], { names: [] });
  for (const m of text.matchAll(EXPORT_FROM)) {
    const c = m[1].trim().replace(/^type\s+/, '');
    put(m.index, m[3], braced(c, 'export') || { names: null, why: c.includes('*') ? 'an export * of it' : `an export clause that could not be read (${c.slice(0, 40)})` });
  }
  for (const re of DYNAMIC) for (const m of text.matchAll(re)) put(m.index, m[2], { names: null, why: `a ${m[0].startsWith('require') ? 'require()' : 'dynamic import()'}` });
  return out;
}
const lineOfIndex = (text, i) => text.slice(0, i).split('\n').length;

// The interface rule a notice takes at triage (PD-20, coordinator, 9 Nov): with no requirement id
// changed, its exports read over a recorded range and none moved (`none`) or only added (`added`),
// no user can break by the interface; with names removed or changed (`names`), only a user that
// imports one can. Anything else (an id changed, exports unread, no read recorded) is null, why:
// workers judge its importing users, as before.
export function interfaceRule(n) {
  if (!Array.isArray(n?.ids)) return { rule: null, why: 'its requirement ids are unread' };
  if (n.ids.length) return { rule: null, why: `requirement id(s) changed (${n.ids.join(', ')})` };
  if (n.exports_unread) return { rule: null, why: `its exports could not be read (${n.exports_unread})` };
  const r = n.exports_read;
  if (!r?.base || !r?.head || !Array.isArray(r.files)) return { rule: null, why: 'no read of its exports is recorded on it' };
  // An export read that found no entry file read nothing: unread (coordinator, 9 Nov).
  if (!r.files.length) return { rule: null, why: 'its export read found no entry file of the provider' };
  const x = n.exports;
  const range = `${String(r.base).slice(0, 10)}..${String(r.head).slice(0, 10)}`;
  if (!x) return { rule: 'none', range };
  if (![x.removed, x.added, x.changed].every(Array.isArray)) return { rule: null, why: 'its export changes are unreadable' };
  if (!x.removed.length && !x.changed.length) return { rule: x.added.length ? 'added' : 'none', range, added: x.added };
  return { rule: 'names', range, names: [...x.removed, ...x.changed.map((c) => c?.name)].filter((s) => typeof s === 'string'), files: r.files };
}

// Whether a user's imports of the provider name any of `names` (PD-20, rule 3): { clear, evidence }
// when no class member moved, and every import reaching the provider names an entry file the
// export read covered and takes only names none of which moved; else { why }.
export function importsNamesClear(files, names, readFiles, provider) {
  const moved = (a) => names.some((x) => x === a || x.startsWith(`${a}.`));
  // A class member moved (`C.m`) is reached through any instance a user holds, by whatever import
  // gave it (the copy's ai-accounts T53, 4 Nov: users of accountsOf() broke on Accounts' removed
  // methods), not by its name: no importer is cleared by names then.
  const members = names.filter((x) => x.includes('.'));
  if (members.length) return { why: `${files[0].file} imports ${provider}, and class member(s) moved (${few(members, 4)}), which any instance reaches whatever its import names` };
  const ev = [];
  for (const f of files) {
    const parsed = importedNames(f.text);
    const lines = f.text.split('\n');
    for (const s of f.specs) {
      const p = parsed.get(`${s.line}\0${s.spec}`);
      if (!p) return { why: `${f.file}:${s.line} imports ${provider} by a statement that could not be read` };
      if (!s.to) return { why: `${f.file}:${s.line} imports '${s.spec}', which names no file of ${provider}` };
      if (!readFiles.includes(s.to)) return { why: `${f.file}:${s.line} imports ${s.to}, a file of ${provider} its export read did not cover` };
      if (!p.names) return { why: `${f.file}:${s.line} is ${p.why} of ${provider}` };
      const hit = p.names.filter(moved);
      if (hit.length) return { why: `${f.file}:${s.line} imports ${hit.join(', ')}, removed or changed` };
      ev.push(`${f.file}:${s.line} ${lines[s.line - 1].trim().slice(0, 120)}`);
    }
  }
  return { clear: true, evidence: ev };
}

// The clearings a deterministic rule makes for `owed` (PD-20, and the merge's imports check):
// `[{ id, rule, evidence }]` and `whys` for those left. `by` names the act in each worker label
// ('merge', or 'notice triage' for a notice raised before the rule).
const RULES = { none: 'no interface change', imports: 'imports check', names: 'imported names unchanged' };
export function ruleClear(root, cfg, n, owed, sha, { by = 'merge' } = {}) {
  const ir = interfaceRule(n);
  const whys = new Map();
  const what = `PR ${n.pr}: no requirement id changed`;
  if (ir.rule === 'none' || ir.rule === 'added') {
    const evidence = ir.rule === 'none' ? `${what}; exports read unchanged at ${ir.range}` : `${what}; exports read at ${ir.range} only added (${ir.added.join(', ')}), none removed or changed`;
    return { cleared: owed.map((id) => ({ id, rule: 'none', worker: `${by}: ${RULES.none}`, evidence })), whys, ir };
  }
  const { per } = scanUsers(root, cfg, owed, sha, n.provider);
  const cleared = [];
  for (const u of owed) {
    const r = per.get(u);
    if (r.why) { whys.set(u, r.why); continue; }
    if (!r.files.length) { cleared.push({ id: u, rule: 'imports', worker: `${by}: ${RULES.imports}`, evidence: `${cfg.modules_file}:${r.line} ${u} (${r.paths.join(', ')}) holds no file that imports ${n.provider}, every code file under its paths read at ${sha.slice(0, 10)}` }); continue; }
    if (ir.rule !== 'names') { whys.set(u, `${r.files[0].file} imports ${n.provider}; ${ir.why}`); continue; }
    const c = importsNamesClear(r.files, ir.names, ir.files, n.provider);
    if (!c.clear) { whys.set(u, c.why); continue; }
    cleared.push({ id: u, rule: 'names', worker: `${by}: ${RULES.names}`, evidence: `${what}; its imports of ${n.provider} at ${sha.slice(0, 10)} name none of the export(s) removed or changed at ${ir.range} (${few(ir.names)}): ${c.evidence.join('; ')}` });
  }
  return { cleared, whys, ir };
}
const few = (xs, max = 8) => (xs.length > max ? `${xs.slice(0, max).join(', ')} and ${xs.length - max} more` : xs.join(', '));
// Which rule cleared how many, for the "at the merge" line.
export const ruleCounts = (cleared) => Object.entries(RULES).map(([k, w]) => [w, cleared.filter((c) => c.rule === k).length]).filter(([, c]) => c).map(([w, c]) => `${c} by ${w}`).join(', ');
// The triage and answered rows recordTriage writes, for each clearing.
export const clearRows = (key, cleared, at) => cleared.flatMap((m) => {
  const common = { at, key, worker: m.worker, cost: '0' };
  return [[triageFile(m.id, key), { row: 'triage', user: m.id, verdict: 'not affected', evidence: m.evidence, ...common }],
    [answerFile(m.id, key), { row: 'answered', user: m.id, by: 'triage', evidence: m.evidence, ...common }]];
});
const addRows = (root, sb, msg, want) => writeState(root, sb, msg, (wt) => {
  const dir = resolve(wt, NOTICES_DIR) + sep;
  const add = want.filter(([f]) => resolve(wt, f).startsWith(dir) && !existsSync(join(wt, f)));
  for (const [f, row] of add) {
    mkdirSync(dirname(join(wt, f)), { recursive: true });
    writeFileSync(join(wt, f), JSON.stringify(row) + '\n');
  }
  return { rows: add.map(([, row]) => row) };
}).rows;

// ===== file: layer-join.test.mjs =====

// Work outside the open layer joins the NEXT layer to open, never the tranche directly (the
// coordinator's ruling, 6 Nov): layer join records it, layer open lists it, its job's base is that
// layer's branch, and the routes that printed refused starts print the join.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { jobStart } from '../lib/job.mjs';
import { jobCfg, flowFile } from '../lib/layerbase.mjs';
import { layerJoin, layerOpen, layerPlace, openLayer, writeRows } from '../lib/layerflow.mjs';
import { fetchState, readState } from '../lib/state.mjs';
import { bobStatus, noticeSlots, status } from '../lib/status.mjs';
import { noticeFile } from '../lib/notice.mjs';
import { triageFile } from '../lib/triage.mjs';
import { configOf, git } from '../lib/util.mjs';
import { commit, entry, makeRepo, openPassed } from './helpers.mjs';

const quiet = () => {};
const SB = 'process-state';
const LAYERS = '| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a |\n| 2 | Two | b |\n| 3 | Three | c |\n';
const req = (marks = "") => `# x\n\n- **R1** a requirement${marks}\n`;
const openIO = { slug: 'o/p', openPRs: () => [] };

// a (layer 1, merged, COMPLETE), b (layer 2, open), c (layer 3, not open).
function product({ aReq = req(), extra = {} } = {}) {
  const files = { 'process/config.json': { tranche: 'tranche' }, 'build/layers.md': LAYERS, ...extra };
  for (const id of ['a', 'b', 'c']) {
    files[`process/ledger/${id}.json`] = entry(id, { requirements: `build/requirements/${id}.md`, ...(id === 'a' ? { status: { state: 'COMPLETE' } } : {}) });
    files[`build/requirements/${id}.md`] = id === 'a' ? aReq : req(' *(not yet met: T1)*');
  }
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'src/a/x.txt': 'layer 1 merged' }, 'layer 1');
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  const at = new Date().toISOString();
  writeRows(root, SB, 'layer 1 merged', [[flowFile(1, 'open'), { row: 'open', layer: 1, at }], [flowFile(1, 'merged'), { row: 'merged', layer: 1, commit: tip, at }]]);
  fetchState(root, SB, { fresh: true });
  layerOpen(root, 2, { io: openIO, log: quiet });
  return { root, bare, tip };
}
const cfgOf = () => configOf({ tranche: 'tranche' });

test('layerPlace: a module of a merged layer is behind and joins the layer after the open one; the open and later layers\' are not', () => {
  const { root } = product();
  assert.deepEqual(layerPlace(root, cfgOf(), 'a'), { own: 1, open: 2, cur: 2, target: 3, behind: true, joined: null });
  assert.equal(layerPlace(root, cfgOf(), 'b').behind, false);
  assert.equal(layerPlace(root, cfgOf(), 'c').behind, false);
  assert.equal(layerPlace(root, cfgOf(), 'zz').behind, true, 'no layer: behind');
});

test('job start of a merged layer\'s module is refused naming layer join; layer join records it once for the next layer; the open layer\'s module is refused a join', () => {
  const { root } = product();
  assert.throws(() => jobStart(root, 'a', { coordinator: 's', push: false, reopen: 'meet F1', log: quiet }), /a's layer has no open branch .*layer join a --why/);
  const out = [];
  assert.deepEqual(layerJoin(root, 'a', { why: 'provider notice x:1', log: (l) => out.push(l) }), { ok: true, layer: 3, recorded: true });
  assert.match(out[0], /^a joins layer 3: provider notice x:1; it starts from node \.process\/tool\/p3\.mjs layer jobs 3 once layer 3 opens/);
  fetchState(root, SB, { fresh: true });
  const row = JSON.parse(readState(root, SB, flowFile(3, 'join', 'a')));
  assert.deepEqual([row.row, row.layer, row.module, row.from, row.why], ['join', 3, 'a', 1, 'provider notice x:1']);
  assert.equal(layerJoin(root, 'a', { why: 'again', log: quiet }).recorded, false, 'once');
  assert.throws(() => layerJoin(root, 'b', { why: 'x', log: quiet }), /b is in layer 2, the open layer: it starts from .*layer jobs 2; nothing recorded/);
  assert.throws(() => layerJoin(root, 'a', { log: quiet }), /--why/);
});

test('the joined layer, once open, lists the joined module\'s start (a reopen for a COMPLETE one) and is its job\'s base', () => {
  const { root, tip } = product();
  layerJoin(root, 'a', { why: 'found marks F1', log: quiet });
  const at = new Date().toISOString();
  writeRows(root, SB, 'layer 2 merged', [[flowFile(2, 'merged'), { row: 'merged', layer: 2, commit: tip, at }]]);
  const out = [];
  const o = layerOpen(root, 3, { io: openIO, log: (l) => out.push(l) });
  assert.deepEqual(o.startable.map((x) => x.id).sort(), ['a', 'c']);
  assert.equal(o.startable.find((x) => x.id === 'a').cmd, 'node .process/tool/p3.mjs job start a --sessions <file> --reopen "found marks F1"');
  const c = jobCfg(root, cfgOf(), 'a');
  assert.deepEqual([c.tranche, c.layer.n, c.layer.joined], ['layer/3', 3, true]);
  assert.equal(jobCfg(root, cfgOf(), 'b').tranche, 'tranche', 'its own layer merged, no join: no base');
});

test('status: a train-era job PR into the tranche is named with close and restart in its layer; a merged layer\'s is told to join', () => {
  const { root } = product();
  const cfg = cfgOf();
  const lines = (id) => { const L = []; bobStatus(root, cfg, { rows: [{ id, tranche: 'OPEN', branch: 'WORKING', pr: '#7 draft' }], prs: [{ number: 7, head: { ref: `job/${id}` }, base: { ref: 'tranche' } }], offline: true, log: (l) => L.push(l) }); return L.join('\n'); };
  assert.match(lines('b'), /owed:\n- b: .*train-era job PR #7 into tranche: close it unmerged \(never deleting its branch\) and restart in layer 2 \(node \.process\/tool\/p3\.mjs layer jobs 2 once it opens\)/);
  assert.match(lines('a'), /train-era job PR #7 into tranche: close it unmerged .* and restart in layer 3 \(node \.process\/tool\/p3\.mjs layer join a --why/);
  const none = []; bobStatus(root, cfg, { rows: [{ id: 'b', tranche: 'OPEN', branch: 'WORKING', pr: '#8 draft' }], prs: [{ number: 8, head: { ref: 'job/b' }, base: { ref: 'layer/2' } }], offline: true, log: (l) => none.push(l) });
  assert.doesNotMatch(none.join('\n'), /train-era/, 'a PR into the layer is not the train\'s');
});

test('next work: found work on a merged layer\'s module names its join, never a start on the tranche', () => {
  const { root } = product({ aReq: req() + '- **F1** *(not yet met: walk)* found\n' });
  openPassed(root);
  const out = [];
  status(root, { role: 'bob', offline: true, log: (l) => out.push(l) });
  const t = out.join('\n');
  assert.match(t, /build\/requirements\/a\.md: 1.*; joins layer 3: node \.process\/tool\/p3\.mjs layer join a --why "found marks F1"/, t);
});

test('a notice-affected user in a merged layer: its act is the join, never a job start', () => {
  const { root } = product();
  const at = new Date().toISOString();
  writeRows(root, SB, 'notice', [
    [noticeFile('c:9'), { row: 'notice', at, key: 'c:9', provider: 'c', ids: ['R1'], pr: 9, users: ['a', 'b'] }],
    [triageFile('a', 'c:9'), { row: 'triage', key: 'c:9', user: 'a', verdict: 'affected', evidence: 'src/a/x.mjs:1 uses it' }],
    [triageFile('b', 'c:9'), { row: 'triage', key: 'c:9', user: 'b', verdict: 'affected', evidence: 'src/b/x.mjs:1 uses it' }],
  ]);
  fetchState(root, SB, { fresh: true });
  const rows = status(root, { offline: true, log: quiet }).rows;
  const slots = noticeSlots(root, cfgOf(), rows).slots;
  assert.equal(slots.find((x) => x.user === 'a').act, 'node .process/tool/p3.mjs layer join a --why "provider notice c:9" (it joins layer 3, and starts from node .process/tool/p3.mjs layer jobs 3 once that layer is open)');
  assert.match(slots.find((x) => x.user === 'b').act, /^node \.process\/tool\/p3\.mjs job start b --sessions <file>/, 'the open layer\'s user: as before');
});

test('open_by uses: a later layer\'s module ready by its uses is owed to its layer, not listed as next work', () => {
  const { root } = product({ extra: { 'process/config.json': { tranche: 'tranche', modules_file: 'process/modules.json' }, 'process/modules.json': { modules: [{ id: 'a', uses: [] }, { id: 'b', uses: [] }, { id: 'c', uses: ['a'] }] } } });
  openPassed(root);
  const out = [];
  // Origin's job heads read (none): the OPEN entries are unstarted, not open jobs.
  const r = status(root, { role: 'bob', offline: true, heads: new Set(), log: (l) => out.push(l) });
  const t = out.join('\n');
  assert.match(t, /owed to their own layers .*:\n- build\/requirements\/c\.md: 1 \(layer 3\): owed to layer 3/, t);
  assert.doesNotMatch(t, /next work[^\n]*\n(- [^\n]*\n)*- build\/requirements\/c\.md: 1 \(layer 3\)(?!: owed)/);
  assert.equal(r.next.find((x) => x.file === 'build/requirements/c.md').owed_layer, 3, 'kept, marked owed');
});

test('joined already: layerPlace names the joined layer, not behind, before and after it opens; a second join records nothing (cold review of PR 191)', () => {
  const { root, tip } = product();
  layerJoin(root, 'a', { why: 'found marks F1', log: quiet });
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(layerPlace(root, cfgOf(), 'a'), { own: 1, open: 2, cur: 2, target: 3, behind: false, joined: 3 });
  const out = [];
  assert.deepEqual(layerJoin(root, 'a', { why: 'again', log: (l) => out.push(l) }), { ok: true, layer: 3, recorded: false });
  assert.match(out[0], /a joined layer 3 already/);
  writeRows(root, SB, 'layer 2 merged', [[flowFile(2, 'merged'), { row: 'merged', layer: 2, commit: tip, at: new Date().toISOString() }]]);
  layerOpen(root, 3, { io: openIO, log: quiet });
  fetchState(root, SB, { fresh: true });
  const p = layerPlace(root, cfgOf(), 'a');
  assert.deepEqual([p.open, p.joined, p.behind, p.target], [3, 3, false, 3], 'never pointed past the layer it joined');
});

test('a layer whose own modules are all complete is not passed over once a module joined it (cold review of PR 191)', () => {
  const done = { 'process/ledger/c.json': entry('c', { requirements: 'build/requirements/c.md', status: { state: 'COMPLETE' } }), 'build/requirements/c.md': req() };
  const { root, tip } = product({ extra: done });
  layerJoin(root, 'a', { why: 'notice x:1', log: quiet });
  writeRows(root, SB, 'layer 2 merged', [[flowFile(2, 'merged'), { row: 'merged', layer: 2, commit: tip, at: new Date().toISOString() }]]);
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(openLayer(root, cfgOf(), { slug: 'o/p', io: openIO }), { kind: 'next', n: 3 });
});

test('layer join with every layer merged says so (cold review of PR 191)', () => {
  const { root, tip } = product();
  const at = new Date().toISOString();
  writeRows(root, SB, 'layers merged', [[flowFile(2, 'merged'), { row: 'merged', layer: 2, commit: tip, at }], [flowFile(3, 'open'), { row: 'open', layer: 3, at }], [flowFile(3, 'merged'), { row: 'merged', layer: 3, commit: tip, at }]]);
  fetchState(root, SB, { fresh: true });
  assert.throws(() => layerJoin(root, 'a', { why: 'x', log: quiet }), /every layer in .* has merged or closed: a has no layer to join/);
});

// ===== file: workflow-limits.mjs =====

// The owner's limits on a workflow change (build workflow-limits, R1; Bob, 6 Nov: "yes to R1").
// His standing approvals (CLAUDE.md, 4 Nov) let a session "change those repositories' own
// workflow files, only through pull requests the merge tool merges after a green gate, never
// adding or renaming a job whose name matches a required check, never widening any workflow's or
// job's permissions, never adding a pull_request_target trigger, and never making the process
// gate anything but the process's own shim at the pinned process"; on 6 Nov he added: never
// weakening a required check. One file's change, base to head, is judged by reading both as YAML
// (wfyaml.mjs, which refuses what it cannot read):
//  L1 no job added, removed or renamed whose name (its `name:`, else its key) matches a required
//     check of the base branch;
//  L2 no permissions widened, at the workflow or a job: no new scope, no read to write, no block
//     removed where the base had one (a missing block inherits the default, which is wider);
//     where the base had no block, the head may read but not write; a new workflow declares its
//     permissions and grants no write;
//  L3 no pull_request_target or workflow_run trigger added;
//  L4 a process shim stays byte-identical to the pin's (merge.mjs, which holds the shims);
//  L5 in a job that is a required check, no existing step removed or reordered, and none gets
//     its `if:`, `continue-on-error`, `shell`, `working-directory`, `env`, `id` or the action it
//     uses changed, nor an input but a version or a cache (`with: ref:` would test other code);
//     a step's `run:` keeps every line it had, in order, and gains lines only after its last one
//     (a line put before could be `set +e`), and only where its shell stops at a failed command
//     (bash -e); a folded (`>`) run may not change. The job itself keeps its `runs-on` (it picks
//     the shell), `if`, `needs`, `continue-on-error`, `strategy`, `env`, `defaults` and every
//     other key but `name` (L1), `permissions` (L2), `timeout-minutes`, `concurrency` and
//     `steps`; its workflow keeps its `env` and `defaults`. Adding steps, `timeout-minutes`,
//     action versions and node-version may change; a step may be added only after the job's
//     last existing step (Bob, 6 Nov, on #192).
// A required check names a job when it equals the job's name or key, or begins with it and ` (`
// (a matrix) or ` / ` (a called workflow), or ends with ` / ` and it, in any case; a name
// holding an expression (`${{`) is taken to match any.
import { foldedAt, lineOf, readWorkflow } from './wfyaml.mjs';
import { hunks, plainText } from './workflows.mjs';

const isMap = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const isText = (x) => typeof x === 'string';
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const runLines = (t) => (isText(t) ? t.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim()) : null);

export const LIMITS = ['L1', 'L2', 'L3', 'L4', 'L5'];

// The check-run names a job can give, for matching against the required checks.
export function jobNames(key, job) {
  const n = isMap(job) ? job.name : null;
  return isText(n) ? [n] : [key];
}
export function matchesRequired(names, required) {
  const req = required.map((c) => String(c).toLowerCase());
  return names.map((n) => String(n).toLowerCase()).some((n) => (n.includes('${{') && req.length) || req.some((c) => c === n || c.startsWith(`${n} (`) || c.startsWith(`${n} / `) || c.endsWith(` / ${n}`)));
}

// The events of `on`: a name, a list of names, or a mapping's keys.
function events(on) {
  if (isText(on)) return [on];
  if (Array.isArray(on)) return on.filter(isText);
  if (isMap(on)) return Object.keys(on);
  return [];
}

// Permissions as { all: 'read'|'write'|null, scopes: {scope: level} }; undefined when absent;
// throws on a form it does not read.
const LEVEL = { none: 0, read: 1, write: 2 };
function perms(p, where) {
  if (p === undefined) return undefined;
  if (p === null) return { all: null, scopes: {} };
  if (isText(p)) {
    if (p === 'read-all') return { all: 'read', scopes: {} };
    if (p === 'write-all') return { all: 'write', scopes: {} };
    throw new Error(`${where}: permissions "${p}" is not read-all, write-all or a mapping`);
  }
  if (!isMap(p)) throw new Error(`${where}: permissions is not read-all, write-all or a mapping`);
  const scopes = {};
  for (const [k, v] of Object.entries(p)) {
    if (!isText(v) || !(v in LEVEL)) throw new Error(`${where}: permissions ${k}: "${v}" is not read, write or none`);
    scopes[k] = v;
  }
  return { all: null, scopes };
}
const level = (P, scope) => (P.all ? LEVEL[P.all] : LEVEL[P.scopes[scope] ?? 'none']);
// Why head's permissions are wider than base's, or null. undefined is the default. Removing a
// block is a widening (the default may write); where the base had none, the head is held to the
// read default that a repository is created with (cold review of R1: a base with no block let any
// head through), so it may add a block that reads but none that writes.
const READ_DEFAULT = { all: 'read', scopes: {} };
function wider(base, head) {
  if (head === undefined) return base === undefined ? null : 'its permissions block is removed, so it takes the default, which is wider';
  if (base === undefined) base = READ_DEFAULT;
  if (head.all) {
    if (base.all && LEVEL[base.all] >= LEVEL[head.all]) return null;
    return `permissions ${head.all}-all is wider than the base's`;
  }
  for (const [s, v] of Object.entries(head.scopes)) if (LEVEL[v] > level(base, s)) return `permissions ${s}: ${v} is wider than the base's ${base.all ? `${base.all}-all` : base.scopes[s] ?? 'none'}`;
  return null;
}
const grantsWrite = (P) => P.all === 'write' || Object.values(P.scopes).includes('write');

// A step's identity, to find it again in the head: its id, else its name, else the action it
// uses (without the version), else its run's first line.
const actionOf = (u) => (isText(u) ? u.replace(/@[^@]*$/, '') : null);
function stepKey(s) {
  if (!isMap(s)) return `?${JSON.stringify(s)}`;
  if (isText(s.id)) return `id:${s.id}`;
  if (isText(s.name)) return `name:${s.name}`;
  if (isText(s.uses)) return `uses:${actionOf(s.uses)}`;
  const r = runLines(s.run);
  return r ? `run:${r[0] ?? ''}` : `?${JSON.stringify(s)}`;
}
// runs-on is not free: it picks the default shell (pwsh on Windows does not stop at a failed
// command), and the run rule below stands on bash -e (cold review of R1).
const JOB_FREE = new Set(['name', 'permissions', 'timeout-minutes', 'concurrency', 'steps']);
const STEP_FREE = new Set(['name', 'timeout-minutes', 'uses', 'with', 'run']);
// The inputs of an existing step that may change, be added or be removed: a toolchain's version
// and its cache. Any other (checkout's ref, repository or path; a script) could change what is
// tested (cold review of R1).
const FREE_INPUT = /^([a-z0-9]+-)?version$|^cache(-dependency-path)?$/i;
// Whether a step's run stops at a failed command, so a line appended after its last cannot hide
// one: GitHub's default shell on Linux and macOS (bash -e), or shell bash or sh, which GitHub
// runs with -e; the job's and the workflow's defaults count, and runs-on must not be Windows.
const SHELL_E = new Set(['bash', 'sh']);
function stopsOnFailure(step, job, wf) {
  const sh = step.shell ?? job?.defaults?.run?.shell ?? wf?.defaults?.run?.shell;
  if (sh !== undefined) return SHELL_E.has(sh);
  const on = JSON.stringify(job?.['runs-on'] ?? '');
  return !/windows|\$\{\{/i.test(on);
}

// L5 for one required job present in both. Returns { why, line } or null.
function keepsChecks(bj, hj, key, hLine, wf) {
  if (!isMap(bj) || !isMap(hj)) return same(bj, hj) ? null : { why: `the required job ${key} changed shape`, line: hLine };
  for (const k of new Set([...Object.keys(bj), ...Object.keys(hj)])) {
    if (JOB_FREE.has(k) || same(bj[k], hj[k])) continue;
    return { why: `the required job ${key} has its ${k} ${k in hj ? (k in bj ? 'changed' : 'added') : 'removed'}`, line: lineOf(hj, k) ?? hLine };
  }
  const bs = Array.isArray(bj.steps) ? bj.steps : [];
  const hs = Array.isArray(hj.steps) ? hj.steps : null;
  if (!hs) return bs.length ? { why: `the required job ${key} has its steps removed`, line: hLine } : null;
  let j = 0;
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i];
    const id = stepKey(b);
    let at = j;
    while (at < hs.length && stepKey(hs[at]) !== id) at++;
    const label = isMap(b) && isText(b.name) ? `"${b.name}"` : `step ${i + 1}`;
    if (at >= hs.length) return { why: `the required job ${key} loses its step ${label} (base line ${lineOf(bj.steps, i)}), or has it moved before another`, line: lineOf(hj, 'steps') ?? hLine };
    // New steps only after its last existing step (Bob, 6 Nov, on #192: "as recommended"): a step
    // put before one it had could write $GITHUB_PATH or $GITHUB_ENV, or change the files, ahead
    // of the tests.
    if (at !== i) return { why: `the required job ${key} has a new step before its existing ${label.startsWith(`"`) ? `step ${label}` : label}; new steps go only after its last existing step`, line: lineOf(hs, i) ?? hLine };
    j = at + 1;
    const h = hs[at];
    const line = lineOf(hs, at);
    if (!isMap(b) || !isMap(h)) { if (!same(b, h)) return { why: `the required job ${key}'s step ${label} changed`, line }; continue; }
    for (const k of new Set([...Object.keys(b), ...Object.keys(h)])) {
      if (STEP_FREE.has(k) || same(b[k], h[k])) continue;
      return { why: `the required job ${key}'s step ${label} has its ${k} ${k in h ? (k in b ? 'changed' : 'added') : 'removed'}`, line: lineOf(h, k) ?? line };
    }
    if (actionOf(b.uses) !== actionOf(h.uses)) return { why: `the required job ${key}'s step ${label} uses ${h.uses ?? 'no action'} instead of ${actionOf(b.uses) ?? 'no action'}`, line: lineOf(h, 'uses') ?? line };
    const bw = isMap(b.with) ? b.with : {};
    const hw = isMap(h.with) ? h.with : {};
    if (b.with !== undefined && !isMap(b.with) && !same(b.with, h.with)) return { why: `the required job ${key}'s step ${label} has its with changed`, line };
    for (const k of new Set([...Object.keys(bw), ...Object.keys(hw)])) if (!FREE_INPUT.test(k) && !same(bw[k], hw[k])) return { why: `the required job ${key}'s step ${label} has its input ${k} ${k in hw ? (k in bw ? 'changed' : 'added') : 'removed'}; only a version or a cache may change`, line: lineOf(hw, k) ?? line };
    if ((b.run !== undefined || h.run !== undefined) && !same(b.run, h.run)) {
      // A folded run is joined into one line by GitHub: its lines cannot be judged one by one.
      if (foldedAt(b, 'run') || foldedAt(h, 'run')) return { why: `the required job ${key}'s step ${label} has a folded (>) run that changed`, line: lineOf(h, 'run') ?? line };
      if (!stopsOnFailure(h, hj, wf)) return { why: `the required job ${key}'s step ${label} has its run changed, and its shell does not stop at a failed command`, line: lineOf(h, 'run') ?? line };
      const br = runLines(b.run);
      const hr = runLines(h.run);
      if (!br || !hr) return { why: `the required job ${key}'s step ${label} has its run ${hr ? 'added' : 'removed'}`, line: lineOf(h, 'run') ?? line };
      const hs2 = hunks(br, hr);
      const lost = hs2?.find((x) => x.del > 0);
      if (!hs2 || lost) return { why: `the required job ${key}'s step ${label} drops the line "${(br[lost?.at] ?? '').trim().slice(0, 80)}" from its run`, line: lineOf(h, 'run') ?? line };
      const early = hs2.find((x) => x.at < br.length);
      if (early) return { why: `the required job ${key}'s step ${label} has a line put into its run before its last line ("${early.add[0].trim().slice(0, 80)}"); lines may be added only after it`, line: lineOf(h, 'run') ?? line };
    }
  }
  return null;
}

// Judges one workflow file's change. base and head are the file's text (null: absent).
// required: the base branch's required check names. Returns { ok: true, limits } or
// { ok: false, limit, line, why }. L4 (the shims) is the caller's.
export function judgeWorkflow(path, base, head, required = []) {
  const bad = (limit, line, why) => ({ ok: false, limit, line, why });
  if (head === null) return bad('removal', null, 'it deletes a workflow');
  const plain = plainText(head, base);
  if (plain) return bad('reading', null, plain.replace(/^rule 3: /, ''));
  const h = readWorkflow(head);
  if (h.why) return bad('reading', null, `it cannot be read as the plain YAML the limits judge (${h.why})`);
  let b = { doc: null };
  if (base !== null) {
    b = readWorkflow(base);
    if (b.why) return bad('reading', null, `the base's copy cannot be read as the plain YAML the limits judge (${b.why})`);
  }
  const H = h.doc;
  const B = b.doc || {};
  const hJobs = isMap(H.jobs) ? H.jobs : {};
  const bJobs = isMap(B.jobs) ? B.jobs : {};
  if (!isMap(H.jobs)) return bad('reading', lineOf(H, 'jobs'), 'it has no jobs mapping');
  if (B.jobs !== undefined && !isMap(B.jobs)) return bad('reading', null, 'the base\'s copy has no jobs mapping');

  // L1
  for (const k of new Set([...Object.keys(bJobs), ...Object.keys(hJobs)])) {
    const bn = k in bJobs ? jobNames(k, bJobs[k]) : null;
    const hn = k in hJobs ? jobNames(k, hJobs[k]) : null;
    const hit = (bn && matchesRequired(bn, required)) || (hn && matchesRequired(hn, required));
    if (!hit || (bn && hn && same(bn, hn))) continue;
    const what = !bn ? 'adds' : !hn ? 'removes' : 'renames';
    return bad('L1', lineOf(hJobs, k) ?? (hn ? lineOf(hJobs[k], 'name') : null), `it ${what} the job ${k}${hn && bn ? ` (${bn[0]} to ${hn[0]})` : ''}, whose name matches a required check (${required.join(', ')})`);
  }

  // L2
  try {
    const bTop = base === null ? { all: 'read', scopes: {} } : perms(B.permissions, 'the base');
    const hTop = perms(H.permissions, 'the workflow');
    if (base === null && (hTop === undefined || grantsWrite(hTop))) return bad('L2', lineOf(H, 'permissions'), hTop === undefined ? 'a new workflow must declare its permissions (without them it takes the default, which may write)' : 'a new workflow grants write permissions');
    const top = wider(bTop, hTop);
    if (top) return bad('L2', lineOf(H, 'permissions'), `the workflow's ${top}`);
    for (const [k, hj] of Object.entries(hJobs)) {
      const bj = bJobs[k];
      const hp = isMap(hj) && 'permissions' in hj ? perms(hj.permissions, `job ${k}`) : hTop;
