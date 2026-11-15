# Effort log: ai-runs

## First comments (before ai-runs:96)

Started 2026-11-15T15:21:02Z.

Read the whole module first: 3,651 lines of index.mjs and the 161-line schema. The interface is one class, `AiRuns`, with about 45 public members, three functions (`aiRunsOf`, `aiRunsOps`, `hiddenRuns`) and three constants. Almost every answer is an ad-hoc object built from SQL rows, so TypeScript sees the rows as `any` and cannot check most of what I state against the code; where it could (run-rules' answers are inferred), it did.

Wrote about 75 kinds: requests and answers of each method, the operation table (`AiRunOps`, `@optable`, eight ops), the rows of the seven tables (`@storedrows`), and the kinds the class's registrations take. Kinds of other modules (steps, ai-use, ai-accounts, bias, observation-log, membership's refusal) are `*`: none of them states a kind.

What took the time was not writing but making the check agree. Three false starts: exact unions for the answers (the tests read `r.code` without narrowing, about 150 new refusals, so each answer became one kind with optional members); `@bound` lines between `@property` lines (TypeScript ends the typedef there and drops the later members, silently); and a `@param` written into a `/* */` comment. Then a round of literal kinds widened because the code builds them in un-annotated locals, and four private helpers that needed `@param` because typing the public parameters made them infer `null`.

Check: 327 refused before, 387 after (44 of them the expected bound-test refusals). 75 old refusals went away; 61 new ones are tests reading a nullable answer without a null check, and about 27 are tests that deliberately pass a wrong kind to prove a refusal. Comments only: yes. Listing: 159 lines with "anything" before, 202 after; the rest are private `#` members (which the listing lists as entries although no user can reach them) and the `*` I wrote for other modules' kinds.

## Update ai-runs:96 (PR 96, T53)

The biggest change of the series: a 1,763-line diff to the source (1,007 insertions). The paying principal is renamed from `claude` to `ai` in the open's arguments, the stored row, `runFor` and `read`; usage entries are relabelled (`entry_id` and a full `label`); runs now work in segments with hops, holds and eight new member operations (`aicontinue`, `aistop`, ...), a health probe, a "how this run went" read, two new tables, Gate 1 verdicts per entry. The carry gave five conflicts, all where my JSDoc sat next to a changed line; each took seconds.

What took the time was reading the diff and writing about 20 new kinds (labels, stops, segments, holds, hops, parts, the probe) and about 30 JSDoc blocks for the new members. One correction after the check: a hold's payer change can be null. The check has no new refusal from the source beyond old ones whose text changed.

The expected answer is long (126 lines over about 90 entries). The rename of `principalClaude` is a real break for callers, but in kinds it only adds members and widens the old ones to `*`; only the bound lines say it, so I expect "bound changed" there, not "cannot stand in".

## Gap before 213

Mechanical: the source did not change between 96's after and 213's before.

## Update ai-runs:213

A 34-line diff: the private `#useCheck` passes the account and entry a run is served on to ai-use. No interface change, no comment changed; the merge was clean. A few minutes, most of them the check.

## Gap before 323

Mechanical.

## Update ai-runs:323

A 72-line diff (F1): a new read op `aipathready` with its method and answer, a closed list of path reasons, and a fail-closed path rule. Writing the comments took a couple of minutes: one new kind, an op in the table, a declared op, two bound lines on what a registered source answers. One correction (a local closure widened `ok: true`). The real change in behaviour, that a path with no source behind it now reads not ready and every dispatch is withheld, has no kind and no bound to carry it; the comments cannot tell anyone.

## Gap before 348

Mechanical.

## Update ai-runs:348

A 50-line diff (F2): `open` takes `enabledBy`, the member accountable for an exploring run, and a refused open may carry `exploring`. Three comment lines: a member, a bound line and a refusal field. A few minutes.

## Gap before 391

Mechanical.

## Update ai-runs:391

A 107-line diff: Gate 1 records are now written here (`gateVerdictRecord`, `gateVerdictRecords`, table `ai_gate_records`). Two JSDoc blocks and one row kind; the record itself is ai-gate's and stays `*`. A few minutes.

## Gap before 485

Mechanical.

## Update ai-runs:485

A 37-line diff inside `openMany`: the batch's estimate names the entry it is served on, and is awaited. The estimate is ai-use's and written `*`, so no comment changed. A couple of minutes.

## Gap before 1004

Mechanical.

## Update ai-runs:1004

A 175-line diff (F4, F5): answer keys may mark passages (`ANSWER_MARKS`, `answerKeyMarks`), Gate 1 records may carry recall figures, group results count marked matters, and `aipathready` with no pair named becomes a cascade read. Two conflicts. One mattered: the new exports were inserted between `hiddenRuns`' JSDoc and the function, so the real file now has `hiddenRuns`' prose above `ANSWER_MARKS`. My `@param`/`@returns` for `hiddenRuns` were in that block; I kept the real layout and wrote a new block directly above `hiddenRuns`. Two corrections after the check (a private helper whose answer the public read hands back needed `@returns` and a closure `@type`; a refusal field a new test reads). About ten minutes.

## Gap before 1073

Mechanical.

## Update ai-runs:1073

A test-only change (the module's answer to membership's notice 1030). Nothing to comment; one check run.

## Overall

The first step was the work: about a quarter of an hour by the clock for a 3,800-line module, three quarters of it spent not on writing the comments but on making the check agree with them (unions the tests do not narrow, literals widened in locals, private helpers that infer `null` once their callers are typed, a `@bound` line that silently ends a typedef). After that, each change cost what its diff cost to read: the 1,763-line T53 change about ten minutes, the others two to ten. The check's count with my comments stays about 64 above the real code's at every state: about 66 tests reading nullable answers without a null check and about 35 tests passing deliberately wrong kinds, less about 110 old refusals the comments removed, plus the bound-test refusals (44 at first, 59 to 67 later) that this replay expects.

