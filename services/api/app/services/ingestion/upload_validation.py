import re
from dataclasses import dataclass
from pathlib import PurePath

from app.core.errors import AtlasError

ALLOWED_MIME = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain",
    "text/markdown",
    "text/html",
}


@dataclass(frozen=True)
class ValidatedUpload:
    filename: str
    mime_type: str
    content: bytes


def normalize_filename(filename: str) -> str:
    name = PurePath(filename.replace("\\", "/")).name
    name = re.sub(r"[^A-Za-z0-9._ -]", "_", name).strip(". ")
    return name[:180] or "upload"


def sniff_mime(content: bytes) -> str:
    head = content[:512].lstrip()
    if content.startswith(b"%PDF-"):
        return "application/pdf"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return "image/webp"
    lowered = head.lower()
    if lowered.startswith(b"<svg") or b"<svg" in lowered[:200]:
        return "image/svg+xml"
    if lowered.startswith((b"<!doctype html", b"<html")):
        return "text/html"
    try:
        content.decode("utf-8")
        return "text/plain"
    except UnicodeDecodeError:
        return "application/octet-stream"


def validate_upload(filename: str, declared_mime: str, content: bytes, max_bytes: int) -> ValidatedUpload:
    if not content:
        raise AtlasError("empty_upload", "The uploaded file is empty")
    if len(content) > max_bytes:
        raise AtlasError("upload_too_large", "The uploaded file exceeds the configured limit", 413)
    sniffed = sniff_mime(content)
    if sniffed == "image/svg+xml":
        raise AtlasError("svg_rejected", "SVG uploads are rejected by default")
    if sniffed not in ALLOWED_MIME:
        raise AtlasError("unsupported_mime", f"Unsupported detected MIME type: {sniffed}", 415)
    normalized_declared = declared_mime.split(";", 1)[0].strip().lower()
    if (
        normalized_declared
        and normalized_declared not in {sniffed, "application/octet-stream"}
        and not (sniffed == "text/plain" and normalized_declared == "text/markdown")
    ):
        raise AtlasError("mime_mismatch", "Declared and detected MIME types do not match", 415)
    return ValidatedUpload(normalize_filename(filename), sniffed, content)
