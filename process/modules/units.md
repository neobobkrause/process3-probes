Length: 11 lines. Last section: "Requirements".

# units: requirements

Next number: 4

## Requirements

- **R1** [met] A weight given in grams, kilograms, ounces or pounds is converted to whole grams, rounded to the nearest gram.
- **R2** [met] A weight that is negative, not a finite number, or in a unit not named in R1 is refused with a RangeError that names the bad value or unit.
- **R3** [met] A weight given in stones (unit 'st', 6350.29318 grams each) is converted to whole grams as in R1, and is not refused by R2.
