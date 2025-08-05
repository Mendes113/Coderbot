import { useState, useEffect } from "react";
import { Bot, Sparkles, Heart, BookOpen, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InitialWelcomeMessagesProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

interface WelcomeMessage {
  content: string;
  icon?: React.ComponentType<any>;
  emotion?: 'welcoming' | 'encouraging' | 'inspiring' | 'friendly';
  delay?: number;
  typingSpeed?: number;
}

const WELCOME_MESSAGES: WelcomeMessage[] = [
  {
    content: "Olá! 👋 Eu sou o CodeBot, seu assistente educacional!",
    icon: Bot,
    emotion: 'welcoming',
    delay: 100,
    typingSpeed: 25,
  },
  {
    content: "Estou aqui para tornar seu aprendizado mais divertido e personalizado. ✨",
    icon: Sparkles,
    emotion: 'encouraging',
    delay: 300,
    typingSpeed: 20,
  },
  {
    content: "Você pode me fazer perguntas sobre programação, pedir explicações ou solicitar exemplos práticos! 💡",
    icon: Lightbulb,
    emotion: 'inspiring',
    delay: 350,
    typingSpeed: 15,
  },
  {
    content: "Que tal começarmos nossa jornada de conhecimento juntos? 🚀",
    icon: Heart,
    emotion: 'friendly',
    delay: 200,
    typingSpeed: 20,
  },
];

export const InitialWelcomeMessages = ({ onComplete, onSkip }: InitialWelcomeMessagesProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [fastMode, setFastMode] = useState(false);

  // Mostrar botão skip após 800ms (mais cedo ainda)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkipButton(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Acelerar quando usuário clica na área da mensagem
  const handleMessageClick = () => {
    if (!fastMode) {
      setFastMode(true);
    }
  };

  useEffect(() => {
    if (currentMessageIndex >= WELCOME_MESSAGES.length) {
      setAnimationComplete(true);
      setTimeout(() => {
        onComplete?.();
      }, 600); // Reduzido de 1000ms para 600ms
      return;
    }

    const currentMessage = WELCOME_MESSAGES[currentMessageIndex];
    
    // Delay antes de começar a mostrar a mensagem
    const delayTimer = setTimeout(() => {
      setShowMessage(true);
      setIsTyping(true);
      setDisplayedText("");
      
      // Efeito de digitação
      let charIndex = 0;
      const typingInterval = setInterval(() => {
        if (charIndex < currentMessage.content.length) {
          setDisplayedText(currentMessage.content.substring(0, charIndex + 1));
          charIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typingInterval);
          
          // Esperar um pouco antes da próxima mensagem (mais rápido)
          setTimeout(() => {
            setShowMessage(false);
            setTimeout(() => {
              setCurrentMessageIndex(prev => prev + 1);
            }, 150);
          }, fastMode ? 300 : 500);
        }
      }, currentMessage.typingSpeed || (fastMode ? 10 : 30));

      return () => clearInterval(typingInterval);
    }, currentMessage.delay || (fastMode ? 100 : 500));

    return () => clearTimeout(delayTimer);
  }, [currentMessageIndex, onComplete]);

  const getEmotionStyling = (emotion?: string) => {
    switch (emotion) {
      case 'welcoming':
        return {
          containerClass: "from-blue-50 to-indigo-50 border-blue-200",
          iconClass: "text-blue-500 bg-blue-100",
          textClass: "text-blue-900",
        };
      case 'encouraging':
        return {
          containerClass: "from-purple-50 to-pink-50 border-purple-200",
          iconClass: "text-purple-500 bg-purple-100",
          textClass: "text-purple-900",
        };
      case 'inspiring':
        return {
          containerClass: "from-yellow-50 to-orange-50 border-yellow-200",
          iconClass: "text-orange-500 bg-orange-100",
          textClass: "text-orange-900",
        };
      case 'friendly':
        return {
          containerClass: "from-green-50 to-emerald-50 border-green-200",
          iconClass: "text-green-500 bg-green-100",
          textClass: "text-green-900",
        };
      default:
        return {
          containerClass: "from-gray-50 to-slate-50 border-gray-200",
          iconClass: "text-gray-500 bg-gray-100",
          textClass: "text-gray-900",
        };
    }
  };

  const currentMessage = WELCOME_MESSAGES[currentMessageIndex];
  const styling = getEmotionStyling(currentMessage?.emotion);
  const IconComponent = currentMessage?.icon || Bot;

  const handleSkip = () => {
    setCurrentMessageIndex(WELCOME_MESSAGES.length);
    onSkip?.();
  };

  if (animationComplete) {
    return null;
  }

  return (
    <div className="relative">
      {/* Skip Button */}
      {showSkipButton && !animationComplete && (
        <div 
          className={cn(
            "absolute top-2 right-2 z-10 transition-all duration-500",
            showSkipButton ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
        >
          <button
            onClick={handleSkip}
            className="group flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:scale-105"
          >
            <span>Pular</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Welcome Message */}
      <div 
        className={cn(
          "transform transition-all duration-700 ease-out",
          showMessage 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-4 scale-95"
        )}
      >
        {currentMessage && (
          <div className={cn(
            "flex items-start space-x-3 p-4 rounded-2xl border bg-gradient-to-br shadow-sm hover:shadow-md transition-all duration-300",
            styling.containerClass
          )}>
            {/* Avatar com ícone animado */}
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
              styling.iconClass,
              isTyping ? "animate-pulse" : "animate-gentle-float"
            )}>
              <IconComponent className="w-4 h-4" />
            </div>

            {/* Conteúdo da mensagem */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-1">
                <span className="text-sm font-semibold text-gray-700">CodeBot</span>
                <div className="ml-auto text-xs text-gray-500">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              <div className="relative">
                <p className={cn(
                  "text-sm leading-relaxed transition-colors duration-300",
                  styling.textClass
                )}>
                  {displayedText}
                  {isTyping && (
                    <span className="inline-block w-0.5 h-5 bg-current ml-1 animate-pulse" />
                  )}
                </p>
                
                {/* Efeito de partículas sutis durante digitação */}
                {isTyping && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-2 h-2 bg-blue-300 rounded-full animate-ping opacity-30" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator discreto */}
      <div className="flex justify-center mt-4 space-x-1">
        {WELCOME_MESSAGES.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              index < currentMessageIndex 
                ? "bg-blue-500 scale-110" 
                : index === currentMessageIndex 
                  ? "bg-blue-300 animate-pulse scale-125" 
                  : "bg-gray-200 scale-100"
            )}
          />
        ))}
      </div>

      {/* Breathing animation overlay para toda a experiência */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-opacity duration-1000",
        isTyping ? "opacity-5" : "opacity-0"
      )}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 via-purple-200/20 to-pink-200/20 rounded-2xl animate-breathing" />
      </div>
    </div>
  );
};
