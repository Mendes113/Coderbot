/// <reference path="../pb_data/types.d.ts" />

/**
 * Sprint 1 - Migration 3: Add Notification Cleanup Job
 * 
 * This migration adds a cleanup hook that automatically removes old read notifications
 * to prevent database bloat over time. The job runs on a schedule and removes read
 * notifications older than 30 days.
 * 
 * Benefits:
 * - Prevents notification table from growing indefinitely
 * - Improves query performance on notifications
 * - Reduces database size over time
 * - Maintains recent notification history for users
 * 
 * Schedule: Runs every 2 weeks on Sunday at 3:00 AM
 * Retention: Keeps read notifications for 30 days
 */

migrate((db) => {
  console.log('Setting up notification cleanup job...');

  // Add a custom field to track last cleanup
  const notificationsCollection = db.findCollectionByNameOrId('notifications');
  
  if (notificationsCollection) {
    console.log('✓ Notifications collection found');
    console.log('✓ Cleanup job will be configured in PocketBase hooks');
    console.log('Note: The actual cleanup job is implemented in main.pb.js');
  } else {
    throw new Error('Notifications collection not found!');
  }

  // Create a system collection to track cleanup jobs
  const cleanupLog = new Collection({
    id: "cleanup_log_id",
    name: "cleanup_log",
    type: "base",
    system: false,
    schema: [
      {
        id: "job_type",
        name: "job_type",
        type: "text",
        required: true,
        options: {
          min: 1,
          max: 50
        }
      },
      {
        id: "records_deleted",
        name: "records_deleted",
        type: "number",
        required: true,
        options: {
          min: 0
        }
      },
      {
        id: "execution_time_ms",
        name: "execution_time_ms",
        type: "number",
        required: true,
        options: {
          min: 0
        }
      },
      {
        id: "status",
        name: "status",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["success", "error", "warning"]
        }
      },
      {
        id: "details",
        name: "details",
        type: "text",
        required: false,
        options: {
          min: 0,
          max: 1000
        }
      }
    ],
    indexes: [
      "CREATE INDEX idx_cleanup_log_job_type ON cleanup_log (job_type)",
      "CREATE INDEX idx_cleanup_log_created ON cleanup_log (created DESC)"
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: null,
    updateRule: null,
    deleteRule: null
  });

  db.saveCollection(cleanupLog);
  console.log('✓ Cleanup log collection created');

  console.log('Notification cleanup job configured successfully! ✨');
  console.log('');
  console.log('Next steps:');
  console.log('1. The cleanup job is implemented in pb_hooks/main.pb.js');
  console.log('2. Job runs every 2 weeks on Sunday at 3:00 AM');
  console.log('3. Removes read notifications older than 30 days');
  console.log('4. Logs execution details in cleanup_log collection');

}, (db) => {
  // Rollback: Remove cleanup log collection
  console.log('Removing notification cleanup configuration...');
  
  try {
    db.deleteCollection('cleanup_log');
    console.log('Cleanup log collection removed.');
  } catch (e) {
    console.log('Could not remove cleanup_log collection: ' + e);
  }
});
