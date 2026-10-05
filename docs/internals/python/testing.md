# Python — testing

**pytest, with `pytest-describe` for BDD-flavour grouping and `pytest-asyncio` for async.**

```python
# telelux/core_test.py
import pytest
from telelux.core import process

def describe_process():
    def describe_when_items_is_empty():
        def it_returns_empty_dict():
            assert process([]) == {}

    def describe_when_items_has_duplicates():
        def it_counts_each_item():
            result = process(["a", "a", "b"])
            assert result == {"a": 2, "b": 1}

    @pytest.mark.parametrize("items,expected", [
        ([], {}),
        (["a"], {"a": 1}),
        (["a", "a"], {"a": 2}),
    ])
    def it_handles_various_inputs(items, expected):
        assert process(items) == expected
```

Naming convention: **`foo.py` ↔ `foo_test.py` colocated**. The legacy `test_foo.py` prefix also works (pytest discovers both with `python_files = ["*_test.py", "test_*.py"]`).

**Why colocated**: the test file sits next to its subject. Move the source file, the test moves with it. The directory hierarchy is the source hierarchy.

**`tests/` directory** holds integration tests, e2e tests, and shared fixtures. Unit tests live next to source.

**Async tests** — `asyncio_mode = "auto"` removes the `@pytest.mark.asyncio` decorator boilerplate:

```python
async def it_awaits_the_thing():
    result = await my_async_function()
    assert result == expected
```

With `asyncio_mode = "auto"`, async tests are picked up automatically. Reserve `@pytest.mark.asyncio` for the one-off case where you need a non-default loop scope or marker.

**Fixtures** in `conftest.py`. Prefer fixtures over inline `with patch(...)`:

```python
# tests/conftest.py
import pytest
from pathlib import Path

@pytest.fixture
def tmp_dir(tmp_path: Path) -> Path:
    return tmp_path

@pytest.fixture
def mock_external_api(mocker):
    api = mocker.patch("telelux.external.fetch")
    api.return_value = {"status": "ok"}
    return api
```

For mocking a streaming external service (LLM client, network stream), build a fixture that exposes `set_response`, `set_error`, `set_responses` so each test configures the mock declaratively.

**Coverage** with `pytest-cov`, `branch=true`, `fail_under` set per project — 85 is a reasonable floor; aiming for 100 forces tests for trivia.

## Test tiers

Three tiers, each independently runnable with its own recipe, per DESIGN's
testing convention (issue #5). Unit and integration are named CI steps. E2e
never runs in CI: it builds and installs the wheel, which is a local and
pre-release concern, and each branch that changes the package records an
attestation receipt instead (see the E2E section of `AGENTS.md`).

| Tier | Location | Command | Mocking |
| --- | --- | --- | --- |
| Unit | Colocated (`foo_test.py`) | `just test_unit` | Isolate dependencies as needed |
| Integration | `tests/integration/` | `just test_integration` | Targets the SDK, plus the installed `telelux` command in `cli_test.py`; mock LLM calls once those exist |
| E2e | `tests/e2e/` | `just test_e2e` | None: the installed wheel, offline, with no Node on `PATH` |

The e2e tier installs the built wheel into a fresh venv and runs its `telelux`
command with a `PATH` holding only that venv and `/usr/bin:/bin`, and a
throwaway `HOME`. `unshare -rn` is denied on GitHub runners and dev machines,
so networking is cut inside the interpreter instead: the venv gets
`tests/__fixtures__/sitecustomize.py`, which makes every non-`AF_UNIX`
connect and every DNS lookup raise `OSError`. The tier's first tests prove
the guard blocks a real connection, so the offline claim is not vacuous.

`testpaths` in `pyproject.toml` is scoped to `src` and the build hook's
colocated `hatch_build_test.py`, so a bare `pytest` (the unit tier) never picks up
`tests/integration` or `tests/e2e`. Those tiers run by passing the directory explicitly, which
overrides `testpaths`.

The integration tier exercises the packaged viewer, so it needs telelux-web
built (`pnpm --filter telelux-web build` from the repo root) before the
editable install copies it in. If the venv predates the build, run
`uv sync --reinstall-package telelux` to pick it up. It also drives Chromium
through Playwright to render exported HTML offline; run
`uv run playwright install chromium` once. `tests/` sits outside the
wheel's packaged directory (`src/telelux`), so no tier ships
in the built package.
