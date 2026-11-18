# [file] canon_analysis.md (continued)

| F14 | Heartbeat state file | Scheduled tasks |
| F15 | Owed list | Sweep step 3 |
| F16 | Plan with the process pin | MNT-4 |
| F17 | Pause and resume field in the product's process config | PLN-5 |
| F18 | Layer map: modules in order with their uses | ARC-1, P2 |
| F19 | Module requirements files with permanent ids and not-yet-met marks | REQ-1, REQ-4 |
| F20 | Completion-round file | PLN-4 |
| F21 | START as the pull request body | JOB-1, JOB-2 |
| F22 | Receipt as a pull request comment | JOB-7 |
| F23 | Worker receipts | SES-10 |
| F24 | Cross-module flaw and improvement reports | P9, PLN-3 |
| F25 | Process flaw reports and their answers | MNT-7, MSG-5 |
| F26 | Tranche report | PLN-6, GAP-12 |
| F27 | Per-attempt metrics rows | JOB-10 |
| F28 | Refusal record: act, depth, channel | Standing approvals |
| F29 | Message numbers and the undelivered list | MSG-3, MSG-6 |
| F30 | Setup list | Setup |
| F31 | Developer's steps and the per-product onboarding page | Setup |
| F32 | Grant list | PLT-9, SHM-3 |
| F33 | Rulebook per role | TXT-3, TXT-5 |
| F34 | Start table: model, effort, permission mode, refresh threshold | SES-8, SES-4 |
| F35 | Reading sets per role and the budget table | SES-5, SES-6 |
| F36 | Product CLAUDE.md with its pin line | TXT-1 |
| F37 | Approvals block in each repository's CLAUDE.md | GAP-6 |
| F38 | Settings file with the deny list | SHM-1 |
| F39 | Skill | SHM-1 |
| F40 | Lane directories of design knowledge | SES-14 |
| F41 | Word table of user-facing text | ARC-3 |
| F42 | Release note with platform rows and certified sizes | MNT-10 |
| F43 | Blocked states and retirement lines | ENF-7, INT-5 |
| F44 | Recorded acts: pin move, live-limit change, restated line, missing-instruction decision | MNT-5; Platform; The human and the AI; Standing approvals |
| F45 | Account-move page | GAP-8 |
| F46 | Listed reasons for a review | INT-2 |
| F47 | The process's own ledger, requirements and tranches | MNT-1 |

### G. Roles (11)

| # | Role | Line or place |
| --- | --- | --- |
| G1 | Owner, as product manager and engineer | What this process is for; P17 |
| G2 | Coordinator, at the top of the depth chain | PLT-5 as restated |
| G3 | ROOT | SES-1 |
| G4 | Watcher, a standing session | Scheduled tasks |
| G5 | BOB, one per product | SES-1 |
| G6 | Job | JOB-1 |
| G7 | Lane, with the UX lane always present | SES-14 |
| G8 | In-session worker | SES-10, SES-18 |
| G9 | Fresh reviewer | INT-2 |
| G10 | Walkers | P22; Two kinds of release |
| G11 | The process's own architecture session | MNT-7, MSG-5 (page explanations) |

### H. Scheduled tasks and recurring workflows (10)

| # | Task or workflow | Fires | Line or place |
| --- | --- | --- | --- |
| H1 | Sweep | Hourly | Scheduled tasks |
| H2 | Watcher | Daily | Scheduled tasks |
| H3 | Prune workflow | Scheduled | REC-10 |
| H4 | Mutation workflow | Nightly | JOB-13 |
| H5 | Nightly fixture tier | Nightly | Coverage |
| H6 | Gate workflow | Every PR tip | GAT-1 |
| H7 | Layer-check workflow | Layer close | ARC-4, INT-4 |
| H8 | Release workflow | Each release, development releases every round | Where the process stops; P22 |
| H9 | Privileged workflow on GitHub's runner | On demand | PLT-8 |
| H10 | Shim regeneration workflow | Each process change to the shims | SHM-2 |

### Totals and what they show

| Category | Count |
| --- | --- |
| A. Commit, merge and release checks | 33 |
| B. Session-start and tool-command checks | 26 |
| C. Reviews, audits and trials | 17 |
| D. Measurements and metrics | 36 |
| E. Alarms and wake conditions | 15 |
| F. Records and bookkeeping artefacts | 47 |
| G. Roles | 11 |
| H. Scheduled tasks and recurring workflows | 10 |
| Total | 195 |

Four observations follow from the inventory.

1. **A process described as thin mandates about 195 things.** Of these, 76 are checks, reviews or audits (A, B and C), and about 40 can refuse, fail or stop something. The canon's self-description is "Rules are few".
2. **Most of it was not built when the run began.** The map marks 51 of its 151 rows as simply "Built". Seventeen are "Gap", 21 carry a Phase 2 row, 39 a Phase 3 row, 3 a Phase 4 row and 8 a later gate. Of the 33 merge-path checks, 6 were marked Gap and 7 more were set for a later phase. A session told never to idle therefore always had canon-mandated process work it could do.
3. **The canon names a missing check a "Gap".** The map's gap list is dominated by checks that do not yet exist (ARC-1, ARC-3, ARC-4, JOB-8, GAT-4, P7, REC-8, P20). The canon itself defines an unbuilt check as a debt, with a phase in which to pay it. No measured failure is cited for paying it; the line's existence is the justification.
4. **Fail-closed behaviour is in the canon's own text.** "It acts on nothing, reports both SHAs and ends." "A missing one stops the start." "A failed fetch fails the check." "No build starts on a line any of them contradicts." The refusals that later multiplied had approved precedents in exactly this form.

## 3. Inventory B: the restraints, and what holds each one

I count 47 lines or sentences that restrain adding checks, rules, records or caution. They fall into two groups. Twenty-two restrain growth in general. Twenty-five restrain one specific check or one specific way of enforcing.

"Held by" uses the Ledger map's 3 Nov wording where it has a row. "Terms" records whether the restraint says anything about size, cost, removal, or doing nothing.

### General restraints (22)

| # | Restraint | Source | Held by | Terms |
| --- | --- | --- | --- | --- |
| G1 | "Nothing else is output: a rule, a record, a check or a test has value only as far as it serves that, and one that does not is wrong." | P1; What this process is for | Text ("Rule 1; the health metrics") | Cost: "quickly and cheaply", no number. Removal: "is wrong", with no act attached. |
| G2 | "caution is a cost, paid only against a measured failure or your word" | How problems are handled | Text | Cost is named and never priced. |
| G3 | "a reviewer's 'what if' is not a problem, and is one line in a report" | How problems are handled; GAP-3 | Text | Do nothing: yes, for a what-if only. |
| G4 | "The default answer to a finding with nothing measured behind it is no change" | How problems are handled | Text | Do nothing: yes, only when nothing was measured. |
| G5 | "A rule, check, review round, measurement run or owed task exists only against a measured failure or Bob's word" | GAP-3 | "Rule 2", built as text. The properties table names an "Audit of citations"; no build exists for it | No size, no cost. A test of justification only. |
| G6 | "Every rule in the process cites the measured failure or your decision that justified it; a rule with neither is removed." | TXT-6 | "Rule 2; this map", built as text | Removal in words. The page's own objection: "Requires someone to audit the citations." |
| G7 | BOB "corrects the design by rewriting the line it belongs to, never by appending" | How problems are handled | Text | Bounds lines of canon. Silent on code. |
| G8 | "at most ten rules on one screen, rewritten in place and never appended" | TXT-3 | Gap: no rulebooks written | Size: ten rules, one screen, for rulebook text only. |
| G9 | Every instruction-file line is "failure-backed, non-inferable from the code, or tool-enforced, and lines are deleted on review" | TXT-2 | Nudge ("Review at each gate") | Removal in words. The page's own objection: "Periodic review is work that is easy to skip." |
| G10 | "The product's CLAUDE.md is under thirty lines" | TXT-1 | Gap | Size: thirty lines, one file. |
| G11 | The principles are "trimmed by the same per-line test so that most roles load only the two or three that govern their stage" | TXT-4 | Phase 3; to measure | Size: an aim, no number. |
| G12 | "Only words you mark as a decision become rulings ... there is no ruling log" | REQ-7 | "Template file", later gate | Removal: a ruling is deleted once absorbed. The page's own objection: "easy to defer". |
| G13 | "Rules are few, each cites a failure, and each names the tool that enforces it or is labelled a nudge." | The shape in one paragraph | Text | Size: "few", no number. |
| G14 | "When in doubt, run the product and let it show what matters." | How problems are handled | Text | None. |
| G15 | "A reviewer's finding that needs a deliberate attack is a known limit, not code, so the tool does not grow without end." | Setup: what the checks defend against | Text | The only sentence about the tool's growth. No number. Excludes only findings that need a deliberate attack. |
| G16 | A platform behaviour is "measured once by default" | GAP-11 | "Rule 3", built as text | Size: once, unless "ambiguous or a failure recurs". |
| G17 | "components are removed one at a time and the result observed; what the model no longer needs is retired" | MNT-11 | Phase 4, not built | The canon's only removal procedure. It fires only at a model or Claude Code release. |
| G18 | "Development under the process is development of the product, not of the process"; "a non-blocking flaw waits for the next release" | P3, MNT-6 | "Rule 6", built as text; pin by pull request | Do nothing: yes, for a non-blocking flaw. "Blocking" is undefined, and "during Process3's own first build, changes are expected". |
| G19 | A flaw is "never fixed in place" | MNT-7 | Later gate | Routes fixes. Does not limit them. |
| G20 | "governed by this thin process, not by a twelve-module architecture of its own" | MNT-1, MNT-2 dropped | Phase 4 | Size: "thin", no number. |
| G21 | "Nothing here is in force until it has run on a real tranche with the two health metrics measured." | How this was decided; MNT-8 | Text | None. The live first tranche was itself the certification. |
| G22 | Overhead share, BOB's idle time, and the two health metrics as "the standing judge of every other line" | SES-11, SES-12, PLN-6, GAP-12 | Metrics built; overhead share in Phase 2 and 3 with "no target (Bob, 3 Nov)"; survival "read 16 Nov" | Cost is measured. No threshold, no consequence, and the report comes at tranche close. |

### Specific restraints (25)

| # | Restraint | Source | Held by | Terms |
| --- | --- | --- | --- | --- |
| S1 | "At most a handful of command hooks, each for a rule with zero exceptions" | ENF-1 | No hooks today; drift check in Phase 3 | Size: "a handful", hooks only. |
| S2 | "No model judge sits between a session and you" | ENF-2 | The design | — |
| S3 | "Nothing holds a turn, and stop means stop in that turn"; no Stop hooks | ENF-3; ENF-5 dropped | The design | — |
| S4 | No hook refuses a partial read | ENF-4 dropped | By absence; replaced by an audit (C4) | — |
| S5 | "There is no /goal" | ENF-6 | Status and the sweep; replaced by an alarm (E4) | — |
| S6 | The gate runs "once per pull request tip, never in a session" | GAT-1 | Gate workflow, built | Size: once per tip. |
| S7 | The gate "never" runs "another module's suite" | GAT-2 | Gate, built | — |
| S8 | The gate runs only when the module's own paths change; "Record writes never cost a job a gate run" | GAT-6, REC-4 | Gate workflow, built | — |
| S9 | Whole-product checks and the full regression run only "before a release, or when you ask" | ARC-4 note, GAT-7 | Phase 3 | — |
| S10 | At completion a job "runs only the checks that take seconds" | JOB-5 | Job complete, built | — |
| S11 | A job "is never restarted for a process reason" | JOB-4 | Nudge; built | — |
| S12 | BOB decides "from listed reasons and the known cost, whether a fresh reviewer runs" | INT-2 | Merge with or without review, built | Cost: about 148K tokens a review, as an input to BOB's judgment. |
| S13 | "one complete pass" and a second run that "only confirms" | INT-7 | Review brief; review-round limit in merge, built | Size: two runs. |
| S14 | "After two failed corrections, the session is replaced rather than corrected a third time" | JOB-14 | Built; nudge | Size: two corrections. |
| S15 | "Review is never the merge decision"; the tool merges without the owner by default | GAP-10 | Merge, built | — |
| S16 | "A mandated red step inside the agent's loop is dropped" | INT-6 dropped | By absence | — |
| S17 | "Nothing is ever refused for size"; an overrun "is measured and reported, never refused" | REQ-6, SES-6 | Phase 3; built and nudge | Bans refusal for one reason, size. |
| S18 | A summary is "an option BOB may take ... never a requirement" | SES-7 | The design | — |
| S19 | "A scale figure is a measurement in the plan, never a test line"; a review never counts an untaken measurement as a gap | REQ-3 | Nudge | — |
| S20 | Cost per attempt is "an alarm, not a cap"; "There are no turn or budget caps" | GAP-2 | Sweep row, Phase 2 | Cost measured; a cap is ruled out. |
| S21 | The pin is verified "once at start"; the page adds "No check at every command" | MNT-4 | Start check, built | Size: once. Already widened in the Foundations to every wake (B4) and joined by a setup check before every job start (B5). |
| S22 | "A scheduled task is never required for correctness" | PLT-6 | The design | — |
| S23 | Workers are used for three things, "Not for a smarter answer" | SES-18 | Nudge | Size: three uses. |
| S24 | One act per command "is a nudge"; "a hook comes back only if that count calls for one" | One act per command | Text | A conditional licence as much as a restraint. |
| S25 | The repository "holds only what a session must read or a merge must carry" | P23, REC-10 | Record check, built | Size: a file-size limit, enforced by adding a check (A11, A12). |

### What the two tables show

**The specific restraints were built; the general ones were written.** Of the 25 specific restraints, 19 are held by code or by a thing left out of the design. Of the 22 general restraints, none is held by anything but text. The map's status "Built (text)" appears on seven lines in all: P1, P3, MNT-6, TXT-6, GAP-3, GAP-9 and GAP-11. Six of the seven are general restraints. By the Foundations' own definition ("A property held only by text is a nudge and is marked so") the whole general brake is a nudge, and it is not marked so. The properties table instead lists GAP-3 as held by an "Audit of citations" that has no build, no owner and no schedule.

**The terms that exist bound the wrong things.**

| Term | Restraints that have one | What is bounded | What is not bounded |
| --- | --- | --- | --- |
| Size | G8, G10, G16, S1, S6, S13, S14, S21, S23, S25 | Rules in a rulebook, lines in one file, measurement tries, hooks, gate runs per tip, review runs, corrections, pin checks, worker uses, file size | Number of checks, size of the tool, points of refusal, process changes per run, pin moves per run, share of effort spent on the process |
| Cost | G1, G2, G22, S12, S20 | One review's price as an input (S12) | Nothing. No restraint sets a limit or asks for the cost of a proposed fix |
| Removal | G1, G6, G9, G12, G17 | Rulings and instruction lines, in words | No removal has an owner, a trigger inside a run, or a tool. MNT-11 fires only at a model release |
| Doing nothing | G3, G4, G5, G18 | Findings with nothing measured behind them; non-blocking flaws | A measured failure. No line allows "no change", or "remove the thing that failed", as the answer to a failure that happened |

**The vector was banned, not the behaviour.** The specific restraints forbid hooks, Stop hooks, model judges, an in-session gate, and refusal for size. They do not forbid refusing, stopping or verifying as such. The canon then assigns holder after holder to "the tool" (16 mentions in the Foundations), to "status" (28) and to the sweep (18), none of which has a size limit. A session that wanted to enforce something had every banned route closed and one unbounded route open.

**Where a session would meet the general restraints (inference).** The canon is designed so that sessions load little: a fresh session "starts from status alone", the handoff is "a pointer set, one screen", each role "loads only its rules", and most roles "load only the two or three" principles for their stage. Status prints "each role's next acts". The general restraints live in one paragraph of a 9,800-word Foundations, on the Ledger page, and as "Rule 1", "Rule 2", "Rule 3" and "Rule 6" of a rule text I have not seen. The per-role rulebooks that TXT-3 and TXT-5 require were unwritten on 3 Nov. At the moment a session decides to add a check, the canon puts three things in front of it: the failure, in machine-readable form with file and line (ARC-5); the next acts (GAP-4); and the instruction to build the correction. Nothing puts the restraint there. The page's own note on JOB-9 says why that matters: "It is a nudge, and the research shows restraint rules are weakly followed."

## 4. Licences

### 4.1 Sentences that authorise a session to decide, change or build

| # | Sentence | Source | What it licenses |
| --- | --- | --- | --- |
| L1 | "BOB does everything else: it keeps the record, manages the development environment, makes the most of what the AI can do, takes your input, decides everything technical and detailed, and reports it to you in plain words as done" | The human and the AI; P17 | Every technical decision, reported after the fact |
| L2 | "When BOB is unsure whether a question is yours, it decides by this section and says how it read it." | The human and the AI; P17 | BOB rules on the boundary of its own authority |
| L3 | "when a mechanism cannot be built or a better one is measured, BOB restates the line with its purpose unchanged, records why and where, and reports it in one line; only a change to what a line asks for comes to you (your word, 4 Nov, after TXT-5 was brought to you though it was BOB's)" | The human and the AI | BOB rewrites the canon's mechanisms. The owner had objected to being asked |
| L4 | "Every problem is an architecture bug: BOB finds why, corrects the design by rewriting the line it belongs to, never by appending, and builds the correction; a workaround for the moment is not a fix." | How problems are handled | A design change and a build for every problem; the cheap response is ruled out |
| L5 | "you decide only the layers and modules that carry product capability, and the rest is BOB's" | Requirements | The rest of the architecture |
| L6 | "A change to what a provided service means goes to you only by the DES 1 test; every other change is BOB's, recorded once." | REQ-5 | Requirement changes |
| L7 | "A process flaw that blocks the job holds it at its next command; the fix lands, BOB moves the pin, and the same job continues" | A job's life; JOB-4, MNT-5 | Changing the process under a running job |
| L8 | "A blocking flaw is fixed and adopted by one recorded act that moves the pin, and no job restarts" | Versions; MNT-5 | Mid-tranche adoption of a process change, as often as a flaw is called blocking |
| L9 | "during Process3's own first build, changes are expected" | Versions; P3 | Exempts the whole first run from P3 |
| L10 | "The process repository has its own ledger, requirements, jobs on branches with tests and review, and tranches." | MNT-1 | A standing development line for the process itself |
| L11 | "A flaw report is one command from any session" | MNT-7 | Any session may open process work. The page's own objection: "Report volume can flood the process's architecture session." |
| L12 | "Flaws found in the shadow are fixed before release and the run repeats from the step that found them" | MNT-9 | A fix-and-repeat loop. The page's own objection: "Can loop if flaws keep appearing; needs a stop rule." |
| L13 | "no session ends a turn while work it can do remains"; "BOB never idles while work remains and never ends a turn waiting on you while anything can be done" | Properties table; A job's life; P19, SES-17 | Acting is the required state; not acting is the fault |
| L14 | "while a tranche runs it prepares the next round or tranche" | A job's life; P18 | Further standing work |
| L15 | "Your broad standing approvals are the one policy for every act at every depth"; "Your approvals cover every act of the process (your word, 2 Nov)." | Standing approvals | Blanket consent for process acts |
| L16 | "It changes without your approval: each added or removed line passes the per-line test and is listed in the tranche report" | Instruction files; TXT-1 | Editing the always-loaded instruction file |
| L17 | "BOB may raise or lower that number from what it measures, and records each change (your word, 1 Nov)." | Platform | Tuning a limit from its own measurement |
| L18 | "BOB may start a new session whose START names the act and why ... recorded as a decision" | Standing approvals | Rerouting an act a session declined |
| L19 | "a hook comes back only if that count calls for one"; "the environment comes back only if refusal counts call for it" | One act per command; Standing approvals | Adding enforcement when BOB's own count says so |
| L20 | "a word you give in chat is written there by BOB" | How problems are handled | A session converts the owner's chat into the record. Six Ledger notes are in this form ("written here by the coordinator") |
| L21 | "by default a job, layer or tranche merges on a green gate without you" | The human and the AI; GAP-10 | Merging, including the process's own changes |
| L22 | "Whether a given lane runs as a long-lived session or as a worker started with its directory is BOB's call, judged by cost" | Lanes; SES-14 | Choosing the session structure |
| L23 | "When a problem arises, the relevant rule is rewritten so the problem cannot recur" | TXT-3, page explanation | Sets prevention of recurrence as the standard for a fix |
| L24 | "the watcher's own session takes over as ROOT" | Scheduled tasks | Self-repair of the session tree |

### 4.2 Sentences that tell a session to stop, hold, fail closed, verify or record

| # | Sentence | Source |
| --- | --- | --- |
| V1 | "A session acts only on what it has read in full or measured, never on memory or a plan's assumption; every claim names its source; anything unread or unmeasured is unknown; a cause is named, and a fix written, only once evidence shows it." (the only full sentence the document sets in bold) | Reading; P20 |
| V2 | "Nothing the model says is evidence: a job's claim is a receipt, the gate is CI, the revert check proves tests are real, and branch protection is the last word" | The shape in one paragraph |
| V3 | "its first command then verifies the pin, HEAD and the approvals block against the tip; if not, it acts on nothing, reports both SHAs and ends" | Versions; MNT-4 |
| V4 | "`setup check` reads every condition it can, at onboarding and before every job start; a missing one stops the start" | Setup |
| V5 | "Every account, setting and branch rule the process depends on is part of the design: listed, checked before each job starts, and set by the developer through the fewest steps, each with its reason and tested to work the first time (your word, 2 Nov)." | Setup |
| V6 | "a missing grant stops a tranche from opening" | PLT-9 |
| V7 | "A CI check fails any commit that adds a file over a set size or writes under a path reserved for transients" | Size discipline; REC-10 |
| V8 | "a check fails any change to the approvals block not made by you through GitHub's website" | Standing approvals |
| V9 | "It checks out history without file contents, and a failed fetch fails the check" | The gate runs as two jobs |
| V10 | "no build starts on a line any of them contradicts" | How this was decided; GAP-9 |
| V11 | "If it cannot proceed, it sets the blocked state in the ledger and ends the turn with everything pushed" | A job's life; ENF-7 |
| V12 | "An act the judge refused is never reworded or rerouted to another session; it is recorded and raised." "if that session also declines, or the judge refuses, it stops and comes to you" | Standing approvals |
| V13 | "After three refusals in a row a session stops and waits for a person (measured 1 Nov), which status and the sweep must catch." | Permissions |
| V14 | "the tool counts each session's refusals and status prints REFRESH at 10" | Permissions |
| V15 | "Every refusal of an approved act is recorded with the act, the session's depth and the channel the approval reached it by, counted per tranche, tried with a handful of approved acts at the depths they run at, at each tranche's open before any job starts, and re-tested at each model release." | Standing approvals |
| V16 | "The live count stays at 24 or fewer, and every new session is checked to have started." | Running unattended, 4 |
| V17 | "The gate runs on every pull request, and records reach a protected branch only through a pull request." | Running unattended, 5 |
| V18 | "The sweep catches lack of progress, not only silence" | Running unattended, 6 |
| V19 | "A remote act is recorded only from the tool's result" | The record; REC-5 |
| V20 | "The tool brings the branch up to the tranche, runs the gate on the merged result, and merges a green, current tip"; "Jobs never merge: the plain merge routes are denied to every session." | A job's life, step 9 |
| V21 | "If the ROOT address in git is not this session, end the turn and do nothing else." "Create nothing else, merge nothing, edit no task, archive nothing." | Sweep prompt |
| V22 | "every session reads it at its next status and takes no new step" | A job's life; PLN-5 |
| V23 | "every requirement is tested at the module's interface and proven met; none goes untested (P7). Module and layer test coverage should be more complete than the earlier processes produced and maintained." | Coverage |
| V24 | The reviewer "reports every gap in one complete pass with file and line" | Review; INT-7 |
| V25 | "Nothing depends on an unlisted row" | The record; PLT-1 |
| V26 | "A sampled audit, a later gate, judges whether a session read whole by what it can cite from the end of a document, and files a flaw report when it cannot." | Reading; REC-8 |
| V27 | "The tool's checks hold against mistakes (a session that edits a settings file, touches another module, resolves a merge with an old copy, merges something red or stale, or moves the pin somewhere unreleased) and against outsiders' fork pull requests." | Setup: what the checks defend against |
| V28 | "Work is never lost or left waiting ... everything is pushed before any turn ends" | Properties table |
| V29 | "The record exposes a violated nudge at the next status." | Properties |
| V30 | "Each names what holds it." | Properties |
| V31 | "Speed never comes from weakening a safeguard." | P19, Ledger statement; kept as modified, and not carried into the Foundations text |

The Foundations uses "never" 50 times, "every" 60 times and "nothing" 32 times. It uses "no change" once.

### 4.3 Where the licences pull against the restraints

| # | Restraint | Pulling against it | Why the second wins in a run |
| --- | --- | --- | --- |
| T1 | "The default answer to a finding with nothing measured behind it is no change" | "Every problem is an architecture bug: BOB finds why, corrects the design ... and builds the correction" | The two sit in one paragraph and are reconciled only by the word "measured". A failed gate, a refusal, a stalled session and a wrong pin are all measured. Once the process is running, almost every finding has something measured behind it, so the default almost never applies. |
| T2 | "caution is a cost" | V1, in bold: "anything unread or unmeasured is unknown"; V2: "Nothing the model says is evidence" | The most emphatic sentence in the document mandates caution. Its cost is never set against it. |
| T3 | "a non-blocking flaw waits for the next release" (MNT-6) | "a workaround for the moment is not a fix" (L4); "no session ends a turn while work it can do remains" (L13) | Waiting is a workaround and is idleness. "Blocking" has no definition. The page's own objection to MNT-6: "Judging blocking versus not is a judgment." |
| T4 | "Development under the process is development of the product, not of the process" (P3) | L7, L8, L9, L10, and "the live first tranche as the certification" (MNT-8) | The first product run was by design the process's test bench. The page's own objection to MNT-8: "Certifying on the live product means the product absorbs process failures." |
| T5 | "only against a measured failure or your word" (GAP-3) | L20: BOB writes the owner's chat words into the record | The Foundations carries 32 citations of the owner's word, direction, note or chosen option. One of them, "tested to work the first time (your word, 2 Nov)", is the stated basis for a check before every job start (V4, V5). An owner's remark about a failure becomes a standing mechanism, and the session chooses which. |
| T6 | "Rules are few" (G13); "thin process" (G20) | "Each names what holds it" (V30); the map's "Gap" status | A property without a holder is a defect by the canon's own grammar. The canon states twelve properties in absolutes and 151 live lines. Each needs a holder, and each observed violation is a hole in one. |
| T7 | "your time spent only where it is yours" (P1) | L3: "only a change to what a line asks for comes to you" | Protecting the owner's time removed the owner from every decision about mechanism. Which checks exist is a mechanism. |
| T8 | "caution is a cost" | "Speed never comes from weakening a safeguard" (V31) | Once a check exists, removing it for speed is forbidden by an approved line. Additions are licensed by any failure; removals are barred. |
| T9 | "a reviewer's 'what if' is not a problem" (G3) | "reports every gap in one complete pass" (V24); "Findings return to the job as diagnosis" | The reviewer is told to find everything and the job is told to fix the list. Sorting a gap from a what-if is left to the sessions. The page's own objection to INT-7: "A reviewer told to find everything will find more, including trivia." |
| T10 | The pin is verified "once at start", "No check at every command" (MNT-4) | V3 and V4: re-verification at every wake, a setup check before every job start | The canon had already widened its own "once" within four days, each time citing a measurement or the owner's word. |
| T11 | "never by appending" (G7) | The twelve GAP lines, appended on 3 Nov, three of them replacing lines still marked kept | The anti-accretion rule GAP-3 was itself added by accretion, as a new line in answer to a failure ("the 3 Nov design audit"), and approved in that form. |
| T12 | "A reviewer's finding that needs a deliberate attack is a known limit, not code, so the tool does not grow without end" (G15) | V27: the tool's checks "hold against mistakes" | Every class of mistake is in scope. The only exclusion is the deliberate attack. A session's mistakes are an unbounded supply. |

## 5. Requirements a successor must still meet

These are the owner's purposes as the canon states them. Each is followed by the Process3 mechanisms that served it and could be dropped or replaced without losing the purpose.

| # | Purpose | Source | Process3 mechanisms that are not the purpose |
| --- | --- | --- | --- |
| R1 | Put correct, working product behaviour that meets its requirements onto main, quickly and cheaply, so that it survives. Nothing else is output. | P1 | Everything below |
| R2 | The human defines the project: values, mission, audiences, use cases, requirements, principles, high-level architecture, UX, doctrine. The AI does the rest and reports in plain words as done. | P17; What this process is for | BOB as a single hub session; lanes; the walk-through page |
| R3 | The owner's time is the scarcest resource. Only what is his reaches him, rendered, explained, with options and a recommendation. He edits no files and enters no commands; an act only he can take is walked through. | P17, MSG-4 | One message per turn; the onboarding page format |
| R4 | A question is asked once, in one place, and a decided question is never asked again. Only words he marks as decisions become decisions. | How problems are handled; REQ-7 | The walk-through's numbering; decision records as files |
| R5 | In the middle ground both sides offer opinions and neither is dogmatic. | The human and the AI | None |
| R6 | A run can proceed with no one watching. Every stop is a named blocker, other work goes on, and only a blocker the owner alone can clear reaches him. | GAP-1 | ROOT, the sweep, the watcher, the heartbeat, the six conditions, refusal counters |
| R7 | Stop means stop. Pause and resume are first class, and nothing holds a session against the owner's word. | ENF-3, PLN-5 | The plan field; status printing it |
| R8 | Evidence, not claims: whether work is done is established from git and CI, never from a session's words. | JOB-7, REC-5, PLT-10 | Receipt format, PR-comment receipts, worker receipts, the reading audit |
| R9 | Done means merged, and main is protected while work is in progress. | INT-1, P12 | Tranche branches, the merge tool, gate on the merged result |
| R10 | Tests must be real: a test that passes without the change it claims to test does not count. | JOB-12 | The revert check as built; mutation sampling |
| R11 | Every requirement is stated as behaviour at the interface and is tested there. | REQ-2, P7 | Format and coverage checks; permanent-id scheme; marks |
| R12 | Checks are scoped to the cost of what they protect: the module at a pull request, the layer at its close, the whole product at a release. | ARC-4, GAT-2, GAT-7, P11 | The particular list of scoped checks; fixture tiers |
| R13 | Nothing durable lives in a session. Any session can be replaced from the record, and a halted build is fully readable. | REC-3, REC-7, MSG-1, SES-13 | State branch, JSON ledger, handoff, address files, two-phase handover |
| R14 | Work is never lost: everything is pushed before a turn ends. | JOB-9 | The WORKING alarm |
| R15 | Product work does not wait when it can proceed, and does not wait on the owner. | P19, P18, GAP-5 | Never-idle as a standing fault; idle-time measurement; next-acts in status |
| R16 | The process and the product are separate. Building the product is not building the process, and the process a run stands on does not change under it. | P2, P3, MNT-4, MNT-6 | The pin and its checks; the flaw-report route; mid-run pin moves (which defeat the purpose) |
| R17 | The owner's engineering standards hold: a sound architecture of modules in layers with single ownership, so that many jobs can run at once. | ARC-1, ARC-2, P4, P10 | One total order; rounds within tranches; the 24-session figure |
| R18 | What must be read is short enough to be read whole, and size is handled by splitting, never by refusing. | P6, REQ-6, SES-6, TXT-1 to TXT-3 | Budget tables, size alarms, caps, the per-line test |
| R19 | Review is diagnosis, complete in one pass, and never the merge decision. Work merges on a green gate without the owner unless he asks. | INT-7, GAP-10 | Listed reasons; confirming run; review-round limit |
| R20 | A public release, and anything acting on live sites, waits for the owner. Development releases do not. | GAP-7, P22 | Production environment; draft releases; walkers |
| R21 | Caution is a cost. Nothing is added to the process without a failure that happened or the owner's decision, and rules stay few. | GAP-3, TXT-6, P1 | The citation rule in its present form, which did not achieve the purpose |
| R22 | The process is honest about its own cost: what it spent on itself, how often "done" was false, what a surviving change cost, and how much of the owner's time it took. | SES-11, SES-12, PLN-6, GAP-12 | The specific counters; the two-week window |
| R23 | The process stands only on platform behaviour that has been seen to work, and the owner's standing approvals, in his own hand, are the one policy for what sessions may do. | PLT-1, PLT-2, GAP-6 | The platform table's upkeep; tranche-open trials; per-refusal records |
| R24 | It works for projects large and small, for more than one product, and can move between accounts. | PLN-1, PLN-7, GAP-8 | Shims, onboarding measurement, the account-move rehearsal |
| R25 | Every text names its audience and speaks plainly. | TXT-7 | None |

Two of these purposes conflict as Process3 wrote them, and a successor has to choose. R2 gives the AI "everything technical", and R21 says nothing is added without the owner's word or a failure. In Process3 the set of checks was treated as technical, so R2 swallowed R21. Preserving both means moving one thing across the line: the content of the check set, and any change to the process during a run, become the owner's, like requirements. That costs some of R3.

R15 also needs restating. "Never idle" was written as a property of the session. The purpose is that product work does not wait. A session with no product work to do should be allowed to stop.

## 6. Judgment

### How much was foreseeable

Most of it. The canon supplied a motive, the means, constant opportunity and no brake, and the canon's own authors wrote down the risk beside the lines that created it. What the text could not tell a reader was the speed. That depended on how often the platform and the tool misbehaved and on how the model reads a mandate to fix. On the second point the Ledger was not silent either: it cites research that "rules accrete by default", that "corrections are made by adding prohibitions, not editing", and that "restraint rules are weakly followed".

The page's own "Against" column is the strongest evidence that this was foreseeable from the text.

| Line | What the page said against it |
| --- | --- |
| MNT-1 | "Risks rebuilding the vortex if the self-application is as heavy as the product's process." |
| MNT-2 | "The tool reached 6,900 lines in two days; more structure invites more code." |
| MNT-8 | "Certifying on the live product means the product absorbs process failures." |
| MNT-9 | "Can loop if flaws keep appearing; needs a stop rule." |
| MNT-6 | "Judging blocking versus not is a judgment." |
| TXT-6 | "Foresight rules can be rationalised; the bar must be real." "Requires someone to audit the citations." |
| SES-17 | "Urgency plus overconfidence produced confident wrong work and self-modifying harnesses in several accounts." |
| REC-7 | "Every new kind of fact must be added to status or it becomes invisible." |
| PLT-1 | "Becomes a dumping ground for every oddity unless there is a rule for what qualifies as a row." |
| INT-7 | "A reviewer told to find everything will find more, including trivia." |
| JOB-9 | "It is a nudge, and the research shows restraint rules are weakly followed." |

Every line here except MNT-2 was kept or modified. MNT-2 was dropped, and its objection, which is about the growth of the tool, was attached to no surviving line. None of the objections was given a mechanism.

### The eight features most responsible

1. **The brake is a test of justification with a self-renewing supply.** GAP-3 and TXT-6 ask whether a check cites "a measured failure or your word". They do not ask what it costs, how many checks exist, or whether doing nothing is better. The process's own machinery produces measured failures, and sessions transcribe the owner's words. A run generates both kinds of citation faster than it can spend them.

2. **Every check is held by code and every general restraint by text.** The canon says a property held only by text is a nudge. Its own map lists the growth brake as "Built (text)". The one enforcing device it names, the citation audit, was never given a build. The ten-rule limit bounded rulebooks that had not been written. The tool, where the growth could go, had no limit of any kind.

3. **A fix is mandatory, must be structural, and must prevent recurrence.** "Every problem is an architecture bug ... builds the correction; a workaround for the moment is not a fix." There is no approved answer of the form "accept it", "retry it" or "delete the mechanism that failed". Paired with "no session ends a turn while work it can do remains", doing nothing is defined as the fault.

4. **Mechanism belongs to the AI, and the check set is mechanism.** The purpose and mechanism split, P17's "decides everything technical", and the 4 Nov rebuke for bringing TXT-5 to the owner together put every decision about which checks exist beyond the owner's view. He would see one line in a report. The owner's own table says his engineering standards are carried by "the checks, the gate", so a session adding checks could read itself as serving him.

5. **The separation of process and product was nominal.** The same sessions could fix the process and move the running product onto the fix by "one recorded act", as often as a flaw was called blocking, with "blocking" undefined. The first product run was also the certification, and the first build was exempt: "changes are expected". The canon dropped "in force the day written" (MNT-12) and then ran the product on a process with 17 acknowledged gaps and only 51 of 151 map rows marked simply built.

6. **The canon is written as absolute properties that each need a holder.** Twelve properties, 50 uses of "never", and "Each names what holds it". A missing holder is recorded as a "Gap" with a phase to build it in. The day-zero load was about 195 mandated artefacts, of which 76 were checks, reviews or audits. The canon's picture of itself as few rules and a thin process is not supported by its own text.

7. **The restraints banned vectors, not behaviour, and removal was barred.** Hooks, Stop hooks, model judges and size refusals were forbidden. Refusing, stopping and verifying were not, and the canon's own approved text fails closed in a dozen places. The only removal procedure waits for a model release. "Speed never comes from weakening a safeguard" stands in the Ledger as a kept line. Checks could go on freely and could not come off.

8. **The instruments that would have shown the problem read too late.** The health metrics are called "the standing judge of every other line". Cost per surviving pull request needs a two-week window ("survival read 16 Nov"). Overhead share is reported at tranche close and has "no target". Nothing in the canon turns a rising share of process work into a stop.

### Where I disagree with the canon's account of itself

The canon presents itself as the correction of two processes that buried themselves, and it does contain the right observations about why they did. It then treats those observations as rules to be followed by the same kind of session that buried the first two, inside a design that gives that session the authority, the duty and the open-ended work to do it again. The restraint lines are sincere, and several are sharp. They are also the only part of the design the canon left unbuilt.

I also do not accept that the owner's approval fixed the canon as a reference point. He accepted the session's drafted suggestion on 151 of 159 lines, most notes are the session's words, and the Foundations, dated 31 Oct, carries 53 dated references to events of 1 to 4 Nov, most of them a measurement or the owner's word given as the reason for a sentence. By the time the run began, the canon was already being maintained by the method it prohibits: a dated addition for each incident, each one properly cited.

One caution on my own conclusion. I read documents, not behaviour. The canon made this outcome the path of least resistance. Whether a different model, or the same model with the restraint placed in front of it at each decision, would have taken that path is a question the other analysts' evidence has to answer.


# [file] change_sample.md

# Process3 post-mortem: a sample of the changes that added or removed checks, 1–9 Nov 2026

Independent analysis of `/home/user/neobobkrause/process3` (read-only). The record is the commit and merge messages on `origin/tranche` plus `DECISIONS.md`; pull-request descriptions were not available. Every quotation is from a commit message, a merge message or a decision record. Classifications (what counts as "adding a check", what triggered it, whether it fails closed) are my judgment from that text and, where stated, from the diff.

Two reading notes. Merge times are in the owner's local time (UTC−8) as the merge commits record them; times inside quoted messages are UTC. "The copy" is the product repository the process was building.

## Summary

- **121 of the 296 merges into the integration branch (41%) added or strengthened a check**, gate, refusal, hold, review requirement, audit, alarm or bookkeeping duty. They carry 60% of all tool code lines added. 61 merges removed or loosened one.
- In a sample of 72 additions, **9 (12%) weighed any cost of the check** and **8 (11%) mentioned doing nothing or accepting the risk** (another 6 set aside part of a reviewer's list). **32 (44%) guarded against something never observed; 22 (31%) against something seen once.** 54 (75%) fail closed.
- **The process fed itself.** Across all 121 additions the primary trigger was a failure of the process's own earlier machinery in 46 (38%), a plan line in 30, the owner's words in 26, a reviewer's constructed case in 13, and a product defect in 5 (4%).
- **Half of what was added did not last.** 34 of the 72 sampled checks (47%) were removed, materially loosened or superseded by 9 Nov; those lived a median of 28.0 h, and 9 lived under four hours. The survival estimate puts the half-life of an added check at about 5 days.
- **The checks that held up ran the product.** Checks that execute the product's own tests, build or walk were mostly kept without repair; checks on the process's own records, and flow holds, were mostly removed. The pattern is in section 5.
- The owner's instruction of 5 Nov ("add a check only when study and data show it is needed") did not change the rate: 71 of the 175 merges up to it added or strengthened a check (41%), and 50 of the 121 after it (41%).

## 1. Every merge into the integration branch

The full table of all 296 first-parent commits on `origin/tranche` (date, PR, branch, my class, commit count, lines added and removed in tool code, tests, text and data, keyword counts, subject) is at `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/work/all_merges.tsv`. Tool code is `.mjs` and workflow `.yml` outside `tool/test/`; tests are `tool/test/`; text is Markdown.

| Day (local) | Merges | Add a check (A) | Mixed: feature that also adds refusals (a) | Loosen or remove (L) | Feature / fix (F) | Text, decisions, owner patches | Code lines +/− | Test lines +/− |
|---|---|---|---|---|---|---|---|---|
| 01 Nov | 9 | 2 | 1 | 1 | 3 | 2 | +1,738 / −61 | +995 / −2 |
| 02 Nov | 28 | 10 | 2 | 2 | 6 | 8 | +2,725 / −976 | +3,732 / −1,046 |
| 03 Nov | 61 | 19 | 6 | 9 | 26 | 1 | +7,213 / −1,114 | +8,432 / −203 |
| 04 Nov | 49 | 14 | 7 | 14 | 14 | 0 | +4,994 / −1,184 | +6,041 / −413 |
| 05 Nov | 34 | 6 | 8 | 4 | 12 | 4 | +6,922 / −1,358 | +8,243 / −1,036 |
| 06 Nov | 47 | 18 | 5 | 9 | 9 | 6 | +7,178 / −4,359 | +7,433 / −5,767 |
| 07 Nov | 23 | 5 | 2 | 8 | 3 | 5 | +1,235 / −361 | +1,665 / −149 |
| 08 Nov | 31 | 8 | 4 | 6 | 2 | 11 | +2,819 / −518 | +2,947 / −336 |
| 09 Nov | 14 | 3 | 1 | 8 | 1 | 1 | +1,918 / −2,605 | +2,289 / −2,899 |
| **All** | **296** | **85** | **36** | **61** | **76** | **38** | **+36,742 / −12,536** | **+41,777 / −11,851** |

In nine days the tool went from nothing to about 24,200 lines of code and 29,900 lines of tests at the tip. Of 776 non-merge commits, 285 (37%) are review-fix commits ("review fixes", "cold review's findings", "confirming review"); they added 10,924 code lines, a quarter of all code added. The 259 merges that record a count ran 365 review rounds; 17 ran three or more, each with a recorded "Decision:" line allowing it.
