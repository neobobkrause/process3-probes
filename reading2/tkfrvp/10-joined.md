# [file] process4_counterarguments.md (continued)

- **(b) The narrower trigger, "the interface changed", would have missed 5 of the 241.** Measured: it reaches 236.
- **(c) The claim that naming the changed parts lets a notified job read less without missing an effect is broken as stated.** Two of the 241 effects would not have been reached from the named parts. Judged: the two were found by a worker reading the evidence for each case; 169 of the 241 were matched mechanically (measured) and the rest were read one by one (judged). Whether a job could also test less was not measured; the replay could not measure it.
- **(d) Process3 did not in fact tell every declared user.** Measured: 167 declared pairs of user and provider were never sent a notice, and 66 of those were told by no route at all. The second draft's sentence that Process3 notified every declared user is wrong.
- **(e) Undeclared dependence exists.** Measured: 122 pairs of modules where a test imports another module without declaring the use, 36 of them a later module; none by import in code that is not a test. No effect on such a user was shown, and none was ever judged, so nothing is known either way.
- **(f) Nearly every merge would send notices.** Measured: under the four named parts, 71% of job merges (360 of 504) change the interface.

Two figures quoted by the reviewers are corrected by the replay. "65 of 178 notices could name no part" is what Process3 recorded; re-derived, the figure is 17 (measured). "38 undeclared pairs" is 36 to a later module, and 122 in all by test import (measured).

None of this proves the notice rule. It shows one claim broken, in (c), one wording that misses effects, in (b), and one result, in (a), that could not have failed.


# [file] first-class-session-minimal-owner-result-20261117.md

# Process4 first-class Codex Cloud session experiment

**Disposition: `BLOCKED_PRE_CREATION`.** Stage 0 ran in the projectless managed Codex session on 2026-11-17, approximately 18:04–18:05 UTC. Stages 1–3 were gated. No task submission, task ID, task URI, creation timestamp, or creation usage was produced.

- [Protocol](https://github.com/neobobkrause/process3/blob/process4/process4/working/first-class-session-minimal-owner-test-20261117.md) (blob `ad4d512f5e5a1ff477567d8a680d2a3f4019e084`) and [prior authentication-failure record](https://github.com/neobobkrause/process3/blob/process4/process4/working/codex-first-class-session-creation-blocker-20261117.md) (blob `bfcc61ddb73965dcea301c067051b6f2898ae000`) read in full.
- **Historical baseline, reported in the prior record.** `codex login status` returned `Logged in using ChatGPT`. `codex cloud list --json` exited 1 with HTTP 401 Unauthorized and “Could not parse your authentication token. Please try signing in again.” The specific cause of the token parse failure remains unknown. This run neither retried the request nor read or repaired inherited credentials.
- **CLI, 18:04:54 UTC.** `command -v codex` resolved to `/opt/codex/bin/codex`. `codex --version`, `codex cloud --help`, and `codex cloud exec --help` completed with exit 0 and a read-only PATH-alias warning. Version `codex-cli 0.167.0-alpha.4` matched the baseline. The experimental Cloud command group exposed `exec`, `status`, `list`, `apply`, `diff`, and `help`. Submission help required `--env <ENV_ID>`. These commands were help/version checks only.
- **Managed browser, approximately 18:05 UTC.** Opening `https://chatgpt.com/codex/` displayed the public “Codex in ChatGPT” page with a **Log in** link targeting `https://chatgpt.com/auth/login?next=/codex/cloud`. No owner task list or published environment selector was visible. This observation describes managed Chrome only. No sign-in flow was started.
- **Tool inventory and environment, by 18:05:28 UTC.** No exposed connector provides general Codex Cloud task creation, listing, or messaging. Codex Document Control is scoped to connected document surfaces. The Cloud Environment status tool returned the current managed runtime instance, whose ID does not establish a published Codex Cloud task target. No eligible published environment ID was verified. Desktop threads, ChatGPT Projects, and Codex product projects are separate from the published execution environment and the Cloud task. The official Cloud documentation describes task creation and continuation through authenticated clients with a published environment. It identifies the GitHub and Linear integration workflows as legacy. Neither those workflows nor automation or local threads established the required creation route in this preflight. [Using Codex Cloud](https://help.openai.com/en/articles/20001545-using-codex-cloud)

The missing prerequisite is a supported Codex Cloud creation surface available to this execution context under the owner's authenticated account, with access to an existing authorized published environment and included usage. The managed browser presented sign-in, the inherited CLI route has the reported 401 with no established change in authentication state, and the connector inventory supplied no alternate creation operation. Owner-initiated sign-in to the Codex Cloud web client would address the observed browser gate. Access to the target and included usage would still require a fresh preflight.

| Capability | Observation |
|---|---|
| Autonomous independent Cloud task creation | Blocked before submission |
| Owner's ordinary Codex task list | Unverified |
| Direct owner message and second turn | Untested |
| Product project assignment | Untested |
| Reactivation by another Process4 session | Untested |

No owner UI verification was requested. No manual replacement task, subagent, automation, metered inference, purchase, or account change was made. Repository changes for the experiment are limited to this report.


# [file] codex-gpt6-context-window-investigation-20261117.md

# Why published GPT-6 1.05M context differs from Codex observed windows

**17 November 2026. Status: assistant external research, not an adopted Process4 rule or an owner decision.** This note records sources and findings for independent validation. It does **not** establish the model/window of the subscription-hosted Process4 child sessions. Do not use the API merely to meet an owner's subscription-only runtime constraint.

## Short answer

The 1,050,000-token number is an **API model capability**, whereas Codex/ChatGPT Work has **product-specific context settings** and sometimes uses an account/client-specific server-delivered model catalog. OpenAI currently explicitly documents **500,000 as the default Codex/Work context for GPT-6.1 Sol**, while separately advertising its **1,050,000 API context** in the **same model page**. Codex applies a catalog maximum to requested context, a 95% usable-context factor, and an ordinarily 90%-of-raw automatic compaction threshold. Real issue reproductions show smaller runtime limits (258,400; 475,000; 828,400) and catalog-origin/cache inconsistencies. The exact reasons for every product/rollout cap and the particular hosted Process4 child capacity are not publicly established.

## Official published statements

1. https://developers.openai.com/api/docs/models/gpt-6.1-sol — 1,050,000 context; 128,000 maximum output; **500K default in Codex and ChatGPT Work**. The API page states separately that API prompts above 272K have a higher rate, but that is not the Codex default.
2. https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex and https://learn.chatgpt.com/docs/models — Codex and Work are separate product surfaces; **GPT-6.1 Sol defaults to 500,000**, availability depends on workspace/rollout. Subscription usage is not the same billing path as per-token API usage.
3. https://learn.chatgpt.com/docs/config-file/config-reference — Codex config keys `model_context_window`, `model_auto_compact_token_limit`, `model_post_turn_compact_threshold_percent`, etc. Documentation for an override does NOT guarantee that a provider/model catalog will honor its requested size.

## Verified open-source Codex mechanism

At https://github.com/openai/codex/blob/main/codex-rs/models-manager/src/model_info.rs the function `with_config_overrides` resolves an explicitly requested context as `min(requested_context_window, max_context_window)` when a catalog maximum is present. This is a **silent clamp** in the inspected code path.

At https://github.com/openai/codex/blob/main/codex-rs/protocol/src/openai_models.rs the `ModelInfo` methods `usable_context_window` and `auto_compact_token_limit` derive respectively `raw * effective_context_window_percent / 100` and `min(configured_limit, raw * 90% )` when a raw model window is known. Common catalog values report 95% usable.

An illustrative catalog entry `context_window=272000`, `max_context_window=872000`, `effective_context_window_percent=95` yields:
- No override: 258,400 usable; ordinary auto compaction 244,800.
- 500,000 override: 475,000 usable; ordinary auto compaction 450,000.
- 1,000,000 override: **clamped raw to 872,000**, 828,400 usable; compaction limited to 784,800 even if user requests 900,000.

This arithmetic is a source-grounded description of Codex client resolution, not proof of the backend model's physical maximum. The 872K catalog cap is not justified by public source; although 1,000,000 minus 128,000 equals 872,000, that numerical coincidence is **not evidence** of an output-reservation policy, particularly because API spec says 1,050,000 total.

## Public runtime reproductions (third-party issue reports, not OpenAI's confirmed root-cause statements)

- https://github.com/openai/codex/issues/47805 — GPT-6 Sol CLI, requested 1M, runtime `token_count.info.model_context_window=828400`. Changing requested to 800K yielded 760K, matching client clamp.
- https://github.com/openai/codex/issues/41325 — in a GPT-5.6 Sol case a researcher raised the *bundled* max in a rebuilt CLI, but ChatGPT-authenticated runtime still had 828,400; compatible with the **remote catalog overriding bundled settings**. Cross-model mechanism corroboration, not a direct GPT-6 production proof.
- https://github.com/openai/codex/issues/59022 — reported GPT-6.1 Sol default changed server-side around 11 Oct 2026 from 272K to 500K, with effective 258.4K to 475K.
- https://github.com/openai/codex/issues/53336 — same model, same session/process reportedly fell from 475K to 258.4K between turns, with a 500K-versus-272K catalog/cache reload investigation and controlled server catalog variations by client `originator` and account. **This does not prove the exact rollout logic**.
- https://github.com/openai/codex/issues/33593 — controlled reports of different server model catalogs keyed to client originator, written to a shared cache that can oscillate.
- https://github.com/openai/codex/issues/53584 — GPT-6 Astra reports of actual compaction near 500K *displayed* despite an internal threshold 784,800: the internal compaction counter differed materially from most recent displayed usage. This is a **distinct accounting/visibility problem**, not proof the configured threshold was 500K.

The public issue reports make the mechanics and discrepancy credible and reproducible, but their complete findings have not been independently reproduced by us in the exact Process4 hosted environment. They do not constitute an official OpenAI support resolution.

## Four different numbers must never be conflated

1. **Model API capability:** 1,050,000 total tokens.
2. **Product/catalog raw default or override maximum:** e.g. 272K, 500K, or 872K. May depend on remote model metadata, client originator, account, rollout, and cache.
3. **Usable context as reported by Codex runtime:** e.g. 258,400, 475,000, 828,400 after 95% headroom.
4. **Automatic-compaction threshold and actual counting basis:** usually 90% of selected raw window, with separate instrumentation/accounting caveats. A displayed latest-turn count does not necessarily equal the internal compaction-scope count.
