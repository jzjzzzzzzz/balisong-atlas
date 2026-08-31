import hashlib
import re
from dataclasses import dataclass
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse


@dataclass(frozen=True)
class SourceFingerprint:
    canonical_url: str
    content_hash: str
    normalized_title: str
    quoted_origin: str = ""


def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    query = urlencode(sorted((k, v) for k, v in parse_qsl(parsed.query) if not k.lower().startswith("utm_")))
    return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), parsed.path.rstrip("/"), "", query, ""))


def normalize_title(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", title.lower()).strip()


def source_family_key(source: SourceFingerprint) -> str:
    if source.quoted_origin:
        basis = "origin:" + normalize_url(source.quoted_origin)
    elif source.content_hash:
        basis = "content:" + source.content_hash.lower()
    elif source.canonical_url:
        basis = "url:" + normalize_url(source.canonical_url)
    else:
        basis = "title:" + normalize_title(source.normalized_title)
    return hashlib.sha256(basis.encode()).hexdigest()[:24]


def group_source_families(sources: list[SourceFingerprint]) -> dict[str, list[int]]:
    groups: dict[str, list[int]] = {}
    for index, source in enumerate(sources):
        groups.setdefault(source_family_key(source), []).append(index)
    return groups
