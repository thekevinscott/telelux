from pathlib import Path


def describe_error(error: OSError | ValueError, transcript: str | Path | None) -> str:
    if isinstance(error, UnicodeDecodeError):
        return f"{transcript} is not UTF-8 text: {error.reason} at byte {error.start}"
    if isinstance(error, OSError) and error.filename is not None:
        return f"{error.filename}: {error.strerror}"
    return str(error)
