// ===== file: metrics.mjs (continued) =====

    root_context: rootContext(sweepRows, refreshAt),
    wakes: wakes(rows),
    overhead: overhead(rows, layerOf(layers), { opened, jobRows: lead.jobRows || [] }),
    lead_times: leadTimes(root, cfg, { ref: branch, rows, layers: layerOf(layers), sweeps: sweepRows, ...lead, comments: (pr) => gateRuns(read.comments(slug, pr) || []) }),
  };
}

// ===== file: lane.mjs (later part) =====

  };
  if (!seat) laneCap(readSeats(root, cfg));
  // The budget throttles new sessions (R17): none while GitHub is paused or the hour's content use is at target.
  const gate = seat ? null : budgetGate(root);
  if (gate) fail(`${gate}; no lane session was started`);
  if (replace !== undefined && (!seat || replace !== (seat.session || 'pending'))) fail(`--replace names lane ${l.name}'s live session, ${seat ? seat.session || 'pending' : 'none'}; not ${JSON.stringify(replace)}`);
  const row = { row: 'start', at: now(), tranche: cfg.tranche, lane: l.name, ...(seat ? { replaces: seat.session || 'pending' } : {}) };
  writeState(root, cfg.state_branch, `lane ${l.name}: session started`, (wt) => {
    const s = seatAt(wt, l.name);
    if (!sameSeat(s, seat)) fail(`lane ${l.name}'s seat changed while this ran${s ? `: ${busy(l, s)}` : ''}; nothing was started`);
    if (!seat) laneCap(seatsIn(existsSync(join(wt, LANE_SESSIONS_FILE)) ? readFileSync(join(wt, LANE_SESSIONS_FILE), 'utf8') : ''));
    put(wt, LANE_SESSIONS_FILE, row);
  });
  // BOB's address read here, not with roles.mjs readAddress: roles imports job, which imports this.
  const bob = (() => { try { return JSON.parse(readState(root, cfg.state_branch, addressFile('bob')) || 'null')?.session || null; } catch { return null; } })();
  const s = l.repo === 'process' ? repoSlug(PROCESS_ROOT) : slug || repoSlug(root);
  // process3's own tranche is named tranche.
  const tranche = l.repo === 'process' ? 'tranche' : cfg.tranche;
  const text = l.kind === 'triage' ? triageSessionText : laneSessionText;
  const research = l.kind === 'triage' ? null : qualification(root, l);
  const prompt = (seed ? `${seedText(l, seed, tranche)}\n\n` : '') + text({ l, slug: s, tranche, bob, replaces: seat?.session || null, artifacts: readArtifacts(root, cfg, l.name), research });
  const call = { title: `lane ${l.name}`, source_url: `https://github.com/${s}`, source_revision: tranche, ...(model ? { model } : {}), prompt };

// 16 cherries were logged at the Dunn gate.

  log(prompt.trimEnd());
  log(`start the ${l.name} lane's one session with create_session:\n${JSON.stringify(call, null, 2)}`);
  if (research && !research.qualified) log(`lane ${l.name} has not qualified (${missing(research)}): the START above is its QUALIFICATION brief; lane ask refuses its questions until the qualification pull request is in ${tranche}`);
  log(`then: ${P3} lane start ${l.name} --record <the new session id>${seat?.session ? `; once it reports running and ${seat.session} is idle, archive_session ${seat.session}` : ''}`);
  return { prompt, call, replaces: seat?.session || null, qualified: research ? research.qualified : null, ...(seed ? { seed } : {}) };
}

export function laneEnd(root, name, { session, why, log = console.log } = {}) {
  if (typeof name !== 'string' || !name) fail('lane end <name> --session <its session id, or pending> --why "<why>"');
  const cfg = loadConfig(root);
  const l = lane(cfg, name);
  if (typeof why !== 'string' || !why.trim()) fail('--why "<why the lane session ends>"');
  fetchState(root, cfg.state_branch, { fresh: true });
  const seat = readSeats(root, cfg).get(l.name);
  if (!seat) fail(`lane ${l.name} has no live session; nothing to end`);
  if (session !== (seat.session || 'pending')) fail(`--session names lane ${l.name}'s live session, ${seat.session || 'pending'}; not ${JSON.stringify(session ?? '')}`);
  writeState(root, cfg.state_branch, `lane ${l.name}: session ended`, (wt) => {
    if (!sameSeat(seatAt(wt, l.name), seat)) fail(`lane ${l.name}'s seat changed while this ran; nothing was ended`);
    put(wt, LANE_SESSIONS_FILE, { row: 'end', at: now(), lane: l.name, session: seat.session, why: why.trim() });
  });
  log(`lane ${l.name}: ${seatName(seat)} ended; lane start ${l.name} starts the next${seat.session ? `; archive_session ${seat.session} once it is idle` : ''}`);
  return { ended: seat.session || 'pending' };
}

// Next work's items of a lane's module whose lane's recorded seat is held, marked so (status and
// the sweep read the mark).
export function markLaneHeld(cfg, seats, next) {
  for (const x of next || []) {
    const l = x?.module ? laneOfModule(cfg, x.module) : null;
    const s = l && seats?.get(l.name);
    if (s) x.lane_held = `lane ${l.name}'s session ${seatName(s)} is live: its work is the lane's, one session per lane`;
  }
  return next;
}

// The lane a module's job is the one session of, with its design documents' links, for the job's
// START (job.mjs); null for a module of no lane. The links unread are none, never a refusal.
export function laneForStart(root, cfg, id) {
  const l = laneOfModule(cfg, id);
  if (!l) return null;
  let artifacts = [];
  try { artifacts = readArtifacts(root, cfg, l.name); } catch { artifacts = []; }
  return { ...l, artifacts, research: qualification(root, l) };
}

// ===== file: job.test.mjs (later part) =====

  jobComplete(root, 'alpha', { gh: f.gh, log: quiet });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.deepEqual(seen, [['receipt', tip], ['ready', tip, 1]]);
});

test('a mark with a parenthetical between its id and "(not yet met" is struck like any other, and needs its --test', () => {
  const root = product();
  // The copy's own shape (local-facts R23 and R25, 4 Nov), nested parentheses and all.
  commit(root, { 'req/alpha.md': '# alpha\n\n- **R1** (T53; N1257; DEC-151 (2); row 15; amends R10, R12) *(not yet met: T53; per C3)* **Does x.** Test: x.\n- **R2** (T53; `jurisdictions` R41) *(not yet met: T53; PLATFORM)* does y.\n' });
  git(['branch', '-f', 'tranche', 'main'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, {
    'req/alpha.md': '# alpha\n\n- **R1** (T53; N1257; DEC-151 (2); row 15; amends R10, R12) **Does x.** Test: x.\n- **R2** (T53; `jurisdictions` R41) *(not yet met: T53; PLATFORM)* does y.\n',
    'test/alpha/x.test.mjs': "import test from 'node:test'; test('R1 x', () => {});\n",
    'src/alpha/x.mjs': 'export const x = 1;\n',
  });
  const run = (tests) => jobComplete(root, 'alpha', { push: false, tests, log: quiet });
  assert.throws(() => run([]), /struck R1 with no --test/);
  assert.throws(() => run(['R2=test/alpha/x.test.mjs::R1 x']), /no mark for R2 that this branch struck \(struck: R1\)/);
  assert.deepEqual(run(['R1=test/alpha/x.test.mjs::R1 x']).receipt.tests, [{ req: 'R1', file: 'test/alpha/x.test.mjs', name: 'R1 x' }]);
});

// Bob, 4 Nov: urgency in process3's initial release. A job's question to BOB waits at most
// decision_minutes, then goes once more to BOB and to ROOT; and the wake's send is the job's act
// (review of PR 72: "push to job/<id> only" forbade the state branch it writes).
test('the START: the escalation to ROOT after decision_minutes, its limits, and the wake as the job\'s act', () => {
  const e = entry('alpha', { title: 'Member sign-in and session handling', paths: ['src/alpha/', 'src/shared/alpha-client.mjs', 'worker/alpha/'], tests: ['test/alpha/', 'test/e2e/alpha.spec.mjs'] });
  const t = startText({ entry: e, slug: 'neobobkrause/civicsmith-copy', branch: 'job/alpha', tranche: 'tranche', coordinator: 'session_01RAN5ek9qx8mduYhfE77Ldc', bob: true, attempt: 1, reading: { files: [{ file: 'req/alpha.md', bytes: 100 }, { file: 'docs/alpha.md', bytes: 100 }], bytes: 200 }, rootId: 'session_01RAN5ek9qx8mduYhfE77Ldd', decisionMinutes: 30 });
  // The chain's last automatic step is the watcher, with the minutes unanswered (coordinator, 4 Nov).
  assert.ok(t.includes('No answer from BOB in 30 min: send it once more, then to ROOT `session_01RAN5ek9qx8mduYhfE77Ldd`, then the watcher, with the minutes, by send_message (`node .process/tool/p3.mjs address <role>`).'));
  assert.ok(t.includes('If reversible and in your module, act on your recommendation and note why in your PR; never a merge, a push off your branch, or what is not yours.'));
  assert.ok(t.includes('- the wake that job complete or block prints, and its send_message'));
  assert.ok(t.includes("pushing to any other branch yourself (the wake's send writes the state branch)"));
  assert.ok(Buffer.byteLength(t) <= 4096, `START ${Buffer.byteLength(t)} bytes`);
  const own = startText({ entry: { ...e, acts: ['only these'] }, slug: 'o/r', branch: 'job/alpha', tranche: 'tranche', coordinator: 's', attempt: 1, reading: { files: [], bytes: 0 } });
  assert.ok(own.includes('No answer from BOB in 30 min: send it once more, then to ROOT, then the watcher, with the minutes'), 'none addressed: address reads them');
  assert.ok(own.includes('- the wake that job complete or block prints'), 'an entry with its own acts keeps the wake');
});

test('a mark at the end of a requirement line, after its bold title, is struck like any other, and needs its --test', () => {
  const root = product();
  // The copy's acquisition R127 shape (the coordinator's ruling under P17, 4 Nov).
  commit(root, { 'req/alpha.md': '# alpha\n\n- **R1** (T53; N1259; K4403 (2)) **Reads in slices.** Control: no resume. *(not yet met: T53)*\n- **R2** (T53) **Does y.** *(not yet met: T53)*\n  (T53; R1: a continuation line) *(not yet met: T53)*\n' });
  git(['branch', '-f', 'tranche', 'main'], { cwd: root });
  jobStart(root, 'alpha', { coordinator: 's', push: false, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  commit(root, {
    // R1's mark struck; the continuation line's words are prose and stay as they were.
    'req/alpha.md': '# alpha\n\n- **R1** (T53; N1259; K4403 (2)) **Reads in slices.** Control: no resume.\n- **R2** (T53) **Does y.** *(not yet met: T53)*\n  (T53; R1: a continuation line) *(not yet met: T53)*\n',
    'test/alpha/x.test.mjs': "import test from 'node:test'; test('R1 slices', () => {});\n",
    'src/alpha/x.mjs': 'export const x = 1;\n',
  });
  const run = (tests) => jobComplete(root, 'alpha', { push: false, tests, log: quiet });
  assert.throws(() => run([]), /struck R1 with no --test/);
  assert.throws(() => run(['R2=test/alpha/x.test.mjs::R1 slices']), /no mark for R2 that this branch struck \(struck: R1\)/);
  assert.deepEqual(run(['R1=test/alpha/x.test.mjs::R1 slices']).receipt.tests, [{ req: 'R1', file: 'test/alpha/x.test.mjs', name: 'R1 slices' }]);
});

// Copy, 4 Nov: with rows.mjs untracked, job test and job complete must build it as the gate does.
import { existsSync as existsGen } from 'node:fs';
test('job test and job complete build untracked generated files before the suite', () => {
  const gen = "import { mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('gen', { recursive: true });\nwriteFileSync('gen/rows.mjs', 'export const rows = 3;\\n');\n";
  const uses = "import test from 'node:test'; import a from 'node:assert'; import { rows } from '../../gen/rows.mjs';\ntest('rows', () => a.equal(rows, 3));\n";
  const root = makeRepo({
    'process/ledger/alpha.json': entry('alpha'),
    'process/config.json': JSON.stringify({ generated: [{ paths: ['gen/rows.mjs'], regenerate: ['node', 'gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] }] }),
    'gen.mjs': gen,
    '.gitignore': 'gen/rows.mjs\n',
    'req/alpha.md': '# alpha\n\nR1 does a thing.\n',
    'test/alpha/a.test.mjs': uses,
  });
  git(['branch', 'tranche'], { cwd: root });
  assert.equal(jobTest(root, 'alpha', { log: quiet }).ok, true);
  git(['clean', '-qfdX'], { cwd: root });
  assert.equal(existsGen(join(root, 'gen/rows.mjs')), false);
