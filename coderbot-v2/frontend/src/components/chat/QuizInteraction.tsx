/**
 * QuizInteraction - Componente para quizzes interativos baseados em JSON estruturado
 *
 * Implementa quizzes educativos com:
 * - Múltiplas opções (até 5)
 * - Feedback imediato
 * - Explicações detalhadas
 * - Animações de celebração para respostas corretas
 * - Interface responsiva e acessível
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, HelpCircle, Sparkles, Trophy, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizAnswerEvent } from "./ChatMessage";
import confetti from 'canvas-confetti';

interface QuizOption {
  id: string;
  text: string;
  correct?: boolean;
  reason?: string;
}

interface QuizData {
  question: string;
  options: QuizOption[];
  explanation?: string;
}

interface QuizInteractionProps {
  content: string; // JSON string do quiz
  onAnswer: (event: QuizAnswerEvent) => void;
  onComplete?: () => void;
}

export const QuizInteraction: React.FC<QuizInteractionProps> = ({
  content,
  onAnswer,
  onComplete
}) => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Parsear conteúdo JSON do quiz
  useEffect(() => {
    try {
      // Tentar parsear diretamente (se já é JSON)
      let parsed = null;
      
      // Tentar extrair de bloco ```quiz
      const quizMatch = content.match(/```quiz\s*([\s\S]*?)```/);
      if (quizMatch) {
        parsed = JSON.parse(quizMatch[1].trim());
      } else {
        // Tentar parsear diretamente
        parsed = JSON.parse(content);
      }
      
      if (parsed) {
        console.log('Quiz parsed:', parsed);
        setQuizData(parsed);
      }
    } catch (error) {
      console.error('Erro ao parsear quiz JSON:', error);
      console.log('Content received:', content);
    }
  }, [content]);

  // Lidar com seleção de opção
  const handleOptionSelect = (optionId: string) => {
    if (showResult) return;

    setSelectedOption(optionId);
    const selectedOpt = quizData?.options.find(opt => opt.id === optionId);
    const correct = selectedOpt?.correct || false;
    setIsCorrect(correct);
    setShowResult(true);

    // Celebrar resposta correta
    if (correct) {
      setShowCelebration(true);

      // Confetti profissional
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#059669', '#047857', '#065F46']
      });

      // Auto-hide celebration após 3 segundos
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    }

    // Enviar evento para analytics
    const selectedOptionData = quizData?.options.find(opt => opt.id === optionId);
    onAnswer({
      question: quizData?.question || '',
      selectedOption: optionId,
      correct: correct,
      explanation: selectedOptionData?.reason || quizData?.explanation || '',
      timestamp: new Date()
    });

    // Chamar callback de conclusão se fornecido
    if (onComplete) {
      setTimeout(onComplete, 2000);
    }
  };

  if (!quizData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pergunta */}
      <Card className="border-2 border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-lg">Quiz de Verificação</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base font-medium leading-relaxed">
            {quizData.question}
          </p>
          {quizData.learning_outcome && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              🎯 {quizData.learning_outcome}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Opções */}
      <div className="grid gap-3">
        {quizData.options.map((option) => {
          const isSelected = selectedOption === option.id;
          const isCorrectOption = option.correct || false;
          const showCorrect = showResult && isCorrectOption;
          const showIncorrect = showResult && isSelected && !isCorrect;

          return (
            <Card
              key={option.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                "border-2",
                isSelected && !showResult && "border-primary bg-primary/5",
                showCorrect && "border-green-500 bg-green-50 dark:bg-green-950/20",
                showIncorrect && "border-red-500 bg-red-50 dark:bg-red-950/20",
                !isSelected && !showResult && "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => handleOptionSelect(option.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold",
                    isSelected && !showResult && "border-primary bg-primary text-primary-foreground",
                    showCorrect && "border-green-500 bg-green-500 text-white",
                    showIncorrect && "border-red-500 bg-red-500 text-white",
                    !isSelected && !showResult && "border-gray-300 text-gray-600"
                  )}>
                    {showCorrect ? <CheckCircle className="w-4 h-4" /> :
                     showIncorrect ? <XCircle className="w-4 h-4" /> :
                     option.id}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">
                      {option.text}
                    </p>

                    {/* Mostrar explicação após seleção */}
                    {showResult && isSelected && (
                      <div className={cn(
                        "mt-2 p-3 rounded-lg text-sm",
                        isCorrect
                          ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                      )}>
                        <p className={cn(
                          "font-medium",
                          isCorrect ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
                        )}>
                          {isCorrect ? "✅ Resposta correta!" : "❌ Resposta incorreta"}
                        </p>
                        {option.reason && (
                          <p className="text-muted-foreground mt-1">
                            {option.reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Indicadores visuais */}
                  {showCorrect && (
                    <div className="flex-shrink-0">
                      <Trophy className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                  {showIncorrect && (
                    <div className="flex-shrink-0">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Explicação geral (aparece após resposta) */}
      {showResult && quizData.explanation && (
        <Card className="border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  💡 Explicação
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  {quizData.explanation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Celebração para resposta correta */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <Card className="bg-gradient-to-br from-green-400 to-green-600 text-white shadow-2xl animate-bounce">
            <CardContent className="p-6 text-center">
              <div className="flex items-center gap-3">
                <PartyPopper className="w-8 h-8 animate-spin" />
                <div>
                  <p className="text-xl font-bold">Parabéns! 🎉</p>
                  <p className="text-sm opacity-90">Você acertou!</p>
                </div>
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Badge de progresso */}
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs">
          {showResult ? 'Quiz concluído' : `${quizData.options.length} opções disponíveis`}
        </Badge>
      </div>
    </div>
  );
};
