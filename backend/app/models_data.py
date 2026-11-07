from typing import Dict, List
from pydantic import BaseModel


class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    input_cost_per_1m: float   # USD per 1M prompt tokens
    output_cost_per_1m: float  # USD per 1M completion tokens
    supports_thinking: bool = False
    description: str = ""
    is_default: bool = False


# Catalog of supported models with real-world market pricing for metric calculations
MODELS_CATALOG: Dict[str, ModelInfo] = {
    "claude-haiku-3-5": ModelInfo(
        id="claude-haiku-3-5",
        name="Claude Haiku 3.5",
        provider="Anthropic",
        input_cost_per_1m=0.80,
        output_cost_per_1m=4.00,
        supports_thinking=True,
        description="Быстрая и точная компактная модель от Anthropic с рассуждениями",
        is_default=True,
    ),
    "yandexgpt-5-lite": ModelInfo(
        id="yandexgpt-5-lite",
        name="YandexGPT 5 Lite",
        provider="Яндекс",
        input_cost_per_1m=0.20,
        output_cost_per_1m=0.40,
        supports_thinking=False,
        description="Компактная русскоязычная модель от Яндекса",
        is_default=True,
    ),
    "gigachat-2": ModelInfo(
        id="gigachat-2",
        name="GigaChat 2",
        provider="Сбер",
        input_cost_per_1m=0.25,
        output_cost_per_1m=0.50,
        supports_thinking=False,
        description="Модель от Сбера для генерации текста и кода",
        is_default=True,
    ),
    "gpt-4o-mini": ModelInfo(
        id="gpt-4o-mini",
        name="GPT-4o mini",
        provider="OpenAI",
        input_cost_per_1m=0.15,
        output_cost_per_1m=0.60,
        supports_thinking=False,
        description="Эффективная и экономичная флагманская мини-модель OpenAI",
        is_default=False,
    ),
    "gemini-1-5-flash": ModelInfo(
        id="gemini-1-5-flash",
        name="Gemini 1.5 Flash",
        provider="Google",
        input_cost_per_1m=0.075,
        output_cost_per_1m=0.30,
        supports_thinking=False,
        description="Сверхбыстрая и недорогая мультимодальная модель от Google",
        is_default=False,
    ),
    "deepseek-chat": ModelInfo(
        id="deepseek-chat",
        name="DeepSeek V3",
        provider="DeepSeek",
        input_cost_per_1m=0.14,
        output_cost_per_1m=0.28,
        supports_thinking=True,
        description="Высокопроизводительная модель с открытым кодом и низкой ценой",
        is_default=False,
    ),
}


def get_all_models() -> List[ModelInfo]:
    return list(MODELS_CATALOG.values())


def get_model(model_id: str) -> ModelInfo:
    return MODELS_CATALOG.get(
        model_id,
        ModelInfo(
            id=model_id,
            name=model_id,
            provider="Custom",
            input_cost_per_1m=0.20,
            output_cost_per_1m=0.50,
        )
    )
