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
```

The default readable table shows quantity, unit price and that alternative's total.
`--format json` prints the public model. Invalid CLI input exits 2 with an error on
stderr and no partial result on stdout. Quantities are comma or newline separated
unsigned ASCII decimals with optional surrounding token whitespace; empty tokens,
duplicates after integer normalization, signs, fractions and exponents are invalid.

The library API `build_comparison(provider, quantities)` accepts a list or tuple of
1–8 distinct integers (excluding bool), checks all quantities before pricing, and
raises `ValueError` for invalid input. Its result contains `min_quantity`,
`max_quantity`, `unit_price_cents`, and ordered `rows` of `quantity`/`total_cents`.
Provider loading does not write bytecode into the injected provider directory.

This accepted first phase implements the comparison model and text/JSON CLI only.
The already planned second report phase adds `to_csv(comparison)` with fixed
`quantity,unit_price_cents,total_cents` columns and CRLF, and CLI `--format csv`.
CSV is not claimed implemented by this phase.

Run the module tests:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s toy/native-cycle/report -p 'test_*.py' -v
```
