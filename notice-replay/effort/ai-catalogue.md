# Effort log: ai-catalogue

## first comments (started 2026-11-15T15:21:03Z)

Read the five source files whole (1,465 lines; `validate.mjs` is the payload's schema and took most of the reading), the call sites in ai-accounts, ai-runs and ai-use, and the parts of `sshsig.mjs` and record-core the module leans on. Wrote the kinds in `index.mjs` (the payload field by field, the read answers, the stored rows of the four SQL tables), the refusal kinds in `checks.mjs`, and exact element kinds on the closed lists in `validate.mjs` and `lifecycle.mjs`.

The hard part was not the shapes but the module's own tests. My first draft used exact unions (`{ok: true, entries} | refusal`, catalogueState's short form, `'index' | 'payload'`); the tests read `r.code`, `r.entries`, `s.seq` without narrowing and pass wrong values on purpose, so the check drew 101 new refusals in the tests. I rewrote each answer that may be a refusal as one kind with `ok: boolean` and both outcomes' members optional, and widened the accepted kinds to what the code takes and refuses. That is true but says less about which members go together. I kept `| null` on `entryOf`, `profileOf` and `testedOf`, and the `| Open` unions, because they are true; that leaves 19 refusals in tests that read them without a guard (14 of them are "possibly null", code 2531, which the tool does not treat as "cannot tell" though it does for "possibly undefined").

Check: 85 refusals before, 179 after (100 of them bounds without a test, expected). Listing "anything": 81 before, 40 after; 38 of those are the class's private `#` members, which the tool lists as entries.

## update ai-catalogue:194

The change adds `seed.mjs` (the seed a release carries and which signing keys a build trusts), re-exports it from `index.mjs`, gives the constructor and `aiCatalogueOf` a `seed` option, and makes `start()` load the seed. The carry produced two conflicts, both on signatures my comments sit on; I resolved them by hand. I copied the new file in and commented it, and added the kinds `SeedStatement`, `ReleaseSeed` and `SeedAnswer` to `index.mjs`. `CatalogueEnv` gained the two variables the change reads. Two small false starts: `SEED_PAYLOAD`'s kind did not hold through `Object.freeze`, and typing `seedOf`'s document as a whole payload drew a refusal from the tests' loose payloads. The change that matters most (the seed is now loaded at boot, and development keys are filtered by the environment) is behaviour, and the listing shows it only as new optional members.

## update ai-catalogue:204

The change touched only `seed.mjs`'s header comment and added a test. The carry merged it without conflicts. No interface comment needed to change, so the expected answer is "no listing change".

## update ai-catalogue:317

The change adds `dev-key.mjs`, a command a development deploy runs to make its own catalogue key. It also adds `DEVELOPMENT_KEY_VAR` to `seed.mjs`, and `catalogueKeysFor` now takes no list (Bob's lines alone) and, in a development build, adds the deployment's own key line. The interface change is small: one new constant, one new optional environment member, and a wider `catalogueKeysFor`. Most of the time went to `dev-key.mjs`. It is not an interface file, but it reads `process.argv` and `process.env`, and the method's rule 34 refuses that without published start kinds. I wrote `DevKeyArgv` and `DevKeyEnv` and cast the eight reads. There was one conflict in `seed.mjs` (my `@import` beside the change's new import, and the function comment the change rewrote), which I resolved by hand.

## update ai-catalogue:336

Only `dev-key.mjs` changed: the command now looks the Worker up before making a key, in a dry run too, so it needs the token there as well. It also prints a guard line. I changed one bound line on the start kind (`DevKeyEnv`). The file is not an interface file, so the expected answer is "no listing change". This took a couple of minutes.

## update ai-catalogue:484

The change adds a development seed (a made-up provider, plan and entry) and `seedFor(env)`, and makes the constructor's default seed depend on the environment. I commented the new exports. My cast giving the development payload the payload kind was refused (rule 14): the payload is built by helpers whose answers the reader widens. Typing eight helpers just for a development constant was not worth it, so its kind stays the reader's guess. The constructor's kind did not change, only its default, so the expected answer is five new entries and a note on the behaviour change.

## update ai-catalogue:611

The change adds `DEVELOPMENT_ADAPTERS`, which the catalogue registers itself when a development seed verifies at start. There was one conflict, where the new constant sits just above my comment on `DEVELOPMENT_SEED`. I gave the constant its kind, with one cast on the reducer's empty accumulator. The expected answer is one new entry, plus a note on the behaviour.

## update ai-catalogue:1097

This was the largest change after the first step. It adds the screens' two reads (`catalogueRead`, `resultsRead`), an operations map (`aiCatalogueOps`) with its declarations, and a private `#listingOf`. It also moves `CATALOGUE_ADDRESS` to `/ai/index.json`. There were two conflicts, both where the change inserted code next to my comments. I wrote eight new kinds, including an `@optable` for the two operations, and gave the two methods and the map their kinds. It took three rounds of the check. One round was a slip: TypeScript drops a typedef's members after a `@bound` line placed among them. The other was two answers the reader can see as null. The address change is the one I expect the tool not to see: it is a lone string constant, and it changes the contract with ai-issuer. The single-object answer kind I chose at the first step (url optional) cost 3 refusals in a new test that reads `pullRequest(...).url` directly.
