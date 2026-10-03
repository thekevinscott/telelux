import base64
import struct
import zlib

GZIP_HEADER = b"\x1f\x8b\x08\x00\x00\x00\x00\x00\x02\xff"


def encode_payload(text: str) -> str:
    data = text.encode("utf-8")
    deflate = zlib.compressobj(9, zlib.DEFLATED, -zlib.MAX_WBITS)
    body = deflate.compress(data) + deflate.flush()
    trailer = struct.pack("<II", zlib.crc32(data), len(data))
    compressed = GZIP_HEADER + body + trailer
    return base64.urlsafe_b64encode(compressed).rstrip(b"=").decode("ascii")
