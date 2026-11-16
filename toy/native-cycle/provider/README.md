# Workshop card quote provider

`quote_provider.price_for(quantity)` returns an integer total in cents at 250
cents per card. Quantities must be integers from 1 through 100 inclusive.
Booleans, other types, and out-of-range quantities raise `ValueError`.

Run tests from the workspace root:

```sh
python3 -m unittest discover -s toy/native-cycle/provider -p 'test_*.py' -v
```
