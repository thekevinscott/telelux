import os
from pathlib import Path

MAX_TRANSCRIPT_BYTES = 50 * 1024 * 1024


def load_data(
    path: str | Path, kind: str = "transcript", extension: str = ".jsonl"
) -> str:
    path = Path(path)
    if path.is_dir():
        raise ValueError(
            f"{path} is a directory; pass one {extension} {kind} file inside it"
        )
    with path.open("rb") as file:
        contents = file.read(MAX_TRANSCRIPT_BYTES + 1)
        if len(contents) > MAX_TRANSCRIPT_BYTES:
            size = os.fstat(file.fileno()).st_size
            raise ValueError(
                f"{path} is {size} bytes, over the {MAX_TRANSCRIPT_BYTES}-byte "
                f"(50 MiB) {kind} limit"
            )
    return contents.decode("utf-8")
