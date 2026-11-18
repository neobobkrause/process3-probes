### 8.7 Cloudflare Access for development deployments [doc]

One switch protects "Preview deployments for all Workers" or "Production and preview deployments for all Workers" in an account, including Workers created later; or one Worker; or one hostname. Preview URLs are public by default. A CI walker authenticates with an Access service token in two request headers. Limit: "Worker-level Access policies do not currently support WebSocket connections"; a Worker that needs WebSockets must use a hostname-based application. Needs Zero Trust enabled on the account (the free tier's seat allowance was not re-verified today). Source: [Cloudflare Access for Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/).

With a separate development account, "protect all Workers, all traffic" is one setting, set once by the owner, and no development copy is ever public.

## 9. Automated walks at round close

| Where the browser runs | How | Cost and limits | Verdict |
| --- | --- | --- | --- |
| **GitHub Actions** | A job in environment `dev`, in the container `mcr.microsoft.com/playwright:v1.56.1-noble`, runs `npm run journey -- --live $URL`; uploads `report.json`, screenshots and traces as an artifact; writes counts to the run summary; fails on findings | Free and unlimited on a public repository; 4 vCPU; artifacts kept up to 90 days | **Recommended.** The walker already exists and already runs this way in `regression.yml`. |
| Cloudflare **Browser Run** (the product formerly called Browser Rendering), from a Worker with `@cloudflare/playwright`, or from CI over CDP | Sessions of headless Chrome on Cloudflare; also Quick Actions including a `/crawl` endpoint | Free: 10 browser minutes a day, 3 concurrent browsers. Paid: 10 browser hours a month then $0.09 an hour; 10 concurrent browsers (monthly average) then $2.00 each; default ceiling 200 concurrent | Worth it only for wide parallel walks, or to walk from inside Cloudflare. The plane already binds a browser for its own features. |
| A Claude session driving a browser | As Process3's walkers did | Session tokens; evidence is the model's words | Keep for exploratory walking only; nothing the model says is evidence. |

Sources: [Browser Run](https://developers.cloudflare.com/browser-run/), [limits](https://developers.cloudflare.com/browser-run/limits/), [pricing](https://developers.cloudflare.com/browser-run/pricing/).

**Trigger.** Run the walk as the last step of the deploy job on `push` to the integration branch, so that the environment's deployment succeeds only if the walk passes; or as a `workflow_run` after the deploy workflow. Open one issue per walk with the counts and a link to the artifact; pair it with the Workers Issues list for the same window.

**Where the output goes.** Artifacts, not git. The Foundations say a walk's output "is kept only until it is analysed"; today hundreds of megabytes of it are committed.

**Custom code.** None beyond the workflow file. **Who can change it:** the workflow is under `/.github/`, so the owner.

---

# C. The product as a lever

## 10. What the product looks like, and what would reduce the need for process

### 10.1 Measured from `origin/tranche` [repo]

| Fact | Value |
| --- | --- |
| Files in the tree | 20,060, of which `build/` 13,017 (431 MB), `bio-plane/` 4,996 (82 MB), `docs/` 610, `process/` 398 |
| Modules in `build/modules.json` | 220, in 11 layers (39, 10, 12, 9, 21, 27, 3, 20, 13, 4, 62); 163 live under `bio-plane/` |
| Source per module (bytes under its paths, excluding its tests) | median 123 KB, 90th percentile 319 KB; the largest are asset-heavy (`ux-design` 11.3 MB, `installer` 9.9 MB, `ocr-worker` 6.2 MB) |
| Tests per module | median 191 KB, 90th percentile 831 KB; `pdf-worker` 4.7 MB in 227 files; 14 modules list no test files |
| Test files | 3,639 `*.test.mjs` (47 MB); 3,400 of them under `bio-plane/test/m/<module>/` |
| Declared uses per module | median 10, 90th percentile 26, maximum 134 (`plane`) |
| Transitive dependents per module | median 71, 90th percentile 162, maximum 217 |
| Most-used modules | `setup-words` 213, `test-support` 153, `record-grammar` 132, `record-core` 116, `membership` 116 |
| Language and static checks | Plain `.mjs` throughout. No TypeScript file, no `tsconfig`, no ESLint, Biome or Prettier configuration anywhere in the tree |
| Test runner | `node --test`, with a preload that imposes the platform's SQLite limits; miniflare for Worker tests; Playwright for browser tests |
| Lock files | Ten, each installed separately in the gate |
| `npm test` in `bio-plane` | Has a `pretest` that builds the words files, the case-checker program and **every** fleet bundle first |
| Workflows | `process-gate` (one job, timeout 90 minutes), `regression` (manual, 120), `process-dev-release` (checks job 240), `deploy-test`, `release-sign`, `container-images`, `process-record`, `process-branch-prune` |
| Gate time signals | "plane and control-plane gates take 40-42 minutes" (workflow comment); median attempt 12 minutes rising to 42–65 (review); one forced full gate 55 minutes |

### 10.2 What these facts say

- **The median module cannot be changed in isolation.** With 71 transitive dependents at the median, "run the dependants' suites" is expensive (the owner called it "a large drag with little benefit" and it was reverted), and "notify every user of a changed module" produced 56 jobs for one requirement. The product needs a cheaper way than re-running or re-reading dependants to know an interface still holds.
- **There is no check that runs in seconds.** Without a type check or lint, the cheapest signal that a change broke a caller is a test run measured in tens of minutes. Process filled that gap with receipts, notices and re-test landings (27 of 47 landings in one 29-hour window were re-tests with no code change).
- **The gate's time is mostly fixed overhead and serial execution**, not the module's own tests.
- **The strongest defect finder runs least often.** The walk found 1,691 faults at a round close; nothing like it runs per merge.

### 10.3 Concrete, modest changes

Ordered by what they remove.

1. **Type-check the interfaces without adopting TypeScript.** Add `typescript` as a development dependency and one `tsconfig.json` with `allowJs`, `checkJs`, `noEmit`, including only each module's public entry files at first. JSDoc types on exported functions are enough. A wrong argument shape across a module boundary then fails in a minute or two, in the `plan` job, before any test runs. This is the fast deterministic stand-in for most "provider notices".
2. **Enforce the layer map with a linter, not a tool.** The "imports check" (one real catch) compared declared `uses` with actual imports. `dependency-cruiser` or ESLint's `import/no-restricted-paths`, with its rule list generated from `build/modules.json`, does this as an off-the-shelf check with file-and-line output.
3. **One contract test file per high fan-in module.** For the twenty or so most-used modules, a `contract.test.mjs` that pins the exported surface and the documented behaviours at the interface. A change to `membership` then runs `membership`'s suite including its contract; dependants are not re-run and not notified unless the contract file itself changes, which is visible in the diff. This replaces notices, triage and re-test landings with a file.
4. **Take the bundle build out of `pretest`.** Build generated files once per CI run in the `plan` job, keyed by a hash of their inputs in the Actions cache; module suites that do not import `dist/` should not wait for eight bundles.
5. **Shard and tier the tests that already have a per-module layout.** `node --test --test-shard=i/n` over the selected modules' directories. Name the heavy fixture suites (`pdf-worker`, `doctypes`, `reading-pipeline`, `image-codecs`, 2 to 5 MB of tests each) as a slower tier that runs in the merge queue or nightly, which is what the Foundations already prescribe ("a fixture's tier is set with its requirement").
6. **One install instead of ten.** npm workspaces at the root, or at least one cache key over all lock files. Ten `npm ci` calls are several minutes of every gate.
7. **Pin the runner image and use the Playwright container.** Deletes about seventy lines of browser install and fallback from the gate.
8. **A feature-flag map in `vars`.** Unfinished behaviour lands dark behind a flag read from the Worker's variables. Merges then need no ordering by layer and no "companion must land first" rule (which deadlocked a layer within hours of being written); the flag flips when the last piece lands.
9. **Make deploy-and-walk the routine defect finder.** Run `journey-check`'s local arm in the merge-group run if it fits in a few minutes, and the live arm on every push to the integration branch against one long-lived development copy. Keep the fresh-install and upgrade walks for the release tier.
10. **Move walk output and plans out of git.** Artifacts for walk output; issues for findings. `build/` at 431 MB is two-thirds of the files a session's checkout carries, and GitHub's recommended ceiling for a repository is 10 GB on disk.
11. **Turn on Workers Logs and Issues for development copies**, and have the walker tag its requests (a header carrying the commit SHA) so server-side errors can be joined to a walk.

None of these is a framework. Items 1, 2, 4, 5, 6 and 7 together are the route to a ten-minute gate; whether they reach it is assumption 4 in section 12.

**A warning from the review that applies here.** "The tendency will look for other outlets. Expect it in the product's own test suites." Items 1 to 3 add checks. Each should be the owner's decision, with a number attached (seconds added to the gate), and CODEOWNERS on the lint and type-check configuration files keeps their strictness the owner's.

---

# D. Synthesis

## 11. Each job of the Process3 tool, and what could take it over

Tool sizes are lines at `process3 origin/tranche` (23,429 lines in `tool/`). "Owner" means the repository owner through settings no write collaborator can reach. "Owner via CODEOWNERS" means the file is in the product, a session can propose a change in a pull request, and the pull request cannot merge without the owner.

| # | Job the custom tool did | Process3 code | Native lever | Custom code still needed | Who can change it |
| --- | --- | --- | --- | --- | --- |
| 1 | **Merge ordering** (train, leases, holds, layer flow, direct flow) | `merge` 1,047, `layerflow` 2,579, `hold` 278, plus `direct`, `layer`, `layerbase`, `landed` | Organization: ruleset "Require merge queue" with grouping. Personal: auto-merge. Layer order: feature flags in the product instead of ordered merges. | 0 | Owner (ruleset). Sessions only enqueue. |
| 2 | **Gate on the merged result, then merge a green current tip** | Part of `merge`, `gate` 847, `basered`, stale-green check | Merge queue runs the required check on base + queue + pull request (`merge_group`). Personal: the `pull_request` run already tests GitHub's test merge; a `push` run on the integration branch covers the remaining 2%. | 0 (two trigger lines) | Owner (ruleset); workflow file owner via CODEOWNERS |
| 3 | **Record and size checks** (file size, reserved paths, ledger schema, record ownership) | `record` 525, `size` 129, `ledger` 196, `census` | Mostly delete: no ledger, no state paths. File size: GitHub hard-limits 100 MB only; a path or size rule in a ruleset needs a private Team repository. Walk output goes to artifacts so the pressure disappears. | 0, or about 5 lines in the gate if a 1 MB cap is still wanted | Reusable workflow: owner |
| 4 | **Pin and version distribution** (submodule pin, pin move, start check, 98 moves) | `pin` 108, `start` 150, `setup` 628, shims and drift check | Process repository not writable by sessions; product calls its reusable workflow `@<sha>`. A version is one line. | 1 line | Process: owner. The line: owner via CODEOWNERS |
| 5 | **Status and next acts** | `status` 1,408, `report`, `metrics`, `measures` | `gh pr list --json ...`, `gh pr checks`, `gh run list`, the merge queue page, Deployments list; optionally a Project board | 0, or a 10-line shell alias that prints three `gh` queries | Nothing to change |
