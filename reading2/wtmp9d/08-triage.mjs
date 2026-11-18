    ...(n.exports_unread ? ['', `Its exports could not be read (${n.exports_unread}); read the provider's change.`] : []),
    '',
    `For each module below, read at ${tranche} ${sha.slice(0, 10)} the files listed for it, which import \`${n.provider}\` (each import's line given), and what they do with what they import; decide whether the module uses the changed behaviour${n.exports ? ' or any export removed or changed' : ''}. Read further only where those files lead. A module listed with no file importing \`${n.provider}\` is judged from that: cite its paths and the modules file. Answer one line per module, exactly one of:`,
    '<module>: affected: <file>:<line> <what there uses the changed behaviour>',
    '<module>: not affected: <file>:<line> <the evidence that it does not: its use of the provider, or where it would be>',
    'Every line cites a file:line. Judge every module below, each from what you read; nothing is recorded until every module of the notice has a line. No other lines matter.',
    '',
    `Modules (${mods.length}; paths; the files that import ${n.provider}, with their import lines):`,
    ...mods.map((m) => `- ${m.id}: ${m.paths.join(', ') || '(no paths in the modules file)'}; ${m.imports?.length ? m.imports.map((x) => `${x.file}:${x.lines.join(',')}`).join(', ') : `no file imports ${n.provider}`}${m.why ? `; not cleared by rule: ${m.why}` : ''}`),
  ].join('\n');
}

// notice triage <key>: prints BOB's act and the worker's brief; writes nothing.
export function noticeTriage(root, key, { log = console.log, io = {} } = {}) {
  const cfg = loadConfig(root);
  const found = find(root, cfg, key);
  const { n, withdrawn } = found;
  let { owed } = found;
  if (withdrawn) { log(withdrawnText(n)); return { owed, withdrawn }; }
  if (!owed.length) { log(`provider notice ${key}: no module owes triage (${n.open.length} unanswered, each triaged affected or named by its open job's START)`); return { owed }; }
  const tranche = `origin/${cfg.tranche}`;
  git(['fetch', '-q', ...depth(root), 'origin', `+refs/heads/${cfg.tranche}:refs/remotes/${tranche}`], { cwd: root, allowFail: true });
  const sha = git(['rev-parse', tranche], { cwd: root });
  const changed = changes(root, cfg, n, { slug: io.slug || repoSlug(root), read: io.getPR || getPR, compare: io.compare, presence: io.presence });
  if (changed.missing) {
    log(`provider notice ${key}: ${changed.missing.why}, so what it changed can never be read and no brief can be written; it clears only by withdrawal, BOB's act: ${P3} notice withdraw ${key}`);
    return { owed, missing: changed.missing };
  }
  // PD-20 for a notice raised before the rule (or whose merge's triage failed): the rule clears
  // here what it would have cleared at the merge, written as the merge writes it, and only the
  // rest is briefed. A notice with no read of its exports recorded has them read now, over its
  // PR's merged range; one with a requirement id changed is left to the workers.
  let whys = new Map();
  if (Array.isArray(n.ids) && !n.ids.length) {
    const read = n.exports_read || n.exports_unread || !changed.entry ? {} : { exports: undefined, ...readExports(root, cfg, changed.entry, changed.mb, changed.head) };
    const nr = { ...n, ...read };
    if (interfaceRule(nr).rule) {
      const r = ruleClear(root, cfg, nr, owed, sha, { by: 'notice triage' });
      whys = r.whys;
      const rows = r.cleared.length ? addRows(root, cfg.state_branch, `notice triage ${key} by rule: ${r.cleared.length} module(s) not affected (${ruleCounts(r.cleared)})`, clearRows(key, r.cleared, new Date().toISOString())) : [];
      log(`notice triage ${key} by rule (PD-20): ${r.cleared.length} of ${owed.length} not affected (${r.cleared.length ? ruleCounts(r.cleared) : 'no rule cleared any'}), ${rows.length / 2} recorded${r.cleared.length ? `, answered: ${r.cleared.map((m) => m.id).join(', ')}` : ''}`);
      owed = owed.filter((u) => !r.cleared.some((m) => m.id === u));
      if (!owed.length) { log(`provider notice ${key}: no module owes triage now; no worker to run`); return { owed, cleared: r.cleared }; }
    }
  }
  const mods = sizes(root, cfg, owed, tranche, n.provider).map((m) => (whys.has(m.id) ? { ...m, why: whys.get(m.id) } : m));
  const parts = shares(mods, { bytes: cfg.triage_share_bytes, modules: cfg.triage_share_modules });
  if (parts.length === 1) {
    const brief = briefText({ n, changed, mods, tranche, sha });
    log(`BOB's act: start one read-only worker, a subagent (the Agent tool, not a session), with the brief below; save its answer to a file, then: ${P3} notice triage ${key} --record <file> --worker <its id> --cost <its cost>`);
    log('');
    log(brief);
    return { owed, brief, briefs: [brief] };
  }
  const N = parts.length;
  const briefs = parts.map((p, i) => briefText({ n, changed, mods: p, tranche, sha, share: { k: i + 1, of: N } }));
  const rec = parts.map((_, i) => `--record <file ${i + 1}> --worker <id ${i + 1}> --cost <cost ${i + 1}>`).join(' ');
  log(`BOB's acts: ${owed.length} modules, over one worker's share (${cfg.triage_share_modules} modules or ${cfg.triage_share_bytes} bytes of the files that import ${n.provider}): start ${N} read-only workers in parallel, subagents (the Agent tool, not sessions), worker k with brief k below; save each answer to its own file, then record them together, once every worker has answered: ${P3} notice triage ${key} ${rec}`);
  parts.forEach((p, i) => log(`- worker ${i + 1} of ${N}: brief ${i + 1} (${p.length} modules, ${p.reduce((t, m) => t + m.bytes, 0)} bytes)`));
  briefs.forEach((b, i) => { log(''); log(`=== brief ${i + 1} of ${N} ===`); log(b); });
  return { owed, briefs, shares: parts.map((p) => p.map((m) => m.id)) };
}

// notice triage <key> --record <file>...: the workers' lines, to the state branch, one --record,
// --worker and --cost per worker (a split notice has several). A notice is triaged whole: nothing
// is recorded until every module that owes triage has a line from some worker. A `not affected`
// with evidence answers the notice for its module; an `affected` is recorded and stays work.
export function recordTriage(root, key, { file, worker, cost, as = 'bob', log = console.log }) {
  const files = list(file);
  const workers = list(worker);
  const costs = list(cost);
  if (!files.length || files.some((f) => !f || f === true)) fail('--record <file>: the worker\'s answer, one line per module');
  if (!workers.length || workers.some((w) => !w || w === true)) fail('--worker <id>: the worker\'s id, as the Agent tool gave it');
  if (!costs.length || costs.some((c) => c === true || !String(c).trim())) fail('--cost <cost>: the worker\'s cost, as the Agent tool reported it');
  if (workers.length !== files.length || costs.length !== files.length) fail(`give one --worker and one --cost per --record, in the same order: ${files.length} --record, ${workers.length} --worker, ${costs.length} --cost`);
  for (const f of files) if (!existsSync(f)) fail(`no file ${f}`);
  const cfg = loadConfig(root);
  const { n, owed, untriaged, withdrawn } = find(root, cfg, key);
  if (withdrawn) fail(`refused: ${withdrawnText(n)}; nothing was written`);
  const lines = new Map();
  files.forEach((f, i) => {
    const got = parseTriage(readFileSync(f, 'utf8'));
    for (const b of got.bad) log(`not recorded: ${b}`);
    for (const [u, v] of got.lines) {
      const had = lines.get(u);
      if (had && had.verdict !== v.verdict) fail(`the workers judged ${u} both affected and not affected; record one verdict per module`);
      if (!had) lines.set(u, { ...v, worker: String(workers[i]), cost: String(costs[i]) });
    }
  });
  const stranger = [...lines.keys()].filter((u) => !n.users.includes(u));
  if (stranger.length) log(`not recorded, not users of ${key}: ${stranger.join(', ')}`);
  const left = owed.filter((u) => !lines.has(u));
  if (left.length) fail(`refused: notice triage ${key} records only when every module has a line; ${left.length} of ${owed.length} not judged: ${left.join(', ')}. Run a worker for them, then record every file again, nothing was written`);
  const at = new Date().toISOString();
  // Required: a line for every slot triage owes. Recorded as well: a line given for any other
  // untriaged user (one whose open job names the notice since, or did when the brief was
  // printed), so a judgement the worker made is never dropped.
  const want = untriaged.filter((u) => owed.includes(u) || lines.has(u)).flatMap((u) => {
    const { verdict, evidence, worker: w, cost: c } = lines.get(u);
    const common = { at, key, worker: w, cost: c };
    return [[triageFile(u, key), { row: 'triage', user: u, verdict, evidence, ...common }],
      ...(verdict === 'not affected' ? [[answerFile(u, key), { row: 'answered', user: u, by: 'triage', evidence, ...common }]] : [])];
  });
  const rows = want.length ? writeState(root, cfg.state_branch, `notice triage ${key}: ${want.filter(([, r]) => r.row === 'triage').length} module(s)`, (wt) => {
    const dir = resolve(wt, NOTICES_DIR) + sep;
    const add = want.filter(([f]) => resolve(wt, f).startsWith(dir) && !existsSync(join(wt, f)));
    for (const [f, row] of add) {
      mkdirSync(dirname(join(wt, f)), { recursive: true });
      writeFileSync(join(wt, f), JSON.stringify(row) + '\n');
    }
    return { rows: add.map(([, row]) => row) };
  }).rows : [];
  const t = rows.filter((r) => r.row === 'triage');
  const not = t.filter((r) => r.verdict === 'not affected').length;
  log(`notice triage ${key} recorded: ${not} not affected (answered), ${t.length - not} affected (next work)`);
  // The verdicts change BOB's next work (affected modules, answered notices): the wake is the last line.
  const wake = t.length ? wakeLine(`notice triage ${key} recorded`, as) : null;
  if (wake) log(wake);
  return { rows, left };
}


// Rule for jobs: the reviewer for jobs has changed. Handover notes now carry the line
// `reviewer: Tobias Hallworth`, and the name Yasmin Benhaddou is no longer written anywhere in a
// handover note.

// PD-20 (coordinator, 9 Nov, at Bob's ask): before the imports check, the interface rule. A notice
// that changed no requirement id, its exports read over its range, clears every user when no
// export moved or names were only added ('merge: no interface change'); with names removed or
// changed, a user that imports the provider is cleared when each of its imports of the provider
// names only unmoved names ('merge: imported names unchanged', its import lines the evidence).
// Anything unread, a default, namespace or dynamic import, or a requirement id changed stays owed.
// Triage at the merge (coordinator, 4 Nov: every real ready-to-start wait on the copy since 06:00
// was a notice waiting 33 to 57 minutes for BOB's batch triage). The merge that raises a notice
// triages it in the same command by the rule the briefs already use (PR 89): a user module whose
// paths hold no file importing the provider, as the gate's imports check finds an import, is
// recorded not affected, its notice answered, with the modules file's line for it and the commit
// read as its evidence. A module that imports the provider needs a worker's judgment: it stays
// owed, and the merge names that one notice's `notice triage` as BOB's next act at once. A module

// Kept by every job without exception: the job's handover note is saved under the file name
// `galloway-relay.md`, and under no other name.

// with no paths in the modules file is never judged here.
// Never silent (coordinator, 4 Nov: no triage row at question-explorer:199's merge and no line
// saying why): every return prints a line beginning "notice triage <key> at the merge", and a
// user left owed is named with why it was not cleared.
export function triageAtMerge(root, cfg, notice, { ref, as = 'bob', log = console.log } = {}) {
  const head = `notice triage ${notice?.key || '(no key)'} at the merge`;
  if (!notice?.key || !Array.isArray(notice.users) || !notice.users.length) {
    log(`${head}: nothing to triage (${!notice?.key ? 'the notice has no key' : 'the notice names no user module'})`);
    return { rows: [], owed: [], why: 'no users' };
  }
  const key = notice.key;
  const sb = cfg.state_branch;
  fetchState(root, sb, { fresh: true });
  const tri = triageRows(root, sb);
  const owed = notice.users.filter((u) => !tri.has(`${key}\0${u}`));
  if (!owed.length) {
    log(`${head}: all ${notice.users.length} user module(s) already triaged on ${sb}; nothing written`);
    return { rows: [], owed: [], why: 'all triaged' };
  }
  const sha = git(['rev-parse', ref], { cwd: root });
