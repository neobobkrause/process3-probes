// ===== file: testdiff.mjs (continued) =====

  while (q < a.length - p && q < b.length - p && a[a.length - 1 - q] === b[b.length - 1 - q]) q++;
  const A = a.slice(p, a.length - q);
  const B = b.slice(p, b.length - q);
  if (A.length * B.length > 4e6) return null;
  const n = A.length;
  const m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const runs = [];
  let deleted = false;
  let i = 0;
  let j = 0;
  let cur = null;
  const close = () => { if (cur) runs.push(cur); cur = null; };
  while (i < n || j < m) {
    if (i < n && j < m && A[i] === B[j]) { close(); i++; j++; } else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) { (cur ||= { at: p + j, toks: [] }).toks.push(B[j]); j++; } else { deleted = true; i++; }
  }
  close();
  return { runs, deleted };
}

// Whether an inserted run, at position at in b, only adds properties to an expected object: one
// that is a fixture (`= {`, `= [{`, a value under one) or an expected argument of an assertion
// (assert.x(actual, {...}), .toEqual({...}); never the actual, never another call's argument);
// `, key: value` or `key: value,`, each value balanced, plain data (no ';', '=>' or function), each
// key new to that object, which holds no spread (cold review of PR 193: an override is a change).
const ASSERT_EXPECTED = (b, open) => {
  // b[open] is '(': the call before it.
  const name = b[open - 1];
  if (b[open - 2] === '.' && /^to[A-Z]/.test(name)) return 'all'; // expect(x).toEqual(<expected>)
  let k = open - 1;
  while (b[k - 1] === '.' && /^[\w$]+$/.test(b[k - 2] || '')) k -= 2;
  return b[k] === 'assert' && b[k - 1] !== '.' ? 'after-first' : null;
};
// Every use of name after its declaration at root, to the end of the enclosing block, is inside an
// assertion's expected argument (assert.x(actual, <here>) or .toEqual(<here>)).
function expectedOnly(b, name, root) {
  if (!/^[A-Za-z_$][\w$]*$/.test(name || '')) return false;
  const stack = [];
  for (let k = 0; k < root; k++) { const t = b[k]; if ('([{'.includes(t)) stack.push(k); else if (')]}'.includes(t)) stack.pop(); }
  let uses = 0;
  for (let k = root, d = 0; k < b.length; k++) {
    const t = b[k];
    if ('([{'.includes(t)) { stack.push(k); d++; continue; }
    if (')]}'.includes(t)) { stack.pop(); if (--d < 0) break; continue; }
    if (t !== name || b[k - 1] === '.' || b[k + 1] === ':') continue;
    if (k === root - 2) continue;
    uses++;
    const call = [...stack].reverse().find((q) => b[q] === '(');
    if (call === undefined) return false;
    const how = ASSERT_EXPECTED(b, call);
    if (!how) return false;
    if (how === 'after-first') {
      let dd = 0;
      let comma = false;
      for (let q = call + 1; q < k; q++) { if ('([{'.includes(b[q])) dd++; else if (')]}'.includes(b[q])) dd--; else if (dd === 0 && b[q] === ',') comma = true; }
      if (!comma) return false;
    }
  }
  return uses > 0;
}
function addsProperties(b, run) {
  const stack = [];
  for (let k = 0; k < run.at; k++) { const t = b[k]; if ('([{'.includes(t)) stack.push(k); else if (')]}'.includes(t)) stack.pop(); }
  const obj = stack.at(-1);
  if (b[obj] !== '{') return false;
  // The chain of '{' and '[' it sits in, up to what holds it.
  let i = stack.length - 1;
  // A fixture (`const x = {` or `= [{`) is a root wherever it stands: inside a test's body the
  // climb stops there, never into the function or try block around it (copy PR 632, 6 Nov:
  // `pixels_sha256: null` added to a fixture in a test body read as "not an object property").
  const fixtureRoot = (k) => b[k - 1] === '=' && ['const', 'let', 'var'].includes(b[k - 3]);
  while (i > 0 && '{['.includes(b[stack[i - 1]]) && !fixtureRoot(stack[i])) {
    // inside a '{', the container must be a value (`key: {`), not a block
    if (b[stack[i - 1]] === '{' && b[stack[i] - 1] !== ':') return false;
    i--;
  }
  const root = stack[i];
  const before = b[root - 1];
  const holder = i > 0 ? stack[i - 1] : null;
  if (holder !== null && b[holder] === '(') {
    const how = ASSERT_EXPECTED(b, holder);
    if (!how) return false;
    if (how === 'after-first') {
      // Not the first argument (the actual): a ',' at depth one between '(' and the object.
      let d = 0;
      let comma = false;
      for (let k = holder + 1; k < root; k++) { if ('([{'.includes(b[k])) d++; else if (')]}'.includes(b[k])) d--; else if (d === 0 && b[k] === ',') comma = true; }
      if (!comma) return false;
    }
  } else if (!(before === '=' && ['const', 'let', 'var'].includes(b[root - 3]))) return false;
  // A fixture inside a test's body may be the input to the call under test: only one used solely as
  // an assertion's expected value counts (cold review of the fixture-root fix: `const input = {`
  // gaining `strict: true` before `f(input)` is a behaviour change).
  else if (holder !== null && !expectedOnly(b, b[root - 2], root)) return false;
  if (['const', 'let', 'var'].includes(b[obj - 1])) return false; // destructuring (`const {`)
  // The object's own keys (depth one), the run left out, and whether it holds a spread.
  const own = new Set();
  let d = 0;
  for (let k = obj + 1; k < b.length; k++) {
    if (k >= run.at && k < run.at + run.toks.length) continue;
    const t = b[k];
    if ('([{'.includes(t)) d++;
    else if (')]}'.includes(t)) { if (d === 0) break; d--; } else if (d === 0 && t === '...') return false;
    else if (d === 0 && b[k + 1] === ':' && (b[k - 1] === '{' || b[k - 1] === ',' || k === obj + 1 || k === run.at + run.toks.length)) own.add(t.replace(/^["']|["']$/g, ''));
  }
  const t = run.toks;
  if (t.some((x) => x === ';' || x === '=>' || x === 'function' || x === '...')) return false;
  // Plain data only: no call, construction, await or yield, and no assignment (cold review of the
  // fixture-root fix: `b: await g(2)` or `c: assert.equal(f(), 3)` added a call, read as additive).
  if (t.some((x, k) => ['new', 'await', 'yield', '='].includes(x) || (x === '(' && (k === 0 ? /^[\w$)\]]/.test(b[run.at - 1] || '') : /^[\w$)\]]/.test(t[k - 1]))))) return false;
  let k = 0;
  const lead = t[0] === ',';
  if (lead) k++;
  let props = 0;
  while (k < t.length) {
    if (!/^(?:[A-Za-z_$][\w$]*|["'][^"']*["']|\d+)$/.test(t[k]) || t[k + 1] !== ':') return false;
    const key = t[k].replace(/^["']|["']$/g, '');
    if (own.has(key)) return false;
    own.add(key);
    k += 2;
    let dd = 0;
    const start = k;
    while (k < t.length && !(dd === 0 && t[k] === ',')) { if ('([{'.includes(t[k])) dd++; else if (')]}'.includes(t[k])) { if (--dd < 0) return false; } k++; }
    if (dd !== 0 || k === start) return false;
    props++;
    if (k < t.length) k++; // its comma
    if (!lead && k === t.length && t[k - 1] !== ',' && b[run.at + t.length] !== '}') return false;
  }
  if (lead && t.at(-1) === ',') return false;
  return props > 0;
}

// { class: 'none' | 'additive' | 'breaking', why } for a test file from before to after (either
// may be null: added or removed). ids: the Provides requirement ids, whose labels do not count.
export function classifyTestChange(before, after, ids = []) {
  // A wholly new test file only adds assertions (coordinator, 6 Nov: copy PR 696's added
  // t53-layer.test.mjs was read as breaking). One that replaces a deleted file is compared with
  // that file by the caller (layerflow.mjs interfaceChange), never read here as new.
  if (before === null || before === undefined) return { class: 'additive', why: 'added: a new test file only adds assertions' };
  if (after === null || after === undefined) return { class: 'breaking', why: 'removed' };
  const [ta, tb] = [tokens(before), tokens(after)];
  if (!ta || !tb) return { class: 'breaking', why: 'unparsed' };
  const [a, b] = [significant(ta, ids), significant(tb, ids)];
  if (a.join('\u0000') === b.join('\u0000')) return { class: 'none', why: 'names, comments, labels, imports or formatting only' };
  const d = diff(a, b);
  if (!d) return { class: 'breaking', why: 'too large to align' };
  if (d.deleted) return { class: 'breaking', why: 'an existing token changed or was removed' };
  const bad = d.runs.filter((r) => !addsProperties(b, r));
  if (bad.length) return { class: 'breaking', why: `added code that is not an object property: ${bad[0].toks.slice(0, 8).join(' ')}` };
  return { class: 'additive', why: `added ${d.runs.map((r) => r.toks.filter((x, k) => r.toks[k + 1] === ':').join(', ')).join('; ')}` };
}
// The earlier name: { changed, why }.
export const assertionChange = (before, after, ids = []) => { const c = classifyTestChange(before, after, ids); return { changed: c.class !== 'none', class: c.class, why: c.why }; };

// ===== file: notice-slots.test.mjs =====

// Provider-notice slots (coordinator, 4 Nov): on the copy, a count of notices/*.json read apart
// from the withdrawal rows called 201 slots open across 25 notices, 136 of them in membership:77
// and credentials:74, which BOB had withdrawn; `notice triage` answered "no provider notice" for
// both. One reader (noticeRecords) now serves triage, status, layer close and report tranche: a
// withdrawn notice is found, closed and never counted open, and every open slot the report counts
// carries the command that closes it.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { noticeFile, noticeRecords, notices } from '../lib/notice.mjs';
import { noticeSection } from '../lib/report.mjs';
import { fetchState } from '../lib/state.mjs';
import { layerState, noticeSlots, owedNotices, status } from '../lib/status.mjs';
import { trancheClose } from '../lib/tranche.mjs';
import { noticeTriage, recordTriage, triageFile } from '../lib/triage.mjs';
import { git, loadConfig } from '../lib/util.mjs';
import { commit, entry, makeRepo, onState, openPassed } from './helpers.mjs';

const quiet = () => {};
const MODULES = { modules: [
  { id: 'p', paths: ['src/p/'] },
  { id: 'q', paths: ['src/q/'] },
  ...['u1', 'u2', 'u3', 'u4'].map((id) => ({ id, paths: [`src/${id}/`], uses: ['p', 'q'] })),
] };
const IDS = ['p', 'q', 'u1', 'u2', 'u3', 'u4'];

function product() {
  const root = makeRepo({
    'process/config.json': { modules_file: 'process/modules.json', requirements_dir: 'req' },
    'process/modules.json': MODULES,
    ...Object.fromEntries(IDS.flatMap((id) => [[`process/ledger/${id}.json`, entry(id)], [`req/${id}.md`, `# ${id}\n\n- **R1** met\n`]])),
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['push', '-q', 'origin', 'tranche', 'main'], { cwd: root });
  return root;
}
const push = (root) => git(['push', '-q', 'origin', 'refs/remotes/origin/process-state:refs/heads/process-state'], { cwd: root });
const row = (provider, pr, users) => JSON.stringify({ row: 'notice', at: '2026-11-04T02:59:27.133Z', key: `${provider}:${pr}`, provider, ids: ['R1'], pr, users }) + '\n';

// The copy's shape: q:77 withdrawn with three users unanswered (membership:77), p:8 live with one
// user answered, one judged affected, one untriaged, and one whose open job names it.
function state() {
  const root = product();
  onState(root, {
    [noticeFile('q:77')]: row('q', 77, ['u1', 'u2', 'u3']),
    'notices/withdrawn/q-77.json': JSON.stringify({ row: 'withdrawn', at: '2026-11-04T05:05:39.578Z', key: 'q:77', provider: 'q', pr: 77, by: 'bob', why: 'PR 77 changed no file of q\'s source (src/q/)', users: 3 }) + '\n',
    [noticeFile('p:8')]: row('p', 8, ['u1', 'u2', 'u3', 'u4']),
