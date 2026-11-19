Length: 10 lines. Last section: "Requirements".

# money: requirements

Next number: 3

## Requirements

- **R1** [met] An amount of whole pence, zero or more, is shown as pounds text: a pound sign, the whole pounds with a comma between each group of three digits, a point, and two digits of pence; 1234 is "£12.34", 5 is "£0.05", 123456789 is "£1,234,567.89".
- **R2** [met] An amount that is negative, not a whole number, or not a number is refused with a RangeError that names it.
