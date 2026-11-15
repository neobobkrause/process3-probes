// Reruns the whole proof with one command:   npm run proof   (from notice-proof/, after npm ci)
// 1. the tool's own tests; 2. the product's own tests, unchanged; 3. the check on every module, unchanged;
// 4. every series of changes (tool and ground truth); 5. the comparisons; 6. the measurements.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, PRODUCT } from './trees.mjs';
import { testAll } from './groundtruth.mjs';
import { loadTree } from '../tool/lib/model.mjs';
import { check } from '../tool/lib/check.mjs';

const node = (args) => execFileSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
const step = (s) => console.log(`\n== ${s}`);

step('the tool\'s own tests');
node(['--test', ...fs.readdirSync(path.join(ROOT, 'tool', 'test')).filter((f) => f.endsWith('.test.mjs')).map((f) => path.join('tool', 'test', f))]);

step('the product\'s own tests, unchanged');
const tree = loadTree(PRODUCT);
const base = await testAll(PRODUCT, tree.modules.map((m) => m.id));
for (const [m, r] of Object.entries(base)) console.log(`${m}: ${r.pass ? 'pass' : 'FAIL ' + r.failed.join(' / ')} (${r.ran} tests)`);

step('the check on every module, unchanged');
for (const m of tree.modules) { const c = check(tree, m.id); console.log(`${m.id}: ${c.refused ? `REFUSED ${c.refusals.length}` : 'no disagreement'}; ${c.cannotTell.length} place(s) where the reader cannot tell`); }

for (const series of ['planned', 'adversarial', 'adversarial-independent']) {
  if (!fs.existsSync(path.join(ROOT, 'changes', series))) continue;
  step(`series ${series}`);
  node(['proof/run-series.mjs', series]);
  if (fs.existsSync(path.join(ROOT, 'changes', `${series}-reading.json`))) node(['proof/compare.mjs', series]);
}

step('measurements');
node(['proof/measure.mjs']);
