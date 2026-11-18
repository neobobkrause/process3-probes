// ===== file: notice.mjs (continued) =====

  };
  if (!isShallow(root)) {
    for (const ref of refs) if (git(['fetch', '-q', 'origin', `+refs/heads/${ref}:refs/remotes/origin/${ref}`], { cwd: root, allowFail: true }).code !== 0) return 'unknown';
    const h = hit(root, refs.map((r) => `refs/remotes/origin/${r}`));
    return h === null ? 'unknown' : h ? 'merged' : 'none';
  }
  const t = Date.parse(at || '');
  if (!Number.isFinite(t)) return 'unknown';
  const since = new Date(t - 7 * 24 * 3600 * 1000).toISOString();
  const url = git(['remote', 'get-url', 'origin'], { cwd: root, allowFail: true });
  if (url.code !== 0) return 'unknown';
  return withTemp('p3-merged-', (dir) => {
    for (const ref of refs) {
      const d = join(dir, ref.replace(/[^\w.-]/g, '_'));
      const c = git(['clone', '-q', '--bare', '--filter=blob:none', `--shallow-since=${since}`, '--single-branch', '--branch', ref, url.stdout.trim(), d], { cwd: dir, allowFail: true });
      if (c.code !== 0) return 'unknown';
      const h = hit(d, [ref]);
      if (h === null) return 'unknown';
      if (h) return 'merged';
    }
    return 'none';
  });
}
const writeWithdrawn = (root, sb, key, row) => writeState(root, sb, `withdraw provider notice ${key}`, (wt) => {
  const f = join(wt, withdrawFile(key));
  if (!resolve(f).startsWith(resolve(wt, NOTICES_DIR) + sep)) throw new Error(`refused: ${withdrawFile(key)} is outside ${NOTICES_DIR}/`);
  mkdirSync(dirname(f), { recursive: true });
  if (!existsSync(f)) writeFileSync(f, JSON.stringify(row) + '\n');
  return {};
});
export function withdrawNotice(root, cfg, key, { getPR, presence = prPresence, merged = mergedHere, slug, as = 'bob', log = console.log, compare: compareRead = compare }) {
  const sb = cfg.state_branch;
  if (!fetchState(root, sb, { fresh: true })) fail(`no ${sb} on origin: no provider notice ${key}`);
  const n = notices(root, sb).find((x) => x.key === key);
  if (!n) fail(readState(root, sb, withdrawFile(key)) !== null ? `provider notice ${key} is already withdrawn` : `no provider notice ${key} on ${sb} (${noticeFile(key)})`);
  // The row's own PR number, as its key names it (a hand-edited "12x" would 404 for a real PR 12).
  if (!Number.isInteger(n.pr) || n.pr < 1 || n.key !== noticeKey(n.provider, n.pr)) fail(`refused: provider notice ${key} names pull request ${JSON.stringify(n.pr)}, not the whole number its key names`);
  const { pr, missing } = readNoticePR(slug, n.pr, { getPR, presence });
  if (missing) {
    const here = merged(root, cfg, n.pr, { at: n.at });
    if (here !== 'none') fail(here === 'merged'
      ? `refused: GitHub serves no pull request ${n.pr} in ${slug} (${missing.status}), but this repository's history holds its merge: a real PR GitHub hides; provider notice ${key} stands`
      : `refused: GitHub serves no pull request ${n.pr} in ${slug} (${missing.status}), but whether this repository's history holds its merge could not be read; provider notice ${key} stands; run it again`);
    const row = { row: 'withdrawn', at: new Date().toISOString(), key, provider: n.provider, pr: n.pr, by: as, why: missing.why, missing: true, users: n.users.length };
    writeWithdrawn(root, sb, key, row);
    log(`provider notice ${key} withdrawn: ${row.why}; ${n.open.length} unanswered user(s) no longer owe it`);
    return row;
  }
  const m = pr?.merge_commit_sha;
  if (!pr?.merged || !m) fail(`pull request ${n.pr} is not merged: what it changed cannot be read`);
  const { head: h, mb } = mergedRange(root, m, { slug, n: n.pr, read: compareRead });
  const e = readEntry(root, mb, n.provider);
  if (!e) fail(`the tranche had no ledger entry for ${n.provider} at ${mb.slice(0, 10)}: its source paths cannot be read`);
  const src = sourceChanges(root, cfg, e, mb, h);
  if (src.length) fail(`refused: pull request ${n.pr} changed ${src.length} file(s) of ${n.provider}'s source (${src.slice(0, 5).join(', ')}); provider notice ${key} stands`);
  const row = { row: 'withdrawn', at: new Date().toISOString(), key, provider: n.provider, pr: n.pr, merge_commit: m, by: as,
    why: `PR ${n.pr} changed no file of ${n.provider}'s source (${sourcePaths(cfg, e).join(', ') || 'no source paths'})`, users: n.users.length };
  writeWithdrawn(root, sb, key, row);
  log(`provider notice ${key} withdrawn: ${row.why}; ${n.open.length} unanswered user(s) no longer owe it`);
  return row;
}

// ===== file: generated.test.mjs =====

// Generated files over max_file_bytes (the copy, 4 Nov: rows.mjs 5.2 MB, the agent-worker bundle
// 8.9 MB, its main plane's bundle 29 MB). The record check refuses any commit that writes one, so no
// pull request can refresh it and layer close's "regenerated files differ" never cleared. The
// line: such a file is not committed; it is built at deploy and release; layer close regenerates
// and verifies it, comparing only the generated paths the tranche commits.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildGenerated, oversizeGenerated } from '../lib/checks.mjs';
import { DEPLOYS_FILE, deployDev } from '../lib/deploy.mjs';
import { layerChecks } from '../lib/layer.mjs';
import { releaseRun } from '../lib/release.mjs';
import { setupCheck } from '../lib/setup.mjs';
import { git, loadConfig, run } from '../lib/util.mjs';
import { entry, makeRepo, closeLayer } from './helpers.mjs';

const quiet = () => {};
const PASS = "import test from 'node:test';\ntest('ok', () => {});\n";
// gen.mjs writes both generated files: big.txt (never committed) and small.txt (committed).
const GEN = "import { mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('gen', { recursive: true });\nwriteFileSync('gen/big.txt', 'B'.repeat(4096));\nwriteFileSync('gen/small.txt', 'fresh\\n');\n";
const ROWS = [
  { paths: ['gen/big.txt'], regenerate: ['node', 'gen.mjs'], verify: ['node', '-e', "if (require('fs').statSync('gen/big.txt').size !== 4096) process.exit(1)"] },
  { paths: ['gen/small.txt'], regenerate: ['node', 'gen.mjs'], verify: ['node', '-e', 'process.exit(0)'] },
];
const done = (id) => ({ ...entry(id, { requirements: `build/requirements/${id}.md`, status: { state: 'COMPLETE' } }), tests: [`test/${id}/`] });
const product = (config = {}, files = {}) => ({
  'process/config.json': { generated: ROWS, max_file_bytes: 1024, ...config },
  'gen.mjs': GEN,
  'gen/small.txt': 'stale\n',
  'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n| 2 | next | d |\n',
  'build/requirements/a.md': '- **R1** *(not yet met: x)* text\n',
  'build/requirements/d.md': '- **R1** *(not yet met: x)* text\n',
  'process/ledger/a.json': done('a'),
  'test/a/x.test.mjs': PASS,
  ...files,
});
function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  return { root, bare };
}
const io = { openPRs: () => [], checkRun: () => null, compare: () => null };

test('layer checks: a generated path the tranche does not commit is built and verified, never "differs"; a committed one still differs', () => {
  const { root } = withOrigin(product());
  const cfg = loadConfig(root);
  const out = [];
  const r = layerChecks(root, cfg, git(['rev-parse', 'HEAD'], { cwd: root }), [{ id: 'a' }], { timeout: 60000, log: (m) => out.push(m) });
  assert.deepEqual(r.findings, [], out.join('\n'));
  assert.deepEqual(r.changed, ['gen/small.txt'], 'only the committed path is compared');
  assert.deepEqual(r.stale, [{ file: 'gen/small.txt', regenerate: 'node gen.mjs' }], 'named with its regenerate for layer merge');
  assert.deepEqual(r.built, ['gen/big.txt']);
  // A built file whose verify fails is a finding, even when .gitignore hides it from git.
  const bad = withOrigin(product({ generated: [{ ...ROWS[0], verify: ['node', '-e', 'process.exit(4)'] }] }, { '.gitignore': 'gen/big.txt\n' }));
  const f = layerChecks(bad.root, loadConfig(bad.root), git(['rev-parse', 'HEAD'], { cwd: bad.root }), [{ id: 'a' }], { timeout: 60000, log: quiet }).findings;
  assert.match(f.map((x) => `${x.check}: ${x.file}: ${x.message}`).join('\n'), /generated: gen\/big\.txt: .*failed \(exit 4\) after building/);
});

test('buildGenerated: only rows with a path the commit does not track are built; a failure is a finding', () => {
  const root = makeRepo(product());
  const ran = [];
  const exec = (c, a, o) => { ran.push([c, ...a].join(' ')); assert.ok(o.unset.includes('GITHUB_TOKEN')); return { code: 0, stdout: '', stderr: '', seconds: 0 }; };
  const b = buildGenerated(root, ROWS, { timeout: 60000, exec });
  assert.deepEqual(b.built, ['gen/big.txt']);
  assert.deepEqual(ran, ['node gen.mjs'], 'the committed row is not built');
  const f = buildGenerated(root, ROWS, { timeout: 60000, exec: () => ({ code: 2, stdout: '', stderr: 'boom', seconds: 0 }) });
  assert.match(f.findings[0].message, /node gen\.mjs failed \(exit 2\) building gen\/big\.txt: boom/);
});

test('setup check: a committed generated file over max_file_bytes is product work, named with BOB\'s act', () => {
  const root = makeRepo(product({}, { 'gen/big.txt': 'B'.repeat(4096) }));
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: root });
  const lines = [];
  const r = setupCheck(root, { slug: 'o/r', conditions: [], io: { api: () => null, openPRs: () => [], prFiles: () => [] }, log: (l) => lines.push(l) });
  assert.deepEqual(r.generated.over, [{ file: 'gen/big.txt', bytes: 4096 }]);
  assert.match(lines.join('\n'), /product work: 1 committed generated file over max_file_bytes \(1024\); no pull request can refresh one:\n- gen\/big\.txt: 4096 bytes; BOB's act: stop committing it .* build it in release\.assemble and the deploy/);
  assert.deepEqual(oversizeGenerated(root, ROWS, 'HEAD', 1 << 20), []);
  const fine = makeRepo(product());
  git(['update-ref', 'refs/remotes/origin/tranche', 'HEAD'], { cwd: fine });
  const l2 = [];
  assert.deepEqual(setupCheck(fine, { slug: 'o/r', conditions: [], io: { api: () => null, openPRs: () => [], prFiles: () => [] }, log: (l) => l2.push(l) }).generated.over, []);
  assert.doesNotMatch(l2.join('\n'), /product work/);
});

test('deploy dev and release run build the uncommitted generated files before their own steps', () => {
  const GUARD = 'p3dev guard: passed';
  const node = (code) => ['node', '-e', code];
  const deploy = { slug_prefix: 'p3dev-', dry_run: node(`console.log(${JSON.stringify(GUARD)})`), deploy: node("if (!require('fs').existsSync('gen/big.txt')) process.exit(5)"), walk: node('0'), guard_line: GUARD };
  const { root, bare } = withOrigin(product({ deploy, plan: 'close' }));
  assert.equal(closeLayer(root, '1').ok, true);
  git(['clean', '-qfd', 'gen'], { cwd: root });
  const out = [];
  const r = deployDev(root, { io: { compare: () => null }, repo: 'o/p', log: (m) => out.push(m) });
  assert.equal(r.ok, true, out.join('\n'));
  assert.deepEqual(r.row.results.map((x) => [x.stage, x.exit]), [['build', 0], ['dry_run', 0], ['deploy', 0], ['walk', 0]]);
  assert.ok(JSON.parse(git(['show', `process-state:${DEPLOYS_FILE}`], { cwd: bare }).split('\n').at(-1)).ok, 'the run\'s row, after its start row');
  assert.match(out.join('\n'), /findings of the walk, if any, enter by the route for work found elsewhere: `node \.process\/tool\/p3\.mjs found <module> "<finding>" --from "walk p3dev-l1 \w{10}"`/);
  // The release's checks job, on its own checkout, builds them too.
  const rel = makeRepo(product({ release: { checks: [node("if (!require('fs').existsSync('gen/big.txt')) process.exit(6)")], assemble: node('0'), out: 'rel' } }));
