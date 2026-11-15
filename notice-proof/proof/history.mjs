// Writes the history of the proof, round by round and design by design, from the committed comparisons
// (results/iter<N>/<series>-summary.json). Everything it prints is counted from those files.
//   node proof/history.mjs            prints a Markdown table and writes results/history.json
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './trees.mjs';

const SERIES = ['planned', 'adversarial', 'adversarial-independent', 'round3-independent', 'round4-independent', 'round5-independent', 'round6-independent', 'round7-independent', 'round8-independent', 'round9-independent'];
// which design each blind round was written against (it is run first on that design)
const BLIND = { 'adversarial-independent': 1, 'round3-independent': 2, 'round4-independent': 3, 'round5-independent': 4, 'round6-independent': 5, 'round7-independent': 6, 'round8-independent': 7, 'round9-independent': 8 };
const designs = fs.readdirSync(path.join(ROOT, 'results')).filter((d) => /^iter\d+$/.test(d)).map((d) => Number(d.slice(4))).sort((a, b) => a - b);

const rows = [];
for (const n of designs) {
  for (const s of SERIES) {
    const f = path.join(ROOT, 'results', `iter${n}`, `${s}-summary.json`);
    if (!fs.existsSync(f)) continue;
    const x = JSON.parse(fs.readFileSync(f, 'utf8'));
    const realistic = (() => {
      const e = path.join(ROOT, 'changes', n === 1 ? '' : `iter${n}`, `${s}-expected.json`);
      if (!fs.existsSync(e)) return null;
      const ch = JSON.parse(fs.readFileSync(e, 'utf8')).changes;
      return x.holes.filter((h) => ch[h.id]?.realistic !== false).length;
    })();
    rows.push({ design: n, series: s, blind: BLIND[s] === n, changes: x.changes, holes: x.holes.length, realisticHoles: realistic, holeIds: x.holes.map((h) => h.id), stoppedByGuard: x.caughtByGuard.length, falseRefusalLines: x.falseRefusals, noticesForNothing: x.unneeded.length, notices: x.notices, needed: x.needed, matchesRules: x.matchesRules });
  }
}
fs.writeFileSync(path.join(ROOT, 'results', 'history.json'), JSON.stringify(rows, null, 2) + '\n');
const T = ['| Design | Series | Blind? | Changes | Holes | Stopped by another guard | False refusal lines | Notices for nothing | Notices sent | Told as the rules say |', '|---|---|---|---|---|---|---|---|---|---|'];
for (const r of rows) T.push(`| ${r.design} | ${r.series} | ${r.blind ? 'yes' : 'no'} | ${r.changes} | ${r.holes} | ${r.stoppedByGuard} | ${r.falseRefusalLines} | ${r.noticesForNothing} | ${r.notices} | ${r.matchesRules} of ${r.changes} |`);
console.log(T.join('\n'));
