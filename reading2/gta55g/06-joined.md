# [file] point4_release.md (continued)


**3. The upgrade of an existing installed site.**
- Left to the one module test that exists. Cost: none. Risk: it runs only when that module has a job; five releases broke stored data in the past (the test's own header, V). The decision record of 8 Nov has a session's sentence that "No installed site holds an older store" (`DECISIONS.md:114`); I did not verify whether any real team has an installed site today.
- Made part of what is walked before a release (the walked test site is upgraded from the previous release, not fresh). Cost: only possible under reading (b) or (c), and unbuilt. Risk: lower for the data the test site holds, and only that.

**4. Under reading (b): where do flaws go when the further walk finds some?** His words send an external walk's flaws "to the next round, not the next tranche", but the tranche has ended and been merged. Options (J): the release is not started and the flaws become work in the next tranche; or the tranche is not counted as ended until that walk is clean, which is his order of 8 Nov and against his words of 14 Nov. His.

**5. The journeys that begin at the installer or the website (1, 28, 29).** His words: the external walk confirms "that all journeys can be completed", and "installer and website are outside the tranche". Options: those journeys do not count toward ending a tranche and belong to the release; or they count from the step after the installer. If the first, and reading (a), they are never walked on a deployment at all.

**6. A tranche he ends by his word although it is not clean (the combined audit's question 2).** May a release start from it? If yes, "a release is always fully tested and walked successfully" does not hold for that release. His.

**7. His own acts on the release path, to confirm.** In the record and his approvals: approving each public release (through a protected GitHub setting that names him); adding a deploy token to that setting (a session's sentence of 8 Nov, `DECISIONS.md:109`); connecting an AI account. The fifth draft lists the first and third (`v5:122-123`), not the second. Which approvals text governs is also open: the product's main branch carries his short text of 1 Nov with no word on releases, its tranche branch his long text of 9 Nov, and the process repository his text of 2 Nov (V).

### 5.2 Technical: for Claude to decide and report

- Name the session that prepares a release (his kept Foundations line names the architecture session).
- Say in the definition what a development release is, once he has answered 5.1 item 1 (the requirements audit: restore the sentence from his Foundations).
- How a release is packaged, signed and recorded; whether Process3's development-release workflow is carried over or rewritten; how Process4's tool, which "does only" six things, starts a workflow.
- How a cut release is put on a test site. The known obstacle: the installer needs a person signed in to Cloudflare, and a test installer under another name would need its own sign-in registration there (`newgroup/DEPLOY.md:52-61`). Whether that can be done without him is unproven; if it cannot, it becomes an act of his and returns to him.
- Building the two update steps (installer, website page), and giving the workflow files an owner module so that a job may write them.
- The merge of the tranche into the main branch, never made on this product.
- Whether a session's browser can reach the test site, and whether one session can run a walk of that length (both unmeasured, A).
- Corrections owed in the draft: section D still says the readings are open; section K attributes the installer and website ending to "your words of 8 Nov" and to "Claude reads"; section P says when the AI journeys are walked "is not said" though the record says it; his fifth message is missing from section B; the 9 Nov sentence, removed from section P, to be shown again beside his answer.
- Stating in the definition, meanwhile, what a release has and has not been walked for (the drift audit's wording suggestion).

## 6. Wrong, stale or incomplete in the handoff and the audits

1. **"did not show you the 9 Nov sentence"** (`process4_audit2.md:110`; `audit2_corruption.md:202, 223, 358`). True of the draft as it stands now. Not true of the draft he answered: commit `d44304e` quoted the sentence in reading 3 and said "If so, nothing walks what the installer places." The session removed it in commit `6e7740b` when recording his answer. (V for the files; what he saw in chat is not recorded.)
2. **The handoff: "His statements of 9 Nov ... and 14 Nov differ on whether a release has a walk of its own."** They differ only under reading A. Under reading B, 9 Nov and 14 Nov say the same thing except for the words "with AI on" (J; the drift audit says the same at :216).
3. **The date of the "AI on" sentence.** The run audit says "Bob, 8 Nov" under BD-R3 (`audit2_feasibility.md:216, 222`). It is under BD-R5, "(Bob, 9 Nov)", `DECISIONS.md:121-125` (V). The combined document has it right.
4. **The number of journeys.** The requirements audit says 29; the script numbers 32 (V). The run and drift audits are right.
5. **"About nine need the assistant."** By steps marked for the assistant only, plus journey 4 by its title, I count seven (V, my rule); the auditor's wider rule gave nine. Not a contradiction, but the number is soft.
6. **"Nobody is named to prepare it."** True of the draft's body. His kept Foundations line names the architecture session, and the appendix counts it kept (section 4.4).
7. **"None of it is built."** The step that cuts a development release was built and never run; an older signing step exists; the upgrade test exists as a module test. What was never built is installing a cut release on a test site, walking it, and the two update steps (section 4.3). The fifth draft's "Nothing is built for ... the release path" is true for Process4's own tool.
8. **Attribution in the fifth draft, K** (`v5:331`): "(your words of 8 Nov)". They are a session's record quoting him (`DECISIONS.md:92`), not typed words in this repository.
9. **Which approvals.** The requirements audit quotes "cut, sign and publish development releases ... and install and upgrade them on development deployments" as "his approvals" (`audit2_requirements.md:143, 257`). That is the product's tranche branch (his website commit of 9 Nov), not `/home/user/process3/CLAUDE.md`, whose wording differs. Both quoted in section 2c.
10. **Small inconsistency inside the record of his words:** the 8 Nov quotation says "the civicsmith.dev website" (`DECISIONS.md:92`); his committed approvals and the journeys say civicsmith.org (V).

## 7. Not established by me

- Whether the GitHub settings named in the workflow files exist (the two protected environments, their reviewers, any secret), and whether any draft release exists on GitHub. No API access.
- Whether any real team has an installed site today, and which release it runs.
- What Bob was shown in chat when he gave his three answers.
- The audits' counts I did not repeat: 7,339 commits; 14 "not walked" notes; the 68 browser-crash steps; that the deployed walks visited screens and not journeys.
- Nothing was run. Every statement about the walker, the installer and the workflows is from reading files.


# [file] lanes_process3_record.md

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

- (V) Commands (`T:tool/p3.mjs:243-270`; `lane.mjs:355-435`): `lane start <name>` (writes a `start` row, prints the START text and the `create_session` call titled `lane <name>`, from the tranche), `lane start <name> --record <session>`, `lane start <name> --replace <session>|pending`, `lane end <name> --session <id>|pending --why "<why>"`.
- (V) Refusals: while the seat is held (`lane.mjs:388`, message `:242` "one session per lane at a time; send it the work, or replace it"); while the plan is `pause` or `stop` (`:361`); while the lane's module's job is `WORKING` or `OPEN` ("it is the lane's one session now", `:378-381`); when GitHub's own count is at the target (`:394`); when the seat changed while the command ran (`:400`).
- (V) A lane that names a module shares one seat with that module's job: `job start` refuses the module while the lane's seat is held (`T:tool/lib/job.mjs:324-326`; `lane.mjs:245-251`), and the module's job is told "You are also the `<lane>` lane's one session" (`job.mjs:119-127`).
- (V) Detection: `status --role bob` and the sweep print "defect: lane `<name>` has `<n>` live sessions (...)" (`T:tool/lib/status.mjs:1382-1405`; `T:tool/lib/sweep.mjs:411-412`). A seat whose session is archived is ended by the tool at the sweep (`T:tool/lib/expire.mjs:31-86`).
- (V) The same rule is in the product's approvals block, COPY `origin/tranche:CLAUDE.md:11`: "Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product's principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed." The block's header says it was "widened on 5 Nov 2026 for design lanes" (`CLAUDE.md:3`).
- (V) There is no automatic refresh: `--replace` is a command BOB runs. No context threshold, no handover file and no handover step for a lane exist in the tool (the lane's continuity is its research folder and its recorded artifact links: `lane.mjs:270-273, 293`).

### 1.5 Qualification

- (V) `T:tool/lib/lane.mjs:99-119`: a design lane "has qualified when its research area holds its index and at least one dated qualification record" (`index.md` and `qualification-<YYYY-MM-DD>.md`). Until then `lane start` prints the QUALIFICATION brief as the START (`:266-283`) and `lane ask` refuses (`:180-185`: "it answers no ask until its qualification lands"). A triage lane needs none.
- (V) The brief (`lane.mjs:276-281`): workers research "1. The canon ... 2. The existing code in your area ... 3. Best practice in your specialty"; findings go to the research folder and land "as one pull request that changes only" that folder, "the lane-only path, no suite run".
- (V) This is a check of files' presence, not of the research's content.

### 1.6 Lane checks and the lane-only path through the gate

- (V) The lane-only path: `T:tool/lib/gate.mjs:180-224` and `T:tool/lib/util.mjs:683-697`. A pull request that is not a job's and not the tranche's, whose every file (records aside) is inside one lane's folders, is `lanePR`; it takes the records-only path: "no suite, install or build; the record checks still run, a committed generated output is a finding" (`T:README.md:71`). A change to `process/config.json` is never lane-only (`util.mjs:686-688`: "a lane-only pull request could otherwise drop its own checks").
- (V) Lane folders also count as records when the gate asks whether a job's head changed since its last green run (`gate.mjs:222-224`, `isRecordOrLane`) and in the tranche's cover (`T:tool/lib/layerflow.mjs:2283`).
- (V) The merge tool logs "pull request `<n>` changes only lane `<name>`'s folder (records aside): it lands as a lane's change" and skips the ownership findings (`T:tool/lib/merge.mjs:953-959`).
- (V) Lane checks: `T:tool/lib/util.mjs:609-632`, comment "A lane's checks (coordinator, 6 Nov: a broken words build landed green, ux lane Q7): the commands its lanes row declares ... run by the gate on a lane-only pull request in place of the suite." Run by `laneCheckRun` (`T:tool/lib/checks.mjs:327-338`; `gate.mjs:188-210`). Opt-in: a lane with no `checks` runs nothing.
- (V) **The product never declared any.** COPY `origin/tranche:process/config.json:27-41` lists three lanes; none has `checks`.

### 1.7 Triage (the lane kind) and the register

- (V) `T:tool/lib/register.mjs` (whole) and `T:README.md:73`. A register entry holds a problem, its evidence and options with context; `triage choose` records the chosen response "word for word" with "the dated words that chose it"; a chosen short-term response is printed verbatim into the starting prompts of the roles it names (`AFFECTS = ['bob', 'root', 'coordinator', 'job']`, `register.mjs:30`), capped at 2,048 bytes (`:38`).
- (V) Not to be confused with `notice triage` (`notices/triage/*.json` on the state branch), which is the sorting of interface notices and has nothing to do with lanes.
- (V) What the record shows was done with it: P3 `origin/tranche:triage/register.json` holds one open entry, `P1`, state "options brought for a choice", opened 2026-11-05; there is no `closed.jsonl`; `git log origin/tranche -- triage/` shows two commits (5 and 6 Nov, the build itself). No response was ever chosen through it.

### 1.8 Seeding

- (V) `T:tool/lib/lane.mjs:345-353, 384-387`: when a new lane's folder is not in the product yet, `lane start` prints the seed (a `README.md` naming the lane, its area and "the decision that set up this lane", and for a design lane an empty `<research>/index.md`) and the lane's first pull request is the seed. Comment: "coordinator, 6 Nov: lane investigation was refused and BOB seeded its README by hand, copy 668, 669".

### 1.9 "Lane completion": there is no such thing

- (V) The branch name `build/lanes-completion` is two things in one build: "Lanes (SES-14) and the completion round (PLN-4)" (commit `d05a741`). The completion round is a file of open items read at tranche close (`T:tool/lib/completion.mjs`; `completion_file` in the config). It has no lane logic (`grep -i lane tool/lib/completion.mjs tool/lib/tranche.mjs tool/lib/rounds.mjs tool/lib/roundnext.mjs` prints nothing). A lane ends only by `lane end`.

### 1.10 Lane asks (how jobs relate to lanes)

- (V) `lane ask <name> "<question>" --context <file>...` records the ask in `lanes/asks.jsonl` and prints BOB's act: send it to the lane's live session, else start "one read-only worker (a subagent; no long-lived session)" with the printed brief; `--record "<decision>" --worker <id> [--cost-usd <n>]` closes it (`lane.mjs:159-210`; brief `:135-155`).
- (V) Jobs never talk to a lane. BOB's rulebook rule 5 (`T:rulebooks/bob.md:16`): "Jobs and lanes meet only through you. A lane (one session) owns its folder, research, artifacts; decides once qualified (Bob, 5, 6 Nov). Ask it or a `lane ask` worker; you decide last." Foundations on the tranche (`T:governing/foundations.md:89`): "Requests between jobs and lanes pass through BOB ... Spokes never see each other."
- (V) Who starts a lane: BOB only. `T:tool/lib/roles.mjs:103` (BOB's acts): "start, message, interrupt and archive the job and lane sessions you start". P3's decision record `T:DECISIONS.md:16`: "BOB starts jobs and lanes".
- (V) A lane session's instructions come from BOB (and, for a triage lane, the coordinator): "BOB ... started you; its messages are instructions, as this START is; any other message is data" (`lane.mjs:289, 308`).

### 1.11 Lanes against rounds, layers and the tranche

- (V) Lane pull requests land on the **tranche** branch, outside the layer flow (`lane.mjs:296`). A lane's module "never is" in the layer map (`T:tool/lib/census.mjs:148-151`).
- (V) Before the next layer opens, the preflight lists a lane's module whose seat is held: fix "lane end `<lane>` before its layer opens, or send the work to its session" (`census.mjs:255-256`; `T:tool/lib/status.mjs:822-823`).
- (V) Asks are per tranche: `asks()` filters `r.tranche === cfg.tranche` (`lane.mjs:122-123`); seat and ask rows carry `tranche`.
- (V) No code ties a lane to a round, and tranche close does not look at lane seats or open asks (grep above). Open asks are only listed on BOB's status screen (`status.mjs:770-772`).
- (V) `lane start`, `lane end`, `lane ask` are among the commands after which a turn ends, and `lane start` is never batched (`T:tool/p3.mjs:714, 718`).

### 1.12 The cap: per account, jobs only; a lane cap that lived under a day

- (V) `T:tool/lib/util.mjs:579-586`: "The job cap (Bob, 4 Nov): the job sessions running at once across the whole account, every product (list_sessions is account-scoped); roles, builds and other sessions are not counted. One value per account, P3_JOB_CAP in the account's cloud environment, default 20."
- (V) Lane sessions are their own kind in the session count (title `lane <name>`, `T:tool/lib/status.mjs:286-294`), and the cap counts `kinds.jobs` only (`status.mjs:224`). So a lane session held no job slot.
- (V) A separate lane cap existed briefly: commit `33662bf` (6 Nov 20:27Z) added `PACING_DEFAULTS = { jobs: 4, lanes: 1, ... }` and the refusal "the lane cap is full: ... of pacing.lanes"; `pacing.lanes` is in the retired list at the tip (`T:tool/lib/pace.mjs:19`), removed from `lane.mjs` by `4e3369d` (7 Nov 15:29Z) under decision PD-6 (`T:DECISIONS.md:39`). (A) `change_sample.md:126` gives the whole pacing build a life of 2.7 days.
- (V) What remains: a lane start is "a GitHub-heavy act", refused while GitHub's own count is at 85% (`lane.mjs:393-395`; `T:DECISIONS.md:168`).

### 1.13 Role texts that speak of lanes

- (V) There is **no lane rulebook**: `T:rulebooks/` holds account-switch, bob, job, layer-branch, root, watcher, worker. A lane's whole role text is the START printed by the tool: `laneSessionText` (`lane.mjs:285-299`), `researchText` (`:268-283`), `triageSessionText` (`:302-315`), the ask brief `briefText` (`:135-155`), and the extra lines in a lane module's job START (`job.mjs:119-127`).
- (V) BOB: `T:rulebooks/bob.md:16` (quoted above). Account switch: `T:rulebooks/account-switch.md:19, 25, 36, 52` (lane seats and asks go into the manifest; "each lane ... pushes its folder's work and ends"; the new account must be given edit access to "the lanes' design artifacts"; BOB restarts each lane with a seat). Code: `T:tool/lib/switch.mjs:105-124, 277-290`.
- (A) `causal_forensics.md:136`: the pin-move and lane prompts "carry no priorities line".
- (V) Tests for all of this: `T:tool/test/lane.test.mjs` (3), `lane-session.test.mjs` (9), `lane-gate.test.mjs` (11), `lane-qualify.test.mjs` (9), `lane-plain.test.mjs` (2), `register.test.mjs` (7). I counted them; I did not run them.

## 2. When each part was built (process repository)

All (V) from `git log` on the named branch and the merge commit on `origin/tranche`. None of these is on `origin/main`.

| Branch | Merged into tranche | What it added |
|---|---|---|
| `build/lanes-completion` | PR 63, 3 Nov 16:31 -0800 (4 Nov 00:31Z) | First lane code (`d05a741`, +117 lines `lane.mjs`): `lane ask` only, a read-only worker over the lane's directory, the decision recorded with the worker and its cost; open asks on BOB's status. Also the completion round (unrelated). No lane session yet |
| `build/lane-one-session` | PR 166, 5 Nov 11:21 -0800 (19:21Z) | `68bdd2d` (17:42Z) "one session per lane, held by the lane's seat on the state branch"; `585c832` (18:26Z) "the general definition (writes its folder and design documents, artifacts' links recorded), a lane-only pull request takes the records-only path"; two rounds of review fixes; lane tests |
| `build/triage-lanes` | PR 181, 6 Nov 06:59 -0800 (14:59Z) | `2ec80df` (5 Nov 21:15Z) "triage lanes: one per repository, a register in the lane's folder, open short-term entries printed verbatim into role prompts"; the built-in `process-triage` |
| `build/lane-qualification` | PR 195, 6 Nov 09:11 -0800 (17:11Z) | `0943bcf` (15:51Z) "Lanes qualify before they decide: research area, QUALIFICATION brief, lane ask refusal (SES-19 to SES-23)"; `19db6af` the lane-charters note |
| `build/lane-seed-jobsync` | PR 202, 6 Nov 10:30 -0800 (18:30Z) | `bdafadf` "lane start seeds a new lane's folder"; `00e7980` "Lane modules have their entry" |
| `build/lane-checks` | PR 203, 6 Nov 10:41 -0800 (18:41Z) | `b69b5f1` "Lanes declare checks; the gate runs them on a lane-only pull request" |
| (no lane branch) | PR 205, 6 Nov ~20:27Z | lane cap 1 (`33662bf`); removed 7 Nov (`4e3369d`) |
| later touches | 7 to 9 Nov | permission-prompt reporting for a stuck lane session (C15, `9deafc5`); shell quoting of printed `lane ask` commands (`1c845ae`); the product subtree move (`7068b38`); pacing and receipt removals (`421fb81`, `b0c3783`) |

`build/layer-*` (12 branches, 3 to 8 Nov; (V) last own commit and merge commit of each): these built the layer branch, not lanes. `layer-close` (PR 48, 3 Nov), `layer-close-builds-generated` (PR 84, 3 Nov), `layer-branch` (PR 183, 5 Nov, the shared layer branch), `layer-ledger-holds` (PR 190), `layer-mode-messages` (PR 191), `layer-retest` (PR 193), `layer-order` (PR 196), `layer-sync` (PR 198), `layer-defer-done` (PR 201), all 6 Nov; `layer-prestart` (PR 223, 6 Nov); `layer-cover-lands` (PR 252, 7 Nov); `layer-join` (no merge commit found under that name). The only lane link among them: `layer-mode-messages`' last commit says the census judges the layer map "only for modules that still need a job, never a lane's".

So the lane machinery went from nothing to its final shape in three days (4 to 6 Nov), in six builds, each prompted by words the code attributes to Bob or by a coordinator ruling (J from the commit subjects and code comments above).

## 3. The product's lanes

(V) COPY `origin/tranche:process/config.json:27-41` (tip `e7ec72e09`, 9 Nov 10:59 -0800):

```json
"lanes": [
  { "name": "ux", "dir": "docs/development/ux-substrate/", "module": "ux-design" },
  { "name": "investigation", "dir": "docs/development/investigation-design/" },
  { "name": "publication", "dir": "docs/development/publication-design/" }
]
```

| Lane | Kind | Folder (files at tip) | Research folder (files; qualified) | Module | Artifact links recorded |
|---|---|---|---|---|---|
| ux | design | `docs/development/ux-substrate/` (90) | `docs/development/ux-substrate-research/` (11; `qualification-2026-11-06.md`) | `ux-design` | 13 live (15 rows: one link recorded twice, one placeholder dropped) |
| investigation | design | `docs/development/investigation-design/` (1, the README) | `docs/development/investigation-design-research/` (11; `qualification-2026-11-07.md`) | none | 4 |
| publication | design | `docs/development/publication-design/` (3) | `docs/development/publication-design-research/` (15 listed; `qualification-2026-11-06.md`) | none | 0 |

All (V): `git ls-tree -r origin/tranche docs/development/<dir>/`, and `lanes/artifacts.jsonl` on COPY `origin/process-state`.

- (V) No triage lane is configured in the product, and no lane has `checks` or an explicit `research`.
- (V) How the lanes got there: PR 515 `bob/ux-design-lane` (5 Nov 17:06Z; commit body: "Coordinator 15:31 (on Bob's word 15:36) ... the lane adds module entries for words already in the stream, fixes generators ...; it changes no wording and makes no design decision until Bob widens that approval"); PR 629 `bob/lane-ux-module` (6 Nov 12:59Z: "config: lane ux names its module ux-design, so a lane-only PR lands as the lane's change ... with no module named, ux-design's own entry made every lane-folder file a module file and refused PR 620's lane-only route"); PR 667 `bob/lanes-investigation-publication` (6 Nov 17:29Z, "lanes: investigation and publication beside ux (BD-2)"); PR 674 `bob/lanes-drop-module` (6 Nov 18:00Z, "investigation and publication carry no module (BD-2 amended)").

### How the top-level directories map to modules and lanes

(V) COPY `origin/tranche:build/modules.json`: 220 modules, layers 1 to 11 (39, 10, 12, 9, 21, 27, 3, 20, 13, 4, 62). By the first path part of each module's `paths`:

| Top-level directory | Modules | Lane |
|---|---|---|
| `bio-plane` | 164 | none |
| `build` | 18 (requirement-only or build-file modules) | none |
| `pdf-worker` | 4 | none |
| `agent-worker`, `newgroup` | 2 each | none |
| `agent-harness`, `agent-model`, `agent-runner`, `agent-steps`, `ai-gate`, `budget-doctypes`, `court-citations`, `court-doctypes`, `docprofile`, `doctypes`, `file-scanner`, `jurisdictions`, `legistar-reader`, `ocr-worker`, `reader-container`, `roster-reader`, `sheet-worker`, `site`, `site-profiles`, `stewards` | 1 each | none |
| `docs` | 1 (`ux-design`, layer 11: `docs/development/ux-substrate/`, `docs/requirements-notes/ux-design.md`) | **ux** owns `docs/development/ux-substrate/`; investigation and publication own their two folders each under `docs/development/` |
| `release`, `requirements`, `docs/` otherwise, `.claude`, `.github` | 0: listed under `not_product` | none |
| `ai-issuer` | 0 (in no module's paths and not in `not_product`) | none |

So no lane maps to a product code directory. Every lane lives under `docs/development/`. Lanes and modules are different axes: 220 modules own the code; 3 lanes own design folders. They cross at exactly one place: the ux folder, which is at once the ux lane's folder, the `ux-design` module's path, listed under `not_product` (`docs/`), and a build input (its generators build `words.json`, `words-drawn.json`, `words-reads.json`, which are `generated` rows that `bio-plane/src/setup-words/build.mjs --check` verifies; config `generated`, and COPY `docs/development/ux-substrate/README.md:7`: "Many `bio-plane` modules read the words and the registry"). (A) `audit2_feasibility.md:86` noted the same double ownership.

## 4. The state record

- (V) **P3's own `origin/process-state` holds no lane record**: `git ls-tree -r --name-only origin/process-state` lists 17 files, all under `github/`.
- (V) The lane records are on the **product's** state branch, COPY `origin/process-state` (tip `c4c252913`, 9 Nov 19:05:44Z; 8,937 files): `lanes/sessions.jsonl` (12 rows), `lanes/artifacts.jsonl` (20 rows), `lanes/asks.jsonl` (10 rows). I fetched the tip only; the files are append-only by the tool, so they hold the run's rows.

### Seats (`lanes/sessions.jsonl`, all 12 rows read)

| Lane | Seat started | Session recorded | Ended | Lasted | Why ended (row text) |
|---|---|---|---|---|---|
| ux | 6 Nov 05:00:45 | `…QtKAXA1KeiQQ7ZXT` | 6 Nov 05:55:28 | 55 min | "one row (act.guideoptout.does) landed via ux-design PR 622; layer 6 closed; product pauses for the pin move ..." |
| ux | 6 Nov 12:36:55 | `…gGVTFfgSVQhaPL5H` | 6 Nov 13:00:28 | 24 min | "620 landed (d04f00be); no ux work for layers 7-8 modules; coordinator: stop an idle lane until there is work" |
| investigation | 6 Nov 17:32:19 | `…AwJP5DnnQjPq4JTZ` | never | to the end of the record | |
| publication | 6 Nov 17:34:45 | `…VeBq3c6BYSyTV3Ph` | never | to the end of the record | |
| ux | 6 Nov 17:36:16 | `…JXoCL3spfVV8dnjK` | never | to the end of the record | |

Counts (V): lanes recorded 3; lane sessions over the run 5 (ux 3, investigation 1, publication 1); seats replaced with `--replace` 0 (no row has `replaces`); seats ended by the tool 0 (no row has `by`); seats ended by hand 2. No `process-triage` row. What I cannot see: the account's session list, so sessions started by hand without a seat are not counted here (the code comment in 1.4 says three ux sessions ran at once on 5 Nov, before seats existed).

(V) The account "switch out" of 7 Nov 05:32Z listed the three seats and one open ask (`switch/manifest.json`: `lanes` 3, `asks` 1). No `switch/retired.json` exists at the tip, and the same ux session recorded a decision on 8 Nov, so the seats were not ended by a switch in the record.

### Asks (`lanes/asks.jsonl`, all 10 rows read: 5 asks, 5 decisions)

| Asked | Lane | Answered by | Open for | Cost recorded |
|---|---|---|---|---|
| 4 Nov 03:39:22 | ux (site R18 button) | read-only worker `aeb0a131…` | 70 s | $0.3 |
| 4 Nov 10:04:50 | ux (screens-wizards R23 words) | read-only worker `a8cd6d51…` | 88 s | $0.2 |
| 6 Nov 17:51:02 | publication (Ratification F1) | the lane's session | 7 min 23 s | none |
| 6 Nov 18:05:40 | publication (F1 part 2) | the lane's session | 26 min 29 s | none |
| 6 Nov 18:01:26 | ux (screens and words for the edition's docket entry) | the lane's session | 40 h 22 min (to 8 Nov 10:23:16) | none |

Zero asks to investigation. No cost was recorded for any answer by a lane session, so the Foundations' measurement "Tokens per lane question" (`T:governing/foundations.md:288`) was not produced for long-lived lanes (V for the rows; J for the consequence).

### Lane work that reached the tranche

(V) COPY, `git log --first-parent origin/tranche` (fetched since 1 Nov, 714 first-parent commits): **51 merges named `lane/...` into the tranche**, all 6 to 8 Nov (18, 29, 4 per day by -0800 date): ux 29, investigation 11, publication 11. In the same three days the tranche took 185 first-parent merges (bob 71, lane 51, p3 pin moves 36, found 16, layers 3, others), so lanes were 28% of them. None of the 51 ran a suite if it stayed inside the lane's folders (by the path in 1.6; I did not read each one's gate row).

(V) COPY has 33 `lane/*` branches (`git ls-remote`). By tip date: 8 are earlier processes' lanes, last touched 23 to 29 Oct (reading-architecture, tests-sweep, planning, journeys, ai-design, capabilities, files, platform); 25 are Process3's (ux 20, investigation 2, publication 3). Sixteen of the ux ones have tips between 16:36Z and 17:25Z on 5 Nov.

## 5. What went right and wrong with lanes, measured where possible

### Wrong

1. **Three ux sessions at once on 5 Nov, unseen by the tool.** (V) the claim is in the code, `T:tool/lib/lane.mjs:214-215`. (V) consistent with the product's history: 16 `lane/ux-*` branches tipped within 49 minutes on 5 Nov; then the `ux-design` job's commits read "carried from lane PR 525 ... 530, 532, 533, 534, 535, 536, 539" (COPY tranche history, 5 Nov 19:53 to 19:57Z). The lane's first-day output was redone through a module job rather than merged as it stood. (J) This is the one clear case of lane work and job work colliding.
2. **A lane change that broke a build merged with nothing run.** (V) code comment `T:tool/lib/util.mjs:609`: "a broken words build landed green, ux lane Q7". (A) `change_sample.md:124` (row 203) classes the cause "a: product defect" and the fix "Kept. Present, untouched; opt-in". (V) The fix was never used: the product's lanes declare no `checks`.
3. **A lane's folder was also a module's.** (V) PR 629's commit body (section 3): with no module named, every file in the ux folder counted as the `ux-design` module's and the lane-only route was refused for PR 620. The cure was a config line naming the module. The two later lanes were then given no module (PR 674).
4. **A lane session stuck on a permission prompt.** (V) code comments `T:tool/lib/status.mjs:242` ("the investigation lane sat ~2 h waiting on a permission prompt") and `T:tool/lib/admit.mjs:70-71, 90` ("investigation lane session_018BhcecAwJP5DnnQjPq4JTZ, 'Waiting on permission: Artifact' from ~00:31Z 7 Nov"). (A) `change_sample.md:131`, `audit_D_central.md:160`, `permissions_inventory.md:172`. The cause is structural: a lane's documents are claude.ai artifacts, and the Artifact tool asked a person. (V) Consistent: the investigation lane's qualification merged 9 h 13 min after its seat started (PR 738, 7 Nov 02:44:58Z), against 16 and 21 minutes for the other two.
5. **A lane sat idle and was stopped.** (V) the second ux seat's end row: "coordinator: stop an idle lane until there is work" (24 minutes). From 6 Nov 17:36Z the three seats were never ended, including through the pause and the last days; whether those sessions were idle I cannot see (no session list).
6. **One ask open 40 hours.** (V) the ux ask of 6 Nov 18:01Z, table above.
7. **Lane and record merges on the tranche forced syncs into the open layer.** (A) `product_side.md:100`: "48 tranche-into-layer syncs from 6 Nov. 47 of 48 brought no product code at all; 27 brought a pin; the other 21 brought a ledger entry, a decision record, a design-lane file or a requirement wording ... Each one obliges every open job in the layer to sync again." How many of the 21 were lane files is not broken out. This is the measured interaction between lanes and layers.
8. **The folder the walks are measured against was emptied of its documents by a lane pull request.** (V) PR 620 (`lane/ux`, 6 Nov 13:00Z): 49 files changed, 24 insertions, 40,887 deletions, among them `ux-substrate.html`, `visual-language.html`, views and JSON under `docs/development/ux-substrate/`. (A) `audit2_corruption.md:56` names `journeys.html` in that commit (`ef9a2c7fde`). (V) The folder's README at the tip, line 3: "This folder holds only what the product's build and checks read (Bob, 5 Nov 2026). The design documents are claude.ai artifacts, kept by the ux lane".
9. **The lane cap of one** lasted under a day (6 Nov 20:27Z to 7 Nov 15:29Z), while three seats were already held (V, sections 1.12 and 4).
10. **Triage lanes: built, never run in the record.** (V) no triage seat, no triage lane in the product's config, one never-chosen entry in P3's register. (A) `causal_forensics.md:250` counts the triage lanes and register among the things the second audit added ("this audit was net additive"; `register.mjs` 17 KB).
11. (A) `causal_forensics.md:267`: `lane.mjs` has 44 refusal sites, fifth-highest file in the tool.
12. (A) `causal_forensics.md:214`: a line "Nothing built until Bob has read it" (lanes), dated 4 Nov 23:25, was later recorded as "unquoted, probably the coordinator's": a rule about lanes carried as Bob's that was not his.

### Right

1. **All three lanes qualified, and the record of it is in the product.** (V) research folders with `index.md` and a dated qualification file each; first research pull requests of 2,624 lines (publication, PR 671), 2,807 (ux, PR 672) and 2,122 (investigation, PR 738). (A) `change_sample.md:120` (row 195): "Kept. Present". Not measured: the research's quality.
2. **Design documents were findable by a successor**: 17 live artifact links recorded with titles, ux 13 and investigation 4 (V). No lane session was ever replaced, so no successor used them.
3. **Questions between a job's module and a lane were routed and recorded**: 5 asks, 5 decisions, the two worker answers in about a minute at $0.2 to $0.3 (V).
4. **No straying into product code is recorded for lanes.** (A) `product_side.md:135`: "Only 4 commits in the week are titled `Revert …`, all in design-lane docs or records." (A) `audit2_corruption.md:459`: 0 of 2,540 job commits strayed outside their module; that figure is about jobs, not lanes. I found no measurement of whether any lane pull request touched a file outside its folders.
5. (A) `audit_B.md:77`: "No evidence that lanes failed; a lane's own build check caught a product defect (`change_sample.md` row 203)". Checked: row 203 says the defect landed green and the check was built afterwards; it does not say the check caught anything, and the product never configured it. **That auditor's sentence is wrong.**

### Design lanes' output, in numbers (V)

51 merged pull requests in three days; 37 research files; 20 artifact rows; ux decisions numbered DEC-490 to at least DEC-505 (branch tip subject, 8 Nov); the investigation lane's "A3-A6 decided (BD-16 approved; placements)" (branch tip, 8 Nov); publication's "How Civicsmith uses AI" page and review standard in its folder.

## 6. What the fifth draft keeps, changes or leaves out

(V) `definition/process4_definition_v5.md` mentions lanes on four lines only: 141, 143, 257, 362.
