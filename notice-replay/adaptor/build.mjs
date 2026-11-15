#!/usr/bin/env node
// The adaptor: copies one commit of the real product (read-only, from a bare clone, with `git cat-file`) into the
// layout the notice tool reads: a folder holding modules.json and one folder per module with src/ and test/.
// Nothing is checked out and nothing is written in the product's repository.
//
//   node build.mjs --repo <bare clone> --commit <sha> --list <id,id,...> --out <folder>
//                  [--overlay <folder>]...   files laid over the commit, at their original paths (the commented provider)
//                  [--replace <id>=<folder>] a module's files taken wholly from a folder at their original paths
//
// What it does, in order:
//  1. Reads build/modules.json at the commit (the product's own ordered module list, with each module's paths,
//     tests and declared uses).
//  2. Takes every code file (.mjs, .js) and data file (.json) under any module's paths or tests, and every such file
//     under bio-plane/, agent-*/ and the other module roots that belongs to no module.
//  3. Lays the overlay over it.
//  4. Places each file: a file of a listed module goes to <id>/src/... or <id>/test/... (the longest matching path
//     of the module list decides which module and which side); every other file goes to _other/<original path>, where
//     the tool reads it only when something imports it.
//  5. Rewrites every relative import (import ... from, import(...), export ... from, and JSDoc import("...")) so it
//     points at the same file in its new place. Nothing else in any file is changed, and the same rewriting is done to
//     the before and the after of every change, so a comparison of the two is not affected by it.
//  6. Writes modules.json: the listed modules in the product's own order, each with its declared uses, and as its
//     interface files ("public") every file of it that another module's file imports (index.mjs when none does).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

function args(argv) {
  const o = { overlay: [], replace: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--overlay') o.overlay.push(argv[++i]);
    else if (a === '--replace') o.replace.push(argv[++i]);
    else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
  }
  return o;
}

const CODE = /\.(mjs|js|json)$/;
const MAX_BYTES = 2_000_000; // a data file larger than this is left out (none of the cluster's imports is one)

export function gitFiles(repo, commit) {
  return execFileSync('git', ['-C', repo, 'ls-tree', '-r', '-z', '--name-only', commit], { maxBuffer: 1 << 28 }).toString('utf8').split('\0').filter(Boolean);
}

/** Reads many blobs at once with one `git cat-file --batch`. */
export function readBlobs(repo, commit, files) {
  const input = files.map((f) => `${commit}:${f}`).join('\n') + '\n';
  const r = spawnSync('git', ['-C', repo, 'cat-file', '--batch'], { input, maxBuffer: 1 << 30 });
  const buf = r.stdout;
  const out = new Map();
  let p = 0;
  for (const f of files) {
    const nl = buf.indexOf(10, p);
    const head = buf.slice(p, nl).toString();
    p = nl + 1;
    const parts = head.split(' ');
    if (parts[1] === 'missing') continue;
    const size = Number(parts[2]);
    out.set(f, buf.slice(p, p + size));
    p += size + 1;
  }
  return out;
}

const under = (f, p) => f === p || (p.endsWith('/') && f.startsWith(p));

export function build({ repo, commit, list, out, overlay = [], replace = [] }) {
  const modulesJson = JSON.parse(execFileSync('git', ['-C', repo, 'show', `${commit}:build/modules.json`]).toString());
  const all = modulesJson.modules;
  const listed = new Set(list);
  for (const id of listed) if (!all.some((m) => m.id === id)) throw new Error(`${id} is not in the product's module list at ${commit}`);
  const roots = new Set(all.flatMap((m) => [...m.paths, ...m.tests]).map((p) => p.split('/')[0]));
  const prefixes = [];
  for (const m of all) {
    for (const p of m.paths) prefixes.push({ p, id: m.id, side: 'src' });
    for (const p of m.tests) prefixes.push({ p, id: m.id, side: 'test' });
  }
  prefixes.sort((a, b) => b.p.length - a.p.length);
  const owner = (f) => prefixes.find((x) => under(f, x.p)) ?? null;

  // 2. the files
  const wanted = gitFiles(repo, commit).filter((f) => CODE.test(f) && roots.has(f.split('/')[0]) && !f.includes('/node_modules/') && !f.startsWith('bio-plane/dist/'));
  const blobs = readBlobs(repo, commit, wanted);
  for (const [f, b] of [...blobs]) if (b.length > MAX_BYTES) blobs.delete(f);
  // 3. the overlay, and modules replaced wholly
  const walk = (dir, base = dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))]) : [];
  for (const r of replace) {
    const [id, dir] = r.split('=');
    const m = all.find((x) => x.id === id);
    for (const f of [...blobs.keys()]) if (owner(f)?.id === id) blobs.delete(f);
    for (const f of walk(dir)) if (CODE.test(f)) blobs.set(f, fs.readFileSync(path.join(dir, f)));
    if (!m) throw new Error(`no module ${id}`);
  }
  for (const dir of overlay) for (const f of walk(dir)) blobs.set(f, fs.readFileSync(path.join(dir, f)));

  // 4. places
  const place = new Map();
  const taken = new Set();
  for (const f of [...blobs.keys()].sort()) {
    const o = owner(f);
    let np;
    if (o && listed.has(o.id)) {
      const rel = o.p.endsWith('/') ? f.slice(o.p.length) : path.posix.basename(f);
      np = `${o.id}/${o.side}/${rel}`;
      if (taken.has(np)) np = `${o.id}/${o.side}/_/${f}`;
    } else np = `_other/${f}`;
    taken.add(np);
    place.set(f, np);
  }

  // 5. imports
  const importedBy = new Map(); // target original path -> Set of importing module ids (or '_other')
  const SPEC = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.\.?\/[^'"\n]*)\2/g;
  fs.rmSync(out, { recursive: true, force: true });
  for (const [f, b] of blobs) {
    let data = b;
    if (/\.(mjs|js)$/.test(f)) {
      const text = b.toString('utf8');
      const fromOwner = owner(f)?.id ?? null;
      const rewritten = text.replace(SPEC, (all0, lead, q, spec) => {
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(f), spec));
        if (!place.has(target)) return all0; // a file that is not copied: left as written (unresolved)
        const to = owner(target)?.id;
        if (to && to !== fromOwner) { if (!importedBy.has(target)) importedBy.set(target, new Set()); importedBy.get(target).add(fromOwner ?? '_other'); }
        let rel = path.posix.relative(path.posix.dirname(place.get(f)), place.get(target));
        if (!rel.startsWith('.')) rel = `./${rel}`;
        return `${lead}${q}${rel}${q}`;
      });
      data = Buffer.from(rewritten, 'utf8');
    }
    const dest = path.join(out, place.get(f));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, data);
  }

  // 6. modules.json
  const modules = all.filter((m) => listed.has(m.id)).map((m) => {
    const pub = [...importedBy.keys()].filter((t) => owner(t)?.id === m.id && owner(t).side === 'src' && /\.mjs$/.test(t)).map((t) => place.get(t).slice(m.id.length + 1)).sort();
    const idx = place.get([...blobs.keys()].find((f) => owner(f)?.id === m.id && owner(f).side === 'src' && /(^|\/)index\.mjs$/.test(f)) ?? '');
    const pubs = pub.length ? pub : idx ? [idx.slice(m.id.length + 1)] : [];
    return { id: m.id, uses: m.uses ?? [], public: pubs };
  });
  fs.writeFileSync(path.join(out, 'modules.json'), JSON.stringify({ commit, built: 'notice-replay/adaptor/build.mjs', modules }, null, 1) + '\n');
  return { out, modules, files: blobs.size };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const o = args(process.argv.slice(2));
  const r = build({ repo: o.repo, commit: o.commit, list: o.list.split(','), out: o.out, overlay: o.overlay, replace: o.replace });
  console.log(`built ${r.out}: ${r.files} files, ${r.modules.length} listed modules`);
}
