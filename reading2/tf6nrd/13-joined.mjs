// ===== file: gate-speed.test.mjs (continued) =====

    ['a fixture of its tests names its directory', { 'test/alpha/paths.json': '["req"]\n' }, {}, /test\/alpha\/paths\.json, a file of its tests that is not a script/],
    ['a script elsewhere names it', { 'tools/check.mjs': "export const f = 'alpha.md';\n" }, {}, /tools\/check\.mjs, outside its tests, names alpha\.md/],
  ];
  for (const [what, files, alpha, why] of cases) {
    const s = reqOnly(files, alpha);
    const r = run(s, exempt(s));
    // All three files run; the red one, red at the base too, is base-red.
    assert.deepEqual([r.run.suite, r.run.tests[0].total], ['base-red', 3], what);
    assert.ok(r.lines.some((l) => why.test(l) && /the whole suite runs/.test(l)), `${what}: ${r.lines.join('\n')}`);
  }
  // Beside the tests, only the file's own name counts: its directory's word is prose there.
  const w = reqOnly({ 'src/alpha/words.mjs': "export const msg = 'its req read x, not in words.json';\n" });
  assert.deepEqual(run(w, exempt(w)).run.tests, [{ total: 2, pass: 2, fail: 0 }]);
  // Named only in a comment that starts a line: not a reader.
  const c = reqOnly({ 'src/alpha/doc.mjs': '/* alpha: its requirements are\n * req/alpha.md */\n// see req/alpha.md\nexport const y = 1;\n' });
  assert.deepEqual(run(c, exempt(c)).run.tests, [{ total: 2, pass: 2, fail: 0 }]);
  // A plain pull request changing only the file is narrowed too.
  const p = reqOnly();
  git(['checkout', '-q', '-b', 'fix-words', p.head], { cwd: p.root });
  const plain = run(p, null, { branch: 'fix-words' });
  assert.deepEqual([plain.run.scope, plain.run.suite, plain.run.tests], [['alpha'], 'pass', [{ total: 2, pass: 2, fail: 0 }]]);
});

// ===== file: pace.mjs (later part) =====

// Whether a new session may start (job start, lane start): not while GitHub is paused or the tool
// stopped, nor while the last hour's content-creating requests or the primary limit are at target
// (a new session adds both). Returns the reason, or null.
export function budgetGate(cwd, { p = pacing(), now = Date.now(), rateLimit } = {}) {
  const lim = p.github_limits || GITHUB_LIMITS;
  const s = shared.read();
  const pause = pauseOf(cwd, s);
  if (pause?.stopped) return `GitHub refused this account again within an hour of an earlier refusal (${pause.why}): the tool is stopped until the coordinator runs github resume`;
  if (pause?.until && Date.parse(pause.until) > now) return `GitHub rate-limited this account until ${pause.until} (${pause.why})`;
  const h = usage(cwd, { t: now, seconds: 3600, read: s });
  if (h.pushes >= p.pushes_per_hour) return `${h.pushes} pushes in the last hour account-wide, the process's own ceiling ${p.pushes_per_hour} (PD-3): a new session waits for the window`;
  if (h.content >= Math.floor(p.target * lim.content_per_hour)) return `${h.content} of GitHub's ${lim.content_per_hour} content-creating requests an hour used account-wide, the target ${Math.round(p.target * 100)}%: a new session waits for the window`;
  const pr = primaryState(cwd, { t: now, ...(rateLimit ? { read: rateLimit } : {}) });
  if (pr && pr.limit - pr.remaining >= Math.floor(p.target * pr.limit) && pr.reset > now) return `${pr.limit - pr.remaining} of the primary limit's ${pr.limit} an hour used, the target ${Math.round(p.target * 100)}%, until ${iso(pr.reset)}`;
  return null;
}

// git fetch, clone and ls-remote: logged (kind fetch), shown in the budget; GitHub publishes no
// limit on them and the process sets no ceiling (R17c, coordinator's item B).
// What a fetch is for (R17f, coordinator's C12 part 2: the shared rows could not say which fetches
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

// ===== file: p3.mjs (later part) =====

    for (const x of specs) {
      if (x.includes('*')) fail(`github push: ${x}: no wildcard refspec; push one branch at a time`);
      const dst = (x.includes(':') ? x.split(':').pop() : x).replace(/^refs\/heads\//, '');
      if (!dst) fail(`github push: ${x}: no empty destination (a delete)`);
      if (dst === 'main') fail(`github push: ${x}: never to main; main moves only through the tranche's pull request (Bob's standing approvals)`);
    }
    for (const k of [`remote.${remote}.mirror`, `remote.${remote}.push`]) {
      const v = git(['config', '--get-all', k], { cwd: root, allowFail: true }).stdout.trim();
      if (v && !(k.endsWith('.mirror') && v === 'false')) fail(`github push: ${k} is set in this clone (${v.split('\n')[0]}): it can force or delete; unset it first`);
    }
    const r = git(['push', ...(a['set-upstream'] ? ['-u'] : []), ...(a.quiet ? ['-q'] : []), remote, ...specs], { cwd: root, allowFail: true });
    if (r.stdout.trim()) console.log(r.stdout.trim());
    if (r.stderr.trim()) console.error(r.stderr.trim());
    return r.code === 0 ? 0 : 1;
  },
  switch: (a, root) => {
    const sub = a._[0];
    if (sub === 'out') return (switchOut(root, { tasks: a.tasks, sessions: a.sessions, by: a.by, dryRun: !!a['dry-run'] }), 0);
    if (sub === 'in') { const r = switchIn(root, { sessions: a.sessions, by: a.by, approvals: a.approvals, preflight: !!a.preflight }); return r.ok === false ? 1 : 0; }
    if (sub === 'quiet') return switchQuiet(root, { ...(a.minutes !== undefined ? { minutes: a.minutes } : {}) }).ok ? 0 : 1;
    fail('switch out --tasks <file> --sessions <file> --by <session> [--dry-run] | switch in --sessions <file> --by <session> [--approvals <hash>] | switch in --preflight --by <session> | switch quiet [--minutes <n>]');
  },

  // watch --session <the watcher's id> [--full | --escalated <minutes>]: the watcher's decision,
  // daily or at once on an escalation.
  watch: (a, root) => { watch(root, { session: a.session, full: !!a.full, escalated: a.escalated }); return 0; },

  // address <root|bob|watcher|coordinator>: the address as the state branch holds it now;
  // the coordinator's, else `coordinator` in process/config.json.
