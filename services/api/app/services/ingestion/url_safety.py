import asyncio
import ipaddress
import socket
from collections.abc import Awaitable, Callable
from urllib.parse import urlparse

from app.core.errors import AtlasError

Resolver = Callable[[str], Awaitable[list[str]]]
BLOCKED_HOSTS = {"localhost", "localhost.localdomain", "metadata.google.internal", "169.254.169.254"}


async def system_resolver(hostname: str) -> list[str]:
    records = await asyncio.to_thread(socket.getaddrinfo, hostname, None, type=socket.SOCK_STREAM)
    return sorted({str(record[4][0]) for record in records})


def is_public_ip(address: str) -> bool:
    ip = ipaddress.ip_address(address)
    return not (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


async def validate_external_url(
    url: str,
    *,
    trusted_domains: list[str],
    administrator_approved: bool = False,
    resolver: Resolver = system_resolver,
) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise AtlasError("unsafe_url", "Only absolute HTTP(S) URLs are allowed")
    hostname = parsed.hostname.rstrip(".").lower()
    if hostname in BLOCKED_HOSTS:
        raise AtlasError("unsafe_url", "Local and metadata-service hosts are blocked")
    trusted = any(hostname == item or hostname.endswith("." + item) for item in trusted_domains)
    if not trusted and not administrator_approved:
        raise AtlasError("domain_approval_required", "Domain is not trusted; administrator approval is required")
    try:
        addresses = await resolver(hostname)
    except OSError as exc:
        raise AtlasError("dns_failure", "The URL host could not be resolved") from exc
    if not addresses or any(not is_public_ip(address) for address in addresses):
        raise AtlasError("unsafe_url", "The URL resolves to a non-public network address")
    return url
