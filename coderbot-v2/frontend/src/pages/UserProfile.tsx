// src/pages/UserProfile.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData } from "@/hooks/useUserData";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { LearningAnalyticsDashboard } from "@/components/analytics/LearningAnalyticsDashboard";
import { AdaptiveLearningSetup } from "@/components/adaptive/AdaptiveLearningSetup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, Github, Brain, TrendingUp, Target, Clock, Flame, Trophy, BookOpen, Settings, Zap } from "lucide-react";
import { pb, startGithubOAuth, getUserApiKey, upsertUserApiKey } from "@/integrations/pocketbase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  getUserProfile, 
  getUserLearningPaths, 
  getRecommendations,
  getLearningStreaks,
  type LearningProfile,
  type LearningPath,
  type AdaptiveRecommendation 
} from "@/services/adaptive-learning-service";
import { 
  getComprehensiveAnalytics,
  type UserAnalytics 
} from "@/services/analytics-service";
import { StudentInvitations } from "@/components/student/StudentInvitations";

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showAdaptiveSetup, setShowAdaptiveSetup] = useState(false);
  
  // Learning data states
  // const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  // const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  // const [recommendations, setRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [streaks, setStreaks] = useState<any>(null);
  const [loadingLearningData, setLoadingLearningData] = useState(true);
  const [apiKeys, setApiKeys] = useState({
    chatgpt: "",
    deepseek: "",
    openrouter: ""
  });
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const { profile, loading } = useUserData();
  const navigate = useNavigate();
  const userId = pb.authStore.model?.id;

  useEffect(() => {
    if (userId) {
      loadLearningData();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setApiKeyLoading(true);
    setApiKeyError(null);
    Promise.all([
      getUserApiKey(userId, "chatgpt"),
      getUserApiKey(userId, "deepseek"),
      getUserApiKey(userId, "openrouter")
    ]).then(([chatgpt, deepseek, openrouter]) => {
      setApiKeys({
        chatgpt: chatgpt?.api_key || "",
        deepseek: deepseek?.api_key || "",
        openrouter: openrouter?.api_key || ""
      });
    }).catch(() => {
      setApiKeyError("Erro ao carregar suas API Keys.");
    }).finally(() => setApiKeyLoading(false));
  }, [userId]);

  const loadLearningData = async () => {
    if (!userId) return;

    try {
      setLoadingLearningData(true);
      
      // Try to load learning profile
      try {
        const [userProfile, paths, recs, streakData] = await Promise.all([
          getUserProfile(userId),
          getUserLearningPaths(userId),
          getRecommendations(userId),
          getLearningStreaks(userId)
        ]);
        
        // setLearningProfile(userProfile);
        // setLearningPaths(paths);
        // setRecommendations(recs);
        setStreaks(streakData);

        // Load analytics
        try {
          const analyticsResult = await getComprehensiveAnalytics(userId, true, false);
          setAnalytics(analyticsResult.analytics);
        } catch (analyticsError) {
          console.log('Analytics not available yet');
        }

      } catch (profileError) {
        console.log('Learning profile not found - user needs setup');
        // Profile doesn't exist, user needs to complete setup
      }
    } catch (error) {
      console.error('Error loading learning data:', error);
    } finally {
      setLoadingLearningData(false);
    }
  };

  const handleLogout = () => {
    try {
      pb.authStore.clear();
      toast.success("Logout realizado com sucesso!");
      navigate("/auth");
    } catch (err: any) {
      console.error("Logout error:", err);
      toast.error("Erro ao fazer logout");
    }
  };

  const handleGithubConnect = () => {
    startGithubOAuth();
  };

  const handleSaveApiKeys = async () => {
    if (!userId) return;
    setApiKeyLoading(true);
    setApiKeyError(null);
    setApiKeySaved(false);
    try {
      await Promise.all([
        upsertUserApiKey(userId, "chatgpt", apiKeys.chatgpt),
        upsertUserApiKey(userId, "deepseek", apiKeys.deepseek),
        upsertUserApiKey(userId, "openrouter", apiKeys.openrouter)
      ]);
      setApiKeySaved(true);
      toast.success("API Keys salvas com sucesso!");
    } catch (err) {
      setApiKeyError("Erro ao salvar suas API Keys.");
      toast.error("Erro ao salvar suas API Keys.");
    } finally {
      setApiKeyLoading(false);
    }
  };

  const calculateUserLevel = (studyHours: number) => {
    // Simple level calculation: 10 hours per level
    return Math.floor(studyHours / 10) + 1;
  };

  const calculateLevelProgress = (studyHours: number) => {
    // Progress within current level (0-100%)
    return (studyHours % 10) * 10;
  };

  const getAchievementBadges = (profile: LearningProfile, analytics: UserAnalytics | null) => {
    const badges = [];
    
    if (profile.current_streak >= 7) badges.push({ name: "Week Warrior", color: "bg-orange-200 text-orange-800" });
    if (profile.current_streak >= 30) badges.push({ name: "Month Master", color: "bg-purple-200 text-purple-800" });
    if (profile.total_study_time_hours >= 50) badges.push({ name: "Dedicated Learner", color: "bg-blue-200 text-blue-800" });
    if (profile.total_study_time_hours >= 100) badges.push({ name: "Study Champion", color: "bg-green-200 text-green-800" });
    if (analytics?.overview.concepts_mastered >= 10) badges.push({ name: "Concept Master", color: "bg-indigo-200 text-indigo-800" });
    if (analytics?.overview.average_performance >= 0.8) badges.push({ name: "High Performer", color: "bg-yellow-200 text-yellow-800" });
    
    return badges;
  };

  if (loading || loadingLearningData) {
    return (
      <div className="container mx-auto py-8 space-y-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-14 w-[250px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header com branding moderno (inspirado no AppSidebar) */}
      <div className="relative flex items-center justify-between gap-3 border-b border-sidebar-border/50 p-4 bg-gradient-to-br from-coderbot-purple/20 via-transparent to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img
            src="/coderbot_colorfull.png"
            alt="Logo Coderbot"
            className="w-10 h-10 rounded-xl shadow-sm ring-1 ring-black/5 object-contain"
          />
          <div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard/chat")}
                className="flex-shrink-0 h-8 w-8"
                title="Voltar ao dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">Perfil & Learning Analytics</h1>
            </div>
            <div className="text-xs text-muted-foreground">Gerencie seu perfil e veja seu progresso</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGithubConnect}
            className="flex items-center gap-2 h-8"
            size="sm"
          >
            <Github className="h-4 w-4" />
            Conectar GitHub
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2 h-8"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 space-y-6 max-w-6xl">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="invites">Convites</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {analytics ? (
            <LearningAnalyticsDashboard userId={userId} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Analytics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  Complete more learning activities to generate comprehensive analytics
                </p>
                <Button onClick={() => navigate('/dashboard/adaptive')}>
                  Start Learning
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <ProfileHeader
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
          />
          <ProfileForm 
            isEditing={isEditing} 
            onSaved={() => setIsEditing(false)} 
          />
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-background/90 to-background/50 backdrop-blur-sm border border-sidebar-border/50 rounded-2xl p-8 mt-6 shadow-xl ring-1 ring-black/5 flex flex-col gap-6 items-center">
              <div className="flex flex-col items-center mb-2">
                <span className="text-2xl text-foreground mb-1">🔑</span>
                <h2 className="text-xl font-bold mb-1 text-foreground">Gerencie suas API Keys</h2>
                <p className="text-sm text-muted-foreground text-center max-w-xs">Salve suas chaves de API para integrações avançadas. Só você pode ver e editar suas chaves.<br/><span className='text-violet-400'>Segurança e privacidade garantidas.</span></p>
              </div>
              <form className="w-full flex flex-col gap-4" onSubmit={e => { e.preventDefault(); handleSaveApiKeys(); }}>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-foreground" htmlFor="chatgpt-key">ChatGPT</label>
                  <input
                    id="chatgpt-key"
                    type="text"
                    autoComplete="off"
                    className="w-full border border-sidebar-border/50 rounded px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-coderbot-purple/50 transition-all duration-200 placeholder:text-muted-foreground shadow-sm ring-1 ring-black/5"
                    placeholder="Cole sua chave ChatGPT..."
                    value={apiKeys.chatgpt}
                    onChange={e => { setApiKeys(a => ({ ...a, chatgpt: e.target.value })); setApiKeySaved(false); }}
                    disabled={apiKeyLoading}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-foreground" htmlFor="deepseek-key">DeepSeek</label>
                  <input
                    id="deepseek-key"
                    type="text"
                    autoComplete="off"
                    className="w-full border border-sidebar-border/50 rounded px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-coderbot-purple/50 transition-all duration-200 placeholder:text-muted-foreground shadow-sm ring-1 ring-black/5"
                    placeholder="Cole sua chave DeepSeek..."
                    value={apiKeys.deepseek}
                    onChange={e => { setApiKeys(a => ({ ...a, deepseek: e.target.value })); setApiKeySaved(false); }}
                    disabled={apiKeyLoading}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-foreground" htmlFor="openrouter-key">OpenRouter</label>
                  <input
                    id="openrouter-key"
                    type="text"
                    autoComplete="off"
                    className="w-full border border-sidebar-border/50 rounded px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-coderbot-purple/50 transition-all duration-200 placeholder:text-muted-foreground shadow-sm ring-1 ring-black/5"
                    placeholder="Cole sua chave OpenRouter..."
                    value={apiKeys.openrouter}
                    onChange={e => { setApiKeys(a => ({ ...a, openrouter: e.target.value })); setApiKeySaved(false); }}
                    disabled={apiKeyLoading}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 py-2 rounded-lg text-lg font-semibold shadow-lg bg-gradient-to-r from-coderbot-purple to-purple-600 text-white border-0 hover:from-coderbot-purple/90 hover:to-purple-600/90 transition-all duration-200 focus:ring-2 focus:ring-coderbot-purple/50 ring-1 ring-black/5 hover:shadow-xl"
                  disabled={apiKeyLoading}
                >{apiKeyLoading ? 'Salvando...' : 'Salvar Todas as API Keys'}</button>
              </form>
              {apiKeyError && <div className="text-red-400 text-sm mt-2">{apiKeyError}</div>}
              {apiKeySaved && <div className="text-green-400 text-sm mt-2">API Keys salvas! 🎉</div>}
              <div className="text-xs text-muted-foreground mt-2 text-center">Dica: Use chaves diferentes para cada serviço para maior segurança.<br/>Você pode atualizar suas chaves a qualquer momento.</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invites" className="space-y-6">
          <StudentInvitations />
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
