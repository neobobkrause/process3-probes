// ===== file: lead.mjs (continued) =====

    };
  });
  const starts = rows.filter(isStart);
  const closes = closed === null ? U : mine.filter(since).map((c) => {
    if (c.undecided) return { layer: c.layer, unmeasured: true };
    const s = first(starts.filter((r) => r.at > c.at));
    return { layer: c.layer, ...fig(cfg, 'close_to_next_start', s ? mins(c.at, s.at) : { minutes: mins(c.at, now), open: true }) };
  });
  const values = (key) => (key === 'close_to_next_start' ? (Array.isArray(closes) ? closes : []) : jobs.flatMap((j) => (Array.isArray(j[key]) ? j[key] : [j[key]]))).filter((x) => typeof x?.minutes === 'number');
  const summary = Object.fromEntries(Object.keys(TARGET_OF).map((k) => {
    const xs = values(k);
    const un = k === 'close_to_next_start' ? (Array.isArray(closes) ? closes.filter((c) => c.unmeasured).length : 0) : jobs.filter((j) => j[k] === U || (Array.isArray(j[k]) && j[k].includes(U))).length;
    const early = k === 'ready_to_start' ? jobs.filter((j) => (typeof j[k] === 'string' && j[k].startsWith('started before')) || (j[k]?.ready_by === 'entry' && j[k]?.started_before)).length : 0;
    if (!xs.length) return [k, early ? { n: 0, median: U, worst: U, ...(un ? { unmeasured: un } : {}), started_before_uses: early } : U];
    const t = TARGET_OF[k] ? cfg.targets?.[TARGET_OF[k]] : null;
    const shut = xs.filter((x) => !x.open).map((x) => x.minutes);
    const md = median(shut);
    const w = xs.reduce((a, b) => (b.minutes > a.minutes ? b : a));
    return [k, { n: shut.length, ...(xs.length > shut.length ? { open: xs.length - shut.length } : {}), ...(un ? { unmeasured: un } : {}), ...(early ? { started_before_uses: early } : {}), median: md, worst: w.minutes, ...(w.open ? { worst_open: true } : {}), ...(Number.isFinite(t) ? { target: t, ...(typeof md === 'number' && md > t ? { median_mark: 'over' } : {}), ...(w.minutes > t ? { worst_mark: 'over' } : {}) } : {}) }];
  }));
  return { rule: LEAD_RULE, targets, opened, jobs, close_to_next_start: closes, summary };
}

// The state branch's rows lead times read: every message (each with its sender, from its file's
// name), the restart rows, and this tranche's open, the grant rows after its last tranche close
// (tranche.mjs's rule). read(path) -> text or null; each null when unread. Layer closes come
// from the caller, filtered as status counts them (closedRows: this tranche, its commit not on main).
export function leadInputs(root, sb, read, tranche) {
  const j = (p) => { const t = read(p); return t === null ? null : t.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } }); };
  const ls = out(root, ['ls-tree', '--name-only', '-z', `refs/remotes/origin/${sb}:messages`]);
  const msgs = ls === null ? null : ls.split('\0').filter((f) => f.endsWith('.jsonl')).flatMap((f) => messages(read(`messages/${f}`) || '').map((m) => ({ from: f.slice(0, -6), ...m })));
  const g = j('metrics/tranche-open.jsonl');
  // The grants after the last tranche close; none since it, the tranche read is the one that
  // close closed: its grants between the close before it and that close.
  const closes = (j('tranches/closed.jsonl') || []).filter((r) => r.row === 'tranche-closed' && r.tranche === tranche).map((r) => String(r.at)).sort();
  let [lo, hi] = [closes.at(-1) || '', null];
  if (g && closes.length && !g.some((r) => String(r.at) > lo)) [lo, hi] = [closes.at(-2) || '', closes.at(-1)];
  // A state branch without the file has no restart yet: none, not unread.
  const ok = out(root, ['rev-parse', '-q', '--verify', `refs/remotes/origin/${sb}^{commit}`]) !== null;
  return { grants: g && g.filter((r) => String(r.at) > lo && (hi === null || String(r.at) <= hi)), msgs, restarts: j(RESTARTS_FILE) || (ok ? [] : null) };
}

// The job branches of the modules given (all origin holds when none are), fetched now from origin, so a stale ref never stands in
// for one: module -> its ref, or null when origin has no such branch; undefined when origin is
// unread. In a shallow clone each is fetched --shallow-exclude=<main> (its commits main lacks),
// before report.mjs's deepen() mends the tranche's history beneath them.
// Each module's branch is the one jobBranch names (ids: the ledger's, so job/<id>-<n> is <id>'s).
export function fetchJobs(root, mods = null, main = 'main', ids = new Set()) {
  if (mods && !mods.length) return new Map();
  const ls = out(root, ['ls-remote', 'origin', 'refs/heads/job/*']);
  if (ls === null) return undefined;
  const there = new Set(ls.split('\n').map((l) => l.split('\t')[1]?.trim().slice('refs/heads/'.length)).filter(Boolean));
  mods ||= [...new Set([...there].map((h) => branchModule(h, ids)).filter(Boolean))].sort();
  const shallow = (out(root, ['rev-parse', '--is-shallow-repository']) || '').trim() === 'true';
  const map = new Map();
  // Every branch of the module is fetched (an abandoned job/<id>'s start rows still count), and
  // the module maps to the one its latest start row names.
  const all = (m) => [...there].filter((h) => h === `job/${m}` || jobBranch(m, [h], ids) === h);
  const at = (m) => jobBranchAt(root, m, all(m), ids);
  const spec = (m) => all(m).map((h) => `+refs/heads/${h}:refs/remotes/origin/${h}`);
  const fetch = (ms) => out(root, ['fetch', '-q', ...(shallow ? [`--shallow-exclude=${main}`] : []), 'origin', ...ms.flatMap(spec)]) !== null;
  const have = mods.filter((m) => all(m).length);
  for (const m of mods) if (!have.includes(m)) map.set(m, null);
  if (have.length && fetch(have)) for (const m of have) map.set(m, there.has(at(m)) ? `refs/remotes/origin/${at(m)}` : null);
  else for (const m of have) if (fetch([m])) map.set(m, there.has(at(m)) ? `refs/remotes/origin/${at(m)}` : null); // unfetched: left out, unmeasured
  map.unread = have.filter((m) => !map.has(m)); // unfetched, named so a figure can say it left them out
  map.branches = (m) => all(m).map((h) => `refs/remotes/origin/${h}`);
  return map;
}

// One line per figure for report tranche: "<minutes> min (target <t>[, over])", or unmeasured.
export const leadCell = (f) => {
  if (typeof f === 'string') return f;
  if (Array.isArray(f)) return f.length ? f.map(leadCell).join('; ') : 'none';
  if (!f || f.unmeasured || typeof f.minutes !== 'number') return U;
  return `${f.minutes} min${f.open ? ' (open)' : ''}${f.attempt !== undefined ? ` (attempt ${f.attempt}${f.unmeasured_attempts ? `; attempt ${f.unmeasured_attempts.join(', ')} ${U}` : ''})` : ''}${f.target !== undefined ? ` (target ${f.target}${f.mark ? ', over' : ''})` : ''}${f.waited_on ? ` (ready at ${f.waited_on}'s merge)` : ''}${f.started_before ? ` (started before ${f.started_before} merged)` : ''}${f.cause ? ` (cause: ${f.cause})` : ''}${f.source ? ` (stop: ${f.source})` : ''}${f.batch ? ` (batch of ${f.batch.restarts} restarts ${f.batch.from}..${f.batch.to})` : ''}`;
};
export const leadSummaryCell = (s) => (s === U ? U : `median ${s.median}${s.median_mark ? ' over' : ''}, worst ${s.worst}${s.worst_open ? ' (open)' : ''}${s.worst_mark ? ' over' : ''}${s.target !== undefined ? ` (target ${s.target})` : ''}, n ${s.n}${s.open ? ` and ${s.open} open` : ''}${s.unmeasured ? `; ${s.unmeasured} ${U}` : ''}${s.started_before_uses ? `; ${s.started_before_uses} started before a module in their uses merged` : ''}`);

// ===== file: gate-speed.test.mjs (later part) =====

  assert.equal(baseRed(s.root, e, { base: s.base, failing, cfg, timeout: 60000, prepared: other }).ok, true);
  assert.equal(other.used, false);
  other.drop();
  // Ended without a verdict (crashed, killed): prepared inline.
  let dropped = 0;
  const crashed = { base: s.base, used: false, wait: () => null, drop: () => { dropped++; } };
  assert.equal(baseRed(s.root, e, { base: s.base, failing, cfg, timeout: 60000, prepared: crashed }).ok, true);
  assert.equal(dropped, 1);
  // A failed preparation beside the head is prepared again here, with base-red's own budget.
  const refused = { base: s.base, used: false, wait: () => ({ ok: false, why: "the base's build failed: killed" }), drop: () => {} };
  const again = [];
  assert.equal(baseRed(s.root, e, { base: s.base, failing, cfg, timeout: 60000, prepared: refused, log: (l) => again.push(l) }).ok, true);
  assert.ok(again.some((l) => /the background preparation refused \(the base's build failed: killed\): the tree is prepared here/.test(l)));
  // A base that cannot be written is refused, inline or not.
  const bad = startBase(s.root, { base: 'f'.repeat(40), cfg, timeout: 60000 });
  const r = baseRed(s.root, e, { base: 'f'.repeat(40), failing: [{ file: 'src/alpha/index.mjs', name: 'x' }], cfg, timeout: 60000, prepared: bad });
  assert.match(r.why, /^(the base's tree could not be prepared|new failing test file)/);
  bad.drop();
  assert.deepEqual(mine(), []);
});

test('base-red: a base file changed in the tree prepared beside the head is caught, and the tree prepared again', () => {
  const s = setup({ 'test/alpha/red.test.mjs': redTest, 'bin/run.sh': '#!/bin/sh\n' }, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  git(['update-index', '--chmod=+x', 'bin/run.sh'], { cwd: s.root });
  const e = JSON.parse(readFileSync(join(s.root, 'process/ledger/alpha.json'), 'utf8'));
  const cfg = loadConfig(s.root);
  const failing = [{ file: 'test/alpha/red.test.mjs', name: 'plane > has ai-catalogue' }];
  const p = startBase(s.root, { base: s.base, cfg, timeout: 60000 });
  // Ready, then written into by code of the PR: the failing test made to fail there.
  for (const t0 = Date.now(); !existsSync(join(p.dir, 'exit')) && Date.now() - t0 < 30000;) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  assert.equal(changedInTree(s.root, s.base, p.wt), null);
  writeFileSync(join(p.wt, 'src/alpha/index.mjs'), 'export const x = 9;\n');
  assert.equal(changedInTree(s.root, s.base, p.wt), 'src/alpha/index.mjs');
  const lines = [];
  assert.equal(baseRed(s.root, e, { base: s.base, failing, cfg, timeout: 60000, prepared: p, log: (l) => lines.push(l) }).ok, true);
  assert.ok(lines.some((l) => /src\/alpha\/index\.mjs in the base's tree prepared beside the head is not the base's: the tree is prepared here/.test(l)), lines.join('\n'));
  assert.equal(existsSync(p.dir), false);
});

test('base-red: dropping a preparation kills its whole process group, verdict or not', () => {
  const s = setup({}, { 'src/alpha/index.mjs': 'export const x = 2;\n' });
  // A build that leaves a descendant behind, as an install's lifecycle script may. Its sleep
  // takes a duration no other process on the machine uses (30 s and a fraction unique to this
  // run), so the count is of this test's own processes only: another `sleep 30` (a session's
  // ci-watch loop, 6 Nov) is neither counted nor killed.
  const mine = `30.${process.pid}${Date.now() % 1000}`;
  const other = spawn('sleep', ['30'], { detached: true, stdio: 'ignore' });
  try {
    const rows = [{ paths: ['gen/x.txt'], regenerate: ['sh', '-c', `sleep ${mine} >/dev/null 2>&1 & exit 0`], verify: ['true'] }];
    const p = startBase(s.root, { base: s.base, cfg: loadConfig(s.root), rows, timeout: 60000 });
    assert.equal(p.wait(30000).ok, true);
    assert.equal(sleeping(mine).length, 1, 'the descendant outlives the verdict');
    p.drop();
    assert.deepEqual(sleeping(mine), []);
    assert.ok(sleeping('30').includes(String(other.pid)), 'a sleep the test did not start is not counted, and is left running');
  } finally { try { process.kill(-other.pid); } catch { /* gone */ } }
});

// The live (not zombie) processes whose command line is exactly `sleep <arg>`.
function sleeping(arg) {
  return readdirSync('/proc').filter((n) => /^\d+$/.test(n)).filter((n) => {
    try { return readFileSync(`/proc/${n}/stat`, 'utf8').replace(/^.*\) /s, '')[0] !== 'Z' && readFileSync(`/proc/${n}/cmdline`, 'utf8') === `sleep\u0000${arg}\u0000`; } catch { return false; }
