// Builds the product as it stands before and after one planned change, in a scratch folder.
// A change is a folder: change.json plus files/ holding every file of the product that the change writes,
// at its path in the product. "before" lists other changes whose files stand already (a job's earlier step,
// or a state set up for the scenario); the change's own files are applied on top for "after".
import fs from 'node:fs';
import path from 'node:path';

export const HERE = path.dirname(new URL(import.meta.url).pathname);
export const ROOT = path.resolve(HERE, '..');
export const PRODUCT = path.join(ROOT, 'product');
export const SCRATCH = path.join(ROOT, '.scratch');
/** Which round of the design is being run: iter1 (the first design) or iter2 (and later). */
export const ROUND = process.env.ROUND || 'iter2';
/** Where a round keeps its expected answers and readings. */
export const answersFile = (series, kind) => (ROUND === 'iter1' ? path.join(ROOT, 'changes', `${series}-${kind}.json`) : path.join(ROOT, 'changes', ROUND, `${series}-${kind}.json`));

export function readChange(series, id) {
  const dir = path.join(ROOT, 'changes', series, id);
  const c = JSON.parse(fs.readFileSync(path.join(dir, 'change.json'), 'utf8'));
  return { ...c, id, series, dir };
}

export function listChanges(series) {
  const dir = path.join(ROOT, 'changes', series);
  return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

function applyChange(change, treeDir) {
  const files = path.join(change.dir, 'files');
  if (fs.existsSync(files)) copyDir(files, treeDir);
  for (const d of change.delete ?? []) fs.rmSync(path.join(treeDir, d), { force: true });
}

/** Makes .scratch/<series>/<id>/before and after. */
export function buildTrees(change) {
  const base = path.join(SCRATCH, change.series, change.id);
  fs.rmSync(base, { recursive: true, force: true });
  const before = path.join(base, 'before'), after = path.join(base, 'after');
  copyDir(PRODUCT, before);
  for (const pre of change.before ?? []) {
    const [s, i] = pre.includes('/') ? pre.split('/') : [change.series, pre];
    applyChange(readChange(s, i), before);
  }
  copyDir(before, after);
  applyChange(change, after);
  return { before, after };
}
