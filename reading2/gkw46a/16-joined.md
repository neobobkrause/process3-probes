# [file] r17c-settings.md (continued)

            "timeout": 300
          }
        ]
      }
    ]
  }
}
```


# [file] attack_common.md

# Common brief for workers attacking the Process4 definition (14 Nov 2026)

## Background
Bob is the owner. He is not a programmer in this role: he defines the product and the process in plain words; Claude decides everything technical and reports it. Process3 was his development process: Claude Code cloud sessions, in Auto mode, built his product Civicsmith in a GitHub repository unattended. It failed: sessions kept adding checks, gates, reviews and record-keeping to the process's own tooling until product work stopped. Process4 is its successor. Its definition, second draft, is the document under attack:

  /home/user/handoff/process4_definition_v2.md   (read it in full, first)

The first draft is process4_definition_main.md in the same folder (for comparison only). The appendix (process4_definition_appendix.md, being updated separately as _v2) maps 288 requirement lines.

## Bob's fixed decisions (not open to attack as decisions; attack whether the definition honours them and whether they can work)
- Exactly three tests, and no others, ever: a job's own module tests; the interface notice; the internal walk.
- No layers. One total order of modules. A job does not wait for the modules it uses. Eight job slots by default; only Bob changes the number.
- No review by a fresh reviewer.
- A process fix may only correct or remove; it never adds a test, gate, review or stop.
- Process3's permission management is preserved (standing approvals in CLAUDE.md committed by Bob, deny list in settings.json, merging through the process's merge tool).
- ROOT is the first session; ROOT and the coordinator are different sessions.
- Bob enters no commands and edits no source files. Only words Bob wrote count as his word.
- Nothing may be asserted to work that has not been measured. "Proven" and "not proven" must be kept apart.

## Hard rule for your remedies
You may NOT propose, as the answer to any weakness, a new test, gate, review, check, audit, approval step by a session, or monitoring job. Process4 has three tests, ever. A remedy may be: removing something, a structural choice, a permission or setting, a change of wording, an honest statement that a risk is accepted and unproven, or a trial (a one-off measurement before the process is in force, not a standing check). If the only remedy you can see is a new check, say exactly that and leave it as an unanswered counter-argument.

## Evidence available (folder /home/user/handoff/; use grep, read passages not whole files)
- Bob's requirement documents: foundations.md (Process3 Foundations), ledger_lines.md (the Keep and Drop Ledger, 159 lines with his decisions and notes), ledger_map.md, DECISIONS.md (Process3 decision records; quotes Bob), process4_disposition.md / .tsv (288 rows: every requirement line with id, text and disposition).
- /home/user/work/assessment_doc.txt: a session's record of Bob's decisions of 13 and 14 Nov (near the top). /home/user/work/live_docs.md: what is and is not in Bob's own words. /home/user/work/ledger_store/: his stored answers.
- Post-mortem evidence: review.txt, verify_numbers.md, causal_forensics.md, change_sample.md, canon_analysis.md, product_side.md, bob_naming.md.
- Design evidence: interface_and_cycle.md, no_layers_width.md, roles_root_coordinator.md, permissions_inventory.md, levers_github_cloudflare_product.md.
- Earlier attacks on an earlier, withdrawn proposal (not this definition): redteam_corruption.md, redteam_feasibility.md, audit_A.md to audit_D_central.md. Use them as a source of attacks that may still apply; check each against the second draft before repeating it.
- Notes by today's workers: /home/user/work/enforcement_levers.md (physical stops against added checks), /home/user/work/k_evidence.md (evidence on Bob's seven questions).
- Read-only clones: /home/user/repos/process3, /home/user/repos/civicsmith-copy (product; branches origin/tranche and origin/process-state). Never commit, push, or change anything in them. Start no cloud sessions.

## How to report
Write your full findings to the file named in your task. For every finding give:
 1. The counter-argument, in one or two plain sentences Bob could read (no ids or codes in that sentence; put ids in a separate "sources" line).
 2. Which sentence(s) of the definition it attacks (quote them).
 3. Evidence: measured in the record (cite file and passage) / stated in a platform document / your reasoning only. Keep these apart.
 4. How bad if true: stops the first hour / stops a tranche / silently corrupts the result / costs Bob time / misleads Bob / minor.
 5. Your best answer within the hard rule above, or "no answer found".
Rank findings worst first. Do not pad: a finding you cannot support is noise. Do not soften: if the definition would not run as written, say so first.


# [file] process4_definition_main.md (later part)

5. **Naming the changed parts lets a notified job read and test less without missing an effect.** *Trial:* on the same replay, check that the named parts lead to each of the 241.
6. **The fixed rule fills a slot the moment a job merges, and gives the same answer every time.** With no event, Process3 once noticed a finished job after 194 minutes. *Trial:* two slots, three modules with work. Time the third job's start from the first merge. Run the rule twice on the same record.
7. **The hourly alarm wakes ROOT itself.** Measured in Process3, eight times out of eight. Later platform notes suggest an alarm may start a new session, and such a session could not start others. *Trial:* one firing.
8. **A process fix cannot add a test, gate, review or stop.** Today nothing physically prevents it. Sessions can change the process's repository and merge their own changes; GitHub's rules protect settings and branches, not this. It is a rule in text only, and in Process3 text alone did not hold. *Trial:* give the fixing session ten Process3 faults whose recorded fixes were additive, and read what it produces. This can break the claim. It cannot prove it.
9. **The process is the same at round N as at round 1.** What holds it is one fixed version per tranche, which Process3 moved 116 times in nine days. *Trial:* at each round's end in the first tranche, compare the process's files with round 1. Any difference other than a recorded corrective fix breaks the claim.
10. **An edit to your approvals is taken up with no further act of yours.** In Process3 each edit needed you to start a new ROOT. *Trial:* one edit during a trial run.
11. **The internal walk finds what a full regression would.** No walk in Process3 ever passed. *Trial:* put back the one known break between two modules, of 4 Nov, which module tests missed, and see whether the walk finds it.
12. **A change across many modules, an account switch, and a stop on your word each work.** The first never had a procedure. The switch failed on 5 Nov and was cancelled on 7 Nov. After your stop of 9 Nov the process ran on for over two hours. *Trial:* one rehearsal of each.

## K. Open points

### For you to decide

1. **Two checks beyond the three tests that you have not yet ruled on.** First: you have kept the rule that a job writes only its own module's files. In Process3 a check at merge enforced it. Under "three tests and no others", does that check end, leaving the rule to the job's instructions alone? Second: your documents ask for an install-from-scratch test and an upgrade test before a public release. Do they end too? If they end, only the walk catches what they caught.
2. **Set-up acts on the Claude side.** Creating the cloud environment with its deploy tokens, and connecting Claude to GitHub, are acts only you can take, at the start of a product and at an account switch. They are not on your list. Are they accepted?
3. **Approving one particular merge.** Your documents let you ask for your approval before a merge of your choosing. Your list does not include it. Does the option stay?
4. **The judge of the process.** Your documents judge the process by two numbers: the share of false "done" claims, and the cost of each pull request that survives. Both would have read healthy in Process3 while the product failed its walk. Do they remain the judge?
5. **The external walk.** It is optional. Who decides that it runs: you, or ARCH? Your documents say a public release must have passed one. And as it runs after the tranche has ended, do its findings open a new tranche?
6. **Eight slots:** for each product, or for the whole account when two products run at once?
7. **Reordering.** Your documents say your word can add or reorder work. Jobs now start by a fixed rule. Can your word still reorder them?

Settled on 14 Nov, and no longer open: you rewrote in your own hand the five notes that a session had written in as your word.

### Technical points Claude will decide

Each is not yet specified. A recommendation follows each.

1. **Where working state is kept.** Process3's separate branch for it made 70% of all commits. *Recommend:* each job's pull request, which your documents allow.
2. **Which session makes a process fix, and which repository the coordinator holds.** *Recommend:* a short session started for that one fix and ended when it merges.
3. **How a process fix reaches a tranche in progress.** *Recommend:* your kept rule: only a fix for a blocking fault, once.
4. **How ARCH, the coordinator and ROOT itself are replaced when a long session fills up or falls silent.** *Recommend:* ROOT starts a successor for ARCH or the coordinator, which begins from the status read-out. For ROOT, keep Process3's standby session, woken once a day, which takes over, so that replacing ROOT is not an act of yours.
5. **How the coordinator hands on your words.** *Recommend:* quoted exactly, with the date.
6. **Where the slot number is kept, and how a stop on your word reaches every session.** *Recommend:* one place in the record that the status read-out shows.
7. **Who judges a change across many modules trivial enough to skip tests.** *Recommend:* ARCH, which reports it.
8. **How the three order-breaking uses are repaired.** *Recommend:* correct the module list where the code already runs one way, and turn one registration between two modules around. Nothing a user sees changes.
9. **The exact definition of an interface and the form of a notice.** *Recommend:* the four measured parts in section D.
10. **What carries your standards for scale, speed and cost** now that layers are gone. *Recommend:* planned measurements at scale, which your documents keep.
11. **Whether a separate list for a "completion round" remains.** *Recommend:* none. Rounds simply repeat.
12. **Model and effort for each session.** *Recommend:* ROOT passes your suggestion to every session it starts.
13. **How many sessions walk, and how the walk is shared out.** *Recommend:* by journey.
14. **Which process files a product receives.** *Recommend:* the short fixed set your documents list.

---


# [file] process4_audit2.md (later part)

**Only the first real tranche** can show whether a tranche can end, whether the checker goes on passing merges, and how often a process fault waits for you.

## 6. No answer found

1. **Nothing makes a tranche end.** No walk came clean in Process3 and rounds are unbounded. The audits found only the tranche's size (question 2), which is yours.
2. **A session loosening a walk step, or merging before the walk is clean.** One session reads the report and merges. Every stop the auditors could see is a check or a gate.
3. **A walk step that fails for no reason in the product.** About 68 of the 147 failing steps of Process3's last external walk were one crash of the walker's browser (measured). The remedies seen are running it again or excusing it.
4. **Growth that leaves no record:** a session more cautious in its own work, demands typed into another session's instructions, a process rule written as a product decision. Any stop there is a check.
