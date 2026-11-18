// ===== file: register.mjs (continued) =====

  const atTip = git(['rev-parse', '--verify', '-q', ref], { cwd: root, allowFail: true }).code === 0;
  const text = atTip ? (exists(root, ref, path) ? git(['show', `${ref}:${path}`], { cwd: root }) : null) : (existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : null);
  return { repo: 'product', register: parseRegister(text, path) };
}
// Both registers' block for a role, as a role's prompt prints it. processRoot: tests' seam.
// A register that cannot be read stops no start: the block says so, for the triage lane to mend.
export function standingFor(root, cfg, role, { processRoot: pr = processRoot() } = {}) {
  const regs = [];
  const bad = [];
  for (const read of [() => processRegister(pr), () => (cfg ? productRegister(root, cfg) : null)]) {
    try { const r = read(); if (r) regs.push(r); } catch (e) { bad.push(e.message); }
  }
  const text = standingBlock(regs, role);
  return bad.length ? `${text || `${STANDING_HEAD}\n`}\nA triage register could not be read (${bad.join('; ')}): its chosen responses are missing here; tell its triage lane.\n` : text;
}

// Which register a triage command writes: in a process3 checkout (the tool at its root, no product
// config), the process's; in a product, its triage lane's.
export function registerHere(root, cfg) {
  if (!existsSync(join(root, CONFIG_FILE)) && existsSync(join(root, 'tool', 'p3.mjs'))) return { repo: 'process', dir: PROCESS_TRIAGE.dir, prefix: 'P' };
  const l = productTriageLane(cfg) || fail('this product names no triage lane: add {"name": "triage", "dir": "<folder>", "kind": "triage"} to "lanes" in process/config.json');
  return { repo: 'product', dir: l.dir, prefix: 'T' };
}

const readHere = (root, where) => {
  const f = join(root, where.dir, REGISTER);
  return parseRegister(existsSync(f) ? readFileSync(f, 'utf8') : null, `${where.dir}/${REGISTER}`);
};
const closedRows = (root, where) => {
  const f = join(root, where.dir, CLOSED);
  return existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l, i) => { try { return JSON.parse(l); } catch { return fail(`${where.dir}/${CLOSED} line ${i + 1} is not JSON; nothing written`); } }) : [];
};
// The normal commit path: a commit of the register's files on the current branch, never the
// tranche or main; it lands by pull request (a product's triage folder takes the lane's path).
function branchFor(root, tranche) {
  const b = git(['symbolic-ref', '-q', '--short', 'HEAD'], { cwd: root, allowFail: true }).stdout.trim();
  if (!b) fail('check out the triage lane\'s working branch first (a detached HEAD holds no commit); nothing written');
  if (b === 'main' || b === tranche) fail(`the register lands by pull request, never by a commit on ${b}: work on the triage lane's branch; nothing written`);
  return b;
}

const write = (root, where, reg) => {
  mkdirSync(join(root, where.dir), { recursive: true });
  writeFileSync(join(root, where.dir, REGISTER), JSON.stringify(reg, null, 2) + '\n');
};
// The cap's report, over the registers as this checkout now holds them (the one written, as written).
const capLine = (root, cfg, where, log) => {
  const regs = [
    ...(where.repo === 'process' ? [{ repo: 'process', register: readHere(root, where) }] : (() => { try { return [processRegister()]; } catch { return []; } })()),
    ...(where.repo === 'product' ? [{ repo: 'product', register: readHere(root, where) }] : []),
  ];
  const over = AFFECTS.filter((role) => Buffer.byteLength(standingBlock(regs, role)) > STANDING_CAP);
  if (over.length) log(`over the cap: the standing block of ${over.join(', ')} is over ${STANDING_CAP} bytes; close or combine entries so it is read, not skimmed`);
  return over;
};

const commit = (root, where, files, msg) => {
  git(['add', ...files.map((f) => join(where.dir, f))], { cwd: root });
  git(['commit', '-q', ...msg.flatMap((m) => ['-m', m]), '--', ...files.map((f) => join(where.dir, f))], { cwd: root });
};

// triage add --kind short-term|long-term --problem ... --evidence ... --option ... --context ... [--option ... --context ...] [--judged-against ...] [--owner ...]
// AUD-8: the entry carries the options, each with its context, for a choice; no response yet, so nothing is printed.
export function triageAdd(root, cfg, o, { log = console.log, tranche = cfg?.tranche || 'tranche' } = {}) {
  const where = registerHere(root, cfg);
  const branch = branchFor(root, tranche);
  const reg = readHere(root, where);
  const ids = [...reg.open, ...closedRows(root, where)].map((e) => Number(String(e.id).slice(1))).filter(Number.isFinite);
  const id = `${where.prefix}${Math.max(0, ...ids) + 1}`;
  const opts = list(o.option);
  const ctxs = list(o.context);
  if (opts.length !== ctxs.length) fail(`triage add: each --option takes its own --context (${opts.length} options, ${ctxs.length} contexts); nothing written`);
  const e = { id, kind: o.kind, problem: one(o.problem), evidence: one(o.evidence), options: opts.map((x, i) => ({ option: one(x), context: one(ctxs[i]) })) };
  if (o.kind === 'long-term') e.judged_against = one(o['judged-against']);
  Object.assign(e, { owner: one(o.owner) || `the ${where.repo === 'process' ? PROCESS_TRIAGE.name : productTriageLane(cfg).name} lane`, state: 'options brought for a choice', opened_at: now() });
  checkEntry(e, 'triage add');
  reg.open.push(e);
  write(root, where, reg);
  commit(root, where, [REGISTER], [`triage ${id}: ${e.kind} entry added, ${e.options.length} option${e.options.length === 1 ? '' : 's'}`]);
  log(`triage ${id} added to ${where.dir}/${REGISTER} on ${branch}; push it and land it by pull request into ${tranche}, then bring its options with their context to Bob, through BOB by send_message (AUD-8)`);
  return e;
}

// triage choose <id> --response "<the chosen response, word for word>" --chosen-by "<the dated words that chose it, quoted>" [--end ... --affects <roles>]
// Once chosen, a short-term response with its end condition is printed into the roles it names (AUD-8).
export function triageChoose(root, cfg, id, o, { log = console.log, tranche = cfg?.tranche || 'tranche' } = {}) {
  const where = registerHere(root, cfg);
  const branch = branchFor(root, tranche);
  const reg = readHere(root, where);
  const e = reg.open.find((x) => x.id === id) || fail(`no open entry ${JSON.stringify(id)} in ${where.dir}/${REGISTER}; open: ${reg.open.map((x) => x.id).join(', ') || 'none'}`);
  if (e.response !== undefined) fail(`triage ${id} already has its chosen response; close it and add a new entry to change it; nothing written`);
  Object.assign(e, { response: one(o.response), chosen_by: one(o['chosen-by']), chosen_at: one(o['chosen-at']) || now().slice(0, 10) });
  if (e.kind === 'short-term') Object.assign(e, { end_condition: one(o.end), affects: String(o.affects ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) });
  e.state = 'response chosen';
  checkEntry(e, 'triage choose');
  write(root, where, reg);
  commit(root, where, [REGISTER], [`triage ${id}: response chosen`]);
  log(`triage ${id}: response recorded on ${branch}; push it and land it by pull request into ${tranche}${e.kind === 'short-term' ? `; once landed it reaches ${e.affects.join(', ')} at their next start` : ''}`);
  capLine(root, cfg, where, log);
  return e;
}

// triage close <id> --how "<how the end condition was met>": the entry leaves the register for closed.jsonl.
export function triageClose(root, cfg, id, { how, log = console.log, tranche = cfg?.tranche || 'tranche' } = {}) {
  if (!one(how)) fail(`triage close ${id ?? '<id>'} --how "<how the end condition was met, with its evidence>"`);
  const where = registerHere(root, cfg);
  const branch = branchFor(root, tranche);
  const reg = readHere(root, where);
  const e = reg.open.find((x) => x.id === id) || fail(`no open entry ${JSON.stringify(id)} in ${where.dir}/${REGISTER}; open: ${reg.open.map((x) => x.id).join(', ') || 'none'}`);
  reg.open = reg.open.filter((x) => x !== e);
  write(root, where, reg);
  appendFileSync(join(root, where.dir, CLOSED), JSON.stringify({ ...e, state: 'closed', closed_at: now(), how_met: one(how) }) + '\n');
  commit(root, where, [REGISTER, CLOSED], [`triage ${id}: closed`, one(how)]);
  log(`triage ${id} closed on ${branch}; push it and land it by pull request into ${tranche}`);
  return e;
}

// triage list [--all]: the open entries, each whole; --all adds the closed ones.
export function triageList(root, cfg, { all = false, log = console.log } = {}) {
  const where = registerHere(root, cfg);
  const reg = readHere(root, where);
  log(`${where.repo} triage register, ${where.dir}/${REGISTER}: ${reg.open.length} open`);
  for (const e of reg.open) log(JSON.stringify(e, null, 2));
  if (all) for (const e of closedRows(root, where)) log(JSON.stringify(e));
  capLine(root, cfg, where, log);
  return reg.open;
}

// ===== file: triggers.mjs =====

// Review triggers (coordinator's log, 4 Nov 19:05, recorded as Bob's decision, not quoted: two
// triggers, security-list changes and deleted or loosened tests, review before merge, measured
// for a day or two; the coordinator removed the security-path trigger's paths on 5 Nov, copy
// PR 560, so only the test trigger fires there). An audit of 10
// job pull requests on the copy found three judgement errors no test catches: PR 253 loosened a
// requirement-pinning test to pass its own wrong change, PR 174 deleted panel.test.mjs while
// panel.mjs stayed live, PR 95 dropped acts from REAUTH_ACTS. Each trigger is computed from the
// job's diff against its merge base alone; a job pull request that fires one merges only
// --reviewed (merge.mjs), and every merge row records what fired and what the review found.
//
// security: a change to a path the product lists in review_triggers.security_paths (its config,
//   read at the tranche; globs: ** any depth, * within one name, ? one character; a path without
//   them names a file or a directory). The product names its own files; none by default.
// test (sharpened by the coordinator, 4 Nov 19:16, from the first 6 hand reviews): a test file of the
//   module (under its entry's tests, with its suite's suffix) deleted; or, in one that existed at
//   the base, a skip added (SKIP: test|it|describe.skip|todo|only( added), or a hunk that removes an
//   assertion line (ASSERT) and adds none. A hunk that replaces assertions with others does not fire.
//   ASSERT, the fixed forms: assert(...), assert.<x>(...), expect(...), and t.<x>(...) for the
//   node:test and tap methods listed.
import { git, underPath } from './util.mjs';

export const ASSERT = /\b(?:assert|expect)(?:\.\w+)*\s*\(|\bt\.(?:assert|equal|notEqual|strictEqual|deepEqual|deepStrictEqual|same|notSame|ok|notOk|true|false|match|throws|doesNotThrow|rejects|is|not|truthy|falsy)\s*\(/;
export const SKIP = /\b(?:test|it|describe)\.(?:skip|todo|only)\s*\(/;
export const ASSERT_RULE = 'assertion lines are those matching assert(, assert.<x>(, expect(, or t.<assert|equal|notEqual|strictEqual|deepEqual|deepStrictEqual|same|notSame|ok|notOk|true|false|match|throws|doesNotThrow|rejects|is|not|truthy|falsy>(, comments aside; a test file existing at the base fires on a hunk that removes an assertion line and adds none, or on an added test.skip, test.todo, .only or it.skip';
// The hunks a review brief carries, at most this many lines; past it the brief names the command.
export const HUNK_LINES = 400;

export function globRe(g) {
  const s = String(g).replace(/^\.\//, '');
  if (!/[*?]/.test(s)) return null;
  let re = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '*' && s[i + 1] === '*') { i++; if (s[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*'; }
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
export const matchPath = (f, g) => { const re = globRe(g); return re ? re.test(f) : underPath(f, String(g).replace(/^\.\//, '')); };

// The product's security paths, from a config (loadConfig); a malformed value lists none and says so.
export function securityPaths(cfg) {
  const v = cfg?.review_triggers?.security_paths;
  if (v === undefined || v === null) return { paths: [], set: false };
  if (!Array.isArray(v) || v.some((p) => typeof p !== 'string' || !p)) return { paths: [], set: false, bad: 'review_triggers.security_paths is not a list of paths' };
  return { paths: v, set: true };
}

const isTest = (entry, f) => (entry?.tests || []).some((t) => underPath(f, String(t).replace(/^\.\//, ''))) && f.endsWith(entry?.suite?.test_suffix || '.test.mjs');
const isComment = (l) => /^\s*(?:\/\/|\/?\*)/.test(l);

// One file's -U0 diff, per hunk: removed and added assertion lines, and skips added.
// Returns { removed, added, skips, bare: hunks that remove an assertion and add none }.
export function assertCounts(diff) {
  const c = { removed: 0, added: 0, skips: 0, bare: 0 };
  let h = null;
  const end = () => { if (h && h.removed && !h.added) c.bare++; };
  for (const l of String(diff).split('\n')) {
    if (l.startsWith('---') || l.startsWith('+++')) continue;
    if (l.startsWith('@@')) { end(); h = { removed: 0, added: 0 }; continue; }
    if (l[0] !== '-' && l[0] !== '+') continue;
    const body = l.slice(1);
    if (isComment(body)) continue;
    if (l[0] === '+' && SKIP.test(body)) c.skips++;
    if (!ASSERT.test(body)) continue;
    h ||= { removed: 0, added: 0 };
    if (l[0] === '-') { c.removed++; h.removed++; } else { c.added++; h.added++; }
  }
  end();
  return c;
}

// The triggers a job's change fires: { fired: ['security'?, 'test'?], security: [files],
// deleted: [test files], loosened: [{ file, removed, added }], why, hunks (the diff text that
// fired them, for the review brief) }. base and head are revisions in root.
export function reviewTriggers(root, { base, head, entry, cfg }) {
  const sec = securityPaths(cfg);
  // -z, as every diff in the tool: git quotes a path with non-ASCII bytes otherwise (review of PR 125).
  const z = git(['diff', '--no-renames', '--name-status', '-z', base, head], { cwd: root }).split('\0');
  const status = [];
  for (let i = 0; i + 1 < z.length; i += 2) if (z[i]) status.push({ s: z[i][0], f: z[i + 1] });
  const security = status.filter((x) => sec.paths.some((g) => matchPath(x.f, g))).map((x) => x.f);
  const deleted = status.filter((x) => x.s === 'D' && isTest(entry, x.f)).map((x) => x.f);
  const loosened = [];
  const diffs = {};
  for (const x of status.filter((y) => y.s === 'M' && isTest(entry, y.f))) {
    const d = git(['diff', '--no-renames', '-U0', base, head, '--', x.f], { cwd: root });
    const c = assertCounts(d);
    if (c.bare || c.skips) { loosened.push({ file: x.f, ...c }); diffs[x.f] = d; }
  }
  const fired = [...(security.length ? ['security'] : []), ...(deleted.length || loosened.length ? ['test'] : [])];
  const why = [
    ...(security.length ? [`security paths changed: ${security.slice(0, 5).join(', ')}${security.length > 5 ? ` and ${security.length - 5} more` : ''}`] : []),
    ...(deleted.length ? [`test files deleted: ${deleted.slice(0, 5).join(', ')}`] : []),
    ...loosened.slice(0, 5).map((l) => `${l.file}: ${[l.bare ? `${l.bare} hunk${l.bare > 1 ? 's' : ''} removing assertions and adding none` : '', l.skips ? `${l.skips} skip${l.skips > 1 ? 's' : ''} added` : ''].filter(Boolean).join(', ')}`),
  ].join('; ');
  const parts = [];
  if (security.length) parts.push(git(['diff', '--no-renames', '-U3', base, head, '--', ...security], { cwd: root }));
  if (deleted.length) parts.push(git(['diff', '--no-renames', '-U0', base, head, '--', ...deleted], { cwd: root }));
  for (const l of loosened) parts.push(diffs[l.file]);
  const all = parts.join('\n').split('\n');
  const hunks = all.length > HUNK_LINES ? [...all.slice(0, HUNK_LINES), `... ${all.length - HUNK_LINES} more lines: git diff ${String(base).slice(0, 10)} ${head} -- ${[...security, ...deleted, ...loosened.map((l) => l.file)].join(' ')}`].join('\n') : all.join('\n');
  return { fired, security, deleted, loosened, why, hunks, ...(sec.bad ? { bad: sec.bad } : {}), security_set: sec.set };
}

const num = (x) => typeof x === 'number' && Number.isFinite(x);
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r2 = (x) => Math.round(x * 100) / 100;

// The one report line (metrics report, report tranche), from merge rows, each pull request once.
// rejudged: the triggers rows a land wrote beside a merge row prepared under an older pin, or one
// whose triggers changed by the land (merge.mjs); the latest for a pull request is read over its row.
export function triggerSummary(merges, rejudged = []) {
  const later = new Map([...rejudged].filter((r) => r?.row === 'triggers' && Array.isArray(r.triggers)).sort((a, b) => String(a.at).localeCompare(String(b.at))).map((r) => [String(r.pr), r]));
  const rows = [...new Map(merges.map((r) => [String(r.pr), r])).values()].map((r) => (later.has(String(r.pr)) ? { ...r, triggers: later.get(String(r.pr)).triggers } : r));
  const rec = rows.filter((r) => Array.isArray(r.triggers));
  const kind = (k) => rec.filter((r) => r.triggers.includes(k)).length;
  const fired = rec.filter((r) => r.triggers.length).length;
  const reviews = rec.filter((r) => r.reviewed === true);
  const counted = reviews.filter((r) => num(r.findings));
  const findings = counted.reduce((t, r) => t + r.findings, 0);
  const acted = counted.reduce((t, r) => t + (num(r.findings_acted) ? r.findings_acted : 0), 0);
  const mins = reviews.map((r) => r.review_minutes).filter(num);
  const costs = reviews.map((r) => r.review_usd).filter(num);
  const s = {
    merged: rows.length,
    recorded: rec.length,
    triggered: fired,
    security: kind('security'),
    test: kind('test'),
    share: rec.length ? r2(fired / rec.length) : null,
    reviews: reviews.length,
    findings_per_review: counted.length ? r2(findings / counted.length) : null,
    findings_acted: acted,
    added_minutes_median: mins.length ? median(mins) : null,
    added_minutes_worst: mins.length ? Math.max(...mins) : null,
    review_usd: costs.length ? r2(costs.reduce((t, x) => t + x, 0)) : null,
    review_usd_unmeasured: reviews.length - costs.length,
  };
  const U = 'unmeasured';
  s.line = `review triggers: ${s.merged} job PRs merged${rec.length < rows.length ? ` (${rows.length - rec.length} before triggers were recorded)` : ''}; triggered ${fired} of ${rec.length}${s.share === null ? '' : ` (${Math.round(s.share * 100)}%)`}: security ${s.security}, test ${s.test}; reviews run ${s.reviews}; findings per review ${s.findings_per_review ?? U}; findings acted on ${acted}; added minutes to merge median ${s.added_minutes_median ?? U}, worst ${s.added_minutes_worst ?? U}; review cost ${s.review_usd === null ? U : `$${s.review_usd.toFixed(2)}`}${s.review_usd_unmeasured && costs.length ? ` (${s.review_usd_unmeasured} unmeasured)` : ''}`;
  return s;
}

// ===== file: merge.test.mjs (later part) =====

test('the tranche must require checks by the base\'s config, not the working tree\'s', () => {
  // The working-tree config names another branch as the tranche; the base's says it is "tranche".
  const r = plainRepo();
  write(r.root, { 'process/config.json': JSON.stringify({ tranche: 'bob/plan' }) });
  const f = plainIO(r, { rules: { checks: [] } });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /tranche requires no checks/);
  assert.equal(f.calls.merged, null);
  // An unreadable base config grants no exception either: checks are required.
  const u = plainRepo({ files: { 'pin.txt': 'moved' } });
  git(['checkout', '-q', 'tranche'], { cwd: u.root });
  commit(u.root, { 'process/config.json': '{ not json' }, 'broken');
  git(['push', '-q', 'origin', 'tranche'], { cwd: u.root });
  git(['checkout', '-q', 'main'], { cwd: u.root });
  assert.throws(() => mergePlain(u.root, 4, { ...q, noReview: 'x', io: plainIO(u, { rules: { checks: [] } }).io }), /tranche requires no checks/);
});

test('an unreadable base config grants no module-file exemption', () => {
  // The base's config is not JSON; the head (named as the working tree's tranche) changes module files.
  const r = plainRepo({ head: 'bob/plan', files: { 'src/alpha/index.mjs': 'export const x = 1;\n' } });
  git(['checkout', '-q', 'tranche'], { cwd: r.root });
  commit(r.root, { 'process/config.json': '{ not json' }, 'broken');
  git(['push', '-q', 'origin', 'tranche'], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  write(r.root, { 'process/config.json': JSON.stringify({ tranche: 'bob/plan' }) });
  const f = plainIO(r);
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /changes module files, which go through a job: src\/alpha\/index.mjs \(alpha\)/);
  assert.equal(f.calls.merged, null);
});

test('only the tranche by main\'s config merges into main, whatever the working tree says', () => {
  const r = plainRepo({ head: 'bob/w' });
  write(r.root, { 'process/config.json': JSON.stringify({ tranche: 'bob/w' }) });
  const f = plainIO(r, { base: 'main' });
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), /only the tranche tranche merges into main, not bob\/w/);
  assert.equal(f.calls.merged, null);
  // Main's config cannot be read: nothing merges into main.
  const u = plainRepo({ head: 'tranche' });
  git(['checkout', '-q', 'main'], { cwd: u.root });
  commit(u.root, { 'process/config.json': '{ not json' }, 'broken');
  git(['push', '-q', 'origin', 'main'], { cwd: u.root });
  git(['checkout', '-q', 'tranche'], { cwd: u.root }); // the local checkout's own config is readable
  assert.throws(() => mergePlain(u.root, 4, { ...q, noReview: 'x', io: plainIO(u, { base: 'main' }).io }), /process\/config\.json on main cannot be read/);
});

// Review follow-ups, 2 Nov: the config's "tranche" field takes process_repo's owner's-word rule.
import { pinChange } from '../lib/merge.mjs';
import { recordCheck } from '../lib/record.mjs';
import { DEFAULTS as D, loadConfig } from '../lib/util.mjs';

test('a pull request into the tranche may not rename the tranche; naming its default is no change', () => {
  const msg = /changes tranche in process\/config\.json; that needs the owner's word: bring it to Bob/;
  const into = (base, head) => { const r = makeRepoWith(base, head); const f = plainIO(r); f.io.lookup = everyOwner; return { f, run: () => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }) }; };
  for (const [from, to] of [[{}, { tranche: 'bob/plan' }], [{ tranche: 'tranche' }, { tranche: 'other' }]]) {
    const t = into(JSON.stringify(from), JSON.stringify(to));
    assert.throws(t.run, msg, JSON.stringify(to));
    assert.equal(t.f.calls.merged, null);
  }
  // The default named outright, or dropped again: the tranche is still "tranche".
  assert.equal(into('{}', JSON.stringify({ tranche: 'tranche' })).run().merged, true);
  assert.equal(into(JSON.stringify({ tranche: 'tranche' }), '{}').run().merged, true);
  // An unreadable head config grants nothing.
  assert.throws(into('{}', '{ "tranche": ').run, /changes (process_repo|tranche) in process\/config\.json/);
});

test('the tranche into main may carry a tranche name the owner\'s website commit set', () => {
  const msg = /changes tranche in process\/config\.json; that needs the owner's word: bring it to Bob/;
  // Main has a config naming the default tranche; the tranche's config renames it.
  const renamed = () => {
    const r = trancheToMain({ how: 'direct', mainConfig: JSON.stringify({ process_repo: P3 }) });
    git(['checkout', '-q', 'tranche'], { cwd: r.root });
    r.setAt = commit(r.root, { 'process/config.json': JSON.stringify({ process_repo: P3, tranche: 'tranche-2' }) }, 'rename');
    r.sha = r.setAt;
    git(['push', '-q', 'origin', 'tranche'], { cwd: r.root });
    git(['checkout', '-q', 'main'], { cwd: r.root });
    return r;
  };
  const a = renamed();
  assert.equal(mergePlain(a.root, 4, { ...q, noReview: 'x', io: intoMain(a, ghCommit(a.setAt)).io }).merged, true);
  const b = renamed();
  const f = intoMain(b, ghCommit('none'));
  assert.throws(() => mergePlain(b.root, 4, { ...q, noReview: 'x', io: f.io }), msg);
  assert.equal(f.calls.merged, null);
});

// Review of PR 96 (security gap, predating it): a normal close anchors the approvals as it
// anchors process_repo and the tranche, so a tranche cannot name the owner the next close trusts.
// The owner who judges is main's; the record check still refuses the same change on its own.
test('the tranche into main carrying a changed approvals.owner needs main\'s owner\'s website commit', () => {
  const msg = /changes approvals in process\/config\.json; that needs the owner's word: bring it to Bob/;
  const r = trancheToMain({ how: 'direct', mainConfig: JSON.stringify({ process_repo: P3 }) });
  const mainTip = git(['rev-parse', 'main'], { cwd: r.root });
  git(['checkout', '-q', 'tranche'], { cwd: r.root });
  const change = commit(r.root, { 'process/config.json': JSON.stringify({ process_repo: P3, approvals: { owner: 'acmewidget' } }) }, 'a session names another owner');
  git(['push', '-q', 'origin', 'tranche'], { cwd: r.root });
  git(['checkout', '-q', 'main'], { cwd: r.root });
  const mb = git(['merge-base', mainTip, change], { cwd: r.root });
  assert.throws(() => pinChange(r.root, mb, change, released, { intoMain: true, ownerCommit: () => ({ ok: false }) }), msg);
  r.sha = change;
  const f = intoMain(r, ghCommit('none'));
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: f.io }), msg);
  assert.equal(f.calls.merged, null);
  // The head's own named owner's website commit grants nothing: main's owner judges.
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', io: intoMain(r, ghCommit(change, { author: 'acmewidget' })).io }), msg);
  // The approvals file or heading, the same.
  for (const approvals of [{ file: 'AGENTS.md' }, { heading: '## Anything goes' }]) {
    const t = trancheToMain({ how: 'direct', mainConfig: JSON.stringify({ process_repo: P3 }) });
    git(['checkout', '-q', 'tranche'], { cwd: t.root });
    t.sha = commit(t.root, { 'process/config.json': JSON.stringify({ process_repo: P3, approvals }) }, 'a session moves the approvals');
    git(['push', '-q', 'origin', 'tranche'], { cwd: t.root });
    git(['checkout', '-q', 'main'], { cwd: t.root });
    assert.throws(() => mergePlain(t.root, 4, { ...q, noReview: 'x', io: intoMain(t, ghCommit('none')).io }), msg, JSON.stringify(approvals));
    assert.equal(mergePlain(t.root, 4, { ...q, noReview: 'x', io: intoMain(t, ghCommit(t.sha)).io }).merged, true, JSON.stringify(approvals));
  }
  // Main's owner's own website commit on the tranche: accepted, and nothing else changes.
  const asked = [];
  const ok = intoMain(r, ghCommit(change), asked);
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'x', io: ok.io }).merged, true);
  assert.deepEqual(asked, [change]);
  // Into the tranche from a working branch there is no owner exception for the approvals either.
  const w = makeRepoWith(JSON.stringify({ tranche: 'tranche' }), JSON.stringify({ tranche: 'tranche', approvals: { owner: 'acmewidget' } }));
  const into = plainIO(w);
  into.io.lookup = everyOwner;
  assert.throws(() => mergePlain(w.root, 4, { ...q, noReview: 'x', io: into.io }), msg);
  // The record check refuses the session's change as before.
  const cfgMain = loadConfig(r.root, mainTip);
  assert.equal(cfgMain.approvals.owner, D.approvals.owner);
  const rf = recordCheck(r.root, { ...cfgMain, max_file_bytes: 1e6 }, { base: mainTip, head: change, lookup: ghCommit('none') }).findings;
  assert.deepEqual(rf.map((x) => [x.check, x.file]), [['approvals', 'process/config.json']]);
  assert.deepEqual(recordCheck(r.root, { ...cfgMain, max_file_bytes: 1e6 }, { base: mainTip, head: change, lookup: ghCommit(change) }).findings, []);
});

// Review 1 of PR 97: an owner's website commit already in main, whose value main later replaced,
// grants nothing: a session cannot bring back a value the owner revoked.
test('the tranche into main cannot restore an approvals.owner the owner later replaced on main', () => {
  const msg = /changes approvals in process\/config\.json; that needs the owner's word/;
  const root = makeRepo({ 'README.md': 'x', 'process/config.json': JSON.stringify({ process_repo: P3 }) });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  const W = commit(root, { 'process/config.json': JSON.stringify({ process_repo: P3, approvals: { owner: 'alice' } }) }, 'Bob names alice');
  git(['branch', 'tranche'], { cwd: root });
  commit(root, { 'process/config.json': JSON.stringify({ process_repo: P3 }) }, 'Bob takes it back');
  git(['checkout', '-q', 'tranche'], { cwd: root });
  // A session brings main in and resolves the config back to alice.
  git(['merge', '-q', '-s', 'ours', '-m', 'Bring tranche up to main', 'main'], { cwd: root });
  write(root, { 'pin.txt': 'x' });
  git(['add', '-A'], { cwd: root });
  git(['update-index', '--add', '--cacheinfo', `160000,${PIN},.process`], { cwd: root });
  git(['commit', '-q', '-m', 'the tranche moves on'], { cwd: root });
  const sha = git(['rev-parse', 'HEAD'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const r = { root, sha, head: 'tranche' };
  const f = intoMain(r, everyOwner);
  assert.throws(() => mergePlain(root, 4, { ...q, noReview: 'x', io: f.io }), msg);
  assert.equal(f.calls.merged, null);
  // Before the fix: alice took her value at W, the owner's website commit, so it passed.
  assert.equal(keySetAt(root, sha, 'approvals'), W);
});

// Build I (3 Nov): the review-round limit, held by merge.
import { MAX_ROUNDS, reviewRounds } from '../lib/merge.mjs';

test('review rounds: stated and recorded; a third round needs a recorded decision', () => {
  assert.equal(MAX_ROUNDS, 2);
  assert.deepEqual(reviewRounds({ reviewed: 'x', rounds: '1' }), { rounds: 1, decision: null });
  assert.deepEqual(reviewRounds({ reviewed: 'x', rounds: 2 }), { rounds: 2, decision: null });
  assert.deepEqual(reviewRounds({ noReview: 'a pin move' }), { rounds: 0, decision: null });
  assert.throws(() => reviewRounds({ reviewed: 'x' }), /say how many review rounds ran: --rounds <n>/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: true }), /--rounds <n>/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: '0' }), /1 or more/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: '1.5' }), /whole number/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: 3 }), /3 review rounds: the limit is 2 .*--decision/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: 3, decision: true }), /--decision needs the recorded decision/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: 3, decision: '  ' }), /--decision needs the recorded decision/);
  assert.deepEqual(reviewRounds({ reviewed: 'x', rounds: 3, decision: "Bob's word, 3 Nov" }), { rounds: 3, decision: "Bob's word, 3 Nov" });
  assert.throws(() => reviewRounds({ noReview: 'x', rounds: 2 }), /--no-review has no review rounds/);
  assert.throws(() => reviewRounds({ reviewed: true, rounds: 1 }), /--reviewed needs what the reviews found/);
  assert.throws(() => reviewRounds({ rounds: 1 }), /--reviewed/);
  // Review fixes: both flags, or a repeated flag, are refused.
  assert.throws(() => reviewRounds({ reviewed: 'x', noReview: 'y' }), /say one: --reviewed .* or --no-review .*, not both/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: 3, decision: ['a', 'b'] }), /once each/);
  assert.throws(() => reviewRounds({ reviewed: 'x', rounds: ['1', '2'] }), /once each/);
});

test('merge and merge --plain refuse a third round without a decision, and record it with one', () => {
  const { root, head } = setup();
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'x', rounds: 3, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {} }), /limit is 2/);
  const f = io(head);
  assert.equal(merge(root, 3, { slug: 'o/r', io: f.io, reviewed: 'x', rounds: 3, reviewMinutes: 5, findings: 0, actedOn: 0, decision: "Bob's word", log: () => {} }).merged, true);
  const tip = git(['ls-remote', 'origin', 'refs/heads/job/alpha'], { cwd: root }).split('\t')[0];
  git(['checkout', '-q', tip], { cwd: root });
  const row = readRows(root, 'alpha').at(-1);
  assert.equal(row.review_rounds, 3);
  assert.equal(row.decision, "Bob's word");
  git(['checkout', '-q', 'main'], { cwd: root });
  const r = plainRepo();
  assert.throws(() => mergePlain(r.root, 4, { ...q, io: plainIO(r).io, reviewed: 'x', rounds: 4 }), /limit is 2/);
  const g = plainIO(r);
  assert.equal(mergePlain(r.root, 4, { ...q, io: g.io, reviewed: 'x', rounds: 3, decision: "Bob's word" }).merged, true);
  assert.equal(g.calls.merged.message, "Reviewed: x\nReview rounds: 3\nDecision: Bob's word");
});

// The route for work found elsewhere (coordinator, 4 Nov): BOB's plain pull request adding the
// walk's found marks was refused, "changes module files, which go through a job", since a job owns
// its requirement file (PR 46). A diff to it that only adds new unmet found-mark lines merges plain.
function foundRepo(after) {
  const BASE = '# Alpha\n\n- **R1** *(not yet met: x)* one\n- **R2** met\n- **F1** *(not yet met: walk p3dev-l1)* old finding\n';
  const root = makeRepo({
    'README.md': 'x', '.github/workflows/process-gate.yml': 'on: pull_request\n', 'process/config.json': {},
    'process/ledger/alpha.json': entry('alpha', { paths: ['src/alpha/', 'req/alpha.md'] }), 'req/alpha.md': BASE,
  });
  git(['branch', 'tranche'], { cwd: root });
  const bare = join(mkdtempSync(join(tmpdir(), 'p3-origin-')), 'o.git');
  git(['init', '-q', '--bare', bare], { cwd: root });
  git(['remote', 'add', 'origin', bare], { cwd: root });
  git(['checkout', '-q', '-b', 'found/alpha-f2', 'tranche'], { cwd: root });
  const sha = commit(root, { 'req/alpha.md': after(BASE) });
  git(['checkout', '-q', 'main'], { cwd: root });
  git(['push', '-q', 'origin', 'main', 'tranche', 'found/alpha-f2'], { cwd: root });
  return { root, sha, head: 'found/alpha-f2' };
}

test('merge --plain: a requirement file a job owns takes only added new unmet found marks; any other edit goes through a job', () => {
  const F2 = '- **F2** *(not yet met: walk p3dev-l1)* founder sign-in answers HTTP 200 without a session\n';
  const F3 = '- **F3** *(not yet met: deploy p3dev-l1)* ROLLOUT NOT CONFIRMED on agent-runner\n';
  // Only added F lines: merges plain.
  for (const add of [F2, F2 + F3]) {
    const ok = foundRepo((b) => b + add);
    const f = plainIO(ok);
    assert.equal(mergePlain(ok.root, 7, { ...q, noReview: 'work found elsewhere: found marks only', io: f.io }).merged, true);
    assert.equal(f.calls.merged.sha, ok.sha);
  }
  const refused = (after, why) => {
    const r = foundRepo(after);
    const f = plainIO(r);
    assert.throws(() => mergePlain(r.root, 7, { ...q, noReview: 'x', io: f.io }), new RegExp(`changes module files, which go through a job: req/alpha\\.md \\(alpha\\); a plain pull request may only add new unmet found marks to a requirement file \\(req/alpha\\.md: ${why}`));
    assert.equal(f.calls.merged, null);
  };
  // An added F line plus any other edit: refused.
  refused((b) => b.replace('one', 'one, reworded') + F2, 'it removes or changes a line');
  refused((b) => b + '\n## Found work\n' + F2, 'it adds a line that is not one unmet found mark');
  refused((b) => b + '## Found work\n' + F2, 'it adds a line that is not one unmet found mark: ## Found work');
  // An added R mark: refused.
  refused((b) => b + '- **R3** *(not yet met: walk p3dev-l1)* new\n', 'it adds a line that is not one unmet found mark: - \\*\\*R3\\*\\*');
  // A removed line: refused, and striking a found mark is a job's.
  refused((b) => b.replace('- **R2** met\n', ''), 'it removes or changes a line');
  refused((b) => b.replace('*(not yet met: walk p3dev-l1)* old', 'old'), 'it removes or changes a line');
  // An F line that is met, reuses a number, or hides another mark: refused.
  refused((b) => b + '- **F2** met already\n', 'it adds a line that is not one unmet found mark');
  refused((b) => b + '- **F1** *(not yet met: walk p3dev-l1)* again\n', 'it adds F1, which the file already has');
  refused((b) => b + '- **F2** *(not yet met: x)* see **R1**\n', 'it adds a line that is not one unmet found mark');
  // A content line that looks like a diff header ("-- x" removed, "++ x" added) is a change too.
  refused((b) => b.replace('- **R2** met', '-- R2 met') + F2, 'it removes or changes a line');
  refused((b) => b + '++ sneaky line\n' + F2, 'it adds a line that is not one unmet found mark: \\+\\+ sneaky');
  // The header of a diff with no hunk is no change of lines: refused.
  assert.equal(foundOnly('diff --git a/x b/x\nold mode 100644\nnew mode 100755\n', '').ok, false);
  // Module code beside the found marks still goes through a job.
  const both = foundRepo((b) => b + F2);
  git(['checkout', '-q', 'found/alpha-f2'], { cwd: both.root });
  const sha = commit(both.root, { 'src/alpha/index.mjs': 'export const x = 1;\n' });
  git(['push', '-q', 'origin', 'found/alpha-f2'], { cwd: both.root });
  git(['checkout', '-q', 'main'], { cwd: both.root });
  assert.throws(() => mergePlain(both.root, 7, { ...q, noReview: 'x', io: plainIO({ ...both, sha }).io }), /changes module files, which go through a job: src\/alpha\/index\.mjs \(alpha\)/);
});

// Copy PR 108 (4 Nov): it conflicted on the .process gitlink, GitHub started no gate run on it,
// and merge --plain waited 10+ minutes on "gate: not started". A pull request that cannot merge
// is refused at once; one whose mergeable state is not yet computed is read again briefly.
test('merge --plain refuses a conflicted pull request at once, before waiting on any check', () => {
  const r = plainRepo();
  for (const state of [{ mergeable: false, mergeable_state: 'dirty' }, { mergeable: false }, { mergeable: null, mergeable_state: 'dirty' }]) {
    const checked = [];
    const f = plainIO(r, { after: undefined, runs: () => { checked.push(1); return []; } });
    const get = f.io.getPR;
    f.io.getPR = (...a) => ({ ...get(...a), ...state });
    assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', every: 0, io: f.io }), (e) => e.message === 'pull request 4 conflicts with tranche; nothing was merged');
    assert.equal(checked.length, 0, 'no required check was waited on');
    assert.equal(f.calls.merged, null);
  }
});

test('merge --plain reads a not-yet-computed mergeable state again briefly, then goes on or refuses', () => {
  const r = plainRepo();
  const seq = (states) => {
    const f = plainIO(r);
    const get = f.io.getPR;
    let i = 0;
    f.io.getPR = (...a) => ({ ...get(...a), mergeable: states[Math.min(i++, states.length - 1)] });
    return f;
  };
  const logs = [];
  const ok = seq([null, null, true]);
  assert.equal(mergePlain(r.root, 4, { ...q, noReview: 'x', mergeableEvery: 0, log: (m) => logs.push(m), io: ok.io }).merged, true);
  assert.equal(logs.filter((l) => l === 'waiting for GitHub to compute whether pull request 4 can merge').length, 2);
  const late = seq([null, false]);
  assert.throws(() => mergePlain(r.root, 4, { ...q, noReview: 'x', mergeableEvery: 0, io: late.io }), /pull request 4 conflicts with tranche; nothing was merged/);
  assert.equal(late.calls.merged, null);
});

test('waitMergeable refuses when GitHub never computes the state within its minutes', async () => {
  const { waitMergeable } = await import('../lib/merge.mjs');
  const pr = { base: { ref: 'tranche' }, mergeable: null };
  assert.throws(() => waitMergeable('o/r', 4, pr, { minutes: 0, every: 0, read: () => pr, log: () => {} }), /GitHub has not said whether pull request 4 can merge after 0 min; nothing was merged/);
  assert.equal(waitMergeable('o/r', 4, { ...pr, mergeable: true }, { read: () => assert.fail('no read') }).mergeable, true);
});

test('merge (a job\'s) refuses a conflicted pull request at once, before reading its gate', () => {
  const { root, head } = setup();
  const f = io(head);
  const get = f.io.getPR;
  f.io.getPR = (...a) => ({ ...get(...a), mergeable: false, mergeable_state: 'dirty' });
  let gateRead = 0;
  f.io.checkRun = () => { gateRead++; return { status: 'completed', conclusion: 'success' }; };
  assert.throws(() => merge(root, 3, { slug: 'o/r', io: f.io, reviewed: 'r', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: () => {} }), (e) => e.message === 'pull request 3 conflicts with tranche; nothing was merged');
  assert.equal(gateRead, 0);
  assert.equal(f.calls.merged, null);
});

// The job's cost at its merge (measured 4 Nov, 11:49: a job reading its own get_session mid-turn
// has no usage; BOB reads it from the job's idle session at the merge).
test('merge --job-cost-usd writes the job\'s measured row, its session from the complete row, less that session\'s last priced row', () => {
  const { root } = setup();
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const rows = [
    { row: 'attempt', event: 'measured', role: 'job', attempt: 0, session: 'session_J', session_usd: 1, cost_usd: 1, at: new Date().toISOString() },
    { row: 'attempt', event: 'complete', attempt: 1, session: 'session_J', at: new Date().toISOString() },
  ];
  const head = commit(root, { 'process/metrics/alpha.jsonl': rows.map((r) => JSON.stringify(r)).join('\n') + '\n' });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const said = [];
  const r = merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, jobCostUsd: '3.5', log: (m) => said.push(m) });
  assert.equal(r.merged, true);
  git(['checkout', '-q', r.tip], { cwd: root });
  const got = readRows(root, 'alpha');
  assert.equal(got.at(-1).row, 'merge', 'the merge row stays last');
  const m = got.filter((x) => x.event === 'measured').pop();
  assert.deepEqual([m.role, m.attempt, m.session, m.session_usd, m.cost_usd], ['job', 1, 'session_J', 3.5, 2.5]);
  assert.ok(said.some((l) => /job alpha's cost: 2\.5 USD/.test(l)));
  git(['checkout', '-q', 'main'], { cwd: root });
});

test('merge without --job-cost-usd still merges, records the cost unmeasured and prints the get_session call for the job\'s session', () => {
  const { root } = setup();
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'process/metrics/alpha.jsonl': JSON.stringify({ row: 'attempt', event: 'complete', attempt: 1, session: 'session_J', at: new Date().toISOString() }) + '\n' });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  const said = [];
  const r = merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, log: (m) => said.push(m) });
  assert.equal(r.merged, true, 'never blocked on cost');
  assert.ok(said.some((l) => l.includes('job alpha\'s cost: unmeasured. Read it with get_session {"session_id": "session_J"}, the field external_metadata.usage.cost_usd')), said.join('\n'));
  git(['checkout', '-q', r.tip], { cwd: root });
  const m = readRows(root, 'alpha').filter((x) => x.event === 'measured');
  assert.deepEqual(m.map((x) => [x.session, x.cost_usd]), [['session_J', 'unmeasured']]);
  git(['checkout', '-q', 'main'], { cwd: root });
});

test('merge refuses a zero or unreadable --job-cost-usd before anything runs', () => {
  const { root, head } = setup();
  const f = io(head);
  for (const v of ['0', 'lots', true]) assert.throws(() => merge(root, 3, { slug: 'o/r', io: f.io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, jobCostUsd: v, log: () => {} }), /--job-cost-usd <the job's session cost: get_session/);
  assert.equal(f.calls.merged, null);
});

// The copy, 4 Nov: queue's attempt 2 ran in attempt 1's session and get_session's usage had not
// moved, so its row read 0; its merge then counted 4.04 whole (no session on the complete rows).
function costRows(root, rows) {
  git(['checkout', '-q', 'job/alpha'], { cwd: root });
  const head = commit(root, { 'process/metrics/alpha.jsonl': rows.map((r) => JSON.stringify({ at: new Date().toISOString(), ...r })).join('\n') + '\n' });
  git(['push', '-q', 'origin', 'job/alpha'], { cwd: root });
  git(['checkout', '-q', 'main'], { cwd: root });
  return head;
}
test('merge --job-cost-usd no higher than the session\'s last row records the delta unmeasured, never 0', () => {
  const { root } = setup();
  const head = costRows(root, [
    { row: 'attempt', event: 'measured', role: 'job', attempt: 0, session: 'session_J', session_usd: 3.25, cost_usd: 3.25 },
    { row: 'attempt', event: 'complete', attempt: 1, session: 'session_J' },
  ]);
  const said = [];
  const r = merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, jobCostUsd: '3.25', log: (m) => said.push(m) });
  assert.equal(r.merged, true);
  git(['checkout', '-q', r.tip], { cwd: root });
  const m = readRows(root, 'alpha').filter((x) => x.event === 'measured').pop();
  assert.deepEqual([m.session, m.session_usd, m.cost_usd], ['session_J', 3.25, 'unmeasured']);
  assert.ok(said.some((l) => /job alpha's cost: unmeasured: --job-cost-usd 3\.25 is not above session session_J's last row \(3\.25\)/.test(l)), said.join('\n'));
  git(['checkout', '-q', 'main'], { cwd: root });
});
test('merge --job-cost-usd with no session on the complete row takes the session of this attempt\'s last measured row, never an earlier attempt\'s', () => {
  const { root } = setup();
  const head = costRows(root, [
    { row: 'attempt', event: 'measured', role: 'job', attempt: 0, session: 'session_J', session_usd: 3.25, cost_usd: 3.25 },
    { row: 'attempt', event: 'measured', role: 'job', attempt: 1, session: 'session_J', session_usd: 3.25, cost_usd: 'unmeasured' },
    { row: 'attempt', event: 'complete', attempt: 1 },
  ]);
  const r = merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, jobCostUsd: '4.04', log: () => {} });
  git(['checkout', '-q', r.tip], { cwd: root });
  const m = readRows(root, 'alpha').filter((x) => x.event === 'measured').pop();
  assert.deepEqual([m.session, m.session_usd, m.cost_usd], ['session_J', 4.04, 0.79]);
  git(['checkout', '-q', 'main'], { cwd: root });
});
test('merge --job-cost-usd takes no session from an earlier attempt: a restart in a new session counts its figure whole', () => {
  const { root } = setup();
  const head = costRows(root, [
    { row: 'attempt', event: 'measured', role: 'job', attempt: 0, session: 'session_J', session_usd: 3.25, cost_usd: 3.25 },
    { row: 'attempt', event: 'complete', attempt: 1 },
  ]);
  const r = merge(root, 3, { slug: 'o/r', io: io(head).io, reviewed: 'fresh', rounds: 1, reviewMinutes: 5, findings: 0, actedOn: 0, jobCostUsd: '2', log: () => {} });
  git(['checkout', '-q', r.tip], { cwd: root });
