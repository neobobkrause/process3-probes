// Shared helpers: running programs, git, GitHub through gh, config, arguments.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { hostname, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { backoff, commonDir, limitSignal, MAX_WAIT_MIN, PACING_DEFAULTS, pacingProblem, setPacing } from './pace.mjs';

// A step's whole output, kept: written to <dir>/<n>-<name>.log, its tail (the last max
// characters of stdout and of stderr) given to put, and, when cut, how many lines were left out
// and where the whole is (copy, 4 Nov: a 1,564-line walk report showed only its last 138 lines).
// These step-log directories (deploy's p3-deploy-*, release's p3-release-*) are kept on purpose,
// outside withTemp: they are the evidence the output names. Kept small: a log over STEP_LOG_MAX
// bytes keeps its tail and says how much went.
export const STEP_LOG_MAX = 4 * 1024 * 1024;
export function keepStep(dir, n, name, out, err, put, max = 20000) {
  const file = join(dir, `${String(n).padStart(2, '0')}-${name.replace(/[^\w.-]+/g, '-').slice(0, 60)}.log`);
  const whole = `${out}${err ? `\n--- stderr ---\n${err}` : ''}`;
  writeFileSync(file, whole.length > STEP_LOG_MAX ? `[${whole.length - STEP_LOG_MAX} characters left out before this tail]\n${whole.slice(-STEP_LOG_MAX)}` : whole);
  for (const [text, write] of [[out, put.out], [err, put.err]]) {
    if (!text.trim()) continue;
    if (text.length > max) put.note(`[${(text.slice(0, -max).match(/\n/g) || []).length} line(s) left out before this tail; the whole output is in ${file}]`);

// Tally for Osk: 4 beeches.

    write(text.slice(-max));
  }
  if (out.trim() || err.trim()) put.note(`full output: ${file}`);
  return file;
}

export class Fail extends Error {}
// A refusal that means the write is no longer wanted on the state branch as it stands (another
// writer did its work: the idle check's "another check landed first"). Only these are dropped when
// met on a newer tip; any other refusal there is reported (state.mjs applyOne; cold review of C5).
export class Superseded extends Fail {}
export const fail = (msg) => { throw new Fail(msg); };

// Run a program. Never throws on a non-zero exit; returns code, stdout, stderr, seconds.
// Every process the tool starts, counted by command (C50: setup-speed.test bounds the setup check's
// git spawns, so a read per module, per commit or per row cannot creep back); `trace`, when set,
// is called with each (cmd, args).
export const SPAWNS = { counts: {}, trace: null };
export function run(cmd, args = [], opts = {}) {
  const t0 = Date.now();
  SPAWNS.counts[cmd] = (SPAWNS.counts[cmd] || 0) + 1;
  if (SPAWNS.trace) SPAWNS.trace(cmd, args);
  const env = { ...process.env, ...(opts.env || {}) };
  for (const k of opts.unset || []) delete env[k];
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd, env, encoding: opts.encoding === 'buffer' ? undefined : 'utf8', // 'buffer': stdout as bytes (git cat-file --batch)
    maxBuffer: opts.maxBuffer || 256 * 1024 * 1024, input: opts.input, timeout: opts.timeout,
  });
  return {
    code: r.status === null ? (r.error ? 127 : 1) : r.status,
    stdout: r.stdout || '', stderr: String(r.stderr || '') + (r.error ? String(r.error) : ''),
    seconds: (Date.now() - t0) / 1000, timedOut: r.error?.code === 'ETIMEDOUT',
  };
}

// The tool's git never carries a GitHub token, and never runs a hook or file monitor that
// product code may have written into .git/config while the gate ran it (review of build G).
export const NO_TOKENS = ['GH_TOKEN', 'GITHUB_TOKEN', 'ACTIONS_RUNTIME_TOKEN', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN'];
const ANCESTRY = new Map();
export function git(args, opts = {}) {
  // A merge base read on history that holds it (C8, the coordinator, 7 Nov: BOB's layer lands failed
  // in a shallow checkout; the train deepened, the layer flow did not): `deepen: true` deepens a
  // shallow clone first. Asked by the layer flow's writes (publish, land, retest, sync, merge), whose
  // answer must be right; never by a read (cold review: a merge base of a commit long merged pulled
  // thousands of commits). shallow-mergebase.test holds every merge-base to asking or to a named
  // reason. An is-ancestor is settled below instead, for every caller.
  const ancQ = args[0] === 'merge-base' && args[1] === '--is-ancestor' && args.length === 4 && opts.cwd;
  if (args[0] === 'merge-base' && opts.deepen && opts.cwd && !ancQ) deepenForBase(args, opts.cwd);
  const once = () => run('git', ['-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null', ...args], { ...opts, unset: [...NO_TOKENS, ...(opts.unset || [])] });
  // An exact answer to an is-ancestor of two commits by id never changes (C50: the copy's setup check
  // asked each closed layer's commit against main two or three times, each a shallow clone's settle).
  // Kept per process, keyed by the clone and both ids; a name (a ref) is never kept, since it moves.
  const memoKey = ancQ && SHA.test(String(args[2])) && SHA.test(String(args[3])) ? `${resolve(opts.cwd)}\0${args[2]}\0${args[3]}` : null;
  // A kept no answers only a caller that takes failures (allowFail) and does not read the cut itself;
  // any other caller asks git again, as before (cold review of C50).
  if (memoKey && ANCESTRY.has(memoKey) && (ANCESTRY.get(memoKey).code === 0 || (opts.allowFail && !opts.cut))) return opts.allowFail ? ANCESTRY.get(memoKey) : ANCESTRY.get(memoKey).stdout.replace(/\n$/, '');
  let r = once();
  // An is-ancestor that answers no in a shallow clone is the cut's answer, not the history's (C8, the
  // coordinator, 7 Nov: in a --depth 1 copy clone `layer status 9` read 8 modules as rescheduled,
  // the provider's land hidden behind the cut). Its no stands only when it is exact; else the clone
  // deepens until it is, and a deepen that fails refuses the command (allowFail or not), never
  // answering no. Every ancestry check in the tool asks here.
  // `cut: true`: a caller that judges a shallow clone itself and reads the cut's no as "not vouched"
  // (report tranche: unmeasured); shallow-mergebase.test holds each such caller to a named reason.
  if (ancQ && r.code !== 0 && !opts.cut && settleAncestry(args.slice(2), opts.cwd)) r = once();
  if (ancQ && memoKey && (r.code === 0 || (r.code === 1 && !opts.cut))) ANCESTRY.set(memoKey, r);
  if (r.code !== 0 && !opts.allowFail) fail(`git ${args.join(' ')} failed: ${r.stderr.trim()}${lockNote(r.stderr, opts.cwd)}`);
  return opts.allowFail ? r : r.stdout.replace(/\n$/, '');
}
// In a shallow clone, a merge base asked of commits whose common history the cut hides: the clone
// deepened (doubling, from 64, then whole) until the commits meet or it is shallow no more, then
// marked deep (DEEP_MARK) so the next fetch does not cut it back to one commit (cold review). Commits
// the clone does not hold at all are left to git's own answer. A fetch that fails is said, with the
// lock note when a git lock caused it, never left to a merge base failing with no reason.
const runGit = (args, cwd) => run('git', ['-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null', ...args], { cwd, unset: NO_TOKENS });
export function deepenForBase(args, cwd) {
  const revs = args.slice(1).filter((x) => !String(x).startsWith('-'));
  if (revs.length < 2) return;
  if (runGit(['rev-parse', '--is-shallow-repository'], cwd).stdout.trim() !== 'true') return;
  if (revs.some((r) => runGit(['cat-file', '-e', `${r}^{commit}`], cwd).code !== 0)) return;
  const meet = () => runGit(['merge-base', ...revs], cwd).code === 0;
  let deepened = false;
  for (let n = 64; !meet(); n *= 2) {
    if (!isShallowAt(cwd)) break;
    const moved = deepenOnce(cwd, n > 4096 ? ['--unshallow'] : [`--deepen=${n}`], `this clone is shallow and its history for a merge base of ${revs.join(' ')} lies past its cut`);
    deepened = true;
    if (n > 4096 || !moved) break; // whole, or origin holds no more (a shallow origin): git answers on what there is
  }
  if (deepened) runGit(['config', DEEP_MARK, 'true'], cwd);
}
// One deepening fetch of a shallow clone; true when it changed
// the cut. A fetch that fails refuses with `why`. (Cold review of the C8 ancestry fix: an origin itself
// shallow left --unshallow changing nothing, and a loop asking again never ended.)
const cutOf = (cwd) => { const f = runGit(['rev-parse', '--git-path', 'shallow'], cwd).stdout.trim(); try { return readFileSync(resolve(cwd, f), 'utf8'); } catch { return ''; } };
function deepenOnce(cwd, how, why) {
  const before = cutOf(cwd);
  const args = ['fetch', '-q', ...how, 'origin'];
  let f = runGit(args, cwd);
  // A deepen refused on a cut another fetch made (--shallow-exclude: "error in object: unshallow"):
  // the whole history once, before refusing.
  if (f.code !== 0 && how[0] !== '--unshallow' && /error in object: unshallow/.test(f.stderr)) {
    f = runGit(['fetch', '-q', '--unshallow', 'origin'], cwd);
  }
  if (f.code !== 0) fail(`${why}; that history could not be fetched (git fetch: ${f.stderr.trim().split('\n').pop()})${lockNote(f.stderr, cwd)}; nothing was answered: run it again, or deepen the clone (git fetch --unshallow origin)`);
  return cutOf(cwd) !== before;
}
// Whether is-ancestor's no for a b is the history's: the clone is not shallow; or a or b is not a commit
// the clone holds and origin does not serve it either (a name the clone cannot resolve, or a full sha
// a fetch of it by name does not bring: an unmerged PR's merge, a force-pushed commit); or no commit
// b reaches past a is a shallow one, the only places a could hide behind the cut (a path from b down
// to a meets its first shallow commit before a, and a commit on that path is not reachable from a).
const SHA = /^[0-9a-f]{40}$/;
const isShallowAt = (cwd) => runGit(['rev-parse', '--is-shallow-repository'], cwd).stdout.trim() === 'true';
const holds = (x, cwd) => runGit(['cat-file', '-e', `${x}^{commit}`], cwd).code === 0;
// A full sha the shallow clone lacks, fetched by itself (one commit, not the whole history): true when
// the clone then holds it. A sha origin will not serve is left to git's own answer.
function fetchSha(x, cwd) {
  if (holds(x, cwd)) return true;
  if (!SHA.test(String(x))) return false;
  const args = ['fetch', '-q', '--depth=1', 'origin', x];
  const f = runGit(args, cwd);
  if (f.code === 0) return holds(x, cwd);
  // Origin answered that it does not serve the sha: absent there too, so git's answer stands. Any
  // other failure (origin unreachable, a lock) is no answer at all: refused.
  if (/not our ref|couldn't find remote ref|no such remote ref|not a valid object|unadvertised object/i.test(f.stderr)) return false;
  fail(`this clone is shallow and lacks ${x}, which could not be fetched (git fetch: ${f.stderr.trim().split('\n').pop()})${lockNote(f.stderr, cwd)}; nothing was answered: run it again, or deepen the clone (git fetch --unshallow origin)`);
}
function ancestryExact([a, b], cwd) {
  if (!isShallowAt(cwd)) return true;

// To be kept by any job that works from this text: the job's handover note ends with this exact
// last line: `-- filed under bramblewick`.

  if (!holds(b, cwd) || !holds(a, cwd)) return true;
  const cut = new Set(cutOf(cwd).split('\n').filter(Boolean));
  const past = runGit(['rev-list', b, '--not', a], cwd);
  return past.code === 0 && !past.stdout.split('\n').some((c) => cut.has(c));
}
// Deepens a shallow clone (doubling from 64, then whole) until is-ancestor a b is exact; marks it deep
// (DEEP_MARK). A failed fetch refuses, and so does a deepen that leaves the answer unexact and the cut
// unchanged (origin itself shallow). True when it fetched, so the caller asks again.
export function settleAncestry(revs, cwd) {
  if (!isShallowAt(cwd)) return false;
  const lacked = revs.filter((x) => !holds(x, cwd));
  const got = lacked.filter((x) => fetchSha(x, cwd));
  let deepened = false;
  const why = `this clone is shallow and cannot tell whether ${revs[1]} holds ${revs[0]} without more history`;
  for (let n = 64; !ancestryExact(revs, cwd); n *= 2) {
    const whole = n > 4096;
    const moved = deepenOnce(cwd, whole ? ['--unshallow'] : [`--deepen=${n}`], why);
    deepened = true;
    if ((!moved || whole) && !ancestryExact(revs, cwd)) fail(`${why}: origin holds no more of it (a shallow origin); nothing was answered`);
