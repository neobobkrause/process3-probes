# [file] session_brief.md (continued)


## The candidate rules and how each scored

Each rule was worked out for all 2,707 notified pairs from the code as it stood at each change. "Broken reached" uses the judged sorting above.

| Rule, in words | Notifications it would send (of 2,707) | Broken users reached (of 40) | Adopters reached (of 34) |
| --- | --- | --- | --- |
| Process3 as it ran: tell every declared user | 2,707 | 40 | 34 |
| Tell every declared user whenever the provider's code changed | 2,385 | 40 | 32 |
| Tell only users that import a name which was removed or is now called differently | 26 | 1 | 2 |
| The same, widened to methods the user calls | 124 | 12 | 9 |
| Add users whose own requirements or tests mention, by number, a public requirement of the provider that changed | 186 | 22 | 22 |
| Add users that import a test helper the change touched | 241 | 24 | 22 |
| Tell everyone, but only when a public requirement, or a test named for one, changed | 2,213 | 37 | 33 |
| Tell everyone, but only when a public requirement's wording changed or it was removed | 420 | 21 | 8 |
| **Tell a user only when something it names changed**: a name or method it uses, a table it imports, a test helper it imports, a requirement it mentions by number, or a word of the provider's that it writes out and the provider has dropped | **460** | **35** | **29** |
| The same, leaving out "a requirement it mentions became met" | 387 | 30 | 17 |
| The same as the bold rule, plus users whose own unmet requirement names the provider | 737 | 37 | 31 |
| Tell users whose own existing tests fail against the provider's change | could not be worked out by reading | | |

What the bold rule misses: five broken users. In three, what broke was a test of the user's own. Three of the five had work of their own at the time. Two (`signin-door`, `store-assembly`) had none and were found only because everyone was told.

What the rules need from jobs to be dependable (rules for writing, not checks): a module's requirement file says, by number, which of each provider's public requirements it relies on; a provider changes a public requirement's wording or its "not yet met" mark in the same change as the behaviour; a fix that changes what callers see is written on the public requirement and not only as a found flaw; a test's title names its requirement number in one standard form; a name is retired by removing it, never by leaving it with a new meaning.

## Two candidate definitions to put to him

1. **"Something this module holds was taken away or changed."** A user must be updated when its own files name something the change removed, renamed, called differently, changed the contents of, or reworded. A requirement that only became met is not a change; a user waiting for it has its own "not yet met" line, and that line makes its job run. On the record: 387 notifications; reaches 30 of the 40 broken. Unproven as a working process.
2. **"Anything this module names changed,"** including a requirement it mentions becoming met. On the record: 460 notifications; reaches 35 of the 40. Unproven as a working process.

Neither has been run. Both rest on a sorting that one reader made.

## Open questions

**For Bob's judgment (his to answer, in his words):**

1. Which matters to him: that no module is ever left wrong without being told, or that almost none is, at a sixth of the cost? On the record the cheapest rule that reached all 40 broken users sent 2,385 of 2,707.
2. When a provider's answer changes and a user simply hands it on, with no change to the user's own code, does he want that user told? That was most of the 241.
3. When a provider finishes something a user was waiting for, is the user's own "not yet met" line enough to bring its job, or does he want a notice as well?
4. A module that already has work gets a job anyway, and that job's module tests run against the provider as merged. Is that enough for such a module, so that a notice starts a job only for a module with no other work?
5. May a module's own existing tests be run because a module it uses changed, when the module has no job of its own? Two readings were written down and not decided. One: these are module tests, run for an informed reason, as his record says users' jobs "are updated as needed and tested". The other: it is a run his three tests do not list, and done everywhere it is the full regression the internal walk replaces. Only he can say.
6. Is he willing to have every job write, in its requirement file, the numbers of the provider requirements it relies on? The better rules depend on it.
7. The product's module list is itself something modules depend on (seven of them run things in its order). Who is told when ARCH edits it?
8. 510 notifications went to a module with a declared use and no import. Should a declared use have to say what it rests on?

**For more measurement (a session can do these without him):**

1. Run each user's existing tests against each of the 178 provider changes, to learn what "the user's own tests fail" would have caught. Large: up to 2,707 runs; one suite takes six minutes.
2. Have a second reader sort the 241 without seeing the first sorting, and compare.
3. Re-examine a sample of the 2,101 "not affected" for users that were in fact broken. The replay found three such users among modules never told.
4. Measure how completely modules mention the requirement numbers they rely on today.
5. Try the rules on the 365 notified pairs that were never judged and the 167 declared pairs never told.
6. Count false alarms of the "word the provider dropped" rule on code outside this record.

## Where everything is

- The study: `process4/working/notice_study/study.md` in this repository (branch `process4`). Scripts beside it, run with `python3 -I <script>`; the order is at the end of the study. `signals.py` takes about five minutes.
- One row per affected verdict, with its sorting, its follow-up and which rules reach it: `process4/working/notice_study/data/classified241.tsv`.
- The reader's sorting of the 241: `judged241.txt`. Of the 120 sampled: `judged_sample.txt`. Rule scores: `data/rules.json`.
- The earlier replay: `process4/working/replay/results.md`, with its scripts and data, which this study's scripts read.
- Background: `process4/evidence/interface_and_cycle.md` (what a module's interface is in practice), `process4/evidence/no_layers_width.md`, `process4/evidence/process4_definition_v4.md` sections D and E.
- The record: the public repository `neobobkrause/civicsmith-copy` (clone it read-only; it is not attached to the session), branch `origin/process-state` at `c4c252913b`, folder `notices/`; the code at `origin/tranche` `e7ec72e093`.


# [file] codex-first-class-session-creation-blocker-20261117.md

# First-class Codex session creation experiment: 401 before task submission

**17 November 2026. Status:** Owner-provided verbatim result of separate disposable test, with assistant interpretation clearly separated. The primary session's complete tool transcript and local workspace have **not** been independently inspected from this conversation; claims below are reported observations, not verified direct execution here. This is an essential **unmet Process4 prerequisite in the tested hosted environment**, not proof of universal unavailability.

## Test session's reported outcome (selected verbatim excerpts)

> **Process4’s prerequisite is not met.** No independent session was created, and Process4 should not be declared ready for first-class session orchestration.

> - **Installed client:** `codex-cli 0.167.0-alpha.4`.
> - **Authentication status:** `codex login status` returned `Logged in using ChatGPT`.
> - **Cloud access failed:** `codex cloud list --json` exited with status 1 and **401 Unauthorized**, reporting: `Could not parse your authentication token. Please try signing in again.`
> - **Browser observation:** opening `https://chatgpt.com/codex/` displayed the public Codex landing page with **Log in**, rather than your session list. There was no owner-visible experiment session to inspect.
> - **Hosted tools:** no general Codex session creation/list/message operation was exposed. Document Control returned `No connected Codex document sessions were found`; it controls document surfaces, not general Codex conversations.

> The immediate missing capability is usable, existing owner authentication to a supported creation surface from this runtime. Beyond that, ordinary-list visibility, direct owner interaction, project membership, and cross-session reactivation still require the disposable end-to-end test.

The reporter also inspected `codex cloud exec` (requires a published `--env`), app-server schemas with `thread/start` and `projectId`, local CLI/SDK persistence, experimental remote pairing, hosted automations, and separately billed Agents API (excluded). It submitted **no** independent Cloud task, used no metered inference/new credentials, and did not inspect account secrets or modify CivicSmith2.

## Assistant analysis (not test evidence or owner words)

1. The CLI's local `login status` and the Cloud 401 are compatible with a stale/mismatched/unusable credential *for that endpoint*; the specific root cause is unknown. The 401 does **not** prove the owner's account lacks Codex Cloud access, nor that reauthentication is guaranteed to fix the hosted setup.
2. The browser showing Login may be a separately unauthenticated managed-browser context, **not the owner's actual UI**. Do not infer the owner is signed out.
3. OpenAI documentation confirms subscription-funded Codex Cloud tasks in published managed environments: https://help.openai.com/en/articles/20001545-using-codex-cloud and https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan. Documentation does NOT confirm that a cloud task launched from an existing hosted child appears as an independent session in the owner's ordinary list, nor that it can be reactively addressed by other unrelated tasks.
4. A decisive follow-up should **first** confirm with the owner that manual creation of a disposable Codex Cloud task in a published environment appears in their list, without changing runtime credentials. Next investigate a **supported already-authenticated** path to create an additional task from a process session; do not repeat a known failing nested login or ask for secrets. Finally demonstrate actual direct owner response, second turn, project assignment if supported, and inter-session reactive message.
5. Until all essential results are observed, retain **NOT READY for autonomous first-class session orchestration**. Console-mediated native-child dialogue is a different alternative and needs explicit owner acceptance. Do not substitute it silently or assert platform-wide impossibility.
6. Process4 implementation and preserved evidence may remain useful; do not modify the Claude Code implementation or adopt governing process changes merely because this experiment was blocked.

**Test record provenance:** User pasted the complete assessment narrative into the originating ChatGPT conversation; this file preserves the key reported facts and exact observed error. It is not a primary tool transcript. A real creation attempt, owner UI observation, and working cross-session communication remain outstanding.


# [file] result.md

# When must a module's users be told? Result of the study session

15 Nov 2026. For Bob, the owner, and for the main Process4 session. Written by Claude. Plain words, no reference codes. Nothing here is in force.

Four words are kept apart. *Measured*: counted by a script. *Estimated*: worked out from a sample. *Judged*: somebody's reading; it says whose. *Unproven*: never run.

A *provider* is a module that changed. A *user* is a module that uses it. The *tool* is TypeScript's reader, a free and widely used program that reads plain JavaScript together with its structured comments and can write out a file's interface as a listing. It does not change how the product runs.
