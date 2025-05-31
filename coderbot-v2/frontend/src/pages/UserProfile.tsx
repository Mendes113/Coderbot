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
import { pb, startGithubOAuth } from "@/integrations/pocketbase/client";
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

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAdaptiveSetup, setShowAdaptiveSetup] = useState(false);
  
  // Learning data states
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [recommendations, setRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [streaks, setStreaks] = useState<any>(null);
  const [loadingLearningData, setLoadingLearningData] = useState(true);

  const { profile, loading } = useUserData();
  const navigate = useNavigate();
  const userId = pb.authStore.model?.id;

  useEffect(() => {
    if (userId) {
      loadLearningData();
    }
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
        
        setLearningProfile(userProfile);
        setLearningPaths(paths);
        setRecommendations(recs);
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

  const handleAdaptiveSetupComplete = (newProfile: LearningProfile, pathId: string) => {
    setLearningProfile(newProfile);
    setShowAdaptiveSetup(false);
    loadLearningData(); // Reload all data
    toast.success('Learning profile setup completed!');
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

  if (showAdaptiveSetup || (!learningProfile && !loadingLearningData)) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/chat")}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Complete Your Learning Profile</h1>
        </div>
        <AdaptiveLearningSetup 
          onComplete={handleAdaptiveSetupComplete}
          className="min-h-screen"
        />
      </div>
    );
  }

  const userLevel = learningProfile ? calculateUserLevel(learningProfile.total_study_time_hours) : 1;
  const levelProgress = learningProfile ? calculateLevelProgress(learningProfile.total_study_time_hours) : 0;
  const badges = learningProfile ? getAchievementBadges(learningProfile, analytics) : [];

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-6xl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/chat")}
            className="flex-shrink-0"
            title="Voltar ao dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Perfil & Learning Analytics</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAdaptiveSetup(true)}
            className="flex items-center gap-2"
            size="sm"
          >
            <Settings className="h-4 w-4" />
            Setup Learning
          </Button>
          <Button
            variant="outline"
            onClick={handleGithubConnect}
            className="flex items-center gap-2"
            size="sm"
          >
            <Github className="h-4 w-4" />
            Conectar GitHub
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="learning">Learning Progress</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Learning Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Level {userLevel}</div>
                <Progress value={levelProgress} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {(10 - (learningProfile?.total_study_time_hours || 0) % 10).toFixed(1)}h to next level
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{learningProfile?.current_streak || 0}</div>
                <p className="text-xs text-muted-foreground">days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Time</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {learningProfile?.total_study_time_hours.toFixed(1) || 0}h
                </div>
                <p className="text-xs text-muted-foreground">total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Paths</CardTitle>
                <BookOpen className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{learningPaths.length}</div>
                <p className="text-xs text-muted-foreground">active</p>
              </CardContent>
            </Card>
          </div>

          {/* Learning Profile Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Learning Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Learning Style:</span>
                  <Badge variant="secondary" className="capitalize">
                    {learningProfile?.learning_style.replace('_', ' ') || 'Not set'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Difficulty Level:</span>
                  <Badge variant="outline" className="capitalize">
                    {learningProfile?.preferred_difficulty || 'Not set'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pace Preference:</span>
                  <Badge variant="outline" className="capitalize">
                    {learningProfile?.pace_preference || 'Not set'}
                  </Badge>
                </div>
                {analytics && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Performance:</span>
                    <Badge variant="default">
                      {(analytics.overview.average_performance * 100).toFixed(1)}%
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Achievements & Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge, index) => (
                    <Badge key={index} className={badge.color}>
                      {badge.name}
                    </Badge>
                  ))}
                  {badges.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      Continue learning to earn your first badges!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Challenges & Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Learning Goals & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {learningProfile?.learning_goals && learningProfile.learning_goals.length > 0 ? (
                <div>
                  <h4 className="font-medium mb-2">Current Goals:</h4>
                  <div className="flex flex-wrap gap-2">
                    {learningProfile.learning_goals.map((goal, index) => (
                      <Badge key={index} variant="outline">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No learning goals set yet.</p>
              )}

              {recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">AI Recommendations:</h4>
                  <div className="space-y-2">
                    {recommendations.slice(0, 3).map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between p-2 rounded border">
                        <span className="text-sm">{rec.title}</span>
                        <Badge 
                          variant={rec.priority >= 4 ? "destructive" : rec.priority >= 3 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {rec.priority >= 4 ? 'High' : rec.priority >= 3 ? 'Medium' : 'Low'} Priority
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Motivational Message */}
          <div className="text-center text-blue-700 dark:text-blue-400 font-medium mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Zap className="h-6 w-6 mx-auto mb-2" />
            Continue assim! Você está avançando no seu aprendizado 🚀
            {learningProfile?.current_streak && learningProfile.current_streak > 0 && (
              <p className="text-sm mt-1">
                {learningProfile.current_streak} days streak - Keep it up!
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          {/* Learning Paths Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Paths Progress</CardTitle>
              <CardDescription>Your active learning journeys</CardDescription>
            </CardHeader>
            <CardContent>
              {learningPaths.length > 0 ? (
                <div className="space-y-4">
                  {learningPaths.map((path) => (
                    <div key={path.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Learning Path</h4>
                        <Badge variant="secondary">
                          {path.completion_percentage.toFixed(0)}% Complete
                        </Badge>
                      </div>
                      <Progress value={path.completion_percentage} className="mb-2" />
                      <div className="text-sm text-muted-foreground">
                        {path.objectives.length} objectives • {path.estimated_completion_hours}h estimated
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No active learning paths</p>
                  <Button className="mt-4" onClick={() => navigate('/dashboard/adaptive')}>
                    Create Learning Path
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills Assessment */}
          {learningProfile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Strong Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {learningProfile.strong_areas.map((area, index) => (
                      <Badge key={index} variant="default">
                        {area}
                      </Badge>
                    ))}
                    {learningProfile.strong_areas.length === 0 && (
                      <p className="text-muted-foreground text-sm">
                        Complete assessments to identify your strengths
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Areas to Improve</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {learningProfile.weak_areas.map((area, index) => (
                      <Badge key={index} variant="outline">
                        {area}
                      </Badge>
                    ))}
                    {learningProfile.weak_areas.length === 0 && (
                      <p className="text-muted-foreground text-sm">
                        No areas identified for improvement yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

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
      </Tabs>
    </div>
  );
};

export default UserProfile;
