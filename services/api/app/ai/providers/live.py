import base64
import json
from io import BytesIO
from typing import Any

import httpx
from PIL import Image
from pydantic import ValidationError

from app.ai.prompts.loader import load_prompt
from app.ai.providers.base import AIProvider, SchemaT
from app.core.config import get_settings


class LiveOpenAICompatibleProvider(AIProvider):
    def __init__(self) -> None:
        self.settings = get_settings()
        if not self.settings.llm_base_url or not self.settings.llm_api_key:
            raise ValueError("Live AI mode requires LLM_BASE_URL and LLM_API_KEY")

    async def _request_structured(
        self,
        user_content: str | list[dict[str, Any]],
        schema: type[SchemaT],
        *,
        model: str,
    ) -> SchemaT:
        last_error = ""
        repair_note = ""
        for _attempt in range(3):
            system_prompt = load_prompt("system_guardrail.v1.txt")
            content: str | list[dict[str, Any]]
            if isinstance(user_content, str):
                content = user_content + repair_note
            else:
                content = [*user_content]
                if repair_note:
                    content.append({"type": "text", "text": repair_note})
            payload = {
                "model": model,
                "temperature": 0,
                "messages": [
                    {"role": "system", "content": system_prompt.text},
                    {"role": "user", "content": content},
                ],
                "response_format": {"type": "json_schema", "json_schema": {"name": schema.__name__, "strict": True, "schema": schema.model_json_schema()}},
            }
            timeout = httpx.Timeout(60.0, connect=10.0, read=60.0, write=30.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    self.settings.llm_base_url.rstrip("/") + "/chat/completions",
                    headers={"Authorization": f"Bearer {self.settings.llm_api_key}"},
                    json=payload,
                )
                response.raise_for_status()
            raw_content = response.json()["choices"][0]["message"]["content"]
            if not isinstance(raw_content, str):
                raise ValueError("Structured response content must be a JSON string")
            try:
                return schema.model_validate(json.loads(raw_content))
            except (ValidationError, json.JSONDecodeError) as exc:
                last_error = str(exc)
                repair_note = "\nPrevious output failed schema validation. Repair it without adding facts."
        raise ValueError(f"Structured output validation failed after two repairs: {last_error[:500]}")

    async def generate_structured(self, prompt: str, schema: type[SchemaT]) -> SchemaT:
        return await self._request_structured(
            prompt,
            schema,
            model=self.settings.llm_model,
        )

    async def analyze_image(self, image: bytes, prompt: str, schema: type[SchemaT]) -> SchemaT:
        with Image.open(BytesIO(image)) as opened:
            image_format = (opened.format or "PNG").lower()
        mime = "image/jpeg" if image_format in {"jpg", "jpeg"} else f"image/{image_format}"
        encoded = base64.b64encode(image).decode("ascii")
        user_content: list[dict[str, Any]] = [
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime};base64,{encoded}", "detail": "high"},
            },
        ]
        return await self._request_structured(
            user_content,
            schema,
            model=self.settings.vision_model or self.settings.llm_model,
        )

    async def embed_text(self, texts: list[str]) -> list[list[float]]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.settings.llm_base_url.rstrip("/") + "/embeddings",
                headers={"Authorization": f"Bearer {self.settings.llm_api_key}"},
                json={"model": self.settings.embedding_model, "input": texts},
            )
            response.raise_for_status()
        return [item["embedding"] for item in response.json()["data"]]

    async def health_check(self) -> dict[str, object]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    self.settings.llm_base_url.rstrip("/") + "/models",
                    headers={"Authorization": f"Bearer {self.settings.llm_api_key}"},
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            return {
                "available": False,
                "mode": "live",
                "error_type": type(exc).__name__,
                "api_key_exposed": False,
            }
        return {
            "available": True,
            "mode": "live",
            "base_url_configured": True,
            "api_key_exposed": False,
        }
