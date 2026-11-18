// ===== file: ends.mjs (continued) =====

  }
  return { [m[1]]: /^(layer_|pr_)/.test(m[1]) ? Number(m[2]) : m[2] };
}
export const parseConditions = (s) => String(s ?? '').split(',').map((x) => x.trim()).filter(Boolean).map(parseCondition);
export const condText = (c) => Object.entries(c).map(([k, v]) => `${k}:${v}`).join('');

// An old row's free-text end (the migration), read only where the words are the plain phrase and
// nothing else bears on the end: each ';'-clause is "until layer <n> closes" (or "opens"),
// optionally "start only layer <n> work" after it, optionally one parenthesis, and optionally a
// "<who> <date> <time>:" prefix; the only other clause allowed is "ends when the coordinator
// says", which the owner set aside for these holds (Bob, 6 Nov: the tool ends them). Anything
// else ("and", "unless", "after", a second condition, another sentence) is refused, with why.
// { conds } or { unparsed }.
const PREFIX = String.raw`(?:[A-Za-z][\w ,()-]*? \d{1,2} [A-Z][a-z]{2} \d{1,2}:\d{2}: )?`;
const PLAIN = new RegExp(String.raw`^${PREFIX}until layer (\d+) (closes|opens)(?: start only layer \1 work)?(?: \([^()]*\))?$`, 'i');
const SET_ASIDE = /^ends when the coordinator says$/i;
export function fromText(text) {
  const clauses = String(text ?? '').split(';').map((c) => c.trim()).filter(Boolean);
  const hits = clauses.map((c) => c.match(PLAIN));
  const conds = hits.filter(Boolean).map((m) => (m[2].toLowerCase() === 'closes' ? { layer_closed: Number(m[1]) } : { layer_open: Number(m[1]) }));
  if (!/\buntil layer \d+ (?:closes|opens)\b/i.test(String(text ?? ''))) return { unparsed: 'no "until layer <n> closes" or "opens" in its words' };
  if (conds.length !== 1) return { unparsed: conds.length ? 'more than one condition in its words' : 'its "until layer <n>" clause says more than the plain phrase' };
  const other = clauses.filter((c, i) => !hits[i] && !SET_ASIDE.test(c));
  if (other.length) return { unparsed: `its words say more than the condition ("${other[0].slice(0, 60)}")` };
  return { conds };
}

// The tranche's first-parent merges by pull request number (merge, merge --plain and GitHub's
// titles), shared with hold.mjs.
export const LANDED = /^Merge (?:job PR |PR |pull request #)(\d+)\b/;

// The facts the checks read, from this clone: the state branch (as fetched), the tranche, main and
// the ledger, each read once. A layer row counts for this tranche only when it names this
// tranche and its commit is not on main (the tranche branch keeps its name from tranche to
// tranche; status.mjs closedRows reads closes the same way); a row whose commit this clone cannot
// place is unknown, never met. listed: list_sessions' result (an array), or null (unknown).
export function readFacts(root, cfg, { listed = null, t = Date.now(), landed } = {}) {
  const sb = cfg.state_branch;
  const tr = `origin/${cfg.tranche}`;
  // main by its id, so util.git keeps each exact answer for the process (C50).
  const mainId = git(['rev-parse', '-q', '--verify', 'refs/remotes/origin/main^{commit}'], { cwd: root, allowFail: true }).stdout.trim();
  const hasMain = !!mainId;
  const onMain = (c) => {
    if (!c || !/^[0-9a-f]{7,64}$/.test(String(c))) return null;
    if (!hasMain) return null;
    const r = git(['merge-base', '--is-ancestor', c, mainId], { cwd: root, allowFail: true });
    return r.code === 0 ? true : r.code === 1 ? false : null;
  };
  // This tranche's row: true, false (another tranche's), or null (cannot tell).
  const ours = (row, commit) => {
    if (!row || (row.tranche && row.tranche !== cfg.tranche)) return false;
    const m = onMain(commit);
    return m === null ? null : !m;
  };
  let closedRows = null;
  try { closedRows = jsonl(readState(root, sb, 'layers/closed.jsonl')).filter((r) => r.row === 'closed'); } catch { closedRows = null; }
  const flowCache = new Map();
  const flow = (n, kind) => {
    const k = `${n}/${kind}`;
    if (!flowCache.has(k)) {
      let v;
      try { const x = readState(root, sb, `layerflow/${n}/${kind}.json`); v = x === null ? undefined : JSON.parse(x); } catch { v = null; }
      flowCache.set(k, v);
    }
    return flowCache.get(k);
  };
  // Any of the rows for layer n met (true), else unknown if any could not be told (null), else false.
  const anyOurs = (pairs) => { let unk = false; for (const [row, c] of pairs) { const o = ours(row, c); if (o === true) return true; if (o === null) unk = true; } return unk ? null : false; };
  const layerClosed = (n) => {
    if (closedRows === null) return null;
    const m = flow(n, 'merged');
    if (m === null) return null;
    return anyOurs([...closedRows.filter((r) => Number(r.layer) === n).map((r) => [r, r.commit]), ...(m ? [[m, m.commit]] : [])]);
  };
  const layerOpen = (n) => {
    const o = flow(n, 'open');
    if (o === null) return null;
    const open = o ? ours(o, o.from) : false;
    if (open === true) return true;
    const c = layerClosed(n);
    return c === true ? true : open === null || c === null ? null : false;
  };
  let entries = null;
  const entry = (id) => {
    if (entries === null) entries = new Map();
    if (!entries.has(id)) {
      const r = git(['show', `${tr}:${LEDGER_DIR}/${id}.json`], { cwd: root, allowFail: true });
      let v = null;
      try { v = r.code === 0 ? JSON.parse(r.stdout) : undefined; } catch { v = null; }
      entries.set(id, v);
    }
    return entries.get(id);
  };
  let land = landed;
  const lands = () => {
    if (land === undefined) {
      const r = git(['log', '--first-parent', '--format=%s', tr], { cwd: root, allowFail: true });
      land = r.code === 0 ? new Set(r.stdout.split('\n').map((x) => x.match(LANDED)?.[1]).filter(Boolean).map(Number)) : null;
    }
    return land;
  };
  const sessions = Array.isArray(listed) ? new Map(listed.map((x) => [x.id, x])) : null;
  // The old account's sessions an account switch retired (switch.mjs RETIRED_FILE): gone, list or
  // no list, since the new account's list_sessions never holds them (R16).
  let retired = new Set();
  try { retired = new Set(JSON.parse(readState(root, sb, 'switch/retired.json') || '{}').sessions || []); } catch { retired = new Set(); }
  const archived = (x) => String(x.session_status || x.status || '').toLowerCase().replace(/^session_status_/, '') === 'archived';
  return {
    t,
    layerClosed,
    layerOpen,
    prMerged: (n) => { const l = lands(); return l === null ? null : l.has(n); },
    moduleComplete: (id) => { const e = entry(id); return e === null ? null : e === undefined ? false : e.status?.state === 'COMPLETE'; },
    // Archived in the list. A session the list does not hold is unknown, not gone: list_sessions
    // pages, and a short list is no proof an id is gone.
    sessionGone: (id) => { if (retired.has(id)) return true; if (!sessions) return null; const x = sessions.get(id); return x ? archived(x) : null; },
  };
}

// One condition against the facts: { met: true | false | null, why }.
export function checkCondition(c, f) {
  const [k, v] = Object.entries(c)[0] || [];
  const r = (met, why) => ({ met, why: `${k}:${v} ${met === true ? 'met' : met === false ? 'not met' : 'unknown'}${why ? ` (${why})` : ''}` });
  switch (k) {
    case 'layer_closed': return r(f.layerClosed(v));
    case 'layer_open': return r(f.layerOpen(v));
    case 'pr_merged': return r(f.prMerged(v));
    case 'module_complete': return r(f.moduleComplete(v));
    case 'session_gone': return r(f.sessionGone(v), f.sessionGone(v) === null ? 'no session list read' : '');
    case 'at': return r(f.t >= Date.parse(v));
    default: return { met: null, why: `${JSON.stringify(c)} is not a condition` };
  }
}
// The first met condition of a list, or null.
export const firstMet = (conds, f) => (conds || []).map((c) => ({ c, ...checkCondition(c, f) })).find((x) => x.met === true) || null;

// ===== file: lane-plain.test.mjs =====

// A lane's own pull request merges plain (Bob's standing approvals, 5 Nov: "A pull request that
// changes only files in its own lane's folder lands through the merge tool without a test suite
// run"). Copy PR 620, 6 Nov 05:15: merge --plain refused it as module files of ux-design.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { mergePlain } from '../lib/merge.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const DIR = 'docs/development/ux-substrate';
function product(files) {
  const root = makeRepo({
    'process/config.json': { lanes: [{ name: 'ux', dir: DIR, module: 'ux-design' }] },
    'process/ledger/ux-design.json': entry('ux-design', { paths: [`${DIR}/`], tests: ['test/ux-design/'], status: { state: 'COMPLETE' } }),
    [`${DIR}/words.json`]: '{}\n',
    'test/ux-design/w.test.mjs': "import test from 'node:test';\ntest('ok', () => {});\n",
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'lane/ux', 'tranche'], { cwd: root });
  const sha = commit(root, files);
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche', 'lane/ux'], { cwd: root });
  const calls = { merged: null };
  const green = { id: 1, status: 'completed', conclusion: 'success', started_at: '2026-11-06T05:00:00Z' };
  const io = {
    getPR: () => ({ state: 'open', draft: false, mergeable: true, base: { ref: 'tranche', repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: 'lane/ux', sha, repo: { full_name: 'o/r' } } }),
    requiredChecks: () => ({ checks: [{ context: 'gate' }] }), checkRuns: () => [green], checkRun: () => green, comments: () => [],
    repo: { released: () => false, shim: () => null, descends: () => false },
    mergePR: (slug, n, s, o) => { calls.merged = { sha: s, ...o }; return { merged: true, sha: 'm'.repeat(40) }; },
  };
  return { root, io, calls, sha };
}
const q = { slug: 'o/r', log: () => {}, noReview: 'a lane change' };

test('a plain pull request changing only its lane\'s folder merges, though the lane\'s module owns the folder (copy PR 620)', () => {
  const p = product({ [`${DIR}/words.json`]: '{"a":1}\n', [`${DIR}/new/screen.md`]: '# s\n', 'process/metrics/ux-design.jsonl': '{}\n' });
  assert.equal(mergePlain(p.root, 620, { ...q, io: p.io }).merged, true);
  assert.equal(p.calls.merged.sha, p.sha);
});

test('a lane pull request that also changes the module\'s tests still goes through a job', () => {
  const t = product({ [`${DIR}/words.json`]: '{"a":1}\n', 'test/ux-design/w.test.mjs': "import test from 'node:test';\ntest('x', () => {});\n" });
  assert.throws(() => mergePlain(t.root, 620, { ...q, io: t.io }), /changes module files, which go through a job: .*test\/ux-design\/w\.test\.mjs \(ux-design\)/);
  assert.equal(t.calls.merged, null);
});

// ===== file: coordinator-refresh.test.mjs =====

// ROOT refreshes the coordinator (Bob, 5 Nov 16:33: "Yes, make the process3 changes so that ROOT
// refreshes the coordinator"): no session starts its own successor, so a refresh no longer nests
// one level deeper. Each held rule below has its test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_ENTRY, commit, makeRepo, processRegisterFixture } from './helpers.mjs';
import { coordinatorOf, coordinatorPrompt, readAddress, recordStart, rootPrompt, startCoordinator, startRole } from '../lib/roles.mjs';
import { withCoordinator } from '../lib/state.mjs';
