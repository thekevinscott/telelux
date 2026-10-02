from pathlib import Path

import pytest

from .describe_error import describe_error


def describe_describe_error():
    def test_it_names_the_file_and_the_reason_for_os_errors():
        error = FileNotFoundError(2, "No such file or directory", "a.jsonl")
        assert describe_error(error, Path("a.jsonl")) == (
            "a.jsonl: No such file or directory"
        )

    def test_it_names_the_file_the_os_error_carries():
        error = FileExistsError(17, "File exists", "out.html")
        assert describe_error(error, Path("a.jsonl")) == "out.html: File exists"

    def test_it_uses_the_message_of_an_os_error_without_a_file():
        assert describe_error(OSError("disk on fire"), None) == "disk on fire"

    def test_it_uses_the_message_of_a_value_error():
        error = ValueError("a.jsonl is a directory")
        assert describe_error(error, Path("a.jsonl")) == "a.jsonl is a directory"

    @pytest.mark.parametrize("transcript", [Path("a.jsonl"), "a.jsonl"])
    def test_it_names_the_transcript_that_is_not_utf8(transcript):
        error = UnicodeDecodeError("utf-8", b"ab\xff", 2, 3, "invalid start byte")
        assert describe_error(error, transcript) == (
            "a.jsonl is not UTF-8 text: invalid start byte at byte 2"
        )
