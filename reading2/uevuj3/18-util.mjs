  merge_strategy: 'layer',
  // status --role bob: where the requirement files that give BOB its next work live, and the
  // layer map that says which of them are open (its lowest layer not yet closed).
  requirements_dir: 'build/requirements',
  layers_file: 'build/layers.md',
  // status --role bob: how next work opens past the open layer. "uses": also every module whose
  // providers (its `uses` in modules_file) are all done; "layer": the open layer's modules only.
  open_by: 'uses',
  // The requirements cap (Build Plan, Phase 3; REQ-6, P6): a module's requirement file over this
  // many bytes is BOB's to split or consolidate before its job opens, a trigger, never a refusal.
  // Provisional, from layers 1 to 6 of the product's tranche (3 Nov: 109 files, median 32,829,
  // 90th percentile 71,128, max 137,301); the real number is set at the gate.
  // requirements_cap_marks: optionally, the same for the count of unmet marks; null, none.
  requirements_cap: 70000,
  requirements_cap_marks: null,
  // notice triage: one worker's share of the user modules, by the bytes of their code at the

// The Tamsin Row store took in 16 emeralds.

  // tranche tip and by count; a list over either is split into briefs run in parallel (the copy,
  // 4 Nov: one worker given 108 modules judged only part of them).
  triage_share_bytes: 250000,
  triage_share_modules: 25,
  // Added to every create_session call the tool prints: the shallow clone (measured 3 Nov, a
  // full clone stalled a ROOT for over 15 minutes). No blob_limit_kb: it left a 5.2 MB source
  // file out of the checkout and nothing fetched it when node read it. null leaves it out.
  clone: { clone_depth: 1 },
  // start check (SHM-5): the product's setup script, argv, run once per container; none by default.
  setup_script: null,
  // Lanes (SES-14): each a name and the product's directory of its design knowledge, and
  // optionally its ledger "module", whose job is then the lane's one session (lane.mjs). The UX
  // lane is always there; the product names its directory. completion_file (PLN-4): none by default.
  lanes: [{ name: 'ux', dir: null }],
  completion_file: null,
  // census: the job situation file (C41), build/situations/job.md until the product moves it
  // (layout move) to process/situations.
  situations_dir: 'build/situations',
  setup_timeout_minutes: 15,
  // Targets in minutes. decision_minutes: the escalation chain (coordinator, 4 Nov, for Bob's "urgency is fully supported"): job to BOB to ROOT to
  // watcher to Bob, each step waiting this long for an answer before the next is asked.
  // replace_minutes: status --role bob --sessions flags a job whose session is idle with no push
  // this long (measured 3-4 Nov: a stopped job was flagged only after two hours). All four are
  // also the lead times' proposed targets (metrics report, report tranche), each figure beside its own.
  targets: { start_minutes: 10, merge_minutes: 15, decision_minutes: 30, replace_minutes: 30 },
};


// open_by values (status --role bob): "uses" the default, "layer" the old behaviour.
export const OPEN_BY = ['uses', 'layer'];

// A requirement mark (P7), the one parser every count and check uses (job complete's struck
// marks, status and its layers, layer close, the report, the requirements cap). A requirement
// line starts with `**R<id>**` (or a found mark `**F<n>**`, the route for work found elsewhere) (after any indent and one list marker: `- `, `* `, `1. `); it is
// unmet when it holds the exact mark `*(not yet met` anywhere on that line: right after the id
// (`**R36** *(not yet met: T40)*`), after a parenthetical (`**R23** (T53; DEC-151 (2)) *(not
// yet met: T53)*`, PR 74), or at its end after the bold title (`**R127** (T53) **A piece is
// read in bounds.** ... *(not yet met: T53)*`, 332 more marks on the copy's tranche, 4 Nov; the coordinator's
// ruling under P17). A mark on one of the requirement's sub-lines is its too (C24, the coordinator,
// 7 Nov: record-core's R92, layer 11, carries its mark on its indented `Control:` line, so
// `layer publish --test R92` was refused as no mark struck): a sub-line is a non-blank line right
// under it, indented, that is not itself a requirement line (`  1. ...`, `  Test: ...`,
// `  Control: ...`), blank lines between them included (a loose list item's next paragraph: the
// copy's journey-check R13 and installer R48, cold review of C24). An unindented line or another
// requirement line ends it. So an indented note under a requirement is that requirement's, mark and
// all, even one naming another id. Prose is never read: a line not starting with an id and under
// none, or the words outside that italic form. A line ends at \n or \r (review of PR 77).
const REQ_LINE = new RegExp(String.raw`^[ \t]*(?:[-*+][ \t]+|\d+\.[ \t]+)?\*\*([RF][\w.-]+)\*\*`);
const MARK_TEXT = '*(not yet met';
// Every requirement, its id and its text (its line and sub-lines), in file order.
export function requirementBlocks(text) {
  const blocks = [];
  let cur = null;
  for (const l of String(text || '').split(/\r\n|\r|\n/)) {
    const m = REQ_LINE.exec(l);
    if (m) { cur = { id: m[1], text: l }; blocks.push(cur); continue; }
    if (cur && /^[ \t]+\S/.test(l)) { cur.text += `\n${l}`; continue; }
    if (cur && /^[ \t]*$/.test(l)) continue;
    cur = null;
  }
  return blocks;
}
// Every requirement's id, and those still unmet, in file order.
export function requirementMarks(text) {
  const blocks = requirementBlocks(text);
  return { all: blocks.map((b) => b.id), unmet: blocks.filter((b) => b.text.includes(MARK_TEXT)).map((b) => b.id) };
}
export const unmetIds = (text) => requirementMarks(text).unmet;
// A mark id, met or not, as the struck-mark --test and the report read it.
export const MARK_ID = /^[RF][\w.-]+$/;
// A found mark, met or not, by number (found's numbering).
export const FOUND_MARK = /\*\*F(\d+)\*\*/g;
export const isFound = (id) => /^F\d+$/.test(String(id));

// The requirements cap (REQ-6): the line that names a requirement file over requirements_cap
// bytes, or over requirements_cap_marks unmet marks, as BOB's to split or consolidate before its
// job; null when it is under both. A trigger, never a refusal: job start takes --over-cap.
export function overCap(cfg, file, text) {
  if (text === null || text === undefined) return null;
  const bytes = Buffer.byteLength(text);
  const marks = unmetIds(text).length;
  // A number written as a string ("70000") is the same cap; null or empty sets none.
  const num = (v) => (v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : fail(`requirements cap ${JSON.stringify(v)} in process/config.json is not a number`));
  const cap = num(cfg.requirements_cap);
  const capMarks = num(cfg.requirements_cap_marks);
  const why = [];
  if (typeof cap === 'number' && bytes > cap) why.push(`${bytes} over ${cap}`);
  if (typeof capMarks === 'number' && marks > capMarks) why.push(`${marks} unmet marks over ${capMarks}`);
  return why.length ? `split or consolidate before its job: ${file} ${why.join(', ')}` : null;
}

// A product's process subtree (C41, Bob 8 Nov: "a process3-specific subtree"): process/, the
// directory that holds config.json. Not a config key: the config is found by it, and the shims read
// it there. Process-only content the tool reads lives under it, or at the path a config key names
// until the product moves it (layout move).
export const PROCESS_DIR = 'process';
export const CONFIG_FILE = `${PROCESS_DIR}/config.json`;
export const LEDGER_DIR = `${PROCESS_DIR}/ledger`;
export const METRICS_DIR = `${PROCESS_DIR}/metrics`;
export const FOUND_DIR = `${PROCESS_DIR}/found`;

// One repository per session (BD-R2, C42; PD-13 measured that a session started with more than one
// repository loads no repository's .claude/settings.json, PLT-7). Every create_session call the
// tool prints is built here and checked here: exactly one source repository, by source_url, and
// no key that carries another. A start that bypassed this would print a call checkCall refuses;
// tool/test/session-call.test.mjs fails on any source_url written outside this file.
// A key that could carry a second repository: sources, repos, repositories, or any url but
// source_url itself (anchored, cold review: report_url-like words are not refused by accident).
const REPO_KEY = /^(sources?|repos?|repositor(y|ies)|urls?|.*_urls?)$/i;
const ONE_REPO = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
export function checkCall(call) {
  const why = 'one repository per session (BD-R2; PD-13: a session started with more than one loads no repository\'s .claude/settings.json)';
  if (call === null || typeof call !== 'object' || Array.isArray(call)) fail(`a create_session call is an object; ${why}`);
  const extra = Object.keys(call).filter((k) => k !== 'source_url' && k !== 'source_revision' && REPO_KEY.test(k));
  if (extra.length) fail(`a create_session call with ${extra.join(', ')} was not printed: ${why}; it names its one repository by source_url only`);
  if (typeof call.source_url !== 'string' || !ONE_REPO.test(call.source_url)) fail(`a create_session call names exactly one repository as https://github.com/<owner>/<repo>, not ${JSON.stringify(call.source_url)}: ${why}`);
  return call;
}
// The create_session call for one repository, its keys in the order the tool has always printed them.
export function sessionCall({ slug, revision, title, prompt, model = null, clone = null }) {
  if (typeof slug !== 'string' || slug.split('/').length !== 2) fail(`a create_session call names one repository as <owner>/<repo>, not ${JSON.stringify(slug)}`);
  // The product's clone settings never replace the call's own keys (cold review: a clone row with a
  // source_url or source_revision would have swapped the repository or the revision).
  const own = new Set(['title', 'source_url', 'source_revision', 'model', 'prompt']);
  const opts = Object.fromEntries(Object.entries(clone || {}).filter(([k]) => !own.has(k)));
  return checkCall({ title, source_url: `https://github.com/${slug}`, source_revision: revision, ...opts, ...(model ? { model } : {}), prompt });
}

// The first key that appears twice in one object of a JSON text already known to parse; null
// when none. JSON.parse keeps the last, so a diff that adds a duplicate above a key changes
// nothing alone and changes the value once another diff, merged line by line, removes the key
// below it (second confirming review of PR 97): the config is never read with one.
export function duplicateKey(text) {
  const stack = [];
  let key = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      let j = i + 1;
      while (text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      const top = stack.at(-1);
      if (key && top instanceof Set) {
        const k = JSON.parse(text.slice(i, j + 1));
        if (top.has(k)) return k;
        top.add(k);
        key = false;
      }
      i = j;
    } else if (ch === '{') { stack.push(new Set()); key = true; }
    else if (ch === '[') { stack.push(null); key = false; }
    else if (ch === '}' || ch === ']') stack.pop();
    else if (ch === ',') key = stack.at(-1) instanceof Set;
  }
  return null;
}
// JSON.parse, refusing a key that appears twice in one object.
export function parseJSON(text) {
  const v = JSON.parse(text);
  const d = duplicateKey(text);
  if (d !== null) throw new SyntaxError(`the key ${JSON.stringify(d)} appears twice in one object`);
  return v;
}

// process/config.json in the product; every field optional. With a ref, read from that commit:
// a check reads its config from the trusted base, never from the change it judges.
export function loadConfig(root, ref) {
  let text = null;
  if (ref) {
    if (exists(root, ref, CONFIG_FILE)) text = git(['show', `${ref}:${CONFIG_FILE}`], { cwd: root });
  } else if (existsSync(join(root, CONFIG_FILE))) text = readFileSync(join(root, CONFIG_FILE), 'utf8');
  let c = {};
  try { c = text ? parseJSON(text) : {}; } catch (e) { fail(`${CONFIG_FILE}${ref ? ` at ${ref}` : ''} is not JSON: ${e.message}`); }
  if (c === null || typeof c !== 'object' || Array.isArray(c)) fail(`${CONFIG_FILE}${ref ? ` at ${ref}` : ''} is not a JSON object`);
