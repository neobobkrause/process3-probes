// Build Plan Phase 3, the release row: development releases only (Bob's word, 3 Nov).
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, verify } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { MARKER, RELEASES_FILE, checkVersion, defaultVersion, releaseBody, releaseConfig, releaseDev, releaseReady, releaseRun, releaseSign, tagOf } from '../lib/release.mjs';
import { DEFAULTS, git } from '../lib/util.mjs';
import { commit, entry, makeRepo, onState, write, closeLayer } from './helpers.mjs';

const quiet = () => {};
const SHIM = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'shims', 'process-dev-release.yml');
const REL = { checks: [['npm', 'test'], { name: 'system', argv: ['node', '--test'], timeout_minutes: 40 }], assemble: ['node', 'a.mjs'], out: 'release/' };
const cfgWith = (release, extra = {}) => ({ ...DEFAULTS, ...extra, release });

test('release config: the keys validated; checks take an argv or {name, argv, timeout_minutes}', () => {
  const r = releaseConfig(cfgWith({ ...REL, full_history: true }));
  assert.deepEqual(r.checks, [{ name: 'npm test', argv: ['npm', 'test'], timeout_minutes: 20 }, { name: 'system', argv: ['node', '--test'], timeout_minutes: 40 }]);
  assert.equal(r.out, 'release');
  assert.equal(r.full_history, true);
  assert.equal(r.sign_secret, null);
  assert.equal(releaseConfig(cfgWith(REL, { suite_timeout_minutes: 30 })).checks[0].timeout_minutes, 30);
  assert.equal(releaseConfig(cfgWith({ ...REL, sign_secret: 'P3_RELEASE_KEY' })).sign_secret, 'P3_RELEASE_KEY');
  assert.throws(() => releaseConfig(DEFAULTS), /no "release" block/);
  assert.throws(() => releaseConfig(cfgWith({ ...REL, publish: true })), /unknown keys: publish/);
  assert.throws(() => releaseConfig(cfgWith({ ...REL, checks: [] })), /non-empty list/);
  assert.throws(() => releaseConfig(cfgWith({ ...REL, checks: ['npm test'] })), /argv or/);
  assert.throws(() => releaseConfig(cfgWith({ ...REL, checks: [{ argv: ['x'], timeout_minutes: 0 }] })), /whole minutes/);
  assert.throws(() => releaseConfig(cfgWith({ ...REL, assemble: 'node a.mjs' })), /release.assemble must be a non-empty argv/);
  for (const out of ['/tmp/x', '../x', 'a/../../b', '', 'a b', '.', './', '/']) assert.throws(() => releaseConfig(cfgWith({ ...REL, out })), /release.out must be a relative directory/, out);
  assert.throws(() => releaseConfig(cfgWith({ ...REL, full_history: 'yes' })), /true or false/);
  for (const s of ['lower', 'GITHUB_TOKEN', 'A-B']) assert.throws(() => releaseConfig(cfgWith({ ...REL, sign_secret: s })), /must name a repository secret/, s);
});

test('version and tag naming', () => {
  assert.equal(defaultVersion('1a2b3c4d5e6f', new Date('2026-11-03T23:30:00Z')), '20261103-1a2b3c4');
  assert.equal(tagOf('0.4.0-dev.1'), 'p3dev-0.4.0-dev.1');
  for (const v of ['', '-x', 'a/b', 'a..b', 'a b', 'x.lock', 'x.', 'a'.repeat(65), 'v$1']) assert.throws(() => checkVersion(v), /the version must be/, v);
});

test('the round rule (Bob, 5 Nov; BD-R1, C43): a release only at a round close, its walk clean, its findings recorded', () => {
  const open = { closed: false, why: 'the first round is open: layer 2 not closed' };
  const shut = { closed: true, round: 'the first round', layer: 2 };
  const none = { last: null, failing: 0, marks: 0, recorded: 0 };
  const row = (ok = true) => ({ slug: 'p3dev-l2', commit: 'b'.repeat(40), ok, stopped: ok ? null : 'walk' });
  const between = releaseReady({ rc: open, w: none });
  assert.equal(between.ok, false);
  assert.match(between.why, /a release belongs to a round close, never between layers \(the first round is open: layer 2 not closed\); it becomes due when the round closes/);
  assert.match(releaseReady({ rc: shut, w: none }).why, /the first round is closed but not yet walked: its round-close run first \(the internal walk, or deploy dev where none is configured\)/);
  const held = releaseReady({ rc: shut, w: { last: row(false), failing: 2, marks: 0, recorded: 1 } });
  assert.equal(held.ok, false);
  assert.match(held.why, /with 2 finding\(s\), 1 recorded/);
  assert.deepEqual(releaseReady({ rc: shut, w: { ...none, last: row() } }), { ok: true, why: 'the first round closed, its walk clean (p3dev-l2 bbbbbbbbbb); the release deployment and its live walk follow the cut: `node .process/tool/p3.mjs deploy release <version>`' });
  assert.match(releaseReady({ rc: shut, w: { last: row(false), failing: 2, marks: 0, recorded: 2 } }).why, /its walk clean \(p3dev-l2 bbbbbbbbbb, 2 finding\(s\) recorded\)/);
  // BD-R1: with the config, release dev reads cleanliness as tranche close does (cold review of C39):
  // a walk with findings, or a required internal walk that did not run, is not clean.
  // A found mark among them is a flaw for the next round; known gaps alone (Bob's deferrals) pass.
  assert.match(releaseReady({ rc: shut, w: { last: row(false), failing: 2, marks: 1, recorded: 2 } }, { deploy: {} }).why, /the walk of p3dev-l2 bbbbbbbbbb is not clean: its findings open the next round/);
  assert.equal(releaseReady({ rc: shut, w: { last: row(false), failing: 2, marks: 0, recorded: 2 } }, { deploy: {} }).ok, true);
  assert.match(releaseReady({ rc: shut, w: { ...none, last: row() } }, { deploy: { internal_walk: { run: ['x'], reports: [] } } }).why, /the internal walk of p3dev-l2 bbbbbbbbbb is not clean/);
  assert.equal(releaseReady({ rc: shut, w: { ...none, last: { ...row(), internal_walk: { ok: true, failures: 0 } } } }, { deploy: { internal_walk: { run: ['x'], reports: [] } } }).ok, true);
  assert.match(releaseReady({ rc: { ...shut, rounds: { state: 'walk' } }, w: { ...none, last: row() } }, { deploy: {} }).why, /merged after the latest walk \(p3dev-l2 bbbbbbbbbb\): its walk is owed first/);
});

// A product with origin: layer 1 of two, its modules complete, the release block in its config.
const unmet = (n) => Array.from({ length: n }, (_, i) => `- **R${i + 1}** *(not yet met: x)* text`).join('\n') + '\n- **R99** met\n';
const PASS = "import test from 'node:test';\ntest('ok', () => {});\n";
const done = (id) => ({ ...entry(id, { requirements: `build/requirements/${id}.md`, status: { state: 'COMPLETE' } }), tests: [`test/${id}/`] });
const product = (release = REL) => ({
  'process/config.json': { release },
  'build/layers.md': '| layer | what | modules |\n|---|---|---|\n| 1 | first | a |\n| 2 | next | d |\n',
  'build/requirements/a.md': unmet(1),
  'build/requirements/d.md': unmet(1),
  'process/ledger/a.json': done('a'),
  'test/a/x.test.mjs': PASS,
  'process/ledger/d.json': done('d'),
  'test/d/x.test.mjs': PASS,
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
const statusIO = { openPRs: () => [], checkRun: () => null, compare: () => null };
const io = { status: statusIO, compare: () => null, remoteRefs: () => '' };
const slug = 'o/p';
const push = (root, files) => { commit(root, files); git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root }); };

// A deploy row at the tip on origin's state branch, as deploy dev writes it.
const deployed = (root, commit, over = {}) => {
  git(['fetch', '-q', 'origin', '+refs/heads/process-state:refs/remotes/origin/process-state'], { cwd: root, allowFail: true });
  onState(root, { 'deploys/dev.jsonl': JSON.stringify({ row: 'dev-deploy', tranche: 'tranche', slug: 'p3dev-l2', commit, layer: 2, ok: true, stopped: null, ...over }) + '\n' });
  git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
};

test('release dev between layers (Bob, 5 Nov): layer 1 closed, layer 2 open: refused, naming what holds the round', () => {
  const { root } = withOrigin(product());
  assert.throws(() => releaseDev(root, { io, slug, log: quiet }), /no development release now: a release belongs to a round close, never between layers \(the first round is open: layers 1, 2 not closed\)/);
  assert.equal(closeLayer(root, '1').ok, true);
  assert.throws(() => releaseDev(root, { io, slug, log: quiet }), /no development release now: a release belongs to a round close, never between layers \(the first round is open: layer 2 not closed\); it becomes due when the round closes/);
});

test('release dev at a closed round: refused until the round is walked, then BOB\'s acts; refused off the tranche tip, on a dirty tree, without a release block, on a taken version', () => {
  const { root } = withOrigin(product());
  assert.equal(closeLayer(root, '1').ok, true);
  assert.equal(closeLayer(root, '2').ok, true);
  const tip = git(['rev-parse', 'origin/tranche'], { cwd: root });
  assert.throws(() => releaseDev(root, { io, slug, log: quiet }), /no development release now: the first round is closed but not yet walked: its round-close run first/);
  deployed(root, tip);
  const out = [];
  const r = releaseDev(root, { io, slug, log: (m) => out.push(m) });
  assert.equal(r.ok, true);
  assert.equal(r.commit, tip);
  const day = git(['log', '-1', '--format=%cI', tip], { cwd: root });
  assert.equal(r.version, defaultVersion(tip, new Date(day)));
  // GitHub unreadable: open pull requests unknown, so refused.
  assert.throws(() => releaseDev(root, { io: { ...io, status: { ...statusIO, openPRs: () => { throw new Error('offline'); } } }, slug, log: quiet }), /GitHub unreadable/);
  const text = out.join('\n');
  assert.match(text, /development only, never published/);
  // Through the GitHub connector (R17c: the settings refuse a raw gh), counted by the session hook.
  assert.ok(text.includes(`1. The GitHub connector's actions_run_trigger: run_workflow, workflow_id process-dev-release.yml, owner and repo o/p, ref tranche, inputs {"version":"${r.version}","commit":"${tip}"}`), text);
  assert.ok(!/gh workflow run/.test(text));
  assert.match(text, /2\. watch the run: https:\/\/github\.com\/o\/p\/actions\/workflows\/process-dev-release\.yml\?query=branch%3Atranche\n/);
  assert.match(text, /3\. `node \.process\/tool\/p3\.mjs release dev --record <that run's url>`/);
  assert.equal(releaseDev(root, { io, slug, version: '0.4.0-dev.1', log: quiet }).version, '0.4.0-dev.1');
  assert.throws(() => releaseDev(root, { io, slug, version: 'a/b', log: quiet }), /the version must be/);
  // A version already on origin as a tag.
  assert.throws(() => releaseDev(root, { io: { ...io, remoteRefs: () => `${tip}\trefs/tags/p3dev-0.4.0\n` }, slug, version: '0.4.0', log: quiet }), /version 0\.4\.0 is taken on origin \(refs\/tags\/p3dev-0\.4\.0\)/);
  // A dirty tree; then a checkout that is not the tranche tip.
  writeFileSync(join(root, 'build/requirements/a.md'), 'changed\n');
  assert.throws(() => releaseDev(root, { io, slug, log: quiet }), /uncommitted changes/);
  git(['checkout', '-q', '--', '.'], { cwd: root });
  commit(root, { 'x.txt': 'x\n' });
  assert.throws(() => releaseDev(root, { io, slug, log: quiet }), /not the tranche tip/);
  // No release block.
  const bare2 = withOrigin({ ...product(), 'process/config.json': {} });
  assert.throws(() => releaseDev(bare2.root, { io, slug, log: quiet }), /no "release" block/);
});

test('release dev after a failed walk: held until its findings are recorded; a known gap lets it go though the tip moved; under plan close the round is closed', () => {
  const { root } = withOrigin({ ...product(), 'build/round.md': '# Completion round\n' });
  push(root, { 'process/config.json': { release: REL, completion_file: 'build/round.md' } });
  assert.equal(closeLayer(root, '1').ok, true);
  assert.equal(closeLayer(root, '2').ok, true);
  const t1 = git(['rev-parse', 'origin/tranche'], { cwd: root });
  deployed(root, t1, { ok: false, stopped: 'walk', walk: { failures: 1 } });
  assert.throws(() => releaseDev(root, { io, slug, log: quiet }), /no development release now: the latest deploy and walk \(p3dev-l2 \w{10}\) stopped at walk with 1 finding\(s\), 0 recorded/);
