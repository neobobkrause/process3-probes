# [file] 06-methods-a.txt (continued)

  /**
   * R18, R82, R87, R89: a member's own run, dispatched at her own act under a credential minted for that segment.
   * In order, nothing sent on any: absent or invisible (`found: false`); `by` is not the run's member
   * (`AI_RUN_NOT_PRINCIPAL`); not running; a mode other than `check` or `plan` (`MEMBER_RUN_MODE_NOT_ADMITTED`);
   * withheld `AGENT_WORKER_UNBOUND`, `NAMESPACE_UNDETERMINED`; the group's keep-away (`AI_KEPT_AWAY`, relayed); an
   * account other than her own sign-in (withheld `MEMBER_PRINCIPAL_RUN`); the mint refused (relayed) or silent
   * (withheld `CREDENTIAL_RECORD_SILENT`). Then the call, answered as `dispatch`. No token is ever answered.
   * Throws: a RangeError for an `at` that cannot be read.
   * @overload
   * @param {MemberDispatchArgs} args
   * @returns {Promise<MemberDispatchAnswer|MemberDispatchNotFound>}
   */
  /**
   * @param {Partial<MemberDispatchArgs>} [args]
   * @returns {Promise<MemberDispatchAnswer|MemberDispatchNotFound>}
   */
### ANCHOR:     const withheld = (w, extra = {}) => ({ run, found: true, dispatched: false, status: row.status, withheld: w, ...extra,
    /** @type {(w: NonNullable<MemberDispatchAnswer["withheld"]>, extra?: object) => MemberDispatchAnswer} */


# [file] coordinator-handoff-8nov-c.md

# Coordinator handoff, 8 Nov 2026 ~12:50Z (session_018BhceevT1GvjFc4kfGk5jt)

Previous: notes/coordinator-handoff-8nov-b.md. Log: notes/coordinator-findings-3-4nov.md, entries 08:47Z to 12:36Z 8 Nov.

## Addresses
ROOT session_018BhcefMKiLuojtdyeh1nzG. BOB (new, since 11:51Z) session_018BhcegCnnPxsYfe31RVw9N. Watcher session_018BhcegBeapVuoF7cgLpEeR. Builders: ef7 session_018Bhcef7TXuVjVZ4eN1SCzE (free after C36), ef1 session_018Bhcef1pxNYJCcaejqj138 (on C37). Lanes as 8nov-b.
My scheduled tasks, bound to me (rebind to yourself, then delete mine): hourly trig_012GSdM8BGaux88ZqnFpdSCb (:51); Phase 1 survival trig_01KzwTRZ3HtPS9xn2R4TupLF (16 Nov 17:00Z); Phase 2 survival trig_01748Nw6C2X5vtCRFkhAgvP2 (18 Nov 17:00Z). Probes' process/config.json coordinator is me (probes PR 255): set it to yourself by a plain PR, merged with the merge tool --plain --rounds 1 from the probes clone.

## State
Pins: copy and probes at process3 fb22f30d (C36 and PR 263). Copy layer 12 (the completion round, opened 09:04Z; stop ~2026-11-09 12:40Z) synced to fb22f30d (copy PR 1036).
Round 2 items: the 9 at open plus CR2-11..32. Deferred: CR2-15 (REQ-6 split of screens-daily, before its next job; cap stays 70000 until set before the second tranche), the DEC-504 words per module (next round), inquiry F3/IV-1 (next round). CR2-28 (the group slug) was dropped as a false positive; CR2-28 was then reused for membership (a just-joined admin's role is inconsistent; one authority per K5563; canon silent -> Bob, REQ-5).
Landed in layer 12 (about): interface-assets, leg-earning, inquiry (1028, CR2-20), ai-runs, hypotheses (1005), screens-daily, case-authoring (1026), affordances (1020), 1024, 1027. In flight at handoff: 1021 op-declarations (revert exemption recorded by me, comment on the PR), 1033 plane, 1019 screens-inquiry, 1008 interface-shell (land loop), 1030 membership (sync first), 1025 hypotheses CR2-19 (publish after 1020), 1029 interface-assets CR2-21, journey-check 999 (re-measure after 1008; then CR2-27 to interface-shell with CR2-22 in one fresh `job start`), provenance 1002, copy PR 1032 (the hypotheses->steps uses edge, CR2-29/30/31/32 in the completion file; gate pending, then BOB joins and starts CR2-30/31/32).

## Open acts for you
- C37, process3 PR 265 (ef1: a job branch older than its module's newest layer land reads stale, not BLOCKED). I reviewed it: suite 1188/1188 merged onto the tranche. Merge once ef1's cold review is clear (`merge 265 --plain --rounds 1 --reviewed ...`), then pin copy and probes (`pin move ... --pin <40-hex>`, create_session from its JSON, archive each on its report).
- After each copy pin: tell BOB `layer sync 12` (SLB-12) before further lands.
- Hourly: the idle capacity line. BOB left startable jobs unstarted twice today (18 min, 45 min); nudge at once with the list.
- BD-1 question: if BOB finds BD-1's text reserves uses edges, put it to Bob with the quote; otherwise the edge is BOB's (my ruling 11:28Z).

## Decisions of mine today (DECISIONS.md on process3 tranche)
PD-13 (run the GitHub hook by hand where it didn't load, PR 257), PD-14 (an item added to an open completion round joins it, PR 259; plus later items for a module already in it, PR 262). Tool changes merged: C34 (hook-loaded check, PR 258), C35 (completion join, 260), C35b (more items, 261), 263 (item ids in status), C36 (ledger base after merging the layer, 264).

## Merge practice
As 8nov-b. Connector calls: pipe their JSON to `node tool/hook.mjs` from /home/user/p3-tranche first (PD-13): my session's hook did not load.


# [file] bob_words_14nov_b.md

# Bob's own typed words, 14 Nov 2026, second message of the day to the main session (verbatim, complete)

The throwaway repo that you need already exists: process3-probes.

A tranche ends after a successful external walk of a development deployment. So a deployment is a step in a tranche. But if flaws are found during an external walk those flaws are added to the next round, not the next tranche. So a tranche only ends when an external walk (of a development deployment) completes without flaws. A release can (optionally) be started after a tranche completes. So a release is always fully tested and walked successfully.

Yes, a job writes its own tests. That's an important responsibility. It's also a challenge because tests must be complete yet fast and efficient.

An internal walk uses the UX Screens document to confirm that the workflow matches the definition. The external walk follows the UX journeys to confirm that all journeys can be completed successfully to produce proper results.

You say that most job starts are likely to be caused by notices that turn out to need no change (an estimate from a simulation, not a measurement). Explain what you mean.

You also say that ehe line between correcting the process and adding to it cannot always be drawn. Explain what you mean.

You say that the narrower trigger in the draft, “the interface changed”, would have missed 5 of the 241. You say that you have replaced it with the wider wording, which missed none on this record. When you change something I defined you need to describe the PROPOSED change in words I understand so that I know what you're proposing and whether to approve the change or not.

You say that 122 pairs of modules depend on each other through tests without declaring it. Why are there so many cyclic references in the tests - just laziness? How do these errors get corrected?

Are you saying that 71% of job merges change an interface? How was that measured? How certain are you that the test of an interface change is correct?

Process3 never finished a tranche because it kept adding test after test so that it stopped making progress before it could finish. 

You say that several things are left as “to be settled when built” with no mechanism named. What are you talking about here?

Lets be clear about how the process is changed (and how it's not changed). Process changes only happen in a separate process lane call PROCESS that I interact with. Though process changes are often technical and detailed, the PROCESS session will explain the nature of the problem and suggestion options for fixing it for me to explore and ultimately choose. Because updates require my involvement and I might be away from my computer for extended periods, there could end up being more than one change being proposed in the PROCESS session at a time. When that happens, the set of changes are considered together as a group that could potentially have interactions and implications between. The process after a proposed change is made must continue to meet the process4 requirements (or the requirements changed with my explicit approval). The transition from the process a product is being built using to the updated process will be done only with my prior approval, with PROCESS proposing the best and least disruptive means of making the update.

You can create a subtree in the process3 repo for the container being used to update to process4.

# Earlier own typed words of 14 Nov (first message), the working rules
- "Talk to me in plain words. No codes, no shorthand, no references to things I have not seen. I have not read your working files."
- "Decide technical matters yourself and tell me what you decided. Bring me only what is mine to decide, with what it is, why it matters to me, and your recommendation."
- "Only words I wrote count as my word. Never record your decision or your summary as mine."
- "Do not assure me that something will work. Say what is proven and what is not."
- "Do not add tests, gates, reviews or checks. Process4 has three tests, ever."
- "Keep your context under 70%. Do the heavy reading with workers."
- On the first draft: "it states Process4 in plain words, including my decisions of 13-14 Nov"
- "The hardest open problem: today nothing physically stops a session adding a test or a check to the process. That rule exists only as text, and in Process3 text alone did not hold."


# [file] coordinator-handoff-5nov-e.md

Process3 coordinator handoff, 5 Nov (e), ~07:25 UTC, from session_018BhcecFLE3NZJnVDC127ku (Bob's account "Sparky", GitHub as civicsmith). Bob is the owner; his words are instructions. Read with notes/coordinator-handoff-5nov-b.md (rules, Bob's words), the speed rules in notes/coordinator-handoff-5nov.md, and notes/coordinator-findings-3-4nov.md from "# 5 Nov, coordinator session_018BhcecFLE3NZJnVDC127ku" down.

WHY THIS HANDOFF
- Bob saw permission dialogs all through this session. Cause, as far as known: this coordinator had three repositories attached (process3, the copy, the probe) and did outward acts itself (session starts, task creates and deletes, pushes and merges into the copy and the probe). Auto mode stops on those. A one-repository session also reads the repository's committed .claude/settings.json; a three-repository session does not.
- So: the new coordinator runs with ONLY process3 attached. It does not attach the copy or the probe. Copy and probe acts go through the roles (BOB merges and starts jobs, ROOT starts roles) and through short sessions started on that repository (coordinator id, pin moves), as the process was built. Bob was offered, and has not yet answered, allow rules in process3's .claude/settings.json for the coordinator's routine acts (his standing approvals forbid sessions to change permission settings without him).
- Ask Bob which session titles show dialogs. If BOB, the MERGER or job sessions show them too, the cause is wider: look before changing anything.

START, in order
1. Record your id as `coordinator` in process/config.json on the copy's and the probe's tranche, each by a SHORT SESSION started on that repository (source_url the repo, clone_depth 1, from tranche): its prompt edits the one field on a branch p3/coordinator-<x>, opens a PR into tranche, runs `node .process/tool/p3.mjs merge <pr> --plain --no-review "one-field coordinator id change"` and reports back. Copy PR 448 and probe PR 224 are the pattern.
2. Move my scheduled tasks to yourself (list_triggers; create the same prompt bound to you; delete mine): hourly flow trig_01K1C44kP7orMgaFwUEeXLoM (:51), review-trigger check trig_01TYsmhr38k7MdTote3hm7Z7 (5 Nov 19:00), merge-train report trig_0117LM8PADy3UZh1V162srvV (6 Nov 04:50), survival reads trig_01MX1uVwo4NPdwNFNRHrRMYk (16 Nov 17:00), trig_01VhfvTC7zXsJdwAQoSZdxBr (18 Nov 17:00). Delete my check-in trig_01AkGDwHoJeV1jKYJoJomeCg if it has not fired.
3. Tell ROOT, BOB and the MERGER your id once config names you. Archive me.
