// ===== file: branches.mjs (continued) =====

      const dates = git(['log', '--format=%ct %at', `${remote(tranche)}..${remote(b.name)}`], { cwd: root }).split(/\s+/).filter(Boolean).map(Number);
      if (Math.max(0, ...dates) * 1000 >= cutoff) { kept.recent.push(b.name); continue; }
      candidates.push({ name: b.name, sha: b.sha, why: 'train-head-closed' });
      continue;
    }
    kept.ahead.push(b.name);
  }

  const counts = Object.fromEntries(Object.entries(kept).map(([k, v]) => [k, v.length]));
  const label = dryRun ? 'would delete' : 'deleting';
  log(`branches prune${dryRun ? ' (dry run)' : ''}: ${branches.length} branches on origin; ${candidates.length} to delete (${candidates.filter((c) => c.why === 'in-tranche').length} in ${tranche}, ${candidates.filter((c) => c.why === 'train-head-closed').length} closed train heads); kept ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  for (const c of candidates) log(`  ${label} ${c.name} at ${c.sha.slice(0, 10)} (${c.why})`);
  if (dryRun) return { ok: true, approved, dryRun, deleted: [], failed: [], kept: counts, candidates };

  // The deletes, each leased to the tip judged above, in batches; a server error retries the batch.
  // The open pull requests are read again before each batch: one opened since the judgement (its

// 18 mangoes were logged at the Pell gate.

  // head or base a candidate) keeps that branch; an unreadable read deletes no more.
  for (let i = 0; i < candidates.length; i += DELETE_BATCH) {
    const open = io.openPulls(slug);
    if (!open) { log('the open pull requests could not be read again; no further branch is deleted'); break; }
    const nowOpen = new Set(open.flatMap((p) => [p.head?.ref, p.base?.ref]).filter(Boolean));
    const batch = candidates.slice(i, i + DELETE_BATCH).filter((c) => !nowOpen.has(c.name));
    if (!batch.length) continue;
    const args = [...batch.map((c) => `--force-with-lease=refs/heads/${c.name}:${c.sha}`), 'origin', ...batch.map((c) => `:refs/heads/${c.name}`)];
    for (let t = 1; t <= PUSH_TRIES; t++) {
      const r = push(root, args);
      if (r.code === 0 || !isServerError(`${r.stderr}\n${r.stdout}`)) break;
      if (t < PUSH_TRIES) log(`the delete push hit a server error; trying again (${t + 1} of ${PUSH_TRIES})`);
    }
  }

  // What origin holds now: a candidate still there was not deleted (moved, protected or failed).
  let left = null;
  for (let t = 1; t <= PUSH_TRIES && left === null; t++) {
    const r = git(['ls-remote', '--heads', 'origin'], { cwd: root, allowFail: true });
    if (r.code === 0) left = new Set(r.stdout.split('\n').filter(Boolean).map((l) => l.split('\t')[1]?.slice('refs/heads/'.length)));
  }
  if (left === null) fail('could not read origin\'s branches back after the deletes; the run\'s row is not written');
  const deleted = candidates.filter((c) => !left.has(c.name));
  const failed = candidates.filter((c) => left.has(c.name)).map((c) => c.name);
  for (const n of failed) log(`  not deleted: ${n} (moved since it was judged, protected, or the push failed)`);
  log(`branches prune: ${deleted.length} deleted, ${failed.length} not deleted`);

  const row = {
    at: now(), row: 'prune', ...(run ? { run: String(run) } : {}), default_branch: def, on, at_sha: baseSha, tranche, tranche_sha: trancheSha,
    branches: branches.length, kept: counts, deleted: deleted.map(({ name, sha, why }) => ({ name, sha, why })), failed,
  };
  writeState(root, cfg.state_branch, `branches prune: ${deleted.length} deleted`, (wt) => {
    const p = join(wt, PRUNE_FILE);
    mkdirSync(dirname(p), { recursive: true });
    appendFileSync(p, JSON.stringify(row) + '\n');
  });
  log(`row written to ${cfg.state_branch}:${PRUNE_FILE}`);
  // A branch moved since it was judged is kept, rightly; only a run that deleted none of its
  // candidates is red (a token without contents: write, or a ruleset that refuses every delete).
  return { ok: !failed.length || deleted.length > 0, approved, dryRun, deleted, failed, kept: counts, candidates };
}

// ===== file: census.test.mjs (later part) =====

test('census: an open layer\'s branch lacking an entry the tranche holds is named', () => {
  const root = product();
  git(['push', '-q', 'origin', 'tranche:refs/heads/layer/2'], { cwd: root });
  commit(root, { 'process/ledger/c3.json': ent('c3', 3), 'process/ledger/b2.json': ent('b2', 2, { title: 'b2, again' }) });
  git(['checkout', '-q', '-b', 'side', 'origin/tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  // layer/2 cut before a2's entry: rebuild it without a2's.
  git(['checkout', '-q', '-b', 'l2', 'origin/layer/2'], { cwd: root });
  git(['rm', '-q', 'process/ledger/a2.json'], { cwd: root });
  git(['commit', '-q', '-m', 'cut early'], { cwd: root });
  git(['push', '-q', 'origin', 'l2:refs/heads/layer/2', '--force'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const c = census(root, loadConfig(root), { ref: 'origin/tranche', open: [2] });
  assert.deepEqual(c.gaps.filter((g) => g.kind === 'not-on-layer').map((g) => g.id), ['a2']);
  assert.match(c.gaps.find((g) => g.kind === 'not-on-layer').fix, /layer\/2 lacks process\/ledger\/a2\.json.*job start a2 carries it/);
});

test('open layers: an open row with no merged row', () => {
  const root = product();
  const state = { 'layerflow/1/open.json': '{}', 'layerflow/1/merged.json': '{}', 'layerflow/2/open.json': '{}' };
  assert.deepEqual(openLayers(root, loadConfig(root), (p) => state[p] ?? null), [2]);
});

test('preflight: what job start would refuse for the next layer, each with its fix', () => {
  const root = product();
  const cfg = loadConfig(root);
  commit(root, { 'process/ledger/c3.json': ent('c3', 3, { status: { state: 'WORKING' } }), 'process/ledger/d3.json': { id: 'd3' }, 'process/ledger/e4.json': ent('e4', 4, { status: { state: 'COMPLETE' }, requirements: 'build/requirements/owed1.md' }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const c = census(root, cfg, { ref: 'origin/tranche', open: [2] });
  const holds = [{ id: 'hold-9', live: true, kind: 'module', value: 'c3', scope: 'module:c3', when: [{ layer_closed: 2 }] }];
  const heldBy = (hs, id) => hs.find((h) => h.value === id) || null;
  const seat = (id) => (id === 'c3' ? { lane: { name: 'ux' }, why: 'job c3 is lane ux\'s module, and its session is live' } : null);
  const xs = preflight(root, cfg, 3, { ref: 'origin/tranche', census: c, holds, heldBy, seat });
  assert.deepEqual(xs.map((x) => `${x.id}: ${x.why.split(':')[0]}`), ['c3: its entry is WORKING on origin/tranche', 'c3: held by hold-9 (module', "c3: job c3 is lane ux's module, and its session is live", 'd3: its entry is invalid']);
  assert.match(xs[1].fix, /the hold ends by its own condition \(layer_closed:2\)/);
  assert.match(preflightLines(3, xs)[0], /^preflight, layer 3: 4 start\(s\) would be refused$/);
  assert.deepEqual(preflightLines(5, []), ['preflight, layer 5: no start would be refused']);
  // A paused plan refuses every start.
  assert.equal(preflight(root, { ...cfg, plan: 'pause' }, 2, { ref: 'origin/tranche', census: c })[0].id, '*');
  // A module of the layer with no entry is named with the census's fix.
  const gone = preflight(root, cfg, 4, { ref: 'origin/tranche', census: c });
  // A COMPLETE module with an unmet mark: a plain start refuses it; the fix is --reopen.
  assert.ok(gone.some((x) => x.id === 'e4' && /COMPLETE with 1 unmet mark\(s\): a plain job start refuses it/.test(x.why) && /--reopen/.test(x.fix)), JSON.stringify(gone));
  assert.ok(gone.some((x) => x.id === 'ux-design' && /no-entry/.test(x.why) && /write process\/ledger\/ux-design\.json/.test(x.fix)));
});

test('the gate: a requirements file or modules row added with no entry, or an entry with no row or requirements, is a finding', () => {
  const root = product();
  const cfg = loadConfig(root);
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const rows = (extra) => ({ modules: [...JSON.parse(git(['show', `${base}:build/modules.json`], { cwd: root })).modules, ...extra] });
  const head = commit(root, { 'build/requirements/new1.md': req('new1'), 'build/modules.json': rows([row('new2', 4)]), 'process/ledger/new3.json': ent('new3', 4) });
  const changed = git(['diff', '--name-only', base, head], { cwd: root }).split('\n').filter(Boolean);
  const got = changeGaps(root, cfg, { base, head, changed });
  assert.deepEqual(got.map((x) => x.file).sort(), ['build/modules.json', 'build/requirements/new1.md', 'process/ledger/new3.json', 'process/ledger/new3.json'].sort());
  assert.ok(got.some((x) => /new1 gains a requirements file with no ledger entry process\/ledger\/new1\.json/.test(x.message)));
  assert.ok(got.some((x) => /new2 gains a modules row with no ledger entry/.test(x.message)));
  assert.ok(got.some((x) => /new3's new ledger entry has no row in build\/modules\.json/.test(x.message)));
  assert.ok(got.some((x) => /new3's new ledger entry has no requirements file build\/requirements\/new3\.md/.test(x.message)));
  // An entry whose requirements live where its requirements field says: no finding for them.
  const elsewhere = commit(root, { 'build/modules.json': rows([row('new2', 4), row('new5', 4)]), 'process/ledger/new5.json': ent('new5', 4, { requirements: 'docs/req/new5.md' }), 'docs/req/new5.md': req('new5') });
  assert.deepEqual(changeGaps(root, cfg, { base: head, head: elsewhere, changed: git(['diff', '--name-only', head, elsewhere], { cwd: root }).split('\n').filter(Boolean) }).filter((x) => /new5/.test(x.message)), []);
  // All three pieces together: nothing.
  const whole = commit(root, { 'build/requirements/new4.md': req('new4'), 'build/modules.json': rows([row('new2', 4), row('new5', 4), row('new4', 4)]), 'process/ledger/new4.json': ent('new4', 4) });
  const ch2 = git(['diff', '--name-only', elsewhere, whole], { cwd: root }).split('\n').filter(Boolean);
  assert.deepEqual(changeGaps(root, cfg, { base: elsewhere, head: whole, changed: ch2 }).filter((x) => /new4/.test(x.message)), []);
});

test('status --role bob: the gaps block for the open layer and its lookahead, then the next layer\'s preflight', () => {
  const root = product();
  const cfg = loadConfig(root);
  writeState(root, cfg.state_branch, 'seed', (dir) => { for (const p of ['layerflow/1/open.json', 'layerflow/1/merged.json', 'layerflow/2/open.json']) { mkdirSync(dirname(join(dir, p)), { recursive: true }); writeFileSync(join(dir, p), '{}\n'); } return {}; });
  const ls = gapLines(root, cfg, { tranche: 'origin/tranche' });
  assert.equal(ls[0], 'gaps (layer 2 open; lookahead 3 and 4): 7 in layers 2, 3, 4 (3 elsewhere)');
  assert.ok(ls.some((l) => /^preflight, layer 3: 2 start\(s\) would be refused$/.test(l)), ls.join('\n'));
  assert.ok(ls.some((l) => /^- c3: no-entry: .*; fix: write process\/ledger\/c3\.json/.test(l)));
  // C16: the modules built before the ledger, outside the open layer and its lookahead, with their entries ready.
  const at = ls.findIndex((l) => l.startsWith('built before the ledger (no entry: modules that use one wait for it as a provider): 1'));
  assert.ok(at >= 0, ls.join('\n'));
  assert.ok(ls.slice(at).some((l) => /^- old1 \(layer 1\), no-entry: write process\/ledger\/old1\.json recording it COMPLETE/.test(l)), ls.join('\n'));
  // Its paths are not on the tranche here: listed, not ready (test 1 shows it ready once they are).
  assert.ok(ls.slice(at).some((l) => /^- old1 .*not ready: .*not on origin\/tranche/.test(l)), ls.join('\n'));
});

// ===== file: suite-budget.test.mjs =====

// status --role bob (build ci-budget, R2; Bob: "go R2"): a module whose gate suite took over 70%
// of suite_timeout_minutes, by the newest gate row on this tranche's pull requests, is one line
// among the acts, naming the module and the figure.
