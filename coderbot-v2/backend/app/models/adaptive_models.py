from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from datetime import datetime
from enum import Enum

class LearningStyle(str, Enum):
    VISUAL = "visual"
    AUDITORY = "auditory"
    KINESTHETIC = "kinesthetic"
    READ_WRITE = "read_write"

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class SkillLevel(str, Enum):
    NOVICE = "novice"
    BEGINNER = "beginner"
    COMPETENT = "competent"
    PROFICIENT = "proficient"
    EXPERT = "expert"

class ConceptMastery(BaseModel):
    concept_id: str
    skill_level: SkillLevel
    confidence_score: float = Field(ge=0.0, le=1.0)
    last_assessed: datetime
    attempts: int = 0
    success_rate: float = Field(ge=0.0, le=1.0)

class LearningObjective(BaseModel):
    id: str
    title: str
    description: str
    category: str
    prerequisites: List[str] = []
    estimated_time_hours: float
    difficulty_level: DifficultyLevel
    skills_taught: List[str]

class UserLearningProfile(BaseModel):
    user_id: str
    learning_style: LearningStyle
    pace_preference: Literal["slow", "normal", "fast"]
    preferred_difficulty: DifficultyLevel
    current_streak: int = 0
    total_study_time_hours: float = 0.0
    concept_masteries: Dict[str, ConceptMastery] = {}
    learning_goals: List[str] = []
    weak_areas: List[str] = []
    strong_areas: List[str] = []
    cognitive_load_capacity: float = Field(ge=0.1, le=1.0, default=0.7)
    
class PersonalizedLearningPath(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    objectives: List[LearningObjective]
    current_position: int = 0
    estimated_completion_hours: float
    actual_time_spent: float = 0.0
    completion_rate: float = Field(ge=0.0, le=1.0, default=0.0)
    adaptive_adjustments: List[str] = []
    created_at: datetime
    last_updated: datetime

class AssessmentQuestion(BaseModel):
    id: str
    question_text: str
    question_type: Literal["multiple_choice", "code_completion", "debugging", "free_form"]
    difficulty_level: DifficultyLevel
    concept_ids: List[str]
    correct_answer: str
    options: Optional[List[str]] = None  # For multiple choice
    explanation: str
    hints: List[str] = []
    estimated_time_minutes: int

class AdaptiveAssessment(BaseModel):
    id: str
    user_id: str
    title: str
    concept_ids: List[str]
    questions: List[AssessmentQuestion]
    current_question_index: int = 0
    difficulty_adjustments: List[Dict] = []
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    
class AssessmentResponse(BaseModel):
    question_id: str
    user_answer: str
    is_correct: bool
    time_taken_seconds: int
    hints_used: int = 0
    confidence_level: int = Field(ge=1, le=5)  # 1-5 scale

class AdaptiveRecommendation(BaseModel):
    user_id: str
    recommendation_type: Literal["content", "difficulty", "pace", "learning_style"]
    title: str
    description: str
    reasoning: str
    content_id: Optional[str] = None
    priority: int = Field(ge=1, le=5)
    created_at: datetime
    expires_at: Optional[datetime] = None

class LearningSession(BaseModel):
    id: str
    user_id: str
    content_id: str
    session_type: Literal["lesson", "practice", "assessment", "project"]
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    interactions: List[Dict] = []  # Track user interactions
    performance_score: Optional[float] = None
    engagement_score: Optional[float] = None
    difficulty_rating: Optional[int] = None
    completed: bool = False

class SkillMatrix(BaseModel):
    user_id: str
    programming_concepts: Dict[str, float] = {}  # concept -> mastery score (0-1)
    problem_solving: float = 0.0
    debugging: float = 0.0
    code_quality: float = 0.0
    algorithmic_thinking: float = 0.0
    system_design: float = 0.0
    last_updated: datetime 