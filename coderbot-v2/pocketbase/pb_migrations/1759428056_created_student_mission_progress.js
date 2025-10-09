/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && (@request.auth.role = \"student\" || @request.auth.role = \"admin\")",
    "deleteRule": "@request.auth.id != \"\" && (student = @request.auth.id || @request.auth.role = \"admin\")",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_progress_id",
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
        "cascadeDelete": false,
        "collectionId": "pbc_class_missions",
        "hidden": false,
        "id": "rel_mission",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "mission",
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
        "id": "number_current_value",
        "name": "current_value",
        "presentable": true,
        "required": true,
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
          "failed"
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
    "id": "pbc_student_mission_progress",
    "indexes": [
      "CREATE INDEX `idx_student_mission_progress_mission` ON `student_mission_progress` (`mission`)",
      "CREATE INDEX `idx_student_mission_progress_student` ON `student_mission_progress` (`student`)",
      "CREATE INDEX `idx_student_mission_progress_status` ON `student_mission_progress` (`status`)",
      "CREATE UNIQUE INDEX `idx_unique_student_mission` ON `student_mission_progress` (`mission`, `student`)"
    ],
    "listRule": "@request.auth.id != \"\" && (student = @request.auth.id || @request.auth.role = \"admin\" || (@request.auth.role = \"teacher\" && mission.class.createdBy ?= @request.auth.id))",
    "name": "student_mission_progress",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (student = @request.auth.id || @request.auth.role = \"admin\")",
    "viewRule": "@request.auth.id != \"\" && (student = @request.auth.id || @request.auth.role = \"admin\" || (@request.auth.role = \"teacher\" && mission.class.createdBy ?= @request.auth.id))"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_student_mission_progress");
  return app.delete(collection);
})









