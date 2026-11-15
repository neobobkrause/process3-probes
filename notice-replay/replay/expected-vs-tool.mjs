#!/usr/bin/env node
// Compares the expected answers (expected/<provider>.json, written before any run) with the tool's notices
// (results/notice/), per change: does the listing change, and which entries change in a way that tells.
// Writes results/expected-vs-tool.json and prints a table.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOTICE = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'results', 'notice');
const out = [];
for (const f of fs.readdirSync(path.join(ROOT, 'expected')).filter((x) => x.endsWith('.json'))) {
  for (const e of JSON.parse(fs.readFileSync(path.join(ROOT, 'expected', f), 'utf8'))) {
    const n = JSON.parse(fs.readFileSync(path.join(NOTICE, `${e.change.replace(':', '-')}.json`), 'utf8'));
    const prov = e.change.split(':')[0];
    const toolEntries = n.entries.filter((x) => x.module === prov);
    const tellT = new Set(toolEntries.filter((x) => x.tells !== 'nobody').map((x) => x.entry));
    const tellE = new Set(e.entries.filter((x) => x.tells !== 'nobody').map((x) => x.entry));
    out.push({
      change: e.change, expectedListingChanges: e.listingChanges, toolListingChanges: toolEntries.length > 0,
      expectedTelling: tellE.size, toolTelling: tellT.size,
      telling: { both: [...tellT].filter((x) => tellE.has(x)).length, onlyTool: [...tellT].filter((x) => !tellE.has(x)), onlyExpected: [...tellE].filter((x) => !tellT.has(x)) },
      toolNothingTells: toolEntries.filter((x) => x.tells === 'nobody').map((x) => `${x.entry}: ${x.changes.join(', ')}`),
      throughModules: [...new Set(n.entries.filter((x) => x.module !== prov).map((x) => x.module))],
    });
  }
}
fs.writeFileSync(path.join(ROOT, 'results', 'expected-vs-tool.json'), JSON.stringify(out, null, 1) + '\n');
for (const r of out) console.log(`${r.change.padEnd(20)} listing changes: expected ${r.expectedListingChanges ? 'yes' : 'no '} tool ${r.toolListingChanges ? 'yes' : 'no '} | telling entries: expected ${r.expectedTelling}, tool ${r.toolTelling}, both ${r.telling.both} | through: ${r.throughModules.join(',') || '-'}`);
const agree = out.filter((r) => r.expectedListingChanges === r.toolListingChanges).length;
console.log(`listing changes: agree on ${agree} of ${out.length}`);
