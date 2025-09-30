"""
Serviço de Processamento de Resposta do AGNO

Responsável por processar, formatar e estruturar respostas do sistema AGNO.
Centraliza toda a lógica de pós-processamento seguindo princípios de responsabilidade única.
"""

import re
import json
import random
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime
from ..types.agno_types import ResponseSegment, ProcessingMetadata, LearningSession
from ..constants.agno_constants import (
    RESPONSE_CONFIG,
    SESSION_CONFIG,
    LOGGING_CONFIG,
    ERROR_CONFIG,
    SECURITY_CONFIG
)


class ResponseService:
    """Serviço especializado em processamento de respostas."""

    def __init__(self):
        self.config = RESPONSE_CONFIG
        self.security_config = SECURITY_CONFIG

    def shuffle_quiz_in_markdown(self, markdown: str) -> str:
        """
        Embaralha alternativas de quiz no markdown.

        Args:
            markdown: Texto markdown com quiz

        Returns:
            Markdown com quiz embaralhado
        """
        try:
            # Encontrar bloco de quiz
            quiz_pattern = r"```quiz\s*([\s\S]*?)```"
            match = re.search(quiz_pattern, markdown, re.IGNORECASE)

            if not match:
                return markdown

            quiz_content = match.group(1).strip()
            obj = json.loads(quiz_content)

            # Embaralhar opções se houver pelo menos 2
            options = obj.get('options', [])
            if len(options) >= 2:
                random.shuffle(options)

                # Reatribuir IDs sequenciais (A, B, C, etc.)
                letters = [chr(ord('A') + i) for i in range(len(options))]
                for i, option in enumerate(options):
                    option['id'] = letters[i]

                obj['options'] = options

                # Recriar bloco de quiz
                new_quiz_block = f"```quiz\n{json.dumps(obj, ensure_ascii=False, indent=2)}\n```"
                return markdown[:match.start()] + new_quiz_block + markdown[match.end():]

        except (json.JSONDecodeError, KeyError, IndexError):
            # Se houver erro no processamento, retorna markdown original
            pass

        return markdown

    def extract_fenced_blocks(self, markdown: str) -> List[Dict[str, Any]]:
        """
        Extrai blocos de código cercados (```) do markdown.

        Args:
            markdown: Texto markdown

        Returns:
            Lista de blocos encontrados
        """
        blocks = []
        pattern = re.compile(r"```(\w+)?\s*([\s\S]*?)```", re.MULTILINE)

        for match in pattern.finditer(markdown or ""):
            lang = (match.group(1) or '').strip().lower()
            code = (match.group(2) or '').strip()

            blocks.append({
                'lang': lang,
                'code': code,
                'start': match.start(),
                'end': match.end(),
            })

        return blocks

    def pick_final_code(self, blocks: List[Dict[str, Any]], max_lines: int) -> Optional[Dict[str, Any]]:
        """
        Seleciona o bloco de código final apropriado.

        Args:
            blocks: Lista de blocos de código
            max_lines: Número máximo de linhas permitido

        Returns:
            Bloco de código final ou None
        """
        # Procurar do último para o primeiro
        for block in reversed(blocks):
            lang = block.get('lang', '')
            code = block.get('code', '')

            # Ignorar tipos específicos
            if lang in ('quiz', 'mermaid', 'excalidraw', 'markdown', 'md'):
                continue

            if not code.strip():
                continue

            lines = code.splitlines()
            return {
                'language': lang or 'text',
                'code': code,
                'truncated': len(lines) > max_lines if max_lines else False,
                'line_count': len(lines),
            }

        return None

    def build_segments(self, markdown: str, final_code: Optional[Dict[str, Any]],
                      user_query: str) -> List[ResponseSegment]:
        """
        Constrói segmentos estruturados da resposta.

        Args:
            markdown: Resposta em markdown
            final_code: Bloco de código final
            user_query: Consulta original do usuário

        Returns:
            Lista de segmentos estruturados
        """
        segments = []

        def make_id(prefix: str, idx: int) -> str:
            return f"{prefix}_{idx}"

        # Processar texto
        text = (markdown or "").replace("\r\n", "\n")
        heading_pattern = re.compile(r"^(##{1,2})\s+(.+)$", re.MULTILINE)
        headings = list(heading_pattern.finditer(text))

        # Análise do Problema/Intro
        intro_end = headings[0].start() if headings else len(text)
        intro_chunk = text[:intro_end].strip()
        intro_chunk = re.sub(r"```[\s\S]*?```", "", intro_chunk).strip()

        if intro_chunk:
            # Determinar título baseado no conteúdo
            title = "Análise do Problema"
            if re.search(r"^##+\s+An[áa]lise do Problema", text, re.IGNORECASE | re.MULTILINE):
                title = "Análise do Problema"
            elif not headings:
                title = "Introdução"

            segments.append(ResponseSegment(
                id=make_id("intro", 1),
                title=title,
                type="intro",
                content=intro_chunk
            ))

        # Reflexão
        reflection_pattern = re.compile(
            r"^##+\s+(Reflex[aã]o guiada|Reflex[aã]o|Dica)\b.*$",
            re.IGNORECASE | re.MULTILINE
        )

        reflection_match = reflection_pattern.search(text)
        if reflection_match:
            start = reflection_match.end()
            next_heading = heading_pattern.search(text, pos=start)
            end = next_heading.start() if next_heading else len(text)

            reflection_content = text[start:end].strip()

            # Converter listas em texto expositivo se necessário
            if re.search(r"^\s*[-*+]\s+", reflection_content, re.MULTILINE):
                bullets = re.sub(r"^\s*[-*+]\s+", "", reflection_content, flags=re.MULTILINE)
                reflection_content = (
                    "Antes da solução, foque em compreender o objetivo, organizar informações e escolher uma estratégia inicial. "
                    "Observe relações importantes e critérios para validar sua resposta.\n\n"
                    + bullets
                )

            segments.append(ResponseSegment(
                id=make_id("reflection", 1),
                title="Reflexão",
                type="reflection",
                content=reflection_content
            ))

        # Pergunta
        question_segment = ResponseSegment(
            id=make_id("question", 1),
            title="Pergunta",
            type="question",
            content=f"Como você explicaria, em poucas linhas, qual seria sua primeira abordagem para resolver \"{user_query or 'o problema'}\"?"
        )

        # Código final
        if final_code and (final_code.get('code') or '').strip():
            lang = (final_code.get('language') or 'text').lower()
            if lang not in ('markdown', 'md'):
                code = final_code.get('code') or ''
                code_block = f"```{lang}\n{code}\n```"

                segments.append(ResponseSegment(
                    id=make_id("final_code", 1),
                    title="Código final",
                    type="final_code",
                    content=code_block,
                    language=lang
                ))

        # Quiz
        quiz_match = re.search(r"```quiz\s*([\s\S]*?)```", text, re.IGNORECASE)
        if quiz_match:
            quiz_content = quiz_match.group(1) or ""
            quiz_block = quiz_match.group(0)

            segments.append(ResponseSegment(
                id=make_id("quiz", 1),
                title="Quiz",
                type="quiz",
                content=quiz_block
            ))

        return segments

    def create_metadata(self, start_time: float, methodology: str,
                       context_provided: bool, user_context_provided: bool,
                       final_code: Optional[Dict[str, Any]] = None) -> ProcessingMetadata:
        """
        Cria metadados de processamento.

        Args:
            start_time: Timestamp de início do processamento
            methodology: Metodologia utilizada
            context_provided: Se contexto foi fornecido
            user_context_provided: Se contexto do usuário foi fornecido
            final_code: Bloco de código final

        Returns:
            Metadados de processamento
        """
        processing_time = self._get_current_time() - start_time

        metadata = ProcessingMetadata(
            processing_time=processing_time,
            methodology_used=methodology,
            context_provided=context_provided,
            user_context_provided=user_context_provided,
            response_format=RESPONSE_CONFIG["DEFAULT_RESPONSE_FORMAT"]
        )

        if final_code:
            metadata.final_code_lines = final_code.get('line_count')
            metadata.final_code_truncated = final_code.get('truncated')

        # Adicionar sugestões para worked examples
        if methodology == "worked_examples":
            metadata.suggested_next_steps = [
                "Tente resolver um problema similar",
                "Identifique os padrões principais",
                "Pratique com variações do exemplo"
            ]

        return metadata

    def create_learning_session(self, user_id: str, methodology: str,
                              start_time: datetime, user_query: str,
                              response: str, duration_minutes: int) -> LearningSession:
        """
        Cria objeto de sessão de aprendizagem.

        Args:
            user_id: ID do usuário
            methodology: Metodologia utilizada
            start_time: Timestamp de início
            user_query: Consulta do usuário
            response: Resposta gerada
            duration_minutes: Duração em minutos

        Returns:
            Sessão de aprendizagem
        """
        return LearningSession(
            id=str(uuid.uuid4()),
            user_id=user_id,
            content_id=f"agno:{methodology}",
            session_type="lesson",
            start_time=start_time,
            end_time=self._get_current_time(),
            duration_minutes=duration_minutes,
            interactions=[
                {"role": "user", "message": user_query},
                {"role": "system", "methodology": methodology, "content": response[:SESSION_CONFIG["MAX_SESSION_CONTENT_LENGTH"]]}
            ],
            completed=True,
        )

    def truncate_response_for_logging(self, response: str) -> str:
        """
        Trunca resposta para logging respeitando limites.

        Args:
            response: Resposta a truncar

        Returns:
            Resposta truncada se necessário
        """
        max_length = LOGGING_CONFIG["MAX_RESPONSE_LOG_LENGTH"]

        if len(response) <= max_length:
            return response

        return response[:max_length - 3] + "..."

    def sanitize_response(self, response: str) -> str:
        """
        Sanitiza resposta removendo conteúdo potencialmente perigoso.

        Args:
            response: Resposta a sanitizar

        Returns:
            Resposta sanitizada
        """
        if not response:
            return ""

        # Verificar tamanho máximo
        if len(response) > self.security_config["MAX_RESPONSE_SIZE"]:
            return ERROR_CONFIG["FALLBACK_RESPONSE"]

        # Verificar padrões bloqueados
        for pattern in self.security_config["BLOCKED_PATTERNS"]:
            if re.search(pattern, response, re.IGNORECASE):
                return ERROR_CONFIG["FALLBACK_RESPONSE"]

        return response

    def format_error_message(self, error: Exception) -> str:
        """
        Formata mensagem de erro respeitando limites.

        Args:
            error: Exceção capturada

        Returns:
            Mensagem de erro formatada
        """
        error_msg = str(error)
        max_length = ERROR_CONFIG["MAX_ERROR_MESSAGE_LENGTH"]

        if len(error_msg) <= max_length:
            return error_msg

        return error_msg[:max_length - 3] + "..."

    def _get_current_time(self) -> datetime:
        """Obtém timestamp atual."""
        return datetime.utcnow()
