import pytest

from .write_exclusive import write_exclusive


def describe_write_exclusive():
    def test_it_writes_utf8_without_translating_newlines(tmp_path):
        path = tmp_path / "out.html"
        write_exclusive(path, "café ☕\r\nline\n")
        assert path.read_bytes() == "café ☕\r\nline\n".encode()

    def test_it_accepts_a_string_path(tmp_path):
        write_exclusive(str(tmp_path / "out.html"), "text")
        assert (tmp_path / "out.html").read_text(encoding="utf-8") == "text"

    def test_it_refuses_to_replace_an_existing_file(tmp_path):
        path = tmp_path / "out.html"
        path.write_bytes(b"\x00original\xff")
        with pytest.raises(FileExistsError):
            write_exclusive(path, "new")
        assert path.read_bytes() == b"\x00original\xff"

    def test_it_raises_when_the_folder_is_missing(tmp_path):
        with pytest.raises(FileNotFoundError):
            write_exclusive(tmp_path / "missing/out.html", "text")
