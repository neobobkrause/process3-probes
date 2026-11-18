  const dir = cfg.requirements_dir.replace(/\/$/, '');
  // The requirement and found files at ref in one batch (C50: two git spawns per file, per module,
  // at every status and idle check); a file elsewhere is read as before. As git show prints a file.
  // Only for a plain directory name (cold review of C50: "./build/requirements" names a path
  // rev-parse resolves and ls-tree does not print); any other is read one by one as before.
  const plain = /^[^./][^]*$/.test(dir) && !/(^|\/)\.{1,2}(\/|$)|\/\/|\/$/.test(dir);
  const pre = ref && plain ? treeBlobs(root, ref, [`${dir}/`, `${FOUND_DIR}/`]) : null;
  const batched = (f) => pre && (f.startsWith(`${dir}/`) || f.startsWith(`${FOUND_DIR}/`));
  const read = (f) => (ref ? (batched(f) ? (pre.has(f) ? pre.get(f).replace(/\n$/, '') : null) : exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null) : existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : null);
  const map = read(cfg.layers_file);
  if (map === null) return null;
  // Requirement marks (R) hold a layer; found marks (F, the route for work found elsewhere) never
  // do: they are work by open_by whatever the layer, and never deferred at a close.
  const ids = (f) => unmetIds(read(f));
  const marks = (f) => ids(f).filter((x) => !isFound(x));
  const found = (f, id) => [...ids(f), ...ids(foundFile(id))].filter(isFound);
  const recorded = new Set(closed.map((r) => r.layer));
  const layers = map.split('\n').map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
    .filter((c) => c.length > 1 && /^\d+$/.test(c[0]))
    .map((c) => ({ n: Number(c[0]), mods: c.at(-1).replace(/[`*]/g, '').split(',').map((m) => m.trim()).filter(Boolean).map((id) => {
      const file = `${dir}/${id}.md`;
      const row = rows.find((r) => r.id === id || r.req === file);
      const open = !!row && (row.tranche !== 'COMPLETE' || !!row.pr?.startsWith('#'));
      const merged = !!row && row.tranche === 'COMPLETE' && !open && !row.flag && !(row.ahead > 0) && !row.unread; // a restart's fresh start commit is unflagged
      const pr = row?.pr?.match(/^#(\d+)/)?.[1] ?? null;
      return { id, file, open, merged, blocked: row?.blocked || null, pr: pr && Number(pr), marks: marks(file), found: found(file, id), row };
    }) }))
    .sort((a, b) => a.n - b.n);
  // Work merged in this tranche: a COMPLETE entry whose ledger file differs from main's, or that
  // main lacks (origin/main unread counts as here). A layer that had such work closes only by
  // `layer merge`, its checks and close row; one with none closes implicitly.
  // The ledger's object ids at a ref, one ls-tree for all its entries (C50), not a rev-parse each.
  const idsAt = new Map();
  const blob = (at, f) => {
    if (at && f.startsWith(`${LEDGER_DIR}/`) && !f.slice(LEDGER_DIR.length + 1).includes('/')) {
      if (!idsAt.has(at)) {
        const r = git(['ls-tree', '-z', at, '--', `${LEDGER_DIR}/`], { cwd: root, allowFail: true });
        // A ref the clone lacks holds none (as each rev-parse would answer); any other failure: one by one.
        idsAt.set(at, r.code === 0 ? new Map(r.stdout.split('\0').map((l) => l.match(/^\d+ \w+ ([0-9a-f]+)\t([\s\S]+)$/)).filter(Boolean).map((m) => [m[2], m[1]]))
          : /not a valid object name/i.test(r.stderr) ? new Map() : null);
      }
      const ids = idsAt.get(at);
      if (ids) return ids.get(f) ?? null;
    }
    if (at) { const r = git(['rev-parse', '-q', '--verify', `${at}:${f}`], { cwd: root, allowFail: true }); return r.code === 0 ? r.stdout.trim() : null; }
    return existsSync(join(root, f)) ? git(['hash-object', f], { cwd: root }) : null;
  };
  const here = (m) => { const f = `${LEDGER_DIR}/${m.row.id}.json`; const b = blob(ref, f); return b === null || b !== blob('refs/remotes/origin/main', f); };
  // The R marks its last start reopened it for: its start row on the tranche (no history read, so a
  // shallow clone reads it too; review of PR 138).
  const left = (m) => String((ref ? rowsAt(root, ref, m.row.id) : readRows(root, m.row.id)).filter((r) => r.event === 'start').pop()?.reopen || '').match(/^meet the unmet requirement marks (R\d+(?:, R\d+)*)/)?.[1].split(', ') || [];
  for (const L of layers) {
    L.recorded = recorded.has(L.n);
    for (const m of L.mods) m.here = m.merged && here(m);
    L.worked = L.mods.some((m) => m.here);
    // Merged in this tranche after a reopen for these marks: unmet after its job, deferred at the
    // close, never reopened for them again this tranche (coordinator, 5 Nov: a reopen per start --ready).
    for (const m of L.mods) if (m.here && m.marks.length) { const l = left(m); if (m.marks.every((x) => l.includes(x))) m.after = m.marks; }
    L.closed = L.recorded || (!L.worked && L.mods.every((m) => !m.open && !m.marks.length));
  }
  const cur = layers.find((L) => !L.closed) || null;
  // A deferred module's pull request unread (offline) holds the layer as an open one does.
  const ok = (m) => (m.blocked ? !m.pr && !m.row.pr?.startsWith('unknown') : !m.open && (m.merged || !m.marks.length));
  const owed = (cur?.mods || []).filter((m) => m.blocked && m.pr);
  const ready = !!cur && cur.mods.every(ok);
  const pending = !!cur && !!owed.length && cur.mods.every((m) => ok(m) || owed.includes(m));
  const deferred = layers.filter((L) => recorded.has(L.n)).flatMap((L) => L.mods.filter((m) => m.marks.length).map((m) => ({ layer: L.n, id: m.id, count: m.marks.length })));
  return { layers, cur, ready, pending, owed, deferred };
}

// Provider notices (the provider-change route): per user module, each notice it has not answered,
// as the state branch holds them (bobStatus fetched it). Listed until the user has an open job
// whose START names the notice (its start row, on its job branch); answered when that job merges,
// or by notice triage judging the module not affected. Each notice carries the module's triage row
// (`triage`), null until `notice triage --record` judged it: until then the notice is listed once,
// as `triage owed`, and none of its modules is notice work (56 modules for one struck requirement
// on the copy, 4 Nov).
export function owedNotices(root, cfg, rows, log = console.log) {
  const { owed, untriaged, judged } = noticeSlots(root, cfg, rows);
  const users = Object.keys(owed).sort();
  if (users.length) log('provider notices (not layer work; triage first, then a job per affected module):');
  for (const [k, us] of Object.entries(untriaged)) log(`- triage owed: ${k} (${us.length} modules): ${P3} notice triage ${k}`);
  const rerun = `; its merged job named it, answer not recorded: run merge <that job's PR> again`;
  for (const [u, n] of judged) log(`- ${u}: ${noticeLine(n)}; affected: ${n.triage.evidence.slice(0, 80)}${n.rerun ? rerun : ''}`);
  for (const u of users) for (const n of owed[u].filter((x) => !x.triage && x.rerun)) log(`- ${u}: ${noticeLine(n)}${rerun}`);
  return owed;
}

// Every provider notice slot (one notice, one user module) the state branch holds, each with what
// closes it, from the one reader (notice.mjs noticeRecords) that triage, status, layer close and
// report tranche all read (coordinator, 4 Nov). A slot is closed when answered, or when its notice
// was withdrawn; an open slot is exactly one of:
// - `triage`: not yet triaged; its act `notice triage <key>`;
// - `affected`: triage judged it affected; notice work, its act `job start <module>`, or, its layer
//   behind the open one, `layer join <module>` (it joins the next layer to open);
// - `job`: its module's open job named it in its START; that job's merge answers it;
// - `rerun`: its merged job named it and the answer was not recorded; `merge <that PR>` again.
// owed, untriaged and judged are what owedNotices prints and nextWork reads.
export function noticeSlots(root, cfg, rows) {
  let recs = [];
  let tri = new Map();
  try { recs = noticeRecords(root, cfg.state_branch); tri = triageRows(root, cfg.state_branch); } catch { recs = []; }
  const unrecorded = {};
  const isOpen = new Set();
  const cache = new Map();
  // An affected user whose layer is behind the open one joins the next to open (layer join).
  const places = new Map();
  const joinOf = (u) => {
    if (!places.has(u)) { let p = null; try { p = layerPlace(root, cfg, u); } catch { p = null; } places.set(u, p?.behind && p.target !== null ? p.target : null); }
    return places.get(u);
  };
  const named = (u) => {
    // The job branch decides, while its attempt is open: not COMPLETE on the tranche, an open pull
    // request, or commits the tranche lacks. A merged attempt's start row names a notice only when
    // its answer was not written (the merge stands if that write fails): the notice is still owed,
    // and merge <n> run again records it (confirming review of PR 54).
    if (cache.has(u)) return cache.get(u);
    const row = rows.find((x) => x.id === u);
    let out = [];
    if (row?.branch) {
      const t = git(['show', `origin/${refOf(row)}:${metricsFile(u)}`], { cwd: root, allowFail: true });
      const keys = t.code === 0 ? jsonl(t.stdout).filter((x) => x.event === 'start').pop()?.notices || [] : [];
      const open = row.tranche !== 'COMPLETE' || !!row.pr?.startsWith('#') || row.ahead > 0;
      if (!open) unrecorded[u] = keys;
      else { out = keys; isOpen.add(u); }
    }
    cache.set(u, out);
    return out;
  };
  const owed = {};
  const untriaged = {};
  const slots = [];
  const withdrawn = [];
  for (const n of recs) {
    if (n.withdrawn) { withdrawn.push({ key: n.key, at: n.withdrawn.at, by: n.withdrawn.by, why: n.withdrawn.why, closed: n.open.length }); continue; }
    const { withdrawn: _w, ...live } = n;
    for (const u of n.open) {
      const row = rows.find((x) => x.id === u);
      const prN = String(row?.pr ?? '').match(/#(\d+)/)?.[1] || null;
      if (named(u).includes(n.key)) { slots.push({ key: n.key, user: u, kind: 'job', act: prN ? `${P3} merge ${prN} (job ${u}'s pull request; its START names the notice, its merge answers it)` : `job ${u} names it in its START; its merge answers it` }); continue; }
      const triage = tri.get(`${n.key}\0${u}`) || null;
      const rerun = !!unrecorded[u]?.includes(n.key);
      (owed[u] ||= []).push({ ...live, triage, rerun });
      if (rerun) slots.push({ key: n.key, user: u, kind: 'rerun', act: `${P3} merge ${prN || `<job ${u}'s PR>`} (again: its answer was not recorded)` });
      else if (triage && joinOf(u) !== null) slots.push({ key: n.key, user: u, kind: 'affected', act: joinAct(u, `provider notice ${n.key}`, joinOf(u)) });
      else if (triage) slots.push({ key: n.key, user: u, kind: 'affected', act: isOpen.has(u) ? `${P3} job start ${u} --sessions <file>, once its open job merges (that job's START does not name this notice)` : `${P3} job start ${u} --sessions <file>` });
      else { (untriaged[n.key] ||= []).push(u); slots.push({ key: n.key, user: u, kind: 'triage', act: `${P3} notice triage ${n.key}` }); }
    }
  }
  const judged = Object.keys(owed).sort().flatMap((u) => owed[u].filter((n) => n.triage).map((n) => [u, n]));
  return { owed, untriaged, judged, slots, withdrawn };
}

// open_by (process/config.json): "uses", the default, opens past the open layer each module
// whose providers are all done; "layer", the open layer's modules only (the old behaviour).
export function openBy(cfg) {
  const v = cfg.open_by ?? 'uses';
  if (!OPEN_BY.includes(v)) fail(`open_by ${JSON.stringify(v)} in process/config.json is not one of ${OPEN_BY.map((x) => `"${x}"`).join(', ')}`);
  return v;
}

// Dependency opening (open_by "uses"): the modules of the layers past the open one that are
// ready. Ready: every module its `uses` (modules_file) names is in the layer map and done, with
// no unmet marks, no open job and no provider notice triage judged it affected by (noticeWork). A module with no
// `uses` entry waits for its layer. gaps: each module past the open layer whose `uses` names a
// module the layer map lacks: not ready. The open layer is unchanged.
// A module owes notice work when triage judged it affected by a notice (or its merged job named
// one whose answer was not recorded). A notice not yet triaged holds nothing: membership:77,
