import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  analogiesEnabled: boolean;
}

export const ChatInput = ({ onSendMessage, isLoading, analogiesEnabled }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input);
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Digite sua pergunta..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isLoading}
        className={cn(
          "flex-1 transition-all duration-200 bg-white/80 border-2 border-transparent focus:border-[hsl(var(--education-purple))] focus:ring-2 focus:ring-[hsl(var(--education-purple))] rounded-xl shadow-sm text-base placeholder:text-gray-400",
          analogiesEnabled && "border-[hsl(var(--education-purple))] focus:ring-[hsl(var(--education-purple))]"
        )}
        aria-label="Mensagem"
      />
      <Button 
        type="submit" 
        disabled={isLoading || !input.trim()} 
        aria-label="Enviar"
        className={cn(
          "transition-all duration-200 bg-[hsl(var(--education-purple))] hover:bg-[hsl(var(--education-purple-dark))] text-white rounded-xl shadow-md px-5 py-2 text-base font-semibold",
          analogiesEnabled && "bg-[hsl(var(--education-purple-dark))]"
        )}
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};
