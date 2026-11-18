# [file] result.md (continued)


**The tool on the code as it stands, no comments added** (`iface_writeout.py`; measured).

| Of the 178 changes | Changes | Notifications Process3 sent |
| --- | --- | --- |
| Listing identical | 64 | 1,054 |
| Listing only gained something | 36 | 564 |
| Listing lost or altered something | 78 | 1,089 |

It read all 1,181 source files of 190 modules and failed on none. It describes 6,252 of 6,431 things handed to functions as "anything".

**The size of the commenting job** (`iface_surface.py`; measured by pattern counts, rough, an upper limit). 480 source files are imported by another module; they hold about 4,300 functions and methods taking about 5,700 things. The 20 providers that caused 61% of the notifications hold 65 of those files.

**Writing the comments for one module** (`trial_ai_runs/`). A helper that knew only the module's code, tests and requirements wrote the comments for ai-runs, the provider that caused the most notifications. About 27 minutes; about 1,500 comment lines; "anything" in the listing fell from 511 to 20; only comments changed (measured). By its own estimate about four fifths of the kinds and bounds came straight from the module's code; it found eleven places where code and requirements disagree and about ten kinds it could not determine without other modules' comments.

**Replaying the eight recorded changes to ai-runs against those comments, nobody updating them** (`replay_comments.py`; measured, against judged verdicts).

| Pull request | Process3 told | The record | The tool |
| --- | --- | --- | --- |
| 96 | 29 | 11 broken | 28 disagreements; 3 commented entries no longer match |
| 213 | 29 | none needed a change | Nothing; listing identical |
| 323 | 29 | none needed a change | A new method only |
| 348 | 29 | 1 adopted something new | An existing entry accepts one more optional thing |
| 391 | 30 | 1 adopted, 2 needed no change | A published list gained three names |
| 485 | 30 | none needed a change | Nothing; listing identical |
| 1004 | 23 | none affected | An answer gained a field |
| 1073 | 18 | none affected | Nothing; listing identical |

**How much the tool catches by itself** (`trial_ai_runs/interface_changes_log_pr96.txt`; the helper's counts). A second helper played the provider's job after pull request 96. It recorded 73 interface changes; 22 could break a user. The tool had complained about 5 of the 22. Fourteen were found only by reading the code, three only from tests. For 14 of the 17 a test confirmed the bound. One of the misses was tested further: with one comment line on the inner code that checks the record, the tool complained about it (measured, one case).

**Which users the tool points at** (`users_after_change.py`; measured, against judged verdicts). A third helper, not knowing the change, added comments to the 22 user modules with code, saying what each was handed. After pull request 96 the tool pointed at 5 of the 11 broken users, was silent on 6, and pointed at none of the 18 that were not broken. The six misses: operations called by name (2), a message between two separately running parts (1), a disagreement already standing (1), a test passing a caller's values straight on (1), tests writing rows straight into the provider's table (1). One of the by-name misses was tested further: with a nine-line comment on the test's own request helper, the tool flagged the two lines (measured, one case).

## E. What is not proven, and what a load-bearing approach still needs

Unproven: all of it as a working process. Every measurement above is a single module or a single case on a past record, and three helpers' work was checked only as far as "nothing but comments changed".

| What is needed | Why | Where it stands |
| --- | --- | --- |
| Comments reach the code inside a module that checks or builds what crosses its interface | Without it the tool caught 5 of 22 breaking changes | Tested on one case |
| Calls by name made followable | It is the main route between modules | Tested on one case |
| Two separately running parts share one written kind for each message between them | The tool cannot read across a connection | Untested |
| A module starts with no standing disagreement with its providers | A new complaint hid behind an old one | Settled by Bob's word of 15 Nov; not yet applied |
| The tool can say whether it follows a user fully | The rule "not followed means uses everything" depends on it | Untested |
| The refusal fires only on real disagreements, not on "I cannot tell" | Eight false complaints in one module | Not solved |
| Bounds written as kinds wherever possible, and one test named for each bound that remains | A change of meaning under an unchanged name is invisible to the tool | Bob's rule; not yet applied |
| Existing tests brought to Bob's rule on tests | Some write a provider's rows or spell out its answers | Not started |
| A real run on a few modules through several changes | It is the only proof | Not started |

## F. For the main session

1. **The definition's section on the notification** can now say what counts as an interface change, which event sends the notice and who is told, in Bob's words (section A), with section B marked "Claude decided".
2. **The record's line 10** ("A user module's job checks the implications of those parts and no others, and updates and runs only the tests that relate to them") was not studied here. What a told job does is still open.
3. **The first trial on the throwaway repository** with made-up modules is the place to prove this. The made-up modules should include: a provider reached by a call by name; a provider reached across a connection; a bound the tool cannot see; a change that only accepts more; a change that hands back something new; and a user the tool cannot follow.
4. **Two questions from the groundwork were not reached:** who is told when the product's module list itself changes, and what becomes of a declared use that no code backs (510 of the 2,707 notifications).

## G. Files

| File | What it is |
| --- | --- |
| `process4/owner_words/bob_words_14nov_notice_session.md` | Every message Bob typed to this session, exactly |
| `session_brief.md`, `study.md` | The starting brief and the groundwork |
| `judged40_domain_range.txt` | The 40 broken cases sorted by Bob's line |
| `iface_writeout.py`, `data/iface_writeout.json` | The tool over the 178 changes, no comments |
| `iface_surface.py`, `data/iface_surface.json` | The size of the commenting job |
| `trial_ai_runs/blocks/` | The comments written for ai-runs |
| `replay_comments.py`, `data/replay_comments.json` | The eight changes replayed |
| `trial_ai_runs/interface_changes_log_pr96.txt`, `trial_ai_runs/provider_comments_after_pr96.diff` | The provider's job after pull request 96 |
| `trial_ai_runs/users_comments.diff`, `users_after_change.py`, `data/users_after_change.json` | The 22 users |

Scripts run with `python3 -I <script> <path to the tool> <a scratch folder>` against a clone of the product at `/home/user/repos/civicsmith-copy`, and need TypeScript installed (version 5.6.3 was used).


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


# [file] trial_plan_facts.md

# Process4, section J: plan of the twelve trials

14 Nov 2026. Planning only. Nothing was changed in any repository, nothing was committed or pushed, no session or scheduled task was started. One public repository was cloned read-only (`neobobkrause/process3-probes` into `/home/user/repos/process3-probes`). Two short read-only scripts were run on the local product clone (section 3).

## 0. Marks, sources, limits

**Marks.**

- **[record]** stated in a handoff file; file named.
- **[repo today]** counted today from a local clone.
- **[tool today]** stated in the tool definitions this session holds today.
- **[sample]** from today's small sample run. Indicative only.
- **Judgment:** my reading, not a finding.

**Sources read.** In full: `process4_definition_main.md`, `permissions_inventory.md`, `roles_root_coordinator.md`, `interface_and_cycle.md`, `/home/user/work/enforcement_levers.md`. By passage: `redteam_feasibility.md` (findings 1 to 12), `change_sample.md` (summary, cases 1 and 2), `no_layers_width.md` (summary), `product_side.md`, `review.txt`, `DECISIONS.md`, `/home/user/work/k_evidence.md`, `/home/user/work/live_docs.md`. Probes repository: `main`, and `origin/phase0/platform-table` (`platform/TABLE.md` and its 60 evidence files).

**Limits.**

- GitHub's live settings were not read. Session transcripts were not read.
- The scripts earlier workers cite (`/tmp/claude-0/-home-user/5fb00928-.../scratchpad/ic/` and `audit_d/`) no longer exist. Anything they did must be rewritten.
- Process3's platform measurements were taken on Claude Code 2.1.316 with model claude-opus-5-5 [record: permissions_inventory 1e]. Today's version on Bob's account was not determined. Every Process3 count is an expectation for today, not a measurement.

**One fact that shapes every session trial.** The existing public repositories must not be written. Every trial that pushes, opens a pull request or merges therefore needs a new throwaway repository. Only Bob can create it under his account, give the sessions' GitHub account write access, and commit his approvals and deny list there. So there is almost no trial that "needs sessions but no act of Bob's" (section 5, group B).

---

## 1. The twelve items

Each item: what would run and how to read the result; what it needs; what can be reused; risk; dependencies.

### J1. A merge with no review passes the permission checker

**Run.**

1. In the combined trial run (section 4), ROOT is started by Bob; ROOT starts ARCH; ARCH is at depth 1, its real level.
2. Job sessions push and open pull requests in the throwaway repository. A tiny test workflow reports the required check.
3. ARCH merges each one with the merge act Process4 will use. Each merge is its own command. No review word appears in the command, the commit message or ARCH's instructions.
4. Twenty or more merges, spaced at least two minutes apart.
5. Afterwards, read ARCH's event list. Each tool result carries the checker's decision, its reason type and its source (`tool_result_meta[0].permission_decision`), which is how Process3 told the two kinds of "no" apart [record: probes `evidence/31/claudemd-vs-control.md`]. Count three things separately: checker refusals, deny-rule refusals, and acts ARCH declined without calling a tool.

**Reading the result.**

- **Breaks:** any checker refusal of a merge, above all one with the reason `[Merge Without Review]` or `[CI Bypass]`. Both reasons exist and each fired once in Process3 [record: permissions_inventory 2a, 1e row 35].
- **Breaks in a different way:** ARCH declines by itself. That is a fault in its instructions or in what it loaded, not in the checker. It sends the trial back to J3.
- **Cannot prove.** Zero refusals in 20 bounds the true refusal rate only below about 14% (one-sided 95%; Process3's own table gives 16.8% for n = 20). At Process3's best day of 135 merges, a 1% rate is more than one refusal a day, and three in a row stop a session. To bound the rate below 1% needs about 300 clean merges. **Judgment:** run the 20 as the trial, then keep the same count running through the first real tranche. Call it proven only there.
- **Inconclusive:** a refusal on a chained command (Process3's one checker refusal of a merge was on a chain [record: 1e row 26]); a failure of the test workflow; a merge GitHub refuses because the check is not green.

**Needs.**

- (b) Sessions: ROOT, ARCH, and two to four job sessions. About one to two hours. **It must be the real chain,** Bob to ROOT to ARCH. A chain started by an existing session puts ARCH a level lower and under a different first prompt. Process3 showed that who started a session, and with what words, changes the outcome: consent quoted in a starting text was declined 11 of 11; consent typed by Bob in the acting session, 0 refused of 21 [record: 1e rows 23, 24]. A rehearsal chain is useful to shake out the harness. Its count does not stand in for the trial.
- (c) Bob's acts: the set-up of section 4.
- (d) A throwaway repository is enough. Nothing in the product is needed.

**Reuse and earlier coverage.**

- Probes harness: the round-28 driver prompt (20 rounds of push, open, comment, merge; "If an act is refused, do not retry it, reword it or work around it; record the refusal text and go on") and the `physics/c1` to `c15` round of 2 Nov [record: probes `evidence/28/driver-prompt.md`; `main` history].
- Counted: 0 refused in 201, 201, 50 and 120 acts on 1 Nov, each round with an un-reviewed merge of the session's own pull request by GitHub's own tool [1e row 18]. "0 refusals in about 450 acts" on 2 Nov, all carrying a review verdict [1e row 25; 2a]. Two counted un-reviewed tool merges on 3 Nov, depth 1 and depth 2, both ok [repo today: `origin/process-state:metrics/tranche-open.jsonl`, 12 rows, 12 ok].
- In use, not counted: about 700 un-reviewed merges, 3 to 9 Nov, no recorded refusal [2b].

**Risk.** About 25 pushes, 20 pull requests and 20 merges in an hour or two. Process3's busiest hour before the suspension had 173 pushes on one branch [record: DECISIONS PD-3 context]. The cause of the suspension was never established [record: review.txt], so the risk cannot be called zero. The 2 Nov probe round made 51 merges in 48 minutes with no consequence. Usage: small. Left behind: the throwaway repository, its pull requests, the sessions.

**Depends on.** The merge act must be chosen and exist. The definition says "the process's merge tool". That tool does not exist for Process4, and the deny list's one push route names Process3's tool by path [1b]. Either a minimal Process4 merge-and-push tool is written into the throwaway repository first, or the trial measures Process3's tool, whose merge command demands a `--no-review "<why>"` flag. **Judgment:** the second does not count, because the claim is about a command with no review word in it. Shares its whole set-up with J2, J3, J6, J7, J10 and the stop rehearsal of J12.

### J2. ROOT, started by Bob with a plain prompt, can start ARCH and the coordinator

**Run.**

1. Bob opens a new session on the throwaway repository, picks the tranche branch, and types a plain first prompt of his own: he is starting development of the named product with Process4, and its repository.
2. ROOT reads its role text from the repository. It reports its own commit (`git rev-parse HEAD`) against the tranche tip.
3. ROOT starts ARCH and the coordinator, each with one repository, at the tip by commit id.
4. ARCH pushes a branch, opens a pull request, and starts one job. The job pushes and opens its own pull request.
5. To test the old-copy fault, the tranche branch is then moved on by a few commits and **Bob starts a second ROOT**. Its commit is compared with the tip again.

**Reading the result.**

- **Proves, for one run:** all twelve or so acts pass, and both ROOTs stand on the tip.
- **Breaks:** ROOT cannot work out what to do from a plain prompt; a session start is refused or declined; ROOT, ARCH or the job stands on an old commit; ARCH or the job is refused a push or a pull request.
- **Inconclusive:** a start that never runs because the account is near its limit of about 50 live sessions (the call still reports success [record: probes row 19]); the Claude GitHub connection not covering the new repository.
- **A limit.** In Process3 the old copy came from a saved container holding an earlier clone [record: roles 1.3, 3.1]. A brand-new repository has no such container on the first start. Without step 5 the trial cannot show that fault either way. Even with step 5, a clean result is one case.

**Needs.**

- (b) ROOT, ARCH, coordinator, one job: four sessions, about 30 minutes. **Bob's own first prompt is the thing being tested.** No session can stand in for him.
- (c) Bob: the set-up of section 4, then two session starts.
- (d) Throwaway repository.

**Reuse and earlier coverage.** The 3 Nov grants check, 12 of 12, from a ROOT that a tool-printed prompt had started [repo today, as above]. Session creation 20 of 20 at each of two depths [1e row 1]. A start by commit landed on the tip, 1 of 1; a start by branch name landed stale [1e row 29]. Bob's own ROOT came up stale twice (5 Nov 18:41Z, 8 Nov 19:00Z) [record: roles 3.1].

**Risk.** Low. A session that fails to start still counts toward the live limit.

**Depends on.** Design not yet made: ROOT's and ARCH's role texts and where they live (K technical 14); whether any tool exists; how model and effort are passed (K technical 12). The definition settles that ROOT is started on the product's repository. First step of the combined run; everything else in the run stands on it.

### J3. Sessions started this way load Bob's approvals and the deny list

**Run.** Inside the J2 run, in ARCH and in the job (the sessions Bob did not start):

1. **Deny list.** Ask the session to run one denied command, for example `gh pr merge 1`, and to say whether the GitHub merge tool is in its tool list. A deny refusal is recognisable: "Permission to use Bash with command ... has been denied", reason type `subcommandResults`, and it does not count toward the three-in-a-row stop [record: probes row 24].
2. **Approvals.** The coordinator asks the session, by message, for one act the approvals allow and its instructions do not name. Process3 used "archive this idle session" and "delete this task" [probes `evidence/31`].
3. **Judgment, an addition:** also ask the session to quote the first sentence of the approvals it holds, without opening the file, and its commit. In Process3 the session "never opened the file, so the text came from session context" [probes row 31].

**Reading the result.**

- **Deny list.** A deny rule is not a matter of chance, so one probe settles it both ways: the command is denied by rule and the tool is absent (loaded), or it runs or is judged by the checker (not loaded).
- **Approvals.** The effect is on the session's own model and is a matter of chance. One act carried out is weak evidence: the control group without the file did it 0 of 10 times in one copy of the record and 2 of 10 in another [1e, discrepancies]. One refusal that cites missing authority breaks the claim. The quoted first sentence (step 3) is the stronger test, because the text on main differs from the text on the tranche.
- **Inconclusive:** the act is carried out, but nothing shows where the session got the text.

**Needs.** (b) No extra sessions; four probes inside the J2 run, about ten minutes. For the approvals probe one idle session to archive. (c) Bob's two commits (approvals, deny list) made on GitHub's website: part of section 4. (d) Throwaway repository.

**Reuse and earlier coverage.** Probes rows 3b (deny removes the tool; 1 probe, 8 acts), 24 (3 denials), 31 (10 of 10 with the file) and 17 (settings load with a pinned clone, 1 probe). One repository per session is a recorded condition [1c].

**Risk.** Negligible. The archive probe is an act the checker judges case by case; a refusal there is information, not a failure.

**Depends on.** J2. Shares everything with it.

### J4. Interface changes are recognised with no misses

**Can be done completely offline: yes.** Method and sample are in section 3.

**Run.**

1. For each of the 178 notices on `origin/process-state`, find the merge commit of its pull request and that merge's first parent (the state just before).
2. At those two commits read the provider's source, its requirement file, its tests, and the module list.
3. Apply Process4's recognition rule (the four parts of section D of the definition, plus "any other change to the module's source", reported as unattributed). Record whether the rule fires.
4. Take "who is told" as every module that declares a use of the provider in the module list at the first parent.
5. Check each of the 241 "affected" verdicts: is the change recognised, and is the user in the told set?
6. Separately, from the tree at the tranche tip, list every dependence that is not declared: imports in tests, SQL on another module's tables, service bindings, file paths read as text, instances handed in at run time.

**Reading the result.**

- **Breaks:** a recorded change with an affected verdict that the rule does not recognise; or an affected user outside the told set.
- **Cannot prove.** Verdicts exist only for modules Process3 itself told. It told the modules whose source imports the provider; all of those are declared users. So "every declared user reaches all 241" is close to true by construction (241 of 241 in today's quick pass, section 3). The misses, if any, are where Process3 never looked:
  - declared users it did not tell: 167 pairs across the 178 changes [repo today];
  - notifications never judged: 783 triage rows say a verdict is owed [repo today]; the interface study says 134 notifications have neither a verdict nor an answer [record];
  - modules that depend without declaring (step 6);
  - changes that raised no notice at all, because Process3 looked only at source files.
  And the verdicts are the judgment of AI workers, not ground truth. The strongest honest result is "no miss against Process3's record, read at each change's own commit".
- **Inconclusive:** a change whose merge cannot be read cleanly. None so far: all 178 resolve.

**Needs.** (a) Local read-only analysis only. No act of Bob's, no session. The local clone is complete: 957,229 objects, not shallow, no missing blobs met [repo today]. A script of perhaps 300 lines; minutes to run.

**Reuse and earlier coverage.** The notices, verdicts and answers at `origin/process-state` (178, 3,125 and 2,542 files). The interface study's replay, which read the tip of the tree and called itself "indicative" [record: interface_and_cycle 1c, 1e]. Its counts of undeclared dependence: 202 test imports to an undeclared module, 38 further pairs to a later module, 24 undeclared SQL pairs, 158 undeclared path-reference pairs [record: 1a]. Today's sample scripts (appendix).

**Risk.** None.

**Depends on.** The exact definition of an interface and the form of a notice (K technical 9) are not yet fixed. The replay can score several candidate rules in one pass, so it need not wait. Its extractor is shared with J5.

### J5. Naming the changed parts lets a notified job read and test less without missing an effect

**Run.** On the J4 replay:

1. For each change, derive the named parts at its own commit: exported names before and after (functions, class members, a hash of the value of exported data); public requirement ids changed, added, retired or newly met; ids whose tests changed. If nothing can be named, mark the notice unattributed.
2. For each of the 241 affected pairs, ask whether the named parts lead to the recorded effect.
   - **Mechanical form:** the verdict's evidence sentence names one of the parts, or the user's code at that commit refers to one.
   - **Judged form:** a reader is given only the named parts and the user module, and must find the effect the verdict records. This is 241 small reading tasks. It can be done by workers inside one session, with no new cloud session.

**Reading the result.**

- **Breaks:** an affected pair in an attributed notice where the named parts do not include what changed for that user. The record already holds candidates: a value changed under an unchanged name (`op-declarations:289`, `member-roster:286`), an answer changed under an unchanged signature (`action-grammar:396`), a served page, a committed bundle, a binding [record: interface_and_cycle 1c (i)].
- **Cannot prove,** for the reasons under J4.
- **A trap in the scoring.** An unattributed notice passes trivially, because the job is then told to read everything. So the result must be two numbers: how many of the 241 sit in attributed notices and are led to; and how many sit in unattributed notices, where naming gave no saving. On the tip-based record 65 of 178 notices were unattributed and carried 63 of the 241 [record].
- **Inconclusive:** the mechanical form alone. An evidence sentence that does not cite a part does not show the part fails to lead there. Those pairs need the judged form.
- **Not covered at all:** "test less". Which of a user's tests relate to a named part cannot be picked mechanically today [record: 1b table]. The replay can measure "read less". It cannot measure "test less" without running the users' tests at 178 commits, which is a different and much larger trial.

**Needs.** (a) Local analysis only. The judged form uses this account's usage through in-session workers (Process3's triage cost a median of $0.20 a verdict [record]; 241 readings should be of that order), but no cloud session and no act of Bob's.

**Reuse.** As J4. Process3's export comparison, which already descended into classes, is in the process clone (`tool/lib`); 71 notices carry its output and can check a new extractor.

**Risk.** None.

**Depends on.** J4's script. K technical 9.

### J6. The fixed rule fills a slot the moment a job merges, and gives the same answer every time

Two claims, two trials.

**(a) Same answer every time.**

- If the rule is a script: run it twice, and on a second machine, on the same record; the outputs must be identical byte for byte. Then feed it the record with its lines in a different order; the answer must not change. Offline, minutes. This proves the claim for a script, on the cases tried.
- If ARCH applies the rule by reading text: give two fresh sessions the same record and the same rule text and compare their answers. A difference breaks the claim; agreement on a few cases does not prove it. **Judgment:** this is the argument for making the rule a script that ARCH runs and obeys.

**(b) The slot is filled the moment a job merges.**

1. In the combined run: the slot count is two, and three modules have work.
2. Jobs for modules 1 and 2 start. Note the time module 1's tests go green, the time ARCH merges it, and the time ARCH starts the job for module 3.
3. Read all three times from GitHub and from ARCH's event list.

**Reading the result.**

- **Breaks:** the third job starts only at the next hourly alarm, or ARCH picks a module other than the earliest ready one.
- **Proves, for one case:** both gaps are a few minutes. "The moment" needs a number before the trial. **Judgment:** under five minutes each. Process3's good days ran 6 to 13 minutes from ready to merged [record: redteam_feasibility 12].
- **Inconclusive:** ARCH happened to be awake for another reason when the tests went green.
- **A point the draft leaves open.** If ARCH itself merges, it is awake at the merge, so refilling the slot follows in the same turn. The wake that matters is the one before: tests green, or the job reporting done. A pull request's events go to one session at a time [tool today: `subscribe_pr_activity`]. Either ARCH holds each job's subscription, and then the job does not hear its own red test; or the job's last act is a message to ARCH. That choice is not made, and the trial times whichever is chosen.

**Needs.** (a) for the script form of part (a). (b) Part (b): ARCH and three job sessions, about 30 to 45 minutes, inside the combined run; the real chain, because what is timed is an event reaching ARCH. (c) Section 4. (d) Throwaway repository with three toy modules and an ordered module list.

**Reuse and earlier coverage.** The 194 minutes with no event, measured 2 Nov [record: audits B, C, D citing GAP-5]. The scheduling study on the real module list (65 modules with work, 21 waves) [record: no_layers_width]; its scripts are lost. A message from the coordinator was acted on only with a standing instruction naming it [probes rows 26, 27].

**Risk.** Low.

**Depends on.** Design not yet made: where working state lives (K technical 1); where the slot number is kept (K technical 6); who subscribes to a job's pull request. Shares J2's set-up.

### J7. The hourly alarm wakes ROOT itself

**Run.**

1. In its first turn ROOT creates one hourly task with no target session named, so it is bound to ROOT.
2. Wait for one firing, up to an hour plus about a minute (Process3's firings arrived 59 to 81 seconds late [1e row 9]).
3. Read the task's last run: its session id must be ROOT's. ROOT's event list must show a new turn.
4. In that turn ROOT starts one session, to show the woken ROOT can still do what a wake is for.
5. Delete the task.

**Reading the result.**

- **Breaks:** the firing creates a new session; or it resumes ROOT but ROOT cannot start a session in that turn.
- **Proves, for one firing.** Adds to Process3's eight of eight (5 of 5 on 1 Nov, 3 of 3 on 2 Nov [1e rows 9, 27]).
- **Inconclusive:** the firing fails for the container limit, or the hour passes inside another long turn (a message due during a running turn waits for the turn to end [tool today: `send_later`]).

**Needs.**

- (b) One session and one hour of waiting; almost no usage. **Judgment:** to count for ROOT it should be the ROOT Bob starts from his app, at depth 0. The five counted firings of 1 Nov were on probe sessions that another session had started; who started the sessions of the three on 2 Nov is not recorded. In use, the task of the ROOT Bob started on 8 Nov went on firing for days, but what I read does not show whether each firing resumed that ROOT or made a new session.
- (c) None of its own, if it rides in the combined run. Alone, it needs one session start by Bob and no repository and no setting. It is the only item in group B.
- (d) No repository is needed for the alarm itself.

**Reuse and earlier coverage.** Probes rows 6, 7, 9, 20 with evidence files (`evidence/7/`, `evidence/20/`). Today's tool definition says a task by default "fires into THIS SESSION, resuming the same conversation each time", and that firing a task by hand is a separate act [tool today: `create_trigger`, `fire_trigger`]. That agrees with the claim. A fresh session made by a task could start no session, 0 of 3 [1e row 28].

**Risk.** A task left behind. Process3's ROOT task kept firing after the stop of 9 Nov and had sent Bob 94 push notifications by 13 Nov [record: review.txt]. Deleting a task is an act the checker judges case by case [1d]. If it is refused, Bob must delete the task himself in the Claude app. The trial's prompt must tell ROOT to send no push notification.

**Depends on.** Nothing in the design. Best run inside the combined run: the hour of waiting overlaps J1.

### J8. A process fix cannot add a test, gate, review or stop

**Run.**

1. Choose ten Process3 faults whose recorded fix was additive. Candidates with pull request numbers are in the change sample: the zero cost figure (PR 105), the cross-module break (PR 112), and the 72 sampled additions [record: change_sample].
2. For each, prepare a packet: the process repository's tree at the commit just before the fix, and the fault as it was reported, in the words of the time. Leave out the fix.
3. Give each packet to a fixing session under the Process4 rule.
4. Read each result. Does it add a refusal, a test file, a required flag, a hold, a review step, a recorded duty? Count lines added and removed in code and in tests.

**Reading the result.**

- **Breaks:** any of the ten fixes adds one. The definition already says this trial "can break the claim. It cannot prove it."
- **Cannot prove.** Ten clean fixes show that text held ten times, on old faults presented cold.
- **Inconclusive:** a "fix" that changes nothing; a session that says it cannot fix without adding. The second is worth recording as a finding in its own right.
- **Two weaknesses in the trial's design.** Reading "is this an addition?" is a judgment with no agreed scale, so the scale must be written down before the ten are read. And Process3's additions came under pressure: reviewers briefed to find a bypass, Bob's questions, a long context [record: change_sample 5; causal_forensics]. A cold packet has none of that. **Judgment:** a clean result here is weak, and the claim stays unproven until a tranche has run.

**Needs.**

- (a) Steps 1 and 2 are offline, from the process clone.
- (b) Step 3: ten short sessions, or one session with ten workers; about 10 to 20 minutes each. They read the public process repository and return a diff in their reply. They push nothing, so no repository is written.
- **Whether they must be started the real way depends on a choice not yet made:** where the rule lives. If it lives only in the fixing session's starting text, any session can run the trial; but that is the channel Process3 showed does not hold. If it lives in Bob's own committed text in the process's repository, the fixing session must start from a repository that carries that text, which needs a new throwaway process repository and one commit by Bob. In Process3 the rule was never in his committed text [record: enforcement_levers, lever 8].
- (d) No existing repository is written.

**Reuse and earlier coverage.** The change sample's classification of all 296 merges (its table file is lost; the classes can be re-derived from commit messages). No earlier measurement covers the claim. The nearest: the rate of additions was 41% of merges before and after Bob's instruction of 5 Nov [record].

**Risk.** None to accounts. Usage: ten short sessions.

**Depends on.** K technical 2 (which session makes a process fix, and who starts it) and the choice among the enforcement options in `enforcement_levers.md` section 5. Under options A or B there the claim itself changes (a wall replaces the rule), and this trial tests something else. **Judgment:** settle that choice before spending sessions here.

### J9. The process is the same at round N as at round 1

**Run.** This cannot run before a real tranche exists.

1. At round 1, record the commit of every process file the tranche uses, and a hash of each.
2. At each round's end, compare. List every difference beside the recorded corrective fixes.

**Reading the result.**

- **Breaks:** any difference that is not a recorded corrective fix.
- **Proves, for that tranche only,** and only for files. Starting texts that one session types for another, messages, and scheduled tasks leave nothing in git [record: enforcement_levers, residue 1 to 3]. The comparison cannot see them.
- **Inconclusive:** if the set of "the process's files" is not defined before round 1.

**Needs.** (a) to write the comparison now. The trial itself needs the first real tranche: Bob starting development on the real product. No session or setting of its own.

**Reuse and earlier coverage.** Process3's baseline can be re-counted offline: the version entry moved 116 times in nine days [record: product_side 4]; 120 session commits touch it [record: enforcement_levers].

**Risk.** None.

**Depends on.** K technical 14 (which process files a product receives), K technical 3 (how a fix reaches a tranche in progress), and whether Process4 has a version entry in the product at all.

### J10. An edit to Bob's approvals is taken up with no further act of his

**Run.** Late in the combined run, while ROOT, ARCH and one job are alive:

1. The first approvals text leaves out one harmless act, for example archiving an idle session.
2. A probe before the edit: a session asked to do that act declines it.
3. Bob edits the approvals on GitHub's website to add it. This is his one extra act.
4. Then watch, without Bob: does a job started after the edit hold the new text? Are ARCH, the coordinator and ROOT, which loaded the old text, replaced or refreshed? How long does it take? Does work go on meanwhile?
5. The same probe again in each session.

**Reading the result.**

- **Breaks:** any long-lived session still holds the old text after an agreed time with no act of Bob's; or everything stops and waits for him, as five times in Process3 [record: permissions_inventory 1a].
- **Proves, for one edit:** every live session holds the new text within the agreed time and jobs kept running.
- **Inconclusive:** the probe before the edit is carried out anyway. The approvals act on the model, not as a rule, so this can happen. Then nothing afterwards shows a difference. The quoted-first-sentence probe of J3 avoids this.
