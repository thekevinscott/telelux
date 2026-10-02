from .encode_payload import encode_payload

LINK_PREFIX = "https://telelux.dev/#v=1&data="
MAX_LINK_CHARS = 8000
MAX_LINK_TEXT_BYTES = 10 * 1024 * 1024
ALTERNATIVES = (
    "Export the transcript as baked HTML instead, or host the .jsonl file and "
    f"share {LINK_PREFIX}<transcript-url>."
)


def build_link(text: str) -> str:
    size = len(text.encode("utf-8"))
    if size > MAX_LINK_TEXT_BYTES:
        raise ValueError(
            f"The transcript is {size} bytes, over the {MAX_LINK_TEXT_BYTES}-byte "
            f"(10 MiB) limit for a link. {ALTERNATIVES}"
        )
    link = LINK_PREFIX + encode_payload(text)
    if len(link) > MAX_LINK_CHARS:
        raise ValueError(
            f"The link would be {len(link)} characters, over the "
            f"{MAX_LINK_CHARS}-character limit. {ALTERNATIVES}"
        )
    return link
