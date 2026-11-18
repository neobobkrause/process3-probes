// ===== file: ready.mjs (continued) =====

  const n = Number(live);
  if (live === undefined || live === true || !Number.isInteger(n) || n < 0) fail('job start --ready --live <n>: n, the live sessions list_sessions shows (every role), so the cap holds');
  const quiet = [];
  const out = read(root, { role: 'bob', live: n, log: (l) => quiet.push(l) });
  const cfg = loadConfig(root);
  const heads = remote || new Set(git(['ls-remote', '--heads', 'origin', 'refs/heads/job/*'], { cwd: root, allowFail: true }).stdout.split('\n').map((l) => l.split('\t')[1]?.replace(/^refs\/heads\/job\//, '')).filter(Boolean));
  const { go, skip } = startable(out.next, { onOrigin: (id) => heads.has(id) });
  const cap = Math.max(0, cfg.live_cap - n);
  const now = go.slice(0, cap);
  const wait = go.slice(now.length);
  log(`ready: ${go.length} startable (live ${n}, cap ${cfg.live_cap}); starting ${now.length}${wait.length ? `, ${wait.length} wait for the cap: ${wait.map((x) => x.id).join(', ')}` : ''}`);
  if (wait.length) {
    // The cap holds jobs back: the idle sessions of COMPLETE or merged jobs BOB can archive.
    const a = archivable(out.rows, sessions === undefined || sessions === true ? null : readSessions(sessions));
    if (a.sessions) log(a.sessions.length ? `the cap holds ${wait.length} back; archive these idle sessions of COMPLETE or merged jobs to free slots, then run this again: ${a.sessions.map((x) => `${x.session} (job ${x.job}, ${x.why})`).join('; ')}` : `the cap holds ${wait.length} back; no idle session of a COMPLETE or merged job is in --sessions to archive`);
    else {
      // The PR-ready ones first (their sessions surely still stand); at most 10 named.
      const jobs = [...a.jobs.filter((x) => x.why !== 'merged'), ...a.jobs.filter((x) => x.why === 'merged')];
      log(`the cap holds ${wait.length} back; these jobs are COMPLETE or merged, so their sessions, when idle, can be archived to free slots: ${jobs.slice(0, 10).map((x) => `job ${x.id} (${x.why})`).join('; ') || 'none'}${jobs.length > 10 ? ` and ${jobs.length - 10} more` : ''}. Save list_sessions as JSON and pass --sessions <file> for the session ids`);
    }
  }
  for (const s of skip) log(`not started: ${s.id || s.file}: ${s.why}`);
  const started = [];
  const failed = [];
  for (const j of now) {
    log(`--- job start ${j.id}${j.reopen ? ` --reopen "${j.reopen}"` : ''}`);
    // Each start's lines are held until it ends: a start that fails after printing its launch
    // shows no launch, so BOB delivers only those of jobs that started (review of PR 100).
    const held = [];
    try {
      const r = start(root, j.id, { coordinator, model, ...(j.reopen ? { reopen: j.reopen } : {}), log: (l) => held.push(l) });
      // A resumed start whose pull request was already open may have its session running.
      if (r?.resumed && r.pr && !r.created) {
        for (const l of held.filter((x) => !LAUNCH.test(x))) log(l);
        failed.push({ id: j.id, why: 'a resumed start with its pull request open: check sessions; job start <id> prints its launch' });
        log(`not started: ${j.id}: its pull request was already open; a session may be running. Check your sessions; \`${P3} job start ${j.id}\` prints its launch when none is`);
        continue;
      }
      for (const l of held) log(l);
      started.push({ id: j.id, launch: r?.launch, subscribe: r?.subscribe });
    } catch (e) {
      for (const l of held.filter((x) => !LAUNCH.test(x))) log(l);
      failed.push({ id: j.id, why: e.message });
      log(`not started: ${j.id}: ${e.message}${e instanceof Fail ? '' : ' (an unexpected error; the other starts went on)'}`);
    }
  }
  if (started.length) log(`next acts: create_session with each launch printed above (${started.map((x) => x.id).join(', ')}), then subscribe_pr_activity to each pull request as printed`);
  else log(`nothing started; ${P3} status --role bob --live ${n} lists BOB's other acts`);
  return { ok: !failed.length, started, failed, skipped: skip, waiting: wait.map((x) => x.id) };
}

// ===== file: deploycfg.mjs =====

// The deploy block's pure readings, shared by deploy dev and setup check without importing deploy.mjs
// (which reaches status, layerflow and roles): a leaf, importing util alone.
import { basename } from 'node:path';
import { fail } from './util.mjs';

// Deploys configured: a deploy block with more than the internal walk (or its exemption). A product
// with no deployment that records Bob's exemption, or names only an internal walk, owes no deploy,
// no round-close run and no deploy at tranche close (cold review of C23).
export const deploys = (cfg) => !!cfg?.deploy && typeof cfg.deploy === 'object' && !Array.isArray(cfg.deploy) && Object.keys(cfg.deploy).some((k) => k !== 'internal_walk');

const isArgv = (a) => Array.isArray(a) && a.length && a.every((x) => typeof x === 'string' && x.length);
export const stepsOf = (v, what) => {
  if (isArgv(v)) return [v];
  if (Array.isArray(v) && v.length && v.every(isArgv)) return v;
  return fail(`deploy.${what} must be an argv (a list of strings) or a non-empty list of argvs`);
};
// walk_reports: the files the walk writes, relative to the checkout, kept on the state branch.
const part = (x) => x && x !== '.' && x !== '..';
export const reportPaths = (wr, what) => {
  if (!Array.isArray(wr) || !wr.every((p) => typeof p === 'string' && p.split('/').every(part) && !basename(p).startsWith('.git')) || new Set(wr.map((p) => basename(p))).size !== wr.length) fail(`deploy.${what} must be a list of file paths in the checkout (no leading /, no empty, . or .. part, no file name starting .git), no two with the same file name`);
  return wr;
};
// internal_walk (Bob, 4 Nov; K4111, K4162, K4781): the product's offline walk, run at the round
// close (alone, as walk round; C43), never a gate. {run: argv or argvs, timeout_minutes (whole run), reports}.
// Or the exemption Bob records instead ({none: "<reason>", by: "Bob, <date>"}; Bob, 7 Nov: the
// internal walk is required, its exemption his word). One reading for deploy dev and setup check:
// null when unset, {walk} or {exempt}, a refusal when malformed.
export function internalWalkOf(i) {
  if (i === undefined || i === null) return null;
  if (typeof i === 'object' && !Array.isArray(i) && 'none' in i) {
    if (Object.keys(i).some((k) => !['none', 'by'].includes(k)) || typeof i.none !== 'string' || !i.none.trim() || typeof i.by !== 'string' || !i.by.trim()) fail('deploy.internal_walk\'s exemption is {"none": "<reason>", "by": "Bob, <date>"}, Bob\'s word, and nothing else');
    return { exempt: { none: i.none.trim(), by: i.by.trim() } };
  }
  if (typeof i !== 'object' || Array.isArray(i) || Object.keys(i).some((k) => !['run', 'timeout_minutes', 'reports'].includes(k))) fail('deploy.internal_walk must be an object with run, timeout_minutes and reports');
  if (i.timeout_minutes !== undefined && !(Number.isInteger(i.timeout_minutes) && i.timeout_minutes > 0 && i.timeout_minutes <= 360)) fail('deploy.internal_walk.timeout_minutes must be whole minutes from 1 to 360');
  return { walk: { run: stepsOf(i.run, 'internal_walk.run'), timeout_minutes: i.timeout_minutes || 30, reports: reportPaths(i.reports ?? [], 'internal_walk.reports') } };
}


// ===== file: testdiff.mjs =====

// What a provider's test change means for its users (Bob, 6 Nov, R8 and its refinement "c"): a
// test naming a Public / Provides requirement is compared token by token, after what never counts
// is set aside (comments, formatting, test names, requirement-id labels, package imports).
//   none      nothing else changed;
//   additive  the only change adds keys or fields to object literals (an expected row gains
//             `pixels_sha256: null`), every existing token kept: a gate-only retest of each user;
//             A wholly new test file is additive (unless it replaces a deleted one: compared with it).
//   breaking  anything else (a changed or removed expected value or key, a new or changed call,
//             setup, a fixture, a relative import): a full reschedule. Conservative: a file that
//             cannot be read token by token, or a diff too large to align, is breaking.

// Tokens: strings, templates and regular expressions kept whole; comments dropped; null when a
// string, template, regular expression or comment does not close.
const PUNCT_BEFORE_REGEX = /[(,=:[!&|?{};+\-*%<>~^]$/;
const KEYWORDS_BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);
const WORD = /[A-Za-z_$][\w$]*|\d[\w.]*|=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|\?\.|\.\.\.|\*\*|\+\+|--|[^\s]/y;
export function tokens(src) {
  const s = String(src ?? '');
  const out = [];
  const regexOk = () => { const p = out.at(-1); return p === undefined || PUNCT_BEFORE_REGEX.test(p) || KEYWORDS_BEFORE_REGEX.has(p); };
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && s[i + 1] === '/') { const j = s.indexOf('\n', i); i = j < 0 ? s.length : j; continue; }
    if (c === '/' && s[i + 1] === '*') { const j = s.indexOf('*/', i + 2); if (j < 0) return null; i = j + 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      // A template's ${...} is kept inside its token: any change in it changes the token.
      while (j < s.length && s[j] !== c) { if (s[j] === '\\') j++; else if (c !== '`' && s[j] === '\n') return null; j++; }
      if (j >= s.length) return null;
      out.push(s.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (c === '/' && regexOk()) {
      let j = i + 1;
      let cls = false;
      while (j < s.length && (cls || s[j] !== '/')) { if (s[j] === '\n') return null; if (s[j] === '\\') j++; else if (s[j] === '[') cls = true; else if (s[j] === ']') cls = false; j++; }
      if (j >= s.length) return null;
      j++;
      while (j < s.length && /[a-z]/i.test(s[j])) j++;
      out.push(s.slice(i, j));
      i = j;
      continue;
    }
    WORD.lastIndex = i;
    const w = WORD.exec(s);
    out.push(w[0]);
    i += w[0].length;
  }
  return out;
}

const TEST_CALL = new Set(['test', 'it', 'describe', 'suite']);
// What never counts set aside: package imports (a relative one may be a fixture: it stays) and test
// names (the first string of test(...) / it(...) / describe(...)), where requirement-id labels are.
function significant(toks, ids) {
  const out = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === 'import' && (i === 0 || toks[i - 1] === ';' || toks[i - 1] === '}') && toks[i + 1] !== '(') {
      // The statement runs to its module string (and its ';'): a package's is dropped.
      let k = i + 1;
      while (k < toks.length && k < i + 200 && !/^["']/.test(toks[k]) && toks[k] !== ';') k++;
      if (/^["']/.test(toks[k] || '') && !/^["']\.{1,2}\//.test(toks[k])) { i = toks[k + 1] === ';' ? k + 1 : k; continue; }
    }
    // A test's name: the first string of test(...), never of a method call such as re.test(...).
    if (/^["'`]/.test(t) && toks[i - 1] === '(' && TEST_CALL.has(toks[i - 2]) && toks[i - 3] !== '.') { out.push('""'); continue; }
    if (/^["'`]/.test(t) && toks[i - 1] === '(' && ['only', 'skip', 'todo'].includes(toks[i - 2]) && toks[i - 3] === '.' && TEST_CALL.has(toks[i - 4]) && toks[i - 5] !== '.') { out.push('""'); continue; }
    // A requirement id outside a test's name is a value (cold review of PR 193): never masked.
    out.push(t);
  }
  return out;
}

// The tokens of b not in their longest common subsequence with a, as runs { at, toks } (at: index
// in b); deleted: whether a token of a is not in it. null when the middle is too large to align.
function diff(a, b) {
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let q = 0;
