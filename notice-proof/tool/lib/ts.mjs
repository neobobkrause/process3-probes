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
  resolveJsonModule: true, // iteration 5: the reader reads JSON modules
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
export function declarationsOf(program, file, plainElsewhere = new Map()) {
  const sf = program.getSourceFile(file);
  if (!sf) return {};
  let text = '';
  program.emit(sf, (name, t) => { if (/\.d\.[mc]?ts$/.test(name)) text = t; }, undefined, true);
  const parsed = ts.createSourceFile('decl.d.ts', text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  // Iteration 5: a parameter's name or written shape ({ store } or deps) is not part of the interface.
  const unname = (ctx) => (root) => {
    const memberName = (m) => (m.name && (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name)) ? m.name.text : '');
    const visit = (n) => {
      // Replay change R2: a class member with a private name (#name, printed "__#54@#name" with the reader's serial
      // number when it is static) is not part of the interface and is left out of the printed declaration.
      if (ts.isClassElement(n) && n.name && (ts.isPrivateIdentifier(n.name) || ((ts.isStringLiteral(n.name) || ts.isIdentifier(n.name)) && /^__#\d*@#/.test(n.name.text)))) return undefined;
      if (ts.isParameter(n)) return ts.factory.updateParameterDeclaration(n, n.modifiers, n.dotDotDotToken, ts.factory.createIdentifier('_'), n.questionToken, n.type ? ts.visitNode(n.type, visit) : n.type, undefined);
      // Iteration 6: an object kind's fields in a fixed order
      if (ts.isTypeLiteralNode(n)) { const v = ts.visitEachChild(n, visit, ctx); return ts.factory.updateTypeLiteralNode(v, ts.factory.createNodeArray([...v.members].sort((a, b) => (memberName(a) < memberName(b) ? -1 : memberName(a) > memberName(b) ? 1 : 0)))); }
      return ts.visitEachChild(n, visit, ctx);
    };
    return ts.visitNode(root, visit);
  };
  const d = ts.transform(parsed, [unname]).transformed[0];
  const printer = ts.createPrinter({ removeComments: true });
  // Replay change R2: the reader's serial numbers in symbol names are not part of a kind.
  const print = (n) => printer.printNode(ts.EmitHint.Unspecified, n, d).replace(/\s+/g, ' ').trim().replace(/__#\d+@/g, '__#@').replace(/(__@[A-Za-z_$][\w$]*)@\d+/g, '$1');
  // Iteration 5: kinds of this module that are unions or plain kinds are written out where they are used.
  const plainKinds = new Map();
  for (const st of d.statements) if (ts.isTypeAliasDeclaration(st) && !ts.isTypeLiteralNode(st.type) && !ts.isMappedTypeNode(st.type) && !st.typeParameters) plainKinds.set(st.name.text, printer.printNode(ts.EmitHint.Unspecified, st.type, d).replace(/\s+/g, ' ').trim());
  const out = {};
  const add = (name, t) => { out[name] = out[name] ? `${out[name]} ${t}` : t; };
  for (const st of d.statements) {
    if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) && st.name) {
      add(st.name.text, print(st));
      // Replay change 1: a private member (#name) is not part of the interface; its printed marker is left out too.
      if (ts.isClassDeclaration(st)) for (const m of st.members) if (m.name && ts.isIdentifier(m.name)) {
        const isStatic = (ts.getCombinedModifierFlags(m) & ts.ModifierFlags.Static) !== 0;
        add(`${st.name.text}${isStatic ? '.' : '#'}${m.name.text}`, print(m));
      }
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
  const unbracket = (t) => { let prev; do { prev = t; t = t.replace(/\(([^()]*\|[^()]*)\)/g, '$1'); } while (t !== prev); return t; };
  for (const k of Object.keys(out)) {
    // a plain kind of another module, named through import("..."), is written out too
    const wrap = (rhs) => (/[|&]|=>/.test(rhs) ? `(${rhs})` : rhs); // iteration 6: brackets only where they matter
    out[k] = out[k].replace(/import\("[^"]+"\)\.([A-Za-z_$][\w$]*)/g, (m, name) => (plainElsewhere.has(name) ? wrap(plainElsewhere.get(name)) : name)); // iteration 7: by its name alone, as @import writes it
    for (const [name, rhs] of plainKinds) if (k !== name) out[k] = out[k].replace(new RegExp(`\\b${name}\\b`, 'g'), wrap(rhs));
    out[k] = unbracket(out[k]);
  }
  Object.defineProperty(out, '__plain', { value: plainKinds, enumerable: false });
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
