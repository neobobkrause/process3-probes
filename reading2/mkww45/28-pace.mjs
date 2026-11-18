let waitCap = 0;
let rerunText = null;
export function hookPacing(fn, { longestMs = 120e3, rerun = 'the tool call (retry it)' } = {}) { const was = [waitCap, rerunText]; waitCap = longestMs; rerunText = rerun; try { return fn(); } finally { [waitCap, rerunText] = was; } }

// Before any act on GitHub: the stop, the pause, the primary limit, each window at target (and the
// push ceiling for a push), then the per-clone floor; logs the act. Throws Paced to refuse. The ledger
// is read within READ_S (ls-remote past it, a fetch only when it moved), and again after each wait.
export function reserve(cost, label, cwd, { p = pacing(), now = Date.now, sleep = nap, rateLimit, kind = 'gh', extra = {} } = {}) {
  const content = cost.content === true ? 1 : Number(cost.content) || 0;
  const lim = p.github_limits || GITHUB_LIMITS;
  const target = p.target;
  // Every check again after each wait (cold review of R17): a pause or stop another session wrote
  // while this one slept is obeyed. Four waits at most, then the call is refused.
  for (let round = 0; ; round++) {
    // Fresh after a wait (a pause another session wrote meanwhile); else within READ_S (C12).
    const s = shared.read({ fresh: round > 0 });
    const pause = pauseOf(cwd, s);
    if (pause?.stopped) throw new Paced(`GitHub budget: GitHub refused this account again within an hour of an earlier refusal (${pause.why}; at ${pause.at} by ${pause.session || 'a session'}): every GitHub call is stopped. Tell the coordinator; it runs \`${TOOL} github resume --by <its session>\` once the account is in good standing; then rerun ${rerunLine()}`);
    let wait = null;
    if (pause?.until && Date.parse(pause.until) > now()) wait = [Date.parse(pause.until), `GitHub rate-limited this account (${pause.why})`];
    if (!wait && cost.primary) {
      const pr = bucket(primaryState(cwd, { t: now(), ...(rateLimit ? { read: rateLimit } : {}) }), cost);
      if (pr && pr.limit > 0 && pr.limit - pr.remaining >= Math.floor(target * pr.limit) && pr.reset > now()) wait = [pr.reset, `${pr.limit - pr.remaining} of the ${cost.graphql ? 'GraphQL ' : ''}primary limit's ${pr.limit} an hour used, the target ${Math.round(target * 100)}%`];
    }
    if (!wait) {
      const rows = readLog(cwd);
      for (const [seconds, field, cap, add, name] of [
        [60, 'points', lim.rest_points_per_minute, cost.points || 0, 'REST points a minute'],
        [60, 'content', lim.content_per_minute, content, 'content-creating requests a minute'],
        [3600, 'content', lim.content_per_hour, content, 'content-creating requests an hour'],
        [3600, 'pushes', p.pushes_per_hour, cost.push ? 1 : 0, 'pushes an hour (the process\'s own ceiling, PD-3: GitHub publishes none)'],
      ]) {
        if (!add || wait) continue;
        const max = field === 'pushes' ? cap : Math.floor(target * cap);
        const used = usage(cwd, { t: now(), seconds, rows, read: s })[field];
        if (used + add > max) wait = [freedAt(cwd, { t: now(), seconds, field, need: used + add - max, rows, read: s }), `${used} of the ${cap} ${name} used account-wide, ${field === 'pushes' ? 'the ceiling' : `the target ${Math.round(target * 100)}%`} (${max})`];
      }
    }
    if (!wait) break;
    if (round >= 4) throw new Paced(`GitHub budget: still waiting after four waits (${wait[1]}); rerun ${rerunLine()} later`);
    shared.beforeWait?.();
    waitUntil(wait[0], wait[1], { now, sleep });
  }
  const ms = p.gh_interval_ms;
  if (ms > 0) {
    const f = join(commonDir(cwd), STAMP);
    let last = 0;
    try { last = Number(readFileSync(f, 'utf8')) || 0; } catch { last = 0; }
    const wait = last + ms - now();
    if (wait > 0) sleep(Math.min(wait, ms));
    try { writeFileSync(f, String(now())); } catch { /* best effort */ }
  }
  logEvent(kind, label, cwd, kind === 'push' ? extra : { points: cost.points || 0, ...(content ? { content } : {}), ...(cost.actions ? { actions: true } : {}), ...(cost.note ? { note: true } : {}), ...(cost.graphql ? { graphql: true } : {}), ...(cost.primary === false && !cost.note ? { free: true } : {}), ...extra }, now());
  // This clone's use reaches the other sessions during a long command too (cold review of R17).
  try { shared.share?.(); } catch { /* the budget's record; never the call's failure */ }
  return cost;
}
export function ghTurn(args, cwd, opts = {}) {
  const a = args.map(String);
  const repo = ghRepo(a, cwd);
  return reserve(classify(args), a.filter((x) => !x.startsWith('-')).slice(0, 3).join(' '), cwd, { ...opts, extra: repo ? { repo } : {} });
}
// The repository a gh call acts on (the audit's per-repository write count): its api path's
// repos/<owner>/<repo>, its --repo or -R, else this clone's origin.
export function ghRepo(a, cwd) {
  const path = a[0] === 'api' ? a.find((x, i) => i > 0 && /^\/?repos\/[^/]+\/[^/?]+/.test(x)) : null;
  if (path) return path.replace(/^\//, '').split('/').slice(1, 3).join('/').split('?')[0].toLowerCase();
  const ri = a.findIndex((x) => x === '--repo' || x === '-R');
  if (ri >= 0 && a[ri + 1]) return slugOf(a[ri + 1]) || String(a[ri + 1]).toLowerCase();
  return pushRepo(['push', 'origin'], cwd);
}
// Before a git push (every one the tool makes, and \`p3 github push\`): the pause, the stop and the
// push ceiling; logged. A --dry-run is no push. While exempt, logged only.
export function pushTurn(args, cwd, opts = {}) {
  if (args[0] !== 'push' || args.includes('--dry-run') || args.includes('-n')) return null;
  const label = args.filter((x) => !String(x).startsWith('-')).slice(1).join(' ');
  const repo = pushRepo(args, cwd);
  // A push to the state branch is told apart (the audit: GitHub runs no workflow on it).
  const dsts = pushPositionals(args).slice(1).map((x) => String(x).split(':').pop().replace(/^refs\/heads\//, ''));
  const extra = { ...(repo ? { repo } : {}), ...(dsts.length && dsts.every((d) => d === 'process-state') ? { state: true } : {}) };
  if (exempting) { logEvent('push', label, cwd, extra); return null; }
  return reserve({ push: true, points: 0, content: 0, primary: false }, label, cwd, { ...opts, kind: 'push', extra });
}
// The "<owner>/<repo>" a push goes to (R17c, the audit's per-repository count): its remote's URL,
// or the URL or path given; null when it cannot be read.
// A GitHub URL's "<owner>/<repo>", lower case; null for anything else (a local path, another host).
export const slugOf = (url) => { const u = String(url || '').trim().replace(/\/+$/, '').replace(/\.git$/, ''); const m = u.match(/github\.com[/:]([^/:]+)\/([^/:]+)$/) || (/^\w[\w.-]*\/\w[\w.-]*$/.test(u) ? u.match(/^([^/]+)\/([^/]+)$/) : null); return m ? `${m[1]}/${m[2]}`.toLowerCase() : null; };
// git push options that take a value: their value is not the remote (cold review of R17c).
const PUSH_VALUED = new Set(['-o', '--push-option', '--repo', '--receive-pack', '--exec']);
const pushPositionals = (args) => { const out = []; for (let i = 1; i < args.length; i++) { const x = String(args[i]); if (PUSH_VALUED.has(x)) { i++; continue; } if (!x.startsWith('-')) out.push(x); } return out; };
export function pushRepo(args, cwd) {
  const remote = pushPositionals(args)[0];
  if (!remote) return null;
  if (/[/:]/.test(remote)) return slugOf(remote);
  const r = spawnSync('git', ['config', '--get', `remote.${remote}.url`], { cwd: cwd || process.cwd(), encoding: 'utf8' });
  return r.status === 0 ? slugOf(r.stdout) : null;
}
// p3 github note --content <n> [--points <n>]: a session's own connector writes, recorded and
// reserved before it makes them, as a gh call would be.
export function noteTurn(cwd, { content = 0, points, what = 'connector writes' } = {}, opts = {}) {
  const n = Number(content);
  const pts = points === undefined ? 5 * n : Number(points);
  if (!(Number.isInteger(n) && n >= 0) || !(Number.isInteger(pts) && pts >= 0) || n + pts === 0) throw new Paced('GitHub budget: github note --content <n> [--points <n>]: whole numbers, not both 0 (each connector write is content-creating and costs 5 points)');
  return reserve({ points: pts, content: n, primary: false, note: true }, `note: ${what}`, cwd, opts);
}

// A rate-limit refusal in a gh call's output: GitHub's words for the primary and secondary limits,
// HTTP 403 or 429, and its Retry-After or x-ratelimit-reset when gh shows them.
export function limitSignal(text) {
  const t = String(text || '');
  const secondary = /secondary rate limit|abuse detection/i.test(t);
  const primary = /API rate limit exceeded|rate limit exceeded for/i.test(t) && !secondary;
  const http = /HTTP (403|429)\b/.test(t) || /\b429 Too Many Requests\b/i.test(t);
  if (!secondary && !primary && !(http && /rate limit/i.test(t)) && !/\bHTTP 429\b/.test(t)) return null;
  const ra = t.match(/retry-after:\s*(\d+)/i);
  const reset = t.match(/x-ratelimit-reset:\s*(\d+)/i);
  return { kind: primary ? 'primary' : 'secondary', retryAfter: ra ? Number(ra[1]) : null, reset: reset ? Number(reset[1]) * 1000 : null };
}
// After a gh call: a --paginate call's further pages logged (one request a page, estimated from
// what came back); a refusal (read from stderr only) pauses every session until GitHub's reset
// (Retry-After, else x-ratelimit-reset, else for the primary limit rate_limit's reset, else one
// minute, as GitHub's docs say), this clone's own record first; a refusal after a pause had ended,
// within an hour of it, stops the tool (nextPause). Returns the pause in force, or null.
export function ghAfter(args, result, cwd, { now = Date.now, rateLimit } = {}) {
  const a = args.map(String);
  if (result?.code === 0) {
    // A merge (api PUT .../pulls/N/merge, pr merge) or a release's tag moves a ref on GitHub: a push
    // GitHub shows, logged as one (cold review of R17c: the audit called every merge unexplained).
    const merge = (a[0] === 'api' && a.some((x) => /\/pulls\/\d+\/merge$/.test(x))) || (a[0] === 'pr' && a[1] === 'merge');
    const release = a[0] === 'release' && a[1] === 'create';
    if (merge || release) { const repo = ghRepo(a, cwd); logEvent('push', `${merge ? 'merge' : 'release tag'} via gh`, cwd, { ...(repo ? { repo } : {}), via: merge ? 'merge' : 'release' }, now()); }
    if (a.includes('--paginate')) {
      const per = Number((a.join(' ').match(/per_page=(\d+)/) || [])[1]) || 30;
      let pages = 1;
      try { const j = JSON.parse(result.stdout); pages = a.includes('--slurp') && Array.isArray(j) ? j.length : Array.isArray(j) ? Math.ceil(j.length / per) : 1; } catch { pages = Math.ceil(String(result.stdout || '').split('\n').filter(Boolean).length / per); }
      if (pages > 1) logEvent('gh', `${a.filter((x) => !x.startsWith('-')).slice(0, 2).join(' ')} (${pages - 1} more page(s))`, cwd, { points: pages - 1, pages: pages - 1 }, now());
    }
    return null;
  }
  const sig = limitSignal(result?.stderr || '');
  if (!sig) return null;
  const t = now();
  let until = sig.retryAfter !== null ? t + sig.retryAfter * 1000 : sig.reset;
  if (!until && sig.kind === 'primary') { const pr = (rateLimit || defaultRateLimit)(cwd); until = pr?.reset || null; }
  if (!until || until <= t) until = t + 60e3;
  const rec = { at: iso(t), until: iso(until), why: `${sig.kind} rate limit on gh ${a.slice(0, 2).join(' ')}${sig.retryAfter !== null ? `, Retry-After ${sig.retryAfter} s` : ''}`, session: sessionId() };
  // This clone's own record first: obeyed here whatever happens to the shared one.
  const mine = nextPause(localPause(cwd), rec, t);
  const writeMine = (x) => { try { writeFileSync(join(commonDir(cwd), PAUSE_LOCAL), JSON.stringify(x)); } catch { /* best effort */ } };
  writeMine(mine);
  logEvent('refused', rec.why, cwd, { until: mine.until, stopped: mine.stopped }, t);
  let account = null;
  try { account = shared.pause(rec, t); } catch (e) { return { ...mine, unshared: e.message }; }
  if (!account) return mine;
  const both = { ...mine, until: Date.parse(account.until) > Date.parse(mine.until) ? account.until : mine.until, stopped: !!(account.stopped || mine.stopped) };
  writeMine(both);
  return both;
}

