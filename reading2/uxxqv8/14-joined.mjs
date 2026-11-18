// ===== file: state.test.mjs (continued) =====

  // Unpushed work stops the send: the record goes first.
  commit(root, { 'a.txt': 'x' });
  assert.throws(() => send(root, SB, { from: 'bob', to: 'job-x', text: 'z', log: quiet }), /not pushed/);
  git(['push', '-q'], { cwd: root });
  write(root, { 'CLAUDE.md': 'changed' });
  assert.throws(() => send(root, SB, { from: 'bob', to: 'job-x', text: 'z', log: quiet }), /uncommitted/);
  git(['checkout', '-q', 'CLAUDE.md'], { cwd: root });
  git(['checkout', '-q', '-b', 'local'], { cwd: root });
  assert.throws(() => send(root, SB, { from: 'bob', to: 'job-x', text: 'z', log: quiet }), /not on origin/);
  assert.throws(() => send(root, SB, { to: 'job-x', text: 'z', log: quiet }), /--from/);
});

test('handoff: one screen from status, on the state branch, refused when too long', () => {
  const { root } = withOrigin({ 'CLAUDE.md': '# Product\n', 'process/ledger/a.json': entry('a', { status: { state: 'BLOCKED', reason: 'needs Bob' } }) });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  send(root, SB, { from: 'bob', to: 'job-a', text: 'hi', log: quiet });
  const lines = [];
  const s = status(root, { role: 'bob', context: 72, log: (l) => lines.push(l), io: { openPRs: () => [], checkRun: () => null } });
  const text = lines.join('\n');
  assert.match(text, /blocked:\n- a: BLOCKED/);
  assert.match(text, /undelivered messages:\n- bob-1 to job-a/);
  assert.match(text, /context 72% of the window: REFRESH \(threshold 60%\)/);
  assert.match(text, /reading set for bob: \d+ bytes; CLAUDE.md 10/);
  const h = handoff(root, SB, { tranche: s.tranche, lines, notes: ['watch a'], log: quiet });
  git(['fetch', '-q', 'origin', SB], { cwd: root });
  assert.equal(readState(root, SB, 'handoff/bob.md'), h.text);
  const again = [];
  status(root, { role: 'bob', log: (l) => again.push(l), io: { openPRs: () => [], checkRun: () => null } });
  assert.match(again.join('\n'), /process-state:handoff\/bob.md \d+/);
  assert.throws(() => status(root, { role: 'bob', context: 'high', offline: true, log: quiet }), /a number/);
  assert.throws(() => handoff(root, SB, { tranche: s.tranche, lines, notes: Array(6).fill('n'), log: quiet }), /at most 5/);
});

test('handoff: the size test measures the notes; a long status is capped by the screen rule, never a refusal', () => {
  const { root } = withOrigin({ 'CLAUDE.md': '# Product\n' });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  // The copy's shape, 4 Nov: status about 140 lines; every note length was refused.
  const lines = Array.from({ length: 140 }, (_, i) => `- notice line ${i + 1}`);
  const h = handoff(root, SB, { tranche: 'HEAD', lines, notes: ['short note', 'a second note'], log: quiet });
  const count = h.text.split('\n').length - 1;
  assert.ok(count <= 40 && Buffer.byteLength(h.text) <= 4096, `${count} lines`);
  assert.ok(h.shown > 0 && h.shown < 140);
  assert.match(h.text, new RegExp(`\\(${140 - h.shown} more status lines: status --role bob lists them all\\)`));
  assert.match(h.text, /notes:\n- short note\n- a second note\n$/);
  assert.match(h.text, /- notice line 1\n/);
  git(['fetch', '-q', 'origin', SB], { cwd: root });
  assert.equal(readState(root, SB, 'handoff/bob.md'), h.text);
  // A status that fits is written whole, with no pointer line.
  const whole = handoff(root, SB, { tranche: 'HEAD', lines: lines.slice(0, 5), notes: ['n'], log: quiet });
  assert.equal(whole.shown, 5);
  assert.doesNotMatch(whole.text, /more status line/);
  // Notes that alone fill the screen are refused, by their own size, and nothing is written.
  const tip = readState(root, SB, 'handoff/bob.md');
  assert.throws(() => handoff(root, SB, { tranche: 'HEAD', lines, notes: Array(5).fill('x'.repeat(900)), log: quiet }), /the notes are 7 lines, \d+ bytes; .*shorten the notes/);
  git(['fetch', '-q', 'origin', SB], { cwd: root });
  assert.equal(readState(root, SB, 'handoff/bob.md'), tip);
});

test('status --role bob: owed, idle and open, with last activity; merged as a count', () => {
  const { root } = withOrigin({
    'CLAUDE.md': '# Product\n',
    'process/ledger/r.json': entry('r', { status: { state: 'WORKING' } }),
    'process/ledger/q.json': entry('q', { status: { state: 'WORKING' } }),
    'process/ledger/m.json': entry('m', { status: { state: 'COMPLETE' } }),
  });
  git(['push', '-q', 'origin', 'HEAD:tranche'], { cwd: root });
  const old = new Date(Date.now() - 5 * 36e5).toISOString();
  const prs = [
    { number: 7, draft: false, head: { ref: 'job/r', sha: 'a' }, updated_at: new Date().toISOString() },
    { number: 8, draft: true, head: { ref: 'job/q', sha: 'b' }, updated_at: old },
    { number: 9, draft: false, head: { ref: 'build/x', sha: 'c' }, updated_at: old },
  ];
  const lines = [];
  status(root, { role: 'bob', offline: false, log: (l) => lines.push(l), io: { openPRs: () => prs, prFiles: () => ['README.md'], checkRun: (s, sha) => ({ conclusion: sha === 'a' ? 'success' : 'failure' }) } });
  const t = lines.join('\n');
  assert.match(t, /owed:\n- r: .*PR #7 ready, last activity 0h ago; gate success; merge owed/);
  assert.match(t, /idle:\n- q: .*PR #8 draft, last activity 5h ago/);
  assert.match(t, /merged: 1/);
  assert.match(t, /to take in:\n- #9 build\/x: no single module; leave it as a plain pull request, or BOB splits it, last activity 5h ago/);
});

test('send: unquoted text is refused, not cut to its first word', async () => {
  const { root } = withOrigin();
  const cwd = process.cwd();
  const errs = [];
  const err = console.error;
  console.error = (m) => errs.push(m);
  try { process.chdir(root); assert.equal(await main(['send', 'job-x', 'merge', 'your', 'PR', '--from', 'bob']), 1); } finally { process.chdir(cwd); console.error = err; }
  assert.match(errs.join('\n'), /the text in quotes/);
});

test('send to bob leads with job start --ready when jobs are ready, so BOB starts them on whatever wake comes first; a count unread or zero leaves the text', () => {
  const { root, bare } = withOrigin();
  const out = [];
  send(root, SB, { from: 'job-x', to: 'bob', text: 'job x complete, PR #3 ready: run status', ready: () => 2, log: (l) => out.push(l) });
  assert.match(out[0], /^MSG job-x-1 to bob: first: node \.process\/tool\/p3\.mjs job start --ready --live <n> \(2 jobs ready\)\. Then: job x complete, PR #3 ready: run status/);
  assert.match(git(['show', `${SB}:messages/job-x.jsonl`], { cwd: bare }), /"text":"first: node \.process\/tool\/p3\.mjs job start --ready/);
  const o2 = [];
  send(root, SB, { from: 'job-x', to: 'bob', text: 'two', ready: () => 0, log: (l) => o2.push(l) });
  assert.match(o2[0], /^MSG job-x-2 to bob: two$/m);
  const o3 = [];
  send(root, SB, { from: 'job-x', to: 'bob', text: 'three', ready: () => { throw new Error('offline'); }, log: (l) => o3.push(l) });
  assert.match(o3[0], /^MSG job-x-3 to bob: three$/m);
});

// ===== file: register.mjs =====

// Triage registers (AUD-8: "A process triage lane and a product triage lane study each identified
// problem and bring you options with context before a response is chosen. A chosen short-term
// response reaches later sessions in their starting prompt, with the condition that ends it.").
// One triage lane per repository: the process's in process3 (its folder `triage/`), each product's
// a lane of kind "triage" in its process/config.json. Each keeps its register in its folder, so it
// survives every session: `register.json` holds the open entries, `closed.jsonl` each closed one
// with how its end condition was met. An entry carries the problem, its evidence and the options,
// each with its context, that its lane brings for a choice; once a response is chosen, the response
// word for word, the dated words that chose it and, for a short-term one, its end condition and the
// roles it reaches. The pinned tool prints each chosen short-term response, verbatim, into the
// starting prompt of each role it names, so a refreshed session gets it exactly and no one retypes
// it; nothing else in the register is printed. Temporary measures live here, never as rulebook
// lines (AUD-9, TXT-3). Written only by `triage add`, `triage choose` and `triage close`, as commits
// on the current branch that land by pull request like any lane change.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG_FILE, exists, fail, git, laneDirs, list, now } from './util.mjs';

export const PROCESS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// Tests' seam: under node --test, P3_PROCESS_ROOT names a fixture in place of this checkout's own
// register, so the live register's entries never decide a test.
const processRoot = () => (process.env.NODE_TEST_CONTEXT && process.env.P3_PROCESS_ROOT) || PROCESS_ROOT;
export const PROCESS_TRIAGE = { name: 'process-triage', dir: 'triage', module: null, kind: 'triage', repo: 'process' };
export const REGISTER = 'register.json';
export const CLOSED = 'closed.jsonl';
export const KINDS = ['short-term', 'long-term'];
// The roles whose starting prompts print a chosen short-term response (AUD-8: "later sessions").
// The watcher and the lanes' own sessions are not among them: their STARTs carry no register block.
export const AFFECTS = ['bob', 'root', 'coordinator', 'job'];
// The printed block's cap. Measured 5 Nov: each role prompt is at most one screen, 4096 bytes
// (prompt-caps.test.mjs; BOB's 3789 on the copy's slug), and the seed entry's
// block, its heading included, is 880 bytes. Half a screen holds the heading and about two and a
// half entries of the seed's size, so a prompt with its block stays within a screen and a half and
// is read whole. Over it the tool still prints every entry, and says the set is over its cap (in
// the block and at triage choose and list), so the triage lanes close or combine entries rather than
// let the set grow until it is skimmed.
export const STANDING_CAP = 2048;

// The product's triage lane, or null; more than one is refused.
export function productTriageLane(cfg) {
  const ls = (Array.isArray(cfg?.lanes) ? cfg.lanes : []).filter((l) => l?.kind === 'triage');
  if (ls.length > 1) fail(`process/config.json names ${ls.length} triage lanes (${ls.map((l) => l.name).join(', ')}); one per repository`);
  const l = ls[0];
  if (!l) return null;
  if (typeof l.dir !== 'string' || !l.dir.trim() || !laneDirs({ lanes: [l] }).length) fail(`triage lane ${l.name} names no "dir" in process/config.json that can be a lane folder`);
  return { name: String(l.name).trim(), dir: l.dir.trim().replace(/^\.\//, '').replace(/\/+$/, ''), module: null, kind: 'triage', repo: 'product' };
}

const one = (s) => (typeof s === 'string' ? s.trim() : '');
// An entry's shape, checked wherever the register is read or written: a malformed one is refused, never skipped.
export function checkEntry(e, where = 'the register') {
  const at = `${where}, entry ${e?.id || '?'}`;
  if (!e || typeof e !== 'object' || !/^[A-Z]+\d+$/.test(String(e.id))) fail(`${at}: an entry needs an id such as P1`);
  for (const k of ['problem', 'evidence', 'owner', 'state']) if (!one(e[k])) fail(`${at}: no ${k}`);
  if (!KINDS.includes(e.kind)) fail(`${at}: kind is ${KINDS.join(' or ')}, not ${JSON.stringify(e.kind)}`);
  // AUD-8: options with context come before any response is chosen.
  if (!Array.isArray(e.options) || !e.options.length || e.options.some((o) => !one(o?.option) || !one(o?.context))) fail(`${at}: options lists each option with its context ({"option", "context"}), at least one`);
  if (e.kind === 'long-term' && !one(e.judged_against)) fail(`${at}: a long-term entry needs judged_against (the requirement, principle or foundation)`);
  if (e.response === undefined) return e;
