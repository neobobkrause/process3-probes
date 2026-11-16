# Workshop card quote web module

Run from the repository root:

```sh
python3 toy/native-cycle/web/app.py --provider-path toy/native-cycle/provider --host 127.0.0.1 --port 8765
python3 -m unittest discover -s toy/native-cycle/web -p 'test_*.py' -v
```

The app loads pricing and quantity bounds from the explicitly supplied provider directory. It binds only to loopback, performs no persistence, and formats integer cents without floating point arithmetic.

Correction completed: validation responses retain rejected text for editing and HTML-escape the input value. The quantity field uses `type="text"` with `inputmode="numeric"` so browsers preserve invalid text, while visible provider-derived bounds and server-side ASCII integer validation remain in place. Missing and duplicate quantities return HTTP 400. Regression coverage verifies retention, escaping, and recovery after a valid submission.
