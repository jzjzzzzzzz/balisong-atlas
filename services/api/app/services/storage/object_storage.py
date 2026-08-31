import asyncio
import hashlib
from pathlib import Path

import boto3
from botocore.config import Config

from app.core.config import get_settings


class ObjectStorage:
    def __init__(self) -> None:
        settings = get_settings()
        self.bucket = settings.s3_bucket
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            region_name=settings.s3_region,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            config=Config(
                s3={
                    "addressing_style": "path" if settings.s3_force_path_style else "auto"
                }
            ),
        )

    @staticmethod
    def key_for(content: bytes) -> str:
        digest = hashlib.sha256(content).hexdigest()
        return f"sha256/{digest[:2]}/{digest[2:4]}/{digest}"

    async def put(self, content: bytes, mime_type: str) -> str:
        key = self.key_for(content)
        await asyncio.to_thread(
            self.client.put_object,
            Bucket=self.bucket,
            Key=key,
            Body=content,
            ContentType=mime_type,
        )
        return key

    async def get(self, key: str) -> bytes:
        response = await asyncio.to_thread(self.client.get_object, Bucket=self.bucket, Key=key)
        return await asyncio.to_thread(response["Body"].read)

    async def signed_url(self, key: str, expires_seconds: int = 300) -> str:
        return await asyncio.to_thread(
            self.client.generate_presigned_url,
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_seconds,
        )


class LocalObjectStorage:
    def __init__(self, root: Path) -> None:
        self.root = root

    @staticmethod
    def key_for(content: bytes) -> str:
        digest = hashlib.sha256(content).hexdigest()
        return f"sha256/{digest[:2]}/{digest[2:4]}/{digest}"

    async def put(self, content: bytes, mime_type: str) -> str:
        del mime_type
        key = self.key_for(content)
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return key

    async def get(self, key: str) -> bytes:
        return (self.root / key).read_bytes()
