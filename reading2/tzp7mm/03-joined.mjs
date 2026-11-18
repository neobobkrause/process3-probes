// ===== file: suite-budget.test.mjs (continued) =====

  assert.equal(suiteBudget(root, loadConfig(root), { tranche: 'origin/tranche', comments: () => null, rows }), null);
});

// ===== file: job.mjs (later part) =====

      if (usd === 'unmeasured') log(`job ${id}'s cost: unmeasured (session ${sid} read ${cost}, its last row ${prior}: get_session's usage has not moved since); BOB reads it at the merge: merge --job-cost-usd`);
    }
    receipt.sha = commitFiles(root, [entryFile(id), metricsFile(id)], `job complete ${id} (attempt ${attempt})`);
  } catch (e) {
    restore(root, [entryFile(id), metricsFile(id)]);
    throw e;
  }
  return finish(root, { id, slug, pr, branch, push, io, log, receipt, again: !!again });
}

// A COMPLETE job's rerun with --exempt-revert or --not-verified: the saved receipt (its commands
// and tests stand) carrying the claims of the newest receipt posted at the same commit, so a
// second amendment keeps the first's (review of PR 64), with the revert exemption set and the
// not-verified lines added (never removed: dropping one would claim a check nobody ran), and
// what it replaced. Null when nothing changes. The COMPLETE commit's row keeps the original.
export function amendReceipt(saved, { notVerified = [], exemptRevert } = {}, prior = null) {
  const at = prior?.sha === saved.sha ? prior : null;
  const was = {
    exempt: { ...(saved.exempt || {}), ...(at?.exempt || {}) },
    not_verified: [...new Set([...(saved.not_verified || []), ...(at?.not_verified || [])])],
  };
  const exempt = exemptRevert ? { ...was.exempt, revert: exemptRevert } : was.exempt;
  const not_verified = [...was.not_verified, ...notVerified.filter((x) => !was.not_verified.includes(x))];
  if (sameClaims({ exempt, not_verified }, at || saved)) return null;
  return { ...saved, exempt, not_verified, amended: { at: now(), tool: toolPin(), was: at ? { exempt: at.exempt || {}, not_verified: at.not_verified || [] } : was } };
}
const sameClaims = (a, b) => JSON.stringify([a?.exempt || {}, a?.not_verified || []]) === JSON.stringify([b?.exempt || {}, b?.not_verified || []]);

// Push, confirm the push landed (REC-5), post the receipt once, mark ready. Each step is
// skipped when it is already done, so a half-finished job complete can simply run again.
// An amended receipt is posted unless the newest one already makes the same claims.
// A new attempt on a ready pull request first makes it a draft again, so the push's gate run
// skips and the run on ready reads the new receipt, as on a first complete.
function finish(root, { id, slug, pr, branch, push, io, log, receipt, amend = null, again = false }) {
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  if (!push) {
    const a = amend && amendReceipt(receipt, amend);
    return { ok: true, receipt: a || receipt };
  }
  if (remoteTip(root, branch) !== sha) {
    refuseUnpushable(root, loadConfig(root), { branch });
    if (again && !pr.draft) pr = { ...pr, ...io.toDraft(slug, pr), draft: true };
    const r = git(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { cwd: root, allowFail: true });
    if (r.code !== 0) fail(`the push of ${branch} failed (${r.stderr.trim()}); run job complete again${originAhead(root, branch) ? `, after \`${P3} job sync ${id}\`: origin's ${branch} has commits this checkout lacks` : ''}`);
  }
  if (remoteTip(root, branch) !== sha) fail(`the push of ${branch} did not land; run job complete again`);
  const all = io.comments(slug, pr.number);
  let posted = latestBlock(slug, pr.number, RECEIPT, all, { from: pr.user?.login || null });
  let url = posted?.comment?.html_url;
  const amendedReceipt = amend && amendReceipt(receipt, amend, posted?.data);
  const amended = !!amendedReceipt;
  if (amended) receipt = amendedReceipt;
  if (posted?.data?.sha !== sha || amended) {
    // A new attempt pushed while the pull request was ready (a run stopped after its push, or a
    // push by hand) and never given its receipt: a draft first, so the ready below starts the
    // gate run that reads this receipt; the push's own run had none to read.
    if (again && !pr.draft && posted?.data?.sha !== sha) pr = { ...pr, ...io.toDraft(slug, pr), draft: true };
    const what = amended ? 'Amended receipt' : 'Receipt';
    const c = io.addComment(slug, pr.number, block(RECEIPT, receipt, `${what} for job \`${id}\`, attempt ${receipt.attempt}, at \`${sha.slice(0, 10)}\`.`));
    url = c.html_url;
    posted = { comment: { ...c, created_at: c.created_at || now() }, data: receipt };
  }
  // The ready below starts the gate run that reads the receipt. An amended receipt changes no
  // claim the gate reads, so a pull request already ready is not gated again.
  if (pr.draft) io.markReady(slug, pr.number);
  log(`receipt: ${url}`);
  // The job's report: its pull request is ready for BOB's merge once the gate passes.
  // Its session named, for BOB's merge to read the job's cost from (merge --job-cost-usd).
  const sid = readRows(root, id).filter((r) => r.event === 'complete').pop()?.session;
  log(wakeLine(`job ${id} complete, PR #${pr.number} ready${sid ? `, session ${sid}` : ''}`, jobSender(id)));
  return { ok: true, receipt: receipt || posted?.data };
}

// The legitimate blocked exit (ENF-7): BLOCKED with a reason, committed and pushed. Commits only
// the entry, and can run again to finish a push that failed.
export function jobBlock(root, id, { reason, owner, push = true, log = console.log } = {}) {
  if (!reason || reason === true) fail('block needs --reason "<why>"');
  if (owner !== undefined && owner !== 'bob' && owner !== 'coordinator') fail('--owner bob (a requirement question: what the product must do) or coordinator (anything else)');
  const branch = onBranch(root, id);
  const e = readEntry(root, id);
  if (e.status.state === 'COMPLETE') fail(`${id} is COMPLETE; it cannot be blocked`);
  if (!(e.status.state === 'BLOCKED' && e.status.reason === reason && e.status.owner === owner)) {
    writeStatus(root, id, { state: 'BLOCKED', reason, at: now(), ...(owner ? { owner } : {}) });
    try { commitFiles(root, [entryFile(id)], `block ${id}: ${reason}`); } catch (err) { restore(root, [entryFile(id)]); throw err; }
  }
  if (push) {
    refuseUnpushable(root, loadConfig(root), { branch });
    const r = git(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { cwd: root, allowFail: true });
    // BOB's merge pushed to job/<id> (defect sweep 4 Nov, #5): name the step that brings it in.
    if (r.code !== 0) fail(`the push of ${branch} failed (${r.stderr.trim()}); ${originAhead(root, branch) ? `origin's ${branch} has commits this checkout lacks: run \`${P3} job sync ${id}\`, then block again` : 'run block again'}`);
    if (remoteTip(root, branch) !== git(['rev-parse', 'HEAD'], { cwd: root })) fail('the push did not land; run block again');
  }
  log(`${id} is BLOCKED: ${reason}`);
  // The job's report: BLOCKED is BOB's to act on (its restart, a deferral, or Bob).
  if (push) log(wakeLine(`job ${id} BLOCKED`, jobSender(id)));
  return { ok: true };
}

// The module's stale lock files, installed as the gate installs them: the session hook installs
// only some of them, and the job's suite must not depend on it (GAT-5).
function installModule(root, cfg, entry, { exec, log }) {
  const inst = install(root, moduleLocks(cfg.lockfiles, entry), { onlyStale: true, ...(exec ? { exec } : {}) });
  for (const l of inst.ran) log(`installed ${l}`);
  for (const f of inst.findings) log(`${f.check}: ${f.file}: ${f.message}`);
  return inst;
}

const installed0 = (inst) => !inst.findings.length;
// The `generated` rows' untracked paths, built before the suite as the gate does:
// { commands, findings, ran }. A build runs other members' builds (the copy's bundles.mjs runs
// npm run build in each stale member), so every stale lock file is installed first, as the gate
// installs them all (defect sweep 4 Nov, #10); only when a row is to be built.
function buildModuleGenerated(root, cfg, { timeout, exec, log }) {
  const gen = generatedRows(cfg);
  const none = { commands: [], findings: [], ran: new Set() };
  if (!gen.rows.some((r) => committedPaths(root, 'HEAD', r).length < r.paths.length)) return none;
  const inst = install(root, cfg.lockfiles || [], { onlyStale: true, ...(exec ? { exec } : {}) });
  for (const l of inst.ran) log(`installed ${l}`);
  const commands = [];
  for (const l of inst.ran) commands.push({ cmd: `npm ci (${l})`, exit: inst.findings.some((f) => f.file === l) ? 1 : 0 });
  for (const f of inst.findings.filter((x) => !inst.ran.includes(x.file))) commands.push({ cmd: `npm ci (${f.file})`, exit: 1, error: f.message });
  for (const f of inst.findings) log(`${f.check}: ${f.file}: ${f.message}`);
  if (inst.findings.length) return { ...none, commands, findings: inst.findings };
  const b = buildGenerated(root, gen.rows, { timeout, log, ...(exec ? { exec } : {}) });
  if (b.built.length || b.findings.length) commands.push({ cmd: `build generated (${[...b.built, ...b.findings.map((f) => f.file)].join(', ')})`, exit: b.findings.length ? 1 : 0 });
  for (const f of b.findings) log(`${f.check}: ${f.file}: ${f.message}`);
  return { commands, findings: b.findings, ran: b.ran };
}

// A row's regenerate can rewrite its committed paths too (the copy's bundles.mjs rebuilds every
// stale bundle, the committed ones included): after the suite they go back to the commit, so the
// tree stays clean for job complete and send (defect sweep 4 Nov, #7). A job never commits them.
function restoreGenerated(root, ran, log) {
  const paths = [...new Set([...ran].flatMap((r) => committedPaths(root, 'HEAD', r)))];
  if (!paths.length) return;
  const changed = git(['status', '--porcelain', '--untracked-files=no', '--', ...paths], { cwd: root, allowFail: true }).stdout.trim();
  if (!changed) return;
  git(['checkout', 'HEAD', '--', ...paths], { cwd: root });
  log(`restored the committed generated paths the build rewrote: ${paths.join(', ')}`);
}

// The module's own suite, for the job while it works (JOB-2: the START names only tool commands).
export function jobTest(root, id, { log = console.log, exec, toolRoot, session = null, record = (r) => recordTest(root, r, { log }) } = {}) {
  // origin's layer branch, as the session's clone has it (no local layer/<n>): cold review 5.
  const cfg = jobCfg(root, loadConfig(root), id);
  pinCheck(root, id, { toolRoot, tranche: trancheRef(root, cfg), what: `\`${P3} test ${id}\`` });
  const entry = readEntry(root, id);
  const started = now();
  // The time budget (R9, Bob, 6 Nov: how much time goes to tests against real work): every run
  // is a state row, its module, session, minutes and result, whatever the result.
  const row = (result, extra = {}) => {
    const ended = now();
    const sid = sessionForm(typeof session === 'string' && session ? session : process.env.CLAUDE_CODE_REMOTE_SESSION_ID || process.env.CLAUDE_CODE_SESSION_ID || null);
    record({ row: 'test', module: id, session: sid || null, started, ended, at: ended, minutes: Math.round(((Date.parse(ended) - Date.parse(started)) / MINUTE) * 100) / 100, result, ...(cfg.layer ? { layer: cfg.layer.n } : {}), ...extra, state_branch: cfg.state_branch });
  };
  const inst = installModule(root, cfg, entry, { exec, log });
  if (inst.findings.length) { row('install failed'); return { ok: false, install: inst }; }
  const timeout = (cfg.suite_timeout_minutes || 20) * MINUTE;
  const built = buildModuleGenerated(root, cfg, { timeout, exec, log });
  // A build that fails part way may have rewritten committed paths: put back, as after the suite.
  if (built.findings.length) { restoreGenerated(root, built.ran, log); row('build failed'); return { ok: false, install: inst, generated: built }; }
  let s;
  try { s = runSuite(root, entry, undefined, { timeout }); } finally { restoreGenerated(root, built.ran, log); }
  log(s.output.split('\n').slice(-60).join('\n'));
  log(`${s.cmd}\nexit ${s.exit}; tests ${JSON.stringify(s.tests)}; ${s.seconds} s`);
  row(s.exit === 0 ? 'pass' : 'fail', { suite_seconds: s.seconds, tests: s.tests });
  return { ok: s.exit === 0, install: inst, ...s };
}

// A `p3 test` run's row on the state branch, one file per run, never edited: under its layer's
// flow (layerflow/<n>/test/) when the module is in an open layer, else tests/<module>/. A row
// that cannot be written is said, never a refusal: the run itself stands.
export function recordTest(root, r, { log = console.log } = {}) {
  const { state_branch: sb, ...row } = r;
  const name = `${safeName(row.module)}-${Date.parse(row.started)}-${randomUUID().slice(0, 8)}`;
  const path = row.layer !== undefined ? flowFile(row.layer, 'test', name) : `tests/${safeName(row.module)}/${name}.json`;
  try {
    writeState(root, sb, `test ${row.module}: ${row.result}, ${row.minutes} min`, (w) => { mkdirSync(dirname(join(w, path)), { recursive: true }); writeFileSync(join(w, path), JSON.stringify(row, null, 2) + '\n'); return {}; });
    return path;
  } catch (e) { log(`the test row was not recorded (${String(e.message).split('\n')[0].slice(0, 160)})`); return null; }
}

// revert exempt <pr> --why "<why>" --reviewer <session> (AUD-1, JOB-12): a reviewer's exemption from
// the gate's revert check, for a refactor whose tests rightly pass before and after the change.
// Posted on the job's pull request as a p3:revert-exempt block naming the head it reviewed; the
// gate takes it only from a reviewer that is not the job's own session, and only while the job's
// own files (its module's paths and tests, records aside) are as that commit had them
// (gate.mjs revertExemption). A body edit then gives the
// gate a new event (pull_request: edited), as a comment gives none.
export const EXEMPT_MARK = 'p3:revert-exempt-regate';
export function revertExempt(root, n, { why, reviewer, io: given = {}, log = console.log } = {}) {
  const io = { getPR, addComment, editPR, ...given };
  if (typeof why !== 'string' || !why.trim()) fail('revert exempt needs --why "<why its tests rightly pass before and after>"');
  const by = sessionForm(typeof reviewer === 'string' ? reviewer.trim() : '');
  if (!by) fail('revert exempt needs --reviewer <your session id>: the exemption is a reviewer\'s, never the job\'s own');
  const slug = io.slug || repoSlug(root);
  const pr = io.getPR(slug, Number(n));
  if (!pr || pr.state !== 'open') fail(`pull request ${n} is not open`);
  const id = branchModule(pr.head?.ref, ledgerIds(root, 'HEAD'));
  if (!id) fail(`pull request ${n} is from ${pr.head?.ref}, not a job branch`);
  const sha = pr.head.sha;
  // The job's own session, from its newest complete row at the head, when this clone can read it;
  // the gate checks it again either way.
  let rows = [];
  try { git(['fetch', '-q', 'origin', sha], { cwd: root, allowFail: true }); rows = rowsAt(root, sha, id); } catch { rows = []; }
  const own = rows.filter((r) => r.row === 'attempt' && r.event === 'complete').pop()?.session || null;
  if (own && sessionForm(own) === by) fail(`${by} is ${id}'s own job session: a job never exempts itself; a reviewer records the exemption`);
  const data = { kind: 'revert-exempt', module: id, pr: pr.number, sha, reviewer: by, why: why.trim(), at: now(), tool: toolPin() };
  const c = io.addComment(slug, pr.number, block(REVERT_EXEMPT, data, `Revert check exemption for job \`${id}\` at \`${sha.slice(0, 10)}\`, reviewed by ${by}.`));
  const key = String(c?.id ?? c?.html_url ?? data.at);
  const line = `<!-- ${EXEMPT_MARK} ${key} --> Gate re-run for the revert exemption${c?.html_url ? ` ${c.html_url}` : ''}.`;
  const mark = new RegExp(`^<!-- ${EXEMPT_MARK} \\S+ -->.*$`, 'm');
  const body = String(pr.body ?? '');
  try { io.editPR(slug, pr.number, { body: mark.test(body) ? body.replace(mark, () => line) : `${body}${body ? '\n\n' : ''}${line}` }); } catch (e) {
    fail(`the exemption is posted, but the body edit that re-runs the gate failed (${e.message}); edit the pull request to re-run it`);
  }
  log(`revert exemption for ${id} at ${sha.slice(0, 10)} posted${c?.html_url ? `: ${c.html_url}` : ''}; the gate runs again on the pull request`);
  return { ok: true, data };
}

// ===== file: layerbase.mjs =====

// The shared layer branch and the job's base (design note "Shared Layer Branch", Bob, 5 Nov; the
// only flow since the merge train was removed, Bob, 6 Nov). A job of the open layer's module works
// on a branch cut from layer/<n>, publishes onto it, and the layer merges into the tranche once.
// process/config.json "merge_strategy" is "layer" (or absent), or "direct" (PD-25, Bob, 9 Nov: every
// job based on the tranche, its rows under layerflow/direct-<tranche>/; direct.mjs).
// This file has no imports from job.mjs, so job.mjs can read it.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { exists, fail, fetchBranch, git } from './util.mjs';
import { fetchState, readState } from './state.mjs';

export const STRATEGIES = ['layer', 'direct'];
export const layerMode = (cfg) => (cfg?.merge_strategy ?? 'layer') === 'layer';
// PD-25: the direct flow. Every job's base is the tranche; its flow rows (start, run, test, land,
// reschedule, gate, retest) sit under one key per tranche, layerflow/direct-<tranche>/, so the layer
// flow's row readers and writers serve it unchanged.
export const directMode = (cfg) => cfg?.merge_strategy === 'direct';
export const directKey = (tranche) => `direct-${String(tranche).replace(/[^A-Za-z0-9._-]+/g, '-')}`;
// The branch a flow job publishes onto: its layer's, or under the direct flow the tranche itself.
export const flowBase = (cfg) => (cfg.layer?.direct ? cfg.layer.tranche : cfg.tranche);
export const LAYER_BRANCH = /^layer\/(\d+)$/;
export const layerBranch = (n) => `layer/${n}`;
export const layerOfBranch = (b) => { const m = String(b || '').match(LAYER_BRANCH); return m ? Number(m[1]) : null; };
// The branch layer sync <n> opens its pull request from (layerflow.mjs layerSync): layer-sync/<n>-<the
// tranche tip's first 10 hex>, with -<k> for a later attempt. The layer it syncs, or null.
export const SYNC_BRANCH = /^layer-sync\/(\d+)-[0-9a-f]{10}(?:-\d+)?$/;
export const syncOfBranch = (b) => { const m = String(b || '').match(SYNC_BRANCH); return m ? Number(m[1]) : null; };
// The branch layer pin <n> opens its pull request from (PD-23, layerflow.mjs layerPin): layer-pin/<n>-<the
// new pin's first 10 hex>, -<k> for a later attempt; one commit on the layer moving only the pin files.
export const PIN_BRANCH = /^layer-pin\/(\d+)-[0-9a-f]{10}(?:-\d+)?$/;
export const pinOfBranch = (b) => { const m = String(b || '').match(PIN_BRANCH); return m ? Number(m[1]) : null; };
// The state branch's files of the layer flow: one file per event, added and never edited, so two
// writers never conflict (as notices/).
export const FLOW_DIR = 'layerflow';
export const flowFile = (n, kind, name) => (name === undefined ? `${FLOW_DIR}/${n}/${kind}.json` : `${FLOW_DIR}/${n}/${kind}/${name}.json`);
export const safeName = (s) => String(s).replace(/[^A-Za-z0-9._-]+/g, '-');

// The layer map (layers_file): [{ n, mods }], the same table status.mjs layerState reads.
export function layerMap(text) {
  if (text === null || text === undefined) return [];
  return String(text).split('\n').map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
    .filter((c) => c.length > 1 && /^\d+$/.test(c[0]))
    .map((c) => ({ n: Number(c[0]), mods: c.at(-1).replace(/[`*]/g, '').split(',').map((m) => m.trim()).filter(Boolean) }))
    .sort((a, b) => a.n - b.n);
}
export function layersAt(root, cfg, ref) {
  let text = null;
  if (ref) text = exists(root, ref, cfg.layers_file) ? git(['show', `${ref}:${cfg.layers_file}`], { cwd: root }) : null;
  else if (existsSync(join(root, cfg.layers_file))) text = readFileSync(join(root, cfg.layers_file), 'utf8');
  const map = layerMap(text);
  return map.length ? [...map, ...completionLayers(root, cfg, map)] : map;
}
// The layers past the map, each read from its open row, so the product's layer map is never edited:
// - a completion layer (PLN-4 as it stood; PD-12; C33), its modules completion_file's open items'
//   (completion: { file, items, mods }). Layer 12 on the copy is the last: BD-R1 (Bob, 8 Nov)
//   retires the path once it merges, and no new one opens (layerflow.mjs roundLayer);
// - a round layer (BD-R1, rounds.mjs): a later round's pass over one map layer, its modules the
//   flawed ones there (round: { n, of, items, mods, walk }).
// Each takes the next number, so its branch layer/<n> and its rows layerflow/<n>/ are its own.
export function completionLayers(root, cfg, map) {
  const out = [];
  if (!cfg?.state_branch) return out;
  for (let k = (map.at(-1)?.n ?? 0) + 1; ; k++) {
    let row = null;
    try { row = JSON.parse(readState(root, cfg.state_branch, flowFile(k, 'open')) || 'null'); } catch { row = null; }
    const comp = Array.isArray(row?.completion?.mods);
    const round = Array.isArray(row?.round?.mods);
    if (!comp && !round) break;
    // An earlier tranche's layer past the map is not this one's (cold review of C33).
    if (row.tranche && cfg.tranche && row.tranche !== cfg.tranche) break;
    out.push(comp ? { n: k, mods: row.completion.mods, completion: row.completion } : { n: k, mods: row.round.mods, round: row.round });
  }
  return out;
}
// The round a layer belongs to (BD-R1): a round layer's own; the map's layers and the completion
// layer are round 1's (Bob, 8 Nov: "Finish, then switch": layer 12 finishes as this round's work).
export const roundOf = (L) => L?.round?.n ?? 1;
// How a round layer is named wherever a person or a session reads it (Bob, 9 Nov, on "layer 13":
// "I thought there is no layer 13 any more"; "layers are in rounds which are in tranches"): the
// hierarchy, outermost first, the layer the plan's, and the tool's running number in parentheses
// for the commands that take it: "tranche T53 · round 2 · layer 11 (internal layer 13)"; the
// tranche left off where the reader has it already (status, headed by it).
export const roundLayerName = (r, of, n, tranche = null) => `${tranche ? `tranche ${tranche} · ` : ''}round ${r} · layer ${of} (internal layer ${n})`;
// How a layer is named in the flow's lines: a map layer "layer 3"; a round layer as above.
export const layerName = (L, n = L?.n, tranche = null) => (L?.round ? roundLayerName(L.round.n, L.round.of, n, tranche) : `layer ${n}`);
export const layerOf = (layers, id) => layers.find((L) => L.mods.includes(id))?.n ?? null;
// Every layer listing a module, newest first (a completion layer past the map reopens a module of an
// earlier layer, C33; a map may list a module twice).
export const layersOf = (layers, id) => layers.filter((L) => L.mods.includes(id)).map((L) => L.n).reverse();

const hasRef = (root, r) => git(['rev-parse', '-q', '--verify', r], { cwd: root, allowFail: true }).code === 0;

// The config a job's commands run with. For a module of no open layer branch, the config itself
// (with noLayers when the product has no layer map at all). With it on, for a module of a layer whose branch layer/<n> exists
// (on origin, or locally with push false) and has not merged (the state branch's merged row): the
// layer branch takes the tranche's place in the job's start, sync, complete and test, and
// `layer` names it ({ n, tranche: the real tranche }).
export function jobCfg(root, cfg, id, { push = true, merged = null } = {}) {
  // PD-25: the tranche stays the base; `layer` names the tranche's flow key (no layer branch).
  if (directMode(cfg) && !cfg.layer) return { ...cfg, layer: { n: directKey(cfg.tranche), tranche: cfg.tranche, direct: true } };
  if (!layerMode(cfg) || cfg.layer) return cfg;
  const tr = push ? `refs/remotes/origin/${cfg.tranche}` : `refs/heads/${cfg.tranche}`;
  // The state branch first: a completion layer's modules are read from its open row (C33).
  if (push && cfg.state_branch) { try { fetchState(root, cfg.state_branch); } catch { /* read what the clone holds */ } }
  const map = layersAt(root, cfg, hasRef(root, tr) ? tr : null);
  // A product with no layer map has no layer to branch from: its jobs keep the tranche (noLayers).
  if (!map.length) return { ...cfg, noLayers: true };
  // Its own layer first; else a layer it joined (layer join: a module whose layer is behind the open
  // one joins the next to open), each only while its branch exists and has not merged.
  const live = (n) => {
    const b = layerBranch(n);
    if (push) fetchBranch(root, b, { allowFail: true });
    if (!hasRef(root, push ? `refs/remotes/origin/${b}` : `refs/heads/${b}`)) return false;
    return !(merged ? merged(n) : push ? mergedOnState(root, cfg, n) : false);
  };
  const listed = layersOf(map, id);
  const n = [...listed, ...joinedLayers(root, cfg, id)].find((x) => x !== null && live(x));
  if (n === undefined) return cfg;
  return { ...cfg, tranche: layerBranch(n), layer: { n, tranche: cfg.tranche, ...(!listed.includes(n) ? { joined: true } : {}) } };
}
// The layers a module joined, from the state branch's layerflow/<n>/join/<id>.json rows, lowest first.
function joinedLayers(root, cfg, id) {
  const sb = `refs/remotes/origin/${cfg.state_branch}`;
  const r = git(['ls-tree', '-r', '--name-only', sb, '--', `${FLOW_DIR}/`], { cwd: root, allowFail: true });
  if (r.code !== 0) return [];
  const want = `/join/${safeName(id)}.json`;
  return r.stdout.split('\n').filter((f) => f.endsWith(want)).map((f) => Number(f.split('/')[1])).filter(Number.isInteger).sort((a, b) => a - b);
}
function mergedOnState(root, cfg, n) {
  const sb = cfg.state_branch;
  const f = git(['fetch', '-q', 'origin', `+refs/heads/${sb}:refs/remotes/origin/${sb}`], { cwd: root, allowFail: true });
  if (f.code !== 0) return false;
  return git(['cat-file', '-e', `refs/remotes/origin/${sb}:${flowFile(n, 'merged')}`], { cwd: root, allowFail: true }).code === 0;
}
export const refuseInLayer = (cfg, what) => { if (cfg.layer && !cfg.layer.direct) fail(`${what} is not part of the layer flow (merge_strategy "layer", ${cfg.tranche}): start the job plainly, or ask BOB`); };

// ===== file: session-safety.test.mjs =====

// Build H, session safety: the start check, refusals per session, and retry on a moved base.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { mergeRetry, mergePlain, unreadable } from '../lib/merge.mjs';
import { REFRESH_AT, REFUSALS_FILE, appendRow, bobMetricsFile, recordRefusal, refusalCounts } from '../lib/metrics.mjs';
import { approvalsHash, loadedFile, startCheck, wakeCheck } from '../lib/start.mjs';
import { status } from '../lib/status.mjs';
import { Fail, git, pushRetry } from '../lib/util.mjs';
import { commit, makeRepo } from './helpers.mjs';

const APPROVALS = '# Product\n\n## Standing approvals from Bob\n\nSessions may push.\n\n## Other\n\nx\n';
const quiet = () => {};

function withOrigin(files = { 'CLAUDE.md': APPROVALS }) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  return { root, bare };
}

function clone(bare, branch = 'tranche') {
  const dir = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', '-b', branch, bare, dir], { cwd: tmpdir() });
  git(['config', 'user.email', 'other@example.com'], { cwd: dir });
  git(['config', 'user.name', 'Other'], { cwd: dir });
  git(['config', 'commit.gpgsign', 'false'], { cwd: dir });
  return dir;
}

test('start check: HEAD at the tip with the same approvals passes and prints both SHAs', () => {
  const { root } = withOrigin();
  const out = [];
  const r = startCheck(root, { branch: 'tranche', log: (m) => out.push(m) });
  assert.equal(r.ok, true);
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.ok(out.includes(`HEAD ${head}`));
  assert.ok(out.includes(`tranche ${head}`));
  // With no --branch, the tranche the config names (the default here).
  assert.equal(startCheck(root, { log: quiet }).ok, true);
});


// A box of 5 beets came through Marsh Lane.

test('start check: a stale checkout, a commit of its own, or changed approvals fail', () => {
  const { root, bare } = withOrigin();
  // The branch moved on origin after the session's checkout was made.
  const other = clone(bare);
  const moved = commit(other, { 'more.txt': 'x' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: other });
  const out = [];
  const stale = startCheck(root, { branch: 'tranche', log: (m) => out.push(m) });
  assert.equal(stale.ok, false);
  assert.equal(stale.sameHead, false);
  assert.equal(stale.tip, moved);
  assert.ok(out.includes(`tranche ${moved}`));
  assert.match(out.at(-1), /FAILED/);
  // Up to date again, then a local commit of its own.
  git(['merge', '-q', '--ff-only', 'origin/tranche'], { cwd: root });
  assert.equal(startCheck(root, { branch: 'tranche', log: quiet }).ok, true);
  commit(root, { 'local.txt': 'x' });
  assert.equal(startCheck(root, { branch: 'tranche', log: quiet }).sameHead, false);
  git(['reset', '-q', '--hard', 'origin/tranche'], { cwd: root });
  // The approvals the session loaded from its checkout differ from the tip's.
  writeFileSync(join(root, 'CLAUDE.md'), APPROVALS.replace('may push', 'may push anywhere'));
  const r = startCheck(root, { branch: 'tranche', log: quiet });
  assert.deepEqual([r.ok, r.sameHead, r.sameApprovals], [false, true, false]);
  // A change outside the block is not a change to the approvals.
  writeFileSync(join(root, 'CLAUDE.md'), APPROVALS.replace('x\n', 'y\n'));
  assert.equal(startCheck(root, { branch: 'tranche', log: quiet }).ok, true);
});

test('start check --wake: the tip\'s approvals against those recorded at the start, under .git', () => {
  const { root, bare } = withOrigin();
  const out = [];
  assert.equal(wakeCheck(root, { log: (m) => out.push(m) }).recorded, true, 'no record: says so and records');
  assert.match(out.at(-1), /no record/);
  assert.equal(startCheck(root, { log: quiet }).ok, true);
  assert.ok(existsSync(loadedFile(root)) && loadedFile(root).includes('.git'));
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '', 'nothing in the tree');
  const other = clone(bare);
  commit(other, { 'more.txt': 'x' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: other });
  assert.equal(wakeCheck(root, { log: quiet }).ok, true, 'a new tip with the same approvals');
  commit(other, { 'CLAUDE.md': APPROVALS.replace('may push', 'may push anywhere') });
  git(['push', '-q', 'origin', 'tranche'], { cwd: other });
  const w = [];
  assert.equal(wakeCheck(root, { log: (m) => w.push(m) }).ok, false);
  assert.equal(w.at(-1), 'approvals changed since this session started: it is replaced');
});

test('start check --wake --approvals: a fresh container compares the tip with the hash its prompt carries, not a record', () => {
  const { root, bare } = withOrigin();
  const at = approvalsHash(root, git(['rev-parse', 'origin/tranche'], { cwd: root }));
  assert.match(at, /^[0-9a-f]{64}$/);
  const other = clone(bare);
  commit(other, { 'CLAUDE.md': APPROVALS.replace('may push', 'may push anywhere') });
  git(['push', '-q', 'origin', 'tranche'], { cwd: other });
  // A fresh container: no record under .git. Without --approvals it records the new tip's and passes.
  const fresh = clone(bare);
  const w = [];
  assert.equal(wakeCheck(fresh, { approvals: at, log: (m) => w.push(m) }).ok, false, 'the change since the prompt was made is caught');
  assert.equal(w.at(-1), 'approvals changed since this session started: it is replaced');
  assert.equal(existsSync(loadedFile(fresh)), false, 'nothing recorded');
  const now = approvalsHash(fresh, git(['rev-parse', 'origin/tranche'], { cwd: fresh }));
  assert.equal(wakeCheck(fresh, { approvals: now, log: quiet }).ok, true);
  assert.throws(() => wakeCheck(fresh, { approvals: 'abc', log: quiet }), /--approvals takes the 64-hex hash/);
});

test('start check: a branch it cannot fetch is not a confirmed start', () => {
  const { root } = withOrigin();
  assert.throws(() => startCheck(root, { branch: 'no-such-branch', log: quiet }), /could not fetch no-such-branch/);
  assert.throws(() => startCheck(root, { branch: true, log: quiet }), /--branch needs/);
});

test('refusals: recorded with act, depth and session; bad input refused', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const row = recordRefusal(root, { session: 'session_A', act: 'git push origin x', depth: '1' });
  assert.deepEqual([row.row, row.session, row.act, row.depth], ['refusal', 'session_A', 'git push origin x', 1]);
  const line = JSON.parse(readFileSync(join(root, REFUSALS_FILE), 'utf8').trim());
  assert.equal(line.session, 'session_A');
  assert.throws(() => recordRefusal(root, { act: 'x', depth: 0 }), /--session/);
  assert.throws(() => recordRefusal(root, { session: 's', depth: 0 }), /--act/);
  assert.throws(() => recordRefusal(root, { session: 's', act: 'x' }), /--depth/);
  assert.throws(() => recordRefusal(root, { session: 's', act: 'x', depth: 'deep' }), /--depth/);
});

test('refusals: counted per session from the refusal rows only; REFRESH at 10', () => {
  const rows = [
    ...Array.from({ length: REFRESH_AT }, (_, i) => ({ row: 'refusal', id: `a${i}`, session: 'A', act: 'merge', depth: 0 })),
    // The same refusal also listed on BOB's measured row is not counted again.
    { row: 'attempt', event: 'measured', session: 'B', refusals: [{ act: 'push', depth: '1', channel: 'claude.md' }] },
    ...Array.from({ length: REFRESH_AT - 1 }, (_, i) => ({ row: 'refusal', id: `b${i}`, session: 'B', act: 'gh', depth: 1 })),
  ];
  assert.deepEqual(refusalCounts(rows), [
    { session: 'A', refusals: REFRESH_AT, refresh: true },
    { session: 'B', refusals: REFRESH_AT - 1, refresh: false },
  ]);
});

test('status prints REFRESH for a session with 10 refusals, from the tranche and this checkout, each row once', () => {
  const { root } = withOrigin({ 'README.md': 'x' });
  for (let i = 0; i < 6; i++) recordRefusal(root, { session: 'session_C', act: `act ${i}`, depth: 0 });
  recordRefusal(root, { session: 'session_D', act: 'gh', depth: 2 });
  commit(root, {}, 'refusal rows');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  // Four more recorded here and not yet on the tranche, two of them alike in the same second;
  // a measured row listing one of them again; a line that is not JSON.
  recordRefusal(root, { session: 'session_C', act: 'act 6', depth: 0 });
  recordRefusal(root, { session: 'session_C', act: 'act 7', depth: 0 });
  recordRefusal(root, { session: 'session_C', act: 'same', depth: 0 });
  recordRefusal(root, { session: 'session_C', act: 'same', depth: 0 });
  appendRow(root, 'alpha', { row: 'attempt', event: 'measured', session: 'session_C', refusals: [{ act: 'same', depth: '0', channel: 'claude.md' }] }, bobMetricsFile('alpha'));
  writeFileSync(join(root, REFUSALS_FILE), readFileSync(join(root, REFUSALS_FILE), 'utf8') + '<<<<<<< conflict\n');
  const out = [];
  const r = status(root, { offline: true, log: (m) => out.push(m) });
  assert.deepEqual(r.sessions.map((s) => [s.session, s.refusals, s.refresh]), [['session_C', 10, true], ['session_D', 1, false]]);
  assert.ok(out.some((l) => /^- session_C: 10; REFRESH/.test(l)), out.join('\n'));
  assert.ok(out.some((l) => l === '- session_D: 1'));
});

const moved = () => { throw new Fail('gh api -X PUT failed: gh: Base branch was modified. Review and try the merge again. (HTTP 405)'); };

test('mergeRetry: a moved base is fetched and tried again, at most 3 times in all', () => {
  let calls = 0;
  const seen = [];
  const r = mergeRetry(() => (++calls < 3 ? moved() : { merged: true, sha: 'm' }), { wait: 0, log: quiet, fetch: () => seen.push('fetch'), check: () => seen.push('check') });
  assert.deepEqual([r.merged, calls], [true, 3]);
  assert.deepEqual(seen, ['fetch', 'check', 'fetch', 'check']);
  // A refusal returned rather than thrown counts the same.
  let n = 0;
  assert.equal(mergeRetry(() => (++n === 1 ? { merged: false, message: 'Base branch was modified' } : { merged: true }), { wait: 0, log: quiet }).merged, true);
  // Three moved bases stop it.
  calls = 0;
  assert.throws(() => mergeRetry(() => { calls++; return moved(); }, { wait: 0, log: quiet }), /refused the merge 3 times/);
  assert.equal(calls, 3);
});

test('mergeRetry: any other refusal stops at once, and a changed pull request stops the retry', () => {
  let calls = 0;
  assert.throws(() => mergeRetry(() => { calls++; throw new Fail('gh api -X PUT failed: Head branch was modified (HTTP 409)'); }, { wait: 0, log: quiet }), /Head branch was modified/);
  assert.equal(calls, 1);
  assert.equal(mergeRetry(() => ({ merged: false, message: 'Pull Request is not mergeable' }), { wait: 0, log: quiet }).merged, false);
  calls = 0;
  assert.throws(() => mergeRetry(() => { calls++; return moved(); }, { wait: 0, log: quiet, check: () => { throw new Fail('pull request 4 changed while its base moved; run merge again'); } }), /changed while its base moved/);
  assert.equal(calls, 1);
});

const unread = () => { throw new Fail('gh api -X PUT failed: unexpected end of JSON input'); };
const H40 = 'a'.repeat(40);

test('mergeRetry: an unreadable reply reads the pull request back; merged with this head succeeds (4 Nov)', () => {
  let calls = 0;
  const r = mergeRetry(() => { calls++; return unread(); }, { wait: 0, log: quiet, reread: { read: () => ({ state: 'closed', merged: true, merge_commit_sha: 'm'.repeat(40), head: { sha: H40 } }), sha: H40 } });
  assert.deepEqual([r.merged, r.sha, calls], [true, 'm'.repeat(40), 1]);
  // An empty reply (gh exits 0 with nothing) is the same case.
  assert.equal(mergeRetry(() => null, { wait: 0, log: quiet, reread: { read: () => ({ state: 'closed', merged: true, merge_commit_sha: 'm', head: { sha: H40 } }), sha: H40 } }).merged, true);
});

test('mergeRetry: an unreadable reply with the pull request open at the same head tries the PUT once more, only once', () => {
  let calls = 0;
  const open = { read: () => ({ state: 'open', merged: false, head: { sha: H40 } }), sha: H40 };
  const r = mergeRetry(() => (++calls === 1 ? unread() : { merged: true, sha: 'm' }), { wait: 0, log: quiet, reread: open });
  assert.deepEqual([r.merged, calls], [true, 2]);
  calls = 0;
  assert.throws(() => mergeRetry(() => { calls++; return unread(); }, { wait: 0, log: quiet, reread: open }), /could not be read.*after one more try/);
  assert.equal(calls, 2);
  // A head that moved, or a merge at another head, stops at once.
  calls = 0;
  assert.throws(() => mergeRetry(() => { calls++; return unread(); }, { wait: 0, log: quiet, reread: { read: () => ({ state: 'open', head: { sha: 'b'.repeat(40) } }), sha: H40 } }), /at another head/);
  assert.throws(() => mergeRetry(unread, { wait: 0, log: quiet, reread: { read: () => ({ state: 'closed', merged: true, head: { sha: 'b'.repeat(40) } }), sha: H40 } }), /merged at another head/);
  assert.equal(calls, 1);
  // The once-more try runs the moved-base checks first: a base that moved meanwhile stops it.
  calls = 0;
  const seen = [];
  assert.throws(() => mergeRetry(() => { calls++; return unread(); }, { wait: 0, log: quiet, reread: open, fetch: () => seen.push('fetch'), check: () => { seen.push('check'); throw new Fail('main moved past the merged result the gate checked; run merge again'); } }), /moved past/);
  assert.deepEqual([calls, seen], [1, ['fetch', 'check']]);
  // A refusal GitHub stated is not unreadable; without reread the error stands as before.
  assert.equal(unreadable('gh api -X PUT failed: gh: Pull Request is not mergeable (HTTP 405)'), false);
  assert.equal(unreadable('gh api -X PUT failed: {"message":"x"}'), false);
  assert.equal(unreadable('gh api -X PUT failed: '), true);
  assert.throws(() => mergeRetry(unread, { wait: 0, log: quiet }), /unexpected end of JSON input/);
});

test('merge --plain retries a moved base and merges the same head; a head that moved meanwhile stops it', () => {
  const root = makeRepo({ 'README.md': 'x', '.github/workflows/ci.yml': 'on: pull_request\n' });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'bob/pin', 'tranche'], { cwd: root });
  const sha = commit(root, { 'pin.txt': 'moved' });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche', 'bob/pin'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const make = (headAfter) => {
    const calls = { tries: 0, merged: null, reads: 0 };
    return {
      calls,
      io: {
        getPR: () => { calls.reads++; return { state: 'open', draft: false, base: { ref: 'tranche', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: 'bob/pin', sha: calls.tries > 0 && headAfter ? headAfter : sha, repo: { full_name: 'o/r' } } }; },
        requiredChecks: () => ({ checks: [{ context: 'gate' }] }),
        checkRuns: () => [{ id: 1, status: 'completed', conclusion: 'success', started_at: '2026-11-02T10:00:00Z' }],
        repo: { released: () => false, shim: () => null, descends: () => false },
        mergePR: (slug, n, s) => { calls.tries++; if (calls.tries === 1) moved(); calls.merged = s; return { merged: true, sha: 'm'.repeat(40) }; },
      },
    };
  };
  const ok = make();
  const out = mergePlain(root, 4, { slug: 'o/r', log: quiet, wait: 0, io: ok.io, reviewed: 'two fresh reviews', rounds: 1 });
  assert.deepEqual([out.merged, ok.calls.tries, ok.calls.merged], [true, 2, sha]);
  const bad = make('f'.repeat(40));
  assert.throws(() => mergePlain(root, 4, { slug: 'o/r', log: quiet, wait: 0, io: bad.io, reviewed: 'two fresh reviews', rounds: 1 }), /changed while its base moved/);
  assert.equal(bad.calls.tries, 1);
});

test('pushRetry: a fetch-first rejection fetches, merges (never forced) and pushes again', () => {
  const { root, bare } = withOrigin({ 'README.md': 'x' });
  const other = clone(bare);
  const theirs = commit(other, { 'theirs.txt': 'x' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: other });
  const ours = commit(root, { 'ours.txt': 'y' });
  const logs = [];
  const tip = pushRetry(root, 'tranche', { wait: 0, log: (m) => logs.push(m) });
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/tranche'], { cwd: root }).split('\t')[0], tip);
  for (const c of [theirs, ours]) assert.equal(git(['merge-base', '--is-ancestor', c, tip], { cwd: root, allowFail: true }).code, 0, 'both sides kept');
  assert.equal(logs.length, 1);
  assert.match(logs[0], /moved on origin; fetching and trying again \(2 of 5\)/);
});

test('pushRetry: a conflict stops it with nothing pushed; another rejection stops at once', () => {
  const { root, bare } = withOrigin({ 'README.md': 'x' });
  const other = clone(bare);
  const theirs = commit(other, { 'README.md': 'theirs' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: other });
  const ours = commit(root, { 'README.md': 'ours' });
  assert.throws(() => pushRetry(root, 'tranche', { wait: 0, log: quiet }), /does not merge cleanly; nothing was pushed/);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/tranche'], { cwd: root }).split('\t')[0], theirs);
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), ours, 'the merge was aborted');
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '');
  // A non-fast-forward the local side already knows of is a moved ref too: it merges, and conflicts.
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.throws(() => pushRetry(root, 'tranche', { wait: 0, log: quiet }), /does not merge cleanly; nothing was pushed/);
});

// A push that fails the given ways first (calling before() each time, to move origin as another
// writer would), then pushes for real.
const flaky = (root, branch, failures, before = () => {}) => {
  let n = 0;
  return () => {
    if (n < failures.length) { before(n); return { code: 1, stderr: failures[n++] }; }
    n++;
    return git(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { cwd: root, allowFail: true });
  };
};
const LOCK = (b) => `remote: error: cannot lock ref 'refs/heads/${b}': is at 41bd0831f370 but expected 61e852893eab\nTo origin\n ! [remote rejected] HEAD -> ${b} (failed to update ref)\nerror: failed to push some refs`;
const E500 = 'remote: Internal Server Error\nfatal: unable to access \'https://github.com/o/r/\': The requested URL returned error: 500';
const tipOf = (root, b) => git(['ls-remote', 'origin', `refs/heads/${b}`], { cwd: root }).split('\t')[0];

test('pushRetry: a cannot-lock-ref rejection redoes the change on the moved tip and pushes', () => {
  const { root, bare } = withOrigin({ 'README.md': 'x' });
  const other = clone(bare);
  const rows = () => readFileSync(join(root, 'log.jsonl'), 'utf8');
  const make = () => { writeFileSync(join(root, 'log.jsonl'), (existsSync(join(root, 'log.jsonl')) ? rows() : '') + 'ours\n'); git(['add', '-A'], { cwd: root }); git(['commit', '-q', '-m', 'ours'], { cwd: root }); };
  make();
  const push = flaky(root, 'tranche', [LOCK('tranche')], () => { commit(other, { 'log.jsonl': 'theirs\n' }); git(['push', '-q', 'origin', 'tranche'], { cwd: other }); });
  const logs = [];
  const tip = pushRetry(root, 'tranche', { wait: 0, log: (m) => logs.push(m), redo: make, push });
  assert.equal(tipOf(root, 'tranche'), tip);
  assert.equal(git(['show', `${tip}:log.jsonl`], { cwd: root }), 'theirs\nours', 'redone on their row, not merged');
  assert.match(logs[0], /tranche moved on origin; fetching and trying again \(2 of 5\)/);
});

test('pushRetry: a 500 then success pushes; a 500 whose push landed is not pushed twice', () => {
  const { root } = withOrigin({ 'README.md': 'x' });
  const ours = commit(root, { 'a.txt': 'a' });
  const logs = [];
  assert.equal(pushRetry(root, 'tranche', { wait: 0, log: (m) => logs.push(m), push: flaky(root, 'tranche', [E500, E500]) }), ours);
  assert.equal(tipOf(root, 'tranche'), ours);
  assert.match(logs[0], /server error; fetching and trying again \(2 of 5\)/);
  assert.equal(logs.length, 2);
  // The 500 came back but the push landed: the fetched tip holds HEAD, so nothing is redone.
  const landed = commit(root, { 'b.txt': 'b' });
  let redone = 0;
  const push = flaky(root, 'tranche', [E500], () => git(['push', '-q', 'origin', 'HEAD:refs/heads/tranche'], { cwd: root }));
  assert.equal(pushRetry(root, 'tranche', { wait: 0, log: quiet, push, redo: () => { redone++; } }), landed);
  assert.equal(redone, 0);
  // Landed, then another writer pushed on top: ours is returned, not theirs.
  const { root: r2, bare } = withOrigin({ 'README.md': 'x' });
  const other = clone(bare);
  const mine = commit(r2, { 'c.txt': 'c' });
  const p2 = flaky(r2, 'tranche', [E500], () => {
    git(['push', '-q', 'origin', 'HEAD:refs/heads/tranche'], { cwd: r2 });
    git(['pull', '-q', '--ff-only', 'origin', 'tranche'], { cwd: other });
    commit(other, { 'd.txt': 'd' });
