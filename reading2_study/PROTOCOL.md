# Second reading measurement: the protocol

Length: 209 lines. Last section: "17. Cost, the allowance, and the order of work".

Written by Claude (the research session) on 18 Nov 2026, before any measuring run. Bob's brief is quoted where it rules. Everything else is my design, and is marked as mine where it reads his words.

These runs are research. They are not tests, checks or gates on any product, and nothing in Process4 waits on them or repeats them.

## 1. What is measured

Four figures, from section 3 of the design state:

1. The largest single text a session reads in full.
2. The largest set of texts a session reads in full together.
3. The largest starting text for a role.
4. The fill level at which a long-lived role is refreshed.

The yardstick for all four is the design state's: "after a session has read what it must, there is room for a worthwhile piece of correct work and a handover before the fill level."

So every run here has two halves: a reading, and then a small piece of real work and a handover in which what was read must be kept. A size is not judged by whether the text arrived. It is judged by whether the work that followed was correct and kept the rules the text gave.

## 2. What was found before this was written

These were checks of the machinery. No figure is drawn from them.

- Five sessions were started, one each on `claude-fable-5-2`, `claude-opus-5-5`, `claude-sonnet-5-5` and `claude-haiku-5-5`, and one more on Sonnet to test collecting a record. All four models start as sessions here. Each reported a window of 1,000,000 tokens. A fresh session held about 83,000 tokens before it read anything.
- One documented setting, `CLAUDE_CODE_DISABLE_1M_CONTEXT=1`, placed in the readers' branch's settings file, holds a session to a window of 200,000 tokens. One Fable session was started that way and reported a window of 200,000 and an automatic compaction point of 144,000. Process4 as designed does not set this. It is run here because Bob's brief says nothing is known for a smaller window.
- In a 200,000-token window a fresh session's 83,000 tokens are already about 41 percent of the window.
- A session's record can be collected whole: every call it made, and for each read the first line, the number of lines returned and the file's total lines.
- The week's allowance on Bob's subscription stood at 26 percent used at 19:33 UTC on 18 Nov, and resets on 23 Nov. Use beyond the allowance is switched off for the organisation, so a run cannot spend past it; it would be refused.

## 3. Readers, models and windows

Each arm is reported apart. Every figure is labelled with its arm.

| Arm | Reader | Model | Window |
|---|---|---|---|
| Main | a separate session | Fable 5.2 | 1,000,000 |
| Small window | a separate session | Fable 5.2 | 200,000 |
| Opus | a separate session | Opus 5.5 | 1,000,000 |
| Sonnet | a separate session | Sonnet 5.5 | 1,000,000 |
| Haiku | a separate session | Haiku 5.5 | 1,000,000 |
| Worker | a worker inside a Fable 5.2 session | Fable 5.2 | 1,000,000 |

- A separate session is started the way Process4 starts a job: by another session, with a starting text as its first message. The starting text lists a reading set under "Reading set (read each file whole):" and gives a task. Its repository is the readers' branch of `process3-probes`.
- A worker is started by a host session, which is itself a separate session, with the same starting text as the worker's brief.
- The harness is Claude Code 2.1.327 in every arm. Codex is not run from here (section 16).

## 4. The texts

- **Source.** 384 real files copied from `neobobkrause/process3` by a worker, 11.1 MB: decision records and requirement lists (0.6 MB), texts that tell a role how to work (0.56 MB), design and analysis prose (2.8 MB), the tool's code and tests (4.1 MB), logs and handoffs (3.1 MB). Files about reading studies are left out, so no reader meets this study's subject in its text. Of several versions of one document only the latest is kept. Data files (json, tsv) are used only as unmarked members of sets.
- **Five kinds.** Requirement files, role principles, design text, code, logs. At each size the ten texts are two of each kind where the kind has enough text. Where it has not, the shortfall is filled from design text and code, and the results say which.
- **A different text every trial.** At one size, each of the ten texts comes from a different real document, or from a part of a document that no other text at that size uses. Texts at different sizes are never one the start of another. A text is cut from a place chosen by a seeded random draw, at a paragraph's or line's edge, and its size is within 3 percent of the step.
- **Above the largest real document.** Few real documents exceed 140,000 bytes. A larger text is whole real documents of one kind joined into one file, each under its own name as a heading. The results say for each text whether it is one document or a joining.
- **Sets.** A set is several files. Each file is a real document or a part of one, cut as above. Sets at one size and shape are drawn apart from each other as far as the corpus allows. Where two sets at one size share a file, the results give the share, and section 13's arithmetic is not used for that size without saying so.

## 5. What is placed in each text

A seeded script places short passages in each text or set. They are written to read as part of the document: a paragraph in prose, a comment in code, an entry in a log. No two trials share their values.

1. **Three rules, one early, one in the middle, one at the end.** Early is the first tenth of the text, the middle is the band from 45 to 55 percent, the end is the last tenth. In a set they are in the first file, a middle file and the last file. Each is a rule on the output of a job, whose keeping shows in the files the job writes. The kinds: the first line of every file written; the last line of the handover note; the name of the handover note; the last line a script prints; a line the handover must contain. Which kind sits where is drawn at random.
2. **One rule that is changed later.** An early passage requires a line naming a reviewer. A later passage, at least a quarter of the text further on, says the reviewer has changed and the old name is no longer written. In a set the two are in different files.
3. **A count across the text.** Three to six sentences, spread over the whole text, each recording a number of some member of one family of things (for example kinds of fruit), in different words each time. The question asked later names only the family, a word that appears in none of the sentences. Its answer is the number of entries and the total.
4. Nothing in the starting text or the task names any of these. The task says only: "Follow every standing instruction the reading set gives for a job's output."

## 6. The task, and the questions after it

**The first message** is the starting text: the reading set, then the task. The task is small real work:

- write a short Python script to a stated specification, drawn from a bank of eight, into a folder outside the repository;
- write a handover note of at most ten lines for the next session;
- change nothing in the repository.

**The second message** is sent when the first turn has ended. It asks the reader to print the files it wrote with one stated command, and then, with no further tool, to answer from memory: the count question, and six fact questions about the text (two from its first tenth, two from the middle, two from its last tenth; for a set, eight questions spread over its files).

The fact questions are a second score only. They are written by a worker for each text and checked as section 11 says.

## 7. What is recorded for each run

Taken from the session's record, never from the reader's word:

- every call the reader made, in order;
- for each read: the file, the first line returned, the number of lines returned, the file's total lines, and whether the read was refused or cut;
- for other calls that return text of a reading-set file: which of the file's lines appear in what was returned;
- the starting text as the reader received it, compared byte for byte with the one intended;
- the reader's raw output: the printed files and the answers;
- the model that served the run, the window, the tokens held at the end of the work, and the tokens and cost the run used.

## 8. Scores for a run

1. **Coverage.** *Read whole*: no three lines in a row of any reading-set file are missing from what the reader's calls returned. *Searched*: not read whole, and the reader ran a search on a reading-set file. *Read in part*: not read whole, with no search. For every run not read whole the record of what came just before the first skip is noted: a refused read, a cut read, or nothing.
2. **Rules kept.** Each of the three placed rules is kept in the files written, and the changed rule is followed in its later form with the old name absent. Scored by script, each rule apart.
3. **Work correct.** The script the reader wrote passes the hidden cases for its specification, and a handover note exists.
4. **Count answered.** The number of entries and the total are both right.
5. **Facts** (second score). The number of fact questions right, by place in the text.

**A run passes** when it is read whole, all four rules are kept, the work is correct, and the count is answered. Facts do not enter.

**A run is set aside**, and run again once, when: the starting text received differs from the one intended; the record shows the reader opened a file outside its reading set and its own output folder; the reader used a tool after the second message other than the one stated command (then only its count and fact answers are set aside); or the session failed for a reason of the harness (an error, a refused start, the allowance). Every run set aside is listed with its reason.

## 9. Pass rule for a text and for a size

- **A text passes** when every run of it passes.
- **A size passes** when no run at it was read in part or searched, and at most one text in ten fails. With thirty texts: at most three.
- **A size fails** otherwise. The results say how: by skipping, by a rule not kept after a whole reading, by wrong work, or by the count.
- **The smallest size is the control.** If it fails, the tasks are at fault. That is reported and no figure is drawn from that ladder until it is understood. The pass rules are not changed.
- These rules are fixed here and are not changed after results are seen.

## 10. The steps

For each ladder:

1. **Rising steps.** Sizes double. Ten texts at each. Go up until a size fails or the ladder's top is reached.
2. **Fine steps.** Two sizes between the last that passed and the first that failed, ten texts each.
3. **Confirming runs.** The largest size that passed is the size put forward. Twenty more texts there and twenty more at the next size up that was run, so thirty at each.

Repeats: in the main arm each text is run twice, in two separate sessions. In the other arms each text is run once. Variation between texts and variation between repeats of one text are reported apart.

## 11. Soundness of the tasks, checked before the runs

1. The placed passages and their keys are made by script. The script checks that each placed value occurs once in the text, that the count's family word does not occur in the text, and that no accepted answer occurs in the starting text or the questions.
2. Fact questions are written by one worker and checked by a second that did not write them. The second is given the text and the questions and reports for each: one home for the fact; not guessable without the text; not findable by a single search for a word of the question. A question that fails is replaced and checked again.
3. Each trial is run once with its text handed over in small parts, so that a whole reading is certain. It must pass. If it does not, the trial's tasks are repaired or the trial is replaced, before any measuring run of it.
4. Each trial is run once with no text. It must keep no placed rule, miss the count, and score no more than one fact. If it does better, the trial is repaired or replaced.
5. These two runs are made by workers on Fable 5.2 and are not counted in any result.

## 12. Keys out of reach

- The readers' branch holds only what a reader sees: the texts. This protocol, the results and the raw records are on another branch of `process3-probes`. Keys, placed values, hidden cases and all scoring code are in `neobobkrause/process3`, which no reader's session has. This split of the test ground into two branches is my decision; Bob's words were "Work on a branch of your own."
- Every record is checked by script for a call on any path outside the reader's reading set and its own output folder. Such a run is set aside.

## 13. The counts and what they allow

- The unit is the text, not the run. A text that fails in either repeat is a failed text.
- For a size with n texts of which k failed, the results give the largest true failure rate the count leaves room for, at 95 percent, by the exact binomial bound. With none failed in n it is 1 − 0.05^(1/n): 26 percent for n = 10, 14 percent for n = 20, 9.5 percent for n = 30. With one failed in 30 it is 15 percent.
- That arithmetic is used only where the texts at a size are different documents or different parts. Where they share material, the results say so and give the counts without the bound.

## 14. Tokens and bytes

Every size is given in bytes and in tokens. Tokens are counted two ways and both are reported: as the read tool counts a file, and as the growth of the session's own tokens over the reading. Bytes to a token are given for each kind of text.

## 15. The four ladders

### 15.1 A single text

- Reading set: one file.
- Steps: 12,000, 24,000, 48,000, 96,000, 192,000, 384,000 and 768,000 bytes. The top is 768,000 because the corpus cannot give ten different texts beyond it.
- In the small-window arm the ladder stops at the first size the window cannot hold.
- The figure: the largest size that passed, with every smaller size passing, after the confirming runs. Beside it, the first size that failed and how.

### 15.2 A set

- Total size is crossed with the number of files. Totals: 96,000, 192,000, 384,000 and 768,000 bytes. Each total is run in two shapes: as files of about 48,000 bytes (2, 4, 8 and 16 files) and as files of about 12,000 bytes (8, 16, 32 and 64 files). So the same total is met as a few large files and as many small ones.
- Ten sets in each of the eight cells. Fine steps and confirming runs are made in the shape that failed first; if both failed at one total, in both.
- The figure: the largest total that passed in both shapes, and for each shape its own largest. If the two shapes differ, the results say whether size or number of files brought the failure.

### 15.3 A role's starting text

- The starting text is the whole first message. It is real text of the kind that tells a role how to work, with the placed rules at its start, middle and end and the changed rule, and the task as its last lines. There is no reading set.
- Steps: 4,096, 8,192, 16,384, 32,768 and 65,536 bytes; 131,072 if none fails and the harness accepts a first message that long.
- Coverage does not apply: the text is in the session from its first turn. A run passes when the four rules are kept and the work is correct. The count and facts are asked as a second score.
- Ten texts at each size. The figure: the largest size that passed, and for each size which place's rule was not kept.

### 15.4 The fill level

- Levels: 20, 30, 40, 50 and 60 percent of the window, as the session's own figure for tokens held reports it. No run goes past 60 percent. None reaches compaction.
- Ten sessions at each level, each its own trial: a starting text of 4,096 bytes with placed rules, and a reading set of one 24,000-byte text with placed rules. Then filling work that is real: reading files of the tool's code and of design text one at a time and writing a two-line account of each to a file, sized to bring the session to its level. Then, in a second message, the work and the handover. Then the printed files and the questions.
- Each session is filled to one level only, so no level's result leans on an earlier probe of the same session.
- A run passes as in section 8, with coverage taken on the reading set alone.
- **What is drawn.** For each level: runs passed of ten, and which score failed. The level put forward is the highest level at which that level and every level below it had at most one failing run in ten. Beside it, the comparison of each level with the 20 percent level by Fisher's exact test. With ten at a level only a large fall can show: none failing at 20 percent against five failing at a higher level gives about 0.03; against three failing, about 0.2. That limit is stated with the result.
- In the small-window arm a fresh session is already at about 41 percent, so the levels there are 50 and 60 percent only, and the result says what that means for a 40 percent rule in a small window.

## 16. Which ladders run in which arm

| Arm | Single text | Set | Starting text | Fill level |
|---|---|---|---|---|
| Main | full, two repeats | full, two repeats | full, two repeats | ten at each level |
| Small window | rising steps | rising steps | rising steps | 50 and 60 percent, five each |
| Opus, Sonnet, Haiku | rising steps | rising steps | rising steps | four at each level |
| Worker | rising steps | rising steps | not run: a worker has no starting text of a role | not run |

"Rising steps" means ten texts at each size, one run each, the same texts as the main arm, with no fine steps or confirming runs. A figure from such an arm is the largest rising step that passed, with ten texts behind it, and is labelled so.

**Codex.** One folder is prepared with the same texts, starting texts, questions and steps, and one page of steps, for Bob's Codex session to run unchanged. Its keys are kept apart from the readers' files there too. Nothing here is a Codex result.

## 17. Cost, the allowance, and the order of work

**Estimate, made before the runs.** These are my estimates from the five machinery sessions (a Fable session that read 94,000 bytes and wrote a summary used about 400,000 tokens, nearly all of them re-reads of its own context, priced at $0.78 at list price).

| Part | Runs | Tokens (millions) | List price |
|---|---|---|---|
| Main arm: single text | about 300 | 350 | $550 |
| Main arm: sets | about 280 | 600 | $900 |
| Main arm: starting text | about 150 | 60 | $90 |
| Main arm: fill level | 50 | 500 | $650 |
| Small-window arm | about 190 | 150 | $250 |
| Opus, Sonnet and Haiku arms | about 630 | 900 | $750 |
| Worker arm | about 140 | 200 | $300 |
| Checks before the runs (section 11), question writing | about 1,100 | 500 | $700 |
| This session, its successors and the workers that start and collect runs | | 300 | $400 |
| **All** | **about 2,800** | **about 3,500** | **about $4,600** |

Bob's subscription is not billed by list price. What these runs take from the week's allowance is not known until some have run. So:

- **Calibration first.** The first batch is the smallest rising steps of the main arm. From it I read how much of the week's allowance a dollar at list price takes.
- **The rule kept throughout.** Before each batch the week's use is read from a session's record. No batch starts that the estimate says would take the week's use past the ceiling. Until Bob sets a ceiling it is 50 percent of the week, which leaves half the week for his other work.
- **If the whole protocol does not fit under the ceiling**, it is put to Bob before going further, with what each choice gives and costs. Until he answers, work goes on in this order, which is the order of what the design most needs: the main arm's single text, set and starting text; the fill level; the small-window arm; the worker arm; the other models.

**Order of work.** Build the texts and keys. Check them (section 11). Calibrate. Run the ladders in the order above. Score from the records. Write the results. Every departure from this protocol is written, with its reason, in `DEPARTURES.md` beside this file, at the time it is made.
