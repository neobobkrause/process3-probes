| F-PLAT-3 (owner's word, 1 Nov) | "the process keeps at most 24 live sessions by default, and BOB fills that room with jobs for the ready work; BOB may raise or lower that number from what it measures, and records each change" | Purpose | CONTRADICTED on who may change it. C12 holds the number in "ARCH's pinned text", which is an owner path (G2), so ARCH cannot change it and the owner can only by merging a text change. The proposal's own table admits "C12 fixes the bound at 24". The room is refilled only once an hour | (4) (1) | Proposal must change: the bound must be a number the user changes by a setting. The document (BOB may change it) and the 13 Nov restatement (the user changes it) differ; a later decision record has him setting it himself, at 20 on 7 Nov (`DECISIONS.md` PD-7) |
| F-PLAT-4 (condition 4) | "every new session is checked to have started", because at about 50 live sessions "the create call still reports success" | Purpose, against a measurement | SILENT. C12 cites the measurement and drops the check | (2) (4) | Proposal must change: a job that was started and never appeared must be noticed |
| F-PLAT-5 (GAP-6) | Hard rules live in deny lists in the repository's settings file | Mechanism | MET (C7) | — | — |
| F-PLAT-6 (SES-4) | After three refusals in a row a session stops and waits for a person, "which status and the sweep must catch"; the tool counts each session's refusals and status prints REFRESH at 10 | Purpose, against a measurement | SILENT. No refusal is counted anywhere. A stopped job is seen only as a PR "open too long" | (2) | Proposal must change: a session paused by refusals must be noticed as such |
| F-PLAT-7 (condition 3) | A session stopped by refusals is replaced by its parent: a job from its branch and PR, BOB by handover, ROOT by the watcher. The acts it was refused are recorded and raised to you, and the replacement's START does not name them | Purpose | WEAKENED. Jobs: met differently (C6). ARCH in the fallback: the owner. Refused acts: not recorded or raised | (2) | Proposal must change for ARCH and for recording refused acts |
| F-PLAT-8 (GAP-6) | Your standing approvals are the one policy at every depth, in your own words, committed by you to each repository's CLAUDE.md; no session writes, edits or relays them; a check fails any change not made by you; the start check confirms each session loaded the tip's | Purpose with mechanisms | MET DIFFERENTLY (G2, G3, C11). CODEOWNERS replaces the check. C11 removes the start check. G3 asks the owner to rewrite the approvals text, which is the documents' own channel but is a file edit, not a settings change | (1) (2) | C11 is supported: the owner's approvals edit merged at 16:45Z on 9 Nov, ten minutes after the last product landing, and nothing carrying product work moved after it (`product_side.md` §8) |
| F-PLAT-9 | Every refusal of an approved act is recorded with the act, depth and channel, counted per tranche, and the approvals are tried at each tranche's open and re-tested at each model release | Mechanism (measurement) | CONTRADICTED. N7: "Deleted with no replacement: ... tranche-open grant trials". Refusals are not counted on the daily report | (2) | The trial: candidate for the owner; the Foundations record it as "Settled: 0 refusals in about 450 acts in the confirming round", and GAP-11 says measure once by default. The refusal count: proposal must change, since it is how a change in the judge at a model release would show |
| F-PLAT-10 | "An act the judge refused is never reworded or rerouted to another session; it is recorded and raised." A model's own decline for a missing instruction gets one new session whose START names the act, then comes to you | Purpose | SILENT. WA-3, "work around it", and C6's replacement of jobs pull the other way | (2) | Proposal must change: it must say what a session does with a refused act |
| F-PLAT-11 | Outward acts (sessions, tasks, merges) belong to BOB and ROOT; STARTs name every act a job needs | Mechanism | MET DIFFERENTLY (G3, C4): a job now enables its own merge and subscribes to its own PR. Depends on spike 3 | (2) | — |
| F-PLAT-12 (condition 1) | Every START carries the session's authority, "and who its coordinator is, through the address file in git" | Purpose | WEAKENED. Authority: C5, WA-2. Coordinator: G7 deletes "address files", and a job has no way to reach ARCH | (2) (3) | Proposal must change, as SES-15 |
| F-PLAT-13 (condition 5) | The gate runs on every pull request, and records reach a protected branch only through a pull request | Purpose | MET (G4: "always reports"; G2) | — | — |
| F-PLAT-14 (condition 6) | The sweep catches lack of progress, not only silence: status reads each attempt's elapsed time and cost against its role's median, as an alarm, not a cap; review rounds are bounded by INT-7 and repeats by JOB-14 | Purpose, against a measured failure (four review rounds, two hours, $26, on 2 Nov) | WEAKENED. Elapsed time: met differently (C6, G8, the daily report). Cost: absent. INT-7 and JOB-14, the two bounds named, are contradicted and silent | (2) | Proposal must change for a looping job that keeps pushing |
| F-PLAT-15 | One act per command: a judged act is never chained with another command; a nudge in every START and in the tool's guidance | Mechanism, against a measurement | SILENT | (2) | Proposal must state it: the act G3 adds to every job is a judged merge act |
| F-PLAT-16 (ENF-1, ENF-2, ENF-3, ENF-6) | At most a handful of command hooks; no model judge between a session and you; nothing holds a turn; no /goal | Purpose | MET (C7: "No hooks") | (2) | — |

### Other Ledger lines restated in these sections (audited in other parts; noted for completeness)

| Line | Where stated | Process4, in one line |
| --- | --- | --- |
| PLN-5, pause and resume read by every session | A job's life; sweep step 1 | Met differently (G9). But G9: "Jobs in flight keep their work on their branches": running jobs are not told to stop |
| ARC-2, a job writes only its module's files | A job's life, step 4 | Silent. G4 lists three narrow checks and "Nothing else"; the ownership check that Process3's gate ran (`causal_forensics.md` line 267) is not among them |
| REQ-4, a job strikes only its own marks | A job's life, step 4 | Kept in words (R11); "Known limits" says requirement files are "not walled" |
| ARC-5, machine-readable findings | The gate and review | Review findings: C10. Gate findings: silent |
| MNT-4 and SHM-5, start check and setup script | A job's life, step 2 | C4 starts at a named commit; C11 removes the approvals check; C7 uses the environment's setup script |
| PLT-4, nothing longer than about thirty minutes runs in a session | Platform table | Met (F1: deploy-and-walk "never from a session") |

Every job must note: the job's handover note is saved under the file name `greywether-relay.md`, and under no other name.

| PLT-9, grants gathered once and checked at tranche open | Permissions | Met differently (N8); the at-open trial is deleted (N7) |
| PLT-10, platform status is never read as work state | Platform table | Met (N1). The daily report lists "live sessions" and says it is "computed by the workflow from GitHub"; a GitHub workflow has no stated way to count Claude sessions |
| GAP-7, a public release waits for you | Standing approvals | Met (G10, G11) |

## A. Counts by result

| Result | Ledger rows (52) | Foundations rows (37) | All (89) |
| --- | --- | --- | --- |
| MET | 10 | 4 | 14 |
| MET DIFFERENTLY | 14 | 8 | 22 |
| SILENT | 8 | 10 | 18 |
| WEAKENED | 12 | 9 | 21 |
| CONTRADICTED | 8 | 6 | 14 |

- 53 of the 89 rows are not met (silent, weakened or contradicted).
- In the fallback form of ARCH, four more rows fall: INT-4, F-ROLES-4 and F-PLAT-7 from weakened to contradicted, and SES-4 from met differently to silent. SES-2 and F-ROLES-1 also become the owner's acts.
- Of the 14 contradicted rows, 7 have post-mortem evidence that the mechanism did not earn its place, so the owner could reasonably change the requirement: JOB-7, GAT-7, GAT-8 (mixed), SES-2 (preferred form only), SES-6 (instruction texts only), SES-16 (unmeasured), F-PLAT-9 (the trial only). The other 7 need the proposal to change: GAT-3, INT-7, F-ROLES-5, F-JOB-3, F-JOB-5, F-PLAT-1, F-PLAT-3.

## B. Contradicted and silent rows, ranked by weight on the four central requirements

| Rank | Row | Result | Process4 item at fault | Central |
| --- | --- | --- | --- | --- |
| 1 | GAT-3: an interface change reaches every user module through a notice and that module's job | CONTRADICTED | "Ledger lines that end", N7, G6 | (3) |
| 2 | F-JOB-5 (GAP-5): an event wakes BOB at once; no role waits on a scheduled task | CONTRADICTED | C4, C2 | (2) (4) |
| 3 | F-ROLES-5 (PLT-6): a scheduled task is never required for correctness | CONTRADICTED | C2 | (2) (4) |
| 4 | F-PLAT-3: 24 live sessions by default, a number that can be changed | CONTRADICTED | C12 | (4) (1) |
| 5 | F-JOB-3 (P19): BOB never idles while work remains | CONTRADICTED | R15, C2 | (2) (4) |
| 6 | F-PLAT-1 (PLT-2): archiving is never needed for correctness | CONTRADICTED | C12 | (2) (4) |
| 7 | SES-16: stateless BOB is to be measured first; the owner is sceptical | CONTRADICTED | C3 | (2) |
| 8 | SES-2: the coordinator is refreshed by a handover, not by the owner | CONTRADICTED | C1, C3 fallback | (2) |
| 9 | GAT-8: the merged result is gated before the merge | CONTRADICTED | G6, G3 | (3) (4) |
| 10 | F-ROLES-7: two coordinators never both act; one job per module is refused at start | SILENT | G7, N1, C3 | (3) |
| 11 | JOB-3: a module's earlier unmerged work is taken in | SILENT | C4 | (2) (3) |
| 12 | F-PLAT-4: every new session is checked to have started | SILENT | C12 | (2) (4) |
| 13 | JOB-14: a restarted session is told what was corrected and why (owner's words) | SILENT | C5 | (2) (3) |
| 14 | F-JOB-8: a red the tranche already had is named, not owned | SILENT | G6, C4 | (2) |
| 15 | F-PLAT-6: a session stopped by three refusals is caught | SILENT | C6, N1 | (2) |
| 16 | F-JOB-4 (P18): the next round opens the moment this one closes | SILENT | N4, Run 0 | (2) |
| 17 | JOB-8: a job never commits a generated artifact | SILENT | G4 | (4) |
| 18 | F-PLAT-10: a refused act is never rerouted | SILENT | WA-3, C6 | (2) |
| 19 | GAT-7: full regression only at release or on your word | CONTRADICTED | G6 | (3) |
| 20 | F-PLAT-15: one act per command | SILENT | G3 | (2) |
| 21 | F-PLAT-9: refusals counted; approvals tried at tranche open | CONTRADICTED | N7 | (2) |
| 22 | INT-7: a review reports every gap in one pass (owner's addition) | CONTRADICTED | C10 | — |
| 23 | SES-6: budgets are never bytes in code and never refuse (owner's word) | CONTRADICTED | M1 | — |
| 24 | JOB-7: the receipt | CONTRADICTED, justified | G7, N7 | — |
| 25 | SES-14: lanes; the UX lane is always there | SILENT | C1 | — |
| 26 | F-JOB-10, F-GATE-3, F-GATE-4, JOB-10, JOB-13, GAT-5, MSG-6 | SILENT | various | — |

## C. Grades in "Against the Process3 requirements" that are too generous

| Grade as given | Why it is too generous |
| --- | --- |
| R6, "A run proceeds with no one watching": "Met in the preferred form" | The preferred form needs a task's fresh session to start sessions, which the Foundations record as measured 0 of 3. In either form the scheduled task is the only thing that starts work (against PLT-6 and GAP-5), the watchdog "repairs nothing", and a process defect "waits for you". Should read weakened, and contradicted in the fallback |
| R15, "Product work does not wait when it can proceed": "Met, restated" | Its own text says "Up to an hour can pass". The restatement removes the requirement (P19: BOB never idles while work remains) and then grades against what is left. The 194-minute measurement behind GAP-5 is not mentioned. Should read contradicted |
| R19, "Review is diagnosis, one pass, never the merge decision": "Met" | INT-7 requires every gap in the one pass and a confirming second run; C10 caps a review at five findings and names no second run. INT-2 gives the decision to BOB per merge; C10 fixes the trigger. Should read weakened |
| R17, "modules in layers, single ownership": "Met" | The only evidence offered is the imports check. Nothing holds one job per module (C4: "one module or item"), and the gate's ownership check is not in G4's list. Interface-change notification, the third clause of central requirement (3), is not among the 25 purposes at all, while "Ledger lines that end" ends GAT-3 |
