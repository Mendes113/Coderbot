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
import { agnoService, MethodologyType, METHODOLOGY_CONFIG } from "@/services/agnoService";
import posthog from "posthog-js";
import type { QuizAnswerEvent } from "@/components/chat/ChatMessage";
// import { ProfileHeader } from "@/components/profile/ProfileHeader";

// Small hash for stable ids (same as ChatMessage pattern)
const simpleHash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `${h}`;
};

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
      <div className="mb-5">
        <CodeBotMascot emotion="thinking" size="large" />
      </div>
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-purple-100/60 bg-white/80 dark:bg-neutral-900/60 shadow-lg backdrop-blur-md">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-purple-50/60 to-fuchsia-50/40 dark:from-purple-900/20 dark:to-fuchsia-900/10"></div>
          <div className="relative p-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 bg-purple-50 text-purple-700">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {messages[currentMessageIndex]}
              </p>
            </div>
            <div className="mt-4 h-1.5 w-full bg-purple-100/60 dark:bg-purple-900/30 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-to-r from-purple-500 to-fuchsia-500 animate-pulse"></div>
            </div>
          </div>
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
          <SelectItem value="claude-3-sonnet">Claude 3.5 Sonnet</SelectItem>
          <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
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
              <SelectItem value="claude-3-sonnet">Claude 3.5 Sonnet</SelectItem>
              <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
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

// Analytics helper (privacy-safe)
const trackEvent = (name: string, props?: Record<string, any>) => {
  try {
    posthog?.capture?.(name, props);
  } catch (_e) {
    // no-op
  }
};

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
  const [aiModel, setAiModel] = useState<string>("claude-3-sonnet");
  // Estados para compatibilidade com sistema antigo (fallback)
  const [methodologyState, setMethodology] = useState<string>("default");
  const [availableMethodologies, setAvailableMethodologies] = useState<MethodologyInfo[]>([]);
  
  // Estados para o sistema AGNO (sempre ativado)
  const [agnoMethodology, setAgnoMethodology] = useState<MethodologyType>(MethodologyType.WORKED_EXAMPLES);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [showAnalogyDropdown, setShowAnalogyDropdown] = useState(false);
  const [diagramsEnabled, setDiagramsEnabled] = useState(true);
  const [diagramType, setDiagramType] = useState<'mermaid' | 'excalidraw'>("mermaid");
  const [maxFinalCodeLines] = useState<number>(150);
  
  // Segmentos estruturados do backend (exibição passo-a-passo)
  type ResponseSegment = { id: string; title: string; type: string; content: string; language?: string };
  const [pendingSegments, setPendingSegments] = useState<ResponseSegment[]>([]);
  const [segmentMessageIds, setSegmentMessageIds] = useState<string[]>([]);

  // Formata um segmento com um cabeçalho markdown amigável para o usuário
  const getSegmentBadge = (type: string): string => {
    switch (type) {
      case 'intro': return '✨ Introdução';
      case 'steps': return '📝 Passo a passo';
      case 'correct_example': return '✅ Exemplo Correto';
      case 'incorrect_example': return '⚠️ Exemplo Incorreto';
      case 'reflection': return '💭 Reflexão';
      case 'final_code': return '💻 Código final';
      default: return '📌 Etapa';
    }
  };
  const formatSegmentContent = (seg: ResponseSegment): string => {
    const label = seg.title?.trim().length ? seg.title : getSegmentBadge(seg.type);
    // Usa heading para aparecer como título no markdown renderizado
    return `### ${label}\n\n${seg.content || ''}`.trim();
  };

  // Rótulo do botão de avanço, contextual ao próximo segmento
  const getNextStepButtonLabel = (): string => {
    if (!pendingSegments || pendingSegments.length === 0) return 'Avançar etapa';
    const nextType = (pendingSegments[0]?.type || '').toLowerCase();
    switch (nextType) {
      case 'reflection':
        return 'Iniciar reflexão';
      case 'steps':
        return 'Ver passos';
      case 'correct_example':
        return 'Ver exemplo correto';
      case 'incorrect_example':
        return 'Ver exemplo incorreto';
      case 'final_code':
        return 'Ver código final';
      default:
        return 'Avançar etapa';
    }
  };

  // Session metrics (start/end)
  const sessionStartRef = useRef<number | null>(null);
  useEffect(() => {
    sessionStartRef.current = Date.now();
    posthog?.capture?.('edu_session_start', { route: 'dashboard/chat' });
    return () => {
      if (sessionStartRef.current) {
        const durationMs = Date.now() - sessionStartRef.current;
        posthog?.capture?.('edu_session_end', { route: 'dashboard/chat', durationMs });
      }
    };
  }, []);

  // Quiz correctness context
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizWrongCount, setQuizWrongCount] = useState(0);
  const [lastQuizAnswer, setLastQuizAnswer] = useState<QuizAnswerEvent | null>(null);
  const quizAttemptsRef = useRef<Map<string, number>>(new Map());

  const handleQuizAnswer = (evt: QuizAnswerEvent) => {
    setLastQuizAnswer(evt);
    const qid = simpleHash(evt.question || '');
    // increment attempts
    const prev = quizAttemptsRef.current.get(qid) || 0;
    quizAttemptsRef.current.set(qid, prev + 1);
    if (evt.correct) {
      // attempts to mastery
      const attempts = quizAttemptsRef.current.get(qid) || 1;
      posthog?.capture?.('edu_quiz_attempts_to_mastery', { questionId: qid, attempts });
      quizAttemptsRef.current.delete(qid);
      setQuizCorrectCount((c) => c + 1);
    } else {
      setQuizWrongCount((c) => c + 1);
    }
    // aggregate accuracy
    const corr = (evt.correct ? quizCorrectCount + 1 : quizCorrectCount);
    const wrong = (evt.correct ? quizWrongCount : quizWrongCount + 1);
    const total = corr + wrong;
    const accuracy = total > 0 ? corr / total : 0;
    posthog?.capture?.('edu_quiz_accuracy', { correctCount: corr, wrongCount: wrong, accuracy });
  };
  
  // Track settings changes (skip initial)
  const prevAiModel = useRef(aiModel);
  const prevAgno = useRef(agnoMethodology);
  const prevDiagrams = useRef(diagramsEnabled);
  const prevAnalogies = useRef(analogiesEnabled);
  useEffect(() => {
    if (prevAiModel.current !== aiModel) {
      trackEvent('edu_chat_settings_change', { setting: 'aiModel', value: aiModel });
      prevAiModel.current = aiModel;
    }
  }, [aiModel]);
  useEffect(() => {
    if (prevAgno.current !== agnoMethodology) {
      trackEvent('edu_chat_settings_change', { setting: 'methodology', value: agnoMethodology });
      prevAgno.current = agnoMethodology;
    }
  }, [agnoMethodology]);
  useEffect(() => {
    if (prevDiagrams.current !== diagramsEnabled) {
      trackEvent('edu_chat_settings_change', { setting: 'diagramsEnabled', value: diagramsEnabled });
      prevDiagrams.current = diagramsEnabled;
    }
  }, [diagramsEnabled]);
  useEffect(() => {
    if (prevAnalogies.current !== analogiesEnabled) {
      trackEvent('edu_chat_settings_change', { setting: 'analogiesEnabled', value: analogiesEnabled });
      prevAnalogies.current = analogiesEnabled;
    }
  }, [analogiesEnabled]);
  // Estados para controle das mensagens de boas-vindas
  const [showWelcomeMessages, setShowWelcomeMessages] = useState(true);
  const [welcomeComplete, setWelcomeComplete] = useState(false);
  
  // Estados emocionais e de experiência do usuário
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  const [userEngagement, setUserEngagement] = useState<'low' | 'medium' | 'high'>('medium');
  const [loadingMessages] = useState([
    "Pensando na melhor explicação pra você... 💡",
    "Organizando os passos de forma clara... 🧩",
    "Ajustando detalhes pra ficar redondinho... 🔎",
    "Deixando tudo simples e direto... ✨",
    "Quase lá! Finalizando sua resposta... 🚀"
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
  
  // Idle management
  const [isUserIdle, setIsUserIdle] = useState(false);
  const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null);
  const [idleShowSuggestions, setIdleShowSuggestions] = useState(false);
  const [idleLevel, setIdleLevel] = useState<'none' | 'mild' | 'moderate' | 'high'>("none");
  const idleStartRef = useRef<number | null>(null);

  // Track idle changes (ignore 'none')
  useEffect(() => {
    if (idleLevel && idleLevel !== 'none') {
      posthog?.capture?.('edu_chat_idle_level', { level: idleLevel });
    }
  }, [idleLevel]);

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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
    scrollToBottom();
    }, 100); // Pequeno delay para garantir que o DOM seja atualizado
    
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  // Garantir que o scroll container seja focalizável
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      
      // Definir propriedades para garantir que o scroll funcione
      container.style.scrollBehavior = 'smooth';
      container.style.overflowY = 'auto';
      container.style.overscrollBehavior = 'contain';
      
      // Garantir que o container possa receber eventos
      container.addEventListener('wheel', (e) => {
        e.stopPropagation();
      });
      
      // Focar no container para permitir scroll com teclado
      container.focus();
    }
  }, []);

  // Detectar scroll manual do usuário
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let userScrolling = false;

    const handleScroll = () => {
      userScrolling = true;
      
      // Detectar se o usuário está fazendo scroll manual
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      
      // Se o usuário fez scroll para cima, alterar o comportamento do scroll
      if (!isAtBottom) {
        scrollContainer.style.scrollBehavior = 'auto';
      } else {
        scrollContainer.style.scrollBehavior = 'smooth';
      }
      
      // Reset da flag após um período
      setTimeout(() => {
        userScrolling = false;
      }, 150);
    };

    const handleWheel = (e: WheelEvent) => {
      // Garantir que o evento de scroll seja processado normalmente
      e.stopPropagation();
      userScrolling = true;
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    scrollContainer.addEventListener('wheel', handleWheel);
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

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
    idleStartRef.current = Date.now();
    
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
    // if was idle, emit idle_to_active
    if (isUserIdle && idleStartRef.current) {
      const idleMs = Date.now() - idleStartRef.current;
      posthog?.capture?.('edu_idle_to_active', { idleMs });
      idleStartRef.current = null;
    }
    resetIdleTimer();
    setLastInteractionTime(new Date());
  };

  const [sessionId, setSessionId] = useState<string>("");

  // On mount, try to restore session from sessionStorage
  useEffect(() => {
    const loadMethodologies = async () => {
      try {
        setIsLoading(true);
        const methodologies = await fetchMethodologies();
        
        if (methodologies && methodologies.length > 0) {
          setAvailableMethodologies(methodologies);
          console.log("Available methodologies loaded:", methodologies);
          
          // Set default methodology to Worked Example if available
          const workedExample = methodologies.find(m => 
            m.name.toLowerCase().includes("worked") || 
            m.id === "worked_example"
          );
          
          if (workedExample) {
            setMethodology(workedExample.id);
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
    
    // AGNO está sempre disponível
    console.log("✅ Sistema AGNO ativado com metodologias educacionais avançadas");
    
    // Inicializar timer idle
    resetIdleTimer();
    
    // Event listeners para detectar atividade do usuário
    const handleUserActivity = () => {
      handleUserInteraction();
    };
    
    // Detectar movimento do mouse, cliques, rolagem e digitação
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });
    
    // Cleanup
    return () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      
      // Remover event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, []);

  useEffect(() => {
    const initializeSession = async () => {
      const lastSessionId = sessionStorage.getItem("coderbot_last_chat_session");
      
      if (lastSessionId) {
        // Try to load the last session
        try {
          await handleSessionChange(lastSessionId);
        } catch (error) {
          console.error("Error loading last session:", error);
          // If loading fails, create a new session
          await createNewSession();
        }
      } else {
        // No session found, create a new one
        await createNewSession();
      }
    };

    const createNewSession = async () => {
      try {
        const newSessionId = await chatService.createSession();
        setSessionId(newSessionId);
        sessionStorage.setItem("coderbot_last_chat_session", newSessionId);
        
        trackEvent('edu_chat_session_created', { sessionId: newSessionId });
        
        console.log("New session created:", newSessionId); // Debug log
      } catch (error) {
        console.error("Error creating new chat session:", error);
        toast.error("Error creating chat session");
      }
    };

    initializeSession();
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
      
      trackEvent('edu_chat_session_loaded', { sessionId: newSessionId, numMessages: sessionMessages?.length ?? 0 });
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
      trackEvent('edu_chat_session_created', { sessionId: newSessionId, source: 'manual' });
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
    console.log("handleSendMessage called with:", input, "sessionId:", sessionId); // Debug log
    
    if (!input.trim()) {
      console.log("Input is empty, returning");
      return;
    }
    
    if (!sessionId) {
      console.log("No sessionId, returning");
      return;
    }
    
    // Se ainda está mostrando boas-vindas, completar primeiro
    if (showWelcomeMessages) {
      await handleWelcomeComplete();
      // Aguardar um pouco para a transição
      setTimeout(() => {
        processMessage(input);
      }, 500);
      return;
    }
    
    processMessage(input);
  };

  const processMessage = async (input: string) => {
    console.log("Processing message:", input); // Debug log
    
    // Reset idle quando usuário envia mensagem
    handleUserInteraction();
    
    // Sistema emocional inspirado no Duolingo
    const now = new Date();
    
    // Track sent event & latency start
    const startTs = Date.now();
    let chosenProvider: string = 'claude';
    let chosenModel: string = aiModel;
    posthog?.capture?.('edu_chat_message_sent', {
      length: input.length,
      sessionId,
      model: aiModel,
      methodology: agnoMethodology,
      diagramsEnabled,
      analogiesEnabled,
    });
    
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

    // Temp AI message id needs outer scope to be accessible in catch/finally
    const tempId = (Date.now() + 1).toString();

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

      // Sempre usar AGNO (que está funcionando perfeitamente)
      let response;
      let lastResponseLength = 0;
      
      try {
        const userIdStr = typeof userId === 'string' ? userId : (userId ? JSON.stringify(userId) : "anonymous");
        const userContext = {
          userId: userIdStr,
          currentTopic: "", // Pode ser extraído do contexto
          difficultyLevel: userProfile.difficulty_level || "medium",
          learningProgress: userProfile.learning_progress || {},
          quizStats: {
            correctCount: quizCorrectCount,
            wrongCount: quizWrongCount,
            accuracy: (quizCorrectCount + quizWrongCount) > 0 ? quizCorrectCount / (quizCorrectCount + quizWrongCount) : 0,
            lastAnswer: lastQuizAnswer ? { correct: lastQuizAnswer.correct, question: lastQuizAnswer.question } : null,
          },
          previousInteractions: messages
            .filter(msg => !msg.isAi)
            .map(msg => msg.content)
            .slice(-5) // Últimas 5 interações
        };

        // If last was wrong, mark remediation shown
        if (lastQuizAnswer && lastQuizAnswer.correct === false) {
          const qid = simpleHash(lastQuizAnswer.question || '');
          posthog?.capture?.('edu_remediation_shown', { questionId: qid });
        }

        // Build context prompt influence when last answer was wrong
        const extraContext = lastQuizAnswer && lastQuizAnswer.correct === false
          ? `\nO aluno errou a questão anterior. Explique claramente o porquê do erro e como chegar na resposta correta. Pergunta: ${lastQuizAnswer.question}.`
          : '';

        // Definir provedor baseado no modelo selecionado
        let provider: 'claude' | 'openai' = 'claude';
        let modelId = aiModel;
        
        if (aiModel.includes('gpt')) {
          provider = 'openai';
        } else if (aiModel.includes('claude')) {
          provider = 'claude';
          // Mapear modelos do frontend para IDs corretos do backend
          if (aiModel === 'claude-3-sonnet') {
            modelId = 'claude-3-5-sonnet-20241022';
          } else if (aiModel === 'claude-3-haiku') {
            modelId = 'claude-3-haiku-20240307';
          }
        }

        // Save chosen mapping for analytics
        chosenProvider = provider;
        chosenModel = modelId;

        const agnoResponse = await agnoService.askQuestion({
          methodology: agnoMethodology,
          userQuery: input,
          context: (whiteboardContext ? JSON.stringify(whiteboardContext) : `Contexto: ${knowledgeBase || 'Aprendizado geral de programação'}`) + extraContext,
          userContext,
          provider,
          modelId,
          includeFinalCode: true,
          includeDiagram: diagramsEnabled,
          diagramType: diagramType,
          maxFinalCodeLines
        });
        
        // Verifica se o backend retornou segmentos estruturados
        const segments = ((agnoResponse as any)?.segments || []) as ResponseSegment[];
        const hasSegments = Array.isArray(segments) && segments.length > 0;
        
        if (hasSegments) {
          // Primeiro segmento vira a resposta inicial
          const [firstSeg, ...restSegs] = segments;
          setPendingSegments(restSegs);
          setSegmentMessageIds([]);
          lastResponseLength = (firstSeg?.content || '').length;

          // Salva mensagem de IA somente com o primeiro segmento
          const aiMsgId = await chatService.saveMessage({
            content: formatSegmentContent(firstSeg),
            isAi: true,
            sessionId,
          });

          // Atualiza a mensagem temporária de IA com conteúdo real + id real
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? { ...msg, id: aiMsgId, content: formatSegmentContent(firstSeg), timestamp: new Date() } 
                : msg
            )
          );

          // Registrar ID da primeira etapa
          setSegmentMessageIds(prev => [...prev, aiMsgId]);

          // Analytics específico para segmentos
          trackEvent('edu_chat_segments_received', {
            sessionId,
            totalSegments: segments.length,
            provider: chosenProvider,
            model: chosenModel,
          });
        } else {
          // Fallback: comportamento anterior (mensagem completa)
          response = {
            content: agnoResponse.response,
            analogies: ""
          };
          lastResponseLength = (response.content || '').length;
          
          // Save AI response (completa)
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
        }
        
        console.log(`✅ AGNO resposta recebida usando ${provider}/${modelId}: ${lastResponseLength} caracteres`);
        
      } catch (error) {
        // Analytics: failure in AGNO path (no sensitive data)
        trackEvent('edu_chat_response_failed', {
          kind: 'agno',
          sessionId,
          model: chosenModel,
          provider: chosenProvider,
          methodology: agnoMethodology,
          latencyMs: Date.now() - startTs,
        });
        console.error("Erro crítico no sistema AGNO:", error);
        toast.error("Erro no sistema educacional. Verifique a conexão.");
        
        // Em caso de erro crítico, mostrar mensagem de erro amigável
        response = {
          content: `Desculpe, houve um problema temporário no sistema educacional. 
          
Você perguntou: "${input}"

Por favor, tente novamente em alguns instantes. Se o problema persistir, recarregue a página.

Obrigado pela paciência! 🤖✨`,
          analogies: ""
        };
        lastResponseLength = (response.content || '').length;
      }
      
      // Analytics: response received (genérico)
      trackEvent('edu_chat_response_received', {
        sessionId,
        responseLength: lastResponseLength,
        latencyMs: Date.now() - startTs,
        model: chosenModel,
        provider: chosenProvider,
        methodology: agnoMethodology,
      });
    } catch (error) {
      console.error("Error processing message:", error);
      toast.error("Error processing message. Please try again.");
      
      // Analytics: generic failure
      trackEvent('edu_chat_response_failed', {
        kind: 'generic',
        sessionId,
        model: chosenModel,
        provider: chosenProvider,
        methodology: agnoMethodology,
        latencyMs: Date.now() - startTs,
      });
      
      // Remove only the temporary AI message that was added for loading
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  // Avançar para o próximo segmento, criando uma nova mensagem de IA
  const handleNextSegment = async () => {
    if (!sessionId) return;
    if (!pendingSegments || pendingSegments.length === 0) return;
    const [nextSeg, ...rest] = pendingSegments;
    setPendingSegments(rest);

    // Adiciona mensagem temporária para UX consistente
    const tempSegId = (Date.now() + Math.random()).toString();
    setMessages(prev => [
      ...prev,
      {
        id: tempSegId,
        content: formatSegmentContent(nextSeg),
        isAi: true,
        timestamp: new Date(),
      }
    ]);

    try {
      const savedId = await chatService.saveMessage({
        content: formatSegmentContent(nextSeg),
        isAi: true,
        sessionId,
      });
      setMessages(prev => prev.map(m => m.id === tempSegId ? { ...m, id: savedId } : m));
      setSegmentMessageIds(prev => [...prev, savedId]);
      trackEvent('edu_chat_segment_advanced', { sessionId, segmentType: nextSeg.type, remaining: rest.length });
      scrollToBottom();
    } catch (e) {
      console.error('Erro ao salvar segmento:', e);
      toast.error('Não foi possível salvar a etapa.');
    }
  };

  // Voltar para o segmento anterior (apenas rola até a mensagem anterior)
  const handlePrevSegment = () => {
    if (segmentMessageIds.length <= 1) return;
    const prevId = segmentMessageIds[segmentMessageIds.length - 2];
    const el = document.getElementById(`msg-${prevId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="relative flex h-full w-full">
      {/* Sidebar */}
      {showSidebar && (
        <div className={cn(
          "border-r bg-background/50 backdrop-blur-sm transition-all duration-300",
          isMobile ? "absolute left-0 top-0 z-50 h-full w-80 shadow-lg" : "w-80 flex-shrink-0"
        )}>
          <SessionSidebar
            currentSessionId={sessionId}
            onSessionChange={handleSessionChange}
            onNewSession={handleNewSession}
          />
        </div>
      )}
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        {/* Header sempre visível */}
      <div className="px-4 py-3 border-b shrink-0 sticky top-0 z-40 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center gap-2">
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
                   "Sistema educacional adaptativo ativo ✨"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0 relative">
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="claude-3-sonnet">Claude 3.5 Sonnet</SelectItem>
                <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Seletor de metodologia educacional AGNO */}
            <Select value={agnoMethodology} onValueChange={(value) => setAgnoMethodology(value as MethodologyType)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Metodologia" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MethodologyType).map((methodology) => {
                  const config = METHODOLOGY_CONFIG[methodology];
                  return (
                    <SelectItem key={methodology} value={methodology}>
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span>{config.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
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
            {/* Toggle de Diagramas */}
            <div className="relative">
              <button
                type="button"
                aria-label={diagramsEnabled ? "Desativar diagramas" : "Ativar diagramas"}
                title={diagramsEnabled ? "Diagramas ativados" : "Diagramas desativados"}
                onClick={() => setDiagramsEnabled((v) => !v)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  diagramsEnabled
                    ? "bg-[hsl(var(--education-purple)/0.12)] text-[hsl(var(--education-purple))] border-[hsl(var(--education-purple))]"
                    : "bg-white text-gray-500 hover:text-[hsl(var(--education-purple))] hover:border-[hsl(var(--education-purple))]"
                )}
                tabIndex={0}
                style={{ minHeight: 28 }}
              >
                <Sparkles className="h-4 w-4" />
                <span>Diagramas</span>
              </button>
            </div>
            {diagramsEnabled && (
              <Select value={diagramType} onValueChange={(v) => setDiagramType(v as any)}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mermaid">Mermaid</SelectItem>
                  <SelectItem value="excalidraw">Excalidraw</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
      {/* Área de mensagens com scroll */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 bg-gradient-to-b from-purple-50/30 to-transparent dark:from-purple-900/10" 
        style={{ 
          height: 0,
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
        tabIndex={0}
      >
        <div className="flex flex-col space-y-6 max-w-3xl mx-auto py-6">
          {/* Header com progresso e streak - inspirado no Duolingo */}
         

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

          {/* Regular Chat Messages (wrap com id p/ scroll) */}
          {!showWelcomeMessages && messages.map((message) => (
            <div key={message.id} id={`msg-${message.id}`}>
              <ChatMessage
                content={message.content}
                isAi={message.isAi}
                timestamp={message.timestamp}
                onQuizAnswer={handleQuizAnswer}
              />
            </div>
          ))}
          
          {/* IdleState - Aparecer quando usuário estiver idle (mas não em nível 'none') */}
          {isUserIdle && !isLoading && idleLevel !== 'none' && !showWelcomeMessages && (
            <IdleState 
              onSuggestedQuestion={handleSendMessage}
              idleLevel={idleLevel}
            />
          )}
          
          {isLoading && (
            <EmotionalLoadingIndicator messages={loadingMessages} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Input fixo no rodapé */}
      <div className={cn(
        "border-t p-4 backdrop-blur shrink-0 bg-background/70 supports-[backdrop-filter]:bg-background/60 sticky bottom-0",
        isMobile ? "pb-6" : ""
      )}>
        {/* Barra de avanço de etapas (quando há segmentos pendentes) */}
        {(pendingSegments.length > 0 || segmentMessageIds.length > 1) && !isLoading && !showWelcomeMessages && (
          <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between rounded-xl border bg-background/90 shadow-sm px-3 py-2">
            <div className="text-xs text-muted-foreground">
              Etapas restantes: {pendingSegments.length}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handlePrevSegment} disabled={segmentMessageIds.length <= 1} className="h-8">
                Voltar etapa
              </Button>
              {pendingSegments.length > 0 && (
                <Button size="sm" onClick={handleNextSegment} className="h-8">
                  {getNextStepButtonLabel()}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto rounded-2xl border bg-background/90 shadow-sm p-2">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            analogiesEnabled={analogiesEnabled}
          />
        </div>
      </div>
      
      {/* Confetti celebration - inspirado no Duolingo */}
      {/* {showConfetti && (
        <ConfettiExplosion onComplete={() => setShowConfetti(false)} />
      )} */}
      
      {/* Feedback de conquista */}
      {/* {showAchievement && (
        <AchievementFeedback 
          message={achievementMessage}
          onClose={() => setShowAchievement(false)} 
        />
      )} */}
      </div>
    </div>
  );
};
