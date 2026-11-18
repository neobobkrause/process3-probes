  const n = entry.list.length;
  git(['update-ref', `${PENDING}${String(n).padStart(4, '0')}`, made[0].c], { cwd: root });
  entry.list.push({ msg, change });
  entry.tip = tip;
  batch.pending.set(key, entry);
  fetched.set(key, true);
  return { ...made[0].o, tip };
}
// The kept pending writes of p3 processes no longer running in this clone, moved to UNPUSHED
// for `state replay`; returns how many.
export function strandedWrites(root, { alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } } } = {}) {
  const refs = git(['for-each-ref', '--format=%(refname)', 'refs/p3/pending/'], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean);
  let n = 0;
  for (const r of refs) {
    const pid = Number(r.split('/')[3]);
    if (pid === process.pid || alive(pid)) continue;
    const c = git(['rev-parse', r], { cwd: root });
    git(['update-ref', `${UNPUSHED}${Date.now()}-${pid}-${r.split('/').pop()}-${c.slice(0, 7)}`, c], { cwd: root });
    git(['update-ref', '-d', r], { cwd: root });
    n++;
  }
  return n;
}
const dropPending = (root) => { for (const r of git(['for-each-ref', '--format=%(refname)', PENDING], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean)) git(['update-ref', '-d', r], { cwd: root }); };
// Pushes every pending write, one push per state branch. Refused to the end, or a change refusing
// on origin's tip, its own kept commits move to refs/p3/unpushed/ and the refusal names the replay.
// Returns the writes pushed.
// Bookkeeping (C18, 7 Nov: the account at its push ceiling, BOB's clone 10 of 26 pushes nothing
// but the tool's own records: idle-check rows, starts owed after a merge had pushed, paid after a
// job start): a record the tool keeps for itself never makes a push of its own. It rides the
// command's real write; with none, it waits in the clone (DEFERRED) and rides the next real write
// any p3 process of the clone makes. The clone's own reads see it meanwhile (readStateWith). A
// kind is applied by the function its module registers: fn(dir, payload), payload.path the file.
const appliers = new Map();
export function onBookkeeping(kind, fn) { appliers.set(kind, fn); }
const deferredFile = (root, sb) => join(commonDir(root), `p3-deferred-${sb.replace(/[^\w.-]/g, '_')}.jsonl`);
function deferredOps(root, sb) {
  try { return readFileSync(deferredFile(root, sb), 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { const o = JSON.parse(l); return appliers.has(o.kind) ? [o] : []; } catch { return []; } }); } catch { return []; }
}
// Appended under the lock; an idle-check row an hour old is dropped (a later check measures again),
// so a clone that only reads keeps a short file (cold review of C18).
function deferOps(root, sb, ops) {
  if (!ops.length) return;
  const f = deferredFile(root, sb);
  let old = [];
  try { old = readFileSync(f, 'utf8').split('\n').filter(Boolean); } catch { old = []; }
  const keep = old.filter((l) => { try { const o = JSON.parse(l); return !(o.kind === 'check' && Date.now() - Date.parse(o.payload?.row?.at) > 3600e3); } catch { return false; } });
  writeFileSync(f, [...keep, ...ops.map((o) => JSON.stringify(o))].join('\n') + '\n');
}
// The ops pushed: removed from the file, ops another process added meanwhile kept.
function dropDeferred(root, sb, ops) {
  const done = new Set(ops.map((o) => JSON.stringify(o)));
  try {
    const left = readFileSync(deferredFile(root, sb), 'utf8').split('\n').filter(Boolean).filter((l) => !done.has(l));
    if (left.length) writeFileSync(deferredFile(root, sb), left.join('\n') + '\n'); else rmSync(deferredFile(root, sb), { force: true });
  } catch { /* none */ }
}
// Waiting records pushed by a later write: what waited on them is told, as by a replay.
const pushedBooks = (root, ops) => { for (const o of ops) for (const fn of replayedFns) { try { fn(o.msg, root); } catch { /* a record only */ } } };
const asWrite = (o) => ({ msg: o.msg, change: (dir) => { appliers.get(o.kind)(dir, o.payload); return {}; }, book: o });
export function bookkeep(root, sb, msg, kind, payload) {
  if (!appliers.has(kind)) fail(`bookkeeping ${kind}: no applier registered`);
  const o = { kind, msg, payload };
  if (batch.on) { withStateLock(root, () => { writeStateLocal(root, sb, msg, asWrite(o).change); batch.pending.get(`${root}\0${sb}`).list.at(-1).book = o; }); return; }
  withStateLock(root, () => deferOps(root, sb, [o]));
}
// A state file as the clone knows it: the branch's, with the clone's bookkeeping not yet pushed.
export function readStateWith(root, sb, path) {
  const text = readState(root, sb, path);
  const ops = deferredOps(root, sb).filter((o) => o.payload?.path === path);
  if (!ops.length) return text;
  return withTemp('p3-state-', (tmp) => {
    mkdirSync(dirname(join(tmp, path)), { recursive: true });
    if (text !== null) writeFileSync(join(tmp, path), text);
    for (const o of ops) { try { appliers.get(o.kind)(tmp, o.payload); } catch { /* a record only */ } }
    return existsSync(join(tmp, path)) ? readFileSync(join(tmp, path), 'utf8') : null;
  }, { root });
}
export function flushState({ log = () => {} } = {}) {
  let n = 0;
  const lost = [];
  for (const [key, entry] of [...batch.pending]) {
    batch.pending.delete(key);
    if (!entry.list.length) continue;
    const { root, sb } = entry;
    // Bookkeeping alone: no push; it waits in the clone for a real write (C18).
    if (entry.list.every((x) => x.book)) {
      withStateLock(root, () => {
        deferOps(root, sb, entry.list.map((x) => x.book));
        // The clone's copy of the branch back to origin's as read: the records live in DEFERRED only.
        if (tipOf(root, sb) === entry.tip) git(['update-ref', ...(entry.base ? [ref(sb), entry.base] : ['-d', ref(sb)])], { cwd: root, allowFail: true });
      });
      dropPending(root);
      fetched.delete(key);
      continue;
    }
    // A real write: the clone's waiting bookkeeping rides it, read and dropped under the lock that
    // pushes it, so no other process of the clone pushes or loses the same records (cold review).
    const waiting = [];
    const list = [...entry.list];
    const refused = [];
    const dropped = [];
    const out = new Set(); // the indexes of the writes left out, never kept for a replay
    try {
      withStateLock(root, () => {
        const have = fetchRetry(['fetch', '-q', 'origin', `+refs/heads/${sb}:${ref(sb)}`], { cwd: root });
        if (have.code !== 0 && !/couldn't find remote ref/i.test(have.stderr)) fail(`cannot read origin's ${sb}: ${have.stderr.trim()}`);
        if (have.code !== 0) git(['update-ref', '-d', ref(sb)], { cwd: root, allowFail: true });
        waiting.push(...deferredOps(root, sb));
        list.push(...waiting.map(asWrite));
        withTemp('p3-state-', (tmp) => {
          const wt = join(tmp, 's');
          git(['worktree', 'add', '-q', '--detach', wt, tipOf(root, sb) || emptyStart(root, sb)], { cwd: root });
          // Each pending change made again on the tip met: a superseded one dropped and logged; one that
          // refuses there left out and reported once the others are pushed, never kept.
          const redo = () => { refused.length = 0; dropped.length = 0; out.clear(); for (const [i, x] of list.entries()) { const r = applyOne(wt, x, (l) => { log(l); console.error(l); }); if (r.refused !== undefined) refused.push(`${x.msg}: ${r.refused}`); if (r.dropped !== undefined) dropped.push(x.msg); if (r.o === undefined) out.add(i); } };
          redo();
          pushRetry(wt, sb, { redo, log, wait: stateIO.wait ?? 2000, ...(stateIO.push ? { push: () => stateIO.push(wt, sb) } : {}) });
        }, { root });
        if (waiting.length) dropDeferred(root, sb, waiting);
      });
    } catch (e) {
      const all = git(['for-each-ref', '--format=%(refname)', PENDING], { cwd: root, allowFail: true }).stdout.split('\n').filter(Boolean);
      for (const r of all.filter((x) => out.has(Number(x.split('/').pop())))) git(['update-ref', '-d', r], { cwd: root });
      const kept = all.filter((x) => !out.has(Number(x.split('/').pop())));
      const t = Date.now();
      const names = kept.map((r) => { const name = `${UNPUSHED}${t}-${r.split('/').pop()}`; git(['update-ref', name, r], { cwd: root }); git(['update-ref', '-d', r], { cwd: root }); return name; });
      fetched.delete(key);
      if (e instanceof Fail) fail(`${e.message}. This command's ${kept.length} state write(s) are kept: replay them with \`node .process/tool/p3.mjs state replay\` (${names.join(', ')})`);
      throw e;
    }
    dropPending(root);
    if (waiting.length) pushedBooks(root, waiting);
    n += list.length - refused.length - dropped.length;
    try { fetchState(root, sb, { fresh: true }); } catch { fetched.delete(key); }
    lost.push(...refused);
  }
  if (lost.length) fail(`${lost.length} state write(s) of this command refused on the state branch as it stands now, so not written (the command's other writes are pushed): ${lost.join('; ')}`);
  return n;
}

// park: false (a replay): a push given up leaves the write under the ref it is replayed from, never a
// second one (cold review: a replay's failed push kept each write twice).
function writeStateNow(root, sb, msg, change, { park = true } = {}) {
  const have = fetchState(root, sb, { fresh: true });
  const start = have ? ref(sb) : git(['commit-tree', git(['hash-object', '-t', 'tree', '/dev/null'], { cwd: root }), '-m', `${sb}: the state branch`], { cwd: root });
  return withTemp('p3-state-', (tmp) => {
    const wt = join(tmp, 's');
    git(['worktree', 'add', '-q', '--detach', wt, start], { cwd: root });
    let out;
    // Waiting bookkeeping rides a batched command's flush only, never this unbatched write: a write
    // kept for replay, or one refused on a moved tip, would carry or drop it (cold reviews of C18).
    const make = () => {
      out = change(wt);
      git(['add', '-A'], { cwd: wt });
      git(['commit', '-q', '--allow-empty', '-m', msg], { cwd: wt });
    };
    make();
    // 2s, 4s, 8s, 16s between tries (coordinator, 6 Nov: copy PR 678's publish lost its starts owed to
    // one "fatal error in commit_refs"). Given up, the commit is kept under refs/p3/unpushed/ and the
    // refusal names the command that replays it.
    let tip;
    // Made again on a tip another writer moved: a change that refuses there is dropped and logged,
    // never kept for a replay that would refuse it too.
    let lost = null;
    const again = () => { lost = null; const r = applyOne(wt, { msg, change }); if (r.o !== undefined) out = r.o; if (r.refused !== undefined) lost = r.refused; };
    try { tip = pushRetry(wt, sb, { redo: again, wait: stateIO.wait ?? 2000, ...(stateIO.push ? { push: () => stateIO.push(wt, sb) } : {}) }); } catch (e) {
      if (!(e instanceof Fail)) throw e;
      if (!park) throw e;
      const name = `refs/p3/unpushed/${Date.now()}-${git(['rev-parse', '--short', 'HEAD'], { cwd: wt })}`;
      git(['update-ref', name, 'HEAD'], { cwd: wt });
      fail(`${e.message}. The write is kept: replay it with \`node .process/tool/p3.mjs state replay ${name}\``);
    }
    try { fetchState(root, sb, { fresh: true }); } catch { fetched.delete(`${root}\0${sb}`); } // pushed: a failed read-back is not a failed write
    // Refused on the tip another writer moved to (a reservation that lost: a lane's seat, an
    // address): nothing written, never kept, said plainly.
    if (lost !== null) throw new NotApplied(`${msg}: refused on ${sb} as it stands now (another writer moved it first): ${lost}; nothing was written`);
    return { ...out, tip };
  }, { root });
}

// State writes held in this clone (refs/p3/unpushed/: a push refused to the end, by the GitHub
// budget among others), each { ref, subject }; status and ROOT's sweep print them as an act so they
// never sit unnoticed (R17c, item F).
export function heldWrites(root) {
  const r = git(['for-each-ref', '--format=%(refname)%09%(subject)', 'refs/p3/unpushed/'], { cwd: root, allowFail: true });
  return r.code === 0 ? r.stdout.split('\n').filter(Boolean).map((l) => { const [ref, ...s] = l.split('\t'); return { ref, subject: s.join('\t') }; }) : [];
}
export const heldAct = (held) => `\`node .process/tool/p3.mjs state replay\` (${held.length} state write(s) held in this clone since a refused push: ${held.slice(0, 3).map((h) => h.subject).join('; ')}${held.length > 3 ? '; ...' : ''})`;
