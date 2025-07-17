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

// Interface para o novo template estruturado
export interface StructuredWorkedExampleResponse {
  generalData: {
    courseInfo: {
      disciplineTitle: string;
      topic: string;
      subtopics: string[];
      prerequisites: string[];
    };
    sourceInfo: {
      originType: string;
      originReference: string;
    };
  };
  exampleContext: {
    problemDescription: string;
    expectedOutcome: string;
    supplementaryMaterial?: {
      type: string;
      url: string;
      description: string;
    }[];
  };
  workedExamples: {
    correctExample: {
      reflection: {
        difficulty: string;
        content: string;
      };
      correctSteps: {
        number: string;
        description: string;
      }[];
      tests: {
        id: string;
        input: string;
        expectedOutput: string;
      }[];
    };
    erroneousExample?: {
      reflection: {
        difficulty: string;
        content: string;
      };
      erroneousSteps: {
        number: string;
        description: string;
      }[];
      errorIdentification: {
        prompt: string;
        errorLine: string;
        errorExplanation: string;
        proposedFix: string;
      };
      tests: {
        id: string;
        input: string;
        expectedOutput: string;
      }[];
    };
  };
  pedagogicalMeta: {
    methodology: string;
    learningTheory: string;
    agent: string;
  };
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
   * Processa uma resposta de worked example em XML (template simples)
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
   * Processa uma resposta de worked example em XML (template estruturado)
   */
  parseStructuredWorkedExampleResponse(xmlResponse: string): StructuredWorkedExampleResponse | null {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlResponse, "text/xml");
      
      if (xmlDoc.querySelector("parsererror")) {
        console.error("Erro ao parsear XML estruturado:", xmlResponse);
        return null;
      }

      const template = xmlDoc.querySelector("WorkedExampleTemplate");
      if (!template) {
        console.error("Tag WorkedExampleTemplate não encontrada no XML");
        return null;
      }

      // Parse GeneralData
      const generalData = template.querySelector("GeneralData");
      const courseInfo = generalData?.querySelector("CourseInfo");
      const sourceInfo = generalData?.querySelector("SourceInfo");

      // Parse ExampleContext
      const exampleContext = template.querySelector("ExampleContext");
      const supplementaryMaterial = Array.from(exampleContext?.querySelectorAll("Resource") || [])
        .map(resource => ({
          type: resource.getAttribute("type") || "",
          url: resource.getAttribute("url") || "",
          description: resource.textContent?.trim() || ""
        }));

      // Parse WorkedExamples
      const workedExamples = template.querySelector("WorkedExamples");
      const correctExample = workedExamples?.querySelector("CorrectExample");
      const erroneousExample = workedExamples?.querySelector("ErroneousExample");

      // Parse PedagogicalMeta
      const pedagogicalMeta = template.querySelector("PedagogicalMeta");

      return {
        generalData: {
          courseInfo: {
            disciplineTitle: this.getTextContent(courseInfo, "DisciplineTitle"),
            topic: this.getTextContent(courseInfo, "Topic"),
            subtopics: Array.from(courseInfo?.querySelectorAll("Subtopic") || [])
              .map(subtopic => subtopic.textContent?.trim() || ""),
            prerequisites: Array.from(courseInfo?.querySelectorAll("Prerequisite") || [])
              .map(prerequisite => prerequisite.textContent?.trim() || "")
          },
          sourceInfo: {
            originType: this.getTextContent(sourceInfo, "OriginType"),
            originReference: this.getTextContent(sourceInfo, "OriginReference")
          }
        },
        exampleContext: {
          problemDescription: this.getTextContent(exampleContext, "ProblemDescription"),
          expectedOutcome: this.getTextContent(exampleContext, "ExpectedOutcome"),
          supplementaryMaterial: supplementaryMaterial.length > 0 ? supplementaryMaterial : undefined
        },
        workedExamples: {
          correctExample: {
            reflection: {
              difficulty: correctExample?.querySelector("Reflection")?.getAttribute("difficulty") || "",
              content: correctExample?.querySelector("Reflection")?.textContent?.trim() || ""
            },
            correctSteps: Array.from(correctExample?.querySelectorAll("Step") || [])
              .map(step => ({
                number: step.getAttribute("number") || "",
                description: this.getTextContent(step, "Description")
              })),
            tests: Array.from(correctExample?.querySelectorAll("TestCase") || [])
              .map(testCase => ({
                id: testCase.getAttribute("id") || "",
                input: this.getTextContent(testCase, "Input"),
                expectedOutput: this.getTextContent(testCase, "ExpectedOutput")
              }))
          },
          erroneousExample: erroneousExample ? {
            reflection: {
              difficulty: erroneousExample.querySelector("Reflection")?.getAttribute("difficulty") || "",
              content: erroneousExample.querySelector("Reflection")?.textContent?.trim() || ""
            },
            erroneousSteps: Array.from(erroneousExample.querySelectorAll("Step") || [])
              .map(step => ({
                number: step.getAttribute("number") || "",
                description: this.getTextContent(step, "Description")
              })),
            errorIdentification: {
              prompt: erroneousExample.querySelector("ErrorIdentification")?.getAttribute("prompt") || "",
              errorLine: this.getTextContent(erroneousExample.querySelector("ErrorIdentification"), "ErrorLine"),
              errorExplanation: this.getTextContent(erroneousExample.querySelector("ErrorIdentification"), "ErrorExplanation"),
              proposedFix: this.getTextContent(erroneousExample.querySelector("ErrorIdentification"), "ProposedFix")
            },
            tests: Array.from(erroneousExample.querySelectorAll("TestCase") || [])
              .map(testCase => ({
                id: testCase.getAttribute("id") || "",
                input: this.getTextContent(testCase, "Input"),
                expectedOutput: this.getTextContent(testCase, "ExpectedOutput")
              }))
          } : undefined
        },
        pedagogicalMeta: {
          methodology: this.getTextContent(pedagogicalMeta, "Methodology"),
          learningTheory: this.getTextContent(pedagogicalMeta, "LearningTheory"),
          agent: this.getTextContent(pedagogicalMeta, "Agent")
        }
      };
    } catch (error) {
      console.error("Erro ao processar resposta XML estruturada:", error);
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
   * Método de conveniência para worked examples estruturados
   */
  async getStructuredWorkedExample(
    userQuery: string, 
    context?: string, 
    userContext?: UserContext
  ): Promise<StructuredWorkedExampleResponse | null> {
    const response = await this.askQuestion({
      methodology: MethodologyType.WORKED_EXAMPLES,
      userQuery,
      context,
      userContext
    });

    if (response.isXmlFormatted) {
      return this.parseStructuredWorkedExampleResponse(response.response);
    }

    return null;
  }

  /**
   * Método inteligente que tenta parsear qualquer formato de worked example
   */
  async getWorkedExampleAny(
    userQuery: string, 
    context?: string, 
    userContext?: UserContext
  ): Promise<{ structured?: StructuredWorkedExampleResponse; simple?: WorkedExampleResponse } | null> {
    const response = await this.askQuestion({
      methodology: MethodologyType.WORKED_EXAMPLES,
      userQuery,
      context,
      userContext
    });

    if (response.isXmlFormatted) {
      // Tenta primeiro o template estruturado
      const structured = this.parseStructuredWorkedExampleResponse(response.response);
      if (structured) {
        return { structured };
      }

      // Se falhar, tenta o template simples
      const simple = this.parseWorkedExampleResponse(response.response);
      if (simple) {
        return { simple };
      }
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
