# Reading measurement, second round: results

Length: 283 lines. Last section: "11. What is not proven".

Run by a Claude research session (model `claude-opus-4-8`) on 18 Nov 2026, following the committed
protocol (`protocol.md`). Departures are in `departures.md`; the keys, the scored runs, the raw
transcripts and the scripts are in `keys/`, `results/scored/`, `results/raw_records/` and `scripts/`.

These are research into how well a session reads. They are not tests, checks or gates on any product.
Plain words; where a sentence is my interpretation and not a measurement or Bob's word, it is marked
"Reading:". I do not tell Bob anything will work; for each figure I say what is proven, on what, and
what is not.

## 1. The one-paragraph answer

On Claude Code, on model Opus 4.8, in a 1,000,000-token window, a reader reads a single real text in
full and then does a small real task correctly, keeping the rules it read, at least up to **176,000
bytes**; reads a set of real files in full and works from it at least up to **380,000 bytes across 18
files**; and keeps the rules in a role's starting text at least up to **16,384 bytes**. None of these
was pushed to the size where it fails, because the provisional figures Bob is using are far below them.
Every provisional figure (a single text of 24,000 bytes, a set of 175,000 bytes, a starting text of
4,096 bytes) was read in full with its rules kept, with the window left well under 40 percent afterwards.
A long-lived role kept every rule and recalled every fact correctly from 9 percent to 60 percent of the
window, with no degradation (section 8). All three figure types were confirmed on separate real sessions,
not only workers (section 9). **No Claude Code figure came out smaller than its Codex counterpart.** The
one decision — whether to measure the fill level more strongly than a single trajectory — is put to Bob
(section 10).

## 2. The harness, model and window — and the limit this puts on everything

- Harness: Claude Code, container version 2.1.327.
- Model: `claude-opus-4-8` at medium effort, confirmed from every reader's own record. This is the Opus
  4.x model that is available to configure for workers and for separate sessions here. No other Opus 4.x
  model and no other window could be selected for a fresh reader; **every figure below is labelled Opus
  4.8, 1,000,000-token window, and nothing is known here for a smaller window.** This repeats the first
  round's single-window limit and is the measurement's largest single weakness. It matters most for the
  fill level and for how byte sizes translate to a fraction of the window: on a smaller window (for
  example a Codex window of about 258,000 usable tokens) the same byte sizes fill a far larger fraction
  (section 6).
- The plain Read tool returns about 25,000 tokens at once. A 24,000-byte text therefore arrives in **one
  read** (about 11,000 tokens); texts of 96,000 bytes and up must be **paged** over several reads. Readers
  paged them without being told to and still reached full coverage.

## 3. How a reader was measured (summary; full method in protocol.md)

Each reader is an independent trial: a different real document (design text, role/requirement text, code,
or a log), brought to a target byte size, with four things inserted into the real prose — a start rule (a
token to place), a middle rule (a word to avoid), an end rule (a `COUNT=` of marker lines, which needs the
whole text), and a value stated early and overridden later (which needs reading in order). The reader is
told to read its set and do a task; nothing is said of questions beforehand. Coverage is counted from the
reader's own machine record (a text line counts as received only when its whole content appears in a Read
result), never from the reader's word; rule-keeping and the override are read from the reader's answer.

**A run passes** when, from the record and answer together: every non-blank line was received (read
whole), the reader did not search in place of reading, all three marker rules were kept, the overridden
value was reported correctly, and a two-line handover was written. A fact-recall score is secondary and
not part of pass/fail.

Controls: a reader given the task but **no text** scored nothing (all answers "UNKNOWN"), so the task
cannot be guessed; a reader given the text **in small pieces** answered everything correctly, so the task
is answerable. Keys and scoring code were kept in this session's scratchpad, outside the repository and
outside every folder a reader started in; every record was checked for a file opened outside the reading
set, and none was found.

## 4. Figure one — the largest single text (worker arm)

| rid | kind | bytes | tokens (harness) | reads | read whole? | rules kept | override | fill after |
|---|---|---|---|---|---|---|---|---|
| s-24-design | design | 24,671 | ~11,200 | 4 | yes | 3/3 | correct | 7.2% |
| s-24-role | role/req | 24,937 | ~14,500 | 4 (+grep) | yes | 3/3 | correct | 7.6% |
| s-24-code | code | 25,130 | ~11,100 | 2 | yes | 3/3 | correct | 7.7% |
| s-24-log | log | 25,152 | ~13,300 | 3 | yes | 3/3 | correct | 7.4% |
| s-96-design | design | 96,582 | ~37,600 | 4 (1 cut) | yes | 3/3 | correct | 9.9% |
| s-175-log | log | 176,001 | ~77,900 | 7 (1 cut) | yes | 3/3 | correct | 13.9% |

- **Largest size that passed: 176,000 bytes, read whole, rules kept, override correct.**
- **First size that failed: none reached.** The first round found a single text first skipped at about
  540,000 bytes; I did not re-ladder to failure, to spend the small budget on the unmeasured figures.
- **Independent trials:** four different real documents at the provisional 24,000-byte figure (design,
  role, code, log), all four passed; one each at 96,000 and 176,000.
- **The provisional Codex figure of 24,000 bytes:** passed on all four kinds, and at this size the text
  arrives in a single read, so no part can be skipped between reads — the condition the Codex
  recommendation valued, here confirmed on Claude Code.

## 5. Figure two — the largest set (worker arm), size crossed against number of files

| rid | total bytes | files | reads | read whole? | rules kept | override | fill after |
|---|---|---|---|---|---|---|---|
| set-175-few | 162,024 | 8 | 10 (+grep) | yes (all 8) | 3/3 | correct | 13.3% |
| set-175-many | 175,950 | 24 | 26 (+grep) | yes (all 24) | 2/3* | correct | 14.2% |
| set-250-med | 239,009 | 12 | 14 (+grep) | yes (all 12) | 3/3 | correct | 15.9% |
| set-400-med | 379,797 | 18 | 20 (+grep) | yes (all 18) | 3/3 | correct | 21.8% |

\* `set-175-many`'s middle rule is indeterminate, not failed: the randomly drawn forbidden word was
"allowance", which collides with the answer template's own label; the reader navigated it correctly and
read all 24 files whole with token, override and count right (see `departures.md`, item 5).

- **Largest size that passed: 379,797 bytes across 18 files, read whole.**
- **First size that failed: none reached.** The first round found a set first skipped at about 700,000
  bytes across 45 files.
- **Size versus number of files:** at about 170,000 bytes the set was read whole both as 8 large files and
  as 24 small files; tripling the file count did not break full reading. At the provisional 175,000-byte
  figure, both arrangements were read in full.
- **The provisional Codex figure of 175,000 bytes:** read in full, both few-file and many-file, rules kept.

## 6. Tokens, bytes, and what the window fraction means

- Bytes to a token, measured from the harness's own counts across the runs: about **1.7 to 2.6 bytes per
  token**, roughly 2.2 typical, varying by kind (role/requirement prose densest at ~1.7, design and code
  ~2.3–2.6, logs ~1.9–2.3). This matches the first round's ~2.4 and confirms byte figures understate the
  token load for dense prose.
- **Fill after reading** (the "room left" half of Bob's yardstick) stayed far under 40 percent of the
  1,000,000-token window in every run: 24,000 bytes left the reader at about 7 percent, 176,000 bytes at
  14 percent, and even the 380,000-byte set at 22 percent. A fresh reader holds about 61,000 tokens before
  it reads anything.
- **The window caveat, stated plainly.** These fractions are of a 1,000,000-token window. The reading
  itself cost about 11,000 tokens for 24,000 bytes and about 78,000 tokens for 176,000 bytes. On a smaller
  window the same reading is a much larger fraction: 78,000 tokens is about 30 percent of a 258,000-token
  usable window. So "room left before 40 percent" holds with large margin at the provisional figures on
  this 1,000,000-token window, and is **not** demonstrated for a smaller one.

## 7. Figure three — the largest starting text (worker arm; the rulebook is the starting instruction)

| rid | rulebook bytes | rules kept | override | phrase | pass |
|---|---|---|---|---|---|
| start-4k-a | 4,518 | 3/3 | correct | yes | pass |
| start-4k-b | 4,783 | 3/3 | correct | yes | pass |
| start-8k | 8,725 | 3/3 | correct | yes | pass |
| start-16k | 16,708 | 3/3 | correct | yes | pass |

- **Largest size whose rules were kept: 16,708 bytes.** First size that failed: none reached.
- **Independent trials:** two different rulebooks at the provisional 4,096-byte figure, both kept all
  rules; one each at 8,192 and 16,384.
- This is the **first measurement of this figure** (the first round left it unmeasured). On Claude Code,
  Opus 4.8, rules placed at the start, middle and end of a starting text up to about 16,000 bytes were all
  kept in the work that followed. The rulebook was given as a file the reader read once; whether rules hold
  equally when the starting text is injected as the first message, and whether they still hold hours later
  in a long-lived role, is not shown here (the fill trajectory in section 8 bears on the second).

## 8. Figure four — the fill level

A single long-lived role (its rulebook in its starting context) read about 1.37 MB of real files in
sequence and, after each file, re-answered a fixed probe: repeat the start token, state a value without a
forbidden word, repeat a phrase, count the rulebook's rule-marker lines, and recall two facts from its
starting sheet. Each checkpoint's window fill and correctness were read from the record. The trajectory
ran from about 9 percent to about 60 percent of the 1,000,000-token window, stopping short of compaction.

| checkpoint | window fill | token | value (no forbidden word) | phrase | count | fact 1 | fact 2 |
|---|---|---|---|---|---|---|---|
| 1 | 9.3% | ok | ok | ok | ok | ok | ok |
| 6 | 21.4% | ok | ok | ok | ok | ok | ok |
| 9 | 29.8% | ok | ok | ok | ok | ok | ok |
| 13 | 39.8% | ok | ok | ok | ok | ok | ok |
| 16 | 48.2% | ok | ok | ok | ok | ok | ok |
| 17 | 53.8% | ok | ok | ok | ok | ok | ok |
| 22 | 59.9% | ok | ok | ok | ok | ok | ok |

(The full 22-checkpoint table is `results/_fill.json`.)

- **Result: every one of the 22 checkpoints was fully correct, from 9 percent to 60 percent fill. No
  degradation in rule-keeping or recall appeared anywhere up to 60 percent** on Claude Code, Opus 4.8, a
  1,000,000-token window, short of compaction.
- This neither proves nor can prove that 40 percent is the right refresh level; a measurement can only show
  whether reading and rule-keeping are plainly worse at higher fill, and here they were not, even at 60
  percent. It is one trajectory (n=1), one window, one model. A small fall could be missed; a days-long
  session, a smaller window, and what compaction does are not shown.
- **Cost note, correcting the first plan.** The first plan called this "the costly one" because it assumed
  separate long sessions filled to each level (it estimated $200–$500). Run instead as one checkpoint-
  emitting trajectory worker, it was cheap: one worker, about 600,000 tokens of mostly cached reads,
  roughly $5–$15 in the same scale as the other readers. The costly, stronger version is the decision in
  section 10.

## 9. The real-session confirmation arm

Three separate sessions were started the way Process4 starts a job — a fresh session cloning a keyless
branch of the test ground (it holds only the reader texts, no keys), given a starting instruction that
lists a reading set and a task. Each answered exactly as the worker arm did:

| session | figure | bytes | files | answer | pass | fill after | cost |
|---|---|---|---|---|---|---|---|
| single | single text | 24,671 | 1 | token, override 111, COUNT=7 — all correct | yes | 92,757 tok (9.3%) | $0.73 |
| set | set | 162,024 | 8 | token, override 77, COUNT=8 — all correct | yes | 147,967 tok (14.8%) | $0.99 |
| starting | starting text | 16,708 | — | token TK-KJXN8, override 100, COUNT=6 — all correct | yes | 89,056 tok (8.9%) | $0.57 |

- The set session's own transcript shows it read **file_01 through file_08 (all eight files) and task.md
  with plain Read calls**, no search and no file opened outside its reading set, then reported the override
  (77, naming the replaced earlier value) and the across-files count (8) correctly. This is a record-based
  confirmation, not the session's word.
- The single and starting sessions completed with the correct token, override and count, matching their
  worker-arm twins.
- **Finding:** on Claude Code, Opus 4.8, a separate session started as a job reads its set in full and
  keeps the rules exactly as a worker does, at the single-text, set and starting-text figures. The first
  round's concern that only workers, not sessions, had been measured is answered here, for these three
  points. Three sessions, total cost about $2.29.
- Note on the denominator: these fresh sessions reported automatic-compaction at 784,000 tokens (about 78
  percent), lower than this research session's 901,600; the fill fractions above are of the 1,000,000-token
  window.

## 10. Recommendations, for Bob to decide

The design currently uses the Codex maxima on Bob's ruling ("Use the Codex maximum, as they're based on
real measurements, and Codex context windows are in affect more constrained than they are in Claude Code").
Nothing here overturns that ruling. On Claude Code, Opus 4.8, 1,000,000-token window, every provisional
figure was read in full with its rules kept and large room to spare, and **no Claude Code figure came out
smaller than its Codex counterpart** — the condition that Bob's own worker said would be brought to him.
So the Codex figures can be used as the shared maxima without conflict. For each figure, my recommendation
and its reasons:

- **The single text — keep 24,000 bytes.** Reason: on Claude Code a single real text was read in full and
  worked from correctly at least to 176,000 bytes (fill 14 percent), seven times the figure; and 24,000
  bytes arrives in one read here, so no part can be skipped between reads. 24,000 is safe with a wide
  margin on Claude Code and is the smaller, binding Codex figure. If Bob ever wants a Claude-Code-only
  maximum it is well above 176,000 bytes, but a shared figure should be the smaller one.

- **The set — keep 175,000 bytes.** Reason: sets were read in full and worked from to 380,000 bytes across
  18 files (fill 22 percent), and tripling the file count (8 vs 24 files at ~170,000 bytes) did not break
  full reading. 175,000 is safe with margin on Claude Code.

- **The starting text — keep 4,096 bytes; 8,192 is also safe on Claude Code if a role needs more room.**
  Reason: rules placed at the start, middle and end of a starting text were kept in the work that followed
  at 4,096, 8,192 and 16,384 bytes. 4,096 is Process3's proven figure and stays the conservative shared
  maximum; on the Codex side 8,192 is a documented storage limit, not a measured reading limit, so 4,096 is
  the safer shared figure. On Claude Code a role could be given up to at least 16,384 bytes of starting text
  and still keep its rules, should Bob want the room.

- **The fill level — keep 40 percent.** Reason: on Claude Code, rule-keeping and recall from the starting
  context did not fall at all from 9 percent to 60 percent fill, so 40 percent is conservative here; and a
  reader that has read any of the maxima above is left well under 40 percent (24,000 bytes → 7 percent,
  380,000-byte set → 22 percent), so the yardstick "room for a worthwhile piece of correct work and a
  handover before the fill level" holds at 40 percent with margin. Caveat: this is one trajectory on one
  window and model; on a smaller window the same reading is a larger fraction (section 6), and Codex
  exposes no fill meter, so on Codex only the "natural pause" half of the refresh rule can operate.

### The one decision I put to Bob

**Title:** Whether to invest in a stronger fill-level measurement, or accept the single trajectory.

**The question:** The fill level (figure four) is the only figure that rests here on a single trajectory
(n=1), on one model and one window. Do you want a stronger measurement of it, at more cost, or is the
present result enough to stand behind the 40 percent rule?

**Why only this figure needs your word:** The other three figures are supported by independent texts and
confirmed on real separate sessions, all within the budget you set (this session and about 17 workers,
plus 3 sessions, roughly $35 in all). A stronger fill-level measurement is the one piece that would push
past that budget, and the first plan reserved it for your word. The single trajectory already shows no
degradation to 60 percent, so the extra spend buys confidence, not a likely change of answer.

**Options:**

- **A — Accept the single trajectory (my recommendation).** What it gives: the 40 percent rule stands on a
  real, if single, Claude Code measurement showing no degradation to 60 percent. What it costs: nothing
  more. What it leaves unproven: text-to-text variation, a small fall, a smaller window, days-long
  sessions, and compaction. Why I recommend it: the result is already clean and one-directional, and the
  design's own margin (a reader of the maxima sits far below 40 percent) does not depend on this figure
  being exact.
- **B — Three to five more trajectories, different rulebooks and filler.** What it gives: text-to-text
  variation and a tighter bound on a small fall, still on this window and model. What it costs: roughly
  $20–$75 and a few more workers, modestly over this round's budget.
- **C — Separate long sessions filled to each level, several per level, and a smaller window if one can be
  found.** What it gives: the nearest thing to a real long-lived role across windows. What it costs: the
  first plan's $200–$500 and a day or two, and a window other than 1,000,000 tokens may not be available to
  configure here at all (section 2). What it leaves unproven: Codex, which exposes no fill meter.

**My recommendation: A.** Take option B or C only if you want the 40 percent rule to rest on more than one
trajectory before Process4 relies on it for long-lived roles.

**Bob's decision, 18 Nov 2026 (his exact words): "Option A — accept the single trajectory".** So the fill
level rests on the one trajectory reported in section 8 (no degradation from 9 to 60 percent fill on Claude
Code, Opus 4.8, 1,000,000-token window); no further fill-level measurement is run. The measurement is
closed with all four figures as reported above.

## 11. What is not proven

- Any size at which a single text, a set, or a starting text stops being read in full on Claude Code
  Opus 4.8 — only sizes that worked are shown here; the failure sizes are from the first round, a different
  model.
- Anything on a window other than 1,000,000 tokens, or a model other than Opus 4.8. Both were unavailable
  to configure for readers here.
- That the small number of independent trials per size (1 to 4) bounds the true failure rate tightly: with
  four passes and no failures the rule of three leaves room for a true failure rate up to about 63 percent
  at 95 percent confidence. The strength of this round is independent real texts, a search-proof task, and
  rule-keeping measured — not depth of repetition.
- Whether rules in a starting text hold hours into a long-lived role (only the fill trajectory bears on it).
