#!/usr/bin/env node
// The build tool. Three commands:
//   listing <product folder> <module> [--json]
//   notice  <product before> <product after> <module that changed> [--json]
//   check   <product folder> <module> [--comments-only-against <product before>] [--json]
// Exit status: listing and notice 0; check 1 when it refuses (or the comments-only verification fails).
import { loadTree } from './lib/model.mjs';
import { makeProgram } from './lib/ts.mjs';
import { makeLister } from './lib/listing.mjs';
import { notice, noticeText, describe } from './lib/notice.mjs';
import { check, commentsOnly } from './lib/check.mjs';

export function listingOf(root, moduleId) {
  const tree = loadTree(root);
  const mod = tree.byId.get(moduleId);
  if (!mod) throw new Error(`no such module: ${moduleId}`);
  const program = makeProgram(mod.public);
  const l = makeLister(program, tree).list(mod);
  return { module: l.module, hasInterfaceComments: l.hasInterfaceComments, entries: Object.fromEntries(Object.entries(l.entries).map(([k, e]) => [k, { ...describe(e), where: e.where }])) };
}

function listingText(l) {
  const L = [`Listing of ${l.module}${l.hasInterfaceComments ? '' : ' (no interface comments)'}`];
  for (const [name, e] of Object.entries(l.entries)) {
    L.push(`  ${e.kind} ${name}   [${e.where}]`);
    if (e.accepts) L.push(`      accepts: ${e.accepts}`);
    if (e.handsBack) L.push(`      hands back: ${e.handsBack}`);
    for (const b of e.bounds ?? []) L.push(`      bound: ${b}`);
    if (e.throws) L.push(`      throws: ${e.throws.join(', ')}`);
    if (e.channel) L.push(`      message on: ${e.channel}`);
  }
  return L.join('\n');
}

function main(argv) {
  const json = argv.includes('--json');
  const args = argv.filter((a) => a !== '--json');
  const [cmd, ...rest] = args;
  if (cmd === 'listing') {
    const l = listingOf(rest[0], rest[1]);
    console.log(json ? JSON.stringify(l, null, 2) : listingText(l));
    return 0;
  }
  if (cmd === 'notice') {
    const r = notice(rest[0], rest[1], rest[2]);
    console.log(json ? JSON.stringify(r, null, 2) : noticeText(r));
    return 0;
  }
  if (cmd === 'check') {
    const i = rest.indexOf('--comments-only-against');
    const tree = loadTree(rest[0]);
    const r = check(tree, rest[1]);
    let status = r.refused ? 1 : 0;
    if (i >= 0) {
      r.commentsOnly = commentsOnly(loadTree(rest[i + 1]), tree, rest[1]);
      if (!r.commentsOnly.same) status = 1;
    }
    if (json) console.log(JSON.stringify(r, null, 2));
    else {
      console.log(`Check of ${r.module}: ${r.refused ? `REFUSED (${r.refusals.length})` : 'no disagreement found'}`);
      for (const x of r.refusals) console.log(`  ${x.at} ${x.kind}: ${x.text}`);
      if (r.cannotTell.length) console.log(`  (${r.cannotTell.length} place(s) where the reader cannot tell; not refused)`);
      if (r.commentsOnly) console.log(`  comments only: ${r.commentsOnly.same ? 'yes, running code unchanged' : 'NO'}${r.commentsOnly.files.filter((f) => !f.same).map((f) => `\n    changed running code: ${f.file}${f.why ? ` (${f.why})` : ''}`).join('')}`);
    }
    return status;
  }
  console.error('usage: p3tool listing|notice|check ...');
  return 2;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exitCode = main(process.argv.slice(2));
