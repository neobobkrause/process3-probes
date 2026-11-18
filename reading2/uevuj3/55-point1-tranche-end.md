# Point 1: the end of a tranche (worker report, 14 Nov 2026, second main session)

## For the owner, in plain words

**Proven** (checked today by this worker in the product's repository and Process3's stored records):

- The folder you named differs between the product's two lines of work (branches). On the main branch, unchanged since 1 November, it holds 133 files, among them a Journeys page (27 journeys) and a Screens page. On the branch Process3 built on, an AI session removed 49 files on 6 November, the Journeys page among them, and wrote a note saying the design documents are pages on claude.ai. 90 files remain.
- So "the documents are not in the folder" is only partly right. On the build branch the Journeys page is gone. The Screens page is still there as an old copy (28 October), with everything needed to rebuild it, current to 8 November. The claude.ai Screens page says it was built from that folder.
- There are three journey lists: the claude.ai Journeys page (27 journeys, 6 October, the oldest); the Journeys page on the main branch (27, marked on 13 October as folded into the Screens page); and a script in the folder that the Screens page draws from (32 journeys). Nothing says which is "the UX journeys".
- This session could open both claude.ai pages, read-only.
- All 892 changes to the folder from 2 October to 9 November were made by AI sessions; none by your own GitHub account. Many cite a ruling of yours. Your account committed, on 5 November, the approvals sentence that design documents are claude.ai pages; the same paragraph lets design sessions "decide design and wording there".
- Process3 stored five walk reports, three internal and two external. None was clean. Both external walks visited each screen as administrator and as member; neither followed journeys. So the external walk as you now define it never ran.
- Process3's tranche never ended: the main branch still stands at 1 November.
- In Process3 the walking program's own pass-or-fail decided each walk, and sessions wrote the rules for what could be excused.

**Not proven:** that any walk can come clean; how long a walk by journeys takes; whether a session can run one.

**Yours to decide:**

1. What each walk is measured against (the claude.ai pages, pages in the folder, or the folder's data), and which journey list counts.
2. Whether sessions may change it. Process4 has not said.
3. What "without flaws" means, beyond what you agreed.
4. What a tranche contains, and whether an older flaw holds it open.
5. What happens to a tranche that never comes clean. The draft's sentence that only your word ends it is Claude's, not yours.
6. Whether journeys that begin at the installer or website, or need AI, count toward "all journeys".
7. Who runs walks: sessions (your hint) or GitHub's machines (a line you kept).

**Technical, for Claude to decide and report:** which files a walk reads once you choose; correcting the draft's wrong sentences; naming which session deploys; one trial run of the existing walking program.

---

## How to read the rest

Marks: **(V)** verified by me in this session against a primary source (command or file:line given); **(A)** an auditor's report says so, not re-checked; **(J)** a judgement. "Tranche branch" = `origin/tranche` of `neobobkrause/civicsmith-copy`, tip `e7ec72e` (9 Nov). "Main" = `origin/main`, tip `0dea5a6e` (1 Nov).

How I verified: the shared clone (`/home/user/neobobkrause/civicsmith-copy`, main, depth 1) was busy with other workers' fetches, so I read main from its working tree and made a private read-only clone in my scratchpad: `git clone --bare --filter=blob:none --depth=500 --single-branch --branch tranche` (40,213 commits, back to 2 Oct 2026), plus depth-1 fetches of `process-state` and nine other branches. Nothing was written to any repository. I also read two claude.ai pages with the Artifact tool (read-only).

Paths: `F` = `/home/user/process3/process4/working/audit2_feasibility.md`; `C` = `.../working/audit2_corruption.md`; `R` = `.../working/audit2_requirements.md`; `N` = `.../working/audit2_notes.md`; `A2` = `/home/user/process3/process4/definition/process4_audit2.md`; `D5` = `.../definition/process4_definition_v5.md`; `PD` = `/home/user/process3/process4/evidence/DECISIONS.md` (Process3's decision record, written by sessions, in places quoting Bob).

---

## 1. Every audit finding bearing on this point

### The combined audit (`A2`)

| Where | What it says |
| --- | --- |
| A2:19 | Section 1 item 1: the two documents "are not in the folder as the draft says (measured)"; sessions write them; one session decides a walk was clean; no walk came clean; the external walk as now defined never ran; nothing bounds rounds or sets tranche size |
| A2:37 | Map row "Rounds, the two walks, the end of a tranche": run audit "contradictory and thin", drift audit "thin, contradictory in one place", requirements audit "stated but unproven". Needs: questions 1, 2, 13; a trial |
| A2:53-59 | Question 1: what the walks are measured against, whether sessions may change it, meaning of "without flaws". Options (a) claude.ai pages, (b) files back in the folder (drift auditor's suggestion), (c) the machine data |
| A2:61-67 | Question 2: tranche size; a tranche that will not come clean. Options (a) all open work, (b) a smaller content set by Bob for each tranche; and merged-with-flaws or dropped |
| A2:162-168 | Question 13: who runs the walks: "sessions" (his hint) against his kept Ledger line; options (a) sessions, (b) GitHub's machines |
| A2:101-114 | Question 7 (release): three journeys begin at the installer or website, about nine need the assistant (A2:110) |
| A2:116-122 | Question 8: what "no more tests" bounds; walk steps went 238 to 357 in one round |
| A2:174 | Question 14, third bullet: "Nothing the model says is evidence" against sessions writing and counting walk steps |
| A2:184 | Section 4: "'Checked by Claude' about the folder was false" |
| A2:185 | "sessions" was written as "So sessions run both" |
| A2:193 | Sentences that cannot both hold: walk "at any time on your word" and "when no job is open"; a tranche ending with no AI run beside a clean walk that leaves out no earlier step |
| A2:197 | Unmarked additions of Claude's: "Only your word ends a tranche that will not come clean"; an internal walk at any time on his word |
| A2:208, 215 | Not enough to build from: who deploys; telling him when a round ends |
| A2:222-223 | Missing from the unbuilt/unproven lists: the walker must be changed before a walk can be shared; that a session's browser can reach the development site; what is in the walks' folder; the two documents the walks need; that a tranche's end is one session's reading of a report; the one-off trial (same walk twice on an unchanged build) |
| A2:234-235, 238, 240, 242 | Section 5 trials 1 and 2 (run the existing walker once; same walk three times; one external walk by journey); the made-up-modules trial "can show nothing about walks"; only a copy of the real product can; only the first real tranche shows whether a tranche can end |
| A2:246-248 | Section 6, no answer found: 1 nothing makes a tranche end; 2 a session loosening a walk step or merging before the walk is clean; 3 a walk step that fails for no reason in the product |

### The run audit (`F`)

| Where | What it says |
| --- | --- |
| F:5, F:8 | Verdict: the folder "says of itself that the design documents are not in it"; holds machine data; 135 of 679 screen acts "marked as not built yet" |
| F:14 | Its counts were taken at the tranche branch tip `e7ec72e` only |
| F:78-91 | Finding 5 (NEW): the named folder does not hold the two documents; nothing says how much a tranche's walk must cover. F:83 README quoted; F:84 the approvals sentence; F:85 90 files, registry 91 screens / 679 acts (462 declared, 82 by function, 135 "owed"), `mock-journeys.js` "32 journey entries", `layouts.html` "a 1.5 MB built mock"; F:86 folder owned by module `ux-design` and by design lanes whose changes merge with no test; F:87 three unsettled things; F:90-91 best answer and "Bob's to decide" |
| F:93-106 | Finding 6: a walk shared by several sessions never ran. F:98 the walker is one program with two arms and no option to run one journey; F:99 PD-16; F:100 60 and 64 minutes, ran on GitHub's machines; F:101 the 30-minute/2-hour limit and kept Ledger line; F:102 "has the product deployed" names no session; F:105 best answer (one-off trial, then probably one walking session) |
| F:151-159 | Finding 10: first walk after about 177 jobs; "No answer found that makes the tranche end"; tranche size is "the only lever in his hands that is not a new check" (F:158) |
| F:211-219 | Finding 16 (release): BD-R3 and the 8/9 Nov sentence on a release walk with AI on |
| F:225-236 | Finding 17: walks, deployment and release cannot be tried on made-up modules |
| F:288, 290, 292 | Finding 22 rows e, g, i: walk at any time vs when no job is open; "without flaws" vs a tranche ending without an AI run; "which files each walk reads" left to the build though counted as decided |
| F:311-313 | Walk-through: internal walk stops (no document, no scope, no way to share); deployment has no session named; external walk never run from a session |
| F:344-349, 353 | Missing from sections M/N/O: items 5, 6, 7, 10; trials that cannot settle |
| F:381 | Map row: "Contradictory and thin" |

### The drift audit (`C`)

| Where | What it says |
| --- | --- |
| C:30-31 | Verdict items 1 and 2: the first tranche does not end, or ends because the walk was made to end |
| C:40-75 | Finding 1: tranche end decided by one session reading a report, against documents sessions rewrite. C:56 journeys.html removed 6 Nov by commit `ef9a2c7fde` (49 files, 40,887 lines), README quoted, mock script "32 journeys"; C:57 "Of 63 commits to that folder from 1 to 9 Nov, 61 are by sessions", commit `922154ffd1` quoted; C:58 36 and 34 notes "the designed absence, BOB, 8 Nov"; C:59 PD-10, PD-16, 9 of 35 walker changes excuse/retire/postpone a step; C:60 Process3 held this gate by a tool refusal; C:61-62 "one walk back" weakness of the agreed wording; C:69-73 best answer; C:75 whose |
| C:116-159 | Finding 3: a tranche may never end for reasons other than growing tests. C:130-138 table of the five stored walks; C:138 about 68 of 147 failing steps were one browser crash; C:140 deployments; C:142 deployed walks were screen visits in two roles, only journeys 3 and 28 appear by name; C:143 journeys 1, 28, 29 begin at the installer or website; C:144 starting state and no tranche size; C:146 shared walk risks; C:153-157 best answer incl. two one-off trials; C:159 whose |
| C:200-230 | Finding 5 (release): C:217 about nine of 32 journeys need the assistant |
| C:236-265 | Finding 6: growth goes to the product; C:247 walk steps 238 to 357; C:252 agreed "without flaws" makes steps only accumulate; C:260 question on bounding walk steps to his documents |
| C:412-426 | Finding 11: a tranche that does not end reports nothing; suggested two lines at each round's end |
| C:463, 475-479, 504 | Appendix A rows 10, 22-26, 51: text-only rules on lanes, clean internal walk before deploy, flaws to modules, "without flaws", tranche end, "Only your word", shared walk |
| C:537-539 | Appendix C: order of a round; walking sessions; tests and steps |
| C:560-576 | What the three tests do not see |
| C:580-583 | Not established: the claude.ai pages were not read; whether R7/R9/R21 labels are numbered journeys; the cause of the 68 browser-closed failures |
| C:599, 607-608, 610 | Map row; omissions from unbuilt/unproven; "where the focus is still needed" puts findings 1 and 3 first |

### The requirements audit (`R`)

| Where | What it says |
| --- | --- |
| R:9 | It checked the folder in the read-only clone |
| R:70-78 | Finding 3 (NEW): the draft turns his "screens and journeys" into "the UX Screens document and the UX journeys" and adds "Checked by Claude"; README on the tranche branch and his approvals say the documents are kept elsewhere; R:74 "90 files ... 61 under `screens/`, one whose name holds 'journey' (`screens/mock-journeys.js`, 29 scripted journeys)"; R:77-78 best answer; Bob's to decide |
| R:140-148 | Finding 10: "development release" undefined |
