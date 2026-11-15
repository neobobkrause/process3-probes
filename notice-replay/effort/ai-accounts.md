# Effort log: ai-accounts

## First comments (started 2026-11-15T15:21:02Z)

Read the whole module first (11 files, about 3,140 lines: index, checks, constants, the six layers of the class, the
non-SQL parts of schema) and the users' import lines. The interface is large: 28 exports of the two public files, one
class whose 197 members the tool lists one by one (73 public, 90 named with a leading underscore and stated by the module
to be its own, the rest fields and statics), and 38 ops answered by name through `aiAccountsOps`.

What I wrote: about 60 kinds in `index.mjs` (the refusal, each act's and read's answer, the request of `accountSet`, the
op table `AiAccountsOps` with `@optable` and its handlers, the declared-op row, and one `@storedrows` kind per SQL table),
`@param`/`@returns` on each of the 66 public methods across the layer files, `@throws {Error}` on `declareTables` and
`migrate`, about 25 bound lines, and `@returns` on seven private helpers that build what the interface hands back. The
underscore members are left uncommented.

What took the time: not the reading but the reader. Almost every service answers "a refusal or the answer" as a value
(the module never throws), so every answer is a union; the strict reader then refuses each unguarded read of a member
of one side (`r.entries` on a refusal, `r.reason` on an answer). An index signature on `Refusal` removed the first half;
the second half (tests reading `r.reason`, `r.code` on the union) I left: about 280 new test refusals, the comments being
true. Several first kinds were refused because the reader cannot follow the module's own guards in untyped private
helpers (an owner checked by `_ownerAuthority`, a secret checked by `_noSecret`): I loosened the answers that echo the
request (`owner: string | null`) or wrote `*` where the code accepts anything and refuses at run time (`Act.kind`,
`gatewayKeyEnter`'s key). Two refusals remain from my lines, both the reader not following a guard.

Hard: the services the class is made with (SQL storage, record-core, membership, ai-catalogue) state no kind; I wrote
them `*`. `aiAccountsOf` hands back the class instance, which the tool writes in full, private members included.

## Update ai-accounts:124 (started 2026-11-15T15:36:42Z)

The change adds `legacy.mjs` (371 lines), a deprecated compatibility layer that becomes the class's last layer. The carry
had one conflict (the kinds block sits beside the class line the change rewrote), resolved by keeping both. I read the
new file whole and the first 100 lines of its new test: 14 new public methods, each with its old answer, and overrides
of four T53 methods that take an old form and hand back more (`accountUses` and `accountUsesOf` gain `kind`, `accounts`;
`accountFor` gains non-enumerable `kind` and `key`). Writing their comments was quick because the file states each old
answer in prose; the one snag was a conditional the reader widened. The expected answer is mostly new entries and three
"hands back differently"; I expect the instance written in full to make `aiAccountsOf` tell nearly every user.

## Update ai-accounts:188

A 15-line change inside `aiAccountsOps`: a member's own act takes a stamp already written `member:<id>` as it stands.
The carry merged it cleanly. No kind changed and my comments never stated the form of the stamp, so nothing needed to
change; the one decision was whether a careful job would have bound `by` to a bare id at the first step (I had not).

## Update ai-accounts:316

A 6-line change inside the deprecated `subscriptionTokenHold`: the acts it makes for the member pass `by` as
`member:<id>`. Merged cleanly; nothing it accepts or answers changed, so no comment changed.

## Update ai-accounts:483

The change regrades every declared op (`DECLARED_OPS`' weights, to op-grades' grades). Merged cleanly. One comment line
had to change: the union of weights in `DeclaredOp` (gained `reversible` and `terminal`, lost `caller-owned`). The kinds
hold the set of weights, not each row's, so the per-op regrading itself is invisible to the listing.

## Update ai-accounts:1098

A layer merge (F6, screens-ai), merged cleanly: every account state now carries `flagged_at` and a `health`, and two new
credential acts (`aiKeyReference`, `aiSignin`) arrive with their ops and declarations. I added the two members and a new
kind `AccountHealth` (with `@returns` on the private `_healthOf`, so the reader checks `_stateOf`'s answer), the two
methods, and the two ops with their bounds. Quick: the change's own comments state each answer, and the bounds were the
ones already written for `accountSet`.

## Done (2026-11-15T15:44:33Z)

No gap steps: the real code did not change between one replayed change and the next.

## Carry to main 0dea5a6 (started 2026-11-15T16:42:27Z)

The comments-only first step on the product's main (1 Nov), whose ai-accounts is OLDER than the 124-before state the
comments were written for: before T53, one `index.mjs` of 1,788 lines (a class of true `#private` members), `schema.mjs`
and `checks.mjs`, no layer files. Of the public methods, 23 exist only on main (a member's reference, the team's key, a
project's account, the sign-in), 25 are in both (most keyed by `owner` instead of `account_id`), and 37 of 124-before's
are gone.

The three-way merge (ours = commented 124-before, base = real e255f11da4, theirs = main) carried nothing: in `checks.mjs`
both conflicts were comments on code main lacks (`made`, `fillSentence`), so it stays as main's; in `index.mjs` the first
conflict was the whole kinds block against main's whole class. So I read main's `index.mjs` whole and the schema's
tables, and wrote the comments into main's real file by anchor, copying what still fit from the earlier comments (the
refusal, the material limits, the switches, the history, the keep-away and change rows, the shared methods' lines) and
taking the old answers' shapes from the same helper's `legacy.mjs` of 124-after, which describes these very methods as
deprecated forms. About 270 substantive lines were copied as they stood, about 220 written or rewritten: the pre-T53
kinds (a member's reference state and sign-in, the team key's facts, the uses answer with `kind` and `accounts`,
`accountFor`'s `{kind, level, key}`, a project's account, the suspensions, the cleared notice), the 24 ops of the op
table, and stored-row kinds for the eight tables T53 dropped or renamed.

What took the time: reading main's file and deciding what of the T53 comments was still true. Two corrections after the
first check (a private helper's `scope` including `true`; `KEPT_AWAY_UNREADABLE`'s `keep_away` stated). The check says
comments only: yes; refusals 153 -> 371, of which 2 are from my lines (the same two the earlier helper had), about 199 are
tests reading members of the union answers, and 33 are bounds without a named test. Listing "anything" 63 -> 122.

## Done (carry to main, 2026-11-15T16:50:08Z)
