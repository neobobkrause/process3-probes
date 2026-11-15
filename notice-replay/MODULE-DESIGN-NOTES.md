# Notes for the jobs of ai-accounts and wizard-scripts: what makes their interfaces hard to state, and how to change that

15 Nov 2026. Written by Claude (the replay session) at Bob's request, for him to pass on to the jobs that build these two modules. Nothing here is in force. It is advice for those jobs to weigh, not a list of required work.

Four words are kept apart. **Measured**: counted by a script or by the tool. **Judged**: someone's reading; it says whose. **Estimated**: worked out from a sample. **Unproven**: never tried.

## Why this note exists

The notice method tells a module that uses another module (a **user**) only when the used module (the **provider**) changes its **interface**. The interface is what the provider accepts and what it hands back, written in **structured comments**: comments in a fixed form that a reading program (TypeScript's reader) understands and that change nothing when the code runs. A tool writes the interface out as a list of **entries**, one per function, method, constant or kind of data, before and after each change. If an entry changed, its users are told.

In the replay, a helper wrote these comments for each module as it stood before its recorded changes, then kept them true through each change. The two helpers for ai-accounts and wizard-scripts found the same few features of the code that make the interface either too big (so every change looks like an interface change, and users are told for nothing) or too vague (so a change that breaks users looks like no change at all). Some of those are faults in the tool, which this replay is fixing; the rest are in how the modules are built, and only their jobs can change them. This note separates the two.

## What the tool will handle, so the jobs need not

These were faults of the tool, not of the modules (judged, Claude; the fixes are recorded in `notice-proof/tool/REPLAY-CHANGES.md`):

- **A class was written out member by member** wherever a function handed one back. `aiAccountsOf` hands back an `AiAccounts` object, so a change to any one of its members read as `aiAccountsOf` handing back something different, and every user that calls `aiAccountsOf`, which is almost every user, was told. The tool now names such an object by its kind, as it already did for objects described by a named comment kind, and compares each member separately.
- **Truly private members** (written `#name`; JavaScript lets no other module reach them) were listed as entries. wizard-scripts has 64 such methods (measured by pattern count), ai-runs, ai-catalogue and ai-use dozens more. The tool now leaves them out.
- **An internal serial number** in the reader's naming of some built-in kinds (`ReadonlySet`, members keyed by a symbol) differed between two readings and made unchanged entries look changed. The tool now ignores it.

The rest of this note is about the modules themselves.

## ai-accounts

### 1. The object it hands out exposes its internals

**What is there** (measured by pattern count at the state before pull request 124): the object `aiAccountsOf` hands out is one class built from a chain of eight classes (`AiAccountsBase`, `Limits`, `Accounts`, `Lists`, `Offering`, `Serving`, `Lifecycle`, `AiAccounts`), with about 67 public methods and about 85 methods whose names start with `_`. The underscore says "mine, do not use", but JavaScript does not enforce it: any user can call them, and the tool must list them, because a user that does call one depends on it.

**Why it matters.** Every one of those 85 internal methods is part of the interface as far as any tool or reader can tell. A change to any of them is an interface change, and the users of the module are told for nothing.

**What the job could do.**
- State the public interface as a named kind of its own: a comment type listing the public methods with what each accepts and hands back, and have `aiAccountsOf` say it hands back that kind. Users then see only the public methods; internal ones are not part of the interface at all.
- Make internal methods truly private (`#name`), or move them out of the class into plain functions of the module that the methods call. Either way no user can come to depend on them.
- The chain of eight classes exists to split one large object across files (judged, Claude, from the file headers). Plain functions in those files, called by a thin public object, would do the same without making every helper a member of what users receive.

### 2. Answers that are "a refusal or the result", read without checking which

**What is there.** The module never throws. Every service answers either a refusal or a result, as a value. The module's own tests (and, the helper expects, its users) read fields of the answer without first checking which of the two it is.

**Why it matters** (measured, the ai-accounts helper's own counts). Stating each answer honestly as "a refusal or this result" drew about 280 complaints from the reader in the module's own tests, all of the kind "this field may not be there". To keep the check usable, the helper loosened many answers: it gave the refusal kind an open-ended list of fields, and wrote several answer fields as "text or nothing" where the code in fact always fills them. A loosened kind says less, so a real change to those fields is less likely to show.

**What the job could do.**
- Give every answer one field that says which it is, with exact values (`ok: true` on results, `ok: false` on refusals), and give the refusal one fixed shape with named optional details instead of an open-ended list.
- In tests and in users, check `ok` before reading anything else (a small helper such as `expectOk(answer)` that fails the test on a refusal and hands back the result does this in one line).
- Then the comments can state the exact union, the reader checks every read, and a change to either side is visible.

### 3. A change of format that no kind records

**What happened on the record** (the study's judged reading). Pull request 316 fixed a flaw: an act was then recorded under `member:ann` where before it was `ann`. Three tests of store-assembly wrote the old form and failed. The kind of that field was, and in the replay's comments still is, "text", so the change is invisible to the tool.

**What the job could do.** When a value has a fixed format that other modules write or compare, give the format a kind of its own: in the comment, a template kind such as `` `member:${string}` ``, or at least a bound line (`@bound by: written member:<member id>`). Then changing the format changes the interface, and the users that write it are told. The same applies to ids, codes, dates, and any word list users compare against.

### 4. Other modules' objects handed in without kinds

**What is there.** The storage, record-core, membership and ai-catalogue objects are handed in with no stated kind; those modules state none. The helper wrote them as "anything".

**What the job could do.** Nothing alone: the remedy is those modules stating their own interfaces, which their first comments step does. Once they do, ai-accounts should name their kinds (`@import`) instead of writing its own copy of their shape. A user that writes its own copy of a provider's shape hides its use of that provider from the tool (measured once, on plan-work: with its own `{open}` shape for ai-runs, the tool did not link its call to ai-runs' `open` at all).

### 5. Defaults that pretend an input is optional

**What is there.** Parameters that are in fact required are given defaults of `null` or `{}` (`sealSecret = null`, the whole argument `= {}`). The reader takes the default as the kind ("this is null") and then complains wherever the code uses it as something else.

**What the job could do.** No default for a required input; check it and refuse it explicitly if missing. Where a default is real, write the kind in the comment.

### 6. Tables written through query text

**What is there.** The module keeps ten tables and writes them with SQL text through `sql.exec`; JSON stored in columns is read back with `JSON.parse`. The tool can see neither: the helper stated a row kind for each table, but nothing ties a write to it, and each `JSON.parse` of a stored column is mistaken for a message between running parts (12 refusals, measured).

**What the job could do.** One small writing function per table, taking a row of the table's stated kind, as the only place that writes it; one reading function per JSON column that states the kind it hands back. That ties every row and every stored value to a kind users can be told about.

### 7. Smaller points

- `Act.kind` accepts any value and refuses unknown ones at run time; lookups like `PART_OF_KIND[act.kind]` then read as "anything". Check the value once where it enters, and from there on hold it as one of the known names.
- Pull request 483 re-graded individual operations, but the comments hold only the set of weights, not which operation has which. If users depend on an operation's weight, state the weights as a table keyed by operation.

## wizard-scripts

### 1. The lists users depend on carry no kind

**What is there.** Most of what other modules take from wizard-scripts is content: `ADMIN_ACTS` (a set of act names), `SCREEN_REGISTRY`, `CIVICSMITH_LIBRARY`, `FRONT_DOORS` and their sources. store-assembly, interface-shell, affordances and screens-inquiry read them (the helper's reading). The comments state their shape (`ADMIN_ACTS` is "a set of text", with a bound saying the names come from a list kept elsewhere), not which names are in them.

**What happened on the record** (the study's judged reading). Pull request 163 changed what the registry and library say about acts. affordances' test asserted that a screen carried certain acts, and screens-inquiry's screen declared acts that were now retired. Both were judged broken. Pull request 253 removed five names from `ADMIN_ACTS`, and 255 put two back. Because no kind changed, the helper's expected answer for all five recorded changes is "no listing change": the method, as the comments stand, would tell nobody about any of them (judged, the wizard-scripts helper).

**What the job could do.**
- Where users depend on particular names being in a list, the names are interface, not content. Have the generator (`build-data.mjs`) also write a kind that lists them, for example `AdminAct = 'groupkeyset' | 'projectkeyset' | ...`, and give `ADMIN_ACTS` that kind. Removing a name then removes it from the kind, and the users that name it are told.
- Where users only pass the list on and depend on no particular name, leave it as content; a change to it should tell no one.
- Which is which is a question for the users' jobs as much as this one; the record shows both happened (two broken users at 163, several told for nothing).

### 2. Generated files that cannot carry comments

**What is there.** The generated constants are written by `build-data.mjs`, and a test holds the generated files byte for byte equal to its output, so a comment added by hand would make that test fail. The helper could not comment them, and tried giving the freezing helper a kind that keeps the data's exact shape instead; that made every change of content look like a change of kind and drew about 40 complaints in tests, so it was undone.

**What the job could do.** Have the generator write the comments into the generated files itself: the kind of each constant, and the list of names where users depend on them (point 1). The test that holds the files equal to the generator's output then holds the comments too.

### 3. The same faults as ai-accounts

- **Answers that are "a refusal or the result"**, read in tests without checking which: 24 or more of the test complaints at the first state (measured). Same remedy as ai-accounts point 2.
- **A constructor whose whole argument defaults to `{}`** although its parts are required. The helper had to call it "partly filled" and then insist, in two casts, that `record` and `membership` are there. Same remedy as ai-accounts point 5.
- **Twelve tables written through SQL text**, and rows read back whose columns depend on the query. Same remedy as ai-accounts point 6.
- **Checking helpers** (`isObj` and the like) that the reader cannot see narrowing a value. Write them as type checks in the comment (`@returns {value is Object}`), so the reader knows what is true after them.
- **Refusals from record-core and membership** are read here with `ok` as a plain true-or-false, so the helper added its own copy of their refusal kind. A single refusal kind shared by all modules, stated once and imported, would remove that copy and the risk of it drifting.

## The same patterns elsewhere in the cluster

The helpers for ai-runs, ai-catalogue and ai-use reported the same patterns (their own reports and logs, `effort/<provider>.md`):

- "a refusal or the result" read without checking, in every one of the five modules (about 150 complaints in ai-runs' tests, about 100 in ai-use's and ai-catalogue's, before each helper loosened its kinds);
- inputs required in fact but defaulted to `null` or `{}`;
- values built in local variables without a comment, so `ok: false` widens to true-or-false and the exact answer is lost;
- tables written through SQL text and stored JSON read back with `JSON.parse`;
- behaviour that changed what callers see with no kind or bound to carry it: in ai-runs, pull request 323's withheld dispatches; in ai-catalogue, pull request 1097 moving the catalogue's address from `/catalogue/index.json` to `/ai/index.json`, which is a lone constant of kind "text".

The last kind of change, a change of behaviour or of a single value under an unchanged kind, is not something better structure removes. Only a test that checks the behaviour, run against the change, finds it.

## What is unproven

- None of these changes to the modules has been made or tried. That they would reduce notices for nothing, or let the tool see the breaks described, is a judgement from how the tool works (Claude), not a measurement.
- The record's verdicts quoted here are the study session's reading, one reader.
- The counts of complaints are the helpers' own, from the tool's check at the state before each module's first recorded change.
