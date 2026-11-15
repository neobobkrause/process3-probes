#!/usr/bin/env node
// Runs the users' own tests before and after one replayed change, in a scratch copy of the product.
//
//   node replay/tests.mjs <change> [--work <scratch folder>] [--users a,b]
//
// The copy: the product at the commit before the change (git archive, without the process's plan and job records),
// made a throwaway git repository of its own (the product's build steps list tracked files), its packages installed
// from the npm registry, and its test preparation run (the steps of bio-plane's "pretest"). Then each user's test files
// (its "tests" paths in the module list, files ending .test.mjs) are run with Node's test runner, from the user's top
// folder, as the product's own test command does (bio-plane with its sqlite preload). Then the provider's own files
// are replaced by the merge's, the preparation is run again, and every user is run again.
// A user "fails because of the change" when a test fails after that did not fail before.
// Writes results/tests/<change>.json. Nothing is written in the product's repository.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { changeOf, usersOf, extractProvider, providerPaths, DEFAULT_REPO } from '../adaptor/state.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv.splice(i, 2)[1] : undefined; };
const work = path.resolve(opt('--work') ?? path.join(ROOT, 'work', 'tests'));
const only = opt('--users');
const id = argv[0];
const c = changeOf(id);
const repo = DEFAULT_REPO;
const tree = path.join(work, id.replace(':', '-'));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

function sh(cmd, args, cwd, timeout = 900_000) {
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { cwd, timeout, maxBuffer: 1 << 28, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
  return { status: r.status, signal: r.signal, out: (r.stdout ?? '').toString(), err: (r.stderr ?? '').toString(), ms: Date.now() - t0 };
}

function prepare() {
  fs.rmSync(tree, { recursive: true, force: true });
  fs.mkdirSync(tree, { recursive: true });
  const a = spawnSync('sh', ['-c', `git -C '${repo}' archive ${c.before} | tar -x -C '${tree}' --exclude='build/plan/*' --exclude='build/jobs/*' --exclude='release/*'`]);
  if (a.status !== 0) throw new Error(a.stderr.toString());
  sh('git', ['init', '-q'], tree);
  sh('git', ['add', '-A'], tree);
  sh('git', ['-c', 'user.email=replay@example.invalid', '-c', 'user.name=replay', 'commit', '-qm', 'scratch copy'], tree);
  for (const top of fs.readdirSync(tree)) {
    if (fs.existsSync(path.join(tree, top, 'package-lock.json'))) { const r = sh('npm', ['ci', '--no-audit', '--no-fund'], path.join(tree, top)); log('npm ci', top, r.status); }
  }
}

function pretest() {
  const steps = [['docs/development/ux-substrate/screens/build_words.mjs'], ['bio-plane/src/setup-words/build.mjs'], ['bio-plane/src/case-checker/build-program.mjs'], ['bio-plane/scripts/bundles.mjs']];
  const out = [];
  for (const [s] of steps) if (fs.existsSync(path.join(tree, s))) { const r = sh('node', [s], tree); out.push({ step: s, status: r.status }); }
  return out;
}

const under = (f, p) => f === p || (p.endsWith('/') && f.startsWith(p));
function testFiles(user) {
  const mods = JSON.parse(execFileSync('git', ['-C', repo, 'show', `${c.before}:build/modules.json`]).toString()).modules;
  const m = mods.find((x) => x.id === user);
  const all = execFileSync('git', ['-C', repo, 'ls-tree', '-r', '--name-only', c.before], { maxBuffer: 1 << 28 }).toString().split('\n');
  return all.filter((f) => f.endsWith('.test.mjs') && m.tests.some((p) => under(f, p)));
}

function runUser(user) {
  const files = testFiles(user);
  if (!files.length) return { files: 0 };
  const byTop = new Map();
  for (const f of files) { const top = f.split('/')[0]; if (!byTop.has(top)) byTop.set(top, []); byTop.get(top).push(f.slice(top.length + 1)); }
  const res = { files: files.length, pass: 0, fail: 0, failed: [], ms: 0, status: [] };
  for (const [top, fs1] of byTop) {
    const pre = top === 'bio-plane' ? ['--import', './test/platform-sqlite.mjs'] : [];
    const r = sh('node', [...pre, '--test', '--test-concurrency=2', '--test-reporter=tap', ...fs1], path.join(tree, top), 900_000);
    res.ms += r.ms;
    res.status.push(r.signal ? `killed ${r.signal}` : r.status);
    const lines = r.out.split('\n');
    for (const l of lines) {
      const m = /^not ok \d+ - (.*)$/.exec(l);
      if (m) res.failed.push(`${top}: ${m[1].replace(/\s+#.*$/, '')}`);
    }
    const p = /^# pass (\d+)/m.exec(r.out), f = /^# fail (\d+)/m.exec(r.out);
    res.pass += p ? +p[1] : 0; res.fail += f ? +f[1] : 0;
  }
  return res;
}

const users = only ? only.split(',') : usersOf(c);
const result = { change: id, provider: c.provider, before: c.before, after: c.after, node: process.version, started: new Date().toISOString(), users: {} };
log('preparing', id);
prepare();
result.pretestBefore = pretest();
for (const u of users) { result.users[u] = { before: runUser(u) }; log('before', u, result.users[u].before.pass, 'pass', result.users[u].before.fail, 'fail'); }
// the provider's files replaced by the merge's
for (const p of providerPaths(c, c.before)) fs.rmSync(path.join(tree, p), { recursive: true, force: true });
const tmp = path.join(work, `${id.replace(':', '-')}-after-files`);
extractProvider(c, c.after, tmp);
spawnSync('cp', ['-a', `${tmp}/.`, tree]);
fs.rmSync(tmp, { recursive: true, force: true });
result.pretestAfter = pretest();
for (const u of users) {
  result.users[u].after = runUser(u);
  const before = new Set(result.users[u].before.failed ?? []);
  result.users[u].newFailures = (result.users[u].after.failed ?? []).filter((x) => !before.has(x));
  log('after', u, result.users[u].after.pass, 'pass', result.users[u].after.fail, 'fail', result.users[u].newFailures.length, 'new');
}
result.finished = new Date().toISOString();
fs.mkdirSync(path.join(ROOT, 'results', 'tests'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'results', 'tests', `${id.replace(':', '-')}.json`), JSON.stringify(result, null, 1) + '\n');
fs.rmSync(tree, { recursive: true, force: true });
log('done', id);
