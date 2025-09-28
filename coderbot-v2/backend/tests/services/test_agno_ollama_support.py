import pytest

from app.services.agno_methodology_service import AgnoMethodologyService


@pytest.mark.parametrize(
    "model_id,provider,expected_provider",
    [
        ("llama3.1", "ollama", "ollama"),
        ("llama3.1", None, "ollama"),
    ],
)
def test_agno_methodology_service_handles_ollama_provider(model_id, provider, expected_provider):
    service = AgnoMethodologyService(model_id=model_id, provider=provider)
    assert service.provider == expected_provider
    assert "ollama" in service.get_available_providers()


def test_get_available_models_for_provider_uses_ollama(monkeypatch):
    service = AgnoMethodologyService(model_id="llama3.1", provider="ollama")

    def fake_get_available_models():
        return {"ollama": {"llama3.1": "llama3.1"}}

    monkeypatch.setattr(
        "app.services.agno_methodology_service.get_available_models",
        fake_get_available_models,
    )

    models = service.get_available_models_for_provider("ollama")
    assert "llama3.1" in models
