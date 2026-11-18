- **Needs:** a second Claude account of Bob's, with usage of its own. Bob's acts there: connect GitHub as the sessions' account, check the Claude GitHub App covers the repository, create the cloud environment, start ROOT. These are the Claude-side acts that K for Bob 2 asks him to accept. About six sessions across the two accounts, one to two hours.
- **Risk:** connecting GitHub on the new account as the wrong user. On 5 Nov every push then went out as Bob himself, the repository's admin [record]. Sessions left alive on the old account.
- **Judgment:** rehearse this only when a real switch is near, and on the throwaway repository.

---

## 2. What the probes repository holds

`neobobkrause/process3-probes`, public, cloned today. 312 branches; `main` has 97 commits to 2 Nov.

- **`origin/phase0/platform-table`: `platform/TABLE.md`**, 31 rows measured on 1 Nov, each with saved tool results under `platform/evidence/`. Reusable as written, with names changed:
  - `evidence/28/driver-prompt.md`: 20 rounds of push, open, comment, merge, session start, interrupt, archive, task create, switch off, delete. The model for J1.
  - `evidence/31/claudemd-vs-control.md`: the unforeseen-ask probe with and without Bob's committed text, and how the checker's decision is read from the event list. The model for J3 and J10.
  - `evidence/3/3b-project-settings.md`, `evidence/24/deny-x3.md`: deny-list probes. J3.
  - `evidence/7/`, `evidence/9/`, `evidence/20/`: task firings into a bound session, and firing by hand. J7.
  - `evidence/26/`, `evidence/27/`: whose message a session acts on. J6, J12 stop.
  - `evidence/19/container-limit.md`: the limit of about 50 live sessions.
- **`main`:** the 2 Nov rounds, `physics/r3`, `r4` and `c1` to `c15`: 38 merges into the tranche and 13 of the tranche into main, every one with a `Reviewed:` line [record: permissions_inventory 2a]. Also Bob's approvals of 2 Nov, an 11-rule deny list, and a five-second test workflow (`.github/workflows/probe.yml`) that can be copied as the trial's required check.
- **What it does not hold:** any trial of a merge with no review at ARCH's level started from Bob's own ROOT; any trial of the alarm on a ROOT Bob started; any approvals-edit trial; any evidence file for the 2 Nov counts ("11 of 11", "0 of 21", "about 450"), which rest on the Foundations alone [record: permissions_inventory, limits].
- The repository itself must not be used for the new trials: it is one of the existing public repositories, and its approvals name Process3.

---

## 3. J4 and J5: the offline replay, checked today

### Feasibility: yes, complete, from the local clones

- **Records.** `origin/process-state` in `/home/user/repos/civicsmith-copy`, tip `c4c2529`: `notices/<provider>-<pr>.json` (178), `notices/triage/<user>-<provider>-<pr>.json` (3,125), `notices/answered/` (2,542), `notices/withdrawn/` (6).
- **Commits.** Each notice names a pull request. Its merge commit has the subject `Merge job PR <n>` (144 notices) or `Merge layer PR <n>` (34). 175 are reachable from `origin/tranche`; the other three (pull requests 1097, 1098, 1099) are on the unmerged `layer/14` and are found with `git log --all`. **All 178 resolve to exactly one merge commit, and both parents are present** [repo today].
- **The change at its own commit** is `git diff <first parent> <merge>`. The module list at the first parent (`build/modules.json`) gives the provider's `paths`, `tests` and every declared user at that moment. The provider's requirement file is `build/requirements/<module>.md`.
- **Script.** About 300 lines of Python driving `git show` and `git diff`; no checkout, no fetch. Parts: (1) resolve notices to merges; (2) classify changed files into provider source, provider tests, requirement file, other; (3) extract named parts before and after: exported names and signatures, class members, a hash of exported data, public ids from the `## Public` part, ids in changed test titles; (4) join to the verdicts; (5) score each candidate rule. A second script of about 200 lines lists undeclared dependence from the tip's tree.
- **Speed.** A pass that touches all 178 changes ran in 1.7 seconds.

### Quick full-width pass [repo today; a structural check, not the replay]

| | Count |
| --- | --- |
| Notices resolved to a merge with both parents | 178 of 178 |
| Notifications in the notices | 2,707 (matches the record) |
| Verdicts: affected / not affected / owed | 241 / 2,101 / 783 (the first two match the record) |
| Affected users that are declared users of the provider at the change's first parent | 241 of 241 |
| Affected users named in the notice | 241 of 241 |
| Declared users at the first parent that Process3 did not notify | 167 pairs |
| Notices whose merge changes no file under the provider's source paths | 14 of 178 |

Two things in it need a warning.

- **"241 of 241" is nearly true by construction.** Process3 judged only the modules it told. See J4.
- **The 14 notices with no source change.** Four of them are among the six withdrawn notices. Ten are not. Their merges change only tests, fixtures, scripts or the requirement file. Two of the 14 carry an "affected" verdict: `calculations:70`, whose merge changes only `build/requirements/calculations.md`, and `credentials:74` (withdrawn), a test and the requirement file. So a rule that recognises a change only by "a source file changed" would have missed at least one recorded effect. The four-part rule of the definition, which also reads public requirements and tests, may catch it. That is exactly what the full replay must settle. I did not look further into the ten.

### Sample of seven changes [sample]

Chosen by hand to cover the hard kinds the interface study names; not random. My extractor here is crude: top-level `export function / class / const` only, no class members, no value hashes, and only `R` ids.

| Change | Files changed (source / tests / requirement file) | Parts re-derived at the commit | Affected users | In told set | Evidence cites a re-derived part |
| --- | --- | --- | --- | --- | --- |
| `actions:715` | 1 / 2 / yes | 6 names (matches the notice's own export record), public ids R112 to R116, 7 test ids | 0 (only 2 of 12 notified were ever judged) | | |
| `op-declarations:289` | 1 / 2 / no | no names; 8 test ids | 1 | 1 | 0 |
| `action-grammar:396` | 1 / 2 / yes | 1 name; public ids R5, R31 (matches the notice); test id R31 | 2 | 2 | 2 |
| `interface-shell:310` | 1 / 6 / yes | no names; 6 test ids | 1 | 1 | 1 |
| `agent-worker:569` | 15 / 11 / yes | nothing | 2 | 2 | 0 (unattributed) |
| `interface-assets:443` | 2 / 1 / yes | no names; test id R6 | 3 | 3 | 0 |
| `member-roster:286` | 1 / 1 / no | nothing | 1 | 1 | 0 (unattributed) |

What the sample showed.

- **J4:** all 10 affected pairs were declared users at the change's own commit and were told. In `actions:715`, 7 declared users were not notified by Process3 and so were never judged.
- **J5:** of the 10 affected pairs, 3 have evidence that names a re-derived part; 3 sit in changes where nothing could be named (the notice would say "unattributed"); 4 sit in changes with named parts that the evidence does not cite, and need a reader's judgment.
- **Two things the four parts as drafted may not see.** In `op-declarations:289` and `member-roster:286` the effect is a changed value under an unchanged name; only a hash of the exported value would name it. In `interface-assets:443` and `agent-worker:569` the requirement file changed only in "found" marks (`F1` struck as met; `F5` added), which are not `R` ids. Whether found marks count as public requirements is part of K technical 9.
- In `agent-worker:569` my extractor found no changed name in 15 changed source files. That may be the extractor, not the code. Unchecked.

---

## 4. The combined trial run: one set-up for seven items

J1, J2, J3, J6(b), J7, J10 and the stop and many-module rehearsals of J12 can share one throwaway repository and one sitting of Bob's. Asking him once is the reason to combine them.

**What Bob does, once (judgment: 30 to 45 minutes; Process3's own guide for the same has 11 steps [repo today: `setup/DEVELOPER.md`]).**

1. Create one new repository under his account, for example `process4-trial`. Public or private; private keeps the trial out of sight but may change which GitHub features apply (rulesets are documented for public repositories on the free plan [record: enforcement_levers]). His plan is not known.
2. Give the sessions' GitHub account write access to it, and accept the invitation signed in as that account. Check the Claude GitHub App covers the new repository. If the app is installed for "All repositories", there is nothing to do; I could not determine which.
3. Let a preparatory session fill the repository: a tranche branch, three to ten toy modules with a module list, a five-second test workflow, the role texts, and the minimal merge-and-push tool. This must happen before step 5, or go through pull requests he merges.
4. Commit his approvals to `CLAUDE.md` and the deny list to `.claude/settings.json` on the tranche branch, on GitHub's website, in his own words. **Judgment:** leave out the Cloudflare, Docker Hub and release paragraphs, so that a trial session has no approval to touch them; and leave out one harmless act, for J10.
5. Set the rules: no branch deleted or force-pushed; main and tranche take changes only by pull request with the check passing; no required approvals; merge commits allowed.
6. Start ROOT: a new session on that repository, tranche branch, a plain prompt. Later a second ROOT (J2 step 5).
7. During the run: one edit to the approvals (J10); one sentence to the coordinator, "stop" (J12a).
8. Afterwards: delete the repository; look once at his list of scheduled tasks and of sessions for anything the trial left.

**Choice for Bob on the Claude side.** The existing cloud environment, BIO, holds the product's real deploy tokens and signing seeds [record: k_evidence]. A trial session started in it holds them too. **Judgment:** a separate empty environment for the trial is safer. A session can propose one and Bob approves a prompt [tool today: `create_environment`]; this is one more act, of the kind K for Bob 2 raises.

**Order inside the run, smallest first.** J2 (start-up), J3 (four probes), J7 (create the alarm; it fires within the hour), J1 (twenty merges while the alarm is awaited), J6(b), J12(b), J10, J12(a), clean-up. If J2 or J3 fails, the run stops there and little has been spent.

**Size (judgment).** ROOT twice, ARCH, the coordinator, five to eight job sessions, a few probe targets: about 12 to 15 sessions, three to four hours of wall time, most of it waiting. Peak live sessions under ten.

**What must exist first, written by sessions and not by Bob:** role texts for ROOT, ARCH, the coordinator and a job; the minimal tool; the fixed start rule as a script; the stop route; the replacement route for J10. Each is a design choice in section K that is still open. The run cannot be honest before they are made, because it would otherwise test something made up for the trial.

**Risks of the run as a whole.**

- **Suspension of the sessions' GitHub account.** The run's volume is perhaps 60 pushes, 30 pull requests and 30 merges over three hours, far under Process3's 173 pushes in one hour. But why GitHub suspended the account on 6 Nov was never learned, so I cannot say what volume is safe. Mitigations: space the merges; no state branch; nothing that polls GitHub.
- **Usage.** Not determined. Bob's plan and limits are not in the record. For scale only: one Process3 coordinator session is recorded at $37.24 at its hand-over; coordinators lived four to eight hours [record: roles 1.2].
- **Left behind:** the repository; sessions (archiving is judged case by case; Process3 measured 2 of 5 and 60 of 60 in different sessions [1e row 5]); the hourly task; a cloud environment if one is made; push notifications to Bob's phone.
- **Old Process3 leftovers.** Whether Process3's ROOT, its hourly task and other sessions are still alive on the account was not determined. If they are, they count toward the live limit and the old task still notifies Bob. **Judgment:** ask him to look before the run.
