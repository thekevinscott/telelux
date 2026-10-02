import asyncio
from unittest.mock import MagicMock

import pytest

from .ViewerApp import ViewerApp


@pytest.fixture
def page():
    return MagicMock(return_value="<html>café</html>")


def call(app, scope, messages=()):
    inbox = list(messages)
    sent = []

    async def receive():
        return inbox.pop(0)

    async def send(message):
        sent.append(message)

    asyncio.run(app(scope, receive, send))
    return sent


def http(path="/", method="GET"):
    return {"type": "http", "method": method, "path": path}


def describe_ViewerApp():
    def describe_the_root_page():
        def test_it_serves_the_page_as_utf8_html(page):
            body = "<html>café</html>".encode()
            assert call(ViewerApp(page), http()) == [
                {
                    "type": "http.response.start",
                    "status": 200,
                    "headers": [
                        (b"content-type", b"text/html; charset=utf-8"),
                        (b"content-length", str(len(body)).encode()),
                        (b"cache-control", b"no-store"),
                    ],
                },
                {"type": "http.response.body", "body": body},
            ]

        def test_it_builds_the_page_on_every_request(page):
            page.side_effect = ["first", "second"]
            app = ViewerApp(page)
            assert call(app, http())[1]["body"] == b"first"
            assert call(app, http())[1]["body"] == b"second"

        def test_it_answers_head_without_a_body(page):
            sent = call(ViewerApp(page), http(method="HEAD"))
            assert sent[0]["status"] == 200
            assert (b"content-length", b"18") in sent[0]["headers"]
            assert sent[1] == {"type": "http.response.body", "body": b""}

    def test_it_refuses_other_methods(page):
        sent = call(ViewerApp(page), http(method="POST"))
        assert sent[0] == {
            "type": "http.response.start",
            "status": 405,
            "headers": [
                (b"content-type", b"text/plain; charset=utf-8"),
                (b"content-length", b"18"),
                (b"cache-control", b"no-store"),
                (b"allow", b"GET, HEAD"),
            ],
        }
        assert sent[1] == {"type": "http.response.body", "body": b"Method Not Allowed"}
        page.assert_not_called()

    @pytest.mark.parametrize("path", ["/viewer.html", "/favicon.ico", "//"])
    def test_it_has_nothing_else(page, path):
        sent = call(ViewerApp(page), http(path=path))
        assert sent[0] == {
            "type": "http.response.start",
            "status": 404,
            "headers": [
                (b"content-type", b"text/plain; charset=utf-8"),
                (b"content-length", b"9"),
                (b"cache-control", b"no-store"),
            ],
        }
        assert sent[1] == {"type": "http.response.body", "body": b"Not Found"}
        page.assert_not_called()

    def test_it_completes_the_lifespan_protocol(page):
        sent = call(
            ViewerApp(page),
            {"type": "lifespan"},
            [{"type": "lifespan.startup"}, {"type": "lifespan.shutdown"}],
        )
        assert sent == [
            {"type": "lifespan.startup.complete"},
            {"type": "lifespan.shutdown.complete"},
        ]

    def test_it_ignores_other_connections(page):
        assert call(ViewerApp(page), {"type": "websocket"}) == []
