#!/usr/bin/env node
// For each user of a provider in a product folder: whether the tool can follow it fully, and which entries of the
// provider its code uses, as the tool's own usage reading finds them (notice-proof/tool/lib/usage.mjs, unchanged).
//   node adaptor/follow.mjs <product folder> <provider> [--user <id>] [--list]
// "anything": the places where the user reads or calls a value of unknown kind (each makes the tool stop following
// the user fully); --list prints them for --user.
import { analyse } from '../../notice-proof/tool/lib/notice.mjs';
const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv.splice(i, 2)[1] : undefined; };
const onlyUser = opt('--user');
const list = argv.includes('--list');
const [root, provider] = argv.filter((a) => a !== '--list');
const A = analyse(root);
for (const m of A.tree.modules) {
  if (m.id === provider || (onlyUser && m.id !== onlyUser)) continue;
  const u = A.uses.get(m.id);
  const used = u.uses.get(provider);
  console.log(`${m.id.padEnd(22)} unknown-kind reads ${String(u.anything.length).padStart(5)}  unread op calls ${u.unreadOps.length}  entries of ${provider}: ${used ? [...used.keys()].join(', ') : '-'}`);
  if (list) for (const a of u.anything) console.log(`    ${a}`);
}
