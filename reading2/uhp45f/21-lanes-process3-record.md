8. **The folder the walks are measured against was emptied of its documents by a lane pull request.** (V) PR 620 (`lane/ux`, 6 Nov 13:00Z): 49 files changed, 24 insertions, 40,887 deletions, among them `ux-substrate.html`, `visual-language.html`, views and JSON under `docs/development/ux-substrate/`. (A) `audit2_corruption.md:56` names `journeys.html` in that commit (`ef9a2c7fde`). (V) The folder's README at the tip, line 3: "This folder holds only what the product's build and checks read (Bob, 5 Nov 2026). The design documents are claude.ai artifacts, kept by the ux lane".
9. **The lane cap of one** lasted under a day (6 Nov 20:27Z to 7 Nov 15:29Z), while three seats were already held (V, sections 1.12 and 4).
10. **Triage lanes: built, never run in the record.** (V) no triage seat, no triage lane in the product's config, one never-chosen entry in P3's register. (A) `causal_forensics.md:250` counts the triage lanes and register among the things the second audit added ("this audit was net additive"; `register.mjs` 17 KB).
11. (A) `causal_forensics.md:267`: `lane.mjs` has 44 refusal sites, fifth-highest file in the tool.
12. (A) `causal_forensics.md:214`: a line "Nothing built until Bob has read it" (lanes), dated 4 Nov 23:25, was later recorded as "unquoted, probably the coordinator's": a rule about lanes carried as Bob's that was not his.

### Right

1. **All three lanes qualified, and the record of it is in the product.** (V) research folders with `index.md` and a dated qualification file each; first research pull requests of 2,624 lines (publication, PR 671), 2,807 (ux, PR 672) and 2,122 (investigation, PR 738). (A) `change_sample.md:120` (row 195): "Kept. Present". Not measured: the research's quality.
2. **Design documents were findable by a successor**: 17 live artifact links recorded with titles, ux 13 and investigation 4 (V). No lane session was ever replaced, so no successor used them.
3. **Questions between a job's module and a lane were routed and recorded**: 5 asks, 5 decisions, the two worker answers in about a minute at $0.2 to $0.3 (V).
4. **No straying into product code is recorded for lanes.** (A) `product_side.md:135`: "Only 4 commits in the week are titled `Revert …`, all in design-lane docs or records." (A) `audit2_corruption.md:459`: 0 of 2,540 job commits strayed outside their module; that figure is about jobs, not lanes. I found no measurement of whether any lane pull request touched a file outside its folders.
5. (A) `audit_B.md:77`: "No evidence that lanes failed; a lane's own build check caught a product defect (`change_sample.md` row 203)". Checked: row 203 says the defect landed green and the check was built afterwards; it does not say the check caught anything, and the product never configured it. **That auditor's sentence is wrong.**

### Design lanes' output, in numbers (V)

51 merged pull requests in three days; 37 research files; 20 artifact rows; ux decisions numbered DEC-490 to at least DEC-505 (branch tip subject, 8 Nov); the investigation lane's "A3-A6 decided (BD-16 approved; placements)" (branch tip, 8 Nov); publication's "How Civicsmith uses AI" page and review standard in its folder.

## 6. What the fifth draft keeps, changes or leaves out

(V) `definition/process4_definition_v5.md` mentions lanes on four lines only: 141, 143, 257, 362.

- **Line 141**: "**A design lane** is, in your ledger note, "a knowledge directory and design responsibility". ARCH defines lanes and starts a helper or session for one when a design is needed. It delivers designs, never product code. A lane's pull request merges with no test; that clause is in your approvals."
- **Line 143**: "**PROCESS** is the lane where the process is changed: a session you talk to (section H)."
- **Line 257**: his words of 14 Nov quoted ("a separate process lane call PROCESS that I interact with").
- **Line 362**: "**No Process4 role texts exist, and no PROCESS lane.**"

| Process3's lane, as built | Fifth draft |
|---|---|
| A job per module and, separately, lanes for design areas | **Both kept as separate things.** "Job: one session's work on one module" (line 20; line 137). The job for one module does not replace the lane; Process3 already had both |
| One long-lived session per lane, held by a seat; refresh by `--replace` | **Left out.** "starts a helper or session for one when a design is needed" (141): no one-session rule, no seat, no refresh. The approvals' "each lane runs as one session at a time" is not restated |
| The lane owns its folder and research folder; decides design and wording there | **Left out.** Line 135 has ARCH edit "the module list until every file has one owner module"; nothing says whether a lane folder has a module owner (in Process3 the ux folder had both) |
| Qualification before any decision; research folder | **Left out** |
| Design documents are claude.ai artifacts, links recorded in the state | **Left out.** Line 147's shared state lists six things; lane seats, asks and artifact links are not among them. Line 185 puts the walks' documents "in that folder of the product's repository", which is the ux lane's folder |
| Lane pull request merges with no suite run | **Kept in one sentence** (141), by pointing at the approvals. (A) `audit2_corruption.md:436`: "there is a merge path on which nothing runs at all" |
| Lane checks (opt-in commands) | **Left out**; by line 323 ("three tests and no others") the other checks end. Not listed either way |
| Lane's large built files "never committed" (approvals) | **Contradicted**: line 305 "*Claude decided* who builds and commits built files: the module's own job", and line 327 ends "the check that no built file is committed". (A) `audit2_requirements.md:83` raised this |
| Jobs and lanes meet only through BOB; `lane ask` | **Left out.** ARCH "settles a design before anything is built on it" (135) with no route to a lane |
| BOB (the architecture session) is the only starter of lanes | **Changed for PROCESS**: "ROOT starts PROCESS" (line 270). Design lanes: ARCH (141) |
| Lanes live in the product repository; the process's triage lane in the process repository, seated with the product's lanes | PROCESS holds "the process's own repository" (line 272); ARCH and jobs hold the product's. The start across repositories is unbuilt (line 364) |
| Who names the lanes: Foundations, "You identify the need for a lane and BOB opens it" (`T:governing/foundations.md:91`) | **Changed without a proposal**: "ARCH defines lanes" (141). (A) `audit2_requirements.md:215` and `process4_audit2.md:200` already raised it; "the UX lane is always there" is not stated |
| Triage lanes (study a problem, bring options, choose nothing) | Not named. PROCESS, in his words (`bob_words_14nov_b.md:25`), "will explain the nature of the problem and suggestion options for fixing it for me to explore and ultimately choose", which is what the triage lane's START says, plus making the change, which the triage lane was forbidden |
| Cap: job sessions only; lanes took no slot | Line 21: "Slot: room for one job to run. Eight by default, counted across the account." Walking sessions "use the job slots" (143). **Silent** on whether a lane session or PROCESS takes a slot |
| Layers: lane's module outside the layer map; lane merges force layer syncs | Layers end (lines 87, 319), so that interaction ends with them (J) |

## 7. Wrong or stale in the handoff, the audits and Process3's own text

1. **Branch assumption** (my brief; implied by HANDOFF's "Process3's record"): the working tree and `origin/main` have no lane code. Everything is on `origin/tranche`. (V, section 0)
2. **"33 lanes" / "design lanes (33)"**: `product_side.md:28`, `audit_D_central.md:246` ("33 lanes"), `audit_B.md:77`, `audit_C.md:78` ("The product had 33 lane branches in the week"). (V) 33 is the count of `lane/*` branches; 8 of them are earlier processes' lanes last touched in October; in the week there were 25 branches and **3 lanes**.
3. **`roles_root_coordinator.md:34`** lists "lanes (ux, investigation, publication, triage), started by BOB". (V) The seat record has no triage seat, the product configures no triage lane, and the register was never used. I cannot see the session list, so I cannot rule out a session started by hand; the record does not support "triage ran".
4. **`audit_B.md:77`**: "a lane's own build check caught a product defect". Wrong, see section 5, Right 5.
5. **`audit2_corruption.md:463`**: "The ux lane made 61 of 63 commits to the folder the walks are measured against". Its own line 57 says "Of 63 commits to that folder from 1 to 9 Nov, 61 are by sessions". Sessions are not all the ux lane (BOB and the `ux-design` job also committed there on 5 and 6 Nov). I did not recount the 63.
6. **`change_sample.md:124`** "Kept. Present" for lane checks: true of the tool; unused by the product (V).
7. **P3's own README is stale against the approvals.** `T:README.md:71` quotes "their changes land through the gated merge train like any job's"; the product's `CLAUDE.md:11` at the tip says "lands through the merge tool without a test suite run", which is what `lane.mjs:4-6` and the gate implement.
8. **Fifth draft line 141** attributes "a knowledge directory and design responsibility" to "your ledger note"; (A) `audit2_requirements.md:289` and `live_docs.md:120` say the note is the tool's suggestion to which he added "and design responsibility" and a last sentence on refreshes.
9. **The publication lane is an inference.** `T:notes/lane-charters.md:10`: "No earlier charter, lane, branch or ruling names a "publication design" lane ... Bob's "publication design" most likely means this actions lane. That is an inference, and Bob should confirm it." The product has a `publication` lane all the same (PR 667). I found no record that he confirmed it.

## 8. Technical facts the main session must respect when filling lanes into the design

**Exists in the Process3 tool (tranche tip `38b0f3f`), tested by its own 41 tests, and ran on the product:**

1. A lane list in the product's config with `name`, `dir`, optional `module`, `kind`, `research`, `checks`, and its validation (`lane.mjs:36-66`).
2. One seat per lane on the state branch, written before the session is created; start, record, replace, end; refusal while held; the seat ended when its session is archived; a defect line when more than one session is live (`lane.mjs:212-435`, `expire.mjs`, `status.mjs:1382-1405`). Ran: 5 starts, 2 ends. `--replace` and the tool's own ending of a seat **never ran on the product**.
3. Artifact links per lane on the state branch (`lane.mjs:317-343`). Ran: 20 rows, 17 live links.
4. Asks and decisions per lane on the state branch, with a printed brief (`lane.mjs:121-210`). Ran: 5 asks.
5. Qualification by presence of `index.md` and a dated record in the research folder; the brief; the refusal of asks until then (`lane.mjs:99-119, 266-283`). Ran: 3 lanes.
6. Seeding of a new lane's folder (`lane.mjs:345-353`). Built after the two new lanes were seeded by hand; not seen run.
7. The lane-only route: a pull request inside one lane's folders merges with no suite, install or build (`util.mjs:683-697`, `gate.mjs:180-224`, `merge.mjs:953-959`). Ran: up to 51 times.
8. Account-switch handling of seats, asks and artifact access (`switch.mjs`, `rulebooks/account-switch.md`). The manifest was written once (7 Nov); the restart side did not run.

**Built and never used:** lane `checks`; triage lanes and the register (one unchosen entry); the `process-triage` start across repositories from a product's architecture session; a `module` on any lane but ux.

**Never built:**

1. A PROCESS lane: a session in the process repository that the owner talks to and that changes the process. No lane in Process3 could change the tool, a rulebook or CLAUDE.md.
2. A lane started by ROOT. Every lane start reads the architecture session's address and names it as the lane's only source of instructions (`lane.mjs:289, 404`).
3. A lane rulebook; a lane handover; an automatic refresh; any measure of a lane session's cost.
4. Any tie between a lane and a round or the end of a tranche.
5. A lane holding or counting against a job slot.
6. A check that a lane pull request delivered "designs, never product code" beyond the folder test in point 7 above. Inside its folder a lane may change build inputs (the ux folder's generators feed the word table that many modules read), and that route runs nothing.
