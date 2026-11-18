# [file] codex_context_fidelity_research_handoff.md (continued)

8. Verify inactive chat archive, transcript retrieval and unarchive, and separately test support for native subagents. Completed short-scope workers do **not** need to stay alive after assignment completion.

## Source vs platform evidence

The assistant-generated standalone Markdown research report in the originating chat, named `process4_context_fidelity_research.md`, is not automatically present in an independent session's workspace. The owner can attach it if necessary. Do not claim to have read it unless supplied.

OpenAI documentation starting points (verify current contents):
- https://developers.openai.com/api/docs/models
- https://learn.chatgpt.com/docs/config-file/config-reference
- https://learn.chatgpt.com/docs/agent-configuration/agents-md
- https://learn.chatgpt.com/docs/hooks
- https://learn.chatgpt.com/docs/developer-commands
- https://learn.chatgpt.com/docs/agent-configuration/subagents

All output belongs to experimental process research, not product development: do not change CivicSmith2, `main`, owner grants or any existing Claude Code runtime/configuration.


# [file] coordinator-handoff-6nov-c.md

# Coordinator handoff, 6 Nov 2026 22:05 UTC (session_018BhcecWcETw22rxhPvoZ53)

Full log: notes/coordinator-findings-3-4nov.md, entries from 15:40. Bob's words are quoted there ("BOB'S WORDS", "BOB'S DECISION").

## Situation right now
- GITHUB: the account civicsmith was SUSPENDED at 19:19Z. Bob sent GitHub support a request; no reply yet. At about 22:00Z Bob added **believeinoakland** (his original individual account) as a Write collaborator on the copy, process3 and process3-probes, and pointed Claude's GitHub connection at it. Verified: gh api user = believeinoakland; push=true, admin=false on all three; my notes pushed. I advised Bob that a personal account doing machine work is a terms-limit and evasion risk, and suggested he tell support in his ticket that he's temporarily on believeinoakland, paced to GitHub's limits. His call.
- RESTART ORDER (everyone holds until told; ONE push at a time; no polling under 30 s; stop on any 403/429):
  1. R17 GitHub pacing (builder session_018Bhcef1pxNYJCcaejqj138, build/github-pacing FINAL 67bea87, 1000/1000; review: 3 high + 6 medium fixed; known limit: process3/probe sessions do not share the account budget, ruled acceptable for now, revisit as own process-state after record.yml branches-ignore): got GO at 22:05 to push, PR, ci; I merge it (merge --plain --rounds 1 --reviewed ...). Then a COPY PIN MOVE 5 carrying R17 (short session as for pins 2-4; a session prompt template is in this conversation's pattern: checkout tranche, move .process, setup check --at HEAD, plain PR, merge --plain --no-review, report). Then BOB runs `layer sync 9` (SLB-12).
  2. BOB (session_018Bhceff4p3dNtYx3XNk4CX): finish layer sync 9 (PR 708, job-branch step), then push 697 filing-templates, 698 actions, 699 action-holds (don't land 699 on its old tip), then bob/generated-row-member-roster-order fdea4aa808 and bob/regen-member-roster-order 8bf6f2f9f2, then lanes. 700/701 had nothing unpushed. Then land layer 9 in order and `layer merge 9`.
  3. Builder session_018Bhcef7TXuVjVZ4eN1SCzE, one PR at a time: build/r8-classifier ec0ef34 (export reader regex literals; new test file additive unless it names a Provides req whose source changed; then RE-RUN the classifier on layer 8's 7 breaking verdicts and copy 696, and report flips), build/stale-generated 9dda2f9 (stale committed generated file is a gate finding, base-stale a notice, layer merge refuses; plain PRs regenerate; ruling (A) refresh may sit beside modules/layers/config/records; CHECK the copy's generators are deterministic before merge), build/layer-prestart 6f2daa3 (R14 1b next-layer early start). Then rest of R14 (fill list, utilization target, ETA from R9 times).
  4. Builder ef1pxNY after R17: build/switch-ready f4d7ec8 (R16 account-switch readiness; rename civicsmith→"the process's GitHub account" in docs/canary first).
  5. Re-enable scheduled tasks once R17 is pinned: ROOT sweep trig_01HBGHt8e2s7qwtHsNoiphgs and my hourly trig_017zoER3MZgcwCCaPXex3Y4C (both switched off at 19:18). Tell ROOT (session_018BhceduipEp2mmEFHN9Diu) access is back; it skips sweeps until told.
- Backups: all unpushed work is in git bundles in each session's /tmp (verified). My notes bundle is also in Bob's Drive folder process3-suspension-backup-2026-11-06 (id 1bD59vB-JvUswx8Xehih7k211YcnDiGV6). Other sessions correctly declined Drive (not in their approvals).
- Account weekly usage reads "allowed_warning" (resets 7 Nov 11:00Z). Bob watches it and will say when to prepare an account move (R16 is the runbook).

## Layer state
- Layer 8 merged 18:41:41Z (copy 691), 4.64 h. Layer 9 opened ~18:47 (13 modules; jobs 696-701; 696 action-records landed c06702976d). Copy pin is process3 d18ef1b (pin 4, PR 707). Census clean.
- R8 classifier bug (fixed locally, see above) caused needless reschedules of actions/action-holds and 6 later-layer notices: BOB starts no extra jobs from those notices until the fix is pinned.

## Process3 merged today by me
192, 190, 193, 197, 194, 198, 195, 196, 200, 201, 202, 203, 204, 191 (incl. 199). Tranche d18ef1b.

## Bob's decisions today (product, recorded by BOB as BD-n in the copy)
F1 → publication lane designed same-sitting NS_DOCKET filing; scheduled editions signed at scheduling (no format change); provenance per sentence in signed bio-case-document/11; call 1 = C (member declares + signer affirms), per-sentence AI detail is an overlay available but not visible by default; call 2 = A (keep split). BD-6 trust and transparency principle (follow EU direction voluntarily); BD-7 AI disclosure at first exposure; BD-8 review standard: no contact address — a "How Civicsmith uses AI" page + responses via the docket (BD-11); BD-12 the name is "Civicsmith". Lanes: investigation, publication (= ACTIONS-DESIGN area), ux; all must qualify (SES-19..23).

## Process rulings and canon added today (Bob's words where noted)
SLB-12 layer sync after any pin move while a layer is open (Bob); P24 self-expiring records (Bob); P25 anticipate refusals / census (Bob); P26 account switch rehearsed (Bob); P27 conform to GitHub's published limits at 80-90%, obey rate-limit signals (Bob); capacity fill / early starts objective (Bob, R14); lane qualification SES-19..23 (Bob).

## Lessons
- Estimates: my hand ETAs ran short then long; use the tool ETA (R14) when built; log and score every estimate.
- A pin move does not reach an open layer branch (gate runs the base's tool): layer sync.
- Volume: 1,387 state pushes in 19 h plus PRs/polling on one account is what likely got civicsmith suspended. Stay paced.

## Open for Bob
- GitHub support reply (civicsmith).
- Whether to tell support about the temporary believeinoakland use (recommended).


# [file] coordinator-handoff-9nov.md

# Coordinator handoff, 9 Nov 2026 ~03:55Z (session_018BhcedocxexhtJW2Rz2gdo)

Previous: notes/coordinator-handoff-8nov-d.md. Log: notes/coordinator-findings-3-4nov.md, entries 19:12Z 8 Nov to 03:55Z 9 Nov.

## Addresses
ROOT session_018Bhceg3m4o8qXzgi9JC4Ux. BOB was session_018BhcedsAGpicjoH84dSXRZ, handing over to a fresh BOB at ~03:25Z (read `address bob`). Watcher session_018BhcefG1j3sNc5UxYXrgdK (daily 11:17Z, trig_01LpPRjtUY8Gwa1Ji165hFkb). Lane ux session_018BhcefJXoCL3spfVV8dnjK kept (round 2's CR2-23..27 rest on its DECs).
My tasks, bound to me (rebind to yourself, then delete mine): hourly trig_01GELGk3h7UwbjTNyaKdEMDi (:51), Phase 1 survival trig_0164Jo1hrgfyunxvk72eMQsZ (16 Nov 17:00Z), Phase 2 survival trig_011VvFsZ7EfRDsKjKGNLFic6 (18 Nov 17:00Z), Cloudflare release token expiry reminder trig_019fiTs6zwJzGjYyuGgfjmja (25 Oct 2027).

## Bob's decisions since 8nov-d (DECISIONS.md on process3 tranche)
- BD-R3 (PR 275): installer-update workflow built only after a clean internal walk; site-update only after clean external walks.
- BD-R4 (PR 276): migrate-released covers only the last 3 releases.
- BD-R5 (PR 279 + 280): first release walks run without an AI account (AI-assisted steps 'not walked'); AI configured only after non-AI journeys are clean; installer and site updates wait for a clean AI-on release walk.
- Bob also: release deploy token added (Cloudflare account token 'civicsmith-copy release deploy', 1 year) in the copy's protected GitHub environment **p3dev-release** (not 'release'), secret CLOUDFLARE_API_TOKEN, variable CLOUDFLARE_ACCOUNT_ID; neobobkrause required reviewer. Site is civicsmith.org (civicsmith.dev registered, no site). Naming: "layers are in rounds which are in tranches".
- Mine: PD-16 (PR 277): round close is the internal walk only; live walk only on the release after a clean internal walk; walks parallel within Cloudflare limits. PD-17 (to record): rehearse new process paths in process3 (C46's round-loop test, the probes) before the product uses them.
- Bob: "I don't do stuff like that, you do it" (housekeeping PRs are the coordinator's).

## Merged in process3 tonight
C40 (274), C43 (278: walk round; walk concurrency block, live default min(cap, CPUs); walk.ai/{assistant}), C44 (281: owed reopens; --covers; PD-16 set-aside), C46 (282: `round next`; naming 'tranche · round · layer m (internal n)'). Decision PRs 275-277, 279-280.
Pins: copy at 544f5089 (C43+C44; copy PR 1083). Probes at a6bd8f11 (pushes from coordinator-started probes sessions are refused by the auto-mode classifier; Bob runs probes pin moves from his own session in Accept-edits mode; prompt template in notes/probes-pin-for-bob.md).

## Open acts for you
1. C45 (light gates for record-only and pin-only PRs), builder session_018BhcegrFHtZ2VbgqoV26We: was idle 03:14-03:51, nudged. Review (fail-closed classification; no real code may skip its suite), merge, then ONE pin move of the copy to the tranche tip carrying C45+C46. Then tell BOB `round next` exists for the next round close.
2. Round 2 (tranche · round 2): layer 1 open (internal layer 13) with jobs bundler PR 1086, file-scanner PR 1087, reader-container PR 1088 (older found marks). Layer 11 next: interface-shell DEC-340 (owed reopen, covers 96), plane F1 (BD-R4 + speed fixes B-D; PR 1084), journey-check F12 (parallel walk pool; PR 1085; must forward --concurrency and --assistant, p3dev-walk-setup.mjs:197). Config PR 1089 (walk.cloudflare_plan paid, argvs) merging. Then the round's internal walk (round close = walk round).
3. Plane suite: report the first measured gate time after plane F1 lands (Bob asked).
4. Audit oddity: start/coordinator-4nov@7d1c763 (00:53Z, pushed with the tool) missing from the ledger; one raw push of mine at 23:49Z noted. Check whether the tool's ledger write from a clone with no process/config.json is reliable.
5. Record PD-17 in DECISIONS.md.
6. p3dev-l12 resources (walk deployment of round 1) still up: a teardown when convenient (development deployment; the product's approvals cover it; via a copy-rooted session).

## Practice
Merge: worktree at the tranche, merge the head, run the suite (HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 node --test 'tool/test/*.test.mjs'), then `node tool/p3.mjs merge <n> --plain --rounds 1 --reviewed "..."` (timeout ~1200 s). Pins: `pin move neobobkrause/<repo> --report <you> --why ... --pin <sha>`, create_session with its prompt, archive when it reports. Push notes only with the tool's `github push`. Product acts only through product-rooted sessions (BOB or short sessions).


# [file] 02-open.txt

### ANCHOR: /** R72: a provider's refusal for a spent limit (Anthropic's 429
/**
 * One declared bound of `open`'s `bounds` (run-rules R3, `checkConsume` in list form).
 * @typedef {object} BoundDeclaration
 * @property {RunBound} bound  Any `RunBound` but `lease` (`AI_RUN_BOUND_PLANE_COUNTED`); another word is `AI_RUN_BOUND_UNKNOWN`.
