from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    AI_PROXY_TOKEN: str = ""
    AI_PROXY_BASE_URL: str = "http://llm.codex.so"
    DEFAULT_TIMEOUT_SECONDS: float = 60.0
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: List[str] = ["*"]
    # If no token is provided or during tests, mock responses can be used
    MOCK_MODE_IF_NO_TOKEN: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

