Length: 14 lines. Last section: "Requirements".

# shipping: requirements

Next number: 7

## Requirements

- **R1** [met] The shipping cost of a parcel is 300 pence for the first 500 grams, plus 100 pence for each further 500 grams or part of it; the weight may be given in any unit the units module accepts.
- **R2** [met] A parcel over 20 kilograms is refused with a RangeError that says the weight is over the limit.
- **R3** [met] A parcel marked express costs twice what R1 gives for its weight, and the R2 limit holds as before.
- **R4** [met] A parcel sent to the far zone costs half as much again as the same parcel sent at home, express or not; a zone that is not home or far is refused with a TypeError that names it, and the R2 limit holds as before.
- **R5** [met] A parcel of 100 grams or less costs 150 pence in place of R1's cost; express and the far zone apply to it as R3 and R4 say.
- **R6** [met] A parcel sent to the island zone costs twice what the same parcel costs at home, express or not; a zone that is not home, far or island is refused with a TypeError that names it, and the R2 limit holds as before.
