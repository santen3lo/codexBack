import asyncio
import json
import time
from typing import AsyncGenerator, List, Dict, Any
from app.config import settings
from app.models_data import get_model
from app.services.proxy_client import stream_from_proxy, ProxyStreamEvent
from app.services.metrics import create_metrics, annotate_comparison_badges
from app.schemas import ModelMetrics, SingleResponse, CompareResponse


async def process_single_model_stream(
    model_id: str,
    prompt: str,
    event_queue: asyncio.Queue,
    timeout_seconds: float = 60.0
) -> Dict[str, Any]:
    """
    Handles streaming for a single model, pushing SSE formatted events to a shared queue.
    Calculates TTFT, total duration, tokens and costs.
    """
    t0 = time.perf_counter()
    first_token_time: float = 0.0
    accumulated_text: List[str] = []
    accumulated_thinking: List[str] = []
    error_message: str = ""

    try:
        async for event in stream_from_proxy(model_id, prompt, timeout_seconds=timeout_seconds):
            if event.event_type == "chunk":
                if first_token_time == 0.0:
                    first_token_time = time.perf_counter() - t0
                accumulated_text.append(event.delta)
                await event_queue.put({
                    "type": "chunk",
                    "model_id": model_id,
                    "delta": event.delta,
                })
            elif event.event_type == "thinking":
                if first_token_time == 0.0:
                    first_token_time = time.perf_counter() - t0
                accumulated_thinking.append(event.delta)
                await event_queue.put({
                    "type": "thinking",
                    "model_id": model_id,
                    "delta": event.delta,
                })
            elif event.event_type == "error":
                error_message = event.message or "Неизвестная ошибка модели"
                await event_queue.put({
                    "type": "error",
                    "model_id": model_id,
                    "message": error_message,
                })
                break
            elif event.event_type == "finish":
                break
    except asyncio.TimeoutError:
        error_message = f"Модель не ответила за {int(timeout_seconds)} секунд."
        await event_queue.put({
            "type": "error",
            "model_id": model_id,
            "message": error_message,
        })
    except Exception as e:
        error_message = f"Ошибка выполнения: {str(e)}"
        await event_queue.put({
            "type": "error",
            "model_id": model_id,
            "message": error_message,
        })

    t_end = time.perf_counter()
    total_time = t_end - t0
    ttft = first_token_time if first_token_time > 0 else total_time

    full_text = "".join(accumulated_text)
    full_thinking = "".join(accumulated_thinking)

    metrics = None
    if not error_message and full_text:
        metrics = create_metrics(
            model_id=model_id,
            ttft_seconds=ttft,
            total_seconds=total_time,
            prompt=prompt,
            response_text=full_text,
        )
        await event_queue.put({
            "type": "metrics",
            "model_id": model_id,
            "metrics": metrics.model_dump(),
        })

    return {
        "model_id": model_id,
        "text": full_text,
        "thinking": full_thinking,
        "error": error_message,
        "metrics": metrics,
    }


async def stream_comparison(
    prompt: str,
    model_ids: List[str],
    timeout_seconds: float = 60.0
) -> AsyncGenerator[str, None]:
    """
    Runs parallel streaming for all specified models.
    Yields Server-Sent Events (SSE) data lines to the client.
    """
    queue: asyncio.Queue = asyncio.Queue()
    tasks = [
        asyncio.create_task(
            process_single_model_stream(
                model_id=mid,
                prompt=prompt,
                event_queue=queue,
                timeout_seconds=timeout_seconds
            )
        )
        for mid in model_ids
    ]

    async def _feed_queue():
        results = await asyncio.gather(*tasks, return_exceptions=True)
        # Gather all valid metrics to determine fastest and cheapest badges
        valid_metrics: List[ModelMetrics] = []
        for r in results:
            if isinstance(r, dict) and r.get("metrics"):
                valid_metrics.append(r["metrics"])

        annotated = annotate_comparison_badges(valid_metrics)
        fastest_id = next((m.model_id for m in annotated if m.is_fastest), None)
        cheapest_id = next((m.model_id for m in annotated if m.is_cheapest), None)

        await queue.put({
            "type": "summary_badges",
            "fastest_model_id": fastest_id,
            "cheapest_model_id": cheapest_id,
        })
        await queue.put({"type": "done"})

    feeder_task = asyncio.create_task(_feed_queue())

    while True:
        event = await queue.get()
        yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        if event.get("type") == "done":
            break

    await feeder_task


async def compare_sync(
    prompt: str,
    model_ids: List[str],
    timeout_seconds: float = 60.0
) -> CompareResponse:
    """Non-streaming comparison execution for minimal requirements or direct API clients."""
    queue: asyncio.Queue = asyncio.Queue()
    tasks = [
        process_single_model_stream(
            model_id=mid,
            prompt=prompt,
            event_queue=queue,
            timeout_seconds=timeout_seconds
        )
        for mid in model_ids
    ]
    raw_results = await asyncio.gather(*tasks, return_exceptions=True)

    valid_metrics: List[ModelMetrics] = []
    items: List[Dict[str, Any]] = []

    for item in raw_results:
        if isinstance(item, dict):
            items.append(item)
            if item.get("metrics"):
                valid_metrics.append(item["metrics"])

    annotate_comparison_badges(valid_metrics)

    results: List[SingleResponse] = []
    for item in items:
        info = get_model(item["model_id"])
        results.append(SingleResponse(
            model_id=item["model_id"],
            model_name=info.name,
            provider=info.provider,
            text=item["text"],
            thinking=item["thinking"] if item["thinking"] else None,
            metrics=item["metrics"],
            error=item["error"] if item["error"] else None,
        ))

    return CompareResponse(results=results)

