// ===== file: ends.mjs (continued) =====

    moduleComplete: (id) => { const e = entry(id); return e === null ? null : e === undefined ? false : e.status?.state === 'COMPLETE'; },
    // Archived in the list. A session the list does not hold is unknown, not gone: list_sessions
    // pages, and a short list is no proof an id is gone.
    sessionGone: (id) => { if (retired.has(id)) return true; if (!sessions) return null; const x = sessions.get(id); return x ? archived(x) : null; },
  };
}

// One condition against the facts: { met: true | false | null, why }.
export function checkCondition(c, f) {
  const [k, v] = Object.entries(c)[0] || [];
  const r = (met, why) => ({ met, why: `${k}:${v} ${met === true ? 'met' : met === false ? 'not met' : 'unknown'}${why ? ` (${why})` : ''}` });
  switch (k) {
    case 'layer_closed': return r(f.layerClosed(v));
    case 'layer_open': return r(f.layerOpen(v));
    case 'pr_merged': return r(f.prMerged(v));
    case 'module_complete': return r(f.moduleComplete(v));
    case 'session_gone': return r(f.sessionGone(v), f.sessionGone(v) === null ? 'no session list read' : '');
    case 'at': return r(f.t >= Date.parse(v));

// A requirement on what a job hands in: any script the job writes prints this exact line as the
// very last line of its output: `run closed Z4E-8896`.

    default: return { met: null, why: `${JSON.stringify(c)} is not a condition` };
  }
}
// The first met condition of a list, or null.
export const firstMet = (conds, f) => (conds || []).map((c) => ({ c, ...checkCondition(c, f) })).find((x) => x.met === true) || null;

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
    return !bob.some((b) => b.at >= m.at && id.test(b.text));
  });
}

// The config with `coordinator` resolved (Bob, 5 Nov 16:33: ROOT refreshes the coordinator): ROOT's
// addresses/coordinator.json on the state branch as last fetched, else process/config.json's.
// roles.mjs coordinatorOf is the same rule over an address read already.
export const withCoordinator = (root, cfg) => {
  let c = null;
  try { c = address(root, cfg.state_branch, 'coordinator'); } catch { c = null; }
  return c ? { ...cfg, coordinator: c } : cfg;
};

// The address read from git at this moment: the session id, or null.
export function address(root, sb, role) {
  const t = readState(root, sb, addressFile(role));
  if (t === null) return null;
  try { const a = JSON.parse(t); return (typeof a === 'string' ? a : a?.session || a?.id) || null; } catch { return t.trim() || null; }
}

// The record first: no uncommitted change to a tracked file, and no commit the branch's upstream
// (or, without one, origin's branch of the same name) lacks. A detached HEAD has no record of its own.
// .process is left out: after a merge of the tranche that moved the pin it reads as changed until
// the submodule is updated, and a job never commits it (defect sweep 4 Nov, #2; the gate catches
// a committed pin change), so a BLOCKED job can still wake BOB.
function unpushed(root) {
  if (git(['status', '--porcelain', '--untracked-files=no', '--ignore-submodules=all'], { cwd: root })) fail('this checkout has uncommitted changes; commit and push the record first, then send');
  const name = git(['symbolic-ref', '-q', '--short', 'HEAD'], { cwd: root, allowFail: true }).stdout.trim();
  if (!name) return;
  git(['fetch', '-q', 'origin', `+refs/heads/${name}:refs/remotes/origin/${name}`], { cwd: root, allowFail: true });
  let up = git(['rev-list', '--count', '@{upstream}..HEAD'], { cwd: root, allowFail: true });
  if (up.code !== 0) up = git(['rev-list', '--count', `refs/remotes/origin/${name}..HEAD`], { cwd: root, allowFail: true });
  if (up.code !== 0) fail(`${name} is not on origin; push the record first, then send`);
  if (Number(up.stdout) > 0) fail(`${name} has ${Number(up.stdout)} commit(s) not pushed; push the record first, then send`);
}

// send: the record first (the caller's work pushed, then the numbered message pushed), then the
// message and the address, read from git after that push, for the session to deliver.
export function send(root, sb, { from, to, text, log = console.log }) {
  roleName(from, '--from');
  roleName(to, 'the role sent to');
  if (typeof text !== 'string' || !text.trim()) fail('send <to-role> "<text>"');
  unpushed(root);
  const { n } = writeState(root, sb, `message from ${from} to ${to}`, (wt) => {
    const file = join(wt, messagesFile(from));
    const k = messages(existsSync(file) ? readFileSync(file, 'utf8') : '').reduce((m, x) => Math.max(m, x.n), 0) + 1;
    put(wt, messagesFile(from), JSON.stringify({ at: now(), row: 'sent', n: k, to, text: text.trim() }) + '\n', true);
    return { n: k };
  });
  const at = address(root, sb, to);
  const body = `MSG ${from}-${n} to ${to}: ${text.trim()}\n(numbered; a number already seen is a duplicate, ignore it)`;
  log(body);
  log(at ? `address of ${to}: ${at}` : `no address for ${to} on ${sb}`);
  log(`deliver it with send_message, then: send delivered ${n} --from ${from} (or send failed ${n} --from ${from})`);
  return { n, body, address: at };
}

// send delivered <n> | send failed <n>: the outcome, recorded only for a message that was sent.
export function outcome(root, sb, { from, n, result, reason, log = console.log }) {
  roleName(from, '--from');
  if (!Number.isInteger(n) || n < 1) fail(`send ${result} <n>: the message's number`);
  writeState(root, sb, `message ${from}-${n} ${result}`, (wt) => {
    const file = join(wt, messagesFile(from));
    if (!messages(existsSync(file) ? readFileSync(file, 'utf8') : '').some((m) => m.n === n)) fail(`${from} sent no message ${n}`);
    put(wt, messagesFile(from), JSON.stringify({ at: now(), row: 'outcome', n, outcome: result, ...(reason ? { reason } : {}) }) + '\n', true);
  });
  log(`message ${from}-${n} recorded ${result}`);
}

// A pin move's wake, recorded and printed once per merge commit (build train-robust; the
// coordinator's ruling, 5 Nov: the train's row, a later pass's "merged elsewhere" row and the
// waiting caller can each reach the same land). merger/wakes.jsonl holds at most one 'wake' row
// (the record: who saw it first) and one 'printed' row (who printed it) per merge commit.
// print: whether this run would print it. Returns { recorded, print, printed }: recorded and
// print true for the run whose row landed; a record that cannot be written returns both true
// (null on recorded) so the wake is printed rather than lost.
export const WAKES_FILE = 'merger/wakes.jsonl';
export function wakeOnce(root, sb, { pr, sha, what, wake, by, print = false }) {
  const SAME = new Error('nothing new'); // nothing to write: no commit, no push
  let seen = null;
  try {
    return writeState(root, sb, `pin wake for PR ${pr}: ${by}${print ? ', printed' : ''}`, (wt) => {
      const file = join(wt, WAKES_FILE);
      const rows = jsonl(existsSync(file) ? readFileSync(file, 'utf8') : '').filter((r) => r.sha === sha);
      const had = rows.find((r) => r.row === 'wake');
      const printed = rows.find((r) => r.row === 'printed');
      const add = [];
      if (!had) add.push({ at: now(), row: 'wake', pr, sha, what, wake, by });
      if (print && !printed) add.push({ at: now(), row: 'printed', pr, sha, by });
      seen = { recorded: !had, print: print && !printed, printed: printed || null };
      if (!add.length) throw SAME;
      put(wt, WAKES_FILE, add.map((r) => JSON.stringify(r)).join('\n') + '\n', true);
      return seen;
    });
  } catch (e) {
    if (e === SAME) return seen;
    if (!(e instanceof Fail)) throw e;
    return { recorded: null, print, printed: null, error: e.message };
  }
}

// ===== file: status.mjs (later part) =====

  Object.defineProperty(out, 'noEntry', { value: noEntry, enumerable: false }); // read by name only: the list compares as before
