# Expected answers, written before the tool was run on any replayed change

One file per provider, `<provider>.json`, written by the helper that commented the provider, from its comments before and after each change and the method's rules, before the tool's notice was run on that change. Never edited after a result; a later note is added under "Dated notes" below instead.

## Who the rules say is told (written by the replay session, 15 Nov 2026, before any notice was run)

The method's rule (study, section B, decision 2; proof, design 7): a user the tool cannot follow fully counts as using everything of the provider, and is told whenever the provider's listing changes. A user is not followed fully when its code reads or calls any value of unknown kind, or when it declares the provider and no use of it is found in its code.

Measured on the state before ai-runs 96 (the provider uncommented, `analyse` of the tool, before any comment was written): each of the 29 users with code reads or calls between 471 and 17,775 values of unknown kind; the other users have no code that uses ai-runs. None of the users is commented by this replay. So, by the rules:

- **When a provider's listing changes at all** (any entry added, removed or changed, even one that by itself tells nobody, such as a new entry or one that accepts more), **every listed user is told**: the 9 to 30 per change in `data/changes.json` (declared users and users Process3 told). This is the rule as the proof states it ("it is told whenever the provider's listing changes") and as its tool applies it. Some users are told also for an entry they use; that does not change who is told.
- **When the listing does not change, nobody is told.**
- So, per change, the expected number told is either all listed users or none, decided by whether the helper's expected answer has any entry at all (`"listingChanges"`).

## Dated notes

(none yet)
