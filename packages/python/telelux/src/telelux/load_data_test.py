import pytest

from .load_data import load_data


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
