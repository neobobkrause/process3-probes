Length: 18 lines. Last section: "Requirements".

# units: requirements

Next number: 11

## Requirements

- **R1** [met] A weight given in grams, kilograms, ounces or pounds is converted to whole grams, rounded to the nearest gram.
- **R2** [met] A weight that is negative, not a finite number, or in a unit not named in R1 is refused with a RangeError that names the bad value or unit.
- **R3** [met] A weight given in stones (unit 'st', 6350.29318 grams each) is converted to whole grams as in R1, and is not refused by R2.
- **R4** [met] A weight may also be given as text such as "2.5 kg" or "12oz": a number, optional spaces, and one of the units R1 and R3 name; it converts as R1 says, and text of any other form is refused with a RangeError that quotes it.
- **R5** [met] A weight given in tonnes (unit 't', 1,000,000 grams each), as a weight or as text such as "0.01 t", is converted to whole grams as in R1, and is not refused by R2.
- **R6** [met] Weight text may name its unit in full, singular or plural, in any letter case: gram, kilogram, ounce, pound, stone or tonne, such as "2 Kilograms" or "1 pound"; it converts as R4 says.
- **R7** [met] A weight given in milligrams (unit 'mg', 0.001 grams each), as a weight or as text such as "2500 mg" or "2500 milligrams", is converted to whole grams as in R1, and is not refused by R2.
- **R8** [met] A weight given in carats (unit 'ct', 0.2 grams each), as a weight or as text such as "50 ct" or "50 carats", is converted to whole grams as in R1, and is not refused by R2.
- **R9** [met] units reads weight text through one internal routine that both splits the text into a number and a unit word and maps that word (a symbol or a full name) to its WeightUnit, so the module has a single place that turns a written unit into a WeightUnit. This changes nothing a caller sees: toGrams, WeightUnit, Weight and WEIGHT_UNITS accept and hand back exactly what they did, for every weight and every unit, with the same errors.
- **R10** [not yet met] toGrams takes an optional second argument, an options object `{ mode }`, where `mode` is 'nearest' (the default), 'up' or 'down'. With 'nearest' it rounds to the nearest gram as R1 says; with 'up' it rounds a part-gram up to the next whole gram; with 'down' it rounds a part-gram down to the whole gram below. Options left out, and a `mode` that is not 'nearest', 'up' or 'down', both give the 'nearest' behaviour, with no new error. toGrams otherwise accepts and hands back exactly what it did — the same whole grams for every weight at the default, and the same errors for a bad weight; weight text, WeightUnit, Weight and WEIGHT_UNITS are unchanged.
