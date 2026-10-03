from pathlib import Path
from typing import Any

import uvicorn

from .bake_viewer import bake_viewer
from .build_link import build_link
from .load_data import load_data
from .read_viewer_html import read_viewer_html
from .ViewerApp import ViewerApp
from .write_exclusive import write_exclusive


class Telelux:
    _transcript_path: str | Path | None = None
    _contents: str | None = None

    def __init__(self, transcript: str | Path | None = None):
        self._app = ViewerApp(self._page)
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
    def html(self) -> str:
        return bake_viewer(self._snapshot())

    @property
    def url(self) -> str:
        return build_link(self._snapshot())

    def write(self, output_path: str | Path) -> None:
        write_exclusive(output_path, self.html)

    def serve(self, **uvicorn_options: Any) -> None:
        uvicorn.run(self._app, **uvicorn_options)

    async def serve_async(self, **uvicorn_options: Any) -> None:
        await uvicorn.Server(uvicorn.Config(self._app, **uvicorn_options)).serve()

    def _page(self) -> str:
        return read_viewer_html() if self._contents is None else self.html

    def _snapshot(self) -> str:
        if self._contents is None:
            raise ValueError("No transcript set")
        return self._contents
