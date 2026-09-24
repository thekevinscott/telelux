from pathlib import Path

from .load_data import load_data


class Telelux:
    __transcript__: str | Path | None = None
    __data__: str | None = None

    def __init__(self, transcript: str | Path | None = None):
        self.transcript = transcript

    @property
    def transcript(self) -> str | Path | None:
        return self.__transcript__

    @transcript.setter
    def transcript(self, transcript: str | Path | None = None) -> None:
        self.__transcript__ = transcript
        if transcript:
            self.__data__ = load_data(transcript)
