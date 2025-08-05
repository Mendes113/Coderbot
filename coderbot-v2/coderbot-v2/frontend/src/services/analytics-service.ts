import { toast } from "@/components/ui/sonner";

const BASE_URL = "http://localhost:8000/analytics";

// Types for Analytics
export interface UserAnalytics {
  user_id: string;
  generated_at: string;
  overview: OverviewMetrics;
  performance_analysis: PerformanceAnalysis;
  engagement_analysis: EngagementAnalysis;
  skill_progression: SkillProgression;
  learning_patterns: LearningPatterns;
  predictions: LearningPredictions;
  recommendations: AnalyticalRecommendation[];
  comparative_analysis: ComparativeAnalysis;
  time_analysis: TimeAnalysis;
}

export interface OverviewMetrics {
  total_sessions: number;
  total_study_time_hours: number;
  average_performance: number;
  average_engagement: number;
  performance_trend: 'improving' | 'declining' | 'stable';
  engagement_trend: 'improving' | 'declining' | 'stable';
  current_streak: number;
  concepts_mastered: number;
  learning_style: string;
  active_days: number;
}

export interface PerformanceAnalysis {
  statistics: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    improvement_rate: number;
  };
  by_session_type: Record<string, any>;
  weekly_trends: Record<string, number>;
  patterns: any;
  consistency_score: number;
}

export interface EngagementAnalysis {
  statistics: {
    mean: number;
    trend: string;
    volatility: number;
  };
  hourly_patterns: Record<number, number>;
  duration_correlation: number;
  dropoff_analysis: any;
  optimal_session_time: number;
}

export interface SkillProgression {
  daily_progress: any[];
  concept_progression: Record<string, any>;
  skill_velocity: number;
  mastery_prediction: any;
}

export interface LearningPatterns {
  peak_learning_hours: number[];
  preferred_days: string[];
  average_session_length: number;
  session_consistency: number;
  sessions_per_day: number;
  content_preferences: Record<string, number>;
  learning_pattern_type: string;
  regularity_score: number;
}

export interface LearningPredictions {
  next_session_performance: any;
  engagement_trend: any;
  dropout_risk: any;
  goal_completion_timeline: any;
  confidence_interval: number;
}

export interface AnalyticalRecommendation {
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface ComparativeAnalysis {
  performance_percentile: number;
  engagement_percentile: number;
  activity_percentile: number;
  relative_performance: 'above_average' | 'below_average';
  improvement_areas: string[];
}

export interface TimeAnalysis {
  optimal_study_hours: number[];
  consistency_ratio: number;
  average_session_gap_hours: number;
  most_productive_day: string;
  study_streak_analysis: any;
}

export interface PlatformAnalytics {
  platform_statistics: any;
  user_engagement: {
    active_users_percentage: number;
    average_session_duration: number;
    retention_rate_7day: number;
    retention_rate_30day: number;
  };
  content_performance: {
    most_popular_content_type: string;
    average_completion_rate: number;
    user_satisfaction_score: number;
  };
  learning_outcomes: {
    average_skill_improvement: number;
    concepts_mastered_per_user: number;
    certification_completion_rate: number;
  };
  generated_at: string;
}

// Comprehensive Analytics
export const getComprehensiveAnalytics = async (
  userId: string, 
  detailed: boolean = true, 
  cacheRefresh: boolean = false
): Promise<{ analytics: UserAnalytics; cached: boolean; generated_at: string }> => {
  try {
    const params = new URLSearchParams({
      detailed: detailed.toString(),
      cache_refresh: cacheRefresh.toString()
    });

    const response = await fetch(`${BASE_URL}/user/${userId}/comprehensive?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching comprehensive analytics:', error);
    toast.error('Failed to load comprehensive analytics');
    throw error;
  }
};

// Performance Analytics
export const getPerformanceAnalytics = async (userId: string, days: number = 30): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}/performance?days=${days}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    toast.error('Failed to load performance analytics');
    throw error;
  }
};

// Engagement Analytics
export const getEngagementAnalytics = async (userId: string, days: number = 30): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}/engagement?days=${days}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching engagement analytics:', error);
    toast.error('Failed to load engagement analytics');
    throw error;
  }
};

// Skill Progression Analytics
export const getSkillProgression = async (userId: string, skillCategory?: string): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (skillCategory) params.append('skill_category', skillCategory);

    const response = await fetch(`${BASE_URL}/user/${userId}/skill-progression?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching skill progression:', error);
    toast.error('Failed to load skill progression');
    throw error;
  }
};

// Learning Predictions
export const getLearningPredictions = async (userId: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}/predictions`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching predictions:', error);
    toast.error('Failed to load learning predictions');
    throw error;
  }
};

// Personalized Recommendations
export const getPersonalizedRecommendations = async (userId: string, limit: number = 10): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}/recommendations?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    toast.error('Failed to load recommendations');
    throw error;
  }
};

// Platform Analytics
export const getPlatformAnalytics = async (): Promise<PlatformAnalytics> => {
  try {
    const response = await fetch(`${BASE_URL}/platform/overview`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    toast.error('Failed to load platform analytics');
    throw error;
  }
};

// Track Analytics Session
export const trackAnalyticsSession = async (
  userId: string, 
  sessionData: {
    content_id: string;
    session_type: string;
    duration_minutes: number;
    performance_score?: number;
    engagement_score?: number;
    difficulty_rating?: number;
    completed?: boolean;
  }
): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}/session/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error tracking analytics session:', error);
    toast.error('Failed to track session');
    throw error;
  }
};

// Learning Streaks
export const getLearningStreaks = async (userId: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}/streaks`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching learning streaks:', error);
    toast.error('Failed to load learning streaks');
    throw error;
  }
};

// Analytics Health Check
export const checkAnalyticsHealth = async (): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('Error checking analytics health:', error);
    throw error;
  }
};

// Utility Functions for Analytics Visualization
export const formatAnalyticsData = {
  // Format performance trend data for charts
  performanceTrend: (weeklyTrends: Record<string, number>) => {
    return Object.entries(weeklyTrends).map(([week, score]) => ({
      week: parseInt(week),
      score: parseFloat(score.toFixed(3))
    }));
  },

  // Format engagement patterns for visualization
  engagementPatterns: (hourlyPatterns: Record<number, number>) => {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      engagement: hourlyPatterns[hour] || 0
    }));
  },

  // Format skill progression for radar chart
  skillProgression: (conceptProgression: Record<string, any>) => {
    return Object.entries(conceptProgression).map(([concept, data]) => ({
      skill: concept.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      mastery: data.mastery_score || 0,
      attempts: data.total_attempts || 0
    }));
  },

  // Format learning patterns for timeline
  learningTimeline: (dailyProgress: any[]) => {
    return dailyProgress.map(day => ({
      date: day.submitted_date,
      successRate: day.mean || 0,
      sessions: day.count || 0
    }));
  }
};

// Analytics Export Functions
export const exportAnalytics = {
  // Export analytics as CSV
  toCSV: (analytics: UserAnalytics): string => {
    const overview = analytics.overview;
    const csvData = [
      ['Metric', 'Value'],
      ['Total Sessions', overview.total_sessions],
      ['Total Study Time (hours)', overview.total_study_time_hours],
      ['Average Performance', overview.average_performance],
      ['Average Engagement', overview.average_engagement],
      ['Current Streak', overview.current_streak],
      ['Concepts Mastered', overview.concepts_mastered],
      ['Learning Style', overview.learning_style]
    ];

    return csvData.map(row => row.join(',')).join('\n');
  },

  // Export analytics as JSON
  toJSON: (analytics: UserAnalytics): string => {
    return JSON.stringify(analytics, null, 2);
  },

  // Generate analytics report
  generateReport: (analytics: UserAnalytics): string => {
    const overview = analytics.overview;
    const performance = analytics.performance_analysis;
    
    return `
Learning Analytics Report
Generated: ${analytics.generated_at}
User ID: ${analytics.user_id}

OVERVIEW:
- Total Sessions: ${overview.total_sessions}
- Study Time: ${overview.total_study_time_hours} hours
- Performance: ${(overview.average_performance * 100).toFixed(1)}%
- Engagement: ${(overview.average_engagement * 100).toFixed(1)}%
- Current Streak: ${overview.current_streak} days
- Learning Style: ${overview.learning_style}

PERFORMANCE TRENDS:
- Trend: ${overview.performance_trend}
- Consistency: ${(performance.consistency_score * 100).toFixed(1)}%
- Improvement Rate: ${(performance.statistics.improvement_rate * 100).toFixed(1)}%

RECOMMENDATIONS:
${analytics.recommendations.map(rec => `- ${rec.title}: ${rec.description}`).join('\n')}
`;
  }
}; 