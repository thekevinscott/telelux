import pytest

from .fill_slot import fill_slot

OPEN = '<script type="application/json" id="notes">'
PAGE = f"<html>{OPEN}</script><p>after</p></html>"


def describe_fill_slot():
    def test_it_fills_the_empty_slot():
        assert fill_slot(PAGE, OPEN, "[1]", "notes") == (
            f"<html>{OPEN}[1]</script><p>after</p></html>"
        )

    def test_it_leaves_quotes_alone_and_escapes_markup():
        assert fill_slot(PAGE, OPEN, "\"a\" & 'b' < c > d", "notes") == (
            f"<html>{OPEN}\"a\" &amp; 'b' &lt; c &gt; d</script><p>after</p></html>"
        )

    @pytest.mark.parametrize(
        "breakout", ["</script><script>alert(1)</script>", "<!--", "<![CDATA["]
    )
    def test_no_text_can_leave_the_script_block(breakout):
        page = fill_slot(PAGE, OPEN, breakout, "notes")
        assert page.count("<") == PAGE.count("<")
        assert page.endswith("</script><p>after</p></html>")

    def test_it_keeps_replacement_patterns_literal():
        assert fill_slot(PAGE, OPEN, r"\g<0> \1 $&", "notes") == (
            f"<html>{OPEN}\\g&lt;0&gt; \\1 $&amp;</script><p>after</p></html>"
        )

    @pytest.mark.parametrize("slots", [0, 2])
    def test_it_refuses_a_page_without_exactly_one_slot(slots):
        page = "<html>" + f"{OPEN}</script>" * slots + "</html>"
        with pytest.raises(RuntimeError) as error:
            fill_slot(page, OPEN, "text", "notes")
        assert str(error.value) == (
            f"The packaged viewer has {slots} notes slots instead of one; "
            "reinstall telelux"
        )

    def test_a_filled_slot_does_not_count_as_empty():
        page = fill_slot(PAGE, OPEN, "[1]", "notes")
        with pytest.raises(RuntimeError, match="has 0 notes slots"):
            fill_slot(page, OPEN, "[2]", "notes")
