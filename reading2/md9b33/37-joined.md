# [file] verify_numbers.md (continued)

| Stop sites | **818** `fail(` call sites (PR 37: 141); 73 `throw`; 82 `findings.push(`/`finding(` sites | `git grep -o` |
| "refus*" strings | 464 in tool code (678 more in tests); 32 literal "refused:" messages | `git grep -o -i` |
| Setup conditions | **22** entries in `setup/conditions.json` (14 at PR 15, 18 at PR 24, 20 at PR 56, 21 at PR 202, 22 at PR 239) | JSON parse |
| Tests | **112** `.test.mjs` files (129 files under `tool/test` with fixtures and helpers), **1,223** `test(` calls, 28,882 lines | `git ls-tree`, `git grep` |
| Decision records | **31** headings in `DECISIONS.md`: PD-1 to PD-25 plus PD-19b (26: 23 attributed in their own heading to the coordinator, 3 to Bob, namely PD-21, 22 and 25), BD-R1 to BD-R5 (5, all Bob's). By heading date: 3 on 6 Nov, 5 on 7 Nov, 12 on 8 Nov, 11 on 9 Nov. The file did not exist before 6 Nov. | `grep -E '^##+ (PD|BD)-'` |
| Principles | Foundations table rows P24, P25, P26, P27 exist, each marked "(Bob's, 6 Nov 2026)". P-numbers cited anywhere in the file: 25 distinct, P1 to P27 with no P14 or P15. In git only from 7 Nov 05:51Z (PR 233). | `git show`, regex |

Review's "P24 to P27 added" and "PD-17 is still in the decision record": **confirmed**. The 18 -> 22 setup conditions: review gives only the 18; **confirmed**.

## 9. Material points the review misses or gets wrong

1. **The cuts did not hold, and the review does not say so.** Each of the first three large cuts was regrown to its pre-cut code size in 9 to 21 hours (table in section 5). On 9 Nov, in the 3 h 22 min after the usage-ledger cut merged, six more PRs merged (one the second cut, one the owner's settings edit), including a new merge design (PR 299, "direct flow", PD-25: +386 code lines, +22 `fail(` sites, 16:04Z). The tip has the highest `fail(` count of the week (818) and 575 more code lines than the day began with. The review's own headline metric ("refuse" strings) falls on 9 Nov and so hides this.

2. **One of Bob's four 9 Nov cuts never landed.** `DECISIONS.md` PD-21 cut 2 records "process3's own CI runs the tool tests once, on Node 22" and lists "one CI run instead of two" as a consequence. The change was split out as PR 297 (`origin/build/c57-ci`, last commit 9 Nov 15:49Z) because the merge tool holds workflow changes for Bob's word, and it was never merged. `.github/workflows/ci.yml` at the tip still runs the whole suite twice (Node 22 and Node 26). The decision record states an outcome the repository does not have.

3. **Day counts mix time zones** (section 1): 61 is a Pacific day, 75 a UTC day, and they overlap.

4. **"302 times" overstates.** 294 merges; 252 touched tool code; 14 of the merges are the owner's own approvals and settings edits through GitHub's web editor (`neobobkrause-patch-*`), and 5 PRs never merged.

5. **Deletion figures are on mixed bases** (section 5): the two largest-sounding ones (-9,252 and -1,273) are gross; net they are -7,941 and -904.

6. **The peak is understated** (24,897, not 23,900), a small error against the review's own argument.

7. **The 5 Nov "subtractive audit" was nearly cancelled within ten hours.** PR 177 cut 278 tool-code lines at 20:57Z; PR 185 ("audit-restores", 6 Nov 06:45Z, 9 h 48 min later) added 222 back. The review reports the restore but not that it returned 80% of the code. In the 18 hours after the audits the tool grew by 1,480 to 2,410 code lines depending on the window's start (review: 1,740; roughly right).

8. **Where the sentence was** (section 7): in every ROOT/BOB/watcher prompt and the review brief all week, which the review's "Why" section omits; absent from `CLAUDE.md`, the coordinator's prompt and all 26 coordinator handoffs, which supports the review's conclusion more strongly than the review's own wording does.

9. **Same-day reversals inside the record that the review does not list**: PR 106 (4 Nov 12:15Z) removed the `--cost-usd` requirement PR 105 had added 45 minutes earlier; PR 118 reverted PR 112 after 2 h 9 min (the review has this one); on 9 Nov 13:58:32Z, 24 seconds after the coordinator's note "Bob's audit ask; safeguard freeze" (13:58:08Z), PR 293 gained a commit "Revert the cold review's added safeguards (coordinator: none beyond the three rules)", i.e. a builder had already written review-driven safeguards into a PR whose purpose was to lighten triage.

10. **The record after the last merge.** `origin/tranche` stops at 9 Nov 18:13Z. The coordinator branch carries hourly notes to 23:52Z and ends 10 Nov 00:51Z with "hourly paused while waiting on Bob". `origin/process-state` (process3's own state branch) is 157 commits, 156 of them "github: N minute(s) of use" rows from 8 Nov 18:32Z to 9 Nov 15:48Z, an hour after the ledger was deleted from the tool. `origin/main` has not moved since 2 Nov 18:08Z (confirmed, as the review says).

## Claims I could not check from this repository

Product landings per day (135 -> 3), the 98 version moves (the coordinator log's highest pin label is pin-91, which is consistent), the 25 coordinator sessions (26 handoff notes exist on the coordinator branch, which is consistent), everything from session transcripts, all timing of the owner's words, the catch counts in "What the checks caught", and the per-PR trigger tags (failure / owner's words / plan row).


# [file] process4_audit2.md (later part)

**Only the first real tranche** can show whether a tranche can end, whether the checker goes on passing merges, and how often a process fault waits for you.

## 6. No answer found

1. **Nothing makes a tranche end.** No walk came clean in Process3 and rounds are unbounded. The audits found only the tranche's size (question 2), which is yours.
2. **A session loosening a walk step, or merging before the walk is clean.** One session reads the report and merges. Every stop the auditors could see is a check or a gate.
3. **A walk step that fails for no reason in the product.** About 68 of the 147 failing steps of Process3's last external walk were one crash of the walker's browser (measured). The remedies seen are running it again or excusing it.
4. **Growth that leaves no record:** a session more cautious in its own work, demands typed into another session's instructions, a process rule written as a product decision. Any stop there is a check.
5. **A test that passes whether or not the change is there, and failing tests that travel to the main branch unseen.** Ten of twenty recorded false "done" findings were such tests (measured). Every remedy is a check you have ended.
6. **Telling a correction of the process from an addition** without someone judging it. The draft now says nothing on that line; at PROCESS the judge is you.
7. **Your approvals behind the permission checker alone,** if you count the setting in question 9 as a gate.

Also: why GitHub suspended the sessions' account on 6 Nov was never learned, and nothing found prevents a second suspension.

## 7. Since the first round

**The 87 entries of the first round.** The three audits name 56 of them. Counted by this worker from the auditors' own labels:

| What the second round finds | Entries |
| --- | --- |
| Answered, as far as it goes (all unproven) | 6 |
| Answered in part, or in a way the auditor finds does not meet it | 16 |
| Still open | 31 |
| Reopened (the watcher, by your question) | 1 |
| Named with no verdict | 2 |
| Not named by any auditor this round | 31 |

Of the twelve the first round marked "no answer found", nine are still open, one is answered in part by your words, and two were not named.

**Findings this round: 51** across the three reports. Fourteen are wholly new, eighteen are older arguments with new parts, and nineteen were raised before with nothing new. Several are one matter seen from two or three sides; this worker did not count the separate matters.

**The most important entries answered by your own words.**
- *A product that fails when deployed reaches the main branch by design.* Answered by: "So a tranche only ends when an external walk (of a development deployment) completes without flaws." (14 Nov). The release part is still open (question 7).
- *A fault in the process has nobody to report it, judge it or start the fix.* Answered for the route by your paragraph on PROCESS and your hint of 14 Nov: "ARCH can ask ROOT to start PROCESS if it isn't already running, and the coordinator can talk to PROCESS." What holds the rule is still open (question 3).
- *Your words of 8 Nov on when a tranche ends were overturned without telling you.* Answered by your words of 14 Nov on the tranche and your three answers on the release.
- *The check on declared uses either fails on day one or cannot see the hole.* Answered by: "I think it has to check tests too" (14 Nov), with 122 undeclared uses to be corrected first.


# [file] bob_naming.md (later part)

## 3. Direct confusions

**Found.**

- **`--owner bob` means the person; BOB used it to mean itself.** `job block --owner bob|coordinator` was added on 5 Nov 02:05 (`3234ba8`): "`bob` only for a requirement question". At 04:18 the coordinator asked BOB to "record deferrals with owners ... (owner BOB)". BOB recorded six blocks with `"owner": "bob"` (citation, contradiction, op-grades, agent-steps, ai-use, investigation; ledger entries at `688df6c528`, `e0fdf3988c`, `fe4bd535e1`, `6256318a32`, `4bf28351da`, `34df18c91d`). `status.mjs` prints that owner as "Bob". ROOT's sweeps then sent BOB 68 lines such as "citation: BLOCKED; blocked 991 min; ruling owed by Bob: Deferred (coordinator ruling 5 Nov 04:18)" and "ruling owed by Bob: Routed (BOB 5 Nov 05:22)", in 19 messages from 5 Nov 05:17Z to 6 Nov 03:52Z. None was a question for the owner. The log never notes it, and the flag is unchanged at the tip.
- **Capitals in the coordinator's log.** 45 log entries use both senses in one line, for example "BOB'S WORDS (8 Nov 2026): "I agree with the new wording ..." ... Sent to BOB to place". The same hour has "14:50 BOB (verbatim): "I think a big part of what we're experiencing ..."" (the person) and "14:50 BOB: --ready on 74c3679 saw 2 startable" (the session). "BOB'S DECISIONS: "agreed" to (1) BD-5 product principle" (the person, 18:15) is followed by "BOB's BD-5 = layouts.html" (the session, 18:20). Handoff 5nov-c has "BOB ASKED, NO ANSWER" for a question put to the person, and 5nov-f has "MY STANDING RULES TO BOB" (session) above "STILL BOB'S" (person).
- **The sessions saw it.** From 4 Nov 21:35 coordinators added "(Bob)", "(Bob, the owner)", "(Bob, in this session)" or "(verbatim)" to 31 of the 93 headings, and once wrote "BOB (session) finding". ROOT's prompt says "Bob, the person" (`c7ba5d2`, 3 Nov).
- **The coordinator was itself called BOB on 4 Nov.** Handoffs 4nov and 4nov-b open: "Bob is the owner; his words are instructions. You are BOB, the Process3 coordinator; Bob defines, you decide everything technical". From 4nov-c it is "You are the Process3 coordinator". BOB's prompt still says "You are BOB, the coordinator for <slug>", and a job's START says "Your coordinator is session X (BOB)".
- **Case-only authority in the canon.** Ledger map: "PLT-2 ... (restated by Bob, 3 Nov)" and "TXT-5 ... (restated by BOB 4 Nov ...)", and "P17 | Bob defines, BOB decides". Each is right in context (the 4 Nov "BOB" is the coordinator of that day), yet one keystroke changes whose authority a line carries.
- **Example 9 above.**

**Checked and not confusions.**

- "removed by Bob in civicos (K5787)" is the person. K5787 quotes him: "we need to get rid of commits 5480960 and 8082171. They are WAY too inefficient".
- "Bob merged process3 PR 188" and "625 merged by Bob" are the person, by website merge.
- "Bob" followed by a tool verb (runs, starts, lands, records, files and so on): 23 hits across the notes, both repositories' commit messages and the handoff, all the person.
- No session addresses another as "Bob". Second person between sessions is used correctly: about 29 cases of "your ruling", "your word", "your call" from a job to BOB or from BOB to the coordinator or ROOT, each meaning the session addressed. One job writes "words.test R95 (your ruling, Bob's list)".
