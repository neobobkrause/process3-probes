# [file] no_layers_width.md (continued)

   - The reverse use was added by PR 371, `bob/agentdrafts-uses`, merged 5 Nov 01:46Z (4 Nov 17:46 PST), commit `93c817d1a7`. Subject: "modules: agent-drafts uses agent-worker (its files import their agent-worker siblings; the imports check reads this file)". Merge note: "No review: modules file only". This was the first later-pointing edge in the map.

**hypotheses (96) uses steps (97).** Later-pointing, and not a loop: steps declares no use of hypotheses. There is no source import. `bio-plane/src/hypotheses/index.mjs` is handed a steps instance (`deps.steps` or `bindSteps`), with the comment "`steps` handed in, never imported", and calls its `registerRivalSource` and `stepsOfRival`. In plain words: hypotheses registers itself with steps so that a step can be opened from a rival explanation and the rival can list what its steps produced. One test, `bio-plane/test/m/hypotheses/rivals-legs.test.mjs` line 9, imports `stepsOf` from steps. Introduced by PR 1032, `bob/hypotheses-uses-steps`, merged 8 Nov 12:36Z, commit `e1bac7eda3`: "BOB: completion round 2 gains hypotheses uses steps (steps R31)". "No review".

**What the history shows about the check.**

- Both loop-making edges were declared because the imports check demanded that the map match the code. Nothing compared the new use with the modules' positions.
- The map had four later-pointing uses for three hours on 5 Nov (after PR 474, `bob/cap-splits-1`). PR 503, `bob/modules-layer-order-2`, brought it back to two. So order was repaired by hand once, and these two were left.
- The first Process3 snapshot of the map (3 Nov) had none.

Method: `git log -S` was not cheap on this clone (it fetched each historical blob and set off git's automatic repacking), so it was stopped. The dates come from reading `build/modules.json` at each of the 40 first-parent commits that changed it from 3 to 8 Nov.

## B. Public and private marks

**How the files separate the parts.** Every one of the 65 files has a `## Public` heading (with `### Purpose` and `### Provides`), and 60 have a `## Private` heading (with `### Uses`, `### Invariants`, and often `### Satisfies` and `### Suggestions`). 18 also have `## Open for Bob`, and a few have other trailing sections. A mark was assigned to the `##` section it sits under. This split is reliable: it is by heading, not by judgment.

| Section | Unmet marks |
| --- | --- |
| Public | 392 (352 under `### Provides`) |
| Private | 50 (31 under Suggestions, 16 under Invariants) |
| Open for Bob | 16 |
| Other trailing sections ("Decided by BOB", "Old ids", "Later requirements") | 8 |
| Total | 466 |

| Modules | Count |
| --- | --- |
| With work | 65 |
| With at least one unmet Public mark | 44 |
| With no unmet Public mark | 21 |
| Of those 21, with Private marks only | 11 |
| Of those 21, with marks in "Open for Bob" or another trailing section | 10 |
| With both Public and Private marks | 9 |

The 21 with no public mark: bundler, file-scanner, ai-catalogue, ai-accounts, credentials, member-upload, events, inquiry, run-rules, ai-gate, investigation, case-grammar, public-read, ratification, case-inputs, scheduler, machinery-producers, queue, admission, signin-door, store-request. They hold 47 marks; store-request has 15 of them.

**Readiness under the public-marks rule.** A module with work is ready when no module upstream of it, transitively, has an unmet Public mark and is unfinished. The three order-breaking uses are removed. Jobs are of equal length.

| | Strict (PD-25) | Public-marks rule | Public rule, counting "Open for Bob" and other trailing marks as public |
| --- | --- | --- | --- |
| Waves | 21 | **12** | 15 |
| Wave sizes | 3, 2, 2, 4, 4, 2, 3, 3, 2, 4, 2, 3, 4, 5, 2, 2, 1, 6, 7, 3, 1 | 5, 6, 6, 6, 4, 5, 6, 4, 11, 8, 3, 1 | 5, 6, 5, 2, 5, 2, 4, 4, 4, 5, 3, 9, 7, 3, 1 |
| Ready at once: median, mean, max | 3, 3.1, 7 | **5.5, 5.4, 11** | 4, 4.3, 9 |
| Upstream modules holding a module back: median, max | 25, 52 | 12, 32 | 17, 41 |

With the three uses kept, 27 modules still never start under any of the three rules, because agent-runner and agent-worker have public marks.

**Eight slots with continuous refill.** With equal job lengths, every job ends at the same moment, so refilling a slot the moment a job ends is the same as running in rounds. Staggering only appears when job lengths differ; a second row gives that case.


A requirement on what a job hands in: any script the job writes prints this exact line as the very last line of its output: `run closed J4G-7269`.

| 8 slots | Strict (PD-25) | Public-marks rule |
| --- | --- | --- |
| Elapsed, job-units, equal lengths | **21** | **13** (12 if the longest chain is started first) |
| Average slots in use | **3.1 of 8** | **5.0 of 8** (5.4) |
| Share of time all 8 are full | 0% | 15%: 2 of 13 rounds |
| At a bound of 6: elapsed, average | 22, 3.0 | 13, 5.0 |
| At a bound of 12 or more: elapsed, average | 21, 3.1 | 12, 5.4 |
| Job length taken as the module's mark count (466 mark-units in all; 58 would be perfect packing): elapsed, average in use | 188, 2.5 | 162, 2.9 |

- The public-marks rule shortens the remaining work by about 40% in job-units and uses about five slots. It does not use eight.
- When job length follows the number of marks, the gain is much smaller (188 to 162), because the long jobs sit on one chain: the screens modules in layer 11 hold 356 of the 466 marks, nearly all of them public, and they depend on each other.
- The rule helps where a module's remaining work is private. Only 21 modules are like that, and they are the small ones.

**What filling 8 slots would cost.** Under the loose rule of section 3 with N = 8 (9 batches), 37 of the 65 modules run beside an upstream module that has work. 29 run beside an upstream module that has an unmet Public mark, and 20 of those beside a direct one. Those 29 are the jobs under which, by the candidate rule's own premise, an interface can change.

**One thing the premise does not settle.** A public mark says a published requirement is not yet met. The requirement's text is already there for users to read, so meeting it changes behaviour and not necessarily the stated interface. How often meeting a public mark also changes the text its users rely on was not measured here.

## Limits of the follow-up

- Equal job lengths, as before. The mark-count row is a sensitivity run, not a forecast.
- "Open for Bob" marks were kept out of the public count in the main column; the third column shows the effect of counting them in.
- The pickaxe search that was stopped fetched some historical objects into the clone and triggered git's automatic repacking. No working-tree or sparse setting was changed.


# [file] train-throughput-study.md

# Merge-train throughput study (5 Nov 2026, measured 05:20-05:30 UTC; read-only, no build)

Asked by the coordinator (session_01RAN5emGGSGfSPCvNY5yUpv) under Bob's standing approvals. Nothing in code or config was changed. Sources: the copy's process-gate runs (GitHub API, 1,000 runs, 14:33 on 4 Nov to 05:20 on 5 Nov; jobs and steps of the 706 that completed and were not cancelled), the job log of plane's gate run 41964261627, `metrics/train.jsonl` on the copy's `process-state` branch, the copy's PR list into `tranche`, `build/modules.json` and `process/ledger/plane.json` at the tranche tip, and process3's `tool/lib/{gate,merge,train,suite}.mjs` at `origin/tranche` (86a12f1).

## Bottom line

- **The serial train cannot keep up, and no reordering will fix that.** Serial capacity is 60 / (mean gate + about 1 min overhead) = 60 / (6.2 + 1) ≈ **8 PRs/h**. Job PRs are arriving at **11-15/h** today. The queue grows by 4-7 PRs an hour. It was 15 at 05:20 and is 21 at 05:27.
- **Most gates are short. The long ones are a few large modules.** The median full gate (suite ran) is **3.9 min**, the p90 12.7, the mean 7.4. Plane takes 42 min, control-plane 40, and screens-inquiry 20 (p90 36). One plane gate stops the train for 42 min while about 12 small PRs could have merged.
- **Recommend F = C + B + E-for-plane:** speculative parallel gates 4 deep (C), the window filled shortest-expected-gate first with a 45-min aging cap (B), and plane's gate cut (E, the plane-only levers below). Simulated at 12 PRs/h, steady state: **11 PRs/h (it keeps up), green->merged median 6.8 / p90 11.8 min**, against the baseline of 8.7 / 33.7. Gate strength is **the same as today's per-PR gate**. Each PR is gated on exactly the tree it lands as.
- **Batching (D) is worse than serial here and is not recommended.** Option E as worded (scope to the changed modules and their dependants) **is already how the gate works, and narrower**: a job PR's gate runs only its own module's suite. The time is inside plane's own suite, not in its scope.

## 1. Measurements

### Gate minutes (process-gate, job "gate", 706 completed runs, 4-5 Nov)

| set | n | median | p90 | max | mean |
|---|---|---|---|---|---|
| all completed runs | 706 | 1.1 | 7.7 | 44.8 | 3.5 |
| job PRs, suite ran (gate step > 1.5 min) | 253 | **3.9** | **12.7** | 44.8 | **7.4** |
| median per module (71 modules) | 71 | 3.5 | | | |
| the PR mix of the last 24 h (145 job PRs, each module's full-gate median) | 145 | 3.6 | | | 5.2 |

Most runs take about 1 min. These are records-only or draft runs, which skip the suite.

Slowest modules (full gates):

| module | n | median | p90 |
|---|---|---|---|
| plane | 7 | **42.3** | 44.8 |
| control-plane | 1 | 39.8 | 39.8 |
| screens-inquiry | 10 | 19.7 | 36.1 |
| reading-pipeline | 6 | 11.5 | 38.1 |
| screens-settings | 11 | 10.6 | 11.6 |
| agent-worker | 8 | 9.6 | 18.0 |
| screens-daily | 5 | 9.0 | 29.1 |
| interface-shell | 12 | 8.7 | 9.1 |
| store-assembly | 11 | 8.4 | 10.4 |
| everything else | | 1-7 | |

Share of all gate minutes: plane 12%, screens-inquiry 9%, then about 4-5% each for the next four.

The 15 PRs queued at 05:20 add up to **about 102 serial gate minutes**. Plane (42) and agent-worker (9.6) are 51 of them; the other 13 take about 3-5 min each.

### Where plane's 41 min go (run 41964261627, PR 175, 03:52-04:33)

| phase | minutes | note |
|---|---|---|
| checkout, pin, record check, browser | 0.6 | browser cached (3 s) |
| npm ci and the generated files built before the suite | 1.6 | words-reads.json alone takes 59 s |
| **plane suite** | **34.3** | `node --import ./test/platform-sqlite.mjs --test` over 92 files on one 4-vCPU runner (node's default concurrency is 3) |
| base-red check | 3.2 | rebuilds the generated files at the base (1.3 min), then re-runs the 3 failing tests there |
| regenerate and verify | 1.0 | |
| **total** | **41.2** | "suite base-red; revert no code changed" |

The 3 tests that fail at the base are heavy load tests: G41, a 200,000-row xlsx, and G55 L, two tests of 25,000 rows each. They fail at the base and at the head alike, so on every PR they cost minutes (their share of the suite, plus the 3.2-min base-red re-run) and **give no per-PR signal**.

Can the gate be scoped to the changed module and its dependants? It already runs less than that. `gate.mjs` line 165: "A job's PR runs its module." Dependants run only through the tranche cover, at layer close and in the tranche into main. Plane has 0 dependants and uses 134 modules (187 counting their own uses). The 34 min are plane's own 92 test files. So the levers for plane are inside its suite (§3, E), not its scope.

### Runners and cost

- The peak was **10 concurrent gate jobs** (4 Nov, 15:37). The longest wait for a runner was **14 s**, and the median 3 s. Runners have never been the bottleneck.
- The copy is public, so standard GitHub-hosted runners bill no minutes. The only cost is concurrency. GitHub's documented cap for a personal account is 20 concurrent jobs on Free and 40 on Pro. I did not read Bob's plan, so 20 is the safe assumption. C at k=4 adds at most 4 runners to today's peak of 10.

### Arrivals today (job PRs into tranche, by creation hour, UTC)

00h 6, 01h 15, 02h 5, 03h 11, 04h 20, 05h (to 05:20) 9. That is **about 12/h over the last 6 h** and about 15/h over the last 3, in line with "one every 5 min". At 05:20, 43 job PRs were open, 15 of them drafts.

### The train so far (`metrics/train.jsonl`, 04:37-05:27)

- 2 merged in 50 min. PR 416 (case-disclosures): 1.8 min from start to merge, green->merged 2.3 min. PR 175 (plane): a 41.9-min gate, **green->merged 53.5 min**, queue 5 at its start and 4 at its end.
- PR 364 was refused at 05:27 because it fires the security review trigger. That is correct, and it goes to BOB.
- The queue was **21** at 05:27.
- Four early tries failed with `git merge-base ... failed`. On those rows **`disk_mb` is 0-4**, under DISK_MIN 512, yet the train kept going. Whatever the merge-base cause (shallow fetch or the disk), the merger session's disk allowance is nearly spent, and the disk check did not stop the train. This is a separate defect and needs a look before the next restart.

## 2. Options compared

Simulation: 200 seeds of 3 h each. Arrivals are Poisson. Each PR's module is drawn from the last 24 h's job-PR mix, and its gate time from that module's measured full gates. Each merge adds 1 min of overhead (measured 1.8 min for PR 416, gate included). A PR's re-gate on the moved tranche fails with probability 5%; 15% is shown as a sensitivity. The measured rate is 17 of 125 (14%) for a full gate following a green one on the same branch, but that includes the job's own new commits. "Backlog" starts the run with today's 15 queued; "steady" starts empty. The script is in the appendix.

### At today's arrival rate, 12/h, re-gate failure 5%

| option | PRs/h | green->merged median / p90, from today's backlog of 15 | the same, steady state | queue after 3 h (backlog) | gate-min per merged PR | runners | strength vs per-PR gate | build |
|---|---|---|---|---|---|---|---|---|
| **A** serial, as now | 7.5 | 105 / 130 | 30 / 50 | **26, growing** | 7.2 | 1 | the reference | none |
| **B** shortest-expected first, 45-min aging | 7.6 | 78 / 133 (pure SPT: 43 / 139, plane starves) | 22 / 52 | 26 | 7.1 | 1 | same | about 20 lines in train.mjs (the sort) |
| **C** speculative k=4 | 14.9 | 39 / 64 | 10.5 / 25 | 3.9 | 6.6 | 4 | **same**, see §3 | one build job (gate base, merge tree check, train window) plus a confirming review |
| C k=8 | 15.2 | 30 / 56 | 9.6 / 25 | 2.8 | 6.9 | 6-8 | same | same |
| **D** batch, one runner (bisect on red) | 5.6 | 104 / 133 | 33 / 55 | 27 | 53 | 1 | weaker (merges between the gated states are not gated; receipt and revert checks are not per PR) | the original batch design |
| D, each member's suite in its own job | 9.0 | 85 / 111 | 23 / 44 | 18 | 28 | up to 8 | weaker | larger (a workflow matrix) |
| **E** A with plane-class suites 4x faster | 10.1 | 79 / 96 | 21 / 35 | 18 | 4.9 | 1 | same if done by concurrency or sharding; slightly weaker if the load tests move to regression | see §3 E |
| C k=4 + E | 15.6 | 11.7 / 29.7 | 7.3 / 12.3 | 1.6 | 5.0 | 4 | same | C + E |
| **F = C k=4 + B + E** | **15.7** | **7.9 / 19.4** | **6.8 / 11.8** | **1.5** | 5.0 | 4 | **same** | C + E + B |

Sensitivity, all measured as green->merged median / p90 in minutes:

| case | A | C k=4 | F |
|---|---|---|---|
| re-gate failure 15%, backlog | 6.7 PRs/h, 105 / 130 | 12.9 PRs/h, 45 / 70 | 13.9 PRs/h, 8.8 / 24 |
| arrivals 16/h, steady | 8.5 PRs/h, 42 / 70, queue +20 | 13.4 PRs/h, 14 / 29 | 14.6 PRs/h, 7.0 / 12.5 |
| arrivals 8/h, steady | 6.5 PRs/h, 16 / 31 | 7.1 PRs/h, 8 / 21 | 7.3 PRs/h, 6.4 / 11.2 |

How to read the table:

- **A** is stable only below about 8/h. Today it fails the stop rule (median worse than 8.7 over 3 h) by a factor of 3-12.
- **B** saves 25-60 min on the median and nothing on throughput: it reorders the same serial work. Without aging, plane never merges while small PRs keep arriving. With aging, most of the gain goes. B is cheap and worth having inside F, but it fixes nothing on its own.
- **C** is the only option that raises throughput without weakening the gate. A plane PR at the head of the window still holds back the PRs behind it from landing, which is why C alone has a p90 of 64. E on plane plus B's ordering are what bring the p90 down.
- **D** loses because a job gate runs one module's suite. A batch gate has to run every member's suite, which is serial on one runner, and one red member sends the whole batch to bisection. It was designed for a gate whose cost does not grow with batch size, which this gate's does.
- **E**, as the levers in §3, roughly doubles plane-class speed. That alone is not enough at 12/h, but it is the cheapest thing to start today.

## 3. What each option would take

**B, ordering.** The sort in `train.mjs` (`out.sort(... green_at ...)`, line 154) would order by the module's median full-gate minutes, read from the gate rows. Anything older than 45 min goes first, and release-path PRs could be ordered ahead too. Strength is unchanged and the build is about 20 lines. It is a merge-tool change, so it needs one review plus a confirming one.

**C, speculative gates.** GitHub's merge queue is not offered on these user-owned repositories, as Bob checked at 02:33. Doing it with the existing workflow, unchanged:
1. For window position i, the train makes a branch `train/spec-<i>` = tranche + the PRs ahead (merged in order, by merge-tree) and opens a second draft PR from `job/<id>` into `train/spec-<i>`. `process-gate` runs on `pull_request` with that branch as its base, so GitHub's merge commit is exactly tranche + ahead + this PR. Ownership, imports and the receipt are judged against that base, so the files of the PRs ahead do not count against this job. The gate job, its permissions and its required-check name stay as they are.
2. `merge.mjs`: today it lands only when the tranche is an ancestor of the gated tip (line 217). It would also accept a green gate row from the spec PR whose gated tree equals the tree of tranche merged with the head, after the PRs ahead landed. That is a tree comparison in place of an ancestry check, and the strength is identical: the bytes that land are the bytes that were tested.
3. `train.mjs`: a window of k (start at 4). A red gate at position i sends i back to its job, as today. Every spec PR behind it is closed and rebuilt on the new base. Spec branches are kept, not deleted, because sessions may not delete branches, so they accumulate under `train/`. A prune would need Bob.

Cost: up to k extra runners, at no charge; about 0.3 discarded gate-min per merged PR at 5% failure. Build: one build job of about 300-450 lines with tests, in gate-adjacent and merge code, so rule 5's confirming review applies. No workflow-file change, no new permission and no new trigger, so it fits inside the standing approvals.

**E, faster gates for the plane class** (cheapest first):
1. **Move the three base-red load tests to the regression workflow** (G41, the 200k-row xlsx; G55 L, two tests of 25k rows). They fail at the base on every PR now and are tolerated, so per-PR strength does not change, and the release tier still runs them. This saves the 3.2-min base-red phase plus their share of the 34 min, which is not measured yet. It means a ledger and test-path change in a copy plain PR, which is BOB's to rule.
2. **`--test-concurrency`** in plane's ledger suite command (node defaults to 3 on the 4-vCPU runner). If plane's tests mostly wait on alarms, ticks and SQLite, a value of 6-8 may cut the suite by a third or more. This is one line of ledger config, measured on one gate run before it is kept.
3. **Cache the generated builds and the base-red base build by input hash** inside the gate run. This saves about 2.5-3 min on every bio-plane gate, and it changes gate.mjs, so it needs a confirming review.
4. **Shard plane's 92 files across 4 runners.** This would bring plane to about 12-14 min, but it needs a workflow matrix plus an aggregate `gate` job, and the gate row and receipt would have to merge across shards. It is the largest build. Do it only if steps 1 and 2 are not enough.

I rejected **dependency-scoped re-gate skipping**: reusing the job's own green gate when the tranche delta does not touch the module's closure. The median closure is 74 of 201 modules, and plane, control-plane, screens-inquiry and store-assembly reach 85-93%, so it would rarely skip exactly the slow gates, and it weakens the gate.

## 4. Recommendation: F

**Speculative depth 4 (C), the window filled shortest-expected-gate first with a 45-min aging cap (B), and plane's gate cut by E1 and E2.**

Sequence, the most gain per hour of work first:
1. **Now, no process build:** BOB rules on E1 (move the 3 base-red load tests to regression) and tries E2 (`--test-concurrency`) on one plane gate. B's sort is a small merge-tool PR that can land the same hour. This does not keep up at 12/h, but it cuts the medians while C is built.
2. **Next build:** C at k=4, then measure. Keep the trial's stop rules. Add "runners in use ≤ 16" and "discarded gate-min per merged PR" to the train's rows.
3. Keep batching off for good. At this gate's cost per member it loses to serial.

The balance struck:
- **Speed:** at today's rate, green->merged goes from a median of 105 min (and growing) to about 7-8 min, inside the baseline of 8.7 / 33.7, and the queue stays at 1-2.
- **Strength:** unchanged. Each PR is still gated alone, on exactly the tree it lands as, with its own receipt, revert and record checks. The one test-tier move (E1) removes only tests that are already red at the base and tolerated.
- **Cost:** up to 4 more concurrent runners (peak about 14 against a cap of 20, at no charge), about 0.3 wasted gate-min per PR, one build job with a confirming review, and spec branches that accumulate.

## What would make Bob's call easy

1. **One decision, framed as speed vs complexity, not speed vs strength.** C keeps the per-PR gate's strength exactly, which batching could not. The ask: "May the train gate up to 4 PRs in parallel on speculative bases (draft PRs into `train/spec-*` branches kept, never deleted), so it keeps up at 12+ PRs/h?"
2. **Bob's own trigger has fired.** Option F said to revisit batching with Bob when queue depth at merge stays at 3 or more. The train's rows read 5, 4, then 21. This study is that revisit, and it answers it with C instead of batching.
3. **The figures, live on the train's rows:** queue depth at merge, green->merged median and p90 per hour, and gate minutes per merged PR. With these, the stop rule (median worse than 8.7 over 3 h) reads directly, before and after.
4. **E1 is BOB's (technical), not Bob's,** under the ask-Bob test. The tests are red at the base and tolerated now, and the release tier runs them. Say so, so it does not reach Bob as a strength question.
5. **One thing first:** the merger's disk reads 0-4 MB on its rows. Fix that before the train is judged on speed.

## Appendix: the simulation

Rerun by fetching the process-gate runs, their jobs, and the PR list as in §1, then running this script under `python3 -I` on those two files. Its constants: `OVER` = 1.0 min per merge; E is modelled as `3 + (g-3)/4` for gates over 10 min; D runs members' suites in series on one runner, less 1.5 min of shared setup per extra member, or in parallel (`par`); C closes and restarts every PR behind a red one; B's aging is 45 min.

```python
import json,sys,random,statistics as st,collections,math
rows=[json.loads(l) for l in open(sys.argv[1])]          # one row per gate job: branch, job_min, steps{name: min}
prs=json.load(open(sys.argv[2]))                          # PRs into tranche: n, ref, created, merged
full=collections.defaultdict(list)
for r in rows:
    if r['branch'].startswith('job/') and (r['steps'].get('gate') or 0)>1.5: full[r['branch'][4:]].append(r['job_min'])
med={m:st.median(v) for m,v in full.items()}
mix=[p['ref'][4:] for p in prs if p['ref'].startswith('job/') and p['created']>='2026-11-04T05' and p['ref'][4:] in med]
QUEUE=['agent-worker','plane','skills','strength','docket','plan-work','affordances','agent-drafts','run-rules','store-assembly','ai-runs','screens-action','agent-harness','lines','local-facts']
OVER=1.0
def gtime(m,rng,fast=False):
    g=max(rng.choice(full[m]),1.0)
    if fast and g>10: g=3+(g-3)/4
    return g
def q(xs,p): xs=sorted(xs); return xs[min(len(xs)-1,math.ceil(p*len(xs))-1)] if xs else float('nan')
def arrivals(rng,lam,H):
    t=0; out=[(0.0,m) for m in QUEUE]
    while True:
        t+=rng.expovariate(lam/60)
        if t>H: return out
        out.append((t,rng.choice(mix)))
def run(policy,lam=12,H=180,pf=0.05,k=4,fast=False,seed=0,age=60,bmax=8,backlog=True,par=False):
    rng=random.Random(seed); arr=arrivals(rng,lam,H)
    if not backlog: arr=arr[len(QUEUE):]
    items=[dict(id=i,t=t,m=m,fail=rng.random()<pf,g=gtime(m,rng,fast)) for i,(t,m) in enumerate(arr)]
    waits=[];gm=0.0;now=0.0;merged=0;peak=1;pending=list(items);win=[]
    avail=lambda now:[x for x in pending if x['t']<=now]
    if policy in('A','B'):
        while now<H:
            a=avail(now)
            if not a:
                nxt=min((x['t'] for x in pending),default=None)
                if nxt is None or nxt>H: break
                now=nxt; continue
            if policy=='A': x=min(a,key=lambda x:x['t'])
            else:
                old=[y for y in a if now-y['t']>=age]
                x=min(old,key=lambda y:y['t']) if old else min(a,key=lambda y:med[y['m']])
            pending.remove(x); now+=x['g']+OVER; gm+=x['g']
            if not x['fail'] and now<=H: merged+=1; waits.append(now-x['t'])
    elif policy in('C','CB'):
        while now<H:
            a=sorted(avail(now),key=lambda x:x['t'])
            if policy=='CB':
                old=[y for y in a if now-y['t']>=age]; rest=[y for y in a if now-y['t']<age]
                a=old+sorted(rest,key=lambda y:med[y['m']])
            while len(win)<k and a:
                x=a.pop(0); pending.remove(x); x=dict(x); x['end']=now+x['g']+OVER; win.append(x)
            peak=max(peak,len(win))
            if not win:
                nxt=min((x['t'] for x in pending),default=None)
                if nxt is None or nxt>H: break
                now=nxt; continue
            head=win[0]; now=max(now,head['end'])
            if now>H: break
            gm+=head['g']; win.pop(0)
            if head['fail']:
                for y in win: gm+=max(0.0,min(y['g'],now-(y['end']-y['g']-OVER))); y['end']=now+y['g']+OVER
            else: merged+=1; waits.append(now-head['t'])
            nxt_arr=min((x['t'] for x in pending if x['t']>now),default=None)
            if win and nxt_arr is not None and nxt_arr<win[0]['end'] and len(win)<k: now=nxt_arr
    elif policy=='D':
        while now<H:
            a=sorted(avail(now),key=lambda x:x['t'])[:bmax]
            if not a:
                nxt=min((x['t'] for x in pending),default=None)
                if nxt is None or nxt>H: break
                now=nxt; continue
            for x in a: pending.remove(x)
            def gate(b):
                nonlocal now,gm
                g=(max(x['g'] for x in b)+1.0) if par else sum(x['g'] for x in b)-1.5*(len(b)-1)
                now+=g+OVER; gm+=g
                return not any(x['fail'] for x in b)
            def bis(b):
                nonlocal merged
                if gate(b):
                    for x in b:
                        if now<=H: merged+=1; waits.append(now-x['t'])
                    return
                if len(b)>1: h=len(b)//2; bis(b[:h]); bis(b[h:])
            bis(a)
    left=len([x for x in pending if x['t']<=H])+len(win)
    return dict(merged_h=merged/(H/60),med=st.median(waits) if waits else float('nan'),p90=q(waits,.9),left=left,gm=gm/max(merged,1),peak=peak)
```

## Addendum (05:35): provider-first ordering, asked by the coordinator

**Today.** `train.mjs` `ready()` (origin/tranche, lines 129-155) takes every non-draft job PR that is green on its head and post-gated, oldest green first. Nothing orders a provider before its users. A back-to-back group, such as action-grammar PR 396 before screens-action 420 and actions 431, is held only because BOB marks the users draft. At 05:33, 16 of the 45 open job PRs were drafts, 420 and 431 among them.

**Can readiness's uses graph drive it as it stands? Not as a blanket rule.** Suppose the train held every PR that has a provider in `uses` with an open job PR, with the cycle exclusion that `status.mjs` `waitsOnUses` uses (the `reaches` check). Measured on the 45 open job PRs at 05:33:
- **41 of 45 would be held** on direct `uses`, and 43 on the full closure.
- The only unheld roots are extraction 432, interface-assets 443 and member-roster 446, **all of them drafts**.

So the train would serialise nearly everything behind three drafts and stall. `uses` says what a module may import. It does not say that this PR needs that PR's change.

**The precise edge, from data the tool already computes:** hold user PR U behind open provider PR P only when all three of these hold:
1. P is in U's direct `uses` and P does not reach U (the `reaches` exclusion).
2. P's diff changes P's export surface: `exports.mjs` `exportChanges(root, mb, P.head, ...)` and `anyExportChange`, the same test the provider-notice route uses.
3. U's changed files import from P, under ARC-1's import resolution (`checks.mjs` `importFindings`). At its tightest, U imports one of the names P adds or changes.

That is a read-only computation in the train on two PRs' diffs, with no change to the gate. **BOB's draft mark stays as the manual override**: a user can still be held explicitly, and a train note could release a hold that should not apply. Each provider holds behind its own providers, so the order follows the topological order without a transitive hold. I did not compute how many of today's PRs this edge would hold, since that needs both diffs per PR pair. I expect a handful. It is the first number to read in a build.

**Per option:**

| option | how provider-first is honoured | what it costs |
|---|---|---|
| A serial | the hold above filters `ready()`. A held U waits until P lands, then U's re-gate on tranche+P is the exact test | none beyond the filter. A red P holds its users until P's job fixes it |
| B ordering | the hold first. Then **a provider with held users goes ahead of shorter PRs**: sort by (held users descending, then expected gate minutes), with aging applied only to PRs not held | the same filter plus about 5 lines in the sort |
| C speculative | the window must be a **topological prefix**: U is admitted only if P has landed or is ahead of it in the window. U's spec base then holds P, so U is gated on exactly tranche + P + U, **the test the back-to-back group needs**, and a red P discards U automatically. C turns BOB's hand-held order into a gated one | the hold plus one admission rule. U waits at most P's gate time in the window, not a whole serial turn |
| D batch | members in topological order inside the batch. Bisection splits in that order (left half first), so a user is never landed without its provider | adds to D's existing weaknesses. D is still not recommended |
| E faster gates | ordering is unchanged. Strength is helped by the existing tranche cover (gate.mjs lines 390-400): a module whose provider changed on the tranche after the module's merge is re-run at layer close and in the tranche into main | none |
| **F** (recommended) | C's topological-prefix admission + B's provider-first sort + the precise hold, with BOB's draft mark kept as an override | together about 40-60 lines more in `train.mjs` on top of C, with tests, and no gate change |

**Effect on the recommendation.** It still holds. Under F, back-to-back groups stop needing BOB's draft marking and get a stronger guarantee than today: the user is gated with its provider, not merely after it. Under A or B, a provider-first sort is cheap but each user still pays a full serial turn after its provider.


# [file] v5_notes.md

# Notes on the fifth draft of the Process4 definition

14 Nov 2026. Written with `/home/user/handoff/process4_definition_v5.md` (62,224 bytes; the fourth draft is 62,593). Only these two files were written. No repository was changed and no session started. Files read besides the four named in the task: `/home/user/work/replay/results.md` (lines 136 to 235, for the five missed effects), a listing of `/home/user/work/notice_study`, and a search of `handoff/roles_root_coordinator.md` and `work/live_docs.md` for the watcher.

Section letters. A to D stay. The fourth draft's E is split: E "The three tests", F "The notification to user modules". Then old F = G, G = H, H = I, I = J, J = K, K = L, L = M, M = N, N = O. The proposals section (old O) is gone; no proposal remains. P is "Still open with you".

## 1. Where his third message conflicts with an earlier decision or kept line, and how it is written


At Brae the clerk wrote down 15 trowels.

| # | His words of the third message | What they conflict with | How the draft writes it |
| --- | --- | --- | --- |
| 1 | The notification "isn't a test"; the three tests are module tests, internal walk, external walk | Record line 5 (notification as second test, internal walk alone as third) and line 6 (external walk optional); the fourth draft's "the walk, in two forms" | His words followed. Said once in E ("This corrects the record of 13 Nov"), once in the B list, and a bracket after line 5 in the record. Every "one test in two forms" phrase removed (searched) |
| 2 | "There is no need to any any more tests. PERIOD!" | His own "agreed" to proposal 5 in the same message (tests for the process's own tool, the size limit among them) | Both kept. E states the proposal, his "agreed", and Claude's reading that the tool's tests test no product and never run on a product's work; "Say if you meant otherwise". Listed in P. **Flag**: this is the one place where two of his answers pull against each other |
| 3 | Same | The start-up comparison of his approvals: a check that can stop work, not one of the three tests and not in proposal 13's list | Kept as the fourth draft had it (L item 11, on Claude's reading of line 12), named in J as the one check beside the three tests. Not put to him again. **Flag** |
| 4 | Same | His "agreed" to proposal 10, which adds a condition to "without flaws" (no step left out that the walk before made) | Written as settled on his "agreed". Not presented as a conflict: it defines a word, it is not a test |
| 5 | Same | The fourth draft's "one comparison from git, once, when the tranche ends" (whether the process stayed as approved) | Removed from the list of what only a real tranche can show. v4_notes had already asked whether it should go; under his words it reads as a check. Say if it should come back |
| 6 | "three tests and no others" (answer to proposal 13) | His ledger, which still shows each of those checks as "keep"; and the third draft's "Claude decided" | K lists them under his decisions as ended "on your words of 14 Nov", with the consequence about the guard on his approvals block. J says the ledger is unchanged |
| 7 | "A job for module A isn't allowed to change module B..." | Agrees with lines 14 and 19. Conflicts with the fourth draft's "ARCH folds [modules with requirements and no code] back into the module whose code meets them" (ARCH editing modules' files) | C: ARCH decides where each goes and "the move is made as a mechanical edit". That wording is mine. Also: the 86 undeclared uses are "declared in the module list" by ARCH, as the task says; I did not check whether a declared use lives in the module list or in a file the module owns. If the latter, that too needs a mechanical edit |
| 8 | "are you certain that the watcher isn't needed?" | Proposal 7 | Withdrawn, in the words the task gave. The ledger note says the watcher is started "by whoever starts ROOT", and he starts ROOT, which would make it an act of his outside his list. From 5 Nov Process3 had ROOT start it (roles_root_coordinator.md line 132). Written as not yet settled (N item 4). **Flag**: this item is my addition to the not-yet-settled list |
| 9 | "across the account" | Line 17 ("the maximum slot count changes when you tell the coordinator session the new value": a coordinator is per product) and the shared state, which is in one product's repository and holds the slot number | N item 3, as the task directed |
| 10 | "ROOT" starts PROCESS | Line 22 names only ARCH and the coordinator as started by ROOT; ROOT holds the product's repository and PROCESS the process's, so this is a start across repositories | Written as his hint. Added to the trial list. I did not establish whether a start on another repository was measured in Process3 |
| 11 | "ROOT starts with the product repo, which contains the needed approvals in CLAUDE.md and settings.json" | Record line 16 ("the process repository mounted") against line 22 | His typed words settle it; said at the end of the record in B. The fourth draft's "ROOT's repository" item is dropped from the open list. His hint does not deal with the measured fault (a plain start came up on main with old approvals); the default-branch decision does, marked "Claude decided" and unproven |
| 12 | Same, with the default-branch decision | GitHub's rule that the tranche branch "takes a change only by pull request with its tests passing", against "your commits on GitHub's website ... land on it" | Not resolved. M keeps the fourth draft's sentence that the test run must report on pull requests that change no module, or his approvals commit cannot merge |
| 13 | "sessions" (who runs a walk) | The fourth draft: "a long walk has to run on GitHub's machines" (30 minutes against 60 and 64) | Sessions run both; the walk shared among sessions by journey; unproven |
| 14 | "You're better qualified than I am to answer many of these questions" | His second message: "When you change something I defined you need to describe the PROPOSED change" | The four Foundations duties (two ended, two kept) and the first health number are written as "By Claude's decision ... listed for you to overrule", as the task directed, not as proposals. **Flag**: the two ended duties are things his Foundations define |
| 15 | "You have my approval to add any and all information related to the process4 update to the repo." | His earlier sentence about a subtree, which the fourth draft asked him to confirm | M states the folder and branch named process4; one sentence says Claude reads the subtree as that folder. The question to him is dropped |
| 16 | His words on the tranche (second message) against 8 and 9 Nov | Unchanged from the fourth draft | The three readings are in P. In K the ending of "installer and website as part of ending a tranche" now says it rests on Claude's reading |

## 2. Short words of his, and the reading written

| His words | Reading written | Note |
| --- | --- | --- |
| "ROOT" | ROOT starts PROCESS | One word. I took it as the product's ROOT |
| "the processes" | The process's own repository | Marked in H as Claude's reading, with "Say if you meant something else". Other readings: a slip for "the process's"; or the repositories of both processes. Not said in the draft: today the Process4 work sits on a branch of the process3 repository |
| "sessions" | Sessions run the walk and the deployment step | The old item asked three things; the word is applied to the first two as the task directed. How walkers read the two documents is left to P |
| "same as in process3" | The way Process3 kept to GitHub's published limits is carried over unchanged | Marked as Claude's reading. I did not look up or describe what that way was |
| "I think it has to check tests too" | The uses check reads test files | "I think" is tentative; written as settled on his hint |
| "Can the mechanical edit do a single merge of all affected modules?" | A question, answered "yes" as the task gave, followed by what is unproven | "Claude's answer: yes" is followed at once by the unproven part, to stay inside "do not assure me" |
| The longer hint on channels | A job reports to ARCH; ARCH asks ROOT to start PROCESS; he talks to PROCESS; the coordinator can too | One sentence is mine and marked as Claude's reading: that the fault's description travels ARCH to coordinator to PROCESS |
| "across the account" | Eight counted across the account | Three words |
| "agreed" (six times) | Not expanded. Each is written as the proposal's statement and then: You answered "agreed" on 14 Nov | The one-sentence statements are my compressions of the fourth draft's proposals; for proposal 6 I wrote "read line 3 by line 8" because "the first by the second" was ambiguous in the new sentence order |
| "three tests and no others" | Yes to proposal 13: the listed checks end | He restated his rule and did not write "agreed"; the reading is the task's |
| "internal and external walks a separate tests." | Two separate tests | Quoted with his slip "a" |
| "We need to study this further" / "needs to be studied further." | Proposals 1 and 3 not approved; record lines 3, 10 and 11 stand | |
| "are you certain that the watcher isn't needed?" | A question, not a refusal; answered as the task gave | |
| "a word table change" | Quoted as his example of a mechanical edit | I do not know what a word table is in the product and did not explain it |
| "There is no need to any any more tests. PERIOD!" | Kept exactly, slip included (three places: E head, H, and named in B) | |
| "screens and journeys are kept in docs/development/ux-substrate/ in the product repo" (fourth message) | The UX Screens document and the UX journeys are kept in that folder of the product's repository | He wrote "screens and journeys", not the two document names of his second message; the draft joins them. The folder path is his own text and is left as typed |

## 3. Things I could not do, or did only in part

1. **Length.** 62,224 bytes against 62,593, and 10,985 words against 11,002: shorter by very little. The new material (third-message list and table in B, the settled items, the study section) took what the removed proposals section gave back. Cut to get there: the plain-words restatement of his PROCESS paragraph; the passage on correcting against adding; the 8 Nov quotation "This successive set of rounds continues..."; the history of 24, 20 and 8 sessions; the "standing judge" phrase; the paste-slip note on his ledger; the figures 20 of 175, "main has not moved since 1 Nov", "about 170 jobs", "half of the week's twenty recorded false done findings", "no measured evidence that the permission checker enforces a bare never", the 41,777 lines of tool tests, and "Process3's remedy was a helper that judged each notification first"; the bullet on a session recording its own summary as his (folded into the coordinator paragraph); old items 12 and 13 of the kept list merged into one; the count of the 288 lines.
2. **The three-tests quotation.** His text is a sentence ending "The 3 tests are" followed by a bulleted list. The one-line form in my instructions is not verbatim. The draft quotes the sentence, then gives the three list items each in its own quotation marks.
3. **"A study has been started."** I saw `/home/user/work/notice_study` (two scripts, empty data folders) and wrote the sentence as instructed. The draft does not say the study is a separate session; it says he suggested one.
4. **His question about the five of 241.** Not in my list of changes, but it is in his message. F answers it from results.md (line 146 names the five changes; line 157: "changes of behaviour with nothing nameable: a body-only change, or a value changed in a file no other module imports") and says the rest is among the study's first questions. I named the four modules (agent-drafts, agent-steps twice, ai-accounts, member-roster). The main session should check this against whatever the study has found.
5. **"By journey."** The task has the walk shared out by journey. He defines the internal walk by the UX Screens document, not by journeys. The draft says "by journey" for both; it may need "by screen" for the internal walk once the document is found.
6. **A walk of the release.** The fourth draft did not decide it. P item 3 now gives a reading ("Claude reads them to mean it has none, since the three tests end with the tranche's external walk") and its consequence. That reading is mine; change it to a bare question if preferred.
7. **The 288 lines** were not recounted; J says the appendix will be redone.
8. **"Held by the job's instructions and not by any check"** is said once, in C. To keep it to once, the old risk line "An edit that strays into another module's files is seen by no check" was removed from O.
9. **The tranche glossary line** now reads "built on the tranche branch, apart from the main branch", because the default-branch decision gives that branch one fixed name across tranches.
10. **His fourth message** (arrived while I was writing; appended to bob_words_14nov_c.md) is quoted in B and in D ("Where the walks' documents are"). The item "where the UX documents are" is removed from P; it was never in N. The sentence "Checked by Claude: the folder exists on the branch the product is built on, with a screens sub-folder and files describing journeys" is written on the main session's word; I touched no repository and did not check it myself.
11. **Not checked:** whether the trial needs the default-branch setting changed in process3-probes as well as in the product's repository. The trial's cost line says "one settings change".

## 4. Re-read against his standing rules: what I found and fixed

- Only his words count as his: every quoted string in the draft (about 160) was checked by script as an exact substring of bob_words_14nov_b.md, bob_words_14nov_c.md or the fourth draft. Found and fixed: a quotation with an ellipsis in it ("The 3 tests ... PERIOD!") in P, removed; the rule name "One of the four parts changed" stood in quotation marks as if quoted, now plain text; "Claude's answer is no" in the table could be read as "the watcher is not needed", now "Claude is not certain".
- Plain words: "default branch" explained at first use in I; "user" and "provider" added to the word list because his new words use them; "the first by the second" replaced. No item codes of the fourth draft's lists are used; proposals are named "the fourth draft's proposal 9" and so on, which he has seen. The word "notice" survives once, in the table, as the title of the fourth draft's proposal 1.
- No assurance: "Unproven: GitHub runs its required test run" read as a statement of fact and was reworded; "None of this has run" added under the PROCESS decisions; the shared state and the default-branch decision each end "Unproven".
- Proven and unproven apart: "(measured)" added to the 700 merges; the 71% conclusion marked "Judged"; the five missed effects marked measured with the unworked part said.
- No tests, gates, reviews or checks added: none added. The uses check reading tests rests on his hint; the tool's tests and the "without flaws" condition on his "agreed". One comparison removed (section 1, row 5).


# [file] review.txt


Process3 Forensic Review

Forensic review · neobobkrause/process3 · 1–10 Nov 2026 · prepared 13 Nov 2026

# How Process3 buried itself, and whether a Process4 can avoid it

In nine days the process rewrote its own tool 302 times, grew it about sevenfold, and ended with the product standing still. Almost every addition cited a real failure or the owner's words, so the rule against adding checks was never visibly broken. It was simply never the thing being consulted.
