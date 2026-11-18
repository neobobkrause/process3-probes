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
