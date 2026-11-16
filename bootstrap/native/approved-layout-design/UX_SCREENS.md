# Approved-layout cycle: provider minimum and usable default

This is a controlled revision of the existing workshop-card quote proof app, not a new product or a reset. It verifies the newly approved ROOT/ARCH/JOB arrangement with substantive module work and the existing three product stages. No purchase, account, public deployment or external service is introduced.

ARCH technical decision: workshop-card quotes now require at least two cards. Provider changes only `MIN_QUANTITY` from 1 to 2; `MAX_QUANTITY=50`, `UNIT_PRICE_CENTS=275`, integer-only validation (excluding bool), `price_for` signature and integer cents remain. Valid examples: 2=$5.50, 12=$33.00, 50=$137.50; 1 and 51 are invalid.

Code inspection of the completed baseline found `Handler.page(quantity=1)`. With a raised provider minimum, GET / would therefore offer an invalid starting value. The web revision must derive its fresh-form value from the injected provider minimum; it must not hardcode 2. Rejected submitted text remains exactly retained/escaped, including 1 or empty input, and must not be replaced with the default.

## S1 — GET /

200; Workshop card quote title/h1, Quantity label/text input, inputmode=numeric, min=2/max=50/value=2, price $2.75 and range 2–50. Submitting the unchanged fresh form gives a valid $5.50 quote. Default follows injected provider configuration, not a literal 2.

## S2 — GET /quote?quantity=2 (and 12/50)

200 with quote result, submitted quantity and exact total ($5.50/$33.00/$137.50), no alert. Start again leads to a fresh form with 2. Refresh is harmless.

## S3 — invalid quantity

400 for 1, 0, 51, missing, duplicate, empty, text, non-ASCII digits, sign/exponent/decimal syntax. Actionable current bounds 2 to 50; no quote result. Keep the rejected input text safely escaped. A subsequent valid 2 has no stale alert/text. HTML payload does not become markup. Current UTF-8/label/loopback protections remain.

## S4 — unknown route

404 readable Not found and home link; no traceback/filesystem information.

## Module ownership and acceptance

Provider JOB owns only `toy/native-cycle/provider` and its own tests/README; web JOB owns only `toy/native-cycle/web` and its own tests/README. Do not edit the other's module, bootstrap/process/grants/settings/pin. Provider tests cover min 2 and adjacent rejection 1, max 50/51, ordinary totals and invalid types including bool. Web tests make actual loopback HTTP requests and include a different injected minimum (for example 7) to catch hardcoding. Preserve bytecode prevention when importing provider.

Provider changes notify **both** declared users, web and report. Report has no assignment/session; preserve its compact pending recovery range, do not claim it awakened or invent report development. Web receives a native notice and performs its own scoped consumer correction. First-processing acknowledgement does not consume its product obligation until accepted integration.

## Internal walk

After both module integrations, ARCH inspects actual final source and rendered HTTP responses against S1–S4 and records findings with exact integration SHA. Module success alone does not establish this walk. No new product test stage is added.
