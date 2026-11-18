// ===== file: report-right.test.mjs (continued) =====

  const src = makeRepo({ 'README.md': 'x' });
  const prev = { ...process.env };
  Object.assign(process.env, { GIT_COMMITTER_DATE: t(40), GIT_AUTHOR_DATE: t(40) });
  try { commit(src, { 'process/ledger/u3.json': '{}' }, 'entry'); commit(src, { 'b.txt': 'b' }, 'b'); } finally { for (const k of ['GIT_COMMITTER_DATE', 'GIT_AUTHOR_DATE']) { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k]; } }
  const root = join(mkdtempSync(join(tmpdir(), 'p3-shallow-')), 'c');
  git(['clone', '-q', '--depth', '1', `file://${src}`, root], { cwd: src });
  const cfg = loadConfig(root);
  const rows = [start('p2', 1), merge('p2', 20, 1), start('q2', 2), merge('q2', 30, 2), start('u3', 45)];
  const u3 = leadTimes(root, cfg, { ref: 'HEAD', rows, layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) }).jobs.find((j) => j.module === 'u3').ready_to_start;
  assert.equal(u3.ready_by, 'uses', 'the cut tells nothing: the provider merge stands');
  assert.equal(u3.ready, t(30));
});

// The copy, 4 Nov 12:23: queue, queue-producers and case-authoring, entries added 11:42:35 and
// started 11 to 25 min later before bias (in their uses) merged, read no ready figure at all.
test('ready to start: a job started before a provider in its uses merged waits from its entry\'s add, when that came before its start', () => {
  const root = makeRepo({ 'README.md': 'x' });
  const prev = { ...process.env };
  Object.assign(process.env, { GIT_COMMITTER_DATE: t(10), GIT_AUTHOR_DATE: t(10) });
  try { commit(root, { 'process/ledger/n3.json': '{}' }, 'entry n3'); } finally { for (const k of ['GIT_COMMITTER_DATE', 'GIT_AUTHOR_DATE']) { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k]; } }
  const cfg = loadConfig(root);
  // q2's job started at 1 and is not merged; n3's entry was added at 10 and its job started at 35.
  const lt = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('q2', 1), start('n3', 35)], layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) });
  const n3 = lt.jobs.find((j) => j.module === 'n3').ready_to_start;
  assert.equal(n3.minutes, 25, 'from its entry\'s add (10) to its start (35)');
  assert.equal(n3.ready_by, 'entry');
  assert.equal(n3.ready, t(10));
  assert.equal(n3.started_before, 'q2');
  assert.match(leadCell(n3), /^25 min .*\(started before q2 merged\)/);
  // Counted in the median, and still counted as started before a provider merged.
  assert.equal(lt.summary.ready_to_start.n, 2);
  assert.equal(lt.summary.ready_to_start.started_before_uses, 1);
  // An entry added before the opening: the wait runs from the opening.
  const late = leadTimes(root, cfg, { ref: 'HEAD', rows: [start('q2', 15), start('n3', 35)], layers: LAYERS, modules: MODULES, grants: grants(12), closed: [], now: t(100) }).jobs.find((j) => j.module === 'n3').ready_to_start;
  assert.deepEqual([late.minutes, late.ready], [23, t(12)]);
  // No entry add before the start (none at ref): the figure still says it started first.
  const bare = makeRepo({ 'README.md': 'x' });
  const none = leadTimes(bare, cfg, { ref: 'HEAD', rows: [start('q2', 1), start('n3', 35)], layers: LAYERS, modules: MODULES, grants: grants(0), closed: [], now: t(100) }).jobs.find((j) => j.module === 'n3').ready_to_start;
  assert.equal(none, 'started before q2 (in its uses) merged; q2 not merged yet');
});

test('3: the total since the opening counts an attempt priced at its merge, not the unmeasured row job complete wrote before it', () => {
  const { root } = repo([start('a', 5, 1), measured('a', 6, 'job', 'unmeasured', 's_a', { attempt: 1, session_usd: 3 }), measured('a', 9, 'job', 0.75, 's_a', { attempt: 1, session_usd: 3.75 })]);
  assert.match(tranche(root), /- total cost since the opening: \$0\.75/);
  // An attempt with only the unmeasured row stays unmeasured.
  const { root: r2 } = repo([start('a', 5, 1), measured('a', 6, 'job', 'unmeasured', 's_a', { attempt: 1, session_usd: 3 })]);
  assert.match(tranche(r2), /- total cost since the opening: unmeasured \(\$0\.00 over 0 priced rows; 1 without a cost\)/);
});

// ===== file: p3.mjs (later part) =====

    for (const x of specs) {
      if (x.includes('*')) fail(`github push: ${x}: no wildcard refspec; push one branch at a time`);
      const dst = (x.includes(':') ? x.split(':').pop() : x).replace(/^refs\/heads\//, '');
      if (!dst) fail(`github push: ${x}: no empty destination (a delete)`);
      if (dst === 'main') fail(`github push: ${x}: never to main; main moves only through the tranche's pull request (Bob's standing approvals)`);
    }
    for (const k of [`remote.${remote}.mirror`, `remote.${remote}.push`]) {
      const v = git(['config', '--get-all', k], { cwd: root, allowFail: true }).stdout.trim();
      if (v && !(k.endsWith('.mirror') && v === 'false')) fail(`github push: ${k} is set in this clone (${v.split('\n')[0]}): it can force or delete; unset it first`);
    }
    const r = git(['push', ...(a['set-upstream'] ? ['-u'] : []), ...(a.quiet ? ['-q'] : []), remote, ...specs], { cwd: root, allowFail: true });
    if (r.stdout.trim()) console.log(r.stdout.trim());
    if (r.stderr.trim()) console.error(r.stderr.trim());
    return r.code === 0 ? 0 : 1;
  },
  switch: (a, root) => {
    const sub = a._[0];
    if (sub === 'out') return (switchOut(root, { tasks: a.tasks, sessions: a.sessions, by: a.by, dryRun: !!a['dry-run'] }), 0);
    if (sub === 'in') { const r = switchIn(root, { sessions: a.sessions, by: a.by, approvals: a.approvals, preflight: !!a.preflight }); return r.ok === false ? 1 : 0; }
    if (sub === 'quiet') return switchQuiet(root, { ...(a.minutes !== undefined ? { minutes: a.minutes } : {}) }).ok ? 0 : 1;
    fail('switch out --tasks <file> --sessions <file> --by <session> [--dry-run] | switch in --sessions <file> --by <session> [--approvals <hash>] | switch in --preflight --by <session> | switch quiet [--minutes <n>]');
  },

  // watch --session <the watcher's id> [--full | --escalated <minutes>]: the watcher's decision,
  // daily or at once on an escalation.
  watch: (a, root) => { watch(root, { session: a.session, full: !!a.full, escalated: a.escalated }); return 0; },

  // address <root|bob|watcher|coordinator>: the address as the state branch holds it now;
  // the coordinator's, else `coordinator` in process/config.json.
  address: (a, root) => {
    const asked = String(one(a, 'role (root, bob, watcher or coordinator)')).toLowerCase();
    if (asked === 'coordinator') {
      const addr = readAddress(root);
      const c = coordinatorOf(tipConfig(root), addr) || fail('no coordinator is addressed and process/config.json on the tranche names none');
      console.log(addr.coordinator?.session === c ? `${c} (since ${addr.coordinator.at})` : `${c} (from process/config.json on the tranche)`);
      return 0;
    }
    const role = checkRole(asked);
    const e = readAddress(root)[role];
    if (!e) fail(`no ${role} is addressed`);
    console.log(`${e.session} (since ${e.at})`);
    return 0;
  },

  // handover begin | handover confirm <new BOB id>: ROOT replaces BOB (SES-2).
  handover: (a, root) => {
    const sub = a._.shift();
    if (sub === 'begin') { handoverBegin(root); return 0; }
    if (sub === 'confirm') { handoverConfirm(root, a._[0]); return 0; }
    fail('handover begin | handover confirm <new BOB session id>');
  },

  // state replay [<ref>...]: the state writes kept when their push gave up (refs/p3/unpushed/*), made again.
  'state replay': (a, root) => { stateReplay(root, loadConfig(root).state_branch, a._.map(String)); return 0; },

  // ledger check [--base <ref> --branch <name> [--home <tranche ref>]]: schema; on a job branch, own
  // status only; with --home (the layer flow), its own entry may be added as the tranche holds it.
  'ledger check': (a, root) => {
    const base = a.base ? git(['merge-base', 'HEAD', a.base], { cwd: root }) : undefined;
    return report(checkLedger(root, { base, branch: a.branch, home: typeof a.home === 'string' ? a.home : undefined }), a.out);
  },

  // record-check --base <sha> --head <sha> [--branch <head branch>] [--onto <ref>]... [--out f]
  // Run by CI with the base's own tool. A missing or all-zero base (a new branch) becomes the
  // merge-base with the first --onto ref that exists (default: the tranche, then main).
  'record-check': (a, root) => {
    const head = a.head || 'HEAD';
    const onto = list(a.onto).length ? list(a.onto) : [`origin/${loadConfig(root).tranche}`, 'origin/main'];
    let base = a.base && !/^0+$/.test(a.base) ? a.base : null;
    if (!base) {
      for (const o of onto) {
        const r = git(['merge-base', head, o], { cwd: root, allowFail: true });
        if (r.code === 0) { base = r.stdout.trim(); break; }
      }
      if (!base) fail(`no base: none of ${onto.join(', ')} shares history with ${head}`);
    }
    const ledgerBase = git(['merge-base', head, base], { cwd: root });
    const cfg = loadConfig(root, base);
    const s = recordSince(root, { base, head });
    // A take-in's earlier work, before its start commit, is left out (takenIn): on job/<id> that
    // job's, on any other branch every module's.
    const job = branchModule(String(a.branch || ''), ledgerIds(root, head));
    const t = takenIn(root, { base, head, id: job || undefined });
    // In the layer flow, a job may carry its own entry from the tranche, the ledger's home.
    const home = job && layerMode(cfg) ? homeRef(root, cfg.tranche) : null;
    const { commits, findings, notices, size_waived } = recordCheck(root, cfg, { base, head, branch: a.branch, ledgerBase, since: s.since, takenIn: t.tips, home });
    if (s.finding) findings.push(s.finding);
    findings.push(...t.findings);
    console.log(`checked ${commits} commit(s) after ${base.slice(0, 10)}${s.since ? ` and after ${s.since.slice(0, 10)} (record_since, from the ${s.from})` : ''}${t.tips.length ? `, leaving out the earlier work taken in at ${t.tips.map((x) => x.slice(0, 10)).join(', ')}` : ''}`);
    // Annotations, so a notice shows on the pull request and not only in the log.
    const esc = (x, prop) => String(x).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
      .replace(prop ? /[:,]/g : /$^/, (c) => (c === ':' ? '%3A' : '%2C'));
    for (const n of notices) console.log(`::warning file=${esc(n.file, true)}::${esc(n.message)}`);
    return report(findings, a.out, { commits, base, notices, ...(size_waived.length ? { size_waived } : {}) });
  },
};

// After an act that wrote and succeeded, the tool ends the records whose condition is met (R13,
// expire.mjs); a failure is said on stderr and never changes the act's result.
export function endsAfter(root, cfg, name, code, { expire = expireRecords, err = (m) => console.error(m) } = {}) {
  if (code !== 0 || !ENDS_AFTER.has(name)) return null;
  try { return expire(root, cfg); } catch (e) { err(`records whose condition is met were not ended: ${e.message}`); return null; }
}
// The acts after which the tool ends the records whose condition is met (R13).
export const ENDS_AFTER = new Set(['merge', 'hold', 'job start', 'job complete', 'block', 'layer open', 'layer land', 'layer merge', 'layer join', 'layer publish', 'round next', 'tranche open', 'tranche close', 'lane start', 'lane end', 'lane ask', 'notice triage']);
// The commands whose state writes push at once (R17): see main.
let endFlush = () => {};
let endHooked = false;
export const UNBATCHED = new Set(['job start', 'lane start', 'start', 'handover', 'state replay', 'round next']);
export async function main(argv) {
  const a = parseArgs(argv);
  const two = a._.slice(0, 2).join(' ');
  const name = commands[two] ? two : a._[0];
  const fn = commands[name];
  if (!fn) {
    console.log(`commands: ${Object.keys(commands).join(', ')}`);
