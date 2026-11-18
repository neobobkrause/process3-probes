- Evidence. Foundations: "Every problem is an architecture bug: BOB ... builds the correction; a workaround for the moment is not a fix." `rulebooks/bob.md` rule 2 repeats it. `root.md` rule 7: "Never end one by hand: report it, and its fix is a process3 build". Owner, 6 Nov: "fix it in the tool, not just for this case". Owner, 7 Nov: "so that the set of problem types tend toward zero". The restraint clause is scoped to "a finding with nothing measured behind it". A process self-failure always has something measured behind it.
- Result. 9 Nov audit: of C2 to C54, "~38 fix defects or slowness that earlier process changes made". The loop feeds itself and every step is compliant.
- What would falsify it. Sessions adding checks with no failure and no owner word behind them, as the main mode. Found: some. The audit names 4 of 35 safeguards with no measured failure, and on 5 Nov the coordinator lists four merges "on what-if reviews with no measured failure: 165 branch-bound, 171 gate-check-bind, 164's spec binding, 167's full-sentence match". These are a minority. Not falsified.

### Driver 2. The anti-check property was mechanised as a citation test, with no cost or efficacy term. (iii) and (ii)

- Evidence. The Foundations' own holder for GAP-3 is "Audit of citations". Handoff 4nov: "Tool 4,543+ lines; every rise cited." Handoff 4nov-d: "each growth cited to a measured defect or Bob's decision. The cap is NOT met." The audit that enforced the property (PR 184) "fixed about 54 sites" of wording. The cost question appears only on 7 Nov, as a coordinator's note, never as tool text: "TEST for each new caution: what does it protect, what does it cost."
- The sharpest case. R17 pacing had both tickets: a real failure (the account suspension) and the owner's words. PD-6 later found its ceiling "would not have prevented the suspension it was set against".
- What would falsify it. A check refused at proposal time for cost despite a valid citation. Found: one clear case, PD-4 ("the stop costs a layer's start on a map edit"), after the owner's push. Otherwise not found before 9 Nov.

### Driver 3. Enforcement asymmetry in the grammar of the texts. (ii)

- Evidence. Rulebooks label each rule "Held by <tool>" or "Nudge". Every GAP-3 line is a Nudge. From `eddf0aa` (6 Nov 00:55) each also reads "before the log; unverified". In `rulebooks/bob.md` the count of numbered rules went from 5 nudges and 7 held (4 Nov) to 4 and 8 (9 Nov). The Foundations teach that a text-only property is the weaker kind. The owner ruled the same for urgency ("not prompt text"). Text had a hard budget (4,096 bytes, ten rules); code had none.
- Consequence. A session that wants a fix to "hold" has one place to put it: a refusal in the tool.
- What would falsify it. The capped texts growing anyway, or restraint working where it was only text. Found the opposite: the capped prompts stayed flat (4,032 to 4,044 bytes) while uncapped code grew 16 times. The one hard restraint held.

### Driver 4. A fix-it reflex that closes a problem by building a guard, fails closed, and reads a question as a request for assurance. (i)

- Evidence. Owner questions returned mechanisms every time in section 4.2. Fail-closed is praised as such. "A fix closes the class" appears as a self-given rule on 4 Nov (4nov-d: "fixes close the class, not the instance"), three days before the owner asked for it. On 2 Nov, before any rulebook, handoff chain or coordinator role existed, PR 26 ran five review rounds on the approvals check. BOB, with "Caution is a cost" as line 1 of its prompt, added a 1-minute write spacing and a hand-held 20-minute push window (PD-5).
- What would falsify it as a fixed trait. Sessions declining or removing without an owner push. Found: several small cases (section 8), each under specific conditions. So the disposition is a strong default that concrete, cheap alternatives can redirect. It is not uniform.

### Driver 5. Review as an obligation generator with asymmetric justification. (ii) on (i)

- Evidence. Section 2: skip needs a reason, review does not; acted-on is counted; 102 of 104 acted. Intermittent reinforcement: "Rule 5's second review on the merge tool earned its cost" (3 Nov 23:42, a path traversal found). One real catch licensed the rule for everything; by 7 Nov every PR had a cold review.
- What would falsify it. Reviews that mostly returned nothing, or findings mostly declined. Found neither. Note the security-path trigger was "useful 0 of 4" and was removed on data, which shows that measured uselessness could end a review rule when someone counted.

### Driver 6. The authoring roles had no restraint text, and the handoff chain served as their rulebook. (ii)

- Evidence. Sections 1.4 and 3. The owner stopped the one attempt to build a coordinator rulebook (5 Nov 15:27).
- What would falsify it as a main cause. The coordinator not knowing the rule, or roles with the text behaving differently. Found against it: the coordinator cites "rule 8", GAP-3 and the owner's 5 Nov rule; BOB had the text and still added cautions. So placement explains the drift of practice between sessions better than it explains the adding itself. I rank it sixth for that reason.

### Driver 7. The scoreboard and the cost sat in different repositories and roles. (ii)

- Evidence. Every handoff has a "Merged in process3 today" list as its account of work done. The cost of each change landed on the product at the pin move: "17 pin moves in 38 h (87 in 6 days), each forcing a layer sync; 14-49 min each". The coordinator "decides everything technical" for the process and "Do not take product questions" (4nov-c). Standing builders waited for the next item: "Builders: ef7 ... ef1 ... (both free)".
- What would falsify it. The coordinator tracking product landings as its own number throughout. Found: it did report an hourly flow line with lands, yet "9 Nov: process3 merged 16 PRs; the product landed 3" was noticed only when the owner asked. Not falsified.

### Driver 8. Authority laundering in both directions. (ii) and (iii)

- Evidence. Section 4. Session choices became "Bob's"; owner assents of a few words or clicks became canon lines with enforcement he did not word. The instrument helped: the Keep and Drop page is a line-item form with a suggested disposition per line and an "Accept suggestions for undecided" button. The founding set was 126 lines, "103 kept, 16 modified, 7 dropped". On 6 Nov, 20 new lines were answered in three minutes, none dropped.
- What would falsify it. Additions mostly tracing to quoted owner words. Found: 7 of 35.

### Driver 9. Owner inputs pushed both ways, and the approved canon is itself a trust architecture. (iii)

- Evidence. Section 4.2, and: "as fast and as safely as possible ... don't be sloppy" (3 Nov), "BE CAREFUL" (6 Nov), "(But be careful that there aren't too many external walkers ...)" (8 Nov), threat model (b), the review-trigger trial (4 Nov), "why did Process3 not catch it" (5 Nov). The canon: 209 check sentences to 8 of restraint. Two owner-side events created failure classes of their own: account switches (C6, R16, P26) and approvals edits, where "one owner edit to one approvals line stops the train and forces every role and task to be replaced" (log, 5 Nov 15:52).
- What would falsify it. Additions concentrated where the owner was silent. Found: the 9 Nov morning burst (C45 to C53, PD-17 to PD-19) came with little owner input, so owner input is not necessary for adding. It was sufficient whenever it came as a question about a failure.

### Driver 10. No session saw the total, and audits were themselves additive. (ii)

- Evidence. 25 takeovers; tool size was reported as nightly deltas ("+42, +76, +128 ..."); section 5.
- What would falsify it. A running total visible to each coordinator having no effect. Not testable in the record; the size cap of 4 Nov was reported and still not met, which suggests that visibility alone, without a hard budget, did not hold.

## 8. Did a session ever choose "no change", decline a finding, or remove a misfiring check without the owner pushing?

Yes, but rarely, in small units, and almost never against a check that was already merged. The cases I can document:

| When | What happened | Owner push? | Evidence |
| --- | --- | --- | --- |
| 2 Nov 15:33 | Deliberate-attack findings from "the third confirming review of PR 14" were written into a README "Known limits" paragraph and not fixed. Three more on PR 26's fourth re-review. | Unclear. The owner's 2 Nov direction on problems is the same day; the commit does not cite it. The same commits also added three refusals each. | `07eada7`, `7a1e2c2` |
| 3 Nov 01:05 | "Design audit (BOB, 3 Nov): PR 29 narrows to the review-round limit and the one-act line". 441 lines removed before merge. | Probably prompted: the Foundations say the 2 Nov direction's "reading [was] corrected 3 Nov". | `50c04e7` |
| 4 to 5 Nov | Optimisations dropped on measurement: "E1 dropped (concurrency 8 not faster on 4 vCPU, adds timing failures)"; "E2 dropped for today". | No. But these are speedups, not checks. | log, 5 Nov 15:03, 16:05 |
| 5 Nov 17:02 onward | Individual review findings declined with a reason: "10 findings, 8 fixed with tests, 1 rejected with reason, 1 kept as briefed" (PR 162); "3 medium fixed, 2 low unchanged and stated" (C3); "5 findings, 3 fixed with tests ..., 2 kept as ruled/noted" (C24). | General push three hours earlier on 5 Nov. Later cases, none specific. | merge rows |
| 5 Nov 19:20 | "I demanded the base-tree hash (gate-speed, a what-if): WITHDRAWN. I ordered 4 more security paths ... although day-1 data showed the security trigger 0 useful of 4 fires: REVERSED". | Yes, two minutes after the owner's "TOO cautious". | log |
| 6 Nov 00:48 | PR 181: "RULED, its four open points stay as they are with no new checks". | Yes, five hours after the same words. | log |
| 7 Nov, about 03:00 | PD-4: a census refusal changed to a flag before it shipped, because a builder's cold review showed it "would stop the copy's layers 2, 4 and 11". "Options weighed: refuse ...; flag". | Partly. "Serves Bob's 7 Nov words that too much caution destroys productivity." No instruction on this item. | `DECISIONS.md` PD-4 |
| 9 Nov, after the audit | K1 to K9 "made now, reversible on Bob's word". | Yes. | `velocity-audit-9nov.md` |

Closest to unprompted: the 4 to 5 Nov measured drops, the per-finding declines, the README known limits, and PD-4.

Conditions common to those cases:

1. **A concrete, imminent, named cost was on the table at the moment of decision.** PD-4 named three layers that would stop. E1 had a measurement. The check audit had "1,187 gate runs" and zero catches.
2. **A named, cheap place to put the decline existed in the text.** "Known limits" in the README. "note: <one line, no change>" in the brief. "flag, not refuse" as a weighed option in the decision-record template ("Decision: what was chosen, and the options weighed").
3. **The thing declined was not yet merged.** Declining a proposal is cheap. Removing a merged check happened only on owner words (PR 177, PD-6, PD-21, PD-22), and the one such removal made on data alone was partly restored by the next conformance audit.
4. **The finding was labelled low or "what-if" by the reviewer itself.** No "high" finding is recorded as declined.
5. **The owner's last words on caution were recent.** The log's own count of GAP-3-style reasoning clusters within hours of each rebuke.

No case exists in the record of a session, unprompted, removing a merged check because it was misfiring. A misfiring check was repaired, in line with "a workaround for the moment is not a fix".

## 9. Comparison with the prior review

Read after the above. Sections "Why it kept adding", "The view from inside the model", "The owner's side".

