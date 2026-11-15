// The one place the tool asks TypeScript's reader to read plain JavaScript with its structured comments.
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

export { ts };

/** Settings for every reading. Both sides of a comparison are read with these, by the same version. */
export const OPTIONS = {
  allowJs: true,
  checkJs: true,
  // Iteration 4: declarations are written out (to memory only, never to disk) for the backstop of rule 18.
  noEmit: false,
  declaration: true,
  emitDeclarationOnly: true,
  strict: true,
  // On, so that the reader reads the comment kinds Object and object as written (with it off, it reads them as
  // "anything": found by the proof's change P09). Its complaints about unstated kinds are "I cannot tell", never
  // a disagreement: the check does not refuse them.
  noImplicitAny: true,
  useUnknownInCatchVariables: false,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  // The language's own library only; what the product uses of Node is described in node.d.ts (iteration 2: the
  // browser's description gave Node's timers the wrong kind).
  // The language library of the Node version the product runs on: 2023 (iteration 3), and the later parts Node 22 has
  // (iteration 4).
  lib: ['lib.es2023.d.ts', 'lib.esnext.object.d.ts', 'lib.esnext.collection.d.ts', 'lib.esnext.promise.d.ts', 'lib.esnext.array.d.ts', 'lib.esnext.string.d.ts'],
  types: [],
  skipLibCheck: true,
};

/** Reads the given files (and whatever they import) as one program. */
export const NODE_DESCRIPTION = fileURLToPath(new URL('./node.d.ts', import.meta.url));

export function makeProgram(files) {
  return ts.createProgram([...files, NODE_DESCRIPTION], OPTIONS);
}

/**
 * Iteration 4 (rule 18): a file's declared interface as TypeScript itself prints it, per exported name, with comments
 * removed and a plain constant's single value widened to its kind. "Kind.member" holds each member of a kind written as
 * an object type. Written to memory only.
 */
export function declarationsOf(program, file) {
  const sf = program.getSourceFile(file);
  if (!sf) return {};
  let text = '';
  program.emit(sf, (name, t) => { if (/\.d\.[mc]?ts$/.test(name)) text = t; }, undefined, true);
  const d = ts.createSourceFile('decl.d.ts', text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const printer = ts.createPrinter({ removeComments: true });
  const print = (n) => printer.printNode(ts.EmitHint.Unspecified, n, d).replace(/\s+/g, ' ').trim();
  const out = {};
  const add = (name, t) => { out[name] = out[name] ? `${out[name]} ${t}` : t; };
  for (const st of d.statements) {
    if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) && st.name) {
      add(st.name.text, print(st));
      const lit = ts.isTypeAliasDeclaration(st) && ts.isTypeLiteralNode(st.type) ? st.type.members : ts.isInterfaceDeclaration(st) ? st.members : null;
      for (const m of lit ?? []) if (m.name && (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name))) add(`${st.name.text}.${m.name.text}`, print(m));
    } else if (ts.isVariableStatement(st)) {
      for (const v of st.declarationList.declarations) {
        if (!ts.isIdentifier(v.name)) continue;
        let t = print(v);
        // a plain constant's single value is content, not a kind
        t = t.replace(/:\s*-?\d[\d_.eE+-]*$/, ': number').replace(/:\s*"[^"]*"$/, ': string').replace(/:\s*'[^']*'$/, ': string');
        add(v.name.text, t);
      }
    } else if (ts.isExportDeclaration(st) && st.exportClause && ts.isNamedExports(st.exportClause)) {
      for (const e of st.exportClause.elements) add(e.name.text, print(st));
    }
  }
  return out;
}

export const TS_VERSION = ts.version;

/**
 * The text of a comment's tag, whitespace made single. A bound line is read from the comment as written, up to the
 * next tag, so an @ inside its words does not cut it (iteration 4).
 */
export function tagText(tag) {
  if (tag.tagName?.text === 'bound') {
    const sf = tag.getSourceFile?.();
    if (sf) {
      const start = tag.tagName.end;
      const docEnd = (() => { let p = tag.parent; while (p && !ts.isJSDoc(p)) p = p.parent; return p ? p.end : sf.text.length; })();
      const out = [];
      sf.text.slice(start, docEnd).split('\n').forEach((l, i) => {
        if (out.done) return;
        let line = i === 0 ? l : l.replace(/^\s*\*(?!\/)\s?/, '');
        if (i > 0 && /^\s*@[a-zA-Z]/.test(line)) { out.done = true; return; } // the next tag
        const close = line.indexOf('*/');
        if (close >= 0) { line = line.slice(0, close); out.done = true; }
        out.push(line);
      });
      return out.join(' ').replace(/\s+/g, ' ').trim();
    }
  }
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
