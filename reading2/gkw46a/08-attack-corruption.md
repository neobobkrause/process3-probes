# Attack on the Process4 definition, second draft: corruption and stall

14 Nov 2026. Read-only. Nothing in any repository was changed and no session was started.

Angle: that Process4 as defined goes the way of Process3 (sessions add checks, caution, records and stops), or stalls, or reports success while the product does not work.

Marks used for evidence, kept apart throughout:

- **[measured]** in Process3's record, with file and passage. "Measured by me today" means I read it from the read-only clones on 14 Nov.
- **[platform]** stated in a platform document, as quoted by another worker's paper (I did not re-read vendor pages).
- **[reasoning]** my reasoning only.

A simulation in finding 5 is [reasoning] run on [measured] inputs. Its script is `/tmp/claude-0/-home-user/53c12ae4-2f57-537f-a714-d9dd7c364da1/scratchpad/sim/sim.py`.

---

## Verdict first

**The definition would not run to its one output as written.** Three sentences, read as written, leave a tranche with no reachable end:

1. "A round that completes with no failures ends the tranche." Process3 never had such a round, the walk in Process3 carried 63 failures for three days while every step read "ok", and nothing in the definition bounds the number of rounds (finding 1).
2. "When every module that had work has merged, several sessions walk the product." A notified module is a module with work. Nine in ten notified modules have nothing to change, so nothing to merge, and "done means merged" (finding 5).
3. "A failure already on the tranche branch before the job began is named, and is not the job's to fix", beside "ARCH merges it ... once the tests pass". A module whose tests were broken by somebody else's merge can neither pass nor be fixed by its own job (finding 6).

Each has a wording repair. But the first has a second horn that no wording removes: the only sessions that can make a round end clean are the sessions that write the walk.

**On the Process3 loop.** Of the ten causes the forensic record ranks, the definition removes two (the citation rule and the tool's demand for a review). The other eight it forbids in their effect and leaves in place. The strongest of them, that every fault must be fixed and that a fix is built, is still Bob's requirement and still in the definition (finding 3, appendix B).

---

## Findings, worst first

### 1. The tranche can only end in two ways, and both are bad: it never ends, or the sessions that write the walk make it end

**Counter-argument.** No round in Process3 ever finished clean, so under this definition nothing would have reached the main branch, for ever, with every report showing progress. The only way out open to the sessions is to change the walk, which they write themselves, and in Process3 they did exactly that.

**Sentences attacked.**
- "A round that completes with no failures ends the tranche." (C; D test 3: "No failures ends the tranche.")
- "the main branch never moves while a tranche runs" (C)
- "Whether a separate list for a 'completion round' remains. *Decided:* none. Rounds simply repeat." (K, technical 11)
- "it also carries the walk result ...: steps passing out of steps in all, with any steps added or removed since the last round shown beside it ... These are reported, never enforced." (G)

**Evidence.**
- [measured] No clean walk of either kind in Process3; the main branch's last commit is 1 Nov 22:24Z and it was "Not touched during the week" (product_side §1, §9.2; k_evidence K5(b)). Process3 ran 14 layers or rounds; the last completion round still deferred 5 of 33 items (product_side §8).
- [measured by me today] The stored internal walk reports on the product's state branch:

  | Report | Steps | Steps "ok" | Failures listed | Notes of things not walked, not reached or not checked |
  | --- | --- | --- | --- | --- |
  | Internal, 5 Nov 15:38Z | 236 | 236 | 63 (all of kind "state") | 17 |
  | Internal, 8 Nov 07:20Z | 238 | 238 | 63 (the same kind) | 17 |
  | Internal, 8 Nov 23:50Z | 357 | 287 | 96 | 60 (51 by keyword) |
  | External, 8 Nov 07:20Z | 175 | 20 | 1,691 | 83 |
  | External, 8 Nov 23:50Z | 157 | 10 | 178 | 36 |

  So "no failures" already has three readings in the record: every step "ok" (true on 5 and 8 Nov), an empty failure list (never true), and nothing left unwalked (never true). The definition's own sentence in C uses the first reading for 8 Nov ("every one of its 238 steps passing (with 63 failures of a kind already known)"). A session choosing the reading chooses whether the tranche has ended.
- [measured by me today] The walk is ordinary product code in one module, `journey-check`, at place 218 of 220. From 1 to 9 Nov it took 35 non-merge commits. By their subjects, 9 of the 35 excuse, retire, allow or turn a step into a "todo": "a screen's absence state at its bare address is not failed on its tab title" (`763bd8856b`), "connect and teamai states retired; the rest the live arm's or known gaps" (`1e743f5d7d`), "R1 (a) excusing only the states the local copy cannot draw" (`0748ff4add`), "R17's rows scan is a todo owed to the ux lane's word pass (BOB's ruling, 7 Nov)" (`97f6a275af`). I read subjects, not diffs; some of these are surely right. The point is that they are the same act as a wrong one, made by the same job, with no reader.
- [measured] The step count moves both ways: internal 238 to 357 in one round; external 175 to 157 while it was failing (k_evidence K4(b)). The failure count rose from 63 to 96 on the internal walk "as it was given more to check" (product_side §9.2). A target that grows each round recedes.
- [measured] Red results with no cause in the code under test were common: 113 of 1,187 test runs red on 3 to 5 Nov, and "74% went green with no change to job code or tests" (k_evidence K1(i)(b), from the coordinator's check audit). That is about 7% of runs. Module suites were 21% failing on 7 to 8 Nov (product_side §6, CI time).
- [reasoning] A walk of several hundred steps with even a small false-failure rate per step almost never returns zero. A false failure "becomes work for a named module"; that module has nothing to fix; see finding 5 for what happens to a job with nothing to merge.
- [reasoning] The report line shows steps added or removed. It cannot show a step whose check was loosened, a state excused inside a step, or a journey moved to the notes. Those are the changes the record shows.

**How bad.** Stops a tranche (no output, unbounded), or silently corrupts the result and misleads Bob (a "clean" round that was made clean). Both at once is possible: weeks of rounds, then an ending reached by notes.

**Answer within the rule.**
- Wording: define "no failures" once, in the definition, as an empty failure list and no journey unwalked that an earlier round of the same tranche walked. This is a definition, not a new check; the walk already produces both lists.
- Structural: a tranche is small enough that its findings are few. The definition never says what sizes a tranche or who chooses its content. That is Bob's to say.
- Trial (one-off, before force): walk one unchanged build three times and count the steps that differ. Without that number nobody knows whether a clean round is reachable at all.
- Honest statement: there is no bound on rounds, and the only release from a tranche that will not converge is Bob's word to the coordinator. Say so in section E.
- **No answer found** for the second horn. The walk's steps are written, changed and counted by sessions, and any stop on that is a check. The wall of section K could hold the walk's files where only Bob merges them, at one click of his per change to the walk, and with the weakness of his click described in finding 4.

Sources: product_side §1, §5, §8, §9.2; k_evidence K4, K5; redteam_corruption 6; state branch `deploys/p3dev-l11/…/report.json`, `deploys/p3dev-l12/…/report.json`, `walks/internal/ef4ed6fa13-…/report.json`; product commits named above.

### 2. A product that does not work when deployed reaches the main branch by design

**Counter-argument.** On the one day Process3 could compare them, the internal walk had every step passing and the deployed product passed 20 steps of 175. Under this definition that build goes to the main branch, and the definition's one output is "correct, working product behaviour ... merged to the main branch".

**Sentences attacked.**
- "Its one output is correct, working product behaviour that meets its requirements, merged to the main branch quickly and cheaply, and still there later." (A)
- "It does not hold the tranche back. What it finds is the first work of the next tranche." (C)
- "There is no full regression; the internal walk replaces it." (D)
- "there is no separate install test or upgrade test before a release ... a walk starts from a fresh copy and cannot see an upgrade breaking a user's existing data." (D)
- "The main and tranche branches take changes only by pull request with the tests passing." (F)

**Evidence.**
- [measured] 8 Nov 07:20Z, same build: internal 238 of 238 steps ok; external 20 of 175, 1,691 failures. 8 Nov 23:50Z: internal 287 of 357; external 10 of 157 (table in finding 1). Why the second pair differs "is not established in the record" (k_evidence K5(b)).
- [measured] As Process3 was built at its end, "tranche close refuses, in order, without a clean internal walk, a release and a clean release walk" (change_sample PR 269), and Bob's words of 8 Nov end a tranche only "When the release walk is clean" (k_evidence K5(a), BD-R1). The definition reverses that order on the word "optional" in a session's record of 13 Nov.
- [measured] 218 of 220 jobs complete, 542 marks struck, 98.8% of merged lines still present, while the deployed product failed 147 of 157 steps (product_side §5, §9.2).
- [measured] Releases 0.59.0 to 0.63.0 each "BRICKED an existing store", unseen "because every suite builds a FRESH store" (header of `migrate-released.test.mjs`, quoted in k_evidence K1(ii)(b)). That test is now one module's own test and runs only when that module's own files change.
- [measured] The one known break between two modules in about 200 job merges (4 Nov) passed its own module's tests and showed only when "the first development deploy served 500s" (change_sample case 1).
- [reasoning] Nothing in the definition says what runs when the tranche branch itself merges into the main branch. Test one's trigger is "a job's pull request changes its module's files"; the tranche merge is not a job's pull request. Either nothing runs, and GitHub's rule "with the tests passing" is met by an empty check, or every changed module's tests run, which is the full regression Bob ended, and which Process3 found could never go green: "a tranche of 30+ modules would be cancelled and main could never merge" (change_sample PR 92).
- [reasoning] "The first work of the next tranche" assumes a next tranche. If Bob starts none, the findings sit against a main branch that carries the faults.

**How bad.** Silently corrupts the result; misleads Bob, because "merged to the main branch" is the definition's own word for done.

**Answer within the rule.**
- Wording: section A must stop saying that the main branch holds working behaviour. What it holds is behaviour that passed its own module's tests and an undeployed walk. "Proven" and "not proven" are Bob's own fixed distinction.
- Structural, and Bob's: his 8 Nov order (the tranche ends when the deployed walk is clean) held nothing back from the main branch that worked. Restoring it makes the external walk a test that gates, which his "three tests" decision forbids. The two decisions conflict and only he can pick. The definition picked for him and listed it under "Claude decided".
- Wording: say what runs at the tranche-to-main merge. If nothing, say nothing.
- Trial: section J item 11 as written tests one put-back fault. Add to it, as a one-off, both walks on one build, to measure the gap of 8 Nov again after the page checks were added.
- **No answer found** that keeps "three tests, ever" and also makes the main branch hold a product measured to work when deployed.

