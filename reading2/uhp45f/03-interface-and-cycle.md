
ai-gate takes nothing from agent-runner or agent-drafts. agent-worker takes nothing from ai-gate.

## 2b. Why the loop exists

| Coupling | Essential or accident | Why |
| --- | --- | --- |
| agent-runner uses ai-gate | **Essential.** The position is the accident | The runner is ai-gate's container. The planning fold (`build/plan/beta/planning/FOLD-AI.md` §2.7, §2.9, decided 27 Oct) put it last in layer 6: "agent-runner moves after ai-gate (it is ai-gate's container); the agent-worker → agent-runner edge comes off". `layers.md` records that it was instead placed before agent-worker "so agent-worker's test fixture import stays downward until its job removes it". That test import is gone. The position was never corrected |
| ai-gate uses agent-worker | **Essential in substance, wider than it needs to be** | The gate must test a model against the same op table and the same read check production uses. To get two small pure functions it imports the file that holds the whole `/ask` handler |
| agent-worker uses agent-runner | **History** | It dates from when the runner held a member's Claude sign-in. T53 retired those routes from agent-runner. A coordinator ruling of 5 Nov bound the runner again. agent-worker's own file says both: its Private Uses reads "`agent-runner` is no longer reached", its R109 says the configuration "declares no `RUNNER` binding", and its F5 says "A runner is bound". In the map the use was restored on 6 Nov for a test import that no longer exists |
| agent-drafts and agent-worker use each other | **Accident of the size cap** | The split was made to shorten a requirement file. agent-drafts has one caller (agent-worker's router), no unmet requirement, and three test files of its own (257 lines) that drive the whole Worker. About 2,000 lines of tests that exercise `/draft` stayed in agent-worker's files (`t35`, `t37`, `t45`, `t46`, `t48`). The source comments in `draft.mjs` still use agent-worker's numbers (R59, R68) |

**File by file there is no loop.**

```
untested.mjs      (agent-drafts)   imports nothing of the four
ops.mjs           (agent-worker)   imports nothing of the four
ask.mjs, signin.mjs (agent-worker) import untested.mjs, ops.mjs
draft.mjs         (agent-drafts)   imports ask.mjs, signin.mjs, untested.mjs
index.mjs         (agent-worker)   imports draft.mjs, ask.mjs, signin.mjs
ai-gate run.mjs                    imports ops.mjs, ask.mjs
agent-runner run.mjs               imports ai-gate
```

The module boundary puts the bottom file and a middle file in agent-drafts, and the files between and above them in agent-worker. That is the whole loop.

**One stale route.** agent-worker's `/signin` relays to four routes of the runner. agent-runner's manifest lists `/version` and the `/run` routes, and "anything else" answers 404. So in the code at the tip, a member's sign-in step that reaches the runner meets the runner's 404 `UNKNOWN`. This is outside the ordering question, and it is the kind of break notification exists to catch.

## 2c. Refactoring options

All three options include the same first step.

**Step common to all: agent-runner after ai-gate.**

- Move agent-runner's row to directly after ai-gate in `build/modules.json`, and delete `agent-runner` from agent-worker's `uses`.
- Files: `build/modules.json`, the layer 6 paragraph of `build/layers.md`, and the generated `bio-plane/src/member-roster/order.mjs`. No source file, import or test.
- Other modules affected: none. Only agent-worker declared a use of agent-runner, and nothing imports it.
- What stays: the `RUNNER` binding in agent-worker's configuration. The map already treats a call over a binding as no use: agent-worker calls the plane, module 209, the same way.


Tally for Stane: 9 pliers.

### Option A. Put the map right (the simplest that works; recommended)

**In plain words:** undo the split. `POST /draft` is part of the agent Worker, so its three files belong to agent-worker again.

- **Moves:** `draft.mjs`, `action-drafts.mjs` and `untested.mjs` return to agent-worker's ownership. They do not move on disk.
- **Merged, split, renamed, reordered:** agent-drafts stops owning code. The order becomes agent-steps, agent-worker, ai-gate, agent-runner.
- **Its seven requirements** can be carried in either of two ways:
  - *A1.* agent-worker owns two requirement files, its own and `agent-drafts.md`. The module count falls to 219.
  - *A2.* agent-drafts stays in the map as a module that owns only its requirement file and its three tests, placed after agent-worker and using it. This is the form of the 18 other size splits ("the op-grades-folds pattern", the coordinator's standing rule of 5 Nov). agent-drafts was split one day before that rule and is the only one done the other way.
- **Files and import sites:** no source file, no import site. Edited: `build/modules.json`, `build/layers.md`, the generated `order.mjs`, and the Status lines of the two requirement files.
- **Other modules affected:** none.
- **Tests:** none move. agent-drafts' three tests already drive agent-worker's Worker.
- **Risk:** lowest. Under A2 one test of agent-worker (`requirements-ids.test.mjs`) reads `agent-drafts.md`, which would then belong to a later module; it pins the 4 Nov move and can be retired or handed to agent-drafts. The other thing to check is the id numbering under A1: agent-drafts' R1 to R7 would sit in the same module as agent-worker's R1 to R7, and 13 test titles name them. Either they keep a module prefix, as agent-worker's retired lines already write them (`agent-drafts:R1`), or they return to their old numbers (R59, R68, R69, R70, R76, R77, R86).

### Option B. Cut along the real seam

**In plain words:** make a small earlier module of the things all the others share, so that drafts, the Worker and the gate each use it and none uses a later one.

- **New module,** placed before agent-drafts. It holds what the agent may read and call: `ops.mjs` (the op tables), `untested.mjs` (the labels), and one new file that receives `readTool`, `admitRead` and `ASK_DECLARED` from `ask.mjs` and `doorTrace` with its two header names from `signin.mjs`. About 60 lines move.
- **Order:** the new module, agent-drafts, agent-worker, ai-gate, agent-runner. agent-drafts and ai-gate use the new module in place of agent-worker.
- **Files and import sites:** one new source file; six edited (`draft.mjs`, `ask.mjs`, `signin.mjs`, `transcribe.mjs`, `index.mjs`, `ai-gate/src/run.mjs`); about eight import sites in source and two in tests (`agent-worker/test/notice-answers-103.test.mjs`, `ai-gate/test/run.test.mjs`).
- **Requirements:** a new requirement file takes about seven of agent-worker's ids (R4, R37, R53, R55, R79, R87, R122; 6.1 KB). By the rule on permanent ids they are retired in agent-worker and renumbered, as on 4 Nov.
- **Other modules affected:** control-plane, plane and store-assembly, whose tests import `ops.mjs`, must declare the new module. 13 agent-worker test files import `ops.mjs`; their paths do not change.
- **Tests:** the tests of the read check and the op tables move from agent-worker's suite to the new module. agent-drafts' own three tests still drive the Worker, a later module. To end that, they and about 2,000 lines of draft tests in agent-worker's files must be rewritten to call `handleDraft` directly.
- **Risk:** medium to high. agent-worker's suite is 14,700 lines, takes over six minutes, and the job rules warn never to stop it midway. Word keys such as `agent-worker.ask.op_is_not_a_read` must be kept as written, or members' sentences change.
- **Gain beyond order:** ai-gate, and through it the runner's image, no longer depends on the Worker's `/ask` file. A change to agent-worker would stop notifying ai-gate, agent-runner, ai-issuer, op-grades, op-declarations and surface-declarations.

### Option C. Hand in what drafts needs

**In plain words:** `draft.mjs` stops importing from agent-worker. agent-worker's router passes it the four things it needs when it calls it.

- **Files and import sites:** two source files (`draft.mjs`, `index.mjs`), two import lines removed, four names added to the object the router already passes.
- **Other modules affected:** none. No module is created or moved, apart from agent-runner.
- **Tests:** agent-drafts' three tests still drive agent-worker.
- **Risk:** low in code. But the dependency does not go away. It becomes a coupling with no import, the same form as hypotheses and steps, which the map then had to declare anyway. It is the kind of coupling Part 1 shows makes change recognition unsound.

**Not recommended.**

### Recommendation

**Option A, with the common step.**

- The loop is a fact about the map. The code's imports already run one way, so there is nothing in the code to refactor to remove it.
- Both moves restore something already decided or already true: the 27 Oct placement of agent-runner, and the fact that `/draft` is one route of one Worker with one caller.
- It changes no source file, so it cannot change what the product does.
- It restores one job for the Worker's code. Today two jobs own files in one directory that import each other.

Between A1 and A2, A1 is the honest form under the owner's rule that a module is updated and tested by its own job: a module that owns only a requirement file has its requirements met by edits to another module's code. A2 needs no ruling and matches 18 existing modules. That choice is the owner's (section 2d).

Option B is a real improvement for a different reason, ai-gate's dependence on the whole Worker, and is worth doing when agent-worker is next worked on. Its file carries 41 unmet marks, so a job will come. A cheap first part of B needs no new module: move `readTool` and `admitRead` beside the op tables in `ops.mjs`, so that ai-gate imports one leaf file.

### hypotheses (96) uses steps (97)

hypotheses is handed a steps instance. It registers with it whether an id is one of a question's rival explanations, and asks it for the steps opened from a rival. steps declares no use of hypotheses, and neither uses anything placed between them.

| Option | In plain words | Changes | Risk |
| --- | --- | --- | --- |
| **H1. Swap the two** (simplest) | steps becomes 96, hypotheses 97 | `build/modules.json`, `build/layers.md`, the generated `order.mjs`. No source, no test | **One visible change.** Both modules register a check with the promotion gate. The gate runs the checks in the modules' order and returns the first refusal. A question whose basis rests on a hypothesis and also on a step is refused by both. Today the member reads the hypothesis reason; after the swap, the step reason |
| **H2. Turn the registration round** (recommended) | Keep the order. steps is handed hypotheses and asks it "is this a rival?" directly. hypotheses offers a registration that steps fills with "the steps opened from this rival" | Two source files (`hypotheses/index.mjs`, `steps/index.mjs`), about 25 lines each; steps R31 and hypotheses F1 reworded; one line of wiring in store-assembly; four test files (`hypotheses/rivals-f1`, `hypotheses/rivals-legs`, `steps/rivals`, `store-assembly/cr2-30-hypotheses-steps`). In the map hypotheses drops steps and steps gains hypotheses | Low. No behaviour changes. It follows the pattern steps already offers later modules (`registerArrivalSource`, "a later module registers") |

H2 is recommended because it changes nothing a member sees. H1 is acceptable if the owner accepts the one changed refusal.

## 2d. Does any option change what the product does, and what belongs to the owner

**Behaviour.**

| Option | Change for users |
| --- | --- |
| Common step (agent-runner after ai-gate) | None. agent-runner registers nothing in the plane, so its place in the compiled order moves no check or listener |
| A | None. No source changes |
| B | None intended. The runner's image and the Workers' bundles change in bytes, not in behaviour, provided word keys are kept |
| C | None |
| H1 | One corner case: which of two refusals a member reads first |
| H2 | None |

