/**
 * WorkedExamplesSlides - Componente para exibir Worked Examples como slides interativos
 *
 * Implementa a experiência de aprendizado passo-a-passo baseada em princípios científicos:
 * - Redução de carga cognitiva (um conceito por vez)
 * - Aprendizado ativo através de quiz interativos
 * - Reflexão guiada antes da solução
 * - Análise crítica de erros comuns
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, BookOpen, Code, AlertTriangle, HelpCircle, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { QuizInteraction } from "./QuizInteraction";
import { cn } from "@/lib/utils";
import type { QuizAnswerEvent } from "./ChatMessage";

interface WorkedExampleData {
  worked_example_segments: any;
  frontend_segments: Array<{
    id: string;
    title: string;
    type: string;
    content: string;
    language?: string;
  }>;
  validation: any;
  educational_guidance: string;
  methodology: string;
  topic: string;
  difficulty: string;
  scientific_basis: string[];
}

interface WorkedExamplesSlidesProps {
  workedExampleData: WorkedExampleData;
  currentSegmentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  onQuizAnswer: (event: QuizAnswerEvent) => void;
}

export const WorkedExamplesSlides: React.FC<WorkedExamplesSlidesProps> = ({
  workedExampleData,
  currentSegmentIndex,
  onNext,
  onPrev,
  onComplete,
  onQuizAnswer
}) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const currentSegment = workedExampleData.frontend_segments[currentSegmentIndex];
  const progress = ((currentSegmentIndex + 1) / workedExampleData.frontend_segments.length) * 100;

  // Determinar ícone baseado no tipo de segmento
  const getSegmentIcon = (type: string) => {
    switch (type) {
      case 'reflection': return <Brain className="w-6 h-6 text-purple-600" />;
      case 'steps': return <BookOpen className="w-6 h-6 text-blue-600" />;
      case 'correct_example': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'incorrect_example': return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case 'quiz': return <HelpCircle className="w-6 h-6 text-indigo-600" />;
      default: return <BookOpen className="w-6 h-6 text-gray-600" />;
    }
  };

  // Determinar cor baseada no tipo
  const getSegmentColor = (type: string) => {
    switch (type) {
      case 'reflection': return 'border-purple-200 bg-purple-50/50 dark:bg-purple-950/20';
      case 'steps': return 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20';
      case 'correct_example': return 'border-green-200 bg-green-50/50 dark:bg-green-950/20';
      case 'incorrect_example': return 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20';
      case 'quiz': return 'border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20';
      default: return 'border-gray-200 bg-gray-50/50 dark:bg-gray-950/20';
    }
  };

  // Renderizar conteúdo baseado no tipo de segmento
  const renderSegmentContent = () => {
    if (!currentSegment) return null;

    const isQuiz = currentSegment.type === 'quiz';
    const isCode = ['correct_example', 'incorrect_example'].includes(currentSegment.type);

    if (isQuiz) {
      return (
        <QuizInteraction
          content={currentSegment.content}
          onAnswer={onQuizAnswer}
          onComplete={() => setShowQuiz(true)}
        />
      );
    }

    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <div
          dangerouslySetInnerHTML={{
            __html: currentSegment.content.replace(/\n/g, '<br>')
          }}
          className={cn(
            "text-sm leading-relaxed",
            isCode && "font-mono text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border"
          )}
        />
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Cabeçalho com progresso */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getSegmentIcon(currentSegment?.type || '')}
              <div>
                <CardTitle className="text-lg">{currentSegment?.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {workedExampleData.topic} • {workedExampleData.methodology}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {currentSegmentIndex + 1} / {workedExampleData.frontend_segments.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo do segmento atual */}
      <Card className={cn(
        "border-2 transition-all duration-300",
        getSegmentColor(currentSegment?.type || '')
      )}>
        <CardContent className="p-6">
          {renderSegmentContent()}
        </CardContent>
      </Card>

      {/* Base científica (aparece apenas no primeiro segmento) */}
      {currentSegmentIndex === 0 && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-sm">Base Científica</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {workedExampleData.scientific_basis.map((basis, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-white/50">
                  {basis}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles de navegação */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onPrev}
              disabled={currentSegmentIndex === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>

            <div className="flex items-center gap-2">
              {workedExampleData.scientific_basis.map((basis, index) => (
                <div key={index} className="w-2 h-2 bg-purple-400 rounded-full" />
              ))}
            </div>

            {currentSegmentIndex < workedExampleData.frontend_segments.length - 1 ? (
              <Button
                onClick={onNext}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                Próxima etapa
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={onComplete}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                Concluir exemplo
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Indicadores visuais de progresso */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          {workedExampleData.frontend_segments.map((segment, index) => (
            <div
              key={segment.id}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                index === currentSegmentIndex
                  ? "bg-primary scale-125"
                  : index < currentSegmentIndex
                    ? "bg-green-500"
                    : "bg-gray-300"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
