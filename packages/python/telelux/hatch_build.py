import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class ViewerAssetHook(BuildHookInterface):
    """Ship telelux-web's built viewer.html inside the package.

    The release build runs inside a reusable workflow with no pre-build step,
    so a standard build in the workspace builds the viewer itself when it is
    missing. A build from an sdist has no workspace and uses the copy the sdist
    carries. An editable install copies what is there and never builds.
    """

    PLUGIN_NAME = "custom"

    def initialize(self, version: str, build_data: dict[str, Any]) -> None:
        root = Path(self.root)
        workspace = (root / "../../..").resolve()
        built = workspace / "packages/node/telelux-web/dist/viewer.html"
        asset = root / "src/telelux/_assets/viewer.html"
        standard = version != "editable"
        if (
            standard
            and not built.is_file()
            and (workspace / "pnpm-workspace.yaml").is_file()
        ):
            self.build_viewer(workspace)
        if built.is_file():
            asset.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(built, asset)
        if standard and not asset.is_file():
            raise FileNotFoundError(
                f"{asset} is missing and there is no workspace to build it from. "
                "From the repository root, run `pnpm install && pnpm --filter telelux-web build`, "
                "then build again."
            )

    def build_viewer(self, workspace: Path) -> None:
        manifest = json.loads((workspace / "package.json").read_text(encoding="utf-8"))
        pnpm = ["npx", "--yes", manifest["packageManager"]]
        self.app.display_info("Building telelux-web's viewer.html for the package")
        subprocess.run(
            [*pnpm, "install", "--frozen-lockfile"], cwd=workspace, check=True
        )
        subprocess.run(
            [*pnpm, "--filter", "telelux-web", "build"], cwd=workspace, check=True
        )
