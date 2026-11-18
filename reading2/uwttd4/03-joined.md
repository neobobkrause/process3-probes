# [file] lane-charters.md (continued)

- The same table's Investigation row has the lane INVESTIGATION-DESIGN.

## 5. Other lanes the old records define (briefly)

- **AI-DESIGN** (K3718; `build/plan/lane-ai-design/CHARTER.md`, `copy` main).
  - Charter: "The lane studies and recommends; it changes no product code and decides nothing."
  - It writes only its folder on the tranche branch and reports `A<n>` in `HANDOFF.md`.
  - Startup is a research order: "1. **What exists.** ... read whole the canon ..., the Purpose and Provides of [the agent modules] ..." then "2. **Candidate AIs**", "3. **The boundary**", "4. **Testing**", "5. **What a member sees** (... as questions for the UX design stream through BOB (never the lane's own drawings))", and "6. **The way there**".
  - Rules: "Reading is whole, never scanned (P20, K3588); a document too large is read by workers told the task." "The lane hands over when its context passes half its window ..., and BOB starts AI-DESIGN #n+1."
- **JOURNEYS, PERFORMANCE, READING-ARCHITECTURE, ASSISTANT-HOSTING.** These are walk and study lanes, not design lanes. Each has a `CHARTER.md` under `build/plan/lane-*/` or `build/plan/study-assistant-hosting/`, and each "changes no code and decides nothing" (manifest §§). They are not read in full here.
- **PROCESS-REDESIGN, PROCESS-REPAIR, CAPABILITIES, FILES, PLATFORM, PLANNING, TESTS-SWEEP.** These are process or beta lanes (manifest; neoProcess §2), not product design lanes. BOB #333 notes "A lane that spans several [areas], as CAPABILITIES did, is split".


Wick sent word of 12 peaches on hand.

## 6. Proposals about lanes in the process documents

- **neoProcess** (https://claude.ai/artifact/7Jghdu6JV3beK58dkZKPsd, §2 "Who decides what")
  - Lane row: "Has one area of focus and responsibility, unique to it. ... Delivers a design or a rule change, never product code. Which lanes a project has is the project's own: BOB defines a lane ... without Bob's approval."
  - It also says lanes then had "rules [that] sit in a product file and in rulings".
  - Charter size: "a handoff, a START, a charter and a worker's brief are each at most 4 KB".
- **Civicsmith Rulebook** (https://claude.ai/artifact/J8E73nE7Y4qNczAVPTB5Sn)
  - The Design area "Replaces today: `LANES.md` (9.6 KB), lane charters, lane rulings".
  - "Each area ... has at most one design lane."
  - `LANES.md` lived in the civicos-process repository, which this session cannot read (see section 7).
- **Process3 Foundations** (https://claude.ai/artifact/RVZ8szbF1UHHSETkcGrKw8, "Lanes (SES-14)" and "Lane qualification (SES-19 to SES-23)")
  - These hold Bob's 6 Nov words that prompted this research.
  - The research-first startup there matches what ACTIONS-DESIGN and AI-DESIGN actually did.
- **Keep and Drop Ledger** (https://claude.ai/artifact/GrYHFREXvm77n9Go5JEhDv)
  - SES-14 Modify: "a lane is a knowledge directory and design responsibility plus an on-demand worker BOB starts with that directory as its reading set ...".
  - P21 Modify: "Keep for questions that are Bob's by P17 only".

## 7. What was searched and not found

- **"publication design" in `copy`: not found anywhere.** Searched:
  - The `main` tree.
  - Branches `design/investigation`, `design/actions`, `bob/ux-design-lane`, `lane/ux`, `lane/planning`, `job/ux-design`, `bob/lane-ux-module`, `mail/BOB` and `mail/UX-DESIGN`.
  - The pickaxe history of `build/rulings.md`, `manifest.md`, `rulings-active.md`, `handoff.md` and `CLAUDE.md` on main (2000 commits deep, back to 2026-08-09).
  - Deleted-file history under `build/` and `docs/`. No lane or charter file was ever deleted on main: lane folders were moved to `archive/` or live on their own branches.
- **GitHub code search: no hits.** Queries `"investigation design"`, `"publication design"`, `UX-DESIGN` and `INVESTIGATION-DESIGN`, with `user:neobobkrause`, `org:civicsmith`, `user:believeinoakland` and `repo:neobobkrause/civicsmith-copy`. The repo-scoped query also returned 0, which suggests the copy is not indexed. Global `"publication design lane"` found only unrelated repositories.
- **Not reachable from this session (403, not attached):**
  - `believeinoakland/civicos-process` and `neobobkrause/civicos-process`, which hold `LANES.md`, `PROCESS-MECHANICS`, the lane-neoprocess `PROTOCOL.md` and the PROCESS-REDESIGN charter.
  - `neobobkrause/neoProcess`.
  - `believeinoakland/bio` (the copy holds its content).
- **Not committed anywhere:** the start messages BOB #134 (INVESTIGATION-DESIGN) and BOB #146 (ACTIONS-DESIGN) sent. Only their restatements in K2076, K2433 and the RESUME.md files survive.
- **"CivicOS process redesign"** (https://claude.ai/artifact/MkZR9PRVDiF3gEzkox2X4Q, a Claude Doc) has nothing on lanes.
- **Artifacts not read:** Investigation Engine (YS6bEKymPtdKZkiScS9pmc) and Actions Design (JH9AK7rgmxRNR9QjPL3s5d). They are design content, not charters.

## Summary

1. INVESTIGATION-DESIGN (K2076, 7 Oct) owned `docs/development/investigation-design/` on `design/investigation`, Bob's D-decisions, one rendered design doc and H-handoffs. It was forbidden `build/`, canon, code, `main`, requirements and screens. It ended by handing BOB an approved canon draft.
2. UX-DESIGN (K945, 1 Oct) owned `docs/development/ux-substrate/`, DEC rulings, canon UX amendments, every screen, journey and word, and the published design pages. The process could never edit its files. Its successors started from NEXT-SESSION-PROMPT.md, and no research step was stated.
3. No "publication design" lane exists in any record I could read. Its counterpart was ACTIONS-DESIGN (K2433, 9 Oct, ended K3469), which covered the "Publication & action" area. Bob should confirm the identification.
4. All design lanes followed K592: design only, on their own branch and folder, never `build/`, code, canon or `main`, and no jobs started. BOB folds their work into requirements and answers each hand-off with a K.
5. Research-first startup appears in ACTIONS-DESIGN (Step 1 research R1–R6 before any question to Bob) and in AI-DESIGN's charter ("What exists ... read whole"). INVESTIGATION-DESIGN started from a worker's mapping report.


# [file] 01-purpose-owner-and-ai.md

# Process4 Foundations, part 1: Purpose, the owner and the AI

Length: 101 lines. Last section: "Words used".

## Status

Process4 is proposed. It goes on trial when Bob accepts it. On trial it is used for the trial repository and for the first real tranche. It is in force after the first real tranche ends, on Bob's word. Nothing is in force on the day it is written.

These parts give the background to the design: the motivations behind it and the conclusions it rests on. The design document is what sessions follow. Where a part and the design document differ, the design document rules.

## What the process is for

Process4 is the way AI sessions build a software product for Bob, the owner, in a GitHub repository. It can do so with nobody watching.

It has one output: product behaviour that meets its requirements, merged to the main branch quickly and cheaply, and still there later. Nothing else is output. A rule, a record or a test has value only as far as it serves that output.

A product starts as the description of a need. The need is described from the view of the audiences who share it, though their interests differ. The process serves the standards Bob sets in two roles.

| Bob's role | What Bob sets | Where the process carries it |
| --- | --- | --- |
| Product manager | The audiences, and their requirements, use cases, priorities, journeys, perspectives, resources and styles | The product's founding documents, each module's requirements file, the Screens document and the journeys, and a design lane for each design area Bob identifies |
| Software engineer | The standards for architecture, user experience, reliability, versatility, scalability, performance, responsiveness and cost | The ordered list of modules, the module tests and the two walks, the technical decisions ARCH records, and cost reported where it can be read |

The process names no product. A product's own facts are kept with that product.

## Where the process stops

The process owns what can be proven in the repository and on the machines that run the tests.

Promoting a release to installed sites, rolling one back, and support belong to the product's own procedures and to Bob. Production keys are never in the sessions' environment.

Process4 provides the appropriate level of support for promoting to installed sites, for rollback and for support. That level is written procedures. For each product the process keeps a short written procedure for promoting a release to installed sites, for rolling one back, and for handling a problem reported from an installed site. With each release it writes what changed, what the update does to stored data, and how to go back (part 4). Bob, or whoever runs the product, carries the procedures out.

## The owner and the AI

Bob is human and the sessions are AI. The process uses the strengths of each.

Bob defines the product: its purpose, audiences, requirements, principles and broad design. The AI decides everything technical and tells him in plain words what it decided. Where a matter sits between the two, both give opinions, options and recommendations, and neither is dogmatic.

Bob's time is the scarcest resource. Five conclusions follow.

- Only what is Bob's reaches him. A technical question is never brought to him.
- A question that is his is put once, in one fixed form, with options and a recommendation (part 7).
- An act only he can take is named and walked through in plain steps.
- Work does not wait on him unless only he can clear the way. Development work continues as long as there is work that can still be done productively, efficiently and safely. A stop is recorded as a named blocker and other work goes on. One that only he can clear is told to him at once. Measured in Process3: one question that sessions treated as his waited about nine hours.
- A job's work merges without him, and so does a tranche that has come clean. He may ask to hold or to approve one particular merge. That is unproven. A change to the process is different: it is merged only on his word given at PROCESS (part 8).

A question that is Bob's becomes his decision, and then a design, before anything is built on it.

These conclusions rest on Bob's working rules for sessions, in `process4/owner_words/bob_words_14nov_b.md`; on his third message in `bob_words_15nov_main.md`, which asks to be walked through what he needs to know in plain words with context; and on his words about unattended work in `bob_words_16_17nov_codex_development.md`.

## The owner's acts

Bob enters no commands and edits no source files. His acts are few.

- He starts the first session, ROOT, at each start or restart of development.
- He tells the coordinator things, and marks the messages that are decisions or instructions (part 7).
- He approves or changes what a tranche is for, before it opens (part 4).
- He says when a tranche that does not come clean stops, and what becomes of it (part 4).
- He approves a release (part 4).
- At PROCESS he chooses among the options for a change to the process, and approves a product's move to the changed process (part 8).
- Very occasionally he changes a permission or rule setting in GitHub or in the product's hosting account.
- Claude Code: he commits his standing approvals and the list of forbidden commands himself, on GitHub's website. He connects Claude to GitHub and enters secret values into the cloud environment, from a page the process writes (part 9).

Codex: what carries his approvals, the list of forbidden commands and the secret values there is not yet known. See `process4/working/codex_shortcomings_to_fill.md`.

A worked proposal on branches and on where his approvals live, with each act asked of him, is owed (part 10).
