import pytest

from app.core.errors import AtlasError
from app.services.ingestion.upload_validation import normalize_filename, validate_upload
from app.services.ingestion.url_safety import validate_external_url


async def public_resolver(host: str) -> list[str]:
    del host
    return ["93.184.216.34"]


async def private_resolver(host: str) -> list[str]:
    del host
    return ["127.0.0.1"]


def test_filename_normalization_and_pdf_sniffing() -> None:
    upload = validate_upload("../../weird 名称.pdf", "application/pdf", b"%PDF-1.4\nfixture", 1000)
    assert upload.filename == "weird __.pdf"
    assert upload.mime_type == "application/pdf"
    assert ".." not in normalize_filename("../../x.pdf")


def test_svg_rejected_by_default() -> None:
    with pytest.raises(AtlasError, match="SVG"):
        validate_upload("x.svg", "image/svg+xml", b"<svg></svg>", 1000)


def test_mime_mismatch_rejected() -> None:
    with pytest.raises(AtlasError, match="MIME"):
        validate_upload("fake.png", "image/png", b"%PDF-1.4\n", 1000)


@pytest.mark.asyncio
async def test_localhost_and_metadata_service_blocked() -> None:
    for url in ("http://localhost/item", "http://169.254.169.254/latest/meta-data"):
        with pytest.raises(AtlasError):
            await validate_external_url(url, trusted_domains=[], administrator_approved=True, resolver=public_resolver)


@pytest.mark.asyncio
async def test_private_dns_result_blocked() -> None:
    with pytest.raises(AtlasError, match="non-public"):
        await validate_external_url("https://trusted.example/item", trusted_domains=["trusted.example"], resolver=private_resolver)


@pytest.mark.asyncio
async def test_untrusted_domain_needs_explicit_approval() -> None:
    with pytest.raises(AtlasError, match="approval"):
        await validate_external_url("https://other.example/item", trusted_domains=["trusted.example"], resolver=public_resolver)


@pytest.mark.asyncio
async def test_redirect_target_is_revalidated_and_blocked() -> None:
    # The fetcher calls this validator on every redirect target; this exercises the second-hop gate.
    with pytest.raises(AtlasError):
        await validate_external_url("http://127.0.0.1/redirected", trusted_domains=[], administrator_approved=True, resolver=private_resolver)
