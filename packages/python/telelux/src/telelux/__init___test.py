import ast
from pathlib import Path

PACKAGE = Path(__file__).parent
MODULES = [path for path in PACKAGE.glob("*.py") if not path.name.endswith("_test.py")]


def imported_names(tree):
    names = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            names.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            names.add(node.module)
    return names


def called_attributes(tree):
    return {node.attr for node in ast.walk(tree) if isinstance(node, ast.Attribute)}


def describe_telelux():
    def test_it_never_parses_transcripts_itself():
        for path in MODULES:
            tree = ast.parse(path.read_text(encoding="utf-8"))
            assert "json" not in imported_names(tree), path.name
            assert "splitlines" not in called_attributes(tree), path.name
