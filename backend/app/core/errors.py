"""Core error types for the application."""
from typing import Any


class AppError(Exception):
    """Base exception for application errors."""

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        self.message = message
        self.details = details or {}
        super().__init__(message)


class ValidationError(AppError):
    """Invalid request or data validation failure."""

    pass


class NotFoundError(AppError):
    """Resource not found."""

    pass


class ProviderError(AppError):
    """External provider failure."""

    def __init__(
        self,
        message: str,
        provider: str,
        recoverable: bool = True,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, details)
        self.provider = provider
        self.recoverable = recoverable


class GraphStateError(AppError):
    """Invalid graph state transition."""

    pass


class CheckpointerError(AppError):
    """Checkpointer failure."""

    pass


class LLMError(AppError):
    """LLM structured output failure."""

    pass
