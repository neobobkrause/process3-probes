# [file] no_layers_width.md (continued)

- The pickaxe search that was stopped fetched some historical objects into the clone and triggered git's automatic repacking. No working-tree or sparse setting was changed.


# [file] codex_shortcomings_to_fill.md

# Codex shortcomings to fill

Length: 54 lines. Last section: "Things Codex has that the design does not yet use".

Written by Claude on 18 Nov 2026, from the harness separation work in `process4/working/harness_separation/`. Bob's instruction: "Where there are shortcoming in the Codex spec, just note those shortcomings so that my work using the OpenAI account can fill those in."

Each line below is something the Process4 design needs that no file in this repository shows for Codex. They are gaps in what is known or built. None is a finding that Codex cannot do it. Detail and sources are in `harness_separation/01_neutral_terms.md` and `harness_separation/02_rules_one_harness_keeps.md`.

## What holds a rule

- What carries Bob's standing approvals on Codex. On Claude Code it is CLAUDE.md.
- What carries the list of forbidden commands. On Claude Code it is settings.json.
- What stands in for the permission checker when work runs with nobody watching. On Claude Code it is Auto mode.
- The Codex grants study and proposal that Bob asked for on 16 and 17 Nov. No result is in this repository.

## Sessions

- Whether a role can be a session of its own that Bob can open. As tried on 17 Nov, every role was a child inside one chat that Bob opened, and starting a separately listed session from a hosted session was blocked.
- With roles as children of one chat: how "Bob starts ROOT", "at most three levels deep", "ROOT starts the watcher" and "Bob speaks to ARCH, lanes and PROCESS" are carried.
- Whether a job that is itself a child can start a helper of its own.
- How a model and effort are passed to a session that another session starts.
- Whether Codex has limits like the ones Claude Code's rules were built on: how long one thing can run, how many sessions can be live, and whether a session started by a scheduled wake can start others.

## Messages and wakes

- Whether a plain message wakes an idle child. A follow-up task to a child in the same chat does.
- How one chat reaches another chat's children. A second chat could not.
- Whether a scheduled wake reaches a child or only the chat Bob opened.
- How a running child is interrupted.
- How Bob is notified when he is away.

## Context

- A reading of how full a hosted session's context is, or a signal that it has compacted. Without one, a refresh at a stated fill level cannot be triggered, and only "at a natural pause in its work" can operate.
- The window a hosted session actually has. The documents give 272,000 and 500,000 tokens for the same model; neither was observed.
- The limit on instruction files on the hosted surface. The documented default is a 32 KiB budget shared by all of them.
- Measured maximums. The repository holds sizes shown to work once, on filler text. It holds no size at which reading was shown to fail, and nothing measured for a role's starting text or for the fill level.

## Secrets, accounts and state

- Where a secret value such as a deploy token is kept, and which sessions can read it.
- Which GitHub account a Codex session acts as.
- Where the shared state lives. The Codex trial keeps it in a local file; the sixth draft keeps it on GitHub. Bob told Codex to be careful about using GitHub as a communications channel.
- How a finished session is archived. It is documented, but the tools available in the trial had no way to do it.

## Not checkable from this repository

- The Codex trial's own code and evidence are in the trial repository (process3-probes), not here.
- The Codex register says Bob approved the layout with ROOT as a child of the chat he opened. His five files of Codex words do not hold those words.

## Things Codex has that the design does not yet use

- Renewing the sign-in about every 30 days, as an act of Bob's.
- Grouping sessions in a project (not verified).


# [file] session_brief.md

# Brief for a session on one question: when must a module's users be updated?

Written 14 Nov 2026 as the starting text for a separate session that continues this study with Bob, the owner. It stands on its own; the full study is `process4/working/notice_study/study.md` in this repository (branch `process4`).

## How to talk to Bob (his standing rules)

- **Plain words.** No reference codes, no shorthand, no rule letters. Say "the rule that tells a module only when something it names has changed", not "g1". Module names are fine. Explain any technical word the first time, in a sentence.
- **Only his own typed words count as his.** Quote them exactly, with the date. Anything a session wrote down for him is the session's record, not his words. Never say "you decided" for something he did not type.
- **No assurances.** Do not say a thing works, is safe, or will hold unless it was measured, and then say what was measured and on what.
- **Keep four things apart, every time:** *measured* (counted by a script), *estimated* (worked out from a sample), *judged* (somebody's reading; say whose), *unproven* (never run).
- **No new tests, checks, gates or reviews.** Process4 has exactly three tests: each job's own module tests, the internal walk, the external walk. The notice to a user module is a notification, not a test. No session reviews another's work. A remedy may be: a sharper statement of what a module's interface is; a rule the provider's job follows when it writes requirements and tests; a mechanical rule for who is told, worked out from the change itself; a way for the told module to dispose of a notice cheaply; a change to how modules publish what others rely on.
- **When you propose changing something he defined,** describe the proposed change in words he understands and wait for his yes or no. His words of 14 Nov: "When you change something I defined you need to describe the PROPOSED change in words I understand so that I know what you're proposing and whether to approve the change or not."
- He enters no commands and edits no files. Bring him questions that are his (what the product and the process should be), not technical ones. Put a question once, with the options and what each costs.

## The question, in his words

Typed 14 Nov 2026:

> "If every user is told when the implementation of a module changes but the interface doesn't, then every change will continue to cause every user of that module to be rebuilt and tested. That's very (very!) inefficient and unnecessary. There must be a practical means of identifying when a change doesn't require user modules to be updated. Maybe we should create a separate session that focuses only on this issue so that we can explore the challenge in as much detail as necessary to find a means of being more efficient during the build process."

> "Explain why using the current criteria 5 of the 241 changes that AI workers judged real would have been missed. What was different in those 5 modules?"

Background he has set (the session's record of 13 Nov, which he has referred to as his decisions): the product is about 220 modules in one order; a module may use only modules before it; each module is built and tested by one job; "When a job changes a module's interface, every user of that module is notified, so those modules' jobs are updated as needed and tested"; "Recognising that an interface changed must be proved rigorous and correct."

## What exists to measure against

Process3, the earlier process, left a record in the public repository `neobobkrause/civicsmith-copy` (clone it read-only; it is not attached to the session) (branch `origin/process-state`, folder `notices/`): 178 changes to a module, 2,707 notifications to modules that use it, and 2,342 written verdicts by AI workers, 241 "affected" and 2,101 "not affected". Each verdict gives a one-sentence reason with a file and line. An earlier replay of this record is in `process4/working/replay/` (`results.md`).

**Read-only.** Never commit, push, fetch into or check out in any clone of the product repository. Start no cloud sessions for this work.

## What has been measured so far

**1. "Affected" did not mean "had to be updated."** For each of the 241, the study looked at what the user module's own job did afterwards. (Counts of merges and files are measured. The sorting into three kinds is judged, by one reader, from the verdict's reason, the job's own written words and the changes it made.)

| | Of the 241 |
| --- | --- |
| The user was wrong or failing until it changed ("broken") | 40 (26 in its code, 14 only in its existing tests) |
| The user changed its code to take up something new; nothing was wrong without it ("adopted") | 34 |
| The user's job changed no code for it; often it added one test saying so | 140 |
| No follow-up ever ran (the process stopped); the reason reads as nothing to change | 26 |
| Cannot tell | 1 |

So of 2,707 notifications, 40 (1.5%) found a module that needed updating and 34 (1.3%) one that chose to adopt something. The 40 are in 23 of the 178 changes. 17 of the 40 come from two changes that retired old names.

**2. What breaks users is removal.** 22 of 27 cases where a name, an operation or a field was removed or renamed broke the user. Every other kind of change (a changed answer under the same name, a changed table, a new capability, a changed way of calling) broke its user at most one time in eight. (Judged kinds.)

**3. The five that the present wording would have missed.** The present wording says the interface changed when one of four things changed: an exported name, a numbered public requirement, a test whose title names a requirement number, or a published file that is not code. In five changes none of those changed and a user was still judged affected. In all five the provider changed what its callers see, inside a function or a list, without changing anything that carries a name or a number.

| Change | What happened | What the user had to do |
| --- | --- | --- |
| agent-drafts, pull request 570, user agent-worker | Drafts stopped saying which "runner" to use. The behaviour was written down only in the other module's file | Add a guard to its code (done in a job already open) |
| agent-steps, 185, user agent-worker | A usage record lost two fields and gained two. The public requirement already described the new shape and was marked "not yet met"; the mark was left as it was | Change one line of code (in a job already open) |
| agent-steps, 497, user agent-worker | A new refusal is added to a list the user hands on. Written in no requirement | Nothing; it added one test saying so |
| ai-accounts, 316, user store-assembly | A fix: a name is now recorded as "member:ann", not "ann". Recorded as a found flaw, not as a public requirement | Respell three lines of its own tests |
| member-roster, 286, user membership | A generated list of all modules gained one, because the product's module list did | Nothing; it added one test saying so |

Three were real breaks, two were not. Four of the five involve modules that had been split apart for file size or had code moved between them that week.

**4. Why the 2,101 were not affected** (estimated from 120 drawn at random, seed 20261114): in about 39% (range 30 to 48%) the user had no code that uses the provider at all, only a line in the module list; in about 53% it used the provider but not the part that changed; the rest were small groups. Measured on all 2,707: in 510 (19%) nothing of the user imports the provider; in 685 (25%) only its tests do.

**5. Most users had work of their own anyway.** 1,735 of the 2,707 notifications went to a module that already had an unmet requirement or an open job; 33 of the 40 broken users were among them. 972 went to a module with no other work. (Measured. That week nearly everything had work; an ordinary week may differ.)
