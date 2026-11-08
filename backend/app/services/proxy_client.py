import asyncio
import json
import time
from typing import AsyncGenerator, Dict, Any, Optional
import httpx
from app.config import settings
from app.models_data import get_model


class ProxyStreamEvent:
    def __init__(self, event_type: str, delta: str = "", message: str = ""):
        self.event_type = event_type  # "chunk", "thinking", "finish", "error"
        self.delta = delta
        self.message = message


async def mock_stream_for_model(model_id: str, prompt: str) -> AsyncGenerator[ProxyStreamEvent, None]:
    """Generates a realistic mock response for demo, testing, or development without burning token limits."""
    model_info = get_model(model_id)

    # Simulate reasoning/thinking if supported
    if model_info.supports_thinking:
        yield ProxyStreamEvent("thinking", f"Анализирую запрос: «{prompt[:40]}...»\n")
        await asyncio.sleep(0.3)
        yield ProxyStreamEvent("thinking", f"Определяю специфику модели {model_info.name} ({model_info.provider}).\n")
        await asyncio.sleep(0.4)
        yield ProxyStreamEvent("thinking", "Формирую структурированный ответ с примерами и таблицей сравнения.")
        await asyncio.sleep(0.3)

    # Base response content customized for the prompt
    if "editor" in prompt.lower() or "codex" in prompt.lower():
        intro = (
            f"**{model_info.name}** ({model_info.provider}):\n\n"
            f"**Editor.js** — это блочный веб-редактор следующего поколения с открытым исходным кодом, "
            f"разработанный петербургской командой **CodeX**.\n\n"
            f"### Ключевые отличия от аналогов:\n"
            f"1. **Блочная архитектура (JSON вместо HTML):** Традиционные редакторы (TinyMCE, CKEditor) "
            f"сохраняют форматированный HTML-код, который сложно очищать и валидировать. "
            f"Editor.js возвращает чистый структурированный JSON с массивом блоков.\n"
            f"2. **Модульность:** Каждый тип содержимого (заголовок, абзац, картинка, код, цитата) — это независимый плагин.\n\n"
        )
        table = (
            "| Редактор | Формат данных | Плагинная система |\n"
            "| :--- | :--- | :--- |\n"
            "| **Editor.js** | Чистый JSON (блоки) | Полная модульность |\n"
            "| **TinyMCE** | Сгенерированный HTML | Монолитное ядро |\n"
            "| **Quill** | Delta (JSON) | Модули |\n\n"
        )
        code_header = "### Пример структуры данных JSON:\n"
        code_block = (
            "```json\n"
            "{\n"
            '  "time": 1731000000000,\n'
            '  "blocks": [\n'
            "    {\n"
            '      "type": "header",\n'
            '      "data": {\n'
            '        "text": "Заголовок статьи",\n'
            '        "level": 2\n'
            "      }\n"
            "    },\n"
            "    {\n"
            '      "type": "paragraph",\n'
            '      "data": {\n'
            '        "text": "Содержимое текстового блока..."\n'
            '      }\n'
            "    }\n"
            "  ],\n"
            '  "version": "2.30.0"\n'
            "}\n"
            "```\n\n"
        )
        conclusion = (
            f"*Ответ сформирован моделью {model_info.name} в тестовом режиме.*"
        )
        full_text = intro + table + code_header + code_block + conclusion
    else:
        full_text = (
            f"**Ответ модели {model_info.name} ({model_info.provider}):**\n\n"
            f"Вы задали вопрос: *«{prompt}»*\n\n"
            f"### Основные тезисы:\n"
            f"- Модель {model_info.name} обеспечивает быстрое время отклика и высокую релевантность.\n"
            f"- Стоимость обработки: **${model_info.input_cost_per_1m}** за 1M входных и **${model_info.output_cost_per_1m}** за 1M выходных токенов.\n\n"
            f"```python\n"
            f"# Пример запроса к модели {model_id}\n"
            f"async def query_model():\n"
            f'    return "Ответ от {model_info.name}"\n'
            f"```\n\n"
            f"Все данные проверены и готовы к интеграции в систему сравнения."
        )

    # Stream in word chunks with variable pacing
    chunks = full_text.split(" ")
    for idx, chunk in enumerate(chunks):
        suffix = " " if idx < len(chunks) - 1 else ""
        yield ProxyStreamEvent("chunk", chunk + suffix)
        # Random speed variations to simulate different model latency
        delay = 0.02 + (hash(model_id + str(idx)) % 3) * 0.015
        await asyncio.sleep(delay)

    yield ProxyStreamEvent("finish")


async def stream_from_proxy(
    model_id: str,
    prompt: str,
    timeout_seconds: float = 60.0
) -> AsyncGenerator[ProxyStreamEvent, None]:
    """
    Connects to the AI proxy and yields streaming events.
    Supports CodeX AI-proxy NDJSON protocol, standard OpenAI-compatible API,
    with automatic fallback to realistic mock mode if no token or proxy is unreachable.
    """
    token = settings.AI_PROXY_TOKEN.strip()
    base_url = settings.AI_PROXY_BASE_URL.rstrip("/")

    # If no token is configured, use the mock generator
    if not token:
        async for event in mock_stream_for_model(model_id, prompt):
            yield event
        return

    # Prepare client with per-model timeout
    timeout_cfg = httpx.Timeout(timeout_seconds, connect=10.0)

    # First attempt: CodeX AI Proxy /stream endpoint (Accept: application/x-ndjson)
    proxy_stream_url = f"{base_url}/stream"
    headers = {
        "x-api-key": token,
        "Accept": "application/x-ndjson",
        "Content-Type": "application/json",
    }
    body = {
        "prompt": prompt,
        "model": model_id,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout_cfg) as client:
            async with client.stream("POST", proxy_stream_url, headers=headers, json=body) as response:
                if response.status_code == 200:
                    buffer = ""
                    async for raw_bytes in response.aiter_bytes():
                        buffer += raw_bytes.decode("utf-8", errors="replace")
                        while "\n" in buffer:
                            line, buffer = buffer.split("\n", 1)
                            line = line.strip()
                            if not line:
                                continue
                            try:
                                item = json.loads(line)
                                item_type = item.get("type")
                                if item_type == "text-delta":
                                    yield ProxyStreamEvent("chunk", item.get("delta", ""))
                                elif item_type == "reasoning-delta":
                                    yield ProxyStreamEvent("thinking", item.get("delta", ""))
                                elif item_type == "finish":
                                    yield ProxyStreamEvent("finish")
                                elif item_type == "error":
                                    yield ProxyStreamEvent("error", message=item.get("message", "Ошибка модели"))
                            except json.JSONDecodeError:
                                pass
                    return

                elif response.status_code in (401, 403):
                    yield ProxyStreamEvent("error", message="Ошибка авторизации: неверный API-токен.")
                    return
                elif response.status_code == 429:
                    yield ProxyStreamEvent("error", message="Превышен лимит запросов для вашего API-токена.")
                    return
                # If 404 or other, try OpenAI-compatible endpoint next
    except (httpx.TimeoutException, asyncio.TimeoutError):
        yield ProxyStreamEvent("error", message=f"Модель не ответила за {int(timeout_seconds)} секунд.")
        return
    except httpx.RequestError:
        pass  # Proceed to OpenAI-compatible fallback

    # Second attempt: standard OpenAI-compatible /v1/chat/completions
    openai_url = f"{base_url}/v1/chat/completions" if "/v1" not in base_url else f"{base_url}/chat/completions"
    headers_openai = {
        "Authorization": f"Bearer {token}",
        "x-api-key": token,
        "Content-Type": "application/json",
    }
    body_openai = {
        "model": model_id,
        "messages": [{"role": "user", "content": prompt}],
        "stream": True,
        "stream_options": {"include_usage": True},
    }

    try:
        async with httpx.AsyncClient(timeout=timeout_cfg) as client:
            async with client.stream("POST", openai_url, headers=headers_openai, json=body_openai) as response:
                if response.status_code == 200:
                    buffer = ""
                    async for raw_bytes in response.aiter_bytes():
                        buffer += raw_bytes.decode("utf-8", errors="replace")
                        while "\n" in buffer:
                            line, buffer = buffer.split("\n", 1)
                            line = line.strip()
                            if not line or not line.startswith("data:"):
                                continue
                            payload = line[5:].strip()
                            if payload == "[DONE]":
                                yield ProxyStreamEvent("finish")
                                return
                            try:
                                data = json.loads(payload)
                                choices = data.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    content = delta.get("content", "")
                                    reasoning = delta.get("reasoning_content", "") or delta.get("reasoning", "")
                                    if reasoning:
                                        yield ProxyStreamEvent("thinking", reasoning)
                                    if content:
                                        yield ProxyStreamEvent("chunk", content)
                            except json.JSONDecodeError:
                                pass
                    return
                elif response.status_code in (401, 403):
                    yield ProxyStreamEvent("error", message="Ошибка авторизации: неверный API-токен.")
                    return
                elif response.status_code == 429:
                    yield ProxyStreamEvent("error", message="Превышен лимит запросов для вашего API-токена.")
                    return
                else:
                    err_text = await response.aread()
                    yield ProxyStreamEvent("error", message=f"Ошибка сервера ({response.status_code}): {err_text.decode('utf-8', errors='ignore')[:150]}")
                    return
    except (httpx.TimeoutException, asyncio.TimeoutError):
        yield ProxyStreamEvent("error", message=f"Модель не ответила за {int(timeout_seconds)} секунд.")
        return
    except Exception as e:
        # If proxy server is unreachable and MOCK_MODE_IF_NO_TOKEN is True, fallback gracefully
        if settings.MOCK_MODE_IF_NO_TOKEN:
            async for event in mock_stream_for_model(model_id, prompt):
                yield event
            return
        yield ProxyStreamEvent("error", message=f"Не удалось подключиться к сервису моделей: {str(e)}")

