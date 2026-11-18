// ===== file: layerflow.test.mjs (continued) =====

  // a's job starts (its start row), and lands.
  writeRows(root, SB, 'start a', [[flowFile(3, 'start', 'a-1'), { row: 'start', layer: 3, module: 'a', attempt: 1, at: '2026-01-01T00:00:00.000Z' }]]);
  await layerLand(root, 7, { io: lio, log: quiet });
  // BOB adds CR-7 for a on the tranche; the layer syncs it in.
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'tranche', 'origin/tranche'], { cwd: d });
  commit(d, { [ROUND]: '- [ ] CR-2 · a · strengthen the R1 test\n- [ ] CR-7 · a · and the R2 one; today: the R3 one\n' }, 'CR-7');
  git(['push', '-q', 'origin', 'tranche'], { cwd: d });
  git(['fetch', '-q', 'origin'], { cwd: root });
  await layerSync(root, 3, { io: { ...syncIO(bare, []), merge: (s, k, sha, title) => ghMerge(bare, 'layer/3', sha, title) }, log: quiet });
  const cfg = configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json', completion_file: ROUND });
  // Named as a join (a, complete, has nothing else to start), and it holds the merge.
  const j0 = layerJobs(root, 3, { io: openIO, log: quiet });
  assert.deepEqual(j0.startable.filter((x) => x.id === 'a'), [{ id: 'a', join: true, more: true, items: ['CR-7'], cmd: 'node .process/tool/p3.mjs layer join a --why "CR-7: and the R2 one; today: the R3 one", then node .process/tool/p3.mjs layer jobs 3 and its job start' }]);
  assert.equal(openLayer(root, cfg, { slug: 'o/p', io: openIO }).ready, false);
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 50, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }) };
  await assert.rejects(layerMerge(root, 3, { io: mio, wait: false, log: quiet }), /layer 3 cannot merge: a has open completion item\(s\) CR-7 not yet joined into the layer: node \S+ layer join a/);
  const st = [];
  layerStatus(root, 3, { io: openIO, log: (l) => st.push(String(l)) });
  assert.match(st.join('\n'), /layer 3 cannot merge yet: 0 module\(s\) not complete, completion item\(s\) to join: a \(CR-7\)/, 'layer status agrees with layer merge (cold review of (i))');
  // The join: an item row; a again, with both items' words.
  const said = [];
  const r = layerJoin(root, 'a', { why: 'CR-7', log: (l) => said.push(String(l)) });
  assert.deepEqual([r.layer, r.recorded, r.items], [3, true, ['CR-7']]);
  assert.match(said.join('\n'), /a joins CR-7 into layer 3, where it is already: CR-7/);
  assert.deepEqual(flowRows(root, SB, 3).items.map((x) => [x.module, x.items.map((y) => y.id)]), [['a', ['CR-7']]]);
  assert.throws(() => layerJoin(root, 'a', { why: 'CR-7', log: quiet }), /a is in layer 3, the open layer: it starts from node \S+ layer jobs 3; nothing recorded/, 'joined once: nothing new');
  const j1 = layerJobs(root, 3, { io: openIO, log: quiet });
  assert.deepEqual(j1.startable.map((x) => x.cmd), ['node .process/tool/p3.mjs job start a --sessions <file> --reopen "CR-2: strengthen the R1 test; CR-7: and the R2 one; today: the R3 one"']);
  await assert.rejects(layerMerge(root, 3, { io: mio, wait: false, log: quiet }), /a is not started/);
  // The ids from the items, not split from their words, which may hold '; ' and ': ' (copy, 8 Nov).
  const st1 = [];
  layerStatus(root, 3, { io: openIO, log: (l) => st1.push(String(l)) });
  assert.ok(st1.includes('a: not started (completion item(s) joined after its last job started: CR-2, CR-7)'), st1.join('\n'));
  // A land of a job started before the row (the first job, landing again) does not do CR-7.
  const rows = (lands, starts) => ({ items: [{ module: 'a', at: '2026-06-01' }], lands: lands.map((at) => ({ module: 'a', at })), starts: starts.map((at) => ({ module: 'a', at })) });
  assert.equal(itemsOwed(rows(['2026-07-01'], ['2026-05-01']), 'a').length, 1, 'its job started before the row');
  assert.equal(itemsOwed(rows(['2026-07-01'], ['2026-05-01', '2026-06-15']), 'a').length, 0, 'a job started after the row landed');
  assert.equal(itemsOwed(rows(['2026-07-01'], []), 'a').length, 0, 'no start row: the land counts');
  assert.equal(itemsOwed(rows(['2026-05-15'], []), 'a').length, 1, 'a land before the row');
  // Second-resolution rows: a start in the row's second is not after it; a land in its start's second follows it.
  const sec = { items: [{ module: 'a', at: '2026-06-01T00:00:05Z' }], lands: [{ module: 'a', at: '2026-06-01T00:00:07Z' }] };
  assert.equal(itemsOwed({ ...sec, starts: [{ module: 'a', at: '2026-06-01T00:00:05Z' }] }, 'a').length, 1, 'same second as the row: one more run');
  assert.equal(itemsOwed({ ...sec, starts: [{ module: 'a', at: '2026-06-01T00:00:07Z' }] }, 'a').length, 0, 'a land in its start\'s second');
  assert.equal(itemsOwed({ ...sec, starts: [{ module: 'a', at: '2026-06-01T00:00:06.500Z' }] }, 'a').length, 0, 'mixed resolution compares as times');
    // A restart of the job started before the row is the same job, its old task (cold review of (i)).
  assert.equal(itemsOwed({ ...rows(['2026-07-01'], ['2026-05-01']), starts: [{ module: 'a', at: '2026-05-01' }, { module: 'a', at: '2026-06-15', restart: true }] }, 'a').length, 1, 'a restart is not a new job');
  // Owed ahead of a reschedule: a re-test's job has no item words (cold review of (i)).
  const resch = [{ user: 'a', provider: 'b', provider_land: 'pb', at: '2026-06-20' }];
  const ms = moduleStates({ mods: ['a'], entries: new Map([['a', { status: { state: 'COMPLETE' } }]]), marks: new Map(), prs: [], lands: [{ module: 'a', head: 'h1', pr: 7, at: '2026-05-15' }], reschedules: resch, anc: () => false, items: new Map([['a', 'CR-7: x']]), owed: new Set(['a']) });
  assert.deepEqual([ms[0].state, ms[0].item], ['not started', 'CR-7: x']);
  assert.match(ms[0].why, /re-runs against b's new interface too/);
  // a's new job starts after the row and lands; the merge ticks CR-2 and CR-7.
  // Rows are second-resolution: the start is in a second after the item row's, as a real one is.
  const rowAt = Date.parse(flowRows(root, SB, 3).items[0].at);
  while (Date.now() < rowAt + 1000) await new Promise((res) => setTimeout(res, 50));
  writeRows(root, SB, 'start a', [[flowFile(3, 'start', 'a-2'), { row: 'start', layer: 3, module: 'a', attempt: 2, at: new Date().toISOString().replace(/\.\d+Z$/, 'Z') }]]);
  const ha2 = jobWork(bare, 'a', { 'src/a/index.mjs': 'export function a(x) { return x + 2; }\n' }, { n: 3 });
  prs[8] = prOf(8, 'a', ha2, { base: { ref: 'layer/3' } });
  await layerLand(root, 8, { io: lio, log: quiet });
  await layerMerge(root, 3, { io: mio, wait: false, log: quiet });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const round = git(['show', `origin/tranche:${ROUND}`], { cwd: root });
  assert.match(round, /- \[x\] CR-2 · a/);
  assert.match(round, /- \[x\] CR-7 · a/);
});

// C49 rehearsal (PD-17): open a layer, move the tranche's pin, layer sync, the sync PR classed as the
// gate workflow meets it (the class step, then the gate), landed, then layer merge, as before.
test('rehearsal (C49, PD-17): a pin move while a layer is open: layer sync opens a PR the gate classes pin-only (no suite); a job PR into the layer stays full; it lands and the layer merges', async () => {
  const { gate: gateRun, gateClassAt } = await import('../lib/gate.mjs');
  const { browserNeeded } = await import('../lib/gateclass.mjs');
  const { syncOfBranch } = await import('../lib/layerbase.mjs');
  const { spawnSync } = await import('node:child_process');
  const { root, bare } = product({ done: true });
  commit(root, { '.github/workflows/process-gate.yml': 'name: gate v1\n' }, 'shim 1');
  const p1 = git(['rev-parse', 'HEAD'], { cwd: root });
  setPin(root, p1, 'pin 1');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  layerOpen(root, 1, { io: openIO, log: quiet });
  const hc = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 5;\n' });
  await layerLand(root, 6, { io: landIO(bare, { 6: prOf(6, 'c', hc) }), log: quiet });
  // The tranche: the pin moves, its shim with it.
  git(['fetch', '-q', 'origin'], { cwd: root });
  commit(root, { '.github/workflows/process-gate.yml': 'name: gate v2\n' }, 'shim 2');
  const p2 = git(['rev-parse', 'HEAD'], { cwd: root });
  setPin(root, p2, 'pin move 2');
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  // layer sync opens its PR (the gate decides): the pin move's own step (PD-23).
  const made = [];
  await layerSync(root, 1, { io: syncIO(bare, made), wait: false, log: quiet });
  assert.equal(made.length, 1);
  const { head: branch, base: into } = made[0];
  assert.equal(syncOfBranch(branch), 1, 'the gate knows the branch layer sync names');
  git(['fetch', '-q', 'origin'], { cwd: root });
  const base = git(['rev-parse', 'origin/layer/1'], { cwd: root });
  const head = git(['rev-parse', `origin/${branch}`], { cwd: root });
  // The process clone as the gate reads it: p1 and p2 released, p2 forward, p2's shim.
  const shimHash = spawnSync('git', ['hash-object', '--stdin'], { input: 'name: gate v2\n', encoding: 'utf8' }).stdout.trim();
  const repo = { released: (p) => [p1, p2].includes(p), descends: (a, b) => a === b || (a === p1 && b === p2), shim: (p, n) => (p === p2 && n === 'process-gate.yml' ? shimHash : null), text: () => null };
  // The checkout: GitHub's merge of the head into the base (the head, which holds the base).
  git(['checkout', '-q', '--detach', head], { cwd: root });
  const c = gateClassAt(root, { base, head, branch, baseRef: into, repo });
  assert.deepEqual([c.class, browserNeeded(c) ? 'keep' : 'skip'], ['pin-only', 'skip'], c.why);
  process.env.GITHUB_RUN_ID ||= '1';
  const lines = [];
  const g = gateRun(root, { base, head, branch, pr: 91, slug: 'o/p', repo, browserSkipped: true, io: { comments: () => [], getPR: () => ({ user: { login: 'bob' }, draft: false, base: { ref: into } }), verify: () => true }, exec: () => { throw new Error('nothing is installed or built'); }, log: (l) => lines.push(String(l)) });
  assert.deepEqual(g.findings, [], lines.join('\n'));
  assert.deepEqual([g.run.class, g.run.suite, g.run.scope], ['pin-only', 'skipped', []]);
  assert.match(g.run.class_why, /^layer sync 1: the pin /);
  // A job's PR into the same layer, at the same tip, carrying the same pin: full, its suite run.
  const hj = jobWork(bare, 'c', { 'src/c/index.mjs': 'export const c = 7;\n' }, { from: `origin/${branch}` });
  git(['fetch', '-q', 'origin'], { cwd: root });
  git(['checkout', '-q', '--detach', hj], { cwd: root });
  assert.equal(gateClassAt(root, { base, head: hj, branch: 'job/c', baseRef: into, repo }).class, 'full');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  // Landed on the green gate; the layer holds the tranche's pin; no sync owed; the layer merges.
  const r = await layerSync(root, 1, { io: { ...syncIO(bare, made), openPRs: (s, b) => (b === 'layer/1' ? [{ number: 91, head: { ref: branch, sha: head } }] : []) }, log: quiet });
  assert.equal(r.synced, true);
  git(['fetch', '-q', 'origin'], { cwd: root });
  assert.equal(git(['ls-tree', 'origin/layer/1', '--', '.process'], { cwd: root }).split(/\s+/)[2], p2);
  const mio = { slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, q) => ({ number: 99, ...q, base: { ref: q.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }) };
  const m = await layerMerge(root, 1, { io: mio, wait: false, log: quiet });
  assert.equal(m.ok, true);
});


// Kept by every job without exception: the reviewer for jobs has changed. Handover notes now carry
// the line `reviewer: Calum Drysdale`, and the name Tamsin Polkinghorne is no longer written
// anywhere in a handover note.

// ===== file: scale-fixture.mjs =====

// A product at the copy's scale (C50, Bob, 9 Nov: "Let's fix as many of them as we can"; the copy's
// `setup check --at HEAD` took about 15 minutes): about 60 modules with their ledger entries, rows,
// requirements and layer lines, about 1000 commits on the tranche, a state branch of thousands of
// rows, an open layer with its branch, and a --depth 1 clone of it, as a pin session clones. Built
// with one git fast-import, so it costs a test about a second. Not a test file: setup-speed.test
// and the pin-move rehearsal build it.
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { git } from '../lib/util.mjs';
import './helpers.mjs';

const SHIMS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'shims');
const shim = (f) => readFileSync(join(SHIMS, f), 'utf8');
export const OWNER = 'neobobkrause';

// The files of a complete setup, as the setup tests' world holds them.
function setupFiles(cfg) {
  const lines = shim('CLAUDE.process.md').replaceAll('{tranche}', 'tranche');
  return {
    'CLAUDE.md': `## Standing approvals from Bob\n\nThe owner's words.\n\n${lines}`,
    '.claude/settings.json': JSON.stringify({ permissions: { deny: ['Bash(git push --force *)'] }, hooks: JSON.parse(shim('settings.hooks.json')).hooks }, null, 2) + '\n',
    ...Object.fromEntries(readdirSync(SHIMS).filter((f) => /\.ya?ml$/.test(f) && f !== 'process-dev-release.yml').map((f) => [`.github/workflows/${f}`, shim(f)])),
    'process/config.json': JSON.stringify(cfg, null, 2) + '\n',
  };
}

// opts: modules (60), commits (1000), stateRows (3000), open (the open layer, 9), pin (the
// .process gitlink's commit: the tool's own HEAD by default, so the pin is read from this clone).
export function scaleFixture({ modules = 60, commits = 1000, stateRows = 3000, layers = 10, open = 9, pin = null, toolRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..') } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'p3-scale-'));
  const origin = join(dir, 'origin.git');
  git(['init', '-q', '--bare', '-b', 'main', origin], { cwd: dir });
  const pinSha = pin || git(['rev-parse', 'HEAD'], { cwd: toolRoot });
  const ids = Array.from({ length: modules }, (_, i) => `mod-${String(i).padStart(2, '0')}`);
  const per = Math.ceil(modules / layers);
  const layerOf = (i) => Math.floor(i / per) + 1;
  // Of the modules: most with an entry; every tenth built before the ledger (no entry, a past
  // layer); the open layer's last two with no entry yet (census: no-entry, ready).
  const noEntry = (i) => i % 10 === 7 || (layerOf(i) >= open && i % per >= per - 2);
  const cfg = {
    tranche: 'tranche', coordinator: 'session_bob', modules_file: 'build/modules.json', layers_file: 'build/layers.md',
    requirements_dir: 'build/requirements', lanes: [{ name: 'ux', dir: 'design/ux' }],
    deploy: { internal_walk: { run: ['npm', 'run', 'walk:internal'] } },
    generated: [{ paths: ['dist/'], regenerate: ['npm', 'run', 'build'], verify: ['npm', 'run', 'verify'] }],
  };
  const files = { ...setupFiles(cfg) };
  files['build/modules.json'] = JSON.stringify({ modules: ids.map((id, i) => ({ id, layer: layerOf(i), paths: [`src/${id}/`], tests: [`test/${id}/`], uses: i ? [ids[i - 1]] : [] })) }, null, 2) + '\n';
  files['build/layers.md'] = ['| Layer | Modules |', '|---|---|', ...Array.from({ length: layers }, (_, k) => `| ${k + 1} | ${ids.filter((_, i) => layerOf(i) === k + 1).join(', ')} |`)].join('\n') + '\n';
  files['build/requirements/README.md'] = '# Requirements\n';
  files['build/situations/job.md'] = '# The job\n';
  files['design/ux/README.md'] = '# UX\n';
  files['dist/bundle.js'] = 'x'.repeat(2048) + '\n';
  ids.forEach((id, i) => {
    files[`build/requirements/${id}.md`] = `# ${id}\n\n${'- [x] REQ-1 done\n'.repeat(40)}${i % 13 === 0 ? '- [ ] REQ-9 not yet\n' : ''}`;
    if (!noEntry(i)) {
      files[`process/ledger/${id}.json`] = JSON.stringify({
        id, title: `Module ${id}`, layer: layerOf(i), paths: [`src/${id}/`], tests: [`test/${id}/`], requirements: `build/requirements/${id}.md`, uses: i ? [ids[i - 1]] : [],
        suite: { cwd: '.', command: ['node', '--test', `test/${id}/`] }, reading: [`build/requirements/${id}.md`],
        status: { state: layerOf(i) < open ? 'COMPLETE' : 'OPEN', at: '2026-11-01T00:00:00Z' },
      }, null, 2) + '\n';
    }
    for (let k = 0; k < 20; k++) files[`src/${id}/f${k}.js`] = `export const v${k} = ${k};\n`;
    for (let k = 0; k < 5; k++) files[`test/${id}/t${k}.test.mjs`] = `// ${id} ${k}\n`;
  });
  for (let k = 0; k < 800; k++) files[`site/page${k}.html`] = `<p>${k}</p>\n`;

  // One fast-import stream: commit 1 holds the files and the .process gitlink; each later commit
  // changes one source file, GitHub's committer on every one (so the approvals history is read).
  const out = [];
  const data = (s) => { const b = Buffer.from(s); out.push(`data ${b.length}\n`); out.push(b); out.push('\n'); };
  const who = (n) => `${OWNER} <noreply@github.com> ${1762000000 + n * 60} +0000`;
  let mark = 0;
  const marks = {};
  for (const [p, t] of Object.entries(files)) { out.push(`blob\nmark :${++mark}\n`); data(t); marks[p] = mark; }
  // A first commit before the setup, as a product converting to the process has.
  out.push(`commit refs/heads/tranche\nmark :${++mark}\ncommitter ${who(0)}\n`); data('first');
  out.push('M 100644 inline README.md\n'); data('# The product\n');
  out.push(`commit refs/heads/tranche\nmark :${++mark}\ncommitter ${who(0)}\n`); data('setup');
  out.push(`from :${mark - 1}\n`);
  for (const [p, m] of Object.entries(marks)) out.push(`M 100644 :${m} ${p}\n`);
  out.push(`M 160000 ${pinSha} .process\n`);
  for (let n = 1; n < commits; n++) {
    const id = ids[n % ids.length];
    out.push(`commit refs/heads/tranche\nmark :${++mark}\ncommitter ${who(n)}\n`); data(`change ${n}`);
    out.push(`M 100644 inline src/${id}/f${n % 20}.js\n`); data(`export const v = ${n};\n`);
    // A pin move every 20 commits rewrites CLAUDE.md's process lines below the block, never the
    // block (the copy's approvals history: the block set once, the file changed many times since).
    if (n % 20 === 0) { out.push('M 100644 inline CLAUDE.md\n'); data(`${files['CLAUDE.md']}\n<!-- pin move ${n} -->\n`); }
    // main: the last release, early in the tranche's history (the copy's tranche is unreleased).
    if (n === Math.floor(commits * 0.1)) out.push(`reset refs/heads/main\nfrom :${mark}\n\n`);
  }
  const stream = Buffer.concat(out.map((x) => (Buffer.isBuffer(x) ? x : Buffer.from(x))));
  const r = git(['fast-import', '--quiet'], { cwd: origin, input: stream, allowFail: true });
  if (r.code !== 0) throw new Error(`fast-import: ${r.stderr}`);
  const tip = git(['rev-parse', 'tranche'], { cwd: origin });
  git(['branch', `layer/${open}`, `tranche~${Math.floor(commits * 0.05)}`], { cwd: origin });
  // The state branch, in a second import: its rows name the tranche's real commits (each layer's
  // close, each land's head and merge, each reschedule's provider land), most of them past a
  // --depth 1 clone's cut, as the copy's are.
  const shas = git(['rev-list', '--first-parent', 'tranche'], { cwd: origin }).split('\n');
  const at = (k) => shas[Math.min(shas.length - 1, Math.max(0, k))];
  const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
  const now = Date.now();
  const rows = [];
  rows.push(['addresses/bob.json', { session: 'session_bob', at: '2026-11-01T00:00:00Z' }]);
  for (let k = 1; k <= open; k++) rows.push([`layerflow/${k}/open.json`, { row: 'open', layer: k, tranche: 'tranche', at: iso(now - (open - k + 1) * 36e5) }]);
  // Each closed layer's merge and close: its commit long past the cut.
  const closed = [];
  for (let k = 1; k < open; k++) {
    const c = at(Math.floor(commits * (1 - k / open)));
    rows.push([`layerflow/${k}/merged.json`, { row: 'merged', layer: k, merge: c, at: iso(now - (open - k) * 36e5) }]);
    closed.push({ row: 'closed', layer: k, tranche: 'tranche', commit: c, at: iso(now - (open - k) * 36e5), deferred: {}, suites: [], generated_changed: [], by: 'layer merge', strategy: 'layer' });
  }
  rows.push(['layers/closed.jsonl', closed.map((r) => JSON.stringify(r)).join('\n') + '\n']);
  // The open layer's runs, lands and reschedules: per module, a run and a land; each land
  // reschedules the module's users (here its next module).
  const mods = ids.filter((_, i) => layerOf(i) === open);
  mods.forEach((id, j) => {
    const head = at(10 + j * 3);
    const merge = at(9 + j * 3);
    rows.push([`layerflow/${open}/run/${id}-1.json`, { row: 'run', layer: open, module: id, round: 1, started: iso(now - 5e6), ended: iso(now - 4e6), tested_on: head }]);
    rows.push([`layerflow/${open}/land/${id}-1.json`, { row: 'land', layer: open, module: id, pr: 900 + j, branch: `job/${id}`, head, before: at(11 + j * 3), merge, at: iso(now - 3e6) }]);
    for (let r = 0; r < 8; r++) {
      const u = ids[(ids.indexOf(id) + 1 + r) % ids.length];
      rows.push([`layerflow/${open}/reschedule/${u}-${id}-${merge.slice(0, 10)}-${r}.json`, { row: 'reschedule', layer: open, user: u, provider: id, provider_pr: 900 + j, provider_land: at(40 + j * 7 + r), at: iso(now - 3e6), key: `${u}<-${id}@${merge.slice(0, 10)}` }]);
    }
  });
  // The tranche open's grants check passed (helpers.mjs openPassed).
  const acts = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];
  rows.push(['metrics/tranche-open.jsonl', [...acts.map((act) => [act, 1]), ...acts.slice(0, 4).map((act) => [act, 2])]
    .map(([act, depth]) => JSON.stringify({ row: 'grant', at: iso(now - 864e5), tranche: 'tranche', act, depth, outcome: 'ok', session: depth === 1 ? 'bob' : 'probe' })).join('\n') + '\n']);
  // The hourly sweep 20 minutes ago measured 4 live job sessions; no check since.
  rows.push(['metrics/sweep.jsonl', JSON.stringify({ at: iso(now - 20 * 6e4), row: 'sweep', live: 4 }) + '\n']);
  // Bulk: the rows of a long-running product (notices, messages, metrics, gate rows).
  const kinds = ['notices', 'messages', 'gate', 'metrics/jobs', 'layerflow/1/run'];
  for (let n = 0; n < stateRows; n++) rows.push([`${kinds[n % kinds.length]}/${Math.floor(n / 50)}/row-${n}.json`, { row: n % 5 === 4 ? 'run' : 'row', n, at: '2026-11-01T00:00:00Z' }]);
  const sout = [];
  const sdata = (t) => { const b = Buffer.from(t); sout.push(Buffer.from(`data ${b.length}\n`), b, Buffer.from('\n')); };
  const perCommit = 50;
  for (let c = 0; c * perCommit < rows.length; c++) {
    sout.push(Buffer.from(`commit refs/heads/process-state\ncommitter ${who(c)}\n`)); sdata(`state ${c}`);
    for (const [p, v] of rows.slice(c * perCommit, (c + 1) * perCommit)) { sout.push(Buffer.from(`M 100644 inline ${p}\n`)); sdata(typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); }
  }
  const s2 = git(['fast-import', '--quiet'], { cwd: origin, input: Buffer.concat(sout), allowFail: true });
  if (s2.code !== 0) throw new Error(`fast-import (state): ${s2.stderr}`);

  // The pin session's clone: --depth 1 of the tranche, as create_session clones it.
  const work = join(dir, 'work');
  git(['clone', '-q', '--depth', '1', '--branch', 'tranche', `file://${origin}`, work], { cwd: dir });
  git(['config', 'user.email', 'noreply@github.com'], { cwd: work });
  git(['config', 'user.name', 'Pin session'], { cwd: work });
  git(['config', 'commit.gpgsign', 'false'], { cwd: work });
  // No automatic gc or maintenance: after many small fetches git starts one detached, and its prune
  // rewrites the shallow file under the next fetch ("shallow file has changed since we read it"; CI's
  // git 2.56 on this fixture). A session's clone can meet that too; a test must not depend on it.
  git(['config', 'gc.auto', '0'], { cwd: work });
  git(['config', 'maintenance.auto', 'false'], { cwd: work });
  return { dir, origin, work, tip, ids, cfg, pin: pinSha, open, noEntry: ids.filter((_, i) => noEntry(i)) };
}

// GitHub's answers for a complete setup (the setup tests' world), and the approvals file's log from
// origin's own history, as GET /repos/.../commits?path= gives it.
export function stubGitHub(fx, slug = 'o/r') {
  const asked = [];
  const ok = (id) => [{ type: 'deletion', ruleset_id: 1 }, { type: 'non_fast_forward', ruleset_id: 1 },
    { type: 'pull_request', parameters: { allowed_merge_methods: ['merge'], required_approving_review_count: 0, require_code_owner_review: false }, ruleset_id: id },
    { type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'gate', integration_id: 15368 }] }, ruleset_id: id }];
  const sets = {
    1: { id: 1, name: 'every-branch', target: 'branch', enforcement: 'active', current_user_can_bypass: 'never', conditions: { ref_name: { include: ['~ALL'], exclude: [] } }, rules: [{ type: 'deletion' }, { type: 'non_fast_forward' }] },
    2: { id: 2, name: 'process3', target: 'branch', enforcement: 'active', current_user_can_bypass: 'never', conditions: { ref_name: { include: ['refs/heads/main', 'refs/heads/tranche'], exclude: [] } }, rules: [] },
  };
  const api = (p) => {
    asked.push(p);
    let m;
    if (p === 'user') return { login: 'acmewidget' };
    if (p === `repos/${slug}`) return { permissions: { admin: false, push: true }, allow_merge_commit: true, allow_auto_merge: false, delete_branch_on_merge: false };
    if (p.startsWith(`repos/${slug}/rulesets?`)) return [{ id: 1 }, { id: 2 }];
    if ((m = p.match(/\/rulesets\/(\d+)\?/))) return sets[m[1]] || null;
    if (p.includes('/rules/branches/')) return ok(2);
    if (p.includes('/actions/artifacts')) return { artifacts: [{ created_at: '2026-11-02T14:34:28Z', expires_at: '2027-01-31T14:33:29Z' }] };
    if (/\/branches\/[^/]+\/protection$/.test(p)) return null;
    if (/\/branches\/[^/]+$/.test(p)) return { protected: true, protection: { enabled: false } };
    if ((m = p.match(/\/commits\?sha=([0-9a-f]+)&path=([^&]+)/))) {
      const log = git(['--literal-pathspecs', 'log', '--format=%H %cI %P', '-n', '100', m[1], '--', decodeURIComponent(m[2])], { cwd: fx.origin, allowFail: true });
      return log.stdout.split('\n').filter(Boolean).map((l) => { const [sha, date, ...ps] = l.split(' '); return { sha, commit: { committer: { date, email: 'noreply@github.com' } }, parents: ps.filter(Boolean).map((s) => ({ sha: s })) }; });
    }
    if (/\/commits\/[0-9a-f]+$/.test(p)) return { committer: { login: 'web-flow' }, author: { login: OWNER }, commit: { verification: { verified: true } } };
    if (p.includes('/pulls?')) return [];
    return null;
  };
  return { api, asked };
}

// A fake `gh` on PATH for the CLI rehearsal: answers `gh api <path>` from stubGitHub, run in a child.
export function fakeGh(fx, slug) {
  const bin = join(fx.dir, 'bin');
  mkdirSync(bin, { recursive: true });
  const me = fileURLToPath(import.meta.url);
  writeFileSync(join(bin, 'gh'), `#!/usr/bin/env node\nconst { stubGitHub } = await import(${JSON.stringify(me)});\nconst a = process.argv.slice(2);\nif (a[0] !== 'api') process.exit(1);\nconst path = a.slice(1).find((x) => !x.startsWith('-'));\nconst v = stubGitHub(${JSON.stringify({ origin: fx.origin })}, ${JSON.stringify(slug)}).api(path);\nif (v === null) { process.stderr.write('HTTP 404'); process.exit(1); }\nprocess.stdout.write(JSON.stringify(a.includes('--slurp') ? [v] : v));\n`, { mode: 0o755 });
  return bin;
}
export const fixtureExists = (p) => existsSync(p);

// ===== file: switch.test.mjs =====

// Account switch (notes/account-switch-review.md, 5 Nov): switch out's manifest on the state
// branch, switch in's preflight and its restart in order, switch quiet, and the train's lease release.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commit, entry, makeRepo } from './helpers.mjs';
import { recordStart } from '../lib/roles.mjs';
import { approvalsHash } from '../lib/start.mjs';
import { fetchState, readState, writeState } from '../lib/state.mjs';
import { MANIFEST_FILE, processTask, productNames, readTasks, switchIn, switchOut, switchQuiet } from '../lib/switch.mjs';
import { git, loadConfig } from '../lib/util.mjs';

const quiet = () => {};
const COORD = 'session_coordold';
const NEW = 'session_coordnew';
const ID = { root: 'session_rootold', bob: 'session_bobold', watcher: 'session_watcherold' };
const APPROVALS = '# CLAUDE\n\n## Standing approvals from Bob\n\nSessions may push.\n';

function product() {
  const root = makeRepo({
    'CLAUDE.md': APPROVALS,
    'process/config.json': { tranche: 'tranche', coordinator: COORD, release_path: ['delta'] },
    'process/ledger/alpha.json': entry('alpha'),
    'process/ledger/beta.json': entry('beta'),
    'process/ledger/delta.json': entry('delta'),
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche:refs/heads/job/gamma'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  for (const [r, id] of Object.entries(ID)) recordStart(root, r, id, { log: quiet });
  // Two messages: one delivered (answered), one sent to BOB and never delivered.
  writeState(root, 'process-state', 'messages', (wt) => {
    mkdirSync(join(wt, 'messages'), { recursive: true });
    writeFileSync(join(wt, 'messages', 'root.jsonl'), [
      { at: '2026-11-05T05:40:00Z', row: 'sent', n: 1, to: 'bob', text: 'run status' },
      { at: '2026-11-05T05:40:05Z', row: 'outcome', n: 1, outcome: 'delivered' },
      { at: '2026-11-05T05:43:00Z', row: 'sent', n: 2, to: 'bob', text: 'notice triage 413 first' },
    ].map((r) => JSON.stringify(r) + '\n').join(''));
  });
  return root;
}

const files = (root, { tasks, sessions }) => {
  const dir = mkdtempSync(join(tmpdir(), 'p3-switch-'));
  const t = join(dir, 'tasks.json');
  const s = join(dir, 'sessions.json');
  writeFileSync(t, JSON.stringify(tasks));
  writeFileSync(s, JSON.stringify(sessions));
  return { t, s };
};

const TASKS = { triggers: [
  { id: 'trig_sweep', name: 'sweep', cron_expression: '14 * * * *', enabled: true, persistent_session_id: ID.root, prompt: `Sweep. sweep --session ${ID.root}` },
  { id: 'trig_flow', name: 'hourly flow', cron_expression: '0 * * * *', enabled: true, persistent_session_id: COORD, prompt: `Flow: message BOB ${ID.bob}` },
  { id: 'trig_report', name: 'train report', run_once_at: '2099-11-06T04:50:00Z', enabled: true, persistent_session_id: 'session_someoneelse', prompt: 'merge train report' },
  { id: 'trig_off', name: 'old probe', cron_expression: '0 0 31 12 *', enabled: false, persistent_session_id: COORD, prompt: 'Reply OK' },
] };
const SESSIONS = { data: [
  { id: 'session_jobalpha', title: 'job alpha', session_status: 'running', updated_at: '2026-11-05T05:40:00Z' },
  { id: 'session_jobalpha0', title: 'job alpha', session_status: 'idle', updated_at: '2026-11-05T01:00:00Z' },
  { id: 'session_jobdelta', title: 'job delta', session_status: 'running', updated_at: '2026-11-05T05:41:00Z' },
  { id: 'session_jobeps', title: 'job eps', session_status: 'idle', updated_at: '2026-11-05T05:30:00Z' },
  { id: 'session_jobzeta', title: 'job zeta', session_status: 'idle', updated_at: '2026-11-05T05:30:00Z' },
  { id: 'session_jobeta', title: 'job eta', session_status: 'idle', updated_at: '2026-11-05T05:30:00Z' },
  { id: 'session_jobbeta', title: 'job beta', session_status: 'archived', updated_at: '2026-11-05T05:00:00Z' },
  { id: 'session_jobgamma', title: 'job gamma (restart)', session_status: 'idle', updated_at: '2026-11-05T05:00:00Z' },
  { id: ID.bob, title: 'BOB', session_status: 'running' },
] };
const ROWS = [
  { id: 'alpha', tranche: 'OPEN', branch: 'WORKING', pr: '#445 draft' },
  { id: 'beta', tranche: 'OPEN', branch: 'WORKING', pr: '#444 draft' },
  { id: 'delta', tranche: 'OPEN', branch: 'BLOCKED (a question)', pr: '#290 ready', ahead: 2 },
  { id: 'eps', tranche: 'OPEN', branch: 'BLOCKED (no PR)', ahead: 2 },
  { id: 'zeta', tranche: 'OPEN', branch: 'WORKING', ahead: 4 },
  { id: 'eta', tranche: 'OPEN', branch: 'WORKING', ahead: 1 },
];
const read = () => ({ rows: ROWS });
const account = (perm = { push: true, admin: false }, login = 'acmewidget') => (p) => (p === 'user' ? (login ? { login } : null) : /^repos\//.test(p) ? { permissions: perm } : null);
const okIO = { api: account(), push: () => ({ code: 0, stdout: '', stderr: '' }) };

test('switch out writes the manifest, and only it, and prints the stop acts in order', () => {
  const root = product();
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const { t, s } = files(root, { tasks: TASKS, sessions: SESSIONS });
  const out = [];
  const before = git(['rev-parse', 'origin/process-state'], { cwd: root });
  const r = switchOut(root, { tasks: t, sessions: s, by: COORD, read, log: (l) => out.push(l) });
  // One commit on the state branch, holding the manifest alone.
  assert.equal(git(['rev-list', '--count', `${before}..origin/process-state`], { cwd: root }), '1');
  assert.equal(git(['diff', '--name-only', before, 'origin/process-state'], { cwd: root }), MANIFEST_FILE);
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), head);
  fetchState(root, 'process-state', { fresh: true });
  const m = JSON.parse(readState(root, 'process-state', MANIFEST_FILE));
  assert.deepEqual(m, r.manifest, 'round trip');
  assert.equal(m.by, COORD);
  assert.equal(m.approvals, approvalsHash(root, 'origin/tranche'));
  assert.deepEqual(Object.fromEntries(Object.entries(m.addresses).map(([k, v]) => [k, v.session])), ID);
  // Enabled tasks only, each with its role.
  assert.deepEqual(m.tasks.map((x) => [x.id, x.role]), [['trig_sweep', 'root'], ['trig_flow', 'coordinator'], ['trig_report', 'unknown']]);
  assert.equal(m.tasks[2].run_once_at, '2099-11-06T04:50:00Z');
  // Live jobs: unarchived, newest session per module, with status's branch, PR and state.
  assert.deepEqual(m.jobs.map((j) => [j.module, j.session, j.branch, j.pr, j.state]), [
    ['delta', 'session_jobdelta', 'job/delta', '#290 ready', 'BLOCKED (a question)'],
    ['alpha', 'session_jobalpha', 'job/alpha', '#445 draft', 'WORKING'],
    ['eps', 'session_jobeps', 'job/eps', null, 'BLOCKED (no PR)'],
    ['eta', 'session_jobeta', 'job/eta', null, 'WORKING'],
    ['gamma', 'session_jobgamma', 'job/gamma', null, 'not in the ledger'],
    ['zeta', 'session_jobzeta', 'job/zeta', null, 'WORKING'],
  ]);
  assert.deepEqual(m.messages.map((x) => `${x.from}-${x.n}`), ['root-2']);
  const text = out.join('\n');
  const at = (re) => { const i = out.findIndex((l) => re.test(l)); assert.ok(i >= 0, String(re)); return i; };
  assert.ok(!out.some((l) => /MERGER|merge train/.test(l)), 'no MERGER to stop');
  assert.ok(at(/^1\. Each live job.*push your work in progress/) < at(/^2\. Switch off each task with update_trigger enabled false/));
  assert.match(text, /- job alpha: session_jobalpha \(job\/alpha, PR #445 draft\)/);
  assert.match(text, /- trig_flow hourly flow \(coordinator\)/);
  assert.doesNotMatch(text, /trig_off/);
  assert.doesNotMatch(text, /—/);
});

test('switch out refuses, writing nothing, when GitHub was not read for the live jobs\' pull requests', () => {
  const root = product();
  const { t, s } = files(root, { tasks: TASKS, sessions: SESSIONS });
  const before = git(['rev-parse', 'origin/process-state'], { cwd: root });
  const unread = () => ({ rows: ROWS.map((r) => ({ ...r, pr: 'unknown (GitHub not read)' })) });
  assert.throws(() => switchOut(root, { tasks: t, sessions: s, by: COORD, read: unread, log: quiet }), /GitHub was not read for the pull requests of delta, alpha, eps, eta, zeta; nothing was written/);
  git(['fetch', '-q', 'origin', '+refs/heads/process-state:refs/remotes/origin/process-state'], { cwd: root });
  assert.equal(git(['rev-parse', 'origin/process-state'], { cwd: root }), before);
});

test('switch out refuses a task list with more pages, and needs --by, --tasks and --sessions', () => {
  const root = product();
  const { t, s } = files(root, { tasks: { triggers: [], next_cursor: 'abc' }, sessions: SESSIONS });
  assert.throws(() => readTasks(t), /more pages/);
  assert.throws(() => switchOut(root, { tasks: t, sessions: s, by: 'me', read, log: quiet }), /--by <session>/);
  assert.throws(() => switchOut(root, { sessions: s, by: COORD, read, log: quiet }), /--tasks <file>/);
  assert.throws(() => switchOut(root, { tasks: t, by: COORD, read, log: quiet }), /--sessions <file>/);
});

test('switch in, preflight held: the restart\'s acts (a) to (g) in order, tasks bound to the new roles, jobs release first', () => {
  const root = product();
  const { t, s } = files(root, { tasks: TASKS, sessions: SESSIONS });
  switchOut(root, { tasks: t, sessions: s, by: COORD, read, log: quiet });
  const out = [];
  switchIn(root, { sessions: s, by: NEW, slug: 'o/p', io: okIO, log: (l) => out.push(l) });
  const text = out.join('\n');
  for (const l of ['- ok: GitHub connected, acting as acmewidget', '- ok: account: acmewidget: push true, admin false', '- ok: push reachable on origin (o/p), dry run']) assert.ok(out.includes(l), l);
  assert.match(text, /- ok: approvals at tranche's tip are those switch out recorded/);
  const steps = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)', '(g)'].map((k) => out.findIndex((l) => l.startsWith(k)));
  assert.ok(steps.every((i, k) => i >= 0 && (k === 0 || i > steps[k - 1])), `in order: ${steps}`);
  assert.match(text, /\(a\) The coordinator records its id: .*"coordinator": "session_coordnew"/);
  assert.match(text, /\(b\) .*switch quiet/);
  assert.match(text, /handover begin` \(old BOB session_bobold\)/);
  assert.doesNotMatch(text, /start merger/);
  assert.match(text, /start watcher --replace session_watcherold/);
  // The coordinator's task, from this session; the old ids in its prompt named as the new role's.
  const flow = out.find((l) => l.includes('hourly flow'));
  const call = JSON.parse(flow.slice(flow.indexOf('{')));
  assert.deepEqual([call.name, call.cron_expression, call.persistent_session_id], ['hourly flow', '0 * * * *', undefined]);
  assert.equal(call.prompt, 'Flow: message BOB <the new bob id: node .process/tool/p3.mjs address bob>');
  assert.match(text, /sweep \(root\): made by ROOT from its own prompt/);
  assert.match(out.find((l) => l.includes('train report')), /"persistent_session_id":"<unknown: it was bound to session_someoneelse; the coordinator decides>"/);
  assert.match(text, /job start alpha --restart "account switch: its session session_jobalpha was on the old Claude account" --stop idle/);
  assert.match(text, /gamma: not in the ledger: nothing to restart/);
  const [d, a] = ['job start delta --restart', 'job start alpha --restart'].map((k) => out.findIndex((l) => l.includes(k)));
  assert.ok(d >= 0 && d < a, 'the release path first');
  assert.match(out[d], /\(release path\)$/);
  // Each job by routeFor's route: BLOCKED with no PR restarts (its draft reopened), a one-commit
  // WORKING start resumes with a list_sessions saved now, an abandoned attempt reopens.
  assert.match(text, /job start eps --restart "account switch/);
  assert.match(text, /`node .process\/tool\/p3.mjs job start eta --sessions <list_sessions saved now>` \(an unfinished start resumes\)/);
  assert.match(text, /zeta: WORKING: its work never merged and no pull request is open: job start zeta --sessions <file> --reopen/);
  assert.match(text, /\(f\) BOB: `node .process\/tool\/p3.mjs status --role bob --sessions <list_sessions saved now>`, then each `job start` its `jobs to start` lists/);
  // A message to BOB stays in the record for the new BOB's status (the copy's dry run held 201).
  assert.match(text, /\(g\) 1 unanswered message\(s\) to BOB stay in the record: .*status --role bob.*resend none/);
  assert.ok(!/MSG root-2 to bob/.test(text));
});

test('switch in refuses on each failed preflight check, naming who fixes it, and starts nothing', () => {
  const root = product();
  const { t, s } = files(root, { tasks: TASKS, sessions: SESSIONS });
  // No manifest yet.
  assert.throws(() => switchIn(root, { sessions: s, by: NEW, slug: 'o/p', io: okIO, log: quiet }), /no switch\/manifest\.json on process-state: the old account runs switch out first/);
  switchOut(root, { tasks: t, sessions: s, by: COORD, read, log: quiet });
  const run = (io, opts = {}) => { const out = []; let err = null; try { switchIn(root, { sessions: s, by: NEW, slug: 'o/p', io, log: (l) => out.push(l), ...opts }); } catch (e) { err = e; } return { out: out.join('\n'), err }; };
  // GitHub unconnected.
  let r = run({ ...okIO, api: account(undefined, null) });
  assert.match(r.err.message, /switch in refused: 2 preflight check\(s\) failed; nothing was started/);
  assert.match(r.out, /FAILED: GitHub is not connected on this Claude account.*Fixes it: Bob: connect GitHub on this Claude account/);
  assert.doesNotMatch(r.out, /^\(a\)/m);
  // Connected as the owner and admin.
  r = run({ ...okIO, api: account({ push: true, admin: true }, 'neobobkrause') });
  assert.match(r.err.message, /1 preflight check/);
  assert.match(r.out, /FAILED: account: neobobkrause: push true, admin true \(push true, admin false needed\)\. Fixes it: Bob: .*non-admin collaborator/);
  // Push not reachable.
  r = run({ ...okIO, push: () => ({ code: 128, stdout: '', stderr: 'remote: Permission denied\nfatal: unable to access' }) });
  assert.match(r.out, /FAILED: push not reachable on origin \(o\/p\): fatal: unable to access\. Fixes it: Bob: install the Claude GitHub App on o\/p/);
  // The approvals changed on the tranche since switch out.
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'CLAUDE.md': APPROVALS + 'The new account too.\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const tip = approvalsHash(root, 'tranche');
  r = run(okIO);
  assert.match(r.out, new RegExp(`FAILED: approvals at tranche's tip \\(${tip.slice(0, 12)}\\) are not those switch out recorded.*--approvals ${tip}`));
  assert.ok(r.err);
  // On Bob's word, the tip's hash given: it goes on.
  r = run(okIO, { approvals: tip });
  assert.equal(r.err, null);
  assert.match(r.out, /- ok: approvals at tranche's tip are the hash given by --approvals/);
  assert.throws(() => switchIn(root, { sessions: s, by: NEW, slug: 'o/p', approvals: 'abc', io: okIO, log: quiet }), /64-hex/);
});

test('switch quiet exits 0 only once the tranche tip has not moved for two minutes', () => {
  const root = product();
  const ct = Number(git(['log', '-1', '--format=%ct', 'origin/tranche'], { cwd: root }));
  const out = [];
  const no = switchQuiet(root, { t: (ct + 30) * 1000, log: (l) => out.push(l) });
  assert.equal(no.ok, false);
  assert.match(out[0], /NOT QUIET, tranche \w{10} moved 30 s ago; run it again in 90 s/);
  assert.equal(switchQuiet(root, { t: (ct + 120) * 1000, log: quiet }).ok, true);
  assert.equal(switchQuiet(root, { minutes: 5, t: (ct + 200) * 1000, log: quiet }).ok, false);
  assert.throws(() => switchQuiet(root, { minutes: 'x', log: quiet }), /--minutes/);
});

// R16 (Bob, 6 Nov: "anticipate or test for issues related to account switching now"): the dry run,
// the read-only preflight, the layer flow and lanes in the restart, and the old sessions retired.
import { DRY_RUN_DIR, RETIRED_FILE, SESSION_CHECKS } from '../lib/switch.mjs';
import { readFacts } from '../lib/ends.mjs';
import { expireRecords } from '../lib/expire.mjs';
import { LANE_SESSIONS_FILE, LANES_FILE, readSeats } from '../lib/lane.mjs';

function withLanes(root, { layer = false } = {}) {
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'process/config.json': { tranche: 'tranche', coordinator: COORD, release_path: ['delta'], lanes: [{ name: 'ux', dir: 'docs/ux/' }, { name: 'triage', dir: 'triage/', kind: 'triage' }], ...(layer ? { merge_strategy: 'layer', modules_file: 'build/modules.json' } : {}) }, 'build/layers.md': '| 1 | One | alpha |\n| 2 | Two | beta, delta |\n', 'docs/ux/README.md': 'ux\n', 'triage/README.md': 't\n' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  writeState(root, 'process-state', 'lanes', (wt) => {
    mkdirSync(join(wt, 'lanes'), { recursive: true });
    mkdirSync(join(wt, 'layerflow', '2'), { recursive: true });
    writeFileSync(join(wt, LANE_SESSIONS_FILE), [{ row: 'start', at: '2026-11-06T10:00:00Z', tranche: 'tranche', lane: 'ux' }, { row: 'record', at: '2026-11-06T10:01:00Z', lane: 'ux', session: 'session_uxold' }, { row: 'start', at: '2026-11-06T10:00:00Z', tranche: 'tranche', lane: 'triage' }, { row: 'record', at: '2026-11-06T10:01:00Z', lane: 'triage', session: 'session_triageold' }].map((r) => JSON.stringify(r) + '\n').join(''));
    writeFileSync(join(wt, LANES_FILE), JSON.stringify({ row: 'ask', at: '2026-11-06T11:00:00Z', tranche: 'tranche', lane: 'ux', question: 'which words?', context: ['docs/ux/brief.md'] }) + '\n' + JSON.stringify({ row: 'ask', at: '2026-11-06T11:05:00Z', tranche: 'tranche', lane: 'triage', question: "is a $5 tier's `cap` in scope?" }) + '\n');
    writeFileSync(join(wt, 'layerflow', '2', 'open.json'), '{}\n');
  });
  return root;
}

test('switch out --dry-run writes beside the manifest, never over it, names every old session, lanes and asks, and stops nothing', () => {
  const root = withLanes(product());
  // As list_triggers gives them (6 Nov): the prompt under derived_state, a fresh task persist_session
  // false, and one of Bob's own that is not the process's.
  const live = [...TASKS.triggers, { id: 'trig_lane', name: 'ux check-in', enabled: true, persist_session: true, persistent_session_id: 'session_uxold', run_once_at: '2099-01-01T00:00:00Z', derived_state: { prompt: 'ux: next PR' } },
    { id: 'trig_bobs', name: 'alpha-pipeline-runner', enabled: true, persist_session: false, run_once_at: '2099-01-01T00:00:00Z', derived_state: { prompt: 'not ours' } },
    { id: 'trig_fresh', name: 'nightly census', enabled: true, persist_session: false, cron_expression: '7 3 * * *', derived_state: { prompt: 'Run node .process/tool/p3.mjs setup check' } },
    // Bob's own, bound to a session of his that is not the process's: listed, its session never retired (cold review of R16).
    { id: 'trig_reading', name: 'reading list', enabled: true, persistent_session_id: 'session_bobsown', run_once_at: '2099-01-01T00:00:00Z', prompt: 'remind me' }];
  // created_at as list_sessions gives it: a real read would record the live sessions; a dry run must not (cold review of R16).
  const { t, s } = files(root, { tasks: live, sessions: { data: SESSIONS.data.map((x) => ({ ...x, created_at: x.updated_at || '2026-11-05T05:00:00Z' })) } });
  const before = git(['rev-parse', 'origin/process-state'], { cwd: root });
  const out = [];
  const r = switchOut(root, { tasks: t, sessions: s, by: COORD, dryRun: true, read, log: (l) => out.push(l) });
  const changed = git(['diff', '--name-only', before, 'origin/process-state'], { cwd: root }).split('\n');
  assert.deepEqual(changed.length, 1);
  assert.ok(changed[0].startsWith(`${DRY_RUN_DIR}/manifest-`) && changed[0] === r.file);
  fetchState(root, 'process-state', { fresh: true });
  assert.equal(readState(root, 'process-state', MANIFEST_FILE), null, 'the real manifest is never written by a dry run');
  const m = r.manifest;
