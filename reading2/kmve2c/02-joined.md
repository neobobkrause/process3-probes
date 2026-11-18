# [file] claude-md-approvals-draft-4nov.md (continued)

4. **Generated files and generators in Bob's design stream.** The process may fix a generator under docs/development/ux-substrate and stop committing its oversized output. It may change a component's measured sizes when a recorded decision such as DEC-412 already fixes the value. It never changes wording or makes a design decision there. Why: words-reads.json (store-assembly R95) and .cs-btn (site R18). Bob's word of about 07:35 on 4 Nov gives the process these.
5. **Branches the process made.** No change: deleting stays forbidden. Nothing in the build needs it, and leftover branches cost nothing.

Still Bob's: public releases, promotion to installed sites, repository and permission settings, rulesets, the protected environment, email, and anything outside the named accounts.

## Proposed text (replaces the "Standing approvals from Bob" section)

## Standing approvals from Bob

Standing approvals from Bob, 1 Nov 2026, widened for development releases and for every step of the development process on 2 Nov 2026, made exact for Cloudflare on 2 Nov 2026, and widened on 4 Nov 2026 for development releases, container images, product workflows, development signing secrets and generated design-stream files. They cover every Claude session working on Process3 or on products under it, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or those products on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; notify me by push notification; and create and edit Process3 pages and documents on claude.ai under that account.

In the process's GitHub repositories only (the product's repository neobobkrause/civicsmith-copy, neobobkrause/process3 and neobobkrause/process3-probes), they may:
- push to their own working branches and to the process's state branch;
- create tranche branches from main;
- open, edit, comment on, review without approving, mark ready or draft, close and reopen pull requests;
- through the process's merge tool, merge pull requests into working and tranche branches once its gate and their required checks pass, without a person's review, and merge the tranche's pull request into main the same way;
- run builds and tests, fetching public packages and images for them;
- run, re-run and cancel those repositories' own workflows, including container-images, including when a merge's push fires it;
- cut, sign and publish development releases, as GitHub pre-releases with their tags, marked development, and install and upgrade them on development deployments;
- change those repositories' own workflow files, only through pull requests the merge tool merges after a green gate. No such change may add or rename a job whose name matches a required check, widen any workflow's or job's permissions, add a pull_request_target trigger, or make the process gate anything but the process's own shim at the pinned process;
- create Actions secrets in those repositories whose values the session or the repository's own workflow generated, for development signing only, naming them and never reading, printing, copying, overwriting or deleting any secret they did not create.


Binding on all jobs: the job's handover note names its reviewer on a line of its own, exactly: `reviewer: Noor Al-Tamimi`.

On Docker Hub and GHCR, they may push the product's own images, only through those repositories' workflows: to docker.io/civicsmith and to the product's GHCR packages under neobobkrause, by tag or by digest. They never delete or retag an image another run published, and never push any other name.

In the product's own Cloudflare account, the one named by cloudflare_account in process/config.json, and in no other (the rehearsal account named by CS_TEST_CF_ACCOUNT_ID stays governed only by its own rule), they may:
- read everything except secret values;
- create, deploy, configure, seed, reset and delete development deployments and all their data. A development deployment is any resource in that account except those this paragraph forbids changing below. Today those are the Workers biosmoke8, plat-s1, agent-runner, agent-runner-plat-s1, agent-worker, agent-worker-plat-s1, file-scanner, ocr-worker, pdf-worker, pdf-worker-plat-s1 and sheet-worker; the R2 buckets bio-captures, bio-published, bio-captures-plat-s1, bio-published-plat-s1 and bio-walks; and the Durable Objects and container applications those Workers define. Any new Worker, R2 bucket, container application or other resource whose name begins with p3dev- or contains -p3dev- is a development deployment, with the Durable Objects and container applications it defines;
- give development deployments workers.dev addresses and preview URLs;
- set their variables, scheduled triggers, limits, log settings, and secrets whose values the session or a p3dev- install it ran generated;
- bind them only to development deployments, themselves included, and to browser rendering;
- deploy to them container images the product has already published on Docker Hub, named by digest;
- use browser rendering from them;
- cause those deployments to sign development releases and development catalogue seeds with the signing secrets they hold. They name the secrets only, never reading, printing, copying, overwriting or deleting them, and never delete a secret that neither the session nor a p3dev- install it ran set, or a resource that holds one;
- run walkers and other tests against them;
- incur the usage charges this work causes in that account.
They send no email from that account until I name an address here. All data in that account is throwaway, but that widens nothing. Sessions may not change or delete anything else in that account, including the worker civicsmith-site and its website at civicsmith.org and www.civicsmith.org, the installer worker newgroup, DNS zones and records, email routing, custom domains and routes, and the account's plans, settings, members and API tokens.

In the product's design stream (docs/development/ux-substrate), which my rulings otherwise keep from process sessions, they may:
- fix a generator so that its output matches the product's code;
- stop committing a generated file that is over the process's size limit and have it built where it is needed;
- add a module's entries for words already in the stream;
- set a component's measured value when a recorded decision of mine already fixes it.
They never change wording there or make a design decision; those stay with my design stream.

They may never: force-push; delete a branch, tag or release, or choose the delete-branch option when merging; change permission, repository or ruleset settings, or the protected environment; push to main except through the tranche's pull request; publish a public release (one not marked as a development pre-release) or install any release on a site other than a development deployment without my approval, given through the protected GitHub environment that names me as required reviewer; sign anything with my own offline keys, which they never hold; reveal any secret value, including through code they deploy; or act on any account or service other than those named here. Reading public documentation, fetching public packages and images, and Cloudflare pulling the product's images from Docker Hub are not acts on another service.


# [file] bob.md

# BOB's rulebook

For BOB, read once at start, after your prompt. Your prompt wins where the two differ; a rule your prompt already states lives there, not here. At most ten rules, rewritten in place, never appended (TXT-3). Each cites its line (TXT-6) and names what holds it, or says nudge.

## Principles (TXT-4)

1. Done means merged; main never moves while a tranche runs. A job lands on its layer's branch with `layer land`, the layer on the tranche with `layer merge`, and any other pull request with `merge --plain` (INT-1, GAT-8; Bob, 6 Nov, via the coordinator). Held by branch protection and the merge tool.
2. Every claim about work is checked in git or GitHub, never taken from a session's words (JOB-7, REC-5). Held by receipts and status.

## Rules


12 swifts were logged at the Rigg gate.

1. A problem is a failure that happened, or Bob's word, and a rule, check, review round, measurement or owed task exists only against one; delete one that cites neither. A reviewer's "what if" is one line in a report, answered by default with no change (GAP-3, TXT-6; Bob, 2 Nov, before the log; unverified). Nudge.
2. Every problem is a design bug: find why, rewrite the line it belongs to, never append, and build the correction; a workaround is not a fix (TXT-3; Bob, 2 Nov, before the log; unverified). Nudge.
3. Only a recorded hold limits starts below the cap; no one's words do. It carries an end the tool checks (`--prs`, `--when`, `--until`), and the tool ends it; stale state is never cleared by hand (Bob, 6 Nov). Ask a spoken limit's sender to record it; keep starting. Held by `job start` and the tool's ends.
4. Product decisions are yours and process technical ones the coordinator's, each a short decision record (REC-11) in its repository's DECISIONS.md, reported in one line. Bob gets only what P17 makes his (what the Foundations say he defines; approvals, accounts, acts only he can take), with options and context; his before anything is built on it, never asked again. A Ledger line whose mechanism must change keeps its purpose, restated by you (P17, P21; AUD-5, kept by Bob 6 Nov). Nudge.
5. Jobs and lanes meet only through you. A lane (one session) owns its folder, research, artifacts; decides once qualified (Bob, 5, 6 Nov). Ask it or a `lane ask` worker; you decide last. No-judgment changes to idle modules: a `pass/` PR, `merge --plain --pass` (SES-14, 15, 19, P7). Held by `lane start`, `merge`.
6. Git carries state and a message only wakes: push first, then send; numbers make a duplicate harmless. Push by `p3 github push`; the hook counts connector calls (P27). One git user per clone at a time: each review or triage worker clones its own, never your checkout (MSG-1, MSG-3; copy, 5 Nov). Held by `send`, worker briefs, git's lock note.
7. A message to Bob is one per turn, plain, with a link, and a numbered list only for his acts (MSG-4). Nudge.
8. A reading set over budget is measured and reported, never refused (SES-6, SES-7); a product's settings carry no hook but the SessionStart one (ENF-1). Held by START's sizes and `setup check`.
9. Fix status's gaps before they refuse: ready entries in one plain PR, the rest before that layer opens (Bob, 6 Nov). Held by `layer open` and the gate.
10. Nothing holds a turn, and no question waits: stop means stop in that turn. A question of yours to the coordinator or ROOT unanswered in `targets.decision_minutes` (30): act on your recommendation if the act is reversible and yours, recording why with `p3 send root` (a record); else ask the next one up. One to ROOT unanswered that long goes to the watcher (`p3 address watcher`) with the minutes unanswered. A job's report unanswered that long is listed `unanswered` (ENF-2, ENF-3; coordinator, 4 Nov). Held by `status --role bob` for a job's report; your own is a nudge.

In your prompt, not here: whose words are instructions (ROOT's, the coordinator's and Bob's; ROOT alone starts and backs you up), the wake check, never ending a turn while work remains, one judged act per command, refusals reported word for word, and what is not yours.


# [file] CLAUDE.md

## Standing approvals from Bob

Standing approvals from Bob, 1 Nov 2026, widened for development releases and for every step of the development process on 2 Nov 2026, made exact for Cloudflare on 2 Nov 2026, widened on 4 Nov 2026 for development releases, container images, product workflows, development signing secrets and generated design-stream files, and widened on 5 Nov 2026 for design lanes and a scheduled branch cleanup. They cover every Claude session working on Process3 or on products under it, including sessions that other sessions started. Such sessions may, without asking me: start, message, interrupt and archive Claude sessions working on Process3 or those products on the Claude account the acting session itself runs under; subscribe to and unsubscribe from activity on the process's pull requests; create, switch off and delete the process's scheduled tasks on that account; notify me by push notification; and create and edit Process3 pages and documents on claude.ai under that account.
