# Effort log: op-declarations

## First comments (state before op-declarations:95)

Started 2026-11-15T15:21:03Z.

What I did. Read the brief, the proof's rules, bookings/store and the tool's listing code; built the real state (check: 143 refusals, all in the module's own tests; listing: 114 "anything" lines, since every one of the 107 exports of index.mjs is a lazy Proxy the reader cannot see through). Read the module's structure: index.mjs is 2,930 lines, nearly all data (about 460 hand op rows, 60-odd families with seven share files, ~95 frozen op-name lists, the session sets, NEEDS, stamps, the act gate) built inside `build()` and handed out through proxies.

The decision that took the thought: `@optable`. op-declarations answers none of the ~1,030 ops it declares; their owners do. The names come from hand rows, families, share files, aliases and owners' declarations registered at run time. A hand-written table of every op name would be ~1,000 lines that nothing could check against the code (the exports are proxies), and would make this module a second answerer of every owner's op names. So I stated the kinds of the tables exactly (OpSpec, OpTable, OpKinds with the 27 kind names, OpFamily, SessionOps, NeedsTable, OpStamps, ActGate, ...) and left the names as content, with @bound lines saying where they come from. Consequence: adding or moving an op changes no listing.

What was hard. The exact unions I first wrote for classes and stamps made every `.includes(someString)` a refusal; widened to string with a bound. ReadonlySet was the wrong kind for the frozen session sets. Then judging 73 new test refusals one by one: all are tests doing what the true kind forbids (writing frozen tables on purpose, reading a nullable field unchecked) or indexing the module namespace by name; none says a comment is wrong.

Time: roughly 12 minutes of my time, most of it reading index.mjs and deciding about @optable.

## Update op-declarations:95

Carry merged cleanly. Read the 324-line source diff: new ops in families (eventwithdraw, moneyfiscalyears, federaloffices), owner extras on two calculations ops, ai-accounts' family in t48.mjs rewritten (21 retired ops out, ~30 in), ai-use's share grown, four ops out of REAUTH_ACTS, ACT_HELP_ABSENT re-sorted. Nothing I wrote stopped being true, so no comment changed; check: comments only, 240 refusals against 149 real. Expected answer: only the entries whose kinds the tool infers from frozen literals change (T48_FAMILIES, T48_SHARES, REAUTH_ACTS). The ops that vanish from OPS are invisible to the listing by design, which is the weak spot of my first-step decision. About 4 minutes.

## Update op-declarations:167

Mechanical carry from 95's after (nothing in the gap). The source change is 45 lines: op names moved among ACT_HELP_ABSENT's grounds. No comment changed; check: comments only, 246 against 155 real. Expected: no listing change. About 2 minutes.

## Update op-declarations:289

Mechanical carry (nothing in the gap). The change adds seven ai-accounts acts to t47.mjs's REAUTH_ACTS, a file I left uncommented because its frozen literal is already an exact kind. No comment changed; check: comments only, 248 against 157 real. Expected: REAUTH_ACTS hands back differently, telling admission, which reads it. About 2 minutes.

## Update op-declarations:321

Mechanical carry (nothing in the gap). The change names `aipathready` under ACT_HELP_ABSENT's read ground. No comment changed; check: comments only, 252 against 161 real. Expected: no listing change. About 2 minutes.

## Overall

The first step took nearly all the effort, and most of it went on one decision: whether op names are kinds (`@optable`) or content. With names as content, the four later changes cost a few minutes each and changed no comment, but three of them (95, 167, 321) change which ops exist or how they are grouped, and the listing does not see that. Only the frozen literals the tool infers by itself (t48.mjs's shares and families, t47.mjs's REAUTH_ACTS) carry those changes into the listing.
