// ===== file: ledger-base.test.mjs (continued) =====

// compare of the pushed branch: the job's start) moved to the merged tip.
test('C36: in a shallow clone, after publish\'s local merge of the layer, the base is the merged tip and the ledger check passes', async () => {
  const { mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { shallowBase } = await import('../lib/job.mjs');
  const { fetchBranch } = await import('../lib/util.mjs');
  const { root, start, tip } = layer();
  // origin: the layer tip with the sibling's land, the job branch as pushed before the merge.
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['push', '-q', bare, 'layer/12', 'job/si~1:refs/heads/job/si'], { cwd: root });
  const c = join(mkdtempSync(join(tmpdir(), 'p3-clone-')), 'c');
  git(['clone', '-q', '--depth', '1', '--branch', 'job/si', `file://${bare}`, c], { cwd: tmpdir() });
  for (const [k, v] of [['user.name', 't'], ['user.email', 't@t']]) git(['config', k, v], { cwd: c });
  fetchBranch(c, 'layer/12');
  // job sync deepens as far as the merge needs (job.mjs); here a few commits, the clone kept shallow below them.
  git(['fetch', '-q', '--deepen=2', 'origin', 'job/si', 'layer/12'], { cwd: c });
  git(['merge', '-q', '--no-edit', 'refs/remotes/origin/layer/12'], { cwd: c });
  const read = (slug, base, head) => ({ merge_base_commit: { sha: git(['merge-base', base, head], { cwd: bare }) }, ahead_by: Number(git(['rev-list', '--count', `${base}..${head}`], { cwd: bare })) });
  const stale = shallowBase(c, 'o/r', 'layer/12', 'job/si', read);
  assert.equal(stale, start, 'GitHub\'s base of the pushed branch: the job\'s start');
  assert.ok(checkLedger(c, { base: stale, branch: 'job/si' }).some((f) => /prov\.json/.test(f.file)), 'the copy\'s refusal');
  const base = baseAfterMerge(c, stale, 'refs/remotes/origin/layer/12');
  assert.equal(base, tip);
  assert.deepEqual(checkLedger(c, { base, branch: 'job/si' }), []);
});

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
// release also doesn't identify flaws"; coordinator, 8 Nov: an install of the cut, signed release
// artifact onto a p3dev- deployment, through the release's own installer path, and its walk). No
// path does that install yet: not process-dev-release (it cuts and publishes the draft only), not a
// release-tier install-from-scratch or upgrade fixture (none in the product's workflows), not the
// installer module (an interactive sign-in, its Worker pasted by hand). The act is named, with the
// gap, and nothing is deployed or recorded: no deploy step is invented. Exit 1.
export function deployRelease(root, version, { log = console.log } = {}) {
  if (typeof version !== 'string' || !version.trim()) fail('deploy release <version>, the development release to install on a p3dev- deployment and walk');
  log(`deploy release ${version}: the release deployment and its walk (BD-R1): the cut, signed release ${version} installed onto a p3dev- deployment, then walked; a clean walk lets the tranche close, and its findings open the next round`);
  log(`GAP: ${RELEASE_PATH_GAP}; nothing deployed, nothing recorded; brought to Bob through the coordinator`);
  return { ok: false, gap: RELEASE_PATH_GAP };
}

// ===== file: measures.test.mjs (later part) =====

  const on = JSON.parse((await cli(clone, ['metrics', 'survival'])).out);
  assert.deepEqual(on.prs.map((p) => [p.pr, p.tranche, p.main, p.survived]), [[1, 'stands', 'stands', true]]);
});

test('lead times: each figure from its rows, beside its target, over marked, unmeasured where a row is missing', async () => {
  const root = withOrigin();
  const t = (min) => new Date(Date.parse('2026-11-01T00:00:00Z') + min * 60000).toISOString();
  const at = (min, fn) => { const e = { ...process.env }; process.env.GIT_COMMITTER_DATE = process.env.GIT_AUTHOR_DATE = t(min); try { fn(); } finally { process.env = e; } };
  at(0, () => commit(root, { 'process/ledger/a.json': { id: 'a', status: { state: 'WORKING' } } }, 'a working'));
  at(40, () => commit(root, { 'process/ledger/a.json': { id: 'a', status: { state: 'BLOCKED', reason: 'x' } } }, 'a blocked'));
  at(85, () => commit(root, { 'process/ledger/a.json': { id: 'a', status: { state: 'WORKING' } } }, 'a again'));
  const rows = [
    { at: t(5), module: 'a', row: 'attempt', event: 'start' }, { at: t(100), module: 'a', row: 'attempt', event: 'complete', pr: 7 },
    { at: t(130), module: 'a', row: 'merge', pr: 7 }, { at: t(70), module: 'b', row: 'attempt', event: 'start' },
    { at: t(120), module: 'c', row: 'attempt', event: 'start' },
  ];
  // c is BLOCKED on its own job branch (job block commits there), not merged: open, counted to now.
  const back = git(['rev-parse', 'HEAD'], { cwd: root });
  at(150, () => commit(root, { 'process/ledger/c.json': { id: 'c', status: { state: 'BLOCKED', reason: 'x' } } }, 'c blocked'));
