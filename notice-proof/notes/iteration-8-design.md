# Iteration 8: TypeScript has the last word on the interface

Written by Claude (the proof session), 15 Nov 2026. **Described, not built and not run.** Bob decided on 15 Nov 2026 that this interface fix is the recommended next design and the tool to use going forward, and, in the study session, that the proof stops and is written up; so it was not built here. The design below is design 7's notice rules with rule 52 added.

## Why

In the last three blind rounds, the holes in the written interface itself (not in the side checks or in behaviour) came from one place: the tool's own comparison declaring a difference harmless and so keeping TypeScript's own comparison from being heard. A constructor that accepted more hid a static method's change (round 5, V01); an overload placed before an old one was taken for an added one (round 6, W06); a member changed inside a renamed kind was skipped (round 7, U10). The fourth design already made the tool silent only when TypeScript's printed declaration is unchanged; but "accepts more" was the tool's own judgement, and it overruled the printed declaration.

## The rule

| # | Rule |
| --- | --- |
| 52 | **"Accepts more" is TypeScript's word, not the tool's.** The one difference that tells nobody, a provider accepting more than before, is accepted only when TypeScript's own type checker, reading the old and the new interface in one program, confirms that the new entry can stand in wherever the old one was used: for a function or method, the new one is assignable to the old; for something a user hands in (a request of an operation, a kind on the accepting side), the old is assignable to the new. If TypeScript does not confirm it, or the tool cannot find the entry to ask about, the change counts as "cannot stand in" and the entry's users are told. |

Parameter order was made part of the interface in iteration 7 (rule 48), and a renamed kind's members are compared (rule 50).

## And a safety net beside it

| # | Rule |
| --- | --- |
| 53 | **After every provider change, the tests of every module that uses the provider, directly or through another module (following the declared lists), run before the change merges.** A failure stops the merge whether or not the failing module was told. On design 7, over all 150 changes of the proof, this would have caught all 40 users that needed a change or broke and were not told (measured: each had a test of its own that failed), at about 4.5 module test runs per change, against 3.2 for declared users only, on 11 modules. It runs only tests that exist; it adds none. |

## And a rule of practice

| # | Rule |
| --- | --- |
| 54 | **No regressions.** No version of the tool is accepted while any recorded change (the 150 of this proof, and every case the real product adds) is answered worse than before: a hole where there was none, a refusal of code that passed, or a notice for nothing that was not sent. A recorded answer changes only on purpose, with the reason written down, before the tool is accepted. Added after Bob's objection of 15 Nov 2026 that the regressions of designs 2 to 7 were avoidable: they were (see PROOF_RESULT.md, "Regressions"). |
