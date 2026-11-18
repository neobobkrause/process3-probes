# [file] DEVELOPER.md (continued)

4. Tick **Require status checks to pass**, click **Add checks**, type `gate`, and pick the one whose source is **GitHub Actions** (BOB ran the gate once after Step 4, so it is offered). If it is not offered, type `gate` in full, add it, and set its source to **GitHub Actions**, not any source.
5. Click **Create**.

How BOB confirms: `p3 setup check` shows `ruleset-main-tranche` set. The bypass list cannot be read whole by a session, so you confirm it on the onboarding page.

Sets: `ruleset-main-tranche`, `ruleset-bypass`.


# [file] 00-index.md

# Process4 Foundations: index

Length: 31 lines. Last section: "How to read the parts".

These parts are Bob's Foundations, brought up to date with the Process4 design as it stood on 18 Nov 2026. They are the background to the design: the motivations behind it and the conclusions it rests on. Process4 is proposed, and nothing here is in force.

## The parts

| File | Subject | Last section |
| --- | --- | --- |
| `01-purpose-owner-and-ai.md` | What the process is for and where it stops; Bob and the AI; Bob's acts; how problems are handled; the words used | Words used |
| `02-tests.md` | The tests, and why nothing is added to them | The process's own tool |
| `03-modules-jobs-and-the-notice.md` | Modules, requirements, jobs and slots, the mechanical edit, the notice to user modules | What the notice cannot do |
| `04-tranche-rounds-walks-release.md` | The tranche, rounds, partial walks, flaws, the walks' documents, release | Release |
| `05-roles-and-sessions.md` | The roles, helpers, design lanes, refreshing sessions, shared state and messages, the way back | The way back after a full stop |
| `06-reading-in-full-and-documents.md` | Reading in full, the measured maximum, the ranking of a product's governing texts, the two documents, the record of decisions, words that fit either harness and any hosting | Where the work is kept |
| `07-how-bobs-words-become-decisions.md` | Marked words, the front door, how a question is put, what Bob can see, what waits for Bob | What waits for Bob |
| `08-changing-the-process.md` | PROCESS, the rule it works under, Process4 developing itself, what Process4 does not carry | What Process4 does not carry |
| `09-permissions-and-platform.md` | What holds a rule, Bob's approvals, the permission checker, the two kinds of refusal, the platform | The terms and their Claude Code constructs |
| `10-proven-unproven-and-owed.md` | What is measured, what is unproven, what is owed | Owed |

## How to read the parts

- Each part is kept small so that it can be read in full. Each says at its top how many lines it has and what its last section is. A reader that has not reached that section has not read the part.
- The design document is what sessions follow. Where a part and the design document differ, the design document rules.
- Bob's exact words are kept in `process4/owner_words/`. The parts name the file where a motivation rests on his words. They do not copy his words.
- Four words are kept apart: measured, estimated, judged, unproven. Part 10 defines them.
- "Claude Code:" marks a statement that depends on that harness. "Codex:" marks a place where the Codex side is not yet known. The list of those places is `process4/working/codex_shortcomings_to_fill.md`.
- The parts name no hosting provider, except where part 6 says which provider's table is the first. What depends on where a product is hosted is stated in neutral terms.
- "Claude's reading:" marks an interpretation in the design that Bob has not yet confirmed. "Claude decided:" marks a technical matter the AI settled and reported. "Writer's reading:" marks an interpretation made by the Claude worker that wrote these parts. Bob can overrule any of them.
- The parts name no product. A product's own facts belong to that product's conversion plan.


# [file] lane-charters.md (later part)

**What it was forbidden**
- "Write ONLY `docs/development/actions-design/` on `design/actions`. Never `build/`, canon (`docs/architecture/`), product code, `docs/development/ux-substrate/`, or `main`" (RESUME.md).
- "Requirements stay BOB's (P5). Canon changes are approved by Bob and placed by BOB."
- "Screens are owed to the UX design stream; this lane designs behaviour, requirements, capabilities and use cases."
- It minted no K or DEC numbers.

**How it started and qualified (research first)**
- "**Step 1, research: done.** `research/R1`–`R6` (core canon; other canon; rulings incl. UX DECs; the old 2026-09-29/30 action-design lane; the 11 action modules with tests run 2026-10-09 ...; adjacent modules and what a member can do today)".
- Then "**Step 2, map**", "**Step 3, use cases**", "**Step 4, the decisions**" and "**Step 5**" (canon draft and requirements hand-off) (RESUME.md "Where the work stands").
- HANDOFF H1: "It begins step 1, research of canon, rulings, requirements and built modules on actions, including the old-process lane's `docs/development/action-design/`" (HANDOFF.md H1, @ `9185526c7d`).
- H2: "No ruling is asked of Bob yet; his questions come with the use cases (step 3) and the design (step 4)."

**Predecessor: ACTION_DESIGN #1, 29–30 Sept**
- Branch `claude/brave-johnson-5fqmix`, PR #5, folder `docs/development/action-design/`.
- Its rulings are K590, K597, K600 and K608.
- Its hand-off is `build/plan/action-design/HANDOFF.md` on `copy` main: "everything is under `docs/development/action-design/`, nothing in `build/`, product code or canon".

**End**
- K3469 (2026-10-15), Bob: "the ACTIONS-DESIGN lane [isn't] needed any more". Every hand-off was folded (actions H31, K2775–K2780). Its branches were kept as history.

**Why "publication design" probably means this lane**
- No lane, branch, folder or ruling named publication design exists. Searched: every `copy` branch fetched, the mail outboxes, the history of `build/rulings.md`, `build/manifest.md` and CLAUDE.md on main back to 2026-08-09, and the artifacts.
- In BOB #333's product-area table, publication and actions are one area, "Publication & action", which owns the Publication, Case Making (case) and Action v0.2 canon. Its lane is "none". Sources: https://claude.ai/artifact/J8E73nE7Y4qNczAVPTB5Sn §"Ten product areas"; https://claude.ai/artifact/FXfQapxoZFhKbJ4c3UzX3E §1.
- The same table's Investigation row has the lane INVESTIGATION-DESIGN.

## 5. Other lanes the old records define (briefly)

- **AI-DESIGN** (K3718; `build/plan/lane-ai-design/CHARTER.md`, `copy` main).
  - Charter: "The lane studies and recommends; it changes no product code and decides nothing."
  - It writes only its folder on the tranche branch and reports `A<n>` in `HANDOFF.md`.
  - Startup is a research order: "1. **What exists.** ... read whole the canon ..., the Purpose and Provides of [the agent modules] ..." then "2. **Candidate AIs**", "3. **The boundary**", "4. **Testing**", "5. **What a member sees** (... as questions for the UX design stream through BOB (never the lane's own drawings))", and "6. **The way there**".
  - Rules: "Reading is whole, never scanned (P20, K3588); a document too large is read by workers told the task." "The lane hands over when its context passes half its window ..., and BOB starts AI-DESIGN #n+1."
- **JOURNEYS, PERFORMANCE, READING-ARCHITECTURE, ASSISTANT-HOSTING.** These are walk and study lanes, not design lanes. Each has a `CHARTER.md` under `build/plan/lane-*/` or `build/plan/study-assistant-hosting/`, and each "changes no code and decides nothing" (manifest §§). They are not read in full here.
- **PROCESS-REDESIGN, PROCESS-REPAIR, CAPABILITIES, FILES, PLATFORM, PLANNING, TESTS-SWEEP.** These are process or beta lanes (manifest; neoProcess §2), not product design lanes. BOB #333 notes "A lane that spans several [areas], as CAPABILITIES did, is split".

## 6. Proposals about lanes in the process documents


4 salmon were logged at the Lund gate.

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
