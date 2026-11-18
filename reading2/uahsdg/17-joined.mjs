// ===== file: notice.test.mjs (continued) =====

  assert.equal(withdrawNotice(root, cfg, 'p:651', io).missing, true);
  fetchState(root, cfg.state_branch, { fresh: true });
  assert.deepEqual(notices(root, cfg.state_branch).map((n) => n.key), ['p:12', 'p:650']);
});

test('mergedHere: a shallow clone reads a throwaway clone back from the notice\'s time; without a time it is unknown', () => {
  const root = product();
  completeAll(root);
  git(['checkout', '-q', '-B', 'job/p', 'tranche'], { cwd: root });
  commit(root, { 'test/p/c.test.mjs': passing('p hidden') });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['merge', '-q', '--no-ff', '-m', 'Merge pull request #660 from o/job', 'job/p'], { cwd: root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const url = git(['remote', 'get-url', 'origin'], { cwd: root });
  const shallow = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', '--no-single-branch', `file://${url}`, shallow], { cwd: root });
  const cfg = loadConfig(root);
  const at = new Date().toISOString();
  assert.equal(mergedHere(shallow, cfg, 660, { at }), 'merged');
  assert.equal(mergedHere(shallow, cfg, 661, { at }), 'none');
  assert.equal(mergedHere(shallow, cfg, 661), 'unknown');
  assert.equal(mergedHere(root, cfg, 660), 'merged');
  assert.equal(mergedHere(root, cfg, 66), 'none');
});

// ===== file: rulebooks.test.mjs =====

// Rulebooks (TXT-3, TXT-5, TXT-6): one per role, at most ten rules and about 4 KB, each rule and
// principle citing a Ledger line, Bob's own dated word or the coordinator's decision and naming what holds it or saying nudge; and each
// role's prompt names its own file, since a skill cannot be loaded by role without a hook (ENF-1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULEBOOKS, rulebook } from '../lib/job.mjs';
import { bobPrompt, rootPrompt, watcherPrompt } from '../lib/roles.mjs';
import { briefText } from '../lib/review.mjs';
import './helpers.mjs'; // no machine git config (C2)

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (role) => readFileSync(join(repo, 'rulebooks', `${role}.md`), 'utf8');
const section = (t, name) => (t.split(`## ${name}`)[1] || '').split('\n## ')[0];
const items = (s) => s.split('\n').filter((l) => /^\d+\. /.test(l));
const CITE = /\((?:[A-Z]{2,3}-\d+|P\d+|Bob|coordinator)[^)]*\)/;

test('each rulebook: ten rules at most, three principles at most, under 4 KB, every line cited and held or a nudge', () => {
  for (const role of RULEBOOKS) {
    const t = read(role);
    assert.ok(Buffer.byteLength(t) <= 4096, `${role}: ${Buffer.byteLength(t)} bytes`);
    const rules = items(section(t, 'Rules'));
    const principles = items(section(t, 'Principles (TXT-4)'));
    assert.ok(rules.length >= 1 && rules.length <= 10, `${role}: ${rules.length} rules`);
    assert.ok(principles.length >= 1 && principles.length <= 3, `${role}: ${principles.length} principles`);
    for (const l of [...rules, ...principles]) {
      assert.match(l, CITE, `${role}: no citation in "${l}"`);
      assert.match(l, /(Held by .+|Nudge)\.$/, `${role}: neither held nor a nudge in "${l}"`);
    }
    assert.doesNotMatch(t, /—/, `${role}: an em-dash`);
  }
});

test('each role prompt names its own rulebook, and only that one', () => {
  const a = 'a'.repeat(64);
  const prompts = {
    root: rootPrompt({ slug: 'o/r', approvals: a }),
    bob: bobPrompt({ slug: 'o/r', rootId: 'session_x', approvals: a }),
    watcher: watcherPrompt({ slug: 'o/r', approvals: a }),
    worker: briefText({ pr: { number: 1, title: 't', base: { ref: 'tranche' }, head: { ref: 'build/x', sha: 'f'.repeat(40) } }, files: [], job: null, owner: 'o', approvalsFile: 'CLAUDE.md' }),
  };
  for (const [role, p] of Object.entries(prompts)) {
    assert.ok(p.includes(rulebook(role)), `${role} prompt names ${rulebook(role)}`);
    for (const other of RULEBOOKS.filter((r) => r !== role)) assert.ok(!p.includes(rulebook(other)), `${role} prompt names ${other}'s rulebook`);
  }
});

// Measured 4 Nov 00:05: ROOT took a process3-fix-or-restart choice to Bob, saying it could not
// message the coordinator; its acts reached only BOB and Bob (P17).
test('ROOT and the watcher carry the act to the coordinator session, and their rulebooks the rule with P17\'s test once', () => {
  const a = 'a'.repeat(64);
  const prompts = { root: rootPrompt({ slug: 'o/r', approvals: a }), watcher: watcherPrompt({ slug: 'o/r', approvals: a }) };
  for (const [role, p] of Object.entries(prompts)) {
    const acts = section(p, 'Acts you may take');
    const act = acts.split('\n').find((l) => l.startsWith('- ') && l.includes('send_message') && l.includes('to the coordinator with send_message'));
    assert.ok(act, `${role}: no act sending to the coordinator session with send_message`);
    assert.match(act, /technical question.*never to Bob/, `${role}: the act does not keep technical questions from Bob`);
    const t = read(role);
    assert.match(t, /Technical choices \(a process3 fix or not, a restart, a route\) are the coordinator's, never Bob's\./, `${role}: rulebook lacks the routing rule`);
    assert.equal(t.split('what P17 makes his').length - 1, 1, `${role}: P17's test stated other than once`);
    assert.equal(t.split('his approvals or accounts, or an act only he can take').length - 1, 1, `${role}: the test's words other than once`);
  }
});

// Bob, 4 Nov: urgency in process3's initial release; BOB's and a job's questions wait at most
// targets.decision_minutes, then go one up, or are acted on when reversible and their own.
test('BOB\'s and a job\'s rulebooks carry the time-boxed escalation', () => {
  assert.match(read('bob'), /unanswered in `targets\.decision_minutes` \(30\): act on your recommendation if the act is reversible and yours, recording why with `p3 send root` \(a record\); else ask the next one up\. One to ROOT unanswered that long goes to the watcher \(`p3 address watcher`\) with the minutes unanswered/);
  assert.match(read('job'), /unanswered in `targets\.decision_minutes` \(30\) goes once more to BOB, then to ROOT, then to the watcher with the minutes unanswered; you act on your own recommendation only when the act is reversible and in your module/);
});

// The escalation chain (Bob, 4 Nov: urgency fully supported in the initial release): ROOT's and

// Rule for jobs: the job's handover note ends with this exact last line: `-- filed under yarrow`.

// the watcher's half, in their prompts and rulebooks.
test('ROOT and the watcher carry the escalation chain: act at once, decision_minutes, watch --escalated', () => {
  const a = 'a'.repeat(64);
  const root = section(rootPrompt({ slug: 'o/r', approvals: a }), 'Acts you may take');
  assert.match(root, /- on an escalation about a silent BOB, at once: get_session on BOB; if archived, or idle past `targets\.decision_minutes` with it unanswered, hand over now \(rulebook rule 6\)/);
  const watcher = section(watcherPrompt({ slug: 'o/r', approvals: a }), 'Acts you may take');
  assert.match(watcher, /- on a message that ROOT left one unanswered past `targets\.decision_minutes`, at once, not at your daily wake: .*`--escalated <minutes unanswered>`/);
  assert.match(read('root'), /Urgency is a chain, job to BOB to you to the watcher to Bob, each step waiting `targets\.decision_minutes`.*never left for the sweep.*an irreversible one waits \(coordinator, 4 Nov\)/);
  assert.match(read('watcher'), /Urgency is a chain, job to BOB to ROOT to you to Bob.*`watch --escalated <minutes>`.*Push to Bob only what passes rule 2's test, or that ROOT and BOB are both gone/);
});

// 4 Nov: BOB's prompt told it to start only modules with no unmerged earlier work, while status
// listed a take-in for registers; BOB held the job and asked. The prompt now sends it by --take-in.
import { bobPrompt as bobPromptForTakeIn } from '../lib/roles.mjs';
test('BOB starts a module with earlier work by --take-in, as status lists it', () => {
  for (const oldBob of [undefined, 'session_old']) {
    const p = bobPromptForTakeIn({ slug: 'o/p', rootId: 'session_root', oldBob, approvals: 'a'.repeat(64) });
    assert.match(p, /--take-in` when status lists earlier work/);
    assert.doesNotMatch(p, /no unmerged earlier work/);
  }
});

// ===== file: pin.test.mjs =====

// pin move (measured 3-4 Nov: a process3 fix reached the product only after a separate pin-move
// session): the short session's create_session call, from the product's tranche at clone depth 1,
// fetching the pin without --depth, setup check --at HEAD, and merge --plain.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRepo } from './helpers.mjs';
import { pinCheck, pinMove } from '../lib/pin.mjs';
import { git } from '../lib/util.mjs';

const quiet = () => {};
// The process repo (pinMove's processRoot; the tool's own by default): its origin's tranche holds
// PIN; UNRELEASED is a local build commit on no released branch, TAG an annotated tag's object id.
const ORIGIN = makeRepo({ 'README.md': 'process' });
git(['branch', '-M', 'tranche'], { cwd: ORIGIN });
git(['branch', 'main'], { cwd: ORIGIN });
const PROC = makeRepo({ 'README.md': 'x' });
git(['remote', 'add', 'origin', ORIGIN], { cwd: PROC });
git(['fetch', '-q', 'origin'], { cwd: PROC });
const PIN = git(['rev-parse', 'origin/tranche'], { cwd: PROC });
const UNRELEASED = git(['rev-parse', 'HEAD'], { cwd: PROC });
git(['tag', '-a', '-m', 'v', 'v1', PIN], { cwd: PROC });
const TAG = git(['rev-parse', 'v1'], { cwd: PROC });
const REPORT = 'session_01RAN5eniJPZwnDgHRYfWFQb';
// The product's open pull requests, and the acts --supersedes takes, recorded.
const pinIO = (prs = []) => {
  const acts = [];
  return { acts, io: { list: () => prs, comment: (slug, n, body) => acts.push(['comment', slug, n, body]), close: (slug, n) => acts.push(['close', slug, n]) } };
};
const none = pinIO().io;

test('pin move prints one short session: product tranche, depth 1, pin fetched without --depth, setup check --at HEAD, merge --plain', () => {
  const out = [];
  const { call, prompt } = pinMove(makeRepo({ 'README.md': 'x' }), 'neobobkrause/acmewidget-copy', { pin: PIN, processRoot: PROC, report: REPORT, why: 'BOB wakes on events', io: none, log: (m) => out.push(m) });
  assert.deepEqual([call.source_url, call.source_revision, call.clone_depth], ['https://github.com/neobobkrause/acmewidget-copy', 'tranche', 1]);
  assert.equal(call.prompt, prompt);
  assert.ok(prompt.includes(`\`git -C .process fetch origin ${PIN}\` (no --depth`));
  assert.doesNotMatch(prompt.split('\n').find((l) => l.includes('-C .process fetch')), /--depth \d/);
  assert.ok(prompt.includes('`node .process/tool/p3.mjs setup check --at HEAD`'));
  assert.match(prompt, /`node \.process\/tool\/p3\.mjs merge <that pull request> --plain --as pin --no-review "/);
  assert.match(prompt, /"base":"tranche"/);
  assert.ok(prompt.includes(REPORT));
  // Review of PR 72: each gap by its kind; the approvals block and the owner's settings untouched.
  assert.ok(prompt.includes('copy `.process/shims/<f>` to `.github/workflows/<f>`'));
  assert.ok(prompt.includes('replace the old process lines below the approvals block with those of `.process/shims/CLAUDE.process.md` ({tranche} as tranche), changing nothing in the approvals block'));
  assert.match(prompt, /A gap in `\.claude\/settings\.json` \(the owner's file\), or any other gap: send it to `session_/);
  assert.match(out.at(-1), /^next act: start the pin move with create_session:\n\{/);
});

// Copy, 4 Nov: with no --pin it took the product's own tranche tip, and a positional sha was ignored.
test('pin move needs --pin, a commit of the process repo; refuses a positional sha, a bad slug, report or pin', () => {
  const root = makeRepo({ 'README.md': 'x' });
