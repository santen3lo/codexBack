from typing import List
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from app.models_data import get_all_models, ModelInfo
from app.schemas import ChatRequest, RetryRequest, CompareResponse
from app.services.llm_orchestrator import stream_comparison, compare_sync
from app.config import settings

router = APIRouter(prefix="/api", tags=["llm"])


@router.get("/models", response_model=List[ModelInfo])
async def list_available_models():
    """Returns the list of available LLM models with pricing and metadata."""
    return get_all_models()


@router.post("/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Streams parallel responses for 2 to 4 models concurrently using Server-Sent Events (SSE).
    Each event carries the `model_id` and the specific delta/chunk or metrics.
    """
    if len(request.model_ids) < 1 or len(request.model_ids) > 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="В сравнении может участвовать от 2 до 4 моделей."
        )

    return StreamingResponse(
        stream_comparison(
            prompt=request.prompt,
            model_ids=request.model_ids,
            timeout_seconds=settings.DEFAULT_TIMEOUT_SECONDS,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/chat/retry")
async def chat_retry_endpoint(request: RetryRequest):
    """
    Retries query generation for a single specified model without affecting other columns.
    Returns an SSE stream specifically for this model.
    """
    return StreamingResponse(
        stream_comparison(
            prompt=request.prompt,
            model_ids=[request.model_id],
            timeout_seconds=settings.DEFAULT_TIMEOUT_SECONDS,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/chat", response_model=CompareResponse)
async def chat_sync_endpoint(request: ChatRequest):
    """
    Synchronous comparison endpoint (returns complete answers once all models finish).
    """
    if len(request.model_ids) < 1 or len(request.model_ids) > 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="В сравнении может участвовать от 2 до 4 моделей."
        )

    return await compare_sync(
        prompt=request.prompt,
        model_ids=request.model_ids,
        timeout_seconds=settings.DEFAULT_TIMEOUT_SECONDS,
    )


@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "proxy_base_url": settings.AI_PROXY_BASE_URL,
        "token_configured": bool(settings.AI_PROXY_TOKEN),
    }

