# [file] trial_plan_facts.md (continued)

- **A known hard part.** ROOT loads the approvals only at its start. Taking up an edit means replacing ROOT, and a ROOT that another session starts sits one level lower than one Bob starts [record: roles 1.6, PD-2]. The draft's answer is a standby session (K technical 4). Whether that is "no further act of yours" for ever, or only until the levels run out, is not settled.

**Needs.** (b) No sessions beyond the combined run, plus replacements; 30 to 60 minutes. The real chain is required, because the claim is about sessions Bob did not restart. (c) **One edit by Bob on GitHub's website during the run.** With the pull-request rule on the tranche, his edit is a small pull request that he merges, as in Process3 (`neobobkrause-patch-1` to `-7` in the probes repository). (d) Throwaway repository.

**Reuse and earlier coverage.** None passes. Every one of five edits stopped every role; after the last the product never restarted [record]. Row 31 gives the probe.

**Risk.** Low. Replaced sessions add to the live count.

**Depends on.** The most design of any item: item I 11 (whether the start-up comparison of approvals stays), K technical 4 (how ROOT, ARCH and the coordinator are replaced), K technical 1. It cannot be run until those are chosen. It must come after J2 and J3.

### J11. The internal walk finds what a full regression would

**Run.** The one known break is identified [repo today]: product pull request 95 (module op-declarations), merged at `ee13f80efd` on 4 Nov 06:15Z, first parent `398015cc5c`. It "merged green on its own suite and broke plane's worker.test R6, unseen until the first development deploy served 500s" (process commit `dec8e08`).

1. Copy the product tree at each of the two commits into a scratch folder with `git archive`. The clone itself is not touched.
2. In each copy run the plane's `worker.test` to confirm that R6 passes before and fails after.
3. In each copy run the internal walk: `node journey.mjs` in `bio-plane/src/journey-check`, after `npm ci` there. It is a Playwright walk on the local machine with a stand-in for the AI model; it needs no deployment and no secret [repo today: `process/config.json` `internal_walk`; `journey.mjs`]. Its time limit in Process3 was 45 minutes.
4. Compare the two reports step by step.

**Reading the result.**

- **Breaks:** the walk's failures are the same at both commits. The break was real and the walk did not see it.
- **Supports, weakly:** a step fails only at the later commit, for a reason that traces to the break.
- **Cannot prove.** It is one break, the only one known among about 200 job pull requests [record: change_sample case 1]. The claim is about everything a full regression would find. And the walk at that commit is Process3's walker of 4 Nov, not the walk Process4 will run.
- **Inconclusive:** the walk is already red at the first parent in the area the break touches. That is likely: the first recorded internal walk, on 5 Nov, failed 63 of 236 steps; the last failed 96 of 357 [repo today: `origin/process-state` `walks/internal/`, `deploys/p3dev-l12/.../internal/report.txt`]. No walk in Process3 ever passed.
- **A second, cheaper reading that needs nothing run.** Compare the recorded walk failures with the recorded test failures of the same days. On the one comparable day a clean internal walk was followed by an external walk with 1,691 failures [record: k_evidence]. That is evidence against a neighbouring claim (internal against external), not this one.

**Needs.** (a) Local, in a scratch copy, **if this machine can be made to run it.** Not verified: the product needs Node 26.10.0 (this machine has 22.23.4), fetched from nodejs.org; `npm ci` in up to seven packages; and a browser for Playwright (`/usr/bin/google-chrome` is present; whether `playwright-core` 1.56.1 accepts it was not tried). I ran none of this. If it cannot run here, the fallback is one cloud session on the product repository that only reads, runs the walk in its own container and pushes nothing. That is a session on Bob's account but writes nothing.

**Reuse.** The walk and its reports, as above. The product's `.claude/hooks/session-start.sh`, which installs Node 26 and the packages.

**Risk.** None to accounts if run locally. The read-only session fallback must be told to deploy nothing: the cloud environment named BIO holds the real Cloudflare token [record: k_evidence].

**Depends on.** Nothing in Bob's hands. K technical 13 (how the walk is shared out) does not affect this replay.

### J12. A change across many modules, an account switch, and a stop on Bob's word

Three rehearsals. They differ greatly in size.

**(a) A stop on Bob's word.** Smallest.

1. At the end of the combined run, with ROOT, ARCH, the coordinator, two jobs and the alarm alive, Bob tells the coordinator to stop.
2. Record the time of his words, the time of the last act by any session, and the time of the last alarm firing that did anything.
- **Breaks:** any session starts new work after an agreed time, or the alarm restarts work. After the stop of 9 Nov Process3 ran on for over two hours [record: definition J 12], and its alarm fired for days.
- **Proves, for one case.** **Inconclusive:** sessions were idle anyway.
- **Needs:** no extra session; one sentence from Bob; ten minutes plus one alarm period.
- **Depends on:** K technical 6 (how a stop reaches every session). A message from another session arrives marked as data from a peer, not as a person's word [tool today: `send_message`]. So "the coordinator passes it on" needs a route that sessions will act on. Process3's sessions acted on a coordinator's message only when their starting text named it [probes row 26].

**(b) A change across many modules.**

1. In the throwaway repository with ten or more toy modules, make one trivial change that touches all of them (a renamed word in each).
2. Run it as one pass, by whatever procedure is written. Record who did it, which tests ran, and how it merged while jobs were open on some of the modules.
- **Breaks:** no single pull request can pass a check that runs "only its own module's tests"; or it collides with open jobs; or the rule that a job writes only its own module's files stops it.
- **Cannot prove** realism on toy modules. A real rehearsal needs a copy of the product, which means a second new repository.
- **Needs:** ARCH and perhaps one worker, about 30 minutes, in the combined run.
- **Depends on design not yet made:** it "never had a procedure". K technical 7 (who judges it trivial), and K for Bob 1 (whether the own-files check ends). **Judgment:** this is a design task before it is a trial.

**(c) An account switch.** Largest by far.

1. Bob tells the coordinator a switch is coming. The old account's sessions stop and leave their state in git.
2. On the second Claude account Bob connects GitHub as the sessions' account, makes the cloud environment, and starts ROOT with a plain prompt that mentions the switch.
3. The new ROOT picks up from git alone.
- **Breaks:** work is lost, or the new side needs anything from the old side that it cannot read. Recorded facts: "Old sessions cannot be messaged or archived from the new account"; tasks cannot be read across accounts; 13 job sessions were stranded and 94 minutes passed with no job on 5 Nov; the switch of 7 Nov was cancelled after about 9.5 hours [record: roles 3.4].
- **Needs:** a second Claude account of Bob's, with usage of its own. Bob's acts there: connect GitHub as the sessions' account, check the Claude GitHub App covers the repository, create the cloud environment, start ROOT. These are the Claude-side acts that K for Bob 2 asks him to accept. About six sessions across the two accounts, one to two hours.
- **Risk:** connecting GitHub on the new account as the wrong user. On 5 Nov every push then went out as Bob himself, the repository's admin [record]. Sessions left alive on the old account.
- **Judgment:** rehearse this only when a real switch is near, and on the throwaway repository.

---

## 2. What the probes repository holds

`neobobkrause/process3-probes`, public, cloned today. 312 branches; `main` has 97 commits to 2 Nov.

- **`origin/phase0/platform-table`: `platform/TABLE.md`**, 31 rows measured on 1 Nov, each with saved tool results under `platform/evidence/`. Reusable as written, with names changed:
  - `evidence/28/driver-prompt.md`: 20 rounds of push, open, comment, merge, session start, interrupt, archive, task create, switch off, delete. The model for J1.
  - `evidence/31/claudemd-vs-control.md`: the unforeseen-ask probe with and without Bob's committed text, and how the checker's decision is read from the event list. The model for J3 and J10.
  - `evidence/3/3b-project-settings.md`, `evidence/24/deny-x3.md`: deny-list probes. J3.
  - `evidence/7/`, `evidence/9/`, `evidence/20/`: task firings into a bound session, and firing by hand. J7.
  - `evidence/26/`, `evidence/27/`: whose message a session acts on. J6, J12 stop.
  - `evidence/19/container-limit.md`: the limit of about 50 live sessions.
- **`main`:** the 2 Nov rounds, `physics/r3`, `r4` and `c1` to `c15`: 38 merges into the tranche and 13 of the tranche into main, every one with a `Reviewed:` line [record: permissions_inventory 2a]. Also Bob's approvals of 2 Nov, an 11-rule deny list, and a five-second test workflow (`.github/workflows/probe.yml`) that can be copied as the trial's required check.
- **What it does not hold:** any trial of a merge with no review at ARCH's level started from Bob's own ROOT; any trial of the alarm on a ROOT Bob started; any approvals-edit trial; any evidence file for the 2 Nov counts ("11 of 11", "0 of 21", "about 450"), which rest on the Foundations alone [record: permissions_inventory, limits].
- The repository itself must not be used for the new trials: it is one of the existing public repositories, and its approvals name Process3.

---

## 3. J4 and J5: the offline replay, checked today

### Feasibility: yes, complete, from the local clones

- **Records.** `origin/process-state` in `/home/user/repos/civicsmith-copy`, tip `c4c2529`: `notices/<provider>-<pr>.json` (178), `notices/triage/<user>-<provider>-<pr>.json` (3,125), `notices/answered/` (2,542), `notices/withdrawn/` (6).
- **Commits.** Each notice names a pull request. Its merge commit has the subject `Merge job PR <n>` (144 notices) or `Merge layer PR <n>` (34). 175 are reachable from `origin/tranche`; the other three (pull requests 1097, 1098, 1099) are on the unmerged `layer/14` and are found with `git log --all`. **All 178 resolve to exactly one merge commit, and both parents are present** [repo today].
- **The change at its own commit** is `git diff <first parent> <merge>`. The module list at the first parent (`build/modules.json`) gives the provider's `paths`, `tests` and every declared user at that moment. The provider's requirement file is `build/requirements/<module>.md`.
- **Script.** About 300 lines of Python driving `git show` and `git diff`; no checkout, no fetch. Parts: (1) resolve notices to merges; (2) classify changed files into provider source, provider tests, requirement file, other; (3) extract named parts before and after: exported names and signatures, class members, a hash of exported data, public ids from the `## Public` part, ids in changed test titles; (4) join to the verdicts; (5) score each candidate rule. A second script of about 200 lines lists undeclared dependence from the tip's tree.
- **Speed.** A pass that touches all 178 changes ran in 1.7 seconds.

### Quick full-width pass [repo today; a structural check, not the replay]

| | Count |
| --- | --- |
| Notices resolved to a merge with both parents | 178 of 178 |
| Notifications in the notices | 2,707 (matches the record) |
| Verdicts: affected / not affected / owed | 241 / 2,101 / 783 (the first two match the record) |
| Affected users that are declared users of the provider at the change's first parent | 241 of 241 |
| Affected users named in the notice | 241 of 241 |
| Declared users at the first parent that Process3 did not notify | 167 pairs |
| Notices whose merge changes no file under the provider's source paths | 14 of 178 |

Two things in it need a warning.

- **"241 of 241" is nearly true by construction.** Process3 judged only the modules it told. See J4.
- **The 14 notices with no source change.** Four of them are among the six withdrawn notices. Ten are not. Their merges change only tests, fixtures, scripts or the requirement file. Two of the 14 carry an "affected" verdict: `calculations:70`, whose merge changes only `build/requirements/calculations.md`, and `credentials:74` (withdrawn), a test and the requirement file. So a rule that recognises a change only by "a source file changed" would have missed at least one recorded effect. The four-part rule of the definition, which also reads public requirements and tests, may catch it. That is exactly what the full replay must settle. I did not look further into the ten.

### Sample of seven changes [sample]

Chosen by hand to cover the hard kinds the interface study names; not random. My extractor here is crude: top-level `export function / class / const` only, no class members, no value hashes, and only `R` ids.

| Change | Files changed (source / tests / requirement file) | Parts re-derived at the commit | Affected users | In told set | Evidence cites a re-derived part |
| --- | --- | --- | --- | --- | --- |
| `actions:715` | 1 / 2 / yes | 6 names (matches the notice's own export record), public ids R112 to R116, 7 test ids | 0 (only 2 of 12 notified were ever judged) | | |
| `op-declarations:289` | 1 / 2 / no | no names; 8 test ids | 1 | 1 | 0 |
| `action-grammar:396` | 1 / 2 / yes | 1 name; public ids R5, R31 (matches the notice); test id R31 | 2 | 2 | 2 |
| `interface-shell:310` | 1 / 6 / yes | no names; 6 test ids | 1 | 1 | 1 |
| `agent-worker:569` | 15 / 11 / yes | nothing | 2 | 2 | 0 (unattributed) |
| `interface-assets:443` | 2 / 1 / yes | no names; test id R6 | 3 | 3 | 0 |
| `member-roster:286` | 1 / 1 / no | nothing | 1 | 1 | 0 (unattributed) |

What the sample showed.

- **J4:** all 10 affected pairs were declared users at the change's own commit and were told. In `actions:715`, 7 declared users were not notified by Process3 and so were never judged.
- **J5:** of the 10 affected pairs, 3 have evidence that names a re-derived part; 3 sit in changes where nothing could be named (the notice would say "unattributed"); 4 sit in changes with named parts that the evidence does not cite, and need a reader's judgment.
- **Two things the four parts as drafted may not see.** In `op-declarations:289` and `member-roster:286` the effect is a changed value under an unchanged name; only a hash of the exported value would name it. In `interface-assets:443` and `agent-worker:569` the requirement file changed only in "found" marks (`F1` struck as met; `F5` added), which are not `R` ids. Whether found marks count as public requirements is part of K technical 9.
- In `agent-worker:569` my extractor found no changed name in 15 changed source files. That may be the extractor, not the code. Unchecked.

---

## 4. The combined trial run: one set-up for seven items

J1, J2, J3, J6(b), J7, J10 and the stop and many-module rehearsals of J12 can share one throwaway repository and one sitting of Bob's. Asking him once is the reason to combine them.

**What Bob does, once (judgment: 30 to 45 minutes; Process3's own guide for the same has 11 steps [repo today: `setup/DEVELOPER.md`]).**

1. Create one new repository under his account, for example `process4-trial`. Public or private; private keeps the trial out of sight but may change which GitHub features apply (rulesets are documented for public repositories on the free plan [record: enforcement_levers]). His plan is not known.
2. Give the sessions' GitHub account write access to it, and accept the invitation signed in as that account. Check the Claude GitHub App covers the new repository. If the app is installed for "All repositories", there is nothing to do; I could not determine which.
3. Let a preparatory session fill the repository: a tranche branch, three to ten toy modules with a module list, a five-second test workflow, the role texts, and the minimal merge-and-push tool. This must happen before step 5, or go through pull requests he merges.
4. Commit his approvals to `CLAUDE.md` and the deny list to `.claude/settings.json` on the tranche branch, on GitHub's website, in his own words. **Judgment:** leave out the Cloudflare, Docker Hub and release paragraphs, so that a trial session has no approval to touch them; and leave out one harmless act, for J10.
5. Set the rules: no branch deleted or force-pushed; main and tranche take changes only by pull request with the check passing; no required approvals; merge commits allowed.
6. Start ROOT: a new session on that repository, tranche branch, a plain prompt. Later a second ROOT (J2 step 5).
7. During the run: one edit to the approvals (J10); one sentence to the coordinator, "stop" (J12a).
8. Afterwards: delete the repository; look once at his list of scheduled tasks and of sessions for anything the trial left.

**Choice for Bob on the Claude side.** The existing cloud environment, BIO, holds the product's real deploy tokens and signing seeds [record: k_evidence]. A trial session started in it holds them too. **Judgment:** a separate empty environment for the trial is safer. A session can propose one and Bob approves a prompt [tool today: `create_environment`]; this is one more act, of the kind K for Bob 2 raises.

**Order inside the run, smallest first.** J2 (start-up), J3 (four probes), J7 (create the alarm; it fires within the hour), J1 (twenty merges while the alarm is awaited), J6(b), J12(b), J10, J12(a), clean-up. If J2 or J3 fails, the run stops there and little has been spent.

**Size (judgment).** ROOT twice, ARCH, the coordinator, five to eight job sessions, a few probe targets: about 12 to 15 sessions, three to four hours of wall time, most of it waiting. Peak live sessions under ten.

**What must exist first, written by sessions and not by Bob:** role texts for ROOT, ARCH, the coordinator and a job; the minimal tool; the fixed start rule as a script; the stop route; the replacement route for J10. Each is a design choice in section K that is still open. The run cannot be honest before they are made, because it would otherwise test something made up for the trial.

**Risks of the run as a whole.**

- **Suspension of the sessions' GitHub account.** The run's volume is perhaps 60 pushes, 30 pull requests and 30 merges over three hours, far under Process3's 173 pushes in one hour. But why GitHub suspended the account on 6 Nov was never learned, so I cannot say what volume is safe. Mitigations: space the merges; no state branch; nothing that polls GitHub.
- **Usage.** Not determined. Bob's plan and limits are not in the record. For scale only: one Process3 coordinator session is recorded at $37.24 at its hand-over; coordinators lived four to eight hours [record: roles 1.2].
- **Left behind:** the repository; sessions (archiving is judged case by case; Process3 measured 2 of 5 and 60 of 60 in different sessions [1e row 5]); the hourly task; a cloud environment if one is made; push notifications to Bob's phone.
- **Old Process3 leftovers.** Whether Process3's ROOT, its hourly task and other sessions are still alive on the account was not determined. If they are, they count toward the live limit and the old task still notifies Bob. **Judgment:** ask him to look before the run.

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
- Whether `playwright` failures at the 4 Nov commits would hide the break. Only running it will tell.

---

## Appendix. The quick pass, as run today

Run from `/home/user/repos/civicsmith-copy`; reads only. It needs `git log --all --merges --since=2026-11-01 --format='%H %P|%s'` saved as `merges_all.txt`.

```python
import re, sys, subprocess, json, collections, io, tarfile
S = sys.argv[1]
def show(rev, path):
    r = subprocess.run(['git','show',f'{rev}:{path}'], capture_output=True, text=True, errors='replace')
    return r.stdout if r.returncode == 0 else None
def git(*a): return subprocess.run(['git',*a], capture_output=True, text=True, errors='replace').stdout
merges = {}
for line in open(S + '/merges_all.txt'):
    h, rest = line.split(' ', 1); parents, subj = rest.rstrip('\n').split('|', 1)
    m = re.match(r'Merge (job PR|layer PR)\s*(\d+)\b', subj)
    if m: merges.setdefault(int(m.group(2)), []).append((h, parents.split()))
tf = tarfile.open(fileobj=io.BytesIO(subprocess.run(
    ['git','archive','origin/process-state','notices'], capture_output=True).stdout))
notices = {}; tri = collections.defaultdict(list)
for m in tf.getmembers():
    if not m.isfile(): continue
    if re.match(r'notices/[^/]+\.json$', m.name):
        d = json.loads(tf.extractfile(m).read()); notices[d['key']] = d
    elif m.name.startswith('notices/triage/'):
        d = json.loads(tf.extractfile(m).read()); tri[d.get('key')].append(d)
c = collections.Counter()
for key, n in notices.items():
    M, (P1, P2) = merges[n['pr']][0]
    mods = json.loads(show(P1, 'build/modules.json'))['modules']
    me = [m for m in mods if m['id'] == n['provider']][0]
    declared = {m['id'] for m in mods if n['provider'] in m.get('uses', [])}
    files = git('diff','--name-only','--no-renames', P1, M).splitlines()
    c['source_changed' if any(f.startswith(x) for f in files for x in me['paths']) else 'no_source_change'] += 1
    c['declared_not_notified'] += len(declared - set(n['users']))
    for r in tri.get(key, []):
        if r.get('verdict') == 'affected':
            c['affected'] += 1; c['affected_declared_at_base'] += r['user'] in declared
for k, v in c.items(): print(v, k)
```

The seven-change sample used the same resolution, then compared, between first parent and merge: `export` statements of changed source files; `**R<n>**` lines under `## Public` of changed requirement files; and `R<n>` in added or removed test-title lines of changed test files.


# [file] causal_forensics.md

# Process3: why the sessions added checks anyway

Independent causal forensics from the repository, at the level of the text each session read and the incentives that text created.

## Scope, sources and limits

- Repository: `/home/user/neobobkrause/process3` (read only). Snapshots used, all on `origin/tranche` (first parent):
  - 2 Nov: `7a1b45d` (Merge PR 26)
  - 4 Nov: `5ecda36` (Merge PR 133)
  - 6 Nov: `a8a6252` (Merge PR 207)
  - 9 Nov: `38b0f3f` (Merge PR 302, the tip)
- Coordinator notes: `origin/start/coordinator-4nov`, `notes/` (26 handoff notes, `coordinator-findings-3-4nov.md` 540 KB, `problem-classes.md`, `velocity-audit-9nov.md`). An earlier text of the 5 Nov handoff survives only on `origin/study/train-throughput` (`75d832e`).
- Approved Foundations: `/tmp/claude-0/-home-user/5fb00928-6c32-53d3-a000-4e1f643cb17f/scratchpad/work/foundations.md`.
- Product repository `civicsmith-copy` is a blobless clone. I read only its `origin/process-state:handoff/bob.md` and its tree listings.
- Not available to me: session transcripts, the Build Plan (it held "rule 5", "rule 8", "rule 9"), the briefs the coordinator typed to process3 builders, and the prompts builders gave their cold-review subagents. Where I describe those, I infer from commit messages, merge rows and the coordinator's log, and say so.
- Times in Claude-authored commits and the log are UTC. Owner merges are shown in his local time (UTC-8).
- Sentence classification (item 1) is a keyword heuristic that I hand-checked on the short texts. Treat ratios as order of magnitude.
- The prior review was read only after sections 1 to 8 were formed. Section 9 compares.

## Headline

The sessions did not add checks against the text they read. They added checks in obedience to it. Four properties of the text explain most of the week:

1. The same approved paragraph that says "caution is a cost" also says every failure is "an architecture bug" whose correction BOB "builds", and that "a workaround for the moment is not a fix". The restraint clause covered only a reviewer's "what if". Failures of the process's own machinery were outside it, and they were the bulk of the week's inputs.
2. The Foundations name what holds each property. The anti-check property is "held by" an "Audit of citations". So what got built was a citation requirement, and every addition carried a citation.
3. Restraint was a "Nudge" read once. Checks were code that refused on every call. From 6 Nov every GAP-3 line in every rulebook also carried "before the log; unverified".
4. The roles that authored process change (coordinator, process3 builders, their cold reviewers) had no tool-printed text carrying the restraint. Their operative rulebook was a hand-written chain of 26 handoff notes in which one session's choice became the next session's standing rule.

The one restraint that had a hard mechanism held all week: role prompts are capped at 4,096 bytes by a test and stayed at 4,032 to 4,197 bytes from 4 to 9 Nov, while `tool/lib` grew from 1,431 to 23,429 lines.

## 1. Every instruction text a session loaded, at four points in time

### 1.1 Inventory and sizes

| Text | Who loads it | 2 Nov `7a1b45d` | 4 Nov `5ecda36` | 6 Nov `a8a6252` | 9 Nov `38b0f3f` |
| --- | --- | --- | --- | --- | --- |
| `CLAUDE.md` (owner's standing approvals only) | every session in process3 | 4,668 B | 6,489 B | 6,937 B | 2,818 B |
| ROOT prompt (`tool/lib/roles.mjs` `rootPrompt`) | ROOT | none in repo | 4,047 B | 4,034 B | 4,034 B |
| BOB prompt (`bobPrompt`) | BOB | none in repo | 4,032 B | 4,044 B | 4,044 B (direct flow 4,197 B) |
| Watcher prompt | watcher | none | 2,724 B | 2,621 B | 2,621 B |
| Coordinator prompt (`coordinatorPrompt`, from PR 162, 5 Nov) | coordinator | typed by owner or predecessor | typed by predecessor | 1,961 B | 1,980 B |
| MERGER prompt (5 to 6 Nov only) | MERGER | none | none | removed (PR 191) | none |
| Job START (`tool/lib/job.mjs`) | job | about 2.5 KB template | generated | generated | generated |
| Review brief (`tool/lib/review.mjs`, from `f7703f1`, 3 Nov) | product review worker | none | generated | generated | generated |
| `rulebooks/bob.md` | BOB, once | none (added `c1e10a8`, 4 Nov 00:00) | 3,439 B | 4,061 B | 4,039 B |
| `rulebooks/job.md` | job, once | none | 1,619 B | 1,985 B | 2,005 B |
| `rulebooks/root.md` | ROOT, once | none | 2,389 B | 3,307 B | 3,307 B |
| `rulebooks/watcher.md` | watcher, once | none | 1,899 B | 2,113 B | 2,114 B |
| `rulebooks/worker.md` | review worker, once | none | 1,065 B | 1,207 B | 1,204 B |
| `rulebooks/layer-branch.md` | BOB, jobs | none | none | 6,561 B | 3,082 B (rewritten as the direct flow) |
| `rulebooks/account-switch.md` | ROOT | none | none | 2,963 B | 8,375 B |
| `shims/CLAUDE.process.md` (4 bullets in the product's CLAUDE.md) | every product session | none | 878 B | 1,019 B | 1,019 B |
| `README.md` (command reference, known limits) | builders, reviewers, on demand | 7,955 B | 89,805 B | 116,270 B | 134,219 B |
| `DECISIONS.md` (PD-n, BD-Rn; from `778164f`, 6 Nov) | coordinator, builders | none | none | 3,969 B | 49,077 B |
| `governing/foundations.md` | nobody by instruction | not in git | not in git | not in git | 69,452 B (snapshot `3155223`, 7 Nov 05:42) |
| Coordinator handoff note (hand-written, `notes/coordinator-handoff-*.md`) | coordinator | none | 7,004 B (4nov), 7,357 B (4nov-d) | 5,707 B (6nov-c) | 3,957 B (9nov-c) plus `velocity-audit-9nov.md` 6,398 B |
| Coordinator findings log | coordinator, "read from ... down" | none | about 150 KB | about 400 KB | 540,615 B |
| `triage/README.md`, `register.json` | triage lane | none | none | 939 B, 1,485 B | same |
| Tool code that refuses (`tool/lib/*.mjs` + `p3.mjs`) | every session, every command | 3,120 lines, 141 `fail(` | 12,677 lines, 452 | 20,957 lines, 707 | 23,429 lines, 818 |

Three facts stand out.

- The role prompts did not grow. A test holds them to one screen (`tool/test/roles.test.mjs:98`: `assert.ok(Buffer.byteLength(promptBody(p)) <= 4096, 'one screen')`). The BOB prompt changed by 12 bytes in five days.
- The growth went to the places with no cap: tool code (16 times the lines, 15 times the refusal sites from 1 Nov to 9 Nov), `README.md` (17 times), `DECISIONS.md`, and the coordinator's handoff chain.
- For 1 to 6 Nov the Foundations were not in the repository at all. They lived as a claude.ai page. The first handoff tells the successor to open them "only when a step needs a line" (`notes/coordinator-handoff-4nov.md`, `ac523d8`). After the 5 Nov account switch, "The Build Plan text was never supplied" (`notes/coordinator-handoff-5nov.md`).

### 1.2 Sentence classes

Classes: (a) do, ship, decide; (b) stop, hold, verify, check, record, ask; (c) restraint on adding process. Unclassified sentences are descriptive.

| Text (9 Nov unless dated) | Sentences | (a) | (b) | (c) | b : a | b : c |
| --- | --- | --- | --- | --- | --- | --- |
| BOB prompt | 33 | 9 | 11 | 2 | 1.2 | 6 |
| ROOT prompt | 36 | 6 | 12 | 2 | 2.0 | 6 |
| Watcher prompt | 25 | 6 | 4 | 2 | 0.7 | 2 |
| Coordinator prompt | 19 | 3 | 10 | 0 | 3.3 | none |
| `rulebooks/bob.md` | 43 | 2 | 29 | 5 | 14.5 | 6 |
| `rulebooks/job.md` | 19 | 3 | 13 | 3 | 4.3 | 4 |
| `rulebooks/root.md` | 31 | 4 | 20 | 2 | 5.0 | 10 |
| `rulebooks/watcher.md` | 22 | 3 | 14 | 1 | 4.7 | 14 |
| `rulebooks/worker.md` | 12 | 1 | 8 | 2 | 8.0 | 4 |
| `rulebooks/layer-branch.md` | 32 | 9 | 11 | 0 | 1.2 | none |
| `rulebooks/account-switch.md` | 96 | 10 | 45 | 0 | 4.5 | none |
| `CLAUDE.md` | 10 | 4 | 2 | 0 | 0.5 | none |
| `README.md` | 595 | 109 | 344 | 1 | 3.2 | 344 |
| `DECISIONS.md` | 405 | 90 | 172 | 7 | 1.9 | 25 |
| Foundations (approved) | 390 | 57 | 209 | 8 | 3.7 | 26 |
| `README.md`, 2 Nov | 50 | 7 | 29 | 0 | 4.1 | none |
| `README.md`, 4 Nov | 384 | 69 | 230 | 1 | 3.3 | 230 |
| Handoff 4nov | 56 | 14 | 23 | 0 | 1.6 | none |
| Handoff 5nov (early text, `75d832e`) | 60 | 12 | 27 | 3 | 2.2 | 9 |
| Handoff 5nov-b | 50 | 11 | 20 | 0 | 1.8 | none |
| Handoff 7nov | 46 | 9 | 11 | 1 | 1.2 | 11 |
| Handoff 9nov-b | 37 | 4 | 19 | 0 | 4.8 | none |
| Handoff 9nov-c (after the audit) | 35 | 7 | 13 | 2 | 1.9 | 6 |

Reading: the approved Foundations are about 4 check sentences to 1 act sentence and 26 to 1 against restraint. The rulebooks are steeper. The largest and fastest-growing text, the README, has one restraint sentence in 595. The restraint sentences did not change in number between 4 and 9 Nov. Everything around them grew.

### 1.3 The most consequential sentences

Type (c), restraint:

- Foundations, "The human and the AI": "caution is a cost, paid only against a measured failure or your word. A problem is a failure that happened, or your word; a reviewer's "what if" is not a problem, and is one line in a report." and "The default answer to a finding with nothing measured behind it is no change, and a rule, check, review round, measurement run or owed task exists only against a measured failure or your word (GAP-3)."
- `tool/lib/roles.mjs` `PRIORITIES`: "Priorities first. The process exists to merge product behaviour that survives, quickly and cheaply. Caution is a cost, paid only against a measured failure or Bob's word. Build and do the smallest thing the work needs."
- `rulebooks/bob.md` rule 1 (9 Nov text): "A problem is a failure that happened, or Bob's word, and a rule, check, review round, measurement or owed task exists only against one; delete one that cites neither. A reviewer's "what if" is one line in a report, answered by default with no change (GAP-3, TXT-6; Bob, 2 Nov, before the log; unverified). Nudge."
- `tool/lib/review.mjs`: "A session attacking on purpose is held by GitHub's walls, so such a finding is a known limit, a note, not a fix." and the output form: "marked either "fix: <a mistake a real session would plausibly make within the scope>" or "note: <one line, no change>"."

Type (b), and type (a) sentences that mandate building:

- Foundations, same paragraph as GAP-3: "Every problem is an architecture bug: BOB finds why, corrects the design by rewriting the line it belongs to, never by appending, and builds the correction; a workaround for the moment is not a fix."
- Foundations, "The shape in one paragraph": "Nothing the model says is evidence: a job's claim is a receipt, the gate is CI, the revert check proves tests are real, and branch protection is the last word".
- Foundations, properties table preamble: "A property held only by text is a nudge and is marked so; the record exposes a violated nudge at the next status."
- Foundations, properties table, the row for GAP-3: "Every rule, check, review round and measurement cites a measured failure or your marked decision | Audit of citations; rulings deleted once absorbed".
- Foundations, Setup: "`setup check` reads every condition it can, at onboarding and before every job start; a missing one stops the start".
- `rulebooks/root.md` rule 7: "Recorded state carries a checkable end; the tool ends it when that holds, and the sweep reports what stays stale. Never end one by hand: report it, and its fix is a process3 build (Bob, 6 Nov)."
- `rulebooks/bob.md` rule 3: "stale state is never cleared by hand".
- BOB and ROOT prompts, first command: "`start check`. If it fails, act on nothing".
- `tool/lib/merge.mjs:134`: `fail('say whether a fresh reviewer ran: --reviewed "<what>" or --no-review "<why>" (INT-2)')`.
- Coordinator prompt, the whole decision section: "Process technical decisions are yours and product decisions BOB's (AUD-5, kept by Bob 6 Nov). Write each of yours as a short decision record".

### 1.4 Where the anti-check rule physically lived, and who never saw it

| Location | Form | Since | Reader |
| --- | --- | --- | --- |
| Foundations paragraph and one table row | prose, on claude.ai; in git only from 7 Nov (`3155223`) | 2 to 3 Nov | whoever opened it; no role is told to load it |
| `PRIORITIES` constant in `roles.mjs` | first line of the ROOT, BOB, watcher (and MERGER) prompts | 3 to 4 Nov | ROOT, BOB, watcher, MERGER |
| `review.mjs` brief, "Priorities" and "Threat model" | two sentences | 3 Nov (`f7703f1`) | product review workers that BOB starts through `p3 review brief` |
| `rulebooks/bob.md` rule 1, `job.md` principle 2 and rule 2, `root.md` rule 4, `worker.md` rule 3 | each ends "Nudge." | 4 Nov (`c1e10a8`) | read "once at start" |
| `README.md` "Known limits" | one paragraph | 2 Nov (`07eada7`) | on demand |

Roles that never received it in tool-printed text:

- **The coordinator.** `coordinatorPrompt` has no `PRIORITIES` line and names no rulebook. The log says so itself on 5 Nov 14:55: "Structural causes in process3: no coordinator rulebook (rules live in chained handoffs that copy "STILL BOB'S" forward)".
- **Process3 builders** (the sessions behind the roughly 300 `build/*` branches). The tool has no builder role, START or rulebook (`grep -i builder tool/` finds nothing but a mention in the account-switch runbook). They load process3's `CLAUDE.md`, which is approvals only, plus whatever the coordinator typed.
- **Builders' cold-review subagents.** Their findings arrive labelled high, medium and low, not "fix" and "note", so they were not run from `p3 review brief`.
- **Pin-move sessions and lanes** (`pin.mjs`, `lane.mjs` prompts carry no priorities line).
- **Jobs**, in their START. The line is only in `rulebooks/job.md`, read once, as a nudge.

So the roles that carried the sentence (ROOT, BOB, watcher, MERGER) were the ones forbidden to touch the tool ("never edit `.process/` by hand"), and the roles that wrote the tool did not carry it.

I rank this lower than it first looks (section 7, driver 6): the coordinator plainly knew the rule and cited it, and BOB, who had it as line 1 of its prompt, still added cautions of its own.

## 2. Reviewer and builder briefs

**What a reviewer was asked to produce** (`tool/lib/review.mjs`, unchanged in substance from 3 Nov to 9 Nov): "Every gap in one pass, each with file and line, marked either "fix: ..." or "note: <one line, no change>". End with one verdict line: "verdict: merge" or "verdict: fix first"." Also: "For each requirement mark the branch struck, confirm a test asserts that requirement at the module's interface ...; a test that does not is a fix." and, for a trigger: "Each is a fix unless a requirement or recorded decision makes it right."

**Labels.** In the tool's brief: "fix" and "note" only. In practice, for process3's own builds, commit and merge messages show severity labels and "blocking":
- "review: 3 high + 6 medium fixed" (handoff 6nov-c, R17)
- "Reviewed: replay-each: one cold review by builder ef7TXuV (1 high, 1 med, 2 low fixed, tests added)"
- "two cold reviews (round 2's blocking finding ... fixed)" (log, 5 Nov 10:33)
I did not find the word "blocker" as a label in the repository; "blocking" and "high" are what the record shows.

**What a builder must do with a finding.** The brief's last section: "One review and one fix pass, then a second review" for the gate, record, approvals and merge code, else "One review and one fix pass; no second review". Nothing in any tool text tells the builder or BOB how to answer a "fix:" item other than by fixing it. The job START does not mention review at all.

**Was "decline with one line" offered, and was it costless?**
- For the reviewer: yes, from 3 Nov ("note: <one line, no change>"), and the threat-model sentence makes deliberate-attack findings notes by rule.
- For the builder: not offered. It was possible, because `merge --reviewed` takes `--findings <n>` and `--acted-on <n>` and only refuses `acted-on > findings` (`merge.mjs:153-174`). It was not costless: the number of unacted findings is written into the merge row, while acting on a finding needs no justification anywhere.
- The merge interface is asymmetric the same way one level up. Skipping review needs a reason (`--no-review needs why`, `merge.mjs:131`); running one needs none.
- Recorded outcome: where the log gives both numbers (13 merges, 5 to 9 Nov), 102 of 104 findings were acted on. Examples: "findings 22 / acted 21", "findings 10 / acted 10", "findings 16/16".
- The coordinator's own practice for process3 builds went past the brief. The 9 Nov audit lists it: "Coordinator practices imposed on builders: cold subagent review of every PR (the Plan asks it only for gate, ledger, merge and permissions code); fix every finding with tests (contradicts GAP-3); PD-17 rehearsal; full suite run locally and again by the coordinator." From 7 Nov nearly every build branch ends with a commit titled "C<n>: the cold review's findings".
- Decline became an explicit, default option for builders only on 9 Nov, cut K1: "Cold review only for gate, merge, record and approvals code; what-ifs logged, not fixed (GAP-3)."

Round limits existed and leaked. The 2 Nov history shows five rounds on one change ("Review fixes", "Re-review fixes", "Second re-review fixes", "Third re-review fixes", "Fourth re-review fixes" for PR 26; "Fifth re-review nits", "Final review nits" for build 22). A round limit was added on 3 Nov (`50c04e7`). After that a further round needed `--decision`, which the deciding session wrote itself: "merge --plain --rounds 3 with --decision: third round because rule c changed R8 after the second review" (log, 6 Nov 16:14).

## 3. Accretion through handoff notes

The coordinator was replaced about 25 times in six days (the 9 Nov audit's count). Each handoff carried sections named "GUARD RAILS", "HOW TO WORK (learned today)", "Lessons", "Rules in force", "MY STANDING RULES TO BOB", "Merge practice", "Practice". Five traces.

**A. Second review of trust code becomes cold review plus local re-run of everything.**
- 4 Nov 00:25, `coordinator-handoff-4nov.md`, GUARD RAILS: "Rule 5: a change to the gate, record check, approvals check or merge tool gets a second, confirming review (PR 57 found a path traversal that way)."
- 4 Nov 14:50, 4nov-c, HOW TO WORK: "Builds: one fresh review and one fix pass. At most 2 rounds for the gate, record or merge."
- 5 Nov 00:15, early 5nov: "every gate/merge/record change gets a confirming review".
- 5 Nov 23:55, 5nov (later text), Lessons: "Wait for an announced review before merging, not only for ci (179 merged without its fix; 182 followed)."
- 7 Nov 04:55, 7nov-b, "Merge practice": "after merging the PR head with the current tranche locally and running `HOME=$(mktemp -d) GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 node --test 'tool/test/*.test.mjs'`". This section is then copied through 7nov-d, 7nov-e, 8nov, 8nov-b, 8nov-c, 8nov-d, 9nov and 9nov-b.
- 8 Nov 03:05, 8nov: "Process3 since 7nov-e (all merged, all reviewed by me, suites green)".
- 9 Nov, audit: "4 coordinator-only rows cite no measured failure ...: cold review of every PR, the coordinator's local suite rerun, PD-17, the hourly audit cadence."
- 9 Nov 16:55, 9nov-c: "no cold review or rehearsal ... no local rerun of the suite."

**B. One session's "60% rule" becomes a START step.**
- 4 Nov 19:30, 4nov-d: "handing over at a natural break, per my own 60% rule" and START step 5: "Check your own context at every check-in; hand over at 60%".
- 5 Nov, early 5nov and 5nov-b: START step 5, verbatim.
- 5 Nov 11:55, 5nov-f: "context 57%, my own 60% rule". Coordinator refreshes then needed tool support of their own (PR 162, "ROOT refreshes the coordinator") and the coordinator-id bookkeeping the audit later prices at about 5% of lost hours.

**C. The coordinator's "about 6 jobs" becomes Bob's agreement.**
- 4 Nov 19:30, 4nov-d, under "BOB'S DECISIONS TODAY (binding, in order)": "Agreed (16:55): copy work narrowed to the release path only, about 6 job sessions".
- 4 Nov 23:25, BOB's report: "above the ~6 target agreed 16:55".
- 5 Nov 01:13, log: "the coordinator proposed narrowing copy work to the release path, "about 6 job sessions" (its own number), Bob agreed to the release-path scope; 17:28 told BOB "6 at most"; BOB followed for ~6 h ... the coordinator's number recorded as Bob's agreement".

**D. A lesson becomes a standing rule that then stalls a decision for nine hours.**
