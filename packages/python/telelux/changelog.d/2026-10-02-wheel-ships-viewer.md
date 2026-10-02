**Added** The wheel and sdist ship the built viewer as `telelux/_assets/viewer.html`, read at runtime through `importlib.resources`, so the package works offline with no Node (#6).
**Fixed** `pytest` and `pytest-watcher` are no longer runtime dependencies.
