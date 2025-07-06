import { useState, useRef, useEffect } from "react";
import { AnalogySettings } from "@/components/chat/AnalogySettings";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { InitialWelcomeMessages } from "@/components/chat/InitialWelcomeMessages";
import { Message, fetchChatResponse, fetchMethodologies, MethodologyInfo } from "@/services/api";
import { toast } from "@/components/ui/sonner";
import { Loader2, MessageSquarePlus, Settings, Brain, Sparkles, Heart, Zap, Star, Trophy, Target, Flame, Gift, ThumbsUp, Smile, PartyPopper } from "lucide-react";
import confetti from 'canvas-confetti';
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
import { soundEffects } from "@/utils/sounds";

// --- Componentes de Design Emocional ---

// Componente do mascote CodeBot (inspirado no Duo)
const CodeBotMascot = ({ emotion = 'neutral', size = 'medium', isIdle = false }: { emotion?: 'happy' | 'thinking' | 'celebrating' | 'encouraging' | 'neutral'; size?: 'small' | 'medium' | 'large'; isIdle?: boolean }) => {
  const [idleAnimation, setIdleAnimation] = useState(0);
  
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  // Animações de idle (quando parado)
  useEffect(() => {
    if (isIdle) {
      const interval = setInterval(() => {
        setIdleAnimation(prev => (prev + 1) % 4);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isIdle]);

  const getEmotionAnimation = () => {
    if (isIdle) {
      const idleAnimations = ['animate-bounce', 'animate-pulse', 'animate-wiggle', ''];
      return idleAnimations[idleAnimation];
    }
    
    switch (emotion) {
      case 'happy': return 'animate-bounce';
      case 'thinking': return 'animate-pulse';
      case 'celebrating': return 'animate-spin';
      case 'encouraging': return 'animate-wiggle';
      default: return '';
    }
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${getEmotionAnimation()} transition-all duration-500`}>
      <img
        src="/coderbot_colorfull.png"
        alt="CodeBot"
        className="w-full h-full rounded-full shadow-lg object-contain hover:scale-110 transition-transform cursor-pointer"
      />
      {emotion === 'celebrating' && (
        <div className="absolute -top-1 -right-1">
          <Star className="w-4 h-4 text-yellow-400 animate-spin" />
        </div>
      )}
      {emotion === 'encouraging' && (
        <div className="absolute -top-1 -right-1">
          <Heart className="w-3 h-3 text-red-400 animate-pulse" />
        </div>
      )}
      {isIdle && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de confetti (inspirado no Duolingo) - Agora com canvas-confetti profissional
const ConfettiExplosion = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    // Múltiplas explosões de confetti para efeito mais impressionante
    const confettiAnimations = [
      // Primeiro burst - do centro
      () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      },
      // Segunda explosão - lateral esquerda
      () => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.5 }
        });
      },
      // Terceira explosão - lateral direita
      () => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.5 }
        });
      },
      // Quarta explosão - chuva de estrelas
      () => {
        confetti({
          particleCount: 30,
          spread: 360,
          ticks: 200,
          origin: { y: 0.3 },
          colors: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6']
        });
      }
    ];

    // Executar cada animação com intervalos
    confettiAnimations.forEach((animation, index) => {
      setTimeout(animation, index * 200);
    });

    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Central celebration message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full shadow-2xl animate-bounce text-xl font-bold">
          <div className="flex items-center gap-2">
            <PartyPopper className="w-6 h-6" />
            Incrível! 🎉
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de streak/progresso (inspirado no Duolingo)
const StreakTracker = ({ streak, target = 5 }: { streak: number; target?: number }) => {
  const progress = Math.min(streak / target, 1);
  
  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 px-3 py-2 rounded-full">
      <Flame className={`w-4 h-4 ${streak > 0 ? 'text-orange-500 animate-pulse' : 'text-gray-400'}`} />
      <span className="text-sm font-medium text-orange-700">
        {streak} de {target}
      </span>
      <div className="w-16 h-2 bg-orange-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
};

// Sistema de conquistas (badges)
const AchievementBadge = ({ type, unlocked = false }: { type: 'first_chat' | 'streak_5' | 'curious_learner' | 'problem_solver'; unlocked?: boolean }) => {
  const badges = {
    first_chat: { icon: Heart, label: 'Primeiro Chat', color: 'from-pink-400 to-purple-400' },
    streak_5: { icon: Flame, label: 'Sequência de 5', color: 'from-orange-400 to-red-400' },
    curious_learner: { icon: Brain, label: 'Curioso', color: 'from-blue-400 to-indigo-400' },
    problem_solver: { icon: Target, label: 'Solucionador', color: 'from-green-400 to-emerald-400' }
  };

  const badge = badges[type];
  const IconComponent = badge.icon;

  return (
    <div className={`relative ${unlocked ? 'animate-pulse' : 'opacity-50'}`}>
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg ${unlocked ? 'animate-bounce' : ''}`}>
        <IconComponent className="w-6 h-6 text-white" />
      </div>
      {unlocked && (
        <div className="absolute -top-1 -right-1">
          <Star className="w-4 h-4 text-yellow-400 animate-spin" />
        </div>
      )}
      <div className="text-xs text-center mt-1 font-medium">{badge.label}</div>
    </div>
  );
};

// Componente de carregamento emocional/humanizado
const EmotionalLoadingIndicator = ({ messages }: { messages: string[] }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {/* CodeBot pensando */}
      <div className="mb-4">
        <CodeBotMascot emotion="thinking" size="large" />
      </div>
      
      {/* Mensagem dinâmica */}
      <div className="text-center max-w-xs">
        <p className="text-sm text-gray-600 font-medium animate-fade-in-out">
          {messages[currentMessageIndex]}
        </p>
        
        {/* Indicador de digitação tipo messenger */}
        <div className="flex justify-center mt-3 space-x-1">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

// Componente de boas-vindas emocional
const EmotionalWelcome = ({ onStartChat }: { onStartChat: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* CodeBot animado */}
      <div className="mb-6">
        <CodeBotMascot emotion="happy" size="large" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Olá! Eu sou o CodeBot ✨
      </h2>
      
      <p className="text-gray-600 mb-6 max-w-md leading-relaxed">
        Estou aqui para tornar seu aprendizado mais divertido e envolvente. 
        Que tal começarmos esta jornada juntos?
      </p>
      
      <Button 
        onClick={onStartChat}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        <Zap className="w-4 h-4 mr-2" />
        Vamos começar!
      </Button>
      
      {/* Mini badges de demonstração */}
      <div className="flex gap-4 mt-8">
        <AchievementBadge type="first_chat" unlocked={false} />
        <AchievementBadge type="curious_learner" unlocked={false} />
        <AchievementBadge type="problem_solver" unlocked={false} />
      </div>
    </div>
  );
};

// Componente de feedback de conquista
const AchievementFeedback = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 animate-pulse" />
        <span className="font-medium">{message}</span>
        <Sparkles className="w-4 h-4 animate-spin" />
      </div>
    </div>
  );
};

// Componente de reações emotivas do CodeBot
const CodeBotReaction = ({ type }: { type: 'encouragement' | 'celebration' | 'thinking' | 'supportive' }) => {
  const reactions = {
    encouragement: {
      message: "Ótima pergunta! Continue assim! 💪",
      emotion: 'encouraging' as const,
      icon: ThumbsUp,
      gradient: "from-blue-400 to-purple-400"
    },
    celebration: {
      message: "Incrível! Você está indo muito bem! 🎉",
      emotion: 'celebrating' as const,
      icon: PartyPopper,
      gradient: "from-yellow-400 to-orange-400"
    },
    thinking: {
      message: "Interessante... deixe-me pensar na melhor resposta 🤔",
      emotion: 'thinking' as const,
      icon: Brain,
      gradient: "from-purple-400 to-pink-400"
    },
    supportive: {
      message: "Não se preocupe, estamos aprendendo juntos! 🤗",
      emotion: 'encouraging' as const,
      icon: Heart,
      gradient: "from-pink-400 to-red-400"
    }
  };

  const reaction = reactions[type];
  const IconComponent = reaction.icon;

  return (
    <div className="flex items-start gap-3 mb-4 animate-slide-in-left">
      <CodeBotMascot emotion={reaction.emotion} size="medium" />
      <div className={`bg-gradient-to-r ${reaction.gradient} text-white px-4 py-2 rounded-2xl rounded-bl-none shadow-lg max-w-xs`}>
        <div className="flex items-center gap-2">
          <IconComponent className="w-4 h-4" />
          <span className="text-sm font-medium">{reaction.message}</span>
        </div>
      </div>
    </div>
  );
};

// Componente de estado idle - versão ultra sutil e discreta
const IdleState = ({ 
  onSuggestedQuestion, 
  idleLevel = 'mild' 
}: { 
  onSuggestedQuestion: (question: string) => void;
  idleLevel?: 'none' | 'mild' | 'moderate' | 'high';
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Diferentes níveis de engajamento - versão minimalista
  const getEngagementData = () => {
    switch (idleLevel) {
      case 'mild':
        return {
          emotion: 'neutral' as const,
          message: "Alguma dúvida?",
          suggestions: [],
          showParticles: false,
          delay: 5000 // Mais tempo antes de aparecer
        };
      case 'moderate':
        return {
          emotion: 'thinking' as const,
          message: "Posso ajudar?",
          suggestions: [
            "Como funciona um loop?",
            "O que são variáveis?"
          ],
          showParticles: false, // Removido partículas
          delay: 4000
        };
      case 'high':
        return {
          emotion: 'neutral' as const, // Menos emoção
          message: "Como posso ajudar?",
          suggestions: [
            "Que tal um exemplo prático?",
            "Posso explicar algo novo?"
          ],
          showParticles: false, // Removido partículas
          delay: 3000
        };
      default:
        return null;
    }
  };

  const engagementData = getEngagementData();
  
  if (!engagementData) return null;

  useEffect(() => {
    const suggestionTimer = setTimeout(() => {
      setShowSuggestions(true);
    }, engagementData.delay);
    
    return () => clearTimeout(suggestionTimer);
  }, [idleLevel, engagementData.delay]);

  return (
    <div className="flex flex-col items-center justify-center py-4 space-y-3 relative opacity-80">
      {/* CodeBot sem animações chamativos */}
      <div className="flex flex-col items-center space-y-2">
        <div className="transition-opacity duration-1000">
          <CodeBotMascot emotion={engagementData.emotion} size="small" isIdle={false} />
        </div>
        
        {/* Mensagem ultra discreta */}
        {/* <div className="bg-gray-50/80 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs opacity-70">
          <span>{engagementData.message}</span>
        </div> */}
      </div>

      
    </div>
  );
};

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

// DesktopSettingsView: REMOVE methodology dropdown (keep only analogy and model)
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
    {/* Methodology dropdown removed from settings */}
  </div>
);

// MobileSettingsDrawerView: REMOVE methodology dropdown (keep only analogy and model)
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
        {/* Methodology dropdown removed from settings */}
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
  methodology?: string;
  userId?: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    content: "Olá! 👋 Eu sou o CodeBot, seu assistente educacional! Estou aqui para tornar seu aprendizado mais divertido e personalizado. Que tal começarmos nossa jornada de conhecimento juntos? 🚀✨",
    isAi: true,
    timestamp: new Date(),
  },

  //MENSAGEM EXPLICANDO COMO PODER SER USADO O CHAT
  {
    id: "2",
    content: "Você pode me fazer perguntas sobre programação, pedir explicações de conceitos, solicitar exemplos práticos ou até mesmo pedir analogias para facilitar o entendimento. Estou aqui para ajudar! 😊",
    isAi: true,
    timestamp: new Date(),
  },
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ whiteboardContext, methodology = "default", userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analogiesEnabled, setAnalogiesEnabled] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [aiModel, setAiModel] = useState<string>("gpt-3.5-turbo");
  const [methodologyState, setMethodology] = useState<string>("default");
  const [availableMethodologies, setAvailableMethodologies] = useState<MethodologyInfo[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [showAnalogyDropdown, setShowAnalogyDropdown] = useState(false);
  
  // Estados para controle das mensagens de boas-vindas
  const [showWelcomeMessages, setShowWelcomeMessages] = useState(true);
  const [welcomeComplete, setWelcomeComplete] = useState(false);
  
  // Estados emocionais e de experiência do usuário
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  const [userEngagement, setUserEngagement] = useState<'low' | 'medium' | 'high'>('medium');
  const [loadingMessages] = useState([
    "Analisando sua pergunta com carinho... 🤔",
    "Buscando a melhor forma de explicar... 💡",
    "Preparando uma resposta especial para você... ✨",
    "Organizando os conceitos de forma clara... 📚",
    "Quase pronto! Criando algo incrível... 🚀"
  ]);
  const [celebrationCount, setCelebrationCount] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementMessage, setAchievementMessage] = useState("");
  const [emotionalState, setEmotionalState] = useState<'neutral' | 'encouraging' | 'celebrating' | 'supportive'>('neutral');

  // Novos estados emocionais inspirados no Duolingo
  const [streakCount, setStreakCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [showCodeBotReaction, setShowCodeBotReaction] = useState<string | null>(null);
  const [sessionMessagesCount, setSessionMessagesCount] = useState(0);
  const [lastInteractionTime, setLastInteractionTime] = useState<Date | null>(null);
  
  // Estados para idle/waiting
  const [isUserIdle, setIsUserIdle] = useState(false);
  const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null);
  const [idleShowSuggestions, setIdleShowSuggestions] = useState(false);
  const [idleLevel, setIdleLevel] = useState<'none' | 'mild' | 'moderate' | 'high'>('none');

  // Funções de celebração profissionais usando canvas-confetti + sons
  const triggerBasicCelebration = () => {
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.7 }
    });
    soundEffects.playSuccess();
  };

  const triggerMajorCelebration = () => {
    // Explosão dupla
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 0);
    
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }, 300);
    
    soundEffects.playAchievement();
  };

  const triggerEpicCelebration = () => {
    setShowConfetti(true);
    
    // Múltiplas explosões épicas
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.1, 0.3) }
      });
      confetti({
        particleCount: 5,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.1, 0.3) }
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
    soundEffects.playEpicCelebration();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Função para gerenciar idle state
  const resetIdleTimer = () => {
    // Limpa timer anterior
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    
    // Reset estados idle
    if (isUserIdle) {
      setIsUserIdle(false);
      setIdleLevel('none');
      setIdleShowSuggestions(false);
    }
    
    // Inicia novo timer
    const newTimer = setTimeout(() => {
      handleUserIdle();
    }, 15000); // 15 segundos de inatividade
    
    setIdleTimer(newTimer);
  };

  const handleUserIdle = () => {
    setIsUserIdle(true);
    setIdleLevel('mild');
    
    // Escalar o nível de idle ao longo do tempo
    setTimeout(() => {
      setIdleLevel('moderate');
      setIdleShowSuggestions(true);
    }, 10000); // +10s = mild -> moderate
    
    setTimeout(() => {
      setIdleLevel('high');
    }, 25000); // +25s = moderate -> high
  };

  // Detectar interação do usuário
  const handleUserInteraction = () => {
    resetIdleTimer();
    setLastInteractionTime(new Date());
  };

  const [sessionId, setSessionId] = useState<string>("");

  // On mount, try to restore session from sessionStorage
  useEffect(() => {
    const lastSessionId = sessionStorage.getItem("coderbot_last_chat_session");
    if (lastSessionId) {
      // Try to load the last session
      handleSessionChange(lastSessionId);
    } else {
      // No session found, create a new one
      const initSession = async () => {
        try {
          const newSessionId = await chatService.createSession();
          setSessionId(newSessionId);
          sessionStorage.setItem("coderbot_last_chat_session", newSessionId);
        } catch (error) {
          console.error("Error initializing chat session:", error);
          toast.error("Error creating chat session");
        }
      };
      initSession();
    }
    // eslint-disable-next-line
  }, []);

  // When sessionId changes, update sessionStorage
  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem("coderbot_last_chat_session", sessionId);
    }
  }, [sessionId]);

  // Update handleSessionChange to also update sessionStorage
  const handleSessionChange = async (newSessionId: string) => {
    try {
      setIsLoading(true);
      const sessionMessages = await chatService.loadSessionMessages(newSessionId);
      if (sessionMessages && sessionMessages.length > 0) {
        setMessages(sessionMessages);
        setShowWelcomeMessages(false);
        setWelcomeComplete(true);
      } else {
        setMessages([]);
        setShowWelcomeMessages(true);
        setWelcomeComplete(false);
      }
      setSessionId(newSessionId);
      sessionStorage.setItem("coderbot_last_chat_session", newSessionId);
      scrollToBottom();
    } catch (error) {
      console.error("Error changing session:", error);
      toast.error("Erro ao carregar mensagens da sessão");
    } finally {
      setIsLoading(false);
    }
  };

  // Update handleNewSession to clear sessionStorage and create a new session
  const handleNewSession = async () => {
    setSessionId("");
    setMessages([]);
    setShowWelcomeMessages(true);
    setWelcomeComplete(false);
    try {
      const newSessionId = await chatService.createSession();
      setSessionId(newSessionId);
      sessionStorage.setItem("coderbot_last_chat_session", newSessionId);
    } catch (error) {
      console.error("Error creating new chat session:", error);
      toast.error("Erro ao criar nova sessão de chat");
    }
  };

  // Funções para lidar com as mensagens de boas-vindas
  const handleWelcomeComplete = async () => {
    setShowWelcomeMessages(false);
    setWelcomeComplete(true);
    setMessages(INITIAL_MESSAGES);
    
    // Save initial messages to database now that welcome is complete
    if (sessionId) {
      try {
        for (const message of INITIAL_MESSAGES) {
          await chatService.saveMessage({
            content: message.content,
            isAi: message.isAi,
            sessionId,
          });
        }
      } catch (error) {
        console.error("Error saving initial messages:", error);
      }
    }
    
    scrollToBottom();
  };

  const handleWelcomeSkip = async () => {
    setShowWelcomeMessages(false);
    setWelcomeComplete(true);
    setMessages(INITIAL_MESSAGES);
    
    // Save initial messages to database
    if (sessionId) {
      try {
        for (const message of INITIAL_MESSAGES) {
          await chatService.saveMessage({
            content: message.content,
            isAi: message.isAi,
            sessionId,
          });
        }
      } catch (error) {
        console.error("Error saving initial messages:", error);
      }
    }
    
    scrollToBottom();
  };

  const handleSendMessage = async (input: string) => {
    if (!input.trim() || !sessionId) return;
    
    // Se ainda está mostrando boas-vindas, completar primeiro
    if (showWelcomeMessages) {
      handleWelcomeComplete();
      // Aguardar um pouco para a transição
      setTimeout(() => {
        processMessage(input);
      }, 500);
      return;
    }
    
    processMessage(input);
  };

  const processMessage = async (input: string) => {
    // Reset idle quando usuário envia mensagem
    handleUserInteraction();
    
    // Sistema emocional inspirado no Duolingo
    const now = new Date();
    
    // Detectar primeiro uso e celebrar
    if (isFirstInteraction) {
      setIsFirstInteraction(false);
      setEmotionalState('encouraging');
      setShowCodeBotReaction('encouragement');
      
      // // Desbloquear badge de primeiro chat
      // if (!unlockedBadges.includes('first_chat')) {
      //   setUnlockedBadges(prev => [...prev, 'first_chat']);
      //   setAchievementMessage("🎉 Primeira pergunta desbloqueada!");
      //   setShowAchievement(true);
      // }
      
      setTimeout(() => setShowCodeBotReaction(null), 3000);
    }

    // Incrementar contadores
    setCelebrationCount(prev => prev + 1);
    setSessionMessagesCount(prev => prev + 1);
    setLastInteractionTime(now);

    // Sistema de streak (perguntas consecutivas)
    if (lastInteractionTime) {
      const timeDiff = now.getTime() - lastInteractionTime.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      // Se passou menos de 30 minutos, manter streak
      if (minutesDiff < 30) {
        setStreakCount(prev => prev + 1);
      } else {
        setStreakCount(1); // Reset streak
      }
    } else {
      setStreakCount(1);
    }

    // Celebrações baseadas no número de mensagens (como Duolingo) - Agora com confetti profissional
    if (celebrationCount > 0) {
      if (celebrationCount === 3) {
        triggerBasicCelebration();
        setShowCodeBotReaction('celebration');
        setAchievementMessage("🚀 Você está pegando o ritmo!");
        setShowAchievement(true);
        setTimeout(() => setShowCodeBotReaction(null), 3000);
      } else if (celebrationCount === 10) {
        triggerMajorCelebration();
        setAchievementMessage("🎯 10 perguntas! Você é um verdadeiro explorador!");
        setShowAchievement(true);
        if (!unlockedBadges.includes('curious_learner')) {
          setUnlockedBadges(prev => [...prev, 'curious_learner']);
        }
      } else if (celebrationCount === 25) {
        triggerEpicCelebration();
        setAchievementMessage("🌟 25 perguntas! Você é um mestre da curiosidade!");
        setShowAchievement(true);
        setEmotionalState('celebrating');
        if (!unlockedBadges.includes('problem_solver')) {
          setUnlockedBadges(prev => [...prev, 'problem_solver']);
        }
      } else if (celebrationCount % 20 === 0 && celebrationCount > 25) {
        triggerMajorCelebration();
        setAchievementMessage(`🔥 ${celebrationCount} perguntas! Dedicação impressionante!`);
        setShowAchievement(true);
        setEmotionalState('celebrating');
      }
    }

    // Sistema de streak com celebrations aprimoradas
    if (streakCount === 5 && !unlockedBadges.includes('streak_5')) {
      setUnlockedBadges(prev => [...prev, 'streak_5']);
      triggerMajorCelebration();
      setAchievementMessage("🔥 Sequência de 5! Você está em chamas!");
      setShowAchievement(true);
    } else if (streakCount === 10) {
      triggerEpicCelebration();
      setAchievementMessage("⚡ Sequência de 10! Você é imparável!");
      setShowAchievement(true);
    } else if (streakCount > 10 && streakCount % 5 === 0) {
      triggerBasicCelebration();
      soundEffects.playStreak();
      setAchievementMessage(`🌟 Sequência de ${streakCount}! Que constância!`);
      setShowAchievement(true);
    }
    
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
        methodologyState,
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
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes fade-in-out {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        @keyframes floatSmoothly {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-10px) translateX(5px);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-5px) translateX(-3px);
            opacity: 0.8;
          }
          75% {
            transform: translateY(-15px) translateX(2px);
            opacity: 0.4;
          }
        }
        
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animate-fade-in-out {
          animation: fade-in-out 2s ease-in-out infinite;
        }
        
        .animate-float-smoothly {
          animation: floatSmoothly ease-in-out infinite;
        }
        
        .animate-gentle-bounce {
          animation: gentleBounce 2s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
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
              <div className="flex items-center gap-3">
                {/* Avatar emocional do assistente */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  emotionalState === 'celebrating' ? "bg-gradient-to-br from-yellow-400 to-orange-400 animate-bounce" :
                  emotionalState === 'encouraging' ? "bg-gradient-to-br from-green-400 to-blue-400 animate-pulse" :
                  emotionalState === 'supportive' ? "bg-gradient-to-br from-purple-400 to-pink-400" :
                  "bg-gradient-to-br from-purple-500 to-pink-500"
                )}>
                  <Brain className={cn(
                    "w-6 h-6 text-white transition-transform duration-300",
                    isLoading ? "animate-bounce" : ""
                  )} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-primary">
                    {emotionalState === 'celebrating' ? "Parabéns! 🎉" :
                     emotionalState === 'encouraging' ? "Você está indo bem! ✨" :
                     "Assistente de Aprendizado"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? "Pensando em como ajudar você... 🤔" : 
                     celebrationCount > 10 ? "Que aprendiz dedicado! Continue assim! 🌟" :
                     celebrationCount > 5 ? "Ótimas perguntas! Vamos continuar! 💪" :
                     "Tire suas dúvidas sobre programação"}
                  </p>
                </div>
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
                value={methodologyState} 
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
            {/* Header com progresso e streak - inspirado no Duolingo */}
            {messages.length > 1 && (
              <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-4">
                  <CodeBotMascot emotion="happy" size="medium" />
                  <div>
                    <h3 className="font-bold text-gray-800">Sessão de Aprendizado</h3>
                    <p className="text-sm text-gray-600">{sessionMessagesCount} perguntas nesta sessão</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {streakCount > 0 && (
                    <StreakTracker streak={streakCount} target={5} />
                  )}
                  
                  {/* Mini badges earned */}
                  <div className="flex gap-1">
                    {unlockedBadges.map(badge => (
                      <AchievementBadge 
                        key={badge} 
                        type={badge as any} 
                        unlocked={true} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reação do CodeBot */}
            {showCodeBotReaction && (
              <CodeBotReaction type={showCodeBotReaction as any} />
            )}

            {/* Initial Welcome Messages with Animations */}
            {showWelcomeMessages && (
              <div className="space-y-4">
                <InitialWelcomeMessages
                  onComplete={handleWelcomeComplete}
                  onSkip={handleWelcomeSkip}
                />
              </div>
            )}

            {/* Regular Chat Messages */}
            {!showWelcomeMessages && messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                isAi={message.isAi}
                timestamp={message.timestamp}
              />
            ))}
            
            {/* IdleState - Aparecer quando usuário estiver idle (mas não em nível 'none') */}
            {isUserIdle && !isLoading && idleLevel !== 'none' && !showWelcomeMessages && (
              <IdleState 
                onSuggestedQuestion={handleSendMessage}
                idleLevel={idleLevel}
              />
            )}
            
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                {/* CodeBot pensando */}
                <div className="mb-4">
                  <CodeBotMascot emotion="thinking" size="large" />
                </div>
                
                {/* Enhanced typing indicator */}
                <div className="bg-white/90 backdrop-blur-sm border border-purple-100 rounded-2xl p-4 shadow-lg max-w-md w-full">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                      {loadingMessages[Math.floor(Date.now() / 2000) % loadingMessages.length]}
                    </span>
                  </div>
                </div>
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
      
      {/* Confetti celebration - inspirado no Duolingo */}
      {showConfetti && (
        <ConfettiExplosion onComplete={() => setShowConfetti(false)} />
      )}
      
      {/* Feedback de conquista */}
      {showAchievement && (
        <AchievementFeedback 
          message={achievementMessage}
          onClose={() => setShowAchievement(false)} 
        />
      )}
    </div>
  );
};
