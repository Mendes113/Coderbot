"""
Agno Methodology Service

Este serviço utiliza a biblioteca Agno para criar agentes de IA adaptados a diferentes metodologias educacionais.
Cada agente pode ser configurado com prompts/instruções específicas para a metodologia desejada.

Melhorias implementadas:
- Templates XML mais robustos para worked examples
- Validação de entrada e formatação de saída
- Tratamento de erros aprimorado
- Templates XML para outras metodologias
- Validação de XML de saída
- Logs detalhados
- Suporte para múltiplos provedores (OpenAI e Claude)
"""

from typing import Optional, Dict, Any, List
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from enum import Enum
import logging
import xml.etree.ElementTree as ET
import re
import json
from pathlib import Path

# Import do nosso modelo customizado
from .agno_models import create_model, get_available_models

class MethodologyType(Enum):
    SEQUENTIAL_THINKING = "sequential_thinking"
    ANALOGY = "analogy"
    SOCRATIC = "socratic"
    SCAFFOLDING = "scaffolding"
    WORKED_EXAMPLES = "worked_examples"
    DEFAULT = "default"

# Configuração de logging
logger = logging.getLogger(__name__)

class AgnoMethodologyService:
    def __init__(self, model_id: str = "gpt-4o", provider: Optional[str] = None):
        """
        Inicializa o serviço AGNO com suporte a múltiplos provedores.
        
        Args:
            model_id: ID do modelo a ser usado (padrão: gpt-4o)
            provider: Provedor do modelo ('openai' ou 'claude'). 
                     Se não especificado, será auto-detectado baseado no model_id
        """
        self.model_id = model_id
        self.provider = provider or self._detect_provider(model_id)
        self.logger = logger
        self.xml_validation_enabled = True
        
        # Carregar configuração de modelos
        self.model_config = self._load_model_config()
        
        self.logger.info(f"AgnoMethodologyService inicializado com modelo: {model_id} (provedor: {self.provider})")
        
        self.agent_configs = {
            MethodologyType.SEQUENTIAL_THINKING: {
                "description": "Você é um tutor que ensina passo a passo (pensamento sequencial).",
                "instructions": [
                    "Explique o raciocínio de forma sequencial, detalhando cada etapa lógica.",
                    "Garanta que o aluno compreenda cada passo antes de avançar.",
                    "Peça ao aluno para explicar o que entendeu após cada etapa.",
                    "Se o aluno errar, volte ao passo anterior e explique de outra forma.",
                    "Utilize listas numeradas para cada etapa do raciocínio."
                ]
            },
            MethodologyType.ANALOGY: {
                "description": "Você é um tutor que usa analogias para facilitar o entendimento.",
                "instructions": [
                    "Sempre que possível, utilize analogias do cotidiano para explicar conceitos complexos.",
                    "Relacione o conteúdo a situações familiares ao aluno.",
                    "Peça ao aluno para criar sua própria analogia após a explicação.",
                    "Explique as limitações da analogia utilizada.",
                    "Ofereça múltiplas analogias se o aluno não entender de primeira."
                ]
            },
            MethodologyType.SOCRATIC: {
                "description": "Você é um tutor que utiliza o método socrático.",
                "instructions": [
                    "Responda com perguntas que estimulem o pensamento crítico do aluno.",
                    "Evite dar respostas diretas, incentive a reflexão.",
                    "Construa uma sequência de perguntas que leve o aluno à resposta.",
                    "Adapte o nível das perguntas conforme o progresso do aluno.",
                    "Peça justificativas para as respostas do aluno."
                ]
            },
            MethodologyType.SCAFFOLDING: {
                "description": "Você é um tutor que utiliza scaffolding (andaime educacional).",
                "instructions": [
                    "Ofereça dicas e pistas graduais, removendo o suporte conforme o aluno avança.",
                    "Adapte o nível de ajuda conforme a resposta do aluno.",
                    "Comece com exemplos guiados e vá reduzindo o suporte.",
                    "Peça ao aluno para tentar sozinho após algumas dicas.",
                    "Reforce positivamente cada avanço do aluno."
                ]
            },
            MethodologyType.WORKED_EXAMPLES: {
                "description": "Você é um tutor que ensina por meio de exemplos resolvidos.",
                "instructions": [
                    "Apresente exemplos resolvidos detalhadamente antes de propor exercícios ao aluno.",
                    "Explique cada etapa do exemplo.",
                    "Peça ao aluno para identificar o próximo passo do exemplo.",
                    "Após o exemplo, proponha um exercício semelhante para o aluno resolver.",
                    "Destaque os pontos-chave e armadilhas comuns em cada exemplo."
                ]
            },
            MethodologyType.DEFAULT: {
                "description": "Você é um tutor educacional padrão.",
                "instructions": [
                    "Responda de forma clara, objetiva e didática.",
                    "Adapte o nível da explicação ao conhecimento prévio do aluno.",
                    "Ofereça exemplos simples para ilustrar conceitos.",
                    "Encoraje o aluno a fazer perguntas sempre que tiver dúvidas."
                ]
            }
        }

    def _detect_provider(self, model_id: str) -> str:
        """
        Detecta automaticamente o provedor baseado no model_id.
        
        Args:
            model_id: ID do modelo
            
        Returns:
            str: Nome do provedor ('openai' ou 'claude')
        """
        if model_id.startswith('claude'):
            return 'claude'
        elif model_id.startswith(('gpt', 'o1', 'o3')):
            return 'openai'
        else:
            # Verificar na configuração de modelos
            model_config = self._load_model_config()
            if model_id in model_config:
                return model_config[model_id].get('provider', 'openai')
            
            # Padrão para OpenAI se não conseguir detectar
            self.logger.warning(f"Não foi possível detectar provedor para {model_id}, usando OpenAI como padrão")
            return 'openai'
    
    def _load_model_config(self) -> Dict[str, Any]:
        """
        Carrega configuração de modelos do arquivo JSON.
        
        Returns:
            Dict com configuração dos modelos
        """
        try:
            config_path = Path(__file__).parent / "configs" / "model_config.json"
            if config_path.exists():
                with open(config_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            self.logger.warning(f"Erro ao carregar configuração de modelos: {e}")
        
        return {}
    
    def _get_model_name(self, model_id: str) -> str:
        """
        Obtém o nome real do modelo baseado na configuração.
        
        Args:
            model_id: ID do modelo
            
        Returns:
            str: Nome real do modelo
        """
        if model_id in self.model_config:
            return self.model_config[model_id].get('model_name', model_id)
        return model_id

    def get_agent(self, methodology: MethodologyType) -> Agent:
        """
        Cria um agente AGNO com o modelo apropriado baseado no provedor.
        
        Args:
            methodology: Metodologia educacional a ser utilizada
            
        Returns:
            Agent: Instância do agente AGNO configurado
        """
        config = self.agent_configs.get(methodology, self.agent_configs[MethodologyType.DEFAULT])
        
        # Obter o nome real do modelo
        real_model_name = self._get_model_name(self.model_id)
        
        try:
            # Criar modelo usando nossa factory function
            model = create_model(self.provider, real_model_name)
            
            return Agent(
                model=model,
                description=config["description"],
                instructions=[self._build_xml_prompt(config)],
                markdown=True
            )
        except Exception as e:
            self.logger.error(f"Erro ao criar agente com {self.provider}/{real_model_name}: {e}")
            # Fallback para OpenAI se houver erro
            if self.provider != 'openai':
                self.logger.info("Fazendo fallback para OpenAI")
                fallback_model = OpenAIChat(id="gpt-4o")
                return Agent(
                    model=fallback_model,
                    description=config["description"],
                    instructions=[self._build_xml_prompt(config)],
                    markdown=True
                )
            else:
                raise
    
    def get_available_providers(self) -> List[str]:
        """
        Retorna lista de provedores disponíveis.
        
        Returns:
            List[str]: Lista de provedores suportados
        """
        return ['openai', 'claude']
    
    def get_available_models_for_provider(self, provider: str) -> List[str]:
        """
        Retorna modelos disponíveis para um provedor específico.
        
        Args:
            provider: Nome do provedor
            
        Returns:
            List[str]: Lista de modelos disponíveis
        """
        available_models = get_available_models()
        return list(available_models.get(provider, {}).keys())
    
    def switch_model(self, model_id: str, provider: Optional[str] = None):
        """
        Troca o modelo sendo usado pelo serviço.
        
        Args:
            model_id: Novo ID do modelo
            provider: Novo provedor (opcional, será auto-detectado se não fornecido)
        """
        old_model = self.model_id
        old_provider = self.provider
        
        self.model_id = model_id
        self.provider = provider or self._detect_provider(model_id)
        
        self.logger.info(
            f"Modelo alterado: {old_provider}/{old_model} -> {self.provider}/{model_id}"
        )
        
    def get_current_model_info(self) -> Dict[str, str]:
        """
        Retorna informações sobre o modelo atual.
        
        Returns:
            Dict com informações do modelo atual
        """
        real_model_name = self._get_model_name(self.model_id)
        return {
            'model_id': self.model_id,
            'provider': self.provider,
            'real_model_name': real_model_name,
            'supports_streaming': True,  # Ambos OpenAI e Claude suportam streaming
            'max_tokens': 4096 if self.provider == 'claude' else 4096,  # Pode ser configurado
        }

    def _build_xml_prompt(self, config: Dict[str, Any]) -> str:
        """
        Constrói o prompt do agente usando pseudo-tags XML para modularidade e clareza.
        """
        # Exemplo de estrutura baseada em melhores práticas (EduPlanner, AgentInstruct, etc.)
        return f"""
<agent>
  <role>{config['description']}</role>
  <instructions>
    {''.join([f'<step>{instr}</step>' for instr in config['instructions']])}
  </instructions>
  <feedback>Forneça feedback adaptativo e incentive o pensamento crítico.</feedback>
  <personalization>Adapte a resposta ao perfil e progresso do estudante.</personalization>
</agent>
"""

    def ask(self, methodology: MethodologyType, user_query: str, context: Optional[str] = None) -> str:
        """
        Processa uma pergunta usando uma metodologia específica.
        
        Args:
            methodology: Metodologia educacional a ser utilizada
            user_query: Pergunta do usuário
            context: Contexto adicional (opcional)
            
        Returns:
            str: Resposta formatada segundo a metodologia escolhida
            
        Raises:
            ValueError: Se a entrada for inválida
            RuntimeError: Se houver erro na geração da resposta
        """
        # Validação de entrada
        if not self._validate_input(user_query, context):
            raise ValueError("Entrada inválida: pergunta não pode estar vazia")
        
        self.logger.info(f"Processando pergunta com metodologia: {methodology.value} usando {self.provider}/{self.model_id}")
        
        try:
            agent = self.get_agent(methodology)
            prompt = self._build_methodology_prompt(methodology, user_query, context)
            
            self.logger.debug(f"Prompt gerado: {prompt[:200]}...")
            
            # Gera resposta
            response = agent.response(prompt)
            
            # Valida e formata resposta
            formatted_response = self._format_response(methodology, response)
            
            self.logger.info(f"Resposta gerada com sucesso para metodologia: {methodology.value}")
            return formatted_response
            
        except Exception as e:
            self.logger.error(f"Erro ao processar pergunta: {str(e)}")
            raise RuntimeError(f"Erro na geração da resposta: {str(e)}")
    
    def _validate_input(self, user_query: str, context: Optional[str] = None) -> bool:
        """
        Valida a entrada do usuário.
        
        Args:
            user_query: Pergunta do usuário
            context: Contexto adicional
            
        Returns:
            bool: True se a entrada é válida, False caso contrário
        """
        if not user_query or not user_query.strip():
            return False
            
        if len(user_query.strip()) < 3:
            return False
            
        if context and len(context) > 2000:  # Limita o contexto
            return False
            
        return True
    
    def _build_methodology_prompt(self, methodology: MethodologyType, user_query: str, context: Optional[str] = None) -> str:
        """
        Constrói o prompt específico para cada metodologia.
        
        Args:
            methodology: Metodologia escolhida
            user_query: Pergunta do usuário
            context: Contexto adicional
            
        Returns:
            str: Prompt formatado para a metodologia
        """
        if methodology == MethodologyType.WORKED_EXAMPLES:
            return self._build_worked_examples_prompt(user_query, context)
        elif methodology == MethodologyType.SOCRATIC:
            return self._build_socratic_prompt(user_query, context)
        elif methodology == MethodologyType.SCAFFOLDING:
            return self._build_scaffolding_prompt(user_query, context)
        else:
            # Prompt padrão para outras metodologias
            if context:
                return f"<context>{context}</context>\n<question>{user_query}</question>"
            else:
                return f"<question>{user_query}</question>"
    
    def _build_worked_examples_prompt(self, user_query: str, context: Optional[str] = None) -> str:
        """
        Constrói prompt especializado para worked examples com template XML robusto estruturado.
        """
        xml_instruction = """
Responda usando EXATAMENTE o seguinte esquema XML estruturado, preenchendo cada seção de forma detalhada e didática.

<WorkedExampleTemplate version="1.0" xmlns="https://example.org/worked-example"
                       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                       xsi:schemaLocation="https://example.org/worked-example worked_example.xsd">

  <!-- =========================
       PARTE 01 – Dados Gerais
       ========================= -->
  <GeneralData>
    <CourseInfo>
      <DisciplineTitle>Informe a disciplina relacionada ao problema</DisciplineTitle>
      <Topic>Tópico principal do problema</Topic>
      <Subtopics>
        <Subtopic>Subtópico 1 relevante</Subtopic>
        <Subtopic>Subtópico 2 relevante</Subtopic>
      </Subtopics>
      <Prerequisites>
        <Prerequisite>Conhecimento prévio necessário 1</Prerequisite>
        <Prerequisite>Conhecimento prévio necessário 2</Prerequisite>
      </Prerequisites>
    </CourseInfo>

    <SourceInfo>
      <OriginType>Consulta educacional</OriginType>
      <OriginReference>Sistema AGNO - CoderBot</OriginReference>
    </SourceInfo>
  </GeneralData>

  <!-- ==============================
       PARTE 02 – Contexto do Exemplo
       ============================== -->
  <ExampleContext>
    <ProblemDescription>Descrição detalhada do problema apresentado pelo aluno</ProblemDescription>
    <ExpectedOutcome>Resultado esperado após a resolução</ExpectedOutcome>

    <SupplementaryMaterial>
      <Resource type="documentation" url="">Material complementar se relevante</Resource>
    </SupplementaryMaterial>
  </ExampleContext>

  <!-- ================================================
       PARTE 03 – Aplicação dos Worked Examples
       ================================================ -->
  <WorkedExamples>

    <!-- 3.1 Exemplo Correto -->
    <CorrectExample>
      <Reflection difficulty="medium">
        Reflexão sobre a abordagem correta: explique o raciocínio por trás da solução
      </Reflection>

      <CorrectSteps>
        <Step number="1">
          <Description>Descrição detalhada do primeiro passo</Description>
        </Step>
        <Step number="2">
          <Description>Descrição detalhada do segundo passo</Description>
        </Step>
        <!-- Continue adicionando passos conforme necessário -->
      </CorrectSteps>

      <Tests>
        <TestCase id="1">
          <Input>Entrada de exemplo</Input>
          <ExpectedOutput>Saída esperada</ExpectedOutput>
        </TestCase>
      </Tests>
    </CorrectExample>

    <!-- 3.2 Exemplo Errôneo -->
    <ErroneousExample>
      <Reflection difficulty="medium">
        Reflexão sobre erros comuns: explique por que este erro é frequente
      </Reflection>

      <ErroneousSteps>
        <Step number="1">
          <Description>Passo incorreto comum</Description>
        </Step>
        <Step number="2">
          <Description>Consequência do erro</Description>
        </Step>
      </ErroneousSteps>

      <ErrorIdentification prompt="Você consegue identificar o erro?">
        <ErrorLine>Linha ou conceito onde ocorre o erro</ErrorLine>
        <ErrorExplanation>Explicação detalhada do erro</ErrorExplanation>
        <ProposedFix>Solução proposta para corrigir o erro</ProposedFix>
      </ErrorIdentification>

      <Tests>
        <TestCase id="1">
          <Input>Entrada que demonstra o erro</Input>
          <ExpectedOutput>Saída incorreta obtida</ExpectedOutput>
        </TestCase>
      </Tests>
    </ErroneousExample>

  </WorkedExamples>

  <!-- ==========================
       Metadados Metodológicos
       ========================== -->
  <PedagogicalMeta>
    <Methodology>Design Science Research</Methodology>
    <LearningTheory>Cognitive Load Theory</LearningTheory>
    <Agent>CoderBot</Agent>
  </PedagogicalMeta>

</WorkedExampleTemplate>

CRÍTICO: Responda SOMENTE usando o XML acima. Preencha todas as seções com conteúdo relevante. Seções opcionais podem ser omitidas se não aplicáveis.
"""
        
        if context:
            return f"{xml_instruction}\n<context>{context}</context>\n<question>{user_query}</question>"
        else:
            return f"{xml_instruction}\n<question>{user_query}</question>"
    
    def _build_socratic_prompt(self, user_query: str, context: Optional[str] = None) -> str:
        """
        Constrói prompt para metodologia socrática com template XML.
        """
        xml_instruction = """
Responda usando o método socrático com o seguinte esquema XML:

<socratic_response>
  <initial_question>
    Faça uma pergunta que estimule o pensamento crítico sobre o problema
  </initial_question>
  
  <guiding_questions>
    Sequência de 3-5 perguntas que orientem o raciocínio:
    - Pergunta 1: [Pergunta exploratória]
    - Pergunta 2: [Pergunta de análise]
    - Pergunta 3: [Pergunta de síntese]
  </guiding_questions>
  
  <reflection_prompts>
    Prompts para reflexão do estudante:
    - "O que você acha que aconteceria se..."
    - "Como você justificaria..."
    - "Que evidências apoiam..."
  </reflection_prompts>
</socratic_response>

Responda SOMENTE usando o XML acima.
"""
        
        if context:
            return f"{xml_instruction}\n<context>{context}</context>\n<question>{user_query}</question>"
        else:
            return f"{xml_instruction}\n<question>{user_query}</question>"
    
    def _build_scaffolding_prompt(self, user_query: str, context: Optional[str] = None) -> str:
        """
        Constrói prompt para metodologia scaffolding com template XML.
        """
        xml_instruction = """
Responda usando scaffolding com o seguinte esquema XML:

<scaffolding_response>
  <initial_support>
    Forneça o máximo de suporte inicial:
    - Explicação completa do conceito
    - Exemplo detalhado
    - Dicas específicas
  </initial_support>
  
  <guided_practice>
    Exercício com suporte gradual:
    - Problema similar com dicas
    - Perguntas orientadoras
    - Verificação de compreensão
  </guided_practice>
  
  <independent_practice>
    Desafio para prática independente:
    - Problema sem dicas
    - Critérios de avaliação
    - Próximos passos
  </independent_practice>
</scaffolding_response>

Responda SOMENTE usando o XML acima.
"""
        
        if context:
            return f"{xml_instruction}\n<context>{context}</context>\n<question>{user_query}</question>"
        else:
            return f"{xml_instruction}\n<question>{user_query}</question>"
    
    def _format_response(self, methodology: MethodologyType, response: str) -> str:
        """
        Formata e valida a resposta da IA.
        
        Args:
            methodology: Metodologia utilizada
            response: Resposta bruta da IA
            
        Returns:
            str: Resposta formatada e validada
        """
        # Remove espaços extras
        formatted_response = response.strip()
        
        # Validação específica para metodologias XML
        if methodology in [MethodologyType.WORKED_EXAMPLES, MethodologyType.SOCRATIC, MethodologyType.SCAFFOLDING]:
            if self.xml_validation_enabled:
                is_valid, error_msg = self._validate_xml_response(formatted_response)
                if not is_valid:
                    self.logger.warning(f"XML inválido: {error_msg}")
                    # Tenta corrigir problemas simples de XML
                    formatted_response = self._fix_common_xml_issues(formatted_response)
        
        return formatted_response
    
    def _validate_xml_response(self, response: str) -> tuple[bool, str]:
        """
        Valida se a resposta está em formato XML válido.
        
        Args:
            response: Resposta a ser validada
            
        Returns:
            tuple[bool, str]: (is_valid, error_message)
        """
        try:
            # Tenta parsear o XML
            ET.fromstring(response)
            return True, ""
        except ET.ParseError as e:
            return False, str(e)
    
    def _fix_common_xml_issues(self, response: str) -> str:
        """
        Corrige problemas comuns de XML na resposta.
        
        Args:
            response: Resposta com possíveis problemas de XML
            
        Returns:
            str: Resposta com correções aplicadas
        """
        # Escapa caracteres especiais comuns
        fixed_response = response.replace("&", "&amp;")
        fixed_response = fixed_response.replace("<", "&lt;").replace(">", "&gt;")
        
        # Restaura tags XML válidas
        xml_tags = [
            # Tags do template estruturado de worked examples
            "WorkedExampleTemplate", "GeneralData", "CourseInfo", "DisciplineTitle", 
            "Topic", "Subtopics", "Subtopic", "Prerequisites", "Prerequisite",
            "SourceInfo", "OriginType", "OriginReference", "ExampleContext", 
            "ProblemDescription", "ExpectedOutcome", "SupplementaryMaterial", "Resource",
            "WorkedExamples", "CorrectExample", "ErroneousExample", "Reflection", 
            "CorrectSteps", "ErroneousSteps", "Step", "Description", "Tests", "TestCase",
            "Input", "ExpectedOutput", "ErrorIdentification", "ErrorLine", "ErrorExplanation",
            "ProposedFix", "PedagogicalMeta", "Methodology", "LearningTheory", "Agent",
            # Tags do template simples (backward compatibility)
            "worked_example", "problem_analysis", "step_by_step_example", 
            "explanation", "patterns", "similar_example", "next_steps",
            # Tags de outras metodologias
            "socratic_response", "initial_question", "guiding_questions", "reflection_prompts",
            "scaffolding_response", "initial_support", "guided_practice", "independent_practice"
        ]
        
        for tag in xml_tags:
            fixed_response = fixed_response.replace(f"&lt;{tag}&gt;", f"<{tag}>")
            fixed_response = fixed_response.replace(f"&lt;/{tag}&gt;", f"</{tag}>")
        
        return fixed_response
    
    def get_methodology_capabilities(self, methodology: MethodologyType) -> Dict[str, Any]:
        """
        Retorna as capacidades e características de uma metodologia.
        
        Args:
            methodology: Metodologia a ser analisada
            
        Returns:
            Dict[str, Any]: Informações sobre as capacidades da metodologia
        """
        capabilities = {
            MethodologyType.WORKED_EXAMPLES: {
                "xml_output": True,
                "structured_response": True,
                "step_by_step": True,
                "examples": True,
                "patterns": True,
                "best_for": ["resolução de problemas", "algoritmos", "matemática"],
                "learning_style": "visual e sequencial"
            },
            MethodologyType.SOCRATIC: {
                "xml_output": True,
                "structured_response": True,
                "step_by_step": False,
                "examples": False,
                "patterns": False,
                "best_for": ["pensamento crítico", "análise", "filosofia"],
                "learning_style": "questionamento e reflexão"
            },
            MethodologyType.SCAFFOLDING: {
                "xml_output": True,
                "structured_response": True,
                "step_by_step": True,
                "examples": True,
                "patterns": False,
                "best_for": ["iniciantes", "conceitos progressivos", "habilidades"],
                "learning_style": "suporte gradual"
            },
            MethodologyType.ANALOGY: {
                "xml_output": False,
                "structured_response": False,
                "step_by_step": False,
                "examples": True,
                "patterns": True,
                "best_for": ["conceitos abstratos", "visualização", "compreensão"],
                "learning_style": "comparação e associação"
            },
            MethodologyType.SEQUENTIAL_THINKING: {
                "xml_output": False,
                "structured_response": True,
                "step_by_step": True,
                "examples": True,
                "patterns": True,
                "best_for": ["lógica", "processos", "algoritmos"],
                "learning_style": "sequencial e estruturado"
            },
            MethodologyType.DEFAULT: {
                "xml_output": False,
                "structured_response": False,
                "step_by_step": False,
                "examples": True,
                "patterns": False,
                "best_for": ["uso geral", "primeira interação"],
                "learning_style": "explicação direta"
            }
        }
        
        return capabilities.get(methodology, {})
    
    def analyze_response_quality(self, methodology: MethodologyType, response: str) -> Dict[str, Any]:
        """
        Analisa a qualidade da resposta gerada.
        
        Args:
            methodology: Metodologia utilizada
            response: Resposta a ser analisada
            
        Returns:
            Dict[str, Any]: Análise da qualidade da resposta
        """
        analysis = {
            "length": len(response),
            "has_xml": self._contains_xml(response),
            "xml_valid": False,
            "completeness": 0.0,
            "sections_present": [],
            "missing_sections": [],
            "quality_score": 0.0
        }
        
        # Verifica se contém XML válido
        if analysis["has_xml"]:
            is_valid, _ = self._validate_xml_response(response)
            analysis["xml_valid"] = is_valid
            
            if is_valid:
                analysis.update(self._analyze_xml_sections(methodology, response))
        
        # Calcula score de qualidade
        analysis["quality_score"] = self._calculate_quality_score(analysis)
        
        return analysis
    
    def _contains_xml(self, response: str) -> bool:
        """Verifica se a resposta contém XML."""
        return bool(re.search(r'<\w+>', response))
    
    def _analyze_xml_sections(self, methodology: MethodologyType, response: str) -> Dict[str, Any]:
        """Analisa as seções XML da resposta."""
        sections_analysis = {
            "sections_present": [],
            "missing_sections": [],
            "completeness": 0.0
        }
        
        try:
            root = ET.fromstring(response)
            
            # Seções esperadas para cada metodologia
            expected_sections = {
                MethodologyType.WORKED_EXAMPLES: [
                    # Template estruturado - seções principais
                    "GeneralData", "ExampleContext", "WorkedExamples", "PedagogicalMeta",
                    # Template simples - backward compatibility  
                    "problem_analysis", "step_by_step_example", "explanation",
                    "patterns", "similar_example", "next_steps"
                ],
                MethodologyType.SOCRATIC: [
                    "initial_question", "guiding_questions", "reflection_prompts"
                ],
                MethodologyType.SCAFFOLDING: [
                    "initial_support", "guided_practice", "independent_practice"
                ]
            }
            
            if methodology in expected_sections:
                expected = expected_sections[methodology]
                present = [elem.tag for elem in root]
                
                sections_analysis["sections_present"] = present
                sections_analysis["missing_sections"] = [
                    section for section in expected if section not in present
                ]
                sections_analysis["completeness"] = len(present) / len(expected)
        
        except ET.ParseError:
            pass
        
        return sections_analysis
    
    def _calculate_quality_score(self, analysis: Dict[str, Any]) -> float:
        """Calcula um score de qualidade baseado na análise."""
        score = 0.0
        
        # Pontuação por completude
        if analysis["completeness"] > 0:
            score += analysis["completeness"] * 0.4
        
        # Pontuação por XML válido
        if analysis["xml_valid"]:
            score += 0.3
        
        # Pontuação por tamanho apropriado
        if 100 <= analysis["length"] <= 2000:
            score += 0.2
        elif analysis["length"] > 50:
            score += 0.1
        
        # Penalização por seções ausentes
        if analysis["missing_sections"]:
            score -= len(analysis["missing_sections"]) * 0.05
        
        # Pontuação por presença de XML quando esperado
        if analysis["has_xml"]:
            score += 0.1
        
        return min(1.0, max(0.0, score))
    
    def configure_xml_validation(self, enabled: bool) -> None:
        """
        Configura se a validação XML está habilitada.
        
        Args:
            enabled: True para habilitar, False para desabilitar
        """
        self.xml_validation_enabled = enabled
        self.logger.info(f"Validação XML {'habilitada' if enabled else 'desabilitada'}")
    
    def get_supported_methodologies(self) -> List[str]:
        """
        Retorna lista de metodologias suportadas.
        
        Returns:
            List[str]: Lista de metodologias suportadas
        """
        return [methodology.value for methodology in MethodologyType]
    
    def get_xml_methodologies(self) -> List[str]:
        """
        Retorna lista de metodologias que usam XML.
        
        Returns:
            List[str]: Lista de metodologias que retornam XML
        """
        xml_methodologies = [
            MethodologyType.WORKED_EXAMPLES,
            MethodologyType.SOCRATIC,
            MethodologyType.SCAFFOLDING
        ]
        return [methodology.value for methodology in xml_methodologies]
