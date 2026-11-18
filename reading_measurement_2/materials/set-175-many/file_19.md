# Bob and BOB: did the name collision cause the mis-attribution?

## Answer

No, not to any significant degree. The record shows the name collision was a minor cause.

- Of the decisions that sessions made and recorded as the owner's, the maker was **the coordinator** in 47 of the 48 I could trace. The coordinator's name does not collide with "Bob". Only one traced case involves the BOB role, and its direction is itself uncertain.
- In ordinary mixed-case prose the sessions kept "Bob" (person) and "BOB" (session) apart almost perfectly. I found no clear case of "Bob" meaning a session in about 2,300 occurrences searched by pattern.
- The collision is real in three physical places: lower-case tool keys, all-capitals headings in the coordinator's log, and records whose authority differs only by letter case. One of these produced a measurable error (68 false "ruling owed by Bob" lines over 22.5 hours).
- The main causes are structural and would survive a rename. They are listed in section 5.

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

