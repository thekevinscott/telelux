from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from .cli import cli


@pytest.fixture(autouse=True)
def Telelux():
    with patch("telelux.cli.Telelux") as Telelux:
        yield Telelux


@pytest.fixture(autouse=True)
def open_browser_when_ready():
    with patch("telelux.cli.open_browser_when_ready") as opener:
        yield opener


@pytest.fixture(autouse=True)
def serve_log_config():
    with patch("telelux.cli.serve_log_config") as serve_log_config:
        serve_log_config.return_value = {"log": "config"}
        yield serve_log_config


@pytest.fixture(autouse=True)
def describe_error():
    with patch("telelux.cli.describe_error") as describe_error:
        describe_error.side_effect = lambda error, transcript: f"described {error}"
        yield describe_error


@pytest.fixture
def run(capsys):
    def invoke(*args):
        with pytest.raises(SystemExit) as exit:
            cli.main(list(args), prog_name="telelux")
        output = capsys.readouterr()
        return SimpleNamespace(
            exit_code=exit.value.code, stdout=output.out, stderr=output.err
        )

    return invoke


def describe_cli():
    def describe_serving():
        def test_bare_invocation_serves_the_empty_viewer(
            run, Telelux, serve_log_config
        ):
            result = run()
            assert result.exit_code == 0
            Telelux.assert_called_once_with(None)
            Telelux.return_value.serve.assert_called_once_with(
                log_config={"log": "config"}
            )
            serve_log_config.assert_called_once_with()

        def test_it_serves_the_transcript(run, Telelux):
            assert run("session.jsonl").exit_code == 0
            Telelux.assert_called_once_with(Path("session.jsonl"))
            Telelux.return_value.serve.assert_called_once_with(
                log_config={"log": "config"}
            )

        def test_it_forwards_host_and_port(run, Telelux):
            assert run("--host", "0.0.0.0", "--port", "9000").exit_code == 0
            Telelux.return_value.serve.assert_called_once_with(
                log_config={"log": "config"}, host="0.0.0.0", port=9000
            )

        def test_it_forwards_port_zero_and_an_empty_host(run, Telelux):
            assert run("--host", "", "--port", "0").exit_code == 0
            Telelux.return_value.serve.assert_called_once_with(
                log_config={"log": "config"}, host="", port=0
            )

        def test_a_port_that_is_not_a_number_is_a_usage_error(run, Telelux):
            result = run("--port", "eighty")
            assert result.exit_code == 2
            assert "'eighty' is not a valid integer" in result.stderr
            Telelux.assert_not_called()

        def test_it_writes_nothing_to_stdout(run, Telelux):
            assert run("session.jsonl").stdout == ""

    def describe_the_browser():
        def test_it_opens_on_the_address_being_served(
            run, open_browser_when_ready, Telelux
        ):
            run("--host", "0.0.0.0", "--port", "9000")
            open_browser_when_ready.assert_called_once_with("0.0.0.0", 9000)

        def test_it_leaves_unset_options_unset(run, open_browser_when_ready):
            run()
            open_browser_when_ready.assert_called_once_with(None, None)

        def test_it_opens_before_serving_blocks(run, open_browser_when_ready, Telelux):
            Telelux.return_value.serve.side_effect = lambda **_: (
                open_browser_when_ready.assert_called_once()
            )
            assert run().exit_code == 0

        def test_no_browser_suppresses_it(run, open_browser_when_ready, Telelux):
            assert run("--no-browser").exit_code == 0
            open_browser_when_ready.assert_not_called()
            Telelux.return_value.serve.assert_called_once()

    def describe_out():
        def test_it_writes_the_baked_html_and_prints_the_path(
            run, Telelux, open_browser_when_ready
        ):
            result = run("session.jsonl", "--out", "session.html")
            assert result.exit_code == 0
            Telelux.assert_called_once_with(Path("session.jsonl"))
            Telelux.return_value.write.assert_called_once_with(Path("session.html"))
            assert result.stdout == "session.html\n"
            assert result.stderr == ""

        def test_it_does_not_serve_or_open_a_browser(
            run, Telelux, open_browser_when_ready
        ):
            run("session.jsonl", "--out", "session.html", "--port", "9000")
            Telelux.return_value.serve.assert_not_called()
            open_browser_when_ready.assert_not_called()

        def test_it_needs_a_transcript(run, Telelux):
            result = run("--out", "session.html")
            assert result.exit_code == 2
            assert "--out needs a TRANSCRIPT" in result.stderr
            assert result.stdout == ""
            Telelux.assert_not_called()

        @pytest.mark.parametrize(
            "error",
            [
                FileExistsError(17, "File exists", "session.html"),
                FileNotFoundError(2, "No such file or directory", "a/b.html"),
            ],
        )
        def test_a_failed_write_exits_1_on_stderr(run, Telelux, describe_error, error):
            Telelux.return_value.write.side_effect = error
            result = run("session.jsonl", "--out", "session.html")
            assert result.exit_code == 1
            assert result.stdout == ""
            assert result.stderr == f"Error: described {error}\n"
            describe_error.assert_called_once_with(error, Path("session.jsonl"))

    def describe_failures():
        @pytest.mark.parametrize(
            "error",
            [
                FileNotFoundError(2, "No such file or directory", "a.jsonl"),
                ValueError("a.jsonl is a directory"),
                UnicodeDecodeError("utf-8", b"\xff", 0, 1, "invalid start byte"),
            ],
        )
        def test_an_unusable_transcript_exits_1_on_stderr(
            run, Telelux, describe_error, open_browser_when_ready, error
        ):
            Telelux.side_effect = error
            result = run("a.jsonl")
            assert result.exit_code == 1
            assert result.stdout == ""
            assert result.stderr == f"Error: described {error}\n"
            describe_error.assert_called_once_with(error, Path("a.jsonl"))
            open_browser_when_ready.assert_not_called()

        def test_other_errors_are_not_swallowed(Telelux):
            Telelux.side_effect = RuntimeError("boom")
            with pytest.raises(RuntimeError, match="^boom$"):
                cli.main(["a.jsonl"])

        def test_an_unknown_option_is_a_usage_error(run, Telelux):
            result = run("--nope")
            assert result.exit_code == 2
            assert "--nope" in result.stderr
            Telelux.assert_not_called()

        def test_a_second_transcript_is_a_usage_error(run, Telelux):
            assert run("a.jsonl", "b.jsonl").exit_code == 2
            Telelux.assert_not_called()

    def describe_help():
        def test_it_documents_every_option(run):
            result = run("--help")
            assert result.exit_code == 0
            for option in ("TRANSCRIPT", "--out", "--no-browser", "--host", "--port"):
                assert option in result.stdout
