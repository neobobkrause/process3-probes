// ===== file: status.mjs (continued) =====

  return out;
}

// The completion file's open items, not deferred: a module item through job start as usual (its
// requirement lines written first), unless its job is open; a whole-product item is BOB's act.
export function completionWork(root, cfg, rows, ref, log = console.log) {
  const c = completionItems(root, cfg, ref);
  if (!c) return [];
  if (c.missing) { log(`completion round: ${c.file} is not on ${ref || 'the working tree'}`); return [{ file: c.file, missing: true }]; }
  const open = openItems(c);
  if (!open.length) { log(`completion round: every item of ${c.file} done or deferred; the tranche can close: ${P3} tranche close`); return []; }
  const job = (id) => rows.find((r) => r.id === id && jobOpen(r));
  // In the layer flow a module's item runs in the completion layer (C33): its act is that layer's.
  let start = (id) => `${P3} job start ${id} --sessions <file>`;
  if (layerMode(cfg)) {
    try {
      const ls = layersAtFlow(root, cfg, ref);
      const comp = ls.filter((L) => L.completion).at(-1);
      const live = comp && !flowRowsOf(root, cfg.state_branch, comp.n).merged;
      // BD-R1 (Bob, 8 Nov): no completion layer opens any more; an item left once the open one
      // merged is a flaw of its module, entered as a found mark, so a round's layer runs it.
      if (ls.length) start = (id) => (live ? `${P3} layer jobs ${comp.n}` : `no completion layer opens (BD-R1): enter it as a found mark (\`${P3} found ${id} "<the item>" --from "<its source>"\`) and tick it, so a round's layer runs it`);
    } catch { /* the plain act */ }
  }
  log(`next work, the completion round (${c.file}, ${open.length} open; done: tick its line; deferred: "deferred: <reason>" on its line):`);
  for (const x of open) log(x.malformed ? `- ${c.file}:${x.line}: not an item line (\`- [ ] <id> · <module or whole product> · <what>\`); fix it: ${x.what.slice(0, 100)}` : `- ${x.id} · ${x.target}: ${x.whole ? "BOB's act" : job(x.target) ? 'its job is open' : start(x.target)}${x.what ? ` · ${x.what.slice(0, 100)}` : ''}`);
  return open.map((x) => ({ file: c.file, item: x.id, target: x.target }));
}

// The lanes with more than one live session (status, sweep): the recorded seat, the lane module's
// open job (rows: status's ledger rows), and, with list_sessions, the sessions not archived titled
// `lane <name>` or `job <module>`; each a defect line.
// Open as sessionActs judges a job open: not merged, and not deferred (BLOCKED, its pull request closed).
const laneJobOpen = (r) => !!r && !jobDone(r) && !(r.tranche === 'BLOCKED' && r.blocked && !String(r.pr || '').startsWith('#') && !/^WORKING/.test(String(r.branch || ''))) && (/^(OPEN|WORKING|BLOCKED)/.test(String(r.branch || '')) || String(r.pr || '').startsWith('#'));
export function laneDefects(cfg, seats, { rows = [], listed = null } = {}) {
  const out = [];
  let all = [];
  try { all = Array.isArray(cfg.lanes) ? lanes(cfg) : []; } catch { all = []; }
  for (const l of all) {
    const holders = new Set();
    const s = seats?.get(l.name);
    if (s) holders.add(s.session || `lane ${l.name} (pending)`);
    if (l.module && laneJobOpen(rows.find((r) => r.id === l.module))) holders.add(`job ${l.module}`);
    // The listed sessions: each `lane <name>` not archived, and the module's latest job session
    // (jobSession; an older one beside it after a restart is the sweep's leftover, not a second).
    const live = (listed || []).filter((y) => !isArchived(y));
    for (const x of live.filter((y) => String(y.title || '').trim() === `lane ${l.name}`)) {
      if (s && !s.session) holders.delete(`lane ${l.name} (pending)`);
      holders.add(sessionId(x));
    }
    const js = l.module ? jobSession(live, l.module) : null;
    if (js) { holders.delete(`job ${l.module}`); holders.add(sessionId(js)); }
    if (holders.size > 1) out.push(`defect: lane ${l.name} has ${holders.size} live sessions (${[...holders].join(', ')}): one session per lane at a time; end or archive all but one (lane end ${l.name} frees the lane's seat${l.module ? `; job ${l.module} ends as it completes` : ''})`);
  }
  return out;
}

// ===== file: layout.mjs =====

// layout move [--apply] [--also <path>]... (C41; Bob, 8 Nov: "There should be an process3-specific
// subtree in the [product's] repo that contains info related to [the product's]
// process3-driven development"). A product keeps its process-only content under process/, the
// directory that holds config.json (PROCESS_DIR). Each path the tool reads through a config key
// keeps working where it is, by that key's default, until the product moves it; this act moves it.
//
// The built-in moves (coordinator, 8 Nov) are only what the tool itself reads as process-only:
// layers_file and situations_dir. Anything else (a plan, job notes, the modules file) moves only by
// --also, once BOB has confirmed from the product that the product itself does not rely on it,
// and only when no tracked file outside process/ names it. The
// requirements (requirements_dir) are product content and never move here; nor do the paths the
// platform reads from fixed places (.process, .github, .claude, CLAUDE.md), nor a lane's folder.
//
// Without --apply it prints the plan and writes nothing. With --apply, on a clean checkout of a
// branch that is not the tranche, it moves each path with git mv, rewrites only the keys whose
// value moved in process/config.json, and makes one commit, so the move lands at one tranche
// commit through the merge tool: before it every reader resolves the old paths, after it the new.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { CONFIG_FILE, DEFAULTS, PROCESS_DIR, fail, git, laneDirs, list, loadConfig, parseJSON, underPath } from './util.mjs';

// The keys a move may rewrite: those naming a process-only path. requirements_dir is not one.
export const MOVABLE_KEYS = ['layers_file', 'situations_dir', 'modules_file', 'completion_file'];
// The keys the built-in plan moves (the tool reads them as process-only).
export const BUILT_IN = ['layers_file', 'situations_dir'];
// The platform reads these from fixed places; they never move.
const FIXED = ['.process', '.github', '.claude', 'CLAUDE.md', '.gitmodules'];

const norm = (p) => String(p).replace(/^\.\//, '').replace(/\/+$/, '');
const tracked = (root, p) => git(['ls-files', '--', p], { cwd: root, allowFail: true }).stdout.trim() !== '';

// The plan: [{ from, to, key|null, note|null }] and the paths skipped, each with why.
export function layoutPlan(root, { cfg = loadConfig(root), also = [] } = {}) {
  const moves = [];
  const skipped = [];
  const lanes = laneDirs(cfg).flatMap((l) => [l.dir, l.research]).filter(Boolean).map(norm);
  const req = norm(cfg.requirements_dir || DEFAULTS.requirements_dir);
  const add = (from, key, also = false) => {
    const p = norm(from);
    if (!p || p.startsWith('/') || p.split('/').includes('..')) fail(`layout move: ${JSON.stringify(from)} is not a path inside the repository`);
    if (underPath(p, PROCESS_DIR)) { skipped.push({ from: p, why: `already under ${PROCESS_DIR}/` }); return; }
    if (FIXED.some((f) => underPath(p, f) || underPath(f, p))) fail(`layout move: ${p} is read by the platform from a fixed place (.process, .github, .claude, CLAUDE.md); it stays where it is`);
    if (underPath(p, req) || underPath(req, p)) fail(`layout move: ${p} holds the requirements (requirements_dir ${req}), the product's own content; they stay where they are`);
    const lane = lanes.find((d) => underPath(p, d) || underPath(d, p));
    if (lane) fail(`layout move: ${p} overlaps the lane folder ${lane}/, which its lane owns; it stays where it is`);
    if (!existsSync(join(root, p)) || !tracked(root, p)) { skipped.push({ from: p, why: 'not in this checkout' }); return; }
    if (moves.some((m) => m.from === p)) return;
    const over = moves.find((m) => underPath(p, m.from) || underPath(m.from, p));
    if (over) fail(`layout move: ${p} and ${over.from} overlap; name the outer one only`);
    // An --also path that a tracked file outside process/ names in its text (coordinator, 8 Nov,
    // from BOB's read of the product: product tests read build/plan/ and docs/requirements-notes/):
    // refused, with the files, so a reference never breaks silently. Its own files are not asked.
    if (also) {
      const r = git(['grep', '-l', '-F', '-e', p, '--', '.', `:(exclude)${PROCESS_DIR}`, `:(exclude)${p}`], { cwd: root, allowFail: true });
      if (r.code > 1) fail(`layout move: could not search the tracked files for ${p} (${r.stderr.trim()}); nothing was moved`);
      const named = r.stdout.split('\n').filter(Boolean);
      if (named.length) fail(`layout move: ${p} is named by ${named.length} tracked file(s) outside ${PROCESS_DIR}/, which would break: ${named.slice(0, 20).join(', ')}${named.length > 20 ? ', ...' : ''}; move it with a change that updates them (as round work), not by --also`);
    }
    const to = `${PROCESS_DIR}/${basename(p)}`;
    if (existsSync(join(root, to)) || moves.some((m) => m.to === to)) fail(`layout move: ${to} is taken; move ${p} by hand or rename one of them first`);
    const keyOf = key || MOVABLE_KEYS.find((k) => typeof cfg[k] === 'string' && norm(cfg[k]) === p) || null;
    // A modules file under process/ is a record: the gate judges a change to it alone as one, with
    // no suite run (gate.mjs recordOnly). Said, never refused: the coordinator moves it by --also.
    const note = keyOf === 'modules_file' ? `under ${PROCESS_DIR}/ the gate reads ${p} as a record: a pull request changing only it runs no suite` : null;
    moves.push({ from: p, to, key: keyOf, note });
  };
  for (const k of BUILT_IN) {
    const v = k === 'situations_dir' ? (cfg.situations_dir ?? DEFAULTS.situations_dir) : cfg[k];
    if (typeof v === 'string' && v) add(v, k);
  }
  for (const p of list(also)) {
    if (typeof p !== 'string') fail('layout move --also <path>: name the path');
    add(p, null, true);
  }
  // A key naming a path inside a moved directory follows it (cold review): its new prefix.
  const follows = [];
  for (const k of MOVABLE_KEYS) {
    const v = typeof cfg[k] === 'string' ? norm(cfg[k]) : null;
    if (!v || moves.some((m) => m.key === k)) continue;
    const m = moves.find((x) => v !== x.from && underPath(v, x.from));
    if (m) follows.push({ key: k, to: `${m.to}${v.slice(m.from.length)}` });
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
