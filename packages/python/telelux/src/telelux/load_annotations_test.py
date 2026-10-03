from unittest.mock import patch

import pytest

from .load_annotations import load_annotations

SIDECAR = '{"version": 1, "annotations": []}\n'


@pytest.fixture(autouse=True)
def load_data():
    with patch("telelux.load_annotations.load_data") as load_data:
        load_data.return_value = SIDECAR
        yield load_data


def describe_load_annotations():
    def test_it_returns_the_text_unchanged(load_data):
        assert load_annotations("notes.json") == SIDECAR
        load_data.assert_called_once_with("notes.json", "annotations", ".json")

    @pytest.mark.parametrize("text", ["[]", "null", '"text"', '{"version": 99}'])
    def test_it_leaves_the_schema_to_the_viewer(load_data, text):
        load_data.return_value = text
        assert load_annotations("notes.json") == text

    @pytest.mark.parametrize(
        "text,reason",
        [
            ('{"version": 1,', "Expecting property name enclosed in double quotes"),
            ("", "Expecting value: line 1 column 1 (char 0)"),
            ("{} {}", "Extra data: line 1 column 4 (char 3)"),
        ],
    )
    def test_it_rejects_text_that_is_not_json(load_data, text, reason):
        load_data.return_value = text
        with pytest.raises(ValueError) as error:
            load_annotations("notes.json")
        assert type(error.value) is ValueError
        assert str(error.value).startswith("notes.json is not valid JSON: ")
        assert reason in str(error.value)

    def test_it_rejects_json_nested_past_pythons_recursion_limit(load_data):
        load_data.return_value = "[" * 100_000 + "]" * 100_000
        with pytest.raises(ValueError, match="^notes.json is not valid JSON: "):
            load_annotations("notes.json")

    def test_it_names_the_annotations_file_that_is_not_utf8(load_data):
        load_data.side_effect = UnicodeDecodeError(
            "utf-8", b"ab\xff", 2, 3, "invalid start byte"
        )
        with pytest.raises(ValueError) as error:
            load_annotations("notes.json")
        assert type(error.value) is ValueError
        assert str(error.value) == (
            "notes.json is not UTF-8 text: invalid start byte at byte 2"
        )

    @pytest.mark.parametrize(
        "error", [FileNotFoundError("notes.json"), ValueError("a directory")]
    )
    def test_it_raises_what_reading_raises(load_data, error):
        load_data.side_effect = error
        with pytest.raises(type(error)) as raised:
            load_annotations("notes.json")
        assert raised.value is error
