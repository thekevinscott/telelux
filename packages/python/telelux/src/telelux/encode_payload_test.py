import base64
import gzip
import json
import re
from pathlib import Path

from .encode_payload import encode_payload

VECTOR = json.loads(
    (Path(__file__).parents[5] / "fixtures/link/v1.json").read_text(encoding="utf-8")
)


def unpad(payload):
    return base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))


def decode(payload):
    return gzip.decompress(unpad(payload))


def describe_encode_payload():
    def test_it_matches_the_shared_known_vector():
        assert encode_payload(VECTOR["text"]) == VECTOR["data"]

    def test_the_vector_is_gzip_of_the_utf8_text():
        assert unpad(VECTOR["data"]) == bytes.fromhex(VECTOR["gzip"])
        assert gzip.decompress(bytes.fromhex(VECTOR["gzip"])) == VECTOR["text"].encode()

    def test_it_pins_the_gzip_header_whatever_python_writes():
        header = unpad(encode_payload(""))[:10]
        assert header == bytes.fromhex("1f8b08000000000002ff")

    def test_it_round_trips_utf8_text():
        text = '{"text":"naïve ☕ 👋"}\r\n' * 50
        assert decode(encode_payload(text)).decode("utf-8") == text

    def test_it_uses_the_unpadded_base64url_alphabet():
        for length in range(12):
            assert re.fullmatch(r"[A-Za-z0-9_-]*", encode_payload("x" * length))

    def test_it_is_deterministic():
        assert encode_payload("same") == encode_payload("same")
