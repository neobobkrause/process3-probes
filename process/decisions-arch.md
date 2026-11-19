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
