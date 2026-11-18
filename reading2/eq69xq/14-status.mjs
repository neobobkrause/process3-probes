    const m = layerMergeLine(view);
    if (m) log(m);
  } else if (ref) {
    const r = git(['ls-tree', '--name-only', `${ref}:${dir}`], { cwd: root, allowFail: true });
    files = (r.code === 0 ? r.stdout.split('\n') : []).filter((x) => x.endsWith('.md') && x !== 'README.md').map((n) => `${dir}/${n}`);
    ahead = [...files];
    files.push(...foundEntries(root, ref).map(foundFile));
  } else {
    files = (existsSync(join(root, dir)) ? readdirSync(join(root, dir)) : []).filter((x) => x.endsWith('.md') && x !== 'README.md').map((n) => `${dir}/${n}`);
    ahead = [...files];
    files.push(...foundEntries(root, null).map(foundFile));
  }
  // Read whole (git show without allowFail drops the last newline): the cap counts every byte.
  const whole = (f) => (ref ? (exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root, allowFail: true }).stdout : null) : read(f));
  // A user module triage judged affected: notice work, whatever its layer or marks.
  const affected = Object.entries(owed).map(([u, ns]) => [u, ns.filter((n) => n.triage && !n.rerun)]).filter(([, ns]) => ns.length);
  const byFile = new Map(affected.map(([u, ns]) => [rows.find((r) => r.id === u)?.req || `${dir}/${u}.md`, ns]));
  const inLayer = new Set(files);
  const texts = new Map();
  const textOf = (f) => (texts.has(f) ? texts.get(f) : (texts.set(f, whole(f)), texts.get(f)));
  const foundBy = new Set(foundReady.map((m) => m.file));
  const after = new Set((ls?.layers || []).flatMap((L) => L.mods.filter((m) => m.after).map((m) => m.file)));
  // A found-work entry's module is taken while its job is open (taken holds its requirement file).
  const entryTaken = (f) => f.startsWith(`${FOUND_DIR}/`) && open.some((r) => foundFile(r.id) === f);
  // An OPEN entry BOB wrote and no job started: BOB's choice, startable whatever its layer or
  // uses (copy, 4 Nov: publication and case-authoring, entries merged 11:44:06, layer 8 with the
  // open layer 4 and providers with unmet marks, were listed nowhere and started 23 min later).
  const inLayer0 = new Set((ls?.cur?.mods || []).map((m) => m.file)); // the open layer's: held by its own rule above
  const enteredRows = rows.filter((r) => r.unstarted && r.tranche === 'OPEN').map((r) => ({ id: r.id, file: r.req || `${dir}/${r.id}.md` }));
  const enteredHeld = waitsOnUses(root, cfg, ls, ref, enteredRows.filter((r) => !inLayer0.has(r.file)));
  for (const [f, ps] of enteredHeld) log(`waits for its providers: ${f} (entered) uses ${ps.join(', ')}, not done`);
  const entered = new Set(enteredRows.map((r) => r.file).filter((f) => !enteredHeld.has(f) && !(inLayer0.has(f) && !files.includes(f))));
  const all = [...new Set([...files, ...byFile.keys(), ...foundBy, ...entered])].filter((f) => !taken.has(f) && !entryTaken(f)).map((file) => {
    const text = textOf(file);
    const ids = unmetIds(text);
    const fids = ids.filter(isFound);
    const row = rows.find((r) => r.req === file || `${dir}/${r.id}.md` === file);
    return { file, count: ids.length, over: overCap(cfg, file, text), ...(row ? { module: row.id, entry_state: row.tranche, ...(row.pr?.startsWith('#') || row.ahead > 0 || row.flag ? { attempt_open: true } : {}), ...(row.unread ? { unknown: true } : {}) } : {}), ...(fids.length ? { found: fids } : {}), ...(inLayer.has(file) && ids.length > fids.length ? { [after.has(file) ? 'after' : 'marks']: ids.filter((i) => !isFound(i)) } : {}), ...(byFile.has(file) ? { notices: byFile.get(file).map((n) => n.key) } : {}) };
  }).filter((x) => (inLayer.has(x.file) && x.count) || x.notices || (foundBy.has(x.file) && x.found) || (entered.has(x.file) && x.entry_state === 'OPEN' && x.count > 0));
  // The open layer's modules first, then those opened by uses; fewest unmet first within each.
  const later = (x) => (layer !== null && layerOf.has(x.file) && layerOf.get(x.file) !== layer ? 1 : 0);
  all.sort((a, b) => later(a) - later(b) || a.count - b.count || a.file.localeCompare(b.file));
  // Over the cap: BOB's act is the split or consolidation, listed apart, never as startable work.
  const big = all.filter((x) => x.over);
  for (const x of big) log(x.over);
  const debt = [...new Set(ahead)].map((f) => ({ f, t: textOf(f) })).filter((x) => overCap(cfg, x.f, x.t));
  if (debt.length) log(`cap debt: ${debt.length} requirement file${debt.length === 1 ? '' : 's'} over the cap${layer === null ? '' : ` from layer ${layer} on`}, ${debt.reduce((s, x) => s + Buffer.byteLength(x.t), 0)} bytes; each is split or consolidated before its job`);
  const layerWork = (x) => inLayer.has(x.file) && x.count > 0;
  const list = all.filter((x) => !x.over && layerWork(x));
  const foundList = all.filter((x) => !x.over && !layerWork(x) && foundBy.has(x.file) && x.found);
  const noticeList = all.filter((x) => !x.over && !layerWork(x) && !foundList.includes(x) && x.notices);
  // Entered by BOB and outside the other lists: listed apart, after them.
  const enteredList = all.filter((x) => !x.over && !layerWork(x) && !foundList.includes(x) && !x.notices && entered.has(x.file));
  // The release path first (coordinator, 5 Nov): process/config.json's release_path modules, and
  // the open round's layer and found work; debt (a file whose unmet marks are all base-red found
  // marks) after it, in the slots release work leaves free (ready.mjs startable).
  const rel = new Set(Array.isArray(cfg.release_path) ? cfg.release_path : []);
  for (const x of all) {
    if (isDebt(textOf(x.file))) x.debt = true;
    if (rel.has(x.module) || ((list.includes(x) || foundList.includes(x)) && !x.debt)) x.release = true;
  }
  // Read only with a count: layer close and the sweep's check list next work with none (review).
  const cap = live === undefined ? null : jobCap(cfg).cap;
  const n = live === undefined ? Infinity : Math.max(0, cap - live);
  // A module of a later layer than the open one is owed to its own layer: the layer flow starts it
  // from that layer's list once it opens, never early (the coordinator's ruling, 6 Nov). Kept in the
  // returned list marked owed_layer (the uses reading is unchanged), printed apart, never as work.
  const owedTo = [];
  for (const x of [...list, ...noticeList, ...foundList, ...enteredList]) {
    if (layer !== null && layerOf.has(x.file) && layerOf.get(x.file) > layer) { x.owed_layer = layerOf.get(x.file); owedTo.push(x); }
  }
  const now = (xs) => xs.filter((x) => !x.owed_layer);
  const [listN, noticeN, foundN, enteredN] = [now(list), now(noticeList), now(foundList), now(enteredList)];
  const shown = listN.slice(0, n);
  const shownN = noticeN.slice(0, Math.max(0, n - shown.length));
  const shownF = foundN.slice(0, Math.max(0, n - shown.length - shownN.length));
  const shownE = enteredN.slice(0, Math.max(0, n - shown.length - shownN.length - shownF.length));
  // A module whose layer is behind the open one joins the next layer to open (layer join; the
  // coordinator's ruling, 6 Nov): its act is the join, never a start on the tranche.
  const placeOf = new Map();
  const joinsAt = (x) => {
    if (!x.module) return null;
    if (!placeOf.has(x.module)) { let p = null; try { p = layerPlace(root, cfg, x.module); } catch { p = null; } placeOf.set(x.module, p); }
    const p = placeOf.get(x.module);
    return p?.behind && p.target !== null ? p.target : null;
  };
  const joinWhy = (x) => [x.found && `found marks ${x.found.join(', ')}`, x.notices && `provider notice ${x.notices.join(', ')}`, x.marks && `unmet marks ${x.marks.join(', ')}`].filter(Boolean).join('; ') || 'its unmet marks';
  const joinTag = (x) => { const t = joinsAt(x); return t === null ? '' : `; joins layer ${t}: ${joinAct(x.module, joinWhy(x), t)}`; };
  const tag = (x) => `${joinTag(x)}${x.found ? `; found ${x.found.join(', ')}` : ''}${x.notices ? `; provider notice ${x.notices.join(', ')}` : ''}${x.entry_state === 'OPEN' ? `; entry OPEN, never started: ${P3} layer jobs <n> lists its start` : ''}${x.after ? `; unmet after its job: ${x.after.join(', ')} (layer close defers them)` : ''}`;
  // Modules of the layers after the open one with unmet marks and no ledger entry (build
  // train-robust, item 7: 14 on the copy, 5 Nov, skipped silently, so no one saw they could never
  // start): each named, with its count, until BOB writes its entry. On the returned list as noEntry,
  // never as work (the idle-capacity line names them apart).
  const asWork = new Set([...list, ...noticeList, ...foundList, ...enteredList].map((x) => x.file));
  const noEntry = ls?.cur ? ls.layers.filter((L) => L.n > ls.cur.n).flatMap((L) => L.mods.filter((m) => !m.row && !asWork.has(m.file) && m.marks.length + m.found.length > 0)
    .map((m) => ({ id: m.id, file: m.file, layer: L.n, count: m.marks.length + m.found.length }))) : [];
  if (noEntry.length) {
    log(`no ledger entry: cannot start (${noEntry.length} module${noEntry.length === 1 ? '' : 's'} after the open layer with unmet marks; BOB writes each entry, or no job ever starts it):`);
    for (const m of noEntry) log(`- ${m.id} (layer ${m.layer}): no ledger entry: cannot start; ${m.count} unmet mark${m.count === 1 ? '' : 's'}`);
  }
  const waits = (a, b) => (live === undefined ? `all ${a.length} listed` : `${b.length} listed (jobs ${live} of ${cap}), ${a.length - b.length} wait`);
  if (listN.length) {
    log(`next work${layer === null ? '' : `, layer ${layer}`} (${open.length} jobs open; BOB chooses from these, unmet requirements each): ${live === undefined ? `${waits(listN, shown)}; pass --sessions <file> (or --live <the account's job sessions>) to list at most the job cap less them` : waits(listN, shown)}`);
    for (const x of shown) log(`- ${x.file}: ${x.count}${layerOf.has(x.file) ? ` (layer ${layerOf.get(x.file)})` : ''}${tag(x)}`);
  }
  if (noticeN.length) {
    log(`notice work (triage judged these affected; not layer work; each job adapts or confirms the code and adds its test): ${waits(noticeN, shownN)}`);
    for (const x of shownN) log(`- ${x.file}: ${x.count}; provider notice ${x.notices.join(', ')}`);
  }
  if (foundN.length) {
    log(`found work (work found elsewhere, ready by open_by ${openBy(cfg)}, whatever its layer; each job meets its found marks and adds its test): ${waits(foundN, shownF)}`);
    for (const x of shownF) log(`- ${x.file}: ${x.count}${layerOf.has(x.file) ? ` (layer ${layerOf.get(x.file)})` : ''}${tag(x)}${x.file.startsWith(`${FOUND_DIR}/`) ? `; no requirement file: BOB gives the module its requirement file and ledger entry, moving these marks there, before its job` : ''}`);
  }
  if (enteredN.length) {
    log(`entered, never started (BOB wrote the entry; ready whatever its layer or uses): ${waits(enteredN, shownE)}`);
    for (const x of shownE) log(`- ${x.file}: ${x.count}${layerOf.has(x.file) ? ` (layer ${layerOf.get(x.file)})` : ''}${tag(x)}`);
  }
  if (owedTo.length) {
    log('owed to their own layers (each starts from its layer\'s list once that layer opens, not now):');
    for (const x of owedTo) log(`- ${x.file}: ${x.count} (layer ${x.owed_layer}): owed to layer ${x.owed_layer}${x.found ? `; found ${x.found.join(', ')}` : ''}${x.notices ? `; provider notice ${x.notices.join(', ')}` : ''}`);
  }
  // Findings that name no module (found.mjs): BOB's act is to name one.
  const loose = noModuleFound(root, ref);
  if (loose.length) {
    log(`found, no module (${NO_MODULE}; BOB's act: name its module with \`${P3} found <module> "<finding>" --from "<source>"\`, deleting its line here in the same pull request):`);
    for (const f of loose) log(`- ${f.id} (${f.source}): ${f.finding.slice(0, 100)}`);
  }
  // Triage owed: BOB's act (owedNotices printed it), counted as work for BOB (sweep passes the notices).
  const triage = [...new Set(Object.values(owed).flat().filter((x) => !x.triage && !x.rerun).map((x) => x.key))].map((key) => ({ triage: key }));
  // The completion round (PLN-4): once every layer is closed, the completion file's open items.
  const round = ls && !ls.cur ? completionWork(root, cfg, rows, ref, log) : [];
  // The returned list holds all of them: a split owed is still work for BOB (sweep counts it).
  const out = [...list, ...noticeList, ...foundList, ...enteredList, ...big, ...triage, ...round, ...loose.map((f) => ({ file: NO_MODULE, found_no_module: f.id }))];
