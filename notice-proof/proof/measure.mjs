// Measurements on the made-up product as it stands (the baseline): how long listing and check take per module,
// how long a notice takes per change (from the series results), and lines of comment against lines of code.
//   node proof/measure.mjs
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import ts from 'typescript';
import { ROOT, PRODUCT, ROUND } from './trees.mjs';
import { loadTree } from '../tool/lib/model.mjs';
import { check } from '../tool/lib/check.mjs';
import { listingOf } from '../tool/p3tool.mjs';

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const time = (f) => { const t = performance.now(); f(); return performance.now() - t; };

/** Lines holding code, lines holding only comment, and lines of interface comment (a JSDoc line with a tag). */
function lineCounts(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const code = new Set(), comment = new Set();
  const scanner = ts.createScanner(ts.ScriptTarget.ES2022, false, ts.LanguageVariant.Standard, text);
  const lineOf = (pos) => text.slice(0, pos).split('\n').length - 1;
  for (let k = scanner.scan(); k !== ts.SyntaxKind.EndOfFileToken; k = scanner.scan()) {
    const a = lineOf(scanner.getTokenStart()), b = lineOf(scanner.getTokenEnd());
    const target = k === ts.SyntaxKind.SingleLineCommentTrivia || k === ts.SyntaxKind.MultiLineCommentTrivia ? comment : (k === ts.SyntaxKind.WhitespaceTrivia || k === ts.SyntaxKind.NewLineTrivia ? null : code);
    if (target) for (let i = a; i <= b; i++) target.add(i);
  }
  const onlyComment = [...comment].filter((i) => !code.has(i) && lines[i].trim() !== '');
  const tagged = onlyComment.filter((i) => /^\s*\*?\s*@\w+/.test(lines[i]) || /\/\*\*\s*@\w+/.test(lines[i]));
  return { code: code.size, comment: onlyComment.length, interfaceTagLines: tagged.length };
}

const tree = loadTree(PRODUCT);
const out = { measuredOn: 'the made-up product as committed (baseline), Node ' + process.version + ', TypeScript ' + ts.version, modules: {}, totals: {} };
const tot = { srcCode: 0, srcComment: 0, srcTagLines: 0, testCode: 0, testComment: 0 };
for (const m of tree.modules) {
  const runs = 5;
  const listing = [], chk = [];
  for (let i = 0; i < runs; i++) { listing.push(time(() => listingOf(PRODUCT, m.id))); chk.push(time(() => check(tree, m.id))); }
  const src = m.src.map(lineCounts), tst = m.tests.map(lineCounts);
  const sumOf = (a, k) => a.reduce((s, x) => s + x[k], 0);
  const row = {
    listingMsMedian: Math.round(median(listing)), checkMsMedian: Math.round(median(chk)),
    srcCodeLines: sumOf(src, 'code'), srcCommentLines: sumOf(src, 'comment'), srcInterfaceTagLines: sumOf(src, 'interfaceTagLines'),
    testCodeLines: sumOf(tst, 'code'), testCommentLines: sumOf(tst, 'comment'),
  };
  out.modules[m.id] = row;
  tot.srcCode += row.srcCodeLines; tot.srcComment += row.srcCommentLines; tot.srcTagLines += row.srcInterfaceTagLines; tot.testCode += row.testCodeLines; tot.testComment += row.testCommentLines;
}
out.totals = { ...tot, srcCommentPerCodeLine: +(tot.srcComment / tot.srcCode).toFixed(2) };
const notices = [];
for (const s of fs.readdirSync(path.join(ROOT, 'results', ROUND), { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.endsWith('-run1') && e.name !== 'before-fix')) {
  for (const f of fs.readdirSync(path.join(ROOT, 'results', ROUND, s.name)).filter((x) => x.endsWith('.json'))) {
    const r = JSON.parse(fs.readFileSync(path.join(ROOT, 'results', ROUND, s.name, f), 'utf8'));
    notices.push(r.timing.noticeMs);
  }
}
out.noticeMs = { changes: notices.length, median: median(notices), max: Math.max(...notices), min: Math.min(...notices) };
fs.writeFileSync(path.join(ROOT, 'results', ROUND, 'measurements.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
