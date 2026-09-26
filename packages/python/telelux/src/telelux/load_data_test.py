from pathlib import Path

import pytest

from .load_data import load_data

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

    def describe_with_the_shared_claude_code_corpus():
        def test_it_passes_the_text_through_byte_for_byte():
            assert load_data(FIXTURE) == FIXTURE.read_text(encoding="utf-8")

        def test_it_keeps_the_malformed_and_blank_lines():
            lines = load_data(FIXTURE).split("\n")
            assert "not valid json on purpose" in lines
            assert "" in lines[:-1]
