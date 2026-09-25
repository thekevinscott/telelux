import ast
from pathlib import Path

import telelux

PACKAGE = Path(telelux.__file__).parent
MODULES = [path for path in PACKAGE.glob("*.py") if not path.name.endswith("_test.py")]


def imported_names(path):
    tree = ast.parse(path.read_text(encoding="utf-8"))
    names = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            names.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            names.add(node.module)
    return names


def describe_telelux():
    def test_it_exposes_the_class_and_the_version():
        assert telelux.__all__ == ["Telelux", "__version__"]

    def test_it_never_parses_transcripts_itself():
        for path in MODULES:
            assert "json" not in imported_names(path), path.name
