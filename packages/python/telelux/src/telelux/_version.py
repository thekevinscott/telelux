"""The installed distribution's version. The git tag is the source of truth."""

from __future__ import annotations

from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("telelux")
except PackageNotFoundError:  # running from a source tree that was never installed
    __version__ = "0.0.0"
