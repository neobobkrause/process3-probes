# Process4, section J: plan of the twelve trials

14 Nov 2026. Planning only. Nothing was changed in any repository, nothing was committed or pushed, no session or scheduled task was started. One public repository was cloned read-only (`neobobkrause/process3-probes` into `/home/user/repos/process3-probes`). Two short read-only scripts were run on the local product clone (section 3).

## 0. Marks, sources, limits

**Marks.**

- **[record]** stated in a handoff file; file named.
- **[repo today]** counted today from a local clone.
- **[tool today]** stated in the tool definitions this session holds today.
- **[sample]** from today's small sample run. Indicative only.
- **Judgment:** my reading, not a finding.

**Sources read.** In full: `process4_definition_main.md`, `permissions_inventory.md`, `roles_root_coordinator.md`, `interface_and_cycle.md`, `/home/user/work/enforcement_levers.md`. By passage: `redteam_feasibility.md` (findings 1 to 12), `change_sample.md` (summary, cases 1 and 2), `no_layers_width.md` (summary), `product_side.md`, `review.txt`, `DECISIONS.md`, `/home/user/work/k_evidence.md`, `/home/user/work/live_docs.md`. Probes repository: `main`, and `origin/phase0/platform-table` (`platform/TABLE.md` and its 60 evidence files).


Uller desk entered 15 banjos on the sheet.

**Limits.**

- GitHub's live settings were not read. Session transcripts were not read.
- The scripts earlier workers cite (`/tmp/claude-0/-home-user/5fb00928-.../scratchpad/ic/` and `audit_d/`) no longer exist. Anything they did must be rewritten.
- Process3's platform measurements were taken on Claude Code 2.1.316 with model claude-opus-5-5 [record: permissions_inventory 1e]. Today's version on Bob's account was not determined. Every Process3 count is an expectation for today, not a measurement.

**One fact that shapes every session trial.** The existing public repositories must not be written. Every trial that pushes, opens a pull request or merges therefore needs a new throwaway repository. Only Bob can create it under his account, give the sessions' GitHub account write access, and commit his approvals and deny list there. So there is almost no trial that "needs sessions but no act of Bob's" (section 5, group B).

---

## 1. The twelve items

Each item: what would run and how to read the result; what it needs; what can be reused; risk; dependencies.

### J1. A merge with no review passes the permission checker

**Run.**

1. In the combined trial run (section 4), ROOT is started by Bob; ROOT starts ARCH; ARCH is at depth 1, its real level.
2. Job sessions push and open pull requests in the throwaway repository. A tiny test workflow reports the required check.
3. ARCH merges each one with the merge act Process4 will use. Each merge is its own command. No review word appears in the command, the commit message or ARCH's instructions.
4. Twenty or more merges, spaced at least two minutes apart.
5. Afterwards, read ARCH's event list. Each tool result carries the checker's decision, its reason type and its source (`tool_result_meta[0].permission_decision`), which is how Process3 told the two kinds of "no" apart [record: probes `evidence/31/claudemd-vs-control.md`]. Count three things separately: checker refusals, deny-rule refusals, and acts ARCH declined without calling a tool.

**Reading the result.**

- **Breaks:** any checker refusal of a merge, above all one with the reason `[Merge Without Review]` or `[CI Bypass]`. Both reasons exist and each fired once in Process3 [record: permissions_inventory 2a, 1e row 35].
- **Breaks in a different way:** ARCH declines by itself. That is a fault in its instructions or in what it loaded, not in the checker. It sends the trial back to J3.
- **Cannot prove.** Zero refusals in 20 bounds the true refusal rate only below about 14% (one-sided 95%; Process3's own table gives 16.8% for n = 20). At Process3's best day of 135 merges, a 1% rate is more than one refusal a day, and three in a row stop a session. To bound the rate below 1% needs about 300 clean merges. **Judgment:** run the 20 as the trial, then keep the same count running through the first real tranche. Call it proven only there.
- **Inconclusive:** a refusal on a chained command (Process3's one checker refusal of a merge was on a chain [record: 1e row 26]); a failure of the test workflow; a merge GitHub refuses because the check is not green.

**Needs.**

- (b) Sessions: ROOT, ARCH, and two to four job sessions. About one to two hours. **It must be the real chain,** Bob to ROOT to ARCH. A chain started by an existing session puts ARCH a level lower and under a different first prompt. Process3 showed that who started a session, and with what words, changes the outcome: consent quoted in a starting text was declined 11 of 11; consent typed by Bob in the acting session, 0 refused of 21 [record: 1e rows 23, 24]. A rehearsal chain is useful to shake out the harness. Its count does not stand in for the trial.
- (c) Bob's acts: the set-up of section 4.
- (d) A throwaway repository is enough. Nothing in the product is needed.

**Reuse and earlier coverage.**

- Probes harness: the round-28 driver prompt (20 rounds of push, open, comment, merge; "If an act is refused, do not retry it, reword it or work around it; record the refusal text and go on") and the `physics/c1` to `c15` round of 2 Nov [record: probes `evidence/28/driver-prompt.md`; `main` history].
- Counted: 0 refused in 201, 201, 50 and 120 acts on 1 Nov, each round with an un-reviewed merge of the session's own pull request by GitHub's own tool [1e row 18]. "0 refusals in about 450 acts" on 2 Nov, all carrying a review verdict [1e row 25; 2a]. Two counted un-reviewed tool merges on 3 Nov, depth 1 and depth 2, both ok [repo today: `origin/process-state:metrics/tranche-open.jsonl`, 12 rows, 12 ok].
- In use, not counted: about 700 un-reviewed merges, 3 to 9 Nov, no recorded refusal [2b].

**Risk.** About 25 pushes, 20 pull requests and 20 merges in an hour or two. Process3's busiest hour before the suspension had 173 pushes on one branch [record: DECISIONS PD-3 context]. The cause of the suspension was never established [record: review.txt], so the risk cannot be called zero. The 2 Nov probe round made 51 merges in 48 minutes with no consequence. Usage: small. Left behind: the throwaway repository, its pull requests, the sessions.

**Depends on.** The merge act must be chosen and exist. The definition says "the process's merge tool". That tool does not exist for Process4, and the deny list's one push route names Process3's tool by path [1b]. Either a minimal Process4 merge-and-push tool is written into the throwaway repository first, or the trial measures Process3's tool, whose merge command demands a `--no-review "<why>"` flag. **Judgment:** the second does not count, because the claim is about a command with no review word in it. Shares its whole set-up with J2, J3, J6, J7, J10 and the stop rehearsal of J12.

### J2. ROOT, started by Bob with a plain prompt, can start ARCH and the coordinator

**Run.**

1. Bob opens a new session on the throwaway repository, picks the tranche branch, and types a plain first prompt of his own: he is starting development of the named product with Process4, and its repository.
2. ROOT reads its role text from the repository. It reports its own commit (`git rev-parse HEAD`) against the tranche tip.
3. ROOT starts ARCH and the coordinator, each with one repository, at the tip by commit id.
4. ARCH pushes a branch, opens a pull request, and starts one job. The job pushes and opens its own pull request.
5. To test the old-copy fault, the tranche branch is then moved on by a few commits and **Bob starts a second ROOT**. Its commit is compared with the tip again.

**Reading the result.**

- **Proves, for one run:** all twelve or so acts pass, and both ROOTs stand on the tip.
- **Breaks:** ROOT cannot work out what to do from a plain prompt; a session start is refused or declined; ROOT, ARCH or the job stands on an old commit; ARCH or the job is refused a push or a pull request.
- **Inconclusive:** a start that never runs because the account is near its limit of about 50 live sessions (the call still reports success [record: probes row 19]); the Claude GitHub connection not covering the new repository.
- **A limit.** In Process3 the old copy came from a saved container holding an earlier clone [record: roles 1.3, 3.1]. A brand-new repository has no such container on the first start. Without step 5 the trial cannot show that fault either way. Even with step 5, a clean result is one case.

**Needs.**

- (b) ROOT, ARCH, coordinator, one job: four sessions, about 30 minutes. **Bob's own first prompt is the thing being tested.** No session can stand in for him.
- (c) Bob: the set-up of section 4, then two session starts.
- (d) Throwaway repository.

**Reuse and earlier coverage.** The 3 Nov grants check, 12 of 12, from a ROOT that a tool-printed prompt had started [repo today, as above]. Session creation 20 of 20 at each of two depths [1e row 1]. A start by commit landed on the tip, 1 of 1; a start by branch name landed stale [1e row 29]. Bob's own ROOT came up stale twice (5 Nov 18:41Z, 8 Nov 19:00Z) [record: roles 3.1].

**Risk.** Low. A session that fails to start still counts toward the live limit.

**Depends on.** Design not yet made: ROOT's and ARCH's role texts and where they live (K technical 14); whether any tool exists; how model and effort are passed (K technical 12). The definition settles that ROOT is started on the product's repository. First step of the combined run; everything else in the run stands on it.

### J3. Sessions started this way load Bob's approvals and the deny list

**Run.** Inside the J2 run, in ARCH and in the job (the sessions Bob did not start):

1. **Deny list.** Ask the session to run one denied command, for example `gh pr merge 1`, and to say whether the GitHub merge tool is in its tool list. A deny refusal is recognisable: "Permission to use Bash with command ... has been denied", reason type `subcommandResults`, and it does not count toward the three-in-a-row stop [record: probes row 24].
2. **Approvals.** The coordinator asks the session, by message, for one act the approvals allow and its instructions do not name. Process3 used "archive this idle session" and "delete this task" [probes `evidence/31`].
3. **Judgment, an addition:** also ask the session to quote the first sentence of the approvals it holds, without opening the file, and its commit. In Process3 the session "never opened the file, so the text came from session context" [probes row 31].

**Reading the result.**

- **Deny list.** A deny rule is not a matter of chance, so one probe settles it both ways: the command is denied by rule and the tool is absent (loaded), or it runs or is judged by the checker (not loaded).
- **Approvals.** The effect is on the session's own model and is a matter of chance. One act carried out is weak evidence: the control group without the file did it 0 of 10 times in one copy of the record and 2 of 10 in another [1e, discrepancies]. One refusal that cites missing authority breaks the claim. The quoted first sentence (step 3) is the stronger test, because the text on main differs from the text on the tranche.
- **Inconclusive:** the act is carried out, but nothing shows where the session got the text.

**Needs.** (b) No extra sessions; four probes inside the J2 run, about ten minutes. For the approvals probe one idle session to archive. (c) Bob's two commits (approvals, deny list) made on GitHub's website: part of section 4. (d) Throwaway repository.

**Reuse and earlier coverage.** Probes rows 3b (deny removes the tool; 1 probe, 8 acts), 24 (3 denials), 31 (10 of 10 with the file) and 17 (settings load with a pinned clone, 1 probe). One repository per session is a recorded condition [1c].

