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
