- One clause becomes dead and half untrue: "record a reviewed revert exemption (`p3 revert exempt`) ... as its reviewer and never as the job's own session", with the opening phrase "widened on 9 Nov 2026 for reviewed revert exemptions". With no reviewer nobody can take the act. It is harmless if left, since it permits and does not require.
- "review without approving" is a permission nobody will use.

**(ii) What measured result no longer applies and must be measured again.**
- "0 refusals in about 450 acts in the confirming round" (2 Nov), and with it "0 of 21 on typed consent": all of those merges were reviewed merges with the verdict on the command line. As a counted trial, an un-reviewed merge on committed approvals was measured twice (3 Nov grants check, depth 1 and depth 2, both ok).
- What stands in its place is use, not a trial: about 700 un-reviewed tool merges and 234 review-less lands with no recorded judge refusal or model decline, between 3 and 9 Nov, on Claude Code 2.1.316, at depths 0 to 3.
- That use does not cover what Process4 may choose: (a) a job session merging its own pull request (in Process3 a job's START said "Not yours ... merging", and the self-merge trial queued on 4 Nov was superseded on 5 Nov and never run); (b) a session enabling GitHub's auto-merge (never tried; denied by three rules and by the repository setting).
- The classifier has a `[Merge Without Review]` reason and a `[CI Bypass]` reason and used each once. Both fired on acts the approvals did not then name in so many words. That is the reason to count, not assume.

**(iii) What GitHub setting would block or need changing.**
- For "no review": none. Required approvals are 0 and no code-owner review is required.
- For GitHub's own auto-merge only: "Allow auto-merge" is off by a setup condition (`merge-settings`, `allow_auto_merge: false`), and only the owner can turn it on.

**(iv) What is unaffected.**
- The approvals channel (the owner's own committed `CLAUDE.md`), who may edit it, and why.
- The deny list and how it loads.
- Session-start rules: one repository, tranche tip by commit, Auto, acts named in the prompt.
- One act per command; never reword or reroute; the two kinds of refusal; the 3 and 20 thresholds.
- Every trial that was not a merge: session and task acts, deny removes the tool, the 10 of 10 against 0 of 10 (its acts were archive and delete-task), task-session limits, the 50-session limit, start by commit.
- GitHub accounts, rulesets, required check, environments, and the owner's approval of public releases through the `release` environment.

**One consequence outside the classifier.** Three tool rules make a review the only way through: the mandatory `--reviewed | --no-review` flag, the refusal of `--no-review` when the test trigger fires, and the reviewer-only revert exemption. With no reviewer, a job that deletes or skips a test, or a refactor whose tests pass before and after, could never merge under the Process3 tool. All three are removals, which the owner's rule on process fixes allows.

---

## Part 3. What the other Process4 decisions touch

### Component by component

Status: U unchanged; W wording change only; M needs re-measuring; R at risk.

| Component (Part 1) | Status | What, and who can change it |
| --- | --- | --- |
| Approvals channel: owner's website commit to `CLAUDE.md`, loaded at session start | U | "CLAUDE.md ... keep the purpose" keeps it. The owner's decision that he enters no source edits meets it: only he can write this text (process4_disposition, conflict APPR) |
| Approvals scope words: "working on Process3 or on products under it" (3 times), "Process3 pages and documents" | W, owner only | A Process4 session is not "working on Process3". Replace with the new name or a neutral phrase |
| Merge clause | U if sessions merge by a tool on a green check. W, owner only, if GitHub auto-merge: add the act of turning auto-merge on. Either way M | See trials T1 |
| "merge pull requests into working and tranche branches" | W optional, owner only | With no layers there are no shared working branches to merge into; the words are harmless |
| Revert-exemption clause, and "widened on 9 Nov 2026 for reviewed revert exemptions" | W optional, owner only | Dead with no reviewer and no revert check. Delete in the same edit |
| Workflow-file clause: "pull requests the merge tool merges after a green gate", "never making the process gate anything but the process's own shim at the pinned process" | W, owner only, if Process4 has no pinned shim | "never adding or renaming a job whose name matches a required check" stays essential: the required check is now the only merge decision |
| Lanes paragraph: "run under BOB", "lands through the merge tool without a test suite run", "built at layer close" | W, owner only | "BOB" is the old role name. "without a test suite run" is a second route past the required check, which "exactly three tests" may or may not intend. "layer close" no longer exists |
| Cleanup exception: "the merge train's train/head/* branches" | W optional, owner only | Names a mechanism removed on 6 Nov |
| Public release: "without my approval, given through the protected GitHub environment that names me as required reviewer" | U | Matches "he approves public releases" |
| Cloudflare, images, secrets paragraphs | U | "p3dev-" is a resource prefix in the account and in the product's config. Keep it or change both together |
| Heading `## Standing approvals from Bob` | U | It names the person, not the role |
| Process lines under `## Process3` in the product's `CLAUDE.md` | W, a session can | They name `start bob` and "ROOT starts a new BOB" |
| Approvals in the process repository | W or new, owner only; M | ROOT now loads this block, not the product's. P3's text already covers what ROOT does ("start, message, interrupt and archive Claude sessions working on Process3 or on a product developed with it") and already says product acts are "made only from a session started in that product's repository". A new repository needs a new block |
| Deny list: merge routes | U if sessions merge by a tool. R if GitHub auto-merge by `gh pr merge --auto`: `Bash(gh pr merge *)` and `Bash(gh *)` remove it, deny beats allow, and no rule can exempt `--auto` | Owner only |
| Deny list: `Bash(git push)`, `Bash(git push *)`, `Bash(gh *)` with allow `Bash(node .process/tool/p3.mjs github push *)` | R | These three rules make the Process3 tool the only way to push. If Process4's tool lives at another path or has no push wrapper, no session can push. Owner only |
| Deny list: file-write and API rules, force-push, main, history rules | U | |
| Allow `Artifact` | U | Needed only while sessions are told to make claude.ai artifacts |
| Retired `PreToolUse` hooks still in the product's settings | W, owner only | Remove; already drift |
| SessionStart hook | U | |
| One repository per session | R | ROOT is "started by the owner on the process repository with a prompt naming the product and its repository". If the owner attaches both repositories, the session loads no settings file and no deny list (PD-13). ROOT must hold the process repository only |
| ROOT rooted in the process repository, starting the architecture session in the product's | M | In Process3 ROOT was a product-rooted session. The nearest evidence is mixed: sessions the process-rooted coordinator started in COPY worked (97 pin moves); in PROBES their pushes were refused 2 of 2 on 8 Nov |
| Start from the integration branch's tip by commit; never main | U | The product's main still holds the 1 Nov approvals and the old deny list. If Process4 has no tranche, the owner's block and settings must be on whatever branch sessions start from |
| Auto for every role | U | Forced by the platform |
| Model and effort per role | U (never built) | Whatever Process4 says about effort is new, not preserved |
| Prompts name every act | W, a session can | Remove "review: start a read-only review worker" from the architecture role's acts. Name the merge act, or the auto-merge act, in the prompt of the session that takes it. A job's "Not yours ... merging" must change if jobs merge |
| Depth | U, better | Owner to ROOT (0), architecture session (1), jobs (2). Process3 ran jobs at 3 |
| Who creates sessions and tasks | W, a session can | Role name only. Refilling a slot "the moment a job merges" needs the architecture session woken on each merge: `subscribe_pr_activity` is an approved act; a pull request's events go to one session at a time |
| Eight job slots | U | Far below the 50-session limit. Each start is still judged (20 of 20, 20 of 20) |
| Coordinator as the owner's front door | U | Keep it single-repository; with three attached it met permission dialogs (handoff 5 Nov e) |
| One act per command; never reword or reroute; two kinds of refusal; housekeeping | U | Prompt text, a session can carry it over |
| Refusal count and REFRESH at 10; sweep catching three-in-a-row | R | Each is a count or an alarm outside the three tests. "A process fix may only correct or remove" does not remove what is there at the start, but the owner's "no others ever" may. Without them a session stopped by three refusals waits unseen |
| Approvals fingerprint: `start check`, wake hash, record check on the block and on `.claude/` | R | These are checks and stops outside the three tests. Without the record check nothing in git stops a session's pull request from changing the approvals or the deny list; the remaining guards are the judge's `[Instruction Poisoning]` (seen 2 of 2) and, if the owner adds it, CODEOWNERS with required code-owner review, which is his setting. Without the wake hash a long-lived session keeps old approvals silently; with it, every owner edit stops every role (5 times in Process3) |
| Tool's review flag, review trigger, revert exemption | Remove, a session can | See 2c |
| GitHub accounts, every-branch ruleset, Actions settings, secrets, environments | U | |
| Ruleset on main and the integration branch | U, with one check | Required approvals stay 0. The required check's name must be the job name Process4's test workflow reports, and it must report on every pull request, including ones that change no module, or auto-merge waits for ever |
| `allow_auto_merge` | Owner setting, only for GitHub auto-merge | Settings, General, "Allow auto-merge". This is the kind of act the owner keeps |
| Setup list (`conditions.json`) | W, a session can | `merge-settings` value; anything naming the tool |

### The smallest set of permission-related changes

Owner only (three acts, plus one that depends on the unsettled merge choice).
1. **One commit to the approvals block in the product's `CLAUDE.md`,** on the branch sessions start from. Needed words: the process's name in the scope sentence; "BOB" in the lanes paragraph. In the same commit, optional: delete the revert-exemption clause and its date phrase, the merge-train words, "layer close". If GitHub auto-merge is chosen: add that sessions may turn on auto-merge for pull requests into the integration branch.
2. **An approvals block in the process repository ROOT is started on,** covering starting, messaging, interrupting and archiving sessions for the product, and tasks. P3's 8 Nov text does this with one name changed.
3. **One commit to the product's `.claude/settings.json`:** delete the two retired `PreToolUse` hooks; make the push allow rule and the three push and `gh` deny rules agree with Process4's tool (or remove the three if there is no wrapper).
4. Only if GitHub auto-merge is chosen: tick "Allow auto-merge", and settle how a session turns it on while `gh` is denied.

Sessions (in the process's own files).
5. Remove the review flag requirement, the review trigger's refusal and `revert exempt` from the merge path.
6. Role prompts: rename the architecture role; drop the review act; name the merge or auto-merge act for the session that takes it; keep the one-act and never-reroute lines.
7. Start ROOT, the coordinator and every session with one repository each.

