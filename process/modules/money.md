Length: 13 lines. Last section: "Requirements".

# money: requirements

Next number: 6

## Requirements

- **R1** [met] An amount of whole pence, zero or more, is shown as pounds text: a pound sign, the whole pounds with a comma between each group of three digits, a point, and two digits of pence; 1234 is "£12.34", 5 is "£0.05", 123456789 is "£1,234,567.89".
- **R2** [met] An amount that is negative, not a whole number, or not a number is refused with a RangeError that names it.
- **R3** [met] The caller may ask for the text without the pound sign; it is then the same text as R1 gives, less the sign, such as "12.34".
- **R4** [met] Pounds text of the form R1 or R3 gives can be read back to its whole pence, such as "£1,234,567.89" to 123456789 or "0.05" to 5; the commas may be left out but, where given, sit as R1 places them; text of any other form is refused with a RangeError that quotes it, and a value that is not text is refused with a TypeError that names it.
- **R5** [met] The caller may ask for whole pounds without pence: an amount that is a whole number of pounds is then shown without the point and pence, such as "£12" for 1200 or "£1,234" for 123400, and any other amount as R1 or R3 gives it; such a request that is not true or false is refused with a TypeError that names it.
