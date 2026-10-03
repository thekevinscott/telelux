import os
import subprocess
import sys
import tarfile
import zipfile
from pathlib import Path

import pytest

PACKAGE = Path(__file__).parents[2]
VIEWER = PACKAGE.parents[1] / "node/telelux-web/dist/viewer.html"


@pytest.fixture(scope="module")
def dist(tmp_path_factory):
    out = tmp_path_factory.mktemp("dist")
    subprocess.run(["uv", "build", "--out-dir", str(out)], cwd=PACKAGE, check=True)
    return out


def describe_packaging():
    def test_the_wheel_ships_the_built_viewer(dist):
        (wheel,) = dist.glob("*.whl")
        with zipfile.ZipFile(wheel) as archive:
            shipped = archive.read("telelux/_assets/viewer.html")
        assert shipped == VIEWER.read_bytes()

    def test_the_sdist_ships_the_built_viewer(dist):
        (sdist,) = dist.glob("*.tar.gz")
        with tarfile.open(sdist) as archive:
            (member,) = [
                m
                for m in archive.getmembers()
                if m.name.endswith("_assets/viewer.html")
            ]
            shipped = archive.extractfile(member).read()
        assert shipped == VIEWER.read_bytes()

    def test_the_installed_package_reads_it_through_importlib_resources(dist):
        (wheel,) = dist.glob("*.whl")
        script = (
            "import telelux, sys\n"
            "from telelux.read_viewer_html import read_viewer_html\n"
            "assert telelux.__file__.startswith(sys.argv[1]), telelux.__file__\n"
            "sys.stdout.write(read_viewer_html())\n"
        )
        result = subprocess.run(
            [sys.executable, "-c", script, str(wheel)],
            env={**os.environ, "PYTHONPATH": str(wheel)},
            capture_output=True,
            encoding="utf-8",
            check=True,
        )
        assert result.stdout == VIEWER.read_text(encoding="utf-8")
