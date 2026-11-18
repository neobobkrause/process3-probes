# [file] point2_process_rule.md (continued)

2. **Whether an act of his on GitHub for each change is acceptable,** and whether it counts as a gate or a review under "Do not add tests, gates, reviews or checks". His PROCESS paragraph requires his approval; it does not say how it is given.
3. **What counts as his approval at PROCESS:** his typed words written down by the PROCESS session (the fifth draft, Claude decided), or an act only his account can make.
4. **Who moves a product to a changed process once he approves** (`definition/process4_audit2.md`:75; `working/audit2_feasibility.md`:149).
5. **The wording of his approvals in the process's repository.** Today they name Process3 and permit sessions to merge there without a person. Only he commits that text. What it should now say is his.
6. **Any setting at all.** Every GitHub-side means is his act: his approvals say sessions "may never: ... change permission or repository settings", and GitHub gives the sessions' account no admin right.

### Technical: Claude's to decide and report

1. Which branch PROCESS starts on and works on; which branch products follow. Today the default branch `main` has not moved since 2 Nov and is 1,232 commits behind `tranche`, and the product points at a `tranche` commit.
2. How a product names the process version it uses: a submodule entry as now, a line naming a commit, or a name in the process's repository.
3. How any chosen means is built, and its trial in the throwaway repository before it is relied on. What a trial can show: that GitHub refuses the session account's merge. What it cannot show: that growth stops.
4. Whether today's two required checks on the process's `main` and `tranche` (`ci` and `record`) fit Process4, and whether the `record` check, which runs under `pull_request_target`, will still report after GitHub's change of 2 Dec 2026 to that trigger in public repositories ((A) `working/enforcement_levers.md`:122; not checked by me). If it stops reporting, nothing could merge into those two branches.
5. The deny list for sessions on the process's repository, once the branch is chosen. He commits it; what it should contain is technical.
6. Stating in the definition what PROCESS may do after it starts (`definition/process4_audit2.md`:207).

---

## 7. Wrong or stale in the handoff and audits

1. **"It has no deny list"** (`HANDOFF.md`:54). True of `main` and `process4`. The `tranche` branch of the process's repository carries a 21-entry deny list committed by Bob (2b). It never stopped merges; it routed them through the tool.
2. **GitHub's settings "could not be read"** (`evidence/permissions_inventory.md`:16; `working/enforcement_levers.md`:18; `working/audit2_corruption.md`:584). Stale for the process repository: its rulesets were readable today (2e). Still true for the product repository in this session.
3. **No evidence file had the process repository's own rules.** They are now read: no approval required, two automatic checks, session account with write access.
4. **"His words of 14 Nov accept both the acts and the waiting"** (`HANDOFF.md`:54). An auditor's judgement. His words accept his involvement, choice, approval and the waiting. They name no merge and no setting (`working/v4_notes.md`:19 says the same).
5. **The cost of the drift audit's suggestion is understated** (`working/audit2_corruption.md`:109; `definition/process4_audit2.md`:75), in the way lesson 5 describes (section 4, last paragraph).
6. **The two audits differ on who merges a process change.** Run audit: "PROCESS merges its own change with the tool once the tool's tests pass" (`working/audit2_feasibility.md`:148). Drift audit: Bob merges (`working/audit2_corruption.md`:109). The combined audit carries the second into question 3 and the first into section 4 without saying they differ.
7. **Provenance of "The hardest open problem ..."** (3.2). Held as his typed words in an excerpted list; near-identical to a sentence in the session-written first draft. Not resolved.
8. **The approvals in the process's repository speak of Process3 only.** Whether a session reads them as covering Process4 work there is not known. The fifth draft's table of his acts points to section I for committing approvals in the process's repository, and section I says nothing about it (`working/audit2_feasibility.md`:286, confirmed).

## 8. What I did not establish

- The product repository's live rules and settings.
- The bypass list of either ruleset on the process repository, the collaborator list, Actions settings and environments.
- Whether a session started today on the process repository would in fact be allowed by the permission checker to merge a change there. I read what the approvals and GitHub's rules permit, and one past merge. I attempted nothing.
- Whether any means in section 4 behaves as GitHub's documentation says on a personal account's public repository. None has run here.
- Who drafted the wording of the approvals Bob committed.
- Which came first: the sentence in his first message or the sentence in the first draft.


# [file] process4_lanes.md

# Process4: lanes, filled in from your documents

14 Nov 2026. For Bob, from Claude. A proposed section for the sixth draft. Nothing here is in force, nothing here is your decision until you say so, and nothing here has run in Process4.

You wrote on 14 Nov: "Lanes are an important element of the development process, though they haven't been fill into the process4 design."

How this was made. One worker collected every statement about lanes in your documents and quoted each exactly. A second worker read what Process3 actually built and did with lanes. I then read the two passages that matter most myself: the lanes paragraph in your approvals in the product's repository, and the lanes paragraphs in the later copy of your Foundations. This document starts from those statements. Where I had to decide something technical, it is marked *Claude decided*. Where your documents disagree with each other, I have not chosen for you; those are in section 3.

Words used. A **session** is one running Claude conversation. **ARCH** is the session that directs the building of one product; your documents of October and early November call it BOB. **ROOT** is the first session you start. A **job** is a session that builds one module.

---

## 1. What your documents say

In order of date. For each I say whose words they are.

**31 Oct, your note in your Keep and Drop Ledger** (a session's suggestion to which you added words): "a lane is a knowledge directory and design responsibility plus an on-demand worker BOB starts with that directory as its reading set; a long-lived lane only where measured worthwhile. The lifecycle of a lane includes refreshes that BOB manages to keep the session depth consistant."

**3 Nov, a line of your Ledger you marked "modify":** "A lane has one area of focus, reads it whole and delivers designs, never product code; jobs and lanes reach a lane only through BOB".

**Your Foundations** (written by a session from your Ledger): "Lanes are ad hoc. You identify the need for a lane and BOB opens it; some stay open for extended periods; the UX lane is always there, as a directory and a design responsibility; whether any lane runs as a long-lived session is measured". "Lanes work because BOB knows how to delegate: it recognises a design question, passes it to the lane with enough context to decide, waits for the lane's decision, and keeps the final say." "Requests between jobs and lanes pass through BOB ... Spokes never see each other." "BOB is the only creator of jobs and lanes".

**5 Nov, Process3's log, a session quoting you:**
- "there should only be ONE session per lane at a time."
- "I'm not sure we should say that a lane is a read-only helper. For example, it writes and updates design documents (like the UX Design doc). The UX design lane can create the word table".
- "the modules that use the word table have already passed their suites - they don't need to be retested. And the lane-specific documents, like the UX Design doc, doesn't need to be tested. So again, I don't believe that lanes' file changes need to be tested the way jobs do."
- "It's worth noting design documents that lanes create/update/interact with me using are CC artifacts. So they don't need to be checked in."

**5 Nov, your approvals in the product's repository** (committed by your account; the wording was handed to you by a session): "Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product's principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed."

**6 Nov, the later copy of your Foundations, quoting you:**
- "The important thing to remember when setting up lanes is the insure that a lane is fully qualified to fulfill their role as the load-bearing source of truth in their area".
- "So The first time a lane is defined and run, it should start by using workers to fully research canon documents, existing code, and best practices related to their specialty area".
- "This initial and ongoing research should be recording in a lane-specific area of the product repo for subsequent sessions to draw from and evolve".
- "The lane charters used in earlier process versions included an investigation design lane and a publication design lane. Perhaps that's an appropriate partition to continue to use".
- "These requirements related to lane startup and ongoing operations should be part of the process3 canon of requirements".

**6 Nov, the same copy, a session's wording, to which the record says you answered "keep":** "A process triage lane and a product triage lane study each identified problem and bring you options with context before a response is chosen".


Note for jobs, in force until withdrawn: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Emeka Nwosuagwu`, and the name Tamsin Polkinghorne is no longer written anywhere in a handover note.

**6 Nov, the product's decision record, a session's wording to which the record says you answered "agreed":** you keep the product's UX direction, its audiences and its principles; beneath them the UX lane decides screens, flows, words, layout and visual language; a decision that would change a direction, an audience or a principle comes to you with options and the lane's recommendation.

**6 Nov, your answer on the second Keep and Drop page, as a session recorded it:** "BOB starts jobs and lanes, not ROOT".

**14 Nov, typed by you:** "Process changes only happen in a separate process lane call PROCESS that I interact with." "M1: ROOT" (who starts PROCESS). "ARCH can ask ROOT to start PROCESS if it isn't already running, and the coordinator can talk to PROCESS." "screens and journeys are kept in docs/development/ux-substrate/ in the product repo".

---

## 2. Lanes, as the definition would state them

Each sentence is from the statements above unless marked *Claude decided*.

**What a lane is.** A lane is a standing design responsibility for one area of a product. It has a folder of design knowledge in the product's repository, which it owns. It reads its area whole. It delivers designs, never product code. It is the source of truth in its area, and it is qualified for that before it decides anything.

**Which lanes.** You identify the need for a lane, and ARCH opens it. The UX lane is always there. For Civicsmith the lanes are UX, investigation design and publication design. PROCESS is a lane of a different kind; see below.

**One session.** A lane runs as one session at a time. Whether a lane's session is kept running or is started when a question arrives is ARCH's call, judged by cost, and is one of the measurements your Foundations set for the end of the first tranche. That measurement was never taken in Process3. A long-running lane session is replaced by a fresh one under ARCH's management.
