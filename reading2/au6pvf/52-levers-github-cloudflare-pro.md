The wall between development and production inside the one Cloudflare account is prose in `CLAUDE.md` (a paragraph listing which Workers may never be touched) plus the name guard in the script. Nothing at Cloudflare enforces it.

**Walk today.** `bio-plane/src/journey-check` is a Playwright walker (playwright-core 1.56.1) with a local arm and a live arm. `p3dev-walk-setup.mjs` claims a fresh copy as founder, invites a member, writes credentials to a file outside the repository, then runs `npm run journey -- --live <address>`. Reports land in `out/live/report.json`. Earlier walks, with screenshots, are committed under `build/plan/walk-*`; `build/` is 13,017 files and 431 MB of the tree. The live walk of 8 Nov found 1,691 real page faults, "the largest finder of product defects by far".

## 8. Native Cloudflare features that could serve the process

### 8.1 Worker Previews: an isolated copy per branch [doc]

"Previews give each branch an isolated, production-like environment under the same Worker." `npx wrangler preview` (Wrangler 4.135 or later) creates or updates the preview for the current branch at `<preview-name>-<worker>.<subdomain>.workers.dev`, with an immutable deployment URL per deploy. Previews do not inherit production settings; a `previews` block in the Wrangler file defines them.

| Resource | In a preview |
| --- | --- |
| Durable Objects | "Automatically provisions a new Durable Object namespace and storage for each Preview." |
| Containers | A new container app and instances per preview; the configuration must be repeated under `previews.containers` |
| R2, KV, D1, Queues producers | Shared unless the preview is bound to a different resource |
| **Service bindings** | "the Preview of Worker A can only bind to the production Worker B" |
| Cron Triggers, routes, Queue consumers | Target production only; not run for previews |

Limits: 100 previews per Worker on Free, 500 on Paid; 100 deployments per preview; the oldest are deleted automatically. Sources: [Previews](https://developers.cloudflare.com/workers/previews/), [resources and isolation](https://developers.cloudflare.com/workers/previews/resources/).

**Fit with this product.** Good for a change inside one Worker (the plane, 163 of 220 modules live under `bio-plane`). Poor for a change that spans the plane and a fleet member, because the preview plane would call the non-preview member. The product's own install path (the REST deploy, the installer) is not exercised by `wrangler preview` at all. So: previews for fast per-pull-request or per-merge walking of plane changes; the existing fresh-install route kept for the release tier, which is where the Foundations already put "an install-from-scratch test and an upgrade-from-previous-release test". [inference]

**Custom code.** A `previews` block and one command. **Who can change it:** the block is in the repository; the preview limit, Access policy and token are in the Cloudflare account.

### 8.2 Versions, gradual deployments and rollback [doc]

`wrangler versions upload` then `wrangler versions deploy` splits traffic by percentage; `wrangler rollback` returns to any of the last 100 versions. Limits that matter here: version URLs "are not generated for Workers that implement Durable Objects, including Containers"; only one version of a given Durable Object runs at a time and a migration must go through `wrangler deploy`; "Resources connected to your Worker will not be changed during a rollback", so data written by the newer code stays; a rollback is refused across a Durable Object class migration. Useful for the hosted Workers (`site`, `newgroup`, `stewards`); of limited use for the plane. Sources: [gradual deployments](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/), [rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

### 8.3 Workers Builds: a deploy path with no token in a session or in GitHub [doc]

Connect a Worker to the GitHub repository through the Cloudflare Workers & Pages GitHub App (installed by the account or organization owner). A push to the production branch runs the build command then the deploy command (`npx wrangler deploy` by default); a push to any other branch can run the preview command (`npx wrangler preview`). Cloudflare posts a pull-request comment with the preview URL and a GitHub check run per Worker. For a monorepo, each Worker is connected separately with its own root directory and optional watch paths.

| | Free | Paid |
| --- | --- | --- |
| Build minutes | 3,000 a month | 6,000 a month, then $0.005 a minute |
| Concurrent builds | 1 | 6 |
| Build timeout | 20 minutes | 20 minutes |

Sources: [Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [limits and pricing](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/), [GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/), [configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

**Cannot do, and one caution.**
- The build token is created and held by Cloudflare, but it is a user token with account-wide "Workers Scripts (edit), Workers KV Storage (edit), Workers R2 Storage (edit)" and it is present in the build environment. The build runs the repository's own scripts, so code on a session's branch could read it during a preview build. "No token in a session" is true; "no session-written code ever sees a token" is not, unless preview builds are off or the token is narrowed (section 8.6). [doc] [inference]
- It does not know about the product's instance-per-copy naming or its read-back verification.
- Six concurrent builds across thirteen Workers and many branches would queue; watch paths help.
- Whether the Workers Builds check run can be used as a required status check, and whether it creates GitHub Deployment records that fire `deployment_status`, is not stated in the docs I read. [untested]

**Recommended use.** Production deploys of the hosted Workers (`civicsmith-site`, `newgroup`, `stewards`, `ai-issuer`) from `main`: the owner merging to `main` is the approval, and no production token exists anywhere but inside Cloudflare. For development, a GitHub Actions job in environment `dev` is simpler to reason about than preview builds from arbitrary branches.

### 8.4 Observability as evidence [doc]

- **Workers Logs.** `observability.enabled` in the Wrangler file. Free: 200,000 log events a day, 3 days kept. Paid: 20 million a month included, then $0.60 a million, 7 days kept; pricing moves to "Cloudflare Observability pricing" on 1 Dec 2026. Structured JSON logs are indexed by field. Previews have their own independent observability block. ([Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/))
- **Workers Issues.** "When a Worker throws an uncaught exception, fails an invocation, returns a 5xx response, or logs an error, Issues records the failure as an occurrence. It groups related occurrences from the same Worker into one issue." Enabled by `observability.issues.enabled` (Wrangler 4.134 or later) or in the dashboard. **Automations** send an issue to a destination when an occurrence threshold is crossed or an issue recurs: a generic webhook, a chat service, an incident tool, or a coding agent, where "Claude Code, Cursor, and Devin are supported prebuilt coding-agent integrations" (Claude Code needs a routine id and an authorization token). ([Issues](https://developers.cloudflare.com/workers/observability/issues/), [automations](https://developers.cloudflare.com/workers/observability/issues/automations/))
- `wrangler tail`, Tail Workers, Logpush and OpenTelemetry export exist for live or exported streams.

**Why this matters to the process.** After a walk, "which server-side errors happened during the walk window, grouped" is one query or one page, with stack traces, produced by the platform and not by a session's report. It is the direct form of "run the product and let it show what matters", and an automation can hand a recurring failure to a Claude Code routine with no sweep.

**Cannot do.** The product deploys by a raw REST upload, and its own deploy script notes that "a script PUT that sends none turns [logs] off"; Issues would need the same treatment, a small product change. `site` and `ai-issuer` deliberately keep observability off. Seven days of retention is not an archive.

**Who can change it.** Flags in the Wrangler file are session-writable; automations and destinations live in the Cloudflare account.

### 8.5 A coordination or heartbeat service on Cloudflare: possible, and not wise

Cron Triggers, Durable Objects, D1, KV, Queues and Workflows could hold a ledger, a lease or a heartbeat outside every session-writable repository. I recommend against building one:

- It is a second custom tool with its own code, deploys, schema and failure modes, which is precisely the thing Process4 exists to avoid. Process3's state branch became a subsystem (692 lines of `state.mjs`, a usage ledger, pending-write replay) starting from "who is where".
- Sessions hold a Cloudflare token; unless the service sits in a different account it is not outside their reach.
- Every job listed for it has a native home that needs no code: pull requests and check runs for state (section 5), an Actions schedule for the watchdog, Workers Issues automations for product failures.

The only Cloudflare-side "coordination" worth having is configuration, not code: Issues automations and Access policies.

### 8.6 API token scoping: development but not production [doc]

This changed in 2026. Workers roles can now be granted to API tokens **per Worker**:

| Role | Can |
| --- | --- |
| Metadata Read-Only | View settings, logs, traces, metrics; run `wrangler tail` |
| Content Read-Only | Also read script source |
| Editor | "read, update, deploy, and rename existing Workers, including script content, settings, schedules, versions, deployments... **Cannot create or delete Workers.**" |
| Admin | Create and delete when granted at the product scope |

"Per-Worker roles apply only to the Workers you select. You cannot grant per-Worker access to a Worker that does not exist yet. Creating new Workers requires product-level Admin access." Routes and custom domains need a separate zone permission. Source: [Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/).

**Design.** One token for sessions and the `dev` environment: Metadata Read-Only on all Workers (so sessions can read logs everywhere) plus Editor on a fixed set of development Workers. No access to `civicsmith-site` or `newgroup`. A second token, Editor on the production Workers plus the zone's Workers Routes, held only in the GitHub `production` environment or not at all if Workers Builds deploys production.

**The catch.** The product's development model creates a brand-new `p3dev-<slug>` Worker set for every copy, which needs product-level Admin, and Admin at product scope can also delete or overwrite `civicsmith-site`. Two ways out, both modest: (a) keep a fixed pool of pre-created development copies (`p3dev-1` to `p3dev-N`) and grant Editor on those; or (b) put development in a separate Cloudflare account, which is the only complete wall, since R2 buckets, Durable Object namespaces, DNS and email routing are also account-level. The product already knows a second "rehearsal account" (`CS_TEST_CF_ACCOUNT_ID`). I recommend (b) with (a) inside it: it turns a paragraph of prose in `CLAUDE.md` and a name guard into something Cloudflare enforces. [inference]

**Can a session change or bypass it?** Not with a token that has no token-management permission. Token scopes are set in the Cloudflare dashboard by the owner.

