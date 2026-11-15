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

