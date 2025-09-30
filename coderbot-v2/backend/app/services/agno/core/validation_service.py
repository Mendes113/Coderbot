"""
Serviço de Validação do AGNO

Responsável por validar entradas, saídas e configurações do sistema AGNO.
Centraliza toda a lógica de validação seguindo princípios de responsabilidade única.
"""

import re
from typing import Optional, Dict, Any, List
from ..types.agno_types import ValidationResult, UserContext
from ..constants.agno_constants import VALIDATION_CONFIG, RESPONSE_CONFIG


class ValidationService:
    """Serviço especializado em validações do sistema AGNO."""

    def __init__(self):
        self.config = VALIDATION_CONFIG

    def validate_methodology(self, methodology: str) -> ValidationResult:
        """
        Valida se uma metodologia é suportada.

        Args:
            methodology: Nome da metodologia a validar

        Returns:
            ValidationResult com resultado da validação
        """
        from ..types.agno_types import MethodologyType

        try:
            MethodologyType(methodology)
            return {"valid": True, "message": "Metodologia válida"}
        except ValueError:
            valid_methodologies = [m.value for m in MethodologyType]
            return {
                "valid": False,
                "message": f"Metodologia '{methodology}' não é válida",
                "suggestions": valid_methodologies
            }

    def validate_user_query(self, query: Optional[str]) -> ValidationResult:
        """
        Valida se a consulta do usuário é adequada.

        Args:
            query: Consulta do usuário

        Returns:
            ValidationResult com resultado da validação
        """
        if not query or not query.strip():
            return {
                "valid": False,
                "message": "Consulta não pode estar vazia"
            }

        query_clean = query.strip()

        if len(query_clean) < RESPONSE_CONFIG["MIN_QUERY_LENGTH"]:
            return {
                "valid": False,
                "message": f"Consulta deve ter pelo menos {RESPONSE_CONFIG['MIN_QUERY_LENGTH']} caracteres"
            }

        # Verificar se parece gibberish
        if self._is_gibberish(query_clean):
            return {
                "valid": False,
                "message": "Consulta parece não ser uma pergunta educacional válida",
                "suggestion": "Reformule com objetivo de aprendizagem claro"
            }

        return {"valid": True, "message": "Consulta válida"}

    def validate_context(self, context: Optional[str]) -> ValidationResult:
        """
        Valida se o contexto adicional é válido.

        Args:
            context: Contexto adicional

        Returns:
            ValidationResult com resultado da validação
        """
        if not context:
            return {"valid": True, "message": "Sem contexto adicional"}

        if len(context) > RESPONSE_CONFIG["MAX_CONTEXT_LENGTH"]:
            return {
                "valid": False,
                "message": f"Contexto muito longo (máximo {RESPONSE_CONFIG['MAX_CONTEXT_LENGTH']} caracteres)"
            }

        return {"valid": True, "message": "Contexto válido"}

    def validate_educational_query(self, query: str, user_context: Optional[UserContext] = None) -> ValidationResult:
        """
        Valida se a consulta parece ser educacional.

        Args:
            query: Consulta do usuário
            user_context: Contexto do usuário

        Returns:
            ValidationResult com resultado da validação
        """
        # Se houver contexto de usuário com tópico, consideramos educacional
        if user_context and (user_context.current_topic or user_context.learning_progress):
            return {"valid": True, "message": "Consulta considerada educacional pelo contexto"}

        query_lower = query.lower()
        educational_keywords = self.config["EDUCATIONAL_KEYWORDS"]

        for keyword in educational_keywords:
            if keyword in query_lower:
                return {"valid": True, "message": f"Consulta educacional detectada (palavra-chave: '{keyword}')"}

        return {
            "valid": False,
            "message": "Consulta não parece ser educacional",
            "suggestion": "Reformule com foco educacional (ex: 'Explique...', 'Como resolver...')"
        }

    def validate_response_content(self, response: str) -> ValidationResult:
        """
        Valida se o conteúdo da resposta é seguro e adequado.

        Args:
            response: Resposta a validar

        Returns:
            ValidationResult com resultado da validação
        """
        if not response or not response.strip():
            return {
                "valid": False,
                "message": "Resposta vazia"
            }

        # Verificar tamanho
        if len(response) > RESPONSE_CONFIG.get("MAX_RESPONSE_SIZE", 100000):
            return {
                "valid": False,
                "message": "Resposta muito longa"
            }

        # Verificar padrões bloqueados
        blocked_patterns = [
            r"<script.*?>.*?</script>",
            r"javascript:",
            r"vbscript:",
            r"onload=",
            r"onerror=",
        ]

        for pattern in blocked_patterns:
            if re.search(pattern, response, re.IGNORECASE):
                return {
                    "valid": False,
                    "message": f"Padrão bloqueado detectado: {pattern}"
                }

        return {"valid": True, "message": "Resposta segura"}

    def _is_gibberish(self, text: str) -> bool:
        """
        Verifica se o texto parece ser gibberish (não textual válido).

        Args:
            text: Texto a analisar

        Returns:
            True se parece gibberish, False caso contrário
        """
        if len(text) < RESPONSE_CONFIG["MIN_QUERY_LENGTH"]:
            return True

        # Razão de caracteres alfanuméricos + espaço sobre total
        allowed_chars = sum(1 for ch in text if ch.isalnum() or ch.isspace())
        ratio = allowed_chars / max(1, len(text))

        return ratio < self.config["MIN_ALPHANUMERIC_RATIO"]

    def validate_user_context(self, user_context: Optional[UserContext]) -> ValidationResult:
        """
        Valida o contexto do usuário.

        Args:
            user_context: Contexto do usuário

        Returns:
            ValidationResult com resultado da validação
        """
        if not user_context:
            return {"valid": True, "message": "Sem contexto de usuário"}

        if not user_context.user_id or not user_context.user_id.strip():
            return {
                "valid": False,
                "message": "ID do usuário é obrigatório"
            }

        return {"valid": True, "message": "Contexto de usuário válido"}

    def validate_learning_session(self, session_data: Dict[str, Any]) -> ValidationResult:
        """
        Valida dados de sessão de aprendizagem.

        Args:
            session_data: Dados da sessão

        Returns:
            ValidationResult com resultado da validação
        """
        required_fields = ["user_id", "content_id", "interactions"]

        for field in required_fields:
            if field not in session_data:
                return {
                    "valid": False,
                    "message": f"Campo obrigatório ausente: {field}",
                    "missing_fields": [f for f in required_fields if f not in session_data]
                }

        if not session_data["interactions"]:
            return {
                "valid": False,
                "message": "Sessão deve ter pelo menos uma interação"
            }

        return {"valid": True, "message": "Sessão válida"}

    def sanitize_input(self, text: str) -> str:
        """
        Sanitiza entrada do usuário removendo caracteres potencialmente perigosos.

        Args:
            text: Texto a sanitizar

        Returns:
            Texto sanitizado
        """
        if not text:
            return ""

        # Remove caracteres de controle
        sanitized = "".join(char for char in text if ord(char) >= 32 or char in "\t\n\r")

        # Remove sequências potencialmente perigosas
        dangerous_patterns = [
            r"<script.*?>",
            r"</script>",
            r"javascript:",
            r"vbscript:",
            r"on\w+\s*=",
        ]

        for pattern in dangerous_patterns:
            sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE)

        return sanitized.strip()

    def get_validation_summary(self, validations: List[ValidationResult]) -> Dict[str, Any]:
        """
        Gera um resumo das validações realizadas.

        Args:
            validations: Lista de resultados de validação

        Returns:
            Resumo das validações
        """
        valid_count = sum(1 for v in validations if v.get("valid", False))
        total_count = len(validations)

        return {
            "total_validations": total_count,
            "valid_count": valid_count,
            "invalid_count": total_count - valid_count,
            "success_rate": valid_count / total_count if total_count > 0 else 0,
            "errors": [v.get("message", "") for v in validations if not v.get("valid", False)],
            "warnings": [v.get("message", "") for v in validations if v.get("warning", False)],
        }
