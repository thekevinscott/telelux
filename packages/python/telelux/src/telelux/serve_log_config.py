import copy
from typing import Any

from uvicorn.config import LOGGING_CONFIG


def serve_log_config() -> dict[str, Any]:
    config = copy.deepcopy(LOGGING_CONFIG)
    config["handlers"]["access"]["stream"] = "ext://sys.stderr"
    return config
