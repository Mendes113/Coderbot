import { useState, useEffect } from "react";
import { Send, Sparkles, Heart, Smile, Zap, Star, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  analogiesEnabled: boolean;
  setAnalogiesEnabled?: (enabled: boolean) => void;
}

export const ChatInput = ({ onSendMessage, isLoading, analogiesEnabled, setAnalogiesEnabled }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [lastMessageSent, setLastMessageSent] = useState(false);
  const [encouragementType, setEncouragementType] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const encouragementMessages = [
    { icon: Heart, text: "Ótima pergunta! ✨", color: "from-purple-100 to-pink-100", animation: "animate-pulse" },
    { icon: Star, text: "Que curiosidade incrível! 🌟", color: "from-yellow-100 to-orange-100", animation: "animate-bounce" },
    { icon: ThumbsUp, text: "Você está indo bem! 👏", color: "from-green-100 to-blue-100", animation: "animate-wiggle" },
    { icon: Zap, text: "Pergunta poderosa! ⚡", color: "from-blue-100 to-purple-100", animation: "animate-pulse" }
  ];

  // Efeito de encorajamento quando o usuário para de digitar
  useEffect(() => {
    if (input.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        if (input.length > 10) {
          setEncouragementType(Math.floor(Math.random() * encouragementMessages.length));
          setShowEncouragement(true);
          setTimeout(() => setShowEncouragement(false), 2000);
        }
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [input, encouragementMessages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput("");
    setLastMessageSent(true);
    setShowCelebration(true);
    setTimeout(() => setLastMessageSent(false), 3000);
    setTimeout(() => setShowCelebration(false), 1000);
  };

  return (
    <div className="relative">
      {/* Indicador de encorajamento emotivo - Inspirado no Duolingo */}
      {showEncouragement && (
        <div className={`absolute -top-12 left-4 bg-gradient-to-r ${encouragementMessages[encouragementType].color} text-purple-700 text-sm px-3 py-2 rounded-full shadow-lg animate-bounce border border-purple-200 ${encouragementMessages[encouragementType].animation}`}>
          <div className="flex items-center gap-1">
            {(() => {
              const IconComponent = encouragementMessages[encouragementType].icon;
              return <IconComponent className="h-4 w-4" />;
            })()}
            <span>{encouragementMessages[encouragementType].text}</span>
          </div>
        </div>
      )}
      
      {/* Feedback após envio de mensagem */}
      {lastMessageSent && (
        <div className="absolute -top-10 right-4 bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full shadow-md animate-fade-in-scale border border-green-200">
          <div className="flex items-center gap-1">
            <Smile className="h-3 w-3" />
            <span>Enviado!</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-1 w-full relative">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={isLoading ? "Estou pensando..." : "Digite sua pergunta..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            disabled={isLoading}
            aria-label="Mensagem"
            className={cn(
              "w-full bg-white text-gray-900 placeholder:text-gray-400 rounded-lg px-3 py-2 text-base border transition-all duration-300 outline-none",
              isLoading ? "border-purple-200 opacity-60 cursor-not-allowed animate-pulse" : "border-gray-200",
              input.length > 0 && !isLoading ? "border-purple-300 ring-1 ring-purple-100 shadow-sm" : "",
              inputFocused ? "border-[hsl(var(--education-purple))] ring-2 ring-[hsl(var(--education-purple))] shadow-md transform scale-[1.02]" : "",
              "focus:border-[hsl(var(--education-purple))] focus:ring-2 focus:ring-[hsl(var(--education-purple))] focus:shadow-md",
              "hover:border-purple-200 hover:shadow-sm"
            )}
            style={{ minWidth: 0 }}
          />
          
          {/* Indicador de digitação sutil */}
          {isTyping && input.length > 5 && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
        </div>
        
        {typeof setAnalogiesEnabled === "function" && (
          <button
            type="button"
            aria-label={analogiesEnabled ? "Desativar analogias" : "Ativar analogias"}
            title={analogiesEnabled ? "Analogias ativadas - Aprendizado mais criativo!" : "Analogias desativadas"}
            onClick={() => setAnalogiesEnabled(!analogiesEnabled)}
            className={cn(
              "ml-1 p-0.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border-none bg-transparent transition-all duration-300",
              analogiesEnabled ? 
                "text-[hsl(var(--education-purple))] scale-110 drop-shadow-sm" : 
                "text-gray-400 hover:text-[hsl(var(--education-purple))] hover:scale-105"
            )}
            tabIndex={0}
            style={{ minWidth: 28, minHeight: 28 }}
          >
            <Sparkles className={cn(
              "h-4 w-4 transition-all duration-300",
              analogiesEnabled ? "animate-pulse" : ""
            )} aria-hidden="true" />
          </button>
        )}
        
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label={isLoading ? "Processando..." : "Enviar"}
          className={cn(
            "ml-1 p-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--education-purple))] flex items-center justify-center relative overflow-hidden",
            "shadow-none border-none group",
            isLoading ? 
              "bg-purple-200 cursor-not-allowed" : 
              input.trim() ? 
                "bg-[hsl(var(--education-purple))] hover:bg-[hsl(var(--education-purple-dark))] text-white hover:scale-105 hover:shadow-lg active:scale-95" :
                "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
          style={{ minWidth: 40, minHeight: 40 }}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Send className={cn(
                "h-5 w-5 transition-transform duration-200",
                input.trim() ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5" : ""
              )} />
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-200"></div>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
