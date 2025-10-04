// src/components/profile/AchievementsGrid.tsx
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, Trophy, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { pb } from '@/integrations/pocketbase/client';
import { toast } from 'sonner';
import { useGamification } from '@/hooks/useGamification';
import type { UserAchievement, EasterEggDefinition } from '@/services/gamification/types';

interface AchievementCardProps {
  achievement?: UserAchievement;
  definition?: EasterEggDefinition;
  isLocked: boolean;
  onLockedClick?: () => void;
}

const rarityColors = {
  easy: 'from-gray-400 to-gray-600',
  medium: 'from-blue-400 to-blue-600',
  hard: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-600'
};

const rarityLabels = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
  legendary: 'Lendário'
};

function AchievementCard({ achievement, definition, isLocked, onLockedClick }: AchievementCardProps) {
  const rarity = (achievement?.difficulty || definition?.difficulty || 'easy') as keyof typeof rarityColors;
  
  if (isLocked) {
    return (
      <motion.div
        whileHover={{ scale: 1.05, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300 }}
        onClick={onLockedClick}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-sm cursor-pointer">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)]" />
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] relative">
            <motion.div
              animate={{
                rotate: [0, -5, 5, -5, 5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="w-20 h-20 rounded-full bg-gray-700/50 flex items-center justify-center mb-4"
            >
              <Lock className="h-10 w-10 text-gray-500" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">???</h3>
            <p className="text-sm text-gray-500 text-center">Conquista Bloqueada</p>
            <Badge variant="secondary" className="mt-3 bg-gray-700/50 text-gray-400">
              Mistério
            </Badge>
            <p className="text-xs text-gray-600 mt-2 text-center italic">
              Clique para investigar... 🔍
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const displayData = achievement || {
    title: definition?.display_name || 'Desconhecido',
    description: definition?.description || 'Sem descrição',
    icon: definition?.icon || '🏆',
    points: definition?.points || 0,
    unlocked_at: achievement?.unlocked_at,
    is_new: achievement?.is_new || false
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={`relative overflow-hidden border-2 ${achievement ? 'bg-gradient-to-br from-background to-background/80' : 'opacity-60'}`}>
        {/* Gradient border effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${rarityColors[rarity]} opacity-20`} />
        
        {/* New badge ribbon */}
        {achievement?.is_new && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold shadow-lg animate-pulse">
              NOVO!
            </Badge>
          </div>
        )}

        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] relative">
          {/* Badge emoji */}
          <motion.div
            className={`text-6xl mb-4 ${achievement ? '' : 'grayscale opacity-40'}`}
            animate={achievement?.is_new ? {
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            } : {}}
            transition={{
              duration: 2,
              repeat: achievement?.is_new ? Infinity : 0,
              repeatDelay: 3
            }}
          >
            {displayData.icon}
          </motion.div>

          {/* Title */}
          <h3 className="text-lg font-bold text-center mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {displayData.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-2">
            {displayData.description}
          </p>

          {/* XP Reward */}
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
              +{displayData.points} XP
            </span>
          </div>

          {/* Rarity badge */}
          <Badge className={`bg-gradient-to-r ${rarityColors[rarity]} text-white font-bold`}>
            {rarityLabels[rarity]}
          </Badge>

          {/* Unlock date */}
          {achievement?.unlocked_at && (
            <p className="text-xs text-muted-foreground mt-3">
              Desbloqueado em {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AchievementsGrid() {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [allDefinitions, setAllDefinitions] = useState<EasterEggDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ unlocked: 0, total: 0, percentage: 0 });
  
  // Estado para rastrear clicks em conquistas bloqueadas (Caçador de Conquistas)
  const [lockedClickCount, setLockedClickCount] = useState(0);
  const [lockedClickTimer, setLockedClickTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Hook de gamificação
  const { trackAction } = useGamification();

  useEffect(() => {
    fetchAchievements();
  }, []);

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (lockedClickTimer) {
        clearTimeout(lockedClickTimer);
      }
    };
  }, [lockedClickTimer]);

  // Handler para clicks em conquistas bloqueadas
  const handleLockedClick = useCallback(() => {
    setLockedClickCount(prev => prev + 1);
    
    // Limpar timer anterior se existir
    if (lockedClickTimer) {
      clearTimeout(lockedClickTimer);
    }
    
    // Verificar se chegou a 10 clicks
    if (lockedClickCount + 1 >= 10) {
      setLockedClickCount(0);
      
      // 🎮 Rastrear easter egg de caçador de conquistas
      trackAction('achievement_hunter', {
        totalClicks: 10,
        timestamp: new Date().toISOString(),
        location: 'achievements_page'
      });
      
      // Toast divertido
      toast.success('🔍 Caçador de Conquistas!', {
        description: 'Você tentou descobrir todos os segredos! +150 XP'
      });
    }
    
    // Resetar contador após 10 segundos sem clicks
    const timer = setTimeout(() => {
      setLockedClickCount(0);
    }, 10000);
    
    setLockedClickTimer(timer);
  }, [lockedClickCount, lockedClickTimer, trackAction]);

  const fetchAchievements = async () => {
    try {
      const user = pb.authStore.model;
      if (!user?.id) return;

      // Buscar todas as definições de easter eggs
      const definitions = await pb.collection('easter_egg_definitions').getFullList<EasterEggDefinition>({
        filter: 'is_active = true',
        sort: '-difficulty,points'
      });

      // Buscar achievements desbloqueados do usuário
      const userAchievements = await pb.collection('user_achievements').getFullList<UserAchievement>({
        filter: `user = "${user.id}"`,
        expand: 'easter_egg',
        sort: '-unlocked_at'
      });

      setAllDefinitions(definitions);
      setAchievements(userAchievements);

      // Calcular estatísticas
      const unlockedCount = userAchievements.length;
      const totalCount = definitions.length;
      const percentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

      setStats({
        unlocked: unlockedCount,
        total: totalCount,
        percentage
      });

    } catch (error) {
      console.error('Erro ao buscar achievements:', error);
      toast.error('Erro ao carregar conquistas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-background/90 to-background/50 backdrop-blur-sm border-sidebar-border/50 shadow-xl ring-1 ring-black/5 rounded-2xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Criar array de cards: achievements desbloqueados + locked placeholders
  const unlockedEasterEggIds = new Set(achievements.map(a => a.easter_egg));
  const lockedCount = stats.total - stats.unlocked;

  return (
    <Card className="bg-gradient-to-br from-background/90 to-background/50 backdrop-blur-sm border-sidebar-border/50 shadow-xl ring-1 ring-black/5 rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <div>
              <CardTitle className="text-xl">Conquistas</CardTitle>
              <CardDescription>
                {stats.unlocked} de {stats.total} desbloqueadas ({stats.percentage}%)
              </CardDescription>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <Progress value={stats.percentage} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{stats.unlocked} conquistas</span>
            <span>{lockedCount} bloqueadas</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {stats.total === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Trophy className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-lg mb-1">Nenhuma conquista disponível</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              As conquistas aparecerão aqui conforme você explora a plataforma!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Achievements desbloqueados */}
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isLocked={false}
              />
            ))}

            {/* Placeholders bloqueados */}
            {Array.from({ length: lockedCount }, (_, i) => (
              <AchievementCard
                key={`locked-${i}`}
                isLocked={true}
                onLockedClick={handleLockedClick}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
