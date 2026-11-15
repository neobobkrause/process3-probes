// Which entries of which providers a user module uses, worked out from the user's own code and comments
// (its source and its tests), never from a list kept by hand. Also: whether the tool can follow the user fully.
import path from 'node:path';
import { ts, lineOf, NODE_DESCRIPTION } from './ts.mjs';
import { carrierOf } from './carriers.mjs';

/**
 * @param program a program that holds the user's files
 * @param tree the product
 * @param listings Map module id -> listing (for entry ranges and operation tables)
 */
export function makeUsage(program, tree, listings) {
  const checker = program.getTypeChecker();

  // operation name -> { module, entry }
  const opOwner = new Map();
  const tableOwner = new Map();
  for (const [id, l] of listings) for (const e of Object.keys(l.entries)) {
    if (e.startsWith('op:')) opOwner.set(e.slice(3), { module: id, entry: e });
    if (e.startsWith('table:')) tableOwner.set(e.slice(6), { module: id, entry: e });
  }

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
    if (!sym) return true; // a name the reader cannot find
    const d = sym.declarations?.[0];
    if (!d) return true;
    if (d.getSourceFile().fileName === NODE_DESCRIPTION) return true; // Node's own names, as the tool describes them
    // Iteration 2: an error caught with catch is not a value of any provider.
    if (ts.isVariableDeclaration(d) && d.parent && ts.isCatchClause(d.parent)) return true;
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

  /**
   * Uses of other modules by one user module.
   * @returns {{ uses: Map<provider, Map<entry, {lines: string[], named: boolean}>>, anything: string[], unreadOps: string[], undeclared: string[] }}
   */
  function usesOf(mod) {
    const uses = new Map();
    const anything = [];
    const unreadOps = [];
    const unreadTables = [];
    const add = (target, node, named, asValue = false) => {
      if (!target || target.module === mod.id) return;
      if (!uses.has(target.module)) uses.set(target.module, new Map());
      const m = uses.get(target.module);
      if (!m.has(target.entry)) m.set(target.entry, { lines: [], named: false });
      const u = m.get(target.entry);
      const at = `${path.relative(tree.root, node.getSourceFile().fileName)}:${lineOf(node)}`;
      if (!u.lines.includes(at)) u.lines.push(at);
      if (named) u.named = true;
      if (asValue) u.asValue = true;
    };
    const fromSymbol = (sym, node) => {
      if (!sym) return;
      if (sym.flags & ts.SymbolFlags.Alias) {
        try { sym = checker.getAliasedSymbol(sym); } catch { return; }
      }
      for (const d of sym.declarations ?? []) {
        if (d.getSourceFile().isDeclarationFile) continue;
        const target = entryOf(d);
        if (target) add(target, node, ts.isIdentifier(node) && target.entry.split('.')[0] === node.text, ts.isIdentifier(node) && handedOnAsValue(node, d));
      }
    };
    const isAny = (n) => !!(checker.getTypeAtLocation(n).flags & ts.TypeFlags.Any);
    /** Iteration 2: a function named where it is not called (handed to map, kept in a variable) is handed on as a value. */
    function handedOnAsValue(node, decl) {
      if (!(ts.isFunctionDeclaration(decl) || (ts.isVariableDeclaration(decl) && decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))))) return false;
      let n = node;
      while (n.parent && (ts.isPropertyAccessExpression(n.parent) && n.parent.name === n)) n = n.parent;
      const p = n.parent;
      if (!p) return false;
      if ((ts.isCallExpression(p) || ts.isNewExpression(p)) && p.expression === n) return false;
      if (ts.isImportSpecifier(p) || ts.isExportSpecifier(p) || ts.isImportClause(p) || ts.isNamespaceImport(p)) return false;
      for (let q = p; q; q = q.parent) if (q.kind >= ts.SyntaxKind.FirstJSDocNode && q.kind <= ts.SyntaxKind.LastJSDocNode) return false;
      return true;
    }
    /** Iteration 2: a value handed where a provider's kind is expected uses the members of that kind it fills. */
    function matchMembers(valueNode, expected, built = false) {
      if (!expected || expected.flags & ts.TypeFlags.Any) return;
      const vt = checker.getTypeAtLocation(valueNode);
      if (vt.flags & ts.TypeFlags.Any) return;
      // A provider's own object passed along (the store from createStore handed to createRooms) is not built by
      // this user: it fills nothing of its own. Objects merged with ... are built here.
      if (!built) for (const sym of [vt.aliasSymbol, vt.symbol]) for (const d of sym?.declarations ?? []) {
        const m = tree.moduleOfFile(d.getSourceFile().fileName);
        if (m && m !== mod.id) return;
      }
      for (const want of expected.flags & ts.TypeFlags.Union ? expected.types : [expected]) {
        if (!(want.flags & ts.TypeFlags.Object)) continue;
        for (const p of checker.getPropertiesOfType(vt)) {
          const wp = checker.getPropertyOfType(want, p.name);
          if (wp) fromSymbol(wp, valueNode);
        }
      }
    }

    const visit = (node) => {
      if (ts.isIdentifier(node)) {
        fromSymbol(checker.getSymbolAtLocation(node), node);
      } else if (ts.isObjectLiteralExpression(node)) {
        const ct = checker.getContextualType(node);
        if (ct) {
          for (const p of node.properties) {
            if (ts.isSpreadAssignment(p)) { matchMembers(p.expression, ct, true); continue; }
            if (!p.name || !(ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) continue;
            for (const member of ct.flags & ts.TypeFlags.Union ? ct.types : [ct]) {
              const ps = checker.getPropertyOfType(member, p.name.text);
              if (ps) {
                fromSymbol(ps, p.name);
                // the value given for this field, matched against the field's kind
                const valueNode = ts.isShorthandPropertyAssignment(p) ? p.name : ts.isPropertyAssignment(p) ? p.initializer : null;
                if (valueNode && !ts.isObjectLiteralExpression(valueNode)) matchMembers(valueNode, checker.getTypeOfSymbolAtLocation(ps, p));
              }
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
      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        const c = ts.isCallExpression(node) ? carrierOf(checker, node) : undefined;
        const at = `${path.relative(tree.root, node.getSourceFile().fileName)}:${lineOf(node)}`;
        if (c?.kind === 'op') {
          if (c.names === null) unreadOps.push(at);
          else for (const op of c.names) add(opOwner.get(op) ?? { module: '(no such operation)', entry: `op:${op}` }, node, true);
        } else if (c?.kind === 'table') {
          if (c.names === null) unreadTables.push(at);
          else for (const t of c.names) if (tableOwner.has(t)) add(tableOwner.get(t), node, true);
        }
        // Iteration 2: each argument that is not written out in place, matched against the kind expected there.
        let sig;
        try { sig = checker.getResolvedSignature(node); } catch { sig = undefined; }
        (node.arguments ?? []).forEach((arg, i) => {
          if (ts.isObjectLiteralExpression(arg) || ts.isStringLiteral(arg) || ts.isNumericLiteral(arg) || ts.isTemplateExpression(arg)) return;
          const p = sig?.getParameters()[i];
          if (p) matchMembers(arg, checker.getTypeOfSymbolAtLocation(p, node));
        });
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
    return { uses, anything: [...new Set(anything)], unreadOps, unreadTables, undeclared };
  }

  return { usesOf };
}
