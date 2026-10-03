import pytest

from telelux import Telelux


@pytest.fixture
def transcript(tmp_path):
    path = tmp_path / "session.jsonl"
    path.write_text('{"a":1}\n', encoding="utf-8")
    return path


def describe_Telelux_snapshots():
    def test_a_later_edit_to_the_file_does_not_reach_the_viewer(transcript):
        viewer = Telelux(transcript)
        transcript.write_text('{"edited":true}\n', encoding="utf-8")
        assert viewer._contents == '{"a":1}\n'

    def test_reassigning_picks_up_the_edit(transcript):
        viewer = Telelux(transcript)
        transcript.write_text('{"edited":true}\n', encoding="utf-8")
        viewer.transcript = transcript
        assert viewer._contents == '{"edited":true}\n'

    def test_a_directory_is_refused_and_the_previous_transcript_kept(
        transcript, tmp_path
    ):
        viewer = Telelux(transcript)
        with pytest.raises(ValueError, match="is a directory"):
            viewer.transcript = tmp_path
        assert viewer.transcript == transcript
        assert viewer._contents == '{"a":1}\n'

    def test_invalid_utf8_is_refused_and_the_previous_transcript_kept(
        transcript, tmp_path
    ):
        latin1 = tmp_path / "latin1.jsonl"
        latin1.write_bytes('{"text":"café"}\n'.encode("latin-1"))
        viewer = Telelux(transcript)
        with pytest.raises(UnicodeDecodeError):
            viewer.transcript = latin1
        assert viewer.transcript == transcript
        assert viewer._contents == '{"a":1}\n'
