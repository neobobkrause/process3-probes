# [file] restart-speed-options.md (continued)

  branch with its why recorded; an open pull request: refused with its route).
- B. Count against the anchored sha only. The race reads as an abandoned attempt and cuts a fresh
  branch job/<id>-<n> with a wrong why in the record, a branch per race.
- C. Cut from the tranche tip now instead of the anchored one. Skips the approvals and pin check
  of that tip, which the anchor's confirming review forbade.

Chosen: A. One tip decides both the count and the cut, the anchor's checks hold, and the race
costs one more anchor instead of a hand choice.

Question for the coordinator: if plane's branch held a merged result that never landed (the
killed train's push, its pull request closed), say so; A already starts that case on a fresh
branch by itself when it is a reopen.

## Built (after the 10 minutes, no answer)

Item 2 as A. Item 4 as A, and a second cause the test found: in a depth-1 clone the tranche tip
the start is cut from has no parents, so git itself cannot see origin's job/<id> below the new
commit and refuses the push as not a fast-forward even when it is one. Before the push, the
tranche is deepened (doubling, then whole) until origin's tip is provably below HEAD.


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


# [file] process4_definition_v6.md (later part)

**The first hour**

7. **Your own acts in converting the repositories.** Not asked today. Some steps only you can do: new wording in your approvals, a changed list of forbidden commands, perhaps the GitHub rule in question 6. Your present approvals in the product forbid sessions to replace the required test run, so an edit of yours must come first there. Claude will bring you the full list of your acts, in order and in one piece, before asking for any of them.
8. **How new work is written into a module.** Your words of 14 Nov: "A job for module A isn't allowed to change module B. The only other way of editing a module is when a mechanical edit (like a word table change) makes the change." As worded, nobody but a module's own job may write a new requirement into it. Claude will bring this to you separately, with its options.

**The release**

9. **Which reading of "a clean development release walk" you meant.** Either the walk that already ended the tranche, so nothing further is walked; or, after the tranche ends, a development release is cut, installed on a test site and walked, and only then are the installer and the website updated. Claude's recommendation: the second. Under the first, three things reach a real team unwalked: the real installer placing the product into a Cloudflare account, an existing team's site being upgraded with its stored data in it, and the assistant working with a real AI model. The cost of the second is that all of it has to be built, and the installer's need for a person to sign in may mean an act from you at each release; that is not yet known.
10. **Whether "with AI on" still holds before the installer and website are updated.** Process3's decision record, written by a session, quotes you on 9 Nov: "Yes, the installer update and site update wait until a release walk with AI on is also clean." It costs you connecting an AI account. Claude's recommendation: yes, at a release only, since you have said a tranche can end without it.
11. **Whether an upgrade of an existing site is walked before a release,** or left to one module's own tests. Claude's recommendation: walked, as part of the same release walk.
12. **Where flaws go when a walk made after the tranche finds some.** No recommendation yet; it depends on your answer to question 9.


To be kept by any job that works from this text: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Mikko Rantanen`, and the name Saoirse Kinsella is no longer written anywhere in a handover note.

**Your requirement lines**

13. **The seven proposals** for the 33 lines of yours that the fifth draft ended without asking you; they are listed at the end of this section.
14. **Which document governs** where your ledger and your Foundations still say the opposite of the definition, for 75 of your lines. Claude's recommendation: a sentence saying the definition is followed from the day you accept it, with the ledger and the Foundations kept as the record of what you decided before; and only once the definition accounts for every line of yours, since otherwise the lines it does not state would vanish by default.
15. **Whether a job may commit built files** (files produced from other files). A line you kept says a job never does; the definition says it does (section J). With it comes the wording in your approvals that the large files a lane's tools build "are built at layer close, deploy and release, never committed": layers are ended, so "layer close" names something that no longer exists. Claude will bring new wording together with this question.
16. **Rewording a requirement.** One older line of yours lets the directing session reword a requirement and tell you in one line afterwards. Your rule of 14 Nov puts such a change to you first. Both cannot stand.

**Lanes** (section C)

17. **Who starts a lane.** Your Foundations: "BOB is the only creator of jobs and lanes". Your answer of 6 Nov as recorded: "BOB starts jobs and lanes, not ROOT". Your hint of 14 Nov has ROOT start PROCESS. Claude's recommendation: both stand. ARCH starts a product's design lanes; PROCESS is the one lane ROOT starts, because it belongs to the process and not to any one product. It needs only your yes.
18. **PROCESS and the two triage lanes.** On 6 Nov you kept a process triage lane and a product triage lane, each to study a problem and bring you options. Claude's recommendation: PROCESS takes the place of the process triage lane, and no product triage lane is started: Process3 built it and never once started a session for it, and in Process4 a flaw found by a walk already becomes work in the next round. That would end something you kept, so it needs your yes or no.
