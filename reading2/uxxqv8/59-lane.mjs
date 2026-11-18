// Lanes (SES-14), as Bob defined them on 5 Nov. A lane carries one design responsibility, unique to
// it, and is kept to one session at a time ("a lane is kept to one session at a time"). It is not a
// read-only helper ("it writes and updates design documents"). Bob's CLAUDE.md, 5 Nov: "Design
// lanes, run under BOB, own their lane folders ... Within the product's principles they decide
// design and wording there. ... A pull request that changes only files in its own lane's folder
// lands through the merge tool without a test suite run." Its design documents, the ones
// it writes, updates and works with Bob through, are claude.ai artifacts and documents ("they don't
// need to be checked in"); their links are recorded on the state branch (lane artifact) so a
// successor finds them. Its repository folder (the lane's "dir") holds only what the product's
// build reads: sources and the generators whose large outputs are built inputs to the release
// (the product's `generated` rows: built at the gate, layer close, deploy and release, never
// committed). Its file changes are not tested the way a job's are ("lanes' file changes need not
// be tested the way jobs do"): a pull request changing only one lane's folder (and records) takes
// the gate's records-only path, and lane-folder paths count as records when the gate asks whether
// a job's head changed since its green run (util.mjs laneOnly, isRecordOrLane). A change to any
// other file is judged as today. Answering BOB's design questions is one of its acts:
// lane ask <name> "<question>" --context <file>...: records the ask on the state branch (open until
// a decision is recorded) and prints BOB's act: to the lane's session while one is live, else to a
// read-only worker with the brief printed.
// lane ask <name> "<question>" --record "<decision>" --worker <id> [--cost-usd <n>]: the decision.
// A lane of kind "triage" (register.mjs) studies problems instead of design: one per repository,
// the product's in its config, the process's the built-in process-triage, whose folder and pull
// requests are process3's and whose seat is kept here with the product's lanes.
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { P3, rulebook } from './job.mjs';
import { entryFile, jobBranch, laneModuleGaps, ledgerIds, originJobs } from './ledger.mjs';
import { PROCESS_ROOT, PROCESS_TRIAGE, REGISTER, productTriageLane } from './register.mjs';
import { addressFile, fetchState, jsonl, readState, writeState } from './state.mjs';
import { fail, fetchBranch, git, laneChecks, laneDirs, list, loadConfig, now, repoSlug, researchOf, underPath } from './util.mjs';
import { budgetGate, pacedLanes } from './pace.mjs';

export const LANES_FILE = 'lanes/asks.jsonl';

// The configured lanes, each with a name and a directory; a lane without either is refused.
export function lanes(cfg) {
  const ls = cfg.lanes;
  if (!Array.isArray(ls)) fail('"lanes" in process/config.json must be a list of {"name", "dir"}');
  return ls.map((l, i) => {
    if (!l || typeof l !== 'object' || typeof l.name !== 'string' || !l.name.trim()) fail(`lane ${i + 1} in process/config.json has no name`);
    const module = typeof l.module === 'string' && l.module.trim() ? l.module.trim() : null;
    const dir = typeof l.dir === 'string' && l.dir.trim() ? l.dir.trim().replace(/\/$/, '') : null;
    // One parser of a lane's folder with the gate's (util.mjs laneDirs): a folder it would not
    // count is refused here, so no lane's START promises a path the gate does not give.
    if (dir && !laneDirs({ lanes: [l] }).length) fail(`lane ${l.name.trim()}'s dir ${JSON.stringify(dir)} cannot be a lane folder: not the root, nor under process/, .process/, .github/, .claude/ or CLAUDE.md, nor outside the checkout`);
    // kind: "design" (the default) or "triage" (register.mjs: one per repository).
    const kind = l.kind === undefined ? 'design' : ['design', 'triage'].includes(l.kind) ? l.kind : fail(`lane ${l.name.trim()}'s kind is "design" or "triage", not ${JSON.stringify(l.kind)}`);
    if (l.name.trim() === PROCESS_TRIAGE.name) fail(`lane name ${PROCESS_TRIAGE.name} is the process's own triage lane, in process3; name the product's another`);
    // The research area (util.mjs researchOf): refused where the gate would not count it as the
    // lane's folder, inside or around dir, or holding a generated path (never what the build reads).
    if (l.research !== undefined && (typeof l.research !== 'string' || !l.research.trim())) fail(`lane ${l.name.trim()}'s research is a folder in the product, not ${JSON.stringify(l.research)}`);
    if (l.research !== undefined && kind === 'triage') fail(`lane ${l.name.trim()} is a triage lane: its register is its record; it takes no research folder`);
    if (l.research !== undefined && !dir) fail(`lane ${l.name.trim()} sets research but no dir: set its "dir" too`);
    const research = dir ? researchOf({ ...l, kind }) : null;
    if (research && laneDirs({ lanes: [{ ...l, kind }] })[0]?.research !== research) fail(`lane ${l.name.trim()}'s research folder ${research}/ cannot be its research area: its last part is research or ends in -research, and it is not the root, inside or around its dir, under process/, .process/, .github/, .claude/ or CLAUDE.md, nor outside the checkout`);
    // Nor another lane's: the gate drops a research area that overlaps another lane's folders.
    if (research && laneDirs(cfg).find((x) => x.name === l.name.trim())?.research !== research) fail(`lane ${l.name.trim()}'s research folder ${research}/ overlaps another lane's dir or research; give it its own`);
    const gen = (Array.isArray(cfg.generated) ? cfg.generated : []).flatMap((r) => (Array.isArray(r?.paths) ? r.paths : [])).map((g) => String(g).replace(/^\.\//, ''));
    const g = research && gen.find((x) => underPath(x, research) || underPath(research, x.replace(/\/+$/, '')));
    if (g) fail(`lane ${l.name.trim()}'s research folder ${research}/ holds the generated path ${g}: research is never what the build reads`);
    // Its checks (laneChecks): commands the gate runs on its lane-only pull requests.
    const checks = laneChecks({ lanes: [l] }, l.name.trim());
    if (checks === null) fail(`lane ${l.name.trim()}'s checks are a list of commands, each a string or a list of words, not ${JSON.stringify(l.checks)}`);
    return { name: l.name.trim(), dir: dir ? dir.replace(/^\.\//, '') : null, module, kind, research, repo: 'product', ...(checks.length ? { checks } : {}) };
  });
}
// The lane whose ledger module this is (a lane's "module" in process/config.json), or null.
// Never a refusal: a malformed lane is lane ask's and lane start's to refuse, not every job start's.
export function laneOfModule(cfg, id) {
  try { return (Array.isArray(cfg?.lanes) ? lanes(cfg) : []).find((l) => l.module === id) || null; } catch { return null; }
}

export function lane(cfg, name) {
  // The process's triage lane is in process3 (its folder there, its pull requests into process3's
  // tranche); its seat is kept with the product's lanes, by the BOB that starts it.
  if (name === PROCESS_TRIAGE.name) return PROCESS_TRIAGE;
  if (Array.isArray(cfg?.lanes)) productTriageLane(cfg);
  const all = lanes(cfg);
  const l = all.find((x) => x.name === name);
  if (!l) fail(`no lane ${JSON.stringify(name)} in process/config.json; the lanes are ${all.map((x) => x.name).join(', ') || 'none'}`);
  if (!l.dir) fail(`lane ${l.name} names no directory: set its "dir" in process/config.json "lanes"`);
  return l;
}

const walk = (root, dir) => {
  const out = [];
  const go = (d) => {
    for (const n of readdirSync(join(root, d)).sort()) {
      const p = `${d}/${n}`;
      const s = statSync(join(root, p));
      if (s.isDirectory()) go(p);
      else out.push({ file: p, bytes: s.size });
    }
  };
  go(dir);
  return out;
};

// Qualification (Bob, 6 Nov: "a lane is fully qualified to fulfill their role as the load-bearing
// source of truth in their area. So the first time a lane is defined and run, it should start by
// using workers to fully research canon documents, existing code, and best practices related to
// their specialty area"). A design lane has qualified when its research area holds its index and
// at least one dated qualification record, as the checkout has them; until then lane start prints
// the QUALIFICATION brief and lane ask refuses. A triage lane needs none (its register).
export const RESEARCH_INDEX = 'index.md';
const QUALIFIED = /^qualification-(\d{4}-\d{2}-\d{2})\.md$/;
export function qualification(root, l) {
  if (!l?.research) return null;
  const area = l.research;
  const isFile = (p) => { try { return statSync(join(root, p)).isFile(); } catch { return false; } };
  const here = (() => { try { return statSync(join(root, area)).isDirectory(); } catch { return false; } })();
  // A broken link or an unreadable entry reads as not qualified, never a crash of every START.
  let files = [];
  try { files = here ? walk(root, area) : []; } catch { files = []; }
  const index = here && isFile(`${area}/${RESEARCH_INDEX}`);
  const records = here ? readdirSync(join(root, area)).filter((n) => isFile(`${area}/${n}`)).map((n) => QUALIFIED.exec(n)?.[1]).filter(Boolean).sort() : [];
  return { area, files, bytes: files.reduce((n, f) => n + f.bytes, 0), index, records, latest: records.at(-1) || null, qualified: index && records.length > 0 };
}
const missing = (q) => (!q.files.length ? `${q.area}/ is missing or empty` : [!q.index && `${q.area}/${RESEARCH_INDEX} is missing`, !q.records.length && `${q.area}/ holds no qualification-<YYYY-MM-DD>.md`].filter(Boolean).join('; '));

// The asks of this tranche, each with its decision when one is recorded.
export function asks(root, cfg) {
  const rows = jsonl(readState(root, cfg.state_branch, LANES_FILE)).filter((r) => r.tranche === cfg.tranche);
  const key = (r) => `${r.lane}\0${r.question}`;
  const out = new Map();
  for (const r of rows) {
    // A new ask of a decided question opens it again.
    if (r.row === 'ask' && (!out.has(key(r)) || out.get(key(r)).decision)) out.set(key(r), { ...r, decision: null });
    else if (r.row === 'decision') out.set(key(r), { ...(out.get(key(r)) || { lane: r.lane, question: r.question }), decision: r });
  }
  return [...out.values()];
}
export const openAsks = (root, cfg) => asks(root, cfg).filter((a) => !a.decision);

export function briefText({ l, question, context, files, artifacts = [], research = null }) {
  const bytes = (xs) => xs.reduce((s, x) => s + x.bytes, 0);
  return [
    `# Lane question: ${l.name}`, '',
    `You answer one design question for the ${l.name} lane, as a read-only worker started by BOB while the lane has no session live (a lane writes its folder and design documents; you write nothing). Read your rulebook once, before you start: \`${rulebook('worker')}\` in a product, \`rulebooks/worker.md\` in the process repository; this brief wins where they differ.`, '',
    '## Question', question, '',
    `## Reading set (${bytes(files) + bytes(context) + (research?.bytes || 0)} bytes)`,
    ...(research ? [`First, the lane's research area \`${research.area}/\`: ${research.files.length} files, ${research.bytes} bytes, qualified ${research.latest}. Read its \`${RESEARCH_INDEX}\`, then what the question needs; it is the lane's ground truth (canon, code, best practice), and a decision that departs from it says why.`] : []),
    `The lane's directory \`${l.dir}/\`: ${files.length} files, ${bytes(files)} bytes. Read what the question needs, starting from its README or index if it has one.`,
    ...(artifacts.length ? ["The lane's design documents (claude.ai artifacts and documents; read what the question needs):", ...artifacts.map((a) => `- ${a.title ? `${a.title}: ` : ''}${a.url}`)] : []),
    ...(context.length ? ['Context from BOB:', ...context.map((c) => `- \`${c.file}\` ${c.bytes}`)] : ['No context files.']), '',
    '## Boundaries',
    `Read only: write nothing in the checkout, push nothing, start nothing. Decide within the ${l.name} lane's design responsibility and what its directory and design documents already hold; where the directory and the context differ, say so. A question only Bob can answer (values, policies, mission, audiences, principles, doctrine, his approvals) is answered "decision: Bob's", with the options and your recommendation. BOB keeps the final say; you approve and merge nothing.`, '',
