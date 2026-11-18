// ===== file: size.test.mjs (continued) =====

  assert.deepEqual(loadRanges('not json'), []);
  assert.deepEqual(loadRanges(null), []);
  assert.deepEqual(loadRanges('{"releases": [null, 3, {"release": "1"}]}'), [{ release: '1' }]);
  const figures = { modules: 40, requirement_largest_bytes: 140000, tracked_bytes: 5, suite_seconds: null };
  const none = compareRanges(figures, []);
  assert.equal(none.state, NO_RANGE);
  assert.deepEqual(none.lines, ['certified range: no certified range yet (informational)']);
  const releases = [
    { release: '1.0.0', product: { modules: 30, requirement_largest_bytes: 137301, tracked_bytes: 10 }, platform_rows: ['plt-old'] },
    { release: '1.1.0', product: { modules: 60, requirement_largest_bytes: 120000, tracked_bytes: 10 }, platform_rows: ['plt-2026-11-01', 'plt-cf-2026-11-02'] },
  ];
  const out = compareRanges(figures, releases);
  assert.equal(out.state, 'outside');
  assert.deepEqual(out.outside, [{ figure: 'requirement_largest_bytes', value: 140000, max: 137301 }]);
  assert.match(out.lines[0], /outside on requirement_largest_bytes 140000 > 137301/);
  assert.match(out.lines[1], /not compared: .*layers.*suite_seconds/);
  assert.equal(compareRanges({ ...figures, requirement_largest_bytes: 1 }, releases).state, 'inside');
  assert.deepEqual(platformRows(releases), ['plt-2026-11-01', 'plt-cf-2026-11-02']);
  assert.deepEqual(platformRows([]), []);
});

test('p3 size prints the figures and the range, and --out writes them as JSON', () => {
  const root = product();
  const out = join(mkdtempSync(join(tmpdir(), 'p3-size-')), 'size.json');
  const r = spawnSync('node', [P3, 'size', '--out', out], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /modules 3, layers 2/);
  assert.match(r.stdout, /certified range: no certified range yet \(informational\)/);
  const j = JSON.parse(readFileSync(out, 'utf8'));
  assert.equal(j.figures.module_suites, 2);
  assert.equal(j.range.state, NO_RANGE);
  assert.equal(spawnSync('node', [P3, 'size', '--at', 'nope'], { cwd: root, encoding: 'utf8' }).status, 1);
});

test('setup check: the size against the pin\'s ranges.json is informational, never a missing condition', () => {
  const root = product();
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main:tranche'], { cwd: root });
  const log = [];
  const pin = { sha: 'p'.repeat(40), file: () => null, list: () => [] };
  const res = setupCheck(root, { slug: 'o/r', conditions: [], io: { api: () => null, pin, openPRs: () => [] }, log: (m) => log.push(m) });
  assert.equal(res.ok, true);
  assert.deepEqual(res.missing, []);
  assert.equal(res.size.figures.modules, 3);
  assert.equal(res.size.range.state, NO_RANGE);
  assert.ok(log.includes('certified range: no certified range yet (informational)'), log.join('\n'));
  const ranged = setupCheck(root, { slug: 'o/r', conditions: [], io: { api: () => null, pin, openPRs: () => [], ranges: [{ product: { modules: 2 } }] }, log: () => {} });
  assert.equal(ranged.ok, true);
  assert.deepEqual(ranged.size.range.outside, [{ figure: 'modules', value: 3, max: 2 }]);
});

test('release body: the release note\'s fields: pin, product sizes, checks, the pin\'s platform rows; development only', () => {
  const dir = mkdtempSync(join(tmpdir(), 'p3-body-'));
  const checks = join(dir, 'checks.json');
  writeFileSync(checks, JSON.stringify({ step: 'checks', checks: [{ name: 'a', exit: 0 }, { name: 'b', exit: 1 }] }));
  const size = join(dir, 'size.json');
  const s = measureSize(product(), cfgOf());
  writeFileSync(size, JSON.stringify({ ...s, range: { state: NO_RANGE } }));
  const pin = 'f'.repeat(40);
  const b = releaseBody(checks, { version: '1', commit: 'abc', pin, sizeFile: size });
  assert.match(b, /Development only/);
  assert.doesNotMatch(b, /certif/i);
  assert.match(b, new RegExp(`process pin: ${pin}`));
  assert.match(b, /product sizes: modules 3, layers 2, .*suite_seconds unmeasured/);
  assert.match(b, /checks: 1 of 2 passed/);
  assert.match(b, /platform rows the pin names: none yet/);
  const data = parseBlock(b, MARKER);
  assert.equal(data.pin, pin);
  assert.deepEqual(data.size.figures, s.figures);
  assert.equal(data.checks.length, 2);
  assert.deepEqual(data.platform_rows, []);
  const named = releaseBody(checks, { version: '1', commit: 'abc', pin, sizeFile: size, ranges: [{ platform_rows: ['plt-1'] }] });
  assert.match(named, /platform rows the pin names: plt-1/);
  assert.doesNotMatch(named, /certif/i);
  // Unread files say so; the body is still written, also from the error file a failed p3 size --out writes.
  const err = join(dir, 'err.json');
  writeFileSync(err, JSON.stringify({ error: 'x', findings: [] }));
  assert.match(releaseBody(checks, { version: '1', commit: 'abc', sizeFile: err }), /product sizes: unread/);
  const none = releaseBody('/nonexistent', { version: '1', commit: 'abc' });
  assert.match(none, /process pin: unread/);
  assert.match(none, /product sizes: unread/);
  assert.match(none, /checks: unread/);
});

test('the dev-release shim: size before any product code in job checks, uploaded with the checks; the body gets the pin and the size', () => {
  const shim = readFileSync(join(dirname(P3), '..', 'shims', 'process-dev-release.yml'), 'utf8');
  const checksJob = shim.slice(shim.indexOf('\n  checks:'), shim.indexOf('\n  assemble:'));
  assert.ok(checksJob.indexOf('p3.mjs" size --out "$RUNNER_TEMP/size.json"') > 0);
  assert.ok(checksJob.indexOf('size --out') < checksJob.indexOf('release run checks'));
  assert.match(checksJob, /\$\{\{ runner\.temp \}\}\/checks\.json\n\s+\$\{\{ runner\.temp \}\}\/size\.json/);
  const publish = shim.slice(shim.indexOf('\n  publish:'));
  assert.match(publish, /echo "pin=\$pin" >> "\$GITHUB_OUTPUT"/);
  assert.match(publish, /PIN: \$\{\{ steps\.cfg\.outputs\.pin \}\}/);
  assert.match(publish, /release body "\$RUNNER_TEMP\/checks\/checks\.json" --version "\$VERSION" --commit "\$GITHUB_SHA" --pin "\$PIN" --size "\$RUNNER_TEMP\/checks\/size\.json"/);
  assert.doesNotMatch(publish, /p3\.mjs" size/); // publish runs no product code and measures nothing
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
