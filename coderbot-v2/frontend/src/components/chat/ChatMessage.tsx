import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

type ChatMessageProps = {
  content: string;
  isAi: boolean;
  timestamp: Date;
};

export const ChatMessage = ({ content, isAi, timestamp }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "py-4 px-4 rounded-2xl mb-2 shadow-sm transition-all duration-200 border",
        isAi
          ? "bg-[hsl(var(--education-bot-bg))] border-[hsl(var(--education-purple-dark))] text-white"
          : "bg-[hsl(var(--education-user-bg))] border-[hsl(var(--education-user-dark))] text-gray-900"
      )}
    >
      <div className="flex items-center mb-2">
        <div
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center shadow-md border-2",
            isAi
              ? "bg-[hsl(var(--education-purple))] border-[hsl(var(--education-purple-dark))]"
              : "bg-[hsl(var(--education-user))] border-[hsl(var(--education-user-dark))]"
          )}
        >
          {isAi ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-gray-800" />}
        </div>
        <span className={cn("ml-2 font-semibold text-sm", isAi ? "text-white" : "text-gray-900")}>{isAi ? "Assistente IA" : "Você"}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="ml-10">
        <div className={cn("text-base whitespace-pre-wrap leading-relaxed", isAi ? "text-white" : "text-gray-900")}>{content}</div>
      </div>
    </div>
  );
};
