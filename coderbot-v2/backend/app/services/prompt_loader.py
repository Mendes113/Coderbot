# filepath: backend/app/services/prompt_loader.py
import json
import logging
import os
import re
from dataclasses import dataclass
from typing import Dict, List, Optional

from dotenv import load_dotenv
from pocketbase import PocketBase

from app.templates import UNIFIED_PROMPT_TEMPLATE

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

POCKETBASE_URL = os.getenv("POCKETBASE_URL")


@dataclass(slots=True)
class TemplateBundle:
    """Structured representation of a methodology prompt."""

    prompt: str
    required_sections: List[str]
    research_tags: List[str]


class PromptLoader:
    """Centralised loader that exposes the research-aligned unified template."""

    def __init__(self, client: Optional[PocketBase] = None):
        self.logger = logging.getLogger(__name__)
        self.client = client or (PocketBase(POCKETBASE_URL) if POCKETBASE_URL else None)
        self._manifest: Optional[Dict[str, object]] = None

    def _load_manifest(self) -> Dict[str, object]:
        """Loads the unified template manifest from PocketBase or bundled asset."""

        if self._manifest is not None:
            return self._manifest

        # Try remote first so that updates in PocketBase propagate without redeploy.
        if self.client is not None:
            try:
                record = self.client.collection("dynamic_prompts").get_first_list_item(
                    'name="coderbot_unified_template" && is_active=true'
                )
                template_payload = getattr(record, "template", None)
                if template_payload:
                    self._manifest = json.loads(template_payload)
                    self.logger.info(
                        "Unified template loaded from PocketBase (version=%s)",
                        self._manifest.get("version", "unknown"),
                    )
                    return self._manifest
            except Exception as exc:  # pragma: no cover - network/credentials issues
                self.logger.warning(
                    "Failed to load unified template from PocketBase, falling back to bundled asset: %s",
                    exc,
                )

        self._manifest = UNIFIED_PROMPT_TEMPLATE
        self.logger.info(
            "Using bundled unified template (version=%s)",
            UNIFIED_PROMPT_TEMPLATE.get("version", "unknown"),
        )
        return self._manifest

    def get_template(self, methodology: str) -> TemplateBundle:
        """Returns the template bundle for a given methodology, falling back to default."""

        manifest = self._load_manifest()
        methodologies = manifest.get("methodologies", {})

        template_data = methodologies.get(methodology)
        if not template_data:
            self.logger.warning(
                "Metodologia '%s' não encontrada no manifesto; usando template padrão.", methodology
            )
            template_data = methodologies.get("default")

        if not template_data:
            raise ValueError("Unified template manifest is missing the default methodology definition")

        return TemplateBundle(
            prompt=template_data.get("prompt", ""),
            required_sections=template_data.get("required_sections", []),
            research_tags=template_data.get("research_tags", []),
        )

    def get_prompt(self, methodology: str, name: Optional[str] = None) -> str:
        """Deprecated compatibility wrapper returning only the raw prompt string."""

        if name:
            self.logger.warning(
                "Parameter 'name' is deprecated in PromptLoader.get_prompt and will be ignored."
            )
        return self.get_template(methodology).prompt

    def get_template_version(self) -> str:
        """Returns current template manifest version for observability."""

        manifest = self._load_manifest()
        return str(manifest.get("version", "unknown"))

    def format_prompt(self, template: str, data: Dict[str, object]) -> str:
        """Interpolates placeholders in the template and warns about missing values."""

        formatted = template
        for key, value in data.items():
            placeholder = "{" + key + "}"
            formatted = formatted.replace(placeholder, str(value))

        leftover_placeholders = set(re.findall(r"{([a-zA-Z0-9_]+)}", formatted))
        if leftover_placeholders:
            self.logger.warning(
                "Placeholders non substituted in prompt template: %s", sorted(leftover_placeholders)
            )

        return formatted