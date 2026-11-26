# ARCH's technical decisions

## The units interface
Decision: units hands weights to other modules through one function, toGrams(weight), taking a Weight { value, unit: 'g' | 'kg' | 'oz' | 'lb' } and giving back whole grams; a bad weight raises RangeError.
Why: shipping needs a weight in one unit, and was written against this form while units was being built.
Decided: 19 Nov 2026.

## Express shipping
Decision: shippingCost takes an optional second argument { express }, so every caller written before express keeps working unchanged.
Why: invoice was being written against shipping at the same time; a provider first accepts the new form beside the old.
Decided: 19 Nov 2026.

## The tax rate
Decision: taxOn takes an optional second argument naming the rate, 'standard' or 'reduced'; left out, it is the standard rate.
Why: invoice calls taxOn(amount) at the standard rate, and must keep working when the reduced rate is added.
Decided: 19 Nov 2026.

## Limits no requirement names
Decision: a module refuses only what a requirement names; invoice keeps no limit of its own on very large totals.
Why: invoice's first job added a refusal for totals past exact whole numbers, which no requirement asked for, and a test exists only to prove a requirement.
Decided: 19 Nov 2026.

## The money module
Decision: a new module, money, comes after tax and before invoice in the module order and uses no module. It gives one function, formatPence(pence), taking a whole number of pence, zero or more, and giving back pounds text: a pound sign, the whole pounds with a comma between each group of three digits, a point, and two digits of pence (1234 gives "£12.34", 5 gives "£0.05", 123456789 gives "£1,234,567.89"). Any other value is refused with a RangeError that names it.
Why: invoice is to show its amounts as pounds text, and showing money is a concern of its own that no present module holds.
Decided: 19 Nov 2026.

## The discount module
Decision: a new module, discount, comes after money and before invoice and uses no module. It gives one function, discountOn(amount, percent): the pence taken off an amount of whole pence at a percentage, amount times percent divided by 100, rounded half up to a whole penny. An amount that is negative or not a whole number of pence, and a percent that is not a finite number or is outside 0 to 100, are refused with a RangeError that names the bad value.
Why: invoice is to take a discount off the goods; the rule for working it out is a concern of its own, and keeping it apart lets invoice's job wait on it, which the trial needs.
Decided: 19 Nov 2026.

## The far shipping zone
Decision: shippingCost's options gain zone, 'home' or 'far'; absent is 'home'. A far parcel costs half as much again as the same parcel at home, express or not, after the express doubling; the 20 kilogram limit holds. A zone given that is not 'home' or 'far' is refused with a TypeError that names it, as a bad express is.
Why: the provider accepts the new option beside the old form, so invoice and every present caller keep working unchanged.
Decided: 19 Nov 2026.

## Invoice in round 2
Decision: invoiceFor(goods, parcel, options) keeps its form; its options also take discount, a percent for the discount module, and zone, passed to shipping as it is. The invoice it gives back gains discount, the pence the discount module takes off the goods (0 when none is asked), and text, an object holding goods, discount, shipping, tax and total each as money's pounds text. Tax is the standard-rate tax on goods less discount plus shipping; total is goods less discount plus shipping plus tax. A refusal by discount, like those of tax and shipping, is passed on unchanged. invoice declares uses of shipping, tax, money and discount.
Why: the owner approved this work on 19 Nov for trial stage 3; fields added to what invoice hands back tell no module, since none uses invoice.
Decided: 19 Nov 2026.

## The rate the tax module used
Decision: tax gives a second function, taxDetail(amount, rate), taking what taxOn takes and giving back { tax, rate, percent }: the tax as taxOn gives it, the rate's name, and the rate as a whole percent (20, 5 or 0). taxOn stays as it is.
Why: a caller that must show which rate was used gets it from the module that chose it; leaving taxOn unchanged tells no present user.
Decided: 19 Nov 2026.

## Money without the pound sign
Decision: formatPence takes an optional second argument { symbol }, true by default; with symbol false the text is the same without the pound sign (1234 gives "12.34"). A symbol given that is not true or false is refused with a TypeError that names it.
Why: the provider accepts the new option beside the old form, so invoice keeps working unchanged.
Decided: 19 Nov 2026.

## The rate on an invoice
Decision: the invoice gains taxRate, { rate, percent }, taken from the tax module's taxDetail for the tax the invoice charges.
Why: a field added to what invoice hands back tells no module, since none uses invoice; the rate comes from the module that chose it.
Decided: 19 Nov 2026.

## A discount written as text
Decision: discountOn's percent may also be text: a number, optional spaces, and a percent sign, such as "15%" or "12.5 %"; it is read as that number and judged as before. Text of any other form is refused with a RangeError that quotes it.
Why: accepting more tells no user; invoice passes the percent on as it is given.
Decided: 19 Nov 2026.

## Milligrams
Decision: units accepts the unit 'mg', 0.001 grams each, in a Weight and in weight text, with the full names milligram and milligrams in any letter case; toGrams still gives back whole grams, rounded to the nearest gram.
Why: accepting more keeps every caller working; the wording of the weight bound changes with it, so the tool's notice is expected to tell shipping, which uses toGrams, and this round is to try that notice.
Decided: 19 Nov 2026.

## The rate's label
Decision: what taxDetail gives back gains label, text "VAT " followed by the rate's whole percent and a percent sign ("VAT 20%", "VAT 5%", "VAT 0%"); taxOn is unchanged.
Why: a caller showing the rate gets its words from the module that chose it; the change is to what taxDetail hands back, so the tool's notice is expected to tell invoice, its user, and this round is to try that notice. invoice can keep working unchanged, since it reads only the fields it already reads.
Decided: 19 Nov 2026.

## Reading pounds text back
Decision: money gives a second function, parsePounds(text), the reverse of formatPence: it takes pounds text as formatPence gives it, with or without the pound sign, and gives back the whole pence (parsePounds("£1,234,567.89") gives 123456789, parsePounds("0.05") gives 5). The commas between groups of three digits may be left out ("£1234.56"), but where given they must sit as formatPence places them; the point and two digits of pence are always required. Text of any other form is refused with a RangeError that quotes it; a value that is not text is refused with a TypeError that names it. formatPence stays as it is.
Why: a caller that holds pounds text gets the pence from the module that wrote it; a new function tells no present user. Its refusal of a value that is not text is to be proven by tests that pass such values on purpose, which this round is to try against the tool's check.
Decided: 19 Nov 2026.

## A comma in a discount
Decision: discountOn's percent text may use a comma in place of the point before its fraction, such as "12,5%" or "7,25 %"; it is read as the same number written with a point and judged as before. Text with both a point and a comma, or more than one of either, is refused as text of any other form is. A percent given as a number is unchanged.
Why: accepting more keeps every caller working; the wording of the percent's bound changes with it, so the tool's notice is expected to tell invoice, which passes the percent on as it is given, and invoice's told job is expected to find nothing to change and close without naming its pull request's number, which this round is to try.
Decided: 19 Nov 2026.

## The island shipping zone
Decision: shippingCost's zone may also be 'island'. An island parcel costs twice as much as the same parcel at home, express or not, after the express doubling; the small-parcel price and the 20 kilogram limit hold as before. A zone that is not 'home', 'far' or 'island' is refused with a TypeError that names it. The highest cost shipping hands back rises from 12600 to 16800 pence.
Why: the owner's "Decision" restart the build" of 20 Nov starts round 6 on process 7d8e529. The provider accepts the new zone beside the old ones, so every caller keeps working; the range of what it hands back changes, so the tool's notice is expected to tell invoice, which passes the zone on as it is given, and this round is to try that notice on the new version.
Decided: 20 Nov 2026.

## Whole pounds without pence
Decision: formatPence's options gain pence, true by default; with pence false, an amount that is a whole number of pounds is shown without the point and pence (1200 gives "£12", 123400 gives "£1,234", and with symbol false "12"), and any other amount is shown as before (1234 gives "£12.34"). A pence given that is not true or false is refused with a TypeError that names it. parsePounds is unchanged.
Why: round 6 gives both slots work; the provider accepts the new option beside the old form, so accepting more tells no user and invoice keeps working unchanged.
Decided: 20 Nov 2026.

## The carat unit
Decision: units accepts the unit 'ct' (carat), 0.2 grams each, in a Weight and in weight text, with the full names carat and carats in any letter case; toGrams still gives back whole grams, rounded to the nearest gram.
Why: round 7 is the first full round on process 3940d130, the version just adopted; a non-breaking accepts-more addition re-exercises the job, notice, told-job and merge loop end to end on the new version. The provider accepts the new unit beside the old ones, so every caller keeps working; the wording of the accepted-unit bound changes with it, so the tool's notice is expected to tell shipping, which uses toGrams, and shipping's told job is expected to find nothing to change, since toGrams still gives back whole grams.
Decided: 20 Nov 2026.

## The tax-exempt flag
Decision: what taxDetail gives back gains exempt, a boolean: true when the rate's whole percent is 0 (the zero rate), false otherwise. taxOn is unchanged, and taxDetail's existing fields { tax, rate, percent, label } are unchanged.
Why: round 9 is the owner-approved three-task trial on process 6b47107 (the version just adopted). A field added to what taxDetail hands back changes its range, so the tool's notice is expected to tell invoice, which uses taxDetail. invoice reads only the taxDetail fields it already reads, so its ordinary job, told of this change while still open, is expected to need no invoice change but must re-run its tests. This exercises the ordinary-job and told-while-open paths on the new version.
Decided: 24 Nov 2026.

## The tax label on an invoice
Decision: the invoice also gives taxLabel, the label text from the tax module's taxDetail (for example "VAT 20%"), alongside the rate name and percent R6 gives. invoice reads taxDetail.label; nothing invoice already hands back changes.
Why: round 9 is the owner-approved three-task trial on process 6b47107. A field added to what invoice hands back tells no module, since none uses invoice; the label comes from the module that chose the rate. This is invoice's own ordinary-job work in the trial, run in the second slot alongside tax's job so that invoice can be ready for merge while tax's job is still open (the merge-waits path) and then be told of tax's change while still open (the told-while-open path).
Decided: 24 Nov 2026.

## The facility list, and the first-creation host-version notice
Decision: the product's facility list (process/modules/facilities.json) pins Node 22 (matching process.json and the tool's own classification), names no boundary module, and lists no package facility. The six modules are pure computation: they reach no host facility outside the process, and the product has no package. Every host facility they use is a language or Node facility the tool classifies itself as in-process.
Finding (who-is-told trial, step 1): creating the facility list for the first time is read by `notify` on its merge (PR 405) as a change to Node's version (none to 22), because the tool reads the host version from the facility list and there was none before it. It told all six modules (each uses language/Node facilities, recorded under package "node" in its uses file). Node did not change; this is the list's first creation, not a version bump. I judged the notice spurious and cleared the six waiting-work entries it placed, so the conversion tranche opens clean. Also, the same facility-list push rewrote every module's uses file from the still-unconverted code (the tool rewrites all uses files when the facility list changes); the conversions rewrite them clean. Both recorded for PROCESS in the trial account.
Decided: 26 Nov 2026.

## Who-is-told trial: step 2 complete, step 3 provider and predictions
Step 2 (conversion) is complete: units #8 (PR 407), shipping #9 (408), tax #8 (409), money #5 (410), discount #4 (411), invoice #15 (412) all merged; round-done = done; every module has a clean uses file (0 places outside the standard, 0 order faults). Each conversion changed no behaviour; units/shipping/tax/money/discount declared no change of meaning. invoice's conversion changed 2 of its own items' means in a telling way (type tightening, e.g. shippingOptions no longer returns any), but told 0 modules because nothing uses invoice. Observation for the account: during the staged conversion of a previously-unconverted product, each conversion's notify told every still-unconverted downstream module (via their places outside the standard, mayRefer *), even with no means change; these are moot once the told module is itself converted, so ARCH cleared them after each merge to keep the round on conversions. This is a who-is-told finding (converting an unkept product generates O(n^2) moot inter-module notices).

Step 3 — provider chosen: units. From the converted uses files, units is used by two later modules through different items:
- shipping uses units.toGrams (call) and units.Weight (type); shipping.shippingCost takesIn units.toGrams errors and channels.
- invoice uses units.Weight (type, via its parcel parameter) only; it does NOT use units.toGrams. invoice.invoiceFor takesIn shipping.shippingCost errors and channels (not units directly).

Predictions written before building (trial step 3):
- A change to units.toGrams domain/range that does NOT change toGrams's errors or channels should tell ONLY shipping. invoice is not told: it uses units.Weight, not toGrams, and since toGrams's errors/channels are unchanged, shipping.shippingCost's means do not change, so the takesIn chain to invoice does not fire.
- A change to units.Weight (the type) would tell BOTH shipping and invoice (both name Weight).
- A change to units' insides only (no item's means changed) should tell NO module.

Change-experiment plan on units (one requirement at a time, one job each, observe each notice):
- Step 4 (insides-only): units R9 — derive GRAMS_PER and the unit-name map from one internal source table; no change to toGrams, Weight, WeightUnit or WEIGHT_UNITS observable means. Expected: notice tells no module.
- Step 5 (interface change): units R10 — toGrams gains an optional second argument, a rounding mode ('nearest' default, 'up', 'down'); default keeps current behaviour; an unrecognized mode is treated as 'nearest' (no new error, so errors/channels unchanged). ARCH places this as a meaning entry (item toGrams; was toGrams(weight); is now toGrams(weight, options?)). Expected: tells shipping only; shipping's told job reruns only its toGrams-related tests and records nothing-to-change (shipping passes no mode); invoice not told.
- Step 6 (change of meaning, if cheap): units R11 — toGrams rounds a half-gram DOWN instead of up; stated type (number) and bound (whole grams, zero or more) unchanged, so the means cannot show it; declared with push --meaning. Expected: tells shipping only (shipping reads/computes with the grams value); invoice not told.
Decided: 26 Nov 2026.

## Who-is-told trial: the account (steps 4-7, 26 Nov)
This records the result of the owner's "who is told" trial (instruction 26 Nov; trial file process/research/trial-who-is-told-26nov.md). Steps 1-3 (facility list, conversion, provider+predictions) are recorded above. Provider = units; its users are shipping (uses toGrams by call and Weight by type) and invoice (uses Weight by type only; it does NOT use toGrams). Each change below was one requirement, one job, observed at merge by `p4 notify`.

Expected vs told, side by side:
- Step 4, insides-only (units R9, weight-text read through one internal routine; PR 415). Expected: no module told. Told: none ("No item's means changed; nobody is told"). MATCH.
- Step 5, interface change (units R10, toGrams gains optional { mode } — 'nearest' default = prior behaviour, 'up', 'down'; unknown mode treated as nearest; no new error; PR 417). Expected: shipping only, invoice not. Told: shipping only (toGrams: accepts more, bound changed; found by its means + ARCH's placed meaning entry); invoice not told. MATCH. Shipping's told job (PR 419) reran its toGrams-related tests, found nothing to change (shippingCost passes no mode, so the default is unchanged for it), recorded nothing-to-change and closed unmerged; it ran no recorded module-test (a told job that changes nothing runs none), confirming by p4 check (no disagreement) and 28 passing tests.
- Step 6, change of meaning (units R11, the default/'nearest' rounding now sends an exact half-gram DOWN to the gram below; declared by the job with push --meaning; PR 421). Expected (as planned): shipping only, invoice not. Told, and the cascade that followed:
  1. units merge (PR 421): toGrams bound changed + meaning changed -> TOLD shipping only; invoice not told. MATCH for the first hop.
  2. shipping's told job (PR 422) found the default change DID affect it at a band boundary: shippingCost({value:100.5,unit:'g'}) was 300 pence (101 g, a standard parcel) and is now 150 pence (100 g, a small parcel). It corrected that one interface-test expectation (1 line in test/shipping/shipping.test.mjs; related scope = 1 test file, 28 passed), its code unchanged (it delegates all rounding to units), and DECLARED shippingCost's change of meaning with push --meaning. Its merge (PR 422) -> TOLD invoice only (invoice uses shippingCost).
  3. invoice's told job (PR 423) needed no code or test change (no invoice test uses an exact-half-gram weight; 29 passed), but DECLARED invoiceFor's change of meaning (its shipping, tax and total derive from shippingCost). Its merge (PR 423) -> 0 modules told, because nothing uses invoice. Cascade ends.

What the trial shows (for the owner, in plain words): the notice reached exactly the right module at every step and no other. An internal-only change told no one. Adding an optional argument told only the one module that calls the changed function, and that module needed no change. A change of meaning in a value flowed exactly along the chain of modules that compute with it — units to shipping to invoice — each told only its own direct users, and the chain stopped at the module nobody uses. Twice the told module needed no change (step 5 shipping; step 6 invoice) and once it genuinely did (step 6 shipping, at a price-band boundary); in every case it was told, so it could check.

Related tests each told job ran: step 5 shipping — none recorded (nothing to change), verified by check + full suite; step 6 shipping — 1 related test file (shipping.test.mjs), 28 passed; step 6 invoice — none (nothing to change), 29 passed as a whole-module confirmation.

Cost and time (readable): job-session costs, US dollars — units #10 6.92, shipping #10 4.36, units #11 7.54, shipping #11 5.56, invoice #16 4.21; five job sessions about 28.59 total. ARCH's own and the coordinator's overhead for this trial is unmeasured here. Wall-clock: steps 5 and 6 together ran about 04:40-05:24Z on 26 Nov (about 45 minutes), one change experiment at a time.

Findings for PROCESS (who-is-told):
(a) First creation of the facility list (PR 405) was read by notify as a host-version change (node none -> 22) and told all six modules; spurious (node did not change), cleared. Recorded above.
(b) Staged conversion of a previously-unconverted product: each conversion's notify told every still-unconverted downstream module via their places-outside-the-standard (mayRefer *), O(n^2) moot notices, cleared after each merge. Recorded above.
(c) The plan's step-6 example ("a change the means cannot show") turned out to be means-VISIBLE: R10's job had written the tie-break ("a half upward") onto a marked @bound line of ToGramsOptions.mode, and the coding standard puts a bound no type can express on a marked bound line, so changing it is by definition an interface change. notify therefore found the step-6 change both by its means (bound changed) and by the job's declaration. A genuinely means-invisible change of meaning was not cheaply available on toGrams once the tie-break had been bound-encoded. The push --meaning declaration path was still exercised at all three hops and worked.
(d) The change of meaning CASCADED two further hops without any ARCH placement: shipping and invoice each compute a value from the changed item, so each job recognized its own item changed with the provider's, declared it, and told its own users. Each hop told exactly the next direct user and the chain ended at invoice (no users). This exercised the "an item of its own changes with a provider's" path (design part 2 section 7) at two levels and showed who-is-told stays correct and bounded across a multi-hop chain.

No process fault arose in steps 4-7. The trial ends with this account; the coordinator tells PROCESS, which reports to the owner.
Decided: 26 Nov 2026.
