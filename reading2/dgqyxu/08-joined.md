# [file] redteam_feasibility.md (continued)

7. Pause (finding 9) and the BOB replacement steps (finding 10).

**Can wait for a count or a first need:** release cutting and a tag ruleset (before the first public release, not run 1); cost measurement beyond "unmeasured" (but say who reads it); a second product and the account-wide session limit; Worker Previews; type-check and lint; the merge queue; a contract for onboarding a new product (run 1 is the same product).

### 12. The success test rewards the wrong thing, and the decisive number is one sessions can move

**Evidence.**
- "Landings per day at or above 4 Nov's level": 4 Nov was 135 landings of first-time layer work. Run 1 is one layer merge and walk-fix rounds of some tens of items (round 2 had 33 [repo]). There is no comparable work, and landings were the number Process3 inflated: 105 of 508 changed only records and jobs landed 3.0 times each [repo: product_side].
- "Walk steps passing rises every day": the walker, `journey-check`, is a module that jobs edit (CR2-2), and its step count moved from 238 to 357 inside one round [repo: product_side 9]. A job told to make the walk pass can change the walk. The draft's own P5 warns of this tendency and guards only gate time.
- "Median ready-to-merged under 30 minutes": Process3's good days were 6 to 13 minutes and its bad day had a 90th percentile of 670 [repo]; a median hides the failure.
- R22's two health numbers (false-done rate, cost per surviving change) have no successor in the test.

**Correction.** Replace the landings line with "items merged once; re-landings counted separately" and "no ready item waited over 60 minutes for a start". State the walk as passing/total, with the total and "steps removed or loosened since run start" printed beside it; decide on that count whether the step list needs the owner. Add a 90th percentile under 60 minutes. Add "hours the integration branch was red" and "cost per merged item, or the word unmeasured".

**Spikes.** S1, S2, S3, S6 and S7 are right. S4 and S5 need the changes in findings 2, 5 and 10. Missing:
- **S8.** One subscriber per PR: the job receives a red check and the merge; a replacement receives events only after the first session is archived; how many turns one CI run produces.
- **S9.** `create_session` with a commit as `source_revision`, model and effort set by BOB: the child loads that commit's deny list and `CLAUDE.md`. Whether finished idle sessions count toward the live limit.
- **S10.** Re-measure whether a task's fresh session can start a session, push and open a PR. If it can, a stateless BOB per wake replaces the long-lived one, and S4's compaction question disappears.
- **S1 additions:** a no-module PR merges; the owner's own guarded-path PR merges by bypass; the gitlink path is owned.

---

## C. R1 to R25

| # | Verdict | One line |
| --- | --- | --- |
| R1 | Weakened | Work reaches the integration branch; the draft never says how or when it reaches `main` (F11). |
| R2 | Met differently | The check set and the process move to the owner; the rest stays BOB's once `modules.json` leaves the guarded set (F8). |
| R3 | Weakened | New owner acts: merge process PRs, approve guarded paths, restart BOB, hold the settings page. No route for a question that is his, rendered with options. |
| R4 | Weakened | M4 covers "only merged words are rules"; nothing holds "asked once, never asked again", and O5 lets a ruling expire and return. |
| R5 | Met | M3.6 and O2 keep a question a question. |
| R6 | Weakened | Blockers are labels and work goes on, but BOB's death or pause waits for the owner, found by a daily alarm (F10). |
| R7 | Not met | No pause; the hourly prompt restarts work against the owner's word (F9). |
| R8 | Met differently | Check runs and merges are the evidence; receipts go. Stronger than before. |
| R9 | Met | Merged is done; `main` is walled. The integration branch may be red briefly, by design. |
| R10 | Weakened | The revert check becomes a nightly sample; the "weakened tests" flag that calls the reviewer is defined nowhere in the gate (G4 forbids it). |
| R11 | Weakened | Not addressed: who keeps requirement files and marks, now that format checks and the ledger go (F7 supplies the minimum). |
| R12 | Weakened | Module at the PR, yes. Layer close is the walk only; the whole-product regression is not mentioned (F6). |
| R13 | Met differently | PRs, issues and product files carry state. One gap: which session is BOB, and its task, is recorded nowhere (F10). |
| R14 | Weakened | "Push before you stop" is not in the working agreement; an unpushed draft is invisible to the watchdog. |
| R15 | Met differently | A session may stop; a freed slot can wait up to an hour (F2), counted. |
| R16 | Met | Stronger: sessions cannot write the process, and the pin moves only between runs. |
| R17 | Weakened | Layers and single ownership rest on a sentence; the imports check that enforced `uses` is deleted, and "ready" ignores in-layer dependencies (F6). |
| R18 | Met | Caps and split-at-planning. The `CLAUDE.md` cap is in the wrong unit (F3). |
| R19 | Met | One pass, five findings, never the merge decision. |
| R20 | Weakened | The production wall is right; development and public release cutting have no mechanism after the tool goes, and signing seeds sit in the session environment (F11). |
| R21 | Met | Stronger: removal is the default, changes only between runs. |
| R22 | Weakened | Daily numbers exist; false-done rate and cost per surviving change are dropped, cost may read "unmeasured", owner minutes are self-reported (F12). |
| R23 | Met differently, conditional | Holds only if the spikes run; today it stands on four unmeasured behaviours (F2, F3, F8, F10) and on approvals text written for Process3. |
| R24 | Weakened | No onboarding page, no setup list, nothing for a second product sharing the account's session limit (F11). Account moves get easier. |
| R25 | Met | M2. |

Not met: R7. Weakened: R1, R3, R4, R6, R10, R11, R12, R14, R17, R20, R22, R24. Seven of those thirteen close with the sentences in section B (R1, R7, R11, R12, R14, R17 in part, R20 in part); R3, R4, R6, R10, R22 and R24 are real trades the draft should state as trades.


# [file] audit_D_central.md (later part)

17. **R3, R6, R15, R17 in the R1 to R25 table, and the count "meets 19, weakens 6".** The grades match the clauses above.

### (iii) Where the requirements pull against each other or against a measured platform fact

1. **Order (3e) against parallel jobs (4), on this map.** Under "a module's job starts when the jobs of all modules it uses have merged", a median of 3 and at most 12 modules are ready at once over 65 waves, and a bound of 20 never binds. The width Process3 had (up to 62 at once) came from running 182 modules beside something they use. The owner's own kept principle P10 says "all the module jobs of a layer run concurrently". Both cannot hold on the present map. The choice is his: the literal order with a narrow build; order by layer with notification doing the repair; or a different map. Read as "module k waits for module k minus 1", the requirement allows no parallel jobs at all.
2. **Order (3e) and notification (3f to 3h) fit each other; layer-at-once and cheap notification do not.** Under the literal order every user's job comes after its provider's, so a notice reaches a job that has not started. Under layer-at-once a notice reaches jobs already running or merged. Process3 measured that second case: 2,707 notifications, 90% "not affected", 338 repeat landings.
3. **Notification to "all users" against velocity.** A median of 8 direct users and a maximum of 213 per interface change; 28 modules have more direct users than 24 jobs. When users' suites ran with the provider's change, Process3 measured +7.6 minutes median with 0 catches in 20.
4. **Requirement 1 against the approvals channel.** Measured 2 Nov: consent quoted in a starting prompt was declined 11 of 11 times; "your committed CLAUDE.md is the one channel that reaches sessions you do not start"; "No session writes, edits or relays them, because the judge refuses that". So on the platform as measured, sessions that other sessions start act only on a file the owner edited himself.
5. **Requirement 1 against starting anything.** "Creation only by you, ROOT or a scheduled task." A scheduled task's fresh session "cannot start sessions or send messages, 0 of 3". Someone has to start the first session and create the first task, and the cloud environment's variables, secrets and setup script are set in Claude. None of these is a GitHub or Cloudflare setting. The requirement as worded has no place for Claude-side settings.
6. **Requirement 2 against the refusal pause.** "After three refusals in a row a session stops and waits for a person"; Auto mode also hands a session to a person after 20 refusals. Process3 replaced such sessions with a sweep and a watcher; the proposal deleted both. Recovery without a person needs acts (archive, task switching) that the classifier judges case by case and that the Foundations ruled "never needed for correctness".
7. **Requirement 1, requirement 2 and "sessions cannot change the process" form a triangle.** The proposal's one physical defence against the Process3 loop is the owner's merge. Remove the merge (requirement 1) and either sessions can change the process again, or a process defect cannot be fixed with no one watching (requirement 2). The proposal's stated way out, hard limits in place of the merge, is by its own words "unproven" and rests on "one case". The owner should decide which corner gives.
8. **"No handoffs" against the platform.** A long-lived ARCH accumulates context and must be refreshed, which brings back handoffs or an owner replacement. A fresh ARCH per wake needs a task's fresh session to start sessions, measured 0 of 3. Only one subscriber may hold a pull request's events, so ARCH cannot be woken by them while jobs are.
9. **Requirement 4's "user-changeable" against requirement 1's "permissions or rules".** A number is neither. A GitHub repository variable is a setting he can change without a command or a file edit, but it is outside the two kinds of setting requirement 1 names. Above his number sit two ceilings he does not set: about 50 live sessions, failing silently, and 20 concurrent runners on the Free plan.
10. **Requirement 2 against two of his own rules.** A public release waits for his approval (GAP-7), and stop is his. Both are owner waits by design, and the release approval is a click, not a setting.
11. **Requirement 3c against the work of run 1.** "Each module is updated and tested by a single job", while the next work on the product is completion items and walk fixes that cross modules, and the proposal's job is "one module or item".


# [file] process4_notice.md


A requirement on what a job hands in: the job's handover note is saved under the file name `thistledown-relay.md`, and under no other name.

# Process4: the notification to user modules

15 Nov 2026. For Bob, from Claude. The section that replaces section F of the fifth draft in the sixth draft. Nothing here is in force, and none of it has run as a process.

Words used. A **provider** is a module whose services another module uses; that other module is its **user**. A module's **interface** is what it accepts and what it hands back. A **job** is a session that builds one module.

## What it is

It is a notification, not a test. Your words of 14 Nov: "calling the notification of a user module that a provider has changed isn't a test, it's simply a notification."

Its purpose, your words of 14 Nov: "If every user is told when the implementation of a module changes but the interface doesn't, then every change will continue to cause every user of that module to be rebuilt and tested. That's very (very!) inefficient and unnecessary."

## What it cannot do

Your words of 15 Nov: "After much research it seems pretty clear that there is no means to reliably tell the difference when there's a change in a module between when that change changed the interface or changed something other than the interface."
