# Audit of the Process4 definition (second draft, main text) against the Foundations and Bob's decisions

14 Nov 2026. Auditor's findings. Nothing was changed in any repository or document; this file is the only thing written.

Audited: `/home/user/handoff/process4_definition_v2.md`, sections A to K (the main text only; the appendix was not used to excuse a silence).

Read in full: `attack_common.md`, the definition, `foundations.md`, `live_docs.md`, `k_evidence.md`, `verify_numbers.md`, the 137 Foundations rows of `process4_disposition.tsv`, and the top 130 lines of `assessment_doc.txt` (the record of 13 and 14 Nov). Read by passage: `DECISIONS.md` (every passage that quotes Bob), `audit_D_central.md` (Bob's four requirements of 13 Nov, quoted there word for word), `interface_and_cycle.md`, `roles_root_coordinator.md`, `permissions_inventory.md`, `change_sample.md`, `product_side.md`, `no_layers_width.md`, `enforcement_levers.md`, `trial_plan_facts.md`.

## How the items were counted

205 items: the 137 Foundations rows of the disposition table; 43 statements in the session's record of 13 and 14 Nov; 25 dated statements of Bob's quoted in `DECISIONS.md`, `k_evidence.md` and the ledger store. Bob's six instructions of 14 Nov are judged separately, under (f) and (g).

| Category | Count | Note |
| --- | --- | --- |
| (a) honoured, and the main text says so | 113 | |
| (a) honoured only by the blanket sentence "208 stand" in section G; the main text never states them | 23 | Not counted as dropped unless listed under (d) |
| (b) purpose kept, way changed by a decision of Bob's | 10 | |
| (b) purpose kept, way changed by a decision of Claude's of 14 Nov, and the text says so | 5 | |
| (b) way changed with no decider named | 1 | Finding 9 (who is told of a change) |
| (c) ended, said so, Bob decided | 9 | |
| (c) ended, said so, Claude decided | 12 | Two of these end something that is a purpose, not a way (findings 4 and 5) |
| (d) silently dropped | 20 items, in 8 findings | |
| (e) contradicted, or a conflict between Bob's own statements resolved without saying so | 13 items, in 9 findings | |
| (f) added | 7 firm, 2 possible | |
| (g) plain-words faults | 10 assurances or blurred claims; 8 number faults in 24 numbers checked; 7 undefined terms; 4 references to things Bob has not seen; 3 places where a session's reading is written as Bob's act | |

### Claude's decisions of 14 Nov, judged strictly

- **Section I, 13 items.** Items 1 to 10 remove a way of doing something; items 11 to 13 keep one. None designs anything new. Four have a fault: item 7 removes the only carrier of a purpose (finding 4); item 9 may add refusals (finding 18); item 8 ends something a note Bob edited on 14 Nov still names (finding 19); items 1 and 2 lean on Bob (finding 12).
- **Section K, the eight closed points.** Points 1, 4 and 8 stay inside Bob's documents. Point 3 adds an act of Bob's, with support in his Foundations. Point 2 removes two tests and **designs a new one** (the walk on an installer-installed copy, finding 3). Point 5 ends Bob's judge of the process and **designs a new record** (finding 5). Point 6 chooses Bob's rule of 8 Nov but settles a conflict between his words of 8 and 13 Nov without saying so, and adds skipping by word (finding 2). Point 7 answers a question that was put to Bob on 13 Nov, against the drift of his words of 6 Nov (finding 7).
- **The 14 technical points.** Points 1, 3, 5, 6, 10, 11 and 14 choose among ways Bob's documents allow. Point 9 designs the notice, which Bob's decision asks for, and marks it unproven. Point 4 keeps the Foundations' standby but gives an assurance the record contradicts (finding 6). Point 2 creates a role that section B does not list and leaves half its own question unanswered (finding 11). Point 8 decides matters the design study called Bob's and gives an assurance (finding 10). Point 12 departs from Bob's own note on models (finding 19). Point 13 does not answer "how many" (finding 19). Point 7 adds a small report by ARCH.
- **The one question put to Bob** is in the right form (what it is, why it matters, a recommendation), but see finding 1.

---

## Findings, worst first

### 1. The one question put to Bob is the withdrawn proposal again, with its cost understated and an assurance attached

**Counter-argument.** The wall Claude recommends is the same step the proposal of 13 Nov took and then withdrew because it broke Bob's requirements. The text does not tell him that. It says the wall costs "one click" a fix when the evidence says more, it promises that silent growth becomes "impossible" two paragraphs after listing where growth can still happen, and it adds a new record on every fix.

**Sentences attacked (section K).** "With the wall, every process fix costs you one click". "The one physical stop that was found, and that earlier reviewers could not break, is a wall". "Each fix comes to you with one plain sentence saying what it corrects or removes, and the size of the process before and after." "What it does is make silent growth impossible and every change visible to you."

**Sources.**
- Assessment document, which Bob has seen: "The proposal does not meet your requirements, and its recommendations are withdrawn"; "To stop Claude corrupting the process, I moved the process itself across to you. That one move produced most of the contradictions"; its table: "You are made the merger of every process change ... None of those is a settings change".
- Bob, 13 Nov, quoted in audit D: "The only actions he will very occasionally take are changes to GitHub or Cloudflare settings related to permissions or rules." "It doesn't block waiting for user input unless it is completely blocked".
- Bob, 14 Nov, typed: "Do not add tests, gates, reviews or checks." "Do not assure me that something will work."
- `enforcement_levers.md`, on this wall: "Costs Bob: one sitting of settings; one merge and one move of the reference for every process fix; a click for each change to the product's own workflows (two in nine days in Process3); wording edits to approvals and deny list. A blocking process fault waits for him. This is the corner the central audit said breaks 'unattended' and 'very occasionally'." And: "If only Bob merges, the stop is his reading of a diff, and the record says that does not hold."
- The definition's own list: "Tests that serve the process placed among a module's own tests, or extra steps added to the walk. These remain rules in text."

**Kind.** (e) a withdrawn step re-proposed without saying so; (f) a gate by Bob's click and a new record ("the size of the process before and after"), neither asked for by any source; (g) one wrong cost, one assurance, one reference to reviewers Bob has not read.

**How bad.** Misleads Bob on the only decision he is asked to make.

**Proposed correction.**
- Add to "What it is": "This is the step the proposal of 13 Nov took and withdrew, because it breaks two of your requirements (your acts are settings only; the process waits for you only when completely blocked) and your instruction of 14 Nov not to add gates. It is put to you again because no other physical stop was found."
- Replace "every process fix costs you one click" with: "every process fix costs you two acts on GitHub's website: merging the fix, and moving the product to the fixed version. Setting the wall up is one sitting of settings. A change to the product's own test set-up files would also wait for your click (two such changes in nine days of Process3)."
- Replace "and that earlier reviewers could not break" with: "; the workers who attacked the withdrawn proposal found no way round it, and it has never been run".
- Replace "What it does is make silent growth impossible and every change visible to you" with: "What it does is stop a session changing the process's own repository without you. It does not stop growth in the four places listed above."
- Remove "and the size of the process before and after", or mark it as an addition of Claude's that Bob may strike.

### 2. Bob's words of 8 Nov on when a tranche ends are overturned by the 13 Nov record, and the text does not say so

**Counter-argument.** On 8 Nov Bob said, in his own words, that a tranche ends only after the walk of the deployed release is also clean and the installer and website are updated. The definition ends the tranche at the clean internal walk, merges it to the main branch, and sends whatever the external walk finds to the next tranche. It follows a session's record of 13 Nov and never tells Bob that this replaces what he said five days earlier.

**Sentences attacked (section C).** "A round that completes with no failures ends the tranche. The tranche branch merges into the main branch as a whole ... A deploy-and-external-walk then follows ... It does not hold the tranche back. What it finds is the first work of the next tranche." Section H lists only 'a development release "in each round"' as ended.

**Sources.**
- Bob, 8 Nov (`DECISIONS.md`, BD-R1, "in Bob's words"): "This successive set of rounds continues until an internal walk doesn't find flaws, the release deployment happens, and the walk of the release also doesn't identify flaws. When the release walk is clean, the installer is updated for that release, then the civicsmith.dev website is updated to refer to the new install, and that ends the tranche."
- Session's record of 13 Nov: "A round that completes with no failures ends the tranche. An optional multi-session deploy-and-external-walk runs after that."
- Foundations, "A job's life": "so nothing found waits for the next tranche".
- `k_evidence.md`: "By Bob's words of 8 Nov the question could not arise ... No text of his says what its findings then open." And: "in Process3 nothing reached the main branch before a clean external walk."
- The definition's own figure: the one time the internal walk was clean, the external walk of the same build passed 20 of 175.

**Kind.** (e). Claude's choice in K6 (a rule runs the walk; Bob may skip it) picks Bob's own rule of 8 Nov and is declared; the undeclared part is the end of the tranche and the fate of the findings.

**How bad.** Silently corrupts the result: the main branch receives a product no deployed walk has passed, on the strength of a record Bob did not type.

**Proposed correction.** Add to "End of a tranche", and repeat in section H: "This changes what you said on 8 Nov, that rounds continue until the walk of the release deployment also finds no flaws, the installer and website are updated, 'and that ends the tranche'. A session's record of 13 Nov has the tranche end at the clean internal walk, with the external walk after it and optional. This document follows the later record. Three things follow from it: the main branch receives the tranche before any deployed walk; updating the installer and website is no longer part of ending a tranche; and what the external walk finds waits for the next tranche, where your documents said nothing found waits for the next tranche. If the record of 13 Nov is wrong on this, say so."

### 3. The walk before a public release "on a copy installed with the real installer" is a new test, unbuilt, and the whole release path is missing from the unproven list

**Counter-argument.** In the same breath as ending the install test, Claude designs a walk that installs the product with the real installer. No document of Bob's asks for it, it has never been built, and it is not listed as unproven. Nothing on the path to a public release ever ran in Process3, and section J is silent on all of it. Two of Bob's rulings on that path are dropped.

**Sentences attacked.** Section C: "Claude decided that this walk is run on a copy installed with the real installer, since a development deployment does not use the installer. The process prepares the release and shows you what it carries. It waits for your approval, given in a protected area of GitHub ..." Section B: "There are no others".

