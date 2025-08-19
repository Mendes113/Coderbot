

export type Message = {
  id: string;
  content: string;
  isAi: boolean;
  timestamp: Date;
};

export type ApiResponse = {
  content: string;
  analogies?: string;
};

// Constante para URL base da API
const BASE_URL = "http://localhost:8000/deepseek/chat/completions";

// Interface para representar a mensagem de chat no formato da API DeepSeek
interface ChatMessageInput {
  role: string;
  content: string;
  knowledge_level?: string;
  subject_focus?: string;
  context?: string;
}

export interface UserProfile {
  difficulty_level?: string;
  baseKnowledge?: string;
  learning_progress?: any;
  style_preference?: string;
  subject_area?: string;
}

export interface MethodologyInfo {
  id: string;
  name: string;
  description: string;
  recommended_for: string[];
}

// Define MethodologyType if not imported from backend
export const MethodologyType = {
  DEFAULT: { value: "default" },
  ANALOGY: { value: "analogy" },
  SEQUENTIAL: { value: "sequential" },
};

export const fetchChatResponse = async (
  message: string,
  useAnalogies: boolean = false,
  useSequential: boolean = false,
  knowledge: string = "",
  model: string = "gpt-4o-mini",
  methodology: string = "default",
  userProfile?: UserProfile,
  whiteboardContext?: Record<string, any> | null
): Promise<ApiResponse> => {
  try {
    const messages: ChatMessageInput[] = [
      { 
        role: "user", 
        content: message,
        knowledge_level: knowledge || "beginner",
        context: "teaching"
      }
    ];

    let url: string;
    let body: any;

    if (whiteboardContext) {
      url = "http://localhost:8000/api/whiteboard/ask";
      
      let effectiveMethodology: string | null;
      // If the frontend's methodology is "default" or "analogy" (which implies default behavior for whiteboard context),
      // send null to let the backend apply its Pydantic default for WhiteboardAskRequest.methodology.
      // Otherwise, send the specific methodology string.
      if (methodology === MethodologyType.DEFAULT.value || methodology === MethodologyType.ANALOGY.value) {
        effectiveMethodology = null; 
      } else {
        effectiveMethodology = methodology; 
      }

      let processedExcalidrawJson: Record<string, any>;
      if (typeof whiteboardContext === 'string') {
        try {
          processedExcalidrawJson = JSON.parse(whiteboardContext);
        } catch (parseError) {
          console.error("Failed to parse whiteboardContext string into JSON:", parseError);
          throw new Error("whiteboardContext was provided as a string, but it's not valid JSON.");
        }
      } else if (typeof whiteboardContext === 'object' && whiteboardContext !== null) {
        processedExcalidrawJson = whiteboardContext;
      } else {
        console.error("Invalid type for whiteboardContext. Expected object or JSON string, got:", typeof whiteboardContext);
        throw new Error("Invalid type for whiteboardContext. Expected object or JSON string.");
      }

      body = {
        message: message,
        excalidraw_json: processedExcalidrawJson, // Use the processed version
        chat_id: null, // Consistently send null for now
        prompt_template: null, // Consistently send null for now
        use_rag: false, // Default to false
        methodology: effectiveMethodology, // Will be a specific string or null
        user_profile: userProfile // Will be the userProfile object or undefined
      };
      // Ensure that if userProfile was undefined, it's removed from the body so Pydantic uses its default (None)
      Object.keys(body).forEach(key => {
        if (body[key] === undefined) {
          delete body[key];
        }
      });
    } else {
      url = methodology !== "default" && methodology !== "analogy" 
        ? "http://localhost:8000/chat/completions" 
        : `${BASE_URL}?use_analogies=${useAnalogies}`;
      
      body = {
        model: model,
        messages: messages,
        max_tokens: 12048,
        temperature: 0.7,
        methodology: methodology,
        user_profile: userProfile || {
          difficulty_level: "medium",
          subject_area: "programming",
          style_preference: useAnalogies ? "analogies" : "concise",
          learning_progress: { questions_answered: 0, correct_answers: 0 },
          baseKnowledge: knowledge || "basic"
        }
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro na resposta: ${response.status} - ${errorText}`);
      throw new Error(`Erro: ${response.statusText}`);
    }
    
    // Processar resposta da API
    const data = await response.json();
    
    // Extrair conteúdo da resposta conforme formato da API
    let content = "";
    
    // Case 1: Direct response from standard DeepSeek API
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      content = data.choices[0].message.content;
    } 
    // Case 2: Direct content field
    else if (data.content) {
      content = data.content;
    }
    // Case 3: Educational methodology response format (nested response object)
    else if (data.response && data.response.choices && data.response.choices.length > 0) {
      if (data.response.choices[0].message && data.response.choices[0].message.content) {
        content = data.response.choices[0].message.content;
      }
    }
    
    return { 
      content: content || "Não foi possível obter uma resposta clara."
    };
  } catch (error) {
    console.error("Erro ao buscar resposta do chat:", error);
   
    return { 
      content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente."
    };
  }
};


