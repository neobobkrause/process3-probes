# Effort log: ai-runs

## First comments (before ai-runs:96)

Started 2026-11-15T15:21:02Z.

Read the whole module first: 3,651 lines of index.mjs and the 161-line schema. The interface is one class, `AiRuns`, with about 45 public members, three functions (`aiRunsOf`, `aiRunsOps`, `hiddenRuns`) and three constants. Almost every answer is an ad-hoc object built from SQL rows, so TypeScript sees the rows as `any` and cannot check most of what I state against the code; where it could (run-rules' answers are inferred), it did.

Wrote about 75 kinds: requests and answers of each method, the operation table (`AiRunOps`, `@optable`, eight ops), the rows of the seven tables (`@storedrows`), and the kinds the class's registrations take. Kinds of other modules (steps, ai-use, ai-accounts, bias, observation-log, membership's refusal) are `*`: none of them states a kind.

What took the time was not writing but making the check agree. Three false starts: exact unions for the answers (the tests read `r.code` without narrowing, about 150 new refusals, so each answer became one kind with optional members); `@bound` lines between `@property` lines (TypeScript ends the typedef there and drops the later members, silently); and a `@param` written into a `/* */` comment. Then a round of literal kinds widened because the code builds them in un-annotated locals, and four private helpers that needed `@param` because typing the public parameters made them infer `null`.

Check: 327 refused before, 387 after (44 of them the expected bound-test refusals). 75 old refusals went away; 61 new ones are tests reading a nullable answer without a null check, and about 27 are tests that deliberately pass a wrong kind to prove a refusal. Comments only: yes. Listing: 159 lines with "anything" before, 202 after; the rest are private `#` members (which the listing lists as entries although no user can reach them) and the `*` I wrote for other modules' kinds.

