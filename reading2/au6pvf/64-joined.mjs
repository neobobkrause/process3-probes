// ===== file: rounds.test.mjs (continued) =====

  // Round 1's close: the internal walk's 96 failures (one flaw in c), the live arm's 178 (stopped).
  closeRun(root, { inner: 96, live: 178 });
  assert.throws(() => layerOpen(root, 4, { io, log: quiet }), /stopped at walk with 96 finding\(s\) \(the internal walk's; the live arm's 178 hold no round: its internal walk found flaws, PD-16\), 0 recorded: record each as a found mark \(`node \.process\/tool\/p3\.mjs found <module> "<finding>" --from "internal walk p3dev-r 0123456789"`, adding --covers <n>[^)]*owed reopen[^)]*\)[^;]*; the next round opens from them \(BD-R1\); nothing was opened/);
  // found: c's layer (map layer 2) is not open, so the finding is owed to its next reopen, on the
  // state branch; nothing is written in the tree, and no plain pull request is printed.
  const said = [];
  const before = git(['rev-parse', 'origin/tranche'], { cwd: root });
  const r = found(root, 'c', 'the tip overlaps the shell header', { from: 'internal walk p3dev-r 0123456789', covers: '96', log: (l) => said.push(String(l)) });
  assert.equal(r.owed, true);
  assert.equal(r.recorded, true);
  assert.equal(git(['rev-parse', 'origin/tranche'], { cwd: root }), before);
  assert.equal(git(['status', '--porcelain'], { cwd: root }), '', 'nothing written in the checkout');
  assert.match(said.join('\n'), /test\/c\/ids\.test\.mjs pins the ids of req\/c\.md, so a found mark added by a plain pull request turns c's suite red, and its layer is not open, so its reopen job cannot start yet: recorded on process-state as owed to c's next reopen \(rounds\/reopens\/c-[0-9a-f]{12}\.json\)/);
  assert.match(said.join('\n'), /next: record the walk's other findings, then open the layer status --role bob names \(`node \.process\/tool\/p3\.mjs layer open <n>`\)/);
  // Once more: the same file, kept.
  assert.equal(found(root, 'c', 'the tip overlaps the shell header', { from: 'internal walk p3dev-r 0123456789', covers: '96', log: quiet }).recorded, false);
  // Another count for the same finding is the same owe, kept (cold review of C44).
  assert.equal(found(root, 'c', 'the tip overlaps the shell header', { from: 'internal walk p3dev-r 0123456789', covers: '90', log: quiet }).recorded, false);
  assert.equal(owedReopens(root, loadConfig(root)).length, 1);
  const cfg = loadConfig(root);
  const w = findingsOf(root, cfg, 'origin/tranche', { row: 'dev-deploy', slug: 'p3dev-r', commit: '0123456789abcdef', ok: false, walk: { failures: 178 }, internal_walk: { ok: false, failures: 96 } }, { round: true });
  assert.deepEqual([w.failing, w.recorded, w.set_aside], [96, 96, 178]);
  assert.deepEqual([...flawedModules(root, cfg, 'origin/tranche').keys()], ['c']);
  // layer open: the round opens from it.
  const out = [];
  const o = layerOpen(root, 4, { io, log: (l) => out.push(String(l)) });
  assert.equal(o.round, 2);
  assert.match(out.join('\n'), /round 2 · layer 3 \(internal layer 4\) is round 2's one layer over every flawed module \(PD-24\) \(round 2 opens from the walk p3dev-r 0123456789\): 1 flawed module\(s\) \(c O1\)/);
  const items = flowRows(root, SB, 4).open.round.items;
  assert.deepEqual(items.map((x) => [x.id, x.module, x.owe]), [['O1', 'c', r.key]]);
  // layer jobs: c's reopen, the owed finding its task.
  const j = layerJobs(root, 4, { io, log: quiet });
  assert.deepEqual(j.startable.map((x) => x.cmd), ['node .process/tool/p3.mjs job start c --sessions <file> --reopen "O1: the tip overlaps the shell header (internal walk p3dev-r 0123456789, covers 96; owed reopen: add it as your own F mark and admit it in test/c/ids.test.mjs)"']);
  // Held by the open layer: no longer a flaw for a later round, still recorded for its walk.
  assert.deepEqual([...flawedModules(root, loadConfig(root), 'origin/tranche', { layers: layersAt(root, loadConfig(root), 'origin/tranche') }).keys()], []);
  assert.deepEqual([...flawedModules(root, loadConfig(root), 'origin/tranche').keys()], []);
  // With c's layer open, a new finding for c goes to its job now, as before (the job start route).
  assert.throws(() => found(root, 'c', 'another', { from: 'internal walk p3dev-r 0123456789', log: quiet }), /nothing was written\. The route: `node \.process\/tool\/p3\.mjs job start c --sessions <file> --reopen 'another'`/);
  // Offline, with no layer open for it: refused, naming the run without --offline.
  merged(root, 4, 40);
  assert.throws(() => found(root, 'c', 'a third', { from: 'x', offline: true, log: quiet }), /its layer is not open: the finding is recorded on process-state as owed to c's next reopen, which needs origin; nothing was written\. Run it again without --offline/);
  assert.throws(() => found(root, 'c', 'a third', { from: 'x', covers: '0', log: quiet }), /--covers <n>/);
});

test('C44: a run whose internal walk was clean counts its live arm\'s findings; a flawed internal walk sets them aside; covers counts a mark as n', () => {
  const root = product();
  const cfg = loadConfig(root);
  fetchState(root, SB, { fresh: true });
  const row = (inner, live) => ({ row: 'dev-deploy', slug: 'p3dev-r', commit: '0123456789abcdef', ok: !live && !inner, walk: { failures: live }, internal_walk: { ok: !inner, failures: inner } });
  const f = (r) => findingsOf(root, cfg, 'origin/tranche', r, { round: true });
  assert.deepEqual(['failing', 'set_aside'].map((k) => f(row(0, 5))[k]), [5, 0]);
  assert.deepEqual(['failing', 'set_aside'].map((k) => f(row(3, 5))[k]), [3, 5]);
  // Tranche close and release dev (no round option) count every finding of the run, as before.
  assert.deepEqual(['failing', 'set_aside'].map((k) => findingsOf(root, cfg, 'origin/tranche', row(3, 5))[k]), [8, 0]);
  // Stopped at the internal walk (no live arm ran): its own count only, no extra one for the stop.
  assert.equal(f({ ...row(3, 0), ok: false, stopped: 'internal walk' }).failing, 3);
  // Set aside, a live-arm mark records none of the internal walk's findings.
  push(root, mark('c', 1, 'a live finding', 'walk p3dev-r 0123456789, covers 3'));
  assert.equal(f(row(3, 5)).recorded, 0);
  // A round walk (C43, the internal walk alone): only what names the internal walk records it, for
  // every reader (coordinator: as the stopped deploy dev run's internal findings).
  const rw = { row: 'round-walk', slug: 'p3dev-r', commit: '0123456789abcdef', ok: true, internal_walk: { ok: false, failures: 3 } };
  assert.deepEqual([f(rw).failing, f(rw).recorded, findingsOf(root, cfg, 'origin/tranche', rw).recorded], [3, 0, 0]);
  push(root, mark('d', 1, 'one flaw', 'internal walk p3dev-r 0123456789, covers 3'));
  assert.equal(f(row(3, 5)).recorded, 3);
  assert.deepEqual([f(rw).recorded, findingsOf(root, cfg, 'origin/tranche', rw).recorded], [3, 3]);
});

// ===== file: ghshare.mjs (later part) =====

    // R17e (coordinator's C12: 266 fetches an hour, most of them this read): one read serves every
    // check of the clone's p3 processes within READ_S, writes included; past it, or fresh (after a
    // wait), the ledger's tip is asked of GitHub (ls-remote) and fetched only when it moved.
    read: ({ fresh = false } = {}) => {
      if (!fresh) { if (cache && now() - cache.at < READ_S * 1000) return cache; const d = fromDisk(); if (d) return (cache = d); }
      return recheck().c;
    },
    // The account's pause, decided against the record as it stands on the tip written to (a burst
    // of refusals across sessions lengthens one pause; a refusal after it ended stops the tool:
    // pace.mjs nextPause). Returns the pause written.
    pause: (rec, t = now()) => {
      let out = null;
      now1(`github: refused (${rec.why})`, (wt) => {
        mkdirSync(join(wt, 'github'), { recursive: true });
        let was = null;
        try { was = JSON.parse(readFileSync(join(wt, PAUSE_FILE), 'utf8')); } catch { was = null; }
        out = nextPause(was, rec, t);
        writeFileSync(join(wt, PAUSE_FILE), JSON.stringify(out, null, 2) + '\n');
        return {};
      });
      cache = null;
      try { writeFileSync(diskCache, 'null'); } catch { /* none */ }
      return out;
    },
    resume: (by) => {
      now1(`github: resumed by ${by}`, (wt) => {
        if (existsSync(join(wt, PAUSE_FILE))) rmSync(join(wt, PAUSE_FILE));
        mkdirSync(join(wt, 'github'), { recursive: true });
        appendFileSync(join(wt, RESUMED_FILE), JSON.stringify({ at: new Date(now()).toISOString(), by }) + '\n');
        return {};
      });
      cache = null;
      try { writeFileSync(diskCache, 'null'); } catch { /* none */ }
    },
    // The hook's background refresh (R17d): the ledger's tip asked of GitHub (ls-remote, no fetch);
    // unmoved, the disk cache is current again as it stands, a stop included; moved, fetched and
    // read again. Returns what it did.
    refresh: () => recheck().how,
    // The command's own state writes pushed before it waits on GitHub (others read them meanwhile).
    beforeWait: () => { if (pendingWrites()) flushState(); },
    // While a command runs (each reserve): riding its pending writes, else by shareUsage's rule; never inside a state write.
    share: () => (stateLockHeld(root) ? 0 : shareUsage(root, cfg, { now, store, pending: led.own ? pendingWrites() : 0, ledgerRepo })),
    // At a command's end: with its own state push when it has one (pending), else by shareUsage's rule.
    shareNow: ({ pending = 0 } = {}) => (stateLockHeld(root) ? 0 : shareUsage(root, cfg, { now, store, pending: led.own ? pending : 0, atEnd: true, ledgerRepo })),
  };
}

// This clone's usage since it last shared, appended to its session's file in the ledger (R17e,
// coordinator's C9: bookkeeping is never the dominant traffic, so a share is never a push of its own
// but rides one):
// - with the command's own state push on the product's own state branch (pending writes: writeState
//   coalesces it), whenever there is new use;
// - else at most every SHARE_ALONE_S (or share_s if longer), and only when others must count what
//   it carries: a content-creating call, or a push other than a state branch's (the ledger branch's
//   own pushes are counted from its history, statePushes).
// Rows older than two hours are dropped from the file.
export const SHARE_ALONE_S = 900;
// A share kept by a refused flush and pushed later by `state replay` is settled then (cold review
// of R17e: left pending, its rows counted from this clone's log and again from the ledger).
export const SHARE_SUBJECT = /^github: \d+ minute\(s\) of use \(rows to (\d+)\)/;
onReplayed((subject, root) => { const m = String(subject).match(SHARE_SUBJECT); if (m) settleShare(root, Number(m[1]), Date.now()); });
export function shareUsage(root, cfg, { force = false, now = Date.now, pending = 0, store, atEnd = false, ledgerRepo = null } = {}) {

// To be kept by any job that works from this text: every file the job writes begins with this exact
// first line: `# ref C6Q-4824`.

  const shares = sharesOf(root);
  const after = lastShared(root);
  // The rows shared are those after the last share's last row, taken before the write: the
  // share's own push, logged during it, is shared next time (cold review of R17b).
  const log = readLog(root).filter((r) => Date.parse(r.at) > after && ['gh', 'push', 'fetch'].includes(r.kind));
  const rows = usageRows(root, { after, rows: log });
  if (!rows.length) return 0;
  if (!force) {
    // Riding the command's push: at its end, and at most once a minute while it runs (each share
    // during a command is a commit, though no push).
    // When the last share was made (a riding one's push may not be made yet: cold review of R17e).
    const lastAt = Math.max(0, ...shares.map((x) => x.made ?? (x.at === PENDING_AT ? 0 : x.at || 0)));
    if (now() - lastAt < (pending ? (atEnd ? 0 : 60) : Math.max(SHARE_ALONE_S, pacing().share_s)) * 1000) return 0;
    if (!pending && !log.some((r) => (r.kind === 'gh' && Number(r.content === true ? 1 : r.content) > 0) || (r.kind === 'push' && !(r.state && ledgerRepo && r.repo === ledgerRepo)))) return 0;
