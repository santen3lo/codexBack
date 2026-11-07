import tiktoken
from typing import List, Dict, Any
from app.models_data import get_model, ModelInfo
from app.schemas import ModelMetrics

try:
    _tokenizer = tiktoken.get_encoding("cl100k_base")
except Exception:
    _tokenizer = None


def count_tokens(text: str) -> int:
    """Accurately count tokens using cl100k_base or fallback to word-ratio heuristic."""
    if not text:
        return 0
    if _tokenizer:
        try:
            return len(_tokenizer.encode(text))
        except Exception:
            pass
    # Heuristic fallback: ~3.5 characters per token in Cyrillic/multilingual, ~4 in English
    return max(1, int(len(text) / 3.5))


def calculate_cost(input_tokens: int, output_tokens: int, model_info: ModelInfo) -> float:
    """Calculate query cost in USD based on model pricing per 1M tokens."""
    in_cost = (input_tokens / 1_000_000.0) * model_info.input_cost_per_1m
    out_cost = (output_tokens / 1_000_000.0) * model_info.output_cost_per_1m
    return round(in_cost + out_cost, 6)


def create_metrics(
    model_id: str,
    ttft_seconds: float,
    total_seconds: float,
    prompt: str,
    response_text: str,
    reported_input_tokens: int = 0,
    reported_output_tokens: int = 0,
) -> ModelMetrics:
    model_info = get_model(model_id)
    input_tokens = reported_input_tokens or count_tokens(prompt)
    output_tokens = reported_output_tokens or count_tokens(response_text)
    cost = calculate_cost(input_tokens, output_tokens, model_info)

    return ModelMetrics(
        model_id=model_id,
        ttft_seconds=round(ttft_seconds, 3),
        total_seconds=round(total_seconds, 2),
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_usd=cost,
        is_fastest=False,
        is_cheapest=False,
    )


def annotate_comparison_badges(metrics_list: List[ModelMetrics]) -> List[ModelMetrics]:
    """Find and mark the fastest (lowest total_seconds) and cheapest (lowest cost_usd) model."""
    valid_metrics = [m for m in metrics_list if m.total_seconds > 0]
    if len(valid_metrics) < 2:
        return metrics_list

    min_time = min(m.total_seconds for m in valid_metrics)
    min_cost = min(m.cost_usd for m in valid_metrics)

    for m in metrics_list:
        if m.total_seconds > 0 and abs(m.total_seconds - min_time) < 1e-6:
            m.is_fastest = True
        if m.total_seconds > 0 and abs(m.cost_usd - min_cost) < 1e-6:
            m.is_cheapest = True

    return metrics_list
