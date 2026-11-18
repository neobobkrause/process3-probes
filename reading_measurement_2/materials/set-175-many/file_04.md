# Audit D: the Process4 proposal against the four central requirements

13 Nov 2026. Audited: `process4_doc.md` (all 551 lines, every table row). Read in full: `foundations.md`, `ledger_map.md`, `product_side.md`, `redteam_feasibility.md`. Read by line id: `ledger_lines.md` (ARC-1, ARC-2, GAT-3, P1 to P23, PLN-1 to PLN-3, JOB-1 to JOB-6, JOB-9, INT-4, SES-1, SES-8, SES-15 to SES-17, PLT-2, PLT-6 to PLT-10, REQ-4, REQ-5, GAP-1 to GAP-12). Read by search: `change_sample.md`, `causal_forensics.md`, `levers_github_cloudflare_product.md`, `field_report.md`. Read from the product repository, read-only: `build/modules.json`, `build/layers.md`, `process/config.json`, `CLAUDE.md` at `origin/tranche` (identical module map at `origin/layer/14`), and `build/modules.json` at `origin/main`.

Classification words: MET, PARTLY, NOT ADDRESSED, CONTRADICTED. A clause is graded on the proposal's operative items (G, C, M, F, P, N, "Start smaller than this", "What reaches you", "Known limits", run 0, run 1, the seven tests), not on its admission table.

## 0. Findings in brief

1. **The proposal's body was not rewritten to the four requirements.** A section was put in front of it ("The requirements everything must serve") that restates them and admits shortfalls. It says the recommendations "fall short of three" and then lists four rows. Each row gives a "direction of the correction" in one sentence. No numbered item, no run 0 step, no test, no line of "What reaches you" and no grade in the R1 to R25 table was changed to match. The six conditions still open with "The process changes only by your merge"; "Known limits" still says "Your merge is the last wall"; "What reaches you" still says "Your standing acts are five".
2. **Of 18 testable clauses, the proposal's items meet 2, partly meet 6, do not address 1 and contradict 9.**
3. **Requirement 1 is contradicted on every clause.** The proposal asks 36 distinct acts of the owner. 8 are changes to GitHub or Cloudflare settings about permissions or rules. 3 are borderline. 25 are something else: merging, reviewing, writing, creating a task, starting or commissioning sessions, editing a file, setting Claude's cloud environment, reading reports. Of the 15 recurring acts, 2 are allowed.
4. **Requirement 2 is contradicted in the form the proposal recommends starting with.** "Start smaller than this" gives up overnight running and has no wake at all. There are 22 situations in which product work stops or waits; in 12 of them it waits for the owner although it is not completely blocked, and 16 end only when he acts.
5. **Requirement 3 is contradicted on order and on notification.** P3 starts a layer's jobs together. N7 deletes notices "with no replacement". Nothing in the proposal holds the total order itself: the check it keeps compares imports with declared uses and does not look at position.
6. **The module map at the tranche tip already breaks the total order in three places,** all introduced during Process3: `hypotheses` uses `steps`, `agent-runner` uses `ai-gate`, and `agent-drafts` and `agent-worker` use each other. `origin/main` has none. No evidence file and no line of the proposal mentions this.
7. **Requirements 3 and 4 pull against each other on this product as it is mapped.** If a module's job may start only when the jobs of all modules it uses have merged, the 220 modules form 65 waves, the median number ready at once is 3, the maximum is 12, and a bound of 12 or more never binds. The owner's default of 20 could not be used.
8. **Requirement 4's bound is a sentence.** C12 puts "24" in ARCH's pinned text. Changing it is a merged process change. It counts live sessions, not jobs. Nothing enforces it.

## 1. Requirement 1: the owner's acts

> The user doesn't enter commands nor edit source files. The only actions he will very occasionally take are changes to GitHub or Cloudflare settings related to permissions or rules.

### 1a. Clauses

| Id | Clause | Test |
| --- | --- | --- |
| 1a | He enters no commands | No act of his is typing a command, a script or an instruction to be executed |
| 1b | He edits no source files | No act of his changes the content of a file in a repository, by any route including GitHub's website |
| 1c | His only actions are changes to GitHub or Cloudflare settings related to permissions or rules | Every act asked of him is on a GitHub or Cloudflare settings page and concerns who may do what, or a rule |
| 1d | Very occasionally | The count of his acts per run is near zero and is not periodic |

### 1b. How the Foundations and Ledger meant it to be met

- P17 (modified 3 Nov): "Bob does not edit files or enter commands; when an act only he can take is needed, BOB names it and walks him through it." Suggested and kept with: "during onboarding the platform forces a few GitHub steps of yours; keep those as few as possible, each walked through." Ledger map: held by "Walk-through; every role", status "Design". No mechanism.
- Foundations, "The human and the AI": "Your time is the scarcest resource." "Approving a merge is such an act only when you ask for it: by default a job, layer or tranche merges on a green gate without you, while a public release waits for your approval (GAP-7)". "You do not edit files or enter commands; the few steps of yours the platform forces at onboarding are kept as few as possible and each is walked through (P17)."
- GAP-10: "a green gate merges without Bob, who approves a particular merge only when he asks to."
- REQ-5: "A change to what a provided service means goes to you only by the DES 1 test; every other change is BOB's, recorded once."
- PLT-8: "GitHub acts a session cannot take run on GitHub's runner by workflows with your tokens as secrets."
- PLT-9: "Every credential is gathered once before a product's first tranche". Its own "Against": "each addition is an act of yours."
- Setup: "set by the developer through the fewest steps, each with its reason and tested to work the first time".

The Foundations already carried exceptions that the restated requirement does not allow:

- **A file edit.** "They live only where your own hand puts them: committed by you to each repository's CLAUDE.md." "a check fails any change to the approvals block not made by you through GitHub's website."
- **Starting sessions.** Roles table: ROOT "Started by: You". "If the watcher's session declines, replacing ROOT stays yours".
- **Writing answers.** "Questions that are yours are asked in one place, the walk-through, numbered, with a column for your word".
- **An approval click.** GAP-7: "A public release or promotion to installed sites waits for Bob's approval through the protected GitHub environment".

### 1c. What Process3 did

| Clause | Process3 actual | Source |
| --- | --- | --- |
| 1a | The owner started the first sessions. Tasks were switched off by hand at the 3 Nov halt. | Ledger map PLN-5 |
| 1b | 16 owner patches to the product's `CLAUDE.md` in nine days (641 to 8,664 bytes). 14 owner approvals edits in the process repository. Owner patch 13 (7 Nov) also edited `.claude/settings.json`: a deny on every `git push` and `gh` command and a hook before every Bash call. | product_side 6a; process4_doc line 52 |
| 1c | His acts were mostly words, not settings: decisions on 159 Ledger lines (151 as suggested), at least 36 walk-through questions, 14 of 32 check removals driven by his words, account switches on 5 and 7 Nov. | process4_doc; change_sample; product_side 9 |
| 1d | "Process3 drew objections, approvals and audits from you on every one of its nine days." A coordinator chain carried a question as "Bob's, asked, no answer" for about nine hours on 5 Nov. "Every approvals edit in Process3 halted the process, and the last one ended it." | process4_doc lines 195, 475; causal_forensics 3D |

### 1d. What the proposal says, clause by clause

