Length: 10 lines. Last section: "Requirements".

# invoice: requirements

Next number: 3

## Requirements

- **R1** [met] An invoice for goods worth a whole number of pence and one parcel gives the goods, the shipping cost from the shipping module, the standard-rate tax on goods plus shipping from the tax module, and the total of the three, all in whole pence.
- **R2** [met] An invoice whose goods amount or parcel is refused by the module it goes to is refused with that module's RangeError, unchanged.
