# [file] trial_plan_facts.md (continued)

            c['affected'] += 1; c['affected_declared_at_base'] += r['user'] in declared
for k, v in c.items(): print(v, k)
```

The seven-change sample used the same resolution, then compared, between first parent and merge: `export` statements of changed source files; `**R<n>**` lines under `## Public` of changed requirement files; and `R<n>` in added or removed test-title lines of changed test files.


# [file] r17c-settings.md

# R17c: the three repositories' `.claude/settings.json`, for Bob to apply

**Apply now, on today's settings, apart from the rest (C15, 7 Nov):** add `"Artifact"` to
`permissions.allow` in the copy's and the probes' `.claude/settings.json` (create `allow` if absent).
It asks a person even in auto mode, and lanes keep their design documents as claude.ai artifacts: an
investigation lane waited on it from ~00:31Z 7 Nov. Nothing else here needs it.

**Apply the rest only after R17c is merged into process3's tranche and pinned on each product** (the
copy's and the probe's `.process` at a process3 commit that holds `github hook`). Each file below
is complete, ready to paste over the repository's `.claude/settings.json` on its tranche. They are
Bob's files: no session writes them.

What they add (coordinator's ruling, 6 Nov; Bob: all GitHub traffic monitored and limited, enforced,
not by rule):

- **PreToolUse hooks**, matcher `mcp__github__.*` and matcher `Bash`, both calling the pinned tool's
  `github hook`. A connector call is counted in the account's ledger and waits or is refused like a
  gh call; a raw `git push`, any `gh`, or curl/wget to github.com is refused. Exit 2 blocks the call.
- **The hook's own entry first (R17d)**: `tool/hook.mjs` in the pinned tool, which loads only the
  hook's modules; a connector read then answers from the clone's cached pause and stop with no
  network call (p95 about 80 ms; a refresh runs in the background, fetching the ledger only when
  `git ls-remote` shows it moved). A pin from R17c, with no `hook.mjs`, runs `p3.mjs github hook`.
- **The hook fails open only when the tool itself is missing**: no pinned `p3.mjs` (the pin not
  filled yet), or one without `github hook` (a pin from before R17c). It says which on stderr and
  exits 0, so such a clone is not bricked. Anything else is closed: a governor refusal exits 2, and
  so does any failure of the tool (it exits 2, never 1, which Claude Code would let through).
  `CLAUDE_PROJECT_DIR` unset, it uses the working directory.
- **Timeout 300 s**: the hook never waits past 2 minutes for the budget (longer, it refuses and
  says to retry the call), well inside the timeout, so it is never killed into letting a call
  through.
- **With the hook installed, `github note` double-counts** a connector write (the hook counts it
  too). Retire the note rule once these settings are applied: the coordinator's call.
- **Deny** `Bash(git push)`, `Bash(git push *)`, `Bash(gh *)` beside each file's existing denies,
  and **allow** the tool's own push: `Bash(node .process/tool/p3.mjs github push *)` in a product,
  `Bash(node tool/p3.mjs github push *)` in process3. Deny wins over allow in Claude Code, so the
  tool's push is allowed only because it is not a `git push` or `gh` command line; its own git push
  runs inside the tool, under the governor.
- **Allow** `Artifact` in each product (C15, 7 Nov: an investigation lane waited from ~00:31Z on
  "permission: Artifact", which asks a person even in auto mode; lanes keep their design documents
  as claude.ai artifacts, within Bob's approvals for Process3 pages on claude.ai). process3 runs no
  lanes and needs none. The suite (admit.test) holds these lists to every tool the process tells a
  session to use.
- Kept: every existing deny entry, and the copy's SessionStart hook
  (`bash "$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh"`).

Notes:
- process3-probes **does** have a `.claude/settings.json` today (its deny list is kept below),
  contrary to the earlier note that it had none.
- `Bash(gh *)` also denies `gh api search/...`, which builder sessions use for code search on
  GitHub; with these settings that search goes through the GitHub connector instead (counted by the
  hook).
- process3 has no SessionStart hook; none is added.

## neobobkrause/civicsmith-copy

```json
{
  "permissions": {
    "deny": [
      "mcp__github__merge_pull_request",
      "Bash(gh pr merge *)",
      "Bash(gh api *pulls/*/merge*)",
      "Bash(git push --force *)",
      "Bash(git push -f *)",
      "Bash(git push --force-with-lease *)",
      "Bash(git push --mirror *)",
      "Bash(git push origin --delete *)",
      "Bash(git push origin HEAD:main)",
      "Bash(git push origin main)",
      "Bash(git push -u origin main)",
      "Bash(git reset --hard *)",
      "Bash(git clean -fd *)",
      "Bash(git clean -fdx *)",
      "Bash(git stash drop *)",
      "Bash(git rebase *)",
      "Bash(git commit --amend *)",
      "Bash(git tag *)",
      "Bash(git branch -D *)",
      "Bash(gh api *contents/*)",
      "Bash(gh api *git/blobs*)",
      "Bash(gh api *git/trees*)",
      "Bash(gh api *git/commits*)",
      "Bash(gh api *git/refs*)",
      "Bash(curl *api.github.com*)",
      "mcp__github__create_or_update_file",
      "mcp__github__push_files",
      "mcp__github__delete_file",
      "Bash(git push)",
      "Bash(git push *)",
      "Bash(gh *)"
    ],
    "allow": [
      "Bash(node .process/tool/p3.mjs github push *)",
      "Artifact"
    ]
  },
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh\""
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "mcp__github__.*",
        "hooks": [
          {
            "type": "command",
            "command": "d=\"${CLAUDE_PROJECT_DIR:-$PWD}\"; f=\"$d/.process/tool/p3.mjs\"; h=\"$d/.process/tool/hook.mjs\"; cd \"$d\" || exit 2; if [ -f \"$h\" ]; then node \"$h\"; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2; fi; if [ ! -f \"$f\" ]; then echo \"GitHub pacing hook: no tool at $f (the pin not filled yet): this call is not governed\" >&2; exit 0; fi; if ! grep -q \"'github hook'\" \"$f\"; then echo \"GitHub pacing hook: $f has no github hook (a pin from before R17c): this call is not governed\" >&2; exit 0; fi; node \"$f\" github hook; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2",
            "timeout": 300
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "d=\"${CLAUDE_PROJECT_DIR:-$PWD}\"; f=\"$d/.process/tool/p3.mjs\"; h=\"$d/.process/tool/hook.mjs\"; cd \"$d\" || exit 2; if [ -f \"$h\" ]; then node \"$h\"; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2; fi; if [ ! -f \"$f\" ]; then echo \"GitHub pacing hook: no tool at $f (the pin not filled yet): this call is not governed\" >&2; exit 0; fi; if ! grep -q \"'github hook'\" \"$f\"; then echo \"GitHub pacing hook: $f has no github hook (a pin from before R17c): this call is not governed\" >&2; exit 0; fi; node \"$f\" github hook; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```

## neobobkrause/process3

```json
{
  "permissions": {
    "deny": [
      "mcp__github__merge_pull_request",
      "Bash(gh pr merge *)",
      "Bash(gh api *pulls/*/merge*)",
      "Bash(git push --force *)",
      "Bash(git push -f *)",
      "Bash(git push --force-with-lease *)",
      "Bash(git push origin --delete *)",
      "Bash(git push origin main)",
      "Bash(git push origin HEAD:main)",
      "Bash(gh api *contents/*)",
      "Bash(gh api *git/blobs*)",
      "Bash(gh api *git/trees*)",
      "Bash(gh api *git/commits*)",
      "Bash(gh api *git/refs*)",
      "Bash(curl *api.github.com*)",
      "mcp__github__create_or_update_file",
      "mcp__github__push_files",
      "mcp__github__delete_file",
      "Bash(git push)",
      "Bash(git push *)",
      "Bash(gh *)"
    ],
    "allow": [
      "Bash(node tool/p3.mjs github push *)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__github__.*",
        "hooks": [
          {
            "type": "command",
            "command": "d=\"${CLAUDE_PROJECT_DIR:-$PWD}\"; f=\"$d/tool/p3.mjs\"; h=\"$d/tool/hook.mjs\"; cd \"$d\" || exit 2; if [ -f \"$h\" ]; then node \"$h\"; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2; fi; if [ ! -f \"$f\" ]; then echo \"GitHub pacing hook: no tool at $f (the pin not filled yet): this call is not governed\" >&2; exit 0; fi; if ! grep -q \"'github hook'\" \"$f\"; then echo \"GitHub pacing hook: $f has no github hook (a pin from before R17c): this call is not governed\" >&2; exit 0; fi; node \"$f\" github hook; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2",
            "timeout": 300
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "d=\"${CLAUDE_PROJECT_DIR:-$PWD}\"; f=\"$d/tool/p3.mjs\"; h=\"$d/tool/hook.mjs\"; cd \"$d\" || exit 2; if [ -f \"$h\" ]; then node \"$h\"; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2; fi; if [ ! -f \"$f\" ]; then echo \"GitHub pacing hook: no tool at $f (the pin not filled yet): this call is not governed\" >&2; exit 0; fi; if ! grep -q \"'github hook'\" \"$f\"; then echo \"GitHub pacing hook: $f has no github hook (a pin from before R17c): this call is not governed\" >&2; exit 0; fi; node \"$f\" github hook; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```

## neobobkrause/process3-probes

```json
{
  "permissions": {
    "deny": [
      "Bash(git push --force *)",
      "Bash(git push -f *)",
      "Bash(git push --force-with-lease *)",
      "Bash(git push origin --delete *)",
      "mcp__github__create_or_update_file",
      "mcp__github__push_files",
      "mcp__github__delete_file",
      "Bash(gh api *contents/*)",
      "mcp__github__merge_pull_request",
      "Bash(gh pr merge *)",
      "Bash(gh api *pulls/*/merge*)",
      "Bash(git push)",
      "Bash(git push *)",
      "Bash(gh *)"
    ],
    "allow": [
      "Bash(node .process/tool/p3.mjs github push *)",
      "Artifact"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__github__.*",
        "hooks": [
          {
            "type": "command",
            "command": "d=\"${CLAUDE_PROJECT_DIR:-$PWD}\"; f=\"$d/.process/tool/p3.mjs\"; h=\"$d/.process/tool/hook.mjs\"; cd \"$d\" || exit 2; if [ -f \"$h\" ]; then node \"$h\"; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2; fi; if [ ! -f \"$f\" ]; then echo \"GitHub pacing hook: no tool at $f (the pin not filled yet): this call is not governed\" >&2; exit 0; fi; if ! grep -q \"'github hook'\" \"$f\"; then echo \"GitHub pacing hook: $f has no github hook (a pin from before R17c): this call is not governed\" >&2; exit 0; fi; node \"$f\" github hook; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2",
            "timeout": 300
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "d=\"${CLAUDE_PROJECT_DIR:-$PWD}\"; f=\"$d/.process/tool/p3.mjs\"; h=\"$d/.process/tool/hook.mjs\"; cd \"$d\" || exit 2; if [ -f \"$h\" ]; then node \"$h\"; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2; fi; if [ ! -f \"$f\" ]; then echo \"GitHub pacing hook: no tool at $f (the pin not filled yet): this call is not governed\" >&2; exit 0; fi; if ! grep -q \"'github hook'\" \"$f\"; then echo \"GitHub pacing hook: $f has no github hook (a pin from before R17c): this call is not governed\" >&2; exit 0; fi; node \"$f\" github hook; s=$?; [ \"$s\" -eq 0 ] && exit 0; exit 2",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```


# [file] audit_C.md

# Audit C: Process4 proposal against the Process3 requirements

Part audited: Ledger families TXT, MNT, SHM, the principles, GAP-1 to GAP-12, and the Foundations sections "How this was decided", "Setup", "Maintenance, certification and the two health metrics", "Dropped, and why", "To measure on the first tranche" and "Open tensions to settle".

Read in full: `foundations.md`, `process4_doc.md`, `ledger_map.md`, and every line of the five assigned families in `ledger_lines.md`. Consulted for evidence: `product_side.md` (in full), `change_sample.md`, `causal_forensics.md`, `canon_analysis.md` section 5, `redteam_feasibility.md`, `redteam_corruption.md`, `levers_github_cloudflare_product.md`, `DECISIONS.md` (the product's decision record, for the owner's later words).

## How to read the rows

- **Result** is graded on the worst-met clause of the line. Where one clause is met and another is not, the row says which.
- **MET DIFFERENTLY** means what the line asks for is still obtained, by another mechanism, at no cost to another requirement in this part.
- **CONTRADICTED** means the proposal's own words oppose what the line asks for. The words are quoted.
- **Central** names which of the owner's four requirements of 13 Nov the line serves: (1) no commands, no file edits, settings only; (2) unattended, waits only when completely blocked; (3) total order, one job per module, earlier first, interface changes notify users; (4) parallel jobs under a number he can change.
- **Kind** follows the documents' own rule (Foundations, "The human and the AI"): a line has a purpose, which is the owner's, and a mechanism, which is BOB's; "only a change to what a line asks for comes to you".
- Proposal items are cited by their own labels (G, C, M, F, P, N, R). To avoid a clash with the principles, the proposal's Lever 5 items are written "lever P1" to "lever P5", and "WA n" is item n of the working agreement.

Two corrections to the brief. The Ledger holds 21 principle lines, of which 20 are kept or modified and one (P16) is dropped; there is no P14 or P15. So this part has 54 kept or modified Ledger lines: TXT 7, MNT 10, SHM 5, principles 20, GAP 12.

## 1. Ledger lines

### TXT: instruction files and rules

| Id | Requirement (owner's note where he wrote one) | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| TXT-1 | Product's CLAUDE.md under thirty lines, hand-written, naming the pinned process commit and the command that fetches it. Modified against the suggestion, owner's word 1 Nov: BOB writes and keeps it line by line, "with no approval needed and each change listed in the tranche report; the approvals block stays Bob's own" | Mechanism (thirty lines, who writes); purpose (changes do not need him) | **CONTRADICTED.** G2 makes `CLAUDE.md` and the process pin the owner's paths: "A ruleset on main and the integration branch requires your review for those paths". M1 replaces thirty lines with a 4,096-byte cap. There is no tranche report | (1), (2) | Two parts. Byte cap for line cap: candidate for the owner to change; the file ended at 22 lines and 8,664 bytes, all growth from 16 owner patches (product_side §6a). Owner review of every non-approval line and of the pin: proposal must change, or the owner must be asked to withdraw his 1 Nov word; the proposal does not say it reverses it |
| TXT-2 | Every line in an instruction file is failure-backed, non-inferable from the code, or tool-enforceable; failing lines are deleted. The Ledger's reason: "The per-line test replaces a byte cap" | Mechanism | **MET DIFFERENTLY.** M1 goes back to a byte cap held by a required test; M3 sets how prompts are written. The per-line test is not mentioned | none | Candidate for the owner to change. The map held TXT-2 as a nudge; the one byte cap that existed (role prompts, 4,096) moved 12 bytes in five days while the README grew from 8 KB to 134 KB (process4_doc "What did hold"; causal_forensics §1) |
| TXT-3 | One rulebook per area, at most ten rules on one screen, rewritten in place, never appended; "when you raise a problem, a rule is rewritten and no ruling is added" | Mechanism | **MET DIFFERENTLY.** The working agreement (seven items) "replaces the rulebooks"; three pinned texts of 4,096 bytes; M2. The clause on a problem the owner raises changes: a rewrite needs a fork pull request and his merge between runs, and M4 says a chat remark "lapses at the end of the run unless you put it in writing" | (1) lightly | Proposal should say that the owner raising a problem no longer rewrites a rule, so he can accept or refuse that |
| TXT-4 | Apply the per-line test to the principles; most roles load two or three. Owner: "I'm skeptical, but let's try". Foundations: "tried and measured" | Mechanism, on trial | **WEAKENED.** M2: one charter page of 25 purposes replaces the principles as reading. The measurement that was the condition of his sceptical assent (drift traceable to a missing principle, decided at tranche close) is not carried. The 25 purposes were "extracted from the canon by one worker", not decided by him | none | Proposal must change: say how a misjudgment traceable to a missing principle would be seen, or ask the owner to drop the trial. He has not seen the charter text |
| TXT-5 | Each role's starting prompt names its own rulebook in the pinned process; product rules load by path | Mechanism | **MET** (C2, C5: the one-line prompt names the pinned ARCH or START text). Product rules by path are not mentioned | none | |
| TXT-6 | Every rule cites the measured failure or the owner's decision that justified it; a rule with neither is removed | Mechanism for a purpose (rules do not accrete) | **MET DIFFERENTLY**, though the proposal says the line ends ("the citation rule as the brake (GAP-3, TXT-6)"). What replaces it: condition 2 ("A check earns its place by running the product or by a recorded catch"), budgets, and the owner's merge. The owner's merge is itself the owner's word in the strictest sense, so the line's test is still applied, by him | (1) through the replacement | Candidate for the owner to change the mechanism: the citation audit was never built and every growth was cited (causal_forensics §7: "Tool 4,543+ lines; every rise cited"); check-adding stayed at 41% of merges before and after his 5 Nov instruction (change_sample). The replacement mechanism is the one the proposal's first section says conflicts with (1) |
| TXT-7 | Every text names its audience and speaks plainly | Purpose | **MET** (M3, R25). "Names its audience" is not stated for each text | none | |

### MNT: maintenance and certification

| Id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| MNT-1 | The process is a product under itself, as the thin process: own ledger, requirements, jobs on branches with tests and review, tranches, the version in use frozen while a tranche runs | Mechanism for a purpose (no unreviewed reactive fixes; frozen in use) | **MET DIFFERENTLY.** G1, N2, N4, N6: changes arrive as fork pull requests under budget tests; frozen by GitHub. The reviewer and merger is the owner, where the Ledger had the process's own review. Own ledger and requirements for the process are not mentioned | (1) through the owner's merge | See MNT-5 |
| MNT-3 | A tranche of the process is built with the last released version of the process | Mechanism | **SILENT.** Process changes are built by "a commissioned session" or "a fresh session in a fork" under no stated process | none | Candidate for the owner to change: never built (ledger_map: Phase 4), and Process3's own builders had no role, START or rulebook in the tool (causal_forensics §1.4). The proposal should say so |
| MNT-4 | A tranche runs on one pinned process version, named in the plan; every session verifies the pin once at start and says so | Mechanism for a purpose (the process does not change under a run) | **MET DIFFERENTLY.** N2 "One process version per run"; G2 puts the pin in the owner's paths; G4 calls the gate "at a pinned commit". The session's start verification is not mentioned; its approvals half is removed (see F-MNT-1) | none | |
| MNT-5 | A fix for a blocking flaw is adopted by a running tranche once, as an explicit recorded act that moves the pin; no job restarts. Page explanation: "BOB records one act that moves the pin" | Purpose (a blocking flaw is fixed and adopted without restarts, and without him); mechanism (the pin move) | **CONTRADICTED.** "These families end outright: ... mid-run pin moves (MNT-5)". N2: "The pin moves only by your merge." "A real process defect now waits for you" (What it costs you). "A defect in a frozen part waits for you" (Known limits) | (1), (2) | Proposal must change. Evidence supports bounding the mechanism: 116 pin moves in nine days, adopted a median 3 to 21 minutes after merging, about 35 minutes of product cost each (product_side §4; change_sample removal 287). It does not support moving the act to the owner: his 9 Nov word was "Pin moves should be lightweight fixes that improve velocity, not ruin it" (change_sample removal 298). The proposal's own first section already says to replace his merge with limits |
| MNT-6 | A fix for a non-blocking flaw waits for the next process release and the product's next tranche | Purpose (no patching a running tranche for annoyances) | **MET** (condition 4, N3, N4, WA 3). Held by a wall for the first time. The next release now needs the owner to commission and merge it | (1) through the release | |
| MNT-7 | A flaw report is filed from any session by one command, listed at each status, answered by main; never fixed in place | Mechanism for a purpose (flaws are reported and answered, not patched where found) | **WEAKENED.** N3: one line in a pinned issue. "Never fixed in place" is held by the wall. "Listed at each status" is gone (N1 lists ready, stuck, last walk). "Answered by main" is gone during a run: nothing reads the log until "a retrospective between runs, when you commission it" (N4) | (2) | Proposal must change: a report should get an answer without the owner having to commission it, or the owner accepts that reports are silent until he acts. No Process3 evidence against the line: it was a later gate, never built |
| MNT-8 | Owner: "Certification is a long-term goal that indicates that it's ready for general use." A shadow of one representative slice, then the live first tranche as the certification, with the overhead and health metrics measured | Purpose (nothing is declared ready on argument); mechanism (slice, then live) | **MET DIFFERENTLY.** Seven one-hour tests, the replay of the gate against 20 to 30 merged pull requests (N6), and a short run 1 with a stated test. Readiness for general use is not addressed; the metrics half is weakened (F-MNT-4, F-MNT-5) | none | |
| MNT-9 | Flaws found in the shadow are fixed before release and the run repeats from the step that found them | Mechanism | **SILENT.** The replay happens "before it is frozen"; nothing says a flaw found in the replay or the seven tests is fixed and the step repeated | none | Candidate for the owner to change: never built (ledger_map gap); the Ledger's own note was "Can loop if flaws keep appearing; needs a stop rule" |
| MNT-10 | Each release names the platform rows and product sizes it was certified against, so a larger product is told at onboarding | Purpose, small | **SILENT.** No release note, no sizes. Yet the design depends on size: G5's budget exists because "the measured peak hour of 24 landings would otherwise need 52 runners against GitHub's 20" | (4) lightly | Proposal must change: state the sizes and platform facts it was tested at, or the owner drops the line. No evidence against it; it was never built |
| MNT-11 | On each model release, remove one component at a time and see what breaks | Mechanism for a purpose (the process shrinks) | **MET** (M6), held by the retrospective, which the owner commissions. The Foundations' additions are graded at F-MNT-2 | none | |

### SHM: what a product receives

| Id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| SHM-1 | A product receives the short CLAUDE.md, one skill, a settings file with the permission list, the gate workflow with install and trigger paths, the prune workflow. "Nothing else, and a check fails on drift" | Mechanism | **MET DIFFERENTLY.** The product receives CLAUDE.md, `.claude/**` settings (C7), a reviewer subagent file (C10), CODEOWNERS (G2), a gate that is "a call to the reusable one" (lever P1), a watchdog and report workflow (G8), a deploy-and-walk workflow (F1), the pin, and three pinned issues. No skill, no prune workflow. N7 deletes the "shim drift check"; G2's required review holds drift instead | (1) through G2 | Candidate for the owner to change the drift check: the checks around the shims refused legitimate changes (one "refused every change that was not a shim byte for byte", change_sample row 192; the setup check read a retired hook "as drift", removal 295), and process files in the product grew anyway (gate workflow 77 to 273 lines, config 24 to 421; product_side §6a). The proposal should list what a product receives; it never does in one place |
| SHM-2 | Shims are regenerated on GitHub's runner with the owner's token and merged by pull request; no session attaches a second repository | Mechanism | **MET DIFFERENTLY.** G4: the gate lives in the process repository and is called at a pinned commit, so little is regenerated. Changes to the product's process files are pull requests the owner reviews (G2). How a session reads the public process repository without attaching it is left to the tests | (1) | Under Process3 the record attributes to him, twice, the opposite direction: workflow changes "judged by rules, not sent to Bob" (4 Nov), and limits approved on 6 Nov "so workflow changes can merge without Bob" (change_sample rows 98, 192; these are the commits' attributions). G2 sends them to him. Proposal must change or ask him |
| SHM-3 | Onboarding writes the build state's skeleton, the grant list and the first plan, and measures the product against the certified sizes | Mechanism for a purpose (a product can be brought in, with his part bounded) | **SILENT**, and admitted: "Onboarding a new product and moving accounts are not designed here" (R24). N8 is a one-page setup list | (1) | Proposal must change: say who does onboarding and what the owner's part is. Graded "Weakened" by the proposal; it is absent |
| SHM-4 | A product mid-tranche at conversion carries it by one command. "Needed for Civicsmith now" | Mechanism | **WEAKENED.** Conversion is run 0: a commissioned build, a replay, one clean-up pull request "you merge" (lever P1), and the owner's settings. How Civicsmith's open state is carried (2 open jobs, 357 unmet marks, 27 unmerged job branches, layer 14 unmerged; product_side §5, §8) is not said beyond "Merge Layer 14" and "a plain list" | (1) | Proposal must change: state what carries the open tranche and that the owner's part is settings only |
| SHM-5 | A product's session setup is the product's own script, run by the session's first command, not by a hook | Mechanism | **MET DIFFERENTLY.** C7 moves installs "to the cloud environment's setup script". Not a hook, as asked. But the script leaves the repository for the cloud environment, which sessions are denied (C7) and the owner sets (N8) | (1) | Proposal must change or say so: a toolchain change becomes an owner act in the Claude environment settings, which is neither a GitHub nor a Cloudflare setting |

### The principles

| Id | Requirement (owner's note) | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| P1 | The process exists to put correct, working product behaviour that meets every defined requirement onto main. Owner's addition: "quickly and cheaply, behaviour that survives, my time only where it is mine" | Purpose | **WEAKENED.** Correct, quick, cheap, surviving: G3, G11, F1. "Meets every defined requirement": weakened, admitted at R11. "My time only where it is mine": the proposal enlarges what is his ("Added: the process") | (1) | Proposal must change. R1 is graded "Met" on a wording that leaves both clauses out |
| P2 | Process and product are separate; the build state at the product's own paths tells BOB what to do | Purpose | **MET DIFFERENTLY** (G1, G7, N1, lever P4): state is derived from branches and pull requests; status prints what is ready | none | |
| P3 | Owner's words: "Development under Process3 is development of that product, not of Process3. A serious enough flaw pauses the product, Process3 is fixed separately, and the product resumes on the fixed version. Changes during Process3's own first build are expected." | Purpose | **WEAKENED.** The first sentence is met, and held by a wall (G1, G2). "Fixed separately" and "resumes on the fixed version" now each need the owner: he commissions, merges and moves the pin | (1), (2) | Proposal must change: the pause must be able to end without him. See section D |
| P4 | One total order; each module in one layer; a module uses only earlier modules; declared use checked against imports. The owner decides only layers and modules that carry product capability | Purpose | **MET** (G4 keeps "imports match declared uses"). His share of the module map is not mentioned: lever P4 makes the map "ARCH's files, not guarded". Note that canon_analysis §5 lists "One total order" under R17 as a mechanism "that is not the purpose" | (3) | |
| P5 | Module requirements in four parts; may suggest, never require, an implementation; concise because read whole. "BOB carries a change to every user of a service" | Purpose | **CONTRADICTED** on the last sentence. N7: "Deleted with no replacement: ... notice triage as a mechanism". "These families end outright: ... provider notices as a route (GAT-3)". The four-part shape is not mentioned | (3) | Proposal must change, and its first section admits it. The evidence is against the mechanism, not the purpose: 178 notices became 2,707 notifications, 90% of 2,342 verdicts "not affected", 187 notice test files (product_side §6d); but 241 verdicts were "affected" and led to real fixes (product_side §9.3). The decision record made on his words of 9 Nov already states a light form: "A change to its interface reschedules every open user and notifies the others" (DECISIONS.md PD-25; the sentence is the record's, not a quotation of him) |
| P6 | A module fits in one reading | Purpose | **MET** (lever P4: files too large are "split at planning time"; M1) | none | |
| P7 | Owner: "Keep no requirement goes untested, which was lost". Only module jobs change module code; every requirement tested at the interface and proven met; a mechanical pass for no-judgment changes | Purpose | **WEAKENED**, admitted at R11: "Nothing proves each struck mark has a test". The mechanical pass is not mentioned. Nothing in G4's three narrow checks holds "only module jobs change module code" | (3) | Proposal must change, or the owner accepts the walk as the compensating check. Process3's mechanism (a named test per struck mark in the receipt) was loosened at 22 hours and removed on his word on 9 Nov (change_sample row 40) |
| P8 | At most one job per module at a time; the job applies every plan entry for its module and deals with what it finds there | Purpose | **WEAKENED.** C4: "A job is one module or item"; WA 4 covers fixing in one's own module. "At most one at a time" is not stated, and the tool that refused a second job is replaced by one that "cannot refuse" (N1) | (3) | Proposal must change: say what keeps a module to one job |
| P9 | A flaw in another module goes to BOB as a report in that module's terms; BOB confirms it, sends it to that module's running job, starts that job, or places it in a later START or round | Purpose | **WEAKENED.** WA 4: "If it is elsewhere, tell ARCH in one line." Where that line is kept, how a fresh ARCH finds it an hour later, and what ARCH does with it are not stated. A START is one line (C5), so nothing can be added to a running job's | (3), (2) | Proposal must change: say where a cross-module report lives and how it becomes work |
| P10 | One layer at a time, lowest first, "all the module jobs of a layer run concurrently"; nothing found waits for the next tranche; the next layer starts when the layer is complete | Purpose | **MET** on layers and concurrency (lever P3: "A layer's jobs start together"). The found-work clause is graded at P9; the start of the next layer at P18 | (3), (4) | Observation for the owner: lever P3 is P10 as he kept it on 3 Nov. The conflict the proposal admits is between P10 and central requirement (3), because "182 of 220 modules depend on a module in their own layer". His words of 9 Nov point another way and the proposal does not mention them: "Because modules are in a total order, perhaps holding jobs in upper layers until an earlier layer closes isn't necessary" and "All jobs of a layer should open at once up to the maximum slot cap". The decision record built on them has a module start "once every module upstream of it is settled" (DECISIONS.md PD-25) |
| P11 | Module tests per module, small layer tests at layer completion, "the full regression runs only at release or on Bob's word". The owner moved whole-product checks to release against the suggestion (ARC-4) | Mechanism he chose | **CONTRADICTED.** G6: "The existing full regression runs there on a schedule." Layer tests are not mentioned. R12 grades this "Met" | (3) lightly | Candidate for the owner to change, on evidence: one job "merged green on its own suite and broke plane's worker.test R6, unseen until the first development deploy served 500s" (change_sample row 112), and 218 complete jobs with green suites coexisted with 147 of 157 live steps failing (product_side §9.2). The proposal must tell him it reverses his decision |
| P12 | Done means merged; main never changes while a tranche runs; the close merges main into the tranche and re-runs the checks | Purpose | **MET DIFFERENTLY** (G3, G6, G11). One exception: workflow files live on main "because scheduled workflows only run from there" (run 0), so a mid-run owner merge changes main | none | |
| P13 | Sessions are kept short; state lives in the build state; BOB refreshes at a threshold | Purpose | **MET DIFFERENTLY** (C3 preferred: a fresh ARCH each wake). In the fallback the refresh is the owner's act | (1), (2) in the fallback | See OT-1 |
| P17 | "Bob defines the project ...; BOB does everything else, decides every technical matter and reports it in plain words as done. Bob's time is the scarcest resource ... Bob does not edit files or enter commands". Owner's note: "Keep it whole after onboarding"; the platform forces a few GitHub steps at onboarding, "as few as possible, each walked through" | Purpose | **CONTRADICTED.** "The process itself (which checks exist, what the tool does, what the prompts say) becomes yours". "Added: the process. Which checks exist, what the role prompts say, what the tool does, what the settings allow." "Your standing acts are five: merge a process change, answer a question, stop or resume, approve a public release, and, only in the fallback form, replace ARCH at a layer close." R2 grades this "Met, with the split" | (1), (2) | Proposal must change. Its first section says so ("Replace your merge with limits held in GitHub rules") and calls the replacement "unproven"; the body was not rewritten to match |
| P18 | While a tranche runs, BOB prepares what the next round or tranche needs "so it opens the moment this one closes" | Purpose | **SILENT** on preparation; the words "prepare" and "pipeline" do not occur. Against "the moment this one closes", R15: "Up to an hour can pass between a layer closing and the next starting" | (2), (4) | Proposal must change. The record supports the purpose: on 7 and 8 Nov the loss was "nothing to land", with gaps of 11.4, 8.7, 7.6 and 6.3 hours between code-carrying landings (product_side §7). The map warns only against one mechanism: a listed set of preparation acts with Stop guards, removed by the owner earlier as too inefficient |
| P19 | "BOB never idles while work remains; the work never stops for Bob, and no session ends a turn waiting on him while anything can be done." Owner's note: the mechanism is the tool naming the next act and the sweep's wake, never anything that holds a turn, "and it must be shown efficient and effective (my word, 3 Nov)" | Purpose | **CONTRADICTED.** R15: "'Never idle' is no longer a fault of the session. Up to an hour can pass between a layer closing and the next starting". WA 7: "stopping with nothing to do is correct". "A real process defect now waits for you". N7 deletes the idle alarm; C4 removes the event wake. R15 grades this "Met, restated" | (2), (4) | Proposal must change. Restating the line changes what it asks, which by the documents' rule comes to the owner as a change, not as "Met". The evidence is against the mechanisms built for it (the idle alarm chain cost 1,564 git processes before every command; change_sample §5), not against the purpose. His ruling of 5 Nov was that "urgency must be integral to the process, not prompt text" (causal_forensics §4.2); WA 7 is prompt text |
| P20 | A session acts only on what it has read in full or measured; every claim names its source; a cause is named only once evidence shows it | Purpose | **MET DIFFERENTLY** (WA 4 "find out why before changing anything"; M4 quotes with a link; M1 caps). The reading audit, never built, is not carried | none | |
| P21 | A question that is Bob's (by P17 only) becomes his decision and a design before anything is built. Lanes: one area of focus, deliver designs, reached through BOB; lanes stay as SES-14 settled them (the UX lane is always there) | Purpose | **SILENT** on lanes: the word does not occur. C1 has "Two roles: ARCH and jobs" and does not list lanes among what is removed. Questions: met differently by M5, but "before anything is built" is not stated, and the widened division makes more questions his | (1) lightly | Proposal must change: say whether lanes and the UX lane's design directory continue. The product had 33 lane branches in the week (product_side §1) |
| P22 | A release is cut from the open tranche, proven by the full regression, deployed and walked; what a walk finds becomes a round's entries; what it produces is kept only until analysed | Purpose | **MET DIFFERENTLY** (F1, F2, G11). The walk moves from BOB's act to a workflow. G11 makes "a passing walk" a required check for the close, where P22 asks only that the release be walked and the findings become a round. Cutting a release is not described (F-STOP-2) | (2) | |
| P23 | The repository holds only what a session must read or a merge must carry | Purpose | **MET DIFFERENTLY** (G7, lever P1): there are no records to hold. The size check that held it is deleted (N7) | none | |

### GAP-1 to GAP-12

| Id | Requirement (owner's note) | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| GAP-1 | Owner's own words, against the suggestion: "A tranche CAN RUN from open to close with no one watching: every stop is a named blocker in the record, BOB starts other work meanwhile, and only a blocker that only Bob can clear reaches him." | Purpose | **CONTRADICTED** in the form recommended to start: "This gives up one thing at first: running unattended overnight. You would look in once or twice a day." In the fallback: "replaced by you at each layer close". In the preferred form the named blocker and other work are met (N3), but process defects are made blockers only he can clear, by design. R6 grades this "Met in the preferred form" | (2) | Proposal must change; its first section admits the small start. The preferred form rests on test 1, which Process3 measured failing (a task's fresh session could not start sessions, 0 of 3; Foundations, Roles) |

Wick desk entered 16 lemons on the sheet.

| GAP-2 | Each job in its own checkout; its cost per attempt is an alarm the sweep reads, not a cap | Mechanism for a purpose (lack of progress is caught) | **MET DIFFERENTLY.** C6: status lists pull requests "open too long without a green check or a merge", by time, not cost. No caps, as asked | (2) | |
| GAP-3 | A rule, check, review round, measurement run or owed task exists only against a measured failure or Bob's word; a finding with neither is one line in a report and changes nothing | Purpose (caution is a cost); mechanism (citation) | **MET DIFFERENTLY**, though the proposal lists it as ending. WA 5 keeps the second half ("A 'what if' gets one line under Known limits"). Condition 2 and the owner's merge replace the first | (1) through the replacement | Candidate for the owner to change the mechanism: every GAP-3 line was a nudge and its audit was never built (causal_forensics §7); 44% of sampled additions guarded against something never observed (change_sample). The sentence the Foundations attach to it is graded separately at X-1 |
| GAP-4 | Status names each role's next acts from git alone, so a fresh BOB given only status takes the right next act | Mechanism for a purpose | **MET** (N1, C2, C3). "Reports to route" is absent; see P9 | (2) | |
| GAP-5 | "No role waits on ROOT or a scheduled task for work the record allows: a job's report or a merge wakes BOB at once, and a scheduled wake only catches a session that stopped." Measured 2 Nov: 194 minutes late with no event | Purpose | **CONTRADICTED.** C2: "ARCH is woken once an hour by a scheduled task that you create." C4: "GitHub allows one subscriber per pull request, so ARCH does not subscribe." The scheduled wake becomes the only wake. No row of the "Against" table names this | (2), (4), (3) | Proposal must change. No evidence that event wakes failed; the reason given is a platform limit and context growth. It also drives another conflict: the "about four days" that lever P3 cites against strict order is "65 links × (about 30 minutes of job + up to 60 minutes for the hourly wake)" (redteam_feasibility, finding 6) |
| GAP-6 | The owner's standing approvals in each repository's CLAUDE.md are the one policy for every act at every depth; the start check confirms each session loaded the tip's; the deny list holds only hard prohibitions | Purpose (one policy, in his hand); mechanism (start check) | **CONTRADICTED** on the start check. C11: "The approvals fingerprint is removed. An edit to your approvals takes effect in sessions started after it and stops nothing." The first clause is met (G3). M1 caps the file at 4,096 bytes when it ended at 8,664, each patch having cleared a permission wall | (2) | Start check: candidate for the owner to change. The proposal says "Every approvals edit in Process3 halted the process, and the last one ended it"; git shows the last patch merged at 16:45Z on 9 Nov and no product landing after 16:35Z, but "cannot show why that edit stopped the sessions" (product_side §8). Byte cap: proposal must say how his approvals fit in half the space without refusals returning |
| GAP-7 | A public release or promotion to installed sites waits for the owner's approval through the protected GitHub environment; development releases are drafts and need none | Purpose | **MET** (G10, G11), and more strongly: secrets leave the sessions' environment | (1), (2) | |
| GAP-8 | On one plain request the process stops development under one Claude account and writes a tested page of steps to restart under another | Purpose | **SILENT**, admitted: "moving accounts are not designed here". The proposal adds account-bound things: the hourly task he creates, the cloud environment's setup script and variables, pull request subscriptions | (1), (2) | Proposal must change. The need was real in the week: an account switch on 5 Nov and a change of merging identity on 7 Nov with a 9.3-hour silence (product_side §9.5). The evidence is against the size of the mechanism (a 34 KB switch module and an 8 KB runbook; causal_forensics §4.2), not the purpose |
| GAP-9 | The Ledger, the Foundations and the Build Plan agree: each section and row cites the Ledger lines it serves, and "no build starts on a line any of them contradicts" | Purpose (the design agrees with what he decided); mechanism (citations) | **CONTRADICTED.** "The Ledger's 151 kept or modified lines do not carry over as lines." M2: "One charter page replaces the Ledger, Foundations, Ledger map, README, decision records and rulebooks". The recommendations "were written before you restated them and fall short of three", and run 0 still commissions the build | all four | Proposal must change: each departure from a kept line must be shown to him as a departure. The evidence is against citation as a brake (a session restored a check he had removed "citing Ledger lines"; change_sample §5), not against agreement with what he decided |
| GAP-10 | Review findings go to the job as diagnosis; review is never the merge gate; "a green gate merges without Bob, who approves a particular merge only when he asks to" | Purpose | **CONTRADICTED** for one class of merge. Product pull requests: met (G3, C10, G11). But G2: "A ruleset on main and the integration branch requires your review for those paths", which are `.github/**`, `.claude/**`, `CLAUDE.md`, `CODEOWNERS`, the pin and the walker's step definitions. The same document says "Merges need no one" | (1), (2) | Proposal must change. Its evidence that this is rare ("Of 508 landings in Process3, none touched these paths") was established for `build/modules.json`, `.github/`, `.claude/` and `CLAUDE.md`. For the walker it does not hold: four job landings touched `journey-check`, and the walk's steps went from 238 to 357 in one round (redteam_corruption §6; product_side §9.2) |
| GAP-11 | A platform behaviour is measured once by default, more only when ambiguous or when a failure recurs | Purpose (bounds measurement) | **MET DIFFERENTLY** (seven one-hour tests, each once). The dated table of rows is not carried | none | |
| GAP-12 | The tranche report states BOB's idle time while work was ready and the minutes of the owner's it took | Mechanism for a purpose (urgency and his time are measurable) | **WEAKENED.** Idle time: the watchdog records only periods with "nothing ... merged in a set number of hours" (G8). His minutes: "Your acts are counted: merges, answers, stops. The count is the measure of your time, since minutes have no collector." There is no tranche report | (1), (2) | Proposal must change or the owner accepts counts. These two numbers are the only measure of central requirements (1) and (2), and the proposal adds owner acts while removing their measure |

## 2. Foundations requirements that are not restatements of a line in this part

### How this was decided

| Id | Requirement | Kind | Process4 result | Central | If not met |
| --- | --- | --- | --- | --- | --- |
| F-HOW-1 | "Nothing here is in force until it has run on a real tranche with the two health metrics measured." | Purpose | **WEAKENED.** Run first is respected ("Process4 itself is untested"; run 1 has a stated test). The two health metrics are not among run 1's tests | none | Proposal must change: run 1 should measure them, or the owner drops them. See F-MNT-7 |
| F-HOW-2 | A build plan derived from this document, "which we review, assess and evolve"; implementation starts only when the result will work "for development projects large and small" and "for Civicsmith and the products after it" | Purpose | **WEAKENED**, admitted at R24. The recommendations are "a menu", not a plan reviewed with him. Other products are not designed | none | Proposal must change or say that only Civicsmith is in scope |
