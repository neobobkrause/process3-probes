// ===== file: product-neutral.test.mjs (continued) =====

    const r = join(rel, e.name);
    if (e.isDirectory()) yield* files(root, r);
    else if (e.isFile()) yield r;
  }
}

// Every hit: { file, line, hash } (the hash only: the term is never printed either).
export function productNames(root = ROOT, hashes = readDeny(join(root, 'product-deny-list.json')).sha256) {
  const deny = new Set(hashes);
  const hits = [];
  for (const top of SCANNED) {
    for (const f of files(root, top)) {
      const buf = readFileSync(join(root, f));
      if (buf.includes(0)) continue; // binary
      buf.toString('utf8').split('\n').forEach((line, i) => {
        const seen = new Set();
        for (const p of phrases(line)) { const h = hashTerm(p); if (deny.has(h) && !seen.has(h)) { seen.add(h); hits.push({ file: f, line: i + 1, hash: h }); } }
      });
    }
  }
  return hits;
}

test('no product term from product-deny-list.json appears in tool/, rulebooks/, governing/, shims/, setup/ or README.md (BD-R2)', () => {
  const { sha256 } = readDeny(join(ROOT, 'product-deny-list.json'));
  assert.ok(sha256.length > 0, 'the deny list names at least one product');
  assert.equal(new Set(sha256).size, sha256.length, 'no hash listed twice');
  const hits = productNames();
  assert.deepEqual(hits.map((h) => `${h.file}:${h.line}: deny-listed term ${h.hash.slice(0, 12)}`), [], 'reword as "the first product" or "a product", read it from process/config.json, or use a neutral invented name in a fixture');
});

test('the list holds no term in plain text, only sha256 hashes', () => {
  const j = JSON.parse(readFileSync(join(ROOT, 'product-deny-list.json'), 'utf8'));
  assert.deepEqual(Object.keys(j).sort(), ['sha256', 'why']);
  assert.ok(j.sha256.every((h) => /^[0-9a-f]{64}$/.test(h)));
});

test('the scan finds a listed word or hyphen-joined phrase in each scanned place, in any case, and nothing outside them', () => {
  const root = mkdtempSync(join(tmpdir(), 'p3-neutral-'));
  writeFileSync(join(root, 'product-deny-list.json'), JSON.stringify({ why: 'x', sha256: [] }));
  const list = join(root, 'product-deny-list.json');
  assert.deepEqual(addTerm('Zorbex', list).added, true);
  assert.deepEqual(addTerm('zorbex', list).added, false, 'case-insensitive: one hash');
  addTerm('zorb-s1', list);
  assert.ok(!readFileSync(list, 'utf8').toLowerCase().includes('zorb'), 'no term is written');
  for (const d of ['tool/lib', 'tool/test/fixtures', 'rulebooks', 'governing', 'shims', 'setup', 'notes']) mkdirSync(join(root, d), { recursive: true });
  writeFileSync(join(root, 'README.md'), 'a\nfor ZORBEX\n');
  writeFileSync(join(root, 'tool/lib/x.mjs'), '// zorbex-copy and zorbex.dev\n');
  writeFileSync(join(root, 'tool/test/fixtures/w.yml'), 'image: docker.io/zorbex/a\nenv: ZORBEX_TEST_INSTANCE\n');
  writeFileSync(join(root, 'rulebooks/r.md'), 'clean, zorbexy and zorb alone\n');
  writeFileSync(join(root, 'governing/g.md'), 'worker agent-runner-zorb-s1\n');
  writeFileSync(join(root, 'shims/s.yml'), 'x Zorbex\n');
  writeFileSync(join(root, 'setup/c.json'), '{"s1": "zorb s1"}\n');
  writeFileSync(join(root, 'notes/n.md'), 'zorbex is history\n');
  writeFileSync(join(root, 'DECISIONS.md'), 'zorbex\n');
  const hits = productNames(root).map((h) => `${h.file}:${h.line}`).sort();
  assert.deepEqual(hits, ['README.md:2', 'governing/g.md:1', 'shims/s.yml:1', 'tool/lib/x.mjs:1', 'tool/test/fixtures/w.yml:1', 'tool/test/fixtures/w.yml:2']);
  assert.deepEqual([...phrases('a-b-c')].sort(), ['a', 'a-b', 'a-b-c', 'b', 'b-c', 'c']);
  writeFileSync(list, JSON.stringify({ why: 'x', sha256: ['zorbex'] }));
  assert.throws(() => readDeny(list), /sha256 hex digests/);
});

test('tool/deny-add.mjs appends a term\'s hash, prints only the hash, and refuses what the scan cannot read as a term', () => {
  const list = join(mkdtempSync(join(tmpdir(), 'p3-deny-')), 'deny.json');
  writeFileSync(list, JSON.stringify({ why: 'x', sha256: [] }));
  const run = (...a) => spawnSync(process.execPath, [join(ROOT, 'tool/deny-add.mjs'), ...a, '--file', list], { encoding: 'utf8' });
  const r = run('Qux-Ware');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), `added ${hashTerm('qux-ware')}`);
  assert.deepEqual(JSON.parse(readFileSync(list, 'utf8')).sha256, [hashTerm('qux-ware')]);
  assert.match(run('qux-ware').stdout, /already listed/);
  const bad = run('qux ware');
  assert.equal(bad.status, 1);
  assert.ok(!/qux/.test(bad.stderr), 'a refused term is not echoed');
  assert.equal(spawnSync(process.execPath, [join(ROOT, 'tool/deny-add.mjs')], { encoding: 'utf8' }).status, 2);
});

// ===== file: notice-slots.test.mjs =====

// Provider-notice slots (coordinator, 4 Nov): on the copy, a count of notices/*.json read apart
// from the withdrawal rows called 201 slots open across 25 notices, 136 of them in membership:77
// and credentials:74, which BOB had withdrawn; `notice triage` answered "no provider notice" for
// both. One reader (noticeRecords) now serves triage, status, layer close and report tranche: a
// withdrawn notice is found, closed and never counted open, and every open slot the report counts
// carries the command that closes it.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { noticeFile, noticeRecords, notices } from '../lib/notice.mjs';
import { noticeSection } from '../lib/report.mjs';
import { fetchState } from '../lib/state.mjs';
import { layerState, noticeSlots, owedNotices, status } from '../lib/status.mjs';
import { trancheClose } from '../lib/tranche.mjs';
import { noticeTriage, recordTriage, triageFile } from '../lib/triage.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo, onState, openPassed } from './helpers.mjs';

const quiet = () => {};
const MODULES = { modules: [
  { id: 'p', paths: ['src/p/'] },
  { id: 'q', paths: ['src/q/'] },
  ...['u1', 'u2', 'u3', 'u4'].map((id) => ({ id, paths: [`src/${id}/`], uses: ['p', 'q'] })),
] };
const IDS = ['p', 'q', 'u1', 'u2', 'u3', 'u4'];

function product() {
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': MODULES,
    ...Object.fromEntries(IDS.flatMap((id) => [[`process/ledger/${id}.json`, entry(id)], [`req/${id}.md`, `# ${id}\n\n- **R1** met\n`]])),
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: root });
  return root;
}
const push = (root) => git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
const row = (provider, pr, users) => JSON.stringify({ row: 'notice', at: '2026-11-04T02:59:27.133Z', key: `${provider}:${pr}`, provider, ids: ['R1'], pr, users }) + '\n';

// The copy's shape: q:77 withdrawn with three users unanswered (membership:77), p:8 live with one
// user answered, one judged affected, one untriaged, and one whose open job names it.
function state() {
  const root = product();
  onState(root, {
    [noticeFile('q:77')]: row('q', 77, ['u1', 'u2', 'u3']),
    'notices/withdrawn/q-77.json': JSON.stringify({ row: 'withdrawn', at: '2026-11-04T05:05:39.578Z', key: 'q:77', provider: 'q', pr: 77, by: 'bob', why: 'PR 77 changed no file of q\'s source (src/q/)', users: 3 }) + '\n',
    [noticeFile('p:8')]: row('p', 8, ['u1', 'u2', 'u3', 'u4']),
    'notices/answered/u4-p-8.json': JSON.stringify({ row: 'answered', key: 'p:8', user: 'u4', pr: 30 }) + '\n',
    [triageFile('u1', 'p:8')]: JSON.stringify({ row: 'triage', key: 'p:8', user: 'u1', verdict: 'affected', evidence: 'src/u1/a.mjs:3 signs with it' }) + '\n',
  });
  push(root);
  git(['checkout', '-q', '-b', 'job/u3', 'tranche'], { cwd: root });
  commit(root, { 'process/metrics/u3.jsonl': JSON.stringify({ event: 'start', notices: ['p:8'] }) + '\n' });
  git(['update-ref', 'refs/remotes/origin/job/u3', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'job/u3'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const rows = [{ id: 'u3', tranche: 'WORKING', branch: 'WORKING', pr: '#41 draft' }];
  return { root, cfg: loadConfig(root), rows };
}

test('one reader: a withdrawn notice is found with its withdrawal row; notices() keeps only the live ones', () => {
  const { root, cfg } = state();
  const recs = noticeRecords(root, cfg.state_branch);
  assert.deepEqual(recs.map((n) => [n.key, n.open, !!n.withdrawn]), [['p:8', ['u1', 'u2', 'u3'], false], ['q:77', ['u1', 'u2', 'u3'], true]]);
  assert.equal(recs[1].withdrawn.by, 'bob');
  assert.deepEqual(notices(root, cfg.state_branch).map((n) => n.key), ['p:8']);
  assert.equal('withdrawn' in notices(root, cfg.state_branch)[0], false);
});

test('notice triage of a withdrawn notice says it was withdrawn and owes nothing; --record on it is refused and writes nothing', () => {
  const { root } = state();
  const out = [];
  const r = noticeTriage(root, 'q:77', { log: (x) => out.push(x) });
  assert.deepEqual(r.owed, []);
  assert.equal(r.withdrawn.key, 'q:77');
  assert.equal(out.length, 1);
  assert.match(out[0], /^provider notice q:77 was withdrawn 2026-11-04T05:05:39\.578Z by bob \(PR 77 changed no file of q's source \(src\/q\/\)\): it is closed and owes no triage; its 3 unanswered user module\(s\) owe nothing for it$/);
  assert.doesNotMatch(out[0], /no provider notice/);
  const before = git(['rev-parse', 'refs/remotes/origin/process-state'], { cwd: root });
  const f = join(mkdtempSync(join(tmpdir(), 'p3-tri-')), 'a.txt');
  writeFileSync(f, 'u1: not affected: src/u1/a.mjs:1 no use\n');
  assert.throws(() => recordTriage(root, 'q:77', { file: f, worker: 'w', cost: '$0', log: quiet }), /refused: provider notice q:77 was withdrawn .*nothing was written/);
  assert.equal(git(['rev-parse', 'refs/remotes/origin/process-state'], { cwd: root }), before);
  // A key with no file at all is still "no provider notice".
  assert.throws(() => noticeTriage(root, 'p:99', { log: quiet }), /no provider notice p:99 on process-state \(notices\/p-99\.json\)/);
});

test('noticeSlots: every open slot is classed once with the command that closes it; withdrawn slots are closed, counted apart', () => {
  const { root, cfg, rows } = state();
  const s = noticeSlots(root, cfg, rows);
  assert.deepEqual(s.slots.map((x) => [x.key, x.user, x.kind]), [['p:8', 'u1', 'affected'], ['p:8', 'u2', 'triage'], ['p:8', 'u3', 'job']]);
  assert.deepEqual(s.slots.map((x) => x.act), ['node .process/tool/p3.mjs job start u1 --sessions <file>', 'node .process/tool/p3.mjs notice triage p:8', 'node .process/tool/p3.mjs merge 41 (job u3\'s pull request; its START names the notice, its merge answers it)']);
  assert.deepEqual(s.withdrawn.map((w) => [w.key, w.closed]), [['q:77', 3]]);
  // owedNotices (status, layer close, next work) reads the same slots.
  assert.deepEqual(Object.keys(owedNotices(root, cfg, rows, quiet)).sort(), ['u1', 'u2']);
});

test('report and triage agree: every slot the report calls open is answerable by its printed command, and triage finds every notice the report names', () => {
  const { root, cfg, rows } = state();
  const s = noticeSlots(root, cfg, rows);
  const md = noticeSection(s).join('\n');
  assert.match(md, /^Open notice slots \(one notice, one user module, unanswered\): 3 across 1 notices; triage owed 1, judged affected: notice work 1, named by its open job 1, merged job named it, answer not recorded 0\.$/m);
  assert.match(md, /^Withdrawn \(closed, owing nothing; never counted open\): 1 notices, 3 unanswered slots closed by withdrawal \(q:77 3\)\.$/m);
