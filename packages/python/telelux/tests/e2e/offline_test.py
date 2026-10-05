import base64
import gzip
import os
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

PACKAGE = Path(__file__).parents[2]
TRANSCRIPT = PACKAGE / "tests/__fixtures__/three-lines.jsonl"
SLOT = '<script type="application/x-ndjson" id="transcript">'

# unshare -rn is denied on GitHub runners and dev machines, so the network is cut
# inside the interpreter: the installed venv runs this as its sitecustomize.
NETWORK_GUARD = """
import socket


def refuse(*args, **kwargs):
    raise OSError("networking is disabled in this environment")


def local_only(connect):
    def guarded(self, address):
        if self.family != socket.AF_UNIX:
            refuse()
        return connect(self, address)

    return guarded


socket.socket.connect = local_only(socket.socket.connect)
socket.socket.connect_ex = local_only(socket.socket.connect_ex)
socket.create_connection = refuse
socket.getaddrinfo = refuse
"""


@pytest.fixture(scope="session")
def offline(tmp_path_factory):
    root = tmp_path_factory.mktemp("offline")
    subprocess.run(
        ["uv", "build", "--wheel", "--out-dir", str(root / "dist")],
        cwd=PACKAGE,
        check=True,
        capture_output=True,
    )
    (wheel,) = (root / "dist").glob("*.whl")
    venv = root / "venv"
    python = venv / "bin/python"
    subprocess.run(
        ["uv", "venv", "--python", sys.executable, str(venv)],
        check=True,
        capture_output=True,
    )
    subprocess.run(
        ["uv", "pip", "install", "--python", str(python), str(wheel)],
        check=True,
        capture_output=True,
    )
    site_packages = subprocess.run(
        [str(python), "-c", "import sysconfig; print(sysconfig.get_path('purelib'))"],
        check=True,
        capture_output=True,
        encoding="utf-8",
    ).stdout.strip()
    (Path(site_packages) / "sitecustomize.py").write_text(
        NETWORK_GUARD, encoding="utf-8"
    )
    dirs = [str(venv / "bin")] + [
        d for d in ("/usr/bin", "/bin") if shutil.which("node", path=d) is None
    ]
    path = os.pathsep.join(dirs)
    assert shutil.which("node", path=path) is None
    home = root / "home"
    home.mkdir()
    return {"PATH": path, "HOME": str(home)}


def run(env, *args):
    return subprocess.run(
        list(args), env=env, capture_output=True, encoding="utf-8", check=False
    )


def decode(url):
    prefix, payload = url.split("#v=1&data=")
    assert prefix == "https://telelux.dev/"
    padded = payload + "=" * (-len(payload) % 4)
    return gzip.decompress(base64.urlsafe_b64decode(padded))


def describe_the_installed_wheel_offline():
    def describe_the_network_guard():
        def test_it_blocks_create_connection(offline):
            result = run(
                offline,
                "python",
                "-c",
                "import socket; socket.create_connection(('example.com', 80))",
            )
            assert result.returncode == 1
            assert "OSError: networking is disabled" in result.stderr

        def test_it_blocks_a_raw_connect(offline):
            result = run(
                offline,
                "python",
                "-c",
                "import socket; socket.socket().connect(('192.0.2.1', 80))",
            )
            assert result.returncode == 1
            assert "OSError: networking is disabled" in result.stderr

    def test_it_reports_its_installed_version(offline):
        result = run(
            offline,
            "python",
            "-c",
            "import telelux, importlib.metadata as m; "
            "assert telelux.__version__ == m.version('telelux'); "
            "print(telelux.__version__)",
        )
        assert result.returncode == 0, result.stderr
        assert result.stdout.strip()

    def test_out_writes_the_viewer_with_the_transcript_baked_in(offline, tmp_path):
        out = tmp_path / "session.html"
        result = run(offline, "telelux", str(TRANSCRIPT), "--out", str(out))
        assert result.returncode == 0, result.stderr
        assert result.stdout == f"{out}\n"
        assert result.stderr == ""
        html = out.read_text(encoding="utf-8")
        assert html.lower().startswith("<!doctype html>")
        assert html.rstrip().endswith("</html>")
        assert "telelux-transcript" in html
        assert f"{SLOT}{TRANSCRIPT.read_text(encoding='utf-8')}</script>" in html

    def test_url_prints_a_link_that_decodes_to_the_transcript(offline):
        result = run(offline, "telelux", str(TRANSCRIPT), "--url")
        assert result.returncode == 0, result.stderr
        assert result.stderr == ""
        link, end = result.stdout.split("\n")
        assert end == ""
        assert link.startswith("https://telelux.dev/#v=1&data=")
        assert decode(link) == TRANSCRIPT.read_bytes()
