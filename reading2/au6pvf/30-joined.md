# [file] judged241.txt (continued)

2 BEH C
3 SIG A
4 SIG A
5 BEH C
6 BEH A
7 DATA C
8 DATA C
9 BEH B
10 BEH C
11 BEH B
12 BEH B
13 NEW B
14 NEW A
15 BEH A
16 NEW A
17 NEW A
18 BEH C
19 NEW A
20 BEH B
21 DATA C
22 SIG C
23 BEH C
24 BEH A
25 NON C
26 NON C
27 NON C
28 NON C
29 SIG C
30 SIG C
31 SIG C
32 SIG C
33 SIG C
34 SIG C
35 REM B
36 SIG C
37 SIG C
38 BEH B
39 DATA C
40 NEW C
41 NEW B
42 NEW C
43 BEH C
44 BEH C
45 BEH C
46 BEH C
47 BEH C
48 FIX C
49 BEH C
50 FIX C
51 BEH C
52 NEW C
53 BEH A
54 BEH A
55 BEH C
56 BEH C
57 BEH C
58 REM B
59 REM B
60 REM B
61 REM B
62 REM B
63 REM B
64 BEH C
65 REM B
66 REM B
67 REM B
68 REM B
69 REM B
70 FIX C
71 SIG B
72 DATA C
73 SIG A
74 BEH A
75 NEW A
76 SIG A
77 SIG C
78 SIG A
79 SIG A
80 SIG C
81 SIG C
82 NEW C
83 BEH C
84 DATA B
85 DATA C
86 BEH C
87 BEH C
88 BEH C
89 BEH C
90 BEH C
91 BEH C
92 NON Nc
93 NON Nc
94 SIG C
95 NEW A
96 BEH C
97 BEH C
98 BEH C
99 BEH A
100 BEH C
101 BEH C
102 BEH C
103 BEH C
104 BEH C
105 BEH C
106 NEW A
107 BEH C
108 BEH B
109 BEH C
110 NEW A
111 BEH C
112 NEW A
113 BEH C
114 BEH C
115 DATA C
116 BEH Nc
117 BEH C
118 DATA C
119 DATA B
120 BEH C
121 DATA Nc
122 BEH C
123 BEH C
124 BEH C
125 BEH C
126 BEH C
127 NEW C
128 NON B
129 BEH C
130 BEH C
131 REM B
132 BEH C
133 NON ?
134 BEH A
135 BEH C
136 BEH C
137 BEH C
138 BEH B
139 BEH C
140 BEH A
141 BEH C
142 BEH C
143 BEH C
144 BEH A
145 DATA C
146 BEH C
147 DATA C
148 DATA C
149 DATA C
150 DATA C
151 SIG Nc
152 SIG Nc
153 SIG Nc
154 SIG Nc
155 SIG Nc
156 SIG Nc
157 SIG Nc
158 SIG Nc
159 SIG Nc
160 SIG Nc
161 SIG Nc
162 SIG Nc
163 SIG Nc
164 SIG Nc
165 REM B
166 REM C
167 REM C
168 DATA C
169 REM A
170 REM A
171 REM B
172 DATA C
173 REM B
174 REM B
175 REM B
176 REM B
177 REM B
178 DATA C
179 REM A
180 BEH C
181 BEH Nc
182 BEH Nc
183 BEH Nc
184 BEH Nc
185 BEH Nc
186 BEH Nc
187 BEH Nc
188 BEH C
189 BEH C
190 BEH C
191 BEH B
192 NEW C
193 DATA C
194 BEH C
195 BEH A
196 NEW C
197 BEH C
198 DATA C
199 DATA C
200 DATA C
201 BEH C
202 SIG A
203 BEH C
204 SIG B
205 BEH C
206 DATA C
207 DATA C
208 DATA C
209 REM B
210 DATA C
211 DATA C
212 DATA C
213 BEH B
214 BEH C
215 BEH C
216 SIG A
217 SIG C
218 DATA B
219 BEH A
220 BEH C
221 BEH C
222 BEH C
223 BEH C
224 BEH C
225 DATA B
226 DATA C
227 REM B
228 DATA C
229 DATA C
230 DATA C
231 DATA C
232 DATA C
233 DATA C
234 DATA C
235 DATA C
236 DATA A
237 DATA C
238 NEW A
239 DATA C
240 BEH C


# [file] train-robust-options.md (later part)

7. Modules with no ledger entry after the open layer (coordinator, 5 Nov: 14 on the copy, skipped
silently). nextWork names each module of a layer after the open one whose requirement file has
unmet marks and that has no ledger entry, `- <id> (layer <n>): no ledger entry: cannot start;
<k> unmet marks`, and returns them apart (noEntry), never as work; the idle-capacity line adds
`no ledger entry, cannot start: <id> (<k> unmet), ...`.

## Review rounds

Round 1 (cold): five findings, all fixed, each with a test: the stale-lock break could restore a
released lock (now broken under a `.break` file; a lock naming this process that it does not hold
is stale); a state failure at the top of a pass stopped the train (now the next pass); the sweep
never marked in-train modules (markInTrain there too); the sweep's over-cap line counted parked
sessions (overCapOwed); a late row could be written twice (deduplicated).

Round 2 (confirming): (a) to (e) confirmed fixed (the lock race run with 6 processes, 180 counted
updates, none lost); release cache key complete; no deadlock in the re-entrant path. Two low
findings: markInTrain ignored a flagged row (fixed, tested); a lock left by another host is never
broken (kept: the ruling has an unknown holder waited on and reported, and the report names the
file to remove).

## 8. A transient GitHub error under an in-flight gate (copy PR 290, 5 Nov 12:48-13:15): options

Cause, as read in tool/lib. merge() (merge.mjs) pushes the merged result to the job branch and
waits on its gate in waitForGate, which reads the pull request (`pr()`, io.getPR) and the gate
(`read`, io.checkRun) each round. Neither read is guarded: one GitHub 503 (or a timeout, or a rate
limit) is a Fail out of merge(). mergeOne (train.mjs) classes it with `lasting()`: not lasting, so
a `retry` row and ctx.backoff for `<pr>@<head as listed>`; the merge is over. At the next pass
ready() lists 290 at its new head (the merged result), whose gate is still running, so it is not
green and is skipped; and loop() takes queued plain rows before any job (`plain.length ?
plainOne : mergeOne`), so 505 and 506 landed, the tranche moved, and 290's merged result went
stale (its green gate would now gate a stale result: merge() would bring the tranche in again and
gate afresh). waitForChecks (mergePlain's wait) has the same unguarded reads.

What else can move the tranche under an in-flight gate. Within the train: only plain rows and the
next job, and the loop is serial, so only after merge() returned or threw. Outside it: `merge
--plain` with no live lease (the train killed or stopped mid-gate: its lease lapses or is
released), BOB's `merge <pr>` of a job by hand, and anything on GitHub itself (its UI). A train
restart mid-gate has the same hole as the 503: the new train does not know a gate was in flight.

Option 8A: transient reads inside the waits are retried. waitForGate and waitForChecks catch a
Fail from their pull-request or check read that is transient (HTTP 5xx, 429 / rate limit,
timeout, connection reset, the proxy's gateway errors: one TRANSIENT pattern beside util.mjs
SERVER_ERROR) and read again with a growing wait (15 s, 30 s, 60 s, then every 2 min), counted
against the same deadline; only the deadline, a lasting error or the gate's own end ends the wait.
- Cost: about 25 lines, 40 of tests (a fake read that throws 503 twice mid-gate: the same gate
  lands, nothing else does).
- Fails when: GitHub is down past the gate's whole wait (the merge fails as today, and 8B holds
  the tranche); a non-transient error during the wait (a real refusal) still ends it.

Option 8B: an in-flight hold that outlives the merge call. When merge() has pushed a merged result
(or found one), the train records `inflight` {pr, tip, at} on the state branch (TRAIN_FILE, one
row) before it waits, and an end row when the gate ends (landed, red, PR closed or its head moved
by anything else, or the gate past its cap). While an inflight row is open, each pass goes back
into merge() for that PR first, which waits on the running gate at that tip (merge() already does
this for a head holding its own merge row: jobChecks' rowTip wait), before any plain row or other
job; plain rows wait (their callers keep renewing; their take_by counts from the take, so nothing
expires for the wait). A restarted train reads the open row and does the same.
- Cost: about 60 lines, 70 of tests (a 503 that still escapes, and a train restart mid-gate: in
  both, 505 waits and 290 lands on the same merged result).
- Fails when: the train is stopped for good mid-gate (nothing lands, as wanted; the row ends when
  the next train finds the gate ended); a merge from outside the train (no-lease `merge --plain`,
  BOB by hand, GitHub's UI) is not held by a train row. A small addition closes the first two:
  mergePlain and merge() into the tranche refuse while another PR's inflight row is open and its
  gate still running (about 10 lines; the refusal names the PR and the gate run).

Recommendation: 8A + 8B, with the small addition. 8A removes the cause seen (the 503 never ends the
wait); 8B makes "nothing lands under an in-flight gate" hold across any other failure and a
restart, which 8A alone cannot; the addition covers the tool's own merges outside the train.
GitHub's UI stays outside the tool, and merge()'s land check ("moved past the merged result the
gate checked") still catches it as today.

## 8. Ruling (coordinator, 5 Nov 13:27) and what was built (build/train-inflight)

Ruled: 8A + 8B + the addition, in a PR of its own after PR 156. Conditions, and how each is met:
- A hold never blocks past the gate's own cap: each `inflight` row carries `until` = now + max(90,
  suite_timeout_minutes) + 15 min (the queue allowance); a pass that finds an unended row past its
  until ends it ("its gate's cap passed"), whichever train wrote it; refuseUnderHold reads only
  holds within their until.
- The end row names its cause: landed; refused: <why> (a red gate among them); merged (elsewhere);
  pull request closed; head moved to <sha>; tranche moved; its gate's cap passed; or the merge's
  own failure when it leaves nothing to wait on (HOLD_ENDS).
- Re-entry never re-pushes: the train calls merge() with noPush; a head that already holds this
  PR's merge row on the current tip waits on its gate (jobChecks' rowTip wait), and anything that
  would push a new merged result fails instead ("would need a new one"), which ends the hold.
- A restarted train that finds an open hold on a tip the tranche has moved past ends it ("tranche
  moved") and does not wait.
Code: tool/lib/inflight.mjs (rows, open, start, end, refuseUnderHold), merge.mjs (TRANSIENT,
guarded reads in waitForGate and waitForChecks, onGate, noPush, refusals in merge and mergePlain
outside the train), train.mjs (hold, unhold, heldPass, the loop's hold-first pass).

Item 8 review round 1 (cold): fixed, each tested: a held gate ending red kept the hold to its cap
(now ended "gate <conclusion>"); a held PR made a draft or retargeted kept it (now ended
"withdrawn: made a draft" / "retargeted to <base>"); a restarted clone lacking the held tip ended
the hold as "tranche moved" and landed the next job (the tip is now fetched, and an unreadable tip
keeps the hold); the outside refusal let a merge through once the held gate was green but not yet
landed (now only a red or cancelled gate frees it); TRANSIENT gained "context deadline exceeded"
and "connection refused". Kept: the hold's until (105 min with the 90-minute cap) can end before a
late-starting gate's run does; that only frees merges outside the train (the train stays serial),
and the ruling bounds a hold by the gate's cap. Kept: the first return to a held PR is not backed
off (the loop's idle pause stands between passes; backing it off only delays the held gate).

Item 8 review round 2 (confirming): (a) to (e) confirmed fixed; both kept items judged acceptable.
Two low findings, fixed: a held PR that landed outside the train (no end row) kept merges outside
it refused until until (refuseUnderHold now reads the held PR: merged, closed or off its tip holds
nothing; tested); a held PR handed to BOB after its retries kept the hold (now ended "handed to BOB
after 5 tries: ...").


# [file] audit_B.md (later part)

| R12, "Checks scoped to what they protect: module, layer, product": "Met" | There is no layer check and no definition of a layer close. Running the full regression "on a schedule" contradicts GAT-7 and the owner's ARC-4 note. Should read met differently, with the contradiction stated |
| R9, "Done means merged; main protected": "Met" | True for INT-1. It passes over GAT-8: the merged result is no longer gated before the merge, and the integration branch may be red |
| R7, "Stop means stop": "Met differently ... Stronger" | G9 stops merges and new starts only. "Jobs in flight keep their work": running sessions are not stopped, where PLN-5 had every session take no new step |
| R23, "Stands only on platform behaviour seen to work": "Met if the tests run" | A conditional is not a grade. The proposal also passes over measured rows it would need (section E) |
| R10, "Tests must be real": "Met" | Met today. N5 removes by default any check that wrongly blocked product work once, and the revert check has (9 Nov). The grade should say the check is at risk at the first retrospective |
| R13, "Nothing durable lives in a session": "Met, more strongly" | The reports the documents route through BOB (other-module flaws, blocked states, requests) have no durable home named. In the fallback, one ARCH session carries a whole layer |
