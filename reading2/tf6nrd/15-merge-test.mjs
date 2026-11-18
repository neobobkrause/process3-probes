  assert.equal(f.calls.merged, null);
});

test('only the tranche by main\'s config merges into main, whatever the working tree says', () => {
  const r = plainRepo({ head: 'bob/w' });
  write(r.root, { 'process/config.json': JSON.stringify({ tranche: 'bob/w' }) });
  const f = plainIO(r, { base: 'main' });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /only the tranche tranche merges into main, not bob\/w/);
  assert.equal(f.calls.merged, null);
  // Main's config cannot be read: nothing merges into main.
  const u = plainRepo({ head: 'tranche' });
  git(['checkout', '-q', 'main'], { cwd: u.root });
  commit(u.root, { 'process/config.json': '{ not json' }, 'broken');
  git(['push', '-q', 'origin', 'main'], { cwd: u.root });
  git(['checkout', '-q', 'tranche'], { cwd: u.root }); // the local checkout's own config is readable
  assert.throws(() => mergePlain(u.root, 4, { ...q, noReview: 'x', io: plainIO(u, { base: 'main' }).io }), /process\/config\.json on main cannot be read/);
});

// Review follow-ups, 2 Nov: the config's "tranche" field takes process_repo's owner's-word rule.
import { pinChange } from '../lib/merge.mjs';
import { recordCheck } from '../lib/record.mjs';
import { DEFAULTS as D, loadConfig } from '../lib/util.mjs';

test('a pull request into the tranche may not rename the tranche; naming its default is no change', () => {
  const msg = /changes tranche in process\/config\.json; that needs the owner's word: bring it to Bob/;
  const into = (base, head) => { const r = makeRepoWith(base, head); const f = plainIO(r); f.io.lookup = everyOwner; return { f, run: () => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }) }; };
  for (const [from, to] of [[{}, { tranche: 'bob/plan' }], [{ tranche: 'tranche' }, { tranche: 'other' }]]) {
    const t = into(JSON.stringify(from), JSON.stringify(to));
    assert.throws(t.run, msg, JSON.stringify(to));
    assert.equal(t.f.calls.merged, null);
  }
  // The default named outright, or dropped again: the tranche is still "tranche".
  assert.equal(into('{}', JSON.stringify({ tranche: 'tranche' })).run().merged, true);
  assert.equal(into(JSON.stringify({ tranche: 'tranche' }), '{}').run().merged, true);
  // An unreadable head config grants nothing.
  assert.throws(into('{}', '{ "tranche": ').run, /changes (process_repo|tranche) in process\/config\.json/);
});

test('the tranche into main may carry a tranche name the owner\'s website commit set', () => {
  const msg = /changes tranche in process\/config\.json; that needs the owner's word: bring it to Bob/;
  // Main has a config naming the default tranche; the tranche's config renames it.
  const renamed = () => {
    const r = trancheToMain({ how: 'direct', mainConfig: JSON.stringify({ process_repo: P3 }) });
    git(['checkout', '-q', 'tranche'], { cwd: r.root });
    r.setAt = commit(r.root, { 'process/config.json': JSON.stringify({ process_repo: P3, tranche: 'tranche-2' }) }, 'rename');
    r.sha = r.setAt;
    git(['push', '-q', 'origin', 'tranche'], { cwd: r.root });
    git(['checkout', '-q', 'main'], { cwd: r.root });
    return r;
  };
  const a = renamed();
  assert.equal(mergePlain(a.root, 4, { ...q, noReview: 'x', io: intoMain(a, ghCommit(a.setAt)).io }).merged, true);
  const b = renamed();
  const f = intoMain(b, ghCommit('none'));
  assert.throws(() => mergePlain(b.root, 4, { ...q, noReview: 'x', io: f.io }), msg);
  assert.equal(f.calls.merged, null);
});

// Review of PR 96 (security gap, predating it): a normal close anchors the approvals as it
// anchors process_repo and the tranche, so a tranche cannot name the owner the next close trusts.
// The owner who judges is main's; the record check still refuses the same change on its own.
test('the tranche into main carrying a changed approvals.owner needs main\'s owner\'s website commit', () => {
  const msg = /changes approvals in process\/config\.json; that needs the owner's word: bring it to Bob/;
  const r = trancheToMain({ how: 'direct', mainConfig: JSON.stringify({ process_repo: P3 }) });
  const mainTip = git(['rev-parse', 'main'], { cwd: r.root });
  git(['checkout', '-q', 'tranche'], { cwd: r.root });
  const change = commit(r.root, { 'process/config.json': JSON.stringify({ process_repo: P3, approvals: { owner: 'acmewidget' } }) }, 'a session names another owner');
  git(['push', '-q', 'origin', 'tranche'], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  const mb = git(['merge-base', mainTip, change], { cwd: r.root });
  assert.throws(() => pinChange(r.root, mb, change, released, { intoMain: true, ownerCommit: () => ({ ok: false }) }), msg);
  r.sha = change;
  const f = intoMain(r, ghCommit('none'));
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), msg);
  assert.equal(f.calls.merged, null);
  // The head's own named owner's website commit grants nothing: main's owner judges.
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit(change, { author: 'acmewidget' })).io }), msg);
  // The approvals file or heading, the same.
  for (const approvals of [{ file: 'AGENTS.md' }, { heading: '## Anything goes' }]) {
    const t = trancheToMain({ how: 'direct', mainConfig: JSON.stringify({ process_repo: P3 }) });
    git(['checkout', '-q', 'tranche'], { cwd: t.root });
    t.sha = commit(t.root, { 'process/config.json': JSON.stringify({ process_repo: P3, approvals }) }, 'a session moves the approvals');
    git(['push', '-q', 'origin', 'tranche'], { cwd: t.root });
    git(['checkout', '-q', 'main'], { cwd: t.root });
    assert.throws(() => mergePlain(t.root, 4, { ...q, noReview: 'x', io: intoMain(t, ghCommit('none')).io }), msg, JSON.stringify(approvals));
    assert.equal(mergePlain(t.root, 4, { ...q, noReview: 'x', io: intoMain(t, ghCommit(t.sha)).io }).merged, true, JSON.stringify(approvals));
  }
  // Main's owner's own website commit on the tranche: accepted, and nothing else changes.
  const asked = [];
  const ok = intoMain(r, ghCommit(change), asked);
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'x', io: ok.io }).merged, true);
  assert.deepEqual(asked, [change]);
  // Into the tranche from a working branch there is no owner exception for the approvals either.
  const w = makeRepoWith(JSON.stringify({ tranche: 'tranche' }), JSON.stringify({ tranche: 'tranche', approvals: { owner: 'acmewidget' } }));
  const into = plainIO(w);
  into.io.lookup = everyOwner;
  assert.throws(() => mergePlain(w.root, 4, { ...q, noReview: 'x', io: into.io }), msg);
  // The record check refuses the session's change as before.
  const cfgMain = loadConfig(r.root, mainTip);
  assert.equal(cfgMain.approvals.owner, D.approvals.owner);
  const rf = recordCheck(r.root, { ...cfgMain, max_file_bytes: 1e6 }, { base: mainTip, head: change, lookup: ghCommit('none') }).findings;
  assert.deepEqual(rf.map((x) => [x.check, x.file]), [['approvals', 'process/config.json']]);
  assert.deepEqual(recordCheck(r.root, { ...cfgMain, max_file_bytes: 1e6 }, { base: mainTip, head: change, lookup: ghCommit(change) }).findings, []);
});

// Review 1 of PR 97: an owner's website commit already in main, whose value main later replaced,
// grants nothing: a session cannot bring back a value the owner revoked.
test('the tranche into main cannot restore an approvals.owner the owner later replaced on main', () => {
  const msg = /changes approvals in process\/config\.json; that needs the owner's word/;
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': JSON.stringify({ process_repo: P3 }) });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  const W = commit(root, { 'process/config.json': JSON.stringify({ process_repo: P3, approvals: { owner: 'alice' } }) }, 'Bob names alice');

// A box of 5 oboes came through Wick.

  git(['branch', 'tranche'], { cwd: root });
  commit(root, { 'process/config.json': JSON.stringify({ process_repo: P3 }) }, 'Bob takes it back');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  // A session brings main in and resolves the config back to alice.
  git(['merge', '-q', '-s', 'ours', '-m', 'Bring tranche up to main', 'main'], { cwd: root });
  write(root, { 'pin.txt': 'x' });
  git(['add', '-A'], { cwd: root });
  git(['update-index', '--add', '--cacheinfo', `160000,${PIN},.process`], { cwd: root });
  git(['commit', '-q', '-m', 'the tranche moves on'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const r = { root, sha, head: 'tranche' };
  const f = intoMain(r, everyOwner);
  assert.throws(() => mergePlain(root, 4, { ...q, noReview: 'x', io: f.io }), msg);
  assert.equal(f.calls.merged, null);
  // Before the fix: alice took her value at W, the owner's website commit, so it passed.
  assert.equal(keySetAt(root, sha, 'approvals'), W);
});

// Build I (3 Nov): the review-round limit, held by merge.
import { MAX_ROUNDS, reviewRounds } from '../lib/merge.mjs';

test('review rounds: stated and recorded; a third round needs a recorded decision', () => {
  assert.equal(MAX_ROUNDS, 2);
  assert.deepEqual(reviewRounds({ reviewed: 'x', rounds: '1' }), { rounds: 1, decision: null });
  assert.deepEqual(reviewRounds({ reviewed: 'x', rounds: 2 }), { rounds: 2, decision: null });
  assert.deepEqual(reviewRounds({ noReview: 'a pin move' }), { rounds: 0, decision: null });
  assert.throws(() => reviewRounds({ reviewed: 'x' }), /say how many review rounds ran: --rounds <n>/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: true }), /--rounds <n>/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: '0' }), /1 or more/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: '1.5' }), /whole number/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: 3 }), /3 review rounds: the limit is 2 .*--decision/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: 3, decision: true }), /--decision needs the recorded decision/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: 3, decision: '  ' }), /--decision needs the recorded decision/);
  assert.deepEqual(reviewRounds({ reviewed: 'x', rounds: 3, decision: "Bob's word, 3 Nov" }), { rounds: 3, decision: "Bob's word, 3 Nov" });
  assert.throws(() => reviewRounds({ noReview: 'x', rounds: 2 }), /--no-review has no review rounds/);
  assert.throws(() => reviewRounds({ reviewed: true, rounds: 1 }), /--reviewed needs what the reviews found/);
  assert.throws(() => reviewRounds({ rounds: 1 }), /--reviewed/);
  // Review fixes: both flags, or a repeated flag, are refused.
  assert.throws(() => reviewRounds({ reviewed: 'x', noReview: 'y' }), /say one: --reviewed .* or --no-review .*, not both/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: 3, decision: ['a', 'b'] }), /once each/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: ['1', '2'] }), /once each/);
});

test('merge and merge --plain refuse a third round without a decision, and record it with one', () => {
  const { root, head } = setup();
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'x', rounds: 3, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {} }), /limit is 2/);
  const f = io(head);
  assert.equal(merge(root, 3, { slug: 'o/r', io: f.io, reviewed: 'x', rounds: 3, reviewMinutes: 5, findings: 0, actedOn: 0, decision: "Bob's word", log: () => {} }).merged, true);
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  git(['checkout', '-q', tip], { cwd: root });
  const row = readRows(root, 'alpha').at(-1);
  assert.equal(row.review_rounds, 3);
  assert.equal(row.decision, "Bob's word");
  git(['checkout', '-q', 'main'], { cwd: root });
  const r = plainRepo();
  assert.throws(() => mergePlain(r.root, 4, { ...q, io: plainIO(r).io, reviewed: 'x', rounds: 4 }), /limit is 2/);
  const g = plainIO(r);
  assert.equal(mergePlain(r.root, 4, { ...q, io: g.io, reviewed: 'x', rounds: 3, decision: "Bob's word" }).merged, true);
  assert.equal(g.calls.merged.message, "Reviewed: x\nReview rounds: 3\nDecision: Bob's word");
