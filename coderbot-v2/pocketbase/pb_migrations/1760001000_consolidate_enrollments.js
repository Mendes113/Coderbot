/// <reference path="../pb_data/types.d.ts" />

/**
 * Sprint 1 - Migration 1: Consolidate class_enrollments into class_members
 * 
 * This migration consolidates the redundant class_enrollments and class_members tables
 * by migrating all enrollment data to class_members and removing class_enrollments.
 * 
 * Benefits:
 * - Eliminates data redundancy
 * - Single source of truth for class membership
 * - Simplifies queries and reduces JOIN complexity
 * - Prevents data inconsistency between the two tables
 */

migrate((db) => {
  // Step 1: Check if we need to migrate data from class_enrollments to class_members
  // Only migrate records that don't already exist in class_members
  const enrollmentsExist = db.queryFirstRow(`
    SELECT COUNT(*) as count FROM _collections WHERE name = 'class_enrollments'
  `);

  if (enrollmentsExist && enrollmentsExist.count > 0) {
    console.log('Migrating class_enrollments to class_members...');

    // Migrate enrollment data to class_members (only non-duplicate records)
    db.execute(`
      INSERT INTO class_members (
        id, 
        created, 
        updated, 
        class, 
        user, 
        role, 
        status, 
        joined_at
      )
      SELECT 
        e.id,
        e.created,
        e.updated,
        e.class,
        e.user,
        COALESCE(e.role, 'student') as role,
        COALESCE(e.status, 'active') as status,
        e.created as joined_at
      FROM class_enrollments e
      WHERE NOT EXISTS (
        SELECT 1 FROM class_members m 
        WHERE m.class = e.class AND m.user = e.user
      )
    `);

    console.log('Migration completed. Dropping class_enrollments table...');

    // Step 2: Drop the class_enrollments collection
    db.deleteCollection('class_enrollments');
    
    console.log('class_enrollments table removed successfully.');
  } else {
    console.log('class_enrollments table not found or already migrated.');
  }

  // Step 3: Ensure class_members has proper indexes for performance
  db.execute(`
    CREATE INDEX IF NOT EXISTS idx_class_members_class 
    ON class_members (class);
  `);
  
  db.execute(`
    CREATE INDEX IF NOT EXISTS idx_class_members_user 
    ON class_members (user);
  `);
  
  db.execute(`
    CREATE INDEX IF NOT EXISTS idx_class_members_class_user 
    ON class_members (class, user);
  `);

  console.log('Performance indexes added to class_members.');

}, (db) => {
  // Rollback: Recreate class_enrollments collection if needed
  // Note: This is a destructive migration, rollback may not fully restore original state
  
  console.log('WARNING: Rolling back enrollment consolidation.');
  console.log('Note: Original class_enrollments data cannot be fully restored.');
  
  // Recreate class_enrollments collection structure
  const collection = new Collection({
    id: "class_enrollments_id",
    name: "class_enrollments",
    type: "base",
    system: false,
    schema: [
      {
        id: "class_field",
        name: "class",
        type: "relation",
        required: true,
        options: {
          collectionId: "classes",
          cascadeDelete: false,
          minSelect: null,
          maxSelect: 1,
          displayFields: []
        }
      },
      {
        id: "user_field",
        name: "user",
        type: "relation",
        required: true,
        options: {
          collectionId: "_pb_users_auth_",
          cascadeDelete: false,
          minSelect: null,
          maxSelect: 1,
          displayFields: []
        }
      },
      {
        id: "role_field",
        name: "role",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["teacher", "student", "assistant"]
        }
      },
      {
        id: "status_field",
        name: "status",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["active", "inactive", "pending"]
        }
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_class_enrollments_unique ON class_enrollments (class, user)"
    ]
  });

  db.saveCollection(collection);
  
  console.log('class_enrollments collection recreated (empty).');
});
