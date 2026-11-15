// Prints the report's table of one series: the latest round's result for each change, beside the first round's
// verdict.   node proof/report-table.mjs <series> [latest round, default iter2]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './trees.mjs';
const series = process.argv[2], latest = process.argv[3] || 'iter2';
const read = (round) => { const p = path.join(ROOT, 'results', round, `${series}-summary.json`); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const s = read(latest), first = read('iter1');
const firstVerdict = new Map((first?.rows ?? []).map((r) => [r.id, r.verdict]));
const L = (a) => (a.length ? a.join(', ') : '-');
const short = (v) => v ? v.replace(/^held; (\d+) told for nothing/, 'held ($1 for nothing)').replace(/^not told, stopped by another guard: .*/, 'stopped by another guard') : 'not run';
console.log(`| No. | Change | Expected by the rules | Told by the tool | Tests that failed (measured) | Needed a change (judged) | Verdict${first ? ' | First design' : ''} |`);
console.log(`|---|---|---|---|---|---|---|${first ? '---|' : ''}`);
for (const r of s.rows) {
  const no = r.id.split('-')[0].replace(/^[A-Z]0?/, '');
  const broke = r.broken.filter((u) => !r.through.includes(u));
  const through = r.broken.filter((u) => r.through.includes(u));
  console.log(`| ${no} | ${r.title}${r.providerTests ? '' : ' *(the provider\'s own tests fail)*'} | ${L(r.exp)} | ${L(r.told)}${r.matches ? '' : ' (differs)'} | ${L(broke)}${through.length ? `; ${through.join(', ')} only through a told module` : ''} | ${L(r.needs)} | ${short(r.verdict)}${first ? ` | ${short(firstVerdict.get(r.id))}` : ''} |`);
}
