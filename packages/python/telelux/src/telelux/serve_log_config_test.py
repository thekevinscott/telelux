from unittest.mock import patch

import pytest

from .serve_log_config import serve_log_config

UVICORN_CONFIG = {
    "version": 1,
    "handlers": {
        "default": {"class": "logging.StreamHandler", "stream": "ext://sys.stderr"},
        "access": {"class": "logging.StreamHandler", "stream": "ext://sys.stdout"},
    },
}


@pytest.fixture(autouse=True)
def LOGGING_CONFIG():
    with patch.dict("telelux.serve_log_config.LOGGING_CONFIG", clear=True) as config:
        config.update(UVICORN_CONFIG)
        yield config


def describe_serve_log_config():
    def test_it_sends_the_access_log_to_stderr():
        assert serve_log_config() == {
            "version": 1,
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stderr",
                },
                "access": {
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stderr",
                },
            },
        }

    def test_it_leaves_uvicorns_own_config_alone(LOGGING_CONFIG):
        serve_log_config()
        assert LOGGING_CONFIG["handlers"]["access"]["stream"] == "ext://sys.stdout"
