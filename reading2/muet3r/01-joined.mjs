// ===== file: layer.test.mjs (continued) =====

const LAYERS = '| layer | what | modules |\n|---|---|---|\n| 1 | first | a, b |\n| 2 | next | d |\n';
const done = (id) => entry(id, { requirements: `build/requirements/${id}.md`, status: { state: 'COMPLETE' } });
const base = {
  'build/layers.md': LAYERS,
  'build/requirements/a.md': unmet(2),
  'build/requirements/b.md': unmet(0),
  'build/requirements/d.md': unmet(1),
  'process/ledger/a.json': done('a'),
  'process/ledger/b.json': done('b'),
};

// The state branch, as origin's copy, holding the given closed rows.
function closedOn(root, rows) {
  git(['checkout', '-q', '--orphan', 's'], { cwd: root });
  git(['rm', '-rqf', '.'], { cwd: root });
  commit(root, { [CLOSED_FILE]: rows.map((r) => JSON.stringify({ row: 'closed', tranche: 'tranche', ...r })).join('\n') + '\n' });
  git(['update-ref', 'refs/remotes/origin/process-state', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['branch', '-D', 's'], { cwd: root });
}

test('layer ready to close with marks left: no next work in it, BOB\'s act is layer close', () => {
  const root = makeRepo(base);
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.equal(r.layer.cur.n, 1);
  assert.equal(r.layer.ready, true);
  assert.deepEqual(r.next, []);
  assert.match(out.join('\n'), /^layer 1 ready to close: node \.process\/tool\/p3\.mjs layer close 1$/m);
  assert.doesNotMatch(out.join('\n'), /next work/);
});

test('layer not ready while a module of it has an open job', () => {
  const root = makeRepo({ ...base, 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md' }) });
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.equal(r.layer.cur.n, 1);
  assert.equal(r.layer.ready, false);
  assert.doesNotMatch(out.join('\n'), /ready to close/);
});

test('a closed layer: the next layer is listed, its deferred marks shown and not listed as work', () => {
  const root = makeRepo(base);
  const tip = git(['rev-parse', 'HEAD'], { cwd: root });
  closedOn(root, [{ layer: 1, commit: tip, deferred: { a: ['R1', 'R2'] } }]);
  openPassed(root);
  const out = [];
  const r = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  assert.equal(r.layer.cur.n, 2);
  assert.deepEqual(r.next.map((x) => x.file), ['build/requirements/d.md']);
  assert.deepEqual(r.layer.deferred, [{ layer: 1, id: 'a', count: 2 }]);
  assert.match(out.join('\n'), /deferred at layer close \(not work\):\n- a \(layer 1\): 2\n/);
  assert.match(out.join('\n'), /next work, layer 2 .*\n- build\/requirements\/d\.md: 1 \(layer 2\)$/);
  // A row whose commit is already on main (a tranche merged before) does not count.
  git(['update-ref', 'refs/remotes/origin/main', tip], { cwd: root });
  assert.equal(status(root, { role: 'bob', offline: true, log: quiet }).layer.cur.n, 1);
  // Online, GitHub's compare says whether it is on main (a shallow clone cannot): here it is not.
  git(['update-ref', '-d', 'refs/remotes/origin/main'], { cwd: root });
  git(['remote', 'add', 'origin', join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'p.git')], { cwd: root });
  const asked = [];
  const on = (ahead) => ({ openPRs: () => [], checkRun: () => null, compare: (s, b, h) => { asked.push([s, b, h]); return { ahead_by: ahead }; } });
  assert.equal(status(root, { role: 'bob', log: quiet, io: on(1) }).layer.cur.n, 2);
  assert.deepEqual(asked.at(-1).slice(1), ['main', tip]);
  assert.equal(status(root, { role: 'bob', log: quiet, io: on(0) }).layer.cur.n, 1);
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
const PASS = "import test from 'node:test';\ntest('ok', () => {});\n";
const FAIL = "import test from 'node:test';\ntest('no', () => { throw new Error('x'); });\n";


// Binding on all jobs: the job's handover note is saved under the file name `bellwether-relay.md`,
// and under no other name.

test('layer close: runs the suites on the tranche tip, records the close with its deferred marks, prints the next layer', () => {
  const { root, bare } = withOrigin({ ...base, 'process/ledger/a.json': { ...done('a'), tests: ['test/a/'] }, 'test/a/x.test.mjs': PASS, 'process/ledger/b.json': { ...done('b'), tests: ['test/b/'] }, 'test/b/x.test.mjs': PASS });
  const out = [];
  const r = layerClose(root, '1', { io, log: (m) => out.push(m) });
  assert.equal(r.ok, true);
  assert.match(out.at(-1), /^next act: node \.process\/tool\/p3\.mjs job start --ready --live <n>/, 'BOB closing the layer starts its ready jobs next');
  const row = JSON.parse(git(['show', `process-state:${CLOSED_FILE}`], { cwd: bare }));
  assert.equal(row.layer, 1);
  assert.equal(row.commit, git(['rev-parse', 'tranche'], { cwd: bare }));
  assert.deepEqual(row.deferred, { a: ['R1', 'R2'] });
  assert.match(out.join('\n'), /layer 1 closed at tranche .*; deferred: a 2[\s\S]*next work, layer 2[\s\S]*- build\/requirements\/d\.md: 1/);
  // BOB closing (the default sender) is awake: no wake line.
  assert.equal(r.wake, null);
  assert.doesNotMatch(out.join('\n'), /wake BOB/);
  // Another session's close gives BOB new work (measured 3-4 Nov: BOB idles until woken): its last
  // line is the wake, runnable as printed, from --as.
  const { root: other } = withOrigin({ ...base, 'process/ledger/a.json': { ...done('a'), tests: ['test/a/'] }, 'test/a/x.test.mjs': PASS, 'process/ledger/b.json': { ...done('b'), tests: ['test/b/'] }, 'test/b/x.test.mjs': PASS });
  const said = [];
  const w = layerClose(other, '1', { io, as: 'coordinator', log: (m) => said.push(m) });
  assert.equal(said.at(-1), 'next act: wake BOB with `node .process/tool/p3.mjs send bob "layer 1 closed: node .process/tool/p3.mjs job start --ready --live <n>, then status" --from coordinator`, delivered with send_message to the address it prints');
  assert.equal(w.wake, said.at(-1));
  // Closed, it is no longer the open layer.
  assert.throws(() => layerClose(root, '1', { io, log: quiet }), /layer 1 is not the open layer; the open layer is 2/);
});

test('layer close: a red suite records nothing; a layer with an open job is refused', () => {
  const { root, bare } = withOrigin({ ...base, 'process/ledger/a.json': { ...done('a'), tests: ['test/a/'] }, 'test/a/x.test.mjs': FAIL, 'process/ledger/b.json': { ...done('b'), tests: ['test/b/'] }, 'test/b/x.test.mjs': PASS });
  const out = [];
  assert.equal(layerClose(root, '1', { io, log: (m) => out.push(m) }).ok, false);
  assert.match(out.join('\n'), /the a suite failed[\s\S]*layer 1 not closed/);
  assert.equal(git(['ls-remote', bare, 'process-state'], { cwd: root }), '');
  const open = withOrigin({ ...base, 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md' }) });
  assert.throws(() => layerClose(open.root, '1', { io, log: quiet }), /layer 1 is not ready to close: b has an open job/);
});

// Measured 3 Nov on the copy: a layer-1 job BLOCKED by `job block` with a reason, its PR open.
const blocked = (reason) => ({ ...base, 'build/requirements/b.md': unmet(1), 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'BLOCKED', ...(reason ? { reason } : {}) } }) });
const prOpen = { openPRs: () => [{ number: 38, draft: false, head: { ref: 'job/b', sha: 'x' }, updated_at: '2026-11-03T00:00:00Z' }], checkRun: () => null, compare: () => null };

test('a module BLOCKED with a reason: BOB closes its PR unmerged, then the layer closes with it deferred', () => {
  const { root, bare } = withOrigin({ ...blocked('R47 rests on measure M-R7, recorded nowhere'), 'process/ledger/a.json': { ...done('a'), tests: ['test/a/'] }, 'test/a/x.test.mjs': PASS });
  openPassed(root);
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
  const out = [];
  const r = status(root, { role: 'bob', log: (m) => out.push(m), io: prOpen });
  assert.equal(r.layer.ready, false);
  assert.equal(r.layer.pending, true);
  assert.deepEqual(r.next, []);
  assert.match(out.join('\n'), /layer 1 ready to close once BOB closes these unmerged \(never deleting the branch\):\n- close PR #38 unmerged: R47 rests on measure M-R7, recorded nowhere\nthen: node \.process\/tool\/p3\.mjs layer close 1/);
  assert.throws(() => layerClose(root, '1', { io: prOpen, log: quiet }), /b is BLOCKED \(R47 rests on measure M-R7, recorded nowhere\) with PR #38 still open: BOB closes it unmerged first/);
  // PR 38 closed: ready, and the close records b deferred with its reason and marks.
  assert.equal(status(root, { role: 'bob', log: quiet, io }).layer.ready, true);
  const out2 = [];
  assert.equal(layerClose(root, '1', { io, log: (m) => out2.push(m) }).ok, true);
  const row = JSON.parse(git(['show', `process-state:${CLOSED_FILE}`], { cwd: bare }));
  assert.deepEqual(row.deferred, { a: ['R1', 'R2'], b: { reason: 'R47 rests on measure M-R7, recorded nowhere', marks: ['R1'] } });
  assert.match(out2.join('\n'), /b: deferred, BLOCKED[\s\S]*deferred: a 2, b 1 \(BLOCKED: R47/);
});

test('a module BLOCKED with no reason holds the layer, its PR closed or not', () => {
  const { root } = withOrigin(blocked(null));
  for (const io_ of [prOpen, io]) {
    const out = [];
    const r = status(root, { role: 'bob', log: (m) => out.push(m), io: io_ });
    assert.equal(r.layer.ready, false);
    assert.equal(r.layer.pending, false);
    assert.doesNotMatch(out.join('\n'), /ready to close/);
  }
});

test('BLOCKED with a reason on the job branch (as job block records it) defers the module', () => {
  const { root } = withOrigin({ ...blocked(null), 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'WORKING' } }) });
  git(['checkout', '-q', '-b', 'job/b', 'tranche'], { cwd: root });
  commit(root, { 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'BLOCKED', reason: 'why' } }) }, 'block b: why');
  git(['push', '-q', 'origin', 'job/b'], { cwd: root });
  const r = status(root, { role: 'bob', log: quiet, io: prOpen });
  assert.equal(r.layer.pending, true);
  assert.deepEqual(r.layer.owed.map((m) => [m.id, m.pr, m.blocked]), [['b', 38, 'why']]);
});

test('a deferred module: offline, its PR unread, the layer is held; its PR closed, no restart flag', () => {
  const { root } = withOrigin({ ...blocked(null), 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'WORKING' } }) });
  git(['checkout', '-q', '-b', 'job/b', 'tranche'], { cwd: root });
  commit(root, { 'process/ledger/b.json': entry('b', { requirements: 'build/requirements/b.md', status: { state: 'BLOCKED', reason: 'why' } }) }, 'block b: why');
  git(['push', '-q', 'origin', 'job/b'], { cwd: root });
  const tranche = makeRepo(blocked('why'));
  assert.equal(status(tranche, { role: 'bob', offline: true, log: quiet }).layer.ready, false);
  const r = status(root, { role: 'bob', log: quiet, io });
  assert.equal(r.layer.ready, true);
  assert.equal(r.rows.find((x) => x.id === 'b').flag, 'BLOCKED');
});

// ===== file: gate-browser.test.mjs =====

// Build gate-chromium (4 Nov): the gate job installs the Chromium the product's lock files pin,
// read from the merged checkout at run time, before the suite; CHROMIUM names it and the log
// names its version. The shim's two steps run here under bash with npx stubbed.
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { makeRepo } from './helpers.mjs';

const SHIM = readFileSync(join(import.meta.dirname, '..', '..', 'shims', 'process-gate.yml'), 'utf8');
const gateJob = SHIM.slice(SHIM.indexOf('\n  gate:\n'), SHIM.indexOf('\n  post:\n'));
const stepRun = (name) => {
  const step = gateJob.slice(gateJob.indexOf(`- name: ${name}\n`));
  const body = [];
  for (const l of step.slice(step.indexOf('run: |\n') + 7).split('\n')) { if (l.trim() && !l.startsWith('          ')) break; body.push(l.slice(10)); }
  return body.join('\n');
};
const lock = (pkgs) => JSON.stringify({ lockfileVersion: 3, packages: Object.fromEntries(Object.entries(pkgs).map(([k, v]) => [k, { version: v }])) });

function bash(script, cwd, env) {
  const tmp = mkdtempSync(join(tmpdir(), 'p3-browser-'));
  const f = join(tmp, 's.sh');
  writeFileSync(f, script);
  for (const k of ['GITHUB_OUTPUT', 'GITHUB_ENV']) writeFileSync(join(tmp, k), '');
  const r = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', f], { cwd, encoding: 'utf8', env: { ...process.env, RUNNER_TEMP: tmp, GITHUB_OUTPUT: join(tmp, 'GITHUB_OUTPUT'), GITHUB_ENV: join(tmp, 'GITHUB_ENV'), ...env } });
  return { ...r, out: readFileSync(join(tmp, 'GITHUB_OUTPUT'), 'utf8'), env: readFileSync(join(tmp, 'GITHUB_ENV'), 'utf8') };
}

// Stubs on PATH: npx records its calls; `install` lays a chrome down under the build's location;
// `--dry-run` prints each build's location and URL as playwright does. curl and unzip, the
// fallback's, record their URLs and unpack a chrome from a chromium zip.
function stubNpx(calls, { noChrome = false, failFirst = 0, failDry = false, failCurl = false, failCdn = false } = {}) {
  const bin = mkdtempSync(join(tmpdir(), 'p3-npx-'));
  const home = join(bin, 'ms-playwright');
  const chrome = (dir) => `mkdir -p "${dir}/chrome-linux"; printf '#!/bin/bash\\necho "Chromium 141.0.%s"\\n' "$v" > "${dir}/chrome-linux/chrome"; chmod +x "${dir}/chrome-linux/chrome"`;
  writeFileSync(join(bin, 'npx'), `#!/bin/bash
echo "\${PLAYWRIGHT_HOST_PLATFORM_OVERRIDE:-native} $*" >> ${calls}
v=\${2#playwright-core@}; loc=${home}/chromium-$v
if [ "$4" = "--dry-run" ]; then ${failDry ? 'echo "unknown option --dry-run" >&2; exit 1; ' : ''}
  for b in "chromium-$v chromium-linux" "ffmpeg-1011 ffmpeg-linux" "chromium_headless_shell-$v chromium-headless-shell-linux" "ffmpeg-1011 ffmpeg-linux"; do set -- $b
    printf 'browser: %s\\n  Install location:    %s\\n  Download url:        https://cdn.example/%s-%s.zip\\n  Download fallback 1: https://other.example/%s-%s.zip\\n\\n' "$1" "${home}/$1" "$2" "$v" "$2" "$v"; done; exit 0; fi
n=$(grep -cE -- ' install (--with-deps )?chromium$' ${calls}); if [ "$n" -le ${failFirst} ]; then exit 1; fi
${noChrome ? '' : chrome('$loc')}
`);
  writeFileSync(join(bin, 'curl'), `#!/bin/bash
for a in "$@"; do case "$a" in https://*) u=$a;; esac; done; while [ $# -gt 0 ]; do [ "$1" = -o ] && o=$2; shift; done
echo "curl $u" >> ${calls}; ${failCurl ? 'exit 22' : failCdn ? 'case "$u" in https://cdn.*) exit 22;; esac; echo "$u" > "$o"' : 'echo "$u" > "$o"'}
`);
  writeFileSync(join(bin, 'unzip'), `#!/bin/bash
while [ $# -gt 0 ]; do case "$1" in -d) d=$2; shift;; -q|-o) ;; *) z=$1;; esac; shift; done
u=$(cat "$z"); echo "unzip $u $d" >> ${calls}; v=\${u##*-linux-}; v=\${v%.zip}
case "$u" in *chromium-linux-*) ${chrome('$d')};; *) mkdir -p "$d"; : > "$d/x";; esac
`);
  for (const f of ['npx', 'curl', 'unzip']) chmodSync(join(bin, f), 0o755);
  return { PATH: `${bin}:${process.env.PATH}`, home };
}

test('the versions: the top-level playwright-core of each lock file the gate installs, sorted, none hand-written; nothing else', () => {
  const root = makeRepo({
    'site/package-lock.json': lock({ '': '0.0.0', 'node_modules/playwright-core': '1.56.1' }),
    'bio-plane/src/journey-check/package-lock.json': lock({ 'node_modules/playwright-core': '1.56.1', 'node_modules/x/node_modules/playwright-core': '1.9.0' }),
    'pre/package-lock.json': lock({ 'node_modules/playwright-core': '1.57.0-alpha-2025-10-01' }),
    'a/package-lock.json': lock({ 'node_modules/playwright': '2.0.0', 'node_modules/not-playwright-core': '3.0.0' }),
    'b/package-lock.json': lock({ 'node_modules/playwright-core': '1.2.3; rm -rf /' }),
    'c/package-lock.json': '{ not json',
    'fixture/package-lock.json': lock({ 'node_modules/playwright-core': '1.40.0' }),
  });
  const LOCKFILES = JSON.stringify(['site/package-lock.json', 'bio-plane/src/journey-check/package-lock.json', 'pre/package-lock.json', 'a/package-lock.json', 'b/package-lock.json', 'c/package-lock.json', 'missing/package-lock.json', '../x/package-lock.json']);
  const r = bash(stepRun("the browser the product's lock files pin"), root, { LOCKFILES });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.out, 'versions=1.56.1 1.57.0-alpha-2025-10-01\n', 'no nested or unlisted lock file, no bad version');
  assert.match(r.stdout, /::warning::browser: the lock files pin playwright-core 1\.56\.1 1\.57\.0-alpha-2025-10-01; CHROMIUM names the newest/);
  const one = bash(stepRun("the browser the product's lock files pin"), root, { LOCKFILES: JSON.stringify(['site/package-lock.json']) });
  assert.equal(one.out, 'versions=1.56.1\n');
  assert.doesNotMatch(one.stdout, /::warning::/);
  for (const LOCKFILES of ['[]', '', '"site/package-lock.json"', JSON.stringify(['a/package-lock.json'])]) {
    const n = bash(stepRun("the browser the product's lock files pin"), root, { LOCKFILES });
    assert.equal(n.status, 0, n.stderr);
    assert.equal(n.out, 'versions=\n', LOCKFILES);
    assert.match(n.stdout, /no playwright-core in the lock files the pin step's config lists; none installed/);
  }
  // The pin step hands the config's lock files on.
  assert.match(gateJob, /echo "lockfiles=\$\(echo "\$cfg" \| jq -c '\.lockfiles \/\/ \[\]'\)" >> "\$GITHUB_OUTPUT"/);
  assert.match(gateJob, /LOCKFILES: \$\{\{ steps\.pin\.outputs\.lockfiles \}\}/);
});

test('the install: each pinned build with its system libraries, CHROMIUM names the newest, the log names the version', () => {
  const dir = mkdtempSync(join(tmpdir(), 'p3-calls-'));
  const calls = join(dir, 'calls');
  const s = stubNpx(calls);
  const r = bash(stepRun('install the browser'), dir, { PATH: s.PATH, VERSIONS: '1.9.0 1.56.1' });
  assert.equal(r.status, 0, r.stderr);
  const c = readFileSync(calls, 'utf8').trim().split('\n');
  assert.deepEqual(c.filter((l) => / install (--with-deps )?chromium$/.test(l)), ['native -y playwright-core@1.9.0 install --with-deps chromium', 'native -y playwright-core@1.56.1 install --with-deps chromium']);
  assert.equal(r.env, `CHROMIUM=${s.home}/chromium-1.56.1/chrome-linux/chrome\n`);
  assert.match(r.stdout, /::notice::browser: Chromium 141\.0\.1\.56\.1 for playwright-core 1\.56\.1 at /);
  assert.match(r.stdout, /::notice::browser: Chromium 141\.0\.1\.9\.0 for playwright-core 1\.9\.0 at /);
  assert.match(r.stdout, /browser: installed in \d+ s/);
  // An install that leaves no Chromium stops the gate rather than running the tests without one.
  const bad = bash(stepRun('install the browser'), dir, { PATH: stubNpx(join(dir, 'c2'), { noChrome: true }).PATH, VERSIONS: '1.56.1' });
  assert.notEqual(bad.status, 0);
  assert.match(bad.stdout, /::error::browser: playwright-core 1\.56\.1 installed no Chromium/);
  assert.equal(bad.env, '');
  // A failed dry run is the same stop, with its line.
  const dry = bash(stepRun('install the browser'), dir, { PATH: stubNpx(join(dir, 'c5'), { failDry: true }).PATH, VERSIONS: '1.56.1' });
  assert.notEqual(dry.status, 0);
  assert.match(dry.stdout, /::error::browser: playwright-core 1\.56\.1 installed no Chromium under $/m);
  // A version that will not install for this OS (1.56.1 on Ubuntu 26.04), whose installer then
  // hung (copy PR 320): each build of its ubuntu24.04-x64 dry run fetched from its own URL,
  // unpacked where playwright looks and marked installed; none fetched twice; a marked one not again.
  const c3 = join(dir, 'c3');
  const st = stubNpx(c3, { failFirst: 1, noChrome: true });
  const once = bash(stepRun('install the browser'), dir, { PATH: st.PATH, VERSIONS: '1.56.1' });
  assert.equal(once.status, 0, once.stdout + once.stderr);
  const l3 = readFileSync(c3, 'utf8').trim().split('\n');
  assert.equal(l3[0], 'native -y playwright-core@1.56.1 install --with-deps chromium');
  assert.equal(l3[1], 'ubuntu24.04-x64 -y playwright-core@1.56.1 install --dry-run chromium');
  assert.deepEqual(l3.filter((l) => l.startsWith('curl ')).sort(), ['curl https://cdn.example/chromium-headless-shell-linux-1.56.1.zip', 'curl https://cdn.example/chromium-linux-1.56.1.zip', 'curl https://cdn.example/ffmpeg-linux-1.56.1.zip']);
  assert.ok(!l3.some((l) => / install chromium$/.test(l) && l.startsWith('ubuntu')), 'not the installer that hung');
  for (const d of ['chromium-1.56.1', 'chromium_headless_shell-1.56.1', 'ffmpeg-1011']) assert.ok(existsSync(join(st.home, d, 'INSTALLATION_COMPLETE')), d);
  assert.match(once.stdout, /::warning::browser: playwright-core 1\.56\.1 did not install on .* \(an OS newer than it knows, an outage or the 300 s bound\); fetching its ubuntu24\.04-x64 build without system libraries/);
  assert.match(once.stdout, /::notice::browser: Chromium 141\.0\.1\.56\.1 for playwright-core 1\.56\.1 at .* \(the ubuntu24\.04-x64 build\)/);
  assert.match(once.env, /^CHROMIUM=.*chromium-1\.56\.1\/chrome-linux\/chrome\n$/);
  const again = bash(stepRun('install the browser'), dir, { PATH: st.PATH, VERSIONS: '1.56.1' });
  assert.equal(again.status, 0, again.stderr);
  assert.equal(readFileSync(c3, 'utf8').trim().split('\n').filter((l) => l.startsWith('curl ')).length, 3, 'restored builds are not fetched again');
  // The primary URL down: each build from the dry run's first fallback.
  const c7 = join(dir, 'c7');
  const mirror = bash(stepRun('install the browser'), dir, { PATH: stubNpx(c7, { failFirst: 1, noChrome: true, failCdn: true }).PATH, VERSIONS: '1.56.1' });
  assert.equal(mirror.status, 0, mirror.stdout + mirror.stderr);
  assert.match(mirror.stdout, /browser: fetched https:\/\/other\.example\/chromium-linux-1\.56\.1\.zip/);
  assert.match(mirror.env, /^CHROMIUM=.*chromium-1\.56\.1\/chrome-linux\/chrome\n$/);
  // A binary that does not run (missing libraries) stops the gate too.
  const nr = stubNpx(join(dir, 'c6'));
  const broken = bash(stepRun('install the browser').replace('if ! ver=$("$exe" --version)', 'if ! ver=$(false)'), dir, { PATH: nr.PATH, VERSIONS: '1.56.1' });
  assert.notEqual(broken.status, 0);
  assert.match(broken.stdout, /::error::browser: .*chrome \(playwright-core 1\.56\.1\) does not run here/);
  const twice = bash(stepRun('install the browser'), dir, { PATH: stubNpx(join(dir, 'c4'), { failFirst: 2, failCurl: true }).PATH, VERSIONS: '1.56.1' });
  assert.notEqual(twice.status, 0);
  assert.match(twice.stdout, /::error::browser: playwright-core 1\.56\.1 could not install Chromium \(twice\)/);
  assert.equal(twice.env, '');
});

test('the browser steps sit after the record check and before the gate, cached by the versions read', () => {
  const at = (s) => gateJob.indexOf(s);
  assert.ok(at('record-check --base') < at("- name: the browser the product's lock files pin"));
  assert.ok(at('- name: install the browser') < at('- name: gate\n'));
  const KEY = /key: p3-chromium-\$\{\{ runner\.os \}\}-\$\{\{ steps\.browser\.outputs\.versions \}\}/;
  const restore = gateJob.slice(at('uses: actions/cache/restore@'), at('- name: install the browser'));
  assert.match(restore, /if: steps\.browser\.outputs\.versions != ''/);
  assert.match(restore, KEY);
  // Saved after the install and before the gate step (no product code has run), on a miss only;
  // no step saves after the gate.
  const save = gateJob.slice(at('uses: actions/cache/save@'), at('- name: gate\n'));
  assert.ok(at('- name: install the browser') < at('uses: actions/cache/save@') && save.length > 0);
  assert.match(save, /if: steps\.browser\.outputs\.versions != '' && steps\.browser-cache\.outputs\.cache-hit != 'true'/);
  assert.match(save, KEY);
  assert.doesNotMatch(gateJob, /uses: actions\/cache@/, 'not the combined action, whose save runs at the end of the job');
  const install = gateJob.slice(at('- name: install the browser'), at('- name: gate\n'));
  assert.match(install, /^ {8}if: steps\.browser\.outputs\.versions != ''$/m);
  assert.match(install, /^ {8}timeout-minutes: 10$/m, 'a bound of its own inside the 45-minute job');
});

// ===== file: exports.test.mjs =====

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { entryFiles, surfaceOf } from '../lib/exports.mjs';
import { commit, makeRepo } from './helpers.mjs';

const surface = (files, entry) => Object.fromEntries(surfaceOf((f) => files[f] ?? null, entry, (f) => f.startsWith('p/')));

// Review of PR 82: a class built in layers inherits the methods of a base in the same file,
// exported or not, declared before or after it, and through a re-export.
test('a class inherits the methods of a base in its own file, exported or not, before or after, and through export from', () => {
  assert.deepEqual(surface({ 'p/a.mjs': 'class Base { a(x) {} }\nexport class S extends Base { c() {} }\n' }, 'p/a.mjs'),
    { S: 'class', 'S.a': '(x)', 'S.c': '()' });
  assert.deepEqual(surface({ 'p/a.mjs': 'export class S extends Base { c() {} }\nexport class Base { a(x) {} }\n' }, 'p/a.mjs'),
    { S: 'class', 'S.a': '(x)', 'S.c': '()', Base: 'class', 'Base.a': '(x)' });
  assert.deepEqual(surface({ 'p/a.mjs': 'class Base { a(x) {} }\nclass S extends Base {}\nexport { S };\n' }, 'p/a.mjs'),
    { S: 'class', 'S.a': '(x)' });
  assert.deepEqual(surface({
    'p/index.mjs': "export { Q as AiAccounts } from './core.mjs';\n",
    'p/core.mjs': "import { Layer } from './layer.mjs';\nclass Core extends Layer { b() {} }\nexport class Q extends Core { c(y) {} }\n",
    'p/layer.mjs': 'export class Layer { keySet({ key = null } = {}) {} }\n',
  }, 'p/index.mjs'), { AiAccounts: 'class', 'AiAccounts.keySet': '({ key = null } = {})', 'AiAccounts.b': '()', 'AiAccounts.c': '(y)' });
  // Two classes extending each other: read once, no loop.
  assert.deepEqual(surface({ 'p/a.mjs': 'class A extends B { a() {} }\nclass B extends A { b() {} }\nexport { A };\n' }, 'p/a.mjs'),
    { A: 'class', 'A.a': '()', 'A.b': '()' });
});

// Review of PR 82: the provider's own tests import its internals; they are not its users.
test('entry files: an importer in the provider\'s tests is not a user; with only its tests importing it, its index files', () => {
  const root = makeRepo({
    'prov/src/index.mjs': "export { f } from './internal.mjs';\n",
    'prov/src/internal.mjs': 'export function f(a) {}\nexport function helper(b) {}\n',
    'prov/test/a.test.mjs': "import { helper } from '../src/internal.mjs';\n",
  });
  const opts = { isProviderSource: (f) => f.startsWith('prov/src/'), inProvider: (f) => f.startsWith('prov/'), providerPaths: ['prov/src/'] };
  assert.deepEqual(entryFiles(root, 'HEAD', opts), ['prov/src/index.mjs']);
  commit(root, { 'user/a.mjs': "import { f } from '../prov/src/index.mjs';\n" });
  assert.deepEqual(entryFiles(root, 'HEAD', opts), ['prov/src/index.mjs']);
});

// Copy PR 696 (action-records, c06702976d): three private methods were added above the public
// lawEntries, one holding a regular expression with a quote; the reader lost every later member
// and the land read "removed ActionRecords.lawEntries".
test('private #methods, a regular expression holding a quote or brace, accessors, static blocks and class fields lose no later member', () => {
  const before = 'export class ActionRecords {\n  records() { return []; }\n  lawEntries(laws) { return laws; }\n}\n';
  const after = 'export class ActionRecords {\n  records() { return []; }\n  #activeLayers(laws) { return laws.filter((l) => l.active); }\n  #ambiguousLaw(law) { return /[^\'"]+/.test(law.name) && law.n / 2 > 1; }\n  #proposedLayers(laws) { return laws.map((l) => ({ ...l, re: /\\}/ })); }\n  lawEntries(laws) { return this.#activeLayers(laws); }\n}\n';
  const b = surface({ 'p/a.mjs': before }, 'p/a.mjs');
  const a = surface({ 'p/a.mjs': after }, 'p/a.mjs');
  assert.deepEqual(a, b, 'the same public surface');
  assert.equal(a['ActionRecords.lawEntries'], '(laws)');
  const more = surface({ 'p/a.mjs': 'export class A {\n  #cache = new Map();\n  static #count = 0;\n  count = 0;\n  handler = (x) => {\n    return x;\n  };\n  static { A.ready = true; }\n  get #size() { return 1; }\n  set #size(v) {}\n  static #make() {}\n  async #load() {}\n  *#gen() {}\n  run() { return this.#helper(); }\n  #helper() { return 1; }\n  get size() { return 1; }\n  later(x) { return x; }\n}\n' }, 'p/a.mjs');
  assert.deepEqual(more, { A: 'class', 'A.run': '()', 'A.size': 'get', 'A.later': '(x)' });
});

// Cold review of R8: a slash after a postfix ++/--, a TypeScript non-null !, or a property named like
// a keyword (`.of`) divides; a field's initializer continued on the next line is no member.
test('a division after a postfix, a non-null ! or a keyword-named property, and a field continued on the next line, lose no member', () => {
  const s = surface({ 'p/a.mjs': "export class A {\n  f(i, n) { return i-- / n + '/'; }\n  g(x, n) { return x! / n + `/${n}`; }\n  h(s) { return s.of / 2 + `/x`; }\n  total = 1 +\n    base();\n  pub() {}\n}\nexport function z(q) {}\n" }, 'p/a.mjs');
  assert.deepEqual(s, { A: 'class', 'A.f': '(i, n)', 'A.g': '(x, n)', 'A.h': '(s)', 'A.pub': '()', z: 'function(q)' });
});

// ===== file: companion.test.mjs =====

// PD-19 (coordinator, 9 Nov): a module whose change a job in the open layer needs (a registry or
// assembly module) joins that open layer as the job's companion: `layer join <companion>
// --companion-of <job> --layer <n> --why "<what it needs>"`. It lands in the same layer as the job,
// in any order (PD-19b). Each refusal, the land order, and (PD-17) the path rehearsed end to end.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { jobStart } from '../lib/job.mjs';
import { hold } from '../lib/hold.mjs';
import { flowFile } from '../lib/layerbase.mjs';
import { flowRows, layerJobs, layerJoin, layerLand, layerLines, layerMerge, layerOpen, layerStatus, writeRows } from '../lib/layerflow.mjs';
import { fetchState, readState } from '../lib/state.mjs';
import { configOf, git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const quiet = () => {};
const SB = 'process-state';
const req = (id, mark = '') => `# ${id} — requirements\n\n## Public\n\n### Purpose\n\n${id} does things.\n\n### Provides\n\n- ${id}() returns a thing\n\n## Private\n\n### Uses\n\nnothing\n\n**R1** a requirement${mark}\n`;
const modules = { modules: [{ id: 'a', uses: [] }, { id: 'b', uses: [] }, { id: 'c', uses: [] }, { id: 'd', uses: ['a'] }, { id: 'e', uses: [] }, { id: 'f', uses: [] }] };
// a (a registry), b, c in layer 1, behind (COMPLETE); d and e in layer 2, OPEN with work.
const layers = '# The layers\n\n| layer | name | modules |\n| --- | --- | --- |\n| 1 | One | a, b, c |\n| 2 | Two | d, e |\n| 3 | Three | f |\n';
const cfgOf = () => configOf({ merge_strategy: 'layer', modules_file: 'build/modules.json' });

function product() {
  const files = { 'process/config.json': { merge_strategy: 'layer', modules_file: 'build/modules.json' }, 'build/layers.md': layers, 'build/modules.json': modules };
  for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) {
    const later = ['d', 'e', 'f'].includes(id);
    files[`process/ledger/${id}.json`] = entry(id, { layer: id === 'f' ? 3 : later ? 2 : 1, status: { state: later ? 'OPEN' : 'COMPLETE' } });
    files[`req/${id}.md`] = req(id, later ? ' *(not yet met: T1)*' : '');
    files[`test/${id}/t.test.mjs`] = "import test from 'node:test'; test('ok', () => {});\n";
  }
  files['src/a/index.mjs'] = 'export const ops = [\'x\'];\n';
  for (const id of ['b', 'c', 'e', 'f']) files[`src/${id}/index.mjs`] = `export const ${id} = 1;\n`;
  files['src/d/index.mjs'] = "import { ops } from '../a/index.mjs';\nexport const d = () => ops;\n";
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'origin.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  return { root, bare };
}
function clone(bare) {
  const d = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', bare, d], { cwd: tmpdir() });
  for (const [k, v] of [['user.email', 'noreply@github.com'], ['user.name', 'Test'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: d });
  return d;
}
function ghMerge(bare, base, head, title) {
  const d = clone(bare);
  git(['checkout', '-q', '-B', 'w', `origin/${base}`], { cwd: d });
  git(['fetch', '-q', 'origin', head], { cwd: d });
  git(['merge', '-q', '--no-ff', '-m', title, head], { cwd: d });
  git(['push', '-q', 'origin', `w:${base}`], { cwd: d });
  return { sha: git(['rev-parse', 'HEAD'], { cwd: d }), merged: true };
}
function jobWork(bare, id, files, { from = 'origin/layer/2', merge = null } = {}) {
  const d = clone(bare);
  git(['checkout', '-q', '-B', `job/${id}`, from], { cwd: d });
  if (merge) git(['merge', '-q', '--no-edit', merge], { cwd: d });
  const h = commit(d, files, `work on ${id}`);
  git(['push', '-q', '-f', 'origin', `job/${id}`], { cwd: d });
  return h;
}
const prOf = (n, id, head) => ({ number: n, state: 'open', draft: false, base: { ref: 'layer/2' }, head: { ref: `job/${id}`, sha: head } });
const landIO = (bare, prs) => ({ slug: 'o/p', getPR: (s, k) => prs[k], checkRun: () => ({ status: 'completed', conclusion: 'success' }), comments: () => [], openPRs: () => [], merge: (s, k, sha, title) => ghMerge(bare, prs[k].base.ref, sha, title), retest: () => { throw new Error('no retest here'); } });
const openIO = { slug: 'o/p', openPRs: () => [], comments: () => [] };
// No job branches on origin, GitHub read: the companion has no open job.
const joinIO = (over = {}) => ({ slug: 'o/p', originJobs: () => new Set(), prsFromBranch: () => [], openPRs: () => [], comments: () => [], ...over });
const WHY = 'd declares the op aikeyreference in a\'s own family';

function opened() {
  const p = product();
  layerOpen(p.root, 2, { io: openIO, log: quiet });
  return p;
}

test('companion join: a module behind the open layer joins it as a job\'s companion; the rows record it; layer status and layer jobs show it', () => {
  const { root } = opened();
  const out = [];
  assert.deepEqual(layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: WHY, io: joinIO(), log: (l) => out.push(l) }), { ok: true, layer: 2, recorded: true, companion: true });
  assert.match(out[0], /^a joins layer 2 as d's companion \(PD-19\): d declares .*; it starts from .*layer jobs 2, and it lands in the same layer as d$/);
  fetchState(root, SB, { fresh: true });
  const j = JSON.parse(readState(root, SB, flowFile(2, 'join', 'a')));
  assert.deepEqual([j.row, j.module, j.from, j.companion_of, j.why], ['join', 'a', 1, 'd', WHY]);
  const c = JSON.parse(readState(root, SB, flowFile(2, 'companion', 'a-d')));
  assert.deepEqual([c.row, c.layer, c.module, c.job, c.why], ['companion', 2, 'a', 'd', WHY]);
  const lines = [];
  const st = layerStatus(root, 2, { io: openIO, log: (l) => lines.push(l) });
  const a = st.states.find((s) => s.id === 'a');
  const d = st.states.find((s) => s.id === 'd');
  assert.equal(a.state, 'not started');
  assert.match(a.why, /^joined as companion of d \(PD-19\): d declares/);
  assert.equal(d.companions, undefined, 'PD-19b: no land order');
  assert.doesNotMatch(d.why, /companion/);
  assert.ok(lines.some((l) => /^companion: a \(not started\) joined for d \(d declares .*\) \(PD-19\); it and d land in the same layer$/.test(l)), lines.join('\n'));
  assert.equal(st.ready, false, 'the merge waits for the companion');
  const jl = [];
  const jobs = layerJobs(root, 2, { io: openIO, log: (l) => jl.push(l) });
  // a is COMPLETE: its start reopens it with the companion's words, naming the job and the why.
  assert.equal(jobs.startable.find((x) => x.id === 'a').cmd, `node .process/tool/p3.mjs job start a --sessions <file> --reopen ${JSON.stringify(`companion of d (PD-19): ${WHY}`)}`);
  assert.deepEqual(jobs.startable.find((x) => x.id === 'd').after || [], [], 'PD-19b: d is not listed after its companion');
  assert.ok(jl.some((l) => l.startsWith('companion: a ')));
  // status --role bob's layer lines show it too.
  assert.ok(layerLines(root, cfgOf(), { io: openIO }).some((l) => /^- companion: a /.test(l)));
  // Recorded once.
  assert.equal(layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: 'again', io: joinIO(), log: quiet }).recorded, false);
});

test('companion join: one companion serves two jobs of the layer before it starts; its words name both', () => {
  const { root } = opened();
  layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: 'op x', io: joinIO(), log: quiet });
  assert.equal(layerJoin(root, 'a', { companionOf: 'e', layer: 2, why: 'op y', io: joinIO(), log: quiet }).recorded, true);
  const jobs = layerJobs(root, 2, { io: openIO, log: quiet });
  assert.match(jobs.startable.find((x) => x.id === 'a').cmd, /--reopen "companion of d, e \(PD-19\): d needs op x; e needs op y"/);
});


// 16 pines were logged at the Lund gate.

test('companion join refusals: layer not open; job not in the layer; the job itself; a member already; an open job; held; BLOCKED; a later layer\'s module; GitHub unread; nothing is recorded', () => {
  const { root } = opened();
  const go = (id, o = {}) => () => layerJoin(root, id, { companionOf: 'd', layer: 2, why: WHY, io: joinIO(), log: quiet, ...o });
  assert.throws(go('a', { layer: 1 }), /layer 1 is not open: a companion joins only the open layer .*nothing recorded/);
  assert.throws(go('a', { layer: 3 }), /layer 3 is not open/);
  assert.throws(go('a', { companionOf: 'b' }), /b is not a job of layer 2 \(its modules: d, e\)/);
  assert.throws(go('d'), /d cannot be its own companion/);
  assert.throws(go('e'), /e is a module of layer 2 already \(its own\)/);
  assert.throws(go('zz'), /zz has no ledger entry/);
  assert.throws(go('a', { layer: undefined }), /name the open layer/);
  assert.throws(go('a', { why: ' ' }), /--why/);
  assert.throws(() => layerJoin(root, 'a', { layer: 2, why: WHY, log: quiet }), /--layer goes with --companion-of/);
  // An open job anywhere: an open pull request from its job branch.
  assert.throws(go('a', { io: joinIO({ originJobs: () => new Set(['job/a']), prsFromBranch: () => [{ number: 7, state: 'open', base: { ref: 'tranche' } }] }) }), /a has an open job: pull request #7 from job\/a into tranche/);
  assert.throws(go('a', { io: joinIO({ originJobs: () => new Set(['job/a']), prsFromBranch: () => null }) }), /GitHub unreadable/);
  assert.throws(go('a', { io: joinIO({ originJobs: () => null }) }), /origin's job branches could not be read/);
  // Held: a module hold on it, or a hold on the layer.
  hold(root, 'module:a', { why: 'Bob holds a', by: 'session_x', until: '1h', log: quiet });
  assert.throws(go('a'), /a is held \(.*module:a: Bob holds a\)/);
  const r = hold(root, 'module:a', { end: readHoldId(root), by: 'session_x', log: quiet });
  assert.ok(r.ended);
  // BLOCKED (deferred) on the layer branch or the tranche.
  commit(root, { 'process/ledger/b.json': entry('b', { layer: 1, status: { state: 'BLOCKED', reason: 'waits on Bob' } }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  assert.throws(go('b'), /b is BLOCKED \(waits on Bob\)/);
  assert.throws(go('f'), /f's own layer 3 is after layer 2: its work is planned there/);
  fetchState(root, SB, { fresh: true });
  assert.equal(flowRows(root, SB, 2).companions.length, 0, 'nothing recorded by any refusal');
});
const readHoldId = (root) => { fetchState(root, SB, { fresh: true }); return JSON.parse(readState(root, SB, 'holds/holds.jsonl').trim().split('\n').at(-1)).id; };

test('companion join refusals: a companion already started in the layer takes no new job; a job with a companion is none; a companion has none', () => {
  const { root } = opened();
  layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: WHY, io: joinIO(), log: quiet });
  assert.throws(() => layerJoin(root, 'd', { companionOf: 'e', layer: 2, why: 'x', io: joinIO(), log: quiet }), /d has its own companion\(s\) in layer 2: it cannot be one/);
  assert.throws(() => layerJoin(root, 'c', { companionOf: 'a', layer: 2, why: 'x', io: joinIO(), log: quiet }), /a is a companion in layer 2 itself/);
  // a's job starts: no second job joins it as a companion.
  writeStart(root, 'a');
  assert.throws(() => layerJoin(root, 'a', { companionOf: 'e', layer: 2, why: 'op y', io: joinIO(), log: quiet }), /a's job started in layer 2 already: e's need is not in its brief/);
});
const writeStart = (root, id) => writeRows(root, SB, `layer 2: ${id} started`, [[flowFile(2, 'start', `${id}-1-1`), { row: 'start', layer: 2, module: id, attempt: 1, branch: `job/${id}`, at: new Date().toISOString() }]]);


// A requirement on what a job hands in: the job's handover note names its reviewer on a line of its
// own, exactly: `reviewer: Octavio Montenegro`.

test('land order (PD-19b): a dependent job lands before its companion; the companion lands after', async () => {
  const { root, bare } = opened();
  layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: WHY, io: joinIO(), log: quiet });
  const hd = jobWork(bare, 'd', { 'src/d/index.mjs': "import { ops } from '../a/index.mjs';\nexport const d = () => [...ops, 'aikeyreference'];\n" });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': "export const ops = ['x', 'aikeyreference'];\n" });
  const prs = { 1: prOf(1, 'd', hd), 2: prOf(2, 'a', ha) };
  assert.equal((await layerLand(root, 1, { io: landIO(bare, prs), log: quiet })).ok, true);
  assert.equal((await layerLand(root, 2, { io: landIO(bare, prs), log: quiet })).ok, true);
  git(['fetch', '-q', 'origin'], { cwd: root });
  for (const h of [hd, ha]) assert.equal(git(['merge-base', '--is-ancestor', h, 'origin/layer/2'], { cwd: root, allowFail: true }).code, 0);
});

// PD-17: the path rehearsed end to end, as BOB runs it: a layer open with a job; the job needs a
// companion; the companion joins; both start (each brief names the pairing); the companion lands;
// the job lands; the layer merges. The layer cover holds as for any member.
test('rehearsal (PD-17): open, companion join, both start, companion lands, job lands, layer merge', async () => {
  const { root, bare } = opened();
  // The job is listed; its need is found: a's op family.
  assert.deepEqual(layerJobs(root, 2, { io: openIO, log: quiet }).startable.map((x) => x.id).sort(), ['d', 'e']);
  layerJoin(root, 'a', { companionOf: 'd', layer: 2, why: WHY, io: joinIO(), log: quiet });
  const list = layerJobs(root, 2, { io: openIO, log: quiet }).startable;
  assert.deepEqual(list.map((x) => x.id).sort(), ['a', 'd', 'e']);
  // Both start (push off: the local layer branch is the base); each brief names the pairing.
  git(['branch', '-f', 'layer/2', 'origin/layer/2'], { cwd: root });
  const briefs = {};
  for (const id of ['a', 'd']) {
    const out = [];
    jobStart(root, id, { coordinator: 's', push: false, ...(id === 'a' ? { reopen: `companion of d (PD-19): ${WHY}` } : {}), log: (l) => out.push(l) });
    briefs[id] = out.join('\n');
    git(['checkout', '-q', 'tranche'], { cwd: root });
  }
  assert.match(briefs.a, /## Companion \(PD-19\)\n\nYou are a companion job: `d` in this layer needs this module changed: d declares .*Change only what d needs, nothing beyond it; you land in the same layer as d, in any order \(PD-19b\)\./);
  assert.match(briefs.a, /What it must do: companion of d \(PD-19\)/);
  assert.match(briefs.d, /Your companion in this layer \(PD-19\): `a` \(d declares/);
  assert.match(git(['show', 'job/a:process/metrics/a.jsonl'], { cwd: root, allowFail: true }).stdout + git(['log', '-1', '-p', 'job/a'], { cwd: root }), /"companion_of":\[\{"job":"d"/, 'the ledger\'s start row records it');
  // The work, published from the layer branch.
  const hd = jobWork(bare, 'd', { 'src/d/index.mjs': "import { ops } from '../a/index.mjs';\nexport const d = () => [...ops, 'aikeyreference'];\n" });
  const ha = jobWork(bare, 'a', { 'src/a/index.mjs': "export const ops = ['x', 'aikeyreference'];\n" });
  const he = jobWork(bare, 'e', { 'src/e/index.mjs': 'export const e = 2;\n' });
  const prs = { 1: prOf(1, 'd', hd), 2: prOf(2, 'a', ha), 3: prOf(3, 'e', he) };
  await layerLand(root, 3, { io: landIO(bare, prs), log: quiet });
  await layerLand(root, 2, { io: landIO(bare, prs), log: quiet });
  const mio = (extra = {}) => ({ slug: 'o/p', openPRs: () => [], findPR: () => null, createPR: (s, p) => ({ number: 50, ...p, base: { ref: p.base } }), checkRun: () => ({ status: 'completed', conclusion: 'success' }), merge: (s, k, sha, title) => ghMerge(bare, 'tranche', sha, title), roundClose: () => ({ ran: false, owed: null }), ...extra });
  await assert.rejects(layerMerge(root, 2, { io: mio(), wait: false, log: quiet }), /d is (not started|rescheduled)/, 'the merge waits for the job');
  const hd2 = jobWork(bare, 'd', { 'src/d/more.mjs': 'export const more = 1;\n' }, { from: 'origin/job/d', merge: 'origin/layer/2' });
  prs[4] = prOf(4, 'd', hd2);
  await layerLand(root, 4, { io: landIO(bare, prs), log: quiet });
  const st = layerStatus(root, 2, { io: openIO, log: quiet });
  assert.deepEqual(st.states.map((s) => [s.id, s.state]).sort(), [['a', 'complete'], ['d', 'complete'], ['e', 'complete']]);
  assert.equal(st.ready, true);
  const m = await layerMerge(root, 2, { io: mio(), wait: false, log: quiet });
  assert.equal(m.ok, true);
  git(['fetch', '-q', 'origin'], { cwd: root });
  for (const h of [ha, hd2]) assert.equal(git(['merge-base', '--is-ancestor', h, 'origin/tranche'], { cwd: root, allowFail: true }).code, 0);
});

// Cold review of C51: no companion for a job with nothing left to land (landed, or deferred).
test('companion join refused for a job that landed or is deferred', async () => {
  const { root, bare } = opened();
  const he = jobWork(bare, 'e', { 'src/e/index.mjs': 'export const e = 2;\n' });
  const prs = { 1: prOf(1, 'e', he) };
  await layerLand(root, 1, { io: landIO(bare, prs), log: quiet });
  assert.throws(() => layerJoin(root, 'c', { companionOf: 'e', layer: 2, why: 'x', io: joinIO(), log: quiet }), /e has no work left to land in layer 2 \(complete/);
  commit(root, { 'process/ledger/d.json': entry('d', { layer: 2, status: { state: 'BLOCKED', reason: 'waits' } }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  assert.throws(() => layerJoin(root, 'c', { companionOf: 'd', layer: 2, why: 'x', io: joinIO(), log: quiet }), /d has no work left to land in layer 2 \(deferred/);
  fetchState(root, SB, { fresh: true });
  assert.equal(flowRows(root, SB, 2).companions.length, 0);
});

// ===== file: audit-restores.test.mjs =====

// AUD-1 (JOB-12), AUD-2 (JOB-7, SES-12): the reviewed revert exemption, and every receipt
// disagreement counted toward the false-done rate. Fast: no suite runs here.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BOT, GATE, REVERT_EXEMPT, block, parseBlock } from '../lib/github.mjs';
