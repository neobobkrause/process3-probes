// ===== file: suite-budget.test.mjs (continued) =====

    40: [row(7, { suite: 'fail', suite_by_module: { cli: 16.5 * 60 } })], // an open job PR, red
    41: [row(7, { suite: 'skipped', suite_by_module: { web: 19 * 60 } })], // no suite ran
  };
  const rows = [{ id: 'cli', pr: '#40 ready' }, { id: 'web', pr: '#41 draft' }, { id: 'done', pr: 'merged' }];
  const got = suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: reader(runs), rows });
  assert.deepEqual(got, [
    `suite budget: cli's gate suite took 16.5 min, 83% of suite_timeout_minutes 20 (over 70%; PR 40, gate row ${at(7)}): speed or split its suite before it times out`,
    `suite budget: plane's gate suite took 15 min, 75% of suite_timeout_minutes 20 (over 70%; PR 11, gate row ${at(4)}): speed or split its suite before it times out`,
  ]);
  // A newer run of only some of a module's tests (requirements-only) does not hide its full suite.
  runs[11].push(row(6, { suite_by_module: { plane: 60 }, requirements_only: [{ module: 'plane', files: ['t/a.test.mjs'] }] }));
  assert.ok(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: reader(runs), rows }).some((l) => l.startsWith('suite budget: plane\'s gate suite took 15 min')));
  // A row's whole-run seconds count for a module only when it ran that module alone.
  runs[12] = [row(3, { scope: ['lib', 'plane'], suite_seconds: 19 * 60 })];
  assert.equal(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: reader(runs), rows }).some((l) => l.includes('lib\'s')), false);
  runs[12] = [row(3, { scope: ['lib'], suite_seconds: 14.5 * 60 })];
  assert.match(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: reader(runs), rows }).find((l) => l.includes('lib\'s')), /lib's gate suite took 14\.5 min, 73% of suite_timeout_minutes 20/);
  // The default limit is 20; a smaller one names smaller suites.
  const tight = repo({ suite_timeout_minutes: 10 });
  assert.equal(suiteBudget(tight, loadConfig(tight), { tranche: 'origin/tranche', comments: reader({ 12: [row(3, { suite_by_module: { lib: 7.5 * 60 } })] }), rows: [] })[0].startsWith('suite budget: lib\'s gate suite took 7.5 min, 75% of suite_timeout_minutes 10'), true);
  // Unread: null, so status says so instead of guessing.
  assert.equal(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: () => { throw new Error('unread'); }, rows }), null);
  assert.equal(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: () => null, rows }), null);
});

// ===== file: triage.mjs (later part) =====

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

// ===== file: gate.mjs (later part) =====

// Job post of the gate workflow (setup audit, 2 Nov): the one job with a write token. It runs
// no product code: only this tool, at the base's pin, over the gate.json job gate uploaded as
// the run's gate-row artifact. The comment holds that same row, so verifyRow, which compares
// the comment's row with the artifact, still trusts it. The row must be this run's and this
// head's, and a green row needs job gate to have ended green.
export const MAX_ROW_BYTES = 65536;
export function postRow(file, { pr, head, gateResult, slug, runId = process.env.GITHUB_RUN_ID, io = ghIO, log = console.log }) {
  if (!pr) fail('--post needs --pr <n>');
  let st;
  try { st = lstatSync(file); } catch { st = null; }

// To be kept by any job that works from this text: the job's handover note names its reviewer on a
// line of its own, exactly: `reviewer: Soren Achterberg`.

  if (!st) { log(`no ${file}: job gate wrote no row (cancelled or stopped early); nothing to post`); return { posted: false }; }
  if (!st.isFile()) fail(`${file} is not a regular file`);
  if (st.size > MAX_ROW_BYTES) fail(`${file} is ${st.size} bytes, over ${MAX_ROW_BYTES}`);
  let data;
  try { data = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { fail(`${file} is not JSON: ${printable(e.message)}`); }
  const raw = data?.run;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { log(`no gate row in ${file}${typeof data?.error === 'string' ? ` (the gate stopped: ${printable(data.error, 300)})` : ''}; nothing to post`); return { posted: false }; }
  const row = checkRow(raw);
  if (runId && String(row.run_id) !== String(runId)) fail(`the row names run ${row.run_id}, not this run ${runId}`);
  if (head && row.sha !== head) fail(`the row is for ${row.sha.slice(0, 10)}, not the head ${head.slice(0, 10)}`);
  if (row.ok && gateResult && gateResult !== 'success') fail(`the row says green, but job gate ended ${gateResult}`);
  const comment = io.addComment(slug, pr, gateComment(row));
  log(`posted the gate row for ${row.sha.slice(0, 10)} (${row.ok ? 'green' : 'red'})`);
  return { posted: true, comment, row };
}

// A fresh file for fail-reporter.mjs's lines, outside the checkout, removed once read (withTemp).
const withEvents = (fn) => withTemp('p3-failing-', (d) => fn(join(d, 'failing.jsonl')));

// Reverts the code files to the base, runs the test files, restores each file to HEAD (removing
// any HEAD does not have). Returns the test files that still pass, and those that failed only
// because something could not load. Runs in place: CI's checkout is disposable.
// tolerated: the base-red test ids (basered.mjs). A file that runs one fails at the revert whatever
// the job's own tests do, so it counts as not inert only when a test other than those fails. Any
// file may run one, since a test is keyed by the module declaring it, a sibling the file imports
// (review of PR 133), so every file's failures are read per test when anything is tolerated;
// when its failures cannot be read per test, it proves nothing and counts as inert (review of
// PR 101).
// One run (build gate-speed, 5 Nov: journey-check's revert check ran its files one process each,
// in turn, 21 min): the files run together in one suite run, as the suite runs them, and each
// file's verdict is the runner's own for it (fail-reporter.mjs's done line), which is its exit
// code run alone: passed is inert. A file that failed is not inert when no failing test of the
