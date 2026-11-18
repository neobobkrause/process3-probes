  }
  const at = now();
  const files = [[flowFile(n, 'companion', `${safeName(id)}-${safeName(job)}`), { row: 'companion', layer: n, module: id, job, why: why.trim(), at, by }]];
  if (!joined.has(id)) files.push([flowFile(n, 'join', safeName(id)), { row: 'join', layer: n, module: id, from: own, why: why.trim(), companion_of: job, at, by }]);
  writeRows(root, cfg.state_branch, `layer join: ${id} joins layer ${n} as ${job}'s companion (PD-19)`, files);
  log(`${id} joins layer ${n} as ${job}'s companion (PD-19): ${why.trim()}; it starts from ${P3} layer jobs ${n}, and it lands in the same layer as ${job}`);
  return { ok: true, layer: n, recorded: true, companion: true };
}

// ---- layer join ----------------------------------------------------------------------------

// Where a module stands against the flow, read offline (the state branch and the tranche as
// fetched): own (its layer in the map, or null), cur (the open layer, else the next to open), and
// target (the layer it joins: the next after the open one, else the next to open). behind: its
// own layer is behind cur, or it has none. null when the product has no layer map.
// The coordinator's ruling (6 Nov): work on a module outside the open layer (a notice-affected user
// in a merged layer, a found-mark reopen of a COMPLETE module whose layer merged) joins the NEXT
// layer to open, in order, never the tranche directly.
export function layerPlace(root, cfg, id) {
  const trRef = `refs/remotes/origin/${cfg.tranche}`;
  const tr = git(['rev-parse', '-q', '--verify', trRef], { cwd: root, allowFail: true }).code === 0 ? trRef : null;
  const layers = layersAt(root, cfg, tr);
  if (!layers.length) return null;
  const own = layerOf(layers, id);
  const closed = closedLayers(root, cfg.state_branch, cfg);
  let open = null;
  let next = null;
  // As openLayer reads the flow: a layer behind us (closed, merged, or with nothing left) is passed.
  for (const L of layers) {
    const r = flowRows(root, cfg.state_branch, L.n);
    if (r.open && !r.merged) { open = L.n; break; }
    if (r.merged || closed.has(L.n) || (tr && layerBehind(root, cfg, L, closed, tr))) continue;
    next = L.n;
    break;
  }
  const cur = open ?? next;
  // Joined already (a join row on a layer not merged, from the open one on): it starts there, and
  // is not behind (cold review of PR 191: status kept printing the join, then pointed past it).
  const joined = layers.find((L) => L.n !== own && (cur === null || L.n >= cur) && (() => { const r = flowRows(root, cfg.state_branch, L.n); return !r.merged && r.joins.some((j) => j.module === id); })())?.n ?? null;
  // PD-14 (coordinator, 8 Nov; C35): while a completion layer is open, a module with an open item
  // in completion_file that is not one of its modules joins THAT layer, never one after it.
  const openL = open !== null ? layers.find((L) => L.n === open) : null;
  // PD-14 (i): a module already in the open completion layer (its own, or joined) whose open items
  // the layer does not hold yet (added after its open, or after its join) joins them the same way.
  const more = () => {
    const r = flowRows(root, cfg.state_branch, open);
    const known = new Set(layerItems(openL.completion, r.joins, r.items).map((x) => x.id));
    return completionJoinItems(root, cfg, tr, id).filter((x) => !known.has(x.id));
  };
  if (joined !== null) {
    const m = joined === open && openL?.completion ? more() : [];
    return { own, open, cur, target: joined, behind: false, joined, ...(m.length ? { more: m } : {}) };
  }
  // One of the open completion layer's own modules is in the open layer, not behind it.
  if (openL?.completion && openL.mods.includes(id)) { const m = more(); return { own: open, open, cur, target: open, behind: false, joined: null, ...(m.length ? { more: m } : {}) }; }
  const items = openL?.completion && !openL.mods.includes(id) ? completionJoinItems(root, cfg, tr, id) : [];
  if (items.length) return { own, open, cur, target: open, behind: true, joined: null, completion: items };
  const target = open !== null ? (layers.find((L) => L.n > open && !closed.has(L.n) && !flowRows(root, cfg.state_branch, L.n).merged)?.n ?? null) : next;
  const behind = own === null || (cur !== null && own < cur) || (cur === null);
  return { own, open, cur, target, behind, joined: null };
}
// A module's open, non-whole items in completion_file on the tranche, as a completion layer holds them.
export function completionJoinItems(root, cfg, tr, id) {
  let c = null;
  try { c = completionItems(root, cfg, tr); } catch { c = null; }
  return openItems(c).filter((x) => !x.whole && !x.malformed && x.target === id).map((x) => ({ id: x.id, module: id, what: x.what }));
}
export const joinAct = (id, why, t) => `${P3} layer join ${id} --why ${JSON.stringify(why)} (it joins layer ${t}, and starts from ${P3} layer jobs ${t} once that layer is open)`;

// layer join <id> --why "<why>": the module, its layer behind the open one, joins the next layer
// to open: one row on the state branch (layerflow/<n>/join/<id>.json); layer open lists it in that
// layer's jobs, its job's base is that layer's branch, and the layer merges only once it lands.
export function layerJoin(root, id, { why, by = 'bob', log = console.log, companionOf, layer, io = {} } = {}) {
  if (companionOf !== undefined) return layerCompanion(root, id, { layer, job: companionOf === true ? '' : String(companionOf), why, by, io, log });
  if (layer !== undefined) fail('layer join --layer goes with --companion-of <job> (PD-19); a plain join takes the next layer to open');
  const cfg = loadConfig(root);
  needLayerMode(cfg, 'layer join');
  if (typeof why !== 'string' || !why.trim()) fail('layer join <id> --why "<the work it joins for>"');
  fetchBranch(root, cfg.tranche, { allowFail: true });
  fetchState(root, cfg.state_branch, { fresh: true });
  const tr = `refs/remotes/origin/${cfg.tranche}`;
  if (!ledgerIds(root, tr).has(id)) fail(`${id} has no ledger entry on ${cfg.tranche}`);
  const at = layerPlace(root, cfg, id) || fail(`no layer map (${cfg.layers_file}): jobs start on the tranche; there is no layer to join`);
  // PD-14 (i): new items for a module already in the open completion layer: one item row, its
  // reopen words and ticks; its job runs again if it started before the row.
  if (at.more?.length) {
    const t = at.open;
    const ids = at.more.map((x) => x.id);
    writeRows(root, cfg.state_branch, `layer join: ${id} joins ${ids.join(', ')} into layer ${t} (the completion round)`, [[flowFile(t, 'items', `${safeName(id)}-${Date.now()}`), { row: 'items', layer: t, module: id, items: at.more, why: why.trim(), at: now(), by }]]);
    log(`${id} joins ${ids.join(', ')} into layer ${t}, where it is already: ${why.trim()}; it starts (again, if its job started before) from ${P3} layer jobs ${t}`);
    return { ok: true, layer: t, recorded: true, items: ids };
  }
  if (at.joined !== null) { log(`${id} joined layer ${at.joined} already; it starts from ${P3} layer jobs ${at.joined}${at.joined === at.open ? '' : ` once layer ${at.joined} opens (${P3} layer open ${at.joined})`}; nothing recorded`); return { ok: true, layer: at.joined, recorded: false }; }
  if (!at.behind) fail(`${id} is in layer ${at.own}, ${at.own === at.open ? 'the open layer' : 'not yet open'}: it starts from ${P3} layer jobs ${at.own}; nothing recorded`);
  if (at.target === null) fail(at.open === null ? `every layer in ${cfg.layers_file} has merged or closed: ${id} has no layer to join; ask the coordinator` : `no layer follows layer ${at.open} in ${cfg.layers_file}: ${id} has no next layer to join; ask the coordinator`);
  const t = at.target;
  const f = flowFile(t, 'join', safeName(id));
  const had = flowRows(root, cfg.state_branch, t).joins.find((j) => j.module === id);
  // Into an open completion layer (PD-14): its items go in the row, its reopen words and its ticks.
  if (!had) writeRows(root, cfg.state_branch, `layer join: ${id} joins layer ${t}${at.completion ? ' (the completion round)' : ''}`, [[f, { row: 'join', layer: t, module: id, from: at.own, why: why.trim(), at: now(), by, ...(at.completion ? { items: at.completion } : {}) }]]);
  log(`${id} ${had ? 'joined' : 'joins'} layer ${t}${had ? ` already (${had.why})` : `: ${why.trim()}`}${at.completion ? ` with ${at.completion.map((x) => x.id).join(', ')}` : ''}; it starts from ${P3} layer jobs ${t}${t === at.open ? '' : ` once layer ${t} opens (${P3} layer open ${t})`}`);
  return { ok: true, layer: t, recorded: !had };
}

// ---- layer open -----------------------------------------------------------------------------

// A completion layer (PLN-4; PD-12; C33) was opened past the map from completion_file's open items;
// BD-R1 retires the path (roundLayer opens a round's layers instead). One already open, the copy's
// layer 12, keeps its items, joins and ticks below until it merges.
// A completion layer's reopen words per module: its items, each with its id.
export const itemReopen = (completion, joins = [], more = []) => {
  const all = layerItems(completion, joins, more);
  return new Map([...new Set(all.map((x) => x.module))].map((id) => [id, all.filter((x) => x.module === id).map((x) => `${x.id}: ${x.what}`).join('; ')]));
};
// A completion layer's item ids per module, in the order itemReopen words them.
export const itemIdMap = (completion, joins = [], more = []) => {
  const all = layerItems(completion, joins, more);
  return new Map([...new Set(all.map((x) => x.module))].map((id) => [id, all.filter((x) => x.module === id).map((x) => x.id)]));
};
// A completion layer's items: those of its open row, those its joined modules brought (PD-14), and
// those added later for a module already in it (item rows, PD-14 (i)).
export const layerItems = (completion, joins = [], more = []) => (completion ? [...(completion.items || []), ...[...joins, ...more].flatMap((j) => (Array.isArray(j.items) ? j.items : []))] : []);
// PD-14 (i): an item row is owed until its module lands after it from a job not started before it:
// a land whose job started before the row did not do the item's work (the job never had its words),
// so the module runs again and the item is not ticked off that land. A land's job is its module's
// newest start row before the land, a restart row not counted (the same job, its old task: cold
// review of (i)); with none (job start writes it best-effort) the land counts.
// One owed row puts the module back to not started.
export const itemsOwed = (rows, id) => {
  // Times compared parsed (rows are second-resolution, now()): a start in the same second as the row
  // is not after it (the safe side: one more run); a land in the same second as its start follows it.
  const t = (x) => Date.parse(x?.at) || 0;
  const starts = (rows.starts || []).filter((s) => s.module === id && !s.restart);
  const did = (l, r) => { const s = starts.filter((x) => t(x) <= t(l)).at(-1); return !s || t(s) > t(r); };
  return (rows.items || []).filter((r) => r.module === id && !(rows.lands || []).some((l) => l.module === id && t(l) > t(r) && did(l, r)));
};

// A round's layer (BD-R1, rounds.mjs): layer n, one past every layer the map and those past it
// hold, is the round's next: the next map layer, after the round's last, that holds a flawed module
// (one with an unmet found mark), skipping those with none; or, once a walk ended the round, the
// next round's first. Its modules are the flawed ones there, each reopened with its found marks.
// A new round opens only once the walk's findings are recorded, and none is left without a module.
export function roundLayer(root, cfg, layers, n, tr, log = () => {}) {
  const last = layers.at(-1)?.n ?? 0;
  if (n !== last + 1) fail(`layer ${n} is not in ${cfg.layers_file} on ${cfg.tranche}${last ? `; the next past it is ${last + 1}` : ''}`);
  // Every layer before it closed first, as layer open checks them: a round's layer follows them all.
  const closed = closedLayers(root, cfg.state_branch, cfg);
  for (const L of layers) {
    const r = flowRows(root, cfg.state_branch, L.n);
    if (r.open && !r.merged) fail(`layer ${L.n} is open on ${layerBranch(L.n)} and has not merged; layer ${n} opens after it (${P3} layer merge ${L.n})`);
