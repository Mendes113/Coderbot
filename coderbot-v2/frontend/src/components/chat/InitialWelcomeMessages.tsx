import { useState, useEffect, useRef, useMemo } from "react";
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
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [fastMode, setFastMode] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Refs para timers e intervalos -> evita leaks/re-renders desnecessários
  const delayTimerRef = useRef<number | null>(null);
  const typingIntervalRef = useRef<number | null>(null);
  const postMessageTimerRef = useRef<number | null>(null);

  // Timestamp estável para a "hora" da mensagem
  const messageTimestamp = useMemo(
    () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    []
  );

  // Mostrar botão skip cedo
  useEffect(() => {
    const t = window.setTimeout(() => setShowSkipButton(true), 800);
    return () => window.clearTimeout(t);
  }, []);

  const clearTimers = () => {
    if (delayTimerRef.current) window.clearTimeout(delayTimerRef.current);
    if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
    if (postMessageTimerRef.current) window.clearTimeout(postMessageTimerRef.current);
    delayTimerRef.current = null;
    typingIntervalRef.current = null;
    postMessageTimerRef.current = null;
  };

  const handleMessageClick = () => {
    if (!fastMode) setFastMode(true);
  };

  useEffect(() => {
    if (currentMessageIndex >= WELCOME_MESSAGES.length) {
      setAnimationComplete(true);
      const end = window.setTimeout(() => onComplete?.(), 600);
      return () => window.clearTimeout(end);
    }

    const currentMessage = WELCOME_MESSAGES[currentMessageIndex];
    const baseDelay = currentMessage.delay ?? 500;

    clearTimers();
    setDisplayedText("");
    setIsTyping(false);

    delayTimerRef.current = window.setTimeout(() => {
      setIsTyping(true);
      const text = currentMessage.content;
      const speed = currentMessage.typingSpeed ?? 30;
      const chosenSpeed = fastMode ? Math.max(8, Math.floor(speed / 2)) : speed;
      let charIndex = 0;

      typingIntervalRef.current = window.setInterval(() => {
        charIndex += 1;
        setDisplayedText(text.slice(0, charIndex));
        if (charIndex >= text.length) {
          if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
          setIsTyping(false);
          postMessageTimerRef.current = window.setTimeout(() => {
            setCurrentMessageIndex((prev) => prev + 1);
          }, fastMode ? 250 : 450);
        }
      }, chosenSpeed) as unknown as number;
    }, fastMode ? Math.max(60, Math.floor(baseDelay / 3)) : baseDelay) as unknown as number;

    return () => {
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMessageIndex, fastMode]);

  const getEmotionStyling = (emotion?: string) => {
    // Estilo alinhado ao tema escuro com acentos roxos
    switch (emotion) {
      case 'welcoming':
        return {
          containerClass: "border border-coderbot-purple/30 bg-coderbot-purple/10",
          iconClass: "text-coderbot-purple bg-coderbot-purple/20",
          textClass: "text-[#E6E6E6]",
        };
      case 'encouraging':
        return {
          containerClass: "border border-emerald-400/25 bg-emerald-400/10",
          iconClass: "text-emerald-400 bg-emerald-400/20",
          textClass: "text-[#E6F6EF]",
        };
      case 'inspiring':
        return {
          containerClass: "border border-amber-400/25 bg-amber-400/10",
          iconClass: "text-amber-400 bg-amber-400/20",
          textClass: "text-[#FFF7E6]",
        };
      case 'friendly':
        return {
          containerClass: "border border-sky-400/25 bg-sky-400/10",
          iconClass: "text-sky-400 bg-sky-400/20",
          textClass: "text-[#E6F2FF]",
        };
      default:
        return {
          containerClass: "border border-border/60 bg-muted/20",
          iconClass: "text-muted-foreground bg-muted/30",
          textClass: "text-foreground",
        };
    }
  };

  const currentMessage = WELCOME_MESSAGES[currentMessageIndex];
  const styling = getEmotionStyling(currentMessage?.emotion);
  const IconComponent = currentMessage?.icon || Bot;

  const handleSkip = () => {
    clearTimers();
    setCurrentMessageIndex(WELCOME_MESSAGES.length);
    setAnimationComplete(true);
    onSkip?.();
  };

  if (animationComplete) return null;

  return (
    <div className="relative select-none" onClick={handleMessageClick}>
      {/* Skip Button */}
      {showSkipButton && !animationComplete && (
        <div className={cn("absolute top-2 right-2 z-10 transition-all duration-500", showSkipButton ? "opacity-100 scale-100" : "opacity-0 scale-95")}>
          <button
            onClick={handleSkip}
            className="group flex items-center gap-1 text-xs text-[#9BA3AF] hover:text-foreground bg-background/70 hover:bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border border-border/60 transition-all duration-200 hover:scale-105"
          >
            <span>Pular</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Welcome Message */}
      <div className={cn("transform transition-all duration-700 ease-out", isTyping ? "opacity-100 translate-y-0 scale-100" : "opacity-100 translate-y-0 scale-100")}> 
        {currentMessage && (
          <div className={cn("flex items-start space-x-3 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300", styling.containerClass)}>
            {/* Avatar com ícone */}
            <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300", styling.iconClass, isTyping ? "animate-pulse" : "")}> 
              <IconComponent className="w-4 h-4" />
            </div>

            {/* Conteúdo da mensagem */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-1">
                <span className="text-sm font-semibold text-foreground/90">CodeBot</span>
                <div className="ml-auto text-xs text-muted-foreground/80">{messageTimestamp}</div>
              </div>
              <div className="relative">
                <p className={cn("text-sm leading-relaxed transition-colors duration-300", styling.textClass)}>
                  {displayedText}
                  {isTyping && <span className="inline-block w-0.5 h-4 bg-current ml-1 animate-pulse" />}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Indicator */}
      <div className="flex justify-center mt-3 space-x-1.5">
        {WELCOME_MESSAGES.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              index < currentMessageIndex
                ? "bg-coderbot-purple/80 scale-110"
                : index === currentMessageIndex
                ? "bg-coderbot-purple/40 animate-pulse scale-125"
                : "bg-muted/40 scale-100"
            )}
          />
        ))}
      </div>

      {/* Overlay sutil durante digitação */}
      <div className={cn("absolute inset-0 pointer-events-none transition-opacity duration-700", isTyping ? "opacity-5" : "opacity-0")}> 
        <div className="absolute inset-0 bg-gradient-to-r from-coderbot-purple/20 via-transparent to-transparent rounded-2xl" />
      </div>
    </div>
  );
};
