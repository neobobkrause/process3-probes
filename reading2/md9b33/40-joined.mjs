// ===== file: walkcfg.mjs (continued) =====

// deployment (journey-check run.mjs), not Browser Rendering, so the runner's CPUs bound how many it can
// run: that is the live walk's default. Browser Rendering's concurrent browsers stay the cap, at TARGET,
// and its new-browser rate the starts' pace, because the product's own Workers may use Browser
// Rendering for each request a walker makes (its pdf-worker and browser bindings). Workers and Durable
// Objects publish no limit a walker count can reach first (at most a few requests a second each).
export const CLOUDFLARE_LIMITS = {
  read: '2026-11-09',
  pages: [
    'https://developers.cloudflare.com/browser-rendering/platform/limits/',
    'https://developers.cloudflare.com/workers/platform/limits/',
    'https://developers.cloudflare.com/durable-objects/platform/limits/',
  ],
  free: { browsers: 3, browser_starts_per_minute: 3 },
  paid: { browsers: 200, browser_starts_per_minute: 180 },
};
// As pacing.target (pace.mjs, PD-22): 85% of the published limit, never above it.
export const WALK_TARGET = 0.85;
const KEYS = ['internal_concurrency', 'live_concurrency', 'cloudflare_plan', 'ai'];
const count = (v, what) => (v === undefined || v === null ? null : Number.isInteger(v) && v >= 1 && v <= 1024 ? v : fail(`walk.${what} must be a whole number from 1 to 1024, not ${JSON.stringify(v)}`));

// The `walk` block of process/config.json, read: { internal, live, live_max, starts_per_minute, plan,
// clamped }. internal: walk.internal_concurrency, else the runner's CPUs (os.availableParallelism).
// live: walk.live_concurrency, else the smaller of the cap and the runner's CPUs (each walker is a local
// Chromium); never above the cap whatever the config says; the cap is WALK_TARGET of the plan's
// concurrent browsers (at least 1). The plan is walk.cloudflare_plan, "free"
// by default: the tighter, until the product's account is known to be on Workers Paid.
export function walkConcurrency(cfg, { cpus = availableParallelism() } = {}) {
  const w = cfg?.walk ?? {};
  if (typeof w !== 'object' || Array.isArray(w)) fail('"walk" in process/config.json must be an object');
  const bad = Object.keys(w).filter((k) => !KEYS.includes(k));
  if (bad.length) fail(`"walk" has unknown keys: ${bad.join(', ')} (known: ${KEYS.join(', ')})`);
  const plan = w.cloudflare_plan ?? 'free';
  if (!['free', 'paid'].includes(plan)) fail(`walk.cloudflare_plan must be "free" or "paid" (Workers Free or Workers Paid), not ${JSON.stringify(plan)}`);
  const lim = CLOUDFLARE_LIMITS[plan];
  const cap = Math.max(1, Math.floor(lim.browsers * WALK_TARGET));
  const asked = count(w.live_concurrency, 'live_concurrency');
  const internal = count(w.internal_concurrency, 'internal_concurrency') ?? Math.max(1, cpus);
  // BD-R5 (Bob, 9 Nov): "The first run or two of the external system will run without an AI account
  // connected"; walk.ai is true once Bob has one configured. Off, the AI-assisted journeys are not walked.
  if (w.ai !== undefined && typeof w.ai !== 'boolean') fail(`walk.ai must be true or false (an AI account configured for the live walk), not ${JSON.stringify(w.ai)}`);
  return { ai: w.ai === true, internal, live: Math.min(asked ?? Math.min(cap, Math.max(1, cpus)), cap), live_max: cap, starts_per_minute: Math.max(1, Math.floor(lim.browser_starts_per_minute * WALK_TARGET)), plan, clamped: asked !== null && asked > cap };
}
// The environment and the argv substitution a walk stage gets.
export const walkEnv = (c, live) => (live ? { P3_WALK_CONCURRENCY: String(c.live), P3_WALK_BROWSER_STARTS_PER_MINUTE: String(c.starts_per_minute), P3_WALK_AI: c.ai ? '1' : '0' } : { P3_WALK_CONCURRENCY: String(c.internal), P3_WALK_AI: c.ai ? '1' : '0' });
export const walkLine = (c, live) => (live
  ? `live walk: ${c.live} at once (P3_WALK_CONCURRENCY, {concurrency}), ${c.starts_per_minute} browser starts a minute; the cap is ${c.live_max}, ${WALK_TARGET * 100}% of Cloudflare's ${CLOUDFLARE_LIMITS[c.plan].browsers} concurrent browsers on Workers ${c.plan === 'paid' ? 'Paid' : 'Free'} (read ${CLOUDFLARE_LIMITS.read}); AI ${c.ai ? 'on' : 'off: the AI-assisted journeys are not walked (BD-R5)'}${c.clamped ? '; walk.live_concurrency asked for more and was held to the cap' : ''}`
  : `internal walk: ${c.internal} at once (P3_WALK_CONCURRENCY, {concurrency})`);

// ===== file: census.mjs (later part) =====

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
