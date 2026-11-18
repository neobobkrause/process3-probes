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
