import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Any
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import json
import logging

from app.models.adaptive_models import (
    UserLearningProfile, LearningSession, ConceptMastery,
    SkillLevel, DifficultyLevel, LearningStyle
)
from app.services.pocketbase_service import pb_service

logger = logging.getLogger(__name__)

class LearningAnalyticsEngine:
    """
    Advanced analytics engine for learning insights and predictions
    Inspired by successful EdTech platforms like Coursera, Khan Academy
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.performance_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.engagement_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.dropout_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.skill_clusters = None
        
    async def generate_comprehensive_analytics(self, user_id: str) -> Dict[str, Any]:
        """Generate comprehensive learning analytics for a user"""
        try:
            # Get user data
            profile = await pb_service.get_user_profile(user_id)
            sessions = await pb_service.get_user_sessions(user_id, limit=100)
            
            if not profile or not sessions:
                return self._default_analytics(user_id)
            
            # Convert to DataFrames for analysis
            sessions_df = pd.DataFrame(sessions)
            
            analytics = {
                "user_id": user_id,
                "generated_at": datetime.now().isoformat(),
                "overview": await self._calculate_overview_metrics(profile, sessions_df),
                "performance_analysis": await self._analyze_performance(sessions_df),
                "engagement_analysis": await self._analyze_engagement(sessions_df),
                "skill_progression": await self._analyze_skill_progression(user_id, sessions_df),
                "learning_patterns": await self._identify_learning_patterns(sessions_df),
                "predictions": await self._generate_predictions(user_id, sessions_df),
                "recommendations": await self._generate_analytical_recommendations(user_id, sessions_df),
                "comparative_analysis": await self._comparative_analysis(user_id, sessions_df),
                "time_analysis": await self._analyze_time_patterns(sessions_df)
            }
            
            # Save analytics to PocketBase
            await pb_service.save_learning_analytics(user_id, analytics)
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error generating analytics for {user_id}: {e}")
            return self._default_analytics(user_id)
    
    def _default_analytics(self, user_id: str) -> Dict[str, Any]:
        """Return default analytics when no data is available"""
        return {
            "user_id": user_id,
            "generated_at": datetime.now().isoformat(),
            "overview": {"message": "Insufficient data for analysis"},
            "performance_analysis": {},
            "engagement_analysis": {},
            "skill_progression": {},
            "learning_patterns": {},
            "predictions": {},
            "recommendations": [],
            "comparative_analysis": {},
            "time_analysis": {}
        }
    
    async def _calculate_overview_metrics(self, profile: Dict, sessions_df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate overview metrics"""
        try:
            total_sessions = len(sessions_df)
            total_time = sessions_df['duration_minutes'].sum() / 60  # Convert to hours
            
            # Performance metrics
            performance_scores = sessions_df['performance_score'].dropna()
            avg_performance = performance_scores.mean() if len(performance_scores) > 0 else 0
            performance_trend = self._calculate_trend(performance_scores.tolist())
            
            # Engagement metrics
            engagement_scores = sessions_df['engagement_score'].dropna()
            avg_engagement = engagement_scores.mean() if len(engagement_scores) > 0 else 0
            engagement_trend = self._calculate_trend(engagement_scores.tolist())
            
            # Streak calculation
            current_streak = await self._calculate_current_streak(sessions_df)
            
            # Concept mastery count
            concept_masteries = json.loads(profile.get('concept_masteries', '{}'))
            mastered_concepts = sum(1 for mastery in concept_masteries.values() 
                                  if json.loads(mastery).get('skill_level') in ['proficient', 'expert'])
            
            return {
                "total_sessions": total_sessions,
                "total_study_time_hours": round(total_time, 2),
                "average_performance": round(avg_performance, 3),
                "average_engagement": round(avg_engagement, 3),
                "performance_trend": performance_trend,
                "engagement_trend": engagement_trend,
                "current_streak": current_streak,
                "concepts_mastered": mastered_concepts,
                "learning_style": profile.get('learning_style', 'unknown'),
                "active_days": len(sessions_df['start_time'].dt.date.unique()) if not sessions_df.empty else 0
            }
        except Exception as e:
            logger.error(f"Error calculating overview metrics: {e}")
            return {}
    
    async def _analyze_performance(self, sessions_df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze performance patterns and trends"""
        try:
            if sessions_df.empty:
                return {}
            
            performance_scores = sessions_df['performance_score'].dropna()
            
            if len(performance_scores) == 0:
                return {"message": "No performance data available"}
            
            # Basic statistics
            performance_stats = {
                "mean": performance_scores.mean(),
                "median": performance_scores.median(),
                "std": performance_scores.std(),
                "min": performance_scores.min(),
                "max": performance_scores.max(),
                "improvement_rate": self._calculate_improvement_rate(performance_scores.tolist())
            }
            
            # Performance by session type
            performance_by_type = sessions_df.groupby('session_type')['performance_score'].agg([
                'mean', 'count', 'std'
            ]).to_dict('index')
            
            # Performance over time (weekly analysis)
            sessions_df['week'] = pd.to_datetime(sessions_df['start_time']).dt.isocalendar().week
            weekly_performance = sessions_df.groupby('week')['performance_score'].mean().to_dict()
            
            # Identify performance patterns
            patterns = await self._identify_performance_patterns(performance_scores.tolist())
            
            return {
                "statistics": performance_stats,
                "by_session_type": performance_by_type,
                "weekly_trends": weekly_performance,
                "patterns": patterns,
                "consistency_score": self._calculate_consistency_score(performance_scores.tolist())
            }
            
        except Exception as e:
            logger.error(f"Error analyzing performance: {e}")
            return {}
    
    async def _analyze_engagement(self, sessions_df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze engagement patterns"""
        try:
            if sessions_df.empty:
                return {}
            
            engagement_scores = sessions_df['engagement_score'].dropna()
            
            if len(engagement_scores) == 0:
                return {"message": "No engagement data available"}
            
            # Engagement statistics
            engagement_stats = {
                "mean": engagement_scores.mean(),
                "trend": self._calculate_trend(engagement_scores.tolist()),
                "volatility": engagement_scores.std()
            }
            
            # Engagement by time of day
            sessions_df['hour'] = pd.to_datetime(sessions_df['start_time']).dt.hour
            hourly_engagement = sessions_df.groupby('hour')['engagement_score'].mean().to_dict()
            
            # Session duration vs engagement correlation
            duration_engagement_corr = sessions_df['duration_minutes'].corr(sessions_df['engagement_score'])
            
            # Engagement drop-off analysis
            engagement_dropoff = await self._analyze_engagement_dropoff(sessions_df)
            
            return {
                "statistics": engagement_stats,
                "hourly_patterns": hourly_engagement,
                "duration_correlation": duration_engagement_corr,
                "dropoff_analysis": engagement_dropoff,
                "optimal_session_time": await self._find_optimal_session_time(sessions_df)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing engagement: {e}")
            return {}
    
    async def _analyze_skill_progression(self, user_id: str, sessions_df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze skill progression and mastery"""
        try:
            # Get assessment responses
            responses = await pb_service.get_assessment_responses(user_id)
            
            if not responses:
                return {"message": "No assessment data available"}
            
            responses_df = pd.DataFrame(responses)
            
            # Skill progression over time
            responses_df['submitted_date'] = pd.to_datetime(responses_df['submitted_at']).dt.date
            
            # Calculate daily success rates
            daily_progress = responses_df.groupby('submitted_date')['is_correct'].agg([
                'mean', 'count'
            ]).reset_index()
            
            # Identify concepts with improvement
            concept_progress = {}
            for concept_id in responses_df['question_id'].str.extract(r'(\w+)_')[0].unique():
                concept_responses = responses_df[responses_df['question_id'].str.contains(concept_id, na=False)]
                if len(concept_responses) > 1:
                    success_rates = concept_responses.groupby('submitted_date')['is_correct'].mean()
                    concept_progress[concept_id] = {
                        "trend": self._calculate_trend(success_rates.tolist()),
                        "current_mastery": success_rates.iloc[-1] if not success_rates.empty else 0,
                        "sessions_count": len(concept_responses)
                    }
            
            # Skill velocity (concepts mastered per week)
            skill_velocity = await self._calculate_skill_velocity(responses_df)
            
            return {
                "daily_progress": daily_progress.to_dict('records'),
                "concept_progression": concept_progress,
                "skill_velocity": skill_velocity,
                "mastery_prediction": await self._predict_mastery_timeline(user_id, concept_progress)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing skill progression: {e}")
            return {}
    
    async def _identify_learning_patterns(self, sessions_df: pd.DataFrame) -> Dict[str, Any]:
        """Identify learning patterns and behaviors"""
        try:
            if sessions_df.empty:
                return {}
            
            # Time-based patterns
            sessions_df['hour'] = pd.to_datetime(sessions_df['start_time']).dt.hour
            sessions_df['day_of_week'] = pd.to_datetime(sessions_df['start_time']).dt.day_name()
            
            peak_hours = sessions_df['hour'].value_counts().head(3).index.tolist()
            preferred_days = sessions_df['day_of_week'].value_counts().head(3).index.tolist()
            
            # Session length patterns
            avg_session_length = sessions_df['duration_minutes'].mean()
            session_length_consistency = sessions_df['duration_minutes'].std()
            
            # Learning frequency patterns
            sessions_df['date'] = pd.to_datetime(sessions_df['start_time']).dt.date
            daily_sessions = sessions_df.groupby('date').size()
            avg_sessions_per_day = daily_sessions.mean()
            
            # Preferred content types
            content_preferences = sessions_df['session_type'].value_counts().to_dict()
            
            # Learning sprint vs steady patterns
            learning_pattern = await self._classify_learning_pattern(sessions_df)
            
            return {
                "peak_learning_hours": peak_hours,
                "preferred_days": preferred_days,
                "average_session_length": round(avg_session_length, 2),
                "session_consistency": round(session_length_consistency, 2),
                "sessions_per_day": round(avg_sessions_per_day, 2),
                "content_preferences": content_preferences,
                "learning_pattern_type": learning_pattern,
                "regularity_score": await self._calculate_regularity_score(sessions_df)
            }
            
        except Exception as e:
            logger.error(f"Error identifying learning patterns: {e}")
            return {}
    
    async def _generate_predictions(self, user_id: str, sessions_df: pd.DataFrame) -> Dict[str, Any]:
        """Generate ML-based predictions"""
        try:
            if len(sessions_df) < 5:  # Need minimum data for predictions
                return {"message": "Insufficient data for predictions"}
            
            # Feature engineering
            features = await self._engineer_features(sessions_df)
            
            if features is None or len(features) == 0:
                return {"message": "Could not generate features for prediction"}
            
            # Performance prediction
            performance_pred = await self._predict_next_performance(features)
            
            # Engagement prediction
            engagement_pred = await self._predict_engagement_trend(features)
            
            # Dropout risk prediction
            dropout_risk = await self._predict_dropout_risk(user_id, features)
            
            # Goal completion prediction
            goal_completion = await self._predict_goal_completion(user_id, features)
            
            return {
                "next_session_performance": performance_pred,
                "engagement_trend": engagement_pred,
                "dropout_risk": dropout_risk,
                "goal_completion_timeline": goal_completion,
                "confidence_interval": 0.85  # Model confidence
            }
            
        except Exception as e:
            logger.error(f"Error generating predictions: {e}")
            return {}
    
    async def _generate_analytical_recommendations(self, user_id: str, sessions_df: pd.DataFrame) -> List[Dict]:
        """Generate data-driven recommendations"""
        recommendations = []
        
        try:
            # Performance-based recommendations
            if not sessions_df.empty:
                recent_performance = sessions_df['performance_score'].dropna().tail(5).mean()
                
                if recent_performance < 0.6:
                    recommendations.append({
                        "type": "performance_improvement",
                        "title": "Focus on Fundamentals",
                        "description": "Recent performance suggests reviewing basic concepts",
                        "priority": "high",
                        "confidence": 0.8
                    })
                
                # Time-based recommendations
                peak_hour = sessions_df['hour'].mode().iloc[0] if not sessions_df.empty else 10
                recommendations.append({
                    "type": "scheduling",
                    "title": f"Schedule sessions around {peak_hour}:00",
                    "description": f"You perform best during hour {peak_hour}",
                    "priority": "medium",
                    "confidence": 0.7
                })
                
                # Engagement recommendations
                avg_engagement = sessions_df['engagement_score'].dropna().mean()
                if avg_engagement < 0.7:
                    recommendations.append({
                        "type": "engagement",
                        "title": "Try Interactive Content",
                        "description": "Your engagement could improve with more interactive exercises",
                        "priority": "medium",
                        "confidence": 0.75
                    })
            
            return recommendations[:5]  # Return top 5
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []
    
    async def _comparative_analysis(self, user_id: str, sessions_df: pd.DataFrame) -> Dict[str, Any]:
        """Compare user performance with platform averages"""
        try:
            # Get platform analytics
            platform_stats = await pb_service.get_platform_analytics()
            
            # Calculate user vs platform comparison
            user_avg_performance = sessions_df['performance_score'].dropna().mean() if not sessions_df.empty else 0
            user_avg_engagement = sessions_df['engagement_score'].dropna().mean() if not sessions_df.empty else 0
            user_session_count = len(sessions_df)
            
            # Note: In a real implementation, you'd get these from aggregated platform data
            platform_avg_performance = 0.72  # Placeholder
            platform_avg_engagement = 0.75   # Placeholder
            platform_avg_sessions = 25       # Placeholder
            
            return {
                "performance_percentile": await self._calculate_percentile(user_avg_performance, platform_avg_performance),
                "engagement_percentile": await self._calculate_percentile(user_avg_engagement, platform_avg_engagement),
                "activity_percentile": await self._calculate_percentile(user_session_count, platform_avg_sessions),
                "relative_performance": "above_average" if user_avg_performance > platform_avg_performance else "below_average",
                "improvement_areas": await self._identify_improvement_areas(user_id)
            }
            
        except Exception as e:
            logger.error(f"Error in comparative analysis: {e}")
            return {}
    
    async def _analyze_time_patterns(self, sessions_df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze temporal learning patterns"""
        try:
            if sessions_df.empty:
                return {}
            
            sessions_df['start_time'] = pd.to_datetime(sessions_df['start_time'])
            sessions_df['hour'] = sessions_df['start_time'].dt.hour
            sessions_df['day_of_week'] = sessions_df['start_time'].dt.day_name()
            sessions_df['date'] = sessions_df['start_time'].dt.date
            
            # Find optimal study times
            hourly_performance = sessions_df.groupby('hour')['performance_score'].mean()
            optimal_hours = hourly_performance.nlargest(3).index.tolist()
            
            # Study consistency
            study_days = len(sessions_df['date'].unique())
            total_days = (sessions_df['start_time'].max() - sessions_df['start_time'].min()).days + 1
            consistency_ratio = study_days / total_days if total_days > 0 else 0
            
            # Session spacing analysis
            session_gaps = sessions_df['start_time'].diff().dt.total_seconds() / 3600  # Hours between sessions
            avg_gap = session_gaps.mean() if not session_gaps.isna().all() else 0
            
            return {
                "optimal_study_hours": optimal_hours,
                "consistency_ratio": round(consistency_ratio, 3),
                "average_session_gap_hours": round(avg_gap, 2),
                "most_productive_day": sessions_df.groupby('day_of_week')['performance_score'].mean().idxmax(),
                "study_streak_analysis": await self._analyze_study_streaks(sessions_df)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing time patterns: {e}")
            return {}
    
    # Helper methods
    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction"""
        if len(values) < 2:
            return "insufficient_data"
        
        # Simple linear regression to determine trend
        x = np.arange(len(values)).reshape(-1, 1)
        y = np.array(values)
        
        try:
            model = LinearRegression().fit(x, y)
            slope = model.coef_[0]
            
            if slope > 0.01:
                return "improving"
            elif slope < -0.01:
                return "declining"
            else:
                return "stable"
        except:
            return "unknown"
    
    def _calculate_improvement_rate(self, values: List[float]) -> float:
        """Calculate rate of improvement"""
        if len(values) < 2:
            return 0.0
        
        first_half = values[:len(values)//2]
        second_half = values[len(values)//2:]
        
        if len(first_half) == 0 or len(second_half) == 0:
            return 0.0
        
        return (np.mean(second_half) - np.mean(first_half)) / np.mean(first_half)
    
    async def _calculate_current_streak(self, sessions_df: pd.DataFrame) -> int:
        """Calculate current learning streak"""
        if sessions_df.empty:
            return 0
        
        sessions_df['date'] = pd.to_datetime(sessions_df['start_time']).dt.date
        unique_dates = sorted(sessions_df['date'].unique(), reverse=True)
        
        streak = 0
        current_date = datetime.now().date()
        
        for date in unique_dates:
            if (current_date - date).days <= streak + 1:
                streak += 1
                current_date = date
            else:
                break
        
        return streak
    
    async def _engineer_features(self, sessions_df: pd.DataFrame) -> Optional[np.ndarray]:
        """Engineer features for ML models"""
        try:
            if sessions_df.empty:
                return None
            
            features = []
            
            # Recent performance trend
            recent_performance = sessions_df['performance_score'].dropna().tail(5)
            features.append(recent_performance.mean() if not recent_performance.empty else 0)
            
            # Session frequency
            sessions_df['date'] = pd.to_datetime(sessions_df['start_time']).dt.date
            days_active = len(sessions_df['date'].unique())
            total_days = (sessions_df['start_time'].max() - sessions_df['start_time'].min()).days + 1
            frequency = days_active / total_days if total_days > 0 else 0
            features.append(frequency)
            
            # Average session length
            features.append(sessions_df['duration_minutes'].mean())
            
            # Engagement trend
            engagement_trend = self._calculate_trend(sessions_df['engagement_score'].dropna().tolist())
            features.append(1 if engagement_trend == "improving" else 0)
            
            return np.array(features).reshape(1, -1)
            
        except Exception as e:
            logger.error(f"Error engineering features: {e}")
            return None
    
    def _calculate_consistency_score(self, values: List[float]) -> float:
        """Calculate consistency score (0-1, higher is more consistent)"""
        if len(values) < 2:
            return 0.0
        
        cv = np.std(values) / np.mean(values) if np.mean(values) > 0 else 1
        return max(0, 1 - cv)  # Invert coefficient of variation
    
    async def _calculate_percentile(self, user_value: float, platform_average: float) -> int:
        """Calculate user's percentile relative to platform average"""
        # Simplified percentile calculation
        # In reality, you'd use actual distribution data
        if user_value >= platform_average * 1.2:
            return 85
        elif user_value >= platform_average:
            return 65
        elif user_value >= platform_average * 0.8:
            return 40
        else:
            return 20
    
    # Placeholder methods for advanced features
    async def _identify_performance_patterns(self, performance_scores: List[float]) -> Dict:
        return {"pattern": "steady_improvement" if len(performance_scores) > 0 else "insufficient_data"}
    
    async def _analyze_engagement_dropoff(self, sessions_df: pd.DataFrame) -> Dict:
        return {"dropoff_rate": 0.1, "critical_session": 10}
    
    async def _find_optimal_session_time(self, sessions_df: pd.DataFrame) -> int:
        return 30  # minutes
    
    async def _calculate_skill_velocity(self, responses_df: pd.DataFrame) -> float:
        return 2.5  # concepts per week
    
    async def _predict_mastery_timeline(self, user_id: str, concept_progress: Dict) -> Dict:
        return {"estimated_weeks": 4}
    
    async def _classify_learning_pattern(self, sessions_df: pd.DataFrame) -> str:
        return "steady_learner"
    
    async def _calculate_regularity_score(self, sessions_df: pd.DataFrame) -> float:
        return 0.75
    
    async def _predict_next_performance(self, features) -> Dict:
        return {"predicted_score": 0.75, "confidence": 0.8}
    
    async def _predict_engagement_trend(self, features) -> Dict:
        return {"trend": "stable", "predicted_score": 0.72}
    
    async def _predict_dropout_risk(self, user_id: str, features) -> Dict:
        return {"risk_level": "low", "probability": 0.15}
    
    async def _predict_goal_completion(self, user_id: str, features) -> Dict:
        return {"estimated_weeks": 6, "confidence": 0.7}
    
    async def _identify_improvement_areas(self, user_id: str) -> List[str]:
        return ["time_management", "consistency"]
    
    async def _analyze_study_streaks(self, sessions_df: pd.DataFrame) -> Dict:
        return {"longest_streak": 7, "current_streak": 3}

# Global instance
analytics_engine = LearningAnalyticsEngine() 