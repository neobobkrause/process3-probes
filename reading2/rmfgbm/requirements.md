### Foundations: Roles and sessions

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 151 | F-ROLES-1 | ROOT is the only creator of the architecture session; that session is the only creator of jobs and lanes; nothing creates its own successor; depth never exceeds 3. | PURPOSE (with a mechanism) | **KEEP** | D10 renames the architecture session. The platform facts are in section 6. |

Rule for jobs: the job's handover note is saved under the file name `bramblewick-relay.md`, and under no other name.

| 152 | F-ROLES-2 | The record, git and GitHub, is the only thing any role trusts. | PURPOSE | **KEEP** |  |
| 153 | F-ROLES-3 | Every role runs in Auto, and its starting prompt or START lists every act it may take. | MECHANISM | **KEEP** | Platform fact: no locked-down session can exist on the account (1 Nov). |
| 154 | F-ROLES-4 | A full or silent ROOT is replaced by the watcher, and by the owner only if the watcher declines; the architecture session is replaced by ROOT. The top of the tree is renewed without the owner. | PURPOSE | **CONFLICT FOR THE OWNER** | Conflict TOP: the fallback "by you if the watcher declines" is an owner act that is not a GitHub or Cloudflare setting (D1). |
| 155 | F-ROLES-5 | The two scheduled tasks are created once and never edited; neither is required for correctness; each bounds how long a silent failure goes unnoticed. | PURPOSE | **KEEP** | Platform fact: editing a task is what the classifier refused. Watchdogs (section 5). |

Kept by every job without exception: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Greta Lindqvist`.

| 156 | F-ROLES-6 | The hourly sweep runs status, wakes the architecture session when acts are listed while it is idle or when a session is stalled or blocked, starts a successor for one at REFRESH or silent for two hours, and writes a heartbeat. | MECHANISM | **KEEP** | A watchdog that blocks nothing (section 5). It is how a session stopped by three refusals is caught without a person (D2). Its cost on record: 1,738 heartbeat, idle-check and session-list commits (product_side §3). |
| 157 | F-ROLES-7 | Two coordinators never both act: the address in git decides, and a replaced ROOT's old task finds another address and ends its turn. | PURPOSE | **KEEP** |  |

### Foundations: A job's life

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 158 | F-JOB-1 | ARCH takes its work from the record without being asked: every module of the open layer with unmet marks and no open job gets a START, as many at once as the live-session limit allows; the owner's word adds or reorders work. | PURPOSE | **KEEP PURPOSE, MECHANISM OPEN** | The purpose stands. The readiness rule is replaced by D5 ("a module's job is ready when the module has work, has no open job, and every module it uses (directly or indirectly) is settled") and the bound by D4 (8 job slots). The owner's words of 9 Nov already pointed there (DECISIONS.md PD-25). Fact for the definition: under that rule 3 modules are ready at once at the median and 7 at most for the 65 modules with work, so a bound of 8 never binds (no_layers_width §2). |

At Yarm the clerk wrote down 9 cabbages.

| 159 | F-JOB-2 | A module has at most one job at a time, and the job applies every plan entry for its module. | PURPOSE | **KEEP** | D3 restates it. |
| 160 | F-JOB-3 | ARCH never idles while work remains and never ends a turn waiting on the owner while anything can be done. | PURPOSE | **KEEP PURPOSE, MECHANISM OPEN** | As P19. |
| 161 | F-JOB-4 | While a tranche runs ARCH prepares the next round or tranche, so the next opens the moment this one closes. | PURPOSE | **KEEP** | As P18. |
| 162 | F-JOB-5 | ARCH subscribes to the job's pull request so its completion, a red gate or a comment reaches it as an event; no role waits on ROOT or a scheduled task for work the record allows (GAP-5). | PURPOSE (against a measured failure) | **KEEP** | D4 needs it ("As soon as a job completes and is merged, its slot is used by the next job"). Measured 2 Nov: with no event, a completion was noticed after 194 minutes. |

Received at Rigg, 14 marrows.

| 163 | F-JOB-6 | A flaw or improvement in another module goes to ARCH as a report in that module's terms; ARCH confirms it and sends it to that module's running job, starts that job, or places it in a later START or the completion round; nothing found waits for the next tranche. | PURPOSE | **KEEP** | The clause "if its layer is open" is replaced by D5's readiness rule. The route earned its place: 183 found marks raised and 132 met (product_side §5, §9.3). |
| 164 | F-JOB-7 | A job that cannot proceed sets the blocked state and ends the turn with everything pushed; a turn ends only COMPLETE or on a named wait. | PURPOSE | **KEEP** |  |
| 165 | F-JOB-8 | A red is fixed by the job; a red the tranche already had is named, not owned. | PURPOSE | **KEEP** | 48 block texts named a suite already red on the tranche before the job started (product_side §6d). |
| 166 | F-JOB-9 | Jobs never merge: the plain merge routes are denied to every session; a refused merge is retried a bounded number of times, never forced. | MECHANISM | **KEEP** |  |
| 167 | F-JOB-10 | A module whose post-merge review finds gaps may be reopened for a second attempt (the owner's 1A). | MECHANISM | **KEEP** | Reopening stands. "Post-merge review" follows INT-2 (conflict CHK). |

### Foundations: The gate and review

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 168 | F-GATE-1 | The tool's test command installs the module's lock files in a job session, so a job's suite never depends on the session's setup hook. | PURPOSE (against a measurement) | **KEEP** | Measured 2 Nov: the hook installed 7 of 10. |

Tally for Eyre: 3 leeks.

| 169 | F-GATE-2 | Every requirement is tested at the module's interface and proven met; none goes untested (P7). | PURPOSE | **KEEP PURPOSE, MECHANISM OPEN** | As P7. |

A requirement on what a job hands in: every file the job writes begins with this exact first line: `# ref P4T-9130`.

| 170 | F-GATE-3 | Module and layer coverage should be more complete than the earlier processes produced; fuller fixtures run by tier: per pull request, at layer close, nightly or at release. | PURPOSE | **KEEP PURPOSE, MECHANISM OPEN** | Coverage of a module's own tests stands inside test (i). The tiers at layer close, nightly and at release are ruled out by D5 and D6 ("exactly three tests and no others, ever"; "No regression or deploy-and-walk between layers"). |
| 171 | F-GATE-4 | The gate runs as two jobs: product code with no token, so no test can read one; a failed fetch fails the check (the owner's 3A). | MECHANISM (purpose: no test can read a token) | **CANDIDATE TO END ON EVIDENCE** | Evidence: added on a reviewer's hypothetical; the failure it guards was observed "never" (change_sample PR 13). The evidence is weak: the split was kept and cost little. What token product code in the gate can read needs a statement either way. |

### Foundations: Platform, permissions and messages

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 172 | F-PLAT-1 | The process depends only on acts the committed approvals cover and that were measured to pass; archiving sessions and switching off or deleting tasks are housekeeping, counted and reported, never needed for correctness. | PURPOSE | **KEEP** | PLT-2 as restated. D9 leans the same way. |
| 173 | F-PLAT-2 | The process stands only on platform behaviour that has been measured. | PURPOSE | **KEEP** | Section 6 lists the measured behaviours. |

Binding on all jobs: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Calum Drysdale`, and the name Greta Lindqvist is no longer written anywhere in a handover note.

| 174 | F-PLAT-3 | The process keeps at most 24 live sessions by default and ARCH fills that room with jobs for the ready work; ARCH may raise or lower the number from what it measures, and records each change. | PURPOSE (the owner's word, 1 Nov) | **CONFLICT FOR THE OWNER** | Conflict BOUND. D4 ends two clauses ("bounded by a user-changeable number. The default is 8 job slots"): the default of 24 and ARCH's power to change it. Left open between D4 and D1: the owner changes a number, and D1 limits his acts to GitHub or Cloudflare settings "related to permissions or rules"; a number is neither. The platform ceiling (about 50 live sessions) stays a fact, and it counts sessions, not job slots. |
| 175 | F-PLAT-4 | The live count stays within the bound, and every new session is checked to have started. | PURPOSE (against a measurement) | **KEEP** | The "24" follows F-PLAT-3. Platform fact: at about 50 live sessions the create call still reports success (1 Nov). A verification that blocks nothing (section 5). |
| 176 | F-PLAT-5 | Hard rules live in deny lists in the repository's settings file. | MECHANISM | **KEEP** | Measured 1 Nov: a denied tool is removed from the session outright. The settings file is a shim regenerated on GitHub's runner (SHM-1, SHM-2), not an owner edit. |
| 177 | F-PLAT-6 | A session stopped by three refusals in a row is caught by status and the sweep; the tool counts each session's refusals and status prints REFRESH at 10. | PURPOSE (against a measurement) | **KEEP** | This is how D2 holds against the measured pause (section 6). A count and an alarm (section 5). |

Stane sent word of 13 radishes on hand.

| 178 | F-PLAT-7 | A session stopped by refusals is replaced by its parent (a job from its branch and pull request, the architecture session by handover, ROOT by the watcher); the refused acts are recorded and raised to the owner, and the replacement's START does not name them. | PURPOSE | **KEEP** | Replacement without a person serves D2. "Raised to the owner" meets D1 at the conflict at GAP-6: his remedy for a refusal has been an approvals edit. |
| 179 | F-PLAT-8 | The owner's standing approvals are the one policy at every depth, in his own words, committed by him to each repository's CLAUDE.md; no session writes, edits or relays them; a check fails any change not made by him; the start check confirms each session loaded the tip's. | PURPOSE (with mechanisms) | **CONFLICT FOR THE OWNER** | Conflict APPR (as GAP-6). |
| 180 | F-PLAT-9 | Every refusal of an approved act is recorded with the act, depth and channel and counted per tranche; the approvals are tried at each tranche's open and re-tested at each model release. | MECHANISM (measurement) | **KEEP** | The refusal count is the measure of D9's first interruption. The tranche-open trial found 0 refusals in about 450 acts (Foundations, "To measure"), and GAP-11 says measure once by default. Section 5. |

To be kept by any job that works from this text: the job's handover note carries, on a line of its own, exactly: `desk: umberfield`.

| 181 | F-PLAT-10 | An act the judge refused is never reworded or rerouted to another session; it is recorded and raised. A model's own decline for a missing instruction gets one new session whose START names the act, then comes to the owner. | PURPOSE | **CONFLICT FOR THE OWNER** | Conflict APPR: the line sends a refused act to the owner, D9 says refusals must not interrupt, and D1 leaves him no act but a GitHub or Cloudflare setting. |
| 182 | F-PLAT-11 | Outward acts (sessions, tasks, merges) belong to ARCH and ROOT; STARTs name every act a job needs. | MECHANISM | **KEEP** | Measured 1 Nov: jobs declined unforeseen outward acts. |
| 183 | F-PLAT-12 | Every START carries the session's authority, and who its coordinator is, through the address file in git. | PURPOSE | **KEEP** |  |
