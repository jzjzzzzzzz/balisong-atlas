from abc import ABC, abstractmethod
from typing import TypeVar

from pydantic import BaseModel

SchemaT = TypeVar("SchemaT", bound=BaseModel)


class AIProvider(ABC):
    @abstractmethod
    async def generate_structured(self, prompt: str, schema: type[SchemaT]) -> SchemaT:
        raise NotImplementedError

    @abstractmethod
    async def analyze_image(self, image: bytes, prompt: str, schema: type[SchemaT]) -> SchemaT:
        raise NotImplementedError

    @abstractmethod
    async def embed_text(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError

    @abstractmethod
    async def health_check(self) -> dict[str, object]:
        raise NotImplementedError
