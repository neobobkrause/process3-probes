// Runs one series of changes (planned or adversarial): for each change, the tool's notice and checks, and,
// independently, every module's own tests before and after. Writes results/<series>/<id>.json.
//   node proof/run-series.mjs planned [id ...]
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { ROOT, readChange, listChanges, buildTrees } from './trees.mjs';
import { testAll } from './groundtruth.mjs';
import { loadTree } from '../tool/lib/model.mjs';
import { notice } from '../tool/lib/notice.mjs';
import { check, commentsOnly } from '../tool/lib/check.mjs';
import { listingOf } from '../tool/p3tool.mjs';

const series = process.argv[2];
const only = process.argv.slice(3);
const outDir = path.join(ROOT, 'results', series);
fs.mkdirSync(outDir, { recursive: true });

const timed = (f) => { const t = performance.now(); const r = f(); return [r, Math.round(performance.now() - t)]; };

for (const id of only.length ? only : listChanges(series)) {
  const change = readChange(series, id);
  const { before, after } = buildTrees(change);
  const A = loadTree(after), Bt = loadTree(before);
  const ids = A.modules.map((m) => m.id);
  const pIndex = ids.indexOf(change.provider);
  const later = ids.slice(pIndex + 1);

  // The tool.
  const [, listMsBefore] = timed(() => listingOf(before, change.provider));
  const [, listMsAfter] = timed(() => listingOf(after, change.provider));
  const [n, noticeMs] = timed(() => notice(before, after, change.provider));
  const checks = {};
  for (const m of [change.provider, ...later]) {
    const [cb] = timed(() => check(Bt, m));
    const [ca, ms] = timed(() => check(A, m));
    checks[m] = { refusedBefore: cb.refusals.length, refusedAfter: ca.refusals.length, refusals: ca.refusals, refusalsBefore: cb.refusals, ms };
  }
  const co = commentsOnly(Bt, A, change.provider);

  // Ground truth, without the tool.
  const testsBefore = await testAll(before, [change.provider, ...later]);
  const testsAfter = await testAll(after, [change.provider, ...later]);
  const broken = later.filter((m) => testsBefore[m].pass && !testsAfter[m].pass);

  const result = {
    id, title: change.title, provider: change.provider, covers: change.covers ?? [],
    tool: {
      firstCommentsStep: n.firstCommentsStep,
      interfaceChanged: n.interfaceChanged ?? false,
      summary: n.summary,
      entries: n.entries,
      told: n.told.map((t) => t.user),
      toldDetail: n.told,
      notTold: n.notTold,
      warnings: n.warnings,
      commentsOnly: co.same,
      checks,
    },
    groundTruth: {
      providerTests: testsAfter[change.provider],
      testsBefore: Object.fromEntries(later.map((m) => [m, testsBefore[m].pass])),
      testsAfter: Object.fromEntries(later.map((m) => [m, { pass: testsAfter[m].pass, failed: testsAfter[m].failed }])),
      broken,
    },
    timing: { listingMs: { before: listMsBefore, after: listMsAfter }, noticeMs, checkMs: Object.fromEntries(Object.entries(checks).map(([k, v]) => [k, v.ms])) },
  };
  fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(result, null, 2) + '\n');
  console.log(`${id} ${change.provider}: told [${result.tool.told.join(', ')}]  broken [${broken.join(', ')}]  provider tests ${testsAfter[change.provider].pass ? 'pass' : 'FAIL'}  ${n.firstCommentsStep ? '(first comments step)' : ''}`);
}
