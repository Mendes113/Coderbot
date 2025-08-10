from typing import Optional, Dict, Any, Tuple
import textwrap
import re

from app.services.agno_methodology_service import AgnoMethodologyService, MethodologyType


class AgnoTeamService:
    """
    Orquestrador de "equipes" lógicas para separar responsabilidades:
      - agente de EXPLICAÇÃO (worked example em passos curtos, sem código final longo)
      - agente de CÓDIGO FINAL (um único bloco completo, pronto para executar)
      - agente de VALIDAÇÃO (garante Markdown/fences corretos e sem artefatos não suportados)

    Remove geração de diagramas (mermaid/excalidraw) para evitar falhas de render no frontend.
    """

    def __init__(self, provider: Optional[str] = "claude", model_id: Optional[str] = None):
        self.provider = provider or "claude"
        self.model_id = model_id
        self.core = AgnoMethodologyService(model_id=self.model_id, provider=self.provider)

    def generate_worked_example_with_artifacts(
        self,
        user_query: str,
        base_context: Optional[str] = None,
        include_final_code: bool = True,
        include_diagram: bool = False,  # ignorado, diagramas desativados
        diagram_type: str = None,       # ignorado
        max_final_code_lines: int = 150,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Gera explicação (worked example) + código final e valida a saída.
        Retorna:
         - response_markdown (string unificada com seções)
         - extras { final_code: {...} } quando possível
        """

        # 1) Agente de EXPLICAÇÃO
        explanation_context = self._build_explanation_context(base_context)
        explanation_md = self.core.ask(
            methodology=MethodologyType.WORKED_EXAMPLES,
            user_query=user_query,
            context=explanation_context,
        )

        extras: Dict[str, Any] = {}

        # 2) Agente de CÓDIGO FINAL
        final_code_section = ""
        if include_final_code:
            code_prompt = self._build_final_code_prompt(user_query, max_final_code_lines)
            final_code_md = self.core.ask(
                methodology=MethodologyType.DEFAULT,
                user_query=code_prompt,
                context=base_context or "",
            )
            # Extrair fence do retorno do agente de código
            code_lang, code_text = self._extract_single_code_block(final_code_md)
            if code_text:
                extras["final_code"] = {
                    "language": code_lang or "text",
                    "code": code_text,
                    "line_count": len(code_text.splitlines()),
                    "truncated": (len(code_text.splitlines()) > max_final_code_lines),
                }
                final_code_section = self._render_final_code_section(code_lang or "", code_text)

        # 3) Compor resposta parcial (sem diagramas)
        response = "\n\n".join([
            explanation_md.strip(),
            final_code_section.strip() if final_code_section else "",
        ]).strip()

        # 4) Sanitizar e validar para o frontend
        response = self._sanitize_for_frontend(response)
        response = self._validate_and_fix_markdown(response, max_final_code_lines)

        return response, extras

    # ------------------- PROMPTS AUXILIARES -------------------
    def _build_explanation_context(self, base_context: Optional[str]) -> str:
        parts = []
        if base_context:
            parts.append(str(base_context))
        parts.append(textwrap.dedent(
            """
            FORMATAÇÃO: Responda em Markdown claro, com PASSOS numerados do exemplo
            trabalhado (worked example), evitando blocos de código muito extensos.
            Foque em explicar cada etapa de forma breve e objetiva.
            """
        ).strip())
        return "\n\n".join(parts)

    def _build_final_code_prompt(self, user_query: str, max_lines: int) -> str:
        return textwrap.dedent(f"""
            Gere APENAS um bloco de código final, completo e pronto para executar
            (sem explicações), relacionado ao pedido:
            "{user_query}"

            Regras:
            - Use a linguagem mais apropriada para o problema.
            - Garanta que o bloco tenha no máximo {max_lines} linhas, mantendo funcionalidade.
            - Não inclua comentários extensos; privilegie clareza e concisão.
            - Responda estritamente com um bloco cercado por crases: ```linguagem ... ```
        """).strip()

    # ------------------- VALIDAÇÃO / SANITIZAÇÃO -------------------
    def _sanitize_for_frontend(self, md: str) -> str:
        """
        Remove blocos não suportados (mermaid/excalidraw) e limpa artefatos simples
        que possam quebrar a renderização no frontend.
        """
        if not md:
            return md
        # remove blocos mermaid/excalidraw inteiros
        pattern = re.compile(r"```(mermaid|excalidraw)\s*[\s\S]*?```", re.IGNORECASE | re.MULTILINE)
        md = pattern.sub("", md)
        return md.strip()

    def _validate_and_fix_markdown(self, md: str, max_lines: int) -> str:
        """
        Usa um agente validador para garantir que o Markdown final está consistente:
        - fences (```lang ... ```) bem formadas
        - no máximo UM bloco "Código final" ao final
        - sem blocos não suportados
        - linhas do bloco final dentro de limites, se possível
        """
        validator_rules = textwrap.dedent(f"""
            Você é um validador de saída para um frontend React. Receberá um Markdown e deve
            devolver um Markdown semanticamente correto e seguro para renderização:
            Regras obrigatórias:
            - Garanta que todos os blocos de código cercados com ``` estejam corretamente abertos e fechados.
            - Remova quaisquer blocos mermaid/excalidraw.
            - Se houver uma seção "### Código final": mantenha apenas UM bloco nessa seção. Se não existir,
              crie uma seção "### Código final" ao final contendo UM ÚNICO bloco com no máximo {max_lines} linhas,
              baseado no conteúdo presente. Não adicione texto fora de Markdown válido.
            - Não inclua XML/HTML bruto não escapado que quebre a renderização.
            - Preserve o restante da explicação em Markdown simples.
        """)
        prompt = "Valide e corrija o Markdown a seguir para renderizar sem erros."
        context = "\n\n".join([validator_rules, "\n---\nConteúdo original:\n", md])
        try:
            fixed = self.core.ask(
                methodology=MethodologyType.DEFAULT,
                user_query=prompt,
                context=context,
            )
            # Sanitização final por garantia
            fixed = self._sanitize_for_frontend(fixed)
            return fixed or md
        except Exception:
            # fallback: retorna md sanitizado
            return md

    # ------------------- RENDERIZAÇÃO AUXILIAR -------------------
    def _render_final_code_section(self, lang: str, code: str) -> str:
        lang = (lang or "").strip()
        return textwrap.dedent(f"""
            ### Código final

            ```{lang}
            {code}
            ```
        """).strip()

    # ------------------- EXTRAÇÃO AUXILIAR -------------------
    def _extract_single_code_block(self, md: str) -> Tuple[Optional[str], Optional[str]]:
        m = re.search(r"```(\w+)?\s*([\s\S]*?)```", md or "", re.MULTILINE)
        if not m:
            return None, None
        lang = (m.group(1) or '').strip()
        code = (m.group(2) or '').strip()
        return (lang or None), (code or None)

 