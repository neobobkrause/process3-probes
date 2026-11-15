# Effort log: ai-use

## First comments (started 2026-11-15T15:21:02Z)

I read the brief, the proof's rules and its two example modules, then enough of the tool (listing.mjs, parts of check.mjs) to know what it reads. Then the module: index.mjs (1022 lines), checks.mjs (149), schema.mjs (139), and how its users call it (grep of ~20 user files).

ai-use is a class, `AiUse`, with ~20 public methods, each taking one options object whose every field defaults to null and answering either a result or a refusal object (never throwing). Most of the work went into stating those answers: about 30 named kinds (results, 8 refusal kinds, and one relayed-refusal kind for the refusals of membership and ai-accounts, which state no kinds), 8 row kinds for its SQL tables (`@storedrows`), an operation table for `aiUseOps` (`@optable`), and the declared ops.

What was hard:

- **Answers that are "a result or a refusal".** I first wrote each answer as a plain union. The check then refused about 100 places in the module's own tests, which read `r.code` or `r.limits` before telling which member they hold: TypeScript refuses a field that some union members lack. I added a helper kind, `OneOf<...>`, that gives each member the other members' fields as "missing". This cleared almost all of them. This problem will come up for every module written this way.
- **Inputs the code checks at run time.** Every field defaults to null and is checked by code, so TypeScript can't narrow it. A field echoed back in an answer (`use`, `scope`) therefore had to be stated `string | null` even though it is never null on success. I added four casts (comments and parentheses only) where a value is passed on.
- **Tests that pass wrong kinds on purpose** (`effort: 3`, `owner: 3`, `what: ["ok", 3]`) to show the code refuses without throwing. For those fields I wrote `*` and a bound line.
- **Residual refusals my true comments cause:** 18 in the tests. Most are `useCheck(...).word` read straight off an answer that may be null. The check counts TypeScript's 2531 ("Object is possibly 'null'") as a refusal, but it counts 18047 (the same thing on a named variable) as "cannot tell".

Counts: check 179 refusals before and 149 after. Of the 149, 35 are bound lines without a named test (expected), and 114 others are as described above. "anything" in the listing went from 99 to 72. About 40 of those 72 are the class's private `#members`, which the tool lists as entries; I did not type them.

## Update ai-use:105 (T53)

This "change" is a rewrite of the module: the index.mjs diff alone is 1733 lines. It added 17 public methods, 4 ops, 12 tables, about 20 constants, two refusal codes and a second words table. It also reshaped the answers of countUsage, aiUsage, aiUsageMine, actualOf, estimate, accountUseOverTime, limitsReached, useCheck and exploreAllowed. carry.mjs merged checks and schema cleanly but left 20 conflict hunks in index.mjs, because my comments sat beside nearly every method T53 touched. Instead of resolving hunk by hunk, I re-applied my comments to the real after file with the same edit list, adjusted to the new anchors. The result is the same, and it was faster.

Most of the time went into reading the diff and writing the ~60 new kinds: every new answer, the new refusals, the neutral usage record and label, and 12 row kinds. Each of the following needed one fix before the check stopped blaming my comments:

- small widening problems: arrows and spreads that turn `true` or `false` into `boolean`, and `{}` accumulators;
- the new rows of AI_USE_CHECKS carrying `word`;
- membership's notAnAdmin, now handed straight back, whose `ok` TypeScript reads as `boolean`. This forced me to correct RelayedRefusal everywhere. That correction is noise in the expected answer.

I wrote the expected answer from my before and after comments: 120 listed entry changes plus ~60 new kinds. I flagged one real break the method may see only weakly: exploreAllowed, exploreAsk and useCheck(explore) now read explore through `account_id`, and with none it is "no". That is a new optional parameter whose absence now refuses, so the kind says "accepts more" and only a bound line says otherwise.
