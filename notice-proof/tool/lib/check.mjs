// The check, run inside one module's own tests and on that module only:
//   (a) refuses a comment that disagrees with the module's own code;
//   (b) refuses code that disagrees with a provider's stated interface;
// and never refuses where the reader merely cannot tell. Also: the comments-only verification of a first step.
import fs from 'node:fs';
import path from 'node:path';
import { ts, makeProgram, tagsOf, tagText } from './ts.mjs';
import { carrierOf } from './carriers.mjs';

/**
 * Complaints that mean "I cannot tell", never a disagreement. Decided here:
 * - a module from outside the product that the reader has no description of (Node's own modules: no type
 *   descriptions are installed, by design, since TypeScript is the only development dependency);
 * - Node's own global names (process, Buffer) for the same reason.
 */
const CANNOT_TELL = new Map([
  [2307, 'a module from outside the product that the reader has no description of'],
  [7016, 'a module from outside the product that the reader has no description of'],
  [2580, "Node's own global names, which the reader has no description of"],
  [2591, "Node's own global names, which the reader has no description of"],
  [2867, "Node's own global names, which the reader has no description of"],
  [2868, "Node's own global names, which the reader has no description of"],
]);

/** The reader's complaints that a kind is not stated (its codes 7000 to 7099): "I cannot tell". */
const isUnstatedKind = (code) => code >= 7000 && code < 7100;

function where(d, root) {
  if (!d.file) return '(no file)';
  const { line } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
  return `${path.relative(root, d.file.fileName)}:${line + 1}`;
}

function nodeAt(sf, pos) {
  let found = sf;
  const visit = (n) => {
    if (n.getStart(sf) <= pos && pos < n.end) {
      found = n;
      ts.forEachChild(n, visit);
    }
  };
  ts.forEachChild(sf, visit);
  return found;
}

/**
 * @param tree the product
 * @param moduleId the module whose own tests run this check
 */
/** Every kind marked @storedrows or @message in the product's source, found by reading the comments alone. */
function markedKinds(tree) {
  const out = [];
  for (const mod of tree.modules) for (const f of mod.src) {
    const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
    walk(sf, (n) => {
      for (const doc of n.jsDoc ?? []) for (const tag of doc.tags ?? []) {
        if (!ts.isJSDocTypedefTag(tag) || !tag.name) continue;
        const tables = tagsOf(tag, 'storedrows').map((t) => tagText(t).split(/\s+/)[0]);
        const channels = tagsOf(tag, 'message').map((t) => tagText(t).split(/\s+/)[0]);
        if (tables.length || channels.length) out.push({ module: mod.id, file: f, name: tag.name.text, tables, channels });
      }
    });
  }
  return out;
}

const POSSIBLY_UNDEFINED = new Set([2532, 2533, 18047, 18048, 18049]);
const MEMBERSHIP = new Set(['includes', 'indexOf', 'lastIndexOf', 'has']);

function walk(n, f) { f(n); ts.forEachChild(n, (c) => walk(c, f)); }
function within(node, outer) { return node.pos >= outer.pos && node.end <= outer.end; }
const lineAt = (sf, node, root) => `${path.relative(root, sf.fileName)}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`;

/**
 * @param tree the product
 * @param moduleId the module whose own tests run this check
 */
export function check(tree, moduleId) {
  const mod = tree.byId.get(moduleId);
  if (!mod) throw new Error(`no such module: ${moduleId}`);
  const program = makeProgram(mod.files);
  const checker = program.getTypeChecker();
  const refusals = [];
  const cannotTell = [];
  const moduleOfDecl = (decl) => tree.moduleOfFile(decl.getSourceFile().fileName);

  // Kinds marked in comments, in every module of the product: rows of tables (@storedrows) and messages (@message).
  const marks = markedKinds(tree);
  const rowKinds = new Map();
  for (const m of marks) for (const table of m.tables) rowKinds.set(table, m);
  const markOf = (t) => {
    for (const sym of [t.aliasSymbol, t.symbol]) for (const d of sym?.declarations ?? []) {
      const m = marks.find((x) => x.file === d.getSourceFile().fileName && x.name === (d.name?.text ?? sym.name));
      if (m) return m;
    }
    return null;
  };
  const messageChannelsOf = (t) => { const m = markOf(t); return m && m.channels.length ? m.channels : null; };
  const rowTypeOf = (owner) => {
    const sf = program.getSourceFile(owner.file);
    let found;
    if (sf) walk(sf, (n) => { for (const doc of n.jsDoc ?? []) for (const tag of doc.tags ?? []) if (ts.isJSDocTypedefTag(tag) && tag.name?.text === owner.name) { const sym = checker.getSymbolAtLocation(tag.name) ?? tag.symbol; if (sym) found = checker.getDeclaredTypeOfSymbol(sym); } });
    return found;
  };

  for (const f of mod.files) {
    const sf = program.getSourceFile(f);
    if (!sf) continue;
    const isTest = mod.tests.includes(f);

    // Calls by a name the reader cannot read: "cannot tell" for the call and for the uses of its answer.
    const unreadCalls = [];
    walk(sf, (n) => { if (ts.isCallExpression(n)) { const c = carrierOf(checker, n); if (c?.kind === 'op' && c.names === null) unreadCalls.push(n); } });
    const fromUnread = (node, depth = 0) => {
      if (!unreadCalls.length || depth > 4) return false;
      if (unreadCalls.some((c) => within(node, c))) return true;
      let e = node;
      while (e && (ts.isPropertyAccessExpression(e) || ts.isElementAccessExpression(e) || ts.isCallExpression(e) || ts.isAwaitExpression(e) || ts.isParenthesizedExpression(e))) e = e.expression;
      if (!e || !ts.isIdentifier(e)) return false;
      const s = checker.getSymbolAtLocation(e);
      const d = s?.declarations?.[0];
      if (!d) return false;
      const vd = ts.isBindingElement(d) ? d.parent?.parent : d;
      if (vd && ts.isVariableDeclaration(vd) && vd.initializer) return unreadCalls.some((c) => within(c, vd.initializer)) || fromUnread(vd.initializer, depth + 1);
      return false;
    };

    for (const d of [...program.getSyntacticDiagnostics(sf), ...program.getSemanticDiagnostics(sf)]) {
      const text = ts.flattenDiagnosticMessageText(d.messageText, ' ');
      const at = where(d, tree.root);
      const node = nodeAt(sf, d.start ?? 0);
      // A missing name of a closed set of names is a real disagreement, though the reader files it with the unstated kinds.
      if (isUnstatedKind(d.code) && !(d.code === 7053 && /Property '[^']+' does not exist on type/.test(text))) {
        cannotTell.push({ at, code: d.code, why: 'a kind that no comment states', text });
        continue;
      }
      if (CANNOT_TELL.has(d.code) && !(d.code === 2307 && /['"]\.\.?\//.test(text))) {
        cannotTell.push({ at, code: d.code, why: CANNOT_TELL.get(d.code), text });
        continue;
      }
      let expr = node;
      while (expr.parent && !ts.isStatement(expr.parent) && !ts.isCallExpression(expr)) expr = expr.parent;
      if (fromUnread(node) || (ts.isCallExpression(expr) && unreadCalls.includes(expr))) {
        cannotTell.push({ at, code: d.code, why: 'a call by a name the reader cannot read, or the use of its answer', text });
        continue;
      }
      // Asking a list or set whether it holds a value wider than its own kind: the reader types it too narrowly.
      const call = ts.isCallExpression(node.parent?.parent) ? node.parent.parent : ts.isCallExpression(node.parent) ? node.parent : null;
      if (d.code === 2345 && call && ts.isPropertyAccessExpression(call.expression) && MEMBERSHIP.has(call.expression.name.text)) {
        cannotTell.push({ at, code: d.code, why: 'a membership question the reader types too narrowly', text });
        continue;
      }
      // Which kind of disagreement: does the statement name, or hold a value of, anything declared in another module?
      let stmt = node;
      while (stmt.parent && !ts.isStatement(stmt) && !ts.isSourceFile(stmt.parent) && !ts.isJSDoc(stmt)) stmt = stmt.parent;
      const others = new Set();
      const noteDecls = (decls) => { for (const decl of decls ?? []) { const m = moduleOfDecl(decl); if (m && m !== moduleId) others.add(m); } };
      walk(stmt, (n) => {
        if (!ts.isIdentifier(n)) return;
        let s = checker.getSymbolAtLocation(n);
        if (s && s.flags & ts.SymbolFlags.Alias) { try { s = checker.getAliasedSymbol(s); } catch { s = undefined; } }
        noteDecls(s?.declarations);
        const t = checker.getTypeAtLocation(n);
        noteDecls(t.aliasSymbol?.declarations); noteDecls(t.symbol?.declarations);
        for (const u of t.flags & ts.TypeFlags.Union ? t.types : []) { noteDecls(u.aliasSymbol?.declarations); noteDecls(u.symbol?.declarations); }
      });
      for (const r of d.relatedInformation ?? []) { const m = r.file && tree.moduleOfFile(r.file.fileName); if (m && m !== moduleId) others.add(m); }
      // "Possibly undefined" about a value that comes only from the module's own code: the reader cannot tell.
      if (POSSIBLY_UNDEFINED.has(d.code) && !others.size) {
        cannotTell.push({ at, code: d.code, why: "a value of the module's own that may be missing, guarded where the reader cannot see", text });
        continue;
      }
      refusals.push({
        at, code: d.code, text,
        kind: others.size ? `(b) code disagrees with the stated interface of ${[...others].join(', ')}` : `(a) a comment disagrees with ${isTest ? "this module's tests" : "this module's code"}`,
      });
    }

    // Rules of form, iteration 2.
    walk(sf, (n) => {
      if (!ts.isCallExpression(n)) return;
      // (c) Rows of a shared table: only its owner writes them, and only rows of its kind.
      const c = carrierOf(checker, n);
      if (c?.kind === 'table' && c.member === 'put' && c.names) {
        for (const table of c.names) {
          const owner = rowKinds.get(table);
          if (!owner) continue;
          if (owner.module !== moduleId) {
            refusals.push({ at: lineAt(sf, n, tree.root), code: 'rows', text: `writes rows of table '${table}', which belong to ${owner.module}`, kind: '(c) a rule of form: a table is written only by its owner' });
            continue;
          }
          const valueIndex = c.sig.getParameters().findIndex((p) => p.name === 'value');
          const arg = n.arguments[valueIndex >= 0 ? valueIndex : 2];
          const rowType = rowTypeOf(owner);
          if (arg && rowType && !checker.isTypeAssignableTo(checker.getTypeAtLocation(arg), rowType)) {
            refusals.push({ at: lineAt(sf, n, tree.root), code: 'rows', text: `writes into table '${table}' a value that is not a ${owner.name}`, kind: '(c) a rule of form: rows of a table are of its stated kind' });
          }
        }
      }
      // (c) Messages between running parts are read and written with a kind their sender publishes (@message).
      const callee = n.expression;
      const isJson = (name) => ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && callee.expression.text === 'JSON' && callee.name.text === name;
      if (isJson('parse')) {
        const a0 = n.arguments[0];
        if (a0 && ts.isCallExpression(a0) && ts.isPropertyAccessExpression(a0.expression) && a0.expression.name.text === 'stringify') return; // a copy, not a message
        let p = n.parent;
        while (p && ts.isParenthesizedExpression(p) && !ts.getJSDocType(p)) p = p.parent;
        const typeNode = (p && (ts.isParenthesizedExpression(p) || ts.isVariableDeclaration(p)) && (ts.getJSDocType(p) ?? (ts.isVariableDeclaration(p) ? ts.getJSDocType(p.parent.parent) : undefined))) || undefined;
        const ok = typeNode && messageChannelsOf(checker.getTypeFromTypeNode(typeNode));
        if (!ok) refusals.push({ at: lineAt(sf, n, tree.root), code: 'message', text: 'a message is read without a kind its sender publishes (@message)', kind: '(c) a rule of form: a message is read with its sender\'s kind' });
      }
      if (isJson('stringify')) {
        // Written to a standard stream? Find the call that writes it.
        let w = n.parent;
        while (w && !(ts.isCallExpression(w) && ts.isPropertyAccessExpression(w.expression) && ['write', 'end'].includes(w.expression.name.text))) { if (ts.isStatement(w)) { w = null; break; } w = w.parent; }
        if (!w) return;
        // Every stream the target may be (a stream chosen at run time names each of them) must be one of the
        // channels the message's kind is published for.
        const streams = [...new Set(w.expression.expression.getText(sf).match(/\b(stdout|stderr|stdin)\b/g) ?? [])];
        if (!streams.length) return;
        const a0 = n.arguments[0];
        const channels = a0 ? messageChannelsOf(checker.getTypeAtLocation(a0)) : null;
        const wrong = streams.filter((x) => !channels || !channels.includes(x));
        if (wrong.length) {
          refusals.push({ at: lineAt(sf, n, tree.root), code: 'message', text: `a message written to ${wrong.join(' and ')} ${channels ? `has a kind published for ${channels.join(', ')}` : 'has no kind its sender publishes'}`, kind: '(c) a rule of form: a message is written with its kind, on its channel' });
        }
      }
    });
  }

  // (d) Every bound line has a test named for it, and every test named for a bound has its line.
  const lines = new Set();
  for (const f of mod.src) {
    const sf = program.getSourceFile(f);
    if (sf) walk(sf, (n) => { for (const doc of n.jsDoc ?? []) for (const tag of doc.tags ?? []) if (tag.tagName.text === 'bound') lines.add(tagText(tag)); });
  }
  const tests = boundTests(mod);
  for (const l of lines) if (!tests.has(l)) refusals.push({ at: moduleId, code: 'bound', text: `no test named 'bound ${l}'`, kind: '(d) a rule of form: each bound has a test named for it' });
  for (const [t, x] of tests) if (!lines.has(t)) refusals.push({ at: `${moduleId}/test/${x.at}`, code: 'bound', text: `a test named 'bound ${t}' has no bound line`, kind: '(d) a rule of form: each bound has a test named for it' });
  return { module: moduleId, refused: refusals.length > 0, refusals, cannotTell };
}

// ---- comments-only verification ----

/** A file's running code as a tree with comments and grouping parentheses left out. */
function shape(file) {
  const text = fs.readFileSync(file, 'utf8');
  return shapeOfNode(ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS));
}

/** The tests of a module named for a bound: "bound <words>" -> the shape of the test's code. */
export function boundTests(mod) {
  const out = new Map();
  for (const f of mod.tests) {
    const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
    const visit = (n) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'test') {
        const a0 = n.arguments[0];
        if (a0 && (ts.isStringLiteral(a0) || ts.isNoSubstitutionTemplateLiteral(a0)) && /^bound\s/.test(a0.text)) {
          out.set(a0.text.replace(/^bound\s+/, '').replace(/\s+/g, ' ').trim(), { shape: shapeOfNode(n), at: `${path.basename(f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}` });
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return out;
}

function shapeOfNode(root) {
  const out = [];
  const visit = (n) => {
    if (ts.isParenthesizedExpression(n)) return visit(n.expression);
    if (n.kind >= ts.SyntaxKind.FirstJSDocNode && n.kind <= ts.SyntaxKind.LastJSDocNode) return;
    let leaf = '';
    if (ts.isIdentifier(n) || ts.isPrivateIdentifier(n)) leaf = n.text;
    else if (ts.isStringLiteral(n) || ts.isNumericLiteral(n) || ts.isBigIntLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isRegularExpressionLiteral(n)) leaf = n.text;
    else if (n.kind === ts.SyntaxKind.TemplateHead || n.kind === ts.SyntaxKind.TemplateMiddle || n.kind === ts.SyntaxKind.TemplateTail) leaf = n.text;
    const chain = n.flags & ts.NodeFlags.OptionalChain ? '?' : '';
    out.push(`(${n.kind}${chain}${leaf ? ':' + JSON.stringify(leaf) : ''}`);
    ts.forEachChild(n, visit);
    // Tokens such as operators are not children in the tree: keep them.
    if (ts.isBinaryExpression(n)) out.push(`op${n.operatorToken.kind}`);
    if (ts.isPrefixUnaryExpression(n) || ts.isPostfixUnaryExpression(n)) out.push(`op${n.operator}`);
    if (ts.isVariableDeclarationList(n)) out.push(`decl${n.flags & ts.NodeFlags.BlockScoped}`);
    out.push(')');
  };
  visit(root);
  return out.join('');
}

/**
 * Did a change to one module touch comments only? Compares each file's running code with comments and grouping
 * parentheses left out (a parenthesis added around a value to attach a kind to it changes nothing that runs).
 */
export function commentsOnly(beforeTree, afterTree, moduleId) {
  const mb = beforeTree.byId.get(moduleId), ma = afterTree.byId.get(moduleId);
  const rel = (m, t) => m.files.map((f) => path.relative(t.root, f)).sort();
  const fb = rel(mb, beforeTree), fa = rel(ma, afterTree);
  const files = [];
  let ok = JSON.stringify(fb) === JSON.stringify(fa);
  for (const f of new Set([...fb, ...fa])) {
    const pb = path.join(beforeTree.root, f), pa = path.join(afterTree.root, f);
    if (!fs.existsSync(pb) || !fs.existsSync(pa)) { files.push({ file: f, same: false, why: 'file added or removed' }); ok = false; continue; }
    const same = shape(pb) === shape(pa);
    const textSame = fs.readFileSync(pb, 'utf8') === fs.readFileSync(pa, 'utf8');
    files.push({ file: f, same, textChanged: !textSame });
    if (!same) ok = false;
  }
  return { module: moduleId, same: ok, files };
}
