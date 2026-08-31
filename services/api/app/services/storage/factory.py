from pathlib import Path
from typing import Protocol

from app.core.config import get_settings
from app.services.storage.object_storage import LocalObjectStorage, ObjectStorage


class Storage(Protocol):
    async def put(self, content: bytes, mime_type: str) -> str: ...
    async def get(self, key: str) -> bytes: ...


def get_storage() -> Storage:
    settings = get_settings()
    if settings.s3_endpoint.startswith("file://"):
        return LocalObjectStorage(Path(settings.s3_endpoint.removeprefix("file://")))
    return ObjectStorage()
