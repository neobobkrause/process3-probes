Length: 12 lines. Last section: "Requirements".

# discount: requirements

Next number: 5

## Requirements

- **R1** [met] The discount on an amount of whole pence at a percentage from 0 to 100 is the amount times the percentage divided by 100, rounded half up to a whole penny.
- **R2** [met] An amount that is negative or not a whole number of pence, and a percentage that is not a finite number or is outside 0 to 100, are refused with a RangeError that names the bad value.
- **R3** [met] A percentage may also be given as text: a number, optional spaces, and a percent sign, such as "15%"; it is then judged as R1 and R2 say, and text of any other form is refused with a RangeError that quotes it.
- **R4** [not yet met] Percentage text as R3 describes may use a comma in place of the point before its fraction, such as "12,5%"; it is judged as the same text written with a point, and text with both a point and a comma, or more than one of either, is refused as R3 says.
