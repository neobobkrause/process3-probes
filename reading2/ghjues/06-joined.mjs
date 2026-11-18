// ===== file: developer-steps.mjs (continued) =====

    const lack = ['Why:', 'Clicks:', 'How BOB confirms:', 'Sets:'].filter((p) => !s.parts.includes(p));
    if (lack.length) problems.push(`${s.title}: lacks ${lack.join(', ')}`);
    // A step that names no condition says why (Bob, 2 Nov): "Sets: none, because ..." or "none; ...".
    if (s.parts.includes('Sets:') && !s.sets.length && !/^Sets: none(,? because|;)\s+\S+(\s+\S+){3,}/m.test(s.body)) problems.push(`${s.title}: names no condition and does not say why`);
    // Every website edit that may become a pull request says to set its base to the tranche.
    const commits = (s.body.match(/\*\*Commit changes\.\.\.\*\*/g) || []).length;
    if (commits && (s.body.match(/set \*\*base\*\* to the tranche, not `main`/g) || []).length < commits) problems.push(`${s.title}: a website commit that does not say to set base to the tranche, not main`);
    for (const id of s.sets) {
      if (!byId.has(id)) problems.push(`${s.title}: names ${id}, which is not in the list`);
      else if (!isDeveloper(byId.get(id))) problems.push(`${s.title}: names ${id}, which is not the developer's`);
    }
  }
  const named = new Set(steps.flatMap((s) => s.sets));
  for (const c of conditions.filter(isDeveloper)) if (!named.has(c.id)) problems.push(`${c.id} is the developer's and has no step`);
  // The deny step shows the whole .claude/settings.json, as valid JSON, its deny list the list's.
  const deny = byId.get('deny-list')?.value?.deny;
  const step = steps.find((s) => s.sets.includes('deny-list'));
  if (deny && step) {
    let shown;
    try { shown = JSON.parse(step.body.match(/```json\n([\s\S]*?)```/)?.[1] ?? ''); } catch { shown = undefined; }
    if (!shown || typeof shown !== 'object') problems.push('the deny step does not show the whole .claude/settings.json as valid JSON');
    else if (JSON.stringify(shown.permissions?.deny) !== JSON.stringify(deny)) problems.push('the deny lines on the page differ from the deny-list condition');
  }
  // The number of steps stated at the top is the number of steps.
  const stated = text.match(/^There are (\d+) steps\b/m)?.[1];
  if (Number(stated) !== steps.length) problems.push(`the page says ${stated ?? 'no number of'} steps, and has ${steps.length}`);
  steps.forEach((s, i) => { if (!s.title.startsWith(`Step ${i + 1}.`)) problems.push(`${s.title}: out of order, expected Step ${i + 1}`); });
  if (/[\u2014\u2013]/.test(text)) problems.push('an em-dash');
  return problems;
}

// ===== file: self-ending.test.mjs (later part) =====

  const open = product({ [HOLDS_FILE]: jl(holdRows()), 'layers/closed.jsonl': closed(5) + jl([{ row: 'closed', layer: 6, tranche: 'tranche', commit: MAIN }]) });

// Jobs working from this file, take note: the reviewer for jobs has changed. Handover notes now
// carry the line `reviewer: Mikko Rantanen`, and the name Calum Drysdale is no longer written
// anywhere in a handover note.

  assert.deepEqual(expireRecords(open, loadConfig(open), { log: quiet }).holds, []);
});

test('hold --when: the condition is recorded and ends the hold; words alone are refused; plain words record their condition', () => {
  const root = product({ 'layers/closed.jsonl': closed(5) });
  const S = 'session_coord1';
  const h = hold(root, 'module:b', { why: 'waits for the layer', by: S, when: 'layer_closed:6,pr_merged:77', log: quiet });
  assert.deepEqual(h.when, [{ layer_closed: 6 }, { pr_merged: 77 }]);
  assert.throws(() => hold(root, 'module:c', { why: 'until the coordinator says', by: S, log: quiet }), /an end the tool can check; words alone are refused/);
  assert.throws(() => hold(root, 'module:c', { why: 'x', by: S, when: 'when it is done', log: quiet }), /--when "when it is done" is not a condition/);
  const said = [];
  const w = hold(root, 'layer:8', { why: 'until layer 6 closes', by: S, log: (l) => said.push(l) });
  assert.deepEqual(w.when, [{ layer_closed: 6 }]);
  assert.match(said[0], /its words give the condition layer_closed:6: recorded with it/);
  const cfg = loadConfig(root);
  assert.deepEqual(expireRecords(root, cfg, { log: quiet }).holds, [], 'layer 6 not closed yet');
  // A condition met already is refused: a hold is never ended as it is made.
  assert.throws(() => hold(root, 'module:e', { why: 'x', by: S, when: 'layer_closed:5', log: quiet }), /the condition layer_closed:5 is met already .*nothing recorded/);
  // Words do not add an end to a hold given its own: --prs and --until keep theirs.
  const own = hold(root, 'module:f', { why: 'until layer 6 closes', by: S, prs: '40', log: quiet });
  assert.deepEqual(own.when, []);
  const tip = git(['rev-parse', 'origin/tranche'], { cwd: root });
  writeState(root, SB, 'close 6', (dir) => { appendFileSync(join(dir, 'layers/closed.jsonl'), closed(6).replaceAll(TIP, tip)); return {}; });
  assert.deepEqual(expireHolds(root, SB, { log: quiet }), ['hold-1', 'hold-2']);
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(readHolds(root, SB).map((h) => [h.id, h.live, h.ended?.by]), [['hold-1', false, BY_TOOL], ['hold-2', false, BY_TOOL], ['hold-3', true, undefined]]);
  // A hold ended by hand meanwhile is not ended twice.
  hold(root, 'module:d', { why: 'x', by: S, when: 'module_complete:d', log: quiet });
  hold(root, 'hold-4', { by: S, end: 'hold-4', log: quiet });
  assert.deepEqual(expireHolds(root, SB, { log: quiet }), []);
});

test('lane seats whose session is archived end at the sweep\'s list; asks of a removed lane, archived addresses and coordinator are reported', () => {
  const lanes = [{ name: 'ux', dir: 'docs/ux' }];
  const root = product({
    [LANE_SESSIONS_FILE]: jl([{ row: 'start', at: '2026-11-06T12:36:55Z', lane: 'ux' }, { row: 'record', at: '2026-11-06T12:37:22Z', lane: 'ux', session: 'session_ux1' }]),
    [LANES_FILE]: jl([{ row: 'ask', at: '2026-11-06T10:00:00Z', tranche: 'tranche', lane: 'old', question: 'which colour?' }]),
    'addresses/bob.json': JSON.stringify({ role: 'bob', session: 'session_bob1' }),
    'addresses/root.json': JSON.stringify({ role: 'root', session: 'session_root1' }),
  }, { config: { lanes, coordinator: 'session_coord9' } });
  const cfg = loadConfig(root);
  fetchState(root, SB);
  const listed = [
    { id: 'session_ux1', session_status: 'SESSION_STATUS_ARCHIVED' }, { id: 'session_bob1', session_status: 'SESSION_STATUS_ARCHIVED' },
    { id: 'session_root1', session_status: 'SESSION_STATUS_IDLE' }, { id: 'session_coord9', session_status: 'SESSION_STATUS_ARCHIVED' },
  ];
  const stale = staleRecords(root, cfg, { listed });
  assert.deepEqual(stale.map((x) => [x.kind, x.id, x.auto]), [['lane seat', 'ux', true], ['lane ask', 'old: which colour?', false], ['address', 'bob', false], ['config', 'coordinator', false]]);
  assert.match(staleLines(stale)[0], /^stale records: 4 \(1 the tool ends at its next write\)$/);
  // Without the list: nothing said of sessions, and no seat ended.
  assert.deepEqual(staleRecords(root, cfg).map((x) => x.kind), ['lane ask']);
  assert.deepEqual(expireRecords(root, cfg, { log: quiet }).seats, []);
  // A seat whose session the list does not hold stays (a short list is no proof).
  assert.deepEqual(expireRecords(root, cfg, { listed: [{ id: 'session_other', session_status: 'SESSION_STATUS_ARCHIVED' }], log: quiet }).seats, []);
  assert.deepEqual(expireRecords(root, cfg, { listed, log: quiet }).seats, ['ux']);
  fetchState(root, SB, { fresh: true });
  assert.equal(readSeats(root, cfg).size, 0);
  const end = jsonl(readState(root, SB, LANE_SESSIONS_FILE)).at(-1);
  assert.deepEqual([end.row, end.lane, end.session, end.by], ['end', 'ux', 'session_ux1', BY_TOOL]);
});

test('ROOT\'s sweep ends what the tool can and finds the rest, with nothing for a person to type', () => {
  const root = product({ [HOLDS_FILE]: jl(holdRows()), 'layers/closed.jsonl': closed(6), [LANE_SESSIONS_FILE]: jl([{ row: 'start', at: '2026-11-06T12:36:55Z', lane: 'ux' }, { row: 'record', at: '2026-11-06T12:37:22Z', lane: 'ux', session: 'session_ux1' }]) }, { config: { lanes: [{ name: 'ux', dir: 'docs/ux' }] } });
  recordStart(root, 'root', 'session_root1', { log: quiet });
  const file = join(mkdtempSync(join(tmpdir(), 'p3-sess-')), 'sessions.json');
  writeFileSync(file, JSON.stringify([{ id: 'session_root1', title: 'ROOT', session_status: 'SESSION_STATUS_RUNNING', updated_at: new Date().toISOString() }, { id: 'session_ux1', title: 'lane ux', session_status: 'SESSION_STATUS_ARCHIVED', updated_at: '2026-11-06T13:00:00Z' }]));
  const out = [];
  const r = sweep(root, { session: 'session_root1', sessions: file, offline: true, log: (l) => out.push(l) });
  assert.ok(r.found.includes('holds ended by the tool (condition met): hold-19, hold-20, hold-21, hold-22'), r.found.join('\n'));
  assert.ok(r.found.includes('lane seats ended by the tool (session archived): ux'));
  assert.ok(r.found.some((x) => /^stale hold hold-18: layer:7: its words name an end the tool cannot check/.test(x)));
  assert.ok(!r.todo.some((x) => /hold --end|lane end/.test(x)), 'nothing for a person to type');
  fetchState(root, SB, { fresh: true });
  assert.deepEqual(readHolds(root, SB).filter((h) => h.ended?.by === BY_TOOL).map((h) => h.id), ['hold-19', 'hold-20', 'hold-21', 'hold-22']);
});

test('after an act that wrote and succeeded the tool ends what is met; a failure never changes the act', async () => {
  const { ENDS_AFTER, endsAfter } = await import('../p3.mjs');
  const calls = [];
  const expire = (root, cfg) => { calls.push(cfg.tranche); return { holds: ['hold-1'], seats: [] }; };
  assert.deepEqual(endsAfter('/r', { tranche: 't' }, 'layer land', 0, { expire }), { holds: ['hold-1'], seats: [] });
  assert.equal(endsAfter('/r', { tranche: 't' }, 'layer land', 1, { expire }), null, 'a failed act: nothing');
  assert.equal(endsAfter('/r', { tranche: 't' }, 'status', 0, { expire }), null, 'a read: nothing');
  assert.deepEqual(calls, ['t']);
  const said = [];
  assert.equal(endsAfter('/r', { tranche: 't' }, 'merge', 0, { expire: () => { throw new Error('push refused'); }, err: (m) => said.push(m) }), null);
  assert.deepEqual(said, ['records whose condition is met were not ended: push refused']);
  for (const a of ['merge', 'hold', 'layer open', 'layer land', 'layer merge', 'job start', 'lane end']) assert.ok(ENDS_AFTER.has(a), a);
});

// ===== file: job-sync.test.mjs (later part) =====

test('#7: a generated build that fails part way still puts back the committed paths it rewrote', () => {
  const { root, exec } = generated();
  write(root, { 'build.mjs': "import { writeFileSync } from 'node:fs'; writeFileSync('member/dist/m.bundled.mjs', 'half\\n'); process.exit(3);\n" });
  git(['commit', '-q', '-am', 'a build that fails'], { cwd: root });
  assert.equal(jobTest(root, 'alpha', { exec, log: quiet }).ok, false);
  assert.equal(clean(root), '');
});

test('#5: block after BOB\'s push names job sync, not "run block again" forever', () => {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'req/alpha.md': '# alpha\n', 'test/alpha/a.test.mjs': passing });
  git(['branch', 'tranche'], { cwd: root });
  const bare = bareOrigin(root, 'main', 'tranche');
  const f = fakeGitHub();
  jobStart(root, 'alpha', { coordinator: 's', setup: ready, open: f.open, find: f.find, log: quiet });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const other = join(mkdtempSync(join(tmpdir(), 'p3-bob-')), 'b');
  git(['clone', '-q', '--branch', 'job/alpha', `file://${bare}`, other], { cwd: root });
  git(['config', 'user.email', 'bob@example.com'], { cwd: other });
  git(['config', 'user.name', 'BOB'], { cwd: other });
  commit(other, { 'src/other/o.mjs': '1\n' }, 'pushed from elsewhere');
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: other });
  assert.throws(() => jobBlock(root, 'alpha', { reason: 'waiting', log: quiet }), /origin's job\/alpha has commits this checkout lacks: run `node \.process\/tool\/p3\.mjs job sync alpha`, then block again/);
});

// Recovery after a governor refusal (R17c, item F): job complete refused at each GitHub step in turn
// (its push through the governed git, and each gh call), then rerun: the head pushed, the pull
