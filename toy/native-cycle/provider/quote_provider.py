"""Validated workshop-card pricing in integer cents."""

MIN_QUANTITY = 2
MAX_QUANTITY = 50
UNIT_PRICE_CENTS = 275


def price_for(quantity):
    """Return the total cents for an integer quantity from 2 through 50.

    Booleans and other non-integer inputs, and quantities outside the allowed
    range, raise ValueError.
    """
    if (
        not isinstance(quantity, int)
        or isinstance(quantity, bool)
        or not MIN_QUANTITY <= quantity <= MAX_QUANTITY
    ):
        raise ValueError("quantity must be an integer from 2 through 50")
    return quantity * UNIT_PRICE_CENTS
