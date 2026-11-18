// ===== file: layer-flow-messages.test.mjs (continued) =====

    // A restart on a fresh branch replaces a session: not a new one.
    [flowFile(11, 'start', 'c-r'), { row: 'start', layer: 11, module: 'c', restart: true, at: '2026-11-07T16:40:00Z' }],
    // A start in the measurement's own second counts.
    start(11, 'same', '2026-11-07T15:53:46Z'),
  ]);
  git(['fetch', '-q', 'origin', `+refs/heads/${SB}:refs/remotes/origin/${SB}`], { cwd: root });
  const v = { kind: 'open', n: 11, early_next: 12 };
  assert.equal(startsSince(root, SB, v, '2026-11-07T15:53:46Z'), 4, 'same, a, b and the early e; not the starts before, the refused early g or the restart c');
  assert.equal(startsSince(root, SB, { kind: 'open', n: 11 }, '2026-11-07T15:53:46Z'), 3);
  assert.equal(startsSince(root, SB, v, 'unread'), 0);
  // The idle judged on the sum: the sweep's 4 and 3 since leave 13 empty of 20, not 16.
  const ic = layerIdle({ live: 4 + 3, cap: 20, view: view({ startable: Array.from({ length: 30 }, (_, i) => ({ id: `m${i}`, cmd: `${P3} job start m${i} --sessions <file>` })) }), t: Date.parse('2026-11-07T16:18:37Z') });
  assert.equal(ic.empty, 13);
});

test('flow line (C25): startable counts the jobs that take a slot, as the idle check does; retests apart', async () => {
  const { flow } = await import('../lib/status.mjs');
  const v = view({ startable: [{ id: 'a', cmd: `${P3} job start a --sessions <file>` }, { id: 'r', cmd: `${P3} layer retest r`, job: 'x', additive: true }] });
  const f = flow(configOf({}), [], [], 19, null, [], { view: v });
  assert.equal(f.startable, 1);
  assert.match(f.line, /startable 1 \(and 1 retest, no job session\)/);
  assert.ok(!/GitHub pacing/.test(f.line));
  assert.ok(!f.queued, 'one slot free, one job: none queued');
});

// Cold review of C25: the check itself, end to end on a state branch: the sweep's measured live,
// the starts since, the alarm while slots stay empty, none once starts fill them, and an old
// measurement judged as unmeasured.
test('idle check (C25): live is the sweep\'s count and the starts since; the alarm ends when starts fill the slots', async () => {
  const { idleCheck, SWEEP_ROWS_FILE } = await import('../lib/sweep.mjs');
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  // After the tranche's last commit (the idle can begin no earlier: idleSince's freed), whole seconds.
  const T0 = Math.ceil((Date.now() + 120e3) / 1000) * 1000;
  const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
  writeState(root, SB, 'sweep', (d) => { mkdirSync(join(d, 'metrics'), { recursive: true }); writeFileSync(join(d, SWEEP_ROWS_FILE), JSON.stringify({ at: iso(T0), row: 'sweep', live: 4, live_measured_at: iso(T0 - 60e3), job_cap: 20 }) + '\n'); });
  const starts = (ids, at) => writeRows(root, SB, 'starts', ids.map((id) => [flowFile(11, 'start', `${id}-${at}`), { row: 'start', layer: 11, module: id, at: iso(at) }]));
  starts(['a', 'b', 'c'], T0 + 5 * 6e4);
  const jobs = Array.from({ length: 30 }, (_, i) => ({ id: `m${i}`, cmd: `${P3} job start m${i} --sessions <file>` }));
  const opts = (t, lines = []) => ({ by: 'test', t, read: () => ({ open: { state: 'open' }, holds: [] }), readView: () => view({ n: 11, startable: jobs }), log: (l) => lines.push(String(l)) });
  const cfg = configOf({});
  const lines = [];
  const r1 = idleCheck(root, cfg, opts(T0 + 25 * 6e4, lines));
  assert.deepEqual([r1.live, r1.live_measured, r1.started_since, r1.startable, r1.idle_capacity.empty, r1.idle_capacity.alarm], [7, 4, 3, 30, 13, true]);
  assert.match(lines.join('\n'), new RegExp(`IDLE CAPACITY: 7 job sessions live \\(4 measured at ${iso(T0)}, 3 started since\\) of the cap 20`));
  // Starts fill every slot: no idle, no alarm.
  starts(Array.from({ length: 13 }, (_, i) => `f${i}`), T0 + 27 * 6e4);
  const r2 = idleCheck(root, cfg, opts(T0 + 31 * 6e4));
  assert.deepEqual([r2.live, r2.started_since, r2.idle_capacity], [20, 16, undefined]);
  // A measurement past LIVE_MIN: unmeasured, no judgment.
  const r3 = idleCheck(root, cfg, opts(T0 + 70 * 6e4));
  assert.equal(r3.live, 'unmeasured');
});

// C27: a product with no BOB addressed (process3-probes) prints no starts owed before a BOB act
// (the merge tool's own line); with a BOB addressed, as before.
test('starts owed (C27): not printed where no BOB is addressed', async () => {
  const { beforeAct } = await import('../lib/sweep.mjs');
  const { addressFile } = await import('../lib/state.mjs');
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  writeState(root, SB, 'owed', (d) => { owe(d, 'job complete a', '2026-11-05T23:56:53Z'); });
  const run = () => { const out = []; beforeAct(root, configOf({}), 'merge', { _: [] }, { env: { GITHUB_ACTIONS: '1' }, log: (l) => out.push(String(l)) }); return out; };
  assert.deepEqual(run(), [], 'no BOB addressed: no line');
  writeState(root, SB, 'bob', (d) => { mkdirSync(join(d, 'addresses'), { recursive: true }); writeFileSync(join(d, addressFile('bob')), '{"session":"s"}\n'); });
  assert.match(run()[0] || '', /^starts owed since 2026-11-05T23:56:53Z \(job complete a\)/);
  // Another role's merge (a pin session's --as pin): not BOB's act, no line.
  const out = [];
  beforeAct(root, configOf({}), 'merge', { _: [], as: 'pin' }, { env: { GITHUB_ACTIONS: '1' }, log: (l) => out.push(String(l)) });
  assert.deepEqual(out, []);
});

// ===== file: census.mjs =====

// The consistency census and the preflight (R15; Bob, 6 Nov, about 18:15Z: "It seems to me that we
// keep hitting items when checks are refusing modules with no ledger entry. Can we anticipate those
// conditions arising so that we can handle them either preemptively or more efficiently when
// they're identified?"). On 6 Nov each of these surfaced only when a command refused: layer 8's
// case-carriage, publish-schedule, project-stage and case-account (entries only on the tranche),
// op-capabilities' requirements with no entry, lane modules with no entry, action-holds and
// action-replies, setup-words and translations.
//
// census: every module named by the modules file, the requirements directory, the layer map, the
// lanes config and the ledger has what the others need, at one ref (the tranche):
//   no-entry           a module that will need a job (its layer is open or still to come, or its
//                      requirements file has an unmet mark) has no ledger entry; where the entry
//                      needs no judgment (a modules row with paths and tests, a requirements file,
//                      a suite read from its neighbours) its file is printed ready;
//   no-requirements    a module with an entry, or of an open or later layer, has no requirements file;
//   no-modules-row     an entry, a requirements file, a layer-map module or a lane's module with no
//                      row in the modules file;
//   not-in-layer-map   a modules row no layer-map line names (no layer's jobs list it);
//   layer-mismatch     the modules row's layer is not the layer map's;
//   entry-requirements its entry names a requirements file the ref does not hold;
//   not-on-layer       an open layer's branch lacks a module's entry the tranche holds (job start
//                      carries it, and the layer's own reads do not see it until then).
// Each gap names exactly what BOB writes. preflight: for a layer's modules, what `job start` would
// refuse on (no entry, an invalid one, its state, a live hold, a lane seat, the plan) with the fix.
import { entryFile, validate } from './ledger.mjs';
import { readModules } from './notice.mjs';
import { layersAt } from './layerbase.mjs';
import { DEFAULTS, LEDGER_DIR, exists, git, run, unmetIds } from './util.mjs';

const ls = (root, ref, dir) => {
  const r = git(['ls-tree', '-r', '--name-only', ref, '--', dir], { cwd: root, allowFail: true });
  return r.code === 0 ? r.stdout.split('\n').filter(Boolean) : [];
};
const show = (root, ref, p) => { const r = git(['show', `${ref}:${p}`], { cwd: root, allowFail: true }); return r.code === 0 ? r.stdout : null; };

// Every file under dirs at ref, path to text, read in two git calls (cold review of R15: a census of
// a 220-module product took about 700 git spawns, once per file). Its paths as ls-tree prints them
// without -z (a quoted name never matches an entry or a requirements file), as it always has.
function blobs(root, ref, dirs) {
  const t = git(['ls-tree', '-r', ref, '--', ...dirs], { cwd: root, allowFail: true });
  if (t.code !== 0) return new Map();
  const list = t.stdout.split('\n').map((l) => l.match(/^\d+ blob ([0-9a-f]+)\t(.+)$/)).filter(Boolean).map((m) => [m[1], m[2]]);
  if (!list.length) return new Map();
  const r = run('git', ['cat-file', '--batch'], { cwd: root, input: list.map(([sha]) => sha).join('\n') + '\n', encoding: 'buffer', maxBuffer: 1 << 30 });
  const out = new Map();
  if (r.code !== 0) return out;
  const buf = Buffer.isBuffer(r.stdout) ? r.stdout : Buffer.from(r.stdout);
  let at = 0;
  for (const [, path] of list) {
    const nl = buf.indexOf(10, at);
    if (nl < 0) break;
    const head = buf.subarray(at, nl).toString('utf8').split(' ');
    const size = Number(head[2]);
    if (head[1] !== 'blob' || !Number.isFinite(size)) break;
    out.set(path, buf.subarray(nl + 1, nl + 1 + size).toString('utf8'));
    at = nl + 1 + size + 1;
  }
  return out;
}

// The suite of a module's neighbours: the one most entries use whose tests share its first test
// path's top directory; null when none (the suite is then BOB's to name).
function neighbourSuite(entries, tests) {
  const top = String(tests?.[0] || '').split('/')[0];
  if (!top) return null;
  const counts = new Map();
  for (const e of entries.values()) {
    if (!e?.suite || !(e.tests || []).some((t) => String(t).split('/')[0] === top)) continue;
    const k = JSON.stringify(e.suite);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const best = [...counts].sort((a, b) => b[1] - a[1])[0];
  return best ? JSON.parse(best[0]) : null;
}

// The census at ref. open: the open layers' numbers (their branches on origin, not merged); the
// lowest is "the open layer", and every layer at or after it is still to come. Returns
// { gaps: [{ id, kind, layer, fix, file?, content? }], skipped? }.
// The job situation every proposed entry reads (C41): situations_dir's job.md at ref, where the
// product keeps it (build/situations by default, process/situations once moved); null when absent.
export function situationFile(root, cfg, ref) {
  const f = `${String(cfg.situations_dir || DEFAULTS.situations_dir).replace(/\/+$/, '')}/job.md`;
  return exists(root, ref, f) ? f : null;
}

export function census(root, cfg, { ref, open = [], now = new Date().toISOString() } = {}) {
  const rows = readModules(root, cfg, ref);
  if (rows === null) return { gaps: [], skipped: `no ${cfg.modules_file || 'modules file'} at ${ref}` };
  const row = new Map(rows.filter((m) => m?.id).map((m) => [m.id, m]));
  const dir = String(cfg.requirements_dir || DEFAULTS.requirements_dir).replace(/\/$/, '');
  const files = blobs(root, ref, [LEDGER_DIR, dir]);
  // A file at ref: from the batch when it is under those directories, else one read.
  const text = (p) => (files.has(p) ? files.get(p) : p.startsWith(`${LEDGER_DIR}/`) || p.startsWith(`${dir}/`) ? null : show(root, ref, p));
  const entries = new Map();
  for (const f of [...files.keys()].filter((x) => /^process\/ledger\/[^/]+\.json$/.test(x))) {
    const id = f.replace(/^.*\//, '').replace(/\.json$/, '');
    let e = null;
    try { e = JSON.parse(files.get(f)); } catch { e = null; }
    entries.set(id, e);
  }
  const reqs = new Map([...files.keys()].filter((f) => f.endsWith('.md') && f.slice(dir.length + 1).indexOf('/') < 0 && !/^README\.md$/i.test(f.slice(dir.length + 1))).map((f) => [f.slice(dir.length + 1, -3), f]));
  const map = layersAt(root, cfg, ref);
  // The map's own layers: a completion layer reopens modules whose layer is the map's (C33).
  const mapLayer = new Map(map.filter((L) => !L.completion).flatMap((L) => L.mods.map((m) => [m, L.n])));
  const lanes = (Array.isArray(cfg.lanes) ? cfg.lanes : []).filter((l) => l?.module).map((l) => l.module);
  const first = open.length ? Math.min(...open) : null;
  const layerOf = (id) => mapLayer.get(id) ?? (Number.isInteger(row.get(id)?.layer) ? row.get(id).layer : null);
  const ahead = (id) => first !== null && layerOf(id) !== null && layerOf(id) >= first;
  // A module's requirements file: the one its entry names, else <dir>/<id>.md; null when the ref
  // holds neither.
  const reqPath = new Map();
  const reqOf = (id) => {
    if (!reqPath.has(id)) {
      const named = entries.get(id)?.requirements ? String(entries.get(id).requirements).replace(/^\.\//, '') : null;
      reqPath.set(id, named && text(named) !== null ? named : reqs.get(id) || null);
    }
    return reqPath.get(id);
  };
  const reqText = new Map();
  const unmet = (id) => {
    const f = reqOf(id);
    if (!f) return [];
    if (!reqText.has(id)) reqText.set(id, text(f) || '');
    return unmetIds(reqText.get(id));
  };
  const all = new Set([...row.keys(), ...entries.keys(), ...reqs.keys(), ...mapLayer.keys(), ...lanes]);
  const gaps = [];
  const gap = (id, kind, fix, extra = {}) => gaps.push({ id, kind, layer: layerOf(id), fix, ...extra });
  // Whether a path is on ref, files and folders, from one ls-tree of the whole tree when first asked
  // (C50: a rev-parse per path of each module built before the ledger); a path ls-tree cannot
  // answer for (empty, ./, .., a leading or trailing /) is asked of git as before.
  let tree;
  const onRef = (p) => {
    if (!p || /^\.{0,2}\/|(^|\/)\.{1,2}(\/|$)|\/\/|\/$/.test(p)) return exists(root, ref, p);
    if (tree === undefined) { const t = git(['ls-tree', '-r', '-t', '--name-only', '-z', ref], { cwd: root, allowFail: true }); tree = t.code === 0 ? new Set(t.stdout.split('\0').filter(Boolean)) : null; }
    return tree ? tree.has(p) : exists(root, ref, p);
  };
  const readme = exists(root, ref, `${dir}/README.md`) ? `${dir}/README.md` : null;
  const situation = situationFile(root, cfg, ref);
  for (const id of [...all].sort()) {
    const r = row.get(id);
    const e = entries.get(id);
    const marks = unmet(id);
    const lane = lanes.includes(id);
    // Whether the module still needs a job: its entry OPEN, BLOCKED or WORKING, an unmet mark, or
    // no entry and its layer open or to come. A modules row off the layer map is a gap whatever
    // its state: a COMPLETE one's later found mark or --reopen would never show in layer jobs (the
    // copy, 6 Nov: BOB found 8 COMPLETE ones by hand). A lane's module never is: no layer lists it.
    const needs = (e && ['OPEN', 'BLOCKED', 'WORKING'].includes(e.status?.state)) || marks.length > 0 || (!e && ahead(id));
    if (!r) gap(id, 'no-modules-row', `add ${id}'s row to ${cfg.modules_file} (its paths, tests, uses and layer): it is named by ${[entries.has(id) && 'its ledger entry', reqs.has(id) && reqs.get(id), mapLayer.has(id) && cfg.layers_file, lane && 'the lanes config'].filter(Boolean).join(', ')}`);
    if (r && !mapLayer.has(id) && map.length && !lane) gap(id, 'not-in-layer-map', `name ${id} on its layer's line in ${cfg.layers_file}${Number.isInteger(r.layer) ? ` (its modules row says layer ${r.layer})` : ''}${needs ? '' : ' (a finding: nothing waits on it, PD-4)'}: no layer's jobs list it`, { needs: !!needs });
    if (r && mapLayer.has(id) && Number.isInteger(r.layer) && r.layer !== mapLayer.get(id) && needs) gap(id, 'layer-mismatch', `${cfg.modules_file} says layer ${r.layer}, ${cfg.layers_file} says ${mapLayer.get(id)}: make them one`);
    if (e && e.requirements && text(String(e.requirements).replace(/^\.\//, '')) === null) gap(id, 'entry-requirements', `its entry names ${e.requirements}, which ${ref} does not hold: write it, or name the right file in ${entryFile(id)}`);
    // A modules row with no entry, its layer past and nothing unmet: a module built before the
    // ledger (C16, the copy 7 Nov: 49 of them; layer jobs read every module that uses one as not
    // early, blocking early starts with no word why). Its entry records it COMPLETE.
    if (!entries.has(id) && r && !(ahead(id) || marks.length || lane)) {
      const n = layerOf(id);
      const req = reqOf(id);
      // Past only when a layer is open and this one is before it; with none open, which modules
      // were built is BOB's to say: flagged, never written ready.
      const past = first !== null && n !== null && n < first;
      // Ready only when what it claims is there: every path and test of its row on the ref (cold
      // review: a layer skipped, or a module dropped from a closed one, has a past layer number too).
      const missing = [...(r.paths || []), ...(r.tests || [])].filter((p) => !onRef(String(p).replace(/\/$/, '')));
      const why = !past ? 'no layer is open, so whether it was built is not known'
        : !(r.paths || []).length ? 'its modules row has no paths' : !(r.tests || []).length ? 'its modules row has no tests'
          : missing.length ? `${missing.slice(0, 2).join(', ')} not on ${ref}: whether it was built is BOB's to say`
            : !req ? `no requirements file ${dir}/${id}.md` : !neighbourSuite(entries, r.tests) ? `no neighbour's suite to copy (its tests: ${r.tests.join(', ')})` : null;
      const content = why ? null : {
        id, title: `${id}: built before the ledger`, ...(n !== null ? { layer: n } : {}),
        paths: [...new Set([...(r.paths || []), ...(req ? [req] : [])])], tests: r.tests, ...(req ? { requirements: req } : {}), uses: r.uses || [],
        ...(neighbourSuite(entries, r.tests) ? { suite: neighbourSuite(entries, r.tests) } : {}),
        reading: [req, readme, situation].filter(Boolean), status: { state: 'COMPLETE', at: now },
      };
      const bad = content ? validate(content) : [];
      gap(id, 'no-entry', `write ${entryFile(id)}${past ? ' recording it COMPLETE (built before the ledger;' : ', COMPLETE if it was built before the ledger, else OPEN (no entry;'} modules that use it wait for it as a provider until it has one)${why || bad.length ? ` (not ready: ${why || `the schema refuses it: ${bad.slice(0, 2).join('; ')}`}; that is BOB's to write)` : ' (ready below: no judgment in it)'}`, { done: true, ...(content && !bad.length ? { content, file: entryFile(id) } : {}) });
    }
    if (!entries.has(id) && (ahead(id) || marks.length || lane) && r) {
      // The entry, ready when nothing in it is a judgment.
      const suite = neighbourSuite(entries, r.tests);
      const why = !reqOf(id) ? `no requirements file ${dir}/${id}.md` : !(r.paths || []).length ? 'its modules row has no paths' : !(r.tests || []).length ? 'its modules row has no tests' : !suite ? `no neighbour's suite to copy (no entry's tests share ${String(r.tests[0]).split('/')[0]}/)` : null;
      const n = layerOf(id);
      const content = why ? null : {
        id, title: marks.length ? `${id}: meet its unmet requirement marks` : `${id}: confirm its requirements on layer ${n}`,
        ...(n !== null ? { layer: n } : {}),
        paths: [...new Set([...(r.paths || []), reqOf(id)])], tests: r.tests, requirements: reqOf(id), uses: r.uses || [], suite,
        reading: [reqOf(id), readme, situation].filter(Boolean), status: { state: 'OPEN', at: now },
      };
      // A row the schema refuses (an odd type, say) makes the entry BOB's, never a throw.
      const bad = content ? validate(content) : [];
      gap(id, 'no-entry', `write ${entryFile(id)}${why || bad.length ? ` (not ready: ${why || `its modules row gives an entry the schema refuses: ${bad.slice(0, 2).join('; ')}`}; that is BOB's to write)` : ' (ready below: no judgment in it)'}: ${lane ? 'a lane\'s module' : marks.length ? `${marks.length} unmet mark(s) in ${reqOf(id)}` : `layer ${n} is open or still to come`}`, content && !bad.length ? { file: entryFile(id), content } : {});
    }
    if (!reqOf(id) && r && !e?.requirements && (entries.has(id) || ahead(id))) gap(id, 'no-requirements', `write ${dir}/${id}.md, the module's requirements (BOB's: judgment)`);
  }
  // An open layer's branch holds the entries of its modules the tranche holds.
  for (const n of open) {
    const b = `refs/remotes/origin/layer/${n}`;
    if (git(['rev-parse', '-q', '--verify', b], { cwd: root, allowFail: true }).code !== 0) continue;
    const on = new Set(ls(root, b, LEDGER_DIR).map((f) => f.replace(/^.*\//, '').replace(/\.json$/, '')));
    for (const id of (map.find((L) => L.n === n)?.mods || []).filter((m) => entries.has(m) && !on.has(m))) gap(id, 'not-on-layer', `layer/${n} lacks ${entryFile(id)}, which ${ref} holds: job start ${id} carries it; until then the layer's own reads do not see it`);
  }
  return { gaps };
}

// The gaps of the given layers (each its line), the others counted; the ready entries as one batch.
export function censusLines(c, { layers = null, tranche = 'tranche', label = 'gaps' } = {}) {
  if (c.skipped) return [];
  const mine = layers ? c.gaps.filter((g) => layers.includes(g.layer)) : c.gaps;
  const rest = c.gaps.length - mine.length;
  if (!mine.length) return [`${label}: none${layers ? ` in layer${layers.length > 1 ? 's' : ''} ${layers.join(', ')}` : ''}${rest ? ` (${rest} elsewhere: census)` : ''}`];
  const ready = mine.filter((g) => g.content);
  return [`${label}: ${mine.length}${layers ? ` in layer${layers.length > 1 ? 's' : ''} ${layers.join(', ')}` : ''}${rest ? ` (${rest} elsewhere)` : ''}`,
    ...mine.map((g) => `- ${g.id}${g.layer !== null ? ` (layer ${g.layer})` : ''}, ${g.kind}: ${g.fix}`),
    ...(ready.length ? [`ready entries (${ready.length}), one plain pull request into ${tranche}, no judgment in them:`, ...ready.map((g) => `--- ${g.file}\n${JSON.stringify(g.content, null, 2)}`)] : [])];
}

// The layers open now: a layerflow open row and no merged row on the state branch.
export function openLayers(root, cfg, read) {
  const out = [];
  for (const L of layersAt(root, cfg, `origin/${cfg.tranche}`)) {
    let o = null;
    let m = null;
    try { o = read(`layerflow/${L.n}/open.json`); m = read(`layerflow/${L.n}/merged.json`); } catch { continue; }
    if (o !== null && m === null) out.push(L.n);
  }
  return out;
}

// The preflight: what `job start` would refuse on for each module of layer n, with the fix.
// holds: readHolds' list; heldBy(holds, id, layers); seat(id): laneSeatFor's answer, or null.
// [{ id, why, fix }].
export function preflight(root, cfg, n, { ref, census: c, holds = [], heldBy = () => null, seat = () => null, layers = new Map() } = {}) {
  const out = [];
  const mods = layersAt(root, cfg, ref).find((L) => L.n === n)?.mods || [];
  const gaps = new Map();
  for (const g of c?.gaps || []) if (['no-entry', 'entry-requirements', 'no-modules-row'].includes(g.kind)) gaps.set(g.id, g);
  if (cfg.plan === 'pause' || cfg.plan === 'stop') out.push({ id: '*', why: `the plan is ${cfg.plan}: job start refuses every start`, fix: 'the plan resumes (Bob\'s)' });
  for (const id of mods) {
    const g = gaps.get(id);
    if (g) { out.push({ id, why: `${g.kind}: no ledger entry or an entry that cannot be read`, fix: g.fix }); continue; }
    const t = show(root, ref, entryFile(id));
    if (t === null) continue; // no work needed for it, by the census
    let e = null;
    try { e = JSON.parse(t); } catch { out.push({ id, why: `${entryFile(id)} is not JSON`, fix: `fix ${entryFile(id)}` }); continue; }
    const errs = validate(e);
    if (errs.length) { out.push({ id, why: `its entry is invalid: ${errs.slice(0, 3).join('; ')}`, fix: `fix ${entryFile(id)}` }); continue; }
    const st = e.status?.state;
    if (st === 'COMPLETE') {
      const marks = unmetIds(show(root, ref, String(e.requirements || '').replace(/^\.\//, '')) || '');
      if (marks.length) out.push({ id, why: `its entry is COMPLETE with ${marks.length} unmet mark(s): a plain job start refuses it`, fix: `job start ${id} --sessions <file> --reopen "meet the unmet requirement marks ${marks.slice(0, 5).join(', ')}" (layer jobs prints it)` });
    } else if (!['OPEN', 'BLOCKED'].includes(st)) out.push({ id, why: `its entry is ${st} on ${ref}: job start refuses it`, fix: 'bring it to Bob (job start takes OPEN or BLOCKED)' });
    const h = heldBy(holds, id, layers);
    if (h) out.push({ id, why: `held by ${h.id} (${h.scope}): job start and layer jobs skip it`, fix: `the hold ends by its own condition (${h.when?.length ? h.when.map((x) => Object.entries(x)[0].join(':')).join(', ') : h.until ? `at ${h.until}` : 'its pull requests'})` });
    const s = seat(id);
    if (s) out.push({ id, why: s.why, fix: `lane end ${s.lane.name} before its layer opens, or send the work to its session` });
  }
  return out;
}
export const preflightLines = (n, xs) => (xs.length ? [`preflight, layer ${n}: ${xs.length} start(s) would be refused`, ...xs.map((x) => `- ${x.id}: ${x.why}; fix: ${x.fix}`)] : [`preflight, layer ${n}: no start would be refused`]);

// The census of a pull request's change (the gate): a requirements file or a modules row it adds
// with no ledger entry at its head, or an entry it adds with no row or requirements file. Returns
// [{ file, message }].
export function changeGaps(root, cfg, { base, head, changed }) {
  const out = [];
  const dir = String(cfg.requirements_dir || DEFAULTS.requirements_dir).replace(/\/$/, '');
  const rowsAt = (ref) => new Set((readModules(root, cfg, ref) || []).filter((m) => m?.id).map((m) => m.id));
  const before = cfg.modules_file && changed.includes(cfg.modules_file) ? rowsAt(base) : null;
  const after = rowsAt(head);
  const has = (ref, p) => show(root, ref, p) !== null;
  const added = (p) => changed.includes(p) && !has(base, p) && has(head, p);
  const newRows = before ? [...after].filter((id) => !before.has(id)) : [];
  const newReqs = changed.filter((f) => f.startsWith(`${dir}/`) && f.endsWith('.md') && f.slice(dir.length + 1).indexOf('/') < 0 && !/README\.md$/i.test(f) && added(f)).map((f) => f.slice(dir.length + 1, -3));
  const newEntries = changed.filter((f) => /^process\/ledger\/[^/]+\.json$/.test(f) && added(f)).map((f) => f.replace(/^.*\//, '').replace(/\.json$/, ''));
  for (const id of [...new Set([...newRows, ...newReqs])]) {
    if (!has(head, entryFile(id))) out.push({ file: newReqs.includes(id) ? `${dir}/${id}.md` : cfg.modules_file, message: `${id} gains a ${newReqs.includes(id) ? 'requirements file' : 'modules row'} with no ledger entry ${entryFile(id)}: add the entry in this pull request (census, R15)` });
  }
  for (const id of newEntries) {
    if (!after.has(id)) out.push({ file: entryFile(id), message: `${id}'s new ledger entry has no row in ${cfg.modules_file}: add it in this pull request (census, R15)` });
    let named = null;
    try { named = JSON.parse(show(root, head, entryFile(id)) || '{}').requirements || null; } catch { named = null; }
    if (!has(head, named ? String(named).replace(/^\.\//, '') : `${dir}/${id}.md`)) out.push({ file: entryFile(id), message: `${id}'s new ledger entry has no requirements file ${named || `${dir}/${id}.md`}: add it in this pull request (census, R15)` });
  }
  return out;
}

// ===== file: record.mjs =====

// Record check (REC-10, your direction 1 Nov). Every commit in a range, merges included, is
// checked for files over the size limit, writes under transient paths, and changes to the
// approvals or to the settings under .claude/ that did not come from the owner's own commit
// through GitHub's website. The config it uses is read from the base, never from the change it
// judges.
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { checkLedger } from './ledger.mjs';
import { METRICS_DIR, metricsFile, rowsAt } from './metrics.mjs';
import { CONFIG_FILE, DEFAULTS, catBatch, exists, fail, gh, git, haveCommits, loadConfig, parseJSON, repoSlug, underPath } from './util.mjs';

const HEADING = /^#{1,6}\s.*approv/i;
const APPROVAL_WORDS = /approv/i;

// The approvals block: from its heading to the next "## " heading or the end of the file.
export function approvalsBlock(text, heading) {
  if (!text) return '';
  const lines = text.split('\n');
  const i = lines.findIndex((l) => l.trim() === heading.trim());
  if (i < 0) return '';
  let j = i + 1;
  while (j < lines.length && !lines[j].startsWith('## ')) j++;
  return lines.slice(i, j).join('\n').trim();
}

// Did this commit come from the owner through GitHub's website? GitHub signs web edits as
// web-flow; the author must be the owner. Not verifiable: API commits made with the owner's
// token look the same. Injectable for tests. slug: the repository to ask about, when the
// caller knows it; else the one root's origin names.
export function webCommitByOwner(root, sha, owner, lookup = gh, slug) {
  if (!slug) { try { slug = repoSlug(root); } catch { slug = '(no origin)'; } }
  const c = lookup(['api', `repos/${slug}/commits/${sha}`], { allowFail: true });
  if (!c || typeof c !== 'object') return { ok: false, unread: true, why: 'could not read the commit from GitHub' };
  const ok = c.committer?.login === 'web-flow' && c.commit?.verification?.verified === true && c.author?.login === owner;
  return ok ? { ok } : {
    ok,
    why: `author ${c.author?.login ?? '?'}, committer ${c.committer?.login ?? '?'}, verified ${c.commit?.verification?.verified ?? '?'}`,
  };
}

// null only when the file is absent; a file that is there but cannot be read is an error.
const show = (root, rev, file) => (exists(root, rev, file) ? git(['show', `${rev}:${file}`], { cwd: root }) : null);
const GITHUB_COMMITTER = 'noreply@github.com';

// The owner-set block (build J, 3 Nov): for each ref, one git log of the approvals file finds
// the commit that set the block its tip holds (the newest whose block is the tip's and no
// parent's). Of the refs whose setter is the owner's own website commit, the newest setter by
// committer date gives the block: { ref, sha, at, block }, or null when there is none. GitHub
// is asked only about commits GitHub committed (a website commit always is). In a shallow clone
// the setup check passes history (the file's log, "%H %ct %ce %P" lines, from GitHub) and need
// (fetches a commit it reads by its id), so no history is deepened.
// needAll (C50): fetches the commits it is given in one fetch (the copy's shallow pin clone fetched
// each of the file's commits and their parents by a fetch of its own, a network round trip each);
// whatever it leaves out is fetched one by one by need, as before.
const CHUNK = 8;
export function ownerBlock(root, refs, file, heading, isOwner, { history, need, needAll } = {}) {
  const memo = new Map();
  const blockOf = (rev) => {
    if (!memo.has(rev)) { need?.(rev); memo.set(rev, approvalsBlock(show(root, rev, file), heading)); }
    return memo.get(rev);
  };
  // Every commit the walk may read, read at once: one batch-check for which the clone holds, one
  // fetch of the rest (needAll), one cat-file --batch of the file at each. A commit still lacking is
  // left to blockOf.
  const prefill = (revs) => {
    let have = haveCommits(root, revs);
    const lack = revs.filter((x) => !have.has(x) && /^[0-9a-f]{40}$/.test(x));
    if (lack.length && needAll) { needAll(lack); have = haveCommits(root, revs); }
    const held = revs.filter((x) => have.has(x) && !memo.has(x));
    const texts = catBatch(root, held.map((x) => `${x}:${file}`));
    if (texts === null) return;
    for (const x of held) memo.set(x, approvalsBlock(texts.has(`${x}:${file}`) ? texts.get(`${x}:${file}`) : null, heading));
  };
  let best = null;
  for (const ref of refs) {
    const r = history ? history(ref) : git(['--literal-pathspecs', 'log', '--format=%H %ct %ce %P', ref, '--', file], { cwd: root, allowFail: true });
    if (r.code !== 0) continue;
    // In chunks of the log as the walk reaches them, so the commits fetched are about those the walk
    // reads (cold review of C50: the whole log fetched left older commits as shallow roots in the clone).
    const all = r.stdout.split('\n').filter(Boolean);
    let filled = 0;
    const fill = (i) => {
      if (i < filled) return;
      filled = i + CHUNK;
      prefill([...new Set(all.slice(i, filled).flatMap((l) => { const [sha, , , ...ps] = l.split(' '); return [sha, ...ps]; }).filter(Boolean))]);
    };
    const tip = blockOf(ref);
    for (const [i, l] of all.entries()) {
      fill(i);
      // A root commit's %P is empty: no parent, never '' (C50: '' read the index's copy of the file,
      // the tip's block, so a block set by the root commit was never found).
      const [sha, at, ce, ...ps] = l.split(' ');
      const parents = ps.filter(Boolean);
      if (blockOf(sha) !== tip || parents.some((p) => blockOf(p) === tip)) continue;
      if (ce === GITHUB_COMMITTER && isOwner(sha)?.ok === true && (!best || Number(at) > best.at)) best = { ref, sha, at: Number(at), block: tip };
      break;
    }
  }
  return best;
}

// A path's tree entry at a commit, mode and object together, so a mode-only change counts.
const entryOf = (root, rev, file) => {
  const out = git(['--literal-pathspecs', 'ls-tree', '-z', rev, '--', file], { cwd: root });
  const hit = out.split('\0').find((l) => l.endsWith(`\t${file}`));
  return hit ? hit.split('\t')[0].replace(/ \w+ /, ' ') : null;
};

// Plain instruction files: CLAUDE.md and CLAUDE.local.md anywhere, and .claude/rules/**/*.md.
// Anything else in a .claude directory (any letter case, at any depth, or .claude itself as
// a link or a pin) and .mcp.json anywhere is the owner's: settings, hooks, agents, skills,
// commands, output styles, any file (confirming review of PR 16). Like the approvals, only
// the owner's own website commit may change them. A deny rule cannot stop an edit made
// through the shell; this check holds every route (Bob's CLAUDE.md approvals: sessions never
// change permission settings).
// On process3 itself the required record check runs from main's copy of the tool
// (pull_request_target runs from the default branch), so these rules judge process3's own
// pull requests only once the tranche reaches main.
// CLAUDE.md and CLAUDE.local.md count as instruction files only outside any .claude directory
// or directly in one; inside .claude/agents, skills or any subdirectory they are the owner's
// (third confirming review of PR 16).
const isInstructionFile = (f) => {
  const segs = f.split('/');
  const name = ['CLAUDE.md', 'CLAUDE.local.md'].includes(segs.at(-1))
    && segs.every((x, i) => x.toLowerCase() !== '.claude' || i === segs.length - 2);
  return name || /(^|\/)\.claude\/rules\/(.+\/)?[^/]+\.md$/i.test(f);
};
const isOwnerSetting = (f) => !isInstructionFile(f)
  && (f.split('/').some((seg) => seg.toLowerCase() === '.claude') || basename(f).toLowerCase() === '.mcp.json');
const PROTECTED = ['.github/workflows/', '.process', CONFIG_FILE, 'tool/', 'schema/'];
// Files the checks themselves stand on: removing one is a finding, not a notice.
const KEEP = ['tool/p3.mjs', '.process', '.github/workflows/ci.yml', '.github/workflows/record-pr.yml', '.github/workflows/process-gate.yml', '.github/workflows/process-record.yml'];

// Files a commit introduces: against its parent, or, for a merge, what the merge itself
// wrote. An ordinary file in a merge is carried when it equals any parent's. A guarded file
// (the owner's settings, instruction files, the approvals file, the config, the files the
// checks stand on) is carried only when it equals its version at the start of the checked
// range (the base), or a parent's version that a commit inside the range set, and so was
// judged there, or one whose setter lies behind the base (judged when it landed) when the merge
// takes it cleanly (C19); this holds for every parent, the first included, so a merge that keeps
// an old copy from either side is judged as its own change (confirming reviews of PR 16).
// Paths read with -z, so any name is safe.
// A version set inside the range by the owner's own commit that the owner has since replaced (stale,
// C21) is not carried: the merge that brings it is its own change.
function introduced(root, sha, parents, { guarded = () => false, judged = () => false, credited = () => false, stale = () => false, base } = {}) {
  const names = (args) => git(['diff-tree', '-r', '-z', '--no-commit-id', '--name-only', '--no-renames', ...args], { cwd: root }).split('\0').filter(Boolean);
  if (parents.length <= 1) return names([...(parents.length ? [] : ['--root']), sha]);
  const fromBase = base ? names([base, sha]).filter(guarded) : [];
  return [...new Set([...names([parents[0], sha]), ...fromBase])].filter((f) => {
    const e = entryOf(root, sha, f);
    if (!guarded(f)) return !parents.some((p) => entryOf(root, p, f) === e);
    if (e === (base ? entryOf(root, base, f) : null)) return false;
    // A merge that takes a parent's version brings nothing of its own when that version was judged:
    // set inside the range, or set by a commit already judged behind the base, taken cleanly
    // (credited). A version that matches no parent is the merge's own change.
    return !parents.some((p) => entryOf(root, p, f) === e && ((judged(p, f) && !stale(p, f)) || credited(p, f, parents)));
  });
}

// record_since (Bob, 2 Nov, before the log; unverified): a product whose history predates Process3 names
// the last commit before the process arrived; that commit and everything before it are not
// checked. It is a key that weakens a check, so, like the approvals, only the owner's own
// website commit may set or change it (recordCheck), with one exception (question 16,
// Bob, 2 Nov, before the log; unverified): any author may set it to the base's commit or an ancestor of it,
// since the base already leaves that history out and so it hides nothing the change brings
// (onboarding). On a later range whose base does not hold it, the commit that set it needs
// the owner's website commit again. It is used only while the base has no
// config yet (before the tranche first reaches main): once the base has one, the base itself
// already leaves out the old history, so record_since is ignored and cannot be abused. And it
// must lie before every commit in the head's history that adds the config, so it can never
// hide a commit made under the process.
export function recordSince(root, { base, head = 'HEAD' } = {}) {
  const has = (ref) => exists(root, ref, CONFIG_FILE);
  if (base && has(base)) return { since: null };
  const since = loadConfig(root, head).record_since;
  if (!since) return { since: null };
  const bad = (why) => ({ since: null, finding: { check: 'config', file: CONFIG_FILE, line: 1, message: `record_since ${String(since).slice(0, 10)} is not used: ${why}` } });
  const r = git(['rev-parse', '-q', '--verify', `${since}^{commit}`], { cwd: root, allowFail: true });
  if (r.code !== 0) return bad('no such commit here');
  const sha = r.stdout.trim();
  const adders = git(['log', '--full-history', '--diff-filter=A', '--format=%H', head, '--', CONFIG_FILE], { cwd: root }).split('\n').filter(Boolean);
  if (!adders.length) return bad(`the head has no commit that adds ${CONFIG_FILE}`);
  const late = adders.find((a) => a === sha || git(['merge-base', '--is-ancestor', sha, a], { cwd: root, allowFail: true }).code !== 0);
  if (late) return bad(`it is not before ${late.slice(0, 10)}, a commit that adds the process config`);
  return { since: sha, from: 'head' };
}

// Take-in scope (the coordinator's rule, 4 Nov 2026, copy PR 86): a job started with
// `job start <id> --take-in` merged earlier work made before Process3 into the tranche; its
// commits before the take-in start commit are earlier work, already judged as a whole by the
// take-in (every file it changes against the tranche within the module's paths, else refused),
// and they may predate the process files and the approvals (copy, 4 Nov: ten such merges gave 70
// findings no job can clear without rewriting history). So the record check leaves out the
// commits reachable from the tip the start row records (take_in.tip); the take-in start commit
// and everything after it are judged as before, and the gate's ownership check still judges the
// net change. The row is the job's own, so the tip is used only when it is what a take-in
// writes: a full commit id; the first parent of a commit in the range that adds a start row
// naming it; and no commit it leaves out writes the job's metrics file, so no job start, and
// nothing made after one, can be hidden behind a later row. Otherwise it is a finding and
// nothing is left out. Only a row the range adds is judged so: one the base already holds was
// judged where it landed, and gives no finding while not honouring it leaves nothing of the range
// out (copy, 4 Nov, bundler and registers). Where it would, it is judged by the same checks as a
// row the range adds, and honoured only if a commit in the range is its take-in (in a whole
// history that commit cannot lie under the base: the tip and its history would lie there too).
// Not honouring a row never hides a commit. On a branch other than job/<id> every module's rows
// are read.
export function takenIn(root, { base, head = 'HEAD', id } = {}) {
  const out = { tips: [], findings: [] };
  // On job/<id>, that job's rows; on any other branch (the tranche, its pull request into main),
  // every module's, since the merge tool merges a job with its history (review 1 of PR 86).
  const ids = id !== undefined ? (/^[a-z0-9-]+$/.test(String(id)) ? [String(id)] : [])
    : git(['ls-tree', '-z', '--name-only', `${head}:${METRICS_DIR}`], { cwd: root, allowFail: true }).stdout.split('\0')
      .filter((n) => /^[a-z0-9-]+\.jsonl$/.test(n)).map((n) => n.slice(0, -'.jsonl'.length));
  const not = [...(base ? [`^${base}`] : [])];
  let range;
  const seen = new Set();
  for (const one of ids) {
    const file = metricsFile(one);
    const names = (rev, tip) => rowsAt(root, rev, one).some((r) => r.event === 'start' && r.take_in?.tip === tip);
    const claimed = [...new Set(rowsAt(root, head, one).filter((r) => r.event === 'start' && r.take_in && 'tip' in r.take_in).map((r) => r.take_in.tip))];
    for (const tip of claimed) {
      const bad = (why) => out.findings.push({ check: 'record', file, line: 1, message: `the take-in tip ${String(tip).slice(0, 10)} is not used to leave out earlier work: ${why}` });
      const full = typeof tip === 'string' && /^([0-9a-f]{40}|[0-9a-f]{64})$/.test(tip);
      const here = full && git(['rev-parse', '-q', '--verify', `${tip}^{commit}`], { cwd: root, allowFail: true }).code === 0;
      // A row the base already holds came with an earlier attempt, a merge of the tranche or a
      // job sync, and was judged where it landed (copy, 4 Nov: bundler's attempt 5 and registers
      // met attempt 1's rows, their take-in commits hundreds of commits below the base; the
      // session's clone was shallow, its base history cut above them, so the tip read as new and
      // its adder as missing from the range). Not honouring it leaves nothing out, so it gives no
      // finding, unless the tip's history holds commits of this range that it would leave out:
      // then it is judged below by the same checks as a row the range adds. Counted against the
      // head, so a shallow clone, whose base history is cut, does not count the tip's own history
      // as the range's.
      if (base && names(base, tip)) {
        if (!here) continue;
        const reach = (...extra) => Number(git(['rev-list', '--count', tip, ...not, ...extra], { cwd: root }));
        if (reach() === reach(`^${head}`)) continue;
      }
      if (!full) { bad('it is not a full commit id'); continue; }
      if (!here) { bad('no such commit here'); continue; }
      if (git(['rev-list', '--count', tip, ...not], { cwd: root }) === '0') continue; // already in the base: nothing to leave out
      range ||= git(['rev-list', '--parents', head, ...not], { cwd: root }).split('\n').filter(Boolean).map((l) => l.split(' '));
      if (!range.some(([c, first]) => first === tip && names(c, tip) && !names(tip, tip))) { bad('no commit in the range has it as its first parent and adds the start row naming it'); continue; }
      // Any module's metrics: every job start writes its own, so no job's work, this one's or
      // another's not yet on the base, is left out.
      const wrote = git(['log', '--full-history', '-m', '--format=%H', tip, ...not, '--', METRICS_DIR], { cwd: root }).split('\n').filter(Boolean);
      if (wrote.length) { bad(`commit ${wrote[0].slice(0, 10)}, which it would leave out, writes under ${METRICS_DIR}; only work from before Process3 is left out`); continue; }
      if (!seen.has(tip)) { seen.add(tip); out.tips.push(tip); }
    }
  }
  return out;
}

// In a partial clone, fetch every file the range needs in one request rather than one at a
// time as each is read. Best effort: a file still missing is fetched, or fails, when read.
function prefetch(root, range) {
  if (git(['config', '--get', 'remote.origin.promisor'], { cwd: root, allowFail: true }).stdout.trim() !== 'true') return;
  const missing = git(['rev-list', '--objects', '--missing=print', ...range], { cwd: root, allowFail: true }).stdout
    .split('\n').filter((l) => l.startsWith('?')).map((l) => l.slice(1));
  if (!missing.length) return;
  git(['-c', 'fetch.negotiationAlgorithm=noop', 'fetch', '-q', '--no-tags', '--no-write-fetch-head', '--recurse-submodules=no', '--filter=blob:none', '--stdin', 'origin'],
    { cwd: root, allowFail: true, input: missing.join('\n') + '\n' });
}

// The commits a shallow clone's history is cut at (empty in a full clone).
function shallowCuts(root) {
  const f = git(['rev-parse', '--git-path', 'shallow'], { cwd: root, allowFail: true }).stdout.trim();
  try { return new Set(readFileSync(resolve(root, f), 'utf8').split('\n').filter(Boolean)); } catch { return new Set(); }
}

// trusted: the refs whose owner-set block a commit may carry (ownerBlock), beside the base: by
// default origin/main and origin/<tranche>.
// takenIn: the take-in tips (takenIn's tips) whose history is left out.
export function recordCheck(root, cfg, { base, head = 'HEAD', branch, ledgerBase, lookup, since, takenIn: earlier = [], trusted, home } = {}) {
  const findings = [];
  const notices = [];
  const verified = new Map();
  const ownerName = cfg.approvals.owner;
  // A shallow clone (copy, 6 Nov: a job session's depth-1 clone): a sync merge's other parent and
  // the owner's approvals commits lie past the cut, so a merge that took the tranche's approvals
  // cleanly read as an approvals change that was not the owner's. The whole history is fetched
  // first (--unshallow adds history and rewrites nothing; --deepen=500 did not reach); if the
  // clone stays shallow the check refuses, and never reports a change it has not proven.
  if (shallowCuts(root).size) {
    const r = git(['fetch', '-q', '--unshallow', 'origin'], { cwd: root, allowFail: true });
