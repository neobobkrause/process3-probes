# [file] levers_github_cloudflare_product.md (continued)

- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue
- https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/merging-a-pull-request-with-a-merge-queue
- https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments
- https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations
- https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching
- https://docs.github.com/en/actions/reference/limits
- https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- https://docs.github.com/en/actions/concepts/about-actions-policies
- https://docs.github.com/en/actions/how-tos/administer/control-workflow-execution
- https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api
- https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits
- https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/deciding-when-to-build-a-github-app
- https://docs.github.com/en/site-policy/github-terms/github-terms-of-service
- https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies

GitHub changelog:
- https://github.blog/changelog/2025-11-07-actions-pull_request_target-and-environment-branch-protections-changes/
- https://github.blog/changelog/2026-09-17-workflow-execution-protections-in-github-actions-generally-available/
- https://github.blog/changelog/2026-11-02-pull_request_target-blocked-by-default-december-2

Cloudflare documentation (read 13 Nov 2026):
- https://developers.cloudflare.com/workers/previews/
- https://developers.cloudflare.com/workers/previews/resources/
- https://developers.cloudflare.com/workers/previews/test-and-debug/
- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/
- https://developers.cloudflare.com/workers/ci-cd/builds/advanced-setups/
- https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/
- https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/
- https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/
- https://developers.cloudflare.com/workers/observability/logs/workers-logs/
- https://developers.cloudflare.com/workers/observability/issues/
- https://developers.cloudflare.com/workers/observability/issues/automations/
- https://developers.cloudflare.com/workers/authorization/workers/
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/browser-run/
- https://developers.cloudflare.com/browser-run/limits/
- https://developers.cloudflare.com/browser-run/pricing/
- https://developers.cloudflare.com/browser-run/playwright/

Local evidence:
- `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/work/foundations.md`
- `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/work/review.txt`
- `/home/user/neobobkrause/process3` at `origin/tranche`: `tool/lib/*.mjs`, `setup/conditions.json`, `setup/DEVELOPER.md`, `notes/github-pacing.md`, `DECISIONS.md`, `shims/`
- `/home/user/neobobkrause/civicsmith-copy` at `origin/tranche`: `.github/workflows/*.yml`, `.github/scripts/module-tests.mjs`, `process/config.json`, `build/modules.json`, `CLAUDE.md`, `.claude/settings.json`, every `wrangler.jsonc`, `bio-plane/package.json`, `bio-plane/scripts/deploy.mjs`, `bio-plane/scripts/p3dev-walk-setup.mjs`, `bio-plane/src/journey-check/`


# [file] study.md (later part)

**(g1) The user holds, by name, something that changed.** A user is told when at least one of these is true of its own files as they stood before the change:
  1. it imports a name that was removed or whose call changed, or imports the class, or calls a method of that name (124 pairs; 12 broken);
  2. it imports, by name, exported data whose contents changed (112 pairs; 8 broken);
  3. it imports a file under the provider's tests that the change touched (89 pairs; 7 broken);
  4. its requirements, tests or source comments cite a public requirement of the provider that changed (182 pairs; 22 broken);
  5. it uses, as a quoted word, a key or a property, a word of 8 or more letters that the provider's code used before the change and uses nowhere after it (109 pairs; 23 broken). This catches renamed fields and retired operations that no import shows.

  Sends 460 (17%). Misses 5 broken users: `ai-accounts` 124 to `signin-door` (the names it lost were removed from a third module's hand-on list), `ai-accounts` 316 to `store-assembly` (section 1.4), `ai-catalogue` 484 to `store-assembly` (its tests signed the old seed), `answers` 103 to `agent-worker` (a copied list held equal by a test), `jurisdictions` 40 to `instance-setup` (a data file gained entries). *To be safe* it needs what (c) needs, and it would still miss a break that travels through changed data or a third module. Parts 2 and 5 are pattern matches and will mislead on other code.

**Per change:** under g1 nobody is told on 68 of the 178 changes. On the record, 155 of the 178 changes broke no user.

### Who had work anyway (measured, `idle.py`)

| | Notified pairs | Broken among them | Told by g1 | Broken reached by g1 |
| --- | --- | --- | --- | --- |
| User had an unmet requirement of its own or a job open | 1,735 | 33 | 336 | 30 |
| User had neither (the notice alone would start its job) | 972 | 7 | 124 | 5 |

Under Process4 a module with work gets a job without any notice. So the jobs that a notice alone would start are the 972; under g1 they are 124. The two broken users missed there are `signin-door` and `store-assembly` above. The week measured was one in which most modules had work; in a quieter round the second row would be larger.

---

## 5. What a sharper definition could look like

Two candidates, in plain words. Neither adds a test or a check. Each is a rule for who is told, computed from the change and from the user's own files, plus a rule for how jobs write requirements.

### Candidate one: "something this module holds was taken away or changed"

> A change requires a user module to be updated when the user's own files name something that the change removed, renamed, changed the calling of, changed the contents of, or reworded: a name it imports or a method it calls; a table it imports; a test helper it imports; a word of the provider's it writes out; a public requirement it cites, if that requirement was reworded, removed or retired. Nothing else requires an update. A requirement that only became *met* is not a change of promise; a user that was waiting for it has its own "not yet met" line, and that line is what makes its job run.

- *Cost on this record (measured against judged classes):* 387 notifications in place of 2,707 (rule k1).
- *Missed:* 10 of the 40 broken users; 17 of the 34 adopters are reached without being aimed at.
- *Unproven:* that a user's own "not yet met" line brings its job at the right time (17 of 34 adopters had such a line naming the provider); everything about running it.

### Candidate two: "anything this module names changed"

> As candidate one, and also when a public requirement the user cites changed in any way, including becoming met.

- *Cost:* 460 notifications (rule g1). With "or the user has its own unmet requirement naming the provider", 737.
- *Missed:* 5 of the 40 broken users (3 with the addition). Three of the five had work of their own at the time; two did not (`signin-door`, `store-assembly`) and were found only because Process3 told everyone.
- *Unproven:* the same, and that jobs can be held to citing what they rely on.

### What both need from jobs (rules for writing requirements and tests, not checks)

1. **A module's requirement file says what it relies on.** For each provider, the numbers of the public requirements it depends on, written in one agreed form. This is what makes "who is told" computable. On the record, citing is the best signal there is after removal.
2. **A provider changes a public requirement's text, or its mark, in the same change as the behaviour.** Three of the five misses are this rule broken.
3. **A fix that changes what callers see is written on the public requirement,** not only as a found flaw.
4. **A test is titled by the requirement number in one standard form.** Three modules do not.
5. **A name is retired by removing it,** never by leaving it in place with a different meaning. Removal is what the mechanical rules see best, and it is the kind that broke users (22 of 27).

### A structural point from the record

- 510 notifications (19%) went to a user none of whose files imports the provider. Process4's module tests already include "a check that the module's declared uses match its imports". If a declared use with no import is removed from the list, or is required to say what it rests on (a wire connection, an object handed in, a word), those notifications either stop or become explainable. 8 of the 241 affected verdicts, 1 of them broken, are in this group, so the uses cannot simply be dropped.
- The module list itself is an interface. `member-roster` 286 and 446 were not caused by member-roster's job; the module list changed. An edit to that list by ARCH reaches seven modules that run things in its order, and no job's change shows it.

### What is measured, estimated, judged and unproven

- **Measured:** every count of notifications, signals, follow-up merges, files changed, imports, unmet marks and open jobs; each rule's notification count.
- **Estimated:** the reasons behind the 2,101 "not affected" (a sample of 120).
- **Judged (by me, one reader, knowing the outcome):** kind and outcome of each of the 241; therefore "broken reached" and "adopted reached" for every rule. The verdicts themselves are AI workers' judgments. For 26 there is no follow-up to check against.
- **Unproven:** every rule here as a working process. None was run. No rule was tried on pairs Process3 never judged (365 notified, 167 declared and never told) or on modules that depend without declaring it.

---

## 6. What could not be determined

1. **Rule (e).** Whether each user's existing tests would have failed on each provider change. Needs 178 commits checked out and up to 2,707 test runs; the agent-worker suite alone takes six minutes.
2. **Whether broken users exist outside the 241.** The 2,101 "not affected" verdicts were not re-examined for wrong "not affected"; 532 declared pairs were never judged; the replay found three such users on `membership` 1030.
3. **How complete citing is.** How many real dependences a user's files cite by number today.
4. **Whether the figures hold in an ordinary week.** The record is six days dominated by one renaming (the AI-account work); 17 of the 40 broken users come from two changes.
5. **The 26 with no follow-up.** Classed by reading only.
6. **Noise in the word rule.** The "dropped word" signal is a pattern over text; its false alarms on this record are counted (58 of 109 judged pairs not affected), its behaviour on other code is not known.
