"""Loopback-only workshop-card quote HTTP application."""
import argparse
import html
import importlib.util
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


def dollars(cents):
    return f"${cents // 100}.{cents % 100:02d}"


def create_server(host, port, provider_path):
    """Create a server using only quote_provider.py in the supplied directory."""
    if host not in ("127.0.0.1", "localhost", "::1"):
        raise ValueError("host must be a loopback address")
    spec = importlib.util.spec_from_file_location(
        "quote_provider", Path(provider_path).resolve() / "quote_provider.py"
    )
    provider = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(provider)

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

        def page(self, quantity=1, error=None, total=None):
            esc = lambda value: html.escape(str(value), quote=True)
            low, high = provider.MIN_QUANTITY, provider.MAX_QUANTITY
            unit = esc(dollars(provider.UNIT_PRICE_CENTS))
            body = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
                    '<title>Workshop card quote</title></head><body>'
                    '<h1>Workshop card quote</h1>'
                    f'<p>Unit price: {unit}. Allowed range: {esc(low)}–{esc(high)}.</p>')
            if error:
                body += f'<p role="alert">{esc(error)}</p>'
            body += ('<form action="/quote" method="get">'
                     '<label for="quantity">Quantity</label>'
                     f'<input id="quantity" name="quantity" type="number" '
                     f'min="{esc(low)}" max="{esc(high)}" value="{esc(quantity)}">'
                     '<button type="submit">Get quote</button></form>')
            if total is not None:
                body += ('<section id="quote-result"><h2>Your quote</h2>'
                         f'<p>Quantity: {esc(quantity)}</p><p>Unit price: {unit}</p>'
                         f'<p>Total: {esc(dollars(total))}</p></section>'
                         '<a href="/">Start again</a>')
            return body + '</body></html>'

        def do_GET(self):
            route = urlsplit(self.path)
            if route.path == "/":
                self.send_html(200, self.page())
            elif route.path == "/quote":
                params = parse_qs(route.query, keep_blank_values=True)
                values = params.get("quantity", [])
                try:
                    if len(values) != 1:
                        raise ValueError
                    value = values[0].strip()
                    if not value or any(char not in "0123456789" for char in value):
                        raise ValueError
                    quantity = int(value)
                    total = provider.price_for(quantity)
                except ValueError:
                    self.send_html(400, self.page(error=(
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
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    server = create_server(args.host, args.port, args.provider_path)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
