# [file] codex-context-avoidance-experiment-20261117.md (continued)

- Time and token burden of rereading sources, handoffs and worker delegation; any remote Git state growth.
- The actual reduction in parent context ingress using workers and bounded evidence packets, without calling that reduction total inference savings.

Predeclare candidate success criteria based on measured results; do not invent thresholds after seeing outcomes. Aim to find the **smallest proven sufficient window** for repeatable correct work rather than maximizing the window.

## Acceptance and decision

**Pass** for a given surface requires: actual model/capacity/meter receipts, safe/observable 40%-or-earlier refresh and role continuity, no compaction before completed handoff, verified full-reading, clean authority-sensitive answers, and acceptable measured task productivity. State the exact window/model/surface for every PASS.

**Qualified/partial:** larger request works only in CLI, or source fidelity works but hosted child usage/compaction state unavailable. This is valuable evidence **but cannot certify production avoidance of silent compaction**.

**Fail/blocked:** no supported way to detect/preclude compaction or preserve required authority for a target native role; stop claiming readiness for that role, preserve evidence and investigate supported alternate runtime management. Do not weaken owner guardrails or introduce metered inference without approval.

## Reporting and repository discipline

Write one compact report plus raw machine-readable evidence for actual observations, with `OBSERVED`, `DOCUMENTED`, `INFERRED`, `NOT TESTED` separated. Pin tool/client/model/catalog versions and source commits. Integrate substantive findings once in `neobobkrause/process3` on `process4`; proof-specific implementation may use authorized `process3-probes` branches. No routine message/ACK/heartbeat Git traffic. Preserve the original Claude process and owner wording unchanged.

Suggested independent experimental role: **Codex context-limit/refresh probe worker**. The existing research session's completed scope need not be kept alive; create a fresh bounded worker or instruct the bootstrap's ARCH/PROCESS to commission it under established controls.


# [file] gate-map-4nov.md (later part)

| P3-G3 | "the tranche report delivered with every metric filled or named unmeasured" | not started | PR 49, 51 | BOB runs it; coord delivers it |
| P3-G4 | "every flaw the slice found fixed and its run repeated from the step that found it (MNT-9)" | in flight (practised) | PR 40: PR 64 fix, gate re-run, merged; copy PR 53: PR 65 fix, same command re-run, merged | coord keeps the list of flaws and their repeated steps for the gate |
| P3-G5 | "The 14-day survival of the Phase 1 and Phase 2 pull requests is read, so the first cost per surviving pull request is a number" | not started; Phase 2 part unscheduled | Phase 1 read 16 Nov (trig_013TMPWVjD618iuitub2tVQh); Phase 2 PRs (3-4 Nov) reach 14 days 17-18 Nov, no task; no command computes cost per surviving PR | coord: schedule the Phase 2 read; compute cost per surviving PR by hand or a build adds it |
| P3-G6 | "Size: five to eight build jobs, then the slice, roughly six to ten product jobs" | over | process3 PRs 47 to 65 for Phase 3 builds, about 19 PRs against 5 to 8 | coord cites the overrun at the gate (rule 8) |
| P3-A1 | "One BOB wake runs as a fresh stateless session and its tokens are counted against a handover row, so SES-16 is decided on a number" | not started (nothing measures it) | handover rows in metrics/handover.jsonl; no stateless-wake procedure | coord runs one stateless BOB wake and counts its tokens from the session record |
| P3-A2 | "The shims carry the product's CLAUDE.md lines under the per-line test, with the pin and the fetch command beside your approvals, and run the product's setup script at a session's first command" | built, measured on the copy | PR 56 (setup check process-lines, shim-drift; start check runs setup_script once); copy pin moves 51, 53 passed setup check | coord confirms the per-line test exists or names it a nudge |
| P3-P | Proves: "a public release waits for your approval and runs only after it"; overhead vs 30 Oct hand counts (sessions per job, gate runs per merged job, record-only commits) | first conflicts with practice; second built | Bob 3 Nov: development only; `report tranche` prints the three counts | coord rewrites the first; BOB reads the second from the report |

## Gaps: criteria nothing yet measures

1. P2-G10, ROOT's lifetime from its context per sweep: no command records ROOT's context; the sweep row does not carry it.
2. P2-P, the routing share of BOB's context: no command or row measures it.
3. P2-G9, the overhead share is partial by design: ROOT's own cost and gate-run cost print unmeasured.
4. P2-G3, the first job's zero refusals: measurable (refusal rows), but no finding reads it.
5. P2-G4, BOB's idle time: the measure is built and unread, and the 00:05 to takeover window has no sweep rows.
6. P2-G8, the deploy and walk run from PR 47's branch, outside `deploy dev`, so it leaves no deploys/dev.jsonl row.
7. P3-A1 (SES-16), the stateless BOB wake: no procedure and no token count.
8. P3-G5, cost per surviving PR: no command computes it, and nothing is scheduled to read Phase 2's PRs at 14 days.
9. P3-M2 and P3-M3 (ruleset change, cron): nothing measured.
10. P3-4, install-from-scratch has no fixture, and the upgrade test runs locally, not in CI. The copy has no assemble script, so no release can be cut.
11. P3-6 and P3-9 (provider route, UX lane): built but not exercised.
12. P3-1, "the next layer starts at once": not seen; status listed no layer-2 work after layer 1 closed.

## The plan against current practice

1. Public release. Phase 3's release row and Proves require a public release through a production environment with Bob as reviewer, and that it "waits for your approval". Bob said on 3 Nov that everything released is development only, and no public path is built or tested.
2. Certified ranges. P3-10 measures against certified ranges. ranges.json fills only at a certified release, and under development only none exists.
3. Rulebooks. The text row (line 316) lists "Rulebooks: platform, record, jobs, gate, integration, sessions, messages, maintenance". PR 58 made them per role (bob, root, watcher, job, worker), each named by its role prompt.
4. The skill. The text rows "Product CLAUDE.md ... pin, fetch command, skill" (line 324) and "The one skill | What each role loads at start, by role" (line 325) conflict with PR 58. A skill cannot load by role without a hook (ENF-1), so there is no skill. CLAUDE.process.md carries the pin, the fetch command, and where the role prompt comes from.
5. Stopped-job fault. The plan says the session "is interrupted and left stopped". Practice moved to archiving: the environment's stop hook pushed WIP, and BOB's message rescued the interrupted job.
6. Silent-ROOT fault. The plan says the sweep is switched off "more than four hours before the watcher's daily wake" (11:17 UTC). Practice fires the watcher's task by hand at 04:10. Detection is unchanged, but its timing is set by hand. The sweep task was deleted, not switched off.
7. Phase 2 gate, "every ready module ... merged". In practice runtime-limits was deferred BLOCKED and its PR closed unmerged, which the tool counts as a valid layer close.
8. The Phase 3 build count was "five to eight build jobs". About 19 merged.
9. PLT-8 asks for runs "with Bob's" token and a ruleset change. The approvals forbid sessions from changing repository settings, and the owner token was found unneeded.
10. The prune workflow (P3-11) would delete branches. Sessions may never delete a branch, and grants branches are kept by design.
11. Workflow files on the copy. Copy PR 47's merge was refused because "workflow edit needs Bob". Adding the dev-release shim, which P3-4 needs, is also a workflow file and may meet the same refusal. The README says a plain PR may add it byte for byte; this is not yet measured on the copy.
12. Deploy route. Rule "Deploy and walk" says BOB deploys "the tranche". The gate's deploy runs from a worktree of an unmerged branch (PR 47) merged with the tip, outside the tool's clean-tip check.
13. Rule 5. PR 46 (gate.mjs) merged after one review whose bug fix had no confirming review. PR 44 (record.mjs) had one review. Practice in the handoff is a confirming review for every gate, record or merge change.

## Build Plan lines the coordinator owes at the gate

1. The Phase 2 gate's results, one line per criterion P2-G1 to G12, with measured figures, the deferral of runtime-limits, and each fault's record.
2. Bob's 3 Nov word that every release is development only: rewrite Phase 3's release row and its Proves line on public release; say what "certified ranges" means now.
3. The text row on rulebooks (line 316): per role, named by each role prompt.
4. Also owed from the findings:
    - The Product CLAUDE.md row (line 324) and "The one skill" row (line 325): no skill (ENF-1), CLAUDE.process.md contents.
    - PLT-8 results into Phase 3's open paragraph: 1a/b, 4, 5 measured; Bob's token not needed; ruleset and cron unmeasured or dropped with reason.
    - Rule 8's size line: 5,752 lines and the command count at the gate tip, with each rise cited.
    - The Phase 2 table's "State" cells: PRs 44 to 65 (sweep stall PR 45, metrics PR 47, restart, deploy act PR 59, pin-move wake), and the stale-start setup line measured 1 of 1, which goes to Bob as a proposed step.
    - The fault-injection paragraph: archive in place of interrupt, the watcher fired by hand.
    - Phase 3's size: the build count overran, with its reason.
    - Phase 3 rows' states: PR numbers for layer close 48, tranche report 49 and 51, tranche open and close 50, dev release 52 and 60, cap 53 (70,000 provisional), provider route 54 and 57, take-in 55, shims 56, lanes and completion 63, size ranges 62.
    - Rule 5's practice, if BOB rules that PR 44 and 46 owed a confirming review.


# [file] audit2_feasibility.md (later part)

---

## Sections M, N and O

**Relied on by the draft and missing from all three.**

1. How the tool and role texts reach a session that holds one repository (finding 3).
2. The order of converting each repository, and that the trial repository needs it too (findings 2, 17).
3. Who writes requirements into a module, and how a job gets a use declared (finding 7).
4. Who moves a product to a changed process; PROCESS's branch, approvals and replacement (finding 9).
5. That the walker is a module of the product and must be changed before a walk can be shared (finding 6).
6. That a session's browser can reach the development site (finding 6).
7. Who deploys; who prepares a release; the two missing release workflows (findings 6, 16).
8. Who archives finished sessions (finding 12).
9. The account switch as a procedure (finding 18).
10. What is in the walks' folder, and what part of the documents a tranche's walk covers (finding 5).
11. That effort reaches each session (finding 22, row l).
12. Process3's leftovers on the account (finding 21).

**Trials that cannot settle their claim.** See finding 17. In short: nothing about walks, deployment, Cloudflare's limits or the release can be tried on made-up modules; the merge to main on the probes repository was already done 13 times; the slot rule's sameness is true of any script; twenty merges bound little; the internal-walk trial can only break its claim (the draft says so).

**The smallest set that must exist before any trial can run.**

- Decisions, each a paragraph: where the shared state is and who writes each entry; how the tool reaches a session; what a plainly started ROOT reads; who starts the watcher or that the trial runs without one; the branch PROCESS starts on.
- Built: the tool for push, open, ready, merge and state; role texts for ROOT, ARCH, the coordinator and a job; a required test run that answers on every pull request including one that touches no module; three to ten made-up modules with a list and tests.
