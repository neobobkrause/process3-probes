// ===== file: census.mjs (continued) =====

export function changeGaps(root, cfg, { base, head, changed }) {
  const out = [];
  const dir = String(cfg.requirements_dir || DEFAULTS.requirements_dir).replace(/\/$/, '');
  const rowsAt = (ref) => new Set((readModules(root, cfg, ref) || []).filter((m) => m?.id).map((m) => m.id));
  const before = cfg.modules_file && changed.includes(cfg.modules_file) ? rowsAt(base) : null;
  const after = rowsAt(head);
  const has = (ref, p) => show(root, ref, p) !== null;
  const added = (p) => changed.includes(p) && !has(base, p) && has(head, p);
  const newRows = before ? [...after].filter((id) => !before.has(id)) : [];
  const newReqs = changed.filter((f) => f.startsWith(`${dir}/`) && f.endsWith('.md') && f.slice(dir.length + 1).indexOf('/') < 0 && !/README\.md$/i.test(f) && added(f)).map((f) => f.slice(dir.length + 1, -3));
  const newEntries = changed.filter((f) => /^process\/ledger\/[^/]+\.json$/.test(f) && added(f)).map((f) => f.replace(/^.*\//, '').replace(/\.json$/, ''));
  for (const id of [...new Set([...newRows, ...newReqs])]) {
    if (!has(head, entryFile(id))) out.push({ file: newReqs.includes(id) ? `${dir}/${id}.md` : cfg.modules_file, message: `${id} gains a ${newReqs.includes(id) ? 'requirements file' : 'modules row'} with no ledger entry ${entryFile(id)}: add the entry in this pull request (census, R15)` });
  }
  for (const id of newEntries) {
    if (!after.has(id)) out.push({ file: entryFile(id), message: `${id}'s new ledger entry has no row in ${cfg.modules_file}: add it in this pull request (census, R15)` });
    let named = null;
    try { named = JSON.parse(show(root, head, entryFile(id)) || '{}').requirements || null; } catch { named = null; }
    if (!has(head, named ? String(named).replace(/^\.\//, '') : `${dir}/${id}.md`)) out.push({ file: entryFile(id), message: `${id}'s new ledger entry has no requirements file ${named || `${dir}/${id}.md`}: add it in this pull request (census, R15)` });
  }
  return out;
}

// ===== file: shims.test.mjs =====

// Build product-shims (TXT-1, SHM-1, SHM-5): the process lines a product's CLAUDE.md carries, the
// drift check of its shims and hooks against the pin, and the setup script start check runs.
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { approvalsBlock } from '../lib/record.mjs';
import { MAX_LINES, pinOf, setupCheck } from '../lib/setup.mjs';
import { runSetupScript, setupMarker, startCheck } from '../lib/start.mjs';
import { git } from '../lib/util.mjs';
import { commit, makeRepo } from './helpers.mjs';

const quiet = () => {};
const SHIMS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'shims');
const raw = (f) => readFileSync(join(SHIMS, f), 'utf8');
const strip = (t) => t.replace(/\n$/, '');
const PIN = { sha: 'p'.repeat(40), file: (f) => (f.startsWith('shims/') && existsSync(join(SHIMS, f.slice(6))) ? strip(raw(f.slice(6))) : null), list: () => readdirSync(SHIMS) };
const LINES = raw('CLAUDE.process.md').replaceAll('{tranche}', 'tranche');
const HOOKS = JSON.parse(raw('settings.hooks.json')).hooks;
const APPROVALS = '## Standing approvals from Bob\n\nThe owner\'s words.\n';
const FETCH = 'git fetch origin tranche --depth 1 && git checkout --detach FETCH_HEAD && git submodule update --init .process';

// Only the two shim conditions are judged; the rest of the setup is another test's.
function files(over = {}) {
  return {
    'CLAUDE.md': `${APPROVALS}\n${LINES}`,
    '.claude/settings.json': JSON.stringify({ permissions: { deny: [] }, hooks: HOOKS }),
    '.github/workflows/process-gate.yml': PIN.file('shims/process-gate.yml'),
    '.github/workflows/process-record.yml': PIN.file('shims/process-record.yml'),
    '.github/workflows/process-branch-prune.yml': PIN.file('shims/process-branch-prune.yml'),
    'process/config.json': JSON.stringify({ tranche: 'tranche' }),
    ...over,
  };
}
const only = (ids) => ({ conditions: ids.map((id) => ({ id, read: 'x' })) });
const judge = (f, pin = PIN) => {
  const r = setupCheck(makeRepo({ 'README.md': 'x' }), { slug: 'o/r', io: { api: () => null, env: {}, file: (p) => f[p] ?? null, pin }, ...only(['process-lines', 'shim-drift']), log: quiet });
  return Object.fromEntries(r.results.map((x) => [x.id, x]));
};

test('the shim: the pin, the one fetch command, where the role prompt comes from, under its own heading', () => {
  const lines = raw('CLAUDE.process.md').trimEnd().split('\n');
  assert.equal(lines[0], '## Process3');
  assert.ok(lines.some((l) => l.includes('`git ls-tree HEAD .process`')));
  assert.ok(lines.some((l) => l.includes('`git fetch origin {tranche} --depth 1 && git checkout --detach FETCH_HEAD && git submodule update --init .process`')));
  assert.ok(lines.some((l) => /role prompt/.test(l)));
  // A product's whole CLAUDE.md: the approvals, then these lines, which end the approvals block.
  const md = `${APPROVALS}\n${LINES}`;
  assert.equal(approvalsBlock(md, '## Standing approvals from Bob'), APPROVALS.trim());
  assert.ok(md.includes(FETCH));
  assert.ok(lines.length < MAX_LINES);
});

test('process-lines: set with the lines exactly; each gap names the plain pull request BOB makes', () => {
  assert.equal(judge(files())['process-lines'].state, 'set');
  assert.match(judge(files())['process-lines'].detail, /the process lines of the pin pppppppppp, \d+ lines besides the approvals/);
  for (const [what, md] of [
    ['only the approvals (the product today)', APPROVALS],
    ['a line altered', `${APPROVALS}\n${LINES.replace('--depth 1', '--depth 2')}`],
    ['the tranche left as {tranche}', `${APPROVALS}\n${raw('CLAUDE.process.md')}`],
    ['inside the approvals block, under no heading of its own', `${APPROVALS}\n${LINES.replace('## Process3\n', '')}`],
  ]) {
    const r = judge(files({ 'CLAUDE.md': md }))['process-lines'];
    assert.equal(r.state, 'missing', what);
    assert.match(r.detail, /lacks the process lines of the pin pppppppppp exactly: BOB opens a plain pull request into tranche that puts the lines of \.process\/shims\/CLAUDE\.process\.md \(with \{tranche\} as tranche\) in CLAUDE\.md below the approvals block, and changes nothing in the approvals block$/, what);
  }
  // The lines may sit above the approvals too, and other lines may surround them.
  assert.equal(judge(files({ 'CLAUDE.md': `# Product\n\n${LINES}\n${APPROVALS}` }))['process-lines'].state, 'set');
});

test('process-lines: under thirty lines without the approvals block, however long the block is', () => {
  const long = `${APPROVALS}${'More of the owner\'s words.\n'.repeat(60)}`;

// A box of 2 peaches came through Uller.

  assert.equal(judge(files({ 'CLAUDE.md': `${long}\n${LINES}` }))['process-lines'].state, 'set');
  // The blank line after the block counts: it is not the block's.
  const pad = MAX_LINES - 1 - LINES.trimEnd().split('\n').length;
  const over = judge(files({ 'CLAUDE.md': `${APPROVALS}\n${LINES}${'x\n'.repeat(pad)}` }))['process-lines'];
  assert.equal(over.state, 'missing');
  assert.match(over.detail, new RegExp(`is ${MAX_LINES} lines without the approvals block, not under ${MAX_LINES}: BOB opens a plain pull request into tranche that moves what else it holds to another file`));
  assert.equal(judge(files({ 'CLAUDE.md': `${APPROVALS}\n${LINES}${'x\n'.repeat(pad - 1)}` }))['process-lines'].state, 'set');
});

test('no pin is missing; a pin older than the shim is not configured', () => {
  const r = judge(files(), null);
  assert.equal(r['process-lines'].detail, 'no .process pin on tranche');
  assert.equal(r['shim-drift'].detail, 'no .process pin on tranche');
  const old = { ...PIN, file: (f) => (f === 'shims/CLAUDE.process.md' ? null : PIN.file(f)) };
  assert.equal(judge(files(), old)['process-lines'].state, 'not configured');
});

test('shim-drift: workflows equal the pin\'s shims and only allowed hooks; each gap names its fix', () => {
  const ok = judge(files())['shim-drift'];
  assert.equal(ok.state, 'set', ok.detail);
  assert.match(ok.detail, /process-branch-prune\.yml, process-gate\.yml, process-record\.yml equal the pin pppppppppp's shims; \d+ hook\(s\), each allowed/);
  const drift = judge(files({ '.github/workflows/process-gate.yml': PIN.file('shims/process-gate.yml') + '\n# local' }))['shim-drift'];
  assert.equal(drift.state, 'missing');
  assert.match(drift.detail, /^\.github\/workflows\/process-gate\.yml differs from the pin's shim: BOB opens a plain pull request into tranche that copies \.process\/shims\/process-gate\.yml to it$/);
  const f = files();
  delete f['.github/workflows/process-record.yml'];
  assert.match(judge(f)['shim-drift'].detail, /process-record\.yml is absent: BOB opens a plain pull request/);
  // The branch cleanup shim is a product file like the others: absent or changed is a gap.
  const g = files();
  delete g['.github/workflows/process-branch-prune.yml'];
  assert.match(judge(g)['shim-drift'].detail, /^\.github\/workflows\/process-branch-prune\.yml is absent: BOB opens a plain pull request into tranche that copies \.process\/shims\/process-branch-prune\.yml to it$/);
  assert.match(judge(files({ '.github/workflows/process-branch-prune.yml': 'x' }))['shim-drift'].detail, /process-branch-prune\.yml differs from the pin's shim/);
  // The development release shim: needed only with a release block; carried, it must equal the pin's.
  assert.match(ok.detail, /^process-branch-prune\.yml, process-gate\.yml, process-record\.yml equal/);
  const rel = judge(files({ 'process/config.json': JSON.stringify({ tranche: 'tranche', release: {} }) }))['shim-drift'];
  assert.match(rel.detail, /process-dev-release\.yml is absent: BOB opens a plain pull request/);
  assert.equal(judge(files({ '.github/workflows/process-dev-release.yml': PIN.file('shims/process-dev-release.yml') }))['shim-drift'].state, 'set');
  assert.match(judge(files({ '.github/workflows/process-dev-release.yml': 'x' }))['shim-drift'].detail, /process-dev-release\.yml differs from the pin's shim/);
  // Any other hook fails, and the allowed one moved to another event or matcher does too.
  for (const hooks of [
    { ...HOOKS, PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo hi' }] }] },
    { Stop: HOOKS.SessionStart },
    { SessionStart: [{ matcher: 'x', hooks: HOOKS.SessionStart[0].hooks }] },
  ]) {
    const r = judge(files({ '.claude/settings.json': JSON.stringify({ hooks }) }))['shim-drift'];
    assert.equal(r.state, 'missing', JSON.stringify(hooks));
    assert.match(r.detail, /hook the pin does not allow .*: the file is the owner's, so Bob removes it through GitHub's website/);
  }
  // No hooks at all is allowed; a settings file that is not JSON is not.
  assert.equal(judge(files({ '.claude/settings.json': '{}' }))['shim-drift'].state, 'set');
  assert.match(judge(files({ '.claude/settings.json': '{' }))['shim-drift'].detail, /not JSON/);
});

test('pinOf: the tranche\'s .process pin, read from the process clone, fetched by its id when absent', () => {
  // The process repository, with its shims at one commit, and a clone of it that lacks that commit.
  const proc = makeRepo({ 'shims/process-gate.yml': 'gate\n', 'shims/CLAUDE.process.md': '## Process3\n' });
  const sha = git(['rev-parse', 'HEAD'], { cwd: proc });
  git(['config', 'uploadpack.allowReachableSHA1InWant', 'true'], { cwd: proc });
  const tool = join(mkdtempSync(join(tmpdir(), 'p3-tool-')), 't');
  git(['init', '-q', tool], { cwd: tmpdir() });
  git(['remote', 'add', 'origin', `file://${proc}`], { cwd: tool });
  // The product: its tranche pins that commit.
  const prod = makeRepo({ 'README.md': 'x' });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
