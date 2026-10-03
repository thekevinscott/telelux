from unittest.mock import patch

import pytest

from .build_link import LINK_PREFIX, MAX_LINK_CHARS, MAX_LINK_TEXT_BYTES, build_link


@pytest.fixture
def encode_payload():
    with patch("telelux.build_link.encode_payload") as encode_payload:
        encode_payload.return_value = "PAYLOAD"
        yield encode_payload


def payload_for_link_of(length):
    return "a" * (length - len(LINK_PREFIX))


def describe_build_link():
    def test_the_viewer_is_canonical_at_the_telelux_root():
        assert LINK_PREFIX == "https://telelux.dev/#v=1&data="

    def test_it_appends_the_encoded_text_to_the_prefix(encode_payload):
        assert build_link("text") == "https://telelux.dev/#v=1&data=PAYLOAD"
        encode_payload.assert_called_once_with("text")

    def describe_the_link_length_limit():
        def test_it_is_8000_characters():
            assert MAX_LINK_CHARS == 8000

        @pytest.mark.parametrize("length", [7999, 8000])
        def test_it_allows_links_up_to_the_limit(encode_payload, length):
            encode_payload.return_value = payload_for_link_of(length)
            assert len(build_link("text")) == length

        def test_it_refuses_a_longer_link_naming_the_alternatives(encode_payload):
            encode_payload.return_value = payload_for_link_of(8001)
            with pytest.raises(ValueError) as error:
                build_link("text")
            assert str(error.value) == (
                "The link would be 8001 characters, over the 8000-character limit. "
                "Export the transcript as baked HTML instead, or host the .jsonl "
                "file and share https://telelux.dev/#v=1&data=<transcript-url>."
            )

    def describe_the_text_size_limit():
        def test_it_is_10_mib():
            assert MAX_LINK_TEXT_BYTES == 10 * 1024 * 1024

        def test_it_counts_utf8_bytes_and_allows_text_at_the_limit(encode_payload):
            text = "é" * (MAX_LINK_TEXT_BYTES // 2)
            build_link(text)
            encode_payload.assert_called_once_with(text)

        def test_it_refuses_larger_text_before_compressing_it(encode_payload):
            with pytest.raises(ValueError) as error:
                build_link("é" * (MAX_LINK_TEXT_BYTES // 2) + "a")
            assert str(error.value) == (
                "The transcript is 10485761 bytes, over the 10485760-byte (10 MiB) "
                "limit for a link. Export the transcript as baked HTML instead, or "
                "host the .jsonl file and share "
                "https://telelux.dev/#v=1&data=<transcript-url>."
            )
            encode_payload.assert_not_called()
