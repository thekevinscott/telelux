from .fill_slot import fill_slot
from .read_viewer_html import read_viewer_html

TRANSCRIPT_SLOT = '<script type="application/x-ndjson" id="transcript">'
ANNOTATIONS_SLOT = '<script type="application/json" id="annotations">'


def bake_viewer(text: str, annotations: str | None = None) -> str:
    page = fill_slot(read_viewer_html(), TRANSCRIPT_SLOT, text, "transcript")
    return fill_slot(page, ANNOTATIONS_SLOT, annotations or "", "annotations")
