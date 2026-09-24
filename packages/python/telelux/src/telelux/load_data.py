from pathlib import Path


def load_data(transcript: str | Path) -> str:
    with open(transcript, "r") as f:
        return f.read()
