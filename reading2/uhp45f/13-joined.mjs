// ===== file: base-red.test.mjs (continued) =====

  });
  const e = { ...entry('alpha'), tests: ['test/alpha/'] };
  assert.deepEqual(reachers(root, e, 'test/alpha/sib.mjs'), ['test/alpha/a.test.mjs', 'test/alpha/c.test.mjs']);
  assert.deepEqual(reachers(root, e, 'test/alpha/b.test.mjs'), ['test/alpha/b.test.mjs']);
});

// ===== file: basered.mjs (later part) =====

  for (const k of [...NO_TOKENS, 'NODE_TEST_CONTEXT']) delete env[k];
  const fd = openSync(logFile, 'a');
  let child;
  try {
    // The shell writes the exit status even when node dies, so the wait never outlives it.
    child = spawn('/bin/sh', ['-c', '"$0" "$1" "$2"; echo $? > "$3"', process.execPath, PREP, argsFile, exitFile], { cwd: dir, stdio: ['ignore', fd, fd], env, detached: true });
    child.on('error', () => {});
    child.unref();
  } finally { closeSync(fd); }
  const started = Date.now();
  let done = false;
  // The wrapper still runs: spawned, and neither gone nor a zombie (never reaped while the gate
  // runs synchronously). Where /proc cannot be read, the wait's deadline bounds it.
  const alive = () => {
    if (!child?.pid) return false;
    try { process.kill(child.pid, 0); } catch (e) { return e.code === 'EPERM'; }
    try { return readFileSync(`/proc/${child.pid}/stat`, 'utf8').replace(/^.*\) /s, '')[0] !== 'Z'; } catch { return true; }
  };
  // The whole group, verdict or not: an install's or a build's descendants outlive a timeout's kill.
  // A member that is a zombie is gone: the killed shell stays one, never reaped while the gate runs
  // synchronously, and kill(-group, 0) still finds it (copy of ci, 5 Nov: every drop waited its
  // full 5 s, and the tool's tests passed the job's 10 minutes). Read from /proc where it can be.
  const group = () => {
    try { process.kill(-child.pid, 0); } catch (e) { return e.code === 'EPERM'; }
    let names;
    try { names = readdirSync('/proc'); } catch { return true; }
    return names.some((n) => {
      if (!/^\d+$/.test(n)) return false;
      try { const f = readFileSync(`/proc/${n}/stat`, 'utf8').replace(/^.*\) /s, '').split(' '); return Number(f[2]) === child.pid && f[0] !== 'Z'; } catch { return false; }
    });
  };
  const stop = () => {
    done = true;
    if (!child?.pid) return;
    try { process.kill(-child.pid, 'SIGKILL'); } catch { return; }
    for (const until = Date.now() + 5000; group() && Date.now() < until;) nap(50);
  };
  // Before the scratch directories' own exit hook removes the tree the install still writes to.
  process.prependOnceListener('exit', stop);
  log(`base-red: the base ${base.slice(0, 10)}'s tree is prepared beside the head's install`);
  return {
    base, wt, dir, used: false,
    // The prepared tree's verdict, waiting up to ms: { ok }, { ok: false, why }, or null when the
    // process ended without one (baseRed then prepares the tree inline).
    wait(ms) {
      const until = Date.now() + ms;
      while (!existsSync(exitFile) && Date.now() < until && alive()) nap(200);
      const ended = existsSync(exitFile);
      if (!ended && !alive()) { done = true; log('base-red: the background preparation is gone without a verdict: the tree is prepared here'); return null; }
      const text = (() => { try { return readFileSync(logFile, 'utf8'); } catch { return ''; } })();
      for (const l of text.split('\n').filter(Boolean).slice(-40)) log(l);
      if (!ended) { stop(); return { ok: false, timedOut: true, why: `the base's tree was not ready within ${Math.round((Date.now() - started) / 1000)} s` }; }
      done = true;
      try { const r = JSON.parse(readFileSync(out, 'utf8')); log(`base-red: the base's tree was prepared in the background (${Math.round((statSync(out).mtimeMs - started) / 1000)} s after the gate started it)`); return r; } catch {
        log(`base-red: the background preparation ended without a verdict (exit ${String(readFileSync(exitFile, 'utf8')).trim()}): the tree is prepared here`);
        return null;
      }
    },
    drop() {
      stop();
      process.removeListener('exit', stop);
      // A process not yet gone may still add a file while the tree is removed: once more, then leave it to the sweep.
      try { drop(); } catch { nap(500); try { drop(); } catch { /* the next withTemp sweeps it */ } }
    },
    // The process group killed as the OOM killer would, the exit status unwritten (tests).
    kill() { if (child?.pid) { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* gone */ } } },
  };
}

// Runs the PR's failing tests at the base and says which are tolerated. failing: runSuite's
// `failing` on the PR's run. cfg: the trusted config (its lock files). rows: the generated rows.
// prepared: startBase's handle, used when it is for this base and not used yet.
// Returns { ok, why?, base_red?: { base, tests, run } }; the base's run is the evidence.
export function baseRed(root, entry, { base, failing, cfg, rows = [], timeout, exec = run, log = () => {}, prepared = null }) {
  const no = (why, extra = {}) => ({ ok: false, why, ...extra });
  if (!base) return no('no base to compare with');
  if (!failing) return no('the failing tests could not be read per test (only the node test runner, naming no reporter of its own, is)');
  if (!failing.length) return no('the suite failed with no failing test to compare (a crash, a timeout or a load failure outside any test)');
  if (failing.length > MAX_BASE_RED) return no(`${failing.length} tests fail, over the ${MAX_BASE_RED} a base-red run may tolerate`);
  const files = [...new Set(failing.map((t) => t.file))];
  const missing = files.filter((f) => !exists(root, base, f));
  if (missing.length) return no(`new failing test file(s) not on the base: ${missing.slice(0, 5).join(', ')}`);
  const end = Date.now() + timeout;
  const left = () => Math.max(1000, end - Date.now());
  const opts = { lockfiles: cfg.lockfiles || [], rows, exec, log };
  if (prepared && !prepared.used && prepared.base === base) {
    prepared.used = true;
    try {
      const p = prepared.wait(left());
      const altered = p?.ok ? changedInTree(root, base, prepared.wt) : null;
      if (p?.ok && !altered) return compareAt(root, entry, prepared.wt, prepared.dir, { base, failing, files, left, log });
      if (altered) log(`base-red: ${altered} in the base's tree prepared beside the head is not the base's: the tree is prepared here`);
      // Prepared beside the head, at a lower priority, on a deadline from the gate's start: a
      // failed install or build there may be the head's load or time, not the base's. Prepared
      // again here with base-red's own budget (review of build gate-speed).
      if (p?.timedOut) return no(p.why);
      if (p && !p.ok) log(`base-red: the background preparation refused (${p.why}): the tree is prepared here`);
    } catch (e) {
      return no(`the base's tree could not be prepared: ${String(e.message).slice(0, 300)}`);
    } finally { prepared.drop(); }
  }
  return withTemp('p3-base-red-', (tmp) => { const wt = join(tmp, 'base'); try {
    const p = prepareTree(root, base, wt, { ...opts, timeout: left() });
    if (!p.ok) return no(p.why);
    return compareAt(root, entry, wt, tmp, { base, failing, files, left, log });
  } catch (e) {
    return no(`the base's tree could not be prepared: ${String(e.message).slice(0, 300)}`);
  } });
}

// The base's run of the failing files in the prepared tree wt, and the verdict.
function compareAt(root, entry, wt, tmp, { base, failing, files, left, log }) {
  const no = (why, extra = {}) => ({ ok: false, why, ...extra });
  // A failing test's file is where its test() was called: a sibling module a test file imports
  // runs nothing alone, so the base runs the test files that reach it; they must be the same
  // here and at the base, or the base's count of a test's failures is over other runs of it.
  const runs = new Map(); // file -> the test files that reach it at the base
  const differ = new Map();
  for (const f of files) {
    const there = reachers(wt, entry, f);
    const here = reachers(root, entry, f);
    runs.set(f, there);
    if (there.join('\n') !== here.join('\n')) differ.set(f, `the test files reaching it differ, here ${here.join(', ') || 'none'}, at the base ${there.join(', ') || 'none'}`);
  }
  const toRun = [...new Set([...runs.values()].flat())].sort();
  const unreached = files.filter((f) => !runs.get(f).length);
  const s = toRun.length ? runSuite(wt, entry, toRun, { timeout: left(), events: join(tmp, 'failing.jsonl') }) : null;
  const evidence = s ? { base, cmd: s.cmd, exit: s.exit, seconds: s.seconds, tests: s.tests, ...(s.timedOut ? { timed_out: true } : {}) } : { base, cmd: null };
  if (s && !s.failing) return no(`the base's run of ${toRun.length} file(s) could not be read per test (exit ${s.exit})`, { run: evidence });
  const reported = new Set(s ? s.reported : []);
  const whole = new Set(s ? s.whole : []);
  const red = counted(s ? s.failing : []);
  const green = new Set(s ? s.passing.map(testId) : []);
  const why = (f) => !runs.get(f).length ? 'not a test file the suite runs, and no test file at the base imports it'
    : s.timedOut ? `the run timed out after ${Math.round(s.seconds)} s`
      : runs.get(f).some((t) => whole.has(t)) ? `${runs.get(f).filter((t) => whole.has(t)).join(', ')} failed as a whole there (a load failure or an early exit), exit ${s.exit}`
        : !reported.has(f) ? `no result from it, exit ${s.exit}${runs.get(f)[0] === f ? '' : ` running ${runs.get(f).join(', ')}`}` : null;
  const passes = [];
  const lacks = [];
  const fewer = [];
  const open = new Map();
  const unlike = new Set();
  for (const [id, n] of counted(failing)) {
    const f = id.slice(0, id.indexOf('::'));
    // Not even a matching count: at the base it may come from another file's run of the test.
    if (differ.has(f)) { unlike.add(f); continue; }
    if ((red.get(id) || 0) >= n) continue;
    const w = why(f);
    if (w) open.set(f, w);
    else (red.get(id) ? fewer : green.has(id) ? passes : lacks).push(id);
  }
  const at = base.slice(0, 10);
  log(`base-red: of ${failing.length} failing test(s), ${passes.length} pass at the base ${at}, ${lacks.length} are missing there, ${fewer.length} fail there fewer times, ${[...open.keys()].length} file(s) the base run did not complete${unreached.length ? `; ${unreached.length} reached by no test file` : ''}`);
  const parts = [];
  if (passes.length) parts.push(`${passes.length} failing test(s) pass at the base ${at}: ${passes.slice(0, 5).join('; ')}`);
  if (lacks.length) parts.push(`${lacks.length} failing test(s) are missing at the base ${at}, whose run reported their files: ${lacks.slice(0, 5).join('; ')}`);
  if (fewer.length) parts.push(`${fewer.length} failing test(s) fail fewer times at the base ${at} than here: ${fewer.slice(0, 5).join('; ')}`);
  if (open.size) parts.push(`the base run did not complete for ${[...open].slice(0, 5).map(([f, w]) => `${f} (${w})`).join(', ')}: no verdict on its tests; rerun`);
  if (unlike.size) parts.push(`no base-red verdict for ${[...unlike].slice(0, 5).map((f) => `${f} (${differ.get(f)})`).join(', ')}`);
  if (parts.length) return no(parts.join('; '), { run: evidence });
  return { ok: true, base_red: { base, tests: failing.map(testId), run: evidence } };
}

// ===== file: testdiff.mjs =====

// What a provider's test change means for its users (Bob, 6 Nov, R8 and its refinement "c"): a
// test naming a Public / Provides requirement is compared token by token, after what never counts
// is set aside (comments, formatting, test names, requirement-id labels, package imports).
//   none      nothing else changed;
//   additive  the only change adds keys or fields to object literals (an expected row gains
//             `pixels_sha256: null`), every existing token kept: a gate-only retest of each user;
//             A wholly new test file is additive (unless it replaces a deleted one: compared with it).
