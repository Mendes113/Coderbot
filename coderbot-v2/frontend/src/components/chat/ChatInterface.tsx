import { useState, useRef, useEffect } from "react";
import { AnalogySettings } from "@/components/chat/AnalogySettings";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { Message, fetchChatResponse, fetchMethodologies, MethodologyInfo } from "@/services/api";
import { toast } from "@/components/ui/sonner";
import { Loader2, MessageSquarePlus, Settings } from "lucide-react";
import { 
  Drawer, 
  DrawerClose, 
  DrawerContent, 
  DrawerTrigger 
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { chatService } from "@/services/chat-service";
import { SessionSidebar } from "@/components/chat/SessionSidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Define Settings Components Outside ---

interface SettingsProps {
  analogiesEnabled: boolean;
  setAnalogiesEnabled: (enabled: boolean) => void;
  knowledgeBase: string;
  setKnowledgeBase: (base: string) => void;
  aiModel: string;
  setAiModel: (model: string) => void;
  methodology: string;
  setMethodology: (methodology: string) => void;
  availableMethodologies: MethodologyInfo[];
}

// Renamed to avoid conflict and indicate it's a view component
const DesktopSettingsView: React.FC<SettingsProps> = (props) => (
  <div className="mb-3">
    <AnalogySettings {...props} />
    
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Modelo de IA</h3>
      <Select value={props.aiModel} onValueChange={props.setAiModel}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o modelo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
          <SelectItem value="gpt-4">GPT-4</SelectItem>
          <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Metodologia de Ensino</h3>
      <Select 
        value={props.methodology} 
        onValueChange={props.setMethodology}
        disabled={props.availableMethodologies.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione a metodologia" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Padrão</SelectItem>
          <SelectItem value="analogy">Analogias</SelectItem>
          {props.availableMethodologies.map(m => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {props.methodology && props.methodology !== "default" && props.methodology !== "analogy" && (
        <div className="mt-2 text-xs text-gray-500">
          {props.availableMethodologies.find(m => m.id === props.methodology)?.description || ""}
        </div>
      )}
    </div>
  </div>
);

// Renamed to avoid conflict and indicate it's a view component
const MobileSettingsDrawerView: React.FC<SettingsProps> = (props) => (
  <Drawer>
    <DrawerTrigger asChild>
      <Button variant="outline" size="icon" className="h-8 w-8">
        <Settings className="h-4 w-4" />
      </Button>
    </DrawerTrigger>
    <DrawerContent className="px-4 pb-6 pt-2">
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-3">Configurações do Chat</h3>
        <AnalogySettings {...props} />
        
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Modelo de IA</h3>
          <Select value={props.aiModel} onValueChange={props.setAiModel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o modelo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Metodologia de Ensino</h3>
          <Select 
            value={props.methodology} 
            onValueChange={props.setMethodology}
            disabled={props.availableMethodologies.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione a metodologia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Padrão</SelectItem>
              <SelectItem value="analogy">Analogias</SelectItem>
              {props.availableMethodologies.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {props.methodology && props.methodology !== "default" && props.methodology !== "analogy" && (
            <div className="mt-2 text-xs text-gray-500">
              {props.availableMethodologies.find(m => m.id === props.methodology)?.description || ""}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <DrawerClose asChild>
          <Button variant="default">Fechar</Button>
        </DrawerClose>
      </div>
    </DrawerContent>
  </Drawer>
);


// --- Main Chat Interface Component ---

interface ChatInterfaceProps {
  whiteboardContext?: Record<string, any> | null;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    content: "Olá! Como posso ajudar com seu aprendizado hoje?",
    isAi: true,
    timestamp: new Date(),
  },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ whiteboardContext }) => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [analogiesEnabled, setAnalogiesEnabled] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [aiModel, setAiModel] = useState<string>("gpt-3.5-turbo");
  const [methodology, setMethodology] = useState<string>("default");
  const [availableMethodologies, setAvailableMethodologies] = useState<MethodologyInfo[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [showAnalogyDropdown, setShowAnalogyDropdown] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [sessionId, setSessionId] = useState<string>("");

  // Load or create session
  // Load available methodologies
  useEffect(() => {
    const loadMethodologies = async () => {
      try {
        setIsLoading(true);
        const methodologies = await fetchMethodologies();
        
        if (methodologies && methodologies.length > 0) {
          setAvailableMethodologies(methodologies);
          console.log("Available methodologies loaded:", methodologies);
          
          // Set default methodology to Sequential Thinking if available
          const sequentialThinking = methodologies.find(m => 
            m.name.toLowerCase().includes("sequential") || 
            m.id === "sequential_thinking"
          );
          
          if (sequentialThinking) {
            setMethodology(sequentialThinking.id);
          }
        } else {
          console.warn("No teaching methodologies found");
        }
      } catch (error) {
        console.error("Error loading methodologies:", error);
        toast.error("Não foi possível carregar as metodologias de ensino");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMethodologies();
  }, []);

  useEffect(() => {
    const initSession = async () => {
      try {
        // Create new session
        const newSessionId = await chatService.createSession();
        setSessionId(newSessionId);

        // Save initial AI message
        await chatService.saveMessage({
          content: INITIAL_MESSAGES[0].content,
          isAi: true,
          sessionId: newSessionId,
        });

        // No need to load messages for a new session as we just created it
        // The initial message will be displayed from the INITIAL_MESSAGES constant
      } catch (error) {
        console.error("Error initializing chat session:", error);
        toast.error("Error creating chat session");
      }
    };

    initSession();
  }, []);

  const handleSessionChange = async (newSessionId: string) => {
    try {
      setIsLoading(true);
      const sessionMessages = await chatService.loadSessionMessages(newSessionId);
      
      if (sessionMessages && sessionMessages.length > 0) {
        setMessages(sessionMessages);
      } else {
        // If no messages found, show at least the initial greeting
        setMessages(INITIAL_MESSAGES);
      }
      
      setSessionId(newSessionId);
      scrollToBottom(); // Scroll to bottom when changing sessions
    } catch (error) {
      console.error("Error changing session:", error);
      toast.error("Erro ao carregar mensagens da sessão");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    setSessionId(""); // This will trigger the useEffect to create a new session
    setMessages(INITIAL_MESSAGES);
  };

  const handleSendMessage = async (input: string) => {
    if (!input.trim() || !sessionId) return;
    
    const userMessage = {
      id: Date.now().toString(), // Temporary ID for UI
      content: input,
      isAi: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Save user message
      const userMsgId = await chatService.saveMessage({
        content: input,
        isAi: false,
        sessionId,
      });

      // Update the user message with the real ID from PocketBase
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, id: userMsgId } 
            : msg
        )
      );

      // Create a temporary AI message
      const tempId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, {
        id: tempId,
        content: "",
        isAi: true,
        timestamp: new Date(),
      }]);

      // Define user profile information for the AI
      const userProfile = {
        difficulty_level: "medium",
        subject_area: "programming",
        style_preference: analogiesEnabled ? "analogies" : "concise",
        learning_progress: { questions_answered: messages.length / 2, correct_answers: 0 },
        baseKnowledge: knowledgeBase || "basic"
      };

      const response = await fetchChatResponse(
        input, 
        analogiesEnabled, 
        false,
        knowledgeBase,
        aiModel,
        methodology,
        userProfile,
        whiteboardContext
      );
      
      // Save AI response
      const aiMsgId = await chatService.saveMessage({
        content: response.content,
        isAi: true,
        sessionId,
      });

      // Update the AI message with content and real ID
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? {
                ...msg,
                id: aiMsgId,
                content: response.content,
                timestamp: new Date()
              } 
            : msg
        )
      );
    } catch (error) {
      console.error("Error processing message:", error);
      toast.error("Error processing message. Please try again.");
      
      setMessages(prev => prev.filter(msg => !msg.content.includes("")));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-full overflow-hidden">
      <style>{`
        @keyframes auroraMove1 {
          0% { transform: scale(1) translate(0, 0); opacity: 0.7; }
          50% { transform: scale(1.08) translate(30px, 20px); opacity: 1; }
          100% { transform: scale(1) translate(0, 0); opacity: 0.7; }
        }
        @keyframes auroraMove2 {
          0% { transform: scale(1) translate(0, 0); opacity: 0.5; }
          50% { transform: scale(1.12) translate(-40px, 10px); opacity: 0.7; }
          100% { transform: scale(1) translate(0, 0); opacity: 0.5; }
        }
        @keyframes auroraMove3 {
          0% { transform: scale(1) translate(0, 0); opacity: 0.3; }
          50% { transform: scale(1.06) translate(20px, -20px); opacity: 0.5; }
          100% { transform: scale(1) translate(0, 0); opacity: 0.3; }
        }
      `}</style>
      {/* Aurora/Bolhas de fundo */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Bolha roxa superior esquerda */}
        <div className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(108,58,209,0.35)_0%,rgba(108,58,209,0)_70%)] blur-2xl"
          style={{ animation: 'auroraMove1 16s ease-in-out infinite alternate' }}
        />
        {/* Bolha roxa inferior direita */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(108,58,209,0.25)_0%,rgba(108,58,209,0)_80%)] blur-3xl"
          style={{ animation: 'auroraMove2 22s ease-in-out infinite alternate' }}
        />
        {/* Aurora suave centro-direita */}
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[250px] rounded-full bg-[radial-gradient(ellipse,rgba(180,120,255,0.18)_0%,rgba(108,58,209,0)_80%)] blur-2xl"
          style={{ animation: 'auroraMove3 18s ease-in-out infinite alternate' }}
        />
      </div>


      {/* Session Sidebar - hidden on mobile by default */}
      {showSidebar && (
        <div className={`${isMobile ? 'absolute z-10 h-full' : 'w-72'}`}>
          <SessionSidebar
            currentSessionId={sessionId}
            onSessionChange={handleSessionChange}
            onNewSession={handleNewSession}
          />
        </div>
      )}
      {/* Conteúdo do chat */}
      <div className="flex-1 flex flex-col h-full relative z-10 bg-[#0a0a0a]/95">

      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Bolha roxa superior esquerda */}
        <div className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(108,58,209,0.35)_0%,rgba(108,58,209,0)_70%)] blur-2xl"
          style={{ animation: 'auroraMove1 16s ease-in-out infinite alternate' }}
        />
        {/* Bolha roxa inferior direita */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(108,58,209,0.25)_0%,rgba(108,58,209,0)_80%)] blur-3xl"
          style={{ animation: 'auroraMove2 22s ease-in-out infinite alternate' }}
        />
        {/* Aurora suave centro-direita */}
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[250px] rounded-full bg-[radial-gradient(ellipse,rgba(180,120,255,0.18)_0%,rgba(108,58,209,0)_80%)] blur-2xl"
          style={{ animation: 'auroraMove3 18s ease-in-out infinite alternate' }}
        />
      </div>
      
        <div className="p-4 border-b">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center gap-2">
              {/* Toggle sidebar button on mobile */}
              {isMobile && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 mr-2"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  <MessageSquarePlus className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-xl font-semibold text-primary">Assistente de Aprendizado</h1>
                <p className="text-sm text-muted-foreground">Tire suas dúvidas sobre programação</p>
              </div>
            </div>
            {/* Modern header controls: modelo, metodologia, analogia dropdown */}
            <div className="flex items-center gap-2 mt-2 sm:mt-0 relative">
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="Modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={methodology} 
                onValueChange={setMethodology}
                disabled={availableMethodologies.length === 0}
              >
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="Metodologia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Padrão</SelectItem>
                  <SelectItem value="analogy">Analogias</SelectItem>
                  {availableMethodologies.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Dropdown de analogias */}
              <div className="relative">
                <button
                  type="button"
                  aria-label={analogiesEnabled ? "Gerenciar analogias" : "Ativar analogias"}
                  title={analogiesEnabled ? "Gerenciar analogias" : "Ativar analogias"}
                  onClick={() => {
                    if (!analogiesEnabled) { // If analogies are currently OFF
                      setAnalogiesEnabled(true);    // Turn them ON
                      setShowAnalogyDropdown(true); // And show the dropdown
                    } else { // If analogies are already ON
                      setShowAnalogyDropdown((prev) => !prev); // Just toggle dropdown visibility
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    analogiesEnabled
                      ? "bg-[hsl(var(--education-purple)/0.12)] text-[hsl(var(--education-purple))] border-[hsl(var(--education-purple))]"
                      : "bg-white text-gray-500 hover:text-[hsl(var(--education-purple))] hover:border-[hsl(var(--education-purple))]"
                  )}
                  tabIndex={0}
                  style={{ minHeight: 28 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Analogias</span>
                  <svg className={cn("h-3 w-3 ml-1 transition-transform", showAnalogyDropdown ? "rotate-180" : "rotate-0")}
                    fill="none" viewBox="0 0 20 20" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8l4 4 4-4" />
                  </svg>
                </button>
                {/* Dropdown/colapsável */}
                {showAnalogyDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3 animate-fade-in">
                    <label htmlFor="knowledge-base" className="block text-xs font-medium text-gray-700 mb-1">O que você já sabe ou quer usar como analogia?</label>
                    <textarea
                      id="knowledge-base"
                      value={knowledgeBase}
                      onChange={e => setKnowledgeBase(e.target.value)}
                      rows={3}
                      placeholder="Ex: Já sei variáveis, quero analogias com futebol..."
                      className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-3 py-2 text-sm focus:border-[hsl(var(--education-purple))] focus:ring-2 focus:ring-[hsl(var(--education-purple))] transition-all outline-none resize-none"
                      style={{ minHeight: 36, maxHeight: 100 }}
                      autoFocus
                    />
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs text-red-600 hover:text-red-700 mt-2 p-0 h-auto font-medium"
                      onClick={() => {
                        setAnalogiesEnabled(false);    // Turn OFF analogies feature
                        setShowAnalogyDropdown(false); // And hide the dropdown
                        // setKnowledgeBase(""); // Optionally clear the knowledge base
                      }}
                    >
                      Desativar Analogias
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                isAi={message.isAi}
                timestamp={message.timestamp}
              />
            ))}
            {isLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className={cn(
          "border-t p-4 bg-background/80 backdrop-blur-sm",
          isMobile ? "pb-6" : ""
        )}>
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              analogiesEnabled={analogiesEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
