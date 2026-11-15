#!/usr/bin/env node
// Compares, for every replayed change, who the tool told with who Process3 told, the judged verdicts, and the users'
// own tests before and after. Writes results/compare.json and results/compare.md.
//   node replay/compare.mjs
//
// Words, per change and user:
//  - told (record): Process3 told the user.
//  - told (tool): the tool's notice names the user, for any reason.
//  - told for an entry: the tool names the user because the user's code uses an entry that changed in a way that tells
//    (not only because the tool cannot follow the user).
//  - needed: judged broken or judged adopted (the study's reading of the record). Broken is the must; adopted, the may.
//  - for nothing: told, and judged neither broken nor adopted.
//  - tests: a user whose own tests have a failure after the change that they did not have before.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHANGES } from '../adaptor/state.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const read = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);
const key = (c) => c.change.replace(':', '-');

const rows = [];
for (const c of CHANGES) {
  const n = read(path.join(ROOT, 'results', 'notice', `${key(c)}.json`));
  const t = read(path.join(ROOT, 'results', 'tests', `${key(c)}.json`));
  const recordTold = Object.keys(c.told);
  const broken = Object.entries(c.verdicts).filter(([, v]) => v.outcome === 'B').map(([u]) => u);
  const adopted = Object.entries(c.verdicts).filter(([, v]) => v.outcome === 'A').map(([u]) => u);
  const needed = new Set([...broken, ...adopted]);
  const row = { change: c.change, provider: c.provider, kind: c.kind, recordTold: recordTold.length, broken, adopted };
  if (n && !n.error) {
    const told = n.told.map((x) => x.user);
    const forEntry = n.told.filter((x) => x.reasons.some((r) => r.entry)).map((x) => x.user);
    Object.assign(row, {
      listingChanged: !!n.interfaceChanged,
      entriesThatTell: n.entries.filter((e) => e.tells !== 'nobody').map((e) => `${e.module} ${e.entry}: ${e.changes.join(', ')}`),
      entriesThatTellNobody: n.entries.filter((e) => e.tells === 'nobody').map((e) => `${e.module} ${e.entry}: ${e.changes.join(', ')}`),
      toolTold: told.length, toolToldForEntry: forEntry.length,
      toolForNothing: told.filter((u) => !needed.has(u)).length,
      entryForNothing: forEntry.filter((u) => !needed.has(u)).length,
      brokenMissed: broken.filter((u) => !told.includes(u)), adoptedMissed: adopted.filter((u) => !told.includes(u)),
      brokenMissedByEntry: broken.filter((u) => !forEntry.includes(u)), adoptedMissedByEntry: adopted.filter((u) => !forEntry.includes(u)),
      toldUsers: told, toldForEntryUsers: forEntry,
      notFollowedOnly: n.told.filter((x) => !x.reasons.some((r) => r.entry)).map((x) => x.user),
      ms: n.replay?.ms,
    });
  } else if (n?.error) row.toolError = n.error.slice(0, 500);
  row.recordForNothing = recordTold.filter((u) => !needed.has(u)).length;
  if (t) {
    const failing = Object.entries(t.users).filter(([, r]) => (r.newFailures ?? []).length).map(([u]) => u);
    const ran = Object.entries(t.users).filter(([, r]) => r.before?.files && r.after?.files).map(([u]) => u);
    Object.assign(row, {
      testsRanFor: ran.length, testsNoTests: Object.entries(t.users).filter(([, r]) => !r.before?.files).map(([u]) => u),
      testsNewFailures: failing,
      brokenCaughtByTests: broken.filter((u) => failing.includes(u)), brokenNotCaughtByTests: broken.filter((u) => !failing.includes(u)),
      testsFailingNotJudgedBroken: failing.filter((u) => !broken.includes(u)),
    });
  }
  rows.push(row);
}

const sum = (xs, f) => xs.reduce((n, x) => n + (f(x) ?? 0), 0);
const total = (rs) => ({
  changes: rs.length,
  replayed: rs.filter((r) => r.toolTold !== undefined).length,
  recordTold: sum(rs, (r) => r.recordTold), recordForNothing: sum(rs, (r) => r.recordForNothing),
  broken: sum(rs, (r) => r.broken.length), adopted: sum(rs, (r) => r.adopted.length),
  listingUnchanged: rs.filter((r) => r.listingChanged === false).length,
  toolTold: sum(rs, (r) => r.toolTold), toolForNothing: sum(rs, (r) => r.toolForNothing),
  toolBrokenMissed: sum(rs, (r) => r.brokenMissed?.length), toolAdoptedMissed: sum(rs, (r) => r.adoptedMissed?.length),
  entryTold: sum(rs, (r) => r.toolToldForEntry), entryForNothing: sum(rs, (r) => r.entryForNothing),
  entryBrokenMissed: sum(rs, (r) => r.brokenMissedByEntry?.length), entryAdoptedMissed: sum(rs, (r) => r.adoptedMissedByEntry?.length),
  testsChanges: rs.filter((r) => r.testsRanFor !== undefined).length,
  testsUserRuns: sum(rs, (r) => r.testsRanFor), testsUsersFailing: sum(rs, (r) => r.testsNewFailures?.length),
  brokenCaughtByTests: sum(rs, (r) => r.brokenCaughtByTests?.length),
  brokenInChangesWithTests: sum(rs.filter((r) => r.testsRanFor !== undefined), (r) => r.broken.length),
});
const providers = [...new Set(rows.map((r) => r.provider))];
const out = { written: new Date().toISOString(), total: total(rows), byProvider: Object.fromEntries(providers.map((p) => [p, total(rows.filter((r) => r.provider === p))])), rows };
fs.writeFileSync(path.join(ROOT, 'results', 'compare.json'), JSON.stringify(out, null, 1) + '\n');

const L = ['# Replay: the tool against the record, change by change', '', `Written by \`replay/compare.mjs\` at ${out.written}. Measured, except "broken" and "adopted", which are the study session's judged reading of the record.`, ''];
L.push('| Change | Record told | Listing changed | Tool told | of them for an entry | Tool for nothing | Broken (missed by tool) | Adopted (missed by tool) | Users whose tests newly fail | Broken caught by tests |');
L.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const r of rows) {
  const lst = r.listingChanged === undefined ? (r.toolError ? 'error' : 'not run') : r.listingChanged ? 'yes' : 'no';
  L.push(`| ${r.change} | ${r.recordTold} | ${lst} | ${r.toolTold ?? '-'} | ${r.toolToldForEntry ?? '-'} | ${r.toolForNothing ?? '-'} | ${r.broken.length}${r.brokenMissed?.length ? ` (${r.brokenMissed.join(', ')})` : ''} | ${r.adopted.length}${r.adoptedMissed?.length ? ` (${r.adoptedMissed.join(', ')})` : ''} | ${r.testsNewFailures ? r.testsNewFailures.join(', ') || 'none' : 'not run'} | ${r.brokenCaughtByTests ? `${r.brokenCaughtByTests.length} of ${r.broken.length}` : '-'} |`);
}
const T = out.total;
L.push('', '## Totals', '', '```', JSON.stringify(T, null, 1), '```');
fs.writeFileSync(path.join(ROOT, 'results', 'compare.md'), L.join('\n') + '\n');
console.log(JSON.stringify(T, null, 1));
