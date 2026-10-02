from unittest.mock import patch

import pytest

from .read_viewer_html import read_viewer_html


@pytest.fixture
def files():
    with patch("telelux.read_viewer_html.files") as files:
        yield files


def describe_read_viewer_html():
    def test_it_reads_the_packaged_viewer_as_utf8(files):
        resource = files.return_value.joinpath.return_value
        resource.read_text.return_value = "<html>viewer</html>"
        assert read_viewer_html() == "<html>viewer</html>"
        files.assert_called_once_with("telelux")
        files.return_value.joinpath.assert_called_once_with("_assets/viewer.html")
        resource.read_text.assert_called_once_with(encoding="utf-8")
