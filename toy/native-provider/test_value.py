"""Module acceptance written by the native provider development subagent."""
import unittest

from value import value


class ValueTests(unittest.TestCase):
    def test_assigned_value_and_type(self):
        result = value()
        self.assertEqual(result, 42)
        self.assertIs(type(result), int)

    def test_repeated_calls_preserve_result(self):
        self.assertEqual([value() for _ in range(3)], [42, 42, 42])

    def test_arguments_outside_contract_are_rejected(self):
        with self.assertRaises(TypeError):
            value(1)


if __name__ == '__main__':
    unittest.main()
