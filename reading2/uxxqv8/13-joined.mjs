// ===== file: p3.mjs (continued) =====

    return name ? 2 : 0;
  }
  a._ = a._.slice(name.split(' ').length);
  let root = null;
  let cfg = null;
  // One state push per command (R17, GitHub pacing): the writes are coalesced and pushed at its
  // end. Not the commands whose write reserves a session they then hand out (a seat, a start, a
  // handover) or that replay kept writes: theirs push at once, as before (cold review of R17).
  const batched = process.env.P3_STATE_BATCH !== '0' && !UNBATCHED.has(name);
  if (batched) stateBatch(true);
  let flushed = false;
  const flush = () => {
    if (flushed) return null;
    flushed = true;
    if (!batched) return null;
    stateBatch(false);
    try { flushState(); return null; } catch (e) { return e; }
  };
  // A command ended early still pushes what it wrote: at exit, and on SIGTERM, SIGHUP or SIGINT
  // (a timeout, or publish halting its run); a SIGKILL's writes stay kept for the next command.
  {
    endFlush = () => { const e = flush(); if (e) console.error(`p3 ${name}: ${e.message}`); };
    if (!endHooked) {
      endHooked = true;
      process.on('exit', () => endFlush());
      for (const [sig, n] of [['SIGTERM', 15], ['SIGHUP', 1], ['SIGINT', 2]]) if (!process.listenerCount(sig)) process.once(sig, () => { endFlush(); process.exit(128 + n); });
    }
  }
  try {
    root = repoRoot();
    // A p3 command killed in this clone before its flush left its writes kept (state.mjs): moved
    // for replay, and said.
    try { const k = strandedWrites(root); if (k) console.error(`note: ${k} state write(s) of a p3 command killed in this clone are kept: push them with \`node .process/tool/p3.mjs state replay\``); } catch { /* not a clone with state */ }
    // The idle check in a product only: process3 itself has no process/config.json.
    try { cfg = existsSync(join(root, CONFIG_FILE)) ? loadConfig(root) : null; } catch { cfg = null; }
    if (cfg && !process.env.NODE_TEST_CONTEXT) beforeAct(root, cfg, name, a);
    const begun = new Date().toISOString();
    const code = (await fn(a, root)) ?? 0;
    // BOB acted on the start list: the acts owed before this began are paid (hold.mjs).
    if (cfg && code === 0 && paysOwed(name)) { try { bookkeep(root, cfg.state_branch, `starts owed: paid by ${name}`, 'paid', { path: OWED_FILE, begun }); } catch (e) { console.error(`starts owed not updated: ${e.message}`); } }
    const act = cfg && code === 0 ? owes(name, a) : null;
    if (act) { try { bookkeep(root, cfg.state_branch, `starts owed: ${act}`, 'owe', { path: OWED_FILE, act, at: now() }); } catch (e) { console.error(`starts owed not recorded: ${e.message}`); } }
    // Records whose condition is met end at the tool's writes (R13, expire.mjs): after each act
    // that writes, the holds met end, recorded; never a refusal of the act. The sweep does the
    // same with the session list (lane seats).
    if (cfg && !process.env.NODE_TEST_CONTEXT) endsAfter(root, cfg, name, code);
    const lost = flush();
    if (lost) throw lost;
    return code;
  } catch (e) {
    // A refusal after writes: they are pushed, as they were before the writes were coalesced.
    const lost = flush();
    if (lost instanceof Fail) console.error(`p3 ${name}: ${lost.message}`);
    else if (lost) throw lost;
    if (e instanceof Fail) {
      console.error(`p3 ${name}: ${e.message}`);
      if (a.out) writeFileSync(a.out, JSON.stringify({ error: e.message, findings: [{ check: 'tool', file: '(tool)', line: 1, message: e.message }] }, null, 2) + '\n');
      return 1;
    }
    throw e;
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('/p3.mjs')) {
  process.exitCode = await main(process.argv.slice(2));
}

// ===== file: lane.test.mjs =====

// SES-14 lanes (lane ask) and PLN-4's completion round (status --role bob, tranche close).
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { parseCompletion } from '../lib/completion.mjs';
import { LANES_FILE, laneAsk, openAsks } from '../lib/lane.mjs';
import { status } from '../lib/status.mjs';
import { trancheClose } from '../lib/tranche.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo, openPassed } from './helpers.mjs';

const quiet = () => {};
const slug = 'o/p';
const io = { compare: () => null, status: { openPRs: () => [], checkRun: () => null, compare: () => null, prFiles: () => [] } };

function withOrigin(files) {
  const root = makeRepo(files);
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  return { root, bare };
}

test('lane ask: refused until the lane names its directory; the brief carries the directory, the context, the output and the boundaries', () => {
  const none = makeRepo({ 'README.md': 'x\n' });
  assert.deepEqual(loadConfig(none).lanes, [{ name: 'ux', dir: null }]);
  assert.throws(() => laneAsk(none, 'ux', 'which?', { log: quiet }), /lane ux names no directory/);
  assert.throws(() => laneAsk(none, 'ai', 'which?', { log: quiet }), /no lane "ai".*the lanes are ux/);

  const { root, bare } = withOrigin({
    'process/config.json': { lanes: [{ name: 'ux', dir: 'design/ux/' }] },
    'design/ux/README.md': 'principles\n', 'design/ux/screens/a.md': 'screen a\n', 'build/q.md': 'context\n',
    'design/ux-research/index.md': 'index\n', 'design/ux-research/qualification-2026-11-06.md': 'record\n',
  });
  assert.throws(() => laneAsk(root, 'ux', 'which?', { context: 'build/nope.md', log: quiet }), /--context build\/nope\.md: no such file/);
  const out = [];
  const r = laneAsk(root, 'ux', 'Where does  sign-in go?', { context: ['build/q.md'], log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /recorded open on process-state:lanes\/asks\.jsonl/);
  assert.match(text, /BOB's act: start one read-only worker \(a subagent; no long-lived session\)/);
  assert.match(text, /lane ask ux 'Where does sign-in go\?' --record '<the decision/);
  assert.match(r.brief, /The lane's directory `design\/ux\/`: 2 files, 20 bytes/);
  assert.match(r.brief, /- `build\/q\.md` 8/);
  assert.match(r.brief, /- decision: <one line>\n- why: .*\n- what changes in `design\/ux\/`/);
  assert.match(r.brief, /Read only: .* BOB keeps the final say; you approve and merge nothing/);
  assert.match(r.brief, /\.process\/rulebooks\/worker\.md/);
  const cfg = loadConfig(root);
  assert.equal(openAsks(root, cfg).length, 1);
  // Asked again while open: no second row.
  assert.equal(laneAsk(root, 'ux', 'Where does sign-in go?', { log: quiet }).already, true);
  assert.equal(git(['show', `process-state:${LANES_FILE}`], { cwd: bare }).split('\n').length, 1);

  // status --role bob lists it until the decision is recorded.
  openPassed(root);
  const s = [];
  status(root, { role: 'bob', offline: true, log: (m) => s.push(m) });
  assert.match(s.join('\n'), /open lane questions .*\n- ux: "Where does sign-in go\?", asked/);

  assert.throws(() => laneAsk(root, 'ux', 'Where is sign-in?', { record: 'top bar', worker: 'a1', log: quiet }), /no open ux question reads "Where is sign-in\?"; nothing recorded\. Open: "Where does sign-in go\?"/);
  assert.throws(() => laneAsk(root, 'ux', 'Where does sign-in go?', { record: 'top bar', log: quiet }), /--record needs --worker/);
  assert.throws(() => laneAsk(root, 'ux', 'Where does sign-in go?', { record: 'top bar', worker: 'a1', cost: 'lots', log: quiet }), /--cost-usd/);
  const d = laneAsk(root, 'ux', 'Where does sign-in go?', { record: 'the top bar', worker: 'agent-1', cost: '0.42', log: quiet });
  assert.deepEqual([d.row.lane, d.row.decision, d.row.worker, d.row.cost_usd], ['ux', 'the top bar', 'agent-1', 0.42]);
  assert.equal(openAsks(root, cfg).length, 0);
  const s2 = [];
  status(root, { role: 'bob', offline: true, log: (m) => s2.push(m) });
  assert.doesNotMatch(s2.join('\n'), /open lane questions/);
  // Asked again after its decision: open again.
  laneAsk(root, 'ux', 'Where does sign-in go?', { log: quiet });
  assert.equal(openAsks(root, cfg).length, 1);
});

test('the completion file: open, done and deferred items; module or whole product', () => {
  const items = parseCompletion([
    '# Completion round', '',
    '- [ ] C-1 · signatures · the catalogue keys',
    '- [x] C-2 · mail-reader · R6 tested whole',
    '- [ ] C-3 | whole product | the release walk',
    '- [ ] C-4 · runtime-limits · grade_read lowered; deferred: waits on the ranged-grading report',
    '- a plain line', '- [ ] C-5 - onboarding - copy',
  ].join('\n'));
  assert.deepEqual(items.map((x) => [x.id, x.target, x.whole, x.done, x.deferred]), [
    ['C-1', 'signatures', false, false, null],
    ['C-2', 'mail-reader', false, true, null],
    ['C-3', 'whole product', true, false, null],
    ['C-4', 'runtime-limits', false, false, 'waits on the ranged-grading report'],
    ['line 8', null, false, false, null],
  ]);
  assert.equal(items.at(-1).malformed, true);
});

const LAYERS = '| Layer | Modules |\n|---|---|\n| 1 | a |\n';
const ROUND = '- [ ] C-1 · a · its last fix\n- [ ] C-2 · whole product · the release walk\n- [ ] C-3 · b · later; deferred: Bob, 4 Nov\n';

test('completion round: status lists open items once every layer is closed; tranche close refuses until each is done or deferred', () => {
  const base = { 'build/layers.md': LAYERS, 'build/requirements/a.md': 'all met\n', 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md', status: { state: 'COMPLETE' } }) };
  // Without the key: unchanged.
  const plain = withOrigin(base);
  openPassed(plain.root);
  const p = [];
  assert.deepEqual(status(plain.root, { role: 'bob', offline: true, log: (m) => p.push(m) }).next, []);
  assert.doesNotMatch(p.join('\n'), /completion round/);
  assert.ok(trancheClose(plain.root, { slug, io, log: quiet }).ok);

  const { root } = withOrigin({ ...base, 'process/config.json': { completion_file: 'build/plan/round.md' }, 'build/plan/round.md': ROUND });
  openPassed(root);
  const out = [];
  const s = status(root, { role: 'bob', offline: true, log: (m) => out.push(m) });
  const text = out.join('\n');
  assert.match(text, /next work, the completion round \(build\/plan\/round\.md, 2 open/);
  // BD-R1 (Bob, 8 Nov): no completion layer opens any more; a module's item left is entered as a found mark.
  assert.match(text, /- C-1 · a: no completion layer opens \(BD-R1\): enter it as a found mark \(`node \.process\/tool\/p3\.mjs found a "<the item>" --from "<its source>"`\) and tick it, so a round's layer runs it · its last fix/);
  assert.match(text, /- C-2 · whole product: BOB's act · the release walk/);
  assert.doesNotMatch(text, /C-3/);
  assert.deepEqual(s.next.map((x) => x.item), ['C-1', 'C-2']);
  assert.throws(() => trancheClose(root, { slug, io, log: quiet }), /completion round not done: C-1 \(a\), C-2 \(whole product\) open in build\/plan\/round\.md/);

  // A layer still open: no completion work listed.
  const early = withOrigin({ ...base, 'build/requirements/a.md': '- **R1** *(not yet met: x)* t\n', 'process/ledger/a.json': entry('a', { requirements: 'build/requirements/a.md' }), 'process/config.json': { completion_file: 'build/plan/round.md' }, 'build/plan/round.md': ROUND });
  openPassed(early.root);
  const e = [];
  status(early.root, { role: 'bob', offline: true, log: (m) => e.push(m) });
  assert.doesNotMatch(e.join('\n'), /completion round/);

  // Each done or deferred: the close goes on.
  commit(root, { 'build/plan/round.md': '- [x] C-1 · a · done\n- [ ] C-2 · whole product · walk; deferred: next tranche (Bob)\n- [ ] C-3 · b · later; deferred: Bob, 4 Nov\n' });
