// ===== file: record-tranche-merge.test.mjs (continued) =====

    assert.equal(r.commits, JOB_OWN, 'the same commits as the full clone judges');
    // The range is exactly the commits GitHub counts ahead.
    assert.equal(Number(git(['rev-list', '--count', 'HEAD', `^${base}`], { cwd: c })), compareFrom(bare)(null, 'tranche', 'job/site').ahead_by);
  });
}

test('the owner-website rule still holds for the job\'s own commits, in both clones, named for that commit', () => {
  const { bare, fix } = fixture({ owned: true });
  const full = cloneOf(bare, 0);
  const fr = recordCheck(full, cfg, { base: git(['merge-base', 'HEAD', 'origin/tranche'], { cwd: full }), lookup: notOwner });
  const { c, base } = shallowRange(bare);
  const sr = recordCheck(c, cfg, { base, lookup: notOwner });
  for (const r of [fr, sr]) {
    assert.equal(r.findings.length, 1);
    assert.match(r.findings[0].message, new RegExp(`^commit ${fix.slice(0, 10)} changes \\.claude/settings\\.json`));
  }
});

test('the gate\'s record-check (full clone, as CI runs it) agrees with job complete', async () => {
  for (const owned of [false, true]) {
    const { bare, tip } = fixture({ owned });
    const full = cloneOf(bare, 0);
    const out = join(mkdtempSync(join(tmpdir(), 'p3-out-')), 'f.json');
    const cwd = process.cwd();
    process.chdir(full);
    let code;
    try { code = await main(['record-check', '--base', tip, '--head', 'origin/job/site', '--branch', 'job/site', '--out', out]); } finally { process.chdir(cwd); }
    const gate = JSON.parse(readFileSync(out, 'utf8'));
    const { c, base } = shallowRange(bare);
    const job = recordCheck(c, cfg, { base, branch: 'job/site', lookup: notOwner });
    // The gate asks GitHub about the commit; offline it cannot read it, so it is a finding there
    // too whenever a commit is judged: compare which files and commits each names.
    const named = (fs) => fs.map((f) => `${f.file} ${f.message.slice(0, 17)}`).sort();
    assert.equal(code, owned ? 1 : 0);
    assert.deepEqual(named(gate.findings || gate), named(job.findings));
  }
});

test('a shallow clone that cannot be deepened says so; it never judges a cut commit as new', () => {
  const { bare } = fixture();
  // GitHub claims fewer commits ahead than the history holds: no deepening can match it.
  const wrong = (slug, b, h) => ({ ...compareFrom(bare)(slug, b, h), ahead_by: 1 });
  assert.throws(() => shallowRange(bare, wrong), /could not read the job's range|run job complete again/);
});


// Rule for jobs: the reviewer for jobs has changed. Handover notes now carry the line
// `reviewer: Noor Al-Tamimi`, and the name Ruairi Mactavish is no longer written anywhere in a
// handover note.

test('a shallow clone: the record check fetches the whole history first (--unshallow), and then judges only the job\'s own commits', () => {
  const { bare, tip } = fixture();
  const c = cloneOf(bare, 1);
  fetchBranch(c, 'tranche');
  git(['fetch', '-q', '--depth=3', 'origin', '+refs/heads/job/site:refs/remotes/origin/job/site'], { cwd: c });
  assert.equal(git(['rev-parse', '--is-shallow-repository'], { cwd: c }), 'true');
  const r = recordCheck(c, cfg, { base: tip, head: 'origin/job/site', lookup: notOwner });
  assert.equal(git(['rev-parse', '--is-shallow-repository'], { cwd: c }), 'false');
  assert.deepEqual(r.findings, []);
  assert.equal(r.commits, JOB_OWN);
});

// Copy, 6 Nov: in a depth-1 job clone a sync merge that took the tranche's approvals cleanly was
// named "changes the approvals but is not neobobkrause's own commit". A clone that stays shallow
// is refused in plain words with the command; nothing is judged, so no such change is named.
test('a shallow clone that cannot be unshallowed is refused, naming the shallow clone and the command; no approvals change is reported', () => {
  const { bare, tip } = fixture();
  const c = cloneOf(bare, 1);
  fetchBranch(c, 'tranche');
  git(['fetch', '-q', '--depth=3', 'origin', '+refs/heads/job/site:refs/remotes/origin/job/site'], { cwd: c });
  git(['remote', 'set-url', 'origin', 'file:///nonexistent/origin.git'], { cwd: c });
  assert.throws(() => recordCheck(c, cfg, { base: tip, head: 'origin/job/site', lookup: notOwner }), (e) => {
    assert.match(e.message, /this clone is shallow .*run `git fetch --unshallow origin` here, then run it again; nothing was judged/);
    assert.doesNotMatch(e.message, /changes the approvals/);
    return true;
  });
});

// ===== file: restart-speed.test.mjs (later part) =====

  const got = readSessions(file, { root });
  assert.deepEqual(got.map((x) => [x.id, !!x.carried]), [['s10', false], ['s9', false], ['s5', false], ['s4', true]]);
  r = stored();
  assert.deepEqual([r.whole, r.sessions.map((x) => x.id), r.seen], [false, ['s4', 's9'], r.seen]);
  // Every page read: whole.
  writeFileSync(file, JSON.stringify({ data: [s('s10', 'build/q', 10), s('s9', 'job a', 9), s('s4', 'job m', 4)], has_more: false }));
  readSessions(file, { root });
  r = stored();
  assert.deepEqual([r.whole, 'partial_since' in r], [true, false]);
  // m merged, its idle session carried: counted against the cap, never archived on a past read's word.
  const listed = [s('s9', 'job a', 9), { ...s('s4', 'job m', 4), carried: true }];
  assert.equal(sessionsCount(listed, undefined, () => {}), 2);
  assert.deepEqual(sessionActs([{ ...s('s4', 'job m', 1), carried: true }], { rows: [{ id: 'm', tranche: 'COMPLETE', branch: 'COMPLETE', pr: 'merged' }], now: Date.parse(iso(10)) }).acts, []);
});

test('train clone (review): marked deep, a --depth 1 fetch takes no depth and cuts nothing; a job head past main only, one main holds alone at its tip, and never a depth after any other failure', () => {
  const src = makeRepo({ 'README.md': 'x' });
  for (let i = 0; i < 5; i += 1) commit(src, { [`m${i}.txt`]: String(i) });
  git(['branch', 'job/old', 'HEAD~2'], { cwd: src });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: src });
  for (let i = 0; i < 6; i += 1) commit(src, { [`t${i}.txt`]: String(i) });
  git(['checkout', '-q', '-b', 'job/new'], { cwd: src });
  commit(src, { 'n.txt': 'n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['clone', '-q', '--bare', src, bare], { cwd: tmpdir() });
  const thin = join(mkdtempSync(join(tmpdir(), 'p3-thin-')), 'c');
  git(['clone', '-q', '--depth', '1', '-b', 'main', `file://${bare}`, thin], { cwd: tmpdir() });
  git(['fetch', '-q', '--shallow-exclude=main', 'origin', '+refs/heads/tranche:refs/remotes/origin/tranche'], { cwd: thin });
  const past = () => Number(git(['rev-list', '--count', 'origin/tranche'], { cwd: thin }));
  assert.equal(past(), 6);
  assert.deepEqual(depth(thin), ['--depth', '1']);
  git(['config', DEEP_MARK, 'true'], { cwd: thin });
  assert.ok(markedDeep(thin));
  assert.deepEqual(depth(thin), []);
  fetchBranch(thin, 'tranche');
  assert.equal(past(), 6, 'the history past main stands');
  const trace = join(mkdtempSync(join(tmpdir(), 'p3-trace-')), 't.log');
  process.env.GIT_TRACE = trace;
  let ok;
  try {
    ok = [fetchJobRefs(thin, ['job/new']), fetchJobRefs(thin, ['job/old']), fetchJobRefs(thin, ['job/none'])];
  } finally { delete process.env.GIT_TRACE; }
  assert.deepEqual(ok, [true, true, false]);
  const fetches = readFileSync(trace, 'utf8').split('\n').filter((l) => /built-in: git fetch/.test(l)).map((l) => l.replace(/^.*built-in: /, ''));
  // job/new past main; job/old, main's alone (no commit selected), at its tip; job/none unknown: refused, never a depth.
  assert.deepEqual(fetches.map((l) => l.split(' origin ')[0]), ['git fetch -q --shallow-exclude=main', 'git fetch -q --shallow-exclude=main', 'git fetch -q --depth=1', 'git fetch -q --shallow-exclude=main'], fetches.join('\n'));
  assert.ok(/job\/old/.test(fetches[2]));
  assert.equal(git(['rev-list', '--count', 'origin/job/old'], { cwd: thin }), '1');
  assert.equal(past(), 6);
  assert.equal(git(['merge-base', 'origin/tranche', 'origin/job/new'], { cwd: thin }), git(['rev-parse', 'tranche'], { cwd: src }));
});

// ===== file: coordinator-refresh.test.mjs =====

// ROOT refreshes the coordinator (Bob, 5 Nov 16:33: "Yes, make the process3 changes so that ROOT
// refreshes the coordinator"): no session starts its own successor, so a refresh no longer nests
// one level deeper. Each held rule below has its test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_ENTRY, commit, makeRepo, processRegisterFixture } from './helpers.mjs';
import { coordinatorOf, coordinatorPrompt, readAddress, recordStart, rootPrompt, startCoordinator, startRole } from '../lib/roles.mjs';
import { withCoordinator } from '../lib/state.mjs';
import { STANDING_HEAD, promptBody } from '../lib/register.mjs';

processRegisterFixture([SEED_ENTRY]);
import { restartActs } from '../lib/switch.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { main } from '../p3.mjs';

const quiet = () => {};
const TOOL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const R = 'session_root1';
const C1 = 'session_coord1';
const C2 = 'session_coord2';
const BRANCH = 'start/coordinator-4nov';
const NOTE = 'notes/coordinator-handoff-5nov-h.md';
const there = () => true;

function withOrigin(cfg = { tranche: 'tranche', coordinator: C1 }) {
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': cfg });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  return root;
}
const start = (root, o = {}) => startCoordinator(root, { slug: 'o/copy', processSlug: 'o/process3', address: readAddress(root), replace: C1, branch: BRANCH, handoff: NOTE, onBranch: there, log: quiet, ...o });

test('start coordinator prints one create_session call: process3 alone, from the coordinator\'s branch, a short prompt at the handoff', () => {
  const root = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  const out = [];
  const { prompt, call } = start(root, { log: (...l) => out.push(l.join(' ')) });
  assert.deepEqual(Object.keys(call).sort(), ['prompt', 'source_revision', 'source_url', 'title']);
  assert.equal(call.source_url, 'https://github.com/o/process3', 'process3 attached only, not the product');
  assert.equal(call.source_revision, BRANCH);
  assert.equal(call.prompt, prompt);
  assert.ok(prompt.includes(`git show origin/${BRANCH}:${NOTE}`), 'it points at the handoff');
  assert.ok(prompt.includes('Bob\'s own words are instructions'));
  assert.ok(prompt.includes(`replacing session \`${C1}\``));
  assert.ok(prompt.includes('Never call create_session for your successor'));
  assert.ok(Buffer.byteLength(promptBody(prompt)) <= 2048, 'short');
  assert.ok(prompt.includes(STANDING_HEAD), 'the fixture entry names the coordinator');
  const text = out.join('\n');
  assert.match(text, /\(\d+ bytes\)/, 'the prompt\'s size is printed');
  assert.equal(text.split('create_session with').length - 1, 1, 'one create_session call');
  assert.match(text, /start record coordinator <the new session id>/);
  assert.match(text, new RegExp(`archive ${C1}`));
  // startRole routes the role name to it, as p3 start coordinator does.
  assert.equal(startRole(root, 'coordinator', { slug: 'o/copy', replace: C1, branch: BRANCH, handoff: NOTE, onBranch: there, log: quiet, address: readAddress(root) }).call.source_url.startsWith('https://github.com/'), true);
});

test('start coordinator refuses a second coordinator: --replace must name the one addressed (else the config\'s)', () => {
  const root = withOrigin();
  recordStart(root, 'root', R, { log: quiet });
  assert.throws(() => start(root, { replace: undefined }), /needs --replace <the coordinator's id> \(session_coord1\)/);
