import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SegmentFeedbackProps {
  exampleId: string;
  segmentType: string;
  onFeedbackSubmit?: (exampleId: string, vote: 'up' | 'down') => void;
  className?: string;
}

/**
 * Componente de feedback para exemplos educacionais gerados pelo AGNO.
 * Permite que alunos votem em exemplos como úteis ou não úteis.
 */
export function SegmentFeedback({ 
  exampleId, 
  segmentType,
  onFeedbackSubmit,
  className 
}: SegmentFeedbackProps) {
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (vote: 'up' | 'down') => {
    if (userVote !== null || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Chamar API de feedback
      const response = await fetch(`/api/agno/examples/${exampleId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vote,
          feedback_type: vote === 'up' ? 'helpful' : 'not_helpful',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Se já votou, mostrar mensagem específica
        if (error.data?.status === 'already_voted') {
          toast.info('Você já votou neste exemplo!');
          setUserVote(vote); // Simular voto para UI
          return;
        }
        
        throw new Error(error.detail || 'Erro ao enviar feedback');
      }

      const result = await response.json();
      
      setUserVote(vote);
      
      // Notificar sucesso
      toast.success(
        vote === 'up' 
          ? '👍 Obrigado! Este exemplo ajudará outros alunos.' 
          : '👎 Feedback registrado. Vamos melhorar!'
      );

      // Callback opcional
      if (onFeedbackSubmit) {
        onFeedbackSubmit(exampleId, vote);
      }

      // Analytics
      if ((window as any).posthog) {
        (window as any).posthog.capture('example_feedback', {
          example_id: exampleId,
          segment_type: segmentType,
          vote,
          quality_score: result.data?.quality_score,
        });
      }

    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast.error('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-2 pt-3 mt-3 border-t border-border/50",
      className
    )}>
      <span className="text-xs text-muted-foreground">
        Este exemplo foi útil?
      </span>
      
      <Button
        size="sm"
        variant={userVote === 'up' ? 'default' : 'outline'}
        onClick={() => handleFeedback('up')}
        disabled={userVote !== null || isSubmitting}
        className={cn(
          "h-7 px-2 gap-1 text-xs",
          userVote === 'up' && "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
        )}
      >
        <ThumbsUp className="h-3 w-3" />
        Sim
      </Button>
      
      <Button
        size="sm"
        variant={userVote === 'down' ? 'default' : 'outline'}
        onClick={() => handleFeedback('down')}
        disabled={userVote !== null || isSubmitting}
        className={cn(
          "h-7 px-2 gap-1 text-xs",
          userVote === 'down' && "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
        )}
      >
        <ThumbsDown className="h-3 w-3" />
        Não
      </Button>

      {userVote && (
        <span className="text-xs text-muted-foreground italic ml-2">
          Feedback registrado
        </span>
      )}
    </div>
  );
}
