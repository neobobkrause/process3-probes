test('deploy dev: a mask declared in a later report, or held JSON-escaped, is *** in every stored report; a failed state write leaves the row and reports beside the step files', () => {
  const walk = node(`const fs = require('fs'); const v = 'q"t' + 'ok'; fs.mkdirSync('out', { recursive: true });
    fs.writeFileSync('out/a.txt', 'first ' + 'late' + 'secret\\n');
    fs.writeFileSync('out/b.json', JSON.stringify({ v, steps: [], failures: [] }));
    fs.writeFileSync('out/c.txt', '::add-mask::' + 'late' + 'secret\\n');
    console.log('::add-mask::' + v);`);
  const reports = ['out/a.txt', 'out/b.json', 'out/c.txt'];
  const { root, bare } = withOrigin({ ...product({ ...DEP, walk, walk_reports: reports }) });
  assert.equal(closeLayer(root, '1').ok, true);
  writeFileSync(join(bare, 'hooks', 'pre-receive'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  const logDir = mkdtempSync(join(tmpdir(), 'p3-steps-'));
  const out = [];
  assert.throws(() => deployDev(root, { io: { ...io, logDir }, repo, log: (m) => out.push(m) }));
  assert.match(out.join('\n'), /the state branch was not written \(the deployment itself succeeded\); the row and the walk's reports are in /);
  const a = readFileSync(join(logDir, 'report-a.txt'), 'utf8');
  const b = readFileSync(join(logDir, 'report-b.json'), 'utf8');
  assert.equal(a, 'first ***\n');
  assert.doesNotMatch(b, /latesecret|tok/);
  assert.equal(JSON.parse(readFileSync(join(logDir, 'row.json'), 'utf8')).walk.reports.length, 3);
});

test('no per-layer deploy wording left in the README, the tool, its prompts or the rulebooks (Bob, 4 Nov)', () => {
  const top = join(import.meta.dirname, '..', '..');
  const files = ['README.md', 'tool/p3.mjs', ...readdirSync(join(top, 'tool/lib')).map((f) => `tool/lib/${f}`), ...readdirSync(join(top, 'rulebooks')).map((f) => `rulebooks/${f}`)];
  const PER_LAYER = /after a layer close|after each layer|per[- ]layer deploy|deploy (and walk )?(after|between) layers|layer \S+ closed, not yet deployed|close row and deploy and walk|deploy and walk stays owed only after a recorded close|no layer has closed since the last recorded deploy/i;
  for (const f of files) {
    const hits = readFileSync(join(top, f), 'utf8').split('\n').filter((l) => PER_LAYER.test(l));
    assert.deepEqual(hits, [], f);
  }
});

// C43 (Bob, 8 Nov): "the internal walk would be the last step of a round, but the live walk would
// only run once a round completed without any flaws identified in the internal walk". No text left
// says a round's close runs the internal walk, then the deploy and its walk.
test('no wording left that a round close runs the internal walk, then the deploy and its live walk (C43)', () => {
  const top = join(import.meta.dirname, '..', '..');
  const files = ['README.md', 'tool/p3.mjs', ...['tool/lib', 'rulebooks', 'governing'].flatMap((d) => readdirSync(join(top, d)).filter((f) => /\.(mjs|md)$/.test(f)).map((f) => `${d}/${f}`))];
  const OLD = /internal walk, then the deploy and its walk|before the dry run|internal walk first, then the dry run|close, internal walk, `?deploy dev`?, live walk/i;
  for (const f of files) assert.deepEqual(readFileSync(join(top, f), 'utf8').split('\n').filter((l) => OLD.test(l)), [], f);
});

// BD-R1 (Bob, 8 Nov): a walk ends the round; its findings, as found marks, open the next round
// over the map's layers; that round's close owes the next deploy and walk.
test('rounds: every layer closed is the first round\'s close; the walk\'s findings open round 2, its layer past the map; once it merges, round 2 closes and owes the next deploy', () => {
  const report = node(`const fs = require('fs'); const fixed = fs.existsSync('fixed'); fs.mkdirSync('out', { recursive: true }); fs.writeFileSync('out/report.json', JSON.stringify({ steps: [], failures: fixed ? [] : [{ kind: 'http-500' }] })); process.exit(fixed ? 0 : 1)`);
  const { root } = withOrigin({
    'process/config.json': { deploy: { ...DEP, walk: report, walk_reports: ['out/report.json'] } },
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n',
    'build/requirements/a.md': 'all met\n', 'process/ledger/a.json': done('a'), 'test/a/x.test.mjs': PASS, 'out/.gitignore': '*\n',
  });
  opened(root);
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  push(root, { 'x.txt': 'the tranche past main\n' });
  assert.match(see(root).text, /FIRST: the round-close run is owed \(the first round closed, not yet deployed\): .* deploy dev, .*; job starts do not wait for it/);
  assert.equal(deployDev(root, { io, repo, log: quiet }).ok, false);
  const first = git(['rev-parse', 'origin/tranche'], { cwd: root }).slice(0, 10);
  push(root, { 'build/requirements/a.md': `all met\n- **F1** *(not yet met: walk p3dev-l1 ${first})* http-500\n` });
  assert.throws(() => deployDev(root, { io, repo, log: quiet }), new RegExp(`never between layers \\(the walk p3dev-l1 ${first} ended round 1; round 2 opens from its findings: round 2 · layer 1 \\(internal layer 2\\) for a`));
  assert.doesNotMatch(see(root).text, /round-close run is owed/);
  assert.throws(() => trancheClose(root, { slug: repo, io: closeIO, log: quiet }), /tranche close waits: the walk p3dev-l1 \w+ ended round 1; round 2 opens from its findings/);
  // Round 2's layer opens, and merges with a's fix: round 2 closed, its walk owed.
  const state = (files) => { onState(root, files); git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root }); };
  state({ 'layerflow/2/open.json': JSON.stringify({ row: 'open', layer: 2, tranche: 'tranche', at: new Date().toISOString(), round: { n: 2, of: 1, mods: ['a'], items: [] } }) });
  assert.throws(() => deployDev(root, { io, repo, log: quiet }), /round 2 is open: round 2 · layer 1 \(internal layer 2\) has not merged/);
  push(root, { 'build/requirements/a.md': 'all met\n', fixed: 'x\n' });
  state({ 'layerflow/2/merged.json': JSON.stringify({ row: 'merged', layer: 2, at: new Date().toISOString() }) });
  assert.match(see(root).text, /FIRST: the round-close run is owed \(round 2 closed since \w+ was deployed\)/);
  assert.equal(deployDev(root, { io, repo, log: quiet }).ok, true);
  assert.ok(trancheClose(root, { slug: repo, io: closeIO, log: quiet }).ok);
});

// BD-R1 (Bob, 8 Nov): "until an internal walk doesn't find flaws, the release deployment happens,
// and the walk of the release also doesn't identify flaws. When the release walk is clean, the
// installer is updated for that release, then the [product's] website is updated": tranche close
// refuses in that order, then names the two updates, each on Bob's approval, a gap where no
// workflow runs one.
test('tranche close (BD-R1): refused until a clean internal walk, then a release, then a clean release walk; then the installer update, then the site update, before the merges', () => {
  const inner = node(`const fs = require('fs'); fs.mkdirSync('out/local', { recursive: true }); const ok = fs.existsSync('fixed'); fs.writeFileSync('out/local/report.json', JSON.stringify({ steps: [{ ok }], failures: ok ? [] : [{ kind: 'step' }] })); process.exit(ok ? 0 : 1)`);
  const dep = { ...DEP, internal_walk: { run: inner, reports: ['out/local/report.json'] } };
  const REL = { checks: [['true']], assemble: ['true'], out: 'out/rel' };
  const { root } = withOrigin({
    'process/config.json': { deploy: dep, release: REL },
    'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n',
    'build/requirements/a.md': 'all met\n', 'process/ledger/a.json': done('a'), 'test/a/x.test.mjs': PASS, 'out/.gitignore': '*\n',
  });
  opened(root);
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  push(root, { 'x.txt': 'the tranche past main\n' });
  const state = (files) => { onState(root, files); git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root }); };
  const close = () => trancheClose(root, { slug: repo, io: closeIO, log: quiet });
  // 1. The internal walk found a flaw, recorded against a: the next round is owed, not the close.
  const r1 = walkRound(root, { io, repo, log: quiet });
  assert.equal(r1.row.internal_walk.ok, false);
  assert.equal(r1.row.row, 'round-walk');
  push(root, { 'build/requirements/a.md': `all met\n- **F1** *(not yet met: internal walk ${r1.row.slug} ${r1.row.commit.slice(0, 10)})* step\n` });
  assert.throws(close, /tranche close waits: the walk internal-\S+ \w{10} ended round 1; round 2 opens from its findings: round 2 · layer 1 \(internal layer 2\) for a/);
  // a fixed and walked again: a clean internal walk. 2. no release yet.
  push(root, { fixed: 'x\n', 'build/requirements/a.md': 'all met\n' });
  const r2 = walkRound(root, { io, repo, log: quiet });
  assert.equal(r2.row.internal_walk.ok, true);
  assert.throws(close, /tranche close waits: no development release since the clean internal walk internal-\S+ \w{10}: node \S+ release dev, then the release deployment and its walk \(BD-R1\)/);
  // A release cut before that walk does not count; one after it does: 3. its walk owed, no path (gap).
  const later = new Date(Date.parse(r2.row.at) + 1000).toISOString();
  state({ 'releases/dev.jsonl': `${JSON.stringify({ row: 'dev-release', tranche: 'tranche', version: 'v0', conclusion: 'success', commit: r2.row.commit, at: '2000-01-01T00:00:00Z' })}\n` });
  assert.throws(close, /no development release since the clean internal walk/);
  state({ 'releases/dev.jsonl': `${JSON.stringify({ row: 'dev-release', tranche: 'tranche', version: 'v1', conclusion: 'success', commit: r2.row.commit, at: later })}\n` });
  assert.throws(close, /tranche close waits: the release deployment of v1 and its walk are owed: node \S+ deploy release v1; GAP: no path yet installs the cut, signed release onto a p3dev- deployment/);
  // The release walk found a flaw: refused; clean: the close goes on.
  state({ 'deploys/release.jsonl': `${JSON.stringify({ row: 'release-walk', tranche: 'tranche', version: 'v1', commit: r2.row.commit, ok: false, failures: 2, at: later })}\n` });
  assert.throws(close, /tranche close waits: the walk of release v1 found 2 flaw\(s\); recorded as found marks, they open the next round \(BD-R1\)/);
  // BD-R5: clean with no AI account: the non-AI journeys only; the end acts wait for a clean walk with AI on.
  state({ 'deploys/release.jsonl': `${JSON.stringify({ row: 'release-walk', tranche: 'tranche', version: 'v1', commit: r2.row.commit, ok: true, failures: 0, ai: false, not_walked: ['assistant'], at: later })}\n` });
  assert.throws(close, /tranche close waits: the walk of release v1 is clean on the non-AI journeys only \(no AI account configured; not walked: assistant\); the installer and site updates wait until a release walk with AI on is clean too/);
  state({ 'deploys/release.jsonl': `${JSON.stringify({ row: 'release-walk', tranche: 'tranche', version: 'v1', commit: r2.row.commit, ok: true, failures: 0, ai: true, at: later })}\n` });
  const c = close();
  assert.equal(c.ok, true);
  assert.equal(c.release, 'v1');
  // 4 then 5: the installer update, then the site update, each on Bob's approval; no workflow: gaps.
  assert.match(c.steps[0], /^the installer update for release v1, on Bob's approval: GAP, no workflow runs it yet \(process\/config\.json installer_update names none\)/);
  assert.match(c.steps[1], /^the product website's update to refer to the new install of v1, on Bob's approval: GAP, no workflow runs it yet \(process\/config\.json site_update names none\)/);
  assert.match(c.steps.slice(2).join('\n'), /create_pull_request .*"head":"tranche","base":"main"/, 'the merges after them');
  assert.deepEqual(c.gaps.map((g) => g.split(':')[0]), ['installer_update', 'site_update']);
  // Named workflows: dispatched through the protected environment, in order.
  push(root, { 'process/config.json': { deploy: dep, release: REL, installer_update: { workflow: 'installer-update.yml' }, site_update: { workflow: 'site-update.yml' } } });
  const named = close();
  assert.match(named.steps[0], /installer update for release v1, on Bob's approval: .*workflow_id installer-update\.yml.*inputs \{"version":"v1"\}; it waits in the protected environment that names Bob as required reviewer/);
