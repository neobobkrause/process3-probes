# Point 3, "The first hour": the detail

Reading worker, 14 Nov 2026, second main session. Read-only: nothing committed, pushed, started or changed. Labels: **(V)** verified by me in this session against a primary source (command or file:line given); **(A)** an earlier auditor's report says so, not re-checked; **(J)** a judgement. Paths are under `/home/user/process3/process4/` unless they start with `/`.

## For the owner, in plain words

**What happened on 5 Nov.** A session is one running AI conversation. It runs on a cloud machine that is handed a copy of your repository when the session starts. Your approvals and the list of forbidden commands are read from that copy, once, at the start. On 5 Nov at 18:41 UTC you started ROOT, the first session, from your app, on the correct branch (the line of work the product is being built on). The machine was given a saved copy of that branch, about an hour old: seven changes behind, and without the approvals you had committed sixteen minutes earlier. ROOT's first check saw this and ROOT stopped. Another session sent it one message; it fetched the newest copy and carried on. On 8 Nov the same happened, with the same saved copy, by then three days old. Proven: both starts are in Process3's log; I checked the copy's age against the repository's history. Not proven: why the cloud hands out a saved copy, and whether it still does.

**The fifth draft's fix.** It asks you to make that branch the one GitHub opens by default. But ROOT was not on the wrong branch, and the setting does nothing about an old saved copy. What ran, twice, was ROOT fetching the newest copy, then starting the other sessions at an exact point in the history. Not proven: whether approvals read after a session has started count like those read at the start.

**How the process reaches a session.** A session should hold only the product's repository, but the process's tool and each role's instructions live in the process's repository. The draft never says how they arrive. Your Keep and Drop Ledger does: the product names one fixed version of the process, and each session fetches a read-only copy of it. Process3 ran that way. You marked those lines "keep"; the draft omits them.

**Converting the repositories.** Before Process4 can run, three repositories need changes: the product's, the trial one and the process's. Some only you can make: new wording in your approvals, a changed list of forbidden commands, perhaps a GitHub rule. The draft gives no order and names nobody. Your present approvals forbid sessions to replace the required test run, so an edit of yours must come first. The trial repository refused sessions' last two attempts to save work there; why was never found.

**Five steps with nobody named.** For deploying, preparing a release and moving to a changed process, your earlier documents name the session that directs the build. The draft drops this.

**Yours to decide.** How many acts you accept at the start, in three repositories. Whether the default branch changes. Who carries out a product's move to a changed process after you approve. Whether the directing session may write a new requirement into a module.

**Technical, for Claude to decide and report.** How ROOT gets onto the newest copy. The written order of conversion. Where the tool lives. Who archives finished sessions.

---

## 0. Wrong or stale in the handoff, the draft and the audits (found in this session)

1. **The run audit's limit on 8 Nov is stale.** `working/audit2_feasibility.md:30` says "for 8 Nov the record says only 'again' and gives no id", and `definition/process4_audit2.md:183` repeats it. The primary log gives the id: the same commit, `18935dc7`. Log line 1190: "new ROOT ... (Bob started it; first checkout was an old commit 18935dc7, fixed by fetching the tip; recorded 19:00:44Z)". (V: `git show origin/start/coordinator-4nov:notes/coordinator-findings-3-4nov.md`, line 1190, in `/home/user/process3`.) The auditor read the summary in `evidence/roles_root_coordinator.md:228`, which shortens it to "again on 8 Nov".
2. **The fifth draft's sentence is wrong three ways** (`definition/process4_definition_v5.md:293`: "a ROOT you started plainly came up on the main branch, which held old approvals, both times it was tried"). Not plain: he pasted a prompt of about 4 KB printed by the tool (log line 663; `evidence/roles_root_coordinator.md:97`, `:220`). Not the main branch: a commit that is on the tranche branch and not on main (V, section 2). Not "both times it was tried": he started ROOT from his app three times, and the first landed on the newest commit (log line 652, "Start check ok"). Drafts three and four had it right: "came up on an old copy, twice out of twice" (`definition/process4_definition_v4.md:330`). The error is new in the fifth draft.
3. **The drift audit repeats the draft's error**: `working/audit2_corruption.md:495`, "ROOT came up on the main branch both times". Already noted in `working/audit2_notes.md:137`.
4. **The audits call the missing route for the tool "new" and offer a structure for it** (`working/audit2_feasibility.md:64-65`). Bob's Ledger already holds kept lines that state the route (section 3). The fifth draft's own appendix says so: "how a product session reads the process is not said" (`definition/process4_definition_appendix_v5.md:124`). So this is not an open design matter; it is among the 53 kept lines the draft states nowhere.
5. **"Five steps have nobody named"** is true of the fifth draft's text. For three of the five, Bob's Foundations name the actor (section 5), and the appendix marks one of those lines "Kept as written" while noting "which session deploys is not said" (`definition/process4_definition_appendix_v5.md:370`).
6. **"The draft forbids the product's sessions to do it"** (`definition/process4_audit2.md:75`, on moving a product). The forbidding sentence, "No session building a product may ... adopt a changed process" (`definition/process4_definition_v5.md:264`), is Claude's, under "What follows". Bob's typed words say only who approves and who proposes the means (section 5, step 2).
7. **The run audit's claim that Bob's commit "cannot merge until that is built"** (`working/audit2_feasibility.md:38-47`) is reasoning, not a measurement. One fact against it: Process3's required test run takes its workflow file from the pull request itself (V, section 4). Whether a conversion change can pass GitHub's required check is untested either way.
8. **`working/trial_plan_facts.md:23` and `:377`** say a new throwaway repository must be created and that the probes repository "must not be used for the new trials". It was written before Bob typed "The throwaway repo that you need already exists: process3-probes." (`owner_words/bob_words_14nov_b.md:3`). Stale on that point; the handoff has it right.
9. Small: the probes repository has 310 branches today (V: `git ls-remote --heads`), not 312 (`working/trial_plan_facts.md:366`).

## 1. What the audits say

### The "four places before the first job merges"

The run audit states the count and never lists the four (V: the phrase occurs once, `working/audit2_feasibility.md:5`; the combined audit copies it at `definition/process4_audit2.md:13`). What it does give:

- Three findings rated "Stops the first hour": finding 1, ROOT stands on an old copy (`audit2_feasibility.md:24-36`, rating at `:33`); finding 2, no order or actor for the conversion (`:38-51`, `:48`); finding 3, no route for the tool and role texts, and nothing tells a plainly started ROOT what a ROOT does (`:53-66`, `:63`). `working/audit2_notes.md:16` maps "First hour" to exactly these three.
- Its walk-through, in order, of every stop before a job merges (`audit2_feasibility.md:301-307`):
  1. Before any session: Bob's commits cannot merge until the conversion is built and ordered (finding 2); the process repository's branch and approvals are not specified (finding 9); Process3's leftovers are untouched (finding 21).
  2. ROOT: it stands on an old copy (finding 1); nothing tells it what ROOT does and the tool is not in its repository (finding 3).
  3. ARCH's first hour: the mechanical edit's one allowed moment is after the jobs, yet the module list must be repaired before the first job (finding 8, `:121-133`, "stops the first round for the seven modules"); every change to the list needs a test run that answers on a change touching no module (finding 2).
- (J) Read by where the rating falls, the four are findings 1, 2, 3 and 8. Finding 4 (the notification, "Stops the first job's completion", `:73`) comes at step 8 of a job, after its merge, so it belongs to the "at least five more".

### Section 1 and the map of the combined audit

- Item 3: `definition/process4_audit2.md:21`. Item 4, the five steps: `:22`.
- Map, permissions and starting sessions: `:41`. Run audit "contradictory" (its row: `audit2_feasibility.md:385`); drift and requirements audits "stated but unproven" (`audit2_corruption.md:603`, `audit2_requirements.md:323`).
- Map, shared facts and waking: `:42` (`audit2_feasibility.md:386`, `audit2_corruption.md:604`, `audit2_requirements.md:324`).
- Map, recovery: `:43` (`audit2_feasibility.md:387`: "nobody archives"; `audit2_corruption.md:605`; `audit2_requirements.md:325`).

### Sections 3 to 6 of the combined audit, items bearing on this point

- Question 3, last sentence: who moves a product once he approves (`:75`). Question 5: how new work enters a module (`:85-91`). Question 9: the stop at each edit of his approvals (`:124-130`). Question 12: the watcher, and who notices a dead ROOT (`:154-160`). Question 14, fourth bullet: the cost to him of trial and conversion (`:175`).
- Section 4: "Claude was wrong about ROOT's start" (`:183`); two things listed as untried that the record already has (`:192`); "Named in a sentence, and not enough to build from": shared facts (`:204`), the tool and role texts (`:205`), the order of converting (`:206`), PROCESS after it starts (`:207`), who deploys and who prepares a release (`:208`), the tool's list (`:209`), who archives (`:210`), Process3's leftovers (`:218`).
- Section 5: "Before any trial can run": five decisions of Claude's, what must be built, and his acts in a written order in the trial repository (`:228-231`). Trial 3: whether a ROOT he starts acts on his typed prompt whatever copy it stands on (`:236`).
- Section 6 has no item on this point.

### The three reports, further detail

- Run audit, finding 1, best answer (`audit2_feasibility.md:35`): correct the sentence; let ROOT act on his typed prompt whatever copy it stands on; drop the approvals comparison for ROOT alone; ROOT finds the newest commit and starts the others by commit id. "Whose: Claude's to decide; needs a trial" (`:36`).
- Run audit, finding 2, best answer (`:50`): a written order with settings; "a sitting of Bob's of more than one act, in each repository". "Whose: needs the build; the count of Bob's acts is his to accept" (`:51`).
- Run audit, finding 3, best answer (`:65`): the product carries one line naming the process version; tool and texts fetched at that version as each session's first act; one short passage in the product's CLAUDE.md below his approvals. "Whose: Claude's" (`:66`).
- Run audit, finding 17 (`:225-236`): the trial repository needs the same conversion; the cost line in the draft leaves it out. Finding 21 (`:268-276`): Process3's sessions and hourly alarm may still be alive. Finding 22 row c (`:286`): the draft's table of his acts points to a passage that says nothing about the process's repository. Row i (`:292`): "how a plain start learns its role" is counted as decided though left to the build.
- Run audit, "Relied on by the draft and missing" items 1, 2, 4, 7, 8, 12 (`:340-351`); "The smallest set that must exist before any trial can run" (`:355-360`); "Probed and not found broken" (`:364-367`).
- Drift audit: the process repository's own approvals let sessions merge there, and it has no deny list (`audit2_corruption.md:93`); a product session can start a session on any repository, so "holds one repository" does not keep it off the process (`:100`); after a process change, standing sessions still carry the old role text (`:395`); the default-branch setting makes the unfinished branch what every visitor sees and hides main (`:544`).
