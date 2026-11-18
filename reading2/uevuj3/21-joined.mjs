// ===== file: anchor.mjs (continued) =====

  for (const c of touched) if (keyAt(root, `${c}^1`, key) !== value) return c;
  return null;
}
export const processRepoSetAt = (root, rev) => keySetAt(root, rev, 'process_repo');

// The first anchored key whose value at sha is not its value at base (by base's last config,
// lastConfigAt, so a deleted config is still the one judged against) and did not take it at a
// commit ownerCommit(sha) -> { ok } calls the owner's website commit; null when every key holds.
// ownerCommit null: no change is accepted. tip: the base's tip; an owner's commit already in
// it was superseded there (its value is not the base's now), so it grants nothing: a session
// cannot restore a value the owner later replaced (review 1 of PR 97).
export function unanchored(root, base, sha, ownerCommit, tip = base) {
  const was = lastConfigAt(root, base) || base;
  for (const key of ANCHORED) {
    const value = keyAt(root, sha, key);
    if (value === keyAt(root, was, key)) continue;
    if (ownerCommit && typeof value === 'string' && value !== 'unreadable') {
      const c = keySetAt(root, sha, key);
      const inBase = c && git(['merge-base', '--is-ancestor', c, tip], { cwd: root, allowFail: true }).code === 0;
      if (c && !inBase && ownerCommit(c)?.ok === true) continue;
    }
    return key;
  }
  return null;
}

// The newest commit on rev's first-parent history that holds the config: rev itself, or, when a
// later commit deleted it, the last one that had it (a main that deleted its config is judged by
// its last one, never as a first close). First-parent only: in date order a session's side
// branch, dated ahead, would choose which config counts (confirming review of PR 97). null when
// no commit the clone holds ever had one.
export function lastConfigAt(root, rev) {
  if (blobAt(root, rev, CONFIG_FILE)) return rev;
  const touched = git(['log', '--first-parent', '--full-history', '--format=%H', rev, '--', CONFIG_FILE], { cwd: root, allowFail: true }).stdout?.split('\n').filter(Boolean) || [];
  return touched.find((c) => blobAt(root, c, CONFIG_FILE)) || null;
}

// The first close (bootstrap): a base that holds no pin and whose history never held the config.
export const isBootstrap = (root, baseRef) => !lastConfigAt(root, baseRef) && !pinAt(root, baseRef);

// The anchored keys as GitHub's merge would leave them: the base's tip merged with sha, as git
// merges it (merge-tree). Each pull request is judged head against merge base, but what lands is
// a line-by-line merge, and two changes judged alone can compose into a value neither holds, or
// undo the owner's later change on the base (second confirming review of PR 97). So each key in
// the merge must be the head's when the head changes it (judged by unanchored), else the base
// tip's. Returns why not, or null.
export function mergedUnanchored(root, tip, mb, sha) {
  const r = git(['merge-tree', '--write-tree', tip, sha], { cwd: root, allowFail: true });
  if (r.code !== 0) return `it does not merge cleanly with the base as it is`;
  const tree = r.stdout.split('\n')[0].trim();
  // The base's value is the base tip's own (a base that deleted its config blocks nothing that
  // leaves it deleted: third confirming review of PR 97).
  if (blobAt(root, tip, CONFIG_FILE) && !blobAt(root, tree, CONFIG_FILE)) return `merged with the base as it is, it would delete ${CONFIG_FILE}`;
  const from = lastConfigAt(root, mb) || mb;
  for (const key of ANCHORED) {
    const head = keyAt(root, sha, key);
    const want = head !== keyAt(root, from, key) ? head : keyAt(root, tip, key);
    if (keyAt(root, tree, key) !== want) return `merged with the base as it is, it would leave ${key} in ${CONFIG_FILE} at neither the base's value nor the head's judged one`;
  }
  return null;
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

// ===== file: pushcheck.mjs =====

// A job's push refuses, before anything is pushed, a commit that adds a file over max_file_bytes,
// or a generated path (config `generated`) or a path under any dist/ directory that the tranche
// does not already track. A pushed commit cannot be taken back without a force-push, which no
// session may do, so each such push cost a fresh branch (the first product: its installer
// 3df99b92, 5 Nov; its installer worker 606/609 and agent runner 3ee34e5, 6 Nov).
