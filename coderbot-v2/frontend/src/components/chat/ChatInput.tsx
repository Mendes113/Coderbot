import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Heart, Smile, Zap, Star, ThumbsUp, Mic, MicOff, Bot, Command, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

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
  const [isRecording, setIsRecording] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  
  const encouragementMessages = [
    { icon: Heart, text: "Pergunta interessante! ✨", color: "from-purple-50 to-pink-50 border-purple-200", textColor: "text-purple-700", animation: "animate-pulse" },
    { icon: Star, text: "Ótima curiosidade! 🌟", color: "from-yellow-50 to-orange-50 border-yellow-200", textColor: "text-orange-700", animation: "animate-bounce" },
    { icon: ThumbsUp, text: "Você está indo bem! 👏", color: "from-green-50 to-emerald-50 border-green-200", textColor: "text-green-700", animation: "animate-wiggle" },
    { icon: Zap, text: "Pergunta inteligente! ⚡", color: "from-blue-50 to-indigo-50 border-blue-200", textColor: "text-blue-700", animation: "animate-pulse" }
  ];

  const smartSuggestions = [
    "Explique este conceito com worked example",
    "Mostre o código em Python com um exemplo",
    "Crie um quiz curto sobre esse tema",
    "Quais são as melhores práticas?"
  ];

  // Atalhos de teclado para melhor UX
  useKeyboardShortcuts({
    onFocus: () => inputRef.current?.focus(),
    onSubmit: () => {
      if (input.trim() && !isLoading) {
        handleSubmit(new Event('submit') as any);
      }
    },
    onEscape: () => {
      setInput("");
      setShowSmartSuggestions(false);
      setShowEncouragement(false);
    }
  });

  // Efeito de encorajamento quando o usuário para de digitar
  useEffect(() => {
    setCharCount(input.length);
    
    if (input.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        if (input.length > 15 && input.length < 100) {
          setEncouragementType(Math.floor(Math.random() * encouragementMessages.length));
          setShowEncouragement(true);
          setTimeout(() => setShowEncouragement(false), 3000);
        }
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
      setShowSmartSuggestions(true);
      setTimeout(() => setShowSmartSuggestions(false), 3000);
    }
  }, [input, encouragementMessages.length]);

  // Auto-foco inteligente
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input);
    setInput("");
    setCharCount(0);
    setLastMessageSent(true);
    setShowCelebration(true);
    
    if (inputRef.current) {
      inputRef.current.style.transform = 'scale(0.98)';
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.transform = 'scale(1)';
        }
      }, 100);
    }
    
    setTimeout(() => setLastMessageSent(false), 4000);
    setTimeout(() => setShowCelebration(false), 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSmartSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Sugestões inteligentes */}
      {showSmartSuggestions && !input && (
        <div className="absolute -top-16 left-0 right-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border border-gray-100 dark:border-neutral-800 rounded-xl p-3 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sugestões para começar:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {smartSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 border border-purple-200 dark:border-purple-900/40"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Indicador de encorajamento */}
      {showEncouragement && (
        <div className={`absolute -top-14 left-4 bg-gradient-to-r ${encouragementMessages[encouragementType].color} ${encouragementMessages[encouragementType].textColor} text-sm px-4 py-2.5 rounded-xl shadow-lg border ${encouragementMessages[encouragementType].animation} backdrop-blur-sm`}>
          <div className="flex items-center gap-2">
            {(() => {
              const IconComponent = encouragementMessages[encouragementType].icon;
              return <IconComponent className="h-4 w-4" />;
            })()}
            <span className="font-medium">{encouragementMessages[encouragementType].text}</span>
          </div>
          <div className={`absolute -bottom-1 left-6 w-2 h-2 bg-gradient-to-r ${encouragementMessages[encouragementType].color} transform rotate-45 border-r border-b border-opacity-20`}></div>
        </div>
      )}
      
      {lastMessageSent && (
        <div className="absolute -top-12 right-4 bg-green-50 dark:bg-emerald-900/20 text-green-700 dark:text-emerald-300 text-sm px-3 py-2 rounded-xl shadow-md animate-fade-in-scale border border-green-200 dark:border-emerald-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <Smile className="h-4 w-4" />
            <span className="font-medium">Mensagem enviada!</span>
          </div>
        </div>
      )}

      {/* Container principal do input */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-gray-200 dark:border-neutral-800 hover:border-purple-300 dark:hover:border-purple-800 transition-all duration-300 focus-within:border-purple-400 dark:focus-within:border-purple-700 focus-within:shadow-xl focus-within:ring-4 focus-within:ring-purple-100 dark:focus-within:ring-purple-900/30">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 p-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder={isLoading ? "CoderBot está pensando..." : "Como posso te ajudar hoje? (dica: peça 'mostre o código em Python')"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              disabled={isLoading}
              aria-label="Mensagem"
              className={cn(
                "w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 py-3 text-base outline-none transition-all duration-300",
                isLoading ? "opacity-60 cursor-not-allowed" : "",
                "placeholder:font-medium"
              )}
              style={{ minWidth: 0 }}
              maxLength={3500}
            />
            {charCount > 0 && (
              <div className="absolute right-4 bottom-1 text-xs text-gray-400 dark:text-gray-500 font-medium">
                {charCount}/500
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleRecording}
              aria-label={isRecording ? "Parar gravação" : "Gravar mensagem"}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-400",
                isRecording ? 
                  "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30 animate-pulse" : 
                  "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-purple-600"
              )}
            >
              {isRecording ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>

            {typeof setAnalogiesEnabled === "function" && (
              <button
                type="button"
                aria-label={analogiesEnabled ? "Desativar analogias" : "Ativar analogias"}
                title={analogiesEnabled ? "Analogias ativadas - Aprendizado mais criativo!" : "Ativar analogias para um aprendizado mais visual"}
                onClick={() => setAnalogiesEnabled(!analogiesEnabled)}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-400",
                  analogiesEnabled ? 
                    "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/30 ring-2 ring-purple-200 dark:ring-purple-900/30" : 
                    "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:text-purple-600"
                )}
              >
                <Sparkles className={cn(
                  "h-5 w-5 transition-all duration-300",
                  analogiesEnabled ? "animate-pulse" : ""
                )} />
              </button>
            )}

            {/* Dica de código */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
              <Code2 className="h-4 w-4" />
              <span>Peça: "mostre o código"</span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label={isLoading ? "Processando..." : "Enviar mensagem"}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-400 relative overflow-hidden group",
                isLoading ? 
                  "bg-purple-200 cursor-not-allowed" : 
                  input.trim() ? 
                    "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white hover:scale-105 hover:shadow-lg active:scale-95 shadow-md" :
                    "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    input.trim() ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5" : ""
                  )} />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-500 -skew-x-12"></div>
                </>
              )}
            </button>
          </div>
        </form>
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-neutral-800 rounded-b-2xl overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 animate-pulse"></div>
          </div>
        )}
      </div>

      {inputFocused && (
        <div className="absolute -bottom-8 right-0 flex items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>K para focar</span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>Enter para enviar</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Esc para limpar</span>
          </div>
        </div>
      )}
    </div>
  );
};
