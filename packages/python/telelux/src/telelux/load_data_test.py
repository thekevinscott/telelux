from pathlib import Path

import pytest

from .load_data import MAX_TRANSCRIPT_BYTES, load_data

FIXTURE = Path(__file__).parents[5] / "fixtures" / "claude-code" / "sample.jsonl"


@pytest.fixture
def transcript(tmp_path):
    path = tmp_path / "three-lines.jsonl"
    path.write_text('{"a":1}\n{"b":2}\n{"c":3}\n')
    return path


def describe_load_data():
    def test_it_returns_the_file_contents(transcript):
        assert load_data(transcript) == '{"a":1}\n{"b":2}\n{"c":3}\n'

    def test_it_accepts_a_string_path(transcript):
        assert load_data(str(transcript)) == load_data(transcript)

    def test_it_raises_when_the_file_is_missing(tmp_path):
        with pytest.raises(FileNotFoundError):
            load_data(tmp_path / "nope.jsonl")

    def test_it_keeps_line_endings_byte_for_byte(tmp_path):
        path = tmp_path / "crlf.jsonl"
        path.write_bytes(b'{"a":1}\r\n{"b":2}\r\n')
        assert load_data(path) == '{"a":1}\r\n{"b":2}\r\n'

    def test_it_decodes_utf8(tmp_path):
        path = tmp_path / "accents.jsonl"
        path.write_bytes('{"text":"café ☕"}\n'.encode())
        assert load_data(path) == '{"text":"café ☕"}\n'

    def test_it_rejects_invalid_utf8(tmp_path):
        path = tmp_path / "latin1.jsonl"
        path.write_bytes('{"text":"café"}\n'.encode("latin-1"))
        with pytest.raises(UnicodeDecodeError):
            load_data(path)

    def test_it_rejects_a_directory_naming_the_fix(tmp_path):
        with pytest.raises(ValueError, match="is a directory; pass one .jsonl"):
            load_data(tmp_path)

    def describe_the_size_limit():
        def test_it_is_50_mib():
            assert MAX_TRANSCRIPT_BYTES == 50 * 1024 * 1024

        def test_it_reads_a_file_at_the_limit(tmp_path):
            path = tmp_path / "at-limit.jsonl"
            with path.open("wb") as file:
                file.truncate(MAX_TRANSCRIPT_BYTES)
            assert len(load_data(path)) == MAX_TRANSCRIPT_BYTES

        def test_it_rejects_a_larger_file_with_its_size_and_the_limit(tmp_path):
            path = tmp_path / "over-limit.jsonl"
            with path.open("wb") as file:
                file.truncate(MAX_TRANSCRIPT_BYTES + 1)
            with pytest.raises(ValueError) as error:
                load_data(path)
            assert str(error.value) == (
                f"{path} is 52428801 bytes, over the 52428800-byte (50 MiB) "
                "transcript limit"
            )

    def describe_with_the_shared_claude_code_corpus():
        def test_it_passes_the_text_through_byte_for_byte():
            assert load_data(FIXTURE) == FIXTURE.read_text(encoding="utf-8")

        def test_it_keeps_the_malformed_and_blank_lines():
            lines = load_data(FIXTURE).split("\n")
            assert "not valid json on purpose" in lines
            assert "" in lines[:-1]
