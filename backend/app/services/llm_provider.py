from __future__ import annotations

from typing import Any

from openai import APIError, AzureOpenAI, OpenAI, OpenAIError

from app.core.config import Settings, settings

Message = dict[str, Any]


class LLMProviderClient:
    """Facade for calling the configured LLM provider."""

    def __init__(self, app_settings: Settings | None = None) -> None:
        self.settings = app_settings or settings
        self.provider = self.settings.llm_provider
        self.client, self.model = self._build_client()

    def _build_client(self) -> tuple[OpenAI | AzureOpenAI, str]:
        if self.provider == "azure":
            if not self.settings.azure_openai_api_key:
                raise RuntimeError("Azure OpenAI API key is not configured.")
            if not self.settings.azure_openai_endpoint:
                raise RuntimeError("Azure OpenAI endpoint is not configured.")

            client = AzureOpenAI(
                api_key=self.settings.azure_openai_api_key,
                api_version=self.settings.azure_openai_api_version,
                azure_endpoint=self.settings.azure_openai_endpoint,
            )
            return client, self.settings.azure_openai_deployment_name

        if not self.settings.openai_api_key:
            raise RuntimeError("OpenAI API key is not configured.")

        client = OpenAI(api_key=self.settings.openai_api_key)
        return client, self.settings.openai_model

    def generate_reply(self, messages: list[Message]) -> str:
        """Generate a reply from the configured LLM provider."""

        if not messages:
            raise ValueError("At least one message is required to generate a reply.")

        chat_messages = [
            {"role": entry.get("role"), "content": entry.get("content", "")}
            for entry in messages
            if entry.get("role") in {"system", "user", "assistant"}
        ]

        if not chat_messages:
            raise ValueError("No valid chat messages provided for the LLM call.")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=chat_messages,
                temperature=0.2,
            )
        except (APIError, OpenAIError) as exc:
            raise RuntimeError(f"Failed to generate LLM reply: {exc}") from exc

        if not response.choices:
            raise RuntimeError("LLM response did not contain any choices.")

        message = response.choices[0].message
        content = getattr(message, "content", None)
        if not content:
            raise RuntimeError("LLM response choice did not include text content.")

        return content.strip()


llm_client = LLMProviderClient()
