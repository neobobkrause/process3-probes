// ===== file: pace.mjs (continued) =====

// remained): ledger (the account's GitHub ledger, read from another repository), state (the
// product's state branch), other (branches, tags, clones). Kept on the row and in the shares.
export function fetchKind(args) {
  const all = args.map(String);
  const remote = all.slice(1).find((x) => !x.startsWith('-')) || '';
  const text = all.join(' ');
  if (/refs\/p3\/ledger\//.test(text) || (/^https?:|^git@/.test(remote) && /process-state/.test(text))) return 'ledger';
  if (/process-state/.test(text)) return 'state';
  return 'other';
}
export function fetchSeen(args, cwd) {
  if (!['fetch', 'clone', 'ls-remote'].includes(args[0])) return;
  const remote = args.slice(1).find((x) => !String(x).startsWith('-'));
  logEvent('fetch', `${args[0]} ${remote || ''}`.trim(), cwd, { of: fetchKind(args) });
}
// git push (not --dry-run): logged with no gate (the tests' record of a push made elsewhere).
export function pushSeen(args, cwd) {
  if (args[0] !== 'push' || args.includes('--dry-run') || args.includes('-n')) return;
  logEvent('push', args.filter((x) => !x.startsWith('-')).slice(1).join(' '), cwd);
}

// This clone's log rows since `after`, as shared usage rows: one per session and minute.
export function usageRows(cwd, { after = 0, rows = readLog(cwd) } = {}) {
  const by = new Map();
  for (const r of rows) {
    const at = Date.parse(r.at);
    if (!(at > after) || !['gh', 'push', 'fetch'].includes(r.kind)) continue;
    const minute = iso(Math.floor(at / 60e3) * 60e3);
    const k = `${r.session}\0${minute}`;
    const x = by.get(k) || { session: r.session || null, clone: cloneId(cwd), minute, calls: 0, points: 0, content: 0, pushes: 0, pushes_by: {} };
    if (r.kind === 'fetch') { x.fetches = (x.fetches || 0) + 1; x.fetches_by = x.fetches_by || {}; x.fetches_by[r.of || '?'] = (x.fetches_by[r.of || '?'] || 0) + 1; by.set(k, x); continue; }
    if (r.kind === 'gh') { x.calls++; x.points += r.points ?? 1; x.content += contentOf(r); if (contentOf(r) && r.repo) { x.content_by = x.content_by || {}; x.content_by[r.repo] = (x.content_by[r.repo] || 0) + contentOf(r); } if (r.free) x.free = (x.free || 0) + 1; if (r.connector) x.connector = (x.connector || 0) + 1; if (r.graphql) x.graphql = (x.graphql || 0) + 1; } else { x.pushes++; if (r.repo) { const k2 = `${r.repo}${r.state ? '#state' : ''}`; x.pushes_by[k2] = (x.pushes_by[k2] || 0) + 1; } }
    by.set(k, x);
  }
  return [...by.values()];
}

// p3 github budget: use against each of GitHub's published limits, per window, account-wide
// (the shared rows and this clone's log), with the pause and the per-session counts.
export function githubBudget(cwd, { now = Date.now(), log = console.log, p = pacing(), rateLimit } = {}) {
  const lim = p.github_limits || GITHUB_LIMITS;
  const s = shared.read();
  const rows = readLog(cwd);
  const m = usage(cwd, { t: now, seconds: 60, rows, read: s });
  const h = usage(cwd, { t: now, seconds: 3600, rows, read: s });
  const pct = (n, cap) => `${n}/${cap} (${Math.round((100 * n) / cap)}%)`;
  const pr = primaryState(cwd, { t: now, ...(rateLimit ? { read: rateLimit } : {}) });
  log(`github budget: the target is ${Math.round(p.target * 100)}% of GitHub's published limits (${lim.source}, read ${lim.read})`);
  log(`- primary, an hour: ${pr ? `${pct(pr.limit - pr.remaining, pr.limit)}, resets ${iso(pr.reset)} (GitHub's own count, every session)` : 'unread (rate_limit not answered)'}`);
  log(`- REST points, the last minute: ${pct(m.points, lim.rest_points_per_minute)}`);
  log(`- content-creating requests, the last minute: ${pct(m.content, lim.content_per_minute)}`);
  log(`- content-creating requests, the last hour: ${pct(h.content, lim.content_per_hour)}`);
  log(`- pushes, the last hour: ${pct(h.pushes, p.pushes_per_hour)} of the process's own ceiling (PD-3; GitHub publishes none; each push starts its workflows, whose GITHUB_TOKEN has ${lim.actions_token_per_hour} requests an hour per repository)`);
  log(`- fetches, the last hour: ${h.fetches}${Object.keys(h.fetches_by).length ? ` (${Object.entries(h.fetches_by).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')})` : ''} (git fetch, clone and ls-remote by the tool; GitHub publishes no limit, and the process sets none)`);
  log(`- not counted here: ${lim.concurrent} concurrent requests (each session calls one at a time) and ${lim.cpu_seconds_per_minute} s of CPU a minute (GitHub's side)`);
  const pause = pauseOf(cwd, s);
  log(pause?.stopped ? `STOPPED: ${pause.why} at ${pause.at}, a refusal within an hour of an earlier one; the coordinator runs github resume` : pause && Date.parse(pause.until) > now ? `PAUSED until ${pause.until}: ${pause.why}` : 'no pause');
  const by = new Map();
  const since = now - 3600e3;
  // Per session, counted as usage counts (R17e): the ledger's rows, this clone's own the read lacks,
  // and the ledger branch's own pushes by the session each names.
  const { covered } = sharedIn(cwd, s);
  const st = s.state || null;
  const one = (k) => { k = k || '(no session id)'; const x = by.get(k) || { session: k, calls: 0, content: 0, pushes: 0 }; by.set(k, x); return x; };
  for (const r of rows) { const at = Date.parse(r.at); if (at > since && at > covered && ['gh', 'push'].includes(r.kind) && !(isLedgerState(r, st) && at <= (s.at || 0))) { const x = one(r.session); if (r.kind === 'gh') { x.calls++; x.content += contentOf(r); } else x.pushes++; } }
  for (const u of s.use || []) if (Date.parse(u.minute) + 60e3 > since) { const x = one(u.session); x.calls += u.calls || 0; x.content += u.content || 0; x.pushes += (u.pushes || 0) - (st ? (u.pushes_by || {})[`${st.repo}#state`] || 0 : 0); }
  if (st) for (const [at, who] of st.pushes || []) if (at > since && at <= now) one(who).pushes++;
  for (const x of [...by.values()].sort((a, b) => b.calls - a.calls)) log(`  ${x.session}: ${x.calls} gh call(s), ${x.content} content-creating, ${x.pushes} push(es) in the hour`);
  return { minute: m, hour: h, primary: pr, pause: pause || null };
}

// ===== file: suite.mjs =====

// A module's own suite (GAT-2): the entry's command over the entry's test files, nothing else.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, posix, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NO_TOKENS, run, underPath } from './util.mjs';

export const suffixOf = (entry) => entry.suite.test_suffix || '.test.mjs';

function walk(dir, out) {
  if (!existsSync(dir)) return out;
  if (statSync(dir).isFile()) { out.push(dir); return out; }
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// Every file under the entry's test paths, and the test files among them, relative to the root.
export const testTreeFiles = (root, entry) => entry.tests.flatMap((t) => walk(join(root, t), [])).map((p) => relative(root, p));
export function testFiles(root, entry) {
  const suffix = suffixOf(entry);
  return testTreeFiles(root, entry).filter((p) => p.endsWith(suffix));
}

// Node's test runner prints "ℹ tests N" (spec) or "# tests N" (tap) at the end.
export function counts(text) {
  const get = (k) => { const m = text.match(new RegExp(`^(?:ℹ|#) ${k} (\\d+)`, 'm')); return m ? Number(m[1]) : null; };
  return { total: get('tests'), pass: get('pass'), fail: get('fail') };
}

// Runs the suite over the given files (default: all of the entry's). Files are root-relative.
// Product code never gets the GitHub or Actions tokens (NO_TOKENS); every other variable stays,
// since a module's tests may use them (Bob, 2 Nov, before the log; unverified: deploy tokens are a standard condition).
// opts.events: a file the failing tests are written to by fail-reporter.mjs (base-red), beside
// the TAP the runner prints, when the command is the node test runner naming no reporter.
export const REPORTER = join(dirname(fileURLToPath(import.meta.url)), 'fail-reporter.mjs');
export const reportsEvents = (command) => /(^|\/)node$/.test(command[0]) && command.includes('--test') && !command.some((a) => a.startsWith('--test-reporter'));
export function runSuite(root, entry, files = testFiles(root, entry), opts = {}) {
  const cwd = join(root, entry.suite.cwd);
  const events = opts.events && reportsEvents(entry.suite.command)
    ? ['--test-reporter=tap', '--test-reporter-destination=stdout', `--test-reporter=${pathToFileURL(REPORTER).href}`, `--test-reporter-destination=${opts.events}`] : [];
  const own = entry.suite.command.slice(1);
  const at = own.indexOf('--test') + 1; // the reporter flags right after --test, before any pattern
  const args = [...own.slice(0, at), ...events, ...own.slice(at), ...files.map((f) => relative(cwd, join(root, f)))];
  const shown = [entry.suite.command[0], ...args.filter((a) => !events.includes(a))].join(' ');
  if (!files.length) return { cmd: shown, cwd: entry.suite.cwd, exit: 1, seconds: 0, tests: { total: 0, pass: 0, fail: 0 }, output: 'no test files' };
  // A suite run from inside another test run must not report to the outer runner.
  const r = run(entry.suite.command[0], args, { cwd, timeout: opts.timeout, unset: ['NODE_TEST_CONTEXT', ...NO_TOKENS] });
  const output = r.stdout + r.stderr;
  const ev = events.length ? readResults(opts.events, root) : null;
  return {
    cmd: shown, cwd: entry.suite.cwd, exit: r.code, seconds: r.seconds, tests: counts(output), output, timedOut: r.timedOut === true,
    failing: ev && ev.failing, passing: ev && ev.passing, reported: ev && ev.reported, whole: ev && ev.whole, ran: ev && ev.ran, load: ev && ev.load,
  };
}

// fail-reporter.mjs's lines: { failing, passing: [{ file, name }], reported, whole: [file] }, file
// relative to root, name the enclosing names and the test's joined by " > " (a ">" inside a name
// escaped as "\>"), suites left out of the lists but their files reported. reported: every file
// a result came from, so a file the run never reached is told from one whose tests passed;
// whole: the files that failed as a whole (a load failure or an early exit), still in failing. null
// when the file is missing or a line cannot be read. ran: { file: ok } for each test file the
// runner finished, its verdict as its exit code alone would give it; load: the files whose output
// or failures show a module that could not load (the reporter's done and load lines, which are no
// test's result and are in no other list).
export function readResults(file, root) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { return null; }
  const failing = [];
  const passing = [];
  const reported = new Set();
  const whole = new Set();
  const ran = {};
  const load = new Set();
  for (const l of text.split('\n').filter(Boolean)) {
    let e;
    try { e = JSON.parse(l); } catch { return null; }
    if (!e || !Array.isArray(e.path) || !e.path.length || !e.path.every((x) => typeof x === 'string')) return null;
    const f = typeof e.file === 'string' ? (isAbsolute(e.file) ? relative(root, e.file) : e.file).split('\\').join('/') : '(unknown)';
    if (e.done === true) { ran[f] = e.ok === true && ran[f] !== false; continue; }
    if (e.load === true) { load.add(f); continue; }
    reported.add(f);
    if (e.whole === true && e.ok !== true) whole.add(f);
    if (e.type === 'suite') continue;
    (e.ok === true ? passing : failing).push({ file: f, name: e.path.map((x) => x.replace(/\\/g, '\\\\').replace(/>/g, '\\>')).join(' > ') });
  }
  return { failing, passing, reported: [...reported], whole: [...whole], ran, load: [...load] };
}
export const readFailing = (file, root) => readResults(file, root)?.failing ?? null;

// GAT-5: lock files installed where they sit, without the GitHub tokens. The gate
