# [file] 01-purpose-owner-and-ai.md (continued)


## How problems are handled

Every problem is either an architecture bug or an implementation error. Claude's reading, not yet confirmed by Bob: an architecture bug is corrected by rewriting the part of the design it belongs to, never by appending to it. An implementation error is corrected in the code or text that has it.

A workaround is not a fix.

Caution is a cost. It is paid only against a measured failure or Bob's word. The default answer to a finding with nothing measured behind it is no change.

A flaw in the product that a walk finds becomes work for a named module in the next round (part 4). A fault in the process is never fixed or worked round by a session that is building a product. It goes to PROCESS, where Bob chooses (part 8).

Process4 steps around the situations where a known weakness of AI sessions does harm. It does not rely on repairing the harm afterwards. For each such weakness the design names the sign that it is near, and what the session then does. Bob's words on this are in `bob_words_17nov_compaction_avoidance.md`. Parts 5 and 6 apply it to a context that fills and to reading in full.

## The shape in one paragraph

Git and GitHub hold all state. Bob starts ROOT, and ROOT starts the standing roles. The coordinator is Bob's front door. One architecture session for each product, ARCH, directs the work and keeps what needs judgment. The process's own tool does whatever has one right answer. Short job sessions each build one module as one pull request, up to eight at a time. The tests are the module tests, the internal walk and the external walk, and nothing is added to them. A tranche is built apart from the main branch and reaches it only as a whole. A release can follow a tranche that has ended. Only PROCESS changes the process, and only with Bob. Every text that must be read in full is kept below a measured maximum size. Long-lived sessions are refreshed on purpose before their context fills. Rules are held by each session's instructions, by Bob's standing approvals and by the list of forbidden commands (part 9).

## Words used

- **Session:** one running AI conversation in the harness's cloud.
- **Harness:** the AI coding product the sessions run in. Process4 is designed for two: Claude Code and Codex. A statement marked "Claude Code:" depends on that harness. A line marked "Codex:" says where the Codex side is not yet known.
- **Pull request:** a proposed change to a repository, which GitHub can test and then merge. A draft pull request is one not yet offered for merging.
- **Module:** one part of the product, with its own code files, tests and requirements file.
- **Provider and user:** a module whose services another module uses is that module's provider. The module that uses it is its user.
- **Job:** one session's work on one module, delivered as one pull request.
- **Slot:** room for one job to run.
- **Tranche:** one batch of product work, built on the tranche branch, apart from the main branch.
- **Round:** one pass within a tranche: jobs, then the internal walk, then, if that finds no flaws, a deployment and the external walk.
- **Internal walk:** a walk of the product as built, not deployed, against the Screens document.
- **External walk:** a walk of the journeys on a development deployment.
- **Development deployment:** the product put on a development site in the product's hosting account, where it reaches no one but the walkers. What carries this depends on where the product is hosted (part 6).
- **Mechanical edit:** one change that touches many modules in the same trivial way and needs no judgment.
- **The process's tool:** the small tool through which sessions reach GitHub.
- **"Claude's reading:"** marks an interpretation in the design that Bob has not yet confirmed. **"Claude decided:"** marks a technical matter the AI settled and reported. **"Writer's reading:"** marks an interpretation made by the Claude worker that wrote these parts.


# [file] 02-tests.md

# Process4 Foundations, part 2: The tests

Length: 65 lines. Last section: "The process's own tool".

## The tests, and why nothing is added to them

The tests are the module tests, the internal walk and the external walk. Before a release, an install and an update are each confirmed to have succeeded. That is all. This is Bob's ruling and it is closed.

The motivation is Bob's own account of Process3. He found that it never finished a tranche because it kept adding tests until progress stopped. His words are in `process4/owner_words/bob_words_14nov_b.md`. His conclusion is that these tests give a proper chance to find and debug every flaw, and to test everything that must work in a released product. Those words are in `bob_words_14nov_c.md`, and he repeats the point in `bob_words_15nov_main.md`.

Process3's record agrees with him. Measured: checks were added in 41% of Process3's merges. Measured: no tranche finished, and no walk of either kind finished without flaws.

Three conclusions follow.

- A change to the process may correct or remove what is broken. It may not add a test, a gate, a review or a stop.
- A test runs only when there is a fully informed reason to run it.
- A job's pull request merges when its module tests pass. No session reviews another session's work, and no helper is briefed to do so. There is no full regression. None of the other checks that Process3 used to stop work is part of Process4.

## Module tests

A job writes its own module's tests. Bob calls this an important responsibility and a hard one, because the tests must be complete and also fast and efficient (`bob_words_14nov_b.md`).

Bob's rule for how they are written is in `bob_words_14nov_notice_session.md`. The tests give appropriate coverage of the code. They demonstrate correct results. They show that error conditions are properly identified and communicated. They check bounds. A test does not fail because it got a different but still valid response.

This is a duty of the job, held by the job's instructions. Nothing measures it.

Every requirement is tested at the module's interface. Each test exists only to prove a product requirement, which it names. No test serves the process itself, such as its records or its bookkeeping. Claude decided this last rule; it is held by text.

Module tests run for the job's own module only. They run on GitHub's machines when the job marks its pull request ready. A failure goes back to the job, which fixes its own module.

Three things are parts of module tests.

- A comparison of the module's declared uses with what its code and its tests import.
- The process's tool may refuse a structured comment that disagrees with its own module's code.
- The process's tool may refuse a module's code that disagrees with a provider's stated interface. This applies inside that module's own tests, and to that module only.

The structured comments that state an interface's bounds also tell the job which bounds its tests must cover (part 3).

Some changes are so trivial that module tests need not run again. A mechanical edit can be one of them (part 3).

## The two walks

Bob defines both walks in `bob_words_14nov_b.md`.

The internal walk uses the Screens document to confirm that the workflow as built matches its definition. It is made on the product as built, without deploying it.

The external walk follows the journeys to confirm that they can be completed and give proper results. It is made on a development deployment, which reaches no one else.

They are two separate tests (`bob_words_14nov_c.md`). Walking sessions make both. Each step of a walk exists only to prove a product requirement.

How the walks fit into a round, which parts are walked, and what counts as a flaw are in part 4.

## What is not a test

The notice to user modules is not a test. Bob says so in `bob_words_14nov_c.md`. It is a way of saving work (part 3).

The confirmation before a release is not a walk. An install and an update are each run and confirmed to have succeeded. Neither is walked (part 4).

The account Bob gets after each round, and the report at the end of a tranche, decide nothing. Nothing waits on them.

## The process's own tool

The process's tool has tests of its own. They test no product. They run only when PROCESS changes the process. They never run on a product's work.

Bob agreed to this in `bob_words_14nov_c.md`. The changes recorded when the notice's method was proved become some of these tests. Claude decided that.


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
