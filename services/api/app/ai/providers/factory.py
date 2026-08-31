from app.ai.providers.base import AIProvider
from app.ai.providers.live import LiveOpenAICompatibleProvider
from app.ai.providers.mock import MockAIProvider
from app.core.config import get_settings


def get_ai_provider() -> AIProvider:
    return LiveOpenAICompatibleProvider() if get_settings().ai_mode == "live" else MockAIProvider()
