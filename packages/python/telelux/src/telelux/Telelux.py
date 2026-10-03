from pathlib import Path

from .build_link import build_link
from .load_data import load_data


class Telelux:
    _transcript_path: str | Path | None = None
    _contents: str | None = None

    def __init__(self, transcript: str | Path | None = None):
        self.transcript = transcript

    @property
    def transcript(self) -> str | Path | None:
        return self._transcript_path

    @transcript.setter
    def transcript(self, transcript: str | Path | None = None) -> None:
        contents = None if transcript is None else load_data(transcript)
        self._transcript_path = transcript
        self._contents = contents

    @property
    def url(self) -> str:
        return build_link(self._snapshot())

    def _snapshot(self) -> str:
        if self._contents is None:
            raise ValueError("No transcript set")
        return self._contents
