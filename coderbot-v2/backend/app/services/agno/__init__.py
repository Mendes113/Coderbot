"""
Sistema AGNO - Refatorado

Versão modular e organizada seguindo padrões da indústria.

Estrutura:
- types/: Tipos e interfaces TypeScript
- constants/: Constantes centralizadas
- core/: Serviços especializados (validação, resposta, contexto)
- providers/: Integração com diferentes provedores
- utils/: Utilitários e helpers

Benefícios da refatoração:
- ✅ Separação clara de responsabilidades
- ✅ Código mais testável e manutenível
- ✅ Melhor organização e estrutura
- ✅ Facilita extensões futuras
- ✅ Padrões de indústria aplicados
"""

# Exportar tipos principais
from .types.agno_types import (
    MethodologyType,
    ProviderType,
    MethodologyConfig,
    UserContext,
    AgnoRequest,
    AgnoResponse,
    ResponseSegment,
    ProcessingMetadata,
    LearningSession,
)

# Exportar constantes
from .constants.agno_constants import (
    DEFAULT_MODELS,
    METHODOLOGY_CONFIGS,
    RESPONSE_CONFIG,
    SESSION_CONFIG,
    VALIDATION_CONFIG,
    TEMPLATE_CONFIG,
    LOGGING_CONFIG,
    ERROR_CONFIG,
    PERFORMANCE_CONFIG,
    SECURITY_CONFIG,
)

# Exportar serviços especializados
from .core.validation_service import ValidationService
from .core.response_service import ResponseService
from .core.context_service import ContextService
from .core.worked_examples_service import WorkedExamplesService

# Exportar serviço principal
from .agno_service import AgnoService, get_methodology_config, get_all_methodology_configs

# Exportar versões para compatibilidade
__all__ = [
    # Tipos
    "MethodologyType",
    "ProviderType",
    "MethodologyConfig",
    "UserContext",
    "AgnoRequest",
    "AgnoResponse",
    "ResponseSegment",
    "ProcessingMetadata",
    "LearningSession",

    # Constantes
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

    # Serviços
    "ValidationService",
    "ResponseService",
    "ContextService",
    "WorkedExamplesService",
    "AgnoService",

    # Funções auxiliares
    "get_methodology_config",
    "get_all_methodology_configs",
]
