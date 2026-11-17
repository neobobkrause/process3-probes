# Quantity comparison design knowledge

Status: ARCH accepted this product design through the actual registered lane on 2026-11-17. This is a disposable proof-app requirement and authorized design output; it is not an owner policy, grant change, governing process adoption, observed product result or proof of a completed stage.

The exact owner need is retained in `bootstrap/OWNER-RELIABILITY-ASSESSMENT-20261116.txt`. Item 3 explicitly requests a qualified design lane, question routing through ARCH, preservation of design knowledge, and integration of authorized design output. The lane is `/root/p4_root_g2/p4_arch_g5/p4_lane_quote_comparison_g1`, generation 1, owned design folder `bootstrap/native/approved-layout-design/quote-comparison`. ARCH confirmed actual registration before this lane wrote files. Product code remains exclusively with module JOBs.

## Questions routed through ARCH and actual answers

The lane inspected the existing app/provider and sent four substantive design questions to ARCH through native collaboration, not the owner or GitHub:

1. Should the grammar accept comma/newline separated unsigned ASCII integers, strip surrounding whitespace, reject empty tokens and duplicate quantities, preserve input order, and validate 1–8 alternatives atomically? **ARCH accepted**, explicitly including rejection of trailing separators, signs, decimals, exponents, non-ASCII digits and duplicates after integer normalization.
2. Should the report API be `build_comparison(provider, quantities)` returning provider bounds/unit price plus ordered quantity/total rows, with `to_csv(comparison)` using fixed integer-cent columns and CRLF? **ARCH accepted.** Reject bool/noninteger/out-of-bounds inputs and invalid sequences. Alternatives are not an order; do not sum them or invent discounts.
3. Should `/compare` show a fresh form and submitted comparison, `/compare.csv` download the same alternatives, and invalid submissions retain escaped raw textarea input with HTML 400 responses? **ARCH accepted**, clarifying that fresh no-query `/compare` differs from a submitted missing/empty quantities query, that duplicate query parameters return 400, and that the fresh examples are valid provider-derived unique values. Existing quote behavior and navigation remain.
4. Should optional `report_path` injection and `--report-path` default to the sibling report module so the existing deployment plan still works? **ARCH accepted.** Tests can inject independent report/provider modules without waiting for report integration.

ARCH additionally chose a genuine queued delivery sequence: report comparison model and CLI text/JSON first, then a second report attempt for CSV/CLI CSV while the independent web module implements the complete UI with a report stub. The final web acceptance must verify the actual integrated report baseline, not merely the stub. This sequence belongs to ARCH scheduling; it does not weaken final acceptance or add a product stage.

## Frozen decisions and rationale

`interface-contract.json` preserves the accepted public contract before parallel JOB source work. Integer cents avoid rounding drift. Fixed numeric CSV columns avoid treating submitted text as spreadsheet formulas. A single all-or-nothing comparison prevents a misleading partially valid shortlist. Raw invalid textarea text remains editable and safely escaped. Labels, real table headers/caption and ordinary links keep the interface understandable and operable. Comparison rows are explicitly alternatives; each has its own total.

The current provider is minimum 2, maximum 50, unit price 275 cents. Fresh examples are 2, 12 and 50; when bounds vary, clamp these example quantities into the valid range and deduplicate in order. This preserves usable fresh input for narrow/injected providers. The accepted implementation must derive prices/bounds through the provider, not these sample numbers.

## Ownership and handoff

- Report JOB: `toy/native-cycle/report` only; model, CSV, CLI, own tests/README.
- Web JOB: `toy/native-cycle/web` only; comparison presentation, query grammar, HTTP/CSV response, own tests/README.
- This lane: this design folder only; no product edits, commits, pushes, provider mutations or subagents.
- ARCH: freezes contract, routes module questions, accepts product design and integrates authorized outputs.

`UX_SCREENS.md` and `UX_JOURNEYS.md` define the final walk scope. They are requirements, not execution receipts. Genuine findings return to the responsible module and the necessary walks repeat on the new exact integration head. No defect is inserted to force a correction round.
