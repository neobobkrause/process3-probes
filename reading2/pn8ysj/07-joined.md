# [file] process4_definition_v6.md (continued)


**A session dies or fills up.** For a job, ARCH starts a new session that continues from the same branch and pull request. For ARCH or the coordinator, ROOT starts a successor, which begins from the shared state and GitHub. For ROOT, the watcher takes over. Replacing ARCH while jobs are open, and a takeover by the watcher, are unproven.

**The process itself has a fault.** No session building a product fixes it or works round it. The job reports it to ARCH, and any change is made only at PROCESS, with you (section H).

**The process is completely blocked.** You get one plain message with a numbered list of what is yours to do. In every other case the stop is recorded as a named blocker and other work goes on; one that only you can clear is told to you at once.

**A stop on your word.** You tell the coordinator, which tells ARCH, which interrupts each job. The stop is a line in the shared state naming the account. ROOT reads it at every wake, so that the hourly alarm does not undo it. After your stop of 9 Nov the alarm went on firing and had sent 94 notifications by 13 Nov (measured). Unproven.

## H. How the process is changed

Your words of 14 Nov, in full:

"Lets be clear about how the process is changed (and how it's not changed). Process changes only happen in a separate process lane call PROCESS that I interact with. Though process changes are often technical and detailed, the PROCESS session will explain the nature of the problem and suggestion options for fixing it for me to explore and ultimately choose. Because updates require my involvement and I might be away from my computer for extended periods, there could end up being more than one change being proposed in the PROCESS session at a time. When that happens, the set of changes are considered together as a group that could potentially have interactions and implications between. The process after a proposed change is made must continue to meet the process4 requirements (or the requirements changed with my explicit approval). The transition from the process a product is being built using to the updated process will be done only with my prior approval, with PROCESS proposing the best and least disruptive means of making the update."

**The rule PROCESS works under.** Your words of 14 Nov: "The 3 tests provide an appropriate opportunity to identify and debug as necessary every flaw and to test everything that needs to work in a released product. There is no need to any any more tests. PERIOD!" Line 20 stands beside them: a change "must not add a new test, gate, review or stop. It may only correct or remove what is broken."

**What follows.**

- **Two recorded lines change.** Line 2 has the process wait for you "only when it is completely blocked". Line 1 has you take no acts but settings changes. Now a process fault that stops work waits for you at PROCESS, and choosing and approving there are acts of yours. In Process3 one question that sessions carried as yours waited about nine hours (measured).
- **No session building a product may change the process,** add a test, check, gate or review to it, or adopt a changed process on its own. ARCH moves a product to a changed process only with your prior approval, by the means PROCESS proposes (section C).

**Two more rules for PROCESS.** The field report quotes them as your written instructions: "caution is a cost, paid only against a measured failure or your word" and "the default answer to a finding with nothing measured behind it is no change". So "no change" is always among the options, and a fault that stops no work may be answered with it.

**How PROCESS is started and reached.** The fourth draft listed four things here as not yet settled. Your hints settle three; Claude decided the fourth.

- **Who starts it.** Your hint: "ROOT". ROOT starts PROCESS.
- **How a process fault reaches it.** Your hint: "There are communication channels between module jobs and ARCH, and between ARCH and the coordinator. ARCH can ask ROOT to start PROCESS if it isn't already running, and the coordinator can talk to PROCESS." So a job reports a process fault to ARCH. ARCH asks ROOT to start PROCESS if it is not running. You talk to PROCESS, and the coordinator can talk to it too. Claude reads your hint to mean that the fault's description travels from ARCH to the coordinator and from the coordinator to PROCESS.
- **Which repository it holds.** Your hint: "the processes". Claude reads those two words as the process's own repository. Say if you meant something else.
- **How your approval is recorded** (*Claude decided*). PROCESS writes your approving words into the record of the change in the process's repository, exactly as typed, with the date. Nothing else counts as approval.

None of this has run.

## I. Permissions

Permission management is Process3's, preserved (line 12).

**Auto mode and the checker.** Every session runs in Auto mode: it acts without asking a person, and an automatic permission checker run by the platform judges each risky act and may refuse it.

**Your standing approvals** are a block of text in your own words in CLAUDE.md, saying what sessions may do without asking you and what they may never do. You commit it yourself on GitHub's website. No session writes, edits or relays it. Consent merely quoted in a session's starting text was declined 11 times out of 11 (recorded in your Foundations; no evidence file was found). A session loads the approvals only when it starts.

**After you edit your approvals.** As in Process3, a long-lived session compares the approvals it loaded with the newest, and on a difference does nothing. Each of your five edits in Process3 stopped every long-lived session, and after the last the product never restarted (measured). So an edit to your approvals is one act together with restarting ROOT.

**The deny list** in settings.json takes commands away from every session outright: every direct push, every GitHub command, the ordinary merge commands, overwriting a branch's history, deleting branches, and writing files through GitHub's web interface. So the process's tool is each session's only door to GitHub.

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
8. **A line-by-line test of instruction files in place of a size limit.** It was only advice; the guide with no limit grew from 8 KB to 134 KB (measured). *Proposed for ending* (proposal 7).
9. **"Nothing is ever refused for size", for the process's own texts.** *Ended* for those texts only: the size limit on each role's starting text is among the tool's tests you agreed to (section E).
10. **The reading audit.** Never built. *Proposed for ending* (proposal 7). The rule itself stays (section J).
11. **The start-up comparison of your approvals.** Claude reads line 12 as covering it. *Kept,* with its cost stated in section I.
12. **Deploy tokens held as settings of the Claude cloud environment,** the only route measured to work, and **module tests run in two parts,** so that product code under test holds no access token. *Kept,* as part of the permission management you preserved.

## M. What does not exist yet

- **Where the work is kept.** Your words of 14 Nov: "The process3 repo is public because the development process that we're evolving is open-source software that's still in development. You have my approval to add any and all information related to the process4 update to the repo." *Claude decided:* the Process4 work is kept in a folder named process4, on a branch named process4, of the process3 repository. Claude reads the subtree of your second message as that folder.
- **No Process4 tool exists.** Process3's merge tool refuses for many reasons that end here. Process4 needs a new small tool that does only this: push; open a pull request and mark it ready; merge; start the next job; send notifications; and write the shared state.
- **No Process4 role texts exist, and no PROCESS lane.**
- **The product's repository is not converted.** Its CLAUDE.md on the tranche branch today tells a session whose prompt was not printed by Process3's tool: "Act only as it says; with none, act on nothing." So a ROOT you start with a plain prompt is told to do nothing. The test run must also report on pull requests that change no module, such as your approvals commit, or that commit cannot merge.
- **Nothing is built for:** the shared state; a start by you that lands on the newest approvals; a walk shared among several sessions; deployment as a step in a round; the release path; the stop on your word; the mechanical edit; the uses check that reads tests; or the route by which a process fault reaches PROCESS.

Builder: Claude, before anything is in force.

## N. What is not yet settled

The fourth draft listed fifteen things here. Thirteen were decided in the fifth draft's body, on your hints or by Claude. The notification, which the fifth draft kept here as under study, now rests on your words to the study session and of 15 Nov (section F); three parts of it are still open (1 below). Your answers of 14 Nov raised two more (2 and 3).

1. **The notification: what is still open.** What a told job does (line 10; not yet studied); who is told when the product's list of modules itself changes; and what becomes of a module that declares it uses another while no code of it does (section F).
2. **How two products share the eight slots.** You answered "across the account", and a session holds one repository, so it sees one product. Claude will settle this when a second product starts. With one product nothing changes.
3. **Who starts the watcher.** The note in your ledger, written in by the coordinator, says "by whoever starts ROOT", and you start ROOT. Read plainly, that makes starting the watcher an act of yours, and it is not in your list of acts. From 5 Nov, Process3 had ROOT start it (measured). If Claude's answer departs from that note, it will come to you as a proposal.

## O. What is not yet proven

Your Foundations say: "Nothing here is in force until it has run on a real tranche with the two health metrics measured." Claude has proposed ending the first of the two (section K; proposal 1 in section P); until you answer, your sentence stands as you wrote it. Each trial below could break its claim; none can prove it. Proof is the first real tranche. What is proven and not proven about the notification is in section F.

**Can be tried with nothing asked of you.** That the rule for who takes a free slot gives the same answer every time. That the internal walk finds the one known break between two modules, of 4 Nov, which module tests missed.

**Needs process3-probes, the repository you named, and sessions on your account.** The fourth draft's proposal 11: this trial, in which the whole chain of sessions builds a few small made-up modules, stands as the "one shadow of a representative slice" your ledger note asks for first, though it is weaker than a slice of the real product. You answered "agreed" on 14 Nov. Judged cost to you: one sitting of about half an hour, two session starts, one edit to your approvals and one "stop". (The fifth draft also counted one settings change, the default branch; Claude has withdrawn that.) Each claim gets one rehearsal unless a number is given.

- First: a ROOT started by your plain prompt fetches the newest copy of its branch and comes up on your newest approvals, also straight after an approvals commit, and starts ARCH and the coordinator.
- A merge with no review, by Process4's tool, passes the permission checker. Twenty or more merges, because the checker has passed and refused the same act minutes apart.
- A freed slot is refilled within minutes, and jobs obey a replaced ARCH. With no event, Process3 once noticed a finished job after 194 minutes.
- The shared state works, and the hourly alarm wakes a ROOT you started.
- A watcher takes over from a ROOT that has died: what it leaves behind, and how deep the new ROOT sits.
- A stop, a held merge, a module put first and a new slot number each work on your word, and the alarm does not undo a stop.
- Finished sessions do not use up the account's room. Process3 saw new starts fail silently at about 50 live sessions (one event).
- Several sessions share one walk by journey; sessions run a deployment and an external walk as a step in a round; the Cloudflare account bears the external walkers; and the tranche branch merges into the main branch.
- A mechanical edit across several modules merges once, with the touched modules' tests run and with none run.
- ARCH asks ROOT, ROOT starts PROCESS on the process's repository, and the coordinator talks to it.
- An account switch loses no work. It failed on 5 Nov and was cancelled on 7 Nov.
- Sessions started this way load your approvals and the deny list, also after an edit and a restart; a release can be prepared as far as your approval.

**Only the first real tranche can show**

- Whether a tranche can end (section D).
- Whether the checker goes on passing merges at a real rate. Twenty clean merges bound the refusal rate only below about 14% (estimated).
- How often a process fault stops work and so waits for you at PROCESS.
- Whether cost can be read for the tranche report. In Process3 it often could not.

**Risks with no trial**

- Nothing physical yet stops a session building a product from changing the process's files, or from moving to a changed process. In Process3, sessions made 270 of 296 process changes themselves and moved the version 116 times in nine days (measured). In your words of 14 Nov: "That rule exists only as text, and in Process3 text alone did not hold."
- A job's tests judge its own work. Your words of 14 Nov: "Yes, a job writes its own tests. That's an important responsibility." You have not spoken to the risk that follows. Beside it: 8,838 requirement numbers against 236 to 357 walk steps (measured), so about nineteen requirements in twenty (estimated) are looked at only by the job's own tests.
- Sessions write and count the walk's steps. A step that was loosened cannot be seen. A walk starts from a fresh copy and cannot see an upgrade breaking a user's existing data.
- A module's tests run only on its own job. A failure caused by another module's merge can sit unseen until a walk meets it.
- Most rules in this document are held by text alone, among them the rules against growth outside the process's own repository: product tests that serve the process, extra walk steps, demands written into another session's instructions, a helper briefed as a reviewer. In Process3 the one rule with a hard limit behind it held all week, and rules held by words drifted (measured).
- Why GitHub suspended the sessions' account on 6 Nov was never learned.

## P. Still open with you

These are the questions that are yours and that you have not yet answered. Each says what it is and, where there is one, Claude's recommendation. A recommendation is Claude's, not yours, and nothing here is decided until you answer. Questions you have already answered are in section B and are not repeated.

**The end of a tranche**

1. **What each walk is measured against, and which journey list counts.** The choices: the claude.ai pages; pages kept in the folder you named; or the folder's machine data, which you cannot read and which describes more than is built. Your approvals of 5 Nov say the design documents "are claude.ai artifacts, not repository files"; your words of 14 Nov say screens and journeys are kept in the folder. Claude's recommendation: pages in the folder, so that the repository records every change to what a walk is measured against; that needs one proposal to you about the words "never committed" in your approvals. On which journey list counts there is no recommendation yet: the lists of 27 and of 32 journeys have not yet been compared for you. (This is also the lanes question of where the Screens document and the journeys live.)
2. **What a tranche contains.** Either all open work, so that the first walk comes after about 177 jobs (estimated) and carries every flaw Process3 left; or a smaller content you name for each tranche. Claude's recommendation: a smaller content you name. Its cost is a decision from you at each tranche, and a clean walk of a part says less about the whole.
3. **What happens to a tranche that will not come clean.** Merged with its flaws, which sits against your words "So a release is always fully tested and walked successfully"; or dropped; or kept open. No recommendation: no tranche has ever been walked your way.
4. **Which journeys count toward "all journeys".** Of the 32, three begin at the website or the installer, which you put outside the tranche; six have steps only the AI assistant can do (one of them among the three); one more is connecting a Claude account. Claude's recommendation: a tranche's external walk follows every journey, and what it leaves out is named beforehand, so that leaving it out is neither counted as a flaw nor hidden as a note.
5. **Who runs the walks.** Your hint was "sessions". A line you kept in your ledger, and Process3 itself, had GitHub's machines run them, and that is the only form that has ever run. Whether a session's browser can reach the development site is unmeasured. Claude's recommendation: keep your hint, and let Claude try one walk from a session in the trial repository before the definition depends on it. That needs your go-ahead, because it starts a session and a deployment on your accounts.

**The rule that only PROCESS changes the process**

6. **Whether anything physical stands behind your rule.** Today it is held by words only, and your approvals in the process's repository let sessions merge there without a person. The four choices: words only, as now; your approvals reworded by you to say a process change is merged only on your word given at PROCESS; a GitHub rule so that only your account can update the branch of the process that products use, after which you also press merge on GitHub's website for each change you approve (this is the centre of the proposal withdrawn twice before); or the sessions' account loses the right to write to the process's repository at all. Claude's recommendation: the second now, and the third; the third has never been tried on your repositories. Also yours to say: whether pressing merge counts, for you, as one of the gates you have ruled out.

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
18. **PROCESS and the two triage lanes.** On 6 Nov you kept a process triage lane and a product triage lane, each to study a problem and bring you options. Claude's recommendation: PROCESS takes the place of the process triage lane, and no product triage lane is started: Process3 built it and never once started a session for it, and in Process4 a flaw found by a walk already becomes work in the next round. That would end something you kept, so it needs your yes or no.
19. **Whether you work with design lanes directly.** On 5 Nov, as recorded, you described lanes' design documents as pages they "create/update/interact with me using". The session's record of 13 Nov has the coordinator as your front door. Claude's recommendation: you work with a lane through its design pages, and with PROCESS directly; everything else comes through the coordinator.
20. **Which lanes Civicsmith begins with.** Claude's recommendation: UX, investigation design and publication design, as on 6 Nov, and any further lane when you identify the need. It needs only your yes.
21. **Your approvals name "BOB".** They say lanes are "run under BOB"; the definition calls that session ARCH. Proposed: the approvals name ARCH when they are next edited. Nothing else about the sentence changes.

**Other matters**

22. **The record's line 11 and your words of 15 Nov.** Line 11 of the session's record of 13 Nov says: "Recognising that an interface changed must be proved rigorous and correct." Your words of 15 Nov: "there is no means to reliably tell the difference when there's a change in a module between when that change changed the interface or changed something other than the interface." Proposed: line 11 is replaced by your words of 15 Nov and your choice of the same day, so that the notice is a way of saving work and not a guarantee (section F).
23. **Tests for the process's own tool.** You agreed in the fourth draft's proposal 5 that the small tool sessions use has tests of its own, and in the same message wrote that there is no need for any more tests. Claude reads the two together this way: the tool's tests test no product and never run on a product's work, so the three tests stay three (section E). Say if you meant otherwise.
24. **A product question that will come to you.** Whether a member's own Claude sign-in through the runner still exists: one module still passes that sign-in to four addresses that now answer "not found", and its requirements file states both positions. Not decided here.

**The seven proposals for the 33 lines.** For each, yes means the ending stands; no means your lines stand as you wrote them. Until you answer, the lines are proposed for ending, not ended. Each proposal is written out in full and ready; say when you want them. Nine of the 33 are checks or re-tests that your "three tests and no others" may already end, but you were never asked whether your words reach that far.

1. **When Process4 counts as in force, and the first of your two numbers for judging the process** (5 lines): the first number, false "done" claims caught by a second look, is dropped, and nothing is in force until it has run on a real tranche.
2. **Three things to be measured on the first tranche** (5 lines): an architecture session that keeps no memory between wakes, trimming the principles each role loads, and the share of the architecture session's work spent passing things on; all three end unmeasured.
3. **Two duties repeated at each new model version and at each tranche's opening** (5 lines): taking parts of the process away one at a time to see what is still needed, and recording, counting and re-trying refusals of acts you approved.
4. **Two removals for which the fifth draft cited what Process3's decision record says you said on 9 Nov** (3 lines): the job's written receipt of its commands, and the set-up check before every job start, which that record in fact kept, run less often.
5. **Records and cost figures kept for each job** (5 lines): no per-job record of reading or cost, no cost alarm, and no strictly formatted job record.
6. **Size limits and checks on what goes into the repository** (4 lines): no size cap on a module's requirements file, no check on oversized or temporary files, and no second required "record" check.
7. **Rules about the process's own rules and instruction texts** (6 lines): every rule citing a measured failure or your decision, the line-by-line test of instruction files, and the audit of whether sessions read documents whole.

---


# [file] audit_C.md

# Audit C: Process4 proposal against the Process3 requirements

Part audited: Ledger families TXT, MNT, SHM, the principles, GAP-1 to GAP-12, and the Foundations sections "How this was decided", "Setup", "Maintenance, certification and the two health metrics", "Dropped, and why", "To measure on the first tranche" and "Open tensions to settle".

Read in full: `foundations.md`, `process4_doc.md`, `ledger_map.md`, and every line of the five assigned families in `ledger_lines.md`. Consulted for evidence: `product_side.md` (in full), `change_sample.md`, `causal_forensics.md`, `canon_analysis.md` section 5, `redteam_feasibility.md`, `redteam_corruption.md`, `levers_github_cloudflare_product.md`, `DECISIONS.md` (the product's decision record, for the owner's later words).

## How to read the rows

- **Result** is graded on the worst-met clause of the line. Where one clause is met and another is not, the row says which.
- **MET DIFFERENTLY** means what the line asks for is still obtained, by another mechanism, at no cost to another requirement in this part.
- **CONTRADICTED** means the proposal's own words oppose what the line asks for. The words are quoted.
- **Central** names which of the owner's four requirements of 13 Nov the line serves: (1) no commands, no file edits, settings only; (2) unattended, waits only when completely blocked; (3) total order, one job per module, earlier first, interface changes notify users; (4) parallel jobs under a number he can change.
- **Kind** follows the documents' own rule (Foundations, "The human and the AI"): a line has a purpose, which is the owner's, and a mechanism, which is BOB's; "only a change to what a line asks for comes to you".
- Proposal items are cited by their own labels (G, C, M, F, P, N, R). To avoid a clash with the principles, the proposal's Lever 5 items are written "lever P1" to "lever P5", and "WA n" is item n of the working agreement.

Two corrections to the brief. The Ledger holds 21 principle lines, of which 20 are kept or modified and one (P16) is dropped; there is no P14 or P15. So this part has 54 kept or modified Ledger lines: TXT 7, MNT 10, SHM 5, principles 20, GAP 12.

## 1. Ledger lines

### TXT: instruction files and rules

| Id | Requirement (owner's note where he wrote one) | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| TXT-1 | Product's CLAUDE.md under thirty lines, hand-written, naming the pinned process commit and the command that fetches it. Modified against the suggestion, owner's word 1 Nov: BOB writes and keeps it line by line, "with no approval needed and each change listed in the tranche report; the approvals block stays Bob's own" | Mechanism (thirty lines, who writes); purpose (changes do not need him) | **CONTRADICTED.** G2 makes `CLAUDE.md` and the process pin the owner's paths: "A ruleset on main and the integration branch requires your review for those paths". M1 replaces thirty lines with a 4,096-byte cap. There is no tranche report | (1), (2) | Two parts. Byte cap for line cap: candidate for the owner to change; the file ended at 22 lines and 8,664 bytes, all growth from 16 owner patches (product_side §6a). Owner review of every non-approval line and of the pin: proposal must change, or the owner must be asked to withdraw his 1 Nov word; the proposal does not say it reverses it |
| TXT-2 | Every line in an instruction file is failure-backed, non-inferable from the code, or tool-enforceable; failing lines are deleted. The Ledger's reason: "The per-line test replaces a byte cap" | Mechanism | **MET DIFFERENTLY.** M1 goes back to a byte cap held by a required test; M3 sets how prompts are written. The per-line test is not mentioned | none | Candidate for the owner to change. The map held TXT-2 as a nudge; the one byte cap that existed (role prompts, 4,096) moved 12 bytes in five days while the README grew from 8 KB to 134 KB (process4_doc "What did hold"; causal_forensics §1) |
| TXT-3 | One rulebook per area, at most ten rules on one screen, rewritten in place, never appended; "when you raise a problem, a rule is rewritten and no ruling is added" | Mechanism | **MET DIFFERENTLY.** The working agreement (seven items) "replaces the rulebooks"; three pinned texts of 4,096 bytes; M2. The clause on a problem the owner raises changes: a rewrite needs a fork pull request and his merge between runs, and M4 says a chat remark "lapses at the end of the run unless you put it in writing" | (1) lightly | Proposal should say that the owner raising a problem no longer rewrites a rule, so he can accept or refuse that |
| TXT-4 | Apply the per-line test to the principles; most roles load two or three. Owner: "I'm skeptical, but let's try". Foundations: "tried and measured" | Mechanism, on trial | **WEAKENED.** M2: one charter page of 25 purposes replaces the principles as reading. The measurement that was the condition of his sceptical assent (drift traceable to a missing principle, decided at tranche close) is not carried. The 25 purposes were "extracted from the canon by one worker", not decided by him | none | Proposal must change: say how a misjudgment traceable to a missing principle would be seen, or ask the owner to drop the trial. He has not seen the charter text |
| TXT-5 | Each role's starting prompt names its own rulebook in the pinned process; product rules load by path | Mechanism | **MET** (C2, C5: the one-line prompt names the pinned ARCH or START text). Product rules by path are not mentioned | none | |
| TXT-6 | Every rule cites the measured failure or the owner's decision that justified it; a rule with neither is removed | Mechanism for a purpose (rules do not accrete) | **MET DIFFERENTLY**, though the proposal says the line ends ("the citation rule as the brake (GAP-3, TXT-6)"). What replaces it: condition 2 ("A check earns its place by running the product or by a recorded catch"), budgets, and the owner's merge. The owner's merge is itself the owner's word in the strictest sense, so the line's test is still applied, by him | (1) through the replacement | Candidate for the owner to change the mechanism: the citation audit was never built and every growth was cited (causal_forensics §7: "Tool 4,543+ lines; every rise cited"); check-adding stayed at 41% of merges before and after his 5 Nov instruction (change_sample). The replacement mechanism is the one the proposal's first section says conflicts with (1) |
| TXT-7 | Every text names its audience and speaks plainly | Purpose | **MET** (M3, R25). "Names its audience" is not stated for each text | none | |

### MNT: maintenance and certification

| Id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| MNT-1 | The process is a product under itself, as the thin process: own ledger, requirements, jobs on branches with tests and review, tranches, the version in use frozen while a tranche runs | Mechanism for a purpose (no unreviewed reactive fixes; frozen in use) | **MET DIFFERENTLY.** G1, N2, N4, N6: changes arrive as fork pull requests under budget tests; frozen by GitHub. The reviewer and merger is the owner, where the Ledger had the process's own review. Own ledger and requirements for the process are not mentioned | (1) through the owner's merge | See MNT-5 |
| MNT-3 | A tranche of the process is built with the last released version of the process | Mechanism | **SILENT.** Process changes are built by "a commissioned session" or "a fresh session in a fork" under no stated process | none | Candidate for the owner to change: never built (ledger_map: Phase 4), and Process3's own builders had no role, START or rulebook in the tool (causal_forensics §1.4). The proposal should say so |
| MNT-4 | A tranche runs on one pinned process version, named in the plan; every session verifies the pin once at start and says so | Mechanism for a purpose (the process does not change under a run) | **MET DIFFERENTLY.** N2 "One process version per run"; G2 puts the pin in the owner's paths; G4 calls the gate "at a pinned commit". The session's start verification is not mentioned; its approvals half is removed (see F-MNT-1) | none | |
| MNT-5 | A fix for a blocking flaw is adopted by a running tranche once, as an explicit recorded act that moves the pin; no job restarts. Page explanation: "BOB records one act that moves the pin" | Purpose (a blocking flaw is fixed and adopted without restarts, and without him); mechanism (the pin move) | **CONTRADICTED.** "These families end outright: ... mid-run pin moves (MNT-5)". N2: "The pin moves only by your merge." "A real process defect now waits for you" (What it costs you). "A defect in a frozen part waits for you" (Known limits) | (1), (2) | Proposal must change. Evidence supports bounding the mechanism: 116 pin moves in nine days, adopted a median 3 to 21 minutes after merging, about 35 minutes of product cost each (product_side §4; change_sample removal 287). It does not support moving the act to the owner: his 9 Nov word was "Pin moves should be lightweight fixes that improve velocity, not ruin it" (change_sample removal 298). The proposal's own first section already says to replace his merge with limits |
