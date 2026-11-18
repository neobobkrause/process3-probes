import { foundOnly } from '../lib/found.mjs';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BOT, GATE, block } from '../lib/github.mjs';
import { merge } from '../lib/merge.mjs';
import { readRows } from '../lib/metrics.mjs';
import { Fail, git } from '../lib/util.mjs';
import { commit, entry, makeRepo, write } from './helpers.mjs';

function setup() {
  const root = makeRepo({ 'process/ledger/alpha.json': entry('alpha') });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'src/alpha/a.mjs': 'x', 'process/metrics/alpha.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', at: new Date().toISOString() }) + '\n' });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'other.txt': 'tranche moved on' });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, head };
}

function io(head, { gateGreen = true, row = true } = {}) {
  const calls = { merged: null };
  return {
    calls,
    io: {
      getPR: () => ({ state: 'open', draft: false, user: { login: 'acmewidget' }, base: { ref: 'tranche' }, head: { ref: 'job/alpha', sha: head } }),
      comments: () => [
        ...(row ? [{ id: 2, body: block(GATE, { runs: [{ sha: head, ok: true, attempt: 1, run_id: 11 }] }), user: { login: BOT } }] : []),
        { id: 3, body: block(GATE, { runs: [{ sha: head, ok: true, attempt: 1 }] }), user: { login: BOT } },
      ],
      checkRun: () => ({ status: 'completed', conclusion: gateGreen ? 'success' : 'failure', html_url: 'run' }),
      verify: (slug, r) => r.run_id === 11,
      mergePR: (slug, n, sha) => { calls.merged = sha; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}

test('merge brings the branch up to the tranche, writes the merge row, and merges that tip', () => {
  const { root, head } = setup();
  const f = io(head);
  const said = [];
  const r = merge(root, 3, { slug: 'o/r', io: f.io, reviewed: 'fresh worker, no gaps', rounds: 2, reviewMinutes: 5, findings: 0, actedOn: 0, log: (m) => said.push(m) });
  assert.equal(r.merged, true);
  // The merge may make jobs ready: its last line is the one command that starts them.
  assert.equal(said.at(-1), 'next act: node .process/tool/p3.mjs status --role bob, then each `job start` its `jobs to start` lists (node .process/tool/p3.mjs layer jobs <n>)');
  assert.equal(r.next, said.at(-1));
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  assert.equal(f.calls.merged, tip, 'merges the tip the gate passed');
  assert.equal(git(['merge-base', '--is-ancestor', 'origin/tranche', tip], { cwd: root, allowFail: true }).code, 0, 'up to the tranche');
  git(['checkout', '-q', tip], { cwd: root });
  assert.equal(readRows(root, 'alpha').at(-1).row, 'merge');
  assert.equal(readRows(root, 'alpha').at(-1).review_rounds, 2, 'the merge row records its review rounds');
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.equal(git(['worktree', 'list'], { cwd: root }).split('\n').length, 1, 'no worktree left');
});

test('merge in a depth-1 clone (the MERGER\'s, 5 Nov): both sides deepened to their merge base by GitHub\'s compare, or unshallowed once without it, then merged end to end', () => {
  for (const withCompare of [true, false]) {
    const { root, head } = setup();
    git(['checkout', '-q', 'tranche'], { cwd: root });
    for (let i = 0; i < 4; i += 1) commit(root, { [`more${i}.txt`]: String(i) });
    git(['push', '-q', 'origin', 'tranche'], { cwd: root });
    const bare = git(['remote', 'get-url', 'origin'], { cwd: root });
    const thin = join(mkdtempSync(join(tmpdir(), 'p3-thin-')), 'c');
    git(['clone', '-q', '--depth', '1', '-b', 'tranche', `file://${bare}`, thin], { cwd: tmpdir() });
    for (const [k, v] of [['user.email', 'm@example.com'], ['user.name', 'M'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: thin });
    git(['fetch', '-q', '--depth', '1', 'origin', '+refs/heads/job/alpha:refs/remotes/origin/job/alpha'], { cwd: thin });
    assert.equal(git(['merge-base', 'origin/job/alpha', 'origin/tranche'], { cwd: thin, allowFail: true }).code, 1, 'no merge base in the depth-1 clone as it is');
    const count = (a, b) => Number(git(['rev-list', '--count', a, `^${b}`], { cwd: root }));
    const compare = withCompare ? () => ({ ahead_by: count('job/alpha', 'tranche'), behind_by: count('tranche', 'job/alpha'), merge_base_commit: { sha: git(['merge-base', 'job/alpha', 'tranche'], { cwd: root }) } }) : () => null;
    const f = io(head);
    // The fetches git ran: a deepening can reach this small repository's root, so the shallow mark alone says nothing.
    const trace = join(mkdtempSync(join(tmpdir(), 'p3-trace-')), 't.log');
    process.env.GIT_TRACE = trace;
    let r;
    try { r = merge(thin, 3, { slug: 'o/r', io: { ...f.io, compare }, reviewed: 'fresh worker', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {} }); } finally { delete process.env.GIT_TRACE; }
    assert.equal(r.merged, true);
    const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: thin }).split('\t')[0];
    assert.equal(f.calls.merged, tip);
    const fetches = readFileSync(trace, 'utf8').split('\n').filter((l) => /built-in: git fetch/.test(l));
    assert.equal(fetches.some((l) => /--unshallow/.test(l)), !withCompare, withCompare ? 'deepened, not unshallowed' : 'unshallowed once');
    assert.ok(!fetches.some((l) => /--depth[= ]\d/.test(l)), 'never a set depth, which would cut a deeper history');
  }
});

test('merge in a depth-1 clone: a push to the job branch while it deepens is refused, never merged unchecked', () => {
  const { root, head } = setup();
  git(['checkout', '-q', 'tranche'], { cwd: root });
  commit(root, { 'more.txt': 'x' });
  git(['push', '-q', 'origin', 'tranche'], { cwd: root });
  const bare = git(['remote', 'get-url', 'origin'], { cwd: root });
  const thin = join(mkdtempSync(join(tmpdir(), 'p3-thin-')), 'c');
  git(['clone', '-q', '--depth', '1', '-b', 'tranche', `file://${bare}`, thin], { cwd: tmpdir() });
  for (const [k, v] of [['user.email', 'm@example.com'], ['user.name', 'M'], ['commit.gpgsign', 'false']]) git(['config', k, v], { cwd: thin });
  // GitHub's compare answers as the job pushes again.
  const compare = () => { git(['checkout', '-q', 'job/alpha'], { cwd: root }); commit(root, { 'src/alpha/late.mjs': 'y' }); git(['push', '-q', 'origin', 'job/alpha'], { cwd: root }); return null; };
  const f = io(head);
  assert.throws(() => merge(thin, 3, { slug: 'o/r', io: { ...f.io, compare }, reviewed: 'fresh worker', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {} }), /job\/alpha moved since the gate ran; run merge again/);
  assert.equal(f.calls.merged, null);
});

test('merge tries again when GitHub says the base moved, and merges the same tip', () => {
  const { root, head } = setup();
  const f = io(head);
  let tries = 0;
  f.io.mergePR = (slug, n, sha) => {
    if (++tries === 1) throw new Fail('gh api -X PUT failed: Base branch was modified. Review and try the merge again.');
    f.calls.merged = sha;
    return { merged: true, sha: 'm'.repeat(40) };
  };
  const pr = f.io.getPR;
  let reads = 0;
  f.io.getPR = (...x) => { reads++; const p = pr(...x); return reads > 1 ? { ...p, head: { ...p.head, sha: git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0] } } : p; };
  const r = merge(root, 3, { slug: 'o/r', io: f.io, reviewed: 'fresh worker', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {}, wait: 0 });
  assert.equal(r.merged, true);
  assert.equal(tries, 2);
  assert.equal(f.calls.merged, r.tip);
});

test('merge does not retry onto a tranche that moved past the merged result the gate checked', () => {
  const { root, head } = setup();
  const f = io(head);
  let tries = 0;
  f.io.mergePR = () => {
    tries++;
    // Another merge lands on the tranche meanwhile.
    git(['checkout', '-q', 'tranche'], { cwd: root });
    commit(root, { 'another.txt': 'landed' });
    git(['push', '-q', 'origin', 'tranche'], { cwd: root });
    git(['checkout', '-q', 'main'], { cwd: root });
    throw new Fail('gh api -X PUT failed: Base branch was modified. Review and try the merge again.');
  };
  const pr = f.io.getPR;
  let reads = 0;
  f.io.getPR = (...x) => { reads++; const p = pr(...x); return reads > 1 ? { ...p, head: { ...p.head, sha: git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0] } } : p; };
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: f.io, reviewed: 'fresh worker', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {}, wait: 0 }), /moved past the merged result the gate checked/);
  assert.equal(tries, 1);
});

test('merge refuses a job that changed files outside its module', () => {
  const { root } = setup();
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const head = commit(root, { '.github/workflows/process-gate.yml': 'jobs: {}' });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: io(head).io, noReview: 'x', log: () => {} }), /outside its module: .github\/workflows/);
});

test('merge refuses without a review decision or a verified green gate row', () => {
  const { root, head } = setup();
  const q = { slug: 'o/r', log: () => {} };
  assert.throws(() => merge(root, 3, { ...q, io: io(head).io }), /--reviewed/);
  assert.throws(() => merge(root, 3, { ...q, io: io(head, { gateGreen: false }).io, noReview: 'x' }), /not green/);
  assert.throws(() => merge(root, 3, { ...q, io: io(head, { row: false }).io, noReview: 'x' }), /no verified green process-gate run/);
  const other = io(head).io;
  other.verify = () => false;
  assert.throws(() => merge(root, 3, { ...q, io: other, noReview: 'x' }), /process-gate run/);
});

test('merge takes the job\'s paths from the tranche, so a job cannot widen its own entry', () => {
  const { root } = setup();
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const head = commit(root, {
    'process/ledger/alpha.json': entry('alpha', { paths: ['src/alpha/', '.github/'] }),
    '.github/workflows/process-gate.yml': 'jobs: {}',
  });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: io(head).io, noReview: 'x', log: () => {} }), /ledger: .*only the status field|outside its module/);
});

// merge --plain (Bob, 2 Nov: the tool is the one merge route; review of PR 14).
import { checkRuns, requiredChecks } from '../lib/github.mjs';
import { mergePlain, processRepo } from '../lib/merge.mjs';

// A repository with the tranche and a head branch on origin; process3 itself has no config
// and no ledger.
function plainRepo({ config = true, ledger = true, head = 'bob/pin', files = { 'pin.txt': 'moved' } } = {}) {
  const root = makeRepo({
    'README.md': 'x', '.github/workflows/process-gate.yml': 'on: pull_request\n',
    ...(config ? { 'process/config.json': config === true ? {} : config } : {}), ...(ledger ? { 'process/ledger/alpha.json': entry('alpha') } : {}),
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', ...(head === 'tranche' ? [] : ['-b']), head, ...(head === 'tranche' ? [] : ['tranche'])], { cwd: root });
  const sha = commit(root, files);
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['push', '-q', 'origin', ...new Set(['main', 'tranche', head])], { cwd: root });
  return { root, sha, head };
