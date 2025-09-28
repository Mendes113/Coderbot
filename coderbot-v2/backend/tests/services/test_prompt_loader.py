from app.services.prompt_loader import PromptLoader
from app.templates.unified_prompt_template import UNIFIED_PROMPT_TEMPLATE


def _build_minimal_context(overrides=None):
    base = {
        "user_query": "Explique recursão em Python",
        "context_history": "Usuário: Explique recursão\nIA: exemplo básico",
        "knowledge_base": "Nenhum contexto adicional relevante foi encontrado para esta consulta.",
        "difficulty_level": "iniciante",
        "baseKnowledge": "listas e funções",
        "learning_progress": "",
        "style_preference": "visual",
        "subject_area": "programação",
    }
    overrides = overrides or {}
    base.update(overrides)
    return base


def test_get_template_fallbacks_to_default_for_unknown_methodology():
    loader = PromptLoader(client=None)

    bundle = loader.get_template("metodologia_inexistente")

    default_manifest = UNIFIED_PROMPT_TEMPLATE["methodologies"]["default"]
    assert bundle.required_sections == default_manifest["required_sections"]
    assert bundle.research_tags == default_manifest["research_tags"]
    assert "Metodologia ativa" in bundle.prompt


def test_format_prompt_replaces_all_known_placeholders():
    loader = PromptLoader(client=None)
    bundle = loader.get_template("sequential_thinking")
    context_data = _build_minimal_context()

    formatted = loader.format_prompt(bundle.prompt, context_data)

    for key in context_data:
        assert f"{{{key}}}" not in formatted, f"Placeholder {{{key}}} should be replaced"
    assert formatted.count("Você é o CoderBot") == 1
    assert "Explique recursão em Python" in formatted
