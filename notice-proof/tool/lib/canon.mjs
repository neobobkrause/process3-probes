// The canonical form of a kind: a plain tree that two readings can compare field by field.
//
// Decided here (not settled by the method):
// - A kind of plain data is written out in full wherever it appears, so a change to it shows in every entry that
//   accepts or hands it back.
// - A kind whose members include operations (a "handle", such as the object a factory hands out) is written by
//   its name only; each of its members is an entry of its own. So a change to one method tells the users of that
//   method, not every user of the factory.
// - A kind that still mentions a type parameter (generic code, such as the door) is written as TypeScript prints it.
import { ts } from './ts.mjs';

const P = (n) => ({ k: 'prim', n });

export function makeCanon(checker, tree) {
  const isProductDecl = (d) => d && !d.getSourceFile().isDeclarationFile && tree.moduleOfFile(d.getSourceFile().fileName);

  /** The named kind a type was written as, if it was declared in the product. */
  function productAlias(t) {
    for (const sym of [t.aliasSymbol, t.symbol]) {
      if (!sym || sym.name.startsWith('__')) continue;
      const d = sym.declarations?.[0];
      if (d && isProductDecl(d) && (ts.isJSDocTypedefTag(d) || ts.isTypeAliasDeclaration(d) || ts.isJSDocCallbackTag(d))) {
        return { sym, decl: d, module: tree.moduleOfFile(d.getSourceFile().fileName), name: sym.name };
      }
    }
    return null;
  }

  function isHandle(t) {
    if (!(t.flags & ts.TypeFlags.Object) || checker.isArrayType(t) || checker.isTupleType(t)) return false;
    if (t.getCallSignatures().length) return false;
    return checker.getPropertiesOfType(t).some((p) => {
      const pt = checker.getNonNullableType(checker.getTypeOfSymbol(p));
      return pt.getCallSignatures().length > 0;
    });
  }

  function isGeneric(t) {
    return !!(t.flags & (ts.TypeFlags.TypeParameter | ts.TypeFlags.IndexedAccess | ts.TypeFlags.Conditional |
      ts.TypeFlags.Substitution | ts.TypeFlags.Index));
  }

  /**
   * @param t the type
   * @param ctx { kinds: Map of data kinds written out (module.name -> declaration), stack: types being written }
   * @param top true when writing the named kind itself (so a handle is opened, not named)
   */
  function canon(t, ctx, top = false) {
    const f = t.flags;
    if (f & ts.TypeFlags.Any) return { k: 'any' };
    if (f & ts.TypeFlags.Unknown) return P('unknown');
    if (f & ts.TypeFlags.String) return P('string');
    if (f & ts.TypeFlags.Number) return P('number');
    if (f & ts.TypeFlags.Boolean && !(f & ts.TypeFlags.Union)) return P('boolean');
    if (f & ts.TypeFlags.BigInt) return P('bigint');
    if (f & ts.TypeFlags.ESSymbolLike) return P('symbol');
    if (f & ts.TypeFlags.Undefined) return P('undefined');
    if (f & ts.TypeFlags.Null) return P('null');
    if (f & ts.TypeFlags.Void) return P('void');
    if (f & ts.TypeFlags.Never) return P('never');
    if (f & ts.TypeFlags.StringLiteral) return { k: 'lit', v: t.value };
    if (f & ts.TypeFlags.NumberLiteral) return { k: 'lit', v: t.value };
    if (f & ts.TypeFlags.BooleanLiteral) return { k: 'lit', v: checker.typeToString(t) === 'true' };
    if (f & ts.TypeFlags.TemplateLiteral) return { k: 'text', t: checker.typeToString(t) };
    if (isGeneric(t)) return { k: 'generic', t: checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation) };
    if (f & ts.TypeFlags.Union) {
      let of = t.types.map((m) => canon(m, ctx));
      const hasT = of.some((x) => x.k === 'lit' && x.v === true);
      const hasF = of.some((x) => x.k === 'lit' && x.v === false);
      if (hasT && hasF) of = [...of.filter((x) => !(x.k === 'lit' && typeof x.v === 'boolean')), P('boolean')];
      const seen = new Map();
      for (const x of of) seen.set(JSON.stringify(x), x);
      of = [...seen.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map((e) => e[1]);
      return of.length === 1 ? of[0] : { k: 'union', of };
    }
    if (f & (ts.TypeFlags.Object | ts.TypeFlags.Intersection)) return canonObject(t, ctx, top);
    return { k: 'other', t: checker.typeToString(t) };
  }

  function canonObject(t, ctx, top) {
    if (ctx.stack.includes(t)) return { k: 'cycle', t: checker.typeToString(t) };
    if (ctx.stack.length > 14) return { k: 'deep', t: checker.typeToString(t) };
    const alias = productAlias(t);
    if (alias && !top && isHandle(t)) return { k: 'handle', name: `${alias.module}.${alias.name}` };
    if (alias && !isHandle(t)) ctx.kinds.set(`${alias.module}.${alias.name}`, alias.decl);
    ctx.stack.push(t);
    try {
      if (checker.isArrayType(t)) {
        const ro = t.symbol?.name === 'ReadonlyArray';
        return { k: 'arr', ro, of: canon(checker.getTypeArguments(t)[0], ctx) };
      }
      if (checker.isTupleType(t)) {
        const flags = t.target.elementFlags;
        return {
          k: 'tuple',
          ro: !!t.target.readonly,
          items: checker.getTypeArguments(t).map((a, i) => ({ opt: !!(flags[i] & ts.ElementFlags.Optional), rest: !!(flags[i] & ts.ElementFlags.Variable), t: canon(a, ctx) })),
        };
      }
      const sym = t.symbol;
      const d = sym?.declarations?.[0];
      if (sym && d && d.getSourceFile().isDeclarationFile && !sym.name.startsWith('__')) {
        // A kind from the language's own library (Promise, Date, Map...): its name and its arguments.
        const args = (t.typeArguments ?? checker.getTypeArguments?.(t) ?? []).map((a) => canon(a, ctx));
        return { k: 'ref', name: sym.name, args };
      }
      const calls = t.getCallSignatures();
      const props = checker.getPropertiesOfType(t);
      if (calls.length && !props.length) return calls.length === 1 ? canonSig(calls[0], ctx) : { k: 'overloads', of: calls.map((s) => canonSig(s, ctx)) };
      const out = { k: 'obj', props: {} };
      for (const p of [...props].sort((a, b) => (a.name < b.name ? -1 : 1))) {
        const opt = !!(p.flags & ts.SymbolFlags.Optional);
        let pt = checker.getTypeOfSymbol(p);
        if (opt) pt = removeUndefined(pt);
        out.props[p.name] = { opt, t: canon(pt, ctx) };
      }
      const idx = checker.getIndexInfosOfType(t);
      if (idx.length) out.index = idx.map((i) => ({ key: canon(i.keyType, ctx), t: canon(i.type, ctx) }));
      if (calls.length) out.calls = calls.map((s) => canonSig(s, ctx));
      return out;
    } finally {
      ctx.stack.pop();
    }
  }

  function removeUndefined(t) {
    if (!(t.flags & ts.TypeFlags.Union)) return t;
    const rest = t.types.filter((m) => !(m.flags & ts.TypeFlags.Undefined));
    if (rest.length === t.types.length) return t;
    if (rest.length === 1) return rest[0];
    return { ...t, types: rest, __synthetic: true, flags: t.flags };
  }

  function paramOptional(p) {
    const d = p.valueDeclaration;
    if (!d) return false;
    if (ts.isParameter(d)) {
      if (d.questionToken || d.initializer || d.dotDotDotToken) return true;
      for (const tag of ts.getJSDocParameterTags(d)) if (tag.isBracketed || (tag.typeExpression && ts.isJSDocOptionalType(tag.typeExpression.type))) return true;
      return checker.isOptionalParameter(d);
    }
    return false;
  }

  function canonSig(sig, ctx, retCtx = ctx) {
    const params = sig.getParameters().map((p) => {
      const opt = paramOptional(p);
      const rest = !!(p.valueDeclaration && ts.isParameter(p.valueDeclaration) && p.valueDeclaration.dotDotDotToken);
      let pt = checker.getTypeOfSymbol(p);
      if (opt) pt = removeUndefined(pt);
      return { opt, rest, t: canon(pt, ctx) };
    });
    const out = { k: 'fn', params, ret: canon(sig.getReturnType(), retCtx) };
    if (sig.typeParameters?.length) out.tparams = sig.typeParameters.map((tp) => checker.typeToString(tp) + ' extends ' + (tp.getConstraint() ? checker.typeToString(tp.getConstraint()) : 'unknown'));
    return out;
  }

  return { canon, canonSig, isHandle, productAlias, removeUndefined };
}

// ---- comparing two canonical forms ----

export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Can `nu` stand in for `old` in what it accepts? True when everything the old one accepted is still accepted
 * the same way: nothing removed or renamed, nothing newly required, nothing newly refused.
 */
export function standsIn(old, nu) {
  if (old == null && nu == null) return true;
  if (old == null || nu == null) return false;
  if (same(old, nu)) return true;
  if (nu.k === 'any' || (nu.k === 'prim' && nu.n === 'unknown')) return true;
  if (old.k === 'union') return old.of.every((m) => standsIn(m, nu));
  if (nu.k === 'union') return nu.of.some((m) => standsIn(old, m));
  if (old.k === 'lit' && nu.k === 'prim') return typeof old.v === nu.n;
  if (old.k === 'lit' && nu.k === 'text') return typeof old.v === 'string';
  if (old.k !== nu.k) return false;
  switch (old.k) {
    case 'obj': {
      for (const [name, op] of Object.entries(old.props)) {
        const np = nu.props[name];
        if (!np) return false; // removed or renamed
        if (op.opt && !np.opt) return false; // newly required
        if (!standsIn(op.t, np.t)) return false;
      }
      for (const [name, np] of Object.entries(nu.props)) if (!old.props[name] && !np.opt) return false; // newly required
      if (old.index && !nu.index) return false;
      if (old.index && nu.index && !standsIn({ k: 'union', of: old.index.map((i) => i.t) }, { k: 'union', of: nu.index.map((i) => i.t) })) return false;
      if (old.calls || nu.calls) return same(old.calls, nu.calls);
      return true;
    }
    case 'arr':
      return standsIn(old.of, nu.of);
    case 'tuple':
    case 'params': {
      const oi = old.items, ni = nu.items;
      for (let i = 0; i < oi.length; i++) {
        if (!ni[i]) return false; // removed
        if (oi[i].opt && !ni[i].opt) return false;
        if (!standsIn(oi[i].t, ni[i].t)) return false;
      }
      for (let i = oi.length; i < ni.length; i++) if (!ni[i].opt && !ni[i].rest) return false; // newly required
      return true;
    }
    case 'promise':
      return standsIn(old.of, nu.of);
    default:
      // functions handed in, handles, library kinds, generics: only the same thing stands in
      return same(old, nu);
  }
}

// ---- writing a canonical form for people ----

export function render(c) {
  if (c == null) return '-';
  switch (c.k) {
    case 'any': return 'anything';
    case 'prim': return c.n;
    case 'lit': return JSON.stringify(c.v);
    case 'text': return c.t;
    case 'generic': return c.t;
    case 'other': return c.t;
    case 'cycle': return `(${c.t} again)`;
    case 'deep': return `(${c.t})`;
    case 'union': return c.of.map(render).join(' | ');
    case 'arr': return `${c.ro ? 'readonly ' : ''}${wrap(c.of)}[]`;
    case 'tuple': return `${c.ro ? 'readonly ' : ''}[${c.items.map((i) => `${i.rest ? '...' : ''}${render(i.t)}${i.opt ? '?' : ''}`).join(', ')}]`;
    case 'params': return `(${c.items.map((i, n) => `${i.rest ? '...' : ''}${i.name ?? 'arg' + n}${i.opt ? '?' : ''}: ${render(i.t)}`).join(', ')})`;
    case 'handle': return `handle ${c.name}`;
    case 'ref': return c.args?.length ? `${c.name}<${c.args.map(render).join(', ')}>` : c.name;
    case 'fn': return `${c.tparams ? `<${c.tparams.join(', ')}>` : ''}(${c.params.map((p, i) => `${p.rest ? '...' : ''}arg${i}${p.opt ? '?' : ''}: ${render(p.t)}`).join(', ')}) => ${render(c.ret)}`;
    case 'overloads': return c.of.map(render).join(' & ');
    case 'names': return `names: ${c.names.join(', ')}`;
    case 'obj': {
      const parts = Object.entries(c.props).map(([n, p]) => `${n}${p.opt ? '?' : ''}: ${render(p.t)}`);
      if (c.index) parts.push(...c.index.map((i) => `[key: ${render(i.key)}]: ${render(i.t)}`));
      if (c.calls) parts.push(...c.calls.map(render));
      return `{ ${parts.join('; ')} }`;
    }
    default: return JSON.stringify(c);
  }
}
const wrap = (c) => (c.k === 'union' || c.k === 'fn' ? `(${render(c)})` : render(c));
