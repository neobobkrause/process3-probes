| `build/lane-seed-jobsync` | PR 202, 6 Nov 10:30 -0800 (18:30Z) | `bdafadf` "lane start seeds a new lane's folder"; `00e7980` "Lane modules have their entry" |
| `build/lane-checks` | PR 203, 6 Nov 10:41 -0800 (18:41Z) | `b69b5f1` "Lanes declare checks; the gate runs them on a lane-only pull request" |
| (no lane branch) | PR 205, 6 Nov ~20:27Z | lane cap 1 (`33662bf`); removed 7 Nov (`4e3369d`) |
| later touches | 7 to 9 Nov | permission-prompt reporting for a stuck lane session (C15, `9deafc5`); shell quoting of printed `lane ask` commands (`1c845ae`); the product subtree move (`7068b38`); pacing and receipt removals (`421fb81`, `b0c3783`) |

`build/layer-*` (12 branches, 3 to 8 Nov; (V) last own commit and merge commit of each): these built the layer branch, not lanes. `layer-close` (PR 48, 3 Nov), `layer-close-builds-generated` (PR 84, 3 Nov), `layer-branch` (PR 183, 5 Nov, the shared layer branch), `layer-ledger-holds` (PR 190), `layer-mode-messages` (PR 191), `layer-retest` (PR 193), `layer-order` (PR 196), `layer-sync` (PR 198), `layer-defer-done` (PR 201), all 6 Nov; `layer-prestart` (PR 223, 6 Nov); `layer-cover-lands` (PR 252, 7 Nov); `layer-join` (no merge commit found under that name). The only lane link among them: `layer-mode-messages`' last commit says the census judges the layer map "only for modules that still need a job, never a lane's".

So the lane machinery went from nothing to its final shape in three days (4 to 6 Nov), in six builds, each prompted by words the code attributes to Bob or by a coordinator ruling (J from the commit subjects and code comments above).

## 3. The product's lanes

(V) COPY `origin/tranche:process/config.json:27-41` (tip `e7ec72e09`, 9 Nov 10:59 -0800):

```json
"lanes": [
  { "name": "ux", "dir": "docs/development/ux-substrate/", "module": "ux-design" },
  { "name": "investigation", "dir": "docs/development/investigation-design/" },
  { "name": "publication", "dir": "docs/development/publication-design/" }
]
```

| Lane | Kind | Folder (files at tip) | Research folder (files; qualified) | Module | Artifact links recorded |
|---|---|---|---|---|---|
| ux | design | `docs/development/ux-substrate/` (90) | `docs/development/ux-substrate-research/` (11; `qualification-2026-11-06.md`) | `ux-design` | 13 live (15 rows: one link recorded twice, one placeholder dropped) |
| investigation | design | `docs/development/investigation-design/` (1, the README) | `docs/development/investigation-design-research/` (11; `qualification-2026-11-07.md`) | none | 4 |
| publication | design | `docs/development/publication-design/` (3) | `docs/development/publication-design-research/` (15 listed; `qualification-2026-11-06.md`) | none | 0 |

All (V): `git ls-tree -r origin/tranche docs/development/<dir>/`, and `lanes/artifacts.jsonl` on COPY `origin/process-state`.

- (V) No triage lane is configured in the product, and no lane has `checks` or an explicit `research`.
- (V) How the lanes got there: PR 515 `bob/ux-design-lane` (5 Nov 17:06Z; commit body: "Coordinator 15:31 (on Bob's word 15:36) ... the lane adds module entries for words already in the stream, fixes generators ...; it changes no wording and makes no design decision until Bob widens that approval"); PR 629 `bob/lane-ux-module` (6 Nov 12:59Z: "config: lane ux names its module ux-design, so a lane-only PR lands as the lane's change ... with no module named, ux-design's own entry made every lane-folder file a module file and refused PR 620's lane-only route"); PR 667 `bob/lanes-investigation-publication` (6 Nov 17:29Z, "lanes: investigation and publication beside ux (BD-2)"); PR 674 `bob/lanes-drop-module` (6 Nov 18:00Z, "investigation and publication carry no module (BD-2 amended)").

### How the top-level directories map to modules and lanes

(V) COPY `origin/tranche:build/modules.json`: 220 modules, layers 1 to 11 (39, 10, 12, 9, 21, 27, 3, 20, 13, 4, 62). By the first path part of each module's `paths`:

| Top-level directory | Modules | Lane |
|---|---|---|
| `bio-plane` | 164 | none |
| `build` | 18 (requirement-only or build-file modules) | none |
| `pdf-worker` | 4 | none |
| `agent-worker`, `newgroup` | 2 each | none |
| `agent-harness`, `agent-model`, `agent-runner`, `agent-steps`, `ai-gate`, `budget-doctypes`, `court-citations`, `court-doctypes`, `docprofile`, `doctypes`, `file-scanner`, `jurisdictions`, `legistar-reader`, `ocr-worker`, `reader-container`, `roster-reader`, `sheet-worker`, `site`, `site-profiles`, `stewards` | 1 each | none |
| `docs` | 1 (`ux-design`, layer 11: `docs/development/ux-substrate/`, `docs/requirements-notes/ux-design.md`) | **ux** owns `docs/development/ux-substrate/`; investigation and publication own their two folders each under `docs/development/` |
| `release`, `requirements`, `docs/` otherwise, `.claude`, `.github` | 0: listed under `not_product` | none |
| `ai-issuer` | 0 (in no module's paths and not in `not_product`) | none |

So no lane maps to a product code directory. Every lane lives under `docs/development/`. Lanes and modules are different axes: 220 modules own the code; 3 lanes own design folders. They cross at exactly one place: the ux folder, which is at once the ux lane's folder, the `ux-design` module's path, listed under `not_product` (`docs/`), and a build input (its generators build `words.json`, `words-drawn.json`, `words-reads.json`, which are `generated` rows that `bio-plane/src/setup-words/build.mjs --check` verifies; config `generated`, and COPY `docs/development/ux-substrate/README.md:7`: "Many `bio-plane` modules read the words and the registry"). (A) `audit2_feasibility.md:86` noted the same double ownership.

## 4. The state record

- (V) **P3's own `origin/process-state` holds no lane record**: `git ls-tree -r --name-only origin/process-state` lists 17 files, all under `github/`.
- (V) The lane records are on the **product's** state branch, COPY `origin/process-state` (tip `c4c252913`, 9 Nov 19:05:44Z; 8,937 files): `lanes/sessions.jsonl` (12 rows), `lanes/artifacts.jsonl` (20 rows), `lanes/asks.jsonl` (10 rows). I fetched the tip only; the files are append-only by the tool, so they hold the run's rows.

### Seats (`lanes/sessions.jsonl`, all 12 rows read)

| Lane | Seat started | Session recorded | Ended | Lasted | Why ended (row text) |
|---|---|---|---|---|---|
| ux | 6 Nov 05:00:45 | `…QtKAXA1KeiQQ7ZXT` | 6 Nov 05:55:28 | 55 min | "one row (act.guideoptout.does) landed via ux-design PR 622; layer 6 closed; product pauses for the pin move ..." |
| ux | 6 Nov 12:36:55 | `…gGVTFfgSVQhaPL5H` | 6 Nov 13:00:28 | 24 min | "620 landed (d04f00be); no ux work for layers 7-8 modules; coordinator: stop an idle lane until there is work" |
| investigation | 6 Nov 17:32:19 | `…AwJP5DnnQjPq4JTZ` | never | to the end of the record | |
| publication | 6 Nov 17:34:45 | `…VeBq3c6BYSyTV3Ph` | never | to the end of the record | |
| ux | 6 Nov 17:36:16 | `…JXoCL3spfVV8dnjK` | never | to the end of the record | |

Counts (V): lanes recorded 3; lane sessions over the run 5 (ux 3, investigation 1, publication 1); seats replaced with `--replace` 0 (no row has `replaces`); seats ended by the tool 0 (no row has `by`); seats ended by hand 2. No `process-triage` row. What I cannot see: the account's session list, so sessions started by hand without a seat are not counted here (the code comment in 1.4 says three ux sessions ran at once on 5 Nov, before seats existed).

(V) The account "switch out" of 7 Nov 05:32Z listed the three seats and one open ask (`switch/manifest.json`: `lanes` 3, `asks` 1). No `switch/retired.json` exists at the tip, and the same ux session recorded a decision on 8 Nov, so the seats were not ended by a switch in the record.

### Asks (`lanes/asks.jsonl`, all 10 rows read: 5 asks, 5 decisions)

| Asked | Lane | Answered by | Open for | Cost recorded |
|---|---|---|---|---|
| 4 Nov 03:39:22 | ux (site R18 button) | read-only worker `aeb0a131…` | 70 s | $0.3 |
| 4 Nov 10:04:50 | ux (screens-wizards R23 words) | read-only worker `a8cd6d51…` | 88 s | $0.2 |
| 6 Nov 17:51:02 | publication (Ratification F1) | the lane's session | 7 min 23 s | none |
| 6 Nov 18:05:40 | publication (F1 part 2) | the lane's session | 26 min 29 s | none |
| 6 Nov 18:01:26 | ux (screens and words for the edition's docket entry) | the lane's session | 40 h 22 min (to 8 Nov 10:23:16) | none |

Zero asks to investigation. No cost was recorded for any answer by a lane session, so the Foundations' measurement "Tokens per lane question" (`T:governing/foundations.md:288`) was not produced for long-lived lanes (V for the rows; J for the consequence).

### Lane work that reached the tranche

(V) COPY, `git log --first-parent origin/tranche` (fetched since 1 Nov, 714 first-parent commits): **51 merges named `lane/...` into the tranche**, all 6 to 8 Nov (18, 29, 4 per day by -0800 date): ux 29, investigation 11, publication 11. In the same three days the tranche took 185 first-parent merges (bob 71, lane 51, p3 pin moves 36, found 16, layers 3, others), so lanes were 28% of them. None of the 51 ran a suite if it stayed inside the lane's folders (by the path in 1.6; I did not read each one's gate row).

(V) COPY has 33 `lane/*` branches (`git ls-remote`). By tip date: 8 are earlier processes' lanes, last touched 23 to 29 Oct (reading-architecture, tests-sweep, planning, journeys, ai-design, capabilities, files, platform); 25 are Process3's (ux 20, investigation 2, publication 3). Sixteen of the ux ones have tips between 16:36Z and 17:25Z on 5 Nov.

## 5. What went right and wrong with lanes, measured where possible

### Wrong

1. **Three ux sessions at once on 5 Nov, unseen by the tool.** (V) the claim is in the code, `T:tool/lib/lane.mjs:214-215`. (V) consistent with the product's history: 16 `lane/ux-*` branches tipped within 49 minutes on 5 Nov; then the `ux-design` job's commits read "carried from lane PR 525 ... 530, 532, 533, 534, 535, 536, 539" (COPY tranche history, 5 Nov 19:53 to 19:57Z). The lane's first-day output was redone through a module job rather than merged as it stood. (J) This is the one clear case of lane work and job work colliding.
2. **A lane change that broke a build merged with nothing run.** (V) code comment `T:tool/lib/util.mjs:609`: "a broken words build landed green, ux lane Q7". (A) `change_sample.md:124` (row 203) classes the cause "a: product defect" and the fix "Kept. Present, untouched; opt-in". (V) The fix was never used: the product's lanes declare no `checks`.
3. **A lane's folder was also a module's.** (V) PR 629's commit body (section 3): with no module named, every file in the ux folder counted as the `ux-design` module's and the lane-only route was refused for PR 620. The cure was a config line naming the module. The two later lanes were then given no module (PR 674).
4. **A lane session stuck on a permission prompt.** (V) code comments `T:tool/lib/status.mjs:242` ("the investigation lane sat ~2 h waiting on a permission prompt") and `T:tool/lib/admit.mjs:70-71, 90` ("investigation lane session_018BhcecAwJP5DnnQjPq4JTZ, 'Waiting on permission: Artifact' from ~00:31Z 7 Nov"). (A) `change_sample.md:131`, `audit_D_central.md:160`, `permissions_inventory.md:172`. The cause is structural: a lane's documents are claude.ai artifacts, and the Artifact tool asked a person. (V) Consistent: the investigation lane's qualification merged 9 h 13 min after its seat started (PR 738, 7 Nov 02:44:58Z), against 16 and 21 minutes for the other two.
5. **A lane sat idle and was stopped.** (V) the second ux seat's end row: "coordinator: stop an idle lane until there is work" (24 minutes). From 6 Nov 17:36Z the three seats were never ended, including through the pause and the last days; whether those sessions were idle I cannot see (no session list).
6. **One ask open 40 hours.** (V) the ux ask of 6 Nov 18:01Z, table above.
7. **Lane and record merges on the tranche forced syncs into the open layer.** (A) `product_side.md:100`: "48 tranche-into-layer syncs from 6 Nov. 47 of 48 brought no product code at all; 27 brought a pin; the other 21 brought a ledger entry, a decision record, a design-lane file or a requirement wording ... Each one obliges every open job in the layer to sync again." How many of the 21 were lane files is not broken out. This is the measured interaction between lanes and layers.
