#!/bin/sh
# Runs the users' tests before and after every replayed change, one change at a time (replay/tests.mjs).
# Skips a change whose result is already written. Logs to results/logs/.
cd "$(dirname "$0")/.." || exit 1
mkdir -p results/logs
for c in $(node -e "import('./adaptor/state.mjs').then(m=>console.log(m.CHANGES.map(c=>c.change).join(' ')))"); do
  f="results/tests/$(echo "$c" | tr ':' '-').json"
  [ -f "$f" ] && continue
  node replay/tests.mjs "$c" > "results/logs/tests-$(echo "$c" | tr ':' '-').log" 2>&1
done
