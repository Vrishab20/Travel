"""Application configuration using Pydantic Settings."""
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: str = Field(default="development")
    log_level: str = Field(default="INFO")

    llm_provider: str = Field(default="")
    llm_api_key: str = Field(default="")
    llm_model: str = Field(default="")

    flight_provider: str = Field(default="mock")
    flight_api_key: str = Field(default="")

    hotel_provider: str = Field(default="mock")
    hotel_api_key: str = Field(default="")

    places_provider: str = Field(default="mock")
    places_api_key: str = Field(default="")

    langgraph_checkpointer: str = Field(default="memory")

    frontend_origins: str = Field(default="http://localhost:3000")

    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.frontend_origins.split(",")]


settings = Settings()
