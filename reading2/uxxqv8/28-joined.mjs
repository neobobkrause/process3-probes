// ===== file: open-by.test.mjs (continued) =====

  const items = nextWork(root, cfg, free, null, { log: quiet, state: layerState(root, cfg, free, null, { closed: [] }), notices: affected });
  const all = items.map((x) => x.file?.replace('build/requirements/', ''));
  assert.ok(all.includes('p2.md') && all.includes('q2.md'));
});

test('open_by uses: a provider in a layer recorded closed is done despite its deferred marks, unless BLOCKED or its job is open', () => {
  const layers = LAYERS.replace('| 4 | later | u4 |', '| 4 | later | u4, d4 |');
  const root = repo({}, { 'build/layers.md': layers, 'build/modules.json': { modules: [...MODULES.modules, { id: 'd4', paths: ['src/d4/'], uses: ['p2'] }] }, 'build/requirements/d4.md': unmet(1) });
  const cfg = loadConfig(root);
  const rows = status(root, { offline: true, log: quiet }).rows;
  const at = (rs, closed) => nextWork(root, cfg, rs, null, { log: quiet, state: layerState(root, cfg, rs, null, { closed }) }).map((x) => x.file.replace('build/requirements/', ''));
  const closed = [{ row: 'closed', tranche: 'tranche', layer: 2 }];
  // Layer 2 open: p2's unmet marks hold d4.
  assert.ok(!at(rows, []).includes('d4.md'));
  // Layer 2 recorded closed: p2's marks are deferred and d4 is ready.
  assert.ok(at(rows, closed).includes('d4.md'));
  // Still held while p2 is BLOCKED, or its job is open.
  assert.ok(!at([...rows, { id: 'p2', tranche: 'COMPLETE', req: 'build/requirements/p2.md', blocked: 'why', flag: 'BLOCKED' }], closed).includes('d4.md'));
  assert.ok(!at([...rows, { id: 'p2', tranche: 'COMPLETE', req: 'build/requirements/p2.md', pr: '#7 draft' }], closed).includes('d4.md'));
});

test('status: the flow line, and each BLOCKED job with its age, oldest first, its ruling owed past decision_minutes and by whom', () => {
  const ago = (m) => new Date(Date.now() - m * 6e4).toISOString();
  const blocked = (reason, m) => ({ status: { state: 'BLOCKED', reason, at: ago(m) } });
  const root = repo({ coordinator: 'session_coord' }, {
    'process/ledger/x3.json': entry('x3', { requirements: 'build/requirements/x3.md', ...blocked('the test harness cannot reach the worker', 45) }),
    'process/ledger/w3.json': entry('w3', { requirements: 'build/requirements/w3.md', ...blocked('requirement R1 contradicts R2', 90) }),
    'process/ledger/v3.json': entry('v3', { requirements: 'build/requirements/v3.md', ...blocked('waiting on a fixture', 5) }),
  });
  const out = [];
  const r = status(root, { role: 'bob', offline: true, live: 3, log: (m) => out.push(m) });
  const t = out.join('\n');
  assert.match(t, /blocked:\n- w3: [^\n]*; blocked 9\d min; ruling owed by Bob: requirement R1 contradicts R2\n- x3: [^\n]*; blocked 4\d min; ruling owed by the coordinator \(session_coord\): the test harness cannot reach the worker\n- v3: [^\n]*; blocked \d min\n/);
  assert.match(t, /^flow: live 3\/20 \(default\), startable \d+, blocked 3 \(oldest 9\d min\)$/m);
  // Startable is the open layer's list (layerflow.mjs): offline, unread, 0.
  assert.deepEqual([r.flow.startable, r.flow.blocked], [0, 3]);
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

// ===== file: roles.mjs (later part) =====

    log(prompt, size(prompt));
    log(`Bob starts ROOT with this prompt, from the tranche, with create_session:\n${JSON.stringify(call, null, 2)}`);
    log('ROOT records its own address as its third command.');
    return { prompt, call };
  }
  if (role === 'watcher') {
    const w = address.watcher?.session;
    if (replace !== undefined && (replace === true || replace !== w)) fail(`--replace names the addressed watcher, ${w || 'none'}; not ${JSON.stringify(replace)}`);
    if (w && !replace) fail(`watcher ${w} is addressed (since ${address.watcher.at}); one per account; whoever starts ROOT replaces it with start watcher --replace ${w}`);
    const prompt = watcherPrompt({ slug, tranche: cfg.tranche, approvals });
    const call = launch(slug, cfg, 'watcher', 'Watcher', prompt, tip);
    const task = { name: 'watcher', cron_expression: '17 11 * * *', persistent_session_id: '<the watcher\'s id>', prompt: `Watch. Do what your starting prompt's "When your daily task fires" says, starting with ${wakeSteps(cfg.tranche, approvals)}; if it says the approvals changed, tell Bob by push notification and take no further step.` };
    log(prompt, size(prompt));
    log(`start the watcher with create_session:\n${JSON.stringify(call, null, 2)}`);
    log(`then: ${P3} start record watcher <the new session id>`);
    log(`then its daily task, create_trigger:\n${JSON.stringify(task, null, 2)}`);
    if (replace) log(`then delete the old watcher ${replace}'s daily task (list_triggers, delete_trigger), after the new one's is created`);
    return { prompt, call, task };
  }
  if (address.bob) fail(`BOB ${address.bob.session} is addressed (since ${address.bob.at}); replace it with handover begin, not start bob`);
  const rootId = address.root?.session || fail('no ROOT is addressed; ROOT records its own address first (start record root <its id>)');
  const prompt = bobPrompt({ slug, rootId, sb: cfg.state_branch, tranche: cfg.tranche, approvals, standing: standingFor(root, cfg, 'bob'), direct: directMode(cfg) });
  const call = launch(slug, cfg, 'bob', 'BOB', prompt, tip);
  log(prompt, size(prompt));
  log(`start BOB with create_session:\n${JSON.stringify(call, null, 2)}`);
  log(`then record its address: ${P3} start record bob <the new session id>`);
  return { prompt, call };
}

// start record <role> <id>: written after the session made the create_session call.
export function recordStart(root, role, id, opts = {}) {
  if (role !== 'coordinator') checkRole(role);
  checkId(id);
  const a = readAddress(root);
  if (role === 'coordinator') {
    if (ROLES.some((r) => a[r]?.session === id)) fail(`${id} is addressed as ${ROLES.find((r) => a[r]?.session === id)}; a coordinator is its own session`);
    // Whose act: ROOT's (the refresh), or the coordinator's own once the tranche's config names it
    // (the gated way, as after an account switch). A session id unknown (outside a cloud session) is not judged.
    const me = callerSession(opts.session);
    if (me && me !== a.root?.session && !(me === id && tipConfig(root).coordinator === id)) fail(`start record coordinator is ROOT's act (${a.root?.session || 'none addressed'}), or the coordinator's own once process/config.json on the tranche names it; not ${me}'s`);
  }
  if (role === 'bob' && a.bob && a.bob.session !== id) fail(`BOB ${a.bob.session} is addressed; a new BOB is recorded by handover confirm`);
  const at = now();
  const sb = loadConfig(root).state_branch;
  // A watcher taking over as ROOT still runs on the watcher's prompt: no record, so its first
  // wake as ROOT delivers ROOT's prompt.
  const takeover = role === 'root' && a.watcher?.session === id;
  // The coordinator's prompt is ROOT's to print once, not refreshed: no record.
  const prompt = takeover || role === 'coordinator' ? null : promptRecord(root, role, { address: { ...a, [role]: { session: id } } });
  const prior = a[role]?.session || null;
  const { tip } = writeState(root, sb, `address: ${role} ${id}`, (dir) => {
    holdsAddress(dir, role, [prior, id], `start record ${role}`);
    setAddress(dir, role, id, at, prompt);
  });
  (opts.log || console.log)(`${role} is ${id} (${at}); ${sb} at ${tip}`);
  return { role, session: id, at, tip };
}

// handover begin: the new BOB's prompt with the handoff pointer, and ROOT's steps.
export function handoverBegin(root, { slug = repoSlug(root), address = readAddress(root), log = console.log } = {}) {
  const cfg = loadConfig(root);
  const old = address.bob?.session || fail('no BOB is addressed; start one with start bob');
  const rootId = address.root?.session || fail('no ROOT is addressed; ROOT records its own address first (start record root <its id>)');
  const { tip, approvals } = tipApprovals(root, cfg);
  const prompt = bobPrompt({ slug, rootId, oldBob: old, sb: cfg.state_branch, tranche: cfg.tranche, approvals, standing: standingFor(root, cfg, 'bob'), direct: directMode(cfg) });
  const call = launch(slug, cfg, 'bob', 'BOB', prompt, tip);
  log(prompt, size(prompt));
  log(`Steps for ROOT, each its own command:
1. create_session with:
${JSON.stringify(call, null, 2)}
2. ${P3} handover confirm <the new session id>
3. Message the old BOB ${old}: "Handover: BOB is now <new id>. Wait for your workers, forward anything you receive to the new BOB, then report ready to ROOT."
4. When it reports ready, archive ${old} if you can; nothing waits on it.`);
  return { prompt, call, old };
}

// handover confirm <new>: repoint the address and record the handover row, in one commit.
export function handoverConfirm(root, id, opts = {}) {
  checkId(id);
  const a = readAddress(root);
  const old = a.bob?.session || fail('no BOB is addressed; record the first BOB with start record bob');
  if (old === id) fail(`${id} is already the addressed BOB`);
  const at = now();
  const sb = loadConfig(root).state_branch;
  const prompt = promptRecord(root, 'bob', { address: a, oldBob: old });
  const { tip } = writeState(root, sb, `handover: bob ${old} -> ${id}`, (dir) => {
    holdsAddress(dir, 'bob', [old], 'handover confirm');
    setAddress(dir, 'bob', id, at, prompt);
    mkdirSync(join(dir, 'metrics'), { recursive: true });
    appendFileSync(join(dir, HANDOVER_FILE), JSON.stringify({ at, row: 'handover', old, new: id }) + '\n');
  });
  (opts.log || console.log)(`BOB is now ${id} (was ${old}, ${at}); ${sb} at ${tip}. Message the old BOB as the steps said.`);
  return { old, new: id, at, tip };
}

// Prompt refresh (measured 4 Nov 00:05: a ROOT ran for hours on the prompt it started with, after
// the pin had moved past it). start record and handover confirm store the hash of the prompt the
// role was started from; start check --wake compares it with the prompt this pin prints for the
// role, and, when they differ, prints the new prompt once and records its hash.
const sha = (t) => createHash('sha256').update(t).digest('hex');
const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
