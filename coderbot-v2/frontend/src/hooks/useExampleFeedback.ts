import { useState, useCallback } from 'react';

interface ExampleFeedbackState {
  [exampleId: string]: 'up' | 'down' | null;
}

export function useExampleFeedback() {
  const [feedbackState, setFeedbackState] = useState<ExampleFeedbackState>({});

  const submitFeedback = useCallback(async (
    exampleId: string,
    vote: 'up' | 'down',
    feedbackType: string = 'helpful',
    comment?: string
  ) => {
    try {
      const response = await fetch(`/api/agno/examples/${exampleId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vote,
          feedback_type: feedbackType,
          comment,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao enviar feedback');
      }

      const result = await response.json();
      
      // Atualizar estado local
      setFeedbackState(prev => ({
        ...prev,
        [exampleId]: vote
      }));

      return result;
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      throw error;
    }
  }, []);

  const getFeedback = useCallback((exampleId: string) => {
    return feedbackState[exampleId] || null;
  }, [feedbackState]);

  const clearFeedback = useCallback((exampleId: string) => {
    setFeedbackState(prev => {
      const newState = { ...prev };
      delete newState[exampleId];
      return newState;
    });
  }, []);

  return {
    feedbackState,
    submitFeedback,
    getFeedback,
    clearFeedback,
  };
}
