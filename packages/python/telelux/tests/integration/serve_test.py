import asyncio
import json
import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

import pytest
from playwright.sync_api import expect, sync_playwright

from telelux import Telelux

VECTOR = json.loads(
    (Path(__file__).parents[5] / "fixtures/link/v1.json").read_text(encoding="utf-8")
)
FIRST = '{"type":"user","message":{"role":"user","content":"First session"}}\n'
SECOND = '{"type":"user","message":{"role":"user","content":"Second session"}}\n'


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
        except HTTPError:
            raise
        except URLError:
            if time.monotonic() > deadline:
                raise
            time.sleep(0.05)


@pytest.fixture
def transcript(tmp_path):
    path = tmp_path / "session.jsonl"
    path.write_text(FIRST, encoding="utf-8")
    return path


@pytest.fixture
def served(tmp_path):
    processes = []

    def serve(transcript=None):
        port = free_port()
        script = (
            "import sys\n"
            "from telelux import Telelux\n"
            "Telelux(sys.argv[1] or None).serve(port=int(sys.argv[2]))\n"
        )
        args = [sys.executable, "-c", script, str(transcript or ""), str(port)]
        processes.append(subprocess.Popen(args, stderr=subprocess.DEVNULL))
        url = f"http://127.0.0.1:{port}/"
        fetch(url)
        return url

    yield serve
    for process in processes:
        process.terminate()
        process.wait()


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        yield browser
        browser.close()


@pytest.fixture
def page(browser):
    context = browser.new_context()
    yield context.new_page()
    context.close()


def describe_Telelux_serve_async():
    def test_a_new_transcript_shows_on_the_next_page_load(transcript, tmp_path):
        second = tmp_path / "second.jsonl"
        second.write_text(SECOND, encoding="utf-8")
        viewer = Telelux(transcript)
        port = free_port()
        url = f"http://127.0.0.1:{port}/"

        async def scenario():
            server = asyncio.create_task(
                viewer.serve_async(port=port, log_level="warning")
            )
            first = await asyncio.to_thread(fetch, url)
            viewer.transcript = second
            then = await asyncio.to_thread(fetch, url)
            server.cancel()
            return first, then

        first, then = asyncio.run(scenario())
        assert "First session" in first
        assert "Second session" in then
        assert "First session" not in then


def describe_Telelux_serve():
    def test_it_renders_the_transcript(served, transcript, page):
        page.goto(served(transcript))
        expect(page.locator("telelux-transcript ol > li").first).to_contain_text(
            "First session"
        )

    def test_without_a_transcript_it_opens_on_the_loading_screen(served, page):
        page.goto(served())
        expect(page.get_by_text("No transcript loaded.")).to_be_visible()

    def test_it_resolves_link_fragments(served, page):
        page.goto(f"{served()}#v=1&data={VECTOR['data']}")
        expect(page.locator("telelux-transcript")).to_contain_text("¿Qué tal? 👋")
