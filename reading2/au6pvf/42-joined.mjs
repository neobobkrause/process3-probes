// ===== file: direct.mjs (continued) =====

  else L.push('no job is ready: each module with work waits on an upstream module not yet settled, or is open');
  return L;
}

// direct jobs: the ready jobs, and each waiting module with what it waits on.
export function directJobs(root, { io = {}, log = console.log } = {}) {
  const cfg = loadConfig(root);
  needDirect(cfg, 'direct jobs');
  fetchBranch(root, cfg.tranche, { allowFail: true });
  fetchState(root, cfg.state_branch, { fresh: true });
  const v = directView(root, cfg, { slug: io.slug || repoSlug(root), io });
  for (const l of directLines(v, cfg)) log(l);
  for (const s of v.states.filter((q) => q.waits?.length && !['complete', 'deferred'].includes(q.state))) log(`waits: ${s.id} (${s.state}) on ${s.waits.join(', ')}`);
  return { ok: true, startable: v.startable, states: v.states, view: v };
}

// ---- the land ----------------------------------------------------------------------------------

// The merge tool's land of a direct job PR into the tranche (layer land <pr> dispatches here).
export async function directLand(root, prn, { io = {}, log = console.log, by = 'bob' } = {}) {
  const cfg = loadConfig(root);
  needDirect(cfg, 'layer land');
  const slug = io.slug || repoSlug(root);
  const x = { getPR, checkRun, comments: ghComments, openPRs, merge: (s, k, sha, title) => mergeVia(s, k, sha, title), triage: null, ...io };
  const n0 = Number(prn);
  const pr = x.getPR(slug, n0) || fail(`pull request ${n0} not found`);
  if (pr.base?.ref !== cfg.tranche) fail(`pull request ${n0} is into ${pr.base?.ref}, not the tranche ${cfg.tranche}: under the direct flow a job's pull request goes into the tranche`);
  const recover = pr.merged === true && !!pr.merge_commit_sha;
  if (pr.state !== 'open' && !recover) fail(`pull request ${n0} is ${pr.merged ? 'merged' : pr.state}`);
  if (pr.draft && !recover) fail(`pull request ${n0} is a draft: the job publishes it (${P3} layer publish <id>)`);
  if (pr.head?.repo?.full_name && pr.head.repo.full_name !== slug) fail(`pull request ${n0} is not from a branch of ${slug}`);
  fetchBranch(root, cfg.tranche);
  fetchState(root, cfg.state_branch, { fresh: true });
  const key = directKey(cfg.tranche);
  const tref = `refs/remotes/origin/${cfg.tranche}`;
  const id = branchModule(pr.head?.ref, ledgerIds(root, tref)) || fail(`pull request ${n0} is from ${pr.head?.ref}, not a job branch`);
  fetchBranch(root, pr.head.ref, { allowFail: true });
  const head = pr.head.sha;
  if (!hasCommit(root, head)) fail(`this clone does not hold ${short(head)}, the head of pull request ${n0}`);
  const d = readDirect(root, cfg, { io: x, slug });
  const rows = d.rows;
  let before;
  let after;
  if (recover) {
    if (rows.lands.some((l) => l.pr === n0)) fail(`pull request ${n0} is merged and its land is recorded`);
    after = pr.merge_commit_sha;
    if (!hasCommit(root, after)) fail(`this clone does not hold ${short(after)}, pull request ${n0}'s merge`);
    before = git(['rev-parse', `${after}^1`], { cwd: root });
    log(`pull request ${n0} merged at ${short(after)} with no land recorded: recording it now`);
  } else {
    const g = x.checkRun(slug, head, 'gate');
    if (g?.status !== 'completed' || g.conclusion !== 'success') fail(`the gate on ${short(head)} is ${g ? `${g.status}${g.conclusion ? ` ${g.conclusion}` : ''}` : 'not run'}: a publish lands only on a green gate on its tip`);
    const e = entryAt(root, head, id) || fail(`no ledger entry for ${id} at ${short(head)}`);
    before = git(['rev-parse', tref], { cwd: root });
    const out = outsideFiles(root, e, git(['merge-base', before, head], { deepen: true, cwd: root }), head);
    if (out.length) fail(`refused: pull request ${n0} changes files outside ${id} (ARC-2): ${out.slice(0, 10).join(', ')}`);
    // Every module it uses settled (a later cycle peer aside: a cycle lands in map order).
    const unsettled = (d.providers.get(id) || []).filter((p) => !d.settled.has(p));
    if (unsettled.length) fail(`refused: ${id} uses ${unsettled.map((p) => `${p} (${d.states.find((s) => s.id === p)?.state})`).join(', ')}, not settled: it lands once each has landed or has nothing owed; nothing was merged`);
    // Their interface-changing lands held by its head; and every reschedule of it (Bob, 5 Nov: a run
    // that started before a provider's newest interface change never counts).
    const late = [...new Set([
      ...(d.providers.get(id) || []).flatMap((p) => rows.lands.filter((l) => l.module === p && l.interface?.changed && !isAnc(root, l.merge, head)).map((l) => `${p}'s interface change (land ${short(l.merge)})`)),
      ...rows.reschedules.filter((r) => r.user === id && !isAnc(root, r.provider_land, head)).map((r) => `${r.provider}'s interface change (land ${short(r.provider_land)})`),
    ])];
    if (late.length) fail(`refused: ${id}'s run on ${short(head)} started before ${late.join(', ')}: it never counts; the job runs ${P3} layer publish ${id} again`);
    const pre = (x.interfaceChange || interfaceChange)(root, cfg, id, before, head);
    if (pre.unread) fail(`refused: ${id}'s exports could not be read at ${short(head)} (${pre.unread}); the job fixes what cannot be read and publishes again; nothing was merged`);
    const r = await x.merge(slug, n0, head, landTitle(n0));
    if (!r?.merged && !r?.sha) fail(`GitHub did not merge pull request ${n0}: ${JSON.stringify(r).slice(0, 200)}`);
    fetchBranch(root, cfg.tranche);
    after = r.sha && hasCommit(root, r.sha) ? r.sha : git(['rev-parse', tref], { cwd: root });
  }
  const { ic, users, reach, classFor, triggersFor } = landReach(root, cfg, id, before, after, rows);
  // Open users (a job PR open, or work not yet landed) are rescheduled; so is a cycle peer before it
  // in map order, which landed first; the rest (COMPLETE, BLOCKED) are noticed.
  const st = new Map(d.states.map((s) => [s.id, s]));
  const openUser = (u) => !!st.get(u) && !['complete', 'deferred'].includes(st.get(u).state);
  const peers = new Set(d.earlierPeers.get(id) || []);
  const reached = users.filter((u) => u !== id && (!reach || reach.has(u)));
  const resched = ic.changed ? reached.filter((u) => openUser(u) || peers.has(u)) : [];
  const noticed = ic.changed ? reached.filter((u) => !resched.includes(u)) : ic.provides ? users.filter((u) => u !== id) : [];
  const runs = gateRuns(x.comments(slug, n0) || []).filter((q) => q?.sha);
  const at = now();
  if (ic.unread) log(`warning: ${id}'s exports could not be read on the land ${short(after)} (${ic.unread}): counted as breaking`);
  const land = { row: 'land', layer: key, direct: true, module: id, pr: n0, branch: pr.head.ref, head, before, merge: after, at, by, gate_runs: runs.length, interface: ic, users_rescheduled: resched, users_noticed: noticed };
  const files = [[`layerflow/${key}/land/${safeName(id)}-${n0}-${short(head)}.json`, land], ...gateFiles(key, id, n0, runs)];
  for (const u of resched) files.push([`layerflow/${key}/reschedule/${safeName(u)}-${safeName(id)}-${short(after)}.json`, { row: 'reschedule', layer: key, user: u, provider: id, provider_pr: n0, provider_land: after, at, key: `${u}<-${id}@${short(after)}`, why: interfaceText(ic), triggers: triggersFor(u), class: classFor(u), ...(peers.has(u) ? { cycle: true } : {}) }]);
  let notice = null;
  if (noticed.length) {
    const k = noticeKey(id, n0);
    notice = { row: 'notice', at, key: k, provider: id, ids: [], pr: n0, users: noticed, source: 1, ...(ic.exports ? { exports: ic.exports } : {}), layer_flow: { layer: key, provides: !!ic.provides, rescheduled: ic.changed } };
    files.push([noticeFile(k), notice]);
  }
  try { for (const q of noticeRecords(root, cfg.state_branch).filter((r) => !r.withdrawn && r.open.includes(id))) files.push([answerFile(id, q.key), { row: 'answered', at, key: q.key, user: id, pr: n0, by: 'layer land' }]); } catch { /* none read: none answered */ }
  writeRows(root, cfg.state_branch, `direct ${cfg.tranche}: land PR ${n0} (${id})${ic.changed ? `, interface changed (${ic.class}): ${resched.length} rescheduled, ${noticed.length} noticed` : ''}`, files);
  log(`landed PR ${n0} (${id}) into ${cfg.tranche} at ${short(after)}; interface: ${interfaceText(ic)}`);
  try { writeState(root, cfg.state_branch, `starts owed: ${id} landed (PR ${n0})`, (dir) => { paidFor(dir, [id]); return {}; }); } catch (e) { log(`note: the starts owed were not updated (${e.message})`); }
  const msgs = [];
  for (const u of resched) {
    const p = d.prs.find((q) => q.module === u);
    const text = `${cfg.tranche}: ${id} changed its interface (${classFor(u)}; land ${short(after)}: ${interfaceText(ic)}). Halt any test run now; run \`${P3} layer publish ${u}\` again: it brings job/${u} up to ${cfg.tranche} and its gate re-runs your suite against ${id}'s new version. A run started before this never counts.`;
    if (p) { msgs.push({ user: u, pr: p.number, text }); log(`BOB delivers to job ${u}'s session (PR ${p.number}), with send_message priority now: ${text}`); } else log(`${u}: rescheduled; no job open: it re-runs when it starts (${P3} direct jobs lists it once its upstream is settled)`);
  }
  // The notice triaged at once by rule (PD-20): users not affected answered, the rest owed by name.
  let triage = null;
  if (notice) {
    log(`provider notice ${notice.key} for ${noticed.length} user(s): ${noticed.join(', ')}`);
    try { const { triageAtMerge } = await import('./triage.mjs'); triage = (x.triage || triageAtMerge)(root, cfg, notice, { ref: after, log }); } catch (e) { triage = { error: String(e.message || e) }; log(`notice triage ${notice.key} at the land FAILED (${String(e.message || e).split('\n')[0].slice(0, 160)}); next act: ${P3} notice triage ${notice.key}`); }
  }
  return { ok: true, land, messages: msgs, triage };
}

// ===== file: wfyaml.mjs =====

// A strict reader of the plain YAML GitHub workflow files are written in (build workflow-limits,
// R1; Bob, 6 Nov: "yes to R1"). The tool has no dependencies, so this is not a YAML library: it
// reads one narrow subset and refuses everything else, so that what it reads is what GitHub runs
// or the file is refused (a refusal is the owner's word, never a guess). Read: block mappings and
// sequences (`- key: v` compact items too), plain and quoted one-line scalars, `|` and `>` block
// scalars, and flow `[...]` / `{...}` collections, which may span lines. Refused: anchors,
// aliases, tags, directives, more than one document, complex (`?`) keys, merge keys, a key twice,
// a tab in an indent, a plain scalar continued on the next line or holding `: `, a quoted scalar
// over more than one line, any line it cannot place. Every scalar is a string (no booleans or
// numbers: `on` stays `on`), and each mapping and sequence carries the 1-based line of each of
// its keys or items (lineOf).

const LINES = Symbol('lines');
const FOLDED = Symbol('folded');
export const lineOf = (node, key) => node?.[LINES]?.[key] ?? null;
// Whether a mapping's value at key was a folded (`>`) block scalar: its lines are kept raw here,
// where GitHub joins them, so a judge that reads lines must not read it (cold review of R1).
export const foldedAt = (node, key) => node?.[FOLDED]?.has(key) === true;
const mark = (node) => {
  Object.defineProperty(node, LINES, { value: Array.isArray(node) ? [] : {}, enumerable: false });
  if (!Array.isArray(node)) Object.defineProperty(node, FOLDED, { value: new Set(), enumerable: false });
  return node;
};

class YamlError extends Error {}
const no = (line, why) => { throw new YamlError(`line ${line}: ${why}`); };

const KEY = /^([A-Za-z0-9_][A-Za-z0-9_.\-/ ]*?|"[^"\\]*"|'[^']*')[ ]*:(?: +|$)/;

// Strips a comment from a plain scalar's text: ` #` (or `#` at its start) begins one.
const plainCut = (s) => { const m = s.match(/(^|[ \t])#/); return (m ? s.slice(0, m.index) : s).trimEnd(); };

function quoted(s, line) {
