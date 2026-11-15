#!/bin/sh
# Reruns the replay from this branch, in one command, from the repository root:
#
#   sh notice-replay/rerun.sh            the notices (design 7 and the tool on this branch), comparisons, effort
#   sh notice-replay/rerun.sh --tests    also the users' own tests (several hours in a 4-core container)
#
# Needs Node 22, git and network access to github.com (to clone the public product repository read-only, once) and to
# the npm registry. Writes only under notice-replay/ (results/, .cache/ and work/, the last two ignored by git).
set -e
cd "$(dirname "$0")"
R=.cache/civicsmith-copy.git
if [ ! -d "$R" ]; then
  mkdir -p .cache
  git clone --bare https://github.com/neobobkrause/civicsmith-copy "$R"
fi
(cd ../notice-proof && npm ci --no-audit --no-fund)
# design 7 exactly as the proof left it (commit 10ad3d9), beside the tool on this branch
D=.cache/design7
if [ ! -f "$D/notice-proof/tool/p3tool.mjs" ]; then
  mkdir -p "$D"
  git -C .. archive 10ad3d9 notice-proof/tool | tar -x -C "$D"
  ln -sfn "$(cd ../notice-proof && pwd)/node_modules" "$D/notice-proof/node_modules"
fi
mkdir -p results/logs
node replay/run.mjs --tool "$D/notice-proof/tool/p3tool.mjs" --out results/notice-design7 --work work/run7 --jobs 1 | tee results/logs/rerun-design7.log
node replay/run.mjs --out results/notice --work work/run --jobs 1 | tee results/logs/rerun.log
node replay/run.mjs ai-runs:96 --commented-users commented/user-plan-work/2d52c515fa --out results/notice-plan-work-followed --work work/runpw --jobs 1
node replay/compare.mjs --notice results/notice-design7 --name design7 > /dev/null
node replay/compare.mjs
node replay/expected-vs-tool.mjs
node adaptor/effort.mjs
sh adaptor/main-check.sh
if [ "$1" = "--tests" ]; then
  node replay/tests.mjs ai-runs:96
  ./replay/tests-all.sh
  node replay/compare.mjs
fi
