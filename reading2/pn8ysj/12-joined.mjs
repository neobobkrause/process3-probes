// ===== file: layer.test.mjs (continued) =====

  const said = [];
  const w = layerClose(other, '1', { io, as: 'coordinator', log: (m) => said.push(m) });
  assert.equal(said.at(-1), 'next act: wake BOB with `node .process/tool/p3.mjs send bob "layer 1 closed: node .process/tool/p3.mjs job start --ready --live <n>, then status" --from coordinator`, delivered with send_message to the address it prints');
  assert.equal(w.wake, said.at(-1));
  // Closed, it is no longer the open layer.
  assert.throws(() => layerClose(root, '1', { io, log: quiet }), /layer 1 is not the open layer; the open layer is 2/);
});

test('layer close: a red suite records nothing; a layer with an open job is refused', () => {
  const { root, bare } = withOrigin({ ...base, 'process/ledger/a.json': { ...done('a'), tests: ['test/a/'] }, 'test/a/x.test.mjs': FAIL, 'process/ledger/b.json': { ...done('b'), tests: ['test/b/'] }, 'test/b/x.test.mjs': PASS });
  const out = [];
  assert.equal(layerClose(root, '1', { io, log: (m) => out.push(m) }).ok, false);
  assert.match(out.join('\n'), /the a suite failed[\s\S]*layer 1 not closed/);
  assert.equal(git(['ls-remote', bare, 'process-state'], { cwd: root }), '');
  const open = withOrigin({ ...base, 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md' }) });
  assert.throws(() => layerClose(open.root, '1', { io, log: quiet }), /layer 1 is not ready to close: b has an open job/);
});

// Measured 3 Nov on the copy: a layer-1 job BLOCKED by `job block` with a reason, its PR open.
const blocked = (reason) => ({ ...base, 'build/requirements/b.md': unmet(1), 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'BLOCKED', ...(reason ? { reason } : {}) } }) });
const prOpen = { openPRs: () => [{ number: 38, draft: false, head: { ref: 'job/b', sha: 'x' }, updated_at: '2026-11-03T00:00:00Z' }], checkRun: () => null, compare: () => null };

test('a module BLOCKED with a reason: BOB closes its PR unmerged, then the layer closes with it deferred', () => {
  const { root, bare } = withOrigin({ ...blocked('R47 rests on measure M-R7, recorded nowhere'), 'process/ledger/a.json': { ...done('a'), tests: ['test/a/'] }, 'test/a/x.test.mjs': PASS });
  openPassed(root);
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const out = [];
  const r = status(root, { role: 'bob', log: (m) => out.push(m), io: prOpen });
  assert.equal(r.layer.ready, false);
  assert.equal(r.layer.pending, true);
  assert.deepEqual(r.next, []);
  assert.match(out.join('\n'), /layer 1 ready to close once BOB closes these unmerged \(never deleting the branch\):\n- close PR #38 unmerged: R47 rests on measure M-R7, recorded nowhere\nthen: node \.process\/tool\/p3\.mjs layer close 1/);
  assert.throws(() => layerClose(root, '1', { io: prOpen, log: quiet }), /b is BLOCKED \(R47 rests on measure M-R7, recorded nowhere\) with PR #38 still open: BOB closes it unmerged first/);
  // PR 38 closed: ready, and the close records b deferred with its reason and marks.
  assert.equal(status(root, { role: 'bob', log: quiet, io }).layer.ready, true);
  const out2 = [];
  assert.equal(layerClose(root, '1', { io, log: (m) => out2.push(m) }).ok, true);
  const row = JSON.parse(git(['show', `process-state:${CLOSED_FILE}`], { cwd: bare }));
  assert.deepEqual(row.deferred, { a: ['R1', 'R2'], b: { reason: 'R47 rests on measure M-R7, recorded nowhere', marks: ['R1'] } });
  assert.match(out2.join('\n'), /b: deferred, BLOCKED[\s\S]*deferred: a 2, b 1 \(BLOCKED: R47/);
});

test('a module BLOCKED with no reason holds the layer, its PR closed or not', () => {
  const { root } = withOrigin(blocked(null));
  for (const io_ of [prOpen, io]) {
    const out = [];
    const r = status(root, { role: 'bob', log: (m) => out.push(m), io: io_ });
    assert.equal(r.layer.ready, false);
    assert.equal(r.layer.pending, false);
    assert.doesNotMatch(out.join('\n'), /ready to close/);
  }
});

test('BLOCKED with a reason on the job branch (as job block records it) defers the module', () => {
  const { root } = withOrigin({ ...blocked(null), 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'WORKING' } }) });
  git(['checkout', '-q', '-b', 'job/b', 'tranche'], { cwd: root });
  commit(root, { 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'BLOCKED', reason: 'why' } }) }, 'block b: why');
  git(['push', '-q', 'origin', 'job/b'], { cwd: root });
  const r = status(root, { role: 'bob', log: quiet, io: prOpen });
  assert.equal(r.layer.pending, true);
  assert.deepEqual(r.layer.owed.map((m) => [m.id, m.pr, m.blocked]), [['b', 38, 'why']]);
});

test('a deferred module: offline, its PR unread, the layer is held; its PR closed, no restart flag', () => {
  const { root } = withOrigin({ ...blocked(null), 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'WORKING' } }) });
  git(['checkout', '-q', '-b', 'job/b', 'tranche'], { cwd: root });
  commit(root, { 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'BLOCKED', reason: 'why' } }) }, 'block b: why');
  git(['push', '-q', 'origin', 'job/b'], { cwd: root });
  const tranche = makeRepo(blocked('why'));
  assert.equal(status(tranche, { role: 'bob', offline: true, log: quiet }).layer.ready, false);
  const r = status(root, { role: 'bob', log: quiet, io });
  assert.equal(r.layer.ready, true);
  assert.equal(r.rows.find((x) => x.id === 'b').flag, 'BLOCKED');
});

// ===== file: hold.mjs =====

// Holds (the coordinator's design, 5 Nov 01:13, answering Bob's question why work was silently
// limited: on 4 Nov the coordinator's "about 6 job sessions at most" kept BOB near 6 of 20 for
// about 6 hours and nothing in Process3 saw it). A hold on startable work is a row on the
// state branch, never words: `p3 hold <scope> --why --by --until`, ended by `p3 hold --end <id>` or
// its end. Scope: module:<id>, layer:<n> or slots:<n>. job start counts the cap less the live slot holds
// (cap.mjs) and the idle check counts no held module; status prints every hold first; the sweep alarms
// on idle capacity whatever holds there are. A hold lasts until the pull requests it names (--prs)
// have landed on the tranche, or its --until time, whichever comes first (coordinator's check audit, 5 Nov
// 19:30: no forced renewal); no hold needs Bob (coordinator's correction, 5 Nov). report tranche lists hold-hours
// by setter and reason.
import { appendFileSync, mkdirSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { layerOf } from './metrics.mjs';
import { fetchState, jsonl, onBookkeeping, readState, readStateWith, writeState } from './state.mjs';
import { exists, fail, git, loadConfig, now } from './util.mjs';
import { LANDED, condText, firstMet, fromText, parseConditions, readFacts } from './ends.mjs';

// The pull requests landed on ref, by number, each with the time its merge was committed: the
// tranche's first-parent merges, as merge, merge --plain and GitHub title them. null when unread.
export function landedPRs(root, ref) {
  const r = git(['log', '--first-parent', '--format=%ct %s', ref], { cwd: root, allowFail: true });
  if (r.code !== 0) return null;
  const m = new Map();
  for (const l of r.stdout.split('\n')) {
    const x = l.match(/^(\d+) (.*)$/);
    const n = x && x[2].match(LANDED);
    if (n && !m.has(Number(n[1]))) m.set(Number(n[1]), Number(x[1]) * 1000);
  }
  return m;
}

export const HOLDS_FILE = 'holds/holds.jsonl';
const SHOWN_EXPIRED_H = 24; // an expired hold is printed as expired for a day
const SCOPE = /^(module|layer|slots):([A-Za-z0-9._/-]+)$/;
const min = (ms) => Math.round(ms / 6e4);

// A hold's conditions (R13, ends.mjs): its when list (every row written since carries one, empty
// or not), or, only on a row from before them, the one its words plainly give (fromText);
// { conds, from } or { unparsed }.
export function holdConds(h) {
  if (Array.isArray(h.when)) return { conds: h.when, from: h.when.length ? 'when' : null };
  const f = fromText(h.why);
  return f.conds ? { conds: f.conds, from: 'words' } : { conds: [], unparsed: f.unparsed };
}

// Every hold row, with its end row folded in: live, expired or ended at t. landed: landedPRs, or
// null when unread; a hold naming pull requests then stays live (until its --until time).
// done: when its named pull requests had all landed (ms), else null. facts (ends.mjs readFacts):
// a hold one of whose conditions is met holds nothing (met: { c, why }), and the tool writes its
// end row at its next write (expireHolds); without facts, conditions are not judged.
export function holdsOf(rows, t = Date.now(), landed = null, facts = null) {
  const ended = new Map(rows.filter((r) => r.row === 'end').map((r) => [r.id, r]));
  return rows.filter((r) => r.row === 'hold').map((h) => {
    const [, kind, value] = h.scope.match(SCOPE) || [];
    const left = h.until ? Date.parse(h.until) - t : Infinity;
    const prs = Array.isArray(h.prs) ? h.prs : [];
    const done = prs.length && landed && prs.every((n) => landed.has(n)) ? Math.max(...prs.map((n) => landed.get(n))) : null;
    const open = prs.filter((n) => !landed?.has(n));
    const c = holdConds(h);
    const met = facts && !ended.has(h.id) ? firstMet(c.conds, facts) : null;
    return { ...h, kind, value, ended: ended.get(h.id) || null, left, done, open, conds: c.conds, conds_from: c.from || null, unparsed: c.unparsed || null, met, live: !ended.has(h.id) && left > 0 && !(done !== null && done <= t) && !met };
  });
}

export function readHolds(root, sb, { offline = false, t = Date.now(), facts, listed = null, fresh = false } = {}) {
  if (!offline) fetchState(root, sb, { fresh });
  const rows = jsonl(readState(root, sb, HOLDS_FILE));
  let landed = null;
  let cfg = null;
  try { cfg = loadConfig(root); } catch { cfg = null; }
  if (rows.some((r) => r.row === 'hold' && Array.isArray(r.prs) && r.prs.length)) {
    try { const tr = cfg.tranche; landed = landedPRs(root, `origin/${tr}`) || landedPRs(root, tr); } catch { landed = null; }
  }
  // Conditions are judged whenever a hold carries one and the facts can be read.
  let f = facts ?? null;
  if (f === null && facts === undefined && cfg && rows.some((r) => r.row === 'hold' && holdConds(r).conds.length)) {
    try { f = readFacts(root, cfg, { listed, t, landed: landed || undefined }); } catch { f = null; }
  }
  return holdsOf(rows, t, landed, f);
}

// The holds whose condition is met, ended by the tool (R13): an end row each, by process3, naming
// the condition, in one write. Run at the tool's writes (p3.mjs after an act, layer open, the
// sweep). No person's act and nothing judged by a permission check: the condition was recorded
// with the hold. Returns the ids ended.
export const BY_TOOL = 'process3';
export function expireHolds(root, sb, { facts, log = console.log, t = Date.now() } = {}) {
  const ending = readHolds(root, sb, { t, ...(facts !== undefined ? { facts } : {}) }).filter((h) => h.met && !h.ended && h.left > 0);
  if (!ending.length) return [];
  const { wrote } = writeState(root, sb, `hold: end ${ending.map((h) => h.id).join(', ')} (condition met)`, (dir) => {
    // Read again inside the write: one ended meanwhile is not ended twice, nor said ended here.
    const f = join(dir, HOLDS_FILE);
    const done = new Set((existsSync(f) ? jsonl(readFileSync(f, 'utf8')) : []).filter((r) => r.row === 'end').map((r) => r.id));
    const mine = ending.filter((h) => !done.has(h.id));
    for (const h of mine) put(dir, { at: now(), row: 'end', id: h.id, by: BY_TOOL, why: `condition met: ${h.met.why}`, condition: h.met.c, ...(h.conds_from === 'words' ? { read_from_words: true } : {}) });
    return { wrote: mine.map((h) => h.id) };
  });
  const ids = new Set(wrote || []);
  for (const h of ending.filter((x) => ids.has(x.id))) log(`${h.id} ended by the tool: ${h.scope} holds nothing now (${h.met.why}${h.conds_from === 'words' ? ', read from its words' : ''})`);
  return [...ids];
}

// The lines status prints first: each live hold, then each expired in the last day.
export function holdLines(holds) {
  const live = holds.filter((h) => h.live);
  // A hold whose condition is met holds nothing; the tool writes its end at its next write (R13).
  const met = holds.filter((h) => h.met && !h.ended && h.left > 0);
  const expired = holds.filter((h) => !h.live && !h.ended && !met.includes(h) && t0(h) < SHOWN_EXPIRED_H * 36e5);
  if (!live.length && !expired.length && !met.length) return ['holds: none'];
  return [`holds: ${live.length} live${met.length ? `, ${met.length} with its condition met` : ''}${expired.length ? `, ${expired.length} expired` : ''} (only a recorded hold holds startable work below the cap)`,
    ...met.map((h) => `- ${h.id} ${h.scope}, by ${h.by}: holds nothing, ${h.met.why}${h.conds_from === 'words' ? ' (read from its words)' : ''}; the tool ends it at its next write: ${h.why}`),
    ...live.map((h) => `- ${h.id} ${h.scope}, by ${h.by}${h.renews ? `, renewing ${h.renews}` : ''}, ${[h.open?.length ? `until PR ${h.open.join(', ')} land${h.open.length > 1 ? '' : 's'}` : '', Number.isFinite(h.left) ? `${min(h.left)} min to expiry` : ''].filter(Boolean).join(', or ')}: ${h.why}`),
    ...expired.map((h) => `- ${h.id} ${h.scope}, by ${h.by}: ${h.done !== null && h.done <= Date.now() + h.left ? 'its PRs landed' : 'expired'} ${min(t0(h))} min ago, holds nothing: ${h.why}`)];
}
// How long ago a hold that is not live stopped holding (ms): its PRs' land or its expiry, the first.
const t0 = (h) => Date.now() - Math.min(h.done ?? Infinity, Number.isFinite(h.left) ? Date.now() + h.left : Infinity);

export const slotsHeld = (holds) => holds.filter((h) => h.live && h.kind === 'slots').reduce((s, h) => s + Number(h.value), 0);
// The live hold on a startable module ({ id }), by its module or its layer (layers: layerOf's map).
export const heldBy = (holds, id, layers) => holds.find((h) => h.live && ((h.kind === 'module' && h.value === id) || (h.kind === 'layer' && layers.get(id) === Number(h.value)))) || null;
export const layersAt = (root, cfg, ref = `origin/${cfg.tranche}`) => layerOf(exists(root, ref, cfg.layers_file) ? git(['show', `${ref}:${cfg.layers_file}`], { cwd: root }) : null);

// p3 hold <scope> --why "..." --by <session> (--prs <n>[,<n>...] and/or --until <ISO time | <n>m | <n>h>);
// p3 hold --end <id> --by <session>.
export function hold(root, scope, { why, by, until, prs, when, end, log = console.log } = {}) {
  const cfg = loadConfig(root);
  const sb = cfg.state_branch;
  if (typeof by !== 'string' || !/^session_[A-Za-z0-9]+$/.test(by)) fail('--by <your session id (session_...)>');
  const t = Date.now();
  const holds = readHolds(root, sb, { t });
  if (end !== undefined) {
    const h = holds.find((x) => x.id === end);
    if (!h) fail(`no hold ${JSON.stringify(end)} on ${sb}:${HOLDS_FILE}`);
    if (!h.live) fail(`${h.id} holds nothing already (${h.ended ? 'ended' : h.done !== null && h.done <= t ? 'its PRs landed' : 'expired'})`);
    writeState(root, sb, `hold: end ${h.id}`, (dir) => { put(dir, { at: now(), row: 'end', id: h.id, by }); return {}; });
    log(`${h.id} ended: ${h.scope} holds nothing now; its jobs can start (layer jobs <n>)`);
    return { ended: h.id };
  }
  const m = String(scope ?? '').match(SCOPE);
  if (!m || (m[1] !== 'module' && !/^\d+$/.test(m[2])) || (m[1] === 'slots' && Number(m[2]) < 1)) fail(`hold <scope>: module:<id>, layer:<n> or slots:<n>, not ${JSON.stringify(scope)}`);
  if (typeof why !== 'string' || !why.trim()) fail('--why "<the reason, in words a reader can check>"');
  const nums = prs === undefined ? [] : String(prs).split(',').map((x) => x.trim());
  if (prs === true || nums.some((x) => !/^[1-9]\d*$/.test(x))) fail(`--prs <n>[,<n>...]: the pull requests the hold waits on, not ${JSON.stringify(prs)}`);
  // A hold carries an end the tool can check (R13): its pull requests, a condition (--when), or
  // an expiry time; words alone are refused. Words that plainly give a condition (until layer 6
  // closes) record it, said.
  let conds = [];
  if (when !== undefined) { try { conds = parseConditions(when === true ? '' : when); } catch (e) { fail(`--when ${e.message}`); } if (!conds.length) fail('--when <condition>[,<condition>...]: layer_closed:<n>, layer_open:<n>, pr_merged:<n>, module_complete:<id>, session_gone:<id>, at:<ISO time>'); }
  // Words are read only when nothing else ends the hold: a --prs or --until hold keeps the ends
  // it was given (a condition read from its words would end it sooner).
  const read = !conds.length && until === undefined && !nums.length ? fromText(why).conds || [] : [];
  if (until === undefined && !nums.length && !conds.length && !read.length) fail('--prs <n>[,<n>...] (the pull requests whose land ends the hold), --when <condition> (layer_closed:<n>, layer_open:<n>, pr_merged:<n>, module_complete:<id>, session_gone:<id>) or --until <ISO time | <n>m | <n>h>: an end the tool can check; words alone are refused');
  conds = conds.length ? conds : read;
  // A condition already met ends nothing later: refused, so a hold is never ended as it is made.
  if (conds.length) {
    let f = null;
    try { f = readFacts(root, cfg, { t }); } catch { f = null; }
    const met = f ? firstMet(conds, f) : null;
    if (met) fail(`the condition ${condText(met.c)} is met already (${met.why}): a hold on it would hold nothing; nothing recorded`);
  }
  let at = null;
  if (until !== undefined) {
    const rel = String(until).match(/^(\d+)([mh])$/);
    at = rel ? t + Number(rel[1]) * (rel[2] === 'h' ? 36e5 : 6e4) : Date.parse(String(until));
    if (!(at > t)) fail(`--until <a future time (ISO) or <n>m or <n>h>, not ${JSON.stringify(until)}`);
  }
  // A hold on a scope still held, or held until the last hour, renews it: the chain stays visible.
  const prev = holds.filter((h) => h.scope === m[0] && !h.ended && h.left > -36e5 && !(h.done !== null && h.done < t - 36e5)).at(-1);
  const row = { row: 'hold', scope: m[0], why: why.trim(), by, ...(at !== null ? { until: new Date(at).toISOString().replace(/\.\d+Z$/, 'Z') } : {}), ...(nums.length ? { prs: [...new Set(nums.map(Number))] } : {}), when: conds, ...(prev ? { renews: prev.id } : {}) };
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

// ===== file: layer.mjs =====

// layer close <n> (Build Plan Phase 3, INT-4, ARC-4): BOB closes the open layer once it is ready.
// The layer checks run on the tranche tip in a worktree of their own: every lock file installed,
// then each module's entry `checks` and its suite, as the gate runs them, then each `generated`
// row's regenerate and verify. Green, the close is one row on the state branch (CLOSED_FILE):
// one push, no pull request, since BOB is its one writer and status already reads that branch.
// Regenerated files are not committed here: that is BOB's plain pull request, named in the output.
// A generated path the tranche does not track is built, not committed (deploy dev and release
// run build it): it is regenerated and verified, never compared (a file over max_file_bytes can
// never be refreshed by a pull request, so "differ" would never clear).
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { buildGenerated, committedPaths, entryChecks, generatedRows, regenerate } from './checks.mjs';
import { normPath } from './suite.mjs';
import { READY_NEXT, READY_START, wakeLine } from './job.mjs';
import { entryFile } from './ledger.mjs';
import { fetchState, writeState } from './state.mjs';
import { CLOSED_FILE, closedRows, layerState, nextWork, owedNotices, status } from './status.mjs';
import { install, runSuite } from './suite.mjs';
import { NO_TOKENS, depth, fail, git, loadConfig, now, repoSlug, run } from './util.mjs';

const MINUTE = 60000;

export function layerClose(root, n, { log = console.log, io, exec = run, as = 'bob' } = {}) {
  if (!/^\d+$/.test(String(n))) fail(`layer close <n>, the layer's number, not ${JSON.stringify(n)}`);
  const cfg = loadConfig(root);
  const tranche = `origin/${cfg.tranche}`;
  git(['fetch', '-q', ...depth(root), 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/${tranche}`], { cwd: root });
  const s = status(root, { log: () => {}, io });
  if (s.prs === null) fail('GitHub unreadable: open pull requests not known, so the layer cannot be closed');
  fetchState(root, cfg.state_branch, { fresh: true });
  const closed = closedRows(root, cfg, { slug: repoSlug(root), ...(io?.compare ? { read: io.compare } : {}) });
  const ls = layerState(root, cfg, s.rows, tranche, { closed });
  if (!ls) fail(`no layer map (${cfg.layers_file}) on ${tranche}`);
  if (ls.cur?.n !== Number(n)) fail(`layer ${n} is not the open layer; the open layer is ${ls.cur ? ls.cur.n : 'none'}`);
  if (!ls.ready) fail(`layer ${n} is not ready to close: ${ls.cur.mods.filter((m) => (m.blocked ? m.pr : m.open || (!m.merged && m.marks.length))).map((m) => `${m.id} ${m.blocked ? `is BLOCKED (${m.blocked}) with PR #${m.pr} still open: BOB closes it unmerged first, never deleting its branch` : m.open ? 'has an open job' : m.row?.flag ? `is flagged: ${m.row.flag}` : 'has no merged job and unmet marks'}`).join('; ')}`);
  const sha = git(['rev-parse', tranche], { cwd: root });
  const timeout = (cfg.suite_timeout_minutes || 20) * MINUTE;
  const wt = join(mkdtempSync(join(tmpdir(), 'p3-layer-')), 'w');
  git(['worktree', 'add', '-q', '--detach', wt, sha], { cwd: root });
  const findings = [];
  const suites = [];
  let changed = [];
  let built = [];
  try {
    findings.push(...install(wt, cfg.lockfiles, { exec }).findings);
    // Generated files the tranche does not track are built before the suites, as the gate builds
    // them (copy, 4 Nov: layer 2's close failed on an unbuilt rows.mjs, 37/37 and 33/33).
    const gen0 = generatedRows(cfg);
    if (!findings.length && gen0.rows.length) findings.push(...buildGenerated(wt, gen0.rows, { ref: sha, timeout, exec, log }).findings);
    for (const m of findings.length ? [] : ls.cur.mods) {
      if (m.blocked) { log(`${m.id}: deferred, BLOCKED (${m.blocked}); its work is not in the tranche, no suite to run`); continue; }
      if (!existsSync(join(wt, entryFile(m.id)))) { log(`${m.id}: no ledger entry, no suite to run`); continue; }
      const e = JSON.parse(readFileSync(join(wt, entryFile(m.id)), 'utf8'));
      findings.push(...entryChecks(wt, e, { timeout, exec, log }));
      const r = runSuite(wt, e, undefined, { timeout });
      suites.push({ module: e.id, exit: r.exit, tests: r.tests });
      if (r.exit !== 0) findings.push({ check: 'suite', file: e.tests[0], line: 1, message: `the ${e.id} suite failed (exit ${r.exit}): ${JSON.stringify(r.tests)}` });
      else if (!r.tests.total) findings.push({ check: 'suite', file: e.tests[0], line: 1, message: `zero tests ran in ${e.id}` });
      log(`${e.id}: suite exit ${r.exit}; tests ${JSON.stringify(r.tests)}`);
    }
    const gen = generatedRows(cfg);
    findings.push(...gen.findings);
    if (!findings.length && gen.rows.length) {
      const g = regenerate(wt, gen.rows, { timeout, exec });
      findings.push(...g.findings);
      // Only committed paths can differ from the tranche; the rest are built.
      for (const r of g.ran.filter((x) => x.changed)) {
        const mine = committedPaths(wt, sha, r);
        changed.push(...mine.filter((p) => git(['status', '--porcelain', '-z', '--untracked-files=all', '--', normPath(p)], { cwd: wt }) !== ''));
      }
      built = gen.rows.flatMap((r) => { const c = new Set(committedPaths(wt, sha, r)); return r.paths.filter((p) => !c.has(p)); });
      // A built row is verified even when git shows no change (its paths ignored by .gitignore).
      for (const [i, r] of gen.rows.entries()) {
        if (g.ran[i]?.verify !== null || !r.paths.some((p) => built.includes(p))) continue;
        const v = exec(r.verify[0], r.verify.slice(1), { cwd: wt, timeout, unset: NO_TOKENS });
        if (v.code !== 0) findings.push({ check: 'generated', file: r.paths[0], line: 1, message: `${r.verify.join(' ')} failed (exit ${v.code}) after building: ${(v.stdout + v.stderr).trim().split('\n').slice(-5).join(' ')}` });
      }
    }
  } finally {
    git(['worktree', 'remove', '--force', wt], { cwd: root, allowFail: true });
    rmSync(dirname(wt), { recursive: true, force: true });
  }
  if (findings.length) {
    for (const f of findings) log(`${f.check}: ${f.file}: ${f.message}`);
    log(`layer ${n} not closed: ${findings.length} finding(s) on ${sha.slice(0, 10)}; nothing recorded`);
    return { ok: false, findings };
  }
  // A module deferred BLOCKED is recorded with its reason: { reason, marks }; the rest, its marks.
  const deferred = Object.fromEntries(ls.cur.mods.filter((m) => m.marks.length || m.blocked).map((m) => [m.id, m.blocked ? { reason: m.blocked, marks: m.marks } : m.marks]));
  const row = { row: 'closed', layer: Number(n), tranche: cfg.tranche, commit: sha, at: now(), deferred, suites, generated_changed: changed };
  writeState(root, cfg.state_branch, `layer ${n} closed at ${cfg.tranche} ${sha.slice(0, 10)}`, (w) => {
    const p = join(w, CLOSED_FILE);
    const before = existsSync(p) ? readFileSync(p, 'utf8') : '';
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, before + JSON.stringify(row) + '\n');
    return {};
  });
  log(`layer ${n} closed at ${cfg.tranche} ${sha.slice(0, 10)}; deferred: ${Object.entries(deferred).map(([id, d]) => (Array.isArray(d) ? `${id} ${d.length}` : `${id} ${d.marks.length} (BLOCKED: ${d.reason})`)).join(', ') || 'none'}`);
  if (built.length) log(`generated, built and verified, not committed (deploy dev and release run build them): ${built.join(', ')}`);
  if (changed.length) log(`regenerated files differ from the tranche (${changed.join(', ')}): not committed here; commit them by BOB's plain pull request`);
  nextWork(root, cfg, s.rows, tranche, { log, notices: owedNotices(root, cfg, s.rows, () => {}), state: layerState(root, cfg, s.rows, tranche, { closed: [...closed, row] }) });
  // The close gives BOB its next layer's work and the deploy and walk: the wake is the last line.
  const wake = wakeLine(`layer ${n} closed: ${READY_START}, then status`, as);
  log(wake || READY_NEXT);
  return { ok: true, row, wake };
}


// ===== file: hold.test.mjs =====

// Holds and idle capacity (Bob, 5 Nov: a spoken "about 6 job sessions at most" held BOB near 6 of
// 20 for about 6 hours and nothing in Process3 saw it; cap use about 48% over a day).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commit, entry, makeRepo, setJobCap } from './helpers.mjs';
import { HOLDS_FILE, hold, holdHours, holdLines, holdsOf } from '../lib/hold.mjs';
import { flowFigures, unmetAtRef } from '../lib/metrics.mjs';
import { recordStart } from '../lib/roles.mjs';
import { readState, writeState } from '../lib/state.mjs';
import { status } from '../lib/status.mjs';
import { SWEEP_ROWS_FILE, sweep } from '../lib/sweep.mjs';
import { git } from '../lib/util.mjs';

const quiet = () => {};
const SB = 'process-state';
const S = 'session_coord1';
const ago = (min) => new Date(Date.now() - min * 6e4).toISOString();

function withOrigin(files = {}) {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': { tranche: 'tranche', coordinator: 'session_coord1' }, 'build/layers.md': '| 1 | a, b |\n| 2 | c, d, e, f, g, h |\n', ...files });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return root;
}
const lines = (root) => { const out = []; status(root, { offline: true, log: (l) => out.push(l) }); return out; };

test('hold: a row on the state branch, printed first by status with who, why and minutes left; ended by --end; refusals', (t) => {
  setJobCap(t, 20);
  const root = withOrigin();
  assert.deepEqual(lines(root).slice(0, 1), ['holds: none']);
  const r = hold(root, 'slots:3', { why: 'deploy rehearsal', by: S, until: '90m', log: quiet });
  assert.equal(r.id, 'hold-1');
  hold(root, 'module:a', { why: 'its provider is being split', by: S, until: '30m', log: quiet });
  const out = lines(root);
  assert.match(out[0], /^holds: 2 live/);
  assert.match(out[1], /^- hold-1 slots:3, by session_coord1, (89|90) min to expiry: deploy rehearsal$/);
  assert.match(out[2], /^- hold-2 module:a, by session_coord1, (29|30) min to expiry/);
  hold(root, undefined, { end: 'hold-1', by: S, log: quiet });
  assert.throws(() => hold(root, undefined, { end: 'hold-1', by: S, log: quiet }), /holds nothing already \(ended\)/);
  assert.match(lines(root)[0], /^holds: 1 live/);
  // No forced renewal: a hold may run as long as its setter says, whoever sets it; no Bob path.
  assert.equal(hold(root, 'slots:2', { why: 'x', by: S, until: '30h', log: quiet }).id, 'hold-3');
  assert.throws(() => hold(root, 'slots:1', { why: 'x', by: 'bob', until: '10m', log: quiet }), /--by <your session id/);
  assert.equal(hold(root, 'layer:2', { why: 'wide is fine', by: S, until: '2h', log: quiet }).id, 'hold-4');
  assert.throws(() => hold(root, 'slots:1', { why: 'x', by: S, log: quiet }), /--prs <n>\[,<n>\.\.\.\] \(the pull requests whose land ends the hold\), --when <condition> .* or --until .*words alone are refused/);
  assert.throws(() => hold(root, 'slots:1', { why: 'x', by: S, prs: '12,x', log: quiet }), /--prs <n>\[,<n>\.\.\.\]: the pull requests the hold waits on/);
  assert.throws(() => hold(root, 'room:1', { why: 'x', by: S, until: '10m' }), /module:<id>, layer:<n> or slots:<n>/);
  assert.throws(() => hold(root, 'slots:1', { why: 'x', by: S, until: ago(1) }), /a future time/);
  assert.throws(() => hold(root, 'slots:1', { why: 'x', by: 'me', until: '10m' }), /--by <your session id/);
});

test('hold: a longer hold is a visible chain of renewals, each with its reason; report tranche counts hold-hours by setter and reason', (t) => {
  setJobCap(t, 20);
  const root = withOrigin();
  hold(root, 'slots:4', { why: 'gate queue full', by: S, until: '2h', log: quiet });
  const r = hold(root, 'slots:4', { why: 'gate queue still full', by: S, until: '2h', log: quiet });
  assert.equal(r.renews, 'hold-1');
  assert.match(lines(root)[2], /^- hold-2 slots:4, by session_coord1, renewing hold-1, (119|120) min to expiry: gate queue still full$/);
  assert.equal(hold(root, 'module:a', { why: 'x', by: S, until: '10m', log: quiet }).renews, undefined);
  const at = (h) => new Date(Date.parse('2026-11-04T00:00:00Z') + h * 36e5).toISOString();
  const rows = [
    { at: at(0), row: 'hold', id: 'hold-1', scope: 'slots:4', why: 'gate queue full', by: S, until: at(2) },
    { at: at(2), row: 'hold', id: 'hold-2', scope: 'slots:4', why: 'gate queue full', by: S, until: at(4), renews: 'hold-1' },
    { at: at(3), row: 'end', id: 'hold-2', by: S },
    { at: at(5), row: 'hold', id: 'hold-3', scope: 'module:a', why: 'split', by: 'session_x1', until: at(7) },
    // A renewal set before the hold it renews ends: the overlap counts once (5.5 to 6, not twice).
    { at: at(5.5), row: 'hold', id: 'hold-4', scope: 'module:a', why: 'split', by: 'session_x1', until: at(7.5), renews: 'hold-3' },
  ];
  assert.deepEqual(holdHours(rows, at(1), at(6)), [{ by: S, why: 'gate queue full', holds: 2, hours: 2 }, { by: 'session_x1', why: 'split', holds: 2, hours: 1 }]);
});

test('hold --prs: it lasts until each named pull request has landed on the tranche, with no time limit; or its --until, the first', (t) => {
  setJobCap(t, 20);
  const root = withOrigin();
  const r = hold(root, 'module:a', { why: 'its provider PR 12 and 13 land first', by: S, prs: '12, 13', log: quiet });
  assert.deepEqual([r.prs, r.until], [[12, 13], undefined]);
  assert.match(lines(root)[1], /^- hold-1 module:a, by session_coord1, until PR 12, 13 land: its provider PR 12 and 13 land first$/);
  const land = (subject) => { git(['checkout', '-q', 'tranche'], { cwd: root }); git(['commit', '-q', '--allow-empty', '-m', subject], { cwd: root }); git(['push', '-q', 'origin', 'tranche'], { cwd: root }); git(['fetch', '-q', 'origin'], { cwd: root }); };
  land('Merge job PR 12');
  assert.match(lines(root)[1], /^- hold-1 module:a, by session_coord1, until PR 13 lands: /);
  land('Merge pull request #13 from o/build-x');
  assert.match(lines(root)[0], /^holds: 0 live, 1 expired/);
  assert.match(lines(root)[1], /^- hold-1 module:a, by session_coord1: its PRs landed \d+ min ago, holds nothing/);
  // With both, the first ends it; PRs unread hold until the time.
  const both = { row: 'hold', id: 'hold-2', scope: 'slots:1', why: 'w', by: S, prs: [99], until: ago(5) };
  assert.equal(holdsOf([both]).at(0).live, false);
  assert.equal(holdsOf([{ ...both, until: ago(-5) }], Date.now(), null).at(0).live, true);
  assert.equal(holdsOf([{ ...both, until: undefined }], Date.now(), new Map([[99, Date.now() - 6e4]])).at(0).live, false);
  // Hold-hours end at the land.
  const at = (h) => new Date(Date.parse('2026-11-04T00:00:00Z') + h * 36e5).toISOString();
  const rows = [{ at: at(0), row: 'hold', id: 'hold-1', scope: 'module:a', why: 'p', by: S, prs: [7] }];
  assert.deepEqual(holdHours(rows, at(0), at(10), new Map([[7, Date.parse(at(3))]])), [{ by: S, why: 'p', holds: 1, hours: 3 }]);
  assert.deepEqual(holdHours(rows, at(0), at(10), null), [{ by: S, why: 'p', holds: 1, hours: 10 }]);
});

test('holds: an expired hold holds nothing and is printed as expired', () => {
  const hs = holdsOf([
    { row: 'hold', id: 'hold-1', scope: 'slots:14', why: 'about 6 at most', by: S, until: ago(30) },
    { row: 'hold', id: 'hold-2', scope: 'layer:2', why: 'y', by: S, until: ago(-20) },
  ]);
  assert.deepEqual(hs.map((h) => h.live), [false, true]);
  const l = holdLines(hs);
  assert.match(l[0], /^holds: 1 live, 1 expired/);
  assert.match(l[2], /^- hold-1 slots:14, by session_coord1: expired (29|30) min ago, holds nothing: about 6 at most$/);
});

test('sweep --sessions: every unarchived job session holds a slot, idle complete-awaiting-merge ones too; one page of a longer list is refused (copy, 5 Nov 04:36: 6 counted of 16)', (t) => {
  setJobCap(t, 20);
  const root = withOrigin();
  recordStart(root, 'root', 'session_root1', { log: quiet });
  recordStart(root, 'bob', 'session_bob1', { log: quiet });
  writeState(root, SB, 'older', (d) => mkdirSync(join(d, 'metrics'), { recursive: true }) || writeFileSync(join(d, SWEEP_ROWS_FILE), JSON.stringify({ at: ago(40), row: 'sweep', live: 2, job_cap: 20, idle_capacity: { kind: 'empty', since: ago(40) } }) + '\n'));
  const dir = mkdtempSync(join(tmpdir(), 'p3-sessions-'));
  const s = (i, st, o = {}) => ({ id: `session_j${i}`, title: `job m${i}`, session_status: st, updated_at: ago(5), ...o });
  // 7 working, 5 complete awaiting the MERGER (idle, review_ready), 4 waiting or blocked (idle), 3 archived, 2 roles.
  const list = [...Array.from({ length: 7 }, (_, i) => s(i, 'running')), ...Array.from({ length: 5 }, (_, i) => s(10 + i, 'idle', { status_bucket: 'review_ready' })), ...Array.from({ length: 4 }, (_, i) => s(20 + i, 'idle')), ...Array.from({ length: 3 }, (_, i) => s(30 + i, 'archived')), { id: 'session_root1', title: 'ROOT', session_status: 'running' }, { id: 'session_bob1', title: 'BOB', session_status: 'idle' }];
  const file = join(dir, 's.json');
  writeFileSync(file, JSON.stringify({ data: list, has_more: false }));
  const rows = () => readState(root, SB, SWEEP_ROWS_FILE).trim().split('\n').map((l) => JSON.parse(l));
  const r = sweep(root, { session: 'session_root1', sessions: file, offline: true, log: quiet });
  assert.equal(rows().at(-1).live, 16, 'every unarchived job session');
  assert.ok(!r.found.some((x) => /IDLE CAPACITY/.test(x)), '16 of 20 and nothing startable: no empty-slot alarm');
  // The first page of a longer list: it stands while the record knows no session it could miss
  // (restart speed, 5 Nov), and is refused, with the way to read the rest, once a recorded open
  // job's session could be on the next page.
  writeFileSync(file, JSON.stringify({ data: list.slice(0, 6), has_more: true, last_id: 'session_j5' }));
  // No record and no job the state branch records as live: the page stands (build/starter-fixes).
  assert.doesNotThrow(() => sweep(root, { session: 'session_root1', sessions: file, offline: true, log: quiet }));
  writeState(root, SB, 'whole read', (d) => writeFileSync(join(d, 'metrics/live-sessions.json'), JSON.stringify({ oldest: ago(60) })));
  assert.throws(() => sweep(root, { session: 'session_root1', sessions: file, offline: true, log: quiet }), /a job session live at the last whole read/);
  // One time for the whole page: ago() per session can tick a millisecond, and a page newer at its end is no bound (CI, PR 152).
  const at90 = ago(90);
  const dated = list.slice(0, 6).map((x) => ({ ...x, created_at: at90 }));
  writeFileSync(file, JSON.stringify({ data: dated, has_more: true, last_id: 'session_j5' }));
  assert.doesNotThrow(() => sweep(root, { session: 'session_root1', sessions: file, offline: true, log: quiet }));
  commit(root, { 'process/ledger/m6.json': entry('m6') }, 'entry m6');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', '-b', 'job/m6'], { cwd: root });
  commit(root, { 'process/metrics/m6.jsonl': JSON.stringify({ at: ago(30), module: 'm6', row: 'attempt', event: 'start', attempt: 1 }) + '\n' }, 'start m6');
  git(['push', '-q', 'origin', 'job/m6'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  // No record, and a page not reaching past m6's start 30 min ago: m6's session could be on the next page.
  writeState(root, SB, 'no record', (d) => writeFileSync(join(d, 'metrics/live-sessions.json'), 'null'));
  const at25 = ago(25);
  writeFileSync(file, JSON.stringify({ data: list.slice(0, 6).map((x) => ({ ...x, created_at: at25 })), has_more: true, last_id: 'session_j5' }));
  assert.throws(() => sweep(root, { session: 'session_root1', sessions: file, offline: true, log: quiet }), /list_sessions has more pages \(has_more\), and a recorded job session could be on them \(job m6: 1 session started since .*call it with limit 100, and again with after_id <last_id> while has_more and the last page reaches back no further than /);
});

test('flow: velocity reads the tranche\'s first-parent commits, never a job branch\'s own commit merged later', () => {
  const root = makeRepo({ 'README.md': 'x', 'build/requirements/a.md': '- **R1** *(not yet met: x)* one\n- **R2** *(not yet met: x)* two\n' });
  const env = (d) => ({ env: { GIT_COMMITTER_DATE: d, GIT_AUTHOR_DATE: d }, cwd: root });
  git(['commit', '-q', '--amend', '--no-edit'], env('2026-11-04T09:00:00Z'));
  git(['checkout', '-q', '-b', 'job/a'], { cwd: root });
  writeFileSync(join(root, 'build/requirements/a.md'), '- **R1** one\n- **R2** two\n');
  git(['commit', '-q', '-am', 'meet R1 R2'], env('2026-11-04T10:00:00Z'));
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'merge', 'job/a'], env('2026-11-04T12:00:00Z'));
