**GitHub's own rules** are your settings. Sessions act as a second GitHub account that can push and merge but cannot change settings. No branch can be deleted or overwritten. The tranche branch takes a change only by pull request with its tests passing.

**How a session must be started** for both to take effect: with one repository only, because a session that holds more loads no deny list; from the newest commit of the tranche branch; in Auto mode; and with starting instructions that name every act it may take. ROOT, started by your plain prompt, does not meet the last condition. Whether that works is unproven.

**ROOT's start and your newest approvals.** Your hint of 14 Nov: "ROOT starts with the product repo, which contains the needed approvals in CLAUDE.md and settings.json". What happened in Process3, checked by a worker on 14 Nov against Process3's log and the product's history: a session runs on a cloud machine that is handed a copy of the repository when it starts, and reads your approvals from that copy once, at the start. On 5 Nov you started ROOT on the correct branch. The machine was handed a saved copy of that branch about an hour old: seven changes behind, and without the approvals you had committed sixteen minutes earlier. ROOT's first check noticed and ROOT stopped. Another session sent it one message, it fetched the newest copy, and it carried on. On 8 Nov the same happened with the same saved copy. The fifth draft said that a ROOT you started "plainly came up on the main branch, which held old approvals, both times it was tried". That was wrong in three ways: you did not start it plainly, you pasted the starting text Process3's tool printed; it was not on the main branch; and you started ROOT three times, the first of which landed on the newest copy. The fifth draft then asked you to make the tranche branch the default branch. That would not have helped, because ROOT was on the right branch, and Claude has withdrawn the request. *Claude decided:* ROOT's first act is to fetch the newest copy of its branch, and to stop if it cannot. That is what actually ran, twice. Unproven: why the cloud handed out an old copy, whether it still does, and whether approvals that arrive after a session has started count the same as approvals read at the start.

**How the process reaches a session.** The fifth draft never said. Lines you kept in your ledger do: "A session works on one repository, the product's; the process is a read-only clone at a pinned commit." And: "A product's tranche runs on one pinned process version from open to close, named in the plan". In plain words: the product names one fixed version of the process, and each session fetches a read-only copy of that version. Process3 ran that way. The rest of the second line, that every session checks that version once at its start, ended with the checks in section K.

**Working rules that exist because of the checker.** One judged act per command. A refused act is never reworded or handed to another session. Three refusals in a row stop a session, which is replaced.

**Wording changes only you can make.** Your approvals still say "Process3", "BOB" and "layer close", and carry a dead clause on a reviewer's exemption. In settings.json the rule that allows pushing names the Process3 tool by its file path and must match Process4's tool, or no session can push; and two retired hooks (commands run before every command of every session) are still there.

**Proven and not proven.** About 700 merges with no review went through Process3's tool with no recorded refusal (measured). Process4's tool is unmeasured.

## J. What is kept from Process3

**The line-by-line account.** Your answers of 14 Nov move some of your 288 requirement lines between kept, changed and ended. They were not recounted for this draft; the appendix that lists them one by one will be redone to match it.

**A check that could stop work stays only if this document names it.** Named: the three tests, and the start-up comparison of your approvals (section L, item 11). The process's own tool has its tests, which run only at PROCESS (section E). The other checks Process3 had that could stop work end (section K). *Claude decided* who builds and commits built files: the module's own job, in its own pull request. This goes against a line you kept, that a job never commits a built file, and is open with you (section P).

**Your ledger.** It still shows "keep" or "modify" for every line this definition ends. Your ledger is yours to change.

**Kept, by theme.** Git and GitHub hold all state, with one writer per file. A session acts only on what it has read in full or measured. One total order of modules, one owner module per file, and requirements in a public and a private part under permanent numbers. The process stands only on measured platform behaviour. One short rulebook per role, at most ten rules. The product's CLAUDE.md stays under thirty lines. The process has its own repository and one fixed version for each tranche, moved only with your prior approval. The eight things you dropped in your ledger stay dropped.

**GitHub's published limits.** The fourth draft asked how they are kept to. Your hint of 14 Nov: "same as in process3". Claude reads this as: the way Process3 kept to them is carried over unchanged. Claude has not yet looked up what that way was. Process3's decision record quotes you on 9 Nov: "don't do it beyond just making sure that we don't exceed published limits".

**The tranche report.** One report, written once by ARCH at the tranche's end (*Claude decided* who), only from what git and GitHub already hold: time, work done and left, anything deferred and why, cost where it can be read ("unmeasured" otherwise), the overhead share, ARCH's idle time while work was ready, and your minutes. No number is a target. Nothing reads the report to decide anything.

## K. What ends, and why

**Under your decisions**

- **Layers.** Lines 7 and 24.
- **The full regression and whole-product checks before a release.** Line 6. Claude reads line 6 as also ending the option, in your ledger words of 31 Oct, to have them run "when I ask for one"; that is Claude's inference, not a decision of yours. *Claude decided* that your word to the coordinator still runs the internal walk at any time.
- **Deliberate-fault sampling of tests on payment and data paths.** The record of 13 Nov lists it as ended by line 5. That list is the recording session's own sentence, not one of the recorded lines of your decisions. It was never built.
- **Review by a fresh reviewer** (line 21), and a helper briefed to review (your "agreed" of 14 Nov, section C).
- **The other checks that could stop work.** The fourth draft's proposal 13: your words "three tests and no others" end the checks below, though your ledger still shows each as kept. Your answer of 14 Nov, exactly: "three tests and no others". Claude reads it as ending these checks; say if you meant otherwise:
  - the check that a job wrote only its own module's files (the rule itself stays: line 14 and your words in section C);
  - separate install and upgrade tests before a release;
  - three checks that ran beside a module's tests: that a job's new tests fail when its change is undone; a second run of the module tests on the merged result; and that built files match their sources;
  - the check of your credentials when a tranche opens; the check of the process version at a session's start; the check that the process files a product holds have not drifted; the guard on your approvals block inside Process3's record check; the format and coverage checks beside a module's tests; the re-run of checks when a tranche closes; and the check that no built file is committed.

  Measured: the only firings of the own-files check found in the record were three false alarms, and neither release test was ever built. One consequence: with the guard gone, nothing in git stops a session's pull request from changing your approvals; what remains is the permission checker.
- **A default of 24 live sessions** (your Foundations, 1 Nov). Line 9 makes it eight.
- **Updating the installer and website as part of ending a tranche** (your words of 8 Nov), on your words of 14 Nov: "installer and website are outside the tranche" (section B).
- **Parts of kept lines:** the word "layer" wherever it appears; tests run "at layer close" or "nightly"; the "one full test run" after a change across many modules.

**Proposed for ending by Claude.** These change lines you kept in your ledger or duties in your Foundations. The fifth draft ended them without asking you. They are now proposals for your yes or no (section P, the seven proposals). Until you answer, they are proposed for ending, not ended.

- **The first of your two health numbers,** false "done" claims caught by independent re-verification. Proposed for ending (proposal 1), because the re-verification it counts ended with lines 5 and 21. The second, the cost of each pull request that survives, stays as a reported number where cost can be read. Neither was ever produced in Process3.
- **Three measurements your ledger asked for,** proposed for ending unmeasured (proposal 2): an architecture session that keeps no memory between wakes (a session started by an alarm could not start sessions: 0 of 3, measured); trimming each role's principles by the line-by-line test (section L, item 8); and the share of ARCH's work that is passing things on.
- **Two duties from your Foundations,** proposed for ending (proposal 3); the fifth draft ended them under your words "three tests and no others", but you were not asked whether your words reach that far: counting refused acts and trying them again when a tranche opens and at each model release; and removing parts of the process one at a time at each model release to see whether they are still needed.
- **Two more duties from your Foundations stay,** neither as a check: the alarm for lack of progress is ROOT's hourly wake; and confirming that a session it started exists is part of the act of starting a session.

## L. Earlier requirements Claude proposes to end, or has kept, on the evidence

These too change lines you kept in your ledger. The fifth draft ended items 1 to 8 and item 10 without asking you. They are now proposals for your yes or no (section P, the seven proposals). Until you answer, they are proposed for ending, not ended.

1. **The job's written receipt** of the commands it ran. It caught nothing in 1,187 test runs (measured), and Process3's decision record, written by a session, quotes you on 9 Nov: "get rid of it completely". *Proposed for ending* (proposal 4).
2. **The set-up check before every job start.** It refused every job start after you applied new settings (measured). *Proposed for ending* (proposal 4). The fifth draft said it ended on your instruction of 9 Nov. That was wrong. Process3's decision record, under your quoted words ("Is this needed at all? If so, it must be done efficiently. If not, then cut it."), kept the check and had it run less often: once for each version of the process instead of before every job. Ending it was Claude's doing.
3. **The size cap on a module's requirements file.** Built as a refusal, it was overridden 32 times out of 32 (from the earlier review; not re-measured). *Proposed for ending* (proposal 6).
4. **Recording each job attempt's reading list and cost.** Made compulsory, the cost figure blocked every job completion for 45 minutes (measured). *Proposed for ending* as a duty on jobs, and the cost alarm in your ledger with it (proposal 5).
5. **The check that fails a commit adding an oversized file or a file in a temporary folder.** The record check it was part of gave 947 findings on its first run (measured). *Proposed for ending,* with the record check itself (proposal 6).
6. **The job record as a strictly formatted data file.** Your ledger asked for the experience to be measured; it never was. 105 of 508 merges changed nothing but these records (measured). *Proposed for ending,* on cost (proposal 5).
7. **Every rule must cite a measured failure or your decision.** Checks were added in 41% of Process3's merges both before and after 5 Nov, each with a citation (measured). *Proposed for ending* (proposal 7). Every process change now comes to you at PROCESS, whatever it cites.
