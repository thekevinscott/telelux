from unittest.mock import patch

import pytest

from .open_browser_when_ready import open_browser_when_ready


@pytest.fixture
def threading():
    with patch("telelux.open_browser_when_ready.threading") as threading:
        yield threading


@pytest.fixture
def open_when_listening():
    with patch("telelux.open_browser_when_ready.open_when_listening") as opener:
        yield opener


@pytest.fixture
def uvicorn():
    def Config(app, host="uvicorn-host", port=1234):
        pass

    with patch("telelux.open_browser_when_ready.uvicorn") as uvicorn:
        uvicorn.Config = Config
        yield uvicorn


def describe_open_browser_when_ready():
    def test_it_waits_in_a_daemon_thread(threading, open_when_listening, uvicorn):
        open_browser_when_ready("0.0.0.0", 9000)
        threading.Thread.assert_called_once_with(
            target=open_when_listening, args=("0.0.0.0", 9000), daemon=True
        )
        threading.Thread.return_value.start.assert_called_once_with()

    def test_it_takes_unset_host_and_port_from_uvicorn(
        threading, open_when_listening, uvicorn
    ):
        open_browser_when_ready(None, None)
        assert threading.Thread.call_args.kwargs["args"] == ("uvicorn-host", 1234)

    def test_it_keeps_port_zero(threading, open_when_listening, uvicorn):
        open_browser_when_ready("", 0)
        assert threading.Thread.call_args.kwargs["args"] == ("", 0)
