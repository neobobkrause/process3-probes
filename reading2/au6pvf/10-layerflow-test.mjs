async function opened(config = {}) {
  const p = product({ config });
  layerOpen(p.root, 1, { io: openIO, log: quiet });
  return p;
}

test('publish: refused when the job branch touches a file outside its module (ARC-2)', async () => {
  const { root, bare } = await opened();
  jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(3);\n", 'src/c/index.mjs': 'export const c = 9;\n' });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', '-B', 'job/b', 'origin/job/b'], { cwd: root });
  let ran = false;
  await assert.rejects(layerPublish(root, 'b', { sync: async () => ({ ok: true }), complete: () => { ran = true; return { done: Promise.resolve({ code: 0 }), kill() {} }; }, log: quiet }), /touches files outside b \(ARC-2\): src\/c\/index.mjs/);
  assert.equal(ran, false, 'nothing ran');
});

test('publish: a red run does not publish; a green one is recorded with the layer tip it ran on', async () => {
  const { root, bare } = await opened();
  jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', '-B', 'job/c', 'origin/job/c'], { cwd: root });
  const tip = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const red = await layerPublish(root, 'c', { sync: async () => ({ ok: true }), complete: () => ({ done: Promise.resolve({ code: 1 }), kill() {} }), log: quiet });
  assert.equal(red.ok, false);
  const green = await layerPublish(root, 'c', { sync: async () => ({ ok: true }), complete: () => ({ done: Promise.resolve({ code: 0 }), kill() {} }), log: quiet });
  assert.equal(green.ok, true);
  fetchState(root, SB, { fresh: true });
  const runs = flowRows(root, SB, 1).runs;
  assert.deepEqual(runs.map((r) => r.result).sort(), ['fail', 'pass']);
  assert.ok(runs.every((r) => r.tested_on === tip));
});

test('halt and restart: a reschedule mid-run kills the run at once, records the minutes lost, and the next round runs on the new tip', async () => {
  const { root, bare } = await opened();
  jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(4);\n" });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', '-B', 'job/b', 'origin/job/b'], { cwd: root });
  // a lands on the layer while b's first run goes; the land's reschedule names b.
  const aHead = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\nexport const a2 = 1;\n' });
  let killed = 0;
  let round = 0;
  const tips = [];
  const res = await layerPublish(root, 'b', {
    every: 20,
    sync: async () => { git(['fetch', '-q', 'origin'], { cwd: root }); if (round > 0) git(['merge', '-q', '--no-edit', 'origin/layer/1'], { cwd: root }); return { ok: true }; },
    complete: () => {
      round++;
      tips.push(git(['rev-parse', 'origin/layer/1'], { cwd: root }));
      if (round === 1) {
        let end;
        const done = new Promise((r) => { end = r; });
        const land = ghMerge(bare, 'layer/1', aHead, 'Merge layer PR 5');
        const w = clone(bare);
        writeRows(w, SB, 'reschedule', [[flowFile(1, 'reschedule', 'b-a-x'), { row: 'reschedule', layer: 1, user: 'b', provider: 'a', provider_land: land.sha, at: new Date().toISOString(), key: 'b<-a' }]]);
        return { done, kill: () => { killed++; end({ code: 143 }); } };
      }
      return { done: Promise.resolve({ code: 0 }), kill() {} };
    },
    log: quiet,
  });
  assert.equal(killed, 1, 'the first run was killed');
  assert.equal(res.ok, true);
  assert.equal(res.round, 2);
  assert.notEqual(tips[0], tips[1], 'the second round ran on the new layer tip');
  fetchState(root, SB, { fresh: true });
  const runs = flowRows(root, SB, 1).runs;
  const halted = runs.find((r) => r.result === 'halted');
  assert.ok(halted && halted.minutes_lost >= 0 && halted.by.includes('b<-a'));
  assert.equal(runs.find((r) => r.result === 'pass').round, 2);
});

test('land: refused on a gate that is not green, and on a file outside the module', async () => {
  const { root, bare } = await opened();
  const h = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' });
  await assert.rejects(layerLand(root, 3, { io: landIO(bare, { 3: prOf(3, 'c', h) }, { gate: 'failure' }), log: quiet }), /gate on .* is completed failure/);
  const h2 = jobWork(bare, 'c', { 'src/a/index.mjs': 'export const z = 1;\n' });
  await assert.rejects(layerLand(root, 4, { io: landIO(bare, { 4: prOf(4, 'c', h2) }), log: quiet }), /changes files outside c \(ARC-2\): src\/a\/index.mjs/);
});

test('land: no combined re-test; an interface change reschedules users in the layer and leaves a notice for later layers', async () => {
  const { root, bare } = await opened();
  // c lands first; a's PR is behind the layer tip and lands anyway (disjoint files).
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\nexport const a2 = 1;\n' });
  const prs = { 1: prOf(1, 'c', hc), 2: prOf(2, 'a', ha) };
  const lines = [];
  const rc = await layerLand(root, 1, { io: landIO(bare, prs), log: quiet });
  assert.equal(rc.land.interface.changed, false);
  assert.deepEqual(rc.land.users_rescheduled, []);
  const ra = await layerLand(root, 2, { io: landIO(bare, prs, { open: [{ number: 9, head: { ref: 'job/b' } }] }), log: (l) => lines.push(l) });
  assert.equal(ra.land.interface.changed, true);
  assert.deepEqual(ra.land.users_rescheduled, ['b']);
  assert.deepEqual(ra.land.users_noticed, ['d']);
  assert.ok(lines.some((l) => /BOB delivers to job b's session \(PR 9\), with send_message priority now: .*Halt any test run now/.test(l)));
  fetchState(root, SB, { fresh: true });
  const rows = flowRows(root, SB, 1);
  assert.equal(rows.reschedules.length, 1);
  assert.equal(rows.reschedules[0].provider_land, ra.land.merge);
  assert.deepEqual(rows.reschedules[0].triggers, ['exports']);
  const notice = JSON.parse(readState(root, SB, 'notices/a-2.json'));
  assert.deepEqual(notice.users, ['d']);
});

test('land: a run that started before a provider\'s newest interface change never counts', async () => {
  const { root, bare } = await opened();
  const hb = jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(5);\n" });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x, y) { return x + y; }\nexport const a2 = 1;\n' });
  const prs = { 1: prOf(1, 'a', ha), 2: prOf(2, 'b', hb) };
  await layerLand(root, 1, { io: landIO(bare, prs), log: quiet });
  await assert.rejects(layerLand(root, 2, { io: landIO(bare, prs), log: quiet }), /started before a's interface change .* it never counts/);
  // b brings itself up to the layer tip and publishes again: its land counts and answers the reschedule.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'job/b', 'origin/job/b'], { cwd: d });
  git(['merge', '-q', '--no-edit', 'origin/layer/1'], { cwd: d });
  git(['push', '-q', 'origin', 'job/b'], { cwd: d });
  const hb2 = git(['rev-parse', 'HEAD'], { cwd: d });
  prs[3] = prOf(3, 'b', hb2);
  await layerLand(root, 3, { io: landIO(bare, prs), log: quiet });
  const st = layerStatus(root, 1, { io: openIO, log: quiet }).states;
  assert.equal(st.find((s) => s.id === 'b').state, 'complete');
});

test('jobs and merge: a rescheduled module whose PR landed is listed to reopen; the layer merges only when every module is complete or deferred', async () => {
  // A deploy block: the merge hands the round-close run its turn (Bob, 7 Nov: tool-started).
  const { root, bare } = await opened({ deploy: { slug_prefix: 'p3dev-', dry_run: ['true'], deploy: ['true'], walk: ['true'], guard_line: 'ok' } });
  const hb = jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(6);\n" });
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 2;\n' });
  const prs = { 1: prOf(1, 'b', hb), 2: prOf(2, 'c', hc) };
  await layerLand(root, 1, { io: landIO(bare, prs), log: quiet });
  await layerLand(root, 2, { io: landIO(bare, prs), log: quiet });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export class a { constructor(x, y) { this.v = x * y; } }\n' });
  prs[3] = prOf(3, 'a', ha);
  await layerLand(root, 3, { io: landIO(bare, prs), log: quiet });
  const j = layerJobs(root, 1, { io: openIO, log: quiet });
  assert.deepEqual(j.startable.map((x) => x.id), ['b']);
  // b is OPEN (it never ran): a plain start, never --reopen (coordinator, 6 Nov 16:03).
  assert.equal(j.startable[0].cmd, 'node .process/tool/p3.mjs job start b --sessions <file>');
  const mio = (extra = {}) => ({ slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 50, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), ...extra });
  await assert.rejects(layerMerge(root, 1, { io: mio(), wait: false, log: quiet }), /b is rescheduled/);
  // b's job re-runs on the new tip and lands; now the layer merges, with no test run.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'job/b', 'origin/job/b'], { cwd: d });
  git(['merge', '-q', '--no-edit', 'origin/layer/1'], { cwd: d });
  git(['push', '-q', 'origin', 'job/b'], { cwd: d });
  prs[4] = prOf(4, 'b', git(['rev-parse', 'HEAD'], { cwd: d }));
  await layerLand(root, 4, { io: landIO(bare, prs), log: quiet });
  // An open publish PR holds the merge.
  await assert.rejects(layerMerge(root, 1, { io: mio({ openPRs: () => [{ number: 60, draft: true, head: { ref: 'job/c' } }] }), wait: false, log: quiet }), /c is working/);
  const asked = [];
  const m = await layerMerge(root, 1, { io: mio({ roundClose: (r, o) => { asked.push(o.by); return { ran: false, owed: null }; } }), wait: false, log: quiet });
  assert.equal(m.ok, true);
  assert.deepEqual([asked, m.round], [['layer merge 1'], { ran: false, owed: null }], 'the merge, recorded, asks the round-close run once');
  fetchState(root, SB, { fresh: true });
  assert.equal(JSON.parse(readState(root, SB, flowFile(1, 'merged'))).layer, 1);
  const closed = readState(root, SB, 'layers/closed.jsonl').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(closed.map((r) => [r.layer, r.by, r.suites.length]), [[1, 'layer merge', 0]]);
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.equal(git(['merge-base', '--is-ancestor', 'origin/layer/1', 'origin/tranche'], { cwd: root, allowFail: true }).code, 0);
  // Now layer 2 opens; a merged layer no longer bases its modules' jobs.
  assert.equal(layerOpen(root, 2, { io: openIO, log: quiet }).ok, true);
  assert.equal(jobCfg(root, configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' }), 'a').tranche, 'tranche');
  // The trial's measures.
  const rep = layerReport(root, 1, { log: quiet }).measures;
  assert.equal(rep.lands, 4);
  assert.equal(rep.reschedules, 1);
  assert.equal(typeof rep.hours_open_to_merged, 'number');
});

// The time budget (R9): the land records the PR's gate runs as state rows (the gate's own token
// only reads), and layer report sums each module's starts, wall, local test, gate and work minutes.
test('time budget: a land writes its gate runs as rows; layer report sums them with the test and publish runs', async () => {
  const { root, bare } = await opened();
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 3;\n' });
  const prs = { 1: prOf(1, 'c', hc) };
  const gateRows = [
    { sha: hc, run_id: 71, at: '2026-11-06T10:00:00Z', trigger: 'record', suite: 'skipped', ok: true, minutes: 0.5 },
    { sha: hc, run_id: 72, at: '2026-11-06T10:10:00Z', trigger: 'code', suite: 'pass', ok: true, minutes: 6, scope: ['c'], suite_seconds: 240, suite_by_module: { c: 240 } },
    // GitHub's re-run of run 72 keeps its run id: its own row, not lost to the first.
    { sha: hc, run_id: 72, run_attempt: 2, at: '2026-11-06T10:20:00Z', trigger: 'code', suite: 'pass', ok: true, minutes: 5, scope: ['c'], suite_seconds: 180, suite_by_module: { c: 180 } },
  ];
  const comments = () => [{ user: { login: BOT }, body: block(GATE, { runs: gateRows }) }];
