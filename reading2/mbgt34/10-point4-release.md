- :358 (row g of the table of Claude's readings): "Reads 'development release walk' as the walk that ends the tranche ... Put to him, but without the other reading or the 9 Nov sentence".
- :458 (rule 5 of the 51): ARCH never "publishes a release without you"; what holds it: "Release: not stated".
- :544: with the tranche branch made the default, "the main branch, the only one a release is cut from, is hidden".
- :562-576: classes of real failure that would pass all three tests: "An upgrade breaks existing stored data"; "The installer cannot place a release | Never run"; "The assistant does not work". :576 what each walk does not see.
- :600 map: "Release | Contradictory".

### 1.4 The requirements audit, `process4/working/audit2_requirements.md`

- :140-148 (finding 10, "The draft never says what a development release is, and your last message is written in that word"). :142 "Whether anything is cut, tagged or installed before that walk is not said." :144 "Whether 'clean' on 14 Nov includes the journeys that use AI is not said by him." :147 "Restore from his Foundations: one sentence saying whether the thing deployed in a round is a cut development release ... No walk is added." :148 "Bob's to decide (what his phrase means); Claude's to restore the sentence."
- :202-207 (finding 16): D and K still call his answered readings open; his three answers are not in section B.
- :256 (conflict 8) and :257 (conflict 9): his two typed sentences of 14 Nov set beside his 9 Nov words, his Foundations and his approvals; "Two statements of his own; not chosen here".
- :303: "Installer and website outside the tranche | 'Claude reads' (K) | No: his fifth message now decides it".
- :320 map: "Release | Thin | 'Development release' is undefined, packaging and keys are no longer described, when the AI journeys are walked is unsaid, and two of his statements differ".

### 1.5 The map file, `process4/working/audit2_notes.md`

- :18 "5 Release | C5; F16; R10". :31 the three ratings. :54 question 7's sources: "C5; R10; F16; C3 (journeys that begin at the installer); R conflicts 8, 9 | none; C5 says 'Do not choose'".
- :136 the audits disagree on the number of journeys (32 against 29). :138 they disagree on the date of the "AI on" sentence; the combined document uses 9 Nov.

## 2. Bob's statements, exactly quoted

### 2a. His typed words of 14 Nov (`process4/owner_words/`). These are his word.

- `bob_words_14nov_b.md:5`: "A tranche ends after a successful external walk of a development deployment. So a deployment is a step in a tranche. But if flaws are found during an external walk those flaws are added to the next round, not the next tranche. So a tranche only ends when an external walk (of a development deployment) completes without flaws. A release can (optionally) be started after a tranche completes. So a release is always fully tested and walked successfully."
- `bob_words_14nov_b.md:9`: "An internal walk uses the UX Screens document to confirm that the workflow matches the definition. The external walk follows the UX journeys to confirm that all journeys can be completed successfully to produce proper results."
- `bob_words_14nov_c.md:14`: "The 3 tests provide an appropriate opportunity to identify and debug as necessary every flaw and to test everything that needs to work in a released product. There is no need to any any more tests. PERIOD!"
- `bob_words_14nov_c.md:37`: "O4: internal and external walks a separate tests."
- `bob_words_14nov_c.md:46`: "O13: three tests and no others". (The fifth draft, K, uses this answer to end "separate install and upgrade tests before a release": `process4_definition_v5.md:323-325`.)
- `bob_words_14nov_c.md:56-58` (fifth message):
  "1. A tranche can end without an AI enabled run"
  "2. installer and website are outside the tranche"
  "3. installer and site updates wait for a clean development release walk"
  The heading at :54, "The numbers 1 to 3 answer the three readings in section P of the fifth draft", is a session's note, not his words.

**What those three readings were when he answered (V).** `git show d44304e:process4/definition/process4_definition_v5.md`, lines 418-420 (committed 14 Nov 04:03 UTC, before his fifth message was recorded at 04:39 UTC in commit `6e7740b`):

Every job must note: the reviewer for jobs has changed. Handover notes now carry the line `reviewer: Saoirse Kinsella`, and the name Lucinda Abernathy is no longer written anywhere in a handover note.


1. "**The journeys that use AI.** Your words say 'all journeys'. Some journeys use AI and need an AI account connected to the deployment. Process3's decision record quotes you on 9 Nov: 'The first run or two of the external system will run without without an AI account connected'. Claude reads your words of 14 Nov to mean that a tranche cannot end until those journeys too are walked without flaws."
2. "**The installer and the website page.** Process3's decision record quotes you on 8 Nov: 'build the installer only when the internal walk completes without the need for another round, and build the site update only once the external walks complete without the need for another round.' Claude reads your words of 14 Nov as moving both into the release, after the tranche."
3. "**A walk of the release itself.** The same record quotes you on 9 Nov: 'the installer update and site update wait until a release walk with AI on is also clean.' Your words of 14 Nov do not say whether a release has a walk of its own. Claude reads them to mean it has none, since the three tests end with the tranche's external walk. If so, nothing walks what the installer places."

So his answer 3 was given to a reading headed "A walk of the release itself", in which Claude said a release has no walk of its own. Commit `6e7740b` then replaced that text with the present `process4_definition_v5.md:416-420`, which no longer quotes the 9 Nov sentence. What was shown to him in the chat itself is not in the repository; I can only say what the draft file held (V for the file, not for what he read).

### 2b. 8 and 9 Nov, in Process3's decision record (`process4/evidence/DECISIONS.md`)

The file is written by sessions. Its own header (:3) says: "Process technical decisions are the coordinator's; each is written here ... Bob's own rulings are not recorded here: they live in the line they refine (REQ-7)." It nonetheless holds records headed "(Bob, <date>)". Every quotation below is therefore **a session's record of him**. Where the record puts words inside quotation marks under "in Bob's words", I mark it "recorded as a verbatim quote"; I could not compare any of them with what he typed.

| Line | Text | What it is |
| --- | --- | --- |
| :90 | "BD-R1: Walks end rounds; rounds repeat over the plan's layers until the release walk is clean (Bob, 8 Nov)" | Session's heading |
| :92 | "I think that it's incorrect to designate the fixes of an internal walk as an additional layer. Rather, the errors found in a walk, whether internal or external, should be related to changes to modules. Once a walk completes, that ends the current round, and a new round (of the same tranche) is started to work (layer by layer) to fix to those modules that have been identified as having flaws. This successive set of rounds continues until an internal walk doesn't find flaws, the release deployment happens, and the walk of the release also doesn't identify flaws. When the release walk is clean, the installer is updated for that release, then the civicsmith.dev website is updated to refer to the new install, and that ends the tranche." | Recorded as a verbatim quote ("Decision, in Bob's words (8 Nov)") |

A box of 2 chisels came through Wick.

| :93 | "The process prepares the installer and website updates and runs them only through the protected GitHub environment that names Bob as required reviewer; his standing approvals are unchanged ('Process, on my approval')." | Session's sentence; only "Finish, then switch" and "Process, on my approval" are recorded as his words |
| :94 | "A clean internal walk leads to the release deployment and its walk. A clean release walk leads to the installer update, then the civicsmith.dev update, each on Bob's approval, and the tranche closes." | Session's "Consequences" |
| :107 | "The product has no workflow for either yet; the coordinator proposed building both as round-2 work." | Session's "Context" |
| :108 | "build the installer only when the internal walk completes without the need for another round, and build the site update only once the external walks complete without the need for another round." | Recorded as a verbatim quote ("in Bob's words (8 Nov)") |
| :109 | "The scoped deploy token is Bob's to add to that environment, needed first when the installer-update workflow is built." | Session's "Consequences" |
| :113 | "There are no earlier versions of the plane that exist. So migrate-released need only look at perhaps the last 2 or 3 versions just to make sure that the migration process actually works." | Recorded as a verbatim quote ("in Bob's words (8 Nov)"). It is about the upgrade test |
| :114 | "No installed site holds an older store, so no upgrade path from older releases is promised." | Session's "Consequences" |
| :117 | "The live walk will take a long time and will end up being an expensive means of identifying many of the same the flaws the internal walk found. Stop the live walk now, update the process so that the live walk only runs once a round closes with no flaws found from the internal walk. And try to configure both walks to run as many walks as is reasonable to speed up the walking process. (But be careful that there aren't too many external walkers to cause the Cloudflare system to exceed limits of the account." | Recorded as a verbatim quote inside a coordinator's record (PD-16, "Bob, 8 Nov:") |
| :118 | "A round whose internal walk is clean (known gaps deferred on Bob's word count as passing) owes the release deployment and its live walk, and nothing else owes a live walk." | Coordinator's decision |
| :121 | "BD-R5: The first release walks run without an AI account; AI-assisted journeys are walked only after the non-AI journeys are clean (Bob, 9 Nov)" | Session's heading |
| :123 | "The first run or two of the external system will run without without an AI account connected. Once the external walks identify and fixed all the flaws to be found by walking all the non-AI journeys, we'll configure an AI so that the AI-assisted journeys can be run and debugged." | Recorded as a verbatim quote ("in Bob's words (9 Nov)") |
| :124 | "a release deployment is walked first with no AI account; the walk runs the non-AI journeys and reports each AI-assisted journey as not walked (AI not configured), never as passed or failed. ... When a release walk of the non-AI journeys is clean, Bob configures an AI account, and the AI-assisted journeys are walked and fixed the same way." | Session's "Consequences" |
| :125 | "Yes, the installer update and site update wait until a release walk with AI on is also clean." | Recorded as a verbatim quote ("Bob, the same day, on the tranche-end acts:"). The question he answered "Yes" to is not recorded |
| :125 | "A clean release walk of the non-AI journeys alone never makes BD-R3's installer-update or site-update builds due." | Session's sentence |
| :59-62 | "PD-10: A known, owed walk finding does not block a development release (coordinator, 8 Nov)" ... "This covers development pre-releases only; a public release stays Bob's, through the protected environment." | Coordinator's decision, not his |

Also a session's record of him, in the fifth draft's section B ("These reached this document through a session's written record", `process4_definition_v5.md:77`):
- :86 (13 Nov, line 6): "No other test is necessary, ever. The internal walk replaces the full regression. A round that completes with no failures ends the tranche. An optional multi-session deploy-and-external-walk runs after that." (Corrected by his typed words of 14 Nov.)
- :98 (13 Nov, line 18): "you approve a public release. Updating the public release means updating the installer and the page of the website that refers to the current release and installer."

