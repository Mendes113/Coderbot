import React, { useState } from 'react';
import { User, Bot, Copy, ThumbsUp, ThumbsDown, Volume2, MoreVertical, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

interface MobileChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    metadata?: any;
  };
  isLoading?: boolean;
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
}

export const MobileChatMessage = ({
  message,
  isLoading = false,
  onFeedback
}: MobileChatMessageProps) => {
  const [showActions, setShowActions] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success('Mensagem copiada!');
    } catch (err) {
      toast.error('Erro ao copiar mensagem');
    }
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    onFeedback?.(message.id, type);
    toast.success(type === 'positive' ? 'Feedback positivo enviado!' : 'Feedback negativo enviado');
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    } else {
      toast.error('Síntese de voz não suportada neste dispositivo');
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Curtida removida' : 'Mensagem curtida!');
  };

  return (
    <div className={cn(
      "flex gap-3 p-4",
      message.role === 'user' ? "bg-slate-50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-900/50"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        message.role === 'user'
          ? "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
          : "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
      )}>
        {message.role === 'user' ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {message.role === 'user' ? 'Você' : 'CoderBot'}
            </span>
            <span className="text-xs text-slate-400">
              {message.timestamp.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          {/* Action Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </div>

        {/* Message Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className={cn(
            "text-sm leading-relaxed",
            isLoading && "animate-pulse"
          )}>
            {message.content}
          </div>
        </div>

        {/* Metadata badges for assistant messages */}
        {message.role === 'assistant' && message.metadata && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.metadata.model && (
              <Badge variant="outline" className="text-xs">
                {message.metadata.model}
              </Badge>
            )}
            {message.metadata.tokens && (
              <Badge variant="outline" className="text-xs">
                {message.metadata.tokens} tokens
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2 text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copiar
            </Button>

            {message.role === 'assistant' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSpeak}
                  className="h-8 px-2 text-xs"
                >
                  <Volume2 className="h-3 w-3 mr-1" />
                  Ouvir
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={cn(
                    "h-8 px-2 text-xs",
                    isLiked && "text-red-500 dark:text-red-400"
                  )}
                >
                  <Heart className={cn(
                    "h-3 w-3 mr-1",
                    isLiked && "fill-current"
                  )} />
                  Curtir
                </Button>
              </>
            )}

            {onFeedback && (
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedback('positive')}
                  className={cn(
                    "h-8 w-8 p-0",
                    feedback === 'positive' && "text-green-600 dark:text-green-400"
                  )}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedback('negative')}
                  className={cn(
                    "h-8 w-8 p-0",
                    feedback === 'negative' && "text-red-600 dark:text-red-400"
                  )}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
