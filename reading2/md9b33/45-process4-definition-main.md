A fault that blocks work pauses the product until the process is fixed; the same jobs then continue. A fault that blocks nothing waits for the next tranche.

**The process is completely blocked.** Only then does it wait for you: when no further work is possible until you act. You get one plain message with a numbered list of what is yours to do. An example from Process3: GitHub suspended the account the sessions work under, and only you could write to GitHub. In every other case the stop is recorded as a named blocker and other work goes on.

## F. Permissions

Permission management is Process3's, preserved. It was reached by long trial.

**Auto mode and the checker.** Every session runs in Auto mode, the only mode the platform allows here. The session acts without asking a person, and an automatic permission checker run by the platform judges each risky act and may refuse it.

**Your standing approvals** are a block of text in your own words in the product's CLAUDE.md. It says what sessions may do without asking you and what they may never do. You commit it yourself on GitHub's website. No session writes, edits or relays it, because the checker refuses that. It is the one channel that reaches sessions you did not start: consent merely quoted in a session's starting text was declined 11 times out of 11. A session loads the approvals only when it starts.

**The deny list** is a list in the product's settings.json of commands taken away from every session outright: the ordinary merge commands, so that a merge can happen only through the merge tool; force-pushing; deleting branches; pushing straight to the main branch; and writing files through GitHub's web interface.

**GitHub's own rules** are your settings. Sessions act as a second GitHub account that can push and merge but cannot change settings. No branch can be deleted or force-pushed. The main and tranche branches take changes only by pull request with the tests passing.

**How a session must be started** for both to take effect: with one repository only, because a session that holds more loads no deny list; from the newest commit of the tranche branch, never from the main branch, which still holds your first approvals of 1 Nov; in Auto mode; and with starting instructions that name every act it may take.

**Working rules that exist because of the checker**

- One judged act per command, never chained with another.
- A refused act is never reworded or handed to another session. It is recorded and raised.
- Two kinds of "no" are kept apart: the checker refusing, and the session itself declining because its instructions did not name the act. Only the second may be tried again, once, in a new session whose instructions name it.
- Three refusals in a row stop a session. It is replaced, not resumed.
- Nothing needed for correctness depends on archiving a session or switching off an alarm, which the checker judges case by case.

**Unchanged from Process3:** all of the above, and merging through the merge tool. The tool's three rules that demanded a review come out, which is a removal.

**Wording changes only you can make.** In the approvals: "Process3" appears three times; "BOB" and "layer close" appear in the paragraph on design lanes (your standing design areas, such as user experience); the clause on a reviewer's exemption is dead; and one clause lets a design lane's pull request merge with no tests run, which is yours to keep or drop. In settings.json: the rule that allows pushing names the Process3 tool by its file path. It must match Process4's tool, or no session can push.

**Proven and not proven.** About 700 merges with no review went through the merge tool from 3 to 9 Nov with no recorded refusal. But the counted trial, no refusals in about 450 acts, was of merges that carried a review verdict. It must be measured again (section J).

## G. What is kept from Process3

Of your 288 requirement lines, the audit kept 198 as written. Your decisions of 13–14 Nov settle ten more as kept, so 208 stand. Another 45 keep their purpose, with the way of doing it set by your decisions or still open. By theme:

- **Purpose.** You define; the AI decides the technical and reports it as done.
- **The record.** Git and GitHub hold all state. One writer per file. A session acts only on what it has read in full or measured, and starts from a status read-out, not from notes.
- **Modules and requirements.** One total order. One owner module per file. Requirements in a public and a private part under permanent numbers, stating behaviour.
- **A job's life.** One module, one branch, one draft pull request. Done means merged.
- **Platform and permissions.** Section F. The process stands only on measured platform behaviour.
- **Texts.** One short rulebook per role, at most ten rules, rewritten in place.
- **Sessions.** Kept short. Design lanes, with user experience always there.
- **Maintaining the process.** Its own repository. One fixed version per tranche, changed only by a recorded act.
- **Reports.** A tranche report: time, work done, cost, overhead, and the minutes it took of yours.
- **Releases.** The process owns what can be proven in git and on GitHub's machines, and nothing on a live site.
- **The eight things you already dropped stay dropped.**

## H. What ends, and why

Fifteen lines end.

- **Layers** (three lines): one layer at a time, a layer closing when its checks pass, the next starting only then. *Why:* you decided there are no layers. On your module list they added no ordering the list does not already give.
- **The full regression and whole-product checks before a release** (three lines, two of which also asked for layer checks). *Why:* the internal walk replaces them. In Process3, 218 of 220 jobs were complete with passing tests while 147 of 157 walk steps failed.
- **Deliberate-fault sampling of tests on payment and data paths** (two lines: the requirement and its measurement). *Why:* three tests and no others, ever. It was never built.
- **Review by a fresh reviewer** (two lines). *Why:* your decision. In the process's own builds each review pass bred more checks; on the product only 28 of 279 job merges were reviewed.
- **Three checks that ran alongside a module's tests** (three lines): that a job's new tests fail when its change is undone; a second run of the module tests on the merged result before merging; and that built files match their sources. *Why:* on 13 Nov you confirmed these end with "three tests and no others, ever".
- **The line about when a layer closes** also ends: your word of 14 Nov, "there are no layers any more".
- **A default of 24 live sessions, which ARCH could change** (one line). *Why:* eight job slots, and only you change the number. In Process3 sessions set it themselves several times.

Parts of kept lines end too: the word "layer" wherever it appears; tests run "at layer close" or "nightly"; the "one full test run" after a change across many modules; a development release "in each round"; reviewing as a use for workers; the name "BOB"; and a session writing down "a word you give in chat" as yours. One reading is corrected: a job does not wait until every module it uses is settled.

## I. Requirements with evidence against them, for your yes or no

Your decisions end none of these. Thirteen items cover seventeen lines.

1. **The job's written receipt.** Each job posted the commands it ran and their results, and the test run compared them with its own. It caught nothing in 1,187 test runs, and on 9 Nov you said "get rid of it completely". *Recommend:* end it. Keep the other half of that line: a job reports flaws it finds in other modules.
2. **The set-up check before every job start.** It read every setting and stopped the start if one was missing. It refused every job start after you applied new settings, and took a "too many requests" reply from Cloudflare for a missing token. *Recommend:* end the every-job form, as you began to on 9 Nov. Keep the list of settings.
3. **The size cap on a module's requirements file** (two lines: the cap and the measurement to set it). A file over the cap was to be split, never refused. It was built as a refusal and overridden 32 times out of 32, and one split put a loop into the module order. *Recommend:* end the cap. Keep its purpose: a module fits in one reading.
4. **Recording each job attempt's reading list and cost.** Made compulsory, the cost figure blocked every job completion and came out 45 minutes later. Sessions often could not read a cost at all. *Recommend:* end it as a duty on jobs. Report cost where it can be read.
5. **The check that fails any commit adding an oversized file or a file in a temporary folder.** Its first run gave 947 findings, and seven later changes repaired false alarms. *Recommend:* end the check. Keep its purpose: a lean repository.
6. **The job record as a strictly formatted data file** (two lines: the file and its measurement). You asked for it to be tried with an open mind. 105 of 508 merges changed nothing but these records. The measurement you asked for was never taken, so this rests on cost. *Recommend:* end it.
7. **Every rule must cite a measured failure or your decision.** Every addition in Process3 carried a citation, and checks were added in 41% of merges both before and after you told sessions to stop. *Recommend:* end the citation rule. The rule on process fixes (section E) now does its work.
8. **A line-by-line test of instruction files in place of a size limit** (two lines). It was only advice. The one hard size limit, on each role's starting text, held all week, while the guide with no limit grew from 8 KB to 134 KB. *Recommend:* end it.
9. **"Nothing is ever refused for size", for the process's own instruction texts** (two lines). Same evidence as item 8; for product files the evidence runs the other way (item 3). *Recommend:* end it for the process's own texts only.
10. **The reading audit.** It was to sample whether a session had read a document to its end. It was never built. *Recommend:* end it. The rule itself, act only on what you have read in full, stays.
11. **The start-up check on your approvals.** A session compares the approvals it loaded with the newest, and on a difference does nothing. Each of your five edits stopped every long-lived session, and after the last, on 9 Nov, the product never restarted. Your decision to preserve permission management keeps it unless you say otherwise. *Recommend:* keep it, because approvals load only at a session's start, and first prove that your edit can be taken up without you (section J).
12. **Deploy tokens held as settings of the Claude cloud environment,** confirmed by the set-up check. The check once stopped the process on the Cloudflare reply in item 2, but this is the only route measured to work. *Recommend:* keep the route. Let the check go with item 2.
13. **Running module tests in two parts, so that product code under test holds no access token.** It was added on a reviewer's "what if", and the failure it guards against was never seen. It costs little. *Recommend:* keep it.

## J. What is not yet proven

By your own rule, nothing here is in force until it has run on a real tranche. Each item is a claim, then the smallest trial that would prove or break it.

1. **A merge with no review passes the permission checker.** Proven only for merges that carried a review verdict, plus two counted without and about 700 in use. *Trial:* twenty or more merges by ARCH, started the real way at its real level, each as its own command. Count the checker's refusals and the session's own declines apart.
2. **ROOT, started by you with a plain prompt, can start ARCH and the coordinator.** In Process3 a tool printed ROOT's long prompt, and a ROOT you started twice came up on an old copy of the branch. *Trial:* one run through. ROOT starts both; ARCH pushes, opens a pull request and starts a job; the job pushes and opens its own.
3. **Sessions started this way load your approvals and the deny list.** *Trial:* one probe each. A denied command is absent; an approved act the instructions did not name is carried out.
4. **Interface changes are recognised with no misses.** *Trial:* replay Process3's 178 recorded changes, each read at its own commit, and require that all 241 real effects are reached. Separately, list every dependence that is not declared, since no notice reaches it.
