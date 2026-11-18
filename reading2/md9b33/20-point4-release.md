- The AI switch exists in Process3's configuration: README :171, "`ai` | `false` (default) or `true` once Bob has an AI account configured for the live walk (BD-R5, Bob, 9 Nov) ... A release walk clean with AI off is clean for the non-AI journeys only".
- All of this belongs to Process3's tool. The fifth draft replaces that tool with "a new small tool that does only this: push; open a pull request and mark it ready; merge; start the next job; send notifications; and write the shared state" (`v5:361`), and lists "the release path" under "Nothing is built for" (`v5:364`).

### 4.3 "Never built", sorted (J on the sorting; each item V or A as marked)

| Thing | State |
| --- | --- |
| Cutting a development release (package, tag, draft) | Built in Process3 as a workflow and a tool command (V). Never run on the product (V). Tied to Process3's tool |
| Signing a release with his approval | An older workflow exists and waits for him (V by reading the file; the GitHub setting itself not verified) |
| Installing a cut release on a test site the way a team would | Never built. Process3's tool says so itself (V) |
| Walking a cut release | Never happened (V: no record) |
| An install-from-scratch test and an upgrade-from-previous-release test inside the release workflow (his Foundations) | Never built (A, `v5:329`; consistent with the tool's gap text, V). Ended in the fifth draft |
| The upgrade test as a module's own test | Exists (V) |
| The step that updates the installer for a release | Never built (V: no workflow, no config entry). Today it is a hand paste in Cloudflare's dashboard |
| The step that updates the website page | Never built (V). Today the site is deployed "by Bob's approval in session" |
| Merging the tranche into the main branch on this product | Never done (V: main's tip is 1 Nov) |
| Any walk with AI on | Not in the deployment record (V); the stored walks carry 14 notes "not walked, the assistant does not work" (A) |

"Two things it needs were never built" in the combined audit (`process4_audit2.md:38`) means the run audit's two missing update workflows. The draft's "neither release test was ever built" (`v5:329`) means the two tests in the Foundations. They are four different things, and the install of a cut release on a test site is a fifth.

### 4.4 Who the fifth draft names to prepare a release

Nobody, in the body (V): "The process prepares it and waits for your approval" (`v5:193`). ARCH's duties (`v5:135`) list deploying ("has the product deployed to the development site") and say only that it "never ... publishes a release without you". A job "never merges, starts a session, deploys or changes the process" (`v5:137`). His act: "Approve a public release | Once per public release" (`v5:122`).

One thing the audits do not say: his Foundations do name a session. "deploying, releasing and acting on a live site are BOB's acts, not a job's" (`foundations.md:213`; BOB was Process3's architecture session), and the fifth draft's appendix counts that line "Kept as written" (`process4_definition_appendix_v5.md:370`). So a kept line of his names the architecture session, and the draft's body does not repeat it.

## 5. What is Bob's to decide, and what is technical

No recommendation is given: the audits do not choose, and I was told not to design. Costs are what the record supports; nothing here is an assurance.

### 5.1 Bob's

**1. What "a clean development release walk" means.**
- (a) The walk that ended the tranche. Cost to him: none beyond approving the release. Risk to a real team: they may be the first to run the real installer with this release, the first to upgrade a site that holds data, and the first to use the assistant.
- (b) A further walk, of a development release cut after the tranche. Cost to him: one more deployment and walk for each release; Process3's two deploy-and-walk runs took 59.5 and 63.6 minutes and both failed (V), and those walked screens, not journeys (A); the answer to question 2 below; possibly acts of his in Cloudflare if a test installer is needed (unproven; see 5.2). Risk to a real team: lower only for whatever that walk is actually made to cover; none of it is built or proven. One more thing he should see with (b): on 13-14 Nov Claude withdrew its own addition of "a walk on a copy installed with the real installer" as "a new test" (`process4_counterarguments.md:241-249`). Reading (b) is close to it. The difference is that "development release walk" is now his own typed phrase. Whether a further walk is an external walk of another deployment (the drift audit's judgement, A) or a fourth test is his to say, under his "three tests and no others".
- (c) The possibility in section 3: the thing deployed and walked in the tranche is itself a cut development release, so there is one walk. Cost: a release is cut in every clean round. Risk: as (a) for the installer and an upgrade unless the deployment is made through them.

**2. Does the 9 Nov sentence still stand: must a walk "with AI on" be clean before the installer and website are updated?**
- Yes. Cost to him: he connects an AI account to the deployment (his act, `v5:123`), the usage is charged to it, and the assistant's flaws must be fixed before any release; about seven to nine journeys have assistant steps. Risk to a real team: the assistant has been walked.
- No. Cost: none. Risk: a team with its own AI account is the first to use the assistant on that release. The last release before Process3 told members in its notes that the assistant was not part of it (V); whether a release must say so is his.
- Either answer needs a second one from him: the meaning of "without flaws" he agreed to counts a step left out as a flaw, so walks with AI on and off cannot both be clean in turn as worded (A).

**3. The upgrade of an existing installed site.**
- Left to the one module test that exists. Cost: none. Risk: it runs only when that module has a job; five releases broke stored data in the past (the test's own header, V). The decision record of 8 Nov has a session's sentence that "No installed site holds an older store" (`DECISIONS.md:114`); I did not verify whether any real team has an installed site today.
- Made part of what is walked before a release (the walked test site is upgraded from the previous release, not fresh). Cost: only possible under reading (b) or (c), and unbuilt. Risk: lower for the data the test site holds, and only that.

**4. Under reading (b): where do flaws go when the further walk finds some?** His words send an external walk's flaws "to the next round, not the next tranche", but the tranche has ended and been merged. Options (J): the release is not started and the flaws become work in the next tranche; or the tranche is not counted as ended until that walk is clean, which is his order of 8 Nov and against his words of 14 Nov. His.

**5. The journeys that begin at the installer or the website (1, 28, 29).** His words: the external walk confirms "that all journeys can be completed", and "installer and website are outside the tranche". Options: those journeys do not count toward ending a tranche and belong to the release; or they count from the step after the installer. If the first, and reading (a), they are never walked on a deployment at all.

**6. A tranche he ends by his word although it is not clean (the combined audit's question 2).** May a release start from it? If yes, "a release is always fully tested and walked successfully" does not hold for that release. His.

**7. His own acts on the release path, to confirm.** In the record and his approvals: approving each public release (through a protected GitHub setting that names him); adding a deploy token to that setting (a session's sentence of 8 Nov, `DECISIONS.md:109`); connecting an AI account. The fifth draft lists the first and third (`v5:122-123`), not the second. Which approvals text governs is also open: the product's main branch carries his short text of 1 Nov with no word on releases, its tranche branch his long text of 9 Nov, and the process repository his text of 2 Nov (V).

### 5.2 Technical: for Claude to decide and report

- Name the session that prepares a release (his kept Foundations line names the architecture session).
- Say in the definition what a development release is, once he has answered 5.1 item 1 (the requirements audit: restore the sentence from his Foundations).
- How a release is packaged, signed and recorded; whether Process3's development-release workflow is carried over or rewritten; how Process4's tool, which "does only" six things, starts a workflow.
- How a cut release is put on a test site. The known obstacle: the installer needs a person signed in to Cloudflare, and a test installer under another name would need its own sign-in registration there (`newgroup/DEPLOY.md:52-61`). Whether that can be done without him is unproven; if it cannot, it becomes an act of his and returns to him.
- Building the two update steps (installer, website page), and giving the workflow files an owner module so that a job may write them.
- The merge of the tranche into the main branch, never made on this product.
- Whether a session's browser can reach the test site, and whether one session can run a walk of that length (both unmeasured, A).
- Corrections owed in the draft: section D still says the readings are open; section K attributes the installer and website ending to "your words of 8 Nov" and to "Claude reads"; section P says when the AI journeys are walked "is not said" though the record says it; his fifth message is missing from section B; the 9 Nov sentence, removed from section P, to be shown again beside his answer.
- Stating in the definition, meanwhile, what a release has and has not been walked for (the drift audit's wording suggestion).

## 6. Wrong, stale or incomplete in the handoff and the audits

1. **"did not show you the 9 Nov sentence"** (`process4_audit2.md:110`; `audit2_corruption.md:202, 223, 358`). True of the draft as it stands now. Not true of the draft he answered: commit `d44304e` quoted the sentence in reading 3 and said "If so, nothing walks what the installer places." The session removed it in commit `6e7740b` when recording his answer. (V for the files; what he saw in chat is not recorded.)
2. **The handoff: "His statements of 9 Nov ... and 14 Nov differ on whether a release has a walk of its own."** They differ only under reading A. Under reading B, 9 Nov and 14 Nov say the same thing except for the words "with AI on" (J; the drift audit says the same at :216).
3. **The date of the "AI on" sentence.** The run audit says "Bob, 8 Nov" under BD-R3 (`audit2_feasibility.md:216, 222`). It is under BD-R5, "(Bob, 9 Nov)", `DECISIONS.md:121-125` (V). The combined document has it right.
4. **The number of journeys.** The requirements audit says 29; the script numbers 32 (V). The run and drift audits are right.
5. **"About nine need the assistant."** By steps marked for the assistant only, plus journey 4 by its title, I count seven (V, my rule); the auditor's wider rule gave nine. Not a contradiction, but the number is soft.
6. **"Nobody is named to prepare it."** True of the draft's body. His kept Foundations line names the architecture session, and the appendix counts it kept (section 4.4).
7. **"None of it is built."** The step that cuts a development release was built and never run; an older signing step exists; the upgrade test exists as a module test. What was never built is installing a cut release on a test site, walking it, and the two update steps (section 4.3). The fifth draft's "Nothing is built for ... the release path" is true for Process4's own tool.
8. **Attribution in the fifth draft, K** (`v5:331`): "(your words of 8 Nov)". They are a session's record quoting him (`DECISIONS.md:92`), not typed words in this repository.
9. **Which approvals.** The requirements audit quotes "cut, sign and publish development releases ... and install and upgrade them on development deployments" as "his approvals" (`audit2_requirements.md:143, 257`). That is the product's tranche branch (his website commit of 9 Nov), not `/home/user/process3/CLAUDE.md`, whose wording differs. Both quoted in section 2c.
10. **Small inconsistency inside the record of his words:** the 8 Nov quotation says "the civicsmith.dev website" (`DECISIONS.md:92`); his committed approvals and the journeys say civicsmith.org (V).
