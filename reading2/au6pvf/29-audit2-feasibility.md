### 13. ARCH carries every start, merge and notification alone, and nobody is named to notice a job that died after its tests passed

1. **The fault.** ARCH does everything between jobs. It was replaced 21 times in six and a half days when it did less. A job that dies between a passing test and its message leaves a slot held; the hourly alarm wakes ROOT, not ARCH, and no rule says how ROOT tells a stopped session from a waiting one.
2. **Sentences.** Section C: "It starts jobs, merges them, and passes notifications between modules ..." Section C: "Once an hour an alarm wakes it as a safety net ... to wake or replace a session that has stopped." Section G: "After two failed corrections ARCH replaces the session".
3. **Rests on.** Measured: 21 architecture sessions for 508 merges, about 24 each. Measured (`foundations.md`): "with no event, BOB noticed attempt 1's completion after 194 minutes". Platform text (`subscribe_pr_activity`): "A PR's events go to one session at a time." In Process3 the architecture session held that subscription; a job listening to its own test result is the platform's design but has no run in the record. Reasoning: at about 177 jobs a round, ARCH is replaced about seven times a round with jobs open, which the draft lists as unproven.
4. **How bad.** Costs hours per stall; with eight slots, a few stalls idle the round.
5. **Status.** RAISED BEFORE AND STILL OPEN: register 8 ("NO ANSWER FOUND"), register 11 (who counts failed corrections), the unanswered part of register 34 (the rule for "has stopped"). Register 30 (waking) is ANSWERED well enough to build from.
6. **Best answer.** Wording: at each hourly wake ROOT wakes ARCH, and ARCH reads the open pull requests; state the rule for "stopped" in one line (for example: its tests passed and no message came by the next wake). Replacing ARCH at each round's end, offered in the first round, is a structural choice still open.
7. **Whose.** Claude's to decide; replacement with jobs open needs the trial.

### 14. The watcher is back, and with it two sentences that cannot both hold

1. **The fault.** The draft says no session starts its own replacement and sessions are at most three levels deep. It also keeps a watcher which, on the record, ROOT started, and whose takeover put ROOT one level down and left no watcher behind. If Bob starts the watcher instead, that is an act missing from his list. If ROOT dies with no watcher, nobody is named to notice.
2. **Sentences.** Section C: "Sessions are at most three levels deep, and none starts its own replacement." Section C: "both recorded takeovers in Process3 left no watcher behind and left ROOT one level deeper than designed." Section N.4: "Who starts the watcher." Acts table: "Start the first session, ROOT | ... and if ROOT dies and no watcher takes over".
3. **Rests on.** Measured (`roles` 1.6, 3.3): two takeovers; the watcher woke once a day by its own alarm; Process3's own decision called a takeover "a bridge: Bob restarts ROOT from his app at depth 0 at his next opportunity". Reasoning: with a daily wake a dead ROOT is found up to a day late, and for that day nothing replaces a dead ARCH or starts PROCESS.
4. **How bad.** Stops a tranche for up to a day; costs Bob an unlisted act either way.
5. **Status.** RAISED BEFORE (first-round finding 9; register 15, answered then by removing the watcher). Reopened by Bob's question of 14 Nov, which the draft answers honestly. STILL OPEN, and the two sentences now contradict.
6. **Best answer.** Wording: either the sentence about replacements and depth gets its exception written in, or the watcher is described as what the record says it was, a bridge until Bob next starts ROOT. Say who tells Bob that ROOT is dead.
7. **Whose.** Bob's to decide (it is his note and possibly his act); the wording is Claude's.

### 15. The shared state is still one sentence

1. **The fault.** The draft says shared state lives in "one place on GitHub" that needs no merge. It does not say what the place is, who writes each part, or how it squares with the kept rule of one writer per file. If the place is made of things written by the sessions' GitHub account, a second suspension of that account could hide it.
2. **Sentences.** Section C: "What every session needs lives in one place on GitHub, in the product's repository, that needs no merge to write and is written only through the process's tool." Section J: "Git and GitHub hold all state, with one writer per file."
3. **Rests on.** Measured (`notes/github-pacing.md` in process3): the suspended account had made 1,387 pushes to the state branch in 19 hours; the cause of the suspension was never learned. Measured (`permissions_inventory.md` row 20): a session writing relayed words of Bob's into a file other sessions load was refused, "[Instruction Poisoning]"; the shared state is to hold "your instructions quoted exactly". Reasoning: ROOT, ARCH, the coordinator and blocked jobs all write there.
4. **How bad.** Stops the first round at the first replacement of ARCH if it does not work; the suspension case could lose the record.
5. **Status.** RAISED BEFORE (register 27, register 9). NOW ANSWERED by Claude's decision in a sentence; not enough to build from. Register 9 STILL OPEN ("NO ANSWER FOUND").
6. **Best answer.** A structural choice written down: name the place (a branch written rarely holds through a suspension better than comments do, because commits stay), list its few entries and the one role that writes each. Honest statement: writing Bob's quoted words there may be refused, and is unproven.
7. **Whose.** Claude's to decide; needs the trial.

### 16. The release has no actor, two of its workflows do not exist, and sessions are forbidden to touch what it must update

1. **The fault.** "The process prepares it" names no session. The record says the product has no workflow for updating the installer or the website page. Bob's approvals forbid sessions to change the installer and the website. The tool, as listed, cannot start a workflow. And the merge of the tranche into main, 7,339 commits, has never been made on this product.
2. **Sentences.** Section D: "The process prepares it and waits for your approval (line 18) ... The release path is unproven." Section D: "ARCH merges the tranche branch into the main branch as a whole, by pull request ... None of the three tests runs on that pull request." Section P.1: "When the journeys that use AI are walked is not said". Section M: the tool "does only this ...".
3. **Rests on.**
   - Measured (`DECISIONS.md` BD-R3, Bob, 8 Nov): "The product has no workflow for either yet"; "The scoped deploy token is Bob's to add to that environment". Same record: Bob, 8 Nov, "Yes, the installer update and site update wait until a release walk with AI on is also clean." So the record does say when the AI journeys must have been walked; section P says it is not said.
   - Counted today: Bob's approvals: sessions "may not change ... the worker civicsmith-site and its website ..., the installer worker newgroup". `release-sign.yml` exists and waits for Bob in a protected environment; it is started by hand on a branch named for the release. The newest release tag on the product is v0.71.0 of 21 Sep, before Process3.
   - Measured (`permissions_inventory.md` 2a): the tranche merged into main 13 times on the probes repository on 2 Nov; never on the product. So a rehearsal on probes repeats what was done and says nothing about the product's merge.
   - Reasoning: workflow files belong to no module, so under the job rule no job may write the two missing workflows unless ARCH gives those files an owner module.
4. **How bad.** Stops the first release; does not stop a tranche.
5. **Status.** RAISED BEFORE (register 29; first-round finding 8). The merge to main is ANSWERED well enough (ARCH; no test runs; unproven). The release itself is listed as unbuilt and unproven; its missing actor and missing workflows are NEW.
6. **Best answer.** Wording and settings: name ARCH as the one that prepares a release; give the workflow files an owner module; add the protected-environment token to Bob's acts; quote Bob's 8 Nov sentence beside his 14 Nov answers and ask whether it still stands. The two are his own words and I do not choose.
7. **Whose.** Needs the build; the AI-walk question is Bob's.

### 17. The trial costs Bob more than the draft says, and several of its items cannot be settled on made-up modules

1. **The fault.** The trial repository is itself a Process3 copy that tells sessions to act on nothing, and the last pushes sessions made there were refused. Before any trial, it needs the same conversion as the product, with Bob's own commits. Several listed items need things made-up modules do not have: a walker, screens, a deployable product, a release, a second account.
2. **Sentences.** Section O: "Judged cost to you: one sitting of about half an hour, one settings change, two session starts, one edit to your approvals and one 'stop'. Each claim gets one rehearsal unless a number is given." And the list under it.
3. **Rests on.**
   - Counted today, `process3-probes`: default branch main; its tranche branch has a pinned Process3, the "act on nothing" line, the Process3 required check, and the allow rule naming the Process3 tool.
   - Measured (`permissions_inventory.md` row 34): pushes by sessions in that repository were "Refused 2 of 2" on 8 Nov, "judged dangerous", no reason recorded.
   - Reasoning, item by item. *Walk shared by journey; deployment and external walk; Cloudflare bearing the walkers; a release prepared:* made-up modules have nothing to walk, deploy or release, so these cannot be tried there at all. *Account switch:* needs a second Claude account with its GitHub connection and cloud environment, which are acts of Bob's not in the cost line. *Watcher takeover:* needs a dead ROOT and the watcher's next wake. *The alarm does not undo a stop:* needs at least an hour's wait. *Finished sessions and the limit:* needs about fifty sessions. *Tranche into main:* already done 13 times on this very repository. *Mechanical edit with every touched module's tests:* cannot show the real size (60 modules, 40-minute suites). *Twenty merges:* the draft itself says they bound the refusal rate only below about 14%. *The slot rule gives the same answer every time:* true of any script; it settles nothing about sessions.
4. **How bad.** Costs Bob time; misleads him on what the trial will have shown.
5. **Status.** Partly RAISED BEFORE (register 65, 71, 72). The probes facts and the item-by-item reading are NEW.
6. **Best answer.** Split the trial list in two, honestly: what the made-up modules can show (start, approvals, merges, slots, state, stop, PROCESS start), and what only the real product's copy can show (walks, deployment, release, the merge to main, the big mechanical edit). Restate Bob's cost with the conversion commits counted.
7. **Whose.** Claude's to decide; the cost is Bob's to accept.

### 18. An account switch and a suspended GitHub account are named but not described

1. **The fault.** The body has no passage on switching accounts: only a row in Bob's acts and a line in the trial list. For a suspended sessions' account there is one line under risks. Both happened in Process3 and both stopped everything.
2. **Sentences.** Acts table: "At the start of a product and at an account switch". Section O: "An account switch loses no work. It failed on 5 Nov and was cancelled on 7 Nov." "Why GitHub suspended the sessions' account on 6 Nov was never learned." Section G: "The stop is a line in the shared state naming the account."
3. **Rests on.** Measured (`roles` 3.4): on 5 Nov the new account first had no GitHub connection, then pushed as Bob himself, and "every job start refused"; "13 job sessions were stranded"; old sessions "cannot be messaged or archived from the new account". On 7 Nov the switch was cancelled after "about 9.5 h". Reasoning: after a switch every role named in the shared state points to a session the new account cannot reach.
4. **How bad.** Stops a tranche for hours; costs Bob time.
5. **Status.** RAISED BEFORE (first-round finding 9; register 9, 34). STILL OPEN: thin.
6. **Best answer.** A short passage: what Bob does, what the new ROOT does first (replace every role named in the shared state and restart each open job from its branch). Honest statement that it has failed twice.
