import pytest

from telelux import Telelux


@pytest.fixture
def viewer(tmp_path):
    transcript = tmp_path / "session.jsonl"
    transcript.write_text('{"text":"café ☕"}\n', encoding="utf-8")
    return Telelux(transcript)


def describe_Telelux_write():
    def test_it_writes_the_html_as_utf8(viewer, tmp_path):
        out = tmp_path / "session.html"
        viewer.write(out)
        assert out.read_bytes() == viewer.html.encode("utf-8")

    def test_it_leaves_an_existing_file_byte_identical(viewer, tmp_path):
        out = tmp_path / "session.html"
        out.write_bytes(b"keep me\r\n")
        with pytest.raises(FileExistsError):
            viewer.write(out)
        assert out.read_bytes() == b"keep me\r\n"

    def test_it_writes_nothing_without_a_transcript(tmp_path):
        out = tmp_path / "session.html"
        with pytest.raises(ValueError, match="No transcript set"):
            Telelux().write(out)
        assert not out.exists()
