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
