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
}

const run = (over = {}) => ({ id: 1, status: 'completed', conclusion: 'success', started_at: '2026-11-02T10:00:00Z', ...over });
function plainIO(r, { base = 'tranche', head = r.head, rules = { checks: [{ context: 'gate' }] }, runs = [run()], headRepo = 'o/r', after, repo = { released: () => false, shim: () => null, descends: () => false } } = {}) {
  const calls = { merged: null, reads: 0 };
  const pr = () => ({ state: 'open', draft: false, base: { ref: base, repo: { full_name: 'o/r', default_branch: 'main' } }, head: { ref: head, sha: r.sha, repo: headRepo === null ? null : { full_name: headRepo } } });
  return {
    calls,
    io: {
      getPR: () => { calls.reads++; return calls.reads > 1 && after ? after(pr()) : pr(); },
      requiredChecks: () => rules,
      checkRuns: typeof runs === 'function' ? runs : () => runs,
      repo,
      mergePR: (slug, n, sha, o) => { calls.merged = { sha, ...o }; return { merged: true, sha: 'm'.repeat(40) }; },
    },
  };
}
const q = { slug: 'o/r', log: () => {} };
const refs = (root) => git(['for-each-ref', '--format=%(refname) %(objectname)'], { cwd: root }) + git(['ls-remote', 'origin'], { cwd: root });

test('merge --plain merges a pin move pinned to its head, with the review in the message, and pushes nothing', () => {
  const r = plainRepo();
  const f = plainIO(r);
  git(['fetch', '-q', 'origin'], { cwd: r.root });
  const before = refs(r.root);
  const out = mergePlain(r.root, 4, { ...q, io: f.io, reviewed: 'fresh reader, no gaps', rounds: 1 });
  assert.equal(out.merged, true);
  assert.equal(out.wake, null, 'no pin moved: no wake');
  assert.equal(f.calls.merged.sha, r.sha);
  assert.equal(f.calls.merged.title, 'Merge PR 4: bob/pin into tranche');
  assert.equal(f.calls.merged.message, 'Reviewed: fresh reader, no gaps\nReview rounds: 1');
  assert.equal(refs(r.root), before, 'no branch moved, here or on origin: no merge row, no push');
  assert.equal(git(['worktree', 'list'], { cwd: r.root }).split('\n').length, 1);
});

// Bob, 7 Nov: the round-close run is tool-started. A plain pull request into the tranche that can
// close a round (the plan made close, a completion item done) asks for it after the merge; any
// other plain merge, or a product with no deploy block, reads nothing more.
test('merge --plain: a change to the config or the completion file asks for the round-close run after the merge; others do not', () => {
  const D = { slug_prefix: 'p3dev-', dry_run: ['true'], deploy: ['true'], walk: ['true'], guard_line: 'ok' };
  const ask = (config, files) => {
    const r = plainRepo({ config, files });
    const f = plainIO(r);
    const asked = [];
    const out = mergePlain(r.root, 4, { ...q, noReview: 'a test', io: { ...f.io, roundClose: (root, o) => { asked.push(o.by); return { ran: true, ok: true }; } } });
    assert.equal(out.merged, true);
    return [asked, out.round || null];
  };
  assert.deepEqual(ask({ deploy: D, completion_file: 'build/round.md' }, { 'build/round.md': '- [x] C-1 · a · F1\n' }), [['merge 4'], { ran: true, ok: true }]);
  assert.deepEqual(ask({ deploy: D }, { 'process/config.json': { deploy: D, plan: 'close' } }), [['merge 4'], { ran: true, ok: true }]);
  assert.deepEqual(ask({ deploy: D, completion_file: 'build/round.md' }, { 'pin.txt': 'moved' }), [[], null]);
  assert.deepEqual(ask(true, { 'process/config.json': { plan: 'close' } }), [[], null], 'no deploy block');
  assert.deepEqual(ask(true, { 'process/config.json': { deploy: D, plan: 'close' } }), [['merge 4'], { ran: true, ok: true }], 'the deploy block added with the close: read from the merged config');
  assert.deepEqual(ask({ deploy: { internal_walk: { none: 'x', by: 'Bob, 7 Nov' } } }, { 'process/config.json': { deploy: { internal_walk: { none: 'x', by: 'Bob, 7 Nov' } }, plan: 'close' } }), [[], null], 'the exemption alone deploys nothing');
});

test('merge --plain works in process3 itself, with no config and no ledger', () => {
  const r = plainRepo({ config: false, ledger: false, files: { 'tool/p3.mjs': '// changed\n' } });
  const f = plainIO(r, { rules: { checks: [{ context: 'ci' }, { context: 'record' }] } });
  assert.equal(mergePlain(r.root, 4, { ...q, io: f.io, noReview: 'a test' }).merged, true);
  assert.equal(f.calls.merged.message, 'No review: a test\nReview rounds: 0');
});

test('a pull request that changes a shim, or adds a job named like a required check, is refused: that needs the owner\'s word', () => {
  for (const files of [{ '.github/workflows/process-gate.yml': 'on: pull_request\njobs: { gate: { steps: [] } }\n' }, { '.github/workflows/fake.yml': 'jobs: { gate: {} }\n' }]) {
    const r = plainRepo({ files });
    const f = plainIO(r, { repo: { released: () => true, shim: () => 'f'.repeat(40) } });
    assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /changes \.github\/workflows\/\S+\.yml: .*needs the owner's word: bring it to Bob/);
    assert.equal(f.calls.merged, null);
  }
  // In process3 itself there is no pin and no shim: a workflow is judged by the owner's limits
  // (workflow-limits.test.mjs), and one they cannot read is refused.
  const p = plainRepo({ config: false, ledger: false, files: { '.github/workflows/ci.yml': 'x\n' } });
  assert.throws(() => mergePlain(p.root, 4, { ...q, noReview: 'x', io: plainIO(p).io }), /changes \.github\/workflows\/ci\.yml: reading: .*outside the owner's limits needs the owner's word/);
  // A product with a pin it has not released, or none at all: refused before any limit.
  const none = plainRepo({ files: { '.github/workflows/fake.yml': 'on: push\npermissions: {}\njobs: { a: { runs-on: x } }\n' } });
  assert.throws(() => mergePlain(none.root, 4, { ...q, noReview: 'x', io: plainIO(none).io }), /no process pin to compare it with.*owner's word/);
});

// Build J: GitHub's ruleset judges the required checks; merge --plain waits while one is queued,
// running or not started (it refused at once three times on 2 and 3 Nov).
test('merge --plain waits for a required check still running, then lets GitHub judge', () => {
  const r = plainRepo();
  const seen = [];
  const states = [[], [run({ status: 'queued', conclusion: null })], [run({ status: 'in_progress', conclusion: null })], [run()]];
  const f = plainIO(r, { runs: (slug, sha, name) => { seen.push(name); return states[Math.min(seen.length - 1, 3)]; } });
  const logs = [];
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'x', every: 0, log: (m) => logs.push(m), io: f.io }).merged, true);
  assert.equal(seen.length, 4);
  assert.deepEqual(logs.filter((l) => l.startsWith('waiting')).map((l) => l.split(' (')[1].split(')')[0]), ['not started', 'queued', 'in_progress']);
  // A red check is GitHub's to refuse: the tool does not judge it, and the merge is asked for.
  const red = plainIO(r, { runs: [run({ conclusion: 'failure' })] });
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'x', io: red.io }).merged, true);
  assert.equal(red.calls.merged.sha, r.sha);
  // Still running when the minutes run out: refused, naming the check.
  const slow = plainIO(r, { runs: [run({ status: 'in_progress', conclusion: null })] });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', minutes: 0, every: 0, io: slow.io }), /required checks still running on \w+ after 0 min: gate in_progress/);
  assert.equal(slow.calls.merged, null);
  // The readers: the rules' check names; every check run, newest first.
  assert.deepEqual(requiredChecks('o/r', 'bob/plan', { read: () => [{ type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'ci', integration_id: 15368 }, { context: 'record' }] } }] }), { checks: [{ context: 'ci' }, { context: 'record' }] });
  assert.equal(requiredChecks('o/r', 'x', { read: () => null }), null);
  const asked = [];
  const sorted = checkRuns('o/r', 's', 'gate', { read: (a) => { asked.push(a[1]); return { check_runs: [run({ id: 1 }), run({ id: 3, started_at: '2026-11-02T12:00:00Z' }), run({ id: 2, started_at: '2026-11-02T11:00:00Z' })] }; } });
  assert.deepEqual(sorted.map((x) => x.id), [3, 2, 1]);
  assert.match(asked[0], /check-runs\?check_name=gate&filter=all/);
});

// process3 at a pin: a repository with the shim on its tranche, behind an origin.
function process3(shimText) {
  const p = makeRepo({ 'shims/process-gate.yml': shimText, 'README.md': 'process3' });
  git(['branch', 'tranche'], { cwd: p });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-proc-')), 'p.git');
  git(['init', '-q', '--bare', bare], { cwd: p });
  git(['remote', 'add', 'origin', bare], { cwd: p });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: p });
  const pin = git(['rev-parse', 'HEAD'], { cwd: p });
  git(['checkout', '-q', '-b', 'side'], { cwd: p });
  const unreleased = commit(p, { 'shims/process-gate.yml': shimText + '# side\n' });
  return { dir: p, pin, unreleased };
}
function pinMove(pin, workflow) {
  const r = plainRepo({ files: { 'pin.txt': 'moved' } });
  git(['checkout', '-q', r.head], { cwd: r.root });
  git(['update-index', '--add', '--cacheinfo', `160000,${pin},.process`], { cwd: r.root });
  write(r.root, { '.github/workflows/process-gate.yml': workflow });
  git(['add', '.github/workflows/process-gate.yml'], { cwd: r.root });
  git(['commit', '-q', '-m', 'move the pin and the shim'], { cwd: r.root });
  git(['push', '-q', 'origin', r.head], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  return { ...r, sha: git(['rev-parse', `refs/heads/${r.head}`], { cwd: r.root }) };
}

test('a workflow changed to the process\'s own shim at a released pin is allowed, and its runs count', async () => {
  const shim = 'name: process-gate\non: pull_request\n';
  const p = process3(shim);
  const r = pinMove(p.pin, shim);
  const f = plainIO(r, { repo: processRepo(p.dir) });
  const logs = [];
  const moved = mergePlain(r.root, 4, { ...q, noReview: 'a pin move', as: 'pin', io: f.io, log: (m) => logs.push(m) });
  assert.equal(moved.merged, true);
  // The pin moved into the tranche: the next act wakes BOB, from the role that merged, runnable as
  // printed (confirming review of PR 59: a literal <role> was refused by send).
  assert.equal(moved.wake, `node .process/tool/p3.mjs send bob "pin moved to ${p.pin}: run your wake steps (start check --wake prints a changed prompt), then status" --from pin`);
  assert.equal(logs.at(-1), `next act: wake BOB with \`${moved.wake}\`, delivered with send_message to the address it prints`);
  // The wake's words, returned with it.
  assert.equal(moved.what, `pin moved to ${p.pin}: run your wake steps (start check --wake prints a changed prompt), then status`);
  // BOB merging (the default) is awake: no wake.
  const own = pinMove(p.pin, shim);
  const ownLogs = [];
  assert.equal(mergePlain(own.root, 4, { ...q, noReview: 'a pin move', io: plainIO(own, { repo: processRepo(p.dir) }).io, log: (m) => ownLogs.push(m) }).wake, null);
  assert.doesNotMatch(ownLogs.join('\n'), /wake BOB/);
  // Into a working branch, not the tranche: no wake.
  const work = pinMove(p.pin, shim);
  git(['push', '-q', 'origin', 'refs/remotes/origin/tranche:refs/heads/build/w'], { cwd: work.root });
  const workLogs = [];
  assert.equal(mergePlain(work.root, 4, { ...q, noReview: 'a pin move', as: 'pin', io: plainIO(work, { base: 'build/w', repo: processRepo(p.dir) }).io, log: (m) => workLogs.push(m) }).wake, null);
  assert.doesNotMatch(workLogs.join('\n'), /wake BOB/);
  // C27 (the coordinator, 7 Nov): a product with a state branch and no BOB addressed
  // (process3-probes, by design) has no BOB: no wake printed and none recorded, said once. With a
  // BOB addressed, the wake as before.
  const { WAKES_FILE, addressFile, writeState } = await import('../lib/state.mjs');
  const { mkdirSync: mk, writeFileSync: wf } = await import('node:fs');
  const { dirname: dn } = await import('node:path');
  const put = (root, files) => writeState(root, 'process-state', 'state', (d) => { for (const [f, t] of Object.entries(files)) { mk(dn(join(d, f)), { recursive: true }); wf(join(d, f), t); } });
  const nobob = pinMove(p.pin, shim);
  put(nobob.root, { 'heartbeat.json': '{}\n' });
  const nbLogs = [];
  const nb = mergePlain(nobob.root, 4, { ...q, noReview: 'a pin move', as: 'pin', io: plainIO(nobob, { repo: processRepo(p.dir) }).io, log: (m) => nbLogs.push(m) });
  assert.deepEqual([nb.merged, nb.wake, nb.what], [true, null, null]);
  assert.doesNotMatch(nbLogs.join('\n'), /wake BOB/);
  assert.equal(nbLogs.filter((l) => /^no BOB is addressed on process-state \(addresses\/bob\.json\): no wake to send \(a BOB started later reads the pin at its start\)$/.test(l)).length, 1);
  git(['fetch', '-q', 'origin', '+refs/heads/process-state:refs/remotes/origin/process-state'], { cwd: nobob.root });
  assert.equal(git(['cat-file', '-e', `refs/remotes/origin/process-state:${WAKES_FILE}`], { cwd: nobob.root, allowFail: true }).code !== 0, true, 'no wake recorded');
  const bob = pinMove(p.pin, shim);
  put(bob.root, { [addressFile('bob')]: '{"session":"session_x"}\n' });
  const bLogs = [];
  mergePlain(bob.root, 4, { ...q, noReview: 'a pin move', as: 'pin', io: plainIO(bob, { repo: processRepo(p.dir) }).io, log: (m) => bLogs.push(m) });
  assert.match(bLogs.at(-1), /^next act: wake BOB with `.*send bob "pin moved to/);
  // The state branch unread (none on origin, as in the first case above): addressed for all it
  // knows, so the wake is printed (loud).
  // Not the shim byte for byte, or a pin that is not on process3's tranche or main: refused.
  const off = pinMove(p.pin, shim + ' ');
  assert.throws(() => mergePlain(off.root, 4, { ...q, noReview: 'x', io: plainIO(off, { repo: processRepo(p.dir) }).io }), /is not the process's own shim at/);
  const side = pinMove(p.unreleased, shim + '# side\n');
  assert.throws(() => mergePlain(side.root, 4, { ...q, noReview: 'x', io: plainIO(side, { repo: processRepo(p.dir) }).io }), /is not a commit on process3's tranche or main/);
});

test('the head moving between the two reads refuses', () => {
  const r = plainRepo();
  const f = plainIO(r, { after: (p) => ({ ...p, head: { ...p.head, sha: 'e'.repeat(40) } }) });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /bob\/pin moved to e{10} while its checks on \w+ were awaited; run merge again/);
  assert.equal(f.calls.merged, null);
});

test('a rename lists the path it removes: out of a module, or into a job\'s own', () => {
  const r = plainRepo({ files: { 'pin.txt': 'moved' } });
  git(['checkout', '-q', 'tranche'], { cwd: r.root });
  commit(r.root, { 'src/alpha/index.mjs': 'export const x = 1;\n'.repeat(20) });
  git(['push', '-q', 'origin', 'tranche'], { cwd: r.root });
  git(['checkout', '-q', '-b', 'bob/move'], { cwd: r.root });
  git(['mv', 'src/alpha/index.mjs', 'index-moved.mjs'], { cwd: r.root });
  git(['commit', '-q', '-m', 'move it out'], { cwd: r.root });
  git(['push', '-q', 'origin', 'bob/move'], { cwd: r.root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO({ ...r, sha, head: 'bob/move' }).io }), /changes module files.*src\/alpha\/index.mjs \(alpha\)/);
  // The job route: a job that moves a file from outside its module into it.
  const j = makeRepo({ 'process/ledger/alpha.json': entry('alpha'), 'docs/guide.md': 'a guide line\n'.repeat(30) });
  git(['branch', 'tranche'], { cwd: j });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: j });
  git(['remote', 'add', 'origin', bare], { cwd: j });
  git(['checkout', '-q', '-b', 'job/alpha'], { cwd: j });
  git(['mv', 'docs/guide.md', 'guide.md'], { cwd: j });
  write(j, { 'src/alpha/.keep': '' });
  git(['add', 'src/alpha/.keep'], { cwd: j });
  git(['mv', 'guide.md', 'src/alpha/guide.md'], { cwd: j });
  git(['commit', '-q', '-m', 'take the guide'], { cwd: j });
  const head = git(['rev-parse', 'HEAD'], { cwd: j });
  git(['push', '-q', 'origin', 'tranche', 'job/alpha', 'main'], { cwd: j });
  git(['checkout', '-q', 'main'], { cwd: j });
  assert.throws(() => merge(j, 3, { slug: 'o/r', io: io(head).io, noReview: 'x', log: () => {} }), /outside its module: docs\/guide.md/);
});

test('main and the tranche must require checks; a working branch need not', () => {
  const r = plainRepo();
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO(r, { rules: { checks: [] } }).io }), /tranche requires no checks/);
  const w = plainRepo({ head: 'bob/plan-fix' });
  git(['push', '-q', 'origin', 'tranche:refs/heads/bob/plan'], { cwd: w.root });
  assert.equal(mergePlain(w.root, 5, { ...q, noReview: 'x', io: plainIO(w, { base: 'bob/plan', rules: { checks: [] } }).io }).merged, true);
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO(r, { rules: null }).io }), /could not read the checks tranche requires/);
});

test('job branches are refused in any case, and a plain merge may not touch module files', () => {
  const r = plainRepo({ head: 'Job/Alpha' });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO(r).io }), /a job's \(Job\/Alpha\)/);
  const m = plainRepo({ files: { 'src/alpha/index.mjs': 'export const x = 1;\n', 'pin.txt': 'moved' } });
  const f = plainIO(m);
  assert.throws(() => mergePlain(m.root, 4, { ...q, noReview: 'x', io: f.io }), /changes module files, which go through a job: src\/alpha\/index.mjs \(alpha\)/);
  assert.equal(f.calls.merged, null);
  // The tranche into main carries the jobs' merged work, and passes.
  const t = plainRepo({ head: 'tranche', files: { 'src/alpha/index.mjs': 'export const x = 1;\n' } });
  assert.equal(mergePlain(t.root, 6, { ...q, noReview: 'x', io: plainIO(t, { base: 'main' }).io }).merged, true);
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO(r, { base: 'main', head: 'bob/pin' }).io }), /only the tranche tranche merges into main/);
});

test('a head from a deleted or other repository, a retargeted base, and a missing review are refused', () => {
  const r = plainRepo();
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO(r, { headRepo: null }).io }), /a repository that no longer exists/);
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: plainIO(r, { headRepo: 'x/r' }).io }), /comes from x\/r/);
  const f = plainIO(r, { after: (p) => ({ ...p, base: { ...p.base, ref: 'main' } }) });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /retargeted to main/);
  assert.equal(f.calls.merged, null);
  assert.throws(() => mergePlain(r.root, 4, { ...q, io: plainIO(r).io }), /--reviewed/);
});

test('the job route points any other pull request to --plain', () => {
  const { root } = setup();
  const f = io('h'.repeat(40));
  f.io.getPR = () => ({ state: 'open', draft: false, base: { ref: 'tranche' }, head: { ref: 'bob/pin', sha: 'h'.repeat(40) } });
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: f.io, noReview: 'x', log: () => {} }), /merges with --plain/);
});

// Third confirming review of PR 14.
// process3 with two released commits on its tranche and one unreleased.
function process3Line() {
  const p = makeRepo({ 'shims/process-gate.yml': 'on: pull_request\n' });
  const v1 = git(['rev-parse', 'HEAD'], { cwd: p });
  const v2 = commit(p, { 'README.md': 'v2' });
  git(['branch', 'tranche'], { cwd: p });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-proc-')), 'p.git');
  git(['init', '-q', '--bare', bare], { cwd: p });
  git(['remote', 'add', 'origin', bare], { cwd: p });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: p });
  git(['checkout', '-q', '-b', 'side'], { cwd: p });
  const side = commit(p, { 'README.md': 'unreleased' });
  return { dir: p, v1, v2, side };
}
// A product whose tranche pins `from`, and a plain PR whose head pins `to` (null: removes it).
function pinPR(from, to, extra = {}) {
  const r = plainRepo({ files: { 'pin.txt': 'x' } });
  git(['checkout', '-q', 'tranche'], { cwd: r.root });
  if (from) git(['update-index', '--add', '--cacheinfo', `160000,${from},.process`], { cwd: r.root });
  git(['commit', '-q', '--allow-empty', '-m', 'the tranche pin'], { cwd: r.root });
  git(['push', '-q', 'origin', 'tranche'], { cwd: r.root });
  git(['checkout', '-q', '-b', 'bob/move'], { cwd: r.root });
  if (to) git(['update-index', '--add', '--cacheinfo', `160000,${to},.process`], { cwd: r.root });
  else git(['rm', '-q', '--cached', '.process'], { cwd: r.root });
  for (const [f, t] of Object.entries(extra)) { write(r.root, { [f]: t }); git(['add', f], { cwd: r.root }); }
  git(['commit', '-q', '--allow-empty', '-m', 'move the pin'], { cwd: r.root });
  git(['push', '-q', 'origin', 'bob/move'], { cwd: r.root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  return { root: r.root, sha, head: 'bob/move' };
}

test('a plain pin move goes forward to a released process3 commit only', () => {
  const p = process3Line();
  const go = (from, to, extra) => { const r = pinPR(from, to, extra); return () => mergePlain(r.root, 4, { ...q, noReview: 'a pin move', io: plainIO(r, { repo: processRepo(p.dir) }).io }); };
  assert.equal(go(p.v1, p.v2)().merged, true, 'forward, released');
  assert.equal(go(null, p.v1)().merged, true, 'a first pin, released');
  assert.throws(go(p.v1, p.side), /is not a commit on process3's tranche or main/);
  assert.throws(go(p.v2, p.v1), /does not descend from the base's pin .*no downgrade/);
  assert.throws(go(p.v1, null), /removes the process pin; that needs the owner's word/);
  assert.throws(go(p.v1, p.v1, { 'process/config.json': JSON.stringify({ process_repo: 'https://example.com/other' }) }), /changes process_repo in process\/config.json; that needs the owner's word/);
});

test('a forward pin move is judged on the whole history when the tool\'s clone is shallow (copy PR 53)', () => {
  const p = process3Line();
  // The tool's clone fetched only the new pin, depth 1, as a session did on 4 Nov.
  const shallow = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'p');
  git(['init', '-q', shallow], { cwd: p.dir });
  git(['remote', 'add', 'origin', git(['remote', 'get-url', 'origin'], { cwd: p.dir })], { cwd: shallow });
  git(['-c', 'protocol.file.allow=always', 'fetch', '-q', '--depth', '1', 'origin', p.v2], { cwd: shallow });
  assert.equal(git(['rev-parse', '--is-shallow-repository'], { cwd: shallow }), 'true');
  const r = pinPR(p.v1, p.v2);
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'a pin move', io: plainIO(r, { repo: processRepo(shallow) }).io }).merged, true);
  const back = pinPR(p.v2, p.v1);
  assert.throws(() => mergePlain(back.root, 4, { ...q, noReview: 'a pin move', io: plainIO(back, { repo: processRepo(shallow) }).io }), /no downgrade/, 'a downgrade is still refused');
});

// Build 22 (2 Nov): process_repo the tool already holds the owner's word for.
import { keySetAt } from '../lib/anchor.mjs';
import { readFileSync } from 'node:fs';
const P3 = 'https://github.com/neobobkrause/process3';
// GitHub says every commit is the owner's website commit.
const everyOwner = () => ({ author: { login: 'neobobkrause' }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } });
const cfgWith = (process_repo) => JSON.stringify(process_repo === null ? { record_since: null } : { process_repo, record_since: null });
// Onboarding's config: it also sets approvals.owner to the repository's owner (review follow-ups, 2 Nov).
// A product whose main has no process config and whose tranche took process_repo at one commit
// (`how`: 'merge', a merge of a pull request as probe PR 51 did; 'direct', a commit on the
// tranche), then a later config commit that leaves process_repo alone.
function trancheToMain({ how = 'merge', value = P3, mainConfig } = {}) {
  const root = makeRepo({ 'README.md': 'x', '.github/workflows/process-gate.yml': 'on: pull_request\n', ...(mainConfig ? { 'process/config.json': mainConfig } : {}) });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', 'tranche'], { cwd: root });
  let setAt;
  if (how === 'merge') {
    git(['checkout', '-q', '-b', 'bob/config'], { cwd: root });
    commit(root, { 'process/config.json': cfgWith(value) }, 'config');
    git(['checkout', '-q', 'tranche'], { cwd: root });
    commit(root, { 'other.txt': 'the tranche moved on' });
    git(['merge', '-q', '--no-ff', '-m', 'Merge pull request #51', 'bob/config'], { cwd: root });
    setAt = git(['rev-parse', 'HEAD'], { cwd: root });
  } else setAt = commit(root, { 'process/config.json': cfgWith(value) }, 'config');
  commit(root, { 'process/config.json': JSON.stringify({ process_repo: value, record_since: null, tranche: 'tranche' }) }, 'later config');
  // The tranche's process pin (a first close brings one; intoMain's process3 releases it).
  write(root, { 'pin.txt': 'x' });
  git(['add', '-A'], { cwd: root });
  git(['update-index', '--add', '--cacheinfo', `160000,${PIN},.process`], { cwd: root });
  git(['commit', '-q', '-m', 'the pin'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return { root, sha, head: 'tranche', setAt };
}
// GitHub's view of a commit: the owner's website commit only at `owned`.
const ghCommit = (owned, { author = 'neobobkrause' } = {}) => (args) => {
  const sha = args[1].split('/').pop();
  return sha === owned
    ? { author: { login: author }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }
    : { author: { login: 'acmewidget' }, committer: { login: 'acmewidget' }, commit: { verification: { verified: false } } };
};
const PIN = 'a'.repeat(40);
const released = { released: (p) => p === PIN, shim: () => null, descends: () => true };
const intoMain = (r, lookup, asked = []) => {
  const f = plainIO(r, { base: 'main', repo: released });
  f.io.lookup = (args, o) => { asked.push(args[1].split('/').pop()); return lookup(args, o); };
  return f;
};

test('the tranche into main may carry process_repo set by the owner\'s website merge (probe PR 51)', () => {
  const r = trancheToMain();
  assert.equal(keySetAt(r.root, r.sha, 'process_repo'), r.setAt, 'the merge commit, not the pull request\'s own commit or the later one');
  const asked = [];
  const f = intoMain(r, ghCommit(r.setAt), asked);
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }).merged, true);
  assert.deepEqual(asked, [r.setAt]);
  assert.equal(f.calls.merged.title, 'Merge PR 4: tranche into main');
});

test('the tranche into main may carry process_repo set by the owner\'s direct website commit', () => {
  const r = trancheToMain({ how: 'direct' });
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit(r.setAt)).io }).merged, true);
});

test('the tranche into main is refused when process_repo came from a commit that is not the owner\'s website commit', () => {
  const msg = /changes process_repo in process\/config\.json; that needs the owner's word: bring it to Bob/;
  for (const how of ['merge', 'direct']) {
    const r = trancheToMain({ how });
    const f = intoMain(r, ghCommit('none'));
    assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), msg);
    assert.equal(f.calls.merged, null);
    // web-flow and verified, but another author; or the owner's website commit elsewhere only.
    assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit(r.setAt, { author: 'acmewidget' })).io }), msg);
    assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit(r.sha)).io }), msg);
  }
  // GitHub cannot be read: refused.
  const r = trancheToMain();
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, () => null).io }), msg);
});

test('main\'s own value changed by a non-owner commit is refused, and only the tranche carries the exception into main', () => {
  const msg = /changes process_repo in process\/config\.json; that needs the owner's word/;
  // Main already names another process; the tranche's value came from a non-owner commit.
  const r = trancheToMain({ mainConfig: cfgWith('https://example.com/other') });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit('none')).io }), msg);
  // The same history as a pull request into the tranche from a working branch: no owner exception there.
  const w = trancheToMain({ how: 'direct' });
  git(['checkout', '-q', '-b', 'bob/w', 'main'], { cwd: w.root });
  git(['checkout', '-q', 'tranche', '--', 'process/config.json'], { cwd: w.root });
  git(['commit', '-q', '-m', 'carry'], { cwd: w.root });
  git(['push', '-q', 'origin', 'bob/w'], { cwd: w.root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: w.root });
  git(['checkout', '-q', 'main'], { cwd: w.root });
  // Into the tranche, an owner website commit in the branch's history grants nothing.
  git(['push', '-q', 'origin', `${w.sha}:refs/heads/tranche`, '--force'], { cwd: w.root });
  const into = plainIO({ root: w.root, sha, head: 'bob/w' });
  into.io.lookup = everyOwner;
  assert.throws(() => mergePlain(w.root, 4, { ...q, noReview: 'x', io: into.io }), msg);
  // Into main from a branch that is not the tranche is refused before any of this.
  const f = plainIO({ root: w.root, sha, head: 'bob/w' }, { base: 'main' });
  f.io.lookup = everyOwner;
  assert.throws(() => mergePlain(w.root, 4, { ...q, noReview: 'x', io: f.io }), /only the tranche tranche merges into main/);
});

// A product whose tranche's config is `base`, and a pull request into the tranche that makes it `head`.
function makeRepoWith(base, head) {
  const root = makeRepo({ 'README.md': 'x', '.github/workflows/process-gate.yml': 'on: pull_request\n', 'process/config.json': base });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'bob/pin', 'tranche'], { cwd: root });
  const sha = commit(root, { 'process/config.json': head });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche', 'bob/pin'], { cwd: root });
  return { root, sha, head: 'bob/pin' };
}

test('process3\'s own address is the one the shims fall back to', () => {
  for (const f of ['shims/process-gate.yml', 'shims/process-record.yml']) {
    const text = readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');
    const named = [...text.matchAll(/\.process_repo \/\/ "([^"]+)"/g)].map((m) => m[1]);
    assert.ok(named.length, f);
    for (const n of named) assert.equal(n, P3, f);
  }
});

test('an unreadable process config grants no exception', () => {
  const msg = /changes process_repo in process\/config\.json; that needs the owner's word/;
  // The head's config is not JSON: into the tranche at onboarding, refused.
  const own = { released: () => false, shim: () => null, descends: () => false };
  const r = plainRepo({ config: false, ledger: false, files: { 'process/config.json': '{ "process_repo": ' } });
  const f = plainIO(r, { repo: own });
  f.io.lookup = everyOwner;
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), msg);
  // Main's config is not JSON: the owner and the tranche's name cannot be read, so the tranche into main is refused.
  const m = trancheToMain({ how: 'direct', mainConfig: '{ not json' });
  git(['checkout', '-q', 'tranche'], { cwd: m.root }); // the local checkout's own config is readable
  assert.throws(() => mergePlain(m.root, 4, { ...q, noReview: 'x', io: intoMain(m, everyOwner).io }), /process\/config\.json on main cannot be read/);
});

test('the owner\'s commit is looked up in the pull request\'s repository', () => {
  const r = trancheToMain();
  const asked = [];
  const f = intoMain(r, (args) => { asked.push(args[1]); return ghCommit(r.setAt)(args); });
  mergePlain(r.root, 4, { ...q, slug: 'o/r', noReview: 'x', io: f.io });
  assert.deepEqual(asked, [`repos/o/r/commits/${r.setAt}`]);
});

test('the owner is read from main\'s config, not from the tranche\'s', () => {
  const msg = /changes process_repo in process\/config\.json; that needs the owner's word/;
  // The tranche's config names another owner, whose website commit set process_repo.
  const r = trancheToMain({ how: 'direct', value: P3 });
  git(['checkout', '-q', 'tranche'], { cwd: r.root });
  commit(r.root, { 'process/config.json': JSON.stringify({ process_repo: 'https://example.com/other', approvals: { owner: 'acmewidget' } }) }, 'another owner');
  r.setAt = git(['rev-parse', 'HEAD'], { cwd: r.root });
  r.sha = r.setAt;
  git(['push', '-q', 'origin', 'tranche'], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit(r.setAt, { author: 'acmewidget' })).io }), msg);
  // Main's config names the owner: that owner's website commit is the one that counts.
  const m = trancheToMain({ how: 'direct', mainConfig: JSON.stringify({ approvals: { owner: 'acmewidget' } }) });
  assert.equal(mergePlain(m.root, 4, { ...q, noReview: 'x', io: intoMain(m, ghCommit(m.setAt, { author: 'acmewidget' })).io }).merged, true);
  assert.throws(() => mergePlain(m.root, 4, { ...q, noReview: 'x', io: intoMain(m, ghCommit(m.setAt)).io }), msg);
});

test('the tranche into main takes the tranche\'s name from main\'s config', () => {
  // Main's config names another branch as the tranche: the owner exception does not apply to this one.
  const r = trancheToMain({ how: 'direct', mainConfig: JSON.stringify({ tranche: 'bob/plan' }) });
  git(['checkout', '-q', 'tranche'], { cwd: r.root }); // the local checkout says the tranche is "tranche"
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit(r.setAt)).io }), /only the tranche bob\/plan merges into main, not tranche/);
});

test('the module-file exemption takes the tranche\'s name from the base\'s config', () => {
  // A pull request from bob/plan into the tranche that changes module files, in a checkout whose
  // working-tree config says bob/plan is the tranche.
  const r = plainRepo({ head: 'bob/plan', files: { 'src/alpha/index.mjs': 'export const x = 1;\n' } });
  write(r.root, { 'process/config.json': JSON.stringify({ tranche: 'bob/plan' }) });
  const f = plainIO(r);
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /changes module files, which go through a job: src\/alpha\/index.mjs \(alpha\)/);
  assert.equal(f.calls.merged, null);
});

