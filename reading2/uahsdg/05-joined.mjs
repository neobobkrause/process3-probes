// ===== file: merge.mjs (continued) =====

export const PIN_WHAT = (pin) => `pin moved to ${pin}: run your wake steps (start check --wake prints a changed prompt), then status`;
export function pinWake(root, base, sha, as = 'bob') {
  if (as === 'bob' || !sha) return { what: null, wake: null };
  git(['fetch', '-q', 'origin', `+refs/heads/${base}:refs/remotes/origin/${base}`], { cwd: root, allowFail: true });
  if (git(['cat-file', '-e', `${sha}^{commit}`], { cwd: root, allowFail: true }).code !== 0) git(['fetch', '-q', 'origin', sha], { cwd: root, allowFail: true });
  let pin;
  let was;
  try { pin = pinAt(root, sha); was = pinAt(root, `${sha}^1`); } catch {
    const what = `the pin may have moved (merge ${String(sha).slice(0, 10)} could not be read): run your wake steps (start check --wake prints a changed prompt), then status`;
    return { what, wake: bobWake(what, as), unread: true };
  }
  if (!pin || pin === was) return { what: null, wake: null };
  const what = PIN_WHAT(pin);
  return { what, wake: bobWake(what, as) };
}
// Prints a wake once per merge commit, across every session that sees the merge (the
// coordinator's ruling, 5 Nov): the first to record it prints it; a later one says it was given.
// A record that cannot be written prints it anyway.
export function printWake(root, sb, { pr, sha, what, wake, as, by, log = console.log }) {
  const w = wakeOnce(root, sb, { pr, sha, what, wake, by, print: true });
  if (w.print) log(wakeLine(what, as));
  else log(`the wake of BOB for PR ${pr} (merge ${String(sha).slice(0, 10)}) was already given by ${w.printed?.by || 'another run'} at ${w.printed?.at || '?'}: not given again`);
  return w;
}


// Note for jobs, in force until withdrawn: the job's handover note names its reviewer on a line of
// its own, exactly: `reviewer: Maren Oduya`.

// ===== file: census.test.mjs (later part) =====

test('census: an open layer\'s branch lacking an entry the tranche holds is named', () => {
  const root = product();
  git(['push', '-q', 'origin', 'tranche:refs/heads/layer/2'], { cwd: root });
  commit(root, { 'process/ledger/c3.json': ent('c3', 3), 'process/ledger/b2.json': ent('b2', 2, { title: 'b2, again' }) });
  git(['checkout', '-q', '-b', 'side', 'origin/tranche'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  // layer/2 cut before a2's entry: rebuild it without a2's.
  git(['checkout', '-q', '-b', 'l2', 'origin/layer/2'], { cwd: root });
  git(['rm', '-q', 'process/ledger/a2.json'], { cwd: root });
  git(['commit', '-q', '-m', 'cut early'], { cwd: root });
  git(['push', '-q', 'origin', 'l2:refs/heads/layer/2', '--force'], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const c = census(root, loadConfig(root), { ref: 'origin/tranche', open: [2] });
  assert.deepEqual(c.gaps.filter((g) => g.kind === 'not-on-layer').map((g) => g.id), ['a2']);
  assert.match(c.gaps.find((g) => g.kind === 'not-on-layer').fix, /layer\/2 lacks process\/ledger\/a2\.json.*job start a2 carries it/);
});

test('open layers: an open row with no merged row', () => {
  const root = product();
  const state = { 'layerflow/1/open.json': '{}', 'layerflow/1/merged.json': '{}', 'layerflow/2/open.json': '{}' };
  assert.deepEqual(openLayers(root, loadConfig(root), (p) => state[p] ?? null), [2]);
});

test('preflight: what job start would refuse for the next layer, each with its fix', () => {
  const root = product();
  const cfg = loadConfig(root);
  commit(root, { 'process/ledger/c3.json': ent('c3', 3, { status: { state: 'WORKING' } }), 'process/ledger/d3.json': { id: 'd3' }, 'process/ledger/e4.json': ent('e4', 4, { status: { state: 'COMPLETE' }, requirements: 'build/requirements/owed1.md' }) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  git(['fetch', '-q', 'origin'], { cwd: root });
  const c = census(root, cfg, { ref: 'origin/tranche', open: [2] });
  const holds = [{ id: 'hold-9', live: true, kind: 'module', value: 'c3', scope: 'module:c3', when: [{ layer_closed: 2 }] }];
  const heldBy = (hs, id) => hs.find((h) => h.value === id) || null;
  const seat = (id) => (id === 'c3' ? { lane: { name: 'ux' }, why: 'job c3 is lane ux\'s module, and its session is live' } : null);
  const xs = preflight(root, cfg, 3, { ref: 'origin/tranche', census: c, holds, heldBy, seat });
  assert.deepEqual(xs.map((x) => `${x.id}: ${x.why.split(':')[0]}`), ['c3: its entry is WORKING on origin/tranche', 'c3: held by hold-9 (module', "c3: job c3 is lane ux's module, and its session is live", 'd3: its entry is invalid']);
  assert.match(xs[1].fix, /the hold ends by its own condition \(layer_closed:2\)/);
  assert.match(preflightLines(3, xs)[0], /^preflight, layer 3: 4 start\(s\) would be refused$/);
  assert.deepEqual(preflightLines(5, []), ['preflight, layer 5: no start would be refused']);
  // A paused plan refuses every start.
  assert.equal(preflight(root, { ...cfg, plan: 'pause' }, 2, { ref: 'origin/tranche', census: c })[0].id, '*');
  // A module of the layer with no entry is named with the census's fix.
  const gone = preflight(root, cfg, 4, { ref: 'origin/tranche', census: c });
  // A COMPLETE module with an unmet mark: a plain start refuses it; the fix is --reopen.
  assert.ok(gone.some((x) => x.id === 'e4' && /COMPLETE with 1 unmet mark\(s\): a plain job start refuses it/.test(x.why) && /--reopen/.test(x.fix)), JSON.stringify(gone));
  assert.ok(gone.some((x) => x.id === 'ux-design' && /no-entry/.test(x.why) && /write process\/ledger\/ux-design\.json/.test(x.fix)));
});

test('the gate: a requirements file or modules row added with no entry, or an entry with no row or requirements, is a finding', () => {
  const root = product();
  const cfg = loadConfig(root);
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const rows = (extra) => ({ modules: [...JSON.parse(git(['show', `${base}:build/modules.json`], { cwd: root })).modules, ...extra] });
  const head = commit(root, { 'build/requirements/new1.md': req('new1'), 'build/modules.json': rows([row('new2', 4)]), 'process/ledger/new3.json': ent('new3', 4) });
  const changed = git(['diff', '--name-only', base, head], { cwd: root }).split('\n').filter(Boolean);
  const got = changeGaps(root, cfg, { base, head, changed });
  assert.deepEqual(got.map((x) => x.file).sort(), ['build/modules.json', 'build/requirements/new1.md', 'process/ledger/new3.json', 'process/ledger/new3.json'].sort());
  assert.ok(got.some((x) => /new1 gains a requirements file with no ledger entry process\/ledger\/new1\.json/.test(x.message)));
  assert.ok(got.some((x) => /new2 gains a modules row with no ledger entry/.test(x.message)));
  assert.ok(got.some((x) => /new3's new ledger entry has no row in build\/modules\.json/.test(x.message)));
  assert.ok(got.some((x) => /new3's new ledger entry has no requirements file build\/requirements\/new3\.md/.test(x.message)));
  // An entry whose requirements live where its requirements field says: no finding for them.
  const elsewhere = commit(root, { 'build/modules.json': rows([row('new2', 4), row('new5', 4)]), 'process/ledger/new5.json': ent('new5', 4, { requirements: 'docs/req/new5.md' }), 'docs/req/new5.md': req('new5') });
  assert.deepEqual(changeGaps(root, cfg, { base: head, head: elsewhere, changed: git(['diff', '--name-only', head, elsewhere], { cwd: root }).split('\n').filter(Boolean) }).filter((x) => /new5/.test(x.message)), []);
  // All three pieces together: nothing.
  const whole = commit(root, { 'build/requirements/new4.md': req('new4'), 'build/modules.json': rows([row('new2', 4), row('new5', 4), row('new4', 4)]), 'process/ledger/new4.json': ent('new4', 4) });
  const ch2 = git(['diff', '--name-only', elsewhere, whole], { cwd: root }).split('\n').filter(Boolean);
  assert.deepEqual(changeGaps(root, cfg, { base: elsewhere, head: whole, changed: ch2 }).filter((x) => /new4/.test(x.message)), []);
});

test('status --role bob: the gaps block for the open layer and its lookahead, then the next layer\'s preflight', () => {
  const root = product();
  const cfg = loadConfig(root);
  writeState(root, cfg.state_branch, 'seed', (dir) => { for (const p of ['layerflow/1/open.json', 'layerflow/1/merged.json', 'layerflow/2/open.json']) { mkdirSync(dirname(join(dir, p)), { recursive: true }); writeFileSync(join(dir, p), '{}\n'); } return {}; });
  const ls = gapLines(root, cfg, { tranche: 'origin/tranche' });
  assert.equal(ls[0], 'gaps (layer 2 open; lookahead 3 and 4): 7 in layers 2, 3, 4 (3 elsewhere)');
  assert.ok(ls.some((l) => /^preflight, layer 3: 2 start\(s\) would be refused$/.test(l)), ls.join('\n'));
  assert.ok(ls.some((l) => /^- c3: no-entry: .*; fix: write process\/ledger\/c3\.json/.test(l)));
  // C16: the modules built before the ledger, outside the open layer and its lookahead, with their entries ready.
  const at = ls.findIndex((l) => l.startsWith('built before the ledger (no entry: modules that use one wait for it as a provider): 1'));
  assert.ok(at >= 0, ls.join('\n'));
  assert.ok(ls.slice(at).some((l) => /^- old1 \(layer 1\), no-entry: write process\/ledger\/old1\.json recording it COMPLETE/.test(l)), ls.join('\n'));
  // Its paths are not on the tranche here: listed, not ready (test 1 shows it ready once they are).
  assert.ok(ls.slice(at).some((l) => /^- old1 .*not ready: .*not on origin\/tranche/.test(l)), ls.join('\n'));
});

// ===== file: walkcfg.mjs =====

// How many walkers run at once (Bob, 8 Nov: "try to configure both walks to run as many walks as is
// reasonable to speed up the walking process. (But be careful that there aren't too many external
// walkers to cause the Cloudflare system to exceed limits of the account."). The process runs the
// product's walkers (deploy.internal_walk.run, deploy.walk) as argvs; how they parallelise is the
// product's. The tool hands each walk stage its concurrency as `{concurrency}` in its argv and as
// P3_WALK_CONCURRENCY in its environment; the live walk also gets P3_WALK_BROWSER_STARTS_PER_MINUTE.
// walk.ai (BD-R5) reaches both walks as P3_WALK_AI, and an argv element `{assistant}` becomes
// `--assistant` when it is on and is dropped when it is off (the product's journey-check takes it).
// A leaf: imports node and util only.
import { availableParallelism } from 'node:os';
import { fail } from './util.mjs';

// Cloudflare's published account limits on what a live walker uses, read 9 Nov 2026 from the pages
// below (public docs only; no Cloudflare call). Browser Rendering (page updated 14 Oct 2026):
// concurrent browsers per account, Free 3, Paid 200; new browser instances, Free 1 every 20 seconds,
// Paid 3 per second; over a limit it answers 429. Workers (page updated 29 Oct 2026): "There is no
// general limit on requests per second"; Free has 100,000 requests a day per account; 6 simultaneous
// outgoing connections per request. Durable Objects (page updated 7 Nov 2026): a soft limit of 1,000
// requests per second per object. The product's live walker runs its own local Chromium against the
// deployment (journey-check run.mjs), not Browser Rendering, so the runner's CPUs bound how many it can
// run: that is the live walk's default. Browser Rendering's concurrent browsers stay the cap, at TARGET,
// and its new-browser rate the starts' pace, because the product's own Workers may use Browser
// Rendering for each request a walker makes (its pdf-worker and browser bindings). Workers and Durable
// Objects publish no limit a walker count can reach first (at most a few requests a second each).
export const CLOUDFLARE_LIMITS = {
  read: '2026-11-09',
  pages: [
    'https://developers.cloudflare.com/browser-rendering/platform/limits/',
    'https://developers.cloudflare.com/workers/platform/limits/',
    'https://developers.cloudflare.com/durable-objects/platform/limits/',
  ],
  free: { browsers: 3, browser_starts_per_minute: 3 },
  paid: { browsers: 200, browser_starts_per_minute: 180 },
};
// As pacing.target (pace.mjs, PD-22): 85% of the published limit, never above it.
