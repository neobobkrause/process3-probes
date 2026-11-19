Length: 11 lines. Last section: "Requirements".

# discount: requirements

Next number: 4

## Requirements

- **R1** [met] The discount on an amount of whole pence at a percentage from 0 to 100 is the amount times the percentage divided by 100, rounded half up to a whole penny.
- **R2** [met] An amount that is negative or not a whole number of pence, and a percentage that is not a finite number or is outside 0 to 100, are refused with a RangeError that names the bad value.
- **R3** [not yet met] A percentage may also be given as text: a number, optional spaces, and a percent sign, such as "15%"; it is then judged as R1 and R2 say, and text of any other form is refused with a RangeError that quotes it.
