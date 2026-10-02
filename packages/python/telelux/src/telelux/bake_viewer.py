from html import escape

from .read_viewer_html import read_viewer_html

SLOT_OPEN = '<script type="application/x-ndjson" id="transcript">'
SLOT = f"{SLOT_OPEN}</script>"


def bake_viewer(text: str) -> str:
    viewer = read_viewer_html()
    slots = viewer.count(SLOT)
    if slots != 1:
        raise RuntimeError(
            f"The packaged viewer has {slots} transcript slots instead of one; "
            "reinstall telelux"
        )
    return viewer.replace(SLOT, f"{SLOT_OPEN}{escape(text, quote=False)}</script>")
