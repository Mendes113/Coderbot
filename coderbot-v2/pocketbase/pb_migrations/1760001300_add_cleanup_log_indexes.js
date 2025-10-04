/// <reference path="../pb_data/types.d.ts" />

/**
 * Sprint 1 - Migration 4: Add Cleanup Log Indexes
 * 
 * This migration adds performance indexes to the cleanup_log collection.
 * These indexes are created in a separate migration to avoid column reference errors.
 */

migrate((app) => {
  console.log('Adding cleanup_log indexes...');

  const indexes = [
    "CREATE INDEX idx_cleanup_log_job_type ON cleanup_log (job_type)",
    "CREATE INDEX idx_cleanup_log_created ON cleanup_log (created DESC)"
  ];

  let created = 0;
  let skipped = 0;

  indexes.forEach(indexSQL => {
    try {
      app.db().newQuery(indexSQL).execute();
      created++;
    } catch (error) {
      // Index already exists or table doesn't exist yet
      skipped++;
    }
  });

  console.log(`✓ Created ${created} cleanup_log indexes (${skipped} skipped)`);
}, (app) => {
  // Rollback - remove indexes
  console.log('Removing cleanup_log indexes...');
  
  try {
    app.db().newQuery("DROP INDEX IF EXISTS idx_cleanup_log_job_type").execute();
    app.db().newQuery("DROP INDEX IF EXISTS idx_cleanup_log_created").execute();
    console.log('✓ Cleanup log indexes removed');
  } catch (error) {
    console.error('Error removing cleanup_log indexes:', error);
  }
});
