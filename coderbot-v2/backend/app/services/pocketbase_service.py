import json
import requests
import os
from typing import List, Dict, Optional, Any
from datetime import datetime
from app.models.adaptive_models import (
    UserLearningProfile, PersonalizedLearningPath, LearningSession,
    ConceptMastery, AdaptiveRecommendation, SkillMatrix, AssessmentResponse
)
import logging

logger = logging.getLogger(__name__)

class PocketBaseService:
    """
    PocketBase integration service for adaptive learning data persistence
    """
    
    def __init__(self, base_url: str = "http://localhost:8090"):
        self.base_url = base_url
        self.auth_token = None
        self.collections = {
            "user_learning_profiles": "user_learning_profiles",
            "learning_paths": "learning_paths",
            "learning_sessions": "learning_sessions",
            "assessment_responses": "assessment_responses",
            "concept_masteries": "concept_masteries",
            "adaptive_recommendations": "adaptive_recommendations",
            "skill_matrices": "skill_matrices",
            "learning_analytics": "learning_analytics",
            "user_achievements": "user_achievements",
            "learning_streaks": "learning_streaks"
        }
        
        # Try to authenticate on initialization
        self._auto_authenticate()
    
    def _auto_authenticate(self):
        """Automatically authenticate using environment variables"""
        try:
            admin_email = os.getenv("POCKETBASE_ADMIN_EMAIL", "admin@example.com")
            admin_password = os.getenv("POCKETBASE_ADMIN_PASSWORD", "admin123456")
            
            if admin_email and admin_password:
                success = self.authenticate_admin(admin_email, admin_password)
                if success:
                    logger.info("PocketBase integration configurado")
                else:
                    logger.warning("Failed to authenticate with PocketBase admin - some features may not work")
                    logger.info("Visit http://localhost:8090/_/ to set up admin user manually")
            else:
                logger.warning("PocketBase admin credentials not found in environment")
        except Exception as e:
            logger.error(f"Auto-authentication failed: {e}")
    
    def authenticate_admin(self, email: str, password: str) -> bool:
        """Authenticate as admin user"""
        try:
            response = requests.post(
                f"{self.base_url}/api/admins/auth-with-password",
                json={"identity": email, "password": password}
            )
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("token")
                return True
            else:
                logger.warning(f"Admin authentication failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return False
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with authentication"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    def _handle_response_error(self, response, operation: str):
        """Handle and log response errors"""
        if response.status_code == 401:
            logger.warning(f"{operation} failed: Authentication required. Please set up PocketBase admin.")
        elif response.status_code == 403:
            logger.warning(f"{operation} failed: Permission denied. Check collection rules.")
        elif response.status_code == 404:
            logger.warning(f"{operation} failed: Collection or record not found.")
        else:
            logger.error(f"{operation} failed: {response.status_code} - {response.text}")
    
    # User Learning Profiles
    async def save_user_profile(self, profile: UserLearningProfile) -> bool:
        """Save or update user learning profile"""
        try:
            profile_data = {
                "user_id": profile.user_id,
                "learning_style": profile.learning_style.value,
                "pace_preference": profile.pace_preference,
                "preferred_difficulty": profile.preferred_difficulty.value,
                "current_streak": profile.current_streak,
                "total_study_time_hours": profile.total_study_time_hours,
                "concept_masteries": json.dumps({k: v.dict() for k, v in profile.concept_masteries.items()}),
                "learning_goals": json.dumps(profile.learning_goals),
                "weak_areas": json.dumps(profile.weak_areas),
                "strong_areas": json.dumps(profile.strong_areas),
                "cognitive_load_capacity": profile.cognitive_load_capacity
            }
            
            # Check if profile exists
            existing = await self.get_user_profile(profile.user_id)
            
            if existing:
                # Update existing
                response = requests.patch(
                    f"{self.base_url}/api/collections/{self.collections['user_learning_profiles']}/records/{existing['id']}",
                    json=profile_data,
                    headers=self._get_headers()
                )
            else:
                # Create new
                response = requests.post(
                    f"{self.base_url}/api/collections/{self.collections['user_learning_profiles']}/records",
                    json=profile_data,
                    headers=self._get_headers()
                )
            
            if response.status_code in [200, 201]:
                return True
            else:
                self._handle_response_error(response, "Save user profile")
                return False
                
        except Exception as e:
            logger.error(f"Error saving user profile: {e}")
            return False
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Get user learning profile by user_id"""
        try:
            response = requests.get(
                f"{self.base_url}/api/collections/{self.collections['user_learning_profiles']}/records",
                params={"filter": f"user_id='{user_id}'"},
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("items"):
                    return data["items"][0]
            return None
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return None
    
    # Learning Paths
    async def save_learning_path(self, path: PersonalizedLearningPath) -> bool:
        """Save personalized learning path"""
        try:
            path_data = {
                "path_id": path.id,
                "user_id": path.user_id,
                "title": path.title,
                "description": path.description,
                "objectives": json.dumps([obj.dict() for obj in path.objectives]),
                "current_position": path.current_position,
                "estimated_completion_hours": path.estimated_completion_hours,
                "actual_time_spent": path.actual_time_spent,
                "completion_rate": path.completion_rate,
                "adaptive_adjustments": json.dumps(path.adaptive_adjustments),
                "created_at": path.created_at.isoformat(),
                "last_updated": path.last_updated.isoformat()
            }
            
            response = requests.post(
                f"{self.base_url}/api/collections/{self.collections['learning_paths']}/records",
                json=path_data,
                headers=self._get_headers()
            )
            
            return response.status_code == 201
        except Exception as e:
            logger.error(f"Error saving learning path: {e}")
            return False
    
    async def get_user_learning_paths(self, user_id: str) -> List[Dict]:
        """Get all learning paths for a user"""
        try:
            response = requests.get(
                f"{self.base_url}/api/collections/{self.collections['learning_paths']}/records",
                params={"filter": f"user_id='{user_id}'", "sort": "-created_at"},
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("items", [])
            return []
        except Exception as e:
            logger.error(f"Error getting learning paths: {e}")
            return []
    
    # Learning Sessions
    async def save_learning_session(self, session: LearningSession) -> bool:
        """Save learning session data"""
        try:
            session_data = {
                "session_id": session.id,
                "user_id": session.user_id,
                "content_id": session.content_id,
                "session_type": session.session_type,
                "start_time": session.start_time.isoformat(),
                "end_time": session.end_time.isoformat() if session.end_time else None,
                "duration_minutes": session.duration_minutes,
                "interactions": json.dumps(session.interactions),
                "performance_score": session.performance_score,
                "engagement_score": session.engagement_score,
                "difficulty_rating": session.difficulty_rating,
                "completed": session.completed
            }
            
            response = requests.post(
                f"{self.base_url}/api/collections/{self.collections['learning_sessions']}/records",
                json=session_data,
                headers=self._get_headers()
            )
            
            return response.status_code == 201
        except Exception as e:
            logger.error(f"Error saving learning session: {e}")
            return False
    
    async def get_user_sessions(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get recent learning sessions for a user"""
        try:
            response = requests.get(
                f"{self.base_url}/api/collections/{self.collections['learning_sessions']}/records",
                params={
                    "filter": f"user_id='{user_id}'",
                    "sort": "-start_time",
                    "perPage": limit
                },
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("items", [])
            return []
        except Exception as e:
            logger.error(f"Error getting user sessions: {e}")
            return []
    
    # Assessment Responses
    async def save_assessment_responses(self, user_id: str, assessment_id: str, 
                                      responses: List[AssessmentResponse]) -> bool:
        """Save assessment responses"""
        try:
            for response in responses:
                response_data = {
                    "user_id": user_id,
                    "assessment_id": assessment_id,
                    "question_id": response.question_id,
                    "user_answer": response.user_answer,
                    "is_correct": response.is_correct,
                    "time_taken_seconds": response.time_taken_seconds,
                    "hints_used": response.hints_used,
                    "confidence_level": response.confidence_level,
                    "submitted_at": datetime.now().isoformat()
                }
                
                requests.post(
                    f"{self.base_url}/api/collections/{self.collections['assessment_responses']}/records",
                    json=response_data,
                    headers=self._get_headers()
                )
            
            return True
        except Exception as e:
            logger.error(f"Error saving assessment responses: {e}")
            return False
    
    async def get_assessment_responses(self, user_id: str, concept_id: str = None) -> List[Dict]:
        """Get assessment responses for analysis"""
        try:
            filter_str = f"user_id='{user_id}'"
            if concept_id:
                filter_str += f" && question_id~'{concept_id}'"
            
            response = requests.get(
                f"{self.base_url}/api/collections/{self.collections['assessment_responses']}/records",
                params={"filter": filter_str, "sort": "-submitted_at"},
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("items", [])
            return []
        except Exception as e:
            logger.error(f"Error getting assessment responses: {e}")
            return []
    
    # Analytics and Progress Tracking
    async def save_learning_analytics(self, user_id: str, analytics_data: Dict) -> bool:
        """Save comprehensive learning analytics"""
        try:
            analytics_record = {
                "user_id": user_id,
                "total_sessions": analytics_data.get("total_sessions", 0),
                "total_study_time_hours": analytics_data.get("total_study_time_hours", 0),
                "current_streak": analytics_data.get("current_streak", 0),
                "average_performance": analytics_data.get("average_performance", 0),
                "average_engagement": analytics_data.get("average_engagement", 0),
                "concept_masteries": json.dumps(analytics_data.get("concept_masteries", {})),
                "weak_areas": json.dumps(analytics_data.get("weak_areas", [])),
                "strong_areas": json.dumps(analytics_data.get("strong_areas", [])),
                "learning_goals": json.dumps(analytics_data.get("learning_goals", [])),
                "performance_trend": json.dumps(analytics_data.get("performance_trend", [])),
                "engagement_trend": json.dumps(analytics_data.get("engagement_trend", [])),
                "skill_progression": json.dumps(analytics_data.get("skill_progression", {})),
                "generated_at": datetime.now().isoformat()
            }
            
            response = requests.post(
                f"{self.base_url}/api/collections/{self.collections['learning_analytics']}/records",
                json=analytics_record,
                headers=self._get_headers()
            )
            
            return response.status_code == 201
        except Exception as e:
            logger.error(f"Error saving analytics: {e}")
            return False
    
    async def get_learning_analytics(self, user_id: str) -> Optional[Dict]:
        """Get latest learning analytics for a user"""
        try:
            response = requests.get(
                f"{self.base_url}/api/collections/{self.collections['learning_analytics']}/records",
                params={
                    "filter": f"user_id='{user_id}'",
                    "sort": "-generated_at",
                    "perPage": 1
                },
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("items"):
                    return data["items"][0]
            return None
        except Exception as e:
            logger.error(f"Error getting analytics: {e}")
            return None
    
    # Recommendations
    async def save_recommendations(self, recommendations: List[AdaptiveRecommendation]) -> bool:
        """Save adaptive recommendations"""
        try:
            for rec in recommendations:
                rec_data = {
                    "user_id": rec.user_id,
                    "recommendation_type": rec.recommendation_type,
                    "title": rec.title,
                    "description": rec.description,
                    "reasoning": rec.reasoning,
                    "content_id": rec.content_id,
                    "priority": rec.priority,
                    "created_at": rec.created_at.isoformat(),
                    "expires_at": rec.expires_at.isoformat() if rec.expires_at else None,
                    "viewed": False,
                    "applied": False
                }
                
                requests.post(
                    f"{self.base_url}/api/collections/{self.collections['adaptive_recommendations']}/records",
                    json=rec_data,
                    headers=self._get_headers()
                )
            
            return True
        except Exception as e:
            logger.error(f"Error saving recommendations: {e}")
            return False
    
    async def get_user_recommendations(self, user_id: str, active_only: bool = True) -> List[Dict]:
        """Get recommendations for a user"""
        try:
            filter_str = f"user_id='{user_id}'"
            if active_only:
                filter_str += " && viewed=false"
            
            response = requests.get(
                f"{self.base_url}/api/collections/{self.collections['adaptive_recommendations']}/records",
                params={
                    "filter": filter_str,
                    "sort": "-priority,-created_at"
                },
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("items", [])
            return []
        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            return []
    
    # Progress tracking and streaks
    async def update_learning_streak(self, user_id: str, streak_count: int) -> bool:
        """Update user's learning streak"""
        try:
            streak_data = {
                "user_id": user_id,
                "current_streak": streak_count,
                "last_activity_date": datetime.now().date().isoformat(),
                "longest_streak": streak_count,  # Will be updated with max logic
                "updated_at": datetime.now().isoformat()
            }
            
            # Check for existing streak record
            response = requests.get(
                f"{self.base_url}/api/collections/{self.collections['learning_streaks']}/records",
                params={"filter": f"user_id='{user_id}'"},
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("items"):
                    # Update existing
                    existing = data["items"][0]
                    streak_data["longest_streak"] = max(streak_count, existing.get("longest_streak", 0))
                    
                    update_response = requests.patch(
                        f"{self.base_url}/api/collections/{self.collections['learning_streaks']}/records/{existing['id']}",
                        json=streak_data,
                        headers=self._get_headers()
                    )
                    return update_response.status_code == 200
                else:
                    # Create new
                    create_response = requests.post(
                        f"{self.base_url}/api/collections/{self.collections['learning_streaks']}/records",
                        json=streak_data,
                        headers=self._get_headers()
                    )
                    return create_response.status_code == 201
            
            return False
        except Exception as e:
            logger.error(f"Error updating streak: {e}")
            return False
    
    async def get_platform_analytics(self) -> Dict:
        """Get platform-wide analytics"""
        try:
            analytics = {}
            
            # Total users with profiles
            users_response = requests.get(
                f"{self.base_url}/api/collections/{self.collections['user_learning_profiles']}/records",
                params={"perPage": 1},
                headers=self._get_headers()
            )
            if users_response.status_code == 200:
                analytics["total_users"] = users_response.json().get("totalItems", 0)
            
            # Total learning sessions
            sessions_response = requests.get(
                f"{self.base_url}/api/collections/{self.collections['learning_sessions']}/records",
                params={"perPage": 1},
                headers=self._get_headers()
            )
            if sessions_response.status_code == 200:
                analytics["total_sessions"] = sessions_response.json().get("totalItems", 0)
            
            # Total learning paths
            paths_response = requests.get(
                f"{self.base_url}/api/collections/{self.collections['learning_paths']}/records",
                params={"perPage": 1},
                headers=self._get_headers()
            )
            if paths_response.status_code == 200:
                analytics["total_learning_paths"] = paths_response.json().get("totalItems", 0)
            
            return analytics
        except Exception as e:
            logger.error(f"Error getting platform analytics: {e}")
            return {}

# Global instance
pb_service = PocketBaseService()