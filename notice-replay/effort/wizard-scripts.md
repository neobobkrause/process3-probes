# Effort log: wizard-scripts

## First comments (state before wizard-scripts:98)

Started 2026-11-15T15:21:03Z.

Ended 2026-11-15T15:38:10Z.

Read the whole module first: index.mjs (1,767 lines, one class of 27 public methods and 10 public fields), the pure helpers (start, writing-help, data, checks, schema) and the generator. Users mostly import constants (`SCREEN_REGISTRY`, `WIZARD_SCRIPTS_CHECKS`, `DECLARED_OPS`, `CIVICSMITH_LIBRARY`), `checkDraft`, and the handle's `registeredScreens`, `wizardsAt`, `writingHelpRefused`, `brokenScripts`, `submittedFor`, `tallyRefusal`, `writingHelp`.

What took the time: writing about 60 kinds for the answers (every method answers a success shape or a refusal, built inline), then running the check and telling my own mistakes from the tests' habits. The check was the real verifier: it found every place the code's inferred kinds differ from what I wrote (a literal widened to string in a callback, an id the reader thinks may be null, record-core's and membership's refusals read with `ok: boolean`).

What was hard: (1) the three generated data files cannot carry comments, because a test holds them byte-equal to the generator; typing `deepFreeze` generically gave kinds that are the data's literal shapes and would change with every content change, so I left them 'anything' and stated their shapes as separate kinds. (2) The constructor's `= {}` default makes its required deps look optional to the reader. (3) Typing a private `isObj` as a type guard was needed so the stated kinds agree with code that narrows through it. (4) The 12 SQL tables: I wrote @storedrows kinds from the schema, but the tool cannot see SQL writes.

Check: 1,060 refusals before, 932 after; comments only: yes. 31 new test refusals, none from a wrong kind (24 are tests reading a field of a success-or-refusal union without narrowing). Listing: 192 'anything' before, 109 after (95 are private #members, 8 the generated constants).

(Correction: of the 932, 53 are the expected refusals of bounds that have no test named for them; 879 otherwise.)

## Update wizard-scripts:98

Started 2026-11-15T15:38:24Z.

Ended 2026-11-15T15:39:28Z. A data-only change: the screen registry re-taken at a newer design commit (generated file and the generator's pin). Carry merged cleanly; no comment needed to change, because the generated constants carry no stated kind. Check 1,066 real, 940 commented; comments only: yes.

## Update wizard-scripts:163

Started 2026-11-15T15:39:38Z. (Carry from 98 after to 163 before was mechanical: nothing merged.)

Ended 2026-11-15T15:40:40Z. data.mjs gained a table of retired ops and a helper reading an op as its replacement, used only by the generator; the generated registry and library now name the new ops. Nothing public changed kind; no comment changed. I noticed ADMIN_ACTS still names three retired ops, against the words of its bound, but the code did not touch it. Check 1,070 real, 944 commented.

## Update wizard-scripts:253

Started 2026-11-15T15:40:48Z. (Carry from 163 after to 253 before was mechanical: nothing merged.)

Ended 2026-11-15T15:42:01Z. Five op names left ADMIN_ACTS (retired or not in the op table). One merge conflict: the real change rewrote the prose comment just above my JSDoc block; kept both. The set's stated kind (a set of op names, with a bound naming the list kept elsewhere) does not change, so the expected answer is no listing change, though two users read this list and behave differently. Check 1,071 real, 945 commented.

## Update wizard-scripts:255

Started 2026-11-15T15:42:08Z. (Carry from 253 after to 255 before was mechanical: nothing merged.)

Ended 2026-11-15T15:43:07Z. The correction of 253: two of the five names come back to ADMIN_ACTS, and the prose now defines the list as ops the assembled registration declares. Same conflict as 253 (prose above my JSDoc), same resolution. The question that took a moment: did my bound's words have to follow the prose? No: they named the whole member op table from the start, which is what the code now says. Check 1,071 real, 945 commented.

## Gap before wizard-scripts:546

Ended 2026-11-15T15:44:17Z. Between 255's merge and 546's first parent only a test was added (46 lines): it confirms a notice from ai-runs (a Gate 1 record per entry) at this module's interface. No source changed, so no comment; I checked that the shape I state for ai-runs' `partAdmitted` (called with the part alone) still fits. Check 1,073 real, 947 commented.

## Update wizard-scripts:546

Started 2026-11-15T15:44:17Z.

