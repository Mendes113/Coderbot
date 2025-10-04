/// <reference path="../pb_data/types.d.ts" />

/**
 * Sprint 1 - Migration 1: Consolidate class_enrollments into class_members
 * 
 * This migration consolidates the redundant class_enrollments and class_members tables
 * by migrating all enrollment data to class_members and removing class_enrollments.
 */

migrate((app) => {
  // Step 1: Check if class_enrollments collection exists
  let enrollmentsCollection;
  try {
    enrollmentsCollection = app.findCollectionByNameOrId('class_enrollments');
  } catch (e) {
    console.log('class_enrollments collection not found, skipping migration.');
    return;
  }

  if (enrollmentsCollection) {
    console.log('Migrating class_enrollments to class_members...');

    // Step 2: Migrate enrollment data using SQL
    try {
      // Check if there are records to migrate
      const result = arrayOf(app.db().select("SELECT COUNT(*) as count FROM class_enrollments"));
      const count = result.length > 0 ? result[0].count : 0;
      
      if (count > 0) {
        console.log(`Found ${count} enrollment records to migrate.`);
        
        // Migrate data
        app.db().newQuery(`
          INSERT INTO class_members (
            id, created, updated, class, user, role, status, joined_at
          )
          SELECT 
            e.id, e.created, e.updated, e.class, e.user,
            COALESCE(e.role, 'student') as role,
            COALESCE(e.status, 'active') as status,
            e.created as joined_at
          FROM class_enrollments e
          WHERE NOT EXISTS (
            SELECT 1 FROM class_members m 
            WHERE m.class = e.class AND m.user = e.user
          )
        `).execute();
        
        console.log('Enrollment data migrated successfully.');
      } else {
        console.log('No enrollment records found to migrate.');
      }
    } catch (migrateError) {
      console.log('Migration error: ' + migrateError);
    }

    // Step 3: Drop the class_enrollments collection
    console.log('Dropping class_enrollments collection...');
    try {
      app.delete(enrollmentsCollection);
      console.log('class_enrollments collection removed successfully.');
    } catch (deleteError) {
      console.log('Error deleting collection: ' + deleteError);
    }
  }

  // Step 4: Create indexes for class_members
  try {
    app.db().newQuery("CREATE INDEX IF NOT EXISTS idx_class_members_class ON class_members (class)").execute();
    app.db().newQuery("CREATE INDEX IF NOT EXISTS idx_class_members_user ON class_members (user)").execute();
    app.db().newQuery("CREATE INDEX IF NOT EXISTS idx_class_members_class_user ON class_members (class, user)").execute();
    console.log('Performance indexes added to class_members.');
  } catch (indexError) {
    console.log('Error creating indexes: ' + indexError);
  }

}, (app) => {
  // Rollback: Recreate class_enrollments collection
  console.log('WARNING: Rolling back enrollment consolidation.');
  
  const classesCollection = app.findCollectionByNameOrId("classes");
  
  const collection = new Collection({
    name: "class_enrollments",
    type: "base",
    system: false,
    fields: [
      { name: "class", type: "relation", required: true, options: { collectionId: classesCollection.id, cascadeDelete: false, maxSelect: 1 }},
      { name: "user", type: "relation", required: true, options: { collectionId: "_pb_users_auth_", cascadeDelete: false, maxSelect: 1 }},
      { name: "role", type: "select", required: true, options: { maxSelect: 1, values: ["teacher", "student", "assistant"] }},
      { name: "status", type: "select", required: true, options: { maxSelect: 1, values: ["active", "inactive", "pending"] }}
    ],
    indexes: ["CREATE UNIQUE INDEX idx_class_enrollments_unique ON class_enrollments (class, user)"]
  });

  try {
    app.save(collection);
    console.log('class_enrollments collection recreated (empty).');
  } catch (e) {
    console.log('Error recreating collection: ' + e);
  }
});
