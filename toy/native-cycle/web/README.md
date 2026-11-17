# Workshop card quote web module

Run from the repository root:

```sh
python3 toy/native-cycle/web/app.py --provider-path toy/native-cycle/provider --host 127.0.0.1 --port 8765
python3 -m unittest discover -s toy/native-cycle/web -p 'test_*.py' -v
```

The app loads pricing and quantity bounds from the explicitly supplied provider directory. It binds only to loopback, performs no persistence, and formats integer cents without floating point arithmetic.

Correction completed: validation responses retain rejected text for editing and HTML-escape the input value. The quantity field uses `type="text"` with `inputmode="numeric"` so browsers preserve invalid text, while visible provider-derived bounds and server-side ASCII integer validation remain in place. Missing and duplicate quantities return HTTP 400. Regression coverage verifies retention, escaping, and recovery after a valid submission.

## Current pilot correction — completed module work

The preserved characterization added real-HTTP regressions with injected provider
minimums 2 and 7. It found fresh `/` and the `/` destination of Start again rendered
quantity `1` instead of the injected minimum, producing four failing subtest
assertions across 14 test methods without introducing faulty application code.

After preservation and recovery on the same branch/PR, the correction derives the
fresh default from the loaded provider's minimum. Explicit submitted values remain
separate from that default, so rejected `1`, empty input and escaped text are retained.
The recovered provider contract is minimum 2, maximum 50 and unit price $2.75;
the existing form and validation assertions now reflect that accepted revision.
The full real-HTTP suite passes all 14 test methods, including fresh/Start again
defaults with independently injected minima 2 and 7. This is module evidence only;
integration and final internal/external walks remain the controller/ARCH's work.

## Quantity comparison and CSV

`/compare` adds a labelled editable shortlist of 1–8 distinct alternative quantities.
Separate entries with commas or newlines. Each quantity must use unsigned ASCII
whole-number syntax and fall within the injected provider bounds; empty entries,
duplicates after normalization, signs, non-ASCII digits, decimals and exponents
are rejected together. Error pages retain the raw text safely, including leading
newlines and closing-textarea/script payloads. A valid submission shows a semantic
table of individual alternatives, never a combined order or a claimed discount.
Fresh examples clamp 2,12,50 into the provider range and remove duplicates.

The page links to `/compare.csv` with the same encoded input. Successful downloads
are UTF-8 CSV attachments named `quote-comparison.csv`, with fixed integer-cent
columns and CRLF lines. Invalid downloads return the same editable HTML 400 error,
not a partial CSV. Navigation preserves the existing single-quote flow.

The report module owns comparison calculation and CSV encoding. The web module
calls its `build_comparison(provider, quantities)` and `to_csv(model)` APIs rather
than duplicating pricing. `create_server(host, port, provider_path, report_path=None)`
and optional CLI `--report-path` allow explicit injection; the default is the
sibling `report/quote_report.py`. Report loading is lazy: an unavailable report
returns a readable HTTP 503 for submitted comparisons while single quotes remain
usable. The normal deployment must include the accepted report dependency.

Independent web module work is covered by actual HTTP tests with a temporary
injected report stub, provider bounds/prices, exact CSV bytes, malformed batches,
escaping, ordered alternatives, recovery and the preserved quote tests. The earlier
independent attempt preserved its work with one explicit missing-report skip; it
was dependency-blocked rather than accepted as final module evidence.

After the controller refreshed the trusted baseline with report CSV integration
`191db453b2de66a9cd4bb9d744fa6ac66f28c31b`, the full real-HTTP suite passed all 26
tests with **zero skips**. `test_actual_integrated_report_default_path` executed
against the actual sibling report, verifying ordered comparison rows and exact
CSV bytes for 2,12,50 through the default dependency path. This is module evidence;
final integration, internal Screens and external browser Journeys remain ARCH work.
