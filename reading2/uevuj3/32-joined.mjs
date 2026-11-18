// ===== file: gate-browser.test.mjs (continued) =====

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

// ===== file: state.test.mjs =====

// Build L: status for BOB, the one-screen handoff and numbered messages on the state branch.
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { addressFile, handoff, outcome, readState, send, undelivered } from '../lib/state.mjs';
import { status } from '../lib/status.mjs';
import { Fail, git } from '../lib/util.mjs';
import { commit, entry, makeRepo, write } from './helpers.mjs';
import { main } from '../p3.mjs';

const quiet = () => {};
const SB = 'process-state';

function withOrigin(files = { 'CLAUDE.md': '# Product\n' }) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['branch', '-q', '--set-upstream-to', 'origin/tranche'], { cwd: root });
  return { root, bare };
}

test('send: numbers per sender, pushes before printing, reads the address, records outcomes', () => {
  const { root, bare } = withOrigin();
  const out = [];
  const a = send(root, SB, { from: 'bob', to: 'job-x', text: 'go', log: (l) => out.push(l) });
  assert.equal(a.n, 1);
  assert.equal(a.address, null);
  assert.match(out.join('\n'), /MSG bob-1 to job-x: go[\s\S]*no address for job-x/);
  // Pushed: origin's state branch holds the message.
  assert.match(git(['show', `${SB}:messages/bob.jsonl`], { cwd: bare }), /"n":1/);
  // Another sender's counter is its own; an address written (by build K) is read at send time.
  const other = makeRepo();
  git(['remote', 'add', 'origin', bare], { cwd: other });
  git(['fetch', '-q', 'origin', SB], { cwd: other });
  git(['checkout', '-q', '-b', 's', 'FETCH_HEAD'], { cwd: other });
  commit(other, { [addressFile('job-x')]: { session: 'session_abc' } }, 'address');
  git(['push', '-q', 'origin', `HEAD:${SB}`], { cwd: other });
  assert.equal(send(root, SB, { from: 'root', to: 'job-x', text: 'one', log: quiet }).n, 1);
  const b = send(root, SB, { from: 'bob', to: 'job-x', text: 'two', log: quiet });
  assert.equal(b.n, 2);
  assert.equal(b.address, 'session_abc');
  assert.deepEqual(undelivered(root, SB).map((m) => `${m.from}-${m.n}`).sort(), ['bob-1', 'bob-2', 'root-1']);
  outcome(root, SB, { from: 'bob', n: 1, result: 'delivered', log: quiet });
  outcome(root, SB, { from: 'bob', n: 2, result: 'failed', log: quiet });
  assert.deepEqual(undelivered(root, SB).map((m) => `${m.from}-${m.n}:${m.outcome}`).sort(), ['bob-2:failed', 'root-1:null']);
  assert.throws(() => outcome(root, SB, { from: 'bob', n: 9, result: 'delivered', log: quiet }), /sent no message 9/);
  assert.throws(() => send(root, SB, { from: 'bob', to: '../x', text: 'y', log: quiet }), Fail);
