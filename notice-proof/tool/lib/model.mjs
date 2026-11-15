// The product as the tool sees it: a folder holding modules.json and one folder per module.
import fs from 'node:fs';
import path from 'node:path';

/** Every .mjs file under a folder, sorted, as absolute paths. */
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') out.push(...walk(p)); }
    else if (e.name.endsWith('.mjs')) out.push(p);
  }
  return out.sort();
}

/**
 * Loads a product tree.
 * @param {string} root folder that holds modules.json
 */
export function loadTree(root) {
  root = path.resolve(root);
  const spec = JSON.parse(fs.readFileSync(path.join(root, 'modules.json'), 'utf8'));
  const modules = spec.modules.map((m, index) => {
    const dir = path.join(root, m.id);
    const files = walk(dir);
    const isTest = (f) => f.includes(`${path.sep}test${path.sep}`) || f.endsWith('.test.mjs');
    return {
      id: m.id,
      index,
      uses: m.uses ?? [],
      dir,
      public: (m.public ?? ['src/index.mjs']).map((p) => path.join(dir, p)).filter((p) => fs.existsSync(p)),
      src: files.filter((f) => !isTest(f)),
      tests: files.filter(isTest),
      files,
    };
  });
  const byId = new Map(modules.map((m) => [m.id, m]));
  const moduleOfFile = (file) => {
    const rel = path.relative(root, file);
    if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
    const id = rel.split(path.sep)[0];
    return byId.has(id) ? id : null;
  };
  return { root, modules, byId, moduleOfFile, allFiles: modules.flatMap((m) => m.files) };
}
