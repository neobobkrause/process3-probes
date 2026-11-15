// Ground truth, independent of the tool: run every module's own tests in a product folder.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function runTests(dir) {
  const tests = fs.existsSync(path.join(dir, 'test')) ? fs.readdirSync(path.join(dir, 'test')).filter((f) => f.endsWith('.test.mjs')).map((f) => path.join(dir, 'test', f)) : [];
  if (!tests.length) return Promise.resolve({ pass: true, failed: [], ran: 0 });
  return new Promise((resolve) => {
    execFile(process.execPath, ['--test', '--test-reporter=tap', ...tests], { cwd: dir, timeout: 120000 }, (err, stdout) => {
      const failed = [];
      for (const line of String(stdout).split('\n')) {
        const m = /^\s*not ok \d+ - (.*)$/.exec(line);
        if (m && !/\.test\.mjs$/.test(m[1])) failed.push(m[1].trim());
      }
      const ran = (String(stdout).match(/^# tests (\d+)/m) ?? [])[1];
      resolve({ pass: !err, failed: [...new Set(failed)], ran: Number(ran ?? 0) });
    });
  });
}

/** Every module's tests in a product folder, a few at a time. */
export async function testAll(root, ids) {
  const out = {};
  const queue = [...ids];
  const worker = async () => { while (queue.length) { const id = queue.shift(); out[id] = await runTests(path.join(root, id)); } };
  await Promise.all([worker(), worker(), worker(), worker()]);
  return Object.fromEntries(ids.map((id) => [id, out[id]]));
}
