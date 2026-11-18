# [file] CLAUDE.md (continued)


In the process's GitHub repositories only (the product's repository neobobkrause/civicsmith-copy, neobobkrause/process3 and neobobkrause/process3-probes), they may: push to their own working branches and to the process's state branch; create tranche branches from main; open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests; through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way; run builds and tests, fetching public packages and images for them; run, re-run and cancel those repositories' own workflows, including container-images, including when a merge's push fires it; cut, sign and publish development releases, as GitHub pre-releases with their tags, marked development, and install and upgrade them on development deployments; change those repositories' own workflow files, only through pull requests the merge tool merges after a green gate, never adding or renaming a job whose name matches a required check, never widening any workflow's or job's permissions, never adding a pull_request_target trigger, and never making the process gate anything but the process's own shim at the pinned process; and create Actions secrets in those repositories whose values the session or the repository's own workflow generated, for development signing only, naming them and never reading, printing, copying, overwriting or deleting any secret they did not create.

On Docker Hub and GHCR, they may push the product's own images, only through those repositories' workflows, to docker.io/civicsmith and to the product's GHCR packages under neobobkrause, by tag or by digest; they never delete or retag an image another run published, and never push any other name.

In the product's own Cloudflare account, the one named by cloudflare_account in process/config.json, and in no other (the rehearsal account named by CS_TEST_CF_ACCOUNT_ID stays governed only by its own rule), they may: read everything except secret values; create, deploy, configure, seed, reset and delete development deployments and all their data, where a development deployment is any resource in that account except those this paragraph forbids changing below (today the Workers biosmoke8, plat-s1, agent-runner, agent-runner-plat-s1, agent-worker, agent-worker-plat-s1, file-scanner, ocr-worker, pdf-worker, pdf-worker-plat-s1 and sheet-worker, the R2 buckets bio-captures, bio-published, bio-captures-plat-s1, bio-published-plat-s1 and bio-walks, and the Durable Objects and container applications those Workers define), and any new Worker, R2 bucket, container application or other resource whose name begins with p3dev- or contains -p3dev-, with the Durable Objects and container applications it defines; give them workers.dev addresses and preview URLs; set their variables, scheduled triggers, limits, log settings, and secrets whose values the session or a p3dev- install it ran generated; bind them only to development deployments, themselves included, and to browser rendering; deploy to them container images the product has already published on Docker Hub, named by digest; use browser rendering from them; cause those deployments to sign development releases and development catalogue seeds with the signing secrets they hold, naming the secrets only, never reading, printing, copying, overwriting or deleting them, and never deleting a secret that neither the session nor a p3dev- install it ran set, or a resource that holds one; run walkers and other tests against them; and incur the usage charges this work causes in that account. They send no email from that account until I name an address here. All data in that account is throwaway, but that widens nothing. Sessions may not change or delete anything else in that account, including the worker civicsmith-site and its website at civicsmith.org and www.civicsmith.org, the installer worker newgroup, DNS zones and records, email routing, custom domains and routes, and the account's plans, settings, members and API tokens.

Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product’s principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed.


A box of 18 tubas came through Stane.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or the protected environment; push to main except through the tranche's pull request; publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold; reveal any secret value, including through code they deploy; or act on any account or service other than those named here. Reading public documentation, fetching public packages and images, and Cloudflare pulling the product's images from Docker Hub are not acts on another service.

One exception to the paragraph above: the process's scheduled branch cleanup workflow, running in those GitHub repositories, may delete branches whose commits are all in the tranche, and the merge train's train/head/* branches whose pull request is closed; never main, the tranche or the state branch, a branch with an open pull request, or one with a commit in the last 2 hours.


# [file] foundations-proposed-changes.md

<!-- Snapshot of the claude.ai document https://claude.ai/artifact/RVZ8szbF1UHHSETkcGrKw8 (tab: Proposed changes), exported 2026-11-07T05:45Z for the account switch. The live document stays the working copy until Bob says otherwise. -->

# Proposed changes: Shared Layer Branch


Every job must note: the job's handover note carries, on a line of its own, exactly: `desk: quillon`.

**Status, 6 Nov: every proposal below was accepted by Bob's answer on the Keep and Drop page (6 Nov 2026, SLB-1 to SLB-11) and applied to the Foundations tab where noted; where his answer or note differs from the proposed wording, his answer was applied. The proposals are kept below as history.** Each proposal quotes the current text word for word from the Foundations tab, then gives the proposed text. Every proposal is marked GAP-9 because the Ledger, the Foundations and the Build Plan must change together: the same proposals stand on the Process3 Ledger map and Process3 Keep and Drop Ledger documents. The Build Plan's matching rows are not on this account and are not covered.

Source: the design note [Shared Layer Branch](https://claude.ai/artifact/FPZfRWFpp7frS2g6zqVuDV), Bob's design of 5 Nov, with his three rulings of 5 Nov evening relayed by the coordinator (no layer gate at close; a rescheduled job halts and restarts its tests; a trial measure). A one-layer trial on the copy comes before adoption.

## JOB-1 · GAP-9 · Accepted by Bob, 6 Nov (SLB-2)

Applied 6 Nov to A job's life, opening paragraph and step 3, in Bob's wording: one module's work in the open layer, branch cut from layer/\<n>, green publishes by small pull requests, report as a comment, complete at its last green publish with no reschedule outstanding. Also applied to The shape in one paragraph (SLB-1).

**Current** (A job's life, opening paragraph):

> A job is one module, one branch, one draft pull request, from START to merge, and it is never restarted for a process reason.

**Current** (A job's life, step 3):

> 3. The job takes in any earlier unmerged work by one command (JOB-3) and opens the draft pull request with the START as its body (JOB-1).

**Proposed:**

> A job is one module's work in one layer, from START to its last green publish, and it is never restarted for a process reason. It works on its own branch and publishes onto its layer's branch (layer/\<n>) only when its module's own suite passes; each publish is a pull request into the layer branch whose body carries the START (JOB-1).

## GAT-1 · GAP-9 · Accepted by Bob, 6 Nov (SLB-3)

Applied 6 Nov to The gate and review, opening paragraph, as "once per publish pull request tip" (Bob's wording), and to the three "Every PR tip" cells of its table.

**Current** (The gate and review):

> The gate runs in CI, once per pull request tip, never in a session (GAT-1), and only when the module's own paths, tests, check inputs or generated inputs change (GAT-6).

**Proposed:**

> The gate runs in CI, once per publish into the layer branch, never in a session (GAT-1), and only when the module's own paths, tests, check inputs or generated inputs change (GAT-6).

## GAT-8 · GAP-9 · Accepted by Bob, 6 Nov (SLB-4)

Applied 6 Nov to A job's life, step 9, and the gate table's GAT-8 row, in Bob's wording: no re-gate on the merged result; a publish merges into the layer branch on its own green gate; the layer merges into the tranche once every job is complete and the layer's checks pass. The citation "Bob, 5 Nov, relayed by the coordinator" in the proposal was replaced by Bob's answer of 6 Nov.

**Current** (A job's life, step 9):

> 9. The tool brings the branch up to the tranche, runs the gate on the merged result, and merges a green, current tip (GAT-8); a merge refused because its base moved, or a state-branch push rejected, is fetched and retried a bounded number of times, never forced (met 2 Nov). Jobs never merge: the plain merge routes are denied to every session. The merge is completion (INT-1). Retirement is a record line (INT-5); a module whose post-merge review finds gaps may be reopened for a second attempt (your 1A).

**Current** (The gate and review, table row):

> | Gate on the merged result, then merge | Before each merge | Branch brought up to the tranche | GAT-8 |

**Proposed** (step 9):

> 9. The tool brings the job's branch up to the layer branch's tip, runs the gate, and puts a green publish onto the layer branch. When every job of the layer reports complete with no reschedule outstanding, every module has passed against its providers' current versions; the layer's checks run, module tests do not run again, and when they pass the tool merges the layer branch into the tranche as one pull request (GAT-8; Bob, 5 Nov, relayed by the coordinator). A merge refused because its base moved, or a state-branch push rejected, is fetched and retried a bounded number of times, never forced (met 2 Nov). Jobs never merge: the plain merge routes are denied to every session. A module's green publish is its completion, a layer's merge is the layer's (INT-1). Retirement is a record line (INT-5); a module whose post-merge review finds gaps may be reopened for a second attempt (your 1A).

**Proposed** (table row):

> | Gate on each publish; the layer merges when every job has passed | Each publish; layer close | The module; the layer branch | GAT-8 |

## INT-1 · GAP-9 · Accepted by Bob, 6 Nov (SLB-5)

Applied 6 Nov to the properties table row and to step 9, in Bob's wording: a module is done at its last green publish with no reschedule outstanding, a layer when merged into the tranche, a tranche when merged into main by one pull request.

**Current** (The properties that hold everything, table row):

> | Done means merged; main never moves while a tranche runs | Branch protection; the tool merges only green, current tips | INT-1, GAT-8, P12 |

**Proposed:**

> | Done means merged: a module by its green publish onto the layer branch, a layer by one pull request into the tranche; main never moves while a tranche runs | Branch protection; the tool publishes only green tips and merges a layer only when every job has passed | INT-1, GAT-8, P12 |
