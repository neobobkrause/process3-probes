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

