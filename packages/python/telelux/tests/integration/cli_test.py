import base64
import gzip
import json
import random
import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

import pytest
from playwright.sync_api import expect, sync_playwright

from telelux import Telelux

PACKAGE = Path(__file__).parents[2]
SAMPLE = PACKAGE.parents[2] / "fixtures/claude-code/sample.jsonl"
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


def decode(url):
    prefix, payload = url.split("#v=1&data=")
    assert prefix == "https://telelux.dev/"
    padded = payload + "=" * (-len(payload) % 4)
    return gzip.decompress(base64.urlsafe_b64decode(padded)).decode("utf-8")


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        yield browser
        browser.close()


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

    def describe_out():
        def test_it_writes_the_sdks_html_and_prints_only_the_path(
            telelux, transcript, tmp_path
        ):
            out = tmp_path / "session.html"
            result = run(telelux, str(transcript), "--out", str(out))
            assert result.returncode == 0
            assert result.stdout == f"{out}\n"
            assert result.stderr == ""
            assert out.read_bytes() == Telelux(transcript).html.encode("utf-8")

        def test_it_leaves_an_existing_file_byte_identical(
            telelux, transcript, tmp_path
        ):
            out = tmp_path / "session.html"
            out.write_bytes(b"keep me\r\n")
            result = run(telelux, str(transcript), "--out", str(out))
            assert result.returncode == 1
            assert result.stdout == ""
            assert result.stderr == f"Error: {out}: File exists\n"
            assert out.read_bytes() == b"keep me\r\n"

        def test_it_exits_2_without_a_transcript(telelux, tmp_path):
            out = tmp_path / "session.html"
            result = run(telelux, "--out", str(out))
            assert result.returncode == 2
            assert "--out needs a TRANSCRIPT" in result.stderr
            assert not out.exists()

    def describe_url():
        def test_it_prints_one_line_the_link_to_the_transcript(telelux):
            result = run(telelux, str(SAMPLE), "--url")
            assert result.returncode == 0
            assert result.stderr == ""
            link, end = result.stdout.split("\n")
            assert end == ""
            assert link == Telelux(SAMPLE).url
            assert decode(link) == SAMPLE.read_text(encoding="utf-8")

        def test_the_served_viewer_opens_the_link(telelux, serve, transcript, browser):
            link = run(telelux, str(transcript), "--url").stdout.strip()
            port = free_port()
            serve("--port", str(port))
            fetch(f"http://127.0.0.1:{port}/")
            page = browser.new_page()
            page.goto(f"http://127.0.0.1:{port}/#{link.split('#')[1]}")
            expect(page.locator("telelux-transcript ol > li").first).to_contain_text(
                "First session"
            )
            page.close()

        def test_a_link_too_long_exits_1_naming_the_alternatives(telelux, tmp_path):
            noisy = tmp_path / "noisy.jsonl"
            noise = random.Random(0).randbytes(6000).hex()
            noisy.write_text(json.dumps({"noise": noise}) + "\n", encoding="utf-8")
            result = run(telelux, str(noisy), "--url")
            assert result.returncode == 1
            assert result.stdout == ""
            assert result.stderr.startswith("Error: The link would be ")
            assert "over the 8000-character limit" in result.stderr
            assert "baked HTML" in result.stderr
            assert "https://telelux.dev/#v=1&data=<transcript-url>" in result.stderr

        def test_it_exits_2_without_a_transcript(telelux):
            result = run(telelux, "--url")
            assert result.returncode == 2
            assert result.stdout == ""
            assert "--url needs a TRANSCRIPT" in result.stderr

        def test_it_exits_2_alongside_out(telelux, transcript, tmp_path):
            out = tmp_path / "session.html"
            result = run(telelux, str(transcript), "--url", "--out", str(out))
            assert result.returncode == 2
            assert "--out and --url can't be used together" in result.stderr
            assert not out.exists()

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
