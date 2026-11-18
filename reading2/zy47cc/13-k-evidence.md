
**What the two tests would catch that a scripted walk would not**

- **Upgrade.** A walk runs on a fresh copy. Every development deployment is "a whole fresh copy named `p3dev-<slug>`" (levers §7). A fault that appears only when new code meets data written by an older release cannot show on a fresh copy. The migration test's own header is the recorded case.
- **Install from scratch.** Development deployments are made by the product's deploy scripts over Cloudflare's interface, not by the installer (levers §7, §8.1: "The product's own install path (the REST deploy, the installer) is not exercised"). **Judgment (mine):** a walk therefore proves the product runs once deployed, and proves the installer's screens, but not that the installer can place a signed release into an empty account.

**(c) Options, with cost and risk**

1. **Both end as tests of their own; what exists stays where it is.** The upgrade test and the installer's tests remain module tests of `plane` and `installer`, inside the first test. Cost to Bob: none. Risk: they run only when those modules' own files change, so an upgrade fault introduced by another module is seen only if the notice to `plane` leads its job to run that test. **Judgment (mine).**
2. **Both are kept as steps of preparing a public release.** Cost to Bob: none in acts; they run before he is asked to approve. Risk to the product: none added. It is a fourth and fifth test unless he reads release preparation as outside "three tests".
3. **The external walk is made to cover them:** it walks a copy installed by the installer, and a copy upgraded from the last release. Cost to Bob: none in acts. Risk: unbuilt and unproven; the external walk took 60 and 64 minutes each time it ran (measured, product_side).
4. **Both end, nothing replaces them.** Risk: the first public release that meets an existing group's data is the first test of upgrading. The recorded history is releases 0.59.0 to 0.63.0, each of which broke existing stores.

**(d) Constraints**

- "Exactly three tests, and no others, ever" rules out option 2 unless Bob says release preparation is not a test in his sense.
- Bob's own word of 8 Nov (BD-R4) keeps the migration test, bounded to the last two or three releases. Option 4 would drop what he chose to keep five days earlier.
- A public release needs his approval in any case, so options 2 and 3 add no act of his.

---

## K2. Set-up acts on the Claude side

**(a) Bob's documents**

- P17, modified 3 Nov; the stored note is a copy of the suggestion: "Keep it whole after onboarding; no Ledger line holds it today. Your word, 3 Nov: during onboarding the platform forces a few GitHub steps of yours; keep those as few as possible, each walked through."
- Foundations, "The human and the AI": "You do not edit files or enter commands; the few steps of yours the platform forces at onboarding are kept as few as possible and each is walked through (P17)."
- Foundations, "Setup": "One document, the developer's steps ... lists only the acts the developer must take, each with why ... What the check cannot read (secrets, Actions settings, collaborators, the cloud environment) is confirmed there once." (F-SET-4.)
- Foundations, "Deploy tokens": "Onboarding adds the product's deploy tokens to the cloud environment as environment variables, the one route both the deploy tools and setup check were measured to read (2 Nov)". (F-SET-8b; section I item 12.)
- Foundations, "Moving accounts": "development can stop under one Claude account and restart under another on one plain request (your word, 2 Nov; GAP-8): ... the developer recreates the cloud environment and Claude's GitHub connection from a page the process writes".
- GAP-8, kept 3 Nov 17:35 UTC, no note; source "Your words, 2 Nov about 18:58".
- Decision of 13 Nov, quoted in audit D: "The user doesn't enter commands nor edit source files. The only actions he will very occasionally take are changes to GitHub or Cloudflare settings related to permissions or rules."

**(b) What Process3 did**

The acts, exactly (process3 `setup/DEVELOPER.md`, 11 steps, and `rulebooks/account-switch.md` section 2):

1. **Connect Claude to GitHub as the session account** (Step 3). In a private browser window: sign in to GitHub as the second account, accept the repository invitation, open claude.ai's GitHub connection page signed in to Claude as himself, and authorise with the second account showing. Why: "If it is connected as you, every session would act as the owner, and the rules below would not hold them."
2. **Install the Claude GitHub App on the repository** (Step 2). This is on GitHub's side, as owner.
3. **Put the deploy token into the Claude cloud environment** (Step 8). Create the Cloudflare token (Cloudflare's side), then on claude.ai open the environment's settings and add each variable the product lists, "as an environment variable (not under Network secrets)". The product lists 11 names. "The variables reach only sessions started after you save."
4. **At an account switch,** on the new Claude account: connect GitHub as the session account; install the App; "Recreate each product's cloud environment: its network, its setup script, its variables and the network secret for api.cloudflare.com, with the values only Bob holds"; share the documents; start the first session.

How often (my count from the record; the dates are the record's):

- Onboarding, 1 to 2 Nov: once.
- Account switch of 5 Nov: GitHub connected twice. The first connection was as Bob's own owner account, so "06:23 every job start refused"; the second was as the collaborator. "Cost: 0 jobs live 05:44-07:18 (94 min at 0/20, against 19/20 at 05:20)."
- 6 Nov 19:19Z: GitHub suspended the session account. A new session account followed; every merge from 7 Nov is by `believeinoakland` (permissions_inventory).
- 7 Nov: a second account switch was prepared and cancelled. Bob: "The account switch didn't work... So start everything back up here in this account." Cost "about 9.5 h" (LOG L1067, L1075).
- So in nine days: three occasions that needed these acts, and a fourth that was abandoned. Bob, 6 Nov, on why switches happen: "I'm watching weekly usage. So I'll let you know when it's time to start shutting down development under this account and prepare for the move to another." (LOG L980.)

Can a session do any of them?

- **GitHub's settings: no.** Measured 1 Nov: setting branch protection from a session was "Refused by the proxy, 2 tries"; sessions also cannot read Actions settings, secrets, collaborators or environments (permissions_inventory).
- **Claude's GitHub connection: no tool for it.** The tool a session has for reaching a repository tells it, on refusal, that "the user should reconnect GitHub under claude.ai Settings → Connectors". Observed in this session's tool descriptions today; not a Process3 measurement.
- **The cloud environment: in part.** Observed in this session today, not trialled as a Process4 route:
  - A session can read its environment's variable names, never the values. This account's environment, named "BIO", shows 16 names, among them the 11 the product lists, one network secret for `api.cloudflare.com`, and a setup script. It reads as editable by the session's proposal.
  - A session can propose a new environment or an edit: network hosts, a setup script, and variables that are not secret. Each proposal shows Bob an approval prompt "every time, in every permission mode", and "nothing is created unless they approve".
  - A session must not put a secret into a variable. For a secret, a session can ask the platform to show Bob a secure form; the value is stored as a network secret that the platform adds to requests to one named host. The session never sees it.
  - Process3's deploy tools read the token from an environment variable, and its steps said "not under Network secrets". The signing seeds are not credentials for a web host. **Judgment (mine):** so the token values still pass through Bob's hands, and whether the network-secret route can replace the variable for deploying is unmeasured.
- **Starting the first session on a new account: no.** Sessions are created only by a person, by ROOT, or by a scheduled task, and a task's fresh session could not start sessions, "0 of 3" (2 Nov).

**(c) Options, with cost and risk**

1. **Accept them as listed acts, outside the two kinds of setting.** Cost to Bob: about one sitting per product start and per account switch. Risk: the one recorded mistake, connecting GitHub as the owner, was part of a 94-minute outage: job starts were refused at 06:23 and everything was closed again at 06:37.
2. **Accept them, and have sessions prepare what they can:** a session proposes the environment and its non-secret variables, and Bob approves a prompt and types only the secret values. Cost to Bob: fewer steps, but each proposal is a prompt that waits for him. Risk: unproven; a prompt that waits for Bob stops that session while nobody watches. **Judgment (mine).**
3. **Not accepted: the definition must show each done without him.** The evidence says it cannot be done for the GitHub connection or for secret values.

**(d) Constraints**

- The decision of 13 Nov names only GitHub and Cloudflare settings. These acts are on claude.ai, so they are an exception he must grant or refuse; the platform leaves no third way for the connection and the secrets.
- Permission management as preserved requires that sessions act as a second GitHub account that "can push and merge but cannot change settings". That is exactly what Step 3 sets up. Skipping it means sessions act as the owner.
- "Bob enters no commands and edits no source files": none of these acts is a command or a source edit. They are clicks and pasted values in two web pages.

---

## K3. Bob's approval before one particular merge

**(a) Bob's documents**

- GAP-10, kept 3 Nov 17:35 UTC, no note: "Review findings go to the job as diagnosis and review is never the merge gate; a green gate merges without Bob, who approves a particular merge only when he asks to. Replaces INT-3."
- INT-3 (31 Oct), which it replaced: "Branch protection plus your approval is the last word." The page's "against": "You become the approver for every merge unless you delegate that to the green check alone."
- Foundations, "The human and the AI": "Approving a merge is such an act only when you ask for it: by default a job, layer or tranche merges on a green gate without you, while a public release waits for your approval (GAP-7), and you ask for your approval before a particular merge when a design is hard enough to warrant it (GAP-10)."
- Foundations, "Review": "the tool merges without you by default; you ask for your approval before a particular job, layer or tranche merges as the exception, not the norm (GAP-10, replacing INT-3)."
- Disposition rows 57, 123 and 239: all KEEP. Section 5 gives both readings: "A gate; it ends, and under D2 nothing waits for him" against "His own option, used only when he asks; not part of the process's tests."

**(b) What Process3 did**

- **Used: not found.** I searched the coordinator's log for Bob asking to approve a merge before it happened and found no case.
- **How it was built: no mechanism of its own.** The ledger map marks GAP-10 "Merge on green without Bob | merge | Built", which is the default half. Nothing in the tool marks one pull request as waiting for Bob. The nearest things:
  - The GitHub rule on the main and tranche branches required no approving review ("required_approving_review_count": 0), so Bob could merge any pull request himself on GitHub's website.
  - The merge tool refused some kinds of change and said "that needs the owner's word: bring it to Bob": a workflow file change outside set limits, a change to the process pin's source, a deleted config (`merge.mjs` lines 639 to 708).
  - A "hold" row could keep a module's work from starting (`hold.mjs`); it held starts, not merges, and "no hold needs Bob".
- **Merges Bob made himself** (measured by me from the first-parent history; reading the author and the title format is my judgment):
  - 6 Nov: product pull request 625 and process3 pull request 188, both changes to workflow files, which the tool held for his word. These two carry GitHub's own website merge title and the log says "Bob merged process3 188 and copy 625". They are the only merges of session-written work that are clearly his own clicks.
