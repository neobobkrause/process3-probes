// ===== file: layout.mjs (continued) =====

  const follows = [];
  for (const k of MOVABLE_KEYS) {
    const v = typeof cfg[k] === 'string' ? norm(cfg[k]) : null;
    if (!v || moves.some((m) => m.key === k)) continue;
    const m = moves.find((x) => v !== x.from && underPath(v, x.from));
    if (m) follows.push({ key: k, to: `${m.to}${v.slice(m.from.length)}` });
  }
  return { moves, skipped, follows };
}

export const planLines = ({ moves, skipped, follows }) => [
  ...(moves.length ? moves.map((m) => `move ${m.from} -> ${m.to}${m.key ? ` (${CONFIG_FILE} ${m.key})` : ''}${m.note ? `; note: ${m.note}` : ''}`) : [`nothing to move: the process-only paths the tool reads are under ${PROCESS_DIR}/ or absent`]),
  ...(follows || []).map((f) => `key ${f.key} -> ${f.to} (inside a moved folder)`),
  ...skipped.map((s) => `skip ${s.from}: ${s.why}`),
];

// status --role bob's hint: the built-in paths still outside process/, never a refusal.
export function layoutHint(root, cfg) {
  try {
    const { moves } = layoutPlan(root, { cfg });
    return moves.length ? `layout: ${moves.length} process-only path(s) outside ${PROCESS_DIR}/ (${moves.map((m) => m.from).join(', ')}): \`layout move\` prints the plan` : null;
  } catch { return null; }
}

// The config text with only the moved keys rewritten, the rest of it byte for byte. Each change is
// { key, to }; a key with a scalar value (a string, null, a number, a boolean) is rewritten where it
// stands, an absent one added. The text read back must give each key its new value, else refused.
const SCALAR = String.raw`(?:"(?:[^"\\]|\\.)*"|null|true|false|-?\d[\d.eE+-]*)`;
export function rewriteConfig(text, changes) {
  let out = text;
  const cfg = parseJSON(text);
  const keyed = changes.filter((m) => m.key);
  for (const m of keyed) {
    const pattern = new RegExp(`("${m.key}"\\s*:\\s*)${SCALAR}`);
    if (Object.hasOwn(cfg, m.key)) {
      if (!pattern.test(out)) fail(`layout move: ${m.key} in ${CONFIG_FILE} is not a path or null; set it by hand first`);
      out = out.replace(pattern, (_, k) => `${k}${JSON.stringify(m.to)}`);
    } else {
      const at = out.lastIndexOf('}');
      if (at < 0) fail(`${CONFIG_FILE} is not a JSON object`);
      const body = out.slice(0, at).trimEnd();
      const comma = body.endsWith('{') ? '' : ',';
      out = `${body}${comma}\n  ${JSON.stringify(m.key)}: ${JSON.stringify(m.to)}\n${out.slice(at)}`;
    }
  }
  let back;
  try { back = parseJSON(out); } catch (e) { fail(`layout move: ${CONFIG_FILE} would not read back (${e.message})`); }
  for (const m of keyed) if (back[m.key] !== m.to) fail(`layout move: could not rewrite ${m.key} in ${CONFIG_FILE} (the first "${m.key}" in its text is not the top-level one); set it by hand`);
  return out;
}

export function layoutMove(root, { apply = false, also = [], log = console.log } = {}) {
  const cfg = loadConfig(root);
  const plan = layoutPlan(root, { cfg, also });
  for (const l of planLines(plan)) log(l);
  if (!apply) {
    if (plan.moves.length) log(`then, on a branch from ${cfg.tranche}: layout move --apply${list(also).map((p) => ` --also ${p}`).join('')}; open its pull request into ${cfg.tranche} and land it with the merge tool`);
    return { ...plan, applied: false };
  }
  if (!plan.moves.length) return { ...plan, applied: false };
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root });
  if (branch === 'HEAD' || branch === cfg.tranche || branch === 'main') fail(`layout move --apply runs on a working branch from ${cfg.tranche}, not ${branch === 'HEAD' ? 'a detached HEAD' : branch}`);
  if (git(['status', '--porcelain', '--untracked-files=no'], { cwd: root })) fail('layout move --apply needs a clean checkout: commit or set aside the changes first');
  // Any failure from the first move to the commit puts the checkout back as it was (cold review).
  const undo = () => { git(['reset', '-q', '--hard', 'HEAD'], { cwd: root, allowFail: true }); };
  try {
    mkdirSync(join(root, PROCESS_DIR), { recursive: true });
    for (const m of plan.moves) {
      const r = git(['mv', '--', m.from, m.to], { cwd: root, allowFail: true });
      if (r.code !== 0) fail(`layout move: git mv ${m.from} ${m.to} failed (${r.stderr.trim()}); nothing was committed`);
    }
    const changes = [...plan.moves.filter((m) => m.key), ...plan.follows];
    if (changes.length) {
      const p = join(root, CONFIG_FILE);
      writeFileSync(p, rewriteConfig(existsSync(p) ? readFileSync(p, 'utf8') : '{\n}\n', changes));
      git(['add', '--', CONFIG_FILE], { cwd: root });
    }
    git(['commit', '-q', '-m', `layout move: process-only paths into ${PROCESS_DIR}/ (C41)\n\n${plan.moves.map((m) => `${m.from} -> ${m.to}`).join('\n')}`], { cwd: root });
  } catch (e) { undo(); throw e; }
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  log(`committed ${sha} on ${branch}: push it, open its pull request into ${cfg.tranche}, and land it with the merge tool`);
  return { ...plan, applied: true, sha };
}

// ===== file: deploy.mjs (later part) =====

      log(`::group::${redact(`${stage}: ${argv.join(' ')}`, masks)}`);
      const timeout = deadline ? Math.max(1, deadline - Date.now()) : dep.timeout_minutes * MINUTE;
      const r = io.exec(argv[0], argv.slice(1), { cwd: root, timeout, unset: [...NO_TOKENS, 'NODE_TEST_CONTEXT', ...unset], ...(env ? { env } : {}) });
      collectMasks(r.stdout, masks);
      collectMasks(r.stderr, masks);
      keepStep(logs, results.length + 1, stage, redact(r.stdout, masks), redact(r.stderr, masks), put);
      log('::endgroup::');
      const res = { stage, name: redact(argv.join(' '), masks), exit: r.code, seconds: Math.round(r.seconds) };
      if (r.timedOut) res.timed_out = true;
      if (guard) res.guard = r.stdout.split('\n').some((l) => l.trim() === dep.guard_line);
      results.push(res);
      log(`${res.name}: exit ${r.code}, ${res.seconds} s${r.timedOut ? ', timed out' : ''}${guard ? `, guard ${res.guard ? 'printed' : 'NOT printed'}` : ''}`);
      if (r.code !== 0 || (guard && !res.guard)) return false;
    }
    return true;
  };
  go.results = results;
  return go;
}

// The lock files are installed, then the generated files the tranche does not commit (over
// max_file_bytes, say) are built, as release run does (copy, 4 Nov: a fresh checkout's build
// failed on esbuild, the npm ci being only in the dry run that came after it).
function prepare(root, cfg, dep, { io, log, ref, results }) {
  const exec = (c, args, o) => io.exec(c, args, { timeout: dep.timeout_minutes * MINUTE, ...o, unset: [...NO_TOKENS, 'NODE_TEST_CONTEXT'] });
  const inst = install(root, cfg.lockfiles || [], { exec });
  const b = inst.findings.length ? { built: [], findings: inst.findings } : buildGenerated(root, generatedRows(cfg).rows, { ref, timeout: dep.timeout_minutes * MINUTE, log, exec });
  if (b.built.length || b.findings.length) results.push({ stage: 'build', name: `${inst.findings.length ? 'install' : 'generated'}: ${[...b.built, ...b.findings.map((f) => f.file)].join(', ')}`, exit: b.findings.length ? 1 : 0, seconds: 0 });
  for (const f of b.findings) log(`${f.check}: ${f.file}: ${f.message}`);
  return b;
}

// The internal walk (K4781: offline, Miniflare on loopback): its steps within its one timeout,
// without the deploy's secrets (the config's "environment" names, any CLOUDFLARE_ or CF_ variable);
// its reports read raw as soon as it ends.
function internalWalk(root, cfg, dep, go, log) {
  const iw = dep.internal_walk;
  const t0 = Date.now();
  log(walkLine(dep.concurrency, false));
  const unset = [...(Array.isArray(cfg.environment) ? cfg.environment : []), ...Object.keys(process.env).filter((k) => /^(CLOUDFLARE|CF)_/.test(k))];
  const from = go.results.length;
  go('internal_walk', iw.run, { deadline: t0 + iw.timeout_minutes * MINUTE, unset, env: walkEnv(dep.concurrency, false) });
  const ran = go.results.slice(from);
  const last = ran.at(-1);
  return { exit: last.exit, timed_out: ran.some((x) => x.timed_out), seconds: Math.round((Date.now() - t0) / 1000), read: iw.reports.map((p) => ({ from: p, ...readReport(root, p, t0, cfg.max_file_bytes) })) };
}

// Every group's reports masked with every mask any of them declares (a JSON report's escaped form
// too), each to be stored under its group's dir, or recorded as not stored over max.
function keepReports(groups, masks, max) {
  for (const g of groups) for (const k of g.read) if (k.raw !== undefined) collectMasks(k.raw, masks);
  for (const v of [...masks]) masks.add(JSON.stringify(v).slice(1, -1));
  return groups.map((g) => g.read.map((k) => {
    if (k.raw === undefined) return k;
    const text = redact(k.raw, masks);
    const bytes = Buffer.byteLength(text);
    return bytes > max ? { from: k.from, stored: `not stored, ${bytes} bytes` } : { from: k.from, text, stored: `${g.dir}/${basename(k.from)}` };
  }));
}
const summarize = (kept) => {
  const j = kept.find((k) => k.text !== undefined && k.from.endsWith('.json'));
  return { ...(j ? walkSummary(j.text) : {}), reports: kept.map((k) => ({ from: k.from, stored: k.stored })) };
};
// The internal walk's part of a row: its counts, ok (exit 0, in time, no failures), exit, seconds.
function innerRow(inner, kept, log) {
  const sum = summarize(kept);
  const r = { ...sum, ok: inner.exit === 0 && !inner.timed_out && !sum.failures, exit: inner.exit, ...(inner.timed_out ? { timed_out: true } : {}), seconds: inner.seconds };
  log(`internal walk: ${r.timed_out ? 'timed out; ' : ''}exit ${r.exit}, ${r.seconds} s; ${r.steps !== undefined ? `${r.steps} steps, ${r.steps_ok} ok, ${r.failures} failures ${JSON.stringify(r.by_kind)}; ` : ''}${kept.map((k) => `${k.from} ${k.stored}`).join('; ') || 'no reports'}`);
  return r;
}

// walk internal: the internal walk alone, any time, at the clean checkout's commit, no deploy and
// no deploy row; its reports under walks/internal/<commit>-<UTC time>/ on the state branch.
export function walkInternal(root, { log = console.log, io: given = {} } = {}) {
  const io = { ...defaultIO, ...given };
  const cfg = loadConfig(root);
  const dep = deployConfig(cfg);
  if (!dep.internal_walk) fail('deploy.internal_walk is not set in process/config.json: there is no internal walk to run');
  const dirty = git(['status', '--porcelain', '--untracked-files=no'], { cwd: root });
  if (dirty) fail(`the checkout has uncommitted changes: ${dirty.split('\n').slice(0, 3).join('; ')}`);
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  const logs = io.logDir || mkdtempSync(join(tmpdir(), 'p3-deploy-internal-walk-'));
  log(`internal walk at ${head.slice(0, 10)}; each step's whole output is kept under ${logs}`);
  const masks = new Set();
  const go = stepRunner(root, { io, log, logs, masks, results: [], dep, slug: '' });
  if (prepare(root, cfg, dep, { io, log, ref: head, results: go.results }).findings.length) { log('the build failed: no internal walk ran, nothing recorded'); return { ok: false }; }
  const inner = internalWalk(root, cfg, dep, go, log);
  const dir = `walks/internal/${head.slice(0, 10)}-${now().replace(/[:.]/g, '-')}`;
  const [kept] = keepReports([{ dir, read: inner.read }], masks, cfg.max_file_bytes);
  const r = innerRow(inner, kept, log);
  const stored = kept.filter((k) => k.text !== undefined);
  for (const k of stored) writeFileSync(join(logs, `report-${basename(k.from)}`), k.text);
  if (stored.length) writeState(root, cfg.state_branch, `internal walk at ${head.slice(0, 10)}: ${r.ok ? 'ok' : 'findings'}`, (wt) => { for (const k of stored) { mkdirSync(join(wt, dir), { recursive: true }); writeFileSync(join(wt, k.stored), k.text); } });
  if (!r.ok) log(`its findings enter as found marks: \`${P3} found <module> "<finding>" --from "internal walk ${head.slice(0, 10)}"\``);
  return { ok: r.ok, internal_walk: r };
}

// deploy release <version> (BD-R1, Bob, 8 Nov: "the release deployment happens, and the walk of the
