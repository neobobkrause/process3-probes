# [file] codex_design_conversation_register_20261117.md (continued)

4. Whether supported native controls fully protect consequential external actions in practice.
5. Actual long-run behavior of ephemeral session context, repository growth, safety continuation and message recovery.

**Provenance discipline:** This register is a research synthesis; quoted owner words are elsewhere. Historical assistant suggestions for paid hosting, mandatory ROOT resurrection after deliberate archival, and mandatory physical job-module isolation were corrected/rejected. Do not reinstate them without new owner authorization.


# [file] merge-train-trial.md

# Merge train trial (Bob's design and word, 5 Nov ~02:20 UTC; design revised 02:35 after the design study)

Bob, 5 Nov: "Yes, begin the trial of the merge train when we're ready. But be sure to measure so that we understand the tradeoffs and balance being struck." Replaces the self-merge trial (notes/self-merge-trial.md): jobs do not merge their own PRs; one actor runs the train.

## Design (revised 02:35)
GitHub's merge queue is not offered on these user-owned repos (Bob checked the ruleset editor, 02:33). The design study found most of the gain is removing pickup (sim: automatic one-at-a-time 7.0/20.5 vs actual 8.7/33.7 median/p90 min; batches 5.2/13.5) and that batch gates would be weaker than today's per-PR job re-gate. So the trial runs: automatic serial per-PR merges on green, next PR prepared during the current gate, in a dedicated MERGER session; batching stays off and is reconsidered with Bob when measured queue depth at merge time stays at 3 or more. The original batch design follows for reference.

### Original batch design (not built)
- No per-PR merge queue. While batch N's gate runs, batch N+1 is assembled from every job PR that is green on its own receipt, ready, and compatible: merges cleanly with the tranche and with the batch's other members (git merge-tree), review-triggered PRs only after their review passed.
- One gate per batch, on the tranche plus all members. Each member is still its own merge commit in order, with its own merge row, cost row and receipt check, so records and reverts stay per PR.
- On failure: bisect (halves, gated), merge the passing part, send the culprit back to its job with the failing run.
- The next batch is formed when the current one's gate is near its end (median duration known; the tool polls every 15 s), then the train continues. Batches size themselves: small when greens trickle in, large in bursts or behind long gates.
- Run by the MERGER, a session of its own that ROOT starts and replaces (not BOB's loop): `p3 merge train`, one serial loop over the tool's per-PR merge under a lease on the state branch. No batches. (process3 PR 142, b8d5176)

## Measures (baseline: 4-5 Nov, measured 01:50 and by measure/merge-train-sim)
- green -> merged per PR: median, worst (baseline median 11.0 min, worst 85)
- PR-minutes waiting after green; idle job sessions waiting on merge (01:54: 11 of 19)
- gate runs and gate-minutes per merged PR; cancelled runs per PR
- batch size distribution; batches failed; bisection gates; culprits and how often a good PR was delayed by a bad one (minutes)
- conflicts caught at batch time vs after merge; reverts; post-merge defects (survival read)
- velocity, efficiency, quality as the velocity audit defines them, before vs during
- state-branch push tries per write (batch merges add rows at once)

## Stop rules
- more than one merged PR needing a revert, or a post-merge defect the per-PR path would have caught
- any state-branch push hitting its try limit
- median green -> merged worse than the baseline over 3 hours

## Decision after one day on the copy
Keep, adjust or drop, reported to Bob with the figures and the balance struck.


# [file] bob-workflow-diffs-4nov.md

# Bob's act 4: two workflow changes for the copy's first tranche close (4 Nov 07:00)

The first close of neobobkrause/civicsmith-copy (tranche into main) is refused by the merge tool until these two diffs reach main. They are workflow changes, so only Bob can approve them. Route, recommended: commit them to the copy's main through GitHub's website, after which the close merges through the tool. The alternative is for Bob to merge the first close himself.

Note: container-images.yml publishes to GHCR and Docker Hub. The first diff adds a new published image, reader-container.

Commits on the tranche: container-images.yml fd9fe9a0ac (K5646, reader-container's matrix row), carried in 740d8f562f; regression.yml 7bd724f2f5 (ONB-6, the site's browser test).

```diff
diff --git a/.github/workflows/container-images.yml b/.github/workflows/container-images.yml
--- a/.github/workflows/container-images.yml
+++ b/.github/workflows/container-images.yml
@@ -15,6 +15,8 @@ on:
     paths: ["agent-runner/Dockerfile", "agent-runner/package.json", "agent-runner/package-lock.json", "agent-runner/src/**",
             "file-scanner/Dockerfile.*", "file-scanner/package.json", "file-scanner/package-lock.json",
             "file-scanner/packages-*.json", "file-scanner/container/**", "file-scanner/src/**",
+            "reader-container/Dockerfile", "reader-container/package.json", "reader-container/package-lock.json",
+            "reader-container/packages.json", "reader-container/container/**", "reader-container/src/**",
             ".github/workflows/container-images.yml"]
   workflow_dispatch:
 
@@ -33,6 +35,7 @@ jobs:
           - { name: agent-runner, context: agent-runner, file: agent-runner/Dockerfile, member: agent-runner }
           - { name: file-scanner-scanner, context: file-scanner, file: file-scanner/Dockerfile.scanner, member: file-scanner }
           - { name: file-scanner-renderer, context: file-scanner, file: file-scanner/Dockerfile.renderer, member: file-scanner }
+          - { name: reader-container, context: reader-container, file: reader-container/Dockerfile, member: reader-container }
     steps:
       - uses: actions/checkout@v4
       - uses: docker/setup-buildx-action@v3
diff --git a/.github/workflows/regression.yml b/.github/workflows/regression.yml
--- a/.github/workflows/regression.yml
+++ b/.github/workflows/regression.yml
@@ -31,7 +31,8 @@ jobs:
         timeout-minutes: 30
         run: |
           set -euo pipefail
-          for pkg in bio-plane pdf-worker ocr-worker newgroup agent-runner sheet-worker; do
+          # site: its browser test imports playwright-core from its own lock (ONB-6).
+          for pkg in bio-plane pdf-worker ocr-worker newgroup agent-runner sheet-worker site; do
             [ -f "$pkg/package-lock.json" ] || continue
             (cd "$pkg" && npm ci --no-audit --no-fund --loglevel=error)
           done
@@ -44,6 +45,10 @@ jobs:
         run: |
           set -uo pipefail
           failed=""
+          # site's browser test launches $CHROMIUM (default /opt/pw-browsers/chromium, absent on the runner):
+          # the Chromium journey-check's step installed, same playwright-core 1.56.1 (ONB-6).
+          CHROMIUM="$(ls -d "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux*/chrome 2>/dev/null | head -1)"
+          [ -n "$CHROMIUM" ] && export CHROMIUM || echo "::warning::no installed Chromium found; site's browser test will fail by name"
           for pkg in bio-plane pdf-worker ocr-worker newgroup agent-worker; do
             [ -f "$pkg/package.json" ] || continue
             echo "::group::$pkg"
```


# [file] 02-open.txt

### ANCHOR: /** R72: a provider's refusal for a spent limit (Anthropic's 429
/**
 * One declared bound of `open`'s `bounds` (run-rules R3, `checkConsume` in list form).
 * @typedef {object} BoundDeclaration
 * @property {RunBound} bound  Any `RunBound` but `lease` (`AI_RUN_BOUND_PLANE_COUNTED`); another word is `AI_RUN_BOUND_UNKNOWN`.
 * @property {number} allowed  [bound allowed: a safe integer of one or more; absent, null or 0 is `AI_RUN_BOUND_NO_ALLOWANCE`, any other
 *  value `AI_RUN_CONSUME_INVALID`; in mode `plan` a `fetches` or `subsessions` allowance above 0 is `AI_RUN_PLAN_NO_SEARCH`]
 * @property {number|null} [consumed]  What is already spent; absent or null is 0. [bound consumed: a safe integer of zero or more
 *  (`AI_RUN_CONSUME_INVALID`); for a `PlaneCountedBound` only 0 (`AI_RUN_BOUND_PLANE_COUNTED`)]
 * @property {string|null} [unit]  Stored as text, answered by `read`; no length bound is checked.
 */
/**
 * What `open` is handed (R9, R46, R73, R77, R89). `aiRunsOps` takes all but the three stamps from the request body.
 * @typedef {object} OpenArgs
 * @property {string} run  The new run's id, stored verbatim as the key. Absent or empty: `AI_RUN_NO_CONTEXT`. [bound run: non-empty; no
 *  further format is checked at the open, but ai-use counts a tick's usage only under an id of 1 to 128 characters of letters, digits,
 *  dot, underscore, colon and hyphen]
 * @property {RunContextType} contextType  Absent or empty: `AI_RUN_NO_CONTEXT`; another word: `AI_RUN_NO_SUCH_CONTEXT`.
 * @property {string} contextId  The id of a bundle of that kind which the viewer sees. Absent or empty: `AI_RUN_NO_CONTEXT`; absent
 *  from the record, hidden, or of another kind: `AI_RUN_NO_SUCH_CONTEXT`.
 * @property {Stamp} principalPlane  The plane credential acting, the control plane's stamp; stored as text. Absent or empty:
 *  `AI_RUN_CAPABILITY_UNAVAILABLE`.
 * @property {string} principalClaude  The second principal, which must be named: absent or empty is
 *  `AI_RUN_CAPABILITY_UNAVAILABLE`. It is read further only when no member is behind `actor` or `principalPlane`: then
 *  `member:<id>` names the member whose account carries the run. What is STORED as `principal_claude` is the paying owner
 *  `ai-accounts` answers, not this value. (The requirements name this argument `principalAi`, R9 as amended at T53, not yet met.)
 * @property {string} skillVersion  The skill version the run runs under, stored trimmed. [bound skillVersion: after trimming, no
 *  whitespace and exactly one at sign with text on both sides, the form `pack`, at sign, `edition`; else `AI_RUN_SKILL_VERSION_UNNAMED`]
 * @property {string|null} [label]  A label for people, stored verbatim; no length bound is checked.
 * @property {RunMode|null} [mode]  Absent or null is `check` (run-rules' `DEFAULT_MODE`); otherwise trimmed. One not deployed and
 *  admitted here is `AI_RUN_MODE_NOT_DEPLOYED`.
 * @property {unknown} [principalClaudeRef]  Accepted and never read: the stored `principal_claude_ref` is `member:<id>` of the
 *  member whose act the open is.
 * @property {string|null} [biasManifest]  The lens manifest the opener was handed, stored verbatim and never judged at the open.
 *  [bound biasManifest: to be read back it is the JSON text of an object `{scope?, scope_id?, statements_sha?, bundles?}`; any other
 *  text is stored and reads back as unreadable]
 * @property {string|null} [standardPair]  The launching project's bar, stored verbatim and never judged at the open.
 *  [bound standardPair: to be read back it is the JSON text of an object `{capture?: string, connection?: string}`; any other text is
 *  stored and reads back with basis `unreadable`]
 * @property {BoundDeclaration[]|null} [bounds]  The run's budget, one entry per bound it is held to; a value that is not a list, or
 *  an entry that is not an object, is `AI_RUN_BOUND_UNKNOWN`.
 * @property {unknown} [state]  The run's resumable scratch, stored as JSON; absent or null is stored as `{}`.
 *  [bound state: its JSON is at most 262,144 bytes of UTF-8 (run-rules' `AI_RUN_STATE_MAX_BYTES`), else `AI_RUN_STATE_TOO_LARGE`]
 * @property {number|null} [leaseMs]  The lease of this open in milliseconds. [bound leaseMs: used when `Number(leaseMs)` is above 0,
 *  otherwise the default lease (600,000 ms, or the environment's `AI_RUN_LEASE_MS`); no upper bound is checked]
 * @property {InstantArg} [at]
