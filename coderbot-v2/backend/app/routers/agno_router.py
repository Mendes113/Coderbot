"""
Router para o sistema AGNO (Adaptive Generation of Worked Examples).

Este router expõe endpoints para:
1. Interagir com o sistema AGNO usando diferentes metodologias educacionais
2. Listar metodologias disponíveis
3. Processar consultas com templates XML para worked examples
4. Gerenciar configurações e preferências de metodologias
"""

from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks, status
from typing import Optional, Dict, Any, List, Tuple
from pydantic import BaseModel, Field
import uuid
import time
import re

from app.services.agno_methodology_service import AgnoMethodologyService, MethodologyType
from app.services.agno_team_service import AgnoTeamService

router = APIRouter(
    prefix="/agno",
    tags=["agno"],
    responses={404: {"description": "Not found"}},
)

# --- Modelos Pydantic para validação e documentação ---

class UserContext(BaseModel):
    """Contexto do usuário para personalização das respostas."""
    user_id: str
    current_topic: Optional[str] = None
    difficulty_level: Optional[str] = None
    learning_progress: Optional[Dict[str, Any]] = None
    previous_interactions: Optional[List[str]] = None

class AgnoRequest(BaseModel):
    """Modelo para requisições ao sistema AGNO."""
    methodology: str = Field(
        description="Metodologia educacional a ser utilizada",
        example="worked_examples"
    )
    user_query: str = Field(
        description="Pergunta ou problema do usuário",
        example="Como resolver uma equação do segundo grau?"
    )
    context: Optional[str] = Field(
        default=None,
        description="Contexto adicional para a pergunta",
        example="Estamos estudando funções quadráticas na disciplina de matemática"
    )
    user_context: Optional[UserContext] = Field(
        default=None,
        description="Contexto do usuário para personalização"
    )
    # Preferências de saída
    include_final_code: Optional[bool] = Field(
        default=True,
        description="Se verdadeiro, instrui o agente a incluir um bloco final com o código completo."
    )
    # Mantido para compatibilidade, mas ignorado
    include_diagram: Optional[bool] = Field(
        default=False,
        description="(Deprecado) Diagrama não é mais gerado pela API."
    )
    diagram_type: Optional[str] = Field(
        default=None,
        description="(Ignorado) Tipo de diagrama preferido"
    )
    max_final_code_lines: Optional[int] = Field(
        default=150,
        description="Limite de linhas para o código final (para usabilidade)."
    )

class AgnoResponse(BaseModel):
    """Modelo de resposta do sistema AGNO."""
    response: str = Field(description="Resposta gerada pelo sistema AGNO")
    methodology: str = Field(description="Metodologia utilizada")
    is_xml_formatted: bool = Field(
        description="Indica se a resposta está formatada em XML"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Metadados adicionais da resposta"
    )
    extras: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Dados extras como código final extraído da resposta"
    )

class MethodologyInfo(BaseModel):
    """Informações sobre uma metodologia educacional."""
    id: str
    name: str
    description: str
    recommended_for: List[str]
    is_xml_formatted: bool = Field(
        description="Indica se a metodologia retorna respostas em XML"
    )

class MethodologiesResponse(BaseModel):
    """Lista de metodologias disponíveis."""
    methodologies: List[str]
    methodology_info: List[MethodologyInfo]

class HealthResponse(BaseModel):
    """Resposta de health check."""
    status: str = "healthy"
    service: str = "agno"
    timestamp: float

# --- Dependências ---

def get_agno_service(
    provider: Optional[str] = Query(default="claude", description="Provedor de IA (claude ou openai)"),
    model_id: Optional[str] = Query(default=None, description="ID do modelo específico")
) -> AgnoMethodologyService:
    """Cria e retorna uma instância do serviço AGNO."""
    # Mapear modelos padrão por provedor
    default_models = {
        "claude": "claude-3-5-sonnet-20241022",
        "openai": "gpt-4o"
    }
    
    # Se model_id não foi especificado, usar o padrão do provedor
    if not model_id:
        model_id = default_models.get(provider, "claude-3-5-sonnet-20241022")
    
    return AgnoMethodologyService(model_id=model_id, provider=provider)

# --- Endpoints ---

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Endpoint de health check do serviço AGNO."""
    return HealthResponse(timestamp=time.time())

@router.get("/methodologies", response_model=MethodologiesResponse)
async def get_methodologies(
    agno_service: AgnoMethodologyService = Depends(get_agno_service)
):
    """
    Retorna a lista de metodologias educacionais disponíveis.
    
    Returns:
        MethodologiesResponse: Lista de metodologias com informações detalhadas
    """
    try:
        methodologies = [methodology.value for methodology in MethodologyType]
        
        methodology_info = []
        for methodology in MethodologyType:
            info = MethodologyInfo(
                id=methodology.value,
                name=_get_methodology_name(methodology),
                description=_get_methodology_description(methodology),
                recommended_for=_get_methodology_recommendations(methodology),
                is_xml_formatted=(methodology == MethodologyType.WORKED_EXAMPLES)
            )
            methodology_info.append(info)
        
        return MethodologiesResponse(
            methodologies=methodologies,
            methodology_info=methodology_info
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar metodologias: {str(e)}"
        )

@router.post("/ask", response_model=AgnoResponse)
async def ask_question(
    request: AgnoRequest,
    agno_service: AgnoMethodologyService = Depends(get_agno_service)
):
    """
    Processa uma pergunta usando o sistema AGNO.
    
    Args:
        request: Requisição contendo a pergunta e metodologia
        agno_service: Instância do serviço AGNO
        
    Returns:
        AgnoResponse: Resposta processada pelo sistema AGNO
    """
    try:
        # Valida a metodologia
        if not _is_valid_methodology(request.methodology):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Metodologia '{request.methodology}' não é válida"
            )
        
        # Converte string para enum
        methodology_enum = MethodologyType(request.methodology)
        
        # Processa a pergunta
        start_time = time.time()
        # Augmentar contexto com instruções para código final e exemplos correto/incorreto
        def _augment_context_for_outputs(base_context: Optional[str], req: AgnoRequest) -> str:
            context_parts: List[str] = []
            if base_context:
                context_parts.append(str(base_context))
            instructions = [
                "FORMATAÇÃO: Responda em Markdown claro, com passos do exemplo trabalhado.",
                "Inclua DOIS pequenos exemplos:",
                "- Exemplo Correto: mostre a abordagem correta em poucas linhas, com breve explicação.",
                "- Exemplo Incorreto: mostre um erro comum, explique por que está errado e como corrigir.",
                "No FINAL da resposta inclua:",
            ]
            if req.include_final_code:
                instructions.append(
                    f"1) Uma seção 'Código final' contendo UM ÚNICO bloco de código completo, pronto para executar, com no máximo {req.max_final_code_lines} linhas, usando a linguagem adequada (ex.: ```python, ```javascript, etc.)."
                )
            instructions.append("Mantenha o código final conciso e funcional. Evite trechos enormes.")
            context_parts.append("\n".join(instructions))
            return "\n\n".join([p for p in context_parts if p])

        augmented_context = _augment_context_for_outputs(request.context, request)

        team_extras: Dict[str, Any] = {}
        if request.include_final_code:
            team = AgnoTeamService(provider=agno_service.provider, model_id=agno_service.model_id)
            response, team_extras = team.generate_worked_example_with_artifacts(
                user_query=request.user_query,
                base_context=augmented_context,
                include_final_code=True,
                include_diagram=False,
                diagram_type=None,
                max_final_code_lines=request.max_final_code_lines or 150,
            )
        else:
            response = agno_service.ask(
                methodology=methodology_enum,
                user_query=request.user_query,
                context=augmented_context
            )
        processing_time = time.time() - start_time
        
        # Prepara metadados
        metadata = {
            "processing_time": processing_time,
            "methodology_used": request.methodology,
            "context_provided": request.context is not None,
            "user_context_provided": request.user_context is not None,
            "response_format": "markdown"
        }
        
        # Pós-processamento: extrair código final
        def _extract_fenced_blocks(md: str) -> List[Dict[str, Any]]:
            blocks: List[Dict[str, Any]] = []
            # Captura ```lang ... ``` incluindo newlines
            pattern = re.compile(r"```(\w+)?\s*([\s\S]*?)```", re.MULTILINE)
            for m in pattern.finditer(md or ""):
                lang = (m.group(1) or '').strip().lower()
                code = (m.group(2) or '').strip()
                blocks.append({
                    'lang': lang,
                    'code': code,
                    'start': m.start(),
                    'end': m.end(),
                })
            return blocks

        def _pick_final_code(blocks: List[Dict[str, Any]], max_lines: int) -> Optional[Dict[str, Any]]:
            # escolha: último bloco que não seja quiz/mermaid/excalidraw
            for b in reversed(blocks):
                lang = b.get('lang') or ''
                if lang in ('quiz', 'mermaid', 'excalidraw'):
                    continue
                code = b.get('code') or ''
                if not code.strip():
                    continue
                lines = code.splitlines()
                truncated = False
                if max_lines and len(lines) > max_lines:
                    truncated = True
                    # não truncar o conteúdo para não quebrar execução; apenas sinalizar
                return {
                    'language': lang or 'text',
                    'code': code,
                    'truncated': truncated,
                    'line_count': len(lines),
                }
            return None

        blocks = _extract_fenced_blocks(response)
        extras: Dict[str, Any] = {}
        if team_extras:
            extras.update(team_extras)
        if request.include_final_code:
            final_code = _pick_final_code(blocks, request.max_final_code_lines or 150)
            if final_code:
                extras['final_code'] = final_code
                metadata['final_code_lines'] = final_code.get('line_count')
                metadata['final_code_truncated'] = final_code.get('truncated')

        # Adiciona sugestões de próximos passos para worked examples
        if methodology_enum == MethodologyType.WORKED_EXAMPLES:
            metadata["suggested_next_steps"] = [
                "Tente resolver um problema similar",
                "Identifique os padrões principais",
                "Pratique com variações do exemplo"
            ]
        
        return AgnoResponse(
            response=response,
            methodology=request.methodology,
            is_xml_formatted=False,  # Sempre False - agora geramos markdown diretamente
            metadata=metadata,
            extras=extras or None
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de validação: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno do servidor: {str(e)}"
        )

@router.post("/worked-example", response_model=AgnoResponse)
async def get_worked_example(
    request: AgnoRequest,
    agno_service: AgnoMethodologyService = Depends(get_agno_service)
):
    """
    Endpoint de conveniência para obter um worked example.
    
    Args:
        request: Requisição AGNO com pergunta e contexto
        agno_service: Instância do serviço AGNO
        
    Returns:
        AgnoResponse: Resposta em formato XML com worked example
    """
    # Força a metodologia para worked examples
    request.methodology = MethodologyType.WORKED_EXAMPLES.value
    
    return await ask_question(request, agno_service)

# --- Funções auxiliares ---

def _is_valid_methodology(methodology: str) -> bool:
    """Valida se uma metodologia é válida."""
    try:
        MethodologyType(methodology)
        return True
    except ValueError:
        return False

def _get_methodology_name(methodology: MethodologyType) -> str:
    """Retorna o nome legível de uma metodologia."""
    names = {
        MethodologyType.SEQUENTIAL_THINKING: "Pensamento Sequencial",
        MethodologyType.ANALOGY: "Analogias",
        MethodologyType.SOCRATIC: "Método Socrático",
        MethodologyType.SCAFFOLDING: "Scaffolding",
        MethodologyType.WORKED_EXAMPLES: "Exemplos Resolvidos",
        MethodologyType.DEFAULT: "Padrão"
    }
    return names.get(methodology, "Desconhecido")

def _get_methodology_description(methodology: MethodologyType) -> str:
    """Retorna a descrição de uma metodologia."""
    descriptions = {
        MethodologyType.SEQUENTIAL_THINKING: "Explica o raciocínio passo a passo de forma sequencial",
        MethodologyType.ANALOGY: "Usa analogias do cotidiano para facilitar o entendimento",
        MethodologyType.SOCRATIC: "Estimula o pensamento crítico através de perguntas",
        MethodologyType.SCAFFOLDING: "Oferece dicas graduais removendo o suporte progressivamente",
        MethodologyType.WORKED_EXAMPLES: "Ensina através de exemplos detalhadamente resolvidos",
        MethodologyType.DEFAULT: "Resposta educacional padrão, clara e objetiva"
    }
    return descriptions.get(methodology, "Descrição não disponível")

def _get_methodology_recommendations(methodology: MethodologyType) -> List[str]:
    """Retorna recomendações de uso para uma metodologia."""
    recommendations = {
        MethodologyType.SEQUENTIAL_THINKING: [
            "Problemas complexos com múltiplas etapas",
            "Estudantes que precisam de estrutura",
            "Conceitos que requerem ordem lógica"
        ],
        MethodologyType.ANALOGY: [
            "Conceitos abstratos",
            "Estudantes visuais",
            "Tópicos difíceis de visualizar"
        ],
        MethodologyType.SOCRATIC: [
            "Desenvolvimento de pensamento crítico",
            "Estudantes avançados",
            "Discussões conceituais"
        ],
        MethodologyType.SCAFFOLDING: [
            "Estudantes iniciantes",
            "Conceitos progressivos",
            "Desenvolvimento gradual de habilidades"
        ],
        MethodologyType.WORKED_EXAMPLES: [
            "Resolução de problemas",
            "Aprendizado de algoritmos",
            "Demonstração de técnicas"
        ],
        MethodologyType.DEFAULT: [
            "Uso geral",
            "Primeira interação",
            "Quando não há preferência específica"
        ]
    }
    return recommendations.get(methodology, []) 