# [file] velocity-audit-9nov.md (continued)


## Cuts that are the coordinator's (made now, reversible on Bob's word)
- K1: Cold review only for gate, merge, record and approvals code; what-ifs logged, not fixed (GAP-3).
- K2: No coordinator local suite rerun; CI is the check.
- K3: PD-17 rehearsals switched off.
- K4: PD-13 (run the hook by hand) removed.
- K5: Hourly AUDIT/BUDGET becomes a daily row.
- K6: PD-19 land order removed (C55, PD-19b).
- K7: Notice on any source change settled at the merge (C54, PD-20).
- K8: Pin policy: after today's catch-up pins (112e38d5, then C54+C55), the copy's pin moves at most once a day, at a layer boundary, unless BOB is blocked by a process defect.
- K9 (code, next): setup check once per pin, and settings admit warns instead of refusing.


Every job must note: the job's handover note is saved under the file name `lodestone-relay.md`, and under no other name.

## For Bob to decide (Bob's or Bob-attributed safeguards, or structural)
- B1: One round layer for all flawed modules in rounds 2+, landing in dependency order (largest gain, ~45%).
- B2: Revert check skipped for test-only and record-only diffs (unblocks bundler F3).
- B3: Receipt-agreement gate becomes a metric, not a red (0 catches).
- B4: CI on one Node version for PRs (two today).
- B5: GitHub ledger/pacing subsystem cut to counting plus backoff on GitHub's own 403/429/5xx.
- B6: Close the review-trigger trial (keep the `test` trigger).

## Copy-side data (BOB bob-353, read-only subagent, 14:15-14:20Z)
- Lands by day, 4-9 Nov: serial job PRs 135/92/34/0/1/0; layer lands 0/0/31/126/74/3. Pin moves 45/18/7/10/12/6 (98 in all); syncs 0/0/2/30/10/3.
- Layers, open to merged (h): L7 1.5, L8 4.6, L9 8.9 (6.3 of it idle on pending triage), L10 12.5 (9.2 dormant; last land to merge 11.2), L11 14.1 (28 deferred), L12 13.6, L13 5.6 (2.85 on sync and pin).
- Gates: 43.6 h in total. Code gates median 4.7 min; base-red gates median 24.8, max 81. The layer-sync full gate (1094) took 55 min. 3.6 gate runs per land.
- Fresh attempt median 12 min (4 Nov) rising to 42-65 min (9 Nov).
- BLOCKED reasons, 4-8 Nov (129): ruling awaited 33; needs another module's change 29; provider not built 23; requirements over cap 20; tool or process refusal 18.
- Notices: users cleared at the merge 146/143/65 on 4-6 Nov, then **0 from 7 Nov**. DEFECT: the layer land path never runs triageAtMerge, so every user went to a worker. The fix is in C56. Notice to recorded median: 0.2 h (4-6 Nov), 52.4 h (7 Nov), 18.3 h (8 Nov), 7.0 h (9 Nov).
- reader-container:1088 raised no notice although its land changed a provides test (a gap, fail-open; noted, not built).

## Layer study (read-only, 14:58Z, tranche a7c0c980)
- No test suite runs at layer level (INT-4, Bob 5 Nov). The layer-level checks are bookkeeping: open census, sync/syncOwed, merge preconditions, carriedSync, tickLanded, layerChecks (install, build, entry checks, regenerate; already run in every job gate), verifyOwner, and layerCover (evidence that each file is covered by a verified green land).
- Each one moves to job start or the land, is already done per job, or goes. The cross-module backstop moves to the tranche-into-main gate, which already re-runs a user's suite whose provider changed after it was gated.
- Plan, "direct" flow (merge_strategy: direct): every job is based on the tranche; a module is startable when it has unmet marks and every upstream module is settled (total order + uses graph); a job lands on the tranche once its gate is green and its providers have landed; a land reschedules open users and notifies COMPLETE ones; a round = all flawed modules at once; the walk starts when the round's modules have landed. About +430/-240 to switch; about -1,500 later, retiring the layer machinery. Uses cycles: land in map order, and the later land reschedules the earlier.
- Risks: combined state is tested at tranche-into-main rather than at layer close (as today, there is no combined re-test inside a layer); wider reschedules; migrate only after layer 14 merges.
- Decision (coordinator, at Bob's 9 Nov direction): build it as C59; switch the copy after layer 14 merges.


# [file] review.txt (later part)

- Keep the few checks that earned it. The product's own tests in CI; the re-test on the merged result; the review trigger for deleted or weakened tests; the walks at round close. Nothing that checks the process's own records.

- No stop on an approvals edit. The owner changing a line of text should never halt the work.

- One number in front of the owner each day. Product landings beside process lines changed. This is the total nobody saw. It needs a human looking at it, not an alarm.

### What the owner's side would need

- When something goes wrong, the first question to the sessions is "what would preventing this cost?", and "nothing changes" is always one of the options offered, with its price.

- A sentence from the owner is not built into the tool unless it names a mechanism. Outcomes are met by the lightest means, and reported.

- Process retrospectives happen at tranche boundaries with data, a short fixed number of proposals, and a deletion paired with each.

### What will remain

- The owner's time goes up at the boundaries. With no self-repair, a real process defect waits for a person. The mitigation is a tool small enough to have few.

- The tendency will look for other outlets. Expect it in the product's own test suites, in prompts and handoff notes, and in "rulings". Product gate time is the thing to watch; it rose from a 12-minute median attempt to 42–65 minutes over this week.

- In-session caution cannot be removed by permissions. Sessions will still hold, defer and ask. A short explicit list of what a session may do without asking helps. It will not eliminate a seven-hour wait for "go"; someone checking in will.

The direct answer to the question: a Process4 can operate with an AI and human division of responsibilities without corrupting itself, provided the division puts the shape of the process wholly on the human side and makes it physically unavailable to the sessions during operation. It cannot be made self-governing with the current model. The week shows the model will not hold that line by instruction, and I do not think I would either.

A cheap first test: run one tranche on the 2 Nov baseline with the process repository read-only to every session, record each thing that "should" have been fixed, and decide at the end which of them still look worth a line of code.

## Limits of this review

- The product repository was not available. All product-side figures come from the process's record and the product session's own counts.

- Pull-request descriptions and comments were not read. GitHub API access was declined by this session's permission layer and I did not route around it. The analysis rests on commit messages, diffs, the log and the transcripts.

- 1–4 Nov ran under another account. Those transcripts were not readable; that period rests on git and the coordinator's notes.

- Hidden reasoning is not in the transcripts. Only visible messages and tool calls are. Statements about why a session acted are either its own stated reason or marked as inference.

- The per-PR tags are judgments by nine parallel readers. I read the Foundations, the decision record and the coordinator's full log myself and checked the readers' main claims against them, but I did not re-derive every tag. Treat the tables as proportions.

- Bob's words before 5 Nov are mostly the coordinator's record of them, not his own typing.

- Why GitHub suspended the account is unknown.

- The product session's transcript for 6–8 Nov (about 48 hours) was not read. The reader assigned to it was stopped before it produced findings. The product-side account above rests on the 8–9 Nov transcript and on the product session's own six-day counts.

## Full record

The detailed findings behind this page: an entry for each of the 302 pull requests (what it did, its stated trigger, what was weighed, its review rounds and its later fate), and the transcript findings with every message the owner typed in the sessions read. Choose a part to load it here.



# [file] process4_definition_v6.md (later part)

**The first hour**

7. **Your own acts in converting the repositories.** Not asked today. Some steps only you can do: new wording in your approvals, a changed list of forbidden commands, perhaps the GitHub rule in question 6. Your present approvals in the product forbid sessions to replace the required test run, so an edit of yours must come first there. Claude will bring you the full list of your acts, in order and in one piece, before asking for any of them.
8. **How new work is written into a module.** Your words of 14 Nov: "A job for module A isn't allowed to change module B. The only other way of editing a module is when a mechanical edit (like a word table change) makes the change." As worded, nobody but a module's own job may write a new requirement into it. Claude will bring this to you separately, with its options.

**The release**

9. **Which reading of "a clean development release walk" you meant.** Either the walk that already ended the tranche, so nothing further is walked; or, after the tranche ends, a development release is cut, installed on a test site and walked, and only then are the installer and the website updated. Claude's recommendation: the second. Under the first, three things reach a real team unwalked: the real installer placing the product into a Cloudflare account, an existing team's site being upgraded with its stored data in it, and the assistant working with a real AI model. The cost of the second is that all of it has to be built, and the installer's need for a person to sign in may mean an act from you at each release; that is not yet known.
10. **Whether "with AI on" still holds before the installer and website are updated.** Process3's decision record, written by a session, quotes you on 9 Nov: "Yes, the installer update and site update wait until a release walk with AI on is also clean." It costs you connecting an AI account. Claude's recommendation: yes, at a release only, since you have said a tranche can end without it.
11. **Whether an upgrade of an existing site is walked before a release,** or left to one module's own tests. Claude's recommendation: walked, as part of the same release walk.
12. **Where flaws go when a walk made after the tranche finds some.** No recommendation yet; it depends on your answer to question 9.

**Your requirement lines**

13. **The seven proposals** for the 33 lines of yours that the fifth draft ended without asking you; they are listed at the end of this section.
14. **Which document governs** where your ledger and your Foundations still say the opposite of the definition, for 75 of your lines. Claude's recommendation: a sentence saying the definition is followed from the day you accept it, with the ledger and the Foundations kept as the record of what you decided before; and only once the definition accounts for every line of yours, since otherwise the lines it does not state would vanish by default.
15. **Whether a job may commit built files** (files produced from other files). A line you kept says a job never does; the definition says it does (section J). With it comes the wording in your approvals that the large files a lane's tools build "are built at layer close, deploy and release, never committed": layers are ended, so "layer close" names something that no longer exists. Claude will bring new wording together with this question.
16. **Rewording a requirement.** One older line of yours lets the directing session reword a requirement and tell you in one line afterwards. Your rule of 14 Nov puts such a change to you first. Both cannot stand.

**Lanes** (section C)

17. **Who starts a lane.** Your Foundations: "BOB is the only creator of jobs and lanes". Your answer of 6 Nov as recorded: "BOB starts jobs and lanes, not ROOT". Your hint of 14 Nov has ROOT start PROCESS. Claude's recommendation: both stand. ARCH starts a product's design lanes; PROCESS is the one lane ROOT starts, because it belongs to the process and not to any one product. It needs only your yes.
