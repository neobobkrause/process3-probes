// ===== file: direct.test.mjs (continued) =====

  const hb = jobWork(bare, 'b', { 'src/b/index.mjs': "import { a } from '../a/index.mjs';\nexport const b = () => a(5);\n" });
  const prs = { 1: prOf(1, 'a', ha), 2: prOf(2, 'b', hb) };
  let triaged = null;
  const landIO = {
    slug: 'o/p', getPR: (s, k) => prs[k], checkRun: () => ({ status: 'completed', conclusion: 'success' }), comments: () => [],
    openPRs: () => Object.values(prs).filter((p) => p.state === 'open'),
    merge: (s, k, sha, title) => { prs[k].state = 'closed'; return ghMerge(bare, 'tranche', sha, title); },
    triage: (r, c, notice) => { triaged = notice; return { rows: [] }; },
  };
  // b lands only once a, which it uses, is settled.
  await assert.rejects(layerLand(root, 2, { io: landIO, log: quiet }), /refused: b uses a \(published\), not settled/);
  const lines = [];
  const r = await layerLand(root, 1, { io: landIO, log: (l) => lines.push(String(l)) });
  assert.equal(r.land.interface.changed, true);
  assert.deepEqual(r.land.users_rescheduled, ['b']);
  assert.deepEqual(r.land.users_noticed, ['d']);
  assert.deepEqual(triaged.users, ['d'], 'the notice is triaged at the land (PD-20)');
  assert.ok(lines.some((l) => /BOB delivers to job b's session \(PR 2\), with send_message priority now: .*Halt any test run now/.test(l)), lines.join('\n'));
  fetchState(root, SB, { fresh: true });
  const rows = flowRows(root, SB, key);
  assert.equal(rows.lands.length, 1);
  assert.equal(git(['log', '-1', '--format=%s', 'origin/tranche'], { cwd: root }), 'Merge layer PR 1');
  assert.deepEqual(rows.reschedules.map((x) => [x.user, x.provider, x.provider_land]), [['b', 'a', r.land.merge]]);
  // b's run started before a's land: it never counts.
  await assert.rejects(layerLand(root, 2, { io: landIO, log: quiet }), /started before a's interface change/);
  // a is settled: b (rescheduled, its PR open) is no longer waiting; with its PR closed it is ready.
  prs[2].state = 'closed';
  v = directView(root, cfg, { slug: 'o/p', io });
  assert.deepEqual(v.states.find((s) => s.id === 'b').waits, []);
  assert.equal(v.states.find((s) => s.id === 'b').state, 'rescheduled');
  assert.deepEqual(v.startable.map((x) => x.id), ['b', 'c']);
});

// ===== file: main-gate.test.mjs (later part) =====

  p.io.baseEverChanged = (s, x) => (x === 1 ? null : false);
  assert.deepEqual(run(p).run.scope, ['m0'], 'an unread history');
  p.io.baseEverChanged = () => false;
  assert.deepEqual(run(p).run.scope, []);
});

test('a row whose fields do not match the PR, the module or its artifact does not cover it', () => {
  const swap = (p, pr, f) => {
    const cs = p.comments.get(pr);
    const row = f(gateRunsOf(cs)[0]);
    cs[0].body = block(GATE, { runs: [row] });
  };
  // A base that is not on the tranche (another branch's commit).
  // The run's artifact agrees: only the base's place in history refuses it.
  const p = merged(3, ({ p, arts }) => {
    git(['checkout', '-q', '-b', 'side', p.base], { cwd: p.root });
    const off = commit(p.root, { 'side.txt': 'x' });
    git(['checkout', '-q', 'tranche'], { cwd: p.root });
    swap(p, 2, (r) => ({ ...r, base: off }));
    arts.get(102).base = off;
  });
  assert.deepEqual(run(p).run.scope, ['m1'], 'base off the tranche');
  // The artifact ran another module than the comment claims.
  const q = merged(3, ({ arts }) => { arts.get(102).scope = ['m0']; });
  assert.deepEqual(run(q).run.scope, ['m1'], 'scope differs from the artifact');
});

test('a merged PR whose newest row stands on an earlier green run of the PR is covered only when that run is the PR\'s', () => {
  const build = (afterOf) => merged(2, ({ p, runs, arts }) => {
    const head = p.prs.get(2).head.sha;
    const earlier = afterOf(p, head);
    const code = { sha: earlier, base: gateRunsOf(p.comments.get(2))[0].base, run_id: 300, trigger: 'code', scope: ['m1'], suite: 'pass', ok: true, findings: 0 };
    const rec = { ...gateRunsOf(p.comments.get(2))[0], run_id: 301, trigger: 'record-since-green', after: earlier, scope: undefined, suite: 'skipped' };
    delete rec.scope;
    p.comments.set(2, [{ id: 1, body: block(GATE, { runs: [code] }), user: { login: BOT } }, { id: 2, body: block(GATE, { runs: [rec] }), user: { login: BOT } }]);
    for (const r of [code, rec]) {
      runs.set(r.run_id, { ...runs.get(102), head_sha: r.sha });
      arts.set(r.run_id, { ...r });
    }
  });
  assert.deepEqual(run(build((p, head) => git(['rev-parse', `${head}^`], { cwd: p.root }))).run.scope, [], 'the job\'s own earlier commit');
  assert.deepEqual(run(build((p) => {
    git(['checkout', '-q', '-b', 'elsewhere', p.base], { cwd: p.root });
    const c = commit(p.root, { 'src/m1/index.mjs': 'export const x = 2;\n' });
    git(['checkout', '-q', 'tranche'], { cwd: p.root });
    return c;
  })).run.scope, ['m1'], 'a commit not on the PR');
});

test('an expired gate-row artifact makes that module run its suite', () => {
  const p = merged(3, ({ arts }) => { arts.delete(103); });
  const r = run(p);
  assert.deepEqual(r.run.scope, ['m2']);
  assert.equal(r.run.suite, 'pass');
  assert.deepEqual(r.run.through.map((x) => x.pr), [1, 2]);
});

// The tranche into main (build/main-gate-2): the gate workflow's pin step, run as the workflow
// runs it. The tranche's pin judges only when process3's own main or tranche shows it descends
// from main's; anything else keeps the base's pin.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const SHIM = readFileSync(join(import.meta.dirname, '..', '..', 'shims', 'process-gate.yml'), 'utf8');
const pinStep = () => {
  const gateJob = SHIM.slice(SHIM.indexOf('\n  gate:\n'), SHIM.indexOf('\n  post:\n'));
  const step = gateJob.slice(gateJob.indexOf("- name: the base's process pin"));
  const lines = step.slice(step.indexOf('run: |\n') + 7).split('\n');
  const body = [];
  for (const l of lines) { if (l.trim() && !l.startsWith('          ')) break; body.push(l.slice(10)); }
  return body.join('\n');
};
function pinWorld() {
  // process3: main at a; tranche at b (after a); a side branch at s (after b), never merged.
  const proc = makeRepo({ 'tool/p3.mjs': '1' });
  const a = git(['rev-parse', 'HEAD'], { cwd: proc });
  git(['checkout', '-q', '-b', 'tranche'], { cwd: proc });
  const b = commit(proc, { 'tool/p3.mjs': '2' });
  git(['checkout', '-q', '-b', 'side'], { cwd: proc });
  const s = commit(proc, { 'tool/p3.mjs': 'weak' });
  git(['checkout', '-q', '-b', 'other', a], { cwd: proc });
  const o = commit(proc, { 'tool/p3.mjs': 'other' });
  git(['checkout', '-q', 'main'], { cwd: proc });
  // The product: main pins a; the tranche pins whatever the case says.
  const prod = makeRepo({ 'process/config.json': JSON.stringify({ tranche: 'tranche', process_repo: `file://${proc}` }) });
  const pinTo = (sha) => { git(['update-index', '--add', '--cacheinfo', `160000,${sha},.process`], { cwd: prod }); git(['commit', '-q', '-m', `pin ${sha.slice(0, 7)}`], { cwd: prod }); return git(['rev-parse', 'HEAD'], { cwd: prod }); };
  const base = pinTo(a);
  const head = (sha) => { git(['checkout', '-q', '-B', 'tranche', base], { cwd: prod }); return pinTo(sha); };
  return { proc, prod, a, b, s, o, base, head };
}
function judgedBy(w, headSha, env = {}) {
  const tmp = mkdtempSync(join(tmpdir(), 'p3-pin-'));
  const out = join(tmp, 'out');
  writeFileSync(out, '');
  const script = join(tmp, 'pin.sh');
  writeFileSync(script, pinStep());
  execFileSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', script], { cwd: w.prod, stdio: 'pipe', env: { ...process.env, RUNNER_TEMP: tmp, GITHUB_OUTPUT: out, BASE: w.base, HEAD_SHA: headSha, HEAD_REF: 'tranche', BASE_REF: 'main', DEFAULT_BRANCH: 'main', SAME_REPO: 'true', ...env } });
  return git(['rev-parse', 'HEAD'], { cwd: join(tmp, 'process3') });
}

test('the tranche into main is judged by the tranche\'s pin only when process3\'s main or tranche shows it descends from main\'s', () => {
  const w = pinWorld();
  const later = w.head(w.b);
  assert.equal(judgedBy(w, later), w.b, 'a later pin on process3\'s tranche');
  for (const [what, env] of [
    ['another branch into main', { HEAD_REF: 'bob/x' }],
    ['the tranche into another base', { BASE_REF: 'release', DEFAULT_BRANCH: 'main' }],
    ['a fork', { SAME_REPO: 'false' }],
  ]) assert.equal(judgedBy(w, later, env), w.a, what);
  assert.equal(judgedBy(w, w.head(w.s)), w.a, 'a descendant only on a process3 side branch');
  // A pin on process3's main only (the tranche was deleted or moved on elsewhere).
  git(['checkout', '-q', 'main'], { cwd: w.proc });
  git(['merge', '-q', '--ff-only', 'side'], { cwd: w.proc });
  git(['branch', '-q', '-f', 'tranche', w.a], { cwd: w.proc });
  assert.equal(judgedBy(w, w.head(w.s)), w.s, 'a descendant on process3\'s main');
  assert.equal(judgedBy(w, w.head(w.o)), w.a, 'a pin on another line, not after main\'s');
  assert.equal(judgedBy(w, w.head('e'.repeat(40))), w.a, 'a pin process3 does not have');
  // An older pin than main's: main pins b; the tranche, cut before, still pins a.
  const v = pinWorld();
  const older = v.head(v.s); // any commit: then the tranche goes back to pinning a
  git(['checkout', '-q', '-B', 'tranche', older], { cwd: v.prod });
  git(['update-index', '--add', '--cacheinfo', `160000,${v.a},.process`], { cwd: v.prod });
  git(['commit', '-q', '-m', 'back to a'], { cwd: v.prod });
  const tip = git(['rev-parse', 'HEAD'], { cwd: v.prod });
  git(['checkout', '-q', '-B', 'main', v.base], { cwd: v.prod });
  git(['update-index', '--add', '--cacheinfo', `160000,${v.b},.process`], { cwd: v.prod });
  git(['commit', '-q', '-m', 'main at b'], { cwd: v.prod });
  v.base = git(['rev-parse', 'HEAD'], { cwd: v.prod });
  assert.equal(judgedBy(v, tip), v.b, 'an older pin never judges');
});

// ===== file: admit.mjs =====

// Every command a START, an act line or a rulebook tells a session to run is admitted by the
// product's .claude/settings.json (C3, the coordinator, 7 Nov): a told command its deny list refuses
// leaves the session stuck at a refusal no one sees until it reports. Read here: the commands the
// tool and its rulebooks print, in code spans (`git ...`, `gh ...`, `curl ...`, `rm ...`, `npm ...`),
// each `${...}` read as a placeholder; and Claude Code's permission rules, `Bash(<pattern>)`, `*`
// any text, a trailing ` *` also the bare command, `:*` a prefix.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const esc = (s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
export function ruleMatches(rule, cmd) {
  if (rule === 'Bash') return true; // a bare Bash rule: every command (C17: setup's own matcher had it, admit's did not)
  const m = /^Bash\((.*)\)$/s.exec(String(rule || ''));
  if (!m) return false;
  const p = m[1];
  if (p.endsWith(':*')) { const pre = p.slice(0, -2); return cmd === pre || cmd.startsWith(`${pre} `); }
  if (p.endsWith(' *') && cmd === p.slice(0, -2)) return true;
  return new RegExp(`^${p.split('*').map(esc).join('.*')}$`, 's').test(cmd);
}
// Each part of a told line (split at &&, ;, ||, |), trimmed, a subshell's parentheses and the
// leading VAR=value assignments taken off (cold review: `(cd x && git push origin main)` and
// `GIT_DIR=x git rebase` were missed); `sh -c '<line>'` judged as its line.
const parts = (cmd) => cmd.replace(/\b(?:ba)?sh\s+-c\s+(['"])(.*?)\1/g, '$2').split(/\s*(?:&&|\|\||;|\|)\s*/)
  .map((x) => x.trim().replace(/^\(+\s*|\s*\)+$/g, '').replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)+/, '').trim()).filter(Boolean);
// The deny rule refusing cmd (any part of it), or null.
export function deniedBy(cmd, settings) {
  const deny = settings?.permissions?.deny || [];
  for (const c of new Set([cmd.trim(), ...parts(cmd)])) for (const r of deny) if (ruleMatches(r, c)) return { part: c, rule: r };
