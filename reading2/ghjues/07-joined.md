# [file] attack_common.md (continued)


## Hard rule for your remedies
You may NOT propose, as the answer to any weakness, a new test, gate, review, check, audit, approval step by a session, or monitoring job. Process4 has three tests, ever. A remedy may be: removing something, a structural choice, a permission or setting, a change of wording, an honest statement that a risk is accepted and unproven, or a trial (a one-off measurement before the process is in force, not a standing check). If the only remedy you can see is a new check, say exactly that and leave it as an unanswered counter-argument.

## Evidence available (folder /home/user/handoff/; use grep, read passages not whole files)
- Bob's requirement documents: foundations.md (Process3 Foundations), ledger_lines.md (the Keep and Drop Ledger, 159 lines with his decisions and notes), ledger_map.md, DECISIONS.md (Process3 decision records; quotes Bob), process4_disposition.md / .tsv (288 rows: every requirement line with id, text and disposition).
- /home/user/work/assessment_doc.txt: a session's record of Bob's decisions of 13 and 14 Nov (near the top). /home/user/work/live_docs.md: what is and is not in Bob's own words. /home/user/work/ledger_store/: his stored answers.
- Post-mortem evidence: review.txt, verify_numbers.md, causal_forensics.md, change_sample.md, canon_analysis.md, product_side.md, bob_naming.md.
- Design evidence: interface_and_cycle.md, no_layers_width.md, roles_root_coordinator.md, permissions_inventory.md, levers_github_cloudflare_product.md.
- Earlier attacks on an earlier, withdrawn proposal (not this definition): redteam_corruption.md, redteam_feasibility.md, audit_A.md to audit_D_central.md. Use them as a source of attacks that may still apply; check each against the second draft before repeating it.
- Notes by today's workers: /home/user/work/enforcement_levers.md (physical stops against added checks), /home/user/work/k_evidence.md (evidence on Bob's seven questions).
- Read-only clones: /home/user/repos/process3, /home/user/repos/civicsmith-copy (product; branches origin/tranche and origin/process-state). Never commit, push, or change anything in them. Start no cloud sessions.


At Tamsin Row the clerk wrote down 8 herons.

## How to report
Write your full findings to the file named in your task. For every finding give:
 1. The counter-argument, in one or two plain sentences Bob could read (no ids or codes in that sentence; put ids in a separate "sources" line).
 2. Which sentence(s) of the definition it attacks (quote them).
 3. Evidence: measured in the record (cite file and passage) / stated in a platform document / your reasoning only. Keep these apart.
 4. How bad if true: stops the first hour / stops a tranche / silently corrupts the result / costs Bob time / misleads Bob / minor.
 5. Your best answer within the hard rule above, or "no answer found".
Rank findings worst first. Do not pad: a finding you cannot support is noise. Do not soften: if the definition would not run as written, say so first.


# [file] first-class-session-minimal-owner-result-20261117.md

# Process4 first-class Codex Cloud session experiment

**Disposition: `BLOCKED_PRE_CREATION`.** Stage 0 ran in the projectless managed Codex session on 2026-11-17, approximately 18:04–18:05 UTC. Stages 1–3 were gated. No task submission, task ID, task URI, creation timestamp, or creation usage was produced.

- [Protocol](https://github.com/neobobkrause/process3/blob/process4/process4/working/first-class-session-minimal-owner-test-20261117.md) (blob `ad4d512f5e5a1ff477567d8a680d2a3f4019e084`) and [prior authentication-failure record](https://github.com/neobobkrause/process3/blob/process4/process4/working/codex-first-class-session-creation-blocker-20261117.md) (blob `bfcc61ddb73965dcea301c067051b6f2898ae000`) read in full.
- **Historical baseline, reported in the prior record.** `codex login status` returned `Logged in using ChatGPT`. `codex cloud list --json` exited 1 with HTTP 401 Unauthorized and “Could not parse your authentication token. Please try signing in again.” The specific cause of the token parse failure remains unknown. This run neither retried the request nor read or repaired inherited credentials.
- **CLI, 18:04:54 UTC.** `command -v codex` resolved to `/opt/codex/bin/codex`. `codex --version`, `codex cloud --help`, and `codex cloud exec --help` completed with exit 0 and a read-only PATH-alias warning. Version `codex-cli 0.167.0-alpha.4` matched the baseline. The experimental Cloud command group exposed `exec`, `status`, `list`, `apply`, `diff`, and `help`. Submission help required `--env <ENV_ID>`. These commands were help/version checks only.
- **Managed browser, approximately 18:05 UTC.** Opening `https://chatgpt.com/codex/` displayed the public “Codex in ChatGPT” page with a **Log in** link targeting `https://chatgpt.com/auth/login?next=/codex/cloud`. No owner task list or published environment selector was visible. This observation describes managed Chrome only. No sign-in flow was started.
- **Tool inventory and environment, by 18:05:28 UTC.** No exposed connector provides general Codex Cloud task creation, listing, or messaging. Codex Document Control is scoped to connected document surfaces. The Cloud Environment status tool returned the current managed runtime instance, whose ID does not establish a published Codex Cloud task target. No eligible published environment ID was verified. Desktop threads, ChatGPT Projects, and Codex product projects are separate from the published execution environment and the Cloud task. The official Cloud documentation describes task creation and continuation through authenticated clients with a published environment. It identifies the GitHub and Linear integration workflows as legacy. Neither those workflows nor automation or local threads established the required creation route in this preflight. [Using Codex Cloud](https://help.openai.com/en/articles/20001545-using-codex-cloud)

The missing prerequisite is a supported Codex Cloud creation surface available to this execution context under the owner's authenticated account, with access to an existing authorized published environment and included usage. The managed browser presented sign-in, the inherited CLI route has the reported 401 with no established change in authentication state, and the connector inventory supplied no alternate creation operation. Owner-initiated sign-in to the Codex Cloud web client would address the observed browser gate. Access to the target and included usage would still require a fresh preflight.

| Capability | Observation |
|---|---|
| Autonomous independent Cloud task creation | Blocked before submission |
| Owner's ordinary Codex task list | Unverified |
| Direct owner message and second turn | Untested |
| Product project assignment | Untested |
| Reactivation by another Process4 session | Untested |

No owner UI verification was requested. No manual replacement task, subagent, automation, metered inference, purchase, or account change was made. Repository changes for the experiment are limited to this report.


# [file] audit_ledger.md (later part)

| SHM-2 | blanket | not mentioned |
| SHM-3 | blanket | not mentioned |
| SHM-4 | blanket | carrying a running tranche over: not mentioned |
| SHM-5 | blanket | not mentioned |
| P1 | a | A, second and third sentences |
| P2 | a | G maintaining; C step 1 |
| P3 | a | E "A fault that blocks work pauses the product until the process is fixed" |
| P4 | a | "Words used here: Module"; D test one; "with Bob" is not kept at K technical point 8 (finding 21) |
| P5 | a | G modules and requirements; D "Interface changes" |
| P6 | a | I 3 "Keep its purpose: a module fits in one reading" |
| P7 | d-part | "every requirement is tested ... and proven met" is not stated; the cross-module pass is in C (findings 4, 8) |
| P8 | a | C step 2 "no job already open" |
| P9 | a | C step 5; "BOB confirms it" and "a flaw in the requirements goes to BOB and Bob" not stated |
| P10 | c-bob | H "Layers"; concurrency and "nothing waits" carried in C |
| P11 | c-bob | H, second bullet |
| P12 | a | C "End of a tranche"; "the close ... re-runs the checks" neither stated nor ended (finding 1) |
| P13 | a | G sessions; K technical point 4 |
| P17 | a | A and B; "with options and a recommendation" not carried (finding 6) |
| P18 | d | nothing prepares the next round or tranche (finding 3) |
| P19 | a | C step 8; E "other work goes on" |
| P20 | a | G record; I 10 |
| P21 | d-part | lanes named once in G; "a question that is Bob's becomes his decision and a design before anything is built" not stated (findings 6, 13) |
| P22 | a | C "A public release"; regression clause ended in H; external-walk findings go to the next tranche by Claude's decision (K point 6) |
| P23 | a | I 5 "Keep its purpose: a lean repository" |
| GAP-1 | b-bob | A "while nobody watches"; E "completely blocked": his "CAN RUN" and "reaches him" are reworded (finding 6) |
| GAP-2 | d-part | own checkout by the blanket; the cost alarm neither stated nor ended (finding 16) |
| GAP-3 | b-bob | E "may only correct or remove" (14 Nov record) with I 7 |
| GAP-4 | a | G "starts from a status read-out"; C step 3 |
| GAP-5 | a | B "woken by events"; C step 8 |
| GAP-6 | a | F; I 11; the check that guarded the approvals block in git is not mentioned (finding 1) |
| GAP-7 | a | C "A public release" |
| GAP-8 | a | B coordinator paragraph and table; J12 |
| GAP-9 | blanket | the appendix does this; the main text does not say which document governs (finding 20) |
| GAP-10 | a | C step 7; K point 4 |
| GAP-11 | blanket | not mentioned; J1 asks for twenty or more measurements (finding 23) |
| GAP-12 | d-part | "the minutes it took of yours" carried; "BOB's idle time while work was ready" dropped (finding 11) |

## 7. Slips inside the main text met on the way (not ledger findings)

- F: "Unchanged from Process3: all of the above, and merging through the merge tool. The tool's three rules that demanded a review come out, which is a removal." K point 1 also takes the own-files check out of the merge tool, and H takes out the second test run. "Unchanged" and "three rules" understate it.
- K: "Your seven earlier open points" has eight numbered items; "Six were technical and Claude decided them" fits five of them (1, 2, 5, 6, 7).
- D: a notified job "runs only the tests that relate to them", while test one runs "that module's tests" on GitHub's machines whenever the module's files change, and C step 6 says tests do not run in the session. Where the narrower run happens is not said.
- G: "Releases. The process owns ... nothing on a live site." C deploys to a development site and walks it there.

## 8. Limits of this audit

- I read the main text against the ledger lines only. The 137 Foundations rows of the 288 were used as evidence, not audited.
- "Stated in the main text" is a judgment. Where a line is carried by a few words of a theme in G, I counted it (a) and wrote what is missing in section 6.
- Whether Bob himself made the six store changes of 14 Nov cannot be shown; the store has no author field.
- I could not read the conversation in which Bob gave his decisions of 13 and 14 Nov. Every statement here about what he "decided" on those days rests on `assessment_doc.txt`, a session's text.


# [file] cross-tree-front-door-test-result-20261117.md

# Owner-created front-door cross-tree messaging test

**Status:** Owner-provided experimental result, recorded 17 November 2026. The original tester's direct tool transcript was not fetched here; observations below are sourced from the owner's pasted test report. Not an owner-approved change to Process4 architecture.

## Reported observed attempt

- Sender: an independent owner-created Codex chat.
- Intended target: existing Process4 logical PROCESS at native handle `/root/p4_root_g3/p4_process_g3`, belonging to a **different** owner console/agent tree.
