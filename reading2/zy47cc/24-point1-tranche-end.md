| R:183 | Finding 14(b): "sessions" became "So sessions run both" |
| R:217 | "Nothing the model says is evidence" against walks whose steps sessions write and count |
| R:229, 230, 234 | Additions 3, 4, 8: walk "at any time on your word"; "Only your word ends a tranche that will not come clean"; walks shared "by journey" |
| R:241, R:301 | The extra condition in "without flaws" is not an addition: he was asked (proposal 10) and answered "agreed" |
| R:255-258, 261 | Conflicts 7, 8, 9, 10, 13 with his typed words of 14 Nov |
| R:275 | Attribution fault 4: "Checked by Claude" |
| R:319 | Map row: "Stated but unproven" |

### The map file (`N`)

N:14 (item 1 = F5, F6, F10; C1, C3; R3); N:30 (map row); N:48-49 (questions 1, 2 sources); N:60 (question 13); N:72-73 (attribution cautions on the approvals sentence and the folder note); N:84; N:111, N:113 (trials; section 6); N:136 (the audits disagree on the journey count, 32 against 29, not re-counted); N:148 (could not settle the date and first author of the approvals sentence).

---

## 2. The facts, verified against the product repository

### 2.1 What is in `docs/development/ux-substrate/`

**On main (tip `0dea5a6e`, Bob's commit of 1 Nov 2026 14:24 -0800). (V)** `find docs/development/ux-substrate -type f | wc -l` = 133. Top level: `README.md`, `HANDOFF.md`, `NEXT-SESSION-PROMPT.md`, `T50-requirements-gaps-2026-10-17.md`, `journeys.html` (122,774 bytes), `layouts.html` (1,501,953), `ux-substrate.html` (857,474), `ux-substrate.json`, `ux-substrate-v2.json`, `ux-experience.json`, `build_ux.py`, `build_ux2.py`, eight more `.html` pages, and directories `archive/` (19 files), `marks/` (1), `oq-research/` (3), `screens/` (58), `views/` (4), `visual-language/` (28).

**On the tranche branch (tip `e7ec72e`). (V)** `git ls-tree -r --name-only HEAD docs/development/ux-substrate | wc -l` = 90: `README.md` (2,184 bytes), `layouts.html` (1,551,051 bytes), `marks/` (1), `screens/` (61), `visual-language/` (26). No `journeys.html`, no `ux-substrate*.json`, no `ux-experience.json`, no `build_ux*.py`, no `ux-substrate.html`.

**The difference. (V)** Main's tip is an ancestor of the tranche tip (`git merge-base --is-ancestor`); the tranche is 7,354 commits ahead; 111 of them touch the folder; `git diff --name-status 0dea5a6e HEAD -- <folder>`: 49 deleted, 6 added, 34 modified.

**Other branches. (V)** (`git ls-remote --heads origin`: 1,177 branches; depth-1 fetches.) `lane/ux` (8 Nov): folder identical to the tranche (same tree `a54d6209`). `lane/journeys` (28 Oct): identical to main (tree `59d8e122`). `job/ux-design`, `bob/lane-ux-module`, `bob/ux-design-lane`, `claude/ux-dec491`, `lane/ux-ai-use-r13-built`: 133 to 138 files, each still with `journeys.html`. `ux-study` (24 Sep): no such folder.

### 2.2 What the README says

**Tranche branch README, complete first paragraph (V, `git show HEAD:docs/development/ux-substrate/README.md`, line 3):**

> "This folder holds only what the product's build and checks read (Bob, 5 Nov 2026). The design documents are claude.ai artifacts, kept by the ux lane and recorded with `p3 lane artifact ux`. Their earlier repository copies, the old handoff notes and the archive are in git history, before the commit that removed them."

Line 8: "`layouts.html`: the design mock, built by `screens/build_page.py`. `bio-plane/src/journey-check/design.mjs` reads it from git at the interface's `ASSETS_COMMIT`." Lines 15-25: a table of nine claude.ai links, among them "Journeys | https://claude.ai/artifact/9hNPVCMcT8eyewWqKXfgSu" and "Screens | https://claude.ai/artifact/MjC8pWKDj5PrYwm417GLAV". This README was written by a session (commit `dea48973e`, 6 Nov); "(Bob, 5 Nov 2026)" is the session citing him, not his typed words.

**Main branch README (V, working tree).** It describes the files as being in the folder: "`journeys.html`: step 3 of the design phase, SETTLED 2026-10-06 (DEC-128 to DEC-137) ... twenty-seven journeys ... Folded into the screens page on 13 October (DEC-204) and no longer updated"; "`layouts.html`: step 5 of the design phase ... Built by `screens/build_page.py`. Published at https://claude.ai/artifact/4FjPjGmCVppDnMYfM7xkCw, Bob's working page (DEC-204); since 13 October it also holds step 3's journeys material."; "`build_ux2.py`: renders both into `ux-substrate.html`"; "`ux-substrate.json`, `build_ux.py`: the first inventory and its renderer, kept for reference."

### 2.3 Is there a "UX Screens document" or "UX journeys" a walk could be measured against, and in what form

| Thing | Where | Form | Made by | State (V unless marked) |
| --- | --- | --- | --- | --- |
| `layouts.html`, `<title>Civicsmith Screens</title>` | main and tranche | Human page with live mock screens; its section 3 is "Journeys and wizards, walked" | **Generated** by `screens/build_page.py` from `screens/page.src.html`, `registry.json`, `library.json`, six `mock-*.js` files (among them `mock-journeys.js`) and the visual-language CSS | Tranche copy last committed 28 Oct (`9b799bb7e`); main's copy 27 Oct (blobs differ). Product decision BD-5 (BOB, 6 Nov; product `DECISIONS.md` on the tranche, line 56): the file is 1.55 MB, over a 1 MB cap, "so no commit can rewrite it; it is frozen at 28 Oct"; decision: build it, do not commit it |
| `screens/page.src.html` and the mock scripts | main and tranche | The Screens page's source (HTML and JavaScript) | Hand-kept by sessions | Tranche: last changed 8 Nov (`8cf8324e3`); `page.src.html` changed 4 times in November |
| The claude.ai "Screens" page | claude.ai (link in the tranche README; registered in `lanes/artifacts.jsonl` on the product's state branch, 6 Nov 05:04Z) | Human page | The same build, published by a session | Read by me with the Artifact tool: title "Civicsmith Screens"; "Version: built from tranche 8cf8324e3f on 2026-11-08, through DEC-504"; its embedded script has 32 journey entries (`grep` of the saved page source). The folder has one later commit (`fc5359cc2`, DEC-505) |
| `journeys.html`, `<title>Civicsmith Journeys</title>` | **main only** | Human page: "4. Twenty-seven journeys", "5. Seventeen wizards" | Hand-kept HTML; no generator found (`grep -rl 'journeys\.html'` finds only documents and a comment) | Last changed 13 Oct (`8bf4830c2`, "DEC-204 (Bob's direction): the journeys page folded into Civicsmith Screens"); carries the banner "Folded into Civicsmith Screens on 13 October 2026." Removed from the tranche on 6 Nov |
| The claude.ai "Journeys" page | claude.ai | Human page | Published by a session | Read by me: "Civicsmith Journeys", "SETTLED by Bob, 6 October 2026", 27 journeys. `diff` against main's `journeys.html`: it is an **older** copy; it lacks the 13 Oct "Folded into" banner |
| `screens/mock-journeys.js` | main and tranche, **identical** (blob `9fddec18`) | Script data: `const J = [...]`, each entry a numbered journey with a title, who, and either a wizard name or steps naming a screen, an act and a sentence ("say (what happens, in Bob's words)", file header) | Hand-kept by sessions | **32 entries**, n = 1 to 32; 14 point to a wizard, 18 list their own steps (139 steps); last changed 27 Oct (`eec58f486`); not touched in November |
| `screens/registry.json` | main and tranche | Machine data, "GENERATED by check_library.py from registry.src.py (DEC-139)" | Generated from `registry.src.py` | Tranche: 91 screens, 679 acts: 462 "declared", 82 "function", 135 "owed". Main: 91 screens, 662 acts (459 / 82 / 121). The file's own note defines "owed" as "a ruling owes it"; `build_page.py` prints it as "owed by your earlier rulings" |
| `screens/library.json` | main and tranche | Machine data: 23 wizard scripts with steps (screen, act, what, why) | Generated from `library.src.py` | Last changed 25 Oct |
| `ux-substrate.json`, `ux-substrate-v2.json`, `ux-experience.json` | **main only** | Machine data: an inventory of constructs, acts, roles, audiences, use cases, "step-by-step experience", screen rules, open questions | Hand-kept data; `build_ux2.py` renders the last two into `ux-substrate.html` ("Civicsmith UX Substrate"); `build_ux.py` is the first renderer and reads from a scratchpad path that no longer exists | A third design document ("The UX substrate"), not the Screens or Journeys documents |

What Process3's walker in fact read **(V, `bio-plane/src/journey-check/design.mjs` and `run.mjs` headers on the tranche):** the frozen `layouts.html` "as committed at the interface's `ASSETS_COMMIT` (read from git ...)", compared screen by screen with the live page; and the registry's screens. The local arm "walks journey 28 from the installer through the hand-over into the copy and on, then journey 3, then sweeps the registry's screens"; the live arm "signs in to a named test instance as its administrator and as a member ... and sweeps every working screen beside the design mock".

### 2.4 Who changed the folder

**(V)** `git log HEAD -- docs/development/ux-substrate` on the 500-deep clone (2 Oct to 9 Nov): 892 commits.

| Period | Author name | With a `Claude-Session:` trailer | Without |
| --- | --- | --- | --- |
| 1 to 9 Nov (63 commits) | Claude `<noreply@anthropic.com>` | 57 | 4 |
| | BOB `<noreply@anthropic.com>` (the architecture session) | 1 | 0 |
| | believeinoakland (the sessions' GitHub account, a merge commit made through GitHub) | 0 | 1 |
| 2 to 31 Oct (829 commits) | Claude | 792 | 24 |
| | UX design session `<neodall-e2@neologic.com>` | 13 | 0 |

Commits to the folder authored by the owner's identity (`Bob Krause <neogithub@neologic.com>`, 43 commits in the whole fetched history, all through GitHub's website): **0**. That `believeinoakland` is the sessions' second account is (A): `evidence/permissions_inventory.md:297`, `evidence/product_side.md:236`.

Of the 63 November commits most change the word files (76 file-touches under `screens/words*`); the journeys script was not touched; the registry twice. Many commit titles cite a ruling or direction of Bob's (for example `8bf4830c2` "DEC-204 (Bob's direction)", `d129fe129` "to Bob's BD-18") **(V, titles only; I did not check the rulings).**

The removal **(V):** `dea48973e` (6 Nov 05:11Z, "ux: keep only what the build reads in the ux-substrate folder", 49 files, 40,887 deletions), reverted by `429f06210` (05:12Z, "BOB holds it for later"), re-applied by `ef9a2c7fd` (05:14Z). All three carry the same session trailer.

### 2.5 The approvals sentence

**(V)** Product `CLAUDE.md` on the tranche, line 11: "Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product's principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed."

`git log -S'Their design documents are claude.ai artifacts' -- CLAUDE.md`: one commit, `2a14a3eb8`, author Bob Krause, committer GitHub, 5 Nov 2026 10:23 -0800, "Revise standing approvals and design lane details". Main's `CLAUDE.md` (1 Nov) has no such paragraph. Git does not show who drafted the text.

A related session record of Bob **(V, product `DECISIONS.md` on the tranche, BD-4, line 51-54; a session's record, not his typed words):** "Bob, 6 Nov ~18:05Z, through the coordinator: 'agreed'. Decision: Bob keeps the product's UX direction, its audiences and its principles. Beneath them, the ux lane decides design and wording: screens, flows, words, layout and visual language. It records each decision in its design artifact".

### 2.6 Where the auditors' statement is wrong, stale or partly right

