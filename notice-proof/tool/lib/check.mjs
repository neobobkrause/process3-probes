// The check, run inside one module's own tests and on that module only:
//   (a) refuses a comment that disagrees with the module's own code;
//   (b) refuses code that disagrees with a provider's stated interface;
// and never refuses where the reader merely cannot tell. Also: the comments-only verification of a first step.
import fs from 'node:fs';
import path from 'node:path';
import { ts, makeProgram } from './ts.mjs';

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
export function check(tree, moduleId) {
  const mod = tree.byId.get(moduleId);
  if (!mod) throw new Error(`no such module: ${moduleId}`);
  const program = makeProgram(mod.files);
  const checker = program.getTypeChecker();
  const refusals = [];
  const cannotTell = [];
  for (const f of mod.files) {
    const sf = program.getSourceFile(f);
    if (!sf) continue;
    for (const d of [...program.getSyntacticDiagnostics(sf), ...program.getSemanticDiagnostics(sf)]) {
      const text = ts.flattenDiagnosticMessageText(d.messageText, ' ');
      const at = where(d, tree.root);
      if (isUnstatedKind(d.code)) {
        cannotTell.push({ at, code: d.code, why: 'a kind that no comment states', text });
        continue;
      }
      if (CANNOT_TELL.has(d.code) && !(d.code === 2307 && /['"]\.\.?\//.test(text))) {
        cannotTell.push({ at, code: d.code, why: CANNOT_TELL.get(d.code), text });
        continue;
      }
      // Which kind of disagreement: does the statement name anything declared in another module of the product?
      const node = nodeAt(sf, d.start ?? 0);
      let stmt = node;
      while (stmt.parent && !ts.isStatement(stmt) && !ts.isSourceFile(stmt.parent) && !ts.isJSDoc(stmt)) stmt = stmt.parent;
      const others = new Set();
      const look = (n) => {
        if (ts.isIdentifier(n)) {
          let s = checker.getSymbolAtLocation(n);
          if (s && s.flags & ts.SymbolFlags.Alias) { try { s = checker.getAliasedSymbol(s); } catch { s = undefined; } }
          for (const decl of s?.declarations ?? []) {
            const m = tree.moduleOfFile(decl.getSourceFile().fileName);
            if (m && m !== moduleId) others.add(m);
          }
        }
        ts.forEachChild(n, look);
      };
      look(stmt);
      for (const r of d.relatedInformation ?? []) {
        const m = r.file && tree.moduleOfFile(r.file.fileName);
        if (m && m !== moduleId) others.add(m);
      }
      const isTest = mod.tests.includes(f);
      refusals.push({
        at,
        code: d.code,
        text,
        kind: others.size
          ? `(b) code disagrees with the stated interface of ${[...others].join(', ')}`
          : `(a) a comment disagrees with ${isTest ? "this module's tests" : "this module's code"}`,
      });
    }
  }
  return { module: moduleId, refused: refusals.length > 0, refusals, cannotTell };
}

// ---- comments-only verification ----

/** A file's running code as a tree with comments and grouping parentheses left out. */
function shape(file) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
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
  visit(sf);
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
