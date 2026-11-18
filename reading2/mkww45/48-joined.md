# [file] point1_tranche_end.md (continued)

2. **Whether sessions may change what the walks are measured against** (A2:59; C:71, C:75). Either sessions may, "and a tranche's end rests on what sessions write"; or only he may, "and each ruling that something is 'as designed' waits for you". Facts the audits did not show him: his approvals of 5 Nov say design lanes "decide design and wording there"; a session's record has him answering "agreed" on 6 Nov to the lane deciding screens, flows and words beneath his direction, audiences and principles (2.5). Process4 has not yet defined lanes.
3. **What "without flaws" means.** He agreed to proposal 10. The drift auditor suggests different wording (C:70; A2:59): every journey in his journeys document followed to its end, none listed as a flaw, a note or "not walked". This changes something he agreed, so by his own rule it must come to him as a proposal. Cost of leaving it: the agreed wording "looks one walk back only" (judged, C:61). Cost of the change: notes and "not walked" entries then hold a tranche open (the last stored external walk had 36 notes).
4. **What a tranche contains** (A2:61-67; F:158; C:155). (a) All open work: no decision now; the first walk after about 177 jobs (estimated), carrying every flaw Process3 left. (b) A smaller content he sets for each tranche, saying which part of the documents its walks cover and whether an older flaw holds it open: a decision at each tranche, and "a clean walk of a part says less about the whole". The run audit judges this "the only lever in his hands that is not a new check" (F:158).
5. **A tranche that will not come clean** (A2:67; C:156; R:230, R:255). The draft's "Only your word ends" it is Claude's. If he does end one by his word, it is either merged with its flaws, which sits against his "So a release is always fully tested and walked successfully", or dropped. Nothing says which.
6. **Which journeys "all journeys" covers** (C:143, C:154; A2:110). Journeys 1, 28 and 29 begin at civicsmith.org or the installer **(V)**, which he put outside the tranche; six journeys have steps marked for the assistant only (6, 10, 17, 22, 29, 32) and journey 4 is connecting a Claude account **(V; the audits' "about nine" not re-derived)**, and he wrote "A tranche can end without an AI enabled run". The audits list this as a conflict between his own statements and do not choose.
7. **Who runs the walks** (A2:162-168; F:105-106; R:258). (a) Sessions, his hint. Cost: unproven; whether a session's browser can reach the development site is unmeasured; the walker may need changing first. (b) GitHub's machines, as his kept Ledger line and Process3 had it: that form ran; it sets his hint aside.
8. **The risk that one session decides "clean" and then merges** (A2:247; C:73). No remedy was found within his rules; "every stop the auditors could see is a check or a gate". His to accept as a stated risk or not. The same holds for a walk step that fails for no reason in the product (A2:248).
9. **Go-ahead for the one-off trials** (A2:234-235; C:153). They need sessions or deployments on his account, which the handoff says to ask about first.

### Technical (Claude's to decide and report)

- Which exact files each walk reads, once item 1 is answered (D5:185).
- Correcting D5:185 and "Checked by Claude" (A2:184; R:77); marking "Only your word ends ..." as Claude's or replacing it with the plain statement that the case is undefined (R:230); marking "So sessions run both" as a reading (R:187).
- Resolving the sentences that cannot both hold (F:288, F:290).
- Naming the session that deploys (F:105; A2:208).
- Whether a walk is shared among sessions or run by one, after the trial (F:105-106); any change to the walker.
- Telling him at each round's end what the walks listed and how many rounds so far (C:424; A2:215).
- Adding the missing items to the unbuilt and unproven lists (A2:222-223).
- Saying how long the first round is estimated to take before its first walk (F:158).

### What is proven and what is not

Proven (ran, measured): the folder's contents on both branches; who committed to it; five stored walks, none clean; the external walks were screen sweeps; the tranche never ended; both claude.ai pages can be opened read-only from one session. Not proven: that a walk of either kind can come clean; that a walk by journeys can be run at all, how long it takes, or what data it needs; that a session can run a walk or reach the development site; that the same walk gives the same answer twice on an unchanged build.


# [file] point2_process_rule.md (later part)


---

## 5. What Process3's record shows about rules held only by text

| Fact | Source | Mark |
| --- | --- | --- |
| The fifth draft holds 51 rules by text; something physical stands behind six in whole or part. The first round counted 36 in the second draft, with three held. | `working/audit2_corruption.md`:448-506, summary :506 | A (the count is the drift auditor's) |
| Sessions made 270 of the 296 changes merged into the process; Bob 26. | `git log --first-parent --format=%an origin/tranche` in `/home/user/process3` | V |
| 121 of those 296 merges (41%) added or strengthened a check; they carry 60% of the tool code added. | `evidence/change_sample.md`:9 | A |
| His instruction of 5 Nov ("add a check only when study and data show it is needed") did not change the rate: 71 of 175 before it (41%), 50 of 121 after it (41%). | `evidence/change_sample.md`:14 | A |
| The process version in the product was moved 116 times in nine days, all by sessions, 102 of them in six days. | `evidence/product_side.md`:82, :233 | A |
| The one restraint with something hard behind it held all week: role texts capped at 4,096 bytes by a test stayed at 4,032 to 4,197 bytes, while the tool's code grew from 1,431 to 23,429 lines. | `evidence/causal_forensics.md`:29, :310 | A |
| The restraint rule was a "Nudge" read once at start; checks were code that refused on every call. | `evidence/causal_forensics.md`:26, :308 | A |
| The product's CLAUDE.md, under a thirty-line rule, went from 641 bytes to 8,664. | `working/audit2_corruption.md`:499; sizes: `ls` on the clone's main (641) and `evidence/permissions_inventory.md`:30 (8,664) | 641 V; 8,664 A |
| A limit on review rounds was overridden all 17 times it applied. | `working/audit2_corruption.md`:484 | A |
| 211 test files (11,410 lines) written for the process sat among the product's tests, each carrying the label asked for. | `working/audit2_corruption.md`:482; `definition/process4_counterarguments.md`:111 | A |
| No case was found of the permission checker enforcing a "never" that had no deny rule or GitHub rule behind it. Every "never" that held (force-push, deleting a branch, main) also had one. | `working/enforcement_levers.md`:141-142, :258 | A |
| The rule against adding checks was never in his committed approvals in Process3: it was a "Nudge" in rulebooks, a line in three role prompts and his words in chat. "So 'text alone did not hold' was measured for the weaker channels, not for this one." | `working/enforcement_levers.md`:145 | A; that no such rule is in either approvals text today is V (2a) |
| "No session in the record attacked branch protection or routed around a denied permission." | `working/assessment_doc.txt`:218 | A (a session's statement on his page) |

(J) Read together: where GitHub or a deny entry stood behind a rule, the record shows no session breaking it; where only words stood, the rule drifted. That is a statement about Process3. It does not show that any means in section 4 would hold in Process4; none has run.

---

## 6. What is Bob's to decide, and what is technical

### Bob's

1. **Whether anything physical stands behind his rule.** Options, with the cost of each to him as the evidence gives it:
   - (a) Words only, as now. No act. The risk he named stays.
   - (b) Words in his own committed approvals in the process's repository (means 6). One commit; one more whenever the wording changes; each edit stops long-lived sessions if the start-up comparison is kept. Not physical, never tried.
   - (c) A branch only he can update (means 2), with or without the product's version held the same way (means 5). One sitting of settings; then one merge on GitHub's website for each approved change or group, and possibly a second act for the product's move. Nothing reaches products while he is away. Never tried.
   - (d) The sessions' account cannot write the process's repository at all (means 1). As (c), and PROCESS cannot keep its proposals there. Never tried.
   - (e) Only the part of the process that can stop a merge is held, and texts stay open (combination B). An act only when that part is faulty. Never tried; never put to him.
2. **Whether an act of his on GitHub for each change is acceptable,** and whether it counts as a gate or a review under "Do not add tests, gates, reviews or checks". His PROCESS paragraph requires his approval; it does not say how it is given.
3. **What counts as his approval at PROCESS:** his typed words written down by the PROCESS session (the fifth draft, Claude decided), or an act only his account can make.
4. **Who moves a product to a changed process once he approves** (`definition/process4_audit2.md`:75; `working/audit2_feasibility.md`:149).
5. **The wording of his approvals in the process's repository.** Today they name Process3 and permit sessions to merge there without a person. Only he commits that text. What it should now say is his.
6. **Any setting at all.** Every GitHub-side means is his act: his approvals say sessions "may never: ... change permission or repository settings", and GitHub gives the sessions' account no admin right.

### Technical: Claude's to decide and report

1. Which branch PROCESS starts on and works on; which branch products follow. Today the default branch `main` has not moved since 2 Nov and is 1,232 commits behind `tranche`, and the product points at a `tranche` commit.
2. How a product names the process version it uses: a submodule entry as now, a line naming a commit, or a name in the process's repository.
3. How any chosen means is built, and its trial in the throwaway repository before it is relied on. What a trial can show: that GitHub refuses the session account's merge. What it cannot show: that growth stops.
4. Whether today's two required checks on the process's `main` and `tranche` (`ci` and `record`) fit Process4, and whether the `record` check, which runs under `pull_request_target`, will still report after GitHub's change of 2 Dec 2026 to that trigger in public repositories ((A) `working/enforcement_levers.md`:122; not checked by me). If it stops reporting, nothing could merge into those two branches.
5. The deny list for sessions on the process's repository, once the branch is chosen. He commits it; what it should contain is technical.
6. Stating in the definition what PROCESS may do after it starts (`definition/process4_audit2.md`:207).

---

## 7. Wrong or stale in the handoff and audits

1. **"It has no deny list"** (`HANDOFF.md`:54). True of `main` and `process4`. The `tranche` branch of the process's repository carries a 21-entry deny list committed by Bob (2b). It never stopped merges; it routed them through the tool.
2. **GitHub's settings "could not be read"** (`evidence/permissions_inventory.md`:16; `working/enforcement_levers.md`:18; `working/audit2_corruption.md`:584). Stale for the process repository: its rulesets were readable today (2e). Still true for the product repository in this session.
3. **No evidence file had the process repository's own rules.** They are now read: no approval required, two automatic checks, session account with write access.
4. **"His words of 14 Nov accept both the acts and the waiting"** (`HANDOFF.md`:54). An auditor's judgement. His words accept his involvement, choice, approval and the waiting. They name no merge and no setting (`working/v4_notes.md`:19 says the same).
