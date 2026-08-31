import asyncio
from dataclasses import dataclass
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import httpx

from app.core.errors import AtlasError
from app.services.ingestion.url_safety import validate_external_url


@dataclass(frozen=True)
class FetchResult:
    final_url: str
    status_code: int
    headers: dict[str, str]
    content: bytes
    mime_type: str


USER_AGENT = "BalisongAtlasResearchBot/0.1"


async def _enforce_robots(client: httpx.AsyncClient, target_url: str) -> None:
    parsed = urlparse(target_url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    async with client.stream("GET", robots_url) as response:
        if response.status_code == 404:
            return
        if response.status_code != 200:
            raise AtlasError(
                "robots_unavailable",
                "The site's robots policy could not be verified; fetch was not attempted",
            )
        chunks: list[bytes] = []
        total = 0
        async for chunk in response.aiter_bytes():
            total += len(chunk)
            if total > 524_288:
                raise AtlasError("robots_too_large", "The site's robots policy is too large")
            chunks.append(chunk)
    parser = RobotFileParser(robots_url)
    parser.parse(b"".join(chunks).decode("utf-8", errors="replace").splitlines())
    if not parser.can_fetch(USER_AGENT, target_url):
        raise AtlasError("robots_disallowed", "The site's robots policy disallows this fetch")


async def fetch_approved_url(
    url: str,
    *,
    trusted_domains: list[str],
    administrator_approved: bool,
    max_bytes: int,
    max_redirects: int = 5,
) -> FetchResult:
    try:
        async with asyncio.timeout(45):
            return await _fetch_with_validated_redirects(
                url,
                trusted_domains=trusted_domains,
                administrator_approved=administrator_approved,
                max_bytes=max_bytes,
                max_redirects=max_redirects,
            )
    except TimeoutError as exc:
        raise AtlasError("fetch_timeout", "URL fetch exceeded the total timeout", 504) from exc


async def _fetch_with_validated_redirects(
    url: str,
    *,
    trusted_domains: list[str],
    administrator_approved: bool,
    max_bytes: int,
    max_redirects: int,
) -> FetchResult:
    current = url
    approved_hostname = (urlparse(url).hostname or "").rstrip(".").lower()
    timeout = httpx.Timeout(connect=5.0, read=15.0, write=5.0, pool=5.0)
    checked_origins: set[str] = set()
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=False, headers={"User-Agent": USER_AGENT}) as client:
        for redirect_count in range(max_redirects + 1):
            await validate_external_url(
                current,
                trusted_domains=trusted_domains,
                administrator_approved=(
                    administrator_approved
                    and (urlparse(current).hostname or "").rstrip(".").lower()
                    == approved_hostname
                ),
            )
            parsed_current = urlparse(current)
            origin = f"{parsed_current.scheme}://{parsed_current.netloc}"
            if origin not in checked_origins:
                await _enforce_robots(client, current)
                checked_origins.add(origin)
            async with client.stream("GET", current) as response:
                if response.status_code in {301, 302, 303, 307, 308}:
                    location = response.headers.get("location")
                    if not location or redirect_count == max_redirects:
                        raise AtlasError("redirect_limit", "URL redirect validation failed")
                    current = urljoin(current, location)
                    continue
                response.raise_for_status()
                mime = response.headers.get("content-type", "application/octet-stream").split(";", 1)[0].lower()
                if mime not in {"application/pdf", "text/html", "text/plain", "image/jpeg", "image/png", "application/json", "application/ld+json"}:
                    raise AtlasError("unsupported_remote_mime", f"Remote MIME type is not supported: {mime}")
                chunks: list[bytes] = []
                total = 0
                async for chunk in response.aiter_bytes():
                    total += len(chunk)
                    if total > max_bytes:
                        raise AtlasError("remote_body_too_large", "Remote response exceeds the configured limit", 413)
                    chunks.append(chunk)
                return FetchResult(current, response.status_code, dict(response.headers), b"".join(chunks), mime)
    raise AtlasError("fetch_failed", "URL fetch did not complete")
