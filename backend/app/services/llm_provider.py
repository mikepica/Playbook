from __future__ import annotations

from typing import Any

from app.core.config import settings

Message = dict[str, Any]


class LLMProviderClient:
    """Facade for calling the configured LLM provider.

    The actual provider integrations can be added later. For now, this returns a
    deterministic placeholder response so the rest of the workflow can be tested
    without external dependencies.
    """

    def __init__(self) -> None:
        self.provider = settings.llm_provider

    def generate_reply(self, messages: list[Message]) -> str:
        """Return a placeholder response until real LLM integration is added."""

        last_user_message = next((m["content"] for m in reversed(messages) if m.get("role") == "user"), "")
        provider_label = "Azure OpenAI" if self.provider == "azure" else "OpenAI"
        return (
            f"[{provider_label} placeholder]\n"
            "This is where the AI response will appear once the provider integration is implemented.\n"
            f"Most recent user message: {last_user_message}"
        )


llm_client = LLMProviderClient()
