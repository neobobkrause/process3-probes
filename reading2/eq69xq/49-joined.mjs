// ===== file: census.mjs (continued) =====

  const out = [];
  const dir = String(cfg.requirements_dir || DEFAULTS.requirements_dir).replace(/\/$/, '');
  const rowsAt = (ref) => new Set((readModules(root, cfg, ref) || []).filter((m) => m?.id).map((m) => m.id));
  const before = cfg.modules_file && changed.includes(cfg.modules_file) ? rowsAt(base) : null;
  const after = rowsAt(head);
  const has = (ref, p) => show(root, ref, p) !== null;
  const added = (p) => changed.includes(p) && !has(base, p) && has(head, p);
  const newRows = before ? [...after].filter((id) => !before.has(id)) : [];
  const newReqs = changed.filter((f) => f.startsWith(`${dir}/`) && f.endsWith('.md') && f.slice(dir.length + 1).indexOf('/') < 0 && !/README\.md$/i.test(f) && added(f)).map((f) => f.slice(dir.length + 1, -3));
  const newEntries = changed.filter((f) => /^process\/ledger\/[^/]+\.json$/.test(f) && added(f)).map((f) => f.replace(/^.*\//, '').replace(/\.json$/, ''));
  for (const id of [...new Set([...newRows, ...newReqs])]) {
    if (!has(head, entryFile(id))) out.push({ file: newReqs.includes(id) ? `${dir}/${id}.md` : cfg.modules_file, message: `${id} gains a ${newReqs.includes(id) ? 'requirements file' : 'modules row'} with no ledger entry ${entryFile(id)}: add the entry in this pull request (census, R15)` });
  }
  for (const id of newEntries) {
    if (!after.has(id)) out.push({ file: entryFile(id), message: `${id}'s new ledger entry has no row in ${cfg.modules_file}: add it in this pull request (census, R15)` });
    let named = null;
    try { named = JSON.parse(show(root, head, entryFile(id)) || '{}').requirements || null; } catch { named = null; }
    if (!has(head, named ? String(named).replace(/^\.\//, '') : `${dir}/${id}.md`)) out.push({ file: entryFile(id), message: `${id}'s new ledger entry has no requirements file ${named || `${dir}/${id}.md`}: add it in this pull request (census, R15)` });
  }
  return out;
}

// ===== file: light-triage.test.mjs (later part) =====

test('rule 2: an export only added clears every user at the merge', () => {
  const root = product();
  const { r, out } = mergeJob(root, 10, { 'src/p/index.mjs': P_SRC + 'export function rotate() { return 1; }\n' });
  assert.deepEqual(r.notices.rows[0].exports, { removed: [], added: ['rotate'], changed: [] });
  assert.deepEqual(r.triage.owed, []);
  assert.match(out, /notice triage p:10 at the merge: 7 of 7 not affected \(7 by no interface change\)/);
  assert.match(triaged(root, 'p:10').get('u1').evidence, /^PR 10: no requirement id changed; exports read at [0-9a-f]{10}\.\.[0-9a-f]{10} only added \(rotate\), none removed or changed$/);
});

test('rule 3: with a name changed, only importers of it, or of what cannot be read as names, stay owed; the brief says why each was left (PD-17 rehearsal)', () => {
  const root = product();
  openPassed(root);
  const { r, out } = mergeJob(root, 11, { 'src/p/index.mjs': P_SRC.replace('sign(x)', 'sign(x, key)') });
  assert.deepEqual(r.notices.rows[0].exports, { removed: [], added: [], changed: [{ name: 'sign', before: 'function(x)', after: 'function(x, key)' }] });
  assert.deepEqual(r.triage.owed, ['u1', 'u3', 'u5', 'u6', 'u7']);
  assert.match(out, /notice triage p:11 at the merge: 2 of 7 not affected \(1 by imports check, 1 by imported names unchanged\), answered: u2, u4; 5 owe a worker's judgment/);
  assert.match(out, /- u1: not cleared: src\/u1\/a\.mjs:1 imports sign, removed or changed/);
  assert.match(out, /- u3: not cleared: src\/u3\/a\.mjs:1 is a namespace import of p/);
  assert.match(out, /- u5: not cleared: src\/u5\/a\.mjs:1 is a default import of p/);
  assert.match(out, /- u6: not cleared: test\/u6\/a\.test\.mjs:1 imports test\/p\/fixture\.mjs, a file of p its export read did not cover/);
  assert.match(out, /- u7: not cleared: src\/u7\/a\.mjs:1 is a require\(\) of p/);
  const t = triaged(root, 'p:11');
  assert.equal(t.get('u2').worker, 'merge: imported names unchanged');
  assert.match(t.get('u2').evidence, /^PR 11: no requirement id changed; its imports of p at [0-9a-f]{10} name none of the export\(s\) removed or changed at [0-9a-f]{10}\.\.[0-9a-f]{10} \(sign\): src\/u2\/a\.mjs:2 import \{$/);
  assert.equal(t.get('u4').worker, 'merge: imports check');
  assert.deepEqual(owedTriage(root, 'p:11'), ['u1', 'u3', 'u5', 'u6', 'u7']);
  const lines = [];
  status(root, { role: 'bob', offline: true, log: (m) => lines.push(m) });
  assert.match(lines.join('\n'), /- triage owed: p:11 \(5 modules\)/);
  // BOB's brief holds only the five, each with why the rule left it.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const tr = noticeTriage(root, 'p:11', { log: quiet, io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: tip }) } });
  assert.deepEqual(tr.owed, ['u1', 'u3', 'u5', 'u6', 'u7']);
  assert.doesNotMatch(tr.brief, /- u2:|- u4:/);
  assert.match(tr.brief, /- u1: src\/u1\/; src\/u1\/a\.mjs:1; not cleared by rule: src\/u1\/a\.mjs:1 imports sign, removed or changed/);
});

test('fail closed at the merge: a requirement id changed, exports unread, or no export read recorded leaves every importer owed; the imports check still clears non-importers', () => {
  const root = product();
  const cfg = loadConfig(root);
  const ref = 'refs/remotes/origin/tranche';
  const read = { base: git(['rev-parse', ref], { cwd: root }), head: git(['rev-parse', ref], { cwd: root }), files: ['src/p/index.mjs'] };
  const base = { provider: 'p', users: USERS, source: 1 };
  const cases = [
    [{ ...base, key: 'p:21', pr: 21, ids: ['R1'], exports_read: read }, /requirement id\(s\) changed \(R1\)/],
    [{ ...base, key: 'p:22', pr: 22, ids: [], exports_unread: 'surface: parse failed' }, /its exports could not be read/],
    [{ ...base, key: 'p:23', pr: 23, ids: [] }, /no read of its exports is recorded/],
  ];
  for (const [notice, why] of cases) {
    const out = [];
    const r = triageAtMerge(root, cfg, notice, { ref, log: (m) => out.push(m) });
    assert.deepEqual(r.owed, ['u1', 'u2', 'u3', 'u5', 'u6', 'u7'], notice.key);
    assert.deepEqual(r.rows.filter((x) => x.row === 'triage').map((x) => [x.user, x.worker]), [['u4', 'merge: imports check']]);
    assert.match(out.join('\n'), new RegExp(`notice triage ${notice.key} at the merge: 1 of 7 not affected \\(1 by imports check\\)`));
    assert.match(out.join('\n'), new RegExp(`- the interface rule \\(PD-20\\) does not apply: ${why.source}`));
  }
  // A class member moved: no importer is cleared by names (any instance reaches it).
  const out = [];
  const r = triageAtMerge(root, cfg, { ...base, key: 'p:24', pr: 24, ids: [], exports_read: read, exports: { removed: ['Signer.rotate'], added: [], changed: [] } }, { ref, log: (m) => out.push(m) });
  assert.deepEqual(r.owed, ['u1', 'u2', 'u3', 'u5', 'u6', 'u7']);
  assert.match(out.join('\n'), /- u2: not cleared: src\/u2\/a\.mjs imports p, and class member\(s\) moved \(Signer\.rotate\)/);
});

test('notice triage applies the rule to a notice recorded before it, reading the exports over its merged range; only the rest is briefed', () => {
  const root = product();
  // p's merged PR 30: an internal change, merged into the tranche.
  git(['checkout', '-q', '-b', 'job/p', 'tranche'], { cwd: root });
  commit(root, { 'src/p/index.mjs': P_SRC.replace('return !!x;', 'return Boolean(x);') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '--no-edit', 'job/p'], { cwd: root });
  const m = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  // Recorded as notices were before PD-20: no export read on it, every user owed.
  onState(root, { [noticeFile('p:30')]: JSON.stringify({ row: 'notice', key: 'p:30', provider: 'p', ids: [], pr: 30, users: USERS, source: 1 }) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  assert.deepEqual(owedTriage(root, 'p:30'), USERS);
  const out = [];
  const r = noticeTriage(root, 'p:30', { log: (x) => out.push(x), io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
  assert.deepEqual(r.owed, []);
  assert.match(out.join('\n'), /^notice triage p:30 by rule \(PD-20\): 7 of 7 not affected \(7 by no interface change\), 7 recorded/m);
  assert.equal(triaged(root, 'p:30').get('u5').worker, 'notice triage: no interface change');
  assert.deepEqual(owedTriage(root, 'p:30'), []);
  // A notice whose requirement ids changed is left to the workers: nothing written, all briefed.
  onState(root, { [noticeFile('p:31')]: JSON.stringify({ row: 'notice', key: 'p:31', provider: 'p', ids: ['R1'], pr: 31, users: USERS, source: 1 }) + '\n' });
  git(['push', '-q', 'origin', '+refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const r2 = noticeTriage(root, 'p:31', { log: quiet, io: { slug: 'o/r', getPR: () => ({ merged: true, merge_commit_sha: m }) } });
  assert.deepEqual(r2.owed, USERS);
  assert.ok(r2.brief);
});

test('TypeScript export forms the surface does not read leave the notice\'s exports unread, so no interface rule clears its importers', () => {
  const root = product(['u1'], { 'src/p/index.mjs': P_SRC + 'export interface Account { id: string }\n' });
  const { r, out } = mergeJob(root, 40, { 'src/p/index.mjs': P_SRC });
  const [n] = r.notices.rows;
  assert.match(n.exports_unread, /TypeScript export forms the surface does not read in src\/p\/index\.mjs/);
  assert.equal(n.exports_read, undefined);
  assert.deepEqual(r.triage.owed, ['u1']);
  assert.match(out, /- the interface rule \(PD-20\) does not apply: its exports could not be read \(TypeScript export forms/);
});

// ===== file: metrics.mjs (later part) =====

// still marks its session's cost so far). Without an opening, every row counts.
export function overhead(rows, layers = new Map(), { opened = null, jobRows = [] } = {}) {
  rows = distinctRows([...rows, ...jobRows]).filter((r) => typeof r.at === 'string');
  const inT = (r) => !opened || Date.parse(r.at) >= Date.parse(opened);
  const measured = rows.filter((r) => r.row === 'attempt' && r.event === 'measured');
  const role = (r) => r.role || 'job';
  // Each cost row is its module's: a job's own cost is its job rows', whatever BOB rows name it.
  const activity = rows.filter((r) => r.row === 'attempt' && r.module && inT(r) && !(r.event === 'measured' && role(r) !== 'job'));
  const started = new Set(activity.filter((r) => r.event === 'start').map((r) => r.module));
  const mods = [...new Set(activity.map((r) => r.module))].filter((m) => !opened || started.has(m)).sort();
  // A job active in a window no row of that role closes (after its last row, or ended by a row
  // with no cost) has that part unmeasured.
  const parts = new Map(mods.map((m) => [m, { bob: 0, root: 0, gap: new Set() }]));
  let unattributed = 0;
  for (const who of PROCESS) {
    const mine = measured.filter((r) => role(r) === who).sort((a, b) => a.at.localeCompare(b.at));
    let prevAt = opened || '';
    const lastCost = new Map();
    const skipped = new Set();
    const since = (from, to) => [...new Set(activity.filter((a) => a.at > from && (to === null || a.at <= to) && parts.has(a.module)).map((a) => a.module))];
    for (const r of mine) {
      const c = Number(r.cost_usd);
      // Before the opening: the session's cost so far, not split.
      if (!inT(r)) {
        if (r.session && Number.isFinite(c)) { lastCost.set(r.session, c); skipped.delete(r.session); } else if (r.session) skipped.add(r.session);
        continue;
      }
      const open = since(prevAt, r.at);
