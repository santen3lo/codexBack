import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.metrics import count_tokens, calculate_cost, annotate_comparison_badges
from app.models_data import get_model
from app.schemas import ModelMetrics

client = TestClient(app)


def test_models_catalog():
    response = client.get("/api/models")
    assert response.status_code == 200
    models = response.json()
    assert len(models) >= 3
    # Check default models exist
    ids = [m["id"] for m in models]
    assert "claude-haiku-3-5" in ids
    assert "yandexgpt-5-lite" in ids
    assert "gigachat-2" in ids
    # Check fields
    for m in models:
        assert "name" in m
        assert "provider" in m
        assert "input_cost_per_1m" in m
        assert "output_cost_per_1m" in m


def test_model_count_validation():
    # 0 models should be rejected
    r0 = client.post("/api/chat", json={"prompt": "Привет", "model_ids": []})
    assert r0.status_code == 422  # Pydantic min_length validation

    # 5 models should be rejected
    r5 = client.post("/api/chat", json={
        "prompt": "Привет",
        "model_ids": ["m1", "m2", "m3", "m4", "m5"]
    })
    assert r5.status_code in (400, 422)


def test_sync_chat_comparison():
    payload = {
        "prompt": "Что такое Editor.js?",
        "model_ids": ["yandexgpt-5-lite", "gigachat-2"]
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) == 2

    for item in data["results"]:
        assert item["model_id"] in ["yandexgpt-5-lite", "gigachat-2"]
        assert len(item["text"]) > 0
        assert item["metrics"] is not None
        assert item["metrics"]["total_seconds"] > 0
        assert item["metrics"]["cost_usd"] >= 0


def test_metrics_badges():
    m1 = ModelMetrics(
        model_id="fast_cheap",
        ttft_seconds=0.2,
        total_seconds=1.1,
        input_tokens=10,
        output_tokens=50,
        cost_usd=0.0001,
        is_fastest=False,
        is_cheapest=False,
    )
    m2 = ModelMetrics(
        model_id="slow_expensive",
        ttft_seconds=0.8,
        total_seconds=3.5,
        input_tokens=10,
        output_tokens=50,
        cost_usd=0.0020,
        is_fastest=False,
        is_cheapest=False,
    )

    annotated = annotate_comparison_badges([m1, m2])
    fast = [m for m in annotated if m.is_fastest]
    cheap = [m for m in annotated if m.is_cheapest]

    assert len(fast) == 1 and fast[0].model_id == "fast_cheap"
    assert len(cheap) == 1 and cheap[0].model_id == "fast_cheap"


def test_token_and_cost_calc():
    text = "Editor.js — блочный веб-редактор от команды CodeX."
    tokens = count_tokens(text)
    assert tokens > 0

    model = get_model("yandexgpt-5-lite")
    cost = calculate_cost(input_tokens=1000, output_tokens=2000, model_info=model)
    assert cost > 0
    # 1000 * 0.20 / 1M + 2000 * 0.40 / 1M = 0.0002 + 0.0008 = 0.001
    assert abs(cost - 0.001) < 1e-5
