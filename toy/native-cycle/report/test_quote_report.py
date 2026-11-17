"""Comparison contract and real CLI subprocess coverage."""
import importlib.util
import copy
import csv
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest

import quote_report as report


ROOT = Path(__file__).resolve().parent
PROVIDER = ROOT.parent / "provider"


def provider(low=2, high=50, unit=275, pricing=None):
    return SimpleNamespace(MIN_QUANTITY=low, MAX_QUANTITY=high,
                           UNIT_PRICE_CENTS=unit,
                           price_for=pricing or (lambda quantity: quantity * unit))


class ComparisonTests(unittest.TestCase):
    def test_ordered_alternatives_and_real_provider(self):
        spec = importlib.util.spec_from_file_location("actual_provider", PROVIDER / "quote_provider.py")
        actual = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(actual)
        model = report.build_comparison(actual, [50, 2, 12])
        self.assertEqual(model, {"min_quantity": 2, "max_quantity": 50,
                                "unit_price_cents": 275,
                                "rows": [{"quantity": 50, "total_cents": 13750},
                                         {"quantity": 2, "total_cents": 550},
                                         {"quantity": 12, "total_cents": 3300}]})

    def test_tuple_and_eight_alternatives(self):
        values = tuple(range(2, 10))
        self.assertEqual([row["quantity"] for row in report.build_comparison(provider(), values)["rows"]], list(values))
        self.assertEqual(len(report.build_comparison(provider(), [2])["rows"]), 1)

    def test_changed_bounds_and_delegated_price_are_not_hardcoded(self):
        calls = []
        revised = provider(7, 11, 199, lambda quantity: calls.append(quantity) or quantity * 199 + 17)
        model = report.build_comparison(revised, [11, 7])
        self.assertEqual(calls, [11, 7])
        self.assertEqual((model["min_quantity"], model["max_quantity"], model["unit_price_cents"]), (7, 11, 199))
        self.assertEqual([row["total_cents"] for row in model["rows"]], [2206, 1410])
        self.assertEqual(set(model), {"min_quantity", "max_quantity", "unit_price_cents", "rows"})

    def test_invalid_sequence_type_and_size(self):
        invalid = [[], list(range(2, 11)), "2,12", {2: 550}, {2, 12}, iter([2, 12]), None, 2]
        for value in invalid:
            with self.subTest(value=repr(value)), self.assertRaises(ValueError):
                report.build_comparison(provider(), value)

    def test_invalid_items_duplicates_and_bounds(self):
        for value in ([True], [False], [2.0], ["2"], [None], [1], [51], [2, 2], [2, True], [2, []]):
            with self.subTest(value=value), self.assertRaises(ValueError):
                report.build_comparison(provider(), value)

    def test_whole_list_validated_before_pricing(self):
        calls = []
        with self.assertRaises(ValueError):
            report.build_comparison(provider(pricing=lambda quantity: calls.append(quantity) or 550), [2, 51])
        self.assertEqual(calls, [])

    def test_model_does_not_mutate_input_or_share_rows(self):
        values = [2, 12]
        model = report.build_comparison(provider(), values)
        model["rows"][0]["quantity"] = 50
        self.assertEqual(values, [2, 12])
        self.assertEqual(report.build_comparison(provider(), values)["rows"][0]["quantity"], 2)

    def test_invalid_provider_cents_cannot_enter_model(self):
        for total in (True, 5.5, -1, "550", None):
            with self.subTest(total=total), self.assertRaises(ValueError):
                report.build_comparison(provider(pricing=lambda quantity: total), [2])
        for revised in (provider(unit=True), provider(unit=-1), provider(low=10, high=2), provider(low="2")):
            with self.subTest(provider=revised), self.assertRaises(ValueError):
                report.build_comparison(revised, [2])

    def test_text_renders_alternatives_without_combined_total(self):
        text = report.to_text(report.build_comparison(provider(), [2, 12]))
        self.assertIn("alternatives (not a combined order)", text)
        self.assertIn("Allowed range: 2 to 50", text)
        self.assertIn("2 | $2.75 | $5.50", text)
        self.assertIn("12 | $2.75 | $33.00", text)
        self.assertNotIn("$38.50", text)


class GrammarTests(unittest.TestCase):
    def test_comma_newline_whitespace_and_normalization(self):
        self.assertEqual(report.parse_quantities(" 02, 12\n50 "), [2, 12, 50])
        self.assertEqual(report.parse_quantities("7\r\n8"), [7, 8])

    def test_rejected_grammar_is_atomic(self):
        for text in ("", " ", ",2", "2,", "2,,12", "2\n\n12", "2 12", "+2", "-2", "2.0", "2e1", "２", "2;12", "<script>", "2,02", "2\n2", ",".join(str(n) for n in range(2, 11))):
            with self.subTest(text=text), self.assertRaises(ValueError):
                report.parse_quantities(text)
        with self.assertRaises(ValueError):
            report.parse_quantities([2])


class CsvTests(unittest.TestCase):
    def test_exact_numeric_crlf_and_preserved_order(self):
        model = report.build_comparison(provider(), [50, 2, 12])
        before = copy.deepcopy(model)
        result = report.to_csv(model)
        self.assertEqual(result, "quantity,unit_price_cents,total_cents\r\n"
                         "50,275,13750\r\n2,275,550\r\n12,275,3300\r\n")
        self.assertEqual(model, before)
        self.assertNotIn("\r\r\n", result)
        self.assertNotIn("\n", result.replace("\r\n", ""))
        self.assertEqual(list(csv.reader(io.StringIO(result, newline=""))),
                         [["quantity", "unit_price_cents", "total_cents"],
                          ["50", "275", "13750"], ["2", "275", "550"],
                          ["12", "275", "3300"]])

    def test_singleton_eight_rows_and_injected_delegated_totals(self):
        revised = provider(7, 20, 199, lambda quantity: quantity * 199 + 17)
        for quantities in ([7], list(range(14, 6, -1))):
            with self.subTest(quantities=quantities):
                result = report.to_csv(report.build_comparison(revised, quantities))
                rows = list(csv.DictReader(io.StringIO(result, newline="")))
                self.assertEqual([int(row["quantity"]) for row in rows], quantities)
                self.assertEqual([int(row["unit_price_cents"]) for row in rows],
                                 [199] * len(quantities))
                self.assertEqual([int(row["total_cents"]) for row in rows],
                                 [quantity * 199 + 17 for quantity in quantities])

    def test_rejects_malformed_models_and_row_counts(self):
        valid = report.build_comparison(provider(), [2, 12])
        invalid = [None, [], "=SUM(A1)", {}, {**valid, "rows": []},
                   {**valid, "rows": valid["rows"] * 5},
                   {**valid, "rows": "2,275,550"},
                   {**valid, "rows": [None]},
                   {**valid, "rows": [{"quantity": 2}]},
                   {**valid, "rows": [valid["rows"][0]] * 2}]
        for model in invalid:
            with self.subTest(model=model), self.assertRaises(ValueError):
                report.to_csv(model)

    def test_formula_boolean_float_and_invalid_bounds_cannot_enter_cells(self):
        valid = report.build_comparison(provider(), [2])
        for field, values in (("quantity", ("=1+1", "2", True, 2.0, 1, 51)),
                              ("total_cents", ("+SUM(A1)", "550", True, 5.5, -1))):
            for value in values:
                model = copy.deepcopy(valid)
                model["rows"][0][field] = value
                with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                    report.to_csv(model)
        for field, value in (("unit_price_cents", "@SUM(A1)"),
                             ("unit_price_cents", True), ("unit_price_cents", -1),
                             ("min_quantity", "2"), ("max_quantity", 1)):
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                report.to_csv({**valid, field: value})


class CliTests(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run([sys.executable, "-B", str(ROOT / "quote_report.py"), *args],
                              text=True, capture_output=True, timeout=10)

    def test_actual_provider_text_and_json(self):
        args = ("--provider-path", str(PROVIDER), "--quantities", "2,12,50")
        text = self.run_cli(*args)
        self.assertEqual(text.returncode, 0, text.stderr)
        self.assertEqual(text.stderr, "")
        self.assertIn("50 | $2.75 | $137.50", text.stdout)
        result = self.run_cli(*args, "--format", "json")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout), report.build_comparison(provider(), [2, 12, 50]))

    def test_injected_provider_and_no_bytecode_write(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "quote_provider.py"
            source.write_text("MIN_QUANTITY=7\nMAX_QUANTITY=9\nUNIT_PRICE_CENTS=199\ndef price_for(q):\n return q*199+17\n")
            result = self.run_cli("--provider-path", directory, "--quantities", "9\n7", "--format", "json")
            self.assertEqual(result.returncode, 0, result.stderr)
            model = json.loads(result.stdout)
            self.assertEqual([row["quantity"] for row in model["rows"]], [9, 7])
            self.assertEqual([row["total_cents"] for row in model["rows"]], [1808, 1410])
            self.assertEqual(model["unit_price_cents"], 199)
            self.assertEqual(list(Path(directory).iterdir()), [source])

    def test_invalid_inputs_exit_two_without_partial_output_or_traceback(self):
        for value in ("1", "51", "2,2", "2,12,", "2,<script>", "", "2.0", "2\n\n12"):
            with self.subTest(value=value):
                result = self.run_cli("--provider-path", str(PROVIDER), "--quantities", value)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(result.stdout, "")
                self.assertIn("error:", result.stderr)
                self.assertNotIn("Traceback", result.stderr)

    def test_missing_provider_and_required_arguments_are_readable(self):
        with tempfile.TemporaryDirectory() as directory:
            missing = self.run_cli("--provider-path", directory, "--quantities", "2")
            self.assertEqual(missing.returncode, 2)
            self.assertNotIn("Traceback", missing.stderr)
        missing_argument = self.run_cli("--provider-path", str(PROVIDER))
        self.assertEqual(missing_argument.returncode, 2)
        self.assertIn("--quantities", missing_argument.stderr)

    def test_csv_stdout_exact_bytes_and_roundtrip(self):
        result = subprocess.run([sys.executable, "-B", str(ROOT / "quote_report.py"),
                                 "--provider-path", str(PROVIDER), "--quantities", "50,2,12",
                                 "--format", "csv"], capture_output=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stderr, b"")
        self.assertEqual(result.stdout, b"quantity,unit_price_cents,total_cents\r\n"
                         b"50,275,13750\r\n2,275,550\r\n12,275,3300\r\n")
        parsed = list(csv.DictReader(io.StringIO(result.stdout.decode("utf-8"), newline="")))
        self.assertEqual([int(row["quantity"]) for row in parsed], [50, 2, 12])

    def test_csv_injected_provider_and_invalid_input_have_no_partial_output(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "quote_provider.py"
            source.write_text("MIN_QUANTITY=7\nMAX_QUANTITY=9\nUNIT_PRICE_CENTS=199\n"
                              "def price_for(q):\n return q*199+17\n")
            result = subprocess.run([sys.executable, "-B", str(ROOT / "quote_report.py"),
                                     "--provider-path", directory, "--quantities", "9\n7",
                                     "--format", "csv"], capture_output=True, timeout=10)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(result.stdout, b"quantity,unit_price_cents,total_cents\r\n"
                             b"9,199,1808\r\n7,199,1410\r\n")
            self.assertEqual(list(Path(directory).iterdir()), [source])
            for quantities in ("7,6", "7,07", "7,", "", "7,=1+1"):
                with self.subTest(quantities=quantities):
                    invalid = self.run_cli("--provider-path", directory, "--quantities",
                                           quantities, "--format", "csv")
                    self.assertEqual(invalid.returncode, 2)
                    self.assertEqual(invalid.stdout, "")
                    self.assertIn("error:", invalid.stderr)
                    self.assertNotIn("Traceback", invalid.stderr)


if __name__ == "__main__":
    unittest.main()
