"""Actual HTTP tests of comparison presentation with independently injected APIs."""
import csv
from contextlib import contextmanager
from html.parser import HTMLParser
import http.client
import io
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from urllib.parse import parse_qs, quote, urlencode, urlsplit

sys.dont_write_bytecode = True
import app


REPORT_STUB = '''import csv
import io
from pathlib import Path
TRACE = Path(__file__).with_name('calls.jsonl')
def build_comparison(provider, quantities):
    with TRACE.open('a') as trace: trace.write('build:' + repr(quantities) + '\\n')
    if any(not provider.MIN_QUANTITY <= q <= provider.MAX_QUANTITY for q in quantities):
        raise ValueError('bounds')
    return dict(min_quantity=provider.MIN_QUANTITY, max_quantity=provider.MAX_QUANTITY,
                unit_price_cents=provider.UNIT_PRICE_CENTS,
                rows=[dict(quantity=q, total_cents=provider.price_for(q)) for q in quantities])
def to_csv(model):
    with TRACE.open('a') as trace: trace.write('csv\\n')
    stream = io.StringIO(newline='')
    writer = csv.writer(stream, lineterminator='\\r\\n')
    writer.writerow(['quantity', 'unit_price_cents', 'total_cents'])
    for row in model['rows']:
        writer.writerow([row['quantity'], model['unit_price_cents'], row['total_cents']])
    return stream.getvalue()
'''


class Page(HTMLParser):
    def __init__(self, body):
        super().__init__(convert_charrefs=True)
        self.textarea = ''
        self.links = []
        self.headers = []
        self.cells = []
        self.tags = []
        self._textarea = False
        self._textarea_initial = False
        self._cell = None
        self.feed(body)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append(tag)
        if tag == 'textarea' and attrs.get('name') == 'quantities':
            self._textarea = True
            self._textarea_initial = True
        if tag == 'a':
            self.links.append(attrs.get('href'))
        if tag in ('th', 'td'):
            self._cell = tag

    def handle_endtag(self, tag):
        if tag == 'textarea':
            self._textarea = False
        if tag in ('th', 'td'):
            self._cell = None

    def handle_data(self, data):
        if self._textarea:
            if self._textarea_initial and data.startswith("\n"):
                data = data[1:]  # Match the HTML textarea initial-newline rule.
            self._textarea_initial = False
            self.textarea += data
        if self._cell == 'th':
            self.headers.append(data)
        elif self._cell == 'td':
            self.cells.append(data)


class ComparisonTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory()
        cls.root = Path(cls.temporary.name)
        cls.report = cls.root / 'report'
        cls.report.mkdir()
        (cls.report / 'quote_report.py').write_text(REPORT_STUB, encoding='utf-8')
        cls.provider = Path(__file__).resolve().parent.parent / 'provider'
        cls.server = app.create_server('127.0.0.1', 0, cls.provider, cls.report)
        cls.thread = threading.Thread(target=cls.server.serve_forever)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        cls.temporary.cleanup()

    def get(self, path, server=None):
        server = server or self.server
        connection = http.client.HTTPConnection(*server.server_address, timeout=5)
        try:
            connection.request('GET', path)
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read()
        finally:
            connection.close()

    def submitted(self, value, csv_route=False, server=None):
        route = '/compare.csv' if csv_route else '/compare'
        return self.get(route + '?' + urlencode({'quantities': value}), server)

    def test_navigation_and_fresh_comparison(self):
        self.assertIn('/compare', Page(self.get('/')[2].decode()).links)
        status, headers, data = self.get('/compare')
        body = data.decode()
        page = Page(body)
        self.assertEqual(status, 200)
        self.assertEqual(headers['Content-Type'], 'text/html; charset=utf-8')
        self.assertEqual(page.textarea, '2,12,50')
        for text in ('Compare workshop card quotes', 'separate alternative', '2–50',
                     '$2.75', '<label for="quantities">', 'aria-describedby="quantities-help"',
                     '1–8 distinct', 'commas or newlines', '>Compare quotes</button>'):
            self.assertIn(text, body)
        self.assertIn('/', page.links)
        self.assertNotIn('role="alert"', body)
        self.assertNotIn('id="comparison-result"', body)

    def test_ordered_rows_download_link_and_refresh(self):
        raw = '50, 2\n12'
        for _ in range(2):
            status, _, data = self.submitted(raw)
            body = data.decode()
            page = Page(body)
            self.assertEqual(status, 200)
            self.assertEqual(page.textarea, raw)
            self.assertEqual(page.headers, ['Quantity', 'Unit price', 'Total for this option'])
            self.assertEqual(page.cells, ['50', '$2.75', '$137.50', '2', '$2.75', '$5.50', '12', '$2.75', '$33.00'])
            self.assertIn('<caption>Quote alternatives</caption>', body)
            self.assertNotIn('role="alert"', body)
            self.assertNotIn('Grand total', body)
            self.assertIn('/compare', page.links)
            download = next(link for link in page.links if link.startswith('/compare.csv?'))
            self.assertEqual(parse_qs(urlsplit(download).query), {'quantities': [raw]})
            self.assertEqual(self.get(download)[0], 200)

    def test_singleton_eight_options_and_normalized_leading_zeros(self):
        for raw, expected in [('2', ['2']), (' 02 ,12\r\n50 ', ['2', '12', '50']),
                              (','.join(str(n) for n in range(2, 10)), [str(n) for n in range(2, 10)])]:
            with self.subTest(raw=raw):
                status, _, data = self.submitted(raw)
                self.assertEqual(status, 200)
                self.assertEqual(Page(data.decode()).cells[::3], expected)

    def assert_rejected(self, raw, csv_route=False):
        status, headers, data = self.submitted(raw, csv_route)
        body = data.decode()
        self.assertEqual(status, 400)
        self.assertEqual(headers['Content-Type'], 'text/html; charset=utf-8')
        self.assertNotIn('Content-Disposition', headers)
        self.assertEqual(Page(body).textarea, raw)
        self.assertIn('role="alert"', body)
        self.assertIn('from 2 to 50', body)
        self.assertNotIn('id="comparison-result"', body)
        self.assertFalse(any(link.startswith('/compare.csv?') for link in Page(body).links))

    def test_invalid_batches_are_atomic_retained_and_actionable(self):
        values = ['', ' ', '2,1', '2,51', '2,02', '2,', '2\n', '2,,12', '\n2',
                  ','.join(str(n) for n in range(2, 11)), '+2', '-2', '2.0', '2e1',
                  '２', 'abc', '\n', '\nabc', '\n\n2,', '2,abc', '2;12', ' 2, 51 ']
        for raw in values:
            with self.subTest(raw=raw):
                self.assert_rejected(raw)

    def test_html_payload_is_literal_text_not_markup(self):
        raw = '</textarea><script>window.__comparisonInjected=1</script><img src=x onerror=alert(1)>&"'
        for csv_route in (False, True):
            with self.subTest(csv_route=csv_route):
                self.assert_rejected(raw, csv_route)
                body = self.submitted(raw, csv_route)[2].decode()
                self.assertNotIn('script', Page(body).tags)
                self.assertNotIn('img', Page(body).tags)
                self.assertIn('&lt;/textarea&gt;', body)

    def test_missing_and_duplicate_parameters(self):
        for path in ('/compare?', '/compare?other=x', '/compare?quantities=2&quantities=12',
                     '/compare.csv', '/compare.csv?', '/compare.csv?other=x',
                     '/compare.csv?quantities=2&quantities=12'):
            with self.subTest(path=path):
                status, headers, data = self.get(path)
                self.assertEqual(status, 400)
                self.assertNotIn('Content-Disposition', headers)
                self.assertEqual(Page(data.decode()).textarea, '2' if 'quantities=2' in path else '')

    def test_csv_exact_bytes_headers_order_and_roundtrip(self):
        status, headers, data = self.submitted('50, 2\n12', True)
        self.assertEqual(status, 200)
        self.assertEqual(headers['Content-Type'], 'text/csv; charset=utf-8')
        self.assertEqual(headers['Content-Disposition'], 'attachment; filename=quote-comparison.csv')
        self.assertEqual(int(headers['Content-Length']), len(data))
        self.assertEqual(data, b'quantity,unit_price_cents,total_cents\r\n50,275,13750\r\n2,275,550\r\n12,275,3300\r\n')
        self.assertEqual(list(csv.DictReader(io.StringIO(data.decode()))), [
            {'quantity': '50', 'unit_price_cents': '275', 'total_cents': '13750'},
            {'quantity': '2', 'unit_price_cents': '275', 'total_cents': '550'},
            {'quantity': '12', 'unit_price_cents': '275', 'total_cents': '3300'}])
        trace = (self.report / 'calls.jsonl').read_text()
        self.assertIn('build:[50, 2, 12]', trace)
        self.assertIn('csv\n', trace)

    def test_invalid_csv_is_html_and_no_attachment(self):
        for raw in ('', '2,1', '2,02', '2,', '=SUM(1,2)'):
            with self.subTest(raw=raw):
                self.assert_rejected(raw, True)

    def test_valid_recovery_and_single_quote_preserved(self):
        self.assert_rejected('2,1')
        status, _, data = self.submitted('2,12')
        self.assertEqual(status, 200)
        self.assertNotIn('role="alert"', data.decode())
        self.assertIn('$5.50', data.decode())
        self.assertEqual(self.get('/')[0], 200)
        self.assertIn('value="2"', self.get('/')[2].decode())
        self.assertEqual(self.get('/quote?quantity=1')[0], 400)
        self.assertEqual(self.get('/quote?quantity=12')[0], 200)
        self.assertIn('$33.00', self.get('/quote?quantity=12')[2].decode())
        self.assertEqual(self.get('/missing')[0], 404)

    @contextmanager
    def injected(self, low, high, unit=301):
        with tempfile.TemporaryDirectory() as directory:
            provider = Path(directory)
            (provider / 'quote_provider.py').write_text(
                f'MIN_QUANTITY={low}\nMAX_QUANTITY={high}\nUNIT_PRICE_CENTS={unit}\n'
                'def price_for(q):\n'
                '    if type(q) is not int or not MIN_QUANTITY<=q<=MAX_QUANTITY: raise ValueError()\n'
                '    return q*UNIT_PRICE_CENTS\n', encoding='utf-8')
            server = app.create_server('127.0.0.1', 0, provider, self.report)
            thread = threading.Thread(target=server.serve_forever)
            thread.start()
            try:
                yield server, provider
            finally:
                server.shutdown()
                server.server_close()
                thread.join()

    def test_changed_provider_bounds_defaults_prices_and_report_injection(self):
        for low, high, defaults in [(7, 9, '7,9'), (51, 53, '51'), (8, 8, '8')]:
            with self.subTest(low=low, high=high), self.injected(low, high) as (server, provider):
                status, _, data = self.get('/compare', server)
                self.assertEqual(status, 200)
                self.assertEqual(Page(data.decode()).textarea, defaults)
                self.assertIn(f'{low}–{high}', data.decode())
                status, _, data = self.submitted(str(low), server=server)
                self.assertEqual(status, 200)
                self.assertIn(app.dollars(low * 301), data.decode())
                self.assertEqual(self.submitted(str(low - 1), server=server)[0], 400)
                self.assertFalse(list(provider.rglob('*.pyc')))
        self.assertFalse(list(self.report.rglob('*.pyc')))

    def test_missing_report_does_not_break_single_quote(self):
        with tempfile.TemporaryDirectory() as directory:
            server = app.create_server('127.0.0.1', 0, self.provider, directory)
            thread = threading.Thread(target=server.serve_forever)
            thread.start()
            try:
                self.assertEqual(self.get('/', server)[0], 200)
                self.assertEqual(self.get('/quote?quantity=2', server)[0], 200)
                status, _, data = self.submitted('2,12', server=server)
                self.assertEqual(status, 503)
                self.assertIn('temporarily unavailable', data.decode())
                self.assertNotIn('Traceback', data.decode())
            finally:
                server.shutdown()
                server.server_close()
                thread.join()

    @unittest.skipUnless((Path(__file__).resolve().parent.parent / 'report/quote_report.py').exists(),
                         'Actual sibling report is integrated by ARCH after independent module work')
    def test_actual_integrated_report_default_path(self):
        server = app.create_server('127.0.0.1', 0, self.provider)
        thread = threading.Thread(target=server.serve_forever)
        thread.start()
        try:
            status, _, data = self.submitted('2,12,50', server=server)
            self.assertEqual(status, 200)
            self.assertEqual(Page(data.decode()).cells[::3], ['2', '12', '50'])
            status, _, data = self.submitted('2,12,50', True, server)
            self.assertEqual(status, 200)
            self.assertEqual(data, b'quantity,unit_price_cents,total_cents\r\n2,275,550\r\n12,275,3300\r\n50,275,13750\r\n')
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == '__main__':
    unittest.main()
