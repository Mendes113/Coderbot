# PocketBase Migrations for Adaptive Learning System

This directory contains all the database migrations for the CoderBot v2 adaptive learning platform. The migrations implement comprehensive educational features including adaptive learning, analytics, and gamification.

## New Adaptive Learning Tables

The following migrations create the core tables for the adaptive learning system:

### Core Learning Tables

1. **`1748201100_created_user_learning_profiles.js`** - User Learning Profiles
   - Stores user learning preferences, styles, and progress
   - Fields: learning_style, pace_preference, preferred_difficulty, current_streak, total_study_time_hours, concept_masteries, learning_goals, weak_areas, strong_areas, cognitive_load_capacity
   - Security: User can only access their own profile

2. **`1748201200_created_learning_objectives.js`** - Learning Objectives
   - Defines educational objectives and learning goals
   - Fields: title, description, category, prerequisites, estimated_time_hours, difficulty_level, skills_taught
   - Security: Public read access

3. **`1748201300_created_learning_paths.js`** - Personalized Learning Paths
   - Stores AI-generated personalized learning journeys
   - Fields: user_id, title, description, objectives, current_position, estimated_completion_hours, actual_time_spent, completion_rate, adaptive_adjustments
   - Security: User can only access their own learning paths

### Assessment System

4. **`1748201400_created_assessment_questions.js`** - Assessment Questions
   - Repository of adaptive assessment questions
   - Fields: question_text, question_type, difficulty_level, concept_ids, correct_answer, options, explanation, hints, estimated_time_minutes
   - Question types: multiple_choice, code_completion, debugging, free_form

5. **`1748201500_created_adaptive_assessments.js`** - Adaptive Assessment Instances
   - Individual assessment sessions for users
   - Fields: user_id, title, concept_ids, questions, current_question_index, difficulty_adjustments, start_time, end_time
   - Security: User can only access their own assessments

6. **`1748201600_created_assessment_responses.js`** - Assessment Responses
   - User responses to assessment questions
   - Fields: user_id, assessment_id, question_id, user_answer, is_correct, time_taken_seconds, hints_used, confidence_level
   - Security: User can only access their own responses

### AI Recommendations & Analytics

7. **`1748201700_created_adaptive_recommendations.js`** - AI Recommendations
   - AI-generated personalized recommendations
   - Fields: user_id, recommendation_type, title, description, reasoning, content_id, priority, created_at, expires_at
   - Types: content, difficulty, pace, learning_style

8. **`1748201800_created_learning_sessions.js`** - Learning Session Tracking
   - Detailed tracking of user learning sessions
   - Fields: user_id, content_id, session_type, start_time, end_time, duration_minutes, interactions, performance_score, engagement_score, difficulty_rating, completed
   - Session types: lesson, practice, assessment, project

9. **`1748201900_created_skill_matrices.js`** - Skill Progression Matrices
   - Tracks user skill development across programming concepts
   - Fields: user_id, programming_concepts, problem_solving, debugging, code_quality, algorithmic_thinking, system_design, last_updated
   - Security: Unique per user

### Analytics & Gamification

10. **`1748202000_created_user_analytics.js`** - User Analytics
    - Comprehensive analytics data storage
    - Fields: user_id, overview, performance_metrics, engagement_patterns, skill_progression, predictions, recommendations, temporal_patterns, generated_at, expires_at
    - Security: User can only access their own analytics

11. **`1748202100_created_learning_streaks.js`** - Learning Streaks & Gamification
    - Tracks learning streaks and achievements
    - Fields: user_id, current_streak, longest_streak, last_activity_date, streak_start_date, total_active_days, activity_calendar, achievements, streak_milestones, motivational_message
    - Security: Unique per user

## Running the Migrations

### Prerequisites
- PocketBase 0.27.2 or higher
- Existing PocketBase instance with user authentication

### Apply Migrations
1. **Stop your PocketBase instance** if it's running
2. **Navigate to the PocketBase directory**:
   ```bash
   cd coderbot-v2/pocketbase_0.27.2_linux_amd64
   ```
3. **Start PocketBase** - it will automatically apply new migrations:
   ```bash
   ./pocketbase serve
   ```
4. **Verify migrations** in the admin panel at `http://localhost:8090/_/`

### Migration Order
The migrations are numbered and will be applied in chronological order:
1. User Learning Profiles (Core user data)
2. Learning Objectives (Educational content)
3. Learning Paths (Personalized journeys)
4. Assessment Questions (Question bank)
5. Adaptive Assessments (Assessment instances)
6. Assessment Responses (User answers)
7. Adaptive Recommendations (AI suggestions)
8. Learning Sessions (Activity tracking)
9. Skill Matrices (Skill progression)
10. User Analytics (Analytics data)
11. Learning Streaks (Gamification)

## Security Model

### Access Control Rules
- **User-owned data**: Users can only create, read, update, and delete their own records
- **Public content**: Learning objectives and assessment questions are publicly readable
- **Admin management**: Assessment questions and learning objectives managed by admins

### Key Security Features
- User ID validation in all CRUD operations
- Unique constraints on user profiles and skill matrices
- Proper cascading relationships between related tables
- Separation of user data from public educational content

## Database Relationships

```
users (PocketBase auth)
├── user_learning_profiles (1:1)
├── learning_paths (1:many)
├── adaptive_assessments (1:many)
├── assessment_responses (1:many)
├── adaptive_recommendations (1:many)
├── learning_sessions (1:many)
├── skill_matrices (1:1)
├── user_analytics (1:many)
└── learning_streaks (1:1)

learning_objectives (standalone)
assessment_questions (standalone)
```

## API Integration

These tables integrate with:
- **Backend Services**: `adaptive_learning_service.py`, `analytics_service.py`, `pocketbase_service.py`
- **API Routers**: `adaptive_learning_router.py`, `analytics_router.py`
- **Frontend Components**: User profile, learning dashboard, analytics dashboard

## Data Types & Validation

- **Enums**: Learning styles, difficulty levels, skill levels, session types
- **JSON Fields**: Complex data structures for flexibility
- **Number Constraints**: Proper min/max validation for scores and ratings
- **Date Fields**: Timestamps for activity tracking
- **Unique Indexes**: Prevent duplicate user profiles and skill matrices

## Backup & Recovery

Before applying migrations in production:
1. **Backup your database**: `cp -r pb_data pb_data_backup`
2. **Test migrations** in development environment first
3. **Monitor logs** during migration application
4. **Verify data integrity** after migration completion

## Troubleshooting

### Common Issues
- **Collection ID conflicts**: Each migration uses unique collection IDs
- **Field ID conflicts**: All field IDs are unique within each collection
- **Permission errors**: Ensure PocketBase has write permissions to pb_data directory

### Rollback Process
If you need to rollback:
1. Stop PocketBase
2. Restore from backup: `rm -rf pb_data && cp -r pb_data_backup pb_data`
3. Restart PocketBase

## Development Notes

- **Collection IDs**: Use format `pbc_2478702896` through `pbc_2478702906`
- **Field IDs**: Sequential numbering for consistency
- **Migration naming**: Timestamp format `YYYYMMDDHHII_action_table.js`
- **Index usage**: Strategic indexes for performance optimization

This migration set transforms the basic educational platform into a comprehensive adaptive learning system with AI-powered personalization, detailed analytics, and gamification features. 