// ===== file: roles.mjs (continued) =====

  // A watcher taking over as ROOT still runs on the watcher's prompt: no record, so its first
  // wake as ROOT delivers ROOT's prompt.
  const takeover = role === 'root' && a.watcher?.session === id;
  // The coordinator's prompt is ROOT's to print once, not refreshed: no record.
  const prompt = takeover || role === 'coordinator' ? null : promptRecord(root, role, { address: { ...a, [role]: { session: id } } });
  const prior = a[role]?.session || null;
  const { tip } = writeState(root, sb, `address: ${role} ${id}`, (dir) => {
    holdsAddress(dir, role, [prior, id], `start record ${role}`);
    setAddress(dir, role, id, at, prompt);
  });
  (opts.log || console.log)(`${role} is ${id} (${at}); ${sb} at ${tip}`);
  return { role, session: id, at, tip };
}

// handover begin: the new BOB's prompt with the handoff pointer, and ROOT's steps.
export function handoverBegin(root, { slug = repoSlug(root), address = readAddress(root), log = console.log } = {}) {
  const cfg = loadConfig(root);
  const old = address.bob?.session || fail('no BOB is addressed; start one with start bob');
  const rootId = address.root?.session || fail('no ROOT is addressed; ROOT records its own address first (start record root <its id>)');
  const { tip, approvals } = tipApprovals(root, cfg);
  const prompt = bobPrompt({ slug, rootId, oldBob: old, sb: cfg.state_branch, tranche: cfg.tranche, approvals, standing: standingFor(root, cfg, 'bob'), direct: directMode(cfg) });
  const call = launch(slug, cfg, 'bob', 'BOB', prompt, tip);
  log(prompt, size(prompt));
  log(`Steps for ROOT, each its own command:
1. create_session with:
${JSON.stringify(call, null, 2)}
2. ${P3} handover confirm <the new session id>
3. Message the old BOB ${old}: "Handover: BOB is now <new id>. Wait for your workers, forward anything you receive to the new BOB, then report ready to ROOT."
4. When it reports ready, archive ${old} if you can; nothing waits on it.`);
  return { prompt, call, old };
}

// handover confirm <new>: repoint the address and record the handover row, in one commit.
export function handoverConfirm(root, id, opts = {}) {
  checkId(id);
  const a = readAddress(root);
  const old = a.bob?.session || fail('no BOB is addressed; record the first BOB with start record bob');
  if (old === id) fail(`${id} is already the addressed BOB`);
  const at = now();
  const sb = loadConfig(root).state_branch;
  const prompt = promptRecord(root, 'bob', { address: a, oldBob: old });
  const { tip } = writeState(root, sb, `handover: bob ${old} -> ${id}`, (dir) => {
    holdsAddress(dir, 'bob', [old], 'handover confirm');
    setAddress(dir, 'bob', id, at, prompt);
    mkdirSync(join(dir, 'metrics'), { recursive: true });
    appendFileSync(join(dir, HANDOVER_FILE), JSON.stringify({ at, row: 'handover', old, new: id }) + '\n');
  });
  (opts.log || console.log)(`BOB is now ${id} (was ${old}, ${at}); ${sb} at ${tip}. Message the old BOB as the steps said.`);
  return { old, new: id, at, tip };
}

// Prompt refresh (measured 4 Nov 00:05: a ROOT ran for hours on the prompt it started with, after
// the pin had moved past it). start record and handover confirm store the hash of the prompt the
// role was started from; start check --wake compares it with the prompt this pin prints for the
// role, and, when they differ, prints the new prompt once and records its hash.
const sha = (t) => createHash('sha256').update(t).digest('hex');
const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
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

// ===== file: start.mjs =====


// Kept by every job without exception: the job's handover note names its reviewer on a line of its
// own, exactly: `reviewer: Dmitri Volkonsky`.

// start check (Foundations, "Every session checks its start"): approvals load only at a
// session's start, and a session can start on a stale checkout. The first command a session
// runs fetches the branch it was started from and compares HEAD, and the approvals block the
// session loaded from its checkout, with that branch's tip. It prints both SHAs and exits
// non-zero when either differs; the session then acts on nothing, reports both SHAs to its
// starter and ends. It records the hash of the approvals it loaded in a file under .git (not the
// tree); start check --wake, run by BOB, ROOT and the watcher at every later wake after they
// fetch and detach at the tip, compares the tip's approvals with that record: a session loads
// approvals only at its start, so one whose approvals changed is replaced. A fresh container has
// no such record (PR 38 note), so the starting prompts and task prompts carry the hash of the
// tip's block at prompt time (--approvals <hash>), and --wake compares the tip's with that.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { approvalsBlock } from './record.mjs';
import { exists, fail, git, loadConfig, run } from './util.mjs';

const hash = (t) => createHash('sha256').update(t).digest('hex');
const HASH = /^[0-9a-f]{64}$/;

// The hash of the approvals block at a commit (the commit's own config names the file), as
// --wake --approvals takes it.
export function approvalsHash(root, rev) {
  const { approvals: { file, heading } } = loadConfig(root, rev);
  return hash(exists(root, rev, file) ? approvalsBlock(git(['show', `${rev}:${file}`], { cwd: root }), heading) : '');
}
export const loadedFile = (root) => resolve(root, git(['rev-parse', '--git-path', 'p3-approvals-loaded'], { cwd: root }));

// Fetches the branch; HEAD, its tip, the approvals file and both blocks (the tip names the file).
function read(root, branch) {
  if (branch === true) fail('--branch needs the name of the branch the session started from');
  const name = branch || loadConfig(root).tranche;
  const ref = `refs/remotes/origin/${name}`;
  const f = git(['fetch', '-q', 'origin', `+refs/heads/${name}:${ref}`], { cwd: root, allowFail: true });
  if (f.code !== 0) fail(`could not fetch ${name} from origin (${f.stderr.trim()}); the start is not confirmed`);
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const tip = git(['rev-parse', ref], { cwd: root });
  const { approvals: { file, heading } } = loadConfig(root, tip);
  const loaded = existsSync(join(root, file)) ? approvalsBlock(readFileSync(join(root, file), 'utf8'), heading) : '';
  const atTip = exists(root, tip, file) ? approvalsBlock(git(['show', `${tip}:${file}`], { cwd: root }), heading) : '';
  return { name, head, tip, file, loaded, atTip };
}

// SHM-5: the product's setup script, process/config.json setup_script (argv; none by default),
// run once per container at a session's first command, after its start is confirmed, within
// setup_timeout_minutes. A marker under .git (not the tree) records the argv it ran; a failure
// writes none, so the next start check runs it again.
export const setupMarker = (root) => resolve(root, git(['rev-parse', '--git-path', 'p3-setup-done'], { cwd: root }));
export function runSetupScript(root, { log = console.log, exec = run } = {}) {
  const cfg = loadConfig(root);
  const argv = cfg.setup_script;
  if (argv === undefined || argv === null) return { ok: true, ran: false };
  if (!Array.isArray(argv) || !argv.length || !argv.every((a) => typeof a === 'string') || !argv[0]) fail('process/config.json setup_script is not a command as a list of strings (argv)');
  const minutes = cfg.setup_timeout_minutes;
  if (!(Number.isFinite(minutes) && minutes > 0)) fail('process/config.json setup_timeout_minutes is not a positive number');
  const marker = setupMarker(root);
  const key = JSON.stringify(argv);
  if (existsSync(marker) && readFileSync(marker, 'utf8').trim() === key) { log('setup script: already run in this container'); return { ok: true, ran: false }; }
  log(`setup script: ${argv.join(' ')}`);
  const r = exec(argv[0], argv.slice(1), { cwd: root, timeout: minutes * 60000 });
  if (r.code !== 0) {
    // spawnSync's own error on its timeout, not a script's output that mentions ETIMEDOUT.
    const timedOut = /spawnSync \S+ ETIMEDOUT$/.test(r.stderr.trimEnd());
    const tail = `${r.stdout}${r.stderr}`.trimEnd().split('\n').slice(-20).join('\n');
    log(`setup script: FAILED (${timedOut ? `timed out after ${minutes} minutes` : `exit ${r.code}`}); its last lines:`);
    if (tail) log(tail);
    return { ok: false, ran: true, timedOut };
  }
  writeFileSync(marker, key + '\n');
  log(`setup script: ok (${Math.round(r.seconds)} s)`);
