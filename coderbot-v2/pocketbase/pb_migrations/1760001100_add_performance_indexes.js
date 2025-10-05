/// <reference path="../pb_data/types.d.ts" />

/**
 * Sprint 1 - Migration 2: Add Performance Indexes
 * 
 * This migration adds critical indexes to improve query performance across
 * frequently accessed collections.
 */

migrate((app) => {
  console.log('Adding performance indexes...');
  
  const indexes = [
    // FORUM INDEXES
    "CREATE INDEX IF NOT EXISTS idx_forum_posts_class ON class_forum_posts (class)",
    "CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON class_forum_posts (author)",
    "CREATE INDEX IF NOT EXISTS idx_forum_posts_class_created ON class_forum_posts (class, created DESC)",
    "CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON class_forum_comments (post)",
    "CREATE INDEX IF NOT EXISTS idx_forum_comments_author ON class_forum_comments (author)",
    
    // CHAT INDEXES
    "CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages (session)",
    "CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages (session, created ASC)",
    "CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions (user)",
    "CREATE INDEX IF NOT EXISTS idx_chat_sessions_class ON chat_sessions (class)",
    
    // NOTIFICATION INDEXES
    "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user)",
    "CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user, read)",
    "CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user, created DESC)",
    "CREATE INDEX IF NOT EXISTS idx_notifications_read_created ON notifications (read, created)",
    
    // GAMIFICATION INDEXES
    "CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements (user)",
    "CREATE INDEX IF NOT EXISTS idx_easter_egg_progress_user ON user_easter_egg_progress (user)",
    "CREATE INDEX IF NOT EXISTS idx_mission_progress_student ON student_mission_progress (student)",
    "CREATE INDEX IF NOT EXISTS idx_mission_progress_mission ON student_mission_progress (mission)",
    "CREATE INDEX IF NOT EXISTS idx_mission_progress_student_status ON student_mission_progress (student, status)",
    
    // EXERCISE INDEXES
    "CREATE INDEX IF NOT EXISTS idx_exercises_class ON exercises (class)",
    "CREATE INDEX IF NOT EXISTS idx_feedbacks_exercise ON feedbacks (exercise)",
    "CREATE INDEX IF NOT EXISTS idx_feedbacks_student ON feedbacks (student)",
    
    // ADAPTIVE LEARNING INDEXES
    "CREATE INDEX IF NOT EXISTS idx_learning_sessions_user ON learning_sessions (user)",
    "CREATE INDEX IF NOT EXISTS idx_assessment_responses_user ON assessment_responses (user)",
    "CREATE INDEX IF NOT EXISTS idx_user_analytics_user ON user_analytics (user)",
    
    // CLASS INDEXES
    "CREATE INDEX IF NOT EXISTS idx_class_events_class ON class_events (class)",
    "CREATE INDEX IF NOT EXISTS idx_class_events_class_date ON class_events (class, date)",
    "CREATE INDEX IF NOT EXISTS idx_flashcards_class ON flashcards (class)"
  ];

  let createdCount = 0;
  let errorCount = 0;

  indexes.forEach((indexSQL, i) => {
    try {
      app.db().newQuery(indexSQL).execute();
      createdCount++;
    } catch (e) {
      errorCount++;
      // Silent skip - table might not exist yet
    }
  });

  console.log(`✓ Created ${createdCount} indexes (${errorCount} skipped)`);

}, (app) => {
  // Rollback: Drop all created indexes
  console.log('Removing performance indexes...');

  const indexes = [
    'idx_forum_posts_class', 'idx_forum_posts_author', 'idx_forum_posts_class_created',
    'idx_forum_comments_post', 'idx_forum_comments_author', 'idx_chat_messages_session',
    'idx_chat_messages_session_created', 'idx_chat_sessions_user', 'idx_chat_sessions_class',
    'idx_notifications_user', 'idx_notifications_user_read', 'idx_notifications_user_created',
    'idx_notifications_read_created', 'idx_user_achievements_user', 'idx_easter_egg_progress_user',
    'idx_mission_progress_student', 'idx_mission_progress_mission', 'idx_mission_progress_student_status',
    'idx_exercises_class', 'idx_feedbacks_exercise', 'idx_feedbacks_student',
    'idx_learning_sessions_user', 'idx_assessment_responses_user', 'idx_user_analytics_user',
    'idx_class_events_class', 'idx_class_events_class_date', 'idx_flashcards_class'
  ];

  indexes.forEach(indexName => {
    try {
      app.db().newQuery(`DROP INDEX IF EXISTS ${indexName}`).execute();
    } catch (e) {
      // Silent
    }
  });

  console.log('Performance indexes removed.');
});
