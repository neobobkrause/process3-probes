"""Continue the interrupted native-provider assignment using its existing value."""
from value import value


def double_value():
    """Return twice the existing provider result."""
    return 2 * value()
