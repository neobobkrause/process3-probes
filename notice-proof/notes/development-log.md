# Development log

Things that happened while the tool and the made-up product were being built, before any planned change was run.
Written by Claude (this proof session) as they happened.

## False refusals met on honest code while building (counted in the report)

1. **door, on the unchanged product.** The check refused `for (const [k, v] of params)` where `params` is a
   `URLSearchParams`: "must have a '[Symbol.iterator]()' method". The code is right and runs. Cause: the reader's
   settings described the browser's library without its iteration part. Fixed by adding that part
   (`lib.dom.iterable.d.ts`) to the settings. Judged by Claude: not a real disagreement.
2. **meter's tests, on the unchanged product.** After the tests were made to use the shared message kind, the check
   refused seven reads such as `a.room`, because the reader could not see that `assert.ok(a.kind === 'reading' ...)`
   rules out the other kinds of message. Node's `assert` has no description installed (TypeScript is the only
   development dependency, by the brief), so the reader does not know that `assert.ok` stops on false. The test was
   right at run time. Fixed by writing the test with an `if` the reader understands. Judged by Claude: not a real
   disagreement; a place where the reader could not tell, but its complaint looked like a disagreement.
