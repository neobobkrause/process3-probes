# [file] process4_counterarguments.md (continued)


### 86. Two small reports nobody asked for

**The counter-argument.** The process "shows you what [a release] carries", and ARCH "reports" a change across many modules. No line of yours asks for either. The reviewer calls them new, small and harmless.

**What it rests on.** Read in the documents.

**How bad if true.** Minor.

**The answer.** The memo is silent. The reviewer's own proposed correction is "leave, or drop" the words about the release. Which of the two the third draft does is not settled.

### 87. Two kept lines the main text never states

**The counter-argument.** Two lines of yours are kept only by a blanket sentence, where the silence could matter to a builder: that the product's standing instructions are "under thirty lines", written by the architecture session line by line, with each change listed in the tranche report; and that two ROOTs never both start an architecture session.

**What it rests on.** Read in the documents: your Foundations.

**How bad if true.** Minor.

**The answer.** The memo is silent. Answer taken from the reviewer's own proposed correction: one clause that names them among the lines that stand. The second mattered once a standby could take over; the standby is dropped (entry 15).

---

## What the first trial showed

One measurement finished on 14 Nov after the memo was written: a replay, on paper and with nothing run, of Process3's 178 recorded interface changes against the rules for notices. It bears on entries 7, 21, 36, 72 and 73. Each figure is marked measured, inferred or judged. "Judged effects" means the 241 cases where one of Process3's AI workers judged a notified module to be affected; that is a judgment, not ground truth.

- **(a) Telling every declared user reaches all 241 judged effects.** Measured: 241 of 241, when every module that declares a use is told on any merged change to a module's source or public requirements. Inferred: this could only have broken the rule, not proved it, because Process3 judged only the modules it told. On who is told, the result could not have come out otherwise on this record.
- **(b) The narrower trigger, "the interface changed", would have missed 5 of the 241.** Measured: it reaches 236.
- **(c) The claim that naming the changed parts lets a notified job read less without missing an effect is broken as stated.** Two of the 241 effects would not have been reached from the named parts. Judged: the two were found by a worker reading the evidence for each case; 169 of the 241 were matched mechanically (measured) and the rest were read one by one (judged). Whether a job could also test less was not measured; the replay could not measure it.
- **(d) Process3 did not in fact tell every declared user.** Measured: 167 declared pairs of user and provider were never sent a notice, and 66 of those were told by no route at all. The second draft's sentence that Process3 notified every declared user is wrong.
- **(e) Undeclared dependence exists.** Measured: 122 pairs of modules where a test imports another module without declaring the use, 36 of them a later module; none by import in code that is not a test. No effect on such a user was shown, and none was ever judged, so nothing is known either way.
- **(f) Nearly every merge would send notices.** Measured: under the four named parts, 71% of job merges (360 of 504) change the interface.

Two figures quoted by the reviewers are corrected by the replay. "65 of 178 notices could name no part" is what Process3 recorded; re-derived, the figure is 17 (measured). "38 undeclared pairs" is 36 to a later module, and 122 in all by test import (measured).

None of this proves the notice rule. It shows one claim broken, in (c), one wording that misses effects, in (b), and one result, in (a), that could not have failed.


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


# [file] v4_notes.md

# Notes on the fourth draft of the Process4 definition

14 Nov 2026. Written with `/home/user/handoff/process4_definition_v4.md` (62,593 bytes; the third draft is 62,655). Only these two files were written. No repository was changed and no session started. One read-only listing of file names was made in `/home/user/repos/civicsmith-copy` (section 4, item 6).
