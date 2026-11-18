// ===== file: scale-fixture.mjs (continued) =====

    }
  });
  // The tranche open's grants check passed (helpers.mjs openPassed).
  const acts = ['push', 'pr-open', 'pr-comment', 'pr-merge', 'session-start', 'session-archive', 'task-create', 'task-delete'];
  rows.push(['metrics/tranche-open.jsonl', [...acts.map((act) => [act, 1]), ...acts.slice(0, 4).map((act) => [act, 2])]
    .map(([act, depth]) => JSON.stringify({ row: 'grant', at: iso(now - 864e5), tranche: 'tranche', act, depth, outcome: 'ok', session: depth === 1 ? 'bob' : 'probe' })).join('\n') + '\n']);
  // The hourly sweep 20 minutes ago measured 4 live job sessions; no check since.
  rows.push(['metrics/sweep.jsonl', JSON.stringify({ at: iso(now - 20 * 6e4), row: 'sweep', live: 4 }) + '\n']);
  // Bulk: the rows of a long-running product (notices, messages, metrics, gate rows).
  const kinds = ['notices', 'messages', 'gate', 'metrics/jobs', 'layerflow/1/run'];
  for (let n = 0; n < stateRows; n++) rows.push([`${kinds[n % kinds.length]}/${Math.floor(n / 50)}/row-${n}.json`, { row: n % 5 === 4 ? 'run' : 'row', n, at: '2026-11-01T00:00:00Z' }]);
  const sout = [];
  const sdata = (t) => { const b = Buffer.from(t); sout.push(Buffer.from(`data ${b.length}\n`), b, Buffer.from('\n')); };
  const perCommit = 50;
  for (let c = 0; c * perCommit < rows.length; c++) {
    sout.push(Buffer.from(`commit refs/heads/process-state\ncommitter ${who(c)}\n`)); sdata(`state ${c}`);
    for (const [p, v] of rows.slice(c * perCommit, (c + 1) * perCommit)) { sout.push(Buffer.from(`M 100644 inline ${p}\n`)); sdata(typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n'); }
  }
  const s2 = git(['fast-import', '--quiet'], { cwd: origin, input: Buffer.concat(sout), allowFail: true });
  if (s2.code !== 0) throw new Error(`fast-import (state): ${s2.stderr}`);

  // The pin session's clone: --depth 1 of the tranche, as create_session clones it.
  const work = join(dir, 'work');
  git(['clone', '-q', '--depth', '1', '--branch', 'tranche', `file://${origin}`, work], { cwd: dir });
  git(['config', 'user.email', 'noreply@github.com'], { cwd: work });
  git(['config', 'user.name', 'Pin session'], { cwd: work });
  git(['config', 'commit.gpgsign', 'false'], { cwd: work });
  // No automatic gc or maintenance: after many small fetches git starts one detached, and its prune
  // rewrites the shallow file under the next fetch ("shallow file has changed since we read it"; CI's
  // git 2.56 on this fixture). A session's clone can meet that too; a test must not depend on it.
  git(['config', 'gc.auto', '0'], { cwd: work });
  git(['config', 'maintenance.auto', 'false'], { cwd: work });
  return { dir, origin, work, tip, ids, cfg, pin: pinSha, open, noEntry: ids.filter((_, i) => noEntry(i)) };
}

// GitHub's answers for a complete setup (the setup tests' world), and the approvals file's log from
// origin's own history, as GET /repos/.../commits?path= gives it.
export function stubGitHub(fx, slug = 'o/r') {
  const asked = [];
  const ok = (id) => [{ type: 'deletion', ruleset_id: 1 }, { type: 'non_fast_forward', ruleset_id: 1 },
    { type: 'pull_request', parameters: { allowed_merge_methods: ['merge'], required_approving_review_count: 0, require_code_owner_review: false }, ruleset_id: id },
    { type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'gate', integration_id: 15368 }] }, ruleset_id: id }];
  const sets = {
    1: { id: 1, name: 'every-branch', target: 'branch', enforcement: 'active', current_user_can_bypass: 'never', conditions: { ref_name: { include: ['~ALL'], exclude: [] } }, rules: [{ type: 'deletion' }, { type: 'non_fast_forward' }] },
    2: { id: 2, name: 'process3', target: 'branch', enforcement: 'active', current_user_can_bypass: 'never', conditions: { ref_name: { include: ['refs/heads/main', 'refs/heads/tranche'], exclude: [] } }, rules: [] },
  };
  const api = (p) => {
    asked.push(p);
    let m;
    if (p === 'user') return { login: 'acmewidget' };
    if (p === `repos/${slug}`) return { permissions: { admin: false, push: true }, allow_merge_commit: true, allow_auto_merge: false, delete_branch_on_merge: false };
    if (p.startsWith(`repos/${slug}/rulesets?`)) return [{ id: 1 }, { id: 2 }];
    if ((m = p.match(/\/rulesets\/(\d+)\?/))) return sets[m[1]] || null;
    if (p.includes('/rules/branches/')) return ok(2);
    if (p.includes('/actions/artifacts')) return { artifacts: [{ created_at: '2026-11-02T14:34:28Z', expires_at: '2027-01-31T14:33:29Z' }] };
    if (/\/branches\/[^/]+\/protection$/.test(p)) return null;
    if (/\/branches\/[^/]+$/.test(p)) return { protected: true, protection: { enabled: false } };
    if ((m = p.match(/\/commits\?sha=([0-9a-f]+)&path=([^&]+)/))) {
      const log = git(['--literal-pathspecs', 'log', '--format=%H %cI %P', '-n', '100', m[1], '--', decodeURIComponent(m[2])], { cwd: fx.origin, allowFail: true });
      return log.stdout.split('\n').filter(Boolean).map((l) => { const [sha, date, ...ps] = l.split(' '); return { sha, commit: { committer: { date, email: 'noreply@github.com' } }, parents: ps.filter(Boolean).map((s) => ({ sha: s })) }; });
    }
    if (/\/commits\/[0-9a-f]+$/.test(p)) return { committer: { login: 'web-flow' }, author: { login: OWNER }, commit: { verification: { verified: true } } };
    if (p.includes('/pulls?')) return [];
    return null;
  };
  return { api, asked };
}

// A fake `gh` on PATH for the CLI rehearsal: answers `gh api <path>` from stubGitHub, run in a child.
export function fakeGh(fx, slug) {
  const bin = join(fx.dir, 'bin');
  mkdirSync(bin, { recursive: true });
  const me = fileURLToPath(import.meta.url);
  writeFileSync(join(bin, 'gh'), `#!/usr/bin/env node\nconst { stubGitHub } = await import(${JSON.stringify(me)});\nconst a = process.argv.slice(2);\nif (a[0] !== 'api') process.exit(1);\nconst path = a.slice(1).find((x) => !x.startsWith('-'));\nconst v = stubGitHub(${JSON.stringify({ origin: fx.origin })}, ${JSON.stringify(slug)}).api(path);\nif (v === null) { process.stderr.write('HTTP 404'); process.exit(1); }\nprocess.stdout.write(JSON.stringify(a.includes('--slurp') ? [v] : v));\n`, { mode: 0o755 });
  return bin;
}
export const fixtureExists = (p) => existsSync(p);

// ===== file: developer-steps.mjs =====

// The developer's steps (setup/DEVELOPER.md) checked against setup/conditions.json; moved here
// from setup.mjs (build J), since only the tests use it.
import { dirname, join } from 'node:path';
import { CONDITIONS, loadConditions } from '../lib/setup.mjs';

// The steps against the list: each step complete, naming only
// conditions that are the developer's; every developer condition with a step; the deny lines
// the page prints equal to the deny-list condition's. Returns the problems.
export const DEVELOPER = join(dirname(CONDITIONS), 'DEVELOPER.md');
export const isDeveloper = (c) => /^the developer\b/.test(c.who);
export function developerSteps(text) {
  return text.split(/^## /m).slice(1).filter((s) => /^Step \d+\./.test(s)).map((s) => ({
    title: s.split('\n')[0],
    body: s,
    parts: ['Why:', 'Clicks:', 'How BOB confirms:', 'Sets:'].filter((p) => new RegExp(`^${p}`, 'm').test(s)),
    // A "Sets: none" line names no condition, whatever its reason mentions (review of PR 24).
    sets: /^Sets: none\b/m.test(s) ? [] : [...(s.match(/^Sets:(.*)$/m)?.[1] || '').matchAll(/`([^`]+)`/g)].map((m) => m[1]),
  }));
}
export function checkDeveloperSteps(text, conditions = loadConditions()) {
  const problems = [];
  const steps = developerSteps(text);
  const byId = new Map(conditions.map((c) => [c.id, c]));
  if (!steps.length) problems.push('no steps');
  for (const s of steps) {
    const lack = ['Why:', 'Clicks:', 'How BOB confirms:', 'Sets:'].filter((p) => !s.parts.includes(p));
    if (lack.length) problems.push(`${s.title}: lacks ${lack.join(', ')}`);
    // A step that names no condition says why (Bob, 2 Nov): "Sets: none, because ..." or "none; ...".
    if (s.parts.includes('Sets:') && !s.sets.length && !/^Sets: none(,? because|;)\s+\S+(\s+\S+){3,}/m.test(s.body)) problems.push(`${s.title}: names no condition and does not say why`);
    // Every website edit that may become a pull request says to set its base to the tranche.
    const commits = (s.body.match(/\*\*Commit changes\.\.\.\*\*/g) || []).length;
    if (commits && (s.body.match(/set \*\*base\*\* to the tranche, not `main`/g) || []).length < commits) problems.push(`${s.title}: a website commit that does not say to set base to the tranche, not main`);
    for (const id of s.sets) {
      if (!byId.has(id)) problems.push(`${s.title}: names ${id}, which is not in the list`);
      else if (!isDeveloper(byId.get(id))) problems.push(`${s.title}: names ${id}, which is not the developer's`);
    }
  }
  const named = new Set(steps.flatMap((s) => s.sets));
  for (const c of conditions.filter(isDeveloper)) if (!named.has(c.id)) problems.push(`${c.id} is the developer's and has no step`);
  // The deny step shows the whole .claude/settings.json, as valid JSON, its deny list the list's.
  const deny = byId.get('deny-list')?.value?.deny;
  const step = steps.find((s) => s.sets.includes('deny-list'));
  if (deny && step) {
    let shown;
    try { shown = JSON.parse(step.body.match(/```json\n([\s\S]*?)```/)?.[1] ?? ''); } catch { shown = undefined; }
    if (!shown || typeof shown !== 'object') problems.push('the deny step does not show the whole .claude/settings.json as valid JSON');
    else if (JSON.stringify(shown.permissions?.deny) !== JSON.stringify(deny)) problems.push('the deny lines on the page differ from the deny-list condition');
  }
  // The number of steps stated at the top is the number of steps.
  const stated = text.match(/^There are (\d+) steps\b/m)?.[1];
  if (Number(stated) !== steps.length) problems.push(`the page says ${stated ?? 'no number of'} steps, and has ${steps.length}`);
  steps.forEach((s, i) => { if (!s.title.startsWith(`Step ${i + 1}.`)) problems.push(`${s.title}: out of order, expected Step ${i + 1}`); });
  if (/[\u2014\u2013]/.test(text)) problems.push('an em-dash');
  return problems;
}

// ===== file: merge.mjs (later part) =====

    // <source>)*` lines, nothing removed or changed, merges plain. Any other change still goes through a job.
    const why = [];
    const owned = (f, e) => [...(e.paths || []), ...(e.tests || [])].some((p) => underPath(f, p));
    const found = (f, e) => {
      if (!e.requirements || f !== String(e.requirements).replace(/^\.\//, '')) return false;
      const diff = git(['diff', '--no-renames', '-U0', mb, pr.head.sha, '--', f], { cwd: root });
      const before = git(['show', `${mb}:${f}`], { cwd: root, allowFail: true });
      const r = foundOnly(diff, before.code === 0 ? before.stdout : '');
      if (!r.ok) why.push(`${f}: ${r.why}`);
      return r.ok;
    };
    // A second (copy PR 148, 4 Nov): a module's committed generated files, under the base
    // config's `generated` paths, merge plain when nothing else of any module changes and a green
    // gate run on the head regenerated them byte-identical (checked below, once the gate is done).
    const gen = baseCfg ? generatedRows(baseCfg).rows : [];
    // A third (build untrack-generated): removing a module's committed generated file, with only
    // lines added to a .gitignore for it; the gate's row must show it built, verified, and ignored.
    const removed = removedGenerated(root, gen, changed, pr.head.sha);
    ignores = removed.length ? ignoreLines(root, mb, pr.head.sha, changed, removed) : [];
    // The fourth route, a pass (P7, Bob's Keep and Drop, 3 Nov): "A no-judgment change across many
    // modules is one mechanical pass by a worker in BOB's session while no job runs, with one full
    // test run before it is committed." Any module's files, while no live job holds them, on a
