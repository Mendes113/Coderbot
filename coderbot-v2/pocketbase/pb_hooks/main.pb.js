/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase Hooks - Notification Cleanup Job
 * 
 * This file implements automated cleanup jobs for the CoderBot v2 system.
 * Jobs are scheduled using cronAdd() and run in the background.
 * 
 * Current Jobs:
 * - Notification Cleanup: Runs every 2 weeks (Sunday at 3:00 AM), removes read notifications older than 30 days
 */

// Notification Cleanup Job
// Runs every 2 weeks on Sunday at 3:00 AM
// Cron format: minute hour day-of-month month day-of-week
// "0 3 * * 0/2" = At 3:00 AM on Sunday every 2 weeks
cronAdd("notification-cleanup", "0 3 * * 0", () => {
  const startTime = Date.now();
  let deletedCount = 0;
  let status = "success";
  let details = "";

  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    console.log(`[Cleanup Job] Starting notification cleanup...`);
    console.log(`[Cleanup Job] Removing read notifications older than ${cutoffDate}`);

    // Find all read notifications older than 30 days
    const oldNotifications = $app.findRecordsByFilter(
      "notifications",
      `read = true && created < "${cutoffDate}"`,
      null, // sort
      500,  // limit - process in batches of 500
      0     // offset
    );

    deletedCount = oldNotifications.length;

    // Delete old notifications
    oldNotifications.forEach((notification) => {
      try {
        $app.delete(notification);
      } catch (deleteError) {
        console.log(`[Cleanup Job] Error deleting notification ${notification.id}: ${deleteError}`);
      }
    });

    console.log(`[Cleanup Job] Successfully deleted ${deletedCount} old notifications`);
    details = `Deleted ${deletedCount} read notifications older than 30 days`;

  } catch (error) {
    status = "error";
    details = `Error during cleanup: ${error}`;
    console.log(`[Cleanup Job] Error: ${error}`);
  }

  const executionTime = Date.now() - startTime;

  // Log the cleanup execution
  try {
    const logRecord = new Record($app.findCollectionByNameOrId("cleanup_log"));
    logRecord.set("job_type", "notification_cleanup");
    logRecord.set("records_deleted", deletedCount);
    logRecord.set("execution_time_ms", executionTime);
    logRecord.set("status", status);
    logRecord.set("details", details);
    $app.save(logRecord);

    console.log(`[Cleanup Job] Execution logged: ${executionTime}ms`);
  } catch (logError) {
    console.log(`[Cleanup Job] Could not save log: ${logError}`);
  }
});

console.log("✓ Notification cleanup job registered (runs every 2 weeks on Sunday at 3:00 AM)");

// Optional: Add hook to prevent notification accumulation on user actions
onRecordAfterCreateSuccess((e) => {
  // When a user marks all notifications as read, we can clean up old ones immediately
  if (e.record.collection().name === "notifications" && e.record.get("read") === true) {
    // Check if this user has too many read notifications (>100)
    const userReadNotifications = $app.findRecordsByFilter(
      "notifications",
      `user = "${e.record.get("user")}" && read = true`,
      "-created",
      101, // Get one more than limit to check if cleanup is needed
      0
    );

    if (userReadNotifications.length > 100) {
      // Keep only the 50 most recent, delete the rest
      const toDelete = userReadNotifications.slice(50);
      console.log(`[Auto Cleanup] User ${e.record.get("user")} has ${userReadNotifications.length} read notifications, cleaning up...`);
      
      toDelete.forEach((notification) => {
        try {
          $app.delete(notification);
        } catch (deleteError) {
          console.log(`[Auto Cleanup] Error deleting notification: ${deleteError}`);
        }
      });

      console.log(`[Auto Cleanup] Removed ${toDelete.length} old notifications for user`);
    }
  }
}, "notifications");

console.log("✓ Auto cleanup hook registered for notifications");

// Export for testing (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    cronJobRegistered: true
  };
}
