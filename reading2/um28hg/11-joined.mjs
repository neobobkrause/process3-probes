// ===== file: tranche.mjs (continued) =====

// required reviewer, a workflow of the product's own. process/config.json names each workflow as
// installer_update and site_update ({ "workflow": "<file in .github/workflows>" }); one not named is a
// gap, reported, never a deploy step the tool invents. No session touches the installer worker or
// the site itself.
export const END_ACTS = [
  { key: 'installer_update', what: (v) => `the installer update for release ${v}` },
  { key: 'site_update', what: (v) => `the product website's update to refer to the new install of ${v}` },
];
export function endActs(cfg, version, slug, branch) {
  const [owner, repo] = slug.split('/');
  const steps = [];
  const gaps = [];
  for (const a of END_ACTS) {
    const wf = cfg[a.key]?.workflow;
    if (typeof wf === 'string' && /^[\w.-]+\.ya?ml$/.test(wf)) steps.push(`${a.what(version)}, on Bob's approval: the GitHub connector's actions_run_trigger: run_workflow, workflow_id ${wf}, owner ${owner}, repo ${repo}, ref ${branch}, inputs {"version":"${version}"}; it waits in the protected environment that names Bob as required reviewer`);
    else {
      gaps.push(`${a.key}: no workflow in ${slug} runs ${a.what(version)} (process/config.json names none)`);
      steps.push(`${a.what(version)}, on Bob's approval: GAP, no workflow runs it yet (process/config.json ${a.key} names none); bring it to Bob through the coordinator, and the close waits on his word`);
    }
  }
  return { steps, gaps };
}

// The end of the rounds and the release (BD-R1), refused in order: no round open; a clean internal
// walk; a release cut after it; a clean walk of that release, installed on a p3dev- deployment.
// Then the installer and site updates, named in order. Without an internal walk configured, the
// walk the deploy row records stands for it; without a release block, the tranche cuts no release.
export function trancheEnd(root, cfg, t, { plan, slug, read }) {
  const w = walkFindings(root, cfg, t, { slug, read });
  if (!w.last) fail(`the last round's walk is owed before the tranche closes: ${roundAct(cfg)} (${roundWhat(cfg)})`);
  const hold = walkHold(w);
  if (hold) fail(`tranche close waits: ${hold}`);
  // The plan's close (PLN-5, your word) ends the tranche where it stands: the latest run's findings
  // recorded, as before; the rounds and the release are not owed.
  if (plan === 'close') return { steps: [], gaps: [], release: null };
  const rs = roundsAt(root, cfg, t, w);
  // A round open, owed, or merged since the latest walk (its fixes not yet walked): the rounds go on.
  if (['layer', 'next', 'new', 'walk'].includes(rs.state)) fail(`tranche close waits: ${roundLine(rs)} (BD-R1: rounds repeat until an internal walk finds no flaw)`);
  // A finding no module owns is a flaw no round can place: BOB names its module first.
  const loose = unplaced(root, t);
  if (loose.length) fail(`tranche close waits: ${loose.map((f) => f.id).join(', ')} in the found file of no module: BOB names its module (\`${P3} found <module> "<finding>" --from "<source>"\`), and the next round fixes it`);
  // 1. A clean internal walk: the latest round-close run's.
  // Exempt by Bob's word (deploycfg internalWalkOf), or not configured: the run's own walk stands for it.
  const iw = internalRequired(cfg, w.last);
  const clean = runPassed(cfg, w);
  if (!clean) fail(`tranche close waits: the latest ${iw ? 'internal walk' : 'walk'} (${runSource(w.last)}) is not clean (${iw ? `${w.last.internal_walk ? `ok ${w.last.internal_walk.ok}, ${Number(w.last.internal_walk.failures) || 0} failure(s)` : 'it did not run'}` : `ok ${w.last.ok}, ${Number(w.last.walk?.failures) || 0} failure(s)`}); its findings open the next round, and the rounds repeat until one is clean (BD-R1)`);
  if (!cfg.release) return { steps: [], gaps: [], release: null };
  // 2. The release deployment: a development release cut after that walk.
  const rel = releasesCut(root, cfg, w.last);
  if (!rel) fail(`tranche close waits: no development release since the clean internal walk ${runSource(w.last)}: ${P3} release dev, then the release deployment and its walk (BD-R1)`);
  // 3. The walk of the release: of that release installed on a p3dev- deployment.
  const rw = releaseWalks(root, cfg).filter((r) => r.version === rel.version).at(-1);
  if (!rw) fail(`tranche close waits: the release deployment of ${rel.version} and its walk are owed: ${P3} deploy release ${rel.version}; GAP: no path yet installs the cut, signed release onto a p3dev- deployment (no row in ${RELEASE_WALKS_FILE}; ${RELEASE_PATH_GAP}), brought to Bob through the coordinator`);
  if (!(rw.ok === true && !(Number(rw.failures) > 0))) fail(`tranche close waits: the walk of release ${rel.version} found ${Number(rw.failures) || 1} flaw(s); recorded as found marks, they open the next round (BD-R1)`);
  // BD-R5 (Bob, 9 Nov): a release walk clean with no AI account configured is clean for the non-AI
  // journeys only; the installer and site updates wait for a release walk with AI on, clean too.
  const aiWalk = releaseWalks(root, cfg).filter((r) => r.version === rel.version && r.ai === true).at(-1);
  if (rw.ai !== true && !(aiWalk && aiWalk.ok === true && !(Number(aiWalk.failures) > 0))) fail(`tranche close waits: the walk of release ${rel.version} is clean on the non-AI journeys only (no AI account configured${rw.not_walked?.length ? `; not walked: ${rw.not_walked.join(', ')}` : ''}); the installer and site updates wait until a release walk with AI on is clean too: Bob configures the AI account, walk.ai is set true, and the release is walked again (BD-R5)`);
  // 4 and 5. The installer, then the site: each on Bob's approval, named in order.
  const e = endActs(cfg, rel.version, slug, cfg.tranche);
  return { ...e, release: rel.version };
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
