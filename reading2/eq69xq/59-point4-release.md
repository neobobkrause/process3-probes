# Point 4: "The release reads two ways, and none of it is built"

## For the owner, in plain words

**What you have said.** On 14 November you typed: "A release can (optionally) be started after a tranche completes. So a release is always fully tested and walked successfully." Also: "A tranche can end without an AI enabled run", "installer and website are outside the tranche", and "installer and site updates wait for a clean development release walk". Process3's decision record, written by a session and quoting you on 9 November, has: "Yes, the installer update and site update wait until a release walk with AI on is also clean."

**The two readings.** A development deployment is the product put on a test site in your Cloudflare account, straight from the branch it is built on. A development release, in your standing approvals, is a packaged, numbered test version that sessions may cut and then deploy.

- First reading, which the fifth draft took: "a clean development release walk" is the walk that already ended the tranche. Nothing more is walked.
- Second reading: after the tranche, a development release is cut, put on a test site and walked, and only then are the installer and website updated.

**What is left unwalked.** Under the first reading no walk covers the real installer placing the release into a Cloudflare account, an existing team's site being upgraded with its stored data, or the assistant working with a real AI model. A real team could be the first to use each. Under the second reading those are walked only if the further walk is made that way, and none of that has been built.

**What is proven.** Process3 cut no release of any kind, and all twelve of its recorded deployment runs failed (both verified). It built the step that cuts a development release, which never ran on the product. Its own tool says nothing can yet install a cut release on a test site, because the installer needs a person to sign in. The steps that update the installer and the website were never built. Nothing about a Process4 release is proven.

**One thing the audit got wrong.** It says the draft did not show you your 9 November sentence. The draft, before you answered, quoted it and said that under Claude's reading "nothing walks what the installer places." The session removed the quotation when it recorded your answer.

**Yours to decide.**
1. Which reading you meant.
2. Whether "with AI on" still holds before the installer and website are updated; it costs you connecting an AI account.
3. Whether an upgrade of an existing site is walked before a release, or left to one module's own tests.
4. Where flaws go if a walk made after the tranche finds any.
5. Whether the three journeys that begin at the installer or website count toward ending a tranche.

**Technical, for Claude to decide and report.** Which session prepares a release; how a release is packaged, signed and put on a test site; building the missing update steps; correcting the draft.

---

## 0. What I read, and what I touched

- Reading worker's report, 14 Nov 2026, second main session. Nothing here is a design. Marks: (V) verified by me today against a primary source, with the command or file:line; (A) an earlier auditor says so and I did not re-check; (J) a judgement.
- Read in full: `worker_rules.md`, `HANDOFF.md`, both files in `owner_words/`, `audit2_notes.md`. Read in part (by search, then the passages found): the three second-audit reports, `process4_audit2.md`, the fifth draft, its appendix, `DECISIONS.md`, `ledger_lines.md`, `foundations.md`, `process4_counterarguments.md`.
- Product repository clone: read `main` (the checkout), and fetched, read-only, the tips of `tranche`, `process-state`, `dist/cut-0.87.0`, the tag `v0.71.0`, and 400 commits of `tranche` history without file contents. Tranche tip read: `e7ec72e093014e59abcd736b9f8724bd57698b81` (9 Nov 2026 10:59 -0800). State branch tip read: `c4c252913b0727096a978c581016f362937c61c4` (9 Nov 19:05 UTC).
- Side effects of those fetches in the local clone's `.git` only (working tree and `HEAD` unchanged): one local tag `v0.71.0`, and `git config` now shows `remote.origin.promisor=true` and `remote.origin.partialclonefilter=blob:none`. I do not know whether those two settings were there before. Nothing was pushed anywhere.
- Process repository: read `origin/tranche` (tip `38b0f3f`, 9 Nov) with `git show`. No write.
- GitHub's API was not available to this session (403), so I could not read GitHub settings: whether the protected environments `release` and `p3dev-release` exist, who their reviewers are, or whether any draft release exists. Draft releases are invisible to `git ls-remote`.

## 1. Every finding on the release in the second audit

### 1.1 The combined document, `process4/definition/process4_audit2.md`

| Where | What it says |
| --- | --- |
| :22 (section 1, item 4) | "Five steps have nobody named to do them: writing new work into a module, moving a product to a changed process, deploying, preparing a release, archiving finished sessions." |
| :23 (section 1, item 5) | "The release. Your statements read two ways. Under the draft's reading the installer, an upgrade of an existing site and the assistant could first be used, unwalked, by a real team." |
| :38 (map row "The release") | "Run: missing. Drift: contradictory. Requirements: thin". "Nobody is named to prepare it; two things it needs were never built (measured); your approvals forbid sessions to change the installer and website; your statements read two ways." Needs: "Your decision (question 7); the build". |
| :57 (question 1) | "Every tranche's end and every release is measured against these" (the two walk documents). |
| :67 (question 2) | A tranche ended by his word "is either merged with its flaws, which sits against your 'So a release is always fully tested and walked successfully' (14 Nov), or dropped. Nothing says which." |
| :101-114 (question 7) | "Whether a release has a further walk". Quotes four statements (:105-108). :110: "The draft reads 'development release walk' as the walk that ends the tranche, never says what a development release is, and did not show you the 9 Nov sentence. Measured: three journeys in the folder's script begin at the installer or the website, and about nine need the assistant." :112: "Five earlier releases each broke existing stored data, unseen because every test began from a fresh copy (measured)." :114 options (a) and (b); "Either way a development deployment cannot complete the journeys that begin at the installer or the website." |
| :149, :151 (question 11, groups 3 and 5) | Duties "at each model release" and "the next process release" are about releases of the process or of the AI model, not of the product. Not this subject. |
| :188-189 (section 4) | "two places say three readings are still open with you, though you answered all three"; "The record does hold a sentence on when the AI journeys are walked (question 7); the draft says it is not said." |
| :193 (section 4) | "a tranche that may end with no AI run beside a clean walk that leaves out no earlier step" (two sentences that cannot both hold). |
| :208, :214 (section 4) | Named in a sentence only: "Who deploys, and who prepares a release."; "what a development release is". |
| :222 (section 4) | Missing from the unbuilt list: "the two release steps never built". |
| :238, :240 (section 5) | The trial on made-up modules "can show nothing about walks, deployment, Cloudflare's limits or the release"; only on a copy of the real product: "a release as far as your approval, the merge of the tranche into the main branch (7,339 commits, never made on this product)". |
| :274, :276 (section 7) | "The release part is still open (question 7)"; his words of 8 Nov on the tranche's end "Answered by your words of 14 Nov on the tranche and your three answers on the release." |

Section 6 ("No answer found") has no item on the release by name. Item 3 there (a walk step that fails for no reason in the product) would apply to any further walk as well (J).

### 1.2 The run audit, `process4/working/audit2_feasibility.md`

- :10 verdict: five steps with no actor, among them "preparing a release".
- :98, :100 (finding 6): the walker's local arm "walks journey 28 from the installer through the hand-over into the copy and on, then journey 3"; the deployed walks "ran on GitHub's machines"; "Whether a session's browser can reach the development site at all is unmeasured."
- :211-223 (finding 16, "The release has no actor, two of its workflows do not exist, and sessions are forbidden to touch what it must update"). :213 the fault. :216 "The product has no workflow for either yet"; "The scoped deploy token is Bob's to add to that environment"; and it dates the "AI on" sentence "Bob, 8 Nov" (wrong: see section 6 below). :217 `release-sign.yml` "exists and waits for Bob in a protected environment"; "The newest release tag on the product is v0.71.0 of 21 Sep". :219 "workflow files belong to no module, so under the job rule no job may write the two missing workflows unless ARCH gives those files an owner module." :220 "Stops the first release; does not stop a tranche." :222 best answer: "name ARCH as the one that prepares a release; give the workflow files an owner module; add the protected-environment token to Bob's acts; quote Bob's 8 Nov sentence beside his 14 Nov answers and ask whether it still stands." :223 "Needs the build; the AI-walk question is Bob's."
- :227, :232, :235 (finding 17): made-up modules "have nothing to walk, deploy or release".
- :252 (finding 19): the draft needs the tool, "or something", to "start a workflow (the release), deploy"; the tool as listed does neither.
- :284 row a: section D says the three readings "are still open"; section P says "You answered each".
- :290 row g: "A tranche 'can end without an AI enabled run'. After one walk with AI on, every later walk without it leaves steps out."
- :346: missing from the unbuilt list: "Who deploys; who prepares a release; the two missing release workflows".
- :382 map: "Release | Missing | No actor, two workflows that do not exist, sessions forbidden to touch what it updates; honestly marked unbuilt."

### 1.3 The drift audit, `process4/working/audit2_corruption.md`

- :42, :53, :64 (finding 1): the tranche's end "and so every release" rests on one session's sentence; "A release would then rest on it".
- :59: "a walk failure that is wholly a found mark already recorded and owed to a named layer does not block `release dev`" (a coordinator's decision of 8 Nov).
- :60: in Process3 the tool held the order: "tranche close refuses, in order, without a clean internal walk, a release and a clean release walk"; the fifth draft's tool does none of that.
- :118, :143, :154 (finding 3): "three of the journeys begin at the installer or the website, which you have put outside the tranche"; "'All journeys can be completed' cannot be true on a deployment that does not use the installer."; put to him "as a conflict between his own statements".
- :139: 63 failures "owed for three days, then excused for a development release".
- :156: a tranche ended on his word with flaws "would contradict 'a release is always fully tested and walked', or is dropped."
- :200-230 (finding 5, "A public release can carry the installer, the website page, the journeys that use AI and an upgrade of existing data, none of them walked"). :202 the counter-argument. :205-210 the draft's sentences. :212 his words it is measured against. :215 "'Development release' is a term of his own ... So 'a clean development release walk' has a plain second reading". :216 "all four of his statements hold together only if a further walk, with AI on, comes between the tranche's end and the installer update. The draft's reading is the one under which they conflict." :217 about nine of 32 journeys need the assistant; "14 notes 'not walked, the assistant does not work'". :218 releases 0.59.0 to 0.63.0 each broke an existing store. :219 "No release of any kind was cut in Process3; neither release test was ever built". :223 "it does not show him his 9 Nov sentence or the second reading". :226 "Do not choose." :230 "Bob's. It is what 'released' means."
