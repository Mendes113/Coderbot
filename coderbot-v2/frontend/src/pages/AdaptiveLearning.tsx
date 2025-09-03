import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Target, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Lightbulb,
  ArrowRight,
  Zap,
  Trophy,
  Play,
  RefreshCw,
  Settings
} from 'lucide-react';
import { pb } from '@/integrations/pocketbase/client';
import { toast } from "@/components/ui/sonner";
import { AdaptiveLearningSetup } from "@/components/adaptive/AdaptiveLearningSetup";
import { 
  getUserProfile, 
  getUserLearningPaths, 
  getRecommendations,
  trackLearningSession,
  type LearningProfile,
  type LearningPath,
  type AdaptiveRecommendation 
} from "@/services/adaptive-learning-service";

const AdaptiveLearning: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [recommendations, setRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  const userId = pb.authStore.model?.id;

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Try to load user profile
      try {
        const userProfile = await getUserProfile(userId);
        setProfile(userProfile);
        
        // Load learning paths and recommendations
        const [paths, recs] = await Promise.all([
          getUserLearningPaths(userId),
          getRecommendations(userId)
        ]);
        
        setLearningPaths(paths);
        setRecommendations(recs);
      } catch (error) {
        // Profile doesn't exist, show setup
        setShowSetup(true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load learning data');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = (newProfile: LearningProfile, pathId: string) => {
    setProfile(newProfile);
    setShowSetup(false);
    loadUserData(); // Reload all data
    toast.success('Welcome to your personalized learning journey!');
  };

  const handleStartLearning = async (contentId: string, sessionType: string) => {
    if (!userId) return;

    try {
      const sessionData = {
        user_id: userId,
        content_id: contentId,
        session_type: sessionType,
        duration_minutes: 0, // Will be updated when session ends
        performance_score: undefined,
        engagement_score: undefined,
        difficulty_rating: undefined
      };

      await trackLearningSession(sessionData);
      toast.success('Learning session started!');
      
      // Here you would navigate to the actual learning content
      // For now, we'll just show a success message
    } catch (error) {
      console.error('Error starting learning session:', error);
      toast.error('Failed to start learning session');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-muted-foreground">Loading your learning environment...</p>
        </div>
      </div>
    );
  }

  if (showSetup || !profile) {
    return (
      <div className="container mx-auto py-6">
        <AdaptiveLearningSetup 
          onComplete={handleSetupComplete}
          className="h-full"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Adaptive Learning</h1>
          <p className="text-muted-foreground">
            Your personalized AI-powered learning experience
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowSetup(true)}
          className="hidden sm:flex"
        >
          <Settings className="h-4 w-4 mr-2" />
          Setup
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Style</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {profile.learning_style.replace('_', ' ')}
            </div>
            <p className="text-xs text-muted-foreground">Detected preference</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.current_streak}</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile.total_study_time_hours.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Paths</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningPaths.length}</div>
            <p className="text-xs text-muted-foreground">learning paths</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab 
            profile={profile} 
            learningPaths={learningPaths} 
            recommendations={recommendations}
            onStartLearning={handleStartLearning}
          />
        </TabsContent>

        <TabsContent value="paths" className="space-y-6">
          <LearningPathsTab 
            learningPaths={learningPaths} 
            onStartLearning={handleStartLearning}
          />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <RecommendationsTab 
            recommendations={recommendations}
            onStartLearning={handleStartLearning}
          />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <ProfileTab 
            profile={profile} 
            onEditProfile={() => setShowSetup(true)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  profile: LearningProfile;
  learningPaths: LearningPath[];
  recommendations: AdaptiveRecommendation[];
  onStartLearning: (contentId: string, sessionType: string) => void;
}> = ({ profile, learningPaths, recommendations, onStartLearning }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Current Learning Path */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Current Learning Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          {learningPaths.length > 0 ? (
            <div className="space-y-4">
              {learningPaths.slice(0, 1).map((path) => (
                <div key={path.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Path Progress</span>
                    <Badge variant="secondary">
                      {path.completion_percentage.toFixed(0)}% Complete
                    </Badge>
                  </div>
                  <Progress value={path.completion_percentage} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    Estimated: {path.estimated_completion_hours} hours remaining
                  </div>
                  <Button 
                    onClick={() => onStartLearning(path.id, 'learning_path')}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Continue Learning
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No active learning paths</p>
              <Button className="mt-4" variant="outline">
                Create Learning Path
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            AI Recommendations
          </CardTitle>
          <CardDescription>
            Personalized suggestions for your learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec) => (
              <div key={rec.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  rec.priority === 5 ? 'bg-red-500' : 
                  rec.priority >= 3 ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{rec.title}</p>
                  <p className="text-xs text-muted-foreground">{rec.description}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onStartLearning(rec.id, rec.recommendation_type)}
                >
                  Try
                </Button>
              </div>
            ))}
            {recommendations.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Complete more activities to get personalized recommendations
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Learning Goals */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Learning Goals</CardTitle>
          <CardDescription>Your current learning objectives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profile.learning_goals.map((goal, index) => (
              <Badge key={index} variant="outline">
                {goal}
              </Badge>
            ))}
            {profile.learning_goals.length === 0 && (
              <p className="text-muted-foreground">No learning goals set</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Learning Paths Tab Component
const LearningPathsTab: React.FC<{
  learningPaths: LearningPath[];
  onStartLearning: (contentId: string, sessionType: string) => void;
}> = ({ learningPaths, onStartLearning }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Learning Paths</h3>
        <Button variant="outline">
          <BookOpen className="h-4 w-4 mr-2" />
          Create New Path
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {learningPaths.map((path) => (
          <Card key={path.id}>
            <CardHeader>
              <CardTitle className="text-base">Learning Path</CardTitle>
              <CardDescription>
                {path.objectives.length} objectives • {path.estimated_completion_hours}h estimated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{path.completion_percentage.toFixed(0)}%</span>
                </div>
                <Progress value={path.completion_percentage} />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Next Objectives:</p>
                {path.objectives.slice(path.current_objective_index, path.current_objective_index + 2).map((objective) => (
                  <div key={objective.id} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-muted-foreground" />
                    <span>{objective.title}</span>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full" 
                onClick={() => onStartLearning(path.id, 'learning_path')}
              >
                <Play className="h-4 w-4 mr-2" />
                Continue Path
              </Button>
            </CardContent>
          </Card>
        ))}

        {learningPaths.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Learning Paths Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first personalized learning path to get started
            </p>
            <Button>
              <Target className="h-4 w-4 mr-2" />
              Create Learning Path
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Recommendations Tab Component
const RecommendationsTab: React.FC<{
  recommendations: AdaptiveRecommendation[];
  onStartLearning: (contentId: string, sessionType: string) => void;
}> = ({ recommendations, onStartLearning }) => {
  const priorityColors = {
    5: { bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200', text: 'text-red-800 dark:text-red-200' },
    4: { bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-orange-200', text: 'text-orange-800 dark:text-orange-200' },
    3: { bg: 'bg-yellow-50 dark:bg-yellow-950', border: 'border-yellow-200', text: 'text-yellow-800 dark:text-yellow-200' },
    2: { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200', text: 'text-blue-800 dark:text-blue-200' },
    1: { bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-200', text: 'text-green-800 dark:text-green-200' }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI-Powered Recommendations</h3>
        <Badge variant="outline">
          {recommendations.length} active recommendations
        </Badge>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => {
          const colors = priorityColors[rec.priority as keyof typeof priorityColors] || priorityColors[3];
          
          return (
            <Card key={rec.id} className={`${colors.bg} ${colors.border}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-base ${colors.text}`}>
                    {rec.title}
                  </CardTitle>
                  <Badge variant="outline" className="capitalize">
                    {rec.recommendation_type.replace('_', ' ')}
                  </Badge>
                </div>
                <CardDescription className={colors.text}>
                  {rec.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className={`font-medium ${colors.text}`}>Priority: </span>
                    <span className={colors.text}>
                      {rec.priority === 5 ? 'Critical' : 
                       rec.priority >= 4 ? 'High' : 
                       rec.priority >= 3 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => onStartLearning(rec.id, rec.recommendation_type)}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                </div>
                {rec.reasoning && (
                  <p className={`text-xs mt-2 ${colors.text} opacity-80`}>
                    {rec.reasoning}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

        {recommendations.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
            <p className="text-muted-foreground">
              Complete some learning activities to receive personalized AI recommendations
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Profile Tab Component
const ProfileTab: React.FC<{
  profile: LearningProfile;
  onEditProfile: () => void;
}> = ({ profile, onEditProfile }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Learning Profile</h3>
        <Button variant="outline" onClick={onEditProfile}>
          <Settings className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Learning Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Learning Style:</span>
              <Badge variant="secondary" className="capitalize">
                {profile.learning_style.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pace Preference:</span>
              <Badge variant="outline" className="capitalize">
                {profile.pace_preference}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Difficulty Level:</span>
              <Badge variant="outline" className="capitalize">
                {profile.preferred_difficulty}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cognitive Load:</span>
              <Badge variant="outline">
                {(profile.cognitive_load_capacity * 100).toFixed(0)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Current Streak:</span>
              <span className="font-semibold">{profile.current_streak} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Study Time:</span>
              <span className="font-semibold">{profile.total_study_time_hours.toFixed(1)} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Strong Areas:</span>
              <span className="font-semibold">{profile.strong_areas.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Areas to Improve:</span>
              <span className="font-semibold">{profile.weak_areas.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Learning Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.learning_goals.map((goal, index) => (
                <Badge key={index} variant="default">
                  {goal}
                </Badge>
              ))}
              {profile.learning_goals.length === 0 && (
                <p className="text-muted-foreground">No learning goals set</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Skill Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Strong Areas</h4>
                <div className="space-y-1">
                  {profile.strong_areas.map((area, index) => (
                    <Badge key={index} variant="default" className="mr-1 mb-1">
                      {area}
                    </Badge>
                  ))}
                  {profile.strong_areas.length === 0 && (
                    <p className="text-sm text-muted-foreground">Complete assessments to identify strengths</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Areas to Improve</h4>
                <div className="space-y-1">
                  {profile.weak_areas.map((area, index) => (
                    <Badge key={index} variant="outline" className="mr-1 mb-1">
                      {area}
                    </Badge>
                  ))}
                  {profile.weak_areas.length === 0 && (
                    <p className="text-sm text-muted-foreground">No areas identified for improvement</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdaptiveLearning; 