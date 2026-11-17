# Quantity comparison Screens

ARCH-accepted product design for the disposable proof app, frozen through the qualified quote-comparison lane. This extends the existing single-quote Screens S1–S4; those remain required. This file defines requirements for the internal walk, not observed results.

The report and web modules implement one feature: compare up to eight alternative card quantities and export the comparison. Each row is a separate alternative, never part of a combined order or a claimed volume discount. Current provider examples are minimum 2, maximum 50, unit price $2.75. All bounds/prices must follow the injected provider contract.

## C1 — navigation and fresh comparison

GET `/compare` without a query is HTTP 200. The page title and h1 identify “Compare workshop card quotes” or equivalently clear comparison wording. A visible link from the existing quote flow opens it; comparison pages link back to the single-quote flow. Existing GET `/`, `/quote` and unknown-route behavior remain intact.

The page explains that rows are alternatives and prices are per option. It displays current range 2–50 and unit price $2.75. A visible label is associated with a `textarea` named `quantities`; help text explains comma or newline separators, 1–8 distinct whole quantities and current valid bounds. A real submit button compares the quantities. The fresh textarea contains valid examples `2,12,50` (spacing/newlines may differ); there is no alert or stale comparison result.

For a changed provider range, clamp the example sequence 2,12,50 into the injected inclusive bounds and remove duplicates in order. Every fresh alternative must be valid. Fresh data is not a submitted invalid value and must never overwrite rejected text.

## C2 — comparison result and download

GET `/compare?quantities=2,12,50` is HTTP 200 with three rows in that order, quantity 2 total $5.50, quantity 12 total $33.00 and quantity 50 total $137.50. Display the current unit price consistently. Use a semantic table with a descriptive caption or equivalent heading and actual column headers; quantities and individual totals are readily distinguishable. There is no aggregate “grand total,” discount claim or false saving between alternatives. There is no alert.

The submitted textarea remains editable. A “Download CSV” link exports exactly the displayed quantities in order through `/compare.csv` with one correctly encoded `quantities` query parameter. Refreshing a comparison repeats a harmless read. A fresh-comparison link returns to the valid default form.

A valid singleton (2) and exactly eight distinct valid alternatives both work. Input order is retained, including descending alternatives. Surrounding whitespace around each token is accepted; comma or newline separates tokens. ASCII decimal leading zeros are interpreted as integer quantities; duplicate detection happens after normalization.

## C3 — invalid comparison and recovery

Submitted comparison queries must contain exactly one nonempty `quantities` parameter. Missing quantities when a query is present, duplicate parameters, empty input, empty tokens (including trailing commas/newlines), repeated quantities, fewer than one or more than eight alternatives, signs, decimal/exponent syntax, non-ASCII digits, text, HTML payloads and out-of-range quantities are HTTP 400.

Validation is all-or-nothing: a mixed valid/invalid batch produces no partial comparison table and no CSV download for purported results. Show an actionable `role=alert` message identifying the format/count/range issue as appropriate, with current provider bounds. Retain the exact raw submitted textarea text, including whitespace, empty strings and HTML characters; encode it so a closing-textarea/script payload cannot become markup or execute. Duplicate-query errors may retain the first submitted value for editing, consistent with existing quote behavior.

After an error, replacing the text with valid `2,12` gives HTTP 200, correct totals and no stale alert. Navigating back to the single-quote form still offers minimum 2, and valid/invalid single-quote behavior remains unchanged.

## C4 — CSV representation and failure

GET `/compare.csv?quantities=2,12,50` returns HTTP 200, `Content-Type: text/csv; charset=utf-8`, and an attachment disposition with filename `quote-comparison.csv`. UTF-8 bytes contain exactly this fixed header and three numeric rows, with CRLF line endings:

```text
quantity,unit_price_cents,total_cents
2,275,550
12,275,3300
50,275,13750
```

Rows retain input order. Values are integer cents, without currency symbols, floats, extra columns or aggregate rows. Fixed numeric fields prevent arbitrary input from becoming spreadsheet formulas. The browser download content must agree with the visible comparison.

Invalid CSV queries follow the same validation as C3, returning HTML HTTP 400 with retained safe input and actionable error, not a successful attachment or partially valid CSV. Direct missing `/compare.csv` is invalid. No persistence, account, payment, public hosting or external service is introduced.

## Module and walk boundary

Report owns typed comparison model, provider delegation, CSV and CLI; web owns input grammar, HTML/HTTP presentation and safe download handling. Their own module tests are not the internal walk. ARCH inspects actual final source and real responses at the exact integration head for S1–S4 and C1–C4; only real findings cause assigned correction and a new round. The independent external browser walk is specified separately in `UX_JOURNEYS.md`.
