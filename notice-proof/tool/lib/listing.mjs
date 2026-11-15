// The listing: a module's interface written out from its code and its structured comments together.
import fs from 'node:fs';
import path from 'node:path';
import { ts, tagsOf, tagText, lineOf, docsOf, declarationsOf } from './ts.mjs';
import { makeCanon } from './canon.mjs';

/** Does the module carry interface comments at all? (Mechanical: any JSDoc tag that states a kind.) */
export function hasInterfaceComments(mod) {
  return mod.src.some((f) => /@(param|returns?|type|typedef|property|template|import)\s*[{\s]/.test(fs.readFileSync(f, 'utf8')));
}

const newCtx = () => ({ kinds: new Map(), stack: [] });

/** Bound lines of a kind, split among its members: "member: ..." or "member.x ..." belongs to that member. */
function boundsFor(lines, member, memberNames) {
  // Iteration 6 (rule 41): a line belongs to one member only when written "member.<rest>"; any other line belongs to
  // every member, so a new member's name cannot capture a line.
  return lines.filter((l) => {
    const m = /^([A-Za-z_$][\w$]*)\./.exec(l);
    if (m && memberNames.includes(m[1])) return m[1] === member;
    return true;
  });
}

/** The kinds named by a @throws tag; {A|B} names two (iteration 6). */
/** Iteration 7 (rule 48): the names of a signature's parameters, '_' for one written as a pattern. */
const paramNamesOf = (sig) => sig.getParameters().map((p) => (p.name.startsWith('__') ? '_' : p.name));

export const throwKinds = (tag) => (tag.typeExpression?.type?.getText?.() ?? '').split('|').map((x) => x.trim()).filter(Boolean);

export function makeLister(program, tree) {
  const checker = program.getTypeChecker();
  const C = makeCanon(checker, tree);

  /**
   * The bound lines of every kind of plain data written out inside an entry. Decided: they are listed as written,
   * without the kind's name, so that renaming a kind does not look like a changed bound.
   */
  function nestedBounds(kctx) {
    const out = [];
    for (const [, decl] of [...kctx.kinds.entries()].sort()) for (const tag of tagsOf(decl, 'bound')) out.push(tagText(tag));
    return out;
  }

  /** Iteration 3 (rule 10): `@throws {Kind} member ...` lines on a kind, split among its members like bound lines. */
  function kindThrows(decl, member, memberNames) {
    const out = [];
    for (const tag of tagsOf(decl, 'throws')) {
      const subject = tagText(tag).split(/[:.\s]/)[0];
      if (subject === member || !memberNames.includes(subject)) out.push(...throwKinds(tag));
    }
    return [...new Set(out)].sort();
  }

  function rangeOf(node, kind) {
    const sf = node.getSourceFile();
    if (kind === 'jsdoc') return { file: sf.fileName, start: node.pos, end: node.end };
    const own = docsOf(node);
    return { file: sf.fileName, start: own.length ? own[0].pos : node.getStart(sf), end: node.end };
  }

  let plainEverywhere = null;

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
              const kt = kindThrows(decl, p.name, names);
              if (kt.length) entries[e].throws = kt;
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
              if (sigs.length) entries[e].paramNames = paramNamesOf(sigs[0]);
              // Iteration 3: a member that may be missing says so (rule 12), and errors stated on the kind (rule 10).
              const raw = checker.getTypeOfSymbol(p);
              if (p.flags & ts.SymbolFlags.Optional || (raw.flags & ts.TypeFlags.Union && raw.types.some((x) => x.flags & ts.TypeFlags.Undefined))) entries[e].optional = true;
              const kt = kindThrows(decl, p.name, names);
              if (kt.length) entries[e].throws = kt;
              note('accepts', a, e); note('handsBack', h, e);
              if (p.declarations?.[0]) ranges.push({ entry: e, ...rangeOf(p.declarations[0], 'jsdoc') });
            }
          } else {
            const k = newCtx();
            const shape = C.canon(t, k, true);
            k.kinds.delete(`${mod.id}.${name}`);
            entries[name] = { kind: 'kind', shape, bounds: [...bounds, ...nestedBounds(k)], where };
            // Iteration 2: a message kind states its channel; the channel is part of what it hands back.
            const msg = tagsOf(decl, 'message');
            if (msg.length) entries[name].channel = msg.map((m) => tagText(m).split(/\s+/)[0] || '(none)').sort().join(' ');
            dataKinds.push(name);
            // Iteration 2: the rows of a shared table, owned by this module.
            for (const tag of tagsOf(decl, 'storedrows')) {
              const table = tagText(tag).split(/\s+/)[0];
              entries[`table:${table}`] = { kind: 'stored rows', accepts: shape, handsBack: shape, side: 'both', bounds: [...bounds, ...nestedBounds(k)], where, rowKind: name };
            }
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
        const ctors = t.getConstructSignatures();
        if (ctors.length) {
          // Iteration 3 (rule 17): an exported class lists what its constructor accepts, and what it builds.
          const c = C.canonSig(ctors[0], a, h);
          entries[name] = { kind: 'class', accepts: { k: 'params', items: c.params }, handsBack: c.ret, bounds: [...ownBounds, ...nestedBounds(a), ...nestedBounds(h)], where, paramNames: paramNamesOf(ctors[0]) };
          const throws = tagsOf(ctors[0].declaration ?? decl, 'throws').map((tg) => tg.typeExpression?.type?.getText?.()).filter(Boolean).sort();
          if (throws.length) entries[name].throws = throws;
          // Iteration 5 (rule 27): each member of the class, static or not, is an entry of its own.
          const members = [
            ...checker.getPropertiesOfType(t).filter((p) => p.name !== 'prototype').map((p) => [`${name}.${p.name}`, p]),
            ...checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(sym)).map((p) => [`${name}#${p.name}`, p]),
          ].filter(([, p]) => !C.isPrivateMember(p)); // replay change 1: private members (#name) are not entries
          for (const [e, p] of members) {
            const mt = checker.getTypeOfSymbol(p);
            const msigs = mt.getCallSignatures();
            const ma = newCtx(), mh = newCtx();
            if (msigs.length) { const mc = C.canonSig(msigs[0], ma, mh); entries[e] = { kind: 'class member', accepts: { k: 'params', items: mc.params }, handsBack: mc.ret, bounds: [...nestedBounds(ma), ...nestedBounds(mh)], where, paramNames: paramNamesOf(msigs[0]) }; }
            else entries[e] = { kind: 'class member', accepts: null, handsBack: C.canon(mt, mh), bounds: nestedBounds(mh), where };
            const md = p.declarations?.[0];
            if (md) ranges.push({ entry: e, ...rangeOf(md) });
          }
        } else if (sigs.length && checker.getPropertiesOfType(t).length === 0) {
          const c = C.canonSig(sigs[0], a, h);
          const items = c.params.map((p, i) => ({ ...p, name: sym.valueDeclaration?.parameters?.[i]?.name?.getText?.() }));
          for (const it of items) delete it.name; // names of parameters are not part of what stands in
          entries[name] = {
            kind: 'function',
            accepts: { k: 'params', items, ...(c.tparams ? { tparams: c.tparams } : {}) },
            handsBack: c.ret,
            bounds: [...ownBounds, ...nestedBounds(a), ...nestedBounds(h)],
            where,
            paramNames: paramNamesOf(sigs[0]),
          };
          // Iteration 2: the kinds of error it raises are part of what it hands back.
          const throws = [...new Set(tagsOf(decl, 'throws').flatMap(throwKinds))].sort();
          // Iteration 4: every overload is listed.
          if (sigs.length > 1) {
            const all = sigs.map((sg) => C.canonSig(sg, a, h));
            entries[name].accepts = { k: 'overloads', of: all.map((c2) => ({ k: 'params', items: c2.params })) };
            entries[name].handsBack = { k: 'overloads', of: all.map((c2) => c2.ret) };
          }
          if (throws.length) entries[name].throws = throws;
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
    // Iteration 3 (rule 10): errors stated on the methods where the object is built, and errors inherited by a method
    // or handler that only hands its call to another listed entry.
    const entryOfDecl = (d) => {
      if (!d) return null;
      const f = d.getSourceFile().fileName, at = (d.name ?? d).end - 1;
      let best = null;
      for (const r of ranges) if (r.file === f && r.start <= at && at < r.end && (!best || r.end - r.start < best.end - best.start)) best = r;
      return best?.entry ?? null;
    };
    const delegations = [];
    for (const f of mod.src) {
      const sf = program.getSourceFile(f);
      if (!sf) continue;
      const visit = (n) => {
        if (ts.isObjectLiteralExpression(n)) {
          const ct = checker.getContextualType(n);
          for (const prop of n.properties) {
            if (!ct || !prop.name || !(ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))) continue;
            const ps = checker.getPropertyOfType(ct, prop.name.text);
            const target = entryOfDecl(ps?.declarations?.[0]);
            if (!target || !entries[target]) continue;
            // the comment of the method, or, for a shorthand member ({ quote }), of the variable it names
            let doc = prop;
            if (ts.isShorthandPropertyAssignment(prop)) { const vd = checker.getShorthandAssignmentValueSymbol(prop)?.declarations?.[0]; if (vd) doc = vd; }
            const stated = tagsOf(doc, 'throws').flatMap(throwKinds);
            if (stated.length) entries[target].throws = [...new Set([...(entries[target].throws ?? []), ...stated])].sort();
            // Iteration 6 (rule 37): a bound written where the object is built belongs to that member.
            const bnds = tagsOf(doc, 'bound').map(tagText);
            if (bnds.length) entries[target].bounds = [...new Set([...(entries[target].bounds ?? []), ...bnds])].sort();
            // Iteration 4 (rule 23): every listed entry called anywhere in the method's body passes its errors on.
            const fn = ts.isMethodDeclaration(prop) ? prop : ts.isPropertyAssignment(prop) && (ts.isArrowFunction(prop.initializer) || ts.isFunctionExpression(prop.initializer)) ? prop.initializer : null;
            const calls = [];
            const findCalls = (m) => { if (ts.isCallExpression(m)) calls.push(m); ts.forEachChild(m, findCalls); };
            if (fn?.body) findCalls(fn.body);
            for (const call of calls) {
              const callee = ts.isPropertyAccessExpression(call.expression) ? call.expression.name : call.expression;
              let sym = checker.getSymbolAtLocation(callee);
              if (sym && sym.flags & ts.SymbolFlags.Alias) { try { sym = checker.getAliasedSymbol(sym); } catch { sym = undefined; } }
              // a local function of the module (such as quote inside createBookings) stands for the member it fills
              let decl = sym?.declarations?.[0];
              let from = entryOfDecl(decl);
              if (!from && decl && ts.isVariableDeclaration(decl)) {
                const owner = Object.keys(entries).find((n) => n.endsWith(`.${sym.name}`) && entries[n].kind === 'method');
                if (owner) from = owner;
              }
              // iteration 6 (rule 43): does the method only hand its call straight on, (req) => bookings.open(req)?
              let body = fn?.body;
              if (body && ts.isBlock(body) && body.statements.length === 1 && ts.isReturnStatement(body.statements[0])) body = body.statements[0].expression;
              while (body && (ts.isParenthesizedExpression(body) || ts.isAwaitExpression(body))) body = body.expression;
              const params = new Set((fn?.parameters ?? []).map((p) => (ts.isIdentifier(p.name) ? p.name.text : '')));
              const fromParam = (a) => { while (ts.isPropertyAccessExpression(a)) a = a.expression; return ts.isIdentifier(a) && params.has(a.text); };
              const straight = body === call && call.arguments.every(fromParam);
              if (from && from !== target) delegations.push([target, from, straight]);
            }
          }
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
    for (let round = 0; round < 3; round++) for (const [to, from, straight] of delegations) {
      const inherited = entries[from]?.throws ?? [];
      if (inherited.length) entries[to].throws = [...new Set([...(entries[to].throws ?? []), ...inherited])].sort();
      // Iteration 6 (rule 43): and its bounds, which limit what the caller can accept just as much.
      const inb = straight ? (entries[from]?.bounds ?? []) : [];
      if (inb.length) entries[to].bounds = [...new Set([...(entries[to].bounds ?? []), ...inb])];
    }
    for (const e of Object.values(entries)) e.bounds = [...new Set(e.bounds)].sort();
    // Iteration 4 (rule 18): each entry's declaration as TypeScript prints it.
    // plain kinds (unions, plain kinds) of every module the program reads, to write out where another module names them
    if (!plainEverywhere) {
      plainEverywhere = new Map();
      for (const m of tree.modules) for (const f of m.public) if (program.getSourceFile(f)) for (const [k, v] of declarationsOf(program, f).__plain ?? []) plainEverywhere.set(k, v);
    }
    const decls = {};
    for (const f of mod.public) Object.assign(decls, declarationsOf(program, f, plainEverywhere));
    for (const [name, e] of Object.entries(entries)) {
      if (name.startsWith('op:')) {
        const table = Object.entries(entries).find(([n, x]) => x.kind === 'operation table' && x.handsBack?.names?.includes(name.slice(3)))?.[0];
        if (table && decls[`${table}.${name.slice(3)}`] !== undefined) e.decl = decls[`${table}.${name.slice(3)}`];
      } else if (name.startsWith('table:')) {
        if (decls[e.rowKind] !== undefined) e.decl = decls[e.rowKind];
      } else if (decls[name] !== undefined) e.decl = decls[name];
    }
    const sorted = Object.fromEntries(Object.keys(entries).sort().map((k) => [k, entries[k]]));
    return { module: mod.id, hasInterfaceComments: hasInterfaceComments(mod), entries: sorted, ranges };
  }

  return { list, checker, canonApi: C };
}
