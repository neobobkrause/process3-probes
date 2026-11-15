# The cluster chosen for the replay, and why

15 Nov 2026, written by Claude (the replay session) before any comment was written or any change replayed.

## The choice

Six providers of the AI-account part of the product: **ai-runs, ai-accounts, op-declarations, ai-catalogue, ai-use, wizard-scripts**. Every one of their recorded changes is replayed: 32 changes.

| Provider | Recorded changes | Notifications Process3 sent | Judged broken | Judged adopted | Judged affected, nothing to change |
| --- | --- | --- | --- | --- | --- |
| ai-runs | 8 | 217 | 11 | 2 | 14 |
| ai-accounts | 5 | 138 | 2 | 0 | 9 |
| op-declarations | 4 | 84 | 6 | 3 | 3 |
| ai-catalogue | 7 | 75 | 1 | 0 | 2 |
| ai-use | 3 | 56 | 1 | 6 | 6 |
| wizard-scripts | 5 | 95 | 2 | 2 | 11 |
| **All six** | **32** | **665** | **23** | **13** | **45** |

Measured from the study's data (`data/changes.json`, built by `adaptor/changes.py` from the study's `srcimp.json`, `classified241.tsv` and the replay's list of commits). "Judged" is the study session's reading of each affected verdict.

## The share of the record it covers (measured)

- 32 of the 178 recorded changes (18%).
- 665 of the 2,707 notifications (25%).
- 23 of the 40 users judged broken (58%), and 13 of the 34 judged to have adopted something (38%).
- The two changes that broke the most users are both here: ai-runs pull request 96 (11 broken) and op-declarations pull request 95 (6 broken), the two that retired the old AI-account names.

## Why these six

1. **They carry the broken users.** The record's broken users are concentrated: 17 of 40 come from two changes, and both are in these providers. A replay that holds few broken users cannot say much about misses.
2. **They have many users and several changes each.** Between 9 and 30 users per change, 3 to 8 changes per provider: enough changes per provider to measure the upkeep of comments across a provider's life, not only the first comments.
3. **They are one cluster.** They use each other (ai-runs uses ai-accounts, ai-use and ai-catalogue; wizard-scripts and op-declarations use ai-runs and ai-accounts), so the same users recur across providers.
4. **They hold the routes that matter**: functions and classes imported by name (ai-runs, ai-accounts), operations called by name (op-declarations declares the product's operations; ai-runs answers some), data lists (ai-catalogue's catalogue, wizard-scripts' scripts), and the "layer" merges (four of the 32 changes) where the record's change came from a merge of many jobs.
5. **They are of the size a real provider is**: 1,310 to 3,812 lines of source each at the state before its first replayed change, 16,240 lines in all (measured). That makes the effort figures a sample of real modules, not small ones.
6. **The study already commented ai-runs once** (a helper, at a later state, about 27 minutes): a second, independent figure for the same module to compare effort with.

## What was left out, and why

- **membership** (211 notifications, 116 users, no broken user) and the other providers with many notifications but no broken user. They would test notices for nothing, which this cluster tests too (45 judged "affected, nothing to change", and 584 told and never judged affected), but not misses.
- More than six providers. The six hold 16,240 lines of source to comment; more would not fit one session.

## How a change is replayed (decided here)

- **The state before** is the product at the merge's first parent. **The state after** is the same, with only the provider's own files (source and tests) replaced by the merge's. Other files a merge touched are left as before, so the only difference is the provider's change. The record's job merges touched 2 to 4 other files each (mostly the process's own records).
- **The users** are every module that declared the provider at the commit before, plus every module Process3 told: 9 to 30 per change.
- **The layout.** The product keeps its modules under shared folders (`bio-plane/src/<module>/`, `bio-plane/test/m/<module>/`, and a few top-level Workers). The adaptor (`adaptor/build.mjs`) copies each module's files into the tool's layout (`<module>/src/`, `<module>/test/`) and rewrites relative imports to match. It reads the product with `git cat-file` from a bare clone; nothing is checked out or written in the product's repository. The tool is not changed for this.
- **Comments.** Each provider is commented at the state before its first replayed change (the comments-only first step), and its comments are carried through each later change: mechanically where the code around them did not change (`adaptor/carry.mjs`, a three-way merge), and then updated as the job that made the change would have had to.
