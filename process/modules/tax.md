Length: 11 lines. Last section: "Requirements".

# tax: requirements

Next number: 4

## Requirements

- **R1** [met] The tax on an amount in whole pence at the standard rate of 20 percent is the amount times 0.2, rounded half up to a whole penny.
- **R2** [met] An amount that is negative or not a whole number of pence is refused with a RangeError that names the bad amount.
- **R3** [met] The tax at the reduced rate of 5 percent, when the caller asks for that rate, is the amount times 0.05, rounded half up to a whole penny; any other rate asked for is refused with a RangeError that names it.
