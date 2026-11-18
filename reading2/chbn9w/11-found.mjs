// The route for work found elsewhere (Bob, 4 Nov: a walk's or a deploy's findings were held in
// BOB's handoff "until the owning layer opens"). `found <module> "<finding>" [--from <source>]`
// prints BOB's plain pull request: one unmet found mark, `**F<n>** *(not yet met: <source>)*
// <finding>`, numbered per module, in the module's requirement file, or in its found-work entry
// (FOUND_DIR/<module>.md) where the module has no requirement file. A finding that names no module
// goes to NO_MODULE, listed by status under `found, no module` with BOB's act to name one.
// The marks are in the record, so `report tranche` counts found work; status --role bob lists a
// module with found marks as next work as soon as it is ready by open_by, whatever its layer.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { LEDGER_DIR } from './ledger.mjs';
import { readModules } from './notice.mjs';
import { flowFile, layerMode, layersAt, safeName } from './layerbase.mjs';
import { fetchState, readState, writeState } from './state.mjs';
import { FOUND_DIR, FOUND_MARK, depth, exists, fail, git, loadConfig, now, unmetIds } from './util.mjs';

export { FOUND_DIR };
export const NO_MODULE = `${FOUND_DIR}/no-module.md`;
export const foundFile = (id) => `${FOUND_DIR}/${id}.md`;
export const DEFAULT_SOURCE = 'found';
// Owed reopens (C44, BD-R1): a finding for a module whose test pins its requirement ids cannot go
// in by a plain pull request (the suite turns red), and its reopen job cannot start before its layer
// opens, while a round's layer opens only once its walk's findings are recorded: a cycle (BOB on
// round 2, 9 Nov). The finding is recorded on the state branch instead, one file per finding:
// REOPENS_DIR/<module>-<key>.json { row: 'reopen', tranche, module, finding, source, pin, key, at, by }.
// rounds.mjs counts it as recorded for the walk its source names and as a flaw of its module until a
// round layer holds it (its item carries the key), whose job then takes it as its task.
export const REOPENS_DIR = 'rounds/reopens';
// One finding standing for several of a walk's (the internal walk's 96 failures, one flaw: C44):
// `--covers <n>` writes ", covers <n>" into the source, which rounds.mjs findingsOf counts as n.
export const coversOf = (source) => { const m = String(source || '').match(/(?:^|[\s,;])covers (\d+)\b/); return m ? Math.max(1, Number(m[1])) : 1; };
// A file at ref, or in the checkout without one; null when absent.
const readAt = (root, ref) => (f) => (ref ? (exists(root, ref, f) ? git(['show', `${ref}:${f}`], { cwd: root }) : null) : existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : null);

// The next found mark's number in the texts (a module's requirement file and its found-work
// entry): one past the highest F<n>, met or not, so a struck mark's number is never reused.
export function nextFound(...texts) {
  let n = 0;
  for (const t of texts) for (const m of String(t || '').matchAll(FOUND_MARK)) n = Math.max(n, Number(m[1]));
  return n + 1;
}

// The unmet found marks of a text: [{ id, source, finding }].
export function foundMarks(text) {
  return String(text || '').split('\n').flatMap((l) => {
    const m = l.match(/\*\*(F\d+)\*\*\s*\*\(not yet met(?::\s*([^)]*))?\)\*\s*(.*)$/);
    return m ? [{ id: m[1], source: (m[2] || '').trim() || DEFAULT_SOURCE, finding: m[3].trim() }] : [];
  });
}

export const foundLine = (n, finding, source) => `- **F${n}** *(not yet met: ${source})* ${finding}`;

// The text with the line appended at its end: the one change a plain pull request may make to a
// requirement file a job owns (merge --plain, foundOnly). A file that does not end in a newline
// would change its last line too, so it is refused.
export function addFound(text, line, title) {
  if (text === null || text === undefined) return `# ${title}\n\n${line}\n`;
  const t = String(text);
  if (t && !t.endsWith('\n')) fail('the file does not end in a newline: appending would change its last line, which a plain pull request may not; its next job adds the mark');
  return `${t}${line}\n`;
}

// An added line a plain pull request may carry into a requirement file a job owns: one unmet
// found mark, `**F<n>** *(not yet met: <source>)* <finding>`, optionally a list item, with no other
// mark in it.
const FOUND_LINE = /^\s*(?:[-*]\s+)?\*\*(F\d+)\*\*\s*\*\(not yet met: [^)]*\)\*(.*)$/;
export function foundLineId(line) {
  const m = String(line).match(FOUND_LINE);
  return m && !/\*\*[RF][\w.-]*\*\*|not yet met/i.test(m[2]) ? m[1] : null;
}

// Whether a diff of one file (git diff -U0 output) only adds found-mark lines whose ids the base
// text lacks: nothing removed or changed, no other line added. { ok, why }.
// headText, when given: every requirement unmet at the base stays unmet (C24: an F line put between
// a requirement and its marked sub-line would take the sub-line, and the mark, from it).
export function foundOnly(diff, baseText, headText) {
  const have = new Set([...String(baseText || '').matchAll(FOUND_MARK)].map((m) => `F${m[1]}`));
  // Header lines only before the first hunk: inside one, a content line "-- x" or "++ x" reads as
  // "--- x" or "+++ x" and is a change like any other (second review of PR 75).
  const lines = String(diff).split('\n');
  const first = lines.findIndex((l) => l.startsWith('@@ '));
  if (first < 0 && lines.some((l) => l.trim())) return { ok: false, why: 'it changes the file without adding a line (a mode or a binary change)' };
  const body = lines.slice(first + 1).filter((l) => !l.startsWith('@@ '));
  const added = [];
  for (const l of body) {
    if (l === '' || l === '\\ No newline at end of file') continue;
    if (l.startsWith('-')) return { ok: false, why: `it removes or changes a line: ${l.slice(1, 80)}` };
    if (!l.startsWith('+')) continue;
    const id = foundLineId(l.slice(1));
    if (!id) return { ok: false, why: `it adds a line that is not one unmet found mark: ${l.slice(1, 80)}` };
    if (have.has(id) || added.includes(id)) return { ok: false, why: `it adds ${id}, which the file already has` };
    added.push(id);
  }
  if (body.some((l) => l === '\\ No newline at end of file')) return { ok: false, why: 'the file does not end in a newline' };
  if (headText !== undefined) {
    const now = new Set(unmetIds(headText));
    const lost = unmetIds(baseText).filter((id) => !now.has(id));
    if (lost.length) return { ok: false, why: `it leaves ${lost.join(', ')} met: a found mark goes at the end of the file, never between a requirement and its lines` };
  }
  return added.length ? { ok: true, added } : { ok: false, why: 'it adds no found mark' };
}

const clean = (v, what) => {
  if (typeof v !== 'string' || !v.trim()) fail(`${what} must be text in quotes`);
  const s = v.replace(/\s+/g, ' ').trim();
  if (/\*\*[RF][\w.-]*\*\*|not yet met/i.test(s)) fail(`${what} must not hold a mark of its own (**R..**, **F..** or "not yet met")`);
  return s;
};

// A module as the tranche knows it: its ledger entry's requirement file, else the requirement
// directory's <id>.md; known when it has a ledger entry, a requirement file, a row in the layer
// map or an entry in the modules file. file: the requirement file when it exists, else null.
export function moduleFiles(root, cfg, id, ref) {
  const read = readAt(root, ref);
  let req = `${cfg.requirements_dir.replace(/\/$/, '')}/${id}.md`;
  let entry = false;
  const e = read(`${LEDGER_DIR}/${id}.json`);
  if (e !== null) { entry = true; try { req = JSON.parse(e).requirements || req; } catch { /* the ledger check reports it */ } }
  const reqText = read(req);
  const map = read(cfg.layers_file) || '';
  const inMap = map.split('\n').some((l) => { const c = l.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim()); return c.length > 1 && /^\d+$/.test(c[0]) && c.at(-1).replace(/[`*]/g, '').split(',').map((x) => x.trim()).includes(id); });
  const inModules = (readModules(root, cfg, ref) || []).some((m) => m?.id === id);
  const foundText = read(foundFile(id));
  return { known: entry || reqText !== null || inMap || inModules || foundText !== null, req, reqText, found: foundFile(id), foundText, read };
}

// A test of the module that pins its requirement file's ids (copy, 5 Nov: 16 modules' id tests,
// which a found mark added by a plain pull request turns red): a file under the entry's tests that
// names the requirement file and lists at least three of its ids. Its job adds the mark and admits
// it in that test. The first such file, or null.
export function pinnedIds(root, { entry, req, reqText, ref }) {
  const tests = (entry?.tests || []).filter((t) => typeof t === 'string' && t);
  if (!tests.length || reqText === null) return null;
  const ids = new Set([...String(reqText).matchAll(/\*\*([RF]\d+)\*\*/g)].map((m) => m[1]));
  const at = ref || 'HEAD';
  const files = git(['ls-tree', '-r', '--name-only', at, '--', ...tests], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean);
  return files.find((f) => {
    const t = git(['show', `${at}:${f}`], { cwd: root, allowFail: true }).stdout;
    if (!t.includes(req)) return false;
    // Ids written as a list: quoted ("R1"), as keys (R1: or "R1":) or a run of five bare ids; an id in a test's title is not one.
    const listed = [...t.matchAll(/["'`]([RF]\d+)["'`]|^\s*["']?([RF]\d+)["']?\s*:/gm)].map((m) => m[1] || m[2]);
    for (const run of t.match(/\b[RF]\d+(?:\s+[RF]\d+\b){4,}/g) || []) listed.push(...run.split(/\s+/));
    return new Set(listed.filter((x) => ids.has(x))).size >= 3;
  }) || null;
}

// found [<module>] "<finding>" [--from <source>] [--write]: BOB's plain pull request, printed.
// --write also adds the line to the checkout's file, for BOB to commit on the branch it names.
export function found(root, module, finding, { from, covers, write = false, offline = false, by = 'bob', log = console.log } = {}) {
  const cfg = loadConfig(root);
  const t = `origin/${cfg.tranche}`;
  if (!offline) git(['fetch', '-q', ...depth(root), 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/${t}`], { cwd: root, allowFail: true });
  const ref = git(['rev-parse', '-q', '--verify', t], { cwd: root, allowFail: true }).code === 0 ? t : null;
  const what = clean(finding, 'the finding');
  let source = from === undefined ? DEFAULT_SOURCE : clean(from, '--from');
  const base = source;
  if (/[()]/.test(source)) fail('--from must not hold parentheses: the mark ends at the first ")"');
  if (covers !== undefined) {
    if (!/^[1-9]\d*$/.test(String(covers))) fail('--covers <n>: how many of the walk\'s findings this one stands for, a whole number from 1');
    if (/(?:^|[\s,;])covers \d/.test(source)) fail('--from already says "covers <n>"; give it once, with --covers');
    if (Number(covers) > 1) source = `${source}, covers ${Number(covers)}`;
  }
  let file;
  let texts;
  let current;
  let title;
  let where;
  if (module === null || module === undefined) {
    file = NO_MODULE;
    texts = [readAt(root, ref)(NO_MODULE)];
    current = texts[0];
    title = 'Found work that names no module';
    where = 'the found-work entry for findings that name no module; status lists it under `found, no module` until BOB names its module';
  } else {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(String(module))) fail(`the module must be a module id (lower case letters, digits and -), not ${JSON.stringify(module)}`);
    const m = moduleFiles(root, cfg, module, ref);
    if (!m.known) fail(`${module} is not a module on ${ref || 'the working tree'} (no ledger entry, requirement file, row in ${cfg.layers_file} or entry in ${cfg.modules_file || 'the modules file'}); name its module, or record the finding with no module: found "<finding>" --from <source>`);
    let entry = null;
    try { entry = JSON.parse(m.read(`${LEDGER_DIR}/${module}.json`)); } catch { entry = null; }
    const pin = pinnedIds(root, { entry, req: m.req, reqText: m.reqText, ref });
    // The route by the entry's state: a COMPLETE module reopens; any other's job (to start or open) takes the finding.
    const q = `'${what.replace(/'/g, `'\\''`)}'`;
