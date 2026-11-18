# When does a change to one module require the modules that use it to be updated?

A study of Process3's record. 14 Nov 2026. Read-only against `/home/user/repos/civicsmith-copy`; nothing was committed, fetched, checked out or pushed, and no session was started. Everything written is under `/home/user/work/notice_study/`. Scripts run with `python3 -I <script>`.

**The question, in the owner's words (14 Nov):** "If every user is told when the implementation of a module changes but the interface doesn't, then every change will continue to cause every user of that module to be rebuilt and tested. That's very (very!) inefficient and unnecessary. There must be a practical means of identifying when a change doesn't require user modules to be updated." And: "Explain why using the current criteria 5 of the 241 changes that AI workers judged real would have been missed. What was different in those 5 modules?"

**Four words kept apart throughout.** *Measured*: counted by a script on the record or the code. *Estimated*: worked out from a sample. *Judged*: my reading of a sentence or a diff (one reader, not blind). *Unproven*: never run.

**Words.** A *provider* is the module that changed. A *user* is a module that declares a use of it. A *notification* is one user told of one change. Process3 recorded 178 changes, sent 2,707 notifications, and its AI workers judged 2,342 of them: 241 "affected", 2,101 "not affected".

## Summary

1. **"Affected" did not mean "had to be updated".** Of the 241 affected verdicts, 40 were a user that was wrong or failing until it changed (*broken*), 34 were a user that changed its code to take up something new (*adopted*), and 166 needed no change to the user's code: in 140 the user's own job said so or changed nothing for it, and for 26 no follow-up ever ran. One could not be told. (Judged, from each verdict's reason, the user job's own written words and the diffs.)
2. **So 40 of 2,707 notifications (1.5%) found a user that needed updating, and 34 more (1.3%) found one that chose to adopt something.** The 40 sit in 23 of the 178 changes; 17 of the 40 come from two changes that retired old names.
3. **Three of the five missed verdicts were real breaks; two were not.** In all five the provider changed what it does without changing anything that carries a name or a number. Each is explained in section 1.
4. **No rule that looks only at the provider's change is both safe and efficient on this record.** "Tell everyone only when a public requirement or its test changed" still sends 82% of the notifications and misses 3 of the 40 broken users. Rules that look only at changed names send under 5% and miss 28 or more of the 40.
5. **A rule that asks, for each user, "did something this user holds by name change?" sends 17% of the notifications and reaches 35 of the 40 broken users and 29 of the 34 adopters** (rule g1, section 4; measured against judged classes). Of the five broken users it misses, three had work of their own at the time, and in three what broke was a test of the user's own.
6. **Most users had work of their own at the time.** 1,735 of the 2,707 notifications (64%) went to a module that already had an unmet requirement or an open job, and 33 of the 40 broken users were among them. The notifications that would start a job for no other reason number 972 (measured).
7. **Not determined:** what running each user's existing tests against each provider change would have shown (it cannot be done by reading); whether the 532 never-judged pairs hold more broken users; whether any of this holds outside the week of Process3, in which one large renaming dominated.

---

## 1. The five

The replay tried the rule "the interface changed if one of four named parts changed": an exported name (with a fingerprint of exported data), a public requirement under its permanent number, a test whose title names a requirement number, or a published file that is not code. Five affected verdicts sit in changes where none of the four changed.

For each: the provider's change at its own commit, the verdict, why no part caught it, what would have had to be true, and what the user's job did afterwards (measured from the merges; the reading of them is judged).

### 1.1 agent-drafts, pull request 570, judged to affect agent-worker


A box of 12 willows came through Varnel.

- **What changed.** The drafting code stopped telling the AI conversation which "runner" to use (the runner is the container for a member's own Claude sign-in). Four calls lost one argument each; one test file was added. Commits `ca983c4b7a` to `f6049ea4a4`.
- **Why the user was judged affected.** agent-worker hands every draft request to that code. A runner was about to be connected again in agent-worker, so a draft on a member's sign-in would now reach the model with no runner.
- **Why none of the four parts caught it.** No name was added, removed or called differently. The requirement file was not touched. The new test is titled "notice agent-worker:364 ...: converse is called without a runner", which names another module's notice and no requirement number.
- **What would have had to be true.** "No draft names a runner" would have had to be a numbered public requirement of agent-drafts, with a test titled by that number. It existed only as a found flaw in the *other* module's file and a coordinator ruling.
- **Was the verdict right?** Yes, and the user was broken. agent-worker's job, already open, added a gate to its source (pull request 569, merged 74 minutes later: "a sign-in there would reach the model with no runner even while `RUNNER` is bound"). Its later pull request 619 added a test only and says "Confirmed, no code change", because the change was already in.
- **What was different here.** These two modules are one Worker cut in two to keep a requirement file under a size cap, and each uses the other. The change went back and forth between them four times (364, 570, 569, 619).

### 1.2 agent-steps, pull request 185, judged to affect agent-worker

- **What changed.** Each record of AI usage that agent-steps hands on lost the fields `model` and `effort` and gained `entry_id` and `label`. One function body in one file. Commits `589b844ea4` to `efaf53b300`.
- **Why the user was judged affected.** agent-worker read `model` from those records and sent it on. After the change it would send nothing for the model and drop the two new fields.
- **Why none of the four parts caught it.** The function's name and the way it is called did not change. The requirement file was not touched: public requirements 26 and 47 *already* described the new shape and were marked "not yet met", and the job changed the behaviour without striking or editing the marks. The tests that changed do name requirements 26 and 47, but agent-steps writes its tests with a helper of its own (`t("R47: ...")`) inside long files, not as standard test titles, so a reader of test titles sees nothing. Three modules write tests this way.
- **What would have had to be true.** Either the mark on the requirement changed when the behaviour did, or the tests were titled the standard way.
- **Was the verdict right?** Yes, and the user was broken. agent-worker's open job changed one line of source (pull request 97, six and a half hours later), and pull request 257 added a confirming test.

### 1.3 agent-steps, pull request 497, judged to affect agent-worker

- **What changed.** When a run's state holds something that belongs to the AI provider (a session id), agent-steps now publishes no state for that step and adds an entry to the run's list of refusals. Two places in one file. Commits `ef40849d5f` to `0f11547770`. The change was itself agent-steps' answer to a notice from agent-harness.
- **Why the user was judged affected.** agent-worker returns that list of refusals to its caller, so its answer can now carry the new entry.
- **Why none of the four parts caught it.** A change inside a function body. The requirement file was not touched; public requirement 55 says the state holds nothing provider-held, and nothing anywhere says a refusal is added to the list. The tests use the home-made helper again.
- **What would have had to be true.** The new outward behaviour (a refusal a caller can now receive) stated in a public requirement.
- **Was the verdict right?** The effect is real; the user needed no change. Its follow-up (pull request 619) added a test only: "no source change is owed (BOB, 6 Nov 04:42): this test pins the pass-through."

### 1.4 ai-accounts, pull request 316, judged to affect store-assembly

- **What changed.** A fix of a flaw: when a member's sign-in is recorded, the act is now recorded under "member:ann", not "ann". Two lines. In the requirement file a *found flaw* (numbered F4) went from "not yet met" to "met". Commits `202498e237` to `637f73a5cf`.
- **Why the user was judged affected.** Three of store-assembly's own tests recorded the disclosure under the bare name and would fail.
- **Why none of the four parts caught it.** A change inside a function body. A found-flaw number is not a public requirement number. The new test's title names no requirement number.
- **What would have had to be true.** A fix that changes what callers see would have had to be written on the public requirement it corrects, not only as a found flaw. (39 of the 178 changes touched the requirement file only in found-flaw marks; measured by the replay.)
- **Was the verdict right?** Yes; the user's tests were broken, its source was not. store-assembly's job was already open and had started from the provider's merged change; it respelled three test lines (pull request 325, merged about half an hour after the verdict). The flaw had been reported by store-assembly's own job in the first place.

### 1.5 member-roster, pull request 286, judged to affect membership

- **What changed.** A generated file that lists every module in order gained one module, because the product's module list gained one. Commits `14dbe3fc71` to `8e8654c79a`.
- **Why the user was judged affected.** membership runs its registered readers and listeners in that order.
- **Why none of the four parts caught it.** The changed list lives in a file no other module imports. The name other modules do import is computed from it, so its own text did not change and the fingerprint (taken of text, not of the computed value) did not either. Public requirement 61 already says "a module added, moved or dropped in the file changes the list with no edit here"; its text did not change. The changed test is titled by a found-flaw number.
- **What would have had to be true.** A fingerprint of the value as computed. More to the point, the cause was not member-roster's job at all: it was an edit to the module list, a file that belongs to no module.
- **Was the verdict right?** The effect is real; the user needed no change. Its follow-up (pull request 324) added one test file: the new module "ranks where the provider puts it with no change here."

### What was different in those five

| | Changed what callers see, with no name or number changed | Stated in a public requirement whose text did not change | Tests not titled by a requirement number | User already had a job open | What the user changed |
| --- | --- | --- | --- | --- | --- |
| agent-drafts 570 | yes | no (lived in the other module's file) | yes | yes | source (a gate) |
| agent-steps 185 | yes | yes (requirement already written, mark left) | yes (own helper) | yes | source (one line) |
| agent-steps 497 | yes | in part | yes (own helper) | yes | a test only |
| ai-accounts 316 | yes | no (a found flaw) | yes | yes | three test lines |
| member-roster 286 | yes (data) | yes | yes (found-flaw number) | no | a test only |

All five share the first column. Four are from two pairs of modules (agent-drafts, agent-steps and agent-worker) that were split apart for file size or moved code between them that week.

