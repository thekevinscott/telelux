import os
from pathlib import Path

MAX_TRANSCRIPT_BYTES = 50 * 1024 * 1024


def load_data(transcript: str | Path) -> str:
    path = Path(transcript)
    if path.is_dir():
        raise ValueError(
            f"{path} is a directory; pass one .jsonl transcript file inside it"
        )
    with path.open("rb") as file:
        contents = file.read(MAX_TRANSCRIPT_BYTES + 1)
        if len(contents) > MAX_TRANSCRIPT_BYTES:
            size = os.fstat(file.fileno()).st_size
            raise ValueError(
                f"{path} is {size} bytes, over the {MAX_TRANSCRIPT_BYTES}-byte "
                "(50 MiB) transcript limit"
            )
    return contents.decode("utf-8")
