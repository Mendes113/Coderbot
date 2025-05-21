import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  analogiesEnabled: boolean;
  setAnalogiesEnabled?: (enabled: boolean) => void;
}

export const ChatInput = ({ onSendMessage, isLoading, analogiesEnabled, setAnalogiesEnabled }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1 w-full">
      <input
        type="text"
        placeholder="Digite sua pergunta..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isLoading}
        aria-label="Mensagem"
        className={cn(
          "flex-1 bg-white text-gray-900 placeholder:text-gray-400 rounded-lg px-3 py-2 text-base border border-gray-200 focus:border-[hsl(var(--education-purple))] focus:ring-2 focus:ring-[hsl(var(--education-purple))] transition-all outline-none",
          isLoading && "opacity-60 cursor-not-allowed"
        )}
        style={{ minWidth: 0 }}
      />
      {typeof setAnalogiesEnabled === "function" && (
        <button
          type="button"
          aria-label={analogiesEnabled ? "Desativar analogias" : "Ativar analogias"}
          title={analogiesEnabled ? "Analogias ativadas" : "Analogias desativadas"}
          onClick={() => setAnalogiesEnabled(!analogiesEnabled)}
          className={cn(
            "ml-1 p-0.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border-none bg-transparent transition-colors",
            analogiesEnabled ? "text-[hsl(var(--education-purple))]" : "text-gray-400 hover:text-[hsl(var(--education-purple))]"
          )}
          tabIndex={0}
          style={{ minWidth: 28, minHeight: 28 }}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        aria-label="Enviar"
        className={cn(
          "ml-1 p-2 rounded-full bg-[hsl(var(--education-purple))] hover:bg-[hsl(var(--education-purple-dark))] text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--education-purple))] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center",
          "shadow-none border-none"
        )}
        style={{ minWidth: 40, minHeight: 40 }}
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
};
