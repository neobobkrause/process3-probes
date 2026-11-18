# Process4: the five things that most stand in the way, in detail

14 Nov 2026. For Bob, from Claude. Nothing here is your decision, and nothing here is proven to work.

You asked: "Let's begin the next session by going into greater detail on each of the points you make in the 'What most stands in the way' section of your last response."

How this was made. Five AI workers each took one point. Each re-read the three audit reports and then checked the facts against the repositories and Process3's stored records. Where a sentence below says "checked today", a worker checked it today, unless I say I checked it myself. Where the earlier session told you something that turned out wrong, I say so.

Words used throughout. A **session** is one running Claude conversation. A **branch** is one line of work in a repository; the **main branch** is the finished line, the **tranche branch** is the line a tranche is built on. **ARCH** is the long-running session that directs the building of one product. **ROOT** is the first session you start. **Your approvals** are the paragraphs in your name, in a repository, that say what sessions may do without asking.

---

## 1. The end of a tranche

Your words: "a tranche only ends when an external walk (of a development deployment) completes without flaws." "An internal walk uses the UX Screens document to confirm that the workflow matches the definition. The external walk follows the UX journeys to confirm that all journeys can be completed successfully to produce proper results." "screens and journeys are kept in docs/development/ux-substrate/ in the product repo".

**What is in that folder (checked today; I checked the second item myself).**

- The folder is different on the two branches. On the main branch, which has not moved since 1 November, it holds 133 files, with a Journeys page and a Screens page among them.
- On the tranche branch, where Process3 did its building, a design session removed 49 files on 6 November, the Journeys page among them. The folder's own note now says: "This folder holds only what the product's build and checks read (Bob, 5 Nov 2026). The design documents are claude.ai artifacts". It lists Journeys and Screens as links to claude.ai pages.
- So the earlier session's statement to you, that the documents are not in the folder, is only partly right. The Journeys page is gone from the tranche branch. The Screens page is still there as an old copy of 28 October, together with everything needed to rebuild it, current to 8 November. The claude.ai Screens page says it was built from that folder.
- There are three lists of journeys, and they do not agree: the claude.ai Journeys page (27 journeys, dated 6 October, the oldest); the Journeys page on the main branch (27, marked on 13 October as folded into the Screens page); and a script in the folder that the Screens page is built from (32 journeys). Nothing says which of these is "the UX journeys".
- A worker opened both claude.ai pages today from a session, to read only. The earlier session told you it was not known whether a session could.

**Who writes those documents (checked today).** Every one of the 892 changes to that folder between 2 October and 9 November was made by an AI session. None came from your own GitHub account. The earlier session told you "61 of 63" for November; it is 63 of 63. This is not sessions going outside your word: your approvals in the product's repository say design lanes "own their lane folders, the design stream (docs/development/ux-substrate) included" and "Within the product's principles they decide design and wording there." That is the lanes question, taken up in the lanes document.

**What the walks did in Process3 (checked today).** Five walk reports were stored: three internal, two external. None was clean. The two external walks visited each screen once as an administrator and once as a member. Neither followed a journey from start to finish. So the external walk as you define it has never run, and nobody knows how long it takes, what data it needs, or whether it can finish. All twelve recorded deployments failed, and the tranche never ended.

**Who decided whether a walk passed.** In Process3 the walking program's own pass or fail decided, and sessions wrote the rules for what could be excused: the last external walk carried 36 notes reading "the designed absence", written in by the architecture session. In the fifth draft, ARCH starts the walks, turns flaws into work, and merges the tranche when the walk is clean. No other session has a part. That one session decides "clean" is the auditors' reading of the draft, and I agree with it.

**What the draft leaves unset.** How large a tranche is. How many rounds it may take; the draft says "Nothing bounds the number of rounds." What happens to a tranche that never comes clean. The draft's sentence "Only your word ends a tranche that will not come clean" was Claude's, not yours, and it was not marked as Claude's. I am withdrawing it; the truth is that the case is undefined.

**Yours to decide.**

1. *What each walk is measured against, and which journey list counts.* The choices: the claude.ai pages; pages kept in the folder; or the folder's machine data. The pages on claude.ai cost nothing to keep, but their history is outside the repository and the Journeys page there is the oldest list. Pages in the folder mean restoring the Journeys page and allowing the built Screens page to be kept there, which your approvals now forbid ("never committed"). The machine data you cannot read, and it describes more than is built. **My recommendation:** pages in the folder, because your words of 14 November say that is where they are kept, and because the repository then records every change to what a walk is measured against. It needs one proposal from me to you about the "never committed" sentence. For the journey list I have no recommendation yet: I need to show you how the 27 and the 32 differ first, and I have not had that compared.
2. *What a tranche contains.* Either all open work, which means the first walk comes after about 177 jobs (an estimate) and carries every flaw Process3 left; or a smaller content you name for each tranche. **My recommendation:** a smaller content you name. It is the one lever here that is not a new check. Its cost is a decision from you at each tranche, and a clean walk of a part says less about the whole.
3. *What happens to a tranche that will not come clean.* Merged with its flaws, which sits against your sentence "So a release is always fully tested and walked successfully"; or dropped; or kept open. I have no recommendation I can support with evidence, because no tranche has ever been walked your way.
4. *Which journeys count toward "all journeys".* Three journeys begin at the website or the installer, which you put outside the tranche. Six have steps only the AI assistant can do (one of the six is also among the three), and one more is connecting a Claude account; you wrote "A tranche can end without an AI enabled run". That is nine journeys of the 32 touched. **My recommendation:** a tranche's external walk follows every journey, and what it leaves out is named beforehand: the three journeys that begin outside the tranche, the connecting of a Claude account, and the steps that need the assistant. Then leaving them out is neither counted as a flaw nor hidden as a note.
5. *Who runs the walks.* Your hint was "sessions". A line you kept in your ledger, and Process3 itself, had GitHub's machines run them, and that form is the only one that has ever run. Whether a session's browser can even reach the development site is unmeasured. **My recommendation:** keep your hint, and let me try one walk from a session in the trial repository before the definition depends on it. That needs your go-ahead, because it starts a session and a deployment on your accounts.

