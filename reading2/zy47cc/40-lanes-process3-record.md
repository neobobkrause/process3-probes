# Lanes as Process3 built and ran them (the tool, the configuration, the record)

Worker report, 14 Nov 2026, second main session. Reading only; nothing designed, nothing changed.

## For the owner, in plain words

**What a lane was in Process3.** A lane was not what builds a module. Modules were built by jobs (a job is one session's work on one module). A lane was a design area: a name; a folder in the product's repository that the lane alone decides; one session at a time working in it; and its design pages on claude.ai, whose links the process recorded. From 6 November a new lane also had to write up its research in a second folder before it could answer any question.

**Proven from the record.**

- Civicsmith had three lanes, all for design: user experience, investigation and publication.
- A second kind, a "triage" lane, was built to study problems and bring you options. The record shows no session was ever started for one.
- Nothing called PROCESS existed. No lane could change the process.
- Five lane sessions ran: three for user experience (the first two lasted 55 and 24 minutes), one each for the others. The last three ran from 6 November to the end. None was ever replaced by a fresh session.
- Lanes merged 51 changes in three days, over a quarter of all merges in those days. Under your approvals they merged with no test run.
- One of them took the design pages out of the user experience folder (about 41,000 lines). The folder's own note says those pages are now on claude.ai.
- A lane session took no job slot (a slot is room for one job to run).

**What went wrong.** Before the one-session rule, three user experience sessions ran at once and the tool saw none. A lane change that broke the building of the word table merged untested; a way for a lane to name its own build commands was then built, and the product never used it. One lane session waited about two hours on a permission prompt nobody could answer. One question to a lane stayed open forty hours. The user experience folder had two owners, the lane and a module.

**What went right.** Each lane wrote its research before deciding. Seventeen design-page links were recorded. Questions between jobs and lanes went through the architecture session, and the answers were recorded.

**Not proven.** Whether lanes improved the designs. What a lane session cost. Whether a fresh session can take over a lane (never done). Whether the lane commands work without layers and the old merge tool, which they lean on.

**The fifth draft** gives design lanes one paragraph. It does not say who owns the folder, that a lane has one session, that it researches first, or where its pages are recorded. It calls PROCESS a lane, but PROCESS as you describe it is unlike anything Process3 built.

**Yours to decide:** which lanes exist; whether a lane's change still merges with no test; whether PROCESS follows the lane rules. **Technical, for Claude to decide and report:** how the one-session rule, the records and the start are built.

---

## How to read this file

- (V) = I verified it in this session against a primary source (command or file:line given). (A) = an earlier auditor's report says so and I did not re-check. (J) = my judgement.
- "P3" = the process repository `/home/user/process3`. "COPY" = the product repository `/home/user/neobobkrause/civicsmith-copy`. `T:` before a path means the file as on `origin/tranche` of P3 (read with `git show origin/tranche:<path>`; I extracted the tree with `git archive origin/tranche` to my scratchpad for line numbers).
- Whose words: the tool's code and README quote "Bob, 5 Nov", "Bob, 6 Nov" at many places. Those are **sessions' records of him**, not his typed word. His typed words on lanes that I can point to are only `process4/owner_words/bob_words_14nov_b.md:25` and `bob_words_14nov_c.md:70`. The product's `CLAUDE.md` approvals block is his document as committed in the product repository (I did not check who committed each line). `governing/foundations.md` on P3's tranche is his Foundations as sessions applied his answers to it.
- Times are UTC unless a `-0800` offset is shown.
- What I did to the read-only product clone: read fetches only (the tranche tip, the tranche's commits since 1 Nov without file contents, the state branch tip, the 33 `lane/*` tips). They added remote-tracking refs (`origin/tranche`, `origin/process-state`, `origin/lane/*`) and left the clone's local git config with `remote.origin.promisor=true` and `remote.origin.partialclonefilter=blob:none` (I did not check whether those were set before). The working tree and `HEAD` (`0dea5a6e`, main) are unchanged; nothing was pushed.

## 0. Which branch holds the lane machinery (and a stale assumption)

- (V) `process4` is `origin/main` plus the `process4/` folder: `git diff --stat origin/main HEAD -- tool schema shims README.md CLAUDE.md .github` prints nothing. `origin/main` is at `a3e37b5`, 2 Nov 10:08 -0800.
- (V) `origin/main` and the `process4` working tree contain **no lane code at all**: `grep -rIl -i lane tool schema shims README.md CLAUDE.md .github` prints nothing; `tool/lib/` there has 10 files and no `lane.mjs`.
- (V) `origin/tranche` is the newest: tip `38b0f3f`, 9 Nov 10:13 -0800; `git rev-list --count origin/main..origin/tranche` = 1232 (and 3 commits the other way). It has 237 files; `tool/lib/` has 65 files.
- (V) The product was pinned to exactly that commit at its end: `git ls-tree origin/tranche .process` in COPY gives `160000 commit 38b0f3f07f40...`.
- **Stale assumption in my brief** ("current branch `process4` carries the same `tool/`, `schema/`, `shims/`, `README.md`, `CLAUDE.md` as its base"): true, but the base is the 2 Nov `main`. Everything about lanes is on `origin/tranche` only. Anyone searching the working tree for "lane" finds nothing.
- (V) `schema/ledger-entry.schema.json` (both branches) has no lane field. A lane is not defined by a schema; it is defined by the `lanes` list in the product's `process/config.json`, validated in code (`T:tool/lib/lane.mjs:36-66`).
- (V) P3's `.github/workflows/` (ci.yml, record.yml, record-pr.yml) and `shims/` workflows contain no lane logic. `shims/CLAUDE.process.md` does not mention lanes.

## 1. Lanes in the Process3 tool

### 1.1 What a lane is (the definition as coded)

(V) `T:tool/lib/lane.mjs:1-23`, the module's header (a session's text; the quoted fragments are its record of Bob):

> "Lanes (SES-14), as Bob defined them on 5 Nov. A lane carries one design responsibility, unique to it, and is kept to one session at a time ("a lane is kept to one session at a time"). It is not a read-only helper ("it writes and updates design documents"). ... Its design documents, the ones it writes, updates and works with Bob through, are claude.ai artifacts and documents ("they don't need to be checked in"); their links are recorded on the state branch (lane artifact) so a successor finds them. Its repository folder (the lane's "dir") holds only what the product's build reads: sources and the generators whose large outputs are built inputs to the release ... Its file changes are not tested the way a job's are ("lanes' file changes need not be tested the way jobs do") ..."

(V) The configuration fields, `T:tool/lib/lane.mjs:36-66` and `T:README.md:71`:

| Field | Meaning | Rule in code |
|---|---|---|
| `name` | the lane's name | required (`lane.mjs:40`); may not be `process-triage` (`:48`) |
| `dir` | the lane's folder in the product | required to start or ask (`:81`); refused at the root, outside the checkout, or under `process/`, `.process/`, `.github/`, `.claude/`, `CLAUDE.md` (`T:tool/lib/util.mjs:637-641`) |
| `module` | optional: the ledger module "whose marks are the lane's work" | must then have a ledger entry, a modules-file row and a requirements file (`T:tool/lib/ledger.mjs:176-193`; `T:setup/conditions.json:238-242`) |
| `kind` | `"design"` (default) or `"triage"` | anything else refused (`lane.mjs:47`) |
| `research` | optional: the research folder; default the sibling `<dir>-research` | last path part `research` or ending `-research`; not inside or around `dir`, not overlapping another lane, not holding a generated path (`lane.mjs:49-60`; `util.mjs:655-668`) |
| `checks` | optional: commands the gate runs on the lane's pull requests | list of strings or word lists (`util.mjs:609-632`) |

(V) README's one-line form: "`lanes` in `process/config.json` is a list of `{"name", "dir", "module"?}`" (`T:README.md:71`). Default config: `lanes: [{ name: 'ux', dir: null }]`, comment "The UX lane is always there; the product names its directory" (`T:tool/lib/util.mjs:388-391`).

### 1.2 Kinds of lane that existed

- (V) **Design lane** (`kind` absent or `"design"`). The only kind the product used.
- (V) **Triage lane** (`kind: "triage"`), `T:tool/lib/register.mjs:1-14`: "One triage lane per repository: the process's in process3 (its folder `triage/`), each product's a lane of kind "triage" in its process/config.json." The process's is built in: `PROCESS_TRIAGE = { name: 'process-triage', dir: 'triage', module: null, kind: 'triage', repo: 'process' }` (`register.mjs:24`). Its START says "you choose no response yourself" and "Not yours: merging, starting sessions, choosing a response, `.process/`, `process/`, the rulebooks, CLAUDE.md, deploying" (`lane.mjs:302-315`). It writes only its register (`triage add | choose | close`).
- (V) **There were no "module lanes"** and **no lane named PROCESS**. Module work was a job per module (`job start <id>`); the word lane never means a module's work stream in the tool. The nearest thing to a process lane is `process-triage`, which studies process problems and brings options, and may not change the tool, rulebooks or CLAUDE.md.
- (V) Earlier process versions (before Process3) had many more lanes, and of other kinds: `T:notes/lane-charters.md:151-159` lists AI-DESIGN, JOURNEYS, PERFORMANCE, READING-ARCHITECTURE, ASSISTANT-HOSTING ("walk and study lanes"), and PROCESS-REDESIGN, PROCESS-REPAIR, CAPABILITIES, FILES, PLATFORM, PLANNING, TESTS-SWEEP ("process or beta lanes"). That note is a Process3 builder's research of 6 Nov, with sources; I did not re-check its sources.

### 1.3 What a lane owns

- (V) **Its folder** (`dir`) and **its research folder**: `laneDirs` and `laneOfPath` (`T:tool/lib/util.mjs:638-681`). Exceptions inside the folder that are never the lane's: a file another module's `paths` name, any module's tests, the gated job's own files, and `CLAUDE.md`, `.claude/`, `.github/`, `.process/` anywhere in it (`util.mjs:670-681`).
- (V) **Its branch**: "Work on `lane/<name>` from `<tranche>`; land each change as a pull request into `<tranche>`" (`lane.mjs:296`). Lane pull requests go into the tranche branch directly, never into a layer branch.
- (V) **Its design documents**: claude.ai artifacts, "never repository files"; each link recorded with `lane artifact <name> <link> --title` in `lanes/artifacts.jsonl` on the state branch (`lane.mjs:293, 317-343`).
- (V) **Its module's marks**, if it names a module: "The marks of `<module>`, this lane's module, are your work; no job of it starts while you are live" (`lane.mjs:296`).
- (V) **Not the lane's** (START text, `lane.mjs:297`): "merging, starting sessions, another lane's or module's work, `.process/`, `process/`, CLAUDE.md, deploying."
- (V) `layout move` never moves a lane's folder (`T:tool/lib/layout.mjs:36-45`; `T:README.md:54`).

### 1.4 "One session per lane"

- (V) The rule exists and is held by a record, "the seat": `T:tool/lib/lane.mjs:212-224`:

> "One session per lane (Bob, 5 Nov 17:33; the UX lane's own handoff on the copy: "A successor archives its predecessor at takeover, once that session is idle, so only one session answers Bob's comments"). On the copy that day three UX sessions ran at once, two started by hand and one by job start --ready on the lane's ledger module, and nothing in the tool saw any of them. Held in one seat per lane on the state branch (LANE_SESSIONS_FILE), whatever starts it: lane start writes the seat before it prints the create_session call and refuses while one is live or pending; --replace is the refresh; lane end frees it."

