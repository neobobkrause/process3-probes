# Internal product walk — Workshop quote

Performed by native ARCH on 2026-11-16 at 21:05:58 UTC, against UX_SCREENS.md. This is the prescribed internal walk, using code inspection plus actual fetched HTML from the running development service. It is not a claim of a visual browser walk; a separate external walker follows UX_JOURNEYS.md.

Tested integration SHA: `7fbcbd444c748179ad76220c22c3d0f93f6ad901` (PR #274 merged after fresh exact-head green gate through the pinned process tool). Deployment worktree: `/workspace/work/p4-native-cycle/deployment`, detached at that exact SHA. Service: `http://127.0.0.1:8765/`. Persistent supported exec session ID: `71660`; observed Python PID: `22627`.

Started from deployment worktree with:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 toy/native-cycle/web/app.py --provider-path toy/native-cycle/provider --host 127.0.0.1 --port 8765
```

Service remains running for the external walker in this existing OpenAI-managed environment. No public hosting or durable deployment is claimed.

| Screen | Actual final observations | Finding |
| --- | --- | --- |
| S1 form | GET / returns 200 and text/html; charset=utf-8. Title/h1 Workshop card quote, label linked to quantity input, default1, Get quote submits GET /quote. Visible $2.75 and Allowed range: 1–50. Final type=text/inputmode=numeric, min1/max50. | PASS |
| S2 result | GET /quote?quantity=12 returns200, Your quote, Quantity12, unit$2.75, total$33.00, id=quote-result, Start again home link, editable input12. Quantity50 returns$137.50. Subsequent quantity2 returns$5.50 without an alert. | PASS |
| S3 error | quantity51,0,abc,missing and duplicate quantity all return400, current bounds alert, usable labelled form, no quote-result. abc remains value=abc. Percent-encoded `<script>` returns escaped `value="&lt;script&gt;"`, no raw executable tag. 51 remains available for editing. | PASS |
| S4 unknown | GET /missing returns404 with readable Not found and href=/ home link, without traceback/path detail. | PASS |

Code inspection confirms totals call the injected provider's price_for, displayed rate and bounds read its constants, HTML values use html.escape, currency uses integer cents, and bind choices are loopback-only. This complements the actual response observations above; it does not substitute module tests for the walk.

## Earlier variant and interruption evidence

Initial provider250 cents/max100 and web reset-to1 were separate earlier integrated versions (provider PR271, web PR272). Their module tests and source review are recorded, but this document does not fabricate an earlier development-service walk. Final values deliberately differ because provider PR273 revised the rate and bounds. UX_SCREENS explicitly distinguishes initial number input from final corrected text input; the correction is required for browser retention of nonnumeric text.

Web attempt2 wrote genuine retention regressions and ran10 tests with4 failed assertions; app.py remained unchanged. It reported INCOMPLETE and remained running. ARCH native interruption returned previous_status=running. Controller preserved interrupted head `6ae1ca7e5967f400c0e60bb58e575208b4e06ff2` in draft PR274 with accepted=false. A distinct replacement native JOB completed the fix from that head; fresh controller module verification passed12 web tests. Provider module verification passed4 tests.

The replacement's ordinary test import generated one untracked provider bytecode artifact outside ownership. Controller rejected it before preservation. ROOT authorized an exact mechanical quarantine after verifying untracked status and worktree containment: `/workspace/work/p4-native-cycle/quarantine/web3-provider-bytecode.pyc`, audit in adjacent `web3-provider-bytecode-audit.json`. No provider source changed. Replacement prevented future bytecode in its own web test setup; fresh checkpoint ownership/verification then passed.

Provider notices were created for both declared users web and report. Native followup delivered the revision immediately to web; replacement generation3 received the durable logical notice and reported actual first-processing timestamp1794863028.9048054, recorded by controller ack. Web integration consumes its product notice; report remains pending for future assignment. These are integration controls, not a fourth product test.
