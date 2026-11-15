# Replay: the tool against the record, change by change

Written by `replay/compare.mjs` at 2026-11-15T19:04:31.010Z, from `results/notice`. Measured, except "broken" and "adopted", which are the study session's judged reading of the record.

| Change | Record told | Listing changed | Tool told | of them for an entry | Tool for nothing | Broken (missed by tool) | Adopted (missed by tool) | Users whose tests newly fail | Broken caught by tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ai-runs:96 | 29 | yes | 29 | 22 | 18 | 11 | 0 | op-declarations, store-assembly, plane | 1 of 11 |
| ai-runs:213 | 29 | no | 0 | 0 | 0 | 0 | 0 | not run | - |
| ai-runs:323 | 29 | yes | 29 | 19 | 29 | 0 | 0 | not run | - |
| ai-runs:348 | 29 | yes | 29 | 10 | 28 | 0 | 1 | not run | - |
| ai-runs:391 | 30 | yes | 30 | 20 | 29 | 0 | 1 | not run | - |
| ai-runs:485 | 30 | no | 0 | 0 | 0 | 0 | 0 | not run | - |
| ai-runs:1004 | 23 | yes | 30 | 20 | 30 | 0 | 0 | not run | - |
| ai-runs:1073 | 18 | no | 0 | 0 | 0 | 0 | 0 | not run | - |
| ai-accounts:124 | 26 | yes | 26 | 8 | 25 | 1 | 0 | none | 0 of 1 |
| ai-accounts:188 | 26 | no | 0 | 0 | 0 | 0 | 0 | not run | - |
| ai-accounts:316 | 28 | no | 0 | 0 | 0 | 1 (store-assembly) | 0 | store-assembly | 1 of 1 |
| ai-accounts:483 | 30 | yes | 30 | 2 | 30 | 0 | 0 | not run | - |
| ai-accounts:1098 | 28 | yes | 30 | 5 | 30 | 0 | 0 | not run | - |
| op-declarations:95 | 21 | yes | 21 | 2 | 12 | 6 | 3 | admission, control-plane, interface-shell, screens-daily, screens-entry | 3 of 6 |
| op-declarations:167 | 21 | no | 0 | 0 | 0 | 0 | 0 | not run | - |
| op-declarations:289 | 21 | yes | 21 | 1 | 21 | 0 | 0 | not run | - |
| op-declarations:321 | 21 | no | 0 | 0 | 0 | 0 | 0 | not run | - |
| ai-catalogue:194 | 9 | yes | 9 | 3 | 9 | 0 | 0 | not run | - |
| ai-catalogue:204 | 9 | no | 0 | 0 | 0 | 0 | 0 | not run | - |
| ai-catalogue:317 | 11 | yes | 11 | 4 | 11 | 0 | 0 | not run | - |
| ai-catalogue:336 | 11 | no | 0 | 0 | 0 | 0 | 0 | not run | - |
| ai-catalogue:484 | 12 | yes | 12 | 0 | 11 | 1 | 0 | store-assembly | 1 of 1 |
| ai-catalogue:611 | 12 | yes | 12 | 0 | 12 | 0 | 0 | not run | - |
| ai-catalogue:1097 | 11 | yes | 12 | 2 | 12 | 0 | 0 | not run | - |
| ai-use:105 | 18 | yes | 18 | 9 | 12 | 1 | 5 | none | 0 of 1 |
| ai-use:378 | 19 | yes | 19 | 7 | 18 | 0 | 1 | not run | - |
| ai-use:613 | 19 | yes | 19 | 6 | 19 | 0 | 0 | not run | - |
| wizard-scripts:98 | 19 | no | 0 | 0 | 0 | 0 | 2 (interface-shell, screens-inquiry) | not run | - |
| wizard-scripts:163 | 19 | no | 0 | 0 | 0 | 2 (affordances, screens-inquiry) | 0 | affordances | 1 of 2 |
| wizard-scripts:253 | 19 | no | 0 | 0 | 0 | 0 | 0 | not run | - |
| wizard-scripts:255 | 19 | no | 2 | 0 | 2 | 0 | 0 | not run | - |
| wizard-scripts:546 | 19 | yes | 19 | 0 | 19 | 0 | 0 | not run | - |

## Totals

```
{
 "changes": 32,
 "replayed": 32,
 "recordTold": 665,
 "recordForNothing": 629,
 "broken": 23,
 "adopted": 13,
 "listingUnchanged": 13,
 "toolTold": 408,
 "toolForNothing": 377,
 "toolBrokenMissed": 3,
 "toolAdoptedMissed": 2,
 "narrowTold": 363,
 "narrowForNothing": 333,
 "narrowBrokenMissed": 4,
 "narrowAdoptedMissed": 2,
 "entryTold": 140,
 "entryForNothing": 119,
 "entryBrokenMissed": 11,
 "entryAdoptedMissed": 4,
 "testsChanges": 7,
 "testsUserRuns": 42,
 "testsUsersFailing": 11,
 "brokenCaughtByTests": 7,
 "brokenInChangesWithTests": 23
}
```
