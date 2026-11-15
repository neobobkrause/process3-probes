#!/bin/sh
# Runs the users' tests before and after the replayed changes that broke a user (judged), one change at a time
# (replay/tests.mjs). A full run of every change was started first and stopped: one change took over 80 minutes in this
# container. Skips a change whose result is already written. Logs to results/logs/.
cd "$(dirname "$0")/.." || exit 1
mkdir -p results/logs
for c in ${@:-ai-runs:96 op-declarations:95 ai-use:105 wizard-scripts:163 ai-accounts:124 ai-accounts:316 ai-catalogue:484}; do
  f="results/tests/$(echo "$c" | tr ':' '-').json"
  [ -f "$f" ] && continue
  node replay/tests.mjs "$c" > "results/logs/tests-$(echo "$c" | tr ':' '-').log" 2>&1
done
