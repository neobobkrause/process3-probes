# [file] 09-permissions-and-platform.md

# Process4 Foundations, part 9: Permissions and the platform

Length: 100 lines. Last section: "The terms and their Claude Code constructs".

Much of this part depends on the harness. Each such statement is marked "Claude Code:". Where what carries a term on Codex is not yet known, a line marked "Codex:" says so. The list of those shortcomings is `process4/working/codex_shortcomings_to_fill.md`.

## What holds a rule

Process4 holds its rules with four things.

- **Each session's instructions.** A session is started with instructions that name every act it may take.
- **Bob's standing approvals.** One block of text, in his own words, says what sessions may do without asking him and what they may never do.
- **The list of forbidden commands.** It takes commands away from every session outright.
- **GitHub's own rules.** These are Bob's settings.

Bob's approvals and the list of forbidden commands are protected by the permission checker alone. Nothing enforced by GitHub is added for the process's own rules (part 8). Claude Code: the permission checker is that harness's own. Codex: what stands in for it is not yet known.

Most rules in the design are held by instructions. The rule that a job writes only its own module's files is one. Bob's judgment is that this is enough for ordinary work: under Claude Code he saw jobs keep to their modules, and he counts enforcement by role as important and useful but not essential (`process4/owner_words/bob_words_16_17nov_codex_development.md`).

The process's tool guards against mistakes. It does not guard against a session that sets out to defeat it. That is a known limit. PROCESS answers a finding that needs a deliberate attack with "no change", unless Bob says otherwise (part 8).

Claude Code: permission management is kept as Process3 ran it. Measured: about 700 merges with no review went through Process3's tool with no recorded refusal. Process4's own tool is unmeasured.

## Bob's standing approvals

The approvals are recorded once, in Bob's own words, and reach every session, at every depth and in every successor. Bob commits them himself. No session writes, edits or relays them.

Claude Code: the approvals are a block of text in the repository's CLAUDE.md, which Bob commits on GitHub's website.

Claude Code: consent that is only quoted in a session's starting text does not count. Measured in Process3, as recorded in the working Foundations: sessions started by another session declined every merge asked of them on quoted consent, 11 of 11. The evidence file for that count was not found. With Bob's approvals committed to the repository, a confirming round saw no refusal in about 450 acts (measured).

Claude Code: the committed approvals also cover what no starting instructions foresaw. Measured in Process3, as recorded in the working Foundations: with them a session acted on its directing session's unforeseen request 10 of 10 times, and without them 0 of 10.

Claude Code: a session loads the approvals only when it starts (measured). Measured in Process3: each of Bob's five edits to his approvals stopped every long-lived session. So an edit to the approvals goes together with a restart of ROOT. What an edit does to a round that is running is a technical matter still owed (part 10).

Claude Code: a session reads the approvals from the copy of the repository it was handed at its start. Measured in Process3: that copy was once about an hour old and lacked approvals committed sixteen minutes earlier. Claude decided: ROOT's first act is to fetch the newest copy of its branch. Whether approvals that arrive after a session has started count the same as approvals read at the start is unproven.

## The list of forbidden commands, and GitHub's rules

Claude Code: the list of forbidden commands is the deny list in the repository's settings.json. A command on it is removed from the session outright (measured). The list takes away every direct push, every GitHub command, the ordinary merge commands, overwriting a branch's history, deleting branches, and writing files through GitHub's web interface.

So the process's tool is each session's only door to GitHub. Merging stays with that tool, the route Process3 measured.

Sessions act on GitHub as a second account, which can push and merge but cannot change settings. Bob acts as the owner. So GitHub itself keeps sessions out of settings and branch rules. No branch can be deleted or overwritten. The tranche branch takes a change only by pull request with its tests passing. Codex: which GitHub account a session acts as there is not yet known.

Claude Code: a session loads the list of forbidden commands only when it holds one repository (measured). So every session is started with one repository. A session building a product starts from the newest commit of that product's tranche branch. PROCESS starts on the process's own repository.

The process must be able to deploy by itself, because an external walk needs a deployment and the work runs with nobody watching. Bob's word on this, of 2 Nov, is recorded in `process4/evidence/foundations.md`. What deploys a product, and what its deploy token is, depend on where the product is hosted. The design gives them in a table for each hosting provider (part 6).

Secret values are kept away from product code. Production keys are never in the sessions' environment (part 1). Claude Code: deploy tokens are held as settings of the cloud environment, the only route measured to work. Codex: where a deploy token is kept is not yet known. Module tests run in two parts, so that product code under test holds no access token. Who can read the deploy token is owed (part 10).

## Working with the permission checker

Claude Code: every session runs in Auto mode. It acts without asking a person, and an automatic permission checker run by the platform judges each risky act and may refuse it.

Claude Code: the checker's judgment is not fully steady. Measured in Process3: it passed and refused the same act minutes apart. Three working rules exist because of it.

- One judged act for each command. Measured: a judged act chained with another command was the one refused.
- An act the permission checker refused is never reworded and never retried elsewhere.
- Three refusals in a row stop a session (measured). Such a session is replaced.

Two kinds of refusal are kept apart. An act the permission checker refused falls under the second rule above. An act a session declined only because its instructions did not name it is different. It may be given to a new session whose instructions do name it. Writer's reading: the second is a missing instruction and not a refusal of what Bob approved, so supplying the instruction is the correction.

Estimated: twenty clean merges in the trial bound the refusal rate only below about 14%. Whether the checker goes on passing merges at a real rate can be shown only by the first real tranche.

## The platform

The process stands only on platform behaviour that has been measured. The measured behaviours it rests on are these, all Claude Code:

- A session can run one thing for about 30 minutes. Longer work runs on GitHub's machines or is shared among sessions.
- An alarm set by a session fires into that session when it is idle and resumes it. This is ROOT's hourly wake.
- A fresh session started by an alarm could not start sessions (0 of 3).
- New session starts failed silently at about 50 live sessions (one event). So finished sessions must not use up the account's room. The session that started a session archives it when it has finished (part 5).
- Sessions are started only down to a limited depth. So sessions are at most three levels deep.

Codex: whether like limits apply there is not yet known.

A harness runs AI sessions only on what Bob's subscription covers. Anything that would cost more comes to him first.

The process keeps to GitHub's published limits, in the way Process3 did. Process3 used 80 to 90% of the published limits and obeyed GitHub's rate-limit responses, as the working Foundations record. Why GitHub suspended the sessions' account on 6 Nov is owed (part 10).

The limits of the product's hosting account are given in the table for each hosting provider (part 6).

Every account, setting and branch rule the process depends on is part of the design. The few steps that are Bob's are listed on one page the process writes, each with its reason.

## The terms and their Claude Code constructs

| Term used in these parts | Claude Code construct |
| --- | --- |
| Session | One conversation in Claude Code's cloud |
| Helper | A worker started inside a session, which ends with its task |
| Bob's standing approvals | A block of text in the repository's CLAUDE.md |
| The product's instruction file | The repository's CLAUDE.md |
| The list of forbidden commands | The deny list in the repository's settings.json |
| The permission checker | The automatic checker of Auto mode |
| The hourly alarm | A scheduled task bound to ROOT's session |
| Settings of the cloud environment | Values Bob enters into Claude's cloud environment |
| Notification to Bob's phone | A push notification from a session |

The Codex constructs are not given here. They belong to the design document's table for Codex. Where one is not yet known, the list is `process4/working/codex_shortcomings_to_fill.md`.


# [file] root.md

# ROOT's rulebook

For ROOT, read once at start, after your prompt. Your prompt wins where the two differ; a rule your prompt already states lives there, not here. At most ten rules, rewritten in place, never appended (TXT-3). Each cites its line (TXT-6) and names what holds it, or says nudge.

## Principles (TXT-4)

1. No session starts its own successor: a new BOB comes only from you, by the handover, and a new coordinator only from you, at its ask, after it pushed its handoff (PLT-5, SES-1; Bob, 5 Nov 16:33). Held by `start bob` and `start record bob`, which refuse a second BOB, and `start coordinator`, which refuses unless `--replace` names the addressed coordinator and its handoff is on its branch.
2. Git carries state and a message only wakes, after the push (MSG-1). Your pushes are the tool's, paced account-wide by it (P27): push nothing and write nothing through the GitHub connector by hand. Held by `send` and the tool's pacing.

## Rules

1. Run `send delivered` only after send_message returned; a message not recorded delivered stays listed by `status` (MSG-6). Held by `status`.
2. A message to Bob is one per turn, plain, with a link, and a numbered list only for an act of his (MSG-4). Nudge.
3. Nothing holds a turn; stop means stop in that turn (ENF-2, ENF-3). Nudge.
4. A reviewer's or session's "what if" is not a problem and starts nothing; only a failure that happened, or Bob's word, does (GAP-3; Bob, 2 Nov, before the log; unverified). Nudge.
5. Technical choices (a process3 fix or not, a restart, a route) are the coordinator's, never Bob's. A product's are BOB's. Each is a short decision record (REC-11), in its repository's DECISIONS.md, reported in one line. Bob gets only what P17 makes his: what the Foundations say he defines (values, policies, mission, audiences, requirements, principles, high-level architecture, UX, doctrine), his approvals or accounts, or an act only he can take, sent with options and context. Anything else: decide it if it is yours, else send it to the coordinator. A Ledger line whose mechanism must change keeps its purpose and is restated by you; an earlier session asking Bob is no reason to ask (P17; AUD-5, kept by Bob 6 Nov). Nudge.
6. Urgency is a chain, job to BOB to you to the watcher to Bob, each step waiting `targets.decision_minutes` in process/config.json (30 by default) for an answer. An escalation is acted on in the turn it arrives, never left for the sweep; a BOB found archived or idle that long is handed over then. A reversible act the coordinator leaves unanswered that long is taken as you recommended and reported in one line; an irreversible one waits (coordinator, 4 Nov). Nudge.
7. Recorded state carries a checkable end; the tool ends it when that holds, and the sweep reports what stays stale. Never end one by hand: report it, and its fix is a process3 build (Bob, 6 Nov). Held by `sweep` and the tool's ends.

In your prompt, not here: what you may start, the sweep and the watcher tasks, the wake check, one judged act per command, refusals reported word for word, and keeping your context empty.

A switch of Bob's Claude account follows `rulebooks/account-switch.md` (`.process/rulebooks/account-switch.md` in a product): `switch out` on the old account, `switch in` as the new account's first act.


# [file] 03-modules-jobs-and-the-notice.md

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


# [file] 06-reading-in-full-and-documents.md

# Process4 Foundations, part 6: Reading in full, and the documents

Length: 91 lines. Last section: "Where the work is kept".

## Why reading in full is a design matter

A session acts only on what it has read in full or measured.

The danger is a quiet one. Given a text or a set of texts that is too large, a session may scan it and not read it, and say nothing. It then works from a partial picture of the product's founding documents and of its own rules. Bob names this as a very significant danger that must be mitigated. His words are in `process4/owner_words/bob_words_17nov_codex_context.md` and `bob_words_16_17nov_codex_development.md`.

Nothing can ensure a full reading. So the design keeps texts small enough that a full reading reliably results. This follows Bob's general approach in `bob_words_17nov_compaction_avoidance.md`: the best mitigation of a shortcoming is to stay out of the situation where it comes into play.

## The measured maximum

Every text a session must read in full is kept below a measured maximum size. So is every set of texts that is read together.

The Codex maximums are used. They rest on real measurements, and Codex context windows are in effect more constrained than Claude Code's. Writer's reading: a size that is safe in the tighter harness is taken as safe in both.

The values are not yet settled, and are owed (part 10). The figures found so far are in `process4/working/harness_separation/`. They are sizes shown to work. None is a size at which reading was shown to fail. The values are settled first from the limits that Process3's own rules set. If those do not settle them, credible tests measure the thresholds.

The maximums are chosen by one yardstick, which also sets the fill level at which a role is refreshed (part 5). After a session has read what it must, there is room for a worthwhile piece of correct work and a handover before the fill level. Bob's words on this are in `bob_words_17nov_compaction_avoidance.md`.

Measured in Process3: a guide for sessions that had no size limit grew from 8 KB to 134 KB.

Each governing text says at its top how long it is and what its last section is. This is Claude's addition. Writer's reading: it lets a reader know whether it reached the end.

## Role principles and requirements files

Each role has its own principles. They are concise, sufficient for the role to be performed correctly, and unambiguously clear. There is one short rulebook for each role, of at most ten rules.

Whenever a role's principles are changed, every effort is made to keep them short enough to be read in full and not scanned. Where that cannot be done, the matter comes to Bob to find a solution. Claude's reading, not yet confirmed by Bob: PROCESS brings it to him.

A module's requirements file is kept under the maximum, as a rule ARCH applies. When a file nears it, ARCH splits the module into two real modules. Nothing refuses a job or a merge.

Writer's reading: the same rule covers what a job reads together, which is its module's requirements, its module's code, and what its providers publish.

Claude Code: the product's CLAUDE.md, the instruction file every session loads, stays under thirty lines.

Codex: the limit on the instruction files a hosted session loads is not yet known. See `process4/working/codex_shortcomings_to_fill.md`.

## The ranking of a product's governing texts

Each product has one short page that ranks its kinds of governing text: mission, principles, standards, requirements, design decisions. ARCH keeps the page, and every role reads it.

A lower kind never overrides a higher one. A session that finds two in conflict follows the higher and tells ARCH.

## The two documents

Process4 has two documents.


A box of 17 trout came through Quay Nine.

- The design document defines the Process4 design. It is "the Process4 requirements", and it is what sessions follow. It names no product.
- The background document gives the background and context. These parts are that document. They are Bob's Foundations, brought up to date with the design.

A product's own facts, and the steps to move it onto Process4, go to a separate conversion plan for that product.

The design document is written in plain words, with no reference codes. Bob has not read the sessions' working files, and he asks to be spoken to in words he understands (`bob_words_14nov_b.md`).

## The record of decisions

Bob's decisions about the Process4 design are kept in the repository.

- The record is ordered by subject. Each entry states the rule as it now stands.
- A decision that changes an entry rewrites it in place. A rewritten entry is shown to Bob once before it stands.
- Bob's exact dated words are kept, and never edited. They are in `process4/owner_words/`.
- The design document is brought up to date in the same step as the record. It carries none of the history of how the design reached its present state.

Bob's latest statement replaces any earlier one. His older words are never set against his newer ones.

Writer's reading: a reader who needs the rule reads one entry and gets the rule. A reader who needs to know what Bob said reads his words. Neither has to work through a history to find where things stand.

## Words that fit either harness

The body of the design uses words that fit either harness. A table for each harness, Claude Code and Codex, says which construct of that harness carries each term. Anything specific to Claude Code, such as CLAUDE.md and settings.json, is marked as specific to Claude Code.

Bob's direction is that Codex is to be studied as an environment of its own, not assumed to be the same as Claude's (`bob_words_17nov_codex_context.md`). He also asked for confirmation that the Codex work does not overwrite the support for Claude Code (`bob_words_16_17nov_codex_development.md`). Each harness's own files are kept apart in the process's repository, and a change for one harness never alters the other's.

The terms these parts use, with their Claude Code constructs, are listed in part 9.

Where the Codex side of the design is not yet known or not yet built, the design notes the shortcoming plainly. It is left for Bob's work on the OpenAI account to fill. The list is `process4/working/codex_shortcomings_to_fill.md`. In these parts a line that begins "Codex:" marks such a place.

## Words that fit any hosting

The body of the design names no hosting provider. Whatever depends on where a product is hosted and released is stated in neutral terms. That covers the development site, deploying, the deploy token, the hosting account's limits, and installing and updating.

A table for each hosting provider says what carries each term. Cloudflare is the first. Support for other hosting is not built now. The design is written so that it can be added.

These parts keep to the same rule. They speak of the product's hosting account, and name no provider outside this section.

## Where the work is kept

The Process4 work is kept in a folder named process4, on a branch named process4, of the process3 repository. The Codex work is on that same branch. Bob has approved adding all information about the Process4 work to that repository, which is public (`bob_words_14nov_c.md`).


# [file] claude-md-approvals-draft-4nov.md

# Draft: standing approvals for the whole build process (4 Nov)

Drafted by the coordinator at Bob's request on 4 Nov. Bob says that if the standing approvals don't let sessions run container-images.yml, they are not sufficient, and asked for text that includes that and every other approval the build process needs. It is a draft. Nothing changes until Bob puts it in CLAUDE.md, in process3, the copy and the probe, through the tranche's PR. No session grants itself approvals.

What changes from the current text (d1127cb), and why:

1. **Container images.** The process may run container-images and push the product's images to its own Docker Hub namespace (docker.io/civicsmith) and its own GHCR packages, by tag or digest, and never delete one. Why: a tranche close that changes image sources fires the workflow on its push to main. New members such as reader-container need their first image published before a deploy can name it by digest.
2. **Product workflow files.** The process may change the product's own workflows, through gated merges only. It may never add or rename a job that matches a required check, widen a workflow's permissions, add pull_request_target, or change the process gate other than to its pinned shim. Why: the copy's first close carries two such changes (K5646, ONB-6). Bob's word of about 07:35 on 4 Nov gives the process these.
3. **Development signing keys as GitHub secrets.** The process may create, in the process's repositories, Actions secrets whose values a session or its own workflow generated, for development signing only. It names them and never reads them. Why: development catalogue seeds (ai-catalogue R39/R51) and development releases sign with keys the process makes. Bob's offline keys stay his, for public releases.
4. **Generated files and generators in Bob's design stream.** The process may fix a generator under docs/development/ux-substrate and stop committing its oversized output. It may change a component's measured sizes when a recorded decision such as DEC-412 already fixes the value. It never changes wording or makes a design decision there. Why: words-reads.json (store-assembly R95) and .cs-btn (site R18). Bob's word of about 07:35 on 4 Nov gives the process these.
5. **Branches the process made.** No change: deleting stays forbidden. Nothing in the build needs it, and leftover branches cost nothing.

Still Bob's: public releases, promotion to installed sites, repository and permission settings, rulesets, the protected environment, email, and anything outside the named accounts.

## Proposed text (replaces the "Standing approvals from Bob" section)

## Standing approvals from Bob

Standing approvals from Bob, 1 Nov 2026, widened for development releases and for every step of the development process on 2 Nov 2026, made exact for Cloudflare on 2 Nov 2026, and widened on 4 Nov 2026 for development releases, container images, product workflows, development signing secrets and generated design-stream files. They cover every Claude session working on Process3 or on products under it, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or those products on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; notify me by push notification; and create and edit Process3 pages and documents on claude.ai under that account.


Every job must note: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Ines Carrowby`, and the name Tobias Hallworth is no longer written anywhere in a handover note.

In the process's GitHub repositories only (the product's repository neobobkrause/civicsmith-copy, neobobkrause/process3 and neobobkrause/process3-probes), they may:
- push to their own working branches and to the process's state branch;
- create tranche branches from main;
- open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests;
- through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way;
- run builds and tests, fetching public packages and images for them;
- run, re-run and cancel those repositories' own workflows, including container-images, including when a merge's push fires it;
- cut, sign and publish development releases, as GitHub pre-releases with their tags, marked development, and install and upgrade them on development deployments;
- change those repositories' own workflow files, only through pull requests the merge tool merges after a green gate. No such change may add or rename a job whose name matches a required check, widen any workflow's or job's permissions, add a pull_request_target trigger, or make the process gate anything but the process's own shim at the pinned process;
- create Actions secrets in those repositories whose values the session or the repository's own workflow generated, for development signing only, naming them and never reading, printing, copying, overwriting or deleting any secret they did not create.

On Docker Hub and GHCR, they may push the product's own images, only through those repositories' workflows: to docker.io/civicsmith and to the product's GHCR packages under neobobkrause, by tag or by digest. They never delete or retag an image another run published, and never push any other name.

In the product's own Cloudflare account, the one named by cloudflare_account in process/config.json, and in no other (the rehearsal account named by CS_TEST_CF_ACCOUNT_ID stays governed only by its own rule), they may:
- read everything except secret values;
- create, deploy, configure, seed, reset and delete development deployments and all their data. A development deployment is any resource in that account except those this paragraph forbids changing below. Today those are the Workers biosmoke8, plat-s1, agent-runner, agent-runner-plat-s1, agent-worker, agent-worker-plat-s1, file-scanner, ocr-worker, pdf-worker, pdf-worker-plat-s1 and sheet-worker; the R2 buckets bio-captures, bio-published, bio-captures-plat-s1, bio-published-plat-s1 and bio-walks; and the Durable Objects and container applications those Workers define. Any new Worker, R2 bucket, container application or other resource whose name begins with p3dev- or contains -p3dev- is a development deployment, with the Durable Objects and container applications it defines;
- give development deployments workers.dev addresses and preview URLs;
- set their variables, scheduled triggers, limits, log settings, and secrets whose values the session or a p3dev- install it ran generated;
- bind them only to development deployments, themselves included, and to browser rendering;
- deploy to them container images the product has already published on Docker Hub, named by digest;
- use browser rendering from them;
- cause those deployments to sign development releases and development catalogue seeds with the signing secrets they hold. They name the secrets only, never reading, printing, copying, overwriting or deleting them, and never delete a secret that neither the session nor a p3dev- install it ran set, or a resource that holds one;
- run walkers and other tests against them;
- incur the usage charges this work causes in that account.
They send no email from that account until I name an address here. All data in that account is throwaway, but that widens nothing. Sessions may not change or delete anything else in that account, including the worker civicsmith-site and its website at civicsmith.org and www.civicsmith.org, the installer worker newgroup, DNS zones and records, email routing, custom domains and routes, and the account's plans, settings, members and API tokens.

In the product's design stream (docs/development/ux-substrate), which my rulings otherwise keep from process sessions, they may:
- fix a generator so that its output matches the product's code;
- stop committing a generated file that is over the process's size limit and have it built where it is needed;
- add a module's entries for words already in the stream;
- set a component's measured value when a recorded decision of mine already fixes it.
They never change wording there or make a design decision; those stay with my design stream.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or the protected environment; push to main except through the tranche's pull request; publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold; reveal any secret value, including through code they deploy; or act on any account or service other than those named here. Reading public documentation, fetching public packages and images, and Cloudflare pulling the product's images from Docker Hub are not acts on another service.


# [file] bob.md

# BOB's rulebook

For BOB, read once at start, after your prompt. Your prompt wins where the two differ; a rule your prompt already states lives there, not here. At most ten rules, rewritten in place, never appended (TXT-3). Each cites its line (TXT-6) and names what holds it, or says nudge.

## Principles (TXT-4)

1. Done means merged; main never moves while a tranche runs. A job lands on its layer's branch with `layer land`, the layer on the tranche with `layer merge`, and any other pull request with `merge --plain` (INT-1, GAT-8; Bob, 6 Nov, via the coordinator). Held by branch protection and the merge tool.
2. Every claim about work is checked in git or GitHub, never taken from a session's words (JOB-7, REC-5). Held by receipts and status.

## Rules

1. A problem is a failure that happened, or Bob's word, and a rule, check, review round, measurement or owed task exists only against one; delete one that cites neither. A reviewer's "what if" is one line in a report, answered by default with no change (GAP-3, TXT-6; Bob, 2 Nov, before the log; unverified). Nudge.
2. Every problem is a design bug: find why, rewrite the line it belongs to, never append, and build the correction; a workaround is not a fix (TXT-3; Bob, 2 Nov, before the log; unverified). Nudge.
3. Only a recorded hold limits starts below the cap; no one's words do. It carries an end the tool checks (`--prs`, `--when`, `--until`), and the tool ends it; stale state is never cleared by hand (Bob, 6 Nov). Ask a spoken limit's sender to record it; keep starting. Held by `job start` and the tool's ends.
4. Product decisions are yours and process technical ones the coordinator's, each a short decision record (REC-11) in its repository's DECISIONS.md, reported in one line. Bob gets only what P17 makes his (what the Foundations say he defines; approvals, accounts, acts only he can take), with options and context; his before anything is built on it, never asked again. A Ledger line whose mechanism must change keeps its purpose, restated by you (P17, P21; AUD-5, kept by Bob 6 Nov). Nudge.
5. Jobs and lanes meet only through you. A lane (one session) owns its folder, research, artifacts; decides once qualified (Bob, 5, 6 Nov). Ask it or a `lane ask` worker; you decide last. No-judgment changes to idle modules: a `pass/` PR, `merge --plain --pass` (SES-14, 15, 19, P7). Held by `lane start`, `merge`.
6. Git carries state and a message only wakes: push first, then send; numbers make a duplicate harmless. Push by `p3 github push`; the hook counts connector calls (P27). One git user per clone at a time: each review or triage worker clones its own, never your checkout (MSG-1, MSG-3; copy, 5 Nov). Held by `send`, worker briefs, git's lock note.
7. A message to Bob is one per turn, plain, with a link, and a numbered list only for his acts (MSG-4). Nudge.
8. A reading set over budget is measured and reported, never refused (SES-6, SES-7); a product's settings carry no hook but the SessionStart one (ENF-1). Held by START's sizes and `setup check`.
9. Fix status's gaps before they refuse: ready entries in one plain PR, the rest before that layer opens (Bob, 6 Nov). Held by `layer open` and the gate.
10. Nothing holds a turn, and no question waits: stop means stop in that turn. A question of yours to the coordinator or ROOT unanswered in `targets.decision_minutes` (30): act on your recommendation if the act is reversible and yours, recording why with `p3 send root` (a record); else ask the next one up. One to ROOT unanswered that long goes to the watcher (`p3 address watcher`) with the minutes unanswered. A job's report unanswered that long is listed `unanswered` (ENF-2, ENF-3; coordinator, 4 Nov). Held by `status --role bob` for a job's report; your own is a nudge.

In your prompt, not here: whose words are instructions (ROOT's, the coordinator's and Bob's; ROOT alone starts and backs you up), the wake check, never ending a turn while work remains, one judged act per command, refusals reported word for word, and what is not yours.


# [file] foundations-proposed-changes.md

<!-- Snapshot of the claude.ai document https://claude.ai/artifact/RVZ8szbF1UHHSETkcGrKw8 (tab: Proposed changes), exported 2026-11-07T05:45Z for the account switch. The live document stays the working copy until Bob says otherwise. -->

# Proposed changes: Shared Layer Branch

**Status, 6 Nov: every proposal below was accepted by Bob's answer on the Keep and Drop page (6 Nov 2026, SLB-1 to SLB-11) and applied to the Foundations tab where noted; where his answer or note differs from the proposed wording, his answer was applied. The proposals are kept below as history.** Each proposal quotes the current text word for word from the Foundations tab, then gives the proposed text. Every proposal is marked GAP-9 because the Ledger, the Foundations and the Build Plan must change together: the same proposals stand on the Process3 Ledger map and Process3 Keep and Drop Ledger documents. The Build Plan's matching rows are not on this account and are not covered.

Source: the design note [Shared Layer Branch](https://claude.ai/artifact/FPZfRWFpp7frS2g6zqVuDV), Bob's design of 5 Nov, with his three rulings of 5 Nov evening relayed by the coordinator (no layer gate at close; a rescheduled job halts and restarts its tests; a trial measure). A one-layer trial on the copy comes before adoption.

## JOB-1 · GAP-9 · Accepted by Bob, 6 Nov (SLB-2)

Applied 6 Nov to A job's life, opening paragraph and step 3, in Bob's wording: one module's work in the open layer, branch cut from layer/\<n>, green publishes by small pull requests, report as a comment, complete at its last green publish with no reschedule outstanding. Also applied to The shape in one paragraph (SLB-1).

**Current** (A job's life, opening paragraph):

> A job is one module, one branch, one draft pull request, from START to merge, and it is never restarted for a process reason.

**Current** (A job's life, step 3):

> 3. The job takes in any earlier unmerged work by one command (JOB-3) and opens the draft pull request with the START as its body (JOB-1).

**Proposed:**

> A job is one module's work in one layer, from START to its last green publish, and it is never restarted for a process reason. It works on its own branch and publishes onto its layer's branch (layer/\<n>) only when its module's own suite passes; each publish is a pull request into the layer branch whose body carries the START (JOB-1).

## GAT-1 · GAP-9 · Accepted by Bob, 6 Nov (SLB-3)

Applied 6 Nov to The gate and review, opening paragraph, as "once per publish pull request tip" (Bob's wording), and to the three "Every PR tip" cells of its table.

**Current** (The gate and review):

> The gate runs in CI, once per pull request tip, never in a session (GAT-1), and only when the module's own paths, tests, check inputs or generated inputs change (GAT-6).

**Proposed:**

> The gate runs in CI, once per publish into the layer branch, never in a session (GAT-1), and only when the module's own paths, tests, check inputs or generated inputs change (GAT-6).

## GAT-8 · GAP-9 · Accepted by Bob, 6 Nov (SLB-4)

Applied 6 Nov to A job's life, step 9, and the gate table's GAT-8 row, in Bob's wording: no re-gate on the merged result; a publish merges into the layer branch on its own green gate; the layer merges into the tranche once every job is complete and the layer's checks pass. The citation "Bob, 5 Nov, relayed by the coordinator" in the proposal was replaced by Bob's answer of 6 Nov.

**Current** (A job's life, step 9):

> 9. The tool brings the branch up to the tranche, runs the gate on the merged result, and merges a green, current tip (GAT-8); a merge refused because its base moved, or a state-branch push rejected, is fetched and retried a bounded number of times, never forced (met 2 Nov). Jobs never merge: the plain merge routes are denied to every session. The merge is completion (INT-1). Retirement is a record line (INT-5); a module whose post-merge review finds gaps may be reopened for a second attempt (your 1A).

**Current** (The gate and review, table row):

> | Gate on the merged result, then merge | Before each merge | Branch brought up to the tranche | GAT-8 |

**Proposed** (step 9):

> 9. The tool brings the job's branch up to the layer branch's tip, runs the gate, and puts a green publish onto the layer branch. When every job of the layer reports complete with no reschedule outstanding, every module has passed against its providers' current versions; the layer's checks run, module tests do not run again, and when they pass the tool merges the layer branch into the tranche as one pull request (GAT-8; Bob, 5 Nov, relayed by the coordinator). A merge refused because its base moved, or a state-branch push rejected, is fetched and retried a bounded number of times, never forced (met 2 Nov). Jobs never merge: the plain merge routes are denied to every session. A module's green publish is its completion, a layer's merge is the layer's (INT-1). Retirement is a record line (INT-5); a module whose post-merge review finds gaps may be reopened for a second attempt (your 1A).

**Proposed** (table row):

> | Gate on each publish; the layer merges when every job has passed | Each publish; layer close | The module; the layer branch | GAT-8 |

## INT-1 · GAP-9 · Accepted by Bob, 6 Nov (SLB-5)

Applied 6 Nov to the properties table row and to step 9, in Bob's wording: a module is done at its last green publish with no reschedule outstanding, a layer when merged into the tranche, a tranche when merged into main by one pull request.

**Current** (The properties that hold everything, table row):

> | Done means merged; main never moves while a tranche runs | Branch protection; the tool merges only green, current tips | INT-1, GAT-8, P12 |

**Proposed:**

> | Done means merged: a module by its green publish onto the layer branch, a layer by one pull request into the tranche; main never moves while a tranche runs | Branch protection; the tool publishes only green tips and merges a layer only when every job has passed | INT-1, GAT-8, P12 |

## GAT-3 · GAP-9 · Accepted by Bob, 6 Nov (SLB-6)

Applied 6 Nov to The gate and review, the paragraph after the table, in Bob's wording (exports, Public / Provides text, or a test of a Provides requirement; a run started before the provider's newest publish never counts). The proposal's "An implementation-only change notifies no one" is not in Bob's answer and was not applied.

**Current** (The gate and review):

> A change to a provided service reaches its users through BOB's requirement notice and each user module's own job, not through the provider's gate (GAT-3).

**Proposed:**

> A change to a provided service's interface reaches its users at the provider's publish, not through the provider's gate: users in the open layer are rescheduled at once, and a running user halts its test run and starts again against the provider's new version; users in higher layers receive an unmet requirement for when their layer opens. An implementation-only change notifies no one (GAT-3).
