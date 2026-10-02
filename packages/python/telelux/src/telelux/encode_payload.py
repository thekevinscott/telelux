import base64
import gzip


def encode_payload(text: str) -> str:
    compressed = gzip.compress(text.encode("utf-8"), mtime=0)
    return base64.urlsafe_b64encode(compressed).rstrip(b"=").decode("ascii")
