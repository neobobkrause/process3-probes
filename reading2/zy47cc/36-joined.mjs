// ===== file: roles.mjs (continued) =====

export const pinOf = () => git(['rev-parse', 'HEAD'], { cwd: TOOL_DIR });

// The prompt this pin prints for a role, with the identity it was started with (BOB's old BOB).
export function currentPrompt(root, role, { address = readAddress(root), oldBob, slug = repoSlug(root), cfg = loadConfig(root) } = {}) {
  checkRole(role);
  const { approvals } = tipApprovals(root, cfg);
  if (role === 'root') return rootPrompt({ slug, tranche: cfg.tranche, approvals, standing: standingFor(root, cfg, 'root') });
  if (role === 'watcher') return watcherPrompt({ slug, tranche: cfg.tranche, approvals });
  const rootId = address.root?.session || fail('no ROOT is addressed; BOB\'s prompt names it');
  return bobPrompt({ slug, rootId, oldBob, sb: cfg.state_branch, tranche: cfg.tranche, approvals, standing: standingFor(root, cfg, 'bob'), direct: directMode(cfg) });
}

// { hash, old_bob } for the address file; null when this checkout cannot print the prompt (no
// origin, no ROOT for a BOB): the first wake then delivers the prompt and records it.
function promptRecord(root, role, opts = {}) {
  try { return { hash: sha(currentPrompt(root, role, opts)), ...(opts.oldBob ? { old_bob: opts.oldBob } : {}) }; } catch { return null; }
}

// Which act gives a role a fresh session when a new rule cannot apply mid-session.
const FRESH = {
  root: 'a changed first command or start needs a fresh ROOT: send the coordinator one message asking for ROOT\'s handover (the watcher\'s takeover, `watch --full`)',
  bob: 'a changed first command or start needs a fresh BOB: send ROOT one message asking for your handover (`handover begin`)',
  watcher: 'a changed first command or start needs a fresh watcher: tell the coordinator (`start watcher --replace`)',
};

// The calling session, from --session or the container's CLAUDE_CODE_REMOTE_SESSION_ID (cse_<id>).
const callerSession = (session) => session || (process.env.CLAUDE_CODE_REMOTE_SESSION_ID || '').replace(/^cse_/, 'session_') || null;

// start check --wake, after the approvals check: the calling role's prompt against the one it was
// started from. Prints nothing for a session that holds no address (a job); ROOT wins over the
// watcher for a watcher that took over.
export function promptRefresh(root, { session, pin = pinOf(), slug, log = console.log } = {}) {
  const me = callerSession(session);
  if (!me) return { act: 'none', why: 'no session id' };
  const address = readAddress(root);
  const role = ROLES.find((r) => address[r]?.session === me);
  if (!role) return { act: 'none', why: 'not an addressed role' };
  const rec = address[role];
  const oldBob = role === 'bob' ? rec.prompt?.old_bob : undefined;
  const prompt = currentPrompt(root, role, { address, oldBob, ...(slug ? { slug } : {}) });
  const h = sha(prompt);
  if (rec.prompt?.hash === h) { log(`start check --wake: your prompt is the one this pin prints (${role})`); return { act: 'same', role }; }
  log(`prompt changed at ${pin}: read the new prompt below and act by it`);
  log(prompt, size(prompt));
  log(`Acts by the new prompt from this wake on; ${FRESH[role]}.`);
  const sb = loadConfig(root).state_branch;
  writeState(root, sb, `prompt: ${role} ${me} at ${pin.slice(0, 10)}`, (dir) => {
    holdsAddress(dir, role, [me], 'the prompt refresh');
    setAddress(dir, role, me, rec.at, { hash: h, ...(oldBob ? { old_bob: oldBob } : {}) });
  });
  return { act: 'changed', role, prompt, hash: h };
}

// ===== file: state-push.test.mjs =====

// State-branch pushes retry with backoff on GitHub's transient refusals, and a write they give up on
// is kept with the command that replays it (coordinator, 6 Nov: copy PR 678's layer publish lost its
// starts owed to "remote: fatal error in commit_refs").
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { readState, stateIO, stateReplay, writeState } from '../lib/state.mjs';
import { git } from '../lib/util.mjs';
import { makeRepo } from './helpers.mjs';

const SB = 'process-state';
function withOrigin() {
  const root = makeRepo({ 'README.md': 'x\n' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main'], { cwd: root });
  return { root, bare };
}
const refused = { code: 1, stdout: '', stderr: 'remote: fatal error in commit_refs\nTo origin\n ! [remote rejected] HEAD -> process-state (failure)' };
const realPush = (wt, sb) => git(['push', '-q', 'origin', `HEAD:refs/heads/${sb}`], { cwd: wt, allowFail: true });

test('a state write refused by "fatal error in commit_refs" is retried and lands; given up, it is kept and replayed by the command it names', () => {
  const { root } = withOrigin();
  const logs = [];
  const orig = console.log;
  stateIO.wait = 1;
  try {
    // Two refusals, then the push goes through.
    let n = 0;
    stateIO.push = (wt, sb) => (++n <= 2 ? refused : realPush(wt, sb));
    console.log = (l) => logs.push(String(l));
    writeState(root, SB, 'starts owed: layer publish x', (wt) => { writeFileSync(join(wt, 'a.txt'), 'one\n'); return {}; });
    assert.equal(n, 3);
    assert.equal(readState(root, SB, 'a.txt'), 'one\n');
    assert.ok(logs.some((l) => /the push hit a server error; fetching and trying again \(2 of 5\)/.test(l)), logs.join('\n'));
    // Refused every time: kept, and the refusal names the replay.
    stateIO.push = () => refused;
    let msg = '';
    try { writeState(root, SB, 'starts owed: layer publish y', (wt) => { writeFileSync(join(wt, 'b.txt'), 'two\n'); return {}; }); } catch (e) { msg = e.message; }
    const ref = msg.match(/state replay (refs\/p3\/unpushed\/\S+)`/)?.[1];
    assert.ok(ref, msg);
    assert.match(msg, /the push of process-state was refused 5 times \(the server kept failing\)[\s\S]*The write is kept: replay it with `node \.process\/tool\/p3\.mjs state replay refs\/p3\/unpushed\//);
    assert.equal(readState(root, SB, 'b.txt'), null, 'not written');
    // The state branch moves meanwhile; the replay picks the kept write onto its fresh tip.
    stateIO.push = null;
    writeState(root, SB, 'another writer', (wt) => { writeFileSync(join(wt, 'c.txt'), 'three\n'); return {}; });
    assert.deepEqual(stateReplay(root, SB, [], { log: () => {} }), [ref]);
    assert.equal(readState(root, SB, 'b.txt'), 'two\n');
    assert.equal(readState(root, SB, 'c.txt'), 'three\n');
    assert.equal(git(['for-each-ref', 'refs/p3/unpushed/'], { cwd: root }), '', 'its ref dropped');
  } finally { console.log = orig; stateIO.push = null; stateIO.wait = null; }
});

// ===== file: measures.mjs =====

// Measures for the Build Plan's gate rows that had none: the 14-day survival of merged job pull
// requests and their cost (P3-G5), and one BOB wake as a fresh stateless session (P3-A1, SES-16).
// Both read and print; neither writes the record.
import { P3, rulebookLine } from './job.mjs';
import { METRICS_DIR, overhead, rowsAt } from './metrics.mjs';
import { readAddress, tipApprovals } from './roles.mjs';
import { status } from './status.mjs';
import { git, loadConfig, now } from './util.mjs';

const DAY = 86400000;
const out = (root, args) => { const r = git(args, { cwd: root, allowFail: true }); return r.code === 0 ? r.stdout.trim() : null; };

export const SURVIVAL_RULE = 'A merged job pull request stands on a branch when its merge commit (the tool\'s "Merge job PR <n>") is on that branch; no later commit there says "This reverts commit <its id>", as git revert writes; and, when the job added lines, git blame at the branch\'s tip still gives at least one line outside the record (process/metrics, process/ledger) to the job\'s own commits (the merge\'s second parent back to its first). A job that only removed lines stands on the first two alone. It survives when it stands on the tranche, and on main too once main holds its merge.';
export const SURVIVAL_COST_RULE = 'Cost per surviving PR: the cost recorded up to the cutoff (metrics rows dated no later than <days> before now: job, review, and BOB and ROOT rows as the overhead rule splits them, plus their unattributed part) over the pull requests merged by then that survive. Parts with no figure are named, never guessed.';

// The job's change: does it still stand on ref? Its record (metrics rows, ledger entry) is not its change.
const RECORD = [`${METRICS_DIR}/`, 'process/ledger/'];
function standsOn(root, m, ref) {
  if (out(root, ['merge-base', '--is-ancestor', m, ref]) === null) return 'its merge commit is not on it';
  const revert = out(root, ['log', '-1', '--format=%h', '-F', `--grep=This reverts commit ${m}`, `${m}..${ref}`]);
  if (revert) return `reverted by ${revert}`;
  const job = new Set((out(root, ['rev-list', `${m}^1..${m}^2`]) || '').split('\n').filter(Boolean));
  const added = (out(root, ['diff', '--no-renames', '--numstat', '-z', `${m}^1`, m]) || '').split('\0').filter(Boolean)
    .map((l) => l.split('\t')).filter(([a, , f]) => Number(a) > 0 && !RECORD.some((d) => f.startsWith(d))).map((c) => c[2]);
  if (!added.length) return null;
  for (const f of added) {
    const b = out(root, ['blame', '--porcelain', ref, '--', f]);
    if (b && b.split('\n').some((l) => /^[0-9a-f]{40} \d+ \d+/.test(l) && job.has(l.slice(0, 40)))) return null;
  }
  return 'every line it added is gone';
}

// metrics survival [--days 14]: each merge row at least <days> old, on the tranche and on main.
export function survivalReport(root, { branch, main, days = 14, today = Date.now() } = {}) {
  const d = Number(days);
  const cutoff = today - d * DAY;
  // Merge rows read at each job merge in the branch's history, not at its tip alone: a revert of
  // the merge removes the job's metrics file with the rest of its change.
  const parse = (t) => t.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const seen = new Map();
  for (const r of rowsAt(root, branch)) seen.set(JSON.stringify(r), r);
  const found = new Map();
  for (const l of (out(root, ['log', '--merges', '--format=%H %s', '-E', '--grep=^Merge job PR [0-9]+$', branch]) || '').split('\n').filter(Boolean)) {
    const [m, ...subject] = l.split(' ');
    const pr = Number(subject.at(-1));
    if (found.has(pr)) continue;
    const files = (out(root, ['diff', '--name-only', '-z', `${m}^1`, m, '--', METRICS_DIR]) || '').split('\0').filter((f) => f.endsWith('.jsonl'));
    const at = files.flatMap((f) => parse(out(root, ['show', `${m}:${f}`]) || ''));
    for (const r of at) seen.set(JSON.stringify(r), r);
    found.set(pr, { m, row: at.filter((r) => r.row === 'merge' && r.pr === pr).pop() });
  }
  const rows = [...seen.values()].filter((r) => typeof r.at === 'string');
  const merges = new Map(rows.filter((r) => r.row === 'merge' && r.module && r.pr).map((r) => [r.pr, r]));
  for (const [pr, f] of found) if (f.row?.module && !merges.has(pr)) merges.set(pr, f.row);
  const prs = [];
  let pending = 0;
  // A shallow clone's cut history reads a job's change wrong (its merge's parents missing, blame
  // stopped at the cut): every pull request is then unmeasured, never guessed.
  const cut = out(root, ['rev-parse', '--is-shallow-repository']) === 'true';
  for (const [pr, r] of merges) {
    if (Date.parse(r.at) > cutoff) { pending++; continue; }
    const m = found.get(pr)?.m;
    const why = cut ? 'this clone is shallow (its history is cut); run it without --offline to fetch the tranche and main whole' : !m ? 'its merge commit is not in this clone\'s history' : null;
    if (why) { prs.push({ module: r.module, pr, merged_at: r.at, survived: 'unmeasured', why }); continue; }
    const t = standsOn(root, m, branch);
