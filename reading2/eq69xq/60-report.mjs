  const leadIn = stateRead ? leadInputs(root, cfg.state_branch, read.state, cfg.tranche) : {};
  const opened = openedAt(leadIn.grants, cfg);
  const inT = (r) => !!opened && typeof r.at === 'string' && Date.parse(r.at) >= Date.parse(opened);
  L.push(`# Tranche report: ${cfg.tranche}`, '', `Written ${now} from the record alone, at ${tip} ${(gitOut(root, ['rev-parse', tip]) || '').slice(0, 10)}. Every figure the record lacks reads \`${U}\`.`, '');

  // Elapsed
  L.push('## Elapsed time', '');
  L.push(`- opened: ${opened || U}${opened ? ' (the first ok grant row of its open, as lead times reads it)' : ' (the state branch\'s grant rows not read)'}`, `- ${s.close ? `closed (merged into main): ${s.close}` : 'still open; measured to now'}`);
  L.push(`- elapsed: ${!opened ? U : `${hours(opened, end)} h (${Math.round(hours(opened, end) / 24 * 10) / 10} days)`}`, '');

  // Work per layer
  const map = show(tip, cfg.layers_file);
  const layers = layerOf(map);
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  const ledger = Object.values(readLedgerTexts(root, tip)).flatMap((t) => { try { return [JSON.parse(t)]; } catch { return []; } });
  const mods = [...new Set([...layers.keys(), ...ledger.map((e) => e.id)])].sort();
  const reqFile = (m) => ledger.find((e) => e.id === m)?.requirements || `${dir}/${m}.md`;
  // Job merges: this tranche's merge rows (since the opening), each pull request once.
  const allMerges = rows.filter((r) => r.row === 'merge');
  const mergeRows = [...new Map(allMerges.filter(inT).sort((a, b) => String(a.at).localeCompare(String(b.at))).map((r) => [r.pr, r])).values()];
  const olderPRs = [...new Set(allMerges.filter((r) => !inT(r)).map((r) => r.pr))].filter((p) => !mergeRows.some((r) => r.pr === p)).sort((a, b) => a - b);
  const merged = read.merged();
  const closed = stateJsonl(CLOSED_FILE);
  const work = mods.map((m) => {
    const now_ = marks(show(tip, reqFile(m)));
    const before = s.base ? marks(show(s.base, reqFile(m))) : null;
    const met = before ? before.unmet.filter((id) => !now_.unmet.includes(id)) : U;
    return { m, layer: layers.get(m) ?? null, prs: opened ? [...new Set(mergeRows.filter((r) => r.module === m).map((r) => r.pr))] : U, met, unmet: now_.unmet, state: ledger.find((e) => e.id === m)?.status?.state ?? 'no ledger entry' };
  });
  L.push('## Work', '');
  const jobMerges = !opened ? `job merges since the opening ${U}` : `job merges recorded: ${mergeRows.length} distinct pull requests since the opening (${allMerges.filter(inT).length} merge rows)${olderPRs.length ? `; older than this tranche, left out: ${olderPRs.map((p) => `#${p}`).join(', ')}` : ''}`;
  L.push(`Pull requests merged into ${cfg.tranche}: ${merged === null ? `${U} (GitHub not read); ${jobMerges}` : `${opened ? merged.filter((p) => Date.parse(p.merged_at) >= Date.parse(opened)).length : `${merged.length} in all, since the tranche's opening ${U}`} (${jobMerges}; the rest plain)`}.`, '');
  // The review triggers' measure (coordinator's log, 4 Nov 19:05, recorded as Bob's decision, not quoted): this tranche's job merges, each pull request once.
  L.push(`- ${opened ? triggerSummary(mergeRows, rows.filter((r) => r.row === 'triggers')).line : `review triggers: ${U} (the tranche's opening not read)`}`, '');
  const byLayer = new Map();
  for (const w of work) byLayer.set(w.layer, [...(byLayer.get(w.layer) || []), w]);
  const order = [...byLayer.keys()].sort((a, b) => (a ?? Infinity) - (b ?? Infinity));
  // layer close's rows (status.mjs closedRows' rule): this tranche's name, and a commit the tranche
  // holds that main lacked when the tranche opened (closedRows' "not on main", which a tranche
  // already merged into main can no longer use).
  // Where the clone cannot say (a shallow clone lacks the commit, or the opening is unknown), an
  // open tranche asks GitHub's compare as closedRows does; otherwise the close is unmeasured.
  const inSpan = (sha) => {
    if (s.base && gitOut(root, ['cat-file', '-e', `${sha}^{commit}`]) !== null) {
      return gitOut(root, ['merge-base', '--is-ancestor', sha, tip]) !== null && gitOut(root, ['merge-base', '--is-ancestor', sha, s.base]) === null;
    }
    if (s.close) return null;
    let c = null;
    try { c = read.compare(sha); } catch { c = null; }
    return Number.isInteger(c?.ahead_by) ? c.ahead_by > 0 : null;
  };
  const mine = (closed || []).filter((r) => r.row === 'closed' && r.tranche === cfg.tranche && Number.isInteger(r.layer)).map((r) => ({ r, in: inSpan(String(r.commit)) }));
  const closedBy = new Map(mine.filter((x) => x.in === true).map((x) => [x.r.layer, x.r]));
  const undecided = new Set(mine.filter((x) => x.in === null && !closedBy.has(x.r.layer)).map((x) => x.r.layer));
  for (const n of order) {
    const ws = byLayer.get(n);
    const c = n === null ? null : closedBy.get(n);
    const metCount = ws.every((w) => Array.isArray(w.met)) ? ws.reduce((t, w) => t + w.met.length, 0) : U;
    L.push(`### ${n === null ? 'Not in the layer map' : `Layer ${n}`}${n === null ? '' : closed === null ? ` (closed: ${U}, state branch not read)` : undecided.has(n) ? ` (closed: ${U}, its close row's commit cannot be placed here)` : c ? ` (closed ${c.at} at ${String(c.commit).slice(0, 10)})` : ' (not closed)'}`, '');
    L.push(`Modules ${ws.length}; merged job PRs ${opened ? ws.reduce((t, w) => t + w.prs.length, 0) : U}; marks met ${metCount}.`, '');
    L.push(...table(['module', 'ledger', 'merged PRs', 'marks met'], ws.map((w) => [w.m, w.state, Array.isArray(w.prs) ? w.prs.map((p) => `#${p}`).join(', ') || 'none' : U, Array.isArray(w.met) ? `${w.met.length}${w.met.length ? ` (${w.met.join(', ')})` : ''}` : U])), '');
  }

  // Deferrals: a closed layer's row names its deferred marks; otherwise the marks unmet at the tip.
  L.push('## Deferrals', '', 'Marks left unmet per module: from the closed-layer row where its layer is closed, otherwise from the requirement file at the tip.', '');
  const def = work.map((w) => {
    const c = w.layer === null ? null : closedBy.get(w.layer);
    const d = c?.deferred?.[w.m];
    // Found marks are never deferred: they are counted under Found work.
    const ids = c ? (Array.isArray(d) ? d : d?.marks || []) : w.unmet.filter((x) => !isFound(x));
    return [w.m, c ? `layer ${w.layer} close` : undecided.has(w.layer) ? `tip (layer ${w.layer} close ${U})` : 'tip', ids.length, ids.join(', ') || 'none'];
  }).filter((r) => r[2] > 0);
  L.push(...(def.length ? table(['module', 'from', 'unmet', 'marks'], def) : ['None.']), '');

  // Provider notices (coordinator, 4 Nov): the open slots as status's one reader (status.mjs
  // noticeSlots) classes them, each with the command that closes it, so the count here and
  // `notice triage` agree; a withdrawn notice is closed, its unanswered slots counted apart.
  L.push(...noticeSection(slots), '');

  // Found work (found <module>): the found marks in the record, per module, its requirement file
  // and its found-work entry together, and those that name no module. Met: struck since the
  // tranche opened; found in this tranche: absent at its opening.
  const fileIds = (ref, f) => marks(show(ref, f));
  const entries = [...new Set([...mods, ...(gitOut(root, ['ls-tree', '--name-only', `${tip}:${FOUND_DIR}`]) || '').split('\n').filter((n) => n.endsWith('.md') && `${FOUND_DIR}/${n}` !== NO_MODULE).map((n) => n.slice(0, -3))])].sort();
  const foundRows = [...entries.map((m) => [m, [reqFile(m), foundFile(m)]]), ['(no module)', [NO_MODULE]]].map(([m, fs]) => {
    const at = (ref) => (ref ? fs.reduce((o, f) => { const k = fileIds(ref, f); return { all: [...o.all, ...k.all.filter(isFound)], unmet: [...o.unmet, ...k.unmet.filter(isFound)] }; }, { all: [], unmet: [] }) : null);
    const tipIds = at(tip);
    const base = s.base ? at(s.base) : null;
    return { m, all: tipIds.all, unmet: tipIds.unmet, added: base ? tipIds.all.filter((x) => !base.all.includes(x)).length : U, met: base ? base.unmet.filter((x) => !tipIds.unmet.includes(x)).length : U };
  }).filter((r) => r.all.length);
  L.push('## Found work', '', 'Found marks (`found <module>`: walk, deploy and other findings) in the record at the tip, per module; "found here" are those absent when the tranche opened, "met" those struck since.', '');
  const sum = (k) => (foundRows.every((r) => typeof r[k] === 'number') ? foundRows.reduce((t, r) => t + r[k], 0) : U);
  L.push(`Found marks ${foundRows.reduce((t, r) => t + r.all.length, 0)}; unmet ${foundRows.reduce((t, r) => t + r.unmet.length, 0)}; found here ${sum('added')}; met here ${sum('met')}.`, '');
  L.push(...(foundRows.length ? table(['module', 'found marks', 'unmet', 'found here', 'met here'], foundRows.map((r) => [r.m, r.all.length, r.unmet.join(', ') || 'none', r.added, r.met])) : ['None.']), '');

  // Cost and overhead
  // This tranche's rows: at the tip and on the job branches, each once, since the opening.
  const here = trancheRows(rows, jobRows, opened);
  const o = opened ? overhead(rows, layers, { opened, jobRows }) : null;
  const allMeasured = rows.filter((r) => r.row === 'attempt' && r.event === 'measured');
  const measured = (here || []).filter((r) => r.row === 'attempt' && r.event === 'measured');
  L.push('## Cost and overhead share', '', `Overhead as \`metrics report\` reckons it: ${o ? o.rule : `${U} (the tranche's opening not read)`}`, '');
  if (o) L.push(...(o.jobs.length ? table(['job', 'layer', 'job cost', 'reviews', 'BOB', 'ROOT', 'gate', 'overhead', 'share', 'unmeasured parts'],
    o.jobs.map((j) => [j.module, j.layer ?? 'none', usd(j.job_usd), usd(j.reviews_usd), usd(j.bob_usd), usd(j.root_usd), usd(j.gate_usd), usd(j.overhead_usd), pct(j.share), j.unmeasured.join(', ') || 'none'])) : [`No job has a measured row: cost per job ${U}.`]), '');
  if (o?.layers.length) L.push(...table(['layer', 'jobs', 'overhead', 'share', 'unmeasured parts'], o.layers.map((l) => [l.layer, l.jobs.join(', '), usd(l.overhead_usd), pct(l.share), l.unmeasured.join(', ') || 'none'])), '');
  // A BOB or ROOT row's cost is its session's cost so far: each such session counts its last row.
  const proc = (r) => r.role === 'bob' || r.role === 'root';
  const last = new Map();
  for (const r of measured.filter(proc).sort((a, b) => String(a.at).localeCompare(String(b.at)))) last.set(r.session || `${r.module} ${r.at}`, r);
  // A job row unmeasured stands only while its attempt has no priced one (as overhead reads it):
  // job complete's stale figure followed by the merge's priced row is one priced attempt.
  const jobRole = (r) => (r.role || 'job') === 'job';
  const pricedJob = new Set(measured.filter((r) => jobRole(r) && Number(r.cost_usd) > 0).map((r) => `${r.module}\0${r.attempt}`));
  const counted = [...measured.filter((r) => !proc(r) && !(jobRole(r) && !(Number(r.cost_usd) > 0) && pricedJob.has(`${r.module}\0${r.attempt}`))), ...last.values()];
  const pricedC = counted.filter((r) => Number.isFinite(Number(r.cost_usd)));
  // A session that began before the opening: its cost since then, less its last priced row before.
  const priorOf = (r) => (proc(r) && r.session ? Number(allMeasured.filter((x) => !inT(x) && proc(x) && x.session === r.session && Number.isFinite(Number(x.cost_usd))).sort((a, b) => String(a.at).localeCompare(String(b.at))).at(-1)?.cost_usd ?? 0) : 0);
  const total = pricedC.reduce((t, r) => t + Math.max(0, Number(r.cost_usd) - priorOf(r)), 0);
  const before = allMeasured.filter((r) => !inT(r));
  L.push(`- total cost since the opening: ${!opened ? U : !counted.length ? `${U} (no measured row since the opening)` : pricedC.length === counted.length ? usd(total) : `${U} (${usd(total)} over ${pricedC.length} priced rows; ${counted.length - pricedC.length} without a cost)`}${opened && before.length ? `; ${before.length} measured rows older than this tranche (${[...new Set(before.map((r) => r.module))].sort().join(', ')}) left out` : ''}`);
  L.push(`- BOB and ROOT cost not attributed to a job: ${o ? usd(o.unattributed_usd) : U}`, '');

