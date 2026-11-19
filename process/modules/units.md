Length: 14 lines. Last section: "Requirements".

# units: requirements

Next number: 7

## Requirements

- **R1** [met] A weight given in grams, kilograms, ounces or pounds is converted to whole grams, rounded to the nearest gram.
- **R2** [met] A weight that is negative, not a finite number, or in a unit not named in R1 is refused with a RangeError that names the bad value or unit.
- **R3** [met] A weight given in stones (unit 'st', 6350.29318 grams each) is converted to whole grams as in R1, and is not refused by R2.
- **R4** [met] A weight may also be given as text such as "2.5 kg" or "12oz": a number, optional spaces, and one of the units R1 and R3 name; it converts as R1 says, and text of any other form is refused with a RangeError that quotes it.
- **R5** [met] A weight given in tonnes (unit 't', 1,000,000 grams each), as a weight or as text such as "0.01 t", is converted to whole grams as in R1, and is not refused by R2.
- **R6** [not yet met] Weight text may name its unit in full, singular or plural, in any letter case: gram, kilogram, ounce, pound, stone or tonne, such as "2 Kilograms" or "1 pound"; it converts as R4 says.
