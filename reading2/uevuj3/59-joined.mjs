// ===== file: job.mjs (continued) =====

    return path;
  } catch (e) { log(`the test row was not recorded (${String(e.message).split('\n')[0].slice(0, 160)})`); return null; }
}

// revert exempt <pr> --why "<why>" --reviewer <session> (AUD-1, JOB-12): a reviewer's exemption from
// the gate's revert check, for a refactor whose tests rightly pass before and after the change.
// Posted on the job's pull request as a p3:revert-exempt block naming the head it reviewed; the
// gate takes it only from a reviewer that is not the job's own session, and only while the job's
// own files (its module's paths and tests, records aside) are as that commit had them
// (gate.mjs revertExemption). A body edit then gives the
// gate a new event (pull_request: edited), as a comment gives none.
export const EXEMPT_MARK = 'p3:revert-exempt-regate';
export function revertExempt(root, n, { why, reviewer, io: given = {}, log = console.log } = {}) {
  const io = { getPR, addComment, editPR, ...given };
  if (typeof why !== 'string' || !why.trim()) fail('revert exempt needs --why "<why its tests rightly pass before and after>"');
  const by = sessionForm(typeof reviewer === 'string' ? reviewer.trim() : '');
  if (!by) fail('revert exempt needs --reviewer <your session id>: the exemption is a reviewer\'s, never the job\'s own');
  const slug = io.slug || repoSlug(root);
  const pr = io.getPR(slug, Number(n));
  if (!pr || pr.state !== 'open') fail(`pull request ${n} is not open`);
  const id = branchModule(pr.head?.ref, ledgerIds(root, 'HEAD'));
  if (!id) fail(`pull request ${n} is from ${pr.head?.ref}, not a job branch`);
  const sha = pr.head.sha;
  // The job's own session, from its newest complete row at the head, when this clone can read it;
  // the gate checks it again either way.
  let rows = [];
  try { git(['fetch', '-q', 'origin', sha], { cwd: root, allowFail: true }); rows = rowsAt(root, sha, id); } catch { rows = []; }
  const own = rows.filter((r) => r.row === 'attempt' && r.event === 'complete').pop()?.session || null;
  if (own && sessionForm(own) === by) fail(`${by} is ${id}'s own job session: a job never exempts itself; a reviewer records the exemption`);
  const data = { kind: 'revert-exempt', module: id, pr: pr.number, sha, reviewer: by, why: why.trim(), at: now(), tool: toolPin() };
  const c = io.addComment(slug, pr.number, block(REVERT_EXEMPT, data, `Revert check exemption for job \`${id}\` at \`${sha.slice(0, 10)}\`, reviewed by ${by}.`));
  const key = String(c?.id ?? c?.html_url ?? data.at);
  const line = `<!-- ${EXEMPT_MARK} ${key} --> Gate re-run for the revert exemption${c?.html_url ? ` ${c.html_url}` : ''}.`;
  const mark = new RegExp(`^<!-- ${EXEMPT_MARK} \\S+ -->.*$`, 'm');
  const body = String(pr.body ?? '');
  try { io.editPR(slug, pr.number, { body: mark.test(body) ? body.replace(mark, () => line) : `${body}${body ? '\n\n' : ''}${line}` }); } catch (e) {
    fail(`the exemption is posted, but the body edit that re-runs the gate failed (${e.message}); edit the pull request to re-run it`);
  }
  log(`revert exemption for ${id} at ${sha.slice(0, 10)} posted${c?.html_url ? `: ${c.html_url}` : ''}; the gate runs again on the pull request`);
  return { ok: true, data };
}

// ===== file: status.mjs (later part) =====

  Object.defineProperty(out, 'noEntry', { value: noEntry, enumerable: false }); // read by name only: the list compares as before
  return out;
}

// The completion file's open items, not deferred: a module item through job start as usual (its
// requirement lines written first), unless its job is open; a whole-product item is BOB's act.
export function completionWork(root, cfg, rows, ref, log = console.log) {
  const c = completionItems(root, cfg, ref);
  if (!c) return [];
  if (c.missing) { log(`completion round: ${c.file} is not on ${ref || 'the working tree'}`); return [{ file: c.file, missing: true }]; }
  const open = openItems(c);
  if (!open.length) { log(`completion round: every item of ${c.file} done or deferred; the tranche can close: ${P3} tranche close`); return []; }
  const job = (id) => rows.find((r) => r.id === id && jobOpen(r));
  // In the layer flow a module's item runs in the completion layer (C33): its act is that layer's.
  let start = (id) => `${P3} job start ${id} --sessions <file>`;
  if (layerMode(cfg)) {
    try {
      const ls = layersAtFlow(root, cfg, ref);
      const comp = ls.filter((L) => L.completion).at(-1);
      const live = comp && !flowRowsOf(root, cfg.state_branch, comp.n).merged;
      // BD-R1 (Bob, 8 Nov): no completion layer opens any more; an item left once the open one
      // merged is a flaw of its module, entered as a found mark, so a round's layer runs it.
      if (ls.length) start = (id) => (live ? `${P3} layer jobs ${comp.n}` : `no completion layer opens (BD-R1): enter it as a found mark (\`${P3} found ${id} "<the item>" --from "<its source>"\`) and tick it, so a round's layer runs it`);
    } catch { /* the plain act */ }
  }
  log(`next work, the completion round (${c.file}, ${open.length} open; done: tick its line; deferred: "deferred: <reason>" on its line):`);
  for (const x of open) log(x.malformed ? `- ${c.file}:${x.line}: not an item line (\`- [ ] <id> · <module or whole product> · <what>\`); fix it: ${x.what.slice(0, 100)}` : `- ${x.id} · ${x.target}: ${x.whole ? "BOB's act" : job(x.target) ? 'its job is open' : start(x.target)}${x.what ? ` · ${x.what.slice(0, 100)}` : ''}`);
  return open.map((x) => ({ file: c.file, item: x.id, target: x.target }));
}

// The lanes with more than one live session (status, sweep): the recorded seat, the lane module's
// open job (rows: status's ledger rows), and, with list_sessions, the sessions not archived titled
// `lane <name>` or `job <module>`; each a defect line.
// Open as sessionActs judges a job open: not merged, and not deferred (BLOCKED, its pull request closed).
const laneJobOpen = (r) => !!r && !jobDone(r) && !(r.tranche === 'BLOCKED' && r.blocked && !String(r.pr || '').startsWith('#') && !/^WORKING/.test(String(r.branch || ''))) && (/^(OPEN|WORKING|BLOCKED)/.test(String(r.branch || '')) || String(r.pr || '').startsWith('#'));
export function laneDefects(cfg, seats, { rows = [], listed = null } = {}) {
  const out = [];
  let all = [];
  try { all = Array.isArray(cfg.lanes) ? lanes(cfg) : []; } catch { all = []; }
  for (const l of all) {
    const holders = new Set();
    const s = seats?.get(l.name);
    if (s) holders.add(s.session || `lane ${l.name} (pending)`);
    if (l.module && laneJobOpen(rows.find((r) => r.id === l.module))) holders.add(`job ${l.module}`);
    // The listed sessions: each `lane <name>` not archived, and the module's latest job session
    // (jobSession; an older one beside it after a restart is the sweep's leftover, not a second).
    const live = (listed || []).filter((y) => !isArchived(y));
    for (const x of live.filter((y) => String(y.title || '').trim() === `lane ${l.name}`)) {
      if (s && !s.session) holders.delete(`lane ${l.name} (pending)`);
      holders.add(sessionId(x));
    }
    const js = l.module ? jobSession(live, l.module) : null;
    if (js) { holders.delete(`job ${l.module}`); holders.add(sessionId(js)); }
    if (holders.size > 1) out.push(`defect: lane ${l.name} has ${holders.size} live sessions (${[...holders].join(', ')}): one session per lane at a time; end or archive all but one (lane end ${l.name} frees the lane's seat${l.module ? `; job ${l.module} ends as it completes` : ''})`);
  }
  return out;
}

// ===== file: state.mjs (later part) =====

const put = (wt, path, text, append = false) => {
  mkdirSync(dirname(join(wt, path)), { recursive: true });
  (append ? appendFileSync : writeFileSync)(join(wt, path), text);
};

// The one-screen handoff: pointers from git and the given status lines, and at most a few prose
// lines. The size test measures the notes: refused, nothing written, only when the header and the
// notes, with one status line, are over one screen. The status lines are capped by the screen
// rule: those that fit, then one line pointing at status --role bob for the rest (a 140-line
// status refused every handoff, at any note length, on the copy, 4 Nov).
export const morePointer = (k) => `(${k} more status line${k === 1 ? '' : 's'}: status --role bob lists them all)`;
export function handoff(root, sb, { role = 'bob', tranche, lines, notes = [], log = console.log }) {
  roleName(role, 'the role');
  const tip = git(['log', '-1', '--format=%H %s', tranche], { cwd: root });
  if (notes.length > HANDOFF_MAX.notes) fail(`at most ${HANDOFF_MAX.notes} notes`);
  const head = [`# Handoff for ${role}, ${now()}`, `tranche ${tip}`, ''];
  const tail = notes.length ? ['', 'notes:', ...notes.map((n) => `- ${String(n).replace(/\s+/g, ' ').trim()}`)] : [];
  const join_ = (body) => [...head, ...body, ...tail].join('\n') + '\n';
  const size = (t) => ({ count: t.split('\n').length - 1, bytes: Buffer.byteLength(t) });
  const fits = (t) => { const z = size(t); return z.count <= HANDOFF_MAX.lines && z.bytes <= HANDOFF_MAX.bytes; };
  if (!fits(join_(lines.length ? [morePointer(lines.length)] : []))) {
    const n = size(tail.join('\n') + (tail.length ? '\n' : ''));
    fail(`the notes are ${n.count} lines, ${n.bytes} bytes; with the handoff's header and one status line they are over one screen (${HANDOFF_MAX.lines} lines and ${HANDOFF_MAX.bytes} bytes): shorten the notes`);
  }
  let k = lines.length;
  const body = (j) => (j < lines.length ? [...lines.slice(0, j), morePointer(lines.length - j)] : lines);
  while (k > 0 && !fits(join_(body(k)))) k--;
  const text = join_(body(k));
  const w = writeState(root, sb, `handoff for ${role}`, (wt) => put(wt, handoffFile(role), text));
  log(text);
  if (k < lines.length) log(`status capped by the screen rule: ${k} of ${lines.length} status lines in the handoff, the rest named by its pointer line`);
  log(`handoff written to ${sb}:${handoffFile(role)} at ${w.tip.slice(0, 10)}`);
  return { text, tip: w.tip, shown: k, of: lines.length };
}

// Messages, per sender: sent rows { n, to, text } and outcome rows { n, outcome }.
export function messages(text) {
  const sent = new Map();
  for (const r of jsonl(text)) {
    if (r.row === 'sent') sent.set(r.n, { ...r, outcome: null });
    else if (r.row === 'outcome' && sent.has(r.n)) sent.get(r.n).outcome = r.outcome;
  }
  return [...sent.values()];
}

// Every sent message not recorded delivered, from every sender, as the fetched branch holds them.
export function undelivered(root, sb) {
  const r = git(['ls-tree', '--name-only', '-z', `${ref(sb)}:messages`], { cwd: root, allowFail: true });
  if (r.code !== 0) return [];
  return r.stdout.split('\0').filter((f) => f.endsWith('.jsonl')).flatMap((f) =>
    messages(readState(root, sb, `messages/${f}`)).filter((m) => m.outcome !== 'delivered').map((m) => ({ from: f.slice(0, -6), ...m })));
}

// Reports to route (P9, PLN-3): messages to bob from a job sender (any sender but root, bob and
// the watcher) until a later message from bob names its id (<from>-<n>) in its text.
export function toRoute(root, sb) {
  const r = git(['ls-tree', '--name-only', '-z', `${ref(sb)}:messages`], { cwd: root, allowFail: true });
  if (r.code !== 0) return [];
  const all = r.stdout.split('\0').filter((f) => f.endsWith('.jsonl')).flatMap((f) => messages(readState(root, sb, `messages/${f}`)).map((m) => ({ from: f.slice(0, -6), ...m })));
  const bob = all.filter((m) => m.from === 'bob');
  // A wake (its text ends ": run status" or, the pin move's, ", then status", as job.mjs's bobWake writes it) asks BOB to run status: nothing to route.
  return all.filter((m) => m.to === 'bob' && !['root', 'bob', 'watcher'].includes(m.from) && !/(: run|, then) status$/.test(String(m.text))).filter((m) => {
    const id = new RegExp(`(^|[^\\w-])${m.from}-${m.n}(?!\\d)`);
