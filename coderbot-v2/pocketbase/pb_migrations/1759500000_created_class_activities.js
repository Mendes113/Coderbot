/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && (@request.auth.role = \"teacher\" || @request.auth.role = \"admin\")",
    "deleteRule": "@request.auth.id != \"\" && (teacher = @request.auth.id || @request.auth.role = \"admin\")",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_activity_id",
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
        "max": 200,
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
        "id": "sel_activity_type",
        "maxSelect": 1,
        "name": "activity_type",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "quiz",
          "survey",
          "form",
          "poll"
        ]
      },
      {
        "hidden": false,
        "id": "json_survey_json",
        "name": "survey_json",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "number_reward_points",
        "name": "reward_points",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number_max_attempts",
        "name": "max_attempts",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number_time_limit",
        "name": "time_limit",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "sel_visibility",
        "maxSelect": 1,
        "name": "visibility",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "public",
          "private",
          "draft"
        ]
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
          "archived",
          "draft"
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
    "id": "pbc_class_activities",
    "indexes": [
      "CREATE INDEX `idx_class_activities_class` ON `class_activities` (`class`)",
      "CREATE INDEX `idx_class_activities_status` ON `class_activities` (`status`)",
      "CREATE INDEX `idx_class_activities_type` ON `class_activities` (`activity_type`)"
    ],
    "listRule": "@request.auth.id != \"\" && (class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\" || (@collection.class_members.user.id ?= @request.auth.id && @collection.class_members.class.id ?= class))",
    "name": "class_activities",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (teacher = @request.auth.id || @request.auth.role = \"admin\")",
    "viewRule": "@request.auth.id != \"\" && (class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\" || (@collection.class_members.user.id ?= @request.auth.id && @collection.class_members.class.id ?= class))"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_class_activities");
  return app.delete(collection);
})
