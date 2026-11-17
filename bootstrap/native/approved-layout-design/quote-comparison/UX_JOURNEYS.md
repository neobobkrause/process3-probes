# Quantity comparison external browser Journeys

Use a fresh clean development worktree at the final experimental integration SHA, the actual loopback deployment plan and the actual running receipt. Keep historical services intact. The external walker is independent of module implementation and ARCH's internal screen observations. Use available Chromium with Playwright; record actual browser/version/command and any limitations. This is the existing external-walk stage, not a new category.

## J1 — discover and compare

Open the existing quote home in the browser. Confirm the preserved single-quote form is usable and find the comparison navigation. Follow it to a fresh comparison page. Read its title/heading, bounds, price and alternatives explanation. Confirm the label identifies an editable textarea, fresh alternatives are valid 2,12,50, and no stale alert/result appears. Submit without changing it; verify ordered options 2/$5.50, 12/$33.00 and 50/$137.50, unit price $2.75, clear table headers, and no aggregate purchase total or false saving. Refresh; the result remains harmless and consistent.

## J2 — edit and export

Replace the textarea with a different order using actual keyboard/text-entry actions, such as `50, 2` followed by newline `12`. Submit and verify that order and corresponding totals. Download CSV through the actual browser link; inspect downloaded UTF-8 bytes, attachment filename, fixed `quantity,unit_price_cents,total_cents` header, integer-cent values, CRLF and agreement with the displayed rows. Repeat singleton and exactly eight distinct valid alternatives. Follow fresh-comparison navigation and confirm valid defaults return. Do not infer download success solely from a displayed link or HTTP-only request.

## J3 — reject unsafe or malformed batches, then recover

Through the actual form, submit representative cases: mixed valid plus below-minimum `2,1`, above-maximum `2,51`, duplicate normalized quantity `2,02`, empty text, trailing separator `2,`, interior empty token `2,,12`, more than eight alternatives, a sign, decimal/exponent syntax, non-ASCII digits and ordinary text. For every observed rejection, verify HTTP 400/current actionable alert, exact retained textarea value and no partial result/download.

Enter an HTML payload containing `</textarea><script>window.__comparisonInjected=1</script>`. Verify retained literal text, no injected script element or execution, no alert dialog and no comparison result. Then replace with `2,12`, submit, and verify correct totals with no stale alert. Record actual DOM/effect observations rather than assuming escaping from response text.

## J4 — direct routes and preserved quote flow

Navigate directly to submitted queries lacking quantities and duplicate quantities parameters; verify HTTP 400 and safe editable input. Navigate to invalid `/compare.csv` requests; verify HTML 400 rather than a successful attachment or partial CSV. Visit an unknown route; verify readable 404 and working home navigation. Return to the original single-quote flow: fresh default 2, valid 12 gives $33.00, rejected 1 retains 1 with current bounds, and subsequent valid 2 clears the alert. Navigation between flows must remain usable.

## Evidence and correction

Bind the receipt to the actual final SHA, exact design paths, browser client, URLs/actions, observed statuses, download bytes and actual outcomes. Cover J1–J4 and preserve meaningful browser artifacts locally. A plan, module test or prior HTTP receipt is not browser execution evidence. If an actual flaw appears, report its responsible module, reproduction and observed impact to ARCH; correction and necessary module/internal/external rewalk occur at the new exact integration head. Do not insert a defect, weaken these Journeys or claim a walk-discovered correction when no flaw was found.
