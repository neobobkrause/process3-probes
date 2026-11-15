#!/usr/bin/env node
// Builds one side of one replayed change as a product folder the notice tool reads.
//
//   node state.mjs <change, e.g. ai-runs:96> <before|after> <out folder> [--commented <folder>] [--repo <bare clone>]
//
// The product as it stood at the commit before the change, with only the provider's files replaced:
//  - before: the provider as at the commit before the change;
//  - after:  the provider as at the merge of the change (every other module stays as before, so the only difference
//            between the two sides is the provider's own change; the record's merges sometimes touched other files too,
//            and those are left out on purpose).
// With --commented, the provider's commented files (kept at their original paths in that folder) are laid over it.
// Listed modules: the provider, every module that declared it at the commit before, and every module Process3 told.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build, gitFiles, readBlobs } from './build.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_REPO = process.env.CIVICSMITH_REPO ?? path.resolve(HERE, '../.cache/civicsmith-copy.git');
export const CHANGES = JSON.parse(fs.readFileSync(path.join(HERE, '../data/changes.json'), 'utf8')).changes;

export function changeOf(id) {
  const c = CHANGES.find((x) => x.change === id);
  if (!c) throw new Error(`no replayed change ${id}`);
  return c;
}

export function usersOf(c, repo = DEFAULT_REPO) {
  const mods = JSON.parse(execFileSync('git', ['-C', repo, 'show', `${c.before}:build/modules.json`]).toString()).modules;
  const ids = new Set(mods.map((m) => m.id));
  return [...new Set([...c.declaredUsers, ...Object.keys(c.told)])].filter((u) => ids.has(u) && u !== c.provider);
}

/** The provider's own paths and tests at a commit, from the product's module list. */
export function providerPaths(c, commit, repo = DEFAULT_REPO) {
  const mods = JSON.parse(execFileSync('git', ['-C', repo, 'show', `${commit}:build/modules.json`]).toString()).modules;
  const m = mods.find((x) => x.id === c.provider);
  return [...m.paths, ...m.tests];
}

/** Writes the provider's real files at a commit into a folder, at their original paths. */
export function extractProvider(c, commit, dir, repo = DEFAULT_REPO) {
  const under = (f, p) => f === p || (p.endsWith('/') && f.startsWith(p));
  const ps = providerPaths(c, commit, repo);
  const files = gitFiles(repo, commit).filter((f) => ps.some((p) => under(f, p)));
  const blobs = readBlobs(repo, commit, files);
  fs.rmSync(dir, { recursive: true, force: true });
  for (const [f, b] of blobs) { fs.mkdirSync(path.join(dir, path.dirname(f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), b); }
  return [...blobs.keys()];
}

export function buildState(id, side, out, { commented, users, repo = DEFAULT_REPO } = {}) {
  const c = changeOf(id);
  const list = [c.provider, ...usersOf(c, repo)];
  const replace = [];
  let tmp;
  if (side === 'after') {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'replay-after-'));
    extractProvider(c, c.after, tmp, repo);
    replace.push(`${c.provider}=${tmp}`);
  } else if (side !== 'before') throw new Error('side is before or after');
  const r = build({ repo, commit: c.before, list, out, replace, overlay: [...(users ? [users] : []), ...(commented ? [commented] : [])] });
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  return r;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv.splice(i, 2)[1] : undefined; };
  const commented = opt('--commented');
  const repo = opt('--repo') ?? DEFAULT_REPO;
  const [id, side, out] = argv;
  const r = buildState(id, side, out, { commented, repo });
  console.log(`built ${id} ${side}${commented ? ' (commented)' : ''} in ${out}: ${r.files} files, ${r.modules.length} listed modules`);
}
