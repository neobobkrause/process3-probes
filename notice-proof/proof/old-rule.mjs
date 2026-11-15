// Compares the tool, on the latest design, with the old rule: tell every module that declares the provider in its
// list of modules it uses. Counted from the committed comparisons (results/<ROUND>/<series>-summary.json) and
// product/modules.json; "needed" is the reading (judged), "broken" is measured.
//   node proof/old-rule.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ROUND } from './trees.mjs';

const mods = JSON.parse(fs.readFileSync(path.join(ROOT, 'product', 'modules.json'), 'utf8')).modules;
const declares = (p) => mods.filter((m) => m.uses.includes(p)).map((m) => m.id);
const series = fs.readdirSync(path.join(ROOT, 'results', ROUND)).filter((f) => f.endsWith('-summary.json')).map((f) => f.slice(0, -13));
const t = { changes: 0, needed: 0, tool: { notices: 0, forNothing: 0, missed: 0, missedBroken: 0 }, old: { notices: 0, forNothing: 0, missed: 0, missedBroken: 0 } };
for (const s of series) {
  for (const r of JSON.parse(fs.readFileSync(path.join(ROOT, 'results', ROUND, `${s}-summary.json`), 'utf8')).rows) {
    t.changes++; t.needed += r.needs.length;
    const old = declares(r.provider);
    for (const [k, told] of [['tool', r.told], ['old', old]]) {
      t[k].notices += told.length;
      t[k].forNothing += told.filter((u) => !r.needs.includes(u)).length;
      t[k].missed += r.needs.filter((u) => !told.includes(u)).length;
      t[k].missedBroken += r.broken.filter((u) => !told.includes(u) && !(r.through ?? []).includes(u)).length;
    }
  }
}
fs.writeFileSync(path.join(ROOT, 'results', ROUND, 'old-rule.json'), JSON.stringify(t, null, 2) + '\n');
console.log(JSON.stringify(t, null, 2));
