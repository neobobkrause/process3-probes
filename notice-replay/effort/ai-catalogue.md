# Effort log: ai-catalogue

## first comments (started 2026-11-15T15:21:03Z)

Read the five source files whole (1,465 lines; `validate.mjs` is the payload's schema and took most of the reading), the call sites in ai-accounts, ai-runs and ai-use, and the parts of `sshsig.mjs` and record-core the module leans on. Wrote the kinds in `index.mjs` (the payload field by field, the read answers, the stored rows of the four SQL tables), the refusal kinds in `checks.mjs`, and exact element kinds on the closed lists in `validate.mjs` and `lifecycle.mjs`.

The hard part was not the shapes but the module's own tests. My first draft used exact unions (`{ok: true, entries} | refusal`, catalogueState's short form, `'index' | 'payload'`); the tests read `r.code`, `r.entries`, `s.seq` without narrowing and pass wrong values on purpose, so the check drew 101 new refusals in the tests. I rewrote each answer that may be a refusal as one kind with `ok: boolean` and both outcomes' members optional, and widened the accepted kinds to what the code takes and refuses. That is true but says less about which members go together. I kept `| null` on `entryOf`, `profileOf` and `testedOf`, and the `| Open` unions, because they are true; that leaves 19 refusals in tests that read them without a guard (14 of them are "possibly null", code 2531, which the tool does not treat as "cannot tell" though it does for "possibly undefined").

Check: 85 refusals before, 179 after (100 of them bounds without a test, expected). Listing "anything": 81 before, 40 after; 38 of those are the class's private `#` members, which the tool lists as entries.

## update ai-catalogue:194

The change adds `seed.mjs` (the seed a release carries and which signing keys a build trusts), re-exports it from `index.mjs`, gives the constructor and `aiCatalogueOf` a `seed` option, and makes `start()` load the seed. The carry produced two conflicts, both on signatures my comments sit on; I resolved them by hand. I copied the new file in and commented it, and added the kinds `SeedStatement`, `ReleaseSeed` and `SeedAnswer` to `index.mjs`. `CatalogueEnv` gained the two variables the change reads. Two small false starts: `SEED_PAYLOAD`'s kind did not hold through `Object.freeze`, and typing `seedOf`'s document as a whole payload drew a refusal from the tests' loose payloads. The change that matters most (the seed is now loaded at boot, and development keys are filtered by the environment) is behaviour, and the listing shows it only as new optional members.

## update ai-catalogue:204

The change touched only `seed.mjs`'s header comment and added a test. The carry merged it without conflicts. No interface comment needed to change, so the expected answer is "no listing change".
