# Reading measurement, second round: the protocol

Length: this file. Last section: "12. The budget, in sessions and tokens".

Written by a Claude research session (model `claude-opus-4-8`) on 18 Nov 2026, before any reader
was run. It is committed before the runs begin. The runs follow it. Every departure is recorded,
with its reason, in `departures.md` beside this file. No pass rule here is changed after results are seen.

These are research into how well a session reads. They are not tests, checks or gates on any product.
Nothing in Process4 waits on them or repeats them.

Plain words. No reference codes. Where a sentence is my interpretation and not a measurement or Bob's
word, it is marked "Reading:".

## 1. The question each figure answers

The Process4 design keeps every text a session must read in full, and every set read together, below a
measured maximum. Four figures are owed. For each, the design's yardstick is Bob's sentence:
"after a session has read what it must, there is room for a worthwhile piece of correct work and a
handover before the fill level."

So for each figure the question is not only "was the text read whole?" but "after reading that much,
did the reader do a small real task correctly, keep the rules it read, and still have room left?"

- **The single text.** The largest one text a reader takes in full and then works from correctly.
- **The set.** The largest set of texts, read together, a reader takes in full and then works from.
- **The starting text.** The largest starting text (a role's rulebook) whose rules a reader keeps in the
  work that follows.
- **The fill level.** The window fill at which reading and rule-keeping begin to fall. Bob has ruled 40%.

## 2. What this round fixes from the first

Each is one of the first measurement's named weaknesses.

1. **Independent trials.** Each trial is a *different real text* with its own questions, not a repeat of
   one text. The first round nested one log and repeated one question set.
2. **Different real documents, of the kinds Process4 reads.** Design text, requirement/role text, code,
   and a log. Taken from `neobobkrause/process3`.
3. **A task searching cannot answer, and rule-keeping measured.** Each text carries three marker rules
   (start, middle, end) whose keeping shows in the reader's output, a value stated early and overridden
   later, and a count that needs the whole text. The reading is judged by what the reader then does, not
   only by what it can recall.
4. **Coverage from the record, never the reader's word.** Every line a read returned is counted from the
   reader's own machine record. A run is marked read-whole, read-in-part, or searched, and what came just
   before any skip (a refusal, a cut, or nothing) is recorded.
5. **Keys out of reach.** Answer keys and scoring code live in this session's scratchpad, outside the
   repository and outside every folder a reader starts in. Each reader works in its own scratchpad folder
   holding only its text and task. Every record is checked for a file opened outside the reading set; such
   a run is set aside.
6. **Tokens and bytes both.** Every size is reported in bytes and in the harness's own token count, with
   the bytes-to-a-token ratio given for each kind of text.
7. **Two arms, reported apart.** A worker arm (subagents of this session, which is how Process4 does heavy
   reading) and a smaller real-session arm (separate sessions started the way Process4 starts a job).

## 3. What could not be made as strong as the brief asks, and why

The brief for a fully reliable result asks for at least ten different texts at each size, repeats of each,
every model and window, and a real-session main arm. Bob set the scope of this round at "the context of
this session and from 10 to as many as 20 workers," on Opus 4.x models at medium effort. These cannot both
be met. This protocol spends the worker budget to get **independent texts at the figures that matter and
the two figures the first round never measured**, not a ten-deep ladder. The consequences, stated plainly
and carried into the results:

- The number of independent trials per size is small (1 to 4), not ten. The failure-rate arithmetic in
  section 10 is therefore wide. This is stated for every figure.
- The main vehicle is workers, with only a small real-session check, because the budget names workers.
  The worker-versus-session comparison is reported; it does not become a ten-session main arm.
- Only one model and one window are available to configure here (section 4). Every figure is labelled with
  them. Smaller windows stay unmeasured, as in the first round.

Reading: within Bob's budget this is the most informative design I can run. Where it is thin, the results
say so rather than imply more.

## 4. The harness, model and window

- Harness: Claude Code, container version as recorded at run time (2.1.327 at the time of writing).
- Model: `claude-opus-4-8`, at medium effort, for every reader. This is the Opus 4.x model available to
  configure for workers and sessions here. If any other Opus 4.x model or any other window proves
  selectable, it is added and labelled; if not, that is stated and every figure is labelled "Opus 4.8,
  1,000,000-token window."
- Window: 1,000,000 tokens (this session reports max 1,000,000, effective 980,000, automatic compaction
  near 901,600). Each reader's window is read from its own record and reported, not assumed.

## 5. The materials

All texts are real, taken from `neobobkrause/process3`:

- **Design text** — `process4/definition/` (the sixth draft and the v7 modules).
- **Requirement / role text** — the v7 modules and `process4/evidence/roles_root_coordinator.md`.
- **Code** — the process tool's Python under `process4/working/` (for example `build_report.py`,
  `replay/extract.py`).
- **Log** — the coordinator's log `notes/coordinator-findings-3-4nov.md` on branch `start/coordinator-4nov`.

Each reader text is one real document (or a contiguous real cut of one) brought to the target byte size at
a section boundary, then four things are inserted into the real prose:

- a **start rule**, within the first 10% of lines: begin the final answer's first line with an exact token;
- a **middle rule**, near the 50% line: never use one named everyday word in the final answer;
- an **end rule**, within the last 10% of lines: end the final answer with a line `COUNT=N`, where N is a
  thing that needs the whole text (the number of items in a list that runs across the document);
- an **early value and its later override**: a quantity is stated early ("the limit is X") and replaced
  later ("the limit stated earlier no longer holds; it is Y now"). The two sit far apart.

Three fact questions are also written for each text, one from the first tenth, one from the middle, one
from the last tenth. Each fact has exactly one home in the text (checked by counting occurrences of its
accept-strings), and none of its accept-strings appears in the question (so no single search finds it).

Sets are built from several such real files, each file itself under the single-text maximum, so each file
arrives in one plain read. For a set, the end rule's count runs across files, and the override's two halves
sit in two different files (so answering needs two files held together).

Materials (the reader-visible texts and tasks) are committed under
`reading_measurement_2/materials/`. The keys and scoring code are kept only in scratchpad until every run
is done; they are committed with the results afterwards, for the record, never before.

## 6. What each reader is given and does

A reader is given a starting instruction that lists its reading set under "Reading set (read each file
whole)" and a task. Nothing is said about questions before the reading. The task, in one message after the
reading in the worker arm (or in the same starting text for the real-session arm, matching how a job
starts), asks the reader to:

1. keep the three marker rules (this is checked in the output);
2. report the effective value of the overridden quantity, in its own words (the middle rule forbids the
   quantity's everyday name, so the value must be paraphrased — a searcher who did not read in order
   reports the early value or trips the forbidden word);
3. answer the three fact questions;
4. write a two-line handover for a successor, naming what it read and the task's result.

Item 4 is the "room for work and a handover" half of the yardstick: it is only possible if the reading did
not fill the window.

The reader is told to read only the files in its own folder and to use no other file.

## 7. How a run is scored, from the record

Each worker's record (`~/.claude/projects/<project>/<session>/subagents/agent-<id>.jsonl`) is read by an
adapted copy of the first round's `score.py`, whose way of counting lines from a record Bob's brief accepts.
For each run it records, from the record alone:

- **Coverage** — a text line counts as received when its whole content appears in some tool result. The
  reader's self-report is never used for this.
- **Read whole / in part / searched** — searched means a non-Read tool (grep, a shell command, a search)
  was used on the text, or the text was never fully returned. The call just before any gap is marked a
  refusal, a cut (`read_truncation_notice`), or nothing.
- **Context tokens at the end** — from the record's usage, as the fill after the reading (the room left).
- **Any file opened outside the reading set** — if present, the run is set aside.
- **Bytes and tokens of the text** — bytes from the file, tokens from the harness's read (truncation
  notices and usage deltas), giving the bytes-to-a-token ratio for that text's kind.

From the reader's final answer: the three marker rules kept or not, the override value right or not, the
three facts right or not, the handover present and about the real content or not.

For the real-session arm, the same values are taken from the session's transcript through the session tools
(`list_events`, `get_event`); if a session's read line counts cannot be recovered from the transcript, that
is recorded and the run is reported on what can be recovered, marked as such.

## 8. The pass rule (fixed here, before any run)

**A run passes** when, from the record and the output together:

1. every non-blank line of every file in its reading set was received (read whole), and
2. the reader did not search in place of reading, and
3. all three marker rules were kept, and
4. the overridden value was reported correctly, and
5. the handover is present and refers to the text's real content.

Fact recall (the three questions) is reported as a **second score** and is **not** part of pass or fail,
because the design cares whether a reading is kept in the work, not whether facts can be recalled with
tools to hand. A run that is set aside (a key or an out-of-set file was opened, or the prompt did not match)
is neither a pass nor a fail and is reported separately.

**A size passes** when every run at that size passes. **A size fails** when any run at it is read in part or
searched, or keeps fewer than three rules, or gets the override wrong. The way it failed is recorded.

## 9. The sizes, the arms, and the trials

Sizes are in bytes. "Kinds" names which real document kind each independent text is drawn from.

### Figure one — a single text (worker arm)
- 24,000 bytes (the provisional maximum): **4 independent texts** — design, requirement/role, code, log.
- 96,000 bytes (well inside one read): **1 text** — log.
- 175,000 bytes (a single text at the set maximum; near the one-read ceiling): **1 text** — design.
- Six readers. Confirms the provisional figure with independent texts and a search-proof task, and shows
  the margin above it. The first round already found where one text first failed (about 540,000 bytes);
  that is cited, not re-laddered, to save the budget for the unmeasured figures.

### Figure two — a set (worker arm), crossing size against number of files
- 175,000 bytes (the provisional maximum) as **few large files** (8 files of about 22,000 bytes): 1 reader.
- 175,000 bytes as **many small files** (about 28 files of about 6,000 bytes): 1 reader.
- 250,000 bytes, medium count (about 12 files): 1 reader.
- 400,000 bytes (the first round's largest passing set), medium count (about 18 files): 1 reader.
- Four readers. The first two separate size from number of files at the figure that matters; the last two
  show the margin.

### Figure three — a role's starting text (worker arm; the reader's starting instruction *is* the text)
- 4,096 bytes with at most ten rules (the provisional figure): **2 independent rulebooks**.
- 8,192 bytes: 1 rulebook.
- 16,384 bytes: 1 rulebook.
- Four readers. The three marker rules sit at the start, the middle and the end of the rulebook; a scripted
  task gives each rule an occasion. This is the first real measurement of this figure.

### The real-session confirmation arm (separate sessions, Opus 4.x)
- One session at the single-text figure (24,000 bytes), one at the set figure (175,000 bytes, many files),
  and, if the first two score cleanly from their transcripts, one at the starting-text figure (4,096 bytes).
- Two or three sessions. This tests whether the worker-arm result holds for a real session. It is a check,
  not a second full ladder.

### Figure four — the fill level
Estimated before anything is run (section 11), and run only on Bob's word, because it is the costly one and
on its face it does not fit this round's budget.

### Controls (shared across figures)
- **No-text control**: one reader is given the task and the questions but no text. It should score near
  nothing; if it scores well, the questions are guessable and are rewritten.
- **Handed-in-parts control**: one reader is given the text in small pieces and the questions. It should
  score well; if it cannot, the questions are unanswerable and are rewritten.
- A second worker that did not write the questions reviews every set for one home per fact, no accept-string
  in the question, and no answer findable by a single search.

## 10. How each figure is drawn, and the arithmetic of the counts

For each figure the results state: the largest size that passed and the first that failed; the harness,
model and window; how many **independent** trials stand behind each; how it failed; and what is not proven.

The failure-rate arithmetic is stated honestly for the small counts. With `k` independent passes and no
failures, the rule of three gives a rough upper bound on the true failure rate of about `3/k` at 95%
confidence: 4 passes leave room for a failure rate up to about 63%, 6 up to about 50%. These bounds are
wide because the budget is small, and the results say so for every figure. Repeats of one text are **not**
counted as independent and do not enter this arithmetic. The figure a reader kind varies by (text-to-text
variation) is reported apart from any repeat variation.

## 11. The fill-level estimate (done before any fill-level run)

The fill-level measurement compares reading and rule-keeping at 20, 30, 40, 50 and 60 percent of the
window, stopping short of compaction. On a 1,000,000-token window that means a session carrying 200,000 to
600,000 tokens of real work before each probe. Filling to 600,000 tokens of genuine reading is itself most
of a session's life. The first round's one data point: a session at 73% had cost $97.99. A single session
taken to 60% is a large cost, and five fill levels across enough sessions to see a difference is larger
still. The exact estimate and the options are in section 6 of the results draft and are put to Bob as the
one decision only he can make. Nothing at the fill level is run before his word.

## 12. The budget, in sessions and tokens

Planned before the runs:

- Worker readers: 6 (single) + 4 (set) + 4 (starting) = 14, plus 2 controls = 16 worker runs.
- One verification worker for the question sets: 1.
- Real-session readers: 2 to 3 separate sessions.
- Total: about 16 to 17 workers and 2 to 3 sessions. Within "10 to 20 workers."
- Tokens: each reader holds roughly 60,000 to 170,000 tokens in its own context while reading; only a
  short handover returns to this session, so this session's own context grows by a few thousand tokens per
  reader plus the scoring reads. This session stays well under its 60% refresh line.
- Rough money: the worker and session readers together are short runs; on the first round's scale
  ($0.50–$2 a short reader) this is roughly $30 to $60. The fill-level figure is separate and large
  ($200–$500 on the first round's estimate), which is why it waits on Bob.

This protocol is fixed as of this commit. Changes to it after a run appear only in `departures.md`.
