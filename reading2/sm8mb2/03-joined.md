# [file] result.md (continued)


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


# [file] codex-subscription-context-pricing-20261117.md

# Codex subscription context windows: plan, override and usage research

17 November 2026. **Status: research evidence / assistant analysis, not governing Process4 policy or an owner's new decision.** Supplement to [GPT-6 context-window investigation](codex-gpt6-context-window-investigation-20261117.md). The owner's GPT-6+ / **verified effective >=1 million token** requirement is unchanged and remains unverified for native child sessions.

## A. Does the subscription tier affect effective context-window size?

**Official evidence:** https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex says GPT-6.1 Sol's default is **500,000 tokens in Codex and ChatGPT Work**, and model availability depends on plan, workspace settings and rollout. https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers and https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex document different allowances by plan; they do **not** give a tier-by-tier GPT-6.1 Sol context-window entitlement table.

**Inference only:** observed client/account/catalog variation makes different effective windows across deployments plausible, but no reliable official evidence establishes Plus=272K/Pro=500K, that Pro always has a larger context, or that upgrading guarantees 1M.

## B. Can a subscription session request 500K or 1M?

The **Codex CLI** config option `model_context_window` is documented: https://learn.chatgpt.com/docs/config-file/config-reference. Subscription-authenticated CLI users can request `model_context_window = 500000` or `1000000`; requests are subject to the catalog maximum and effective context factor. The public real-world reproduction https://github.com/openai/codex/issues/47805 requested 1M through ChatGPT sign-in and observed an **828,400-token effective** limit after 872K catalog cap * 95%. There is no demonstrated supported context override, compaction control or usage meter for current subscription-hosted **native Process4 child sessions**. CLI settings cannot be assumed to configure unrelated hosted children.

In a known 272K-default/872K-max/95%-usable catalog, 500K requested -> 475K usable, 800K -> 760K usable, 1M requested -> 828.4K usable. The **500K product default** is not guaranteed to share the particular 272K fallback catalog; these are illustrative/runtime-observed variants, not all user's sessions.

## C. Extra billing versus subscription allowance

**Explicit official statement:** https://developers.openai.com/api/docs/models/gpt-6.1-sol states "**Usage drawn from your subscription has no long-context surcharge**." https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex repeats no additional long-context surcharge for subscription-covered GPT-6.1 Sol. Thus asking for a larger window does **not by itself** create a long-context fee within included subscription usage.

**However** https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan and https://help.openai.com/en/articles/20001625-understanding-chatgpt-and-codex-usage-limits say usage depends on model, context, task, reasoning, tools and token processing. A larger available window by itself need not process more tokens; **actually filling and repeatedly processing longer context can exhaust included allowances sooner**. Depending on plan and usage controls, exhausted allowances can lead to waiting/reset, upgrade, or spending additional purchased credits. Do not automatically authorize credit purchases or assume the owner's subscription-funded/no-extra-cost condition permits them.

**Separate API**: https://developers.openai.com/api/docs/models/gpt-6.1-sol states API requests with >272K input tokens are billed **2x input/cache and 1.5x output for the whole request**; API calls are **separately billed**, and that surcharge cannot be imported into subscription-funded Codex claims. No per-token API inference is authorized for Process4.

## Implication

Do not confuse (1) model API total 1.05M, (2) selected Codex catalog raw window, (3) usable window and compaction threshold, (4) subscription allowance and (5) API billing. Verify actual hosted model/capacity through a supported session-specific receipt. Until then owner-mandated >=1M is **not certified**, even with Pro or a CLI request. Retain proactive refresh and canon reading protections regardless of capacity.


# [file] trial_plan_facts.md (later part)


---

## 5. Order, smallest first, in three groups

### Group A. Can run now: no act of Bob's, no session on his account

| Order | Item | What | Size |
| --- | --- | --- | --- |
| A1 | J4 | The replay of 178 changes at their own commits, and the list of undeclared dependence | A script; under an hour including reading the results |
| A2 | J5, mechanical form | Named parts against the 241 | Same script |
| A3 | J6(a) | The start rule as a script, run twice and on reordered input | Minutes, once the rule is written |
| A4 | J5, judged form | 241 short readings by in-session workers | Uses this account's usage; no new session |
| A5 | J11 | The walk at the two commits around the 4 Nov break, in a scratch copy | One to two hours **if** Node 26 and a browser can be set up here; not verified |
| A6 | J8, steps 1 and 2 | Choose the ten faults; build the packets | An hour |
| A7 | J9, preparation | The round-by-round comparison | Minutes |

**Ask of Bob for group A: nothing.** A4 spends some usage inside the present session. A1 to A3 are the trials that can break a claim today.

### Group B. Sessions on his account, no setting changed

| Order | Item | What | Sessions |
| --- | --- | --- | --- |
| B1 | J7, alone | One session creates an hourly task bound to itself, is woken once, starts one session, deletes the task | 1 (plus 1 it starts), one hour |
| B2 | J8, weak form | Ten fixing sessions with the rule in their starting text only; they read the public process repository and reply with a diff | 10 short ones |
| B3 | J11, fallback | One read-only session on the product repository runs the walk twice and pushes nothing | 1, about two hours |

**Ask of Bob for group B:** his permission to use sessions on his account; and for B1 to count for ROOT, that he start that one session himself from his app with three lines of prompt. B1 is better folded into group C. B2 tests the weakest form of the rule, and **judgment:** is not worth running before the choice of where the rule lives is made. B3 is needed only if A5 cannot run here. So group B may be empty in practice.

### Group C. Needs an act only Bob can take

| Order | Item | Bob's act |
| --- | --- | --- |
| C1 | J2 | Section 4 set-up; start ROOT with a plain prompt, twice |
| C2 | J3 | His two commits on GitHub's website (part of the set-up) |
| C3 | J7 | None beyond C1 |
| C4 | J1 | None beyond C1 |
| C5 | J6(b) | None beyond C1 |
| C6 | J12(b), many modules | None beyond C1 |
| C7 | J10 | One edit of the approvals on GitHub's website, mid-run |
| C8 | J12(a), stop | One sentence to the coordinator |
| C9 | J8, strong form | One commit of the "corrects or removes, never adds" rule, in his words, in a new throwaway process repository: only if that is where the rule is to live |
| C10 | J12(c), account switch | A second Claude account: connect GitHub there as the sessions' account, make its cloud environment, start ROOT there |
| C11 | J9 | Start the first real tranche |

**Ask of Bob for group C, in plain words.** One sitting of about half an hour: make one new empty repository, let the sessions' account write to it, write his approvals and deny list into it on GitHub's website, set its two rules. Then start one session with a plain sentence, and later a second. During a run of three to four hours that he need not watch: change one line of his approvals once, and say "stop" once. Afterwards delete the repository and glance at his task and session lists. Optionally approve a prompt for an empty cloud environment. C1 to C8 are all inside that one ask. C9 and C10 are separate asks and can wait. C11 is not a trial he is asked for; it is the first real use.

### Dependencies in one view

- J3, J1, J6(b), J7, J10, J12(a), J12(b) all stand on J2's run. J10 must follow J3. J1 must follow J3, because a decline by ARCH is otherwise unreadable.
- J5 stands on J4's script.
- **Blocked by design choices not yet made:** J1 (the merge act and its tool), J2 (role texts; whether any tool exists), J6 (where state and the slot number live; who hears a job's test result), J8 (where the rule lives; who makes a fix), J9 (which files are "the process"), J10 (whether the approvals comparison stays; how ROOT is replaced), J12(a) (the stop route), J12(b) (the procedure itself).
- **Not blocked by anything:** J4, J5, J7, J11.

---

## 6. What I could not determine

- The Claude Code version and model in use today, against 2.1.316 and claude-opus-5-5 when Process3 measured.
- Bob's GitHub plan and Claude plan; what the trial run would cost in usage.
- Whether the Claude GitHub App is installed for all of his repositories or only the three.
- Whether Process3's sessions and its hourly task are still alive on his account.
- Why GitHub suspended the sessions' account on 6 Nov, and so what volume is safe. Whether the first sessions' account was restored.
- Whether this machine can run the internal walk (Node 26.10.0, the packages, Playwright with the installed Chrome). Not tried.
- Whether a fresh repository can reproduce the "old copy of the branch" fault at all.
- The ten notices (not withdrawn) whose merges change no provider source file: listed, not examined.
- How the 783 "owed" triage rows relate to the interface study's "134 notifications with neither a verdict nor an answer". Not reconciled.
