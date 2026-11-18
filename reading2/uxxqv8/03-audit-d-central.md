| 3f notify all users | CONTRADICTED | N7: "Deleted with no replacement: ... notice triage as a mechanism". "Ledger lines that end": "provider notices as a route (GAT-3)". Working agreement 4: "If it is elsewhere, tell ARCH in one line." |
| 3g users' jobs updated | NOT ADDRESSED | No item opens or updates a user module's job on an interface change. Nothing says how an interface change is recognised. |
| 3h users' jobs tested | PARTLY | G6: "Cross-module breaks are found after merging, on the integration branch. The existing full regression runs there on a schedule." G11: the full regression at close. This tests every module some hours later. It finds only breaks an existing test exercises, it is not tied to the change or to its users, and it does not test a user "updated as necessary". |

Items that touch requirement 3: G3, G4, G6, G11; C4, C5, C6; F2; P3, P4; N1, N7; R10, R11, R12, R17; "Ledger lines that end"; working agreement 4; Known limits ("Requirement files are edited by jobs"). None of the seven tests and none of the five run 1 measures tests order or notification. Run 1's goal, "Merge Layer 14, then one round to raise the walk", is completion items and exercises neither.

The admission table says: "Keep the order and the notification. Derive the users of a changed interface from the module map and open their jobs." That is a direction. P3 and N7 stand unchanged below it.

### 3g. What the actual module map permits

Method: `build/modules.json` at `origin/tranche`, list order taken as the total order, the three forward edges set aside as violations. Each job is taken as one time unit. These are properties of the map, not measurements of a run. A tranche in which fewer modules have work would be wider. T53 gave all 220 modules a job, so the full figures apply to it.

**If a module's job may start only when the jobs of every module it uses have merged.**

| Measure | Value |
| --- | --- |
| Longest chain of uses | 65 modules |
| Waves | 65 |
| Modules ready at once | Median 3, mean 3.4, maximum 12 |
| Wave sizes in order | 3, 7, 7, 10, 12, 9, 6, 4, 2, 2, 1, 4, 5, 2, 2, 2, 4, 3, 2, 3, 4, 4, 6, 4, 2, 3, 3, 2, 3, 6, 6, 5, 2, 3, 4, 1, 1, 1, 1, 2, 1, 1, 1, 2, 2, 1, 2, 2, 2, 4, 5, 2, 4, 2, 5, 1, 2, 1, 1, 1, 1, 9, 8, 3, 4 |
| Waves with exactly one module ready | 14 of 65 |
| Waves with two or fewer | 32 of 65 |
| Modules with no uses at all (the first wave) | 3 |
| With the three order-breaking edges kept as real dependencies | 44 modules can never start |

**The same rule under a bound on concurrent jobs.**

| Bound | Rounds to finish | Average jobs running | Rounds in which the bound binds |
| --- | --- | --- | --- |
| 1 | 220 | 1.0 | 220 |
| 2 | 110 | 2.0 | 110 |
| 3 | 85 | 2.6 | 62 |
| 4 | 77 | 2.9 | 35 |
| 6 | 71 | 3.1 | 12 |
| 8 | 68 | 3.2 | 4 |
| 12 | 65 | 3.4 | 1 |
| 20 or 24 | 65 | 3.4 | 0 |

A bound of 12 or more changes nothing. The owner's default of 20 and the proposal's 24 would never be reached.

**The proposal's "a layer's jobs start together".**

| Measure | Value |
| --- | --- |
| Rounds | 11, one per layer |
| Jobs wanted at once per layer | 39, 10, 12, 9, 21, 27, 3, 20, 13, 4, 62 |
| Layers that exceed a bound of 24 | 3 (layers 1, 6 and 11) |
| Uses that cross within a layer | 721 of 3,120 (23%) |
| Modules whose job starts beside or before a module they use | 182 of 220 (83%) |
| In-layer chain depth per layer | 8, 4, 7, 4, 11, 11, 2, 12, 8, 3, 16; sum 86 |
| Modules per layer with no in-layer use, which could start at layer open under the strict rule | 1, 4, 4, 6, 2, 3, 2, 2, 2, 1, 11 |

Three differences from the requirement.

1. **Order.** The requirement orders jobs by module. P3 orders them by layer only. 182 modules run ahead of or beside something they use.
2. **Notification.** Under the requirement's order, every user of a module comes later, so its job has not yet run in this pass when the provider's interface changes. Under P3 a user may already be running or merged, so an interface change means rework. Process3 ran P3's form and had 338 repeat landings and 2,707 notifications. P3 keeps that form and N7 removes the notification that repaired it.
3. **The cost the proposal cites.** P3's "about four days" is 65 links times about 90 minutes: some 30 minutes of job and up to 60 minutes waiting for the proposal's own hourly wake (C2). 65 hours of the 97 are the wake. For comparison, Process3 took 4 days 5 hours from its first layer close to its eleventh, with every layer's jobs started together.

**What the notification clause costs on this map.**

| Users of a module | Median | Mean | 90th percentile | Maximum |
| --- | --- | --- | --- | --- |
| Direct (modules that declare a use of it) | 8 | 14.2 | 31 | 213 (`setup-words`) |
| Transitive (users, their users, and so on) | 70.5 | 79.0 | 162 | 217 (`setup-words`) |

27 modules have no users. Among the 193 that have any, the medians are 10 direct and 82 transitive. 28 modules have 24 or more direct users, so one interface change in any of them notifies more modules than the proposal's bound allows jobs. The most-used providers: `setup-words` 213 direct, `test-support` 153, `record-grammar` 132, `record-core` 116, `membership` 116. Process3's measured mean of 15.2 notifications per notice matches the direct mean of 14.2, so Process3 notified direct users.

## 4. Requirement 4: parallel jobs under a bound the owner changes

> The build plan is designed around parallel jobs running, with the concurrent job count bounded by a user-changeable number.

### 4a. Clauses

| Id | Clause | Test |
| --- | --- | --- |
| 4a | The build plan is designed around parallel jobs | The plan states which jobs run at once and is laid out for that |
| 4b | The concurrent job count is bounded by a number | A number of jobs, and the count does not pass it |
| 4c | The number is user-changeable | The owner changes it, and by requirement 1 he does so with a setting |

### 4b. How the Foundations and Ledger meant it to be met

- P10: "all the module jobs of a layer run concurrently". Its note: "Keep concurrency, which was lost and is why Phase 2 planned only two jobs".
- A job's life 1: "as many at once as the live-session limit allows".
- Platform section: "at about 50 live sessions the account stops starting new ones, while the create call still reports success. So the process keeps at most 24 live sessions by default, and BOB fills that room with jobs for the ready work; BOB may raise or lower that number from what it measures, and records each change (your word, 1 Nov)."
- Unattended condition 4: "The live count stays at 24 or fewer, and every new session is checked to have started."
- ARC-2: "Makes parallel jobs safe from overwriting each other."

In the Foundations the number was BOB's to change, and it counted live sessions. The restated requirement makes it the user's and makes it a count of jobs. The owner's field report gives his default as 20.

### 4c. What Process3 did

| Clause | Process3 actual | Source |
| --- | --- | --- |
| 4a | Parallel in fact: 84 distinct jobs landed on 4 Nov; 24 landings in the peak hour (7 Nov 18:00Z). On 5 Nov the merge train made landing serial: median 348 minutes from complete to merge. | product_side 2, 7; redteam 5 |
| 4b | The number moved at least four times: 24 by default; "about 6 job sessions" on 4 Nov, followed for about six hours; "session caps (jobs 4, lanes 1)" after the suspension (process PR 205, life 2.7 days); `"pacing": {"jobs": 20}` in `process/config.json` at the end. Above about 50 the platform fails silently. | causal_forensics 3C; change_sample row 205; `process/config.json` |
| 4c | The owner never set it by a setting. Sessions set it, in a config file and in handoff notes. Once a session's own number was recorded as his: "the coordinator's number recorded as Bob's agreement". | causal_forensics 3C, 4.1 |

### 4d. What the proposal says, clause by clause

| Clause | Result | The proposal's words |
| --- | --- | --- |
| 4a designed around parallel jobs | MET, by breaking 3e | P3: "A layer's jobs start together." C2: "room for about 576 job starts a day against a peak of 135 landings". G5 sizes the gate for 24 landings an hour. The width comes from running users beside their providers. |
| 4b bounded count | PARTLY | C12: "Live sessions stay at or below 24, and ARCH archives a job's session when its pull request merges." Held by "ARCH's pinned text; count on the daily report". It counts live sessions, which includes ARCH and may include idle sessions (test 5 does not yet know). It is a sentence ARCH is asked to follow. Known limits: "a job is not physically prevented from starting a session." N7 deletes the "six-job limit". |
| 4c user-changeable | CONTRADICTED | The number 24 is written into ARCH's pinned text. Changing it means a pull request from a fork to the process repository, merged by the owner, inside a 4,096-byte cap, and N2 allows "One process version per run". The proposal's number is not the owner's default. |

Items that touch requirement 4: C2, C12, P3, G5, G7, N2, N7, the daily report ("live sessions"), test 5, Known limits.

### 4h. Where the bound lives, who can change it, and whether that is a setting

| Question | Answer |
| --- | --- |
| Where it lives | In the ARCH text in the process repository (C12), pinned into the product at one commit per run |
| What it bounds | Live sessions, not concurrent jobs |
| What enforces it | Nothing. ARCH reads a sentence; the daily report prints a count the next day |
| Who can change it | The owner only, by merging a process change that a session drafted in a fork |
| When | Between runs, or mid-run as a counted process version |
| Is that a settings change | No. It is a merge of a file change |
| The admission table's correction | "The bound is a repository variable in GitHub's settings, which is a setting you change". No item carries it. A repository variable is a GitHub setting, but it is not a permission or a rule. Whether the sessions' collaborator account could change a repository variable itself was not tested in any evidence file, and GitHub's API documentation is worth checking on that point before it is relied on |
| Other bounds the owner does not hold | About 50 live sessions on the account, failing silently (measured 1 Nov). 20 concurrent Actions runners on the Free plan, which the proposal's gate budget exactly fills at 24 landings an hour (G5) |

## 5. The five interruptions

### 5.1 Permissions

| | |
| --- | --- |
| Items | Six conditions 3 ("Refusals come from GitHub. The tool that remains reads and prints."); N1; working agreement 2 ("You may do these without asking: the listed acts for your role"); G3 (approvals rewritten to name auto-merge); C7 (deny lists); C11 (approvals fingerprint removed); G10 (secrets out of sessions); N7 (deletes "tranche-open grant trials", "settings rollback refusal"); tests 1, 3, 5, 6 |
| Physical | Deleting the tool's 818 stop sites. Deny lists, which remove a tool from a session (measured 1 Nov). GitHub rulesets |
| Text only | The list of acts needing no permission. The approvals in `CLAUDE.md`, which are text the classifier reads (0 refusals in about 450 acts in Process3) and which only the owner's hand may write |
| Left unaddressed | A session paused by three refusals "waits for a person" (measured); the proposal removed the sweep and watcher that caught it and added only ARCH's hourly look at jobs. The 20-refusal hand-off in Auto mode. New dependence on judged acts that the Foundations ruled out: archiving (C12, C6), task switching (G9, C3), workflow dispatch (F1), a task's fresh session starting sessions (measured 0 of 3). PLT-9's check that a missing grant stops a tranche at its open is deleted, so a missing grant is met mid-run. Every missing approval is an owner file edit. G2 adds a new refusal: any job that needs to touch a walker step or a workflow now stops at the owner. The claim "Of 508 landings in Process3, none touched these paths" sits beside the feasibility review's finding that the walker is "a module that jobs edit" and that its step count moved from 238 to 357 in one round; the two were not reconciled |

