Length: 14 lines. Last section: "Requirements".

# invoice: requirements

Next number: 8

## Requirements

- **R1** [met] An invoice for goods worth a whole number of pence and one parcel gives the goods, the shipping cost from the shipping module, the standard-rate tax on goods plus shipping from the tax module, and the total of the three, all in whole pence.
- **R2** [met] An invoice whose goods amount or parcel is refused by the module it goes to is refused with that module's RangeError, unchanged.
- **R3** [met] An invoice may ask for express shipping; its shipping cost is then the express cost from the shipping module, and the tax and total follow from it as R1 says.
- **R4** [met] An invoice may ask for a discount as a percentage from the discount module; the discount is taken off the goods before tax, the tax is the standard-rate tax on goods less discount plus shipping, the total follows, and a refusal by the discount module is passed on unchanged as R2 says.
- **R5** [met] An invoice shows its goods, discount, shipping, tax and total also as pounds text from the money module, and may ask for the far shipping zone, whose cost comes from the shipping module.
- **R6** [met] An invoice also says which tax rate it charged: the rate's name and its whole percent, from the tax module.
- **R7** [not yet met] An invoice also shows the tax rate's label, such as "VAT 20%", taken from the tax module, alongside the rate name and percent of R6.
