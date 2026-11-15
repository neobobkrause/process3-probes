// Which entries of which providers a user module uses, worked out from the user's own code and comments
// (its source and its tests), never from a list kept by hand. Also: whether the tool can follow the user fully.
import path from 'node:path';
import { ts, tagsOf, tagText, lineOf } from './ts.mjs';

/**
 * @param program a program that holds the user's files
 * @param tree the product
 * @param listings Map module id -> listing (for entry ranges and operation tables)
 */
export function makeUsage(program, tree, listings) {
  const checker = program.getTypeChecker();

  // operation name -> { module, entry }
  const opOwner = new Map();
  for (const [id, l] of listings) for (const e of Object.keys(l.entries)) if (e.startsWith('op:')) opOwner.set(e.slice(3), { module: id, entry: e });

  /** The entry a declaration belongs to: the smallest range of a listed entry that holds it. */
  function entryOf(decl) {
    const sf = decl.getSourceFile();
    const mod = tree.moduleOfFile(sf.fileName);
    if (!mod) return null;
    const l = listings.get(mod);
    if (!l) return null;
    // Locate a declaration by its name, so a kind is not mistaken for its last member.
    const at = (decl.name ?? decl).end - 1;
    let best = null;
    for (const r of l.ranges) {
      if (r.file !== sf.fileName || r.start > at || r.end <= at) continue;
      if (!best || r.end - r.start < best.end - best.start) best = r;
    }
    return best ? { module: mod, entry: best.entry } : null;
  }

  /** Is this "anything" value one that comes from outside the product (Node's own modules, unresolved globals)? */
  function externalRoot(expr, depth = 0) {
    if (depth > 6) return false;
    let e = expr;
    for (;;) {
      if (ts.isPropertyAccessExpression(e) || ts.isElementAccessExpression(e) || ts.isCallExpression(e) || ts.isNewExpression(e)) e = e.expression;
      else if (ts.isParenthesizedExpression(e) || ts.isAwaitExpression(e) || ts.isNonNullExpression(e) || ts.isAsExpression(e)) e = e.expression;
      else break;
    }
    if (!ts.isIdentifier(e)) return false;
    const sym = checker.getSymbolAtLocation(e);
    if (!sym) return true; // a name the reader cannot find, such as Node's process
    const d = sym.declarations?.[0];
    if (!d) return true;
    if (sym.flags & ts.SymbolFlags.Alias) {
      const imp = findAncestor(d, (n) => ts.isImportDeclaration(n) || ts.isJSDocImportTag?.(n));
      const spec = imp?.moduleSpecifier && ts.isStringLiteral(imp.moduleSpecifier) ? imp.moduleSpecifier.text : '';
      return !spec.startsWith('.');
    }
    if (ts.isParameter(d)) {
      // a parameter of a callback handed straight to something from outside the product
      const fn = d.parent;
      const call = fn?.parent;
      if (call && (ts.isCallExpression(call) || ts.isNewExpression(call)) && call.arguments?.includes(fn)) return externalRoot(call.expression, depth + 1);
      return false;
    }
    if (ts.isVariableDeclaration(d) && d.initializer) return externalRoot(d.initializer, depth + 1);
    if (ts.isBindingElement(d)) {
      const decl = findAncestor(d, ts.isVariableDeclaration);
      if (decl?.initializer) return externalRoot(decl.initializer, depth + 1);
    }
    return false;
  }

  function findAncestor(n, pred) {
    for (let p = n; p; p = p.parent) if (pred(p)) return p;
    return null;
  }

  /** Is this call carried by a door that calls by name? If so, the operation names it selects (or null if unreadable). */
  function carriedOps(call) {
    const sig = checker.getResolvedSignature(call);
    const decl = sig?.declaration;
    if (!decl) return undefined;
    // The carrier is a member of a kind whose comment says @carriesop <member names>, or a function tagged @carriesop.
    const prop = findAncestor(decl, (n) => ts.isJSDocPropertyTag(n) || ts.isPropertySignature(n) || ts.isFunctionDeclaration(n));
    if (!prop) return undefined;
    let carries = false;
    if (ts.isFunctionDeclaration(prop)) carries = tagsOf(prop, 'carriesop').length > 0;
    else {
      const td = findAncestor(prop, (n) => ts.isJSDocTypedefTag(n));
      const memberName = prop.name?.getText?.() ?? prop.name?.escapedText;
      if (td) for (const tag of tagsOf(td, 'carriesop')) if (tagText(tag).split(/[\s,]+/).includes(String(memberName))) carries = true;
    }
    if (!carries) return undefined;
    const p0 = sig.getParameters()[0];
    if (!p0) return null;
    const t = checker.getTypeOfSymbolAtLocation(p0, call);
    const names = [];
    for (const m of t.flags & ts.TypeFlags.Union ? t.types : [t]) {
      if (m.flags & ts.TypeFlags.StringLiteral) {
        const v = m.value.startsWith('op=') ? /^op=([A-Za-z0-9_]+)/.exec(m.value)?.[1] : m.value;
        if (!v) return null;
        names.push(v);
      } else if (m.flags & ts.TypeFlags.TemplateLiteral) {
        const v = /^op=([A-Za-z0-9_]+)&/.exec(m.texts[0])?.[1];
        if (!v) return null;
        names.push(v);
      } else return null; // the name is not written where the tool can read it
    }
    return names;
  }

  /**
   * Uses of other modules by one user module.
   * @returns {{ uses: Map<provider, Map<entry, {lines: string[], named: boolean}>>, anything: string[], unreadOps: string[], undeclared: string[] }}
   */
  function usesOf(mod) {
    const uses = new Map();
    const anything = [];
    const unreadOps = [];
    const add = (target, node, named) => {
      if (!target || target.module === mod.id) return;
      if (!uses.has(target.module)) uses.set(target.module, new Map());
      const m = uses.get(target.module);
      if (!m.has(target.entry)) m.set(target.entry, { lines: [], named: false });
      const u = m.get(target.entry);
      const at = `${path.relative(tree.root, node.getSourceFile().fileName)}:${lineOf(node)}`;
      if (!u.lines.includes(at)) u.lines.push(at);
      if (named) u.named = true;
    };
    const fromSymbol = (sym, node) => {
      if (!sym) return;
      if (sym.flags & ts.SymbolFlags.Alias) {
        try { sym = checker.getAliasedSymbol(sym); } catch { return; }
      }
      for (const d of sym.declarations ?? []) {
        if (d.getSourceFile().isDeclarationFile) continue;
        const target = entryOf(d);
        if (target) add(target, node, ts.isIdentifier(node) && target.entry.split('.')[0] === node.text);
      }
    };
    const isAny = (n) => !!(checker.getTypeAtLocation(n).flags & ts.TypeFlags.Any);

    const visit = (node) => {
      if (ts.isIdentifier(node)) {
        fromSymbol(checker.getSymbolAtLocation(node), node);
      } else if (ts.isObjectLiteralExpression(node)) {
        const ct = checker.getContextualType(node);
        if (ct) {
          for (const p of node.properties) {
            if (!p.name || !(ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) continue;
            for (const member of ct.flags & ts.TypeFlags.Union ? ct.types : [ct]) {
              const ps = checker.getPropertyOfType(member, p.name.text);
              if (ps) fromSymbol(ps, p.name);
            }
          }
        }
      } else if (ts.isObjectBindingPattern(node)) {
        const t = checker.getTypeAtLocation(node);
        for (const el of node.elements) {
          const nm = el.propertyName ?? el.name;
          if (ts.isIdentifier(nm)) { const ps = checker.getPropertyOfType(t, nm.text); if (ps) fromSymbol(ps, nm); }
        }
      }
      if (ts.isCallExpression(node)) {
        const ops = carriedOps(node);
        if (ops === null) unreadOps.push(`${path.relative(tree.root, node.getSourceFile().fileName)}:${lineOf(node)}`);
        else if (ops) for (const op of ops) add(opOwner.get(op) ?? { module: '(no such operation)', entry: `op:${op}` }, node, true);
      }
      // "anything" that is read from or called: the tool cannot tell what it is
      if ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node) || ts.isCallExpression(node)) && !ts.isImportCall?.(node)) {
        const target = node.expression;
        if (target.kind !== ts.SyntaxKind.SuperKeyword && isAny(target) && !externalRoot(target)) {
          anything.push(`${path.relative(tree.root, node.getSourceFile().fileName)}:${lineOf(node)} ${target.getText().slice(0, 40)}`);
        }
      }
      for (const d of node.jsDoc ?? []) ts.forEachChild(d, visit);
      ts.forEachChild(node, visit);
    };
    for (const f of mod.files) {
      const sf = program.getSourceFile(f);
      if (sf) visit(sf);
    }
    const undeclared = [...uses.keys()].filter((p) => !mod.uses.includes(p));
    return { uses, anything: [...new Set(anything)], unreadOps, undeclared };
  }

  return { usesOf };
}
