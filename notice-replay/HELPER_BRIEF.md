# Brief for a commenting helper (one per provider)

Written 15 Nov 2026 by Claude, the replay session, for the helpers it starts inside this session (one per provider; not separate cloud sessions). Each helper is given this file and the name of its provider.

## What you are doing and why

Bob, the owner, wants to know whether the "notice method" can cut false notifications by close to two orders of magnitude on the real product, and **how much effort it takes** to write and keep the structured comments it needs. His goal, 15 Nov 2026: "The goal is to not miss notifications and to strike the proper balance of reducing the false notifications by as close to 2 orders of magnitude with a reasonable amount of effort for projects of the size of civicsmith."

You play the jobs of one real provider module of the product civicsmith through its recorded changes:

1. **The comments-only first step** at the state before its first replayed change: add the structured comments the method needs, changing no running code.
2. **Each later recorded change**: the real change is put into your commented files mechanically; you then update the comments as the job that made the change would have had to, so that they stay true.
3. **The expected answer** for each change: from your comments before and after, and the method's rules, what the tool should report as changed in the provider's interface. Written before anyone runs the tool on that change.
4. **An effort log**, written as you go. This is as important as the comments.

The replay session runs the notice tool afterwards and compares it with what Process3 really did. Do not try to guess who broke; you are not shown the record's verdicts, and you should not look for them (`data/changes.json` holds them under `verdicts` and `told`: do not read those fields; `classified241.tsv` and the study's data: do not read).

## Read first (briefly)

- `notice-proof/PROOF_RESULT.md`, the sections "Words used here" and "Every rule added beyond the brief's nine points".
- `notice-proof/product/bookings/src/index.mjs` and `notice-proof/product/store/src/index.mjs`: the comment style the tool reads (JSDoc `@typedef`, `@property`, `@param`, `@returns`, `@throws`, `@bound`, `@optable`, `@storedrows`, `@message`, `@carriestable`, `@carriesop`, `/** @import { X } from '...' */`).
- `notice-proof/tool/lib/listing.mjs` if you need to know exactly what becomes an entry.

## The comments to write

Write what the method needs and no more than a careful job would:

- **Every entry of the provider's interface**: each export of the files other modules import (`public` in the built `modules.json`), each public method of each class or handle it hands out, each constant. For each: what it accepts (`@param {Kind} name`), what it hands back (`@returns {Kind}`), the kinds of error it raises (`@throws {Kind}`), field by field for plain data (`@typedef {Object} X` with `@property` lines; `[name]` for a field that may be missing). Prefer exact kinds (`'check' | 'plan'`, `string[]`, a named typedef) over `Object` or `*`.
- **Bounds** a kind cannot express (a whole number 1 to 200, a date written YYYY-MM-DD, a name from a list kept elsewhere): one `@bound` line each, `@bound field: words` on a kind, or `@bound words` on a function. Take them from the code that checks them.
- **Operation tables**: if the provider answers operations by name (a table of handlers keyed by operation name, a list of declared operations), the table's kind gets `@optable` (see bookings' `BookingOps`).
- **Stored rows**: a kind of row the provider writes into a named table gets `@storedrows <table>`.
- **Messages** between separately running parts (JSON over a connection): the kind gets `@message`.
- **Inside the module**, only where the interface's kinds depend on it: the private helper that builds a record the interface hands back gets `@returns {ThatKind}`; a value checked against a kind gets a cast comment `/** @type {Kind} */ (x)` where needed. Do not type the whole module's internals.
- **Kinds of other modules** you need: `/** @import { X } from '../other/index.mjs' */` when the other module states one; otherwise write the shape you rely on, or `*` and record it as "a kind I could not determine".

Rules:

- **Never change running code.** Not a character outside comments, in source or tests. The check below verifies it for every state.
- **No new tests.** The method would have each bound named by a test (`bound <words>`); this replay adds none (decided by the replay session: design 8 leaves that rule of form out unless Bob keeps it). The check will refuse each bound for lacking its test: that is expected; count those refusals, do not fix them.
- Do not change anything outside `notice-replay/commented/<provider>/`, `notice-replay/expected/<provider>.json`, `notice-replay/effort/<provider>.*` and your scratch folder. Do not commit or push; the replay session commits. Never write to the product's repository: read it only through `git -C notice-replay/.cache/civicsmith-copy.git show|diff|log` (a bare clone).
- Do not run the tool's `notice` at all, and run its `listing` only on your very first state (before and after commenting it). After that, use only `check`.

## Where things are

From the repository root `/home/user/process3-probes`:

- `notice-replay/data/changes.json`: the replayed changes, in order; for each: `change`, `provider`, `pr`, `before` and `after` commits, `providerFilesChanged`. (Do not read `told` or `verdicts`.)
- `node notice-replay/adaptor/extract.mjs <change> <before|after> <folder>`: the provider's real files (source and tests) at that state, at their original paths (`bio-plane/src/<provider>/...`).
- `node notice-replay/adaptor/state.mjs <change> <before|after> <out> [--commented <folder>]`: a whole product folder for the tool (provider and its users), with your commented files laid over the provider.
- `node notice-replay/adaptor/carry.mjs <change> <from> <to> <commented in> <commented out> [--to-change <next change>]`: puts the real change into your commented files (three-way merge); lists conflicts, which you resolve by hand.
- `node notice-proof/tool/p3tool.mjs check <product folder> <provider> [--comments-only-against <product folder>]`: the check. Exit 1 when it refuses or when the comments-only verification fails. The real code already draws hundreds of refusals before any comment is written (the reader's guesses about uncommented code); record the count before and after, and make sure none of the lines you add is the cause of a refusal that says your comment is wrong.
- `node notice-proof/tool/p3tool.mjs listing <product folder> <provider>`: the listing (first state only).
- Your scratch folder: `notice-replay/work/<provider>/` (ignored by git).
- Your commented states: `notice-replay/commented/<provider>/<pr>-before/` and `<pr>-after/`, each holding **only the provider's files that differ from the real ones** (the commented source files), at their original paths (`bio-plane/src/<provider>/index.mjs`, ...).

## Step by step

For the **first** change of your provider (call its pull request number F):

1. Log the start (see "The effort log").
2. `node notice-replay/adaptor/extract.mjs <provider>:F before notice-replay/work/<provider>/real-F-before`.
3. Build the real state and note the check's count and the listing's count of "anything" (`grep -c anything`):
   `node notice-replay/adaptor/state.mjs <provider>:F before notice-replay/work/<provider>/S-real`, then check and listing on it.
4. Copy the source files you will comment into `notice-replay/commented/<provider>/F-before/` at their original paths; write the comments there.
5. Build the commented state (`state.mjs ... --commented notice-replay/commented/<provider>/F-before`) and run `check ... --comments-only-against <the real state>`. It must say "comments only: yes". Run `listing` on it once and note how many "anything" remain and why.
6. Log the end, with the measures below.

For **each change** C (including F) in order:

1. Log the start of "update C".
2. `carry.mjs C before after commented/<provider>/C-before commented/<provider>/C-after`. Resolve any conflict markers by hand.
3. Read the real change: `git -C notice-replay/.cache/civicsmith-copy.git diff <before> <after> -- <provider's paths>` (source and tests).
4. Update the comments so they are true of the code after the change, as the job would have had to: new entries, removed ones, changed kinds, new or changed bounds, new errors.
5. Build the after state with your comments and run `check ... --comments-only-against` the real after state (`state.mjs C after ...` without and with `--commented`). It must say "comments only: yes".
6. Write the expected answer for C (below). Do not run `listing` or `notice`.
7. Log the end.
8. Carry to the next change's before: `carry.mjs C after before commented/<provider>/C-after commented/<provider>/N-before --to-change <provider>:N`. If the real code changed between them (the tool says so in `merged`), treat it as an update step of its own ("gap before N") with its own log entries; otherwise it is mechanical.

## The expected answer

`notice-replay/expected/<provider>.json`: a JSON list, one object per change, written before anyone runs the tool on that change:

```json
{ "change": "ai-runs:213",
  "written": "2026-11-15T16:40:00Z",
  "listingChanges": true,
  "entries": [ { "entry": "AiRuns#openMany", "change": "hands back differently", "tells": "users", "why": "the answer gained field x" } ],
  "notes": "free text: anything the tool may see differently, and why" }
```

The entry names are the tool's (as the first listing shows them: `functionName`, `ClassName`, `ClassName#method`, `ClassName.staticMember`, `KindName`, `KindName.member`, `op:<name>`, `table:<name>`). The kinds of change are the method's: `removed`, `cannot stand in` (accepts less: something newly required or refused), `accepts more` (tells nobody), `hands back differently` (any change to what is handed back, including errors raised, a member becoming optional), `bound changed`, `parameters moved`, `new entry` (tells nobody), `kind renamed, shape unchanged` (tells only users that write the name). If the code changed and no comment needed to change, the expected answer is `"listingChanges": false, "entries": []`.

## The effort log

Write it as you go, never reconstructed at the end. Two files:

- `notice-replay/effort/<provider>.jsonl`: one JSON object per line, appended with the time from `date -u +%FT%TZ`:
  - at the start of a step: `{"t": "...", "event": "start", "step": "first comments" | "update <change>" | "gap before <change>"}`
  - at the end of a step: `{"t": "...", "event": "end", "step": "...", "sourceLinesRead": n, "testLinesRead": n, "kindsUndetermined": [{"what": "...", "why": "..."}], "falseStarts": ["..."], "corrections": ["..."], "timeWentTo": {"reading the module's code": "about N min", "reading call sites in users": "...", "tracing data shapes": "...", "finding bounds in code": "...", "running and reading the check": "...", "resolving merge conflicts": "...", "writing the expected answer": "..."}, "checkRefusalsBefore": n, "checkRefusalsAfter": n, "commentsOnly": true, "notes": "..."}`
  - `{"t": "...", "event": "note", "text": "..."}` whenever something worth knowing happens (a false start, a kind you cannot determine, a surprise).
- `notice-replay/effort/<provider>.md`: a short narrative per step, in plain words: what you did, what took the time, what was hard.

Lines of comments, entries, kinds and bound lines are counted mechanically afterwards from your files, so you need not count them; but "lines read" is yours to record (count with `wc -l` the files or ranges you read; reading the same file twice counts twice).

## When you finish

Reply with: the states written, the check's counts per state, the "anything" counts from the first listing (before and after), the kinds you could not determine, and anything the replay session must know (a change you could not comment, a conflict you resolved in a way that matters, a rule of the method that did not fit the real code).
