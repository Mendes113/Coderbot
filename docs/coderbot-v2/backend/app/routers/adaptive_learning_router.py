from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Dict, Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.adaptive_models import (
    UserLearningProfile, PersonalizedLearningPath, AssessmentQuestion,
    AssessmentResponse, AdaptiveRecommendation, LearningSession,
    SkillMatrix, ConceptMastery, LearningStyle, DifficultyLevel
)
from app.services.adaptive_learning_service import AdaptiveLearningEngine
from app.services.pocketbase_service import pb_service

router = APIRouter(prefix="/adaptive", tags=["Adaptive Learning"])

# Initialize the adaptive learning engine
adaptive_engine = AdaptiveLearningEngine()

# Request/Response Models
class LearningStyleAssessmentRequest(BaseModel):
    user_responses: List[Dict]

class CreateLearningPathRequest(BaseModel):
    user_id: str
    target_skills: List[str]
    learning_goals: Optional[List[str]] = []

class AssessmentSubmissionRequest(BaseModel):
    user_id: str
    assessment_id: str
    responses: List[AssessmentResponse]

class UpdateLearningProfileRequest(BaseModel):
    user_id: str
    learning_style: Optional[LearningStyle] = None
    pace_preference: Optional[str] = None
    preferred_difficulty: Optional[DifficultyLevel] = None
    learning_goals: Optional[List[str]] = None

class LearningSessionRequest(BaseModel):
    user_id: str
    content_id: str
    session_type: str
    duration_minutes: int
    performance_score: Optional[float] = None
    engagement_score: Optional[float] = None
    difficulty_rating: Optional[int] = None

@router.post("/assess-learning-style", response_model=LearningStyle)
async def assess_learning_style(request: LearningStyleAssessmentRequest):
    """Assess user's learning style based on their responses"""
    try:
        learning_style = adaptive_engine.assess_learning_style(request.user_responses)
        return learning_style
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error assessing learning style: {str(e)}")

@router.post("/profile", response_model=Dict)
async def create_or_update_profile(request: UpdateLearningProfileRequest):
    """Create or update a user's learning profile"""
    try:
        # Get existing profile from PocketBase
        existing_profile_data = await pb_service.get_user_profile(request.user_id)
        
        if existing_profile_data:
            # Update existing profile
            import json
            
            # Parse the existing data
            concept_masteries = json.loads(existing_profile_data.get('concept_masteries', '{}'))
            
            profile = UserLearningProfile(
                user_id=request.user_id,
                learning_style=LearningStyle(existing_profile_data.get('learning_style', 'visual')),
                pace_preference=existing_profile_data.get('pace_preference', 'normal'),
                preferred_difficulty=DifficultyLevel(existing_profile_data.get('preferred_difficulty', 'beginner')),
                current_streak=existing_profile_data.get('current_streak', 0),
                total_study_time_hours=existing_profile_data.get('total_study_time_hours', 0.0),
                concept_masteries=concept_masteries,
                learning_goals=json.loads(existing_profile_data.get('learning_goals', '[]')),
                weak_areas=json.loads(existing_profile_data.get('weak_areas', '[]')),
                strong_areas=json.loads(existing_profile_data.get('strong_areas', '[]')),
                cognitive_load_capacity=existing_profile_data.get('cognitive_load_capacity', 0.7)
            )
            
            # Update with new values if provided
            if request.learning_style:
                profile.learning_style = request.learning_style
            if request.pace_preference:
                profile.pace_preference = request.pace_preference
            if request.preferred_difficulty:
                profile.preferred_difficulty = request.preferred_difficulty
            if request.learning_goals:
                profile.learning_goals = request.learning_goals
        else:
            # Create new profile with defaults
            profile = UserLearningProfile(
                user_id=request.user_id,
                learning_style=request.learning_style or LearningStyle.VISUAL,
                pace_preference=request.pace_preference or "normal",
                preferred_difficulty=request.preferred_difficulty or DifficultyLevel.BEGINNER,
                learning_goals=request.learning_goals or []
            )
        
        # Save to PocketBase
        success = await pb_service.save_user_profile(profile)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save profile to database")
        
        return {
            "message": "Profile saved successfully",
            "user_id": profile.user_id,
            "learning_style": profile.learning_style.value,
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")

@router.get("/profile/{user_id}")
async def get_user_profile(user_id: str):
    """Get user's learning profile"""
    try:
        profile_data = await pb_service.get_user_profile(user_id)
        if not profile_data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return {
            "user_id": profile_data.get("user_id"),
            "learning_style": profile_data.get("learning_style"),
            "pace_preference": profile_data.get("pace_preference"),
            "preferred_difficulty": profile_data.get("preferred_difficulty"),
            "current_streak": profile_data.get("current_streak", 0),
            "total_study_time_hours": profile_data.get("total_study_time_hours", 0.0),
            "learning_goals": profile_data.get("learning_goals", "[]"),
            "weak_areas": profile_data.get("weak_areas", "[]"),
            "strong_areas": profile_data.get("strong_areas", "[]"),
            "cognitive_load_capacity": profile_data.get("cognitive_load_capacity", 0.7)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving profile: {str(e)}")

@router.post("/learning-path", response_model=Dict)
async def create_learning_path(request: CreateLearningPathRequest, background_tasks: BackgroundTasks):
    """Generate a personalized learning path for the user"""
    try:
        # Get user profile from PocketBase
        profile_data = await pb_service.get_user_profile(request.user_id)
        if not profile_data:
            raise HTTPException(status_code=404, detail="User profile not found. Create profile first.")
        
        # Convert profile data to UserLearningProfile object
        import json
        profile = UserLearningProfile(
            user_id=request.user_id,
            learning_style=LearningStyle(profile_data.get('learning_style', 'visual')),
            pace_preference=profile_data.get('pace_preference', 'normal'),
            preferred_difficulty=DifficultyLevel(profile_data.get('preferred_difficulty', 'beginner')),
            current_streak=profile_data.get('current_streak', 0),
            total_study_time_hours=profile_data.get('total_study_time_hours', 0.0),
            concept_masteries=json.loads(profile_data.get('concept_masteries', '{}')),
            learning_goals=json.loads(profile_data.get('learning_goals', '[]')),
            weak_areas=json.loads(profile_data.get('weak_areas', '[]')),
            strong_areas=json.loads(profile_data.get('strong_areas', '[]')),
            cognitive_load_capacity=profile_data.get('cognitive_load_capacity', 0.7)
        )
        
        # Update learning goals if provided
        if request.learning_goals:
            profile.learning_goals = request.learning_goals
            # Save updated profile in background
            background_tasks.add_task(pb_service.save_user_profile, profile)
        
        # Generate learning path
        learning_path = adaptive_engine.generate_personalized_learning_path(
            profile, request.target_skills
        )
        
        # Save learning path to PocketBase
        success = await pb_service.save_learning_path(learning_path)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save learning path")
        
        return {
            "message": "Learning path created successfully",
            "path_id": learning_path.id,
            "estimated_completion_hours": learning_path.estimated_completion_hours,
            "objectives_count": len(learning_path.objectives),
            "created_at": learning_path.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating learning path: {str(e)}")

@router.get("/learning-path/{path_id}")
async def get_learning_path(path_id: str):
    """Get a specific learning path"""
    try:
        # Note: You'd need to implement get_learning_path_by_id in PocketBase service
        # For now, we'll get user paths and filter
        all_paths = await pb_service.get_user_learning_paths("")  # This needs to be updated
        path_data = next((p for p in all_paths if p.get("path_id") == path_id), None)
        
        if not path_data:
            raise HTTPException(status_code=404, detail="Learning path not found")
        
        return path_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving learning path: {str(e)}")

@router.get("/learning-paths/user/{user_id}")
async def get_user_learning_paths(user_id: str):
    """Get all learning paths for a user"""
    try:
        user_paths = await pb_service.get_user_learning_paths(user_id)
        return {
            "user_id": user_id,
            "total_paths": len(user_paths),
            "learning_paths": user_paths
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving learning paths: {str(e)}")

@router.post("/assessment/submit")
async def submit_assessment(request: AssessmentSubmissionRequest, background_tasks: BackgroundTasks):
    """Submit assessment responses and update user profile"""
    try:
        # Save assessment responses to PocketBase
        success = await pb_service.save_assessment_responses(
            request.user_id, request.assessment_id, request.responses
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save assessment responses")
        
        # Get user profile
        profile_data = await pb_service.get_user_profile(request.user_id)
        if not profile_data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Convert to UserLearningProfile object
        import json
        
        def safe_json_loads(value, default):
            """Safely parse JSON, handling cases where value is already parsed"""
            if isinstance(value, (dict, list)):
                return value
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    return default
            return default
        
        profile = UserLearningProfile(
            user_id=request.user_id,
            learning_style=LearningStyle(profile_data.get('learning_style', 'visual')),
            pace_preference=profile_data.get('pace_preference', 'normal'),
            preferred_difficulty=DifficultyLevel(profile_data.get('preferred_difficulty', 'beginner')),
            current_streak=profile_data.get('current_streak', 0),
            total_study_time_hours=profile_data.get('total_study_time_hours', 0.0),
            concept_masteries=safe_json_loads(profile_data.get('concept_masteries', '{}'), {}),
            learning_goals=safe_json_loads(profile_data.get('learning_goals', '[]'), []),
            weak_areas=safe_json_loads(profile_data.get('weak_areas', '[]'), []),
            strong_areas=safe_json_loads(profile_data.get('strong_areas', '[]'), []),
            cognitive_load_capacity=profile_data.get('cognitive_load_capacity', 0.7)
        )
        
        # Group responses by concept and update concept masteries
        concept_responses = {}
        for response in request.responses:
            # Extract concept from question_id (you may need to adjust this logic)
            concept_id = f"concept_{response.question_id.split('_')[0]}"
            if concept_id not in concept_responses:
                concept_responses[concept_id] = []
            concept_responses[concept_id].append(response)
        
        # Update concept masteries
        for concept_id, responses in concept_responses.items():
            mastery = adaptive_engine.calculate_concept_mastery(responses, concept_id)
            profile.concept_masteries[concept_id] = mastery
        
        # Update weak and strong areas
        masteries = profile.concept_masteries
        sorted_concepts = sorted(masteries.items(), key=lambda x: x[1].confidence_score)
        
        profile.weak_areas = [concept for concept, _ in sorted_concepts[:3]]
        profile.strong_areas = [concept for concept, _ in sorted_concepts[-3:]]
        
        # Save updated profile in background
        background_tasks.add_task(pb_service.save_user_profile, profile)
        
        return {
            "message": "Assessment submitted successfully", 
            "updated_masteries": len(concept_responses),
            "weak_areas_updated": len(profile.weak_areas),
            "strong_areas_updated": len(profile.strong_areas)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting assessment: {str(e)}")

@router.get("/recommendations/{user_id}")
async def get_recommendations(user_id: str):
    """Get personalized recommendations for a user"""
    try:
        # Get cached recommendations from PocketBase
        cached_recommendations = await pb_service.get_user_recommendations(user_id, active_only=True)
        
        if cached_recommendations:
            return {
                "recommendations": cached_recommendations,
                "source": "cached",
                "count": len(cached_recommendations)
            }
        
        # Generate fresh recommendations if no cached ones
        profile_data = await pb_service.get_user_profile(user_id)
        if not profile_data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Get recent sessions
        recent_sessions = await pb_service.get_user_sessions(user_id, limit=10)
        
        # Convert sessions to LearningSession objects for the engine
        import json
        session_objects = []
        for session_data in recent_sessions:
            session = LearningSession(
                id=session_data.get("session_id", ""),
                user_id=session_data.get("user_id", ""),
                content_id=session_data.get("content_id", ""),
                session_type=session_data.get("session_type", ""),
                start_time=datetime.fromisoformat(session_data.get("start_time", "")),
                duration_minutes=session_data.get("duration_minutes", 0),
                performance_score=session_data.get("performance_score"),
                engagement_score=session_data.get("engagement_score"),
                difficulty_rating=session_data.get("difficulty_rating"),
                completed=session_data.get("completed", True)
            )
            session_objects.append(session)
        
        # Convert profile data to UserLearningProfile
        def safe_json_loads(value, default):
            """Safely parse JSON, handling cases where value is already parsed"""
            if isinstance(value, (dict, list)):
                return value
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    return default
            return default
        
        profile = UserLearningProfile(
            user_id=user_id,
            learning_style=LearningStyle(profile_data.get('learning_style', 'visual')),
            pace_preference=profile_data.get('pace_preference', 'normal'),
            preferred_difficulty=DifficultyLevel(profile_data.get('preferred_difficulty', 'beginner')),
            current_streak=profile_data.get('current_streak', 0),
            total_study_time_hours=profile_data.get('total_study_time_hours', 0.0),
            concept_masteries=safe_json_loads(profile_data.get('concept_masteries', '{}'), {}),
            learning_goals=safe_json_loads(profile_data.get('learning_goals', '[]'), []),
            weak_areas=safe_json_loads(profile_data.get('weak_areas', '[]'), []),
            strong_areas=safe_json_loads(profile_data.get('strong_areas', '[]'), []),
            cognitive_load_capacity=profile_data.get('cognitive_load_capacity', 0.7)
        )
        
        # Generate recommendations
        recommendations = adaptive_engine.generate_adaptive_recommendations(profile, session_objects)
        
        # Save recommendations to PocketBase
        if recommendations:
            await pb_service.save_recommendations(recommendations)
        
        return {
            "recommendations": [rec.dict() for rec in recommendations],
            "source": "generated",
            "count": len(recommendations)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")

@router.post("/session/track")
async def track_learning_session(request: LearningSessionRequest, background_tasks: BackgroundTasks):
    """Track a learning session for analytics and adaptation"""
    try:
        # Create session object
        session = LearningSession(
            id=f"session_{request.user_id}_{datetime.now().timestamp()}",
            user_id=request.user_id,
            content_id=request.content_id,
            session_type=request.session_type,
            start_time=datetime.now(),
            duration_minutes=request.duration_minutes,
            performance_score=request.performance_score,
            engagement_score=request.engagement_score,
            difficulty_rating=request.difficulty_rating,
            completed=True
        )
        
        # Save session to PocketBase
        success = await pb_service.save_learning_session(session)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save session")
        
        # Update user profile statistics in background
        background_tasks.add_task(_update_user_stats, request.user_id, request.duration_minutes)
        
        return {
            "message": "Session tracked successfully", 
            "session_id": session.id,
            "analytics_update_scheduled": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error tracking session: {str(e)}")

@router.get("/analytics/{user_id}")
async def get_user_analytics(user_id: str):
    """Get comprehensive analytics for a user"""
    try:
        # Get cached analytics from PocketBase
        cached_analytics = await pb_service.get_learning_analytics(user_id)
        
        if cached_analytics:
            return {
                "analytics": cached_analytics,
                "source": "cached",
                "generated_at": cached_analytics.get("generated_at")
            }
        
        # If no cached analytics, return basic stats
        profile_data = await pb_service.get_user_profile(user_id)
        sessions = await pb_service.get_user_sessions(user_id, limit=50)
        
        if not profile_data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Calculate basic analytics
        total_sessions = len(sessions)
        total_time = sum(s.get("duration_minutes", 0) for s in sessions) / 60.0  # hours
        
        performance_scores = [s.get("performance_score") for s in sessions if s.get("performance_score")]
        avg_performance = sum(performance_scores) / len(performance_scores) if performance_scores else 0
        
        return {
            "user_id": user_id,
            "total_sessions": total_sessions,
            "total_study_time_hours": round(total_time, 2),
            "current_streak": profile_data.get("current_streak", 0),
            "learning_style": profile_data.get("learning_style", "unknown"),
            "average_performance": round(avg_performance, 3),
            "weak_areas": profile_data.get("weak_areas", "[]"),
            "strong_areas": profile_data.get("strong_areas", "[]"),
            "learning_goals": profile_data.get("learning_goals", "[]"),
            "source": "basic_calculation",
            "note": "For detailed analytics, use /analytics endpoints"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating analytics: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test PocketBase connection
        platform_stats = await pb_service.get_platform_analytics()
        
        return {
            "status": "healthy",
            "service": "Adaptive Learning Engine",
            "pocketbase_connection": "active" if platform_stats else "needs_setup",
            "features": [
                "personalized_learning_paths",
                "adaptive_assessments",
                "learning_style_detection",
                "performance_tracking",
                "recommendation_engine"
            ],
            "database": "PocketBase",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "pocketbase_connection": "inactive",
            "timestamp": datetime.now().isoformat()
        }

@router.get("/streaks/{user_id}")
async def get_user_streaks(user_id: str):
    """Get learning streaks for a user"""
    try:
        # Get user profile for current streak
        profile_data = await pb_service.get_user_profile(user_id)
        if not profile_data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Get recent sessions to calculate streak
        recent_sessions = await pb_service.get_user_sessions(user_id, limit=30)
        
        current_streak = profile_data.get('current_streak', 0)
        
        # Calculate additional streak metrics
        session_dates = []
        for session in recent_sessions:
            if session.get('start_time'):
                try:
                    session_date = datetime.fromisoformat(session['start_time']).date()
                    session_dates.append(session_date)
                except:
                    continue
        
        # Remove duplicates and sort
        unique_dates = sorted(set(session_dates), reverse=True)
        
        # Calculate longest streak
        longest_streak = 0
        current_count = 0
        
        if unique_dates:
            for i, date in enumerate(unique_dates):
                if i == 0:
                    current_count = 1
                else:
                    prev_date = unique_dates[i-1]
                    if (prev_date - date).days == 1:
                        current_count += 1
                    else:
                        longest_streak = max(longest_streak, current_count)
                        current_count = 1
            longest_streak = max(longest_streak, current_count)
        
        # Encouraging message based on streak
        if current_streak == 0:
            message = "Start your learning journey today! 🚀"
        elif current_streak == 1:
            message = "Great start! Keep the momentum going! 💪"
        elif current_streak < 7:
            message = f"Amazing! You're on a {current_streak}-day streak! 🔥"
        elif current_streak < 30:
            message = f"Incredible! {current_streak} days strong! You're unstoppable! ⭐"
        else:
            message = f"LEGENDARY! {current_streak} days of dedication! 🏆"
        
        return {
            "user_id": user_id,
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "total_study_days": len(unique_dates),
            "message": message,
            "streak_level": "beginner" if current_streak < 7 else "intermediate" if current_streak < 30 else "expert"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting streaks: {str(e)}")

# Helper functions
async def _update_user_stats(user_id: str, duration_minutes: int):
    """Update user statistics after a session"""
    try:
        profile_data = await pb_service.get_user_profile(user_id)
        if profile_data:
            import json
            
            def safe_json_loads(value, default):
                """Safely parse JSON, handling cases where value is already parsed"""
                if isinstance(value, (dict, list)):
                    return value
                if isinstance(value, str):
                    try:
                        return json.loads(value)
                    except (json.JSONDecodeError, TypeError):
                        return default
                return default
            
            # Update total study time
            current_time = profile_data.get("total_study_time_hours", 0.0)
            new_time = current_time + (duration_minutes / 60.0)
            
            # Create updated profile
            profile = UserLearningProfile(
                user_id=user_id,
                learning_style=LearningStyle(profile_data.get('learning_style', 'visual')),
                pace_preference=profile_data.get('pace_preference', 'normal'),
                preferred_difficulty=DifficultyLevel(profile_data.get('preferred_difficulty', 'beginner')),
                current_streak=profile_data.get('current_streak', 0),
                total_study_time_hours=new_time,
                concept_masteries=safe_json_loads(profile_data.get('concept_masteries', '{}'), {}),
                learning_goals=safe_json_loads(profile_data.get('learning_goals', '[]'), []),
                weak_areas=safe_json_loads(profile_data.get('weak_areas', '[]'), []),
                strong_areas=safe_json_loads(profile_data.get('strong_areas', '[]'), []),
                cognitive_load_capacity=profile_data.get('cognitive_load_capacity', 0.7)
            )
            
            await pb_service.save_user_profile(profile)
            
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.error(f"Error updating user stats: {e}")