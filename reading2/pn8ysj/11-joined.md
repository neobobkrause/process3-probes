# [file] k_evidence.md (continued)


**(b) What Process3 did**

- **Neither number was ever produced.** No false-done figure is stored in the product's record (I searched the state branch and the product tree). The tranche never closed, so no tranche report was written. The survival window was to be read on 16 Nov, a week after the stop (canon_analysis: "survival read 16 Nov").
- **False-done, the parts that exist:**
  - 693 "job complete" claims in the week, across 169 modules, a median of 3 per module and 21 at most (measured by me from `process/metrics` at `origin/layer/14`).
  - "of 20 refuted job claims today none came from another module's failure" (commit message of process3 pull request 118, 4 Nov, attributed there to Bob at 17:15). 155 claims had been made by that hour (my count). That is about 13% for that day. **The division is mine, across two sources.**
  - "Ten of the twenty "false done" findings that week were the revert check tripping on tests that pass either way by nature" (review.txt). I could not reconcile "today" with "that week".
  - 6 to 9 Nov: 5 of 789 gate runs had failing module tests (product_side §9.3).
- **Cost per surviving pull request, the parts that exist:**
  - Survival: 98.8% of merged source lines and 98.4% of merged test lines were still present at the last tip (measured, product_side §5).
  - Cost: 229 cost rows were written for the 693 claims. 123 hold a figure and 106 say "unmeasured". The figures sum to 912.79 dollars, median 2.45, largest 255.37. 111 of the 123 are from 4 and 5 Nov; 8 are from 6 Nov or later (measured by me). So no cost per pull request can be computed for the week.
- **Would they have read healthy?** That sentence in the draft rests on the disposition's note: "218 of 220 jobs read COMPLETE and 98.8% of landed lines survived while 147 of 157 live walk steps failed, so both metrics would have read healthy on a product that did not work." This is **the disposition author's inference**, not a reading of the two numbers. 218 of 220 complete is not the false-done rate. The one day with a usable count gives about 13%, which is worse than the one-in-eleven figure SES-12 cites; by the review's account half of the week's twenty were false alarms of the revert check, so the true share may be lower.
- **Why neither number can see a product that does not work** (this part is measured in kind): both are built from module-level events. False-done counts a job's claim against that module's own tests. Survival counts whether merged lines are still there. Neither runs the product. Meanwhile "All 12 development deployments ... ended `ok: false`" and "No deployment was made for 80 hours ... while 308 landings went in" (product_side).
- **The first number has lost its instruments.** It is defined by "the gate's re-run and revert check". Section H records both as ended on 13 Nov. **Judgment (mine):** what remains countable without any added check is a job marking its pull request ready and its module tests then failing on GitHub.
- **A caution on walk steps as a number.** The walk is ordinary product code that sessions write. The step count moved between runs: the external walk had 175 steps and then 157; the internal walk 238 and then 357 (measured by me from the stored reports). redteam_corruption finding 6: "a job "correcting a stale step" raises the number".

**(c) Options, with cost and risk**

1. **The two numbers remain the judge.** Cost to Bob: none. Risk: the judge cannot see whether the product works, and one of the two has no instrument left; the cost half was unreadable for most of Process3.
2. **The walk result is added as the judge of the product,** stated as steps passing out of steps walked, with the count of steps removed or loosened since the tranche began beside it. The two numbers stay as measures of the process's honesty and cost. Cost to Bob: none; it reads from the third test, which already runs. Risk: the walk's own steps are session-written.
3. **The judge becomes output per unit:** requirements met and still met, per day and per dollar where the dollar can be read. This is P1's own wording ("quickly and cheaply, behaviour that survives"). Cost: none in acts. Risk: "requirements met" was 60% of the tranche's marks in Process3 (542 of 899 struck) while the product failed its walk, so on its own it repeats the blind spot.
4. **Rounds to a failure-free walk becomes the judge,** as the 13 Nov decision already makes it the end of a tranche. Risk: a count of rounds says nothing of cost.

**(d) Constraints**

- "Exactly three tests": a measure must be read from what the three tests already produce, or from git. Options 2 to 4 need no new test. Keeping the first number as the Foundations define it would need the two ended checks back, which the 13 Nov confirmation rules out.
- Cost can be reported only "where it can be read" (section I item 4, which rests on Bob's SES-9: usage is read by an allowed route or named unmeasured).
- The disposition's own note on row 73: "the owner should see any change to his judge".

---

## K5. The external walk

**(a) Bob's documents**

- Decision of 13 Nov, quoted in the disposition: "A round that completes without any failures ends a tranche, after which an optional multi-session deploy-and-external-walk runs". Also quoted: "No regression or deploy-and-walk between layers". The quotes do not say whose option it is.
- **A public release must have passed one.** Foundations, "Two kinds of release": "A public release is a development release the walkers have passed, published only with your approval (your word, 2 Nov; GAP-7): the process prepares it and shows you what it carries". This is F-REL-2.
- GAP-7, kept 3 Nov 17:32 UTC, no note: "A public release or promotion to installed sites waits for Bob's approval through the protected GitHub environment; development releases are drafts and need none."
- BD-R1, Bob, 8 Nov, his words: "Once a walk completes, that ends the current round, and a new round (of the same tranche) is started to work (layer by layer) to fix to those modules that have been identified as having flaws. This successive set of rounds continues until an internal walk doesn't find flaws, the release deployment happens, and the walk of the release also doesn't identify flaws. When the release walk is clean, the installer is updated for that release, then the civicsmith.dev website is updated to refer to the new install, and that ends the tranche."
- PD-16 records Bob, 8 Nov: "The live walk will take a long time and will end up being an expensive means of identifying many of the same the flaws the internal walk found. Stop the live walk now, update the process so that the live walk only runs once a round closes with no flaws found from the internal walk. And try to configure both walks to run as many walks as is reasonable to speed up the walking process. (But be careful that there aren't too many external walkers to cause the Cloudflare system to exceed limits of the account."
- BD-R5, Bob, 9 Nov: "The first run or two of the external system will run without without an AI account connected. Once the external walks identify and fixed all the flaws to be found by walking all the non-AI journeys, we'll configure an AI so that the AI-assisted journeys can be run and debugged." And: "Yes, the installer update and site update wait until a release walk with AI on is also clean."
- Findings: P22, kept 3 Nov, no note: "what a walk finds becomes a round's entries, never edits to a running one". F-STOP-3: the walk's findings after a deployment "enter the next round as ledger entries by the route for work found elsewhere (PLN-3)".
- Who acts: Foundations, "Deploy tokens": "deploying, releasing and acting on a live site are BOB's acts, not a job's". Bob's standing approvals let sessions "create, deploy, configure, seed, reset and delete development deployments" in the product's own Cloudflare account without asking him.
- LOG L299, 5 Nov, the coordinator's paraphrase and not a quotation: "BOB'S WORD (Bob): deployment only at the end of a tranche, never between layers".

**What these say on the three questions**

- **Who decides it runs.** In every text before 13 Nov a rule decides, not a person: it runs when a round's internal walk is clean. Neither Bob nor the architecture session chooses case by case. The word "optional" is new on 13 Nov and I found no text saying whose option it is.
- **A public release must have passed one:** yes, in the Foundations line above and in BD-R1.
- **Findings after the tranche has ended.** By Bob's words of 8 Nov the question could not arise: the tranche did not end until the release walk was clean, and its findings opened another round of the same tranche. The 13 Nov decision ends the tranche before the external walk. No text of his says what its findings then open.

**(b) What Process3 did**

- 12 development deployments, 4 to 8 Nov, all `ok: false`; 10 stopped at the walk (measured, product_side; re-read by me).
- Ten of the 12 were on 4 Nov. Then none for 80 hours, "during which 308 landings went in" (product_side). The gap follows Bob's word of 5 Nov 01:55 as the coordinator logged it, "deployment only at the end of a tranche, never between layers"; it was not a session's choice.
- The two full external walks (measured by me from the stored reports on the state branch):
  - 8 Nov 07:20Z. Internal walk first: 238 steps, every one passing, 63 failures of a kind already known. External walk on the same build: 175 steps, 20 passing, 1,691 failures.
  - 8 Nov 23:50Z. Internal walk: 357 steps, 287 passing, 70 failing, all 70 in one group. External walk: 157 steps, 10 passing, 147 failing, 178 failures.
- **So the figure "147 of 157" in the draft is the external walk.** On the same build the internal walk failed 70 of 357. The cause of the difference is not established in the record.
- Why the first pair differed is recorded: the internal walk "never calls" the page checks the external one runs, so "class and DEC-340 faults could surface only on a deployed walk" (PD-11). The decision then made: "the internal walk runs the same page checks ... Faults that depend on deployed data or real bindings stay the live walk's to find."
- Time: the two runs took 60 and 64 minutes (measured). The background limit inside a session is about 30 minutes (PLT-4), so they ran on GitHub's machines.
- As built at the end: "tranche close refuses, in order, without a clean internal walk, a release and a clean release walk" (change_sample PR 269). So in Process3 nothing reached the main branch before a clean external walk. No clean walk of either kind ever happened, and the main branch was untouched all week.

**(c) Options, with cost and risk**

1. **A rule decides: it always runs after a failure-free round.** This is Bob's rule of 8 Nov with the tranche ending earlier. Cost to Bob: none. Cost to the process: about an hour and a development deployment each time. Risk: low.
2. **The architecture session decides.** Cost to Bob: none. Risk: a session weighs an hour's cost against a walk whose value it cannot see in advance. No Process3 case shows how a session would choose, because a rule or Bob's word always decided.
3. **Bob decides each time, by word.** Cost: one message per tranche, and the walk waits for him. Risk: main already holds the tranche by then.
4. **It runs only before a public release.** Cost: none between releases. Risk: faults that only a deployment shows pile up across tranches; the record is 1,691 failures after 80 hours without one.

On the findings:

- A. **They open a new tranche.** Main already holds the work. Simple; the faults are on main meanwhile.
- B. **The tranche does not end until the external walk is clean,** as Bob said on 8 Nov. This reverses the 13 Nov order.
- C. **They become work for named modules at the start of the next tranche,** whenever that begins.

**(d) Constraints**

- "Exactly three tests": the external walk is not one of them. It can stay only as the 13 Nov decision names it: optional, after the tranche, stopping nothing.
- Under the 13 Nov decision the tranche branch merges into main when the internal walk is clean. On Process3's one comparable day, a clean internal walk was followed by an external walk with 1,691 failures. Section J item 11 of the draft already lists the internal walk as unproven.
- Bob's Foundations line makes a passed external walk a condition of a public release. That holds whichever option is chosen.
- Cloudflare's limits bound how many sessions can walk at once (Bob's own caution of 8 Nov). The tool set the external walk to 85% of the account's limit on concurrent browsers ("Free 2 / Paid 170", LOG).
- BD-R5 leaves one act with Bob that is not on his list: connecting an AI account to the deployment before the AI-assisted journeys are walked.

---

## K6. Eight slots: per product or for the whole account

**(a) Bob's documents**

- Decision of 13 Nov, quoted: "The build plan is designed around parallel jobs running, with the concurrent job count bounded by a user-changeable number." Quoted in the disposition: "The default is 8 job slots"; "As soon as a job completes and is merged, its slot is used by the next job".
- PLN-7, kept 31 Oct 01:52 UTC, no note: "Two products may run tranches at once on one account; nothing in the process names a product." The page's "against": "Shared account rate limits are split between products. / Needs a shadow run with two product copies to confirm."
- Foundations: "Measured 1 Nov: at about 50 live sessions the account stops starting new ones, while the create call still reports success. So the process keeps at most 24 live sessions by default ... (your word, 1 Nov)."
- BD-R2, Bob, 8 Nov: "Process3 is a develop process that is designed for use to develop any product, not just civicsmith."
- LOG L286, 4 Nov 23:50, the coordinator's paraphrase and not a quotation: "BOB'S WORD (Bob): Process3 may run in many (hundreds of) accounts; cap and count should be account-specific." The coordinator's own decision follows on the same line: "count = the account's job sessions across all its products ...; cap = env var P3_JOB_CAP in the account's cloud environment, default 20 ...; no per-product key".
- Bob, 6 Nov, quoted (LOG L1021): "I think that github limits can handle the traffic from as many as 8 jobs at a time. Set the job slot limit to 8 and monitor github usage for an hour or so to see if there's any real need or opportunity to low or raise the slot count."
- Bob, 6 Nov, quoted (LOG L1005): "it's important that we confirm that the github usage limits we agreed to abide by are written into process3 and used properly account wide."

**(b) What Process3 did**

Limits that attach to an account, as measured or documented:

- **Claude account, live sessions:** about 50, then new sessions silently fail to start. One event, 1 Nov. Whether idle finished sessions count is unverified (redteam_feasibility).
- **Claude account, weekly usage:** Bob moved accounts on it ("I'm watching weekly usage", 6 Nov). The coordinator noted sessions reporting a seven-day usage warning on 5 Nov (LOG L331). No number is recorded.
- **Claude account, scheduled tasks:** "Rate limit after 5 quick creations" (1 Nov).
- **GitHub, the session account:** 5,000 requests an hour for a user in GitHub's documentation; the tool read 15,000 an hour for this identity (LOG L1005). Use never passed about 12%. GitHub suspended the account on 6 Nov without warning; the cause was never established. Peak before it: 1,387 pushes to one branch in 19 hours.
- **GitHub, the owner's account:** 20 test jobs at once on the free plan (documentation, levers).
- **Cloudflare:** per account. Each product has its own Cloudflare account in Bob's design.

The slot number in Process3 (roles_root_coordinator §4): 24 live sessions of every kind (1 Nov); "about 6" (4 Nov, the coordinator's own number, followed for about six hours); 20 jobs (4 Nov, on Bob's word as logged); 4, then 1 (6 Nov, the coordinator's, after the suspension); 8 (6 Nov, Bob's words above); 20 (7 Nov, logged as "job slots raised to 20"). At the end the tool read the number from an account-wide variable that "was never set on this account", so its default of 20 applied.

Two products at once: **it never happened under Process3.** The log says "No other product exists" and "second-product triage seat decided when a second product runs (PLN-7)". The same account did carry other sessions at the same time: the coordinator, the sessions building process3 itself, the probe repository, and design lanes. On 7 Nov a session on the other account worked on another repository of Bob's, neoprocess.

Width: under the start rule in the draft, 65 modules have work now. With equal job lengths and a bound of 8, 37 of the 65 would run beside a module they use that also has work (no_layers_width). So one product can fill 8.

**(c) Options, with cost and risk**

1. **Eight per product.** Two products run 16 jobs. Cost to Bob: one number per product to change. Risk: the limits that hurt in Process3 belong to the account, not the product: the 50-session ceiling, weekly usage, and the GitHub session account's standing. Sixteen jobs plus each product's standing sessions and walkers stays under 50 only if finished sessions do not count, which is unverified.
2. **Eight for the whole Claude account.** Cost to Bob: one number. Risk: the process must share the slots between products, by a rule not yet written; and a count across products needs some session to see both, while every session holds one repository only.
3. **Eight per product, with Bob lowering each when two run.** Cost: he changes two numbers when a second product starts. Risk: none new. Needs nothing built.


At Eyre the clerk wrote down 11 tubas.

**(d) Constraints**

- One repository per session (preserved permission management): no product session can read another product's record. An account-wide count has to come from the platform's list of sessions, which is account-wide, or from Bob. **Judgment (mine).**
- Only Bob changes the number, and he does it by telling the coordinator (section B). As I read the draft there is one coordinator for each product's development, so "per product" is the form that needs nothing more.
- Bob's own reason for 8 was GitHub traffic from one session account. If two products share that GitHub account, his reason applies to the sum.
- His logged word of 4 Nov points to the account. It is the coordinator's paraphrase, so under his 13 Nov decision it does not count as his word until he confirms it.

---

## K7. Reordering by Bob's word against the fixed start rule

**(a) Bob's documents**

- Foundations, "A job's life", step 1 (F-JOB-1): "BOB takes its work from the record without being asked (PLN-2): each module of the open layer ... whose requirements still carry not-yet-met marks and that has no open job gets a ledger entry and a START, as many at once as the live-session limit allows; your word adds or reorders work."
- This is the only place the words appear. No Ledger line says it. PLN-2, the line cited, says only: "A plan is written from the work that remains; an entry is deferred only for one of three named reasons."
- Decision of 13 Nov, quoted in audit D: "Each module is updated and tested by a single job, with the jobs of earlier modules run before those later in the order."
- Bob, 9 Nov (PD-25): "All jobs of a layer should open at once up to the maximum slot cap."
- The draft's rule (section C): "When a slot is free, the ready module earliest in the order takes it. The rule is fixed and gives the same answer every time."

**(b) What Process3 did**

Bob did redirect work, always by talking to the coordinator. The coordinator then messaged the product session, and twice the result was built into the tool. Cases found (LOG):

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


# [file] codex-gpt6-context-window-investigation-20261117.md

# Why published GPT-6 1.05M context differs from Codex observed windows

**17 November 2026. Status: assistant external research, not an adopted Process4 rule or an owner decision.** This note records sources and findings for independent validation. It does **not** establish the model/window of the subscription-hosted Process4 child sessions. Do not use the API merely to meet an owner's subscription-only runtime constraint.

## Short answer

The 1,050,000-token number is an **API model capability**, whereas Codex/ChatGPT Work has **product-specific context settings** and sometimes uses an account/client-specific server-delivered model catalog. OpenAI currently explicitly documents **500,000 as the default Codex/Work context for GPT-6.1 Sol**, while separately advertising its **1,050,000 API context** in the **same model page**. Codex applies a catalog maximum to requested context, a 95% usable-context factor, and an ordinarily 90%-of-raw automatic compaction threshold. Real issue reproductions show smaller runtime limits (258,400; 475,000; 828,400) and catalog-origin/cache inconsistencies. The exact reasons for every product/rollout cap and the particular hosted Process4 child capacity are not publicly established.

## Official published statements

1. https://developers.openai.com/api/docs/models/gpt-6.1-sol — 1,050,000 context; 128,000 maximum output; **500K default in Codex and ChatGPT Work**. The API page states separately that API prompts above 272K have a higher rate, but that is not the Codex default.
2. https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex and https://learn.chatgpt.com/docs/models — Codex and Work are separate product surfaces; **GPT-6.1 Sol defaults to 500,000**, availability depends on workspace/rollout. Subscription usage is not the same billing path as per-token API usage.
3. https://learn.chatgpt.com/docs/config-file/config-reference — Codex config keys `model_context_window`, `model_auto_compact_token_limit`, `model_post_turn_compact_threshold_percent`, etc. Documentation for an override does NOT guarantee that a provider/model catalog will honor its requested size.

## Verified open-source Codex mechanism

At https://github.com/openai/codex/blob/main/codex-rs/models-manager/src/model_info.rs the function `with_config_overrides` resolves an explicitly requested context as `min(requested_context_window, max_context_window)` when a catalog maximum is present. This is a **silent clamp** in the inspected code path.

At https://github.com/openai/codex/blob/main/codex-rs/protocol/src/openai_models.rs the `ModelInfo` methods `usable_context_window` and `auto_compact_token_limit` derive respectively `raw * effective_context_window_percent / 100` and `min(configured_limit, raw * 90% )` when a raw model window is known. Common catalog values report 95% usable.

An illustrative catalog entry `context_window=272000`, `max_context_window=872000`, `effective_context_window_percent=95` yields:
- No override: 258,400 usable; ordinary auto compaction 244,800.
- 500,000 override: 475,000 usable; ordinary auto compaction 450,000.
- 1,000,000 override: **clamped raw to 872,000**, 828,400 usable; compaction limited to 784,800 even if user requests 900,000.

This arithmetic is a source-grounded description of Codex client resolution, not proof of the backend model's physical maximum. The 872K catalog cap is not justified by public source; although 1,000,000 minus 128,000 equals 872,000, that numerical coincidence is **not evidence** of an output-reservation policy, particularly because API spec says 1,050,000 total.

## Public runtime reproductions (third-party issue reports, not OpenAI's confirmed root-cause statements)

- https://github.com/openai/codex/issues/47805 — GPT-6 Sol CLI, requested 1M, runtime `token_count.info.model_context_window=828400`. Changing requested to 800K yielded 760K, matching client clamp.
- https://github.com/openai/codex/issues/41325 — in a GPT-5.6 Sol case a researcher raised the *bundled* max in a rebuilt CLI, but ChatGPT-authenticated runtime still had 828,400; compatible with the **remote catalog overriding bundled settings**. Cross-model mechanism corroboration, not a direct GPT-6 production proof.
- https://github.com/openai/codex/issues/59022 — reported GPT-6.1 Sol default changed server-side around 11 Oct 2026 from 272K to 500K, with effective 258.4K to 475K.
- https://github.com/openai/codex/issues/53336 — same model, same session/process reportedly fell from 475K to 258.4K between turns, with a 500K-versus-272K catalog/cache reload investigation and controlled server catalog variations by client `originator` and account. **This does not prove the exact rollout logic**.
- https://github.com/openai/codex/issues/33593 — controlled reports of different server model catalogs keyed to client originator, written to a shared cache that can oscillate.
- https://github.com/openai/codex/issues/53584 — GPT-6 Astra reports of actual compaction near 500K *displayed* despite an internal threshold 784,800: the internal compaction counter differed materially from most recent displayed usage. This is a **distinct accounting/visibility problem**, not proof the configured threshold was 500K.

The public issue reports make the mechanics and discrepancy credible and reproducible, but their complete findings have not been independently reproduced by us in the exact Process4 hosted environment. They do not constitute an official OpenAI support resolution.

## Four different numbers must never be conflated

1. **Model API capability:** 1,050,000 total tokens.
2. **Product/catalog raw default or override maximum:** e.g. 272K, 500K, or 872K. May depend on remote model metadata, client originator, account, rollout, and cache.
3. **Usable context as reported by Codex runtime:** e.g. 258,400, 475,000, 828,400 after 95% headroom.
4. **Automatic-compaction threshold and actual counting basis:** usually 90% of selected raw window, with separate instrumentation/accounting caveats. A displayed latest-turn count does not necessarily equal the internal compaction-scope count.

The hosted native Process4 child control surface currently exposes no verified live model identifier, context numerator/denominator, compaction event or context override to the bootstrap. API/CLI documentation and issue evidence cannot substitute for that missing receipt.

## Implications and recommended policy for Process4

- The owner's explicit **GPT-6+ with verified effective >=1,000,000 tokens** requirement remains **unmet/unverified** by the available native hosted telemetry. Do not silently interpret a GPT-6 brand name or 1.05M API specification as compliance.
- Do not assume that `model_context_window=1000000` in a Codex config will be honored; verify **post-first-turn** runtime value from a supported exposed surface when possible. Do not patch client catalogs, inspect credentials, or introduce metered inference as a workaround.
- Proactively preserve and refresh bounded role sessions and force complete source reading; no reliance on model compaction for normative canon fidelity. When actual usage is unavailable, use explicitly provisional conservative task/source budgets rather than guessed percentages, and report the inability to guarantee the requested window.
- Continue independent process design and research under existing grants. Treat inability to verify the required million-token hosted session as an **acceptance blocker for claiming full owner-required Codex configuration**, not as permission to stop unrelated work or weaken the threshold.
- Request from OpenAI/support a supported capability receipt for actual hosted child `model_id`, `selected_context_window`, `usable_context_window`, `max_context_window`, `auto_compact_threshold` and an observable refresh/compaction signal, and clarification of the 500K default versus API 1.05M and the 872K catalog cap.

**Evidence limitation:** This report does not assert that current hosted children are at 272K or 500K or 872K. It establishes why those different numbers are possible and points to public real-world cases. The product's internal rollout/entitlement rules and precise back-end rationale are not disclosed in reviewed sources.


# [file] point5_288_lines.md

# Point 5: the owner's 288 requirement lines against the fifth draft

Worker report, 14 Nov 2026, second main session. Reading and reporting only; nothing was designed, and no file but this one was written.

## For the owner, in plain words

Your requirements for the process are 288 statements. 151 come from your Keep and Drop Ledger, the page where a session drafted 159 statements with a suggestion for each and you marked each keep, modify or drop; the 151 are those marked keep (119) or modify (32). The other 137 come from your Foundations, the document a session wrote for you from the Ledger; earlier auditors, not you, cut it into those 137.

I counted again where each stands in the fifth draft of the definition. My counts agree with the audit's:

- 112 are kept and stated in the draft.
- 43 are kept in purpose, with the way of doing them changed.
- 53 are kept, yet the draft says nothing about them.
- 75 are ended, wholly or in one clause: 17 on an answer you typed to a proposal on 14 Nov, 1 on a hint you typed, 22 on a session's written record of your decisions of 13 and 14 Nov, 2 on a sentence a session wrote, and 33 by Claude without being put to you.
- 4 are contradicted: the draft does what the line forbids.
- 1 is no longer mentioned at all.

Proven: the counts, and that every quotation in this report is exact; I checked both against your documents. That the 53 are absent is the auditor's search; I searched the draft for about thirty of their subjects and found none stated. Not proven: that a later session would in fact drop an unstated line or follow the wrong document.

Yours to decide:

1. The 33 endings, as seven yes-or-no proposals (next section). Nine are checks or re-tests that your words "three tests and no others" may already end; you were not asked whether they reach that far.
2. Which document speaks for you where they disagree. For the 75 ended lines your Ledger still says keep or modify (38) and your Foundations still state the rest (37), and the definition does not say it comes first. The audit's two options: a sentence saying the definition is followed from the day you accept it, the older two kept as history; or the older two withdrawn from what sessions read.
3. Whether a job may commit built files (files produced from other files). You kept a line saying it never does; the draft says it does.
4. One older line lets the architecture session (the session that plans a product's work) reword a requirement and tell you in one line. Your rule of 14 Nov puts such a change to you first. Both cannot stand.

Claude's work, to do and report: put the 53 unstated lines back into the definition (three clash with your words on the lane where the process is changed, and come to you instead); restore, or propose ending, the command that prints the current state, on which ten of your lines rely; and write "proposed", not "ended", until you answer.

## The 33, grouped, as proposals

Words used here. A module is one part of the product with its own requirements, code and tests. A job is a session that builds one module. The architecture session is the one long-running session for a product that plans the work, starts jobs and merges them. A tranche is a batch of work that ends when a walk of the deployed product finds no flaws. The permission checker is the platform's automatic judge of risky acts. Figures called "the draft's figure" are stated in the fifth draft as measured and were not re-checked here.

Each proposal has the same parts: what your documents say; what the draft does instead; why the earlier session ended it; whether your typed words of 14 Nov already end it; and what yes and no mean. Yes means the ending stands. No means the lines stand as you wrote them.

**Proposal 1. When Process4 counts as in force, and the first of your two numbers for judging the process (5 lines)**

- What your documents say. Nothing is in force until it has run on a real tranche with two health numbers measured. The first number is how often a job said "done" and an independent second look proved it wrong. The second is what each merged change costs that is still in place after two weeks. The two are called the standing judge of every other line.
- What the draft does instead. It drops the first number, saying it can no longer be produced. It keeps the second as a figure in the report at the end of a tranche, where cost can be read. It still quotes your in-force sentence and says beside it that the first number cannot be produced. It names nothing as judge in their place; it says no number in the report is a target and nothing reads the report to decide anything.
- Why the earlier session ended it. The second looks that the first number counted are themselves ended: a second test run on the merged result and a check that a job's new tests fail when its change is undone (both on the draft's reading of your answer "three tests and no others"), and review by a fresh reviewer (by the session's record of your decision of 14 Nov). The draft adds that neither number was ever produced in Process3.
- Do your typed words of 14 Nov end it? Not directly. As the draft reads them, they end the things the first number counted. They say nothing about the in-force condition or about judging the process by a number. So the first number is left without its source; whether it could be taken from something that still exists was not examined by the draft.
- Yes means: the condition becomes "has run on a real tranche"; one number, cost, is reported where it can be read; no number judges the process. No means: your sentence and both numbers stand, and Claude must find and report a way to produce the first number from what still exists, without adding any check; whether that can be done is not known.

[F-HOW-1, SES-12, F-SHAPE-5, F-MNT-4, F-MNT-7]

**Proposal 2. Three things to be measured on the first tranche before deciding (5 lines)**

- What your documents say. (a) Try an architecture session that keeps no memory, every wake a fresh session, and compare its cost per wake with the cost of handing over a long-lived one. The stored note reads "I'm skeptical, but let's measure on the first tranche"; the measuring was the page's suggestion, and "I'm skeptical, but let's" is what the stored note adds to it. (b) Trim the principles each role loads to the two or three it needs, tried and measured; the stored note adds "I'm skeptical, but let's try". (c) Measure what share of the architecture session's attention goes on passing requests between other sessions instead of planning.
- What the draft does instead. It ends all three unmeasured. The architecture session is long-lived and is replaced when it dies or fills up. Each role has one short rulebook of at most ten rules. Nothing measures the passing-on share.
- Why the earlier session ended it. For (a): a session started by a timer could not start other sessions, 0 of 3 tries; your Foundations record the same measurement. For (b): the line-by-line test it rested on is itself ended (proposal 7). For (c): the draft gives no reason; the measurement was never taken.
- Do your typed words of 14 Nov end it? No. These are measurements, not tests, gates, reviews or checks.
- Yes means: all three end without a number. No means: each is measured on the first real tranche, as the lines say. For (a) the measured fact above stands in the way of running such a session at all.

[SES-16, TM-1, TXT-4, F-REQ-7, TM-4]

**Proposal 3. Two duties repeated at each new model version and at each tranche's opening (5 lines)**

- What your documents say. (a) At each new version of the model, and of Claude Code, take parts of the process away one at a time, see what breaks, and retire what is no longer needed. (b) Record every refusal of an act you have approved, with the act, how deep the session sat and how your approval reached it; count refusals per tranche and per role; try a handful of approved acts at each tranche's opening before any job starts; and try them again at each model release.
- What the draft does instead. It ends both. Nothing takes their place as a standing duty. A one-off trial before first use tries whether merges pass the permission checker.
- Why the earlier session ended it. The draft says they end "under your words 'three tests and no others'". It gives no other reason.
- Do your typed words of 14 Nov end it? This is the open point. For: both are tests, and (b) includes a check before any job starts, of the same kind as the credentials check that proposal 13 named. Against: they test the process, not the product; in the same message you agreed to tests for the process's own tool; and the counting in (b) is a measurement, not a test. You were not asked. An earlier auditor notes that (a) is the only standing duty in your documents that removes things from the process (not re-checked here).
- Yes means: both end, the counting of refusals included. No means: both stand as written; they would then be named beside the three tests as things that test the process and not the product. You may also answer the two halves differently: the removal duty, the trying of approved acts, and the counting are three separable things.

[F-SHAPE-6, MNT-11, F-MNT-2, F-PLAT-9, TM-8]

**Proposal 4. Two removals for which the draft cites what Process3's decision record says you said on 9 Nov (3 lines)**

- What your documents say. (a) A job's report carries a written receipt: the commands it ran, their exit codes, the commit, and a list of what it did not verify. (b) A set-up check reads every account, setting and branch rule the work depends on, at the start of a product and before every job start; a missing one stops the start. It also confirms by name that each deploy key is present.
- What the draft does instead. It ends both. A job pushes and marks its change ready, and the test run on GitHub's machines is the evidence. There is no set-up check. Deploy keys stay as settings of the Claude cloud environment, and nothing confirms them.
- Why the earlier session ended it. (a) The receipt caught nothing in 1,187 test runs (the draft's figure), and Process3's decision record, written by a session, quotes you on 9 Nov: "get rid of it completely." (b) The check refused every job start after you applied new settings (the draft's figure), and the draft cites the same record quoting you: "Is this needed at all? If so, it must be done efficiently. If not, then cut it." Found in this reading: under that quotation the record's own decision was to run the set-up check once for each version of the process instead of before every job. It did not remove the check. So the record supports ending the receipt. For the set-up check it supports "less often"; the ending is Claude's.
- Do your typed words of 14 Nov end it? The set-up check is a check that can stop work, so "three tests and no others" arguably ends it, as the draft took it to end the credentials check at a tranche's opening. The receipt is a record, not a check: nothing you typed on 14 Nov ends it, and the 9 Nov sentence is a session's record of you.
- Yes means: both end; for the receipt you confirm what the record says you said. No means: the receipt and the set-up check stand as written.

[JOB-7, F-SET-3, F-SET-8b]

**Proposal 5. Records and cost figures kept for each job (5 lines)**

- What your documents say. (a) Each attempt at a job has its reading list recorded at its start and its token use at its end, so that restarts are not counted as jobs. (b) A job's cost per attempt is an alarm that the hourly safety net reads, not a cap. (c) The record of jobs is a strictly formatted data file in which only one field of each entry may change. Your own note on (c): "Try this, but measure the experience with an open mind as to whether it's work or not."
- What the draft does instead. It ends all three. What belongs to one job stays in that job's pull request. Cost appears once, in the report at the end of a tranche, where it can be read. No alarm reads cost.
- Why the earlier session ended it. Made compulsory, the cost figure blocked every job completion for 45 minutes. 105 of 508 merges changed nothing but these records. The experience your note asked to be measured never was. (All three are the draft's figures.)
- Do your typed words of 14 Nov end it? No. These are records and an alarm. Only the format check that held (c) in place is a check.
- Yes means: no per-job record of reading or cost, no cost alarm, no strictly formatted job record. No means: they stand as written, and the trial your note asked for is still owed. The cost alarm can be answered apart from the records.

[JOB-10, JOB-11, GAP-2, REC-9, TM-2]

**Proposal 6. Size limits and checks on what goes into the repository (4 lines)**

- What your documents say. (a) A cap on the size of a module's requirements file that makes the architecture session split or merge modules before any job starts, never a refusal at a job's start, with the number set from the real product. (b) A check that fails any commit adding an oversized file or a file under a path kept for temporary files, with a scheduled clean-up of finished temporary files. (c) A second required check, the "record" check, beside the module tests, before a change reaches the main branch or the tranche's branch.
- What the draft does instead. No cap; the 29 modules that hold requirements and no code are what the cap left behind. No oversized-file check, no record check, and nothing about the clean-up.
- Why the earlier session ended it. Built as a refusal, the cap was overridden 32 times out of 32 (from an earlier review, not re-measured). The record check gave 947 findings on its first run (the draft's figure).
- Do your typed words of 14 Nov end it? (b) and (c) are checks that can stop a merge, so "three tests and no others" arguably ends them. (a), as you modified it, is not a refusal and is not ended by those words. The purpose behind (a), that a module fits in one reading, is a line you kept that the draft no longer states.
- Yes means: none of the three exists. No means: they stand as written; (b) and (c) would then be named beside the three tests as things that can stop work.

[REQ-6, TM-6, REC-10, F-SET-6]

**Proposal 7. Rules about the process's own rules and instruction texts (6 lines)**

- What your documents say. (a) Every rule cites the measured failure or your decision that justified it, and a rule with neither is removed. (b) Every line of an instruction file must pass a three-part test (backed by a failure, not something the code already shows, or enforced by a tool) or be deleted; this includes the product's own short instruction file. (c) An audit judges whether a session read a document whole by what it can cite from the document's end, with shorter documents as the lasting remedy.
- What the draft does instead. It ends all three. In their place: every change to the process comes to you in the lane where the process is changed, whatever it cites; a size limit on each role's starting text is among the tests for the process's own tool, which you agreed; and the rule that a session acts only on what it has read in full stays as words.
