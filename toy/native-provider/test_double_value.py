"""Replacement-session module tests for the unfinished doubling operation."""
import unittest
from unittest.mock import patch

from double_value import double_value


class DoubleValueTests(unittest.TestCase):
    def test_assigned_result_and_type(self):
        result = double_value()
        self.assertEqual(result, 84)
        self.assertIs(type(result), int)

    def test_uses_existing_provider(self):
        with patch('double_value.value', return_value=7) as provider:
            self.assertEqual(double_value(), 14)
            provider.assert_called_once_with()

    def test_arguments_outside_contract_are_rejected(self):
        with self.assertRaises(TypeError):
            double_value(1)


if __name__ == '__main__':
    unittest.main()
