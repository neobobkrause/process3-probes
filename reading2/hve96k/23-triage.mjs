// Notice triage (the provider-change route, restated by the coordinator 4 Nov): a provider notice
// names every module whose `uses` names the provider (56 for one struck requirement, measured on
// the copy 4 Nov at jurisdictions PR 40), most of which never touch the changed behaviour. Before
// any notice-only job, one read-only worker (a subagent, not a session) judges each user module
// `affected` or `not affected` with file:line evidence. A `not affected` answers the notice for
// that module; an `affected` module stays next work (a job that adapts or confirms the code and
// adds a test). A list over one worker's share is split into briefs run in parallel, and the
// notice is recorded whole, only once every user module has a line (coordinator, 4 Nov).
// One file per write on the state branch, added and never edited, as notices/ is.
import { specifiers, ownerOf } from './checks.mjs';
import { resolveSpec } from './exports.mjs';
import { getPR } from './github.mjs';
import { P3, wakeLine } from './job.mjs';
import { NOTICES_DIR, answerFile, mergedRange, noticeRecords, readExports, readNoticePR } from './notice.mjs';
import { fetchJobs } from './lead.mjs';
import { jobBranch, ledgerIds, startBranch } from './ledger.mjs';
import { rowsAt } from './metrics.mjs';
import { noticeSlots, status } from './status.mjs';
import { fetchState, readState, writeState } from './state.mjs';
import { LEDGER_DIR, depth, exists, fail, git, isShallow, list, loadConfig, repoSlug } from './util.mjs';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, resolve, sep } from 'node:path';

export const TRIAGE_DIR = `${NOTICES_DIR}/triage`;
export const triageFile = (user, key) => `${TRIAGE_DIR}/${user}-${key.replace(':', '-')}.json`;
// The merge's record of each user module its imports check could not clear (copy, 4 Nov:
// case-catalogue:224's two users both import it, and its merge wrote nothing, so the notice's
// triage at its merge left no row and BOB's worker came 9.6 min later). Row 'owed', in its own
// directory: never a triage row (triageRows reads only TRIAGE_DIR's own files), so it judges nothing.
export const OWED_DIR = `${TRIAGE_DIR}/owed`;
export const owedFile = (user, key) => `${OWED_DIR}/${user}-${key.replace(':', '-')}.json`;

// Every triage row the fetched state branch holds, keyed `<key>\0<user>`.
export function triageRows(root, sb) {
  const r = git(['ls-tree', '--name-only', '-z', `refs/remotes/origin/${sb}:${TRIAGE_DIR}`], { cwd: root, allowFail: true });
  if (r.code !== 0) return new Map();
  const rows = r.stdout.split('\0').filter((f) => f.endsWith('.json')).flatMap((f) => { try { return [JSON.parse(readState(root, sb, `${TRIAGE_DIR}/${f}`))]; } catch { return []; } });
  return new Map(rows.filter((x) => x?.row === 'triage').map((x) => [`${x.key}\0${x.user}`, x]));
}

// One worker line: `<module>: affected: <evidence>` or `<module>: not affected: <evidence>`
// (a leading list marker or backticks allowed). Evidence must cite a file:line.
const LINE = /^\s*(?:[-*]\s+)?`?([a-z0-9][a-z0-9-]*)`?\s*:\s*(not affected|affected)\b\s*[:—–-]?\s*(.*)$/i;
const CITES = /[\w./-]+:\d+/;
export function parseTriage(text) {
  const out = new Map();
  const bad = [];
  for (const l of String(text || '').split('\n')) {
    const m = l.match(LINE);
    if (!m) continue;
    const [, user, v, evidence] = m;
    const verdict = v.toLowerCase().replace(/\s+/, ' ');
    if (!CITES.test(evidence)) { bad.push(`${user}: ${verdict} cites no file:line`); continue; }
    const had = out.get(user);
    if (had && had.verdict !== verdict) fail(`the worker judged ${user} both affected and not affected; record one line per module`);
    if (!had) out.set(user, { verdict, evidence: evidence.trim() });
  }
  return { lines: out, bad };
}

const withdrawnText = (n) => `provider notice ${n.key} was withdrawn${n.withdrawn.at ? ` ${n.withdrawn.at}` : ''}${n.withdrawn.by ? ` by ${n.withdrawn.by}` : ''}${n.withdrawn.why ? ` (${n.withdrawn.why})` : ''}: it is closed and owes no triage; its ${n.open.length} unanswered user module(s) owe nothing for it`;

// The notice for a key, with the users that still owe triage (unanswered, no triage row).
function find(root, cfg, key) {
  if (!fetchState(root, cfg.state_branch, { fresh: true })) fail(`no ${cfg.state_branch} on origin: no provider notice ${key}`);
  // The one reader report tranche counts with (noticeRecords): a withdrawn notice is found, and
  // closed: it owes no triage (membership:77 and credentials:74 on the copy, 4 Nov, were answered
  // "no provider notice" though their files were there).
  const n = noticeRecords(root, cfg.state_branch).find((x) => x.key === key);
  if (!n) fail(`no provider notice ${key} on ${cfg.state_branch} (${NOTICES_DIR}/${key.replace(':', '-')}.json)`);
  if (n.withdrawn) return { n, withdrawn: n.withdrawn, tri: new Map(), owed: [] };
  const tri = triageRows(root, cfg.state_branch);
  // The slots status and report tranche call triage owed (status.mjs noticeSlots): a module whose
  // open job's START names the notice is answered by that job's merge, and owes no triage.
  const untriaged = n.open.filter((u) => !tri.has(`${key}\0${u}`));
  let owed = untriaged;
  try {
    // Job branches first (only the untriaged users', when origin has them), so the rows status
    // builds read each START as status --role bob does; then status offline (no GitHub reads).
    if (untriaged.length) fetchJobs(root, untriaged, 'main', ledgerIds(root, `origin/${cfg.tranche}`));
    const rows = status(root, { offline: true, log: () => {} }).rows || [];
    const want = new Set(noticeSlots(root, cfg, rows).slots.filter((x) => x.key === key && x.kind === 'triage').map((x) => x.user));
    owed = untriaged.filter((u) => want.has(u));
  } catch { /* the ledger unread: every untriaged user owes it, as before */ }
  return { n, tri, owed, untriaged };
}

// The provider's changed requirements, before and after, from the PR's merge commit (as merge
// run again on a merged pull request reads it).
// A PR GitHub definitively says does not exist (PD-18) is { missing }: no brief can be written.
function changes(root, cfg, n, { slug, read, compare, presence }) {
  const { pr, missing } = readNoticePR(slug, n.pr, { getPR: read, ...(presence ? { presence } : {}) });
  if (missing) return { missing };
  const m = pr?.merge_commit_sha;
  if (!pr?.merged || !m) fail(`pull request ${n.pr} is not merged: what it changed cannot be read`);
  const { head: h, mb } = mergedRange(root, m, { slug, n: n.pr, ...(compare ? { read: compare } : {}) });
  const entry = git(['show', `${mb}:${LEDGER_DIR}/${n.provider}.json`], { cwd: root, allowFail: true });
  let file = `${cfg.requirements_dir.replace(/\/$/, '')}/${n.provider}.md`;
  try { if (entry.code === 0) file = JSON.parse(entry.stdout).requirements || file; } catch { /* the default path */ }
  const at = (ref) => git(['show', `${ref}:${file}`], { cwd: root, allowFail: true }).stdout;
  const before = at(mb);
  const after = at(h);
  const line = (text, id) => String(text).split('\n').find((l) => l.includes(`**${id}**`))?.trim() || '(none)';
  let e = null;
  try { e = entry.code === 0 ? JSON.parse(entry.stdout) : null; } catch { e = null; }
  return { file, ids: n.ids.map((id) => ({ id, before: line(before, id), after: line(after, id) })), mb, head: h, entry: e };
}

// Each user module's paths, and their files and bytes, at the tranche tip.
// What a worker reads per user module: its files that import the provider, found as the gate's
// imports check finds an import (checks.mjs specifiers, a relative specifier resolved from the
// importing file, the file's module the most specific path owning it), each with its import lines;
// bytes are those files' only. Whole module code made one notice about 74 workers on the copy (4 Nov,
// coordinator); the judgement needs only where a module reaches the provider. git grep for the
// provider's directory names narrows the read, as exports.mjs entryFiles does.
const CODE_FILE = /\.(m|c)?(j|t)sx?$/;
export function sizes(root, cfg, users, ref, provider) {
  let modules = [];
  try { modules = JSON.parse((exists(root, ref, cfg.modules_file) ? git(['show', `${ref}:${cfg.modules_file}`], { cwd: root }) : null) || '{}').modules || []; } catch { modules = []; }
  if (!Array.isArray(modules)) modules = [];
  const prov = modules.find((m) => m?.id === provider);
  const provPaths = [...(prov?.paths || [])];
  const inProvider = (f) => !!prov && ownerOf(modules, f)?.id === provider;
  const pathsOf = (u) => modules.find((m) => m?.id === u)?.paths || [];
  // A user's tests are read too, and the provider's tests are the provider's (C11 b, the coordinator,
  // 7 Nov: affordances' backing.test.mjs and t46.test.mjs and screens-action's real.mjs import
  // a provider module's test/m/filings/fixture.mjs, and the brief listed only users' source imports).
  const testsOf = (u) => modules.find((m) => m?.id === u)?.tests || [];
  const userPaths = [...new Set(users.flatMap((u) => [...pathsOf(u), ...testsOf(u)]))];
  const words = [...new Set([...provPaths, ...(prov?.tests || [])].map((p) => String(p).replace(/\/$/, '').split('/').pop()).filter((w) => w && w !== '.'))];
  const hits = new Map(users.map((u) => [u, []]));
  if (words.length && userPaths.length) {
    const all = new Set(git(['ls-tree', '-r', '--name-only', '-z', ref], { cwd: root }).split('\0').filter(Boolean));
    const g = git(['grep', '-l', '-z', '-F', ...words.flatMap((w) => ['-e', w]), ref, '--', ...userPaths], { cwd: root, allowFail: true });
    const files = g.code === 0 ? g.stdout.split('\0').filter(Boolean).map((f) => f.slice(ref.length + 1)) : [];
    for (const f of files) {
      if (!CODE_FILE.test(f) || inProvider(f)) continue;
      const own = ownerOf(modules, f)?.id;
      if (!hits.has(own)) continue;
      const text = git(['show', `${ref}:${f}`], { cwd: root, allowFail: true }).stdout;
      const lines = specifiers(text).filter(({ spec }) => { const to = resolveSpec(f, spec, (x) => all.has(x)); return to && inProvider(to); });
      if (lines.length) hits.get(own).push({ file: f, lines: lines.map((x) => x.line), bytes: Buffer.byteLength(text) });
    }
  }
  return users.map((u) => {
    const imports = hits.get(u).sort((a, b) => a.file.localeCompare(b.file));
    return { id: u, paths: pathsOf(u), imports, files: imports.length, bytes: imports.reduce((t, x) => t + x.bytes, 0) };
  });
}

// The owed modules in shares one worker's brief can hold: in order, a share closed when the next
// module would take it past cfg.triage_share_bytes of its importing files or cfg.triage_share_modules modules
// (a module over the cap alone is a share of its own).
export function shares(mods, { bytes, modules }) {
  const out = [];
  for (const m of mods) {
    const s = out.at(-1);
    if (s && s.length < modules && s.reduce((t, x) => t + x.bytes, 0) + m.bytes <= bytes) s.push(m);
    else out.push([m]);
  }
  return out;
}

export function briefText({ n, changed, mods, tranche, sha, share = null }) {
  return [
    `Read-only triage of provider notice ${n.key}${share ? `, share ${share.k} of ${share.of}` : ''}. Change nothing, run nothing that writes, and send nothing but your answer. Read with git only in a clone of your own (\`git clone --no-hardlinks <the checkout you were given> <a scratch directory>/c\`), never in the checkout you were given: one git user per clone at a time.`,
    '',
    ...(changed.ids.length ? [`Provider \`${n.provider}\` changed these requirements in PR ${n.pr} (${changed.file}):`,
      ...changed.ids.flatMap((c) => [`- ${c.id}`, `  before: ${c.before}`, `  after:  ${c.after}`])]
      : [`Provider \`${n.provider}\` changed its source in PR ${n.pr}, with no requirement text changed (${changed.file}); read the PR's change to the provider's source.`]),
    ...(n.exports ? ['', `Its exported interface, as its users import it, changed in PR ${n.pr}:`,
      ...(n.exports.removed.length ? [`- removed: ${n.exports.removed.join(', ')}`] : []),
      ...n.exports.changed.map((c) => `- changed: ${c.name} ${c.before} -> ${c.after}`),
      ...(n.exports.added.length ? [`- added: ${n.exports.added.join(', ')}`] : [])] : []),
