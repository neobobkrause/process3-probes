#!/usr/bin/env node
// Gathers the effort record: the helpers' logs (effort/<provider>.jsonl, appended as they worked) and the counts
// measured from the commented files themselves. Writes effort.json.
//   node adaptor/effort.mjs
// Counted from each commented state against the real files at that state (git diff --no-index):
//   lines added and removed; comment blocks added (/** ... */); tags written, by name; source lines of the provider.
// For an update step, the counts are of the comments' own change: the commented after state against the commented
// before state, less the real change (both diffed against their real files, the difference of the two).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CHANGES, extractProvider } from './state.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const TAGS = ['typedef', 'property', 'param', 'returns', 'return', 'throws', 'bound', 'type', 'callback', 'template', 'import', 'optable', 'storedrows', 'message', 'carriesop', 'carriestable'];
const walk = (dir, base = dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))]) : [];

/** Lines of the commented files that are not in the real files, and lines of the real files that are not kept. */
function diffLines(realDir, comDir) {
  const added = [], removed = [];
  for (const f of walk(comDir)) {
    const real = path.join(realDir, f);
    const r = spawnSync('git', ['diff', '--no-index', '-U0', fs.existsSync(real) ? real : '/dev/null', path.join(comDir, f)]);
    for (const l of r.stdout.toString().split('\n')) {
      if (l.startsWith('+++') || l.startsWith('---')) continue;
      if (l.startsWith('+')) added.push(l.slice(1));
      else if (l.startsWith('-')) removed.push(l.slice(1));
    }
  }
  return { added, removed };
}

function countTags(lines) {
  const out = {};
  for (const l of lines) for (const m of l.matchAll(/@([a-z]+)\b/g)) if (TAGS.includes(m[1])) out[m[1]] = (out[m[1]] ?? 0) + 1;
  return out;
}

function measure(realDir, comDir) {
  const { added, removed } = diffLines(realDir, comDir);
  const nonBlank = added.filter((l) => l.trim());
  return {
    linesAdded: added.length, linesRemoved: removed.length,
    commentLinesAdded: nonBlank.length,
    blocksAdded: added.filter((l) => /\/\*\*/.test(l)).length,
    tags: countTags(added),
    tagsRemoved: countTags(removed),
  };
}

function sourceLines(dir, provider) {
  return walk(dir).filter((f) => f.includes(`/src/${provider}/`) || !f.includes('/test/')).filter((f) => /\.mjs$/.test(f) && !f.includes('/test/')).reduce((n, f) => n + fs.readFileSync(path.join(dir, f), 'utf8').split('\n').length, 0);
}

function sub(a, b) { // the comments' own change: a (after) minus b (before)
  const t = {};
  for (const k of new Set([...Object.keys(a.tags), ...Object.keys(b.tags)])) t[k] = (a.tags[k] ?? 0) - (b.tags[k] ?? 0);
  return { commentLinesNet: a.commentLinesAdded - b.commentLinesAdded, blocksNet: a.blocksAdded - b.blocksAdded, tagsNet: t };
}

const providers = [...new Set(CHANGES.map((c) => c.provider))];
const out = { written: new Date().toISOString(), method: 'see the header of adaptor/effort.mjs', providers: {} };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'effort-'));
for (const p of providers) {
  const log = path.join(ROOT, 'effort', `${p}.jsonl`);
  const events = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch { return { unreadable: l }; } }) : [];
  const states = [];
  let prev = null;
  for (const c of CHANGES.filter((x) => x.provider === p)) {
    for (const side of ['before', 'after']) {
      const com = path.join(ROOT, 'commented', p, `${c.pr}-${side}`);
      if (!fs.existsSync(com)) continue;
      const real = path.join(tmp, `${c.pr}-${side}`);
      extractProvider(c, c[side], real);
      const m = measure(real, com);
      const s = { change: c.change, side, sourceLines: sourceLines(real, p), ...m };
      if (prev) s.againstPrevious = sub(m, prev);
      states.push(s);
      prev = m;
    }
  }
  // steps from the log: start and end of each
  const steps = [];
  for (const e of events) {
    if (e.event === 'start') steps.push({ step: e.step, start: e.t });
    else if (e.event === 'end') {
      const s = [...steps].reverse().find((x) => x.step === e.step && !x.end) ?? (steps.push({ step: e.step }), steps[steps.length - 1]);
      Object.assign(s, { end: e.t, ...e, t: undefined, event: undefined });
      if (s.start && s.end) s.minutes = Math.round((Date.parse(s.end) - Date.parse(s.start)) / 600) / 100;
    }
  }
  out.providers[p] = { steps, states, notes: events.filter((e) => e.event === 'note') };
}
fs.rmSync(tmp, { recursive: true, force: true });
fs.writeFileSync(path.join(ROOT, 'effort.json'), JSON.stringify(out, null, 1) + '\n');
for (const [p, x] of Object.entries(out.providers)) console.log(p, x.steps.map((s) => `${s.step}: ${s.minutes ?? '?'} min`).join('; '));
