import { toast } from "@/components/ui/sonner";
import api from "@/lib/axios";

// Tipos para as metodologias educacionais
export enum MethodologyType {
  SEQUENTIAL_THINKING = "sequential_thinking",
  ANALOGY = "analogy",
  SOCRATIC = "socratic",
  SCAFFOLDING = "scaffolding", 
  WORKED_EXAMPLES = "worked_examples",
  DEFAULT = "default"
}

// Interface para o contexto do usuário
export interface UserContext {
  userId: string;
  currentTopic?: string;
  difficultyLevel?: string;
  learningProgress?: any;
  previousInteractions?: string[];
}

// Interface para a requisição ao AGNO
export interface AgnoRequest {
  methodology: MethodologyType;
  userQuery: string;
  context?: string;
  userContext?: UserContext;
}

// Interface para a resposta do AGNO
export interface AgnoResponse {
  response: string;
  methodology: MethodologyType;
  isXmlFormatted: boolean;
  metadata?: {
    processingTime?: number;
    confidence?: number;
    suggestedNextSteps?: string[];
  };
}

// Interface para respostas XML estruturadas (worked examples)
export interface WorkedExampleResponse {
  problem_analysis: string;
  step_by_step_example: string;
  explanation: string;
  patterns: string;
  similar_example?: string;
  next_steps: string;
}

// Configurações das metodologias
export const METHODOLOGY_CONFIG = {
  [MethodologyType.SEQUENTIAL_THINKING]: {
    name: "Pensamento Sequencial",
    description: "Explica o raciocínio passo a passo de forma sequencial",
    icon: "📝",
    color: "blue"
  },
  [MethodologyType.ANALOGY]: {
    name: "Analogias",
    description: "Usa analogias do cotidiano para facilitar o entendimento",
    icon: "🔗",
    color: "green"
  },
  [MethodologyType.SOCRATIC]: {
    name: "Método Socrático",
    description: "Estimula o pensamento crítico através de perguntas",
    icon: "❓",
    color: "purple"
  },
  [MethodologyType.SCAFFOLDING]: {
    name: "Scaffolding",
    description: "Oferece dicas graduais removendo o suporte progressivamente",
    icon: "🏗️",
    color: "orange"
  },
  [MethodologyType.WORKED_EXAMPLES]: {
    name: "Exemplos Resolvidos",
    description: "Ensina através de exemplos detalhadamente resolvidos",
    icon: "📚",
    color: "indigo"
  },
  [MethodologyType.DEFAULT]: {
    name: "Padrão",
    description: "Resposta educacional padrão, clara e objetiva",
    icon: "💬",
    color: "gray"
  }
};

class AgnoService {
  private baseURL = "/api/agno";

  /**
   * Faz uma requisição ao serviço AGNO
   */
  async askQuestion(request: AgnoRequest): Promise<AgnoResponse> {
    try {
      const response = await api.post(`${this.baseURL}/ask`, {
        methodology: request.methodology,
        user_query: request.userQuery,
        context: request.context,
        user_context: request.userContext
      });

      return {
        response: response.data.response,
        methodology: request.methodology,
        isXmlFormatted: request.methodology === MethodologyType.WORKED_EXAMPLES,
        metadata: response.data.metadata
      };
    } catch (error) {
      console.error("Erro ao fazer requisição ao AGNO:", error);
      toast.error("Erro ao processar sua pergunta. Tente novamente.");
      throw error;
    }
  }

  /**
   * Busca as metodologias disponíveis
   */
  async getAvailableMethodologies(): Promise<MethodologyType[]> {
    try {
      const response = await api.get(`${this.baseURL}/methodologies`);
      return response.data.methodologies || Object.values(MethodologyType);
    } catch (error) {
      console.error("Erro ao buscar metodologias:", error);
      return Object.values(MethodologyType);
    }
  }

  /**
   * Processa uma resposta de worked example em XML
   */
  parseWorkedExampleResponse(xmlResponse: string): WorkedExampleResponse | null {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlResponse, "text/xml");
      
      if (xmlDoc.querySelector("parsererror")) {
        console.error("Erro ao parsear XML:", xmlResponse);
        return null;
      }

      const workedExample = xmlDoc.querySelector("worked_example");
      if (!workedExample) {
        console.error("Tag worked_example não encontrada no XML");
        return null;
      }

      return {
        problem_analysis: this.getTextContent(workedExample, "problem_analysis"),
        step_by_step_example: this.getTextContent(workedExample, "step_by_step_example"), 
        explanation: this.getTextContent(workedExample, "explanation"),
        patterns: this.getTextContent(workedExample, "patterns"),
        similar_example: this.getTextContent(workedExample, "similar_example"),
        next_steps: this.getTextContent(workedExample, "next_steps")
      };
    } catch (error) {
      console.error("Erro ao processar resposta XML:", error);
      return null;
    }
  }

  /**
   * Extrai o conteúdo de texto de uma tag XML
   */
  private getTextContent(parent: Element, tagName: string): string {
    const element = parent.querySelector(tagName);
    return element?.textContent?.trim() || "";
  }

  /**
   * Método de conveniência para worked examples
   */
  async getWorkedExample(
    userQuery: string, 
    context?: string, 
    userContext?: UserContext
  ): Promise<WorkedExampleResponse | null> {
    const response = await this.askQuestion({
      methodology: MethodologyType.WORKED_EXAMPLES,
      userQuery,
      context,
      userContext
    });

    if (response.isXmlFormatted) {
      return this.parseWorkedExampleResponse(response.response);
    }

    return null;
  }

  /**
   * Método de conveniência para outras metodologias
   */
  async getMethodologyResponse(
    methodology: MethodologyType,
    userQuery: string,
    context?: string,
    userContext?: UserContext
  ): Promise<string> {
    const response = await this.askQuestion({
      methodology,
      userQuery,
      context,
      userContext
    });

    return response.response;
  }

  /**
   * Valida se uma metodologia é válida
   */
  isValidMethodology(methodology: string): methodology is MethodologyType {
    return Object.values(MethodologyType).includes(methodology as MethodologyType);
  }

  /**
   * Obtém a configuração de uma metodologia
   */
  getMethodologyConfig(methodology: MethodologyType) {
    return METHODOLOGY_CONFIG[methodology] || METHODOLOGY_CONFIG[MethodologyType.DEFAULT];
  }
}

// Instância singleton do serviço
export const agnoService = new AgnoService();
export default agnoService;
