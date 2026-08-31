from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    app_env: str = "development"
    app_secret: str = ""
    database_url: str = "sqlite+aiosqlite:///./data/atlas.db"
    public_base_url: str = "http://localhost:3000"
    api_base_url: str = "http://localhost:8000"
    s3_endpoint: str = "http://localhost:9000"
    s3_region: str = "us-east-1"
    s3_bucket: str = "balisong-atlas"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = ""
    s3_force_path_style: bool = True
    ai_mode: str = "mock"
    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = "mock-evidence-v1"
    vision_model: str = "mock-vision-v1"
    embedding_model: str = ""
    embedding_dim: int = 1536
    embedding_enabled: bool = False
    blender_bin: str = ""
    trusted_domains: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["example.org", "iiif.io"]
    )
    max_upload_bytes: int = 26_214_400
    max_fetch_bytes: int = 20_971_520
    session_cookie_name: str = "atlas_session"
    csrf_cookie_name: str = "atlas_csrf"
    session_max_age_seconds: int = 43_200

    @field_validator("trusted_domains", mode="before")
    @classmethod
    def parse_domains(cls, value: object) -> object:
        if isinstance(value, str):
            return [part.strip().lower() for part in value.split(",") if part.strip()]
        return value

    @model_validator(mode="after")
    def validate_secrets_and_ai_mode(self) -> "Settings":
        if self.production and len(self.app_secret) < 32:
            raise ValueError("APP_SECRET must contain at least 32 characters in production")
        if self.ai_mode not in {"mock", "live"}:
            raise ValueError("AI_MODE must be mock or live")
        if self.ai_mode == "live" and (not self.llm_base_url or not self.llm_api_key):
            raise ValueError("Live AI mode requires LLM_BASE_URL and LLM_API_KEY")
        if not self.llm_model:
            if self.ai_mode == "live":
                raise ValueError("LLM_MODEL is required in live AI mode")
            self.llm_model = "mock-evidence-v1"
        if not self.vision_model:
            self.vision_model = self.llm_model if self.ai_mode == "live" else "mock-vision-v1"
        if not self.embedding_model:
            if self.embedding_enabled and self.ai_mode == "live":
                raise ValueError("EMBEDDING_MODEL is required when live embeddings are enabled")
            self.embedding_model = "mock-embedding-v1"
        return self

    @property
    def production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
