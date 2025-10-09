/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && (@request.auth.role = \"teacher\" || @request.auth.role = \"admin\")",
    "deleteRule": "@request.auth.id != \"\" && (teacher = @request.auth.id || @request.auth.role = \"admin\")",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_mission_id",
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_title",
        "max": 120,
        "min": 1,
        "name": "title",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "editor_description",
        "name": "description",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "editor"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2478702895",
        "hidden": false,
        "id": "rel_class",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "class",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "rel_teacher",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "teacher",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "sel_mission_type",
        "maxSelect": 1,
        "name": "type",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "chat_interaction",
          "code_execution",
          "exercise_completion",
          "notes_creation",
          "custom"
        ]
      },
      {
        "hidden": false,
        "id": "number_target_value",
        "name": "target_value",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number_reward_points",
        "name": "reward_points",
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
          "active",
          "completed",
          "expired",
          "paused"
        ]
      },
      {
        "hidden": false,
        "id": "date_starts_at",
        "name": "starts_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "date_ends_at",
        "name": "ends_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "number_max_participants",
        "name": "max_participants",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number_current_progress",
        "name": "current_progress",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
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
    "id": "pbc_class_missions",
    "indexes": [
      "CREATE INDEX `idx_class_missions_class` ON `class_missions` (`class`)",
      "CREATE INDEX `idx_class_missions_status` ON `class_missions` (`status`)",
      "CREATE INDEX `idx_class_missions_type` ON `class_missions` (`type`)"
    ],
    "listRule": "@request.auth.id != \"\" && (class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\" || (@collection.class_members.user.id ?= @request.auth.id && @collection.class_members.class.id ?= class))",
    "name": "class_missions",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (teacher = @request.auth.id || @request.auth.role = \"admin\")",
    "viewRule": "@request.auth.id != \"\" && (class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\" || (@collection.class_members.user.id ?= @request.auth.id && @collection.class_members.class.id ?= class))"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_class_missions");
  return app.delete(collection);
})









