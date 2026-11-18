// ===== file: lane-session.test.mjs (continued) =====

});

test('a lane session is its own kind in the session list, kept while it holds the seat, a leftover once ended or replaced', () => {
  const old = '2026-11-01T00:00:00Z';
  const s = sessionActs([{ id: S1, title: 'lane ux', session_status: 'idle', updated_at: old }, { id: S2, title: 'other thing', session_status: 'idle', updated_at: old, parent_session_id: 'session_gone' }, { id: 'session_gone', title: 'x', session_status: 'archived' }]);
  assert.equal(s.kinds.lanes, 1);
  assert.deepEqual(s.acts.map((a) => a.id), [S2]);
  // With the seats read: the seat's session is kept; one the seat no longer names is a leftover.
  const list = [{ id: S1, title: 'lane ux', session_status: 'idle', updated_at: old }];
  assert.deepEqual(sessionActs(list, { seats: new Map([['ux', { session: S1 }]]) }).acts, []);
  assert.deepEqual(sessionActs(list, { seats: new Map([['ux', { session: null }]]) }).acts, []);
  assert.deepEqual(sessionActs(list, { seats: new Map([['ux', { session: S2 }]]) }).acts.map((a) => [a.act, a.id]), [['archive', S1]]);
  assert.deepEqual(sessionActs(list, { seats: new Map() }).acts.map((a) => a.id), [S1]);
  assert.match(s.line, /jobs 0, lanes 1, builds 0/);
  assert.doesNotMatch(sessionActs([]).line, /lanes/);
});

test('lane ask while the lane\'s session is live: the question goes to that session, not to a worker', () => {
  const { root } = withOrigin({ 'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n', ...QUAL });
  const a = [];
  laneAsk(root, 'ux', 'which words?', { log: (m) => a.push(m) });
  assert.match(a.join('\n'), /start one read-only worker/);
  laneStart(root, 'ux', { slug: 'o/p', log: quiet });
  laneStart(root, 'ux', { record: S1, log: quiet });
  const b = [];
  laneAsk(root, 'ux', 'which words?', { log: (m) => b.push(m) });
  assert.match(b.join('\n'), /lane ux has its one session live, so it decides: send_message to the lane's session session_lane1/);
  assert.doesNotMatch(b.join('\n'), /read-only worker \(a subagent/);
});

test('a lane module\'s START says the job is the lane\'s one session', () => {
  const base = { entry: entry('ux-design'), slug: 'o/p', branch: 'job/ux-design', tranche: 'tranche', coordinator: 'session_bob', bob: true, attempt: 1, reading: { files: [], bytes: 0 } };
  assert.doesNotMatch(startText(base), /lane's one session/);
  assert.match(startText({ ...base, lane: { name: 'ux', dir: 'd', artifacts: [{ url: 'https://claude.ai/artifact/AAA', title: 'Doc' }] } }), /The lane's design documents \(claude\.ai; read what your work needs\): Doc https:\/\/claude\.ai\/artifact\/AAA\./);
  assert.match(startText({ ...base, lane: { name: 'ux', dir: 'docs/development/ux-substrate' } }), /You are also the ux lane's one session \(Bob, 5 Nov\): within the product's principles you decide design and wording in `docs\/development\/ux-substrate\/`/);
});

test('lane config: a folder the gate would not count is refused; a paused plan starts no lane session; lane start takes no job start option', async () => {
  const { lanes } = await import('../lib/lane.mjs');
  for (const dir of ['.', 'process/ux', '../x', '.github/x']) assert.throws(() => lanes({ lanes: [{ name: 'ux', dir }] }), /cannot be a lane folder/, dir);
  assert.deepEqual(lanes({ lanes: [{ name: 'ux', dir: './design/ux/' }] }), [{ name: 'ux', dir: 'design/ux', module: null, kind: 'design', research: 'design/ux-research', repo: 'product' }]);
  const { root } = withOrigin({ 'process/config.json': { plan: 'pause', lanes: [{ name: 'ux', dir: 'design/ux' }] }, 'design/ux/README.md': 'x\n' });
  assert.throws(() => laneStart(root, 'ux', { slug: 'o/p', log: quiet }), /plan pause: take no new step; no lane session was started/);
  const { main } = await import('../p3.mjs');
  const err = [];
  const was = console.error;
  console.error = (m) => err.push(String(m));
  const cwd = process.cwd();
  process.chdir(root);
  let code;
  try { code = await main(['lane', 'start', 'ux', '--restart', 'stuck']); } finally { console.error = was; process.chdir(cwd); }
  assert.equal(code, 1);
  assert.match(err.join('\n'), /lane start takes no --restart: those are job start's/);
});

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
