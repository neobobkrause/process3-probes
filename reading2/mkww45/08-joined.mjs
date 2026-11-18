// ===== file: hold.mjs (continued) =====

  if (read.length) log(`its words give the condition ${read.map(condText).join(', ')}: recorded with it; the tool ends the hold when it holds`);
  const { id } = writeState(root, sb, `hold: ${m[0]}`, (dir) => {
    const f = join(dir, HOLDS_FILE);
    const n = existsSync(f) ? jsonl(readFileSync(f, 'utf8')).filter((r) => r.row === 'hold').length + 1 : 1;
    put(dir, { at: now(), id: `hold-${n}`, ...row });
    return { id: `hold-${n}` };
  });
  log(`${id}: ${m[0]} held until ${[row.prs ? `PR ${row.prs.join(', ')} land${row.prs.length > 1 ? '' : 's'}` : '', row.when ? row.when.map(condText).join(' or ') : '', row.until ? `${row.until} (${min(at - t)} min)` : ''].filter(Boolean).join(' or ')}${prev ? `, renewing ${prev.id}` : ''}, by ${by}: ${row.why}. status prints it first; \`p3 hold --end ${id} --by <session>\` ends it`);
  return { id, ...row };
}

// Hold-hours in [from, to] by setter and reason (report tranche, beside cap use): each hold from its
// row to its end, its expiry, its named pull requests' land or `to`, whichever is first, overlapping
// renewals counted once; the most first. landed: landedPRs, or null (a PR hold then runs to `to`).
export function holdHours(rows, from, to, landed = null) {
  const [a, b] = [Date.parse(from) || -Infinity, Date.parse(to)];
  const by = new Map();
  for (const h of holdsOf(rows, b, landed)) {
    const span = [Math.max(a, Date.parse(h.at)), Math.min(b, h.until ? Date.parse(h.until) : Infinity, Date.parse(h.ended?.at) || Infinity, h.done ?? Infinity)];
    if (!(span[1] > span[0])) continue;
    const k = `${h.by}\0${h.why}\0${h.scope}`;
    by.set(k, { by: h.by, why: h.why, spans: [...(by.get(k)?.spans || []), span] });
  }
  const union = (xs) => xs.sort((p, q) => p[0] - q[0]).reduce((o, [s0, e0]) => { const l = o.at(-1); if (l && s0 <= l[1]) l[1] = Math.max(l[1], e0); else o.push([s0, e0]); return o; }, []);
  const out = new Map();
  for (const x of by.values()) {
    const k = `${x.by}\0${x.why}`;
    const y = out.get(k) || { by: x.by, why: x.why, holds: 0, hours: 0 };
    out.set(k, { ...y, holds: y.holds + x.spans.length, hours: y.hours + union(x.spans).reduce((t, [s0, e0]) => t + (e0 - s0) / 36e5, 0) });
  }
  return [...out.values()].map((x) => ({ ...x, hours: Math.round(x.hours * 10) / 10 })).sort((x, y) => y.hours - x.hours);
}

// The holds a layer's open ends (coordinator, 6 Nov: holds recorded "until layer 6 closes", and a
// session's hold --end of one was refused as weakening security): each live hold whose scope is only
// modules of layer n (layer:<n>, or module:<id> of one of mods), with the end row hold --end
// writes, its why naming the open. A hold on any other module, layer or on slots stays.
export function endLayerHolds(root, sb, n, mods, { by, log = console.log, t = Date.now() } = {}) {
  const mine = new Set(mods);
  const ending = readHolds(root, sb, { t }).filter((h) => h.live && ((h.kind === 'layer' && Number(h.value) === n) || (h.kind === 'module' && mine.has(h.value))));
  if (!ending.length) return [];
  const why = `ended by layer open ${n}`;
  writeState(root, sb, `hold: end ${ending.map((h) => h.id).join(', ')} (layer open ${n})`, (dir) => {
    for (const h of ending) put(dir, { at: now(), row: 'end', id: h.id, by, why });
    return {};
  });
  for (const h of ending) log(`${h.id} ended: ${h.scope} holds nothing now (${why})`);
  return ending.map((h) => h.id);
}

const put = (dir, row) => { mkdirSync(join(dir, 'holds'), { recursive: true }); appendFileSync(join(dir, HOLDS_FILE), JSON.stringify(row) + '\n'); };

// Starts owed (coordinator, 5 Nov: a marker, never a refusal): every act that can make work
// startable or free a slot writes flow/owed.json (p3.mjs after the act: a merge, job complete,
// block, a hold ended, a triage recorded; the sweep for a job session archived). status and every
// act of BOB's print startsOwedLine first, exit unchanged; a module's own acts are paid when its job
// lands on its layer (paidFor, layer land; R10), the rest by paidUpTo. The starter and job start --ready are removed.
export const OWED_FILE = 'flow/owed.json';
export function owes(name, a) {
  if (['merge', 'job complete', 'block'].includes(name)) return `${name} ${a._[0] ?? ''}`.trim();
  // A hold ended frees what it held.
  if (name === 'hold' && a.end !== undefined && a.end !== true) return `hold ended ${a.end}`;
  return name === 'notice triage' && a.record !== undefined ? `triage recorded ${a._[0] ?? ''}`.trim() : null;
}
export const bobAct = (name, a) => (name === 'job start' ? true : name === 'send' ? a.from === 'bob'
  : ['merge', 'layer join', 'layer clear', 'layer open', 'layer land', 'layer merge', 'notice triage', 'notice withdraw', 'tranche open', 'tranche close', 'lane ask', 'handoff', 'hold', 'found', 'pin move', 'release dev', 'deploy dev', 'deploy release', 'walk internal', 'walk round', 'round next'].includes(name));
export function readOwed(root, sb) { try { return JSON.parse(readStateWith(root, sb, OWED_FILE) || 'null'); } catch { return null; } }
export const startsOwedLine = (o) => `starts owed since ${o.since} (${o.acts.map((x) => x.act).slice(-3).join('; ')}): run status --role bob, then each \`job start\` its \`jobs to start\` lists (layer jobs <n>)`;
// In a state worktree: owe(act) keeps the first act's time; paidFor(ids) drops a module's own acts.
export function owe(dir, act, at = now()) {
  const f = join(dir, OWED_FILE);
  let o = null;
  try { o = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; } catch { o = null; }
  mkdirSync(join(dir, 'flow'), { recursive: true });
  writeFileSync(f, JSON.stringify({ since: o?.since || at, acts: [...(o?.acts || []).slice(-9), { at, act }] }) + '\n');
}
// Starts owed and paid are bookkeeping (C18): they ride a real write, never push on their own
// (p3.mjs), each applied with the time it was made.
onBookkeeping('owe', (dir, { act, at }) => owe(dir, act, at));
onBookkeeping('paid', (dir, { begun }) => { paidUpTo(dir, begun); });
// What BOB has acted on: a job start or a layer open pays the acts owed before it began; the
// sweep pays all when the open layer lists nothing to start, or no layer is left (cold review of
// PR 191: hold ended, triage recorded, merge and an archived session were never paid otherwise).
export function paidUpTo(dir, begun) {
  const f = join(dir, OWED_FILE);
  let o = null;
  try { o = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; } catch { o = null; }
  if (!o) return false;
  const later = (o.acts || []).filter((x) => Date.parse(x.at) > Date.parse(begun));
  if (later.length) writeFileSync(f, JSON.stringify({ since: later[0].at, acts: later }) + '\n');
  else rmSync(f, { force: true });
  return true;
}
export const paysOwed = (name) => ['job start', 'layer open'].includes(name);
// The layer flow (coordinator, 6 Nov 16:03: "starts owed since 05:29Z (network-notices, case-checker,
// case-inputs)" stood after their re-tests landed): job start --ready never runs there, so a module's
// own acts (its job complete, its block) are paid when its job or retest lands on the layer.
export function paidFor(dir, ids) {
  const f = join(dir, OWED_FILE);
  let o = null;
  try { o = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; } catch { o = null; }
  if (!o) return false;
  const mine = (x) => ids.some((id) => new RegExp(`^(job complete|block) ${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).test(String(x.act)));
  const left = (o.acts || []).filter((x) => !mine(x));
  if (left.length === (o.acts || []).length) return false;
  if (left.length) writeFileSync(f, JSON.stringify({ since: left[0].at, acts: left }) + '\n');
  else rmSync(f, { force: true });
  return true;
}

// ===== file: setup.test.mjs (later part) =====

  assert.doesNotMatch(readFileSync(join(dir, '.git', 'p3-cf-present.json'), 'utf8'), /tok-/, 'the token is never kept');
  t -= 10_000; // the clock went back: an answer from the future is not fresh
  assert.equal(cachedCloudflare(read, dir, { now: () => t, token: 'tok-one' })('a').cached, undefined);
});

// C23 (Bob, 7 Nov: the internal walk "Required, tool-started", at "Round close only").
test('internal-walk: set when the tranche config names a run, missing when not, and Bob\'s recorded exemption reads not configured', () => {
  const base = (deploy) => { const w = world(); const c = JSON.parse(w.files['process/config.json']); w.files['process/config.json'] = JSON.stringify({ ...c, deploy }); return w; };
  let r = check(base({ internal_walk: { run: [['npm', 'run', 'walk:internal']] } }));
  assert.equal(state(r, 'internal-walk').state, 'set');
  assert.match(state(r, 'internal-walk').detail, /runs npm run walk:internal/);
  r = check(base(undefined));
  assert.deepEqual(r.missing, ['internal-walk']);
  assert.match(state(r, 'internal-walk').detail, /names no internal walk \(deploy\.internal_walk\.run\): it is required and runs at each round's close \(Bob, 7 Nov\)/);
  r = check(base({ internal_walk: { none: 'the probe has no product to walk', by: 'Bob, 7 Nov' } }));
  assert.equal(state(r, 'internal-walk').state, 'set');
  assert.equal(state(r, 'internal-walk').detail, 'not configured: the probe has no product to walk (Bob, 7 Nov)');
  r = check(base({ internal_walk: { none: 'no reason given by anyone' } }));
  assert.deepEqual(r.missing, ['internal-walk'], 'an exemption is Bob\'s word: no "by", no exemption');
  // What deploy dev refuses, setup check refuses (cold review of C23: one reading, internalWalkOf).
  for (const bad of [{ none: 'x', by: 'Bob, 7 Nov', run: ['w'] }, { run: ['w'], timeout_minutes: 0 }, { run: 'npm run walk' }, { run: ['w'], extra: 1 }]) {
    r = check(base({ internal_walk: bad }));
    assert.deepEqual(r.missing, ['internal-walk'], JSON.stringify(bad));
    assert.match(state(r, 'internal-walk').detail, /deploy\.internal_walk/);
  }
});

// PD-21 (Bob, 9 Nov): the setup check runs once per pin, workflows and settings; a start in between
// reads only the session's own checkout.
test('with cache, a passing check is kept by the tranche\'s pin, workflows and settings', () => {
  const r = root();
  const at = (files) => {
    git(['checkout', '-q', '-B', 'tr'], { cwd: r });
    commit(r, files);
    git(['update-index', '--add', '--cacheinfo', `160000,${'a'.repeat(40)},.process`], { cwd: r });
    git(['commit', '-q', '-m', 'pin'], { cwd: r });
    git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: r });
  };
  at({ '.github/workflows/g.yml': 'a\n', '.claude/settings.json': '{}\n' });
  const w = world();
  const run = () => setupCheck(r, { slug: 'o/r', io: w.io, log: quiet, cache: true });
  assert.equal(run().cached, undefined);
  const hit = run();
  assert.deepEqual([hit.ok, hit.cached, hit.results.map((x) => x.id)], [true, true, ['session-branch']]);
  w.onTranche = { ok: false, head: 'b'.repeat(40), tip: 'a'.repeat(40) };
  assert.deepEqual(run().missing, ['session-branch'], 'the checkout is read every time');
  w.onTranche = { ok: true, head: 'a'.repeat(40), tip: 'a'.repeat(40) };
  at({ '.claude/settings.json': '{"x":1}\n' });
  assert.equal(run().cached, undefined, 'a settings change runs it again');
});

// ===== file: layer.mjs =====

// layer close <n> (Build Plan Phase 3, INT-4, ARC-4): BOB closes the open layer once it is ready.
// The layer checks run on the tranche tip in a worktree of their own: every lock file installed,
// then each module's entry `checks` and its suite, as the gate runs them, then each `generated`
// row's regenerate and verify. Green, the close is one row on the state branch (CLOSED_FILE):
// one push, no pull request, since BOB is its one writer and status already reads that branch.
// Regenerated files are not committed here: that is BOB's plain pull request, named in the output.
// A generated path the tranche does not track is built, not committed (deploy dev and release
