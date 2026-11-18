**Attacks.**
- "*Decided:* correct the module list where the code already runs one way, and turn one registration between two modules around. Nothing a user sees changes."
- "That is a design error in those modules, fixed by refactoring them in their own jobs."

**Evidence.**
- Measured (`interface_and_cycle.md`, summary and 2d). "Three things need the owner. The requirement size cap that caused the split; whether a member's own Claude sign-in through the runner still exists; and, for hypotheses and steps, whether one refusal may change places with another."
- Checked today against the definition. (a) The cap: ended by section I item 3, so giving the three draft files back to agent-worker no longer meets a cap. That dependence is gone. What remains of it is the choice between one module with two requirement files and a module that owns requirements and no code (2d item 2), which finding 6 shows is not small. (b) The sign-in relay: still open. After the repair agent-worker's configuration still binds the runner, which would now sit after it, and its `/signin` route relays to four runner routes that answer 404 (2b, "One stale route"). The requirements file states both positions. Whether that feature exists is a product question. (c) The refusal order: the definition chose turning the registration around, which changes nothing a member sees, so that one no longer needs Bob.
- Measured (2c). Turning the registration around edits two modules' source, one line in a third (store-assembly) and four test files across three modules. Correcting the list edits `build/modules.json`, which no module owns, and a generated file owned by a fourth module (member-roster), whose match with its source the definition no longer checks (section H).
- Reasoning. Under the new start rule the three uses no longer block any start (they did only under the withdrawn waiting rule: "27 of the 65 can never start"), so this is not a first-hour stop. The 38 undeclared pairs are untouched by it.

**How bad.** Misleads Bob (one product question is silently left open, and section K says only one question is his); minor for running.

**Answer.** Wording. Point 8 should say: the list correction is ARCH's edit, not a job's; the registration change is three modules' jobs in sequence; the sign-in relay is put to Bob as a product question, or agent-worker's dependence on the runner is declared and accepted as a known later use. Align section E's sentence.

Sources: interface_and_cycle Part 2 (2b, 2c, 2d); no_layers_width section 2 and follow-up A.

---

### 13. "Nothing depends on archiving" meets a measured ceiling of about 50 live sessions

**Counter-argument.** A round of about 170 jobs leaves finished sessions behind. At about 50 live sessions the account stops starting new ones while still reporting success. If finished sessions count, slots look full and nothing is running.

**Attacks.**
- "Nothing needed for correctness depends on archiving a session or switching off an alarm, which the checker judges case by case."

**Evidence.**
- Measured (`permissions_inventory.md` 1c, 1e row 14; one event, 1 Nov). "At about 50 live sessions the account stops starting sessions while `create_session` still reports success."
- Measured (roles 1.3). Process3 relied on archiving in practice: "21 finished job sessions archived by ROOT's cap sweep".
- Measured (permissions_inventory 1e rows 5, 6). Archive passed 2 of 5 and 1 of 4 before the approvals; "15 of 15" after has no evidence file.
- Not measured: whether a finished, idle session counts toward the ceiling (`redteam_feasibility.md` finding 10 marks it unverified).

**How bad.** Silently stalls a round, found only by the hourly alarm, whose replacement starts fail the same silent way.

**Answer.** An honest statement and a trial. Either archiving finished jobs is needed, and the sentence is corrected to say so, or it is shown that idle sessions do not count. One measurement before the process is in force settles it. Missing from section J.

Sources: permissions_inventory 1c, 1d, 1e; roles_root_coordinator 1.3.

---

### 14. The walks as described were never run that way, and no one is named to turn a finding into a module's work

**Counter-argument.** Process3 ran the internal walk as one script started by the tool in one session. "Several sessions ... by journey" is new and absent from section J. The step that names a module for each finding has no actor.

**Attacks.**
- "several sessions walk the product as built, without deploying it."
- "**How many sessions walk, and how the walk is shared out.** *Decided:* by journey."
- "Each finding becomes work for a named module".
- "The internal walk finds what a full regression would. ... *Trial:* put back the one known break between two modules".

**Evidence.**
- Measured (`process3` README, `walk internal`, `walk round`; `deploy.mjs` line 446). One tool-started run of the product's own walker, default time limit 30 minutes; findings were entered by the architecture session with a command naming the module, "or ... when it names no module".
- Measured (DECISIONS PD-16). "Product walker changes needed for parallel walks go to BOB as a job": the walker's ability to be shared out was still work to do on 8 Nov.
- Measured (`foundations.md`, platform table). "the in-session background limit is about thirty minutes, so anything longer is CI". The two late external walks took 60 and 64 minutes (product_side 6).
- Measured (definition). On 8 Nov the internal walk passed every step while the external walk of the same build passed 20 of 175.
- Reasoning. One reinserted break can show the walk misses it. It cannot show the walk "finds what a full regression would"; no full regression was run in Process3 to compare with. The trial can break the claim and cannot support it, which the definition admits for item 8 but not for item 11. Where a walking session runs an hour-long walk against the 30-minute limit is not said; I did not establish where Process3 ran it.

**How bad.** Stalls the end of the first round; misleads Bob about what trial 11 can show.

**Answer.** Wording and a trial. Name ARCH as the one that assigns each finding to a module. Add "several sessions share one walk by journey" to section J with one rehearsal. Reword J11 to say the trial can only break the claim.

Sources: process3 README and deploy.mjs; DECISIONS PD-11, PD-16; foundations platform table.

---

### 15. Bob's suggested model and effort do not reach the jobs

**Counter-argument.** ROOT does not start jobs; ARCH does. Effort is not inherited.

**Attacks.**
- "**Model and effort for each session.** *Decided:* ROOT passes your suggestion to every session it starts."

**Evidence.**
- Platform text (tool definition of `create_session`, today): "Effort level for the new session; not inherited from this session"; model "Defaults to the calling session's model".
- Measured (`permissions_inventory.md` 1c). "Effort per role. Not set anywhere in the tool"; the start table's effort column "never built".

**How bad.** Misleads Bob: he suggests an effort and jobs run on the default.

**Answer.** Wording: every session passes the suggestion on to each session it starts. Unproven; one line in trial J2 (read the job's reported effort).

Sources: permissions_inventory 1c, "What was surprising" item 6.

---

### 16. Smaller gaps and contradictions in the text

Each is wording unless said otherwise.

| # | Gap | Sentences | Evidence | How bad |
| --- | --- | --- | --- | --- |
| a | Bob's answer on ROOT's repository is recorded two ways. 13 Nov: "You start a session with the process repository mounted." 14 Nov: "ROOT starts with the product repository". The definition uses the second and does not show Bob the first. | "You start it on the product's repository." | Measured: `assessment_doc.txt` lines 91 and 99 | Misleads Bob. Answer: show him both and ask which is his. |
| b | Design lanes are kept but are not in the list of roles: who starts them, whether they take a slot, whether Bob talks to them. | "Design lanes, with user experience always there." against section B's six roles and "Kept short." | Measured: roles 1.1 ("lanes ... started by BOB"); approvals lanes paragraph | Costs time |
| c | The required test run must report on pull requests that change no module: Bob's own approvals commits (PR 1115 was his, merged by him after the check), ARCH's edits to the module list, the tranche into main. | "*Trigger:* a job's pull request changes its module's files or tests." | Measured: product history, PR 1115. Platform text: a required check that never reports blocks for ever (redteam_feasibility finding 4, GitHub documentation) | Stops Bob's first commit if missed |
| d | Bob's commit to `CLAUDE.md` is an edit, a pull request, a wait for the test run and a merge click, not one act. | "Commit your standing approvals ... on GitHub's website" | Measured: PR 1115 | Misleads Bob slightly |
| e | Two retired hooks still run before every shell command of every session in the product. Only Bob can delete them. Not on his list. | "Wording changes only you can make." | Measured: product `.claude/settings.json`; permissions_inventory 1b | Minor |
| f | "Two failed corrections" then replacement: who counts, and where, is not said. | "After two failed corrections ARCH replaces the session" | Reasoning | Minor |
| g | The tranche report has no author. Cost "where it can be read" was often unreadable. | "A tranche report: time, work done, cost, overhead" | Measured: definition I4 | Minor |
| h | Keeping the test run in two parts keeps a second part whose Process3 purpose was to post the row the merge tool checked, which has ended. | "*Claude decided:* keep it." | Measured: `process-gate.yml` job `post` | Minor |
| i | Test one includes "a check that the uses the module declares match what its code imports". If "code" includes tests, 202 imports fail on day one and 81 of them become later-pointing uses. If not, the 38 pairs stay invisible. | Section D, test 1 | Measured: interface_and_cycle 1a | Stops jobs in up to 63 modules, or leaves the hole; say which |
| j | Bob's relayed words are "followed". Followed by ARCH only while its instructions name the current coordinator session (finding 3). | "It passes your words on exactly as written, with the date, and they are followed." | Measured: permissions_inventory rows 26, 27. Platform text: `send_message` | Costs Bob time |

---

## Section J: what is missing, and which trials cannot settle their claim

**Claims the definition relies on that are not listed as unproven.**

1. The tranche merges into main on the product (finding 8).
2. ARCH can be replaced mid-tranche without losing the open jobs (findings 3, 4).
3. Working state held in job pull requests, and a status read-out computed from them, works (finding 3). Never run; Process3 used the state branch.
4. A standby can replace ROOT within the three-level rule (finding 9). The record says it cannot.
5. Finished sessions do not use up the account's live-session ceiling (finding 13).
6. Several sessions can share one walk by journey (finding 14).
7. A fix can be prepared and merged behind the wall (finding 10).
8. Bob's model and effort reach every session (finding 15).
9. The number of jobs a round takes under "tell every declared user" (finding 5). J4 and J5 test whether notices miss anything, not what they cost.
10. A public release walked "on a copy installed with the real installer". I found no run of it in what I read; the definition does not list it.

**Trials that cannot settle their claim.**

- **J4.** "require that all 241 real effects are reached". The 241 were found only among modules Process3 notified, and Process3 notified every declared user (`notice.mjs`, `usersOf`). Any rule that tells every declared user reaches all 241 by construction. The trial cannot fail, so it proves nothing about misses. The misses are outside the record: the 38 undeclared pairs and the dependences with no import. Listing them does not measure them.
- **J6.** Two slots and three modules, no failing run, no replacement: too small to show the waking problem of finding 4.
- **J10.** Tests a claim for which the definition gives no mechanism (finding 2).
