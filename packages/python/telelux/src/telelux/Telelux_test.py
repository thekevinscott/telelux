from pathlib import Path
from unittest.mock import patch

import pytest

from .Telelux import Telelux


@pytest.fixture(autouse=True)
def mock_load_data():
    with patch("telelux.Telelux.load_data") as load_data:
        yield load_data


def describe_Telelux():
    def test_it_instantiates():
        assert Telelux() is not None

    def describe_transcript_arg():
        def test_it_accepts_a_transcript():
            transcript = "foo.jsonl"
            viewer = Telelux(transcript)
            assert viewer.transcript == transcript

        def test_it_accepts_a_transcript_path():
            transcript = Path("foo.jsonl")
            viewer = Telelux(transcript)
            assert viewer.transcript == transcript

        def test_it_accepts_no_transcript():
            viewer = Telelux()
            assert viewer.transcript is None

    def describe_loading_transcripts():
        def test_it_calls_load_data_if_transcript_is_provided(mock_load_data):
            mock_load_data.side_effect = ["foo", "bar"]
            assert mock_load_data.call_count == 0
            transcript = "foo.jsonl"
            viewer = Telelux(transcript)
            assert viewer.transcript == transcript
            assert mock_load_data.call_count == 1
            assert viewer.__data__ == "foo"

            viewer.transcript = "bar.jsonl"
            assert mock_load_data.call_count == 2
            assert viewer.__data__ == "bar"

        def test_it_does_not_call_load_data_if_transcript_is_not_provided(
            mock_load_data,
        ):
            assert mock_load_data.call_count == 0
            Telelux()
            assert mock_load_data.call_count == 0
