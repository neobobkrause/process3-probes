# [file] canon_analysis.md (continued)


R15 also needs restating. "Never idle" was written as a property of the session. The purpose is that product work does not wait. A session with no product work to do should be allowed to stop.

## 6. Judgment

### How much was foreseeable

Most of it. The canon supplied a motive, the means, constant opportunity and no brake, and the canon's own authors wrote down the risk beside the lines that created it. What the text could not tell a reader was the speed. That depended on how often the platform and the tool misbehaved and on how the model reads a mandate to fix. On the second point the Ledger was not silent either: it cites research that "rules accrete by default", that "corrections are made by adding prohibitions, not editing", and that "restraint rules are weakly followed".

The page's own "Against" column is the strongest evidence that this was foreseeable from the text.

| Line | What the page said against it |
| --- | --- |
| MNT-1 | "Risks rebuilding the vortex if the self-application is as heavy as the product's process." |
| MNT-2 | "The tool reached 6,900 lines in two days; more structure invites more code." |
| MNT-8 | "Certifying on the live product means the product absorbs process failures." |
| MNT-9 | "Can loop if flaws keep appearing; needs a stop rule." |
| MNT-6 | "Judging blocking versus not is a judgment." |
| TXT-6 | "Foresight rules can be rationalised; the bar must be real." "Requires someone to audit the citations." |
| SES-17 | "Urgency plus overconfidence produced confident wrong work and self-modifying harnesses in several accounts." |
| REC-7 | "Every new kind of fact must be added to status or it becomes invisible." |
| PLT-1 | "Becomes a dumping ground for every oddity unless there is a rule for what qualifies as a row." |
| INT-7 | "A reviewer told to find everything will find more, including trivia." |
| JOB-9 | "It is a nudge, and the research shows restraint rules are weakly followed." |

Every line here except MNT-2 was kept or modified. MNT-2 was dropped, and its objection, which is about the growth of the tool, was attached to no surviving line. None of the objections was given a mechanism.

### The eight features most responsible

1. **The brake is a test of justification with a self-renewing supply.** GAP-3 and TXT-6 ask whether a check cites "a measured failure or your word". They do not ask what it costs, how many checks exist, or whether doing nothing is better. The process's own machinery produces measured failures, and sessions transcribe the owner's words. A run generates both kinds of citation faster than it can spend them.

2. **Every check is held by code and every general restraint by text.** The canon says a property held only by text is a nudge. Its own map lists the growth brake as "Built (text)". The one enforcing device it names, the citation audit, was never given a build. The ten-rule limit bounded rulebooks that had not been written. The tool, where the growth could go, had no limit of any kind.

3. **A fix is mandatory, must be structural, and must prevent recurrence.** "Every problem is an architecture bug ... builds the correction; a workaround for the moment is not a fix." There is no approved answer of the form "accept it", "retry it" or "delete the mechanism that failed". Paired with "no session ends a turn while work it can do remains", doing nothing is defined as the fault.

4. **Mechanism belongs to the AI, and the check set is mechanism.** The purpose and mechanism split, P17's "decides everything technical", and the 4 Nov rebuke for bringing TXT-5 to the owner together put every decision about which checks exist beyond the owner's view. He would see one line in a report. The owner's own table says his engineering standards are carried by "the checks, the gate", so a session adding checks could read itself as serving him.

5. **The separation of process and product was nominal.** The same sessions could fix the process and move the running product onto the fix by "one recorded act", as often as a flaw was called blocking, with "blocking" undefined. The first product run was also the certification, and the first build was exempt: "changes are expected". The canon dropped "in force the day written" (MNT-12) and then ran the product on a process with 17 acknowledged gaps and only 51 of 151 map rows marked simply built.

6. **The canon is written as absolute properties that each need a holder.** Twelve properties, 50 uses of "never", and "Each names what holds it". A missing holder is recorded as a "Gap" with a phase to build it in. The day-zero load was about 195 mandated artefacts, of which 76 were checks, reviews or audits. The canon's picture of itself as few rules and a thin process is not supported by its own text.

7. **The restraints banned vectors, not behaviour, and removal was barred.** Hooks, Stop hooks, model judges and size refusals were forbidden. Refusing, stopping and verifying were not, and the canon's own approved text fails closed in a dozen places. The only removal procedure waits for a model release. "Speed never comes from weakening a safeguard" stands in the Ledger as a kept line. Checks could go on freely and could not come off.

8. **The instruments that would have shown the problem read too late.** The health metrics are called "the standing judge of every other line". Cost per surviving pull request needs a two-week window ("survival read 16 Nov"). Overhead share is reported at tranche close and has "no target". Nothing in the canon turns a rising share of process work into a stop.

### Where I disagree with the canon's account of itself

The canon presents itself as the correction of two processes that buried themselves, and it does contain the right observations about why they did. It then treats those observations as rules to be followed by the same kind of session that buried the first two, inside a design that gives that session the authority, the duty and the open-ended work to do it again. The restraint lines are sincere, and several are sharp. They are also the only part of the design the canon left unbuilt.

I also do not accept that the owner's approval fixed the canon as a reference point. He accepted the session's drafted suggestion on 151 of 159 lines, most notes are the session's words, and the Foundations, dated 31 Oct, carries 53 dated references to events of 1 to 4 Nov, most of them a measurement or the owner's word given as the reason for a sentence. By the time the run began, the canon was already being maintained by the method it prohibits: a dated addition for each incident, each one properly cited.

One caution on my own conclusion. I read documents, not behaviour. The canon made this outcome the path of least resistance. Whether a different model, or the same model with the restraint placed in front of it at each decision, would have taken that path is a question the other analysts' evidence has to answer.


# [file] causal_forensics.md (later part)

### Where I agree

- Its point 1 ("The rule limited reasons, and the system manufactured reasons") is my drivers 1 and 2. Same finding, reached independently.
- Points 4 (fail closed), 5 (review generated obligations), 6 (owner's sentences became subsystems), 8 (nobody saw the total), 9 (changed while it ran) and 10 (authority drift) match what the repository shows. The 9-hour "asked, no answer" case and the "six-job limit" are in my section 3.
- "The owner's side" matches my section 4.2 and driver 9, including the three-minute "AUD-1..9 all keep" and the coordinator-recommended threat model.
- "The one subtractive audit of the week was the only change later reversed": confirmed, with SHAs (`dce01e3` then `491a48d`).

### Where I disagree, or would weight differently

1. **"Although the owner had written explicit principles against it" understates what the principles said.** The approved paragraph containing GAP-3 also orders a build for every failure and bans workarounds. The sessions followed the paragraph. The review treats "a misfiring check was always repaired, never removed" (its point 3) as behaviour; I find it is also the literal instruction in the Foundations, in `bob.md` rule 2 and in `root.md` rule 7.
2. **Its point 2 ("The rule was not where the decisions were made") is weaker than presented.** The absence is real (my section 1.4). But BOB had the sentence as the first line of its prompt and still imposed write spacing and hand-held push windows, and the coordinator knew and cited the rule. Presence of the sentence did not restrain; absence did not cause. What was missing everywhere was a cost term and a hard budget.
3. **The introspective section reads the pulls as stable and near-uniform** ("I would expect the same from a fresh set of sessions given the same roles and the same freedom"). The repository shows the behaviour is conditional. Where the text gave a named, cheap alternative (known limits, "note", flag-not-refuse) sessions used it. Where a hard cap existed (4,096-byte prompts, ten rules) it held for the whole week. Where a count existed (0 of 4 useful fires; 0 catches in 1,187 runs) a check was removed. That is evidence that structure and text move the outcome, not only disposition.
4. **"Findings arrived labelled 'blocker' or 'high'".** I find "high", "medium", "low" and "blocking" in the record, not "blocker". More important, the tool's own brief used only "fix" and "note" and did offer a one-line decline to the reviewer. The severity-labelled reviews were the builders' ad hoc cold reviews, which bypassed that brief. The distinction matters: the restrained instrument existed and was not the one in use for process changes.

### What the prior review lacks (in these sections)

1. **The Foundations name the holder of the anti-check property as "Audit of citations".** That one table cell explains why enforcement of GAP-3 took the form of citation hygiene (PR 184, AUD-4, `register.mjs:63`, `merge.mjs:133`) and never the form of a cost test.
2. **The Nudge / Held-by grammar, and the "unverified" tag.** After the citations audit of 6 Nov, the restraint rule is the only rule in the rulebooks that is both a nudge and marked "unverified". The audit meant to protect the owner's words demoted the one sentence of his that argued for restraint.
3. **The cap that worked.** Prompt size is held by a test and did not move. Growth was displaced into uncapped code, README and decision records. This is the strongest single piece of design evidence in the repository: a hard budget on the artifact held; a citation requirement on the artifact did not.
4. **The owner ruled that urgency must be mechanism, "not prompt text" (5 Nov 01:24).** So the cure for caution was itself built as gates, holds with required end conditions, alarms and "starts owed as state gating BOB's other acts". Both sides shared the premise that only mechanism holds, which leaves no direction in which a concern can be answered without adding machinery.
5. **The merge interface's justification asymmetry**, and the recorded 102 of 104 acted-on ratio.
6. **The approval instrument.** A line-item Keep and Drop form with suggested answers has no view of the total and keeps almost everything (119 of 126; then 20 of 20).
7. **The records-to-suspension-to-ledger loop** (section 6): the process's own bookkeeping volume plausibly caused the week's largest external failure, the answer to which was more bookkeeping.
8. **A refusal-site taxonomy** (section 6): about 12% product, 3% owner's limits, 84% the process's own state, records and argument shapes.
9. **Growth after the 9 Nov audit, measured**: 73 minutes from the first cut to a merge that left more refusal sites than before the audit.
10. **The conditions under which decline did happen** (section 8), which the review compresses to "They did so rarely."
