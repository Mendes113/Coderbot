from typing import Optional, Dict, Any, Tuple
import textwrap

from app.services.agno_methodology_service import AgnoMethodologyService, MethodologyType


class AgnoTeamService:
    """
    Orquestrador de "equipes" lógicas para separar responsabilidades:
      - agente de EXPLICAÇÃO (worked example em passos curtos, sem código final longo)
      - agente de CÓDIGO FINAL (um único bloco completo, pronto para executar)
      - agente de DIAGRAMA (mermaid ou excalidraw)

    Implementa o conceito de Teams usando o serviço existente (evita nova dependência),
    mas com prompts/roles distintos e composição do resultado final.
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
        include_diagram: bool = True,
        diagram_type: str = "mermaid",
        max_final_code_lines: int = 150,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Gera explicação (worked example) + código final + diagrama, retornando:
         - response_markdown (string unificada com seções)
         - extras { final_code: {...}, diagram: {...} }
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

        # 3) Agente de DIAGRAMA
        diagram_section = ""
        if include_diagram:
            diagram_prompt = self._build_diagram_prompt(user_query, diagram_type)
            diagram_md = self.core.ask(
                methodology=MethodologyType.DEFAULT,
                user_query=diagram_prompt,
                context=base_context or "",
            )
            diag_lang, diag_text = self._extract_single_code_block(diagram_md)
            if diag_text:
                extras["diagram"] = {
                    "type": (diag_lang or diagram_type or "mermaid").lower(),
                    "content": diag_text,
                }
                diagram_section = self._render_diagram_section(diag_lang or diagram_type or "mermaid", diag_text)

        # 4) Compor resposta final
        response = "\n\n".join([
            explanation_md.strip(),
            final_code_section.strip() if final_code_section else "",
            diagram_section.strip() if diagram_section else "",
        ]).strip()

        return response, extras

    # ------------------- PROMPTS AUXILIARES -------------------
    def _build_explanation_context(self, base_context: Optional[str]) -> str:
        parts = []
        if base_context:
            parts.append(str(base_context))
        parts.append(textwrap.dedent(
            """
            FORMATAÇÃO: Responda em Markdown claro, com PASsos numerados do exemplo
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

    def _build_diagram_prompt(self, user_query: str, diagram_type: str) -> str:
        dtype = (diagram_type or "mermaid").lower()
        if dtype not in ("mermaid", "excalidraw"):
            dtype = "mermaid"
        if dtype == "mermaid":
            prompt = textwrap.dedent("""
                Crie APENAS um diagrama Mermaid que represente o conceito principal
                do problema/pedido a seguir, com nós e setas claros. O diagrama
                DEVE começar com 'graph TD' e conter somente sintaxe válida do Mermaid:
                "{user_query}"

                Regras:
                - Responda estritamente com um bloco cercado por crases: ```mermaid ... ```
                - Evite diagramas muito grandes.
                - Exemplo mínimo de formato válido:
                  ```mermaid
                  graph TD
                    A[Início] --> B[Processo]
                    B --> C{Condição?}
                    C -->|Sim| D[Saída 1]
                    C -->|Não| E[Saída 2]
                  ```
            """).strip()
            return prompt.replace("{user_query}", user_query)
        else:
            return textwrap.dedent(f"""
                Crie APENAS um JSON Excalidraw mínimo (bloco cercado por crases `excalidraw`)
                que represente o conceito principal da tarefa:
                "{user_query}"

                Regras:
                - Responda estritamente com um bloco cercado por crases: ```excalidraw ... ```
                - Evite diagramas muito grandes.
            """).strip()

    # ------------------- RENDERIZAÇÃO AUXILIAR -------------------
    def _render_final_code_section(self, lang: str, code: str) -> str:
        lang = (lang or "").strip()
        return textwrap.dedent(f"""
            ### Código final

            ```{lang}
            {code}
            ```
        """).strip()

    def _render_diagram_section(self, lang: str, content: str) -> str:
        t = (lang or "mermaid").strip()
        return textwrap.dedent(f"""
            ### Diagrama

            ```{t}
            {content}
            ```
        """).strip()

    # ------------------- EXTRAÇÃO AUXILIAR -------------------
    def _extract_single_code_block(self, md: str) -> Tuple[Optional[str], Optional[str]]:
        import re
        m = re.search(r"```(\w+)?\s*([\s\S]*?)```", md or "", re.MULTILINE)
        if not m:
            return None, None
        lang = (m.group(1) or '').strip()
        code = (m.group(2) or '').strip()
        return (lang or None), (code or None)

 