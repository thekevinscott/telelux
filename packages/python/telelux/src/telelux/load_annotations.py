import json
from pathlib import Path

from .load_data import load_data


def load_annotations(annotations: str | Path) -> str:
    try:
        text = load_data(annotations, "annotations", ".json")
    except UnicodeDecodeError as error:
        raise ValueError(
            f"{annotations} is not UTF-8 text: {error.reason} at byte {error.start}"
        ) from error
    try:
        json.loads(text)
    except (json.JSONDecodeError, RecursionError) as error:
        raise ValueError(f"{annotations} is not valid JSON: {error}") from error
    return text
