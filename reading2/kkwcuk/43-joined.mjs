// ===== file: triggers.test.mjs (continued) =====

  const skip = setup((root) => commit(root, { 'test/alpha/a.test.mjs': TEST_BASE.replace("test('a'", "test.skip('a'") }));
  const k = reviewTriggers(skip.root, { base: 'origin/tranche', head: 'origin/job/alpha', entry: entry('alpha'), cfg: {} });
  assert.deepEqual([k.fired, k.why], [['test'], 'test/alpha/a.test.mjs: 1 skip added']);
});

test('a path git would quote (non-ASCII) still fires both triggers (review of PR 125)', () => {
  const { root } = setup((root) => { commit(root, { 'src/gate/café.mjs': 'x\n', 'test/alpha/é.test.mjs': TEST_BASE }); }, { review_triggers: { security_paths: ['src/gate/**'] } });
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  git(['rm', '-q', 'test/alpha/é.test.mjs'], { cwd: root });
  commit(root, { 'src/gate/café.mjs': 'y\n' });
  const t = reviewTriggers(root, { base: 'HEAD~2', head: 'HEAD', entry: entry('alpha'), cfg: { review_triggers: { security_paths: ['src/gate/**'] } } });
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.deepEqual([t.fired, t.security, t.deleted], [['security', 'test'], ['src/gate/café.mjs'], ['test/alpha/é.test.mjs']]);
});

test('review brief for a triggered job carries the trigger and its exact hunks, read from the clone', () => {
  const { root } = setup((root) => commit(root, { 'src/alpha/acts.mjs': 'export const ACTS = ["a"];\n' }));
  const pr = { number: 9, title: 'alpha', base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: 'h'.repeat(40) }, user: { login: 'job' } };
  const text = reviewBrief(root, '9', { log: quiet, io: { slug: 'o/r', read: () => pr, files: () => ['src/alpha/acts.mjs'], contents: (s, p) => (p.endsWith('.json') ? entry('alpha') : '- **R1** x\n'), notes: () => [], tracked: () => false } });
  assert.match(text, /## Review triggers\nFired: security\. security paths changed: src\/alpha\/acts\.mjs\./);
  assert.match(text, /```diff\n[\s\S]*-export const ACTS = \["a", "b"\];\n\+export const ACTS = \["a"\];[\s\S]*```/);
});

test('--no-review may not cite Q38 and needs a reason; --reviewed needs its measures, --no-review takes none', () => {
  assert.throws(() => reviewRounds({ noReview: 'Q38' }), /may not cite Q38: Q38 has no source/);
  assert.throws(() => reviewRounds({ noReview: 'per q38, product PRs' }), /Q38/);
  assert.throws(() => reviewRounds({ noReview: '  ' }), /--no-review needs why/);
  assert.deepEqual(reviewRounds({ noReview: 'a docs-only change' }), { rounds: 0, decision: null });
  assert.throws(() => reviewMeasures({ reviewed: 'x', findings: 0, actedOn: 0 }), /--review-minutes/);
  assert.throws(() => reviewMeasures({ reviewed: 'x', reviewMinutes: 3, actedOn: 0 }), /--findings <n>/);
  assert.throws(() => reviewMeasures({ reviewed: 'x', reviewMinutes: 3, findings: 1, actedOn: 2 }), /more than --findings/);
  assert.throws(() => reviewMeasures({ reviewed: 'x', reviewMinutes: 3, findings: 1, actedOn: 0, reviewCostUsd: '0' }), /above 0/);
  assert.deepEqual(reviewMeasures({ reviewed: 'x', reviewMinutes: '3', findings: '2', actedOn: '0' }), { review_minutes: 3, review_usd: 'unmeasured', findings: 2, findings_acted: 0 });
  assert.throws(() => reviewMeasures({ noReview: 'x', findings: 0 }), /drop --findings/);
  // An empty value is not 0 (review of PR 125).
  assert.throws(() => reviewMeasures({ reviewed: 'x', reviewMinutes: '', findings: 0, actedOn: 0 }), /--review-minutes/);
  assert.throws(() => reviewMeasures({ reviewed: 'x', reviewMinutes: 3, findings: ' ', actedOn: 0 }), /--findings <n>/);
  assert.throws(() => reviewRounds({ noReview: 'Q-38' }), /Q38/);
});

test('globs and assertion counts: ** any depth, * one name, a bare path a file or directory; comments are not assertions', () => {
  assert.equal(globRe('src/a'), null);
  assert.ok(matchPath('src/gate/x/y.mjs', 'src/gate/**') && matchPath('src/gate/y.mjs', 'src/**/y.mjs') && matchPath('src/a/b.mjs', 'src/a/'));
  assert.ok(!matchPath('src/gatex/y.mjs', 'src/gate/**') && !matchPath('src/a/b/c.mjs', 'src/a/*.mjs') && matchPath('src/a/c.mjs', './src/a/*.mjs'));
  assert.deepEqual(assertCounts('--- a/x\n+++ b/x\n@@ -1 +1 @@\n-  assert.equal(a, 1);\n-  // assert.ok(x)\n+  t.equal(a, 1);\n+  expect(b).toBe(2);\n@@ -9 +9 @@\n-  t.ok(c)\n+  it.only(\'x\', f)\n'), { removed: 2, added: 2, skips: 1, bare: 1 });
});

test('the report line: merged, triggered by kind and share, reviews, findings, minutes and cost', () => {
  const s = triggerSummary([
    { pr: 1, triggers: ['test'], reviewed: true, review_minutes: 10, review_usd: 0.5, findings: 2, findings_acted: 1 },
    { pr: 2, triggers: ['security', 'test'], reviewed: true, review_minutes: 20, review_usd: 'unmeasured', findings: 0, findings_acted: 0 },
    { pr: 3, triggers: [], reviewed: false },
    { pr: 4, triggers: [], reviewed: false },
    { pr: 5, reviewed: false },
  ]);
  assert.equal(s.line, 'review triggers: 5 job PRs merged (1 before triggers were recorded); triggered 2 of 4 (50%): security 1, test 2; reviews run 2; findings per review 1; findings acted on 1; added minutes to merge median 15, worst 20; review cost $0.50 (1 unmeasured)');
  assert.match(triggerSummary([]).line, /0 job PRs merged; triggered 0 of 0: .*median unmeasured, worst unmeasured; review cost unmeasured$/);
});

// ===== file: github.mjs =====

// GitHub acts and reads, all through gh (platform rows 13, 14). Every remote act is recorded
// only from its result (REC-5): callers use the returned objects, never their own intent.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fail, gh, ghRun, git, isShallow, run, withTemp } from './util.mjs';
import { commonDir } from './pace.mjs';

export const GATE = 'p3:gate';
// A reviewed revert exemption on a job's pull request (AUD-1, JOB-12; gate.mjs revertExemption).
export const REVERT_EXEMPT = 'p3:revert-exempt';

// A machine-readable comment: an HTML marker and one fenced JSON block.
export const block = (marker, data, lead = '') =>
  `<!-- ${marker} -->\n${lead}${lead ? '\n\n' : ''}\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;

export function parseBlock(body, marker) {
  if (!body || !body.includes(`<!-- ${marker} -->`)) return null;
  const m = body.match(/```json\n([\s\S]*?)\n```/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

export function findPR(slug, head, { state = 'open' } = {}) {
  const owner = slug.split('/')[0];
  const prs = gh(['api', `repos/${slug}/pulls?state=${state}&head=${owner}:${encodeURIComponent(head)}&per_page=10`]) || [];
  return prs[0] || null;
}

export const getPR = (slug, n) => gh(['api', `repos/${slug}/pulls/${n}`]);

export function openPRs(slug, base) {
  const pages = gh(['api', '--paginate', '--slurp', `repos/${slug}/pulls?state=open&base=${encodeURIComponent(base)}&per_page=100`], { allowFail: true });
  return Array.isArray(pages) ? pages.flat() : null;
}

// Every pull request, open, closed or merged, whose head is this repository's branch; null when
// unreadable. Pull requests cannot be deleted, so this is every PR a run on the branch could be.
export function prsFromBranch(slug, branch, { read = (args) => gh(args, { allowFail: true }) } = {}) {
  const owner = String(slug).split('/')[0];
  const pages = read(['api', '--paginate', '--slurp', `repos/${slug}/pulls?state=all&head=${encodeURIComponent(`${owner}:${branch}`)}&per_page=100`]);
  return Array.isArray(pages) ? pages.flat() : null;
}

export function createPR(slug, { head, base, title, body, draft = true }) {
  const pr = gh(['api', '-X', 'POST', `repos/${slug}/pulls`, '--input', '-'], {
    input: JSON.stringify({ head, base, title, body, draft }),
  });
  if (!pr?.number) fail('GitHub did not return a pull request');
  return pr;
}

// job start --take-in: a taken-in pull request moved to the tranche (PATCH base) and made a
// draft. GitHub's REST API has no way back to draft and GraphQL, which has, is not reachable from
// Claude Code sessions (copy, 4 Nov: site's attempt 2 stopped on it before its push); their proxy
// names a REST route for it, tried first. Anywhere else the GraphQL mutation is the route.
export function editPR(slug, n, fields) {
  const pr = gh(['api', '-X', 'PATCH', `repos/${slug}/pulls/${n}`, '--input', '-'], { input: JSON.stringify(fields) });
  if (!pr?.number) fail(`GitHub did not return pull request ${n} after the edit`);
  return pr;
}
export function toDraft(slug, pr, { call = (args) => ghRun(args), read = getPR } = {}) {
  const tried = [
    ['api', '-X', 'POST', `repos/${slug}/pulls/${pr.number}/ccr/convert_to_draft`],
    ['api', 'graphql', '-f', 'query=mutation($id: ID!) { convertPullRequestToDraft(input: {pullRequestId: $id}) { pullRequest { isDraft } } }', '-f', `id=${pr.node_id}`],
  ];
  const errors = [];
  for (const args of tried) {
    const r = call(args);
    if (r.code === 0) break;
    errors.push(`gh ${args.slice(0, 3).join(' ')}: ${(r.stderr || r.stdout || '').trim().split('\n')[0]}`);
  }
  if (errors.length === tried.length) fail(`could not make pull request ${pr.number} a draft: ${errors.join('; ')}`);
  const now = read(slug, pr.number);
  if (!now?.draft) fail(`pull request ${pr.number} is still not a draft`);
  return now;
}

const commentsArgs = (slug, n) => ['api', '--paginate', '--slurp', `repos/${slug}/issues/${n}/comments?per_page=100`];
export function comments(slug, n) {
  const pages = gh(commentsArgs(slug, n));
  return Array.isArray(pages) ? pages.flat() : [];
}
// A pull request's comments kept in the clone (C18, 7 Nov: status --role bob re-read every PR merged
// since the tranche opened, ~260 requests a call, for gate rows that no longer change): served
// while ttlMs old, for every p3 process of the clone. The caller says how long: a merged PR's for
// hours, an open one's for seconds. A failed read is never kept.
// A read kept in the clone's git directory for ttlMs (ttl(value) may give a value its own), for
// every p3 process of the clone; a failed read (null, undefined) is never kept.
export function keptRead(root, key, ttl, read, { now = Date.now } = {}) {
  const dir = join(commonDir(root), 'p3-gh-cache');
  const f = join(dir, `${String(key).replace(/[^\w.-]/g, '_').slice(0, 180)}.json`);
  try { const c = JSON.parse(readFileSync(f, 'utf8')); if (c.at <= now() && now() - c.at < c.ttl) return c.value; } catch { /* not kept */ }
  const value = read();
  if (value !== null && value !== undefined) { try { mkdirSync(dir, { recursive: true }); writeFileSync(f, JSON.stringify({ at: now(), ttl: typeof ttl === 'function' ? ttl(value) : ttl, value })); } catch { /* a saving */ } }
  return value;
}
// GitHub's compare kept 5 min for a commit (a status run takes over 2), 30 s for a branch name
// (its tip moves: a job's ahead count, cold review of C18); a commit found on its base (ahead_by 0, base main) for a day: main
// never moves back (C18: status read every closed layer's commit against main on every call).
export const keptCompare = (root) => (slug, base, head) => keptRead(root, `compare-${slug}-${base}-${head}`, (c) => (base === 'main' && c?.ahead_by === 0 && /^[0-9a-f]{40}$/.test(String(head)) ? 24 * 3600e3 : /^[0-9a-f]{7,40}$/.test(String(head)) ? 300e3 : 30e3), () => compare(slug, base, head));
export const COMMENTS_MERGED_MS = 6 * 3600e3;
export const COMMENTS_OPEN_MS = 30e3;
export function cachedComments(root, slug, n, { ttlMs = COMMENTS_OPEN_MS, now = Date.now, read = comments } = {}) {
  const got = keptRead(root, `comments-${slug}-${Number(n)}`, ttlMs, () => { const c = read(slug, n); return Array.isArray(c) ? c : null; }, { now });
  return got;
}

export function addComment(slug, n, body) {
  const c = gh(['api', '-X', 'POST', `repos/${slug}/issues/${n}/comments`, '--input', '-'], { input: JSON.stringify({ body }) });
  if (!c?.id) fail('GitHub did not return the comment');
