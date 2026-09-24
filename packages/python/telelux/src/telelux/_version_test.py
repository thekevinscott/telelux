"""Tests for the package version module."""

from __future__ import annotations

import importlib
import sys
from importlib.metadata import PackageNotFoundError

import pytest

from telelux._version import __version__


@pytest.fixture(autouse=True)
def _restore_module():
    yield
    importlib.reload(sys.modules["telelux._version"])


def describe_version():
    def test_it_is_a_nonempty_string():
        assert isinstance(__version__, str)
        assert __version__

    def test_it_comes_from_distribution_metadata(monkeypatch):
        monkeypatch.setattr("importlib.metadata.version", lambda _name: "1.2.3")
        module = importlib.reload(sys.modules["telelux._version"])
        assert module.__version__ == "1.2.3"

    def test_an_uninstalled_source_tree_falls_back(monkeypatch):
        def _missing(_name):
            raise PackageNotFoundError

        monkeypatch.setattr("importlib.metadata.version", _missing)
        module = importlib.reload(sys.modules["telelux._version"])
        assert module.__version__ == "0.0.0"
