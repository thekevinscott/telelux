from pathlib import Path
from unittest.mock import call, patch

import pytest

from .Telelux import Telelux


@pytest.fixture(autouse=True)
def load_data():
    with patch("telelux.Telelux.load_data") as load_data:
        load_data.side_effect = lambda transcript: f"contents of {transcript}"
        yield load_data


@pytest.fixture
def build_link():
    with patch("telelux.Telelux.build_link") as build_link:
        build_link.side_effect = lambda contents: f"link to {contents}"
        yield build_link


@pytest.fixture
def bake_viewer():
    with patch("telelux.Telelux.bake_viewer") as bake_viewer:
        bake_viewer.side_effect = lambda contents: f"<html>{contents}</html>"
        yield bake_viewer


@pytest.fixture
def write_exclusive():
    with patch("telelux.Telelux.write_exclusive") as write_exclusive:
        yield write_exclusive


def describe_Telelux():
    def describe_constructor():
        def test_it_starts_empty_without_a_transcript(load_data):
            viewer = Telelux()
            assert viewer.transcript is None
            assert viewer._contents is None
            load_data.assert_not_called()

        def test_it_snapshots_the_transcript_immediately(load_data):
            viewer = Telelux("foo.jsonl")
            assert viewer.transcript == "foo.jsonl"
            assert viewer._contents == "contents of foo.jsonl"
            load_data.assert_called_once_with("foo.jsonl")

        def test_it_accepts_a_path(load_data):
            viewer = Telelux(Path("foo.jsonl"))
            assert viewer.transcript == Path("foo.jsonl")
            load_data.assert_called_once_with(Path("foo.jsonl"))

        def test_it_raises_what_reading_raises(load_data):
            load_data.side_effect = FileNotFoundError("foo.jsonl")
            with pytest.raises(FileNotFoundError):
                Telelux("foo.jsonl")

    def describe_assigning_a_transcript():
        def test_it_replaces_the_path_and_the_snapshot(load_data):
            viewer = Telelux("foo.jsonl")
            viewer.transcript = "bar.jsonl"
            assert viewer.transcript == "bar.jsonl"
            assert viewer._contents == "contents of bar.jsonl"
            assert load_data.call_args_list == [call("foo.jsonl"), call("bar.jsonl")]

        def test_it_rereads_the_same_path(load_data):
            viewer = Telelux("foo.jsonl")
            load_data.side_effect = ["edited"]
            viewer.transcript = "foo.jsonl"
            assert viewer._contents == "edited"

        def test_none_clears_the_path_and_the_snapshot(load_data):
            viewer = Telelux("foo.jsonl")
            viewer.transcript = None
            assert viewer.transcript is None
            assert viewer._contents is None
            load_data.assert_called_once_with("foo.jsonl")

        @pytest.mark.parametrize(
            "error",
            [
                ValueError("a directory"),
                FileNotFoundError("missing"),
                UnicodeDecodeError("utf-8", b"\xff", 0, 1, "invalid start byte"),
            ],
        )
        def test_a_failed_assignment_keeps_the_previous_state(load_data, error):
            viewer = Telelux("foo.jsonl")
            load_data.side_effect = error
            with pytest.raises(type(error)):
                viewer.transcript = "bar.jsonl"
            assert viewer.transcript == "foo.jsonl"
            assert viewer._contents == "contents of foo.jsonl"

    def describe_url():
        def test_it_links_to_the_snapshot(build_link):
            assert Telelux("foo.jsonl").url == "link to contents of foo.jsonl"
            build_link.assert_called_once_with("contents of foo.jsonl")

        def test_it_follows_a_new_assignment(build_link):
            viewer = Telelux("foo.jsonl")
            viewer.transcript = "bar.jsonl"
            assert viewer.url == "link to contents of bar.jsonl"

        def test_it_raises_without_a_transcript(build_link):
            with pytest.raises(ValueError, match="^No transcript set$"):
                _ = Telelux().url
            build_link.assert_not_called()

        def test_it_raises_after_the_transcript_is_cleared(build_link):
            viewer = Telelux("foo.jsonl")
            viewer.transcript = None
            with pytest.raises(ValueError, match="^No transcript set$"):
                _ = viewer.url

    def describe_html():
        def test_it_bakes_the_snapshot_into_the_viewer(bake_viewer):
            assert Telelux("foo.jsonl").html == "<html>contents of foo.jsonl</html>"
            bake_viewer.assert_called_once_with("contents of foo.jsonl")

        def test_it_follows_a_new_assignment(bake_viewer):
            viewer = Telelux("foo.jsonl")
            viewer.transcript = "bar.jsonl"
            assert viewer.html == "<html>contents of bar.jsonl</html>"

        def test_it_raises_without_a_transcript(bake_viewer):
            with pytest.raises(ValueError, match="^No transcript set$"):
                _ = Telelux().html
            bake_viewer.assert_not_called()

        def test_it_raises_after_the_transcript_is_cleared(bake_viewer):
            viewer = Telelux("foo.jsonl")
            viewer.transcript = None
            with pytest.raises(ValueError, match="^No transcript set$"):
                _ = viewer.html

    def describe_write():
        def test_it_writes_the_html_to_the_path(bake_viewer, write_exclusive):
            assert Telelux("foo.jsonl").write("out.html") is None
            write_exclusive.assert_called_once_with(
                "out.html", "<html>contents of foo.jsonl</html>"
            )

        def test_it_raises_without_a_transcript_and_writes_nothing(
            bake_viewer, write_exclusive
        ):
            with pytest.raises(ValueError, match="^No transcript set$"):
                Telelux().write("out.html")
            write_exclusive.assert_not_called()

        def test_it_lets_filesystem_errors_through(bake_viewer, write_exclusive):
            write_exclusive.side_effect = FileExistsError("out.html")
            with pytest.raises(FileExistsError):
                Telelux("foo.jsonl").write("out.html")
