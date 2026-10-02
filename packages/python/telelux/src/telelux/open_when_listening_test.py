from unittest.mock import call, patch

import pytest

from .open_when_listening import open_when_listening


@pytest.fixture
def create_connection():
    with patch("telelux.open_when_listening.socket.create_connection") as connect:
        yield connect


@pytest.fixture
def sleep():
    with patch("telelux.open_when_listening.time.sleep") as sleep:
        yield sleep


@pytest.fixture
def webbrowser():
    with patch("telelux.open_when_listening.webbrowser") as webbrowser:
        yield webbrowser


def describe_open_when_listening():
    def test_it_opens_the_page_once_the_port_accepts(
        create_connection, sleep, webbrowser
    ):
        open_when_listening("127.0.0.1", 8000)
        create_connection.assert_called_once_with(("127.0.0.1", 8000), timeout=1)
        create_connection.return_value.close.assert_called_once_with()
        sleep.assert_not_called()
        webbrowser.open.assert_called_once_with("http://127.0.0.1:8000/")

    def test_it_retries_until_the_server_listens(create_connection, sleep, webbrowser):
        create_connection.side_effect = [
            ConnectionRefusedError(),
            TimeoutError(),
            create_connection.return_value,
        ]
        open_when_listening("localhost", 9000)
        assert (
            create_connection.call_args_list
            == [call(("localhost", 9000), timeout=1)] * 3
        )
        assert sleep.call_args_list == [call(0.05)] * 2
        webbrowser.open.assert_called_once_with("http://localhost:9000/")

    def test_it_waits_before_opening(create_connection, sleep, webbrowser):
        create_connection.side_effect = [OSError(), create_connection.return_value]
        sleep.side_effect = lambda _: webbrowser.open.assert_not_called()
        open_when_listening("127.0.0.1", 8000)
        webbrowser.open.assert_called_once()
