# [file] 03-modules-jobs-and-the-notice.md (continued)

# Process4 Foundations, part 3: Modules, jobs and the notice

Length: 86 lines. Last section: "What the notice cannot do".

## Modules

A product is one ordered list of modules. A module may use only modules that come before it in the list. Every file has one owner module.

A use that points to a later module is an error in the design of those modules. It is fixed by reshaping them, not by allowing the use.

ARCH edits the list until every file has one owner and every use points backward.

Writer's reading: the single order is what makes the rest simple. It is always plain which module is the provider and which is the user, so news of a change travels one way only.

## Requirements

Each module has a requirements file, with a public part and a private part, under permanent numbers.

ARCH writes and rewords the requirement text. ARCH touches no code and no tests. The module's job marks a requirement met, in its own pull request.

A rewording that changes what the product does comes to Bob first. A rewording that only says the same thing more clearly is made, and Bob is told in the account after the round. Writer's reading: the dividing line is the one from part 1. What the product does is Bob's, and how it is said and built is the AI's.

A requirements file is kept under the measured maximum size (part 6). ARCH applies this as a rule. When a file nears the maximum, ARCH splits the module into two real modules. Nothing refuses a job or a merge on size.

## Jobs and slots

The plan of work is built around jobs running side by side, up to a number Bob can change. The number is eight by default, counted across the account. Bob changes it by telling the coordinator.

A module has work when a requirement in its file is marked not yet met, or when a walk flaw or a notice has been placed against it. Its job is ready when the module has work and no job open. A ready job does not wait for the modules it uses.

Ready jobs take free slots earliest in the order first. Only Bob's marked instruction puts a module ahead. Who takes a free slot has one right answer, so the process's tool decides it.

A job works in a draft pull request and writes only its own module's files, its tests among them. Bob's rule is that a job for one module is not allowed to change another (`process4/owner_words/bob_words_14nov_c.md`). The rule is held by the job's instructions. Bob's judgment of what he saw under Claude Code is that jobs kept to their own modules, and that stronger enforcement by role is useful but not essential (`bob_words_16_17nov_codex_development.md`).

A flaw a job finds in another module goes to ARCH, which passes it to that module's job. A job stopped by another module's flaw reports it, records that it is blocked, pushes its work and stops. Its slot is freed.

When a job completes, it marks its pull request ready and its module tests run. When they pass, ARCH merges the pull request into the tranche branch with the process's tool. There is no review and no act of Bob's. The slot is refilled in the same turn. Measured in Process3: with no event to prompt it, the directing session once noticed a finished job after 194 minutes.

A module's work is finished when its job merges, or when its notified job tells ARCH that nothing needs changing. Claude decided this. A job never merges, starts a session, deploys or changes the process.

A job that has failed two corrections is replaced by a fresh session. The fresh session's first task is to understand why the corrections were made, so that it can foresee the ones still needed. A job session that dies is replaced by one that carries on from the same branch and pull request.

## A change across many modules

Some changes touch many modules in the same trivial way and need no judgment. Bob's example is a change to a word table. Such a change is a mechanical edit. It is the only way a module's files change other than by that module's own job (`bob_words_14nov_c.md`).

Claude decided how: a helper in ARCH's session makes the edit as one change covering every affected module. It is merged once, at a time when no job is open. A module where the change needs judgment gets its own job.

This is unproven. It is rehearsed in the trial.

## The notice to user modules

When a job changes a provider, the users of what changed are told. The notice exists to save work.

Bob's motivation is in `bob_words_14nov_c.md`. If every user were told on every change, every change would cause every user to be rebuilt and tested again. He calls that very inefficient and unnecessary.

His view of what matters is in `bob_words_14nov_notice_session.md`. A change to what a provider answers does not by itself call for its users to be tested again. What matters is the interface: what the provider accepts and hands back, and the bounds of the valid values. If those stay the same, users are left alone.

The conclusions, as the design holds them:

- A module's interface is stated in its code together with structured comments. The comments say how the interface is to be used and what its bounds are.
- A build tool writes out the module's interface, from code and comments together, before and after a job's change. The notice is sent only when the two listings differ.
- Only the users of the entry that changed are told.
- For what a provider accepts, users are told only when the new interface cannot stand in for the old: something was removed, renamed, newly required or newly refused. Accepting more tells no one.
- For what a provider hands back, any change to an entry tells that entry's users.
- A change to the words that state a bound is a change to the interface.
- A module with no comments gets them as the first step of its next job, before anything else changes. They describe the module as it stands. That step sends no notice.
- A notified job checks only the changed parts, and runs only the tests that relate to them.
- When a notice is sent, and to whom, has one right answer. The process's tool decides it.

How a notified job picks the tests that relate to a changed entry is owed (part 10). Two smaller matters are also open: who is told when the product's list of modules itself changes, and what becomes of a module that says it uses another while none of its code does.

## What the notice cannot do

Bob's conclusion is that there is no reliable way to tell a change to an interface from a change to something else. His words are in `bob_words_15nov_main.md`.

So the notice is a way of saving work. It is not a guarantee. It will sometimes tell a user that needed no change. It will sometimes miss a user that did.

Nothing new catches a missed user. The user's own module tests catch it the next time that user's job runs for any reason. Or a walk meets the break, which is then a flaw and becomes work for that module in the next round. No test of users runs before a provider's change merges.

What is known about the method:

- Measured, in a proof on eleven made-up modules and 150 changes chosen to attack the method: it decides as its rules say, and it sent 2.6 times fewer notices than telling every user. Every miss that was recounted showed up as a failing test of the user.
- Judged, by AI workers reading Process3's record: about 74 of 2,707 notices sent there were needed.
- Unproven: how many notices the method saves on a real product.
- Unproven: any of it as part of a running process.


# [file] account-switch.md

# Account switch runbook

For the coordinator, or ROOT, when Bob moves Process3 to another Claude account. A Claude account holds scheduled tasks, live job, lane and role sessions, message deliveries, the cloud environment, the connectors and the claude.ai documents. Git holds none of these. This runbook writes the first five down in git on the old account and restarts from git on the new one, in an order that cannot race the tranche. It also tests the rest well before the switch (Bob, 6 Nov: "anticipate or test for issues related to account switching now"). Why: the switch of 5 Nov cost 94 minutes at 0 of 20 live jobs (notes/account-switch-review.md on start/coordinator-4nov). The canary and the measured times are in notes/account-switch-canary.md.

## 0. Before it is needed: rehearse and preflight

1. `switch out --dry-run` takes the same files as a real switch out (1.1 below). It writes `switch/dry-run/manifest-<time>.json` on the state branch, never `switch/manifest.json`, and prints the stop acts prefixed "do none of them". It stops nothing. Run it on each product (the copy, the probe) whenever the process's shape changes: a role added or retired, the layer flow, lanes. Then read what it names.
2. `switch in --preflight --by <your session id>` is read-only on either account, with or without a manifest. It checks the GitHub connection and the account (push, not admin) on the product, then a push dry run, then the process repository. It prints the session checks that only a session's own tools can make. It exits 1 if a check fails.
3. Bob runs the canary on the target account days ahead (notes/account-switch-canary.md). What fails there is fixed then, not during the switch.

## 1. Old account: switch out

1. Save list_triggers with `enabled: true` and limit 100, every page, as one JSON file. Save list_sessions, newest first, as another. One page stands when it reaches back as far as the record needs: the tool applies status's rule and names the cursor if it does not.
2. From each product checkout at the tranche (the copy, then the probe): `node .process/tool/p3.mjs switch out --tasks <tasks file> --sessions <sessions file> --by <your session id>`. It writes `switch/manifest.json` on the state branch and nothing else. The manifest holds:
   - each enabled task, with its schedule, prompt and role. The role is one of a role's name, the coordinator, `lane <name>`, `fresh` (a new-session-per-fire task that runs the process's tool), or `not the process`: a task bound to no session that never names the process, such as Bob's alpha-pipeline-runner, which is listed and never touched;
   - each live job of this product (its ledger or a job branch on its origin), with its session, branch, pull request and state;
   - the role addresses;
   - the open layers (layer flow);
   - the lane seats and their open asks;
   - the unanswered messages;
   - every old session id it names.
3. Do the stop acts it prints, in their order, each its own call:
   1. each job pushes its work in progress and ends;
   2. each process task is switched off with update_trigger, never deleted;
   3. each lane (the triage seat among them) pushes its folder's work and ends;
   4. BOB, ROOT and the watcher end their turns.
4. Tell Bob it is done, with the manifest's commit.

## 2. Bob, between the accounts

Each step is tested ahead by the canary. The owner of each item is in the inventory (notes/account-switch-canary.md).

1. On the new Claude account, connect GitHub (claude.ai, Settings, Connectors) signed in as the process's GitHub account, the collaborator (push, not admin), never the repositories' owner.
2. Install the Claude GitHub App for each product's repository, process3 and process3-probes.
3. Recreate each product's cloud environment: its network, its setup script, its variables and the network secret for api.cloudflare.com, with the values only Bob holds. Connect Google Drive.
4. Give the new account edit access to the process documents (the Foundations, the Ledger map, the lanes' design artifacts). Until then the new account can only read them.
5. Add the new account to the standing approvals in CLAUDE.md if their wording needs it, by his own commit.
6. Start the new coordinator session with one repository attached.

## 3. New account: switch in, its first act

1. Save list_sessions as JSON. From each product checkout at the tranche, before any push or start: `node .process/tool/p3.mjs switch in --sessions <file> --by <your session id>`. It records the old account's sessions in `switch/retired.json`, so R13's session_gone ends what was bound to them (lane seats, holds) at ROOT's next sweep. The new account's list_sessions never lists those sessions.
