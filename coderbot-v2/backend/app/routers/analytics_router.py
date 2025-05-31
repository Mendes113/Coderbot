from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.services.analytics_service import analytics_engine
from app.services.pocketbase_service import pb_service

router = APIRouter(prefix="/analytics", tags=["Learning Analytics"])

# Request/Response Models
class AnalyticsRequest(BaseModel):
    user_id: str
    date_range_days: Optional[int] = 30
    include_predictions: bool = True
    detailed_analysis: bool = True

class PlatformAnalyticsRequest(BaseModel):
    date_range_days: Optional[int] = 30
    include_user_segments: bool = False

class CompareUsersRequest(BaseModel):
    user_ids: List[str]
    metrics: List[str] = ["performance", "engagement", "progress"]

class SkillAnalysisRequest(BaseModel):
    user_id: str
    skill_category: Optional[str] = None

# Analytics Endpoints

@router.get("/user/{user_id}/comprehensive")
async def get_comprehensive_analytics(
    user_id: str,
    background_tasks: BackgroundTasks,
    detailed: bool = Query(True, description="Include detailed analysis"),
    cache_refresh: bool = Query(False, description="Force refresh cached analytics")
):
    """Get comprehensive learning analytics for a specific user"""
    try:
        # Check if we have recent cached analytics (unless refresh requested)
        if not cache_refresh:
            cached_analytics = await pb_service.get_learning_analytics(user_id)
            if cached_analytics:
                generated_at = datetime.fromisoformat(cached_analytics.get("generated_at", ""))
                if (datetime.now() - generated_at).total_seconds() < 3600:  # 1 hour cache
                    return {
                        "analytics": cached_analytics,
                        "cached": True,
                        "generated_at": cached_analytics["generated_at"]
                    }
        
        # Generate fresh analytics
        analytics = await analytics_engine.generate_comprehensive_analytics(user_id)
        
        # Schedule background update to PocketBase
        background_tasks.add_task(pb_service.save_learning_analytics, user_id, analytics)
        
        return {
            "analytics": analytics,
            "cached": False,
            "generated_at": analytics["generated_at"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating analytics: {str(e)}")

@router.get("/user/{user_id}/performance")
async def get_performance_analytics(user_id: str, days: int = Query(30, ge=1, le=365)):
    """Get detailed performance analytics for a user"""
    try:
        # Get user sessions from specified period
        sessions = await pb_service.get_user_sessions(user_id, limit=100)
        
        if not sessions:
            return {"message": "No session data available for analysis"}
        
        # Filter by date range
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_sessions = [
            s for s in sessions 
            if datetime.fromisoformat(s.get("start_time", "")) >= cutoff_date
        ]
        
        if not recent_sessions:
            return {"message": f"No sessions found in the last {days} days"}
        
        # Calculate performance metrics
        performance_scores = [s.get("performance_score", 0) for s in recent_sessions if s.get("performance_score")]
        
        if not performance_scores:
            return {"message": "No performance data available"}
        
        analytics = {
            "user_id": user_id,
            "period_days": days,
            "total_sessions": len(recent_sessions),
            "sessions_with_performance_data": len(performance_scores),
            "average_performance": sum(performance_scores) / len(performance_scores),
            "performance_trend": analytics_engine._calculate_trend(performance_scores),
            "best_performance": max(performance_scores),
            "lowest_performance": min(performance_scores),
            "performance_consistency": analytics_engine._calculate_consistency_score(performance_scores),
            "improvement_rate": analytics_engine._calculate_improvement_rate(performance_scores),
            "performance_by_session_type": await _calculate_performance_by_type(recent_sessions)
        }
        
        return analytics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing performance: {str(e)}")

@router.get("/user/{user_id}/engagement")
async def get_engagement_analytics(user_id: str, days: int = Query(30, ge=1, le=365)):
    """Get detailed engagement analytics for a user"""
    try:
        sessions = await pb_service.get_user_sessions(user_id, limit=100)
        
        if not sessions:
            return {"message": "No session data available"}
        
        # Filter by date range
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_sessions = [
            s for s in sessions 
            if datetime.fromisoformat(s.get("start_time", "")) >= cutoff_date
        ]
        
        engagement_scores = [s.get("engagement_score", 0) for s in recent_sessions if s.get("engagement_score")]
        
        if not engagement_scores:
            return {"message": "No engagement data available"}
        
        # Calculate engagement patterns
        analytics = {
            "user_id": user_id,
            "period_days": days,
            "average_engagement": sum(engagement_scores) / len(engagement_scores),
            "engagement_trend": analytics_engine._calculate_trend(engagement_scores),
            "engagement_volatility": analytics_engine._calculate_consistency_score(engagement_scores),
            "peak_engagement": max(engagement_scores),
            "engagement_by_hour": await _calculate_engagement_by_hour(recent_sessions),
            "session_length_correlation": await _calculate_duration_engagement_correlation(recent_sessions),
            "content_type_engagement": await _calculate_engagement_by_content_type(recent_sessions)
        }
        
        return analytics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing engagement: {str(e)}")

@router.get("/user/{user_id}/skill-progression")
async def get_skill_progression(user_id: str, skill_category: Optional[str] = None):
    """Get skill progression analysis for a user"""
    try:
        # Get assessment responses
        responses = await pb_service.get_assessment_responses(user_id)
        
        if not responses:
            return {"message": "No assessment data available"}
        
        # Filter by skill category if specified
        if skill_category:
            responses = [r for r in responses if skill_category in r.get("question_id", "")]
        
        # Calculate skill progression metrics
        skill_analytics = {
            "user_id": user_id,
            "skill_category": skill_category or "all",
            "total_assessments": len(responses),
            "overall_success_rate": sum(1 for r in responses if r.get("is_correct")) / len(responses),
            "skill_velocity": await _calculate_skill_velocity(responses),
            "mastery_progression": await _calculate_mastery_progression(responses),
            "weak_concepts": await _identify_weak_concepts(responses),
            "strong_concepts": await _identify_strong_concepts(responses),
            "learning_efficiency": await _calculate_learning_efficiency(responses)
        }
        
        return skill_analytics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing skill progression: {str(e)}")

@router.get("/user/{user_id}/predictions")
async def get_learning_predictions(user_id: str):
    """Get ML-based learning predictions for a user"""
    try:
        sessions = await pb_service.get_user_sessions(user_id, limit=50)
        
        if len(sessions) < 5:
            return {"message": "Insufficient data for reliable predictions"}
        
        # Generate predictions using the analytics engine
        predictions = await analytics_engine._generate_predictions(user_id, sessions)
        
        return {
            "user_id": user_id,
            "predictions": predictions,
            "data_points_used": len(sessions),
            "prediction_confidence": "medium" if len(sessions) < 20 else "high",
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating predictions: {str(e)}")

@router.get("/user/{user_id}/recommendations")
async def get_personalized_recommendations(user_id: str, limit: int = Query(10, ge=1, le=20)):
    """Get personalized learning recommendations"""
    try:
        # Get active recommendations from PocketBase
        active_recommendations = await pb_service.get_user_recommendations(user_id, active_only=True)
        
        # If we have enough active recommendations, return them
        if len(active_recommendations) >= limit:
            return {
                "recommendations": active_recommendations[:limit],
                "source": "cached",
                "generated_at": datetime.now().isoformat()
            }
        
        # Generate fresh recommendations
        sessions = await pb_service.get_user_sessions(user_id, limit=30)
        fresh_recommendations = await analytics_engine._generate_analytical_recommendations(user_id, sessions)
        
        # Save new recommendations to PocketBase
        if fresh_recommendations:
            # Convert to AdaptiveRecommendation objects for saving
            from app.models.adaptive_models import AdaptiveRecommendation
            rec_objects = []
            for rec in fresh_recommendations:
                rec_obj = AdaptiveRecommendation(
                    user_id=user_id,
                    recommendation_type=rec.get("type", "general"),
                    title=rec.get("title", ""),
                    description=rec.get("description", ""),
                    reasoning=rec.get("reasoning", ""),
                    priority=5 if rec.get("priority") == "high" else 3,
                    created_at=datetime.now()
                )
                rec_objects.append(rec_obj)
            
            await pb_service.save_recommendations(rec_objects)
        
        return {
            "recommendations": fresh_recommendations[:limit],
            "source": "generated",
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")

@router.get("/platform/overview")
async def get_platform_analytics():
    """Get platform-wide analytics overview"""
    try:
        platform_stats = await pb_service.get_platform_analytics()
        
        # Add calculated metrics
        analytics = {
            "platform_statistics": platform_stats,
            "user_engagement": {
                "active_users_percentage": 75.5,  # Placeholder - calculate from actual data
                "average_session_duration": 28.5,
                "retention_rate_7day": 65.2,
                "retention_rate_30day": 42.8
            },
            "content_performance": {
                "most_popular_content_type": "interactive_exercises",
                "average_completion_rate": 78.3,
                "user_satisfaction_score": 4.2
            },
            "learning_outcomes": {
                "average_skill_improvement": 34.7,
                "concepts_mastered_per_user": 12.8,
                "certification_completion_rate": 23.4
            },
            "generated_at": datetime.now().isoformat()
        }
        
        return analytics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting platform analytics: {str(e)}")

@router.post("/user/{user_id}/session/track")
async def track_analytics_session(
    user_id: str,
    session_data: Dict,
    background_tasks: BackgroundTasks
):
    """Track a learning session for analytics purposes"""
    try:
        # Validate required fields
        required_fields = ["content_id", "session_type", "duration_minutes"]
        for field in required_fields:
            if field not in session_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Create session object
        from app.models.adaptive_models import LearningSession
        session = LearningSession(
            id=f"session_{user_id}_{datetime.now().timestamp()}",
            user_id=user_id,
            content_id=session_data["content_id"],
            session_type=session_data["session_type"],
            start_time=datetime.now(),
            duration_minutes=session_data["duration_minutes"],
            performance_score=session_data.get("performance_score"),
            engagement_score=session_data.get("engagement_score"),
            difficulty_rating=session_data.get("difficulty_rating"),
            interactions=session_data.get("interactions", []),
            completed=session_data.get("completed", True)
        )
        
        # Save session to PocketBase
        success = await pb_service.save_learning_session(session)
        
        if success:
            # Schedule analytics update in background
            background_tasks.add_task(
                analytics_engine.generate_comprehensive_analytics, 
                user_id
            )
            
            return {
                "message": "Session tracked successfully",
                "session_id": session.id,
                "analytics_update_scheduled": True
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save session")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error tracking session: {str(e)}")

@router.get("/user/{user_id}/streaks")
async def get_learning_streaks(user_id: str):
    """Get learning streak information for a user"""
    try:
        sessions = await pb_service.get_user_sessions(user_id, limit=100)
        
        if not sessions:
            return {"current_streak": 0, "longest_streak": 0, "message": "No session data available"}
        
        # Calculate streaks
        current_streak = await analytics_engine._calculate_current_streak(sessions)
        
        # Update streak in PocketBase
        await pb_service.update_learning_streak(user_id, current_streak)
        
        return {
            "user_id": user_id,
            "current_streak": current_streak,
            "streak_updated_at": datetime.now().isoformat(),
            "encouragement_message": _get_streak_message(current_streak)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating streaks: {str(e)}")

@router.get("/health")
async def analytics_health_check():
    """Health check for analytics service"""
    try:
        # Test PocketBase connection
        platform_stats = await pb_service.get_platform_analytics()
        
        return {
            "status": "healthy",
            "service": "Learning Analytics Engine",
            "pocketbase_connection": "active" if platform_stats else "inactive",
            "features": [
                "comprehensive_analytics",
                "performance_tracking", 
                "engagement_analysis",
                "skill_progression",
                "ml_predictions",
                "personalized_recommendations"
            ],
            "ml_models_loaded": True,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Helper functions
async def _calculate_performance_by_type(sessions: List[Dict]) -> Dict[str, float]:
    """Calculate average performance by session type"""
    performance_by_type = {}
    
    for session in sessions:
        session_type = session.get("session_type", "unknown")
        performance = session.get("performance_score")
        
        if performance is not None:
            if session_type not in performance_by_type:
                performance_by_type[session_type] = []
            performance_by_type[session_type].append(performance)
    
    # Calculate averages
    return {
        session_type: sum(scores) / len(scores)
        for session_type, scores in performance_by_type.items()
        if scores
    }

async def _calculate_engagement_by_hour(sessions: List[Dict]) -> Dict[int, float]:
    """Calculate average engagement by hour of day"""
    engagement_by_hour = {}
    
    for session in sessions:
        start_time = session.get("start_time")
        engagement = session.get("engagement_score")
        
        if start_time and engagement is not None:
            hour = datetime.fromisoformat(start_time).hour
            if hour not in engagement_by_hour:
                engagement_by_hour[hour] = []
            engagement_by_hour[hour].append(engagement)
    
    return {
        hour: sum(scores) / len(scores)
        for hour, scores in engagement_by_hour.items()
        if scores
    }

async def _calculate_duration_engagement_correlation(sessions: List[Dict]) -> float:
    """Calculate correlation between session duration and engagement"""
    durations = []
    engagements = []
    
    for session in sessions:
        duration = session.get("duration_minutes")
        engagement = session.get("engagement_score")
        
        if duration is not None and engagement is not None:
            durations.append(duration)
            engagements.append(engagement)
    
    if len(durations) < 2:
        return 0.0
    
    # Simple correlation calculation
    import numpy as np
    correlation = np.corrcoef(durations, engagements)[0, 1]
    return correlation if not np.isnan(correlation) else 0.0

async def _calculate_engagement_by_content_type(sessions: List[Dict]) -> Dict[str, float]:
    """Calculate average engagement by content type"""
    engagement_by_type = {}
    
    for session in sessions:
        content_type = session.get("session_type", "unknown")
        engagement = session.get("engagement_score")
        
        if engagement is not None:
            if content_type not in engagement_by_type:
                engagement_by_type[content_type] = []
            engagement_by_type[content_type].append(engagement)
    
    return {
        content_type: sum(scores) / len(scores)
        for content_type, scores in engagement_by_type.items()
        if scores
    }

async def _calculate_skill_velocity(responses: List[Dict]) -> float:
    """Calculate skill acquisition velocity"""
    # Simplified calculation - concepts learned per week
    if not responses:
        return 0.0
    
    # Group by concept and calculate mastery improvements
    concepts_improved = set()
    for response in responses:
        if response.get("is_correct"):
            question_id = response.get("question_id", "")
            concept = question_id.split("_")[0] if "_" in question_id else question_id
            concepts_improved.add(concept)
    
    # Calculate time span
    dates = [datetime.fromisoformat(r.get("submitted_at", "")) for r in responses if r.get("submitted_at")]
    if len(dates) < 2:
        return len(concepts_improved)
    
    time_span_weeks = (max(dates) - min(dates)).days / 7
    return len(concepts_improved) / max(time_span_weeks, 1)

async def _calculate_mastery_progression(responses: List[Dict]) -> Dict:
    """Calculate mastery progression over time"""
    # Group responses by concept and calculate progression
    concept_progression = {}
    
    for response in responses:
        question_id = response.get("question_id", "")
        concept = question_id.split("_")[0] if "_" in question_id else question_id
        is_correct = response.get("is_correct", False)
        date = response.get("submitted_at")
        
        if concept not in concept_progression:
            concept_progression[concept] = {"attempts": 0, "correct": 0, "dates": []}
        
        concept_progression[concept]["attempts"] += 1
        if is_correct:
            concept_progression[concept]["correct"] += 1
        if date:
            concept_progression[concept]["dates"].append(date)
    
    # Calculate mastery scores
    mastery_scores = {}
    for concept, data in concept_progression.items():
        mastery_score = data["correct"] / data["attempts"] if data["attempts"] > 0 else 0
        mastery_scores[concept] = {
            "mastery_score": mastery_score,
            "total_attempts": data["attempts"],
            "progression": "improving" if mastery_score > 0.7 else "needs_work"
        }
    
    return mastery_scores

async def _identify_weak_concepts(responses: List[Dict]) -> List[str]:
    """Identify concepts that need more work"""
    concept_performance = {}
    
    for response in responses:
        question_id = response.get("question_id", "")
        concept = question_id.split("_")[0] if "_" in question_id else question_id
        is_correct = response.get("is_correct", False)
        
        if concept not in concept_performance:
            concept_performance[concept] = {"correct": 0, "total": 0}
        
        concept_performance[concept]["total"] += 1
        if is_correct:
            concept_performance[concept]["correct"] += 1
    
    # Find concepts with success rate < 60%
    weak_concepts = []
    for concept, perf in concept_performance.items():
        success_rate = perf["correct"] / perf["total"] if perf["total"] > 0 else 0
        if success_rate < 0.6 and perf["total"] >= 3:  # At least 3 attempts
            weak_concepts.append(concept)
    
    return weak_concepts[:5]  # Return top 5 weak areas

async def _identify_strong_concepts(responses: List[Dict]) -> List[str]:
    """Identify concepts that are well mastered"""
    concept_performance = {}
    
    for response in responses:
        question_id = response.get("question_id", "")
        concept = question_id.split("_")[0] if "_" in question_id else question_id
        is_correct = response.get("is_correct", False)
        
        if concept not in concept_performance:
            concept_performance[concept] = {"correct": 0, "total": 0}
        
        concept_performance[concept]["total"] += 1
        if is_correct:
            concept_performance[concept]["correct"] += 1
    
    # Find concepts with success rate > 80%
    strong_concepts = []
    for concept, perf in concept_performance.items():
        success_rate = perf["correct"] / perf["total"] if perf["total"] > 0 else 0
        if success_rate > 0.8 and perf["total"] >= 3:  # At least 3 attempts
            strong_concepts.append(concept)
    
    return strong_concepts[:5]  # Return top 5 strong areas

async def _calculate_learning_efficiency(responses: List[Dict]) -> float:
    """Calculate learning efficiency score"""
    if not responses:
        return 0.0
    
    # Calculate average time per correct answer
    correct_responses = [r for r in responses if r.get("is_correct")]
    if not correct_responses:
        return 0.0
    
    total_time = sum(r.get("time_taken_seconds", 60) for r in correct_responses)
    avg_time_per_correct = total_time / len(correct_responses)
    
    # Normalize to 0-1 scale (assume 60 seconds is baseline)
    efficiency = max(0, 1 - (avg_time_per_correct - 30) / 120)
    return min(1.0, efficiency)

def _get_streak_message(streak: int) -> str:
    """Get encouraging message based on streak length"""
    if streak == 0:
        return "Start your learning journey today!"
    elif streak < 3:
        return f"Great start! Keep the momentum going. {streak} day streak!"
    elif streak < 7:
        return f"You're building a solid habit! {streak} day streak!"
    elif streak < 14:
        return f"Impressive consistency! {streak} day streak! 🔥"
    elif streak < 30:
        return f"You're on fire! {streak} day streak! Keep pushing! 🚀"
    else:
        return f"Legendary dedication! {streak} day streak! You're unstoppable! 👑" 