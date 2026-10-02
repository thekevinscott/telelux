import json
import re
from pathlib import Path

import pytest
from playwright.sync_api import expect, sync_playwright

from telelux import Telelux

VECTOR = json.loads(
    (Path(__file__).parents[5] / "fixtures/link/v1.json").read_text(encoding="utf-8")
)
TRANSCRIPT = (
    '{"type":"user","message":{"role":"user",'
    '"content":"Hello </script><!-- <![CDATA[ & done"}}\n'
    '{"type":"assistant","message":{"role":"assistant",'
    '"content":"Rendered offline."}}\n'
)

SIDECAR = {
    "version": 1,
    "annotations": [
        {
            "id": "a1",
            "target": {"start": {"index": 1}},
            "label": "baked-label",
            "note": "Baked </script><!-- & note",
            "source": {"kind": "judge", "name": "rubric-v2"},
        }
    ],
}


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        yield browser
        browser.close()


@pytest.fixture
def page(browser):
    context = browser.new_context(offline=True)
    page = context.new_page()
    page.requests = []

    def only_files(route):
        page.requests.append(route.request.url)
        if route.request.url.startswith("file:"):
            route.continue_()
        else:
            route.abort()

    page.route("**/*", only_files)
    yield page
    context.close()


@pytest.fixture
def exported(tmp_path):
    transcript = tmp_path / "session.jsonl"
    transcript.write_text(TRANSCRIPT, encoding="utf-8")
    path = tmp_path / "session.html"
    path.write_text(Telelux(transcript).html, encoding="utf-8")
    return path


@pytest.fixture
def annotated(tmp_path):
    transcript = tmp_path / "session.jsonl"
    transcript.write_text(TRANSCRIPT, encoding="utf-8")
    annotations = tmp_path / "review.json"
    annotations.write_text(json.dumps(SIDECAR), encoding="utf-8")
    path = tmp_path / "annotated.html"
    path.write_text(Telelux(transcript, annotations).html, encoding="utf-8")
    return path


def describe_Telelux_html():
    def test_it_is_one_document_with_everything_inlined(exported):
        html = exported.read_text(encoding="utf-8")
        assert html.lower().startswith("<!doctype html>")
        assert html.rstrip().endswith("</html>")
        assert not re.search(r"<script[^>]*\ssrc=", html)
        assert not re.search(r"<link[^>]*\shref=", html)

    def test_it_renders_offline_with_record_inspection(exported, page):
        page.goto(exported.as_uri())
        blocks = page.locator("telelux-transcript ol > li")
        expect(blocks.first).to_contain_text("Hello </script><!-- <![CDATA[ & done")
        expect(blocks.nth(1)).to_contain_text("Rendered offline.")
        blocks.nth(1).get_by_role("button", name="Raw").click()
        expect(blocks.nth(1)).to_contain_text('"role": "assistant"')
        assert [url for url in page.requests if not url.startswith("file:")] == []

    def test_a_link_fragment_replaces_the_baked_transcript(exported, page):
        page.goto(f"{exported.as_uri()}#v=1&data={VECTOR['data']}")
        transcript = page.locator("telelux-transcript")
        expect(transcript).to_contain_text("¿Qué tal? 👋")
        expect(transcript).not_to_contain_text("Rendered offline.")

    def describe_with_annotations():
        def test_it_renders_them_from_the_baked_slot_offline(annotated, page):
            page.goto(annotated.as_uri())
            card = (
                page.locator("telelux-transcript ol > li")
                .nth(1)
                .get_by_role("article", name="Annotation baked-label")
            )
            expect(card).to_contain_text("Baked </script><!-- & note")
            expect(card).to_contain_text("judge: rubric-v2")
            expect(page.get_by_role("alert")).to_have_count(0)
            assert [url for url in page.requests if not url.startswith("file:")] == []

        def test_a_link_fragment_drops_them_with_the_baked_transcript(annotated, page):
            page.goto(f"{annotated.as_uri()}#v=1&data={VECTOR['data']}")
            expect(page.locator("telelux-transcript")).to_contain_text("¿Qué tal? 👋")
            expect(page.locator("telelux-transcript telelux-annotation")).to_have_count(
                0
            )

        def test_without_them_the_page_shows_none(exported, page):
            page.goto(exported.as_uri())
            expect(page.locator("telelux-transcript ol > li")).to_have_count(2)
            expect(page.locator("telelux-transcript telelux-annotation")).to_have_count(
                0
            )
