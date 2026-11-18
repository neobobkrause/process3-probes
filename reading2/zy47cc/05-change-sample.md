
### 9 Nov

| PR | Mechanism added (net code / test) | Trigger | Cost weighed? | "Do nothing" mentioned? | Failure seen | Fails closed | Later fate |
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
