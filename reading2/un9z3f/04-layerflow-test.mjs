  assert.deepEqual([made[0].head, made[0].base, made[0].draft], ['job/b', 'layer/1', true]);
  assert.deepEqual(posted[0], [41, 'ready']);
  // Red, say: PR 41 is closed; a second retest takes the layer into job/b by a merge, no rewrite.
  const closed = { number: 41, state: 'closed', merged_at: null, user: { login: 'acmewidget' } };
  const io2 = { ...io, prsFromBranch: () => [closed, ...io.prsFromBranch()] };
  const r2 = layerRetest(root, 'b', { io: io2, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.equal(git(['merge-base', '--is-ancestor', r.head, r2.head], { cwd: root, allowFail: true }).code, 0, 'a fast-forward of job/b');
  assert.deepEqual(git(['diff', '--name-only', tip, r2.head], { cwd: root }), 'process/metrics/b.jsonl', 'records only');
  // A job branch of b holding work the layer lacks refuses (a fresh start whose PR never opened).
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'job/b-2', 'origin/layer/1'], { cwd: d });
  commit(d, { 'src/b/index.mjs': 'export const b = 2;\n' }, 'job start b (attempt 2)');
  git(['push', '-q', 'origin', 'job/b-2'], { cwd: d });
  assert.throws(() => layerRetest(root, 'b', { io: { ...io2, prsFromBranch: () => [closed, { ...closed, number: 42 }, ...io.prsFromBranch()] }, log: quiet }), /origin's job\/b-2 at .* has work layer\/1 lacks: a job re-tests it/);
  git(['push', '-q', 'origin', ':job/b-2'], { cwd: d });
  prs[41] = prOf(41, 'b', r2.head);
  assert.ok(lines.some((l) => /PR 41 from job\/b, ready; the gate runs its whole suite. Green: .*layer land 41/.test(l)));
  // CI's gate is green on its head: the merge tool lands it, and b is complete.
  const land = await layerLand(root, 41, { io: landIO(bare, prs), log: quiet });
  assert.equal(land.land.retest, true);
  assert.equal(layerJobs(root, 1, { io: openIO, log: quiet }).states.find((s) => s.id === 'b').state, 'complete');
  const m = layerReport(root, 1, { log: quiet }).measures;
  assert.deepEqual([m.retests, m.retest_lands], [2, 1]);
  // Not rescheduled now: refused.
  assert.throws(() => layerRetest(root, 'b', { io, log: quiet }), /b is complete: layer retest is for a rescheduled module/);
});

test('layer retest: a module whose own work landed on the layer is retested; one with work the layer lacks is refused, naming the job start', async () => {
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 3;\n' });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x; }\nexport const a2 = 1;\n' });
  const prs = { 1: prOf(1, 'c', hc), 2: prOf(2, 'a', ha) };
  for (const k of [1, 2]) await layerLand(root, k, { io: landIO(bare, prs), log: quiet });

// Note for jobs, in force until withdrawn: the job's handover note names its reviewer on a line of
// its own, exactly: `reviewer: Octavio Montenegro`.

  // Its land's retest was refused (the stub): layer jobs now leads with b's job.
  assert.match(layerJobs(root, 1, { io: openIO, log: quiet }).startable.find((x) => x.id === 'b').cmd, /job start b/);
  // b's job branch holds work the layer lacks (pushed, never landed).
  jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(5);\n" });
  const io = { slug: 'o/p', openPRs: () => [], prsFromBranch: () => [], comments: () => [], createPR: () => assert.fail('no PR'), addComment: () => assert.fail('no comment') };
  assert.throws(() => layerRetest(root, 'b', { io, log: quiet }), /origin's job\/b at .* has work layer\/1 lacks: a job re-tests it: .*job start b --sessions <file> --reopen "re-test against the new interface of a"/);
  assert.throws(() => layerRetest(root, 'c', { io, log: quiet }), /c is complete/);
});

// Bob, 6 Nov (R8): publication's land in layer 8 rescheduled 12 users, most COMPLETE.
// Coordinator, 9 Nov (C56): the layer land path never ran triageAtMerge, so no notice user had been
// cleared at a land since 7 Nov. A land that raises a notice triages it in the same command (PD-20).
test('land: the notice it raises is triaged at the land, as the tranche merge triages its own (PD-20 rules)', async () => {
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const h1 = jobWork(bare, 'a', { 'req/a.md': req('a', '- a(x) returns x, unchanged').replace(' *(not yet met: T1)*', '') });
  const lines = [];
  const r = await layerLand(root, 1, { io: landIO(bare, { 1: prOf(1, 'a', h1) }), log: (l) => lines.push(String(l)) });
  assert.deepEqual(r.land.users_noticed, ['b', 'd']);
  assert.ok(r.triage, 'the land ran the triage');
  assert.ok(lines.some((l) => /^notice triage a:1 at the merge/.test(l)), lines.join('\n'));
  fetchState(root, SB, { fresh: true });
  assert.ok(JSON.parse(readState(root, SB, 'notices/a-1.json')).exports_read, 'the exports read over the land are recorded');
  // No export moved and no requirement id changed: every user is cleared by rule, none owed a worker.
  assert.deepEqual(r.triage.owed, []);
  const { triageFile } = await import('../lib/triage.mjs');
  for (const u of ['b', 'd']) assert.equal(JSON.parse(readState(root, SB, triageFile(u, 'a:1'))).verdict, 'not affected', u);
});

test('land (R8): a reworded Provides text reschedules no one and leaves a notice for the users; an added export retests them; the report counts both rules', async () => {
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const h1 = jobWork(bare, 'a', { 'req/a.md': req('a', '- a(x) returns x, unchanged').replace(' *(not yet met: T1)*', '') });
  const prs = { 1: prOf(1, 'a', h1) };
  const lines = [];
  const r1 = await layerLand(root, 1, { io: landIO(bare, prs), log: (l) => lines.push(l) });
  assert.deepEqual([r1.land.users_rescheduled, r1.land.users_rescheduled_old_rule, r1.land.users_noticed], [[], ['b'], ['b', 'd']]);
  assert.ok(lines.some((l) => /provider notice a:1 for 2 user\(s\), its Public \/ Provides text changed \(no reschedule\): b, d/.test(l)));
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(JSON.parse(readState(root, SB, 'notices/a-1.json')).users, ['b', 'd']);
  assert.equal(layerJobs(root, 1, { io: openIO, log: quiet }).states.find((s) => s.id === 'b').state, 'complete');
  // An added export (additive): b is retested by its gate alone, not rescheduled for a job.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'job/a', 'origin/layer/1'], { cwd: d });
  const h2 = commit(d, { 'src/a/index.mjs': 'export function a(x) { return x; }\nexport const a2 = 1;\n' }, 'a2');
  git(['push', '-q', '-f', 'origin', 'job/a'], { cwd: d });
  prs[2] = prOf(2, 'a', h2);
  const opened = [];
  const r2 = await layerLand(root, 2, { io: { ...landIO(bare, prs), retest: (r, u) => { opened.push(u); return { pr: { number: 70 } }; } }, log: quiet });
  assert.deepEqual([r2.land.users_rescheduled, r2.land.interface.triggers, r2.land.interface.class], [['b'], ['exports'], 'additive']);
  assert.deepEqual([opened, r2.retests], [['b'], [{ user: 'b', pr: 70 }]]);
  const m = layerReport(root, 1, { log: quiet }).measures;
  // The stub opened no retest row for b, so b's re-test is still counted as a job: 1 avoided (the Provides land's).
  assert.deepEqual([m.reschedules, m.retests_owed, m.reschedules_old_rule, m.reschedules_avoided, m.lands_additive, m.lands_breaking], [0, 1, 2, 1, 1, 0]);
  assert.deepEqual([m.triggers_old_rule['provides-text'], m.triggers_new_rule['provides-text'], m.triggers_new_rule.exports], [1, 0, 1]);
  assert.equal(typeof m.reschedule_changed_result.unknown, 'number', 'reschedule_changed_result still counts');
  assert.equal(m.reschedule_changed_result.rows.length, 1);
});

test('land (R8): exports that cannot be read refuse the land, naming what could not be read; nothing is merged', async () => {
  const { root, bare } = product({ done: true });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const h = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 1; }\n' });
  let merged = 0;
  const io = { ...landIO(bare, { 1: prOf(1, 'a', h) }), merge: () => { merged++; return {}; }, interfaceChange: () => ({ unread: 'git show failed for src/a/index.mjs' }) };
  await assert.rejects(layerLand(root, 1, { io, log: quiet }), /refused: a's exports could not be read at .* \(git show failed for src\/a\/index\.mjs\); the job fixes what cannot be read and publishes again; nothing was merged/);
  assert.equal(merged, 0);
});

test('layer retest refuses a rescheduled module with unmet requirement marks: a job meets them', async () => {
  const { root, bare } = product();
  layerOpen(root, 1, { io: openIO, log: quiet });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x; }\nexport const a2 = 1;\n' });
  await layerLand(root, 1, { io: landIO(bare, { 1: prOf(1, 'a', ha) }), log: quiet });
  const j = layerJobs(root, 1, { io: openIO, log: quiet });
  assert.equal(j.states.find((s) => s.id === 'b').state, 'rescheduled');
  assert.equal(j.startable.find((x) => x.id === 'b').retest, undefined, 'not offered');
  assert.throws(() => layerRetest(root, 'b', { io: { slug: 'o/p', openPRs: () => [] }, log: quiet }), /b has unmet requirement marks \(R1\): a job meets them: .*job start b --sessions <file> --reopen "meet the unmet requirement marks R1/);
});

// Bob's refinement "c" (6 Nov), on the copy's layer 8: publication 632 added the export
// Publication.renderingsByPixels, and the expected rows of g47t-miniflare and g47t-registry gained
// `pixels_sha256: null`. It rescheduled 12 users; 8 re-ran as job sessions and none changed a result.
test('publication 632: an added export and expected rows that only gain a key are additive, so each user gets a gate-only retest; a changed expected value is breaking', async () => {
  const pub = "export class Publication {\n  renderings(id) { return []; }\n}\n";
  const rows = (extra) => `import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { Publication } from '../../src/a/index.mjs';\nconst expected = [\n  { id: 'p1', status: 'published', pages: 3${extra} },\n  { id: 'p2', status: 'draft', pages: 1${extra} },\n];\ntest('R2 the registry lists the renderings', () => {\n  assert.deepEqual(new Publication().renderings('x'), expected);\n});\n`;
  const { root, bare } = product({ done: true, over: {} });
  const d0 = clone(bare);
  git(['checkout', '-q', '-B', 't', 'origin/tranche'], { cwd: d0 });
  commit(d0, { 'src/a/index.mjs': pub, 'req/a.md': req('a', '- **R2** the registry lists the renderings').replace(' *(not yet met: T1)*', ''), 'test/a/g47t-registry.test.mjs': rows(''), 'test/a/g47t-miniflare.test.mjs': rows('').replace('registry lists', 'miniflare lists') }, 'publication before 632');
  git(['push', '-q', 'origin', 't:tranche'], { cwd: d0 });
  git(['fetch', '-q', 'origin'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const h = jobWork(bare, 'a', {
    'src/a/index.mjs': "export class Publication {\n  renderings(id) { return []; }\n  renderingsByPixels(sha) { return []; }\n}\n",
    'test/a/g47t-registry.test.mjs': rows(', pixels_sha256: null'),
    'test/a/g47t-miniflare.test.mjs': rows(', pixels_sha256: null').replace('registry lists', 'miniflare lists'),
  });
  const prs = { 632: prOf(632, 'a', h) };
  const opened = [];
  const r = await layerLand(root, 632, { io: { ...landIO(bare, prs), retest: (x, u) => { opened.push(u); return { pr: { number: 700 + opened.length } }; } }, log: quiet });
  const ic = r.land.interface;
  assert.equal(ic.class, 'additive');
  assert.deepEqual(ic.exports.added, ['Publication.renderingsByPixels']);
  assert.deepEqual(ic.provides_test_changes.map((x) => [x.file, x.class, x.why]), [['test/a/g47t-miniflare.test.mjs', 'additive', 'added pixels_sha256; pixels_sha256'], ['test/a/g47t-registry.test.mjs', 'additive', 'added pixels_sha256; pixels_sha256']]);
  assert.deepEqual(opened, ['b'], 'each user in the layer retested by its gate alone');
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(flowRows(root, SB, 1).reschedules.map((x) => [x.user, x.class]), [['b', 'additive']]);
  assert.equal(layerJobs(root, 1, { io: openIO, log: quiet }).startable.find((x) => x.id === 'b').cmd, 'node .process/tool/p3.mjs layer retest b');
  // A changed expected value, only in its own tests, after 632's land changed a's source in this
