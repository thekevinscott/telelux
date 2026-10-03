import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

import pytest

PACKAGE = Path(__file__).parents[2]
FIRST = '{"type":"user","message":{"role":"user","content":"First session"}}\n'


@pytest.fixture(scope="module")
def telelux(tmp_path_factory):
    root = tmp_path_factory.mktemp("installed")
    subprocess.run(
        ["uv", "build", "--wheel", "--out-dir", str(root / "dist")],
        cwd=PACKAGE,
        check=True,
        capture_output=True,
    )
    (wheel,) = (root / "dist").glob("*.whl")
    venv = root / "venv"
    subprocess.run(
        ["uv", "venv", "--python", sys.executable, str(venv)],
        check=True,
        capture_output=True,
    )
    subprocess.run(
        ["uv", "pip", "install", "--python", str(venv / "bin/python"), str(wheel)],
        check=True,
        capture_output=True,
    )
    return str(venv / "bin/telelux")


@pytest.fixture
def transcript(tmp_path):
    path = tmp_path / "session.jsonl"
    path.write_text(FIRST, encoding="utf-8")
    return path


def free_port():
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return probe.getsockname()[1]


def fetch(url):
    deadline = time.monotonic() + 10
    while True:
        try:
            with urlopen(url) as response:
                return response.read().decode("utf-8")
        except URLError:
            if time.monotonic() > deadline:
                raise
            time.sleep(0.05)


@pytest.fixture
def serve(telelux):
    processes = []

    def start(*args):
        process = subprocess.Popen(
            [telelux, *args, "--no-browser"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            encoding="utf-8",
        )
        processes.append(process)
        return process

    yield start
    for process in processes:
        if process.poll() is None:
            process.terminate()
        process.communicate()


def run(telelux, *args, cwd=None):
    return subprocess.run(
        [telelux, *args], capture_output=True, encoding="utf-8", cwd=cwd, check=False
    )


def describe_the_installed_telelux_command():
    def describe_serving():
        def test_it_serves_the_transcript_and_logs_only_to_stderr(serve, transcript):
            port = free_port()
            process = serve(str(transcript), "--port", str(port))
            page = fetch(f"http://127.0.0.1:{port}/")
            process.terminate()
            stdout, stderr = process.communicate()
            assert "First session" in page
            assert stdout == ""
            assert '"GET / HTTP/1.1" 200' in stderr

        def test_without_a_transcript_it_serves_the_empty_viewer(serve):
            port = free_port()
            serve("--host", "127.0.0.1", "--port", str(port))
            page = fetch(f"http://127.0.0.1:{port}/")
            assert '<script type="application/x-ndjson" id="transcript"></script>' in (
                page
            )

    def describe_failures():
        def test_a_missing_transcript_exits_1(telelux, tmp_path):
            result = run(telelux, "missing.jsonl", "--no-browser", cwd=tmp_path)
            assert result.returncode == 1
            assert result.stdout == ""
            assert result.stderr == "Error: missing.jsonl: No such file or directory\n"

        def test_a_directory_exits_1_asking_for_a_file(telelux, tmp_path):
            result = run(telelux, str(tmp_path), "--no-browser")
            assert result.returncode == 1
            assert result.stderr == (
                f"Error: {tmp_path} is a directory; "
                "pass one .jsonl transcript file inside it\n"
            )

        def test_a_transcript_over_50_mib_exits_1_with_its_size(telelux, tmp_path):
            huge = tmp_path / "huge.jsonl"
            with huge.open("wb") as file:
                file.truncate(50 * 1024 * 1024 + 1)
            result = run(telelux, str(huge), "--no-browser")
            assert result.returncode == 1
            assert result.stderr == (
                f"Error: {huge} is 52428801 bytes, over the 52428800-byte "
                "(50 MiB) transcript limit\n"
            )

        def test_an_unknown_option_exits_2(telelux):
            result = run(telelux, "--nope")
            assert result.returncode == 2
            assert result.stdout == ""
            assert "Usage: telelux [OPTIONS] [TRANSCRIPT]" in result.stderr
