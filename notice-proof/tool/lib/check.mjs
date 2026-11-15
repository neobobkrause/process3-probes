// The check, run inside one module's own tests and on that module only:
//   (a) refuses a comment that disagrees with the module's own code;
//   (b) refuses code that disagrees with a provider's stated interface;
// and never refuses where the reader merely cannot tell. Also: the comments-only verification of a first step.
import fs from 'node:fs';
import path from 'node:path';
import { ts, makeProgram, tagsOf, tagText } from './ts.mjs';
import { carrierOf } from './carriers.mjs';
import { throwKinds } from './listing.mjs';

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

function isInsideComment(sf, pos) {
  for (const r of [...(ts.getLeadingCommentRanges(sf.text, 0) ?? [])]) if (pos >= r.pos && pos < r.end) return true;
  // a position inside /** ... */ anywhere
  const before = sf.text.lastIndexOf('/*', pos), close = sf.text.lastIndexOf('*/', pos);
  return before >= 0 && before > close;
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
  // the channels of the value an expression writes: its kind where it is used, or, when the reader has narrowed it to
  // one member of a message kind, the kind its variable is declared with (iteration 6, found on V03)
  const channelsOfValue = (x) => {
    const here = messageChannelsOf(checker.getTypeAtLocation(x));
    if (here || !ts.isIdentifier(x)) return here;
    const s = checker.getSymbolAtLocation(x);
    const d = s?.declarations?.[0];
    if (d && ts.isVariableDeclaration(d)) { const tn = ts.getJSDocType(d) ?? ts.getJSDocType(d.parent.parent); if (tn) return messageChannelsOf(checker.getTypeFromTypeNode(tn)); }
    return s ? messageChannelsOf(checker.getTypeOfSymbol(s)) : null;
  };
  const productKind = (t) => [t.aliasSymbol, t.symbol].some((sym) => sym && !sym.name.startsWith('__') && (sym.declarations ?? []).some((d) => moduleOfDecl(d) && (ts.isJSDocTypedefTag(d) || ts.isTypeAliasDeclaration(d))));
  const kindName = (t) => (t.aliasSymbol ?? t.symbol)?.name ?? checker.typeToString(t);
  const plainDataKind = (t) => productKind(t) && !!(t.flags & ts.TypeFlags.Object) && checker.getPropertiesOfType(t).length > 0 &&
    checker.getPropertiesOfType(t).every((p) => !checker.getNonNullableType(checker.getTypeOfSymbol(p)).getCallSignatures().length);
  /** Is this complaint about X.get(K) inside a branch guarded by X.has(K)? */
  const guardedGet = (node) => {
    let top = node;
    while (top.parent && !ts.isStatement(top)) top = top.parent;
    const gets = [];
    walk(top, (m) => { if (ts.isCallExpression(m) && ts.isPropertyAccessExpression(m.expression) && m.expression.name.text === 'get' && m.arguments.length === 1) gets.push(`${m.expression.expression.getText()}.has(${m.arguments[0].getText()})`); });
    // a variable set from X.get(K) and used here
    walk(top, (m) => {
      if (!ts.isIdentifier(m)) return;
      const d = checker.getSymbolAtLocation(m)?.declarations?.[0];
      if (d && ts.isVariableDeclaration(d) && d.initializer && ts.isCallExpression(d.initializer) && ts.isPropertyAccessExpression(d.initializer.expression) && d.initializer.expression.name.text === 'get' && d.initializer.arguments.length === 1) gets.push(`${d.initializer.expression.expression.getText()}.has(${d.initializer.arguments[0].getText()})`);
    });
    if (!gets.length) return false;
    // set when missing, just before: if (!X.has(K)) X.set(K, ...);
    const block = top.parent;
    if (block && (ts.isBlock(block) || ts.isSourceFile(block))) {
      for (const st of block.statements) {
        if (st === top) break;
        if (ts.isIfStatement(st) && /^!/.test(st.expression.getText().trim())) {
          const cond = st.expression.getText().replace(/\s+/g, '');
          for (const g of gets) {
            const [x, k] = g.replace(/\s+/g, '').split('.has(');
            if (cond.includes(`!${x}.has(${k}`) && st.thenStatement.getText().replace(/\s+/g, '').includes(`${x}.set(${k.replace(/\)$/, '')}`)) return true;
          }
        }
      }
    }
    for (let a = node.parent; a; a = a.parent) {
      const cond = ts.isIfStatement(a) || ts.isWhileStatement(a) ? a.expression : ts.isConditionalExpression(a) ? a.condition : ts.isBinaryExpression(a) && a.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ? a.left : null;
      if (cond && gets.some((g) => cond.getText().replace(/\s+/g, '').includes(g.replace(/\s+/g, '')))) return true;
      if (ts.isFunctionLike(a)) break;
    }
    return false;
  };
  const rowTypeOf = (owner) => {
    const sf = program.getSourceFile(owner.file);
    let found;
    if (sf) walk(sf, (n) => { for (const doc of n.jsDoc ?? []) for (const tag of doc.tags ?? []) if (ts.isJSDocTypedefTag(tag) && tag.name?.text === owner.name) { const sym = checker.getSymbolAtLocation(tag.name) ?? tag.symbol; if (sym) found = checker.getDeclaredTypeOfSymbol(sym); } });
    return found;
  };

  // Iteration 6 (tool change 30): a row written in place ({ ...b, state: 'cancelled' }) is compared field by field,
  // each written value with its own literal kind, since the store's put takes any value and keeps no literal.
  const literalType = (x) => {
    while (ts.isParenthesizedExpression(x)) x = x.expression;
    if (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) return checker.getStringLiteralType(x.text);
    if (ts.isNumericLiteral(x)) return checker.getNumberLiteralType(Number(x.text.replace(/_/g, '')));
    if (x.kind === ts.SyntaxKind.TrueKeyword) return checker.getTrueType?.() ?? checker.getTypeAtLocation(x);
    if (x.kind === ts.SyntaxKind.FalseKeyword) return checker.getFalseType?.() ?? checker.getTypeAtLocation(x);
    return checker.getTypeAtLocation(x);
  };
  const rowFits = (arg, rowType) => {
    if (checker.isTypeAssignableTo(checker.getTypeAtLocation(arg), rowType)) return true;
    let x = arg;
    while (ts.isParenthesizedExpression(x)) x = x.expression;
    if (!ts.isObjectLiteralExpression(x)) return false;
    for (const prop of checker.getPropertiesOfType(rowType)) {
      const want = checker.getTypeOfSymbol(prop);
      let got = null;
      for (const el of x.properties) {
        if ((ts.isPropertyAssignment(el) || ts.isShorthandPropertyAssignment(el)) && el.name && ts.isIdentifier(el.name) && el.name.text === prop.name) got = ts.isPropertyAssignment(el) ? literalType(el.initializer) : checker.getTypeAtLocation(el.name);
        else if (ts.isSpreadAssignment(el)) { const sp = checker.getPropertyOfType(checker.getTypeAtLocation(el.expression), prop.name); if (sp) got = checker.getTypeOfSymbol(sp); }
      }
      if (got === null) { if (!(prop.flags & ts.SymbolFlags.Optional)) return false; continue; }
      if (!checker.isTypeAssignableTo(got, want)) return false;
    }
    return true;
  };
  // Iteration 6 (rule 36): errors stated on a kind for a member reach the function that builds that member.
  const kindThrows = new Map();
  const throwsOnKind = (t, member) => {
    const out = [];
    for (const sym of [t.aliasSymbol, t.symbol]) for (const d of sym?.declarations ?? []) {
      const tags = ts.isJSDocTypedefTag(d) && d.parent && ts.isJSDoc(d.parent) ? (d.parent.tags ?? []) : [];
      const names = checker.getPropertiesOfType(t).map((p) => p.name);
      for (const tg of tags) {
        if (tg.tagName.text !== 'throws') continue;
        const subject = tagText(tg).split(/[:.\s]/)[0];
        if (subject === member || !names.includes(subject)) out.push(...throwKinds(tg));
      }
    }
    return out;
  };
  for (const f of mod.src) {
    const sf = program.getSourceFile(f);
    if (!sf) continue;
    walk(sf, (n) => {
      if (!ts.isObjectLiteralExpression(n)) return;
      const ct = checker.getContextualType(n);
      if (!ct || !productKind(ct)) return;
      for (const el of n.properties) {
        const name = el.name && (ts.isIdentifier(el.name) || ts.isStringLiteral(el.name)) ? el.name.text : null;
        if (!name) continue;
        let fn = ts.isMethodDeclaration(el) ? el : ts.isPropertyAssignment(el) ? el.initializer : null;
        if (ts.isShorthandPropertyAssignment(el)) { const vd = checker.getShorthandAssignmentValueSymbol(el)?.declarations?.[0]; fn = vd && ts.isVariableDeclaration(vd) ? vd.initializer : (vd && ts.isFunctionDeclaration(vd) ? vd : null); }
        if (!fn || !ts.isFunctionLike(fn)) continue;
        const k = throwsOnKind(ct, name);
        if (k.length) kindThrows.set(fn, [...(kindThrows.get(fn) ?? []), ...k]);
      }
    });
  }
  const writes = [];

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
      // a complaint about a field (status.state) names the field: start from the whole expression
      while (e.parent && (ts.isPropertyAccessExpression(e.parent) || ts.isElementAccessExpression(e.parent)) && e.parent.expression !== e) e = e.parent;
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
      // Iteration 4: a complaint of the comment parser inside a comment; Node names the reader is not told of;
      // filter(Boolean), which removes the missing values the reader still sees.
      if (d.code === 1003 && ts.getTokenAtPosition && isInsideComment(sf, d.start ?? 0)) { cannotTell.push({ at, code: d.code, why: 'the comment parser stumbled inside a comment', text }); continue; }
      if ((d.code === 2304 || d.code === 2552) && /'(crypto|fetch|performance|Buffer|AbortController|AbortSignal|Blob|Response|Request|Headers|FormData|WebSocket|global|globalThis|require|module|exports|__dirname|__filename|setImmediate|clearImmediate)'/.test(text)) { cannotTell.push({ at, code: d.code, why: "a Node name the reader is not told of", text }); continue; }
      if ([2322, 2345, 2532, 18048].includes(d.code)) { let st = node; while (st.parent && !ts.isStatement(st)) st = st.parent; if (/\.filter\(\s*Boolean\s*\)/.test(st.getText())) { cannotTell.push({ at, code: d.code, why: 'filter(Boolean), which the reader does not understand', text }); continue; } }
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
      // Iteration 3: Map.has(k) guarding Map.get(k) is "cannot tell", whatever module the value's kind comes from.
      if (guardedGet(node)) {
        cannotTell.push({ at, code: d.code, why: 'a get guarded by has, which the reader cannot see', text });
        continue;
      }
      // Iteration 6: a property added to an error object (err.code = '...'), Node's own way.
      if (d.code === 2339 && ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) {
        const rt = checker.getTypeAtLocation(node.parent.expression);
        if ((rt.symbol?.declarations ?? []).some((x) => x.getSourceFile().isDeclarationFile) && /Error$/.test(rt.symbol?.name ?? '')) { cannotTell.push({ at, code: d.code, why: 'a property added to an error object', text }); continue; }
      }
      // Asking a list or set whether it holds a value wider than its own kind: the reader types it too narrowly.
      const call = node.parent?.parent && ts.isCallExpression(node.parent.parent) ? node.parent.parent : node.parent && ts.isCallExpression(node.parent) ? node.parent : null;
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
      // Iteration 5: "possibly missing" about a value the language's own library hands back (pop, shift, find, at,
      // Map.get), or one taken from such a call, is "cannot tell".
      if (POSSIBLY_UNDEFINED.has(d.code)) {
        const fromLib = (x, depth = 0) => {
          while (ts.isParenthesizedExpression(x) || ts.isNonNullExpression(x)) x = x.expression;
          if (ts.isCallExpression(x)) { let sg; try { sg = checker.getResolvedSignature(x); } catch {} return !!sg?.declaration?.getSourceFile().isDeclarationFile; }
          if (ts.isPropertyAccessExpression(x) && depth < 4) return fromLib(x.expression, depth + 1);
          if (ts.isIdentifier(x) && depth < 4) { const dcl = checker.getSymbolAtLocation(x)?.declarations?.[0]; if (dcl && ts.isVariableDeclaration(dcl) && dcl.initializer) return fromLib(dcl.initializer, depth + 1); }
          return false;
        };
        const target = ts.isPropertyAccessExpression(node.parent) && node.parent.name === node ? node.parent.expression : node;
        if (fromLib(target)) { cannotTell.push({ at, code: d.code, why: "a value the language's own library may hand back missing", text }); continue; }
      }
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

    // Iteration 5 (rule 28): a module imports only another module's interface files.
    for (const st of sf.statements) {
      if (!ts.isImportDeclaration(st) && !ts.isExportDeclaration(st)) continue;
      const spec = st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier) ? st.moduleSpecifier.text : null;
      if (!spec || !spec.startsWith('.')) continue;
      const target = path.resolve(path.dirname(f), spec);
      const other = tree.moduleOfFile(target);
      if (other && other !== moduleId && !tree.byId.get(other).public.includes(target)) refusals.push({ at: lineAt(sf, st, tree.root), code: 'import', text: `imports ${path.relative(tree.root, target)}, which is not one of ${other}'s interface files`, kind: "(c) a rule of form: only a module's interface files are imported" });
    }
    // Iteration 6 (rule 38): however it is loaded, import() included.
    walk(sf, (n) => {
      if (!(ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword)) return;
      const a0 = n.arguments[0];
      if (!a0 || !(ts.isStringLiteral(a0) || ts.isNoSubstitutionTemplateLiteral(a0))) { refusals.push({ at: lineAt(sf, n, tree.root), code: 'import', text: 'imports a file the tool cannot name (import() of a computed name)', kind: "(c) a rule of form: only a module's interface files are imported" }); return; }
      if (!a0.text.startsWith('.')) return;
      const target = path.resolve(path.dirname(f), a0.text);
      const other = tree.moduleOfFile(target);
      if (other && other !== moduleId && !tree.byId.get(other).public.includes(target)) refusals.push({ at: lineAt(sf, n, tree.root), code: 'import', text: `imports ${path.relative(tree.root, target)}, which is not one of ${other}'s interface files`, kind: "(c) a rule of form: only a module's interface files are imported" });
    });
    // Iteration 6 (rule 34): how a running part is started (process.argv, process.env) is read into a kind published
    // with @message argv or @message env.
    walk(sf, (n) => {
      if (!(ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'process' && ['argv', 'env'].includes(n.name.text))) return;
      const channel = n.name.text;
      let ok = false;
      for (let a = n.parent; a && !ts.isStatement(a) && !ok; a = a.parent) {
        const tn = ts.isParenthesizedExpression(a) ? ts.getJSDocType(a) : ts.isVariableDeclaration(a) ? (ts.getJSDocType(a) ?? ts.getJSDocType(a.parent.parent)) : undefined;
        if (tn) ok = (messageChannelsOf(checker.getTypeFromTypeNode(tn)) ?? []).includes(channel);
      }
      if (!ok) refusals.push({ at: lineAt(sf, n, tree.root), code: 'message', text: `reads process.${channel} without a kind published with @message ${channel}`, kind: '(c) a rule of form: how a running part is started is read with its published kind' });
    });
    // Iteration 5 (rule 29): where a function or method states its errors, it throws only kinds it states.
    walk(sf, (n) => {
      if (!(ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n))) return;
      let host = n;
      if ((ts.isArrowFunction(n) || ts.isFunctionExpression(n)) && n.parent && (ts.isVariableDeclaration(n.parent) || ts.isPropertyAssignment(n.parent))) host = n.parent;
      // iteration 6: {A|B} names two kinds; errors stated on the kind for the member this function builds count too (rule 36)
      const stated = [...[...tagsOf(host, 'throws'), ...(host !== n ? tagsOf(n, 'throws') : [])].flatMap(throwKinds), ...(kindThrows.get(n) ?? [])];
      if (!stated.length || !n.body) return;
      const own = (m) => {
        if (m !== n.body && ts.isFunctionLike(m)) return; // a nested function states its own
        if (ts.isThrowStatement(m) && m.expression && ts.isNewExpression(m.expression) && ts.isIdentifier(m.expression.expression) && !stated.includes(m.expression.expression.text)) {
          refusals.push({ at: lineAt(sf, m, tree.root), code: 'throws', text: `throws ${m.expression.expression.text}, which its comment does not state (it states ${stated.join(', ')})`, kind: "(a) a comment disagrees with this module's code" });
        }
        ts.forEachChild(m, own);
      };
      own(n.body);
    });

    // Rules of form, iteration 3: a plain-data kind built as a class instance (rule 11); a cast that turns a value of
    // a known kind into a product kind it is not (rule 14).
    walk(sf, (n) => {
      // Iteration 4 (rule 22): wherever a plain-data kind is expected, a value whose kind is a class is refused,
      // however it was built (new, or a factory).
      if (ts.isExpression(n) && !ts.isParenthesizedExpression(n) && (ts.isNewExpression(n) || ts.isCallExpression(n) || ts.isIdentifier(n) || ts.isElementAccessExpression(n)) && n.parent && (ts.isReturnStatement(n.parent) || ts.isVariableDeclaration(n.parent) || ts.isArrowFunction(n.parent) || ts.isPropertyAssignment(n.parent) || (ts.isCallExpression(n.parent) && n.parent.arguments.includes(n)) || (ts.isConditionalExpression(n.parent) && n.parent.condition !== n) || (ts.isBinaryExpression(n.parent) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandToken].includes(n.parent.operatorToken.kind)))) {
        const ct = checker.getContextualType(n);
        if (ct && plainDataKind(ct)) {
          const vt = checker.getTypeAtLocation(n);
          if ((vt.symbol?.declarations ?? []).some((d) => (ts.isClassDeclaration(d) || ts.isClassExpression(d)) && moduleOfDecl(d))) {
            refusals.push({ at: lineAt(sf, n, tree.root), code: 'plain-data', text: `a value of the plain-data kind ${kindName(ct)} is an instance of a class: copies keep only its own fields`, kind: '(c) a rule of form: plain data is built as plain data' });
          }
        }
      }
      if (ts.isParenthesizedExpression(n)) {
        const tn = ts.getJSDocType(n);
        if (!tn) return;
        const target = checker.getTypeFromTypeNode(tn);
        if (!productKind(target)) return;
        const source = checker.getTypeAtLocation(n.expression);
        if (source.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return;
        if (!checker.isTypeAssignableTo(source, target) && !checker.isTypeAssignableTo(checker.getNonNullableType(source), target)) refusals.push({ at: lineAt(sf, n, tree.root), code: 'cast', text: `a cast makes a value of another kind pass as ${kindName(target)}`, kind: '(a) a comment (a cast) disagrees with the code' });
      }
    });

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
          if (arg && rowType && !rowFits(arg, rowType)) {
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
        // iteration 5: a copy made in two statements, const text = JSON.stringify(x); JSON.parse(text)
        if (a0 && ts.isIdentifier(a0)) { const dcl = checker.getSymbolAtLocation(a0)?.declarations?.[0]; if (dcl && ts.isVariableDeclaration(dcl) && dcl.initializer && ts.isCallExpression(dcl.initializer) && ts.isPropertyAccessExpression(dcl.initializer.expression) && dcl.initializer.expression.name.text === 'stringify') return; }
        let p = n.parent;
        while (p && ts.isParenthesizedExpression(p) && !ts.getJSDocType(p)) p = p.parent;
        const typeNode = (p && (ts.isParenthesizedExpression(p) || ts.isVariableDeclaration(p)) && (ts.getJSDocType(p) ?? (ts.isVariableDeclaration(p) ? ts.getJSDocType(p.parent.parent) : undefined))) || undefined;
        // Iteration 6 (rule 40): a file read with readFileSync is not a message; it needs a stated kind only.
        let src = a0;
        if (src && ts.isIdentifier(src)) { const dcl = checker.getSymbolAtLocation(src)?.declarations?.[0]; if (dcl && ts.isVariableDeclaration(dcl) && dcl.initializer) src = dcl.initializer; }
        const isFile = src && ts.isCallExpression(src) && /(^|\.)readFileSync$/.test(src.expression.getText(sf));
        if (isFile) {
          if (!typeNode) refusals.push({ at: lineAt(sf, n, tree.root), code: 'file-kind', text: 'a file is read and parsed without a stated kind', kind: '(c) a rule of form: what is read from a file is given a stated kind' });
          return;
        }
        const ok = typeNode && messageChannelsOf(checker.getTypeFromTypeNode(typeNode));
        if (!ok) refusals.push({ at: lineAt(sf, n, tree.root), code: 'message', text: 'a message is read without a kind its sender publishes (@message)', kind: '(c) a rule of form: a message is read with its sender\'s kind' });
      }
      // A write to a standard stream: every JSON.stringify in what is written, directly or through a variable set just
      // before (iteration 3), must give a message kind published for that stream.
      const isConsole = ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && callee.expression.text === 'console' && ['log', 'info', 'error', 'warn'].includes(callee.name.text);
      if (ts.isPropertyAccessExpression(callee) && (['write', 'end'].includes(callee.name.text) || isConsole)) {
        const w = n;
        // Every stream the target may be (a stream chosen at run time names each of them) must be one of the
        // channels the message's kind is published for.
        // Iteration 4 (rule 20): the stream may be chosen into a variable: follow it to where it is set.
        // Iteration 5 (rule 30): console.log and console.info write to stdout, console.error and console.warn to stderr.
        let targetText = isConsole ? (['log', 'info'].includes(callee.name.text) ? 'stdout' : 'stderr') : w.expression.expression.getText(sf);
        const tid = w.expression.expression;
        if (!isConsole && ts.isIdentifier(tid)) {
          for (const dcl of checker.getSymbolAtLocation(tid)?.declarations ?? []) if (ts.isVariableDeclaration(dcl) && dcl.initializer) targetText += ' ' + dcl.initializer.getText();
        }
        const streams = [...new Set(targetText.match(/\b(stdout|stderr|stdin)\b/g) ?? [])];
        const stringified = [];
        const seenVars = new Set();
        const find = (x, depth) => {
          walk(x, (m) => {
            if (ts.isCallExpression(m) && ts.isPropertyAccessExpression(m.expression) && ts.isIdentifier(m.expression.expression) && m.expression.expression.text === 'JSON' && m.expression.name.text === 'stringify') stringified.push(m);
            if (depth < 3 && ts.isIdentifier(m) && !seenVars.has(m.text)) {
              const d = checker.getSymbolAtLocation(m)?.declarations?.[0];
              if (d && ts.isVariableDeclaration(d) && d.initializer && d.getSourceFile() === sf) { seenVars.add(m.text); find(d.initializer, depth + 1); }
            }
          });
        };
        const data = isConsole ? n.arguments : n.arguments.slice(0, 1); // iteration 5: a write's callback is not data
        for (const a of data) find(a, 0);
        const messages = stringified.filter((js) => js.arguments[0] && channelsOfValue(js.arguments[0]));
        // Iteration 6 (rule 35): remember every write, to see later whether a stream that carries messages carries anything else
        if (data.length) writes.push({ at: lineAt(sf, n, tree.root), streams, message: messages.length > 0 });
        // Iteration 6 (rule 40): a log line written with console is a message only if what it writes has a message kind
        if (isConsole && !messages.length) return;
        if (!streams.length) {
          if (messages.length) refusals.push({ at: lineAt(sf, n, tree.root), code: 'message', text: 'a message is written where the tool cannot tell which channel', kind: '(c) a rule of form: a message is written where its channel can be read' });
          return;
        }
        // Iteration 4 (rule 19): one message per line.
        if (stringified.length) {
          const resolve = (x) => { if (ts.isIdentifier(x)) { const dcl = checker.getSymbolAtLocation(x)?.declarations?.[0]; if (dcl && ts.isVariableDeclaration(dcl) && dcl.initializer) return dcl.initializer; } return x; };
          const nl = (x) => (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) && x.text === '\n';
          const isStringify = (x) => ts.isCallExpression(x) && ts.isPropertyAccessExpression(x.expression) && x.expression.name.text === 'stringify';
          const oneLine = (x) => { x = resolve(x); while (ts.isParenthesizedExpression(x)) x = x.expression;
            if (!(ts.isBinaryExpression(x) && x.operatorToken.kind === ts.SyntaxKind.PlusToken && nl(x.right))) return false;
            const l = x.left;
            if (isStringify(l)) return true;
            // list.map((v) => JSON.stringify(v)).join('\n') + '\n'
            return ts.isCallExpression(l) && ts.isPropertyAccessExpression(l.expression) && l.expression.name.text === 'join' && l.arguments[0] && nl(l.arguments[0]) &&
              ts.isCallExpression(l.expression.expression) && ts.isPropertyAccessExpression(l.expression.expression.expression) && l.expression.expression.expression.name.text === 'map' &&
              (() => { const f = l.expression.expression.arguments[0]; return f && (ts.isArrowFunction(f) || ts.isFunctionExpression(f)) && isStringify(ts.isBlock(f.body) ? (f.body.statements[0]?.expression ?? f.body) : f.body); })(); };
          // console.log adds the line end itself
          const ok = isConsole ? data.every((x) => { x = ts.isIdentifier(x) ? (checker.getSymbolAtLocation(x)?.declarations?.[0]?.initializer ?? x) : x; return ts.isCallExpression(x) && ts.isPropertyAccessExpression(x.expression) && x.expression.name.text === 'stringify'; }) : data.every(oneLine);
          if (!ok) refusals.push({ at: lineAt(sf, n, tree.root), code: 'message', text: 'messages on a channel are written one per line: JSON.stringify(message) + newline', kind: '(c) a rule of form: one message per line' });
        }
        for (const js of stringified) {
          const a0 = js.arguments[0];
          const channels = a0 ? channelsOfValue(a0) : null;
          const wrong = streams.filter((x) => !channels || !channels.includes(x));
          if (wrong.length) {
            refusals.push({ at: lineAt(sf, js, tree.root), code: 'message', text: `a message written to ${wrong.join(' and ')} ${channels ? `has a kind published for ${channels.join(', ')}` : 'has no kind its sender publishes'}`, kind: '(c) a rule of form: a message is written with its kind, on its channel' });
          }
        }
      }
    });
  }

  // Iteration 6 (rule 35): a stream that carries messages carries only messages.
  const messageStreams = new Set(writes.filter((w) => w.message).flatMap((w) => w.streams));
  for (const w of writes) {
    if (w.message) continue;
    const both = w.streams.filter((x) => messageStreams.has(x));
    if (both.length) refusals.push({ at: w.at, code: 'message', text: `writes something other than a message to ${both.join(' and ')}, which carries messages`, kind: '(c) a rule of form: a stream that carries messages carries only messages' });
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
const isBoundTestStatement = (st) => ts.isExpressionStatement(st) && isTestCall(st.expression) && /^bound\s/.test(testName(st.expression) ?? '');

/** A file's running code; with withoutBoundTests, its top-level tests named for a bound are left out. */
function shape(file, withoutBoundTests = false) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
  if (!withoutBoundTests) return shapeOfNode(sf);
  return sf.statements.filter((st) => !isBoundTestStatement(st)).map((st) => shapeOfNode(st)).join('');
}

/** The names (without 'bound ') of top-level tests named for a bound that are in the after file and not the before. */
function addedBoundTests(before, after) {
  const names = (file) => ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS).statements
    .filter(isBoundTestStatement).map((st) => st.expression.arguments[0].text.replace(/^bound\s+/, '').replace(/\s+/g, ' ').trim());
  const b = new Set(names(before));
  return names(after).filter((n) => !b.has(n));
}

/** Names of calls that name a test or a group of tests. */
const TEST_CALLS = new Set(['test', 'it', 'describe', 'suite']);
/** Is this a call that names a test or a group of tests (test, it, describe, or t.test)? */
export const isTestCall = (n) => ts.isCallExpression(n) && (ts.isIdentifier(n.expression) ? TEST_CALLS.has(n.expression.text) : ts.isPropertyAccessExpression(n.expression) && TEST_CALLS.has(n.expression.name.text));
const testName = (n) => { const a0 = n.arguments[0]; return a0 && (ts.isStringLiteral(a0) || ts.isNoSubstitutionTemplateLiteral(a0)) ? a0.text : null; };

/**
 * Iteration 3 (rule 15): what a test checks: the values it uses and the checks it calls, including named values and
 * helpers from the top of its own file. Rewriting a test with the same values and checks gives the same answer;
 * moving a limit held in a named value does not.
 */
function fingerprint(node, sf) {
  const top = new Map();
  for (const st of sf.statements) {
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) { if (ts.isIdentifier(d.name)) top.set(d.name.text, d); }
    else if (ts.isFunctionDeclaration(st) && st.name) top.set(st.name.text, st);
  }
  // Iteration 4 (rule 26): constants imported from the module's own source count as values.
  const imported = new Map();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier) || !st.moduleSpecifier.text.startsWith('.')) continue;
    const target = path.resolve(path.dirname(sf.fileName), st.moduleSpecifier.text);
    if (!fs.existsSync(target)) continue;
    const src = ts.createSourceFile(target, fs.readFileSync(target, 'utf8'), ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
    const consts = new Map();
    for (const x of src.statements) if (ts.isVariableStatement(x)) for (const d of x.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer) consts.set(d.name.text, d.initializer);
    for (const el of st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings) ? st.importClause.namedBindings.elements : []) {
      const init = consts.get((el.propertyName ?? el.name).text);
      if (init) imported.set(el.name.text, init);
    }
    // iteration 6 (rule 42): import * as m, read as m.NAME
    const nb = st.importClause?.namedBindings;
    if (nb && ts.isNamespaceImport(nb)) for (const [k, init] of consts) imported.set(`${nb.name.text}.${k}`, init);
  }
  const valueOf = (n) => (ts.isNumericLiteral(n) ? 'n:' + Number(n.text.replace(/_/g, '')) : ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isRegularExpressionLiteral(n) ? 's:' + n.text
    : ts.isPrefixUnaryExpression(n) && n.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(n.operand) ? 'n:-' + Number(n.operand.text.replace(/_/g, '')) : null);
  const pairs = new Set();
  const loopValues = new Map(); // name of a for-of variable -> the values it takes
  const seen = new Set();
  // the values an expression stands for: its literals, the values of loop variables and named constants it uses
  const valuesIn = (n, out, depth = 0) => {
    const v = valueOf(n);
    if (v) { out.add(v); return; }
    if (ts.isPropertyAccessExpression(n) && imported.has(n.getText(sf).replace(/\s+/g, ''))) { if (depth < 3) valuesIn(imported.get(n.getText(sf).replace(/\s+/g, '')), out, depth + 1); return; }
    if (ts.isIdentifier(n)) {
      if (/Error$/.test(n.text)) out.add('e:' + n.text); // an error kind named in a check (iteration 5)
      if (loopValues.has(n.text)) for (const x of loopValues.get(n.text)) out.add(x);
      const init = imported.get(n.text) ?? (top.has(n.text) && ts.isVariableDeclaration(top.get(n.text)) ? top.get(n.text).initializer : null);
      if (init && depth < 3) valuesIn(init, out, depth + 1);
    }
    ts.forEachChild(n, (c) => valuesIn(c, out, depth));
  };
  const visit = (n) => {
    if (ts.isForOfStatement(n) && ts.isVariableDeclarationList(n.initializer) && n.initializer.declarations.length === 1 && ts.isIdentifier(n.initializer.declarations[0].name)) {
      const vals = new Set();
      valuesIn(n.expression, vals);
      loopValues.set(n.initializer.declarations[0].name.text, vals);
      visit(n.statement);
      return;
    }
    if (ts.isCallExpression(n)) {
      let callee = ts.isPropertyAccessExpression(n.expression) ? n.expression.name.text : n.expression.getText(sf);
      for (const name of top.keys()) callee = callee.replace(new RegExp(`\\b${name}\\b`, 'g'), '_'); // local helpers' names do not count
      const local = ts.isIdentifier(n.expression) && top.has(n.expression.text);
      if (local) {
        // iteration 5: a helper's parameters take the values it is called with
        const helper = top.get(n.expression.text);
        const fnNode = ts.isFunctionDeclaration(helper) ? helper : helper.initializer && (ts.isArrowFunction(helper.initializer) || ts.isFunctionExpression(helper.initializer)) ? helper.initializer : null;
        const saved = new Map(loopValues);
        fnNode?.parameters.forEach((p, i) => { if (ts.isIdentifier(p.name) && n.arguments[i]) { const vals = new Set(); valuesIn(n.arguments[i], vals); loopValues.set(p.name.text, vals); } });
        const key = n.expression.text + JSON.stringify([...loopValues.entries()].map(([k, v]) => [k, [...v]]));
        if (!seen.has(key)) { seen.add(key); visit(helper); }
        loopValues.clear(); for (const [k, v] of saved) loopValues.set(k, v);
      }
      else {
        const vals = new Set();
        for (const arg of n.arguments) valuesIn(arg, vals);
        // iteration 5: the list a check is run over ([1, 600].map(...)) counts
        if (ts.isPropertyAccessExpression(n.expression)) valuesIn(n.expression.expression, vals);
        if (!vals.size) pairs.add(callee);
        for (const v of vals) pairs.add(`${callee}(${v})`);
      }
    }
    if (ts.isBinaryExpression(n)) pairs.add('op' + n.operatorToken.kind);
    if (ts.isIdentifier(n) && top.has(n.text) && !seen.has(n.text) && ts.isFunctionDeclaration(top.get(n.text))) { seen.add(n.text); visit(top.get(n.text)); }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return JSON.stringify([...pairs].sort());
}

/** The tests of a module named for a bound: "bound <words>" -> what the test checks. */
export function boundTests(mod) {
  const out = new Map();
  for (const f of mod.tests) {
    const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
    const visit = (n) => {
      if (isTestCall(n)) {
        const name = testName(n);
        if (name && /^bound\s/.test(name)) {
          // what the test does, not how it is grouped or named: only the arguments after its name
          const fp = n.arguments.slice(1).map((a) => fingerprint(a, sf));
          out.set(name.replace(/^bound\s+/, '').replace(/\s+/g, ' ').trim(), { shape: JSON.stringify(fp), at: `${path.basename(f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}` });
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
  const boundLinesAfter = new Set();
  for (const f of ma.src) {
    const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
    walk(sf, (n) => { for (const doc of n.jsDoc ?? []) for (const tag of doc.tags ?? []) if (tag.tagName.text === 'bound') boundLinesAfter.add(tagText(tag)); });
  }
  const rel = (m, t) => m.files.map((f) => path.relative(t.root, f)).sort();
  const fb = rel(mb, beforeTree), fa = rel(ma, afterTree);
  const files = [];
  let ok = JSON.stringify(fb) === JSON.stringify(fa);
  for (const f of new Set([...fb, ...fa])) {
    const pb = path.join(beforeTree.root, f), pa = path.join(afterTree.root, f);
    if (!fs.existsSync(pb) || !fs.existsSync(pa)) { files.push({ file: f, same: false, why: 'file added or removed' }); ok = false; continue; }
    const isTest = ma.tests.includes(pa);
    // Iteration 3: in a test file, tests named for a bound that this step adds are allowed (rule 4 needs them);
    // everything else that runs must be unchanged.
    const added = isTest ? addedBoundTests(pb, pa) : [];
    const same = isTest ? shape(pb, true) === shape(pa, true) && added.every((t) => boundLinesAfter.has(t)) : shape(pb) === shape(pa);
    const textSame = fs.readFileSync(pb, 'utf8') === fs.readFileSync(pa, 'utf8');
    files.push({ file: f, same, textChanged: !textSame, ...(added.length ? { addedBoundTests: added } : {}) });
    if (!same) ok = false;
  }
  return { module: moduleId, same: ok, files };
}
