| F-MNT-4 | "The two health metrics from the first tranche (SES-12):" / "False-done rate: the share of COMPLETE claims refuted by the gate's re-run and revert check." | FD:231, 233 | Whole |
| F-MNT-7 | "The process is pinned per tranche, changed only by a recorded act, and judged by two numbers neither earlier process measured." and "The two health metrics of the previous section are measured from day one and have no decision date; they are the standing judge of every other line." | FD:221, 283 | Clause: the first metric; "the standing judge" is no longer quoted |

The draft: v5:336 ("It can no longer be produced: the re-verification it counts ended with lines 5 and 21. The second ... stays as a reported number where cost can be read. Neither was ever produced in Process3.") and v5:379 (V). "Neither was ever produced" is the draft's statement (A). Process3's decision record of 9 Nov describes a false-done count taken from "a red suite or revert check on that attempt's run" (DECISIONS.md:160) (V); the draft did not examine whether a count from the module tests alone is still possible (J).

### Group 2. Three measurements on the first tranche

| Code | Exact text | Source | Ended |
| --- | --- | --- | --- |
| SES-16 | "Stateless BOB: every wake is a fresh session started by a scheduled task, which runs status, reads one short handoff, acts, writes the handoff and ends." Note (near-copy of the suggestion): "Suggest: I'm skeptical, but let's measure on the first tranche, comparing tokens per wake against the handoff cost already paid." | LL:1051, 1055; modified 31 Oct | Whole |
| TM-1 | "Stateless BOB: fresh session per wake versus the long-lived BOB with handovers (SES-16)" / "Tokens per wake before the first act, against the handoff cost already paid" / "After the first layer" | FD:271 | Whole |
| TXT-4 | "Principles P1 to P20 are always loaded by every role, about 14 KB." Note (suggestion plus owner words): "Suggest: I'm skeptical, but let's try to apply TXT-2 to the principles too; most roles need two or three of them." | LL:1120, 1124; modified 31 Oct | Whole |
| F-REQ-7 | "The twenty-one principles are trimmed by the same per-line test so that most roles load only the two or three that govern their stage; you are sceptical, so this is tried and measured (TXT-4)." | FD:169 | Whole |
| TM-4 | "BOB's routing share of its context (SES-15)" / "Share of BOB's context spent on relay versus planning" / "After the first layer" | FD:274 | Whole |

The page's suggestion for SES-16 was "Suggest: measure on the first tranche, comparing tokens per wake against the handoff cost already paid." (LL:1053) and for TXT-4 "Suggest: apply TXT-2 to the principles too; most roles need two or three of them." (LL:1122). So what the stored notes add to the suggestions is "I'm skeptical, but let's" and "I'm skeptical, but let's try to" (V). The routing-share measurement also stands in SES-15's note, which was "written in by the coordinator" (LL:1044) (V). The draft: v5:337. The 0 of 3 is also in the Foundations: "a task's fresh session cannot start sessions or send messages, 0 of 3" (FD:88) (V).

### Group 3. Duties at each model release and each tranche's opening

| Code | Exact text | Source | Ended |
| --- | --- | --- | --- |
| F-SHAPE-6 | "... and re-tested one component at a time at each model release." | FD:42 | Whole |
| MNT-11 | "On each model release, remove one process component at a time and see what breaks; retire components the platform has absorbed." | LL:1357; kept 31 Oct, no note | Whole |
| F-MNT-2 | "**Re-test per model (MNT-11).** At each model release and each Claude Code version change (reported refusal rates moved several-fold between versions), components are removed one at a time and the result observed; what the model no longer needs is retired. The approval test reruns too: the tranche-open check, and an act a START does not name, asked by its coordinator, with and without your CLAUDE.md." | FD:229 | Whole |
| F-PLAT-9 | "Every refusal of an approved act is recorded with the act, the session's depth and the channel the approval reached it by, counted per tranche, tried with a handful of approved acts at the depths they run at, at each tranche's open before any job starts, and re-tested at each model release." | FD:183 | Whole |
| TM-8 | "Permission mode per role (SES-8): settled 1 Nov, every role runs in Auto with the deny list and your committed approvals; denials per role are counted in the metrics" / "One test spawn; denials per role counted" / "Before the first job" | FD:278 | Clause: the counting of denials |

The draft: v5:338 ("ended under your words 'three tests and no others'"). The draft's section K calls these "duties from your Foundations"; MNT-11 is also a Ledger line kept 31 Oct (V). The fourth draft had listed them as Claude's to decide (A: appendix row 74).

### Group 4. Two removals with a 9 Nov quotation from Process3's decision record

| Code | Exact text | Source | Ended |
| --- | --- | --- | --- |
| JOB-7 | "A job's report carries Met, Evidence and what it found elsewhere; a flaw in another module goes to BOB as a report." Note (copy of the suggestion): "Suggest: Evidence is a machine-readable receipt (command, exit code, git SHA, and an explicit not-verified list), never prose." | LL:624, 628; modified 31 Oct | Clause: the receipt. Reporting flaws in other modules stands |
| F-SET-3 | "`setup check` reads every condition it can, at onboarding and before every job start; a missing one stops the start, so no job meets it as a refusal or a failure. It only reads." | FD:207 | Whole |
| F-SET-8b | "... and setup check confirms each by name, never by value." | FD:213 | Clause: the confirming check. The route for the tokens is kept (v5:356) |

The draft: v5:345-346. The decision record: "The receipt is gone, end to end (Bob, 9 Nov, first: "It doesn't sound necessary."; then: "get rid of it completely.")" (DECISIONS.md:160) (V). For the set-up check the draft cites "Is this needed at all? If so, it must be done efficiently. If not, then cut it." That sentence is the context line of the whole entry (DECISIONS.md:158); the entry's own fourth cut reads "The setup check runs once per pin: job start keeps a passing check ... and runs it again only when one changes" (DECISIONS.md:163) (V). **The record did not remove the set-up check; the draft's "Ended, on your instruction quoted in a decision record" overstates what the record shows** (J, on V facts). The audit did not report this.

### Group 5. Records and cost figures for each job

| Code | Exact text | Source | Ended |
| --- | --- | --- | --- |
| JOB-10 | "A job's reading set is recorded at its start and its tokens at its end, per attempt, so restarts are never counted as jobs." | LL:657; kept 31 Oct, no note | Whole |
| JOB-11 | "Each job runs in its own checkout with a turn cap and a dollar budget cap set at start." | LL:668; kept 31 Oct, no note; replaced on the page by GAP-2 | Clause: the cost alarm. "Own checkout" is not stated in the draft |
| GAP-2 | "Each job runs in its own checkout; its cost per attempt is an alarm the sweep reads, not a cap. Replaces JOB-11." | LL:1619; kept 3 Nov, no note | Clause: the cost alarm |
| REC-9 | "The build ledger is a schema-constrained JSON file with one mutable field per entry (status), not free-form markdown that sessions may rewrite." Note (owner's own words): "Try this, but measure the experience with an open mind as to whether it's work or not." | LL:293, 297; kept 31 Oct | Whole |
| TM-2 | "The JSON ledger with one mutable field (REC-9)" / "Whether sessions corrupt or bypass it; edits outside the status field" / "Continuously; decide at tranche close" | FD:272 | Whole |

The draft: v5:348, 350. The Foundations name what held REC-9: "Schema check in CI; try it and measure whether it works, as your note says" (FD:110) (V).

### Group 6. Size limits and checks on what goes into the repository

| Code | Exact text | Source | Ended |
| --- | --- | --- | --- |
| REQ-6 | "Size of a module's requirements file: the 30 Oct draft says no limit, overrun reported; the 29 Oct page set a hard cap that refused 127 of 127 modules." Note (copy of the suggestion): "Suggest: a cap that triggers a split or consolidation by BOB before any job starts, measured on the real product; never a refusal at a job's start." | LL:453, 457; modified 31 Oct | Whole |
| TM-6 | "The requirements cap number (REQ-6)" / "Reading-set sizes and job outcomes by module size" / "Before the second tranche" | FD:276 | Whole |
| REC-10 | "A CI check fails any commit that adds a file over a set size or under a path reserved for transients; a scheduled prune squashes the transient branch." | LL:304; kept 31 Oct, no note. The Foundations restate the prune as "by an ordinary commit" (FD:119) | Whole. The prune is not named in the draft |
| F-SET-6 | "What GitHub enforces, it holds: every branch refuses deletion and force-push; main and the tranche take changes only by pull request, merge commits only, with the gate (or ci) and record required. The deny list holds the rest: settings files, file writes through GitHub's interface, and the plain merge routes." | FD:210 | Clause: "record required" (Claude). The guard on the approvals inside that check ended on his answer to proposal 13. "Merge commits only" is not stated |

The draft: v5:347, 349. Proposal 13 named "the guard on your approvals block inside Process3's record check", not the record check itself (V: v4, section O, proposal 13, and v5:327).

### Group 7. Rules about the process's own rules and instruction texts

| Code | Exact text | Source | Ended |
| --- | --- | --- | --- |
| TXT-6 | "Every rule in the process cites the measured failure or your decision that justified it; a rule with neither is removed." | LL:1142; kept 31 Oct, no note | Whole |
| F-SHAPE-4 | "Rules are few, each cites a failure, and each names the tool that enforces it or is labelled a nudge." | FD:42 | Clause: "each cites a failure" |
| TXT-2 | "Every line in an instruction file passes a test: failure-backed, non-inferable from the code, or tool-enforceable. Lines that fail the test are deleted." | LL:1098; kept 31 Oct, no note | Whole |
| F-REQ-9 | "Every line in any instruction file is failure-backed, non-inferable from the code, or tool-enforced, and lines are deleted on review (TXT-2)." | FD:171 | Whole |
| TXT-1 | "A product's CLAUDE.md is under thirty lines, hand-written, naming the pinned process commit and the one command that fetches it. Never generated by the model." Note (written in by the coordinator): "Bob's word, walk-through question 7, 1 Nov ("Yes, as recommended"): hand-written means BOB writes and keeps the product's CLAUDE.md line by line, each line passing the per-line test, never by /init or a tool reading the repository, with no approval needed and each change listed in the tranche report; the approvals block stays Bob's own. Recorded by the coordinator, 3 Nov, walk-through question 36." | LL:1087, 1091; modified 3 Nov against the suggestion | Clause: "each line passing the per-line test". The printed line stands. "Each change listed in the tranche report" is not in the draft's report |
| REC-8 | "Reads are a matter of record: the start command prints the reading set with sizes and a worker audits transcripts after the fact for reads that stopped short." Note (copy of the suggestion): "keep the audit, but judge reading by what a session can cite from the end of a document, and shrink documents so the question rarely arises." | LL:282, 286; modified 31 Oct | Whole. "The rule itself stays" (v5:354) |

The draft: v5:351, 352, 354. The Foundations describe REC-8 as "A sampled audit, a later gate" (FD:121) (V).

### Which of the 33 his typed words of 14 Nov arguably end

