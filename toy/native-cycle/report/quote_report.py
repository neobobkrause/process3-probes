"""Provider-injected comparisons of alternative workshop-card quantities."""
import argparse
import importlib.util
import json
from pathlib import Path
import re
import sys


def build_comparison(provider, quantities):
    """Return ordered alternatives in integer cents, or raise ValueError.

    Validate the entire shortlist before calling the provider. Alternatives are
    separate possible orders, so this model deliberately has no aggregate total.
    """
    if not isinstance(quantities, (list, tuple)) or not 1 <= len(quantities) <= 8:
        raise ValueError("choose between 1 and 8 distinct quantities")
    low, high, unit = (provider.MIN_QUANTITY, provider.MAX_QUANTITY,
                       provider.UNIT_PRICE_CENTS)
    if (any(type(value) is not int for value in (low, high, unit))
            or low > high or unit < 0):
        raise ValueError("provider must supply integer bounds and nonnegative cents")
    if any(not isinstance(quantity, int) or isinstance(quantity, bool)
           or not low <= quantity <= high for quantity in quantities):
        raise ValueError(f"quantities must be whole integers from {low} to {high}")
    if len(set(quantities)) != len(quantities):
        raise ValueError("choose distinct quantities")
    rows = []
    for quantity in quantities:
        total = provider.price_for(quantity)
        if type(total) is not int or total < 0:
            raise ValueError("provider must return nonnegative integer cents")
        rows.append({"quantity": quantity, "total_cents": total})
    return {"min_quantity": low, "max_quantity": high,
            "unit_price_cents": unit, "rows": rows}


def parse_quantities(text):
    """Parse the shared comma/newline ASCII integer grammar without partial rows."""
    if not isinstance(text, str):
        raise ValueError("quantities must be comma or newline separated text")
    tokens = re.split(r"[,\n]", text)
    if not 1 <= len(tokens) <= 8:
        raise ValueError("choose between 1 and 8 distinct quantities")
    values = []
    for token in tokens:
        token = token.strip()
        if not token or any(character not in "0123456789" for character in token):
            raise ValueError("use comma or newline separated unsigned ASCII integers")
        values.append(int(token))
    if len(set(values)) != len(values):
        raise ValueError("choose distinct quantities")
    return values


def _load_provider(directory):
    source = Path(directory).resolve() / "quote_provider.py"
    spec = importlib.util.spec_from_file_location("comparison_quote_provider", source)
    module = importlib.util.module_from_spec(spec)
    previous = sys.dont_write_bytecode
    try:
        sys.dont_write_bytecode = True
        spec.loader.exec_module(module)
    finally:
        sys.dont_write_bytecode = previous
    return module


def _money(cents):
    return f"${cents // 100}.{cents % 100:02d}"


def to_text(comparison):
    """Render readable alternatives, keeping totals attached to their own rows."""
    lines = ["Workshop card quantity alternatives (not a combined order)",
             f"Allowed range: {comparison['min_quantity']} to {comparison['max_quantity']}",
             "Quantity | Unit price | Total"]
    for row in comparison["rows"]:
        lines.append(f"{row['quantity']} | {_money(comparison['unit_price_cents'])} | "
                     f"{_money(row['total_cents'])}")
    return "\n".join(lines) + "\n"


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--provider-path", required=True)
    parser.add_argument("--quantities", required=True,
                        help="1–8 distinct quantities separated by commas or newlines")
    parser.add_argument("--format", choices=("text", "json"), default="text")
    args = parser.parse_args(argv)
    try:
        quantities = parse_quantities(args.quantities)
        provider = _load_provider(args.provider_path)
        model = build_comparison(provider, quantities)
    except (ValueError, OSError, ImportError, AttributeError) as error:
        parser.error(str(error))
    if args.format == "json":
        print(json.dumps(model))
    else:
        print(to_text(model), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
