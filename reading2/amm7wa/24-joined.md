# [file] bob_naming.md (continued)


Three observations:

- **The rules sort by channel and never by proof.** Sessions other than the coordinator and ROOT do not hear the owner. BOB and the builders get his words only through the coordinator, whose own words are instructions too. On 3 Nov BOB still held a relay as data: "the coordinator session ekzb sent me Bob's Q38 ... (I hold it as data until you confirm)" (bob-14). On 4 Nov that check was removed for speed (`940b4d1`, "BOB takes the coordinator's words directly"). After that BOB had no reason and no means to ask which of the two had spoken.
- **Messages from BOB are labelled, in lower case.** They arrive as `MSG bob-<n> to <role>: ...`. For ROOT, "bob-14" is data and "Bob" is an instruction, so the label differs from the owner's name by case and a number. ROOT handled it correctly in what I read ("confirming Q38 are Bob's calls; I have put both to him by push notification").
- **Places where a session's text is stored or presented as the owner's words:**
  - `tranche open --record ... --bob "<Bob's words lifting the stop>"`: BOB types the words.
  - The triage register's `chosen_by`, which the tool refuses unless it matches `/^Bob, \d/`, and which is printed verbatim into role starting prompts. The register is empty at the tip.
  - The internal-walk exemption `{"none": "<reason>", "by": "Bob, <date>"}`.
  - Foundations: "a word you give in chat is written there by BOB".
  - ROOT's starting prompt: the tool prints it and the owner pastes it as his first message.
  - The rulebook test. Until 5 Nov 20:49 its pattern was `/\((?:[A-Z]{2,3}-\d+|P\d+|Bob)[^)]*\)/`. Commit `c752fb9`: "the rulebook test accepted only a Ledger line or Bob as a citation, so a ruling made by the coordinator could only be filed under Bob's name."

The one place with real proof of origin is the approvals block. `record.mjs` accepts it only from a verified GitHub website commit whose author is the owner's login. Decisions had nothing like it.

## 5. Judgment

**Share due to the name collision: a few percent at most.**

- Decisions recorded as his that a session made: 1 of 48 traced cases involves BOB (about 2%), and that one is uncertain. The other 47 were the coordinator's, written down by builders, by BOB or by the coordinator itself.
- Paraphrases and assents (65 more attributions): none depends on the name.
- Separately, the lower-case key produced 68 false "owed by Bob" lines. That is a routing error about who owes a ruling, with no decision recorded as his.
- I cannot see the coordinator's briefs, so I allow for some unseen cases. Under 5% is my estimate, with the evidence pointing lower.

Two further facts support this. The earlier process used the same two names from 26 Sep ("Started by BOB #38"); in the last 600 lines of its `build/rulings.md`, 20 of 27 attributions to Bob carry his quoted words, some with the addressee ("Bob, 30 Oct 2026, to BOB #341: ..."). And none of the sessions' own diagnoses names the collision; they name the handoff chain, the missing coordinator rulebook, and "'BOB'S WORD' lines mix his words with ours" (log, 5 Nov 14:55).

**What did cause it, in rough order of weight:**

1. **Only two authorities could be cited.** GAP-3 and TXT-6 require every rule and check to cite "a measured failure or your word", and the test enforced it with "Bob" as the only name. A coordinator's decision needed his name to exist. This accounts for most of S1.
2. **The owner and the coordinator are one authority class downstream.** "Their words are instructions", and BD-R2 calls the coordinator "Bob's front door". Builders and BOB cited the channel's ultimate authority. Example 8 shows it happening and being corrected within six minutes.
3. **The session that heard him wrote a paraphrase, then appended its own ruling in the same entry.** 36 of 78 parsed "BOB'S ..." entries have no quote; 12 carry a coordinator "RULED" or "ACT" after his words.
4. **Lists marked "binding" were copied through about 25 coordinator replacements.** A paraphrase became a standing rule, then a quote (BD-6).
5. **One sentence of his became a mechanism filed under his name** (P24 to P27, PD-25).
6. **Assent to drafted text was recorded as his words.** 23 of 46 Foundations attributions are Keep and Drop answers; the log notes 20 new lines answered in three minutes.
7. **The tool stores session-typed strings as his words**, and no citation points to a source a later session can open. Twenty are still marked "unverified".

**Would renaming the role (for example to ARCH) help?** It removes a minor cause. It would have prevented the `--owner bob` error, the ambiguous capitals, the case-only titles in the product's `DECISIONS.md`, and the unresolvable audit in example 9. It would not have changed the 47 coordinator cases or any paraphrase or assent. If the role is renamed, rename the lower-case key, the `bob/` branch prefix, the `bob-<n>` message ids, and the "BD-" series with it, and call the person "the owner" in flags and keys.

**What else is needed:**

- **An owner's-words record with proof of origin.** Entries are written only by an act tied to his identity, as the approvals block already is, each with an id, a time, his exact text and the question he was answering.
- **A citation of the owner must be an entry id.** A test fails any owner citation that does not resolve. Bare "(Bob, date)" stops being admissible. The 6 Nov rule AUD-4 asked for quotes; the tip still has about 100 bare ones out of 170 in the same files (50 quoted, 20 marked unverified).
- **Four kinds of authority, kept separate in every record:** the owner said (exact words); the owner assented (to text T, drafted by session S); a session decided (role and session id); a session read the owner's entry as meaning X (the entry id plus "reading by <role>").
- **Session decisions as a first-class citation**, so nothing needs his name to exist. This began on 5 and 6 Nov (`c752fb9`, PD records) and should be the only route.
- **Relays carry the entry id**, and the receiving session records who relayed it.
- **Remove the flags that take typed owner words** (`--bob`, the `chosen_by` pattern, `by: "Bob, <date>"`), or make them take an entry id.
- **Handoffs carry state only**, with no restatement of his words, checked by a lint. Handoff 5nov-g tried this by hand and it lapsed within a day.


# [file] attack_corruption.md (later part)

| 7. The scoreboard (process merges) and the cost (on the product) sat apart | **No.** The fix session's "done" is its fix merged |
| 8. Session choices recorded as Bob's, and his few words turned into canon | **No.** A rule in text; the wall's click would add to it (finding 4); the definition's own source for his decisions is a session's record |
| 9. Bob's inputs pushed both ways and each question returned a mechanism | **No.** His words are passed on "and they are followed" |
| 10. No session saw the total; audits were themselves additive | **In part.** The tranche report and, under the wall, a size line. J 9's comparison runs in the first tranche only |

## Appendix C. The decisions Claude made today in sections I and K: the strongest case against each

| Decision | Strongest case that it is wrong | Weight |
| --- | --- | --- |
| I 1. End the job's receipt | None of weight; Bob said "get rid of it completely" and it caught nothing in 1,187 runs | None |
| I 2. End the set-up check before every job | A missing setting now shows as a job failing later for an unclear reason. Minor; the false stops were measured | Minor |
| I 3. End the size cap on requirement files | The purpose "fits in one reading" now has no holder. But 32 of 32 overrides and a loop put into the order | Minor |
| I 4. End compulsory recording of cost | "Cheaply" is half of Bob's purpose and now may never be reported: 106 of 229 rows said "unmeasured" when it was a duty | Real; say so |
| I 5. End the oversized-file check | 86,347 lines of generated data had been in the tree before (product_side §5). Nothing now keeps them out | Minor |
| I 6. End the job record as a data file | With state in pull requests, a second account suspension hides the record with the account (redteam_corruption 10; the suspension of 6 Nov is measured, the hiding is not) | Real; unproven |
| I 7. End the citation rule | Finding 11(d) | Real |
| I 8, 9. End the advice on instruction texts; allow refusal for size on the process's own texts | Something must do the refusing. That is a test outside the three (finding 8) | Real; Bob's to rule |
| I 10. End the reading audit | Never built. None | None |
| I 11. Keep the approvals check at start-up | Finding 10 | Serious |
| I 12. Keep tokens in the cloud environment's settings | None found | None |
| I 13. Keep the two-part test run | Finding 11(c) | As precedent |
| K 1. End the own-files check | Finding 7 | Serious |
| K 2. End install and upgrade tests as release tests | Releases 0.59.0 to 0.63.0 each broke existing stores. The release walk "on a copy installed with the real installer" is unbuilt, and first runs while Bob waits to approve | Real |
| K 5. Retire the two judging numbers | Finding 11(a) | Bob's, not Claude's |
| K 6. External walk by fixed rule | Finding 11(b) | Bob's, not Claude's |
| K 7. Eight slots for each product | None on my angle | None |
| Technical 1. State in each job's pull request | A notified job with no change has no pull request to hold its state (finding 5) | Real |
| Technical 3. "only a fix for a blocking fault, once" | "Once" is not defined (per tranche, per fault?). If per tranche, the second blocking fault has no route; if per fault, it is Process3's 116 | Real; wording |
| Technical 7. ARCH judges a change trivial enough to skip tests | Finding 12(a) | Real |
| Technical 11. No completion-round list; rounds repeat | Finding 1: no bound | Serious |

## Appendix D. Earlier attacks checked against this draft

| Earlier finding (on the withdrawn proposal) | Still applies to the second draft? |
| --- | --- |
| redteam_corruption 1: the first gate defect stops all work and only the owner can clear it | Yes, under the wall (finding 4) |
| redteam_corruption 3: the process moves to the Claude side | Yes; the definition admits two of the channels in K and offers nothing |
| redteam_corruption 4: a long-lived coordinating session is the handoff chain in one body | Yes (finding 12b) |
| redteam_corruption 5: the owner's merge button is the route for growth | Yes, under the wall (finding 4) |
| redteam_corruption 6: checks move into the product's tests and the walk | Yes; now worse, because the walk alone ends a tranche (finding 1) |
| redteam_corruption 7: byte and line caps that do not cap | Changed: this draft has no caps at all (finding 8) |
| redteam_corruption 11: the draft commits the sins it diagnoses | Yes (finding 3, "The definition itself does it"; finding 11f) |
| redteam_feasibility 4: the required check must report on every pull request | Yes, as findings 5 and 12(a): the no-change job and the skipped-tests change |

## What I did not establish

- The diffs of the nine walker commits whose subjects excuse or retire a step. I read subjects only.
- Whether "no failures" was ever defined by Bob more exactly than the sentence quoted.
- The length of an internal walk. Only the deploy-and-walk runs are timed (60 and 64 minutes).
- A false-failure rate for the walk itself. The 7% figure is for module test runs on 3 to 5 Nov and includes red results caused by record checks, not only by chance.
- The simulation's job lengths and the placing of walk findings are assumptions; the graph, the modules with work and the 10% are from the record.
- I did not re-read vendor documentation. Platform statements are quoted through enforcement_levers and k_evidence.


# [file] levers_github_cloudflare_product.md (later part)

| 6 | **Wake-ups and sweep** | `sweep` 495, `triggers`, `roles` | Pull-request event subscriptions wake the session that owns the work (Claude side). `workflow_run` and `schedule` on `main` for anything periodic. Cloudflare Issues automations for product failures. | About 15 lines of YAML | Owner (`main` is owner-only) |
