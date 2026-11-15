// The listing: a module's interface written out from its code and its structured comments together.
import fs from 'node:fs';
import path from 'node:path';
import { ts, tagsOf, tagText, lineOf, docsOf } from './ts.mjs';
import { makeCanon } from './canon.mjs';

/** Does the module carry interface comments at all? (Mechanical: any JSDoc tag that states a kind.) */
export function hasInterfaceComments(mod) {
  return mod.src.some((f) => /@(param|returns?|type|typedef|property|template|import)\s*[{\s]/.test(fs.readFileSync(f, 'utf8')));
}

const newCtx = () => ({ kinds: new Map(), stack: [] });

/** Bound lines of a kind, split among its members: "member: ..." or "member.x ..." belongs to that member. */
function boundsFor(lines, member, memberNames) {
  return lines.filter((l) => {
    const subject = l.split(/[:.\s]/)[0];
    if (subject === member) return true;
    return !memberNames.includes(subject); // a line about no particular member belongs to all of them
  });
}

export function makeLister(program, tree) {
  const checker = program.getTypeChecker();
  const C = makeCanon(checker, tree);

  /** The bound lines of every kind of plain data written out inside an entry, each prefixed by its kind's name. */
  function nestedBounds(kctx) {
    const out = [];
    for (const [key, decl] of [...kctx.kinds.entries()].sort()) {
      for (const tag of tagsOf(decl, 'bound')) out.push(`${key.split('.').slice(1).join('.')}: ${tagText(tag)}`);
    }
    return out;
  }

  function rangeOf(node, kind) {
    const sf = node.getSourceFile();
    if (kind === 'jsdoc') return { file: sf.fileName, start: node.pos, end: node.end };
    const own = docsOf(node);
    return { file: sf.fileName, start: own.length ? own[0].pos : node.getStart(sf), end: node.end };
  }

  function list(mod) {
    const entries = {};
    const ranges = [];
    const kindsIn = { accepts: new Map(), handsBack: new Map() }; // data kind key -> entries mentioning it
    const note = (side, kctx, entryName) => { for (const k of kctx.kinds.keys()) { if (!kindsIn[side].has(k)) kindsIn[side].set(k, []); kindsIn[side].get(k).push(entryName); } };
    const dataKinds = [];
    for (const file of mod.public) {
      const sf = program.getSourceFile(file);
      if (!sf) continue;
      const modSym = checker.getSymbolAtLocation(sf);
      if (!modSym) continue;
      for (const exp of checker.getExportsOfModule(modSym)) {
        const sym = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
        const decl = sym.declarations?.[0];
        if (!decl) continue;
        const where = `${path.relative(tree.root, decl.getSourceFile().fileName)}:${lineOf(decl)}`;
        const name = exp.name;
        if (sym.flags & ts.SymbolFlags.TypeAlias) {
          const t = checker.getDeclaredTypeOfSymbol(sym);
          const bounds = tagsOf(decl, 'bound').map(tagText);
          ranges.push({ entry: name, ...rangeOf(decl, 'jsdoc') });
          if (tagsOf(decl, 'optable').length) {
            const props = checker.getPropertiesOfType(t);
            const names = props.map((p) => p.name).sort();
            entries[name] = { kind: 'operation table', handsBack: { k: 'names', names }, bounds: [], where };
            for (const p of props) {
              const pt = checker.getTypeOfSymbol(p);
              const req = checker.getPropertyOfType(pt, 'req');
              const res = checker.getPropertyOfType(pt, 'res');
              const a = newCtx(), h = newCtx();
              const e = `op:${p.name}`;
              entries[e] = {
                kind: 'operation',
                accepts: req ? C.canon(checker.getTypeOfSymbol(req), a) : null,
                handsBack: res ? C.canon(checker.getTypeOfSymbol(res), h) : null,
                bounds: [...boundsFor(bounds, p.name, names), ...nestedBounds(a), ...nestedBounds(h)],
                where: p.declarations?.[0] ? `${path.relative(tree.root, p.declarations[0].getSourceFile().fileName)}:${lineOf(p.declarations[0])}` : where,
              };
              note('accepts', a, e); note('handsBack', h, e);
              if (p.declarations?.[0]) ranges.push({ entry: e, ...rangeOf(p.declarations[0], 'jsdoc') });
            }
          } else if (C.isHandle(t)) {
            const props = checker.getPropertiesOfType(t);
            const names = props.map((p) => p.name).sort();
            entries[name] = { kind: 'handle kind', handsBack: { k: 'names', names }, bounds: [], where };
            for (const p of props) {
              const e = `${name}.${p.name}`;
              const mt = checker.getNonNullableType(checker.getTypeOfSymbol(p));
              const sigs = mt.getCallSignatures();
              const a = newCtx(), h = newCtx();
              let accepts = null, handsBack;
              if (sigs.length) {
                const c = C.canonSig(sigs[0], a, h);
                accepts = { k: 'params', items: c.params, ...(c.tparams ? { tparams: c.tparams } : {}) };
                handsBack = c.ret;
              } else handsBack = C.canon(mt, h);
              entries[e] = { kind: 'method', accepts, handsBack, bounds: [...boundsFor(bounds, p.name, names), ...nestedBounds(a), ...nestedBounds(h)], where };
              note('accepts', a, e); note('handsBack', h, e);
              if (p.declarations?.[0]) ranges.push({ entry: e, ...rangeOf(p.declarations[0], 'jsdoc') });
            }
          } else {
            const k = newCtx();
            const shape = C.canon(t, k, true);
            k.kinds.delete(`${mod.id}.${name}`);
            entries[name] = { kind: 'kind', shape, bounds: [...bounds, ...nestedBounds(k)], where };
            dataKinds.push(name);
          }
          continue;
        }
        // functions and values
        const t = checker.getTypeOfSymbol(sym);
        const sigs = t.getCallSignatures();
        const host = ts.isVariableDeclaration(decl) ? decl.parent.parent : decl;
        ranges.push({ entry: name, ...rangeOf(host) });
        const ownBounds = tagsOf(decl, 'bound').map(tagText);
        const a = newCtx(), h = newCtx();
        if (sigs.length && checker.getPropertiesOfType(t).length === 0) {
          const c = C.canonSig(sigs[0], a, h);
          const items = c.params.map((p, i) => ({ ...p, name: sym.valueDeclaration?.parameters?.[i]?.name?.getText?.() }));
          for (const it of items) delete it.name; // names of parameters are not part of what stands in
          entries[name] = {
            kind: 'function',
            accepts: { k: 'params', items, ...(c.tparams ? { tparams: c.tparams } : {}) },
            handsBack: c.ret,
            bounds: [...ownBounds, ...nestedBounds(a), ...nestedBounds(h)],
            where,
          };
        } else {
          // A plain constant's single value (a price, a limit) is content, not a kind: unless its comment states a
          // kind, a lone literal is widened to its base kind. A list or table marked as constant keeps its names.
          const stated = ts.getJSDocType(decl) || ts.getJSDocType(host);
          const vt = !stated && t.flags & ts.TypeFlags.Literal ? checker.getBaseTypeOfLiteralType(t) : t;
          entries[name] = { kind: 'value', accepts: null, handsBack: C.canon(vt, h), bounds: [...ownBounds, ...nestedBounds(h)], where };
        }
        note('accepts', a, name); note('handsBack', h, name);
      }
    }
    // A kind of plain data is accepted, handed back or both, according to where the module's own entries use it.
    for (const name of dataKinds) {
      const key = `${mod.id}.${name}`;
      const inA = kindsIn.accepts.has(key), inH = kindsIn.handsBack.has(key);
      const side = inA && !inH ? 'accepts' : !inA && inH ? 'handsBack' : 'both';
      const e = entries[name];
      e.side = side;
      e.accepts = side === 'handsBack' ? null : e.shape;
      e.handsBack = side === 'accepts' ? null : e.shape;
      delete e.shape;
    }
    for (const e of Object.values(entries)) e.bounds = [...new Set(e.bounds)].sort();
    const sorted = Object.fromEntries(Object.keys(entries).sort().map((k) => [k, entries[k]]));
    return { module: mod.id, hasInterfaceComments: hasInterfaceComments(mod), entries: sorted, ranges };
  }

  return { list, checker, canonApi: C };
}
