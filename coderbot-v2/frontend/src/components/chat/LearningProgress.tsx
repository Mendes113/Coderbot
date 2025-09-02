import { cn } from "@/lib/utils";
import { Trophy, Star, Flame, Target, Heart, Brain, Zap, Gift } from "lucide-react";
import { useState, useEffect } from "react";

interface LearningProgressProps {
  totalQuestions: number;
  streakCount: number;
  unlockedBadges: string[];
  sessionMessagesCount: number;
  onCelebration?: () => void;
}

export const LearningProgress = ({ 
  totalQuestions, 
  streakCount, 
  unlockedBadges, 
  sessionMessagesCount,
  onCelebration 
}: LearningProgressProps) => {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  
  // Calcular nível baseado no número total de perguntas
  const calculateLevel = (questions: number) => {
    return Math.floor(questions / 5) + 1;
  };

  // Calcular progresso dentro do nível atual
  const calculateLevelProgress = (questions: number) => {
    const questionsInCurrentLevel = questions % 5;
    return (questionsInCurrentLevel / 5) * 100;
  };

  const level = calculateLevel(totalQuestions);
  const levelProgress = calculateLevelProgress(totalQuestions);
  const nextLevelQuestions = 5 - (totalQuestions % 5);

  // Detectar level up
  useEffect(() => {
    if (level > currentLevel) {
      setShowLevelUp(true);
      setCurrentLevel(level);
      onCelebration?.();

      const timeout = setTimeout(() => {
        setShowLevelUp(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [level, currentLevel, onCelebration]);

  const badges = [
    { id: 'first_chat', icon: Heart, label: 'Primeiro Chat', color: 'from-pink-400 to-purple-400' },
    { id: 'streak_5', icon: Flame, label: 'Em Chamas', color: 'from-orange-400 to-red-400' },
    { id: 'curious_learner', icon: Brain, label: 'Curioso', color: 'from-blue-400 to-indigo-400' },
    { id: 'problem_solver', icon: Target, label: 'Solucionador', color: 'from-green-400 to-emerald-400' }
  ];

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 mb-6">
      {/* Level up notification */}
      {showLevelUp && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bounce text-2xl font-bold">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 animate-spin" />
              Level {level}!
              <Trophy className="w-8 h-8 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
              level >= 10 ? "bg-gradient-to-br from-yellow-400 to-orange-400" :
              level >= 5 ? "bg-gradient-to-br from-purple-400 to-pink-400" :
              "bg-gradient-to-br from-blue-400 to-indigo-400"
            )}>
              <span className="text-white font-bold text-lg">{level}</span>
            </div>
            {level >= 5 && (
              <div className="absolute -top-1 -right-1">
                <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Nível {level}</h3>
            <p className="text-sm text-gray-600">
              {nextLevelQuestions === 5 ? 'Parabéns pelo nível!' : `${nextLevelQuestions} pergunta${nextLevelQuestions > 1 ? 's' : ''} para o próximo nível`}
            </p>
          </div>
        </div>

        {/* Streak indicator */}
        {streakCount > 0 && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 px-3 py-2 rounded-full">
            <Flame className={cn(
              "w-4 h-4 transition-all duration-300",
              streakCount >= 10 ? "text-red-500 animate-bounce" :
              streakCount >= 5 ? "text-orange-500 animate-pulse" :
              "text-orange-400"
            )} />
            <span className="text-sm font-medium text-orange-700">
              {streakCount} seguida{streakCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progresso do Nível</span>
          <span>{Math.round(levelProgress)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-1000 ease-out",
              level >= 10 ? "bg-gradient-to-r from-yellow-400 to-orange-500" :
              level >= 5 ? "bg-gradient-to-r from-purple-400 to-pink-500" :
              "bg-gradient-to-r from-blue-400 to-indigo-500"
            )}
            style={{ width: `${levelProgress}%` }}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{totalQuestions}</div>
          <div className="text-xs text-gray-600">Perguntas Totais</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{sessionMessagesCount}</div>
          <div className="text-xs text-gray-600">Esta Sessão</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{unlockedBadges.length}</div>
          <div className="text-xs text-gray-600">Conquistas</div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex justify-center gap-3">
        {badges.map(badge => {
          const IconComponent = badge.icon;
          const isUnlocked = unlockedBadges.includes(badge.id);
          
          return (
            <div 
              key={badge.id} 
              className={cn(
                "relative transition-all duration-300",
                isUnlocked ? "animate-pulse" : "opacity-40 hover:opacity-60"
              )}
              title={badge.label}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110",
                isUnlocked 
                  ? `bg-gradient-to-br ${badge.color}` 
                  : "bg-gray-300"
              )}>
                <IconComponent className={cn(
                  "w-5 h-5",
                  isUnlocked ? "text-white" : "text-gray-500"
                )} />
              </div>
              {isUnlocked && (
                <div className="absolute -top-1 -right-1">
                  <Star className="w-3 h-3 text-yellow-400 animate-spin" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Motivational message */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 italic">
          {level >= 10 ? "🌟 Você é um verdadeiro mestre do aprendizado!" :
           level >= 5 ? "🚀 Você está voando alto no conhecimento!" :
           streakCount >= 5 ? "🔥 Que sequência impressionante!" :
           totalQuestions >= 10 ? "💪 Você está se dedicando muito!" :
           "🌱 Cada pergunta te faz crescer mais!"}
        </p>
      </div>
    </div>
  );
};
