// ===== file: open-by.test.mjs (continued) =====

  // Deferred (a reason, its pull request closed, on a reopened COMPLETE module too) awaits no ruling;
  // Bob's only for a requirement question (rule 9; audit of PR 139): the owner job block named, else a
  // reason that opens with "requirement" or asks what the product must do; an id alone is the coordinator's.
  const old = ago(60);
  const b = (id, blocked, owner) => ({ id, tranche: 'BLOCKED', blocked, pr: '#9 draft', since: old, ...(owner ? { owner } : {}) });
  assert.deepEqual(blockedJobs({}, [{ id: 'd', tranche: 'COMPLETE', flag: 'BLOCKED', blocked: 'x', pr: 'merged', since: old }, b('e', 'R4 fails its test fixture'), b('f', 'R4 contradicts R7', 'bob'), b('g', 'requirement R2: which fees apply?'), b('h', 'requirement wording aside, the build breaks', 'coordinator'), b('i', 'what the product must do on a refund is unwritten')])
    .map((x) => [x.id, x.by]), [['e', 'the coordinator'], ['f', 'Bob'], ['g', 'Bob'], ['h', 'the coordinator'], ['i', 'Bob']]);
});

test('a found-work item outside the open layer\'s work is reopened for its found marks only, never its deferred R marks', () => {
  const root = repo({}, { 'build/requirements/base.md': '- **R1** *(not yet met: x)* deferred\n- **F1** *(not yet met: x)* found\n', 'process/ledger/base.json': entry('base', { requirements: 'build/requirements/base.md', status: { state: 'COMPLETE' } }) });
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD'], { cwd: root });
  const cfg = loadConfig(root);
  const rows = status(root, { offline: true, log: quiet }).rows;
  const closed = [{ row: 'closed', tranche: 'tranche', layer: 1 }];
  const items = nextWork(root, cfg, rows, null, { log: quiet, state: layerState(root, cfg, rows, null, { closed }) });
  const b = items.find((x) => x.module === 'base');
  assert.deepEqual([b.found, b.marks], [['F1'], undefined]);
});

// ===== file: roundnext.mjs (later part) =====

      log(`${left.branch} was pushed by an earlier run with no pull request: pull request ${pr.number} opened from it into ${cfg.tranche}`);
    }
  }
  if (!pr && marks.length) {
    const taken = new Set(heads.map((h) => h.branch));
    let branch = base;
    for (let k = 2; taken.has(branch); k++) branch = `${base}-${k}`;
    const lines = withTemp('p3-round-', (tmp) => {
      const wt = join(tmp, 'w');
      git(['worktree', 'add', '-q', '--detach', wt, plan.tr], { cwd: root });
      try {
        const out = [];
        const byFile = new Map();
        for (const e of marks) byFile.set(e.file, [...(byFile.get(e.file) || []), e]);
        for (const [file, es] of byFile) {
          const p = join(wt, file);
          const id = es[0].module;
          const read = (f) => { try { return readFileSync(join(wt, f), 'utf8'); } catch { return null; } };
          let text = read(file);
          for (const e of es) {
            const n = nextFound(text, read(foundFile(id)), pendingFound(root, id, plan.tr));
            const line = foundLine(n, e.text, e.covers > 1 ? `${plan.from}, covers ${e.covers}` : plan.from);
            text = addFound(text, line, e.title);
            out.push(`${id} F${n}: ${e.text}`);
          }
          writeFile(p, text);
          git(['add', '--', file], { cwd: wt });
        }
        git(['commit', '-q', '-m', `found: round ${plan.opens}, ${marks.length} mark(s) from the ${plan.from}`], { cwd: wt });
        const r = git(['push', '-q', 'origin', `HEAD:refs/heads/${branch}`], { cwd: wt, allowFail: true });
        if (r.code !== 0) fail(`the push of ${branch} failed (${r.stderr.trim()}); nothing was opened`);
        return out;
      } finally { git(['worktree', 'remove', '--force', wt], { cwd: root, allowFail: true }); }
    }, { root });
    log(`${branch} pushed: ${lines.join('; ')}`);
    pr = (io.createPR || createPR)(slug, { head: branch, base: cfg.tranche, title: `found: round ${plan.opens}, ${marks.length} mark(s) from the ${plan.from}`, body: `Found marks from the ${plan.from}, one a distinct flaw (\`round next\`, C46):\n\n${lines.map((l) => `- ${l}`).join('\n')}\n\nOnly unmet found marks are added; no code.`, draft: false });
    log(`pull request ${pr.number} opened into ${cfg.tranche}`);
  }
  if (!pr) return;
  log(`merging pull request ${pr.number} (found marks only) through the merge tool: merge ${pr.number} --plain --no-review "${NO_REVIEW}"`);
  (io.mergePlain || mergePlain)(root, pr.number, { noReview: NO_REVIEW, log, slug });
}
function writeFile(p, text) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); }

// The marks a printed `found` act holds on a found/<module>-f<n> branch, on origin or here, not yet
// on the tranche, as found.mjs numbers past them: two marks never share a number.
function pendingFound(root, id, tr) {
  const remote = git(['ls-remote', '--heads', 'origin', `refs/heads/found/${id}-f*`], { cwd: root, allowFail: true }).stdout || '';
  const local = git(['for-each-ref', '--format=%(objectname) %(refname)', `refs/heads/found/${id}-f*`], { cwd: root, allowFail: true }).stdout || '';
  const written = (sha) => git(['cat-file', '-e', `${sha}^{commit}`], { cwd: root, allowFail: true }).code !== 0 || git(['merge-base', '--is-ancestor', sha, tr], { cwd: root, allowFail: true }).code !== 0;
  return `${remote}\n${local}`.split('\n').map((l) => l.trim().split(/\s+/)).filter(([sha, name]) => sha && name && written(sha))
    .map(([, name]) => name.match(new RegExp(`^refs/heads/found/${id}-f(\\d+)$`))?.[1]).filter(Boolean).map((k) => `**F${k}**`).join(' ');
}

// The layer opened (apply) or named (dry run), and its jobs' `job start` commands printed.
function openNext(root, nx, { apply, io, log, by, dry, what, tranche = null }) {
  if (!apply) {
    log(`${what}: ${roundLayerName(nx.round, nx.of, nx.n, tranche)} for ${nx.mods.join(', ')}${dry}; then its \`job start\` commands`);
    return { ok: true, state: 'dry', next: nx };
  }
  const o = layerOpen(root, nx.n, { io, by, log });
  log(`next: BOB starts each job above (create_session for its session, then the \`job start\` command); \`${ROUND_NEXT}\` lists them again`);
  return { ok: true, state: 'opened', layer: nx.n, round: o.round, startable: o.startable };
}

// A clean walk: the release path (rounds.mjs releaseNext), or where it stands.
function releasePath(root, cfg, plan, { log }) {
  let next = null;
  try {
    let p = cfg.plan;
    try { p = loadConfig(root, plan.tr).plan; } catch { p = cfg.plan; }
    const w = findingsOf(root, cfg, plan.tr, plan.last);
    next = releaseNext(root, cfg, { rc: { closed: true, round: `round ${plan.rs.round}`, rounds: plan.rs }, w, plan: p, ref: plan.tr });
  } catch { next = null; }
  if (next) log(`the walk ${runSource(plan.last)} is clean: no round opens; the release path is next (${next.why}): ${next.act}`);
  else log(`the walk ${runSource(plan.last)} is clean: no round opens; the release path follows (BD-R1): \`${P3} release dev\` (the cut, signed release), then \`${P3} deploy release <version>\`; \`${P3} status --role bob\` names where it stands`);
  return { ok: true, state: 'clean', release: next };
}

// ===== file: register.mjs =====

// Triage registers (AUD-8: "A process triage lane and a product triage lane study each identified
// problem and bring you options with context before a response is chosen. A chosen short-term
// response reaches later sessions in their starting prompt, with the condition that ends it.").
// One triage lane per repository: the process's in process3 (its folder `triage/`), each product's
// a lane of kind "triage" in its process/config.json. Each keeps its register in its folder, so it
// survives every session: `register.json` holds the open entries, `closed.jsonl` each closed one
// with how its end condition was met. An entry carries the problem, its evidence and the options,
// each with its context, that its lane brings for a choice; once a response is chosen, the response
// word for word, the dated words that chose it and, for a short-term one, its end condition and the
// roles it reaches. The pinned tool prints each chosen short-term response, verbatim, into the
// starting prompt of each role it names, so a refreshed session gets it exactly and no one retypes
// it; nothing else in the register is printed. Temporary measures live here, never as rulebook
// lines (AUD-9, TXT-3). Written only by `triage add`, `triage choose` and `triage close`, as commits
// on the current branch that land by pull request like any lane change.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG_FILE, exists, fail, git, laneDirs, list, now } from './util.mjs';

export const PROCESS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// Tests' seam: under node --test, P3_PROCESS_ROOT names a fixture in place of this checkout's own
// register, so the live register's entries never decide a test.
const processRoot = () => (process.env.NODE_TEST_CONTEXT && process.env.P3_PROCESS_ROOT) || PROCESS_ROOT;
export const PROCESS_TRIAGE = { name: 'process-triage', dir: 'triage', module: null, kind: 'triage', repo: 'process' };
export const REGISTER = 'register.json';
export const CLOSED = 'closed.jsonl';
export const KINDS = ['short-term', 'long-term'];
// The roles whose starting prompts print a chosen short-term response (AUD-8: "later sessions").
// The watcher and the lanes' own sessions are not among them: their STARTs carry no register block.
export const AFFECTS = ['bob', 'root', 'coordinator', 'job'];
// The printed block's cap. Measured 5 Nov: each role prompt is at most one screen, 4096 bytes
// (prompt-caps.test.mjs; BOB's 3789 on the copy's slug), and the seed entry's
// block, its heading included, is 880 bytes. Half a screen holds the heading and about two and a
// half entries of the seed's size, so a prompt with its block stays within a screen and a half and
// is read whole. Over it the tool still prints every entry, and says the set is over its cap (in
// the block and at triage choose and list), so the triage lanes close or combine entries rather than
// let the set grow until it is skimmed.
export const STANDING_CAP = 2048;

// The product's triage lane, or null; more than one is refused.
export function productTriageLane(cfg) {
  const ls = (Array.isArray(cfg?.lanes) ? cfg.lanes : []).filter((l) => l?.kind === 'triage');
  if (ls.length > 1) fail(`process/config.json names ${ls.length} triage lanes (${ls.map((l) => l.name).join(', ')}); one per repository`);
  const l = ls[0];
  if (!l) return null;
  if (typeof l.dir !== 'string' || !l.dir.trim() || !laneDirs({ lanes: [l] }).length) fail(`triage lane ${l.name} names no "dir" in process/config.json that can be a lane folder`);
  return { name: String(l.name).trim(), dir: l.dir.trim().replace(/^\.\//, '').replace(/\/+$/, ''), module: null, kind: 'triage', repo: 'product' };
}

const one = (s) => (typeof s === 'string' ? s.trim() : '');
// An entry's shape, checked wherever the register is read or written: a malformed one is refused, never skipped.
export function checkEntry(e, where = 'the register') {
  const at = `${where}, entry ${e?.id || '?'}`;
  if (!e || typeof e !== 'object' || !/^[A-Z]+\d+$/.test(String(e.id))) fail(`${at}: an entry needs an id such as P1`);
  for (const k of ['problem', 'evidence', 'owner', 'state']) if (!one(e[k])) fail(`${at}: no ${k}`);
  if (!KINDS.includes(e.kind)) fail(`${at}: kind is ${KINDS.join(' or ')}, not ${JSON.stringify(e.kind)}`);
  // AUD-8: options with context come before any response is chosen.
  if (!Array.isArray(e.options) || !e.options.length || e.options.some((o) => !one(o?.option) || !one(o?.context))) fail(`${at}: options lists each option with its context ({"option", "context"}), at least one`);
