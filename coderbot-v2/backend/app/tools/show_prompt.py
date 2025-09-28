"""Utility CLI to inspect rendered prompts and optional model outputs."""

from __future__ import annotations

import argparse
import json
from typing import Any, Dict, Optional

from app.services.template_service import TemplateContext, UnifiedTemplateService
from app.services.agno_methodology_service import AgnoMethodologyService, MethodologyType


def _load_extras(path: Optional[str]) -> Dict[str, Any]:
    if not path:
        return {}
    with open(path, "r", encoding="utf-8") as fh:
        if path.endswith(".json"):
            return json.load(fh)
        return {"extra_text": fh.read()}


def _build_context(args: argparse.Namespace) -> TemplateContext:
    extras: Dict[str, Any] = _load_extras(args.extras)
    return TemplateContext(
        user_query=args.user_query,
        context_history=args.context_history or "",
        knowledge_base=args.knowledge_base or "",
        difficulty_level=args.difficulty_level or "intermediate",
        baseKnowledge=args.base_knowledge or "",
        learning_progress=args.learning_progress or "",
        style_preference=args.style_preference or "balanced",
        subject_area=args.subject_area or "programação",
        extras=extras,
    )


def _print_header(title: str) -> None:
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def _print_prompt(result, template_service: UnifiedTemplateService, verbose: bool = False) -> None:
    _print_header("PROMPT RENDERED")
    print(result.prompt)
    if verbose:
        _print_header("REQUIRED SECTIONS")
        for section in result.required_sections:
            print(f"- {section}")
        _print_header("RESEARCH TAGS")
        if result.research_tags:
            for tag in result.research_tags:
                print(f"- {tag}")
        else:
            print("(none)")
        _print_header("CONTEXT DATA")
        for key, value in result.context_data.items():
            print(f"{key}: {value}")
        print(f"Template version: {template_service.loader.get_template_version()}")


def _print_response(response: str) -> None:
    _print_header("MODEL RESPONSE")
    print(response)


def main() -> None:
    parser = argparse.ArgumentParser(description="Render unified prompt and optionally fetch LLM response")
    parser.add_argument("methodology", help="Methodology key (e.g., worked_examples, socratic, analogy)")
    parser.add_argument("user_query", help="Prompt user question")
    parser.add_argument("--context-history", dest="context_history", default="", help="Conversation history text")
    parser.add_argument("--knowledge-base", dest="knowledge_base", default="", help="Injected knowledge base text")
    parser.add_argument("--difficulty-level", dest="difficulty_level", default="intermediate")
    parser.add_argument("--base-knowledge", dest="base_knowledge", default="")
    parser.add_argument("--learning-progress", dest="learning_progress", default="")
    parser.add_argument("--style-preference", dest="style_preference", default="balanced")
    parser.add_argument("--subject-area", dest="subject_area", default="programação")
    parser.add_argument("--extras", dest="extras", default=None, help="Path to JSON/text with extra fields")
    parser.add_argument("--show-metadata", action="store_true", help="Display template metadata and context data")
    parser.add_argument("--generate", action="store_true", help="Call the AGNO service and display model output")
    parser.add_argument("--provider", dest="provider", default=None, help="Provider override when generating (openai/claude/ollama)")
    parser.add_argument("--model-id", dest="model_id", default=None, help="Model ID override when generating")

    args = parser.parse_args()

    context = _build_context(args)
    template_service = UnifiedTemplateService()
    render_result = template_service.render(args.methodology, context)

    _print_prompt(render_result, template_service, verbose=args.show_metadata)

    if not args.generate:
        return

    try:
        methodology_enum = MethodologyType(args.methodology)
    except ValueError as exc:
        raise SystemExit(f"Metodologia inválida: {args.methodology}") from exc

    model_id = args.model_id
    provider = args.provider
    if not model_id and provider == "ollama":
        from app.config import settings

        model_id = settings.ollama_default_model or "llama3.1"

    agno_service = AgnoMethodologyService(model_id=model_id or "gpt-4o", provider=provider)
    combined_context = context.knowledge_base or context.context_history
    response = agno_service.ask(methodology_enum, args.user_query, context=combined_context)
    _print_response(response)


if __name__ == "__main__":
    main()
