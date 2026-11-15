#!/usr/bin/env node
// Carries the provider's comments across a real change, mechanically, as a start for the job's own update.
//
//   node carry.mjs <change> <from: before|after> <to: before|after> <commented folder in> <commented folder out>
//                  [--to-change <other change>]
//
// The commented folder holds only the provider's files that differ from the real product (its commented files), at
// their original paths. For each file: base = the real file at <from>, ours = the commented file, theirs = the real
// file at <to> (of --to-change when given: the next replayed change of the same provider). Where ours equals base,
// theirs is taken. Otherwise a three-way merge (git merge-file) puts the real change into the commented file; where it
// cannot, the file is written with conflict markers and listed. A file the real change removes is dropped. Only files
// that differ from the real file at <to> are written out. Nothing here decides what a comment should say: that is
// the job's update, done by hand after this.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { changeOf, extractProvider, DEFAULT_REPO } from './state.mjs';

const walk = (dir, base = dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))]) : [];

export function carry(id, from, to, inDir, outDir, { toChange, repo = DEFAULT_REPO } = {}) {
  const c = changeOf(id);
  const c2 = toChange ? changeOf(toChange) : c;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'carry-'));
  const baseDir = path.join(tmp, 'base'), theirsDir = path.join(tmp, 'theirs');
  extractProvider(c, c[from], baseDir, repo);
  extractProvider(c2, c2[to], theirsDir, repo);
  fs.rmSync(outDir, { recursive: true, force: true });
  const conflicts = [], merged = [], dropped = [];
  for (const f of walk(inDir)) {
    const ours = path.join(inDir, f), base = path.join(baseDir, f), theirs = path.join(theirsDir, f);
    const dest = path.join(outDir, f);
    if (!fs.existsSync(theirs)) { dropped.push(f); continue; }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (!fs.existsSync(base)) { fs.copyFileSync(ours, dest); merged.push(f); continue; } // a file the comments step added
    const tOurs = fs.readFileSync(ours), tBase = fs.readFileSync(base), tTheirs = fs.readFileSync(theirs);
    if (tBase.equals(tTheirs)) { fs.copyFileSync(ours, dest); continue; }
    const r = spawnSync('git', ['merge-file', '-p', '-L', 'commented', '-L', 'real before', '-L', 'real after', ours, base, theirs]);
    fs.writeFileSync(dest, r.stdout);
    if (r.status !== 0) conflicts.push(f); else merged.push(f);
    if (r.stdout.equals(tTheirs)) fs.rmSync(dest);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  return { merged, conflicts, dropped };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--to-change');
  const toChange = i >= 0 ? argv.splice(i, 2)[1] : undefined;
  const [id, from, to, inDir, outDir] = argv;
  const r = carry(id, from, to, inDir, outDir, { toChange });
  console.log(JSON.stringify(r, null, 1));
  if (r.conflicts.length) process.exitCode = 1;
}
