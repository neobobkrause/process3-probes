// The one place the tool asks TypeScript's reader to read plain JavaScript with its structured comments.
import ts from 'typescript';

export { ts };

/** Settings for every reading. Both sides of a comparison are read with these, by the same version. */
export const OPTIONS = {
  allowJs: true,
  checkJs: true,
  noEmit: true,
  strict: true,
  // An unstated kind is "I cannot tell", not a disagreement: it is never refused.
  noImplicitAny: false,
  useUnknownInCatchVariables: false,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  types: [],
  skipLibCheck: true,
};

/** Reads the given files (and whatever they import) as one program. */
export function makeProgram(files) {
  return ts.createProgram(files, OPTIONS);
}

export const TS_VERSION = ts.version;

/** The text of a comment's tag, whitespace made single. */
export function tagText(tag) {
  const t = ts.getTextOfJSDocComment(tag.comment) ?? '';
  return t.replace(/\s+/g, ' ').trim();
}

/** The JSDoc blocks that belong to a declaration. */
export function docsOf(decl) {
  if (!decl) return [];
  if (ts.isJSDocTypedefTag(decl) || ts.isJSDocCallbackTag(decl)) return decl.parent && ts.isJSDoc(decl.parent) ? [decl.parent] : [];
  let host = decl;
  if (ts.isVariableDeclaration(decl)) host = decl.parent?.parent ?? decl;
  // The reader attaches every comment block that stands before a declaration; only the nearest one is its own.
  const all = host.jsDoc ?? [];
  return all.length ? [all[all.length - 1]] : [];
}

/** The tags with a given name in the JSDoc of a declaration. */
export function tagsOf(decl, name) {
  const out = [];
  for (const d of docsOf(decl)) for (const tag of d.tags ?? []) if (tag.tagName.text === name) out.push(tag);
  return out;
}

export function lineOf(node) {
  const sf = node.getSourceFile();
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}
