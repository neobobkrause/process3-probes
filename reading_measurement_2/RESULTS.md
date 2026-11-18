# Reading measurement, second round: results

Length: this file. Last section: "11. What is not proven".

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
**No Claude Code figure came out smaller than its Codex counterpart.** The one figure that is costly to
measure, the fill level, is reported separately (section 7) and the one decision about it is put to Bob
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

_(This section is completed from the filling-trajectory run; see section 10 for the decision put to Bob.)_

Status at this commit: a single filling-trajectory reader is running — a long-lived role whose rulebook
sits in its starting context, reading ~1.37 MB of real files in sequence and re-answering a fixed rule
probe (token, value without the forbidden word, phrase, rulebook NOTE count, two facts) after each file,
so rule-keeping can be read against the window fill from about 20 to about 60 percent. One trajectory
(n=1), which is what the budget affords; the fuller version is the decision in section 10.

## 9. The real-session confirmation arm

_(Completed from the three separate sessions; see results when they finish.)_

Status at this commit: three separate sessions (started the way Process4 starts a job, cloning a keyless
branch that holds only the reader texts) are running — one single text at 24,000 bytes, one set at 162,000
bytes in 8 files, one starting text at 16,384 bytes. They test whether the worker-arm result holds for a
real session. Scored from each session's own transcript.

## 10. Recommendations, for Bob to decide

For each figure I give what the Claude Code measurement supports. The design currently uses the Codex
maxima on Bob's ruling ("Use the Codex maximum, as they're based on real measurements, and Codex context
windows are in affect more constrained than they are in Claude Code"). Nothing here overturns that ruling:
on Claude Code every Codex figure is safe with margin, and none came out smaller.

(Recommendations per figure are completed with the fill-level and real-session results below.)

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
