from unittest.mock import patch

import pytest

from .bake_viewer import bake_viewer

SLOT = '<script type="application/x-ndjson" id="transcript"></script>'
VIEWER = f"<!doctype html><html><head>{SLOT}</head><body></body></html>"


@pytest.fixture
def read_viewer_html():
    with patch("telelux.bake_viewer.read_viewer_html") as read_viewer_html:
        read_viewer_html.return_value = VIEWER
        yield read_viewer_html


def baked_slot(page):
    start = page.index('id="transcript">') + len('id="transcript">')
    return page[start : page.index("</script>", start)]


def describe_bake_viewer():
    def test_it_fills_the_packaged_viewers_transcript_slot(read_viewer_html):
        assert bake_viewer('{"a":1}\n') == (
            "<!doctype html><html><head>"
            '<script type="application/x-ndjson" id="transcript">{"a":1}\n</script>'
            "</head><body></body></html>"
        )
        read_viewer_html.assert_called_once_with()

    def test_it_leaves_quotes_alone_and_escapes_markup(read_viewer_html):
        assert baked_slot(bake_viewer('{"q":"a & b < c > d \'e\'"}')) == (
            '{"q":"a &amp; b &lt; c &gt; d \'e\'"}'
        )

    @pytest.mark.parametrize(
        "breakout", ["</script><script>alert(1)</script>", "<!--", "<![CDATA["]
    )
    def test_no_transcript_text_can_leave_the_script_block(read_viewer_html, breakout):
        page = bake_viewer(f'{{"text":"{breakout}"}}\n')
        assert "<" not in baked_slot(page)
        assert page.count("<script") == 1
        assert page.endswith("</head><body></body></html>")

    def test_it_keeps_replacement_patterns_literal(read_viewer_html):
        assert baked_slot(bake_viewer(r"\g<0> \1 $&")) == r"\g&lt;0&gt; \1 $&amp;"

    @pytest.mark.parametrize("slots", [0, 2])
    def test_it_refuses_a_viewer_without_exactly_one_slot(read_viewer_html, slots):
        read_viewer_html.return_value = "<html>" + SLOT * slots + "</html>"
        with pytest.raises(RuntimeError, match="transcript slot"):
            bake_viewer("text")
