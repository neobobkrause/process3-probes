# [file] point5_288_lines.md (continued)

- **What the draft does.** Two things, three lines apart. It ends "the check that no built file is committed" on his answer to proposal 13 (v5:327). And it has Claude decide that each module's own job builds and commits its built files in its own pull request (v5:305). The second reverses the rule, not only the check, and the draft does not name the line it reverses.
- **Why.** The third draft gives the reasoning: "The rule that a job commits no built file stays as text, but nothing now names who builds and commits built files. *Claude decided:* the module's own job does, in its own pull request." (v3:219.) In the line's own design the built files were committed once at the close of a layer; layers ended (record line 7), so that moment no longer exists, and the session gave the task to the job. The fourth and fifth drafts kept the decision and dropped the sentence saying the rule stays. The session's own notes file it among things "Left as "Claude decided" because he did not define them" (`process4/working/v4_notes.md`:52), which is wrong: he kept a line on exactly this (V for the quotations; J for the account of the cause).
- **What follows, per the audits (A).** With eight jobs open at once, a built file holding several modules' code is rebuilt by every job that touches any of them: either the jobs collide on it at each merge, or the copy in git is stale and the external walk walks old code (`process4/working/audit2_corruption.md`:288). In Process3, 86,347 lines of generated data once sat in the product (audit:82).
- **The options the audit gives** (`process4_audit2.md`:138): (a) built files are not committed and the deployment step builds them, "as Process3's did", which keeps his line; (b) the reversal stands, as a change to a line he kept and his to approve. Under (a) there is nothing for him to decide; under (b) it is a proposal to him.

## 6. What is Bob's to decide, and what is Claude's work owed

### Bob's

1. **The seven proposals of the 33** (section "The 33, grouped, as proposals"). Inside proposal 3, and for the nine lines flagged in section 2, the prior question: whether "three tests and no others" reaches (i) tests and trials of the process, as distinct from the product, and (ii) checks of the kind named in proposal 13 that were not themselves named there.
2. **Which governs** (audit question 6): option (a) or (b) of section 4.
3. **F-HUM-9**: whether the architecture session may still restate one of his lines and report it in one line, or whether his rule of 14 Nov replaces that line. With it, the lines of group H (MNT-3, MNT-6, and what remains of MNT-9, MNT-10) that give the process its own tranches and releases.
4. **Built files**, only if the reversal is to stand (question 10, option b).
5. **The ten lines that rely on the status command**, only if they are to end.
6. **JOB-4**, as part of audit question 4: what a job held by a process fault does while the fix waits for him.
7. Whether the answer he gave to proposal 13, "three tests and no others", was a yes to each of the thirteen named checks. The draft reads it so; 14 of the 75 lines rest on that reading (A: audit finding 14a; V for the count of 14).

### Claude's work owed

1. Write the 33 as proposed, not ended, until he answers; say for JOB-7 that the 9 Nov sentence is the decision record's, and correct the statement about the set-up check (section 2, group 4).
2. Put the 53 back: state the 42 that, by my reading, conflict with nothing; for the five with a partial tension (REQ-3, ARC-5, ENF-1, F-PLAT-16, SHM-2) state the part that fits and name the rest; and restore a sentence saying that a kept line the definition does not mention still stands. Bring the six that conflict to him (F-HUM-9, MNT-3, MNT-6, MNT-9, MNT-10, JOB-4; items 3 and 6 above). The appendix codes only the first three as conflicts; the other three are my reading (J).
3. The status command: restore it as a thing the tool does (a read; the audit notes it "refuses nothing", audit:97), or put the ending of the ten lines to him.
4. Built files: restore the line, or put the reversal to him.
5. PLN-4: one clause saying it has lapsed under his words on rounds.
6. Name a decider for the four lines changed with none named (REC-11, F-FOR-3, GAT-6, F-JOB-5), and decide whether the 15 changes of way made by Claude's decision are technical matters to report or changes to what he defined to propose (J: F-FOR-3, lanes "for design areas you identify", belongs to his sixth message on lanes and should not be left as Claude's).
7. Move the two endings filed under his decisions on a session's sentence (JOB-13, TM-10) onto his typed sentence as Claude's reading (A: audit finding 15).
8. Then bring the appendix into line with the sixth draft.

Nothing in this list adds a test, gate, review or check; restoring a line that is itself a check is his choice under item 1, and is not recommended here.

## 7. Found wrong, stale or imprecise in the handoff and audits

1. **The set-up check and the 9 Nov record** (new). The draft, and the audit after it (audit:104, "the draft quotes him from Process3's decision record of 9 Nov"), treat the quotation "If not, then cut it" as asking for the ending of the set-up check. The record's decision under that quotation kept the check, run once per pin (DECISIONS.md:158, 163) (V).
2. **"three measurements you asked for in your own words"** (audit:102) is imprecise. For two of them the measuring was the page's suggestion and the stored notes add only "I'm skeptical, but let's" and "I'm skeptical, but let's try to" (LL:1053-1055, 1122-1124); the third is in a note written in by the coordinator and in the Foundations' table (LL:1044; FD:274). Only REC-9's note is labelled his own words (LL:297) (V; the labels are A).
3. **33 or 34.** The appendix's prose counts 34 rows in which Claude ended something; its code column counts 33; the difference is SES-15 (section 1) (V).
4. **`process4/working/appendix_recount.md` is stale for this purpose.** It is the recount of the second draft's appendix (186 kept, 46 way changed, 15 + 11 ended, 27 ended in part, 3 open) and should not be read as a count of the fifth draft (V: its lines 1-22).
5. **Paths.** The audit and `audit2_notes.md` cite `/home/user/handoff/...` and `/home/user/work/...`; neither folder exists here; the files are under `process4/definition/` and `process4/working/` (V).
6. **The handoff's sentence** "his ledger and Foundations still say the opposite of the definition for 75 lines" is right as a count, but 39 of the 75 are ended in one clause only, and the lines that read differently from the definition number about 122 when way-changed and contradicted lines are included (section 4) (V counts; J the sum's meaning).
7. **"ARCH was replaced 21 times"** is repeated at audit:64 and v5:147; the combined audit corrects it to 21 sessions and 20 replacements (`process4_audit2.md`, section 4) (A).
8. Not re-checked by me: the measured figures the draft gives as reasons for the endings (1,187 test runs, 45 minutes, 105 of 508, 947 findings, 32 of 32, 41%, 8 KB to 134 KB), the register entries, and the claim that a Process3 session restored a check by citing Ledger lines.


# [file] train-plain-options.md

# Plain merges beside the merge train: options (build/train-plain, 5 Nov)

## The problem (copy, 5 Nov 08:00-08:34)

The train (tool/lib/train.mjs) is the one steady writer to the tranche: it lands job pull requests
one after another, each re-gated on the job merged with the tranche as it is. Every other pull
request into the tranche (BOB's plain ones: found marks, ledger entries, an untracked generated
file; and pin moves, `merge --plain --as pin`) goes through `merge <pr> --plain` from another
session (merge.mjs mergePlain). Such a merge needs its required checks green on a head that has
the current tranche. The train moves the tranche every few minutes (green to merged median 8.7
min in the simulation, 11 in the merge rows), so a plain head brought up to date goes stale
again before its own gate ends, and the plain merge fails: PR 338 twice; the ledger PR 465 held
7 job starts behind it. Nothing pauses the train; this morning the coordinator stopped it by hand
for a 15-minute window.

notes/merge-train-trial.md, named in the brief, is not on the tranche or any branch fetched here;
the train's own header and notes/train-throughput-study.md's order were read instead, with
train.mjs, merge.mjs (merge, mergePlain, mergeRetry, waitForChecks), order.mjs and
tool/test/train*.test.mjs, merge*.test.mjs.

Measures used below: P, a plain pull request's gate on an up-to-date head; J, a job's re-gate (the
train's land interval while it has a queue). A plain change touches records only, so its gate
often runs no suite (trigger record-since-green), but a ledger entry or a pin move runs one: P can
be as long as J.

## A. The train takes plain pull requests and pin moves into its queue, ahead of jobs

How it works. `merge <pr> --plain ...` into the tranche, while a live train lease is held, does not
merge: it checks what it can check now (the plain rules: not a job branch, mergeable, the module
files, the pin, the workflows) and records a queue row on the state branch (`merge train plain`):
the pull request, its head, the review flags as given (BOB's, as a review note is), and `--as`.
The train reads the rows each round. A queued plain pull request goes before every job (the oldest
row first). The train brings the tranche into it (a merge commit pushed to its branch, only when
the merge is clean; a conflict goes to BOB), waits for the required checks on that head, and
lands it through mergePlain itself, its checks all run again on the merged head, with the review
record from the row in the merge commit's message, and the pin wake for `--as pin` from mergePlain
as now. The row's head must be the head's first parent chain down through the train's own clean
merges of tranche commits, so the change reviewed is the change landed. One train row per try, as
for jobs.

Throughput. The train lands nothing while the plain gate runs: one P per plain pull request, the
same as any job in front of it. It keeps preparing the next job while the plain gate runs (the
prepare step is unchanged), so the next job lands within seconds after. No idle wait for a second
session, no 15-minute window, no retries.

Gate strength. Unchanged: mergePlain runs every check it runs today, on the head that lands, and
GitHub's ruleset still judges the required checks. New: the train pushes a merge of the tranche
onto a non-job branch (it does so on job branches today). The review covers the queued head; the
first-parent check holds that nothing but clean tranche merges were added on top.

Code. About 150 lines in train.mjs and merge.mjs (the queue row, its read and order, the sync and
its first-parent check, the land through mergePlain) and 120 of tests.

## B. A short train yield: `merge train yield --minutes <n> --for <pr>`

How it works. The plain merge's session writes a yield row (bounded, at most 30 min; ends at once
when that pull request is merged or closed). The train, before it starts each merge, reads the
rows; under a live yield it starts nothing new and writes an ack row once its merge in flight has
landed or failed. The plain session waits for the ack, brings its pull request up to date, waits
for its gate and runs `merge --plain` as today.

Throughput. The train is idle for the in-flight land's wait plus one P, and the time the plain
session takes to see the ack, sync and start (that session may be mid-turn: minutes more). A yield
that lapses before the plain gate ends leaves the same race as today.

Gate strength. Unchanged: mergePlain itself is not touched.

Code. About 70 lines (the yield and ack rows, the train's check, the wait in the plain session)
