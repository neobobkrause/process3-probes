#!/bin/sh
# Verifies, for each provider carried to the product's main branch, that its commented files change no running code
# there: builds main (0dea5a6) with and without the commented files and runs the tool's comments-only check.
#   sh adaptor/main-check.sh [work folder]
cd "$(dirname "$0")/.." || exit 1
W=${1:-work/main-check}
MAIN=0dea5a6efdd24dd5b74a08c231a9603848ad7d5d
for pair in ai-runs:commented/ai-runs/96-before op-declarations:commented/op-declarations/95-before ai-use:commented/ai-use/105-before wizard-scripts:commented/wizard-scripts/98-before ai-accounts:commented/ai-accounts/main-0dea5a6; do
  p=${pair%%:*}; dir=${pair#*:}
  node adaptor/build.mjs --repo .cache/civicsmith-copy.git --commit $MAIN --list $p --out $W/$p-real >/dev/null
  node adaptor/build.mjs --repo .cache/civicsmith-copy.git --commit $MAIN --list $p --overlay $dir --out $W/$p-com >/dev/null
  echo "$p ($dir): $(node ../notice-proof/tool/p3tool.mjs check $W/$p-com $p --comments-only-against $W/$p-real | grep 'comments only')"
  rm -rf $W/$p-real $W/$p-com
done
