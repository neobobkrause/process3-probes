  // A module's item ids, from the items themselves: their words may hold '; ' and ': ' (copy, 8 Nov:
  // interface-assets read "CR2-3, CR2-21, today mk-updband is drawn ..."); split only without them.
  const idsOf = (id) => (itemIds.get(id) || items.get(id).split('; ').map((x) => x.split(': ')[0])).join(', ');
  return mods.map((id) => {
    const e = entries.get(id);
    const pr = (prs || []).find((p) => p.module === id) || null;
    const mine = lands.filter((l) => l.module === id);
    const out = outstanding(reschedules, lands, id, anc);
    const m = marks.get(id) || [];
    const j = joins.get(id) || null;
    const base = { id, pr: pr?.number ?? null, lands: mine.length, outstanding: out, marks: m, entry_state: e?.status?.state ?? null, ...(j ? { join: j } : {}) };
    if (e?.status?.state === 'BLOCKED') return { ...base, state: 'deferred', why: `BLOCKED: ${e.status.reason || 'no reason'}` };
    // An item joined after its job started (PD-14 (i)): it runs again with the item's words, ahead
    // of a reschedule (a re-test's job has no item words, and its land would tick the item: cold
    // review of (i)); its job starts on the layer tip, so it holds the provider's land too.
    if (owed.has(id) && items.has(id) && !pr) return { ...base, state: 'not started', item: items.get(id), why: `completion item(s) joined after its last job started: ${idsOf(id)}${out.length ? `; it re-runs against ${[...new Set(out.map((r) => r.provider))].join(', ')}'s new interface too` : ''}` };
    if (out.length) return { ...base, state: 'rescheduled', why: `re-runs against ${[...new Set(out.map((r) => r.provider))].join(', ')}'s new interface` };
    if (pr && !pr.draft) return { ...base, state: 'published', why: `PR ${pr.number} ready into the layer` };
    if (pr) return { ...base, state: 'working', why: `PR ${pr.number}, a draft` };
    if (mine.length) return { ...base, state: 'complete', why: `landed ${mine.length} time(s), last PR ${mine.at(-1).pr}` };
    // Started early (R14) and no pull request into the layer: its start did not finish, or its PR
    // closed; job start resumes it as any unfinished start (cold review of R14).
    if (earlies.has(id) && !j) return { ...base, state: 'not started', early: earlies.get(id).from, why: `started early while layer ${earlies.get(id).from} was open; no pull request into the layer: job start resumes it` };
    // A completion layer's module, its own or joined (C33, PD-14), or a round layer's (BD-R1): its
    // open items, or its found marks, are its work.
    if (items.has(id)) return { ...base, state: 'not started', item: items.get(id), why: `${itemWord} ${idsOf(id)}${j ? `, joined from ${j.from === null ? 'no layer' : `layer ${j.from}`}` : ''}` };
    if (j) return { ...base, state: 'not started', why: `joined from ${j.from === null ? 'no layer' : `layer ${j.from}`}: ${j.why}` };
    if (e?.status?.state === 'COMPLETE' && !m.length) return { ...base, state: 'complete', why: 'COMPLETE before the layer opened, no unmet mark' };
    return { ...base, state: 'not started', why: e ? `${e.status?.state}${m.length ? `, unmet ${m.join(', ')}` : ''}` : 'no ledger entry' };
  });
}
export const DONE = ['complete', 'deferred'];

// ---- the order within a layer (R10) ---------------------------------------------------------

// Bob, 6 Nov ~15:35: start a layer's jobs earliest in the total (dependency) order first, so an
// interface change is found before its users start or test. providers: each module's providers in
// the layer, from the modules file (its uses), else its entry's.
export function layerProviders(mods, modules, entries) {
  const named = new Map((modules || []).filter((m) => m?.id).map((m) => [m.id, m.uses || []]));
  const inLayer = new Set(mods);
  return new Map(mods.map((id) => [id, [...new Set(named.get(id) || entries.get(id)?.uses || [])].filter((u) => u !== id && inLayer.has(u))]));
}
// The layer's modules, each after its providers in the layer, the layer map's order kept otherwise;
// a cycle's modules follow in the map's order.
export function totalOrder(mods, providers) {
  const out = [];
  const done = new Set();
  let moved = true;
  while (moved) {
    moved = false;
    for (const id of mods) if (!done.has(id) && (providers.get(id) || []).every((p) => done.has(p))) { out.push(id); done.add(id); moved = true; }
  }
  return [...out, ...mods.filter((id) => !done.has(id))];
}
// A provider has landed when its land is on the layer (a land row), or it was BLOCKED (deferred: it
// lands nothing here), or COMPLETE with no unmet mark at the layer tip (its interface already there;
// one with marks is about to be reopened: cold review of PR 196).
export const landedProvider = (p, lands, entries, marks = new Map()) => lands.some((l) => l.module === p) || entries.get(p)?.status?.state === 'BLOCKED' || (entries.get(p)?.status?.state === 'COMPLETE' && !(marks.get(p) || []).length);
// The in-layer providers of id not yet landed on layer/<n>, read from origin (job start's early mark).
export function earlyProviders(root, cfg, n, id, ref) {
  const L = layersAt(root, cfg, ref).find((x) => x.n === n);
  if (!L) return [];
  const fr = flowRows(root, cfg.state_branch, n);
  // Joined modules count, as readLayer counts them (R12; cold review of PR 191).
  const mods = [...new Set([...L.mods, ...fr.joins.map((j) => j.module)])];
  const entries = new Map(mods.map((m) => [m, entryAt(root, ref, m) || entryAt(root, `refs/remotes/origin/${cfg.tranche}`, m)]));
  const prov = layerProviders(mods, readModules(root, cfg, ref), entries);
  const lands = fr.lands;
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  const marksOf = (p) => unmetIds(textAt(root, ref, entries.get(p)?.requirements || `${dir}/${p}.md`) || '').filter((x) => !isFound(x));
  // As layer jobs reads it: a provider BLOCKED at its job branch's head is deferred (readLayer's PR-head read).
  const blockedOnBranch = (p) => {
    const r = git(['ls-remote', '--heads', 'origin', `refs/heads/job/${p}`, `refs/heads/job/${p}-*`], { cwd: root, allowFail: true });
    return r.code === 0 && r.stdout.split('\n').filter(Boolean).some((l) => { const [sha, h] = l.split('\t'); const name = h.replace('refs/heads/', ''); if (!hasCommit(root, sha)) fetchBranch(root, name, { allowFail: true }); return hasCommit(root, sha) && entryAt(root, sha, p)?.status?.state === 'BLOCKED'; });
  };
  const marks = new Map((prov.get(id) || []).map((p) => [p, marksOf(p)]));
  return (prov.get(id) || []).filter((p) => !landedProvider(p, lands, entries, marks) && !blockedOnBranch(p));
}
export const mergeReady = (states) => states.every((s) => DONE.includes(s.state));

// What BOB may start (the tool lists, BOB starts; Bob, 5 Nov): each module not started, and each
// complete one a reschedule reopened (its PR landed, so a new attempt).
// A listed job whose in-layer provider has not landed: listed after the rest, and startable now as an
// early start (R10, Bob 6 Nov). Worded so it is not read as a wait (C25: on the copy's layer 11 BOB
// held such jobs 20-108 min, "waiting on providers still in flight", with slots empty).
// Whether a listed act takes a job session (a slot under the cap): every job start does; an additive
// change's `layer retest` runs in CI with none (C25: the idle check counted it as a slot's work).
export const needsSlot = (j) => !j?.additive;
// A layer's starts, and for a completion layer the joins its open items owe (C35).
// A module with items to join is listed by its join alone: its job starts after, with their words
// (PD-14 (i): a job started first would run without them, and again after the join).
export const startableOf = (x) => { const j = new Set((x.joinable || []).map((y) => y.id)); return [...startable(x.states).filter((y) => !j.has(y.id)), ...(x.joinable || [])]; };
// The open items of completion_file whose module the layer does not hold, one join act per module.
export function joinableItems(root, cfg, tr, mods, n, known = new Set()) {
  let c = null;
  try { c = completionItems(root, cfg, tr); } catch { c = null; }
  const have = new Set(mods);
  // A module with no ledger entry has nothing to join: the item is BOB's to fix (cold review of C35).
  const ids = ledgerIds(root, tr);
  // Not yet in the layer: its module is not (C35), or its module is and the item came after (PD-14 (i)).
  const due = openItems(c).filter((x) => !x.whole && !x.malformed && (!have.has(x.target) || !known.has(x.id)) && ids.has(x.target));
  return [...new Set(due.map((x) => x.target))].map((id) => {
    const its = due.filter((x) => x.target === id);
    const why = its.map((x) => `${x.id}: ${x.what}`).join('; ');
    return { id, join: true, ...(have.has(id) ? { more: true } : {}), items: its.map((x) => x.id), cmd: `${P3} layer join ${id} --why ${JSON.stringify(why.length > 200 ? `${its.map((x) => x.id).join(', ')} (${c.file})` : why)}, then ${P3} layer jobs ${n} and its job start` };
  });
}
export const afterNote = (after) => `   (${after.join(', ')} not landed yet: start it now on a free slot, this plain job start, no --early (R10); only a recorded hold waits)`;
export function startable(states) {
  const list = states.flatMap((s) => {
    if (s.state === 'not started' && s.item) return [{ id: s.id, cmd: `${P3} job start ${s.id} --sessions <file>${s.entry_state === 'COMPLETE' ? ` --reopen ${JSON.stringify(s.item)}` : ''}` }];
    if (s.state === 'not started' && s.join) return [{ id: s.id, cmd: `${P3} job start ${s.id} --sessions <file>${s.entry_state === 'COMPLETE' ? ` --reopen ${JSON.stringify(s.join.why)}` : ''}` }];
    if (s.state === 'not started') return [{ id: s.id, cmd: `${P3} job start ${s.id} --sessions <file>${s.marks.length && s.why.startsWith('COMPLETE') ? ` --reopen "meet the unmet requirement marks ${s.marks.join(', ')}"` : ''}` }];
    if (s.state === 'rescheduled' && s.pr === null) {
      const why = [...new Set(s.outstanding.map((r) => `${r.provider} (land ${short(r.provider_land)})`))].join(', ');
      // A module that never ran (OPEN, never COMPLETE) starts plainly: --reopen is for a COMPLETE one
      // (coordinator, 6 Nov 16:03: publish-schedule, project-stage and case-account were refused).
      if (s.entry_state && s.entry_state !== 'COMPLETE') return [{ id: s.id, cmd: `${P3} job start ${s.id} --sessions <file>` }];
      const job = `${P3} job start ${s.id} --sessions <file> --reopen "re-test against the new interface of ${why}"`;
      // With no unmet mark, CI can re-test it with no job session (layer retest): the way for an
      // additive change (Bob's "c"), offered beside the job for a breaking one.
      if (s.marks.length) return [{ id: s.id, cmd: job }];
      const additive = !s.retest_refused && s.outstanding.every((r) => r.class === 'additive');
      return [{ id: s.id, cmd: additive ? `${P3} layer retest ${s.id}` : job, ...(additive ? { job, additive: true } : {}) }];
    }
    return [];
  });
  // R10: in the layer's total order (the states' own), those with an in-layer provider not yet
  // landed after the rest, each marked "after <provider>".
  const mark = (x) => { const after = states.find((s) => s.id === x.id)?.after || []; return after.length ? { ...x, after } : x; };
  const all = list.map(mark);
  return [...all.filter((x) => !x.after), ...all.filter((x) => x.after)];
}

// ---- reading a layer ------------------------------------------------------------------------

// The reads of status, layer jobs and the idle check: a clone's copy this recent serves (C18).
const READ_MS = 30e3;
function fetchLayer(root, cfg, n) {
  fetchBranch(root, cfg.tranche, { allowFail: true });
  fetchBranch(root, layerBranch(n), { allowFail: true });
  fetchState(root, cfg.state_branch, { fresh: true });
}
const layerRef = (n) => `refs/remotes/origin/${layerBranch(n)}`;

