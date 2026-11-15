#!/usr/bin/env node
// The audit: the tool checked against evidence it does not control (notes/learning-loop.md).
//   node tool/audit.mjs <product before> <product after> <module that changed> [--case <file.json>]
// After a provider's change it runs the tests of every later module before and after (the shadow run), compares
// them with the notice, and counts what the tool does not understand. It writes a case file that can be added to
// the corpus the tool is tested against. It decides nothing.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadTree } from './lib/model.mjs';
import { notice, analyse } from './lib/notice.mjs';
import { check } from './lib/check.mjs';

/** Complaints of the reader met in this proof and classified (refused, or "cannot tell"). Others are unknown. */
const KNOWN_CODES = new Set([2305, 2322, 2339, 2345, 2353, 2532, 2533, 2554, 2724, 2741, 7053, 18047, 18048, 18049, 'rows', 'message', 'bound']);

function testsPass(dir) {
  dir = path.resolve(dir);
  const t = path.join(dir, 'test');
  const files = fs.existsSync(t) ? fs.readdirSync(t).filter((f) => f.endsWith('.test.mjs')).map((f) => path.join(t, f)) : [];
  if (!files.length) return { pass: true, ran: false };
  try { execFileSync(process.execPath, ['--test', ...files], { cwd: dir, stdio: 'pipe', timeout: 120000 }); return { pass: true, ran: true }; }
  catch (e) { return { pass: false, ran: true, failed: [...String(e.stdout).matchAll(/^not ok \d+ - (.*)$/gm)].map((m) => m[1]).filter((n) => !n.endsWith('.test.mjs')) }; }
}

export function audit(beforeRoot, afterRoot, provider) {
  const n = notice(beforeRoot, afterRoot, provider);
  const A = loadTree(afterRoot), B = loadTree(beforeRoot);
  const order = A.modules.map((m) => m.id);
  const later = order.slice(order.indexOf(provider) + 1);
  const told = new Set(n.told.map((t) => t.user));
  const shadow = {};
  for (const m of later) shadow[m] = { before: testsPass(path.join(beforeRoot, m)).pass, after: testsPass(path.join(afterRoot, m)) };
  const providerCheck = check(A, provider);
  // What the tool does not understand, after the change, per later module and for the provider.
  const { uses } = analyse(afterRoot);
  const understanding = {};
  for (const m of [provider, ...later]) {
    const u = uses.get(m);
    const c = check(A, m);
    understanding[m] = {
      valuesOfUnknownKind: u?.anything.length ?? 0,
      unreadOperationNames: u?.unreadOps.length ?? 0,
      unreadTableNames: u?.unreadTables.length ?? 0,
      cannotTell: c.cannotTell.length,
      unknownComplaints: c.refusals.filter((x) => !KNOWN_CODES.has(x.code)).map((x) => `${x.at} ${x.code}: ${x.text.slice(0, 120)}`),
    };
  }
  const possibleHoles = later.filter((m) => shadow[m].before && !shadow[m].after.pass && !told.has(m));
  return {
    provider,
    when: new Date().toISOString(),
    notice: { summary: n.summary, told: [...told], entries: n.entries.map((e) => ({ module: e.module, entry: e.entry, changes: e.changes })) },
    shadow,
    providerRefusals: providerCheck.refusals.map((x) => `${x.at} ${x.kind}: ${x.text}`),
    findings: {
      possibleHoles: possibleHoles.map((m) => ({ module: m, failedTests: shadow[m].after.failed, toTriage: 'is the module\'s own code wrong (a hole), or does it fail only through a told module?' })),
      toldTestsPass: [...told].filter((m) => shadow[m]?.after.pass).map((m) => ({ module: m, toConfirm: 'a notice for nothing if its job ends with no change' })),
      notFollowed: n.told.filter((t) => t.reasons.some((r) => r.notFollowed)).map((t) => t.user),
    },
    understanding,
    stillUnknown: Object.entries(understanding).filter(([, u]) => u.unknownComplaints.length).map(([m]) => m),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--case');
  const out = i >= 0 ? args.splice(i, 2)[1] : null;
  const r = audit(args[0], args[1], args[2]);
  if (out) fs.writeFileSync(out, JSON.stringify(r, null, 2) + '\n');
  const f = r.findings;
  console.log(`Audit of a change to ${r.provider}: told ${r.notice.told.join(', ') || 'nobody'}`);
  console.log(`  possible holes (tests newly fail, not told): ${f.possibleHoles.map((h) => h.module).join(', ') || 'none'}`);
  console.log(`  told, tests still pass (confirm when the job ends): ${f.toldTestsPass.map((h) => h.module).join(', ') || 'none'}`);
  console.log(`  provider's own check: ${r.providerRefusals.length ? r.providerRefusals.length + ' refusal(s)' : 'passes'}`);
  console.log(`  not understood: ${Object.entries(r.understanding).map(([m, u]) => `${m} ${u.valuesOfUnknownKind}/${u.unreadOperationNames + u.unreadTableNames}/${u.cannotTell}/${u.unknownComplaints.length}`).join('  ')}  (values of unknown kind / unread names / cannot tell / unknown complaints)`);
  process.exitCode = f.possibleHoles.length || r.stillUnknown.length ? 1 : 0;
}
