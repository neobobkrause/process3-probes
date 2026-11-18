// ===== file: cap.mjs (continued) =====

  return { n: n + since.length, listed: n, since, working: u.working, free: u.free, resumed: u.resumed, cap, held };
}

// The job sessions a refusal counted, one line each, as the count read them: the session, its
// title and status, and whether it holds a slot (a published job with a gate not red holds none).
// One session per freed module is marked free, the newest (slotUse frees one slot per published
// job; cold review of C28: a job and its restart both live counted one free and two held). A
// session carried from an earlier read (readSessions' partial pages) says so.
export function countedLines(listed, u = { free: [], resumed: [] }) {
  const jobs = (listed || []).filter((x) => !isArchived(x)).map((x) => ({ x, id: String(x.title || '').trim().match(/^job (\S+)( \(restart\))?$/)?.[1] })).filter((j) => j.id);
  const t = (x) => Date.parse(x.updated_at || x.created_at) || 0;
  const freed = new Set(u.free.map((id) => jobs.filter((j) => j.id === id).sort((a, b) => t(b.x) - t(a.x))[0]?.x).filter(Boolean));
  return jobs.map(({ x, id }) => `- ${x.id || '?'} "${String(x.title).trim()}" ${x.session_status || x.status || '?'}${x.carried ? ' (carried from the last read: older than the pages read)' : ''}: ${freed.has(x) ? 'published, holds no slot (PD-7)' : u.resumed.includes(id) ? 'resumed on a red gate, holds a slot' : 'holds a slot'}`);
}
// The time a list_sessions result was read no earlier than: its newest session's created_at.
export const listedAt = (listed) => Math.max(0, ...(listed || []).map((x) => Date.parse(x.created_at) || 0));
// The modules whose job started after t: the start rows of the open layer and of the next (its
// early starts), a fresh-branch restart not (it replaces a session), as the idle check counts them.
export function startedSince(root, sb, view, t) {
  if (!view || !t) return [];
  const ids = (n) => (n !== undefined && n !== null ? flowRows(root, sb, n).starts.filter((r) => Date.parse(r.at) > t && !r.restart).map((r) => r.module) : []);
  return [...new Set([...ids(view.n), ...(view.early_next !== view.n ? ids(view.early_next) : [])])];
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
