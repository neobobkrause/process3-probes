# How the tool learns what it gets wrong

Written by Claude (the proof session), 15 Nov 2026, in answer to Bob's question that day: "I see that you're adjusting the tool based on the conditions you're finding in the test source tree. I think that this portends that the civicsmith source tree will include conditions you've not yet seen in your test data. How do we design a system that can recognize false positives and negatives and update the tool accordingly?"

Nothing here is in force. It is a design; the parts marked "built here" exist in this folder and were run on the made-up product only.

## The problem

Every round of this proof found conditions the tool had not met before (a reader setting, a way of writing a request line, a store read as "anything", a function handed to `map`). The real product is about seventeen times larger and older. It will hold conditions none of these rounds met. So the tool cannot be trusted because it passed a set of examples; it must be checked, all the time, against something it does not control, and every mistake must become a permanent test of it.

## Four kinds of mistake, and the evidence for each

| Mistake | What it costs | The evidence the process already has |
| --- | --- | --- |
| A user that needed a change was not told (a hole) | A broken user ships | The user's own tests fail after the provider's merge, though the user was not told |
| A user was told for nothing | A job's time | The told user's job ends having changed nothing |
| The check refused honest code (a false refusal) | A job is stopped wrongly | The job disputes the refusal, with its reason |
| The check let a real disagreement through (a missed refusal) | A wrong comment or call ships | A later test failure or hole traced back to it |

## The loop

1. **A shadow run after every provider merge.** The tests of every module that declares the provider are run, told or not. This is cheap next to a job, and it is the independent ground truth: it does not depend on the tool. (Built here: `tool/audit.mjs`, below; the proof's own runner does the same for every change.)
2. **Each mistake becomes a case.** A case holds the provider's change (before and after), what the tool said (listing, notice, check), what happened (which tests failed, what each told job concluded), and a reading of why. This proof's change folders, expected answers, results and readings are exactly such cases.
3. **The corpus is the tool's test suite.** A new version of the tool must reproduce the recorded verdict of every past case, or change it on purpose, with the reason written down. A change of the method's rules (who is told, what counts as a change) needs Bob's word; a fix to how the tool reads code does not.
4. **The tool says what it does not understand.** Counters, per module and per merge: values of unknown kind read or called; names of operations or tables it cannot read; users it does not follow fully; complaints of the reader it does not recognise. An unrecognised complaint is never silently refused or silently ignored: it is reported as unknown. A rise in these counters on the real product is the early warning that it has met something new. (Built here: the counters in `tool/audit.mjs`; the reader's unrecognised complaints are listed separately.)
5. **Fail safe.** Whatever the tool cannot follow counts as using everything of that provider (rule 4 already). A case where the tool is unsure tells more, never less.
6. **Shadow before trust, on the real product.** The tool first runs beside the current rule (tell every declared user), deciding nothing, for a window of merges Bob sets. Its notices are compared with the shadow runs. Notices are decided by the tool only after a window with no hole. A full test run of every module stays as a nightly backstop afterwards; each hole it catches becomes a case.
7. **A first calibration on recorded history.** Before any of that, the study's 178 recorded changes of the real product are replayed through the tool against the 40 cases already judged broken. (Unproven: it needs the real modules' comments, which only one module has so far.)

## What this cannot do

- It finds a hole only when some test fails or someone notices. A user broken in a way no test checks stays hidden, as in planned change 5 (billing's invoice text). Bob's rule on tests (a test for every bound, and results confirmed under valid conditions) is what makes the tests a good enough witness.
- Each fix is made after a mistake has happened at least once in the shadow window or the backstop. The loop shortens how long a kind of mistake can recur; it does not prevent the first one.
