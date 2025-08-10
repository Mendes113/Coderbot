import { useEffect, useState } from "react";
import { Brain, Sparkles, Lightbulb, Search, BookOpen } from "lucide-react";

interface TypingIndicatorProps {
  messages: string[];
  className?: string;
}

export const TypingIndicator = ({ messages, className = "" }: TypingIndicatorProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTyping) {
      const currentMessage = messages[currentMessageIndex];
      let charIndex = 0;
      
      interval = setInterval(() => {
        if (charIndex < currentMessage.length) {
          setDisplayedText(currentMessage.substring(0, charIndex + 1));
          charIndex++;
        } else {
          // Finished typing current message, wait a bit then switch
          setTimeout(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
            setDisplayedText("");
          }, 1500);
          setIsTyping(false);
        }
      }, 50); // Typing speed
    } else {
      // Reset typing for next message
      setTimeout(() => {
        setIsTyping(true);
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentMessageIndex, messages, isTyping]);

  const getIcon = () => {
    const message = messages[currentMessageIndex]?.toLowerCase() || "";
    
    if (message.includes("analisando") || message.includes("verificando")) {
      return <Search className="w-5 h-5 text-blue-400 animate-spin" />;
    } else if (message.includes("organizando") || message.includes("preparando")) {
      return <BookOpen className="w-5 h-5 text-purple-400 animate-pulse" />;
    } else if (message.includes("ideia") || message.includes("forma")) {
      return <Lightbulb className="w-5 h-5 text-yellow-400 animate-bounce" />;
    } else if (message.includes("especial") || message.includes("incrível")) {
      return <Sparkles className="w-5 h-5 text-pink-400 animate-spin" />;
    } else {
      return <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />;
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-h-[1.5rem]">
        <p className="text-sm text-gray-600 font-medium">
          {displayedText}
          <span className="animate-pulse">|</span>
        </p>
      </div>
      
      {/* Enhanced typing dots */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};
