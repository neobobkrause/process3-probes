# Bob and BOB: did the name collision cause the mis-attribution?

## Answer

No, not to any significant degree. The record shows the name collision was a minor cause.

- Of the decisions that sessions made and recorded as the owner's, the maker was **the coordinator** in 47 of the 48 I could trace. The coordinator's name does not collide with "Bob". Only one traced case involves the BOB role, and its direction is itself uncertain.
- In ordinary mixed-case prose the sessions kept "Bob" (person) and "BOB" (session) apart almost perfectly. I found no clear case of "Bob" meaning a session in about 2,300 occurrences searched by pattern.
- The collision is real in three physical places: lower-case tool keys, all-capitals headings in the coordinator's log, and records whose authority differs only by letter case. One of these produced a measurable error (68 false "ruling owed by Bob" lines over 22.5 hours).
- The main causes are structural and would survive a rename. They are listed in section 5.


The Tamsin Row store took in 8 eels.

## Sources and limits

- `process3`: `origin/tranche` tip (237 files), `origin/process-state` tip (17 files), all 2,459 commit messages, and the coordinator's notes on `origin/start/coordinator-4nov` (49 files, including the 540 KB log `notes/coordinator-findings-3-4nov.md` and 26 handoffs).
- `civicsmith-copy`: 18,355 commit messages from 1 Nov, `origin/tranche:DECISIONS.md`, `origin/process-state:handoff/bob.md`, `messages/bob.jsonl` (359 messages BOB sent) and 14 other message files (583 messages), six ledger entries at named commits, `build/rulings.md`.
- Canon copies `foundations.md` and `ledger_map.md`, and `causal_forensics.md` section 4.
- **Not available**: session transcripts, the coordinator's briefs to builders, and the coordinator's direct messages to BOB. The owner's "actual words" are known only as sessions typed them into the log, plus his own website commits and the log's summaries of his Keep and Drop page answers. A quote marked "verbatim" is still a session's transcription.
- The search for "Bob meaning a session" was by pattern (possessives, verbs, articles, session ids), not a line-by-line reading.

## 1. Counts, and where the distinction is physically lost

Case-sensitive, whole word. "Bob" includes "Bob's"; "BOB" includes "BOB's" and "BOB'S".

| Corpus | Bob | BOB | bob | Bob's | BOB's | BOB'S |
| --- | --- | --- | --- | --- | --- | --- |
| process3 tranche tip, text files | 976 (150 files) | 1,242 (142 files) | 844 (1,117 as a substring) | 319 | 330 | 0 |
| process3 process-state tip | 0 | 0 | 0 (193 substring hits, all `neobobkrause/...` repo slugs) | 0 | 0 | 0 |
| process3 commit messages, all refs (2,459) | 260 | 262 | 70 | 105 | 97 | 0 |
| of which reachable from tranche (1,269) | 187 | 213 | 58 | 77 | 95 | 0 |
| Coordinator's notes branch (49 files) | 793 | 1,396 | 98 | 267 | 164 | 95 |
| civicsmith-copy commit messages from 1 Nov (18,355) | 177 | 358 | 2,327 | 73 | 89 | 0 |

Where lower-case `bob` appears at the tranche tip (1,114 tokens; 739 in tests, 286 in tool code, 51 in the README):

| Where | Tokens | Means |
| --- | --- | --- |
| Role key or string literal `'bob'` in code and docs | 514 | the session |
| CLI role arguments: `--role bob`, `--from bob`, `send bob`, `start bob` | 153 | the session |
| Branch names `bob/<x>` | 100 | the session |
| GitHub login and repo slug `neobobkrause` | 82 | the owner's account |
| Test session and trigger ids (`session_bob1`) | 69 | the session |
| Identifiers (`bobPrompt`, `bobStatus`) | 63 | the session |
| Config and row keys (`bob_acts`, `bob_quiet_h`, `bob_usd`, `reading_bob`) | 53 | the session |
| File names (`rulebooks/bob.md`, `handoff/bob.md`, `addresses/bob.json`, `messages/bob.jsonl`) | 47 | the session |
| Message ids (`MSG bob-249 to coordinator`) | 13 | the session |
| `--bob "<words>"` and the row field `bob` in `tranche open --record` | 9 | **the person's words** |
| `block --owner bob` and `owner: 'bob'` in a ledger entry | 8 | **the person** |

So the same lower-case key means the session in about 1,000 places and the person in 17. Other places where only context separates them:

- **Git**. In civicsmith-copy the authors are `Bob Krause` (45 commits in November, all GitHub website commits) and `BOB <noreply@anthropic.com>` (16 commits, 2 to 5 Nov). There are 248 branches `bob/...` plus `bob-audit`. The owner's merge of the session's branch reads "Merge pull request #625 from neobobkrause/bob/dist-workflows". State-branch commit subjects are "message from bob to coordinator" (359) and "message from job-x to bob" (881).
- **File names**. `rulebooks/bob.md` and `handoff/bob.md` are the session's ("# Handoff for bob"). `notes/bob-files-9nov/`, `notes/probes-pin-for-bob.md` and `notes/bob-workflow-diffs-4nov.md` on the coordinator's branch are for the person.
- **All capitals**. The coordinator's log uses capitals for emphasis, so the person becomes "BOB": 93 headings such as "BOB'S WORD", "BOB'S DECISION", "BOB'S QUESTION"; also "FOR BOB", "STILL BOB'S", "BOB'S LIST", "BOB (verbatim)". None of these appear at the tranche tip or in any commit message.
- **Record titles**. The product's `DECISIONS.md` titles its records "(BOB, 6 Nov)" for 7 and "(Bob, 6 Nov)" for 11. The maker of a decision is carried by letter case alone.
- **Series names**. "BD-n" in the product means a record BOB wrote. "BD-R1" to "BD-R5" in process3 are Bob's own decisions.

## 2. Attributions to "Bob", classified

Classes: (a) the owner's words, quoted or traceable to his own act; (a′) the owner's assent, by a word or a click, to text a session drafted; (b) a session's paraphrase or inference; (c) a session's decision written as his; (d) undeterminable. I added (a′) because it is common and differs from both (a) and (b).

| Sample | n | a | a′ | b | c | d |
| --- | --- | --- | --- | --- | --- | --- |
| S1. "(Bob, n Nov)" citations in tool code, rulebooks and README that the sessions' own audit re-sourced on 6 Nov (PR 184: `778164f`, `eddf0aa`, `0a66284`) | 77 | 8 | 0 | 10 | 44 | 15 |
| S2. Random 60 of 127 distinct attributions in process3 commit messages (7 dropped as not attributions) | 53 | 32 | 4 | 8 | 1 | 8 |
| S3. Items under "BOB'S WORDS / DECISIONS (binding)" in handoffs 4nov-c, 4nov-d, 5nov-b, and the "(Bob)" list in 6nov-c | 23 | 7 | 3 | 10 | 3 | 0 |
| S4. Foundations at the tip: "your word", "your direction", "Bob's answer", "(Bob, date)" | 46 | 4 | 23 | 1 | 0 | 18 |
| S5. Decision records titled "(Bob, date)": 8 in process3, 11 in the product | 19 | 13 | 5 | 1 | 0 | 0 |
| **All** | **218** | **64 (29%)** | **35 (16%)** | **30 (14%)** | **48 (22%)** | **41 (19%)** |

Notes on the samples:

- S1 covers the worst period (4 and 5 Nov) and was selected by the sessions' own audit. Before it, 120 such citations stood in those files and 10 to 14 carried a quote, depending on the pattern used. I checked the classification against the diff and spot-checked the log.
- S2 leans late: from 6 Nov the rule AUD-4 required quotes, and 9 Nov commits nearly all quote him.
- S4's 18 undeterminable items are dated 1 to 3 Nov, before the log starts. The tip still carries 20 citations marked "Bob, 2 Nov, before the log; unverified".
- The samples overlap in subject (one decision can be cited in several places), so the total is a count of attributions, not of decisions.
- Who made the 48 class (c) decisions: the coordinator, 47; the BOB role, 1 (uncertain, see example 9).

The sessions' own counts agree in kind: 21 items marked Bob's across ten handoffs, of which "6 on a closed list ..., 14 were mechanisms" (log, 5 Nov 15:30); and the 9 Nov audit's 35 safeguards, "Bob's quoted words: 7. Called Bob's but unquoted: 5. ... Coordinator only: 19."

Quoting improved over the week. Of the log's "BOB'S WORD / DECISION" entries, 17 of 19 on 4 Nov have no quote, 10 of 18 on 5 Nov, 8 of 32 on 6 Nov, and 1 of 9 from 7 Nov.

### Examples of (c): a session's decision written as Bob's

1. `README.md` and `tool/lib/hold.mjs`, before `778164f`: "the only way to hold startable work below the job cap (Bob, 5 Nov: ...)". After: "(the coordinator's design, 5 Nov 01:13, on Bob's question why work was silently limited ...)".
2. `rulebooks/merger.md`, from `15ef179`: "One train runs at a time (Bob, 5 Nov)". After: "(coordinator's option F, 5 Nov 02:35)". Six more rules in that file changed the same way.
3. `rulebooks/root.md` rule 6: "an irreversible one waits (Bob, 4 Nov)". After: "(coordinator, 4 Nov)". His words were "do what's necessary to make sure that urgency is fully supported in process3's initial release" (log, 4 Nov 01:28); the builder's commit `d33d324` cites that sentence for the whole escalation chain.
4. `README.md`: "never compared with the run (Bob, 5 Nov: 17 reds and no catch)". After: "(coordinator's check audit, 5 Nov 19:30 ...)". About a dozen sites cited that audit's findings as his. The log, 5 Nov 22:51: "JOB-12 was a Keep that 177 reversed under Bob's name".
5. Handoff 4nov-d, under "BOB'S DECISIONS TODAY (binding, in order)": "Agreed (16:55): copy work narrowed to the release path only, about 6 job sessions". Log, 5 Nov 01:13: "(its own number) ... the coordinator's number recorded as Bob's agreement".
6. Log, 5 Nov 02:08: "'a hold over 2 h or a quarter of the cap needs your own commit' ... was the coordinator's invention (my 01:13 idle-capacity brief), stated to Bob as if a rule of his". The build's review (`ab43ddf1`) had already tightened "Bob's word" for that path.
7. Handoff 5nov-b, under "BOB'S WORDS ON 5 NOV (binding, newest last)": "Merge design is his ... Option F chosen ... batching off, revisit with Bob when queue depth at merge stays >= 3." The same list ends "Do not present a coordinator design choice as Bob's rule", which is the coordinator's own lesson from 02:08, filed under the owner's words.
8. BOB's message bob-224, 5 Nov 20:44: "Record, standing ruling from Bob 5 Nov 20:30 (via the coordinator): process3 fixes that raise merge throughput or unblock jobs go ahead of product job merges". bob-225, six minutes later: "is the coordinator's, not Bob's: Bob asked a question and the coordinator answered it."
9. `tool/lib/layerflow.mjs:109`, from `0ed3679` (5 Nov 23:48): "A return shape is not in the exports (Bob, 5 Nov: a provider answered {materials: [...]} ...)". The audit changed it to "(BOB's finding, bob-249, 6 Nov ...)". This is the only Bob/BOB swap in the record, and the record cannot settle which way the error ran: the original commit predates bob-249 (6 Nov 00:10), bob-249 itself says "Bob's provider check", and the product commit says "Bob's word via the coordinator 5 Nov 23:33".
10. `rulebooks/layer-branch.md`: "with his rulings: ... one small PR per publish". After `0a66284`: "is the note's recommended implementation choice, which the coordinator adopted".

### Clearest examples of (b): a paraphrase or inference under his name

- Product `DECISIONS.md` BD-6: "a product principle, Bob's words ("agreed", ~18:15Z through the coordinator): "Civicsmith tracks trust and transparency developments ..."". The log shows the sentence was the coordinator's summary and his word was "agreed". A later commit calls it "Bob's principle of 6 Nov 2026" with the sentence in quotes.
- SLB-12. Log, 6 Nov 16:20: "BOB'S WORD: "Yes, add that rule to the canon"". The rule and its enforcement ("layer merge refuses") were the coordinator's; the canon cites "(Bob, 6 Nov 2026, SLB-12)". Bob, 9 Nov: "SLB-12 sounds far too broad."
- Commit `c24de953`: "Bob, 4 Nov: focus on urgency, merge on a clean review". His words: "Stop being overly cautious and focus more on urgency."
- PD-25, titled "(Bob, 9 Nov)": his "perhaps holding jobs in upper layers until an earlier layer closes isn't necessary" becomes the whole direct flow.
- BD-R4: "perhaps the last 2 or 3 versions" becomes "the last 3 releases (the coordinator's reading of "2 or 3", the safer end)".
- Ledger map P24 to P26, each "(Bob, 6 Nov)": one sentence of his each, with principle wording and mechanism by the coordinator ("a Foundations line (Bob's)", log 6 Nov 17:00).

