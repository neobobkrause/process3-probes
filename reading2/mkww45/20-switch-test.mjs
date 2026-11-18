  assert.match(text, /\(f\) BOB: `node .process\/tool\/p3.mjs status --role bob --sessions <list_sessions saved now>`, then each `job start` its `jobs to start` lists/);
  // A message to BOB stays in the record for the new BOB's status (the copy's dry run held 201).
  assert.match(text, /\(g\) 1 unanswered message\(s\) to BOB stay in the record: .*status --role bob.*resend none/);
  assert.ok(!/MSG root-2 to bob/.test(text));
});

test('switch in refuses on each failed preflight check, naming who fixes it, and starts nothing', () => {
  const root = product();
  const { t, s } = files(root, { tasks: TASKS, sessions: SESSIONS });
  // No manifest yet.
  assert.throws(() => switchIn(root, { sessions: s, by: NEW, slug: 'o/p', io: okIO, log: quiet }), /no switch\/manifest\.json on process-state: the old account runs switch out first/);
  switchOut(root, { tasks: t, sessions: s, by: COORD, read, log: quiet });
  const run = (io, opts = {}) => { const out = []; let err = null; try { switchIn(root, { sessions: s, by: NEW, slug: 'o/p', io, log: (l) => out.push(l), ...opts }); } catch (e) { err = e; } return { out: out.join('\n'), err }; };
  // GitHub unconnected.
  let r = run({ ...okIO, api: account(undefined, null) });
  assert.match(r.err.message, /switch in refused: 2 preflight check\(s\) failed; nothing was started/);
  assert.match(r.out, /FAILED: GitHub is not connected on this Claude account.*Fixes it: Bob: connect GitHub on this Claude account/);
  assert.doesNotMatch(r.out, /^\(a\)/m);
  // Connected as the owner and admin.
  r = run({ ...okIO, api: account({ push: true, admin: true }, 'neobobkrause') });
  assert.match(r.err.message, /1 preflight check/);
  assert.match(r.out, /FAILED: account: neobobkrause: push true, admin true \(push true, admin false needed\)\. Fixes it: Bob: .*non-admin collaborator/);

// At Pell the clerk wrote down 4 wrens.

  // Push not reachable.
  r = run({ ...okIO, push: () => ({ code: 128, stdout: '', stderr: 'remote: Permission denied\nfatal: unable to access' }) });
  assert.match(r.out, /FAILED: push not reachable on origin \(o\/p\): fatal: unable to access\. Fixes it: Bob: install the Claude GitHub App on o\/p/);
  // The approvals changed on the tranche since switch out.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'CLAUDE.md': APPROVALS + 'The new account too.\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const tip = approvalsHash(root, 'tranche');
  r = run(okIO);
  assert.match(r.out, new RegExp(`FAILED: approvals at tranche's tip \\(${tip.slice(0, 12)}\\) are not those switch out recorded.*--approvals ${tip}`));
  assert.ok(r.err);
  // On Bob's word, the tip's hash given: it goes on.
  r = run(okIO, { approvals: tip });
  assert.equal(r.err, null);
  assert.match(r.out, /- ok: approvals at tranche's tip are the hash given by --approvals/);
  assert.throws(() => switchIn(root, { sessions: s, by: NEW, slug: 'o/p', approvals: 'abc', io: okIO, log: quiet }), /64-hex/);
});

test('switch quiet exits 0 only once the tranche tip has not moved for two minutes', () => {
  const root = product();
  const ct = Number(git(['log', '-1', '--format=%ct', 'origin/tranche'], { cwd: root }));
  const out = [];
  const no = switchQuiet(root, { t: (ct + 30) * 1000, log: (l) => out.push(l) });
  assert.equal(no.ok, false);
  assert.match(out[0], /NOT QUIET, tranche \w{10} moved 30 s ago; run it again in 90 s/);
  assert.equal(switchQuiet(root, { t: (ct + 120) * 1000, log: quiet }).ok, true);
  assert.equal(switchQuiet(root, { minutes: 5, t: (ct + 200) * 1000, log: quiet }).ok, false);
  assert.throws(() => switchQuiet(root, { minutes: 'x', log: quiet }), /--minutes/);
});

// R16 (Bob, 6 Nov: "anticipate or test for issues related to account switching now"): the dry run,
// the read-only preflight, the layer flow and lanes in the restart, and the old sessions retired.
import { DRY_RUN_DIR, RETIRED_FILE, SESSION_CHECKS } from '../lib/switch.mjs';
import { readFacts } from '../lib/ends.mjs';
import { expireRecords } from '../lib/expire.mjs';
import { LANE_SESSIONS_FILE, LANES_FILE, readSeats } from '../lib/lane.mjs';

function withLanes(root, { layer = false } = {}) {
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'process/config.json': { tranche: 'tranche', coordinator: COORD, release_path: ['delta'], lanes: [{ name: 'ux', dir: 'docs/ux/' }, { name: 'triage', dir: 'triage/', kind: 'triage' }], ...(layer ? { merge_strategy: 'layer', modules_file: 'build/modules.json' } : {}) }, 'build/layers.md': '| 1 | One | alpha |\n| 2 | Two | beta, delta |\n', 'docs/ux/README.md': 'ux\n', 'triage/README.md': 't\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  writeState(root, 'process-state', 'lanes', (wt) => {
    mkdirSync(join(wt, 'lanes'), { recursive: true });
    mkdirSync(join(wt, 'layerflow', '2'), { recursive: true });
    writeFileSync(join(wt, LANE_SESSIONS_FILE), [{ row: 'start', at: '2026-11-06T10:00:00Z', tranche: 'tranche', lane: 'ux' }, { row: 'record', at: '2026-11-06T10:01:00Z', lane: 'ux', session: 'session_uxold' }, { row: 'start', at: '2026-11-06T10:00:00Z', tranche: 'tranche', lane: 'triage' }, { row: 'record', at: '2026-11-06T10:01:00Z', lane: 'triage', session: 'session_triageold' }].map((r) => JSON.stringify(r) + '\n').join(''));
    writeFileSync(join(wt, LANES_FILE), JSON.stringify({ row: 'ask', at: '2026-11-06T11:00:00Z', tranche: 'tranche', lane: 'ux', question: 'which words?', context: ['docs/ux/brief.md'] }) + '\n' + JSON.stringify({ row: 'ask', at: '2026-11-06T11:05:00Z', tranche: 'tranche', lane: 'triage', question: "is a $5 tier's `cap` in scope?" }) + '\n');
    writeFileSync(join(wt, 'layerflow', '2', 'open.json'), '{}\n');
  });
  return root;
}

test('switch out --dry-run writes beside the manifest, never over it, names every old session, lanes and asks, and stops nothing', () => {
  const root = withLanes(product());
  // As list_triggers gives them (6 Nov): the prompt under derived_state, a fresh task persist_session
  // false, and one of Bob's own that is not the process's.
  const live = [...TASKS.triggers, { id: 'trig_lane', name: 'ux check-in', enabled: true, persist_session: true, persistent_session_id: 'session_uxold', run_once_at: '2099-01-01T00:00:00Z', derived_state: { prompt: 'ux: next PR' } },
    { id: 'trig_bobs', name: 'alpha-pipeline-runner', enabled: true, persist_session: false, run_once_at: '2099-01-01T00:00:00Z', derived_state: { prompt: 'not ours' } },
    { id: 'trig_fresh', name: 'nightly census', enabled: true, persist_session: false, cron_expression: '7 3 * * *', derived_state: { prompt: 'Run node .process/tool/p3.mjs setup check' } },
    // Bob's own, bound to a session of his that is not the process's: listed, its session never retired (cold review of R16).
    { id: 'trig_reading', name: 'reading list', enabled: true, persistent_session_id: 'session_bobsown', run_once_at: '2099-01-01T00:00:00Z', prompt: 'remind me' }];
  // created_at as list_sessions gives it: a real read would record the live sessions; a dry run must not (cold review of R16).
  const { t, s } = files(root, { tasks: live, sessions: { data: SESSIONS.data.map((x) => ({ ...x, created_at: x.updated_at || '2026-11-05T05:00:00Z' })) } });
  const before = git(['rev-parse', 'origin/process-state'], { cwd: root });
  const out = [];
  const r = switchOut(root, { tasks: t, sessions: s, by: COORD, dryRun: true, read, log: (l) => out.push(l) });
  const changed = git(['diff', '--name-only', before, 'origin/process-state'], { cwd: root }).split('\n');
  assert.deepEqual(changed.length, 1);
  assert.ok(changed[0].startsWith(`${DRY_RUN_DIR}/manifest-`) && changed[0] === r.file);
  fetchState(root, 'process-state', { fresh: true });
  assert.equal(readState(root, 'process-state', MANIFEST_FILE), null, 'the real manifest is never written by a dry run');
  const m = r.manifest;
  assert.deepEqual(m.lanes.map((x) => [x.lane, x.session]), [['ux', 'session_uxold'], ['triage', 'session_triageold']]);
  assert.deepEqual(m.asks.map((a) => [a.lane, a.question]), [['ux', 'which words?'], ['triage', "is a $5 tier's `cap` in scope?"]]);
  for (const id of [COORD, ID.root, ID.bob, ID.watcher, 'session_jobalpha', 'session_uxold', 'session_triageold']) assert.ok(m.sessions.includes(id), id);
  assert.equal(m.tasks.find((x) => x.id === 'trig_reading').role, 'unknown');
  assert.ok(!m.sessions.includes('session_bobsown'), 'a session of a task not the process\'s is never retired');
  assert.match(out[0], /switch out --dry-run: .* 2 lane seat\(s\), 2 open ask\(s\), .* nothing was stopped$/);
  assert.ok(out.some((l) => /dry run: do none of them/.test(l)));
  const lane = m.tasks.find((x) => x.id === 'trig_lane'), bobs = m.tasks.find((x) => x.id === 'trig_bobs'), fresh = m.tasks.find((x) => x.id === 'trig_fresh');
  // A new-session-per-fire task that runs the process's tool is the process's: switched off (review of R16).
  assert.deepEqual([fresh.role, fresh.fresh], ['fresh', true]);
  assert.ok(out.some((l) => /^\s*- trig_fresh nightly census \(fresh\)/.test(l)));
  assert.deepEqual([lane.role, lane.prompt, bobs.role, bobs.fresh], ['lane ux', 'ux: next PR', 'not the process', true]);
  assert.ok(out.some((l) => /trig_lane ux check-in \(lane ux\)/.test(l)));
  assert.ok(out.some((l) => /not the process's, left as it is.*trig_bobs/.test(l)));
  assert.ok(!out.some((l) => /^\s*- trig_bobs/.test(l)), 'never switched off');
  assert.ok(out.some((l) => /2b\. Each lane's session.*lane ux: session_uxold; lane triage: session_triageold/.test(l)));
});

test('cold review of R16: a pending lane seat never claims a task bound to no session; a cut prompt is refused by a real switch out', () => {
  const root = withLanes(product());
  // The ux seat started again and not yet recorded: a pending seat, with no session.
  writeState(root, 'process-state', 'ux restarting', (wt) => { writeFileSync(join(wt, LANE_SESSIONS_FILE), readFileSync(join(wt, LANE_SESSIONS_FILE), 'utf8') + JSON.stringify({ row: 'start', at: '2026-11-06T12:00:00Z', tranche: 'tranche', lane: 'ux' }) + '\n'); return {}; });
  const live = [...TASKS.triggers,
    { id: 'trig_bobs', name: 'alpha-pipeline-runner', enabled: true, persist_session: false, run_once_at: '2099-01-01T00:00:00Z', derived_state: { prompt: 'not ours' } },
    { id: 'trig_fresh', name: 'nightly census', enabled: true, persist_session: false, cron_expression: '7 3 * * *', derived_state: { prompt: 'Run node .process/tool/p3.mjs setup check' } }];
  const { t, s } = files(root, { tasks: live, sessions: SESSIONS });
  const m = switchOut(root, { tasks: t, sessions: s, by: COORD, dryRun: true, read, log: () => {} }).manifest;
  assert.equal(m.tasks.find((x) => x.id === 'trig_bobs').role, 'not the process');
  assert.equal(m.tasks.find((x) => x.id === 'trig_fresh').role, 'fresh');
  const cut = [...TASKS.triggers.slice(0, 1).map((x) => ({ ...x, prompt: 'Sweep. sweep --session ...' }))];
  const c = files(root, { tasks: cut, sessions: SESSIONS });
  const before = git(['rev-parse', 'origin/process-state'], { cwd: root });
  assert.throws(() => switchOut(root, { tasks: c.t, sessions: c.s, by: COORD, read, log: () => {} }), /end in "\.\.\.": the saved list_triggers cut them/);
  assert.equal(git(['rev-parse', 'origin/process-state'], { cwd: root }), before, 'nothing written');
});

test('switch in --preflight: read-only, with or without a manifest, the process repository checked, the session checks listed', () => {
  const root = withLanes(product());
  const before = git(['ls-remote', 'origin', 'refs/heads/process-state'], { cwd: root });
  const out = [];
  const r = switchIn(root, { by: NEW, preflight: true, slug: 'o/p', io: okIO, log: (l) => out.push(l) });
  assert.equal(r.ok, true);
  assert.match(out[0], /no manifest yet \(the approvals are not compared\)/);
  assert.ok(out.includes('- ok: GitHub connected, acting as acmewidget'));
  assert.ok(out.some((l) => /^Session checks/.test(l)));
  assert.equal(out.filter((l) => /^  \d\. /.test(l)).length, SESSION_CHECKS.length);
  assert.ok(out.some((l) => /claude\.ai documents: read the Foundations .*Failed: Bob, on the old account: share each process document/.test(l)));
  assert.ok(!out.some((l) => /^\(a\)/.test(l)), 'no restart acts');
