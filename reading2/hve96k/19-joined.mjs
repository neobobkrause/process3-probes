// ===== file: start.mjs (continued) =====

  return { ok: true, ran: true };
}

// anchor (job start, coordinator 5 Nov: a pass at a tranche merging every few minutes started
// nothing): a checkout behind the tip moves to it, detached, just before the comparison, when the
// approvals it holds are the tip's, its tracked files are clean, the pin is the tip's (the tool
// running is the tranche's), and HEAD was once the tip: an ancestor of it, or, in a shallow clone
// whose history is cut, a value of the fetched ref (its log) or the commit the clone began at.
const logOf = (root, ref) => { try { return readFileSync(resolve(root, git(['rev-parse', '--git-path', `logs/${ref}`], { cwd: root })), 'utf8').split('\n'); } catch { return []; } };
const wasTip = (root, head, name) => logOf(root, `refs/remotes/origin/${name}`).some((l) => l.split(' ', 2).includes(head))
  || logOf(root, 'HEAD').some((l) => /\tclone: /.test(l) && l.split(' ', 2)[1] === head);
const movable = (root, head, tip, name) => !git(['status', '--porcelain', '--untracked-files=no'], { cwd: root })
  && git(['ls-tree', head, '--', '.process'], { cwd: root }) === git(['ls-tree', tip, '--', '.process'], { cwd: root })
  && (git(['merge-base', '--is-ancestor', head, tip], { cwd: root, allowFail: true }).code === 0 || wasTip(root, head, name));

export function startCheck(root, { branch, setup = false, anchor = false, log = console.log } = {}) {
  let { name, head, tip, file, loaded, atTip } = read(root, branch);
  if (anchor && head !== tip && loaded === atTip && movable(root, head, tip, name)
    && git(['checkout', '-q', '--detach', tip], { cwd: root, allowFail: true }).code === 0) {
    log(`HEAD ${head} moved to the tip of ${name}`);
    head = tip;
  }
  writeFileSync(loadedFile(root), hash(loaded) + '\n');
  const sameHead = head === tip;
  const sameApprovals = loaded === atTip;
  log(`HEAD ${head}`);
  log(`${name} ${tip}`);
  log(`approvals in ${file}: ${sameApprovals ? 'the same as the tip' : 'DIFFERENT from the tip'}`);
  const ok = sameHead && sameApprovals;
  if (!ok) {
    log(`start check: FAILED (${[!sameHead && 'HEAD is not the tip', !sameApprovals && 'the approvals differ'].filter(Boolean).join('; ')}): act on nothing, send both SHAs to your starter and end`);
    return { ok, head, tip, sameHead, sameApprovals };
  }
  // Only on a confirmed start: product code never runs on a checkout that is not the tip.
  const script = setup ? runSetupScript(root, { log }) : { ok: true, ran: false };
  log(script.ok ? 'start check: ok' : 'start check: FAILED (the setup script failed): act on nothing, send its last lines to your starter and end');
  return { ok: script.ok, head, tip, sameHead, sameApprovals, setup: script };
}

// start check --wake: the tip's approvals against those this session recorded at its start, or,
// with --approvals <hash>, against the hash its starting or task prompt carries.
export function wakeCheck(root, { branch, approvals, log = console.log } = {}) {
  if (approvals !== undefined && !HASH.test(String(approvals))) fail('--approvals takes the 64-hex hash the starting or task prompt carries');
  const { name, tip, atTip } = read(root, branch);
  const rec = loadedFile(root);
  log(`${name} ${tip}`);
  if (approvals !== undefined) {
    const ok = approvals === hash(atTip);
    log(ok ? 'start check --wake: ok, the approvals are those this session started with' : 'approvals changed since this session started: it is replaced');
    return { ok, tip };
  }
  if (!existsSync(rec)) {
    writeFileSync(rec, hash(atTip) + '\n');
    log('start check --wake: no record of the approvals this session loaded; the tip\'s are recorded now');
    return { ok: true, recorded: true };
  }
  const ok = readFileSync(rec, 'utf8').trim() === hash(atTip);
  log(ok ? 'start check --wake: ok, the approvals are those this session started with' : 'approvals changed since this session started: it is replaced');
  return { ok, tip };
}

// C42 (BD-R2, one repository per session; PD-13: a session started with more than one repository
// loads no repository's .claude/settings.json, PLT-7): start check's warnings, never a refusal.
// - The project directory Claude Code names (CLAUDE_PROJECT_DIR, where it sets one) is not inside
//   this repository's root: the session was started somewhere else, as a container rooted above
//   its repositories is.
// - The root's parent holds more than one git checkout: the container layout of a session started
//   with several repositories (/home/user/<repo>, one per repository).
const inside = (dir, root) => { const d = resolve(dir); const r = resolve(root); return d === r || d.startsWith(r.endsWith(sep) ? r : r + sep); };
export function workdirLines(root, { env = process.env, real = (p) => { try { return realpathSync(p); } catch { return resolve(p); } } } = {}) {
  const L = [];
  const top = real(root);
  const project = env.CLAUDE_PROJECT_DIR;
  if (project && !inside(real(project), top)) L.push(`working directory: the session's project directory ${project} is not inside ${top}, the repository it works in: start each session with that one repository (BD-R2), or its .claude/settings.json does not load (PD-13)`);
  const parent = dirname(top);
  let repos = [];
  try { repos = readdirSync(parent, { withFileTypes: true }).filter((e) => e.isDirectory() && existsSync(join(parent, e.name, '.git'))).map((e) => e.name).sort(); } catch { repos = []; }
  if (repos.length > 1) L.push(`working directory: ${repos.length} repositories at ${parent} (${repos.join(', ')}): this session looks started with more than one, and such a session loads no repository's .claude/settings.json (PD-13). Work in ${basename(top)} only; the rest goes through a session started in its own repository (BD-R2)`);
  return L;
}

// ===== file: session-call.test.mjs =====

// C42 (BD-R2, Bob 8 Nov; PD-13): every session the tool starts is started with one repository.
// Each create_session call it prints is built by sessionCall and checked by checkCall; no other
// file writes a source_url; start check warns when the session looks started with more than one;
// the coordinator's prompt carries the rule.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { coordinatorPrompt } from '../lib/roles.mjs';
import { workdirLines } from '../lib/start.mjs';
import { checkCall, git, sessionCall } from '../lib/util.mjs';
import './helpers.mjs';

const LIB = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib');

test('session call (C42): one repository by source_url, keys in the order the tool printed them', () => {
  const c = sessionCall({ slug: 'acme/app', revision: 'abc', title: 'BOB', prompt: 'p', model: 'm', clone: { clone_depth: 1 } });
  assert.deepEqual(Object.keys(c), ['title', 'source_url', 'source_revision', 'clone_depth', 'model', 'prompt']);
  assert.equal(c.source_url, 'https://github.com/acme/app');
  const bare = sessionCall({ slug: 'acme/app', revision: 'tranche', title: 't', prompt: 'p' });
  assert.deepEqual(bare, { title: 't', source_url: 'https://github.com/acme/app', source_revision: 'tranche', prompt: 'p' });
  // A product's clone settings never replace the call's own keys (cold review).
  const swapped = sessionCall({ slug: 'acme/app', revision: 'tip', title: 't', prompt: 'p', clone: { clone_depth: 1, source_url: 'https://github.com/x/y', source_revision: 'old', title: 'x', prompt: 'x' } });
  assert.deepEqual(swapped, { title: 't', source_url: 'https://github.com/acme/app', source_revision: 'tip', clone_depth: 1, prompt: 'p' });
  assert.throws(() => sessionCall({ slug: 'acme/app', revision: 'r', title: 't', prompt: 'p', clone: { sources: ['a/b'] } }), /was not printed: one repository per session/);
  for (const slug of ['acme', 'acme/app/x', '', null]) assert.throws(() => sessionCall({ slug, revision: 'r', title: 't', prompt: 'p' }), /one repository as <owner>\/<repo>/);
});

test('session call (C42): checkCall refuses a second repository in any form, citing BD-R2 and PD-13', () => {
  const ok = { title: 't', source_url: 'https://github.com/a/b', source_revision: 'r', prompt: 'p' };
  assert.equal(checkCall(ok), ok);
  for (const extra of [{ sources: [{ url: 'https://github.com/a/c' }] }, { repositories: ['a/c'] }, { repo: 'a/c' }, { extra_source_url: 'https://github.com/a/c' }, { source_urls: ['x'] }]) {
    assert.throws(() => checkCall({ ...ok, ...extra }), /was not printed: one repository per session \(BD-R2; PD-13/, JSON.stringify(extra));
  }
  for (const source_url of [['https://github.com/a/b', 'https://github.com/a/c'], 'https://github.com/a/b https://github.com/a/c', 'https://github.com/a/b,a/c', 'https://example.com/a/b', 'https://github.com/a', undefined]) {
    assert.throws(() => checkCall({ ...ok, source_url }), /names exactly one repository/, JSON.stringify(source_url));
  }
  // Session options that carry no repository pass, so a product's clone settings keep working;
  // the key test is anchored, so a word that merely holds "source" or "repo" passes.
  assert.ok(checkCall({ ...ok, clone_depth: 1, blob_limit_kb: 100, sparse_checkout_paths: ['src'], model: 'm', resources: 1, reporter: 'x' }));
});

test('session call (C42): no tool file builds a create_session call but util.mjs, so none bypasses checkCall', () => {
  // Every tool file (lib and the entry points), the key written out, quoted or as a shorthand.
  const found = [];
  const TOOL = join(LIB, '..');
  const files = [...readdirSync(LIB).filter((n) => n.endsWith('.mjs') && n !== 'util.mjs').map((n) => join(LIB, n)), ...readdirSync(TOOL).filter((n) => n.endsWith('.mjs')).map((n) => join(TOOL, n))];
  for (const f of files) {
    readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (/\bsource_url\s*[:,}]|['"]source_url['"]\s*:|\[\s*['"`]source_url|\bsources\s*:/.test(l)) found.push(`${f.slice(TOOL.length + 1)}:${i + 1}`); });
  }
  assert.ok(files.some((f) => f.endsWith('p3.mjs')), 'the entry point is read');
  assert.deepEqual(found, [], 'build each create_session call with sessionCall');
  // Each start site the design note lists uses it.
  for (const f of ['roles.mjs', 'job.mjs', 'lane.mjs', 'pin.mjs', 'tranche.mjs', 'measures.mjs']) assert.match(readFileSync(join(LIB, f), 'utf8'), /sessionCall\(\{/, f);
});

test('session call (C42): lane start takes the product\'s clone settings, as every other start does', () => {
  assert.match(readFileSync(join(LIB, 'lane.mjs'), 'utf8'), /sessionCall\(\{ slug: s, revision: tranche, title: `lane \$\{l\.name\}`, prompt, model, clone: cfg\.clone \}\)/);
});

test('coordinator prompt (C42): it works in process3 only and acts on a product only through a session started there', () => {
  const text = coordinatorPrompt({ slug: 'acme/app', processSlug: 'acme/process3', rootId: 'session_R', old: 'session_O', branch: 'coord', handoff: 'notes/h.md' });
  assert.match(text, /4\. You work in acme\/process3 only \(BD-R2; PD-13\)\. You act on a product only through a session started in its repository \(its BOB, or a short session\), relaying Bob's words quoted and dated; never add a product repository here\./);
  assert.match(text, /So too your id as `coordinator` in another product's process\/config\.json \(the probe\)/);
  assert.doesNotMatch(text, /On each other product you hold/, 'no act of its own on a product');
});

test('start check (C42): warns when the root\'s parent holds several checkouts, or the project directory is outside the root', () => {
  const parent = mkdtempSync(join(tmpdir(), 'p3-multi-'));
  const mk = (n) => { const d = join(parent, n); mkdirSync(d); git(['init', '-q'], { cwd: d }); return d; };
  const a = mk('alpha');
