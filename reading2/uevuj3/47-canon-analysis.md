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
