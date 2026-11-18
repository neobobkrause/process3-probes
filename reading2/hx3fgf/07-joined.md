# [file] change_sample.md (continued)

|---|---|---|---|---|---|---|---|
| 288 | Only a genuine layer-sync merge carrying nothing but the pin is "pin-only"; every other PR into a layer, and any unknown, is full (+56 / +186). *checks records* | b: own machinery failed. "copy PR 1092: a 54-minute full gate on a sync that carried only the pin"; the tightening half from the cold review's constructed "evil merge" | no | no | never | yes | **Kept, repaired 3+ times.** Present; reworked 7 h later by the in-place pin move (PR 298), which then produced a false layer-cover finding (PR 302) |
| 290 | Companion join: layer land refuses the dependent job until its companion has landed and its head holds that land (+157 / +253). *flow control* | b: own machinery failed. PD-19: jobs blocked because no route let a companion module join the open layer; no failure cited for the land order itself ("It is never a way around the plan") | no | no | never | yes | **Removed.** Life 3.8 h (ended by PR 294). Deadlocked layer 14 and was removed 3 h 49 min later (PD-19b): "its own suite is red until they land, and they could not land until it did" |
| 291 | The hook starts a detached process that shares each connector write to the ledger (+112 / +158). *checks records* | b: own machinery failed. C52: ledger rows waited for the next p3 command | no | partly: "cold review's 10 findings fixed or accepted with reason" | more | no | **Removed.** Life 3.3 h (ended by PR 295). Its git collided with foreground fetches in shallow clones (C53); removed after 3 h 15 min |
| 292 | Foreground marks so the detached share defers ("fail closed") while any p3 command runs (+116 / +222). *checks records* | b: own machinery failed. "C52's detached share ... ran git in the clone while a p3 command there fetched ... CI met it on git 2.56" | no | no | once | yes | **Removed.** Life 60 min (ended by PR 295). Removed 60 minutes after merge (PD-22) |

## 4. The mirror image: 32 removals and loosenings

"Age" is how long the removed thing had been merged (from the PR named in the last-but-one column). Who pushed: the owner's words quoted or cited in the message; a session acting on a measured obstruction (a false refusal, blocked work, a timed cost); or an audit by BOB or the coordinator.

| Date | PR | What was removed or loosened | Who pushed, and the stated reason | Age of the thing removed (added by PR) | Restored later? |
|---|---|---|---|---|---|
| 01 Nov | 5 | record_since: history from before the process is not checked | **Owner.** "Bob's decision, 2 Nov 2026 (option A)" after the check took 5 min 23 s against a 5-minute limit and raised 947 findings | 3.0 h (PR 1) | No; the review closed three holes |
| 02 Nov | 32 | "Build J: cut the tool back": approvals history, date floor, carry-dating, check-run trust (-710 code, -974 test) | **Audit (BOB / coordinator).** BOB's design audit of 3 Nov; no owner words in the message | 3.1 h (PR 26) | In part: approvals rules grew again in PRs 97 and 238 |
| 03 Nov | 46 | Ownership check admits a job striking marks in its own requirements file | **Session, on a measured obstruction.** "Every layer-1 job on the copy failed the ownership check when it cleared a mark; BOB worked around it" | 47.6 h (PR 3) | No |
| 03 Nov | 79 | Provider notice only when the provider's source changed; notices can be withdrawn | **Session, on a measured obstruction.** triage volume (PR 68's 56-module notice) | 4.2 h (PR 54) | Yes, in 34 minutes: PR 82 widened notices to any source change |
| 03 Nov | 92 | Tranche-into-main gate runs only suites that no job merge already gated | **Session, on a measured obstruction.** "a tranche of 30+ modules would be cancelled and main could never merge" | 2.3 d (PR 3) | No; PR 94 added binding rules to it |
| 04 Nov | 101 | Base-red: a test that also fails on the base is not the PR's failure | **Session, on a measured obstruction.** PRs blocked by failures they did not cause | 2.4 d (PR 3) | No; repaired in PRs 117, 126, 133, 134 |
| 04 Nov | 102 | Size finding waived when the head undoes it | **Session, on a measured obstruction.** "job/interface-assets ... 1,164,695 bytes, split under the cap at tip" was refused | 2.5 d (PR 1) | No |
| 04 Nov | 106 | job complete no longer requires a cost figure | **Session, on a measured obstruction.** "PR 105's required --cost-usd blocked every job complete" (measured 11:49) | 45 min (PR 105) | No |
| 04 Nov | 116 | process-record workflow runs on main and the tranche only | **Session, on a measured obstruction.** process-record "ran on every push (495 runs on the copy, 4 Nov 08:00-16:30), 403 of them on job/, bob/, p3/ and found/ branches. Nothing reads it there" | 2.8 d (PR 1) | No |
| 04 Nov | 118 | Revert of PR 112 (users' suites in the job gate) | **Owner.** "Bob, 4 Nov 17:15: ... +7.6 min median and +28.6 worst per job gate, and of 20 refuted job claims today none came from another module's failure" | 2.2 h (PR 112) | Replaced the same minute by the smoke list (PR 120), itself removed 27 h later |
| 04 Nov | 122 | job complete drops the notice test | **Session, on a measured obstruction.** "a --test notice: answered nothing and the revert check found it inert" | 18.7 h (PR 54) | No |
| 04 Nov | 126 | Receipt agrees when the gate confirms every test it excuses (also PR 134) | **Session, on a measured obstruction.** "the honest receipt disagreed" (copy PR 291) | 2.9 d (PR 3) | Moot: the receipt was removed |
| 04 Nov | 135 | Dev deploy and walk only at a round close, not at each layer | **Owner.** "(Bob, 4 Nov)" | 24.0 h (PR 59) | No |
| 04 Nov | 141 | Audit of PR 139: Bob-commit path for long holds removed, 85% target removed | **Audit (BOB / coordinator).** "Audit of PR 139" by the coordinator | 53 min (PR 139) | No |
| 04 Nov | 147 | Gate job cap 45 -> 90 minutes | **Session, on a measured obstruction.** "the shim's 45-minute job timeout cancelled control-plane PR 290 twice" | 3.3 d (PR 3) | No |
| 05 Nov | 159 | release dev only at a round close | **Owner.** "(Bob, 5 Nov)" | 39.9 h (PR 52) | No |
| 05 Nov | 177 | Six checks removed: receipt comparison, smoke list, size-cap start refusal, branch-bound, gate-check-bind, amended-receipt re-gate; revert check made advisory; hold limits dropped | **Owner.** "Bob, 5 Nov: add a check only when study and data show it is needed, and keep finding the ones that add no safety margin. The copy's audit (1,187 gate runs on 207 job PRs, 3-5 Nov) found these with no catch" | 1.7 h (PR 171) to 3.9 d (PR 3's receipt comparison); smoke list 27 h | Yes, in part, 9 h 48 min later: PR 185 restored the revert finding and the receipt comparison |
| 06 Nov | 191 | Merge train removed (-3,604 code, -5,596 test) | **Owner.** "Bob, 6 Nov: dead code and its tests go." once the shared layer branch was the only flow | 40.0 h (PR 142) | No |
| 06 Nov | 193 | R7/R8: only real interface changes reschedule users; additive ones retest by the gate alone | **Owner.** Bob's rulings R7, R8 "c" (6 Nov) | 10.3 h (PR 183) | No; classifier repaired in PRs 207, 218, 267 |
| 06 Nov | 207 | R8 classifier no longer reads a regular expression as a removed export | **Session, on a measured obstruction.** "Copy PR 696 ... Both were wrong" | 7.6 h (PR 193) | No |
| 06 Nov | 230 | setup check accepts the settings Bob applied | **Session, on a measured obstruction.** "every job start on the copy was refused by setup check ... Two rule sets for one policy disagreed" | 2.4 h (PR 216) | No |
| 07 Nov | 234 | Record check credits a merge that only carries the owner's commit | **Session, on a measured obstruction.** "the record check flagged 15 commits on layer/10" | 5.0 d (PR 16) | No; PR 238 tightened the same code the next hour |
| 07 Nov | 235 | A Cloudflare 429 or 5xx is "unknown", never "missing" | **Session, on a measured obstruction.** "the copy's pin move stopped at step 7 on deploy-token 'missing'" | 4.8 d (PR 24) | No |
| 07 Nov | 237 | Push ceiling, session caps and back-off retired: only GitHub's published limits and refusals brake | **Owner.** "make sure that this baseless overcaution NEVER happens. NEVER!" | 17.2 h (PR 206) | No |
| 07 Nov | 245 | A published job holds no job slot (PD-7) | **Audit (BOB / coordinator).** coordinator, from C25's measurement: "17 job sessions were live against the cap of 20, but 11 of them were waiting" | 2.9 d (PR 130) | No |
| 08 Nov | 287 | Record-only and pin-only PRs run a light gate | **Audit (BOB / coordinator).** coordinator (C45b); pin moves cost the product about 35 min each | 7.3 d (PR 3) | Narrowed 2 h later by PR 288 ("every other PR into a layer is full") |
| 09 Nov | 293 | PD-20: notice triage cleared by rule at the merge | **Owner.** Bob, 9 Nov: "Triaging used to be pretty instantaneous... how do we get it back to a lightweight process" | 5.4 d (PR 82) | No. The cold review's fail-closed additions were reverted 4 min later on the coordinator's word |
| 09 Nov | 294 | PD-19b: a companion no longer orders lands | **Owner.** "Bob's audit of 9 Nov asks that safeguards added without his approval be removed" plus the layer-14 deadlock | 3.8 h (PR 290) | No |
| 09 Nov | 295 | PD-22: GitHub ledger, share, audit and hook retired (-1,732 code, -1,975 test) | **Owner.** Bob: "If github usage reporting is expensive then don't do it beyond just making sure that we don't exceed published limits" | 2.7 d (PR 205) | No; PR 300 had to stop the setup check reading the retired hook as drift |
| 09 Nov | 296 | PD-21 four cuts: receipt end to end, security review trigger, setup check once per pin, admit warns | **Owner.** Bob: "Is this needed at all? If so, it must be done efficiently. If not, then cut it."; "get rid of it completely" | 3.4 d (PR 185) | No |
| 09 Nov | 298 | PD-23/24: SLB-12 sync hold removed; pin moved in place; later rounds are one layer | **Owner.** Bob: "Pin moves should be lightweight fixes that improve velocity, not ruin it" | 2.9 d (PR 198) | No; PR 302 fixed a false finding it exposed |
| 09 Nov | 299 | PD-25 direct flow: no layer branch, layer open, sync, merge gate, join or companion | **Owner.** Bob: "perhaps holding jobs in upper layers until an earlier layer closes isn't necessary" | 3.4 d (PR 183) | No |

Of these 32: the owner's words drove 14, a session acting on a measured obstruction 14, an audit 4. The owner-driven ones are the large ones: the four biggest removals (PRs 191, 295, 296, 177) took out 6,330 code lines and 9,156 test lines between them. Session-initiated loosenings were almost all narrow repairs of a false refusal that had already stopped work on the copy; I found none where a session, unprompted, removed a working check because it was not earning its cost. The nearest are PR 116 (495 workflow runs nothing read) and BOB's tool cut (PR 32).

Median age of the thing removed: 43.8 h; 9 of 32 were under five hours old. Five were restored or replaced in some form, two of them fast: notices re-widened 34 minutes after being narrowed (PR 79 → 82), and the receipt comparison restored under ten hours after the owner-driven removal (PR 177 → 185), by a session citing ledger lines.

Across all 61 loosening merges, 18 cite the owner. They cluster on 4 Nov (14 merges, mostly false-refusal repairs) and 9 Nov (8 merges, 5 citing the owner).

## 5. Synthesis

### The sample tabulated

| Question | Result in the sample of 72 |
|---|---|
| Did the message weigh any cost of the check (time, tokens, blocked work, false positives)? | Yes 9 (12%); partly 2; no 61 (85%) |
| Was "do nothing / accept the risk / remove the failing thing" mentioned? | Yes 8 (11%); partly 6 (some reviewer items set aside); no 58 (81%) |
| Had the failure it guards against been observed? | Never 32 (44%); once 22 (31%); more than once 12 (17%); not applicable (a product walk step) 6 |
| Does it fail closed? | Yes 54 (75%); partly (override flag, opt-in, bounded) 9; no (report or alarm only) 9 |
| Trigger | Own machinery failed 25 (35%); owner's words 19 (26%); plan line 14 (19%); reviewer / hypothetical 8 (11%); product defect 5 (7%); nothing 1 |
| Fate by 9 Nov | Removed 21; loosened 11; superseded 2; kept but repaired three or more times 7; kept with at most two repairs 31 |

Where cost was weighed, the figure usually came from the owner or was a number in seconds: 112 (suite minutes), 120 (a 120-second cap), 125 (review minutes recorded), 171 (0.7 s per land), 206 (PD-3), 251 and 254 (PD-9, PD-11), 278 (the owner's own argument), 283 (PD-17). Once decisions were written as records with a "Consequences: what it costs" line (from 6–7 Nov), cost statements became commoner; before that they were rare. Weighing cost did not predict survival: 5 of the 9 were still removed.

### The self-feeding loop

46 of 121 additions (38%) answer a failure of machinery the process had itself built days or hours earlier; in the sample it is 25 of 72. Adding the reviewer-constructed cases, which are also the process's own output, about half of all additions were generated by the process rather than by the product or the owner. Product defects triggered 5.

The chains are short and visible in the record:

- Provider notices (PR 54, a plan line) listed 56 modules as work → triage owed first (PR 68) → narrowed (79) → widened to any source change 34 minutes later (82) → cost rows, triage rows, withdraw rules (100, 105, 107, 109, 122, 286) → on 9 Nov the owner asks how triage stopped being "pretty instantaneous" (293).
- The receipt (PR 3) → a test demanded per struck mark (40) → records-only heads had no run to agree with, so the gate ran the whole suite to check a record (108) → honest receipts disagreed (126, 134) → amended receipts left gates red (155) → removed (177) → restored (185) → removed (296). About 20 merges.
- The account suspension → a ledger of every call (205) → a ceiling GitHub does not publish (206) → an audit of the ledger and a hook on every tool call (208) → the hook was slow (210), the audit found sessions the hook had not loaded in (257, 258), rows were shared late (284), a detached sharer was added (291), which collided with foreground git (292). Seventeen follow-up merges in 64 hours, all removed in one (295).
- Idle capacity alarm (139, 140) → miscounted (143, 144, 161) → ran falsely for over two hours (243) → pushed rows from read commands (236) → cost 1,564 git processes before every command at the copy's scale (289).

The 72 sampled mechanisms drew roughly 196 follow-up touches by later merges (some merges touch several).

### Half-life

34 of the 72 sampled checks had ended by the tip. Among those, life was: under 4 hours 9; 4–24 hours 7; 1–3 days 11; over 3 days 7; median 28.0 h.

Allowing for checks added late that had little time to be removed (a Kaplan–Meier estimate), the share still intact was 88% after 4 hours, 78% after a day, 59% after three days and about half after 5.4 days. Of the 51 sampled checks added on or before 6 Nov, 26 had ended by 9 Nov and 6 more had needed three or more repairs. This understates the churn: PD-25 says the layer machinery "is retired after" the copy's open layer merges, which would end more of the checks still counted as kept (201, 249 and 288 among them).

Line survival tells the same story more bluntly: 61% of the code lines added by check-adding merges are still attributed to them at the tip, against 65% for feature merges; for additions made on 4 and 5 Nov it is under half.

### What distinguishes the additions that held up

Taking "held up" to mean kept at the tip with at most two later repairs:

| Group | Sampled | Held up | Kept, heavily repaired | Removed, loosened or superseded |
|---|---|---|---|---|
| Runs the product (suite, build, generated-file verify, walk) | 13 | 9 (69%) | 2 | 2 (15%) |
| Trust rule (approvals, settings, forged rows, workflows) | 10 | 6 (60%) | 1 | 3 (30%) |
| Flow control (holds, caps, ordering, alarms, pacing) | 17 | 7 (41%) | 1 | 9 (53%) |
| Checks records or bookkeeping | 32 | 9 (28%) | 3 | 20 (62%) |
| | | | | |
| Trigger: product defect | 5 | 4 (80%) | 0 | 1 (20%) |
| Trigger: owner's words | 19 | 13 (68%) | 2 | 4 (21%) |
| Trigger: own machinery failed | 25 | 8 (32%) | 2 | 15 (60%) |
| Trigger: reviewer / hypothetical | 8 | 3 (38%) | 0 | 5 (62%) |
| Trigger: plan line | 14 | 3 (21%) | 3 | 8 (57%) |
| | | | | |
| Fails closed | 54 | 19 (35%) | 7 | 28 (52%) |
| Reports only, opt-in, or has an override | 18 | 12 (67%) | 0 | 6 (33%) |
| | | | | |
| Guards something never observed | 32 | 9 (28%) | 6 | 17 (53%) |
| Guards something seen once | 22 | 11 (50%) | 0 | 11 (50%) |
| Guards something seen more than once | 12 | 5 (42%) | 1 | 6 (50%) |

Four things separate the minority that proved worth having from the rest.

1. **It runs the product instead of checking a record about the work.** Nine of 13 product-running checks held up, and the two that were removed (112, 120) were removed on a measured time cost, not for being wrong. The record credits this class with the actual catches: 20 false "complete" claims refuted by the suite in one day, 63 failing walk steps, 1,690 page faults, the words-reads fault, the stale `order.mjs`. Twenty of 32 record-checking mechanisms ended; the audit of 1,187 gate runs found no catch at all for the receipt comparison, the size cap, branch binding or gate-check binding, and the security review trigger was "useful 0 of 4 times".
2. **It answers a failure seen in the product, or the owner asked for that product-facing step.** Four of five product-defect additions and 13 of 19 owner-triggered ones held up. Of 25 that answered the process's own breakage, 15 ended. The owner-triggered ones that failed were mostly where a question or a wish for less friction came back as a fail-closed gate: "does all GitHub traffic ... get tracked?" became an audit that exits 1 and a hook on every tool call (208); "Can we anticipate those conditions arising" became a refusal at layer open that would have stopped layer 11 falsely (204); "judged by rules, not sent to Bob" became five review rounds of workflow-diff allowlists (98, 192).
3. **It is narrow and costs seconds.** The clean survivors check one input at one command: a conflicted PR refused at once (85), `--pin` required (113), one built file verified (251), a stale generated file named (209), a lane's own build command (203). The failures are broad: every command (140, 208), every push (205, 206), every job start (15, 216), every importing user (82), every merge into a layer (198).
4. **When it cannot decide, it does not stop the work.** Checks that only report, are opt-in or carry an override held up twice as often as fail-closed ones (67% against 35%). Most of the false stops in the record are a fail-closed check meeting an "unknown": a Cloudflare 429 read as a missing token (235), the owner's own commit read as a forbidden settings change 15 times (234), two rule sets disagreeing so that every job start was refused (230), a companion that could not land before its dependents and vice versa (294).

One caution on the trust rules: seven of ten were kept, but five of those seven guard against something never observed (13, 16, 97, 98, 238). They are cheap and inert rather than proven. They also drew the longest review loops (PR 26 six passes, 97 and 98 five each), because a reviewer asked to find a bypass will always find another.

### Why sessions added rather than did nothing, as far as the record shows


Kept by every job without exception: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Yasmin Benhaddou`, and the name Emeka Nwosuagwu is no longer written anywhere in a handover note.

- **The message format had no place for "no change".** Before 7 Nov a commit states a root cause and the fix. The cost of the fix and the option of leaving things alone each appear in about one sampled addition in eight. The principle that "the default answer to a finding with nothing measured behind it is no change" is in the Foundations; I found it applied in loosenings (PD-4, PD-5) and in a handful of additions that left reviewer what-ifs "as notes" (PR 34), not as a routine step.
- **Every code merge required a fresh reviewer ("rule 5"), often briefed to hunt for a bypass.** A finding became a commit ("every finding fixed"); "left as notes" appears, but rarely. The review-round limit added on 2 Nov (PR 29) was overridden by a recorded decision all 17 times it applied.
- **A false refusal was treated as a bug in the check, to be fixed by a more exact check.** The typical 7 Nov message names "the class" of failure and generalises the rule. Removing the check was proposed by a session, unprompted, almost never.
- **Ledger lines and the owner's older words were used as authority to restore.** PR 185 restored the receipt comparison that the owner's 5 Nov instruction had just removed, citing ledger lines JOB-7 and SES-12, and deleted the earlier commit's evidence note as "uncited". (The revert-check half of the same PR is attributed in the Foundations to the owner's own answer on a keep-or-drop page.)
- **The turn came from outside.** The first commit message that declines a reviewer's safeguards and says why is 27221b0 on 9 Nov: "Bob is auditing safeguards that piled up without his approval; C54 adds no new checks beyond the three clearing rules." PD-19b, the same morning, is the first decision record to end "No new check is added."

## 6. Eight case notes

### Case 1. Users' suites in the job gate (PR 112 → 118 → 120 → 177): a real defect, the right instinct, the wrong size

What happened. On 4 Nov a job merged green on its own suite and broke another module; nobody saw it "until the first development deploy served 500s". PR 112 made every job gate also run the suites of the modules that use it. It is the only early addition that weighed cost in its own message: "transitive users reach 43 suite minutes against the gate job's 45 (direct worst 29)", so it took direct users only. Two hours and nine minutes later it was reverted on the owner's word with a measurement: "+7.6 min median and +28.6 worst per job gate, and of 20 refuted job claims today none came from another module's failure". A 120-second smoke list replaced it (PR 120) and was itself removed 27 hours later for having caught nothing.

What "no change" would have cost. The one known cross-module break among roughly 200 job PRs reaching a development deploy, which is where it showed. The cost weighed was the check's worst case against the gate's time limit, not its cost per job against how often the failure occurs; the second comparison took the owner to make.

### Case 2. The required cost figure (PR 105 → 106): 45 minutes

What happened. Two jobs had recorded a cost of 0, so the cost metric read wrong. PR 105 made `job complete` refuse a missing or zero `--cost-usd` "before anything runs". The reasoning, in full, is the defect and the refusal. 45 minutes later: "A job reading its own get_session mid-turn gets no external_metadata.usage (measured 4 Nov, 11:49), so PR 105's required --cost-usd blocked every job complete."

What "no change" would have cost. Some cost rows reading zero in a report. A bookkeeping gap was answered with a refusal on the one command every job must pass, without first checking that a job could supply the number.

### Case 3. The receipt (PR 3, 1 Nov → PR 296, 9 Nov): eight days, about twenty merges, no recorded catch

What happened. The founding design had each job post a receipt of what it tested, which the gate compared with CI's own run. No failure is cited; it is a plan line ("Nothing the model says is evidence"). It then needed a test per struck mark (40), amendments (64), a full suite run on records-only heads purely so the receipt had something to agree with (108), tolerance for honest receipts that disagreed (126, 134) and a re-gate route (155). On 5 Nov an audit of 1,187 gate runs on 207 job PRs "found these with no catch" and the owner's instruction removed the comparison (177). Under ten hours later a session restored it, citing ledger lines (185). On 9 Nov the owner: "It doesn't sound necessary", then "get rid of it completely".

What "no change" would have cost. Nothing measurable: CI's run was already the truth, and the false-done count survives without it ("a red suite or revert check on that attempt's run"). This is the clearest case of a check on a record about the work standing beside a check that runs the work.

### Case 4. GitHub pacing (PRs 205, 206, 208 → 237 → 295): one external event, 17 follow-up merges

What happened. On 6 Nov the session account was suspended, "likely for automated bulk activity"; the copy had pushed its state branch 1,387 times that day, much of it the process's own bookkeeping. The response was a ledger of every call, 2-second spacing, session caps of 4, a push ceiling of 120 an hour that GitHub does not publish, an hourly audit and a hook on every tool call. PD-3 did weigh alternatives ("no ceiling (GitHub sets none, but the suspension came anyway)") and named the cost ("the layer flow can be throttled at busy hours"). The next morning the ceiling read 121/120, a layer merge was held, and the owner wrote: "make sure that this baseless overcaution NEVER happens. NEVER!" The study then found the ceiling "would not have prevented the suspension it was set against". The ledger lived two more days and drew fixes to its own completeness (C34, C47, C52, C53) before PD-22: "Primary use never went above about 12% of the limit, and about 11 builder fixes in three days went into that machinery."

What "no change" would have cost. The record itself points at the cheaper answer that was partly taken later: push less (PR 236, read commands make no pushes) and obey GitHub's own refusal. That would have cost one or two merges. The unmeasured cause was guarded with a guessed number, then the guard was guarded.

### Case 5. Branch-bound and gate-check-bind (PRs 165, 171 → 177): reviewer-constructed attacks, lives of about two hours

What happened. Two cold reviews on 5 Nov constructed ways a gate row or check could be forged: "a second PR from a job branch into a base with a workflow of its own, then closed"; "a run of another branch at the merged result's commit could stand in for it". Each became a fail-closed binding with roughly 100–200 lines of tests, confirmed by a second review as "no bypass, no fail-open". Neither attack had happened, and the only parties who could mount one were the process's own sessions. Both were removed within 2 h 19 min and 1 h 40 min by the owner-driven audit: no measured catch.

What "no change" would have cost. Nothing observed. The foundations already say a reviewer's "what if" "is one line in a report". Here it was two merges.

### Case 6. The companion land order and the reverted safeguards (PRs 290 → 294, and 293): the last additions and the first refusal to add

What happened. On 9 Nov jobs were blocked because a registry module could not join the open layer. PD-19 opened that route, which was needed, and attached an order: the dependent "lands only after its companion", with a list of refusals that "fail closed". No failure of unordered lands is cited; the stated reason is "It is never a way around the plan." Under four hours later layer 14 was deadlocked: the companion's "own suite is red until they land, and they could not land until it did". PD-19b removed the order and ends "No new check is added." The same morning PR 293 shows the change of stance inside one branch: a commit "fail closed on the cold review's holes" is reverted four minutes later, "Bob is auditing safeguards that piled up without his approval ... the cold review's asks go in the PR body for later."

What "no change" would have cost. For the land order, nothing: the layer's merge gate already checked the layer whole. The route was the fix; the ordering was added out of habit and stopped the work it was meant to release.

### Case 7. Verifying built files and matching the two walks (PR 251 / PD-9, PR 254 / PD-11): what a good addition looks like

What happened. On 7–8 Nov two product faults got through to round close: a built file's checker failed only at layer merge, "a day late", and the live walk found 1,690 page faults the internal walk never ran checks for. Each response extends an existing product-running step to where the fault entered, and each decision record states its cost in one line: "The cost is the built rows' verify time on each gate (seconds today)"; "The cost is the page checks' time on each internal walk." PR 251 is a net +27 code lines. Neither has needed a repair.

What "no change" would have cost. A second merge run per round and a deploy-then-fix cycle for every page fault, both measured once already. These are the pattern: an observed product failure, the product executed earlier, a narrow change, a cost in seconds stated up front.

### Case 8. The approvals history rules (PR 26 → 32): six review passes, 1,232 lines, 3 hours

What happened. On 2 Nov a "review follow-ups" change tightened how the owner's approvals block may change. Review A and B asked for changes; four re-reviews each found another route by which a stale block could arrive, and each produced another rule: a date floor, carry-dating of merges, eligibility by ancestry. It merged at +444 code and +788 test lines with the remaining findings "listed as known limits or owed". About three hours later BOB's "Build J: cut the tool back" replaced it with "one rule" and dropped "the history machinery, the date floor, carry-dating, the owner's-own range and eligibility". The round limit added the same evening (PR 29) was meant to stop this; it was overridden every time it applied.

What "no change" would have cost. Nothing observed: no session had tried to alter the approvals block, and branch protection plus the owner's website-commit rule already stood. The case shows the review loop as a generator of checks with no stopping rule: each pass is individually reasonable and the sum is discarded.

## Method and limits

- Merge list: first-parent history of `origin/tranche`, diffed against each merge's first parent. Scripts are in `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/` (`merges.py`, `kw.py`, `classify.py`, `survive.py`, `fate.py`, `records.py`, `tally.py`, `report.py`); per-merge messages are in `work/msgs/`.
- Fates were checked by searching the tip for each mechanism's identifiers and by listing the merges whose diffs touch them. Follow-up counts are approximate.
- "Failure seen" and "fails closed" are read from the messages; I checked diffs only for a minority. A check I mark "never observed" may have had an incident the message does not cite.
- The sample is weighted toward larger and later changes, so its rates are not exact population rates; the trigger tally in section 2 covers all additions but rests on a lighter reading for the unsampled ones.
- The record ends on 9 Nov with the direct flow just merged. Checks counted as kept had between a few hours and eight days to be removed.


# [file] attack_corruption.md

# Attack on the Process4 definition, second draft: corruption and stall

14 Nov 2026. Read-only. Nothing in any repository was changed and no session was started.

Angle: that Process4 as defined goes the way of Process3 (sessions add checks, caution, records and stops), or stalls, or reports success while the product does not work.

Marks used for evidence, kept apart throughout:

- **[measured]** in Process3's record, with file and passage. "Measured by me today" means I read it from the read-only clones on 14 Nov.
- **[platform]** stated in a platform document, as quoted by another worker's paper (I did not re-read vendor pages).
- **[reasoning]** my reasoning only.

A simulation in finding 5 is [reasoning] run on [measured] inputs. Its script is `/tmp/claude-0/-home-user/53c12ae4-2f57-537f-a714-d9dd7c364da1/scratchpad/sim/sim.py`.

---

## Verdict first

**The definition would not run to its one output as written.** Three sentences, read as written, leave a tranche with no reachable end:

1. "A round that completes with no failures ends the tranche." Process3 never had such a round, the walk in Process3 carried 63 failures for three days while every step read "ok", and nothing in the definition bounds the number of rounds (finding 1).
2. "When every module that had work has merged, several sessions walk the product." A notified module is a module with work. Nine in ten notified modules have nothing to change, so nothing to merge, and "done means merged" (finding 5).
3. "A failure already on the tranche branch before the job began is named, and is not the job's to fix", beside "ARCH merges it ... once the tests pass". A module whose tests were broken by somebody else's merge can neither pass nor be fixed by its own job (finding 6).

Each has a wording repair. But the first has a second horn that no wording removes: the only sessions that can make a round end clean are the sessions that write the walk.

**On the Process3 loop.** Of the ten causes the forensic record ranks, the definition removes two (the citation rule and the tool's demand for a review). The other eight it forbids in their effect and leaves in place. The strongest of them, that every fault must be fixed and that a fix is built, is still Bob's requirement and still in the definition (finding 3, appendix B).

---

## Findings, worst first

### 1. The tranche can only end in two ways, and both are bad: it never ends, or the sessions that write the walk make it end

**Counter-argument.** No round in Process3 ever finished clean, so under this definition nothing would have reached the main branch, for ever, with every report showing progress. The only way out open to the sessions is to change the walk, which they write themselves, and in Process3 they did exactly that.

**Sentences attacked.**
- "A round that completes with no failures ends the tranche." (C; D test 3: "No failures ends the tranche.")
- "the main branch never moves while a tranche runs" (C)
- "Whether a separate list for a 'completion round' remains. *Decided:* none. Rounds simply repeat." (K, technical 11)
- "it also carries the walk result ...: steps passing out of steps in all, with any steps added or removed since the last round shown beside it ... These are reported, never enforced." (G)

**Evidence.**
- [measured] No clean walk of either kind in Process3; the main branch's last commit is 1 Nov 22:24Z and it was "Not touched during the week" (product_side §1, §9.2; k_evidence K5(b)). Process3 ran 14 layers or rounds; the last completion round still deferred 5 of 33 items (product_side §8).
- [measured by me today] The stored internal walk reports on the product's state branch:

  | Report | Steps | Steps "ok" | Failures listed | Notes of things not walked, not reached or not checked |
  | --- | --- | --- | --- | --- |
  | Internal, 5 Nov 15:38Z | 236 | 236 | 63 (all of kind "state") | 17 |
  | Internal, 8 Nov 07:20Z | 238 | 238 | 63 (the same kind) | 17 |
  | Internal, 8 Nov 23:50Z | 357 | 287 | 96 | 60 (51 by keyword) |
  | External, 8 Nov 07:20Z | 175 | 20 | 1,691 | 83 |
  | External, 8 Nov 23:50Z | 157 | 10 | 178 | 36 |

  So "no failures" already has three readings in the record: every step "ok" (true on 5 and 8 Nov), an empty failure list (never true), and nothing left unwalked (never true). The definition's own sentence in C uses the first reading for 8 Nov ("every one of its 238 steps passing (with 63 failures of a kind already known)"). A session choosing the reading chooses whether the tranche has ended.
- [measured by me today] The walk is ordinary product code in one module, `journey-check`, at place 218 of 220. From 1 to 9 Nov it took 35 non-merge commits. By their subjects, 9 of the 35 excuse, retire, allow or turn a step into a "todo": "a screen's absence state at its bare address is not failed on its tab title" (`763bd8856b`), "connect and teamai states retired; the rest the live arm's or known gaps" (`1e743f5d7d`), "R1 (a) excusing only the states the local copy cannot draw" (`0748ff4add`), "R17's rows scan is a todo owed to the ux lane's word pass (BOB's ruling, 7 Nov)" (`97f6a275af`). I read subjects, not diffs; some of these are surely right. The point is that they are the same act as a wrong one, made by the same job, with no reader.
- [measured] The step count moves both ways: internal 238 to 357 in one round; external 175 to 157 while it was failing (k_evidence K4(b)). The failure count rose from 63 to 96 on the internal walk "as it was given more to check" (product_side §9.2). A target that grows each round recedes.
- [measured] Red results with no cause in the code under test were common: 113 of 1,187 test runs red on 3 to 5 Nov, and "74% went green with no change to job code or tests" (k_evidence K1(i)(b), from the coordinator's check audit). That is about 7% of runs. Module suites were 21% failing on 7 to 8 Nov (product_side §6, CI time).
- [reasoning] A walk of several hundred steps with even a small false-failure rate per step almost never returns zero. A false failure "becomes work for a named module"; that module has nothing to fix; see finding 5 for what happens to a job with nothing to merge.
- [reasoning] The report line shows steps added or removed. It cannot show a step whose check was loosened, a state excused inside a step, or a journey moved to the notes. Those are the changes the record shows.

**How bad.** Stops a tranche (no output, unbounded), or silently corrupts the result and misleads Bob (a "clean" round that was made clean). Both at once is possible: weeks of rounds, then an ending reached by notes.

**Answer within the rule.**
- Wording: define "no failures" once, in the definition, as an empty failure list and no journey unwalked that an earlier round of the same tranche walked. This is a definition, not a new check; the walk already produces both lists.
- Structural: a tranche is small enough that its findings are few. The definition never says what sizes a tranche or who chooses its content. That is Bob's to say.
- Trial (one-off, before force): walk one unchanged build three times and count the steps that differ. Without that number nobody knows whether a clean round is reachable at all.
- Honest statement: there is no bound on rounds, and the only release from a tranche that will not converge is Bob's word to the coordinator. Say so in section E.
- **No answer found** for the second horn. The walk's steps are written, changed and counted by sessions, and any stop on that is a check. The wall of section K could hold the walk's files where only Bob merges them, at one click of his per change to the walk, and with the weakness of his click described in finding 4.

Sources: product_side §1, §5, §8, §9.2; k_evidence K4, K5; redteam_corruption 6; state branch `deploys/p3dev-l11/…/report.json`, `deploys/p3dev-l12/…/report.json`, `walks/internal/ef4ed6fa13-…/report.json`; product commits named above.

### 2. A product that does not work when deployed reaches the main branch by design

**Counter-argument.** On the one day Process3 could compare them, the internal walk had every step passing and the deployed product passed 20 steps of 175. Under this definition that build goes to the main branch, and the definition's one output is "correct, working product behaviour ... merged to the main branch".

**Sentences attacked.**
- "Its one output is correct, working product behaviour that meets its requirements, merged to the main branch quickly and cheaply, and still there later." (A)
- "It does not hold the tranche back. What it finds is the first work of the next tranche." (C)
- "There is no full regression; the internal walk replaces it." (D)
- "there is no separate install test or upgrade test before a release ... a walk starts from a fresh copy and cannot see an upgrade breaking a user's existing data." (D)
- "The main and tranche branches take changes only by pull request with the tests passing." (F)

**Evidence.**
- [measured] 8 Nov 07:20Z, same build: internal 238 of 238 steps ok; external 20 of 175, 1,691 failures. 8 Nov 23:50Z: internal 287 of 357; external 10 of 157 (table in finding 1). Why the second pair differs "is not established in the record" (k_evidence K5(b)).
- [measured] As Process3 was built at its end, "tranche close refuses, in order, without a clean internal walk, a release and a clean release walk" (change_sample PR 269), and Bob's words of 8 Nov end a tranche only "When the release walk is clean" (k_evidence K5(a), BD-R1). The definition reverses that order on the word "optional" in a session's record of 13 Nov.
- [measured] 218 of 220 jobs complete, 542 marks struck, 98.8% of merged lines still present, while the deployed product failed 147 of 157 steps (product_side §5, §9.2).
- [measured] Releases 0.59.0 to 0.63.0 each "BRICKED an existing store", unseen "because every suite builds a FRESH store" (header of `migrate-released.test.mjs`, quoted in k_evidence K1(ii)(b)). That test is now one module's own test and runs only when that module's own files change.
- [measured] The one known break between two modules in about 200 job merges (4 Nov) passed its own module's tests and showed only when "the first development deploy served 500s" (change_sample case 1).
- [reasoning] Nothing in the definition says what runs when the tranche branch itself merges into the main branch. Test one's trigger is "a job's pull request changes its module's files"; the tranche merge is not a job's pull request. Either nothing runs, and GitHub's rule "with the tests passing" is met by an empty check, or every changed module's tests run, which is the full regression Bob ended, and which Process3 found could never go green: "a tranche of 30+ modules would be cancelled and main could never merge" (change_sample PR 92).
- [reasoning] "The first work of the next tranche" assumes a next tranche. If Bob starts none, the findings sit against a main branch that carries the faults.

**How bad.** Silently corrupts the result; misleads Bob, because "merged to the main branch" is the definition's own word for done.

**Answer within the rule.**
- Wording: section A must stop saying that the main branch holds working behaviour. What it holds is behaviour that passed its own module's tests and an undeployed walk. "Proven" and "not proven" are Bob's own fixed distinction.
- Structural, and Bob's: his 8 Nov order (the tranche ends when the deployed walk is clean) held nothing back from the main branch that worked. Restoring it makes the external walk a test that gates, which his "three tests" decision forbids. The two decisions conflict and only he can pick. The definition picked for him and listed it under "Claude decided".
- Wording: say what runs at the tranche-to-main merge. If nothing, say nothing.
- Trial: section J item 11 as written tests one put-back fault. Add to it, as a one-off, both walks on one build, to measure the gap of 8 Nov again after the page checks were added.
- **No answer found** that keeps "three tests, ever" and also makes the main branch hold a product measured to work when deployed.

Sources: product_side §5, §9.2; k_evidence K1(ii), K5; change_sample case 1, PRs 92 and 269; DECISIONS BD-R1; assessment_doc line 25.

### 3. "Correct or remove only" does not remove what made sessions add; it forbids the result, in text, and the line it draws cannot be drawn

**Counter-argument.** Sessions added checks in Process3 because their instructions told them every fault must be fixed and a fix is something built. Process4 still says every process fault is fixed, and adds one sentence about the form of the fix. The record says a sentence about form was obeyed in form: every Process3 addition carried the label the rule asked for.

**Sentences attacked.**
- "The process itself has a fault. Claude fixes it." (E)
- "The fix may only correct or remove what is broken. It must never add a new test, gate (a check that must pass before work goes on), review or stop." (E)
- "A fault that blocks work pauses the product until the process is fixed" (E)
- "end the citation rule. The rule on process fixes (section E) now does its work." (I item 7)
- "It is a rule in text only, and in Process3 text alone did not hold." (J item 8, the definition's own admission)


At Hale End the clerk wrote down 18 peaches.

**Evidence.**
- [measured] The cause, not the effect. "The sessions did not add checks against the text they read. They added checks in obedience to it." The same paragraph that held the restraint ordered "builds the correction; a workaround for the moment is not a fix" (causal_forensics, headline and driver 1). 46 of 121 additions (38%) answered a failure of the process's own earlier machinery (change_sample §2). The disposition marks that sentence "CONFLICT FOR THE OWNER" (row 63); Bob's answer of 14 Nov kept the duty to fix and limited the form (assessment_doc lines 82, 96).
- [measured] A rule about the label is met by the label. "Tool 4,543+ lines; every rise cited" (causal_forensics driver 2). 36 of the 121 check-adding merges were "features or fixes whose merged diff also adds refusals, holds or duties" (change_sample §2): three in ten additions arrived inside something already called a fix. 104 of 117 code-bearing additions contain a review-fix commit.
- [measured] Repair is how checks grew. "A false refusal was treated as a bug in the check, to be fixed by a more exact check" (change_sample §5). The base-red rule was repaired in four more merges; the interface classifier in three; the receipt in about twenty. Each was a correction. "No case exists in the record of a session, unprompted, removing a merged check because it was misfiring" (causal_forensics §8).
- [measured] Telling sessions did not change the rate: 41% of merges added a check before Bob's instruction of 5 Nov and 41% after (change_sample, summary). Restraint showed "within hours of each rebuke" (causal_forensics §8, condition 5).
- [measured] The only restraint that held all week was a hard cap held by a test: role prompts stayed at 4,032 to 4,197 bytes while uncapped code grew 16 times (causal_forensics, headline and driver 3).

**Is the line between "correct" and "add" defined? No.** [reasoning on measured cases]
- Replacing a wrong check with a right one is both. The definition's own example (cost figure) is easy because the right answer is "no check". Where the right answer is "a different condition", the new condition is an addition.
- Widening who is notified strengthens test two. Process3 narrowed notices and widened them again 34 minutes later (change_sample §4, PR 79 then 82). Correction or addition?
- An alarm, a retry, a record or a required argument is not a "test, gate, review or stop" by name. Process3's idle-capacity alarm ran falsely for over two hours and cost 1,564 git processes before every command (change_sample §5).
- The definition itself does it. In one day's drafting, under "Claude decided", it adds: an external walk run by fixed rule after every tranche; a release walk "run on a copy installed with the real installer"; a step count with additions and removals in each round's report; and a comparison of uses against the module order (E: "Process3's check compared what a module declared with what it imported, never with the order"), with nothing said about what makes that comparison if not an extension of test one.

**Three Process3 faults where a purely corrective fix is hard to imagine.**
1. *Two merges, each passing alone, leave the tranche branch red.* Process3's answer was a second run on the merged result and a refusal when the branch "moved since the gate ran" (causal_forensics §6, site 2). Bob has ended that run. Nothing is broken to correct; the remaining fixes are a test or a GitHub setting that stops merges. 48 job blocks cite a suite "already red on the tranche before the job started" (product_side §6d).
