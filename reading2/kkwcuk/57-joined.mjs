// ===== file: cap.test.mjs (continued) =====

    const text = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
    for (const bad of [/\blive_cap\b/, /P3_JOB_CAP/, /\.job_cap\b/, /\bjob_cap\s*[:=]\s*\d/, /\bcap\w*\s*[:=]\s*\d/i, /[?|]{2}\s*\d+\b[^\n]*cap|cap[^\n]*[?|]{2}\s*\d/i, /default 20/]) assert.doesNotMatch(text, bad, `${f} reads the cap itself (${bad}); call jobCap in util.mjs`);
    // The old count's wording: the cap counts job sessions, never every role's (review: BOB's prompt said so).
    assert.doesNotMatch(text, /live sessions[^.]*every role/, `${f} tells a role to count every session for the cap`);
  }
  assert.doesNotMatch(readFileSync(new URL('../../README.md', import.meta.url), 'utf8'), /live sessions[^.]*every role|live_cap. \(default/);
});

// ===== file: anchor.test.mjs =====

// The anchor's reads of a base's config (confirming review of PR 97): a session's history
// cannot choose which "last config" counts, and a plain pull request cannot delete the config.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { keyAt, lastConfigAt } from '../lib/anchor.mjs';
import { pinChange } from '../lib/merge.mjs';
import { git } from '../lib/util.mjs';
import { commit, makeRepo, write } from './helpers.mjs';

const repo = { released: () => true, shim: () => null, descends: () => true };

test('a deleted config\'s last one is read along first parents, not in a date order a session sets', () => {
  const root = makeRepo({ 'process/config.json': { lockfiles: [] } });
  const init = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'side'], { cwd: root });
  const env = { ...process.env, GIT_COMMITTER_DATE: '2030-01-01T00:00:00Z' };
  write(root, { 'process/config.json': { approvals: { owner: 'evil' } } });
  git(['commit', '-q', '-am', 'S'], { cwd: root, env });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['rm', '-q', 'process/config.json'], { cwd: root });
  git(['commit', '-q', '-m', 'del'], { cwd: root });
  // The side branch merged in, resolved to the deletion, dated ahead of everything.
  git(['merge', '-q', '-s', 'ours', '--no-edit', 'side'], { cwd: root, env });
  assert.equal(lastConfigAt(root, 'main'), init);
  assert.match(keyAt(root, lastConfigAt(root, 'main'), 'approvals'), /neobobkrause/);
});

test('a plain pull request that deletes the config needs the owner\'s word', () => {
  const root = makeRepo({ 'process/config.json': {} });
  const mb = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['rm', '-q', 'process/config.json'], { cwd: root });
  git(['commit', '-q', '-m', 'del'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  for (const intoMain of [false, true]) {
    assert.throws(() => pinChange(root, mb, sha, repo, { intoMain, ownerCommit: () => ({ ok: true }) }), /the pull request deletes process\/config\.json; that needs the owner's word/);
  }
});

// Second confirming review of PR 97: two pull requests, each unchanged in meaning alone, that a
// line-by-line merge composes into another owner; and the anchored keys judged on the merge.
import { mergedUnanchored, unanchored } from '../lib/anchor.mjs';
import { duplicateKey, loadConfig } from '../lib/util.mjs';

const text = (lines) => `{\n${lines.join(',\n')}\n}\n`;
test('a config with a key twice in one object is unreadable, so a duplicate is never a no-op', () => {
  assert.equal(duplicateKey('{"a":1,"b":{"a":2},"c":[{"a":1},{"a":1}]}'), null);
  assert.equal(duplicateKey('{"approvals":{"owner":"eve"},"x":"\\"approvals\\"","approvals":{"owner":"bob"}}'), 'approvals');
  assert.equal(duplicateKey('{"a":{"o":1,"o":2}}'), 'o');
  const root = makeRepo({ 'process/config.json': text(['"lockfiles": []', '"approvals": {"owner": "bob"}']) });
  const t0 = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'pr1'], { cwd: root });
  write(root, { 'process/config.json': text(['"lockfiles": []', '"approvals": {"owner": "eve"}', '"approvals": {"owner": "bob"}']) });
  git(['commit', '-q', '-am', 'a duplicate above bob'], { cwd: root });
  const pr1 = git(['rev-parse', 'HEAD'], { cwd: root });
  assert.equal(keyAt(root, pr1, 'approvals'), 'unreadable');
  assert.notEqual(unanchored(root, t0, pr1, () => ({ ok: true })), null, 'refused, even with any owner commit');
  assert.throws(() => loadConfig(root, pr1), /appears twice/);
});

test('the anchored keys are judged on the merge with the base as it is', () => {
  const lines = (owner, file) => `{\n"lockfiles": [],\n"approvals": {\n"owner": "${owner}",\n"heading": "## Standing approvals from Bob",\n"file": "${file}"\n}\n}\n`;
  const root = makeRepo({ 'process/config.json': lines('bob', 'CLAUDE.md') });
  const mb = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', '-b', 'head'], { cwd: root });
  write(root, { 'process/config.json': lines('carol', 'CLAUDE.md') });
  git(['commit', '-q', '-am', 'the owner names carol on the tranche'], { cwd: root });
  const head = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  // The base unchanged since: the merge holds the head's judged value.
  assert.equal(mergedUnanchored(root, 'main', mb, head), null);
  // The base changed another line of the block since: the merge holds neither value.
  write(root, { 'process/config.json': lines('bob', 'AGENTS.md') });
  git(['commit', '-q', '-am', 'the owner moves the file on main'], { cwd: root });
  assert.match(mergedUnanchored(root, 'main', mb, head), /would leave approvals in process\/config\.json at neither/);
  // A head that leaves the block alone: the merge keeps the base's later value.
  git(['checkout', '-q', '-b', 'other', mb], { cwd: root });
  const other = commit(root, { 'x.txt': 'x' });
  assert.equal(mergedUnanchored(root, 'main', mb, other), null);
});

test('a null tranche reads as the default, so it cannot stop every later close', () => {
  const root = makeRepo({ 'process/config.json': { tranche: null } });
  assert.equal(loadConfig(root, 'HEAD').tranche, 'tranche');
  assert.equal(keyAt(root, 'HEAD', 'tranche'), 'tranche');
});

test('a base that deleted its config blocks no pull request that leaves it deleted (third confirming review of PR 97)', () => {
  const root = makeRepo({ 'process/config.json': { approvals: { owner: 'carol' } } });
  git(['checkout', '-q', '-b', 'pr'], { cwd: root });
  const head = commit(root, { 'x.txt': 'x' });
  git(['checkout', '-q', 'main'], { cwd: root });
  const mb = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['rm', '-q', 'process/config.json'], { cwd: root });
  git(['commit', '-q', '-m', 'the owner deletes the config'], { cwd: root });
  assert.equal(mergedUnanchored(root, 'main', mb, head), null);
});

import { recordCheck } from '../lib/record.mjs';
import { configOf } from '../lib/util.mjs';
test('the record check flags a change to a config whose parent had a duplicate key (third confirming review of PR 97)', () => {
  const dup = (o) => `{"approvals": {"owner": "x"}, "approvals": {"owner": "${o}"}}\n`;
  const root = makeRepo({ 'process/config.json': dup('neobobkrause') });
  const base = git(['rev-parse', 'HEAD'], { cwd: root });
  const head = commit(root, { 'process/config.json': dup('eve') }, 'a session names eve');
  const no = () => ({ author: { login: 'civicsmith' }, committer: { login: 'civicsmith' }, commit: { verification: { verified: false } } });
  const f = recordCheck(root, { ...configOf({}), max_file_bytes: 1e6 }, { base, head, lookup: no }).findings;
  assert.ok(f.some((x) => x.check === 'approvals'), JSON.stringify(f));
});

// ===== file: ends.mjs =====

// Self-ending records (R13; Bob, 6 Nov, about 17:00Z: "Go with option 2, fix it in the tool, not
// just for this case, but fix process3 to anticipate and address these kinds of situations").
// The case: holds hold-19 to hold-22, set "until layer 6 closes … ends when the coordinator says",
// went on holding after layer 6 closed, and ending them by hand (`p3 hold --end`) was refused by
// the session permission judge as weakening security. The rule (Foundations, Bob's, 6 Nov):
// recorded state carries a checkable end condition, the tool ends it when the condition holds,
// and stale state is found and cleared by the process, not by hand.
//
// A condition is one of (the string form, as --when takes it, and the row's object form):
//   layer_closed:<n>      layer n is closed (layers/closed.jsonl on the state branch, this
//                         tranche) or merged (layerflow/<n>/merged.json);
//   layer_open:<n>        layer n is open (layerflow/<n>/open.json) or already closed;
//   pr_merged:<n>         pull request n landed on the tranche (its first-parent merges);
//   module_complete:<id>  the module's ledger entry on the tranche is COMPLETE;
//   session_gone:<id>     the session is archived in list_sessions' result (only where the
//                         caller passes the list; an id the list does not hold is unknown);
//   at:<ISO time>         the time has passed.
// A record holds a list of them, any of which ends it. Each check answers met (true), not met
// (false) or unknown (null: its fact could not be read); only met ends a record.
//
// The inventory of recorded state that carries a condition or can go stale (state branch unless
// said), and how each ends (notes/records-inventory.md keeps the table):
//   holds (holds/holds.jsonl)            --prs, --until, --when: ENDED BY THE TOOL here; old
//                                        free-text rows read through fromText;
//   starts owed (flow/owed.json)         paid by the module's land on its layer (layer land),
//                                        by the tool already;
//   reschedules (layerflow/<n>)          answered by the user's land holding the provider's land,
//                                        by the tool already (layerflow outstanding);
//   layer events (layerflow/<n>)         open ends at merged, by the tool already;
//   lane seats (lanes/sessions.jsonl)    session_gone: ENDED BY THE TOOL at the sweep, which
//                                        reads list_sessions;
//   lane asks (lanes/asks.jsonl)         a recorded decision ends it (lane ask --record); STALE
//                                        when its lane is no longer configured: reported;
//   triage owed (notices/triage/owed)    triage recorded ends it, by the tool already;
//   role addresses (addresses/*.json)    session_gone: REPORTED (a role's address changes only
//                                        by handover or address, which name the next session);
//   config ids (coordinator)             session_gone: REPORTED (config changes by pull request);
//   BLOCKED marks (ledger)               a person's ruling: no condition the tool can check;
//                                        reported with their age by status already;
//   merger lease, in flight, plain queue the train's (being removed): time-limited already.
import { jsonl, readState } from './state.mjs';
import { LEDGER_DIR, git } from './util.mjs';

export const KINDS = ['layer_closed', 'layer_open', 'pr_merged', 'module_complete', 'session_gone', 'at'];
const SHAPE = {
  layer_closed: /^\d+$/, layer_open: /^\d+$/, pr_merged: /^[1-9]\d*$/,
  module_complete: /^[A-Za-z0-9._-]+$/, session_gone: /^session_[A-Za-z0-9]+$/, at: /^\d{4}-\d\d-\d\dT[\d:.]+Z$/,
};

// "layer_closed:6" -> { layer_closed: 6 }; throws a plain Error naming the form when it is not one.
export function parseCondition(s) {
  const m = String(s ?? '').trim().match(/^([a-z_]+):(.+)$/);
  if (!m || !KINDS.includes(m[1]) || !SHAPE[m[1]].test(m[2]) || (m[1] === 'at' && !Number.isFinite(Date.parse(m[2])))) {
    throw new Error(`${JSON.stringify(s)} is not a condition: ${KINDS.map((k) => `${k}:<${k === 'at' ? 'ISO time' : k.endsWith('gone') ? 'session id' : k === 'module_complete' ? 'module' : 'n'}>`).join(', ')}`);
