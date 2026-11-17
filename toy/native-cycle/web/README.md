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
