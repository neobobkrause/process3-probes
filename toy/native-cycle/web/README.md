# Workshop card quote web module

Run from the repository root:

```sh
python3 toy/native-cycle/web/app.py --provider-path toy/native-cycle/provider --host 127.0.0.1 --port 8765
python3 -m unittest discover -s toy/native-cycle/web -p 'test_*.py' -v
```

The app loads pricing and quantity bounds from the explicitly supplied provider directory. It binds only to loopback, performs no persistence, and formats integer cents without floating point arithmetic.

Known unfinished correction: validation responses currently reset rejected input to `1`. A later correction must retain the rejected text in the input value for editing, HTML-escape that text, and add regression coverage. S3 permits this initial shortcoming; it is not yet corrected.
