"""
Constantes do serviço AGNO

Centraliza todas as constantes relacionadas ao serviço AGNO para facilitar manutenção
e evitar duplicação de valores mágicos.
"""

from typing import Dict, Any
from .types.agno_types import MethodologyType, MethodologyConfig

# Configurações padrão de modelos por provedor
DEFAULT_MODELS = {
    "claude": "claude-sonnet-4-20250514",
    "openai": "gpt-4o",
    "ollama": "llama3.1",
}

# Configurações de metodologia
METHODOLOGY_CONFIGS: Dict[MethodologyType, MethodologyConfig] = {
    MethodologyType.SEQUENTIAL_THINKING: MethodologyConfig(
        description="Tutor especializado em pensamento sequencial com foco em progressão lógica.",
        display_name="Pensamento Sequencial",
        summary="Explica o raciocínio passo a passo de forma estruturada",
        use_cases=[
            "Problemas complexos com múltiplas etapas",
            "Estudantes que precisam de estrutura",
            "Conceitos que requerem ordem lógica"
        ],
        xml_formatted=False,
    ),
    MethodologyType.ANALOGY: MethodologyConfig(
        description="Tutor que aproxima conceitos a experiências familiares sem perder precisão técnica.",
        display_name="Analogias",
        summary="Usa analogias do cotidiano para facilitar o entendimento",
        use_cases=[
            "Conceitos abstratos",
            "Estudantes visuais",
            "Tópicos difíceis de visualizar"
        ],
        xml_formatted=False,
    ),
    MethodologyType.SOCRATIC: MethodologyConfig(
        description="Tutor que conduz o aprendizado por perguntas encadeadas e reflexão.",
        display_name="Método Socrático",
        summary="Estimula o pensamento crítico através de perguntas",
        use_cases=[
            "Desenvolvimento de pensamento crítico",
            "Estudantes avançados",
            "Discussões conceituais"
        ],
        xml_formatted=False,
    ),
    MethodologyType.SCAFFOLDING: MethodologyConfig(
        description="Tutor que oferece suporte gradual removendo andaimes à medida que o aluno avança.",
        display_name="Scaffolding",
        summary="Oferece dicas graduais removendo o suporte progressivamente",
        use_cases=[
            "Estudantes iniciantes",
            "Conceitos progressivos",
            "Desenvolvimento gradual de habilidades"
        ],
        xml_formatted=False,
    ),
    MethodologyType.WORKED_EXAMPLES: MethodologyConfig(
        description="Tutor especializado em exemplos trabalhados completos com reflexão guiada.",
        display_name="Exemplos Resolvidos",
        summary="Ensina através de exemplos detalhadamente resolvidos",
        use_cases=[
            "Resolução de problemas",
            "Aprendizado de algoritmos",
            "Demonstração de técnicas"
        ],
        xml_formatted=False,
    ),
    MethodologyType.DEFAULT: MethodologyConfig(
        description="Tutor educacional padrão orientado por pesquisas.",
        display_name="Padrão",
        summary="Resposta educacional padrão, clara e objetiva",
        use_cases=[
            "Uso geral",
            "Primeira interação",
            "Quando não há preferência específica"
        ],
        xml_formatted=False,
    ),
}

# Configurações de resposta
RESPONSE_CONFIG = {
    "MAX_FINAL_CODE_LINES": 150,
    "MAX_CONTEXT_LENGTH": 12000,
    "MIN_QUERY_LENGTH": 3,
    "MAX_MEMORY_ITEMS": 8,
    "MAX_MEMORY_LENGTH": 1000,
    "DEFAULT_RESPONSE_FORMAT": "markdown",
}

# Configurações de sessão
SESSION_CONFIG = {
    "MAX_SESSIONS_TO_RETRIEVE": 5,
    "MAX_INTERACTIONS_PER_SESSION": 2,
    "MAX_SESSION_CONTENT_LENGTH": 2000,
}

# Configurações de validação
VALIDATION_CONFIG = {
    "MIN_ALPHANUMERIC_RATIO": 0.55,
    "EDUCATIONAL_KEYWORDS": [
        "aprender", "aprendiz", "estudar", "estudo", "explicar", "como ", "como fazer",
        "resolver", "solucionar", "exemplo", "exercício", "trabalhado", "worked example",
        "algoritmo", "program", "código", "codigo", "matem", "lógica", "conceito",
        "scaffolding", "socrático", "socratic", "analogia", "didátic", "didatic",
    ],
}

# Configurações de template
TEMPLATE_CONFIG = {
    "DEFAULT_FORMAT": "markdown",
    "SUPPORTED_FORMATS": ["markdown", "xml"],
    "MAX_TEMPLATE_LENGTH": 50000,
    "WORKED_EXAMPLES_SEGMENTS": {
        "reflexivo": {
            "title": "Reflexão Inicial",
            "description": "Espaço para o estudante pensar sobre o problema antes da solução",
            "required": True,
            "type": "reflection"
        },
        "etapas": {
            "title": "Passo a Passo",
            "description": "Etapas detalhadas para resolver o problema",
            "required": True,
            "type": "steps"
        },
        "exemplo_correto": {
            "title": "Exemplo Correto",
            "description": "Demonstração da solução correta com código",
            "required": True,
            "type": "correct_example"
        },
        "exemplo_incorreto": {
            "title": "Exemplo Incorreto",
            "description": "Erro comum para análise crítica",
            "required": True,
            "type": "incorrect_example"
        },
        "quiz": {
            "title": "Quiz de Verificação",
            "description": "Perguntas para reforçar o aprendizado",
            "required": True,
            "type": "quiz",
            "max_options": 5
        }
    }
}

# Configurações de logging
LOGGING_CONFIG = {
    "MAX_RESPONSE_LOG_LENGTH": 1000,
    "LOG_PROCESSING_TIME": True,
    "LOG_USER_CONTEXT": False,  # Privacidade
}

# Configurações de erro
ERROR_CONFIG = {
    "MAX_ERROR_MESSAGE_LENGTH": 500,
    "FALLBACK_RESPONSE": "Desculpe, ocorreu um erro interno. Tente novamente.",
}

# Configurações de performance
PERFORMANCE_CONFIG = {
    "TIMEOUT_SECONDS": 60,
    "MAX_RETRIES": 3,
    "RETRY_DELAY": 1.0,
}

# Configurações de segurança
SECURITY_CONFIG = {
    "MAX_RESPONSE_SIZE": 100000,  # 100KB
    "ALLOWED_FILE_TYPES": [".md", ".txt", ".json"],
    "BLOCKED_PATTERNS": [
        r"<script.*?>.*?</script>",
        r"javascript:",
        r"vbscript:",
        r"onload=",
        r"onerror=",
    ],
}

# Exportações para facilitar acesso
__all__ = [
    "DEFAULT_MODELS",
    "METHODOLOGY_CONFIGS",
    "RESPONSE_CONFIG",
    "SESSION_CONFIG",
    "VALIDATION_CONFIG",
    "TEMPLATE_CONFIG",
    "LOGGING_CONFIG",
    "ERROR_CONFIG",
    "PERFORMANCE_CONFIG",
    "SECURITY_CONFIG",
]
