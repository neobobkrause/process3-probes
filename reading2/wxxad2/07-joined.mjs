// ===== file: workflows.mjs (continued) =====

      if (p.length < 2) return r(`a direct commit on ${tranche}, not a merged pull request whose gate was green`);
      const v = judge(c);
      if (!v.ok) return r(`which ${v.why}`);
      const ran = [p[1], ...(v.base ? [v.base] : [])].find((x) => !realGate(root, x, io.repo));
      if (ran) return r(`PR ${v.pr}'s merge, but ${ran.slice(0, 10)}, which its gate ran on, does not hold the pin's own process-gate.yml, so that gate could be the PR's own`);
      if (blob(root, c, f) !== blob(root, p[1], f)) return r(`PR ${v.pr}'s merge, but the merge does not carry the file as the PR's gated head had it`);
    }
  }
  return null;
}

// All rules for a close's product workflow files (the shims are held by the caller, rule 4).
// Rules 2 and 3 hold when the change fits the allowed shapes, or, since the owner's limits
// (build workflow-limits, R1; Bob, 6 Nov), when it passes them (at.limits: merge.mjs, the
// limits of workflow-limits.mjs against main's required checks), as the plain pull requests that
// brought it did. Returns [{ file, limits }] for the merge's message.
// at: { mb, base, baseRef, tranche, slug, io, ownerCommit, limits(f, src, baseSrc) }.
export function closeWorkflows(root, sha, files, at) {
  const close = { ...at, io: { getPR, comments, verify: (slug, r, ctx) => verifyRow(slug, r, ctx), ...(at.io || {}) } };
  const refuse = (f, why) => fail(`the tranche changes ${f}: ${why}. A close may carry a product workflow change only through gated pull requests, and only in the allowed shapes or within the owner's limits`);
  const one = gatedChanges(root, sha, close.mb, files, close);
  if (one) refuse(one.f, one.why);
  const judged = [];
  for (const f of files) {
    if (!/\.ya?ml$/.test(f)) continue; // GitHub runs only .yml and .yaml files; rule 1 held it
    const src = text(root, sha, f);
    const baseSrc = text(root, close.baseRef, f);
    const why = src === null ? 'rule 3: it removes a workflow, and no allowed shape removes one' : workflowShapes(src, baseSrc);
    if (!why) { judged.push({ file: f, limits: ['rule 1', 'rules 2 and 3'] }); continue; }
    const lim = src !== null && at.limits ? at.limits(f, src, baseSrc) : null;
    if (lim?.ok) { judged.push({ file: f, limits: ['rule 1', ...lim.limits] }); continue; }
    refuse(f, `${why}${lim ? `; nor is it within the owner's limits (${lim.limit}${lim.line ? `, line ${lim.line}` : ''}: ${lim.why})` : ''}`);
  }
  return judged;
}

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
