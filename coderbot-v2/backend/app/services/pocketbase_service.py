import json
import requests
import os
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
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
            "learning_streaks": "learning_streaks",
            # New class management collections
            "classes": "classes",
            "class_members": "class_members",
            "class_invites": "class_invites",
            "class_events": "class_events",
            "class_api_keys": "class_api_keys",
            # Notification system collections
            "notifications": "notifications",
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

    def get_user_api_keys(self, user_id: str) -> Dict[str, str]:
        """
        Fetches all API keys for a user from the user_api_keys collection in PocketBase.
        Returns a dict: {provider: api_key}
        """
        try:
            response = requests.get(
                f"{self.base_url}/api/collections/user_api_keys/records",
                params={"filter": f"user = '{user_id}'"},
                headers=self._get_headers()
            )
            if response.status_code == 200:
                data = response.json()
                result = {}
                for item in data.get("items", []):
                    provider = item.get("provider")
                    api_key = item.get("api_key")
                    if provider and api_key:
                        result[provider] = api_key
                return result
            else:
                logger.warning(f"Failed to fetch API keys for user {user_id}: {response.status_code} - {response.text}")
                return {}
        except Exception as e:
            logger.error(f"Error fetching API keys for user {user_id}: {e}")
            return {}

    def get_user_api_key(self, user_id: str, provider: str) -> Optional[str]:
        """
        Fetches a specific API key for a user and provider from the user_api_keys collection in PocketBase.
        Returns the api_key string or None if not found.
        """
        try:
            response = requests.get(
                f"{self.base_url}/api/collections/user_api_keys/records",
                params={"filter": f"user = '{user_id}' && provider = '{provider}'"},
                headers=self._get_headers()
            )
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                if items:
                    return items[0].get("api_key")
            return None
        except Exception as e:
            logger.error(f"Error fetching API key for user {user_id}, provider {provider}: {e}")
            return None

# ------------------
# Class Management API
# ------------------

class PocketBaseService(PocketBaseService):
    # Utility: internal GET helper
    def _get(self, collection: str, params: Optional[Dict[str, Any]] = None):
        return requests.get(
            f"{self.base_url}/api/collections/{collection}/records",
            params=params or {},
            headers=self._get_headers(),
        )

    # Utility: internal POST helper
    def _post(self, collection: str, payload: Dict[str, Any]):
        return requests.post(
            f"{self.base_url}/api/collections/{collection}/records",
            json=payload,
            headers=self._get_headers(),
        )

    # Utility: internal PATCH helper
    def _patch(self, collection: str, record_id: str, payload: Dict[str, Any]):
        return requests.patch(
            f"{self.base_url}/api/collections/{collection}/records/{record_id}",
            json=payload,
            headers=self._get_headers(),
        )

    # Utility: internal DELETE helper
    def _delete(self, collection: str, record_id: str):
        return requests.delete(
            f"{self.base_url}/api/collections/{collection}/records/{record_id}",
            headers=self._get_headers(),
        )

    # ---- Classes ----
    def create_class(self, teacher_user_id: str, title: str, description: Optional[str] = None, code: Optional[str] = None) -> Optional[Dict[str, Any]]:
        # PocketBase schema may use 'name' instead of 'title'. Send both for compatibility.
        payload: Dict[str, Any] = {
            "title": title,
            "name": title,
            "description": (description or ""),
            # keep teacher if schema supports it; harmless if ignored
            "teacher": teacher_user_id,
        }
        if code:
            payload["code"] = code
        r = self._post(self.collections["classes"], payload)
        if r.status_code in (200, 201):
            created = r.json()
            # Ensure teacher is registered as a member with role 'teacher'
            try:
                class_id = created.get("id")
                if class_id and teacher_user_id:
                    self.add_member(class_id, teacher_user_id, role="teacher")
            except Exception:
                # best-effort; failure here shouldn't block class creation
                pass
            return created
        self._handle_response_error(r, "Create class")
        return None

    def get_class(self, class_id: str) -> Optional[Dict[str, Any]]:
        r = self._get(self.collections["classes"], params={"filter": f"id = '{class_id}'", "perPage": 1})
        if r.status_code == 200:
            items = r.json().get("items", [])
            return items[0] if items else None
        return None

    def update_class(self, class_id: str, payload: Dict[str, Any]) -> bool:
        r = self._patch(self.collections["classes"], class_id, payload)
        return r.status_code == 200

    def delete_class(self, class_id: str) -> bool:
        r = self._delete(self.collections["classes"], class_id)
        return r.status_code == 204

    def list_classes_for_teacher(self, teacher_user_id: str) -> List[Dict[str, Any]]:
        # Prefer membership relation; some schemas may not have a role field
        params = {
            "filter": f"user = '{teacher_user_id}'",
            "expand": "class",
            "perPage": 200,
            "sort": "-created",
        }
        r = self._get(self.collections["class_members"], params=params)
        if r.status_code == 200:
            items = r.json().get("items", [])
            classes_map: Dict[str, Dict[str, Any]] = {}
            for it in items:
                exp = it.get("expand", {})
                c = exp.get("class")
                if isinstance(c, dict):
                    cid = c.get("id")
                    if cid and cid not in classes_map:
                        classes_map[cid] = c
            classes = list(classes_map.values())
            if classes:
                return classes
        # Fallback: return all classes (schema without membership or teacher owner)
        r_all = self._get(self.collections["classes"], params={"perPage": 200, "sort": "-created"})
        if r_all.status_code == 200:
            return r_all.json().get("items", [])
        return []

    def list_classes_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        # Via membership with expand class
        r = self._get(
            self.collections["class_members"],
            params={"filter": f"user = '{user_id}'", "expand": "class", "perPage": 200, "sort": "-created"},
        )
        if r.status_code == 200:
            return r.json().get("items", [])
        return []

    # ---- Permissions ----
    def is_user_class_teacher(self, class_id: str, user_id: str) -> bool:
        c = self.get_class(class_id)
        if not c or not user_id:
            return False
        # Check teacher field or fallback to createdBy
        if c.get("teacher") == user_id or (isinstance(c.get("teacher"), dict) and c.get("teacher", {}).get("id") == user_id):
            return True
        if c.get("createdBy") == user_id or (isinstance(c.get("createdBy"), dict) and c.get("createdBy", {}).get("id") == user_id):
            return True
        return False

    def is_user_class_member(self, class_id: str, user_id: str) -> bool:
        r = self._get(self.collections["class_members"], params={"filter": f"class = '{class_id}' && user = '{user_id}'", "perPage": 1})
        if r.status_code == 200:
            return len(r.json().get("items", [])) > 0
        return False

    # ---- Members ----
    def add_member(self, class_id: str, user_id: str, role: str = "student") -> bool:
        r = self._post(self.collections["class_members"], {"class": class_id, "user": user_id, "role": role})
        if r.status_code in (200, 201):
            return True
        self._handle_response_error(r, "Add member")
        return False

    def remove_member(self, class_id: str, user_id: str) -> bool:
        # find record id first
        r = self._get(self.collections["class_members"], params={"filter": f"class = '{class_id}' && user = '{user_id}'", "perPage": 1})
        if r.status_code != 200:
            return False
        items = r.json().get("items", [])
        if not items:
            return True
        member_id = items[0]["id"]
        d = self._delete(self.collections["class_members"], member_id)
        return d.status_code == 204

    def list_members(self, class_id: str) -> List[Dict[str, Any]]:
        r = self._get(self.collections["class_members"], params={"filter": f"class = '{class_id}'", "expand": "user", "perPage": 200})
        if r.status_code == 200:
            return r.json().get("items", [])
        return []

    # ---- Invites ----
    def create_invite(self, class_id: str, invited_by: str, email: Optional[str] = None, user_id: Optional[str] = None, ttl_hours: int = 72) -> Optional[Dict[str, Any]]:
        from uuid import uuid4
        token = uuid4().hex
        expires_at = (datetime.utcnow() + timedelta(hours=ttl_hours)).isoformat()
        payload: Dict[str, Any] = {"class": class_id, "token": token, "status": "pending", "expires_at": expires_at, "invited_by": invited_by}
        if email:
            payload["email"] = email
        if user_id:
            payload["user"] = user_id
        r = self._post(self.collections["class_invites"], payload)
        if r.status_code in (200, 201):
            return r.json()
        self._handle_response_error(r, "Create invite")
        return None

    def get_invite_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        r = self._get(self.collections["class_invites"], params={"filter": f"token = '{token}'", "perPage": 1})
        if r.status_code == 200:
            items = r.json().get("items", [])
            return items[0] if items else None
        return None

    def accept_invite(self, token: str, user_id: str) -> bool:
        invite = self.get_invite_by_token(token)
        if not invite:
            return False
        if invite.get("status") != "pending":
            return False
        exp = invite.get("expires_at")
        try:
            if exp and datetime.fromisoformat(exp.replace("Z", "+00:00")) < datetime.utcnow():
                return False
        except Exception:
            pass
        class_id = invite.get("class") if isinstance(invite.get("class"), str) else invite.get("class", {}).get("id")
        # Add member first
        added = self.add_member(class_id, user_id, role="student")
        if not added:
            return False
        # Update invite status
        r = self._patch(self.collections["class_invites"], invite["id"], {"status": "accepted", "user": user_id})
        return r.status_code == 200

    # ---- Events ----
    def create_event(self, class_id: str, type_: str, title: str, description: str = "", starts_at: str = "", ends_at: Optional[str] = None, visibility: str = "class", is_online: Optional[bool] = False, meeting_url: Optional[str] = None) -> Optional[Dict[str, Any]]:
        payload = {
            "class": class_id,
            "type": type_,
            "title": title,
            "description": description,
            "starts_at": starts_at,
            "ends_at": ends_at,
            "visibility": visibility,
            "is_online": bool(is_online) if is_online is not None else False,
            "meeting_url": meeting_url or "",
        }
        r = self._post(self.collections["class_events"], payload)
        if r.status_code in (200, 201):
            return r.json()
        self._handle_response_error(r, "Create event")
        return None

    def list_events(self, class_id: str, since: Optional[str] = None, until: Optional[str] = None) -> List[Dict[str, Any]]:
        filters = [f"class = '{class_id}'"]
        if since:
            filters.append(f"starts_at >= '{since}'")
        if until:
            filters.append(f"starts_at <= '{until}'")
        flt = " && ".join(filters)
        r = self._get(self.collections["class_events"], params={"filter": flt, "sort": "starts_at", "perPage": 200})
        if r.status_code == 200:
            return r.json().get("items", [])
        return []

    def update_event(self, event_id: str, payload: Dict[str, Any]) -> bool:
        r = self._patch(self.collections["class_events"], event_id, payload)
        return r.status_code == 200

    def delete_event(self, event_id: str) -> bool:
        r = self._delete(self.collections["class_events"], event_id)
        return r.status_code == 204

    # ---- Class API Keys ----
    def set_class_api_key(self, class_id: str, provider: str, api_key: str, created_by: str, active: bool = True) -> bool:
        # Deactivate existing active keys for the same provider and class
        r_list = self._get(
            self.collections["class_api_keys"],
            params={"filter": f"class = '{class_id}' && provider = '{provider}' && active = true", "perPage": 200},
        )
        if r_list.status_code == 200:
            for item in r_list.json().get("items", []):
                self._patch(self.collections["class_api_keys"], item["id"], {"active": False})
        r = self._post(
            self.collections["class_api_keys"],
            {"class": class_id, "provider": provider, "api_key": api_key, "created_by": created_by, "active": active},
        )
        return r.status_code in (200, 201)

    def get_class_api_key(self, class_id: str, provider: str, include_inactive: bool = False) -> Optional[str]:
        flt = f"class = '{class_id}' && provider = '{provider}'"
        if not include_inactive:
            flt += " && active = true"
        r = self._get(self.collections["class_api_keys"], params={"filter": flt, "perPage": 1, "sort": "-created"})
        if r.status_code == 200:
            items = r.json().get("items", [])
            if items:
                return items[0].get("api_key")
        return None

    # ---- Notifications ----

    def create_notification(self, recipient_id: str, sender_id: str, title: str, content: str, type: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        payload = {
            "recipient": recipient_id,
            "sender": sender_id,
            "title": title,
            "content": content,
            "type": type,
            "read": False,
            "metadata": metadata or {}
        }
        r = self._post(self.collections["notifications"], payload)
        if r.status_code in (200, 201):
            return r.json()
        self._handle_response_error(r, "Create notification")
        return {}

    def get_notification(self, notification_id: str) -> Optional[Dict[str, Any]]:
        r = self._get(self.collections["notifications"], params={"filter": f"id = '{notification_id}'", "perPage": 1})
        if r.status_code == 200:
            items = r.json().get("items", [])
            return items[0] if items else None
        return None

    def list_notifications_for_user(self, user_id: str, limit: int = 50, offset: int = 0, unread_only: bool = False) -> List[Dict[str, Any]]:
        flt = f"recipient = '{user_id}'"
        if unread_only:
            flt += " && read = false"
        params = {
            "filter": flt,
            "perPage": limit,
            "skip": offset,
            "sort": "-created"
        }
        r = self._get(self.collections["notifications"], params=params)
        if r.status_code == 200:
            return r.json().get("items", [])
        return []

    def get_unread_notifications_count(self, user_id: str) -> int:
        params = {
            "filter": f"recipient = '{user_id}' && read = false",
            "perPage": 1
        }
        r = self._get(self.collections["notifications"], params=params)
        if r.status_code == 200:
            return r.json().get("totalItems", 0)
        return 0

    def update_notification(self, notification_id: str, read: Optional[bool] = None) -> Dict[str, Any]:
        payload = {}
        if read is not None:
            payload["read"] = read

        if not payload:
            return self.get_notification(notification_id) or {}

        r = self._patch(self.collections["notifications"], notification_id, payload)
        if r.status_code == 200:
            return r.json()
        self._handle_response_error(r, "Update notification")
        return {}

    def mark_notification_as_read(self, notification_id: str) -> Dict[str, Any]:
        return self.update_notification(notification_id, read=True)

    def mark_all_notifications_as_read(self, user_id: str) -> int:
        # Get all unread notifications for the user
        unread_notifications = self.list_notifications_for_user(user_id, unread_only=True)
        marked_count = 0

        for notification in unread_notifications:
            if self.mark_notification_as_read(notification["id"]):
                marked_count += 1

        return marked_count

    def delete_notification(self, notification_id: str) -> bool:
        r = self._delete(self.collections["notifications"], notification_id)
        return r.status_code == 204

# Recreate global instance AFTER extending the class so it includes class management methods
from app.config import settings
pb_service = PocketBaseService(base_url=settings.pocketbase_url)

def get_pocketbase_client() -> PocketBaseService:
    """
    Factory function to get the PocketBase service instance.
    This provides a consistent interface for dependency injection.
    """
    return pb_service
