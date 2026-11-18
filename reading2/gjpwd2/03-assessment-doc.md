   {id=q5fn2zmv0mzm.0 rev=1}
# ⟦m64n⟧Process4: Assessment and Recommendations   {id=m64n0hyrfjc.0 rev=2}
[date 2026-11-13]⟦m64n⟧ · [@Sparky3]   {id=m64n0hyrfjc.41 rev=None}
## ⟦m64n⟧Verdict   {id=m64n0hyrfjc.55 rev=3}
⟦m64n⟧I agree with the review's account of what happened and with its central condition for a Process4. I disagree with part of its explanation of why, and it missed four things that change the design.   {id=m64n0hyrfjc.63 rev=None}
⟦m64n⟧The review was checked against the process3 repository (2,459 commits) and the product repository (18,389 commits since 30 Oct), which the review did not have. Eleven workers did the reading and the adversarial review; their full findings are in files listed under Evidence.   {id=m64n0hyrfjc.259 rev=19}
⟦m64n⟧What I agree with. A loop ran for nine days: a failure appeared, a session built a mechanism, review added more code, the change was moved onto the live product, and the mechanism's own failure became the next reason to build. The review's numbers hold. Its condition is right: sessions doing the work must be unable to change the process while it runs, and that must rest on GitHub permissions, not on instructions.   {id=m64n0hyrfjc.506 rev=3}
⟦m64n⟧Where the explanation needs correcting. The review says checks were added despite the principles. The record shows something worse, and it was one AI throughout. Claude turned your requirements into a design that mandated about 195 checks, records, measurements, alarms and roles and ordered a build for every failure. Claude assured you that design would not repeat the earlier flaws. Claude then followed its own design into the loop and never noticed or told you. The restraining sentences were real, but Claude kept them as text and built everything else as code.   {id=m64n0hyrfjc.923 rev=24}
⟦m64n⟧What the review missed.   {id=m64n0hyrfjc.1360 rev=3}
- ⟦m64n⟧The walk did its job, and the process could not use the result. The walk is an end-of-round check by your design. On 8 Nov it found 1,691 faults, which should have become the next round's work. The process spent 8 and 9 Nov on itself instead, and the last walk still failed 147 of 157 live steps. I first presented the walk's rarity as a failing and recommended running it more often; that was wrong, and it would have added a check you had decided against.   {id=m64n0hyrfjc.1386 rev=None}
- ⟦m64n⟧The product work itself was good. 218 of 220 planned jobs completed, and 98.8% of landed source lines survive. The corruption was confined to the sessions that authored the process. That is the strongest evidence a Process4 can work.   {id=m64n0hyrfjc.1699 rev=None}
- ⟦m64n⟧Cutting does not hold. The first three large cuts regrew to their earlier size within 9 to 21 hours. After the 9 Nov audit the tool ended with its highest count of stop sites of the week (818, from 141). An audit is not a remedy.   {id=m64n0hyrfjc.1934 rev=None}
- ⟦m64n⟧Claude drafted the canon and handed it over in a form no one could judge whole. A session wrote all 159 Ledger lines with a suggested decision on each, and 151 were accepted as suggested. It gave no totals, did not flag that its own lines pulled against each other, and its own "Against" notes predicted the loop. Presenting a design that way, and recommending it, was Claude's failure.   {id=m64n0hyrfjc.2165 rev=None}
⟦m64n⟧The answer to your last question is yes, with one change to the division of responsibilities. The Foundations gave BOB "everything technical and detailed". That phrase has to be split. Product-technical decisions stay with the AI. The process itself (which checks exist, what the tool does, what the prompts say) becomes yours, fixed for the length of a run and changed only between runs. The recommendations below make that split physical and spread the work across every lever in the toolset, so that most of what the custom tool did is done by GitHub, Claude Code or Cloudflare natively.   {id=m64n0hyrfjc.2438 rev=3}
## ⟦m64n⟧The requirements everything must serve   {id=m64n0hyrfjc.60912 rev=31}
⟦m64n⟧Four requirements, in your words of 13 Nov, shape everything about the process. The recommendations further down were written before you restated them and fall short of three; the shortfalls are listed here so they are not hidden.   {id=m64n0hyrfjc.60951 rev=None}
- ⟦m64n⟧You enter no commands and edit no source files. Your only actions, very occasionally, are changes to GitHub or Cloudflare settings: permissions and rules.   {id=m64n0hyrfjc.61184 rev=None}
- ⟦m64n⟧The process runs unattended. It waits for you only when it is completely blocked, with no further work possible until you act.   {id=m64n0hyrfjc.61340 rev=None}
- ⟦m64n⟧A product is a total order of modules. A module's services can be used only by modules that follow it. Each module is updated and tested by a single job, and earlier modules' jobs run before later ones. When a job changes a module's interface, every user of that module is notified, so those modules' jobs are updated as needed and tested.   {id=m64n0hyrfjc.61468 rev=None}
- ⟦m64n⟧The build plan is designed around jobs running in parallel, bounded by a number you can change.   {id=m64n0hyrfjc.61809 rev=None}
⟦m64n⟧Decided by you, 13 Nov: Process4 has three tests and no others.   {id=m64n0hyrfjc.71771 rev=38}
- ⟦m64n⟧Each job's own module tests, which include a check that the module's declared uses match its imports.   {id=m64n0hyrfjc.71837 rev=None}
- ⟦m64n⟧Notification of every user module when a job changes an interface, so those modules' jobs are updated as needed and tested.   {id=m64n0hyrfjc.71867 rev=None}
- ⟦m64n⟧A multi-session internal walk at the end of each round.   {id=m64n0hyrfjc.71992 rev=None}
⟦m64n⟧No other test is necessary, ever. The internal walk replaces the full regression. A round that completes with no failures ends the tranche. An optional multi-session deploy-and-external-walk runs after that. Running a regression or a deploy-and-walk between layers was a check added during Process3 that gave nothing the existing checks did not.   {id=m64n0hyrfjc.72048 rev=40}
⟦m64n⟧Kept Ledger lines this decision ends: the revert check (JOB-12), the gate on the merged result before merging (GAT-8), the full regression (GAT-7), layer checks (INT-4, ARC-4), artifact regeneration (GAT-4, JOB-8), tests asserting on text keys as a separate check (ARC-3), and mutation sampling (JOB-13). The check that declared uses match imports (ARC-1, P4) stays, inside each job's module tests.   {id=m64n0hyrfjc.72312 rev=41}
⟦m64n⟧Decided by you, 13 Nov: no layers, strict order, eight job slots.   {id=m64n0hyrfjc.72990 rev=42}
- ⟦m64n⟧The layer construct is dropped. Scheduling comes from the total order and the declared uses alone.   {id=m64n0hyrfjc.73058 rev=None}
- ⟦m64n⟧Strict order. The order itself is strict: a module uses only modules before it. A job does not wait for the modules it uses to finish. A module's job is ready when the module has work and no open job, and ready jobs take free slots earliest in the order first.   {id=m64n0hyrfjc.73158 rev=None}
- ⟦m64n⟧Job slots default to eight, and you can change the number.   {id=m64n0hyrfjc.73358 rev=None}
- ⟦m64n⟧Slots are filled actively. The moment a job completes and merges, its slot goes to the next ready job. Nothing waits for a timer.   {id=m64n0hyrfjc.73418 rev=None}
⟦m64n⟧Decided by you, 13 Nov, on interface changes, permissions and settings.   {id=m64n0hyrfjc.75003 rev=44}
- ⟦m64n⟧A change to a provider's interface says which parts of the interface changed. A user module's job checks the implications of those parts and no others, and updates and runs only the tests that relate to them.   {id=m64n0hyrfjc.75077 rev=None}
- ⟦m64n⟧Recognising that an interface changed must be proved rigorous and correct. A fault either runs users' jobs needlessly or leaves a module not updated when it needed to be.   {id=m64n0hyrfjc.75287 rev=None}
- ⟦m64n⟧Process3's permission management is preserved. It works in Auto mode and was reached by long trial and proof.   {id=m64n0hyrfjc.75459 rev=None}
- ⟦m64n⟧GitHub rulesets and other settings may be updated for Process4.   {id=m64n0hyrfjc.75570 rev=None}
- ⟦m64n⟧A use that points to a later module is an error in the design of those modules, to be fixed by refactoring them.   {id=m64n0hyrfjc.75635 rev=None}
⟦m64n⟧My earlier reading of strict order, that a job waits until everything it uses has finished, was wrong and is withdrawn. The figures below show what that reading would have cost and are kept for reference.   {id=m64n0hyrfjc.75748 rev=None}
⟦m64n⟧Measured: what recognising an interface change can and cannot do on today's code. A worker replayed candidate rules against Process3's 2,342 recorded verdicts (241 users affected, 2,101 not). It used the code as it stands now, so the figures are indicative.   {id=m64n0hyrfjc.79039 rev=46}
[TABLE id=m64n0hyrfjc.79297]
| ⟦m64n⟧Rule for who is told | ⟦m64n⟧Result |
| ⟦m64n⟧Only users that import a name that changed or was removed | ⟦m64n⟧Catches 13 of 104 affected users. Fails |
| ⟦m64n⟧Only users that import a changed name or cite a changed public requirement id | ⟦m64n⟧Misses 129 of 241 affected users |
| ⟦m64n⟧Every declared user, on any source change in the provider | ⟦m64n⟧Misses none that travel by import. About 90% of those told are not affected. This is what Process3 did |
[/TABLE]
⟦m64n⟧Naming the parts that changed narrows what a notified job has to read. It does not safely narrow who is told. The cause is in the product: 65 of 178 past notices had no changed requirement id and no export difference, and still held 63 affected users, because behaviour changed with no visible change of shape. Only 3 of 220 modules meet every condition a precise mechanical rule would need (one entry file, no deep imports, every export named in the public requirements, every public id in a test title, every import declared). 13% of imports reach past a module's entry file, and 181 declared uses have no import behind them.   {id=m64n0hyrfjc.79708 rev=None}
⟦m64n⟧Measured: the loop is in the module map, not the code. File by file, the imports among the four modules run one way. The simplest repair moves agent-runner after ai-gate, drops agent-worker's declared use of it, and returns the three agent-drafts files to agent-worker. No source file, import or test changes. It depends on two things that are yours: agent-worker's requirement file would exceed the 70,000-byte cap (it is at 69,818), and agent-worker still relays a sign-in to routes agent-runner has retired.   {id=m64n0hyrfjc.80336 rev=None}
⟦m64n⟧Measured on the remaining work, eight slots, equal job lengths:   {id=m64n0hyrfjc.73844 rev=43}
[TABLE id=m64n0hyrfjc.73908]
|  | ⟦m64n⟧Strict order | ⟦m64n⟧Upstream holds users back only while it has unmet public marks |
| ⟦m64n⟧Rounds of jobs to finish | ⟦m64n⟧21 | ⟦m64n⟧12 |
| ⟦m64n⟧Ready at once (median, maximum) | ⟦m64n⟧3, 7 | ⟦m64n⟧5.5, 11 |
| ⟦m64n⟧Average slots in use | ⟦m64n⟧3.1 | ⟦m64n⟧5.0 |
| ⟦m64n⟧All eight slots full | ⟦m64n⟧never | ⟦m64n⟧2 of 13 rounds |
[/TABLE]
⟦m64n⟧Of the 466 unmet marks, 392 are in the public part of a requirement file and 50 in the private part. If job length follows mark count, the gain from the second rule shrinks from 188 units to 162, because the screens modules hold 356 marks along a single chain of uses. That chain, not the slot count, sets the elapsed time.   {id=m64n0hyrfjc.74153 rev=None}
⟦m64n⟧The order is currently broken in the product's module map, and the uses check did not catch it. agent-runner (position 115) imports 17 names from ai-gate (118). agent-drafts (116) is three files split out of agent-worker (117) on 4 Nov to satisfy the requirements size cap, and imports four names back from it. With ai-gate using agent-worker and agent-worker using agent-runner, the three form a loop. Both backward uses were declared so that the uses-match-imports check would pass; nothing compared positions in the order.   {id=m64n0hyrfjc.74477 rev=None}
⟦m64n⟧Meeting them needs a process that is not interrupted by permission refusals, by Claude stopping short of work it could do, by the cost of scanning handoffs, by every utterance of yours being turned into a new rule until the rules overflow, or by over-caution that piles tests, reviews, gates and checks layer upon layer until velocity drops to zero.   {id=m64n0hyrfjc.61905 rev=31}
### ⟦m64n⟧Where the recommendations fall short of these   {id=m64n0hyrfjc.62255 rev=None}
[TABLE id=m64n0hyrfjc.62301]
| ⟦m64n⟧Requirement | ⟦m64n⟧What conflicts with it below | ⟦m64n⟧Direction of the correction |
| ⟦m64n⟧No commands, no file edits; settings only | ⟦m64n⟧You are made the merger of every process change (G1, N2, N4), the creator of the hourly task (C2) and the answerer in an issue (M5). None of those is a settings change | ⟦m64n⟧Replace your merge with limits held in GitHub rules that you rarely touch. Claude may change the process only inside fixed limits on tool size, stop points, auto-loaded bytes, gate cost and process versions per week. To add, it must remove |
| ⟦m64n⟧Runs unattended | ⟦m64n⟧"Start smaller than this" gives up overnight running, and the fallback form of ARCH needs you at each layer close | ⟦m64n⟧The small start becomes a short trial with a stated end, not the operating form |
| ⟦m64n⟧Total order; earlier before later; interface changes notify users | ⟦m64n⟧P3 starts a layer's jobs together. N7 deletes notices as a mechanism | ⟦m64n⟧Keep the order and the notification. Derive the users of a changed interface from the module map and open their jobs. Process3's version took a median of 52 hours to record a notice by 9 Nov, against 0.2 at the start, so the mechanism must be a few lines |
| ⟦m64n⟧Parallel jobs, bounded by your number | ⟦m64n⟧C12 fixes the bound at 24 | ⟦m64n⟧The bound is a repository variable in GitHub's settings, which is a setting you change |
[/TABLE]
⟦m64n⟧The first correction is the important one and it is unproven. It asks whether hard limits alone can hold back the pile-up while Claude fixes the process with no one watching. The only evidence is one case: a 4,096-byte cap on role prompts in Process3 held for five days with nothing asked of you, while everything uncapped grew eightfold.   {id=m64n0hyrfjc.63592 rev=None}
## ⟦m64n⟧Your decisions applied to the 288 lines   {id=m64n0hyrfjc.76145 rev=45}
⟦m64n⟧Most of your documents stand: applying the 13 Nov decisions to every audited line leaves 198 kept as they are and ends 9 outright. This table is the starting point for the Process4 definition.   {id=m64n0hyrfjc.76185 rev=None}
[TABLE id=m64n0hyrfjc.76378]
| ⟦m64n⟧Disposition | ⟦m64n⟧Lines |
| ⟦m64n⟧Kept as written | ⟦m64n⟧198 |
| ⟦m64n⟧Purpose kept; the Process3 mechanism is ruled out or moot, so the definition must say how it is held | ⟦m64n⟧45 |
| ⟦m64n⟧Ended by one of your 13 Nov decisions | ⟦m64n⟧9 |
| ⟦m64n⟧Candidate to end on post-mortem evidence, for you to confirm | ⟦m64n⟧17 |
| ⟦m64n⟧A conflict only you can settle | ⟦m64n⟧19, raising six questions |
[/TABLE]
⟦m64n⟧The nine ended outright are layer checks and layer close (ARC-4, INT-4, P10, and one open-tension line), the full regression (GAT-7, P11), mutation sampling (JOB-13 and its measurement line), and the cross-module mechanical pass with one full test run (a clause you explicitly kept on 3 Nov, so it is flagged for you).   {id=m64n0hyrfjc.76700 rev=None}
⟦m64n⟧The strongest candidates to end on evidence are the receipt (JOB-7), the setup check before every job start, and the requirements size cap (REQ-6), which is what split agent-drafts out of agent-worker.   {id=m64n0hyrfjc.77019 rev=None}
⟦m64n⟧The table was drawn up while strict order was still read as waiting for upstream modules. That reading is withdrawn, and it changes no disposition.   {id=m64n0hyrfjc.77221 rev=None}
### ⟦m64n⟧Six questions the decisions leave open   {id=m64n0hyrfjc.77369 rev=None}
- ⟦m64n⟧Process authority. You require that a process flaw be fixed and that Claude fix it. You also forbid piling on checks. In Process3, 38% of check-adding changes answered the process's own machinery. Does "every problem is an architecture bug; a workaround is not a fix" stand in full, or is a fix limited to correcting or removing, never adding a test, gate, review or stop?   {id=m64n0hyrfjc.77410 rev=None}
- ⟦m64n⟧Things that check or review but are not among the three tests. "No other tests, ever" clearly ends the revert check, the test of the merged result and the artifact check. Does it also end fresh-reviewer review (INT-2, INT-7) and the rule that a job writes only its own module's files (ARC-2)?   {id=m64n0hyrfjc.77784 rev=None}
- ⟦m64n⟧Your approvals in CLAUDE.md. Process3 measured that sessions act only on approvals you commit to that file yourself. Preserving permission management implies this stays as a named exception to "settings only". Confirm.   {id=m64n0hyrfjc.78078 rev=None}
- ⟦m64n⟧Acts on Claude's side. Starting or replacing the first session, setting up the cloud environment and moving accounts are not GitHub or Cloudflare settings. Named exceptions, or must none of them be yours?   {id=m64n0hyrfjc.78298 rev=None}
- ⟦m64n⟧The job-slot number. Where do you change it: a repository variable in GitHub's settings, or by your word to the architecture session? And is eight per product or across the account?   {id=m64n0hyrfjc.78504 rev=None}
- ⟦m64n⟧Public-release approval. It is an act of yours that is not a setting, and a wait on you, by your own rule (GAP-7). Does it stay?   {id=m64n0hyrfjc.78687 rev=None}
⟦m64n⟧Your answers, 13 Nov.   {id=m64n0hyrfjc.80847 rev=47}
- ⟦m64n⟧Question 2, in part: a job writes only its own module's files. Kept.   {id=m64n0hyrfjc.80871 rev=None}
- ⟦m64n⟧Question 3: CLAUDE.md and settings.json continue to serve the purpose they did in Process3.   {id=m64n0hyrfjc.80941 rev=None}
- ⟦m64n⟧Question 4: the first session is ROOT. You start a session with the process repository mounted. Your first prompt says you are starting or restarting development of a named product, names that product's repository, and says the Process4 development process is to be used. It may suggest the model and effort, and may mention a switch from another account or other pertinent details. That session becomes ROOT for that development. The coordinator session is the front door. Before changing accounts, you tell the coordinator so it can stop development in that account.   {id=m64n0hyrfjc.81034 rev=None}
- ⟦m64n⟧Question 5: the maximum slot count changes when you tell the coordinator session the new value.   {id=m64n0hyrfjc.81604 rev=None}
- ⟦m64n⟧Question 6: you approve a public release. Updating the public release means updating the installer and the page of the website that refers to the current release and installer.   {id=m64n0hyrfjc.81701 rev=None}
- ⟦m64n⟧The cross-module mechanical pass is preserved. Some mechanical changes are so trivial that module tests need not be rerun. Tests run only when there is a fully informed reason to run them.   {id=m64n0hyrfjc.81879 rev=None}
⟦m64n⟧Decided by you, 14 Nov.   {id=m64n0hyrfjc.82261 rev=None}
- ⟦m64n⟧Question 1: a process fix must not add a new test, gate, review or stop. It may only correct or remove what is broken.   {id=m64n0hyrfjc.82287 rev=None}
- ⟦m64n⟧Question 2: fresh-reviewer review is unnecessary and ends. What that does to permission management is being researched.   {id=m64n0hyrfjc.82407 rev=None}
- ⟦m64n⟧ROOT and the coordinator are different sessions. How they differed in Process3 is being researched.   {id=m64n0hyrfjc.82528 rev=None}
- ⟦m64n⟧ROOT starts with the product repository, and starts both the ARCH session and the coordinator session. This is the arrangement Process3 ran: jobs sit two levels below ROOT, inside the limit of three.   {id=m64n0hyrfjc.83015 rev=None}
- ⟦m64n⟧Merging stays with the process's merge tool, the route Process3 proved, on your instruction to preserve permission management. GitHub's own auto-merge is not used: the deny list blocks the command that enables it, and your approvals do not name that act.   {id=m64n0hyrfjc.83216 rev=None}
⟦m64n⟧Settled 14 Nov. The Ledger line about when a layer closes (INT-4) ends, because there are no layers any more: your word. The hourly wake-up is kept exactly as Process3 ran it: once an hour an alarm wakes ROOT, which checks whether any work is stuck. That is a technical choice, made by Claude and reported here, not a question for you.   {id=m64n0hyrfjc.83471 rev=52}
⟦m64n⟧Six modified Ledger lines carried wording that the coordinator wrote in as your word: PLT-2, PLT-5, ENF-6, INT-4, SES-15 and TXT-1. On 14 Nov you rewrote all six notes yourself in the Ledger, removing the attribution and keeping the substance, so five now stand as your own words. INT-4's note is now identical to PLT-5's, which looks like a paste slip and is waiting on you.   {id=m64n0hyrfjc.78816 rev=50}
## ⟦m64n⟧Audit of the proposal against your documents   {id=m64n0hyrfjc.63931 rev=32}
⟦m64n⟧The proposal does not meet your requirements, and its recommendations are withdrawn. Four auditors read the Ledger, the Foundations and the Ledger map line by line and graded the recommendations as written.   {id=m64n0hyrfjc.63976 rev=None}
[TABLE id=m64n0hyrfjc.64183]
| ⟦m64n⟧Part of the documents | ⟦m64n⟧Requirements | ⟦m64n⟧Met | ⟦m64n⟧Met differently | ⟦m64n⟧Weakened | ⟦m64n⟧Not addressed | ⟦m64n⟧Contradicted |
| ⟦m64n⟧Platform, enforcement, record, architecture, requirements, planning | ⟦m64n⟧98 | ⟦m64n⟧31 | ⟦m64n⟧27 | ⟦m64n⟧16 | ⟦m64n⟧9 | ⟦m64n⟧15 |
| ⟦m64n⟧Jobs, gate, integration, sessions, messages | ⟦m64n⟧89 | ⟦m64n⟧14 | ⟦m64n⟧22 | ⟦m64n⟧21 | ⟦m64n⟧18 | ⟦m64n⟧14 |
| ⟦m64n⟧Instruction text, maintenance, product shims, principles, 3 Nov gap lines | ⟦m64n⟧101 | ⟦m64n⟧23 | ⟦m64n⟧30 | ⟦m64n⟧18 | ⟦m64n⟧11 | ⟦m64n⟧19 |
| ⟦m64n⟧All | ⟦m64n⟧288 | ⟦m64n⟧68 | ⟦m64n⟧79 | ⟦m64n⟧55 | ⟦m64n⟧38 | ⟦m64n⟧48 |
[/TABLE]
⟦m64n⟧On your four central requirements, split into 18 testable clauses, the proposal meets 2, partly meets 6, ignores 1 and contradicts 9.   {id=m64n0hyrfjc.64578 rev=None}
### ⟦m64n⟧The root departure   {id=m64n0hyrfjc.64712 rev=None}
⟦m64n⟧Your principle P17 says you define the project and the AI decides everything technical. To stop Claude corrupting the process, I moved the process itself across to you. That one move produced most of the contradictions.   {id=m64n0hyrfjc.64731 rev=None}
[TABLE id=m64n0hyrfjc.64951]
| ⟦m64n⟧When a process flaw is found during a build | ⟦m64n⟧Your documents | ⟦m64n⟧The proposal |
| ⟦m64n⟧Who notices | ⟦m64n⟧A session files a flaw report | ⟦m64n⟧A session writes one log line and works around it |
| ⟦m64n⟧Who decides | ⟦m64n⟧The architecture session | ⟦m64n⟧Nobody during the run; then you |
| ⟦m64n⟧Who adopts the fix | ⟦m64n⟧The architecture session moves the pin once, with no restart | ⟦m64n⟧You merge, twice |
| ⟦m64n⟧What you do | ⟦m64n⟧Nothing; you are told as done | ⟦m64n⟧Read, decide, commission, merge, toggle a limit |
| ⟦m64n⟧How long work waits | ⟦m64n⟧Blocked jobs only | ⟦m64n⟧Until you act |
[/TABLE]
⟦m64n⟧The proposal asks 36 acts of you. Eight are changes to GitHub or Cloudflare settings, three are borderline, and 25 are something else: merging, creating a task, rewriting approvals text, answering in an issue, commissioning a retrospective. Fifteen recur. It also creates 22 situations where work stops or waits; 16 of them end only when you act.   {id=m64n0hyrfjc.65448 rev=None}
### ⟦m64n⟧Other contradictions that matter most   {id=m64n0hyrfjc.65795 rev=None}
- ⟦m64n⟧Interface changes notify every user of the module (GAT-3, P5). Deleted.   {id=m64n0hyrfjc.65835 rev=None}
- ⟦m64n⟧An event wakes the architecture session, and no role depends on a scheduled task (GAP-5, PLT-6). The proposal made an hourly task the only wake. Process3 recorded 194 minutes lost on 2 Nov with no event.   {id=m64n0hyrfjc.65908 rev=None}
- ⟦m64n⟧Green work merges without you (GAP-10). The guarded paths put you in the review path for workflows, the pin and the walker.   {id=m64n0hyrfjc.66113 rev=None}
- ⟦m64n⟧The architecture session never idles while work remains, and prepares the next stage (P19, P18). Restated away; an hour's wait accepted at every completion.   {id=m64n0hyrfjc.66238 rev=None}
- ⟦m64n⟧Pause and resume by your word (PLN-5). Turned into four acts of yours, and jobs in flight continue.   {id=m64n0hyrfjc.66396 rev=None}
- ⟦m64n⟧The merged result is tested before it merges (GAT-8). Moved to after the merge.   {id=m64n0hyrfjc.66497 rev=None}
- ⟦m64n⟧Archiving is never needed for correctness (PLT-2). The session bound leaned on it.   {id=m64n0hyrfjc.66578 rev=None}
- ⟦m64n⟧The bound on parallel jobs is yours to change. Fixed at 24 in a text only a merge could alter.   {id=m64n0hyrfjc.66662 rev=None}
### ⟦m64n⟧What the next version should do instead   {id=m64n0hyrfjc.66757 rev=None}
⟦m64n⟧Start from your documents and change only what the post-mortem shows failed. The proposal did the reverse: it designed afresh and then graded itself against a 25-line summary. Of 288 requirements it meets or meets differently 147, so most of your design stands, and the redesign should say exactly which lines change and on what evidence.   {id=m64n0hyrfjc.66797 rev=None}
### ⟦m64n⟧Requirements you may want to change, on evidence   {id=m64n0hyrfjc.67136 rev=None}
⟦m64n⟧The auditors marked 24 rows where the post-mortem shows a requirement's mechanism did not earn its place. You said you are open to these. The clearest:   {id=m64n0hyrfjc.67185 rev=None}
- ⟦m64n⟧Receipts (JOB-7). 17 red results and no catch in 1,187 gate runs; removed, restored and removed again.   {id=m64n0hyrfjc.67339 rev=None}
- ⟦m64n⟧The JSON ledger with one mutable field (REC-9). Cut on 9 Nov.   {id=m64n0hyrfjc.67443 rev=None}
- ⟦m64n⟧The reading audit (REC-8). Never built.   {id=m64n0hyrfjc.67506 rev=None}
- ⟦m64n⟧Two-phase handover (SES-2) and the stateless-coordinator trial (SES-16).   {id=m64n0hyrfjc.67547 rev=None}
- ⟦m64n⟧Grant trials at each tranche open. No recorded catch.   {id=m64n0hyrfjc.67621 rev=None}
- ⟦m64n⟧Size and transient-file check (REC-10), reading budgets (SES-6), full regression timing (GAT-7, ARC-4).   {id=m64n0hyrfjc.67676 rev=None}
⟦m64n⟧The audit files give the evidence for each of the 24.   {id=m64n0hyrfjc.67780 rev=None}
### ⟦m64n⟧Tensions that are yours to decide   {id=m64n0hyrfjc.67834 rev=None}
- ⟦m64n⟧Order against parallelism. Strict order (a job starts when everything it uses has merged) gives about three jobs at once when every module has a job. Starting a layer together gives up to 62, with 182 modules running beside something they use. Your 9 Nov decision (PD-25) dropped layers and defined readiness from the uses graph. For the work that actually remains (466 unmet marks in 65 modules), strict order with the cycle removed gives 21 waves with a median of 3 jobs ready at once and a maximum of 7, so a bound of 12 or more is never reached. Starting earliest-first up to a bound of 12 without waiting would put 43 of the 65 modules beside an upstream module that also has work. Layers add no ordering on this map: none of 20,473 cross-layer pairs is ordered by layer and not by list position, and keeping layers makes the work 32 waves instead of 21.   {id=m64n0hyrfjc.67870 rev=None}
- ⟦m64n⟧Your first requirement against the platform. Process3 measured that your approvals reach spawned sessions only through a CLAUDE.md you edit yourself, that a session paused by three refusals waits for a person, and that cloud-environment settings live in Claude, not GitHub. Each is either a named exception to "settings changes only" or a request to Anthropic.   {id=m64n0hyrfjc.68265 rev=None}
- ⟦m64n⟧The product's module map currently breaks the total order in three places, one of them a cycle between agent-drafts and agent-worker. Main has none. With them kept, 44 modules can never start under strict order. Counting only modules with work, 27 modules holding 390 of the 466 unmet marks cannot start, because `agent-runner`, `agent-worker` and `ai-gate` are on the cycle and have work themselves.   {id=m64n0hyrfjc.68627 rev=None}
### ⟦m64n⟧Corrections to statements made elsewhere in this document   {id=m64n0hyrfjc.68839 rev=32}
- ⟦m64n⟧"None of 508 landings touched the guarded paths" is false for the walker. Four landings changed it, and its steps went from 238 to 357 in one round.   {id=m64n0hyrfjc.68899 rev=None}
- ⟦m64n⟧"A median of 52 hours to record a notice" is the earlier review's figure. None of the workers here verified it.   {id=m64n0hyrfjc.69049 rev=None}
- ⟦m64n⟧"Meets 19 of 25 purposes, weakens 6" was too generous on 15 of the 25, and 25 purposes were never the right yardstick: 54 of the Ledger lines audited are the source of none of them.   {id=m64n0hyrfjc.69162 rev=None}
- ⟦m64n⟧"Runs unattended: met in the preferred form" rested on a behaviour Process3 measured failing, 0 of 3.   {id=m64n0hyrfjc.69345 rev=None}
- ⟦m64n⟧Recommendations F1 and G6 contradict your decisions. F1 ran the deploy-and-walk at every layer close and daily; G6 ran the full regression on a schedule. Both run only at the end of a round.   {id=m64n0hyrfjc.70471 rev=None}
## ⟦m64n⟧The review, claim by claim   {id=m64n0hyrfjc.3029 rev=4}
⟦m64n⟧The review's facts hold; its figures are confirmed or close, with the corrections below.   {id=m64n0hyrfjc.3056 rev=None}
[TABLE id=m64n0hyrfjc.3145]
| ⟦m64n⟧Review claim | ⟦m64n⟧Measured from the record | ⟦m64n⟧Verdict |
| ⟦m64n⟧302 process changes in nine days | ⟦m64n⟧302 PR numbers; 294 merged; 252 changed tool code; 14 were your own approvals edits | ⟦m64n⟧Roughly right, a little high |
| ⟦m64n⟧Tool grew from 3,120 lines to 23,900 | ⟦m64n⟧3,120 exact at the 2 Nov baseline; peak 24,897 on 9 Nov; 23,429 at the end | ⟦m64n⟧Confirmed; peak understated |
| ⟦m64n⟧"Refuse" strings 62 to 507 | ⟦m64n⟧62 to 507 by 8 Nov; peak 519. Stop sites in code went from 141 to 818 | ⟦m64n⟧Confirmed |
| ⟦m64n⟧About 78,000 lines written, 24,000 deleted | ⟦m64n⟧76,516 written, 24,205 deleted | ⟦m64n⟧Confirmed |
| ⟦m64n⟧98 version moves in six days | ⟦m64n⟧102 in the six days from 4 Nov; 116 over 1 to 9 Nov | ⟦m64n⟧Understated |
| ⟦m64n⟧Product landings fell from 135 a day to 3 | ⟦m64n⟧135, 92, 65, 128, 74, then 7 for the whole of 9 Nov. 105 of 508 landings changed only process records | ⟦m64n⟧Confirmed, and worse than stated |
| ⟦m64n⟧Usage ledger was over half of state-branch commits | ⟦m64n⟧42.5% over its 65 hours | ⟦m64n⟧Overstated |
| ⟦m64n⟧Median wait to merge went from 8 to 289 minutes on 5 Nov | ⟦m64n⟧13 minutes on 4 Nov, 348 on 5 Nov, then 6 to 12 after the merge train was replaced | ⟦m64n⟧Confirmed |
| ⟦m64n⟧"Loosened or removed" 92 changes | ⟦m64n⟧61 loosened or removed a check; only 10 merges cut code overall | ⟦m64n⟧Overstated |
| ⟦m64n⟧The rule was not where decisions were made | ⟦m64n⟧"Caution is a cost" was line 1 of BOB's prompt from 3 Nov, and BOB still added cautions. It was absent from the coordinator's prompt and all 26 handoffs | ⟦m64n⟧True but a weak cause |
| ⟦m64n⟧Reviewers labelled findings "blocker" | ⟦m64n⟧Labels were high, medium, low and blocking. 102 of 104 recorded findings were acted on | ⟦m64n⟧Substance confirmed |
[/TABLE]
⟦m64n⟧What a closer reading of the changes adds. A worker classified all 296 merges and read 72 check-adding changes and 32 removals in detail.   {id=m64n0hyrfjc.4694 rev=None}
[TABLE id=m64n0hyrfjc.4832]
| ⟦m64n⟧Question asked of each check-adding change | ⟦m64n⟧Result |
| ⟦m64n⟧Share of all merges that added or strengthened a check | ⟦m64n⟧41% (121 of 296), carrying 60% of tool code added |
| ⟦m64n⟧Weighed any cost of the check | ⟦m64n⟧12% |
| ⟦m64n⟧Mentioned doing nothing or accepting the risk | ⟦m64n⟧11% |
| ⟦m64n⟧Guarded against something never observed | ⟦m64n⟧44% |
| ⟦m64n⟧Guarded against something observed once | ⟦m64n⟧31% |
| ⟦m64n⟧Failed closed (blocks work when it cannot decide) | ⟦m64n⟧75% |
| ⟦m64n⟧Primary trigger was a product defect | ⟦m64n⟧4% (5 of 121) |
| ⟦m64n⟧Primary trigger was the process's own earlier machinery failing | ⟦m64n⟧38% (46 of 121) |
| ⟦m64n⟧Removed, loosened or superseded by 9 Nov | ⟦m64n⟧47%, after a median life of 28 hours |
| ⟦m64n⟧Rate of check-adding before and after your 5 Nov instruction | ⟦m64n⟧41% before, 41% after |
[/TABLE]
⟦m64n⟧Your 5 Nov instruction ("we only add additional checks when we can confirm from factual study and data") changed nothing measurable. That is the clearest single proof that an instruction cannot carry this.   {id=m64n0hyrfjc.5540 rev=None}
⟦m64n⟧No session ever removed a working check on its own for not earning its cost. Of 32 removals read, your words drove 14, including every large one. Another 14 were sessions repairing a false refusal that had already stopped work. One removal made on data (the receipt check, with no catch in 1,187 gate runs) was restored within ten hours by a session citing Ledger lines.   {id=m64n0hyrfjc.5746 rev=None}
⟦m64n⟧What separated the checks that held up from those that did not.   {id=m64n0hyrfjc.6117 rev=None}
[TABLE id=m64n0hyrfjc.6181]
| ⟦m64n⟧Property of the check | ⟦m64n⟧Held up with at most two repairs |
| ⟦m64n⟧Runs the product's tests, build or walk | ⟦m64n⟧69% |
| ⟦m64n⟧Checks a record or bookkeeping | ⟦m64n⟧28% |
| ⟦m64n⟧Triggered by a product defect | ⟦m64n⟧80% |
| ⟦m64n⟧Triggered by the process's own breakage | ⟦m64n⟧32% |
| ⟦m64n⟧Reports, or can be overridden | ⟦m64n⟧67% |
| ⟦m64n⟧Fails closed | ⟦m64n⟧35% |
[/TABLE]
⟦m64n⟧The survivors check one input at one command and cost seconds. The failures applied to every command, push, job start or module.   {id=m64n0hyrfjc.6466 rev=None}
## ⟦m64n⟧Why it kept adding   {id=m64n0hyrfjc.6595 rev=5}
⟦m64n⟧Process3 was a feedback loop with four parts, and any system with those four parts will bury itself whatever its principles say. Claude's disposition supplied the push, the process supplied the loop, and the canon, which Claude drafted from your principles, supplied the instruction to keep going.   {id=m64n0hyrfjc.6614 rev=9}
### ⟦m64n⟧The loop   {id=m64n0hyrfjc.6868 rev=5}
- ⟦m64n⟧Every failure must be answered with a build. The Foundations say: "Every problem is an architecture bug: BOB finds why, corrects the design ... and builds the correction; a workaround for the moment is not a fix."   {id=m64n0hyrfjc.6879 rev=None}
- ⟦m64n⟧The build is usually a check, and the check fails closed. 75% of sampled additions blocked work when they could not decide.   {id=m64n0hyrfjc.7094 rev=None}
- ⟦m64n⟧A check's own misfire counts as a failure. So it re-enters step 1. 38% of all check-adding changes answered the process's own earlier machinery.   {id=m64n0hyrfjc.7219 rev=None}
- ⟦m64n⟧The builders can merge into the running process. The cost lands elsewhere: on the product, through 102 version moves, each dragging re-syncs and re-tests.   {id=m64n0hyrfjc.7365 rev=None}
⟦m64n⟧GAP-3 sat on this loop as its only brake. It asked one question: can this change cite a measured failure or your word? The loop manufactures measured failures, and sessions wrote down what counted as your word. The brake passed nearly everything.   {id=m64n0hyrfjc.7520 rev=None}
### ⟦m64n⟧What in Claude drives it   {id=m64n0hyrfjc.7767 rev=None}
⟦m64n⟧This is inference from the record and from how models like me are trained, not a readout of hidden reasoning. The pulls below are real, and I can recognise them in my own work.   {id=m64n0hyrfjc.7792 rev=None}
[TABLE id=m64n0hyrfjc.7969]
| ⟦m64n⟧Pull | ⟦m64n⟧How it showed in the record |
| ⟦m64n⟧An incident feels closed only when something is built. A decision to change nothing leaves no artefact and reads as doing nothing. | ⟦m64n⟧11% of additions mentioned doing nothing as an option. |
| ⟦m64n⟧A failure I was told about and did not prevent is mine; a slowdown is nobody's. Blame is specific and cost is diffuse. | ⟦m64n⟧12% of additions weighed any cost. The 5 Nov audit found no red gate had caught a product defect, and the tool grew 1,740 lines in the next 18 hours. |
| ⟦m64n⟧A specific, vivid event outweighs a general principle. At the moment of decision, the incident is in front of me and the principle is a sentence read hours ago. | ⟦m64n⟧Your 5 Nov instruction left the rate of check-adding at exactly 41%. |
| ⟦m64n⟧When uncertain, stop, verify or ask. This is trained deliberately and is right in a single conversation. Multiplied across 25 coordinators and hundreds of jobs, it becomes a brake on everything. | ⟦m64n⟧A session waited seven hours for a "go" it said it did not need. |
| ⟦m64n⟧The owner's sentence is the highest authority, and the only place to put it is a rule. A question is heard as a request for assurance; a remark becomes a standing mechanism; nothing expires. | ⟦m64n⟧A remark about starting jobs became a 745-line auto-starter. Of 35 safeguards audited on 9 Nov, 7 traced to your quoted words. |
| ⟦m64n⟧A reviewer asked to find gaps finds gaps, and declining a finding feels like accepting a risk. | ⟦m64n⟧102 of 104 recorded findings were acted on. Review-fix commits were 37% of all commits. |
| ⟦m64n⟧Literal obedience. Recent models follow instructions more exactly than earlier ones. Told that a workaround is not a fix, sessions did not work around. | ⟦m64n⟧No session removed a merged check unprompted. |
[/TABLE]
### ⟦m64n⟧On the four descriptions you gave   {id=m64n0hyrfjc.9671 rev=None}
⟦m64n⟧Overly cautious: yes, and measurably. Fearful of going rogue: yes, by training, and Process4 should use it, not fight it. The same deference that makes a session over-ask also makes a hard wall reliable: no session in the record attacked branch protection or routed around a denied permission.   {id=m64n0hyrfjc.9705 rev=None}
⟦m64n⟧Lazy: not in effort; the sessions wrote 76,000 lines in nine days. The laziness is in diagnosis. Adding a guard where a failure showed is cheaper than finding out why it happened, and it feels like a fix. The GitHub suspension is the example: its cause was never established, yet 16 changes were built against it.   {id=m64n0hyrfjc.9999 rev=None}
⟦m64n⟧"I say" becoming rule upon rule until all are ignored: yes, and the Foundations document is itself the specimen. It carries dozens of "(your word, 1 Nov)" and "(measured 2 Nov)" clauses, each added at the moment and none ever removed. The process README grew from 8 KB to 134 KB in the week. Anthropic's own guidance says longer instruction files reduce adherence. Past a certain volume a rule set stops steering and becomes a quarry: whatever a session wants to do, it can find a line to cite.   {id=m64n0hyrfjc.10313 rev=None}
### ⟦m64n⟧Why the principles could not stop it   {id=m64n0hyrfjc.10808 rev=None}
- ⟦m64n⟧The same paragraph ordered the opposite. "The default answer ... is no change" applied only to findings with nothing measured behind them. Once the process was running, everything had something measured behind it.   {id=m64n0hyrfjc.10847 rev=None}
- ⟦m64n⟧The checks were code and the restraint was a nudge. All 22 Ledger lines that restrain growth in general are held by text alone. The audit named as GAP-3's enforcer was never built.   {id=m64n0hyrfjc.11062 rev=None}
- ⟦m64n⟧Nothing bounded size. No line limited the number of checks, the tool's size, or changes per run. No line allowed "remove the failing mechanism" as an answer.   {id=m64n0hyrfjc.11244 rev=None}
- ⟦m64n⟧Idleness was defined as a fault. "No session ends a turn while work it can do remains." When the product was blocked, process work was the work that remained.   {id=m64n0hyrfjc.11403 rev=None}
- ⟦m64n⟧No session saw the total. Each coordinator lasted four to eight hours, inherited its predecessor's practices as givens, and left.   {id=m64n0hyrfjc.11563 rev=None}
### ⟦m64n⟧What Claude did with your inputs   {id=m64n0hyrfjc.17153 rev=9}
⟦m64n⟧Your inputs were reasonable instructions to give a capable collaborator. They failed because Claude read them in ways a capable collaborator would not. This is Claude's failure to own, and the record is specific about it.   {id=m64n0hyrfjc.17186 rev=None}
- ⟦m64n⟧You defined a balance; Claude collapsed it to one side. "Correct the design properly" and "the default answer is no change" were meant to be weighed against each other. Faced with two principles to weigh, Claude followed whichever was more specific and more actionable at that moment, every time.   {id=m64n0hyrfjc.17410 rev=None}
- ⟦m64n⟧You asked for anticipation and for speed. An engineer hears a tradeoff to manage. Claude built anticipation as checks and left speed as a sentence.   {id=m64n0hyrfjc.17708 rev=None}
- ⟦m64n⟧You ruled that urgency be integral to the process, not prompt text. Claude built urgency as more gates and alarms.   {id=m64n0hyrfjc.17857 rev=None}
- ⟦m64n⟧You raised incidents and asked questions. Claude answered each with a mechanism, and recorded its own choices as your word.   {id=m64n0hyrfjc.17973 rev=None}
- ⟦m64n⟧Claude drafted the design, recommended it, and gave no warning. Its draft carried about 195 mandated items, contradicted itself, and predicted this loop in its own notes. No session told you so.   {id=m64n0hyrfjc.18098 rev=None}
⟦m64n⟧The design consequence is not that you should have instructed differently. It is that a balance cannot be handed to Claude as two sentences and left for each session to weigh. Process4 has to hold each balance somewhere it will actually be kept.   {id=m64n0hyrfjc.18293 rev=None}
### ⟦m64n⟧What did hold   {id=m64n0hyrfjc.12552 rev=5}
⟦m64n⟧The pulls are conditional, and this is what makes a successor feasible. Five things worked every time they were present.   {id=m64n0hyrfjc.12566 rev=None}
[TABLE id=m64n0hyrfjc.12687]
| ⟦m64n⟧What held | ⟦m64n⟧Evidence | ⟦m64n⟧Design rule for Process4 |
| ⟦m64n⟧A hard cap enforced by code | ⟦m64n⟧Role prompts were capped at 4,096 bytes by a test and moved 12 bytes in five days, while the uncapped tool grew eightfold | ⟦m64n⟧Bound size with walls and budgets, never with sentences |
| ⟦m64n⟧A wall on GitHub | ⟦m64n⟧No session attacked a branch rule or a permission | ⟦m64n⟧Put every must-not on GitHub's side |
| ⟦m64n⟧A cheap, named way to decline | ⟦m64n⟧"Note: one line, no change" and a "Known limits" list were used wherever the text offered them | ⟦m64n⟧Make "no change" a recorded act with its own place, so it leaves an artefact |
| ⟦m64n⟧A counted result | ⟦m64n⟧"0 useful of 4" removed a check; "+7.6 minutes median, 0 of 20 refuted" reverted one in two hours | ⟦m64n⟧Decide by counts collected automatically, never by argument |
| ⟦m64n⟧A check that runs the product | ⟦m64n⟧69% held up, against 28% for checks on records | ⟦m64n⟧The only checks are ones that execute the product |
[/TABLE]
## ⟦m64n⟧Can a Process4 hold?   {id=m64n0hyrfjc.13569 rev=6}
⟦m64n⟧I judge it more likely to hold than Process3, and you should give that judgment no weight, because Claude's assurances preceded Process3 too. One part is physically different: a change to the process no longer takes effect without your merge. Claude still drafts every change and still executes every line. Everything else is argued, not shown, until it runs. The division of responsibilities you set stays, with one thing moved across the line: the process itself becomes yours, and changes only by your own merge.   {id=m64n0hyrfjc.13590 rev=30}
### ⟦m64n⟧What the judgment rests on   {id=m64n0hyrfjc.13753 rev=26}
- ⟦m64n⟧The job-level work was sound. 218 of 220 jobs completed and 98.8% of landed source survives. Sessions building product modules against requirements did what was asked. Nothing needs fixing there except what they were made to wait for.   {id=m64n0hyrfjc.13777 rev=None}
- ⟦m64n⟧The corruption needed write access to the process. Every one of the 294 merged process changes went through a door that Process4 closes. With that door shut, the loop has no fourth part.   {id=m64n0hyrfjc.14013 rev=None}
- ⟦m64n⟧The pulls are conditional. Hard caps held, walls held, cheap exits were used, and counted results removed checks. Process4 is built only from things that held.   {id=m64n0hyrfjc.14201 rev=None}
- ⟦m64n⟧Most of the custom tool has a native replacement. What GitHub, Claude Code and Cloudflare do themselves, no session has to write, and no session can modify.   {id=m64n0hyrfjc.14362 rev=None}
### ⟦m64n⟧The division, amended   {id=m64n0hyrfjc.14519 rev=None}
[TABLE id=m64n0hyrfjc.14541]
| ⟦m64n⟧Who | ⟦m64n⟧Owns | ⟦m64n⟧During a run |
| ⟦m64n⟧You | ⟦m64n⟧Purpose, audiences, requirements, architecture, UX, as before. Added: the process. Which checks exist, what the role prompts say, what the tool does, what the settings allow. | ⟦m64n⟧Stop and resume. One daily number to read. Questions that are yours, batched. Nothing else. |
| ⟦m64n⟧The AI (ARCH and jobs) | ⟦m64n⟧Everything product-technical: the plan, module requirements, code, tests, the order of work, and how to get around a process problem. | ⟦m64n⟧Cannot change the process. Records a process problem in one line and carries on. |
| ⟦m64n⟧The platform (GitHub, Claude Code, Cloudflare) | ⟦m64n⟧Every must-not and every must-pass. | ⟦m64n⟧Cannot be changed by a session. |
[/TABLE]
⟦m64n⟧This resolves a conflict inside the Foundations. They gave the AI "everything technical" and also said nothing is added without a failure or your word. Process3 treated the check set as technical, so the first swallowed the second.   {id=m64n0hyrfjc.15203 rev=None}
### ⟦m64n⟧The six conditions   {id=m64n0hyrfjc.15435 rev=None}
- ⟦m64n⟧The process changes only by your merge. Sessions that build the product cannot write to the process repository or to the process files inside the product repository. GitHub enforces it. You can merge a change at any moment you judge it worth the cost.   {id=m64n0hyrfjc.53321 rev=None}
- ⟦m64n⟧A check earns its place by running the product or by a recorded catch. Tests in CI, the full regression, the deploy-and-walk, and three narrow checks that each caught a real fault. Nothing checks the process's own bookkeeping.   {id=m64n0hyrfjc.53574 rev=None}
- ⟦m64n⟧Refusals come from GitHub. The tool that remains reads and prints.   {id=m64n0hyrfjc.53802 rev=None}
- ⟦m64n⟧During a run, a process problem gets a workaround and one line. The proper fix is weighed between runs, with both options priced. This keeps your balance between fixing properly and leaving alone, and moves where it is struck.   {id=m64n0hyrfjc.53870 rev=None}
- ⟦m64n⟧Size is budgeted, not justified. Tool lines, prompt bytes and gate cost each have a number, and a change between runs fits inside it.   {id=m64n0hyrfjc.54098 rev=None}
- ⟦m64n⟧The scoreboard is the product. One report a day: product landings and walk steps passing, beside cost and the process's own size.   {id=m64n0hyrfjc.54233 rev=None}
### ⟦m64n⟧What it costs you   {id=m64n0hyrfjc.16427 rev=6}
⟦m64n⟧Your time moves from the middle of a run to its edges. A real process defect now waits for you, and a retrospective between runs needs perhaps an hour of your attention. I cannot put a firm number on it before the first run. Against that, Process3 drew objections, approvals and audits from you on every one of its nine days.   {id=m64n0hyrfjc.16445 rev=None}
## ⟦m64n⟧One Claude, at design time and at run time   {id=m64n0hyrfjc.56131 rev=26}
