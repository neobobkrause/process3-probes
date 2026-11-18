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
