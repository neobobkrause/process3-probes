// ===== file: take-in-record.test.mjs (continued) =====

  commit(root, {}, 'forged row');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'alpha into tranche', 'job/alpha'], { cwd: root });
  const base = sha(root, 'tranche');
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'Bring job/alpha up to tranche', 'tranche'], { cwd: root });
  // The range merges the side branch, with the tranche as its first parent.
  git(['merge', '-q', '--no-ff', '-m', 'merge side', 'side'], { cwd: root });
  for (const at of [root, shallow(root, 'job/alpha', null, 6)]) {
    const r = check(at, base);
    assert.deepEqual(r.tips, []);
    assert.ok(r.findings.some((f) => f.check === 'record' && f.message.includes(x.slice(0, 10)) && /no commit in the range has it as its first parent/.test(f.message)), JSON.stringify(r.findings));
    assert.ok(r.findings.some((f) => f.check === 'approvals' && f.message.includes(x.slice(0, 10))), JSON.stringify(r.findings));
  }
});

test('a forged row the base holds, its tip no full id or outside the head\'s history, is not honoured and hides nothing', () => {
  const { root, base } = attempt2();
  // An unrelated commit, never in the head's history, that changes the approvals.
  git(['checkout', '-q', '-b', 'stray', 'main'], { cwd: root });
  const x = commit(root, { 'CLAUDE.md': claude('may force-push') }, 'stray');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const file = 'process/metrics/alpha.jsonl';
  const row = (tip) => JSON.stringify({ event: 'start', module: 'alpha', take_in: { branch: 'x', pr: null, commits: 1, tip } }) + '\n';
  commit(root, { [file]: readFileSync(join(root, file), 'utf8') + row(x) + row(x.slice(0, 12)) }, 'forged rows on the tranche');
  const at = sha(root, 'tranche');
  git(['checkout', '-q', '-B', 'job/alpha', 'tranche'], { cwd: root });
  const c = commit(root, { 'CLAUDE.md': claude('may merge to main') }, 'attempt changes the approvals');
  assert.notEqual(at, base);
  const r = check(root, at);
  assert.deepEqual(r.tips, []);
  assert.ok(r.findings.some((f) => f.check === 'approvals' && f.message.includes(c.slice(0, 10))), JSON.stringify(r.findings));
  assert.ok(!r.findings.some((f) => f.check === 'record'), JSON.stringify(r.findings));
});

// ===== file: exports.mjs (later part) =====

  for (const line of git(['ls-tree', '-r', '-t', '-z', ref], { cwd: root }).split('\0')) {
    const tab = line.indexOf('\t');
    if (tab < 0) continue;
    const [mode, type, oid] = line.slice(0, tab).split(' ');
    out.set(line.slice(tab + 1), { mode, type, oid });
  }
  return out;
}
// Blob texts by object id, read in one git process; an id git cannot read is null (as a failed git show).
const TEXTS = new Map(); // oid -> text, the files a surface read, kept while under TEXT_MAX characters
const TEXT_MAX = 32 * 1024 * 1024;
let textChars = 0;
const keepText = (o, t) => {
  TEXTS.set(o, t);
  textChars += t.length;
  for (const [k, v] of TEXTS) { if (textChars <= TEXT_MAX) break; TEXTS.delete(k); textChars -= v.length; } // the oldest first
};
const keep = (map, max, k, v) => { map.set(k, v); if (map.size > max) map.delete(map.keys().next().value); };
// Read in parts of PART ids. A part git could not read whole (it failed, or its output is cut
// short) leaves its ids null, and a null is never kept: it is read again next time.
const PART = 512;
let unread = 0; // blobs read as null so far: an answer made from one is not kept (order.mjs)
export const unreadCount = () => unread;
export function blobTexts(root, oids, { cache = true } = {}) {
  const out = new Map();
  const want = [...new Set(oids)].filter((o) => { if (TEXTS.has(o)) { out.set(o, TEXTS.get(o)); return false; } return true; });
  for (let p = 0; p < want.length; p += PART) {
    const part = want.slice(p, p + PART);
    const r = git(['cat-file', '--batch'], { cwd: root, allowFail: true, encoding: 'buffer', input: part.join('\n') + '\n' });
    const buf = r.code === 0 && Buffer.isBuffer(r.stdout) ? r.stdout : Buffer.alloc(0);
    let i = 0;
    for (const o of part) {
      out.set(o, null);
      const nl = buf.indexOf(10, i);
      if (nl < 0) continue;
      const head = buf.toString('latin1', i, nl).split(' ');
      i = nl + 1;
      if (head[0] !== o || head[1] !== 'blob') continue; // "<oid> missing", or not a blob: unread
      const n = Number(head[2]);
      if (!Number.isInteger(n) || nl + 1 + n >= buf.length) { i = buf.length; continue; } // cut short
      const text = buf.toString('utf8', nl + 1, nl + 1 + n);
      i = nl + 1 + n + 1;
      out.set(o, text);
      if (cache && text.length <= TEXT_MAX / 8) keepText(o, text);
    }
  }
  for (const v of out.values()) if (v === null) unread++;
  return out;
}
// A code file's specifiers, by blob id (checks.mjs specifiers): the text itself is not kept. The
// answer of a call is its own reads (a cache evicting mid-call never drops one); an unread blob
// reads as none and is read again next call, as git show's failure was.
const SPECS = new Map();
const SPECS_MAX = 200000;
function specsOf(root, oids) {
  const got = new Map();
  const miss = [];
  for (const o of new Set(oids)) { if (SPECS.has(o)) got.set(o, SPECS.get(o)); else miss.push(o); }
  for (let i = 0; i < miss.length; i += PART) {
    for (const [o, t] of blobTexts(root, miss.slice(i, i + PART), { cache: false })) {
      const v = t === null ? [] : specifiers(t).map((x) => x.spec);
      got.set(o, v);
      if (t !== null) keep(SPECS, SPECS_MAX, o, v);
    }
  }
  return (o) => got.get(o) || [];
}
// Whether a blob's text has one of the words (git grep -F's test), by blob id and words.
const WORDS = new Map();
function hasWord(root, oids, words) {
  const k = (o) => `${o}\0${JSON.stringify(words)}`;
  const got = new Map();
  const miss = [];
  for (const o of new Set(oids)) { if (WORDS.has(k(o))) got.set(o, WORDS.get(k(o))); else miss.push(o); }
  for (const [o, t] of blobTexts(root, miss, { cache: false })) {
    const v = t !== null && words.some((w) => t.includes(w));
    got.set(o, v);
    if (t !== null) keep(WORDS, SPECS_MAX, k(o), v);
  }
  return (o) => got.get(o) === true;
}
// The files git grep reads in a tree: regular files (not links) ending in EXTS.
const isCodeBlob = (p, e) => e?.type === 'blob' && /^100/.test(e.mode) && EXTS.some((x) => p.endsWith(x));

// The provider's entry files at ref: its source files a file outside the module imports; else its index files.
// An importer inside the provider module (its source, its tests, anything under its paths) is not
// a user: the gate counts a module's tests as the module's own (checks.mjs ownerOf; review of PR 82).
export function entryFiles(root, ref, { isProviderSource, providerPaths, inProvider = isProviderSource }, at = {}) {
  const tree = at.tree || treeAt(root, ref);
  const all = [...tree].filter(([, e]) => e.type !== 'tree').map(([p]) => p);
  const set = new Set(all);
  const mine = all.filter((f) => CODE.test(f) && isProviderSource(f));
  if (!mine.length) return [];
  // Only files naming one of the provider's directories can import it (the words git grep -F
  // looked for): every code file's imports are read by blob id, and the words are read only in
  // the files whose imports reach the provider's source.
  const words = [...new Set(providerPaths.map((p) => p.replace(/\/$/, '').split('/').pop()).filter((w) => w && w !== '.'))];
  const found = new Set();
  if (words.length) {
    const files = [...tree].filter(([f, e]) => isCodeBlob(f, e) && CODE.test(f) && !inProvider(f));
    const specs = specsOf(root, files.map(([, e]) => e.oid));
    const reach = [];
    for (const [f, e] of files) {
      const to = specs(e.oid).map((spec) => resolveSpec(f, spec, (x) => set.has(x))).filter((x) => x && isProviderSource(x));
      if (to.length) reach.push([e.oid, to]);
    }
    const named = hasWord(root, reach.map(([o]) => o), words);
    for (const [o, to] of reach) if (named(o)) for (const x of to) found.add(x);
  }
  if (found.size) return [...found].sort();
  return mine.filter((f) => /(^|\/)index\.[^/]+$/.test(f)).sort();
}

// The surface of a provider at ref: the names every entry file exports, one map; where two entry
// files export one name, the later file in path order wins.
export function surfaceAt(root, ref, opts) {
  const tree = treeAt(root, ref);
  const files = entryFiles(root, ref, opts, { tree });
  // The provider's own code files, read at once: a surface follows its imports within the module.
  blobTexts(root, [...tree].filter(([p, e]) => e.type === 'blob' && CODE.test(p) && opts.isProviderSource(p)).map(([, e]) => e.oid));
  const cache = new Map();
  const plain = (f) => f && f !== '.' && !f.startsWith('/') && !f.startsWith('../') && !f.endsWith('/') && posix.normalize(f) === f;
  const read = (f) => {
    if (!cache.has(f)) {
      const e = tree.get(f);
      if (e?.type === 'blob') cache.set(f, blobTexts(root, [e.oid]).get(e.oid));
      else if (!e && plain(f)) cache.set(f, null); // not in the tree: git show would fail
      else { const r = git(['show', `${ref}:${f}`], { cwd: root, allowFail: true }); cache.set(f, r.code === 0 ? r.stdout : null); }
    }
    return cache.get(f);
  };
  const out = new Map();
  for (const f of files) for (const [k, v] of surfaceOf(read, f, opts.isProviderSource)) out.set(k, v);
  // Entry files with TypeScript export forms the surface does not read (interface, type, enum,
  // namespace, declare, abstract class): a caller counts those exports unread (PD-20).
  const unread = files.filter((f) => TS_EXPORT.test(blank(read(f) || '')));
  return { files, names: out, unread };
}
const TS_EXPORT = /\bexport\s+(?:default\s+)?(?:declare\b|abstract\s+class\b|interface\b|type\s+[A-Za-z$]|enum\b|const\s+enum\b|namespace\b)/;

// The export names added, removed or changed between base and head.
export const exportChanges = (root, base, head, opts) => { const { removed, added, changed } = exportRead(root, base, head, opts); return { removed, added, changed }; };
// The same, with the entry files read on either side (PD-20: an import at triage counts as read only
// when the file it names is one of them).
export function exportRead(root, base, head, opts) {
  const sa = surfaceAt(root, base, opts);
  const sb = surfaceAt(root, head, opts);
  const [a, b] = [sa.names, sb.names];
  const removed = [...a.keys()].filter((k) => !b.has(k)).sort();
  const added = [...b.keys()].filter((k) => !a.has(k)).sort();
  const changed = [...a.keys()].filter((k) => b.has(k) && a.get(k) !== b.get(k)).sort().map((k) => ({ name: k, before: a.get(k), after: b.get(k) }));
  return { removed, added, changed, files: [...new Set([...sa.files, ...sb.files])].sort(), unread: [...new Set([...sa.unread, ...sb.unread])].sort() };
}
// For tests: forget every read kept.
export function forgetReads() { TEXTS.clear(); SPECS.clear(); WORDS.clear(); JOINS.clear(); textChars = 0; }
export const anyExportChange = (x) => !!x && (x.removed.length || x.added.length || x.changed.length) > 0;

// ===== file: shallow-mergebase.test.mjs =====

// Every merge base the tool reads is read on history that holds it (C8, the coordinator, 7 Nov:
// BOB's layer lands failed in a shallow checkout, where the train had deepened and the layer flow
// did not). util.git({ deepen: true }) deepens a shallow clone until the commits meet; every
// merge-base in the tool asks it, but those of the modules named below, each for its reason.
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { commit, makeRepo } from './helpers.mjs';
import { git, isShallow } from '../lib/util.mjs';
