from pathlib import Path


def write_exclusive(path: str | Path, text: str) -> None:
    with open(path, "x", encoding="utf-8", newline="") as file:
        file.write(text)
