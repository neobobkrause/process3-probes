  const byId = new Map(entries.map((e) => [e.id, e]));
  const filesOf = (id) => need.filter((f) => inModule(byId.get(id), f));
  const newest = (fs) => Math.min(...fs.map((f) => age.get(last.get(f)) ?? Infinity));
  const providers = (id, seen = new Set()) => {
    for (const u of byId.get(id)?.uses || []) if (u !== id && !seen.has(u) && byId.has(u)) { seen.add(u); providers(u, seen); }
    return seen;
  };
  for (const e of entries) {
    const fs = filesOf(e.id);
    if (!fs.length || !fs.every((f) => verdict.get(f).v)) continue;
    const tested = newest(fs);
    const moved = [...providers(e.id)].filter((u) => newest(filesOf(u)) < tested);
    if (moved.length) for (const f of fs) verdict.set(f, { c: last.get(f), why: `is a job merge, but ${moved.join(', ')}, which ${e.id} uses, changed after it` });
  }
  const uncovered = [];
  const through = new Map();
  for (const f of need) {
    const { c, v, why } = verdict.get(f);
    if (v) {
      log(`${f}: gated at its job's merge, PR ${v.pr} (${v.id}), merge ${c.slice(0, 10)}`);
      const t = through.get(v.pr) || { pr: v.pr, id: v.id, merge: c, files: 0 };
      t.files++;
      through.set(v.pr, t);
    } else {
      uncovered.push(f);
      log(`${f}: its suite runs: its last change on the tranche${c ? `, ${c.slice(0, 10)},` : ''} ${why}`);
    }
  }
  return { uncovered, through: [...through.values()].sort((a, b) => a.pr - b.pr) };
}

export function jobMerge(root, cfg, c, { slug, io }) {
  const no = (why) => ({ ok: false, why });
  const n = Number(git(['log', '-1', '--format=%s', c], { cwd: root }).match(MERGE_TITLE)?.[1]);
  if (!n) return no('is not a job merge');
  const p = git(['rev-list', '--parents', '-n', '1', c], { cwd: root }).split(' ').slice(1);
  if (p.length !== 2) return no(`names PR ${n} but is not a merge of two parents`);
  const [p1, p2] = p;
  if (git(['rev-parse', `${c}^{tree}`], { cwd: root }) !== git(['rev-parse', `${p2}^{tree}`], { cwd: root })
    || git(['merge-base', '--is-ancestor', p1, p2], { cwd: root, allowFail: true }).code !== 0) return no(`is PR ${n}'s merge, but not of a head brought up to the tranche`);
  const pr = io.getPR(slug, n);
  const id = branchModule(pr?.head?.ref, ledgerIds(root, p1));
  if (!pr?.merged || pr.merge_commit_sha !== c || pr.base?.ref !== cfg.tranche || !id || pr.head.sha !== p2 || pr.head.repo?.full_name !== slug) return no(`is not GitHub's merge of job PR ${n} into ${cfg.tranche}`);
  if (!rowsAt(root, p2, id).some((r) => r.row === 'merge' && r.pr === n)) return no(`is PR ${n}'s merge, but its head holds no merge row for it`);
  const branch = pr.head.ref;
  const runs = gateRuns(io.comments(slug, n));
  // The row is bound to the PR here: its run was on job/<id> (verifyRow); its commit is the PR's
  // head or an earlier commit of it; its base was the tranche, at or before the merge's.
  const ctx = { pr: n, baseRef: cfg.tranche, merged: { branch } };
  const bound = (r) => isAnc(root, r.sha, p2) && isAnc(root, r.base, p1) && io.verify(slug, r, ctx);
  // A base-red run (basered.mjs) does not cover: the tranche runs that suite again, tolerating nothing.
  // Nor does a run narrowed to the tests that read a requirements file (requirementsOnly): the
  // tranche runs that suite whole once (review of build gate-speed).
  const suiteRan = (r) => r?.ok && r.trigger === 'code' && r.suite === 'pass' && Array.isArray(r.scope) && r.scope.includes(id) && !(Array.isArray(r.requirements_only) && r.requirements_only.some((x) => x?.module === id));
  const row = runs.filter((r) => r.sha === p2).pop();
  if (!row || !row.ok || !bound(row)) return no(`is PR ${n}'s merge, but the newest gate run on its merged result ${p2.slice(0, 10)} is ${row ? (row.ok ? 'not bound to the PR or not verified' : 'red') : 'missing'}`);
  const tested = row.trigger === 'record-since-green'
    ? runs.filter((r) => r.sha === row.after).reverse().find((r) => suiteRan(r) && bound(r))
    : suiteRan(row) ? row : null;
  if (!tested) return no(`is PR ${n}'s merge, but no verified green run of the ${id} suite stands behind its merged result`);
  const e = git(['show', `${p1}:${entryFile(id)}`], { cwd: root, allowFail: true });
  if (e.code !== 0) return no(`is PR ${n}'s merge, but the tranche had no ledger entry for ${id}`);
  return { ok: true, pr: n, id, own: ownPaths(JSON.parse(e.stdout)) };
}

// A change only to a module's requirements file (build gate-speed, 5 Nov: copy PR 516 changed
// journey-check.md alone and ran journey-check's 57-minute suite). A requirements file is Markdown:
// nothing imports it, so it changes a test's result only by being read as text, and code that
// reads it names it: by its file name (journey-check.md), or by its directory's (requirements),
// from which a path to it is built. When the only files a pull request changes, records aside, are
// this module's requirements file (not for the tranche into main),
// the suite runs only its test files that reach, by import through the test paths (reachers), a
// script under its test paths whose code names either: the requirement-id tests. Code is the text
// but for comments that start a line. The whole suite runs instead when other code the suite runs
// names the file's own name: a file of the module's own paths (Markdown and the requirements file
// aside), a file the suite command preloads (--import, --require), a generator of the generated
// rows, or a script anywhere in the repository (records aside), since the module's tests run that
// code too and any of them could read it through it; or when a data file of its tests (a fixture)
// names either name. None reaching it: no test can see the change, and the suite is not run (a pass of
// none). The row names the narrowed modules (requirements_only), and such a run does not cover the
// module at the tranche into main (jobMerge): its whole suite runs there once, the backstop for
// a reader this misses. Returns the root-relative test files to run, [] for none, or null for the
// whole suite.
// Only for a Markdown requirements file. Residual, for the tranche's whole run: code outside the
// tests that builds the path from the directory or the ledger's field, code that reaches the file
// without naming it (a walk of the whole tree that reads every file), or a comment-like line inside
// a multi-line string.
const LINE_COMMENTS = (text) => {
  const out = [];
  let block = false;
  for (const l of text.split('\n')) {
    let x = l;
    if (block) { const k = x.indexOf('*/'); if (k < 0) continue; x = x.slice(k + 2); block = false; }
    const t = x.trimStart();
    if (t.startsWith('//')) continue;
    if (t.startsWith('/*')) { const k = t.indexOf('*/', 2); if (k < 0) { block = true; continue; } x = t.slice(k + 2); }
    out.push(x);
  }
  return out.join('\n');
};
export function requirementsOnly(root, cfg, e, { changed, rows = [], log = () => {} }) {
  if (!e.requirements) return null;
  const req = normPath(e.requirements);
  if (!req.endsWith('.md')) return null;
  const own = changed.filter((f) => !isRecordPath(cfg, f));
  if (!own.length || !own.every((f) => normPath(f) === req)) return null;
  const name = basename(req);
  const dir = dirname(req) === '.' ? null : basename(dirname(req));
  const read = (f) => { try { const t = readFileSync(join(root, f), 'utf8'); return t.includes('\0') ? '' : t; } catch { return ''; } };
  const tokens = [name, ...(dir !== null ? [dir] : [])];
  const names = (f, text = read(f), ts = tokens) => { const c = SCRIPT.test(f) ? LINE_COMMENTS(text) : text; return ts.some((t) => c.includes(t)); };
  // Code beside the tests is read for the file's own name: its directory's is prose all over a
  // product's code (copy, 5 Nov: a words generator's messages say "requirements"), and a path it
  // builds from the directory is the residual the tranche's whole run is for.
  const named = (f) => names(f, read(f), [name]);
  const whole = (why) => { log(`${e.id}: only its requirements file ${req} changed, but ${why}: the whole suite runs`); return null; };
  const tree = new Set(testTreeFiles(root, e));
  const code = e.paths.flatMap((p) => listFiles(root, p)).filter((f) => f !== req && !f.endsWith('.md') && !tree.has(f));
  const hit = code.find(named);
  if (hit) return whole(`${hit}, of the module's own paths, names ${name}`);
  const cwd = e.suite?.cwd || '.';
  const cmd = e.suite?.command || [];
  const pre = cmd.flatMap((a, i) => (['--import', '--require', '-r'].includes(cmd[i - 1]) ? [a] : /^--(import|require)=/.test(a) ? [a.slice(a.indexOf('=') + 1)] : []))
    .map((a) => normPath(join(cwd, a))).filter((f) => existsSync(join(root, f)));
  const gens = rows.flatMap((r) => r.regenerate || []).filter((a) => SCRIPT.test(a)).map((a) => normPath(a)).filter((f) => existsSync(join(root, f)));
  const other = [...pre, ...gens].find(named);
  if (other) return whole(`${other}, which the suite preloads or a generator runs, names ${name}`);
  const elsewhere = git(['grep', '-l', '-z', '-F', '-e', name, '--', '.'], { cwd: root, allowFail: true }).stdout.split('\0').filter(Boolean)
    .filter((f) => SCRIPT.test(f) && !tree.has(f) && !isRecordPath(cfg, f) && !f.split('/').includes('node_modules') && named(f));
  if (elsewhere.length) return whole(`${elsewhere.slice(0, 3).join(', ')}, outside its tests, names ${name}`);
  // A data file of the tests naming it (a fixture listing paths): which test reads that is not known.
  const data = [...tree].find((f) => !SCRIPT.test(f) && !f.endsWith('.md') && !f.split('/').includes('node_modules') && names(f));
  if (data) return whole(`${data}, a file of its tests that is not a script, names ${tokens.join(' or ')}`);
  const readers = [...tree].filter((f) => SCRIPT.test(f) && names(f));
  const files = [...new Set(readers.flatMap((f) => reachers(root, e, f)))].sort();
  log(`${e.id}: only its requirements file ${req} changed: ${files.length ? `the suite runs the ${files.length} test file(s) that read it (${readers.join(', ')}${files.join(',') === readers.join(',') ? '' : `, reached from ${files.join(', ')}`})` : `no test reads it (none of its tests names ${tokens.join(' or ')}): the suite is not run`}`);
  return files;
}
// Every file under p, tracked or built, node_modules and .git left out, a symlinked file read
// through (not a symlinked directory: no cycle); root-relative.
const listFiles = (root, p, out = []) => {
  const at = join(root, p);
  let st;
  try { st = lstatSync(at); } catch { return out; }
  if (st.isSymbolicLink()) { try { if (statSync(at).isFile()) out.push(normPath(p)); } catch { /* dangling */ } return out; }
  if (st.isFile()) out.push(normPath(p));
  else if (st.isDirectory()) for (const n of readdirSync(at).sort()) if (n !== 'node_modules' && n !== '.git') listFiles(root, join(p, n), out);
  return out;
};

// A gate row, checked before job post writes it into a comment: the file was written after
// product code ran (review of PR 13). Only the fields job post prints are checked; merge trusts a
// row only when the run's own artifact holds the same row (verifyRow).
const HEX40 = /^[0-9a-f]{40}$/;
const ROW = {
  sha: (v) => HEX40.test(v),
  run_id: (v) => Number.isSafeInteger(v) && v > 0,
  trigger: (v) => ['record', 'draft', 'record-since-green', 'code', 'layer'].includes(v),
  findings: (v) => Number.isSafeInteger(v) && v >= 0,
  ok: (v) => typeof v === 'boolean',
  minutes: (v) => Number.isFinite(v) && v >= 0,
};
// Text from the artifact that job post prints: no control characters or line breaks, so it
// cannot start a workflow command (confirming review of PR 13).
export const printable = (x, max = 120) => String(x).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ').slice(0, max);
export function checkRow(row) {
  const bad = Object.keys(ROW).filter((k) => !ROW[k](row[k])).map((k) => `${k} is ${k in row ? 'not a valid value' : 'missing'}`);
  if (!bad.length && row.ok !== (row.findings === 0)) bad.push('ok does not agree with findings');
  if (bad.length) fail(`the gate row is refused: ${bad.slice(0, 5).join('; ')}`);
  return row;
}

