"""E2e tier: the installed package, exercised the way a user reaches it.

Placeholder. The tier's real subject is the CLI, which does not exist yet —
there is no `[project.scripts]` entry to invoke. Until then this asserts only
that the package imports and reports a version.
"""

import telelux


def describe_package():
    def test_it_imports_and_reports_a_version():
        assert isinstance(telelux.__version__, str)
        assert telelux.__version__
