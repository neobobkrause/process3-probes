// The consistency census and the preflight (R15; Bob, 6 Nov, about 18:15Z: "It seems to me that we
// keep hitting items when checks are refusing modules with no ledger entry. Can we anticipate those
// conditions arising so that we can handle them either preemptively or more efficiently when
// they're identified?"). Each gap surfaces before the act that would refuse, naming what BOB writes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commit, entry, makeRepo } from './helpers.mjs';
import { census, censusLines, changeGaps, openLayers, preflight, preflightLines } from '../lib/census.mjs';
import { validate } from '../lib/ledger.mjs';
import { configOf, git, loadConfig } from '../lib/util.mjs';
import { gapLines } from '../lib/status.mjs';
import { writeState } from '../lib/state.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const NOW = '2026-11-06T18:30:00Z';
const req = (id, unmet = true) => `# ${id}\n\n**R1** a requirement${unmet ? ' *(not yet met: T1)*' : ''}\n`;
const row = (id, layer, o = {}) => ({ id, layer, paths: [`bio-plane/src/${id}/`], tests: [`bio-plane/test/m/${id}/`], uses: [], ...o });
const SUITE = { cwd: 'bio-plane', command: ['node', '--test'] };
const ent = (id, layer, o = {}) => entry(id, { layer, paths: [`bio-plane/src/${id}/`, `build/requirements/${id}.md`], tests: [`bio-plane/test/m/${id}/`], requirements: `build/requirements/${id}.md`, suite: SUITE, reading: [`build/requirements/${id}.md`], ...o });

// A product shaped like the copy on 6 Nov: layers 1 to 4, layer 2 open.
//   done1       layer 1, entry, met: fine
//   old1        layer 1, no entry, all met: built before the ledger: a no-entry gap, its COMPLETE entry ready (C16)
//   owed1       layer 1, no entry, an unmet mark: no-entry, ready
//   a2, b2      layer 2 (open), entries
//   c3          layer 3, no entry, all met: no-entry, ready (lookahead: its layer is still to come)
//   d3          layer 3, no entry, a row with no paths: no-entry, not ready
//   e4          layer 4, a row and an entry naming a requirements file not there: entry-requirements
//   lost        a requirements file, no row: no-modules-row
//   loose       a row in no layer-map line: not-in-layer-map
//   skew        the row says layer 3, the map says 4: layer-mismatch
//   ux-design   the lane's module, a row, no entry: no-entry
//   bad         its entry names a requirements file that is not there: entry-requirements
function product() {
  const rows = [row('done1', 1), row('old1', 1), row('owed1', 1), row('a2', 2), row('b2', 2), row('c3', 3), row('d3', 3, { paths: [] }), row('e4', 4), row('loose', 2), row('skew', 3), row('ux-design', 4), row('bad', 4)];
  const files = {
    'process/config.json': { merge_strategy: 'layer', modules_file: 'build/modules.json', lanes: [{ name: 'ux', dir: 'docs/ux/', module: 'ux-design' }] },
    'build/modules.json': { modules: rows },
    'build/layers.md': '| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | done1, old1, owed1 |\n| 2 | Two | a2, b2 |\n| 3 | Three | c3, d3 |\n| 4 | Four | e4, skew, ux-design, bad |\n',
    'build/requirements/README.md': '# requirements\n',
    'build/situations/job.md': '# a job\n',
    'docs/ux/README.md': 'ux\n',
  };
  for (const id of ['done1', 'old1', 'owed1', 'a2', 'b2', 'c3', 'd3', 'lost', 'loose', 'skew', 'ux-design', 'bad']) files[`build/requirements/${id}.md`] = req(id, !['done1', 'old1', 'c3'].includes(id));
  for (const [id, n] of [['done1', 1], ['a2', 2], ['b2', 2], ['e4', 4], ['loose', 2], ['skew', 4]]) files[`process/ledger/${id}.json`] = ent(id, n);
  files['process/ledger/bad.json'] = ent('bad', 4, { requirements: 'build/requirements/missing.md' });
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-census-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return root;
}
const kinds = (c) => c.gaps.map((g) => `${g.id}:${g.kind}`).sort();

test('census: every gap kind, named with what BOB writes; a module with its entry that needs no job is no gap', () => {
  const root = product();
  const cfg = loadConfig(root);
  const c = census(root, cfg, { ref: 'origin/tranche', open: [2], now: NOW });
  assert.deepEqual(kinds(c), [
    'bad:entry-requirements', 'c3:no-entry', 'd3:no-entry', 'e4:entry-requirements', 'loose:not-in-layer-map', 'lost:no-modules-row',
    'old1:no-entry', 'owed1:no-entry', 'skew:layer-mismatch', 'ux-design:no-entry',
  ].sort());
  // C16: a module built before the ledger (no entry, its layer past, nothing unmet) is flagged.
  // Its paths and tests are not on the tranche: whether it was built is BOB's to say, no entry ready.
  const old0 = c.gaps.find((x) => x.id === 'old1');
  assert.match(old0.fix, /write process\/ledger\/old1\.json recording it COMPLETE \(built before the ledger; .*\) \(not ready: bio-plane\/src\/old1\/, bio-plane\/test\/m\/old1\/ not on origin\/tranche: whether it was built is BOB's to say/);
  assert.equal(old0.content, undefined);
  // Once they are: its COMPLETE entry ready; done1, with its entry, is no gap.
  commit(root, { 'bio-plane/src/old1/index.mjs': 'x\n', 'bio-plane/test/m/old1/t.test.mjs': 'x\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const old = census(root, cfg, { ref: 'origin/tranche', open: [2], now: NOW }).gaps.find((x) => x.id === 'old1');
  assert.match(old.fix, /write process\/ledger\/old1\.json recording it COMPLETE \(built before the ledger; modules that use it wait for it as a provider until it has one\) \(ready below/);
  assert.equal(old.done, true);
  assert.deepEqual([old.content.status.state, old.content.layer, old.file], ['COMPLETE', 1, 'process/ledger/old1.json']);
  assert.ok(!c.gaps.some((x) => x.id === 'done1'));
  const g = (id, k) => c.gaps.find((x) => x.id === id && x.kind === k);
  assert.match(g('lost', 'no-modules-row').fix, /add lost's row to build\/modules\.json .*build\/requirements\/lost\.md/);
  assert.match(g('loose', 'not-in-layer-map').fix, /name loose on its layer's line in build\/layers\.md \(its modules row says layer 2\)/);
  assert.match(g('skew', 'layer-mismatch').fix, /build\/modules\.json says layer 3, build\/layers\.md says 4/);
  assert.match(g('bad', 'entry-requirements').fix, /names build\/requirements\/missing\.md/);
  assert.match(g('e4', 'entry-requirements').fix, /names build\/requirements\/e4\.md, which origin\/tranche does not hold: write it/);
  assert.match(g('owed1', 'no-entry').fix, /ready below.*1 unmet mark\(s\) in build\/requirements\/owed1\.md/);
  assert.match(g('c3', 'no-entry').fix, /ready below.*layer 3 is open or still to come/);
  assert.match(g('d3', 'no-entry').fix, /not ready: its modules row has no paths/);
  assert.match(g('ux-design', 'no-entry').fix, /a lane's module/);
  // The ready entry: valid, its suite its neighbours', OPEN, its reading the requirements, README and the job situation.
  const e = g('c3', 'no-entry').content;
  assert.deepEqual(validate(e), []);
  assert.deepEqual(e, {
    id: 'c3', title: 'c3: confirm its requirements on layer 3', layer: 3, paths: ['bio-plane/src/c3/', 'build/requirements/c3.md'], tests: ['bio-plane/test/m/c3/'],
    requirements: 'build/requirements/c3.md', uses: [], suite: SUITE, reading: ['build/requirements/c3.md', 'build/requirements/README.md', 'build/situations/job.md'], status: { state: 'OPEN', at: NOW },
  });
  assert.equal(g('d3', 'no-entry').content, undefined);
  // With no open layer, every modules row with no entry is flagged (C16); only marks and lanes give a ready OPEN entry, and none is written COMPLETE.
  const none = census(root, cfg, { ref: 'origin/tranche' }).gaps.filter((x) => x.kind === 'no-entry');
  assert.deepEqual(none.map((x) => x.id).sort(), ['c3', 'd3', 'old1', 'owed1', 'ux-design']);
  assert.ok(none.every((x) => x.content?.status?.state !== 'COMPLETE'));
  assert.match(none.find((x) => x.id === 'c3').fix, /COMPLETE if it was built before the ledger, else OPEN .*not ready: no layer is open/);
  // No modules file: no census.
  assert.match(census(root, configOf({ modules_file: 'nope.json' }), { ref: 'origin/tranche' }).skipped, /no nope\.json/);
});

// The copy's 8 that the census missed (coordinator, 6 Nov), less ux-design, the ux lane's module.
const COPY_MISSED = [['jurisdictions-b', 2], ['acquisition-owed', 4], ['acquisition-archives', 4], ['held-captures', 4], ['control-plane-door-reading', 11], ['control-plane-door-pages', 11], ['control-plane-store-request', 11]];

test('census: every modules row off the layer map is a gap, COMPLETE with no mark too (copy, 6 Nov: BOB found 8 by hand); a lane\'s module never; an odd row is not ready, never a throw', () => {
  const root = product();
  const cfg = loadConfig(root);
  const rows = JSON.parse(git(['show', 'HEAD:build/modules.json'], { cwd: root })).modules;
  commit(root, {
    'build/layers.md': '| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | done1, old1, owed1 |\n| 2 | Two | a2, b2 |\n| 3 | Three | c3, d3 |\n| 4 | Four | e4, skew, bad |\n',
    'build/modules.json': { modules: [...rows, row('finished', 2), row('odd', 3, { uses: 'not-a-list' }), ...COPY_MISSED.map(([id, n]) => row(id, n))] },
    'process/ledger/ux-design.json': ent('ux-design', 4, { status: { state: 'COMPLETE' } }),
    'process/ledger/finished.json': ent('finished', 2, { status: { state: 'COMPLETE' } }),
    'build/requirements/finished.md': req('finished', false),
    ...Object.fromEntries(COPY_MISSED.flatMap(([id, n]) => [[`process/ledger/${id}.json`, ent(id, n, { status: { state: 'COMPLETE' } })], [`build/requirements/${id}.md`, req(id, false)]])),
    'build/requirements/odd.md': req('odd'),
  });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const c = census(root, cfg, { ref: 'origin/tranche', open: [2] });
  assert.deepEqual(c.gaps.filter((g) => g.id === 'ux-design'), [], 'the lane\'s module is off the map and no gap');
  // A COMPLETE module off the map still matters: a later found mark or --reopen never shows in layer jobs.
  for (const [id, n] of [['finished', 2], ...COPY_MISSED]) {
    const g = c.gaps.filter((x) => x.id === id);
    assert.deepEqual(g.map((x) => [x.kind, x.layer]), [['not-in-layer-map', n]], id);
    assert.match(g[0].fix, new RegExp(`name ${id} on its layer's line in build/layers\\.md \\(its modules row says layer ${n}\\)`));
  }
  assert.deepEqual(c.gaps.filter((g) => g.id === 'odd').map((g) => [g.kind, !!g.content]), [['not-in-layer-map', false], ['no-entry', false]]);
  assert.match(c.gaps.find((g) => g.id === 'odd' && g.kind === 'no-entry').fix, /not ready: its modules row gives an entry the schema refuses/);
});

test('census lines: the open layer and lookahead first, the rest counted, the ready entries as one batch', () => {
  const root = product();
  const c = census(root, loadConfig(root), { ref: 'origin/tranche', open: [2], now: NOW });
  const ls = censusLines(c, { layers: [2, 3, 4], tranche: 'tranche', label: 'gaps (layer 2 open; lookahead 3 and 4)' });
  assert.equal(ls[0], 'gaps (layer 2 open; lookahead 3 and 4): 7 in layers 2, 3, 4 (3 elsewhere)');
  assert.ok(ls.includes('ready entries (2), one plain pull request into tranche, no judgment in them:'));
  assert.ok(ls.some((l) => /^--- process\/ledger\/c3\.json\n\{\n  "id": "c3"/.test(l)));
  assert.deepEqual(censusLines({ gaps: [] }, { layers: [9] }), ['gaps: none in layer 9']);
});

