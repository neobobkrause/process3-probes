# [file] enforcement_levers.md (continued)

- **(c) GitHub's "Require workflows to pass before merging".** It would be exact. It is Enterprise only and set at organization level: the documentation's feature flag lists Enterprise Cloud and Server only [doc today: `data/features/repo-rules-required-workflows.yml` in `github/docs`]. Not available to Bob.
- **A limit no form removes.** The check runs the module's tests, and those are files the job writes (row 12).

### Lever 7. Deny-list entries

- **What is measured.** "A project deny on an MCP tool removes the tool, and a deny on `Bash(touch:*)` blocks the command", 1 probe, 8 acts [P3 measured: permissions_inventory 1b, 1e row 3]. Deny refusals do not count toward the three-in-a-row stop [row 16].
- **What the documentation adds.** Path rules: "Read and Edit deny rules apply to Claude's built-in file tools, to file commands Claude Code recognizes in Bash, such as `cat`, `head`, `tail`, `sed`, and `tee`, and to the targets of Bash redirections ... They don't apply to ... arbitrary subprocesses that read or write files indirectly, like a Python or Node script" [doc today: code.claude.com/docs/en/permissions]. A bare tool name "removes the tool from Claude's context entirely" [same]. Worker types can be denied by name [same].
- **Entries that would bear on this problem.**
  - In the product: deny edits to `.github/`, `.claude/`, `CLAUDE.md`, the process copy and the process settings file. Deny the tool that attaches another repository to a session (this session has such a tool [tool today]; Process3's checker refused its use once, "Access Added As A Means" [permissions_inventory 1d]).
  - In the product, if the owner creates the hourly alarm himself: deny the tools that create or edit scheduled tasks [redteam_corruption 3c]. One file serves every role, so a tool ROOT needs cannot be denied to jobs only.
  - In the process repository: deny edits to its test folder and its workflow folder. A fix session then cannot add a test file or a CI job by ordinary means. It can still add a refusal inside existing code; no path rule can tell a correction from an addition there.
- **Proven.** Tool removal: measured once. Path-scoped edit denies: documented, never measured in Process3.
- **Left open.** A script or a git command gets round a path rule; the documentation says so. The list loads only in a session that holds one repository and starts from a branch that carries it: "a session with several repositories ... reads only the `enabledPlugins` and `extraKnownMarketplaces` keys ... not permission rules" [doc today: code.claude.com/docs/en/settings, "Settings in cloud sessions"; also P3 measured, permissions_inventory 1c]. The file is itself in the repository (rows 15, 16).
- **Cost.** One commit by Bob per change of the list.

### Lever 8. The permission checker acting on a "never" clause in Bob's own text

- **What the documentation says.** "The classifier reads the same CLAUDE.md content Claude itself loads, so an instruction like 'never force push' in your project's CLAUDE.md steers both Claude and the classifier at the same time" [doc today: code.claude.com/docs/en/auto-mode-config]. There is also a settings block for prose rules the checker blocks "even when the user asks", read from user or managed settings and never from the repository's own settings file [same].
- **Is there measured evidence that the checker enforces such a clause?** No.
  - No Process3 trial tested a prohibition by text alone. Every "never" in the approvals that held (force-push, branch deletion, main) also had a deny rule or a GitHub rule behind it.
  - The one direct comparison found the approvals made "NO DIFFERENCE" to the checker: 0 refused in 201, 201, 50 and 120 acts with and without them. Their measured effect was on the session's own model: 10 of 10 done with them, 0 of 10 without (or 2 of 10 in another copy of the record) [permissions_inventory 1e rows 18, 21 and the two discrepancies].
  - The approvals' clauses on workflow files ("never adding or renaming a job whose name matches a required check") were enforced by tool code, not by any recorded refusal of the checker.
  - The rule against adding checks was never in Bob's committed text in Process3. It was a "Nudge" in rulebooks, a line in three role prompts, and his words in chat [causal_forensics 1.4]. So "text alone did not hold" was measured for the weaker channels, not for this one.
- **How reliable is the checker in general?** Uneven. The same starting prompt passed in one environment and was refused in another in the same turn [permissions_inventory 2a]; archiving passed 2 of 5; an exemption passed twice on 8 Nov and was refused on 9 Nov; two pushes were refused with no reason [1e rows 5, 34, 35]. After one refusal it treated the next push as a bypass [1d].
- **Judgment on the mechanism.** The checker sees a command, not always the diff behind a push. "Is this an added check or a correction?" is a judgment, and a wrong "yes" three times in a row stops a session [P3 measured: 1e row 7].
- **Proven.** No. Not physical.
- **Cost.** One edit by Bob. If the start-up comparison of approvals stays, each edit stops every long-lived session, as it did five times [permissions_inventory 1a].

### Lever 9. Bob's text and rules held on the Claude side, outside any repository

- **What.** A cloud environment's setup script can write user-level instructions: "add a setup script that writes `~/.claude/CLAUDE.md` ... Claude Code loads that file as user instructions in the session" [doc today: code.claude.com/docs/en/cloud-environments]. A session cannot change its environment by itself: the tool that proposes a change "shows the user an approval prompt ... every time, in every permission mode" [tool today]. So a rule placed there is in no branch, cannot be changed by a pull request, and reaches every session started in that environment whatever commit it starts from.
- **Proven.** Partly. Process3 measured a setup script writing user-level checker settings once: 19 of 19 acts passed [permissions_inventory 1e row 4]. That shows the route existed, not that a prohibition placed there holds. The settings page says user settings from one's own machine are "not read" in a cloud session [doc today: code.claude.com/docs/en/settings]; whether a file the setup script writes inside the container is honoured for deny rules is not stated and not measured.
- **Stronger form, plan-dependent.** Server-managed settings reach cloud sessions and their deny rules "can't be overridden", but they exist only for "Claude for Teams and Claude for Enterprise" [doc today: code.claude.com/docs/en/server-managed-settings and auto-mode-config]. Bob's plan is unknown.
- **Left open.** A session can edit a file in its own container. Still text, or a path rule with lever 7's limits.
- **Cost.** A Claude-side setting, which is not one of the two kinds of setting on Bob's list (GitHub, Cloudflare). Section K item 2 already raises Claude-side set-up acts.

### Lever 10. A free GitHub organization

- **What it adds** [levers 1.4; only the "required reviewers" sentence was re-read today]. A real Read role for the sessions' account on the process repository. The merge queue on public repositories, which replaces any merge tool with exact semantics. File-pattern review requirements kept in the ruleset, not in a file inside the repository.
- **What it does not add.** Path restrictions on pushes (Team plan, private repositories only) and required workflows (Enterprise) [doc today, as under levers 4 and 6].
- **Cost.** One transfer of both repositories; the Claude and Cloudflare apps reinstalled; settings re-checked.

### Lever 11. Have nothing that can refuse

- **What.** Structural, and the largest. Every counted addition went into code that sessions run or that CI runs (rows 1 to 5). If Process4's process is GitHub settings, one test workflow and short role texts, with no session-run tool, rows 1, 2 and 4 do not exist. A session cannot add a refusal to a tool that is not there.
- **Proven.** The direction is: the one hard cap in Process3 held all week while uncapped code grew 16 times [causal_forensics, Headline]. The specific design is not.
- **Left open.** The work the tool did must be done by hand in each session from its text (status read-out, the fixed slot rule, the notice). Text-following is text.

---

## 3. What earlier reviewers concluded about a wall round the process repository

**They found the wall itself sound.**

- Levers paper, finding 1: "The process repository needs no wall-building at all ... If the session account is simply not a collaborator on it, GitHub refuses every write."
- Corruption review, verdict: "the wall around the process repository is sound and I could not break it." Under "Tried to break, could not": "A non-collaborator cannot push, and nothing in the product can stand in for the reusable workflow without touching `.github/**`. The only route in is the owner's merge."

**What broke the proposal built on it was not a hole in the wall.**

1. **The growth moves to whatever is not walled.** "The draft then assumes that walling the place where Process3's growth happened removes the growth. The record says growth goes to whatever is uncapped" [redteam_corruption, verdict]. Named outlets: everything on the Claude side (prompts, tasks, messages, worker briefs), the product's tests and walker, helper scripts in the product, labels, requirement files [channel table].
2. **Every defect in the walled part becomes a stop only the owner can clear.** "The first gate defect in run 1 stops all product work, and only the owner can clear it" [redteam_corruption 1; stall table].
3. **The owner's merge button is the remaining route, and he presses it** [redteam_corruption 5].
4. **The owner's requirements exclude the merge that the wall depends on.** Audit D calls it a triangle: "The proposal's one physical defence against the Process3 loop is the owner's merge. Remove the merge (requirement 1) and either sessions can change the process again, or a process defect cannot be fixed with no one watching (requirement 2)" [audit_D 6(iii) item 7]. It asks that "whatever keeps the process from growing holds without him" [6(ii) item 1], and leaves the choice of corner to the owner.
5. **Guarding paths in the product put him in the path of routine work**, and two details were unproven: the sole code owner cannot approve his own change, and zero approvals with code-owner review is untested [redteam_feasibility 8].
6. **Two byte and line caps did not cap, and the first contents are written before any wall exists** [redteam_corruption 7].

The present draft of the definition took the other corner: sessions fix the process (section E), and item J 8 records that nothing physical then holds the rule.

---

## 4. The residue

After the best combination of levers, these remain open to text rules only.

1. **A session being more cautious in its own work.** Running tests again, reading again, asking, not marking a pull request ready, not merging. No setting reaches it.
2. **Demands written into another session's starting instructions, or sent as messages.** The call that starts a session takes free text [tool today]. Nothing compares it with any template. Messages worked as standing rules in Process3.
3. **Workers used as reviewers.** The definition forbids it; a session can still brief one. Denying a worker type removes bulk reading with it.
4. **Tests inside a module's own tests that test the process and not the product,** and added walk steps. These run inside two of the three tests, so they can fail a job. They cannot be walled without stopping the job's real work.
5. **A refusal added inside existing code by whoever may fix the process.** If sessions fix it, no path rule separates a correction from an addition. If only Bob merges, the stop is his reading of a diff, and the record says that does not hold.
6. **Helper scripts in the product that jobs are told to run:** a second tool, regrown outside the process repository.
7. **Rule text in files sessions must write:** requirement files, plan files, the module map, labels, pull-request comments.
8. **Scheduled tasks and extra sessions as watchers,** unless the task tools are denied to every role.
9. **Drafts for Bob.** Sessions drafted approvals text that he then committed; one such commit added a hook before every command. A question from him came back as a mechanism every time [causal_forensics 4.2, driver 9].
10. **The first contents.** Process4 itself will be written by sessions before any wall stands.

Items 1, 2, 3 and 9 leave no record in git. Items 4, 6 and 7 can be counted after the fact, which is reporting, not prevention.

---

## 5. The strongest combinations (my judgment, not a finding)

Each takes a different corner of the triangle in section 3.

### A. Wall the process, let GitHub decide the merge

Levers 11, 1, 2(a), 3, 6(a), 5, 7, and 4 for the few owned paths.


Rule for jobs: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Greta Lindqvist`.

- The process is settings, one test workflow and short texts, in a repository the sessions' account cannot write. The product names one reference only Bob moves. No merge tool. Only named workflow files run for the sessions' account.
- **Holds physically:** rows 1 to 6, 8 and 14. That is every place Process3's counted additions were made.
- **Costs Bob:** one sitting of settings; one merge and one move of the reference for every process fix; a click for each change to the product's own workflows (two in nine days in Process3); wording edits to approvals and deny list. A blocking process fault waits for him. This is the corner the central audit said breaks "unattended" and "very occasionally".
- **Unproven parts:** zero approvals with code-owner review; the Actions policy; a merge with no tool at ARCH's level (section J item 1).
- **Leaves open:** the whole residue. Option: lever 10 adds the merge queue and a real Read role for one transfer.

### B. Split the process by what can stop a merge

Levers 11, 3, 6, 5, 2 for the gate only, 7.

- The part that can block (the required check's workflow and the reference to it) is Bob's alone. The part that cannot block (role texts, the status read-out's wording) stays writable by a fix session, as section E says.
- **Holds physically:** no session can add or change anything that stops a merge on GitHub's side. A text a session adds can ask for more; it cannot refuse.
- **Costs Bob:** an act only when the gate itself is faulty. Text faults are fixed unattended.
- **Leaves open:** role texts can grow demands (residue 2 in a durable form), unless a hard size limit is kept. The one such limit in Process3 held all week, but it was a test in the process repository; Bob should rule on whether keeping an existing limit counts against "no others". Everything else in the residue.

### C. No wall: the rule in Bob's strongest text channel, with narrow denies

Levers 8, 9, 7, and 3.

- Sessions keep Write on the process repository and fix it unattended. The rule "a fix corrects or removes, never adds a test, gate, review or stop" goes into Bob's own committed approvals in the process repository, where fix sessions load it and the checker reads it, and where Process3 never put it. The process repository's deny list refuses edits to its test and workflow folders.
- **Costs Bob:** two commits. Nothing waits for him.
- **Proven:** nothing. This is still text plus a path rule that a script can pass. The trial in section J item 8 would measure it; it "can break the claim. It cannot prove it."
- **Leaves open:** rows 1 to 3 in substance, and the whole residue.

**Order.** A holds most and costs Bob most. B holds what can stop work and costs him only gate faults. C costs nothing and rests on an unmeasured hope. Under every one of them the residue stays, and the corruption review's warning applies: growth goes to what is not walled.

---

## 6. What I could not determine

- The owner account's GitHub plan, and the live settings of either repository (rulesets, collaborators, Actions settings, where the Claude GitHub App is installed). The API was closed to this session.
- The owner's Claude plan, and so whether managed settings are available.
- Whether "zero required approvals plus code-owner review" passes ordinary pull requests on a personal repository; whether a submodule entry can be owned.
- How the Actions policy names the actor for a merge made by GitHub's auto-merge, and whether a blocked run shows red on a pull request.
- How GitHub treats two check runs with the same required name from two workflows.
- Whether the checker lets a session enable auto-merge, and whether a GitHub tool for that exists in cloud sessions.
- Whether settings a setup script writes inside the container are honoured for deny rules. Process3's one trial used a different key.
- Whether the Claude GitHub connection can be granted without the right to write workflow files. Process3 sessions did write them (15 commits from 1 Nov), so today it has that right.
- Any measured case of the checker enforcing a prohibition that had no deny rule or GitHub rule behind it. I found none.
- How often a blocking process fault would occur in a process as small as Process4's. Process3's rate (296 process merges, 116 version moves, nine days) is for a tool of 24,000 lines.

## 7. Sources

- Handoff files, read in full: `process4_definition_main.md`, `permissions_inventory.md`, `redteam_corruption.md`, `redteam_feasibility.md`. Read by section: `levers_github_cloudflare_product.md` (sections 0 to 3), `causal_forensics.md` (1 to 3, 6 to 8), `change_sample.md` (summary, 1, 2, 5, 6), `audit_D_central.md` (5, 6), `product_side.md` (4, 6).
- Clones made today in `/home/user/repos/`: `process3`, `civicsmith-copy`. Counts marked [repo today] are from `git log` on `origin/tranche` of each.
- GitHub documentation source, `github/docs` branch `main`, fetched today: `about-rulesets.md`, `available-rules-for-rulesets.md`, the gated-feature texts `repo-rules.md`, `code-owners.md`, `auto-merge.md`, the feature file `repo-rules-required-workflows.yml`, `about-code-owners.md`, `about-actions-policies.md`, `control-workflow-execution.md`, `use-variables.md` with its permission statements, `events-that-trigger-workflows.md`, `securely-using-pull_request_target.md`, `managing-github-actions-settings-for-a-repository.md`. Two pages read as rendered: the permission levels page for personal repositories, and the REST page for Actions policies.
- Claude Code documentation, fetched today from code.claude.com/docs/en: `auto-mode-config`, `permissions`, `settings`, `cloud-environments`, `claude-code-on-the-web`, `server-managed-settings`.


# [file] codex-first-class-feasibility-20261117.md

# Process4 first-class Codex session feasibility

**November 17, 2026. Decision C for the current hosted Process4 architecture. Pause development that depends on autonomous creation and reactivation of independently listed Codex sessions.** A supported interface must allow an existing hosted Process4 session to start a current Cloud conversation under the owner's account and add a new turn to an existing one by ID. That interface is unavailable in the tested runtime. A dot-led coordinator is a conditional architecture change worth one bounded test if the account already includes it.

## Evidence and findings

- **Demonstrated in prior Process4 experiments.** Native child creation, follow-up after completion, reactive supervision and replacement with context preservation worked. The owner's PROCESS question was relayed through the console. This proves native hierarchy behavior only. Current implementation documents were reviewed in full at [probe branch head](https://github.com/neobobkrause/process3-probes/tree/3a73a354c9950164c6bfdb0c6d6b0762106e3674/bootstrap), including HANDOFF, INTERACTIVE-SESSIONS, ROOT-LAYOUT-PROPOSAL and the interactivity evidence index.
- **Demonstrated in the earlier preflight, with the 401 reported separately.** The installed CLI previously reported ChatGPT login mode while its Cloud list request received a token-parse 401. Login mode is local state and says nothing about acceptance by a given service. The exact cause remains unknown. The browser observation applied to managed Chrome. No earlier test submitted a Cloud task. The three prior reports in this directory were reviewed in full. [Earlier preflight](first-class-session-minimal-owner-result-20261117.md)
- **Officially documented, with a source-confirmed implementation gap.** Experimental `codex cloud exec --env` submits a task and prints its URL when accepted. The public implementation still discovers environments through the older WHAM service and lacks an add-turn operation in its Cloud task interface. A same-account report obtained HTTP 200 yet could see only the legacy catalog in that CLI, independently of the previous Process4 401. The legacy CLI may create eligible legacy tasks, but success would leave current Cloud visibility and programmatic continuation unproved. [CLI reference](https://learn.chatgpt.com/docs/cli/reference) · [Environment discovery](https://github.com/openai/codex/blob/c08843a5bd16de5524129b2f4270490447991984/codex-rs/cloud-tasks/src/env_detect.rs) · [Task backend](https://github.com/openai/codex/blob/c08843a5bd16de5524129b2f4270490447991984/codex-rs/cloud-tasks-client/src/api.rs#L136) · [Catalog report](https://github.com/openai/codex/issues/50182) · [Lifecycle request](https://github.com/openai/codex/issues/24777)
- **Officially documented preview, source-confirmed primitives, account access unverified.** The experimental macOS/Linux TUI Cloud connection is a different client path. At public main c08843a5bd16de5524129b2f4270490447991984, its backend lists threads, prewarms a thread, activates it by ID, and submits a message with start-if-idle, steer or queue semantics. The documented entry point is a signed-in TUI host switch. No documented headless entry point or hosted delegation/authentication contract usable by Process4 was found. The reusable Rust client takes caller-supplied authorization and its README qualifies public ingress. The source is evidence that primitives exist, not a deployment or entitlement result. [TUI preview](https://learn.chatgpt.com/docs/developer-commands?surface=cli) · [Cloud backend](https://github.com/openai/codex/blob/c08843a5bd16de5524129b2f4270490447991984/codex-rs/app-server-client/src/cloud_backend/requests.rs) · [Native client](https://github.com/openai/codex/blob/c08843a5bd16de5524129b2f4270490447991984/codex-rs/cloud-client/README.md)
- **Demonstrated in this investigation.** Installed 0.167.0-alpha.4 exposes the preview flag, off by default. A no-prompt startup using that flag failed on its read-only daemon state path. Using the advertised no-daemon option failed opening local SQLite state. Per-invocation workspace-local SQLite and log overrides still yielded a read-only-filesystem error before a usable Cloud selector was observed. The legacy 401 was not retried. No credentials were inspected or moved. The runtime exposed no general Cloud thread tool or dot invocation. No task was submitted, so there is no task ID, owner link, UI verification, direct message or peer wake result. This preflight establishes a runtime obstacle, not an account entitlement failure.
- **Officially documented owner lifecycle.** Users can open and continue the same current Cloud task across desktop, web and mobile after the initial work. A default environment can be available without a repo. A reusable repo-backed setup requires a published environment. The default seven-day recovery window applies to VM state, not to conversation history. Desktop can launch Cloud work from project context. Machine assignment of an independently created Cloud thread to a product project, or cross-product placement of PROCESS, remains unverified. [Cloud guide](https://help.openai.com/en/articles/20001545-using-codex-cloud) · [Project context](https://learn.chatgpt.com/docs/environments/modes)
- **Officially documented alternative.** An eligible ChatGPT dot can create separate visible Cloud conversations and send follow-ups. Owners can independently open and steer the resulting threads. A dot can use an already-set-up Cloud coding environment with the owner's computer offline. No documented invocation interface from an unrelated hosted Codex session was found. Ordinary-list placement in this account, programmatic project membership, two-way session messaging and wake-up by an independent Process4 peer remain unverified. Enterprise Slack/Teams delegation is separately gated and follows up through the same connected account. GitHub and Linear integrations use Legacy. [Dot lifecycle](https://learn.chatgpt.com/docs/dots/tasks-and-memory) · [Cloud delegation](https://learn.chatgpt.com/docs/environments/cloud-environments)
- **Officially documented scope and costs.** Standard Cloud tasks have no separate VM charge at launch and consume normal Codex usage. Availability depends on plan, rollout and managed workspace policy. Eligible Pro and Business Premium dots use normal Codex limits for delegated coding, while Enterprise pricing can include separately charged delegation. SDK and app-server can create and resume threads on their serving host; remote control/SSH exposes connected-host projects and chats. Enterprise access tokens are documented for trusted local automation. Scheduled runs target existing chats or produce runs surfaced in Scheduled, with no documented same-ID peer-message contract for independently listed Cloud tasks. The Agents API uses a separate Platform project and authentication and does not establish owner Codex sidebar membership. [Subscription](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) · [Dots eligibility](https://learn.chatgpt.com/docs/dots) · [Remote connections](https://learn.chatgpt.com/docs/remote-connections) · [App Server](https://learn.chatgpt.com/docs/app-server) · [Enterprise tokens](https://learn.chatgpt.com/docs/enterprise/access-tokens) · [Scheduled tasks](https://learn.chatgpt.com/docs/automations) · [Agents API](https://help.openai.com/en/articles/20001551-agents-api-beta-faq)

## Reopen criteria

For the existing architecture, reopen when a supported Cloud-backed tool or headless client exposes start, fetch/list and add-turn by stable ID to an already-authorized hosted session under included usage. Run a single read-only creation, capture ID and owner link, observe completion, and verify owner visibility and direct follow-up in one visit. Then have a second Process4-controlled session add a turn to the same idle ID and observe its reply. Verify product-project placement if offered. Normal owner sign-in from a supported desktop/CLI can enable an owner-client test, but does not grant the hosted runtime these operations.

If a dot-led coordinator is acceptable and dots are already enabled with included usage, one owner-started dot instruction can delegate a disposable read-only Cloud task and follow up after completion. Open the resulting conversation from the ordinary Codex list and reply there. This can establish owner access and dot-driven reactivation before any redesign. It cannot establish session-to-session invocation unless that is separately demonstrated. No owner account change is needed to reach the present decision.


# [file] process4_audit2.md

# Process4, fifth draft: the second full audit

14 Nov 2026. For Bob, from a recording worker for Claude. Nothing here is your decision, and nothing here is proven to work.

You asked on 14 Nov: "perhaps this is a good time to repeat the full audit of process4 as currently defined, including a counter-argument audit. This will give a clearer look at that shape the design is in and provide a map where the focus is still needed."

Three AI workers each read the fifth draft in full. You have not seen their reports. **The run audit** asked whether it would run (22 findings). **The drift audit** asked whether it would go the way of Process3, stall, or report success falsely (12). **The requirements audit** held it against your 288 requirement lines, from your Keep and Drop Ledger and your Foundations, and against your typed words (17).

*Measured:* counted in Process3's record or in today's files. *Estimated:* worked out from measured figures. *Judged:* an auditor's opinion. *Unproven:* never run. "The first round" is the audit of the second draft, whose 87 counter-arguments you were given earlier today. "Process3's decision record" is the file where Process3's sessions wrote down decisions, in places quoting you.

## 1. The short version

- All three audits find the fifth draft better than the one the first round attacked. None finds it ready to build from. The run audit judges that as written it would not run: it stops in four places before the first job merges and in at least five more before a tranche could end.
- Closed since the first round by your own words, and not broken by the drift audit (judged): sessions that build the product no longer own the process; a tranche no longer reaches the main branch on a walk of a product never deployed; the notification is set aside for study, not built; "no change" is always an option at PROCESS.
- Best founded: the life of one job. About 700 merges with no review went through Process3's tool with no recorded refusal (measured). Process4's tool is not built.

What most stands in the way:

1. **The end of a tranche.** The two documents the walks are measured against are not in the folder as the draft says (measured). Sessions write them, and one session decides that a walk was clean. No walk came clean in Process3, and the external walk as you now define it never ran there (both measured). Nothing bounds the rounds or says how large a tranche is.
2. **The rule that only PROCESS changes the process is still held by words alone.** The process's own repository today carries approvals in your name that let a session merge a change there without you (measured).
3. **The first hour.** The answer chosen for ROOT's start is aimed at a fault the record does not show (measured). Nothing says in what order the two repositories are converted, or how the process's tool and role texts reach a session.
4. **Five steps have nobody named to do them:** writing new work into a module, moving a product to a changed process, deploying, preparing a release, archiving finished sessions.
5. **The release.** Your statements read two ways. Under the draft's reading the installer, an upgrade of an existing site and the assistant could first be used, unwalked, by a real team.
6. **Your 288 lines** (the requirements audit's counts). 112 kept and stated; 53 kept but stated nowhere; 75 ended or cut, 33 of them by Claude without being put to you; 4 contradicted. Nothing says whether your Ledger or the definition governs.
7. **Text.** The drift audit lists 51 rules in the draft and finds something physical behind six.

Fourteen questions are yours (section 3). For seven things no auditor found a remedy within your rules (section 6).

## 2. The map

Where the three auditors differ, each state is given. Question numbers refer to section 3.

| Area | State | Why | Needs next |
| --- | --- | --- | --- |
| Roles and sessions | **Stated but unproven** (all three) | Every standing role is named. Five kinds of long-lived session; the four that Process3 had were each replaced every few hours (measured). The watcher contradicts the sentence that no session starts its own replacement. | Your decision (question 12); a trial |
| The life of a job | Run: **stated but unproven, thin at the edges.** Drift: **stated but unproven.** Requirements: **solid** | Requirements audit: fourteen of your job lines honoured, one reversed. The others find the edges open: the last step (the notification), a job that needs something from another module, a job that dies after its tests pass. | Your decision (questions 5, 10); Claude's work |
| Rounds, the two walks, the end of a tranche | Run: **contradictory and thin.** Drift: **thin, contradictory in one place.** Requirements: **stated but unproven** | Requirements audit: it now stands in your own typed words. The others: the documents are not where the draft says, neither walk can be run as written, one session decides "clean", nothing bounds the rounds. | Your decision (questions 1, 2, 13); a trial |
| The release | Run: **missing.** Drift: **contradictory.** Requirements: **thin** | Nobody is named to prepare it; two things it needs were never built (measured); your approvals forbid sessions to change the installer and website; your statements read two ways. | Your decision (question 7); the build |
| The notification to modules that use a changed module | **Missing** (all three), by your decision, under study | Said honestly. Run audit: every job's last step and the tool wait on it, so the process cannot start on the real product until it is settled. | The study, then your decision |
| PROCESS and changing the process | Run: **thin.** Drift: **thin.** Requirements: **contradictory** | Your paragraph is quoted whole and followed. Nothing physical holds it; the steps after "ROOT starts PROCESS" are unwritten. Requirements audit: older lines of yours that say the opposite go unmentioned. | Your decision (questions 3, 4, 11); Claude's work |
| Permissions and starting sessions | Run: **contradictory.** Drift and requirements: **stated but unproven** | The parts kept from Process3 are the best measured in the design. Run audit: the one new decision answers a fault the record does not show, and the conversion has no order. The others: your approvals now stand behind the permission checker alone. | Claude's work; a trial; your decision (question 9) |
| Shared facts and waking sessions | Run: **thin.** Drift: **thin.** Requirements: **contradictory** | Waking is answered, with no run in the record. The place for shared facts is one sentence. Requirements audit: ten lines you kept rely on one command that prints the state, and the tool lacks it. | Claude's work; a trial |
| Recovery when a session dies or is stopped | Run: **thin.** Drift: **stated but unproven.** Requirements: **thin** | A dead job has an answer that was built and used (measured). A dead ROOT or PROCESS, a switch of account (failed 5 Nov, cancelled 7 Nov, measured) and starting again after a stop are thin or absent. | Claude's work; a trial; your decision (question 12) |
| Reports | Run: **solid enough.** Requirements: **solid.** Drift: **thin** | One report, one author, read by nothing to decide anything. Drift audit: it is written only when a tranche ends; Process3's never ended and none was written (measured). | Claude's work |
| What has not been built | Drift: **solid as a statement.** Requirements: **stated but unproven.** Run: **stated, and understated** | The list is honest. The run audit finds twelve things the draft relies on missing from it; the drift audit two; the requirements audit one. | Claude's work, then the build |
| What has not been proven | Requirements: **solid as a list.** Drift: **solid as a statement, thin as a plan.** Run: **stated, with a weak trial plan** | The trial repository needs converting first, the cost to you is understated, and about a third of the items cannot be tried on made-up modules (judged). | Claude's work; a trial |
| The account of your 288 requirement lines | Requirements audit only: **contradictory** | 112 kept and stated; 43 kept in purpose, the way changed; 75 ended or cut; 53 kept and stated nowhere; 4 contradicted; 1 dropped without a word. | Your decision (questions 6, 11); Claude's work |

## 3. Questions that are yours

In order of how much each blocks. "The auditor's suggestion" marks a recommendation from an audit report; where none is marked, none was given.

### 1. What the walks are measured against, and whether sessions may change it

**What it is.** Two statements of yours differ; the audits do not choose. On 14 Nov: "screens and journeys are kept in docs/development/ux-substrate/ in the product repo". In the standing approvals you committed in the product's repository (the audits give no date, and do not show who drafted the sentence): "Their design documents are claude.ai artifacts, not repository files." Measured today: the folder's first page says the Screens and Journeys documents are claude.ai pages; what the folder holds is data for programs: a list of screens, with 135 of its 679 screen acts marked not built yet, and one script of journeys. Sessions made 61 of the 63 changes to it from 1 to 9 Nov.

**Why it matters to you.** Every tranche's end and every release is measured against these. If sessions write them, a walk can come clean by changing the document.

**The options.** (a) The claude.ai pages are the documents: nothing moves; their history is outside git, and whether a cloud session can open them is not known. (b) They go back into the folder as files (the auditor's suggestion, drift audit): history in git, at the cost of a restoring. (c) The machine data is what the walks follow: you cannot read it, and it describes more than is built. With each: either sessions may change them, and a tranche's end rests on what sessions write; or only you may, and each ruling that something is "as designed" waits for you. Also the auditor's suggestion: a walk is without flaws when every journey in your journeys document was followed to its end and none is listed as a flaw, a note or "not walked". The meaning you answered "agreed" to on 14 Nov looks one walk back only (judged).

### 2. How large a tranche is, and what happens to one that will not come clean

**What it is.** Nothing says what a tranche contains. A walk is of the whole product, so a tranche cannot end while any older fault a walk can see remains (judged). On the real product the first round is about 177 jobs (estimated) before any walk. Process3 ended with 147 of 157 deployed steps failing (measured). The draft's "Only your word ends a tranche that will not come clean" is Claude's sentence. Yours, 14 Nov: "So a tranche only ends when an external walk (of a development deployment) completes without flaws."

**Why it matters to you.** This is the point Process3 never passed. The run audit judges a smaller tranche the only lever in your hands that is not a new check.

**The options.** (a) A tranche is all the product's open work: no decision now; the first walk comes after about 177 jobs and carries every flaw Process3 left. (b) You set a smaller content for each tranche, and say which part of the two documents its walks cover and whether an older flaw holds it open: a decision at each tranche, and a clean walk of a part says less about the whole. Separately: a tranche you end by your word is either merged with its flaws, which sits against your "So a release is always fully tested and walked successfully" (14 Nov), or dropped. Nothing says which.

### 3. Should the rule that only PROCESS changes the process be backed by a setting only you can change

**What it is.** You wrote on 14 Nov: "That rule exists only as text, and in Process3 text alone did not hold." It is still only text. A setting was withdrawn on 13 Nov because it needed acts of yours and made work wait for you. The drift audit judges that your words of 14 Nov now accept both: "Process changes only happen in a separate process lane call PROCESS that I interact with" and "will be done only with my prior approval". Measured today: where the Process4 work is kept, your approvals of 1 and 2 Nov let sessions merge changes with no person's review, and there is no deny list.

**Why it matters to you.** In Process3 sessions made 270 of 296 process changes (measured). And your approval at PROCESS is written down by the session whose change is being approved.

**The options.** (a) Words only, as now: no new act; the risk stays. (b) The auditor's suggestion (drift audit): the branch of the process's repository that products use can be updated only by you, and your merge on GitHub's website is the approval. One act of yours for each approved change. Never measured; needs a trial. (c) With either, you commit new approvals there saying a change is merged only on your word at PROCESS. None of these stops growth in the product's repository (question 8). Also yours to confirm: who moves a product to a changed process once you approve. The draft forbids the product's sessions to do it, and nobody is named.

### 4. What a session building the product does while a process fault waits for you

**What it is.** You wrote on 14 Nov: "Because updates require my involvement and I might be away from my computer for extended periods". The draft says no session building a product "fixes it or works round it". "Works round" is Claude's wording. The post-mortem review of Process3, a session's report, said the opposite: "A process flaw found mid-tranche gets one line in a log and a workaround." The draft does not say what waiting sessions do.

**Why it matters to you.** The first tranche runs on a tool not yet built, so such faults are the expected case in its first hours (judged). In Process3 one question carried as yours waited about nine hours (measured).

**The options.** (a) Wait and nothing else: the stopped job says so in one line and stops; work the fault does not touch goes on. Cost: idle hours while you are away, and (judged) pressure to put a fix into the product instead. (b) A session may do by hand, once, what the tool failed to do, write one line, and change no file of the process. Cost: a session judges what "by hand, once" covers. The audit does not choose.

### 5. How new work enters a module

**What it is.** You wrote on 14 Nov: "A job for module A isn't allowed to change module B. The only other way of editing a module is when a mechanical edit (like a word table change) makes the change." A module's requirements file is part of the module. So, as worded, nobody but its own job may write a new requirement into it. In Process3 the architecture session wrote requirements (measured).

**Why it matters to you.** The first requirement that crosses from one module to another has no route (judged: stops a tranche).

**The options.** (a) ARCH writes requirements and their marks, and that is not "editing a module" in your sense. (b) Requirements reach a module only through its own job, with ARCH handing over the text: a job start for each.

### 6. Which governs where your Ledger and Foundations say the opposite of the definition

**What it is.** The definition ends or cuts 75 of your lines. Your stored Ledger still says "keep" or "modify" for 38 of them, and your Foundations still state the other 37. The definition does not say that it governs.

**Why it matters to you.** Role texts will be written from one or the other. In Process3 a session brought back a removed check by citing Ledger lines (measured).

**The options** (both the auditor's suggestion, requirements audit). (a) One sentence: where they differ, the definition is followed from the day you accept it, and the Ledger and Foundations are kept as the record of what you decided before 13 Nov. (b) Both are retired as documents sessions read. Either way the 53 kept lines the definition states nowhere must first be put back into it (Claude's work).

### 7. Whether a release has a further walk

**What it is.** Your statements; the audits do not choose between them.

- 14 Nov: "A release can (optionally) be started after a tranche completes. So a release is always fully tested and walked successfully."
- 14 Nov: "A tranche can end without an AI enabled run"; "installer and website are outside the tranche"; "installer and site updates wait for a clean development release walk".
- 9 Nov, as Process3's decision record quotes you: "Yes, the installer update and site update wait until a release walk with AI on is also clean."
- 14 Nov, the external walk "follows the UX journeys to confirm that all journeys can be completed successfully to produce proper results."

The draft reads "development release walk" as the walk that ends the tranche, never says what a development release is, and did not show you the 9 Nov sentence. Measured: three journeys in the folder's script begin at the installer or the website, and about nine need the assistant.

**Why it matters to you.** It is what "released" means. Five earlier releases each broke existing stored data, unseen because every test began from a fresh copy (measured).

**The options.** (a) The release waits only for the walk that ended the tranche: the installer, an upgrade and the AI journeys go out unwalked. (b) A development release is cut and walked, with the installer and with AI on, before the installer and website are updated. The drift audit judges this an external walk of another deployment, not a new kind of test. Cost: one more deployment and walk for each release, and an AI account connected by you. Either way a development deployment cannot complete the journeys that begin at the installer or the website.

### 8. What "no more tests" bounds inside the product's own tests and walk steps

**What it is.** You wrote on 14 Nov: "There is no need to any any more tests. PERIOD!" and "Process3 never finished a tranche because it kept adding test after test so that it stopped making progress before it could finish." The draft, as Claude's decision, allows any number of module tests and walk steps so long as each names a product requirement. Sessions also write the requirement lines.

**Why it matters to you.** The draft holds the process's repository still and leaves the product's open; growth can go there without waiting for you (judged). The walk's steps went from 238 to 357 inside one round of Process3 (measured).

**The options.** (a) Three kinds of test with no limit on their number, as the draft has it: the risk stays, held by text. (b) The walks' steps are held to your screens and journeys documents: depends on question 1, and a step the documents lack cannot be added without changing them.

### 9. What protects your approvals, and the stop at each edit of them

**What it is.** Two statements meet. Yours, 14 Nov: "three tests and no others". The record of your decisions of 13 Nov, written by a session: "Process3's permission management is preserved." On the first, the draft ends the guard that stopped a session's proposed change from altering your approvals. On the second, it keeps the comparison that stops every long-lived session when you edit them.

**Why it matters to you.** With the guard gone, the permission checker alone protects your approvals. It refused such an edit 2 times of 2, and elsewhere passed and refused the same act minutes apart (both measured). A line you kept in your Ledger says: "The classifier is defence in depth, never the policy." (The classifier is the permission checker.) The comparison stopped everything at each of your five edits in Process3, and after the last the product never restarted (measured).

**The options.** The comparison: keep it, with a full stop and restart at each edit; or remove it, so that only sessions started after your edit load the new text (the auditor's suggestion, run and drift audits) and old and new approvals are in use together for a time. The protection: accept the checker alone; or a GitHub setting so that only your account can change the two files. That setting is unproven, and it works by requiring your approval on a change, which you may count as a gate. If you do, no answer was found.
