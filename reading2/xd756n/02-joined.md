# [file] v3_notes.md (continued)

| "nothing found waits for the next tranche" | D | /home/user/handoff/foundations.md line 130 |
| "A public release is a development release the walkers have passed" | D | foundations.md line 248 |
| "build the installer only when the internal walk completes ..." | D | DECISIONS.md line 108 |
| "The first run or two of the external system will run without without an AI account connected" | D | DECISIONS.md line 123 (the doubled "without" is in the source) |
| "the installer update and site update wait until a release walk with AI on is also clean." | D | DECISIONS.md line 125 (source begins "Yes, ") |
| "each job's own module tests" | E | live_docs.md line 37 (source has a capital E) |
| "every requirement is tested at the module's interface and proven met" | E | foundations.md line 155 |
| "Kept" | E | live_docs.md line 61 |
| "the last 2 or 3 versions" | E | DECISIONS.md line 113 |
| "changes a module's interface" | E | live_docs.md line 33 |
| "those parts and no others"; "only the tests that relate to them" | E | live_docs.md line 52 |
| "the restarted session should recognize that corrections were made ..." | F | live_docs.md line 117 (Bob's own wording) |
| "caution is a cost, paid only against a measured failure or your word"; "the default answer to a finding with nothing measured behind it is no change" | F | live_docs.md line 91; foundations.md line 38 |
| "should happen as needed, but also ganged up when possible" | F | DECISIONS.md line 172 |
| "80% or 90% of github's published limits"; "don't do it beyond just making sure that we don't exceed published limits" | H | DECISIONS.md line 168 |
| "and nothing that happens on a live site" | H | foundations.md line 238 |
| "keep", "modify" | H | live_docs.md lines 97, 110 (store values) |
| "when I ask for one" | I | live_docs.md line 118 (Bob's own wording, 31 Oct) |
| "as many as 8 jobs at a time" | I | k_evidence.md line 314 (a session's log quoting Bob, 6 Nov) |
| "(default: 20)" | I | live_docs.md line 148 (typed by the field report's editor, taken to be Bob; the draft does not say who typed it) |
| "the standing judge of every other line" | I | foundations.md line 283 |
| "get rid of it completely" | J 1 | DECISIONS.md line 160 |
| "Is this needed at all? If so, it must be done efficiently. If not, then cut it." | J 2 | DECISIONS.md line 158 |
| "Try this, but measure the experience with an open mind as to whether it's work or not." | J 6 | live_docs.md line 116 (Bob's own wording) |
| "We only add additional checks when we can confirm from factual study and data" | J 7 | live_docs.md line 91; /home/user/handoff/causal_forensics.md line 249 (longer form) |
| "Nothing is ever refused for size" | J 9 | audit_foundations.md line 303, quoting the Foundations |
| "Act only as it says; with none, act on nothing." | K | attack_feasibility.md line 33 (product CLAUDE.md at the tranche tip) |
| "Nothing here is in force until it has run on a real tranche with the two health metrics measured." | L | foundations.md line 9 |
| "one shadow of a representative slice" | L | live_docs.md line 123 (the page's suggestion text, accepted by Bob) |

## 6. Numbers, with source and kind

Kinds: M = measured (counted in the record or on today's code by a worker); E = estimated; J = judged; R = recorded in a session-written document with no evidence file found.

| Number | Where | Source | Kind |
| --- | --- | --- | --- |
| 288; 186; 46; 15; 11; 27 (4 by Claude); 3 | A, H | appendix_recount.md lines 17 to 23 | M (script count of the second-draft appendix; see section 3, items 5 and 6) |
| 220 modules; seven with work and no code; four new | A | attack_feasibility.md lines 160 to 161 | M |
| about 50 unowned code files | A | 52: interface_and_cycle.md line 49; 49: replay/results.md line 80 | M, two counts |
| three times in nine days (set-up acts) | C | second draft, section B (not re-checked) | M, carried over |
| both takeovers left no standby, ROOT one level down | C | attack_feasibility.md line 234; roles_root_coordinator.md line 134 | M |
| ARCH replaced 21 times in 6.5 days | C | attack_feasibility.md line 82 | M |
| 60 and 64 minutes | D | product_side.md line 175 | M |
| about 30 minutes for one step | D | foundations.md line 179 (platform table) | R |
| 63 failures, every step ok, 5 and 8 Nov; 238 steps | D | attack_corruption.md lines 49 to 50 | M |
| 20 of 175 | D | attack_corruption.md line 52 | M |
| main branch unmoved since 1 Nov | D | attack_corruption.md line 44; permissions_inventory.md via attack_feasibility.md line 210 | M |
| checker refused once on 9 Nov | D | permissions_inventory.md line 272 | M, one event |
| no round clean; no release cut | D | attack_corruption.md line 44; k_evidence.md line 86 | M |
| 211 process test files | E | attack_corruption.md line 164 (product_side section 6c) | M |
| 0 of 2,540 | E | k_evidence.md line 48 | M |
| 198 import lines; 122 pairs; 36 to a later module; 3,029; 240 | E | replay/results.md lines 74, 78 | M (240 includes pattern matches) |
| 178 changes; 241; 236; 239; 45 | E | replay/results.md lines 19, 114, 145 to 150 | M |
| 167; 101; 66; 3 of the 66; 14 | E | replay/results.md lines 38 to 44 | M; "three real effects" is the replay worker's inference |
| 65; 17; 11 | E | replay/results.md line 18 | M |
| 169; 67; 64, 1, 2; 5 | E, L | replay/results.md lines 209 to 223 | 169 and 5 M; 64, 1, 2 J (one worker who knew the answer) |
| 65 modules, about 177 jobs, about 100; 59% to 71% | E | attack_feasibility.md line 138; attack_corruption.md lines 208 to 209 | E (simulation on measured inputs) |
| 71%, 360 of 504 | E | replay/results.md line 118 | M (four-parts reading only) |
| 20 cents median | E | attack_corruption.md line 200 | M |
| 532; 2,342; 2,101 | E | replay/results.md lines 36, 57 | M |
| three declared uses of a later module; 39 pairs | F | replay/results.md lines 161 to 162 | M |
| 45 minutes | F, J 4 | attack_corruption.md line 134 | M |
| 1,690 page faults | F | change_sample.md lines 144, 332 | M |
| 194 minutes | F, L | attack_feasibility.md line 109 (Foundations) | M |
| 116 moves in nine days | F, M | attack_corruption.md line 174 (product_side section 4) | M |
| 94 notifications by 13 Nov | F | /home/user/handoff/review.txt line 92 | M |
| 11 of 11; about 450 acts | G | trial_plan_facts.md line 376 says these rest on the Foundations alone | R (the draft says so) |
| five edits each stopped every long-lived session | G | attack_feasibility.md line 58 | M |
| about 700 merges, no recorded refusal | G | trial_plan_facts.md line 58 | M, "in use, not counted" |
| 218 of 220; 147 of 157; 70 of 357 with 96 listed | I | attack_corruption.md lines 51, 53, 87 | M (70 = 357 less 287 marked ok) |
| 28 of 279 | I | audit_foundations.md line 318 (permissions_inventory) | M |
| 24; 8; 20; 8 | I | audit_foundations.md lines 165 to 168; DECISIONS.md line 45 | recorded figures |
| 0 of 3 | I | permissions_inventory.md line 265 | M |
| 1,187 test runs | J 1 | audit_foundations.md line 318 | M |
| 32 of 32 | J 3 | audit_foundations.md line 333: from review.txt, not re-measured | R (the draft says so) |
| 947 findings; seven repairs | J 5 | audit_foundations.md line 326 | M, for the whole record check |
| 105 of 508 | J 6 | audit_foundations.md line 318 | M |
| 41% before and after | J 7 | audit_foundations.md line 318 | M |
| 8 KB to 134 KB | J 8 | audit_foundations.md line 318 | M |
| half an hour; two starts; one edit; one stop | L group 2 | trial_plan_facts.md lines 435, 505 | J |
| twice out of twice (old copy) | L 6 | attack_feasibility.md lines 47, 56 | M |
| five of five; three more the standby's | L 10 | audit_foundations.md line 328 | M |
| about 50 live sessions, one event; about 170 jobs | L 14 | attack_feasibility.md lines 328, 322 | M (one event); E |
| ten faults; twenty or more merges | L 17, L 5 | second draft; trial_plan_facts.md | choices, not measurements |
| below about 14% | L 23 | trial_plan_facts.md line 45 | E |
| 8,838; 236 to 357; nineteen in twenty | L 29 | attack_corruption.md lines 242, 49 to 51 | M; the ratio E |
| ten of twenty false "done" findings | L 29 | attack_corruption.md line 243 (review.txt) | M |
| about 100 in a round of 65 | L 34 | attack_feasibility.md line 138 | E |
| 121 of the 296 | M | audit_foundations.md line 324 (change_sample) | M (a worker's classification of all 296 merges) |
| about nine hours | M | attack_corruption.md line 165 | M |
| three false alarms; full count not made | M point 1 | audit_foundations.md line 325 | M / not found |
| 29 of the 220 | M | interface_and_cycle.md line 511 | M |

## 7. Re-read against the five rules: what I found and fixed

- Rule 1: replaced "method" with "function"; glossed "refactoring", "gate", "hook", "registration", "pushing with force", "pull request"; removed "status read-out", "probe", "real level", "earlier reviewers", "later platform notes", "the audit". No line ids or record codes remain (checked by search). "Claude's study of the module order" and "the worker who ran the replay" are explained in their sentences.
- Rule 2: "you decided" does not appear as a claim. Recorded decisions are cited as "line N" of section B. "your words of 6 Nov" changed to "which Process3's log quotes you saying". "Your ledger says" changed to "A line you kept in your ledger says" where the wording is a session's.
- Rule 3: "11 of 11" and "about 450" re-marked as recorded with no evidence file; "ARCH and the jobs carry on" changed to "are meant to carry on"; "would do nothing" changed to "is told to do nothing"; "so that a replaced ARCH is obeyed" changed to "can be obeyed"; kinds added to numbers that lacked one.
- Rule 4: removed a "count kept through the first tranche" I had written into group 3 of L. Trials kept are those in the second draft, the memo, or a finding's own proposal (one measurement of the live-session ceiling; one release rehearsal as far as approval; one rehearsal of the tranche-to-main merge). The trial for the fixed-version setting (L 18) is the memo's "prove in a trial"; its wording is mine.
- Rule 5: one question, in the form asked. The five "records to confirm or correct" are not put as questions.


# [file] judged241.txt

# Judged classification of the 241 affected verdicts (index = position in data/followup.json).
# KIND: REM name/op/field removed or renamed | SIG way of calling changed | NEW new capability |
#       BEH answer or behaviour changed under an unchanged name | DATA an exported table or list changed |
#       FIX published fixture/helper | NON non-code file, wire binding, served page, deploy script, committed bundle
# OUT:  B broken: user's source or existing tests were wrong or failing until changed
#       A adopted: user's source changed to take up something new or tidy; not broken without it
#       C confirmed: user's job changed no source; at most added a confirming test
#       Nc no follow-up exists (process stopped); evidence reads as no change needed
#       ? cannot tell
0 BEH Nc
1 BEH C
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


# [file] process4_lanes.md

# Process4: lanes, filled in from your documents

14 Nov 2026. For Bob, from Claude. A proposed section for the sixth draft. Nothing here is in force, nothing here is your decision until you say so, and nothing here has run in Process4.

You wrote on 14 Nov: "Lanes are an important element of the development process, though they haven't been fill into the process4 design."

How this was made. One worker collected every statement about lanes in your documents and quoted each exactly. A second worker read what Process3 actually built and did with lanes. I then read the two passages that matter most myself: the lanes paragraph in your approvals in the product's repository, and the lanes paragraphs in the later copy of your Foundations. This document starts from those statements. Where I had to decide something technical, it is marked *Claude decided*. Where your documents disagree with each other, I have not chosen for you; those are in section 3.

Words used. A **session** is one running Claude conversation. **ARCH** is the session that directs the building of one product; your documents of October and early November call it BOB. **ROOT** is the first session you start. A **job** is a session that builds one module.

---

## 1. What your documents say

In order of date. For each I say whose words they are.

**31 Oct, your note in your Keep and Drop Ledger** (a session's suggestion to which you added words): "a lane is a knowledge directory and design responsibility plus an on-demand worker BOB starts with that directory as its reading set; a long-lived lane only where measured worthwhile. The lifecycle of a lane includes refreshes that BOB manages to keep the session depth consistant."

**3 Nov, a line of your Ledger you marked "modify":** "A lane has one area of focus, reads it whole and delivers designs, never product code; jobs and lanes reach a lane only through BOB".

**Your Foundations** (written by a session from your Ledger): "Lanes are ad hoc. You identify the need for a lane and BOB opens it; some stay open for extended periods; the UX lane is always there, as a directory and a design responsibility; whether any lane runs as a long-lived session is measured". "Lanes work because BOB knows how to delegate: it recognises a design question, passes it to the lane with enough context to decide, waits for the lane's decision, and keeps the final say." "Requests between jobs and lanes pass through BOB ... Spokes never see each other." "BOB is the only creator of jobs and lanes".

**5 Nov, Process3's log, a session quoting you:**
- "there should only be ONE session per lane at a time."
- "I'm not sure we should say that a lane is a read-only helper. For example, it writes and updates design documents (like the UX Design doc). The UX design lane can create the word table".
- "the modules that use the word table have already passed their suites - they don't need to be retested. And the lane-specific documents, like the UX Design doc, doesn't need to be tested. So again, I don't believe that lanes' file changes need to be tested the way jobs do."
- "It's worth noting design documents that lanes create/update/interact with me using are CC artifacts. So they don't need to be checked in."

**5 Nov, your approvals in the product's repository** (committed by your account; the wording was handed to you by a session): "Design lanes, run under BOB, own their lane folders, the design stream (docs/development/ux-substrate) included, and each lane runs as one session at a time. Within the product's principles they decide design and wording there. Their design documents are claude.ai artifacts, not repository files. A pull request that changes only files in its own lane's folder lands through the merge tool without a test suite run, and the large files a lane's generators build are built at layer close, deploy and release, never committed."

**6 Nov, the later copy of your Foundations, quoting you:**
- "The important thing to remember when setting up lanes is the insure that a lane is fully qualified to fulfill their role as the load-bearing source of truth in their area".
- "So The first time a lane is defined and run, it should start by using workers to fully research canon documents, existing code, and best practices related to their specialty area".
- "This initial and ongoing research should be recording in a lane-specific area of the product repo for subsequent sessions to draw from and evolve".
- "The lane charters used in earlier process versions included an investigation design lane and a publication design lane. Perhaps that's an appropriate partition to continue to use".
- "These requirements related to lane startup and ongoing operations should be part of the process3 canon of requirements".

**6 Nov, the same copy, a session's wording, to which the record says you answered "keep":** "A process triage lane and a product triage lane study each identified problem and bring you options with context before a response is chosen".

**6 Nov, the product's decision record, a session's wording to which the record says you answered "agreed":** you keep the product's UX direction, its audiences and its principles; beneath them the UX lane decides screens, flows, words, layout and visual language; a decision that would change a direction, an audience or a principle comes to you with options and the lane's recommendation.

**6 Nov, your answer on the second Keep and Drop page, as a session recorded it:** "BOB starts jobs and lanes, not ROOT".

**14 Nov, typed by you:** "Process changes only happen in a separate process lane call PROCESS that I interact with." "M1: ROOT" (who starts PROCESS). "ARCH can ask ROOT to start PROCESS if it isn't already running, and the coordinator can talk to PROCESS." "screens and journeys are kept in docs/development/ux-substrate/ in the product repo".

---

## 2. Lanes, as the definition would state them

Each sentence is from the statements above unless marked *Claude decided*.

**What a lane is.** A lane is a standing design responsibility for one area of a product. It has a folder of design knowledge in the product's repository, which it owns. It reads its area whole. It delivers designs, never product code. It is the source of truth in its area, and it is qualified for that before it decides anything.

**Which lanes.** You identify the need for a lane, and ARCH opens it. The UX lane is always there. For Civicsmith the lanes are UX, investigation design and publication design. PROCESS is a lane of a different kind; see below.

**One session.** A lane runs as one session at a time. Whether a lane's session is kept running or is started when a question arrives is ARCH's call, judged by cost, and is one of the measurements your Foundations set for the end of the first tranche. That measurement was never taken in Process3. A long-running lane session is replaced by a fresh one under ARCH's management.

**Qualification.** The first time a lane runs, it uses workers to research the product's founding documents, the existing code and the best practice of its area, and it answers no question until that research is recorded. The research is kept in the lane's own area of the product's repository. Every later session of the lane reads it first, draws on it and adds to it.

**What a lane decides.** Within the product's principles a lane decides design and wording in its area. You keep the product's direction, audiences and principles. A decision that would change one of those comes to you with options and the lane's recommendation.

**How questions reach a lane.** Only through ARCH. A job never talks to a lane, and lanes never talk to each other. ARCH recognises a design question, passes it to the lane with enough context to decide, waits for the lane's decision, and keeps the final say. A question that is yours becomes your decision, and a design, before anything is built on it.

**How a lane's work is merged.** A change that touches only files in the lane's own folder merges without a test run. Your reason, as recorded on 5 Nov: the modules that use what the lane produces have already passed their own tests, and design documents do not need testing.

**The UX lane and the walks.** The UX lane owns the folder you named on 14 Nov for screens and journeys. So the UX lane keeps the two documents the walks are measured against: the internal walk uses its Screens document, the external walk follows its journeys.

**PROCESS.** PROCESS is the lane where the process is changed, and the only place it is changed. You interact with it directly. It explains each problem and offers options for you to explore and choose. Several proposals open at once are considered together. ROOT starts it; ARCH can ask ROOT to start it if it is not running; the coordinator can talk to it. A product moves to a changed process only with your prior approval, by the means PROCESS proposes.

*Claude decided* (technical, reported to you):

1. A lane session does not use one of the eight job slots. Your answer "across the account" was about job slots, a lane is not a job, and in Process3 lane sessions took no slot. So beside the eight there can be one session for each lane: three for Civicsmith, and PROCESS.
2. ARCH starts a product's lanes, so a lane sits at the same depth as a job, inside your limit of three levels.
3. One session per lane is held by a record written before the session is started, which refuses a second start while the first is live. Process3 built this and it ran: five lane starts.
4. A fresh lane session begins by reading the lane's research and the recorded links to its design pages. Process3 built the replacing of a lane session; it never once ran, so this is unproven.
5. Every question ARCH puts to a lane, and every answer, is written in the shared record. Process3 built this and it ran: five questions.
6. The report at the end of a tranche lists every change the UX lane made, during that tranche, to the two documents the walks are measured against. This is a line in a report that nothing reads to decide anything. It is not a check.
7. A lane ends when you or ARCH say its area needs no further design; its folder and research stay. Your documents are silent on this.
8. PROCESS follows the lane rules where they fit: one session at a time, its own folder (in the process's repository, not the product's), research recorded before it proposes. It differs in three ways that come from your words of 14 Nov: ROOT starts it, you talk to it directly, and what it changes is the process itself.

---

## 3. Where your documents disagree: yours to decide

1. **Who starts a lane.** Your Foundations: "BOB is the only creator of jobs and lanes". Your answer of 6 Nov as recorded: "BOB starts jobs and lanes, not ROOT". Your typed hint of 14 Nov has ROOT start PROCESS. **My recommendation:** both stand. ARCH starts a product's design lanes; PROCESS is the one lane ROOT starts, because it belongs to the process and not to any one product. I need only your yes.
2. **PROCESS and the two triage lanes.** On 6 Nov you kept a process triage lane and a product triage lane, each to study a problem and bring you options. PROCESS, in your words of 14 Nov, does what the process triage lane was to do, and also makes the change. **My recommendation:** PROCESS takes the place of the process triage lane. For the product triage lane I recommend not starting one: Process3 built it and never once started a session for it (checked today by a worker), and in Process4 a flaw found by a walk already becomes work in the next round. That would end something you kept, so it needs your yes or no.
3. **Whether you work with design lanes directly.** On 5 Nov, as recorded, you described lanes' design documents as pages they "create/update/interact with me using". The session's record of 13 Nov has the coordinator as your front door. **My recommendation:** you work with a lane through its design pages, as on 5 Nov, and with PROCESS directly; everything else comes through the coordinator.
4. **Which lanes Civicsmith begins with.** **My recommendation:** UX, investigation design and publication design, as on 6 Nov, and any further lane when you identify the need. I need only your yes.
5. **Where the Screens document and the journeys live.** Your approvals of 5 Nov: "Their design documents are claude.ai artifacts, not repository files." Your words of 14 Nov: "screens and journeys are kept in docs/development/ux-substrate/ in the product repo". This is the first question under "The end of a tranche" in the five-points document, and my recommendation is there: in the folder, kept by the UX lane.

---

## 4. Wording of yours that Process4 cannot keep as written

These are proposals. Nothing changes until you answer.

1. Your approvals say lanes are "run under BOB". The definition calls that session ARCH. *Proposed:* the approvals name ARCH when they are next edited. Nothing else about the sentence changes.
2. Your approvals say the large files a lane's generators build "are built at layer close, deploy and release, never committed". Layers are ended in Process4, on the session's record of your decisions of 13 and 14 Nov. So "layer close" names something that no longer exists. I will bring the new wording together with the open question of whether a job may commit built files, because they are the same matter.
3. The fifth draft said "ARCH defines lanes". That went against your Foundations: "You identify the need for a lane and BOB opens it". It was Claude's error and I am correcting it; no decision is needed from you.

---

## 5. What is proven and what is not

**Proven in Process3** (checked today by a worker in the product's stored records): three design lanes existed (UX, investigation, publication). Five lane sessions ran; the last three ran from 6 Nov to the end. Each lane recorded its research before deciding. Seventeen design-page links were recorded. Lanes merged 51 changes in three days with no test run.

**What went wrong in Process3** (same worker). Before the one-session rule, three UX sessions ran at once and the tool saw none of them. One lane change broke the building of the word table and merged untested. One lane session waited about two hours on a permission prompt nobody could answer. One question to a lane stayed open forty hours. The UX folder had two owners at once: the lane and a module.

**Not proven.** That lanes made the designs better. What a lane session costs. That a fresh session can take over a lane. Anything at all about PROCESS: no lane in Process3 could change the process, and nothing like PROCESS has been built. Process3's lane commands also lean on parts that Process4 ends (layers and the old merge tool), so they must be rebuilt in Process4's tool, which does not exist yet.

**A risk I can state but not remove.** The UX lane writes the documents a walk is measured against, and its changes merge untested. A flaw could be made to disappear by changing the document instead of the product. Your approvals give the lane that decision, and I am not proposing to take it away. Item 6 in section 2 makes such changes visible to you in the tranche report; it does not stop them.

**A gap in the record.** Your lane requirements of 5 and 6 Nov are in none of the 288 requirement lines that Process4 has been checked against, because that list was made from an earlier copy of your Foundations. A worker is listing what else is missing.


# [file] verify_numbers.md

# Verification of the Process3 forensic review against the git record

Verifier pass, 13 Nov 2026. Record: `/home/user/neobobkrause/process3` (read-only; nothing pushed, no ref changed).
Review under test: `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/work/review.txt`.
GitHub API not used. Everything below is from git objects only. Times are UTC unless marked PT (the merge commits carry -08:00).

Verdict scale: confirmed / roughly right / wrong / cannot be checked from git.

## 0. Method and scripts

All scripts are in `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/v/`:

| Script | What it does | Output |
| --- | --- | --- |
| `series.py` | For each of the 296 first-parent commits of `origin/tranche`: lines in `tool/lib/**` + `tool/p3.mjs` (code), `tool/test/**` minus fixtures (tests), fixtures, "refus" counts, `test(`/`it(` counts | `series.json` |
| `series2.py` | Same commits: `fail(` call sites, `throw`, setup conditions, PD/BD headings, P-numbers, line/byte size of prompt, rulebook and governing files | `series2.json` |
| `numstat.py` | `git log --first-parent -m --numstat --no-renames` per merge, split by area | `numstat.json` |
| `prlist.py` | One record per merged PR: deltas plus the PR's own non-merge commit subjects/bodies (`git log --no-merges <merge>^1..<merge>^2`) | `prs.json`, `prlist.txt` |
| `classify.py` | My hand labels for a 118-PR systematic sample and the tally | stdout |
| `phrases.py` | `git grep -i -c -E <phrase> <commit>` at every first-parent commit, printing each change in which files hold the phrase | `phrases.txt` |
| `blame_deleted.py` | Age of the lines a commit deletes (`git diff -U0` then `git blame --line-porcelain <parent>`) | stdout |

Plain git commands that reproduce the headline figures without the scripts:

```sh
cd /home/user/neobobkrause/process3
git rev-list --all --count                      # 2459
git rev-list --count origin/tranche             # 1269 ; origin/main 40
git log --first-parent --format='%s' origin/tranche \
  | grep -c -E 'Merge PR [0-9]+|Merge pull request #[0-9]+|\(#[0-9]+\)$'     # 294
# merges per day, UTC and Pacific
TZ=UTC git log --first-parent --date=format-local:'%Y-%m-%d' --format='%cd %s' origin/tranche \
  | grep -E 'Merge PR [0-9]+|Merge pull request #[0-9]+|\(#[0-9]+\)$' | cut -d' ' -f1 | sort | uniq -c
TZ=America/Los_Angeles git log --first-parent --date=format-local:'%Y-%m-%d' --format='%cd %s' origin/tranche | (same pipe)
# size and string counts at a commit C  (237c02a = PR 37, 0819c83 = PR 293 peak, cd2254a = end of 8 Nov, 38b0f3f = tip)
git grep -c '' C -- tool/lib tool/p3.mjs | awk -F: '{s+=$NF} END{print s}'          # tool code lines
git grep -c '' C -- 'tool/test/*.mjs'   | awk -F: '{s+=$NF} END{print s}'          # test lines (fixtures excluded)
git grep -o -i 'refus' C -- tool/lib tool/p3.mjs | wc -l                            # "refus*" strings
git grep -o -i -w -E 'refuse|refusal' C -- tool/lib tool/p3.mjs | wc -l             # the two exact words only
git grep -E '^\s*(test|it)\(' C -- tool/test | wc -l                                # tests
git grep -o -E '(^|[^A-Za-z0-9_.])fail\(' C -- tool/lib tool/p3.mjs | wc -l         # fail() call sites
# gross written / deleted, PR granularity
git log --first-parent -m --numstat --no-renames --format='@@%H' origin/tranche -- tool
# a merge's own figures
git diff --shortstat <merge>^1 <merge>            ;  git diff --shortstat <merge>^1 <merge> -- tool
```

Definitions used throughout: **tool code** = `tool/lib/**` + `tool/p3.mjs`, raw line count (`wc -l` equivalent, blank lines and comments included). **Tests** = `tool/test/**` excluding `tool/test/fixtures/**`. This is the review's own definition ("tool/lib and p3.mjs") and reproduces its baseline exactly, so the comparison is like for like.

## 1. Pull requests and merges per day

| Claim | Measured | Verdict |
| --- | --- | --- |
| 2,459 commits | `git rev-list --all --count` = 2,459 | confirmed |
| "302 pull requests", "rewrote its own tool 302 times" | Highest PR number is 302. **294** are merged on `origin/tranche` first-parent (the 296 first-parent commits are 2 direct commits on 1 Nov + 294 PR merges). #8 and #21 merged to `main` only. #199 merged into another build branch and reached tranche inside PR 191. #104, #158, #178, #271, #297 never merged (158 "stopped on Bob's word", 271 closed, 297 "waits for Bob", per the coordinator log). Of the 294, **252** changed tool code; 42 did not (14 are the owner's own `neobobkrause-patch-*` approvals/settings edits, 24 are decision-record, governing, rulebook, setup or workflow text, 4 change tests only). | roughly right: 302 is PRs opened, not merges, and not all are tool changes |
| 61 merges on 3 Nov | UTC: 30. Pacific (-08:00): **61**. | confirmed only in Pacific time |
| 75 merges on 4 Nov "(UTC)" | UTC: **75**. Pacific: 49. | confirmed in UTC |
| 16 by early afternoon 9 Nov (to 14:20Z) | 16 merges with commit time <= 14:20Z (the 17th is at 14:23Z). Whole UTC day: 25. | confirmed |

Per day (PR merges on tranche first-parent):

| Day | UTC | Pacific |
| --- | --- | --- |
| 1 Nov | 3 | 7 |
| 2 Nov | 22 | 28 |
| 3 Nov | 30 | 61 |
| 4 Nov | 75 | 49 |
| 5 Nov | 46 | 34 |
| 6 Nov | 25 | 47 |
| 7 Nov | 40 | 23 |
| 8 Nov | 28 | 31 |
| 9 Nov | 25 | 14 |
| total | 294 | 294 |

**The review's day table mixes time zones.** Its "3 Nov: 61" is a Pacific day and its "4 Nov: 75 (UTC)" is a UTC day; the two windows overlap by 8 hours (4 Nov 00:00Z to 08:00Z, which is 3 Nov 16:00 to 24:00 PT), and **41 merges are counted in both figures**, so the two cannot be added or read as consecutive days. In one consistent zone the peak day is 75 (UTC, 4 Nov) or 61 (Pacific, 3 Nov), never both.

## 2. Tool size

| Claim | Measured | Verdict |
| --- | --- | --- |
| Baseline at PR 37 (2 Nov evening PT): 3,120 lines, 213 tests, 18 setup conditions | PR 37 = `237c02a`, 3 Nov 02:21Z (2 Nov 18:21 PT): 3,120 code lines, 3,679 test lines, 213 `test(` calls, 18 entries in `setup/conditions.json` | confirmed exactly |
| Peak 23,900 on 9 Nov | Peak is **24,897** at PR 293 (`0819c83`, 9 Nov 14:23Z), with 30,986 test lines. No commit on the series reads 23,900 (nearest: 23,798 at PR 286, 23,696 at PR 284). | roughly right, understated by about 1,000 lines (4%) |
| "about sevenfold" | 24,897 / 3,120 = 8.0x at peak; 23,429 / 3,120 = 7.5x at the tip | roughly right |

Series at the last merge of each UTC day (`series.json`, `series2.json`):

| End of UTC day | Tool code lines | Test lines | Fixture lines | `test(` calls | `.test.mjs` files | "refus*" strings | `fail(` sites |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Nov | 1,332 | 709 | 0 | 49 | 5 | 5 | 49 |
| 2 Nov | 2,739 | 3,792 | 0 | 230 | 8 | 17 | 100 |
| PR 37 (3 Nov 02:21Z) | 3,120 | 3,679 | 0 | 213 | 14 | 62 | 141 |
| 3 Nov | 5,175 | 5,760 | 0 | 302 | 23 | 107 | 243 |
| 4 Nov | 11,037 | 15,202 | 272 | 708 | 57 | 187 | 408 |
| 5 Nov | 16,887 | 23,294 | 272 | 1,016 | 83 | 337 | 568 |
| 6 Nov | 19,085 | 22,598 | 1,044 | 1,009 | 86 | 371 | 678 |
| 7 Nov | 21,670 | 26,526 | 1,044 | 1,157 | 103 | 480 | 710 |
| 8 Nov | 22,854 | 28,174 | 1,044 | 1,216 | 109 | 507 | 755 |
| 9 Nov peak (14:23Z, PR 293) | 24,897 | 30,986 | 1,044 | 1,298 | - | 519 | 814 |
| 9 Nov tip (18:13Z, PR 302) | 23,429 | 28,882 | 1,044 | 1,223 | 112 | 464 | **818** |

The tool began 9 Nov at 22,854 code lines and ended it at 23,429: the audit day, cuts included, was net **+575** code lines.

## 3. "refuse / refusal" strings: 62 -> 507

Measured: case-insensitive substring `refus` in tool code = **62** at PR 37 and **507** at the end of 8 Nov (PRs 269 to 280). Verdict: **confirmed**, with three qualifications.

- 507 is neither the peak nor the end. Peak 519 (9 Nov 13:51Z to 14:23Z); tip 464.
- The count is of every `refus*` token (refused 174+12, refusal 88, refuses 80+3, refusals 28+6, refusing 10 at the tip), most of them in comments and message text. The two exact words "refuse"/"refusal" go 17 -> 123 -> 101.
- It is a weak proxy. The tool stops a command through `fail(msg)` (`tool/lib/util.mjs:33`). `fail(` call sites go **141 (PR 37) -> 755 (end 8 Nov) -> 818 at the tip**, and 818 is the all-time high: the 9 Nov cuts removed 58 "refus" strings but the count of stop sites finished the day higher than it began (755 -> 818).

## 4. Gross written against deleted

`numstat.py`, per-PR first-parent diffs summed over all 294 merges:

| Area | Added | Deleted | Net (= tip size) |
| --- | --- | --- | --- |
| Tool code | 35,873 | 12,444 | 23,429 |
| Tests | 40,643 | 11,761 | 28,882 |
| Code + tests | **76,516** | **24,205** | 52,311 |
| All of `tool/` (with fixtures) | 77,686 | 24,318 | 53,368 |

Review: about 78,000 written, about 24,000 deleted. Verdict: **confirmed** at PR granularity. At commit granularity (`git log --no-merges --numstat origin/tranche -- tool/lib tool/p3.mjs tool/test`) 85,977 lines were added, so about 9,500 more lines were written and rewritten inside PRs before merging.

Only **8 of 294** merges reduced `tool/` in net lines; **10** reduced tool code; **10** reduced `fail(` sites; 132 increased `fail(` sites.

## 5. The named deletions

| Review | PR / commit | Whole-repo merge diff | Net | Verdict |
| --- | --- | --- | --- | --- |
| Early cut, -1,364 | PR 32 `b33f1e6`, 3 Nov 01:41Z ("Build J: cut the tool back") | +339 / -1,703 | **-1,364** | confirmed (the figure is net) |
| 5 Nov removal, -1,273 | PR 177 `dce01e3`, 5 Nov 20:57Z | +369 / **-1,273** | -904 (tool code -278) | confirmed as gross deletions; net is -904 |
| Merge train, -9,252 | PR 191 `d18ef1b`, 6 Nov 19:11Z (commit `5dddedc`: +478 / -9,253) | +1,311 / **-9,252** | -7,941 (tool code -3,018) | confirmed as gross deletions; net is -7,941 |
| Usage ledger, -3,523 | PR 295 `b115b83`, 9 Nov 14:51Z | +288 / -3,811 | **-3,523** (tool code -1,589) | confirmed (the figure is net) |

The review quotes two of these net and two gross, without saying so. On a like-for-like net basis the four are -1,364, -904, -7,941, -3,523.

"6,858 of them had been written in the previous 27 hours" (merge train): `blame_deleted.py` on PR 191's merge diff finds 4,286 of 9,252 deleted lines committed within 27 h, 6,839 within 36 h, 8,729 within 48 h; on commit `5dddedc` alone, 5,758 within 27 h and 6,349 within 30 h (median age 25.5 h). Verdict: **roughly right**; the figure matches a 30 to 36 hour window, not 27.

A fifth cut the review folds into "the receipt ... cut": PR 296 `daf6cc3`, 9 Nov 15:27Z, +440 / -1,343, net -903 (tool code -393).

What happened after each cut (code lines, `series.json`):

| Cut | Tool code before -> after | Pre-cut size regained |
| --- | --- | --- |
| PR 32 | 3,431 -> 2,897 | 20.3 h later (PR 43) |
| PR 177 | 16,992 -> 16,714 | 9.0 h later (PR 183) |
| PR 191 | 21,101 -> 18,083 | 20.6 h later (PR 236) |
| PR 295 + 296 | 24,870 -> 23,030 | not regained by the tip; +399 in the 2 h 45 min after PR 296; `fail(` sites regained in 37 minutes (PR 299) |

## 6. Kinds of change

I read the merge subject and every commit subject of all 294 merged PRs (`prlist.txt`), and hand-labelled a systematic sample of **118** (every PR number divisible by 3, plus every number = 1 mod 15; spread 2/8/12/30/19/11/16/11/9 over 1 to 9 Nov). Labels overlap, as the review's do. `classify.py` holds every label.

| Kind | My sample (n=118) | Scaled to 294 | Review (of 302) | Verdict |
| --- | --- | --- | --- | --- |
| Fix to earlier process code | 56 (47%) | ~140 | 131 (43%) | roughly right |
| New check, gate, refusal or hold | 33 (28%) by subject; 48 (41%) counting PRs that add 5+ `fail(` sites | ~82 to ~120 | 123 (41%) | roughly right. Independent measure: 132 of 294 merges (45%) raised the `fail(` count |
| New capability or flow | 35 (30%) | ~87 | 90 (30%) | roughly right |
| Text or decision record only | 16 (14%) | ~40 | 45 (15%) | roughly right. Measured directly: 42 merges change no tool code |
| Loosened or removed | 20 (17%) | ~50 | 92 (30%) | looks high. Only 10 merges cut tool code and only 10 cut `fail(` sites; of my 20 "loosened" labels, 17 loosened a behaviour without reducing code |
| New bookkeeping | 10 (8%) | ~25 | 97 (32%) | cannot be checked from subjects; rows and measures are mostly in diffs, which I did not tag |

Fixes are the largest single kind in my sample and 44 of the 56 fix PRs add no new check or capability by subject. By period the fix share is 5 of 22 (1 to 3 Nov), 28 of 49 (4 to 5 Nov), 14 of 27 (6 to 7 Nov), 9 of 20 (8 to 9 Nov). The review's central proportion (more changes repair the process's own earlier code than add capability) holds.

Supporting figure for the review's "review rounds supplied roughly 10 to 35% of the lines": of 705 non-merge commits touching tool code or tests, 278 have a review-fix subject (review / fix pass / findings) and they carry 20,406 of 85,977 added lines, **24%** (by day 11% to 51%). Roughly right.

## 7. Restraining text in files sessions were told to load

Searched at every first-parent commit (`phrases.py`): "caution is a cost", "measured failure", "GAP-3", "no change".

| When (UTC) | PR | What changed |
| --- | --- | --- |
| 3 Nov 01:31 | 30 | `tool/lib/roles.mjs` gains the `PRIORITIES` line: "Caution is a cost, paid only against a measured failure or Bob's word. Build and do the smallest thing the work needs." It is the first paragraph of every tool-printed **ROOT, BOB and watcher** prompt. Never removed. |
| 3 Nov 01:38 | 33 | `tool/lib/review.mjs` (the reviewer's brief for a product pull request) gains the same sentence plus 'A "what if" is one line in your report, never code or owed work', and the "note: <one line, no change>" verdict form. Never removed. |
| 4 Nov 00:06 | 58 | Rulebooks created. `rulebooks/job.md` rule: "Caution is a cost ... (GAP-3 ...). Nudge."; `bob.md`: 'A reviewer\'s "what if" is ... answered by default with no change (GAP-3, TXT-6 ...). Nudge.'; `root.md` and `worker.md` cite GAP-3. All still present at the tip. |
| 5 Nov 01:45 | 139 | `bob.md` loses one "measured failure"/GAP-3 mention in a reword; the "no change" rule stays. |
| 7 Nov 05:51 | 233 | `governing/foundations.md` and `ledger-map.md` first enter the repository ("snapshot ... from claude.ai"). Before this the Foundations, the only full statement of GAP-3, was not in git at all. |
| 9 Nov tip | - | Present in: `roles.mjs` (1), `review.mjs` (1), `rulebooks/job.md`, `bob.md`, `root.md`, `worker.md`, `governing/foundations.md` (4), `ledger-map.md` (1). |

Never present, at any commit: `CLAUDE.md` (the only file every process3 session loads; it holds standing approvals and nothing else), `README.md` (the tool manual, 8 KB -> 134 KB), `shims/CLAUDE.process.md`, `rulebooks/watcher.md`, `rulebooks/layer-branch.md`, `rulebooks/account-switch.md`, and the **coordinator's prompt** (`coordinatorPrompt` in `roles.mjs`, added by PR 162 on 5 Nov 17:01Z: it points at CLAUDE.md and the handoff note and carries no priorities line).

On the coordinator's branch (`origin/start/coordinator-4nov`): 0 of 26 handoff notes cite GAP-3, "caution is a cost" or "measured failure"; 4 of 26 mention caution at all (4 Nov x2 quoting "Stop being overly cautious", 7 Nov x2). In the 1,302-line coordinator log, 3 lines cite any of the three phrases.

Verdict on the review's claim that the rule "was not where the decisions were made": **confirmed**, with one correction. The review's "Why" section says the sentence "lived in the Foundations and, as a nudge, in the product session's rulebook". It was also the opening line of every ROOT, BOB and watcher prompt from 3 Nov to the end, and in the reviewer's brief. So the product-side roles had it in front of them at every start for the whole week; the coordinator and the builders, who made the process changes, had it in nothing the repository told them to load. There is no builder prompt or rulebook in the repository at all, and no coordinator rulebook was ever merged (a draft exists on `origin/build/owner-asks`, PR 158, 5 Nov 15:06Z, "stopped on Bob's word 15:27"; that draft does not contain the sentence either).

"No change" as an option: the phrase appears as a default answer only for a reviewer's "what if" (`bob.md`, `review.mjs`). `DECISIONS.md` has 1 occurrence in 184 lines. I did not read the design notes, so the claim "none listed no change as an option" is not checked here beyond that.

File sizes, lines / bytes, at the last merge of each UTC day (lines are long, so bytes are the better measure):

| File | 2 Nov | 4 Nov | 6 Nov | 9 Nov |
| --- | --- | --- | --- | --- |
| `CLAUDE.md` (approvals) | 3 / 4,668 | 13 / 6,489 | 15 / 6,937 | 11 / 2,818 |
| `README.md` (manual) | 47 / 7,955 | 145 / 89,805 | 171 / 116,270 | 200 / 134,219 |
| `tool/lib/roles.mjs` (role prompts) | absent (218 / 17,864 on 3 Nov) | 333 / 25,708 | 413 / 33,960 | 429 / 35,229 |
| `tool/lib/review.mjs` (review brief) | absent (91 / 6,192 on 3 Nov) | 138 / 10,375 | 139 / 10,613 | 130 / 9,823 |
| `rulebooks/bob.md` | absent | 23 / 3,439 | 23 / 4,061 | 23 / 4,039 |
| `rulebooks/job.md` | absent | 19 / 1,619 | 19 / 1,985 | 19 / 2,005 |
| `rulebooks/root.md` | absent | 19 / 2,389 | 22 / 3,307 | 22 / 3,307 |
| `rulebooks/watcher.md` | absent | 16 / 1,899 | 16 / 2,113 | 16 / 2,114 |
| `rulebooks/worker.md` | absent | 16 / 1,065 | 16 / 1,207 | 16 / 1,204 |
| `rulebooks/merger.md` | absent | absent (19 / 2,346 on 5 Nov only) | removed | absent |
| `rulebooks/account-switch.md` | absent | absent (24 / 3,059 on 5 Nov) | 24 / 2,963 | 68 / 8,375 |
| `rulebooks/layer-branch.md` | absent | absent | 19 / 6,561 | 16 / 3,082 |
| `shims/CLAUDE.process.md` | absent | 6 / 878 | 6 / 1,019 | 6 / 1,019 |
| `governing/foundations.md` | not in git | not in git | not in git (306 / 68,019 on 7 Nov) | 306 / 69,452 |
| `DECISIONS.md` | absent | absent | 27 / 3,969 | 184 / 49,077 |

The role rulebooks held their "at most ten rules" cap all week and barely grew. Growth in instructing text went to the README (17x), the role-prompt generator (2x) and, from 6 Nov, the decision record (0 -> 49 KB in four days).

## 8. End state at the tip (`38b0f3f`, 9 Nov 18:13Z)

| Item | Measured | How |
| --- | --- | --- |
| Tool code | 23,429 lines in 66 files (`tool/lib` 65 + `p3.mjs`) | `git grep -c ''` |
| Stop sites | **818** `fail(` call sites (PR 37: 141); 73 `throw`; 82 `findings.push(`/`finding(` sites | `git grep -o` |
| "refus*" strings | 464 in tool code (678 more in tests); 32 literal "refused:" messages | `git grep -o -i` |
| Setup conditions | **22** entries in `setup/conditions.json` (14 at PR 15, 18 at PR 24, 20 at PR 56, 21 at PR 202, 22 at PR 239) | JSON parse |
