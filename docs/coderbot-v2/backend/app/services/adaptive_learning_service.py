import numpy as np
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
from app.models.adaptive_models import (
    UserLearningProfile, PersonalizedLearningPath, AssessmentQuestion,
    AssessmentResponse, ConceptMastery, LearningObjective, 
    AdaptiveRecommendation, SkillMatrix, LearningSession,
    DifficultyLevel, SkillLevel, LearningStyle
)
import math
import random

class AdaptiveLearningEngine:
    """
    Core adaptive learning engine implementing algorithms similar to Squirrel AI
    for personalized education experiences
    """
    
    def __init__(self):
        self.knowledge_graph = self._build_knowledge_graph()
        self.difficulty_weights = {
            DifficultyLevel.BEGINNER: 0.2,
            DifficultyLevel.INTERMEDIATE: 0.5,
            DifficultyLevel.ADVANCED: 0.8,
            DifficultyLevel.EXPERT: 1.0
        }
    
    def _build_knowledge_graph(self) -> Dict[str, Dict[str, List[str]]]:
        """Build programming concepts knowledge graph with prerequisites"""
        return {
            "fundamentals": {
                "variables": [],
                "data_types": ["variables"],
                "operators": ["variables", "data_types"],
                "control_flow": ["operators"],
                "functions": ["control_flow"],
                "arrays": ["functions"],
                "objects": ["arrays"]
            },
            "intermediate": {
                "algorithms": ["arrays", "functions"],
                "data_structures": ["algorithms"],
                "recursion": ["functions", "algorithms"],
                "oop": ["objects", "functions"],
                "error_handling": ["functions"],
                "file_handling": ["error_handling"]
            },
            "advanced": {
                "design_patterns": ["oop"],
                "system_design": ["design_patterns"],
                "databases": ["file_handling"],
                "api_development": ["databases", "oop"],
                "testing": ["functions", "oop"],
                "performance_optimization": ["algorithms", "data_structures"]
            }
        }
    
    def assess_learning_style(self, user_responses: List[Dict]) -> LearningStyle:
        """Detect user's learning style based on interaction patterns"""
        visual_score = 0
        auditory_score = 0
        kinesthetic_score = 0
        read_write_score = 0
        
        for response in user_responses:
            if response.get("preferred_content_type") == "visual":
                visual_score += 1
            elif response.get("preferred_content_type") == "audio":
                auditory_score += 1
            elif response.get("interaction_type") == "hands_on":
                kinesthetic_score += 1
            elif response.get("preferred_content_type") == "text":
                read_write_score += 1
        
        scores = {
            LearningStyle.VISUAL: visual_score,
            LearningStyle.AUDITORY: auditory_score,
            LearningStyle.KINESTHETIC: kinesthetic_score,
            LearningStyle.READ_WRITE: read_write_score
        }
        
        return max(scores, key=scores.get)
    
    def calculate_concept_mastery(self, responses: List[AssessmentResponse], 
                                concept_id: str) -> ConceptMastery:
        """Calculate mastery level for a specific concept using IRT model"""
        if not responses:
            return ConceptMastery(
                concept_id=concept_id,
                skill_level=SkillLevel.NOVICE,
                confidence_score=0.0,
                last_assessed=datetime.now(),
                attempts=0,
                success_rate=0.0
            )
        
        correct_responses = sum(1 for r in responses if r.is_correct)
        success_rate = correct_responses / len(responses)
        
        # Calculate confidence based on consistency and response times
        time_consistency = self._calculate_time_consistency(responses)
        confidence_score = (success_rate * 0.7) + (time_consistency * 0.3)
        
        # Determine skill level based on success rate and difficulty progression
        if success_rate >= 0.9 and confidence_score >= 0.8:
            skill_level = SkillLevel.EXPERT
        elif success_rate >= 0.8 and confidence_score >= 0.7:
            skill_level = SkillLevel.PROFICIENT
        elif success_rate >= 0.7 and confidence_score >= 0.6:
            skill_level = SkillLevel.COMPETENT
        elif success_rate >= 0.5:
            skill_level = SkillLevel.BEGINNER
        else:
            skill_level = SkillLevel.NOVICE
            
        return ConceptMastery(
            concept_id=concept_id,
            skill_level=skill_level,
            confidence_score=confidence_score,
            last_assessed=datetime.now(),
            attempts=len(responses),
            success_rate=success_rate
        )
    
    def _calculate_time_consistency(self, responses: List[AssessmentResponse]) -> float:
        """Calculate consistency in response times (indicator of confidence)"""
        if len(responses) < 2:
            return 0.5
        
        times = [r.time_taken_seconds for r in responses]
        mean_time = np.mean(times)
        std_time = np.std(times)
        
        # Lower standard deviation relative to mean indicates consistency
        coefficient_of_variation = std_time / mean_time if mean_time > 0 else 1
        consistency = max(0, 1 - coefficient_of_variation)
        
        return min(consistency, 1.0)
    
    def adjust_difficulty(self, current_difficulty: DifficultyLevel, 
                         performance_history: List[float],
                         target_success_rate: float = 0.75) -> DifficultyLevel:
        """Adjust difficulty based on performance to maintain optimal challenge"""
        if len(performance_history) < 3:
            return current_difficulty
        
        recent_performance = np.mean(performance_history[-5:])
        
        difficulty_levels = list(DifficultyLevel)
        current_index = difficulty_levels.index(current_difficulty)
        
        if recent_performance > target_success_rate + 0.1:
            # Too easy, increase difficulty
            new_index = min(current_index + 1, len(difficulty_levels) - 1)
        elif recent_performance < target_success_rate - 0.1:
            # Too hard, decrease difficulty
            new_index = max(current_index - 1, 0)
        else:
            # Just right, maintain current difficulty
            new_index = current_index
        
        return difficulty_levels[new_index]
    
    def generate_personalized_learning_path(self, profile: UserLearningProfile,
                                          target_skills: List[str]) -> PersonalizedLearningPath:
        """Generate a personalized learning path using topological sorting of prerequisites"""
        
        # Get all concepts needed for target skills
        required_concepts = self._get_prerequisite_chain(target_skills)
        
        # Filter based on current mastery
        concepts_to_learn = []
        for concept in required_concepts:
            mastery = profile.concept_masteries.get(concept)
            if not mastery or mastery.skill_level in [SkillLevel.NOVICE, SkillLevel.BEGINNER]:
                concepts_to_learn.append(concept)
        
        # Create learning objectives
        objectives = []
        total_hours = 0
        
        for concept in concepts_to_learn:
            objective = self._create_learning_objective(concept, profile)
            objectives.append(objective)
            total_hours += objective.estimated_time_hours
        
        # Adjust based on user's pace preference
        pace_multiplier = {"slow": 1.5, "normal": 1.0, "fast": 0.7}[profile.pace_preference]
        total_hours *= pace_multiplier
        
        return PersonalizedLearningPath(
            id=f"path_{profile.user_id}_{datetime.now().timestamp()}",
            user_id=profile.user_id,
            title=f"Personalized Path to {', '.join(target_skills)}",
            description=f"Customized learning journey based on your {profile.learning_style.value} learning style",
            objectives=objectives,
            estimated_completion_hours=total_hours,
            created_at=datetime.now(),
            last_updated=datetime.now()
        )
    
    def _get_prerequisite_chain(self, target_skills: List[str]) -> List[str]:
        """Get ordered list of concepts including all prerequisites"""
        visited = set()
        result = []
        
        def dfs(concept: str):
            if concept in visited:
                return
            visited.add(concept)
            
            # Find prerequisites
            for category in self.knowledge_graph.values():
                if concept in category:
                    for prereq in category[concept]:
                        dfs(prereq)
            
            result.append(concept)
        
        for skill in target_skills:
            dfs(skill)
        
        return result
    
    def _create_learning_objective(self, concept: str, profile: UserLearningProfile) -> LearningObjective:
        """Create a learning objective tailored to user's profile"""
        
        # Base time estimates (in hours)
        time_estimates = {
            "variables": 2, "data_types": 3, "operators": 2, "control_flow": 4,
            "functions": 6, "arrays": 5, "objects": 8, "algorithms": 12,
            "data_structures": 10, "recursion": 8, "oop": 15, "error_handling": 4,
            "file_handling": 6, "design_patterns": 20, "system_design": 25,
            "databases": 15, "api_development": 18, "testing": 12, "performance_optimization": 16
        }
        
        base_time = time_estimates.get(concept, 6)
        
        # Adjust based on cognitive load capacity
        adjusted_time = base_time / profile.cognitive_load_capacity
        
        return LearningObjective(
            id=f"obj_{concept}_{profile.user_id}",
            title=f"Master {concept.replace('_', ' ').title()}",
            description=f"Learn {concept} concepts and apply them in practical exercises",
            category=self._get_concept_category(concept),
            prerequisites=self._get_direct_prerequisites(concept),
            estimated_time_hours=adjusted_time,
            difficulty_level=self._determine_concept_difficulty(concept),
            skills_taught=[concept]
        )
    
    def _get_concept_category(self, concept: str) -> str:
        """Get the category of a concept"""
        for category, concepts in self.knowledge_graph.items():
            if concept in concepts:
                return category
        return "general"
    
    def _get_direct_prerequisites(self, concept: str) -> List[str]:
        """Get direct prerequisites for a concept"""
        for category in self.knowledge_graph.values():
            if concept in category:
                return category[concept]
        return []
    
    def _determine_concept_difficulty(self, concept: str) -> DifficultyLevel:
        """Determine difficulty level based on concept complexity"""
        difficulty_mapping = {
            "fundamentals": DifficultyLevel.BEGINNER,
            "intermediate": DifficultyLevel.INTERMEDIATE,
            "advanced": DifficultyLevel.ADVANCED
        }
        
        category = self._get_concept_category(concept)
        return difficulty_mapping.get(category, DifficultyLevel.INTERMEDIATE)
    
    def generate_adaptive_recommendations(self, profile: UserLearningProfile,
                                        recent_sessions: List[LearningSession]) -> List[AdaptiveRecommendation]:
        """Generate personalized recommendations based on learning patterns"""
        recommendations = []
        
        # Analyze performance patterns
        if recent_sessions:
            avg_performance = np.mean([s.performance_score for s in recent_sessions if s.performance_score])
            avg_engagement = np.mean([s.engagement_score for s in recent_sessions if s.engagement_score])
            
            # Recommend difficulty adjustment
            if avg_performance < 0.6:
                recommendations.append(AdaptiveRecommendation(
                    user_id=profile.user_id,
                    recommendation_type="difficulty",
                    title="Reduce Difficulty Level",
                    description="Consider reviewing fundamentals before proceeding",
                    reasoning=f"Recent performance average: {avg_performance:.2f} is below target",
                    priority=4,
                    created_at=datetime.now()
                ))
            
            # Recommend engagement improvements
            if avg_engagement < 0.7:
                content_type = "visual" if profile.learning_style == LearningStyle.VISUAL else "interactive"
                recommendations.append(AdaptiveRecommendation(
                    user_id=profile.user_id,
                    recommendation_type="learning_style",
                    title=f"Try {content_type.title()} Content",
                    description=f"Switch to {content_type} learning materials to improve engagement",
                    reasoning=f"Current engagement: {avg_engagement:.2f}, learning style: {profile.learning_style.value}",
                    priority=3,
                    created_at=datetime.now()
                ))
        
        # Recommend based on weak areas
        for weak_area in profile.weak_areas[:3]:  # Top 3 weak areas
            recommendations.append(AdaptiveRecommendation(
                user_id=profile.user_id,
                recommendation_type="content",
                title=f"Practice {weak_area.replace('_', ' ').title()}",
                description=f"Additional exercises and examples for {weak_area}",
                reasoning=f"Identified as weak area in skill assessment",
                content_id=weak_area,
                priority=5,
                created_at=datetime.now()
            ))
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def calculate_optimal_session_length(self, profile: UserLearningProfile) -> int:
        """Calculate optimal session length in minutes based on cognitive load"""
        base_length = 30  # minutes
        
        # Adjust based on cognitive capacity and learning style
        capacity_factor = profile.cognitive_load_capacity
        style_factor = {
            LearningStyle.VISUAL: 1.1,
            LearningStyle.AUDITORY: 0.9,
            LearningStyle.KINESTHETIC: 1.2,
            LearningStyle.READ_WRITE: 1.0
        }[profile.learning_style]
        
        optimal_length = base_length * capacity_factor * style_factor
        
        return max(15, min(60, int(optimal_length)))  # Between 15-60 minutes
    
    def predict_learning_outcome(self, profile: UserLearningProfile, 
                               objective: LearningObjective) -> Dict[str, float]:
        """Predict learning outcome probabilities for an objective"""
        
        # Get mastery scores for prerequisites
        prereq_scores = []
        for prereq in objective.prerequisites:
            mastery = profile.concept_masteries.get(prereq)
            if mastery:
                prereq_scores.append(mastery.confidence_score)
            else:
                prereq_scores.append(0.0)
        
        prereq_readiness = np.mean(prereq_scores) if prereq_scores else 0.5
        
        # Factor in difficulty vs preference
        difficulty_match = 1.0 - abs(
            self.difficulty_weights[objective.difficulty_level] - 
            self.difficulty_weights[profile.preferred_difficulty]
        )
        
        # Calculate success probability
        success_prob = (
            prereq_readiness * 0.4 +
            difficulty_match * 0.3 +
            profile.cognitive_load_capacity * 0.3
        )
        
        # Time factor based on estimated vs typical completion
        time_factor = objective.estimated_time_hours / (profile.total_study_time_hours / 10 + 1)
        completion_prob = max(0.1, min(0.95, success_prob * (1 - time_factor * 0.1)))
        
        return {
            "success_probability": success_prob,
            "completion_probability": completion_prob,
            "estimated_effort": time_factor,
            "prerequisite_readiness": prereq_readiness
        } 