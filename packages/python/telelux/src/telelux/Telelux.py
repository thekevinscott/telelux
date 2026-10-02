from pathlib import Path
from typing import Any

import uvicorn

from .bake_viewer import bake_viewer
from .build_link import build_link
from .load_annotations import load_annotations
from .load_data import load_data
from .read_viewer_html import read_viewer_html
from .ViewerApp import ViewerApp
from .write_exclusive import write_exclusive


class Telelux:
    _transcript_path: str | Path | None = None
    _contents: str | None = None
    _annotations_path: str | Path | None = None
    _annotations: str | None = None

    def __init__(
        self,
        transcript: str | Path | None = None,
        annotations: str | Path | None = None,
    ):
        self._app = ViewerApp(self._page)
        self.transcript = transcript
        self.annotations = annotations

    @property
    def transcript(self) -> str | Path | None:
        return self._transcript_path

    @transcript.setter
    def transcript(self, transcript: str | Path | None = None) -> None:
        contents = None if transcript is None else load_data(transcript)
        self._transcript_path = transcript
        self._contents = contents

    @property
    def annotations(self) -> str | Path | None:
        return self._annotations_path

    @annotations.setter
    def annotations(self, annotations: str | Path | None = None) -> None:
        contents = None if annotations is None else load_annotations(annotations)
        self._annotations_path = annotations
        self._annotations = contents

    @property
    def html(self) -> str:
        return bake_viewer(self._snapshot(), self._annotations)

    @property
    def url(self) -> str:
        contents = self._snapshot()
        if self._annotations is not None:
            raise ValueError(
                "A telelux.dev link can't carry annotations; bake them into the "
                "HTML instead (html, write or serve), or set annotations to None"
            )
        return build_link(contents)

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
