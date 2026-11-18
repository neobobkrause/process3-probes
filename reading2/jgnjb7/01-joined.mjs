// ===== file: status.mjs (continued) =====

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

// Rule for jobs: every file the job writes begins with this exact first line: `# ref M2D-9747`.

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
  Object.defineProperty(out, 'noEntry', { value: noEntry, enumerable: false }); // read by name only: the list compares as before
  return out;
}

// The completion file's open items, not deferred: a module item through job start as usual (its
// requirement lines written first), unless its job is open; a whole-product item is BOB's act.
export function completionWork(root, cfg, rows, ref, log = console.log) {
  const c = completionItems(root, cfg, ref);
  if (!c) return [];
  if (c.missing) { log(`completion round: ${c.file} is not on ${ref || 'the working tree'}`); return [{ file: c.file, missing: true }]; }
  const open = openItems(c);
  if (!open.length) { log(`completion round: every item of ${c.file} done or deferred; the tranche can close: ${P3} tranche close`); return []; }
  const job = (id) => rows.find((r) => r.id === id && jobOpen(r));
  // In the layer flow a module's item runs in the completion layer (C33): its act is that layer's.
  let start = (id) => `${P3} job start ${id} --sessions <file>`;
  if (layerMode(cfg)) {
    try {
      const ls = layersAtFlow(root, cfg, ref);
      const comp = ls.filter((L) => L.completion).at(-1);
      const live = comp && !flowRowsOf(root, cfg.state_branch, comp.n).merged;
      // BD-R1 (Bob, 8 Nov): no completion layer opens any more; an item left once the open one
      // merged is a flaw of its module, entered as a found mark, so a round's layer runs it.
      if (ls.length) start = (id) => (live ? `${P3} layer jobs ${comp.n}` : `no completion layer opens (BD-R1): enter it as a found mark (\`${P3} found ${id} "<the item>" --from "<its source>"\`) and tick it, so a round's layer runs it`);
    } catch { /* the plain act */ }
  }
  log(`next work, the completion round (${c.file}, ${open.length} open; done: tick its line; deferred: "deferred: <reason>" on its line):`);
  for (const x of open) log(x.malformed ? `- ${c.file}:${x.line}: not an item line (\`- [ ] <id> · <module or whole product> · <what>\`); fix it: ${x.what.slice(0, 100)}` : `- ${x.id} · ${x.target}: ${x.whole ? "BOB's act" : job(x.target) ? 'its job is open' : start(x.target)}${x.what ? ` · ${x.what.slice(0, 100)}` : ''}`);
  return open.map((x) => ({ file: c.file, item: x.id, target: x.target }));
}

// The lanes with more than one live session (status, sweep): the recorded seat, the lane module's
// open job (rows: status's ledger rows), and, with list_sessions, the sessions not archived titled
// `lane <name>` or `job <module>`; each a defect line.
// Open as sessionActs judges a job open: not merged, and not deferred (BLOCKED, its pull request closed).
const laneJobOpen = (r) => !!r && !jobDone(r) && !(r.tranche === 'BLOCKED' && r.blocked && !String(r.pr || '').startsWith('#') && !/^WORKING/.test(String(r.branch || ''))) && (/^(OPEN|WORKING|BLOCKED)/.test(String(r.branch || '')) || String(r.pr || '').startsWith('#'));
export function laneDefects(cfg, seats, { rows = [], listed = null } = {}) {
  const out = [];
  let all = [];
  try { all = Array.isArray(cfg.lanes) ? lanes(cfg) : []; } catch { all = []; }
  for (const l of all) {
    const holders = new Set();
    const s = seats?.get(l.name);
    if (s) holders.add(s.session || `lane ${l.name} (pending)`);
    if (l.module && laneJobOpen(rows.find((r) => r.id === l.module))) holders.add(`job ${l.module}`);
    // The listed sessions: each `lane <name>` not archived, and the module's latest job session
    // (jobSession; an older one beside it after a restart is the sweep's leftover, not a second).
    const live = (listed || []).filter((y) => !isArchived(y));
    for (const x of live.filter((y) => String(y.title || '').trim() === `lane ${l.name}`)) {
      if (s && !s.session) holders.delete(`lane ${l.name} (pending)`);
      holders.add(sessionId(x));
    }
    const js = l.module ? jobSession(live, l.module) : null;
    if (js) { holders.delete(`job ${l.module}`); holders.add(sessionId(js)); }
    if (holders.size > 1) out.push(`defect: lane ${l.name} has ${holders.size} live sessions (${[...holders].join(', ')}): one session per lane at a time; end or archive all but one (lane end ${l.name} frees the lane's seat${l.module ? `; job ${l.module} ends as it completes` : ''})`);
  }
  return out;
}

// ===== file: layerflow.test.mjs (later part) =====

  assert.doesNotMatch(why('b') || '', /breaking change/);
  assert.match(why('c'), /c owes a job for a's breaking change/);
  // A land recorded before PD-15 (uncapped, breaking by its tests) reads as breaking.
  assert.match(interfaceText({ class: 'breaking', test_only: { files: ['test/a/r2.test.mjs'], by_tests: 'breaking', earlier_source: true } }), /breaking by its tests alone: each user re-runs in a job/);
  // The report counts the land additive, b's retest owed and c's job.
  const m = layerReport(root, 1, { log: quiet }).measures;
  assert.deepEqual([m.lands_additive, m.lands_breaking, m.reschedules, m.retests_owed], [2, 0, 1, 2]);
});

// C11 c (the coordinator, 7 Nov): a false reschedule had no scoped clear, only notice withdraw (every
// user) or a retest. layer clear records the ruling for one user and one provider.
test('layer clear: one user\'s reschedule from one provider cleared with the ruling recorded; refused without why or with none owed', async () => {
  const { root, bare } = await opened();
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\nexport const a2 = 1;\n' });
  const ra = await layerLand(root, 2, { io: landIO(bare, { 2: prOf(2, 'a', ha) }, { open: [] }), log: quiet });
  assert.deepEqual(ra.land.users_rescheduled, ['b']);
  assert.throws(() => layerClear(root, 'b', { provider: 'a', log: quiet }), /--why/);
  // A second breaking land by a: one clear per land, named (cold review of C11).
  const hb = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y, z) { return x; }\n' });
  const rb = await layerLand(root, 3, { io: landIO(bare, { 3: prOf(3, 'a', hb) }, { open: [] }), log: quiet });
  assert.throws(() => layerClear(root, 'b', { provider: 'a', why: 'x', log: quiet }), /b owes reschedules from a's 2 lands .*name the one the ruling is for with --land <sha>; nothing recorded/);
  layerClear(root, 'b', { provider: 'a', land: rb.land.merge.slice(0, 10), why: 'the second land changes nothing b reads', log: quiet });
  fetchState(root, SB, { fresh: true });
  assert.equal(flowRows(root, SB, 1).reschedules.length, 1, 'the first stands');
  assert.throws(() => layerClear(root, 'c', { provider: 'a', why: 'x', log: quiet }), /c owes no reschedule from a in layer 1; nothing recorded/);
  const lines = [];
  const r = layerClear(root, 'b', { provider: 'a', land: ra.land.merge, why: 'the coordinator, 7 Nov: b imports nothing a changed', by: 'coordinator', log: (l) => lines.push(l) });
  assert.equal(r.cleared.length, 1);
  assert.match(lines[0], /^b: 1 reschedule\(s\) from a cleared in layer 1 \(the coordinator, 7 Nov: b imports nothing a changed\)/);
  fetchState(root, SB, { fresh: true });
  const rows = flowRows(root, SB, 1);
  assert.deepEqual([rows.reschedules.length, rows.clears.map((c) => [c.user, c.provider, c.by]).sort()], [0, [['b', 'a', 'bob'], ['b', 'a', 'coordinator']]]);
  assert.equal(rows.reschedules_all.length, 2, 'the trial still counts both');
  assert.notEqual(layerJobs(root, 1, { io: openIO, log: quiet }).states.find((x) => x.id === 'b').state, 'rescheduled');
});

// C32 (copy layer 11, 8 Nov): a land changed files its module's paths held at the land's parent;
// the ledger at the head credits them to another module (paths moved since, as BOB's ledger
// widening PR 865 gave op-grades the files op-grades-folds owns at the head). Each file is credited
// per commit, by the paths at that land's parent: covered. A file changed by a land of a module
// whose paths never held it stays a finding.
test('C32: a file changed by a verified land is covered by the paths its module held at the land\'s parent, whoever owns it at the head', async () => {
  const { root, bare } = await opened();
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' });
  const prs = { 1: prOf(1, 'a', ha) };
  let mergedAs = null;
  const io0 = landIO(bare, prs);
  await layerLand(root, 1, { io: { ...io0, merge: (s, k, sha, t) => { const r = io0.merge(s, k, sha, t); mergedAs = r.sha; return r; } }, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const at = (id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root }));
  // At the head the ledger gives src/a/ to a new module a2, and a's paths moved elsewhere.
  const moved = [{ ...at('a'), paths: ['src/a-old/'] }, { ...at('a'), id: 'a2', paths: ['src/a/'], tests: [], requirements: null }, at('b'), at('c'), at('d')];
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const green = { sha: ha, ok: true, trigger: 'code', suite: 'pass', scope: ['a'] };
  const io = { getPR: () => ({ ...prs[1], merged: true, merge_commit_sha: mergedAs }), verify: () => true, comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [green] }, 'gate') }] };
  const r = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries: moved, slug: 'o/p', io });
  assert.deepEqual(r.findings.filter((f) => f.file === 'src/a/index.mjs'), [], 'a\'s land, a\'s paths at its parent: covered though a2 owns it now');
});

// C32's other side: a verified land of a module whose paths at the land's parent never held the file
// covers nothing for it, whoever owns it at the head: a finding naming the land and why.
test('C32: a file changed by another module\'s verified land stays a finding, naming the land', async () => {
  const { root, bare } = await opened();
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n', 'src/c/index.mjs': 'export const c = 7;\n' });
  const prs = { 1: prOf(1, 'a', ha) };
  let mergedAs = null;
  const io0 = landIO(bare, prs);
  // layer land refuses it (ARC-2); a merge made around the tool is what the gate must still catch.
  mergedAs = io0.merge('o/p', 1, ha, 'Merge layer PR 1').sha;
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  assert.ok(mergedAs, 'the land merged the cross-module change, as GitHub would');
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const green = { sha: ha, ok: true, trigger: 'code', suite: 'pass', scope: ['a'] };
  const io = { getPR: () => ({ ...prs[1], merged: true, merge_commit_sha: mergedAs }), verify: () => true, comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [green] }, 'gate') }] };
  const r = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io });
  assert.ok(r.findings.some((f) => f.file === 'src/c/index.mjs' && /c changed with no land of its publish on layer\/1: src\/c\/index\.mjs by \w{10}, which is a's land \(PR 1\), whose paths at \w{10} did not hold src\/c\/index\.mjs/.test(f.message)), JSON.stringify(r.findings));
});

// Cold review of C32: the per-commit credit is stricter than the old after-the-last-land test: a
// commit on the layer that is not a sync or a verified land, before a module's last land, fails too.
test('C32: a hand-made commit on the layer before a module\'s last land is still a finding', async () => {
  const { root, bare } = await opened();
  // A commit pushed straight to layer/1, changing a's file: no sync, no land.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'layer/1', 'origin/layer/1'], { cwd: d });
  const hand = commit(d, { 'src/a/index.mjs': 'export function a(x) { return x - 1; }\n' }, 'by hand');
  git(['push', '-q', 'origin', 'layer/1'], { cwd: d });
  // Then a's land, which holds the hand commit.
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' });
  const prs = { 1: prOf(1, 'a', ha) };
  const io0 = landIO(bare, prs);
  const mergedAs = io0.merge('o/p', 1, ha, 'Merge layer PR 1').sha;
  git(['fetch', '-q', 'origin'], { cwd: root });
  const head = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const mb = git(['merge-base', head, 'origin/tranche'], { cwd: root });
  const changed = git(['diff', '--name-only', mb, head], { cwd: root }).split('\n').filter(Boolean);
  const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });
  const green = { sha: ha, ok: true, trigger: 'code', suite: 'pass', scope: ['a'] };
  const io = { getPR: () => ({ ...prs[1], merged: true, merge_commit_sha: mergedAs }), verify: () => true, comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [green] }, 'gate') }] };
  const r = layerCover(root, cfg, { head, mb, branch: 'layer/1', changed, entries, slug: 'o/p', io });
  assert.ok(r.findings.some((f) => f.file === 'src/a/index.mjs' && f.message.includes(`by ${hand.slice(0, 10)}, which is not a land of a publish PR: not a layer sync or a verified land`)), JSON.stringify(r.findings));
});

// C33 (PLN-4, PD-12): the completion round on the layer machinery. Every layer of the map closed and
// completion_file with open items: layer open <last+1> opens the completion layer, its modules the
// items', without editing the map; layer jobs lists each as a reopen with the item's words; the
// module's job runs on layer/<n>; a land, then layer merge ticks the item.
const ROUND = 'build/round.md';
// BD-R1 (Bob, 8 Nov) retires the completion layer's open: the copy's layer 12, opened under PD-12,
// is the last. Each product here has layer 3 opened as that one was: its open row as the open wrote
// it (completion: { file, items, mods }, the open items' modules in file order); layer open 3 then
// cuts its branch, and the rest of its life (jobs, joins, lands, ticks, merge) runs as before.
function completed(round, over = {}) {
  const p = product({ done: true, over, config: { completion_file: ROUND } });
  commit(p.root, { [ROUND]: round }, 'the completion round');
  git(['push', '-q', 'origin', 'tranche'], { cwd: p.root });
  git(['fetch', '-q', 'origin'], { cwd: p.root });
  const items = parseCompletion(round).filter((x) => !x.done && !x.deferred && !x.whole).map((x) => ({ id: x.id, module: x.target, what: x.what }));
  const mods = [...new Set(items.map((x) => x.module))];
  writeRows(p.root, SB, 'layer 3 open (the completion round, under PD-12)', [[flowFile(3, 'open'), { row: 'open', layer: 3, branch: 'layer/3', tranche: 'tranche', at: new Date().toISOString(), by: 'bob', completion: { file: ROUND, items, mods } }]]);
  fetchState(p.root, SB, { fresh: true });
  return p;
}
test('C33: a completion layer opened under PD-12 (as the copy\'s layer 12) still works: it lists each open item as a reopen, runs its jobs on layer/<n>, and ticks a landed item at layer merge', async () => {
  const { root, bare } = completed('# Round\n\n- [x] CR-1 · c · done already\n- [ ] CR-2 · a · strengthen the R1 test\n- [ ] CR-3 · whole product · a walk of every screen\n- [ ] CR-4 · b · deferred: waits on a ruling\n- [ ] CR-5 · d · the d door\n', { d: { status: { state: 'BLOCKED', reason: 'waits on a ruling' } } });
  // Opened under PD-12 (its open row, as the copy's layer 12's): layer open cuts its branch.
  const said = [];
  const o = layerOpen(root, 3, { io: openIO, log: (l) => said.push(String(l)) });
  assert.equal(o.ok, true);
  assert.match(said.join('\n'), /layer 3: 2 module\(s\); 1 job\(s\) can start/);
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json', completion_file: ROUND });
  assert.equal(git(['show', 'origin/tranche:build/layers.md'], { cwd: root }), layers.trimEnd(), 'the map is not edited');
  assert.deepEqual(layersAt(root, cfg, 'origin/tranche').map((L) => [L.n, L.mods.join(',')]), [[1, 'a,b,c'], [2, 'd'], [3, 'a,d']]);
  const j = layerJobs(root, 3, { io: openIO, log: quiet });
  assert.deepEqual(j.startable.map((x) => x.cmd), ['node .process/tool/p3.mjs job start a --sessions <file> --reopen "CR-2: strengthen the R1 test"'], 'd is BLOCKED: deferred, as any layer counts it');
  // The job's config: layer/3 (job start --reopen refused "no open branch" before).
  assert.equal(jobCfg(root, loadConfig(root), 'a').layer?.n, 3);
  // a's work lands on layer/3; layer merge ticks CR-2 only (d, BLOCKED, did not land; CR-4 is deferred).
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' }, { n: 3 });
  const prs = { 7: prOf(7, 'a', ha, { base: { ref: 'layer/3' } }) };
  let landedAs = null;
  const lio = { ...landIO(bare, prs), merge: (s, k, sha, title) => { const r = ghMerge(bare, 'layer/3', sha, title); landedAs = r.sha; return r; } };
  await layerLand(root, 7, { io: lio, log: quiet });
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 50, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }) };
  const out = [];
  await layerMerge(root, 3, { io: mio, wait: false, log: (l) => out.push(String(l)) }).catch((e) => { out.push(`REFUSED ${e.message}`); });
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.ok(!out.some((l) => l.startsWith('REFUSED')), out.join('\n'));
  const round = git(['show', `origin/layer/3:${ROUND}`], { cwd: root });
  assert.match(round, /- \[x\] CR-2 · a/);
  assert.match(round, /- \[ \] CR-5 · d/, 'd did not land: open');
  assert.match(round, /- \[ \] CR-4 · b · deferred/, 'deferred: as it was');
  assert.match(round, /- \[ \] CR-3 · whole product/);
  const tick = git(['log', '-1', '--format=%H', '--grep=^Tick completion items', 'origin/layer/3'], { cwd: root });
  assert.match(git(['log', '-1', '--format=%s', tick], { cwd: root }), /^Tick completion items of layer 3: CR-2$/);
  assert.match(git(['show', `origin/tranche:${ROUND}`], { cwd: root }), /- \[x\] CR-2 · a/, 'the layer PR carried the tick into the tranche');
  // The layer gate: the tick is covered; a hand edit of the completion file on the layer is not.
  const cover = (head) => {
    const mb = git(['merge-base', head, tick + '~1'], { cwd: root });
    const base = git(['rev-parse', `${landedAs}^1`], { cwd: root });
    const changed = git(['diff', '--name-only', base, head], { cwd: root }).split('\n').filter(Boolean);
    const entries = ['a', 'b', 'c', 'd'].map((id) => JSON.parse(git(['show', `${head}:process/ledger/${id}.json`], { cwd: root })));
    const green = { sha: ha, ok: true, trigger: 'code', suite: 'pass', scope: ['a'] };
    const io = { getPR: () => ({ ...prs[7], merged: true, merge_commit_sha: landedAs }), verify: () => true, comments: () => [{ user: { login: BOT }, body: block(GATE, { runs: [green] }, 'gate') }] };
    void mb;
    return layerCover(root, cfg, { head, mb: base, branch: 'layer/3', changed, entries, slug: 'o/p', io }).findings.filter((f) => f.file === ROUND);
  };
  assert.deepEqual(cover(tick), [], 'the tool\'s tick of a landed module\'s item');
  const d2 = clone(bare);
  git(['checkout', '-q', '-B', 'x', tick], { cwd: d2 });
  const hand = commit(d2, { [ROUND]: git(['show', `${tick}:${ROUND}`], { cwd: root, allowFail: true }).stdout.replace('- [ ] CR-5', '- [x] CR-5') }, 'Tick completion items of layer 3: CR-5');
  git(['push', '-q', 'origin', 'x'], { cwd: d2 });
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.match(cover(hand).map((f) => f.message).join('\n'), /changed on layer\/3 by \w{10}, which ticks CR-5, whose module d has no verified land on the layer/);
  const d3 = clone(bare);
  git(['checkout', '-q', '-B', 'y', tick], { cwd: d3 });
  const other = commit(d3, { [ROUND]: git(['show', `${tick}:${ROUND}`], { cwd: root, allowFail: true }).stdout.replace('- [ ] CR-5', '- [x] CR-5') }, 'Tick completion items of layer 4: CR-5');
  git(['push', '-q', 'origin', 'y'], { cwd: d3 });
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.match(cover(other).map((f) => f.message).join('\n'), /which is not the tool's tick of this completion layer/, 'a tick titled for another layer');
});

test('BD-R1: no completion layer opens any more: open items past the map open no layer before a walk; a map layer still open refuses as before', () => {
  const p0 = product({ done: true, config: { completion_file: ROUND } });
  commit(p0.root, { [ROUND]: '- [ ] CR-1 · a · x\n' }, 'round');
  git(['push', '-q', 'origin', 'tranche'], { cwd: p0.root });
  git(['fetch', '-q', 'origin'], { cwd: p0.root });
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json', completion_file: ROUND });
  const v = openLayer(p0.root, cfg, { slug: 'o/p', io: openIO });
  assert.deepEqual([v.kind, v.round, v.rounds], ['done', 1, 'walk'], 'round 1 waits on its walk, no completion layer is next');
  assert.match(layerLines(p0.root, cfg, { slug: 'o/p', io: openIO, view: v }).join('\n'), /layer flow: every layer of round 1 has merged; its walk ends it \(the round-close run, BD-R1\)/);
  assert.throws(() => layerOpen(p0.root, 3, { io: openIO, log: quiet }), /layer 3 is not in build\/layers\.md on tranche, and every layer of round 1 has merged: its walk ends it \(the round-close run\): no round layer opens before that walk \(BD-R1\); nothing was opened/);
  assert.equal(git(['ls-remote', '--heads', 'origin', 'layer/3'], { cwd: p0.root }), '', 'no branch cut');
  // A map layer still open (layer 1's marks unmet): the existing refusal.
  const p = product({ config: { completion_file: ROUND } });
  commit(p.root, { [ROUND]: '- [ ] CR-1 · a · x\n' }, 'round');
  git(['push', '-q', 'origin', 'tranche'], { cwd: p.root });
  git(['fetch', '-q', 'origin'], { cwd: p.root });
  assert.throws(() => layerOpen(p.root, 3, { io: openIO, log: quiet }), /layer 1 is not closed/);
  const none = product({ done: true });
  assert.throws(() => layerOpen(none.root, 5, { io: openIO, log: quiet }), /layer 5 is not in build\/layers\.md on tranche; the next past it is 3/);
});

// Cold review of C33: a completion file edited on the tranche while the completion layer is open
// (BOB ticks a whole-product item there) would make the layer PR conflict: layer merge refuses
// before ticking, naming layer sync; and only text that differs by ticks counts as the same.
test('C33: layer merge refuses to tick over a completion file the tranche changed; onlyTicks', async () => {
  assert.equal(onlyTicks('- [ ] A · a · x\n- [ ] B · b · y\n', '- [x] A · a · x\n- [ ] B · b · y\n'), true);
  assert.equal(onlyTicks('- [ ] A · a · x\n', '- [ ] A · a · changed\n'), false);
  assert.equal(onlyTicks('- [x] A · a · x\n', '- [ ] A · a · x\n'), false, 'an untick is not a tick');
  const { root, bare } = completed('- [ ] CR-2 · a · strengthen\n- [ ] CR-3 · whole product · a walk\n');
  layerOpen(root, 3, { io: openIO, log: quiet });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' }, { n: 3 });
  const prs = { 7: prOf(7, 'a', ha, { base: { ref: 'layer/3' } }) };
  await layerLand(root, 7, { io: { ...landIO(bare, prs), merge: (s, k, sha, title) => ghMerge(bare, 'layer/3', sha, title) }, log: quiet });
  // BOB ticks the whole-product item on the tranche meanwhile.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'tranche', 'origin/tranche'], { cwd: d });
  commit(d, { [ROUND]: '- [ ] CR-2 · a · strengthen\n- [x] CR-3 · whole product · a walk\n' }, 'CR-3 walked');
  git(['push', '-q', 'origin', 'tranche'], { cwd: d });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: () => { throw new Error('no PR may open'); }, checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: () => { throw new Error('no merge'); } };
  await assert.rejects(layerMerge(root, 3, { io: mio, wait: false, log: quiet }), /build\/round\.md changed on tranche since layer\/3 was cut: run node \S+ layer sync 3 first/);
  assert.doesNotMatch(git(['log', '-1', '--format=%s', 'origin/layer/3'], { cwd: root }), /^Tick completion items/, 'nothing ticked');
});

// C35 (PD-14): an item added to completion_file after the completion layer opened, for a module not
// in it, joins that OPEN layer: status and layer jobs name the join, the join records the items, the
// module starts as a reopen with its items' words, the merge waits on it, and ticks its items.
test('C35: a module with a completion item added after the open joins the open completion layer, starts with its items, holds the merge, and is ticked', async () => {
  const { root, bare } = completed('- [ ] CR-2 · a · strengthen the R1 test\n');
  layerOpen(root, 3, { io: openIO, log: quiet });
  // BOB adds CR-6 for c (COMPLETE, map layer 1) on the tranche.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'tranche', 'origin/tranche'], { cwd: d });
  commit(d, { [ROUND]: '- [ ] CR-2 · a · strengthen the R1 test\n- [ ] CR-6 · c · the c fix provenance needs\n' }, 'CR-6');
  git(['push', '-q', 'origin', 'tranche'], { cwd: d });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json', completion_file: ROUND });
  // Named as a join, in layer jobs and in the open layer's starts (status, idle checks).
  const j0 = layerJobs(root, 3, { io: openIO, log: quiet });
  assert.deepEqual(j0.startable.find((x) => x.id === 'c'), { id: 'c', join: true, items: ['CR-6'], cmd: 'node .process/tool/p3.mjs layer join c --why "CR-6: the c fix provenance needs", then node .process/tool/p3.mjs layer jobs 3 and its job start' });
  assert.ok(openLayer(root, cfg, { slug: 'o/p', io: openIO }).startable.some((x) => x.id === 'c' && x.join));
  assert.equal(openLayer(root, cfg, { slug: 'o/p', io: openIO }).ready, false, 'a pending join holds the merge');
  // A module with no open item: the refusal stands.
  assert.throws(() => layerJoin(root, 'b', { why: 'x', log: quiet }), /no layer follows layer 3/);
  // Before the join: a lands and the layer syncs the tranche's file, and still the merge refuses,
  // naming the join (cold review of C35: else CR-6 would drift to a later round).
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' }, { n: 3 });
  const prs = { 7: prOf(7, 'a', ha, { base: { ref: 'layer/3' } }) };
  const lio = { ...landIO(bare, prs), merge: (s, k, sha, title) => ghMerge(bare, 'layer/3', sha, title) };
  await layerLand(root, 7, { io: lio, log: quiet });
  const made = [];
  await layerSync(root, 3, { io: { ...syncIO(bare, made), merge: (s, k, sha, title) => ghMerge(bare, 'layer/3', sha, title) }, log: quiet });
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 50, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }) };
  await assert.rejects(layerMerge(root, 3, { io: mio, wait: false, log: quiet }), /layer 3 cannot merge: c has open completion item\(s\) CR-6 and has not joined: node \S+ layer join c/);
  // The join, into the open layer 3, with its items.
  const said = [];
  const r = layerJoin(root, 'c', { why: 'CR-6', log: (l) => said.push(String(l)) });
  assert.deepEqual([r.layer, r.recorded], [3, true]);
  assert.match(said.join('\n'), /c joins layer 3: CR-6 with CR-6; it starts from node \S+ layer jobs 3$/);
  assert.deepEqual(flowRows(root, SB, 3).joins.find((x) => x.module === 'c').items, [{ id: 'CR-6', module: 'c', what: 'the c fix provenance needs' }]);
  // It starts as a reopen with its item's words, on layer/3.
  const j1 = layerJobs(root, 3, { io: openIO, log: quiet });
  assert.ok(j1.startable.some((x) => x.cmd === 'node .process/tool/p3.mjs job start c --sessions <file> --reopen "CR-6: the c fix provenance needs"'), JSON.stringify(j1.startable));
  assert.ok(!j1.startable.some((x) => x.join), 'no join left');
  assert.equal(jobCfg(root, loadConfig(root), 'c').layer?.n, 3);
  // Joined, the merge waits on c, as on its own modules; c lands; the merge ticks both.
  await assert.rejects(layerMerge(root, 3, { io: mio, wait: false, log: quiet }), /c is not started/);
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' }, { n: 3 });
  prs[8] = prOf(8, 'c', hc, { base: { ref: 'layer/3' } });
  await layerLand(root, 8, { io: lio, log: quiet });
  await layerMerge(root, 3, { io: mio, wait: false, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const round = git(['show', `origin/tranche:${ROUND}`], { cwd: root });
  assert.match(round, /- \[x\] CR-2 · a/);
  assert.match(round, /- \[x\] CR-6 · c/);
});

// PD-14 (i): an item added later for a module already in the open completion layer (its own, here
// one that landed already) joins it the same way: named as a join, holds the merge, recorded as an
// item row; the module runs again with all its items' words; a land of a job started before the row
// does not do the item; the merge ticks it only after a land that did.
test('PD-14 (i): a later item for a module already in the open completion layer joins it, re-runs the module, and is ticked only after', async () => {
  const { root, bare } = completed('- [ ] CR-2 · a · strengthen the R1 test\n');
  layerOpen(root, 3, { io: openIO, log: quiet });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' }, { n: 3 });
  const prs = { 7: prOf(7, 'a', ha, { base: { ref: 'layer/3' } }) };
  const lio = { ...landIO(bare, prs), merge: (s, k, sha, title) => ghMerge(bare, 'layer/3', sha, title) };
  // a's job starts (its start row), and lands.
  writeRows(root, SB, 'start a', [[flowFile(3, 'start', 'a-1'), { row: 'start', layer: 3, module: 'a', attempt: 1, at: '2026-01-01T00:00:00.000Z' }]]);
  await layerLand(root, 7, { io: lio, log: quiet });
  // BOB adds CR-7 for a on the tranche; the layer syncs it in.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'tranche', 'origin/tranche'], { cwd: d });
  commit(d, { [ROUND]: '- [ ] CR-2 · a · strengthen the R1 test\n- [ ] CR-7 · a · and the R2 one; today: the R3 one\n' }, 'CR-7');
  git(['push', '-q', 'origin', 'tranche'], { cwd: d });
  git(['fetch', '-q', 'origin'], { cwd: root });
  await layerSync(root, 3, { io: { ...syncIO(bare, []), merge: (s, k, sha, title) => ghMerge(bare, 'layer/3', sha, title) }, log: quiet });
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json', completion_file: ROUND });
  // Named as a join (a, complete, has nothing else to start), and it holds the merge.
  const j0 = layerJobs(root, 3, { io: openIO, log: quiet });
  assert.deepEqual(j0.startable.filter((x) => x.id === 'a'), [{ id: 'a', join: true, more: true, items: ['CR-7'], cmd: 'node .process/tool/p3.mjs layer join a --why "CR-7: and the R2 one; today: the R3 one", then node .process/tool/p3.mjs layer jobs 3 and its job start' }]);
  assert.equal(openLayer(root, cfg, { slug: 'o/p', io: openIO }).ready, false);
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 50, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }) };
  await assert.rejects(layerMerge(root, 3, { io: mio, wait: false, log: quiet }), /layer 3 cannot merge: a has open completion item\(s\) CR-7 not yet joined into the layer: node \S+ layer join a/);
  const st = [];
  layerStatus(root, 3, { io: openIO, log: (l) => st.push(String(l)) });
  assert.match(st.join('\n'), /layer 3 cannot merge yet: 0 module\(s\) not complete, completion item\(s\) to join: a \(CR-7\)/, 'layer status agrees with layer merge (cold review of (i))');
  // The join: an item row; a again, with both items' words.
  const said = [];
  const r = layerJoin(root, 'a', { why: 'CR-7', log: (l) => said.push(String(l)) });
  assert.deepEqual([r.layer, r.recorded, r.items], [3, true, ['CR-7']]);
  assert.match(said.join('\n'), /a joins CR-7 into layer 3, where it is already: CR-7/);
  assert.deepEqual(flowRows(root, SB, 3).items.map((x) => [x.module, x.items.map((y) => y.id)]), [['a', ['CR-7']]]);
  assert.throws(() => layerJoin(root, 'a', { why: 'CR-7', log: quiet }), /a is in layer 3, the open layer: it starts from node \S+ layer jobs 3; nothing recorded/, 'joined once: nothing new');
  const j1 = layerJobs(root, 3, { io: openIO, log: quiet });
  assert.deepEqual(j1.startable.map((x) => x.cmd), ['node .process/tool/p3.mjs job start a --sessions <file> --reopen "CR-2: strengthen the R1 test; CR-7: and the R2 one; today: the R3 one"']);
  await assert.rejects(layerMerge(root, 3, { io: mio, wait: false, log: quiet }), /a is not started/);
  // The ids from the items, not split from their words, which may hold '; ' and ': ' (copy, 8 Nov).
  const st1 = [];
  layerStatus(root, 3, { io: openIO, log: (l) => st1.push(String(l)) });
  assert.ok(st1.includes('a: not started (completion item(s) joined after its last job started: CR-2, CR-7)'), st1.join('\n'));
  // A land of a job started before the row (the first job, landing again) does not do CR-7.
  const rows = (lands, starts) => ({ items: [{ module: 'a', at: '2026-06-01' }], lands: lands.map((at) => ({ module: 'a', at })), starts: starts.map((at) => ({ module: 'a', at })) });
  assert.equal(itemsOwed(rows(['2026-07-01'], ['2026-05-01']), 'a').length, 1, 'its job started before the row');
  assert.equal(itemsOwed(rows(['2026-07-01'], ['2026-05-01', '2026-06-15']), 'a').length, 0, 'a job started after the row landed');
  assert.equal(itemsOwed(rows(['2026-07-01'], []), 'a').length, 0, 'no start row: the land counts');
  assert.equal(itemsOwed(rows(['2026-05-15'], []), 'a').length, 1, 'a land before the row');
  // Second-resolution rows: a start in the row's second is not after it; a land in its start's second follows it.
  const sec = { items: [{ module: 'a', at: '2026-06-01T00:00:05Z' }], lands: [{ module: 'a', at: '2026-06-01T00:00:07Z' }] };
  assert.equal(itemsOwed({ ...sec, starts: [{ module: 'a', at: '2026-06-01T00:00:05Z' }] }, 'a').length, 1, 'same second as the row: one more run');
  assert.equal(itemsOwed({ ...sec, starts: [{ module: 'a', at: '2026-06-01T00:00:07Z' }] }, 'a').length, 0, 'a land in its start\'s second');
  assert.equal(itemsOwed({ ...sec, starts: [{ module: 'a', at: '2026-06-01T00:00:06.500Z' }] }, 'a').length, 0, 'mixed resolution compares as times');
    // A restart of the job started before the row is the same job, its old task (cold review of (i)).
  assert.equal(itemsOwed({ ...rows(['2026-07-01'], ['2026-05-01']), starts: [{ module: 'a', at: '2026-05-01' }, { module: 'a', at: '2026-06-15', restart: true }] }, 'a').length, 1, 'a restart is not a new job');
  // Owed ahead of a reschedule: a re-test's job has no item words (cold review of (i)).
  const resch = [{ user: 'a', provider: 'b', provider_land: 'pb', at: '2026-06-20' }];
  const ms = moduleStates({ mods: ['a'], entries: new Map([['a', { status: { state: 'COMPLETE' } }]]), marks: new Map(), prs: [], lands: [{ module: 'a', head: 'h1', pr: 7, at: '2026-05-15' }], reschedules: resch, anc: () => false, items: new Map([['a', 'CR-7: x']]), owed: new Set(['a']) });
  assert.deepEqual([ms[0].state, ms[0].item], ['not started', 'CR-7: x']);
  assert.match(ms[0].why, /re-runs against b's new interface too/);
  // a's new job starts after the row and lands; the merge ticks CR-2 and CR-7.
  // Rows are second-resolution: the start is in a second after the item row's, as a real one is.
  const rowAt = Date.parse(flowRows(root, SB, 3).items[0].at);
  while (Date.now() < rowAt + 1000) await new Promise((res) => setTimeout(res, 50));
  writeRows(root, SB, 'start a', [[flowFile(3, 'start', 'a-2'), { row: 'start', layer: 3, module: 'a', attempt: 2, at: new Date().toISOString().replace(/\.\d+Z$/, 'Z') }]]);
  const ha2 = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 2; }\n' }, { n: 3 });
  prs[8] = prOf(8, 'a', ha2, { base: { ref: 'layer/3' } });
  await layerLand(root, 8, { io: lio, log: quiet });
  await layerMerge(root, 3, { io: mio, wait: false, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const round = git(['show', `origin/tranche:${ROUND}`], { cwd: root });
  assert.match(round, /- \[x\] CR-2 · a/);
  assert.match(round, /- \[x\] CR-7 · a/);
});

// C49 rehearsal (PD-17): open a layer, move the tranche's pin, layer sync, the sync PR classed as the
// gate workflow meets it (the class step, then the gate), landed, then layer merge, as before.
test('rehearsal (C49, PD-17): a pin move while a layer is open: layer sync opens a PR the gate classes pin-only (no suite); a job PR into the layer stays full; it lands and the layer merges', async () => {
  const { gate: gateRun, gateClassAt } = await import('../lib/gate.mjs');
  const { browserNeeded } = await import('../lib/gateclass.mjs');
  const { syncOfBranch } = await import('../lib/layerbase.mjs');
  const { spawnSync } = await import('node:child_process');
  const { root, bare } = product({ done: true });
  commit(root, { '.github/workflows/process-gate.yml': 'name: gate v1\n' }, 'shim 1');
  const p1 = git(['rev-parse', 'HEAD'], { cwd: root });
  setPin(root, p1, 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 5;\n' });
  await layerLand(root, 6, { io: landIO(bare, { 6: prOf(6, 'c', hc) }), log: quiet });
  // The tranche: the pin moves, its shim with it.
  git(['fetch', '-q', 'origin'], { cwd: root });
  commit(root, { '.github/workflows/process-gate.yml': 'name: gate v2\n' }, 'shim 2');
  const p2 = git(['rev-parse', 'HEAD'], { cwd: root });
  setPin(root, p2, 'pin move 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
