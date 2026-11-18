# [file] k_evidence.md (later part)

- **4 Nov 16:55, narrowing to the "release path".** The coordinator proposed it and "Bob agreed to the release-path scope". Built as a list in the product's config, `"release_path": ["control-plane", "journey-check"]` (still there at the last tip), with the tool's rule "The release path first: next work tags the modules named in `release_path`". The coordinator attached its own number to it, "about 6 job sessions at most", which held work to about 6 of 20 for six hours and was "the coordinator's number recorded as Bob's agreement". Bob asked the next day "why did the coordinator silently limit work to about 6 jobs".
- **5 Nov 02:10** (paraphrase): "stop the current walkers and start the next layer while the process is updated."
- **5 Nov 01:55** (paraphrase): "deployment only at the end of a tranche, never between layers".
- **4 Nov 20:10** (paraphrase): "queue the trial for after the first dev release".
- **5 Nov 15:36** (paraphrase): Bob adds work: "BOB should start a UX design lane".
- **8 Nov:** "Finish, then switch" (layer 12 completes before the new round rule applies). BD-R3 and BD-R5 set the order of the installer build, the site build and the AI-assisted journeys.
- He also stopped and restarted everything by word several times (5 Nov, 7 Nov, 9 Nov).

I found no case of Bob naming one module's job to start ahead of another's. His reorderings were of kinds of work (release path, deployments, walks, a trial), not of modules in the order.

**(c) Options, with cost and risk**

1. **His word can add work but not reorder jobs.** New work is placed against a module and the rule starts it in its turn. Cost to Bob: none. Risk: something he wants soon sits behind earlier modules. With 65 modules holding work and 8 slots, a late module can wait many job-lengths.
2. **His word can name modules to go first; the rule reads that list.** The rule stays fixed and still gives one answer: ready modules he has named, in order, then the rest in order. This is how Process3's release path worked. Cost to Bob: a message naming modules. Risk: it needs a place in the record for his list and a way to clear it; in Process3 the list was two modules and was never cleared.
3. **His word can stop and restart, and nothing else.** As (1), plus the stop on his word that the draft already has.

**(d) Constraints**

- His own decision of 13 Nov orders jobs by module position. Option 2 is an exception to his own sentence, so only he can make it.
- "Only words the owner himself wrote count as his word": the 4 Nov case is the recorded failure, where the coordinator added a number to his agreement. Under option 2 the list must hold only what he wrote.
- The architecture session "does not choose which job starts next". Option 2 keeps that: it adds an input of Bob's, not a choice for a session.
- Changing the module order itself is not a way to reorder: the order is compiled into the product and "Moving a module that registers something can change what a member sees" (interface_and_cycle).
- A module's job that starts ahead of the modules it uses is already allowed by the draft ("It does not wait for the modules it uses to finish"), so naming a late module first breaks no other rule of the draft.

---

## What I could not find

1. **How often the ownership check fired,** and how many firings were false. The findings are in pull-request comments I could not read.
2. **The full text of Bob's decisions of 13 and 14 Nov.** Only the fragments quoted in the disposition and in audit D.
3. **Any use of "approval before a particular merge".** Searched the coordinator's log; absence in one log is not proof.
4. **A stored value of either health number.** None exists; the parts are above.
5. **The cause of the gap between the internal and the external walk on 8 Nov 23:50Z** (70 of 357 against 147 of 157).
6. **Any text of Bob's saying whose option the external walk is,** or what its findings open once a tranche has ended.
7. **Any measurement of two products on one account.** None ran.
8. **A number for the Claude account's weekly usage limit.**
9. **Any line of Bob's naming walk steps passing, or behaviour merged per day or per dollar, as a measure.**
10. **Whether the session-proposed environment route works for sessions that ROOT starts,** and whether its approval prompt can be answered while nobody watches. Observed only as tool descriptions in this session.


# [file] dot-versus-owner-front-door-feasibility-20261117.md

# Process4 first-class session feasibility: dot and owner-created front door

**17 November 2026. Status:** assistant research and proposed small experiments, not owner approval/adopted Process4 design. Builds on [Decision C](codex-first-class-feasibility-20261117.md). The owner supplied two options: use Dots if viable; or create one owner-visible front-door chat whose only role is communications conduit over Process4's existing session-message channels. No claim of direct runtime access has been tested.

## Official Dot evidence

- https://learn.chatgpt.com/docs/dots/tasks-and-memory — a dot can create **separate visible cloud threads**, send follow-up instructions, and run/coordinate background agents while owner talks with dot; owner can also open and directly steer created threads.
- https://learn.chatgpt.com/docs/dots — Dots gradual availability by plan/region/workspace. Eligible Pro/Business Premium delegated Codex use draws from ordinary Codex allowance; Enterprise charging may differ. Do not assume this account has Dot access.
- https://learn.chatgpt.com/docs/dots/computers-and-apps — Dot can use a previously prepared Codex Cloud environment for software work; owner can interact with the separate tasks.
- https://learn.chatgpt.com/docs/whats-new/dots-october-9-2026 — release notes say Dot can start and follow up Codex threads.

**Still not established:** account entitlement, account's own ordinary Codex sidebar listing, assignment to product project, general native inter-session message bus from unrelated Codex roles *to* Dot, peer-to-peer communication, trusted unattended relay of arbitrary Process4 messages, event-driven delivery latency, or original owner-facing independent session controls after completion. Documentation proves product possibility, not this account's end-to-end Process4 requirements.

## Owner-created front-door hypothesis

One **manually created ordinary, visible chat** acts as minimally stateful communications interface; standing roles and authoritative product/process state remain elsewhere. On each turn the front door reads compact checked routing contract and current role bindings, forwards exact owner wording, and returns correlated attributed replies. No product decisions, canon interpretation, grants, process adoption, or session-memory authority. Core message ID, recipient verification, approval provenance and transport live in deterministic tools/controller, not a model instruction that compaction could forget.

**Potential advantage:** front-door compaction does not directly discard binding canon if no authoritative decisions are stored only in that conversation and all relevant routing controls are reloaded and enforced on each turn.

**Critical unknown:** does a manually created top-level Codex session have a **supported** tool path into the existing bootstrap's child-only native messaging tree, including reactive idle recipient wake and return replies? Native followup previously worked only for addressable descendants within a managed tree; manually created peers are not automatically addressable. It may be easier for an owner-created console to spawn its **own** child tree, but that returns to a single-console UI rather than independent visible first-class role sessions.

**Compaction warning:** Even a conduit can mistransmit or fabricate authority after compaction. It is not enough that it remembers "I am the front door". Verify source reload and deterministic routing/authority checks each turn, especially exact owner approvals and pending messages. Use bounded prompts/turns and refresh where possible.

## Small decisive experiments

### Test 1: Dot visibility and continuation (only if account already eligible)

Have the owner start one dot using existing supported UI and supply one bounded prompt asking it to create **one read-only, independently visible Codex cloud task** in an already configured environment, capture the task URL/ID, and after task completion send a follow-up to that same thread. Owner checks ordinary Codex list and messages thread directly. Record whether the dot can respond to that direct owner turn and follow up later. No paid API, credentials, product writes or new grants. If Dot unavailable, mark ENTITLEMENT_UNAVAILABLE; no speculative alternative subscription purchase.

Then conduct a second gated **reactive inter-session** test: a different supported Process4 role tries to send a real identified message to Dot-created thread through a documented message method. Distinguish Dot's ability to follow up on Dot-owned tasks from general arbitrary peer access. If no supported cross-role interface, mark PEER_ROUTING_UNPROVEN even if independent creation passes.

### Test 2: Owner-created conduit to existing native roles

Owner creates **one independent test chat** (or use an already existing manually created test chat) and grants no new privileges. Execute one read-only addressed request to an actual *existing* Process4 role via a supported native tool; record canonical message ID, actual target generation, observed wake, role reply and correlated response. Verify no Github per-message write. Repeat after a completed turn. If the separate chat cannot access the prior agent tree, stop: **NO_SUPPORTED_CROSS_TREE_ROUTE**, not a guessed success. Do not claim typing a message in another chat or manually copy/pasting constitutes native reactive transport.

**Possible alternate scope, if owner accepts:** use newly owner-created console as sole root of a *new* native hierarchy. That can recover mediated interaction but does **not** satisfy earlier independent-first-class visibility of every role. Do not silently replace the earlier requirement with it.

### Decision grid

- Dot creates visible persistent tasks + Dot followup + owner direct interaction: first-class owner experience is demonstrated **for Dot-owned threads**. Inter-role reactive communication needs its own evidence.
- Owner-created conduit reaches existing role tree with attributed native reply: owner-console relay demonstrated without old bootstrap. Independent role-list presence remains unsatisfied unless owner expressly changes requirement.
- Neither works: existing Decision C stands; pause migration dependent on first-class session orchestration.
- No entitlement or no tool exposed: report a bounded blocker and exact minimal owner prerequisite, not universal impossibility.

Use existing subscription only; no separate Agents API, paid VM, purchased credits, credential reads, speculative login changes, or changes to CivicSmith2 and Claude implementation.


# [file] canon_analysis.md (later part)

| R24 | It works for projects large and small, for more than one product, and can move between accounts. | PLN-1, PLN-7, GAP-8 | Shims, onboarding measurement, the account-move rehearsal |
| R25 | Every text names its audience and speaks plainly. | TXT-7 | None |

Two of these purposes conflict as Process3 wrote them, and a successor has to choose. R2 gives the AI "everything technical", and R21 says nothing is added without the owner's word or a failure. In Process3 the set of checks was treated as technical, so R2 swallowed R21. Preserving both means moving one thing across the line: the content of the check set, and any change to the process during a run, become the owner's, like requirements. That costs some of R3.
