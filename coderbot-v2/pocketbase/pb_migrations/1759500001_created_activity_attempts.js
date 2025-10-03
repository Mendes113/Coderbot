/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && student = @request.auth.id",
    "deleteRule": "@request.auth.id != \"\" && (student = @request.auth.id || @request.auth.role = \"admin\")",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_attempt_id",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_class_activities",
        "hidden": false,
        "id": "rel_activity",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "activity",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "rel_student",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "student",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "json_answers",
        "name": "answers",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "number_score",
        "name": "score",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number_max_score",
        "name": "max_score",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number_time_spent",
        "name": "time_spent",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "sel_status",
        "maxSelect": 1,
        "name": "status",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "in_progress",
          "completed",
          "abandoned"
        ]
      },
      {
        "hidden": false,
        "id": "date_started_at",
        "name": "started_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "date_completed_at",
        "name": "completed_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "json_metadata",
        "name": "metadata",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "autodate_created",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate_updated",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_activity_attempts",
    "indexes": [
      "CREATE INDEX `idx_activity_attempts_activity` ON `activity_attempts` (`activity`)",
      "CREATE INDEX `idx_activity_attempts_student` ON `activity_attempts` (`student`)",
      "CREATE INDEX `idx_activity_attempts_status` ON `activity_attempts` (`status`)",
      "CREATE UNIQUE INDEX `idx_activity_attempts_unique` ON `activity_attempts` (`activity`, `student`, `created`)"
    ],
    "listRule": "@request.auth.id != \"\" && (student = @request.auth.id || activity.teacher = @request.auth.id || @request.auth.role = \"admin\")",
    "name": "activity_attempts",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && student = @request.auth.id",
    "viewRule": "@request.auth.id != \"\" && (student = @request.auth.id || activity.teacher = @request.auth.id || @request.auth.role = \"admin\")"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_activity_attempts");
  return app.delete(collection);
})
