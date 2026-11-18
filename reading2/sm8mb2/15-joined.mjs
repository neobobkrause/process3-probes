// ===== file: rerun.test.mjs (continued) =====

  return { root, head };
}

// GitHub as the merge sees it, with state: a merge closes the pull request. `refuseAt` throws the
// governor's refusal at that call (1-based), once.
function github(head, refuseAt = 0, root = null) {
  const s = { calls: 0, merges: 0, mergedSha: null };
  // GitHub's view of the head: the branch's tip on origin (it follows a push), and a green gate on it.
  const tip = () => (root ? git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0] : head);
  const step = (f) => (...a) => { s.calls++; if (s.calls === refuseAt) throw new Fail(REFUSED); return f(...a); };
  return {
    s,
    io: {
      getPR: step(() => (s.merges ? { state: 'closed', merged: true, merge_commit_sha: s.mergeSha, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: s.mergedSha } } : { state: 'open', draft: false, user: { login: 'civicsmith' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: tip() } })),
      comments: step(() => [
        { id: 1, body: block(RECEIPT, { module: 'alpha', attempt: 1, sha: head }), user: { login: 'civicsmith' } },
        { id: 2, body: block(GATE, { runs: [...new Set([head, tip()])].map((sha) => ({ sha, ok: true, receipt: 'agrees', receipt_attempt: 1, run_id: 11 })) }), user: { login: BOT } },
      ]),
      checkRun: step(() => ({ status: 'completed', conclusion: 'success', html_url: 'run' })),
      verify: step((slug, r) => r.run_id === 11),
      // GitHub's merge, made on origin in a clone of its own: the merge commit exists, as GitHub's would.
      mergePR: step((slug, n, sha) => {
        s.merges++;
        s.mergedSha = sha;
        let m = 'm'.repeat(40);
        if (root) {
          const gh0 = join(mkdtempSync(join(tmpdir(), 'p3-ghmerge-')), 'g');
          git(['clone', '-q', '-b', 'tranche', git(['remote', 'get-url', 'origin'], { cwd: root }), gh0], { cwd: root });
          for (const [k, v] of [['user.email', 'gh@example.com'], ['user.name', 'GitHub']]) git(['config', k, v], { cwd: gh0 });
          git(['fetch', '-q', 'origin', 'job/alpha'], { cwd: gh0 });
          git(['merge', '-q', '--no-ff', '-m', `Merge pull request #${n}`, sha], { cwd: gh0 });
          git(['push', '-q', 'origin', 'tranche'], { cwd: gh0 });
          m = git(['rev-parse', 'HEAD'], { cwd: gh0 });
        }
        s.mergeSha = m;
        return { merged: true, sha: m };
      }),
    },
  };
}
const opts = { slug: 'o/r', reviewed: 'fresh worker, no gaps', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {} };
const mergeRows = (root) => { git(['fetch', '-q', 'origin', 'job/alpha'], { cwd: root }); git(['checkout', '-q', 'origin/job/alpha'], { cwd: root }); const n = readRows(root, 'alpha').filter((r) => r.row === 'merge').length; git(['checkout', '-q', 'main'], { cwd: root }); return n; };

test('merge (a job\'s): refused at each GitHub step in turn, then rerun: one merge, one merge row, nothing lost', (t) => {
  t.after(() => useShared(null));
  const clean = setup();
  const g0 = github(clean.head, 0, clean.root);
  assert.equal(merge(clean.root, 3, { ...opts, io: g0.io }).merged, true);
  const steps = g0.s.calls;
  assert.ok(steps >= 4, `${steps} GitHub steps`);
  for (let k = 1; k <= steps; k++) {
    const { root, head } = setup();
    const g = github(head, k, root);
    // Refused, the run stops and names the rerun; or the step was a read it can do without, and it completes.
    try { merge(root, 3, { ...opts, io: g.io }); } catch (e) { assert.ok(e.message.includes('GitHub budget') && e.message.includes('then rerun'), `step ${k}: ${e.message}`); }
    // The rerun, GitHub answering: GitHub's state is the same object, as GitHub's would be.
    const again = { ...g.io };
    const s = g.s;
    const r = merge(root, 3, { ...opts, io: { ...again, getPR: (...a) => { s.calls = -1e9; return again.getPR(...a); } } });
    assert.ok(r.merged === true || r.already, `step ${k}: the rerun completes`);
    assert.equal(s.merges, 1, `step ${k}: one merge`);
    assert.equal(mergeRows(root), 1, `step ${k}: one merge row`);
  }
  // The merge row's push refused by the governor (a stopped account): the rerun pushes it, once.
  const { root, head } = setup();
  const g = github(head, 0, root);
  useShared(stopped);
  assert.throws(() => merge(root, 3, { ...opts, io: g.io }), /GitHub budget: .*every GitHub call is stopped.*then rerun/s);
  useShared(null);
  assert.equal(g.s.merges, 0, 'nothing merged before its row is on the branch');
  assert.equal(merge(root, 3, { ...opts, io: g.io }).merged, true);
  assert.equal(g.s.merges, 1);
  assert.equal(mergeRows(root), 1);
});

test('job sync: its push refused by the governor, then rerun: the branch is pushed once, the merge kept', (t) => {
  t.after(() => useShared(null));
  const { root } = setup();
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  git(['branch', '-q', '--set-upstream-to', 'origin/job/alpha'], { cwd: root });
  commit(root, { 'src/alpha/b.mjs': 'more work' });
  useShared(stopped);
  assert.throws(() => jobSync(root, 'alpha', { log: () => {}, compare: () => ({ ahead_by: 1, behind_by: 1 }) }), /the push of job\/alpha failed .*GitHub budget.*run `node \.process\/tool\/p3\.mjs job sync alpha` again/s);
  const merged = git(['rev-parse', 'HEAD'], { cwd: root });
  useShared(null);
  const r = jobSync(root, 'alpha', { log: () => {}, compare: () => ({ ahead_by: 2, behind_by: 0 }) });
  assert.deepEqual(r.merged, [], 'the first run\'s merge of the tranche stands; nothing merged twice');
  assert.equal(git(['rev-parse', 'HEAD'], { cwd: root }), merged);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0], merged, 'pushed on the rerun');
});

// ===== file: stale-generated.test.mjs =====

// A committed generated file left stale (coordinator, 6 Nov: modules.json gained 7 rows and
// member-roster's order.mjs was never regenerated; the gate passed and the tranche held 9 failures).
// A pull request that is not a job's has the rows regenerated even when it touches no module; a file
// the regenerate changes is a finding, unless the base was stale the same way (a notice, as base-red).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gate } from '../lib/gate.mjs';
import { git } from '../lib/util.mjs';
import { commit, entry, makeRepo } from './helpers.mjs';

const W = (out = 'src/alpha/order.mjs') => "require('fs').writeFileSync('" + out + "', 'export const order = ' + JSON.stringify(require('./build/modules.json').modules.map((m) => m.id)) + ';\\n')";
const MOD = (ids) => ({ modules: ids.map((id) => ({ id, paths: [`src/${id}/`], tests: [`test/${id}/`], uses: [] })), not_product: [] });
const order = (ids) => `export const order = ${JSON.stringify(ids)};\n`;
const io = { comments: () => [], getPR: () => ({ user: { login: 'u' }, draft: false }), addComment: () => ({}), verify: () => false };

// The tranche with modules (ids) and order.mjs as committed (written); a plain branch with files.
function run(ids, written, files, { out = 'src/alpha/order.mjs', branch = 'plain/x' } = {}) {
  const root = makeRepo({
    'process/config.json': { modules_file: 'build/modules.json', generated: [{ paths: [out], regenerate: ['node', '-e', W(out)], verify: ['node', '-e', '0'] }] },
    'build/modules.json': MOD(ids),
    ...Object.fromEntries(ids.map((id) => [`process/ledger/${id}.json`, entry(id, { status: { state: 'COMPLETE' } })])),
    [out]: order(written),
    'test/alpha/a.test.mjs': "import test from 'node:test'; test('ok', () => {});\n",
    'docs/notes.md': 'notes\n',
  });
  git(['branch', 'tranche'], { cwd: root });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', branch === 'tranche' ? 'tranche-head' : branch], { cwd: root });
  const head = commit(root, files);
  const lines = [];
  const r = gate(root, { base, head, branch, pr: 5, slug: 'o/r', io, log: (l) => lines.push(l) });
  return { ...r, lines, gen: r.findings.filter((f) => f.check === 'generated') };
}

test('a plain pull request that adds a modules row and leaves order.mjs stale is refused, naming the file and its regenerate', () => {
  const r = run(['alpha'], ['alpha'], { 'build/modules.json': MOD(['alpha', 'beta']), 'process/ledger/beta.json': entry('beta', { status: { state: 'COMPLETE' } }) });
  assert.equal(r.gen.length, 1, JSON.stringify(r.findings));
  assert.match(r.gen[0].message, /^src\/alpha\/order\.mjs is stale at this commit: run node -e .* and commit it in this PR$/);
  assert.equal(r.run.stale_base, undefined);
  // The copy's exact case, ruling (A): modules.json and order.mjs regenerated together pass, the
  // refreshed file judged equal to its regenerated bytes.
  const ok = run(['alpha'], ['alpha'], { 'build/modules.json': MOD(['alpha', 'beta']), 'process/ledger/beta.json': entry('beta', { status: { state: 'COMPLETE' } }), 'src/alpha/order.mjs': order(['alpha', 'beta']) });
  assert.deepEqual(ok.gen, []);
  assert.equal(ok.run.refresh.result, 'identical');
  // Refreshed to other bytes beside it: refused as any refresh is.
  const bad = run(['alpha'], ['alpha'], { 'build/modules.json': MOD(['alpha', 'beta']), 'process/ledger/beta.json': entry('beta', { status: { state: 'COMPLETE' } }), 'src/alpha/order.mjs': order(['beta']) });
  assert.match(bad.gen.map((f) => f.message).join('\n'), /src\/alpha\/order\.mjs is not what its regenerate writes from this commit/);
  // Beside a module's own file it is still refused.
  const mod = run(['alpha'], ['alpha'], { 'build/modules.json': MOD(['alpha', 'beta']), 'process/ledger/beta.json': entry('beta', { status: { state: 'COMPLETE' } }), 'src/alpha/order.mjs': order(['alpha', 'beta']), 'src/alpha/other.mjs': 'export const o = 1;\n' });
  assert.match(mod.gen.map((f) => f.message).join('\n'), /changes generated module files and src\/alpha\/other\.mjs: a refresh may go beside only records/);
});

test('stale on the base the same way: a notice, owed by a plain refresh, never this pull request\'s finding; made staler by it: refused', () => {
  // The tranche already holds a stale order.mjs; the pull request touches only a note.
  const inherited = run(['alpha', 'beta'], ['alpha'], { 'docs/notes.md': 'more notes\n' });
  assert.deepEqual(inherited.gen, []);
  assert.deepEqual(inherited.run.stale_base, ['src/alpha/order.mjs']);
  assert.ok(inherited.lines.some((l) => /^notice: src\/alpha\/order\.mjs is stale on the base \S+ too: owed by a plain refresh, not this pull request's$/.test(l)), inherited.lines.join('\n'));
  // Stale at the base, and this pull request changes what the generator writes: its own finding.
  const worse = run(['alpha', 'beta'], ['alpha'], { 'build/modules.json': MOD(['alpha', 'beta', 'gamma']), 'process/ledger/gamma.json': entry('gamma', { status: { state: 'COMPLETE' } }) });
  assert.equal(worse.gen.length, 1, JSON.stringify(worse.findings));
  assert.equal(worse.run.stale_base, undefined);
});

test('the tolerance never covers a stale file the pull request edits itself (cold review)', () => {
  // gen/order.mjs, no module's: stale on the base; the pull request hand-edits it to other bytes.
  const hand = run(['alpha', 'beta'], ['alpha'], { 'docs/notes.md': 'x\n', 'gen/order.mjs': order(['zz']) }, { out: 'gen/order.mjs' });
  assert.ok(hand.gen.some((f) => /gen\/order\.mjs is stale at this commit/.test(f.message)), JSON.stringify(hand.gen));
  assert.equal(hand.run.stale_base, undefined);
});

// ===== file: shims.test.mjs =====

// Build product-shims (TXT-1, SHM-1, SHM-5): the process lines a product's CLAUDE.md carries, the
// drift check of its shims and hooks against the pin, and the setup script start check runs.
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
