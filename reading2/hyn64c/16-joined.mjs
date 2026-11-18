// ===== file: layout.mjs (continued) =====

  }
  return { moves, skipped, follows };
}

export const planLines = ({ moves, skipped, follows }) => [
  ...(moves.length ? moves.map((m) => `move ${m.from} -> ${m.to}${m.key ? ` (${CONFIG_FILE} ${m.key})` : ''}${m.note ? `; note: ${m.note}` : ''}`) : [`nothing to move: the process-only paths the tool reads are under ${PROCESS_DIR}/ or absent`]),
  ...(follows || []).map((f) => `key ${f.key} -> ${f.to} (inside a moved folder)`),
  ...skipped.map((s) => `skip ${s.from}: ${s.why}`),
];

// status --role bob's hint: the built-in paths still outside process/, never a refusal.
export function layoutHint(root, cfg) {
  try {
    const { moves } = layoutPlan(root, { cfg });
    return moves.length ? `layout: ${moves.length} process-only path(s) outside ${PROCESS_DIR}/ (${moves.map((m) => m.from).join(', ')}): \`layout move\` prints the plan` : null;
  } catch { return null; }
}

// The config text with only the moved keys rewritten, the rest of it byte for byte. Each change is
// { key, to }; a key with a scalar value (a string, null, a number, a boolean) is rewritten where it
// stands, an absent one added. The text read back must give each key its new value, else refused.
const SCALAR = String.raw`(?:"(?:[^"\\]|\\.)*"|null|true|false|-?\d[\d.eE+-]*)`;
export function rewriteConfig(text, changes) {
  let out = text;
  const cfg = parseJSON(text);
  const keyed = changes.filter((m) => m.key);
  for (const m of keyed) {
    const pattern = new RegExp(`("${m.key}"\\s*:\\s*)${SCALAR}`);
    if (Object.hasOwn(cfg, m.key)) {
      if (!pattern.test(out)) fail(`layout move: ${m.key} in ${CONFIG_FILE} is not a path or null; set it by hand first`);
      out = out.replace(pattern, (_, k) => `${k}${JSON.stringify(m.to)}`);
    } else {
      const at = out.lastIndexOf('}');
      if (at < 0) fail(`${CONFIG_FILE} is not a JSON object`);
      const body = out.slice(0, at).trimEnd();
      const comma = body.endsWith('{') ? '' : ',';
      out = `${body}${comma}\n  ${JSON.stringify(m.key)}: ${JSON.stringify(m.to)}\n${out.slice(at)}`;
    }
  }
  let back;
  try { back = parseJSON(out); } catch (e) { fail(`layout move: ${CONFIG_FILE} would not read back (${e.message})`); }
  for (const m of keyed) if (back[m.key] !== m.to) fail(`layout move: could not rewrite ${m.key} in ${CONFIG_FILE} (the first "${m.key}" in its text is not the top-level one); set it by hand`);
  return out;
}

export function layoutMove(root, { apply = false, also = [], log = console.log } = {}) {
  const cfg = loadConfig(root);
  const plan = layoutPlan(root, { cfg, also });
  for (const l of planLines(plan)) log(l);
  if (!apply) {
    if (plan.moves.length) log(`then, on a branch from ${cfg.tranche}: layout move --apply${list(also).map((p) => ` --also ${p}`).join('')}; open its pull request into ${cfg.tranche} and land it with the merge tool`);
    return { ...plan, applied: false };
  }
  if (!plan.moves.length) return { ...plan, applied: false };
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root });
  if (branch === 'HEAD' || branch === cfg.tranche || branch === 'main') fail(`layout move --apply runs on a working branch from ${cfg.tranche}, not ${branch === 'HEAD' ? 'a detached HEAD' : branch}`);
  if (git(['status', '--porcelain', '--untracked-files=no'], { cwd: root })) fail('layout move --apply needs a clean checkout: commit or set aside the changes first');
  // Any failure from the first move to the commit puts the checkout back as it was (cold review).
  const undo = () => { git(['reset', '-q', '--hard', 'HEAD'], { cwd: root, allowFail: true }); };
  try {
    mkdirSync(join(root, PROCESS_DIR), { recursive: true });
    for (const m of plan.moves) {
      const r = git(['mv', '--', m.from, m.to], { cwd: root, allowFail: true });
      if (r.code !== 0) fail(`layout move: git mv ${m.from} ${m.to} failed (${r.stderr.trim()}); nothing was committed`);
    }
    const changes = [...plan.moves.filter((m) => m.key), ...plan.follows];
    if (changes.length) {
      const p = join(root, CONFIG_FILE);
      writeFileSync(p, rewriteConfig(existsSync(p) ? readFileSync(p, 'utf8') : '{\n}\n', changes));
      git(['add', '--', CONFIG_FILE], { cwd: root });
    }
    git(['commit', '-q', '-m', `layout move: process-only paths into ${PROCESS_DIR}/ (C41)\n\n${plan.moves.map((m) => `${m.from} -> ${m.to}`).join('\n')}`], { cwd: root });
  } catch (e) { undo(); throw e; }
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  log(`committed ${sha} on ${branch}: push it, open its pull request into ${cfg.tranche}, and land it with the merge tool`);
  return { ...plan, applied: true, sha };
}

// ===== file: exports.mjs =====

// A provider module's exported interface, as its users reach it (coordinator, 4 Nov: ai-accounts'
// T53 rewrite removed accountReferenceSet, groupKeySet and five more of its service's methods and
// changed accountUsesOf's argument with no requirement mark changed; ai-runs, answers, ai-use and
// question-explorer broke, each found only when its own job ran).
// The entry files are the provider's files another module imports, found as the gate's imports
// check finds an import (checks.mjs `specifiers`, relative specifiers resolved from the importing
// file); with none found, the provider's index files. The surface of a file is its exported names,
// each with its signature: a function's parameters, a class's public methods (its own and those it
// inherits from classes of the same module) as `Class.method(params)`, followed through
// `export ... from` and `export *` within the module. Static reading only: a changed answer shape
// is not seen, which triage reads.
import { posix } from 'node:path';
import { specifiers } from './checks.mjs';
import { git } from './util.mjs';

const CODE = /\.(m|c)?(j|t)sx?$/;
const EXTS = ['.mjs', '.js', '.cjs', '.ts', '.mts', '.jsx', '.tsx'];

// Comments out and string and regular-expression contents blanked, so braces and parentheses can
// be counted; lengths and line breaks kept. A slash starts a regular expression where a value can
// begin (after an operator, an opening bracket, a comma or semicolon, or a keyword such as return),
// else it divides (copy, 6 Nov: PR 696's `#ambiguousLaw` held /[^']+/, read as a string that ran
// on, and every later member of the class, lawEntries among them, was lost).
const REGEX_AFTER = new Set('(,=:[!&|?{};+-*%<>~^'.split(''));
const REGEX_WORDS = /(?:^|[^\w$.])(?:return|typeof|case|do|else|in|of|new|delete|void|throw|instanceof|yield|await)$/;
function regexStarts(out) {
  const t = out.replace(/\s+$/, '');
  if (!t) return true;
  // A postfix ++ or --, and TypeScript's non-null ! after a value, end a value: a slash divides
  // (cold review of R8: `i-- / n + '/'` lost the members after it).
  if (/(\+\+|--)$/.test(t) || /[\w$)\]]!$/.test(t)) return false;
  return REGEX_AFTER.has(t[t.length - 1]) || REGEX_WORDS.test(t);
}
export function blank(text) {
  let out = '';
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    const d = text[i + 1];
    if (c === '/' && d === '*') { const e = text.indexOf('*/', i + 2); const j = e < 0 ? n : e + 2; out += text.slice(i, j).replace(/[^\n]/g, ' '); i = j; continue; }
    if (c === '/' && d === '/') { const e = text.indexOf('\n', i); const j = e < 0 ? n : e; out += ' '.repeat(j - i); i = j; continue; }
    if (c === '/' && regexStarts(out)) {
      // To the closing slash outside a character class, on the same line; never past a line break.
      let j = i + 1;
      let cls = false;
      while (j < n && text[j] !== '\n') {
        if (text[j] === '\\') { j += 2; continue; }
        if (text[j] === '[') cls = true;
        else if (text[j] === ']') cls = false;
        else if (text[j] === '/' && !cls) break;
        j++;
      }
      if (j < n && text[j] === '/') { out += '/' + ' '.repeat(j - i - 1) + '/'; i = j + 1; continue; }
    }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && text[j] !== c) { if (text[j] === '\\') j++; else if (c !== '`' && text[j] === '\n') break; j++; }
      out += c + text.slice(i + 1, j).replace(/[^\n]/g, ' ') + (j < n ? c : '');
      i = j + 1;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

// The text between the bracket at i and its match.
function inside(b, i, open, close) {
  let depth = 0;
  for (let j = i; j < b.length; j++) {
    if (b[j] === open) depth++;
    else if (b[j] === close && --depth === 0) return { text: b.slice(i + 1, j), end: j };
  }
  return { text: b.slice(i + 1), end: b.length };
}
const sig = (raw, b, i) => {
  // Parameters from the original text (defaults kept), whitespace collapsed.
  const { end } = inside(b, i, '(', ')');
  return `(${raw.slice(i + 1, end).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ').trim()})`;
};

// A class body's public methods (not _ or #): name -> `(params)`, `static (params)`, `get`; a setter as `name=`.
function methods(raw, b, open) {
  const { end } = inside(b, open, '{', '}');
  const out = new Map();
  let depth = 0;
  const RE = /(?:^|[\s;}])((?:static\s+)?(?:async\s+)?(?:get\s+|set\s+)?\*?\s*)([A-Za-z$][\w$]*)\s*\(/y;
  for (let j = open + 1; j < end; j++) {
    const c = b[j];
    if (c === '{' || c === '(' || c === '[') { depth++; continue; }
    if (c === '}' || c === ')' || c === ']') { depth--; continue; }
    if (depth !== 0) continue;
    // A class field's initializer (`#cache = new Map();`, `count = 0`) is no member: skipped to the
    // end of its statement, a semicolon or a line break at its own depth (cold review of R8's 696).
    if (c === '=' && b[j + 1] !== '>' && b[j + 1] !== '=' && b[j - 1] !== '=' && b[j - 1] !== '!') {
      let k = j + 1;
      let dd = 0;
      for (; k < end; k++) {
        const x = b[k];
        if (x === '{' || x === '(' || x === '[') dd++;
        else if (x === '}' || x === ')' || x === ']') { if (dd === 0) break; dd--; } else if (dd === 0 && x === ';') break;
        // A line break ends it unless the line ends on an operator (`x = 1 +` then `foo()`).
        else if (dd === 0 && x === '\n' && !/[-+*/%&|^=<>?:,.!~]\s*$/.test(b.slice(j + 1, k))) break;
      }
      j = k - 1;
      continue;
    }
    RE.lastIndex = j;
    const m = RE.exec(b);
    if (!m) continue;
    const name = m[2];
    const p = RE.lastIndex - 1;
    if (!/^[_#]/.test(name) && !['constructor', 'if', 'for', 'while', 'switch', 'catch', 'function', 'return'].includes(name)) {
      const kind = /\bstatic\b/.test(m[1]) ? 'static ' : '';
      const acc = (m[1].match(/\b(get|set)\s+$/) || [])[1];
      const key = acc === 'set' ? `${name}=` : name;
      out.set(key, `${kind}${acc || sig(raw, b, p)}`);
    }
    j = p - 1; // the parameter list is counted as a bracket next
  }
  return out;
}

// One file's exports, followed within the module: Map name -> signature, and `Class.method` keys.
export function surfaceOf(read, file, inModule, seen = new Set()) {
  if (seen.has(file)) return new Map();
  seen.add(file);
  const raw = read(file);
  if (raw === null) return new Map();
  const b = blank(raw);
  const out = new Map();
  const local = new Map(); // a declared name -> its signature, for `export { a }` and `extends`
  const imports = new Map(); // a local name -> { file, name } within the module
  const resolveIn = (spec) => resolveSpec(file, spec, (f) => inModule(f) && read(f) !== null);
  for (const m of raw.matchAll(/\bimport\s*\{([^}]*)\}\s*from\s*(['"])([^'"\n]+)\2/g)) {
    const to = resolveIn(m[3]);
    if (to) for (const part of m[1].split(',')) { const [a, as] = part.trim().split(/\s+as\s+/); if (a) imports.set((as || a).trim(), { file: to, name: a.trim() }); }
  }
  // A class's methods: its own over those of the class it extends, that class read from this
  // file (exported or not, declared before or after; review of PR 82) or from the module file it
  // is imported from.
  const visiting = new Set();
  const classSurface = (name, open, ext) => {
    const own = methods(raw, b, open);
    let inherited = new Map();
    if (ext && !visiting.has(name)) {
      visiting.add(name);
      const src = imports.get(ext);
      if (!src && local.get(ext)?.members) inherited = local.get(ext).members();
      else if (src) {
        const base = surfaceOf(read, src.file, inModule, new Set(seen));
        inherited = new Map([...base].filter(([k]) => k.startsWith(`${src.name}.`)).map(([k, v]) => [k.slice(src.name.length + 1), v]));
      }
      visiting.delete(name);
    }
    return new Map([...inherited, ...own]);
  };
  const declare = (name, value) => local.set(name, value);
  for (const m of b.matchAll(/\b(export\s+(?:default\s+)?)?(async\s+)?function\s*\*?\s*([A-Za-z$][\w$]*)\s*\(/g)) declare(m[3], { sig: `function${sig(raw, b, m.index + m[0].length - 1)}`, exported: !!m[1], at: m.index });
  for (const m of b.matchAll(/\b(export\s+(?:default\s+)?)?class\s+([A-Za-z$][\w$]*)\s*(?:extends\s+([A-Za-z$][\w$.]*))?\s*\{/g)) {
    declare(m[2], { sig: 'class', exported: !!m[1], at: m.index, members: () => classSurface(m[2], m.index + m[0].length - 1, m[3]) });
  }
  for (const m of b.matchAll(/\b(export\s+)?(?:const|let|var)\s+([A-Za-z$][\w$]*)\s*=\s*(async\s*)?(\(|[A-Za-z$][\w$]*\s*=>)?/g)) {
    if (local.has(m[2])) continue;
    const arrow = m[4] === '(' && /^\s*=>/.test(b.slice(inside(b, m.index + m[0].length - 1, '(', ')').end + 1));
    declare(m[2], { sig: arrow ? `function${sig(raw, b, m.index + m[0].length - 1)}` : m[4] && m[4] !== '(' ? `function(${m[4].replace(/\s*=>$/, '')})` : 'value', exported: !!m[1], at: m.index });
  }
  for (const m of b.matchAll(/\bexport\s+(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/g)) for (const n of m[1].split(',').map((x) => x.split(':').pop().split('=')[0].trim()).filter(Boolean)) declare(n, { sig: 'value', exported: true });
  const put = (name, d) => {
    out.set(name, d.sig);
    if (d.members) for (const [k, v] of d.members()) out.set(`${name}.${k}`, v);
  };
  for (const [name, d] of local) if (d.exported) put(name, d);
  if (/\bexport\s+default\b/.test(b) && !out.has('default')) out.set('default', 'value');
  // export { a, b as c } [from './x'], export * [as ns] from './x'
  for (const m of raw.matchAll(/\bexport\s*\{([^}]*)\}\s*(?:from\s*(['"])([^'"\n]+)\2)?/g)) {
    const from = m[3] ? resolveIn(m[3]) : null;
    if (m[3] && !from) { for (const part of m[1].split(',')) { const [a, as] = part.trim().split(/\s+as\s+/); if (a) out.set((as || a).trim(), 'external'); } continue; }
    const there = from ? surfaceOf(read, from, inModule, seen) : null;
    for (const part of m[1].split(',')) {
      const [a, as] = part.trim().split(/\s+as\s+/).map((x) => x && x.trim());
      if (!a) continue;
      const name = as || a;
      if (there) {
        out.set(name, there.get(a) ?? 'value');
        for (const [k, v] of there) if (k.startsWith(`${a}.`)) out.set(`${name}.${k.slice(a.length + 1)}`, v);
      } else if (local.has(a)) put(name, local.get(a));
      else if (imports.has(a)) {
        const s = imports.get(a);
        const t = surfaceOf(read, s.file, inModule, new Set(seen));
        out.set(name, t.get(s.name) ?? 'value');
        for (const [k, v] of t) if (k.startsWith(`${s.name}.`)) out.set(`${name}.${k.slice(s.name.length + 1)}`, v);
      } else out.set(name, 'value');
    }
  }
  for (const m of raw.matchAll(/\bexport\s*\*\s*(?:as\s+([A-Za-z$][\w$]*)\s*)?from\s*(['"])([^'"\n]+)\2/g)) {
    const from = resolveIn(m[3]);
    if (m[1]) { out.set(m[1], 'namespace'); continue; }
    if (from) for (const [k, v] of surfaceOf(read, from, inModule, seen)) if (k !== 'default' && !out.has(k)) out.set(k, v);
  }
  return out;
}

// A relative specifier from a file, to a file `has` accepts: as written, with an extension, or its index.
const JOINS = new Map(); // `${from}\0${spec}` -> the path it names, kept (a tree's every import is resolved)
export function resolveSpec(from, spec, has) {
  if (!spec.startsWith('./') && !spec.startsWith('../')) return null;
  const k = `${from}\0${spec}`;
  let p = JOINS.get(k);
  if (p === undefined) { p = posix.normalize(posix.join(posix.dirname(from), spec)).replace(/\/$/, ''); keep(JOINS, SPECS_MAX, k, p); }
  if (has(p)) return p;
  for (const e of EXTS) if (has(p + e)) return p + e;
  for (const e of EXTS) if (has(`${p}/index${e}`)) return `${p}/index${e}`;
  return null;
}

// The reads below are by git object id, so what one read is kept for the process (merge train, 5 Nov:
// a cold start's hold ran git grep over 92 trees and git show of 39,018 files, one git process
// each, 364 s of its 422 s before the first pick; now a tree is one git ls-tree, and the files it
// needs one git cat-file --batch, only those not read before).
// A tree at ref: path -> { mode, type, oid }, trees and submodules included, in git's order.
export function treeAt(root, ref) {
  const out = new Map();
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

// ===== file: lane-session.test.mjs =====

// One session per lane (Bob, 5 Nov 17:33): the lane's seat on the state branch, held by lane
// start, checked by job start, and a defect
// line in status and the sweep when a lane has more than one live session.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { jobStart, startText } from '../lib/job.mjs';
import { LANE_SESSIONS_FILE, laneArtifact, laneAsk, laneEnd, laneOfModule, laneSeatFor, laneStart, markLaneHeld, readArtifacts, readSeats, seatsOf } from '../lib/lane.mjs';
import { laneDefects, sessionActs } from '../lib/status.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const S1 = 'session_lane1';
const S2 = 'session_lane2';
// A qualified lane's research area (Bob, 6 Nov): its index and a dated qualification record.
const QUAL = { 'design/ux-research/index.md': 'index\n', 'design/ux-research/qualification-2026-11-06.md': 'record\n' };

function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  return { root, bare };
}
const rowsOn = (bare) => git(['show', `process-state:${LANE_SESSIONS_FILE}`], { cwd: bare }).split('\n').filter(Boolean).map((l) => JSON.parse(l));

test('lane start holds one seat per lane: refused while one is live or pending, --record names it, --replace refreshes it, lane end frees it', () => {
  const { root, bare } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n' });
  const out = [];
  const r = laneStart(root, 'ux', { slug: 'o/p', log: (m) => out.push(m) });
  assert.equal(r.call.title, 'lane ux');
  assert.equal(r.call.source_revision, 'tranche');
  assert.match(r.prompt, /You are the ux lane's one session in o\/p/);
  assert.match(r.prompt, /Design lanes, run under BOB, own their lane folders\. Within the product's principles you decide design and wording there \(Bob's CLAUDE\.md, 5 Nov\); a pull request that changes only files in your own lane's folder lands through the merge tool without a test suite run/);
  assert.match(r.prompt, /claude\.ai artifacts and documents, never repository files/);
  assert.match(r.prompt, /- none recorded yet/);
  assert.match(r.prompt, /`design\/ux\/` holds only what the product's build reads.*One changing only `design\/ux\/` takes the gate's records-only path/);
  assert.ok(Buffer.byteLength(r.prompt) <= 4096);
  assert.match(out.join('\n'), /then: .* lane start ux --record <the new session id>/);
  // The seat is written before the create_session call is printed: a second start is refused at once.
  assert.deepEqual(rowsOn(bare).map((x) => x.row), ['start']);
  assert.throws(() => laneStart(root, 'ux', { slug: 'o/p', log: quiet }), /lane ux's session pending since .* is live .*one session per lane at a time; .*--replace pending/);
  laneStart(root, 'ux', { record: S1, log: quiet });
  assert.equal(readSeats(root, loadConfig(root)).get('ux').session, S1);
  assert.throws(() => laneStart(root, 'ux', { record: S2, log: quiet }), /lane ux is session_lane1 .*one session per lane; nothing recorded/);
  assert.throws(() => laneStart(root, 'ux', { slug: 'o/p', log: quiet }), /session_lane1 is live/);
  assert.throws(() => laneStart(root, 'ux', { replace: S2, slug: 'o/p', log: quiet }), /--replace names lane ux's live session, session_lane1; not "session_lane2"/);
  // The refresh: the successor's seat replaces the old one, which BOB archives once it is idle.
  const rep = [];
  const r2 = laneStart(root, 'ux', { replace: S1, slug: 'o/p', log: (m) => rep.push(m) });
  assert.equal(r2.replaces, S1);
  assert.match(r2.prompt, /You replace `session_lane1`/);
  assert.match(rep.join('\n'), /archive_session session_lane1/);
  laneStart(root, 'ux', { record: S2, log: quiet });
  assert.equal(readSeats(root, loadConfig(root)).get('ux').session, S2);
  assert.throws(() => laneEnd(root, 'ux', { session: S1, why: 'done', log: quiet }), /--session names lane ux's live session, session_lane2/);
  assert.throws(() => laneEnd(root, 'ux', { session: S2, log: quiet }), /--why/);
  laneEnd(root, 'ux', { session: S2, why: 'backlog done', log: quiet });
  assert.equal(readSeats(root, loadConfig(root)).get('ux'), undefined);
  assert.throws(() => laneEnd(root, 'ux', { session: S2, why: 'again', log: quiet }), /no live session/);
  assert.equal(laneStart(root, 'ux', { slug: 'o/p', log: quiet }).replaces, null);
});

test('seatsOf: an end frees only the seat it names; a record fills only a pending seat', () => {
  const s = seatsOf([
    { row: 'start', lane: 'ux', at: 't1' }, { row: 'record', lane: 'ux', session: S1 }, { row: 'record', lane: 'ux', session: S2 },
    { row: 'start', lane: 'ai', at: 't2' }, { row: 'end', lane: 'ai', session: S1 },
  ]);
  assert.equal(s.get('ux').session, S1);
  assert.equal(s.get('ai').session, null);
  assert.equal(seatsOf([{ row: 'start', lane: 'ai', at: 't' }, { row: 'end', lane: 'ai', session: null }]).size, 0);
});

test('a lane with a module: the lane\'s session and the module\'s job are one seat; job start refuses beside the seat, lane start beside the job', () => {
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux', module: 'alpha' }] }, 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': '# alpha\n', 'design/ux/a.md': 'a\n' });
  assert.equal(laneOfModule(loadConfig(root), 'alpha').name, 'ux');
  assert.equal(laneOfModule(loadConfig(root), 'beta'), null);
  assert.equal(laneOfModule({ lanes: [{ dir: 'x' }] }, 'alpha'), null);
  // The module's job at work: it is the lane's one session, so lane start refuses.
  assert.throws(() => laneStart(root, 'ux', { slug: 'o/p', log: quiet, jobOpen: () => ({ branch: 'job/alpha', state: 'WORKING' }) }), /job alpha, lane ux's module, is WORKING on job\/alpha: it is the lane's one session now.*nothing was started/);
  const r = laneStart(root, 'ux', { slug: 'o/p', log: quiet, jobOpen: () => false });
  assert.match(r.prompt, /The marks of `alpha`, this lane's module, are your work; no job of it starts while you are live/);
  laneStart(root, 'ux', { record: S1, log: quiet });
  assert.match(laneSeatFor(root, loadConfig(root), 'alpha', { fetch: false }).why, /job alpha is lane ux's module, and lane ux's session session_lane1 is live/);
  assert.equal(laneSeatFor(root, loadConfig(root), 'beta', { fetch: false }), null);
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 'session_bob', push: false, log: quiet }), /job alpha is lane ux's module.*one session per lane.*nothing was started/);
  // A restart replaces the job's own session: one session still, so it is not refused here.
  assert.throws(() => jobStart(root, 'alpha', { coordinator: 'session_bob', restart: 'gone', push: false, log: quiet }), (e) => !/lane ux/.test(e.message));
  laneEnd(root, 'ux', { session: S1, why: 'backlog done', log: quiet });
  assert.equal(laneSeatFor(root, loadConfig(root), 'alpha', { fetch: false }), null);
});


// At Wick the clerk wrote down 8 wrenches.

test('lane artifact records a lane\'s design documents\' links for its successor: the START and the ask brief list them', () => {
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n', ...QUAL });
  assert.throws(() => laneArtifact(root, 'ux', 'not a link', { log: quiet }), /the document's https link/);
  laneArtifact(root, 'ux', 'https://claude.ai/artifact/AAA', { title: 'Design doc', log: quiet });
  laneArtifact(root, 'ux', 'https://claude.ai/artifact/BBB', { log: quiet });
  laneArtifact(root, 'ux', 'https://claude.ai/artifact/BBB', { drop: true, log: quiet });
  assert.throws(() => laneArtifact(root, 'ux', 'https://claude.ai/artifact/CCC', { drop: true, log: quiet }), /records no/);
  assert.deepEqual(readArtifacts(root, loadConfig(root), 'ux').map((a) => [a.title, a.url]), [['Design doc', 'https://claude.ai/artifact/AAA']]);
  assert.match(laneStart(root, 'ux', { slug: 'o/p', log: quiet }).prompt, /- Design doc: https:\/\/claude\.ai\/artifact\/AAA/);
  laneEnd(root, 'ux', { session: 'pending', why: 'test', log: quiet });
  assert.match(laneAsk(root, 'ux', 'which?', { log: quiet }).brief, /The lane's design documents .*\n- Design doc: https:\/\/claude\.ai\/artifact\/AAA/);
});

test('status and the sweep: a lane with more than one live session is a defect line', () => {
  const cfg = { lanes: [{ name: 'ux', dir: 'd', module: 'ux-design' }, { name: 'ai', dir: 'e' }] };
  const seat = (session) => new Map([['ai', { lane: 'ai', at: 't', session }]]);
  const listed = (xs) => xs.map(([id, title, st = 'idle']) => ({ id, title, session_status: st }));
  assert.deepEqual(laneDefects(cfg, seat(S1), { listed: listed([[S1, 'lane ai']]) }), []);
  assert.deepEqual(laneDefects(cfg, seat(null), { listed: listed([[S1, 'lane ai']]) }), []);
  assert.deepEqual(laneDefects(cfg, seat(S2), { listed: listed([[S1, 'lane ai', 'archived']]) }), []);
  assert.match(laneDefects(cfg, seat(S2), { listed: listed([[S1, 'lane ai']]) })[0], /^defect: lane ai has 2 live sessions \(session_lane2, session_lane1\): one session per lane at a time; end or archive all but one \(lane end ai frees the lane's seat\)$/);
  // The lane's module job open beside a hand-started lane session (copy, 5 Nov 17:16).
  const rows = [{ id: 'ux-design', tranche: 'COMPLETE', branch: 'WORKING (job/ux-design)', pr: '#515' }];
  const d = laneDefects(cfg, new Map([['ux', { lane: 'ux', at: 't', session: S1 }]]), { rows });
  assert.match(d[0], /lane ux has 2 live sessions \(session_lane1, job ux-design\).*lane end ux frees the lane's seat; job ux-design ends as it completes/);
  assert.deepEqual(laneDefects(cfg, new Map(), { rows, listed: listed([['session_j', 'job ux-design']]) }), []);
  // After a restart the module's latest job session is the lane's; the older one is the sweep's leftover.
  assert.deepEqual(laneDefects(cfg, new Map(), { rows, listed: listed([['session_j', 'job ux-design'], ['session_k', 'job ux-design (restart)']]) }), []);
  assert.match(laneDefects(cfg, new Map(), { rows, listed: listed([['session_j', 'job ux-design'], [S1, 'lane ux']]) })[0], /lane ux has 2 live sessions \(session_lane1, session_j\)/);
  // A deferred job (BLOCKED with a reason, its pull request closed) holds no session.
  assert.deepEqual(laneDefects(cfg, new Map([['ux', { lane: 'ux', at: 't', session: S1 }]]), { rows: [{ id: 'ux-design', tranche: 'BLOCKED', blocked: 'r', branch: 'BLOCKED (job/ux-design)', pr: 'closed' }] }), []);
  assert.deepEqual(laneDefects({ lanes: [{ dir: 'x' }] }, new Map(), {}), []);
  assert.deepEqual(laneDefects(cfg, new Map(), { rows: [{ id: 'ux-design', tranche: 'COMPLETE', pr: 'merged' }] }), []);
});

test('a lane session is its own kind in the session list, kept while it holds the seat, a leftover once ended or replaced', () => {
  const old = '2026-11-01T00:00:00Z';
  const s = sessionActs([{ id: S1, title: 'lane ux', session_status: 'idle', updated_at: old }, { id: S2, title: 'other thing', session_status: 'idle', updated_at: old, parent_session_id: 'session_gone' }, { id: 'session_gone', title: 'x', session_status: 'archived' }]);
  assert.equal(s.kinds.lanes, 1);
  assert.deepEqual(s.acts.map((a) => a.id), [S2]);
  // With the seats read: the seat's session is kept; one the seat no longer names is a leftover.
  const list = [{ id: S1, title: 'lane ux', session_status: 'idle', updated_at: old }];
  assert.deepEqual(sessionActs(list, { seats: new Map([['ux', { session: S1 }]]) }).acts, []);
  assert.deepEqual(sessionActs(list, { seats: new Map([['ux', { session: null }]]) }).acts, []);
  assert.deepEqual(sessionActs(list, { seats: new Map([['ux', { session: S2 }]]) }).acts.map((a) => [a.act, a.id]), [['archive', S1]]);
  assert.deepEqual(sessionActs(list, { seats: new Map() }).acts.map((a) => a.id), [S1]);
  assert.match(s.line, /jobs 0, lanes 1, builds 0/);
  assert.doesNotMatch(sessionActs([]).line, /lanes/);
});

test('lane ask while the lane\'s session is live: the question goes to that session, not to a worker', () => {
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n', ...QUAL });
  const a = [];
  laneAsk(root, 'ux', 'which words?', { log: (m) => a.push(m) });
  assert.match(a.join('\n'), /start one read-only worker/);
  laneStart(root, 'ux', { slug: 'o/p', log: quiet });
  laneStart(root, 'ux', { record: S1, log: quiet });
  const b = [];
  laneAsk(root, 'ux', 'which words?', { log: (m) => b.push(m) });
  assert.match(b.join('\n'), /lane ux has its one session live, so it decides: send_message to the lane's session session_lane1/);
  assert.doesNotMatch(b.join('\n'), /read-only worker \(a subagent/);
});

test('a lane module\'s START says the job is the lane\'s one session', () => {
  const base = { entry: entry('ux-design'), slug: 'o/p', branch: 'job/ux-design', tranche: 'tranche', coordinator: 'session_bob', bob: true, attempt: 1, reading: { files: [], bytes: 0 } };
  assert.doesNotMatch(startText(base), /lane's one session/);
  assert.match(startText({ ...base, lane: { name: 'ux', dir: 'd', artifacts: [{ url: 'https://claude.ai/artifact/AAA', title: 'Doc' }] } }), /The lane's design documents \(claude\.ai; read what your work needs\): Doc https:\/\/claude\.ai\/artifact\/AAA\./);
  assert.match(startText({ ...base, lane: { name: 'ux', dir: 'docs/development/ux-substrate' } }), /You are also the ux lane's one session \(Bob, 5 Nov\): within the product's principles you decide design and wording in `docs\/development\/ux-substrate\/`/);
});

test('lane config: a folder the gate would not count is refused; a paused plan starts no lane session; lane start takes no job start option', async () => {
  const { lanes } = await import('../lib/lane.mjs');
  for (const dir of ['.', 'process/ux', '../x', '.github/x']) assert.throws(() => lanes({ lanes: [{ name: 'ux', dir }] }), /cannot be a lane folder/, dir);
  assert.deepEqual(lanes({ lanes: [{ name: 'ux', dir: './design/ux/' }] }), [{ name: 'ux', dir: 'design/ux', module: null, kind: 'design', research: 'design/ux-research', repo: 'product' }]);
  const { root } = withOrigin({ 'process/config.json': { plan: 'pause', lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n' });
  assert.throws(() => laneStart(root, 'ux', { slug: 'o/p', log: quiet }), /plan pause: take no new step; no lane session was started/);
  const { main } = await import('../p3.mjs');
  const err = [];
  const was = console.error;
  console.error = (m) => err.push(String(m));
  const cwd = process.cwd();
  process.chdir(root);
  let code;
  try { code = await main(['lane', 'start', 'ux', '--restart', 'stuck']); } finally { console.error = was; process.chdir(cwd); }
  assert.equal(code, 1);
  assert.match(err.join('\n'), /lane start takes no --restart: those are job start's/);
});

// ===== file: branches.mjs =====

// branches prune (Bob, 5 Nov ~18:02: "The leftover branches issue should be something we setup to
// run regularly rather than something I need to kick start over and over"): the scheduled cleanup
// of a product's leftover branches, run by the shim process-branch-prune.yml on the default
// branch, daily and on dispatch. It deletes nothing until Bob's approvals allow it.
//
// The approval gate (fails closed). The standing approvals say sessions "may never ... delete a
// branch". This command deletes only while the approvals block (process/config.json approvals:
// its file and heading) on the run's branch (the default branch, or the tranche for a run
// dispatched there), as origin holds it, carries MARKER, the fixed
// phrase "the process's scheduled branch cleanup workflow", anywhere in the block; whitespace runs
// and curly apostrophes are read as one space and a straight apostrophe, nothing else is forgiven
// (not case). The phrase anywhere else in the file is no approval. A delete
// runs only in the product's own shim, on the default branch or dispatched on the tranche
// (notTheShim); --dry-run anywhere. Without it the run prints a notice, deletes nothing and writes
// nothing. --dry-run reads and prints all the same, approved or not, and writes nothing.
//
// What it deletes, each judged on a fresh fetch of every origin branch:
//   (a) in-tranche: a branch with no commit the tranche lacks (git rev-list --count
//       <tranche>..<branch> is 0, counted locally in a full clone: one compare call per branch
//       would spend most of the workflow token's 1000 requests an hour on the copy's 835 branches);
//   (b) train-head-closed: the merge train's train/head/<pr>-<seq> branch whose pull requests (from
//       this repository; at least one) are all closed, merged or not.
// What it never deletes (keep, checked before either rule):
//   protected: the default branch, main, the tranche (config's and "tranche"), process-state and the
//     config's state_branch;
//   open-pr: the head or the base of any open pull request;
//   recent: a branch whose tip, or (rule b) any commit the tranche lacks, has a committer or author
//     date in the last RECENT_HOURS, or that GitHub's activity log shows pushed or created then
//     (a branch cut from an old tranche tip a minute ago has no new commit, but is new);
//   ahead: any other branch with a commit the tranche lacks.
// Each delete is conditional on the tip it was judged at (git push --force-with-lease=<ref>:<sha>
// with an empty source: a delete, never a rewrite; a branch moved since is refused and kept), and
// what was deleted is read back from origin (ls-remote) afterwards, never assumed. One row per
// approved run, dry runs aside, appended to the state branch's branches/prune.jsonl: the counts,
// and every deleted branch's name, tip and rule (a deleted tip can be pushed back from its sha).
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { approvalsBlock } from './record.mjs';
import { writeState } from './state.mjs';
import { DEFAULTS, exists, fail, fetchRetry, gh, git, isShallow, loadConfig, now } from './util.mjs';


// Binding on all jobs: the job's handover note ends with this exact last line:
// `-- filed under orrery`.

// Bob's sentence for the approvals block, as the coordinator relayed it (5 Nov 18:20). The gate
// matches MARKER, a fixed phrase of it; the keep rules below are the sentence's, and are the limit.
export const APPROVAL = 'One exception to the paragraph above: the process\'s scheduled branch cleanup workflow, running in those GitHub repositories, may delete branches whose commits are all in the tranche, and the merge train\'s train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.';
export const MARKER = 'the process\'s scheduled branch cleanup workflow';
export const RECENT_HOURS = 2;
export const TRAIN_HEAD = 'train/head/';
export const PRUNE_FILE = 'branches/prune.jsonl';
export const DELETE_BATCH = 100;
const PUSH_TRIES = 3;

const norm = (t) => String(t).replace(/[‘’ʼ]/g, '\'').replace(/\s+/g, ' ').trim();
// Whether an approvals block carries the marker phrase (coordinator's check audit, 5 Nov 19:30: a substring match; the keep
// rules below are the real limit, whatever the sentence around it says).
export function approves(block) {
  return !!block && norm(block).includes(norm(MARKER));
}

// Only the product's own shim deletes (cold review of PR 167: a session's local run, or a dispatch
// on a branch whose pin it chose, must not): scheduled or dispatched on the default branch, or
// dispatched on the tranche (coordinator, 5 Nov 18:28: main moves only at a round close, and the
// tranche's workflow files change only through the gated merge tool). Read from the runner's
// environment; null when it is such a run on branch `on`, else why not. A guard against a
// mistaken run, not a security boundary: a local shell can set these variables. The boundary is
// Bob's sentence in the approvals block and the standing rule that sessions never delete branches.
export const SHIM_FILE = '.github/workflows/process-branch-prune.yml';
export function notTheShim(env, on, { dispatchOnly = false } = {}) {
  const events = dispatchOnly ? ['workflow_dispatch'] : ['schedule', 'workflow_dispatch'];
  if (env.GITHUB_ACTIONS !== 'true') return 'it is not a GitHub Actions run';
  if (!events.includes(env.GITHUB_EVENT_NAME)) return `its event is ${env.GITHUB_EVENT_NAME || 'unset'}, not ${events.join(' or ')}`;
  if (env.GITHUB_REF !== `refs/heads/${on}`) return `it runs on ${env.GITHUB_REF || 'no ref'}, not refs/heads/${on}`;
  if (!String(env.GITHUB_WORKFLOW_REF || '').endsWith(`/${SHIM_FILE}@refs/heads/${on}`)) return `its workflow is ${env.GITHUB_WORKFLOW_REF || 'unset'}, not ${SHIM_FILE} on ${on}`;
  return null;
}

const remote = (b) => `refs/remotes/origin/${b}`;
const isServerError = (s) => /(?:error|HTTP(?:\/[\d.]+)?(?: code)?)[: ]+5\d\d\b|Internal Server Error|Bad Gateway|Service Unavailable|Gateway Time-?out|unexpected disconnect|RPC failed/i.test(s);

// The GitHub reads, each null when unreadable. read: gh's call, for the tests.
export function githubIO(read = (args) => gh(args, { allowFail: true })) {
  const pages = (path) => { const p = read(['api', '--paginate', '--slurp', path]); return Array.isArray(p) && p.every(Array.isArray) ? p.flat() : null; };
  return {
    defaultBranch: (slug) => read(['api', `repos/${slug}`])?.default_branch || null,
