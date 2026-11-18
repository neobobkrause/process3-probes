# Trust layer design review, 4 Nov 2026

Read-only review of tranche f9e82ad, asked for by the coordinator on Bob's word: "a design
review of the trust layer, aimed at simplifying it, not adding to it." No code was changed.

Scope read in full: tool/lib/gate.mjs (548 lines), merge.mjs (706), record.mjs (415),
anchor.mjs (95), workflows.mjs (296), shims/ (process-gate.yml, process-record.yml,
process-dev-release.yml, settings.hooks.json, CLAUDE.process.md), and what they call to decide
trust: github.mjs verifyRow, checks.mjs (generated rows), basered.mjs, found.mjs foundOnly,
p3.mjs record-check. Between 7f50bdd and f9e82ad these trust files grew by 1,527 lines and lost
152 (git diff --stat); workflows.mjs, anchor.mjs and basered.mjs are wholly new.

The security outcomes every proposal is measured against:
- O1: no unreviewed code reaches a trusted branch (main, the tranche).
- O2: no session can widen its own approvals (approvals block, .claude/, config anchored keys).
- O3: the gate runs from a trusted base (its code and policy cannot come from the change it judges).

One framing point first. README.md:129 says the tool's checks hold against mistakes, and that
"deliberate attacks by a session with Write access are held by GitHub's walls (rulesets,
required checks, ...), not by the tool." Most of the 4 to 5 review rounds on approvals,
workflows and generated files were spent closing deliberate constructions (a U+2028 line break
in YAML, two config edits that compose in a line merge, a PR retargeted after its run, a side
branch dated ahead). Either the README's line is the policy, and much of that code can go, or
the tool is meant to stop a hostile session, and then the README is wrong and the walls need
measuring. Bob should pick one; the proposals below assume the outcomes O1 to O3 still hold
against a hostile session, and say where they lean on a wall.

## 0. Fix first: one place where O3 does not hold today

shims/process-dev-release.yml:133-135, job publish, reads the tranche's name from the pushed
commit's own config (`git -C repo show "$GITHUB_SHA:process/config.json"`) and then checks the
commit is an ancestor of `origin/<that name>`. A commit whose config names its own branch
(for example `"tranche": "p3dev-release/x"`) passes trivially. The same step takes
process_repo, the pin and `release.sign_secret` from that commit, and the job holds
`contents: write` and the named secret. Separately, a push trigger runs the pushed commit's
copy of the workflow file, so no check written inside this file can bind a session that can
push the branch: it can push a different file.


At Corrie the clerk wrote down 11 plums.

Simplest fix, which also removes code: trigger the release by `workflow_dispatch` on the
tranche ref (`gh workflow run process-dev-release.yml --ref <tranche>`), so the file, the
commit, the config and the pin all come from the trusted branch, and put the signing secret in
an environment whose deployment branch rule allows only the tranche. The ancestry check and the
branch-name version parsing go; the version becomes a dispatch input. Lines: about -10 in the
shim, release.mjs `version --branch` simplified. Risk: low. Tests: release.test.mjs, shims.test.mjs.
This needs Bob for the environment (sessions may not change it).

process-record.yml:30 has the same shape (tranche name from the pushed commit) but it is not a
required check, so it only misreports; it can read the name from origin/main's config instead.

## 1. Where each check reads its code and policy today

| Check | Code (tool) from | Policy (config, ledger) from | Workflow file from |
|---|---|---|---|
| gate, job gate | base's `.process` pin (process-gate.yml:57); head's pin at bootstrap (:58); the tranche's pin for the tranche into main when it descends on process3 (:76-87) | base's config (:64), head's at bootstrap (:65); gate.mjs:59 `lastConfigAt(base)`; bootstrap takes the head's RUN_KEYS (gate.mjs:55-71) | the merge commit, so the head's |
| gate, ledger entries and ownership | as above | **the head's** ledger (gate.mjs:103 `entriesAt(root, head)`, used for ownership at :110 and scope) | head's |
| gate, job post | base's pin only (process-gate.yml:151) | base's config | head's |
| record check in the gate | base's pin | `loadConfig(root, base)` (p3.mjs:413); record_since from the head (record.mjs:137); take-in tips from the head's metrics (record.mjs:172) | head's |
| process-record (push) | origin/<tranche>'s pin, else the pushed commit's (:203-204) | the pushed commit's config names the tranche (:30) | pushed commit's |
| record-pr (process3 only) | main's tool | main's config | main's (pull_request_target) |
| merge (job PR) | BOB's checkout of the tool | `loadConfig(root)`, the **working tree** (merge.mjs:118); entry from the merge base (:157) | n/a |
| merge --plain | BOB's tool; `processRepo()` is the tool's own clone (merge.mjs:448) | base's last config (:610), base's ledger (:632), base's generated rows | n/a |
| close workflows (rules 1 to 4) | BOB's tool | structure from the base's copy of each workflow (workflows.mjs:293); record_since from the head (:233); pin and gate shim at each gated commit (:216) | n/a |
| dev release | pushed commit's pin | pushed commit's config, tranche name and secret name (:133-141) | pushed commit's |
| setup check | the pin | settings.hooks.json at the pin | n/a |

Today there are at least six different answers to "what is trusted": the base commit, the
base's last config, the head (bootstrap), the tranche's pin (into main), the working tree
(merge), and the pushed commit (release, record push).

**Proposed single rule.** Code and policy come from the current tip of a trusted branch, read
by name from origin: for a pull request into X, the tip of X; for the tranche into main, the
tranche tip itself (it is a trusted branch, and the head must equal it). The tool is the
`.process` pin at that tip; config, ledger entries, generated rows and the owner are read from
that same tip. Nothing in the head is read except as data being judged. A missing config or pin
at that tip fails closed; there is no fallback.

What the rule removes or simplifies:
- The tranche-into-main pin exception (process-gate.yml:68-87, 20 lines): replace with one
  test, `HEAD_SHA = origin/<tranche>` tip, then the tranche's pin judges.
- Bootstrap routes (section 2, item B).
- `lastConfigAt` (anchor.mjs:66-70) and its four callers: a deleted config fails closed.
- merge.mjs:118 reads the working tree's config; it should read `origin/<tranche>`'s.
- gate.mjs:103 reads the head's ledger for ownership; reading the base's (as merge already does
  at merge.mjs:157) makes the gate and merge agree.

## 2. Special cases, carve-outs, bypass flags and tolerances

Each with where it is, what it protects, and whether a general rule makes it unnecessary.

A. **Tranche cover** (gate.mjs:336-404 trancheCover, :423-458 jobMerge, :413-422 branchBound,
github.mjs:148-156 the `merged` branch of verifyRow). Protects the 45 min cap on the tranche
into main by skipping suites of files a green job merge already gated. Needs title regexes,
tree equality, PR reads, branch binding against retargeted PRs, provider-change propagation.
General rule that removes it: every tranche commit's tree is a gated merged result by
construction. merge already gates the merged result for job PRs (merge.mjs:200-210); require
"branches up to date" on the tranche's ruleset so plain PRs are too, and make a PR's gate scope
include modules that use the changed ones (the provider rule, moved to scope selection). Then
the tranche into main only checks that the tip's merge was gated green (one verifyRow) and
reruns what was tolerated on the way. Needs Bob's ruleset change.

B. **Bootstrap, the first close** (process-gate.yml:55-65 and :149-152; gate.mjs:44-71
gateConfig and RUN_KEYS; merge.mjs:525-535 bootstrapHead, :612-618, :674-678, :682; anchor.mjs:72-73
isBootstrap). Protects a product whose main has no Process3 yet. General rule: onboarding ends
with Bob's own website commit putting `process/config.json` and `.process` on main, so no base
is ever without Process3. One owner act per product, which README's Onboarding already asks of
him (values confirmed once). Check first: if civicsmith-copy's main now holds both files (its
first close landed on 4 Nov), this route is dead code for the only product.

C. **record_since and earlier work** (record.mjs:125-150 recordSince, :247-249 onBase, :362-376
the record_since half of the config check; workflows.mjs:222-240 earlierWork; p3.mjs:415).
record_since is "used only while the base has no config" (record.mjs:138). Under B's rule every
base has a config, so recordSince always returns null and all of this goes.

D. **Take-in tips** (record.mjs:152-221 takenIn, p3.mjs:416-419, job.mjs:837). Protects the
record check from flagging pre-Process3 commits that a take-in merged. General rule: a take-in
brings earlier work in as one new commit of its tree (not a merge of its history), so no old
commit is ever in a checked range. The old branch keeps its history. Removes about 70 lines
and the six-step honour test.

E. **Base-red tolerance** (gate.mjs:186-200; basered.mjs, 114 lines; revertCheck `tolerated`
gate.mjs:526-547; receiptAgrees base-red branches :296-303; job.mjs callers). Protects a PR
from failures already on the base. Under A's rule the tranche is green at every tip, so
base-red only covers flakes and drift. It can go once A holds; until then keep it. Highest
risk to throughput, so ranked low.

F. **Records-only fast paths for a ready job PR** (gate.mjs:124-152 sinceGreen, stands,
receiptRun; :309-320 measuredBy; :254-256 refresh carry-over; :266-275 receipt measured;
merge.mjs:299-306 unagreed). Protects gate minutes on records-only pushes. Three review rounds
(copy PRs 105, 247). General rule: a ready job PR's gate always runs its module's suite; keep
the record fast path only for drafts and plain PRs. Cost: one suite run per records-only push on
a ready job PR, which merge's merged-result push mostly triggers anyway.

G. **Generated-file refresh by a plain PR** (gate.mjs:120-127, :240-262; checks.mjs:96-120
refreshOthers, refreshCheck; merge.mjs:573-584 refreshGate, :646-662). Protects committed
generated files from hand edits. Five review rounds (PR 95). General rule: no module's generated
file is committed. JOB-8 already forbids a job committing one (checks.mjs:70 committedGenerated),
and buildGenerated (gate.mjs:172-179) builds untracked rows before the suite, as deploy and
release do. Extend JOB-8 to every PR and the refresh route goes. Bob's 4 Nov approval for the
design stream already allows "stop committing a generated file ... and have it built where it
is needed".

H. **Found marks in a requirement file by a plain PR** (merge.mjs:633-645; found.mjs:51-89
foundOnly, a markdown diff parser). found.mjs already has a second home for marks,
`process/found/<module>.md` (found.mjs:15-17), which is a records path. General rule: found
marks always go there. The exception and foundOnly go; the module's requirement file stays
job-only.

I. **Close workflow changes, rules 1 to 3 and shapes S1 to S3** (workflows.mjs, all 296 lines;
merge.mjs:504-516 the `close` branch). See section 3.

J. **Approvals and settings across merges** (record.mjs:105-123 introduced with guarded and
judged; :259-283 landed, onTrusted, cleanFrom, mergeBases; :322-333 fromTrusted, carried
"review A"; :52-71 ownerBlock per ref). Protects O2 for merge commits that carry an old block
from one side. See section 3, item 2.

K. **Anchored config keys** (anchor.mjs:8-59 keyAt, keySetAt, unanchored; :81-95
mergedUnanchored, a merge-tree composition check; merge.mjs:473-489 pinChange). Protects O2 for
process_repo, tranche and approvals. Duplicated: record.mjs:362-376 judges the approvals key in
the config again, per commit, with its own JSON reading. See section 3, item 3.

