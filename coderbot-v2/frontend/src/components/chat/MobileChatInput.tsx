import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Mic, MicOff, Plus, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface MobileChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export const MobileChatInput = ({
  onSendMessage,
  isLoading,
  placeholder = "Digite sua mensagem..."
}: MobileChatInputProps) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isMobile, orientation } = useMobileDetection();

  // Quick action suggestions for mobile
  const quickActions = [
    "Explique com exemplo",
    "Mostre código",
    "Crie exercício",
    "Dúvida sobre..."
  ];

  // Auto-resize textarea for mobile
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Auto-focus when not loading
  useEffect(() => {
    if (!isLoading && textareaRef.current && isMobile) {
      // Delay focus to avoid issues on mobile keyboards
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isLoading, isMobile]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    onSendMessage(input.trim());
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    setShowQuickActions(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording functionality
    if (!isRecording) {
      // Start recording
      console.log('Starting voice recording...');
    } else {
      // Stop recording
      console.log('Stopping voice recording...');
    }
  };

  return (
    <div className="border-t bg-background p-4">
      {/* Quick Actions Row */}
      {showQuickActions && (
        <div className="mb-3 flex flex-wrap gap-2">
          {quickActions.map((action, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(action)}
              className="h-8 text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              {action}
            </Button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="relative">
        <div className="relative flex items-end gap-2">
          {/* Quick Actions Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="h-10 w-10 shrink-0 p-0 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Textarea */}
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className={cn(
                "min-h-[44px] max-h-[120px] resize-none pr-12",
                "bg-slate-50 dark:bg-slate-800",
                "border-slate-200 dark:border-slate-700",
                "focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400",
                "placeholder:text-slate-400 dark:placeholder:text-slate-500"
              )}
              disabled={isLoading}
              rows={1}
            />

            {/* Character count for mobile */}
            {input.length > 100 && (
              <div className="absolute -top-6 right-0 text-xs text-slate-400">
                {input.length}/500
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1">
            {/* Voice Recording Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleRecording}
              className={cn(
                "h-10 w-10 p-0",
                isRecording
                  ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
                  : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
              )}
              disabled={isLoading}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

            {/* Send Button */}
            <Button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              size="sm"
              className={cn(
                "h-10 w-10 p-0",
                "bg-indigo-600 hover:bg-indigo-700 text-white",
                "disabled:bg-slate-300 dark:disabled:bg-slate-600"
              )}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile-specific hints */}
        {isMobile && orientation === 'portrait' && (
          <div className="mt-2 text-xs text-slate-400 text-center">
            Dica: Use Shift + Enter para nova linha
          </div>
        )}
      </div>
    </div>
  );
};
