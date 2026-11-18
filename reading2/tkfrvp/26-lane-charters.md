# Lane charters in earlier Civicsmith process versions

Research notes for SES-23 (Foundations, "Lane qualification", Bob's words of 6 Nov: "The lane charters used in earlier process versions included an investigation design lane and a publication design lane"). What each earlier design lane owned, what it was forbidden, how it started, and how it related to the others. Read-only research, 6 Nov 2026.

Sources are abbreviated as follows:
- `copy` = neobobkrause/civicsmith-copy. Branch heads read: `main` @ `0dea5a6efd`, `design/investigation` @ `87134cce53`, `design/actions` @ `9185526c7d`, `lane/ux` @ `4f21de194b`. Before it was named Civicsmith (DEC-124) this was believeinoakland/bio.
- `K<n>` = a line in `build/rulings.md` on `copy` main @ `0dea5a6efd`.
- Artifacts are cited by URL.

**Main finding.** No earlier charter, lane, branch or ruling names a "publication design" lane. The lane that sat beside INVESTIGATION-DESIGN was **ACTIONS-DESIGN** (and before it ACTION_DESIGN #1). Its product area is "Publication & action" in BOB #333's area table, and that table lists the area's lane as "none". Bob's "publication design" most likely means this actions lane. That is an inference, and Bob should confirm it. Details are in section 4.

Neither of the two design lanes had a file called `CHARTER.md`. Each was chartered by a K ruling and by BOB's start message, and that message was never committed. Its rules were restated in the lane's own `RESUME.md`. `CHARTER.md` files exist only for the later study lanes (AI-DESIGN, JOURNEYS, PERFORMANCE, READING-ARCHITECTURE, ASSISTANT-HOSTING).

## 1. The common pattern: design sessions (K592, K945)

- **K592 (2026-09-30), the first general rule for design lanes.** It was made when ACTION_DESIGN #1 ran. Quote: "A design session (ACTION-DESIGN #1 and any like it) works with Bob on design only: rulings, requirement drafts, UX paths and views, on its own branch under `docs/development/<its area>/`. It never writes `build/`, product code, canon or `main`, never merges its branch, and starts no jobs or sessions. It hands BOB its drafts; BOB records Bob's rulings, folds the drafts into the build state at a tranche boundary". Bob's words that prompted it: "make sure that this session only does design; you manage action development as you do all other development, in tranches with layers".
- **K945 (2026-10-01), the UX design stream.** Every later design lane was modelled on it, by K2076 and then K2433.
- **Later lanes register** (`build/rulings-active.md`:39, `copy` main). Quote: "Lanes (...): UX-DESIGN (its charter includes dashboard-style entry points per area, K3053), PROCESS-REDESIGN (...), INVESTIGATION-DESIGN (each hand-off folded into requirements, answered with a K; K2076), AI-DESIGN, JOURNEYS, PERFORMANCE (K4351); BOB reads each `HANDOFF.md` at takeover and each backstop, each defect an entry (K3551); lanes change no code."

## 2. INVESTIGATION-DESIGN (investigation design lane)

**Charter.**
- K2076 (2026-10-07), Bob's direction, and `build/manifest.md` §"Parallel work: the investigation design lane" (`copy` main).
- Bob's words: "Does it make sense to spawn a separate lane for working through the design of the investigation engine and those things around it? If so, please do so."
- BOB's reason for agreeing: the design is a long dialogue with Bob, and held in BOB's session it "would grow the context every T36 turn re-reads, P13".

**What it owned**
- The design of "the investigation engine and the project as an investigation (K1627, K2064, K2075)" (manifest §).
- Its folder: "writing only `docs/development/investigation-design/`" on branch `design/investigation`, cut from `main` @ `0ced0143a8` (K2076).
- Bob's decisions, numbered as D-numbers: "Bob's decisions are D-numbers (D1–D24 kept, D25 on), never K or DEC" (K2076). They are recorded in `DECISIONS.md` (D1–D66 by the end, per `build/plan/archive/drafts/draft-T41-investigation.md`).
- One working design document, rendered for Bob. In H3, Bob asked for one document "that we can use to carry the research, questions, and design forward". The lane produced `investigation-design.html`, https://claude.ai/artifact/QjSSFHE78G9PtwKhpW5ZEo (HANDOFF.md H3, `design/investigation` @ `87134cce53`). An earlier page 1 is at https://claude.ai/artifact/EZoYvGdvkX2F6jNogG9vNP, and the study S1 at https://claude.ai/artifact/6cHHcybJpV3SPf25wVmeLN.
- Hand-offs: "it hands off through `HANDOFF.md` (`H<n>`), which BOB reads at takeover and every backstop check and answers with a K" (K2076). It wrote H1–H43.
- The canon draft. The design was approved by Bob on 2026-10-09 (K2417) and placed by BOB as `docs/architecture/BIO_Investigation_v0_1.md` (K2419–K2421; RESUME.md @ `87134cce53`).

**What it was forbidden**
- "never `build/`, canon, product code or `main`" (K2076).
- Requirements were not its own: "requirements stay BOB's (P5, N748)" (K2076).
- Screens were not its own: "screens owed to the UX stream" (K2076).
- It minted no K or DEC numbers.
- K2076 adds: "No mechanics change: like the UX stream it runs beside the process, not in it".

**How it started and qualified**
- "Its first act joins the open D-decisions with K2075's plan construct on one rendered page; BOB forwards it the mapping worker's report" (K2076).
- That mapping report was `build/plan/archive/drafts/study-K2075-mapping.md`, "a worker's report for BOB #134, ... read-only research; for INVESTIGATION-DESIGN #1".
- It also inherited the earlier study branch `study/investigation` (`synthesis/architecture.md`; K2064).
- The brief itself was "BOB #134's start message (design lane, K2076)" (RESUME.md first version @ `cd0c00daa6`). That message is not in the repository.

**Succession and end**
- #1 asked for a successor at half its context. #2 was started "told to follow its `RESUME.md`" (K2398).
- Final state: "**Complete.** ... The canon document is the source of truth. This folder ... is the history of how it was reached. A future session starts here only if Bob asks for more design work on investigations" (RESUME.md @ `87134cce53`).

**Bob's standing direction to the lane** (RESUME.md @ `cd0c00daa6`)
- "Always provide proper and sufficient context when posting questions".
- "Think each point through against what makes sense for members doing an investigation in Civicsmith, not only against what requirements currently say".
- The lane's own details are "marked 'detail' ... reported, not asked".

**Relation to other lanes**
- Screens and names went to UX-DESIGN by NOTICE, for example H1's "Owed to the UX stream" and N821.
- Bob's D43 in this lane ("support members through the action plan", "Not today") created the actions lane: K2382, N817, then K2433.

## 3. UX-DESIGN (the UX design stream; later the "ux" lane)

**Charter.**
- K945 (2026-10-01), Bob's.
- `build/manifest.md` §"Parallel work: the UX design stream" (`copy` main).
- `docs/development/ux-substrate/README.md` and `HANDOFF.md` §1–§7 (`copy` main @ `0dea5a6efd`). §1–§7 of HANDOFF.md serve as its standing charter: "section 0 is the state as handed over, sections 1 to 7 your role" (NEXT-SESSION-PROMPT.md).

**What it owned**
- "It writes `docs/development/ux-substrate/`, mints **DEC** ids (DEC-96 onward) for Bob's UX rulings, and amends canon documents under `docs/architecture/`" (manifest §).
- It recorded rulings in `docs/development/DECISIONS.md` (README.md "Working alongside").
- Every screen, journey and word: the design-phase pages (principles, brand and voice, journeys, visual language, layouts and screens, dashboards, measures map) and the words tables (README.md list; HANDOFF.md §5 table of pages with artifact URLs).
- Main artifacts:
  - Screens: https://claude.ai/artifact/MjC8pWKDj5PrYwm417GLAV
  - UX Substrate: https://claude.ai/artifact/JsPZAftab91EL9Ut91qWGx
  - Design Principles: https://claude.ai/artifact/MvsMPnJnk3o32FBeqgdxT1
- Detail beneath Bob's UX rulings: "Detail beneath his UX rulings ('Design's') is yours: decide it, record it, report it as done" (HANDOFF.md §2).
- Scope widened over time:
  - K3053: "The front door certainly needs to be included in the UX design, as does the installer" (rulings-active: "its charter includes dashboard-style entry points per area").
  - K3460 (2026-10-15), Bob: "pass UX design issues over to that lane so that you can stay focused". UX findings (layout, wording, flow, look) go to UX-DESIGN as HANDOFFs, and BOB keeps what is broken.

**What it was forbidden**
- "you never start, message or steer its sessions" (the development process's sessions; HANDOFF.md §1).
- "Never write `build/`" (§1).
- No force-push, no rewriting `main`, and Cloudflare account `20b533579290b9b93168345edd3b7f72` only (§1).
- K numbers are BOB's alone, and a ruling Bob made through BOB is cited, never re-ruled (README.md, recording rules 1–3).
- The protection runs the other way too. The process "never edits, reverts or re-words `docs/development/ux-substrate/` or that stream's canon amendments, and a merge conflict with them is resolved by keeping its text" (manifest §; K945).

**How it ran**
- It ran on Bob's primary account, outside the process, through the cross-account channel (`build/channels.md`: `UX-DESIGN`, outbox `mail/UX-DESIGN`, entries `U<n>`).
- PRs from `claude/gallant-brown-zg0wc1` were merged by BOB at a tranche close after a MERGE entry (HANDOFF.md §1).
- Successions:
  - Each successor started from `NEXT-SESSION-PROMPT.md`.
  - K5295: "A refresh of this lane is BOB's from now on, never brought to Bob".
  - The successor archives its predecessor "so only one session answers Bob's comments" (HANDOFF.md preamble).
- **No research or qualification step is stated** for this lane's start. Takeover is a reading list (CLAUDE.md, HANDOFF.md whole, then what is new on the channel; NEXT-SESSION-PROMPT.md).

**Current form** (not an old charter; for comparison)
- `process/config.json` on `lane/ux` @ `4f21de194b` lists the lane `{"name":"ux","dir":"docs/development/ux-substrate/"}`.
- `CLAUDE.md` there (5 Nov): "Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product's principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files."

## 4. ACTIONS-DESIGN (actions design lane). Probably what Bob calls "publication design".

**Charter.**
- K2433 (2026-10-09), Bob's direction. Bob: "We now need to dive every bit as deeply into the requirements, current capabilities, additional capabilities needed, design, and use cases of Actions. Given that this is likely to be a significant scope of work, I suggest that this work be done in a separate channel."
- Rules restated in `docs/development/actions-design/RESUME.md` §"Rules of the lane" (`design/actions` @ `9185526c7d`).

**What it owned**
- "modelled on the investigation lane (K2076): it writes only `docs/development/actions-design/` on its branch" (`design/actions`, from `main` @ `8af83ac942`).
- Bob's decisions as "Actions D<n>".
- Hand-offs as `HANDOFF.md` `H<n>`, "read by BOB at takeover and each backstop check and answered with a K" (K2433).
- Purpose: "The lane researches, maps, and designs how Civicsmith supports members through the action plan, and ends with a canon draft and a hand-off to BOB for requirements" (RESUME.md).
- Outputs:
  - Research R1–R6.
  - Twenty use cases U1–U20.
  - The synthesis S1.
  - D1–D24.
  - `DESIGN.md`.
  - The canon draft `BIO_Action_v0_2.md`.
  - `REQUIREMENTS-HANDOFF.md` (H31).
- Pages:
  - https://claude.ai/artifact/JH9AK7rgmxRNR9QjPL3s5d (Actions Design)
  - https://claude.ai/artifact/8Ke3MafpR8R4knFDtiMEWx (Action Canon Draft)
  - Earlier: https://claude.ai/artifact/3LPhoZ6geoYBnt7XvDqUM8
- Publication was in scope where actions touch it. The signing view and the "case-authoring or publication" modules received Actions D13 (N880, `mail/BOB.md`:1261). Publication §3 rule 15(d) was flagged stale in H2.

