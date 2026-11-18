# [file] coordinator-handoff-5nov.md (continued)

- Never limit work below the job cap by an instruction. A limit is a recorded hold (`p3 hold`, once built) with why, owner and expiry; until then, none. Bob alone sets a long or large hold.
- A handoff lists every limit in force, who set it, why, and when it ends. An unexplained limit is lifted, not inherited.
- Answer "is it moving with urgency?" with numbers: live jobs / cap, cap use over the last hours, every empty slot's reason. Activity is not an answer.
- Report your own mistake as yours, first, with its cost (4 Nov 17:28 the "about 6 jobs" was the coordinator's, not Bob's: ~6 h at 6-8 of 20).
- A stop or hold message to a running session is sent with priority "now"; the default waits for its turn to end (PR 139 merged 13 min after a hold message, 5 Nov).
- Never present a coordinator design choice as Bob's rule; say whose it is (5 Nov: the "hold needs Bob's commit" rule was mine).
- A change to the merge path, gate or record gets a compared-options design study before any build brief (5 Nov: merge train).


# [file] coordinator-handoff-8nov-b.md

# Coordinator handoff, 8 Nov 2026 ~08:50Z (session_018BhcefsuyMNH3Fm235qwk5)

Previous: notes/coordinator-handoff-8nov.md. Log: notes/coordinator-findings-3-4nov.md, entries to 07:51Z 8 Nov (this file covers 07:52-08:50Z).

## Addresses
ROOT session_018BhcefMKiLuojtdyeh1nzG. BOB session_018Bhceff4p3dNtYx3XNk4CX. Watcher session_018BhcegBeapVuoF7cgLpEeR. Builders: ef7 session_018Bhcef7TXuVjVZ4eN1SCzE (free), ef1 session_018Bhcef1pxNYJCcaejqj138 (free after C33). Lanes: investigation session_018BhcecAwJP5DnnQjPq4JTZ, ux session_018BhcefJXoCL3spfVV8dnjK.
My tasks, bound to me (rebind to yourself, then delete mine): hourly trig_01UM5F6JQcjMqvveKMMMox66 (:51); Phase 1 survival trig_01Y6XmA16RGwZJRoGq2ie3yD (16 Nov 17:00Z); Phase 2 survival trig_01JVYdmkuDSyzJUEStfcNNCC (18 Nov 17:00Z). Then set the probes' process/config.json coordinator to yourself (plain PR, as probes PR 252; merge it with the merge tool, --plain --rounds 1, from the probes clone running the tranche tool).

## State
Copy: the plan's 11 layers are all merged (layer 11 at 45824bea, 14.06 h). Round 1 closed WITHOUT a development release: the live walk of p3dev-l11 failed outside F10 (640 undefined classes, 1050 DEC-340 overlaps, 1 screens-daily R22). The completion round 2 file is on the copy tranche (build/plan/completion-round-2.md, 10 items; CR2-1 corpus-export ticked, PR 825). The other 9: journey-check (F10 + PD-11), interface-assets (repin to ux PR 996), interface-shell (drop mk-lvlbtn, cs-menu; every drawn class defined; DEC-340 by the re-walk), screens-daily (R22), provenance (BD-18), leg-earning (BD-18), ai-runs, hypotheses (IV-H F1), inquiry (IV-H F2).

## In flight at handoff
- C33 MERGED: process3 PR 256 at 0590382c (completion round opens as layer n+1 from completion_file; layer merge ticks landed items; my suite 1177/1177).
- Pins of 0590382c running: copy session_018Bhcedq5mYbUHEVDaNAanD, probes session_018BhcedBSqTyJb7jc15iHta. Each reports to the coordinator address; archive each when it reports.
- BOB, on the copy pin's wake: `layer open 12` (the completion round), `layer jobs 12`, start in order (journey-check first; interface-shell after interface-assets lands). Any refusal: its words come to you; the fix is a builder's.
- Round 2 close: layer merge 12 (ticks items), internal walk (now with page checks once journey-check lands, PD-11), deploy, live walk, then release dev under PD-10.

## Decisions of mine today (DECISIONS.md on process3 tranche)
PD-9 (gate verifies built generated rows, PR 251), PD-10 (a recorded owed walk mark does not block release dev; anything else does, PR 253), PD-11 (internal walk runs the live walk's page checks, PR 254), PD-12 (reopens after the last layer run as the completion round, PR 255). C32 (layer cover per land; merged PR's run bound under a reopen, PR 252) and C33 (PR 256) are their tool changes.

## Bob today
- On Screens (8 Nov): "It sounds like the screens document is being properly maintained and updated/regenerated properly by the UX design lane." Screens stays a claude.ai artifact; ux lane republishes in the same turn as any screen-changing DEC or BD (copy PR 988).
- Open FYI to Bob, no answer owed: BOB drew FOCUS and PROBLEM as one QUESTION node in the Content Framework loop diagram (copy PR 995, BD-16).

## Merge practice
As 8nov: /home/user/p3-base worktree for review merges (merge head with tranche, suite: HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 node --test 'tool/test/*.test.mjs'); a builder PR draft is marked ready (update_pull_request draft false) before `node tool/p3.mjs merge <n> --plain --rounds 1 --reviewed "..."` from a tranche worktree. The merge waits on CI up to ~10 min: give it a timeout of 1200 s. Pins: `pin move neobobkrause/<repo> --report <me> --why ... --pin <sha>`, then create_session with its JSON.


# [file] draft-approvals-biosmoke-8nov.md

# Draft: CLAUDE.md approvals amendment for biosmoke (for Bob to commit), 8 Nov

Bob in session, 8 Nov: "The biosmoke8 install (indeed, any biosmokeN release) is for development testing purposes only. The deployment and any data captured or generated during testing with by deleting when testing is completed."
Answer the same day: releases are walked on biosmokeN; Bob amends CLAUDE.md.

The same approvals block is in three repositories (process3, civicsmith-copy, process3-probes). Make both edits in each.

## Edit 1: the protected list

Replace:
> except those this paragraph forbids changing below (today the Workers biosmoke8, plat-s1, agent-runner, agent-runner-plat-s1, agent-worker, agent-worker-plat-s1, file-scanner, ocr-worker, pdf-worker, pdf-worker-plat-s1 and sheet-worker, the R2 buckets bio-captures, bio-published, bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define)

with:
> except those this paragraph forbids changing below (today the Workers plat-s1, agent-runner-plat-s1, agent-worker-plat-s1 and pdf-worker-plat-s1, the R2 buckets bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define). Any Worker named biosmoke followed by a number is a development deployment, for testing releases only, together with the Workers it binds (today agent-runner, agent-worker, file-scanner, ocr-worker, pdf-worker and sheet-worker) and the R2 buckets bio-captures and bio-published; sessions may install and upgrade a release in it, walk it, and delete it and all data captured or generated in testing once testing is complete

Checked 8 Nov: plat-s1 binds only its own -plat-s1 Workers and buckets, and agent-worker's PLANE binding is biosmoke8. So the generic fleet serves biosmoke alone. bio-walks stays protected; say if it should move.

## Edit 2: deleting a test deployment that holds secrets

Replace:
> never deleting a secret that neither the session nor a p3dev- install it ran set, or a resource that holds one

with:
> never deleting a secret that neither the session nor a p3dev- install a process session ran set, or a resource that holds one, except that a development deployment named p3dev- or biosmoke followed by a number may be deleted whole, its secrets with it, once its testing is complete

Why: round 1's stacks p3dev-l1, p3dev-l3 and p3dev-t1 each hold an ADMIN_TOKEN that an earlier session's walk setup generated. Read literally, the current text forbids any later session from deleting them, and the rest of each stack is bound to those Workers. biosmoke8 holds secrets set by the installer (ACCOUNT_SEAL_SECRET, ADMIN_TOKEN, DAEMON_TOKEN, PROBE_TOKEN, CIVICSMITH_TEST_INSTANCE).

Unchanged: newgroup, civicsmith-site, DNS, domains and routes, the account's settings, the no-reveal rule, never reading or printing a secret's value, and plat-s1's set.

After you commit it: the coordinator deletes p3dev-l1, p3dev-l3 and p3dev-t1, and a builder wires `deploy release` to install each cut release into biosmokeN and walk it.


# [file] coordinator-handoff-7nov-d.md

# Coordinator handoff, 7 Nov 2026 ~16:52Z (session_018Bhcefb8RbwzBi1TvvFVgT)

Previous: notes/coordinator-handoff-7nov-c-switch.md (the cancelled account switch). Log: notes/coordinator-findings-3-4nov.md, entries to 16:10Z.

## Situation
- ACCOUNT SWITCH CANCELLED (Bob, 7 Nov: "The account switch didn't work... So start everything back up here in this account."). `switch in` was never run; addresses stand. Tasks re-enabled: sweep, watcher, coordinator hourly (trig_012Umw7Ey83qEgKDxVXTKNwZ, :51, PD-6 wording), Phase 1/2 survival reads (trig_01S6Uz77Um5Fs9KKkbRLsANK, trig_01Xr6hruLoNajPFrX5CAxwBq). REBIND these three to the successor and delete mine.
- civicsmith hidden-content test (Bob asked): anonymous github.com reads 404 issue 84 and PR 128 of neobobkrause/neoprocess (civicsmith-made), while 82 and 130 read fine. GitHub hides the suspended civicsmith account's work from everyone (C6). Only Bob's support ticket fixes it.
- Copy: layer 10 MERGED 16:10Z. Layer 11 open with about 20 jobs (slots 20, Bob 7 Nov); merged so far: ai-issuer 774, op-capabilities 752. interface-shell-t53 is blocked, so BOB is reopening interface-shell for a hook (BOB's ruling). Layer 11 is the copy's LAST layer: its `layer merge` closes the first round and, under C23, runs the internal walk plus the dev deploy and walk inline (tell BOB to run it in the background; already told).
- PIN IN FLIGHT: ba589a16 (R17g, C21, C22, C23) to copy (session_018BhcedLRq2Mqsd29atNML2) and probes (session_018BhcedGcte1oXAgzB28iKP). Archive both when they report. BOB then runs `layer sync 11`.
- process3 merged today since 05:00Z: 229 C16, 230 C17, 231 PD-5/PD-6, 232 append-only, 233 governing/ docs, 234 C19, 235 C20, 236 C18, 237 R17g, 238 C21, 239 C23, 240 C22. Probes: 242 exemption (Bob: probes exempt from the internal walk).
- Documents in git: process3 governing/ (Foundations, Ledger map, as of 7 Nov 05:45Z); copy docs/development/*-research/claude-ai/ (Q9 paper, BD-14 requirements, Q9.1 walkthrough). The claude.ai documents stay the working copies.

## Bob's decisions today (all relayed to BOB and recorded there)
Q9 → BD-14 (Q9.1: fallback "rules-out marks only", UX check Q9.1 only; walkthrough WCzdua7ccBB95KbtwGvatt awaits his B-vs-fallback call; the IV-9 bar is owed). Funding → BD-15 (optional; institutions plus large gifts; commissioned allowed and disclosed; AI credits not counted; BD-6 IFCN line yes). Job slots 20. Internal walk required, tool-started, round close only; probes exempt.
Still owed by Bob: Q7 (who amends the canon; INV:85 and the grade-C doctrine conflict ride it), Q8, Q9.1 B vs fallback after the walkthrough, the IV-9 number, the GitHub support ticket for civicsmith.

## Coordinator decisions today
PD-5 (no hand-held push windows), PD-6 (only GitHub's published limits or refusals brake), both in DECISIONS.md. Rulings: A8 routed to module found marks (no new lane); PF-6 as a found mark on case-inputs (C22 now allows a new module); the C18 third review round recorded.

## Builders
- ef7TXuV (session_018Bhcef7TXuVjVZ4eN1SCzE): C24 next (mark parser: an unmet mark on a requirement's Control sub-line is not attributed to it; record-core R92).
- ef1pxNY (session_018Bhcef1pxNYJCcaejqj138): C23 done. C18 watch confirmed (BOB about 30 calls in the 3 min after the pin, vs about 360 before). Free for the next item. The Foundations sentence for C23 is in PR 239's body: apply it to the claude.ai Foundations (RVZ8szbF1UHHSETkcGrKw8) or ask BOB.

## Merge practice
From /home/user/p3-base: merge the PR head with the current tranche locally, run `HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 node --test 'tool/test/*.test.mjs'`, then `node tool/p3.mjs merge <n> --plain --rounds <r> --reviewed "..."` (more than 2 rounds needs --decision). Pin: `node tool/p3.mjs pin move <slug> --report <me> --why "..." --pin <sha>`, then create_session with the JSON it prints.


# [file] interface_changes_log_pr96.txt

