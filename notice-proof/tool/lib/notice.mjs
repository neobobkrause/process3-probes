// The notice: given the product before and after a change to one module, who is told and why.
import fs from 'node:fs';
import path from 'node:path';
import { loadTree } from './model.mjs';
import { makeProgram, TS_VERSION } from './ts.mjs';
import { makeLister } from './listing.mjs';
import { makeUsage } from './usage.mjs';
import { same, standsIn, render } from './canon.mjs';
import { commentsOnly, boundTests } from './check.mjs';

/** Reads a whole product once: every module's listing and every module's uses. */
export function analyse(root) {
  const tree = loadTree(root);
  const program = makeProgram(tree.allFiles);
  const lister = makeLister(program, tree);
  const listings = new Map(tree.modules.map((m) => [m.id, lister.list(m)]));
  const usage = makeUsage(program, tree, listings);
  const uses = new Map(tree.modules.map((m) => [m.id, usage.usesOf(m)]));
  return { tree, listings, uses };
}

/** Telling changes: those that tell the users of the entry. */
const TELLS = new Set(['removed', 'cannot stand in', 'hands back differently', 'bound changed']);

/** Rewrites handle names in a canonical form, for kinds renamed with their shape unchanged. */
function renameHandles(c, map) {
  if (!map.size) return c;
  return JSON.parse(JSON.stringify(c), (k, v) => (v && v.k === 'handle' && map.has(v.name) ? { ...v, name: map.get(v.name) } : v));
}

/** Compares two listings of one module, entry by entry. */
export function diffListings(moduleId, before, after) {
  const b = before.entries, a = after.entries;
  const out = [];
  // Kinds renamed with their shape unchanged: one kind gone, one new, the same shape.
  const gone = Object.keys(b).filter((n) => !(n in a));
  const fresh = Object.keys(a).filter((n) => !(n in b));
  const renamed = new Map(); // old name -> new name
  const handleMap = new Map();
  for (const g of gone) {
    const eb = b[g];
    if (!['kind', 'handle kind'].includes(eb.kind)) continue;
    const match = fresh.find((f) => a[f].kind === eb.kind && !renamed.has(f) && [...renamed.values()].indexOf(f) < 0 &&
      (eb.kind === 'kind' ? same(eb.accepts ?? eb.handsBack, a[f].accepts ?? a[f].handsBack) : same(eb.handsBack, a[f].handsBack)));
    if (match) { renamed.set(g, match); if (eb.kind === 'handle kind') handleMap.set(`${moduleId}.${g}`, `${moduleId}.${match}`); }
  }
  const renamedTo = new Set(renamed.values());
  const memberOfRenamed = (n) => [...renamed.entries()].find(([o]) => n.startsWith(o + '.'));
  for (const name of [...new Set([...Object.keys(b), ...Object.keys(a)])].sort()) {
    const eb = b[name], ea = a[name];
    if (renamed.has(name)) {
      out.push({ entry: name, changes: ['kind renamed, shape unchanged'], to: renamed.get(name), tells: 'users that name it' });
      continue;
    }
    if (renamedTo.has(name)) continue;
    if (!ea) {
      const m = memberOfRenamed(name);
      if (m && a[`${m[1]}${name.slice(m[0].length)}`]) continue; // a member of a renamed handle: follows its kind
      out.push({ entry: name, changes: ['removed'], before: describe(eb), tells: 'users' });
      continue;
    }
    if (!eb) {
      const r = [...renamed.entries()].find(([, n]) => name.startsWith(n + '.'));
      if (r && b[`${r[0]}${name.slice(r[1].length)}`]) continue;
      out.push({ entry: name, changes: ['new entry'], after: describe(ea), tells: 'nobody' });
      continue;
    }
    if (eb.handsBack?.k === 'names' && ea.handsBack?.k === 'names') {
      const lost = eb.handsBack.names.filter((n) => !ea.handsBack.names.includes(n));
      const gained = ea.handsBack.names.filter((n) => !eb.handsBack.names.includes(n));
      if (lost.length || gained.length) {
        out.push({ entry: name, changes: [lost.length ? 'removed' : 'new entry'], lost, gained, tells: lost.length ? 'users' : 'nobody', before: describe(eb), after: describe(ea) });
      }
      continue;
    }
    const changes = [];
    const ba = renameHandles(eb.accepts, handleMap), bh = renameHandles(eb.handsBack, handleMap);
    if (!same(ba, ea.accepts)) changes.push(standsIn(ba, ea.accepts) ? 'accepts more' : 'cannot stand in');
    if (!same(bh, ea.handsBack)) changes.push('hands back differently');
    if (!same(eb.bounds, ea.bounds)) changes.push('bound changed');
    // Iteration 2: the kinds of error raised, and a message's channel, are part of what is handed back.
    if ((!same(eb.throws ?? [], ea.throws ?? []) || (eb.channel ?? '') !== (ea.channel ?? '')) && !changes.includes('hands back differently')) changes.push('hands back differently');
    // Iteration 3 (rule 12): a member that may now be missing hands back differently.
    if (ea.optional && !eb.optional && !changes.includes('hands back differently')) changes.push('hands back differently');
    if (!changes.length) continue;
    out.push({
      entry: name,
      changes,
      tells: changes.some((c) => TELLS.has(c)) ? 'users' : 'nobody',
      before: describe(eb),
      after: describe(ea),
    });
  }
  return out;
}

export function describe(e) {
  if (!e) return null;
  const d = { kind: e.kind };
  if (e.accepts !== undefined && e.accepts !== null) d.accepts = render(e.accepts);
  if (e.handsBack !== undefined && e.handsBack !== null) d.handsBack = render(e.handsBack);
  if (e.bounds?.length) d.bounds = e.bounds;
  if (e.side) d.side = e.side;
  if (e.throws?.length) d.throws = e.throws;
  if (e.channel) d.channel = e.channel;
  if (e.optional) d.optional = true;
  return d;
}

function filesDiffer(beforeTree, afterTree, mod) {
  const rel = (m, t) => m.files.map((f) => path.relative(t.root, f)).sort();
  const mb = beforeTree.byId.get(mod), ma = afterTree.byId.get(mod);
  if (!mb || !ma) return true;
  const fb = rel(mb, beforeTree), fa = rel(ma, afterTree);
  if (JSON.stringify(fb) !== JSON.stringify(fa)) return true;
  return fb.some((f) => fs.readFileSync(path.join(beforeTree.root, f), 'utf8') !== fs.readFileSync(path.join(afterTree.root, f), 'utf8'));
}

/**
 * The notice for one change.
 * @param beforeRoot product folder before the change
 * @param afterRoot product folder after it
 * @param provider the module that changed
 */
export function notice(beforeRoot, afterRoot, provider) {
  const B = analyse(beforeRoot), A = analyse(afterRoot);
  const order = A.tree.modules.map((m) => m.id);
  const pIndex = order.indexOf(provider);
  if (pIndex < 0) throw new Error(`no such module: ${provider}`);
  const report = { provider, reader: `TypeScript ${TS_VERSION}`, firstCommentsStep: false, changedModules: [], entries: [], told: [], notTold: [], warnings: [] };

  // Modules whose files changed: should be the provider alone.
  for (const id of order) if (filesDiffer(B.tree, A.tree, id) && id !== provider) report.warnings.push(`files of ${id} changed too; only ${provider} was named as changed`);

  // The first job on a module without interface comments: a comments-only step sends no notice.
  const lb = B.listings.get(provider);
  if (lb && !lb.hasInterfaceComments) {
    const co = commentsOnly(B.tree, A.tree, provider);
    if (co.same) {
      report.firstCommentsStep = true;
      report.summary = `${provider} had no interface comments; this change only adds comments (running code unchanged in ${co.files.length} file(s)). No notice; the listing after it is the "before" for the job's real change.`;
      return report;
    }
  }

  // Every module from the provider on: its listing before and after. Those after the provider whose own files did
  // not change but whose listing did are changed "through" it: they pass on a kind of the provider.
  const changed = new Map(); // module -> diff
  for (let i = pIndex; i < order.length; i++) {
    const id = order[i];
    const before = B.listings.get(id), after = A.listings.get(id);
    if (!before || !after) continue;
    const d = diffListings(id, before, after);
    if (d.length) {
      changed.set(id, d);
      report.changedModules.push({ module: id, through: id === provider ? null : provider });
      for (const e of d) report.entries.push({ module: id, ...e });
    }
  }
  // Iteration 2: a test named for a bound whose code changed while its bound line did not: that bound counts as
  // changed, in every entry (of any module) that carries the line.
  const btB = boundTests(B.tree.byId.get(provider)), btA = boundTests(A.tree.byId.get(provider));
  const movedBounds = [...btB.keys()].filter((k) => btA.has(k) && btA.get(k).shape !== btB.get(k).shape);
  if (movedBounds.length) {
    report.boundTestsChanged = movedBounds;
    for (const id of order.slice(pIndex)) {
      const la = A.listings.get(id), lb = B.listings.get(id);
      for (const [name, e] of Object.entries(la.entries)) {
        if (!lb.entries[name] || !movedBounds.some((m) => (e.bounds ?? []).includes(m))) continue;
        if (!changed.has(id)) { changed.set(id, []); report.changedModules.push({ module: id, through: id === provider ? null : provider }); }
        const d = changed.get(id);
        let x = d.find((y) => y.entry === name);
        if (!x) { x = { entry: name, changes: [], tells: 'users', before: describe(lb.entries[name]), after: describe(e) }; d.push(x); report.entries.push({ module: id, ...x }); }
        if (!x.changes.includes('bound test changed')) { x.changes.push('bound test changed'); x.tells = 'users'; }
        const r = report.entries.find((y) => y.module === id && y.entry === name);
        if (r && r !== x) { r.changes = x.changes; r.tells = 'users'; }
      }
    }
  }
  // Iteration 2: a new operation whose name another module already answers tells the users of that operation.
  for (const [id, diff] of [...changed]) {
    for (const e of diff) {
      if (!e.entry.startsWith('op:') || !e.changes.includes('new entry')) continue;
      for (const [other, l] of A.listings) {
        if (other === id || !l.entries[e.entry]) continue;
        if (!changed.has(other)) { changed.set(other, []); report.changedModules.push({ module: other, through: provider }); }
        const x = { entry: e.entry, changes: [`${id} now answers the same name`], tells: 'users', before: describe(B.listings.get(other)?.entries[e.entry]), after: describe(l.entries[e.entry]) };
        changed.get(other).push(x);
        report.entries.push({ module: other, ...x });
      }
    }
  }
  report.interfaceChanged = changed.has(provider);

  // Who is told.
  for (let i = pIndex + 1; i < order.length; i++) {
    const user = order[i];
    const mod = A.tree.byId.get(user);
    const ub = B.uses.get(user), ua = A.uses.get(user);
    const reasons = [];
    for (const [m, diff] of changed) {
      if (A.tree.byId.get(m).index >= mod.index) continue;
      const declared = mod.uses.includes(m);
      const useB = ub?.uses.get(m), useA = ua?.uses.get(m);
      // Uses are read from the user's code as it stood before the change (its code does not change in this step);
      // uses found against the provider after the change are added, so a by-name call to a new name is seen too.
      const useOf = (entry) => useB?.get(entry) ?? useA?.get(entry);
      for (const e of diff) {
        const u = useOf(e.entry);
        if (!u) continue;
        if (e.tells === 'nobody') {
          // Iteration 2: a function handed on as a value is used with whatever it accepts: accepting more tells.
          if (u.asValue && e.changes.includes('accepts more')) reasons.push({ module: m, entry: e.entry, changes: [...e.changes, 'handed on as a value'], lines: u.lines.slice(0, 6), through: m === provider ? null : provider });
          continue;
        }
        if (e.tells === 'users that name it' && !u.named) continue;
        reasons.push({ module: m, entry: e.entry, changes: e.changes, lines: u.lines.slice(0, 6), through: m === provider ? null : provider });
      }
      // A user the tool cannot follow fully counts as using everything of that provider.
      if (declared) {
        const why = [];
        if (!useB?.size && !useA?.size) why.push(`declares ${m} but no use of it is found in its code`);
        if (ub?.anything.length) why.push(`reads or calls values of unknown kind: ${ub.anything.slice(0, 3).join('; ')}${ub.anything.length > 3 ? ` (+${ub.anything.length - 3})` : ''}`);
        if (ub?.unreadOps.length && Object.keys(A.listings.get(m).entries).some((n) => n.startsWith('op:'))) why.push(`calls by a name the tool cannot read at ${ub.unreadOps.join(', ')}`);
        if (ub?.unreadTables.length && Object.keys(A.listings.get(m).entries).some((n) => n.startsWith('table:'))) why.push(`names a table the tool cannot read at ${ub.unreadTables.join(', ')}`);
        if (why.length) reasons.push({ module: m, notFollowed: why, through: m === provider ? null : provider });
      }
    }
    if (reasons.length) report.told.push({ user, reasons, undeclared: (ub?.undeclared ?? []).filter((p) => changed.has(p)) });
    else if (mod.uses.some((u) => changed.has(u)) || [...changed.keys()].some((m) => ub?.uses.has(m))) report.notTold.push({ user, why: 'uses none of the entries that changed in a way that tells' });
  }
  const tellingEntries = report.entries.filter((e) => e.tells !== 'nobody');
  report.summary = !report.interfaceChanged && !changed.size
    ? 'The listing before and after is the same. Nobody is told.'
    : `${changed.size} module(s) changed their listing; ${tellingEntries.length} entr${tellingEntries.length === 1 ? 'y' : 'ies'} changed in a way that tells; ${report.told.length} user(s) told.`;
  return report;
}

/** Writes a notice for people. */
export function noticeText(r) {
  const L = [`Notice for a change to ${r.provider} (${r.reader})`, r.summary];
  for (const w of r.warnings) L.push(`WARNING: ${w}`);
  if (r.firstCommentsStep) return L.join('\n');
  for (const e of r.entries) {
    L.push(`  ${e.module} ${e.entry}: ${e.changes.join(', ')}${e.to ? ` (now ${e.to})` : ''} -> tells ${e.tells}`);
    if (e.before?.accepts !== e.after?.accepts && (e.before?.accepts || e.after?.accepts)) L.push(`      accepts before: ${e.before?.accepts ?? '-'}\n      accepts after:  ${e.after?.accepts ?? '-'}`);
    if (e.before?.handsBack !== e.after?.handsBack && (e.before?.handsBack || e.after?.handsBack)) L.push(`      hands back before: ${e.before?.handsBack ?? '-'}\n      hands back after:  ${e.after?.handsBack ?? '-'}`);
    if (JSON.stringify(e.before?.bounds) !== JSON.stringify(e.after?.bounds) && e.changes.includes('bound changed')) L.push(`      bounds before: ${JSON.stringify(e.before?.bounds ?? [])}\n      bounds after:  ${JSON.stringify(e.after?.bounds ?? [])}`);
  }
  for (const t of r.told) {
    L.push(`  TOLD ${t.user}`);
    for (const x of t.reasons) {
      if (x.notFollowed) L.push(`      not followed fully for ${x.module}: ${x.notFollowed.join('; ')}`);
      else L.push(`      uses ${x.module} ${x.entry} (${x.changes.join(', ')})${x.through ? ` [${x.module} changed through ${x.through}]` : ''} at ${x.lines.join(', ')}`);
    }
    if (t.undeclared.length) L.push(`      note: uses ${t.undeclared.join(', ')} without declaring it`);
  }
  for (const n of r.notTold) L.push(`  not told: ${n.user} (${n.why})`);
  return L.join('\n');
}
