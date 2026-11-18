# [file] process4_five_points.md (continued)


One of them was wrongly laid at your door. The draft says the set-up check ended "on your instruction" of 9 November. Process3's decision record, under your quoted words ("Is this needed at all? If so, it must be done efficiently. If not, then cut it."), decided to keep the check and run it less often. Ending it was Claude's doing.

**The 53.** Grouped into nine subjects, such as how sessions are kept short and replaceable, what each session reads, and how the process reaches a product. Putting them back is my work. Three clash with your words on PROCESS and will come to you instead.

**The 75 and "which governs".** For these lines your Ledger still says keep or modify, and your Foundations still state them, while the definition says otherwise. Nothing says which of the three a session should follow. A session that reads the Ledger does one thing; a session that reads the definition does another. The audit's two choices: a sentence saying the definition is followed from the day you accept it, with the older two kept as history; or the older two withdrawn from what sessions read. **My recommendation:** the first, and only once the definition accounts for every line, since otherwise the 53 unstated lines would vanish by default.

**Something new, found today.** The 288 are not all of your requirements. They were made from an early copy of your Foundations (up to 4 November) and from the first Keep and Drop page only. A later copy of the Foundations, and a second Keep and Drop page you answered on 6 November, hold requirements that are in none of the 288: among them everything you said on 5 and 6 November about lanes. A worker is now listing exactly what is missing. I will report the count when it is done.

**Yours to decide.**

1. The seven proposals, yes or no each. They are written out and ready; say when you want them.
2. Which document governs.
3. Whether a job may commit built files (files produced from other files). You kept a line saying it never does; the draft says it does.
4. One older line of yours lets the directing session reword a requirement and tell you in one line afterwards. Your rule of 14 November puts such a change to you first. Both cannot stand.


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

### What the prior review has that I could not check

It quotes session transcripts ("The same standard applies to relaxing one"; "fifteen self-assessments ... produced nine further process changes"; the seven citations in eight hours). None of that is in the repository. It is consistent with what I found.


# [file] appendix_commits.md (later part)

| `following:744` | layer | `864850f2d9d00d0255814e48410ea6c6180f2597` | `798ad5915e64d86da9424901d9d5c232a8364274` | 9 | 10 | 0 |
| `hypotheses:1005` | layer | `50e7eefd55071777b85e8003c452193ba65909d9` | `ac6304508dbf718c07f89f87faef76a7c5872acf` | 9 | 9 | 0 |
| `hypotheses:1025` | layer | `7c906cfdfcad8663225c10bdaa53eb9632b32e01` | `6316509c05b43b934756d41f2d6348de92ae1c00` | 4 | 9 | 0 |
| `hypotheses:1050` | layer | `c2e2567196f91a7b77943a2154666e681d799ee1` | `75d6531c71066b537fea9025141210327d186fb3` | 4 | 9 | 0 |
| `inquiry-grammar:423` | job | `ecc17eb3ee22c6675a536a36fbca41e8ef85a5fb` | `d0dd3b1c3feaf7c38383e521b178a9ed8fd5e768` | 21 | 21 | 3 |
| `inquiry:1006` | layer | `9dbb197b127cf62719aaf087cc092e36bc844f15` | `f43ce326eb96e9b460c53f3c7be7e33777a51ba9` | 29 | 38 | 0 |
| `inquiry:1028` | layer | `7403f3ced096888c5cfd1f05182d10aa5f3aabae` | `91ca05387e413c347ee7cc316511287a67de63cc` | 23 | 38 | 1 |
| `inquiry:360` | job | `69a9e58b136b96ca87ec43670ab7e3154882d838` | `c90c7ad24c9957cfa1a4a0a32dd7dd81b17e5ba6` | 38 | 38 | 5 |
| `instance-setup:544` | job | `6e171876044c6346428d357d070912d5fa3554e2` | `0df62bf17bcba04c75a72d0d8a9c4a277e7b59d4` | 18 | 18 | 1 |
| `instance-setup:99` | job | `cd9939e2f77d4653e467d929e669b70cee4574a3` | `f3c504c8c6ef09f3eefa77b6e41d53764a02fb1f` | 17 | 17 | 0 |
| `interface-assets:207` | job | `10b4b8f21bfa6aabb6883fd14bda6b272a935b58` | `0504f2e09e13695953e98b9f89a0fb58d95e9ec9` | 12 | 12 | 0 |
| `interface-assets:443` | job | `dafa466eddb7b89b1c0662a26bc99bff756159b0` | `b750dc3e59f6012bb47313bb144b63aa12a05485` | 12 | 12 | 3 |
| `interface-shell:172` | job | `de2d3708cd82059215b7db87c61025a3bae84a70` | `d5db04200d9866cd332ac9ee841ec450bb3d6c72` | 16 | 16 | 2 |
| `interface-shell:310` | job | `53066d3292b34db86b54782433569b7a28a21b96` | `a839f9fadf2785fc777fe486690b61f647f4c6b7` | 16 | 16 | 1 |
| `investigation:628` | layer | `3e15b37e7fed379c4a5be1c588f707301bdc3855` | `8754e192e5fc99a8a8bedde2b9ca218e06f55f9a` | 11 | 11 | 0 |
| `jurisdictions:40` | job | `249b62e6b6400567038824df402de106672d2a9c` | `31818275b5c625a9cc0aaf71e9c8a693f58961a3` | 56 | 56 | 6 |
| `leg-earning:1003` | layer | `f43ce326eb96e9b460c53f3c7be7e33777a51ba9` | `c7ef3af1d17a08c66de9b08d49186ca0631dc13e` | 5 | 11 | 0 |
| `leg-earning:138` | job | `2544faef55d2663e310da09c95440141eb11ecfe` | `08efddd42d61417441812338a8d325dee6d7f626` | 11 | 11 | 5 |
| `lines:422` | job | `c6137900b6aa4106c6a1c07842bf5613525939b6` | `de9a5e5cbea6b54d95221e9ecc66b87551ba5bfb` | 19 | 19 | 0 |
| `local-facts:429` | job | `04c458a49faeaf5bd42869f0114ef6a871892974` | `ebabbbaa3b4daf5272c9a2c963b3c6a8936a0a94` | 21 | 21 | 1 |
| `local-facts:62` | job | `3c7ec47b2148e69b867202bdf84c96719db08c4e` | `6ef64d304ca6215d61576340e10f6d968f222183` | 20 | 20 | 0 |
| `machinery-producers:383` | job | `1185b6d699421af3c94a0991e1d81e6fc53c7842` | `9d2cf6dca3a9ead7254217e4b7a657ec34cb85a9` | 3 | 3 | 1 |
| `mail-door:428` | job | `7bbc540142702d8e844aaa1aeddd6e27ac75c3fe` | `926f9abb491912e39db37fd6dd4e3b9477f2fb38` | 6 | 6 | 1 |
| `mail-door:55` | job | `8504ad805928fb7306cd6f52b8d6586fd091bef3` | `d5bc179b1507bad590cb317b3d3ce2fdb280c7f7` | 3 | 3 | 0 |
| `member-roster:157` | job | `a73fbb5f6f0b9678130126be65b0c3ccb0c25acb` | `116ce81881f9bb8307d3d27656ffe5ac2fdb84f0` | 12 | 12 | 0 |
| `member-roster:286` | job | `8e8654c79a778fd1909fae034224b255bba3f823` | `14dbe3fc7196407ac7a628fc70e276951622be04` | 12 | 12 | 1 |
| `member-roster:446` | job | `5a998acf43a671f246d836bdb4d3e687498f5bfe` | `57c04e34c3adb4232a7e99dd858fbf4f5213f076` | 12 | 12 | 2 |
| `membership:1030` | layer | `6316509c05b43b934756d41f2d6348de92ae1c00` | `ae7cbacd0b47ebea9b6fdeeb5ff963bedb265636` | 103 | 116 | 14 |
| `membership:77` | job | `0dd847eb5149d7f172d3d750c9f85d75ef54d037` | `d115856ae18e6f4fb69596f0819cde1378f07e89` | 108 | 108 | 0 |
| `money:154` | job | `ae9403b397c52df13cf1aa769047e64a0e044e3d` | `ebecd76ff77fd491b14457cf60dc9ac9df97c47b` | 21 | 21 | 2 |
| `monitoring:743` | layer | `57cd57b3e2cb1c9c47afb8a43dd91a9e9233c4c0` | `7f02e010afb169e95e57c7a764faf79b95bf10d5` | 9 | 12 | 0 |
| `network-notices:633` | layer | `994f9e70e2ac61b2a0a4ed3168d8cd4d4d4e1c59` | `91ad402fd4c71f3e93f31fe1225c22d88a91680c` | 9 | 11 | 0 |
| `notice-producers:211` | job | `89cd623199090e12d4191dedb3c5312b5dff8a6d` | `c6f50136dc2967b284863c1205b98bee5fc9476b` | 5 | 5 | 1 |
