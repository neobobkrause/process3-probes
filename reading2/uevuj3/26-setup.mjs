// setup check (setup audit, 2 Nov): the product's setup, read and reported, one line per
// condition of setup/conditions.json. Read-only. job start runs it first and stops on a gap.
import { census } from './census.mjs';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prFiles, takeInLine, toTakeIn } from './carry.mjs';
import { generatedRows, oversizeGenerated } from './checks.mjs';
import { laneModuleGaps } from './ledger.mjs';
import { approvalsBlock, ownerBlock, webCommitByOwner } from './record.mjs';
import { compareRanges, loadRanges, measureSize, sizeLines } from './size.mjs';
import { startCheck } from './start.mjs';
import { admitCheck, admitTools, ruleMatches, toldCommands, toldTools } from './admit.mjs';
import { CONFIG_FILE, DEFAULTS, Fail, OPEN_BY, configOf, exists, fail, fetchBranch, gh, git, isShallow, laneDirs, loadConfig, run, underPath } from './util.mjs';
import { readLedgerTexts } from './ledger.mjs';
import { address, fetchState } from './state.mjs';
import { commonDir } from './pace.mjs';
import { internalWalkOf } from './deploycfg.mjs';

export const CONDITIONS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'setup', 'conditions.json');
export const loadConditions = (file = CONDITIONS) => JSON.parse(readFileSync(file, 'utf8')).conditions;
export const CONFIRMED = 'confirmed once on the onboarding page';
const ACTIONS_APP = 15368; // GitHub Actions: a required check from any other source could be posted by a session
const DAY = 86400000;

const api = (path) => gh(['api', path], { allowFail: true });

// The pinned clone's own repository: the tool runs from it (.process in a product).
const TOOL = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PROCESS_LINES = 'shims/CLAUDE.process.md';
export const HOOKS_SHIM = 'shims/settings.hooks.json';
export const MAX_LINES = 30;

// The tranche's process pin and its files, read from the tool's own repository: the pin commit
// is fetched by its id, --depth 1, when the clone lacks it. null when the tranche has no pin.
// With ref, the pin of that commit instead (setup check --at HEAD).
export function pinOf(root, name, toolRoot = TOOL, ref = `origin/${name}`) {
  const tree = git(['ls-tree', ref, '--', '.process'], { cwd: root, allowFail: true });
  const sha = tree.code === 0 ? tree.stdout.match(/^160000 commit ([0-9a-f]{40})\t/)?.[1] : null;
  if (!sha) return null;
  if (git(['cat-file', '-e', `${sha}^{commit}`], { cwd: toolRoot, allowFail: true }).code !== 0) {
    git(['fetch', '-q', '--depth=1', 'origin', sha], { cwd: toolRoot, allowFail: true });
    if (git(['cat-file', '-e', `${sha}^{commit}`], { cwd: toolRoot, allowFail: true }).code !== 0) throw new Error(`could not fetch the pin ${sha.slice(0, 10)} into the process clone (run git submodule update --init .process first)`);
  }
  return {
    sha,
    file: (f) => (exists(toolRoot, sha, f) ? git(['show', `${sha}:${f}`], { cwd: toolRoot }) : null),
    list: (dir) => git(['ls-tree', '-z', '--name-only', `${sha}:${dir}`], { cwd: toolRoot, allowFail: true }).stdout.split('\0').filter(Boolean),
  };
}

// Every hook of a settings file, one key per command, so order and grouping do not matter.
// R17c's GitHub pacing hook, retired by PD-22 (C58): it prints "not governed" and exits 0, so a
// settings file still carrying it is a warning, not drift (C60). Known by its own text, narrowly.
const RETIRED_PACING = 'retired GitHub pacing hook (PD-22): harmless; Bob may remove it';
const retiredPacingHook = (event, command) => event === 'PreToolUse' && typeof command === 'string'
  && command.includes('GitHub pacing hook') && (command.includes('.process/tool/hook.mjs') || command.includes('github hook'));
const hookKeys = (hooks) => Object.entries(hooks && typeof hooks === 'object' ? hooks : {}).flatMap(([event, groups]) =>
  [].concat(groups || []).flatMap((g) => [].concat(g?.hooks || []).map((h) => JSON.stringify([event, g?.matcher ?? '', h?.type ?? '', h?.command ?? '', h?.timeout ?? null]))));

// The tranche's files, through git, so no session reads them through the contents API. With
// at, a commit's files instead; the tranche is fetched either way, since the approvals and the
// take-in still read it (review of PR 60).
function tranche(root, name, at = null) {
  fetchBranch(root, name, { allowFail: true });
  const ref = at || `origin/${name}`;
  return (file) => {
    if (git(['rev-parse', '-q', '--verify', ref], { cwd: root, allowFail: true }).code !== 0 || !exists(root, ref, file)) return null;
    return git(['show', `${ref}:${file}`], { cwd: root });
  };
}

// A harmless Cloudflare read with the session's token: the token goes to curl on stdin, never on
// a command line, in a log or in a message. Returns the HTTP status, Cloudflare's success and its
// Retry-After (seconds, or null).
export function cloudflareRead(path, env) {
  const r = run('curl', ['-sS', '--max-time', '20', '-H', '@-', '-w', '\n%header{retry-after}\n%{http_code}', `https://api.cloudflare.com/client/v4/${path}`], { input: `Authorization: Bearer ${env.CLOUDFLARE_API_TOKEN}\n` });
  const lines = r.stdout.split('\n');
  const status = Number(lines.pop());
  const ra = String(lines.pop() ?? '').trim();
  const retryAfter = /^\d+$/.test(ra) ? Number(ra) : null;
  // Cloudflare's v4 envelope says success; a bare JSON answer (some newer APIs) counts on a 200. A body
  // that is not JSON (a proxy's page) says nothing: null, never a "no" (cold review of C20).
  let success = null;
  try { const j = JSON.parse(lines.join('\n')); success = j?.success === true || (j !== null && typeof j === 'object' && j.success === undefined); } catch { /* not JSON */ }
  return { status: r.code === 0 ? status : 0, success, retryAfter };
}
// A present answer kept per clone for an hour (C20, the coordinator, 7 Nov: the product's Cloudflare
// account at its API limit, 1200 requests in 5 min; setup check reads three scopes at every job
// start, pin move and sweep). Only a present answer is kept: anything else is read again. Keyed by
// the read (its account in the path) and a short one-way digest of the token, so a rotated or
// revoked token, or another session's in the clone, is read again (cold review); never the token.
export const CF_CACHE = 'p3-cf-present.json';
export const CF_CACHE_MS = 3600e3;
export function cachedCloudflare(read, root, { now = Date.now, token = '' } = {}) {
  const tag = createHash('sha256').update(String(token)).digest('hex').slice(0, 16);
  const f = join(commonDir(root), CF_CACHE);
  let seen = {};
  try { seen = JSON.parse(readFileSync(f, 'utf8')) || {}; } catch { seen = {}; }
  return (path) => {
    const k = `${tag} ${path}`;
    const age = now() - seen[k];
    if (Number.isFinite(age) && age >= 0 && age < CF_CACHE_MS) return { status: 200, success: true, retryAfter: null, cached: true };
    const r = read(path);
    if (r.status === 200 && r.success === true) { seen[k] = now(); try { writeFileSync(f, JSON.stringify(seen)); } catch { /* the cache is a saving, not a record */ } }
    return r;
  };
}

// No account named: absent, null, or blank (reviews of PR 24). Anything else must be an ID,
// a string or a number.
const noAccount = (a) => a === undefined || a === null || (typeof a === 'string' && !a.trim());
const set = (detail) => ({ state: 'set', detail });
const missing = (detail) => ({ state: 'missing', detail });
const unread = (what) => missing(`could not read ${what}`);
// Fails closed: a ruleset counts only when GitHub says the session account can never bypass it
// (confirming review of PR 15).
const noBypass = (rs) => rs.current_user_can_bypass === 'never';

// A deny rule as Claude Code matches a Bash command: admit's one matcher (C17: setup kept a second,
// whose `:*` matched without a word boundary).
export const bashRuleMatches = ruleMatches;

// One reader per condition that can be read; each returns { state, detail }.
export const readers = {
  account: (c, x) => {
    const me = x.api('user');
    if (!me?.login) return unread('the account (GET /user)');
    const p = x.repo()?.permissions;
    if (!p) return unread(`the repository ${x.slug}`);
    const ok = p.push === c.value.push && p.admin === c.value.admin;
    return (ok ? set : missing)(`${me.login}: push ${p.push}, admin ${p.admin}`);
  },

  'ruleset-all-branches': (c, x) => {
    const sets = x.rulesets();
    if (!sets) return unread('the rulesets');
    const want = c.value.rules;
    const fit = sets.find((rs) => rs.enforcement === 'active' && rs.target === 'branch'
      && (rs.conditions?.ref_name?.include || []).includes(c.value.include) && !(rs.conditions?.ref_name?.exclude || []).length
      && want.every((t) => (rs.rules || []).some((r) => r.type === t)) && noBypass(rs));
    return fit ? set(`ruleset "${fit.name}"`) : missing(`no active ruleset on ${c.value.include}, nothing excluded, with ${want.join(' and ')}, that the session account cannot bypass`);
  },

  'ruleset-main-tranche': (c, x) => {
    const gaps = [];
    for (const b of [x.main, x.cfg.tranche]) {
      const rules = x.api(`repos/${x.slug}/rules/branches/${b.split('/').map(encodeURIComponent).join('/')}`);
      if (!Array.isArray(rules)) { gaps.push(`${b}: could not read its rules`); continue; }
      const pr = rules.filter((r) => r.type === 'pull_request');
      const methods = pr.map((r) => r.parameters?.allowed_merge_methods);
      if (!pr.length) gaps.push(`${b}: no pull request rule`);
      // Every pull request rule, not just one, allows only these methods (fifth re-review).
      else if (!methods.every((m) => Array.isArray(m) && m.length === c.value.merge_methods.length && c.value.merge_methods.every((v) => m.includes(v)))) gaps.push(`${b}: merge methods are not ${c.value.merge_methods.join(', ')} only`);
      // The tool merges without a person's review: no rule may require one (fourth re-review).
      for (const r of pr) {
        const n = r.parameters?.required_approving_review_count;
        if (n !== c.value.required_approving_review_count) gaps.push(`${b}: a pull request rule requires ${n ?? 'an unknown number of'} approving review(s), not ${c.value.required_approving_review_count}`);
        if (r.parameters?.require_code_owner_review === true) gaps.push(`${b}: a pull request rule requires a code owner's review`);
        if ((r.parameters?.required_reviewers || []).length) gaps.push(`${b}: a pull request rule names required reviewers`);
      }
      const checks = rules.filter((r) => r.type === 'required_status_checks').flatMap((r) => r.parameters?.required_status_checks || []);
      for (const name of x.required) {
        const hit = checks.filter((k) => k.context === name);
        if (!hit.length) gaps.push(`${b}: check ${name} is not required`);
        else if (!hit.some((k) => k.integration_id === ACTIONS_APP)) gaps.push(`${b}: check ${name} is not tied to GitHub Actions`);
      }
      for (const id of new Set([...pr, ...rules.filter((r) => r.type === 'required_status_checks')].map((r) => r.ruleset_id).filter(Boolean))) {
        const rs = x.ruleset(id);
        if (!rs) gaps.push(`${b}: could not read ruleset ${id}`);
        else if (!noBypass(rs)) gaps.push(`${b}: the session account can bypass ruleset "${rs.name}"`);
      }
    }
    return gaps.length ? missing(gaps.join('; ')) : set(`${x.main} and ${x.cfg.tranche}: pull request, ${c.value.merge_methods.join(', ')} only, ${x.required.join(', ')} required`);
  },

  'merge-settings': (c, x) => {
    const r = x.repo();
    if (!r) return unread(`the repository ${x.slug}`);
    const wrong = Object.entries(c.value).filter(([k, v]) => r[k] !== v).map(([k, v]) => `${k} is ${r[k]}, not ${v}`);
    return wrong.length ? missing(wrong.join('; ')) : set(Object.entries(c.value).map(([k, v]) => `${k} ${v}`).join(', '));
  },

