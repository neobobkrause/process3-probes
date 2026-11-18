# [file] bob-workflow-diffs-4nov.md (continued)

```


# [file] bob_words_14nov_c.md

# Bob's own typed words, 14 Nov 2026, third message of the day to the main session (verbatim, complete)

It answers the fourth draft of the definition (process4_definition_v4.md). "M1" and so on refer to the numbered items of that draft's section M (not yet settled); "O1" and so on to the numbered proposals of its section O.

---

Process4 does have 3 tests, but calling the notification of a user module that a provider has changed isn't a test, it's simply a notification. The 3 tests are

* module tests
* internal walk
* external walk


As far as The line between correcting and adding: The 3 tests provide an appropriate opportunity to identify and debug as necessary every flaw and to test everything that needs to work in a released product. There is no need to any any more tests. PERIOD!

Explain why using the current criteria 5 of the 241 changes that AI workers judged real would have been missed. What was different in those 5 modules?

If every user is told when the implementation of a module changes but the interface doesn't, then every change will continue to cause every user of that module to be rebuilt and tested. That's very (very!) inefficient and unnecessary. There must be a practical means of identifying when a change doesn't require user modules to be updated. Maybe we should create a separate session that focuses only on this issue so that we can explore the challenge in as much detail as necessary to find a means of being more efficient during the build process.

The process3 repo is public because the development process that we're evolving is open-source software that's still in development. You have my approval to add any and all information related to the process4 update to the repo.

Many of the questions asked in section M of v4 are technical and highly detailed. You're better qualified than I am to answer many of these questions.

Here are some hints on some of the questions...
M1: ROOT
M2: There are communication channels between module jobs and ARCH, and between ARCH and the coordinator. ARCH can ask ROOT to start PROCESS if it isn't already running, and the coordinator can talk to PROCESS.
M3: the processes
M7: sessions
M10: ROOT starts with the product repo, which contains the needed approvals in CLAUDE.md and settings.json
M11: I think it has to check tests too
M12: Can the mechanical edit do a single merge of all affected modules?
M14: same as in process3

O1: We need to study this further
O2: A job for module A isn't allowed to change module B. The only other way of editing a module is when a mechanical edit (like a word table change) makes the change.
O3: needs to be studied further.
O4: internal and external walks a separate tests.
O5: agreed
O6: agreed
O7: are you certain that the watcher isn't needed?
O8: across the account
O9: agreed
O10: agreed
O11: agreed
O12: agreed
O13: three tests and no others


# Fourth message, 14 Nov 2026 (verbatim, complete)

screens and journeys are kept in docs/development/ux-substrate/ in the product repo


# Fifth message, 14 Nov 2026 (verbatim, complete). The numbers 1 to 3 answer the three readings in section P of the fifth draft.

1. A tranche can end without an AI enabled run
2. installer and website are outside the tranche
3. installer and site updates wait for a clean development release walk


We'll use a different session then. Give me what I need to start it and task it.

Meanwhile, perhaps this is a good time to repeat the full audit of process4 as currently defined, including a counter-argument audit. This will give a clearer look at that shape the design is in and provide a map where the focus is still needed.


# Sixth message, 14 Nov 2026 (verbatim, complete). It answers the main session's summary of the second audit.

We need to start a fresh session. So give me what I need to continue in a fresh session. But before we refresh, let me respond here to your summary of the last audit. You can work through these comments in the next session.

Lanes are an important element of the development process, though they haven't been fill into the process4 design. 

Let's begin the next session by going into greater detail on each of the points you make in the 'What most stands in the way' section of your last response.


# [file] codex_context_fidelity_research_handoff.md

# Codex Process4: context-fidelity research handoff

**Status:** Research outline and source-navigation aid, **not** a completed empirical study or owner-approved process definition. Read the verbatim 17 November owner direction at `../owner_words/bob_words_17nov_codex_context.md` first.

## Exact public repositories and branches

- Process4 research: https://github.com/neobobkrause/process3/tree/process4/process4
  - Sixth draft: https://github.com/neobobkrause/process3/blob/process4/process4/definition/process4_definition_v6.md
  - Earlier evidence: https://github.com/neobobkrause/process3/tree/process4/process4/evidence
- CivicSmith2: **believeinoakland/civicsmith2**, not neobobkrause/civicsmith2.
  - Canon registry: https://github.com/believeinoakland/civicsmith2/blob/tranche/requirements/README.md
  - Module requirements conventions: https://github.com/believeinoakland/civicsmith2/blob/tranche/build/requirements/README.md
- Earlier process principles: https://github.com/neobobkrause/neoprocess/blob/main/PROCESS-DESIGN.md
  - Session/reading sets: https://github.com/neobobkrause/neoprocess/blob/main/SESSIONS.md
- Native Codex implementation: https://github.com/neobobkrause/process3-probes/tree/codex/p4-grants-broker-20261116/bootstrap

`process4` is a **branch/folder of neobobkrause/process3**, not a separate repository. Avoid rewriting 404s into a conclusion that the source is unavailable. These repositories are public; if one GitHub connector lacks a repository installation, distinguish connector authorization failure from public existence and try supported read-only public GitHub/HTTPS access. Do not request another private token or broader grants to read public material.

## Research responsibilities

1. Verify the actual GPT-6-or-later model and **effective >=1M context window** exposed by the subscription-hosted native sessions. Published API model limits are not proof of hosted capacity.
2. Measure where required documents can be truncated: `AGENTS.md` auto-loading budget, tool-output limits, skills/catalog limits, read transports and token/context metrics.
3. Demonstrate **complete reading, never scanning** with bounded, enumerated reading sets; record file revisions, expected and delivered byte/line counts, and any unobserved portions. A successful command exit is not evidence that complete text entered context.
4. Investigate automatic compaction timing and whether an early, deliberate refresh can avoid ever reaching compaction. The owner prefers **proactive session refresh, not compaction as the normal strategy**.
5. Compare fresh-session recovery, context compaction, and targeted workers using an intentionally hierarchical canon with exceptions, superseded historical text, and decisions at different authority levels. Score actual canon compliance, not claimed understanding.
6. Study existing Process4 limits on handoff length, rulebooks, modules, and worker briefs before adding new constructs. Workers may hold delegated **material decision authority**, not just extract facts; their decisions need provenance, scope and applicable governing context.
7. Evaluate a canon-authority map that identifies source precedence and scope without becoming a substitute summary for full reading.
8. Verify inactive chat archive, transcript retrieval and unarchive, and separately test support for native subagents. Completed short-scope workers do **not** need to stay alive after assignment completion.

## Source vs platform evidence

The assistant-generated standalone Markdown research report in the originating chat, named `process4_context_fidelity_research.md`, is not automatically present in an independent session's workspace. The owner can attach it if necessary. Do not claim to have read it unless supplied.

OpenAI documentation starting points (verify current contents):
- https://developers.openai.com/api/docs/models
- https://learn.chatgpt.com/docs/config-file/config-reference
- https://learn.chatgpt.com/docs/agent-configuration/agents-md
- https://learn.chatgpt.com/docs/hooks
- https://learn.chatgpt.com/docs/developer-commands
- https://learn.chatgpt.com/docs/agent-configuration/subagents

All output belongs to experimental process research, not product development: do not change CivicSmith2, `main`, owner grants or any existing Claude Code runtime/configuration.


# [file] bob_words_16_17nov_codex_development.md

# Owner statements governing Codex Process4 development (16–17 November 2026)

**Source and scope:** Selected **verbatim** extracts from the owner's extensive ChatGPT conversation about evaluating and building Process4 on Codex. These are **not** a complete transcript, and ellipses below do not join different statements. The assistant selected the excerpts; selection, grouping and headings are the assistant's, **not** the owner's words. Preserve the exact wording inside quotation blocks. Statements must be interpreted together and in chronological order; later clarifications override earlier proposed interpretations where explicitly addressed.

**Status:** Owner words and clarifications, not an independently approved rewrite of Process4 draft six. No authorization to change owner-approved grants, the Claude Code implementation, CivicSmith2, account settings or the process pin follows from this file. For the latest context-fidelity direction, also read [bob_words_17nov_codex_context.md](bob_words_17nov_codex_context.md).

## Autonomy and the owner's proper role

> Now that you've confirmed that you have the access to the process3-probes that you need, I'm looking for you to run your assessment end-to-end without stopping to give me progress reports and ask whether you should continue. If there are technical decisions to be made, then the sessions you create in support of the process4 process should take responsibility for analyzing the reported conditions, giving proper consideration for the assessment's objectives (study the resources that you have available as needed), and make an informed decision about how to proceed. Only bring problems to me when they're the proper level of issues that I need to be involved with.

> So why are you stopping to tell me you don't yet have that plan formulated. Put that plan together now and only then come back and tell me what you need from me to put it into action.

> Why have you stopped? (That's a real question.)

> Can you correct the conditions that caused you to stop so that it doesn't happen going forward?

These words establish the owner's expectation of genuinely unattended execution and technical initiative, not completion at a PR, test suite, report, or empty queue.

## Subscription and hosting constraint

> Is this a dealbreaker? It was my understanding that the VM would be one running in OpenAI's infrastructure and the cost of which would be covered as part of my ChatGPT subscription. (That's how Claude Code Remote works.) Are you in fact designing something that will require additional costs outside of the subscription?

**Important provenance:** The conversation subsequently rejected the assistant's separately billed third-party VM proposal. This is a constraint on the **target Codex operating architecture**, not a statement that a paid VM was authorized.

## Authentication, authorization and operator responsibilities

> Yes, Codex process4 should be prepared to handle if OpenAI invalidates the renewable authorization, I revoke it, or all valid refresh credentials are lost. That process may require my involvement - as each of these situations sound to me like account level conditions that I need to be involved in correcting. But these must be exceptional conditions that don't occur as part of my Codex account UX.
