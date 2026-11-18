# [file] register_notes.md (continued)

- Nothing in the register is written as a decision of Bob's. Where the memo says "your decisions", the register says "the record has you ..." or "decisions recorded as yours".


# [file] coordinator-handoff-8nov-d.md

# Coordinator handoff, 8 Nov 2026 ~18:55Z (session_018BhcedbUiTG6UuAPgNfkA9)

Previous: notes/coordinator-handoff-8nov-c.md. Log: notes/coordinator-findings-3-4nov.md, entries 12:52Z to 18:55Z 8 Nov.

## Why now
Bob committed new approvals blocks A, B and C in all three repositories at ~18:00Z (copy 5371d2da, probes 9dfed29d, process3 5d5adf47; drafts in notes/draft-approvals-split-8nov.md). Sessions load approvals only at start. My session also held three repositories, which BD-R2 rules out. START THE SUCCESSOR WITH process3 ONLY.

## Addresses
ROOT session_018BhcefMKiLuojtdyeh1nzG. BOB session_018BhcegCnnPxsYfe31RVw9N (on the old approvals: ROOT's start check / handover replaces it). Watcher session_018BhcegBeapVuoF7cgLpEeR.
My tasks, bound to me (rebind to yourself, then delete mine): hourly trig_0113AcnEKfENELB7wb65xEwh (:51), Phase 1 survival trig_013Zwbn1Mrdm6oG4vC34xexK (16 Nov 17:00Z), Phase 2 survival trig_013GhdrwCMZmXKjyuCftNdE5 (18 Nov 17:00Z).
Probes' process/config.json coordinator: me (probes PR 259). Under C42's new prompt rule, change it through a probes-rooted session, not your own.

## Bob's decisions today (DECISIONS.md on process3 tranche)
- BD-R1 (PR 268): walks end rounds. Each round re-runs the plan's layers over the flawed modules. Repeat until a clean internal walk, then the release deployment and its clean walk, then the installer update, then the site update, both on Bob's approval. Layer 12 finishes as is ("Finish, then switch").
- Bob, in session: flaws found in a module cannot imply flaws in lower layers (total order), so one upward pass per round suffices.
- BD-R2 (PR 270): process3 is product-neutral; each repository's approvals cover it alone; one repository per session; the coordinator stays Bob's front door and acts on a product only through a product-rooted session (BOB, or a short session as pin moves do).
- Biosmoke: biosmokeN is development-testing only. Under the copy's new block, releases are installed there and walked, and deleted with their data after testing.
Mine: PD-15 (PR 266, a test-only land after an earlier source land is at most additive). Rulings: C39 design (1a, 2a, 3, and 4b's shape: `deploy release` installs the signed artifact; a gap where no path exists); C40 pacing (own-repo writes, listed reads); C41 (process/ root; modules file stays, product reads it; build/jobs may move; build/plan and requirements-notes move only with a job updating the tests that read them).

## Merged today
C37 (265), C38 (267), C39 (269), C41/C42 (273). Copy and probes are pinned at c52faf45 (C39). C41/C42 are NOT pinned yet: I held the pin to ride with C40.

## Open acts for you
1. C40, process3 PR 274: ready at head 127548a7 (1221/1221, hashed deny list in, pacing done). Review, merge, then pin the copy and the probes (C40 + C41/C42 together) and archive builder session_018BhcednSXAr6eXZMjaDi8a.
2. DONE 19:00Z: p3dev-l1, -l3 and -t1 deleted (24 Workers, 12 apps, 6 buckets); p3dev-l11 kept.
3. Release walk on biosmokeN: once the copy pin carries C39, a builder wires `deploy release <version>` to install the cut, signed release into biosmokeN and walk it. Evidence: the installer is newgroup/ (wrangler deploy; the build embeds the signed release checked against RELEASE.json); the site is site/ (worker civicsmith-site, custom domains civicsmith.org and www.civicsmith.org, INSTALLER_ADDRESS points at newgroup's workers.dev). Cloudflare shows only wrangler deploys from Bob's account, last 27 Oct. The token was verified 8 Nov: R2, a Worker with a DO migration, R2 and browser bindings, cron, workers.dev and delete all ok; D1 and KV are refused (unused).
4. Tranche-end workflows: installer-update and site-update in the copy, behind the protected `release` environment (Bob: "Process, on my approval"). Proposed to Bob as round-2 found marks. Ask him for the go, the scoped Cloudflare deploy token in that environment (his to add), and whether the site is civicsmith.org or civicsmith.dev (Cloudflare shows only .org).
5. Layer 12: plane 1066 and journey-check 999 were left at 18:01Z. When both land: layer merge 12, then the round-close run, then the findings as found marks (DEC-340 covers 518 -> 96 at journey-check's local walk), then round 2 under C39.
7. Watcher: none live. addresses/watcher.json names an archived session; ROOT starts a watcher only when none is addressed. Fix by tool change (an archived address reads as none) or a re-record.
6. Hourly check as before. The 18:53Z audit showed a process3 push gap of 5 (likely C40's split ledger; re-audit with both ledgers after C40 merges). For copy state, read with git from a clone, or ask BOB; never act on a product from your own session.

## Merge practice
As 8nov-c: a process3 worktree at the tranche; merge the head onto the tranche and run the suite (HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 node --test 'tool/test/*.test.mjs'); mark ready; `node tool/p3.mjs merge <n> --plain --rounds 1 --reviewed "..."` (timeout 1200 s). Pins: `pin move neobobkrause/<repo> --report <me> --why ... --pin <sha>`, then create_session with its JSON, then archive each when it reports.


# [file] bob_words_17nov_fresh_context_and_process_self_development.md

# Owner direction: fresh context tests and Process4 developing itself

**Status:** Verbatim owner message followed by a clearly separate interpretation for experimental planning. This is not approval to adopt new governing rules, change grants, modify CivicSmith2, or alter the existing Claude Code implementation.

## Owner's words — verbatim

> The bootstrap session has itself been running for an extended period that must hve involved multiple compactions. While the session may still be useful, we need to be realistic about the risks of continuing to rely on compacted sessions, whether this one or any other.
>
> So, yes, we need to run these experiments. I suggest that you give me instructions for a fresh session to run the tests. I also suggest that we prioritize trying to get process4 development to the point that its constructs can be used for its further development. It would be a more efficient use of calendar time, my time, and token costs if the infrastructure we in place for your work to continue as PROCESS, with lanes, as needed, used for continuing work related to context management, permissions management, inter-session communication and coordination, etc.

## Assistant interpretation (not owner words)

- The owner is concerned about **unrecognized compaction** in the old bootstrap, not asserting a verified event count. Preserve its work but validate claims from authoritative repository sources rather than treating its conversational memory as a trustworthy canon.
- Use a **fresh, bounded experimental session** to run the existing protocol: `process4/working/codex-context-avoidance-experiment-20261117.md`. Use only disposable fixtures. Distinguish native child capabilities from CLI documentation.
- Prioritize making Process4's **existing experimental implementation manage its own further development**, with a fresh standing PROCESS role and scoped design/research lanes for context, permissions, communication and coordination, subject to the owner's unchanged authority to approve governing process changes.
- A new independent chat is **not automatically** the runtime's registered PROCESS role. It may establish/coordinate the role through supported native tools only after verifying identity and supervision; preserve active bindings and do not create competing ROOTs or duplicate timers.
- Work autonomously, in parallel where source ownership permits. Keep a durable repository checkpoint for handoff and refresh before approaching the conservative 40% context guardrail. If current context occupancy is unavailable, **do not assert measured compliance** or an assurance of zero compaction.
- Do not assume Process4 is already self-hosting just because its PROCESS role exists. Demonstrate one genuine self-managed bounded development/research cycle before claiming the transition is complete.

Related: `../owner_words/bob_words_17nov_compaction_avoidance.md`, `../working/codex-context-avoidance-experiment-20261117.md`, `../working/codex-context-study-20261117/REPORT.md`.


# [file] 04-reads.txt

### ANCHOR: /** R72: a provider's refusal for a spent limit (Anthropic's 429
/**
 * A lens manifest's bundles as `bias` lists them or as the opener handed them; each entry's kind is `bias`' to fix
 * (the open records `{bundle_id, revision}` for each).
 * @typedef {unknown[]} LensBundles
 */
/**
 * R20: the lens in force when the run opened, as the open recorded it. Three forms: recorded and readable
 * (`recorded: true` with the lens fields); recorded and unreadable (`recorded: true, unreadable: true, stated`); not
 * recorded, a run opened before the open recorded it (`recorded: false, stated: "not recorded"`).
 * @typedef {object} LensAtOpen
 * @property {boolean} recorded
 * @property {boolean} [unreadable]  True only in the unreadable form.
 * @property {string} [stated]  The sentence of the two forms that carry no lens.
 * @property {boolean} [in_force]  Whether any lens was in force at the open.
 * @property {string|null} [statements_sha]  The hash of the statements in force at the open; null when none was.
 * @property {string|null} [scope]
 * @property {string|null} [scope_id]
 * @property {LensBundles} [bundles]
 * @property {string|null} [at]  The open's instant.
 */
/**
 * R20: the lens block of a run.
 * @typedef {object} RunBiasBlock
 * @property {boolean} in_force  Whether a readable manifest was handed at the open.
 * @property {string|null} stated  The sentence when none was handed or the handed one is unreadable; null otherwise.
 * @property {{scope: string|null, scope_id: string|null, statements_sha: string|null, bundles: LensBundles}|null} manifest
 *  The handed manifest as recorded, never recomputed; null when none was handed or it is unreadable.
 * @property {{in_force: boolean, statements_sha: string|null, bundles: LensBundles}|null} now  The lens in force now for the run's
 *  context; null when no manifest is readable and the open recorded no lens.
 * @property {boolean|null} moved  Whether the lens has moved: the open's against now where the open is recorded, else the handed
 *  one against now; null when either side is undetermined.
 * @property {"at_open"|"handed"|null} moved_basis  Which of the two comparisons `moved` is.
 * @property {LensAtOpen} at_open
 * @property {"in_force"|"stale"|null} hand  Whether the handed lens was the one in force at the open; null where the open
 *  recorded none or the handed manifest is unreadable.
 */
/**
 * R21, R86: the bar of a run. Never filled in.
 * @typedef {object} RunStandard
 * @property {boolean} in_force  True exactly when `basis` is `recorded`.
 * @property {StandardBasis} basis
 * @property {string} stated  The basis' sentence (run-rules' `STANDARD_BASIS`).
 * @property {{capture: string|null, connection: string|null}|null} pair  Only when `basis` is `recorded`; each axis trimmed, null
 *  when the pair names none for it.
 */
/**
 * R19: a run as `read` and `listInContext` answer it. (The requirements name `principal.ai` where this code answers
 * `principal.claude`: R19 as amended at T53, not yet met.)
 * @typedef {object} RunSession
 * @property {string} id  The run's id.
 * @property {string|null} label
 * @property {string|null} mode  A `RunMode` for every run `open` wrote; the column itself is nullable.
 * @property {string} status  A `RunStatus` for every run this module wrote.
 * @property {number} ticks  [bound ticks: a whole number of one or more]
