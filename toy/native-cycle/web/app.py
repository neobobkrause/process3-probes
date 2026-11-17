"""Loopback-only workshop-card quote HTTP application."""
import argparse
import html
import importlib.util
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit, urlencode


def dollars(cents):
    return f"${cents // 100}.{cents % 100:02d}"


def create_server(host, port, provider_path, report_path=None):
    """Create a server using only quote_provider.py in the supplied directory."""
    if host not in ("127.0.0.1", "localhost", "::1"):
        raise ValueError("host must be a loopback address")
    spec = importlib.util.spec_from_file_location(
        "quote_provider", Path(provider_path).resolve() / "quote_provider.py"
    )
    provider = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(provider)

    # Loading the optional comparison dependency lazily keeps the existing
    # single-quote API usable independently of report installation.
    report_file = (Path(report_path) if report_path is not None else
                   Path(__file__).resolve().parent.parent / "report") / "quote_report.py"
    report = None

    def comparison_report():
        nonlocal report
        if report is None:
            report_spec = importlib.util.spec_from_file_location("quote_report", report_file)
            module = importlib.util.module_from_spec(report_spec)
            # Compile trusted injected source directly: importing a sibling module
            # must not create bytecode outside the web module's ownership.
            exec(compile(report_file.read_bytes(), str(report_file), "exec"), module.__dict__)
            report = module
        return report

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, format, *args):
            pass

        def send_html(self, status, body):
            data = body.encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def page(self, quantity=None, error=None, total=None):
            esc = lambda value: html.escape(str(value), quote=True)
            low, high = provider.MIN_QUANTITY, provider.MAX_QUANTITY
            if quantity is None:
                quantity = low
            unit = esc(dollars(provider.UNIT_PRICE_CENTS))
            body = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
                    '<title>Workshop card quote</title></head><body>'
                    '<h1>Workshop card quote</h1>'
                    f'<p>Unit price: {unit}. Allowed range: {esc(low)}–{esc(high)}.</p>')
            if error:
                body += f'<p role="alert">{esc(error)}</p>'
            body += ('<form action="/quote" method="get">'
                     '<label for="quantity">Quantity</label>'
                     f'<input id="quantity" name="quantity" type="text" inputmode="numeric" '
                     f'min="{esc(low)}" max="{esc(high)}" value="{esc(quantity)}">'
                     '<button type="submit">Get quote</button></form>')
            if total is not None:
                body += ('<section id="quote-result"><h2>Your quote</h2>'
                         f'<p>Quantity: {esc(quantity)}</p><p>Unit price: {unit}</p>'
                         f'<p>Total: {esc(dollars(total))}</p></section>'
                         '<a href="/">Start again</a>')
            body += '<p><a href="/compare">Compare quantities</a></p>'
            return body + '</body></html>'

        def comparison_page(self, submitted=None, error=None, model=None):
            esc = lambda value: html.escape(str(value), quote=True)
            low, high = provider.MIN_QUANTITY, provider.MAX_QUANTITY
            if submitted is None:
                examples = dict.fromkeys(max(low, min(high, n)) for n in (2, 12, 50))
                submitted = ",".join(str(n) for n in examples)
            body = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
                    '<title>Compare workshop card quotes</title></head><body>'
                    '<h1>Compare workshop card quotes</h1>'
                    '<p>Each row is a separate alternative, not a combined order.</p>'
                    f'<p>Unit price: {esc(dollars(provider.UNIT_PRICE_CENTS))}. '
                    f'Allowed range: {esc(low)}–{esc(high)}.</p>'
                    '<p><a href="/">Single quote</a></p>')
            if error:
                body += f'<p role="alert">{esc(error)}</p>'
            # HTML discards the first newline after a textarea start tag. A
            # deliberate initial newline preserves even rejected leading LF text.
            body += ('<form action="/compare" method="get">'
                     '<label for="quantities">Quantities to compare</label>'
                     f'<p id="quantities-help">Enter 1–8 distinct whole quantities from {esc(low)} '
                     f'to {esc(high)}, separated by commas or newlines.</p>'
                     '<textarea id="quantities" name="quantities" '
                     f'aria-describedby="quantities-help" rows="4">\n{esc(submitted)}</textarea>'
                     '<button type="submit">Compare quotes</button></form>')
            if model is not None:
                body += ('<table id="comparison-result"><caption>Quote alternatives</caption>'
                         '<thead><tr><th scope="col">Quantity</th><th scope="col">Unit price</th>'
                         '<th scope="col">Total for this option</th></tr></thead><tbody>')
                for row in model['rows']:
                    body += (f'<tr><td>{esc(row["quantity"])}</td>'
                             f'<td>{esc(dollars(model["unit_price_cents"]))}</td>'
                             f'<td>{esc(dollars(row["total_cents"]))}</td></tr>')
                download = '/compare.csv?' + urlencode({'quantities': submitted})
                body += ('</tbody></table>'
                         f'<p><a href="{esc(download)}">Download CSV</a></p>'
                         '<p><a href="/compare">Fresh comparison</a></p>')
            return body + '</body></html>'

        def compare(self, route):
            if route.path == '/compare' and '?' not in self.path:
                self.send_html(200, self.comparison_page())
                return
            params = parse_qs(route.query, keep_blank_values=True)
            values = params.get('quantities', [])
            submitted = values[0] if values else ''
            try:
                if len(values) != 1:
                    raise ValueError
                tokens = re.split(r'[,\n]', submitted)
                if not 1 <= len(tokens) <= 8:
                    raise ValueError
                quantities = []
                for token in tokens:
                    token = token.strip()
                    if not token or any(c not in '0123456789' for c in token):
                        raise ValueError
                    quantities.append(int(token))
                if len(set(quantities)) != len(quantities):
                    raise ValueError
                report_module = comparison_report()
                model = report_module.build_comparison(provider, quantities)
                if route.path == '/compare.csv':
                    data = report_module.to_csv(model).encode('utf-8')
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/csv; charset=utf-8')
                    self.send_header('Content-Disposition', 'attachment; filename=quote-comparison.csv')
                    self.send_header('Content-Length', str(len(data)))
                    self.end_headers()
                    self.wfile.write(data)
                    return
            except ValueError:
                self.send_html(400, self.comparison_page(submitted, error=(
                    f'Enter 1–8 distinct whole quantities from {provider.MIN_QUANTITY} '
                    f'to {provider.MAX_QUANTITY}, separated by commas or newlines; '
                    'do not include empty entries.')))
                return
            except (OSError, ImportError, AttributeError):
                self.send_html(503, self.comparison_page(submitted, error=(
                    'Comparison is temporarily unavailable. You can still request a single quote.')))
                return
            self.send_html(200, self.comparison_page(submitted, model=model))

        def do_GET(self):
            route = urlsplit(self.path)
            if route.path in ("/compare", "/compare.csv"):
                self.compare(route)
            elif route.path == "/":
                self.send_html(200, self.page())
            elif route.path == "/quote":
                params = parse_qs(route.query, keep_blank_values=True)
                values = params.get("quantity", [])
                submitted = values[0] if values else ""
                try:
                    if len(values) != 1:
                        raise ValueError
                    value = values[0].strip()
                    if not value or any(char not in "0123456789" for char in value):
                        raise ValueError
                    quantity = int(value)
                    total = provider.price_for(quantity)
                except ValueError:
                    self.send_html(400, self.page(quantity=submitted, error=(
                        f"Enter a whole quantity from {provider.MIN_QUANTITY} "
                        f"to {provider.MAX_QUANTITY}.")))
                else:
                    self.send_html(200, self.page(quantity, total=total))
            else:
                self.send_html(404, '<!doctype html><html lang="en"><body>'
                               '<h1>Not found</h1><a href="/">Start again</a></body></html>')

    # Bind localhost explicitly to IPv4; IPv6 uses an appropriate server family.
    if host == "::1":
        import socket

        class IPv6Server(ThreadingHTTPServer):
            address_family = socket.AF_INET6

        return IPv6Server((host, port), Handler)
    return ThreadingHTTPServer(("127.0.0.1" if host == "localhost" else host, port), Handler)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--provider-path", required=True)
    parser.add_argument("--report-path", help="Directory containing quote_report.py; defaults to sibling report")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    server = create_server(args.host, args.port, args.provider_path, args.report_path)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
