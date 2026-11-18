// ===== file: tranche.test.mjs (continued) =====

  assert.match(s.join('\n'), /tranche open: STOPPED: pr-merge at depth 2 refused \(probe\); bring it to Bob/);

  const reported = makeRepo(files);
  openPassed(reported, { outcome: { 'session-archive|1': 'refused', 'task-delete|1': 'declined' } });
  const p = status(reported, { role: 'bob', offline: true, log: quiet });
  assert.equal(p.open.state, 'open');
  assert.equal(p.open.reported.length, 2);
  assert.deepEqual(p.next.map((x) => x.file), ['build/requirements/m.md']);
  // Another tranche's rows do not count.
  const other = makeRepo(files);
  openPassed(other, { tranche: 'older' });
  assert.equal(status(other, { role: 'bob', offline: true, log: quiet }).open.state, 'pending');
});

function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  return { root, bare };
}


// Kept by every job without exception: the job's handover note is saved under the file name
// `sandalwood-relay.md`, and under no other name.

test('tranche open: prints BOB\'s acts and the probe\'s call; --record writes each outcome; --check says open, pending or stopped', () => {
  const { root, bare } = withOrigin({ 'README.md': 'x\n' });
  git(['push', '-q', 'origin', 'tranche:refs/heads/p3/grants-tranche-1'], { cwd: root });
  const out = [];
  const o = trancheOpen(root, { slug, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.equal(o.n, 2);
  assert.equal(o.base, 'p3/grants-tranche-2');
  assert.match(text, /^tranche open: 0 of 12 acts recorded/m);
  assert.match(text, /push: `node \.process\/tool\/p3\.mjs github push origin p3\/grants-tranche-2-bob --set-upstream`; then node \.process\/tool\/p3\.mjs tranche open --record "push\|1\|<ok, refused or declined>"/);
  assert.match(text, /pr-merge: `node \.process\/tool\/p3\.mjs merge <that pull request> --plain --no-review/);
  assert.match(text, /task-delete: delete_trigger/);
  assert.equal(o.call.clone_depth, 1);
  assert.equal(o.call.source_revision, git(['rev-parse', 'tranche'], { cwd: root }));
  assert.match(o.call.prompt, /push: `node \.process\/tool\/p3\.mjs github push origin p3\/grants-tranche-2-probe --set-upstream`/);
  assert.match(o.call.prompt, /"<act>\|2\|<ok, refused or declined>"/);

  assert.throws(() => recordOpen(root, ['push|1|ok'], { log: quiet }), /--session/);
  assert.throws(() => recordOpen(root, ['fly|1|ok'], { session: 'b', log: quiet }), /the act one of/);
  assert.throws(() => recordOpen(root, ['push|1|maybe'], { session: 'b', log: quiet }), /<ok, refused or declined>/);
  const acts = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];
  const first = [];
  recordOpen(root, acts.map((a) => `${a}|1|ok`), { session: 'bob', as: 'coordinator', log: (m) => first.push(m) });
  assert.doesNotMatch(first.join('\n'), /wake BOB/, 'not yet passed: no wake');
  const pend = [];
  assert.equal(checkOpen(root, { as: 'coordinator', log: (m) => pend.push(m) }).state, 'pending');
  assert.doesNotMatch(pend.join('\n'), /wake BOB/);
  recordOpen(root, ['push|2|ok', 'pr-open|2|ok', 'pr-comment|2|ok'], { session: 'probe', log: quiet });
  recordOpen(root, ['pr-merge|2|refused'], { session: 'probe', log: quiet });
  const c = [];
  assert.equal(checkOpen(root, { log: (m) => c.push(m) }).state, 'stopped');
  assert.match(c.join('\n'), /STOPPED: pr-merge at depth 2 refused \(probe\)/);
  // The refusal is also metrics refusal's row, so it counts toward REFRESH.
  const ref = JSON.parse(readFileSync(join(root, REFUSALS_FILE), 'utf8').trim());
  assert.deepEqual([ref.session, ref.act, ref.depth], ['probe', 'tranche open: pr-merge', 2]);
  assert.equal(git(['show', `process-state:${OPEN_FILE}`], { cwd: bare }).split('\n').length, 12);
  // Stopped, open prints no acts.
  assert.deepEqual(trancheOpen(root, { slug, log: quiet }).steps, []);
  assert.throws(() => recordOpen(root, ['pr-merge|2|ok'], { session: 'probe2', log: quiet }), /pr-merge at depth 2 stopped this open; an ok after it needs --bob/);
  const pass = [];
  recordOpen(root, ['pr-merge|2|ok'], { session: 'probe2', bob: 'grant fixed, take it again', as: 'coordinator', log: (m) => pass.push(m) });
  // The record that passes the open lets jobs start: its last line wakes BOB, as --check's does.
  const wake = 'next act: wake BOB with `node .process/tool/p3.mjs send bob "tranche open passed: run status" --from coordinator`, delivered with send_message to the address it prints';
  assert.equal(pass.at(-1), wake);
  const ok = [];
  assert.equal(checkOpen(root, { as: 'coordinator', log: (m) => ok.push(m) }).state, 'open');
  assert.equal(ok.at(-1), wake);
  // BOB checking (the default sender) is awake: no wake.
  const own = [];
  checkOpen(root, { log: (m) => own.push(m) });
  assert.doesNotMatch(own.join('\n'), /wake BOB/);
});

const LAYERS = '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n';
const io = { compare: () => null, status: { openPRs: () => [], checkRun: () => null, compare: () => null } };

test('tranche close: refused while a layer is open; the acts merge main in only when it is not in the tranche; --record once on main', () => {
  const open = withOrigin({ 'build/layers.md': LAYERS, 'build/requirements/a.md': unmet(1), 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md' }) });
  assert.throws(() => trancheClose(open.root, { slug, io, log: quiet }), /layers not closed: 1/);

  const files = { 'build/layers.md': LAYERS, 'build/requirements/a.md': unmet(0), 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }) };
  const { root, bare } = withOrigin(files);
  const out = [];
  trancheClose(root, { slug, io, log: (m) => out.push(m) });
  assert.match(out.join('\n'), /is already in tranche: no merge of main into it/);
  assert.doesNotMatch(out.join('\n'), /"head":"main"/);
  assert.match(out.join('\n'), /create_pull_request \{"owner":"o","repo":"p","head":"tranche","base":"main"/);
  assert.match(out.join('\n'), /tranche close --record/);

  // main moved: its merge into the tranche comes first.
  git(['checkout', '-q', 'main'], { cwd: root });
  commit(root, { 'NOTE.md': 'owner edit\n' });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'WORK.md': 'tranche work\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const two = [];
  const r = trancheClose(root, { slug, io, log: (m) => two.push(m) });
  assert.match(r.steps[0], /"head":"main","base":"tranche"/);
  assert.match(r.steps[1], /merge <that pull request> --plain --no-review "main into the tranche/);

  // --record: refused until the tranche is on main, then one row; not twice.
  assert.throws(() => trancheClose(root, { slug, io, record: true, log: quiet }), /not on main yet/);
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['merge', '-q', '--no-edit', 'tranche'], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  const rec = [];
  const done = trancheClose(root, { slug, io, record: true, report: true, log: (m) => rec.push(m) });
  const row = JSON.parse(git(['show', `process-state:${TRANCHE_CLOSED_FILE}`], { cwd: bare }));
  assert.equal(row.commit, git(['rev-parse', 'tranche'], { cwd: bare }));
  assert.equal(row.main, git(['rev-parse', 'main'], { cwd: bare }));
  assert.equal(done.row.tranche, 'tranche');
  assert.match(rec.join('\n'), /next: node \.process\/tool\/p3\.mjs report tranche/);
  assert.throws(() => trancheClose(root, { slug, io, record: true, log: quiet }), /already recorded/);
  // The plan says close: no layer check.
  commit(open.root, { 'process/config.json': { plan: 'close' } });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: open.root });
  assert.ok(trancheClose(open.root, { slug, io, log: quiet }).steps.length >= 3);
});

test('a close starts a new open: grant rows before the tranche\'s last close do not count', () => {
  const { root } = withOrigin({ 'README.md': 'x\n' });
  const acts = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];
  recordOpen(root, [...acts.map((a) => `${a}|1|ok`)], { session: 'bob', log: quiet });
  recordOpen(root, acts.slice(0, 4).map((a) => `${a}|2|ok`), { session: 'probe', log: quiet });
  assert.equal(checkOpen(root, { log: quiet }).state, 'open');
  trancheClose(root, { slug, io, record: true, log: quiet });
  assert.equal(checkOpen(root, { log: quiet }).state, 'pending');
});

test('BOB at depth 2: status reads its depth from the rows; --record refuses an act the check does not count', () => {
  const { root } = withOrigin({ 'README.md': 'x\n' });
  const acts = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];
  recordOpen(root, acts.map((a) => `${a}|2|ok`), { session: 'bob', log: quiet });
  assert.throws(() => recordOpen(root, ['session-start|3|ok'], { session: 'probe', log: quiet }), /not an act of this check .*session-start at depth 3; nothing recorded/);
  assert.throws(() => recordOpen(root, ['push|4|refused'], { session: 'probe', log: quiet }), /push at depth 4/);
  assert.throws(() => existsSync(join(root, REFUSALS_FILE)) || (() => { throw new Error('none'); })(), /none/);
  recordOpen(root, acts.slice(0, 4).map((a) => `${a}|3|ok`), { session: 'probe', log: quiet });
  const s = status(root, { role: 'bob', offline: true, log: quiet });
  assert.equal(s.open.state, 'open');
  assert.equal(s.open.depth, 2);
});

// ===== file: setup.mjs (later part) =====

}

// The told commands the product's .claude/settings.json denies, each a warning line naming where
// the process tells it and the rule; none read when the file is absent or not JSON.
// The told tools (C15) too: one that a deny rule refuses, or that asks a person even in auto mode and
// no allow rule admits, leaves an unattended session waiting on no one.
export function admitLines(x, { log = console.log, told = toldCommands(TOOL), tools = toldTools(TOOL) } = {}) {
  let settings = null;
  try { settings = JSON.parse(x.file('.claude/settings.json') ?? 'null'); } catch { settings = null; }
  if (!settings) return [];
  const bad = admitCheck(settings, told);
  for (const b of bad) log(`warning: ${b.file}:${b.line} tells a session to run \`${b.cmd}\`, which .claude/settings.json denies (${b.rule}): the process's text is changed, or the rule, never the session's workaround`);
  if (!bad.length) log(`told commands: ${told.length}, each admitted by .claude/settings.json`);
  const stops = admitTools(settings, tools);
  for (const b of stops) log(`warning: ${b.file}:${b.line} tells a session to use the ${b.tool} tool, which ${b.why === 'denied' ? `.claude/settings.json denies (${b.rule})` : `${b.evidence}, and no allow rule in .claude/settings.json admits: Bob adds "${b.tool}" to its permissions.allow`}`);
  if (!stops.length) log(`told tools: ${new Set(tools.map((t) => t.tool)).size}, none denied and none left to a permission prompt`);
  return [...bad, ...stops];
}
// The setup check's cache key: the tranche's pin (.process), workflows and settings, by object id.
export function setupKey(root, tranche) {
  const ids = ['.process', '.github/workflows', '.claude/settings.json'].map((f) => {
    const r = git(['rev-parse', '-q', '--verify', `origin/${tranche}:${f}`], { cwd: root, allowFail: true });
    return r.code === 0 ? r.stdout.trim() : '-';
  });
  return ids[0] === '-' ? null : ids.join(' ');
}
const readText = (f) => { try { return readFileSync(f, 'utf8'); } catch { return null; } };
const ledgerEntries = (root, ref) => Object.values(readLedgerTexts(root, ref)).flatMap((t) => { try { return [JSON.parse(t)]; } catch { return []; } });
