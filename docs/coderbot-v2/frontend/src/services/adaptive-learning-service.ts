import { toast } from "@/components/ui/sonner";

const BASE_URL = "http://localhost:8000/adaptive";

// Types for Adaptive Learning
export interface LearningProfile {
  user_id: string;
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
  pace_preference: string;
  preferred_difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  current_streak: number;
  total_study_time_hours: number;
  learning_goals: string[];
  weak_areas: string[];
  strong_areas: string[];
  cognitive_load_capacity: number;
}

export interface LearningPath {
  id: string;
  user_id: string;
  objectives: LearningObjective[];
  estimated_completion_hours: number;
  current_objective_index: number;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface LearningObjective {
  id: string;
  title: string;
  description: string;
  type: string;
  estimated_duration_minutes: number;
  difficulty_level: string;
  prerequisites: string[];
  resources: Resource[];
  completed: boolean;
}

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'text' | 'exercise' | 'quiz' | 'simulation';
  url: string;
  estimated_duration_minutes: number;
  difficulty_level: string;
}

export interface AdaptiveRecommendation {
  id: string;
  user_id: string;
  recommendation_type: string;
  title: string;
  description: string;
  reasoning: string;
  priority: number;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface LearningSession {
  id: string;
  user_id: string;
  content_id: string;
  session_type: string;
  start_time: string;
  duration_minutes: number;
  performance_score?: number;
  engagement_score?: number;
  difficulty_rating?: number;
  interactions: any[];
  completed: boolean;
}

export interface AssessmentResponse {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  time_taken_seconds: number;
  confidence_level: number;
  submitted_at: string;
}

// Learning Style Assessment
export const assessLearningStyle = async (responses: any[]): Promise<string> => {
  try {
    const response = await fetch(`${BASE_URL}/assess-learning-style`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_responses: responses })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error assessing learning style:', error);
    toast.error('Failed to assess learning style');
    throw error;
  }
};

// Profile Management
export const createOrUpdateProfile = async (profileData: Partial<LearningProfile>): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    toast.success('Profile updated successfully!');
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.error('Failed to update profile');
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<LearningProfile> => {
  try {
    const response = await fetch(`${BASE_URL}/profile/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    toast.error('Failed to load user profile');
    throw error;
  }
};

// Learning Path Management
export const createLearningPath = async (userId: string, targetSkills: string[], learningGoals?: string[]): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/learning-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        target_skills: targetSkills,
        learning_goals: learningGoals || []
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    toast.success('Learning path created successfully!');
    return data;
  } catch (error) {
    console.error('Error creating learning path:', error);
    toast.error('Failed to create learning path');
    throw error;
  }
};

export const getUserLearningPaths = async (userId: string): Promise<LearningPath[]> => {
  try {
    const response = await fetch(`${BASE_URL}/learning-paths/user/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.learning_paths || [];
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    toast.error('Failed to load learning paths');
    throw error;
  }
};

export const getLearningPath = async (pathId: string): Promise<LearningPath> => {
  try {
    const response = await fetch(`${BASE_URL}/learning-path/${pathId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching learning path:', error);
    toast.error('Failed to load learning path');
    throw error;
  }
};

// Assessment Management
export const submitAssessment = async (userId: string, assessmentId: string, responses: AssessmentResponse[]): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/assessment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        assessment_id: assessmentId,
        responses: responses
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    toast.success('Assessment submitted successfully!');
    return data;
  } catch (error) {
    console.error('Error submitting assessment:', error);
    toast.error('Failed to submit assessment');
    throw error;
  }
};

// Recommendations
export const getRecommendations = async (userId: string): Promise<AdaptiveRecommendation[]> => {
  try {
    const response = await fetch(`${BASE_URL}/recommendations/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.recommendations || [];
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    toast.error('Failed to load recommendations');
    throw error;
  }
};

// Session Tracking
export const trackLearningSession = async (sessionData: {
  user_id: string;
  content_id: string;
  session_type: string;
  duration_minutes: number;
  performance_score?: number;
  engagement_score?: number;
  difficulty_rating?: number;
}): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/session/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error tracking session:', error);
    toast.error('Failed to track learning session');
    throw error;
  }
};

// Analytics
export const getUserAnalytics = async (userId: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/analytics/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics:', error);
    toast.error('Failed to load analytics');
    throw error;
  }
};

// Learning Streaks
export const getLearningStreaks = async (userId: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/streaks/${userId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching streaks:', error);
    toast.error('Failed to load learning streaks');
    throw error;
  }
};

// Health Check
export const checkAdaptiveLearningHealth = async (): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('Error checking adaptive learning health:', error);
    throw error;
  }
}; 