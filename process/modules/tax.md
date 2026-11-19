Length: 14 lines. Last section: "Requirements".

# tax: requirements

Next number: 7

## Requirements

- **R1** [met] The tax on an amount in whole pence at the standard rate of 20 percent is the amount times 0.2, rounded half up to a whole penny.
- **R2** [met] An amount that is negative or not a whole number of pence is refused with a RangeError that names the bad amount.
- **R3** [met] The tax at the reduced rate of 5 percent, when the caller asks for that rate, is the amount times 0.05, rounded half up to a whole penny; any other rate asked for is refused with a RangeError that names it.
- **R4** [met] The zero rate, asked for by the name 'zero', gives a tax of 0 pence on any amount R2 does not refuse.
- **R5** [met] The caller can be told which rate was used for a tax: its name and its whole percent (20, 5 or 0), alongside the tax that R1, R3 or R4 gives.
- **R6** [not yet met] A rate may be named in any letter case, such as 'Reduced' or 'ZERO', and is then the rate R1, R3 or R4 names.
