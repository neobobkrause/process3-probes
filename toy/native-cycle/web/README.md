# Workshop card quote web module

Run from the repository root:

```sh
python3 toy/native-cycle/web/app.py --provider-path toy/native-cycle/provider --host 127.0.0.1 --port 8765
python3 -m unittest discover -s toy/native-cycle/web -p 'test_*.py' -v
```

The app loads pricing and quantity bounds from the explicitly supplied provider directory. It binds only to loopback, performs no persistence, and formats integer cents without floating point arithmetic.

Correction completed: validation responses retain rejected text for editing and HTML-escape the input value. The quantity field uses `type="text"` with `inputmode="numeric"` so browsers preserve invalid text, while visible provider-derived bounds and server-side ASCII integer validation remain in place. Missing and duplicate quantities return HTTP 400. Regression coverage verifies retention, escaping, and recovery after a valid submission.

## Current pilot characterization — unfinished

The real-HTTP regressions now inject provider minimums 2 and 7 independently of
provider integration. Both fresh `/` and the `/` destination of Start again render
quantity `1` rather than the injected minimum. The initial pilot suite reports
14 tests with four failing subtest assertions (fresh and Start again for each
minimum). `app.py` is unchanged in this characterization phase; no faulty code was
introduced to produce those failures. The earlier 12 test methods still pass.

This is INCOMPLETE module work. A later explicit ARCH correction phase must derive
the fresh default from the loaded provider, while preserving submitted invalid
text and existing escaping. The failing tests and unfinished work are left for
controller preservation and supported interruption/recovery on the same branch/PR.
