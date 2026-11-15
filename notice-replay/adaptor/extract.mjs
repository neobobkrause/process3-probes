#!/usr/bin/env node
// Writes the provider's real files (source and tests) of a replayed change, before or after, at their original paths.
//   node extract.mjs <change> <before|after> <folder>
import { changeOf, extractProvider } from './state.mjs';
const [id, side, dir] = process.argv.slice(2);
const c = changeOf(id);
const files = extractProvider(c, c[side], dir);
console.log(`${files.length} files of ${c.provider} at ${side} of ${id} in ${dir}`);
