"""Real HTTP coverage of the workshop-card screens and provider injection."""
import http.client
from contextlib import contextmanager
from html.parser import HTMLParser
from pathlib import Path
import tempfile
import sys
import threading
import unittest
from urllib.parse import quote

# Provider modules live outside this module; tests must not create bytecode there.
sys.dont_write_bytecode = True

import app


class WebTests(unittest.TestCase):
    def setUp(self):
        self.server = app.create_server(
            "127.0.0.1", 0, Path(__file__).resolve().parent.parent / "provider"
        )
        self.thread = threading.Thread(target=self.server.serve_forever)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def get(self, path):
        connection = http.client.HTTPConnection(*self.server.server_address, timeout=5)
        try:
            connection.request("GET", path)
            response = connection.getresponse()
            return response.status, response.getheader("Content-Type"), response.read().decode("utf-8")
        finally:
            connection.close()

    def test_form(self):
        status, content_type, body = self.get("/")
        self.assertEqual(status, 200)
        self.assertEqual(content_type, "text/html; charset=utf-8")
        for text in ('<title>Workshop card quote</title>', '<h1>Workshop card quote</h1>',
                     '<label for="quantity">Quantity</label>', 'name="quantity"',
                     'min="1" max="50" value="1"', '$2.75', '1–50',
                     'action="/quote" method="get"', '>Get quote</button>'):
            self.assertIn(text, body)
        self.assertNotIn('id="quote-result"', body)

    def test_result_and_refresh(self):
        for _ in range(2):
            status, _, body = self.get('/quote?quantity=12')
            self.assertEqual(status, 200)
            for text in ('id="quote-result"', 'Your quote', 'Quantity: 12', '$2.75',
                         '$33.00', 'value="12"', 'href="/">Start again'):
                self.assertIn(text, body)
            self.assertNotIn('role="alert"', body)

    def test_validation(self):
        for query in ('', 'quantity=0', 'quantity=51', 'quantity=', 'quantity=1&quantity=2',
                      'quantity=1.0', 'quantity=1e1', 'quantity=%2B1', 'quantity=-1',
                      'quantity=' + quote('１２'), 'quantity=' + quote('<script>"&')):
            with self.subTest(query=query):
                status, _, body = self.get('/quote?' + query)
                self.assertEqual(status, 400)
                self.assertIn('role="alert">Enter a whole quantity from 1 to 50.', body)
                self.assertNotIn('id="quote-result"', body)
                self.assertNotIn('<script>', body)
        self.assertEqual(self.get('/quote?quantity=%2012%20')[0], 200)

    def test_rejected_text_is_retained(self):
        status, _, body = self.get('/quote?quantity=abc')
        self.assertEqual(status, 400)
        self.assertIn('value="abc"', body)
        self.assertIn('role="alert"', body)
        self.assertNotIn('id="quote-result"', body)

    def test_rejected_html_is_retained_and_escaped(self):
        rejected = '\"><img src=x onerror=alert(1)>&'
        status, _, body = self.get('/quote?quantity=' + quote(rejected))
        self.assertEqual(status, 400)
        self.assertIn('value="&quot;&gt;&lt;img src=x onerror=alert(1)&gt;&amp;"', body)
        self.assertNotIn('<img', body)
        self.assertNotIn('id="quote-result"', body)

    def test_text_input_supports_editing_rejected_text(self):
        for path in ('/', '/quote?quantity=abc'):
            with self.subTest(path=path):
                _, _, body = self.get(path)
                self.assertIn('type="text"', body)
                self.assertIn('inputmode="numeric"', body)
                self.assertNotIn('type="number"', body)

    def test_valid_request_clears_validation_error(self):
        self.assertEqual(self.get('/quote?quantity=abc')[0], 400)
        status, _, body = self.get('/quote?quantity=12')
        self.assertEqual(status, 200)
        self.assertIn('value="12"', body)
        self.assertIn('$33.00', body)
        self.assertIn('id="quote-result"', body)
        self.assertNotIn('role="alert"', body)
        self.assertNotIn('value="abc"', body)

    def test_provider_upper_bound(self):
        status, _, body = self.get('/quote?quantity=50')
        self.assertEqual(status, 200)
        self.assertIn('Quantity: 50', body)
        self.assertIn('$137.50', body)
        self.assertEqual(self.get('/quote?quantity=51')[0], 400)

    def test_rejected_whitespace_and_empty_are_retained(self):
        for rejected in (' abc ', ''):
            with self.subTest(rejected=rejected):
                status, _, body = self.get('/quote?quantity=' + quote(rejected))
                self.assertEqual(status, 400)
                self.assertIn('value="' + rejected + '"', body)
                self.assertNotIn('id="quote-result"', body)

    def test_not_found(self):
        status, _, body = self.get('/missing')
        self.assertEqual(status, 404)
        self.assertIn('Not found', body)
        self.assertIn('href="/"', body)
        self.assertNotIn('Traceback', body)

    def test_loopback_only(self):
        for host in ('0.0.0.0', 'example.com', '192.168.1.1'):
            with self.assertRaises(ValueError):
                app.create_server(host, 0, '.')

    @contextmanager
    def injected_minimum(self, minimum):
        """Serve the unchanged app against an independent provider contract."""
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, 'quote_provider.py').write_text(
                f'MIN_QUANTITY = {minimum}\nMAX_QUANTITY = 50\nUNIT_PRICE_CENTS = 275\n'
                'def price_for(quantity):\n'
                '    if type(quantity) is not int or not MIN_QUANTITY <= quantity <= MAX_QUANTITY: raise ValueError()\n'
                '    return quantity * UNIT_PRICE_CENTS\n', encoding='utf-8')
            other = app.create_server('127.0.0.1', 0, directory)
            thread = threading.Thread(target=other.serve_forever)
            thread.start()
            original = self.server
            self.server = other
            try:
                yield
            finally:
                self.server = original
                other.shutdown()
                other.server_close()
                thread.join()

    def quantity_field(self, body):
        class FormParser(HTMLParser):
            def __init__(self):
                super().__init__()
                self.quantity = []
            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                if tag == 'input' and attrs.get('name') == 'quantity':
                    self.quantity.append(attrs)
        parser = FormParser()
        parser.feed(body)
        self.assertEqual(len(parser.quantity), 1)
        return parser.quantity[0]

    def test_injected_minimum_is_fresh_form_default(self):
        for minimum in (2, 7):
            with self.subTest(minimum=minimum), self.injected_minimum(minimum):
                status, _, body = self.get('/')
                self.assertEqual(status, 200)
                field = self.quantity_field(body)
                self.assertEqual(field['min'], str(minimum))
                self.assertEqual(field['value'], str(minimum))
                self.assertNotIn('role="alert"', body)

    def test_injected_minimum_is_start_again_default(self):
        for minimum in (2, 7):
            with self.subTest(minimum=minimum), self.injected_minimum(minimum):
                status, _, quote_body = self.get('/quote?quantity=' + str(minimum))
                self.assertEqual(status, 200)
                self.assertIn('href="/">Start again', quote_body)
                status, _, fresh_body = self.get('/')
                self.assertEqual(status, 200)
                self.assertEqual(self.quantity_field(fresh_body)['value'], str(minimum))
                self.assertNotIn('id="quote-result"', fresh_body)

    def test_injected_revised_provider_and_escaping(self):
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, 'quote_provider.py').write_text(
                'MIN_QUANTITY = 1\nMAX_QUANTITY = 50\nUNIT_PRICE_CENTS = 275\n'
                'def price_for(quantity):\n'
                '    if not 1 <= quantity <= 50: raise ValueError()\n'
                '    return quantity * UNIT_PRICE_CENTS\n', encoding='utf-8')
            other = app.create_server('127.0.0.1', 0, directory)
            thread = threading.Thread(target=other.serve_forever)
            thread.start()
            original = self.server
            self.server = other
            try:
                _, _, form = self.get('/')
                self.assertIn('$2.75', form)
                self.assertIn('min="1" max="50"', form)
                self.assertIn('1–50', form)
                status, _, body = self.get('/quote?quantity=12')
                self.assertEqual(status, 200)
                self.assertIn('$33.00', body)
                status, _, body = self.get('/quote?quantity=51')
                self.assertEqual(status, 400)
                self.assertIn('from 1 to 50.', body)
                self.assertNotIn('id="quote-result"', body)
                status, _, body = self.get('/quote?quantity=' + quote('\"><img src=x onerror=alert(1)>'))
                self.assertEqual(status, 400)
                self.assertNotIn('<img', body)
            finally:
                self.server = original
                other.shutdown()
                other.server_close()
                thread.join()


if __name__ == '__main__':
    unittest.main()
