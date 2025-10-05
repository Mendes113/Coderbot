/// <reference path="../pb_data/types.d.ts" />

/**
 * Sprint 1 - Migration 3: Add Notification Cleanup Job
 * 
 * This migration adds a cleanup_log collection to track cleanup job executions.
 * The actual cleanup job is implemented in pb_hooks/main.pb.js
 */

migrate((app) => {
  console.log('Setting up notification cleanup job...');

  // Check if notifications collection exists
  const notificationsCollection = app.findCollectionByNameOrId('notifications');
  
  if (notificationsCollection) {
    console.log('✓ Notifications collection found');
    console.log('✓ Cleanup job will be configured in PocketBase hooks');
  } else {
    throw new Error('Notifications collection not found!');
  }

  // Create cleanup_log collection
  const cleanupLog = new Collection({
    name: "cleanup_log",
    type: "base",
    system: false,
    fields: [
      { 
        hidden: false,
        id: "text_job_type",
        max: 50,
        min: 1,
        name: "job_type", 
        pattern: "",
        presentable: false,
        primaryKey: false,
        required: true,
        system: false, 
        type: "text"
      },
      { 
        hidden: false,
        id: "number_records_deleted",
        max: null,
        min: 0,
        name: "records_deleted",
        onlyInt: true,
        presentable: false,
        required: true,
        system: false, 
        type: "number"
      },
      { 
        hidden: false,
        id: "number_execution_time_ms",
        max: null,
        min: 0,
        name: "execution_time_ms",
        onlyInt: true,
        presentable: false,
        required: true,
        system: false, 
        type: "number"
      },
      { 
        hidden: false,
        id: "select_status",
        maxSelect: 1,
        name: "status", 
        presentable: false,
        required: true,
        system: false,
        type: "select",
        values: ["success", "error", "warning"]
      },
      { 
        hidden: false,
        id: "text_details",
        max: null,
        min: null,
        name: "details", 
        pattern: "",
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: "text"
      }
    ],
    indexes: [],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''"
  });

  app.save(cleanupLog);
  console.log('✓ Cleanup log collection created');
  console.log('Note: Cleanup job runs every 2 weeks (Sunday at 3:00 AM)');

}, (app) => {
  // Rollback: Remove cleanup log collection
  console.log('Removing notification cleanup configuration...');
  
  try {
    const cleanupLogCollection = app.findCollectionByNameOrId('cleanup_log');
    app.delete(cleanupLogCollection);
    console.log('Cleanup log collection removed.');
  } catch (e) {
    console.log('Could not remove cleanup_log collection: ' + e);
  }
});
