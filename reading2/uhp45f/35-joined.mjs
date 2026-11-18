// ===== file: gate-bootstrap.test.mjs (continued) =====

  assert.deepEqual(tg.npm, []);
  assert.match(tg.findings.find((f) => f.check === 'config').message, /changes tranche/);
  // An unreadable head config: refused.
  const u = product('{ "tranche": ');
  assert.match(runGate(u, lookupAt('none')).findings.find((f) => f.check === 'config').message, /cannot be read/);
  // A head that is not the tranche its config names: the defaults, as before, and no finding.
  const n = product({ tranche: 'tranche', lockfiles: ['package-lock.json'] }, { branch: 'bob/plan' });
  const ng = runGate(n, lookupAt('none'));
  assert.deepEqual(ng.npm, []);
  assert.equal(ng.findings.filter((f) => f.check === 'config').length, 0);
});

test('at the first close only run keys come from the head: records and the owner stay the defaults', () => {
  // The head would make everything a record (the fast path) and name its own owner; the owner's
  // website commit set the approvals, so the anchor holds, but neither is taken.
  const r = product({ tranche: 'tranche', records: ['src/', 'test/', 'process/', 'package-lock.json'], approvals: { owner: 'civicsmith' } });
  const c = gateConfig(r.root, { base: r.base, head: r.head, branch: 'tranche', slug: 'o/r', io: ioWith(lookupAt(r.setAt)) });
  assert.equal(c.bootstrap, true);
  assert.deepEqual(c.cfg.records, DEFAULTS.records);
  assert.equal(c.cfg.approvals.owner, OWNER);
  const g = runGate(r, lookupAt(r.setAt));
  assert.equal(g.run.trigger, 'code', 'not the record fast path');
  assert.equal(g.run.suite, 'pass');
});

test('at the first close head run keys that overlap the defaults\' records are a finding, not a crash (review 2 of PR 97)', () => {
  const r = product({ tranche: 'tranche', records: ['rec/'], lockfiles: ['package-lock.json'], generated: [{ paths: ['process/gen.json'], regenerate: ['true'], verify: ['true'] }] });
  const g = runGate(r, lookupAt('none'));
  assert.deepEqual(g.npm, []);
  assert.match(g.findings.find((f) => f.check === 'config').message, /run keys cannot be used.*overlap/);
});

test('a base that deleted its config gives the gate its last config, and is no first close (review 5 of PR 97)', () => {
  const r = product({ tranche: 'tranche', lockfiles: ['package-lock.json'], suite_timeout_minutes: 5 }, { mainFiles: { 'process/config.json': { tranche: 'tranche', lockfiles: ['package-lock.json'] } } });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  git(['rm', '-q', 'process/config.json'], { cwd: r.root });
  r.base = commit(r.root, { 'gone.txt': 'x' }, 'drop the config');
  const c = gateConfig(r.root, { base: r.base, head: r.head, branch: 'tranche', slug: 'o/r', io: ioWith(lookupAt('none')) });
  assert.equal(c.bootstrap, undefined);
  assert.deepEqual(c.cfg.lockfiles, ['package-lock.json']);
});

// ===== file: found.mjs (later part) =====

    if (pin) {
      const pinned = `${pin} pins the ids of ${m.req}, so a found mark added by a plain pull request turns ${module}'s suite red`;
      // Under the layer flow, a module whose layer is not open now cannot start its reopen job: the
      // finding is owed to its next reopen on the state branch (C44). With no layer map, or its layer
      // open, its job takes it now, as before.
      if (!offline && cfg.state_branch) fetchState(root, cfg.state_branch, { fresh: true });
      const at = layerMode(cfg) && cfg.state_branch ? openHolding(root, cfg, module, ref) : null;
      if (!at || at.holds) fail(`${pinned}; nothing was written. The route: ${entry?.status?.state === 'COMPLETE' ? `\`node .process/tool/p3.mjs job start ${module} --sessions <file> --reopen ${q}\`` : `its job (${entry?.status?.state || 'no entry'}) takes it: give the finding to its session, or once it is COMPLETE, \`node .process/tool/p3.mjs job start ${module} --sessions <file> --reopen ${q}\``}, the job adding its own F mark and admitting it in that test`);
      if (offline) fail(`${pinned}, and its layer is not open: the finding is recorded on ${cfg.state_branch} as owed to ${module}'s next reopen, which needs origin; nothing was written. Run it again without --offline`);
      return oweReopen(root, cfg, { module, what, source, base, pin, by, log, pinned });
    }
    file = m.reqText !== null ? m.req : m.found;
    texts = [m.reqText, m.foundText];
    current = m.reqText !== null ? m.reqText : m.foundText;
    title = `Found work for ${module}`;
    where = m.reqText !== null ? "the module's requirement file" : `its found-work entry, since the module has no requirement file (${m.req}); its job starts once BOB gives it a requirement file and ledger entry, moving these marks there`;
  }
  // Numbered past the tranche's marks, the checkout's copy (a --write not yet merged) and every
  // found/<module>-f<n> branch on origin (an act printed, its pull request not yet merged), so two
  // findings for one module before the first merges never share a number (review of PR 75).
  const key = module || 'no-module';
  const local = [file, ...(module ? [foundFile(module)] : [])].map(readAt(root, null));
  // The local found/<key>-f<n> branches count too: a run whose branch is made but not yet pushed
  // (defect sweep 4 Nov).
  // A branch counts only when it holds a written mark: a commit the tranche lacks. One cut as a
  // preview printed it (step 1, no commit yet) is the same mark, not a pending one (copy, 6 Nov:
  // op-capabilities numbered F2 after its F1 preview's branch; PR 664 renumbered it by hand).
  const remote = offline ? '' : git(['ls-remote', '--heads', 'origin', `refs/heads/found/${key}-f*`], { cwd: root, allowFail: true }).stdout || '';
  const localHeads = git(['for-each-ref', '--format=%(objectname) %(refname)', `refs/heads/found/${key}-f*`], { cwd: root, allowFail: true }).stdout || '';
  const written = (sha) => !ref || git(['cat-file', '-e', `${sha}^{commit}`], { cwd: root, allowFail: true }).code !== 0
    || git(['merge-base', '--is-ancestor', sha, ref], { cwd: root, allowFail: true }).code !== 0;
  const heads = `${remote}\n${localHeads}`.split('\n').map((l) => l.trim().split(/\s+/)).filter(([sha, name]) => sha && name && written(sha)).map(([, name]) => name).join('\n');
  const pending = [...heads.matchAll(new RegExp(`refs/heads/found/${key}-f(\\d+)$`, 'gm'))].map((m) => `**F${m[1]}**`).join(' ');
  const n = nextFound(...texts, ...local, pending);
  const line = foundLine(n, what, source);
  const branch = `found/${module || 'no-module'}-f${n}`;
  const P = 'node .process/tool/p3.mjs';
  log(`found work${module ? ` for ${module}` : ', no module'}: F${n} in ${file}, ${where}`);
  log(`BOB's act, a plain pull request into ${cfg.tranche}:`);
  log(`1. git switch -c ${branch} ${ref || cfg.tranche}`);
  log(`2. at the end of ${file}, add this one line and change nothing else (a plain pull request may only add found marks to a requirement file a job owns)${write ? '; written in this checkout now' : '; or run this command again with --write'}:`);
  log(`   ${line}`);
  log(`3. commit it ("found: ${module || 'no module'} F${n}"), \`node .process/tool/p3.mjs github push origin ${branch} --set-upstream\` and open the pull request into ${cfg.tranche}`);
  log(`4. \`${P} merge <that pull request> --plain --no-review "work found elsewhere: one found mark, no code"\``);
  log(module
    ? `status --role bob then lists ${module} as found work as soon as it is ready by open_by, whatever its layer`
    : 'status --role bob then lists it under `found, no module`, with BOB\'s act to name its module');
  if (write) {
    const p = join(root, file);
    mkdirSync(dirname(p), { recursive: true });
    // The checkout's copy when it has one (BOB's branch from the tranche tip), else the tranche's.
    writeFileSync(p, addFound(existsSync(p) ? readFileSync(p, 'utf8') : current, line, title));
  }
  return { module: module || null, file, mark: `F${n}`, line, branch };
}

// Where the layer flow stands for a module: { open: <n> | null, holds } — the layer open now (an open
// row, no merged row) and whether it holds the module (its own, or joined); null with no layer map.
function openHolding(root, cfg, id, ref) {
  const layers = layersAt(root, cfg, ref);
  if (!layers.length) return null;
  const sb = cfg.state_branch;
  for (const L of layers) {
    let open = null;
    try { open = JSON.parse(readState(root, sb, flowFile(L.n, 'open')) || 'null'); } catch { open = null; }
    if (!open || (open.tranche && cfg.tranche && open.tranche !== cfg.tranche)) continue;
    if (readState(root, sb, flowFile(L.n, 'merged')) !== null) continue;
    return { open: L.n, holds: L.mods.includes(id) || readState(root, sb, flowFile(L.n, 'join', safeName(id))) !== null };
  }
  return { open: null, holds: false };
}

// The owed reopen, written once (the same module, finding and source is the same file: kept).
export const reopenKey = (module, finding, source) => createHash('sha256').update(`${module}\n${finding}\n${source}`).digest('hex').slice(0, 12);
function oweReopen(root, cfg, { module, what, source, base, pin, by, log, pinned }) {
  const sb = cfg.state_branch;
  // Keyed without --covers: the same finding given again with another count is the same owe (kept).
  const key = reopenKey(module, what, base);
  const file = `${REOPENS_DIR}/${safeName(module)}-${key}.json`;
  const row = { row: 'reopen', tranche: cfg.tranche, module, finding: what, source, pin, key, at: now(), by };
  const had = readState(root, sb, file) !== null;
  if (!had) {
    writeState(root, sb, `found: ${module} owes a reopen (${source})`, (w) => {
      const p = join(w, file);
      if (!existsSync(p)) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(row, null, 2) + '\n'); }
      return {};
    });
  }
  log(`found work for ${module}: ${pinned}, and its layer is not open, so its reopen job cannot start yet: ${had ? 'recorded already' : 'recorded'} on ${sb} as owed to ${module}'s next reopen (${file})`);
  log(`it counts as recorded for the walk its source names (${source}); the round layer that holds ${module} gives it to its job as its task, the job adding its own F mark and admitting it in ${pin}`);
  log(`next: record the walk's other findings, then open the layer status --role bob names (\`node .process/tool/p3.mjs layer open <n>\`); its \`layer jobs <n>\` lists ${module}'s reopen`);
  return { module, owed: true, file, key, recorded: !had };
}

// The findings that name no module, as the ref holds them: status's `found, no module`.
export function noModuleFound(root, ref) {
  return foundMarks(readAt(root, ref)(NO_MODULE));
}

// The modules with a found-work entry (FOUND_DIR/<id>.md, no-module.md aside) at the ref.
export function foundEntries(root, ref) {
  let names;
  if (ref) {
    const r = git(['ls-tree', '--name-only', `${ref}:${FOUND_DIR}`], { cwd: root, allowFail: true });
    names = r.code === 0 ? r.stdout.split('\n') : [];
  } else {
    const d = join(root, FOUND_DIR);
    names = existsSync(d) ? readdirSync(d) : [];
  }
  return names.filter((n) => n.endsWith('.md') && `${FOUND_DIR}/${n}` !== NO_MODULE).map((n) => n.slice(0, -3)).sort();
}

// ===== file: admit.test.mjs =====

// Every command a START, an act line or a rulebook tells a session to run is admitted by the
// product's .claude/settings.json (C3, the coordinator, 7 Nov): the push check told a session to run
// `git commit --amend --no-edit`, which the copy's settings deny.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import './helpers.mjs';
import { PROMPTS_IN_AUTO, admitCheck, admitTools, deniedBy, ruleMatches, toldCommands, toldIn, toldTools, toolRuleMatches, toolsIn, toolStops } from '../lib/admit.mjs';
import { admitLines } from '../lib/setup.mjs';
