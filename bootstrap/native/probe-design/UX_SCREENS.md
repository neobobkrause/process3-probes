# Workshop quote — internal walk reference

A small development-only tool prices batches of printed workshop cards. No purchase, account, persistence, or external request occurs. All prices are USD. Python 3 standard library only.

## Product contract

Provider owns `toy/native-cycle/provider/quote_provider.py` and its own tests. Export `MIN_QUANTITY = 1`, `MAX_QUANTITY = 100`, `UNIT_PRICE_CENTS = 250`, and `price_for(quantity) -> int` returning total cents. Accept Python integers only (explicitly reject bool), inclusive bounds; raise ValueError for all invalid inputs. Initial examples: 1 → 250, 12 → 3000, 100 → 25000. No float currency arithmetic.

Web owns `toy/native-cycle/web/` and its tests. `app.py` imports `quote_provider` using the directory explicitly provided by `--provider-path`; no copied price implementation. It exposes an importable `create_server(host, port, provider_path)` suitable for tests plus a CLI `python3 toy/native-cycle/web/app.py --provider-path toy/native-cycle/provider --host 127.0.0.1 --port 8765`. Reject non-loopback bind addresses. Use HTTPServer/ThreadingHTTPServer, urllib.parse, html.escape, argparse, importlib/sys.path and unittest only. Tests may inject a temporary provider directory to prove provider configuration is honored. Do not mutate provider sources.

## S1: quote form — GET /

HTTP 200, UTF-8 HTML, title and h1 “Workshop card quote”. Visible label “Quantity”, associated input named quantity, default 1, current provider min/max attributes (initial implementation type=number; final corrected implementation type=text with inputmode=numeric, as explicitly required by the correction scenario), and “Get quote” submit button. Form uses GET /quote. Visible unit price and allowed range come from the loaded provider, formatted as dollars with two decimal places.

## S2: quote result — GET /quote?quantity=12

HTTP 200; form remains available with submitted quantity, result heading “Your quote”, quantity, unit price and total `$30.00` for initial provider. Link “Start again” to /. Mark result section meaningfully for inspection (id=quote-result). Browser refresh is harmless.

## S3: validation error — GET /quote?quantity=0 (also missing, duplicate, empty, noninteger, or out of bounds)

HTTP 400; same title/form, clear error “Enter a whole quantity from 1 to 100.” using current provider limits, accessible role=alert. No total/result section. User input is escaped. Initial implementation may reset invalid input to 1; a later correction explicitly requires preserving the rejected text in the input value for editing. That correction must change the field to type=text with inputmode=numeric, since browsers sanitize nonnumeric values in type=number fields; retain visible bounds guidance and provider validation. This known shortcoming must be recorded as unfinished until corrected and retested. Numeric syntax accepts only ASCII decimal digits; leading/trailing whitespace may be stripped; reject sign, exponent and decimal notation.

## S4: unknown route

HTTP 404 with brief readable “Not found” and link to /. No traceback or filesystem detail.

## Internal walk procedure

ARCH reviews actual code/rendered response against S1–S4, records status for each screen, then repeats affected screens after the provider revision and correction. Check semantic labels, escaped values, provider-derived range/price, result/error mutual exclusion, and loopback binding. This is the internal product walk using UX Screens; module test success alone is insufficient.

## Provider revision scenario

After initial provider and web integrate, revise provider rate to 275 cents and maximum to 50; keep function signature and validation type semantics. Update provider's tests: 12 → 3300, 50 → 13750, 51 invalid. Every declared provider user receives notice for this exact revision, including `report` which has no assigned job. Web must display `$2.75`, bounds 1–50, total `$33.00` for 12, and reject 51 with current bounds. No web-side business logic patch is needed if correctly dependent on provider. Retest affected screens against the running revised development service.

## Interrupted correction scenario

After revision, assign web a narrow correction to retain rejected input text and test HTML escaping. Require the JOB to send ARCH an INCOMPLETE message after writing and running the failing regression test, then remain active awaiting continuation without implementing the fix. ARCH interrupts that active JOB and checkpoints with outcome=interrupted before replacement. Specifically, interrupt that JOB before completion, preserve its work through the controller, and start a replacement on that preserved head. Replacement completes the fix within web ownership and runs module tests. Do not claim this scenario complete from this plan or a synthetic status event.
