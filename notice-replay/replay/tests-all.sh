#!/bin/sh
# Runs users' tests before and after the replayed changes that broke a user (judged), one change at a time
# (replay/tests.mjs). A full run of every user of every change was started first and stopped: one change (ai-runs 96,
# 29 users) took two hours in this container. So ai-runs 96 has every user; the other six changes have only the users
# judged broken or adopted, which answers whether the test run catches them, not how many users it fails for nothing.
cd "$(dirname "$0")/.." || exit 1
mkdir -p results/logs
for c in op-declarations:95 ai-use:105 wizard-scripts:163 ai-accounts:124 ai-accounts:316 ai-catalogue:484; do
  f="results/tests/$(echo "$c" | tr ':' '-').json"
  [ -f "$f" ] && continue
  users=$(node -e "import('./adaptor/state.mjs').then(m=>{const c=m.changeOf('$c'); console.log(Object.entries(c.verdicts).filter(([,v])=>v.outcome==='B'||v.outcome==='A').map(([u])=>u).join(','))})")
  node replay/tests.mjs "$c" --users "$users" > "results/logs/tests-$(echo "$c" | tr ':' '-').log" 2>&1
done
