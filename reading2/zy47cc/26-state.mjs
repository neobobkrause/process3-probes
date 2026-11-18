
// For the tests: a stand-in for the state push.
export const stateIO = { push: null, wait: null };

// The kept commit c's change made on the worktree's tip: a file it appended to gets the same lines
// appended (unless the tip holds them already), a file it added is added (the same bytes there
// already: nothing), a file it removed is removed; anything else is picked with git's three-way
// merge (the coordinator, 6 Nov: a kept append to a jsonl another writer had appended to since
// "does not apply" under a plain cherry-pick).
// The state branch's line logs, declared once (the coordinator, 7 Nov: a kept github/use share
// refused at replay, "changed there in a way its change cannot be merged into", where only metrics/
// was re-appended): files of whole rows, each with its time (at, or minute), that no reader counts
// an id from or reserves by; a reader that takes the last row takes the newest, so a kept write's
// rows are merged into whatever another writer appended since in time order (cold review: appended
// at the end, an older deploy or tranche-open row read as the latest). Any other file
// (STATE_ORDERED) goes through git's three-way merge, which refuses when another writer appended too.
export const STATE_LOGS = [
  { match: (f) => /^metrics\/[^/]+\.jsonl$/.test(f), why: 'measurement rows (sweeps, refusals, wakes, restarts, tranche opens), each read as a set or by its newest time' },
  { match: (f) => /^github\/use\/[^/]+\.jsonl$/.test(f), why: "a session's minutes of GitHub use, read as a set by minute; a refused share is marked pending, never sent again, so shares never overlap" },
  { match: (f) => f === 'deploys/dev.jsonl', why: 'development deploy records, the newest by time last' },
  { match: (f) => f === 'deploys/release.jsonl', why: 'release walks (BD-R1), the newest per version by time last' },
];
// The jsonl files the state branch holds that are not line logs, each with why (state-logs.test holds
// every jsonl the tool writes to one list or the other).
export const STATE_ORDERED = {
  'holds/holds.jsonl': "a hold's id (hold-<n>) is counted from the file",
  'messages/': "a message's number (n:k) is counted from the file",
  'lanes/asks.jsonl': "a lane's ask is numbered from the file",
  'lanes/sessions.jsonl': "a lane's seat is reserved by its rows, in order",
  'lanes/artifacts.jsonl': 'a drop after a record: read in order',
  'github/resumed.jsonl': 'its last line is the resume',
  'releases/dev.jsonl': 'a run is recorded once (a reservation)',
  'layers/closed.jsonl': 'a layer is closed once',
  'tranches/closed.jsonl': 'a tranche is closed once',
  'branches/prune.jsonl': 'a prune run is recorded once, read in order',
  'merger/wakes.jsonl': 'read in order',
};
export const stateLog = (f) => STATE_LOGS.some((x) => x.match(f));
// A line log made again on a newer tip: the rows the kept commit added (after less before, counted, so
// a row repeated on purpose is kept) less those the tip added since (counted), merged with the tip's rows by their
// time, stably; when a row has no time, the kept rows after the tip's (as metrics/ was before).
const lines = (t) => t.split('\n').filter(Boolean);
const less = (a, b) => { const n = new Map(); for (const l of b) n.set(l, (n.get(l) || 0) + 1); return a.filter((l) => { const k = n.get(l) || 0; if (k) { n.set(l, k - 1); return false; } return true; }); };
const timeOf = (l) => { try { const r = JSON.parse(l); const t = Date.parse(r?.at ?? r?.minute); return Number.isFinite(t) ? t : null; } catch { return null; } };
export function logUnion(tip, before, after) {
  const have = lines(tip);
  // What the kept commit added, less what the tip added since the same base (a replay already made).
  const add = less(less(lines(after), lines(before)), less(have, lines(before)));
  if (!add.length) return tip;
  const all = [...have.map((l, i) => ({ l, i, t: timeOf(l) })), ...add.map((l, j) => ({ l, i: have.length + j, t: timeOf(l) }))];
  if (all.some((x) => x.t === null)) return `${[...have, ...add].join('\n')}\n`;
  return `${all.sort((a, b) => a.t - b.t || a.i - b.i).map((x) => x.l).join('\n')}\n`;
}
function reapply(root, wt, c, r, sb) {
  const parent = git(['rev-parse', '-q', '--verify', `${c}^`], { cwd: root, allowFail: true }).stdout.trim() || null;
  const raw = (rev, f) => { const x = git(['cat-file', 'blob', `${rev}:${f}`], { cwd: root, allowFail: true }); return x.code === 0 ? x.stdout : null; };
  const files = git(['diff-tree', '--no-commit-id', '--name-status', '-r', '--root', '-z', c], { cwd: root }).split('\0').filter(Boolean);
  const other = [];
  for (let i = 0; i < files.length; i += 2) {
    const [st, f] = [files[i], files[i + 1]];
    const p = join(wt, f);
    const now = existsSync(p) ? readFileSync(p, 'utf8') : null;
    const before = parent ? raw(parent, f) : null;
    const after = raw(c, f);
    if (st === 'D') { if (now === null) continue; if (now === before) rmSync(p, { force: true }); else other.push(f); continue; }
    // A line log (stateLog): each line the kept commit added that the tip lacks, appended; what it
    // took away was its writer's trim (github/use keeps its last 2 h), never replayed.
    if (stateLog(f)) {
      const merged = logUnion(now ?? '', before ?? '', after ?? '');
      if (merged !== (now ?? '')) put(wt, f, merged);
      continue;
    }
    if (before === null) {
      if (now === null) put(wt, f, after);
      else if (now !== after) other.push(f);
      continue;
    }
    if (now === after) continue;
    // Any other change: git's three-way merge of this file (the kept commit's parent as the base).
    const m = withTemp('p3-state-', (tmp) => {
      const [o, b, t] = ['ours', 'base', 'theirs'].map((k) => join(tmp, k));
      writeFileSync(o, now ?? ''); writeFileSync(b, before); writeFileSync(t, after);
      const x = git(['merge-file', '-p', o, b, t], { cwd: root, allowFail: true });
      return x.code === 0 ? x.stdout : null;
    }, { root });
    if (m === null) other.push(f);
    else put(wt, f, m);
  }
  if (other.length) throw new NotApplied(`${r} does not apply to ${sb} as it stands now (${other.join(', ')} changed there in a way its change cannot be merged into); it is kept`);
}

// p3 state replay [<ref>...]: each kept write (refs/p3/unpushed/*, all when none is named) made again
// on the state branch's fresh tip (its own commit picked onto it) and pushed; its ref then dropped.
// fn(subject, root) after each kept write replay pushes (R17e: a usage share it carried is settled).
const replayedFns = [];
// A layer-flow event row: layerflow/<n>/<kind>/<name>.json (layerbase.mjs flowFile).
const EVENT_ROW = /^layerflow\/\d+\/[^/]+\/[^/]+\.json$/;
export function onReplayed(fn) { if (!replayedFns.includes(fn)) replayedFns.push(fn); }
// Each ref on its own, never a queue (the coordinator, 7 Nov: on the copy an old kept pacing write
// that no longer applied stopped the replay, and `layer merge 9`'s two newer kept writes never
// replayed): one that does not apply is said and stays kept, the rest replay, and the command then
// fails naming only the ones kept.
export function stateReplay(root, sb, refs = [], { log = console.log } = {}) {
  const all = refs.length ? refs : git(['for-each-ref', '--format=%(refname)', 'refs/p3/unpushed/'], { cwd: root }).split('\n').filter(Boolean);
  if (!all.length) { log('no kept state writes to replay'); return []; }
  const done = [];
  const kept = [];

// Kept by every job without exception: the job's handover note names its reviewer on a line of its
// own, exactly: `reviewer: Jacinta Ravensworth`.

  // A command's kept writes share a time prefix (<ms>-<n>), each made on the one before: one that does
  // not apply keeps the later ones of its command with it, never landing them without it (cold review).
  const cmd = (r) => r.split('/').pop().split('-')[0];
  const held = new Set();
  const keptLine = () => (kept.length ? `${kept.length} kept state write(s) did not replay and stay kept: ${kept.map((k) => `${k.r}: ${k.why}`).join('; ')}` : '');
  const summary = () => `${keptLine()}${done.length ? ` (the other ${done.length} replayed)` : ''}`;
  for (const [i, r] of all.entries()) {
    if (held.has(cmd(r))) { const why = `kept with its command's earlier write, which does not apply`; log(`kept ${r}: ${why}`); kept.push({ r, why }); continue; }
    // Any failure but a write that does not apply (a push refused to the end, the pacing stop, a lock,
    // a fetch): the replay stops there, every ref from there on left as it was (cold review: carried on,
    // each later push failed too, and each failed write was kept twice).
    const stop = (e) => fail([`the replay stopped at ${r}, which stays kept: ${e.message}`, all.length - i - 1 ? `${all.length - i - 1} later ref(s) not tried, kept` : '', done.length ? `${done.length} replayed before it` : '', keptLine()].filter(Boolean).join('. '));
    try {
      const c = git(['rev-parse', '-q', '--verify', `${r}^{commit}`], { cwd: root, allowFail: true }).stdout.trim() || fail(`no kept write ${r}`);
      const msg = git(['log', '-1', '--format=%s', c], { cwd: root });
      // A kept write a rerun has since made itself (cold review of R17d: layer sync's rerun records
      // the sync row its refused push held): it only adds files, and each is on the tip already with
      // the same content, or is a layer-flow event row (one file per event: the same path is the same
      // event, recorded again with its own time). It is dropped, said, never picked into a conflict
      // that holds it forever. An append-only file (messages, usage, metrics) another write created
      // since is never this: its content differs, and it is picked as before (cold review).
      const changes = git(['diff-tree', '--no-commit-id', '-r', '--name-status', '--root', c], { cwd: root }).split('\n').filter(Boolean).map((l) => l.split('\t'));
      const have = fetchState(root, sb, { fresh: true });
      const blob = (rev, p) => git(['rev-parse', '-q', '--verify', `${rev}:${p}`], { cwd: root, allowFail: true }).stdout.trim() || null;
      const same = ([st, p]) => { if (st !== 'A') return false; const t = blob(ref(sb), p); return !!t && (t === blob(c, p) || EVENT_ROW.test(p)); };
      if (have && changes.length && changes.every(same)) {
        git(['update-ref', '-d', r], { cwd: root });
        log(`dropped ${r} (${msg}): ${changes.map(([, p]) => p).join(', ')} on ${sb} already, written by a rerun`);
        for (const fn of replayedFns) { try { fn(msg, root); } catch { /* a record only */ } }
        done.push(r);
        continue;
      }
      // The kept commit's own change, as a function of the fresh worktree: picked onto it.
      // Pushed at once, never coalesced: the kept ref goes only once its write is on origin.
      // An idle check's row is a measurement of its window: a kept one is stale once another check
      // has run, so it is dropped, never replayed (the next check measures again).
      if (/^idle check: /.test(msg)) {
        git(['update-ref', '-d', r], { cwd: root });
        log(`dropped ${r} (${msg}): an idle check's row is stale once kept; the next check measures again`);
        done.push(r);
        continue;
      }
      // Batching off for this write only, restored whatever it meets (the idle check above no longer
      // leaves it off).
      const was = batch.on;
      batch.on = false;
      try { writeState(root, sb, msg, (wt) => { reapply(root, wt, c, r, sb); return {}; }, { park: false }); } catch (e) {
        if (!(e instanceof NotApplied)) throw e;
        log(`kept ${r} (${msg}): ${e.message}`);
        kept.push({ r, why: e.message });
        held.add(cmd(r));
        continue;
      } finally { batch.on = was; }
      git(['update-ref', '-d', r], { cwd: root });
      log(`replayed ${r} (${msg})`);
      for (const fn of replayedFns) { try { fn(msg, root); } catch { /* a record only */ } }
      done.push(r);
    } catch (e) { if (e instanceof Fail) stop(e); throw e; }
  }
  if (kept.length) fail(summary());
  return done;
}

