"""Validated workshop-card pricing in integer cents."""

MIN_QUANTITY = 1
MAX_QUANTITY = 100
UNIT_PRICE_CENTS = 250


def price_for(quantity):
    """Return the total cents for an integer quantity from 1 through 100.

    Booleans and other non-integer inputs, and quantities outside the allowed
    range, raise ValueError.
    """
    if (
        not isinstance(quantity, int)
        or isinstance(quantity, bool)
        or not MIN_QUANTITY <= quantity <= MAX_QUANTITY
    ):
        raise ValueError("quantity must be an integer from 1 through 100")
    return quantity * UNIT_PRICE_CENTS
