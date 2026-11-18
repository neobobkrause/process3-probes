# [file] change_sample.md (continued)


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


# [file] audit2_common.md

# Common brief for the second full audit of the Process4 definition (14 Nov 2026)

The owner, Bob, asked for this in his own words: "perhaps this is a good time to repeat the full audit of process4 as currently defined, including a counter-argument audit. This will give a clearer look at that shape the design is in and provide a map where the focus is still needed."

## What is audited
The fifth draft: /home/user/handoff/process4_definition_v5.md. Read it in full, first. It supersedes all earlier drafts.

## Background
Bob is the owner. In this role he is not a programmer: he defines the product and the process in plain words; Claude decides what is technical and reports it. Process3 was his earlier process: Claude Code cloud sessions, in Auto mode, built his product Civicsmith in a GitHub repository unattended. It failed because sessions kept adding checks, gates, reviews and record-keeping to the process until product work stopped. Process4 is its successor.

## What outranks what
1. Bob's own typed words of 14 Nov 2026, verbatim in /home/user/work/bob_words_14nov_b.md and /home/user/work/bob_words_14nov_c.md (read both in full; the second holds three messages, the last answering three readings on the tranche and release). These outrank everything.
2. The session's record of his decisions of 13-14 Nov (quoted in the fifth draft's section B; source text /home/user/work/assessment_doc.txt, near the top).
3. His requirement documents: /home/user/handoff/foundations.md, /home/user/handoff/ledger_lines.md (with his stored answers in /home/user/work/ledger_store/), /home/user/handoff/process4_disposition.tsv (288 rows).
Do not attack his typed words as decisions. Attack whether the definition honours them, whether they can work as written, and what they leave undefined. Where two of his own statements conflict, report the conflict; do not choose.

## His fixed points now
- Three tests, and no others, ever: module tests, the internal walk, the external walk. The notification to a user module is not a test.
- "The 3 tests provide an appropriate opportunity to identify and debug as necessary every flaw and to test everything that needs to work in a released product. There is no need to any any more tests. PERIOD!"
- A tranche ends only when an external walk of a development deployment completes without flaws; flaws go to the next round. A tranche can end without an AI-enabled run. Installer and website are outside the tranche and wait for a clean development release walk.
- A job writes its own tests. A job for module A is not allowed to change module B; the only other way a module is edited is a mechanical edit.
- The process is changed only in a separate lane, PROCESS, that he interacts with; he chooses among options; a product moves to an updated process only with his prior approval.
- No layers; one total order of modules; eight job slots across the account; no review by a fresh reviewer; permission management preserved from Process3.
- The notification rule (what counts as an interface change, who is told, what a told module does) is under study in a separate session; audit what the draft says about it but do not re-derive the study (/home/user/work/notice_study/study.md holds the groundwork).

## Hard rule for remedies
You may NOT propose a new test, gate, review, check, audit, monitoring job or approval step by a session as the answer to anything. A remedy may be: removing something; a structural choice; a permission or setting; a change of wording; restoring something from his documents; an honest statement that a risk is accepted and unproven; a one-off trial before the process is in force. If the only remedy you can see is a new check, say exactly that and leave the finding unanswered.

## Evidence
- Folder /home/user/handoff/: the post-mortem and design evidence (review.txt, verify_numbers.md, causal_forensics.md, change_sample.md, canon_analysis.md, product_side.md, interface_and_cycle.md, no_layers_width.md, roles_root_coordinator.md, permissions_inventory.md, levers_github_cloudflare_product.md, DECISIONS.md).
- Folder /home/user/work/: the first audit round on the second draft (attack_corruption.md, attack_feasibility.md, audit_foundations.md, audit_ledger.md), its register (/home/user/handoff/process4_counterarguments.md, 87 entries with answers, and /home/user/work/register_notes.md), the memo of answers (decisions_memo_d3.md), drafting notes (v3_notes.md, v4_notes.md, v5_notes.md), enforcement_levers.md, k_evidence.md, trial_plan_facts.md, replay/results.md, notice_study/study.md.
- Read-only clones: /home/user/repos/process3, /home/user/repos/civicsmith-copy (product; branches origin/tranche and origin/process-state), /home/user/repos/process3-probes. Never commit, push, fetch into or check out in them. Start no cloud sessions.
Use grep and read passages; do not read every file end to end.

## How to report
Write your full findings to the file named in your task. For every finding:
 1. The counter-argument or fault, in one to three plain sentences Bob could read (no ids, codes or file names in that sentence).
 2. The sentence(s) of the fifth draft concerned (quoted), and the source it is measured against.
 3. What it rests on: measured in the record (cite) / a platform document / reasoning only. Keep apart.
 4. How bad: stops the first hour / stops a tranche / silently spoils the result / costs Bob time / misleads Bob / minor.
 5. Status against the first round: NEW; or RAISED BEFORE AND STILL OPEN (name the register entry); or RAISED BEFORE AND NOW ANSWERED (say by what — his words, a decision, a correction — and whether the answer really meets it).
 6. Your best answer within the hard rule, or "no answer found".
 7. Whose it is: Bob's to decide (say why it is not technical) / Claude's to decide / needs a trial / needs the build.
Rank worst first. Do not pad. Do not soften. At the end give a one-page MAP: the areas of the design (roles and sessions; flow of a job; rounds, walks and tranche end; release; notification; PROCESS and process change; permissions and starting; state and waking; recovery; reports; what is unbuilt; what is unproven), each rated solid / stated but unproven / thin / contradictory / missing, with one line of why.


# [file] receipt-regate-options.md

# Receipt re-gate: options (build/receipt-regate, 5 Nov)

## The defect

A job whose gate went red on revert findings runs `job complete <id> --exempt-revert "<why>"`
again. Its branch is at the COMPLETE commit, so `finish` takes the amend path: no commit, no push,
an amended receipt comment, and `markReady` only if the pull request is a draft, which it is not.
The gate workflow (`shims/process-gate.yml`) runs on `opened, synchronize, reopened, edited,
ready_for_review, converted_to_draft`; a comment is none of these. The red gate on the head
stands, and merge (`jobChecks`: the newest `gate` check run on the head must be `success`, and a
green row must agree with the newest receipt's attempt) and the train (`ready`: `checkRun` on
the head must be green) wait for a person's re-run (copy PRs 462, 471, 488, 490, 492, 5 Nov).

What the gate reads from an amendment: only `receipt.exempt.revert` (gate.mjs line 218, and
`measuredBy`). `not_verified` is never read by the gate. The receipt's `attempt` and `sha` stay
the same through an amendment, so merge's `receipt_attempt === receipt.attempt` still binds.

## Options

### A. job complete gives the pull request a new `edited` event (a body edit)

After an amended receipt is posted, job complete PATCHes the pull request's body (`editPR`,
already used by take-in, so the job's account can do it) to carry one marker line naming the
receipt comment, e.g. `<!-- p3:regate --> Gate re-run for the amended receipt <comment url>`,
replacing an earlier such line. GitHub fires `pull_request: edited`; the gate runs on the same
head with a fresh payload: today's base sha and the base's pin, and it reads the new receipt.

- Gate runs: one full run per material amendment, the same as today's hand re-run. No extra run.
- Time: the gate's own time (to 40 min for plane/control-plane); no person in the loop.
- Taken rows / gate rows by head: the head does not move, so the train's review notes
  (`train-notes.jsonl`, keyed by head), BOB's `--reviewed` note and every row keyed by head
  stand. A new run is a new check run, so the train's refused key (`pr@head@run`) changes and
  the train judges it again, as after a hand re-run.
- Fresh base: unlike an Actions re-run, `edited` carries the base as it is now (merge.mjs line 370
  already names "edit the pull request" as the way to give the gate a new event).
- Concurrency group `process-gate-<pr>`, cancel-in-progress: a run already going (which read the
  old receipt at its start) is cancelled and replaced. Wanted.

### B. job complete re-runs the red gate run (Actions API, `gh run rerun`)

- Gate runs: one, as A.
- A re-run replays the old event: the old base sha and the old base's pin (merge.mjs line 370).
  If the tranche moved, the run judges a stale base; `lastGreen` (keyed on `r.base === base`)
  and the revert base are the old ones.
- Needs `actions: write` on the job's account and a run id lookup by head; the job's acts
  name commenting and marking its own PR ready, not workflow control. Re-run attempts share the
  run id and overwrite the `gate-row` artifact (`overwrite: true`), so `verifyRow` reads the
  newest attempt: fine for the newest row, but an older posted row from the same run id would no
  longer verify. More moving parts than A for no gain.

### C. An empty (or records-only) marker commit

- Moves the head: `synchronize` fires one gate run, but every head-keyed record breaks: BOB's
  train note and `--reviewed` are for the old head, the train backs off/refuses by head, and
  job complete reads commits after the COMPLETE commit as a new attempt (`again`), which the
  amend path was built to avoid (copy PR 40: the amendment commits nothing). An empty commit to
  kick CI is also against the process's own rule. Rejected.

### (D.) Gate keyed by head sha plus receipt hash

Not a trigger on its own: something must still give the gate an event. As a guard it adds
nothing today: an amendment only loosens (adds an exemption) or adds not-verified lines the gate
ignores, so a green row stays true, and merge already binds the row to the receipt's attempt.
It would also add a row field, which an older pin's `checkRow` at job post may refuse (no
comment posted). Not recommended.

## When A fires (the failure cases)

job complete gives the `edited` event only when all hold:

1. The newest receipt carries a revert exemption (the only amended claim the gate reads). An
   amendment that adds only `--not-verified` lines changes nothing the gate judges: no re-gate.
2. The newest `gate` check run on the head is not green: none, completed non-success, or in
   progress but started before the newest receipt comment (it read the old receipt). A green
   gate is left alone, so a pull request the train holds (it takes only green heads) never gets
   a new run under it, and its land is not delayed by a check going pending.
3. No marker line already names this receipt comment, so a rerun of job complete after a
   failed edit edits again, and a rerun after a good edit does nothing (idempotent, as the rest
   of `finish`).

A failed PATCH stops job complete with "run job complete again"; the receipt is already posted,
so the rerun posts nothing and only edits. A cancelled run (a newer event) is handled by GitHub's
concurrency group as today. A plain pull request has no receipt and is untouched. The first
complete keeps its route (draft, then `markReady` fires `ready_for_review`); a new attempt keeps
its push.

## Recommendation

A, with the three conditions above. It removes the person from the loop at the cost of exactly
the one gate run a person would have started, keeps every head-keyed record, judges the current
base, and uses a call the job's account already makes.


# [file] attack_common.md

# Common brief for workers attacking the Process4 definition (14 Nov 2026)

## Background
Bob is the owner. He is not a programmer in this role: he defines the product and the process in plain words; Claude decides everything technical and reports it. Process3 was his development process: Claude Code cloud sessions, in Auto mode, built his product Civicsmith in a GitHub repository unattended. It failed: sessions kept adding checks, gates, reviews and record-keeping to the process's own tooling until product work stopped. Process4 is its successor. Its definition, second draft, is the document under attack:

  /home/user/handoff/process4_definition_v2.md   (read it in full, first)

The first draft is process4_definition_main.md in the same folder (for comparison only). The appendix (process4_definition_appendix.md, being updated separately as _v2) maps 288 requirement lines.

## Bob's fixed decisions (not open to attack as decisions; attack whether the definition honours them and whether they can work)
- Exactly three tests, and no others, ever: a job's own module tests; the interface notice; the internal walk.
- No layers. One total order of modules. A job does not wait for the modules it uses. Eight job slots by default; only Bob changes the number.
- No review by a fresh reviewer.
- A process fix may only correct or remove; it never adds a test, gate, review or stop.
- Process3's permission management is preserved (standing approvals in CLAUDE.md committed by Bob, deny list in settings.json, merging through the process's merge tool).
- ROOT is the first session; ROOT and the coordinator are different sessions.
- Bob enters no commands and edits no source files. Only words Bob wrote count as his word.
- Nothing may be asserted to work that has not been measured. "Proven" and "not proven" must be kept apart.

## Hard rule for your remedies
You may NOT propose, as the answer to any weakness, a new test, gate, review, check, audit, approval step by a session, or monitoring job. Process4 has three tests, ever. A remedy may be: removing something, a structural choice, a permission or setting, a change of wording, an honest statement that a risk is accepted and unproven, or a trial (a one-off measurement before the process is in force, not a standing check). If the only remedy you can see is a new check, say exactly that and leave it as an unanswered counter-argument.

## Evidence available (folder /home/user/handoff/; use grep, read passages not whole files)
- Bob's requirement documents: foundations.md (Process3 Foundations), ledger_lines.md (the Keep and Drop Ledger, 159 lines with his decisions and notes), ledger_map.md, DECISIONS.md (Process3 decision records; quotes Bob), process4_disposition.md / .tsv (288 rows: every requirement line with id, text and disposition).
- /home/user/work/assessment_doc.txt: a session's record of Bob's decisions of 13 and 14 Nov (near the top). /home/user/work/live_docs.md: what is and is not in Bob's own words. /home/user/work/ledger_store/: his stored answers.
- Post-mortem evidence: review.txt, verify_numbers.md, causal_forensics.md, change_sample.md, canon_analysis.md, product_side.md, bob_naming.md.
- Design evidence: interface_and_cycle.md, no_layers_width.md, roles_root_coordinator.md, permissions_inventory.md, levers_github_cloudflare_product.md.
- Earlier attacks on an earlier, withdrawn proposal (not this definition): redteam_corruption.md, redteam_feasibility.md, audit_A.md to audit_D_central.md. Use them as a source of attacks that may still apply; check each against the second draft before repeating it.
- Notes by today's workers: /home/user/work/enforcement_levers.md (physical stops against added checks), /home/user/work/k_evidence.md (evidence on Bob's seven questions).
- Read-only clones: /home/user/repos/process3, /home/user/repos/civicsmith-copy (product; branches origin/tranche and origin/process-state). Never commit, push, or change anything in them. Start no cloud sessions.

## How to report
Write your full findings to the file named in your task. For every finding give:
 1. The counter-argument, in one or two plain sentences Bob could read (no ids or codes in that sentence; put ids in a separate "sources" line).
 2. Which sentence(s) of the definition it attacks (quote them).
 3. Evidence: measured in the record (cite file and passage) / stated in a platform document / your reasoning only. Keep these apart.
 4. How bad if true: stops the first hour / stops a tranche / silently corrupts the result / costs Bob time / misleads Bob / minor.
 5. Your best answer within the hard rule above, or "no answer found".
Rank findings worst first. Do not pad: a finding you cannot support is noise. Do not soften: if the definition would not run as written, say so first.


# [file] train-spec-plan.md

# Speculative gates in the merge train (option C): build plan

5 Nov 2026, build/train-spec from tranche 74c3679. Design: notes/train-throughput-study.md §3 C on
study/train-throughput, as the coordinator restated it (points 1-5). This page maps each point to
code, lists where the code shows the design cannot run as worded, and says how it is tested.

## Where the code shows a flaw (deviation, put to the coordinator before it is built)

The design says process-gate "runs unchanged" on a draft PR from the job's branch into
`train/spec-<i>`, and that spec branches are reused per position. Four things in the code stop that:

1. **A draft PR's gate runs no suite, and a spec PR has no receipt.** gate.mjs reads the PR's draft
   state live (line 86) and a draft gets trigger `draft`: no suite, no revert, no receipt (line 151).
   Made ready instead, the receipt is read only from that PR's own comments by its opener (line 94):
   a spec PR has none, so the gate is red ("ready but has no receipt", line 269). The gate needs a
   spec mode either way.
2. **A second PR from `job/<id>` breaks three checks that guard against exactly that.**
   - verifyRow (github.mjs 158-161) refuses a run whose listed PRs include one into a base other than
     the tranche ("not a second PR on the same commit into a branch that carries a workflow of its
     own"). While the spec PR is open, the job PR's own rows can stop verifying, and the spec PR's
     rows never verify against the tranche.
   - branchBound (gate.mjs 433-440): any PR ever opened from `job/<id>` into another base removes the
     tranche cover for that job's merge, for good (PRs cannot be deleted). Every speculated module's
     suite would run again in the tranche into main, which is what the cover exists to avoid (cap).
   - Check runs attach to the head commit, shared by both PRs: `checkRun(head, 'gate')` (ready,
     jobChecks, waitForGate, the ruleset's required check) returns whichever ran last. A red spec
     run shows red on the job PR's head.
3. **Reusing `train/spec-<i>` needs a force-push.** Rebuilding position i on a new base is a
   non-fast-forward update. Making each rebuild a descendant of the old tip instead keeps old ahead
   heads reachable; when a job later sits behind a spec that once held its own older head, the merge
   base of the job and the spec becomes that head and GitHub's test merge drops part of the job's
   change (a false red, sent back to the job).
4. **The land as worded loses the tranche cover and the merge row.** GitHub's merge of the job's head
   into a tranche that is not its ancestor is a new merge computed at land time, not checked bytes;
   jobMerge (gate.mjs 450-451) covers only a merge whose head was brought up to the tranche and holds
   the merge row (merge.mjs 204), which today's merge() pushes onto the job branch before its gate.

## The deviation proposed (C', same strength: every land is the tree a green gate tested)

- **Spec pair per build, fresh names, never reused or deleted:** base `train/spec/<pr>-<seq>` at
  R(i-1), head `train/head/<pr>-<seq>` at R(i), where R(i) is the predicted merged result of window
  position i: the job's head merged onto R(i-1) (R(-1) = the tranche tip), plus its merge row. The
  spec PR (draft, into the spec base) shares no branch and no commit with the job PR, so verifyRow,
  branchBound and check runs are untouched. Its gate tests exactly R(i).
- **gate.mjs spec mode** (base ref `train/spec/*`, read from the live PR, so no workflow change): the
  job is the open job PR the branch name gives, whose head is in R(i); it is judged as that job (its
  entry, ownership, imports, revert and suite) and its receipt read from the job PR. Draft does not
  skip the suite in spec mode. The row records the tree it tested.
- **Land, exact bytes:** once every PR ahead landed, merge() builds the job's merged result L on the
  real tranche as today; only if L's tree equals R(i)'s tree, records aside (the rule
  record-since-green already applies), it pushes L to the job branch. The job PR's gate on L takes a
  new fast path, `spec-tested`: a verified green spec row tested this tree; no suite (about 1 min).
  Then mergePR as today: the merge is trivial (tranche is L's ancestor), so the bytes that land are
  L's, equal to the bytes tested. jobMerge follows a `spec-tested` row to its spec row, so the
  tranche cover holds. Trees not equal: today's path (full re-gate of L), said in the row.
- Spec branches accumulate (two per window entry, more on rebuilds); a prune needs Bob.

Cost against the design: a serial ~1-2 min confirm gate per land (the study's simulation assumed
1 min overhead), and a gate.mjs change that takes effect only when the copy's pin moves to it.
Throughput ceiling about 20-25 PRs/h, above today's 12-15 arrivals.

## Point by point (as C')

| point | code |
|---|---|
| 1 window k | `merge_train_window` in config DEFAULTS (4); window.mjs: the pure window (admit in order.mjs's order, plain rows and release-path first, topological prefix for provider holds); train.mjs builds R(i) and the spec pair per position |
| 2 tree land | merge.mjs `specLand`: L built as today, `tree(L) == tree(R(i))` records aside, else today's re-gate; gate.mjs `spec-tested` fast path; jobMerge follows it |
| 3 red at i | window.mjs `onRed(i)`: i back to its job as today (refuse); every spec behind closed (PR closed, cause named) and rebuilt on the new R chain; plain and release-path keep priority; the in-flight hold covers the head of the window while its confirm gate runs |
| 4 branches | fresh `train/spec/<pr>-<seq>` / `train/head/<pr>-<seq>`, pushed fast-forward only (new refs), never deleted; spec PRs closed, not deleted; no workflow change, no permission, no trigger |
| 5 causes | every window row (`metrics/train-window.jsonl` on the state branch) names its cause: admit, build, spec PR opened, closed (red ahead, base moved, head moved, withdrawn), landed; a restarted train rebuilds the window from the open spec PRs and those rows |

## Failure cases

- Red at position i: i refused to its job; specs i+1.. closed, rebuilt on R(i-1).
- Job pushes a new head mid-window: its spec closed; it re-enters at the back; specs behind rebuilt.
- Tranche moves by anything but the window (a plain PR, a hand merge): whole window closed, rebuilt.
- Spec gate green but L's tree differs (GitHub's merge base differs): today's full re-gate; row says so.
- Confirm gate red or cancelled: hold ends with its cause; window behind rebuilt.
- Train killed: on restart, open spec PRs with their rows rebuild the window; ones whose base no
  longer matches are closed with that cause.
- Runner cap: k parallel spec gates plus one confirm; k = 4 keeps the peak about 15 of 20.

## Tests

Unit tests on window.mjs (admission order, priority, provider prefix, red at i, head moved, restart
from rows); a simulated window of 4 with one red at position 1 through train() with stubbed GitHub
(fails without the build: no window, serial); merge `specLand` tree equal and not equal; gate spec
mode and `spec-tested` fast path (receipt from the job PR; draft not skipping; a tree not tested is
not fast); jobMerge cover through a `spec-tested` row. Full suite, cold review, confirming review on
the merge path.

## Ruling and interfaces (coordinator, 5 Nov: go C')

Conditions: (1) `spec-tested` fires only on exact tree equality of L and R(i) excluding record paths,
and only for a spec row that verifies (its run, base ref `train/spec/*`, head `train/head/<pr>-<seq>`,
its tested tree); anything else is the full re-gate. (2) Spec mode judges exactly as the job's own
gate would; a job red in its own gate is red in spec mode (tested). (3) The window admits only PRs
whose own job-PR gate is green (ready() already gives only those). (4) Every spec build, close and
fallback writes a row with its cause; the train report counts fast-path lands against fallbacks.
`merge_train_window` defaults to 1: today's serial train, unchanged.

The parts and the contracts between them:

- **Names.** `SPEC_REF = /^train\/(spec|head)\/(\d+)-(\d+)$/`: base `train/spec/<jobPR>-<seq>`, head
  `train/head/<jobPR>-<seq>`, the same `<jobPR>-<seq>` on both. Exported from gate.mjs as
  `specRefs(baseRef, headRef) -> { pr, seq } | null`.
- **Gate spec mode** (gate.mjs): when the live PR's base ref and the event's head ref form a spec
  pair, the run is judged as job PR `<jobPR>` (its head must be an ancestor of the spec head; the PR
  open, into the tranche, from a job branch of this repository): branch, draft and receipt (and its
  opener) are the job PR's; no record fast paths. Every row carries `tree` (the checkout's
  `HEAD^{tree}`); a spec row carries `spec: { pr: <jobPR>, seq: <seq> }`.
- **Fast path** (gate.mjs): on a job PR whose head commit's message has the trailer
  `Spec-Tested: <specPR>`, the gate reads spec PR `<specPR>` (base and head a spec pair for this PR),
  takes its newest row that verifies (verifyRow with `{ pr: specPR, baseRef: <its base ref> }`), is
  green, trigger `code`, `spec.pr` this PR, whose `tree` is its own head's tree, and whose receipt
  agrees for the job's current receipt attempt; when the files between that row's `sha` and this
  head are all record paths, the row is `trigger: 'spec-tested'`, suite and receipt carried over,
  `spec_pr`, `spec_run`, `spec_sha` named; no suite runs. Anything else: the trigger it would have
  had. jobMerge's cover follows a `spec-tested` row to its spec row.
- **merge.mjs**: `mergedResult(root, cfg, { n, id, branch, head, onto, ...row opts }) -> { sha, tree }`
  builds, in a temporary worktree, the job's head merged onto `onto` plus its merge row (as merge()
  builds its merged result today), and never pushes. `merge(root, n, { ..., spec: { pr, sha } })`:
  once L is built, if the files between `spec.sha` and L are all record paths, L's head commit gets
  the trailer and the result says `spec: { fast: true }`; else `spec: { fast: false, why }` and the
  merge goes on as today (full re-gate).
- **Window** (window.mjs, pure; train.mjs drives it): rows in `metrics/train-window.jsonl` on the
  state branch, `{ at, row: 'spec', session, event, pr, seq, position, spec_pr, base, head, cause }`,
  event one of build, close, land, fallback.

## Built (5 Nov, evening, after Bob's word at ~16:40)

- **Flag:** `merge_train_window` in process/config.json, default 1: the serial train, untouched (the
  loop takes the window's pass only past 1; a test shows a window of 1 makes no spec ref or PR).
- **train.mjs** drives window.mjs: `windowPass` (reconcile with the tranche tip and the jobs' heads
  from ready()'s one read of the open PRs; read the spec gates and their post jobs; a red at i whose
  ahead are all green is refused to BOB as a red merged result and every spec behind is closed;
  a cancelled spec gate is closed and rebuilt, not refused; position 0, green, lands through
  merge() with its spec; then admit and build), `specDone` (land / fallback / refused rows; a
  fallback land closes those behind, whose chain no longer holds), `restoreWindow` (restart).
- **Position 0 that is its own merged result** (its head already holds the tranche tip and its
  merge row): no spec PR, since its spec head would be the job PR's own commit and share its check
  runs; it lands on its own gate, as the serial train lands it.
- **Branches:** every spec head is pushed as a new ref; a name taken on the remote (ls-remote,
  `train/spec/*` and `train/head/*`) or in a row is never used again, so no push is ever a rewrite. Spec PRs are
  closed, never deleted; branches are never deleted. There is no non-deletion route to clean them
  (auto-delete on merge is a repository setting, and spec PRs never merge): they accumulate, one
  per build; a prune needs Bob.
- **Pin:** the gate and job post run at the base's pin, so on the copy the spec path works only
  once the copy's `.process` pin carries this code; before that, a window over 1 must stay off.

## The spec run's judge (confirming review, finding A; closed by the coordinator's ruling, 17:20)

Found: a spec run executes the pin (`.process`) and gate workflow of its base. With bases on
`train/spec/*`, branches any writer can create or move, the run's code and so its whole row
(`base`, `tree`, `ok`, `spec`, `receipt`) could be forged by whoever pushed a spec pair; `verifyRow`
ties a row to the run's head sha, workflow path and base ref name, never to the base sha it ran on.

Ruled and built: **every spec pull request is into the tranche itself**, from `train/head/<pr>-<seq>`
at R(i), which is built on the tranche tip (R(0)) or on the R ahead of it. No spec base branch
exists. The run's base is a tranche tip, so its pin, config and gate code are the tranche's, under
the same ruleset and the same `verifyRow` binding (base ref = the tranche) that job PRs rest on;
GitHub's merge checkout of R(i) into that tip is R(i)'s tree. What changes with it:

- **Gate, spec mode:** `changed` and its merge-base are the job PR's own head's (the spec head also
  holds the jobs ahead); ledger, start row, imports and generated checks read the job's head, as
  its own gate does; the suite runs on the checkout; revert and base-red run against the run's base,
  the tranche tip.
- **Fast path and cover:** the spec run's base must be the land's base or behind it on the tranche,
  with the same judge (`.process`, `process/config.json`, `.github/workflows/process-gate.yml`); a
  base-red suite stands only on the land's very base (a test failing at an older tip may have been
  fixed by a job ahead and broken again by this one).
- **Never merged:** spec PRs stay drafts (GitHub merges no draft); `merge` refuses a non-job branch
  and `merge --plain` refuses `train/head/*` by name.
- **Noise:** up to k draft PRs into the tranche; status, sweep and the train select job branches
  only. Any product workflow on `pull_request` into the tranche also runs for each spec PR: a trial
  pre-check on the copy.

## Second confirming review of the tranche-based spec (247c63f), and what was done

- **Binding (HIGH, fixed):** GitHub lists only *open* pull requests on a run, so a second PR from a
  spec head into a branch with another gate workflow, since closed, or a retarget of the spec PR,
  could make a forged run verify. The fast path and the cover now require `branchBound` on the
  spec head always: every PR ever opened from it is the spec PR, into the tranche, never retargeted.
  The same listing gap stands under job PRs' record-since-green and merge reads today; that is
  outside this build and is said to the coordinator.
- **Draft (MEDIUM, fixed):** a spec PR made ready is red in spec mode, so its green gate never
  stands as the required check for content judged only as job n's change.
- **Liveness (fixed):** a spec gate that never reports is closed past the hold's cap and rebuilt as a
