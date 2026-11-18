- Requirements audit: the default-branch setting is a new act of his that rests on Claude's decision, and "restart ROOT after every edit" is Claude's consequence, not the record's (`audit2_requirements.md:227-228`); ROOT starting PROCESS crosses kept lines on one repository per session (`:260`); "Who writes the rest of the product's CLAUDE.md is not said" (`:262`).

## 2. The record of ROOT's start

**Primary record.** The Process3 coordinator's running log: `notes/coordinator-findings-3-4nov.md` on branch `origin/start/coordinator-4nov` of `/home/user/process3` (1,302 lines). It is a session's record. `origin/process-state` in `/home/user/process3` holds only GitHub-usage rows (V: `git ls-tree origin/process-state` shows one folder, `github`). The role addresses are on the product's `process-state` branch, which I read (below).

**What the log says** (V, exact):

- Line 652, 5 Nov 17:52: "NEW ROOT session_018BhcefQE6Fhbhczqxpav9v, started by Bob from his app (depth 0, no parent). Start check ok, recorded as root 17:45:45".
- Line 663, 18:35: "Bob committed the CLAUDE.md updates in all three repos (copy f575c3b1 18:25:29 UTC) ... New approvals hash 9d44cc63: every role stops at its next start check ... Restart: Bob starts ROOT from his app (notes/root-prompt.txt, regenerated at pin 89d87b9)".
- Line 667, 18:44: "ROOT 2 session_018BhceduipEp2mmEFHN9Diu (Bob's app, depth 0, approvals 9d44cc63): first start check failed (container on 18935dc7, older than the tip), it stopped correctly; on my message it stood on the tip, check passed, recorded 18:41 ... NOTE: the Bob-app ROOT clones the default ref, not the tip: the prompt's step 2 then fails; next time tell Bob to pick branch tranche (he did) - the clone was cached from earlier (18935dc7)."
- Line 1190, 8 Nov 19:15: quoted in section 0, item 1.

**Checked against the product's history** (V: a commits-only fetch of `tranche`, `main` and `process-state` into a scratch repository, then `git log`, `git merge-base --is-ancestor`, `git rev-list --count`):

- `18935dc7c400...` is "Merge job PR 458", made 5 Nov 17:32:56 UTC. It is in the history of `tranche`. It is not in the history of `main`. `main` stands at `0dea5a6`, 1 Nov, and is the repository's default branch (V: `git ls-remote --symref`).
- It was the newest commit of `tranche` from 17:32:56 to 17:46:33. Bob's first app-started ROOT was recorded at 17:45:50 (state-branch commit `066fceea4`). So that first start landed on the newest commit, and that commit is the one the two later starts came up on.
- At 18:41:16 on 5 Nov (state-branch commit `cb6359d83`, "address: root session_018BhceduipEp2mmEFHN9Diu") the newest commit was `f575c3b1f`, Bob's merge of pull request 550 at 18:25:29, his approvals edit. Between the two lie 7 merges on the branch's main line. The run audit's figures (`audit2_feasibility.md:30`) are confirmed.
- At 19:00:45 on 8 Nov (state-branch commit `2228150a8`) the newest commit was `535f05965`, Bob's merge of pull request 1067 at 18:02:46, again an approvals edit. The copy ROOT came up on was the same `18935dc7`: 73 hours old, 260 main-line merges (2,346 commits) behind.

**So, exactly.** Which branch: the tranche branch, which Bob had picked (log 667, "he did"). How old: about an hour on 5 Nov; three days on 8 Nov; the same saved copy both times. What went wrong: the copy held the approvals as they were before his edit, and was not the newest commit. Process3's first command, `start check`, compares the copy with the branch's newest commit and the approvals with those there; on a difference the session "acts on nothing" and reports (V: `origin/tranche:tool/lib/start.mjs:1-11`; ROOT's prompt step 2, `origin/tranche:tool/lib/roles.mjs:143`). ROOT stopped. Nothing else was lost. Both times ROOT then moved to the newest commit (on 5 Nov "on my message", from the coordinator), passed the check, and started the other roles (log 667, 668, 1190). At a first hour of Process4 no coordinator exists yet to send that message: ROOT starts it.

**What "came up on an old copy of the right branch" means for a cloud session.** A cloud session does not work on GitHub directly. A machine is prepared for it and a copy of the repository is placed on that machine. CLAUDE.md (the approvals) and `.claude/settings.json` (the deny list) are read from that copy when the session starts. On 5 and 8 Nov the copy placed on the machine was not taken fresh from GitHub at that moment. It was a copy kept from an earlier start: Process3's own code says "a branch name landed on a stale local copy of it in the saved container" (V: `origin/tranche:tool/lib/roles.mjs:119`; commit `d236302` of 3 Nov), and the log says "the clone was cached from earlier". The branch name was right; the contents were as that branch stood at an earlier moment. The session cannot know this unless it asks GitHub for the newest commit and compares.

- Proven (ran, recorded): the commit ROOT stood on, twice; that it was the commit of Bob's first app start; that a start by branch name landed old on 2 and 3 Nov and a start by commit id landed fresh, 1 of 1 (A: `evidence/permissions_inventory.md:266`; Bob's Foundations, `evidence/foundations.md:223`, which is his document, drafted by sessions); that a ROOT moved to the newest commit after starting went on to start the other roles, 2 of 2.
- Not proven: the platform's mechanism (I read no platform document that describes it; the two documentation pages I opened say nothing on it); whether it behaves the same today; whether Bob's app can start a session at a commit id; whether approvals a session reads after its start count as loaded (A: `audit2_feasibility.md:35`, "unmeasured"). Process3's check reads the file on disk, not what the session loaded (V: `start.mjs`, function `read`), so its "check passed" after the move does not show which text the session was acting under.
- (V) Process3 told a ROOT woken later to fetch and move to the newest commit before checking (`roles.mjs:129`, `:146`), but told a newly started ROOT only to check and stop (`roles.mjs:142-143`).

**What the fifth draft's fix would and would not have changed.** The fix (`definition/process4_definition_v5.md:293`, and his act at `:118`): make the tranche branch the default branch.

- Would change: a start where no branch is picked lands on the tranche branch, not on main. Main today carries the approvals of 1 Nov in a 3-line CLAUDE.md, an older deny list, and no process at all (V: the local clone of main). His commits on GitHub's website would open on that branch by default.
- Would not change: which copy of that branch the machine is given. On 5 and 8 Nov the branch was already right, and the copy was old.
- Also (A, J): on a public repository the unfinished branch becomes what visitors see (`audit2_corruption.md:544`). Process3's required test run has a rule keyed to the default branch (V: `process-gate.yml` at the product's tranche tip treats "the tranche into `$DEFAULT_BRANCH`" specially), which matters only if any of it is reused.

## 3. How a session gets the process today, and what the fifth draft says

**Process3, as it stands in the product's repository at the tranche tip `e7ec72e`** (V: `git show e7ec72e:<path>` in `/home/user/neobobkrause/civicsmith-copy` after a depth-1 fetch):

- `.gitmodules` names a submodule `.process` at `https://github.com/neobobkrause/process3`; the tree pins it at commit `38b0f3f`. That is the "fixed version": a pointer inside the product's tree, movable by any pull request.
- The pinned copy arrives empty. Every role's first command is `git submodule update --init .process` (V: `roles.mjs:142`; product `CLAUDE.md:19-20`).
- The tool is then run as `node .process/tool/p3.mjs <command>`. The one allowed push route in `.claude/settings.json` names that path: `"Bash(node .process/tool/p3.mjs github push *)"`; `git push` and every `gh` command are denied. Two retired hooks are still in the file.
- Role texts: the starting prompt is printed by the pinned tool (`start root`, `start bob`, `start watcher`, `job start`) and pasted or passed as the first message; it names "Acts you may take" and points to a rulebook in the pinned copy, `rulebooks/<role>.md` (V: `roles.mjs:140-148`; `origin/tranche:rulebooks/root.md`, 3.3 KB).
- The product's `CLAUDE.md` has his approvals (lines 1-15) and then four lines under "## Process3" (lines 17-22), copied from the process's `shims/CLAUDE.process.md`: the pin, how "to stand on the tip", "Your role prompt is the message that started this session ... Act only as it says; with none, act on nothing", and "Whoever starts a session archives it once its result is recorded".
- `process/config.json` names the process repository, the tranche branch, the lanes, the Cloudflare account and the environment variable names. Four of the eight workflow files are the process's (`process-gate.yml`, `process-record.yml`, `process-dev-release.yml`, `process-branch-prune.yml`).
- Main (the default branch) has none of this (V).

**Bob's documents on this** (his Ledger and Foundations, not his typed words of 14 Nov):

- Ledger, kept 31 Oct: "A session works on one repository, the product's; the process is a read-only clone at a pinned commit." (`evidence/ledger_lines.md:78`, line PLT-7.)
- Ledger, modified 3 Nov: "A product's CLAUDE.md is under thirty lines, hand-written, naming the pinned process commit and the one command that fetches it. Never generated by the model." (`:1087`, TXT-1; its note was written in by the coordinator.)
- Ledger, kept: "A product's tranche runs on one pinned process version from open to close, named in the plan; every session verifies the pin once at start and says so." (`:1280`, MNT-4.) "A product receives: the short CLAUDE.md, one skill, a settings file carrying the standing permission list, the gate workflow with install and trigger paths, the prune workflow. Nothing else, and a check fails on drift." (`:1382`, SHM-1.)
- Foundations: "Each role's starting prompt names its own rulebook in the pinned process (rulebooks/\<role>.md)" (`evidence/foundations.md:169`); the product's CLAUDE.md is "written by BOB line by line ... only its pin line is changed by the tool when the pin moves" (`:171`).

**Bob's typed words of 14 Nov.** "M10: ROOT starts with the product repo, which contains the needed approvals in CLAUDE.md and settings.json" (`owner_words/bob_words_14nov_c.md:29`). The question it answers was the fourth draft's item 10: "ROOT's start: how a session you start with a plain prompt lands on your newest approvals." (`definition/process4_definition_v4.md`, section M.) His hint names the approvals and the settings file. It does not mention the tool or role texts. Also: "M3: the processes" (`:27`), on which repository PROCESS holds.

**The session's record of 13 Nov** (not his typed words), line 16 as the draft quotes it: "Your first prompt says you are starting or restarting development of a named product, names that product's repository, and says the Process4 development process is to be used." (`definition/process4_definition_v5.md:96`.)

**What the fifth draft says** (V):

- A session is started "with one repository only ... from the newest commit of the tranche branch; in Auto mode; and with starting instructions that name every act it may take. ROOT, started by your plain prompt, does not meet the last condition. Whether that works is unproven." (`:291`)
- "So the process's tool is each session's only door to GitHub." (`:287`) The allow rule "must match Process4's tool, or no session can push" (`:297`).
- "The product's CLAUDE.md stays under thirty lines. The process has its own repository and one fixed version for each tranche, moved only with your prior approval." (`:309`)
- "No Process4 tool exists ... No Process4 role texts exist" (`:361-362`). "Builder: Claude, before anything is in force." (`:366`)

