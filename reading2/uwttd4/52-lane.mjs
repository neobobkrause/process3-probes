    '## Output',
    'Three parts, in this order, plain words:',
    '- decision: <one line>',
    '- why: <the lines of the directory or the context it rests on, each with file and line>',
    `- what changes in \`${l.dir}/\`: <each file and what changes in it, or "nothing">`,
    ...(research ? [`- research: <what the lane's research area lacks for this question, a line the lane adds to \`${research.area}/\`, or "nothing">`] : []),
  ].join('\n') + '\n';
}

const put = (wt, file, row) => { mkdirSync(dirname(join(wt, file)), { recursive: true }); appendFileSync(join(wt, file), JSON.stringify(row) + '\n'); };

export function laneAsk(root, name, question, { context = [], record, worker, cost, log = console.log, jobOpen = moduleJobOpen } = {}) {
  if (typeof name !== 'string' || !name) fail('lane ask <name> "<question>" --context <file>...');
  if (typeof question !== 'string' || !question.trim()) fail('lane ask <name> "<question>": the question, in quotes');
  const cfg = loadConfig(root);
  const l = lane(cfg, name);
  if (l.kind === 'triage') fail(`lane ${l.name} is a triage lane: a problem goes into its register (triage add), or to its session by send_message; not lane ask`);
  const q = question.replace(/\s+/g, ' ').trim();
  fetchState(root, cfg.state_branch, { fresh: true });
  if (record !== undefined) {
    if (typeof record !== 'string' || !record.trim()) fail('--record "<the lane\'s decision>"');
    if (typeof worker !== 'string' || !worker.trim()) fail('--record needs --worker <the worker\'s session or agent id>');
    const mine = openAsks(root, cfg).filter((a) => a.lane === l.name);
    if (!mine.some((a) => a.question === q)) fail(`no open ${l.name} question reads ${JSON.stringify(q)}; nothing recorded. Open: ${mine.map((a) => JSON.stringify(a.question)).join('; ') || 'none'}`);
    const usd = cost === undefined ? null : Number(cost);
    if (cost !== undefined && (cost === true || !Number.isFinite(usd) || usd < 0)) fail(`--cost-usd <the worker's cost from its session record>, not ${JSON.stringify(cost)}`);
    const row = { row: 'decision', at: now(), tranche: cfg.tranche, lane: l.name, question: q, decision: record.trim(), worker: worker.trim(), cost_usd: usd };
    writeState(root, cfg.state_branch, `lane ${l.name}: decision recorded`, (wt) => put(wt, LANES_FILE, row));
    log(`recorded the ${l.name} lane's decision${usd === null ? '; cost unmeasured' : `; cost $${usd}`}`);
    return { row };
  }
  if (!existsSync(join(root, l.dir))) fail(`lane ${l.name}'s directory ${l.dir}/ is not in this checkout`);
  // Not before it has qualified: a lane decides nothing until its research is landed.
  const research = qualification(root, l);
  if (research && !research.qualified) {
    const seat = readSeats(root, cfg).get(l.name);
    fail(`lane ${l.name} has not qualified (${missing(research)}): it answers no ask until its qualification lands; ${seat ? `its session ${seatName(seat)} is qualifying: ask again once its qualification pull request is in ${cfg.tranche} and this checkout has it` : `start it with ${P3} lane start ${l.name}, which qualifies it first`}; nothing recorded`);
  }
  const ctx = list(context).filter((c) => c !== true).map((c) => {
    const p = relative(root, join(root, String(c)));
    if (!existsSync(join(root, p)) || !statSync(join(root, p)).isFile()) fail(`--context ${c}: no such file in this checkout`);
    return { file: p, bytes: statSync(join(root, p)).size };
  });
  const files = walk(root, l.dir);
  const brief = briefText({ l, question: q, context: ctx, files, artifacts: readArtifacts(root, cfg, l.name), research });
  const already = openAsks(root, cfg).some((a) => a.lane === l.name && a.question === q);
  if (!already) {
    const row = { row: 'ask', at: now(), tranche: cfg.tranche, lane: l.name, question: q, context: ctx.map((c) => c.file) };
    writeState(root, cfg.state_branch, `lane ${l.name}: question asked`, (wt) => put(wt, LANES_FILE, row));
  }
  log(`${already ? 'already open' : 'recorded open'} on ${cfg.state_branch}:${LANES_FILE}`);
  // While the lane's seat is held, its session decides: the question goes there, not to a worker.
  const seat = readSeats(root, cfg).get(l.name);
  const job = !seat && l.module ? jobOpen(root, cfg, l.module) : null;
  if (l.module && !seat && job === null) log(`job ${l.module}'s branch could not be read: if its session is at work, send the question there instead of a worker`);
  const to = seat ? (seat.session ? `send_message to the lane's session ${seat.session}` : `send it to the lane's session once lane start ${l.name} --record names it`) : job ? `send_message to job ${l.module}'s session, the lane's (list_sessions, title "job ${l.module}")` : null;
  // Single-quoted: the shell leaves $ and backticks in the question as they are (cold review).
  const rec = `${P3} lane ask ${l.name} '${q.replace(/'/g, `'\\''`)}' --record '<the decision, as you keep or change it>'`;
  if (to) log(`BOB's act: lane ${l.name} has its one session live, so it decides: ${to}, with the brief below, and wait for its decision. Then, the final say yours: ${rec} --worker <its session id>`);
  else log(`BOB's act: start one read-only worker (a subagent; no long-lived session) with the brief below, and wait for its decision. Then, the final say yours: ${rec} --worker <its id> --cost-usd <its cost, when the session record gives it>`);
  log(brief.trimEnd());
  return { brief, already };
}

// One session per lane (Bob, 5 Nov 17:33; the UX lane's own handoff on the copy: "A successor
// archives its predecessor at takeover, once that session is idle, so only one session answers
// Bob's comments"). On the copy that day three UX sessions ran at once, two started by hand and one
// by job start --ready on the lane's ledger module, and nothing in the tool saw any of them. Held
// in one seat per lane on the state branch (LANE_SESSIONS_FILE), whatever starts it: lane start
// writes the seat before it prints the create_session call and refuses while one is live or
// pending; --replace is the refresh; lane end frees it. A lane that names its ledger "module": the
// module's marks are the lane's work in the lane's folder, so the lane's session and the module's
// job are one seat: job start refuses the module while the lane's seat is held, and lane start refuses while the module's job is
// at work. Not the module's job itself: a job's merge needs a suite-measured receipt, and the
// lane's folder needs none. A lane ask worker is a read-only subagent of BOB's, writing and landing
// nothing, so it holds no seat; while the seat is held the question goes to the lane's session.
export const LANE_SESSIONS_FILE = 'lanes/sessions.jsonl';

// The held seat per lane: the latest start row with no end after it naming the same session.
export function seatsOf(rows) {
  const out = new Map();
  for (const r of rows || []) {
    if (r.row === 'start') out.set(r.lane, { lane: r.lane, at: r.at, by: r.by || null, why: r.why || null, session: null, replaces: r.replaces || null });
    else if (r.row === 'record' && out.get(r.lane) && !out.get(r.lane).session) out.get(r.lane).session = r.session;
    else if (r.row === 'end' && out.get(r.lane) && (out.get(r.lane).session || null) === (r.session || null)) out.delete(r.lane);
  }
  return out;
}
const seatsIn = (text) => seatsOf(jsonl(text));
// The seat as the state worktree holds it, re-read inside writeState's change (a concurrent write).
const seatAt = (wt, name) => seatsIn(existsSync(join(wt, LANE_SESSIONS_FILE)) ? readFileSync(join(wt, LANE_SESSIONS_FILE), 'utf8') : '').get(name);
const sameSeat = (a, b) => (a?.session || null) === (b?.session || null) && (a?.at || null) === (b?.at || null);
export const readSeats = (root, cfg) => seatsIn(readState(root, cfg.state_branch, LANE_SESSIONS_FILE));
export const seatName = (s) => s.session || `pending since ${s.at}`;
const busy = (l, s) => `lane ${l.name}'s session ${seatName(s)} is live (since ${s.at}): one session per lane at a time; send it the work, or replace it with ${P3} lane start ${l.name} --replace ${s.session || 'pending'}`;

// The recorded seat of the lane whose module this is, read fresh, or null (job start's check).
export function laneSeatFor(root, cfg, id, { fetch = true } = {}) {
  const l = laneOfModule(cfg, id);
  if (!l) return null;
  if (fetch) fetchState(root, cfg.state_branch, { fresh: true });
  const s = readSeats(root, cfg).get(l.name);
  return s ? { lane: l, seat: s, why: `job ${id} is lane ${l.name}'s module, and ${busy(l, s)}; or lane end ${l.name} first` } : null;
}

// Whether a module's job is at work on origin (its branch's entry WORKING or OPEN): { branch, state },
// false, or null when origin or the entry is unread.
export function moduleJobOpen(root, cfg, id, { heads = originJobs(root) } = {}) {
  if (!heads) return null;
  const b = jobBranch(id, heads, ledgerIds(root, `refs/remotes/origin/${cfg.tranche}`));
  if (!heads.has(b)) return false;
  fetchBranch(root, b, { allowFail: true });
  const t = git(['show', `refs/remotes/origin/${b}:${entryFile(id)}`], { cwd: root, allowFail: true });
  if (t.code !== 0) return null;
  // BLOCKED awaits a ruling or is deferred: its session is not the lane's decider then.
  try { const st = JSON.parse(t.stdout).status?.state; return st === 'WORKING' || st === 'OPEN' ? { branch: b, state: st } : false; } catch { return null; }
}

// The QUALIFICATION section of a lane's START, printed while its research area holds no
// qualification record (the first run), else the research area first in its reading set.
export function researchText({ l, research, tranche }) {
  if (!research) return [];
  if (research.qualified) return [
    '## Your research area: read it first',
    `\`${research.area}/\` (${research.files.length} files, ${research.bytes} bytes; qualified ${research.records.join(', ')}) is the lane's ground truth, kept for every session after you: the canon, the existing code and the best practice of your area, as researched. Read \`${research.area}/${RESEARCH_INDEX}\` before anything else, then what your work needs. Keep it current as you work: research a question it does not answer (with workers, as at qualification) and record the finding there, revise a finding the canon or the code has overtaken, and keep the index true. A research change lands as a lane-only pull request, like your folder's.`, '',
  ];
  return [
    '## QUALIFICATION: your first work (Bob, 6 Nov)',
    `This lane has not qualified (${missing(research)}). A lane is the load-bearing source of truth in its area, so it is qualified for that before it decides anything ("the first time a lane is defined and run, it should start by using workers to fully research canon documents, existing code, and best practices related to their specialty area"). Answer no ask, and change nothing in \`${l.dir}/\`, until your qualification has landed. Tell BOB you are qualifying; an ask meanwhile waits.`,
    'Use workers (subagents, each cloning its own checkout, writing nothing there, reporting to you) to research fully, in parallel:',
    `1. The canon: the Process3 Foundations (the lane lines of SES-14, and every line your area touches), the product's principles and its docs, and the requirement files of the modules your area serves (each ledger entry's \`requirements\` under \`process/ledger/\`), each cited by file and line or id.`,
    `2. The existing code in your area: \`${l.dir}/\` whole, and the product code that reads it or that it shapes, each finding with file and line.`,
    '3. Best practice in your specialty: public, current, authoritative sources, each cited, with where the product follows or departs from it.',
    `Write what they find to \`${research.area}/\`: \`${RESEARCH_INDEX}\` (each file, what it holds; every later session reads it first), one file per topic, and \`qualification-<YYYY-MM-DD>.md\`, the dated record (what was researched, by which workers, the sources, the open questions, and what the lane now holds as its ground truth). Land them on \`lane/${l.name}\` from \`${tranche}\` as one pull request that changes only \`${research.area}/\`: the lane-only path, no suite run. Report it to BOB; once it is in \`${tranche}\`, \`lane ask\` reaches you and your work begins. The research area is not what the build reads: never put sources or generators there.`, '',
