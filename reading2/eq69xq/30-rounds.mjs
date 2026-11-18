// Rounds (BD-R1, Bob, 8 Nov): "Once a walk completes, that ends the current round, and a new round
// (of the same tranche) is started to work (layer by layer) to fix to those modules that have been
// identified as having flaws. This successive set of rounds continues until an internal walk
// doesn't find flaws, the release deployment happens, and the walk of the release also doesn't
// identify flaws."
//
// Round 1 is the map's layers (and the completion layer the copy opened under PD-12: "Finish, then
// switch"). A walk's findings enter as found marks against named modules (PLN-3, found.mjs). A later
// round is one round layer past the map (layerbase.mjs; PD-24, 9 Nov): every flawed module, whatever
// its map layer, read at its open; a mark found mid-round waits for the next round. A round ends at its walk: every layer it
// opened merged, no flawed module in a map layer after its last one, and a walk recorded after its
// last merge. That walk is the internal walk alone where the product configures one (C43; Bob, 8 Nov:
// "the internal walk would be the last step of a round, but the live walk would only run once a
// round completed without any flaws identified in the internal walk"), deploy dev's deploy and walk
// where it does not. A new round opens from that walk once its findings are recorded; a clean one
// leads to the release path (releaseNext): the cut, signed release, its deployment and its live walk.
import { NO_MODULE, REOPENS_DIR, coversOf, foundFile, foundMarks, FOUND_DIR } from './found.mjs';
import { completionItems } from './completion.mjs';
import { entryFile, ledgerIds, readLedgerTexts } from './ledger.mjs';
import { layerOf, layersAt, roundLayerName, roundOf } from './layerbase.mjs';
import { internalWalkOf } from './deploycfg.mjs';
import { jsonl, readState } from './state.mjs';
import { exists, git } from './util.mjs';

export const DEPLOYS_FILE = 'deploys/dev.jsonl';
// A release walk's rows: the walk of a cut development release installed on a p3dev- deployment.
// No path writes them yet (C39 gap: no install of the cut, signed release onto a p3dev- deployment
// exists); tranche close reads them, and names `deploy release <version>` until one is recorded.
export const RELEASE_WALKS_FILE = 'deploys/release.jsonl';
// The development releases cut (release dev --record's rows; release.mjs re-exports it).
export const RELEASES_FILE = 'releases/dev.jsonl';
// The rows a round's walk writes in DEPLOYS_FILE (C43, BD-R1): `round-walk`, the internal walk only,
// where the product configures one; `dev-deploy`, deploy dev's deploy and its walk, where it does not
// (Bob's exemption, or none set). Either ends a round; each has its start marker.
export const WALK_ROWS = ['round-walk', 'dev-deploy'];
export const START_ROWS = ['round-walk-start', 'dev-deploy-start'];
// The release path's gap (deploy.mjs deployRelease names it; status and tranche close print it).
export const RELEASE_PATH_GAP = 'no path yet installs the cut, signed release artifact onto a p3dev- deployment through the release\'s own installer path (process-dev-release cuts the draft release only; the product has no release-tier install-from-scratch or upgrade fixture; the installer installs only by an interactive sign-in)';
const P3 = 'node .process/tool/p3.mjs';

const textAt = (root, ref, f) => (exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null);
const hasCommit = (root, c) => git(['cat-file', '-e', `${c}^{commit}`], { cwd: root, allowFail: true }).code === 0;
const onMain = (root, c) => !!c && hasCommit(root, c) && git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/main'], { cwd: root, allowFail: true }).code === 0
  && git(['merge-base', '--is-ancestor', c, 'refs/remotes/origin/main'], { cwd: root, allowFail: true }).code === 0;

// This tranche's owed reopens (found.mjs REOPENS_DIR, C44): the findings recorded on the state
// branch for a module whose test pins its requirement ids, each until a round layer holds it.
export function owedReopens(root, cfg) {
  if (!root || !cfg?.state_branch) return [];
  const r = git(['ls-tree', '-r', '--name-only', '-z', `refs/remotes/origin/${cfg.state_branch}`, '--', `${REOPENS_DIR}/`], { cwd: root, allowFail: true });
  const files = r.code === 0 ? r.stdout.split('\0').filter((f) => f.endsWith('.json')) : [];
  return files.flatMap((f) => { try { const x = JSON.parse(readState(root, cfg.state_branch, f)); return x?.row === 'reopen' && x.module && x.key && (!x.tranche || !cfg.tranche || x.tranche === cfg.tranche) ? [x] : []; } catch { return []; } })
    .sort((a, b) => String(a.at).localeCompare(String(b.at)) || String(a.key).localeCompare(String(b.key)));
}
// The keys of the owed reopens a round layer holds already (its open row's items): its job's task.
export const heldReopens = (layers) => new Set((layers || []).flatMap((L) => (L.round?.items || []).map((x) => x.owe).filter(Boolean)));

// The modules identified as having flaws at `ref`: each ledger module, not BLOCKED, with an unmet
// found mark in its requirement file or its found-work entry, or an owed reopen no round layer
// holds yet (C44). id -> [{ id: 'F<n>' | 'O<n>', module, what, owe? }].
export function flawedModules(root, cfg, ref, { layers = null } = {}) {
  const dir = cfg.requirements_dir.replace(/\/$/, '');
  const out = new Map();
  const reopens = owedReopens(root, cfg);
  const owedOf = (id) => reopens.filter((x) => x.module === id);
  let heldSet = null;
  const held = () => (heldSet ||= heldReopens(layers || (reopens.length ? layersAt(root, cfg, ref) : [])));
  for (const id of [...ledgerIds(root, ref)].sort()) {
    let e = null;
    try { e = JSON.parse(textAt(root, ref, entryFile(id)) || 'null'); } catch { e = null; }
    // A BLOCKED module is deferred in any layer: it would hold every round open (layerflow DONE).
    if (e?.status?.state === 'BLOCKED') continue;
    const req = typeof e?.requirements === 'string' ? e.requirements : `${dir}/${id}.md`;
    const marks = [...foundMarks(textAt(root, ref, req)), ...foundMarks(textAt(root, ref, foundFile(id)))];
    const items = marks.map((m) => ({ id: m.id, module: id, what: `${m.finding} (${m.source})` }));
    // Owed reopens, numbered O1.. per module in the order recorded (its held ones counted, so a
    // number is never reused within the tranche); one a round layer holds is that layer's job's.
    const owed = owedOf(id);
    owed.forEach((x, k) => { if (!held().has(x.key)) items.push({ id: `O${k + 1}`, module: id, what: `${x.finding} (${x.source}; owed reopen: add it as your own F mark and admit it in ${x.pin})`, owe: x.key }); });
    if (items.length) out.set(id, items);
  }
  return out;
}
// Findings no module owns yet: a round cannot place them until BOB names one.
export const unplaced = (root, ref) => foundMarks(textAt(root, ref, NO_MODULE));

// This tranche's round walks (WALK_ROWS: the round-close run's internal walk, or deploy dev's deploy
// and walk), not an earlier tranche's of the same name (its commit on main).
export function deployRowsOf(root, cfg) {
  return jsonl(readState(root, cfg.state_branch, DEPLOYS_FILE)).filter((r) => WALK_ROWS.includes(r.row) && r.tranche === cfg.tranche && !onMain(root, String(r.commit)));
}

// A run's findings and how many are recorded at `ref` (deploy.mjs walkFindings reads it): a failed
// run counts one at least, a walk its report's failures, the internal walk's the same; recorded are
// the unmet found marks whose source names the run (its slug and commit) and the completion items
// deferred naming it (known gaps).
export const runSource = (row) => `${row.slug} ${String(row.commit).slice(0, 10)}`;
// PD-16 (Bob, 8 Nov: "the live walk only runs once a round closes with no flaws found from the
// internal walk"): once the run's internal walk found flaws, its live arm's findings (a live arm run
// anyway, or stopped, as round 1's on p3dev-l12 was) hold no round; only the internal walk's count
// toward "each recorded" (set_aside: the live arm's, named in walkHold's message). A found mark or an
// owed reopen whose source says "covers <n>" counts as n findings (one flaw, many failures).
// round: a new round's open (layer open, the layer flow's view) is the only reader that sets the live
// arm aside; tranche close and release dev count every finding of the run, as before.
export function findingsOf(root, cfg, ref, last, { round = false } = {}) {
  if (!last) return { last, failing: 0, marks: 0, recorded: 0, set_aside: 0 };
  const iw = last.internal_walk;
  const inner = iw ? Math.max(iw.ok ? 0 : 1, Number(iw.failures) || 0) : 0;
  const live = Math.max(last.ok ? 0 : 1, Number(last.walk?.failures) || 0);
  const setAside = round && inner > 0 ? live : 0;
  const failing = inner + live - setAside;
  const tree = (d) => git(['ls-tree', '-r', '--name-only', ref, '--', d], { cwd: root, allowFail: true }).stdout.split('\n').filter((n) => n.endsWith('.md'));
  const reqs = Object.values(readLedgerTexts(root, ref)).flatMap((t) => { try { const r = JSON.parse(t).requirements; return typeof r === 'string' ? [r] : []; } catch { return []; } });
  const words = (t) => String(t).split(/[^a-z0-9-]+/);
  // With the live arm set aside, only what names the internal walk records its findings (a live-arm
  // mark would otherwise stand in for one: cold review of C44).
  // A round walk (C43) is its internal walk alone: the same, for its findings.
  const internal = setAside > 0 || (last.row === 'round-walk' && !!iw);
  const namesRun = (t) => { const w = words(t); return w.includes(last.slug) && w.includes(String(last.commit).slice(0, 10)); };
  const naming = (t) => namesRun(t) && (!internal || /\binternal walk\b/i.test(String(t)));
  let marks = 0;
  for (const f of new Set([...tree(cfg.requirements_dir.replace(/\/$/, '')), ...tree(FOUND_DIR), ...reqs])) {
    const r = git(['show', `${ref}:${f}`], { cwd: root, allowFail: true });
    if (r.code === 0) marks += foundMarks(r.stdout).filter((m) => naming(m.source)).reduce((a, m) => a + coversOf(m.source), 0);
  }
  // Owed reopens naming the run are recorded found work as marks are, held by a round layer or not.
  marks += owedReopens(root, cfg).filter((x) => naming(x.source)).reduce((a, x) => a + coversOf(x.source), 0);
  const gaps = (completionItems(root, cfg, ref)?.items || []).filter((x) => x.deferred && namesRun(x.what)).length; // a known gap is Bob's word, whichever walk it names
  return { last, failing, marks, recorded: marks + gaps, set_aside: setAside };
}
// The hold while a run's findings are not all recorded (tranche close, release dev, a new round's open).
const runName = (row) => (row.row === 'round-walk' ? 'internal walk' : 'deploy and walk');
// Whether a run's findings are recorded only by what names its internal walk: a round walk's (C43:
// the internal walk alone), or a deploy dev run's whose live arm is set aside (PD-16).
const internalOnly = (w) => !!w.set_aside || (w.last?.row === 'round-walk' && !!w.last.internal_walk);
export const walkHold = (w) => {
  if (!w.last || w.recorded >= w.failing) return null;
  const src = runSource(w.last);
  const aside = w.set_aside ? ` (the internal walk's; the live arm's ${w.set_aside} hold no round: its internal walk found flaws, PD-16)` : '';
  const from = internalOnly(w) || (w.last.internal_walk && !(w.last.internal_walk.ok === true && !(Number(w.last.internal_walk.failures) > 0))) ? `internal walk ${src}` : `walk ${src}`;
  return `the latest ${runName(w.last)} (${src}) ${w.last.ok ? 'walked' : `stopped at ${w.last.stopped}`} with ${w.failing} finding(s)${aside}, ${w.recorded} recorded: record each as a found mark (\`${P3} found <module> "<finding>" --from "${from}"\`, adding --covers <n> for one flaw behind n of them; a module whose test pins its requirement ids takes it as an owed reopen, recorded on the state branch by the same command), or a known gap (a completion item "deferred: <reason>" naming ${src}); the next round opens from them (BD-R1)`;
};

