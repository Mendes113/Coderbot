"""
Serviço específico para o sistema AGNO (Adaptive Generation of Worked Examples).

Este serviço atua como uma camada simplificada sobre o agno_methodology_service,
fornecendo funcionalidades específicas para o uso em APIs e interfaces.

Agora com suporte para múltiplos provedores de IA (OpenAI e Claude).
"""

from typing import Optional, Dict, Any, List
from .agno_methodology_service import AgnoMethodologyService, MethodologyType
import logging

logger = logging.getLogger(__name__)

class AgnoService:
    """
    Serviço simplificado para interações com o sistema AGNO.
    
    Este serviço atua como uma facade para o AgnoMethodologyService,
    fornecendo métodos mais específicos para diferentes casos de uso.
    Agora com suporte completo para múltiplos provedores de IA.
    """
    
    def __init__(self, model_id: str = "gpt-4o", provider: Optional[str] = None):
        """
        Inicializa o serviço AGNO.
        
        Args:
            model_id: ID do modelo a ser usado (padrão: gpt-4o)
            provider: Provedor do modelo ('openai' ou 'claude'). 
                     Se não especificado, será auto-detectado baseado no model_id
        """
        self.methodology_service = AgnoMethodologyService(model_id, provider)
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
    
    def get_available_methodologies(self) -> List[str]:
        """
        Retorna a lista de metodologias disponíveis.
        
        Returns:
            List[str]: Lista de metodologias disponíveis
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
    
    # === Novos métodos para suporte multi-provedor ===
    
    def get_available_providers(self) -> List[str]:
        """
        Retorna a lista de provedores de IA disponíveis.
        
        Returns:
            List[str]: Lista de provedores suportados
        """
        return self.methodology_service.get_available_providers()
    
    def get_available_models_for_provider(self, provider: str) -> List[str]:
        """
        Retorna modelos disponíveis para um provedor específico.
        
        Args:
            provider: Nome do provedor ('openai' ou 'claude')
            
        Returns:
            List[str]: Lista de modelos disponíveis
        """
        return self.methodology_service.get_available_models_for_provider(provider)
    
    def switch_model(self, model_id: str, provider: Optional[str] = None) -> Dict[str, str]:
        """
        Troca o modelo sendo usado pelo serviço.
        
        Args:
            model_id: Novo ID do modelo
            provider: Novo provedor (opcional, será auto-detectado se não fornecido)
            
        Returns:
            Dict[str, str]: Informações do modelo atual após a mudança
        """
        self.methodology_service.switch_model(model_id, provider)
        return self.get_current_model_info()
    
    def get_current_model_info(self) -> Dict[str, str]:
        """
        Retorna informações sobre o modelo atual.
        
        Returns:
            Dict[str, str]: Informações do modelo atual
        """
        return self.methodology_service.get_current_model_info()
    
    def compare_providers_performance(
        self, 
        methodology: MethodologyType,
        user_query: str,
        providers: Optional[List[str]] = None,
        context: Optional[str] = None
    ) -> Dict[str, Dict[str, Any]]:
        """
        Compara o desempenho de diferentes provedores para uma consulta.
        
        Args:
            methodology: Metodologia a ser testada
            user_query: Pergunta de teste
            providers: Lista de provedores para testar (padrão: todos disponíveis)
            context: Contexto adicional (opcional)
            
        Returns:
            Dict com resultados de cada provedor
        """
        if providers is None:
            providers = self.get_available_providers()
        
        results = {}
        original_model_info = self.get_current_model_info()
        
        try:
            for provider in providers:
                # Obter um modelo padrão para o provedor
                available_models = self.get_available_models_for_provider(provider)
                if not available_models:
                    continue
                
                default_model = available_models[0]  # Usar o primeiro modelo disponível
                
                try:
                    # Trocar para o modelo do provedor
                    self.switch_model(default_model, provider)
                    
                    # Executar a consulta e medir o tempo
                    import time
                    start_time = time.time()
                    response = self.ask_question(methodology, user_query, context)
                    execution_time = time.time() - start_time
                    
                    results[provider] = {
                        "model_used": default_model,
                        "response": response,
                        "execution_time": execution_time,
                        "response_length": len(response),
                        "success": True
                    }
                    
                except Exception as e:
                    results[provider] = {
                        "model_used": default_model,
                        "error": str(e),
                        "success": False
                    }
        
        finally:
            # Restaurar modelo original
            self.switch_model(
                original_model_info['model_id'], 
                original_model_info['provider']
            )
        
        return results
    
    def get_provider_recommendations(
        self, 
        use_case: str = "general",
        budget_conscious: bool = False
    ) -> Dict[str, Any]:
        """
        Retorna recomendações de provedores baseadas no caso de uso.
        
        Args:
            use_case: Tipo de uso ("general", "creative", "analytical", "educational")
            budget_conscious: Se deve priorizar opções mais econômicas
            
        Returns:
            Dict com recomendações de provedores e modelos
        """
        recommendations = {
            "general": {
                "primary": {"provider": "openai", "model": "gpt-4o", "reason": "Equilibrio entre qualidade e velocidade"},
                "alternative": {"provider": "claude", "model": "claude-3-5-sonnet", "reason": "Excelente para raciocínio complexo"},
                "budget": {"provider": "openai", "model": "gpt-3.5-turbo", "reason": "Custo-benefício"}
            },
            "creative": {
                "primary": {"provider": "claude", "model": "claude-3-opus", "reason": "Melhor criatividade e nuances"},
                "alternative": {"provider": "openai", "model": "gpt-4o", "reason": "Boa criatividade com velocidade"},
                "budget": {"provider": "claude", "model": "claude-3-haiku", "reason": "Rápido e criativo"}
            },
            "analytical": {
                "primary": {"provider": "claude", "model": "claude-sonnet-4", "reason": "Superior para análise complexa"},
                "alternative": {"provider": "openai", "model": "o3-mini", "reason": "Bom raciocínio lógico"},
                "budget": {"provider": "openai", "model": "gpt-4o", "reason": "Análise sólida por bom preço"}
            },
            "educational": {
                "primary": {"provider": "claude", "model": "claude-3-5-sonnet", "reason": "Excelente para explicações detalhadas"},
                "alternative": {"provider": "openai", "model": "gpt-4o", "reason": "Bom para exemplos práticos"},
                "budget": {"provider": "openai", "model": "gpt-3.5-turbo", "reason": "Adequado para interações básicas"}
            }
        }
        
        use_case_rec = recommendations.get(use_case, recommendations["general"])
        
        if budget_conscious:
            return {"recommended": use_case_rec["budget"], "alternatives": [use_case_rec["primary"]]}
        else:
            return {"recommended": use_case_rec["primary"], "alternatives": [use_case_rec["alternative"], use_case_rec["budget"]]}


# Instância global do serviço para uso em diferentes partes da aplicação
agno_service = AgnoService()
