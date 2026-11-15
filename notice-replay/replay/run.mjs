#!/usr/bin/env node
// Runs the notice tool on replayed changes: the provider commented, before and after, with its users.
//
//   node replay/run.mjs [change ...] [--jobs 2] [--work <scratch folder>] [--tool <p3tool.mjs>] [--out <results folder>]
//                       [--commented-users <folder>]...
// --tool: which version of the tool (default: notice-proof/tool as on this branch). --out: where the reports go
// (default results/notice). --commented-users: commented users' files laid over both sides (at their original paths).
//
// With no change named, every change that has commented states (commented/<provider>/<pr>-before and -after).
// For each: builds the two product folders (adaptor/state.mjs), runs `p3tool notice <before> <after> <provider>`
// and writes <out>/<change>.json.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CHANGES, buildState } from '../adaptor/state.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv.splice(i, 2)[1] : d; };
const TOOL = path.resolve(opt('--tool', path.resolve(ROOT, '../notice-proof/tool/p3tool.mjs')));
const usersOverlay = opt('--commented-users', null);
const jobs = Number(opt('--jobs', '2'));
const work = path.resolve(opt('--work', path.join(ROOT, 'work', 'run')));
const outDir = path.resolve(opt('--out', path.join(ROOT, 'results', 'notice')));
const comDir = (c, side) => path.join(ROOT, 'commented', c.provider, `${c.pr}-${side}`);
const wanted = argv.length ? argv.map((a) => CHANGES.find((c) => c.change === a)) : CHANGES.filter((c) => fs.existsSync(comDir(c, 'before')) && fs.existsSync(comDir(c, 'after')));
fs.mkdirSync(outDir, { recursive: true });

function one(c) {
  return new Promise((resolve) => {
    const base = path.join(work, c.change.replace(':', '-'));
    const b = path.join(base, 'before'), a = path.join(base, 'after');
    buildState(c.change, 'before', b, { commented: comDir(c, 'before'), users: usersOverlay });
    buildState(c.change, 'after', a, { commented: comDir(c, 'after'), users: usersOverlay });
    const t0 = Date.now();
    const p = spawn('node', ['--max-old-space-size=6000', TOOL, 'notice', b, a, c.provider, '--json']);
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (code) => {
      const ms = Date.now() - t0;
      let report;
      try { report = JSON.parse(out); } catch { report = { error: err.slice(-4000), status: code }; }
      report.replay = { change: c.change, ms, ranAt: new Date().toISOString(), tool: path.relative(path.resolve(ROOT, '..'), TOOL), commentedUsers: usersOverlay ? path.relative(ROOT, usersOverlay) : null };
      fs.writeFileSync(path.join(outDir, `${c.change.replace(':', '-')}.json`), JSON.stringify(report, null, 1) + '\n');
      fs.rmSync(base, { recursive: true, force: true });
      console.log(`${c.change}: ${report.summary ?? 'ERROR ' + (report.error ?? '').slice(0, 300)} (${Math.round(ms / 1000)} s)`);
      resolve();
    });
  });
}

const queue = [...wanted];
await Promise.all(Array.from({ length: jobs }, async () => { while (queue.length) await one(queue.shift()); }));
