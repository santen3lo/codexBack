from typing import List, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000, description="Текст вопроса к моделям")
    model_ids: List[str] = Field(..., min_length=1, max_length=4, description="Список ID моделей для сравнения (2-4)")
    stream: bool = Field(default=True, description="Использовать потоковую передачу ответов")


class RetryRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000, description="Текст вопроса")
    model_id: str = Field(..., description="ID модели для повторного запроса")


class ModelMetrics(BaseModel):
    model_id: str
    ttft_seconds: float = Field(..., description="Время до первого токена в секундах")
    total_seconds: float = Field(..., description="Общее время ответа в секундах")
    input_tokens: int = Field(default=0, description="Количество токенов в промпте")
    output_tokens: int = Field(default=0, description="Количество сгенерированных токенов")
    cost_usd: float = Field(default=0.0, description="Расчетная стоимость запроса в USD")
    is_fastest: bool = Field(default=False, description="Самый быстрый ответ")
    is_cheapest: bool = Field(default=False, description="Самый дешевый ответ")


class SingleResponse(BaseModel):
    model_id: str
    model_name: str
    provider: str
    text: str
    thinking: Optional[str] = None
    metrics: Optional[ModelMetrics] = None
    error: Optional[str] = None


class CompareResponse(BaseModel):
    results: List[SingleResponse]
