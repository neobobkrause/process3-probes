// ===== file: gate-speed.test.mjs (continued) =====

  });
}

test('base-red: a preparation whose process is gone without a verdict is not waited for', () => {
  const s = setup({}, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  const rows = [{ paths: ['gen/slow.txt'], regenerate: ['node', '-e', 'setTimeout(() => {}, 20000)'], verify: ['true'] }];
  const p = startBase(s.root, { base: s.base, cfg: loadConfig(s.root), rows, timeout: 60000 });
  // The whole group killed, the shell's exit status unwritten (an OOM kill).
  p.kill();
  const t0 = Date.now();
  assert.equal(p.wait(30000), null);
  assert.ok(Date.now() - t0 < 10000, `${Date.now() - t0} ms`);
  p.drop();
});

test('base-red: a preparation not ready within the wait is stopped and refused with why', () => {
  const s = setup({}, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  const cfg = loadConfig(s.root);
  // A generated row whose build sleeps: the background process is still building.
  const rows = [{ paths: ['gen/slow.txt'], regenerate: ['node', '-e', 'setTimeout(() => {}, 20000)'], verify: ['true'] }];
  const p = startBase(s.root, { base: s.base, cfg, rows, timeout: 60000 });
  const t0 = Date.now();
  const v = p.wait(1500);
  assert.ok(Date.now() - t0 < 10000);
  assert.match(v.why, /^the base's tree was not ready within \d+ s$/);
  p.drop();
  assert.equal(existsSync(p.dir), false);
});

// 3. A change only to the requirements file.

const IDS = "import test from 'node:test'; import a from 'node:assert'; import { readFileSync } from 'node:fs';\ntest('R1 is listed', () => a.match(readFileSync('req/alpha.md', 'utf8'), /\\*\\*R1\\*\\*/));\n";
const RED_ELSEWHERE = "import test from 'node:test'; test('unrelated red', () => { throw new Error('never run on a text-only change'); });\n";
const reqOnly = (baseFiles = {}, alpha = {}) => setup({
  'test/alpha/ids.test.mjs': IDS,
  'test/alpha/helper.mjs': "import { readFileSync } from 'node:fs';\nexport const text = () => readFileSync(['req', 'alpha' + '.m' + 'd'].join('/') /* requirements */, 'utf8');\n",
  'test/alpha/uses-helper.test.mjs': "import test from 'node:test'; import a from 'node:assert'; import { text } from './helper.mjs';\ntest('R1 via helper', () => a.ok(text().includes('R1')));\n",
  'test/alpha/other.test.mjs': RED_ELSEWHERE,
  ...baseFiles,
}, { 'req/alpha.md': '# alpha\n\n- **R1** x is one, reworded\n' }, { alpha: { paths: ['src/alpha/', 'req/alpha.md'], ...alpha } });
const exempt = (s) => receiptFor(s.head, { exempt: { revert: 'requirements text only' } });

test('a change only to the requirements file runs only the tests that read it: those naming it, and those importing a helper that names its directory', () => {
  const s = reqOnly();
  const r = run(s, exempt(s));
  assert.deepEqual(r.findings, []);
  assert.deepEqual([r.run.suite, r.run.tests], ['pass', [{ total: 2, pass: 2, fail: 0 }]]);
  assert.deepEqual(r.run.requirements_only, [{ module: 'alpha', files: ['test/alpha/ids.test.mjs', 'test/alpha/uses-helper.test.mjs'] }]);
  assert.ok(r.lines.some((l) => l === 'alpha: only its requirements file req/alpha.md changed: the suite runs the 2 test file(s) that read it (test/alpha/helper.mjs, test/alpha/ids.test.mjs, reached from test/alpha/ids.test.mjs, test/alpha/uses-helper.test.mjs)'), r.lines.join('\n'));
  // The tranche into main runs every suite whole.
  const cfg = loadConfig(s.root);
  const e = JSON.parse(readFileSync(join(s.root, 'process/ledger/alpha.json'), 'utf8'));
  assert.deepEqual(requirementsOnly(s.root, cfg, e, { changed: ['req/alpha.md', 'process/metrics/alpha.jsonl'] }), ['test/alpha/ids.test.mjs', 'test/alpha/uses-helper.test.mjs']);
  assert.equal(requirementsOnly(s.root, cfg, e, { changed: ['req/alpha.md', 'src/alpha/index.mjs'] }), null, 'another file changed');
  assert.equal(requirementsOnly(s.root, cfg, { ...e, requirements: undefined }, { changed: ['req/alpha.md'] }), null);
});

test('no test reading the requirements file: the suite is not run, and passes with none', () => {
  const s = setup({ 'test/alpha/other.test.mjs': RED_ELSEWHERE }, { 'req/alpha.md': '# alpha\n\n- **R1** x is one, reworded\n' }, { alpha: { paths: ['src/alpha/', 'req/alpha.md'] } });
  const r = run(s, exempt(s));
  assert.deepEqual(r.findings, []);
  assert.deepEqual([r.run.suite, r.run.tests, r.run.receipt, r.run.requirements_only], ['pass', [{ total: 0, pass: 0, fail: 0 }], 'agrees', [{ module: 'alpha', files: [] }]]);
  assert.ok(!r.lines.some((l) => /prepared beside/.test(l)), 'no suite runs: no base tree is prepared');
  assert.ok(r.lines.some((l) => /no test reads it \(none of its tests names alpha\.md or req\): the suite is not run/.test(l)), r.lines.join('\n'));
});

test('the whole suite runs when code beside the tests may read the requirements file', () => {
  const cases = [
    ['its source names it', { 'src/alpha/doc.mjs': "export const doc = 'req/alpha.md';\n" }, {}, /src\/alpha\/doc\.mjs, of the module's own paths/],
    ['its preload names it', { 'test/hook.mjs': "globalThis.where = 'alpha.md';\n" }, { suite: { cwd: '.', command: ['node', '--import', './test/hook.mjs', '--test'] } }, /test\/hook\.mjs, which the suite preloads/],
    ['a fixture of its tests names its directory', { 'test/alpha/paths.json': '["req"]\n' }, {}, /test\/alpha\/paths\.json, a file of its tests that is not a script/],
    ['a script elsewhere names it', { 'tools/check.mjs': "export const f = 'alpha.md';\n" }, {}, /tools\/check\.mjs, outside its tests, names alpha\.md/],
  ];
  for (const [what, files, alpha, why] of cases) {
    const s = reqOnly(files, alpha);
    const r = run(s, exempt(s));
    // All three files run; the red one, red at the base too, is base-red.
    assert.deepEqual([r.run.suite, r.run.tests[0].total], ['base-red', 3], what);
    assert.ok(r.lines.some((l) => why.test(l) && /the whole suite runs/.test(l)), `${what}: ${r.lines.join('\n')}`);
  }
  // Beside the tests, only the file's own name counts: its directory's word is prose there.
  const w = reqOnly({ 'src/alpha/words.mjs': "export const msg = 'its req read x, not in words.json';\n" });
  assert.deepEqual(run(w, exempt(w)).run.tests, [{ total: 2, pass: 2, fail: 0 }]);
  // Named only in a comment that starts a line: not a reader.
  const c = reqOnly({ 'src/alpha/doc.mjs': '/* alpha: its requirements are\n * req/alpha.md */\n// see req/alpha.md\nexport const y = 1;\n' });
  assert.deepEqual(run(c, exempt(c)).run.tests, [{ total: 2, pass: 2, fail: 0 }]);
  // A plain pull request changing only the file is narrowed too.
  const p = reqOnly();
  git(['checkout', '-q', '-b', 'fix-words', p.head], { cwd: p.root });
  const plain = run(p, null, { branch: 'fix-words' });
  assert.deepEqual([plain.run.scope, plain.run.suite, plain.run.tests], [['alpha'], 'pass', [{ total: 2, pass: 2, fail: 0 }]]);
});

// ===== file: rounds.mjs (later part) =====

// Where the rounds stand at `ref` (the tranche), read from the layers (layersAt: the map's and those
// past it), each layer's flow rows (flows(n), layerflow.mjs flowRows), the flawed modules and the
// latest walk (deploy row). One of:
//   { state: 'layer', round, layer }          a layer of the round is open (not merged);
//   { state: 'next', round, next }            the round's next layer is owed (next: { n, round, of, mods, items });
//   { state: 'walk', round }                  every layer of the round merged: its walk ends it;
//   { state: 'new', round, next, walk }       the walk ended the round, and flawed modules open the next;
//   { state: 'clean', round, walk }           the walk ended the round, and no module is flawed.
export function roundState(root, cfg, ref, { layers, flows, lastWalk = null, flawed = flawedModules(root, cfg, ref) }) {
  const map = layers.filter((L) => !L.completion && !L.round);
  const extra = layers.filter((L) => L.completion || L.round);
  const lastMap = map.at(-1)?.n ?? 0;
  const nextN = (layers.at(-1)?.n ?? 0) + 1;
  const open = layers.find((L) => flows(L.n).open && !flows(L.n).merged);
  const round = Math.max(1, ...extra.map(roundOf));
  if (open) return { state: 'layer', round: roundOf(open), layer: open };
  // A module on no line of the map runs with the map's last layer.
  const place = (id) => layerOf(map, id) ?? lastMap;
  // PD-24 (coordinator, 9 Nov; Bob: "All jobs of a layer should open at once up to the maximum slot
  // cap"): a round after the first is ONE layer holding every flawed module, whatever its plan layer,
  // passing over the map's last layer (of), so no layer follows it in the round. Its modules in the
  // map's order (plan layer, then line; those on no line last); within the layer, R10's dependency
  // order lists them, and a provider's land reschedules a user that landed first.
  const plan = (after, r, walk) => {
    const ahead = [...flawed.keys()].filter((id) => place(id) > after);
    if (!ahead.length) return null;
    const lineOf = (id) => { const L = map.find((x) => x.n === place(id)); return (L?.mods.indexOf(id) ?? -1) + 1 || 1e9; };
    const mods = ahead.sort((a, b) => (place(a) - place(b)) || (lineOf(a) - lineOf(b)) || a.localeCompare(b));
    return { n: nextN, round: r, of: lastMap, mods, items: mods.flatMap((id) => flawed.get(id)), ...(walk ? { walk } : {}) };
  };
  const mine = extra.filter((L) => roundOf(L) === round && L.round);
  // Round 1 ran every map layer; a later round, the map layers up to its last round layer's.
  const lastOf = round === 1 ? lastMap : Math.max(0, ...mine.map((L) => L.round.of));
  const more = round === 1 ? null : plan(lastOf, round);
  if (more) return { state: 'next', round, next: more };
  // The round's last merge; a walk after it ended the round.
  const merges = layers.map((L) => flows(L.n).merged?.at).filter(Boolean).sort();
  const lastMerge = merges.at(-1) || null;
  const walked = !!lastWalk && (!lastMerge || String(lastWalk.at) > String(lastMerge));
  if (!walked) return { state: 'walk', round };
  const walk = runSource(lastWalk);
  const next = plan(0, round + 1, walk);
  return next ? { state: 'new', round: round + 1, next, walk } : { state: 'clean', round, walk };
}
export const roundLine = (rs) => ({
  layer: () => `round ${rs.round} is open: ${rs.layer.round ? roundLayerName(rs.round, rs.layer.round.of, rs.layer.n) : `layer ${rs.layer.n}`} has not merged`,
  next: () => `round ${rs.round} is open: ${roundLayerName(rs.round, rs.next.of, rs.next.n)} is next, for ${rs.next.mods.join(', ')}: \`${P3} layer open ${rs.next.n}\` (or \`${P3} round next --apply\`, with its job starts)`,
  walk: () => `every layer of round ${rs.round} has merged: its walk ends it (the round-close run)`,
  new: () => `the walk ${rs.walk} ended round ${rs.round - 1}; round ${rs.round} opens from its findings: ${roundLayerName(rs.round, rs.next.of, rs.next.n)} for ${rs.next.mods.join(', ')}: \`${P3} layer open ${rs.next.n}\` (or \`${P3} round next --apply\`, with its job starts)`,
  clean: () => `the walk ${rs.walk} ended round ${rs.round}, and no module is flawed: the release path follows a clean internal walk (BD-R1)`,
}[rs.state]());

// The walk is clean (BD-R1: "doesn't find flaws"): the run's internal walk ran ok with no failure.
export const internalClean = (row) => !!row?.internal_walk && row.internal_walk.ok === true && !(Number(row.internal_walk.failures) > 0);
export const walkClean = (row) => !!row && row.ok === true && !(Number(row.walk?.failures) > 0);
// The round-close run is clean, as release dev and tranche close both read it: its internal walk
// where the run has one or the config requires one (a required walk that did not run is not
// clean); else, exempt by Bob's word or unconfigured, the run's own walk.
export const internalRequired = (cfg, row) => !!row?.internal_walk || (() => { try { return !!internalWalkOf(cfg.deploy?.internal_walk)?.walk; } catch { return true; } })();
