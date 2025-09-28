"""Unified template rendering service built on top of PromptLoader."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .prompt_loader import PromptLoader, TemplateBundle


@dataclass(slots=True)
class TemplateContext:
    """Context information used to fill placeholders in the unified template."""

    user_query: str
    context_history: str = ""
    knowledge_base: str = ""
    difficulty_level: str = "intermediate"
    baseKnowledge: str = ""
    learning_progress: str = ""
    style_preference: str = "balanced"
    subject_area: str = "programação"
    extras: Dict[str, Any] = field(default_factory=dict)

    def to_mapping(self) -> Dict[str, Any]:
        mapping: Dict[str, Any] = {
            "user_query": self.user_query,
            "context_history": self.context_history or "",
            "knowledge_base": self.knowledge_base or "Nenhum contexto adicional relevante foi encontrado para esta consulta.",
            "difficulty_level": self.difficulty_level or "intermediate",
            "baseKnowledge": self.baseKnowledge or "Não informado",
            "learning_progress": self.learning_progress or "",
            "style_preference": self.style_preference or "balanced",
            "subject_area": self.subject_area or "programação",
        }
        for key, value in self.extras.items():
            if value is None:
                continue
            mapping[key] = value
        return mapping


@dataclass(slots=True)
class TemplateRenderResult:
    """Rendered template ready to be sent to a language model."""

    prompt: str
    required_sections: List[str]
    research_tags: List[str]
    bundle: TemplateBundle
    context_data: Dict[str, Any]


class UnifiedTemplateService:
    """High-level API that renders unified prompts for any methodology."""

    def __init__(self, loader: Optional[PromptLoader] = None):
        self.loader = loader or PromptLoader()

    def render(self, methodology: str, context: TemplateContext) -> TemplateRenderResult:
        bundle = self.loader.get_template(methodology)
        context_data = context.to_mapping()
        prompt = self.loader.format_prompt(bundle.prompt, context_data)
        return TemplateRenderResult(
            prompt=prompt,
            required_sections=bundle.required_sections,
            research_tags=bundle.research_tags,
            bundle=bundle,
            context_data=context_data,
        )

    def get_required_sections(self, methodology: str) -> List[str]:
        return self.loader.get_template(methodology).required_sections

    def get_research_tags(self, methodology: str) -> List[str]:
        return self.loader.get_template(methodology).research_tags


__all__ = [
    "TemplateContext",
    "TemplateRenderResult",
    "UnifiedTemplateService",
]
