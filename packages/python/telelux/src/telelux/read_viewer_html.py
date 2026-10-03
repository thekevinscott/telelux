from importlib.resources import files


def read_viewer_html() -> str:
    return files("telelux").joinpath("_assets/viewer.html").read_text(encoding="utf-8")
