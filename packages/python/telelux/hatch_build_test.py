from unittest.mock import MagicMock, call, patch

import pytest

from hatch_build import ViewerAssetHook

BUILT = "packages/node/telelux-web/dist/viewer.html"
ASSET = "src/telelux/_assets/viewer.html"


@pytest.fixture
def run():
    with patch("hatch_build.subprocess.run") as run:
        yield run


@pytest.fixture
def workspace(tmp_path):
    (tmp_path / "pnpm-workspace.yaml").write_text("packages: []\n")
    (tmp_path / "package.json").write_text('{"packageManager": "pnpm@10.33.0"}')
    (tmp_path / "packages/python/telelux").mkdir(parents=True)
    return tmp_path


def hook_at(root, target="wheel"):
    return ViewerAssetHook(
        str(root), {}, MagicMock(), MagicMock(), str(root), target, MagicMock()
    )


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


def describe_ViewerAssetHook():
    def test_it_registers_as_the_custom_hook():
        assert ViewerAssetHook.PLUGIN_NAME == "custom"

    def describe_when_the_viewer_is_built():
        def test_it_copies_the_viewer_into_the_package(workspace, run):
            write(workspace / BUILT, "<html>viewer</html>")
            root = workspace / "packages/python/telelux"
            hook_at(root).initialize("standard", {})
            assert (root / ASSET).read_text() == "<html>viewer</html>"
            run.assert_not_called()

        def test_it_replaces_a_stale_copy(workspace, run):
            write(workspace / BUILT, "fresh")
            root = workspace / "packages/python/telelux"
            write(root / ASSET, "stale")
            hook_at(root).initialize("standard", {})
            assert (root / ASSET).read_text() == "fresh"

        def test_it_copies_for_an_editable_install(workspace, run):
            write(workspace / BUILT, "fresh")
            root = workspace / "packages/python/telelux"
            hook_at(root).initialize("editable", {})
            assert (root / ASSET).read_text() == "fresh"

    def describe_when_the_viewer_is_not_built_in_the_workspace():
        def test_it_builds_it_with_the_pinned_pnpm(workspace, run):
            def pnpm_run(args, **_kwargs):
                if args[-1] == "build":
                    write(workspace / BUILT, "built now")

            run.side_effect = pnpm_run
            root = workspace / "packages/python/telelux"
            hook_at(root).initialize("standard", {})
            pnpm = ["npx", "--yes", "pnpm@10.33.0"]
            assert run.call_args_list == [
                call(
                    [*pnpm, "install", "--frozen-lockfile"], cwd=workspace, check=True
                ),
                call(
                    [*pnpm, "--filter", "telelux-web", "build"],
                    cwd=workspace,
                    check=True,
                ),
            ]
            assert (root / ASSET).read_text() == "built now"

        def test_it_leaves_an_editable_install_alone(workspace, run):
            root = workspace / "packages/python/telelux"
            hook_at(root).initialize("editable", {})
            run.assert_not_called()
            assert not (root / ASSET).exists()

    def describe_when_building_from_an_sdist():
        def test_it_keeps_the_copy_the_sdist_carries(tmp_path, run):
            root = tmp_path / "telelux-1.0.0"
            write(root / ASSET, "from the sdist")
            hook_at(root).initialize("standard", {})
            run.assert_not_called()
            assert (root / ASSET).read_text() == "from the sdist"

        def test_it_fails_naming_the_fix_when_there_is_no_copy(tmp_path, run):
            root = tmp_path / "telelux-1.0.0"
            root.mkdir()
            with pytest.raises(
                FileNotFoundError, match="pnpm --filter telelux-web build"
            ):
                hook_at(root).initialize("standard", {})
            run.assert_not_called()
