# Effort log: make plan-work followable

Started 2026-11-15T15:25:52Z.

Goal: make one real user, plan-work (bio-plane/src/plan-work, 1,427 source lines, and 1,419 test lines), followable by the
notice tool at 2d52c515fa (the state before ai-runs:96): 0 places where it reads or calls a value of unknown kind.

## Where it started

Built with only ai-runs and plan-work listed (every other module lands in `_other` as plain uncommented JS).
`follow.mjs`: **1,840 unknown-kind reads** (src/index.mjs 639, schema 2, checks 1, tests 1,198). Entries of ai-runs it
said plan-work uses: `aiRunsOf`, `AiRuns##accountFor`, `AiRuns#openMany`. Only `aiRunsOf` is real; the other two are
phantoms (lines such as `m.key`, `o.p.id`, `run.run`, `place.target`, which have nothing to do with ai-runs), and the one
real call into ai-runs, `ai.open(...)`, was not seen at all because `ai` was "anything".

## What I did, in order

1. Read all of src/index.mjs once (1,254 lines). Every unknown read in the source roots in four places: the untyped
   `deps` of the constructor (so every provider and everything it answers), the SQL rows, the destructured arguments of
   each public method, and module-level helpers' parameters.
2. Probed whether the providers' own kinds could be imported: no. Their factories (`actionPlansOf`, `actionsOf`, ...)
   read as "anything" even through the reader's inference from their JS. So every shape plan-work relies on had to be
   written in plan-work, from plan-work's own reads, without reading the providers: Plan, PlanOption, PlanScenario,
   PlanPhase, Mark, Action, Correspondence, ClockEntry, Escalation(Read), CuresAnswer, CureLink, Draft, Duty(Answer),
   Transition, and one `...Api` typedef per provider (10), plus a PwRow kind for plan-work's own tables.
3. Casts at each `#maybe(...)` (a provider that may be absent), `@param` on every method and helper, a type-predicate
   comment on `ok` (`r is Exclude<T, Refusal | null | undefined>`), `@returns` on the private builders. Source went
   from 642 to 0 in about 10 minutes of clock after the reading.
4. aiRuns: first a typedef of plan-work's own (`{open: ...}`); then replaced by `Pick<AiRuns, "open">` through
   `@import`, so that the tool sees the call as a use of `AiRuns#open`. With plan-work's own typedef the tool would
   never have tied the call to ai-runs: a user that writes its own shape for a provider's object hides its use of that
   provider from the notice.
5. Tests (1,196 left at that point). Two causes covered almost all of them:
   - `w`, the test world, comes from action-plans' test fixture (`seeded`), which states no kind. I read that fixture
     (lines 71-354) and wrote a `World` typedef in plan-work's fixture.mjs (~75 lines) with the part plan-work's tests
     read, and cast `seeded(opts)` to it. This alone: 1,196 -> 324.
   - plan-work's own answers. The reader infers each public method's answer as a union of a refusal and the answer
     with `ok` widened to `boolean`, so a test's `assert.equal(r.ok, true)` cannot narrow it, and every field read is
     an error the reader treats as "anything". Fix: write plan-work's own interface, `@returns {Refusal | X}` with
     `ok: true` on every public method (26 kinds, ~180 lines; what plan-work's own first comments as a provider would
     hold anyway). Then `@param {World}` on each test helper (`set`, `stateOf`, `add`, `rhythm`, ...): 324 -> 240.
   - Reads of an answer that the test never narrows (`w.pw.matters(...).matters.find(...)`, `const l = w.pw.prepItems(...)`
     then `l.items`): a cast to the answer kind at each site (about 30 casts). Also a typedef for conformance's test
     scene (another module's test world, imported dynamically in matters.test).
   - Calls by a name held in a variable (`w.pw[name](...)`, `planWorkOps(...)[op]()`): a `ByName` record cast in
     invariants.test, and `keyof PlanWorkOpMap` (planWorkOps given `@returns {PlanWorkOpMap}`, one arm per op).
   - membership's `MEMBERSHIP_CHECKS` (anything): a cast at each of its two reads.
   324 -> 240 -> 153 -> 107 -> 61 -> 28 -> **0**.

## What took the time

- Reading the module (about 1,250 source lines) and the fixture of the module whose test world plan-work's tests use
  (action-plans, 284 lines). Reading was the larger part.
- Writing the shapes of what ten providers answer, from the user's side only. Each is a guess bounded by plan-work's
  own reads: where plan-work guards with `typeof`, I wrote the kind it guards for; a field it only hands on is
  `unknown`.
- Discovering that the tests need plan-work's own interface written out before any test read can be followed.
- Wall clock: start 15:25:52Z, 0 reached 15:45:02Z, verification and logs to about 15:50Z. The clock in this container
  advanced far less than the work suggests (I had expected well over an hour); I record it as measured.

## Kinds I could not determine (written as what plan-work relies on, not as what the provider states)

- Every provider answer (plan, action, escalations, cures, drafts, duties, transitions, holds, arising links, guides):
  no provider states a kind and their factories read as anything. Fields plan-work hands on whole are `unknown`
  (a cure link's other fields, a hold's project rows beyond what tests read, `premise_override.ground`, `undetermined`).
- `normSubject`'s subject: only `kind`, `determination`, `standard` are read.
- `membership`, handed through `deps`: plan-work never reads it, so `unknown`.
- `parseFrontmatter(...).data`: cast to `{correspondence?: {outcome?: unknown}[]}`.
- action-plans' and conformance's test worlds (`seeded`, `scene`), ai-runs' stand-in's call arguments, the
  answers of other modules' acts in tests (`ForeignAnswer`: ok, code and the ids the tests read).
- `MEMBERSHIP_CHECKS`: `Record<string, {check: string}>` at the read.

## False starts

- A batch edit wrote a new statement (`const marks2 = [];`) instead of a comment on the existing `const marks = [];`;
  caught on reading the result, removed before any build or check.
- `{r: unknown}` as the refusal side of the private builders' answers did not let `if (x.r) return` narrow; changed to
  `{r: object}`.
- A cast inserted with a closing parenthesis but no opening one (stands.test line 78) and a missing closing one
  (line 110); caught by `node --check` before the build.
- About 5 minutes probing why the tool reports `AiRuns##accountFor` and `AiRuns#openMany` as used by plan-work at lines
  that have nothing to do with ai-runs; not resolved (a single-file program finds no such symbol; it appears only in
  the whole program).

## Verification

- `check S-c plan-work --comments-only-against S-real`: **comments only: yes, running code unchanged**.
- The check's refusals on plan-work: 589 uncommented, 309 with my comments, 300 with the ai-runs helper's comments too.
  Of the 309: 129 in source (the reader's disagreements with my kinds: strict-null, `unknown` read without a guard,
  answers inferred wider than written), 126 in tests (reads on an answer union the test never narrows, e.g. `r.rhythm`
  on `Refusal | Reviews`; these were "anything" before and are now refusals), **28 refusals of my own casts in tests**
  ("a cast makes a value of another kind pass as X": the casts from `Refusal | X` to `X` that made the reads followable),
  and 23 "code disagrees with the stated interface of ai-runs" (ai-runs uncommented: its `open`'s JS defaults `= null`
  read as parameters of kind null; 14 left with the ai-runs helper's comments).
- So the followable state is one the check refuses: following a test that reads an answer without narrowing it needs a
  cast, and the check refuses a cast that narrows. Without changing the tests' code (not allowed here), there is no
  comments-only state that is both followable and accepted by the check.

## With the ai-runs helper's comments (notice-replay/commented/ai-runs/96-before/)

- Provider comments alone (plan-work uncommented): 1,840, unchanged. They save plan-work nothing.
- Both: 0. Entries of ai-runs plan-work uses: aiRunsOf, AiRuns, AiRuns#open, OpenRequest, OpenAnswer, RunsCtx, plus
  the phantom AiRuns#openMany (line 1516, `place.target ?? place.project`).
