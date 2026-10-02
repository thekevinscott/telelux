from unittest.mock import call, patch

import pytest

from .bake_viewer import bake_viewer

TRANSCRIPT = '<script type="application/x-ndjson" id="transcript">'
ANNOTATIONS = '<script type="application/json" id="annotations">'


@pytest.fixture(autouse=True)
def read_viewer_html():
    with patch("telelux.bake_viewer.read_viewer_html") as read_viewer_html:
        read_viewer_html.return_value = "viewer"
        yield read_viewer_html


@pytest.fixture(autouse=True)
def fill_slot():
    with patch("telelux.bake_viewer.fill_slot") as fill_slot:
        fill_slot.side_effect = lambda page, tag, text, name: f"{page}+{name}={text}"
        yield fill_slot


def describe_bake_viewer():
    def test_it_fills_the_transcript_then_the_annotations_slot(
        read_viewer_html, fill_slot
    ):
        assert bake_viewer("lines", "{}") == "viewer+transcript=lines+annotations={}"
        read_viewer_html.assert_called_once_with()
        assert fill_slot.call_args_list == [
            call("viewer", TRANSCRIPT, "lines", "transcript"),
            call("viewer+transcript=lines", ANNOTATIONS, "{}", "annotations"),
        ]

    def test_without_annotations_it_leaves_their_slot_empty(fill_slot):
        assert bake_viewer("lines") == "viewer+transcript=lines+annotations="
        assert fill_slot.call_args_list[1] == call(
            "viewer+transcript=lines", ANNOTATIONS, "", "annotations"
        )

    def test_it_lets_a_missing_slot_through(fill_slot):
        fill_slot.side_effect = RuntimeError("no slot")
        with pytest.raises(RuntimeError, match="^no slot$"):
            bake_viewer("lines")
