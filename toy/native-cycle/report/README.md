# Workshop quantity alternatives

`quote_report.py` compares 1–8 distinct alternative quantities using an injected
provider. Each row is a separate possible order. There is no combined total,
volume discount, persistence or account operation. Pricing, bounds and integer
cents come from the provider; input order is retained.

```sh
python3 toy/native-cycle/report/quote_report.py \
  --provider-path toy/native-cycle/provider --quantities '2,12,50'
python3 toy/native-cycle/report/quote_report.py \
  --provider-path toy/native-cycle/provider --quantities '50,2' --format json
python3 toy/native-cycle/report/quote_report.py \
  --provider-path toy/native-cycle/provider --quantities '50,2,12' --format csv
```

The default readable table shows quantity, unit price and that alternative's total.
`--format json` prints the public model. `--format csv` writes UTF-8 CSV bytes with
fixed `quantity,unit_price_cents,total_cents` columns, CRLF line endings and rows
in the requested order. Cents are integers without currency symbols or floats.
Invalid CLI input exits 2 with an error on
stderr and no partial result on stdout. Quantities are comma or newline separated
unsigned ASCII decimals with optional surrounding token whitespace; empty tokens,
duplicates after integer normalization, signs, fractions and exponents are invalid.

The library API `build_comparison(provider, quantities)` accepts a list or tuple of
1–8 distinct integers (excluding bool), checks all quantities before pricing, and
raises `ValueError` for invalid input. Its result contains `min_quantity`,
`max_quantity`, `unit_price_cents`, and ordered `rows` of `quantity`/`total_cents`.
Provider loading does not write bytecode into the injected provider directory.

The second report phase adds `to_csv(comparison) -> str` and the CSV CLI format,
preserving the first phase's model and text/JSON behavior. The renderer validates
the entire model before returning any CSV: bounds, unit price, quantities and
totals must be valid integers (not bool), quantities must be distinct and within
bounds, and there must be 1–8 alternatives. It preserves provider-delegated totals
rather than recalculating prices. Arbitrary text or spreadsheet formulas cannot
enter numeric cells. There is no aggregate row or extra blank line.

Run the module tests:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s toy/native-cycle/report -p 'test_*.py' -v
```
