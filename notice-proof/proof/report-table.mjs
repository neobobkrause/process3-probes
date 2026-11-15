// Prints a compact table of one series for the report, from results/<series>-summary.json.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './trees.mjs';
const s = JSON.parse(fs.readFileSync(path.join(ROOT, 'results', `${process.argv[2]}-summary.json`), 'utf8'));
const L = (a) => (a.length ? a.join(', ') : '-');
console.log('| Change | Expected by the rules | Told by the tool | Tests that failed (measured) | Needed a change (judged) | Verdict |');
console.log('|---|---|---|---|---|---|');
for (const r of s.rows) {
  const broke = r.broken.filter((u) => !r.through.includes(u));
  const through = r.broken.filter((u) => r.through.includes(u));
  console.log(`| **${r.id.split('-')[0]}** ${r.title}${r.providerTests ? '' : ' *(the provider\'s own tests fail)*'} | ${L(r.exp)} | ${L(r.told)}${r.matches ? '' : ' (differs)'} | ${L(broke)}${through.length ? `; ${through.join(', ')} only through a told module` : ''} | ${L(r.needs)} | ${r.verdict} |`);
}
