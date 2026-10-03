import base64
import gzip
import json
import random
from pathlib import Path

import pytest

from telelux import Telelux

FIXTURES = Path(__file__).parents[5] / "fixtures"
VECTOR = json.loads((FIXTURES / "link/v1.json").read_text(encoding="utf-8"))


def decode(url):
    prefix, payload = url.split("#v=1&data=")
    assert prefix == "https://telelux.dev/"
    padded = payload + "=" * (-len(payload) % 4)
    return gzip.decompress(base64.urlsafe_b64decode(padded)).decode("utf-8")


def describe_Telelux_url():
    def test_it_encodes_the_shared_known_vector(tmp_path):
        transcript = tmp_path / "vector.jsonl"
        transcript.write_bytes(VECTOR["text"].encode("utf-8"))
        assert (
            Telelux(transcript).url == f"https://telelux.dev/#v=1&data={VECTOR['data']}"
        )

    def test_it_round_trips_the_shared_corpus():
        sample = FIXTURES / "claude-code/sample.jsonl"
        assert decode(Telelux(sample).url) == sample.read_text(encoding="utf-8")

    def test_it_describes_the_snapshot_not_the_edited_file(tmp_path):
        transcript = tmp_path / "session.jsonl"
        transcript.write_text('{"a":1}\n', encoding="utf-8")
        viewer = Telelux(transcript)
        transcript.write_text('{"edited":true}\n', encoding="utf-8")
        assert decode(viewer.url) == '{"a":1}\n'

    def test_it_refuses_a_transcript_too_big_for_a_link(tmp_path):
        transcript = tmp_path / "noisy.jsonl"
        noise = random.Random(0).randbytes(6000).hex()
        transcript.write_text(json.dumps({"noise": noise}) + "\n", encoding="utf-8")
        with pytest.raises(ValueError, match="over the 8000-character limit"):
            _ = Telelux(transcript).url
