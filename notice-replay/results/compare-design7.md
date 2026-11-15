# Replay: the tool against the record, change by change

Written by `replay/compare.mjs` at 2026-11-15T16:41:07.900Z, from `results/notice-design7`. Measured, except "broken" and "adopted", which are the study session's judged reading of the record.

| Change | Record told | Listing changed | Tool told | of them for an entry | Tool for nothing | Broken (missed by tool) | Adopted (missed by tool) | Users whose tests newly fail | Broken caught by tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ai-runs:96 | 29 | yes | 29 | 22 | 18 | 11 | 0 | not run | - |
| ai-runs:213 | 29 | yes | 29 | 18 | 29 | 0 | 0 | not run | - |
| ai-runs:323 | 29 | yes | 29 | 18 | 29 | 0 | 0 | not run | - |
| ai-runs:348 | 29 | yes | 29 | 21 | 28 | 0 | 1 | not run | - |
| ai-runs:391 | 30 | yes | 30 | 19 | 29 | 0 | 1 | not run | - |
| ai-runs:485 | 30 | yes | 30 | 7 | 30 | 0 | 0 | not run | - |
| ai-runs:1004 | 23 | yes | 30 | 19 | 30 | 0 | 0 | not run | - |
| ai-runs:1073 | 18 | yes | 30 | 8 | 30 | 0 | 0 | not run | - |
| ai-accounts:124 | 26 | yes | 26 | 17 | 25 | 1 | 0 | not run | - |
| ai-accounts:188 | 26 | no | 21 | 4 | 21 | 0 | 0 | not run | - |
| ai-accounts:316 | 28 | no | 22 | 4 | 21 | 1 | 0 | not run | - |
| ai-accounts:483 | 30 | yes | 30 | 6 | 30 | 0 | 0 | not run | - |
| ai-accounts:1098 | 28 | yes | 30 | 20 | 30 | 0 | 0 | not run | - |
| op-declarations:95 | 21 | yes | 21 | 8 | 12 | 6 | 3 | not run | - |
| op-declarations:167 | 21 | yes | 21 | 8 | 21 | 0 | 0 | not run | - |
| op-declarations:289 | 21 | yes | 21 | 8 | 21 | 0 | 0 | not run | - |
| op-declarations:321 | 21 | yes | 21 | 8 | 21 | 0 | 0 | not run | - |
| ai-catalogue:194 | 9 | yes | 9 | 5 | 9 | 0 | 0 | not run | - |
| ai-catalogue:204 | 9 | no | 5 | 2 | 5 | 0 | 0 | not run | - |
| ai-catalogue:317 | 11 | yes | 11 | 6 | 11 | 0 | 0 | not run | - |
| ai-catalogue:336 | 11 | no | 7 | 2 | 7 | 0 | 0 | not run | - |
| ai-catalogue:484 | 12 | yes | 12 | 4 | 11 | 1 | 0 | not run | - |
| ai-catalogue:611 | 12 | yes | 12 | 4 | 12 | 0 | 0 | not run | - |
| ai-catalogue:1097 | 11 | yes | 12 | 5 | 12 | 0 | 0 | not run | - |
| ai-use:105 | 18 | yes | 18 | 10 | 12 | 1 | 5 | not run | - |
| ai-use:378 | 19 | error | - | - | - | 0 | 1 | not run | - |
| ai-use:613 | 19 | error | - | - | - | 0 | 0 | not run | - |
| wizard-scripts:98 | 19 | yes | 19 | 0 | 17 | 0 | 2 | not run | - |
| wizard-scripts:163 | 19 | error | - | - | - | 2 | 0 | not run | - |
| wizard-scripts:253 | 19 | yes | 19 | 0 | 19 | 0 | 0 | not run | - |
| wizard-scripts:255 | 19 | yes | 19 | 0 | 19 | 0 | 0 | not run | - |
| wizard-scripts:546 | 19 | yes | 19 | 0 | 19 | 0 | 0 | not run | - |

## Totals

```
{
 "changes": 32,
 "replayed": 29,
 "recordTold": 665,
 "recordForNothing": 629,
 "broken": 23,
 "adopted": 13,
 "listingUnchanged": 4,
 "toolTold": 611,
 "toolForNothing": 578,
 "toolBrokenMissed": 0,
 "toolAdoptedMissed": 0,
 "narrowTold": 611,
 "narrowForNothing": 578,
 "narrowBrokenMissed": 0,
 "narrowAdoptedMissed": 0,
 "entryTold": 253,
 "entryForNothing": 226,
 "entryBrokenMissed": 4,
 "entryAdoptedMissed": 2,
 "testsChanges": 0,
 "testsUserRuns": 0,
 "testsUsersFailing": 0,
 "brokenCaughtByTests": 0,
 "brokenInChangesWithTests": 0
}
```
