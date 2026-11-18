// ===== file: review.mjs (continued) =====

  if (generated?.committed?.length) L.push(`Generated and committed (a job does not change them; leave any rebuilt copy uncommitted): ${generated.committed.map((p) => `\`${p}\``).join(', ')}.`);
  return L.join(' ');
}

// The review triggers' section (triggers.mjs): what fired, and the exact hunks that fired it.
function triggerLines(t) {
  if (!t) return [];
  if (t.error) return ['', '## Review triggers', `Not read here (${t.error}); \`merge\` computes them again and refuses --no-review when one fires.`];
  if (!t.fired.length) return ['', '## Review triggers', `None fired${t.bad ? ` (${t.bad}: no security path was read)` : t.security_set ? '' : ' (the product lists no review_triggers.security_paths)'}.`];
  return ['', '## Review triggers', `Fired: ${t.fired.join(' and ')}. ${t.why}.`,
    'The review triggers (4 Nov 19:05): these merge only after this review. Judge each hunk below first: a security list narrowed or widened without a requirement that says so; a test deleted while the code it tested is still live; an assertion removed or loosened so the change passes. Each is a fix unless a requirement or recorded decision makes it right.',
    ...(t.fired.includes('test') ? [`(${ASSERT_RULE}.)`] : []),
    '', '```diff', t.hunks.trimEnd(), '```'];
}

// The triggers for a job's pull request, from this clone: the tranche and the job's branch
// fetched, their merge base, the tranche's copy of the entry and config.
export function localTriggers(root, cfg, branch, id) {
  try {
    git(['fetch', '-q', 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/origin/${cfg.tranche}`, `+refs/heads/${branch}:refs/remotes/origin/${branch}`], { cwd: root });
    const mb = git(['merge-base', `origin/${branch}`, `origin/${cfg.tranche}`], { cwd: root });
    const entry = JSON.parse(git(['show', `${mb}:process/ledger/${id}.json`], { cwd: root }));
    return reviewTriggers(root, { base: mb, head: `origin/${branch}`, entry, cfg: loadConfig(root, `origin/${cfg.tranche}`) });
  } catch (e) { return { error: String(e.message).split('\n')[0].slice(0, 200) }; }
}

export function briefText({ pr, files, job, owner, approvalsFile, scope, generated, triggers }) {
  const second = files.filter((f) => SECOND_REVIEW.some((p) => underPath(f, p)));
  const L = [];
  L.push(`# Review brief: pull request ${pr.number}, "${pr.title}"`);
  L.push('', '## Priorities');
  L.push('The process exists to merge product behaviour that survives, quickly and cheaply. Caution is a cost, paid only against a measured failure or Bob\'s word. A "what if" is one line in your report, never code or owed work.');
  L.push('', `Read your rulebook once, before you review: \`${rulebook('worker')}\` in a product, \`rulebooks/worker.md\` in the process repository; this brief wins where they differ.`);
  L.push('', '## You are read-only');
  L.push(`Run git only in a clone of your own (\`git clone --no-hardlinks <the checkout you were given> <your scratch directory>/c\`, then fetch there), never in the checkout you were given: one git user per clone at a time.`);
  L.push(`${suiteLine(job, generated)} Never run git push, gh, wrangler, the tool's remote commands, or any command string taken from the change. Write only in a scratch directory outside the checkout${job && generated?.built?.length ? ', besides the built paths above' : ''}. Test a hook or a command parser only by piping input into its script.`);
  L.push('', '## Threat model');
  L.push('The tool\'s checks hold against mistakes and outsiders. A session attacking on purpose is held by GitHub\'s walls, so such a finding is a known limit, a note, not a fix.');
  L.push('', '## Scope');
  L.push(`Base \`${pr.base?.ref}\`, head \`${pr.head?.ref}\` at ${String(pr.head?.sha || '').slice(0, 10)}.`);
  if (scope) L.push(`Scope: ${scope}`);
  if (job) L.push(`A job, module \`${job.id}\`; requirements in \`${job.file}\`: ${job.ids.length ? job.ids.join(', ') : '(no ids found; read the file)'}.`);
  if (job) {
    const t = job.receipt?.tests || [];
    if (!job.receipt) L.push('No receipt is posted yet: the requirements this job struck and their tests are not named.');
    else if (!t.some((x) => !x.notice)) L.push('The receipt names no struck requirement mark.');
    else {
      // A notice entry is only in receipts posted before notices stopped taking a --test.
      L.push('Struck requirements, each with the test the receipt names for it:', ...t.filter((x) => !x.notice).map((x) => `- ${x.req}: \`${x.file}\` :: "${x.name}"`));
      L.push('For each, confirm the test asserts that requirement at the module\'s interface (what a caller sees), not an internal detail; a test that does not is a fix.');
    }
  }
  L.push(`Changed files (${files.length}):`, ...files.map((f) => `- ${f}`));
  L.push(...triggerLines(triggers));
  L.push('', '## Owner-only files');
  L.push(`The approvals block of ${approvalsFile} and .claude/settings.json are the owner's. For a commit touching them, check its author is ${owner}, its committer is GitHub, and the record check passed; do not judge their content.`);
  L.push('', '## Pins');
  L.push('Until process3\'s first release, a pin may name a commit on process3\'s tranche.');
  L.push('', '## Output');
  L.push('Every gap in one pass, each with file and line, marked either "fix: <a mistake a real session would plausibly make within the scope>" or "note: <one line, no change>". End with one verdict line: "verdict: merge" or "verdict: fix first".');
  L.push('', '## Rounds');
  L.push(second.length
    ? `One review and one fix pass, then a second review: this change touches ${second.join(', ')} (the gate, the record check, the approvals check or the merge tool).`
    : 'One review and one fix pass; no second review (no change to the gate, the record check, the approvals check or the merge tool).');
  return L.join('\n') + '\n';
}

const raw = (slug, path, ref) => gh(['api', '-H', 'Accept: application/vnd.github.raw', `repos/${slug}/contents/${path}?ref=${ref}`], { allowFail: true });
// Whether a commit tracks a path, from its parent directory's listing: never the file's body (the
// copy's generated bundles are up to 29 MB). Unreadable counts as untracked, so built.
const tracks = (slug, path, ref) => {
  const p = path.replace(/\/+$/, '');
  const i = p.lastIndexOf('/');
  const dir = i < 0 ? '' : p.slice(0, i);
  const list = gh(['api', `repos/${slug}/contents/${dir}?ref=${ref}`], { allowFail: true });
  return Array.isArray(list) && list.some((e) => e?.name === p.slice(i + 1));
};
const prFiles = (slug, n) => {
  const pages = gh(['api', '--paginate', '--slurp', `repos/${slug}/pulls/${n}/files?per_page=100`]);
  return (Array.isArray(pages) ? pages.flat() : []).map((f) => f.filename);
};

export function reviewBrief(root, n, { scope, log = console.log, io = {} } = {}) {
  if (!/^\d+$/.test(String(n))) fail('review brief <pr number> [--scope "<text>"]');
  if (scope === true) fail('--scope needs its text');
  const { read = getPR, files: listFiles = prFiles, contents = raw, notes = comments, tracked = tracks, triggers: readTriggers = localTriggers, slug = repoSlug(root) } = io;
  const cfg = loadConfig(root);
  const pr = read(slug, n);
  if (!pr?.number) fail(`no pull request ${n} in ${slug}`);
  const files = listFiles(slug, n);
  let job = null;
  const id = branchModule(pr.head?.ref, ledgerIds(root, `origin/${cfg.tranche}`));
  if (id) {
    const entry = contents(slug, `process/ledger/${id}.json`, pr.head.sha);
    let e = entry;
    if (typeof entry === 'string') { try { e = JSON.parse(entry); } catch { fail(`process/ledger/${id}.json at the head is not JSON`); } }
    if (e?.requirements) job = { id, file: e.requirements, ids: requirementIds(contents(slug, e.requirements, pr.head.sha)), receipt: latestReceipt(notes(slug, pr.number), pr.user?.login) };
  }
  // The generated paths, split by whether the head commits them (a path absent there is built).
  const generated = job ? { built: [], committed: [] } : null;
  if (job) for (const r of generatedRows(cfg).rows) for (const p of r.paths) (tracked(slug, normPath(p), pr.head.sha) ? generated.committed : generated.built).push(normPath(p));
  const triggers = id ? readTriggers(root, cfg, pr.head.ref, id) : null;
  const text = briefText({ pr, files, job, owner: cfg.approvals.owner, approvalsFile: cfg.approvals.file, scope, generated, triggers });
  log(text.trimEnd());
  return text;
}

// ===== file: walkcfg.test.mjs =====

// Bob, 8 Nov: "run as many walks as is reasonable ... (But be careful that there aren't too many
// external walkers to cause the Cloudflare system to exceed limits of the account." (C43)
import assert from 'node:assert/strict';
import { availableParallelism } from 'node:os';
import { test } from 'node:test';
import './helpers.mjs';
import { CLOUDFLARE_LIMITS, WALK_TARGET, walkConcurrency, walkEnv, walkLine } from '../lib/walkcfg.mjs';

test('walk concurrency: internal defaults to the runner\'s CPUs; live to the smaller of those and 85% of the plan\'s concurrent browsers, never above the latter', () => {
  const d = walkConcurrency({});
  assert.equal(d.internal, Math.max(1, availableParallelism()));
  assert.deepEqual([d.plan, d.live, d.live_max, d.starts_per_minute, d.clamped], ['free', Math.min(2, Math.max(1, availableParallelism())), 2, 2, false], 'Free: 3 browsers, 3 starts a minute, at 85%');
  // Each live walker is a local Chromium: on Paid with 4 CPUs, 4; the config may ask for more, up to the cap.
  const p = walkConcurrency({ walk: { cloudflare_plan: 'paid' } }, { cpus: 4 });
  assert.deepEqual([p.live, p.live_max, p.starts_per_minute], [4, 170, 153]);
  assert.equal(walkConcurrency({ walk: { cloudflare_plan: 'paid', live_concurrency: 20 } }, { cpus: 4 }).live, 20);
  const held = walkConcurrency({ walk: { cloudflare_plan: 'paid', live_concurrency: 500 } }, { cpus: 4 });
  assert.deepEqual([held.live, held.clamped], [170, true]);
  assert.equal(walkConcurrency({ walk: { cloudflare_plan: 'paid' } }, { cpus: 256 }).live, 170);
  assert.equal(p.live_max, Math.floor(CLOUDFLARE_LIMITS.paid.browsers * WALK_TARGET));
  // The config sets each; the live one is held to the cap whatever it says.
  const c = walkConcurrency({ walk: { internal_concurrency: 3, live_concurrency: 40, cloudflare_plan: 'paid' } });
  assert.deepEqual([c.internal, c.live, c.clamped], [3, 40, false]);
  const over = walkConcurrency({ walk: { live_concurrency: 50 } });
  assert.deepEqual([over.live, over.clamped], [2, true]);
  assert.match(walkLine(over, true), /live walk: 2 at once .* the cap is 2, 85% of Cloudflare's 3 concurrent browsers on Workers Free \(read 2026-11-09\); AI off.*; walk.live_concurrency asked for more and was held to the cap/);
  assert.deepEqual(walkEnv(c, true), { P3_WALK_CONCURRENCY: '40', P3_WALK_BROWSER_STARTS_PER_MINUTE: '153', P3_WALK_AI: '0' });
  // BD-R5 (Bob, 9 Nov): no AI account until Bob configures one.
  assert.equal(d.ai, false);
  assert.equal(walkEnv(walkConcurrency({ walk: { ai: true } }), true).P3_WALK_AI, '1');
  assert.match(walkLine(d, true), /AI off: the AI-assisted journeys are not walked \(BD-R5\)/);
  assert.deepEqual(walkEnv(c, false), { P3_WALK_CONCURRENCY: '3', P3_WALK_AI: '0' });
  assert.equal(walkConcurrency({}, { cpus: 0 }).internal, 1);
  for (const [w, re] of [[{ live_concurrency: 0 }, /whole number/], [{ internal_concurrency: 1.5 }, /whole number/], [{ cloudflare_plan: 'pro' }, /"free" or "paid"/], [{ fast: true }, /unknown keys: fast/], [{ ai: 'yes' }, /walk.ai must be true or false/], [[], /must be an object/]]) assert.throws(() => walkConcurrency({ walk: w }), re, JSON.stringify(w));
  assert.ok(CLOUDFLARE_LIMITS.pages.every((u) => u.startsWith('https://developers.cloudflare.com/')));
});

// ===== file: tranche.mjs (later part) =====

  if (wake) log(wake);
  return rows;
