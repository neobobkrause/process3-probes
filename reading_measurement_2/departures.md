# Departures from the protocol

Each entry: what changed from `protocol.md`, and why. The protocol itself is never edited after the first
run; every change lives here. No pass rule is changed after results are seen.

1. **Told/habit split collapsed into one arm.** The protocol (section 6) already describes one worker arm
   where every reader is given the reading set and a task that needs the whole text; the first round's
   separate "told" and "habit" arms are not reproduced. Reason: the deterministic task (marker rules,
   override, count) needs the whole text either way, and the record shows whether the reader read or
   searched, so the split added cost without adding signal.

2. **Uniform launcher; starting text delivered as a file read once.** Every reader is launched with a short
   instruction to open and follow `prompt.txt` in its own folder. For single-text and set readers that file
   points to the documents to read. For starting-text readers that file contains the whole rulebook and the
   task, so the rulebook is delivered as a file the reader is told to read once — one of the two ways the
   first round used, chosen here to keep this research session's own context small. Rule-keeping, not
   coverage, is the measure for the starting-text arm.

3. **Start-rule scored as a standalone line, not strictly the first line.** The start marker rule says the
   token must be the first line of the answer. Readers tend to add a sentence of preamble before their
   answer block. A run is scored as keeping the rule when the token appears as its own exact line anywhere
   in the answer; whether it was literally the first line is recorded separately ("token_first_line") and
   reported, not used for pass/fail. Reason: the rule is a probe of whether the start of the text was read
   and obeyed, not a test of output tidiness, and strict first-line scoring would fail readers who clearly
   read and obeyed.

4. **Two 175 KB sets are 162 KB (8 files) and 176 KB (24 files), not identical.** The blank-line trim that
   keeps each cut ending on a clean boundary removes relatively more from small cuts. The totals are within
   8 percent and the file count differs threefold, which is the contrast the comparison needs; actual bytes
   are reported for each.

5. **One forbidden word collided with the answer template.** The middle marker rule forbids one everyday
   word in the answer; the word is drawn at random. For the 24-file set (`set-175-many`) the draw was
   "allowance", which is also the mandatory label the answer template requires ("ALLOWANCE:"). The reader
   navigated the contradiction correctly (it reported the value without the word in its prose and said so),
   but the collision makes that one run's middle-rule score indeterminate. The run still read all 24 files
   whole and got the token, the override and the count right. The scorer neutralises the mandated label
   before the middle-rule check and flags the collision. The forbidden word also turned out to be a weak
   probe generally: for the other runs it was a word the reader had no need to use, so avoiding it was easy;
   the strong whole-text probes are the start token, the end count, and the early-value/later-override. This
   is reported as a limitation, not patched by re-running (the worker budget is spent on coverage).

6. **Override scored as "the in-force value is reported", not "the old value is absent".** Several readers
   correctly reported the later value and also named the earlier one ("88, replacing the earlier 43"). That
   is correct understanding, so a run keeps the override when the later value is reported; naming the old
   value too is not a miss. Recorded as `reported_x_only` when a reader gave only the old value.
