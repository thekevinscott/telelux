import inspect
import threading

import uvicorn

from .open_when_listening import open_when_listening


def open_browser_when_ready(host: str | None, port: int | None) -> None:
    defaults = inspect.signature(uvicorn.Config).parameters
    address = (
        defaults["host"].default if host is None else host,
        defaults["port"].default if port is None else port,
    )
    threading.Thread(target=open_when_listening, args=address, daemon=True).start()
