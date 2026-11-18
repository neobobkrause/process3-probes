// ===== file: gateclass.mjs (continued) =====

  // Nothing the suite or a build reads names the pin: the merged tree and the head, ledger
  // suites and checks, generated rows, lock files and lanes.
  for (const rev of ['HEAD', head]) {
    const hits = namingPin(root, cfg, rev);
    if (hits === null) return full(`the search for what names ${PIN} failed at ${rev === 'HEAD' ? 'the merged tree' : rev.slice(0, 10)}`);
    for (const f of hits) {
      if (!f.endsWith('.md')) return full(`${f} names ${PIN} (${rev === 'HEAD' ? 'the merged tree' : 'the head'})`);
      const by = readMd(root, cfg, rev, f);
      if (by) return full(`${f} names ${PIN}, and ${by} names ${f}`);
    }
    // The other files the change touches (the approvals file, the shims) are read by nothing that
    // runs: no file names them or their folder, and no module holds them (cold review A2).
    for (const f of changed.filter((x) => x !== PIN && !isRecordPath(cfg, x))) {
      const holder = entries.find((e) => inModule(e, f));
      if (holder) return full(`${f} is inside ${holder.id}'s paths or tests`);
      const tokens = [basename(f), ...(f.startsWith(WORKFLOWS) ? ['.github/workflows', '.github'] : [])];
      const named = namingPin(root, cfg, rev, ['-F', ...tokens.flatMap((t) => ['-e', t])]);
      if (named === null) return full(`the search for what reads ${f} failed`);
      for (const g of named) {
        if (!g.endsWith('.md')) return full(`${g} names ${f} or its folder`);
        const by = readMd(root, cfg, rev, g);
        if (by) return full(`${g} names ${f} or its folder, and ${by} names ${g}`);
      }
    }
  }
  for (const e of [...entries, ...merged]) {
    if (NAMES_PIN.test(JSON.stringify([e?.suite ?? null, e?.checks ?? null]))) return full(`${e?.id}'s ledger suite or checks name ${PIN}`);
  }
  if (NAMES_PIN.test(JSON.stringify([rows, cfg.lockfiles ?? null, cfg.lanes ?? null]))) return full(`a generated row, lock file or lane in ${CONFIG_FILE} names ${PIN}`);
  const approvals = normPath(cfg.approvals?.file || 'CLAUDE.md');
  const product = changed.filter((f) => !isRecordPath(cfg, f));
  // The pin itself first: an unreleased or backward pin is red here whatever else the change holds
  // (cold review B4), and nothing is read at it.
  const pinWhy = now !== was ? `the pin ${was ? was.slice(0, 10) : 'none'} to ${now.slice(0, 10)}${product.length > 1 ? `, with ${product.filter((f) => f !== PIN).join(', ')}` : ''}` : null;
  if (now !== was) {
    if (!repo.released(now)) F(PIN, `the process pin ${now.slice(0, 10)} is not a commit on process3's tranche or main`);
    else if (was && !repo.descends(was, now)) F(PIN, `the process pin ${now.slice(0, 10)} does not descend from the base's pin ${was.slice(0, 10)}: no downgrade`);
    if (findings.length) return { class: 'pin-only', why: pinWhy, findings };
  }
  // A shim-named workflow deleted is no pin move's: full (cold review B5).
  const gone = product.find((f) => f.startsWith(WORKFLOWS) && !blobAt(root, head, f));
  if (gone) return full(`it deletes ${gone}`);
  // The approvals file: the base's text with the old pin's process lines replaced by the new pin's, exactly.
  if (product.includes(approvals)) {
    if (modeAt(root, head, approvals) !== '100644') return full(`${approvals} is not a regular file at the head`);
    const lines = (pin) => { const t = pin ? repo.text(pin, PROCESS_LINES) : null; return t === null || t === undefined ? null : t.replaceAll('{tranche}', cfg.tranche).replace(/\n+$/, ''); };
    const before = textAt(root, mb, approvals);
    const after = textAt(root, head, approvals);
    const oldL = lines(was);
    const newL = lines(now);
    if (before === null || after === null || !oldL || !newL || oldL === newL) return full(`${approvals} changes, and not only by the pin's process lines`);
    const at = before.indexOf(oldL);
    if (at < 0 || before.slice(0, at) + newL + before.slice(at + oldL.length) !== after) return full(`${approvals} changes more than the pin's process lines`);
  }
  // Workflows: each named like a shim the head's pin ships, its bytes the pin's.
  for (const f of product.filter((x) => x.startsWith(WORKFLOWS))) {
    const name = basename(f);
    const shim = repo.shim(now, name);
    if (!shim && name !== 'process-gate.yml') return full(`${f} is not named like a shim of the pin ${now.slice(0, 10)}`);
    const blob = blobAt(root, head, f);
    if (!shim || !blob || blob !== shim || modeAt(root, head, f) !== '100644') F(f, `${f} is not the pin ${now.slice(0, 10)}'s own shim, byte for byte (copy .process/shims/${name})`);
  }
  return { class: 'pin-only', why: pinWhy || `only ${product.join(', ')}, as the pin ${now.slice(0, 10)} has them`, findings };
}

// Whether the run needs the product's browser: not for a pin-only run, nor a record-only one
// whose requirements no test reads and that builds nothing (a generator may drive the browser:
// cold review A4), unless it touches a lane's folder (its checks may use it).
export const browserNeeded = (c) => !!c.lanes || !(c.class === 'pin-only' || (c.class === 'record-only' && !c.builds && (c.reqs || []).every((r) => !r.readers.length)));

// The process clone as the gate reads it (merge.mjs processRepo), with a file's text at a pin.
export function gateRepo(processRepo, dir) {
  const r = processRepo(dir);
  return { ...r, text: (pin, path) => textAt(dir, pin, path) };
}

// ===== file: report-right.test.mjs (later part) =====

test('5: job merges count distinct pull requests since the opening; gate runs per merged job with them', () => {
  const rows = [start('old', -300), merge('old', -200, 3), start('a', 5), merge('a', 40, 60), merge('a', 47, 60), start('b', 6), merge('b', 50, 61)];
  const { root } = repo(rows);
  const md = tranche(root);
  assert.match(md, /job merges recorded: 2 distinct pull requests since the opening \(3 merge rows\); older than this tranche, left out: #3/);
  assert.match(md, /\| a \| [^|]+ \| #60 \|/);
});

test('5: gate runs per merged job: one per distinct pull request, not per merge row', async () => {
  const { BOT, GATE, block } = await import('../lib/github.mjs');
  const gate = (n) => [{ user: { login: BOT }, created_at: 'x', updated_at: 'x', body: block(GATE, { runs: Array.from({ length: n }, () => ({ suite: 'pass' })) }) }];
  const rows = [start('a', 5), merge('a', 40, 60), merge('a', 47, 60), start('b', 6), merge('b', 50, 61), merge('old', -200, 3)];
  const { root } = repo(rows);
  const md = tranche(root, { io: { state: (p) => STATE[p] ?? null, merged: () => null, comments: (pr) => gate(pr === 60 ? 3 : 1) } });
  assert.match(md, /- gate runs per merged job: 2 \(4 runs over 2 distinct pull requests merged since the opening\)/);
});

test('6: the opening has one source: elapsed time reads the grant row lead times reads', () => {
  const { root } = repo([start('a', 5)]);
  const md = tranche(root);
  assert.match(md, new RegExp(`- opened: ${t(0).replace(/\./g, '\\.')} \\(the first ok grant row`));
  assert.match(md, new RegExp(`- tranche opened: ${t(0).replace(/\./g, '\\.')}`));
  assert.match(md, /- elapsed: 5 h/);
});

test('7: attempts started: one definition, the tip\'s start rows and the job branch\'s, each once', () => {
  const tip = [start('bundler', 5, 1), start('bundler', 60, 2)];
  // The same start row on the job branch with another field: still one attempt.
  const { root, jobRefs, jobRows } = repo(tip, { bundler: [{ ...start('bundler', 60, 2), reopen: 'x' }, start('bundler', 120, 3), start('bundler', 200, 4)] });
  const md = tranche(root, { jobRefs, jobRows });
  assert.match(md, /\| bundler \| 4 \| unmeasured \|/);
  const lt = leadTimes(root, loadConfig(root), { ref: 'origin/tranche', rows: tip, jobRows, grants: grants(0), now: t(300) });
  assert.equal(lt.jobs[0].attempts.length, 4, 'lead times count the same attempts');
  assert.match(md, /Attempts: an attempt is a start row dated at or after the tranche's opening/);
});

test('8: replace names its stop\'s source, and restarts logged within a minute read as one batch, each figure still its own', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const cfg = loadConfig(root);
  const r = (m, min, stoppedMin, more = {}) => ({ row: 'restart', tranche: 'tranche', module: m, at: t(min), stopped: t(stoppedMin), stopped_by: 'BLOCKED', state: 'BLOCKED', ...more });
  // Five restarts in 28 s, as at 04:06 on 4 Nov, and one alone.
  const restarts = [r('a', 100, 71), r('b', 100.1, 70.5), r('c', 100.25, 70.9), r('d', 100.4, 71.8), r('e', 100.45, 72), r('f', 200, 190, { state: 'WORKING', stopped_by: 'last push', stop: 'idle' })];
  assert.equal(restartBatches(restarts).size, 5);
  const rows = ['a', 'b', 'c', 'd', 'e', 'f'].map((m) => start(m, 1));
  const lt2 = leadTimes(root, cfg, { ref: 'HEAD', rows, grants: grants(0), restarts, jobRefs: new Map(rows.map((x) => [x.module, 'HEAD'])), now: t(300) });
  const by = Object.fromEntries(lt2.jobs.map((j) => [j.module, j.replace]));
  assert.equal(by.a[0].minutes, 29);
  assert.equal(by.a[0].source, 'blocked');
  assert.deepEqual(by.a[0].batch, { restarts: 5, from: t(100), to: t(100.45) });
  assert.match(leadCell(by.a), /\(stop: blocked\) \(batch of 5 restarts /);
  assert.equal(by.f[0].source, 'idle');
  assert.equal(by.f[0].batch, undefined);
  assert.equal(by.f[0].minutes, 10);
  assert.equal(lt2.jobs.length, 6);
});

test('ready to start: a module whose ledger entry was made after its provider merged is ready when its entry was made (coordinator, 4 Nov: member-roster, money)', () => {
  const root = makeRepo({ 'README.md': 'x' });
  // The entry for u3 lands at minute 40, after q2's merge at 30; its job starts at 45.
  const env = { GIT_COMMITTER_DATE: t(40), GIT_AUTHOR_DATE: t(40) };
  const prev = { ...process.env };
  Object.assign(process.env, env);
  try { commit(root, { 'process/ledger/u3.json': '{}' }, 'entry u3'); } finally { for (const k of Object.keys(env)) { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k]; } }
  const cfg = loadConfig(root);
  const rows = [start('p2', 1), merge('p2', 20, 1), start('q2', 2), merge('q2', 30, 2), start('u3', 45)];
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows, layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) });
  const u3 = lt.jobs.find((j) => j.module === 'u3').ready_to_start;
  assert.equal(u3.minutes, 5, 'ready at its entry (40), not at q2\'s merge (30)');
  assert.equal(u3.ready_by, 'entry');
  assert.equal(u3.ready, t(40));
});

test('ready to start by entry: an add after the first start is never the ready time, and a re-added entry counts from its latest add before the start', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const at = (min, files, msg) => {
    const prev = { ...process.env };
    Object.assign(process.env, { GIT_COMMITTER_DATE: t(min), GIT_AUTHOR_DATE: t(min) });
    try { commit(root, files, msg); } finally { for (const k of ['GIT_COMMITTER_DATE', 'GIT_AUTHOR_DATE']) { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k]; } }
  };
  at(35, { 'process/ledger/u3.json': '{}' }, 'entry');
  git(['rm', '-q', 'process/ledger/u3.json'], { cwd: root });
  at(36, {}, 'drop');
  git(['commit', '-q', '--allow-empty', '-m', 'noop'], { cwd: root });
  at(40, { 'process/ledger/u3.json': '{"a":1}' }, 're-add');
  at(60, { 'other.txt': 'y' }, 'later');
  const cfg = loadConfig(root);
  const rows = [start('p2', 1), merge('p2', 20, 1), start('q2', 2), merge('q2', 30, 2), start('u3', 45)];
  const u3 = leadTimes(root, cfg, { ref: 'HEAD', rows, layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) }).jobs.find((j) => j.module === 'u3').ready_to_start;
  assert.equal(u3.ready, t(40), 'the latest add before the start');
  assert.equal(u3.minutes, 5);
});

test('ready to start by entry: in a shallow clone an add at the cut is not the entry\'s creation', () => {
