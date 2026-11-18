// ===== file: settings-policy.test.mjs (continued) =====

  const tools = toldTools(ROOT);
  for (const repo of [PRODUCT, 'neobobkrause/process3-probes']) {
    const s = files[repo];
    assert.ok(s, `${repo} in the note`);
    const r = judge(s);
    assert.equal(r['deny-list'].state, 'set', `${repo}: ${r['deny-list'].detail}`);
    assert.equal(r['shim-drift'].state, 'set', `${repo}: ${r['shim-drift'].detail}`);
    assert.deepEqual(admitCheck(s, told), [], repo);
    assert.deepEqual(admitTools(s, tools), [], repo);
  }
  // process3 is no product (no .process pin, no setup check): its file is held to admit's told commands.
  assert.deepEqual(admitCheck(files['neobobkrause/process3'], told), []);
});

// PD-22: the pacing hooks are retired; a product carries its SessionStart hook at most.
test('the hooks a product may carry (the shim) are exactly the R17c files\' hooks: no PreToolUse', () => {
  const allowed = JSON.parse(readFileSync(join(ROOT, HOOKS_SHIM), 'utf8')).hooks;
  assert.equal(allowed.PreToolUse, undefined);
  for (const repo of [PRODUCT, 'neobobkrause/process3-probes']) {
    const h = r17cFiles()[repo].hooks || {};
    assert.equal(h.PreToolUse, undefined, `${repo}: PreToolUse`);
    if (h.SessionStart) assert.deepEqual(h.SessionStart, allowed.SessionStart, `${repo}: SessionStart`);
  }
});

test('setup check still refuses settings that block the tool\'s push, refuse a told command, or carry a hook the shim does not', () => {
  const s = structuredClone(r17cFiles()[PRODUCT]);
  s.permissions.deny.push('Bash(node *)');
  assert.match(judge(s)['deny-list'].detail, /holds Bash\(node \*\), which blocks a session's push of its own branch/);
  const t = structuredClone(r17cFiles()[PRODUCT]);
  t.hooks = { ...(t.hooks || {}), PreToolUse: [{ matcher: 'Write', hooks: [{ type: 'command', command: 'echo hi' }] }] };
  assert.match(judge(t)['shim-drift'].detail, /carries a PreToolUse hook the pin does not allow \(echo hi\)/);
});

// One matcher (cold review of C17): setup's Bash rules are admit's.
test('setup check and admit match a Bash rule the same way', async () => {
  const { bashRuleMatches } = await import('../lib/setup.mjs');
  const { ruleMatches } = await import('../lib/admit.mjs');
  assert.equal(bashRuleMatches, ruleMatches);
  assert.equal(ruleMatches('Bash', 'git fetch origin x'), true, 'a bare Bash rule');
  assert.equal(ruleMatches('Bash(no:*)', 'node .process/tool/p3.mjs github push origin job/x'), false, ':* at a word');
});

// ===== file: setup.mjs (later part) =====

}

// The told commands the product's .claude/settings.json denies, each a warning line naming where
// the process tells it and the rule; none read when the file is absent or not JSON.
// The told tools (C15) too: one that a deny rule refuses, or that asks a person even in auto mode and
// no allow rule admits, leaves an unattended session waiting on no one.
export function admitLines(x, { log = console.log, told = toldCommands(TOOL), tools = toldTools(TOOL) } = {}) {
  let settings = null;
  try { settings = JSON.parse(x.file('.claude/settings.json') ?? 'null'); } catch { settings = null; }
  if (!settings) return [];
  const bad = admitCheck(settings, told);
  for (const b of bad) log(`warning: ${b.file}:${b.line} tells a session to run \`${b.cmd}\`, which .claude/settings.json denies (${b.rule}): the process's text is changed, or the rule, never the session's workaround`);
  if (!bad.length) log(`told commands: ${told.length}, each admitted by .claude/settings.json`);
  const stops = admitTools(settings, tools);
  for (const b of stops) log(`warning: ${b.file}:${b.line} tells a session to use the ${b.tool} tool, which ${b.why === 'denied' ? `.claude/settings.json denies (${b.rule})` : `${b.evidence}, and no allow rule in .claude/settings.json admits: Bob adds "${b.tool}" to its permissions.allow`}`);
  if (!stops.length) log(`told tools: ${new Set(tools.map((t) => t.tool)).size}, none denied and none left to a permission prompt`);
  return [...bad, ...stops];
}
// The setup check's cache key: the tranche's pin (.process), workflows and settings, by object id.
export function setupKey(root, tranche) {
  const ids = ['.process', '.github/workflows', '.claude/settings.json'].map((f) => {
    const r = git(['rev-parse', '-q', '--verify', `origin/${tranche}:${f}`], { cwd: root, allowFail: true });
    return r.code === 0 ? r.stdout.trim() : '-';
  });
  return ids[0] === '-' ? null : ids.join(' ');
}
const readText = (f) => { try { return readFileSync(f, 'utf8'); } catch { return null; } };
const ledgerEntries = (root, ref) => Object.values(readLedgerTexts(root, ref)).flatMap((t) => { try { return [JSON.parse(t)]; } catch { return []; } });
// A lane whose folder lies under a ledger module's paths and that names no module (or another):
// the gate counts its files as that module's (util.mjs laneOfPath), so a lane-only pull request is
// refused as module files (copy, 6 Nov: ux's PR 620, until PR 629 added "module": "ux-design").
// Informational: a warning line each, never a missing condition. Returns the warnings.
export function laneModuleCheck(cfg, entries, { log = console.log } = {}) {
  const lanes = laneDirs(cfg);
  if (!lanes.length) return [];
  const out = [];
  for (const l of lanes) {
    for (const e of entries) {
      const p = (e?.paths || []).find((q) => underPath(l.dir, String(q).replace(/\/+$/, '')));
      const t = (e?.tests || []).find((q) => underPath(l.dir, String(q).replace(/\/+$/, '')));
      if (t) { out.push(`lane ${l.name}: its folder ${l.dir} lies under module ${e.id}'s tests ${t}: the gate counts its files as ${e.id}'s tests whatever the lane's module; move the lane's folder`); continue; }
      if (!p || e.id === l.module) continue;
      out.push(`lane ${l.name}: its folder ${l.dir} lies under module ${e.id}'s path ${p}, and its row in process/config.json names ${l.module ? `module ${l.module}` : 'no module'}: the gate counts its files as ${e.id}'s and refuses a lane-only pull request; add "module": "${e.id}" to the lane's row`);
    }
  }
  for (const w of out) log(`warning: ${w}`);
  if (!out.length) log(`lanes: ${lanes.length}, each folder outside other modules' paths`);
  return out;
}

// A blocker before a pin move: process/config.json on the tranche naming a merge_strategy other
// than "layer" (or the key absent). Informational here; loadConfig refuses it once the pin moves.
export function strategyCheck(cfg) {
  const ms = cfg?.merge_strategy;
  if (ms === undefined || ms === 'layer' || ms === 'direct') return null;
  return `BLOCKER before a pin move: process/config.json on the tranche says "merge_strategy": ${JSON.stringify(ms)}; the merge train was removed and every command (the gate included) refuses it at the new pin. First a plain pull request setting "merge_strategy": "layer" (or removing the key), merged under the current pin`;
}

// Which opening of next work is in force (open_by in process/config.json; status --role bob).
// Informational, never a missing condition: status itself refuses a value it does not know.
function openByCheck(cfg) {
  const v = cfg.open_by ?? 'uses';
  if (!OPEN_BY.includes(v)) return `next work opens by: ${JSON.stringify(v)} is not one of ${OPEN_BY.map((o) => `"${o}"`).join(', ')}; status --role bob refuses it`;
  return v === 'uses'
    ? `next work opens by: uses (open_by); past the open layer, each module whose providers (\`uses\` in ${cfg.modules_file || 'modules_file, not set: none'}) are done`
    : 'next work opens by: layer (open_by); the open layer\'s modules only';
}

// The product's size (p3 size) at the judged commit against the ranges.json of its pin (the
// running clone's when the pin is unread): inside, outside per figure, or no certified range
// yet. Informational: never a missing condition, so it stops no start.
function sizeCheck(root, x, sha, { io, log }) {
  const ref = sha || `origin/${x.cfg.tranche}`;
  let s;
  try { s = measureSize(root, x.cfg, { ref }); } catch (e) { log(`size: unmeasured, ${e.message}`); return null; }
  let pin = null;
  try { pin = x.pin(); } catch { pin = null; }
  const releases = io.ranges || loadRanges(pin ? pin.file('ranges.json') : undefined);
  const c = compareRanges(s.figures, releases);
  for (const l of [...sizeLines(s), ...c.lines]) log(l);
  return { ...s, range: { state: c.state, outside: c.outside } };
}

// Generated files over max_file_bytes (the copy, 4 Nov: rows.mjs 5.2 MB, two bundles 8.9 and
// 29 MB): no pull request can refresh one, since the record check refuses any commit that writes
// it, so layer close's "regenerated files differ" never clears. Product work, informational: BOB
// stops committing it (a job or plain pull request that removes it from the index and ignores
// it) and builds it in release.assemble and the deploy; deploy dev and release run build every
// generated path the commit does not track, and layer close no longer compares it.
function generatedCheck(root, x, sha, { log }) {
  const ref = sha || `origin/${x.cfg.tranche}`;
  const max = Number(x.cfg.max_file_bytes ?? DEFAULTS.max_file_bytes);
  const gen = generatedRows(x.cfg);
  let over;
  try { over = oversizeGenerated(root, gen.rows, ref, max); } catch (e) { log(`generated files: unmeasured, ${e.message}`); return null; }
  if (!over.length) return { over: [] };
  log(`product work: ${over.length} committed generated file${over.length === 1 ? '' : 's'} over max_file_bytes (${max}); no pull request can refresh one:`);
  for (const o of over) log(`- ${o.file}: ${o.bytes} bytes; BOB's act: stop committing it (remove it from the index, ignore it) and build it in release.assemble and the deploy; deploy dev and release run build it from its \`generated\` row`);
  return { over };
}

// Tranche carry (SHM-4): a product converting mid-tranche lists its open pull requests into the
// tranche (into main while no tranche exists) that no ledger entry owns, each with the module
// whose paths own its files or "no single module". Informational: it stops no start, and it
// closes or rewrites nothing.
function takeInCheck(root, x, { io, log }) {
  const onTranche = git(['rev-parse', '-q', '--verify', `origin/${x.cfg.tranche}`], { cwd: root, allowFail: true }).code === 0;
  const base = onTranche ? x.cfg.tranche : x.main;
  if (!onTranche) fetchBranch(root, base, { allowFail: true });
  let prs = null;
  try {
    prs = io.openPRs ? io.openPRs(x.slug, base) : x.api(`repos/${x.slug}/pulls?state=open&base=${encodeURIComponent(base)}&per_page=100`);
  } catch { prs = null; }
  if (!Array.isArray(prs)) { log(`to take in: unmeasured, the open pull requests into ${base} were not read`); return null; }
  const files = io.prFiles || prFiles; // paged: a partial list would misjudge the module
  const list = toTakeIn(root, { slug: x.slug, ref: `origin/${base}`, prs, files });
  if (list.length) log(`to take in (open pull requests into ${base} no ledger entry owns):`);
  for (const t of list) log(`- ${takeInLine(t, 'node .process/tool/p3.mjs')}`);
  return { base, list };
}

// ===== file: expire.mjs =====

// Stale records found and cleared by the process (R13; Bob, 6 Nov: "fix process3 to anticipate and
// address these kinds of situations"). staleRecords lists every recorded state whose end
// condition holds or whose referent is gone (ends.mjs keeps the inventory); expireRecords ends,
// with a row naming the condition, each one the tool can end on its own: a hold whose condition
// is met, a lane seat whose session is gone. The rest are reported, each with what ends it.
// Nothing here prints a command for a person to type: the tool's next write ends what it can.
import { BY_TOOL, expireHolds, readHolds } from './hold.mjs';
import { LANE_SESSIONS_FILE, lanes, openAsks, readSeats, seatsOf } from './lane.mjs';
import { readFacts } from './ends.mjs';
import { addressFile, jsonl, readState, writeState } from './state.mjs';
