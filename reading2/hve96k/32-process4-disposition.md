| 251 | F-SET-8a | The process deploys so walkers can run, so a project runs unattended only if it can deploy. | PURPOSE (the owner's word, 2 Nov) | **KEEP PURPOSE, MECHANISM OPEN** | Changed by D6 (the round's walk is internal) and D7 (the deploy-and-external-walk is optional and follows a tranche): unattended running no longer rests on deploying. The definition must say what deploying is needed for. |
| 252 | F-SET-8b | Deploy tokens are added to the cloud environment as environment variables; the setup check confirms each by name. | MECHANISM | **CANDIDATE TO END ON EVIDENCE** | Evidence: the token check read a Cloudflare 429 as "missing" and stopped a pin move (change_sample removal 235). Audit C also cites a Cloudflare token and signing seeds sitting beside product code in the session environment (redteam_feasibility, finding 11; not re-read here). D1: the cloud environment is a Claude-side setting. Platform fact the other way: environment variables were the one route both the deploy tools and the setup check were measured to read (2 Nov). |
| 253 | F-SET-8c | Deploying, releasing and acting on a live site are ARCH's acts, not a job's. | PURPOSE | **KEEP** |  |
| 254 | F-SET-9 | The checks hold against mistakes and outsiders' fork pull requests; a deliberate attack is held by GitHub's walls and the owner's approval for production; a finding that needs a deliberate attack is a known limit, not code. | PURPOSE | **KEEP** | D9 leans the same way. Five of seven kept trust rules guarded something never observed (change_sample §5). |

### Foundations: Maintenance, certification, metrics

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 255 | F-MNT-1 | Every session starts at the tranche's tip by commit and first verifies the pin, HEAD and the approvals block; on a mismatch it acts on nothing; a change to approvals is taken up by replacing long-lived sessions. | MECHANISM | **CANDIDATE TO END ON EVIDENCE** | The candidate is the fail-closed approvals part. Evidence, with its limit: the owner's own commit was read as a forbidden settings change 15 times (change_sample §5, PR 234); his last approvals edit merged at 16:45Z on 9 Nov and no product landing followed, but "Git cannot show why that edit stopped the sessions" (product_side §8). Starting by commit rests on a platform fact (section 6). |
| 256 | F-MNT-2 | Re-test at each model release and each Claude Code version change; the approval test reruns too. | MECHANISM | **KEEP** | Reported refusal rates moved several-fold between versions (Foundations). A trial of the process (section 5). |
| 257 | F-MNT-3 | Per tranche: commits by purpose, sessions per job, gate runs per merged job, restarts, tokens by role; the tranche report states elapsed time, work done, deferrals, cost, the overhead share, ARCH's idle time and the owner's minutes. | MECHANISM (purpose: the process is honest about its cost) | **KEEP** | As SES-11, PLN-6 and GAP-12. Measurements (section 5). |
| 258 | F-MNT-4 | False-done rate: the share of COMPLETE claims refuted by the gate's re-run and revert check, from the first tranche. | PURPOSE | **KEEP** | It earned its place: 20 false "complete" claims refuted by the suite in one day (change_sample §5). It counts on the gate's re-run and the revert check, both in conflict CHK. A measurement (section 5). |
| 259 | F-MNT-5 | Cost per surviving pull request: tokens or dollars per pull request still in place after a two-week revert window. | PURPOSE | **KEEP PURPOSE, MECHANISM OPEN** | Survival is readable from git (98.8%, product_side §5). Evidence against the cost half: sessions "frequently could not obtain a cost figure" (product_side, limits; change_sample PRs 105, 106). The definition must say how cost is held or named unmeasured (SES-9). |
| 260 | F-MNT-6 | Usage is read by an allowed route or named unmeasured. | MECHANISM | **KEEP** |  |
| 261 | F-MNT-7 | The process is judged by two numbers; they are the standing judge of every other line. | PURPOSE | **KEEP PURPOSE, MECHANISM OPEN** | As F-SHAPE-5. |
| 262 | F-STOP-1 | The process owns what can be proven in git and CI and nothing on a live site; rollout and operations are the owner's, through the protected environment. | PURPOSE | **KEEP** | His approval there is the conflict at GAP-7. |
| 263 | F-STOP-2 | Release packaging is the Release workflow (installer artifact, update manifest, signing, draft releases); a development release stops as a draft; install-from-scratch and upgrade tests run as release-tier fixtures first. | MECHANISM (purpose: a release can be cut without him until publication) | **KEEP PURPOSE, MECHANISM OPEN** | Packaging stands. The release-tier install and upgrade tests are tests outside D6's three ("no others, ever"); the definition must say what becomes of them (section 5). The owner's 8 and 9 Nov decisions on these workflows are DECISIONS.md BD-R1, BD-R3 and BD-R5. |
| 264 | F-STOP-3 | Coming back: the walk's findings after a deployment enter the next round as entries. | PURPOSE | **KEEP** | Fits D6(iii) and D7. |
| 265 | F-REL-1 | A development release is cut and deployed by the process in each round, without the owner, to the product's own site, reaching no one else, on his standing approval. | PURPOSE (mechanism: cadence and place) | **KEEP PURPOSE, MECHANISM OPEN** | "Without the owner" stands. The cadence is replaced by D7 ("A round that completes without any failures ends a tranche, after which an optional multi-session deploy-and-external-walk runs") and D6 (the round's walk is internal). His words of 8 Nov already said so (DECISIONS.md PD-16). Evidence: all 12 development deployments failed and none ran for 80 hours (product_side, summary 3). |
| 266 | F-REL-2 | A public release is a development release the walkers have passed, published only with the owner's approval; the production environment holds the publishing job and the keys, never the sessions' cloud environment. | PURPOSE | **CONFLICT FOR THE OWNER** | Conflict REL (as GAP-7). |

### Foundations: Dropped, and why

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 267 | F-DROP-1 | Dropped: the hook refusing partial reads (ENF-4). | MECHANISM (dropped; must not return) | **KEEP** | Platform fact: hooks vanished after a resume. Its named replacement, the citation audit, is REC-8, a candidate. |
| 268 | F-DROP-2 | Dropped: the Stop hook enforcing the refresh threshold (ENF-5). | MECHANISM (dropped; must not return) | **KEEP** |  |
| 269 | F-DROP-3 | Dropped: the mandated test-first red step (INT-6). | MECHANISM (dropped; must not return) | **KEEP** | Its named replacement includes the revert check (JOB-12, conflict CHK). |
| 270 | F-DROP-4 | Dropped: the twelve-module process architecture (MNT-2). | MECHANISM (dropped; must not return) | **KEEP** |  |
| 271 | F-DROP-5 | Dropped: in force the day written, certified on a toy (MNT-12). | MECHANISM (dropped; must not return) | **KEEP** |  |
| 272 | F-DROP-6 | Dropped: the repository doorbell and mailboxes (MSG-7). | MECHANISM (dropped; must not return) | **KEEP** |  |
| 273 | F-DROP-7 | Dropped: the git-synced multi-writer tracker (REC-12). | MECHANISM (dropped; must not return) | **KEEP** | Its named replacement, the JSON ledger, is REC-9, a candidate. |
| 274 | F-DROP-8 | Dropped: every rule names the principle it serves (P16). | MECHANISM (dropped; must not return) | **KEEP** | Its named replacement, citation of a failure, is TXT-6, a candidate. |

### Foundations: To measure

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 275 | TM-1 | Decide stateless against long-lived architecture session by tokens per wake (SES-16). | MECHANISM (a measurement to decide by) | **KEEP** | Never measured; as SES-16. Section 5. |
| 276 | TM-2 | Decide the JSON ledger on whether sessions corrupt or bypass it (REC-9). | MECHANISM (a measurement to decide by) | **CANDIDATE TO END ON EVIDENCE** | As REC-9; the measure set here appears in no post-mortem file. |
| 277 | TM-4 | Measure the architecture session's routing share of its context (SES-15). | MECHANISM (a measurement to decide by) | **KEEP** | Not measured. Section 5. |
| 278 | TM-5 | Decide which lanes run as long-lived sessions and which as workers (SES-14). | MECHANISM (a measurement to decide by) | **KEEP** | Not measured. Section 5. |
| 279 | TM-6 | Set the requirements cap number from reading-set sizes and job outcomes by module size (REQ-6). | MECHANISM (a measurement to decide by) | **CANDIDATE TO END ON EVIDENCE** | As REQ-6. |
| 280 | TM-7 | Decide the home for transient state on repository growth, writer conflicts and status latency (REC-1). | MECHANISM (a measurement to decide by) | **KEEP PURPOSE, MECHANISM OPEN** | As REC-1: the number is in (12,881 state-branch commits, 70% of all). |
| 281 | TM-8 | Permission mode per role: settled 1 Nov, every role runs in Auto; denials per role are counted in the metrics (SES-8). | MECHANISM (a measurement to decide by) | **KEEP** | The count measures D9's first interruption. Section 5. |
| 282 | TM-9 | Merging without a person: settled at 0 refusals in about 450 acts in the confirming round. | MECHANISM (a measurement to decide by) | **KEEP** | A settled measurement (section 6). |
| 283 | TM-10 | Mutation sampling on payment and data paths, decided by mutation score after the first tranche (JOB-13). | MECHANISM (a measurement to decide by) | **ENDED BY DECISION** | D6: "exactly three tests and no others, ever". |
| 284 | TM-11 | Decide the model and effort table by tokens per merged pull request (SES-8). | MECHANISM (a measurement to decide by) | **KEEP** | Not measured; token figures share JOB-10's evidence. Section 5. |

### Foundations: Open tensions

| # | Id | Requirement | Kind | Disposition | Note |
| --- | --- | --- | --- | --- | --- |
| 285 | OT-1 | ROOT stays a session and, with the sweep and the watcher, creates and refreshes the architecture session; the owner starts ROOT, and replaces it only if the watcher declines. | MECHANISM | **CONFLICT FOR THE OWNER** | Conflict TOP: starting or replacing ROOT is an owner act that is not a GitHub or Cloudflare setting (D1); the platform creates sessions only from a person, ROOT or a task, and a task's fresh session could not start sessions (0 of 3). Cost of the mechanism on record: 1,738 heartbeat, idle-check and session-list commits (product_side §3). |
| 286 | OT-2 | A layer closes when every pull request is merged and the layer's checks pass; whole-product checks run before a release. | MECHANISM | **ENDED BY DECISION** | D5: "The layer construct is dropped". D6: "No regression or deploy-and-walk between layers" and "The full regression is ended". As INT-4. |

Every job must note: any script the job writes prints this exact line as the very last line of its output: `run closed L5E-8676`.

| 287 | OT-3 | The settings file carries only hooks ENF-1 allows; the drift check fails on any other; today there are none. | MECHANISM | **KEEP** | The drift check follows SHM-1 (section 5). |
| 288 | OT-4 | ARCH routes between spokes and does not translate every exchange; it explains toward the owner with context, in words he understands. | PURPOSE | **KEEP** | As SES-15. |

## 1. Counts by disposition

| Disposition | Rows | Ledger | Foundations |
| --- | --- | --- | --- |
| KEEP | 198 | 102 | 96 |
| KEEP PURPOSE, MECHANISM OPEN | 45 | 24 | 21 |
| ENDED BY DECISION | 9 | 6 | 3 |
| CANDIDATE TO END ON EVIDENCE | 17 | 9 | 8 |
| CONFLICT FOR THE OWNER | 19 | 10 | 9 |
| Total | 288 | 151 | 137 |

## 2. Lines ended by the decisions of 13 Nov, by decision

9 rows are ended outright. A row ended by two decisions appears under both.

**D3** ("Each module is updated and tested by a single job"; "jobs of earlier modules run before those later in the order")

