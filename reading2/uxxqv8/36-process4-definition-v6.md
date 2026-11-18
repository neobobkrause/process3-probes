
Your sixth message, complete:

> We need to start a fresh session. So give me what I need to continue in a fresh session. But before we refresh, let me respond here to your summary of the last audit. You can work through these comments in the next session.
>
> Lanes are an important element of the development process, though they haven't been fill into the process4 design.
>
> Let's begin the next session by going into greater detail on each of the points you make in the 'What most stands in the way' section of your last response.

What it settles: nothing is decided by it. It asked for two things. Lanes are now filled in from your documents, as a proposal (section C). The five points were gone into in detail, and the questions they leave with you are in section P.

### Your own typed words to the session that studied the notification

You typed these to the separate session you set up on one question: when a module changes, which of the modules that use it must be updated. All but the last were typed on 14 Nov; the last arrived on 15 Nov. These are the messages that settle a point, in the order typed, each exactly as typed. Where your words answered a question of that session's, "What it settles" gives the question's substance; those are that session's words, not yours.

| Your words, exactly | What it settles |
| --- | --- |
| "a provider's answer to a user changing (content) doesn't necessitate the user being retested. What matters is when the interface to the provider (metadata) changes." | A change of content alone tells no one |
| "The interface to a provider is it's domain. The bounds of valid values passed to and received from a provider are it's range. So what I'm saying is that any change to either a provider's domain or range necessitates that its users be retested. But if both domain and range stay the same, then no retesting of users is needed." | What a change to the interface is |
| "The tests are supposed to confirm bounds, confirm the accuracy of results under valid conditions, and confirm the recognition of an error when out of bounds. Tests should not fail because they expect a specific valid response but receive a different though still valid response." | A rule for how every job writes its module tests (section E) |
| "even in loosely typed languages the formal interface can be augmented with structured comments that the language runtime doesn't see but that clarifies how the interface is to be used, and used by our build tools to determine whether the domain or range has changed so that user modules need to be updated." | The means: structured comments read by a build tool |
| "The comments and tool can also inform module tests to ensure that boundaries are properly checked." | Each stated bound gives the job tests to write (section E) |
| "which event sends the notice: B" | The notice is sent when the tool's listing of the interface differs before and after the change, not when a comment's text was edited |
| "the tool may refuse a disagreeing comment" | Inside a job's own module tests, a comment that disagrees with its own module's code stops the merge |
| "Who is told: ideally only the users of the entry that changed." | Who is told |
| "What rule applies to a module that has no comments yet: The first time a job for a module without comments starts the first thing it does is add the structured comments." | How modules come to have comments |
| "Agreed: The comments go in as a step of their own, before the job changes anything else, and they describe the module as it stands." | That first step sends no notice and gives the "before" listing |
| "The one fixed form for bounds written in words: If those words are changing, then there must be a reason why. It must be that that interface is changing, right?" | A change to the words that state a bound is a change to the interface |
| "I agree with your recommendation" | For what a provider accepts, users are told only when the new interface cannot stand in for the old (something removed, renamed, newly required or newly refused), so accepting more tells no one. For what a provider hands back, any change to an entry tells that entry's users |
| "As recommended." (15 Nov) | Inside a module's own module tests, and on that module only, the tool may also refuse code that disagrees with a provider's stated interface |

### Your own typed words of 15 Nov to this session

Exactly as typed.

First message, complete:

> After much research it seems pretty clear that there is no means to reliably tell the difference when there's a change in a module between when that change changed the interface or changed something other than the interface.

*This settles* that the notice cannot be exact (section F).

Second message, complete. The main session had set out three choices for the notice, given that it cannot be exact: 1, tell every user on every change; 2, use the study's method as a filter, accepting that it sometimes tells too many and sometimes misses one, which a later test or walk then catches; 3, tell nobody. It had recommended 2, and recommended against the proof session's rule that every user's tests run before each provider change merges. Your answer:

> Okay, I'll follow your recommendation: 2
>
> I don't care if the proof session recommends. We are clear about which tests will be run. There will be no additional tests added to the process than the 3 already identified.

*This settles* that the study's method is used as a filter, and that no test of users runs before a provider's change merges (section F).

### The session's record of 13 and 14 Nov

These reached this document through a session's written record, not through text you typed. On 14 Nov you referred to them in your own words as "my decisions of 13-14 Nov". Each line quotes the record exactly. Correct any that is recorded wrongly.

*13 Nov*

1. "You enter no commands and edit no source files. Your only actions, very occasionally, are changes to GitHub or Cloudflare settings: permissions and rules."
2. "The process runs unattended. It waits for you only when it is completely blocked, with no further work possible until you act."
3. "A product is a total order of modules. A module's services can be used only by modules that follow it. Each module is updated and tested by a single job, and earlier modules' jobs run before later ones. When a job changes a module's interface, every user of that module is notified, so those modules' jobs are updated as needed and tested."
4. "The build plan is designed around jobs running in parallel, bounded by a number you can change."
5. "Process4 has three tests and no others." They are: "Each job's own module tests, which include a check that the module's declared uses match its imports"; "Notification of every user module when a job changes an interface"; "A multi-session internal walk at the end of each round." (Corrected by your typed words of 14 Nov: see above.)
6. "No other test is necessary, ever. The internal walk replaces the full regression. A round that completes with no failures ends the tranche. An optional multi-session deploy-and-external-walk runs after that."
7. "The layer construct is dropped."
8. "A job does not wait for the modules it uses to finish. A module's job is ready when the module has work and no open job, and ready jobs take free slots earliest in the order first."
9. "Job slots default to eight, and you can change the number." "The moment a job completes and merges, its slot goes to the next ready job."
10. "A change to a provider's interface says which parts of the interface changed. A user module's job checks the implications of those parts and no others, and updates and runs only the tests that relate to them."
11. "Recognising that an interface changed must be proved rigorous and correct."
12. "Process3's permission management is preserved." "GitHub rulesets and other settings may be updated for Process4."
13. "A use that points to a later module is an error in the design of those modules, to be fixed by refactoring them."
14. "a job writes only its own module's files. Kept."
15. "CLAUDE.md and settings.json continue to serve the purpose they did in Process3."
16. "the first session is ROOT. You start a session with the process repository mounted. Your first prompt says you are starting or restarting development of a named product, names that product's repository, and says the Process4 development process is to be used. It may suggest the model and effort, and may mention a switch from another account or other pertinent details."
17. "The coordinator session is the front door. Before changing accounts, you tell the coordinator so it can stop development in that account." "the maximum slot count changes when you tell the coordinator session the new value."
18. "you approve a public release. Updating the public release means updating the installer and the page of the website that refers to the current release and installer."
19. "The cross-module mechanical pass is preserved. Some mechanical changes are so trivial that module tests need not be rerun. Tests run only when there is a fully informed reason to run them."

*14 Nov*

20. "a process fix must not add a new test, gate, review or stop. It may only correct or remove what is broken."
21. "fresh-reviewer review is unnecessary and ends."
22. "ROOT and the coordinator are different sessions." "ROOT starts with the product repository, and starts both the ARCH session and the coordinator session."
23. "Merging stays with the process's merge tool, the route Process3 proved, on your instruction to preserve permission management."
24. The ledger line about when a layer closes ends, "because there are no layers any more: your word."

Lines 16 and 22 differ on ROOT's repository. Your typed words of 14 Nov settle it: the product's (quoted in section I).

## C. Who does what

**You, the owner.** You define the project and answer the questions that are yours. Your acts:

| Your act | How often |
| --- | --- |
| Change a permission or rule setting in GitHub or Cloudflare | Very occasionally |
| At PROCESS: choose among the options offered for a process change, and approve a product's move to the changed process | Whenever a change is proposed |
| Start the first session, ROOT | At each start or restart of development; after each edit to your approvals; and if ROOT dies and no watcher takes over |
| Tell the coordinator things | Whenever you choose |
| Approve a public release | Once per public release |
| Connect an AI account to the deployment | Before an external walk of the journeys that use AI |
| Commit your standing approvals to CLAUDE.md, and the deny list to settings.json, on GitHub's website, in the product's repository and in the process's (section I) | At the start, then only when the wording must change |
| Connect Claude to GitHub, and enter the deploy token and other secret values into Claude's cloud environment, from a page the process writes | At the start of a product and at an account switch |

Line 1 allows you the first row. The second is in your own words of 14 Nov. The next three are in the record (lines 16, 17 and 18). The last three were the fourth draft's proposal 12: these three are acts of yours beyond settings changes. You answered "agreed" on 14 Nov.

**ROOT** is the first session. You start it with a plain prompt on the product's repository. Section I says how that start lands on your newest approvals. ROOT starts ARCH and the coordinator (line 22), and starts PROCESS when ARCH asks (section H). Once an hour an alarm wakes it as a safety net, as in Process3, to wake or replace a session that has stopped. ROOT decides nothing about the product and builds nothing.

**The watcher** is a standby session that takes over if ROOT dies. A note in your ledger says: "The watcher is started beside ROOT by whoever starts ROOT." That note was written in by the coordinator, as its record of what you said in chat on 3 Nov; it is not text you typed. The fourth draft proposed to drop it, and you asked: "are you certain that the watcher isn't needed?" No. Claude is not certain. Claude withdraws the proposal, and the watcher stays as your documents have it. Measured: both recorded takeovers in Process3 left no watcher behind and left ROOT one level deeper than designed. What a takeover does in Process4 is unproven and is rehearsed in the trial. Who starts it beside a ROOT that you start is not yet settled (section N).
