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

