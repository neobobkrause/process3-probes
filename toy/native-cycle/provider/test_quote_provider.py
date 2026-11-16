"""Tests for workshop-card pricing."""

import unittest

from quote_provider import MAX_QUANTITY, MIN_QUANTITY, UNIT_PRICE_CENTS, price_for


class PriceForTests(unittest.TestCase):
    def test_contract_constants(self):
        self.assertEqual(MIN_QUANTITY, 1)
        self.assertEqual(MAX_QUANTITY, 100)
        self.assertEqual(UNIT_PRICE_CENTS, 250)

    def test_ordinary_and_boundary_totals(self):
        for quantity, expected in ((1, 250), (2, 500), (17, 4250), (100, 25000)):
            with self.subTest(quantity=quantity):
                total = price_for(quantity)
                self.assertEqual(total, expected)
                self.assertIs(type(total), int)

    def test_invalid_bounds(self):
        for quantity in (-100, -1, 0, 101, 1000):
            with self.subTest(quantity=quantity):
                with self.assertRaises(ValueError):
                    price_for(quantity)

    def test_invalid_types(self):
        for quantity in (True, False, None, 1.0, 2.5, "1", b"1", [], {}, (), complex(1, 0)):
            with self.subTest(quantity=quantity):
                with self.assertRaises(ValueError):
                    price_for(quantity)


if __name__ == "__main__":
    unittest.main()
