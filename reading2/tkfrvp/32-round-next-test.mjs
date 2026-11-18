// C46 (Bob, 9 Nov: "Let's fix as many of them as we can", the causes of slow progress): round next
// opens a round, and carries it on, with one command. On 8-9 Nov BOB opened round 2 by hand, a turn
// a step (each found, status, layer open, layer jobs, each job start), and one step hid a cycle (C44).
import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { walkRound } from '../lib/deploy.mjs';
import { layerArg } from '../p3.mjs';
import { flowRows, writeRows } from '../lib/layerflow.mjs';
import { owedReopens } from '../lib/rounds.mjs';
import { oneLine, parseFindings, roundNext, walkEntries, withFile } from '../lib/roundnext.mjs';
import { fetchState, writeState } from '../lib/state.mjs';
import { Fail, git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const SB = 'process-state';
const req = (id) => `# ${id}\n\n## Public\n\n### Provides\n\n- ${id}()\n\n**R1** a\n**R2** b\n**R3** c\n`;
const LAYERS = '| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a, b |\n| 2 | Two | c |\n| 3 | Three | d |\n';
const at = (min) => new Date(Date.UTC(2026, 10, 9, 12, min)).toISOString();

// Three map layers, every module COMPLETE with no unmet mark (round 1 behind); d's test pins the ids
// of its requirement file (its findings are owed reopens, C44); b's does not (found marks).
function product() {
  const files = { 'process/config.json': { merge_strategy: 'layer' }, 'build/layers.md': LAYERS };
  for (const id of ['a', 'b', 'c', 'd']) {
    files[`process/ledger/${id}.json`] = entry(id, { status: { state: 'COMPLETE' } });
    files[`req/${id}.md`] = req(id);
    files[`src/${id}/index.mjs`] = `export const ${id} = 1;\n`;
    files[`test/${id}/t.test.mjs`] = "import test from 'node:test'; test('ok', () => {});\n";
  }
  files['test/d/ids.test.mjs'] = 'const IDS = ["R1", "R2", "R3"]; // the ids of req/d.md\n';
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'origin.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  // The tranche past main: a walk at a commit on main is an earlier tranche's.
  commit(root, { 'notes.md': 'the tranche\n' }, 'the tranche');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return root;
}
const push = (root, files, msg = 'x') => { git(['checkout', '-q', 'tranche'], { cwd: root }); git(['merge', '-q', '--ff-only', 'origin/tranche'], { cwd: root }); commit(root, files, msg); git(['push', '-q', 'origin', 'tranche'], { cwd: root }); git(['fetch', '-q', 'origin'], { cwd: root }); };

// A round walk's row and its stored report, as walk round writes them (deploy.mjs walkRound).
let walks = 0;
function walked(root, { failures = [], min, live = null, row = 'round-walk' }) {
  const slug = `internal-w${++walks}`;
  const commitSha = git(['rev-parse', 'origin/tranche'], { cwd: root });
  const stored = `walks/round/${slug}/report.json`;
  const inner = { steps: 10, steps_ok: 10 - failures.length, failures: failures.length, ok: !failures.length, exit: failures.length ? 1 : 0, reports: [{ from: 'out/report.json', stored }] };
  const r = row === 'round-walk'
    ? { row, tranche: 'tranche', slug, commit: commitSha, ok: true, stopped: null, internal_walk: inner, at: at(min) }
    : { row, tranche: 'tranche', slug, commit: commitSha, ok: !live, stopped: live ? 'walk' : null, walk: { failures: live || 0, reports: [{ from: 'out/live.json', stored: `walks/round/${slug}/live.json` }] }, internal_walk: inner, at: at(min) };
  writeState(root, SB, 'walk row', (w) => {
    mkdirSync(join(w, 'deploys'), { recursive: true });
    appendFileSync(join(w, 'deploys', 'dev.jsonl'), JSON.stringify(r) + '\n');
    mkdirSync(join(w, 'walks', 'round', slug), { recursive: true });
    writeFileSync(join(w, stored), JSON.stringify({ steps: [], failures }));
    if (live) writeFileSync(join(w, 'walks', 'round', slug, 'live.json'), JSON.stringify({ steps: [], failures: Array.from({ length: live }, () => ({ module: 'a', kind: 'live', message: 'the live arm' })) }));
  });
  fetchState(root, SB, { fresh: true });
  return r;
}
const merged = (root, n, min) => { writeRows(root, SB, `merged ${n}`, [[`layerflow/${n}/merged.json`, { row: 'merged', layer: n, commit: 'f'.repeat(40), at: at(min) }]]); fetchState(root, SB, { fresh: true }); };

// GitHub, stood in: the open pull requests, a create that records one, and the merge tool's plain
// merge as a fast-forward of the tranche to the pull request's branch.
function gh(root, { failMerge = 0, failCreate = 0, conflicted = new Set() } = {}) {
  const prs = [];
  const made = [];
  const closed = [];
  let n = 100;
  let fails = failMerge;
  let createFails = failCreate;
  const io = {
    slug: 'o/p',
    comments: () => [],
    openPRs: () => prs.map((p) => ({ number: p.number, head: { ref: p.head } })),
    getPR: (slug, num) => ({ number: num, mergeable: !conflicted.has(num) }),
    closePR: (slug, num) => { const p = prs.find((x) => x.number === num); prs.splice(prs.indexOf(p), 1); closed.push(num); },
    createPR: (slug, pr) => { if (createFails > 0) { createFails--; throw new Fail('GitHub did not return a pull request'); } const p = { number: ++n, ...pr }; prs.push(p); made.push(p); return { number: p.number }; },
    mergePlain: (r, num, opts) => {
      assert.match(opts.noReview, /found marks only, no code/);
      if (fails > 0) { fails--; throw new Fail('the gate did not finish in time'); }
      const p = prs.find((x) => x.number === num);
      git(['fetch', '-q', 'origin', `+refs/heads/${p.head}:refs/remotes/origin/${p.head}`], { cwd: root });
      git(['push', '-q', 'origin', `refs/remotes/origin/${p.head}:refs/heads/tranche`], { cwd: root });
      git(['fetch', '-q', 'origin'], { cwd: root });
      prs.splice(prs.indexOf(p), 1);
      return { ok: true };
    },
  };
  return { io, prs, made, closed, conflicted };
}
const run = (root, io, opts = {}) => { const out = []; const r = roundNext(root, { io, log: (l) => out.push(String(l)), ...opts }); return { ...r, text: out.join('\n') }; };
const reqAt = (root, id) => git(['show', `origin/tranche:req/${id}.md`], { cwd: root });

// The walk's findings: b (map layer 1) two failures of one flaw and one of another; d (map layer 3,
// its ids pinned) three of one flaw.
const FLAWS = [
  { module: 'b', kind: 'layout', journey: 'j1', message: 'the b button overlaps the footer' },
  { module: 'b', kind: 'layout', journey: 'j2', message: 'the b button overlaps the footer on narrow screens' },
  { module: 'b', kind: 'http-500', detail: 'GET /b returned 500' },
  { module: 'd', kind: 'step', message: 'the d form loses its draft' },
  { module: 'd', kind: 'step', message: 'the d form loses its draft' },
  { module: 'd', kind: 'step', message: 'the d form loses its draft' },
];

test('round next: the findings grouped one entry per distinct flaw, with covers; BOB\'s file over them', () => {
  const e = walkEntries(FLAWS);
  assert.deepEqual(e, [
    { module: 'b', text: 'the b button overlaps the footer', covers: 2 },
    { module: 'b', text: 'http-500: GET /b returned 500', covers: 1 },
    { module: 'd', text: 'the d form loses its draft', covers: 3 },
  ]);
  assert.deepEqual(walkEntries([null, { kind: 'x', message: 'a **R1** b\nnot yet met' }]), [{ module: null, text: 'a walk failure', covers: 1 }, { module: null, text: 'a R1 b not met', covers: 1 }]);
  const lines = parseFindings('# b, as Bob reads it\nb: the footer is laid over the b button\n\nc: c is slow, covers 4\n');
  assert.deepEqual(lines.map((l) => [l.module, l.text, l.covers]), [['b', 'the footer is laid over the b button', null], ['c', 'c is slow', 4]]);
  // b's two entries (3 failures) are one line, which takes all 3; d keeps the walk's; c is added.
  assert.deepEqual(withFile(e, lines).map((x) => [x.module, x.text, x.covers]), [['d', 'the d form loses its draft', 3], ['b', 'the footer is laid over the b button', 3], ['c', 'c is slow', 4]]);
  // One module's flaws of the same words are one finding (found keys them alike); words cut clean.
  assert.deepEqual(walkEntries([{ module: 'b', kind: 'k1', message: 'timeout' }, { module: 'b', kind: 'k2', message: 'timeout' }]), [{ module: 'b', text: 'timeout', covers: 2 }]);
  assert.equal(oneLine(`${'x'.repeat(199)} y`), 'x'.repeat(199));
  assert.equal(oneLine('not  yet\u00a0met'), 'not met');
  assert.throws(() => parseFindings('b the text\n'), /--findings line 1: `<module>: <text>`/);
  assert.throws(() => parseFindings('b: a **F2** mark\n'), /must not hold a mark of its own/);
});

test('round next (PD-24): a walk with flaws in two map layers opens one layer for both and prints every job start at once; once it merges the round\'s walk is next', () => {
  const root = product();
  const row = walked(root, { failures: FLAWS, min: 10 });
  const src = `internal walk ${row.slug} ${row.commit.slice(0, 10)}`;
  const { io, made } = gh(root);
  // The dry run: the findings by module, their routes, the layer that opens; nothing written.
  const before = git(['rev-parse', 'origin/tranche'], { cwd: root });
  const d = run(root, io);
  assert.equal(d.state, 'dry');
  assert.match(d.text, /round 1 ended at the internal walk internal-w\d+ \w{10}: 6 finding\(s\), 0 recorded \(dry run: `round next --apply` does it\)/);
  assert.match(d.text, /b \(layer 1\):\n {4}- to record, found mark in req\/b\.md: the b button overlaps the footer \(covers 2\)\n {6}node \.process\/tool\/p3\.mjs found b "the b button overlaps the footer" --from "internal walk internal-w\d+ \w{10}" --covers 2\n {4}- to record, found mark in req\/b\.md: http-500: GET \/b returned 500/);
  assert.match(d.text, /d \(layer 3\):\n {4}- to record, owed reopen \(test\/d\/ids\.test\.mjs pins its ids\): the d form loses its draft \(covers 3\)/);
  assert.match(d.text, /then: tranche tranche · round 2 · layer 3 \(internal layer 4\) opens for b, d, one layer for every flawed module \(PD-24\)/);
  assert.equal(git(['rev-parse', 'origin/tranche'], { cwd: root }), before);
  assert.equal(owedReopens(root, loadConfig(root)).length, 0);
  assert.equal(made.length, 0);
  // --apply: d's owed reopen on the state branch, b's two marks in one plain pull request merged,
  // layer 4 (round 2's one layer) opened for b and d, and both job starts printed.
  const a = run(root, io, { apply: true });
  assert.equal(a.state, 'opened');
  assert.equal(a.layer, 4);
  assert.equal(made.length, 1);
  assert.match(made[0].head, /^found\/round-2-internal-w\d+$/);
  assert.match(reqAt(root, 'b'), /- \*\*F1\*\* \*\(not yet met: internal walk internal-w\d+ \w{10}, covers 2\)\* the b button overlaps the footer\n- \*\*F2\*\* \*\(not yet met: internal walk internal-w\d+ \w{10}\)\* http-500: GET \/b returned 500$/);

// Note for jobs, in force until withdrawn: every file the job writes begins with this exact first
// line: `# ref Q5Y-4130`.

  assert.deepEqual(owedReopens(root, loadConfig(root)).map((x) => [x.module, x.finding, x.source]), [['d', 'the d form loses its draft', `${src}, covers 3`]]);
  assert.deepEqual(flowRows(root, SB, 4).open.round.mods, ['b', 'd']);
  assert.deepEqual(a.startable.map((x) => x.cmd).sort(), [`node .process/tool/p3.mjs job start b --sessions <file> --reopen "F1: the b button overlaps the footer (${src}, covers 2); F2: http-500: GET /b returned 500 (${src})"`, `node .process/tool/p3.mjs job start d --sessions <file> --reopen "O1: the d form loses its draft (${src}, covers 3; owed reopen: add it as your own F mark and admit it in test/d/ids.test.mjs)"`]);
  assert.match(a.text, /\n {2}node \.process\/tool\/p3\.mjs job start b --sessions <file> --reopen "F1: the b button overlaps the footer/, 'the job start printed');
  assert.match(a.text, /\n {2}node \.process\/tool\/p3\.mjs job start d --sessions <file> --reopen "O1: the d form loses its draft/, 'd starts at once, in the same layer');
