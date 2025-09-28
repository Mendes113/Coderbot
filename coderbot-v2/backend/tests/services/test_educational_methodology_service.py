import asyncio

from app.services.educational_methodology_service import (
    EducationalMethodologyService,
    MethodologyType,
)
from app.services.prompt_loader import PromptLoader
from app.templates.unified_prompt_template import UNIFIED_PROMPT_TEMPLATE


def _build_user_profile():
    return {
        "difficulty_level": "intermediate",
        "baseKnowledge": "loops e funções",
        "learning_progress": "iniciando recursão",
        "style_preference": "visual",
        "subject_area": "programação",
    }


def test_apply_methodology_returns_unified_prompt_and_metadata():
    loader = PromptLoader(client=None)
    service = EducationalMethodologyService(prompt_loader=loader)

    result = asyncio.run(
        service.apply_methodology(
            methodology_type=MethodologyType.SOCRATIC,
            user_query="Como funciona recursão?",
            context_history="Usuário: Como funciona recursão?",
            knowledge_base="Nenhum contexto adicional relevante foi encontrado para esta consulta.",
            user_profile=_build_user_profile(),
            additional_params={"question_depth": 3},
        )
    )

    prompt = result["formatted_prompt"]
    metadata = result["metadata"]

    assert "Você é o CoderBot" in prompt
    assert "{user_query}" not in prompt
    assert "{context_history}" not in prompt
    assert metadata["required_sections"] == UNIFIED_PROMPT_TEMPLATE["methodologies"]["socratic"][
        "required_sections"
    ]
    assert metadata["template_version"] == loader.get_template_version()
    assert metadata["research_tags"] == UNIFIED_PROMPT_TEMPLATE["methodologies"]["socratic"]["research_tags"]
    assert metadata["user_profile_snapshot"]["difficulty_level"] == "intermediate"
    assert metadata["generation_parameters"]["question_depth"] == 3
    assert metadata["use_questions_only"] is True


def test_apply_methodology_sets_analogy_metadata_flags():
    loader = PromptLoader(client=None)
    service = EducationalMethodologyService(prompt_loader=loader)

    result = asyncio.run(
        service.apply_methodology(
            methodology_type=MethodologyType.ANALOGY,
            user_query="Explique árvore binária",
            context_history="",
            knowledge_base="",
            user_profile=_build_user_profile(),
            additional_params={},
        )
    )

    metadata = result["metadata"]

    assert metadata["methodology"] == MethodologyType.ANALOGY.value
    assert metadata["use_analogies"] is True
    assert metadata["required_sections"] == UNIFIED_PROMPT_TEMPLATE["methodologies"]["analogy"][
        "required_sections"
    ]
