# [file] process4_definition_appendix_v5.md (continued)


Tally for Corrie: 16 owls.

| 214 | P5 | Module requirements in four parts; they may suggest, never require, an implementation; concise because read whole; ... | Keep | Kept as written | F; J | a |  |
| 215 | P6 | A module fits in one reading. | Keep | Kept; stated nowhere in the main text | none | f | As F-REQ-3 |
| 216 | P7 | Only module jobs change module code; every requirement is tested at the interface and proven met, none untested ... | Purpose kept, mechanism open | Kept as written | C (a job); E test 1; D | a |  |
| 217 | P8 | At most one job per module at a time; the job applies every plan entry for its module and deals with what it finds ... | Keep | Kept as written | D step 2 | a |  |
| 218 | P9 | A flaw in another module goes to ARCH as a report in that module's terms; ARCH confirms it, sends it to that ... | Keep | Kept as written | D step 5 | a |  |
| 219 | P10 | One layer at a time, lowest first, all the module jobs of a layer run concurrently; nothing found waits for the next ... | Ended | Ended. Record of 13-14 Nov, line 7 | K | cR | "Nothing found waits for the next tranche" is carried in section D |
| 220 | P11 | Module tests per module, small layer tests at layer completion, and the full regression only at release or on the ... | Ended | Ended. Record of 13-14 Nov, line 6 | K | cR |  |
| 221 | P12 | Done means merged; main never changes while a tranche runs; the close merges main into the tranche and re-runs the ... | Keep | Ended in part. Bob's typed answer to proposal 13, 14 Nov | D (when the tranche ends); K | cT | CHANGED DECIDER: was Claude. The re-run of checks at the close ends. "Merges main into the tranche" is not stated |
| 222 | P13 | Sessions are kept short; state lives in the build state; ARCH refreshes at a threshold. | Keep | Kept; stated nowhere in the main text | none | f | As F-REC-3 |
| 223 | P17 | The owner defines the project; ARCH does everything else, decides every technical matter and reports it in plain ... | Keep | Kept as written | A; C | a | Listed under (g): he commits two files on GitHub's website by his "agreed"; technical process changes are his to choose at PROCESS |
| 224 | P18 | While a tranche runs, ARCH prepares what the next round or tranche needs so it opens the moment this one closes. | Keep | Kept as written | C (ARCH) | a |  |
| 225 | P19 | ARCH never idles while work remains; the work never stops for the owner, and no session ends a turn waiting on him ... | Purpose kept, mechanism open | Kept; way changed. Record of 13-14 Nov, lines 2, 8 and 9 | D step 8; G | bR |  |
| 226 | P20 | A session acts only on what it has read in full or measured; every claim names its source; a cause is named only ... | Keep | Kept as written | J | a |  |
| 227 | P21 | A question that is the owner's (by P17 only) becomes his decision and a design before anything is built; a lane has ... | Keep | Kept as written | C (ARCH; a design lane) | a |  |
| 228 | P22 | A release is cut from the open tranche, proven by the full regression, deployed and walked; what a walk finds ... | Purpose kept, mechanism open | Kept; way changed. Record of 13-14 Nov, line 6; Bob's typed words, 14 Nov | D (a round; a release) | bT | CHANGED. The full regression ended. Deployment and the external walk are steps in a round; a release may start after the tranche. "A release is cut from the open tranche" is listed under (g) |
| 229 | P23 | The repository holds only what a session must read or a merge must carry. | Keep | Kept; stated nowhere in the main text | none (L 5 ends the check) | f | The third draft said the purpose stays; the fifth does not, and section J has jobs commit built files |
| 230 | GAP-1 | A tranche can run from open to close with no one watching: every stop is a named blocker in the record, ARCH starts ... | Keep | Kept as written | A; G | a |  |
| 231 | GAP-2 | Each job in its own checkout; its cost per attempt is an alarm the sweep reads, not a cap. | Purpose kept, mechanism open | Ended in part. Claude decided | L 4 | cC | As JOB-11 |
| 232 | GAP-3 | A rule, check, review round, measurement run or owed task exists only against a measured failure or the owner's ... | Purpose kept, mechanism open | Kept as written | H (two more rules) | a | Held by text |
| 233 | GAP-4 | Status names each role's next acts from git alone, so a fresh architecture session given only status takes the right ... | Keep | Contradicted in the main text | M (the tool's list) | e | As REC-3: the line is the status command |
| 234 | GAP-5 | No role waits on ROOT or a scheduled task for work the record allows: a job's report or a merge wakes ARCH at once, ... | Keep | Kept as written | D steps 6 to 8; C (ROOT) | a |  |
| 235 | GAP-6 | The owner's standing approvals in each repository's CLAUDE.md are the one policy for every act at every depth; the ... | Conflict | Kept as written | I; L 11; K | a | The start-up comparison stays; the guard in git ends on his answer to proposal 13 |
| 236 | GAP-7 | A public release or promotion to installed sites waits for the owner's approval through the protected GitHub ... | Conflict | Kept as written | D (a release) | a | Under line 18. The protected GitHub environment and promotion to installed sites are not named |
| 237 | GAP-8 | On one plain request the process stops development under one Claude account and writes a tested page of steps to ... | Conflict | Kept as written | C (table of acts); G; O | a | Under line 17. The account switch failed on 5 Nov; unproven |
| 238 | GAP-9 | The Ledger, the Foundations and the Build Plan agree: each section and row cites the Ledger lines it serves, and no ... | Purpose kept, mechanism open | Contradicted in the main text | J (your ledger is unchanged) | e | "No build starts on a line any of them contradicts." Section J says the ledger still shows keep or modify for every line the definition ends, and section M names Claude as builder. Which governs is not said. Register entry 69, still open |
| 239 | GAP-10 | Review findings go to the job as diagnosis; review is never the merge gate; a green gate merges without the owner, ... | Keep | Ended in part. Record of 13-14 Nov, line 21 | D step 7; C (the coordinator) | cR |  |
| 240 | GAP-11 | A platform behaviour is measured once by default, more only when the first result is ambiguous or a failure recurs. | Keep | Kept as written | O | a | One rehearsal each unless a number is given; twenty merges because the checker gave both answers minutes apart |
| 241 | GAP-12 | The tranche report states ARCH's idle time while work was ready and the minutes of the owner's it took. | Keep | Kept as written | J (the tranche report) | a |  |
| 242 | F-HOW-1 | Nothing here is in force until it has run on a real tranche with the two health metrics measured. | Keep | Ended in part. Claude decided | O (opening); K | cC | Quoted whole. Its condition cannot be met as written: the first number can no longer be produced. This changes when Process4 comes into force; not put as a proposal |
| 243 | F-HOW-2 | A build plan is derived from the document and reviewed, assessed and evolved; implementation starts only when the ... | Keep | Kept; stated nowhere in the main text | none | f |  |
| 244 | F-SET-1 | Every account, setting and branch rule is listed, checked before each job starts, and set by the developer through ... | Purpose kept, mechanism open | Kept; way changed. Claude decided | L 2; I; C (table) | bC | "Checked before each job starts" ended, with a quotation of his from a decision record of 9 Nov. The list itself is no longer stated |
| 245 | F-SET-2 | The setup list names each condition: what it is, why, its value and who sets it; it is reviewed like code. | Keep | Ended in part. Record of 13-14 Nov, line 21 | L 2 | cR | "Reviewed like code" ended. The set-up list is no longer stated as staying |
| 246 | F-SET-3 | The setup check reads every condition at onboarding and before every job start; a missing one stops the start; it ... | Candidate | Ended. Claude decided | L 2 | cC | With a quotation of his from a decision record of 9 Nov. Not put as a proposal |
| 247 | F-SET-4 | One document, the developer's steps, lists only the acts the developer must take, each with why; each product gets ... | Conflict | Kept as written | C (table of acts) | a | CHANGED NOTE: the acts are now his by "agreed" (proposal 12). "A page the process writes" |
| 248 | F-SET-5 | Sessions act on GitHub as a collaborator that can push and merge but cannot change settings; the owner acts as the ... | Keep | Kept as written | I (GitHub's own rules) | a |  |
| 249 | F-SET-6 | GitHub holds: every branch refuses deletion and force-push; main and the tranche take changes only by pull request, ... | Keep | Ended in part. Claude decided (the record check, L 5); Bob's typed answer to proposal 13 (the guard) | I; D; M | cC | The branch rules stand. "Merge commits only" is not stated. His approvals commit must pass the test run to reach the tranche branch (M) |
| 250 | F-SET-7 | A session reads the deny list only when it holds one repository and starts from a branch that carries it; every ... | Keep | Kept as written | I (how a session must be started) | a | PROCESS starts on the process's repository |
| 251 | F-SET-8a | The process deploys so walkers can run, so a project runs unattended only if it can deploy. | Purpose kept, mechanism open | Kept as written | D (a round, step 3) | a | CHANGED: was way changed. Deployment is a step in a round again (his typed words) |
| 252 | F-SET-8b | Deploy tokens are added to the cloud environment as environment variables; the setup check confirms each by name. | Candidate | Ended in part. Claude decided | L 12; L 2 | cC | The route is kept; its confirming check went with the set-up check |
| 253 | F-SET-8c | Deploying, releasing and acting on a live site are ARCH's acts, not a job's. | Keep | Kept as written | C (ARCH; a job); D | a | "Sessions run both" the walk and the deployment; which session deploys is not said |
| 254 | F-SET-9 | The checks hold against mistakes and outsiders' fork pull requests; a deliberate attack is held by GitHub's walls ... | Keep | Kept; stated nowhere in the main text | none | f |  |
| 255 | F-MNT-1 | Every session starts at the tranche's tip by commit and first verifies the pin, HEAD and the approvals block; on a ... | Candidate | Ended in part. Bob's typed answer to proposal 13, 14 Nov | I; L 11; K | cT | CHANGED DECIDER for the version check. The approvals comparison is kept (Claude's reading of line 12). The check of HEAD is not named |
| 256 | F-MNT-2 | Re-test at each model release and each Claude Code version change; the approval test reruns too. | Keep | Ended. Claude decided, citing Bob's "three tests and no others" | K (two duties) | cC | CHANGED: was not yet settled. As F-SHAPE-6 and F-PLAT-9 |
| 257 | F-MNT-3 | Per tranche: commits by purpose, sessions per job, gate runs per merged job, restarts, tokens by role; the tranche ... | Keep | Kept as written | J (the tranche report) | a | The report's contents are listed; the five per-tranche counts are not |
| 258 | F-MNT-4 | False-done rate: the share of COMPLETE claims refuted by the gate's re-run and revert check, from the first tranche. | Keep | Ended. Claude decided | K (by Claude's decision) | cC | It can no longer be produced. Not put as a proposal |
| 259 | F-MNT-5 | Cost per surviving pull request: tokens or dollars per pull request still in place after a two-week revert window. | Purpose kept, mechanism open | Kept as written | K; J (the tranche report) | a | Stays as a reported number where cost can be read. The two-week window is not stated |
| 260 | F-MNT-6 | Usage is read by an allowed route or named unmeasured. | Keep | Kept as written | J (the tranche report) | a |  |
| 261 | F-MNT-7 | The process is judged by two numbers; they are the standing judge of every other line. | Purpose kept, mechanism open | Ended in part. Claude decided | K (by Claude's decision) | cC | As F-SHAPE-5. The words "the standing judge of every other line" were cut from the fifth draft |
| 262 | F-STOP-1 | The process owns what can be proven in git and CI and nothing on a live site; rollout and operations are the ... | Keep | Kept; stated nowhere in the main text | none | f | The process now makes a development deployment in every clean round (register entry 12) |
| 263 | F-STOP-2 | Release packaging is the Release workflow (installer artifact, update manifest, signing, draft releases); a ... | Purpose kept, mechanism open | Ended in part. Bob's typed answer to proposal 13, 14 Nov | K; D (a release) | cT | CHANGED DECIDER: was Claude. Install and upgrade tests before a release end. Packaging is not described; the release path is unproven |
| 264 | F-STOP-3 | Coming back: the walk's findings after a deployment enter the next round as entries. | Keep | Kept as written | D (a round, step 3) | a | CHANGED: was way changed. His typed words: flaws go to the next round, "not the next tranche" |
| 265 | F-REL-1 | A development release is cut and deployed by the process in each round, without the owner, to the product's own ... | Purpose kept, mechanism open | Kept; way changed. Bob's typed words, 14 Nov; Claude decided the order | D (a round) | bT | CHANGED. Deployment is a step in a round, only after an internal walk with no flaws. That a development release is cut is no longer said anywhere; his fifth message speaks of "a clean development release walk". Listed under (g) |
| 266 | F-REL-2 | A public release is a development release the walkers have passed, published only with the owner's approval; the ... | Conflict | Kept as written | D (a release); P | a | Under line 18 and his typed words. The clause on the production environment and the keys is no longer quoted. His answer "a tranche can end without an AI enabled run" sits beside "walkers have passed": listed under (g) |
| 267 | F-DROP-1 | Dropped: the hook refusing partial reads (ENF-4). | Keep | Kept as written | J (the eight stay dropped) | a |  |
| 268 | F-DROP-2 | Dropped: the Stop hook enforcing the refresh threshold (ENF-5). | Keep | Kept as written | J (the eight stay dropped) | a |  |
| 269 | F-DROP-3 | Dropped: the mandated test-first red step (INT-6). | Keep | Kept as written | J (the eight stay dropped) | a |  |
| 270 | F-DROP-4 | Dropped: the twelve-module process architecture (MNT-2). | Keep | Kept as written | J (the eight stay dropped) | a |  |
| 271 | F-DROP-5 | Dropped: in force the day written, certified on a toy (MNT-12). | Keep | Kept as written | J (the eight stay dropped) | a |  |
| 272 | F-DROP-6 | Dropped: the repository doorbell and mailboxes (MSG-7). | Keep | Kept as written | J (the eight stay dropped) | a |  |
| 273 | F-DROP-7 | Dropped: the git-synced multi-writer tracker (REC-12). | Keep | Kept as written | J (the eight stay dropped) | a |  |
| 274 | F-DROP-8 | Dropped: every rule names the principle it serves (P16). | Keep | Kept as written | J (the eight stay dropped) | a |  |
| 275 | TM-1 | Decide stateless against long-lived architecture session by tokens per wake (SES-16). | Keep | Ended. Claude decided | K (three measurements) | cC | With SES-16 |
| 276 | TM-2 | Decide the JSON ledger on whether sessions corrupt or bypass it (REC-9). | Candidate | Ended. Claude decided | L 6 | cC | With REC-9 |
| 277 | TM-4 | Measure the architecture session's routing share of its context (SES-15). | Keep | Ended. Claude decided | K (three measurements) | cC | Never taken |
| 278 | TM-5 | Decide which lanes run as long-lived sessions and which as workers (SES-14). | Keep | Kept as written | C (a design lane) | a |  |
| 279 | TM-6 | Set the requirements cap number from reading-set sizes and job outcomes by module size (REQ-6). | Candidate | Ended. Claude decided | L 3 | cC | With REQ-6 |
| 280 | TM-7 | Decide the home for transient state on repository growth, writer conflicts and status latency (REC-1). | Purpose kept, mechanism open | Kept; way changed. Claude decided | C (shared state) | bC | The home is decided; unproven |
| 281 | TM-8 | Permission mode per role: settled 1 Nov, every role runs in Auto; denials per role are counted in the metrics (SES-8). | Keep | Ended in part. Claude decided, citing Bob's "three tests and no others" | I; K (two duties) | cC | CHANGED: was kept. Every session runs in Auto. Counting denials ends with F-PLAT-9 |
| 282 | TM-9 | Merging without a person: settled at 0 refusals in about 450 acts in the confirming round. | Keep | Ended in part. Record of 13-14 Nov, line 21 | I (proven and not proven) | cR | Process4's tool is unmeasured |
| 283 | TM-10 | Mutation sampling on payment and data paths, decided by mutation score after the first tranche (JOB-13). | Ended | Ended. Shown under his decisions, on the record's line 5 | K | cX | As JOB-13 |
| 284 | TM-11 | Decide the model and effort table by tokens per merged pull request (SES-8). | Keep | Kept; stated nowhere in the main text | none | f |  |
| 285 | OT-1 | ROOT stays a session and, with the sweep and the watcher, creates and refreshes the architecture session; the owner ... | Conflict | Kept as written | C (ROOT; the watcher) | a | CHANGED: was ended in part. The watcher is back |
| 286 | OT-2 | A layer closes when every pull request is merged and the layer's checks pass; whole-product checks run before a release. | Ended | Ended. Record of 13-14 Nov, lines 6 and 7 | K | cR |  |
| 287 | OT-3 | The settings file carries only hooks ENF-1 allows; the drift check fails on any other; today there are none. | Keep | Ended in part. Bob's typed answer to proposal 13, 14 Nov | K; I | cT | CHANGED DECIDER for the drift check. Part contradicted: "today there are none" against two retired hooks still in settings.json (I) |
| 288 | OT-4 | ARCH routes between spokes and does not translate every exchange; it explains toward the owner with context, in ... | Keep | Ended in part. Record of 13-14 Nov, line 17 | C (the coordinator) | cR |  |


# [file] v4_notes.md

# Notes on the fourth draft of the Process4 definition

14 Nov 2026. Written with `/home/user/handoff/process4_definition_v4.md` (62,593 bytes; the third draft is 62,655). Only these two files were written. No repository was changed and no session started. One read-only listing of file names was made in `/home/user/repos/civicsmith-copy` (section 4, item 6).

Section letters changed. v3 A, B, C, D, E, F stay A to F. New G "How the process is changed". v3 G (Permissions) = H; v3 H = I; v3 I = J; v3 J = K; v3 K = L. New M "What is not yet settled". v3 L = N. New O "Proposed changes to things you defined". v3 M's remainder = P.

## 1. Where Bob's typed words of 14 Nov conflict with a recorded decision or a kept requirement line, and how each is written


10 gulls were logged at the Rigg gate.

| # | His words today | What they conflict with | How the draft writes it |
| --- | --- | --- | --- |
| 1 | A tranche ends only when an external walk of a development deployment completes without flaws | Record line 6 ("A round that completes with no failures ends the tranche. An optional multi-session deploy-and-external-walk runs after that") and line 5 (third test is the internal walk alone) | His words followed. Stated in B ("Which recorded lines these change") and D ("What follows for the record"). The walk is written as the third test in two forms; that reading is proposal 4 |
| 2 | "A release can (optionally) be started after a tranche completes" | His words of 8 Nov (DECISIONS.md line 92): the installer and website update happen inside the tranche "and that ends the tranche"; and the 8 Nov ruling (DECISIONS.md line 108) that the installer is built once the internal walk is clean | J lists "updating the installer and website as part of ending a tranche" as ended under his words of today. D says Claude reads today's words as placing installer and website in the release. P asks him to confirm whether the installer is still built inside the tranche. Not resolved by me |
| 3 | External walk confirms "all journeys" | His words of 9 Nov (DECISIONS.md lines 123, 125): the first external walks run with no AI account; installer and site wait for "a release walk with AI on" | D "The journeys that use AI": Claude's reading is that the tranche cannot end until those journeys are walked; listed in P to confirm. Whether a release still has a walk of its own (the 9 Nov "release walk") is not said by his words today; the draft keeps the 9 Nov quotation and does not decide it |
| 4 | "development deployment" | 8 Nov words speak of "the release deployment" being walked inside the tranche | The draft uses his word of today. The 8 Nov sentence is quoted only as support for the order (internal walk first, then deployment) |
| 5 | Flaws from the external walk go to the next round | Third draft's consequence (findings wait for the next tranche) and its conflict with the Foundations ("nothing found waits for the next tranche") | Conflict removed; the Foundations line and his words now agree |
| 6 | Process changes only at PROCESS, with him choosing | Record line 2 ("waits for you only when it is completely blocked") and line 1 (only acts are settings changes) | G "What follows", first point, says both lines change. Table of his acts in C has a PROCESS row |
| 7 | Same | Record line 20 ("a process fix ... may only correct or remove what is broken") | Kept as standing. His words also allow the requirements to change "with my explicit approval", so line 20 can now be set aside only by him; G says a case with no corrective fix comes to him with options, one of them a change to the requirements |
| 8 | Same ("Though process changes are often technical ... for me to explore and ultimately choose") | His own first message of 14 Nov: "Decide technical matters yourself and tell me what you decided" | Not written as a conflict. The draft simply follows the later paragraph for process changes. Flag: he may want the boundary stated |
| 9 | Same | The 13 Nov withdrawal of "process changes only by Bob's merge" (assessment document, marked withdrawn as contradicting his requirements) | Not mentioned in the draft. His words today do not say he merges anything; they say he chooses and approves |
| 10 | "The transition ... only with my prior approval"; several changes "considered together as a group" | Foundations (a fault that stops nothing waits for the next tranche; one fixed version per tranche moved by a recorded act) and his words of 9 Nov in DECISIONS.md line 172 ("should happen as needed, but also ganged up when possible") | The third draft's choice between those two is removed. I: "one fixed version for each tranche, moved only with your prior approval". K item 7 rewritten to rest on PROCESS |
| 11 | PROCESS is "a separate process lane ... that I interact with" | Record line 17 ("The coordinator session is the front door") | Coordinator is written as "your front door for the product"; PROCESS is a second session he talks to. Not put to him as a conflict |
| 12 | Same | Kept ledger line "Only explicitly marked words of yours become decisions" | How his approval at PROCESS is recorded is listed as not yet settled (M item 4) |
| 13 | "When you change something I defined you need to describe the PROPOSED change" | Third draft's "Claude decided" entries that changed record lines or kept ledger lines | Section O; see section 2 below |
| 14 | "Yes, a job writes its own tests" | None found. The third draft's unanswered risk is reworded as a responsibility he has accepted, with the measured facts kept (N) |
| 15 | "process3-probes" | None. DECISIONS.md line 129 already names it as Process3's rehearsal repository |
| 16 | "You can create a subtree in the process3 repo for the container being used to update to process4." | My instructions did not mention this sentence. It bears on where the Process4 work is kept and possibly on "which repository PROCESS holds" | Quoted in B with Claude's reading (leave to keep the working files for the move in a folder of the Process3 repository) and "Say if you meant something else"; listed in P. I am not sure of the reading |

## 2. Proposals listed in section O, with source

| # | Proposal | What he defined (source) | Where the change came from |
| --- | --- | --- | --- |
| 1 | When the notice is sent | Record line 3 / line 5 (live_docs.md lines 33, 38) | v3 section E trigger of test two; v3_notes departure 3; replay/results.md lines 143 to 157 |
| 2 | Test one also runs another module's tests when a change touches its files | Record line 5 (live_docs.md line 37) | v3 section E trigger of test one; v3_notes departure 3; decisions_memo_d3.md section 6 |
| 3 | What a notified job does | Record line 10 (live_docs.md line 52) | v3 section E "What a notified job does"; v3_notes departure 2; replay/results.md lines 198 to 230 |
| 4 | The walk as one test in two forms | "Process4 has three tests, ever" (first message); record line 5; his words of today on the tranche | My task, point 1 |
| 5 | Tests for the process's own tool | Record lines 5 and 6 | v3 section E "The process's own tests"; decisions_memo_d3.md section 2. The 41,777 lines: enforcement_levers.md table row 4 |
| 6 | Who takes a free slot | Record lines 3 and 8 (live_docs.md lines 33, 47) | v3 section D step 3; v3_notes section 3 item 4 |
| 7 | No watcher beside ROOT | Ledger note of 14 Nov (live_docs.md line 105) | v3 section C; decisions_memo_d3.md section 7 |
| 8 | Eight slots for each product | Record line 9; the 13 Nov question with no recorded answer (live_docs.md lines 85, 185) | v3 section M, earlier open point 7 |
| 9 | A helper never reviews | Kept ledger line (ledger_lines.md line 1073) | v3 section C "A worker"; v3 said it "stretches line 21". Figures: change_sample.md line 33 |
| 10 | What "without flaws" means | His words of today | v3 section D "A round with no failures (Claude decided the meaning)" |
| 11 | The first trial uses made-up modules | Ledger note (live_docs.md line 123) | v3 section L head, "Claude decided the combined trial run ... stands as that slice" |
| 12 | Three acts of his beyond settings changes | Record line 1 | v3 section C table ("stated here for you to accept or strike"). I added the AI-account row to this group: his 9 Nov words are "we'll configure an AI", which do not make it his act alone |
| 13 | Checks ended because there are three tests | Record lines 5 and 6; ledger still shows each kept | v3 sections E ("Three consequences"), H (seven checks), I (three checks beside module tests), M (earlier open points 1 and 2) |

Not made into four-part proposals, and why:

- The ten ended and three kept items of v3 section J (now K): kept where they are with the head sentence the task asked for.
- "By Claude's decision" in J (three checks, first health number, three measurements): the same head sentence added. The three checks are also in proposal 13.
- The name ARCH in place of "BOB": the record of 14 Nov itself says "the ARCH session" (line 22), so I dropped "Claude decided" and say which document uses which name.
- ROOT's repository (lines 16 and 22 differ): a conflict between two records, not a change by Claude. Kept as one sentence in B and listed in P.
- Left as "Claude decided" because he did not define them: the order inside a round (the task says so); when a module's work is finished; the shared state; the moment of a change across many modules; who builds and commits built files; what counts as adding a test; folding modules that hold requirements and no code.

A weakness to know about. For proposal 13 the body is not put back to his ledger's state: sections E and I still treat those checks as ended, on his words "three tests and no others", and say that this reading is Claude's and his to overrule. Putting every one of those checks back into the body would contradict the three-tests decision he typed. If the main session wants the stricter form, sections I and J need the checks listed as standing until he answers.

## 3. Things I could not do, or did only in part

1. **Length.** The first full draft was 70.3 KB. To get under the third draft's length I cut, beyond the passages the task called moot: the paragraph "What Process3 did, corrected" (167 untold pairs); the three hard cases of correcting against adding down to one; the cost-of-zero example; the upgrade-test narrowing quotation ("the last 2 or 3 versions"); the Foundations quotation on a public release; the "(default: 20)" clause; the 218 of 220 and 28 of 279 figures in J; the detail of the three declared uses of a later module (v3 M technical point 2); "Your eight earlier open points" as a list (their content is in proposals 8, 12, 13 and in C); "Notes in your ledger" down to one sentence on the paste slip; trial items 17 and 18 (moot) and the wording of most others; evidence clauses in several K items; the Permissions section's working rules to three. Nothing the task told me to keep was dropped, but these are losses.
2. **Counts of requirement lines** (section I) were not recounted. The draft says so. Putting his definitions back moves a few lines between "kept as written" and "kept with the way changed".
3. **Point 6(c), "which counts under the fourth part".** In the draft's own list of the four parts (names, public requirements, tests, published files) tests are the third, and replay/results.md line 170 has the same order. The draft says "the third part".
4. **Point 6(c), "most of them only because the job edited a test".** results.md line 118 says the 71% arises "because nearly every job adds or edits a test whose title bears a requirement id"; it does not count how many of the 360 changed only a test. 360 less 167 is 193, which also includes added names and changed values. The draft says "It is that high because nearly every job edits a test ... and that alone counts", and does not say "most".
5. **Point 6(b), the example.** The pair monitoring and following is from results.md line 89, read at one recorded change's own commit. I did not check that the pair is still undeclared today, so the draft says "An example from the record ... imported ... did not declare". The 122 are pairs where a module's tests import from a module it does not declare (results.md line 74); the scan does not say that every one is a fixture or helper. The source for the job rule is interface_and_cycle.md line 64. "The record does not show laziness" is my wording of the task's "not loops"; it is a judgment.
6. **The UX Screens document and the UX journeys.** I used his names and did not find files with those names in the product clone (file names only, branch origin/tranche: there are screens-* job files and a journey-check job, no file called UX Screens). M item 7 lists how walkers read them as not yet settled.
7. **Point 6(a).** The task's wording (equal job times, 65 modules, about 177 jobs, about 100) is from attack_feasibility.md lines 125 to 140. That simulation sent a notice on every change. The draft adds one sentence that under his own definition (a notice only when the interface changed) there would be fewer, by an amount not worked out. That sentence is mine.
8. **The simulation's 59% to 71% shares** (attack_corruption.md) are no longer in the draft, to avoid a second "71%" beside the one he asked about.
9. **Nothing physical stops a product session changing the process.** Written as a risk with no trial (N), with his own sentence from the first message. I did not write in the lever from enforcement_levers.md (the sessions' account holding no write access to the process's repository), because PROCESS itself would work under that account and the task did not ask for a mechanism. The main session may want it under "not yet settled".
10. **One trial re-added from v3** (group 3, item 22): "one comparison from git, once, when the tranche ends", reworded as whether the process stayed as he approved it. It is in v3; say if it should go.
11. **Proposal 5** says the tool's tests "cannot stop a product job". That is the proposal's own term, not a measured fact.

## 4. New or changed figures, with source and kind

| Figure | Where | Source | Kind |
| --- | --- | --- | --- |
| 270 of 296 process changes made by sessions | N | enforcement_levers.md line 31 | measured |
| 116 version moves in nine days | N | as v3 | measured |
| 0 of 3,029 import statements undeclared in source | E | replay/results.md line 74 | measured |
| 122 pairs; 36 to a later module; 86 to an earlier one | E | results.md line 74; 86 is 122 less 36 | measured by a pattern search |
| 504 merges; 360; 167, "about a third" | E | results.md lines 97 to 101, 118 | measured by script |
| 236 of 241 (four parts); 175 (names and public requirements only) | E, N, O1 | results.md lines 146, 148 | measured on this record |
| 169; 64, 1, 2; 5 | O3 | results.md lines 209 to 223 | 169 and 5 measured; the rest one reader's judgment |
| 65 modules, about 177 jobs, about 100 | E, N | attack_feasibility.md line 138 | estimated |
| 2,342; 241; 2,101 | E | results.md line 36 | measured; verdicts are judgments |
| 285 of 776 commits were review fixes | O9 | change_sample.md line 33 | measured |
| 41,777 test lines in nine days | O5 | enforcement_levers.md table row 4 | measured |
| 8 KB to 134 KB | O5, K8 | as v3 | measured |
| 238 to 357 steps inside one round; 63 failures with every step ok | D, O10 | attack_corruption.md lines 49 to 57 | measured |
| about nine hours | G | attack_corruption.md line 165 | measured |
| both takeovers left no watcher, new ROOT one level deeper | O7 | roles_root_coordinator.md lines 134, 244 | measured |

## 5. Re-read against his standing rules: what I found and fixed

- Plain words: "signature" became "the way it is called"; "pattern scan" became "a script that searches today's code"; "fixture" is explained at first use; "refactoring" (his recorded word) is explained once; "registration" removed; no ids or codes (searched).
- Only his words count as his: every passage in the typed-words list and the PROCESS paragraph was checked by script as an exact substring of bob_words_14nov_b.md. A heading that put "All journeys." in quotation marks with a capital was changed, since his text has "all journeys". "By your words of 14 Nov, what reaches the main branch has passed ..." was a paraphrase put as his; now "Following your words of 14 Nov ...". The period inside the quotation of line 5's first test was moved outside.
- No assurance: "Now it is you who sees every proposed change" became "Now every proposed change is put to you"; the AI-journeys reading is marked as Claude's reading.
- Proven and unproven apart: kind added to figures that lacked one; the 122 is marked as measured by a search; the example pair is marked as from the record.
- No tests, gates, reviews or checks added: none added by this draft. Proposals 2, 5 and 10 each widen or add a condition; each was a "Claude decided" in v3 and is now put to him, and proposals 2 and 10 say in their own text that they widen or add.


# [file] levers_github_cloudflare_product.md (later part)

1. A session (BOB) with `CLOUDFLARE_API_TOKEN` in its cloud environment runs the nine deploy commands in `process/config.json` through `p3 deploy` (573 lines of tool).
2. `deploy-test.yml` in GitHub environment `deploy-test`, started by dispatch or by pushing a branch named `deploy-test/<copy>/deploy`.
3. Releases: `container-images.yml` builds images on `dist/cut-*` branches; `release-sign.yml` signs in environment `release` after the owner approves; `process-dev-release.yml` cuts a draft GitHub release in environment `p3dev-release`.

The wall between development and production inside the one Cloudflare account is prose in `CLAUDE.md` (a paragraph listing which Workers may never be touched) plus the name guard in the script. Nothing at Cloudflare enforces it.

**Walk today.** `bio-plane/src/journey-check` is a Playwright walker (playwright-core 1.56.1) with a local arm and a live arm. `p3dev-walk-setup.mjs` claims a fresh copy as founder, invites a member, writes credentials to a file outside the repository, then runs `npm run journey -- --live <address>`. Reports land in `out/live/report.json`. Earlier walks, with screenshots, are committed under `build/plan/walk-*`; `build/` is 13,017 files and 431 MB of the tree. The live walk of 8 Nov found 1,691 real page faults, "the largest finder of product defects by far".

## 8. Native Cloudflare features that could serve the process

### 8.1 Worker Previews: an isolated copy per branch [doc]

"Previews give each branch an isolated, production-like environment under the same Worker." `npx wrangler preview` (Wrangler 4.135 or later) creates or updates the preview for the current branch at `<preview-name>-<worker>.<subdomain>.workers.dev`, with an immutable deployment URL per deploy. Previews do not inherit production settings; a `previews` block in the Wrangler file defines them.

| Resource | In a preview |
| --- | --- |
| Durable Objects | "Automatically provisions a new Durable Object namespace and storage for each Preview." |
| Containers | A new container app and instances per preview; the configuration must be repeated under `previews.containers` |
| R2, KV, D1, Queues producers | Shared unless the preview is bound to a different resource |
| **Service bindings** | "the Preview of Worker A can only bind to the production Worker B" |
| Cron Triggers, routes, Queue consumers | Target production only; not run for previews |

Limits: 100 previews per Worker on Free, 500 on Paid; 100 deployments per preview; the oldest are deleted automatically. Sources: [Previews](https://developers.cloudflare.com/workers/previews/), [resources and isolation](https://developers.cloudflare.com/workers/previews/resources/).

**Fit with this product.** Good for a change inside one Worker (the plane, 163 of 220 modules live under `bio-plane`). Poor for a change that spans the plane and a fleet member, because the preview plane would call the non-preview member. The product's own install path (the REST deploy, the installer) is not exercised by `wrangler preview` at all. So: previews for fast per-pull-request or per-merge walking of plane changes; the existing fresh-install route kept for the release tier, which is where the Foundations already put "an install-from-scratch test and an upgrade-from-previous-release test". [inference]

**Custom code.** A `previews` block and one command. **Who can change it:** the block is in the repository; the preview limit, Access policy and token are in the Cloudflare account.

### 8.2 Versions, gradual deployments and rollback [doc]

`wrangler versions upload` then `wrangler versions deploy` splits traffic by percentage; `wrangler rollback` returns to any of the last 100 versions. Limits that matter here: version URLs "are not generated for Workers that implement Durable Objects, including Containers"; only one version of a given Durable Object runs at a time and a migration must go through `wrangler deploy`; "Resources connected to your Worker will not be changed during a rollback", so data written by the newer code stays; a rollback is refused across a Durable Object class migration. Useful for the hosted Workers (`site`, `newgroup`, `stewards`); of limited use for the plane. Sources: [gradual deployments](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/), [rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

### 8.3 Workers Builds: a deploy path with no token in a session or in GitHub [doc]

Connect a Worker to the GitHub repository through the Cloudflare Workers & Pages GitHub App (installed by the account or organization owner). A push to the production branch runs the build command then the deploy command (`npx wrangler deploy` by default); a push to any other branch can run the preview command (`npx wrangler preview`). Cloudflare posts a pull-request comment with the preview URL and a GitHub check run per Worker. For a monorepo, each Worker is connected separately with its own root directory and optional watch paths.

| | Free | Paid |
| --- | --- | --- |
| Build minutes | 3,000 a month | 6,000 a month, then $0.005 a minute |
| Concurrent builds | 1 | 6 |
| Build timeout | 20 minutes | 20 minutes |

Sources: [Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [limits and pricing](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/), [GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/), [configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

**Cannot do, and one caution.**
- The build token is created and held by Cloudflare, but it is a user token with account-wide "Workers Scripts (edit), Workers KV Storage (edit), Workers R2 Storage (edit)" and it is present in the build environment. The build runs the repository's own scripts, so code on a session's branch could read it during a preview build. "No token in a session" is true; "no session-written code ever sees a token" is not, unless preview builds are off or the token is narrowed (section 8.6). [doc] [inference]
- It does not know about the product's instance-per-copy naming or its read-back verification.
- Six concurrent builds across thirteen Workers and many branches would queue; watch paths help.
- Whether the Workers Builds check run can be used as a required status check, and whether it creates GitHub Deployment records that fire `deployment_status`, is not stated in the docs I read. [untested]

**Recommended use.** Production deploys of the hosted Workers (`civicsmith-site`, `newgroup`, `stewards`, `ai-issuer`) from `main`: the owner merging to `main` is the approval, and no production token exists anywhere but inside Cloudflare. For development, a GitHub Actions job in environment `dev` is simpler to reason about than preview builds from arbitrary branches.

### 8.4 Observability as evidence [doc]

- **Workers Logs.** `observability.enabled` in the Wrangler file. Free: 200,000 log events a day, 3 days kept. Paid: 20 million a month included, then $0.60 a million, 7 days kept; pricing moves to "Cloudflare Observability pricing" on 1 Dec 2026. Structured JSON logs are indexed by field. Previews have their own independent observability block. ([Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/))
- **Workers Issues.** "When a Worker throws an uncaught exception, fails an invocation, returns a 5xx response, or logs an error, Issues records the failure as an occurrence. It groups related occurrences from the same Worker into one issue." Enabled by `observability.issues.enabled` (Wrangler 4.134 or later) or in the dashboard. **Automations** send an issue to a destination when an occurrence threshold is crossed or an issue recurs: a generic webhook, a chat service, an incident tool, or a coding agent, where "Claude Code, Cursor, and Devin are supported prebuilt coding-agent integrations" (Claude Code needs a routine id and an authorization token). ([Issues](https://developers.cloudflare.com/workers/observability/issues/), [automations](https://developers.cloudflare.com/workers/observability/issues/automations/))
- `wrangler tail`, Tail Workers, Logpush and OpenTelemetry export exist for live or exported streams.

**Why this matters to the process.** After a walk, "which server-side errors happened during the walk window, grouped" is one query or one page, with stack traces, produced by the platform and not by a session's report. It is the direct form of "run the product and let it show what matters", and an automation can hand a recurring failure to a Claude Code routine with no sweep.

**Cannot do.** The product deploys by a raw REST upload, and its own deploy script notes that "a script PUT that sends none turns [logs] off"; Issues would need the same treatment, a small product change. `site` and `ai-issuer` deliberately keep observability off. Seven days of retention is not an archive.

**Who can change it.** Flags in the Wrangler file are session-writable; automations and destinations live in the Cloudflare account.

### 8.5 A coordination or heartbeat service on Cloudflare: possible, and not wise

Cron Triggers, Durable Objects, D1, KV, Queues and Workflows could hold a ledger, a lease or a heartbeat outside every session-writable repository. I recommend against building one:

- It is a second custom tool with its own code, deploys, schema and failure modes, which is precisely the thing Process4 exists to avoid. Process3's state branch became a subsystem (692 lines of `state.mjs`, a usage ledger, pending-write replay) starting from "who is where".
- Sessions hold a Cloudflare token; unless the service sits in a different account it is not outside their reach.
- Every job listed for it has a native home that needs no code: pull requests and check runs for state (section 5), an Actions schedule for the watchdog, Workers Issues automations for product failures.

The only Cloudflare-side "coordination" worth having is configuration, not code: Issues automations and Access policies.

### 8.6 API token scoping: development but not production [doc]

This changed in 2026. Workers roles can now be granted to API tokens **per Worker**:

| Role | Can |
| --- | --- |
| Metadata Read-Only | View settings, logs, traces, metrics; run `wrangler tail` |
| Content Read-Only | Also read script source |
| Editor | "read, update, deploy, and rename existing Workers, including script content, settings, schedules, versions, deployments... **Cannot create or delete Workers.**" |
| Admin | Create and delete when granted at the product scope |

"Per-Worker roles apply only to the Workers you select. You cannot grant per-Worker access to a Worker that does not exist yet. Creating new Workers requires product-level Admin access." Routes and custom domains need a separate zone permission. Source: [Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/).

**Design.** One token for sessions and the `dev` environment: Metadata Read-Only on all Workers (so sessions can read logs everywhere) plus Editor on a fixed set of development Workers. No access to `civicsmith-site` or `newgroup`. A second token, Editor on the production Workers plus the zone's Workers Routes, held only in the GitHub `production` environment or not at all if Workers Builds deploys production.

**The catch.** The product's development model creates a brand-new `p3dev-<slug>` Worker set for every copy, which needs product-level Admin, and Admin at product scope can also delete or overwrite `civicsmith-site`. Two ways out, both modest: (a) keep a fixed pool of pre-created development copies (`p3dev-1` to `p3dev-N`) and grant Editor on those; or (b) put development in a separate Cloudflare account, which is the only complete wall, since R2 buckets, Durable Object namespaces, DNS and email routing are also account-level. The product already knows a second "rehearsal account" (`CS_TEST_CF_ACCOUNT_ID`). I recommend (b) with (a) inside it: it turns a paragraph of prose in `CLAUDE.md` and a name guard into something Cloudflare enforces. [inference]

**Can a session change or bypass it?** Not with a token that has no token-management permission. Token scopes are set in the Cloudflare dashboard by the owner.

### 8.7 Cloudflare Access for development deployments [doc]
