"""
Serviço específico para o sistema AGNO (Adaptive Generation of Worked Examples).

Este serviço atua como uma camada simplificada sobre o agno_methodology_service,
fornecendo funcionalidades específicas para o uso em APIs e interfaces.
"""

from typing import Optional, Dict, Any
from .agno_methodology_service import AgnoMethodologyService, MethodologyType
import logging

logger = logging.getLogger(__name__)

class AgnoService:
    """
    Serviço simplificado para interações com o sistema AGNO.
    
    Este serviço atua como uma facade para o AgnoMethodologyService,
    fornecendo métodos mais específicos para diferentes casos de uso.
    """
    
    def __init__(self, model_id: str = "gpt-4o"):
        """
        Inicializa o serviço AGNO.
        
        Args:
            model_id: ID do modelo a ser usado (padrão: gpt-4o)
        """
        self.methodology_service = AgnoMethodologyService(model_id)
        self.logger = logger
    
    def ask_question(
        self, 
        methodology: MethodologyType, 
        user_query: str, 
        context: Optional[str] = None
    ) -> str:
        """
        Faz uma pergunta ao sistema AGNO usando uma metodologia específica.
        
        Args:
            methodology: Metodologia educacional a ser usada
            user_query: Pergunta do usuário
            context: Contexto adicional (opcional)
            
        Returns:
            str: Resposta gerada pelo sistema AGNO
        """
        try:
            self.logger.info(f"Processando pergunta com metodologia: {methodology.value}")
            response = self.methodology_service.ask(methodology, user_query, context)
            self.logger.info(f"Resposta gerada com sucesso")
            return response
        except Exception as e:
            self.logger.error(f"Erro ao processar pergunta: {str(e)}")
            raise
    
    def get_worked_example(
        self, 
        user_query: str, 
        context: Optional[str] = None
    ) -> str:
        """
        Método de conveniência para obter um worked example.
        
        Args:
            user_query: Pergunta do usuário
            context: Contexto adicional (opcional)
            
        Returns:
            str: Resposta XML formatada com worked example
        """
        return self.ask_question(MethodologyType.WORKED_EXAMPLES, user_query, context)
    
    def get_socratic_response(
        self, 
        user_query: str, 
        context: Optional[str] = None
    ) -> str:
        """
        Método de conveniência para obter uma resposta socrática.
        
        Args:
            user_query: Pergunta do usuário
            context: Contexto adicional (opcional)
            
        Returns:
            str: Resposta usando método socrático
        """
        return self.ask_question(MethodologyType.SOCRATIC, user_query, context)
    
    def get_analogy_response(
        self, 
        user_query: str, 
        context: Optional[str] = None
    ) -> str:
        """
        Método de conveniência para obter uma resposta com analogias.
        
        Args:
            user_query: Pergunta do usuário
            context: Contexto adicional (opcional)
            
        Returns:
            str: Resposta usando analogias
        """
        return self.ask_question(MethodologyType.ANALOGY, user_query, context)
    
    def get_scaffolding_response(
        self, 
        user_query: str, 
        context: Optional[str] = None
    ) -> str:
        """
        Método de conveniência para obter uma resposta com scaffolding.
        
        Args:
            user_query: Pergunta do usuário
            context: Contexto adicional (opcional)
            
        Returns:
            str: Resposta usando scaffolding
        """
        return self.ask_question(MethodologyType.SCAFFOLDING, user_query, context)
    
    def get_sequential_thinking_response(
        self, 
        user_query: str, 
        context: Optional[str] = None
    ) -> str:
        """
        Método de conveniência para obter uma resposta com pensamento sequencial.
        
        Args:
            user_query: Pergunta do usuário
            context: Contexto adicional (opcional)
            
        Returns:
            str: Resposta usando pensamento sequencial
        """
        return self.ask_question(MethodologyType.SEQUENTIAL_THINKING, user_query, context)
    
    def get_available_methodologies(self) -> list[str]:
        """
        Retorna a lista de metodologias disponíveis.
        
        Returns:
            list[str]: Lista de metodologias disponíveis
        """
        return [methodology.value for methodology in MethodologyType]
    
    def is_methodology_xml_formatted(self, methodology: MethodologyType) -> bool:
        """
        Verifica se uma metodologia retorna resposta formatada em XML.
        
        Args:
            methodology: Metodologia a ser verificada
            
        Returns:
            bool: True se a metodologia retorna XML, False caso contrário
        """
        return methodology == MethodologyType.WORKED_EXAMPLES
    
    def validate_methodology(self, methodology_str: str) -> bool:
        """
        Valida se uma string representa uma metodologia válida.
        
        Args:
            methodology_str: String da metodologia
            
        Returns:
            bool: True se válida, False caso contrário
        """
        try:
            MethodologyType(methodology_str)
            return True
        except ValueError:
            return False
    
    def get_methodology_info(self, methodology: MethodologyType) -> Dict[str, Any]:
        """
        Retorna informações sobre uma metodologia específica.
        
        Args:
            methodology: Metodologia desejada
            
        Returns:
            Dict[str, Any]: Informações sobre a metodologia
        """
        methodology_info = {
            MethodologyType.SEQUENTIAL_THINKING: {
                "name": "Pensamento Sequencial",
                "description": "Explica o raciocínio passo a passo de forma sequencial",
                "use_cases": ["Problemas complexos", "Estudantes que precisam de estrutura"],
                "xml_formatted": False
            },
            MethodologyType.ANALOGY: {
                "name": "Analogias",
                "description": "Usa analogias do cotidiano para facilitar o entendimento",
                "use_cases": ["Conceitos abstratos", "Estudantes visuais"],
                "xml_formatted": False
            },
            MethodologyType.SOCRATIC: {
                "name": "Método Socrático",
                "description": "Estimula o pensamento crítico através de perguntas",
                "use_cases": ["Desenvolvimento de pensamento crítico", "Estudantes avançados"],
                "xml_formatted": False
            },
            MethodologyType.SCAFFOLDING: {
                "name": "Scaffolding",
                "description": "Oferece dicas graduais removendo o suporte progressivamente",
                "use_cases": ["Estudantes iniciantes", "Conceitos progressivos"],
                "xml_formatted": False
            },
            MethodologyType.WORKED_EXAMPLES: {
                "name": "Exemplos Resolvidos",
                "description": "Ensina através de exemplos detalhadamente resolvidos",
                "use_cases": ["Resolução de problemas", "Aprendizado de algoritmos"],
                "xml_formatted": True
            },
            MethodologyType.DEFAULT: {
                "name": "Padrão",
                "description": "Resposta educacional padrão, clara e objetiva",
                "use_cases": ["Uso geral", "Primeira interação"],
                "xml_formatted": False
            }
        }
        
        return methodology_info.get(methodology, {})

# Instância global do serviço para uso em diferentes partes da aplicação
agno_service = AgnoService()
