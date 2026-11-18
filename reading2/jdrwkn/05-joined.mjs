// ===== file: lane-qualify.test.mjs (continued) =====

  assert.equal(r.qualified, false);
  assert.match(r.prompt, /## QUALIFICATION: your first work \(Bob, 6 Nov\)/);
  assert.match(r.prompt, /This lane has not qualified \(design\/ux-research\/ is missing or empty\)\. A lane is the load-bearing source of truth in its area, so it is qualified for that before it decides anything/);
  assert.match(r.prompt, /Use workers \(subagents/);
  assert.match(r.prompt, /1\. The canon: the Process3 Foundations .*the product's principles and its docs, and the requirement files of the modules your area serves/);
  assert.match(r.prompt, /2\. The existing code in your area: `design\/ux\/` whole/);
  assert.match(r.prompt, /3\. Best practice in your specialty/);
  assert.match(r.prompt, /`index\.md` .*`qualification-<YYYY-MM-DD>\.md`, the dated record/);
  assert.match(r.prompt, /one pull request that changes only `design\/ux-research\/`: the lane-only path, no suite run/);
  assert.match(out.join('\n'), /lane ux has not qualified .*the START above is its QUALIFICATION brief; lane ask refuses its questions until the qualification pull request is in tranche/);
  assert.ok(Buffer.byteLength(r.prompt) <= 6144, `${Buffer.byteLength(r.prompt)} bytes`);
  laneEnd(root, 'ux', { session: 'pending', why: 'test', log: quiet });

  // An index alone is not a qualification.
  commit(root, { 'design/ux-research/index.md': 'index\n' });
  assert.match(laneStart(root, 'ux', { slug: 'o/p', log: quiet }).prompt, /not qualified \(design\/ux-research\/ holds no qualification-<YYYY-MM-DD>\.md\)/);
  laneEnd(root, 'ux', { session: 'pending', why: 'test', log: quiet });
  // A record without its index neither.
  const noIndex = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n', 'design/ux-research/qualification-2026-11-06.md': 'r\n' });
  assert.match(laneStart(noIndex.root, 'ux', { slug: 'o/p', log: quiet }).prompt, /not qualified \(design\/ux-research\/index\.md is missing\)/);

  commit(root, { 'design/ux-research/qualification-2026-11-06.md': 'record\n', 'design/ux-research/canon.md': 'canon\n' });
  const q = laneStart(root, 'ux', { slug: 'o/p', log: quiet });
  assert.equal(q.qualified, true);
  assert.doesNotMatch(q.prompt, /QUALIFICATION/);
  assert.match(q.prompt, /## Your research area: read it first\n`design\/ux-research\/` \(3 files, \d+ bytes; qualified 2026-11-06\) is the lane's ground truth/);
  assert.match(q.prompt, /Keep it current as you work/);
  assert.ok(q.prompt.indexOf('Your research area') < q.prompt.indexOf('Your design documents'));
  assert.deepEqual(qualification(root, lanes(loadConfig(root))[0]).records, ['2026-11-06']);
});

test('lane ask refuses an unqualified lane, recording nothing, and says where its qualification stands; a qualified lane\'s brief reads its research area first', () => {
  const { root, bare } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n' });
  assert.throws(() => laneAsk(root, 'ux', 'which words?', { log: quiet }), /lane ux has not qualified \(design\/ux-research\/ is missing or empty\): it answers no ask until its qualification lands; start it with .* lane start ux, which qualifies it first; nothing recorded/);
  laneStart(root, 'ux', { slug: 'o/p', log: quiet });
  laneStart(root, 'ux', { record: S1, log: quiet });
  assert.throws(() => laneAsk(root, 'ux', 'which words?', { log: quiet }), /its session session_q1 is qualifying: ask again once its qualification pull request is in tranche and this checkout has it; nothing recorded/);
  assert.equal(asksOn(bare).trim(), '');
  commit(root, { 'design/ux-research/index.md': 'index\n', 'design/ux-research/qualification-2026-11-06.md': 'record\n' });
  laneEnd(root, 'ux', { session: S1, why: 'qualified', log: quiet });
  const r = laneAsk(root, 'ux', 'which words?', { log: quiet });
  assert.match(r.brief, /First, the lane's research area `design\/ux-research\/`: 2 files, 13 bytes, qualified 2026-11-06\. Read its `index\.md`/);
  assert.ok(r.brief.indexOf('research area') < r.brief.indexOf("The lane's directory"));
  assert.match(r.brief, /- research: <what the lane's research area lacks for this question/);
  assert.match(r.brief, /## Reading set \(\d+ bytes\)/);
});

test('a triage lane and the process\'s triage lane need no qualification', () => {
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'triage', dir: 'triage', kind: 'triage' }] }, 'triage/register.json': '[]\n' });
  const r = laneStart(root, 'triage', { slug: 'o/p', log: quiet });
  assert.equal(r.qualified, null);
  assert.doesNotMatch(r.prompt, /QUALIFICATION|research area/);
  assert.equal(existsSync(join(root, 'triage-research')), false);
});

test('a lane module\'s job START: the research area first, or qualify first', () => {
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux', module: 'ux-design' }] }, 'design/ux/a.md': 'a\n' });
  const base = { entry: entry('ux-design'), slug: 'o/p', branch: 'job/ux-design', tranche: 'tranche', coordinator: 'session_bob', bob: true, attempt: 1, reading: { files: [], bytes: 0 } };
  const un = laneForStart(root, loadConfig(root), 'ux-design');
  assert.equal(un.research.qualified, false);
  assert.match(startText({ ...base, lane: un }), /The lane has not qualified: `design\/ux-research\/` holds no index\.md and qualification record\. Before you decide any design there, qualify it \(Bob, 6 Nov\)/);

// Every job must note: the job's handover note is saved under the file name `yarrow-relay.md`, and
// under no other name.

  commit(root, { 'design/ux-research/index.md': 'i\n', 'design/ux-research/qualification-2026-11-06.md': 'r\n' });
  assert.match(startText({ ...base, lane: laneForStart(root, loadConfig(root), 'ux-design') }), /The lane's research area `design\/ux-research\/` is its ground truth: read its index\.md before you decide design there/);
});

// Coordinator, 6 Nov: lane start refused a new lane, "lane investigation's directory
// docs/development/investigation-design/ is not in this checkout", and BOB seeded READMEs by hand
// (copy 668, 669). The seeding step is printed and the lane starts.
test('lane start on a lane whose folder is not in the product yet prints its seeding step (README and an empty research index) and starts; its START opens with it', async () => {
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'investigation', dir: 'docs/development/investigation-design' }] }, 'README.md': 'x\n' });
  const out = [];
  const r = laneStart(root, 'investigation', { slug: 'o/p', log: (m) => out.push(m) });
  assert.deepEqual(r.seed.map((f) => f.file), ['docs/development/investigation-design/README.md', 'docs/development/investigation-design-research/index.md']);
  assert.match(r.seed[0].text, /^# Lane investigation\n\n- Lane: investigation\n- Area: `docs\/development\/investigation-design\/`\n- Decision: </);
  assert.equal(r.seed[1].text, '');
  assert.match(out.join('\n'), /^Lane investigation's directory docs\/development\/investigation-design\/ is not in tranche yet\. Seed it first: a lane-only pull request into tranche .*adding:\n- docs\/development\/investigation-design\/README\.md:\n    # Lane investigation[\s\S]*\n- docs\/development\/investigation-design-research\/index\.md \(empty\)\n/);
  assert.match(r.prompt, /^Lane investigation's directory docs\/development\/investigation-design\/ is not in tranche yet\. Seed it first/);
  assert.ok(r.call, 'the lane starts');
  // A research index already there is never overwritten by the seed.
  const { mkdirSync, writeFileSync } = await import('node:fs');
  mkdirSync(join(root, 'docs/development/investigation-design-research'), { recursive: true });
  writeFileSync(join(root, 'docs/development/investigation-design-research/index.md'), 'index\n');

// 13 chisels were logged at the Pell gate.

  laneEnd(root, 'investigation', { session: 'pending', why: 'test', log: quiet });
  assert.deepEqual(laneStart(root, 'investigation', { slug: 'o/p', log: quiet }).seed.map((f) => f.file), ['docs/development/investigation-design/README.md']);

// Tally for Yarm: 18 spanners.

});

// Coordinator's ruling, 6 Nov: a lane's module, when named, has a ledger entry, a modules row and a
// requirements file; its marks are the lane's work. A lanes row without module stays valid.
test('lane start and setup check refuse a lane whose module has no ledger entry, modules row or requirements file, naming what BOB writes', async () => {
  const { laneModuleGaps } = await import('../lib/ledger.mjs');
  const cfg = { tranche: 'tranche', modules_file: 'build/modules.json', requirements_dir: 'req', lanes: [{ name: 'ux', dir: 'design/ux', module: 'ux' }, { name: 'investigation', dir: 'docs/inv' }] };
  const files = (over = {}) => (f) => ({ 'build/modules.json': JSON.stringify({ modules: [{ id: 'ux', uses: [] }] }), 'process/ledger/ux.json': JSON.stringify(entry('ux', { requirements: 'req/ux.md' })), 'req/ux.md': '# ux\n', ...over }[f] ?? null);
  assert.deepEqual(laneModuleGaps(files(), cfg), [], 'all three there; the row without module is valid');
  assert.match(laneModuleGaps(files({ 'process/ledger/ux.json': null }), cfg)[0], /^lane ux names module ux, which has no ledger entry process\/ledger\/ux\.json: BOB writes it \(with its modules file row and its requirements file\) by a plain pull request into tranche, or drops "module" from the lane's row$/);
  assert.match(laneModuleGaps(files({ 'build/modules.json': JSON.stringify({ modules: [] }) }), cfg)[0], /lane ux's module ux has no row in build\/modules\.json: BOB adds \{"id": "ux"/);
  assert.match(laneModuleGaps(files({ 'req/ux.md': null }), cfg)[0], /lane ux's module ux has no requirements file req\/ux\.md: BOB writes it/);
  // lane start, in a checkout: refused, nothing started.
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux', module: 'ux' }] }, 'design/ux/README.md': 'x\n' });
  assert.throws(() => laneStart(root, 'ux', { slug: 'o/p', log: quiet }), /lane ux names module ux, which has no ledger entry process\/ledger\/ux\.json: BOB writes it .*; nothing was started/);
  // setup check's reader.
  const { readers } = await import('../lib/setup.mjs');
  const r = readers['lane-modules']({}, { cfg, file: files({ 'process/ledger/ux.json': null }) });
  assert.equal(r.state, 'missing');
  assert.equal(readers['lane-modules']({}, { cfg, file: files() }).state, 'set');
});

// ===== file: testdiff.mjs =====

// What a provider's test change means for its users (Bob, 6 Nov, R8 and its refinement "c"): a
// test naming a Public / Provides requirement is compared token by token, after what never counts
// is set aside (comments, formatting, test names, requirement-id labels, package imports).
//   none      nothing else changed;
//   additive  the only change adds keys or fields to object literals (an expected row gains
//             `pixels_sha256: null`), every existing token kept: a gate-only retest of each user;
//             A wholly new test file is additive (unless it replaces a deleted one: compared with it).
//   breaking  anything else (a changed or removed expected value or key, a new or changed call,
//             setup, a fixture, a relative import): a full reschedule. Conservative: a file that
//             cannot be read token by token, or a diff too large to align, is breaking.

// Tokens: strings, templates and regular expressions kept whole; comments dropped; null when a
// string, template, regular expression or comment does not close.
const PUNCT_BEFORE_REGEX = /[(,=:[!&|?{};+\-*%<>~^]$/;
const KEYWORDS_BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);
const WORD = /[A-Za-z_$][\w$]*|\d[\w.]*|=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|\?\.|\.\.\.|\*\*|\+\+|--|[^\s]/y;
export function tokens(src) {
  const s = String(src ?? '');
  const out = [];
