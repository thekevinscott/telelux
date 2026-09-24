from pathlib import Path

import telelux
from telelux import Telelux

fixtures = Path(__file__).parent.parent / "__fixtures__"


def describe_basic():
    def test_sdk_exposes_a_nonempty_version_string():
        assert isinstance(telelux.__version__, str)
        assert telelux.__version__

    def describe_sdk():
        def test_sdk_instantiates():
            assert Telelux() is not None

        def test_sdk_loads_transcript():
            transcript_path = fixtures / "three-lines.jsonl"
            viewer = Telelux(transcript_path)
            assert viewer.transcript == transcript_path
