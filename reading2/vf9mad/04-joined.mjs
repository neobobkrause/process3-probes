// ===== file: wfyaml.mjs (continued) =====

        i++;
        if (Object.hasOwn(out, k)) no(line, `the key ${k} is given twice`);
        ws();
        out[k] = text[i] === ',' || text[i] === '}' ? null : scalar();
        out[LINES][k] = line;
        ws();
        if (text[i] === ',') { i++; continue; }
        if (text[i] === '}') { i++; return out; }
        no(line, 'a flow mapping is not closed as this reader reads it');
      }
    }
    no(line, 'not a flow collection');
  };
  const v = value();
  ws();
  if (i < text.length) no(line, `text after a flow collection: ${text.slice(i, i + 40)}`);
  return v;
}

// Cuts a comment from a flow line, minding quotes.
function flowCut(s) {
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) { if (q === "'" && s[i + 1] === "'") { i++; continue; } q = null; } else if (c === '\\' && q === '"') i++; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '#' && (i === 0 || /[ \t]/.test(s[i - 1]))) return s.slice(0, i);
  }
  return s;
}
const depth = (s) => {
  let d = 0;
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) { if (q === "'" && s[i + 1] === "'") { i++; continue; } q = null; } else if (c === '\\' && q === '"') i++; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '[' || c === '{') d++;
    else if (c === ']' || c === '}') d--;
  }
  return d;
};

export function parseWorkflow(src) {
  if (typeof src !== 'string') throw new YamlError('no text');
  const raw = src.replace(/^\ufeff/, '').split('\n');
  if (raw.some((l) => /[\r\u0085\u2028\u2029\ufeff]/.test(l))) no(1, 'a line break other than \\n, or a byte-order mark');
  // Lines: { n (1-based), indent, text } for every line, blank and comment lines included (block
  // scalars read them raw).
  const L = raw.map((t, k) => ({ n: k + 1, t }));
  let start = 0;
  // A single leading `---` is allowed; any other document marker or directive is refused.
  const firstReal = L.findIndex((l) => !/^[ \t]*(#.*)?$/.test(l.t));
  if (firstReal >= 0 && /^---[ \t]*(#.*)?$/.test(L[firstReal].t)) start = firstReal + 1;
  for (let k = start; k < L.length; k++) if (/^(---|\.\.\.)([ \t]|$)/.test(L[k].t) || /^%/.test(L[k].t)) no(L[k].n, 'more than one document, or a directive');

  const isSkip = (l) => /^[ \t]*(#.*)?$/.test(l.t);
  const ind = (l) => {
    const m = l.t.match(/^( *)(\t?)/);
    if (m[2]) no(l.n, 'a tab in an indent');
    return m[1].length;
  };
  let i = start;
  const next = () => { while (i < L.length && isSkip(L[i])) i++; return i < L.length ? L[i] : null; };

  // A block scalar after `key: |` on line `l`, whose parent sits at indent `parent`.
  const blockScalar = (header, l, parent) => {
    const m = header.match(/^([|>])([1-9])?([-+])?([1-9])?(?:[ \t]+#.*)?$/);
    if (!m || (m[2] && m[4])) no(l.n, `the block scalar header "${header}" is not read`);
    const explicit = Number(m[2] || m[4] || 0);
    let k = i + 1;
    let n = explicit ? parent + explicit : -1;
    const body = [];
    for (; k < L.length; k++) {
      const t = L[k].t;
      if (/^ *$/.test(t)) { body.push(''); continue; }
      const d = t.match(/^ */)[0].length;
      if (n < 0) { if (d <= parent) break; n = d; }
      if (d < n) {
        if (d > parent) no(L[k].n, 'a line less indented than its block scalar but inside its key');
        break;
      }
      body.push(t.slice(n));
    }
    while (body.length && body.at(-1) === '') body.pop();
    i = k;
    // The raw lines, as one string: chomping and folding do not change what is compared here.
    return body.join('\n');
  };

  // A value on line l after the key or dash, at text `s`, whose node sits at indent `parent`.
  // Leaves i past what it read.
  const inlineValue = (s, l, parent) => {
    if (s === '' || /^#/.test(s)) {
      i++;
      const nx = next();
      if (!nx) return null;
      const d = ind(nx);
      if (d > parent) return node(d);
      // YAML lets a mapping's value be a sequence at the key's own indent.
      if (d === parent && /^-( |$)/.test(nx.t.slice(d))) return seq(d);
      return null;
    }
    if (s[0] === '|' || s[0] === '>') return blockScalar(s, l, parent);
    if (s[0] === '"' || s[0] === "'") {
      const q = quoted(s, l.n);
      tailOk(q.rest, l.n);
      i++;
      checkNoContinuation(parent);
      return q.value;
    }
    if (s[0] === '[' || s[0] === '{') {
      let text = flowCut(s);
      let d = depth(text);
      const first = l.n;
      while (d > 0) {
        i++;
        if (i >= L.length) no(first, 'a flow collection is not closed');
        // Inside its key, but for a closing bracket at the key's own indent.
        if (!isSkip(L[i]) && (ind(L[i]) < parent || (ind(L[i]) === parent && !/^ *[\]}]/.test(L[i].t)))) no(L[i].n, 'a flow collection\'s line is not inside its key');
        noTab(L[i]);
        const piece = flowCut(L[i].t);
        text += '\n' + piece;
        d += depth(piece);
      }
      i++;
      const v = flowParse(text, first);
      checkNoContinuation(parent);
      return v;
    }
    const v = plain(plainCut(s), l.n);
    i++;
    checkNoContinuation(parent);
    return v;
  };
  // A plain scalar continued on a deeper line is a multi-line scalar: refused.
  const checkNoContinuation = (parent) => {
    const nx = next();
    if (nx && ind(nx) > parent) no(nx.n, 'a line deeper than the value before it (a multi-line scalar, or a value this reader cannot place)');
  };

  // A mapping whose keys sit at indent d; `first` is a line already split off a `- ` item.
  // A tab outside a block scalar is refused: YAML 1.2 reads one as a separator, libyaml refuses
  // it, and this reader would keep it in a value (cold review of R1).
  const noTab = (l) => { if (/\t/.test(l.t)) no(l.n, 'a tab outside a block scalar'); };
  const map = (d, first = null) => {
    const out = mark({});
    let l = first;
    for (;;) {
      if (!l) {
        l = next();
        if (!l || ind(l) < d) return out;
        if (ind(l) > d) no(l.n, 'a line deeper than its mapping\'s keys');
      }
      noTab(l);
      const t = l === first ? first.rest : l.t.slice(d);
      if (/^-( |$)/.test(t)) {
        if (l === first) no(l.n, 'a sequence inside a sequence item');
        return out; // a sequence at the mapping's indent ends it (the caller judges it)
      }
      if (/^[?&*!|>%@`]/.test(t)) no(l.n, `"${t.slice(0, 40)}" starts with an indicator this reader does not read`);
      const m = t.match(KEY);
      if (!m) no(l.n, `"${t.slice(0, 60)}" is not a \`key: value\` line this reader reads`);
      let k = m[1];
      if (k[0] === '"' || k[0] === "'") k = quoted(k, l.n).value;
      if (k === '<<') no(l.n, 'a merge key');
      if (Object.hasOwn(out, k)) no(l.n, `the key ${k} is given twice`);
      out[LINES][k] = l.n;
      const v = t.slice(m[0].length).trim() === '' ? '' : t.slice(m[0].length).replace(/^[ ]+/, '');
      if (v[0] === '>') out[FOLDED].add(k);
      out[k] = inlineValue(v, l, d);
      l = null;
    }
  };

  // A sequence whose dashes sit at indent d; a line at d that is not a dash ends it (a sequence
  // that is a mapping's value at the key's own indent).
  const seq = (d) => {
    const out = mark([]);
    for (;;) {
      const l = next();
      if (!l || ind(l) < d) return out;
      if (ind(l) > d) no(l.n, 'a line deeper than its sequence\'s dashes');
      noTab(l);
      const t = l.t.slice(d);
      if (!/^-( |$)/.test(t)) return out;
      out[LINES].push(l.n);
      const rest = t.slice(1).replace(/^ +/, '');
      const col = d + (t.length - rest.length);
      if (rest === '' || /^#/.test(rest)) { out.push(inlineValue('', l, d)); continue; }
      if (/^-( |$)/.test(rest)) no(l.n, 'a sequence inside a sequence item');
      if (KEY.test(rest)) { out.push(map(col, { n: l.n, t: l.t, rest })); continue; }
      out.push(inlineValue(rest, l, d));
    }
  };

  const node = (d) => {
    const l = next();
    if (/^-( |$)/.test(l.t.slice(d))) return seq(d);
    return map(d);
  };

  try {
    const l = next();
    if (!l) throw new YamlError('the file is empty');
    if (ind(l) !== 0) no(l.n, 'the top level is indented');
    const t = l.t;
    if (/^-( |$)/.test(t) || !KEY.test(t)) no(l.n, 'the top level is not a mapping');
    const doc = map(0);
    const rest = next();
    if (rest) no(rest.n, 'a line this reader cannot place');
    return doc;
  } catch (e) {
    if (e instanceof YamlError) throw e;
    throw new YamlError(String(e.message));
  }
}

// { doc } or { why }.
export function readWorkflow(src) {
  try { return { doc: parseWorkflow(src) }; } catch (e) {
    if (e instanceof YamlError) return { why: e.message };
    throw e;
  }
}

// ===== file: census.test.mjs =====


// The Lund store took in 14 limes.

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

test('census: an open layer\'s branch lacking an entry the tranche holds is named', () => {
  const root = product();
  git(['push', '-q', 'origin', 'tranche:refs/heads/layer/2'], { cwd: root });
  commit(root, { 'process/ledger/c3.json': ent('c3', 3), 'process/ledger/b2.json': ent('b2', 2, { title: 'b2, again' }) });
  git(['checkout', '-q', '-b', 'side', 'origin/tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  // layer/2 cut before a2's entry: rebuild it without a2's.
  git(['checkout', '-q', '-b', 'l2', 'origin/layer/2'], { cwd: root });
  git(['rm', '-q', 'process/ledger/a2.json'], { cwd: root });
  git(['commit', '-q', '-m', 'cut early'], { cwd: root });
  git(['push', '-q', 'origin', 'l2:refs/heads/layer/2', '--force'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const c = census(root, loadConfig(root), { ref: 'origin/tranche', open: [2] });
  assert.deepEqual(c.gaps.filter((g) => g.kind === 'not-on-layer').map((g) => g.id), ['a2']);
  assert.match(c.gaps.find((g) => g.kind === 'not-on-layer').fix, /layer\/2 lacks process\/ledger\/a2\.json.*job start a2 carries it/);
});

test('open layers: an open row with no merged row', () => {
  const root = product();
  const state = { 'layerflow/1/open.json': '{}', 'layerflow/1/merged.json': '{}', 'layerflow/2/open.json': '{}' };
  assert.deepEqual(openLayers(root, loadConfig(root), (p) => state[p] ?? null), [2]);
});

test('preflight: what job start would refuse for the next layer, each with its fix', () => {
  const root = product();
  const cfg = loadConfig(root);
  commit(root, { 'process/ledger/c3.json': ent('c3', 3, { status: { state: 'WORKING' } }), 'process/ledger/d3.json': { id: 'd3' }, 'process/ledger/e4.json': ent('e4', 4, { status: { state: 'COMPLETE' }, requirements: 'build/requirements/owed1.md' }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const c = census(root, cfg, { ref: 'origin/tranche', open: [2] });
  const holds = [{ id: 'hold-9', live: true, kind: 'module', value: 'c3', scope: 'module:c3', when: [{ layer_closed: 2 }] }];
  const heldBy = (hs, id) => hs.find((h) => h.value === id) || null;
  const seat = (id) => (id === 'c3' ? { lane: { name: 'ux' }, why: 'job c3 is lane ux\'s module, and its session is live' } : null);
  const xs = preflight(root, cfg, 3, { ref: 'origin/tranche', census: c, holds, heldBy, seat });
  assert.deepEqual(xs.map((x) => `${x.id}: ${x.why.split(':')[0]}`), ['c3: its entry is WORKING on origin/tranche', 'c3: held by hold-9 (module', "c3: job c3 is lane ux's module, and its session is live", 'd3: its entry is invalid']);
  assert.match(xs[1].fix, /the hold ends by its own condition \(layer_closed:2\)/);
  assert.match(preflightLines(3, xs)[0], /^preflight, layer 3: 4 start\(s\) would be refused$/);
  assert.deepEqual(preflightLines(5, []), ['preflight, layer 5: no start would be refused']);
  // A paused plan refuses every start.
  assert.equal(preflight(root, { ...cfg, plan: 'pause' }, 2, { ref: 'origin/tranche', census: c })[0].id, '*');
  // A module of the layer with no entry is named with the census's fix.
  const gone = preflight(root, cfg, 4, { ref: 'origin/tranche', census: c });
  // A COMPLETE module with an unmet mark: a plain start refuses it; the fix is --reopen.
  assert.ok(gone.some((x) => x.id === 'e4' && /COMPLETE with 1 unmet mark\(s\): a plain job start refuses it/.test(x.why) && /--reopen/.test(x.fix)), JSON.stringify(gone));
  assert.ok(gone.some((x) => x.id === 'ux-design' && /no-entry/.test(x.why) && /write process\/ledger\/ux-design\.json/.test(x.fix)));
});

test('the gate: a requirements file or modules row added with no entry, or an entry with no row or requirements, is a finding', () => {
  const root = product();
  const cfg = loadConfig(root);
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const rows = (extra) => ({ modules: [...JSON.parse(git(['show', `${base}:build/modules.json`], { cwd: root })).modules, ...extra] });
  const head = commit(root, { 'build/requirements/new1.md': req('new1'), 'build/modules.json': rows([row('new2', 4)]), 'process/ledger/new3.json': ent('new3', 4) });
  const changed = git(['diff', '--name-only', base, head], { cwd: root }).split('\n').filter(Boolean);
  const got = changeGaps(root, cfg, { base, head, changed });
  assert.deepEqual(got.map((x) => x.file).sort(), ['build/modules.json', 'build/requirements/new1.md', 'process/ledger/new3.json', 'process/ledger/new3.json'].sort());
  assert.ok(got.some((x) => /new1 gains a requirements file with no ledger entry process\/ledger\/new1\.json/.test(x.message)));
  assert.ok(got.some((x) => /new2 gains a modules row with no ledger entry/.test(x.message)));
  assert.ok(got.some((x) => /new3's new ledger entry has no row in build\/modules\.json/.test(x.message)));
  assert.ok(got.some((x) => /new3's new ledger entry has no requirements file build\/requirements\/new3\.md/.test(x.message)));
  // An entry whose requirements live where its requirements field says: no finding for them.
  const elsewhere = commit(root, { 'build/modules.json': rows([row('new2', 4), row('new5', 4)]), 'process/ledger/new5.json': ent('new5', 4, { requirements: 'docs/req/new5.md' }), 'docs/req/new5.md': req('new5') });
  assert.deepEqual(changeGaps(root, cfg, { base: head, head: elsewhere, changed: git(['diff', '--name-only', head, elsewhere], { cwd: root }).split('\n').filter(Boolean) }).filter((x) => /new5/.test(x.message)), []);
  // All three pieces together: nothing.
  const whole = commit(root, { 'build/requirements/new4.md': req('new4'), 'build/modules.json': rows([row('new2', 4), row('new5', 4), row('new4', 4)]), 'process/ledger/new4.json': ent('new4', 4) });
  const ch2 = git(['diff', '--name-only', elsewhere, whole], { cwd: root }).split('\n').filter(Boolean);
  assert.deepEqual(changeGaps(root, cfg, { base: elsewhere, head: whole, changed: ch2 }).filter((x) => /new4/.test(x.message)), []);
});

test('status --role bob: the gaps block for the open layer and its lookahead, then the next layer\'s preflight', () => {
  const root = product();
  const cfg = loadConfig(root);
  writeState(root, cfg.state_branch, 'seed', (dir) => { for (const p of ['layerflow/1/open.json', 'layerflow/1/merged.json', 'layerflow/2/open.json']) { mkdirSync(dirname(join(dir, p)), { recursive: true }); writeFileSync(join(dir, p), '{}\n'); } return {}; });
  const ls = gapLines(root, cfg, { tranche: 'origin/tranche' });
  assert.equal(ls[0], 'gaps (layer 2 open; lookahead 3 and 4): 7 in layers 2, 3, 4 (3 elsewhere)');
  assert.ok(ls.some((l) => /^preflight, layer 3: 2 start\(s\) would be refused$/.test(l)), ls.join('\n'));
  assert.ok(ls.some((l) => /^- c3: no-entry: .*; fix: write process\/ledger\/c3\.json/.test(l)));
  // C16: the modules built before the ledger, outside the open layer and its lookahead, with their entries ready.
  const at = ls.findIndex((l) => l.startsWith('built before the ledger (no entry: modules that use one wait for it as a provider): 1'));
  assert.ok(at >= 0, ls.join('\n'));
  assert.ok(ls.slice(at).some((l) => /^- old1 \(layer 1\), no-entry: write process\/ledger\/old1\.json recording it COMPLETE/.test(l)), ls.join('\n'));
  // Its paths are not on the tranche here: listed, not ready (test 1 shows it ready once they are).
  assert.ok(ls.slice(at).some((l) => /^- old1 .*not ready: .*not on origin\/tranche/.test(l)), ls.join('\n'));
});

// ===== file: ghhook.mjs =====

// p3 github hook (R17c; Bob, 6 Nov: ALL GitHub traffic monitored and limited, enforced, not by
// rule): a Claude Code PreToolUse hook. It reads the hook's JSON on stdin and decides:
//   mcp__github__*  the connector call is counted in the ledger and takes its turn exactly as a gh
//                   call would (the pause, the stop, the windows, at most a 15 min wait): a read
//                   1 point; a write (create, update, add, merge, comment, review, ...) one
//                   content-creating request, 5 points; one that moves a ref on GitHub (a merge, a
//                   file write, a branch) also a push against the ceiling. Refused: exit 2.
//   Bash            a raw `git push`, any `gh` command, or curl or wget to github.com is refused
//                   (exit 2), naming the tool's way instead; the tool's own commands
//                   (node .process/tool/p3.mjs, node tool/p3.mjs) pass, and everything else.
// Exit 2 blocks the call, with the reason on stderr for the session (Claude Code's hook contract).
// The settings that call it are Bob's (notes/r17c-settings.md).
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { kickRefresh, LEDGER_CACHE, ledgerOf, peekShare, refreshDone, stateShare } from './ghshare.mjs';
import { commonDir, hookPacing, pacing, Paced, primaryState, reserve, TOOL, useShared } from './pace.mjs';
import { CONFIG_FILE, loadConfig, repoRoot } from './util.mjs';

// The connector's writes: each one content-creating request.
const WRITE = /^(create|update|add|delete|merge|push|fork|assign|label_write|issue_write|sub_issue_write|pull_request_review_write|request_copilot_review|resolve_review_thread|unresolve_review_thread|enable_pr_auto_merge|disable_pr_auto_merge|actions_run_trigger|actions_rerun|rerun|cancel|run_secret_scanning|submit|dismiss|star|unstar|mark)/;
// Those that also move a ref on GitHub: a push GitHub shows.
const MOVES_REF = new Set(['merge_pull_request', 'push_files', 'create_or_update_file', 'delete_file', 'create_branch', 'update_pull_request_branch']);
// The Bash check reads the command as the shell would, enough to find what runs (cold review of
// R17c: a regex was passed by subshells, `bash -c`, wrappers, absolute paths and aliases, and
// blocked commit messages that mention git push): heredoc bodies and comments dropped; words split
// with quotes kept inside their word; a segment ends at ; & | newline ( ) ` and $( ; leading
// assignments and wrappers (sudo, env, time, nohup, timeout N, xargs, nice, command, exec, !,
// then, do, else, if, while, until) skipped; `bash -c`, `sh -c` and `eval` read again inside.
const WRAPPERS = new Set(['sudo', 'env', 'time', 'nohup', 'timeout', 'xargs', 'nice', 'command', 'exec', '!', 'then', 'do', 'else', 'if', 'while', 'until', 'elif', 'stdbuf', 'unbuffer']);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);
const GIT_VALUED = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--config-env']);
function words(cmd) {
  const text = String(cmd || '').replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*(\n|$)/g, '\n');
  const segs = [];
  let seg = [];
  let w = null;
  const end = () => { if (w !== null) { seg.push(w); w = null; } };
  const brk = () => { end(); if (seg.length) segs.push(seg); seg = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'") { const j = text.indexOf("'", i + 1); w = (w || '') + text.slice(i + 1, j < 0 ? text.length : j); i = j < 0 ? text.length : j; continue; }
    if (c === '"') { let j = i + 1; let v = ''; while (j < text.length && text[j] !== '"') { if (text[j] === '\\' && j + 1 < text.length) { v += text[j + 1]; j += 2; } else v += text[j++]; } w = (w || '') + v; i = j; continue; }
    if (c === '\\' && i + 1 < text.length) { if (text[i + 1] === '\n') { i++; continue; } w = (w || '') + text[++i]; continue; }
    if (c === '#' && w === null) { while (i < text.length && text[i] !== '\n') i++; brk(); continue; }
    if (c === '$' && text[i + 1] === '(') { brk(); i++; continue; }
    if (';&|\n()`'.includes(c)) { brk(); continue; }
    if (/\s/.test(c)) { end(); continue; }
    w = (w || '') + c;
  }
  brk();
  return segs;
}
const base = (x) => String(x).replace(/^\\/, '').split('/').pop();
function segVerdict(seg, depth, tool) {
  let i = 0;
  while (i < seg.length && (/^\w+=/.test(seg[i]) || WRAPPERS.has(base(seg[i])) || (i > 0 && WRAPPERS.has(base(seg[i - 1])) && (/^-/.test(seg[i]) || /^\d+[smhd]?$/.test(seg[i]))))) i++;
  const cmd = base(seg[i] || '');
  const rest = seg.slice(i + 1);
  if (SHELLS.has(cmd)) { const k = rest.findIndex((x) => /^-\w*c\w*$/.test(x)); return k >= 0 && rest[k + 1] && depth < 4 ? bashVerdict(rest[k + 1], depth + 1, tool) : null; }
  if (cmd === 'eval') return depth < 4 ? bashVerdict(rest.join(' '), depth + 1, tool) : null;
  if (cmd === 'git') {
    let k = 0;
    while (k < rest.length && rest[k].startsWith('-')) {
      if (rest[k] === '-c' && /^alias\.[^=]+=.*\bpush\b/.test(rest[k + 1] || '')) return `a git alias for push goes around GitHub pacing (P27): push with \`${tool} github push <remote> <refspec>\``;
      k += GIT_VALUED.has(rest[k]) ? 2 : 1;
    }
    if (rest[k] === 'push' && !rest.slice(k + 1).some((x) => x === '--dry-run' || x === '-n')) return `a raw git push goes around GitHub pacing (P27): push with \`${tool} github push <remote> <refspec>\`, or through the tool command that pushes for you (job sync, layer publish, job complete)`;
    return null;
  }
  if (cmd === 'gh') return 'a raw gh command goes around GitHub pacing (P27): use the tool command that makes the call, or the GitHub connector (counted by this hook)';
  if ((cmd === 'curl' || cmd === 'wget') && rest.some((x) => /^(https?:\/\/)?([\w-]+\.)?github\.com(\/|:|$)/.test(x))) return 'curl or wget to github.com goes around GitHub pacing (P27): use the tool, or the GitHub connector';
  return null;
}
// tool: the tool's command in this clone (pace.mjs TOOL), named in the refusal.
export function bashVerdict(cmd, depth = 0, tool = TOOL) {
  for (const seg of words(cmd)) { const v = segVerdict(seg, depth, tool); if (v) return v; }
  return null;
}

// The hook's decision for one tool call: { block: reason } or { ok }.
export function hookDecision(input, cwd, opts = {}) {
  const name = String(input?.tool_name || '');
  const ti = input?.tool_input || {};
  try {
    if (name.startsWith('mcp__github__')) {
      const op = name.slice('mcp__github__'.length);
      const write = WRITE.test(op);
      const repo = ti.owner && ti.repo ? `${ti.owner}/${ti.repo}`.toLowerCase() : null;
      const extra = { connector: true, ...(repo ? { repo } : {}) };
      // The call's own cost first, then a ref it moves: a refused push then leaves only the call counted.
      hookPacing(() => {
        reserve({ points: write ? 5 : 1, content: write ? 1 : 0, primary: true }, `connector ${op}`, cwd, { ...opts, extra });
        if (MOVES_REF.has(op)) reserve({ push: true, points: 0, content: 0, primary: false }, `connector ${op}`, cwd, { ...opts, kind: 'push', extra: { ...extra, via: 'connector' } });
      });
      return { ok: true, counted: write ? 'write' : 'read' };
    }
    if (name === 'Bash') { const why = bashVerdict(ti.command); return why ? { block: why } : { ok: true }; }
    return { ok: true };
  } catch (e) {
    if (e instanceof Paced) return { block: e.message };
    throw e;
  }
}

// The hook as Claude Code runs it (R17d, tool/hook.mjs; `p3 github hook` runs the same): the
// Bash check and other tools touch no git and no ledger; a connector read takes the read path
// (ghshare peekShare: the cached pause and stop, GitHub's cached primary count, no fetch, no
// network, no per-clone floor: under 300 ms); a connector write reads the ledger through stateShare (within READ_S, else ls-remote) and takes
// the full path, waits included. Returns the exit code: 0 allows, 2 blocks (reason on stderr).
const CONNECTOR = 'mcp__github__';
const ledgerKey = (root, cfg) => { try { const l = ledgerOf(root, cfg); return l ? (l.own ? 'own' : l.url) : null; } catch { return undefined; } };
export function hookRun(input, cwd, { err = (m) => console.error(m), share, kick = process.env.NODE_TEST_CONTEXT ? () => false : kickRefresh, opts = {} } = {}) {
  if (!input) { err('p3 github hook: no hook JSON on stdin'); return 2; }
  const name = String(input.tool_name || '');
  let d;
  if (!name.startsWith(CONNECTOR)) d = hookDecision(input, cwd, opts);
  else {
    const root = repoRoot(cwd);
    let cfg = null;
    try { cfg = existsSync(join(root, CONFIG_FILE)) ? loadConfig(root) : null; } catch { cfg = null; }
    const write = WRITE.test(name.slice(CONNECTOR.length));
    const was = process.env.NODE_TEST_CONTEXT || process.env.GITHUB_ACTIONS === 'true';
    useShared(share !== undefined ? share : write ? (was ? null : stateShare(root, cfg)) : peekShare(root, { kick, key: ledgerKey(root, cfg) }));
    try {
      d = hookDecision(input, root, write ? opts : { p: { ...pacing(), gh_interval_ms: 0 }, rateLimit: () => undefined, ...opts });
    } finally { useShared(null); }
  }
  if (d.block) { err(`GitHub pacing (P27): ${d.block}`); return 2; }
  return 0;
}
// The background refresh the read path starts (tool/hook.mjs --refresh): the ledger's tip asked of
// GitHub, fetched only when it moved; GitHub's primary count when a minute old. Never fails loudly.
export function hookRefresh(cwd) {
  // A stalled transfer gives up (cold review of R17d: a hung fetch held the clone's state lock).
  process.env.GIT_HTTP_LOW_SPEED_LIMIT ||= '1000';
  process.env.GIT_HTTP_LOW_SPEED_TIME ||= '20';
  try {
    const root = repoRoot(cwd);
    let cfg = null;
    try { cfg = existsSync(join(root, CONFIG_FILE)) ? loadConfig(root) : null; } catch { cfg = null; }
    const sh = stateShare(root, cfg);
    if (sh) sh.refresh();
    else writeFileSync(join(commonDir(root), LEDGER_CACHE), JSON.stringify({ at: Date.now(), pause: null, use: [], ledger: null }));
    primaryState(root);
  } catch { /* the next read starts another */ } finally { refreshDone(cwd); }
}

// ===== file: ready.test.mjs =====

import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRepo, entry, openPassed } from './helpers.mjs';
import { archivable, readyCount, startable, startReady } from '../lib/ready.mjs';
import { writeFileSync } from 'node:fs';
import { nextWork } from '../lib/status.mjs';
import { fail, git } from '../lib/util.mjs';
import { status } from '../lib/status.mjs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const quiet = () => {};
const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n';

test('startable: an OPEN entry never started, a COMPLETE one with a notice or found marks; named otherwise', () => {
  const next = [
    { file: 'r/a.md', count: 2, module: 'a', entry_state: 'OPEN' },
    { file: 'r/b.md', count: 1, module: 'b', entry_state: 'OPEN' },
    { file: 'r/c.md', count: 1 },
    { file: 'r/d.md', count: 1, module: 'd', entry_state: 'OPEN', over: 'split or consolidate before its job: r/d.md' },
    { file: 'r/e.md', count: 0, module: 'e', entry_state: 'COMPLETE', notices: ['p:9'] },
    { file: 'r/f.md', count: 1, module: 'f', entry_state: 'COMPLETE', found: ['F1', 'F2'] },
    { file: 'r/g.md', count: 1, module: 'g', entry_state: 'COMPLETE' },
    { triage: 'p:9' },
  ];
  const { go, skip } = startable(next, { onOrigin: (id) => ['b', 'e', 'f', 'g'].includes(id) });
  assert.deepEqual(go, [{ id: 'a', file: 'r/a.md' }, { id: 'e', file: 'r/e.md' }, { id: 'f', file: 'r/f.md', reopen: 'meet the found marks F1, F2' }]);
  assert.deepEqual(skip.map((s) => s.id || s.file), ['b', 'r/c.md', 'g']);
  assert.match(skip[1].why, /no ledger entry/);
});

test('job start --ready: starts every ready job up to live_cap less the live sessions; a refused start does not stop the rest', () => {
  const root = makeRepo({ 'process/config.json': JSON.stringify({ live_cap: 5 }) });
  const next = ['a', 'b', 'c', 'd'].map((id) => ({ file: `r/${id}.md`, count: 1, module: id, entry_state: 'OPEN' }));
  const calls = [];
  const out = [];
  const r = startReady(root, {
    live: 2, remote: new Set(), log: (m) => out.push(m),
    read: (_, o) => { assert.equal(o.role, 'bob'); assert.equal(o.live, 2); return { next }; },
    start: (_, id, o) => { calls.push([id, o.coordinator]); if (id === 'b') fail('the setup is not complete'); return { launch: { title: `job ${id}` } }; },
    coordinator: 'session_x',
  });
  assert.deepEqual(calls, [['a', 'session_x'], ['b', 'session_x'], ['c', 'session_x']], 'cap 5 less 2 live: three starts');
  assert.deepEqual(r.started.map((x) => x.id), ['a', 'c']);
  assert.deepEqual(r.failed, [{ id: 'b', why: 'the setup is not complete' }]);
  assert.deepEqual(r.waiting, ['d']);
  assert.equal(r.ok, false);
  assert.match(out[0], /^ready: 4 startable \(live 2, cap 5\); starting 3, 1 wait for the cap: d$/);
  assert.match(out.at(-1), /^next acts: create_session with each launch printed above \(a, c\)/);
  assert.throws(() => startReady(root, { read: () => ({ next }) }), /--live <n>/);
  assert.throws(() => startReady(root, { live: 'x', read: () => ({ next }) }), /--live <n>/);
});

test('job start --ready: a job whose branch is already on origin is never launched twice', () => {
  const root = makeRepo({ 'process/config.json': JSON.stringify({ live_cap: 5 }) });
  const next = [{ file: 'r/a.md', count: 1, module: 'a', entry_state: 'OPEN' }];
  const calls = [];
  const out = [];
  const r = startReady(root, { live: 0, remote: new Set(['a']), log: (m) => out.push(m), read: () => ({ next }), start: (_, id) => calls.push(id) });
  assert.deepEqual(calls, []);
  assert.equal(r.ok, true);
  assert.match(out.join('\n'), /not started: a: job\/a is on origin/);
  assert.match(out.at(-1), /^nothing started/);
});

test('next work: an OPEN entry status found never started is listed with its module; one with a job is not', () => {
  const root = makeRepo({
    'build/requirements/a.md': unmet(2),
    'build/requirements/b.md': unmet(1),
    'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md' }),
    'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md' }),
  });
  openPassed(root);
  const rows = [{ id: 'a', tranche: 'OPEN', req: 'build/requirements/a.md', unstarted: true }, { id: 'b', tranche: 'OPEN', req: 'build/requirements/b.md', branch: 'WORKING' }];
  const out = [];
  const next = nextWork(root, { requirements_dir: 'build/requirements', layers_file: 'none.md', live_cap: 24, requirements_cap: 1e6 }, rows, null, { log: (m) => out.push(m), state: null });
  assert.deepEqual(next.map((x) => [x.file, x.module, x.entry_state]), [['build/requirements/a.md', 'a', 'OPEN']]);
  assert.match(out.join('\n'), /build\/requirements\/a\.md: 2; entry OPEN, never started: node \.process\/tool\/p3\.mjs job start --ready/);
});

test('status --role bob, origin read: an OPEN entry with no job branch on origin and no pull request is marked never started', () => {
  const root = makeRepo({
    'build/requirements/a.md': unmet(2),
    'build/requirements/b.md': unmet(1),
    'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md' }),
    'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md' }),
  });
  git(['branch', 'tranche'], { cwd: root });
  git(['branch', 'job/b'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', 'https://github.com/o/r'], { cwd: root });
  git(['config', `url.${bare}.insteadOf`, 'https://github.com/o/r'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'job/b'], { cwd: root });
  openPassed(root);
  const see = (prs) => status(root, { role: 'bob', log: quiet, io: { openPRs: () => prs, prFiles: () => [], checkRun: () => null, compare: () => null } });
  const r = see([]);
  assert.deepEqual(r.rows.filter((x) => x.unstarted).map((x) => x.id), ['a']);
  assert.deepEqual(r.next.map((x) => [x.module, x.entry_state]), [['a', 'OPEN']]);
  // GitHub unread: nothing is marked, so nothing is started on a guess.
  assert.deepEqual(see(null).rows.filter((x) => x.unstarted), []);
});

test('job start --ready, review of PR 100: an open attempt is not restarted, a module listed twice starts once, a failed start shows no launch, a resumed start with its PR open is not counted', () => {
  const root = makeRepo({ 'process/config.json': JSON.stringify({ live_cap: 9 }) });
  const next = [
    { file: 'r/x.md', count: 0, module: 'x', entry_state: 'COMPLETE', notices: ['p:2'], attempt_open: true },
    { file: 'r/a.md', count: 1, module: 'a', entry_state: 'OPEN' },
    { file: 'r/a2.md', count: 1, module: 'a', entry_state: 'OPEN' },
    { file: 'r/b.md', count: 1, module: 'b', entry_state: 'OPEN' },
    { file: 'r/c.md', count: 1, module: 'c', entry_state: 'OPEN' },
  ];
  const calls = [];
  const out = [];
  const r = startReady(root, {
    live: 0, remote: new Set(), log: (m) => out.push(m), read: () => ({ next }),
    start: (_, id, o) => {
      calls.push(id);
      o.log('start the job session with create_session:\n{}');
      if (id === 'b') throw new SyntaxError('Unexpected token');
      if (id === 'c') return { resumed: true, pr: { number: 4 }, created: false };
      return { launch: {} };
    },
  });
  assert.deepEqual(calls, ['a', 'b', 'c']);
  assert.deepEqual(r.started.map((x) => x.id), ['a']);
  assert.deepEqual(r.failed.map((x) => x.id), ['b', 'c']);
  assert.equal(out.filter((l) => l.startsWith('start the job session')).length, 1, 'only the started job\'s launch is shown');
  assert.match(out.join('\n'), /not started: x: its attempt is open/);
  assert.match(out.join('\n'), /not started: b: Unexpected token \(an unexpected error; the other starts went on\)/);
  assert.match(out.join('\n'), /not started: c: its pull request was already open/);
});

test('job start --ready: when the cap holds a ready job back, it names the idle sessions of COMPLETE or merged jobs BOB can archive', () => {
  const root = makeRepo({ 'process/config.json': JSON.stringify({ live_cap: 2 }) });
  const next = ['a', 'b'].map((id) => ({ file: `r/${id}.md`, count: 1, module: id, entry_state: 'OPEN' }));
  const rows = [
    { id: 'm', tranche: 'COMPLETE', pr: 'merged' },
    { id: 'k', tranche: 'WORKING', branch: 'COMPLETE', pr: '#7 ready' },
    { id: 'w', tranche: 'WORKING', branch: 'WORKING', pr: '#8 draft' },
    { id: 'gone', tranche: 'COMPLETE', pr: 'merged' },
    // Reopened: COMPLETE on the tranche, WORKING on its branch, its draft open; never named.
    { id: 'r', tranche: 'COMPLETE', branch: 'WORKING', pr: '#9 draft' },
  ];
  const listed = [
    { id: 'session_m', title: 'job m', status: 'idle' },
    { id: 'session_k', title: 'job k', status_bucket: 'completed' },
    { id: 'session_w', title: 'job w', status: 'idle' },
    { id: 'session_g', title: 'job gone', status: 'archived' },
