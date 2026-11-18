# [file] trust-layer-review-4nov.md (continued)

and the six-step honour test.

E. **Base-red tolerance** (gate.mjs:186-200; basered.mjs, 114 lines; revertCheck `tolerated`
gate.mjs:526-547; receiptAgrees base-red branches :296-303; job.mjs callers). Protects a PR
from failures already on the base. Under A's rule the tranche is green at every tip, so
base-red only covers flakes and drift. It can go once A holds; until then keep it. Highest
risk to throughput, so ranked low.

F. **Records-only fast paths for a ready job PR** (gate.mjs:124-152 sinceGreen, stands,
receiptRun; :309-320 measuredBy; :254-256 refresh carry-over; :266-275 receipt measured;
merge.mjs:299-306 unagreed). Protects gate minutes on records-only pushes. Three review rounds
(copy PRs 105, 247). General rule: a ready job PR's gate always runs its module's suite; keep
the record fast path only for drafts and plain PRs. Cost: one suite run per records-only push on
a ready job PR, which merge's merged-result push mostly triggers anyway.

G. **Generated-file refresh by a plain PR** (gate.mjs:120-127, :240-262; checks.mjs:96-120
refreshOthers, refreshCheck; merge.mjs:573-584 refreshGate, :646-662). Protects committed
generated files from hand edits. Five review rounds (PR 95). General rule: no module's generated
file is committed. JOB-8 already forbids a job committing one (checks.mjs:70 committedGenerated),
and buildGenerated (gate.mjs:172-179) builds untracked rows before the suite, as deploy and
release do. Extend JOB-8 to every PR and the refresh route goes. Bob's 4 Nov approval for the
design stream already allows "stop committing a generated file ... and have it built where it
is needed".

H. **Found marks in a requirement file by a plain PR** (merge.mjs:633-645; found.mjs:51-89
foundOnly, a markdown diff parser). found.mjs already has a second home for marks,
`process/found/<module>.md` (found.mjs:15-17), which is a records path. General rule: found
marks always go there. The exception and foundOnly go; the module's requirement file stays
job-only.

I. **Close workflow changes, rules 1 to 3 and shapes S1 to S3** (workflows.mjs, all 296 lines;
merge.mjs:504-516 the `close` branch). See section 3.

J. **Approvals and settings across merges** (record.mjs:105-123 introduced with guarded and
judged; :259-283 landed, onTrusted, cleanFrom, mergeBases; :322-333 fromTrusted, carried
"review A"; :52-71 ownerBlock per ref). Protects O2 for merge commits that carry an old block
from one side. See section 3, item 2.

K. **Anchored config keys** (anchor.mjs:8-59 keyAt, keySetAt, unanchored; :81-95
mergedUnanchored, a merge-tree composition check; merge.mjs:473-489 pinChange). Protects O2 for
process_repo, tranche and approvals. Duplicated: record.mjs:362-376 judges the approvals key in
the config again, per commit, with its own JSON reading. See section 3, item 3.

L. **Size waiver** (record.mjs:350-355, :388-401). Oversize blobs up to 2x the limit are waived
when the head is within it. Reasonable and small; keep.

M. **Shallow cuts** (record.mjs:232-236, :298-305). Keep: fails closed, 10 lines.

N. **Draft read live** (gate.mjs:85-101). Keep: small, fixes a measured race.

O. **mergeRowSince rerun path, job cost rerun** (merge.mjs:25-29, :140, :197-218). Not trust;
bookkeeping. Out of scope, noted for the next simplification pass.

## 3. Allowlists of exact shapes or hashes instead of parsers

1. **Workflow YAML (workflows.mjs).** It reads YAML as lines with an LCS diff (`hunks`,
   :69-93), detects run blocks, path lists and matrix rows by regex (:104-149), and judges each
   hunk (:152-188), plus plainText for line-break tricks (:50-64), plus rule 1, which walks the
   tranche's first-parent history and binds each commit to a gated PR (:190-281). It took four
   rounds on PR 98. S1 already allows any shell inside an existing `run:` block, so the
   security it buys is "no new key, job, permission or event", which a frozen file gives too.
   Proposal: freeze every product workflow file. Each must equal the pin's shim, or a blob hash
   listed in an owner-set allowlist (a file only Bob's website commit changes, like the
   approvals). Product logic that changes moves out of YAML into scripts the frozen file runs
   (`run: ./ci/<name>.sh`, owned by a module, gated as code), and matrices and path lists into
   a JSON file read with `fromJSON`. Same reach as S1 to S3 today (arbitrary commands, no new
   jobs or permissions), no parser. Removes workflows.mjs (296) and the close branch of
   workflowChanges (about 10). One migration on civicsmith-copy, through PRs.

2. **Approvals block and .claude/ settings (record.mjs).** Judged per commit, with special
   handling for each way a merge can carry an old version. What lands on a trusted branch is
   the head's tree, and process-record on push is advisory, so the per-commit walk does not buy
   O2 for trusted branches. Proposal: judge the net state. For each guarded path (approvals
   block, .claude/**, .mcp.json, config approvals), the head's version must equal the trusted
   tip's (base, origin/main or origin/tranche), or the newest first-parent commit that set it
   must be the owner's website commit. Keep the per-commit walk only for size and transient
   paths, which history keeps. Removes introduced's guarded logic, cleanFrom, carried, landed,
   mergeBases and most of ownerBlock: about 120 lines. The "approv" word heuristic on any
   CLAUDE.md line (record.mjs:358-361) is a markdown parser of intent; under the net rule,
   any change to an instruction file outside its owner-set version could need the owner's
   commit instead, which is one blob comparison.

3. **Anchored keys (anchor.mjs).** Move process_repo, tranche and approvals out of
   process/config.json into their own file (process/anchor.json). Rule: its blob at the head,
   and in the merge-tree result, equals the base tip's blob, or the commit that last set it on
   the head's first-parent history is the owner's website commit not already in the base.
   Blob comparison replaces keyAt's JSON reading, duplicate-key handling and per-key loops, and
   drops record.mjs's duplicate config-approvals check. About 50 lines.

4. **Gate rows (verifyRow, checkRow, postRow).** Already close to an allowlist: a fixed set of
   fields with exact validators (gate.mjs:463-470) and a byte comparison with the run's own
   artifact. Keep as it is.

5. **Ledger and metrics JSON.** Read with JSON.parse as data, not to grant trust beyond
   ownership paths; under section 1's rule the paths come from the base. Keep.

## 4. Dead or duplicate code

- gate.mjs:288 `if (pr && post) io.addComment(...)` and p3.mjs:271 `post: !a['no-post']`: the
  shim always passes `--no-post` (process-gate.yml:109), so the gate never posts in CI. Posting
  from the process that ran product code is the very thing the two-job split forbids, so the
  default is the unsafe one. Remove the flag and the post; postRow is the only writer. 4 lines.
- merge.mjs:28 re-exports `isBootstrap, keySetAt, processRepoSetAt` from anchor.mjs; only
  tests import them from merge (merge.test.mjs:427). processRepoSetAt has no caller in the tool.
- Duplicate helpers: `blob` (workflows.mjs:39) and `blobAt` (anchor.mjs:10); `pinOf`
  (workflows.mjs:215) and `pinAt` (anchor.mjs:14); `JOB_MERGE` (workflows.mjs:35) and
  `MERGE_TITLE` (gate.mjs:335); `isJobRef` (workflows.mjs:37) and `isJob` (merge.mjs:441);
  `isAnc` twice (gate.mjs:445, workflows.mjs:48); `entriesAt` three times (gate.mjs:23,
  carry.mjs:20, merge.mjs:632 inline); the no-renames name diff three times (gate.mjs:34,
  merge.mjs:166 and :620, workflows.mjs:266); metrics `rowsAt` three times (merge.mjs:29,
  gate.mjs:435, record.mjs:184). About 30 lines into util.mjs.
- Two `takenIn` functions with different meanings (record.mjs:172 tips, carry.mjs:24 PR
  numbers). Rename one.
- Two implementations of "the approvals in the config changed": anchor.mjs unanchored (key
  `approvals`) and record.mjs:362-376. Section 3 item 3 keeps one.
- Two ownership checks: gate.mjs:110 from the head's ledger, merge.mjs:157-167 from the merge
  base. merge's is the one that holds (BOB's tool); the gate's is early feedback and should
  read the base (section 1).
- `waitForGate` (merge.mjs:47) and `waitForChecks` (:542) are two waits with the same cap logic;
  one could take a list of names. Not trust, about 25 lines.

## 5. Proposals, ranked by lines removed per unit of risk

Risk: 1 low (behaviour for the current product unchanged), 2 medium (a migration or a
measured wall), 3 high (changes throughput or needs a new wall). Lines are estimates of
non-test .mjs and shim lines removed, net of what replaces them.

| # | Proposal | Lines | Risk | Ratio | What could break | Tests that cover it today |
|---|---|---|---|---|---|---|
| 1 | Retire bootstrap and record_since: onboarding ends with Bob's website commit of config and pin on main (2B, 2C) | ~175 | 1 | 175 | A new product cannot onboard without that one owner act | gate-bootstrap.test.mjs (7), bootstrap-close.test.mjs (10), record.test.mjs record_since cases (40 mentions), close-workflows.test.mjs (2) |
| 2 | Freeze product workflow YAML: shim or owner-allowlisted hash; logic in scripts (3.1) | ~300 | 2 | 150 | The copy's workflows need one migration; a matrix change becomes a JSON change | close-workflows.test.mjs (14), shims.test.mjs, merge.test.mjs workflow cases |
| 3 | Dead and duplicate code, including removing the gate's in-process post (4) | ~60 | 0.5 | 120 | Nothing in CI; tests that import from merge.mjs move | gate.test.mjs, merge.test.mjs, github.test.mjs |
| 4 | Tranche gated by construction (ruleset up to date on the tranche, reverse-dependency scope); drop the tranche cover and the tranche-pin exception (2A, section 1) | ~150 | 2 | 75 | Needs Bob's ruleset change; plain PRs must be brought up to date before merge; larger PR gate scope | main-gate.test.mjs (17), shims.test.mjs |
| 5 | A ready job PR's gate always runs its suite; drop measuredBy and record-since-green for it (2F) | ~70 | 1 | 70 | More gate minutes on records-only pushes | gate.test.mjs, merge.test.mjs unagreed cases |
| 6 | Never commit module generated files; drop the refresh route (2G) | ~100 | 1.5 | 67 | Anything that reads a committed generated file must build it first (design stream files) | generated-plain.test.mjs (19), generated.test.mjs, checks.test.mjs |
| 7 | Approvals and settings judged at the head's net state (3.2) | ~120 | 2 | 60 | A commit in a range that briefly carried an unapproved block is no longer named (it never reaches a trusted branch) | record.test.mjs, record-tranche-merge.test.mjs, shallow.test.mjs, setup.test.mjs |
| 8 | Base-red goes once 4 holds (2E) | ~180 | 3 | 60 | A flaky or drifted tranche blocks every PR until fixed forward | base-red.test.mjs (22), gate.test.mjs |
| 9 | Take-ins as one tree commit, drop takenIn tips (2D) | ~70 | 1.5 | 47 | Old commit authorship is on the old branch only | take-in-record.test.mjs (14), job.test.mjs take-in cases |
| 10 | Found marks only under process/found (2H) | ~45 | 1 | 45 | Readers of marks in requirement files read both places until moved | found.test.mjs, merge.test.mjs found cases |
| 11 | Anchored keys in their own file, compared by blob (3.3) | ~50 | 1.5 | 33 | One config split migration in each product | anchor.test.mjs (7), merge.test.mjs pinChange cases |
| 0 | Dev release by workflow_dispatch on the tranche, secret in a tranche-only environment (section 0) | ~10 | 1 | n/a | Needs Bob for the environment | release.test.mjs, shims.test.mjs |

Item 0 is a correctness fix for O3 and should go first whatever else is chosen. Taken
together, items 1 to 11 remove roughly 1,300 lines, most of what the trust layer gained since
7f50bdd, with O1 to O3 held by fewer rules: one trusted base (section 1), frozen workflows,
net-state approvals, and a tranche that is green at every tip.

Things that need measuring before relying on them: whether a user-owned repository's rulesets
can require "up to date" on the tranche with the current merge tool's flow; whether Actions
environments with a branch rule hold a signing secret away from pushed branches on this plan;
and whether civicsmith-copy's main already holds config and pin.


# [file] audit_A.md

# Audit A: Process4 proposal against the Process3 requirements

Part audited: Ledger families PLT, ENF, REC, ARC, REQ, PLN (every kept or modified line), and the Foundations sections "What this process is for", "The human and the AI", "The shape in one paragraph", "The properties that hold everything", "The record", "Requirements, rules and text".

## How to read this

- **Sources read in full:** `foundations.md`, `process4_doc.md`, `ledger_map.md`, the six assigned families in `ledger_lines.md`, `change_sample.md`, `product_side.md`. Read in part: `causal_forensics.md` (headline, sections 4 to 8), `redteam_feasibility.md` (walks, findings, R1 to R25), and line searches of `canon_analysis.md`, `levers_github_cloudflare_product.md`, `verify_numbers.md`, `bob_naming.md`, `recommendations_draft.md`.
- **What is graded.** The proposal's section "The requirements everything must serve" admits four conflicts with the central requirements and gives a "direction of the correction" for each. No recommendation (G, C, M, F, P, N), no line of "What reaches you" and no grade in "Against the Process3 requirements" was changed to match. The section says so itself: the recommendations "were written before you restated them and fall short of three". I therefore grade the recommendations as written and say where the shortfall table admits the conflict.
- **Result words.** MET; MET DIFFERENTLY (the purpose is served by another mechanism); WEAKENED (kept in part, or kept with its holder removed); CONTRADICTED (a Process4 item says the opposite; quoted); SILENT (no Process4 item addresses it).
- **Kind.** PURPOSE is what the owner wants to be true. MECHANISM is one way of getting it. Where a line carries both, the kind names the part at issue.
- **Central.** (1) no commands, no source edits, settings only; (2) unattended; (3) total order, one job per module, earlier first, interface changes notify users; (4) parallel jobs under a user-changeable bound. "Role" means the owner's stated role: he defines the project, the AI does everything else and reports as done, his time is the scarcest resource.
- **Names.** "rec. P1" to "rec. P5" are the proposal's Lever 5 items. "Ledger P7" and the like are Ledger principles.
- **Not verified.** The proposal's own figures were not re-derived. Where I cite a post-mortem figure I cite the file that holds it. Grades are one auditor's reading.

Ninety-eight rows: 45 Ledger lines and 53 Foundations requirements that are not just a restatement of a line in my six families. Foundations sentences that only restate one of my Ledger lines are listed at the end of the row tables, uncounted.

---

## Ledger rows

### PLT: platform

| id | Requirement, in the document's terms | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| PLT-1 (kept) | One dated table of platform constraints, each a measured fact with its evidence and workaround. "Nothing depends on a behaviour that is not a row." No owner note. | MECHANISM (purpose: stand only on measured behaviour) | **WEAKENED.** Seven one-hour tests before run 1 test seven assumptions (R23 row: "Met if the tests run"). No table is kept; an earlier draft kept one "as a short dated list in the charter" and the final text dropped that. Other dependencies rest on reading, not measurement: "Platform facts are from documentation read on 13 Nov 2026." | (2) | Proposal must change: every platform behaviour the design depends on must be either measured or named as unmeasured, in one place a later session can read. No post-mortem figure shows the table failed to earn its place. |
| PLT-2 (modified against the suggestion; note "written here by the coordinator" from the owner's chat word, 3 Nov) | Depend only on acts the committed approvals cover and that were measured to pass; archiving sessions and switching off or deleting tasks are housekeeping, "never needed for correctness". | PURPOSE (no step waits on an act the permission judge may refuse) | **CONTRADICTED** by C12: "Live sessions stay at or below 24, and ARCH archives a job's session when its pull request merges." The concurrency bound now leans on archiving, the act this line names as housekeeping. Test 5 asks "whether idle sessions count toward the live limit", so the proposal knows the answer is open. N7 also deletes "tranche-open grant trials", the step that produced "measured to pass". Nothing counts refusals. | (2), (4) | Proposal must change: the session bound and the replacement of a dead job must hold when an archive is refused, or the acts ARCH needs must be shown to pass under the rewritten approvals before run 1 (test 3 covers auto-merge only). |
| PLT-3 (kept; replaced by GAP-6 on 3 Nov) | Hard permission rules live in allow and deny lists, which run before the classifier; the classifier is never the policy. | MECHANISM | **MET** (C7: deny list in the product's settings file, a path that is the owner's; G2). | (2) | — |
| PLT-4 (kept) | No step runs longer than the in-session background limit; anything that can is a CI workflow. | MECHANISM (platform fact) | **MET** (G4 gate in CI; G6 regression as a scheduled workflow; F1 deploy-and-walk "never from a session"). | (2) | — |
| PLT-5 (modified against the suggestion; note "written here by the coordinator", owner's option A, 3 Nov) | No session starts its own successor; depth stays at most 3. | PURPOSE | **MET** (C1 two roles; C2 and C3: ARCH is started by a task or by the owner, jobs by ARCH). The preferred form rests on test 1; Process3 measured a task's fresh session starting sessions 0 of 3. | (2) | — |
| PLT-6 (kept) | "A scheduled task is never required for correctness; a wake is a convenience and the record is read at every wake regardless." | PURPOSE (a timer that misfires or dies does not stop the work) | **CONTRADICTED**, and admitted. C2: "ARCH is woken once an hour by a scheduled task that you create." C4: "ARCH does not subscribe." The hourly task is the only thing that starts work. "Ledger lines that end" lists PLT-6 by name. A single missed firing is harmless, since the next wake reads the repository; a dead or switched-off task stops the run until the owner acts (G8 "repairs nothing"). | (2), (1) | Proposal must change: work must go on when the one task fails, without an act of the owner. No post-mortem figure supports ending this line; the sweep and watcher were kept and extended (change_sample, PR 34). |
| PLT-7 (kept) | A session works on one repository, the product's; the process is a read-only clone at a pinned commit. | MECHANISM | **MET DIFFERENTLY** (G1: the sessions' account is not a collaborator on the process repository; G2: the pin is an owner path; G4: the gate is called "at a pinned commit"). How a session obtains the pinned texts is not said; "attaching a repository read-only" is listed as a request to Anthropic, so it is not available. | (2) | The proposal should say in one line how a session reads the pinned texts with one repository attached. |
| PLT-8 (kept) | GitHub acts a session cannot take run on GitHub's runner by workflows with the owner's tokens as secrets. | MECHANISM | **MET DIFFERENTLY** (F1 deploy-and-walk in the `dev` environment; G10 production keys in the `production` environment; G8). Ruleset and environment changes move from a privileged workflow to the owner's own hands (run 0, step 5), which is a settings change. | (1) | — |
| PLT-9 (kept) | Every credential is gathered once and "checked at every tranche open; a missing grant stops a tranche from opening, never a step midway." | PURPOSE (no step fails midway for a missing grant), with a check as mechanism | **WEAKENED.** Gathered once: N8 setup list, run 0 step 5. Checked at each open: nothing. The tool "cannot refuse, hold or write" (N1) and N7 deletes the grant trials. A missing or expired grant is met midway and reaches the owner through the watchdog. | (2) | Proposal must change: something must confirm the grants before a run opens, or the proposal must tell the owner that a missing grant will stop work midway. The evidence against the Process3 check concerns its run-at-every-job-start form, which this line never asked for (change_sample PR 15: refused every job start after the owner applied new settings; read a Cloudflare 429 as "missing"; grew to about 15 minutes, twice per pin move). |
| PLT-10 (kept) | A session's platform status is never read as its work state; the record is. | PURPOSE | **MET** (G7: state derived from branches and pull requests; N1). | (2) | — |

### ENF: hooks and enforcement

| id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| ENF-1 (modified; note is a copy of the suggestion) | At most a handful of command hooks, each for a zero-exception rule, each with a legitimate blocked exit; none that hold a turn or judge text. | MECHANISM (restraint) | **MET** (C7: "No hooks. The Bash hook now in the product is removed."). | (2) | — |
| ENF-2 (kept) | No model judge sits between a session's message and the owner. | PURPOSE | **MET.** Nothing of the kind is introduced; the reviewer (C10) reads code, and the daily report is "never reported by a session". | role | — |
| ENF-3 (kept) | "Nothing holds a turn. When you say stop, the session stops in that turn." | PURPOSE | **MET** (C7 no hooks; working agreement line 7). Stopping the whole run is PLN-5. | (2) | — |
| ENF-6 (modified; note recorded by the coordinator from the owner's "Yes, as recommended", 1 Nov) | No `/goal` and no model judging the transcript; a job that stops early is caught by status and the sweep. | MECHANISM | **MET DIFFERENTLY** (C6: status lists pull requests open too long and ARCH acts hourly; G8 watchdog). The sweep is gone. | (2) | — |
| ENF-7 (kept) | Every gate or hard rule offers the model a legitimate exit, "blocked", recorded and visible to BOB. | PURPOSE | **MET** (N3: "the job marks its pull request blocked and stops, and ARCH works on something else"; working agreement line 7). | (2) | — |

### REC: the record

| id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| REC-1 (modified; note is a copy of the suggestion) | Keep the durable and transient split, "but move coordination traffic to PR bodies, comments and issues, or to a separate bookkeeping repository". | MECHANISM | **MET DIFFERENTLY** (G7; N3 and M5 pinned issues). The proposal lists REC-1 as a line that ends, but the modified line already named pull requests and issues as a home, so this is the option the note offered. Evidence for dropping the state branch: 12,881 of 18,295 commits (70%) were on it (product_side, section 3). Rec. P1 "clears ... the state branch" without saying who deletes a branch that the owner's rulesets protect. | (2) | The proposal should say who removes the state branch. |
| REC-2 (kept) | One writer per file. | MECHANISM | **MET DIFFERENTLY.** The rule is not stated, but most record files go (G7) and the rest have a named owner: map and round plan are ARCH's (rec. P4). Requirement files have two writers, as in Process3: ARCH for the text, jobs for their marks. Known limits admits a job "can also change a requirement's wording". | (3), (4) | See ARC-2. |
| REC-3 (kept) | One status command reads the whole state a role needs from git and prints it "with sizes"; a successor of any role starts from it alone. | MECHANISM (purpose: any session can be replaced from the record) | **MET DIFFERENTLY** (N1 read-only `status`; C3 "from status alone"). Sizes are not printed; the daily report prints "bytes auto-loaded into a session" instead. The Foundations' "reports to route" has no place in it (see PLN-3). | (2) | — |
| REC-4 (kept) | Record writes by the architecture session never cost a job a gate run or a completion. | PURPOSE | **MET DIFFERENTLY** (G7: there is no record to write; G4 and G6: a moved base does not re-run a job's gate). Evidence: 63% of 789 gate runs were not started by a code change (product_side, section 4). | (2) | — |
| REC-5 (kept) | A remote act is recorded as done only from the tool call's result, never from its request. | PURPOSE | **MET DIFFERENTLY** (G7: no session records acts; state is read from GitHub). | (2) | — |
| REC-6 (kept) | An address is read from git at the moment of sending, and an address change is on the branch before it is announced. | MECHANISM | **MET DIFFERENTLY**, by removal (G7 deletes address files; C3 has no standing ARCH to address). One gap: working agreement line 4 says "tell ARCH in one line" and names no route to a session that is new each hour. | (3) | See PLN-3. |
| REC-7 (kept) | The record of a halted build is complete: a fresh session's status tells everything open, idle, merged, unmerged and owed, with no transcript. | PURPOSE | **MET** (N1; G7; G9 "Jobs in flight keep their work on their branches"). R14 admits unpushed work is invisible, as it was a nudge before. | (2) | — |
| REC-8 (modified; note is a copy of the suggestion) | Keep the reading audit, judge reading by what a session can cite from the end of a document, "and shrink documents so the question rarely arises". The start command prints the reading set with sizes. | MECHANISM | **WEAKENED.** Shrinking: met (M1 byte caps, M2 one charter). The audit and the printed reading set are not mentioned. | — | Candidate for the owner to change the requirement. The audit was never built in nine days (ledger_map: REC-8 "no audit", Gap, "Later gate"), and the one reading restraint that held was a byte cap: role prompts stayed at 4,032 to 4,197 bytes from 4 to 9 Nov while `tool/lib` grew from 1,431 to 23,429 lines (causal_forensics, headline). |
| REC-9 (kept; owner's own words: "Try this, but measure the experience with an open mind as to whether it's work or not.") | The build ledger is a schema-constrained JSON file with one mutable field per entry, "not free-form markdown that sessions may rewrite". | MECHANISM | **CONTRADICTED**, and admitted. G7: "The state branch, JSON ledger, receipts, usage ledger, address files and heartbeat are deleted." Its replacement is the kind of file the line excludes: rec. P4, "The module map and round plan are ARCH's files, not guarded." | (3), (4) | Candidate for the owner to change the requirement; his own note invites it. Evidence of cost: 105 of 508 landings changed nothing but `process/ledger` and `process/metrics` (product_side, section 2); the owner on 6 Nov, "checks are refusing modules with no ledger entry" (causal_forensics, 4.2); the census built on the ledger was loosened after 7.3 hours (change_sample, PR 204). The measure the Foundations set for this line (corruption, bypass, edits outside the status field) appears in none of the post-mortem files, and the proposal does not report it. |
| REC-10 (kept) | A CI check fails any commit that adds a file over a set size or under a transient path; a scheduled prune squashes the transient branch. | MECHANISM (purpose, Ledger P23: the repository holds only what is needed) | **CONTRADICTED** by N7: "Deleted with no replacement: receipts, record and size checks ...". The transient half is moot once the state branch goes. | — | Candidate for the owner to change the requirement. The record check's first run raised 947 findings in 5 min 23 s and needed false-positive repairs in seven later merges (change_sample, PR 1); it ran 495 times in eight and a half hours, 403 of them on branches where "nothing reads it" (PR 116). The proposal must tell him the purpose then has no holder: `build/` is 431 MB of the checkout (levers, 10.3). |
| REC-11 (kept) | Decisions go to short decision records the moment they are made, each in its own file, never as a line in a long plan. | MECHANISM for a PURPOSE (a decision has a visible home that a requirement can cite) | **CONTRADICTED** by N7 ("session-written decision records" deleted with no replacement) and M2 ("One charter page replaces the ... decision records"). M4 says a session's decision "is recorded under the session's name" and names no place. The owner's own answers have a home (M5). This matters more in Process4 than before, because "No session inherits another session's conclusions." | role, (2), (3) | Proposal must change: a product-technical decision made by one ARCH wake must have a stated home that the next wake and the affected jobs read. Evidence is mixed: `DECISIONS.md` grew from nothing to 49 KB in four days (verify_numbers), but cost statements became commoner once records carried a "what it costs" line (change_sample, section 5). |

### ARC: architecture and checks

| id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| ARC-1 (kept) | Modules in one total order, each in one layer, lower first, uses declared and matched by imports; a violation fails the gate. | PURPOSE (the owner's architecture), with a check | **MET** in the Ledger's terms (G4 keeps "imports match declared uses"; lowest layer first). Against central (3) as restated on 13 Nov it falls short: rec. P3, "A layer's jobs start together", and 182 of 220 modules use a module in their own layer. The shortfall table admits this; rec. P3 is unchanged. | (3) | See "Central requirements" after section B. |
| ARC-2 (kept) | Each file has one owner module; a job writes only its module's paths and tests and the strike of its own marks. | PURPOSE (single ownership, so parallel jobs are safe), with a check | **WEAKENED.** Process3 held it by a check (ledger_map: "gate and merge", Built). G4 lists what the gate runs and ends "Nothing else"; the ownership check is not in it. What is left is working agreement line 4. C4 also widens a job to "one module or item". R17 is graded "Met". | (3), (4) | Proposal must change: something other than a sentence must confine a job's merged change to its own module, or the owner must be told that single ownership now rests on a sentence. No post-mortem figure shows the check failed to earn its place: one false refusal, repaired on 3 Nov (change_sample, PR 46), and causal_forensics section 6 counts its refusal among the 12% that guard the product. |
| ARC-3 (kept; source "your word of 30 Oct") | A test asserts on a text's key, never on its words; every user-facing sentence lives once in the word table. | PURPOSE (the owner's engineering standard) | **SILENT.** Never built in the Process3 gate either (ledger_map: Gap). | role | Proposal must change: say whether the rule stays as a convention of the product's own suites or ends. |
| ARC-4 (modified against the suggestion; owner's own words) | "The architecture, ownership, format and coverage checks run only against the job's module in its gate, layer checks when a layer closes, and over the whole product before a release or when I ask for one." | MECHANISM (the timing is the owner's own decision) | **CONTRADICTED** by G6: "The existing full regression runs there on a schedule", a whole-product check run routinely. The ownership, format and coverage checks no longer run at any scope (G4, "Nothing else"). Layer close becomes deploy-and-walk (F1). R12 is graded "Met". | role | Candidate for the owner to change the requirement, on timing. All 12 development deployments failed, none ran for 80 hours while 308 landings went in, and the next walk found 1,691 failures (product_side, summary 3 and section 9.2); a fault "surfaced at round close, a day late" (change_sample, PR 251). The proposal must put it to him as a reversal of his own note, which R12 does not. |
| ARC-5 (kept) | Every check and gate finding names module, file and line in one machine-readable result that status reads; "a red is never searched for in a log". | MECHANISM | **SILENT.** G4 says nothing of the gate's output and N1's `status` prints "what is ready, what is stuck, and the last walk". Only the reviewer's findings carry file and line (C10). | (2) | Proposal must change: say how a job woken by a red check learns what failed. The Process3 build did not fully deliver this either: "the gate rows carry no reason field" (product_side, "What could not be established"). |

### REQ: requirements

| id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| REQ-1 (kept) | Each module's requirements file has a public part and a private part, every statement under a permanent id. | MECHANISM for a PURPOSE (users see what they may depend on; ids can be cited) | **WEAKENED.** The files stay, and jobs strike marks in them. The format is not mentioned. Rec. P1 removes "the 211 process-artefact test files"; by product_side 6c that figure is 187 notice tests plus the 24 `requirements-ids.test.mjs` files that tested ids, order and marks. Known limits: a job "can also change a requirement's wording ... not walled". | (3) | Proposal must change: state that the public part and the permanent ids stay, since the public part is what defines a module's interface for (3). |
| REQ-2 (kept) | A requirement states behaviour at the interface, never an implementation; an ambiguity is removed by rewriting the text. | PURPOSE | **SILENT.** R11 restates the purpose and grades only its testing half. No item says who rewrites an ambiguous requirement or that the fix goes in the text. C5 limits a START to one line, so a clarification has nowhere else stated to go. | (3) | Proposal must change: say who removes an ambiguity and that it is done in the requirement's text. |
| REQ-3 (kept) | A figure at a scale beyond the suite is a measurement with its own plan id, never a test line; a review never counts an untaken measurement as a gap. | MECHANISM | **SILENT.** G5's runner-minute budget discourages huge fixtures only indirectly. The Foundations name this line as a carrier of the owner's scalability and performance standards (see F-FOR-4). | role | Proposal must change: say where a scale or performance figure is measured. |
| REQ-4 (kept) | A not-yet-met mark is struck only by the job that meets it, in its own commit. | MECHANISM | **WEAKENED.** Kept as practice (R11: "Jobs strike their own marks as before"). Its holder was ARC-2's ownership check, which is gone. R11 admits "Nothing proves each struck mark has a test". | (3) | As ARC-2. Evidence against the heavier Process3 form only: a test demanded for every struck mark "answered nothing" and was removed after 5.8 days (change_sample, PR 40). |
| REQ-5 (kept) | A change to what a provided service means goes to the owner only where it changes what the product does for its users and the canon is silent; "every other change is BOB's, recorded once". | PURPOSE (protects the owner's time; settles who decides an interface change) | **SILENT.** No item gives the test by which such a change is the owner's. "Recorded once" has no place (N7). The companion step, telling the users of the changed service, is deleted in N7 and admitted in the shortfall table. | (3), role | Proposal must change: state the test that sends a service change to the owner, and where ARCH's own such decisions are recorded. |
| REQ-6 (modified; note is a copy of the suggestion) | A cap that triggers a split or consolidation before any job starts, measured on the real product; "never a refusal at a job's start". | MECHANISM | **MET** (rec. P1 removes "the requirements size-cap refusal"; rec. P4: "Requirement files too large to read whole are split at planning time"). No number is given. This is closer to the line than Process3's build, which refused: 47 job blocks and 64 commits cite the cap (product_side, 6b and 6d). | (2) | — |
| REQ-7 (kept) | Only explicitly marked words of the owner's become decisions; a ruling lives only until the requirement it refines is rewritten to absorb it, then it is deleted. | PURPOSE | **MET DIFFERENTLY** (M4: "Your word is what your GitHub account wrote"; working agreement line 6; M5). The absorb-then-delete step is not mentioned. The mark is now the owner writing on GitHub himself, which is a new act (section D, D5). | (1), role | The proposal should say what happens to an answer in the questions issue once the requirement it refines is rewritten. |

### PLN: planning

| id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| PLN-1 (kept; reason given "Your constraint") | Layers within rounds within tranches; nothing else about a product's size or shape is assumed. | PURPOSE | **MET DIFFERENTLY** (layers in rec. P3, rounds in N1 and rec. P4, tranche close in G11). A fourth unit, the "run", is added for the life of one process version and is not related to the tranche. | (3) | The proposal should say how a run relates to a tranche. |
| PLN-2 (kept) | A plan is written from the work that remains; an entry is deferred only for one of three named reasons. | PURPOSE (no quiet reduction of scope) | **WEAKENED.** `status` prints what is ready from the map and the round file (N1). Nothing says the plan covers all remaining work or limits deferral. Under Process3 layer 11 closed with 28 modules deferred (product_side, section 5). | (2) | Proposal must change: say what stops work being left out of a round without a stated reason. |
| PLN-3 (kept) | Work found while a round runs is placed at once: in the running job, else a later layer's START, else the completion round. | PURPOSE (nothing found is lost or waits for the next tranche) | **WEAKENED.** Working agreement line 4: "If it is elsewhere, tell ARCH in one line", with no stated place where that line waits for an ARCH that is new each hour. A later START cannot carry it (C5: "A job's START is one line"; a longer one is a listed sign of failure). Walk failures "become product jobs in the next round" (F2), which matches the Foundations. | (3), (2) | Proposal must change: found work for another module must have a stated place from which that module's job receives it. Under Process3 this route did real work: 183 found marks were raised and 132 met (product_side, section 5). |
| PLN-4 (kept) | The completion round has its own file, distinct from the next tranche's list. | MECHANISM | **MET DIFFERENTLY** (N1 reads "the round file"; one file per round is implied). The completion round is not named. | — | — |
| PLN-5 (kept; reason given "Your most-used control") | "Pause and resume are first class: your word is recorded once in the plan's Status line, every session reads it at its next status and takes no new step." | PURPOSE, with a status line as mechanism | **CONTRADICTED.** G9: "Stop is physical and yours. Lock the integration branch and switch off the hourly task." The owner's word becomes two acts of his own, and two more to resume. Switching a Claude task is not a GitHub or Cloudflare setting. Jobs in flight are not told to stop: "Jobs in flight keep their work on their branches." R7 is graded "Met differently ... Stronger". | (1), (2) | Proposal must change: stopping and resuming must not need an act of the owner outside GitHub or Cloudflare settings. There is evidence that a word in a field is not a reliable stop: "the 3 Nov halt switched tasks off by hand" (ledger_map, PLN-5), and process activity ran for 2 h 20 min after the 9 Nov stop (product_side, section 8). That supports a physical stop. It does not support moving the act to him. |
| PLN-6 (kept) | A tranche's report states elapsed time, work finished, deferrals with reasons, work left, cost, and the share of cost that was process overhead. | PURPOSE (the owner is told what was done, what is left and what it cost) | **WEAKENED.** A daily report of nine numbers replaces it. Deferrals, work left, elapsed time and the overhead share are not in the list; cost reads "where it can be read, otherwise 'not measured'". R22 admits part of this. | role | Proposal must change: at the close of a run the owner must be told work finished, work left, deferrals with reasons, and cost or the word "unmeasured". Cost was hard to read under Process3 (product_side, "What could not be established"; change_sample, PR 105 to 106), which is a fact about the mechanism, not about the purpose. |
| PLN-7 (kept; reason given "Already your situation") | Two products may run tranches at once on one account; nothing in the process names a product. | PURPOSE | **WEAKENED**, and admitted (R24). N8 is a setup list "for any product". How two products share the account's session limit is not addressed, and the budgets are set from this product's replay. | (4) | Proposal must change: say that the kit names no product and how the job bound is divided between products. The owner restated this on 8 Nov, "Process3 is product-neutral" (change_sample, PR 274). |

---

## Foundations rows

### "What this process is for"

| id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| F-FOR-1 | The process exists to meet the standards the owner sets in two roles, product manager and software engineer. | PURPOSE | **MET** (division table: "Purpose, audiences, requirements, architecture, UX, as before"). | role | — |
| F-FOR-2 | The owner's audience attributes are carried in the canon and each module's requirements, cited by id. | MECHANISM | **MET** (requirement files stay; the reviewer names "the requirement not met", C10). See REQ-1 for the ids. | role | — |
| F-FOR-3 | "Lanes for design areas you identify"; the UX lane is always there. | MECHANISM for a PURPOSE (the owner's UX and design standards have a keeper) | **SILENT.** The word "lane" does not appear in the proposal. C1 names two roles and does not list lanes among those removed. | role | Proposal must change: say whether lanes continue and, if not, what carries the owner's UX direction. |
| F-FOR-4 | The owner's engineering standards are carried by the module order and layers, the checks, the gate, "measurements at scale (REQ-3), and the cost metrics". | MECHANISM | **WEAKENED.** Order, layers and gate are kept. Measurements at scale are silent (REQ-3) and the cost metrics are weakened (R22). The walk is a new carrier (F1, F2). | role | Proposal must change: name the carrier for the scalability, performance and cost standards. |
| F-FOR-5 | Put correct, working product behaviour that meets its requirements onto main, quickly and cheaply, so that it survives (Ledger P1). | PURPOSE | **MET** (G3, G11; R1). | all | — |
| F-FOR-6 | "Nothing else is output": a rule, record, check or test has value only as far as it serves that. | PURPOSE | **MET** (conditions 2 and 6; working agreement line 1; N5). | (2) | — |

### "The human and the AI"

| id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| F-HUM-1 | The owner defines the project. "BOB does everything else": it "decides everything technical and detailed" (Ledger P17). | PURPOSE (the owner's role) | **CONTRADICTED**, and stated as the proposal's main change. Verdict: "The process itself (which checks exist, what the tool does, what the prompts say) becomes yours". Condition 1: "The process changes only by your merge." R2 grades this "Met, with the split". The shortfall table admits the conflict with (1) and proposes limits held in GitHub rules, calling that "unproven"; every recommendation still requires the merge. | (1), role | Proposal must change: the bounds on the process must hold without the owner merging, reviewing or reading process changes. The evidence shows sessions cannot be left unbounded (294 process changes merged; check-adding at 41% before and after the 5 Nov instruction: change_sample, summary). It does not show that the owner must be the one who merges. |
| F-HUM-2 | BOB "keeps the record, manages the development environment, ... takes your input ... and reports it to you in plain words as done". | PURPOSE | **WEAKENED.** Environment: C7 denies sessions "the task and environment tools", so the cloud environment, its setup script and its variables fall to the owner (C7, C8, G10). Reporting as done: the owner gets "One daily number to read", computed by a workflow; no item has ARCH tell him in plain words what it decided, and N7 deletes session-written decision records. Input: in the preferred form there is no standing session to speak to. | (1), role | Proposal must change: say how the owner learns, in plain words and after the fact, what the AI decided, and who looks after the cloud environment. |
| F-HUM-3 | In the middle ground both offer opinions, options and recommendations; neither is dogmatic. | PURPOSE | **MET DIFFERENTLY** (M5: options and a recommendation in the questions issue; "What reaches you"). The exchange moves from conversation to an issue. | role | — |
| F-HUM-4 | "Your time is the scarcest resource. You see rendered pages, with options and a recommendation, only for what is yours." | PURPOSE | **WEAKENED**, and admitted (R3). What is "yours" is widened to the whole process. "What it costs you": "a retrospective between runs needs perhaps an hour of your attention". Section D counts 24 acts the documents do not ask for. | (1), role | Proposal must change, as F-HUM-1. |
| F-HUM-5 | An act only the owner can take is named and walked through in plain steps. | PURPOSE | **MET**, by promise (R3: "each is walked through"; N8 setup list). The steps themselves are not in the proposal. | (1) | — |
| F-HUM-6 | By default a job, layer or tranche merges on a green gate without the owner; a public release waits for him; he may ask for his approval before a particular merge. | PURPOSE | **MET** for product merges (G3, G11, G10). Process changes and owner paths are a new class that always waits for him; that is counted under F-HUM-1. | (2) | — |
| F-HUM-7 | "You do not edit files or enter commands; the few steps of yours the platform forces at onboarding are kept as few as possible." | PURPOSE | **CONTRADICTED**, and admitted in the shortfall table: "You are made the merger of every process change (G1, N2, N4), the creator of the hourly task (C2) and the answerer in an issue (M5). None of those is a settings change". Not admitted there: G2 "so you can merge your own edits" (workflows, settings, walker steps); M1 "even your merge needs the budget number changed first"; C7's setup script; run 1, "Your own repairs to the gate ... are expected". R3 says only "Weakened ... Each is a click or a comment". | (1) | Proposal must change. See section D. |
| F-HUM-8 | "When BOB is unsure whether a question is yours, it decides by this section and says how it read it." | PURPOSE | **SILENT.** The proposal offers a sign of failure afterwards ("The questions issue filling with things ARCH should decide") and no rule beforehand. The path list separates process from product, not the owner's product questions from ARCH's. | (2), role | Proposal must change: give ARCH the rule for deciding whose question it is. |
| F-HUM-9 | When a mechanism cannot be built or a better one is measured, BOB restates the line with its purpose unchanged and "reports it in one line; only a change to what a line asks for comes to you" (owner's word, 4 Nov, "after TXT-5 was brought to you though it was BOB's"). | PURPOSE (the owner's own correction) | **CONTRADICTED.** Every change of mechanism now comes to him: "The process changes only by your merge"; "A proposed change reaches you with totals before and after"; N5, "Repair needs your decision". | (1), (2), role | Proposal must change, as F-HUM-1. Changes of mechanism must not need him. |
