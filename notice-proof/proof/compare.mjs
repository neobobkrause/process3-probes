// Compares, for every change of a series: expected by the rules, told by the tool, broken by the tests, and
// needed by the reading. Writes results/<series>-table.md and results/<series>-summary.json.
//   node proof/compare.mjs planned
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ROUND, answersFile } from './trees.mjs';

const series = process.argv[2];
const expected = JSON.parse(fs.readFileSync(answersFile(series, 'expected'), 'utf8')).changes;
const reading = JSON.parse(fs.readFileSync(answersFile(series, 'reading'), 'utf8')).changes;
const dir = path.join(ROOT, 'results', ROUND, series);
const ids = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
const S = (a) => [...new Set(a)].sort();
const list = (a) => (a.length ? a.join(', ') : 'none');

const rows = [];
const sum = { changes: 0, matchesRules: 0, notices: 0, needed: 0, holes: [], caughtByGuard: [], unneeded: [], falseRefusals: 0, refusals: 0 };
for (const id of ids) {
  const r = JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), 'utf8'));
  const e = expected[id], g = reading[id];
  if (!e || !g) throw new Error(`missing expected or reading for ${id}`);
  const told = S(r.tool.told), exp = S(e.told), broken = S(r.groundTruth.broken), needs = S(g.needs), through = S(g.throughOnly ?? []);
  const missed = needs.filter((u) => !told.includes(u));
  const brokenUntold = broken.filter((u) => !told.includes(u) && !through.includes(u));
  const unneeded = told.filter((u) => !needs.includes(u));
  const refusals = Object.entries(r.tool.checks).filter(([, c]) => c.refusedAfter > 0).map(([m, c]) => `${m} (${c.refusedAfter})`);
  sum.refusals += Object.values(r.tool.checks).reduce((s, c) => s + c.refusedAfter, 0);
  const matches = JSON.stringify(told) === JSON.stringify(exp);
  sum.changes++; if (matches) sum.matchesRules++;
  sum.notices += told.length; sum.needed += needs.length;
  const holeUsers = S([...missed, ...brokenUntold]);
  const falseRef = Object.entries(g.falseRefusals ?? {});
  sum.falseRefusals += falseRef.reduce((n, [, k]) => n + k, 0);
  let verdict;
  if (holeUsers.length && g.guard) { verdict = `not told, stopped by another guard: ${g.guard}`; sum.caughtByGuard.push({ id, users: holeUsers, guard: g.guard }); }
  else if (holeUsers.length) { verdict = `HOLE: ${holeUsers.join(', ')} needed a change and was not told`; sum.holes.push({ id, users: holeUsers }); }
  else verdict = unneeded.length ? `held; ${unneeded.length} told for nothing` : 'held';
  if (falseRef.length) verdict += `; FALSE REFUSAL of ${falseRef.map(([m, k]) => `${m} (${k} lines)`).join(', ')}`;
  for (const u of unneeded) sum.unneeded.push({ id, user: u });
  rows.push({ id, title: r.title, provider: r.provider, exp, told, matches, broken, needs, through, refusals, verdict, providerTests: r.groundTruth.providerTests.pass, firstCommentsStep: r.tool.firstCommentsStep, timing: r.timing });
}
const T = ['| Change | Provider | Expected by the rules | Told by the tool | Tests that broke (measured) | Needed a change (judged) | Check refused | Verdict |', '|---|---|---|---|---|---|---|---|'];
for (const x of rows) {
  T.push(`| ${x.id}: ${x.title} | ${x.provider}${x.providerTests ? '' : ' (its own tests fail)'} | ${list(x.exp)} | ${list(x.told)}${x.matches ? '' : ' **(differs)**'}${x.firstCommentsStep ? ' (first comments step)' : ''} | ${list(x.broken)}${x.through.length ? ` (${x.through.join(', ')} only through a told module)` : ''} | ${list(x.needs)} | ${list(x.refusals)} | ${x.verdict} |`);
}
fs.writeFileSync(path.join(ROOT, 'results', ROUND, `${series}-table.md`), T.join('\n') + '\n');
fs.writeFileSync(path.join(ROOT, 'results', ROUND, `${series}-summary.json`), JSON.stringify({ ...sum, rows }, null, 2) + '\n');
console.log(T.join('\n'));
console.log(JSON.stringify({ changes: sum.changes, matchesRules: sum.matchesRules, notices: sum.notices, needed: sum.needed, holes: sum.holes, caughtByGuard: sum.caughtByGuard.map((c) => c.id), unneeded: sum.unneeded.length, refusals: sum.refusals, falseRefusals: sum.falseRefusals, differsFromRules: rows.filter((r) => !r.matches).map((r) => r.id) }));
