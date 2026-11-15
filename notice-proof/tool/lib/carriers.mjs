// Calls that carry a name: an operation called by name through the door (@carriesop), or a table of the shared
// store named in a call to the store (@carriestable). The carrier is a member of a kind whose comment lists the
// carrying members, or a function tagged with the mark itself.
import { ts, tagsOf, tagText } from './ts.mjs';

function findAncestor(n, pred) {
  for (let p = n; p; p = p.parent) if (pred(p)) return p;
  return null;
}

/**
 * @returns undefined when the call carries no name; otherwise { kind: 'op' | 'table', member, names } where names
 *   is null when the name is not written where the tool can read it.
 */
export function carrierOf(checker, call) {
  let sig;
  try { sig = checker.getResolvedSignature(call); } catch { return undefined; }
  const decl = sig?.declaration;
  if (!decl) return undefined;
  const prop = findAncestor(decl, (n) => ts.isJSDocPropertyTag(n) || ts.isPropertySignature(n) || ts.isFunctionDeclaration(n));
  if (!prop) return undefined;
  let kind;
  const memberName = String(prop.name?.escapedText ?? prop.name?.text ?? '');
  for (const [tag, k] of [['carriesop', 'op'], ['carriestable', 'table']]) {
    if (ts.isFunctionDeclaration(prop)) { if (tagsOf(prop, tag).length) kind = k; }
    else {
      const td = findAncestor(prop, (n) => ts.isJSDocTypedefTag(n));
      if (td) for (const t of tagsOf(td, tag)) if (tagText(t).split(/[\s,]+/).includes(memberName)) kind = k;
    }
  }
  if (!kind) return undefined;
  // A table's name is read from the argument as written: the parameter's kind is only "text".
  // Iteration 3 (rule 13): a helper marked "@carriestable keys" names its tables as the keys of its first argument.
  const keysMode = ts.isFunctionDeclaration(prop) && tagsOf(prop, 'carriestable').some((t) => /\bkeys\b/.test(tagText(t)));
  if (kind === 'table' && keysMode) {
    const a0 = call.arguments[0];
    if (a0 && ts.isObjectLiteralExpression(a0) && a0.properties.every((p) => p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)))) return { kind, member: memberName, names: a0.properties.map((p) => p.name.text), sig };
    return { kind, member: memberName, names: null, sig };
  }
  if (kind === 'table') {
    let a0 = call.arguments[0];
    // iteration 7 (rule 47): a constant set to a literal name is read as that name
    if (a0 && ts.isIdentifier(a0)) {
      const d = checker.getSymbolAtLocation(a0)?.declarations?.[0];
      if (d && ts.isVariableDeclaration(d) && d.initializer && ts.isVariableDeclarationList(d.parent) && d.parent.flags & ts.NodeFlags.Const) a0 = d.initializer;
    }
    if (a0 && (ts.isStringLiteral(a0) || ts.isNoSubstitutionTemplateLiteral(a0))) return { kind, member: memberName, names: [a0.text], sig };
    return { kind, member: memberName, names: null, sig };
  }
  const p0 = sig.getParameters()[0];
  if (!p0) return { kind, member: memberName, names: null, sig };
  // The name must be written where the reader can read it: an argument of plain text is unreadable, whatever the
  // reader inferred from the door's list of names.
  const a0 = call.arguments[0];
  if (a0) {
    const at = checker.getTypeAtLocation(a0);
    const readable = (x) => !!(x.flags & (ts.TypeFlags.StringLiteral | ts.TypeFlags.TemplateLiteral));
    if (!(at.flags & ts.TypeFlags.Union ? at.types.every(readable) : readable(at))) return { kind, member: memberName, names: null, sig };
  }
  const t = checker.getTypeOfSymbolAtLocation(p0, call);
  const names = [];
  for (const m of t.flags & ts.TypeFlags.Union ? t.types : [t]) {
    if (m.flags & ts.TypeFlags.StringLiteral) {
      const v = kind === 'op' && m.value.startsWith('op=') ? /^op=([A-Za-z0-9_]+)/.exec(m.value)?.[1] : m.value;
      if (!v) return { kind, member: memberName, names: null, sig };
      names.push(v);
    } else if (kind === 'op' && m.flags & ts.TypeFlags.TemplateLiteral) {
      const v = /^op=([A-Za-z0-9_]+)&/.exec(m.texts[0])?.[1];
      if (!v) return { kind, member: memberName, names: null, sig };
      names.push(v);
    } else return { kind, member: memberName, names: null, sig };
  }
  return { kind, member: memberName, names, sig };
}
